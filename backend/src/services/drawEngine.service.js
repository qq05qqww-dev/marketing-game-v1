// Multi Game Platform V2.3 Tenant Edition
// 第 111601～112000 批：三遊戲虛擬獎項未連真實庫存 fallback 修正版
// 第 110801～111200 批：三遊戲後端百分比抽獎精準修正版
// 延續第 92001～92400 批：正式抽獎中獎後同步扣除獎項庫存修正版
//
// 覆蓋位置：
// backend/src/services/drawEngine.service.js
//
// 本批重點：
// 1. 修正 WHEEL / GRID / GOLDEN_EGG 正式後端抽獎百分比計算。
// 2. 後台設定總和 <= 100 時，依照真實百分比抽；未命中的剩餘百分比自動視為未中獎。
// 3. 後台設定總和 > 100 時，保留舊資料權重模式，避免舊活動直接壞掉。
// 4. 九宮格仍優先讀 GameConfig.settings.gridItems；輪盤 / 金蛋也優先讀各自設定來源。
// 第 112001～112400 批：原始設定總和為 100% 時，部分獎項達上限後由其餘可用獎項按比例承接，不再自動補系統未中獎。
// 第 112801～113200 批：九宮格原始設定總和改由未過濾的 gridItems 計算，避免 100% 因庫存/上限先被排除後誤判成 79% 並補未中獎。
// 5. 不改 DB schema / router / 報表中心。
// 6. 修正金蛋 / 九宮格 / 輪盤：GameConfig 虛擬中獎獎項尚未連結 Prize 真實庫存時，不再讓玩家直接卡 409。

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

