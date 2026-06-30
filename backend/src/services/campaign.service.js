// Multi Game Platform V2.3 Tenant Edition
// 第 91201～91600 批：平台模板獎項與商家活動獎項獨立複製版
//
// 覆蓋位置：
// backend/src/services/campaign.service.js
//
// 本批重點：
// 1. 商家新建 WHEEL / GRID / GOLDEN_EGG 活動時，除了 GameConfig settings 之外，也會把平台模板獎項複製成該活動自己的 Prize records。
// 2. A 商家、B 商家獎項不再共用同一批 Prize ID；新增、編輯、刪除都只影響自己的 campaignId。
// 3. 平台模板本體只保存模板 settings，不建立商家 Prize records。
// 4. 既有商家活動不被自動覆蓋；只有新建活動時複製一次。
// 5. 不改 DB schema / router。

import prisma from '../lib/prisma.js'

const PLATFORM_ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN'])
const TENANT_ADMIN_ROLES = new Set(['MERCHANT_ADMIN', 'MERCHANT_STAFF'])
const SUPPORTED_GAME_TYPES = new Set(['WHEEL', 'SCRATCH', 'FLIP', 'GRID', 'GOLDEN_EGG'])
const SUPPORTED_CAMPAIGN_STATUSES = new Set(['DRAFT', 'ACTIVE', 'INACTIVE', 'ENDED'])
const PLATFORM_WHEEL_TEMPLATE_STORAGE_MODE = 'PLATFORM_WHEEL_TEMPLATE'
const PLATFORM_WHEEL_TEMPLATE_SLUG_PREFIX = 'platform-wheel-template-'
const PLATFORM_WHEEL_TEMPLATE_DEFAULT_ID = 'wheel'
const PLATFORM_PREMIUM_GRID_TEMPLATE_STORAGE_MODE = 'PLATFORM_PREMIUM_GRID_TEMPLATE'
const PLATFORM_PREMIUM_GRID_TEMPLATE_SLUG_PREFIX = 'platform-premium-grid-template-'
const PLATFORM_PREMIUM_GRID_TEMPLATE_DEFAULT_ID = 'premium-grid'
const PLATFORM_GOLDEN_EGG_TEMPLATE_STORAGE_MODE = 'PLATFORM_GOLDEN_EGG_TEMPLATE'
const PLATFORM_GOLDEN_EGG_TEMPLATE_SLUG_PREFIX = 'platform-golden-egg-template-'
const PLATFORM_GOLDEN_EGG_TEMPLATE_DEFAULT_ID = 'golden-egg'

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

  if (query.slug) {
    const slug = String(query.slug || '').trim()

    if (slug) {
      where.slug = slug
    }
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


const normalizeTemplatePrizeTitle = (item = {}, index = 0) => {
  return String(
    item.title ||
      item.name ||
      item.prizeName ||
      item.shortName ||
      item.label ||
      `獎項 ${index + 1}`
  ).trim() || `獎項 ${index + 1}`
}

const normalizeTemplatePrizeType = (item = {}) => {
  const rawType = String(item.type || item.rewardType || '').toUpperCase()
  const rawTitle = String(item.title || item.name || item.prizeName || item.label || '').trim()

  if (['LOSE', 'THANKS', 'NO_PRIZE', 'NONE'].includes(rawType)) return 'LOSE'
  if (/未中|沒中|謝謝|再接再厲|銘謝/.test(rawTitle)) return 'LOSE'

  return 'WIN'
}

const normalizeTemplatePrizeProbability = (item = {}) => {
  const probability = Number(
    item.probabilityPercent ??
      item.percent ??
      item.probability ??
      item.weight ??
      item.chance ??
      item.rate ??
      0
  )

  if (Number.isNaN(probability)) return 0

  return Math.min(100, Math.max(0, probability))
}

const normalizeTemplatePrizeStock = (item = {}, prizeType = 'WIN') => {
  if (prizeType === 'LOSE') return 999999999

  const stock = Number(
    item.remainStock ??
      item.stock ??
      item.quantity ??
      item.inventory ??
      item.stockTotal ??
      item.total ??
      9999
  )

  if (Number.isNaN(stock)) return 9999

  return Math.max(0, Math.floor(stock))
}

const isTemplatePrizeEnabled = (item = {}) => {
  if (!item) return false
  if (item.enabled === false) return false
  if (item.isEnabled === false) return false
  if (String(item.status || '').toUpperCase() === 'DISABLED') return false
  if (String(item.rewardType || '').toUpperCase() === 'BUTTON') return false
  if (String(item.type || '').toUpperCase() === 'BUTTON') return false
  if (item.isButton === true) return false

  return true
}

const extractTemplatePrizeItems = (settings = {}, gameType = '') => {
  const normalizedGameType = normalizeGameType(gameType)
  const candidates = normalizedGameType === 'GOLDEN_EGG'
    ? [settings.eggItems, settings.prizes, settings.rewards, settings.rewardItems, settings.items]
    : normalizedGameType === 'GRID'
      ? [settings.prizes, settings.gridItems, settings.rewards, settings.rewardItems, settings.items]
      : normalizedGameType === 'WHEEL'
        ? [settings.prizes, settings.wheelItems, settings.rewards, settings.rewardItems, settings.items]
        : [settings.prizes, settings.items]

  for (const value of candidates) {
    if (Array.isArray(value) && value.length) {
      return value
    }
  }

  return []
}

const buildIndependentPrizeRowsFromTemplateSettings = (settings = {}, gameType = '', campaignId = null, tenantId = null) => {
  const items = extractTemplatePrizeItems(settings, gameType)

  return items
    .filter(isTemplatePrizeEnabled)
    .map((item, index) => {
      const type = normalizeTemplatePrizeType(item)
      const stockTotal = normalizeTemplatePrizeStock(item, type)
      const probability = normalizeTemplatePrizeProbability(item)
      const title = normalizeTemplatePrizeTitle(item, index)

      return {
        campaignId,
        tenantId: tenantId || null,
        title,
        shortName: item.shortName || item.label || item.name || title,
        description: item.description || item.note || null,
        imageUrl: item.imageUrl || item.image || item.prizeImageUrl || null,
        icon: item.icon || item.emoji || null,
        type,
        status: String(item.status || 'ACTIVE').toUpperCase() === 'DISABLED' ? 'DISABLED' : 'ACTIVE',
        probability,
        remainStock: item.remainStock !== undefined
          ? normalizeTemplatePrizeStock({ remainStock: item.remainStock }, type)
          : stockTotal,
        stockTotal,
        stockUsed: 0,
        sortOrder: Number(item.sortOrder ?? item.position ?? index + 1)
      }
    })
    .filter((item) => item.title && (item.type === 'LOSE' || Number(item.probability || 0) > 0))
}

const cloneTemplatePrizeRowsForNewCampaign = async ({ campaignId = null, tenantId = null, gameType = '', settings = {}, isPlatformTemplateSource = false } = {}) => {
  const normalizedCampaignId = normalizeCampaignId(campaignId)

  if (!normalizedCampaignId || isPlatformTemplateSource) {
    return {
      createdCount: 0,
      skipped: true,
      reason: isPlatformTemplateSource ? 'platform_template_source' : 'invalid_campaign_id'
    }
  }

  const prizeRows = buildIndependentPrizeRowsFromTemplateSettings(settings, gameType, normalizedCampaignId, tenantId)

  if (!prizeRows.length) {
    return {
      createdCount: 0,
      skipped: true,
      reason: 'no_template_prizes'
    }
  }

  // 新建活動只複製一次。若呼叫端已另外建立獎項，避免重複建立。
  const existingPrizeCount = await prisma.prize.count({
    where: {
      campaignId: normalizedCampaignId
    }
  })

  if (existingPrizeCount > 0) {
    return {
      createdCount: 0,
      skipped: true,
      reason: 'campaign_already_has_prizes'
    }
  }

  const result = await prisma.prize.createMany({
    data: prizeRows
  })

  return {
    createdCount: result.count || prizeRows.length,
    skipped: false,
    reason: null
  }
}

const hasMeaningfulSettings = (settings = {}) => {
  return isPlainObject(settings) && Object.keys(settings).length > 0
}

const normalizePlatformTemplateId = (value = '') => {
  const normalized = String(value || PLATFORM_WHEEL_TEMPLATE_DEFAULT_ID)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || PLATFORM_WHEEL_TEMPLATE_DEFAULT_ID
}

const getPlatformWheelTemplateSlug = (templateId = PLATFORM_WHEEL_TEMPLATE_DEFAULT_ID) => {
  return `${PLATFORM_WHEEL_TEMPLATE_SLUG_PREFIX}${normalizePlatformTemplateId(templateId)}`
}

const getPayloadTemplateId = (payload = {}) => {
  return normalizePlatformTemplateId(
    payload.templateId ||
      payload.gameId ||
      payload.templateKey ||
      payload.templateSlug ||
      PLATFORM_WHEEL_TEMPLATE_DEFAULT_ID
  )
}

const isPlatformWheelTemplateStoragePayload = (payload = {}, gameType = '') => {
  return String(gameType || '').toUpperCase() === 'WHEEL' &&
    String(payload.templateStorageMode || payload.platformTemplateMode || '').trim().toUpperCase() === PLATFORM_WHEEL_TEMPLATE_STORAGE_MODE
}

const buildPlatformWheelTemplateMeta = ({ user = null, payload = {}, templateId = PLATFORM_WHEEL_TEMPLATE_DEFAULT_ID } = {}) => ({
  ...(isPlainObject(payload?.settings?.templateMeta) ? payload.settings.templateMeta : {}),
  source: 'PLATFORM_WHEEL_TEMPLATE',
  sourceType: 'platform_template',
  targetType: 'platform_template',
  cloneMode: 'TEMPLATE_SOURCE_ONLY',
  cloneBatch: '58401-58800',
  version: 'v23_batch58401_58800',
  isMerchantOwnedCopy: false,
  lockTemplateSync: false,
  allowAutoSyncFromPlatformTemplate: false,
  templateId: normalizePlatformTemplateId(templateId),
  platformTemplateSlug: getPlatformWheelTemplateSlug(templateId),
  savedAt: new Date().toISOString(),
  savedByRole: getUserRole(user) || null,
  savedByUserId: user?.id || null,
  note: '這是平台輪盤模板本體；新建輪盤活動時會複製一次成商家活動副本，既有活動不會被自動同步。'
})

const resolvePlatformWheelTemplateStorageSettings = (payload = {}, user = null) => {
  const templateId = getPayloadTemplateId(payload)
  const normalizedSettings = normalizeSettings(payload)
  const baseSettings = getPlatformWheelTemplateDefaults()
  const mergedSettings = hasMeaningfulSettings(normalizedSettings)
    ? deepMergePlainObject(baseSettings, normalizedSettings)
    : baseSettings

  return {
    ...mergedSettings,
    templateMeta: buildPlatformWheelTemplateMeta({ user, payload, templateId })
  }
}

const getPersistedPlatformWheelTemplateSettings = async (templateId = PLATFORM_WHEEL_TEMPLATE_DEFAULT_ID) => {
  const slug = getPlatformWheelTemplateSlug(templateId)

  const templateCampaign = await prisma.campaign.findFirst({
    where: {
      slug,
      gameType: 'WHEEL'
    },
    include: {
      gameConfig: true
    }
  })

  const settings = templateCampaign?.gameConfig?.settings

  if (!hasMeaningfulSettings(settings)) {
    return {
      settings: null,
      templateCampaignId: templateCampaign?.id || null,
      slug,
      templateId: normalizePlatformTemplateId(templateId),
      found: false
    }
  }

  return {
    settings,
    templateCampaignId: templateCampaign.id,
    slug,
    templateId: normalizePlatformTemplateId(templateId),
    found: true
  }
}

const resolvePlatformWheelTemplateForClone = async (payload = {}) => {
  const templateId = getPayloadTemplateId(payload)
  const persisted = await getPersistedPlatformWheelTemplateSettings(templateId)
  const baseSettings = getPlatformWheelTemplateDefaults()
  const settings = persisted.found
    ? deepMergePlainObject(baseSettings, persisted.settings)
    : baseSettings

  return {
    settings,
    templateId,
    platformTemplateSlug: persisted.slug,
    templateCampaignId: persisted.templateCampaignId,
    sourceMode: persisted.found ? 'persisted_platform_template_campaign' : 'static_backend_default',
    found: persisted.found
  }
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
    version: 'v23_batch54801_55200',
    cloneBatch: '54801-55200',
    note: '建立新輪盤活動時複製一次；之後商家活動與平台模板互相隔離。'
  }
})

