// Multi Game Platform V2.2 Stable
// 第 306 批：Campaign / GameConfig Service
//
// 建議放置位置：
// backend/src/services/campaign.service.js

import prisma from '../lib/prisma.js'

const normalizeCampaignId = (id) => {
  const campaignId = Number(id)

  if (!Number.isInteger(campaignId) || campaignId <= 0) {
    return null
  }

  return campaignId
}

const buildCampaignWhere = (query = {}) => {
  const where = {}

  if (query.status) {
    where.status = String(query.status).toUpperCase()
  }

  if (query.gameType) {
    where.gameType = String(query.gameType).toUpperCase()
  }

  return where
}

export const getCampaigns = async (query = {}) => {
  return prisma.campaign.findMany({
    where: buildCampaignWhere(query),
    orderBy: {
      id: 'desc'
    },
    include: {
      prizes: {
        orderBy: {
          id: 'asc'
        }
      },
      gameConfig: true
    }
  })
}

export const getActiveCampaigns = async () => {
  return prisma.campaign.findMany({
    where: {
      status: 'ACTIVE'
    },
    orderBy: {
      id: 'asc'
    },
    include: {
      prizes: {
        orderBy: {
          id: 'asc'
        }
      },
      gameConfig: true
    }
  })
}

export const getCampaignById = async (id) => {
  const campaignId = normalizeCampaignId(id)

  if (!campaignId) return null

  return prisma.campaign.findUnique({
    where: {
      id: campaignId
    },
    include: {
      prizes: {
        orderBy: {
          id: 'asc'
        }
      },
      gameConfig: true
    }
  })
}

export const createCampaign = async (payload = {}) => {
  const title = String(payload.title || payload.name || '').trim()
  const gameType = String(payload.gameType || 'GOLDEN_EGG').toUpperCase()
  const status = String(payload.status || 'DRAFT').toUpperCase()

  if (!title) {
    const error = new Error('活動名稱不能空白')
    error.status = 400
    throw error
  }

  const slug = payload.slug
    ? String(payload.slug).trim()
    : null

  return prisma.campaign.create({
    data: {
      title,
      slug,
      description: payload.description || null,
      gameType,
      status,
      startAt: payload.startAt ? new Date(payload.startAt) : null,
      endAt: payload.endAt ? new Date(payload.endAt) : null,
      dailyLimit: payload.dailyLimit ?? 3,
      totalLimit: payload.totalLimit ?? 10,
      requireLogin: payload.requireLogin ?? true,
      allowedRole: payload.allowedRole || null,
      requiredLevel: payload.requiredLevel || null,
      gameConfig: {
        create: {
          settings: payload.settings || {}
        }
      }
    },
    include: {
      gameConfig: true,
      prizes: true
    }
  })
}

export const updateCampaign = async (id, payload = {}) => {
  const campaignId = normalizeCampaignId(id)

  if (!campaignId) {
    const error = new Error('活動 ID 不正確')
    error.status = 400
    throw error
  }

  const data = {}

  if (payload.title !== undefined || payload.name !== undefined) {
    data.title = String(payload.title || payload.name || '').trim()
  }

  if (payload.slug !== undefined) {
    data.slug = payload.slug ? String(payload.slug).trim() : null
  }

  if (payload.description !== undefined) {
    data.description = payload.description || null
  }

  if (payload.gameType !== undefined) {
    data.gameType = String(payload.gameType).toUpperCase()
  }

  if (payload.status !== undefined) {
    data.status = String(payload.status).toUpperCase()
  }

  if (payload.startAt !== undefined) {
    data.startAt = payload.startAt ? new Date(payload.startAt) : null
  }

  if (payload.endAt !== undefined) {
    data.endAt = payload.endAt ? new Date(payload.endAt) : null
  }

  if (payload.dailyLimit !== undefined) {
    data.dailyLimit = payload.dailyLimit
  }

  if (payload.totalLimit !== undefined) {
    data.totalLimit = payload.totalLimit
  }

  if (payload.requireLogin !== undefined) {
    data.requireLogin = payload.requireLogin
  }

  if (payload.allowedRole !== undefined) {
    data.allowedRole = payload.allowedRole || null
  }

  if (payload.requiredLevel !== undefined) {
    data.requiredLevel = payload.requiredLevel || null
  }

  return prisma.campaign.update({
    where: {
      id: campaignId
    },
    data,
    include: {
      gameConfig: true,
      prizes: {
        orderBy: {
          id: 'asc'
        }
      }
    }
  })
}

export const getGameConfigByCampaignId = async (id) => {
  const campaignId = normalizeCampaignId(id)

  if (!campaignId) return null

  return prisma.gameConfig.findUnique({
    where: {
      campaignId
    }
  })
}

export const upsertGameConfigByCampaignId = async (id, settings = {}) => {
  const campaignId = normalizeCampaignId(id)

  if (!campaignId) {
    const error = new Error('活動 ID 不正確')
    error.status = 400
    throw error
  }

  const campaign = await prisma.campaign.findUnique({
    where: {
      id: campaignId
    }
  })

  if (!campaign) {
    const error = new Error('找不到活動')
    error.status = 404
    throw error
  }

  return prisma.gameConfig.upsert({
    where: {
      campaignId
    },
    update: {
      settings
    },
    create: {
      campaignId,
      settings
    }
  })
}

export const deleteCampaign = async (id) => {
  const campaignId = normalizeCampaignId(id)

  if (!campaignId) {
    const error = new Error('活動 ID 不正確')
    error.status = 400
    throw error
  }

  return prisma.campaign.delete({
    where: {
      id: campaignId
    }
  })
}
