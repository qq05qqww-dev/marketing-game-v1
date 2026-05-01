import express from 'express'
import { PrismaClient } from '@prisma/client'
import ExcelJS from 'exceljs'

const router = express.Router()
const prisma = new PrismaClient()

const toNumber = (value, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const toDateOrNull = (value) => {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

const normalizeKeyword = (value) => String(value || '').trim()

const buildCsv = (rows) => {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])

  const escapeCell = (value) => {
    const str = String(value ?? '')
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(','))
  ]

  return lines.join('\n')
}

const sendCsv = (res, filename, rows) => {
  const csv = buildCsv(rows)
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  return res.send(`\uFEFF${csv}`)
}

const sendPseudoXlsx = (res, filename, rows) => {
  const csv = buildCsv(rows)
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  return res.send(`\uFEFF${csv}`)
}

/* =========================================================
   Campaigns
========================================================= */

const normalizeGameType = (value) => {
  const gameType = String(value || '').toUpperCase()

  if (['WHEEL', 'SCRATCH', 'FLIP', 'GRID'].includes(gameType)) {
    return gameType
  }

  return 'WHEEL'
}

const normalizeCampaignStatus = (value) => {
  const status = String(value || '').toUpperCase()

  if (['DRAFT', 'ACTIVE', 'INACTIVE', 'ENDED'].includes(status)) {
    return status
  }

  return 'DRAFT'
}

const normalizeUserRoleOrNull = (value) => {
  const role = String(value || '').toUpperCase()

  if (['USER', 'ADMIN'].includes(role)) {
    return role
  }

  return null
}

const normalizeMemberLevelOrNull = (value) => {
  const level = String(value || '').toUpperCase()

  if (['NORMAL', 'VIP'].includes(level)) {
    return level
  }

  return null
}

const toNullableLimit = (value, fallback = null) => {
  if (value === '' || value === null || value === undefined) {
    return fallback
  }

  const n = Number(value)

  if (!Number.isFinite(n)) {
    return fallback
  }

  return Math.max(n, 0)
}

const buildCampaignData = (body = {}) => {
  return {
    title: String(body.title || '').trim(),
    description: body.description ? String(body.description).trim() : '',
    gameType: normalizeGameType(body.gameType),
    startAt: toDateOrNull(body.startAt),
    endAt: toDateOrNull(body.endAt),
    dailyLimit: toNullableLimit(body.dailyLimit, null),
    totalLimit: toNullableLimit(body.totalLimit, null),
    requireLogin:
      body.requireLogin === undefined || body.requireLogin === null
        ? true
        : Boolean(body.requireLogin),
    allowedRole: normalizeUserRoleOrNull(body.allowedRole),
    requiredLevel: normalizeMemberLevelOrNull(body.requiredLevel),
    status: normalizeCampaignStatus(body.status)
  }
}

// 新增活動
router.post('/campaigns', async (req, res) => {
  try {
    const data = buildCampaignData(req.body)

    if (!data.title) {
      return res.status(400).json({
        success: false,
        message: '活動名稱不可為空'
      })
    }

    if (data.startAt && data.endAt && data.startAt > data.endAt) {
      return res.status(400).json({
        success: false,
        message: '結束時間不可早於開始時間'
      })
    }

    const campaign = await prisma.campaign.create({
      data
    })

    return res.json({
      success: true,
      message: '新增活動成功',
      data: campaign
    })
  } catch (error) {
    console.error('新增活動失敗:', error)
    return res.status(500).json({
      success: false,
      message: '新增活動失敗',
      error: String(error)
    })
  }
})

// 更新活動
router.put('/campaigns/:id', async (req, res) => {
  try {
    const id = toNumber(req.params.id)
    const data = buildCampaignData(req.body)

    if (!data.title) {
      return res.status(400).json({
        success: false,
        message: '活動名稱不可為空'
      })
    }

    if (data.startAt && data.endAt && data.startAt > data.endAt) {
      return res.status(400).json({
        success: false,
        message: '結束時間不可早於開始時間'
      })
    }

    const exists = await prisma.campaign.findUnique({
      where: {
        id
      }
    })

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: '找不到活動'
      })
    }

    const campaign = await prisma.campaign.update({
      where: {
        id
      },
      data
    })

    return res.json({
      success: true,
      message: '活動更新成功',
      data: campaign
    })
  } catch (error) {
    console.error('更新活動失敗:', error)
    return res.status(500).json({
      success: false,
      message: '更新活動失敗',
      error: String(error)
    })
  }
})

