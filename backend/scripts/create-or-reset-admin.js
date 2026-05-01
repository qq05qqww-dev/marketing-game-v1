// Multi Game Platform V2.2 Stable
// 第 340 批：建立 / 重設 ADMIN 帳號腳本
//
// 放置位置：backend/scripts/create-or-reset-admin.js
//
// 用法 1：使用預設帳號
// node scripts/create-or-reset-admin.js
//
// 用法 2：自訂帳號密碼
// node scripts/create-or-reset-admin.js admin@example.com YourStrongPassword 系統管理員
//
// 也可使用 .env：
// ADMIN_EMAIL="admin@example.com"
// ADMIN_PASSWORD="YourStrongPassword"
// ADMIN_NAME="系統管理員"

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

const email = String(process.argv[2] || process.env.ADMIN_EMAIL || 'admin@example.com')
  .trim()
  .toLowerCase()

const password = String(process.argv[3] || process.env.ADMIN_PASSWORD || 'Admin123456!')
const name = String(process.argv[4] || process.env.ADMIN_NAME || '系統管理員').trim()

const validateInput = () => {
  if (!email || !email.includes('@')) {
    throw new Error('ADMIN Email 格式不正確')
  }

  if (!password || password.length < 8) {
    throw new Error('ADMIN 密碼至少需要 8 個字元')
  }

  if (!name) {
    throw new Error('ADMIN 名稱不能空白')
  }
}

const main = async () => {
  validateInput()

  const hashedPassword = await bcrypt.hash(password, 10)

  const admin = await prisma.user.upsert({
    where: {
      email
    },
    update: {
      name,
      password: hashedPassword,
      role: 'ADMIN',
      memberLevel: 'VIP',
      authProvider: 'EMAIL'
    },
    create: {
      name,
      email,
      password: hashedPassword,
      role: 'ADMIN',
      memberLevel: 'VIP',
      authProvider: 'EMAIL'
    }
  })

  console.log('✅ ADMIN 帳號已建立 / 重設完成')
  console.log(`ID: ${admin.id}`)
  console.log(`Email: ${admin.email}`)
  console.log(`Name: ${admin.name}`)
  console.log('Role: ADMIN')
  console.log('')
  console.log('登入網址：')
  console.log('http://localhost:5173/login')
}

main()
  .catch((error) => {
    console.error('❌ 建立 / 重設 ADMIN 失敗：', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
