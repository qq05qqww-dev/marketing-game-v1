// Multi Game Platform V2.2 Stable
// 第 309 批：SerialCode 序號 Service
//
// 建議放置位置：
// backend/src/services/serialCode.service.js

import crypto from 'crypto'
import prisma from '../lib/prisma.js'

const RANDOM_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

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

const normalizeStatus = (value) => {
  const status = String(value || '').toUpperCase()

  if (['UNUSED', 'USED', 'DISABLED', 'EXPIRED'].includes(status)) {
    return status
  }

  return 'UNUSED'
}

const normalizeRewardChance = (value) => {
  const rewardChance = Number(value ?? 1)

  if (Number.isNaN(rewardChance)) return 1

  return Math.min(99, Math.max(1, Math.floor(rewardChance)))
}

const parseDateOrNull = (value) => {
  if (!value) return null

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return null

  return date
}

const isExpired = (serialCode) => {
  if (!serialCode?.expireAt) return false

  return new Date(serialCode.expireAt).getTime() < Date.now()
}

const createSecureRandomText = (length = 18) => {
  const normalizedLength = Math.min(32, Math.max(12, Number(length || 18)))
  const bytes = crypto.randomBytes(normalizedLength)

  return Array.from(bytes, (byte) => RANDOM_CHARS[byte % RANDOM_CHARS.length]).join('')
}

const formatCodeBlocks = (value) => {
  return String(value || '')
    .replace(/(.{4})/g, '$1-')
    .replace(/-$/, '')
}

const buildSerialCode = ({ prefix = 'EGG', batchCode = '', length = 18 } = {}) => {
  const normalizedPrefix = normalizeCode(prefix).replaceAll('-', '').slice(0, 8) || 'EGG'
  const normalizedBatchCode = normalizeCode(batchCode).replaceAll('-', '').slice(0, 8)
  const randomText = formatCodeBlocks(createSecureRandomText(length))

  return [normalizedPrefix, normalizedBatchCode, randomText].filter(Boolean).join('-')
}

const getEffectiveStatus = (serialCode) => {
  if (!serialCode) return 'UNUSED'
  if (serialCode.status === 'USED' || serialCode.usedAt) return 'USED'
  if (serialCode.status === 'DISABLED') return 'DISABLED'
  if (isExpired(serialCode)) return 'EXPIRED'

  return serialCode.status || 'UNUSED'
}

const buildSerialCodeWhere = (campaignId, query = {}) => {
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
    where.status = normalizeStatus(query.status)
  }

  if (query.batchCode) {
    where.batchCode = String(query.batchCode).trim()
  }

  if (query.distributed === 'true') {
    where.distributedAt = {
      not: null
    }
  }

  if (query.distributed === 'false') {
    where.distributedAt = null
  }

  if (query.keyword) {
    const keyword = String(query.keyword).trim()

    where.OR = [
      {
        code: {
          contains: keyword,
          mode: 'insensitive'
        }
      },
      {
        batchCode: {
          contains: keyword,
          mode: 'insensitive'
        }
      },
      {
        note: {
          contains: keyword,
          mode: 'insensitive'
        }
      },
      {
        distributedTo: {
          contains: keyword,
          mode: 'insensitive'
        }
      },
      {
        distributedChannel: {
          contains: keyword,
          mode: 'insensitive'
        }
      }
    ]
  }

  return where
}

export const getSerialCodesByCampaignId = async (campaignId, query = {}) => {
  const where = buildSerialCodeWhere(campaignId, query)

  const serialCodes = await prisma.serialCode.findMany({
    where,
    orderBy: {
      id: 'desc'
    }
  })

  return serialCodes.map((item) => ({
    ...item,
    effectiveStatus: getEffectiveStatus(item)
  }))
}

export const getSerialCodeStats = async (campaignId) => {
  const serialCodes = await getSerialCodesByCampaignId(campaignId)

  const stats = {
    total: serialCodes.length,
    unused: 0,
    used: 0,
    disabled: 0,
    expired: 0,
    distributed: 0,
    undistributed: 0
  }

  serialCodes.forEach((item) => {
    const status = getEffectiveStatus(item)

    if (status === 'UNUSED') stats.unused += 1
    if (status === 'USED') stats.used += 1
    if (status === 'DISABLED') stats.disabled += 1
    if (status === 'EXPIRED') stats.expired += 1

    if (item.distributedAt) {
      stats.distributed += 1
    } else {
      stats.undistributed += 1
    }
  })

  return stats
}

export const createSerialCodeForCampaign = async (campaignId, payload = {}) => {
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

  const code = normalizeCode(payload.code)

  if (!code || code.length < 6) {
    const error = new Error('序號不能空白，且至少需要 6 個字元')
    error.status = 400
    throw error
  }

  return prisma.serialCode.create({
    data: {
      campaignId: normalizedCampaignId,
      code,
      rewardChance: normalizeRewardChance(payload.rewardChance),
      status: normalizeStatus(payload.status),
      batchCode: payload.batchCode ? String(payload.batchCode).trim() : null,
      note: payload.note || null,
      distributedAt: parseDateOrNull(payload.distributedAt),
      distributedTo: payload.distributedTo || null,
      distributedChannel: payload.distributedChannel || null,
      expireAt: parseDateOrNull(payload.expireAt)
    }
  })
}

