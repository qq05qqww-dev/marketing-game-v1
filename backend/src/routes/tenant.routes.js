// Multi Game Platform V2.3 Tenant Edition
// 第 12 批：商家管理帳號 Routes 版
//
// 建議放置位置：
// backend/src/routes/tenant.routes.js

import express from 'express'
import {
  tenantSummaryHandler,
  listTenantsHandler,
  tenantDetailHandler,
  createTenantHandler,
  updateTenantHandler,
  deleteTenantHandler,
  listTenantUsersHandler,
  createTenantUserHandler,
  updateTenantUserHandler
} from '../controllers/tenant.controller.js'
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
// Platform Admin-only tenant APIs
// ==============================

// 取得商家總覽
// GET /api/tenants/summary
router.get('/summary', adminReadOnly, tenantSummaryHandler)

// 取得商家列表
// GET /api/tenants
// GET /api/tenants?status=ACTIVE
// GET /api/tenants?keyword=a-shop
router.get('/', adminReadOnly, listTenantsHandler)


// 取得指定商家的後台帳號
// GET /api/tenants/:id/users
router.get('/:id/users', adminReadOnly, listTenantUsersHandler)

// 新增指定商家的後台帳號
// POST /api/tenants/:id/users
router.post('/:id/users', adminWriteOnly, createTenantUserHandler)

// 更新指定商家的後台帳號 / 重設密碼 / 停用後台權限
// PATCH /api/tenants/:id/users/:userId
router.patch('/:id/users/:userId', adminWriteOnly, updateTenantUserHandler)

// 取得商家詳情
// GET /api/tenants/:id
router.get('/:id', adminReadOnly, tenantDetailHandler)

// 建立商家
// POST /api/tenants
router.post('/', adminWriteOnly, createTenantHandler)

// 更新商家
// PATCH /api/tenants/:id
router.patch('/:id', adminWriteOnly, updateTenantHandler)

// 刪除商家
// DELETE /api/tenants/:id
// 注意：如果商家已有活動、帳號或紀錄，Service 會阻止刪除，請改用停用狀態。
router.delete('/:id', adminSensitiveOnly, deleteTenantHandler)

export default router
