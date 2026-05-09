// Multi Game Platform V2.3 Tenant Edition
// 第 29101～29500 批：SerialCode 手動指定序號 API 對齊版
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

const getPayloadSerialCode = (payload = {}) => {
  return normalizeCode(
    payload.code ||
      payload.serialCode ||
      payload.serial ||
      payload.value ||
      payload.manualCode ||
      payload.couponCode ||
      ''
  )
}

const getPayloadExpireAt = (payload = {}) => {
  return payload.expireAt || payload.expiresAt || payload.expiredAt || payload.expirationAt || null
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

const createDuplicateSerialError = (message = '此活動內已存在相同序號，請更換序號') => {
  const error = new Error(message)
  error.status = 400
  error.code = 'SERIAL_CODE_DUPLICATED_IN_CAMPAIGN'
  return error
}

const buildCampaignScopedSerialWhere = (campaign, codes) => {
  const where = {
    campaignId: campaign.id
  }

  if (Array.isArray(codes)) {
    where.code = {
      in: codes
    }
  } else {
    where.code = codes
  }

  if (campaign.tenantId) {
    where.tenantId = campaign.tenantId
  }

  return where
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
      status: true
    }
  })

  if (!campaign) {
    throw createForbiddenError()
  }

  // Public / front-end read or redeem API: no登入者時，維持舊前台可依 campaignId 使用。
  if (!currentUser) {
    return campaign
  }

  if (canAccessAllTenants(currentUser)) {
    return campaign
  }

  const userTenantId = getUserTenantId(currentUser)

  if (!userTenantId || Number(campaign.tenantId) !== userTenantId) {
    throw createForbiddenError()
  }

  return campaign
}

