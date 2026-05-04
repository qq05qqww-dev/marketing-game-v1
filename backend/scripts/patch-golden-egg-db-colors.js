// Multi Game Platform V2.2 Stable
// 第 352 批：正式資料庫金蛋顏色強制寫入腳本
//
// 放置位置：
// backend/scripts/patch-golden-egg-db-colors.js
//
// 用法：
// node scripts/patch-golden-egg-db-colors.js 1 "#111827" "#020617" "#000000"
//
// 參數說明：
// 1 = campaignId
// #111827 = eggColorTop
// #020617 = eggColorMiddle
// #000000 = eggColorBottom

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const campaignId = Number(process.argv[2] || 1)
const eggColorTop = String(process.argv[3] || '#fff7ad')
const eggColorMiddle = String(process.argv[4] || '#fde047')
const eggColorBottom = String(process.argv[5] || '#b45309')

const isHexColor = (value) => {
  return /^#[0-9A-Fa-f]{6}$/.test(String(value || ''))
}

const main = async () => {
  if (!Number.isInteger(campaignId) || campaignId <= 0) {
    throw new Error('campaignId 不正確')
  }

  if (!isHexColor(eggColorTop) || !isHexColor(eggColorMiddle) || !isHexColor(eggColorBottom)) {
    throw new Error('顏色格式錯誤，請使用 #000000 這種 6 碼 HEX 格式')
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

  const oldSettings = campaign.gameConfig?.settings && typeof campaign.gameConfig.settings === 'object'
    ? campaign.gameConfig.settings
    : {}

  const nextSettings = {
    ...oldSettings,
    eggColorTop,
    eggColorMiddle,
    eggColorBottom
  }

  const gameConfig = await prisma.gameConfig.upsert({
    where: {
      campaignId
    },
    update: {
      settings: nextSettings
    },
    create: {
      campaignId,
      settings: nextSettings
    }
  })

  console.log('✅ 金蛋顏色已寫入正式資料庫')
  console.log(`campaignId: ${campaignId}`)
  console.log(`eggColorTop: ${eggColorTop}`)
  console.log(`eggColorMiddle: ${eggColorMiddle}`)
  console.log(`eggColorBottom: ${eggColorBottom}`)
  console.log('')
  console.log('請打開 API 搜尋 eggColor：')
  console.log(`https://marketing-game-api.onrender.com/api/campaigns/${campaignId}`)
}

main()
  .catch((error) => {
    console.error('❌ 寫入金蛋顏色失敗：', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
