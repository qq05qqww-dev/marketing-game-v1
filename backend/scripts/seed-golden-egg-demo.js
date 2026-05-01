// Multi Game Platform V2.2 Stable
// 第 314 批：建立正式 GOLDEN_EGG 測試活動資料
//
// 建議放置位置：
// backend/scripts/seed-golden-egg-demo.js
//
// 執行方式：
// node scripts/seed-golden-egg-demo.js

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

const RANDOM_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const createRandomText = (length = 18) => {
  const bytes = crypto.randomBytes(length)

  return Array.from(bytes, (byte) => RANDOM_CHARS[byte % RANDOM_CHARS.length]).join('')
}

const formatBlocks = (value) => {
  return String(value || '')
    .replace(/(.{4})/g, '$1-')
    .replace(/-$/, '')
}

const createSerialCode = (index) => {
  return `EGG-DEMO-${String(index).padStart(2, '0')}-${formatBlocks(createRandomText(12))}`
}

const main = async () => {
  const slug = 'golden-egg-demo-v22'

  console.log('🚀 開始建立 GOLDEN_EGG 正式測試活動...')

  const campaign = await prisma.campaign.upsert({
    where: {
      slug
    },
    update: {
      title: '正式砸金蛋測試活動',
      description: 'Multi Game Platform V2.2 正式資料庫版砸金蛋測試活動',
      gameType: 'GOLDEN_EGG',
      status: 'ACTIVE',
      requireLogin: false,
      dailyLimit: 99,
      totalLimit: 999,
      startAt: new Date(),
      endAt: new Date('2026-12-31T15:59:00.000Z')
    },
    create: {
      title: '正式砸金蛋測試活動',
      slug,
      description: 'Multi Game Platform V2.2 正式資料庫版砸金蛋測試活動',
      gameType: 'GOLDEN_EGG',
      status: 'ACTIVE',
      requireLogin: false,
      dailyLimit: 99,
      totalLimit: 999,
      startAt: new Date(),
      endAt: new Date('2026-12-31T15:59:00.000Z')
    }
  })

  await prisma.gameConfig.upsert({
    where: {
      campaignId: campaign.id
    },
    update: {
      settings: {
        pageTitle: '正式砸金蛋測試活動',
        mainTitle: '正式砸金蛋測試活動',
        subTitle: '資料庫正式版 DEMO',
        heroTagline: '輸入序號，敲開你的幸運金蛋。',
        noticeText: '此活動資料來自 PostgreSQL，抽獎結果由後端 Draw Engine 決定。',
        serialRedeemTitle: '輸入抽獎序號',
        serialRedeemDescription: '請輸入主辦單位提供的序號，驗證成功後即可砸蛋。',
        serialRedeemButtonText: '驗證序號',
        serialRedeemSuccessText: '序號驗證成功，請選擇一顆金蛋。',
        serialRedeemErrorText: '序號無效、已使用或不存在。',
        activityRunningText: '正式資料庫活動進行中，請輸入序號參加。',
        activityNotStartedText: '活動尚未開始。',
        activityEndedText: '活動已結束。',
        showActivityTimeSection: true,
        showActivityCountdown: true,
        activityCountdownAlwaysShowSeconds: true,
        showBottomNav: true
      }
    },
    create: {
      campaignId: campaign.id,
      settings: {
        pageTitle: '正式砸金蛋測試活動',
        mainTitle: '正式砸金蛋測試活動',
        subTitle: '資料庫正式版 DEMO',
        heroTagline: '輸入序號，敲開你的幸運金蛋。',
        noticeText: '此活動資料來自 PostgreSQL，抽獎結果由後端 Draw Engine 決定。',
        serialRedeemTitle: '輸入抽獎序號',
        serialRedeemDescription: '請輸入主辦單位提供的序號，驗證成功後即可砸蛋。',
        serialRedeemButtonText: '驗證序號',
        serialRedeemSuccessText: '序號驗證成功，請選擇一顆金蛋。',
        serialRedeemErrorText: '序號無效、已使用或不存在。',
        activityRunningText: '正式資料庫活動進行中，請輸入序號參加。',
        activityNotStartedText: '活動尚未開始。',
        activityEndedText: '活動已結束。',
        showActivityTimeSection: true,
        showActivityCountdown: true,
        activityCountdownAlwaysShowSeconds: true,
        showBottomNav: true
      }
    }
  })

  await prisma.prize.deleteMany({
    where: {
      campaignId: campaign.id
    }
  })

  await prisma.prize.createMany({
    data: [
      {
        campaignId: campaign.id,
        title: '金蛋大獎',
        shortName: '大獎',
        description: '恭喜獲得金蛋大獎，請洽主辦單位兌換。',
        icon: '🏆',
        imageUrl: '',
        type: 'WIN',
        status: 'ACTIVE',
        probability: 10,
        stockTotal: 5,
        stockUsed: 0,
        remainStock: 5,
        sortOrder: 1
      },
      {
        campaignId: campaign.id,
        title: '100 元優惠券',
        shortName: '優惠券',
        description: '恭喜獲得 100 元優惠券。',
        icon: '🎁',
        imageUrl: '',
        type: 'WIN',
        status: 'ACTIVE',
        probability: 30,
        stockTotal: 50,
        stockUsed: 0,
        remainStock: 50,
        sortOrder: 2
      },
      {
        campaignId: campaign.id,
        title: '再接再厲',
        shortName: '未中獎',
        description: '很可惜，這次沒有中獎。',
        icon: '🙂',
        imageUrl: '',
        type: 'LOSE',
        status: 'ACTIVE',
        probability: 60,
        stockTotal: 0,
        stockUsed: 0,
        remainStock: 999999,
        sortOrder: 3
      }
    ]
  })

  await prisma.serialCode.deleteMany({
    where: {
      campaignId: campaign.id
    }
  })

  const expireAt = new Date('2026-12-31T15:59:00.000Z')
  const serialCodes = Array.from({ length: 10 }, (_, index) => ({
    campaignId: campaign.id,
    code: createSerialCode(index + 1),
    rewardChance: 1,
    status: 'UNUSED',
    batchCode: 'DEMO',
    note: '第314批正式金蛋測試序號',
    expireAt
  }))

  await prisma.serialCode.createMany({
    data: serialCodes
  })

  const prizes = await prisma.prize.findMany({
    where: {
      campaignId: campaign.id
    },
    orderBy: {
      sortOrder: 'asc'
    }
  })

  const codes = await prisma.serialCode.findMany({
    where: {
      campaignId: campaign.id
    },
    orderBy: {
      id: 'asc'
    }
  })

  console.log('✅ GOLDEN_EGG 正式測試活動建立完成')
  console.log(`活動 ID：${campaign.id}`)
  console.log(`活動名稱：${campaign.title}`)
  console.log(`前台正式網址：http://localhost:5173/games/golden-egg?campaignId=${campaign.id}`)
  console.log(`後台金蛋網址：http://localhost:5173/admin/golden-egg`)
  console.log(`活動 API：http://localhost:3000/api/campaigns/${campaign.id}`)
  console.log(`序號 API：http://localhost:3000/api/serial-codes/campaigns/${campaign.id}`)
  console.log('')
  console.log('獎項：')
  prizes.forEach((prize) => {
    console.log(`- ${prize.title}｜${prize.type}｜${prize.probability}%｜庫存 ${prize.remainStock}`)
  })
  console.log('')
  console.log('測試序號：')
  codes.forEach((item) => {
    console.log(item.code)
  })
}

main()
  .catch((error) => {
    console.error('❌ 建立 GOLDEN_EGG 測試活動失敗：', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
