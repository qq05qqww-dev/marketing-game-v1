// Multi Game Platform V2.3 Tenant Edition
// 第 99601～100000 批：九宮格正式抽獎統一走 Draw Engine 修正版
// 延續第 92001～92400 批：正式抽獎中獎後同步扣除獎項庫存修正版
//
// 覆蓋位置：
// backend/src/services/drawEngine.service.js
//
// 本批重點：
// 1. GRID / PREMIUM_GRID 正式後端抽獎固定以 GameConfig.settings.gridItems 為第一來源。
// 2. 舊資料若把「銘謝惠顧 / 再接再厲」殘留 isButton / BUTTON 標記，但仍有機率值，後端會納入抽獎池。
// 3. 實際中心開始按鈕若機率為 0，仍不會進入抽獎池。
// 4. PlayRecord 補齊 selectedPrizeTitle / selectedPrizeProbability / selectedPrizeSource / probabilityMode / selectedPrizeType。
// 5. 未中獎項會寫入 PlayRecord 統計，但不建立 RewardRecord。

import crypto from 'crypto'
import prisma from '../lib/prisma.js'

const normalizeId = (id) => {
  const normalizedId = Number(id)

  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    return null
  }

  return normalizedId
}

const normalizeCode = (value) => {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-')
    .replace(/[^A-Z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
}

const normalizeGameType = (value) => {
  const gameType = String(value || 'GOLDEN_EGG').toUpperCase()

  if (gameType === 'PREMIUM_GRID' || gameType === 'PREMIUM-GRID') {
    return 'GRID'
  }

  if (['WHEEL', 'SCRATCH', 'FLIP', 'GRID', 'GOLDEN_EGG'].includes(gameType)) {
    return gameType
  }

  return 'GOLDEN_EGG'
}

const normalizeLoseLikeTitle = (value = '') => {
  const text = String(value || '').trim().toLowerCase().replace(/\s+/g, '')

  return text.includes('銘謝惠顧') ||
    text.includes('再接再厲') ||
    text.includes('謝謝參加') ||
    text.includes('未中獎') ||
    text.includes('no_prize') ||
    text.includes('noprize') ||
    text.includes('thanks') ||
    text.includes('lose')
}

const normalizeGameConfigPrizeType = (value, item = {}) => {
  const rawType = String(value || '').toUpperCase()
  const title = normalizeGameConfigPrizeTitle(item)

  if (['LOSE', 'THANKS', 'NO_PRIZE', 'NONE'].includes(rawType)) {
    return 'LOSE'
  }

  // 舊九宮格資料可能把「銘謝惠顧 / 再接再厲」誤殘留為 BUTTON / isButton。
  // 只要標題明確是未中獎語意，就視為 LOSE，避免後台 40% 未中獎不進抽獎池。
  if ((rawType === 'BUTTON' || item?.isButton === true) && normalizeLoseLikeTitle(title)) {
    return 'LOSE'
  }

  if (normalizeLoseLikeTitle(title)) {
    return 'LOSE'
  }

  return 'WIN'
}

const normalizeGameConfigPrizeTitle = (item = {}, index = 0) => {
  return (
    item.title ||
    item.name ||
    item.prizeName ||
    item.shortName ||
    item.label ||
    `獎項 ${index + 1}`
  )
}

const hasExplicitGameConfigStock = (item = {}) => {
  return item.remainStock !== undefined ||
    item.stock !== undefined ||
    item.quantity !== undefined ||
    item.inventory !== undefined ||
    item.stockTotal !== undefined ||
    item.total !== undefined
}

const normalizeGameConfigPrizeStock = (item = {}, gameType = '') => {
  if (normalizeGameConfigPrizeType(item.type || item.rewardType, item) === 'LOSE') {
    return 999999999
  }

  if (normalizeGameType(gameType) === 'WHEEL' && !hasExplicitGameConfigStock(item)) {
    return 999999999
  }

  const stock = Number(
    item.remainStock ??
      item.stock ??
      item.quantity ??
      item.inventory ??
      item.stockTotal ??
      item.total ??
      0
  )

  return Math.max(0, stock)
}

const normalizeGameConfigPrizeProbability = (item = {}) => {
  const probability = Number(
    item.probabilityPercent ??
      item.percent ??
      item.probability ??
      item.weight ??
      item.chance ??
      item.rate ??
      0
  )

  return Math.max(0, probability)
}

const normalizeComparableText = (value = '') => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
}

const getGameConfigLinkedPrizeId = (item = {}) => {
  return normalizeId(
    item.prizeId ??
      item.realPrizeId ??
      item.prizeTableId ??
      item.rewardId ??
      item.id
  )
}

const findMatchingPrizeTableItem = (virtualPrize = {}, campaignPrizes = []) => {
  const linkedPrizeId = normalizeId(virtualPrize.linkedPrizeId)

  if (linkedPrizeId) {
    const matchedById = campaignPrizes.find((prize) => normalizeId(prize.id) === linkedPrizeId)

    if (matchedById) return matchedById
  }

  const sourcePayload = virtualPrize.sourcePayload || {}
  const titleKey = normalizeComparableText(virtualPrize.title)
  const shortNameKey = normalizeComparableText(virtualPrize.shortName)
  const sourceTitleKey = normalizeComparableText(
    sourcePayload.title ||
      sourcePayload.name ||
      sourcePayload.prizeName ||
      sourcePayload.shortName ||
      sourcePayload.label
  )
  const sortOrder = Number(virtualPrize.sortOrder || sourcePayload.sortOrder || sourcePayload.position || 0)

  return campaignPrizes.find((prize) => {
    if (!prize || String(prize.status || '').toUpperCase() !== 'ACTIVE') return false
    if (String(prize.type || '').toUpperCase() === 'LOSE') return false

    const prizeTitleKey = normalizeComparableText(prize.title)
    const prizeShortNameKey = normalizeComparableText(prize.shortName)

    if (titleKey && (titleKey === prizeTitleKey || titleKey === prizeShortNameKey)) return true
    if (shortNameKey && (shortNameKey === prizeTitleKey || shortNameKey === prizeShortNameKey)) return true
    if (sourceTitleKey && (sourceTitleKey === prizeTitleKey || sourceTitleKey === prizeShortNameKey)) return true

    if (sortOrder > 0 && Number(prize.sortOrder || 0) === sortOrder) {
      return true
    }

    return false
  }) || null
}

const attachPrizeTableLinkToVirtualPrize = (virtualPrize = {}, campaignPrizes = []) => {
  if (!virtualPrize?.isVirtualGameConfigPrize) return virtualPrize

  const matchedPrize = findMatchingPrizeTableItem(virtualPrize, campaignPrizes)

  if (!matchedPrize) {
    return virtualPrize
  }

  return {
    ...virtualPrize,
    linkedPrizeId: matchedPrize.id,
    linkedPrize: matchedPrize,
    remainStock: getPrizeAvailableStock(matchedPrize),
    stockTotal: matchedPrize.stockTotal,
    stockUsed: matchedPrize.stockUsed,
    prizeTableTitle: matchedPrize.title
  }
}

const isGameConfigItemEnabled = (item = {}) => {
  if (!item) return false
  if (item.enabled === false) return false
  if (item.isEnabled === false) return false
  if (String(item.status || '').toUpperCase() === 'DISABLED') return false

  const rawType = String(item.type || item.rewardType || '').toUpperCase()
  const probability = normalizeGameConfigPrizeProbability(item)
  const title = normalizeGameConfigPrizeTitle(item)

  // 第 99601～100000 批：舊資料如果殘留 BUTTON / isButton，不能一律排除。
  // 有機率且標題是「銘謝惠顧 / 再接再厲 / 未中獎」時，必須進正式抽獎池。
  if (rawType === 'BUTTON' || item.isButton === true) {
    return probability > 0 && normalizeLoseLikeTitle(title)
  }

  return true
}

const getFirstNonEmptyArray = (arrays = []) => {
  return arrays.find((value) => Array.isArray(value) && value.length) || []
}

const extractGameConfigPrizeItems = (settings = {}, gameType = '') => {
  const normalizedGameType = normalizeGameType(gameType)

  if (normalizedGameType === 'GRID') {
    // 第 98001～98400 批：九宮格正式抽獎必須以 gridItems 為第一來源。
    // settings.prizes 只當舊活動 fallback，避免舊 prizes 資料蓋過後台九宮格目前設定。
    return getFirstNonEmptyArray([
      settings.gridItems,
      settings.prizes,
      settings.rewards,
      settings.rewardItems,
      settings.items
    ])
  }

  if (normalizedGameType === 'WHEEL') {
    return getFirstNonEmptyArray([
      settings.prizes,
      settings.wheelItems,
      settings.rewards,
      settings.rewardItems,
      settings.items
    ])
  }

  if (normalizedGameType === 'GOLDEN_EGG') {
    return getFirstNonEmptyArray([
      settings.eggItems,
      settings.prizes,
      settings.rewards,
      settings.rewardItems,
      settings.items
    ])
  }

  return getFirstNonEmptyArray([
    settings.prizes,
    settings.rewards,
    settings.rewardItems,
    settings.items,
    settings.gridItems,
    settings.eggItems,
    settings.wheelItems
  ])
}

const normalizeGameConfigPrize = (item = {}, index = 0, campaign = {}) => {
  const gameType = normalizeGameType(campaign.gameType)
  const title = normalizeGameConfigPrizeTitle(item, index)
  const prizeType = normalizeGameConfigPrizeType(item.type || item.rewardType, item)
  const remainStock = normalizeGameConfigPrizeStock(item, gameType)
  const probability = normalizeGameConfigPrizeProbability(item)

  return {
    id: `game-config-${campaign.id || 'campaign'}-${item.position || index + 1}`,
    isVirtualGameConfigPrize: true,
    campaignId: campaign.id,
    tenantId: campaign.tenantId || null,
    title,
    shortName: item.shortName || item.label || title,
    description: item.description || item.note || '',
    imageUrl: item.imageUrl || item.image || item.prizeImageUrl || '',
    icon: item.icon || item.emoji || '',
    type: prizeType,
    status: 'ACTIVE',
    probability,
    remainStock,
    stockTotal: remainStock,
    stockUsed: 0,
    sortOrder: Number(item.sortOrder ?? item.position ?? index + 1),
    linkedPrizeId: getGameConfigLinkedPrizeId(item),
    linkedPrize: null,
    source: 'GAME_CONFIG_SETTINGS',
    sourcePayload: item
  }
}

const buildGameConfigPrizePool = (campaign = {}) => {
  const settings = campaign.gameConfig?.settings || {}
  const gameType = normalizeGameType(campaign.gameType)
  const items = extractGameConfigPrizeItems(settings, gameType)

  const campaignPrizes = Array.isArray(campaign.prizes) ? campaign.prizes : []

  return items
    .filter(isGameConfigItemEnabled)
    .map((item, index) => normalizeGameConfigPrize(item, index, campaign))
    .map((prize) => attachPrizeTableLinkToVirtualPrize(prize, campaignPrizes))
    .filter((prize) => {
      if (prize.type === 'LOSE') return Number(prize.probability || 0) > 0
      return Number(prize.remainStock || 0) > 0 && Number(prize.probability || 0) > 0
    })
}

const getCampaignPrizePool = (campaign = {}) => {
  const gameType = normalizeGameType(campaign.gameType)
  const gameConfigPool = buildGameConfigPrizePool(campaign)

  if (['WHEEL', 'GRID', 'GOLDEN_EGG'].includes(gameType) && gameConfigPool.length) {
    return gameConfigPool
  }

  if (Array.isArray(campaign.prizes) && campaign.prizes.length) {
    return campaign.prizes
  }

  return gameConfigPool
}

const toResponsePrize = (prize = null) => {
  if (!prize) return null

  return {
    id: prize.id,
    title: prize.title,
    shortName: prize.shortName || null,
    description: prize.description || null,
    imageUrl: prize.imageUrl || null,
    icon: prize.icon || null,
    type: prize.type,
    status: prize.status,
    probability: prize.probability,
    probabilityPercent: prize.probability,
    remainStock: prize.remainStock,
    stockTotal: prize.stockTotal,
    stockUsed: prize.stockUsed,
    sortOrder: prize.sortOrder,
    linkedPrizeId: prize.linkedPrizeId || null,
    isVirtualGameConfigPrize: Boolean(prize.isVirtualGameConfigPrize),
    source: prize.source || 'PRIZE_TABLE'
  }
}

const getPrizeIdForWrite = (prize = null) => {
  if (!prize) return null

  if (prize.isVirtualGameConfigPrize) {
    return normalizeId(prize.linkedPrizeId)
  }

  return normalizeId(prize.id)
}

const normalizeTrafficSource = (value = '') => {
  const source = String(value || '').trim().toLowerCase()

  if (source === 'fb') return 'facebook'
  if (source === 'ig') return 'instagram'
  if (['line', 'facebook', 'instagram', 'direct'].includes(source)) return source

  return source || 'direct'
}

const buildTrafficPayload = (payload = {}) => {
  const rawPayload = payload.resultPayload || {}
  const source = normalizeTrafficSource(
    payload.source ||
    payload.trafficSource ||
    rawPayload.source ||
    rawPayload.trafficSource ||
    rawPayload.from ||
    'direct'
  )

  return {
    source,
    trafficSource: source,
    sourceLabel: rawPayload.sourceLabel || payload.sourceLabel || source,
    tenantSlug: payload.tenantSlug || rawPayload.tenantSlug || null,
    frontUrl: payload.frontUrl || rawPayload.frontUrl || null,
    referrer: payload.referrer || rawPayload.referrer || null
  }
}

const createHttpError = (message, status = 500) => {
  const error = new Error(message)
  error.status = status
  return error
}


// 第 102001～102400 批：九宮格活動時間統一後台設定為主修正。
// 問題根因：
// 1. 玩家頁上方狀態已改看 GameConfig.settings.activityTime，所以會顯示活動進行中。
// 2. verify-serial / play 後端仍可能只拿 campaign.startAt / endAt，而且 Prisma 取出的 Date 物件
//    會保留 2026-05-21T13:00:00.000Z 的 UTC timestamp，導致後端誤判台灣時間 21:00 才開始。
// 3. 因此本批讓 GRID / PREMIUM_GRID 的後端守門完全以後台 GameConfig.settings.activityTime 為第一來源，
//    再 fallback Campaign.startAt / endAt；字串與 Date 物件都用「台灣本地牆上時間」判斷。
const PREMIUM_GRID_LOCAL_TIMEZONE_OFFSET_MINUTES = 8 * 60

const isPremiumGridCampaign = (campaign = {}) => {
  const gameType = String(campaign?.gameType || campaign?.type || '').trim().toUpperCase()
  return ['GRID', 'PREMIUM_GRID'].includes(gameType)
}

const parsePremiumGridDatePartsAsTaipeiTimestamp = ({ year, month, day, hour, minute, second = 0 }) => {
  const utcTimestamp = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  )

  if (Number.isNaN(utcTimestamp)) return null

  return utcTimestamp - PREMIUM_GRID_LOCAL_TIMEZONE_OFFSET_MINUTES * 60 * 1000
}