const buildWheelTemplateCloneMeta = ({ tenantId = null, user = null, payload = {}, usedCustomSettings = false, platformTemplateInfo = {} } = {}) => {
  const payloadTemplateMeta = isPlainObject(payload?.settings?.templateMeta)
    ? payload.settings.templateMeta
    : {}

  return {
    ...payloadTemplateMeta,
    source: 'PLATFORM_WHEEL_TEMPLATE',
    sourceType: 'platform_template',
    targetType: 'merchant_campaign',
    cloneMode: 'CREATE_CAMPAIGN_ONLY',
    cloneBatch: '58401-58800',
    version: 'v23_batch58401_58800',
    isMerchantOwnedCopy: true,
    lockTemplateSync: true,
    allowAutoSyncFromPlatformTemplate: false,
    templateId: platformTemplateInfo.templateId || getPayloadTemplateId(payload),
    platformTemplateSlug: platformTemplateInfo.platformTemplateSlug || getPlatformWheelTemplateSlug(getPayloadTemplateId(payload)),
    platformTemplateCampaignId: platformTemplateInfo.templateCampaignId || null,
    platformTemplateSourceMode: platformTemplateInfo.sourceMode || 'static_backend_default',
    clonedAt: new Date().toISOString(),
    clonedForTenantId: tenantId || null,
    clonedByRole: getUserRole(user) || null,
    clonedByUserId: user?.id || null,
    createdFromPayloadSettings: usedCustomSettings,
    copiedLatestPlatformTemplate: platformTemplateInfo.sourceMode === 'persisted_platform_template_campaign',
    note: platformTemplateInfo.sourceMode === 'persisted_platform_template_campaign'
      ? '此設定是建立商家輪盤活動時，由最新已儲存的平台輪盤模板複製的一次性商家副本；後續平台模板修改不會自動同步到此活動。'
      : '此設定是建立商家輪盤活動時，由後端預設平台輪盤模板複製的一次性商家副本；後續平台模板修改不會自動同步到此活動。'
  }
}

