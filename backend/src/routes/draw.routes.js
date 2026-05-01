import express from 'express'
import { playDraw } from '../controllers/draw.controller.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

// 統一遊戲抽獎 API
// POST /api/draw/play
router.post('/play', authMiddleware, playDraw)

export default router