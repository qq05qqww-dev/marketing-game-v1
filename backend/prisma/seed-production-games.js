// Multi Game Platform V2.3 Tenant Edition
// 第 34401～34800 批：正式 Render PostgreSQL 三遊戲 Campaign / SerialCode 初始化版
//
// 建議放置位置：
// backend/prisma/seed-production-games.js
//
// 用途：
// 1. 在正式 Render PostgreSQL 建立 A 商家 a-shop。
// 2. 建立三個正式 ACTIVE 活動：輪盤 WHEEL、九宮格 GRID、砸金蛋 GOLDEN_EGG。
// 3. 建立三個活動各自的測試序號：000000、999999、778899、88888。
// 4. 建立基本獎項與 gameConfig。
// 5. 修正「本機後台有資料，但手機正式網址找不到活動 / 找不到序號」問題。
//
// 注意：
// 序號是「綁活動 campaignId」，不是全平台共用。
// 所以 000000 會分別建立在輪盤、九宮格、砸金蛋三個活動底下。

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

const TEST_SERIAL_CODES = ['000000', '999999', '778899', '88888']
const DEFAULT_REWARD_CHANCE = 99

const now = new Date()
const startAt = new Date('2026-01-01T00:00:00.000Z')
const endAt = new Date('2026-12-31T23:59:59.000Z')

