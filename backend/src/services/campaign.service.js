// Multi Game Platform V2.3 Tenant Edition
// 第 54001～54400 批：平台輪盤模板建立新商家活動時自動複製預設設定版
//
// 覆蓋位置：
// backend/src/services/campaign.service.js
//
// 本批重點：
// 1. 商家建立活動會正式寫入 PostgreSQL。
// 2. MERCHANT_ADMIN / MERCHANT_STAFF 會依 token 內 tenantId 或 tenantSlug 綁定自己的商家。
// 3. A 商家只能看到 / 修改 / 刪除 A 商家的活動；B 商家只能看到 B 商家的活動。
// 4. ADMIN / SUPER_ADMIN 可看全部，也可用 tenantId / tenantSlug 指定商家。
// 5. createCampaign 會同時建立 Campaign 與 GameConfig settings。
// 6. 刪除活動時會先檢查 tenant 權限，再用 transaction 清除相關資料。
//
// 第 19501～19900 批補強：
// - DELETE /api/campaigns/:id 會真正同步 PostgreSQL。
// - 先刪 RewardRecord / PlayRecord / UserReward / SerialCode / Prize / GameConfig / ShareRewardLog。
// - 最後刪 Campaign，避免舊資料庫 FK cascade 未套用時刪除失敗。

import prisma from '../lib/prisma.js'

const PLATFORM_ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN'])
const TENANT_ADMIN_ROLES = new Set(['MERCHANT_ADMIN', 'MERCHANT_STAFF'])
const SUPPORTED_GAME_TYPES = new Set(['WHEEL', 'SCRATCH', 'FLIP', 'GRID', 'GOLDEN_EGG'])
const SUPPORTED_CAMPAIGN_STATUSES = new Set(['DRAFT', 'ACTIVE', 'INACTIVE', 'ENDED'])

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

const normalizeTenantSlug = (value) => {
  const slug = String(value || '').trim().toLowerCase()

  return slug || null
}

const normalizeGameType = (value) => {
  const gameType = String(value || 'GRID').trim().toUpperCase()

  return SUPPORTED_GAME_TYPES.has(gameType) ? gameType : 'GRID'
}

