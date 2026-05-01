// Multi Game Platform V2.2 Stable
// 第 312 批：序號兌換 + 正式抽獎 Draw Engine Routes
//
// 建議放置位置：
// backend/src/routes/drawEngine.routes.js

import express from 'express'
import {
  playDrawHandler,
  drawPoolPreviewHandler,
  verifySerialCodeHandler
} from '../controllers/drawEngine.controller.js'

const router = express.Router()

// 預覽指定活動的抽獎池
// GET /api/draw-engine/campaigns/:campaignId/pool
router.get('/campaigns/:campaignId/pool', drawPoolPreviewHandler)

// 抽獎前檢查序號
// POST /api/draw-engine/campaigns/:campaignId/verify-serial
router.post('/campaigns/:campaignId/verify-serial', verifySerialCodeHandler)

// 正式抽獎，由後端決定結果
// POST /api/draw-engine/campaigns/:campaignId/play
router.post('/campaigns/:campaignId/play', playDrawHandler)

export default router
