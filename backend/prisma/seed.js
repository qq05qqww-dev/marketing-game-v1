import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const userPassword = await bcrypt.hash('123456', 10)
  const adminPassword = await bcrypt.hash('123456', 10)

    await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {
      password: userPassword,
      role: 'USER',
      memberLevel: 'NORMAL',
      name: '測試會員'
    },
    create: {
      name: '測試會員',
      email: 'test@example.com',
      password: userPassword,
      role: 'USER',
      memberLevel: 'NORMAL'
    }
  })

    await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      password: adminPassword,
      role: 'ADMIN',
      memberLevel: 'VIP',
      name: '系統管理員'
    },
    create: {
      name: '系統管理員',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'ADMIN',
      memberLevel: 'VIP'
    }
  })

          const campaign1 = await prisma.campaign.upsert({
    where: { id: 1 },
    update: {
      title: '週年慶大轉盤',
      description: '參加轉盤抽折價券、再玩一次、精美小禮',
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
      title: '週年慶大轉盤',
      description: '參加轉盤抽折價券、再玩一次、精美小禮',
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

  const existingPrizes = await prisma.prize.findMany({
    where: { campaignId: campaign1.id }
  })

  if (existingPrizes.length === 0) {
    await prisma.prize.createMany({
      data: [
        {
          campaignId: campaign1.id,
          title: '100 元折價券',
          remainStock: 20,
          probability: 0.1
        },
        {
          campaignId: campaign1.id,
          title: '50 元折價券',
          remainStock: 50,
          probability: 0.2
        },
        {
          campaignId: campaign1.id,
          title: '再玩一次',
          remainStock: 999,
          probability: 0.3
        },
        {
          campaignId: campaign1.id,
          title: '銘謝惠顧',
          remainStock: 9999,
          probability: 0.4
        }
      ]
    })
  }

  console.log('Seed 完成')
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