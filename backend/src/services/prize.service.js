// Multi Game Platform V2.2 Stable
// 第 307 批：Prize 獎項 Service
//
// 建議放置位置：
// backend/src/services/prize.service.js

import prisma from '../lib/prisma.js'

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

export const getPrizesByCampaignId = async (campaignId, query = {}) => {
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
    ]
  })
}

export const getPrizeById = async (id) => {
  const prizeId = normalizeId(id)

  if (!prizeId) return null

  return prisma.prize.findUnique({
    where: {
      id: prizeId
    },
    include: {
      campaign: true
    }
  })
}

export const createPrizeForCampaign = async (campaignId, payload = {}) => {
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
      campaignId: normalizedCampaignId,
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
    }
  })
}

export const updatePrize = async (id, payload = {}) => {
  const prizeId = normalizeId(id)

  if (!prizeId) {
    const error = new Error('獎項 ID 不正確')
    error.status = 400
    throw error
  }

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
      id: prizeId
    },
    data
  })
}

export const deletePrize = async (id) => {
  const prizeId = normalizeId(id)

  if (!prizeId) {
    const error = new Error('獎項 ID 不正確')
    error.status = 400
    throw error
  }

  return prisma.prize.delete({
    where: {
      id: prizeId
    }
  })
}

export const bulkUpdatePrizes = async (campaignId, prizes = []) => {
  const normalizedCampaignId = normalizeId(campaignId)

  if (!normalizedCampaignId) {
    const error = new Error('活動 ID 不正確')
    error.status = 400
    throw error
  }

  if (!Array.isArray(prizes)) {
    const error = new Error('獎項資料必須是陣列')
    error.status = 400
    throw error
  }

  const results = []

  for (const prize of prizes) {
    if (prize.id) {
      const updatedPrize = await updatePrize(prize.id, prize)
      results.push(updatedPrize)
    } else {
      const createdPrize = await createPrizeForCampaign(normalizedCampaignId, prize)
      results.push(createdPrize)
    }
  }

  return results
}

export const getProbabilitySummary = async (campaignId) => {
  const prizes = await getPrizesByCampaignId(campaignId)

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