const parsePremiumGridWallTimeAsTaipeiTimestamp = (value) => {
  if (!value) return null

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null

    // Prisma 取回的 Date 可能是 2026-05-21T13:00:00.000Z。
    // 這裡不能直接 value.getTime()，否則會被當作 UTC 13:00。
    // 九宮格舊資料要把 UTC 欄位 13:00 視為商家後台輸入的台灣 13:00。
    return parsePremiumGridDatePartsAsTaipeiTimestamp({
      year: value.getUTCFullYear(),
      month: value.getUTCMonth() + 1,
      day: value.getUTCDate(),
      hour: value.getUTCHours(),
      minute: value.getUTCMinutes(),
      second: value.getUTCSeconds()
    })
  }

  const raw = String(value || '').trim()
  if (!raw) return null

  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/)

  if (match) {
    const [, year, month, day, hour, minute, second = '0'] = match

    return parsePremiumGridDatePartsAsTaipeiTimestamp({
      year,
      month,
      day,
      hour,
      minute,
      second
    })
  }

  const parsed = new Date(raw).getTime()
  return Number.isNaN(parsed) ? null : parsed
}

const getPremiumGridGameConfigActivityTimeValue = (campaign = {}, key = 'startAt') => {
  const settings = campaign?.gameConfig?.settings || {}
  const activityTime = settings.activityTime || settings.activity || settings.timeSettings || {}

  if (key === 'startAt') {
    return activityTime.startAt || activityTime.startTime || activityTime.startedAt || null
  }

  return activityTime.endAt || activityTime.endTime || activityTime.endedAt || null
}

