// Multi Game Platform V2.3 Tenant Edition
// 第 6 批：PlayRecord / RewardRecord Service tenantId 隔離版
//
// 建議放置位置：
// backend/src/services/playRecord.service.js

import crypto from 'crypto'
import prisma from '../lib/prisma.js'

const normalizeId = (id) => {
  const normalizedId = Number(id)

  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    return null
  }

  return normalizedId
}

const normalizeGameType = (value) => {
  const gameType = String(value || 'GOLDEN_EGG').toUpperCase()

  if (['WHEEL', 'SCRATCH', 'FLIP', 'GRID', 'GOLDEN_EGG'].includes(gameType)) {
    return gameType
  }

  return 'GOLDEN_EGG'
}

const normalizePlayStatus = (value) => {
  const status = String(value || 'SUCCESS').toUpperCase()

  return status === 'FAILED' ? 'FAILED' : 'SUCCESS'
}

const normalizeClaimStatus = (value) => {
  const status = String(value || 'PENDING').toUpperCase()

  if (['PENDING', 'CLAIMED', 'CANCELLED'].includes(status)) {
    return status
  }

  return 'PENDING'
}

const createClaimCode = () => {
  const randomText = crypto.randomBytes(6).toString('hex').toUpperCase()

  return `CLAIM-${randomText}`
}

const getUserRole = (currentUser = {}) => {
  return String(currentUser?.role || '').toUpperCase()
}

const getUserTenantId = (currentUser = {}) => {
  const tenantId = Number(currentUser?.tenantId)

  return Number.isInteger(tenantId) && tenantId > 0 ? tenantId : null
}

const canAccessAllTenants = (currentUser = {}) => {
  const role = getUserRole(currentUser)

  return Boolean(
    currentUser?.isSuperAdmin ||
    role === 'SUPER_ADMIN' ||
    role === 'ADMIN'
  )
}

const createForbiddenError = (message = '找不到活動，或此帳號沒有權限操作這個活動') => {
  const error = new Error(message)
  error.status = 404
  return error
}

const assertCampaignAccess = async (campaignId, currentUser = null) => {
  const normalizedCampaignId = normalizeId(campaignId)

  if (!normalizedCampaignId) {
    const error = new Error('活動 ID 不正確')
    error.status = 400
    throw error
  }

  const campaign = await prisma.campaign.findUnique({
    where: {
      id: normalizedCampaignId
    },
    select: {
      id: true,
      tenantId: true,
      title: true,
      gameType: true,
      status: true
    }
  })

  if (!campaign) {
    throw createForbiddenError()
  }

  // 免登入或系統內部建立紀錄時，維持舊流程可依 campaignId 使用。
  if (!currentUser || canAccessAllTenants(currentUser)) {
    return campaign
  }

  const userTenantId = getUserTenantId(currentUser)

  if (!userTenantId || Number(campaign.tenantId) !== userTenantId) {
    throw createForbiddenError()
  }

  return campaign
}

const assertRewardRecordAccess = async (id, currentUser = null) => {
  const rewardRecordId = normalizeId(id)

  if (!rewardRecordId) {
    const error = new Error('發獎紀錄 ID 不正確')
    error.status = 400
    throw error
  }

  const rewardRecord = await prisma.rewardRecord.findUnique({
    where: {
      id: rewardRecordId
    },
    include: {
      campaign: {
        select: {
          id: true,
          tenantId: true,
          title: true
        }
      }
    }
  })

  if (!rewardRecord) {
    const error = new Error('找不到中獎紀錄')
    error.status = 404
    throw error
  }

  if (!currentUser || canAccessAllTenants(currentUser)) {
    return rewardRecord
  }

  const userTenantId = getUserTenantId(currentUser)
  const recordTenantId = Number(rewardRecord.tenantId || rewardRecord.campaign?.tenantId)

  if (!userTenantId || recordTenantId !== userTenantId) {
    const error = new Error('找不到中獎紀錄，或此帳號沒有權限操作這筆紀錄')
    error.status = 404
    throw error
  }

  return rewardRecord
}

