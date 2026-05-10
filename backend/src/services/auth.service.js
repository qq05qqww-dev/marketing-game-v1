import jwt from 'jsonwebtoken'
import prisma from '../config/prisma.js'
import bcrypt from 'bcrypt'

// 第 39601～40000 批：商家我的帳號與自行修改密碼版

const JWT_SECRET =
  process.env.JWT_SECRET ||
  process.env.JWT_ACCESS_SECRET ||
  'marketing-game-dev-secret'

const buildTenantPayload = (tenant) => {
  if (!tenant) return null

  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status
  }
}

const buildSafeUser = (user) => {
  const tenant = buildTenantPayload(user.tenant)

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    memberLevel: user.memberLevel,
    tenantId: user.tenantId || null,
    tenantName: tenant?.name || null,
    tenantSlug: tenant?.slug || null,
    tenantStatus: tenant?.status || null,
    tenant,
    authProvider: user.authProvider || 'EMAIL',
    socialId: user.socialId || null,
    avatarUrl: user.avatarUrl || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  }
}

const signAuthToken = (safeUser) => {
  return jwt.sign(
    {
      id: safeUser.id,
      email: safeUser.email,
      role: safeUser.role,
      memberLevel: safeUser.memberLevel,
      tenantId: safeUser.tenantId,
      tenantName: safeUser.tenantName,
      tenantSlug: safeUser.tenantSlug,
      tenantStatus: safeUser.tenantStatus,
      authProvider: safeUser.authProvider || 'EMAIL'
    },
    JWT_SECRET,
    {
      expiresIn: '7d'
    }
  )
}

const buildLoginPayload = (user) => {
  const safeUser = buildSafeUser(user)

  return {
    token: signAuthToken(safeUser),
    user: safeUser
  }
}

export const registerUser = async ({ name, email, password }) => {
  const safeEmail = String(email || '').trim().toLowerCase()

  const exists = await prisma.user.findUnique({
    where: { email: safeEmail }
  })

  if (exists) {
    throw new Error('此 Email 已被註冊')
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      name,
      email: safeEmail,
      password: hashedPassword,
      role: 'USER',
      memberLevel: 'NORMAL',
      tenantId: null
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true
        }
      }
    }
  })

  return buildLoginPayload(user)
}

export const loginUser = async ({ email, password }) => {
  const safeEmail = String(email || '').trim().toLowerCase()

  const user = await prisma.user.findUnique({
    where: { email: safeEmail },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true
        }
      }
    }
  })

  if (!user) {
    throw new Error('帳號不存在')
  }

  const tenantStatus = String(user.tenant?.status || '').toUpperCase()
  const role = String(user.role || '').toUpperCase()

  if (['MERCHANT_ADMIN', 'MERCHANT_STAFF'].includes(role) && tenantStatus && tenantStatus !== 'ACTIVE') {
    throw new Error('商家已停用或暫停，請聯絡平台管理員')
  }

  const isMatch = await bcrypt.compare(password, user.password || '')

  if (!isMatch) {
    throw new Error('密碼錯誤')
  }

  return buildLoginPayload(user)
}


export const updateCurrentUserProfile = async ({ userId, name }) => {
  const safeUserId = Number(userId)

  if (!safeUserId) {
    throw new Error('登入資料無效，請重新登入')
  }

  const safeName = String(name || '').trim()

  if (!safeName) {
    throw new Error('請輸入姓名')
  }

  const user = await prisma.user.update({
    where: {
      id: safeUserId
    },
    data: {
      name: safeName
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true
        }
      }
    }
  })

  return buildSafeUser(user)
}

export const changeCurrentUserPassword = async ({
  userId,
  currentPassword,
  newPassword,
  confirmPassword
}) => {
  const safeUserId = Number(userId)

  if (!safeUserId) {
    throw new Error('登入資料無效，請重新登入')
  }

  const safeCurrentPassword = String(currentPassword || '')
  const safeNewPassword = String(newPassword || '')
  const safeConfirmPassword = String(confirmPassword || '')

  if (!safeCurrentPassword) {
    throw new Error('請輸入目前密碼')
  }

  if (!safeNewPassword) {
    throw new Error('請輸入新密碼')
  }

  if (safeNewPassword.length < 6) {
    throw new Error('新密碼至少需要 6 個字元')
  }

  if (safeNewPassword !== safeConfirmPassword) {
    throw new Error('新密碼與確認密碼不一致')
  }

  const user = await prisma.user.findUnique({
    where: {
      id: safeUserId
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true
        }
      }
    }
  })

  if (!user) {
    throw new Error('找不到會員資料')
  }

  if (!user.password) {
    throw new Error('此帳號尚未設定密碼，請聯絡平台管理員重設')
  }

  const isMatch = await bcrypt.compare(safeCurrentPassword, user.password || '')

  if (!isMatch) {
    throw new Error('目前密碼錯誤')
  }

  const hashedPassword = await bcrypt.hash(safeNewPassword, 10)

  const updatedUser = await prisma.user.update({
    where: {
      id: safeUserId
    },
    data: {
      password: hashedPassword
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true
        }
      }
    }
  })

  return buildLoginPayload(updatedUser)
}
