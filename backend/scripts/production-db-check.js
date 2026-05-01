// Multi Game Platform V2.2 Stable
// 第 340 批：正式上線前資料庫檢查腳本
//
// 放置位置：backend/scripts/production-db-check.js
//
// 執行：
// node scripts/production-db-check.js

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const maskDatabaseUrl = (value = '') => {
  if (!value) return '未設定'

  return value.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:******@')
}

const checkEnv = () => {
  const checks = [
    {
      name: 'DATABASE_URL',
      ok: Boolean(process.env.DATABASE_URL),
      value: maskDatabaseUrl(process.env.DATABASE_URL)
    },
    {
      name: 'JWT_SECRET',
      ok: Boolean(process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET),
      value: process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET ? '已設定' : '未設定'
    },
    {
      name: 'FRONTEND_URL',
      ok: Boolean(process.env.FRONTEND_URL),
      value: process.env.FRONTEND_URL || '未設定，本機會預設 http://localhost:5173'
    },
    {
      name: 'NODE_ENV',
      ok: true,
      value: process.env.NODE_ENV || 'development'
    }
  ]

  return checks
}

const main = async () => {
  console.log('========== Multi Game Platform V2.2 正式上線前資料庫檢查 ==========')
  console.log('')

  console.log('一、環境變數')
  for (const item of checkEnv()) {
    console.log(`${item.ok ? '✅' : '⚠️'} ${item.name}: ${item.value}`)
  }

  console.log('')
  console.log('二、資料庫連線')

  const dbResult = await prisma.$queryRaw`SELECT 1 AS connected`
  console.log('✅ PostgreSQL 連線成功', dbResult)

  console.log('')
  console.log('三、資料統計')

  const [
    userCount,
    adminCount,
    campaignCount,
    activeCampaignCount,
    goldenEggCampaignCount,
    prizeCount,
    serialCodeCount,
    unusedSerialCodeCount,
    playRecordCount,
    rewardRecordCount
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        role: 'ADMIN'
      }
    }),
    prisma.campaign.count(),
    prisma.campaign.count({
      where: {
        status: 'ACTIVE'
      }
    }),
    prisma.campaign.count({
      where: {
        gameType: 'GOLDEN_EGG'
      }
    }),
    prisma.prize.count(),
    prisma.serialCode.count(),
    prisma.serialCode.count({
      where: {
        status: 'UNUSED'
      }
    }),
    prisma.playRecord.count(),
    prisma.rewardRecord.count()
  ])

  console.table([
    { item: '會員數', value: userCount },
    { item: 'ADMIN 數', value: adminCount },
    { item: '活動數', value: campaignCount },
    { item: 'ACTIVE 活動數', value: activeCampaignCount },
    { item: 'GOLDEN_EGG 活動數', value: goldenEggCampaignCount },
    { item: '獎項數', value: prizeCount },
    { item: '序號數', value: serialCodeCount },
    { item: '未使用序號數', value: unusedSerialCodeCount },
    { item: '遊玩紀錄數', value: playRecordCount },
    { item: '中獎紀錄數', value: rewardRecordCount }
  ])

  console.log('')
  console.log('四、檢查結果')

  if (adminCount <= 0) {
    console.log('❌ 尚未建立 ADMIN 帳號，請執行：node scripts/create-or-reset-admin.js')
  } else {
    console.log('✅ ADMIN 帳號存在')
  }

  if (goldenEggCampaignCount <= 0) {
    console.log('⚠️ 尚未建立 GOLDEN_EGG 活動，可執行：node scripts/seed-production-golden-egg.js')
  } else {
    console.log('✅ GOLDEN_EGG 活動存在')
  }

  if (!process.env.JWT_SECRET && !process.env.JWT_ACCESS_SECRET) {
    console.log('⚠️ JWT_SECRET 尚未設定，正式上線前必須設定強密鑰')
  } else {
    console.log('✅ JWT secret 已設定')
  }

  console.log('')
  console.log('========== 檢查完成 ==========')
}

main()
  .catch((error) => {
    console.error('❌ 資料庫檢查失敗：', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
