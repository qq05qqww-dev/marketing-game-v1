import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function upsertTenant({ slug, name, contactName, contactPhone, contactEmail, note }) {
  return prisma.tenant.upsert({
    where: { slug },
    update: {
      name,
      contactName,
      contactPhone,
      contactEmail,
      note,
      status: 'ACTIVE'
    },
    create: {
      slug,
      name,
      contactName,
      contactPhone,
      contactEmail,
      note,
      status: 'ACTIVE'
    }
  })
}

async function upsertUser({ email, passwordHash, name, role, memberLevel = 'NORMAL', tenantId = null }) {
  return prisma.user.upsert({
    where: { email },
    update: {
      password: passwordHash,
      role,
      memberLevel,
      name,
      tenantId
    },
    create: {
      name,
      email,
      password: passwordHash,
      role,
      memberLevel,
      tenantId
    }
  })
}

async function main() {
  const defaultPassword = await bcrypt.hash('123456', 10)

  // V2.3 多商家權限版測試商家
  const tenantA = await upsertTenant({
    slug: 'a-shop',
    name: 'A 商家測試店',
    contactName: 'A 客人',
    contactPhone: '0900000001',
    contactEmail: 'a-owner@example.com',
    note: 'V2.3 測試用 A 商家'
  })

  const tenantB = await upsertTenant({
    slug: 'b-shop',
    name: 'B 商家測試店',
    contactName: 'B 客人',
    contactPhone: '0900000002',
    contactEmail: 'b-owner@example.com',
    note: 'V2.3 測試用 B 商家'
  })

  // 保留原本測試會員與系統管理員帳號。
  // admin@example.com 維持 ADMIN，避免既有前台 / 後台 role 判斷失效。
  await upsertUser({
    email: 'test@example.com',
    passwordHash: defaultPassword,
    role: 'USER',
    memberLevel: 'NORMAL',
    name: '測試會員',
    tenantId: tenantA.id
  })

  await upsertUser({
    email: 'admin@example.com',
    passwordHash: defaultPassword,
    role: 'ADMIN',
    memberLevel: 'VIP',
    name: '系統管理員',
    tenantId: null
  })

  // V2.3 商家後台測試帳號
  await upsertUser({
    email: 'a-admin@example.com',
    passwordHash: defaultPassword,
    role: 'MERCHANT_ADMIN',
    memberLevel: 'VIP',
    name: 'A 商家管理員',
    tenantId: tenantA.id
  })

  await upsertUser({
    email: 'b-admin@example.com',
    passwordHash: defaultPassword,
    role: 'MERCHANT_ADMIN',
    memberLevel: 'VIP',
    name: 'B 商家管理員',
    tenantId: tenantB.id
  })

  const campaign1 = await prisma.campaign.upsert({
    where: { id: 1 },
    update: {
      tenantId: tenantA.id,
      title: 'A 商家週年慶大轉盤',
      slug: 'a-shop-wheel',
      description: 'A 商家專屬轉盤抽折價券、再玩一次、精美小禮',
      gameType: 'WHEEL',
      status: 'ACTIVE',
      startAt: new Date('2026-04-01T00:00:00.000Z'),
      endAt: new Date('2026-12-31T23:59:59.000Z'),
      dailyLimit: 3,
      totalLimit: 10,
      requireLogin: true,
      allowedRole: 'USER',
      requiredLevel: 'NORMAL'
    },
    create: {
      id: 1,
      tenantId: tenantA.id,
      title: 'A 商家週年慶大轉盤',
      slug: 'a-shop-wheel',
      description: 'A 商家專屬轉盤抽折價券、再玩一次、精美小禮',
      gameType: 'WHEEL',
      status: 'ACTIVE',
      startAt: new Date('2026-04-01T00:00:00.000Z'),
      endAt: new Date('2026-12-31T23:59:59.000Z'),
      dailyLimit: 3,
      totalLimit: 10,
      requireLogin: true,
      allowedRole: 'USER',
      requiredLevel: 'NORMAL'
    }
  })

  const campaign2 = await prisma.campaign.upsert({
    where: { id: 2 },
    update: {
      tenantId: tenantB.id,
      title: 'B 商家砸金蛋活動',
      slug: 'b-shop-golden-egg',
      description: 'B 商家專屬砸金蛋活動，玩家紀錄只歸 B 商家。',
      gameType: 'GOLDEN_EGG',
      status: 'ACTIVE',
      startAt: new Date('2026-05-01T00:00:00.000Z'),
      endAt: new Date('2026-12-31T23:59:59.000Z'),
      dailyLimit: 3,
      totalLimit: 10,
      requireLogin: false,
      allowedRole: 'USER',
      requiredLevel: 'NORMAL'
    },
    create: {
      id: 2,
      tenantId: tenantB.id,
      title: 'B 商家砸金蛋活動',
      slug: 'b-shop-golden-egg',
      description: 'B 商家專屬砸金蛋活動，玩家紀錄只歸 B 商家。',
      gameType: 'GOLDEN_EGG',
      status: 'ACTIVE',
      startAt: new Date('2026-05-01T00:00:00.000Z'),
      endAt: new Date('2026-12-31T23:59:59.000Z'),
      dailyLimit: 3,
      totalLimit: 10,
      requireLogin: false,
      allowedRole: 'USER',
      requiredLevel: 'NORMAL'
    }
  })

  await prisma.gameConfig.upsert({
    where: { campaignId: campaign2.id },
    update: {
      tenantId: tenantB.id,
      settings: {
        pageTitle: 'B 商家砸金蛋活動',
        mainTitle: 'B 商家專屬砸金蛋',
        subTitle: '輸入序號後選一顆金蛋試手氣',
        themeBgFrom: '#111827',
        themeBgMiddle: '#78350f',
        themeBgTo: '#030712',
        themeAccentColor: '#facc15',
        themeButtonColor: '#111827',
        themeButtonDarkColor: '#030712',
        eggColorTop: '#fff7ad',
        eggColorMiddle: '#fde047',
        eggColorBottom: '#b45309'
      }
    },
    create: {
      campaignId: campaign2.id,
      tenantId: tenantB.id,
      settings: {
        pageTitle: 'B 商家砸金蛋活動',
        mainTitle: 'B 商家專屬砸金蛋',
        subTitle: '輸入序號後選一顆金蛋試手氣',
        themeBgFrom: '#111827',
        themeBgMiddle: '#78350f',
        themeBgTo: '#030712',
        themeAccentColor: '#facc15',
        themeButtonColor: '#111827',
        themeButtonDarkColor: '#030712',
        eggColorTop: '#fff7ad',
        eggColorMiddle: '#fde047',
        eggColorBottom: '#b45309'
      }
    }
  })

  const existingPrizesA = await prisma.prize.findMany({
    where: { campaignId: campaign1.id }
  })

  if (existingPrizesA.length === 0) {
    await prisma.prize.createMany({
      data: [
        {
          tenantId: tenantA.id,
          campaignId: campaign1.id,
          title: '100 元折價券',
          remainStock: 20,
          stockTotal: 20,
          stockUsed: 0,
          probability: 0.1
        },
        {
          tenantId: tenantA.id,
          campaignId: campaign1.id,
          title: '50 元折價券',
          remainStock: 50,
          stockTotal: 50,
          stockUsed: 0,
          probability: 0.2
        },
        {
          tenantId: tenantA.id,
          campaignId: campaign1.id,
          title: '再玩一次',
          remainStock: 999,
          stockTotal: 999,
          stockUsed: 0,
          probability: 0.3
        },
        {
          tenantId: tenantA.id,
          campaignId: campaign1.id,
          title: '銘謝惠顧',
          remainStock: 9999,
          stockTotal: 9999,
          stockUsed: 0,
          probability: 0.4,
          type: 'LOSE'
        }
      ]
    })
  }

  const existingPrizesB = await prisma.prize.findMany({
    where: { campaignId: campaign2.id }
  })

  if (existingPrizesB.length === 0) {
    await prisma.prize.createMany({
      data: [
        {
          tenantId: tenantB.id,
          campaignId: campaign2.id,
          title: 'B 商家 VIP 折價券',
          shortName: 'VIP券',
          remainStock: 30,
          stockTotal: 30,
          stockUsed: 0,
          probability: 0.2,
          sortOrder: 1
        },
        {
          tenantId: tenantB.id,
          campaignId: campaign2.id,
          title: 'B 商家小禮物',
          shortName: '小禮',
          remainStock: 50,
          stockTotal: 50,
          stockUsed: 0,
          probability: 0.3,
          sortOrder: 2
        },
        {
          tenantId: tenantB.id,
          campaignId: campaign2.id,
          title: '銘謝惠顧',
          shortName: '未中獎',
          remainStock: 9999,
          stockTotal: 9999,
          stockUsed: 0,
          probability: 0.5,
          type: 'LOSE',
          sortOrder: 99
        }
      ]
    })
  }

  const existingSerialsB = await prisma.serialCode.findMany({
    where: { campaignId: campaign2.id }
  })

  if (existingSerialsB.length === 0) {
    await prisma.serialCode.createMany({
      data: [
        {
          tenantId: tenantB.id,
          campaignId: campaign2.id,
          code: 'B-GOLD-0001',
          batchCode: 'B-DEMO',
          distributedChannel: 'LINE',
          rewardChance: 1,
          status: 'UNUSED'
        },
        {
          tenantId: tenantB.id,
          campaignId: campaign2.id,
          code: 'B-GOLD-0002',
          batchCode: 'B-DEMO',
          distributedChannel: 'LINE',
          rewardChance: 1,
          status: 'UNUSED'
        },
        {
          tenantId: tenantB.id,
          campaignId: campaign2.id,
          code: 'B-GOLD-0003',
          batchCode: 'B-DEMO',
          distributedChannel: 'FB',
          rewardChance: 1,
          status: 'UNUSED'
        }
      ]
    })
  }

  console.log('V2.3 多商家資料庫骨架 Seed 完成')
  console.log('平台管理員：admin@example.com / 123456')
  console.log('A 商家管理員：a-admin@example.com / 123456')
  console.log('B 商家管理員：b-admin@example.com / 123456')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