const attachWheelTemplateCloneMeta = (settings = {}, context = {}) => {
  return {
    ...settings,
    templateMeta: buildWheelTemplateCloneMeta(context)
  }
}


const normalizePlatformPremiumGridTemplateId = (value = '') => {
  const normalized = String(value || PLATFORM_PREMIUM_GRID_TEMPLATE_DEFAULT_ID)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || PLATFORM_PREMIUM_GRID_TEMPLATE_DEFAULT_ID
}

const getPlatformPremiumGridTemplateSlug = (templateId = PLATFORM_PREMIUM_GRID_TEMPLATE_DEFAULT_ID) => {
  return `${PLATFORM_PREMIUM_GRID_TEMPLATE_SLUG_PREFIX}${normalizePlatformPremiumGridTemplateId(templateId)}`
}

const getPayloadPremiumGridTemplateId = (payload = {}) => {
  return normalizePlatformPremiumGridTemplateId(
    payload.templateId ||
      payload.gameId ||
      payload.templateKey ||
      payload.templateSlug ||
      PLATFORM_PREMIUM_GRID_TEMPLATE_DEFAULT_ID
  )
}

const isPlatformPremiumGridTemplateStoragePayload = (payload = {}, gameType = '') => {
  return String(gameType || '').toUpperCase() === 'GRID' &&
    String(payload.templateStorageMode || payload.platformTemplateMode || '').trim().toUpperCase() === PLATFORM_PREMIUM_GRID_TEMPLATE_STORAGE_MODE
}

const buildPlatformPremiumGridTemplateMeta = ({ user = null, payload = {}, templateId = PLATFORM_PREMIUM_GRID_TEMPLATE_DEFAULT_ID } = {}) => ({
  ...(isPlainObject(payload?.settings?.templateMeta) ? payload.settings.templateMeta : {}),
  source: 'PLATFORM_PREMIUM_GRID_TEMPLATE',
  sourceType: 'platform_template',
  targetType: 'platform_template',
  cloneMode: 'TEMPLATE_SOURCE_ONLY',
  cloneBatch: '83601-84000',
  version: 'v23_batch83601_84000',
  isMerchantOwnedCopy: false,
  lockTemplateSync: false,
  allowAutoSyncFromPlatformTemplate: false,
  templateId: normalizePlatformPremiumGridTemplateId(templateId),
  platformTemplateSlug: getPlatformPremiumGridTemplateSlug(templateId),
  savedAt: new Date().toISOString(),
  savedByRole: getUserRole(user) || null,
  savedByUserId: user?.id || null,
  note: '這是九宮格平台模板本體；商家新建九宮格活動時會複製一次成商家活動副本，既有活動不會被自動同步。'
})

