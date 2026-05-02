// Multi Game Platform V2.2 Stable
// 第 338 批：正式上線前 app.js 安全掛載版
//
// 建議放置位置：
// backend/src/app.js

import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import authRoutes from './routes/auth.routes.js'
import campaignRoutes from './routes/campaign.routes.js'
import prizeRoutes from './routes/prize.routes.js'
import serialCodeRoutes from './routes/serialCode.routes.js'
import playRecordRoutes from './routes/playRecord.routes.js'
import drawEngineRoutes from './routes/drawEngine.routes.js'
import drawRoutes from './routes/draw.routes.js'
import rewardRoutes from './routes/reward.routes.js'
import shareRewardRoutes from './routes/shareReward.routes.js'
import adminRoutes from './routes/admin.routes.js'
import healthRoutes from './routes/health.routes.js'
import shareRoutes from './routes/share.routes.js'
import {
  securityHeaders,
  globalApiRateLimit,
  publicDrawRateLimit
} from './middleware/security.middleware.js'

const app = express()

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
]

app.use(securityHeaders)

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true)
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true)
      }

      return callback(new Error(`CORS blocked origin: ${origin}`))
    }
  })
)

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json({ limit: '10mb' }))

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Marketing Game API running',
    data: {
      service: 'multi-game-platform-backend',
      version: 'v2.2-stable',
      batch: 366
    }
  })
})

// 分享落地頁給 LINE / Facebook / Telegram 抓 Open Graph，不走 /api。
app.use('/share', shareRoutes)

// 健康檢查放在 rate limit 前面，方便伺服器監控。
// /api/db-health 等 healthRoutes 仍可正常使用。
app.use('/api', healthRoutes)

// 全站 API 防刷：套在 /api routes。
// 注意：healthRoutes 已經在上方先掛，因此健康檢查不會被影響。
app.use('/api', globalApiRateLimit)

app.use('/api/auth', authRoutes)
app.use('/api/campaigns', campaignRoutes)
app.use('/api/prizes', prizeRoutes)
app.use('/api/serial-codes', serialCodeRoutes)
app.use('/api/play-records', playRecordRoutes)

// 玩家抽獎 / 驗證序號防刷。
// 這會套用在：
// GET  /api/draw-engine/campaigns/:campaignId/pool
// POST /api/draw-engine/campaigns/:campaignId/verify-serial
// POST /api/draw-engine/campaigns/:campaignId/play
app.use('/api/draw-engine', publicDrawRateLimit, drawEngineRoutes)

app.use('/api/draw', drawRoutes)
app.use('/api/rewards', rewardRoutes)
app.use('/api/share-rewards', shareRewardRoutes)
app.use('/api/admin', adminRoutes)

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found.',
    path: req.originalUrl
  })
})

app.use((error, req, res, next) => {
  console.error('[SERVER_ERROR]', error)

  const status = error.status || 500

  res.status(status).json({
    success: false,
    message: process.env.NODE_ENV === 'production' && status >= 500
      ? 'Internal server error.'
      : error.message || 'Internal server error.'
  })
})

export default app