const normalizeCampaignStatus = (value) => {
  const status = String(value || 'ACTIVE').trim().toUpperCase()

  return SUPPORTED_CAMPAIGN_STATUSES.has(status) ? status : 'ACTIVE'
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

const createNotFoundError = (message) => {
  const error = new Error(message)
  error.status = 404
  return error
}

const getUserTenantId = (user = null) => {
  return normalizeTenantId(user?.tenantId || user?.tenant?.id)
}

const getUserTenantSlug = (user = null) => {
  return normalizeTenantSlug(
    user?.tenantSlug ||
    user?.merchantSlug ||
    user?.tenant?.slug ||
    user?.tenant?.tenantSlug
  )
}

const findTenantIdBySlug = async (tenantSlug) => {
  const slug = normalizeTenantSlug(tenantSlug)

  if (!slug) return null

  const tenant = await prisma.tenant.findUnique({
    where: {
      slug
    },
    select: {
      id: true
    }
  })

  return tenant?.id || null
}

const assertTenantExists = async (tenantId) => {
  const normalizedTenantId = normalizeTenantId(tenantId)

  if (!normalizedTenantId) return null

  const tenant = await prisma.tenant.findUnique({
    where: {
      id: normalizedTenantId
    },
    select: {
      id: true
    }
  })

  if (!tenant) {
    throw createValidationError('指定的商家不存在')
  }

  return tenant.id
}

const resolveUserTenantId = async (user = null) => {
  const tenantId = getUserTenantId(user)

  if (tenantId) {
    return assertTenantExists(tenantId)
  }

  const tenantSlug = getUserTenantSlug(user)

  if (tenantSlug) {
    const resolvedTenantId = await findTenantIdBySlug(tenantSlug)

    if (resolvedTenantId) {
      return resolvedTenantId
    }
  }

  return null
}

const resolvePayloadTenantId = async (payload = {}) => {
  const payloadTenantId = normalizeTenantId(payload.tenantId)

  if (payloadTenantId) {
    return assertTenantExists(payloadTenantId)
  }

  const payloadTenantSlug = normalizeTenantSlug(
    payload.tenantSlug ||
    payload.merchantSlug ||
    payload.tenant?.slug
  )

  if (payloadTenantSlug) {
    const tenantId = await findTenantIdBySlug(payloadTenantSlug)

    if (!tenantId) {
      throw createValidationError('指定的商家代碼不存在')
    }

    return tenantId
  }

  return null
}

const resolveWritableTenantId = async (user = null, payload = {}) => {
  if (isPlatformAdmin(user)) {
    return resolvePayloadTenantId(payload)
  }

  if (isTenantAdmin(user)) {
    const tenantId = await resolveUserTenantId(user)

    if (!tenantId) {
      throw createForbiddenError('此帳號尚未綁定商家，無法建立或修改商家資料')
    }

    return tenantId
  }

  throw createForbiddenError('沒有建立或修改活動的權限')
}

const buildTenantWhere = async (user = null) => {
  if (!user) return {}

  if (isPlatformAdmin(user)) {
    return {}
  }

  if (isTenantAdmin(user)) {
    const tenantId = await resolveUserTenantId(user)

    if (!tenantId) {
      throw createForbiddenError('此帳號尚未綁定商家，無法存取商家資料')
    }

    return { tenantId }
  }

  return {}
}

const buildCampaignWhere = async (query = {}, user = null) => {
  const where = {
    ...(await buildTenantWhere(user))
  }

  if (query.status) {
    where.status = String(query.status).toUpperCase()
  }

  if (query.gameType) {
    where.gameType = normalizeGameType(query.gameType)
  }

  // 前台公開讀取或平台管理員可用 tenantSlug 找活動。
  // 商家帳號登入時仍以 token 內 tenantId / tenantSlug 為準，不允許 query 覆蓋。
  if ((isPlatformAdmin(user) || !user) && query.tenantSlug) {
    const tenantSlug = normalizeTenantSlug(query.tenantSlug)

    if (tenantSlug) {
      where.tenant = {
        slug: tenantSlug
      }
    }
  }

  // 平台總管理員可用 ?tenantId= 指定查某商家。
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

const sanitizeDate = (value) => {
  if (!value) return null

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

const normalizeSettings = (payload = {}) => {
  if (payload.settings && typeof payload.settings === 'object') {
    return payload.settings
  }

  return {}
}

const normalizeGameConfigSettings = (payload = {}) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {}
  }

  if (payload.settings && typeof payload.settings === 'object' && !Array.isArray(payload.settings)) {
    return payload.settings
  }

  return payload
}


const isPlainObject = (value) => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const deepClone = (value) => {
  if (!isPlainObject(value) && !Array.isArray(value)) return value
  return JSON.parse(JSON.stringify(value))
}

const deepMergePlainObject = (base = {}, override = {}) => {
  const merged = deepClone(base) || {}

  if (!isPlainObject(override)) {
    return merged
  }

  Object.entries(override).forEach(([key, value]) => {
    if (isPlainObject(value) && isPlainObject(merged[key])) {
      merged[key] = deepMergePlainObject(merged[key], value)
      return
    }

    merged[key] = deepClone(value)
  })

  return merged
}

const hasMeaningfulSettings = (settings = {}) => {
  return isPlainObject(settings) && Object.keys(settings).length > 0
}

const getPlatformWheelTemplateDefaults = () => ({
  pageTitle: '幸運輪盤抽獎',
  brandName: 'Multi Game Platform',
  brandSubtitle: '打造專屬互動抽獎體驗',
  brandLogoUrl: '',
  brandLinkUrl: '',
  brandLinkText: '官方品牌',
  brandLogoSize: 64,
  brandTitleSize: 20,
  brandTextColor: '#ffffff',
  brandButtonBgColor: '#ffffff',
  brandButtonTextColor: '#c2410c',
  brandButtonTextSize: 12,
  headline: '幸運輪盤抽獎',
  subtitle: '轉出你的專屬驚喜',
  badgeText: '輸入序號後即可轉盤抽獎',
  serialTitle: '輸入序號開始轉盤',
  serialHint: '請輸入商家提供的序號，驗證成功後即可使用轉盤機會。',
  playButtonText: '開始轉盤',
  verifyButtonText: '驗證序號',
  resultTitle: '恭喜中獎',
  theme: {
    backgroundFrom: '#fff7ed',
    backgroundTo: '#f97316',
    panelColor: '#fed7aa',
    wheelOuterColor: '#f59e0b',
    pointerColor: '#dc2626',
    spinButtonColor: '#111827',
    actionButtonFrom: '#fb923c',
    actionButtonTo: '#dc2626'
  },
  display: {
    showBrandCard: true,
    showStatusCard: true,
    showRemainingChance: true,
    showSerialBox: true,
    showRules: true,
    showPrizeInfo: true,
    showPrizeShelf: false,
    showHistory: true,
    hidePrizesBeforeDraw: false,
    enableSound: true,
    showDebugInfo: false
  },
  wheelStyle: {
    wheelSize: 320,
    outerRingWidth: 12,
    centerButtonSize: 86,
    pointerSize: 42,
    prizeTextSize: 13,
    prizeIconSize: 38,
    cellGap: 2,
    prizeLabelRadius: 34,
    showPrizeIcon: true,
    showPrizeName: true,
    showSliceBorder: true
  },
  effects: {
    enableTickSound: true,
    enableResultSound: true,
    enablePointerShake: true,
    enableLightGlow: true,
    enableConfetti: true,
    enableSpinMask: true
  },
  content: {
    rulesTitle: '活動規則',
    rulesText: '請輸入商家提供的序號，驗證成功後即可開始轉盤。中獎後請依主辦單位公告方式兌換。',
    prizeInfoTitle: '獎品說明',
    prizeInfoText: '獎項、兌換方式與使用期限，以主辦單位現場或官方公告為準。',
    footerNote: '請依照活動規則參加抽獎；獎項與兌換方式以主辦單位公告為準。'
  },
  prizes: [
    { id: 1, icon: '🎁', imageUrl: '', linkUrl: '', name: '50 元折價券', weight: 35, color: '#facc15' },
    { id: 2, icon: '🎫', imageUrl: '', linkUrl: '', name: '100 元折價券', weight: 25, color: '#fb7185' },
    { id: 3, icon: '🏆', imageUrl: '', linkUrl: '', name: '200 元折價券', weight: 15, color: '#fb923c' },
    { id: 4, icon: '😊', imageUrl: '', linkUrl: '', name: '未中獎', weight: 25, color: '#ef4444' }
  ],
  templateMeta: {
    source: 'PLATFORM_WHEEL_TEMPLATE',
    cloneMode: 'CREATE_CAMPAIGN_ONLY',
    version: 'v23_batch54001_54400',
    note: '建立新輪盤活動時複製一次；之後商家活動與平台模板互相隔離。'
  }
})

const resolveInitialGameConfigSettings = (gameType, payload = {}) => {
  const normalizedSettings = normalizeSettings(payload)

  if (gameType !== 'WHEEL') {
    return normalizedSettings
  }

  const platformWheelTemplate = getPlatformWheelTemplateDefaults()

  if (!hasMeaningfulSettings(normalizedSettings)) {
    return platformWheelTemplate
  }

  // 若建立活動時已有局部 settings，仍以平台模板補齊缺少欄位，
  // 但保留呼叫端明確傳入的商家活動設定。
  return deepMergePlainObject(platformWheelTemplate, normalizedSettings)
}

const buildCampaignPatchFromSettings = (settings = {}) => {
  const data = {}

  const pageTitle = String(settings?.basicText?.pageTitle || '').trim()
  const headline = String(settings?.basicText?.headline || '').trim()

  if (pageTitle) {
    data.title = pageTitle
  } else if (headline) {
    data.title = headline
  }

  return data
}

export const getCampaigns = async (query = {}, user = null) => {
  return prisma.campaign.findMany({
    where: await buildCampaignWhere(query, user),
    orderBy: {
      id: 'desc'
    },
    include: campaignInclude
  })
}

export const getActiveCampaigns = async (user = null) => {
  return prisma.campaign.findMany({
    where: {
      ...(await buildTenantWhere(user)),
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
      ...(await buildTenantWhere(user))
    },
    include: campaignInclude
  })
}

export const createCampaign = async (payload = {}, user = null) => {
  const gameType = normalizeGameType(payload.gameType)
  const title = String(payload.title || payload.name || `${gameType} 抽獎活動`).trim()
  const status = normalizeCampaignStatus(payload.status || 'ACTIVE')
  const tenantId = await resolveWritableTenantId(user, payload)

  if (!title) {
    throw createValidationError('活動名稱不能空白')
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
      tenantId,
      startAt: sanitizeDate(payload.startAt),
      endAt: sanitizeDate(payload.endAt),
      dailyLimit: Number(payload.dailyLimit ?? 1),
      totalLimit: Number(payload.totalLimit ?? 1),
      requireLogin: Boolean(payload.requireLogin ?? false),
      allowedRole: payload.allowedRole || null,
      requiredLevel: payload.requiredLevel || null,
      gameConfig: {
        create: {
          tenantId,
          settings: resolveInitialGameConfigSettings(gameType, payload)
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
    throw createNotFoundError('找不到活動，或沒有權限修改此活動')
  }

  const data = {}

  if (payload.title !== undefined || payload.name !== undefined) {
    const title = String(payload.title || payload.name || '').trim()

    if (!title) {
      throw createValidationError('活動名稱不能空白')
    }

    data.title = title
  }

  if (payload.slug !== undefined) {
    data.slug = payload.slug ? String(payload.slug).trim() : null
  }

  if (payload.description !== undefined) {
    data.description = payload.description || null
  }

  if (payload.gameType !== undefined) {
    data.gameType = normalizeGameType(payload.gameType)
  }

  if (payload.status !== undefined) {
    data.status = normalizeCampaignStatus(payload.status)
  }

  if (payload.startAt !== undefined) {
    data.startAt = sanitizeDate(payload.startAt)
  }

  if (payload.endAt !== undefined) {
    data.endAt = sanitizeDate(payload.endAt)
  }

  if (payload.dailyLimit !== undefined) {
    data.dailyLimit = Number(payload.dailyLimit)
  }

  if (payload.totalLimit !== undefined) {
    data.totalLimit = Number(payload.totalLimit)
  }

  if (payload.requireLogin !== undefined) {
    data.requireLogin = Boolean(payload.requireLogin)
  }

  if (payload.allowedRole !== undefined) {
    data.allowedRole = payload.allowedRole || null
  }

  if (payload.requiredLevel !== undefined) {
    data.requiredLevel = payload.requiredLevel || null
  }

  // 只有平台管理員可以搬移活動歸屬商家。
  if (isPlatformAdmin(user) && (payload.tenantId !== undefined || payload.tenantSlug !== undefined)) {
    data.tenantId = await resolvePayloadTenantId(payload)
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
    throw createNotFoundError('找不到活動，或沒有權限儲存此活動設定')
  }

  const normalizedSettings = normalizeGameConfigSettings(settings)
  const campaignPatch = buildCampaignPatchFromSettings(normalizedSettings)

  return prisma.$transaction(async (tx) => {
    if (Object.keys(campaignPatch).length) {
      await tx.campaign.update({
        where: {
          id: campaignId
        },
        data: campaignPatch
      })
    }

    const gameConfig = await tx.gameConfig.upsert({
      where: {
        campaignId
      },
      update: {
        tenantId: campaign.tenantId || null,
        settings: normalizedSettings
      },
      create: {
        campaignId,
        tenantId: campaign.tenantId || null,
        settings: normalizedSettings
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true
          }
        },
        campaign: {
          select: {
            id: true,
            title: true,
            gameType: true,
            status: true,
            tenantId: true,
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true
              }
            }
          }
        }
      }
    })

    return {
      ...gameConfig,
      settings: normalizedSettings,
      savedAt: new Date().toISOString()
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
    throw createNotFoundError('找不到活動，或沒有權限刪除此活動')
  }

  const deletedSummary = await prisma.$transaction(async (tx) => {
    const rewardRecords = await tx.rewardRecord.deleteMany({
      where: {
        campaignId
      }
    })

    const playRecords = await tx.playRecord.deleteMany({
      where: {
        campaignId
      }
    })

    const userRewards = await tx.userReward.deleteMany({
      where: {
        campaignId
      }
    })

    const serialCodes = await tx.serialCode.deleteMany({
      where: {
        campaignId
      }
    })

    const prizes = await tx.prize.deleteMany({
      where: {
        campaignId
      }
    })

    const gameConfigs = await tx.gameConfig.deleteMany({
      where: {
        campaignId
      }
    })

    const shareRewardLogs = await tx.shareRewardLog.deleteMany({
      where: {
        campaignId
      }
    })

    const deletedCampaign = await tx.campaign.delete({
      where: {
        id: campaignId
      },
      select: {
        id: true,
        title: true,
        gameType: true,
        tenantId: true
      }
    })

    return {
      campaign: deletedCampaign,
      deletedCounts: {
        rewardRecords: rewardRecords.count,
        playRecords: playRecords.count,
        userRewards: userRewards.count,
        serialCodes: serialCodes.count,
        prizes: prizes.count,
        gameConfigs: gameConfigs.count,
        shareRewardLogs: shareRewardLogs.count,
        campaigns: 1
      }
    }
  })

  return {
    success: true,
    message: '活動與相關資料已從資料庫刪除',
    ...deletedSummary
  }
}

