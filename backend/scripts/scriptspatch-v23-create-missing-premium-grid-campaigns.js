/**
 * V2.3 第 29 批修補腳本
 * 檔名：patch-v23-create-missing-premium-grid-campaigns.js
 *
 * 目的：
 * - 補建每個商家的 GRID / 精緻九宮格活動
 * - 讓前台網址可以讀到：
 *   /play/a-shop/premium-grid
 *   /play/b-shop/premium-grid
 *
 * 使用方式：
 * 1. 放到 backend/scripts/patch-v23-create-missing-premium-grid-campaigns.js
 * 2. 在 backend 目錄執行：
 *    node scripts/patch-v23-create-missing-premium-grid-campaigns.js
 */

const clientModule = await import('@prisma/client')
const { PrismaClient } = clientModule
const prisma = new PrismaClient()

const GRID_GAME_TYPE = 'GRID'

const log = (message = '') => {
  console.log(message)
}

const getModelMeta = (modelName) => {
  return prisma._runtimeDataModel?.models?.[modelName] || null
}

const getModelFields = (modelName) => {
  const model = getModelMeta(modelName)
  return Array.isArray(model?.fields) ? model.fields : []
}

const hasField = (modelName, fieldName) => {
  return getModelFields(modelName).some((field) => field.name === fieldName)
}

const isRequiredField = (modelName, fieldName) => {
  const field = getModelFields(modelName).find((item) => item.name === fieldName)
  return Boolean(field?.isRequired)
}

const enumValues = (enumName) => {
  const directEnum = clientModule[enumName]
  if (directEnum && typeof directEnum === 'object') {
    return Object.values(directEnum)
  }

  const prismaEnum = clientModule.Prisma?.[enumName]
  if (prismaEnum && typeof prismaEnum === 'object') {
    return Object.values(prismaEnum)
  }

  return []
}

const pickEnumValue = (enumName, preferredValues, fallbackValue) => {
  const values = enumValues(enumName)
  if (!values.length) return fallbackValue

  for (const preferred of preferredValues) {
    if (values.includes(preferred)) return preferred
  }

  return values[0] || fallbackValue
}

const getTenantDisplayName = (tenant) => {
  return tenant?.name || tenant?.tenantName || tenant?.title || tenant?.slug || `商家 ${tenant?.id}`
}

const getTenantSlug = (tenant) => {
  return tenant?.slug || tenant?.tenantSlug || `tenant-${tenant?.id}`
}

const buildCampaignWhere = (tenantId) => {
  const orConditions = []

  if (hasField('Campaign', 'gameType')) {
    orConditions.push({ gameType: GRID_GAME_TYPE })
  }

  if (hasField('Campaign', 'type')) {
    orConditions.push({ type: GRID_GAME_TYPE })
  }

  if (hasField('Campaign', 'campaignType')) {
    orConditions.push({ campaignType: GRID_GAME_TYPE })
  }

  if (hasField('Campaign', 'gameKey')) {
    orConditions.push({ gameKey: GRID_GAME_TYPE })
  }

  const where = { tenantId }

  if (orConditions.length) {
    where.OR = orConditions
  } else if (hasField('Campaign', 'title')) {
    where.title = { contains: '九宮格' }
  } else if (hasField('Campaign', 'name')) {
    where.name = { contains: '九宮格' }
  }

  return where
}

