import prisma from '../config/prisma.js'
import ExcelJS from 'exceljs'

export const listAdminCampaigns = async (req, res) => {
  try {
    const keyword = req.query.keyword?.trim() || ''
    const status = req.query.status?.trim() || ''
    const gameType = req.query.gameType?.trim() || ''

    const campaigns = await prisma.campaign.findMany({
      where: {
        ...(keyword
          ? {
              OR: [
                { title: { contains: keyword, mode: 'insensitive' } },
                { description: { contains: keyword, mode: 'insensitive' } }
              ]
            }
          : {}),
        ...(status ? { status } : {}),
        ...(gameType ? { gameType } : {})
      },
      include: {
        prizes: true
      },
      orderBy: {
        id: 'desc'
      }
    })

    return res.json({
      success: true,
      message: '取得後台活動列表成功',
      data: campaigns
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || '取得後台活動列表失敗'
    })
  }
}

export const createCampaign = async (req, res) => {
  try {
    const {
  title,
  description,
  gameType,
  status,
  startAt,
  endAt,
  dailyLimit,
  totalLimit,
  requireLogin,
  allowedRole,
  requiredLevel
} = req.body
    if (!title || !description || !gameType || !status) {
      return res.status(400).json({
        success: false,
        message: '請填寫完整活動資料'
      })
    }

            const campaign = await prisma.campaign.create({
      data: {
        title,
        description,
        gameType,
        status,
        startAt: startAt ? new Date(startAt) : null,
        endAt: endAt ? new Date(endAt) : null,
        dailyLimit: dailyLimit !== '' && dailyLimit !== null ? Number(dailyLimit) : null,
        totalLimit: totalLimit !== '' && totalLimit !== null ? Number(totalLimit) : null,
        requireLogin: requireLogin === true || requireLogin === 'true',
        allowedRole: allowedRole || null,
        requiredLevel: requiredLevel || null
      }
    })

    return res.json({
      success: true,
      message: '新增活動成功',
      data: campaign
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || '新增活動失敗'
    })
  }
}

export const updateCampaign = async (req, res) => {
  try {
    const id = Number(req.params.id)
    const {
  title,
  description,
  gameType,
  status,
  startAt,
  endAt,
  dailyLimit,
  totalLimit,
  requireLogin,
  allowedRole,
  requiredLevel
} = req.body
    if (!title || !description || !gameType || !status) {
      return res.status(400).json({
        success: false,
        message: '請填寫完整活動資料'
      })
    }

            const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        title,
        description,
        gameType,
        status,
        startAt: startAt ? new Date(startAt) : null,
        endAt: endAt ? new Date(endAt) : null,
        dailyLimit: dailyLimit !== '' && dailyLimit !== null ? Number(dailyLimit) : null,
        totalLimit: totalLimit !== '' && totalLimit !== null ? Number(totalLimit) : null,
        requireLogin: requireLogin === true || requireLogin === 'true',
        allowedRole: allowedRole || null,
        requiredLevel: requiredLevel || null
      }
    })

    return res.json({
      success: true,
      message: '更新活動成功',
      data: campaign
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || '更新活動失敗'
    })
  }
}

export const listCampaignPrizes = async (req, res) => {
  try {
    const keyword = req.query.keyword?.trim() || ''

    const where = keyword
      ? {
          OR: [
            {
              title: {
                contains: keyword,
                mode: 'insensitive'
              }
            },
            {
              campaign: {
                is: {
                  title: {
                    contains: keyword,
                    mode: 'insensitive'
                  }
                }
              }
            }
          ]
        }
      : {}

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
      message: '取得獎項列表成功',
      data: prizes
    })
  } catch (error) {
    console.error('listCampaignPrizes error:', error)
    return res.status(500).json({
      success: false,
      message: error.message || '取得獎項列表失敗'
    })
  }
}

export const createPrize = async (req, res) => {
  try {
    const { campaignId, title, remainStock, probability } = req.body

    if (!campaignId || !title || remainStock === '' || probability === '') {
      return res.status(400).json({
        success: false,
        message: '請填寫完整獎項資料'
      })
    }

    const prize = await prisma.prize.create({
      data: {
        campaignId: Number(campaignId),
        title,
        remainStock: Number(remainStock),
        probability: Number(probability)
      }
    })

    return res.json({
      success: true,
      message: '新增獎項成功',
      data: prize
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || '新增獎項失敗'
    })
  }
}

