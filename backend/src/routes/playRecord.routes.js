// Multi Game Platform V2.2 Stable
// 第 333 批：PlayRecord / RewardRecord Routes ADMIN 權限鎖定版
//
// 建議放置位置：
// backend/src/routes/playRecord.routes.js

import express from 'express'
import {
  listPlayRecords,
  listRewardRecords,
  playStatsHandler,
  createPlayRecordHandler,
  claimRewardHandler,
  cancelRewardHandler,
  exportPlayRecordsCsvHandler
} from '../controllers/playRecord.controller.js'
import {
  requireAuth,
  requireAdmin,
  adminWriteRateLimit,
  adminSensitiveRateLimit
} from '../middleware/security.middleware.js'

const router = express.Router()

const adminReadOnly = [requireAuth, requireAdmin]
const adminWriteOnly = [requireAuth, requireAdmin, adminWriteRateLimit]
const adminSensitiveOnly = [requireAuth, requireAdmin, adminSensitiveRateLimit]

// ==============================
// Admin-only record APIs
// ==============================

// 取得指定活動遊玩紀錄
// GET /api/play-records/campaigns/:campaignId
router.get('/campaigns/:campaignId', adminReadOnly, listPlayRecords)

// 匯出指定活動遊玩紀錄 CSV
// GET /api/play-records/campaigns/:campaignId/export.csv
router.get('/campaigns/:campaignId/export.csv', adminReadOnly, exportPlayRecordsCsvHandler)

// 取得指定活動遊玩統計
// GET /api/play-records/campaigns/:campaignId/stats
router.get('/campaigns/:campaignId/stats', adminReadOnly, playStatsHandler)

// 取得指定活動中獎 / 發獎紀錄
// GET /api/play-records/campaigns/:campaignId/rewards
router.get('/campaigns/:campaignId/rewards', adminReadOnly, listRewardRecords)

// ==============================
// System / internal compatible API
// ==============================

// 建立遊玩紀錄
// POST /api/play-records/campaigns/:campaignId
//
// 注意：正式抽獎主流程應該走 /api/draw-engine/campaigns/:campaignId/play。
// 這條保留給舊功能或內部測試。若正式上線不需要，可下一批改成 requireAdmin 或移除。
router.post('/campaigns/:campaignId', adminWriteOnly, createPlayRecordHandler)

// ==============================
// Admin-only reward operation APIs
// ==============================

// 核銷領獎
// PATCH /api/play-records/rewards/:id/claim
router.patch('/rewards/:id/claim', adminWriteOnly, claimRewardHandler)

// 取消發獎
// PATCH /api/play-records/rewards/:id/cancel
router.patch('/rewards/:id/cancel', adminSensitiveOnly, cancelRewardHandler)

export default router
