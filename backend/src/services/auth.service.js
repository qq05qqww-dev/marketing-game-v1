import prisma from '../config/prisma.js'
import { signToken } from '../utils/jwt.js'
import bcrypt from 'bcrypt'

export const registerUser = async ({ name, email, password }) => {
  const exists = await prisma.user.findUnique({
    where: { email }
  })

  if (exists) {
    throw new Error('此 Email 已被註冊')
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: 'USER',
      memberLevel: 'NORMAL'
    }
  })

  const token = signToken(user)

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      memberLevel: user.memberLevel
    }
  }
}

export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    throw new Error('帳號不存在')
  }

  const isMatch = await bcrypt.compare(password, user.password || '')

  if (!isMatch) {
    throw new Error('密碼錯誤')
  }

  const token = signToken(user)

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      memberLevel: user.memberLevel
    }
  }
}