export const updatePrize = async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { title, remainStock, probability } = req.body

    if (!title || remainStock === '' || probability === '') {
      return res.status(400).json({
        success: false,
        message: '請填寫完整獎項資料'
      })
    }

    const prize = await prisma.prize.update({
      where: { id },
      data: {
        title,
        remainStock: Number(remainStock),
        probability: Number(probability)
      }
    })

    return res.json({
      success: true,
      message: '更新獎項成功',
      data: prize
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || '更新獎項失敗'
    })
  }
}

export const deletePrize = async (req, res) => {
  try {
    const id = Number(req.params.id)

    await prisma.prize.delete({
      where: { id }
    })

    return res.json({
      success: true,
      message: '刪除獎項成功'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || '刪除獎項失敗'
    })
  }
}

export const reportSummary = async (req, res) => {
  try {
    const startDate = req.query.startDate?.trim() || ''
    const endDate = req.query.endDate?.trim() || ''

    const playedAtFilter = {}

    if (startDate) {
      playedAtFilter.gte = new Date(`${startDate}T00:00:00.000Z`)
    }

    if (endDate) {
      playedAtFilter.lte = new Date(`${endDate}T23:59:59.999Z`)
    }

    const playWhere = Object.keys(playedAtFilter).length
      ? { playedAt: playedAtFilter }
      : {}

    const rewardWhere = Object.keys(playedAtFilter).length
      ? { createdAt: playedAtFilter }
      : {}

    const totalPlays = await prisma.playRecord.count({
      where: playWhere
    })

    const totalWins = await prisma.playRecord.count({
      where: {
        ...playWhere,
        isWin: true
      }
    })

    const totalRewards = await prisma.userReward.count({
      where: rewardWhere
    })

    const prizes = await prisma.prize.findMany({
      orderBy: {
        id: 'asc'
      }
    })

    const prizeStats = await Promise.all(
      prizes.map(async (prize) => {
        const sentCount = await prisma.userReward.count({
          where: {
            prizeId: prize.id,
            ...(Object.keys(playedAtFilter).length
              ? { createdAt: playedAtFilter }
              : {})
          }
        })

        return {
          id: prize.id,
          title: prize.title,
          remainStock: prize.remainStock,
          sentCount
        }
      })
    )

    const winRate =
      totalPlays > 0 ? ((totalWins / totalPlays) * 100).toFixed(2) : '0.00'

    return res.json({
      success: true,
      message: '取得報表摘要成功',
      data: {
        totalPlays,
        totalWins,
        totalRewards,
        winRate,
        prizeStats
      }
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || '取得報表摘要失敗'
    })
  }
}

export const reportDaily = async (req, res) => {
  try {
    const startDate = req.query.startDate?.trim() || ''
    const endDate = req.query.endDate?.trim() || ''

    const playedAtFilter = {}

    if (startDate) {
      playedAtFilter.gte = new Date(`${startDate}T00:00:00.000Z`)
    }

    if (endDate) {
      playedAtFilter.lte = new Date(`${endDate}T23:59:59.999Z`)
    }

    const records = await prisma.playRecord.findMany({
      where: Object.keys(playedAtFilter).length
        ? { playedAt: playedAtFilter }
        : undefined,
      orderBy: {
        playedAt: 'asc'
      }
    })

    const dailyMap = {}

    for (const record of records) {
      const date = record.playedAt.toISOString().slice(0, 10)

      if (!dailyMap[date]) {
        dailyMap[date] = {
          date,
          totalPlays: 0,
          totalWins: 0
        }
      }

      dailyMap[date].totalPlays += 1
      if (record.isWin) {
        dailyMap[date].totalWins += 1
      }
    }

    return res.json({
      success: true,
      message: '取得每日統計成功',
      data: Object.values(dailyMap)
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || '取得每日統計失敗'
    })
  }
}

