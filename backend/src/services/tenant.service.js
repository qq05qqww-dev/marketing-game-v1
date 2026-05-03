// Multi Game Platform V2.3 Tenant Edition
// 第 12 批：商家管理員帳號修改與密碼重設版
//
// 建議放置位置：
// backend/src/services/tenant.service.js

import prisma from '../config/prisma.js'
import bcrypt from 'bcrypt'

const PLATFORM_ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN']
const MERCHANT_ROLES = ['MERCHANT_ADMIN', 'MERCHANT_STAFF']
const TENANT_ACCOUNT_ROLES = ['MERCHANT_ADMIN', 'MERCHANT_STAFF', 'USER']

const normalizeUserRole = (value) => {
  const role = String(value || 'MERCHANT_ADMIN').toUpperCase()

  if (MERCHANT_ROLES.includes(role)) {
    return role
  }

  return 'MERCHANT_ADMIN'
}

const normalizeTenantAccountRole = (value) => {
  const role = String(value || 'MERCHANT_ADMIN').toUpperCase()

  if (TENANT_ACCOUNT_ROLES.includes(role)) {
    return role
  }

  return 'MERCHANT_ADMIN'
}

const normalizeEmail = (value) => {
  return String(value || '').trim().toLowerCase()
}

const normalizePassword = (value) => {
  return String(value || '').trim()
}

