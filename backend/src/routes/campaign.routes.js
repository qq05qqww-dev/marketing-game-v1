// Multi Game Platform V2.3 Tenant Edition
// 第 77601～78000 批：商家停用自動封鎖名下活動玩家入口版
//
// 覆蓋位置：
// backend/src/routes/campaign.routes.js
//
// 修正重點：
// 1. GET /api/campaigns?tenantSlug=xxx 公開讀取時會先檢查商家是否 ACTIVE。
// 2. GET /api/campaigns/:id 公開讀取時會檢查活動所屬商家是否 ACTIVE。
// 3. GET /api/campaigns/:id/game-config 公開讀取時會檢查活動所屬商家是否 ACTIVE。
// 4. 後台管理員 / 商家管理員帶 token 讀資料時不阻擋，方便維護停用商家的資料。
// 5. 寫入 API 維持原本 requireAuth / role guard。

import express from 'express'
import { verifyToken } from '../utils/jwt.js'
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
  adminWriteRateLimit,
  adminSensitiveRateLimit
} from '../middleware/security.middleware.js'
import {
  blockInactiveTenantForPublicCampaignRead
} from '../middleware/tenantActivityGuard.middleware.js'

const router = express.Router()

const WRITE_ROLES = new Set(['ADMIN', 'SUPER_ADMIN', 'MERCHANT_ADMIN'])
const SENSITIVE_ROLES = new Set(['ADMIN', 'SUPER_ADMIN', 'MERCHANT_ADMIN'])

const optionalTenantAuth = (req, res, next) => {
  const authHeader = req.headers.authorization
  const queryToken = req.query.token

  let token = null

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1]
  } else if (queryToken) {
    token = queryToken
  }

  if (!token) {
    return next()
  }

  try {
    req.user = verifyToken(token)
  } catch (error) {
    // 公開讀取 API 不因為 token 過期直接失敗。
    // 有效 token 才套用 tenantId 隔離；無效 token 則視為公開讀取。
  }

  return next()
}

const hasTenantBinding = (user = null) => {
  return Boolean(
    user?.tenantId ||
    user?.tenant?.id ||
    user?.tenantSlug ||
    user?.merchantSlug ||
    user?.tenant?.slug
  )
}

const requireRoleSet = (allowedRoles) => {
  return (req, res, next) => {
    const role = String(req.user?.role || '').toUpperCase()

    if (!allowedRoles.has(role)) {
      return res.status(403).json({
        success: false,
        message: '沒有權限操作此功能'
      })
    }

    if (role.startsWith('MERCHANT_') && !hasTenantBinding(req.user)) {
      return res.status(403).json({
        success: false,
        message: '此商家帳號尚未綁定 tenantId / tenantSlug'
      })
    }

    return next()
  }
}

const tenantWriteOnly = [requireAuth, requireRoleSet(WRITE_ROLES), adminWriteRateLimit]
const tenantSensitiveOnly = [requireAuth, requireRoleSet(SENSITIVE_ROLES), adminSensitiveRateLimit]

// ==============================
// Public / Front-end readable APIs
// ==============================

// 取得活動列表
// GET /api/campaigns
// GET /api/campaigns?tenantSlug=a-shop&gameType=WHEEL&status=ACTIVE
//
// 第 77601～78000 批：
// 如果是玩家公開讀取指定 tenantSlug，商家不是 ACTIVE 時直接回 403，避免停用商家活動仍被玩家頁讀到。
router.get('/', optionalTenantAuth, blockInactiveTenantForPublicCampaignRead, listCampaigns)

// 取得單一活動詳情，含 prizes / gameConfig
// GET /api/campaigns/:id
router.get('/:id', optionalTenantAuth, blockInactiveTenantForPublicCampaignRead, campaignDetail)

// 取得活動遊戲設定
// GET /api/campaigns/:id/game-config
router.get('/:id/game-config', optionalTenantAuth, blockInactiveTenantForPublicCampaignRead, getGameConfigHandler)

// ==============================
// Tenant admin write APIs
// ==============================

// 建立活動
// POST /api/campaigns
router.post('/', tenantWriteOnly, createCampaignHandler)

// 更新活動
// PATCH /api/campaigns/:id
router.patch('/:id', tenantWriteOnly, updateCampaignHandler)

// 刪除活動
// DELETE /api/campaigns/:id
router.delete('/:id', tenantSensitiveOnly, deleteCampaignHandler)

// 新增 / 更新活動遊戲設定
// PUT /api/campaigns/:id/game-config
router.put('/:id/game-config', tenantWriteOnly, upsertGameConfigHandler)

export default router