export const bulkCreateSerialCodesForCampaign = async (campaignId, payload = {}) => {
  const normalizedCampaignId = normalizeId(campaignId)

  if (!normalizedCampaignId) {
    const error = new Error('活動 ID 不正確')
    error.status = 400
    throw error
  }

  const rawCodes = Array.isArray(payload.codes)
    ? payload.codes
    : String(payload.codesText || '')
      .split(/[\n,;，；\t ]+/)
      .map((code) => code.trim())
      .filter(Boolean)

  if (!rawCodes.length) {
    const error = new Error('請提供要新增的序號')
    error.status = 400
    throw error
  }

  const normalizedCodes = [...new Set(rawCodes.map(normalizeCode).filter((code) => code && code.length >= 6))]

  const existing = await prisma.serialCode.findMany({
    where: {
      code: {
        in: normalizedCodes
      }
    },
    select: {
      code: true
    }
  })

  const existingSet = new Set(existing.map((item) => item.code))
  const newCodes = normalizedCodes.filter((code) => !existingSet.has(code))

  if (!newCodes.length) {
    return {
      createdCount: 0,
      skippedCount: normalizedCodes.length,
      created: []
    }
  }

  await prisma.serialCode.createMany({
    data: newCodes.map((code) => ({
      campaignId: normalizedCampaignId,
      code,
      rewardChance: normalizeRewardChance(payload.rewardChance),
      status: 'UNUSED',
      batchCode: payload.batchCode ? String(payload.batchCode).trim() : null,
      note: payload.note || null,
      expireAt: parseDateOrNull(payload.expireAt)
    })),
    skipDuplicates: true
  })

  const created = await prisma.serialCode.findMany({
    where: {
      campaignId: normalizedCampaignId,
      code: {
        in: newCodes
      }
    },
    orderBy: {
      id: 'desc'
    }
  })

  return {
    createdCount: created.length,
    skippedCount: normalizedCodes.length - created.length,
    created
  }
}

export const generateSerialCodesForCampaign = async (campaignId, payload = {}) => {
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

  const count = Math.min(500, Math.max(1, Number(payload.count || 1)))
  const rewardChance = normalizeRewardChance(payload.rewardChance)
  const prefix = payload.prefix || 'EGG'
  const batchCode = payload.batchCode || ''
  const length = payload.length || 18
  const expireAt = parseDateOrNull(payload.expireAt)
  const note = payload.note || null

  const generatedCodes = new Set()

  while (generatedCodes.size < count) {
    generatedCodes.add(buildSerialCode({ prefix, batchCode, length }))
  }

  const codes = Array.from(generatedCodes)
  const existing = await prisma.serialCode.findMany({
    where: {
      code: {
        in: codes
      }
    },
    select: {
      code: true
    }
  })

  const existingSet = new Set(existing.map((item) => item.code))
  const newCodes = codes.filter((code) => !existingSet.has(code))

  await prisma.serialCode.createMany({
    data: newCodes.map((code) => ({
      campaignId: normalizedCampaignId,
      code,
      rewardChance,
      status: 'UNUSED',
      batchCode: batchCode ? String(batchCode).trim() : null,
      note,
      expireAt
    })),
    skipDuplicates: true
  })

  const created = await prisma.serialCode.findMany({
    where: {
      campaignId: normalizedCampaignId,
      code: {
        in: newCodes
      }
    },
    orderBy: {
      id: 'desc'
    }
  })

  return {
    requestedCount: count,
    createdCount: created.length,
    skippedCount: count - created.length,
    created
  }
}

export const updateSerialCode = async (id, payload = {}) => {
  const serialCodeId = normalizeId(id)

  if (!serialCodeId) {
    const error = new Error('序號 ID 不正確')
    error.status = 400
    throw error
  }

  const data = {}

  if (payload.rewardChance !== undefined) {
    data.rewardChance = normalizeRewardChance(payload.rewardChance)
  }

  if (payload.status !== undefined) {
    data.status = normalizeStatus(payload.status)
  }

  if (payload.batchCode !== undefined) {
    data.batchCode = payload.batchCode || null
  }

  if (payload.note !== undefined) {
    data.note = payload.note || null
  }

  if (payload.distributedAt !== undefined) {
    data.distributedAt = parseDateOrNull(payload.distributedAt)
  }

  if (payload.distributedTo !== undefined) {
    data.distributedTo = payload.distributedTo || null
  }

  if (payload.distributedChannel !== undefined) {
    data.distributedChannel = payload.distributedChannel || null
  }

  if (payload.expireAt !== undefined) {
    data.expireAt = parseDateOrNull(payload.expireAt)
  }

  return prisma.serialCode.update({
    where: {
      id: serialCodeId
    },
    data
  })
}

