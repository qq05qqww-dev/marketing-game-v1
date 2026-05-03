// Multi Game Platform V2.3 Tenant Edition
// 第 3 批：Campaign / GameConfig Service tenantId 資料隔離版
//
// 覆蓋位置：
// backend/src/services/campaign.service.js

import prisma from '../lib/prisma.js'

const PLATFORM_ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN'])
const TENANT_ADMIN_ROLES = new Set(['MERCHANT_ADMIN', 'MERCHANT_STAFF'])

const normalizeCampaignId = (id) => {
  const campaignId = Number(id)

  if (!Number.isInteger(campaignId) || campaignId <= 0) {
    return null
  }

  return campaignId
}

const normalizeTenantId = (id) => {
  const tenantId = Number(id)

  if (!Number.isInteger(tenantId) || tenantId <= 0) {
    return null
  }

  return tenantId
}

const getUserRole = (user = null) => String(user?.role || '').toUpperCase()

export const isPlatformAdmin = (user = null) => {
  return PLATFORM_ADMIN_ROLES.has(getUserRole(user))
}

export const isTenantAdmin = (user = null) => {
  return TENANT_ADMIN_ROLES.has(getUserRole(user))
}

export const isTenantScopedUser = (user = null) => {
  return Boolean(user) && !isPlatformAdmin(user) && isTenantAdmin(user)
}

const getRequestTenantId = (user = null) => {
  return normalizeTenantId(user?.tenantId)
}

const createForbiddenError = (message = '沒有權限存取此商家的資料') => {
  const error = new Error(message)
  error.status = 403
  return error
}

const createValidationError = (message) => {
  const error = new Error(message)
  error.status = 400
  return error
}

const buildTenantWhere = (user = null) => {
  if (!user) return {}

  if (isPlatformAdmin(user)) {
    return {}
  }

  if (isTenantAdmin(user)) {
    const tenantId = getRequestTenantId(user)

    if (!tenantId) {
      throw createForbiddenError('此帳號尚未綁定商家，無法存取商家資料')
    }

    return { tenantId }
  }

  return {}
}

const resolveWritableTenantId = async (user = null, payload = {}) => {
  if (isPlatformAdmin(user)) {
    const payloadTenantId = normalizeTenantId(payload.tenantId)

    if (payloadTenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: {
          id: payloadTenantId
        }
      })

      if (!tenant) {
        throw createValidationError('指定的商家不存在')
      }

      return payloadTenantId
    }

    return null
  }

  if (isTenantAdmin(user)) {
    const tenantId = getRequestTenantId(user)

    if (!tenantId) {
      throw createForbiddenError('此帳號尚未綁定商家，無法建立或修改商家資料')
    }

    return tenantId
  }

  throw createForbiddenError('沒有建立或修改活動的權限')
}

const buildCampaignWhere = (query = {}, user = null) => {
  const where = {
    ...buildTenantWhere(user)
  }

  if (query.status) {
    where.status = String(query.status).toUpperCase()
  }

  if (query.gameType) {
    where.gameType = String(query.gameType).toUpperCase()
  }

  // 平台總管理員可用 ?tenantId= 指定查某商家。
  // 商家帳號不允許用 query 覆蓋自己的 tenantId。
  if (isPlatformAdmin(user) && query.tenantId) {
    const tenantId = normalizeTenantId(query.tenantId)

    if (tenantId) {
      where.tenantId = tenantId
    }
  }

  return where
}

const campaignInclude = {
  tenant: {
    select: {
      id: true,
      name: true,
      slug: true,
      status: true
    }
  },
  prizes: {
    orderBy: {
      id: 'asc'
    }
  },
  gameConfig: true
}

export const getCampaigns = async (query = {}, user = null) => {
  return prisma.campaign.findMany({
    where: buildCampaignWhere(query, user),
    orderBy: {
      id: 'desc'
    },
    include: campaignInclude
  })
}

export const getActiveCampaigns = async (user = null) => {
  return prisma.campaign.findMany({
    where: {
      ...buildTenantWhere(user),
      status: 'ACTIVE'
    },
    orderBy: {
      id: 'asc'
    },
    include: campaignInclude
  })
}

export const getCampaignById = async (id, user = null) => {
  const campaignId = normalizeCampaignId(id)

  if (!campaignId) return null

  return prisma.campaign.findFirst({
    where: {
      id: campaignId,
      ...buildTenantWhere(user)
    },
    include: campaignInclude
  })
}

export const createCampaign = async (payload = {}, user = null) => {
  const title = String(payload.title || payload.name || '').trim()
  const gameType = String(payload.gameType || 'GOLDEN_EGG').toUpperCase()
  const status = String(payload.status || 'DRAFT').toUpperCase()

  if (!title) {
    throw createValidationError('活動名稱不能空白')
  }

  const tenantId = await resolveWritableTenantId(user, payload)

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
      tenantId,
      startAt: payload.startAt ? new Date(payload.startAt) : null,
      endAt: payload.endAt ? new Date(payload.endAt) : null,
      dailyLimit: payload.dailyLimit ?? 3,
      totalLimit: payload.totalLimit ?? 10,
      requireLogin: payload.requireLogin ?? true,
      allowedRole: payload.allowedRole || null,
      requiredLevel: payload.requiredLevel || null,
      gameConfig: {
        create: {
          tenantId,
          settings: payload.settings || {}
        }
      }
    },
    include: campaignInclude
  })
}

export const updateCampaign = async (id, payload = {}, user = null) => {
  const campaignId = normalizeCampaignId(id)

  if (!campaignId) {
    throw createValidationError('活動 ID 不正確')
  }

  const existingCampaign = await getCampaignById(campaignId, user)

  if (!existingCampaign) {
    const error = new Error('找不到活動，或沒有權限修改此活動')
    error.status = 404
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

  // 只有平台管理員可以搬移活動歸屬商家。
  if (isPlatformAdmin(user) && payload.tenantId !== undefined) {
    data.tenantId = normalizeTenantId(payload.tenantId)
  }

  return prisma.campaign.update({
    where: {
      id: campaignId
    },
    data,
    include: campaignInclude
  })
}

export const getGameConfigByCampaignId = async (id, user = null) => {
  const campaignId = normalizeCampaignId(id)

  if (!campaignId) return null

  const campaign = await getCampaignById(campaignId, user)

  if (!campaign) return null

  return prisma.gameConfig.findUnique({
    where: {
      campaignId
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true
        }
      }
    }
  })
}

export const upsertGameConfigByCampaignId = async (id, settings = {}, user = null) => {
  const campaignId = normalizeCampaignId(id)

  if (!campaignId) {
    throw createValidationError('活動 ID 不正確')
  }

  const campaign = await getCampaignById(campaignId, user)

  if (!campaign) {
    const error = new Error('找不到活動，或沒有權限儲存此活動設定')
    error.status = 404
    throw error
  }

  return prisma.gameConfig.upsert({
    where: {
      campaignId
    },
    update: {
      tenantId: campaign.tenantId || null,
      settings
    },
    create: {
      campaignId,
      tenantId: campaign.tenantId || null,
      settings
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true
        }
      }
    }
  })
}

export const deleteCampaign = async (id, user = null) => {
  const campaignId = normalizeCampaignId(id)

  if (!campaignId) {
    throw createValidationError('活動 ID 不正確')
  }

  const existingCampaign = await getCampaignById(campaignId, user)

  if (!existingCampaign) {
    const error = new Error('找不到活動，或沒有權限刪除此活動')
    error.status = 404
    throw error
  }

  return prisma.campaign.delete({
    where: {
      id: campaignId
    }
  })
}
