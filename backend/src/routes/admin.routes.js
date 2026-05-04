import express from 'express'
import { PrismaClient } from '@prisma/client'
import ExcelJS from 'exceljs'
import { requireAuth, requireAdmin } from '../middleware/security.middleware.js'

const router = express.Router()
const prisma = new PrismaClient()

// V2.3 第 23 批：後台 API 必須先登入，並支援平台管理員 / 商家管理員。
router.use(requireAuth, requireAdmin)

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
   Reports - V2.3 第 23 批：商家報表中心 tenantId 統計版
========================================================= */

const PLATFORM_ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN'])

const getUserRole = (user = {}) => String(user?.role || '').toUpperCase()

const canAccessAllTenants = (user = {}) => {
  const role = getUserRole(user)

  return Boolean(user?.isSuperAdmin || PLATFORM_ADMIN_ROLES.has(role))
}

const getRequestedTenantId = (req) => {
  const rawTenantId = req.query?.tenantId

  if (rawTenantId === undefined || rawTenantId === null || rawTenantId === '') {
    return null
  }

  const tenantId = Number(rawTenantId)
  return Number.isInteger(tenantId) && tenantId > 0 ? tenantId : null
}

const getScopedTenantId = (req) => {
  // 平台管理員：預設看全部；如果 query 帶 tenantId，則只看指定商家。
  if (canAccessAllTenants(req.user)) {
    return getRequestedTenantId(req)
  }

  // 商家帳號：一律只能看自己的 tenantId，忽略前端傳來的 tenantId。
  const tenantId = Number(req.user?.tenantId)
  return Number.isInteger(tenantId) && tenantId > 0 ? tenantId : -1
}

const getReportScope = (req, scopedTenantId = getScopedTenantId(req)) => {
  if (!canAccessAllTenants(req.user)) return 'TENANT'
  return scopedTenantId ? 'PLATFORM_TENANT' : 'ALL'
}

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

const buildTenantScopedWhere = (req, baseWhere = {}) => {
  const tenantId = getScopedTenantId(req)

  if (!tenantId) return baseWhere

  return {
    ...baseWhere,
    tenantId
  }
}

const normalizeSource = (value) => {
  const source = String(value || '').trim().toLowerCase()

  if (['line', 'facebook', 'instagram', 'direct'].includes(source)) {
    return source
  }

  if (source === 'fb') return 'facebook'
  if (source === 'ig') return 'instagram'

  return 'direct'
}

const getRecordSource = (record = {}) => {
  const payload = record.resultPayload || {}

  return normalizeSource(
    payload.source ||
      payload.trafficSource ||
      payload.from ||
      payload.shareSource ||
      'direct'
  )
}

const normalizeWinFilter = (value) => {
  const normalized = String(value || '').trim().toUpperCase()

  if (['WIN', 'TRUE', '1', 'YES'].includes(normalized)) return true
  if (['LOSE', 'FALSE', '0', 'NO'].includes(normalized)) return false

  return null
}

const getTextFilter = (value) => String(value || '').trim()

const buildPlayBaseWhere = (req, query = {}) => {
  const keyword = getTextFilter(query.keyword)
  const serialCode = getTextFilter(query.serialCode)
  const isWin = normalizeWinFilter(query.isWin)

  return buildTenantScopedWhere(req, {
    ...buildDateWhere(query.startDate, query.endDate, 'playedAt'),
    ...(query.campaignId ? { campaignId: Number(query.campaignId) } : {}),
    ...(query.prizeId ? { prizeId: Number(query.prizeId) } : {}),
    ...(isWin !== null ? { isWin } : {}),
    ...(serialCode
      ? {
          serialCode: {
            is: {
              code: {
                contains: serialCode,
                mode: 'insensitive'
              }
            }
          }
        }
      : {}),
    ...(keyword
      ? {
          OR: [
            { playerName: { contains: keyword, mode: 'insensitive' } },
            { playerPhone: { contains: keyword, mode: 'insensitive' } },
            { playerEmail: { contains: keyword, mode: 'insensitive' } },
            { campaign: { title: { contains: keyword, mode: 'insensitive' } } },
            { prize: { title: { contains: keyword, mode: 'insensitive' } } },
            { serialCode: { code: { contains: keyword, mode: 'insensitive' } } }
          ]
        }
      : {})
  })
}

