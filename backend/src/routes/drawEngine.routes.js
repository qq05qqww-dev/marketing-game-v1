// Multi Game Platform V2.3 Tenant Edition
// 第 87201～87600 批：三遊戲後台百分比正式抽獎統一修正版
// 延續第 77601～78000 批：商家停用自動封鎖名下活動玩家入口版
//
// 覆蓋位置：
// backend/src/routes/drawEngine.routes.js
//
// 修正重點：
// 1. 商家停用 / 暫停時，抽獎池、序號驗證、正式 play 全部封鎖。
// 2. 不直接改 campaign.status，避免商家恢復後活動設定遺失。
// 3. 保留原本 draw-engine controller / service / draw-core，不改抽獎核心。
// 4. 本檔確認 routes import 維持 src/routes 相對路徑：../controllers 與 ../middleware。

import express from 'express'
import {
  playDrawHandler,
  drawPoolPreviewHandler,
  verifySerialCodeHandler
} from '../controllers/drawEngine.controller.js'
import {
  blockInactiveTenantForDrawEngine
} from '../middleware/tenantActivityGuard.middleware.js'

const router = express.Router()

// 預覽指定活動的抽獎池
// GET /api/draw-engine/campaigns/:campaignId/pool
router.get('/campaigns/:campaignId/pool', blockInactiveTenantForDrawEngine, drawPoolPreviewHandler)

// 抽獎前檢查序號
// POST /api/draw-engine/campaigns/:campaignId/verify-serial
router.post('/campaigns/:campaignId/verify-serial', blockInactiveTenantForDrawEngine, verifySerialCodeHandler)

// 正式抽獎，由後端決定結果
// POST /api/draw-engine/campaigns/:campaignId/play
router.post('/campaigns/:campaignId/play', blockInactiveTenantForDrawEngine, playDrawHandler)

export default router
