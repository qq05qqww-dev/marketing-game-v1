// Multi Game Platform V2.3 Tenant Edition
// 第 12 批：商家管理員帳號修改與密碼重設 Controller 版
//
// 建議放置位置：
// backend/src/controllers/tenant.controller.js

import {
  getTenantSummary,
  getTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
  getTenantUsers,
  createTenantUser,
  updateTenantUser
} from '../services/tenant.service.js'
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse
} from '../utils/apiResponse.js'

const handleTenantError = (res, error, fallbackMessage = '商家管理操作失敗') => {
  if (error.status === 400) {
    return validationErrorResponse(res, error.message)
  }

  if (error.status === 404) {
    return notFoundResponse(res, error.message)
  }

  return errorResponse(res, error.message || fallbackMessage, error.status || 500, error.message)
}

export const tenantSummaryHandler = async (req, res) => {
  try {
    const summary = await getTenantSummary(req.user)

    return successResponse(res, summary, '取得商家總覽成功')
  } catch (error) {
    console.error('取得商家總覽失敗:', error)
    return handleTenantError(res, error, '取得商家總覽失敗')
  }
}

export const listTenantsHandler = async (req, res) => {
  try {
    const tenants = await getTenants({
      user: req.user,
      query: req.query
    })

    return successResponse(res, tenants, '取得商家列表成功')
  } catch (error) {
    console.error('取得商家列表失敗:', error)
    return handleTenantError(res, error, '取得商家列表失敗')
  }
}

export const tenantDetailHandler = async (req, res) => {
  try {
    const tenant = await getTenantById({
      user: req.user,
      tenantId: req.params.id
    })

    return successResponse(res, tenant, '取得商家詳情成功')
  } catch (error) {
    console.error('取得商家詳情失敗:', error)
    return handleTenantError(res, error, '取得商家詳情失敗')
  }
}

export const createTenantHandler = async (req, res) => {
  try {
    const result = await createTenant({
      user: req.user,
      payload: req.body || {}
    })

    return successResponse(res, result, result.message || '建立商家成功', 201)
  } catch (error) {
    console.error('建立商家失敗:', error)

    if (error.code === 'P2002') {
      return validationErrorResponse(res, '商家 slug、活動 slug 或管理員 Email 已存在，請換一個')
    }

    return handleTenantError(res, error, '建立商家失敗')
  }
}


export const listTenantUsersHandler = async (req, res) => {
  try {
    const users = await getTenantUsers({
      user: req.user,
      tenantId: req.params.id
    })

    return successResponse(res, users, '取得商家帳號成功')
  } catch (error) {
    console.error('取得商家帳號失敗:', error)
    return handleTenantError(res, error, '取得商家帳號失敗')
  }
}

export const createTenantUserHandler = async (req, res) => {
  try {
    const user = await createTenantUser({
      user: req.user,
      tenantId: req.params.id,
      payload: req.body || {}
    })

    return successResponse(res, user, '建立商家帳號成功', 201)
  } catch (error) {
    console.error('建立商家帳號失敗:', error)

    if (error.code === 'P2002') {
      return validationErrorResponse(res, '此 Email 已被使用，請換一個')
    }

    return handleTenantError(res, error, '建立商家帳號失敗')
  }
}

export const updateTenantUserHandler = async (req, res) => {
  try {
    const user = await updateTenantUser({
      user: req.user,
      tenantId: req.params.id,
      userId: req.params.userId,
      payload: req.body || {}
    })

    return successResponse(res, user, '更新商家帳號成功')
  } catch (error) {
    console.error('更新商家帳號失敗:', error)

    if (error.code === 'P2002') {
      return validationErrorResponse(res, '此 Email 已被使用，請換一個')
    }

    if (error.code === 'P2025') {
      return notFoundResponse(res, '找不到商家帳號')
    }

    return handleTenantError(res, error, '更新商家帳號失敗')
  }
}

export const updateTenantHandler = async (req, res) => {
  try {
    const tenant = await updateTenant({
      user: req.user,
      tenantId: req.params.id,
      payload: req.body || {}
    })

    return successResponse(res, tenant, '更新商家成功')
  } catch (error) {
    console.error('更新商家失敗:', error)

    if (error.code === 'P2002') {
      return validationErrorResponse(res, '商家 slug 已存在，請換一個')
    }

    if (error.code === 'P2025') {
      return notFoundResponse(res, '找不到商家')
    }

    return handleTenantError(res, error, '更新商家失敗')
  }
}

export const deleteTenantHandler = async (req, res) => {
  try {
    await deleteTenant({
      user: req.user,
      tenantId: req.params.id
    })

    return successResponse(res, null, '刪除商家成功')
  } catch (error) {
    console.error('刪除商家失敗:', error)

    if (error.code === 'P2025') {
      return notFoundResponse(res, '找不到商家')
    }

    return handleTenantError(res, error, '刪除商家失敗')
  }
}
