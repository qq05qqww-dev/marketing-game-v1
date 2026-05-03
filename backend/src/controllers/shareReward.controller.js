// Multi Game Platform V2.3 Tenant Edition
// 第 6 批：ShareRewardLog tenantId 寫入版
//
// 建議放置位置：
// backend/src/controllers/shareReward.controller.js

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEFAULT_DAILY_LIMIT = 1
const DEFAULT_COOLDOWN_SECONDS = 30

const getUserId = (req) => {
  const rawId = req.user?.id || req.user?.userId || req.user?.sub

  return rawId ? Number(rawId) : null
}

const getTodayRange = () => {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)

  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

const getClientIp = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    ''
  )
}

const normalizeGameId = (value) => {
  return String(value || 'wheel').trim() || 'wheel'
}

const normalizeDailyLimit = (value) => {
  return Math.max(0, Number(value || DEFAULT_DAILY_LIMIT))
}

const normalizeCooldownSeconds = (value) => {
  return Math.max(0, Number(value || DEFAULT_COOLDOWN_SECONDS))
}

const normalizeCampaignId = (value) => {
  const campaignId = Number(value)

  return Number.isInteger(campaignId) && campaignId > 0 ? campaignId : null
}

const resolveCampaignTenant = async (campaignId) => {
  const safeCampaignId = normalizeCampaignId(campaignId)

  if (!safeCampaignId) {
    return {
      campaignId: null,
      tenantId: null
    }
  }

  const campaign = await prisma.campaign.findUnique({
    where: {
      id: safeCampaignId
    },
    select: {
      id: true,
      tenantId: true
    }
  })

  return {
    campaignId: campaign?.id || safeCampaignId,
    tenantId: campaign?.tenantId || null
  }
}

const buildStatus = async ({ userId, gameId, campaignId = null, tenantId = null, dailyLimit, cooldownSeconds }) => {
  const { start, end } = getTodayRange()
  const baseWhere = {
    userId,
    gameId,
    ...(campaignId ? { campaignId } : {}),
    ...(tenantId ? { tenantId } : {})
  }

  const todayCount = await prisma.shareRewardLog.count({
    where: {
      ...baseWhere,
      createdAt: {
        gte: start,
        lte: end
      }
    }
  })

  const latestLog = await prisma.shareRewardLog.findFirst({
    where: baseWhere,
    orderBy: {
      createdAt: 'desc'
    }
  })

  let cooldownRemaining = 0

  if (latestLog && cooldownSeconds > 0) {
    const lastTime = latestLog.createdAt.getTime()
    const diffSeconds = Math.floor((Date.now() - lastTime) / 1000)
    cooldownRemaining = Math.max(0, cooldownSeconds - diffSeconds)
  }

  const remainingToday = Math.max(0, dailyLimit - todayCount)

  return {
    tenantId,
    campaignId,
    dailyLimit,
    todayCount,
    remainingToday,
    cooldownSeconds,
    cooldownRemaining,
    lastClaimedAt: latestLog?.createdAt || null,
    canClaim: remainingToday > 0 && cooldownRemaining <= 0
  }
}

export const getShareRewardStatus = async (req, res) => {
  try {
    const userId = getUserId(req)
    const gameId = normalizeGameId(req.query.gameId)
    const dailyLimit = normalizeDailyLimit(req.query.dailyLimit)
    const cooldownSeconds = normalizeCooldownSeconds(req.query.cooldownSeconds)
    const { campaignId, tenantId } = await resolveCampaignTenant(req.query.campaignId)

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '請先登入後再查看分享獎勵狀態'
      })
    }

    const status = await buildStatus({
      userId,
      gameId,
      campaignId,
      tenantId,
      dailyLimit,
      cooldownSeconds
    })

    return res.json({
      success: true,
      message: '取得分享獎勵狀態成功',
      data: status
    })
  } catch (error) {
    console.error('getShareRewardStatus error:', error)

    return res.status(500).json({
      success: false,
      message: '取得分享獎勵狀態失敗'
    })
  }
}