export const markSerialCodeDistributed = async (id, payload = {}) => {
  return updateSerialCode(id, {
    distributedAt: new Date(),
    distributedTo: payload.distributedTo || null,
    distributedChannel: payload.distributedChannel || null,
    note: payload.note
  })
}

export const bulkUpdateSerialCodesByIds = async (ids = [], payload = {}) => {
  const normalizedIds = ids
    .map(normalizeId)
    .filter(Boolean)

  if (!normalizedIds.length) {
    const error = new Error('請提供要批次更新的序號 ID')
    error.status = 400
    throw error
  }

  const data = {}

  if (payload.status !== undefined) {
    data.status = normalizeStatus(payload.status)
  }

  if (payload.expireAt !== undefined) {
    data.expireAt = parseDateOrNull(payload.expireAt)
  }

  if (payload.distributed === true) {
    data.distributedAt = new Date()
    data.distributedTo = payload.distributedTo || null
    data.distributedChannel = payload.distributedChannel || null
  }

  if (payload.distributed === false) {
    data.distributedAt = null
    data.distributedTo = null
    data.distributedChannel = null
  }

  if (payload.note !== undefined) {
    data.note = payload.note || null
  }

  const result = await prisma.serialCode.updateMany({
    where: {
      id: {
        in: normalizedIds
      }
    },
    data
  })

  const updated = await prisma.serialCode.findMany({
    where: {
      id: {
        in: normalizedIds
      }
    },
    orderBy: {
      id: 'desc'
    }
  })

  return {
    count: result.count,
    updated
  }
}

export const bulkUpdateSerialCodesByFilter = async (campaignId, query = {}, payload = {}) => {
  const where = buildSerialCodeWhere(campaignId, query)

  const targets = await prisma.serialCode.findMany({
    where,
    select: {
      id: true
    }
  })

  return bulkUpdateSerialCodesByIds(targets.map((item) => item.id), payload)
}

export const exportSerialCodesCsv = async (campaignId, query = {}) => {
  const serialCodes = await getSerialCodesByCampaignId(campaignId, query)

  const rows = [
    [
      'id',
      'campaignId',
      'code',
      'rewardChance',
      'status',
      'effectiveStatus',
      'batchCode',
      'expireAt',
      'distributedAt',
      'distributedTo',
      'distributedChannel',
      'usedAt',
      'usedBy',
      'note',
      'createdAt',
      'updatedAt'
    ],
    ...serialCodes.map((item) => [
      item.id,
      item.campaignId,
      item.code,
      item.rewardChance,
      item.status,
      item.effectiveStatus,
      item.batchCode || '',
      item.expireAt ? new Date(item.expireAt).toISOString() : '',
      item.distributedAt ? new Date(item.distributedAt).toISOString() : '',
      item.distributedTo || '',
      item.distributedChannel || '',
      item.usedAt ? new Date(item.usedAt).toISOString() : '',
      item.usedBy || '',
      item.note || '',
      item.createdAt ? new Date(item.createdAt).toISOString() : '',
      item.updatedAt ? new Date(item.updatedAt).toISOString() : ''
    ])
  ]

  return rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n')
}

export const redeemSerialCode = async (campaignId, payload = {}) => {
  const normalizedCampaignId = normalizeId(campaignId)
  const code = normalizeCode(payload.code)

  if (!normalizedCampaignId) {
    const error = new Error('活動 ID 不正確')
    error.status = 400
    throw error
  }

  if (!code) {
    const error = new Error('請輸入序號')
    error.status = 400
    throw error
  }

  const serialCode = await prisma.serialCode.findFirst({
    where: {
      campaignId: normalizedCampaignId,
      code
    }
  })

  if (!serialCode) {
    const error = new Error('序號不存在')
    error.status = 404
    throw error
  }

  const effectiveStatus = getEffectiveStatus(serialCode)

  if (effectiveStatus === 'USED') {
    const error = new Error('序號已使用')
    error.status = 409
    throw error
  }

  if (effectiveStatus === 'DISABLED') {
    const error = new Error('序號已停用')
    error.status = 409
    throw error
  }

  if (effectiveStatus === 'EXPIRED') {
    const error = new Error('序號已過期')
    error.status = 409
    throw error
  }

  const updated = await prisma.serialCode.update({
    where: {
      id: serialCode.id
    },
    data: {
      status: 'USED',
      usedAt: new Date(),
      usedBy: payload.usedBy || payload.playerPhone || payload.playerEmail || 'front-player'
    }
  })

  return {
    serialCode: updated,
    rewardChance: updated.rewardChance
  }
}

export const deleteSerialCode = async (id) => {
  const serialCodeId = normalizeId(id)

  if (!serialCodeId) {
    const error = new Error('序號 ID 不正確')
    error.status = 400
    throw error
  }

  return prisma.serialCode.delete({
    where: {
      id: serialCodeId
    }
  })
}
