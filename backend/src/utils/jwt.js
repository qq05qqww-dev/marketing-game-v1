// Multi Game Platform V2.2 Stable
// 第 336 批：JWT 簽發與驗證統一版
//
// 建議放置位置：
// backend/src/utils/jwt.js
//
// 修正重點：
// 1. signToken 與 verifyToken 使用同一套 secret 取得規則
// 2. 相容 JWT_SECRET / JWT_ACCESS_SECRET / marketing-game-dev-secret
// 3. 避免登入成功後，後台 API 驗證 token 失敗

import jwt from 'jsonwebtoken'

export const getJwtSecret = () => {
  return (
    process.env.JWT_SECRET ||
    process.env.JWT_ACCESS_SECRET ||
    'marketing-game-dev-secret'
  )
}

export const signToken = (user) => {
  const secret = getJwtSecret()

  return jwt.sign(
    {
      id: user.id,
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      memberLevel: user.memberLevel || 'NORMAL'
    },
    secret,
    {
      expiresIn: '7d'
    }
  )
}

export const verifyToken = (token) => {
  const secret = getJwtSecret()

  return jwt.verify(token, secret)
}
