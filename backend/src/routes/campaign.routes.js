// Multi Game Platform V2.3 Tenant Edition
// 第 3 批：Campaign / GameConfig Routes tenantId 資料隔離版
//
// 覆蓋位置：
// backend/src/routes/campaign.routes.js

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

const requireRoleSet = (allowedRoles) => {
  return (req, res, next) => {
    const role = String(req.user?.role || '').toUpperCase()

    if (!allowedRoles.has(role)) {
      return res.status(403).json({
        success: false,
        message: '沒有權限操作此功能'
      })
    }

    if (role.startsWith('MERCHANT_') && !req.user?.tenantId) {
      return res.status(403).json({
        success: false,
        message: '此商家帳號尚未綁定 tenantId'
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
// GET /api/campaigns?active=true
// GET /api/campaigns?gameType=GOLDEN_EGG
// GET /api/campaigns?status=ACTIVE
//
// V2.3：如果請求帶 Bearer token，會依登入者 tenantId 隔離。
// - SUPER_ADMIN / ADMIN：可看全部，也可用 ?tenantId= 查指定商家
// - MERCHANT_ADMIN / MERCHANT_STAFF：只看自己的商家
// - 未登入：維持原本公開讀取行為
router.get('/', optionalTenantAuth, listCampaigns)

// 取得單一活動詳情，含 prizes / gameConfig
// GET /api/campaigns/:id
router.get('/:id', optionalTenantAuth, campaignDetail)

// 取得活動遊戲設定
// GET /api/campaigns/:id/game-config
router.get('/:id/game-config', optionalTenantAuth, getGameConfigHandler)

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