const getCampaignAvailabilityTimestamp = (campaign = {}, key = 'startAt') => {
  const value = isPremiumGridCampaign(campaign)
    ? (getPremiumGridGameConfigActivityTimeValue(campaign, key) || campaign?.[key])
    : campaign?.[key]

  if (!value) return null

  if (isPremiumGridCampaign(campaign)) {
    return parsePremiumGridWallTimeAsTaipeiTimestamp(value)
  }

  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? null : timestamp
}

const createClaimCode = () => {
  const randomText = crypto.randomBytes(6).toString('hex').toUpperCase()

  return `CLAIM-${randomText}`
}

const isCampaignAvailable = (campaign) => {
  const now = Date.now()

  if (!campaign) {
    return {
      ok: false,
      status: 404,
      message: '找不到活動'
    }
  }

  if (campaign.status !== 'ACTIVE') {
    return {
      ok: false,
      status: 409,
      message: '活動目前不是啟用狀態'
    }
  }

  const campaignStartTimestamp = getCampaignAvailabilityTimestamp(campaign, 'startAt')
  const campaignEndTimestamp = getCampaignAvailabilityTimestamp(campaign, 'endAt')

  if (campaignStartTimestamp && campaignStartTimestamp > now) {
    return {
      ok: false,
      status: 409,
      message: '活動尚未開始'
    }
  }

  if (campaignEndTimestamp && campaignEndTimestamp < now) {
    return {
      ok: false,
      status: 409,
      message: '活動已結束'
    }
  }

  return {
    ok: true,
    status: 200,
    message: '活動可參加'
  }
}