const getSourceFilter = (query = {}) => {
  const raw = String(query.source || query.trafficSource || '').trim().toLowerCase()

  if (!raw) return ''

  return normalizeSource(raw)
}

const buildPlayWhere = async (req, query = {}) => {
  const baseWhere = buildPlayBaseWhere(req, query)
  const source = getSourceFilter(query)

  if (!source) return baseWhere

  const candidates = await prisma.playRecord.findMany({
    where: baseWhere,
    select: {
      id: true,
      resultPayload: true
    }
  })

  const ids = candidates
    .filter((record) => getRecordSource(record) === source)
    .map((record) => record.id)

  return {
    ...baseWhere,
    id: {
      in: ids.length ? ids : [-1]
    }
  }
}

const buildRewardRecordBaseWhere = (req, query = {}) => {
  const keyword = getTextFilter(query.keyword)
  const status = String(query.status || '').trim().toUpperCase()
  const serialCode = getTextFilter(query.serialCode)

  return buildTenantScopedWhere(req, {
    ...buildDateWhere(query.startDate, query.endDate, 'createdAt'),
    ...(status ? { status } : {}),
    ...(query.campaignId ? { campaignId: Number(query.campaignId) } : {}),
    ...(query.prizeId ? { prizeId: Number(query.prizeId) } : {}),
    ...(serialCode
      ? {
          playRecord: {
            serialCode: {
              is: {
                code: {
                  contains: serialCode,
                  mode: 'insensitive'
                }
              }
            }
          }
        }
      : {}),
    ...(keyword
      ? {
          OR: [
            { winnerName: { contains: keyword, mode: 'insensitive' } },
            { winnerPhone: { contains: keyword, mode: 'insensitive' } },
            { winnerEmail: { contains: keyword, mode: 'insensitive' } },
            { claimCode: { contains: keyword, mode: 'insensitive' } },
            { campaign: { title: { contains: keyword, mode: 'insensitive' } } },
            { prize: { title: { contains: keyword, mode: 'insensitive' } } },
            { playRecord: { serialCode: { code: { contains: keyword, mode: 'insensitive' } } } }
          ]
        }
      : {})
  })
}

const buildRewardRecordWhere = async (req, query = {}) => {
  const baseWhere = buildRewardRecordBaseWhere(req, query)
  const source = getSourceFilter(query)

  if (!source) return baseWhere

  const candidates = await prisma.rewardRecord.findMany({
    where: baseWhere,
    select: {
      id: true,
      playRecord: {
        select: {
          resultPayload: true
        }
      }
    }
  })

  const ids = candidates
    .filter((record) => getRecordSource(record.playRecord || {}) === source)
    .map((record) => record.id)

  return {
    ...baseWhere,
    id: {
      in: ids.length ? ids : [-1]
    }
  }
}

const formatExportDate = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString()
}

const buildSourceStats = (records = []) => {
  const stats = {
    line: 0,
    facebook: 0,
    instagram: 0,
    direct: 0
  }

  records.forEach((record) => {
    const source = getRecordSource(record)
    stats[source] = Number(stats[source] || 0) + 1
  })

  const total = Object.values(stats).reduce((sum, value) => sum + Number(value || 0), 0)

  return {
    total,
    items: [
      { key: 'line', label: 'LINE', count: stats.line, percent: total ? Math.round((stats.line / total) * 100) : 0 },
      { key: 'facebook', label: 'Facebook', count: stats.facebook, percent: total ? Math.round((stats.facebook / total) * 100) : 0 },
      { key: 'instagram', label: 'Instagram', count: stats.instagram, percent: total ? Math.round((stats.instagram / total) * 100) : 0 },
      { key: 'direct', label: '一般 / 直接', count: stats.direct, percent: total ? Math.round((stats.direct / total) * 100) : 0 }
    ]
  }
}