const buildCampaignData = (tenant) => {
  const now = new Date()
  const startedAt = new Date(now)
  startedAt.setDate(startedAt.getDate() - 1)

  const endedAt = new Date(now)
  endedAt.setFullYear(endedAt.getFullYear() + 1)

  const tenantName = getTenantDisplayName(tenant)
  const tenantSlug = getTenantSlug(tenant)

  const data = {}

  if (hasField('Campaign', 'tenantId')) data.tenantId = tenant.id

  if (hasField('Campaign', 'title')) {
    data.title = `${tenantName}｜精緻九宮格活動`
  }

  if (hasField('Campaign', 'name')) {
    data.name = `${tenantName}｜精緻九宮格活動`
  }

  if (hasField('Campaign', 'slug')) {
    data.slug = `${tenantSlug}-premium-grid`
  }

  if (hasField('Campaign', 'description')) {
    data.description = '多商家精緻九宮格互動抽獎活動'
  }

  if (hasField('Campaign', 'rules')) {
    data.rules = '點擊九宮格中間按鈕開始抽獎，中獎後系統會自動寫入遊戲紀錄。'
  }

  if (hasField('Campaign', 'prizeDescription')) {
    data.prizeDescription = '獎品依活動設定與後台獎項資料為準。'
  }

  if (hasField('Campaign', 'gameType')) data.gameType = GRID_GAME_TYPE
  if (hasField('Campaign', 'type')) data.type = GRID_GAME_TYPE
  if (hasField('Campaign', 'campaignType')) data.campaignType = GRID_GAME_TYPE
  if (hasField('Campaign', 'gameKey')) data.gameKey = GRID_GAME_TYPE

  if (hasField('Campaign', 'status')) {
    data.status = pickEnumValue(
      'CampaignStatus',
      ['PUBLISHED', 'ACTIVE', 'ONGOING', 'ENABLED', 'PUBLIC', 'OPEN'],
      'PUBLISHED'
    )
  }

  if (hasField('Campaign', 'isActive')) data.isActive = true
  if (hasField('Campaign', 'isPublished')) data.isPublished = true
  if (hasField('Campaign', 'published')) data.published = true

  if (hasField('Campaign', 'startAt')) data.startAt = startedAt
  if (hasField('Campaign', 'startsAt')) data.startsAt = startedAt
  if (hasField('Campaign', 'startTime')) data.startTime = startedAt
  if (hasField('Campaign', 'startedAt')) data.startedAt = startedAt

  if (hasField('Campaign', 'endAt')) data.endAt = endedAt
  if (hasField('Campaign', 'endsAt')) data.endsAt = endedAt
  if (hasField('Campaign', 'endTime')) data.endTime = endedAt
  if (hasField('Campaign', 'endedAt')) data.endedAt = endedAt

  if (hasField('Campaign', 'settings')) data.settings = {}
  if (hasField('Campaign', 'config')) data.config = {}
  if (hasField('Campaign', 'metadata')) data.metadata = {}

  return data
}

const buildGameConfigData = (tenant, campaign) => {
  const data = {}

  if (hasField('GameConfig', 'tenantId')) data.tenantId = tenant.id
  if (hasField('GameConfig', 'campaignId')) data.campaignId = campaign.id

  if (hasField('GameConfig', 'gameType')) data.gameType = GRID_GAME_TYPE
  if (hasField('GameConfig', 'type')) data.type = GRID_GAME_TYPE
  if (hasField('GameConfig', 'gameKey')) data.gameKey = GRID_GAME_TYPE

  const configPayload = {
    title: '超級九宮格',
    subtitle: '無敵大幸運',
    description: '打造專屬互動抽獎體驗',
    dailyLoginText: '每日登入抽好禮',
    shareEnabled: true,
    sourceTrackingEnabled: true,
    tenantFrontPath: `/play/${getTenantSlug(tenant)}/premium-grid`,
    gridItems: [
      { label: '折價券', icon: '🎁' },
      { label: '點數', icon: '💯' },
      { label: '飲品券', icon: '🥤' },
      { label: '小禮物', icon: '🎀' },
      { label: '尚未開放', icon: '✨' },
      { label: '優惠券', icon: '🎫' },
      { label: '抽獎券', icon: '🎟️' },
      { label: '神秘禮', icon: '📦' },
      { label: '大獎', icon: '👑' }
    ]
  }

  if (hasField('GameConfig', 'config')) data.config = configPayload
  if (hasField('GameConfig', 'settings')) data.settings = configPayload
  if (hasField('GameConfig', 'value')) data.value = configPayload

  return data
}