const assertCampaignAvailable = (campaign) => {
  const campaignAvailability = isCampaignAvailable(campaign)

  if (!campaignAvailability.ok) {
    throw createHttpError(campaignAvailability.message, campaignAvailability.status)
  }
}

const getPrizeAvailableStock = (prize) => {
  if (!prize) return 0

  if (prize.type === 'LOSE') {
    return 999999999
  }

  const stockTotal = Number(prize.stockTotal || 0)
  const stockUsed = Number(prize.stockUsed || 0)
  const remainStock = Number(prize.remainStock || 0)

  if (stockTotal > 0) {
    return Math.max(0, stockTotal - stockUsed, remainStock)
  }

  return Math.max(0, remainStock)
}

const isPrizeAvailable = (prize) => {
  if (!prize) return false
  if (prize.status !== 'ACTIVE') return false
  if (prize.type === 'LOSE') return true

  if (prize.isVirtualGameConfigPrize) {
    return Number(prize.remainStock || 0) > 0
  }

  return getPrizeAvailableStock(prize) > 0
}

const pickPrizeByProbability = (prizes = []) => {
  const availablePrizes = prizes.filter(isPrizeAvailable)

  if (!availablePrizes.length) return null

  const totalProbability = availablePrizes.reduce((sum, prize) => {
    return sum + Math.max(0, Number(prize.probability || 0))
  }, 0)

  if (totalProbability <= 0) {
    const randomIndex = Math.floor(Math.random() * availablePrizes.length)

    return availablePrizes[randomIndex]
  }

  const randomPoint = Math.random() * totalProbability
  let cumulative = 0

  for (const prize of availablePrizes) {
    cumulative += Math.max(0, Number(prize.probability || 0))

    if (randomPoint <= cumulative) {
      return prize
    }
  }

  return availablePrizes[availablePrizes.length - 1]
}