const getPlatformPremiumGridTemplateDefaults = () => ({
  basicText: {
    pageTitle: '精緻九宮格抽獎',
    brandName: 'Multi Game Platform',
    brandSubtitle: '打造專屬互動抽獎體驗',
    headline: '豪華九宮格',
    subtitle: '每日登入抽好禮',
    badgeText: '輸入序號後即可抽獎',
    playButtonText: '開始抽獎'
  },
  textSize: {
    headlineSize: 36,
    subtitleSize: 28,
    brandNameSize: 16,
    buttonTextSize: 16,
    prizeTextSize: 13
  },
  display: {
    showBrandCard: true,
    showStatusCard: true,
    showRules: true,
    showPrizeInfo: true,
    showHistory: true
  },
  prizes: [
    { id: 1, position: 1, icon: '🎁', imageUrl: '', title: '神秘獎品', weight: 20, probabilityPercent: 20, enabled: true },
    { id: 2, position: 2, icon: '🎁', imageUrl: '', title: '神秘獎品', weight: 20, probabilityPercent: 20, enabled: true },
    { id: 3, position: 3, icon: '🎁', imageUrl: '', title: '神秘獎品', weight: 12, probabilityPercent: 12, enabled: true },
    { id: 4, position: 4, icon: '🎁', imageUrl: '', title: '神秘獎品', weight: 10, probabilityPercent: 10, enabled: true },
    { id: 5, position: 5, icon: '✨', imageUrl: '', title: '點擊抽選', weight: 0, probabilityPercent: 0, enabled: true, isCenter: true },
    { id: 6, position: 6, icon: '🎁', imageUrl: '', title: '神秘獎品', weight: 25, probabilityPercent: 25, enabled: true },
    { id: 7, position: 7, icon: '🎁', imageUrl: '', title: '神秘獎品', weight: 8, probabilityPercent: 8, enabled: true },
    { id: 8, position: 8, icon: '🎁', imageUrl: '', title: '神秘獎品', weight: 4, probabilityPercent: 4, enabled: true },
    { id: 9, position: 9, icon: '🎁', imageUrl: '', title: '神秘獎品', weight: 1, probabilityPercent: 1, enabled: true }
  ],
  gridItems: []
})

const resolvePlatformPremiumGridTemplateStorageSettings = (payload = {}, user = null) => {
  const templateId = getPayloadPremiumGridTemplateId(payload)
  const normalizedSettings = normalizeSettings(payload)
  const baseSettings = getPlatformPremiumGridTemplateDefaults()
  const mergedSettings = hasMeaningfulSettings(normalizedSettings)
    ? deepMergePlainObject(baseSettings, normalizedSettings)
    : baseSettings

  return {
    ...mergedSettings,
    templateMeta: buildPlatformPremiumGridTemplateMeta({ user, payload, templateId })
  }
}

const getPersistedPlatformPremiumGridTemplateSettings = async (templateId = PLATFORM_PREMIUM_GRID_TEMPLATE_DEFAULT_ID) => {
  const slug = getPlatformPremiumGridTemplateSlug(templateId)

  const templateCampaign = await prisma.campaign.findFirst({
    where: {
      slug,
      gameType: 'GRID'
    },
    include: {
      gameConfig: true
    }
  })

  const settings = templateCampaign?.gameConfig?.settings

  if (!hasMeaningfulSettings(settings)) {
    return {
      settings: null,
      templateCampaignId: templateCampaign?.id || null,
      slug,
      templateId: normalizePlatformPremiumGridTemplateId(templateId),
      found: false
    }
  }

  return {
    settings,
    templateCampaignId: templateCampaign.id,
    slug,
    templateId: normalizePlatformPremiumGridTemplateId(templateId),
    found: true
  }
}

const resolvePlatformPremiumGridTemplateForClone = async (payload = {}) => {
  const templateId = getPayloadPremiumGridTemplateId(payload)
  const persisted = await getPersistedPlatformPremiumGridTemplateSettings(templateId)
  const baseSettings = getPlatformPremiumGridTemplateDefaults()
  const settings = persisted.found
    ? deepMergePlainObject(baseSettings, persisted.settings)
    : baseSettings

  return {
    settings,
    templateId,
    platformTemplateSlug: persisted.slug,
    templateCampaignId: persisted.templateCampaignId,
    sourceMode: persisted.found ? 'persisted_platform_template_campaign' : 'static_backend_default',
    found: persisted.found
  }
}

const buildPremiumGridTemplateCloneMeta = ({ tenantId = null, user = null, payload = {}, usedCustomSettings = false, platformTemplateInfo = {} } = {}) => {
  const payloadTemplateMeta = isPlainObject(payload?.settings?.templateMeta)
    ? payload.settings.templateMeta
    : {}

  return {
    ...payloadTemplateMeta,
    source: 'PLATFORM_PREMIUM_GRID_TEMPLATE',
    sourceType: 'platform_template',
    targetType: 'merchant_campaign',
    cloneMode: 'CREATE_CAMPAIGN_ONLY',
    cloneBatch: '83601-84000',
    version: 'v23_batch83601_84000',
    isMerchantOwnedCopy: true,
    lockTemplateSync: true,
    allowAutoSyncFromPlatformTemplate: false,
    templateId: platformTemplateInfo.templateId || getPayloadPremiumGridTemplateId(payload),
    platformTemplateSlug: platformTemplateInfo.platformTemplateSlug || getPlatformPremiumGridTemplateSlug(getPayloadPremiumGridTemplateId(payload)),
    platformTemplateCampaignId: platformTemplateInfo.templateCampaignId || null,
    platformTemplateSourceMode: platformTemplateInfo.sourceMode || 'static_backend_default',
    clonedAt: new Date().toISOString(),
    clonedForTenantId: tenantId || null,
    clonedByRole: getUserRole(user) || null,
    clonedByUserId: user?.id || null,
    createdFromPayloadSettings: usedCustomSettings,
    copiedLatestPlatformTemplate: platformTemplateInfo.sourceMode === 'persisted_platform_template_campaign',
    note: platformTemplateInfo.sourceMode === 'persisted_platform_template_campaign'
      ? '此設定是建立商家九宮格活動時，由最新已儲存的平台九宮格模板複製的一次性商家副本；後續平台模板修改不會自動同步到此活動。'
      : '此設定是建立商家九宮格活動時，由後端預設平台九宮格模板複製的一次性商家副本；後續平台模板修改不會自動同步到此活動。'
  }
}

const attachPremiumGridTemplateCloneMeta = (settings = {}, context = {}) => {
  return {
    ...settings,
    templateMeta: buildPremiumGridTemplateCloneMeta(context)
  }
}

const pickMerchantGridRuntimeOverrides = (settings = {}) => {
  const overrides = {}

  ;['operationMode', 'requireSerialCode', 'serialPrefix', 'playerHint'].forEach((key) => {
    if (settings[key] !== undefined) overrides[key] = settings[key]
  })

  // 商家建立活動頁以前會送出一組舊版 gridItems；這些是建立頁預設值，不是平台模板。
  // 這裡刻意不讓舊版 gridItems / textSize 覆蓋最新平台模板，避免新建活動字級、獎項又回到舊預設。
  return overrides
}


