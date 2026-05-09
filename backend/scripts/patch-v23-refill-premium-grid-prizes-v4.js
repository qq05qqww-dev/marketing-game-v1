/**
 * V2.3 第 30 批修補腳本 v4
 * 檔名：patch-v23-refill-premium-grid-prizes-v4.js
 *
 * 目的：
 * - 修正精緻九宮格前台顯示：
 *   「目前獎品庫存已抽完，請等待主辦單位補貨或更新活動。」
 *
 * 會做的事：
 * 1. 找出所有商家的 GRID / 精緻九宮格 Campaign
 * 2. 如果該 Campaign 沒有 Prize，補建 8 個預設獎品
 * 3. 如果該 Campaign 已有 Prize，但庫存為 0 或數量不足，補回預設庫存
 * 4. 保留既有 Campaign / Tenant / Golden Egg 功能，不動砸金蛋
 *
 * 使用方式：
 * 1. 放到：
 *    backend/scripts/patch-v23-refill-premium-grid-prizes-v4.js
 *
 * 2. 在 backend 目錄執行：
 *    node scripts/patch-v23-refill-premium-grid-prizes-v4.js
 *
 * 3. 跑完後重開後端與前端
 */

const clientModule = await import('@prisma/client')
const { PrismaClient } = clientModule
const prisma = new PrismaClient()

const GRID_GAME_TYPE = 'GRID'

const DEFAULT_GRID_PRIZES = [
  {
    title: '品牌折價券',
    shortName: '折價券',
    icon: '🎁',
    description: '可於下次消費折抵使用。',
    quantity: 100,
    weight: 25
  },
  {
    title: '會員點數 100 點',
    shortName: '點數',
    icon: '💯',
    description: '會員點數獎勵。',
    quantity: 100,
    weight: 20
  },
  {
    title: '飲品兌換券',
    shortName: '飲品券',
    icon: '🥤',
    description: '可兌換指定飲品。',
    quantity: 80,
    weight: 15
  },
  {
    title: '小禮物',
    shortName: '小禮物',
    icon: '🎀',
    description: '隨機精美小禮物。',
    quantity: 60,
    weight: 15
  },
  {
    title: '限定優惠券',
    shortName: '優惠券',
    icon: '🎫',
    description: '限定活動優惠券。',
    quantity: 60,
    weight: 12
  },
  {
    title: '抽獎券',
    shortName: '抽獎券',
    icon: '🎟️',
    description: '可參加後續抽獎活動。',
    quantity: 50,
    weight: 8
  },
  {
    title: '神秘禮',
    shortName: '神秘禮',
    icon: '📦',
    description: '主辦單位準備的神秘獎品。',
    quantity: 30,
    weight: 4
  },
  {
    title: '超級大獎',
    shortName: '大獎',
    icon: '👑',
    description: '精緻九宮格活動超級大獎。',
    quantity: 5,
    weight: 1
  }
]

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

const getField = (modelName, fieldName) => {
  return getModelFields(modelName).find((field) => field.name === fieldName) || null
}

