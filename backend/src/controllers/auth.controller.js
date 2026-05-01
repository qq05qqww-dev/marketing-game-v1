import jwt from 'jsonwebtoken'
import prisma from '../config/prisma.js'
import { loginUser, registerUser } from '../services/auth.service.js'

const JWT_SECRET =
  process.env.JWT_SECRET ||
  process.env.JWT_ACCESS_SECRET ||
  'marketing-game-dev-secret'

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

// Google OAuth
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''
const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL ||
  'http://localhost:3000/api/auth/google/callback'

// LINE Login
const LINE_CHANNEL_ID = process.env.LINE_CHANNEL_ID || ''
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || ''
const LINE_CALLBACK_URL =
  process.env.LINE_CALLBACK_URL ||
  'http://localhost:3000/api/auth/line/callback'

// Facebook Login
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || ''
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || ''
const FACEBOOK_CALLBACK_URL =
  process.env.FACEBOOK_CALLBACK_URL ||
  'http://localhost:3000/api/auth/facebook/callback'

const signToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      memberLevel: user.memberLevel,
      authProvider: user.authProvider || 'EMAIL'
    },
    JWT_SECRET,
    {
      expiresIn: '7d'
    }
  )
}

const buildLoginPayload = (user) => {
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    memberLevel: user.memberLevel,
    authProvider: user.authProvider || 'EMAIL',
    socialId: user.socialId || null,
    avatarUrl: user.avatarUrl || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  }

  return {
    token: signToken(safeUser),
    user: safeUser
  }
}

const redirectOAuthError = (message) => {
  return `${FRONTEND_URL}/login?oauthError=${encodeURIComponent(message)}`
}

const createOrFindSocialUser = async ({
  provider,
  providerId,
  name,
  email,
  avatarUrl = ''
}) => {
  const safeProvider = String(provider || '').toUpperCase()
  const safeProviderId = String(providerId || '').trim()
  const safeName = String(name || '').trim() || `${safeProvider} 使用者`
  const safeAvatarUrl = String(avatarUrl || '').trim()

  const safeEmail =
    String(email || '').trim().toLowerCase() ||
    `${safeProvider.toLowerCase()}_${safeProviderId}@social.local`

  let user = await prisma.user.findUnique({
    where: {
      email: safeEmail
    }
  })

  if (!user && safeProviderId) {
    user = await prisma.user.findFirst({
      where: {
        authProvider: safeProvider,
        socialId: safeProviderId
      }
    })
  }

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: safeName,
        email: safeEmail,
        password: null,
        role: 'USER',
        memberLevel: 'NORMAL',
        authProvider: safeProvider,
        socialId: safeProviderId || null,
        avatarUrl: safeAvatarUrl || null
      }
    })

    return user
  }

  user = await prisma.user.update({
    where: {
      id: user.id
    },
    data: {
      name: user.name || safeName,
      authProvider: safeProvider,
      socialId: safeProviderId || user.socialId,
      avatarUrl: safeAvatarUrl || user.avatarUrl
    }
  })

  return user
}

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: '請填寫姓名、Email、密碼'
      })
    }

    const result = await registerUser({
      name,
      email,
      password
    })

    return res.json({
      success: true,
      message: '註冊成功',
      data: result
    })
  } catch (error) {
    console.error('註冊失敗:', error)

    return res.status(400).json({
      success: false,
      message: error.message || '註冊失敗'
    })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '請輸入 Email 與密碼'
      })
    }

    const result = await loginUser({
      email,
      password
    })

    return res.json({
      success: true,
      message: '登入成功',
      data: result
    })
  } catch (error) {
    console.error('登入失敗:', error)

    return res.status(401).json({
      success: false,
      message: error.message || '登入失敗'
    })
  }
}