const normalizePlatformGoldenEggTemplateId = (value = '') => {
  const normalized = String(value || PLATFORM_GOLDEN_EGG_TEMPLATE_DEFAULT_ID)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || PLATFORM_GOLDEN_EGG_TEMPLATE_DEFAULT_ID
}

const getPlatformGoldenEggTemplateSlug = (templateId = PLATFORM_GOLDEN_EGG_TEMPLATE_DEFAULT_ID) => {
  return `${PLATFORM_GOLDEN_EGG_TEMPLATE_SLUG_PREFIX}${normalizePlatformGoldenEggTemplateId(templateId)}`
}

const getPayloadGoldenEggTemplateId = (payload = {}) => {
  return normalizePlatformGoldenEggTemplateId(
    payload.templateId ||
      payload.gameId ||
      payload.templateKey ||
      payload.templateSlug ||
      PLATFORM_GOLDEN_EGG_TEMPLATE_DEFAULT_ID
  )
}

const isPlatformGoldenEggTemplateStoragePayload = (payload = {}, gameType = '') => {
  return String(gameType || '').toUpperCase() === 'GOLDEN_EGG' &&
    String(payload.templateStorageMode || payload.platformTemplateMode || '').trim().toUpperCase() === PLATFORM_GOLDEN_EGG_TEMPLATE_STORAGE_MODE
}

const buildPlatformGoldenEggTemplateMeta = ({ user = null, payload = {}, templateId = PLATFORM_GOLDEN_EGG_TEMPLATE_DEFAULT_ID } = {}) => ({
  ...(isPlainObject(payload?.settings?.templateMeta) ? payload.settings.templateMeta : {}),
  source: 'PLATFORM_GOLDEN_EGG_TEMPLATE',
  sourceType: 'platform_template',
  targetType: 'platform_template',
  cloneMode: 'TEMPLATE_SOURCE_ONLY',
  cloneBatch: '89201-89600',
  version: 'v23_batch89201_89600',
  isMerchantOwnedCopy: false,
  lockTemplateSync: false,
  allowAutoSyncFromPlatformTemplate: false,
  templateId: normalizePlatformGoldenEggTemplateId(templateId),
  platformTemplateSlug: getPlatformGoldenEggTemplateSlug(templateId),
  savedAt: new Date().toISOString(),
  savedByRole: getUserRole(user) || null,
  savedByUserId: user?.id || null,
  note: '這是金蛋平台模板本體；商家新建金蛋活動時會複製一次成商家活動副本，活動規則與獎品說明會一起複製到玩家正式畫面。'
})

const getPlatformGoldenEggTemplateDefaults = () => ({
  pageTitle: '砸金蛋抽獎',
  mainTitle: '砸金蛋抽獎',
  subTitle: 'LUCKY GOLDEN EGG',
  heroTagline: '輸入序號，砸出專屬好禮',
  noticeText: '請輸入主辦單位提供的抽獎序號。',
  serialRedeemTitle: '輸入抽獎序號',
  serialRedeemDescription: '請輸入主辦單位提供的序號；驗證成功後即可取得砸蛋次數。',
  serialRedeemButtonText: '驗證序號',
  serialRedeemSuccessText: '序號驗證成功，請選擇一顆金蛋。',
  serialRedeemErrorText: '序號無效、已使用或不存在。',
  activityRunningText: '活動進行中，請輸入序號參加。',
  activityNotStartedText: '活動尚未開始。',
  activityEndedText: '活動已結束。',
  ruleTitle: '活動規則',
  ruleContent: '請先輸入主辦單位提供的抽獎序號。\n序號驗證成功後，才會取得可用砸蛋次數。\n每次砸蛋會消耗 1 次序號機會。\n獎項數量有限，送完為止。',
  prizeInfoTitle: '獎品說明',
  prizeInfoContent: '獎項、兌換方式與使用期限，以主辦單位現場或官方公告為準。',
  rulesText: '請先輸入主辦單位提供的抽獎序號。\n序號驗證成功後，才會取得可用砸蛋次數。\n每次砸蛋會消耗 1 次序號機會。\n獎項數量有限，送完為止。',
  prizeInfoText: '獎項、兌換方式與使用期限，以主辦單位現場或官方公告為準。',
  content: {
    rulesTitle: '活動規則',
    rulesText: '請先輸入主辦單位提供的抽獎序號。\n序號驗證成功後，才會取得可用砸蛋次數。\n每次砸蛋會消耗 1 次序號機會。\n獎項數量有限，送完為止。',
    ruleTitle: '活動規則',
    ruleContent: '請先輸入主辦單位提供的抽獎序號。\n序號驗證成功後，才會取得可用砸蛋次數。\n每次砸蛋會消耗 1 次序號機會。\n獎項數量有限，送完為止。',
    prizeInfoTitle: '獎品說明',
    prizeInfoText: '獎項、兌換方式與使用期限，以主辦單位現場或官方公告為準。',
    prizeInfoContent: '獎項、兌換方式與使用期限，以主辦單位現場或官方公告為準。'
  },
  showActivityTimeSection: true,
  showActivityCountdown: true,
  showBottomNav: true,
  eggSize: 74,
  eggCardSize: 128,
  eggGridGap: 12,
  eggColorTop: '#fff7ad',
  eggColorMiddle: '#fde047',
  eggColorBottom: '#b45309',
  themeBgFrom: '#991b1b',
  themeBgMiddle: '#dc2626',
  themeBgTo: '#450a0a',
  themePanelColor: '#fff7ed',
  themeAccentColor: '#facc15',
  themeButtonColor: '#ef4444',
  themeButtonDarkColor: '#991b1b',
  eggCardBgFrom: '#ef4444',
  eggCardBgTo: '#7f1d1d',
  eggNumberBgColor: '#7f1d1d',
  eggNumberTextColor: '#fef3c7',
  probabilityMode: 'BACKEND_DRAW_ENGINE',
  probabilitySource: 'GOLDEN_EGG_GAME_CONFIG_PERCENT',
  eggItems: [
    { id: 1, position: 1, icon: '🥚', title: '金蛋 VIP 折價券', shortName: 'GOLD 1', type: 'WIN', stock: 100, probability: 12, probabilityPercent: 12, weight: 12, enabled: true },
    { id: 2, position: 2, icon: '🥚', title: '金蛋 200 元折價券', shortName: 'GOLD 2', type: 'WIN', stock: 100, probability: 12, probabilityPercent: 12, weight: 12, enabled: true },
    { id: 3, position: 3, icon: '🥚', title: '金蛋 100 元折價券', shortName: 'GOLD 3', type: 'WIN', stock: 100, probability: 12, probabilityPercent: 12, weight: 12, enabled: true },
    { id: 4, position: 4, icon: '🥚', title: '金蛋 小禮物', shortName: 'GOLD 4', type: 'WIN', stock: 100, probability: 12, probabilityPercent: 12, weight: 12, enabled: true },
    { id: 5, position: 5, icon: '🥚', title: '金蛋 抽獎券', shortName: 'GOLD 5', type: 'WIN', stock: 100, probability: 12, probabilityPercent: 12, weight: 12, enabled: true },
    { id: 6, position: 6, icon: '🥚', title: '金蛋 加碼券', shortName: 'GOLD 6', type: 'WIN', stock: 100, probability: 12, probabilityPercent: 12, weight: 12, enabled: true },
    { id: 7, position: 7, icon: '🥚', title: '金蛋 參加獎', shortName: 'GOLD 7', type: 'WIN', stock: 100, probability: 12, probabilityPercent: 12, weight: 12, enabled: true },
    { id: 8, position: 8, icon: '🥚', title: '金蛋 幸運獎', shortName: 'GOLD 8', type: 'WIN', stock: 100, probability: 8, probabilityPercent: 8, weight: 8, enabled: true },
    { id: 9, position: 9, icon: '🥚', title: '金蛋 神秘獎', shortName: 'GOLD 9', type: 'WIN', stock: 100, probability: 8, probabilityPercent: 8, weight: 8, enabled: true }
  ],
  prizes: []
})

