// Multi Game Platform V2.2 Stable
// 第 333 批：SerialCode 序號 Routes ADMIN 權限鎖定版
//
// 建議放置位置：
// backend/src/routes/serialCode.routes.js

import express from 'express'
import {
  listSerialCodes,
  serialCodeStatsHandler,
  createSerialCodeHandler,
  bulkCreateSerialCodesHandler,
  generateSerialCodesHandler,
  updateSerialCodeHandler,
  markDistributedHandler,
  bulkUpdateByIdsHandler,
  bulkUpdateByFilterHandler,
  exportSerialCodesCsvHandler,
  redeemSerialCodeHandler,
  deleteSerialCodeHandler
} from '../controllers/serialCode.controller.js'
import {
  requireAuth,
  requireAdmin,
  adminWriteRateLimit,
  adminSensitiveRateLimit,
  publicDrawRateLimit
} from '../middleware/security.middleware.js'

const router = express.Router()

const adminReadOnly = [requireAuth, requireAdmin]
const adminWriteOnly = [requireAuth, requireAdmin, adminWriteRateLimit]
const adminSensitiveOnly = [requireAuth, requireAdmin, adminSensitiveRateLimit]

// ==============================
// Public / Front-end player API
// ==============================

// 前台兌換序號
// POST /api/serial-codes/campaigns/:campaignId/redeem
//
// 注意：目前正式抽獎主要使用 /api/draw-engine/.../verify-serial 與 /play。
// 這條保留給舊前台或展示流程，但加上 publicDrawRateLimit 防刷。
router.post('/campaigns/:campaignId/redeem', publicDrawRateLimit, redeemSerialCodeHandler)

// ==============================
// Admin-only read/export APIs
// ==============================

// 取得指定活動序號列表
// GET /api/serial-codes/campaigns/:campaignId
router.get('/campaigns/:campaignId', adminReadOnly, listSerialCodes)

// 匯出指定活動序號 CSV
// GET /api/serial-codes/campaigns/:campaignId/export.csv
router.get('/campaigns/:campaignId/export.csv', adminReadOnly, exportSerialCodesCsvHandler)

// 取得指定活動序號統計
// GET /api/serial-codes/campaigns/:campaignId/stats
router.get('/campaigns/:campaignId/stats', adminReadOnly, serialCodeStatsHandler)

// ==============================
// Admin-only write APIs
// ==============================

// 手動建立單組序號
// POST /api/serial-codes/campaigns/:campaignId
router.post('/campaigns/:campaignId', adminWriteOnly, createSerialCodeHandler)

// 批次建立多組序號
// POST /api/serial-codes/campaigns/:campaignId/bulk
router.post('/campaigns/:campaignId/bulk', adminSensitiveOnly, bulkCreateSerialCodesHandler)

// 自動產生序號
// POST /api/serial-codes/campaigns/:campaignId/generate
router.post('/campaigns/:campaignId/generate', adminSensitiveOnly, generateSerialCodesHandler)

// 依篩選條件批次更新序號
// PATCH /api/serial-codes/campaigns/:campaignId/bulk-filter
router.patch('/campaigns/:campaignId/bulk-filter', adminSensitiveOnly, bulkUpdateByFilterHandler)

// 依 ID 批次更新序號
// PATCH /api/serial-codes/bulk
router.patch('/bulk', adminSensitiveOnly, bulkUpdateByIdsHandler)

// 更新序號
// PATCH /api/serial-codes/:id
router.patch('/:id', adminWriteOnly, updateSerialCodeHandler)

// 標記序號已發放
// PATCH /api/serial-codes/:id/distribute
router.patch('/:id/distribute', adminWriteOnly, markDistributedHandler)

// 刪除序號
// DELETE /api/serial-codes/:id
router.delete('/:id', adminSensitiveOnly, deleteSerialCodeHandler)

export default router