const buildPlayRecordWhere = async (campaignId, query = {}, currentUser = null) => {
  const campaign = await assertCampaignAccess(campaignId, currentUser)

  const where = {
    campaignId: campaign.id
  }

  if (campaign.tenantId) {
    where.tenantId = campaign.tenantId
  }

  if (query.gameType) {
    where.gameType = normalizeGameType(query.gameType)
  }

  if (query.isWin === 'true') {
    where.isWin = true
  }

  if (query.isWin === 'false') {
    where.isWin = false
  }

  if (query.prizeId) {
    where.prizeId = normalizeId(query.prizeId)
  }

  if (query.serialCodeId) {
    where.serialCodeId = normalizeId(query.serialCodeId)
  }

  if (query.keyword) {
    const keyword = String(query.keyword).trim()

    where.OR = [
      {
        playerName: {
          contains: keyword,
          mode: 'insensitive'
        }
      },
      {
        playerPhone: {
          contains: keyword,
          mode: 'insensitive'
        }
      },
      {
        playerEmail: {
          contains: keyword,
          mode: 'insensitive'
        }
      }
    ]
  }

  return {
    where,
    campaign
  }
}

const buildRewardRecordWhere = async (campaignId, query = {}, currentUser = null) => {
  const campaign = await assertCampaignAccess(campaignId, currentUser)

  const where = {
    campaignId: campaign.id
  }

  if (campaign.tenantId) {
    where.tenantId = campaign.tenantId
  }

  if (query.status) {
    where.status = normalizeClaimStatus(query.status)
  }

  if (query.prizeId) {
    where.prizeId = normalizeId(query.prizeId)
  }

  if (query.keyword) {
    const keyword = String(query.keyword).trim()

    where.OR = [
      {
        winnerName: {
          contains: keyword,
          mode: 'insensitive'
        }
      },
      {
        winnerPhone: {
          contains: keyword,
          mode: 'insensitive'
        }
      },
      {
        winnerEmail: {
          contains: keyword,
          mode: 'insensitive'
        }
      },
      {
        claimCode: {
          contains: keyword,
          mode: 'insensitive'
        }
      }
    ]
  }

  return {
    where,
    campaign
  }
}

export const getPlayRecordsByCampaignId = async (campaignId, query = {}, currentUser = null) => {
  const { where } = await buildPlayRecordWhere(campaignId, query, currentUser)

  return prisma.playRecord.findMany({
    where,
    orderBy: {
      id: 'desc'
    },
    include: {
      tenant: true,
      campaign: true,
      prize: true,
      serialCode: true,
      rewardRecord: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          memberLevel: true,
          tenantId: true
        }
      }
    }
  })
}

export const getRewardRecordsByCampaignId = async (campaignId, query = {}, currentUser = null) => {
  const { where } = await buildRewardRecordWhere(campaignId, query, currentUser)

  return prisma.rewardRecord.findMany({
    where,
    orderBy: {
      id: 'desc'
    },
    include: {
      tenant: true,
      campaign: true,
      prize: true,
      playRecord: {
        include: {
          serialCode: true
        }
      }
    }
  })
}

export const getPlayStatsByCampaignId = async (campaignId, currentUser = null) => {
  const campaign = await assertCampaignAccess(campaignId, currentUser)

  const baseWhere = {
    campaignId: campaign.id
  }

  if (campaign.tenantId) {
    baseWhere.tenantId = campaign.tenantId
  }

  const [total, win, lose, rewards, claimed] = await Promise.all([
    prisma.playRecord.count({
      where: baseWhere
    }),
    prisma.playRecord.count({
      where: {
        ...baseWhere,
        isWin: true
      }
    }),
    prisma.playRecord.count({
      where: {
        ...baseWhere,
        isWin: false
      }
    }),
    prisma.rewardRecord.count({
      where: baseWhere
    }),
    prisma.rewardRecord.count({
      where: {
        ...baseWhere,
        status: 'CLAIMED'
      }
    })
  ])

  return {
    campaignId: campaign.id,
    tenantId: campaign.tenantId || null,
    total,
    win,
    lose,
    rewards,
    claimed,
    pending: Math.max(0, rewards - claimed)
  }
}

