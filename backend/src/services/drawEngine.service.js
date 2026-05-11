// Multi Game Platform V2.3 Tenant Edition
// 第 79201～79600 批：九宮格正式後端百分比抽獎對齊版
//
// 覆蓋位置：
// backend/src/services/drawEngine.service.js
//
// 本批重點：
// 1. GRID / PREMIUM_GRID 正式抽獎優先讀取 GameConfig.settings.prizes / gridItems。
// 2. 後台九宮格「機率 %」會寫入 probabilityPercent / weight / probability，後端抽獎統一正規化後計算。
// 3. 玩家前台只呼叫 /api/draw-engine/campaigns/:id/play，不在前端自行決定正式中獎結果。
// 4. 保留原本 Prize table fallback，避免舊活動沒有 GameConfig settings 時無法抽獎。
// 5. 不改 DB schema / router。

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

const normalizeGameConfigPrizeStock = (item = {}) => {
  const stock = Number(
    item.remainStock ??
      item.stock ??
      item.quantity ??
      item.inventory ??
      item.stockTotal ??
      item.total ??
      0
  )

  if (normalizeGameConfigPrizeType(item.type || item.rewardType) === 'LOSE') {
    return 999999999
  }

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

const extractGameConfigPrizeItems = (settings = {}) => {
  const candidates = [
    settings.prizes,
    settings.gridItems,
    settings.rewards,
    settings.rewardItems,
    settings.items,
    settings.wheelItems,
    settings.eggItems
  ]

  for (const value of candidates) {
    if (Array.isArray(value) && value.length) {
      return value
    }
  }

  return []
}

const normalizeGameConfigPrize = (item = {}, index = 0, campaign = {}) => {
  const title = normalizeGameConfigPrizeTitle(item, index)
  const prizeType = normalizeGameConfigPrizeType(item.type || item.rewardType)
  const remainStock = normalizeGameConfigPrizeStock(item)
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
    source: 'GAME_CONFIG_SETTINGS',
    sourcePayload: item
  }
}

const buildGameConfigPrizePool = (campaign = {}) => {
  const settings = campaign.gameConfig?.settings || {}
  const items = extractGameConfigPrizeItems(settings)

  return items
    .filter(isGameConfigItemEnabled)
    .map((item, index) => normalizeGameConfigPrize(item, index, campaign))
    .filter((prize) => {
      if (prize.type === 'LOSE') return true
      return Number(prize.remainStock || 0) > 0 && Number(prize.probability || 0) > 0
    })
}

const getCampaignPrizePool = (campaign = {}) => {
  const gameType = normalizeGameType(campaign.gameType)
  const gameConfigPool = buildGameConfigPrizePool(campaign)

  // 第 79201～79600 批：九宮格正式抽獎必須以後台 GameConfig settings 的百分比為準。
  // 若同一活動仍有舊 Prize table 資料，也不能蓋過商家後台九宮格設定。
  if (gameType === 'GRID' && gameConfigPool.length) {
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
    isVirtualGameConfigPrize: Boolean(prize.isVirtualGameConfigPrize),
    source: prize.source || 'PRIZE_TABLE'
  }
}

const getPrizeIdForWrite = (prize = null) => {
  if (!prize) return null
  if (prize.isVirtualGameConfigPrize) return null

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
  if (!prize || prize.type === 'LOSE' || prize.isVirtualGameConfigPrize) {
    return prize
  }

  const stockTotal = Number(prize.stockTotal || 0)

  if (stockTotal > 0) {
    const result = await tx.prize.updateMany({
      where: {
        id: prize.id,
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
        id: prize.id
      }
    })
  }

  const result = await tx.prize.updateMany({
    where: {
      id: prize.id,
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
      id: prize.id
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
          selectedPrizeTitle: prize.title,
          selectedPrizeProbability: prize.probability,
          selectedPrizeSource: prize.isVirtualGameConfigPrize ? 'GAME_CONFIG_SETTINGS' : 'PRIZE_TABLE',
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
        prizeId: prize.id,
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
