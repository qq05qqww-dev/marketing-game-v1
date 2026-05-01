// Multi Game Platform V2.2 Stable
// 第 305 批：Health / DB Health API
//
// 建議放置位置：
// backend/src/routes/health.routes.js

import express from 'express'
import prisma from '../lib/prisma.js'
import { successResponse, errorResponse } from '../utils/apiResponse.js'

const router = express.Router()

router.get('/health', (req, res) => {
  return successResponse(
    res,
    {
      service: 'multi-game-platform-backend',
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    },
    'Backend server is running.'
  )
})

router.get('/db-health', async (req, res) => {
  try {
    const result = await prisma.$queryRaw`SELECT 1 AS connected`

    return successResponse(
      res,
      {
        database: 'postgresql',
        connected: true,
        result,
        timestamp: new Date().toISOString()
      },
      'Database connection is healthy.'
    )
  } catch (error) {
    console.error('[DB_HEALTH_ERROR]', error)

    return errorResponse(
      res,
      'Database connection failed.',
      500,
      {
        name: error.name,
        message: error.message
      }
    )
  }
})

export default router