const assertSerialCodeAccess = async (id, currentUser = null) => {
  const serialCodeId = normalizeId(id)

  if (!serialCodeId) {
    const error = new Error('序號 ID 不正確')
    error.status = 400
    throw error
  }

  const serialCode = await prisma.serialCode.findUnique({
    where: {
      id: serialCodeId
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

  if (!serialCode) {
    const error = new Error('找不到序號')
    error.status = 404
    throw error
  }

  if (!currentUser || canAccessAllTenants(currentUser)) {
    return serialCode
  }

  const userTenantId = getUserTenantId(currentUser)
  const serialTenantId = Number(serialCode.tenantId || serialCode.campaign?.tenantId)

  if (!userTenantId || serialTenantId !== userTenantId) {
    const error = new Error('找不到序號，或此帳號沒有權限操作這組序號')
    error.status = 404
    throw error
  }

  return serialCode
}

const buildSerialCodeWhere = async (campaignId, query = {}, currentUser = null) => {
  const campaign = await assertCampaignAccess(campaignId, currentUser)

  const where = {
    campaignId: campaign.id
  }

  // 商家帳號查詢序號時，強制加 tenantId，避免不同商家資料混在一起。
  if (campaign.tenantId) {
    where.tenantId = campaign.tenantId
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

  return {
    campaign,
    where
  }
}

export const getSerialCodesByCampaignId = async (campaignId, query = {}, currentUser = null) => {
  const { where } = await buildSerialCodeWhere(campaignId, query, currentUser)

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

export const getSerialCodeStats = async (campaignId, currentUser = null) => {
  const serialCodes = await getSerialCodesByCampaignId(campaignId, {}, currentUser)

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

export const createSerialCodeForCampaign = async (campaignId, payload = {}, currentUser = null) => {
  const campaign = await assertCampaignAccess(campaignId, currentUser)
  const code = getPayloadSerialCode(payload)

  // 第 29101～29500 批：
  // 前端手動指定序號允許 4 碼以上，例如 7777、VIP1、A001。
  if (!code || code.length < 4) {
    const error = new Error('序號不能空白，且至少需要 4 個字元')
    error.status = 400
    throw error
  }

  const existingSerialCode = await prisma.serialCode.findFirst({
    where: buildCampaignScopedSerialWhere(campaign, code),
    select: {
      id: true
    }
  })

  if (existingSerialCode) {
    throw createDuplicateSerialError()
  }

  return prisma.serialCode.create({
    data: {
      campaignId: campaign.id,
      tenantId: campaign.tenantId || null,
      code,
      rewardChance: normalizeRewardChance(payload.rewardChance),
      status: normalizeStatus(payload.status),
      batchCode: payload.batchCode ? String(payload.batchCode).trim() : null,
      note: payload.note || null,
      distributedAt: parseDateOrNull(payload.distributedAt),
      distributedTo: payload.distributedTo || null,
      distributedChannel: payload.distributedChannel || null,
      expireAt: parseDateOrNull(getPayloadExpireAt(payload))
    }
  })
}

export const bulkCreateSerialCodesForCampaign = async (campaignId, payload = {}, currentUser = null) => {
  const campaign = await assertCampaignAccess(campaignId, currentUser)

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
    where: buildCampaignScopedSerialWhere(campaign, normalizedCodes),
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
      campaignId: campaign.id,
      tenantId: campaign.tenantId || null,
      code,
      rewardChance: normalizeRewardChance(payload.rewardChance),
      status: 'UNUSED',
      batchCode: payload.batchCode ? String(payload.batchCode).trim() : null,
      note: payload.note || null,
      expireAt: parseDateOrNull(payload.expireAt)
    })),
    skipDuplicates: true
  })

  const createdWhere = {
    campaignId: campaign.id,
    code: {
      in: newCodes
    }
  }

  if (campaign.tenantId) {
    createdWhere.tenantId = campaign.tenantId
  }

  const created = await prisma.serialCode.findMany({
    where: createdWhere,
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

export const generateSerialCodesForCampaign = async (campaignId, payload = {}, currentUser = null) => {
  const campaign = await assertCampaignAccess(campaignId, currentUser)

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
    where: buildCampaignScopedSerialWhere(campaign, codes),
    select: {
      code: true
    }
  })

  const existingSet = new Set(existing.map((item) => item.code))
  const newCodes = codes.filter((code) => !existingSet.has(code))

  await prisma.serialCode.createMany({
    data: newCodes.map((code) => ({
      campaignId: campaign.id,
      tenantId: campaign.tenantId || null,
      code,
      rewardChance,
      status: 'UNUSED',
      batchCode: batchCode ? String(batchCode).trim() : null,
      note,
      expireAt
    })),
    skipDuplicates: true
  })

  const createdWhere = {
    campaignId: campaign.id,
    code: {
      in: newCodes
    }
  }

  if (campaign.tenantId) {
    createdWhere.tenantId = campaign.tenantId
  }

  const created = await prisma.serialCode.findMany({
    where: createdWhere,
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

export const updateSerialCode = async (id, payload = {}, currentUser = null) => {
  const serialCode = await assertSerialCodeAccess(id, currentUser)
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
      id: serialCode.id
    },
    data
  })
}

export const markSerialCodeDistributed = async (id, payload = {}, currentUser = null) => {
  return updateSerialCode(id, {
    distributedAt: new Date(),
    distributedTo: payload.distributedTo || null,
    distributedChannel: payload.distributedChannel || null,
    note: payload.note
  }, currentUser)
}

export const bulkUpdateSerialCodesByIds = async (ids = [], payload = {}, currentUser = null) => {
  const normalizedIds = ids
    .map(normalizeId)
    .filter(Boolean)

  if (!normalizedIds.length) {
    const error = new Error('請提供要批次更新的序號 ID')
    error.status = 400
    throw error
  }

  const where = {
    id: {
      in: normalizedIds
    }
  }

  if (currentUser && !canAccessAllTenants(currentUser)) {
    const userTenantId = getUserTenantId(currentUser)

    if (!userTenantId) {
      const error = new Error('此帳號沒有商家權限，不能批次更新序號')
      error.status = 403
      throw error
    }

    where.tenantId = userTenantId
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
    where,
    data
  })

  const updated = await prisma.serialCode.findMany({
    where,
    orderBy: {
      id: 'desc'
    }
  })

  return {
    count: result.count,
    updated
  }
}

export const bulkUpdateSerialCodesByFilter = async (campaignId, query = {}, payload = {}, currentUser = null) => {
  const { where } = await buildSerialCodeWhere(campaignId, query, currentUser)

  const targets = await prisma.serialCode.findMany({
    where,
    select: {
      id: true
    }
  })

  return bulkUpdateSerialCodesByIds(targets.map((item) => item.id), payload, currentUser)
}

export const exportSerialCodesCsv = async (campaignId, query = {}, currentUser = null) => {
  const serialCodes = await getSerialCodesByCampaignId(campaignId, query, currentUser)

  const rows = [
    [
      'id',
      'tenantId',
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
      item.tenantId || '',
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
  const campaign = await assertCampaignAccess(campaignId, null)
  const code = normalizeCode(payload.code)

  if (!code) {
    const error = new Error('請輸入序號')
    error.status = 400
    throw error
  }

  const where = {
    campaignId: campaign.id,
    code
  }

  if (campaign.tenantId) {
    where.tenantId = campaign.tenantId
  }

  const serialCode = await prisma.serialCode.findFirst({
    where
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

export const deleteSerialCode = async (id, currentUser = null) => {
  const serialCode = await assertSerialCodeAccess(id, currentUser)

  return prisma.serialCode.delete({
    where: {
      id: serialCode.id
    }
  })
}
