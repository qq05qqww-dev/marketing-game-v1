// Multi Game Platform V2.3 Tenant Edition
// 第 9 批：商家管理 Service 基礎版
//
// 建議放置位置：
// backend/src/services/tenant.service.js

import prisma from '../config/prisma.js'

const PLATFORM_ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN']

const normalizeId = (value) => {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

const normalizeStatus = (value) => {
  const status = String(value || 'ACTIVE').toUpperCase()

  if (['ACTIVE', 'DISABLED', 'SUSPENDED', 'DRAFT'].includes(status)) {
    return status
  }

  return 'ACTIVE'
}

const normalizeSlug = (value) => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
}

const assertPlatformAdmin = (user = {}) => {
  const role = String(user?.role || '').toUpperCase()

  if (!PLATFORM_ADMIN_ROLES.includes(role)) {
    const error = new Error('只有平台總管理員可以操作商家管理')
    error.status = 403
    throw error
  }
}

const buildTenantWhere = (query = {}) => {
  const where = {}

  if (query.status) {
    where.status = normalizeStatus(query.status)
  }

  if (query.keyword) {
    const keyword = String(query.keyword).trim()

    if (keyword) {
      where.OR = [
        {
          name: {
            contains: keyword,
            mode: 'insensitive'
          }
        },
        {
          slug: {
            contains: keyword,
            mode: 'insensitive'
          }
        },
        {
          contactName: {
            contains: keyword,
            mode: 'insensitive'
          }
        },
        {
          contactEmail: {
            contains: keyword,
            mode: 'insensitive'
          }
        },
        {
          contactPhone: {
            contains: keyword,
            mode: 'insensitive'
          }
        }
      ]
    }
  }

  return where
}

export const getTenantSummary = async (user) => {
  assertPlatformAdmin(user)

  const [total, active, disabled, suspended, draft] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: 'ACTIVE' } }),
    prisma.tenant.count({ where: { status: 'DISABLED' } }),
    prisma.tenant.count({ where: { status: 'SUSPENDED' } }),
    prisma.tenant.count({ where: { status: 'DRAFT' } })
  ])

  return {
    total,
    active,
    disabled,
    suspended,
    draft
  }
}

export const getTenants = async ({ user, query = {} } = {}) => {
  assertPlatformAdmin(user)

  const tenants = await prisma.tenant.findMany({
    where: buildTenantWhere(query),
    orderBy: [
      {
        id: 'asc'
      }
    ],
    include: {
      _count: {
        select: {
          users: true,
          campaigns: true,
          prizes: true,
          serialCodes: true,
          playRecords: true,
          rewardRecords: true
        }
      }
    }
  })

  return tenants.map((tenant) => ({
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status,
    contactName: tenant.contactName || '',
    contactPhone: tenant.contactPhone || '',
    contactEmail: tenant.contactEmail || '',
    createdAt: tenant.createdAt,
    updatedAt: tenant.updatedAt,
    counts: {
      users: tenant._count?.users || 0,
      campaigns: tenant._count?.campaigns || 0,
      prizes: tenant._count?.prizes || 0,
      serialCodes: tenant._count?.serialCodes || 0,
      playRecords: tenant._count?.playRecords || 0,
      rewardRecords: tenant._count?.rewardRecords || 0
    }
  }))
}

export const getTenantById = async ({ user, tenantId } = {}) => {
  assertPlatformAdmin(user)

  const id = normalizeId(tenantId)

  if (!id) {
    const error = new Error('商家 ID 不正確')
    error.status = 400
    throw error
  }

  const tenant = await prisma.tenant.findUnique({
    where: {
      id
    },
    include: {
      users: {
        orderBy: {
          id: 'asc'
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          memberLevel: true,
          createdAt: true,
          updatedAt: true
        }
      },
      campaigns: {
        orderBy: {
          id: 'desc'
        },
        select: {
          id: true,
          title: true,
          slug: true,
          gameType: true,
          status: true,
          startAt: true,
          endAt: true,
          createdAt: true,
          updatedAt: true
        }
      },
      _count: {
        select: {
          users: true,
          campaigns: true,
          prizes: true,
          serialCodes: true,
          playRecords: true,
          rewardRecords: true
        }
      }
    }
  })

  if (!tenant) {
    const error = new Error('找不到商家')
    error.status = 404
    throw error
  }

  return tenant
}

export const createTenant = async ({ user, payload = {} } = {}) => {
  assertPlatformAdmin(user)

  const name = String(payload.name || '').trim()
  const slug = normalizeSlug(payload.slug || name)

  if (!name) {
    const error = new Error('商家名稱不能空白')
    error.status = 400
    throw error
  }

  if (!slug) {
    const error = new Error('商家 slug 不能空白')
    error.status = 400
    throw error
  }

  return prisma.tenant.create({
    data: {
      name,
      slug,
      status: normalizeStatus(payload.status),
      contactName: payload.contactName ? String(payload.contactName).trim() : null,
      contactPhone: payload.contactPhone ? String(payload.contactPhone).trim() : null,
      contactEmail: payload.contactEmail ? String(payload.contactEmail).trim().toLowerCase() : null
    }
  })
}

export const updateTenant = async ({ user, tenantId, payload = {} } = {}) => {
  assertPlatformAdmin(user)

  const id = normalizeId(tenantId)

  if (!id) {
    const error = new Error('商家 ID 不正確')
    error.status = 400
    throw error
  }

  const data = {}

  if (payload.name !== undefined) {
    const name = String(payload.name || '').trim()

    if (!name) {
      const error = new Error('商家名稱不能空白')
      error.status = 400
      throw error
    }

    data.name = name
  }

  if (payload.slug !== undefined) {
    const slug = normalizeSlug(payload.slug)

    if (!slug) {
      const error = new Error('商家 slug 不能空白')
      error.status = 400
      throw error
    }

    data.slug = slug
  }

  if (payload.status !== undefined) {
    data.status = normalizeStatus(payload.status)
  }

  if (payload.contactName !== undefined) {
    data.contactName = payload.contactName ? String(payload.contactName).trim() : null
  }

  if (payload.contactPhone !== undefined) {
    data.contactPhone = payload.contactPhone ? String(payload.contactPhone).trim() : null
  }

  if (payload.contactEmail !== undefined) {
    data.contactEmail = payload.contactEmail ? String(payload.contactEmail).trim().toLowerCase() : null
  }

  return prisma.tenant.update({
    where: {
      id
    },
    data
  })
}

export const deleteTenant = async ({ user, tenantId } = {}) => {
  assertPlatformAdmin(user)

  const id = normalizeId(tenantId)

  if (!id) {
    const error = new Error('商家 ID 不正確')
    error.status = 400
    throw error
  }

  const tenant = await prisma.tenant.findUnique({
    where: {
      id
    },
    include: {
      _count: {
        select: {
          users: true,
          campaigns: true,
          prizes: true,
          serialCodes: true,
          playRecords: true,
          rewardRecords: true
        }
      }
    }
  })

  if (!tenant) {
    const error = new Error('找不到商家')
    error.status = 404
    throw error
  }

  const hasRelatedData = Object.values(tenant._count || {}).some((count) => Number(count || 0) > 0)

  if (hasRelatedData) {
    const error = new Error('此商家已有帳號、活動或紀錄，請改用停用狀態，避免資料遺失')
    error.status = 409
    throw error
  }

  return prisma.tenant.delete({
    where: {
      id
    }
  })
}