const resolvePlatformGoldenEggTemplateStorageSettings = (payload = {}, user = null) => {
  const templateId = getPayloadGoldenEggTemplateId(payload)
  const normalizedSettings = normalizeSettings(payload)
  const baseSettings = getPlatformGoldenEggTemplateDefaults()
  const mergedSettings = hasMeaningfulSettings(normalizedSettings)
    ? deepMergePlainObject(baseSettings, normalizedSettings)
    : baseSettings

  return {
    ...mergedSettings,
    templateMeta: buildPlatformGoldenEggTemplateMeta({ user, payload, templateId })
  }
}

const getPersistedPlatformGoldenEggTemplateSettings = async (templateId = PLATFORM_GOLDEN_EGG_TEMPLATE_DEFAULT_ID) => {
  const slug = getPlatformGoldenEggTemplateSlug(templateId)

  const templateCampaign = await prisma.campaign.findFirst({
    where: {
      slug,
      gameType: 'GOLDEN_EGG'
    },
    include: {
      gameConfig: true
    }
  })

  const settings = templateCampaign?.gameConfig?.settings

  if (!hasMeaningfulSettings(settings)) {
    return {
      settings: null,
      templateCampaignId: templateCampaign?.id || null,
      slug,
      templateId: normalizePlatformGoldenEggTemplateId(templateId),
      found: false
    }
  }

  return {
    settings,
    templateCampaignId: templateCampaign.id,
    slug,
    templateId: normalizePlatformGoldenEggTemplateId(templateId),
    found: true
  }
}

const resolvePlatformGoldenEggTemplateForClone = async (payload = {}) => {
  const templateId = getPayloadGoldenEggTemplateId(payload)
  const persisted = await getPersistedPlatformGoldenEggTemplateSettings(templateId)
  const baseSettings = getPlatformGoldenEggTemplateDefaults()
  const settings = persisted.found
    ? deepMergePlainObject(baseSettings, persisted.settings)
    : baseSettings

  return {
    settings,
    templateId,
    platformTemplateSlug: persisted.slug,
    templateCampaignId: persisted.templateCampaignId,
    sourceMode: persisted.found ? 'persisted_platform_template_campaign' : 'static_backend_default',
    found: persisted.found
  }
}

const buildGoldenEggTemplateCloneMeta = ({ tenantId = null, user = null, payload = {}, usedCustomSettings = false, platformTemplateInfo = {} } = {}) => {
  const payloadTemplateMeta = isPlainObject(payload?.settings?.templateMeta)
    ? payload.settings.templateMeta
    : {}

  return {
    ...payloadTemplateMeta,
    source: 'PLATFORM_GOLDEN_EGG_TEMPLATE',
    sourceType: 'platform_template',
    targetType: 'merchant_campaign',
    cloneMode: 'CREATE_CAMPAIGN_ONLY',
    cloneBatch: '89201-89600',
    version: 'v23_batch89201_89600',
    isMerchantOwnedCopy: true,
    lockTemplateSync: true,
    allowAutoSyncFromPlatformTemplate: false,
    templateId: platformTemplateInfo.templateId || getPayloadGoldenEggTemplateId(payload),
    platformTemplateSlug: platformTemplateInfo.platformTemplateSlug || getPlatformGoldenEggTemplateSlug(getPayloadGoldenEggTemplateId(payload)),
    platformTemplateCampaignId: platformTemplateInfo.templateCampaignId || null,
    platformTemplateSourceMode: platformTemplateInfo.sourceMode || 'static_backend_default',
    clonedAt: new Date().toISOString(),
    clonedForTenantId: tenantId || null,
    clonedByRole: getUserRole(user) || null,
    clonedByUserId: user?.id || null,
    createdFromPayloadSettings: usedCustomSettings,
    copiedLatestPlatformTemplate: platformTemplateInfo.sourceMode === 'persisted_platform_template_campaign',
    note: platformTemplateInfo.sourceMode === 'persisted_platform_template_campaign'
      ? '此設定是建立商家金蛋活動時，由最新已儲存的平台金蛋模板複製的一次性商家副本；活動規則與獎品說明會一起同步到正式玩家畫面，後續平台模板修改不會自動同步到此活動。'
      : '此設定是建立商家金蛋活動時，由後端預設平台金蛋模板複製的一次性商家副本；活動規則與獎品說明會一起同步到正式玩家畫面，後續平台模板修改不會自動同步到此活動。'
  }
}