export const createPlayRecord = async (campaignId, payload = {}, currentUser = null) => {
  const campaign = await assertCampaignAccess(campaignId, currentUser)
  const normalizedCampaignId = campaign.id
  const tenantId = campaign.tenantId || null

  const prizeId = payload.prizeId ? normalizeId(payload.prizeId) : null
  let prize = null

  if (prizeId) {
    prize = await prisma.prize.findFirst({
      where: {
        id: prizeId,
        campaignId: normalizedCampaignId,
        ...(tenantId ? { tenantId } : {})
      }
    })

    if (!prize) {
      const error = new Error('找不到獎項，或此獎項不屬於此活動')
      error.status = 404
      throw error
    }
  }

  const serialCodeId = payload.serialCodeId ? normalizeId(payload.serialCodeId) : null

  if (serialCodeId) {
    const serialCode = await prisma.serialCode.findFirst({
      where: {
        id: serialCodeId,
        campaignId: normalizedCampaignId,
        ...(tenantId ? { tenantId } : {})
      },
      select: {
        id: true
      }
    })

    if (!serialCode) {
      const error = new Error('找不到序號，或此序號不屬於此活動')
      error.status = 404
      throw error
    }
  }

  const isWin = payload.isWin !== undefined
    ? Boolean(payload.isWin)
    : !!prize && prize.type !== 'LOSE'

  return prisma.$transaction(async (tx) => {
    const playRecord = await tx.playRecord.create({
      data: {
        userId: payload.userId ? normalizeId(payload.userId) : null,
        campaignId: normalizedCampaignId,
        tenantId,
        prizeId,
        isWin,
        gameType: normalizeGameType(payload.gameType || campaign.gameType),
        status: normalizePlayStatus(payload.status),
        serialCodeId,
        playerName: payload.playerName || null,
        playerPhone: payload.playerPhone || null,
        playerEmail: payload.playerEmail || null,
        playerIp: payload.playerIp || null,
        userAgent: payload.userAgent || null,
        resultPayload: payload.resultPayload || {}
      },
      include: {
        prize: true,
        serialCode: true
      }
    })

    if (isWin && prizeId) {
      await tx.prize.update({
        where: {
          id: prizeId
        },
        data: {
          stockUsed: {
            increment: 1
          },
          remainStock: {
            decrement: prize?.remainStock > 0 ? 1 : 0
          }
        }
      })

      const rewardRecord = await tx.rewardRecord.create({
        data: {
          campaignId: normalizedCampaignId,
          tenantId,
          playRecordId: playRecord.id,
          prizeId,
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

      return {
        playRecord,
        rewardRecord
      }
    }

    return {
      playRecord,
      rewardRecord: null
    }
  })
}

export const claimRewardRecord = async (id, payload = {}, currentUser = null) => {
  const rewardRecord = await assertRewardRecordAccess(id, currentUser)

  return prisma.rewardRecord.update({
    where: {
      id: rewardRecord.id
    },
    data: {
      status: 'CLAIMED',
      claimedAt: new Date(),
      claimedBy: payload.claimedBy || currentUser?.email || currentUser?.name || 'admin',
      note: payload.note
    },
    include: {
      tenant: true,
      prize: true,
      playRecord: true
    }
  })
}

export const cancelRewardRecord = async (id, payload = {}, currentUser = null) => {
  const rewardRecord = await assertRewardRecordAccess(id, currentUser)

  return prisma.rewardRecord.update({
    where: {
      id: rewardRecord.id
    },
    data: {
      status: 'CANCELLED',
      note: payload.note || '已取消'
    },
    include: {
      tenant: true,
      prize: true,
      playRecord: true
    }
  })
}

export const exportPlayRecordsCsv = async (campaignId, query = {}, currentUser = null) => {
  const records = await getPlayRecordsByCampaignId(campaignId, query, currentUser)

  const rows = [
    [
      'id',
      'tenantId',
      'tenantName',
      'campaignId',
      'gameType',
      'isWin',
      'status',
      'prizeId',
      'prizeTitle',
      'serialCode',
      'playerName',
      'playerPhone',
      'playerEmail',
      'playedAt',
      'claimCode',
      'rewardStatus'
    ],
    ...records.map((record) => [
      record.id,
      record.tenantId || '',
      record.tenant?.name || '',
      record.campaignId,
      record.gameType,
      record.isWin ? 'WIN' : 'LOSE',
      record.status,
      record.prizeId || '',
      record.prize?.title || '',
      record.serialCode?.code || '',
      record.playerName || '',
      record.playerPhone || '',
      record.playerEmail || '',
      record.playedAt ? new Date(record.playedAt).toISOString() : '',
      record.rewardRecord?.claimCode || '',
      record.rewardRecord?.status || ''
    ])
  ]

  return rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n')
}