const hasRequiredCreateFieldsMissing = (modelName, data) => {
  const fields = getModelFields(modelName)
  const ignored = new Set(['id', 'createdAt', 'updatedAt'])

  return fields
    .filter((field) => field.isRequired && !field.hasDefaultValue && !ignored.has(field.name))
    .filter((field) => data[field.name] === undefined)
    .map((field) => field.name)
}

const ensureCampaignForTenant = async (tenant) => {
  const tenantName = getTenantDisplayName(tenant)
  const tenantSlug = getTenantSlug(tenant)

  const existing = await prisma.campaign.findFirst({
    where: buildCampaignWhere(tenant.id),
    orderBy: hasField('Campaign', 'createdAt') ? { createdAt: 'asc' } : undefined
  })

  if (existing) {
    log(`✅ ${tenantName} (${tenantSlug}) 已有 GRID 活動，略過。`)
    return existing
  }

  const data = buildCampaignData(tenant)
  const missingFields = hasRequiredCreateFieldsMissing('Campaign', data)

  if (missingFields.length) {
    throw new Error(
      `Campaign 建立資料缺少必要欄位：${missingFields.join(', ')}。請把 backend/prisma/schema.prisma 的 Campaign model 貼給我，我幫你補齊。`
    )
  }

  const campaign = await prisma.campaign.create({ data })

  log(`✅ ${tenantName} (${tenantSlug}) GRID 活動建立完成，campaignId=${campaign.id}`)
  return campaign
}

const ensureGameConfigForTenant = async (tenant, campaign) => {
  if (!prisma.gameConfig) {
    return
  }

  const where = {}

  if (hasField('GameConfig', 'campaignId')) {
    where.campaignId = campaign.id
  }

  if (hasField('GameConfig', 'tenantId')) {
    where.tenantId = tenant.id
  }

  if (!Object.keys(where).length) {
    return
  }

  const existing = await prisma.gameConfig.findFirst({ where })

  if (existing) {
    log(`   ↳ GameConfig 已存在，略過。`)
    return
  }

  const data = buildGameConfigData(tenant, campaign)
  const missingFields = hasRequiredCreateFieldsMissing('GameConfig', data)

  if (missingFields.length) {
    log(`   ↳ GameConfig 缺少必要欄位 ${missingFields.join(', ')}，先略過，不影響 Campaign 補建。`)
    return
  }

  await prisma.gameConfig.create({ data })
  log(`   ↳ GameConfig 建立完成。`)
}

const main = async () => {
  log('')
  log('==============================================')
  log('V2.3 補建精緻九宮格 GRID 活動腳本開始')
  log('==============================================')
  log('')

  if (!prisma.tenant) {
    throw new Error('找不到 Prisma Tenant model，請確認 schema.prisma 是否已有 Tenant。')
  }

  if (!prisma.campaign) {
    throw new Error('找不到 Prisma Campaign model，請確認 schema.prisma 是否已有 Campaign。')
  }

  const tenants = await prisma.tenant.findMany({
    orderBy: hasField('Tenant', 'id') ? { id: 'asc' } : undefined
  })

  if (!tenants.length) {
    log('⚠️ 目前沒有任何商家 Tenant，因此沒有建立 GRID 活動。')
    return
  }

  for (const tenant of tenants) {
    const campaign = await ensureCampaignForTenant(tenant)
    await ensureGameConfigForTenant(tenant, campaign)
  }

  log('')
  log('==============================================')
  log('✅ V2.3 精緻九宮格 GRID 活動補建完成')
  log('請重開後端與前端後，再測試：')
  log('http://localhost:5173/play/a-shop/premium-grid')
  log('http://localhost:5173/play/b-shop/premium-grid')
  log('==============================================')
  log('')
}

try {
  await main()
} catch (error) {
  console.error('')
  console.error('❌ 補建精緻九宮格 GRID 活動失敗')
  console.error(error)
  console.error('')
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
