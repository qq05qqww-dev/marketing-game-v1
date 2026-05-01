import express from 'express'
import { getMyRewards } from '../controllers/reward.controller.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/mine', authMiddleware, getMyRewards)

export default router