const normalizeId = (value) => {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

const normalizeStatus = (value) => {
  const status = String(value || 'ACTIVE').toUpperCase()

  // 相容舊 UI 曾使用的 DISABLED / DRAFT，但 Prisma TenantStatus 以 ACTIVE / INACTIVE / SUSPENDED 為主。
  if (status === 'DISABLED' || status === 'INACTIVE') return 'INACTIVE'
  if (status === 'SUSPENDED') return 'SUSPENDED'

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

const normalizeCampaignStatus = (value) => {
  const status = String(value || 'ACTIVE').toUpperCase()

  if (['ACTIVE', 'DRAFT', 'INACTIVE', 'ENDED'].includes(status)) {
    return status
  }

  return 'ACTIVE'
}

const normalizeSerialCount = (value) => {
  const count = Number(value ?? 10)

  if (!Number.isFinite(count)) return 10

  return Math.min(100, Math.max(0, Math.floor(count)))
}

const toSafeUpperCode = (value) => {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12)
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

const buildDefaultGameConfigSettings = ({ tenant, campaign }) => {
  const tenantName = tenant?.name || '商家'

  return {
    pageTitle: `${tenantName}｜砸金蛋活動`,
    mainTitle: `${tenantName} 專屬砸金蛋活動`,
    subTitle: '輸入活動序號，砸開金蛋看看今天的好運。',
    heroTagline: '專屬活動・限時好禮',
    noticeText: '每組序號限活動規則內使用，獎項依現場庫存與系統紀錄為準。',
    serialTitle: '請輸入活動序號',
    serialPlaceholder: '例如：EGG-DEMO-0001',
    serialButtonText: '驗證序號並開始',
    serialHelpText: '序號可由店家、LINE 官方帳號或活動現場取得。',
    serialSuccessText: '序號驗證成功，可以開始砸金蛋。',
    serialErrorText: '序號無效、已使用或不屬於此活動。',
    activeText: '活動進行中',
    notStartedText: '活動尚未開始',
    endedText: '活動已結束',
    eggSize: 128,
    eggCardSize: 168,
    eggGridGap: 18,
    eggColorTop: '#fff7ad',
    eggColorMiddle: '#facc15',
    eggColorBottom: '#b45309',
    eggCardBgFrom: '#fff7ed',
    eggCardBgTo: '#fef3c7',
    eggNumberBgColor: '#7f1d1d',
    eggNumberTextColor: '#fff7ed',
    themeBgFrom: '#7f1d1d',
    themeBgMiddle: '#b91c1c',
    themeBgTo: '#f59e0b',
    themeAccentColor: '#facc15',
    themeButtonColor: '#dc2626',
    themeButtonDarkColor: '#991b1b',
    shareEnabled: true,
    shareTitle: `${tenantName} 專屬砸金蛋活動`,
    shareDescription: '快來參加專屬砸金蛋活動，把好禮帶回家。',
    shareImageUrl: '',
    shareButtonText: '分享活動',
    campaignId: campaign?.id || null,
    tenantId: tenant?.id || null,
    tenantSlug: tenant?.slug || ''
  }
}

const createDefaultPrizes = ({ tenantId, campaignId }) => {
  return [
    {
      tenantId,
      campaignId,
      title: '頭獎優惠券',
      shortName: '頭獎',
      description: '可自行修改為正式獎項。',
      icon: '🏆',
      type: 'WIN',
      status: 'ACTIVE',
      remainStock: 5,
      stockTotal: 5,
      stockUsed: 0,
      probability: 10,
      sortOrder: 1
    },
    {
      tenantId,
      campaignId,
      title: '二獎折價券',
      shortName: '二獎',
      description: '可自行修改為正式獎項。',
      icon: '🎁',
      type: 'WIN',
      status: 'ACTIVE',
      remainStock: 20,
      stockTotal: 20,
      stockUsed: 0,
      probability: 20,
      sortOrder: 2
    },
    {
      tenantId,
      campaignId,
      title: '小禮物',
      shortName: '小禮',
      description: '可自行修改為正式獎項。',
      icon: '✨',
      type: 'WIN',
      status: 'ACTIVE',
      remainStock: 50,
      stockTotal: 50,
      stockUsed: 0,
      probability: 30,
      sortOrder: 3
    },
    {
      tenantId,
      campaignId,
      title: '銘謝惠顧',
      shortName: '未中獎',
      description: '未中獎保底項目。',
      icon: '🥚',
      type: 'LOSE',
      status: 'ACTIVE',
      remainStock: 99999,
      stockTotal: 99999,
      stockUsed: 0,
      probability: 40,
      sortOrder: 99
    }
  ]
}

const createDefaultSerialCodes = ({ tenantId, campaignId, tenantSlug, count }) => {
  const safeCode = toSafeUpperCode(tenantSlug) || `T${tenantId}`

  return Array.from({ length: count }, (_, index) => {
    const number = String(index + 1).padStart(4, '0')

    return {
      tenantId,
      campaignId,
      code: `${safeCode}-EGG-${number}`,
      rewardChance: 1,
      status: 'UNUSED',
      batchCode: 'DEFAULT',
      note: '系統自動建立的預設測試序號，正式上線前可刪除或停用。',
      distributedChannel: 'SYSTEM'
    }
  })
}

const createMerchantAdminForTenant = async ({ tx, tenant, payload = {} }) => {
  const shouldCreate = payload.createAdminUser === true || payload.createAdminUser === 'true'

  if (!shouldCreate) {
    return null
  }

  const email = normalizeEmail(payload.adminEmail)
  const password = normalizePassword(payload.adminPassword || '123456')
  const name = String(payload.adminName || tenant.contactName || `${tenant.name} 管理員`).trim()
  const role = normalizeUserRole(payload.adminRole)

  if (!email) {
    const error = new Error('建立商家管理員帳號時，Email 不能空白')
    error.status = 400
    throw error
  }

  if (password.length < 6) {
    const error = new Error('建立商家管理員帳號時，初始密碼至少需要 6 個字元')
    error.status = 400
    throw error
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  return tx.user.create({
    data: {
      tenantId: tenant.id,
      name: name || `${tenant.name} 管理員`,
      email,
      password: hashedPassword,
      role,
      memberLevel: 'VIP',
      authProvider: 'EMAIL'
    },
    select: {
      id: true,
      tenantId: true,
      name: true,
      email: true,
      role: true,
      memberLevel: true,
      createdAt: true,
      updatedAt: true
    }
  })
}

const createDefaultCampaignForTenant = async ({ tx, tenant, payload = {} }) => {
  const shouldCreate = payload.createDefaultCampaign === true || payload.createDefaultCampaign === 'true'

  if (!shouldCreate) {
    return null
  }

  const now = new Date()
  const endAt = new Date(now)
  endAt.setDate(endAt.getDate() + 180)

  const campaignTitle = String(payload.defaultCampaignTitle || '').trim() || `${tenant.name} 砸金蛋活動`
  const campaignSlug = normalizeSlug(payload.defaultCampaignSlug || `${tenant.slug}-golden-egg`)
  const serialCount = normalizeSerialCount(payload.defaultSerialCount)

  const campaign = await tx.campaign.create({
    data: {
      tenantId: tenant.id,
      title: campaignTitle,
      slug: campaignSlug,
      description: '系統自動建立的預設砸金蛋活動，可由商家後台自行調整活動資料、前台設定、獎項與序號。',
      gameType: 'GOLDEN_EGG',
      status: normalizeCampaignStatus(payload.defaultCampaignStatus),
      startAt: now,
      endAt,
      dailyLimit: 1,
      totalLimit: 1,
      requireLogin: false,
      allowedRole: null,
      requiredLevel: null
    }
  })

  const settings = buildDefaultGameConfigSettings({
    tenant,
    campaign
  })

  const [gameConfig] = await Promise.all([
    tx.gameConfig.create({
      data: {
        tenantId: tenant.id,
        campaignId: campaign.id,
        settings
      }
    }),
    tx.prize.createMany({
      data: createDefaultPrizes({
        tenantId: tenant.id,
        campaignId: campaign.id
      })
    }),
    serialCount > 0
      ? tx.serialCode.createMany({
          data: createDefaultSerialCodes({
            tenantId: tenant.id,
            campaignId: campaign.id,
            tenantSlug: tenant.slug,
            count: serialCount
          }),
          skipDuplicates: true
        })
      : Promise.resolve({ count: 0 })
  ])

  return {
    campaign,
    gameConfig,
    serialCount,
    prizeCount: 4
  }
}

export const getTenantSummary = async (user) => {
  assertPlatformAdmin(user)

  const [total, active, inactive, suspended] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: 'ACTIVE' } }),
    prisma.tenant.count({ where: { status: 'INACTIVE' } }),
    prisma.tenant.count({ where: { status: 'SUSPENDED' } })
  ])

  return {
    total,
    active,
    inactive,
    disabled: inactive,
    suspended,
    draft: 0
  }
}

