// Multi Game Platform V2.3 Tenant Edition
// 第 3 批：Reward Controller tenantId 顯示與相容版
//
// 覆蓋位置：
// backend/src/controllers/reward.controller.js

import prisma from '../config/prisma.js'

export const getMyRewards = async (req, res) => {
  try {
    const userId = Number(req.user?.id)

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '登入資料無效，請重新登入'
      })
    }

    const rewards = await prisma.userReward.findMany({
      where: {
        userId
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true
          }
        },
        campaign: true,
        prize: true
      },
      orderBy: {
        id: 'desc'
      }
    })

    const data = rewards.map(item => ({
      id: item.id,
      tenantId: item.tenantId || null,
      tenantName: item.tenant?.name || null,
      tenantSlug: item.tenant?.slug || null,
      campaignId: item.campaignId,
      campaignTitle: item.campaign?.title || '',
      prizeId: item.prizeId,
      prizeTitle: item.prize?.title || '',
      code: item.code,
      status: item.status,
      createdAt: item.createdAt
    }))

    return res.json({
      success: true,
      message: '取得我的獎品成功',
      data
    })
  } catch (error) {
    console.error('取得我的獎品失敗:', error)

    return res.status(500).json({
      success: false,
      message: error.message || '取得獎品失敗'
    })
  }
}