const isSerialCodeExpired = (serialCode) => {
  if (!serialCode?.expireAt) return false

  return new Date(serialCode.expireAt).getTime() < Date.now()
}

const getSerialUsageInfo = async (tx, serialCode) => {
  if (!serialCode) {
    return {
      usedCount: 0,
      rewardChance: 0,
      remainingChance: 0,
      isExhausted: false
    }
  }

  const rewardChance = Math.max(1, Number(serialCode.rewardChance || 1))
  const usedCount = await tx.playRecord.count({
    where: {
      serialCodeId: serialCode.id
    }
  })
  const remainingChance = Math.max(0, rewardChance - usedCount)

  return {
    usedCount,
    rewardChance,
    remainingChance,
    isExhausted: remainingChance <= 0
  }
}

const validateSerialCodeForDraw = async (tx, campaignId, payload = {}) => {
  const shouldRequireSerialCode = payload.requireSerialCode !== false

  if (!shouldRequireSerialCode && !payload.serialCode && !payload.serialCodeId) {
    return null
  }

  const code = normalizeCode(payload.serialCode || payload.code)

  const where = payload.serialCodeId
    ? {
        id: normalizeId(payload.serialCodeId),
        campaignId
      }
    : {
        code,
        campaignId
      }

  if (!where.id && !where.code) {
    throw createHttpError('請輸入抽獎序號', 400)
  }

  const serialCode = await tx.serialCode.findFirst({
    where
  })

  if (!serialCode) {
    throw createHttpError('序號不存在或不屬於此活動', 404)
  }

  if (serialCode.status === 'DISABLED') {
    throw createHttpError('序號已停用', 409)
  }

  if (isSerialCodeExpired(serialCode)) {
    throw createHttpError('序號已過期', 409)
  }

  const usageInfo = await getSerialUsageInfo(tx, serialCode)

  if (usageInfo.isExhausted) {
    throw createHttpError('序號可用次數已用完', 409)
  }

  return {
    serialCode,
    usageInfo
  }
}

