// Multi Game Platform V2.2 Stable
// 第 333 批：Prize 獎項 Routes ADMIN 權限鎖定版
//
// 建議放置位置：
// backend/src/routes/prize.routes.js

import express from 'express'
import {
  listCampaignPrizes,
  prizeDetail,
  createPrizeHandler,
  updatePrizeHandler,
  deletePrizeHandler,
  bulkUpdatePrizesHandler,
  probabilitySummaryHandler
} from '../controllers/prize.controller.js'
import {
  requireAuth,
  requireAdmin,
  adminWriteRateLimit,
  adminSensitiveRateLimit
} from '../middleware/security.middleware.js'

const router = express.Router()

const adminWriteOnly = [requireAuth, requireAdmin, adminWriteRateLimit]
const adminSensitiveOnly = [requireAuth, requireAdmin, adminSensitiveRateLimit]

// ==============================
// Public / Front-end readable APIs
// ==============================

// 取得指定活動的獎項列表
// GET /api/prizes/campaigns/:campaignId/prizes
router.get('/campaigns/:campaignId/prizes', listCampaignPrizes)

// 取得指定活動的百分比機率統計
// GET /api/prizes/campaigns/:campaignId/probability-summary
router.get('/campaigns/:campaignId/probability-summary', probabilitySummaryHandler)

// 取得單一獎項
// GET /api/prizes/:id
router.get('/:id', prizeDetail)

// ==============================
// Admin-only write APIs
// ==============================

// 建立指定活動的獎項
// POST /api/prizes/campaigns/:campaignId/prizes
router.post('/campaigns/:campaignId/prizes', adminWriteOnly, createPrizeHandler)

// 批次建立 / 更新指定活動的獎項
// PUT /api/prizes/campaigns/:campaignId/prizes/bulk
router.put('/campaigns/:campaignId/prizes/bulk', adminWriteOnly, bulkUpdatePrizesHandler)

// 更新單一獎項
// PATCH /api/prizes/:id
router.patch('/:id', adminWriteOnly, updatePrizeHandler)

// 刪除單一獎項
// DELETE /api/prizes/:id
router.delete('/:id', adminSensitiveOnly, deletePrizeHandler)

export default router
