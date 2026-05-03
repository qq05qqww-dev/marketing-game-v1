// Multi Game Platform V2.3 Tenant Edition
// 第 5 批修正版：商家管理員通過後台權限檢查版
//
// 建議放置位置：
// backend/src/middleware/security.middleware.js
//
// 修正重點：
// 1. requireAdmin 支援 ADMIN / SUPER_ADMIN / MERCHANT_ADMIN / MERCHANT_STAFF
// 2. requireAuth 回傳 tenantId / tenantName / tenantSlug，讓後續 API 可以依商家隔離資料
// 3. 保留原本 JWT 相容邏輯與 rate limit
// 4. USER / PLAYER 仍不能進入後台管理 API

import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import prisma from '../config/prisma.js'

const ADMIN_ROLES = new Set([
  'ADMIN',
  'SUPER_ADMIN',
  'MERCHANT_ADMIN',
  'MERCHANT_STAFF'
])

const SUPER_ADMIN_ROLES = new Set([
  'ADMIN',
  'SUPER_ADMIN'
])

const MERCHANT_ROLES = new Set([
  'MERCHANT_ADMIN',
  'MERCHANT_STAFF'
])

const getJwtSecrets = () => {
  return [
    process.env.JWT_SECRET,
    process.env.JWT_ACCESS_SECRET,
    'marketing-game-dev-secret'
  ].filter(Boolean)
}

const verifyTokenWithCompatibleSecrets = (token) => {
  const secrets = getJwtSecrets()
  let lastError = null

  for (const secret of secrets) {
    try {
      return jwt.verify(token, secret)
    } catch (error) {
      lastError = error
    }
  }

  throw lastError || new Error('JWT 驗證失敗')
}

const getUserIdFromDecodedToken = (decoded = {}) => {
  const rawId = decoded.id || decoded.userId || decoded.sub || decoded.uid
  const userId = Number(rawId)

  return Number.isInteger(userId) && userId > 0 ? userId : null
}

const normalizeRole = (role) => {
  return String(role || '').trim().toUpperCase()
}

const decorateAuthUser = (user = {}) => {
  const role = normalizeRole(user.role)
  const tenant = user.tenant || null
  const tenantId = user.tenantId ?? tenant?.id ?? null

  return {
    ...user,
    role,
    tenantId,
    tenantName: tenant?.name || null,
    tenantSlug: tenant?.slug || null,
    tenantStatus: tenant?.status || null,
    isAdmin: ADMIN_ROLES.has(role),
    isSuperAdmin: SUPER_ADMIN_ROLES.has(role),
    isMerchantAdmin: role === 'MERCHANT_ADMIN',
    isMerchantStaff: role === 'MERCHANT_STAFF',
    isMerchantUser: MERCHANT_ROLES.has(role),
    tenant: tenant
      ? {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          status: tenant.status
        }
      : null
  }
}

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || ''

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  if (req.cookies?.token) {
    return req.cookies.token
  }

  return null
}

const findUserByDecodedToken = async (decoded = {}) => {
  const userId = getUserIdFromDecodedToken(decoded)

  if (!userId) {
    return null
  }

  // 注意：
  // 不選 status，因為目前專案 User model 不一定有 status 欄位。
  // tenant / tenantId 是 V2.3 多商家權限版新增，用來讓後台 API 依商家隔離資料。
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      memberLevel: true,
      tenantId: true,
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true
        }
      }
    }
  })

  return user ? decorateAuthUser(user) : null
}

export const requireAuth = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req)

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '請先登入。'
      })
    }

    const decoded = verifyTokenWithCompatibleSecrets(token)
    const user = await findUserByDecodedToken(decoded)

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '登入資料無效，請重新登入。'
      })
    }

    req.user = user
    req.auth = decoded

    return next()
  } catch (error) {
    console.error('requireAuth 驗證失敗：', error)

    return res.status(401).json({
      success: false,
      message: '登入已過期或憑證錯誤。',
      details: process.env.NODE_ENV === 'production' ? undefined : error.message
    })
  }
}

export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '請先登入。'
    })
  }

  const role = normalizeRole(req.user.role)

  if (!ADMIN_ROLES.has(role)) {
    return res.status(403).json({
      success: false,
      message: '需要管理員權限。'
    })
  }

  if (MERCHANT_ROLES.has(role) && !req.user.tenantId) {
    return res.status(403).json({
      success: false,
      message: '此商家帳號尚未綁定商家，請聯絡平台管理員。'
    })
  }

  return next()
}

export const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '請先登入。'
    })
  }

  const role = normalizeRole(req.user.role)

  if (!SUPER_ADMIN_ROLES.has(role)) {
    return res.status(403).json({
      success: false,
      message: '需要平台總管理員權限。'
    })
  }

  return next()
}

export const optionalAuth = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req)

    if (!token) {
      return next()
    }

    const decoded = verifyTokenWithCompatibleSecrets(token)
    const user = await findUserByDecodedToken(decoded)

    if (user) {
      req.user = user
      req.auth = decoded
    }

    return next()
  } catch {
    return next()
  }
}

export const globalApiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: '請求過於頻繁，請稍後再試。'
  }
})

export const publicDrawRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: '操作太頻繁，請稍後再試。'
  }
})

export const adminWriteRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: '後台操作太頻繁，請稍後再試。'
  }
})

export const adminSensitiveRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: '敏感操作太頻繁，請稍後再試。'
  }
})

export const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  return next()
}