const enumValues = (enumName) => {
  const directEnum = clientModule[enumName]
  if (directEnum && typeof directEnum === 'object') return Object.values(directEnum)

  const prismaEnum = clientModule.Prisma?.[enumName]
  if (prismaEnum && typeof prismaEnum === 'object') return Object.values(prismaEnum)

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

const isCreateRequiredScalarField = (field) => {
  if (!field) return false
  if (!field.isRequired) return false
  if (field.hasDefaultValue) return false
  if (['id', 'createdAt', 'updatedAt'].includes(field.name)) return false
  if (field.isList) return false
  if (field.kind === 'object') return false
  if (field.relationName) return false

  return true
}

const getDefaultValueForField = (field) => {
  if (!field) return null

  if (field.kind === 'enum') {
    return pickEnumValue(
      field.type,
      ['ACTIVE', 'PUBLISHED', 'ENABLED', 'AVAILABLE', 'OPEN', 'NORMAL', 'DRAFT'],
      enumValues(field.type)[0]
    )
  }

  if (field.type === 'String') return ''
  if (field.type === 'Boolean') return true
  if (['Int', 'BigInt'].includes(field.type)) return 0
  if (['Float', 'Decimal'].includes(field.type)) return 0
  if (field.type === 'DateTime') return new Date()
  if (field.type === 'Json') return {}

  return null
}

const fillRequiredScalars = (modelName, data) => {
  const result = { ...data }

  for (const field of getModelFields(modelName)) {
    if (!isCreateRequiredScalarField(field)) continue
    if (result[field.name] !== undefined) continue

    result[field.name] = getDefaultValueForField(field)
  }

  return result
}

const buildCampaignWhere = (tenantId) => {
  const orConditions = []

  if (hasField('Campaign', 'gameType')) orConditions.push({ gameType: GRID_GAME_TYPE })
  if (hasField('Campaign', 'type')) orConditions.push({ type: GRID_GAME_TYPE })
  if (hasField('Campaign', 'campaignType')) orConditions.push({ campaignType: GRID_GAME_TYPE })
  if (hasField('Campaign', 'gameKey')) orConditions.push({ gameKey: GRID_GAME_TYPE })

  const where = {}

  if (hasField('Campaign', 'tenantId')) where.tenantId = tenantId

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
  if (hasField('Campaign', 'title')) data.title = `${tenantName}｜精緻九宮格活動`
  if (hasField('Campaign', 'name')) data.name = `${tenantName}｜精緻九宮格活動`
  if (hasField('Campaign', 'slug')) data.slug = `${tenantSlug}-premium-grid`
  if (hasField('Campaign', 'description')) data.description = '多商家精緻九宮格互動抽獎活動'
  if (hasField('Campaign', 'rules')) data.rules = '點擊九宮格中間按鈕開始抽獎，中獎後系統會自動寫入遊戲紀錄。'
  if (hasField('Campaign', 'prizeDescription')) data.prizeDescription = '獎品依活動設定與後台獎項資料為準。'

  if (hasField('Campaign', 'gameType')) data.gameType = GRID_GAME_TYPE
  if (hasField('Campaign', 'type')) data.type = GRID_GAME_TYPE
  if (hasField('Campaign', 'campaignType')) data.campaignType = GRID_GAME_TYPE
  if (hasField('Campaign', 'gameKey')) data.gameKey = GRID_GAME_TYPE

  if (hasField('Campaign', 'status')) {
    const statusField = getField('Campaign', 'status')
    data.status = statusField?.kind === 'enum'
      ? pickEnumValue(statusField.type, ['PUBLISHED', 'ACTIVE', 'ONGOING', 'ENABLED', 'PUBLIC', 'OPEN'], 'PUBLISHED')
      : 'PUBLISHED'
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

  return fillRequiredScalars('Campaign', data)
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
    tenantFrontPath: `/play/${getTenantSlug(tenant)}/premium-grid`
  }

  if (hasField('GameConfig', 'config')) data.config = configPayload
  if (hasField('GameConfig', 'settings')) data.settings = configPayload
  if (hasField('GameConfig', 'value')) data.value = configPayload

  return fillRequiredScalars('GameConfig', data)
}

const buildPrizeWhere = (tenant, campaign) => {
  const where = {}

  if (hasField('Prize', 'campaignId')) where.campaignId = campaign.id
  if (hasField('Prize', 'tenantId')) where.tenantId = tenant.id

  return where
}

const setIfFieldExists = (modelName, data, fieldNames, value) => {
  for (const fieldName of fieldNames) {
    if (hasField(modelName, fieldName)) {
      data[fieldName] = value
    }
  }
}

const buildPrizeData = (tenant, campaign, prize, index) => {
  const data = {}

  if (hasField('Prize', 'tenantId')) data.tenantId = tenant.id
  if (hasField('Prize', 'campaignId')) data.campaignId = campaign.id

  setIfFieldExists('Prize', data, ['title', 'name', 'label'], prize.title)
  setIfFieldExists('Prize', data, ['shortName', 'displayName'], prize.shortName)
  setIfFieldExists('Prize', data, ['description', 'memo', 'note'], prize.description)
  setIfFieldExists('Prize', data, ['icon', 'emoji'], prize.icon)

  setIfFieldExists('Prize', data, ['quantity', 'totalQuantity', 'stock', 'totalStock'], prize.quantity)
  setIfFieldExists('Prize', data, ['remainingQuantity', 'remainingStock', 'availableQuantity', 'availableStock'], prize.quantity)

  setIfFieldExists('Prize', data, ['weight', 'probabilityWeight'], prize.weight)
  setIfFieldExists('Prize', data, ['probability', 'chance', 'rate'], prize.weight)

  setIfFieldExists('Prize', data, ['sortOrder', 'displayOrder', 'order'], index + 1)

  if (hasField('Prize', 'gameType')) data.gameType = GRID_GAME_TYPE

  if (hasField('Prize', 'type')) {
    const field = getField('Prize', 'type')
    data.type = field?.kind === 'enum'
      ? pickEnumValue(field.type, ['COUPON', 'GIFT', 'POINTS', 'NORMAL', 'PRIZE'], enumValues(field.type)[0])
      : 'PRIZE'
  }

  if (hasField('Prize', 'status')) {
    const field = getField('Prize', 'status')
    data.status = field?.kind === 'enum'
      ? pickEnumValue(field.type, ['ACTIVE', 'AVAILABLE', 'ENABLED', 'PUBLISHED', 'NORMAL'], enumValues(field.type)[0])
      : 'ACTIVE'
  }

  if (hasField('Prize', 'isActive')) data.isActive = true
  if (hasField('Prize', 'enabled')) data.enabled = true
  if (hasField('Prize', 'isEnabled')) data.isEnabled = true

  if (hasField('Prize', 'imageUrl')) data.imageUrl = ''
  if (hasField('Prize', 'settings')) data.settings = {}
  if (hasField('Prize', 'metadata')) data.metadata = {}

  return fillRequiredScalars('Prize', data)
}

const buildPrizeRefillData = (prizeTemplate) => {
  const data = {}

  setIfFieldExists('Prize', data, ['quantity', 'totalQuantity', 'stock', 'totalStock'], prizeTemplate.quantity)
  setIfFieldExists('Prize', data, ['remainingQuantity', 'remainingStock', 'availableQuantity', 'availableStock'], prizeTemplate.quantity)

  setIfFieldExists('Prize', data, ['weight', 'probabilityWeight'], prizeTemplate.weight)
  setIfFieldExists('Prize', data, ['probability', 'chance', 'rate'], prizeTemplate.weight)

  if (hasField('Prize', 'status')) {
    const field = getField('Prize', 'status')
    data.status = field?.kind === 'enum'
      ? pickEnumValue(field.type, ['ACTIVE', 'AVAILABLE', 'ENABLED', 'PUBLISHED', 'NORMAL'], enumValues(field.type)[0])
      : 'ACTIVE'
  }

  if (hasField('Prize', 'isActive')) data.isActive = true
  if (hasField('Prize', 'enabled')) data.enabled = true
  if (hasField('Prize', 'isEnabled')) data.isEnabled = true

  return data
}

const getPrizeDisplayName = (prize) => {
  return prize.title || prize.name || prize.label || prize.shortName || prize.displayName || `Prize ${prize.id}`
}

const getPrizeRemainingValue = (prize) => {
  const fields = ['remainingQuantity', 'remainingStock', 'availableQuantity', 'availableStock', 'quantity', 'stock', 'totalQuantity', 'totalStock']

  for (const fieldName of fields) {
    if (hasField('Prize', fieldName) && prize[fieldName] !== undefined && prize[fieldName] !== null) {
      return Number(prize[fieldName])
    }
  }

  return null
}

const findTemplateForPrize = (prize, index) => {
  const name = getPrizeDisplayName(prize)
  const matched = DEFAULT_GRID_PRIZES.find((item) => {
    return name.includes(item.shortName) || name.includes(item.title) || item.title.includes(name)
  })

  return matched || DEFAULT_GRID_PRIZES[index % DEFAULT_GRID_PRIZES.length]
}

const ensureCampaignForTenant = async (tenant) => {
  const tenantName = getTenantDisplayName(tenant)
  const tenantSlug = getTenantSlug(tenant)

  const existing = await prisma.campaign.findFirst({
    where: buildCampaignWhere(tenant.id),
    orderBy: hasField('Campaign', 'createdAt') ? { createdAt: 'asc' } : undefined
  })

  if (existing) {
    log(`✅ ${tenantName} (${tenantSlug}) 已有 GRID 活動，campaignId=${existing.id}`)
    return existing
  }

  const campaign = await prisma.campaign.create({
    data: buildCampaignData(tenant)
  })

  log(`✅ ${tenantName} (${tenantSlug}) GRID 活動建立完成，campaignId=${campaign.id}`)
  return campaign
}

const ensureGameConfigForTenant = async (tenant, campaign) => {
  if (!prisma.gameConfig) return

  const where = {}

  if (hasField('GameConfig', 'campaignId')) where.campaignId = campaign.id
  if (hasField('GameConfig', 'tenantId')) where.tenantId = tenant.id
  if (!Object.keys(where).length) return

  const existing = await prisma.gameConfig.findFirst({ where })

  if (existing) {
    log('   ↳ GameConfig 已存在，略過。')
    return
  }

  await prisma.gameConfig.create({
    data: buildGameConfigData(tenant, campaign)
  })

  log('   ↳ GameConfig 建立完成。')
}

const ensurePrizesForTenantCampaign = async (tenant, campaign) => {
  if (!prisma.prize) {
    log('   ↳ 找不到 Prize model，略過獎品補貨。')
    return
  }

  const where = buildPrizeWhere(tenant, campaign)

  if (!Object.keys(where).length) {
    log('   ↳ Prize model 找不到 campaignId / tenantId 可查詢欄位，略過獎品補貨。')
    return
  }

  const existingPrizes = await prisma.prize.findMany({
    where,
    orderBy: hasField('Prize', 'id') ? { id: 'asc' } : undefined
  })

  if (!existingPrizes.length) {
    for (let index = 0; index < DEFAULT_GRID_PRIZES.length; index += 1) {
      const prize = DEFAULT_GRID_PRIZES[index]
      await prisma.prize.create({
        data: buildPrizeData(tenant, campaign, prize, index)
      })
    }

    log(`   ↳ 沒有獎品，已補建 ${DEFAULT_GRID_PRIZES.length} 個精緻九宮格預設獎品。`)
    return
  }

  let refillCount = 0
  let activeCount = 0

  for (let index = 0; index < existingPrizes.length; index += 1) {
    const prize = existingPrizes[index]
    const remaining = getPrizeRemainingValue(prize)
    const template = findTemplateForPrize(prize, index)
    const shouldRefill = remaining === null || Number.isNaN(remaining) || remaining <= 0

    const updateData = buildPrizeRefillData(template)

    if (shouldRefill) {
      await prisma.prize.update({
        where: { id: prize.id },
        data: updateData
      })

      refillCount += 1
      activeCount += 1
      log(`   ↳ 已補貨：${getPrizeDisplayName(prize)} → ${template.quantity}`)
    } else {
      // 即使庫存大於 0，也補上 ACTIVE / weight，避免 DrawEngine 因狀態或權重篩不到。
      await prisma.prize.update({
        where: { id: prize.id },
        data: updateData
      })

      activeCount += 1
    }
  }

  log(`   ↳ 已檢查 ${existingPrizes.length} 個獎品，補貨 ${refillCount} 個，並同步啟用狀態 / 權重。`)
}

const main = async () => {
  log('')
  log('==============================================')
  log('V2.3 精緻九宮格 GRID 獎品補貨腳本 v4 開始')
  log('==============================================')
  log('')

  if (!prisma.tenant) throw new Error('找不到 Prisma Tenant model，請確認 schema.prisma 是否已有 Tenant。')
  if (!prisma.campaign) throw new Error('找不到 Prisma Campaign model，請確認 schema.prisma 是否已有 Campaign。')

  const tenants = await prisma.tenant.findMany({
    orderBy: hasField('Tenant', 'id') ? { id: 'asc' } : undefined
  })

  if (!tenants.length) {
    log('⚠️ 目前沒有任何商家 Tenant，因此沒有補貨。')
    return
  }

  for (const tenant of tenants) {
    const campaign = await ensureCampaignForTenant(tenant)
    await ensureGameConfigForTenant(tenant, campaign)
    await ensurePrizesForTenantCampaign(tenant, campaign)
  }

  log('')
  log('==============================================')
  log('✅ V2.3 精緻九宮格 GRID 獎品補貨完成')
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
  console.error('❌ 精緻九宮格 GRID 獎品補貨失敗')
  console.error(error)
  console.error('')
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