// 刪除活動
router.delete('/campaigns/:id', async (req, res) => {
  try {
    const id = toNumber(req.params.id)

    const exists = await prisma.campaign.findUnique({
      where: {
        id
      }
    })

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: '找不到活動'
      })
    }

    await prisma.userReward.deleteMany({
      where: {
        campaignId: id
      }
    })

    await prisma.playRecord.deleteMany({
      where: {
        campaignId: id
      }
    })

    await prisma.prize.deleteMany({
      where: {
        campaignId: id
      }
    })

    await prisma.campaign.delete({
      where: {
        id
      }
    })

    return res.json({
      success: true,
      message: '刪除成功'
    })
  } catch (error) {
    console.error('刪除活動失敗:', error)
    return res.status(500).json({
      success: false,
      message: '刪除活動失敗',
      error: String(error)
    })
  }
})

// 取得獎項列表
router.get('/prizes', async (req, res) => {
  try {
    const keyword = normalizeKeyword(req.query.keyword || req.query.search)
    const campaignId = req.query.campaignId ? toNumber(req.query.campaignId) : null

    const where = {
      ...(campaignId ? { campaignId } : {}),
      ...(keyword
        ? {
            OR: [
              { title: { contains: keyword } },
              { campaign: { title: { contains: keyword } } }
            ]
          }
        : {})
    }

    const prizes = await prisma.prize.findMany({
      where,
      include: {
        campaign: true
      },
      orderBy: {
        id: 'desc'
      }
    })

    return res.json({
      success: true,
      data: prizes
    })
  } catch (error) {
    console.error('取得獎項列表失敗:', error)
    return res.status(500).json({
      success: false,
      message: '取得獎項列表失敗'
    })
  }
})

// 新增獎項
router.post('/prizes', async (req, res) => {
  try {
    const {
      campaignId,
      title,
      remainStock,
      stock,
      probability,
      rate
    } = req.body

    if (!campaignId) {
      return res.status(400).json({
        success: false,
        message: '請選擇活動'
      })
    }

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        message: '請輸入獎項名稱'
      })
    }

    const prize = await prisma.prize.create({
      data: {
        campaignId: toNumber(campaignId),
        title: String(title).trim(),
        remainStock: toNumber(remainStock ?? stock, 0),
        probability: Number(probability ?? rate ?? 0)
      }
    })

    return res.json({
      success: true,
      data: prize
    })
  } catch (error) {
    console.error('新增獎項失敗:', error)
    return res.status(500).json({
      success: false,
      message: '新增獎項失敗'
    })
  }
})

// 更新獎項
router.put('/prizes/:id', async (req, res) => {
  try {
    const id = toNumber(req.params.id)
    const {
      campaignId,
      title,
      remainStock,
      stock,
      probability,
      rate
    } = req.body

    const prize = await prisma.prize.update({
      where: { id },
      data: {
        ...(campaignId ? { campaignId: toNumber(campaignId) } : {}),
        ...(title !== undefined ? { title: String(title).trim() } : {}),
        ...(remainStock !== undefined || stock !== undefined
          ? { remainStock: toNumber(remainStock ?? stock, 0) }
          : {}),
        ...(probability !== undefined || rate !== undefined
          ? { probability: Number(probability ?? rate ?? 0) }
          : {})
      }
    })

    return res.json({
      success: true,
      data: prize
    })
  } catch (error) {
    console.error('更新獎項失敗:', error)
    return res.status(500).json({
      success: false,
      message: '更新獎項失敗'
    })
  }
})

// 刪除獎項
router.delete('/prizes/:id', async (req, res) => {
  try {
    const id = toNumber(req.params.id)

    await prisma.userReward.deleteMany({
      where: { prizeId: id }
    })

    await prisma.playRecord.deleteMany({
      where: { prizeId: id }
    })

    await prisma.prize.delete({
      where: { id }
    })

    return res.json({
      success: true,
      message: '刪除成功'
    })
  } catch (error) {
    console.error('刪除獎項失敗:', error)
    return res.status(500).json({
      success: false,
      message: '刪除獎項失敗'
    })
  }
})

