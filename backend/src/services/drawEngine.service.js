// Multi Game Platform V2.2 Stable
// 第 339 批：Draw Engine Service 正式安全補強版
//
// 建議放置位置：
// backend/src/services/drawEngine.service.js
//
// 補強重點：
// 1. verify-serial 也檢查活動狀態 / 時間
// 2. 抽獎時活動必須 ACTIVE 且在時間內
// 3. 序號 rewardChance 多次抽獎以 PlayRecord 次數計算
// 4. 中獎獎項扣庫存加入 updateMany 條件保護，降低同時抽獎超賣風險
// 5. 庫存不足時不建立中獎紀錄
// 6. 錯誤訊息統一中文

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

  if (['WHEEL', 'SCRATCH', 'FLIP', 'GRID', 'GOLDEN_EGG'].includes(gameType)) {
    return gameType
  }

  return 'GOLDEN_EGG'
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
        }
      }
    })

    assertCampaignAvailable(campaign)

    const serialValidation = await validateSerialCodeForDraw(tx, normalizedCampaignId, payload)
    const serialCode = serialValidation?.serialCode || null
    const serialUsageInfo = serialValidation?.usageInfo || null

    const prize = pickPrizeByProbability(campaign.prizes)

    if (!prize) {
      throw createHttpError('目前沒有可抽的獎項', 409)
    }

    const isWin = prize.type !== 'LOSE'

    let updatedPrize = prize

    if (isWin) {
      // 必須先保留 / 扣除庫存，再建立中獎紀錄。
      // updateMany 條件可避免多人同時抽獎時把庫存扣成負數。
      updatedPrize = await reserveWinningPrizeStock(tx, prize)
    }

    const playRecord = await tx.playRecord.create({
      data: {
        userId: payload.userId ? normalizeId(payload.userId) : null,
        campaignId: normalizedCampaignId,
        prizeId: prize.id,
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
          selectedPrizeId: prize.id,
          selectedPrizeTitle: prize.title
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
          playRecordId: playRecord.id,
          prizeId: prize.id,
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
        title: campaign.title,
        gameType: campaign.gameType
      },
      playRecord,
      rewardRecord,
      serialCode: updatedSerialCode,
      prize: updatedPrize,
      result: {
        isWin,
        prizeId: prize.id,
        prizeTitle: prize.title,
        prizeType: prize.type,
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
      }
    }
  })

  if (!campaign) {
    throw createHttpError('找不到活動', 404)
  }

  const totalProbability = campaign.prizes
    .filter((prize) => prize.status === 'ACTIVE')
    .reduce((sum, prize) => sum + Number(prize.probability || 0), 0)

  return {
    campaign: {
      id: campaign.id,
      title: campaign.title,
      gameType: campaign.gameType,
      status: campaign.status,
      startAt: campaign.startAt,
      endAt: campaign.endAt,
      availability: isCampaignAvailable(campaign)
    },
    totalProbability,
    prizes: campaign.prizes.map((prize) => ({
      id: prize.id,
      title: prize.title,
      type: prize.type,
      status: prize.status,
      probability: prize.probability,
      remainStock: prize.remainStock,
      stockTotal: prize.stockTotal,
      stockUsed: prize.stockUsed,
      availableStock: getPrizeAvailableStock(prize),
      isAvailable: isPrizeAvailable(prize)
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
