// Multi Game Platform V2.3 Tenant Edition
// 第 34001～34400 批：正式後端 CORS 修正版
//
// 覆蓋位置：
// backend/src/app.js
//
// 修正重點：
// 1. 正式允許 Vercel 前端 https://marketing-game-v1.vercel.app 呼叫 Render 後端。
// 2. 支援 FRONTEND_URL / CORS_ORIGINS 環境變數。
// 3. CORS 掛載在所有 /api routes 之前。
// 4. 加入 OPTIONS preflight 支援，修正 verify-serial / play 被瀏覽器擋下的問題。
// 5. 保留 localhost 開發環境。

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
import tenantRoutes from './routes/tenant.routes.js'
import {
  securityHeaders,
  globalApiRateLimit,
  publicDrawRateLimit
} from './middleware/security.middleware.js'

const app = express()

const splitOrigins = (value = '') => {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const normalizeOrigin = (value = '') => {
  return String(value || '').trim().replace(/\/$/, '')
}

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'https://marketing-game-v1.vercel.app',
  process.env.FRONTEND_URL,
  ...splitOrigins(process.env.CORS_ORIGINS)
]
  .map(normalizeOrigin)
  .filter(Boolean)

const isAllowedVercelPreviewOrigin = (origin = '') => {
  const normalizedOrigin = normalizeOrigin(origin)

  return (
    normalizedOrigin.endsWith('.vercel.app') &&
    (
      normalizedOrigin.includes('marketing-game-v1') ||
      normalizedOrigin.includes('qq05qqww') ||
      normalizedOrigin.includes('qq05qqww-dev')
    )
  )
}

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true)
    }

    const normalizedOrigin = normalizeOrigin(origin)

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true)
    }

    if (isAllowedVercelPreviewOrigin(normalizedOrigin)) {
      return callback(null, true)
    }

    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true)
    }

    return callback(new Error(`CORS blocked origin: ${origin}`))
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  optionsSuccessStatus: 204
}

// CORS 必須放在所有 /api routes 之前，否則 Vercel 前端會被瀏覽器擋下。
app.use(cors(corsOptions))
app.options('*', cors(corsOptions))

app.use(securityHeaders)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json({ limit: '10mb' }))

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Marketing Game API running',
    data: {
      service: 'multi-game-platform-backend',
      version: 'v2.3-tenant-edition',
      batch: '34001-34400',
      cors: {
        productionFrontend: 'https://marketing-game-v1.vercel.app',
        allowedOrigins
      }
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
app.use('/api/tenants', tenantRoutes)
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
