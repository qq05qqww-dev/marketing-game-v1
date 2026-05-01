import { verifyToken } from '../utils/jwt.js'

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
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '登入已失效，請重新登入'
    })
  }
}