const sendRealXlsx = async (res, filename, sheetName, rows) => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(sheetName)

  const safeRows = Array.isArray(rows) ? rows : []

  if (safeRows.length > 0) {
    worksheet.columns = Object.keys(safeRows[0]).map((key) => ({
      header: key,
      key,
      width: 22
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

// 商家篩選清單：平台管理員可取得全部商家；商家帳號只回傳自己的商家。
router.get('/reports/tenants', async (req, res) => {
  try {
    const tenantId = getScopedTenantId(req)

    const tenants = await prisma.tenant.findMany({
      where: tenantId ? { id: tenantId } : {},
      select: {
        id: true,
        name: true,
        slug: true,
        status: true
      },
      orderBy: {
        id: 'asc'
      }
    })

    return res.json({
      success: true,
      data: {
        scope: getReportScope(req, tenantId),
        canSelectTenant: canAccessAllTenants(req.user),
        tenants
      }
    })
  } catch (error) {
    console.error('取得報表商家清單失敗:', error)
    return res.status(500).json({
      success: false,
      message: '取得報表商家清單失敗',
      error: String(error)
    })
  }
})

router.get('/reports/summary', async (req, res) => {
  try {
    const playWhere = await buildPlayWhere(req, req.query)
    const rewardWhere = await buildRewardRecordWhere(req, req.query)
    const tenantId = getScopedTenantId(req)
    const tenantWhere = tenantId ? { tenantId } : {}

    const [campaigns, prizes, users, rewardRecords, playRecords, playRows, claimedRewards] = await Promise.all([
      prisma.campaign.count({ where: tenantWhere }),
      prisma.prize.count({ where: tenantWhere }),
      prisma.user.count({ where: tenantWhere }),
      prisma.rewardRecord.count({ where: rewardWhere }),
      prisma.playRecord.count({ where: playWhere }),
      prisma.playRecord.findMany({
        where: playWhere,
        select: {
          id: true,
          resultPayload: true,
          isWin: true
        }
      }),
      prisma.rewardRecord.count({
        where: {
          ...rewardWhere,
          status: 'CLAIMED'
        }
      })
    ])

    const totalWins = playRows.filter((record) => record.isWin).length

    return res.json({
      success: true,
      data: {
        scope: getReportScope(req, tenantId),
        canSelectTenant: canAccessAllTenants(req.user),
        tenantId: tenantId || null,
        selectedTenant: tenantId
          ? await prisma.tenant.findUnique({
              where: { id: tenantId },
              select: { id: true, name: true, slug: true, status: true }
            })
          : null,
        totalCampaigns: campaigns,
        totalPrizes: prizes,
        totalUsers: users,
        totalRewards: rewardRecords,
        totalPlayRecords: playRecords,
        totalWins,
        claimedRewards,
        pendingRewards: Math.max(0, rewardRecords - claimedRewards),
        winRate: playRecords > 0 ? Number(((totalWins / playRecords) * 100).toFixed(2)) : 0,
        sourceStats: buildSourceStats(playRows)
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

router.get('/reports/daily', async (req, res) => {
  try {
    const where = await buildPlayWhere(req, req.query)

    const records = await prisma.playRecord.findMany({
      where,
      include: {
        campaign: true,
        prize: true,
        serialCode: true
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
          line: 0,
          facebook: 0,
          instagram: 0,
          direct: 0,
          campaigns: new Set()
        }
      }

      const source = getRecordSource(item)

      grouped[date].playCount += 1
      grouped[date][source] += 1

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
        campaignCount: item.campaigns.size,
        sourceLine: item.line,
        sourceFacebook: item.facebook,
        sourceInstagram: item.instagram,
        sourceDirect: item.direct
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

router.get('/reports/play-records', async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1)
    const pageSize = Math.max(Number(req.query.pageSize || 10), 1)
    const where = await buildPlayWhere(req, req.query)

    const [total, records] = await Promise.all([
      prisma.playRecord.count({
        where
      }),
      prisma.playRecord.findMany({
        where,
        include: {
          tenant: true,
          campaign: true,
          prize: true,
          serialCode: true
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

router.get('/reports/reward-records', async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1)
    const pageSize = Math.max(Number(req.query.pageSize || 10), 1)
    const where = await buildRewardRecordWhere(req, req.query)

    const [total, records] = await Promise.all([
      prisma.rewardRecord.count({
        where
      }),
      prisma.rewardRecord.findMany({
        where,
        include: {
          tenant: true,
          campaign: true,
          prize: true,
          playRecord: {
            include: {
              serialCode: true
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
      data: records,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1)
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

const getPlayExportRows = async (req, query = {}) => {
  const where = await buildPlayWhere(req, query)

  const records = await prisma.playRecord.findMany({
    where,
    include: {
      tenant: true,
      campaign: true,
      prize: true,
      serialCode: true
    },
    orderBy: {
      id: 'desc'
    }
  })

  return records.map((item) => ({
    id: item.id,
    tenantId: item.tenantId || '',
    tenantName: item.tenant?.name || '',
    campaignId: item.campaignId || '',
    campaign: item.campaign?.title || '',
    prizeId: item.prizeId || '',
    prize: item.prize?.title || '',
    serialCode: item.serialCode?.code || '',
    source: getRecordSource(item),
    isWin: item.isWin ? 'YES' : 'NO',
    playerName: item.playerName || '',
    playerPhone: item.playerPhone || '',
    playerEmail: item.playerEmail || '',
    playedAt: formatExportDate(item.playedAt)
  }))
}

const getRewardExportRows = async (req, query = {}) => {
  const where = await buildRewardRecordWhere(req, query)

  const records = await prisma.rewardRecord.findMany({
    where,
    include: {
      tenant: true,
      campaign: true,
      prize: true,
      playRecord: {
        include: {
          serialCode: true
        }
      }
    },
    orderBy: {
      id: 'desc'
    }
  })

  return records.map((item) => ({
    id: item.id,
    tenantId: item.tenantId || '',
    tenantName: item.tenant?.name || '',
    campaignId: item.campaignId || '',
    campaign: item.campaign?.title || '',
    prizeId: item.prizeId || '',
    prize: item.prize?.title || '',
    serialCode: item.playRecord?.serialCode?.code || '',
    source: getRecordSource(item.playRecord || {}),
    status: item.status || '',
    claimCode: item.claimCode || '',
    winnerName: item.winnerName || '',
    winnerPhone: item.winnerPhone || '',
    winnerEmail: item.winnerEmail || '',
    createdAt: formatExportDate(item.createdAt),
    claimedAt: formatExportDate(item.claimedAt)
  }))
}


const getPrizePerformanceRows = async (req, query = {}) => {
  const tenantId = getScopedTenantId(req)
  const tenantWhere = tenantId ? { tenantId } : {}
  const campaignId = query.campaignId ? Number(query.campaignId) : null

  const prizeWhere = {
    ...tenantWhere,
    ...(campaignId ? { campaignId } : {})
  }

  const playWhere = await buildPlayWhere(req, query)
  const rewardWhere = await buildRewardRecordWhere(req, query)

  const [prizes, totalPlaysInScope] = await Promise.all([
    prisma.prize.findMany({
      where: prizeWhere,
      include: {
        tenant: true,
        campaign: true
      },
      orderBy: [
        { campaignId: 'desc' },
        { sortOrder: 'asc' },
        { id: 'asc' }
      ]
    }),
    prisma.playRecord.count({
      where: playWhere
    })
  ])

  const rows = await Promise.all(
    prizes.map(async (prize) => {
      const prizePlayWhere = {
        ...playWhere,
        prizeId: prize.id
      }

      const prizeRewardWhere = {
        ...rewardWhere,
        prizeId: prize.id
      }

      const [hitCount, winCount, rewardCount, claimedCount, cancelledCount] = await Promise.all([
        prisma.playRecord.count({
          where: prizePlayWhere
        }),
        prisma.playRecord.count({
          where: {
            ...prizePlayWhere,
            isWin: true
          }
        }),
        prisma.rewardRecord.count({
          where: prizeRewardWhere
        }),
        prisma.rewardRecord.count({
          where: {
            ...prizeRewardWhere,
            status: 'CLAIMED'
          }
        }),
        prisma.rewardRecord.count({
          where: {
            ...prizeRewardWhere,
            status: 'CANCELLED'
          }
        })
      ])

      const pendingCount = Math.max(0, rewardCount - claimedCount - cancelledCount)
      const stockTotal = Number(prize.stockTotal || 0)
      const stockUsed = Number(prize.stockUsed || 0)
      const remainStock = Number(prize.remainStock || 0)
      const effectiveTotalStock = stockTotal > 0 ? stockTotal : stockUsed + remainStock
      const stockUsageRate = effectiveTotalStock > 0
        ? Number(((stockUsed / effectiveTotalStock) * 100).toFixed(2))
        : 0
      const winRate = totalPlaysInScope > 0
        ? Number(((winCount / totalPlaysInScope) * 100).toFixed(2))
        : 0
      const claimRate = rewardCount > 0
        ? Number(((claimedCount / rewardCount) * 100).toFixed(2))
        : 0

      return {
        id: prize.id,
        tenantId: prize.tenantId || '',
        tenantName: prize.tenant?.name || '',
        campaignId: prize.campaignId || '',
        campaignTitle: prize.campaign?.title || '',
        prizeTitle: prize.title || '',
        prizeType: prize.type || '',
        prizeStatus: prize.status || '',
        probability: Number(prize.probability || 0),
        stockTotal,
        stockUsed,
        remainStock,
        hitCount,
        winCount,
        rewardCount,
        claimedCount,
        pendingCount,
        cancelledCount,
        winRate,
        claimRate,
        stockUsageRate
      }
    })
  )

  const sortedRows = rows.sort((a, b) => {
    if (Number(b.winCount || 0) !== Number(a.winCount || 0)) {
      return Number(b.winCount || 0) - Number(a.winCount || 0)
    }

    return Number(a.remainStock || 0) - Number(b.remainStock || 0)
  })

  const hasRecordFocusedFilter = Boolean(
    getTextFilter(query.serialCode) ||
    getSourceFilter(query) ||
    getTextFilter(query.keyword) ||
    String(query.isWin || '').trim() ||
    String(query.status || '').trim()
  )

  if (!hasRecordFocusedFilter) {
    return sortedRows
  }

  // When the user is searching record-level fields such as serial code/source/result,
  // hide unrelated prize rows that have zero matching records. This keeps the prize table
  // aligned with the current query instead of showing every historical prize.
  return sortedRows.filter((row) => {
    return Number(row.hitCount || 0) > 0 ||
      Number(row.winCount || 0) > 0 ||
      Number(row.rewardCount || 0) > 0 ||
      Number(row.claimedCount || 0) > 0 ||
      Number(row.pendingCount || 0) > 0 ||
      Number(row.cancelledCount || 0) > 0
  })
}

const paginateRows = (rows = [], query = {}) => {
  const page = Math.max(Number(query.page || query.prizePage || 1), 1)
  const pageSize = Math.max(Number(query.pageSize || 10), 1)
  const total = rows.length
  const totalPages = Math.max(Math.ceil(total / pageSize), 1)
  const safePage = Math.min(page, totalPages)
  const startIndex = (safePage - 1) * pageSize

  return {
    items: rows.slice(startIndex, startIndex + pageSize),
    pagination: {
      page: safePage,
      pageSize,
      total,
      totalPages
    }
  }
}

router.get('/reports/prize-performance', async (req, res) => {
  try {
    const rows = await getPrizePerformanceRows(req, req.query)
    const { items, pagination } = paginateRows(rows, req.query)

    return res.json({
      success: true,
      data: {
        items,
        topRows: rows.slice(0, 8),
        pagination
      }
    })
  } catch (error) {
    console.error('取得獎項成效統計失敗:', error)
    return res.status(500).json({
      success: false,
      message: '取得獎項成效統計失敗',
      error: String(error)
    })
  }
})

router.get('/reports/prize-performance/csv', async (req, res) => {
  try {
    const rows = await getPrizePerformanceRows(req, req.query)
    return sendCsv(res, 'prize-performance.csv', rows)
  } catch (error) {
    console.error('匯出 prize performance csv 失敗:', error)
    return res.status(500).json({
      success: false,
      message: '匯出 prize performance csv 失敗',
      error: String(error)
    })
  }
})

router.get('/reports/prize-performance/xlsx', async (req, res) => {
  try {
    const rows = await getPrizePerformanceRows(req, req.query)
    return sendRealXlsx(res, 'prize-performance.xlsx', 'Prize Performance', rows)
  } catch (error) {
    console.error('匯出 prize performance xlsx 失敗:', error)
    return res.status(500).json({
      success: false,
      message: '匯出 prize performance xlsx 失敗',
      error: String(error)
    })
  }
})

router.get('/reports/play-records/csv', async (req, res) => {
  try {
    const rows = await getPlayExportRows(req, req.query)
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

router.get('/reports/play-records/xlsx', async (req, res) => {
  try {
    const rows = await getPlayExportRows(req, req.query)
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

router.get('/reports/reward-records/csv', async (req, res) => {
  try {
    const rows = await getRewardExportRows(req, req.query)
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

router.get('/reports/reward-records/xlsx', async (req, res) => {
  try {
    const rows = await getRewardExportRows(req, req.query)
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
