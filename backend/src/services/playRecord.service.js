// Multi Game Platform V2.2 Stable
// 第 310 批：PlayRecord / RewardRecord Service
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

const buildPlayRecordWhere = (campaignId, query = {}) => {
  const normalizedCampaignId = normalizeId(campaignId)

  if (!normalizedCampaignId) {
    const error = new Error('活動 ID 不正確')
    error.status = 400
    throw error
  }

  const where = {
    campaignId: normalizedCampaignId
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

  return where
}

const buildRewardRecordWhere = (campaignId, query = {}) => {
  const normalizedCampaignId = normalizeId(campaignId)

  if (!normalizedCampaignId) {
    const error = new Error('活動 ID 不正確')
    error.status = 400
    throw error
  }

  const where = {
    campaignId: normalizedCampaignId
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

  return where
}

export const getPlayRecordsByCampaignId = async (campaignId, query = {}) => {
  const where = buildPlayRecordWhere(campaignId, query)

  return prisma.playRecord.findMany({
    where,
    orderBy: {
      id: 'desc'
    },
    include: {
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
          memberLevel: true
        }
      }
    }
  })
}

export const getRewardRecordsByCampaignId = async (campaignId, query = {}) => {
  const where = buildRewardRecordWhere(campaignId, query)

  return prisma.rewardRecord.findMany({
    where,
    orderBy: {
      id: 'desc'
    },
    include: {
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

export const getPlayStatsByCampaignId = async (campaignId) => {
  const normalizedCampaignId = normalizeId(campaignId)

  if (!normalizedCampaignId) {
    const error = new Error('活動 ID 不正確')
    error.status = 400
    throw error
  }

  const [total, win, lose, rewards, claimed] = await Promise.all([
    prisma.playRecord.count({
      where: {
        campaignId: normalizedCampaignId
      }
    }),
    prisma.playRecord.count({
      where: {
        campaignId: normalizedCampaignId,
        isWin: true
      }
    }),
    prisma.playRecord.count({
      where: {
        campaignId: normalizedCampaignId,
        isWin: false
      }
    }),
    prisma.rewardRecord.count({
      where: {
        campaignId: normalizedCampaignId
      }
    }),
    prisma.rewardRecord.count({
      where: {
        campaignId: normalizedCampaignId,
        status: 'CLAIMED'
      }
    })
  ])

  return {
    campaignId: normalizedCampaignId,
    total,
    win,
    lose,
    rewards,
    claimed,
    pending: Math.max(0, rewards - claimed)
  }
}

export const createPlayRecord = async (campaignId, payload = {}) => {
  const normalizedCampaignId = normalizeId(campaignId)

  if (!normalizedCampaignId) {
    const error = new Error('活動 ID 不正確')
    error.status = 400
    throw error
  }

  const campaign = await prisma.campaign.findUnique({
    where: {
      id: normalizedCampaignId
    }
  })

  if (!campaign) {
    const error = new Error('找不到活動')
    error.status = 404
    throw error
  }

  const prizeId = payload.prizeId ? normalizeId(payload.prizeId) : null
  let prize = null

  if (prizeId) {
    prize = await prisma.prize.findUnique({
      where: {
        id: prizeId
      }
    })

    if (!prize) {
      const error = new Error('找不到獎項')
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
        prizeId,
        isWin,
        gameType: normalizeGameType(payload.gameType || campaign.gameType),
        status: normalizePlayStatus(payload.status),
        serialCodeId: payload.serialCodeId ? normalizeId(payload.serialCodeId) : null,
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

export const claimRewardRecord = async (id, payload = {}) => {
  const rewardRecordId = normalizeId(id)

  if (!rewardRecordId) {
    const error = new Error('發獎紀錄 ID 不正確')
    error.status = 400
    throw error
  }

  return prisma.rewardRecord.update({
    where: {
      id: rewardRecordId
    },
    data: {
      status: 'CLAIMED',
      claimedAt: new Date(),
      claimedBy: payload.claimedBy || 'admin',
      note: payload.note
    },
    include: {
      prize: true,
      playRecord: true
    }
  })
}

export const cancelRewardRecord = async (id, payload = {}) => {
  const rewardRecordId = normalizeId(id)

  if (!rewardRecordId) {
    const error = new Error('發獎紀錄 ID 不正確')
    error.status = 400
    throw error
  }

  return prisma.rewardRecord.update({
    where: {
      id: rewardRecordId
    },
    data: {
      status: 'CANCELLED',
      note: payload.note || '已取消'
    },
    include: {
      prize: true,
      playRecord: true
    }
  })
}

export const exportPlayRecordsCsv = async (campaignId, query = {}) => {
  const records = await getPlayRecordsByCampaignId(campaignId, query)

  const rows = [
    [
      'id',
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