const attachGoldenEggTemplateCloneMeta = (settings = {}, context = {}) => {
  return {
    ...settings,
    templateMeta: buildGoldenEggTemplateCloneMeta(context)
  }
}

const pickMerchantGoldenEggRuntimeOverrides = (settings = {}) => {
  const overrides = {}

  ;['operationMode', 'requireSerialCode', 'serialPrefix', 'playerHint'].forEach((key) => {
    if (settings[key] !== undefined) overrides[key] = settings[key]
  })

  // 商家建立活動頁若送出舊版金蛋預設 settings，這裡不讓它覆蓋平台模板。
  // 活動規則、獎品說明、獎項百分比、視覺設定都必須由平台金蛋模板複製。
  return overrides
}

const resolveInitialGameConfigSettings = async (gameType, payload = {}, context = {}) => {
  const normalizedSettings = normalizeSettings(payload)

  if (gameType === 'WHEEL') {
    if (isPlatformWheelTemplateStoragePayload(payload, gameType)) {
      return resolvePlatformWheelTemplateStorageSettings(payload, context.user)
    }

    const platformTemplateInfo = await resolvePlatformWheelTemplateForClone(payload)
    const platformWheelTemplate = platformTemplateInfo.settings
    const hasCustomSettings = hasMeaningfulSettings(normalizedSettings)

    if (!hasCustomSettings) {
      return attachWheelTemplateCloneMeta(platformWheelTemplate, {
        ...context,
        payload,
        usedCustomSettings: false,
        platformTemplateInfo
      })
    }

    // 若建立活動時已有局部 settings，仍以最新平台模板補齊缺少欄位，
    // 但保留呼叫端明確傳入的商家活動設定。
    // templateMeta 由後端重新標記，避免呼叫端把平台模板或其他商家活動的追蹤資訊帶進新活動。
    const mergedSettings = deepMergePlainObject(platformWheelTemplate, normalizedSettings)

    return attachWheelTemplateCloneMeta(mergedSettings, {
      ...context,
      payload,
      usedCustomSettings: true,
      platformTemplateInfo
    })
  }

  if (gameType === 'GRID') {
    if (isPlatformPremiumGridTemplateStoragePayload(payload, gameType)) {
      return resolvePlatformPremiumGridTemplateStorageSettings(payload, context.user)
    }

    const platformTemplateInfo = await resolvePlatformPremiumGridTemplateForClone(payload)
    const platformGridTemplate = platformTemplateInfo.settings
    const hasCustomSettings = hasMeaningfulSettings(normalizedSettings)
    const merchantRuntimeOverrides = pickMerchantGridRuntimeOverrides(normalizedSettings)

    if (!hasCustomSettings) {
      return attachPremiumGridTemplateCloneMeta(platformGridTemplate, {
        ...context,
        payload,
        usedCustomSettings: false,
        platformTemplateInfo
      })
    }

    // 第 83601～84000 批：商家新建九宮格活動必須完整套用平台模板。
    // 建立頁送出的 gridItems / textSize 多半是舊版本地預設，不能覆蓋平台模板已儲存的字級、獎項與版面。
    // 只保留 operationMode / requireSerialCode / serialPrefix / playerHint 這類活動執行欄位。
    const mergedSettings = deepMergePlainObject(platformGridTemplate, merchantRuntimeOverrides)

    return attachPremiumGridTemplateCloneMeta(mergedSettings, {
      ...context,
      payload,
      usedCustomSettings: true,
      platformTemplateInfo
    })
  }

  if (gameType === 'GOLDEN_EGG') {
    if (isPlatformGoldenEggTemplateStoragePayload(payload, gameType)) {
      return resolvePlatformGoldenEggTemplateStorageSettings(payload, context.user)
    }

    const platformTemplateInfo = await resolvePlatformGoldenEggTemplateForClone(payload)
    const platformGoldenEggTemplate = platformTemplateInfo.settings
    const hasCustomSettings = hasMeaningfulSettings(normalizedSettings)
    const merchantRuntimeOverrides = pickMerchantGoldenEggRuntimeOverrides(normalizedSettings)

    if (!hasCustomSettings) {
      return attachGoldenEggTemplateCloneMeta(platformGoldenEggTemplate, {
        ...context,
        payload,
        usedCustomSettings: false,
        platformTemplateInfo
      })
    }

    // 第 89201～89600 批：商家新建金蛋活動必須完整套用平台模板。
    // 活動規則 / 獎品說明會跟金蛋模板一起複製到 GameConfig.settings，正式玩家頁讀取後會同步顯示。
    // 建立頁送出的舊版 eggItems / prizes / ruleContent 預設不覆蓋平台模板，只保留執行用欄位。
    const mergedSettings = deepMergePlainObject(platformGoldenEggTemplate, merchantRuntimeOverrides)

    return attachGoldenEggTemplateCloneMeta(mergedSettings, {
      ...context,
      payload,
      usedCustomSettings: true,
      platformTemplateInfo
    })
  }

  return normalizedSettings
}


