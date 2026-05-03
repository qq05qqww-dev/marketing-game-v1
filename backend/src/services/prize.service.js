// Multi Game Platform V2.3 Tenant Edition
// 第 4 批：Prize 獎項 API 依 tenantId 隔離版
//
// 建議放置位置：
// backend/src/services/prize.service.js

import prisma from '../lib/prisma.js'

const SUPER_ADMIN_ROLES = new Set(['SUPER_ADMIN', 'ADMIN'])
const MERCHANT_ROLES = new Set(['MERCHANT_ADMIN', 'MERCHANT_STAFF'])

const normalizeId = (id) => {
  const normalizedId = Number(id)

  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    return null
  }

  return normalizedId
}

const normalizePrizeType = (type) => {
  const value = String(type || 'WIN').toUpperCase()

  return value === 'LOSE' ? 'LOSE' : 'WIN'
}

const normalizePrizeStatus = (status) => {
  const value = String(status || 'ACTIVE').toUpperCase()

  return value === 'DISABLED' ? 'DISABLED' : 'ACTIVE'
}

const normalizeProbability = (value) => {
  const probability = Number(value ?? 0)

  if (Number.isNaN(probability)) return 0

  return Math.min(100, Math.max(0, probability))
}

const normalizeStock = (value) => {
  const stock = Number(value ?? 0)

  if (Number.isNaN(stock)) return 0

  return Math.max(0, Math.floor(stock))
}

const getRole = (authContext = null) => String(authContext?.role || '').toUpperCase()

const isSuperAdmin = (authContext = null) => {
  if (!authContext) return false

  return Boolean(authContext.isSuperAdmin) || SUPER_ADMIN_ROLES.has(getRole(authContext))
}

const isMerchantUser = (authContext = null) => {
  if (!authContext) return false

  return Boolean(authContext.isMerchantUser) || MERCHANT_ROLES.has(getRole(authContext))
}

const getTenantId = (authContext = null) => {
  const tenantId = Number(authContext?.tenantId)

  return Number.isInteger(tenantId) && tenantId > 0 ? tenantId : null
}

const forbidden = (message = '沒有權限操作此商家資料') => {
  const error = new Error(message)
  error.status = 403
  return error
}

const notFound = (message = '找不到資料') => {
  const error = new Error(message)
  error.status = 404
  return error
}

const buildCampaignAccessWhere = (campaignId, authContext = null, options = {}) => {
  const normalizedCampaignId = normalizeId(campaignId)

  if (!normalizedCampaignId) {
    const error = new Error('活動 ID 不正確')
    error.status = 400
    throw error
  }

  const where = {
    id: normalizedCampaignId
  }

  // 未登入前台公開讀取仍維持原本行為，避免正式前台突然無法讀獎項。
  if (!authContext && options.allowPublicRead) {
    return where
  }

  if (isSuperAdmin(authContext)) {
    return where
  }

  if (isMerchantUser(authContext)) {
    const tenantId = getTenantId(authContext)

    if (!tenantId) {
      throw forbidden('商家帳號缺少 tenantId，請重新登入或檢查帳號設定')
    }

    where.tenantId = tenantId
    return where
  }

  // 一般玩家或沒有商家身分的登入者，不能使用後台管理語意的查詢。
  if (authContext && !options.allowPlayerRead) {
    throw forbidden('目前帳號沒有獎項管理權限')
  }

  return where
}

const findCampaignForAccess = async (campaignId, authContext = null, options = {}) => {
  const where = buildCampaignAccessWhere(campaignId, authContext, options)

  const campaign = await prisma.campaign.findFirst({
    where,
    select: {
      id: true,
      tenantId: true,
      title: true,
      slug: true,
      status: true
    }
  })

  if (!campaign) {
    throw notFound('找不到活動，或此帳號沒有權限操作這個活動')
  }

  return campaign
}

const buildPrizeAccessWhere = (prizeId, authContext = null, options = {}) => {
  const normalizedPrizeId = normalizeId(prizeId)

  if (!normalizedPrizeId) {
    const error = new Error('獎項 ID 不正確')
    error.status = 400
    throw error
  }

  const where = {
    id: normalizedPrizeId
  }

  if (!authContext && options.allowPublicRead) {
    return where
  }

  if (isSuperAdmin(authContext)) {
    return where
  }

  if (isMerchantUser(authContext)) {
    const tenantId = getTenantId(authContext)

    if (!tenantId) {
      throw forbidden('商家帳號缺少 tenantId，請重新登入或檢查帳號設定')
    }

    where.tenantId = tenantId
    return where
  }

  if (authContext && !options.allowPlayerRead) {
    throw forbidden('目前帳號沒有獎項管理權限')
  }

  return where
}

const findPrizeForAccess = async (prizeId, authContext = null, options = {}) => {
  const where = buildPrizeAccessWhere(prizeId, authContext, options)

  const prize = await prisma.prize.findFirst({
    where,
    include: {
      campaign: {
        select: {
          id: true,
          tenantId: true,
          title: true,
          slug: true,
          status: true
        }
      },
      tenant: true
    }
  })

  if (!prize) {
    throw notFound('找不到獎項，或此帳號沒有權限操作這個獎項')
  }

  return prize
}