export const googleLogin = async (req, res) => {
  try {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CALLBACK_URL) {
      return res.status(500).json({
        success: false,
        message: 'Google 登入尚未設定 GOOGLE_CLIENT_ID 或 GOOGLE_CALLBACK_URL'
      })
    }

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_CALLBACK_URL,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account'
    })

    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
  } catch (error) {
    console.error('Google 登入導向失敗:', error)

    return res.status(500).json({
      success: false,
      message: 'Google 登入導向失敗'
    })
  }
}

export const googleCallback = async (req, res) => {
  try {
    const code = req.query.code

    if (!code) {
      return res.redirect(redirectOAuthError('Google 授權失敗，缺少 code'))
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
      return res.redirect(redirectOAuthError('Google OAuth 尚未完成後端設定'))
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code: String(code),
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code'
      })
    })

    const tokenData = await tokenRes.json()

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Google token exchange failed:', tokenData)
      return res.redirect(redirectOAuthError('Google token 交換失敗'))
    }

    const userInfoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`
      }
    })

    const googleUser = await userInfoRes.json()

    if (!userInfoRes.ok || !googleUser.email) {
      console.error('Google userinfo failed:', googleUser)
      return res.redirect(redirectOAuthError('取得 Google 使用者資料失敗'))
    }

    const user = await createOrFindSocialUser({
      provider: 'GOOGLE',
      providerId: googleUser.sub,
      name: googleUser.name || googleUser.given_name,
      email: googleUser.email,
      avatarUrl: googleUser.picture
    })

    const payload = buildLoginPayload(user)

    const redirectParams = new URLSearchParams({
      token: payload.token,
      user: JSON.stringify(payload.user),
      provider: 'google'
    })

    return res.redirect(`${FRONTEND_URL}/login?${redirectParams.toString()}`)
  } catch (error) {
    console.error('Google callback 失敗:', error)
    return res.redirect(redirectOAuthError(error.message || 'Google 登入失敗'))
  }
}

export const lineLogin = async (req, res) => {
  try {
    if (!LINE_CHANNEL_ID || !LINE_CALLBACK_URL) {
      return res.status(500).json({
        success: false,
        message: 'LINE 登入尚未設定 LINE_CHANNEL_ID 或 LINE_CALLBACK_URL'
      })
    }

    const state = Math.random().toString(36).slice(2) + Date.now().toString(36)

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: LINE_CHANNEL_ID,
      redirect_uri: LINE_CALLBACK_URL,
      state,
      scope: 'profile openid'
    })

    return res.redirect(`https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`)
  } catch (error) {
    console.error('LINE 登入導向失敗:', error)

    return res.status(500).json({
      success: false,
      message: 'LINE 登入導向失敗'
    })
  }
}

export const lineCallback = async (req, res) => {
  try {
    const code = req.query.code

    if (!code) {
      return res.redirect(redirectOAuthError('LINE 授權失敗，缺少 code'))
    }

    if (!LINE_CHANNEL_ID || !LINE_CHANNEL_SECRET || !LINE_CALLBACK_URL) {
      return res.redirect(redirectOAuthError('LINE Login 尚未完成後端設定'))
    }

    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: String(code),
        redirect_uri: LINE_CALLBACK_URL,
        client_id: LINE_CHANNEL_ID,
        client_secret: LINE_CHANNEL_SECRET
      })
    })

    const tokenData = await tokenRes.json()

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('LINE token exchange failed:', tokenData)
      return res.redirect(redirectOAuthError('LINE token 交換失敗'))
    }

    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`
      }
    })

    const lineProfile = await profileRes.json()

    if (!profileRes.ok || !lineProfile.userId) {
      console.error('LINE profile failed:', lineProfile)
      return res.redirect(redirectOAuthError('取得 LINE 使用者資料失敗'))
    }

    const user = await createOrFindSocialUser({
      provider: 'LINE',
      providerId: lineProfile.userId,
      name: lineProfile.displayName,
      email: `line_${lineProfile.userId}@social.local`,
      avatarUrl: lineProfile.pictureUrl
    })

    const payload = buildLoginPayload(user)

    const redirectParams = new URLSearchParams({
      token: payload.token,
      user: JSON.stringify(payload.user),
      provider: 'line'
    })

    return res.redirect(`${FRONTEND_URL}/login?${redirectParams.toString()}`)
  } catch (error) {
    console.error('LINE callback 失敗:', error)
    return res.redirect(redirectOAuthError(error.message || 'LINE 登入失敗'))
  }
}

