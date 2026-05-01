// Multi Game Platform V2.2 Stable
// 第 335 批：JWT 登入驗證相容修正版
//
// 建議放置位置：
// backend/src/middleware/security.middleware.js
//
// 修正重點：
// 1. 相容 JWT_SECRET / JWT_ACCESS_SECRET / marketing-game-dev-secret
// 2. 相容 decoded.id / decoded.userId / decoded.sub
// 3. 避免登入成功但後台 API 判斷 token 錯誤
// 4. 保留第 332 批 requireAuth / requireAdmin / rate limit / security headers

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

const findActiveUserByToken = async (decoded = {}) => {
  const userId = getUserIdFromDecodedToken(decoded)

  if (!userId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      memberLevel: true
    }
  })

  if (!user) {
    return null
  }

  if (user.status && user.status !== 'ACTIVE') {
    const error = new Error('此帳號目前不可使用。')
    error.status = 403
    throw error
  }

  return user
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
    const user = await findActiveUserByToken(decoded)

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
    const status = error.status || 401

    return res.status(status).json({
      success: false,
      message: status === 403 ? error.message : '登入已過期或憑證錯誤。',
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
    const user = await findActiveUserByToken(decoded)

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