export const claimShareReward = async (req, res) => {
  try {
    const userId = getUserId(req)
    const {
      gameId = 'wheel',
      campaignId = null,
      dailyLimit = DEFAULT_DAILY_LIMIT,
      cooldownSeconds = DEFAULT_COOLDOWN_SECONDS
    } = req.body || {}

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '請先登入後再領取分享獎勵'
      })
    }

    const safeGameId = normalizeGameId(gameId)
    const safeDailyLimit = normalizeDailyLimit(dailyLimit)
    const safeCooldownSeconds = normalizeCooldownSeconds(cooldownSeconds)
    const tenantInfo = await resolveCampaignTenant(campaignId)

    const beforeStatus = await buildStatus({
      userId,
      gameId: safeGameId,
      campaignId: tenantInfo.campaignId,
      tenantId: tenantInfo.tenantId,
      dailyLimit: safeDailyLimit,
      cooldownSeconds: safeCooldownSeconds
    })

    if (!beforeStatus.canClaim) {
      return res.status(429).json({
        success: false,
        message:
          beforeStatus.remainingToday <= 0
            ? '今日分享獎勵已達上限'
            : `分享獎勵冷卻中，請 ${beforeStatus.cooldownRemaining} 秒後再試`,
        data: beforeStatus
      })
    }

    await prisma.shareRewardLog.create({
      data: {
        userId,
        campaignId: tenantInfo.campaignId,
        tenantId: tenantInfo.tenantId,
        gameId: safeGameId,
        rewardType: 'SHARE',
        rewardCount: 1,
        ipAddress: getClientIp(req),
        userAgent: req.headers['user-agent'] || ''
      }
    })

    const afterStatus = await buildStatus({
      userId,
      gameId: safeGameId,
      campaignId: tenantInfo.campaignId,
      tenantId: tenantInfo.tenantId,
      dailyLimit: safeDailyLimit,
      cooldownSeconds: safeCooldownSeconds
    })

    return res.json({
      success: true,
      message: '分享獎勵領取成功',
      data: {
        rewardCount: 1,
        status: afterStatus
      }
    })
  } catch (error) {
    console.error('claimShareReward error:', error)

    return res.status(500).json({
      success: false,
      message: '分享獎勵領取失敗'
    })
  }
}

export const resetShareRewardToday = async (req, res) => {
  try {
    const userId = getUserId(req)
    const gameId = normalizeGameId(req.body?.gameId || req.query?.gameId)
    const tenantInfo = await resolveCampaignTenant(req.body?.campaignId || req.query?.campaignId)
    const { start, end } = getTodayRange()

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '請先登入'
      })
    }

    await prisma.shareRewardLog.deleteMany({
      where: {
        userId,
        gameId,
        ...(tenantInfo.campaignId ? { campaignId: tenantInfo.campaignId } : {}),
        ...(tenantInfo.tenantId ? { tenantId: tenantInfo.tenantId } : {}),
        createdAt: {
          gte: start,
          lte: end
        }
      }
    })

    return res.json({
      success: true,
      message: '已重置今日分享獎勵'
    })
  } catch (error) {
    console.error('resetShareRewardToday error:', error)

    return res.status(500).json({
      success: false,
      message: '重置今日分享獎勵失敗'
    })
  }
}

export const clearShareRewardCooldown = async (req, res) => {
  try {
    const userId = getUserId(req)
    const gameId = normalizeGameId(req.body?.gameId || req.query?.gameId)
    const tenantInfo = await resolveCampaignTenant(req.body?.campaignId || req.query?.campaignId)

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '請先登入'
      })
    }

    const latestLog = await prisma.shareRewardLog.findFirst({
      where: {
        userId,
        gameId,
        ...(tenantInfo.campaignId ? { campaignId: tenantInfo.campaignId } : {}),
        ...(tenantInfo.tenantId ? { tenantId: tenantInfo.tenantId } : {})
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (latestLog) {
      const safeTime = new Date(Date.now() - 24 * 60 * 60 * 1000)

      await prisma.shareRewardLog.update({
        where: {
          id: latestLog.id
        },
        data: {
          createdAt: safeTime
        }
      })
    }

    return res.json({
      success: true,
      message: '已清除分享獎勵冷卻'
    })
  } catch (error) {
    console.error('clearShareRewardCooldown error:', error)

    return res.status(500).json({
      success: false,
      message: '清除分享獎勵冷卻失敗'
    })
  }
}