/* =========================================================
   Users
========================================================= */

const normalizeUserRole = (value) => {
  const role = String(value || '').toUpperCase()

  if (['USER', 'ADMIN'].includes(role)) {
    return role
  }

  return ''
}

const normalizeMemberLevel = (value) => {
  const level = String(value || '').toUpperCase()

  if (['NORMAL', 'VIP'].includes(level)) {
    return level
  }

  return ''
}

const normalizeAuthProvider = (value) => {
  const provider = String(value || '').toUpperCase()

  if (['EMAIL', 'GOOGLE', 'LINE', 'FACEBOOK'].includes(provider)) {
    return provider
  }

  return ''
}

// 取得會員列表
router.get('/users', async (req, res) => {
  try {
    const keyword = String(req.query.keyword || req.query.search || '').trim()
    const role = normalizeUserRole(req.query.role)
    const memberLevel = normalizeMemberLevel(req.query.memberLevel || req.query.level)
    const authProvider = normalizeAuthProvider(req.query.authProvider)

    const page = Math.max(Number(req.query.page || 1), 1)
    const pageSize = Math.max(Number(req.query.pageSize || 10), 1)

    const where = {
      ...(role ? { role } : {}),
      ...(memberLevel ? { memberLevel } : {}),
      ...(authProvider ? { authProvider } : {}),
      ...(keyword
        ? {
            OR: [
              {
                name: {
                  contains: keyword,
                  mode: 'insensitive'
                }
              },
              {
                email: {
                  contains: keyword,
                  mode: 'insensitive'
                }
              },
              {
                socialId: {
                  contains: keyword,
                  mode: 'insensitive'
                }
              }
            ]
          }
        : {})
    }

    const [total, users] = await Promise.all([
      prisma.user.count({
        where
      }),
      prisma.user.findMany({
        where,
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
        },
        orderBy: {
          id: 'desc'
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])

    return res.json({
      success: true,
      data: users,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1)
      }
    })
  } catch (error) {
    console.error('取得會員列表失敗:', error)

    return res.status(500).json({
      success: false,
      message: '取得會員列表失敗',
      error: String(error)
    })
  }
})

// 更新會員等級
router.put('/users/:id/member-level', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const memberLevel = normalizeMemberLevel(req.body.memberLevel || req.body.level)

    if (!id) {
      return res.status(400).json({
        success: false,
        message: '缺少會員 ID'
      })
    }

    if (!memberLevel) {
      return res.status(400).json({
        success: false,
        message: '會員等級只能是 NORMAL 或 VIP'
      })
    }

    const exists = await prisma.user.findUnique({
      where: {
        id
      }
    })

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: '找不到會員'
      })
    }

    const user = await prisma.user.update({
      where: {
        id
      },
      data: {
        memberLevel
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
        updatedAt: true
      }
    })

    return res.json({
      success: true,
      message: '會員等級更新成功',
      data: user
    })
  } catch (error) {
    console.error('更新會員等級失敗:', error)

    return res.status(500).json({
      success: false,
      message: '更新會員等級失敗',
      error: String(error)
    })
  }
})

// 更新會員狀態（目前 schema 沒有 status 欄位，先安全回傳）
router.put('/users/:id/status', async (_req, res) => {
  try {
    return res.json({
      success: true,
      message: '目前 User schema 沒有 status 欄位，未更新資料庫'
    })
  } catch (error) {
    console.error('更新會員狀態失敗:', error)

    return res.status(500).json({
      success: false,
      message: '更新會員狀態失敗',
      error: String(error)
    })
  }
})


/* =========================================================
   Rewards / Redemption
========================================================= */

const buildAdminRewardWhere = (query = {}) => {
  const keyword = String(query.keyword || query.search || '').trim()
  const status = String(query.status || '').trim()
  const campaignId = query.campaignId ? Number(query.campaignId) : null

  return {
    ...(status ? { status } : {}),
    ...(campaignId ? { campaignId } : {}),
    ...(keyword
      ? {
          OR: [
            { code: { contains: keyword } },
            { user: { name: { contains: keyword, mode: 'insensitive' } } },
            { user: { email: { contains: keyword, mode: 'insensitive' } } },
            { campaign: { title: { contains: keyword, mode: 'insensitive' } } },
            { prize: { title: { contains: keyword, mode: 'insensitive' } } }
          ]
        }
      : {})
  }
}

