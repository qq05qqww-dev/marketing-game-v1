import express from 'express'
import {
  claimShareReward,
  getShareRewardStatus,
  resetShareRewardToday,
  clearShareRewardCooldown
} from '../controllers/shareReward.controller.js'
import { authMiddleware } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.get('/status', authMiddleware, getShareRewardStatus)
router.post('/claim', authMiddleware, claimShareReward)
router.post('/reset-today', authMiddleware, resetShareRewardToday)
router.post('/clear-cooldown', authMiddleware, clearShareRewardCooldown)

export default router
