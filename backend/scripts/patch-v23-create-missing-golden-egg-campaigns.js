import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const normalizeSlug = (value) => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '') || `tenant-${Date.now()}`
}

const buildDefaultGameConfigSettings = ({ tenant }) => {
  const tenantName = tenant?.name || '商家'

  return {
    pageTitle: `${tenantName} 砸金蛋活動`,
    mainTitle: `${tenantName} 專屬砸金蛋`,
    subTitle: '輸入序號後，選一顆金蛋試手氣',
    heroTagline: '正式上線砸金蛋活動',
    noticeText: '輸入主辦單位提供的序號，驗證成功後即可砸蛋。',
    serialTitle: '輸入抽獎序號',
    serialButtonText: '驗證序號',
    serialDescription: '請輸入主辦單位提供的序號，驗證成功後即可砸蛋。',
    serialSuccessText: '序號驗證成功，請選擇一顆金蛋。',
    serialErrorText: '序號無效、已使用或不存在。',
    runningText: '活動進行中，請輸入序號參加。',
    notStartedText: '活動尚未開始。',
    endedText: '活動已結束。',
    eggSize: 74,
    eggCardSize: 128,
    eggGridGap: 12,
    eggColorTop: '#fff7ad',
    eggColorMiddle: '#fde047',
    eggColorBottom: '#b45309',
    themeBgFrom: '#991b1b',
    themeBgMiddle: '#dc2626',
    themeBgTo: '#7f1d1d',
    themeAccentColor: '#facc15',
    themeButtonColor: '#dc2626',
    themeButtonDarkColor: '#7f1d1d',
    eggCardBgFrom: '#ef4444',
    eggCardBgTo: '#7f1d1d',
    eggNumberBgColor: '#7f1d1d',
    eggNumberTextColor: '#fef3c7',
    shareTitle: `${tenantName} 砸金蛋抽獎活動`,
    shareDescription: `快來參加 ${tenantName} 砸金蛋活動，試試手氣拿大獎。`,
    systemShareButtonText: '系統分享'
  }
}

const createDefaultPrizes = async ({ tenantId, campaignId }) => {
  const existingCount = await prisma.prize.count({
    where: { campaignId }
  })

  if (existingCount > 0) return

  await prisma.prize.createMany({
    data: [
      {
        tenantId,
        campaignId,
        title: '300 元折價券',
        shortName: '300',
        icon: '🎁',
        type: 'WIN',
        status: 'ACTIVE',
        probability: 20,
        stockTotal: 30,
        stockUsed: 0,
        remainStock: 30,
        sortOrder: 1
      },
      {
        tenantId,
        campaignId,
        title: '200 元折價券',
        shortName: '200',
        icon: '🎫',
        type: 'WIN',
        status: 'ACTIVE',
        probability: 20,
        stockTotal: 50,
        stockUsed: 0,
        remainStock: 50,
        sortOrder: 2
      },
      {
        tenantId,
        campaignId,
        title: '100 元折價券',
        shortName: '100',
        icon: '🧾',
        type: 'WIN',
        status: 'ACTIVE',
        probability: 20,
        stockTotal: 100,
        stockUsed: 0,
        remainStock: 100,
        sortOrder: 3
      },
      {
        tenantId,
        campaignId,
        title: '銘謝惠顧',
        shortName: '謝謝',
        icon: '🙂',
        type: 'LOSE',
        status: 'ACTIVE',
        probability: 40,
        stockTotal: 9999,
        stockUsed: 0,
        remainStock: 9999,
        sortOrder: 99
      }
    ]
  })
}

const createDefaultSerialCodes = async ({ tenantId, campaignId, tenantSlug }) => {
  const existingCount = await prisma.serialCode.count({
    where: { campaignId }
  })

  if (existingCount > 0) return

  const prefix = normalizeSlug(tenantSlug).replace(/-/g, '').slice(0, 6).toUpperCase() || 'SHOP'

  await prisma.serialCode.createMany({
    data: Array.from({ length: 10 }).map((_, index) => ({
      tenantId,
      campaignId,
      code: `${prefix}-GOLD-${String(index + 1).padStart(4, '0')}`,
      batchCode: 'DEFAULT',
      rewardChance: 1,
      status: 'UNUSED',
      distributedChannel: 'LINE',
      note: 'V2.3 既有商家預設金蛋活動補建序號'
    })),
    skipDuplicates: true
  })
}

const ensureGoldenEggCampaignForTenant = async (tenant) => {
  const existing = await prisma.campaign.findFirst({
    where: {
      tenantId: tenant.id,
      gameType: 'GOLDEN_EGG'
    },
    include: {
      gameConfig: true
    }
  })

  if (existing) {
    console.log(`略過：${tenant.name} 已有 GOLDEN_EGG 活動 ID ${existing.id}`)
    return existing
  }

  const tenantSlug = normalizeSlug(tenant.slug || tenant.name)
  const campaignSlug = `${tenantSlug}-golden-egg`

  const campaign = await prisma.campaign.create({
    data: {
      tenantId: tenant.id,
      title: `${tenant.name} 砸金蛋活動`,
      slug: campaignSlug,
      description: `${tenant.name} 專屬砸金蛋活動，玩家紀錄只歸此商家。`,
      gameType: 'GOLDEN_EGG',
      status: 'ACTIVE',
      startAt: new Date('2026-05-01T00:00:00.000Z'),
      endAt: new Date('2026-12-31T23:59:59.000Z'),
      dailyLimit: 3,
      totalLimit: 10,
      requireLogin: false,
      allowedRole: 'USER',
      requiredLevel: 'NORMAL',
      gameConfig: {
        create: {
          tenantId: tenant.id,
          settings: buildDefaultGameConfigSettings({ tenant })
        }
      }
    },
    include: {
      gameConfig: true
    }
  })

  await createDefaultPrizes({
    tenantId: tenant.id,
    campaignId: campaign.id
  })

  await createDefaultSerialCodes({
    tenantId: tenant.id,
    campaignId: campaign.id,
    tenantSlug
  })

  console.log(`已建立：${tenant.name} GOLDEN_EGG 活動 ID ${campaign.id}`)
  return campaign
}

async function main() {
  const tenants = await prisma.tenant.findMany({
    where: {
      status: {
        in: ['ACTIVE', 'INACTIVE', 'SUSPENDED']
      }
    },
    orderBy: {
      id: 'asc'
    }
  })

  if (!tenants.length) {
    console.log('目前沒有商家，不需補建。')
    return
  }

  for (const tenant of tenants) {
    await ensureGoldenEggCampaignForTenant(tenant)
  }

  console.log('V2.3 既有商家 GOLDEN_EGG 預設活動補建完成。')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
