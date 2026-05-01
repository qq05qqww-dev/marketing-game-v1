import express from 'express'
import { authMiddleware } from '../middleware/authMiddleware.js'
import {
  login,
  register,
  getMe,
  googleLogin,
  googleCallback,
  lineLogin,
  lineCallback,
  facebookLogin,
  facebookCallback
} from '../controllers/auth.controller.js'

const router = express.Router()

router.post('/register', register)
router.post('/login', login)

// 取得目前登入會員資料
router.get('/me', authMiddleware, getMe)

// Google OAuth Login
router.get('/google', googleLogin)
router.get('/google/callback', googleCallback)

// LINE Login
router.get('/line', lineLogin)
router.get('/line/callback', lineCallback)

// Facebook Login
router.get('/facebook', facebookLogin)
router.get('/facebook/callback', facebookCallback)

export default router