const reserveWinningPrizeStock = async (tx, prize) => {
  if (!prize || prize.type === 'LOSE') {
    return prize
  }

  const prizeIdForReserve = prize.isVirtualGameConfigPrize
    ? normalizeId(prize.linkedPrizeId)
    : normalizeId(prize.id)

  if (!prizeIdForReserve) {
    throw createHttpError('此獎項尚未連結真實庫存，請先到獎項管理重新儲存此活動獎項', 409)
  }

  const currentPrize = await tx.prize.findFirst({
    where: {
      id: prizeIdForReserve,
      campaignId: normalizeId(prize.campaignId),
      tenantId: prize.tenantId || null,
      status: 'ACTIVE'
    }
  })

  if (!currentPrize) {
    throw createHttpError('找不到此活動對應的真實獎項庫存，請重新整理獎項管理', 409)
  }

  const stockTotal = Number(currentPrize.stockTotal || 0)

  if (stockTotal > 0) {
    const result = await tx.prize.updateMany({
      where: {
        id: currentPrize.id,
        campaignId: currentPrize.campaignId,
        tenantId: currentPrize.tenantId || null,
        status: 'ACTIVE',
        stockUsed: {
          lt: stockTotal
        },
        remainStock: {
          gt: 0
        }
      },
      data: {
        stockUsed: {
          increment: 1
        },
        remainStock: {
          decrement: 1
        }
      }
    })

    if (result.count <= 0) {
      throw createHttpError('此獎項庫存已不足，請重新抽獎', 409)
    }

    return tx.prize.findUnique({
      where: {
        id: currentPrize.id
      }
    })
  }

  const result = await tx.prize.updateMany({
    where: {
      id: currentPrize.id,
      campaignId: currentPrize.campaignId,
      tenantId: currentPrize.tenantId || null,
      status: 'ACTIVE',
      remainStock: {
        gt: 0
      }
    },
    data: {
      stockUsed: {
        increment: 1
      },
      remainStock: {
        decrement: 1
      }
    }
  })

  if (result.count <= 0) {
    throw createHttpError('此獎項庫存已不足，請重新抽獎', 409)
  }

  return tx.prize.findUnique({
    where: {
      id: currentPrize.id
    }
  })
}

const updateSerialCodeAfterDraw = async (tx, serialCode, serialUsageInfo, payload = {}) => {
  if (!serialCode) {
    return {
      updatedSerialCode: null,
      serialUsedCountAfterThisDraw: 0,
      serialRemainingChance: 0
    }
  }

  const serialUsedCountAfterThisDraw = Number(serialUsageInfo?.usedCount || 0) + 1
  const rewardChance = Number(serialUsageInfo?.rewardChance || serialCode.rewardChance || 1)
  const serialRemainingChance = Math.max(0, rewardChance - serialUsedCountAfterThisDraw)
  const shouldMarkUsed = serialRemainingChance <= 0

  const updatedSerialCode = await tx.serialCode.update({
    where: {
      id: serialCode.id
    },
    data: {
      status: shouldMarkUsed ? 'USED' : 'UNUSED',
      usedAt: shouldMarkUsed ? new Date() : serialCode.usedAt,
      usedBy: shouldMarkUsed
        ? (payload.usedBy || payload.playerPhone || payload.playerEmail || payload.playerName || 'front-player')
        : serialCode.usedBy
    }
  })

  return {
    updatedSerialCode,
    serialUsedCountAfterThisDraw,
    serialRemainingChance
  }
}