const normalizeRewardStatus = (status) => {
  const value = String(status || '').toUpperCase()

  if (['UNUSED', 'USED', 'EXPIRED'].includes(value)) {
    return value
  }

  return 'UNUSED'
}

// 取得發獎核銷列表
router.get('/rewards', async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1)
    const pageSize = Math.max(Number(req.query.pageSize || 10), 1)
    const where = buildAdminRewardWhere(req.query)

    const [total, rewards] = await Promise.all([
      prisma.userReward.count({
        where
      }),
      prisma.userReward.findMany({
        where,
        include: {
          user: true,
          campaign: true,
          prize: true
        },
        orderBy: {
          id: 'desc'
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])

    return res.json({
      success: true,
      data: rewards,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1)
      }
    })
  } catch (error) {
    console.error('取得發獎核銷列表失敗:', error)
    return res.status(500).json({
      success: false,
      message: '取得發獎核銷列表失敗',
      error: String(error)
    })
  }
})

// 更新獎勵狀態
router.put('/rewards/:id/status', async (req, res) => {
  try {
    const id = toNumber(req.params.id)
    const status = normalizeRewardStatus(req.body.status)

    const exists = await prisma.userReward.findUnique({
      where: {
        id
      }
    })

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: '找不到這筆發獎紀錄'
      })
    }

    const reward = await prisma.userReward.update({
      where: {
        id
      },
      data: {
        status
      },
      include: {
        user: true,
        campaign: true,
        prize: true
      }
    })

    return res.json({
      success: true,
      message: '獎勵狀態更新成功',
      data: reward
    })
  } catch (error) {
    console.error('更新獎勵狀態失敗:', error)
    return res.status(500).json({
      success: false,
      message: '更新獎勵狀態失敗',
      error: String(error)
    })
  }
})

// 更新獎勵資料
router.put('/rewards/:id', async (req, res) => {
  try {
    const id = toNumber(req.params.id)

    const exists = await prisma.userReward.findUnique({
      where: {
        id
      }
    })

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: '找不到這筆發獎紀錄'
      })
    }

    const allowData = {}

    if (req.body.status !== undefined) {
      allowData.status = normalizeRewardStatus(req.body.status)
    }

    if (req.body.code !== undefined) {
      allowData.code = String(req.body.code || '').trim()
    }

    const reward = await prisma.userReward.update({
      where: {
        id
      },
      data: allowData,
      include: {
        user: true,
        campaign: true,
        prize: true
      }
    })

    return res.json({
      success: true,
      message: '獎勵資料更新成功',
      data: reward
    })
  } catch (error) {
    console.error('更新獎勵失敗:', error)
    return res.status(500).json({
      success: false,
      message: '更新獎勵失敗',
      error: String(error)
    })
  }
})

// 刪除獎勵
router.delete('/rewards/:id', async (req, res) => {
  try {
    const id = toNumber(req.params.id)

    const exists = await prisma.userReward.findUnique({
      where: {
        id
      }
    })

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: '找不到這筆發獎紀錄'
      })
    }

    await prisma.userReward.delete({
      where: {
        id
      }
    })

    return res.json({
      success: true,
      message: '發獎紀錄刪除成功'
    })
  } catch (error) {
    console.error('刪除獎勵失敗:', error)
    return res.status(500).json({
      success: false,
      message: '刪除獎勵失敗',
      error: String(error)
    })
  }
})

/* =========================================================
   Reports
========================================================= */

/* =========================================================
   Reports
========================================================= */

const buildDateWhere = (startDate, endDate, fieldName = 'createdAt') => {
  const start = toDateOrNull(startDate)
  const end = toDateOrNull(endDate)

  if (!start && !end) return {}

  const range = {}

  if (start) {
    range.gte = start
  }

  if (end) {
    const endOfDay = new Date(end)
    endOfDay.setHours(23, 59, 59, 999)
    range.lte = endOfDay
  }

  return {
    [fieldName]: range
  }
}