export const getPrizesByCampaignId = async (campaignId, query = {}, authContext = null) => {
  const campaign = await findCampaignForAccess(campaignId, authContext, {
    allowPublicRead: true,
    allowPlayerRead: true
  })

  const where = {
    campaignId: campaign.id
  }

  // 商家登入時，額外用 tenantId 雙重限制，避免用別人的 campaignId 撈到資料。
  if (campaign.tenantId) {
    where.tenantId = campaign.tenantId
  }

  if (query.status) {
    where.status = String(query.status).toUpperCase()
  }

  if (query.type) {
    where.type = String(query.type).toUpperCase()
  }

  return prisma.prize.findMany({
    where,
    orderBy: [
      {
        sortOrder: 'asc'
      },
      {
        id: 'asc'
      }
    ],
    include: {
      tenant: true
    }
  })
}

export const getPrizeById = async (id, authContext = null) => {
  try {
    return await findPrizeForAccess(id, authContext, {
      allowPublicRead: true,
      allowPlayerRead: true
    })
  } catch (error) {
    if (error.status === 404) return null
    throw error
  }
}

export const createPrizeForCampaign = async (campaignId, payload = {}, authContext = null) => {
  const campaign = await findCampaignForAccess(campaignId, authContext)

  const title = String(payload.title || payload.name || '').trim()

  if (!title) {
    const error = new Error('獎項名稱不能空白')
    error.status = 400
    throw error
  }

  const stockTotal = normalizeStock(payload.stockTotal ?? payload.remainStock ?? 0)
  const remainStock = normalizeStock(payload.remainStock ?? stockTotal)

  return prisma.prize.create({
    data: {
      campaignId: campaign.id,
      tenantId: campaign.tenantId || null,
      title,
      remainStock,
      probability: normalizeProbability(payload.probability),
      shortName: payload.shortName || null,
      description: payload.description || null,
      imageUrl: payload.imageUrl || null,
      icon: payload.icon || null,
      type: normalizePrizeType(payload.type),
      status: normalizePrizeStatus(payload.status),
      stockTotal,
      stockUsed: normalizeStock(payload.stockUsed),
      sortOrder: Number(payload.sortOrder ?? 0)
    },
    include: {
      tenant: true,
      campaign: true
    }
  })
}

export const updatePrize = async (id, payload = {}, authContext = null) => {
  const prize = await findPrizeForAccess(id, authContext)
  const data = {}

  if (payload.title !== undefined || payload.name !== undefined) {
    const title = String(payload.title || payload.name || '').trim()

    if (!title) {
      const error = new Error('獎項名稱不能空白')
      error.status = 400
      throw error
    }

    data.title = title
  }

  if (payload.remainStock !== undefined) {
    data.remainStock = normalizeStock(payload.remainStock)
  }

  if (payload.probability !== undefined) {
    data.probability = normalizeProbability(payload.probability)
  }

  if (payload.shortName !== undefined) {
    data.shortName = payload.shortName || null
  }

  if (payload.description !== undefined) {
    data.description = payload.description || null
  }

  if (payload.imageUrl !== undefined) {
    data.imageUrl = payload.imageUrl || null
  }

  if (payload.icon !== undefined) {
    data.icon = payload.icon || null
  }

  if (payload.type !== undefined) {
    data.type = normalizePrizeType(payload.type)
  }

  if (payload.status !== undefined) {
    data.status = normalizePrizeStatus(payload.status)
  }

  if (payload.stockTotal !== undefined) {
    data.stockTotal = normalizeStock(payload.stockTotal)
  }

  if (payload.stockUsed !== undefined) {
    data.stockUsed = normalizeStock(payload.stockUsed)
  }

  if (payload.sortOrder !== undefined) {
    data.sortOrder = Number(payload.sortOrder || 0)
  }

  return prisma.prize.update({
    where: {
      id: prize.id
    },
    data,
    include: {
      tenant: true,
      campaign: true
    }
  })
}

export const deletePrize = async (id, authContext = null) => {
  const prize = await findPrizeForAccess(id, authContext)

  return prisma.prize.delete({
    where: {
      id: prize.id
    }
  })
}

export const bulkUpdatePrizes = async (campaignId, prizes = [], authContext = null) => {
  const campaign = await findCampaignForAccess(campaignId, authContext)

  if (!Array.isArray(prizes)) {
    const error = new Error('獎項資料必須是陣列')
    error.status = 400
    throw error
  }

  const results = []

  for (const prize of prizes) {
    if (prize.id) {
      const existingPrize = await findPrizeForAccess(prize.id, authContext)

      if (existingPrize.campaignId !== campaign.id) {
        throw forbidden('不能把其他活動的獎項批次儲存到目前活動')
      }

      const updatedPrize = await updatePrize(prize.id, prize, authContext)
      results.push(updatedPrize)
    } else {
      const createdPrize = await createPrizeForCampaign(campaign.id, prize, authContext)
      results.push(createdPrize)
    }
  }

  return results
}

export const getProbabilitySummary = async (campaignId, authContext = null) => {
  const prizes = await getPrizesByCampaignId(campaignId, {}, authContext)

  const totalProbability = prizes.reduce((sum, prize) => {
    return sum + Number(prize.probability || 0)
  }, 0)

  return {
    campaignId: Number(campaignId),
    totalProbability,
    isValid: Math.abs(totalProbability - 100) < 0.0001,
    prizeCount: prizes.length,
    activePrizeCount: prizes.filter((prize) => prize.status === 'ACTIVE').length,
    winPrizeCount: prizes.filter((prize) => prize.type === 'WIN').length,
    losePrizeCount: prizes.filter((prize) => prize.type === 'LOSE').length
  }
}
