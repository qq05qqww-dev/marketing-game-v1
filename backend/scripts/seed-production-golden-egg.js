// Multi Game Platform V2.2 Stable
// 第 340 批：正式 GOLDEN_EGG 活動初始化腳本
//
// 放置位置：backend/scripts/seed-production-golden-egg.js
//
// 執行：
// node scripts/seed-production-golden-egg.js
//
// 可用 .env 調整：
// PROD_GOLDEN_EGG_SLUG="golden-egg-production"
// PROD_GOLDEN_EGG_TITLE="正式砸金蛋活動"
// RESET_PRODUCTION_PRIZES="false"
// CREATE_DEMO_SERIALS="false"

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

const slug = process.env.PROD_GOLDEN_EGG_SLUG || 'golden-egg-production'
const title = process.env.PROD_GOLDEN_EGG_TITLE || '正式砸金蛋活動'
const description = process.env.PROD_GOLDEN_EGG_DESCRIPTION || '正式上線用砸金蛋活動'
const resetPrizes = String(process.env.RESET_PRODUCTION_PRIZES || 'false').toLowerCase() === 'true'
const createDemoSerials = String(process.env.CREATE_DEMO_SERIALS || 'false').toLowerCase() === 'true'

const createCode = (prefix = 'EGG') => {
  return `${prefix}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`
}

const defaultSettings = {
  pageTitle: title,
  mainTitle: title,
  subTitle: '正式活動',
  heroTagline: '輸入序號，敲開你的幸運金蛋。',
  noticeText: '請依活動規則輸入有效序號參加。',
  serialRedeemTitle: '輸入抽獎序號',
  serialRedeemDescription: '請輸入主辦單位提供的序號，驗證成功後即可砸蛋。',
  serialRedeemButtonText: '驗證序號',
  serialRedeemSuccessText: '序號驗證成功，請選擇一顆金蛋。',
  serialRedeemErrorText: '序號無效、已使用或不存在。',
  activityRunningText: '活動進行中，請輸入序號參加。',
  activityNotStartedText: '活動尚未開始。',
  activityEndedText: '活動已結束。',
  showActivityTimeSection: true,
  showActivityCountdown: true,
  activityCountdownAlwaysShowSeconds: true,
  showBottomNav: true,
  eggSize: 74,
  eggCardSize: 128,
  eggGridGap: 12
}

const defaultPrizes = [
  {
    title: '金蛋大獎',
    shortName: '大獎',
    description: '恭喜獲得金蛋大獎，請洽主辦單位兌換。',
    icon: '🏆',
    type: 'WIN',
    status: 'ACTIVE',
    probability: 10,
    stockTotal: 5,
    stockUsed: 0,
    remainStock: 5,
    sortOrder: 1
  },
  {
    title: '100 元優惠券',
    shortName: '優惠券',
    description: '恭喜獲得 100 元優惠券。',
    icon: '🎁',
    type: 'WIN',
    status: 'ACTIVE',
    probability: 30,
    stockTotal: 50,
    stockUsed: 0,
    remainStock: 50,
    sortOrder: 2
  },
  {
    title: '再接再厲',
    shortName: '未中獎',
    description: '很可惜，這次沒有中獎。',
    icon: '🙂',
    type: 'LOSE',
    status: 'ACTIVE',
    probability: 60,
    stockTotal: 0,
    stockUsed: 0,
    remainStock: 999999,
    sortOrder: 3
  }
]

const main = async () => {
  const now = new Date()
  const endAt = new Date(now)
  endAt.setMonth(endAt.getMonth() + 6)

  const campaign = await prisma.campaign.upsert({
    where: {
      slug
    },
    update: {
      title,
      description,
      gameType: 'GOLDEN_EGG',
      status: 'ACTIVE',
      requireLogin: false,
      dailyLimit: 99,
      totalLimit: 999,
      startAt: now,
      endAt
    },
    create: {
      title,
      slug,
      description,
      gameType: 'GOLDEN_EGG',
      status: 'ACTIVE',
      requireLogin: false,
      dailyLimit: 99,
      totalLimit: 999,
      startAt: now,
      endAt
    }
  })

  await prisma.gameConfig.upsert({
    where: {
      campaignId: campaign.id
    },
    update: {
      settings: defaultSettings
    },
    create: {
      campaignId: campaign.id,
      settings: defaultSettings
    }
  })

  const existingPrizeCount = await prisma.prize.count({
    where: {
      campaignId: campaign.id
    }
  })

  if (resetPrizes) {
    await prisma.rewardRecord.deleteMany({
      where: {
        campaignId: campaign.id
      }
    })

    await prisma.playRecord.deleteMany({
      where: {
        campaignId: campaign.id
      }
    })

    await prisma.prize.deleteMany({
      where: {
        campaignId: campaign.id
      }
    })
  }

  if (resetPrizes || existingPrizeCount === 0) {
    await prisma.prize.createMany({
      data: defaultPrizes.map((prize) => ({
        ...prize,
        campaignId: campaign.id
      }))
    })
  }

  if (createDemoSerials) {
    const existingSerialCount = await prisma.serialCode.count({
      where: {
        campaignId: campaign.id,
        batchCode: 'PROD-DEMO'
      }
    })

    if (existingSerialCount === 0) {
      await prisma.serialCode.createMany({
        data: Array.from({ length: 10 }).map(() => ({
          campaignId: campaign.id,
          code: createCode('PROD'),
          rewardChance: 1,
          status: 'UNUSED',
          batchCode: 'PROD-DEMO',
          note: '正式初始化測試序號，正式營運前請確認是否保留'
        }))
      })
    }
  }

  console.log('✅ 正式 GOLDEN_EGG 活動初始化完成')
  console.log(`campaignId: ${campaign.id}`)
  console.log(`slug: ${campaign.slug}`)
  console.log(`title: ${campaign.title}`)
  console.log('')
  console.log('後台：')
  console.log('http://localhost:5173/admin/golden-egg')
  console.log('')
  console.log('前台：')
  console.log(`http://localhost:5173/games/golden-egg?campaignId=${campaign.id}`)
  console.log('')
  console.log('API：')
  console.log(`http://localhost:3000/api/campaigns/${campaign.id}`)
}

main()
  .catch((error) => {
    console.error('❌ 正式活動初始化失敗：', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