export const runDrawEngine = async (campaignId, payload = {}) => {
  const normalizedCampaignId = normalizeId(campaignId)

  if (!normalizedCampaignId) {
    throw createHttpError('活動 ID 不正確', 400)
  }

  return prisma.$transaction(async (tx) => {
    const campaign = await tx.campaign.findUnique({
      where: {
        id: normalizedCampaignId
      },
      include: {
        prizes: {
          where: {
            status: 'ACTIVE'
          },
          orderBy: [
            {
              sortOrder: 'asc'
            },
            {
              id: 'asc'
            }
          ]
        },
        gameConfig: true
      }
    })

    assertCampaignAvailable(campaign)

    const serialValidation = await validateSerialCodeForDraw(tx, normalizedCampaignId, payload)
    const serialCode = serialValidation?.serialCode || null
    const serialUsageInfo = serialValidation?.usageInfo || null
    const trafficPayload = buildTrafficPayload(payload)

    const prizePool = getCampaignPrizePool(campaign)
    const prize = pickPrizeByProbability(prizePool)

    if (!prize) {
      throw createHttpError('目前沒有可抽的獎項', 409)
    }

    const prizeIdForWrite = getPrizeIdForWrite(prize)
    const prizeForResponse = toResponsePrize(prize)

    const isWin = prize.type !== 'LOSE'

    let updatedPrize = prize

    if (isWin) {
      updatedPrize = await reserveWinningPrizeStock(tx, prize)
    }

    const playRecord = await tx.playRecord.create({
      data: {
        userId: payload.userId ? normalizeId(payload.userId) : null,
        campaignId: normalizedCampaignId,
        tenantId: campaign.tenantId || null,
        prizeId: prizeIdForWrite,
        isWin,
        gameType: normalizeGameType(payload.gameType || campaign.gameType),
        status: 'SUCCESS',
        serialCodeId: serialCode?.id || null,
        playerName: payload.playerName || null,
        playerPhone: payload.playerPhone || null,
        playerEmail: payload.playerEmail || null,
        playerIp: payload.playerIp || null,
        userAgent: payload.userAgent || null,
        resultPayload: {
          ...(payload.resultPayload || {}),
          drawEngine: true,
          requireSerialCode: payload.requireSerialCode !== false,
          serialCode: serialCode?.code || null,
          source: trafficPayload.source,
          trafficSource: trafficPayload.trafficSource,
          sourceLabel: trafficPayload.sourceLabel,
          tenantSlug: trafficPayload.tenantSlug,
          frontUrl: trafficPayload.frontUrl,
          referrer: trafficPayload.referrer,
          selectedPrizeId: prize.id,
          selectedPrizeTableId: prizeIdForWrite,
          selectedPrizeTitle: prize.title,
          selectedPrizeName: prize.title,
          selectedPrizeType: prize.type,
          selectedPrizeIsWin: isWin,
          selectedPrizeProbability: prize.probability,
          selectedPrizeSource: prize.isVirtualGameConfigPrize ? 'GAME_CONFIG_SETTINGS' : 'PRIZE_TABLE',
          probabilityMode: 'BACKEND_DRAW_ENGINE',
          routeFlow: payload.routeFlow || 'DRAW_ENGINE_ROUTE',
          controllerFlow: payload.controllerFlow || 'playDrawHandler',
          virtualPrize: prize.isVirtualGameConfigPrize ? prizeForResponse : null
        }
      },
      include: {
        prize: true,
        serialCode: true
      }
    })

    let rewardRecord = null

    if (isWin) {
      rewardRecord = await tx.rewardRecord.create({
        data: {
          campaignId: normalizedCampaignId,
          tenantId: campaign.tenantId || null,
          playRecordId: playRecord.id,
          prizeId: prizeIdForWrite,
          status: 'PENDING',
          winnerName: payload.winnerName || payload.playerName || null,
          winnerPhone: payload.winnerPhone || payload.playerPhone || null,
          winnerEmail: payload.winnerEmail || payload.playerEmail || null,
          claimCode: payload.claimCode || createClaimCode(),
          note: payload.note || null
        },
        include: {
          prize: true
        }
      })
    }

    const {
      updatedSerialCode,
      serialUsedCountAfterThisDraw,
      serialRemainingChance
    } = await updateSerialCodeAfterDraw(tx, serialCode, serialUsageInfo, payload)

    return {
      campaign: {
        id: campaign.id,
        tenantId: campaign.tenantId || null,
        title: campaign.title,
        gameType: campaign.gameType
      },
      playRecord,
      rewardRecord,
      serialCode: updatedSerialCode,
      prize: updatedPrize?.isVirtualGameConfigPrize ? prizeForResponse : updatedPrize,
      tracking: {
        source: trafficPayload.source,
        tenantSlug: trafficPayload.tenantSlug,
        frontUrl: trafficPayload.frontUrl
      },
      probability: {
        mode: 'BACKEND_DRAW_ENGINE',
        source: prize.isVirtualGameConfigPrize ? 'GAME_CONFIG_SETTINGS' : 'PRIZE_TABLE',
        selectedProbability: prize.probability,
        totalProbability: prizePool.reduce((sum, item) => sum + Math.max(0, Number(item.probability || 0)), 0)
      },
      result: {
        isWin,
        prizeId: prizeIdForWrite || prize.id,
        prizeTitle: prize.title,
        prizeType: prize.type,
        prizeSource: prize.isVirtualGameConfigPrize ? 'GAME_CONFIG_SETTINGS' : 'PRIZE_TABLE',
        prizeProbability: prize.probability,
        probabilityMode: 'BACKEND_DRAW_ENGINE',
        virtualPrize: prize.isVirtualGameConfigPrize ? prizeForResponse : null,
        serialCodeUsed: !!serialCode,
        rewardChance: serialUsageInfo?.rewardChance || serialCode?.rewardChance || 0,
        serialUsedCount: serialUsedCountAfterThisDraw,
        remainingSerialChances: serialRemainingChance
      }
    }
  })
}