const normalizeCode = (value = '') => {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-')
    .replace(/[^A-Z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
}

const upsertTenant = async () => {
  return prisma.tenant.upsert({
    where: {
      slug: 'a-shop'
    },
    update: {
      name: 'A 商家測試店',
      contactName: 'A 商家管理員',
      contactPhone: '0900000001',
      contactEmail: 'a-owner@example.com',
      status: 'ACTIVE',
      note: '正式線上測試商家：輪盤 / 九宮格 / 砸金蛋'
    },
    create: {
      slug: 'a-shop',
      name: 'A 商家測試店',
      contactName: 'A 商家管理員',
      contactPhone: '0900000001',
      contactEmail: 'a-owner@example.com',
      status: 'ACTIVE',
      note: '正式線上測試商家：輪盤 / 九宮格 / 砸金蛋'
    }
  })
}

const upsertUsers = async (tenant) => {
  const passwordHash = await bcrypt.hash('123456', 10)

  const users = [
    {
      email: 'admin@example.com',
      name: '系統管理員',
      role: 'ADMIN',
      tenantId: null,
      memberLevel: 'VIP'
    },
    {
      email: 'a-admin@example.com',
      name: 'A 商家管理員',
      role: 'MERCHANT_ADMIN',
      tenantId: tenant.id,
      memberLevel: 'VIP'
    },
    {
      email: 'test@example.com',
      name: '測試會員',
      role: 'USER',
      tenantId: tenant.id,
      memberLevel: 'NORMAL'
    }
  ]

  for (const user of users) {
    await prisma.user.upsert({
      where: {
        email: user.email
      },
      update: {
        password: passwordHash,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        memberLevel: user.memberLevel
      },
      create: {
        email: user.email,
        password: passwordHash,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        memberLevel: user.memberLevel
      }
    })
  }
}

const campaignSettings = {
  WHEEL: {
    slug: 'a-shop-wheel-online',
    title: 'A 商家幸運輪盤活動',
    description: 'A 商家正式線上輪盤抽獎活動',
    gameType: 'WHEEL',
    gameConfig: {
      pageTitle: 'A 商家幸運輪盤',
      mainTitle: '幸運輪盤抽獎',
      subTitle: '輸入序號後即可轉盤抽獎',
      wheelItems: [
        { title: '50 元折價券', shortName: '50', type: 'WIN', probability: 25, stock: 100, icon: '🎫' },
        { title: '100 元折價券', shortName: '100', type: 'WIN', probability: 15, stock: 50, icon: '🎟️' },
        { title: '200 元折價券', shortName: '200', type: 'WIN', probability: 10, stock: 30, icon: '🎁' },
        { title: '銘謝惠顧', shortName: '未中獎', type: 'LOSE', probability: 50, stock: 9999, icon: '🙂' }
      ]
    }
  },
  GRID: {
    slug: 'a-shop-premium-grid-online',
    title: 'A 商家精緻九宮格活動',
    description: 'A 商家正式線上九宮格抽獎活動',
    gameType: 'GRID',
    gameConfig: {
      pageTitle: 'A 商家精緻九宮格',
      mainTitle: '九宮格抽獎',
      subTitle: '輸入序號後點擊中間格抽獎',
      gridItems: [
        { position: 1, title: '折價券', shortName: '折價券', type: 'WIN', probability: 15, stock: 100, icon: '🎁' },
        { position: 2, title: '點數', shortName: '點數', type: 'WIN', probability: 10, stock: 100, icon: '🪙' },
        { position: 3, title: '飲品券', shortName: '飲品券', type: 'WIN', probability: 10, stock: 80, icon: '🥤' },
        { position: 4, title: '小禮物', shortName: '小禮物', type: 'WIN', probability: 10, stock: 50, icon: '🎀' },
        { position: 5, title: '點擊抽選', shortName: '點擊抽選', type: 'BUTTON', probability: 0, stock: 0, icon: '✨' },
        { position: 6, title: '優惠券', shortName: '優惠券', type: 'WIN', probability: 10, stock: 80, icon: '🎟️' },
        { position: 7, title: '抽獎券', shortName: '抽獎券', type: 'WIN', probability: 10, stock: 80, icon: '🎫' },
        { position: 8, title: '神秘禮', shortName: '神秘禮', type: 'WIN', probability: 5, stock: 30, icon: '📦' },
        { position: 9, title: '大獎', shortName: '大獎', type: 'WIN', probability: 2, stock: 5, icon: '👑' },
        { position: 10, title: '銘謝惠顧', shortName: '未中獎', type: 'LOSE', probability: 28, stock: 9999, icon: '🙂' }
      ]
    }
  },
  GOLDEN_EGG: {
    slug: 'a-shop-golden-egg-online',
    title: 'A 商家砸金蛋活動',
    description: 'A 商家正式線上砸金蛋抽獎活動',
    gameType: 'GOLDEN_EGG',
    gameConfig: {
      pageTitle: 'A 商家砸金蛋活動',
      mainTitle: '砸金蛋抽獎',
      subTitle: '輸入序號後選一顆金蛋試手氣',
      themeBgFrom: '#991b1b',
      themeBgMiddle: '#7f1d1d',
      themeBgTo: '#450a0a',
      themeAccentColor: '#facc15',
      eggItems: [
        { position: 1, title: 'GOLD 1', shortName: 'GOLD 1', type: 'WIN', probability: 12, stock: 100, icon: '🥚' },
        { position: 2, title: 'GOLD 2', shortName: 'GOLD 2', type: 'WIN', probability: 12, stock: 100, icon: '🥚' },
        { position: 3, title: 'GOLD 3', shortName: 'GOLD 3', type: 'WIN', probability: 12, stock: 100, icon: '🥚' },
        { position: 4, title: 'GOLD 4', shortName: 'GOLD 4', type: 'WIN', probability: 12, stock: 100, icon: '🥚' },
        { position: 5, title: 'GOLD 5', shortName: 'GOLD 5', type: 'WIN', probability: 10, stock: 80, icon: '🥚' },
        { position: 6, title: 'GOLD 6', shortName: 'GOLD 6', type: 'WIN', probability: 10, stock: 80, icon: '🥚' },
        { position: 7, title: 'GOLD 7', shortName: 'GOLD 7', type: 'WIN', probability: 8, stock: 50, icon: '🥚' },
        { position: 8, title: 'GOLD 8', shortName: 'GOLD 8', type: 'WIN', probability: 7, stock: 30, icon: '🥚' },
        { position: 9, title: 'GOLD 9', shortName: 'GOLD 9', type: 'WIN', probability: 5, stock: 10, icon: '🥚' },
        { position: 10, title: '銘謝惠顧', shortName: '未中獎', type: 'LOSE', probability: 12, stock: 9999, icon: '🙂' }
      ]
    }
  }
}

const prizeRows = {
  WHEEL: [
    { title: '50 元折價券', shortName: '50', probability: 25, stockTotal: 100, icon: '🎫', sortOrder: 1 },
    { title: '100 元折價券', shortName: '100', probability: 15, stockTotal: 50, icon: '🎟️', sortOrder: 2 },
    { title: '200 元折價券', shortName: '200', probability: 10, stockTotal: 30, icon: '🎁', sortOrder: 3 },
    { title: '銘謝惠顧', shortName: '未中獎', probability: 50, stockTotal: 9999, icon: '🙂', type: 'LOSE', sortOrder: 99 }
  ],
  GRID: [
    { title: '折價券', shortName: '折價券', probability: 15, stockTotal: 100, icon: '🎁', sortOrder: 1 },
    { title: '點數', shortName: '點數', probability: 10, stockTotal: 100, icon: '🪙', sortOrder: 2 },
    { title: '飲品券', shortName: '飲品券', probability: 10, stockTotal: 80, icon: '🥤', sortOrder: 3 },
    { title: '小禮物', shortName: '小禮物', probability: 10, stockTotal: 50, icon: '🎀', sortOrder: 4 },
    { title: '優惠券', shortName: '優惠券', probability: 10, stockTotal: 80, icon: '🎟️', sortOrder: 5 },
    { title: '抽獎券', shortName: '抽獎券', probability: 10, stockTotal: 80, icon: '🎫', sortOrder: 6 },
    { title: '神秘禮', shortName: '神秘禮', probability: 5, stockTotal: 30, icon: '📦', sortOrder: 7 },
    { title: '大獎', shortName: '大獎', probability: 2, stockTotal: 5, icon: '👑', sortOrder: 8 },
    { title: '銘謝惠顧', shortName: '未中獎', probability: 28, stockTotal: 9999, icon: '🙂', type: 'LOSE', sortOrder: 99 }
  ],
  GOLDEN_EGG: [
    { title: '金蛋 VIP 折價券', shortName: 'VIP券', probability: 20, stockTotal: 50, icon: '🥚', sortOrder: 1 },
    { title: '金蛋小禮物', shortName: '小禮', probability: 30, stockTotal: 80, icon: '🎁', sortOrder: 2 },
    { title: '金蛋大獎', shortName: '大獎', probability: 5, stockTotal: 10, icon: '👑', sortOrder: 3 },
    { title: '銘謝惠顧', shortName: '未中獎', probability: 45, stockTotal: 9999, icon: '🙂', type: 'LOSE', sortOrder: 99 }
  ]
}

const upsertCampaign = async (tenant, key) => {
  const config = campaignSettings[key]

  const campaign = await prisma.campaign.upsert({
    where: {
      slug: config.slug
    },
    update: {
      tenantId: tenant.id,
      title: config.title,
      description: config.description,
      gameType: config.gameType,
      status: 'ACTIVE',
      startAt,
      endAt,
      dailyLimit: 99,
      totalLimit: 99,
      requireLogin: false,
      allowedRole: 'USER',
      requiredLevel: 'NORMAL'
    },
    create: {
      tenantId: tenant.id,
      title: config.title,
      slug: config.slug,
      description: config.description,
      gameType: config.gameType,
      status: 'ACTIVE',
      startAt,
      endAt,
      dailyLimit: 99,
      totalLimit: 99,
      requireLogin: false,
      allowedRole: 'USER',
      requiredLevel: 'NORMAL'
    }
  })

  await prisma.gameConfig.upsert({
    where: {
      campaignId: campaign.id
    },
    update: {
      tenantId: tenant.id,
      settings: config.gameConfig
    },
    create: {
      campaignId: campaign.id,
      tenantId: tenant.id,
      settings: config.gameConfig
    }
  })

  await upsertPrizes(tenant, campaign, key)
  await upsertSerialCodes(tenant, campaign)

  return campaign
}

const upsertPrizes = async (tenant, campaign, key) => {
  const rows = prizeRows[key] || []

  for (const row of rows) {
    const existing = await prisma.prize.findFirst({
      where: {
        campaignId: campaign.id,
        title: row.title
      }
    })

    const data = {
      tenantId: tenant.id,
      campaignId: campaign.id,
      title: row.title,
      shortName: row.shortName || row.title,
      icon: row.icon || '',
      type: row.type || 'WIN',
      status: 'ACTIVE',
      probability: row.probability,
      remainStock: row.stockTotal,
      stockTotal: row.stockTotal,
      stockUsed: 0,
      sortOrder: row.sortOrder || 0
    }

    if (existing) {
      await prisma.prize.update({
        where: {
          id: existing.id
        },
        data
      })
    } else {
      await prisma.prize.create({
        data
      })
    }
  }
}

const upsertSerialCodes = async (tenant, campaign) => {
  for (const rawCode of TEST_SERIAL_CODES) {
    const code = normalizeCode(rawCode)

    await prisma.serialCode.upsert({
      where: {
        campaignId_code: {
          campaignId: campaign.id,
          code
        }
      },
      update: {
        tenantId: tenant.id,
        rewardChance: DEFAULT_REWARD_CHANCE,
        status: 'UNUSED',
        batchCode: 'ONLINE-DEMO',
        note: '正式線上測試序號，由第 34401～34800 批初始化建立',
        usedAt: null,
        usedBy: null,
        expireAt: null
      },
      create: {
        tenantId: tenant.id,
        campaignId: campaign.id,
        code,
        rewardChance: DEFAULT_REWARD_CHANCE,
        status: 'UNUSED',
        batchCode: 'ONLINE-DEMO',
        note: '正式線上測試序號，由第 34401～34800 批初始化建立',
        expireAt: null
      }
    })
  }
}

const printCampaignSummary = (campaigns) => {
  console.log('')
  console.log('============================================================')
  console.log('第 34401～34800 批：正式三遊戲資料初始化完成')
  console.log('============================================================')
  console.table(
    campaigns.map((campaign) => ({
      id: campaign.id,
      title: campaign.title,
      gameType: campaign.gameType,
      status: campaign.status,
      playerUrl:
        campaign.gameType === 'WHEEL'
          ? `https://marketing-game-v1.vercel.app/play/a-shop/wheel?campaignId=${campaign.id}`
          : campaign.gameType === 'GRID'
            ? `https://marketing-game-v1.vercel.app/play/a-shop/premium-grid?campaignId=${campaign.id}`
            : `https://marketing-game-v1.vercel.app/play/a-shop/golden-egg?campaignId=${campaign.id}`
    }))
  )
  console.log('')
  console.log(`每個活動都已建立測試序號：${TEST_SERIAL_CODES.join(', ')}`)
  console.log(`每組測試序號可用次數：${DEFAULT_REWARD_CHANCE}`)
  console.log('')
  console.log('登入帳號：')
  console.log('平台管理員：admin@example.com / 123456')
  console.log('A 商家管理員：a-admin@example.com / 123456')
  console.log('測試會員：test@example.com / 123456')
  console.log('============================================================')
  console.log('')
}

async function main() {
  const tenant = await upsertTenant()
  await upsertUsers(tenant)

  const campaigns = []

  campaigns.push(await upsertCampaign(tenant, 'WHEEL'))
  campaigns.push(await upsertCampaign(tenant, 'GRID'))
  campaigns.push(await upsertCampaign(tenant, 'GOLDEN_EGG'))

  printCampaignSummary(campaigns)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error('正式三遊戲資料初始化失敗：', error)
    await prisma.$disconnect()
    process.exit(1)
  })
