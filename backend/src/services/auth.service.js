import jwt from 'jsonwebtoken'
import prisma from '../config/prisma.js'
import bcrypt from 'bcrypt'

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

  const isMatch = await bcrypt.compare(password, user.password || '')

  if (!isMatch) {
    throw new Error('密碼錯誤')
  }

  return buildLoginPayload(user)
}