const normalizeGameConfigPrizeType = (value) => {
  const rawType = String(value || '').toUpperCase()

  if (['LOSE', 'THANKS', 'NO_PRIZE', 'NONE', 'BUTTON'].includes(rawType)) {
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
  if (normalizeGameConfigPrizeType(item.type || item.rewardType) === 'LOSE') {
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

// 第 110401～110800 批：小批量抽獎不能只靠機率，必須支援每個獎項的發獎硬上限。
// awardLimit / maxAwardCount / maxAwards 優先；舊資料沒有這些欄位時，九宮格會 fallback 到 quantity / stock。
// 0 或空值代表不額外限制；LOSE 類獎項不做發獎上限。
const normalizeGameConfigPrizeAwardLimit = (item = {}, gameType = '') => {
  const type = normalizeGameConfigPrizeType(item.type || item.rewardType)

  if (type === 'LOSE') return 0

  const explicitLimit = item.awardLimit ?? item.maxAwardCount ?? item.maxAwards ?? item.issueLimit

  if (explicitLimit !== undefined && explicitLimit !== null && explicitLimit !== '') {
    const limit = Number(explicitLimit)
    return Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 0
  }

  // 第 111601～112000 批：三遊戲都可能從 GameConfig settings 建立虛擬獎項。
  // 若商家後台有填庫存 / quantity，但尚未建立真實 Prize 連結，仍以設定值作為發獎上限，避免中獎後卡 409。
  if (!['GRID', 'GOLDEN_EGG', 'WHEEL'].includes(normalizeGameType(gameType))) return 0

  const fallbackLimit = Number(
    item.quantity ??
      item.stock ??
      item.inventory ??
      item.stockTotal ??
      item.total ??
      item.remainStock ??
      0
  )

  return Number.isFinite(fallbackLimit) ? Math.max(0, Math.floor(fallbackLimit)) : 0
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
  if (String(item.rewardType || '').toUpperCase() === 'BUTTON') return false
  if (String(item.type || '').toUpperCase() === 'BUTTON') return false
  if (item.isButton === true) return false

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
  const prizeType = normalizeGameConfigPrizeType(item.type || item.rewardType)
  const remainStock = normalizeGameConfigPrizeStock(item, gameType)
  const probability = normalizeGameConfigPrizeProbability(item)
  const awardLimit = normalizeGameConfigPrizeAwardLimit(item, gameType)

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
    awardLimit,
    maxAwardCount: awardLimit,
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
      if (prize.type === 'LOSE') return true
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
    awardLimit: Number(prize.awardLimit || prize.maxAwardCount || 0),
    maxAwardCount: Number(prize.maxAwardCount || prize.awardLimit || 0),
    awardUsed: Number(prize.awardUsed || 0),
    remainingAwardLimit: prize.remainingAwardLimit === undefined ? null : Number(prize.remainingAwardLimit || 0),
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

  if (campaign.startAt && new Date(campaign.startAt).getTime() > now) {
    return {
      ok: false,
      status: 409,
      message: '活動尚未開始'
    }
  }

  if (campaign.endAt && new Date(campaign.endAt).getTime() < now) {
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

const getPrizeAwardLimit = (prize = {}) => {
  const limit = Number(
    prize.awardLimit ??
      prize.maxAwardCount ??
      prize.maxAwards ??
      prize.sourcePayload?.awardLimit ??
      prize.sourcePayload?.maxAwardCount ??
      prize.sourcePayload?.maxAwards ??
      0
  )

  return Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 0
}

const getPrizeIdentityKeys = (prize = {}) => {
  const keys = new Set()
  const addKey = (value) => {
    const key = normalizeComparableText(value)
    if (key) keys.add(key)
  }

  addKey(prize.id)
  addKey(prize.linkedPrizeId)
  addKey(prize.title)
  addKey(prize.shortName)
  addKey(prize.prizeTableTitle)
  addKey(prize.sourcePayload?.id)
  addKey(prize.sourcePayload?.title)
  addKey(prize.sourcePayload?.name)
  addKey(prize.sourcePayload?.shortName)
  addKey(prize.sourcePayload?.label)

  return keys
}

const getPlayRecordIdentityKeys = (record = {}) => {
  const payload = record.resultPayload || {}
  const virtualPrize = payload.virtualPrize || {}
  const keys = new Set()
  const addKey = (value) => {
    const key = normalizeComparableText(value)
    if (key) keys.add(key)
  }

  addKey(record.prizeId)
  addKey(payload.selectedPrizeId)
  addKey(payload.selectedPrizeTableId)
  addKey(payload.selectedPrizeTitle)
  addKey(virtualPrize.id)
  addKey(virtualPrize.linkedPrizeId)
  addKey(virtualPrize.title)
  addKey(virtualPrize.shortName)

  return keys
}

const countIssuedForPrize = (prize = {}, records = []) => {
  const linkedPrizeId = normalizeId(prize.linkedPrizeId)
  const realPrizeId = prize.isVirtualGameConfigPrize ? linkedPrizeId : normalizeId(prize.id)
  const prizeKeys = getPrizeIdentityKeys(prize)

  return records.reduce((count, record) => {
    if (realPrizeId && normalizeId(record.prizeId) === realPrizeId) {
      return count + 1
    }

    const recordKeys = getPlayRecordIdentityKeys(record)

    for (const key of prizeKeys) {
      if (recordKeys.has(key)) {
        return count + 1
      }
    }

    return count
  }, 0)
}

const applyPrizeAwardCaps = async (tx, campaign = {}, prizePool = []) => {
  const gameType = normalizeGameType(campaign.gameType)

  // 第 111601～112000 批：不只九宮格，金蛋與輪盤若從 GameConfig settings 讀取虛擬獎項，
  // 也要依後台庫存 / 最多發出數量計算已發出次數，避免小批量活動超發。
  if (!['GRID', 'GOLDEN_EGG', 'WHEEL'].includes(gameType)) return prizePool

  const cappedWinPrizes = prizePool.filter((prize) => prize.type !== 'LOSE' && getPrizeAwardLimit(prize) > 0)

  if (!cappedWinPrizes.length) return prizePool

  const issuedRecords = await tx.playRecord.findMany({
    where: {
      campaignId: normalizeId(campaign.id),
      isWin: true,
      status: 'SUCCESS',
      gameType
    },
    select: {
      prizeId: true,
      resultPayload: true
    }
  })

  return prizePool
    .map((prize) => {
      const awardLimit = getPrizeAwardLimit(prize)

      if (prize.type === 'LOSE' || awardLimit <= 0) {
        return {
          ...prize,
          awardLimit,
          maxAwardCount: awardLimit,
          awardUsed: 0,
          remainingAwardLimit: awardLimit > 0 ? awardLimit : null
        }
      }

      const awardUsed = countIssuedForPrize(prize, issuedRecords)
      const remainingAwardLimit = Math.max(0, awardLimit - awardUsed)

      return {
        ...prize,
        awardLimit,
        maxAwardCount: awardLimit,
        awardUsed,
        remainingAwardLimit
      }
    })
    .filter((prize) => {
      if (prize.type === 'LOSE') return true
      const awardLimit = getPrizeAwardLimit(prize)
      if (awardLimit <= 0) return true
      return Number(prize.remainingAwardLimit || 0) > 0
    })
}

const createImplicitLosePrize = (campaign = {}, totalProbability = 0) => {
  return {
    id: `implicit-lose-${campaign.id || 'campaign'}`,
    isVirtualGameConfigPrize: true,
    campaignId: campaign.id || null,
    tenantId: campaign.tenantId || null,
    title: '未中獎',
    shortName: '未中獎',
    description: '後台設定百分比總和未滿 100%，剩餘百分比自動判定為未中獎。',
    imageUrl: '',
    icon: '🙏',
    type: 'LOSE',
    status: 'ACTIVE',
    probability: Math.max(0, 100 - Math.max(0, Number(totalProbability || 0))),
    awardLimit: 0,
    maxAwardCount: 0,
    awardUsed: 0,
    remainingAwardLimit: null,
    remainStock: 999999999,
    stockTotal: 999999999,
    stockUsed: 0,
    sortOrder: 999999,
    linkedPrizeId: null,
    linkedPrize: null,
    source: 'IMPLICIT_PERCENTAGE_LOSE',
    sourcePayload: null
  }
}

const calculatePrizePoolProbabilityTotal = (prizes = []) => {
  return prizes.reduce((sum, prize) => {
    return sum + Math.max(0, Number(prize.probability || 0))
  }, 0)
}

// 第 112801～113200 批：原始設定總和必須在庫存、真實 Prize 連結與發獎上限過濾之前計算。
// 否則九宮格後台雖為 100%，只要其中一格暫時不可發，舊邏輯就會把剩餘 79% 誤當原始設定並補 21% 未中獎。
const calculateConfiguredGameProbabilityTotal = (campaign = {}) => {
  const settings = campaign.gameConfig?.settings || {}
  const gameType = normalizeGameType(campaign.gameType)
  const configuredItems = extractGameConfigPrizeItems(settings, gameType)

  if (!configuredItems.length) {
    return calculatePrizePoolProbabilityTotal(
      Array.isArray(campaign.prizes) ? campaign.prizes.filter((prize) => prize?.status === 'ACTIVE') : []
    )
  }

  return configuredItems
    .filter(isGameConfigItemEnabled)
    .reduce((sum, item) => {
      return sum + normalizeGameConfigPrizeProbability(item)
    }, 0)
}

const pickPrizeByProbability = (prizes = [], campaign = {}, options = {}) => {
  const availablePrizes = prizes.filter(isPrizeAvailable)

  if (!availablePrizes.length) return null

  const totalProbability = calculatePrizePoolProbabilityTotal(availablePrizes)
  const originalTotalProbability = Math.max(
    0,
    Number(options.originalTotalProbability ?? totalProbability)
  )

  if (totalProbability <= 0) {
    return null
  }

  /**
   * 三遊戲正式抽獎百分比規則：
   * - 原始設定總和 < 100：後台數字就是實際百分比，剩餘百分比自動視為未中獎。
   * - 原始設定總和 = 100：不建立系統未中獎。若部分獎項因庫存 / 發出上限被排除，
   *   由其餘仍可用獎項依原始比例承接；若全部不可用，回傳 null，由上層顯示沒有可抽獎項。
   * - 原始設定總和 > 100：視為舊資料權重模式，維持向下相容。
   */
  const isConfiguredFullPercentage =
    originalTotalProbability >= 99.999 && originalTotalProbability <= 100.001
  const useExactPercentageMode = originalTotalProbability < 99.999
  const randomBase = isConfiguredFullPercentage || originalTotalProbability > 100
    ? totalProbability
    : 100
  const randomPoint = Math.random() * randomBase
  let cumulative = 0

  for (const prize of availablePrizes) {
    cumulative += Math.max(0, Number(prize.probability || 0))

    if (randomPoint < cumulative) {
      return prize
    }
  }

  if (useExactPercentageMode) {
    return createImplicitLosePrize(campaign, originalTotalProbability)
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

  // 第 111601～112000 批：GameConfig settings 產生的虛擬獎項，可能尚未連結 Prize 真實庫存表。
  // 舊版會直接丟 409，造成玩家抽到中獎時看到 Request failed with status code 409。
  // 新版先允許虛擬獎項完成中獎流程，發獎上限由 applyPrizeAwardCaps 依 PlayRecord 統計控管；
  // 後續商家重新儲存獎項後仍會自動走真實 Prize 扣庫存。
  if (!prizeIdForReserve && prize.isVirtualGameConfigPrize) {
    console.warn('[draw-engine] virtual prize has no linked Prize stock, using GameConfig fallback:', {
      campaignId: prize.campaignId,
      title: prize.title,
      shortName: prize.shortName,
      probability: prize.probability,
      awardLimit: prize.awardLimit,
      source: prize.source
    })

    return {
      ...prize,
      virtualStockReserved: true,
      stockUsed: Number(prize.stockUsed || 0) + 1,
      remainStock: Math.max(0, Number(prize.remainStock || 0) - 1),
      source: prize.source || 'GAME_CONFIG_SETTINGS'
    }
  }

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

  if (!currentPrize && prize.isVirtualGameConfigPrize) {
    console.warn('[draw-engine] linked Prize stock not found, using GameConfig fallback:', {
      campaignId: prize.campaignId,
      linkedPrizeId: prizeIdForReserve,
      title: prize.title,
      probability: prize.probability,
      awardLimit: prize.awardLimit,
      source: prize.source
    })

    return {
      ...prize,
      virtualStockReserved: true,
      stockUsed: Number(prize.stockUsed || 0) + 1,
      remainStock: Math.max(0, Number(prize.remainStock || 0) - 1),
      source: prize.source || 'GAME_CONFIG_SETTINGS'
    }
  }

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

    const rawPrizePool = getCampaignPrizePool(campaign)

    // 必須直接從未過濾的商家後台設定計算原始總和。
    // rawPrizePool 在此之前可能已因庫存 / linked Prize 狀態排除獎項，不能拿來判斷商家是否設定滿 100%。
    const originalTotalProbability = calculateConfiguredGameProbabilityTotal(campaign)
    const prizePool = await applyPrizeAwardCaps(tx, campaign, rawPrizePool)
    const prize = pickPrizeByProbability(prizePool, campaign, {
      originalTotalProbability
    })

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
          selectedPrizeProbability: prize.probability,
          selectedPrizeAwardLimit: Number(prize.awardLimit || prize.maxAwardCount || 0),
          selectedPrizeAwardUsed: Number(prize.awardUsed || 0),
          selectedPrizeRemainingAwardLimit: prize.remainingAwardLimit === undefined ? null : prize.remainingAwardLimit,
          selectedPrizeSource: prize.source || (prize.isVirtualGameConfigPrize ? 'GAME_CONFIG_SETTINGS' : 'PRIZE_TABLE'),
          probabilityMode: 'BACKEND_DRAW_ENGINE',
          virtualPrize: prize.isVirtualGameConfigPrize ? prizeForResponse : null
        }
      },
      include: {
        prize: true,
        serialCode: true
      }
    })

    let rewardRecord = null

    if (isWin && prizeIdForWrite) {
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
        source: prize.source || (prize.isVirtualGameConfigPrize ? 'GAME_CONFIG_SETTINGS' : 'PRIZE_TABLE'),
        selectedProbability: prize.probability,
        // totalProbability 保留為目前可抽池總和；configuredTotalProbability 顯示商家原始設定總和。
        totalProbability: calculatePrizePoolProbabilityTotal(prizePool),
        configuredTotalProbability: originalTotalProbability,
        effectiveTotalProbability: calculatePrizePoolProbabilityTotal(prizePool),
        redistributedToAvailablePrizes:
          originalTotalProbability >= 99.999 &&
          originalTotalProbability <= 100.001 &&
          calculatePrizePoolProbabilityTotal(prizePool) < 99.999,
        awardLimit: Number(prize.awardLimit || prize.maxAwardCount || 0),
        awardUsed: Number(prize.awardUsed || 0),
        remainingAwardLimit: prize.remainingAwardLimit === undefined ? null : prize.remainingAwardLimit
      },
      result: {
        isWin,
        prizeId: prizeIdForWrite || prize.id,
        prizeTitle: prize.title,
        prizeType: prize.type,
        prizeSource: prize.source || (prize.isVirtualGameConfigPrize ? 'GAME_CONFIG_SETTINGS' : 'PRIZE_TABLE'),
        prizeProbability: prize.probability,
        virtualStockReserved: Boolean(updatedPrize?.virtualStockReserved),
        awardLimit: Number(prize.awardLimit || prize.maxAwardCount || 0),
        awardUsed: Number(prize.awardUsed || 0),
        remainingAwardLimit: prize.remainingAwardLimit === undefined ? null : prize.remainingAwardLimit,
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
  const totalProbability = calculatePrizePoolProbabilityTotal(prizePool.filter((prize) => prize.status === 'ACTIVE'))
  const configuredTotalProbability = calculateConfiguredGameProbabilityTotal(campaign)

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
    configuredTotalProbability,
    effectiveTotalProbability: totalProbability,
    redistributedToAvailablePrizes:
      configuredTotalProbability >= 99.999 &&
      configuredTotalProbability <= 100.001 &&
      totalProbability < 99.999,
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