export const previewDrawPool = async (campaignId) => {
  const normalizedCampaignId = normalizeId(campaignId)

  if (!normalizedCampaignId) {
    throw createHttpError('活動 ID 不正確', 400)
  }

  const campaign = await prisma.campaign.findUnique({
    where: {
      id: normalizedCampaignId
    },
    include: {
      prizes: {
        orderBy: [
          {
            sortOrder: 'asc'
          },
          {
            id: 'asc'
          }
        ]
      },
      gameConfig: true
    }
  })

  if (!campaign) {
    throw createHttpError('找不到活動', 404)
  }

  const prizePool = getCampaignPrizePool(campaign)
  const totalProbability = prizePool
    .filter((prize) => prize.status === 'ACTIVE')
    .reduce((sum, prize) => sum + Number(prize.probability || 0), 0)

  return {
    campaign: {
      id: campaign.id,
      tenantId: campaign.tenantId || null,
      title: campaign.title,
      gameType: campaign.gameType,
      status: campaign.status,
      startAt: campaign.startAt,
      endAt: campaign.endAt,
      availability: isCampaignAvailable(campaign)
    },
    totalProbability,
    probabilityMode: 'BACKEND_DRAW_ENGINE',
    prizeSource: getCampaignPrizePool(campaign).some((prize) => prize.isVirtualGameConfigPrize) ? 'GAME_CONFIG_SETTINGS' : 'PRIZE_TABLE',
    prizes: prizePool.map((prize) => ({
      id: prize.id,
      title: prize.title,
      type: prize.type,
      status: prize.status,
      probability: prize.probability,
      probabilityPercent: prize.probability,
      remainStock: prize.remainStock,
      stockTotal: prize.stockTotal,
      stockUsed: prize.stockUsed,
      availableStock: prize.isVirtualGameConfigPrize ? Number(prize.remainStock || 0) : getPrizeAvailableStock(prize),
      isAvailable: isPrizeAvailable(prize),
      linkedPrizeId: prize.linkedPrizeId || null,
      isVirtualGameConfigPrize: Boolean(prize.isVirtualGameConfigPrize),
      source: prize.source || 'PRIZE_TABLE'
    }))
  }
}

export const verifySerialCodeForDraw = async (campaignId, code) => {
  const normalizedCampaignId = normalizeId(campaignId)
  const normalizedCode = normalizeCode(code)

  if (!normalizedCampaignId) {
    throw createHttpError('活動 ID 不正確', 400)
  }

  if (!normalizedCode) {
    throw createHttpError('請輸入序號', 400)
  }

  const campaign = await prisma.campaign.findUnique({
    where: {
      id: normalizedCampaignId
    },
    include: {
      gameConfig: true
    }
  })

  assertCampaignAvailable(campaign)

  const serialCode = await prisma.serialCode.findFirst({
    where: {
      campaignId: normalizedCampaignId,
      code: normalizedCode
    }
  })

  if (!serialCode) {
    return {
      valid: false,
      status: 'NOT_FOUND',
      message: '序號不存在或不屬於此活動',
      serialCode: null
    }
  }

  if (serialCode.status === 'DISABLED') {
    return {
      valid: false,
      status: 'DISABLED',
      message: '序號已停用',
      serialCode: {
        id: serialCode.id,
        code: serialCode.code,
        rewardChance: serialCode.rewardChance,
        batchCode: serialCode.batchCode,
        expireAt: serialCode.expireAt
      }
    }
  }

  if (isSerialCodeExpired(serialCode)) {
    return {
      valid: false,
      status: 'EXPIRED',
      message: '序號已過期',
      serialCode: {
        id: serialCode.id,
        code: serialCode.code,
        rewardChance: serialCode.rewardChance,
        batchCode: serialCode.batchCode,
        expireAt: serialCode.expireAt
      }
    }
  }

  const usageInfo = await getSerialUsageInfo(prisma, serialCode)
  const valid = !usageInfo.isExhausted

  return {
    valid,
    status: valid ? 'UNUSED' : 'USED',
    message: valid
      ? `序號可使用，剩餘 ${usageInfo.remainingChance} 次。`
      : '序號可用次數已用完',
    serialCode: {
      id: serialCode.id,
      code: serialCode.code,
      rewardChance: usageInfo.rewardChance,
      usedCount: usageInfo.usedCount,
      remainingChance: usageInfo.remainingChance,
      batchCode: serialCode.batchCode,
      expireAt: serialCode.expireAt
    }
  }
}