export const getTenants = async ({ user, query = {} } = {}) => {
  assertPlatformAdmin(user)

  const tenants = await prisma.tenant.findMany({
    where: buildTenantWhere(query),
    orderBy: [
      {
        id: 'desc'
      }
    ],
    include: {
      users: {
        orderBy: {
          id: 'desc'
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          memberLevel: true,
          createdAt: true,
          updatedAt: true
        },
        take: 3
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
          createdAt: true
        },
        take: 3
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
    recentUsers: tenant.users || [],
    recentCampaigns: tenant.campaigns || [],
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

  return prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name,
        slug,
        status: normalizeStatus(payload.status),
        contactName: payload.contactName ? String(payload.contactName).trim() : null,
        contactPhone: payload.contactPhone ? String(payload.contactPhone).trim() : null,
        contactEmail: payload.contactEmail ? String(payload.contactEmail).trim().toLowerCase() : null
      }
    })

    const adminUser = await createMerchantAdminForTenant({
      tx,
      tenant,
      payload
    })

    const defaultCampaign = await createDefaultCampaignForTenant({
      tx,
      tenant,
      payload
    })

    const freshTenant = await tx.tenant.findUnique({
      where: {
        id: tenant.id
      },
      include: {
        users: {
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            memberLevel: true,
            createdAt: true,
            updatedAt: true
          },
          take: 3
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
            createdAt: true
          },
          take: 3
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

    const messageParts = ['商家已建立']

    if (adminUser) {
      messageParts.push('已自動建立商家管理員帳號')
    }

    if (defaultCampaign) {
      messageParts.push('已自動建立預設砸金蛋活動')
    }

    return {
      tenant: freshTenant || tenant,
      adminUser,
      defaultCampaign,
      message: `${messageParts.join('，')}。`
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


const buildUserSelect = () => ({
  id: true,
  tenantId: true,
  name: true,
  email: true,
  role: true,
  memberLevel: true,
  authProvider: true,
  createdAt: true,
  updatedAt: true
})

const assertTenantExists = async (tenantId) => {
  const id = normalizeId(tenantId)

  if (!id) {
    const error = new Error('商家 ID 不正確')
    error.status = 400
    throw error
  }

  const tenant = await prisma.tenant.findUnique({
    where: {
      id
    }
  })

  if (!tenant) {
    const error = new Error('找不到商家')
    error.status = 404
    throw error
  }

  return tenant
}

export const getTenantUsers = async ({ user, tenantId } = {}) => {
  assertPlatformAdmin(user)
  const tenant = await assertTenantExists(tenantId)

  return prisma.user.findMany({
    where: {
      tenantId: tenant.id
    },
    orderBy: [
      { role: 'asc' },
      { id: 'desc' }
    ],
    select: buildUserSelect()
  })
}

export const createTenantUser = async ({ user, tenantId, payload = {} } = {}) => {
  assertPlatformAdmin(user)
  const tenant = await assertTenantExists(tenantId)

  const name = String(payload.name || `${tenant.name} 管理員`).trim()
  const email = normalizeEmail(payload.email)
  const password = normalizePassword(payload.password || '123456')
  const role = normalizeTenantAccountRole(payload.role)

  if (!email) {
    const error = new Error('帳號 Email 不能空白')
    error.status = 400
    throw error
  }

  if (password.length < 6) {
    const error = new Error('初始密碼至少需要 6 個字元')
    error.status = 400
    throw error
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  return prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: name || `${tenant.name} 管理員`,
      email,
      password: hashedPassword,
      role,
      memberLevel: 'VIP',
      authProvider: 'EMAIL'
    },
    select: buildUserSelect()
  })
}

export const updateTenantUser = async ({ user, tenantId, userId, payload = {} } = {}) => {
  assertPlatformAdmin(user)
  const tenant = await assertTenantExists(tenantId)
  const id = normalizeId(userId)

  if (!id) {
    const error = new Error('帳號 ID 不正確')
    error.status = 400
    throw error
  }

  const targetUser = await prisma.user.findFirst({
    where: {
      id,
      tenantId: tenant.id
    }
  })

  if (!targetUser) {
    const error = new Error('找不到此商家的帳號')
    error.status = 404
    throw error
  }

  const data = {}

  if (payload.name !== undefined) {
    const name = String(payload.name || '').trim()

    if (!name) {
      const error = new Error('帳號姓名不能空白')
      error.status = 400
      throw error
    }

    data.name = name
  }

  if (payload.email !== undefined) {
    const email = normalizeEmail(payload.email)

    if (!email) {
      const error = new Error('帳號 Email 不能空白')
      error.status = 400
      throw error
    }

    data.email = email
  }

  if (payload.role !== undefined) {
    data.role = normalizeTenantAccountRole(payload.role)
  }

  if (payload.password !== undefined && String(payload.password || '').trim()) {
    const password = normalizePassword(payload.password)

    if (password.length < 6) {
      const error = new Error('新密碼至少需要 6 個字元')
      error.status = 400
      throw error
    }

    data.password = await bcrypt.hash(password, 10)
    data.authProvider = 'EMAIL'
  }

  return prisma.user.update({
    where: {
      id
    },
    data,
    select: buildUserSelect()
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