export const exportPlayRecordsCsv = async (req, res) => {
  try {
    const startDate = req.query.startDate?.trim() || ''
    const endDate = req.query.endDate?.trim() || ''

    const playedAtFilter = {}

    if (startDate) {
      playedAtFilter.gte = new Date(`${startDate}T00:00:00.000Z`)
    }

    if (endDate) {
      playedAtFilter.lte = new Date(`${endDate}T23:59:59.999Z`)
    }

    const records = await prisma.playRecord.findMany({
      where: Object.keys(playedAtFilter).length
        ? { playedAt: playedAtFilter }
        : undefined,
      include: {
        user: true,
        campaign: true,
        prize: true
      },
      orderBy: {
        playedAt: 'desc'
      }
    })

    const header = 'ID,會員,Email,活動,獎項,是否中獎,抽獎時間\n'
    const rows = records
      .map((item) =>
        [
          item.id,
          item.user?.name || '',
          item.user?.email || '',
          item.campaign?.title || '',
          item.prize?.title || '',
          item.isWin ? 'YES' : 'NO',
          item.playedAt.toISOString()
        ].join(',')
      )
      .join('\n')

    const csv = header + rows

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename=play-records.csv')
    res.send('\ufeff' + csv)
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '匯出抽獎紀錄 CSV 失敗'
    })
  }
}

export const exportRewardsCsv = async (req, res) => {
  try {
    const startDate = req.query.startDate?.trim() || ''
    const endDate = req.query.endDate?.trim() || ''

    const createdAtFilter = {}

    if (startDate) {
      createdAtFilter.gte = new Date(`${startDate}T00:00:00.000Z`)
    }

    if (endDate) {
      createdAtFilter.lte = new Date(`${endDate}T23:59:59.999Z`)
    }

    const rewards = await prisma.userReward.findMany({
      where: Object.keys(createdAtFilter).length
        ? { createdAt: createdAtFilter }
        : undefined,
      include: {
        user: true,
        campaign: true,
        prize: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const header = 'ID,會員,Email,活動,獎項,序號,狀態,建立時間\n'
    const rows = rewards
      .map((item) =>
        [
          item.id,
          item.user?.name || '',
          item.user?.email || '',
          item.campaign?.title || '',
          item.prize?.title || '',
          item.code,
          item.status,
          item.createdAt.toISOString()
        ].join(',')
      )
      .join('\n')

    const csv = header + rows

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename=rewards.csv')
    res.send('\ufeff' + csv)
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '匯出獎品紀錄 CSV 失敗'
    })
  }
}

export const exportPlayRecordsXlsx = async (req, res) => {
  try {
    const startDate = req.query.startDate?.trim() || ''
    const endDate = req.query.endDate?.trim() || ''

    const playedAtFilter = {}

    if (startDate) {
      playedAtFilter.gte = new Date(`${startDate}T00:00:00.000Z`)
    }

    if (endDate) {
      playedAtFilter.lte = new Date(`${endDate}T23:59:59.999Z`)
    }

    const records = await prisma.playRecord.findMany({
      where: Object.keys(playedAtFilter).length
        ? { playedAt: playedAtFilter }
        : undefined,
      include: {
        user: true,
        campaign: true,
        prize: true
      },
      orderBy: {
        playedAt: 'desc'
      }
    })

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('PlayRecords')

    sheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: '會員', key: 'userName', width: 18 },
      { header: 'Email', key: 'email', width: 28 },
      { header: '活動', key: 'campaignTitle', width: 24 },
      { header: '獎項', key: 'prizeTitle', width: 20 },
      { header: '是否中獎', key: 'isWin', width: 12 },
      { header: '抽獎時間', key: 'playedAt', width: 24 }
    ]

    records.forEach((item) => {
      sheet.addRow({
        id: item.id,
        userName: item.user?.name || '',
        email: item.user?.email || '',
        campaignTitle: item.campaign?.title || '',
        prizeTitle: item.prize?.title || '',
        isWin: item.isWin ? 'YES' : 'NO',
        playedAt: item.playedAt.toISOString()
      })
    })

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=play-records.xlsx'
    )

    await workbook.xlsx.write(res)
    res.end()
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '匯出抽獎紀錄 Excel 失敗'
    })
  }
}

