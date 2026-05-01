// Multi Game Platform V2.2 Stable
// 第 329 批：金蛋尺寸設定歸零修補腳本
//
// 放置位置：backend/scripts/reset-golden-egg-size-settings.js
//
// 執行：
// node scripts/reset-golden-egg-size-settings.js 7 116 148 14

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const campaignId = Number(process.argv[2] || 7)
const eggSize = Number(process.argv[3] || 116)
const eggCardSize = Number(process.argv[4] || 148)
const eggGap = Number(process.argv[5] || 14)

const main = async () => {
  if (!Number.isInteger(campaignId) || campaignId <= 0) {
    throw new Error('campaignId 不正確')
  }

  const campaign = await prisma.campaign.findUnique({
    where: {
      id: campaignId
    },
    include: {
      gameConfig: true
    }
  })

  if (!campaign) {
    throw new Error(`找不到活動 ID：${campaignId}`)
  }

  const oldSettings = campaign.gameConfig?.settings || {}

  const settings = {
    ...oldSettings,
    eggSize,
    eggCardSize,
    eggGap,
    // 保留舊欄位，避免舊畫面還讀 eggGridGap
    eggGridGap: eggGap
  }

  const gameConfig = await prisma.gameConfig.upsert({
    where: {
      campaignId
    },
    update: {
      settings
    },
    create: {
      campaignId,
      settings
    }
  })

  console.log('✅ 金蛋尺寸設定已重新寫入資料庫')
  console.log(`campaignId: ${campaignId}`)
  console.log(`eggSize: ${eggSize}`)
  console.log(`eggCardSize: ${eggCardSize}`)
  console.log(`eggGap: ${eggGap}`)
  console.log('')
  console.log('請打開確認：')
  console.log(`http://localhost:3000/api/campaigns/${campaignId}`)
  console.log(`http://localhost:5173/games/golden-egg?campaignId=${campaignId}`)
}

main()
  .catch((error) => {
    console.error('❌ 修補失敗：', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
