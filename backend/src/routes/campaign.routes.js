// Multi Game Platform V2.2 Stable
// 第 333 批：Campaign / GameConfig Routes ADMIN 權限鎖定版
//
// 建議放置位置：
// backend/src/routes/campaign.routes.js

import express from 'express'
import {
  listCampaigns,
  campaignDetail,
  createCampaignHandler,
  updateCampaignHandler,
  deleteCampaignHandler,
  getGameConfigHandler,
  upsertGameConfigHandler
} from '../controllers/campaign.controller.js'
import {
  requireAuth,
  requireAdmin,
  adminWriteRateLimit,
  adminSensitiveRateLimit
} from '../middleware/security.middleware.js'

const router = express.Router()

const adminOnly = [requireAuth, requireAdmin]
const adminWriteOnly = [requireAuth, requireAdmin, adminWriteRateLimit]
const adminSensitiveOnly = [requireAuth, requireAdmin, adminSensitiveRateLimit]

// ==============================
// Public / Front-end readable APIs
// ==============================

// 取得活動列表
// GET /api/campaigns
// GET /api/campaigns?active=true
// GET /api/campaigns?gameType=GOLDEN_EGG
// GET /api/campaigns?status=ACTIVE
//
// 注意：正式上線若不想公開全部活動列表，可以下一批改成：
// - active=true / status=ACTIVE 才公開
// - 後台完整列表另開 /api/admin/campaigns
router.get('/', listCampaigns)

// 取得單一活動詳情，含 prizes / gameConfig
// GET /api/campaigns/:id
router.get('/:id', campaignDetail)

// 取得活動遊戲設定
// GET /api/campaigns/:id/game-config
router.get('/:id/game-config', getGameConfigHandler)

// ==============================
// Admin-only write APIs
// ==============================

// 建立活動
// POST /api/campaigns
router.post('/', adminWriteOnly, createCampaignHandler)

// 更新活動
// PATCH /api/campaigns/:id
router.patch('/:id', adminWriteOnly, updateCampaignHandler)

// 刪除活動
// DELETE /api/campaigns/:id
router.delete('/:id', adminSensitiveOnly, deleteCampaignHandler)

// 新增 / 更新活動遊戲設定
// PUT /api/campaigns/:id/game-config
router.put('/:id/game-config', adminWriteOnly, upsertGameConfigHandler)

export default router