export const exportRewardsXlsx = async (req, res) => {
  try {
    const startDate = req.query.startDate?.trim() || ''
    const endDate = req.query.endDate?.trim() || ''

    const createdAtFilter = {}

    if (startDate) {
      createdAtFilter.gte = new Date(`${startDate}T00:00:00.000Z`)
    }

    if (endDate) {
      createdAtFilter.lte = new Date(`${endDate}T23:59:59.999Z`)
    }

    const rewards = await prisma.userReward.findMany({
      where: Object.keys(createdAtFilter).length
        ? { createdAt: createdAtFilter }
        : undefined,
      include: {
        user: true,
        campaign: true,
        prize: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Rewards')

    sheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: '會員', key: 'userName', width: 18 },
      { header: 'Email', key: 'email', width: 28 },
      { header: '活動', key: 'campaignTitle', width: 24 },
      { header: '獎項', key: 'prizeTitle', width: 20 },
      { header: '序號', key: 'code', width: 22 },
      { header: '狀態', key: 'status', width: 14 },
      { header: '建立時間', key: 'createdAt', width: 24 }
    ]

    rewards.forEach((item) => {
      sheet.addRow({
        id: item.id,
        userName: item.user?.name || '',
        email: item.user?.email || '',
        campaignTitle: item.campaign?.title || '',
        prizeTitle: item.prize?.title || '',
        code: item.code,
        status: item.status,
        createdAt: item.createdAt.toISOString()
      })
    })

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=rewards.xlsx'
    )

    await workbook.xlsx.write(res)
    res.end()
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '匯出獎品紀錄 Excel 失敗'
    })
  }
}
export const listUsers = async (req, res) => {
  try {
    const keyword = req.query.keyword?.trim() || ''
    const role = req.query.role?.trim() || ''
    const memberLevel = req.query.memberLevel?.trim() || ''
    const page = Number(req.query.page || 1)
    const pageSize = Number(req.query.pageSize || 10)

    const where = {
      ...(keyword
        ? {
            OR: [
              { name: { contains: keyword, mode: 'insensitive' } },
              { email: { contains: keyword, mode: 'insensitive' } }
            ]
          }
        : {}),
      ...(role ? { role } : {}),
      ...(memberLevel ? { memberLevel } : {})
    }

    const total = await prisma.user.count({ where })

    const users = await prisma.user.findMany({
      where,
      orderBy: {
        id: 'asc'
      },
      skip: (page - 1) * pageSize,
      take: pageSize
    })

    return res.json({
      success: true,
      message: '取得會員列表成功',
      data: users,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || '取得會員列表失敗'
    })
  }
}

export const updateUserMemberLevel = async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { memberLevel } = req.body

    if (!memberLevel) {
      return res.status(400).json({
        success: false,
        message: '請提供會員等級'
      })
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        memberLevel
      }
    })

    return res.json({
      success: true,
      message: '更新會員等級成功',
      data: user
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || '更新會員等級失敗'
    })
  }
}

export const listRewards = async (req, res) => {
  try {
    const keyword = req.query.keyword?.trim() || ''
    const status = req.query.status?.trim() || ''
    const campaignId = req.query.campaignId ? Number(req.query.campaignId) : null
    const page = Number(req.query.page || 1)
    const pageSize = Number(req.query.pageSize || 10)

    const where = {
      ...(status ? { status } : {}),
      ...(campaignId ? { campaignId } : {}),
      ...(keyword
        ? {
            OR: [
              { code: { contains: keyword, mode: 'insensitive' } },
              {
                user: {
                  is: {
                    name: { contains: keyword, mode: 'insensitive' }
                  }
                }
              },
              {
                user: {
                  is: {
                    email: { contains: keyword, mode: 'insensitive' }
                  }
                }
              },
              {
                campaign: {
                  is: {
                    title: { contains: keyword, mode: 'insensitive' }
                  }
                }
              },
              {
                prize: {
                  is: {
                    title: { contains: keyword, mode: 'insensitive' }
                  }
                }
              }
            ]
          }
        : {})
    }

    const total = await prisma.userReward.count({ where })

    const rewards = await prisma.userReward.findMany({
      where,
      include: {
        user: true,
        campaign: true,
        prize: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * pageSize,
      take: pageSize
    })

    return res.json({
      success: true,
      message: '取得獎品紀錄成功',
      data: rewards,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    console.error('listRewards error:', error)
    return res.status(500).json({
      success: false,
      message: error.message || '取得獎品紀錄失敗'
    })
  }
}

export const updateRewardStatus = async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { status } = req.body

    if (!status) {
      return res.status(400).json({
        success: false,
        message: '請提供狀態'
      })
    }

    const reward = await prisma.userReward.update({
      where: { id },
      data: {
        status
      }
    })

    return res.json({
      success: true,
      message: '更新獎品狀態成功',
      data: reward
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || '更新獎品狀態失敗'
    })
  }
}