export const facebookLogin = async (req, res) => {
  try {
    if (!FACEBOOK_APP_ID || !FACEBOOK_CALLBACK_URL) {
      return res.status(500).json({
        success: false,
        message: 'Facebook 登入尚未設定 FACEBOOK_APP_ID 或 FACEBOOK_CALLBACK_URL'
      })
    }

    const state = Math.random().toString(36).slice(2) + Date.now().toString(36)

    const params = new URLSearchParams({
  client_id: FACEBOOK_APP_ID,
  redirect_uri: FACEBOOK_CALLBACK_URL,
  state,
  scope: 'public_profile',
  response_type: 'code'
})

    return res.redirect(`https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`)
  } catch (error) {
    console.error('Facebook 登入導向失敗:', error)

    return res.status(500).json({
      success: false,
      message: 'Facebook 登入導向失敗'
    })
  }
}

export const facebookCallback = async (req, res) => {
  try {
    const code = req.query.code

    if (!code) {
      return res.redirect(redirectOAuthError('Facebook 授權失敗，缺少 code'))
    }

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET || !FACEBOOK_CALLBACK_URL) {
      return res.redirect(redirectOAuthError('Facebook Login 尚未完成後端設定'))
    }

    const tokenParams = new URLSearchParams({
      client_id: FACEBOOK_APP_ID,
      client_secret: FACEBOOK_APP_SECRET,
      redirect_uri: FACEBOOK_CALLBACK_URL,
      code: String(code)
    })

    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?${tokenParams.toString()}`
    )

    const tokenData = await tokenRes.json()

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Facebook token exchange failed:', tokenData)
      return res.redirect(redirectOAuthError('Facebook token 交換失敗'))
    }

    const meParams = new URLSearchParams({
  fields: 'id,name,picture.type(large)',
  access_token: tokenData.access_token
})

    const profileRes = await fetch(
      `https://graph.facebook.com/v19.0/me?${meParams.toString()}`
    )

    const facebookProfile = await profileRes.json()

    if (!profileRes.ok || !facebookProfile.id) {
      console.error('Facebook profile failed:', facebookProfile)
      return res.redirect(redirectOAuthError('取得 Facebook 使用者資料失敗'))
    }

    const user = await createOrFindSocialUser({
      provider: 'FACEBOOK',
      providerId: facebookProfile.id,
      name: facebookProfile.name,
      email: facebookProfile.email || `facebook_${facebookProfile.id}@social.local`,
      avatarUrl: facebookProfile.picture?.data?.url || ''
    })

    const payload = buildLoginPayload(user)

    const redirectParams = new URLSearchParams({
      token: payload.token,
      user: JSON.stringify(payload.user),
      provider: 'facebook'
    })

    return res.redirect(`${FRONTEND_URL}/login?${redirectParams.toString()}`)
  } catch (error) {
    console.error('Facebook callback 失敗:', error)
    return res.redirect(redirectOAuthError(error.message || 'Facebook 登入失敗'))
  }
}

export const getMe = async (req, res) => {
  try {
    const userId = Number(req.user?.id)

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '登入資料無效，請重新登入'
      })
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        memberLevel: true,
        authProvider: true,
        socialId: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            rewards: true,
            playRecords: true
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '找不到會員資料'
      })
    }

    return res.json({
      success: true,
      message: '取得會員資料成功',
      data: user
    })
  } catch (error) {
    console.error('取得目前會員資料失敗:', error)

    return res.status(500).json({
      success: false,
      message: '取得目前會員資料失敗',
      error: String(error)
    })
  }
}