const buildTemplateCloneAudit = (campaign = null) => {
  const gameType = String(campaign?.gameType || '').toUpperCase()
  const settings = campaign?.gameConfig?.settings
  const templateMeta = isPlainObject(settings?.templateMeta) ? settings.templateMeta : {}

  if (gameType !== 'WHEEL') {
    return {
      checked: true,
      gameType,
      shouldUsePlatformWheelTemplate: false,
      clonedFromPlatformWheelTemplate: false,
      message: '非 WHEEL 活動，不套用平台輪盤模板複製檢查。'
    }
  }

  const isPlatformTemplateSourceRecord = templateMeta.targetType === 'platform_template' || templateMeta.cloneMode === 'TEMPLATE_SOURCE_ONLY'

  if (isPlatformTemplateSourceRecord) {
    return {
      checked: true,
      gameType,
      shouldUsePlatformWheelTemplate: false,
      clonedFromPlatformWheelTemplate: false,
      isPlatformTemplateSourceRecord: true,
      source: templateMeta.source || null,
      sourceType: templateMeta.sourceType || null,
      targetType: templateMeta.targetType || null,
      cloneMode: templateMeta.cloneMode || null,
      cloneBatch: templateMeta.cloneBatch || null,
      version: templateMeta.version || null,
      platformTemplateSlug: templateMeta.platformTemplateSlug || null,
      templateId: templateMeta.templateId || null,
      message: '這是平台輪盤模板本體，用來提供新建輪盤活動的預設來源，不是商家活動副本。'
    }
  }

  const clonedFromPlatformWheelTemplate = templateMeta.source === 'PLATFORM_WHEEL_TEMPLATE'
  const isMerchantOwnedCopy = templateMeta.isMerchantOwnedCopy === true
  const lockTemplateSync = templateMeta.lockTemplateSync === true
  const allowAutoSyncFromPlatformTemplate = templateMeta.allowAutoSyncFromPlatformTemplate === true
  const cloneMode = templateMeta.cloneMode || null

  return {
    checked: true,
    gameType,
    shouldUsePlatformWheelTemplate: true,
    clonedFromPlatformWheelTemplate,
    isMerchantOwnedCopy,
    lockTemplateSync,
    allowAutoSyncFromPlatformTemplate,
    isSafeMerchantCopy: Boolean(
      clonedFromPlatformWheelTemplate &&
      isMerchantOwnedCopy &&
      lockTemplateSync &&
      !allowAutoSyncFromPlatformTemplate &&
      cloneMode === 'CREATE_CAMPAIGN_ONLY'
    ),
    source: templateMeta.source || null,
    sourceType: templateMeta.sourceType || null,
    targetType: templateMeta.targetType || null,
    cloneMode,
    cloneBatch: templateMeta.cloneBatch || null,
    version: templateMeta.version || null,
    clonedAt: templateMeta.clonedAt || null,
    clonedForTenantId: templateMeta.clonedForTenantId || null,
    clonedByRole: templateMeta.clonedByRole || null,
    createdFromPayloadSettings: templateMeta.createdFromPayloadSettings === true,
    platformTemplateSlug: templateMeta.platformTemplateSlug || null,
    platformTemplateCampaignId: templateMeta.platformTemplateCampaignId || null,
    platformTemplateSourceMode: templateMeta.platformTemplateSourceMode || null,
    copiedLatestPlatformTemplate: templateMeta.copiedLatestPlatformTemplate === true,
    message: clonedFromPlatformWheelTemplate
      ? (templateMeta.copiedLatestPlatformTemplate === true
          ? '新輪盤活動已複製最新已儲存的平台輪盤模板，並建立一次性商家副本；後續平台模板修改不會自動同步到此活動。'
          : '新輪盤活動已建立平台輪盤模板的一次性商家副本；後續平台模板修改不會自動同步到此活動。')
      : '此 WHEEL 活動尚未偵測到平台輪盤模板複製標記，請檢查 createCampaign settings。'
  }
}

const appendTemplateCloneAudit = (campaign = null) => {
  if (!campaign) return campaign

  return {
    ...campaign,
    templateCloneAudit: buildTemplateCloneAudit(campaign)
  }
}

const buildCampaignPatchFromSettings = (settings = {}) => {
  const data = {}

  const pageTitle = String(settings?.basicText?.pageTitle || '').trim()
  const headline = String(settings?.basicText?.headline || '').trim()
  const activityTime = settings?.activityTime || settings?.activity || settings?.timeSettings || {}

  if (pageTitle) {
    data.title = pageTitle
  } else if (headline) {
    data.title = headline
  }

  if (
    activityTime.startAt !== undefined ||
    activityTime.startTime !== undefined ||
    activityTime.startedAt !== undefined
  ) {
    data.startAt = sanitizeDate(activityTime.startAt || activityTime.startTime || activityTime.startedAt)
  }

  if (
    activityTime.endAt !== undefined ||
    activityTime.endTime !== undefined ||
    activityTime.endedAt !== undefined
  ) {
    data.endAt = sanitizeDate(activityTime.endAt || activityTime.endTime || activityTime.endedAt)
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

  const platformTemplateSlug = isPlatformWheelTemplateStoragePayload(payload, gameType)
    ? getPlatformWheelTemplateSlug(getPayloadTemplateId(payload))
    : isPlatformPremiumGridTemplateStoragePayload(payload, gameType)
      ? getPlatformPremiumGridTemplateSlug(getPayloadPremiumGridTemplateId(payload))
      : isPlatformGoldenEggTemplateStoragePayload(payload, gameType)
        ? getPlatformGoldenEggTemplateSlug(getPayloadGoldenEggTemplateId(payload))
        : null
  const slug = payload.slug
    ? String(payload.slug).trim()
    : platformTemplateSlug
  const initialGameConfigSettings = await resolveInitialGameConfigSettings(gameType, payload, { tenantId, user })

  const createdCampaign = await prisma.campaign.create({
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
          settings: initialGameConfigSettings
        }
      }
    },
    include: campaignInclude
  })

  const isPlatformTemplateSource = Boolean(platformTemplateSlug) ||
    initialGameConfigSettings?.templateMeta?.targetType === 'platform_template' ||
    initialGameConfigSettings?.templateMeta?.cloneMode === 'TEMPLATE_SOURCE_ONLY'

  // 第 91201～91600 批：平台模板與商家活動獎項必須分離。
  // 商家新建 WHEEL / GRID / GOLDEN_EGG 活動時，將模板 settings 內的 prizes / gridItems / eggItems
  // 複製成該 campaignId + tenantId 專屬 Prize records，避免 A / B 商家共用同一批 Prize ID。
  await cloneTemplatePrizeRowsForNewCampaign({
    campaignId: createdCampaign.id,
    tenantId: createdCampaign.tenantId || tenantId,
    gameType,
    settings: initialGameConfigSettings,
    isPlatformTemplateSource
  })

  const isolatedCampaign = await prisma.campaign.findUnique({
    where: {
      id: createdCampaign.id
    },
    include: campaignInclude
  })

  return appendTemplateCloneAudit(isolatedCampaign || createdCampaign)
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
            startAt: true,
            endAt: true,
            updatedAt: true,
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