const buildRewardWhere = (query = {}) => {
  const keyword = String(query.keyword || '').trim()
  const status = String(query.status || '').trim()
  const campaignId = query.campaignId ? Number(query.campaignId) : null

  return {
    ...(status ? { status } : {}),
    ...(campaignId ? { campaignId } : {}),
    ...(keyword
      ? {
          OR: [
            { code: { contains: keyword } },
            { user: { name: { contains: keyword } } },
            { user: { email: { contains: keyword } } },
            { campaign: { title: { contains: keyword } } },
            { prize: { title: { contains: keyword } } }
          ]
        }
      : {})
  }
}

const buildPlayWhere = (query = {}) => {
  return {
    ...buildDateWhere(query.startDate, query.endDate, 'playedAt'),
    ...(query.campaignId ? { campaignId: Number(query.campaignId) } : {})
  }
}

const formatExportDate = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString()
}

const sendRealXlsx = async (res, filename, sheetName, rows) => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(sheetName)

  const safeRows = Array.isArray(rows) ? rows : []

  if (safeRows.length > 0) {
    worksheet.columns = Object.keys(safeRows[0]).map((key) => ({
      header: key,
      key,
      width: 20
    }))

    worksheet.addRows(safeRows)

    worksheet.getRow(1).font = {
      bold: true
    }

    worksheet.views = [
      {
        state: 'frozen',
        ySplit: 1
      }
    ]
  } else {
    worksheet.columns = [
      {
        header: 'message',
        key: 'message',
        width: 30
      }
    ]

    worksheet.addRow({
      message: '目前沒有資料'
    })
  }

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

  await workbook.xlsx.write(res)
  return res.end()
}

// 摘要
router.get('/reports/summary', async (req, res) => {
  try {
    const playWhere = buildPlayWhere(req.query)

    const [campaigns, prizes, users, rewards, playRecords] = await Promise.all([
      prisma.campaign.count(),
      prisma.prize.count(),
      prisma.user.count(),
      prisma.userReward.count(),
      prisma.playRecord.count({
        where: playWhere
      })
    ])

    return res.json({
      success: true,
      data: {
        totalCampaigns: campaigns,
        totalPrizes: prizes,
        totalUsers: users,
        totalRewards: rewards,
        totalPlayRecords: playRecords
      }
    })
  } catch (error) {
    console.error('取得報表摘要失敗:', error)
    return res.status(500).json({
      success: false,
      message: '取得報表摘要失敗',
      error: String(error)
    })
  }
})

// 每日報表
router.get('/reports/daily', async (req, res) => {
  try {
    const where = buildPlayWhere(req.query)

    const records = await prisma.playRecord.findMany({
      where,
      include: {
        campaign: true,
        prize: true,
        user: true
      },
      orderBy: {
        id: 'desc'
      }
    })

    const grouped = {}

    records.forEach((item) => {
      const date = item.playedAt
        ? new Date(item.playedAt).toISOString().slice(0, 10)
        : '未知日期'

      if (!grouped[date]) {
        grouped[date] = {
          date,
          playCount: 0,
          winCount: 0,
          campaigns: new Set()
        }
      }

      grouped[date].playCount += 1

      if (item.isWin) {
        grouped[date].winCount += 1
      }

      if (item.campaignId) {
        grouped[date].campaigns.add(item.campaignId)
      }
    })

    const data = Object.values(grouped)
      .map((item) => ({
        date: item.date,
        playCount: item.playCount,
        winCount: item.winCount,
        campaignCount: item.campaigns.size
      }))
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))

    return res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('取得每日報表失敗:', error)
    return res.status(500).json({
      success: false,
      message: '取得每日報表失敗',
      error: String(error)
    })
  }
})

// 遊玩紀錄
router.get('/reports/play-records', async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1)
    const pageSize = Math.max(Number(req.query.pageSize || 10), 1)
    const where = buildPlayWhere(req.query)

    const [total, records] = await Promise.all([
      prisma.playRecord.count({
        where
      }),
      prisma.playRecord.findMany({
        where,
        include: {
          user: true,
          campaign: true,
          prize: true
        },
        orderBy: {
          id: 'desc'
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])

    return res.json({
      success: true,
      data: records,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1)
      }
    })
  } catch (error) {
    console.error('取得遊玩紀錄失敗:', error)
    return res.status(500).json({
      success: false,
      message: '取得遊玩紀錄失敗',
      error: String(error)
    })
  }
})

