export const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '請先登入'
    })
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: '你沒有管理員權限'
    })
  }

  next()
}