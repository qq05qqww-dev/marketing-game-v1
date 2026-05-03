import { verifyToken } from '../utils/jwt.js'

const normalizeTenantId = (value) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null
}

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization
  const queryToken = req.query.token

  let token = null

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1]
  } else if (queryToken) {
    token = queryToken
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '請先登入'
    })
  }

  try {
    const decoded = verifyToken(token)

    req.user = {
      ...decoded,
      id: Number(decoded.id),
      tenantId: normalizeTenantId(decoded.tenantId),
      tenantName: decoded.tenantName || null,
      tenantSlug: decoded.tenantSlug || null,
      tenantStatus: decoded.tenantStatus || null,
      isSuperAdmin: decoded.role === 'SUPER_ADMIN' || decoded.role === 'ADMIN',
      isMerchantAdmin: decoded.role === 'MERCHANT_ADMIN',
      isMerchantStaff: decoded.role === 'MERCHANT_STAFF',
      isMerchantUser: ['MERCHANT_ADMIN', 'MERCHANT_STAFF'].includes(decoded.role)
    }

    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '登入已失效，請重新登入'
    })
  }
}

export const requireRoles = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role

    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: '權限不足'
      })
    }

    next()
  }
}

export const requireSuperAdmin = requireRoles('SUPER_ADMIN', 'ADMIN')

export const requireMerchantAccess = (req, res, next) => {
  if (req.user?.isSuperAdmin) {
    return next()
  }

  if (req.user?.isMerchantUser && req.user?.tenantId) {
    return next()
  }

  return res.status(403).json({
    success: false,
    message: '缺少商家權限'
  })
}