// 發獎紀錄
router.get('/reports/reward-records', async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1)
    const pageSize = Math.max(Number(req.query.pageSize || 10), 1)
    const where = buildRewardWhere(req.query)

    const [total, records] = await Promise.all([
      prisma.userReward.count({
        where
      }),
      prisma.userReward.findMany({
        where,
        include: {
          user: true,
          campaign: true,
          prize: true
        },
        orderBy: {
          id: 'desc'
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])

    const totalPages = Math.max(Math.ceil(total / pageSize), 1)

    return res.json({
      success: true,
      data: records,
      pagination: {
        page,
        pageSize,
        total,
        totalPages
      }
    })
  } catch (error) {
    console.error('取得發獎紀錄失敗:', error)
    return res.status(500).json({
      success: false,
      message: '取得發獎紀錄失敗',
      error: String(error)
    })
  }
})

const getPlayExportRows = async (query = {}) => {
  const where = buildPlayWhere(query)

  const records = await prisma.playRecord.findMany({
    where,
    include: {
      user: true,
      campaign: true,
      prize: true
    },
    orderBy: {
      id: 'desc'
    }
  })

  return records.map((item) => ({
    id: item.id,
    campaignId: item.campaignId || '',
    campaign: item.campaign?.title || '',
    prizeId: item.prizeId || '',
    prize: item.prize?.title || '',
    userId: item.userId || '',
    user: item.user?.name || '',
    email: item.user?.email || '',
    isWin: item.isWin ? 'YES' : 'NO',
    playedAt: formatExportDate(item.playedAt)
  }))
}

const getRewardExportRows = async (query = {}) => {
  const where = buildRewardWhere(query)

  const records = await prisma.userReward.findMany({
    where,
    include: {
      user: true,
      campaign: true,
      prize: true
    },
    orderBy: {
      id: 'desc'
    }
  })

  return records.map((item) => ({
    id: item.id,
    campaignId: item.campaignId || '',
    campaign: item.campaign?.title || '',
    prizeId: item.prizeId || '',
    prize: item.prize?.title || '',
    userId: item.userId || '',
    user: item.user?.name || '',
    email: item.user?.email || '',
    code: item.code || '',
    status: item.status || '',
    createdAt: formatExportDate(item.createdAt),
    updatedAt: formatExportDate(item.updatedAt)
  }))
}

// 匯出 play-records csv
router.get('/reports/play-records/csv', async (req, res) => {
  try {
    const rows = await getPlayExportRows(req.query)
    return sendCsv(res, 'play-records.csv', rows)
  } catch (error) {
    console.error('匯出 play records csv 失敗:', error)
    return res.status(500).json({
      success: false,
      message: '匯出 play records csv 失敗',
      error: String(error)
    })
  }
})

// 匯出 play-records xlsx
router.get('/reports/play-records/xlsx', async (req, res) => {
  try {
    const rows = await getPlayExportRows(req.query)
    return sendRealXlsx(res, 'play-records.xlsx', 'Play Records', rows)
  } catch (error) {
    console.error('匯出 play records xlsx 失敗:', error)
    return res.status(500).json({
      success: false,
      message: '匯出 play records xlsx 失敗',
      error: String(error)
    })
  }
})

// 匯出 reward-records csv
router.get('/reports/reward-records/csv', async (req, res) => {
  try {
    const rows = await getRewardExportRows(req.query)
    return sendCsv(res, 'reward-records.csv', rows)
  } catch (error) {
    console.error('匯出 reward records csv 失敗:', error)
    return res.status(500).json({
      success: false,
      message: '匯出 reward records csv 失敗',
      error: String(error)
    })
  }
})

// 匯出 reward-records xlsx
router.get('/reports/reward-records/xlsx', async (req, res) => {
  try {
    const rows = await getRewardExportRows(req.query)
    return sendRealXlsx(res, 'reward-records.xlsx', 'Reward Records', rows)
  } catch (error) {
    console.error('匯出 reward records xlsx 失敗:', error)
    return res.status(500).json({
      success: false,
      message: '匯出 reward records xlsx 失敗',
      error: String(error)
    })
  }
})

export default router
