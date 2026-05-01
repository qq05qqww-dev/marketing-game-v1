// Multi Game Platform V2.2 Stable
// 第 337 批：登入狀態不誤登出 + JWT middleware 穩定版
//
// 建議放置位置：
// backend/src/middleware/security.middleware.js
//
// 修正重點：
// 1. 移除 user.status 欄位依賴，避免 User model 沒有 status 時驗證失敗
// 2. 相容 JWT_SECRET / JWT_ACCESS_SECRET / marketing-game-dev-secret
// 3. 相容 decoded.id / decoded.userId / decoded.sub / decoded.uid
// 4. requireAuth 回傳更穩定，不再把資料庫欄位錯誤誤判成 token 過期

import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import prisma from '../config/prisma.js'

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
  // 若 Prisma select 不存在欄位，會造成登入明明成功卻被誤判 token 錯誤。
  return prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      memberLevel: true
    }
  })
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

  if (String(req.user.role || '').toUpperCase() !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: '需要管理員權限。'
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
