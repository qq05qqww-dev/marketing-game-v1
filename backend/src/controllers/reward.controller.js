import prisma from '../config/prisma.js'

export const getMyRewards = async (req, res) => {
  try {
    const rewards = await prisma.userReward.findMany({
      where: {
        userId: req.user.id
      },
      include: {
        campaign: true,
        prize: true
      },
      orderBy: {
        id: 'desc'
      }
    })

    const data = rewards.map(item => ({
      id: item.id,
      campaignTitle: item.campaign.title,
      prizeTitle: item.prize.title,
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
    return res.status(500).json({
      success: false,
      message: error.message || '取得獎品失敗'
    })
  }
}