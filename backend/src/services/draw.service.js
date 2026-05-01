import prisma from '../config/prisma.js'

const SUPPORTED_GAME_TYPES = ['WHEEL', 'FLIP', 'GRID', 'SCRATCH']

const toNumber = (value, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const toPositiveNumber = (value, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

const normalizeGameType = (value) => {
  const gameType = String(value || '').toUpperCase()

  if (SUPPORTED_GAME_TYPES.includes(gameType)) {
    return gameType
  }

  return 'WHEEL'
}

const isNoPrizeTitle = (title) => {
  const text = String(title || '').trim()

  return [
    '銘謝惠顧',
    '謝謝參加',
    '未中獎',
    '沒有中獎',
    '再接再厲',
    '再玩一次'
  ].includes(text)
}

const getLoseReason = (title) => {
  const text = String(title || '').trim()

  if (text === '再玩一次') {
    return 'RETRY'
  }

  if (
    text === '銘謝惠顧' ||
    text === '謝謝參加' ||
    text === '未中獎' ||
    text === '沒有中獎' ||
    text === '再接再厲'
  ) {
    return 'THANKS'
  }

  return 'LOSE'
}

const generateRewardCode = () => {
  const time = Date.now()
  const random = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `RW${time}${random}`
}

const pickPrizeByProbability = (prizes = []) => {
  const validPrizes = prizes
    .map((item) => ({
      ...item,
      probability: toPositiveNumber(item.probability, 0)
    }))
    .filter((item) => item.probability > 0 && toNumber(item.remainStock, 0) > 0)

  if (validPrizes.length === 0) {
    return null
  }

  const totalProbability = validPrizes.reduce((sum, item) => {
    return sum + toPositiveNumber(item.probability, 0)
  }, 0)

  if (totalProbability <= 0) {
    return null
  }

  /**
   * 如果總機率 <= 100，當成百分比。
   * 例如總機率 60，剩下 40% 就是未中獎。
   *
   * 如果總機率 > 100，當成權重。
   * 例如 100 / 200 / 300，依權重比例抽。
   */
  const randomBase = totalProbability <= 100 ? 100 : totalProbability
  const random = Math.random() * randomBase

  let current = 0

  for (const prize of validPrizes) {
    current += toPositiveNumber(prize.probability, 0)

    if (random <= current) {
      return prize
    }
  }

  return null
}

const buildPublicPrize = (prize) => {
  if (!prize) return null

  return {
    id: prize.id,
    title: prize.title,
    remainStock: prize.remainStock,
    probability: prize.probability
  }
}

const buildPlayRecordData = ({
  userId,
  campaignId,
  prizeId = null,
  isWin = false
}) => {
  return {
    userId: Number(userId),
    campaignId: Number(campaignId),
    ...(prizeId ? { prizeId: Number(prizeId) } : {}),
    isWin: Boolean(isWin)
  }
}

const checkCampaignPlayable = ({ campaign, now }) => {
  if (!campaign) {
    throw new Error('找不到活動')
  }

  if (String(campaign.status || '').toUpperCase() !== 'ACTIVE') {
    throw new Error('活動未啟用')
  }

  if (campaign.startAt && new Date(campaign.startAt) > now) {
    throw new Error('活動尚未開始')
  }

  if (campaign.endAt && new Date(campaign.endAt) < now) {
    throw new Error('活動已結束')
  }
}

const checkUserEligibility = ({ campaign, user }) => {
  if (campaign.requireLogin && !user) {
    throw new Error('尚未登入，請先登入後再遊玩')
  }

  if (campaign.allowedRole && user?.role !== campaign.allowedRole) {
    throw new Error('你目前沒有參加資格')
  }

  if (campaign.requiredLevel && user?.memberLevel !== campaign.requiredLevel) {
    throw new Error(`本活動限 ${campaign.requiredLevel} 會員參加`)
  }
}

const checkPlayLimit = async ({ tx, userId, campaignId, campaign }) => {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [todayCount, totalCount] = await Promise.all([
    tx.playRecord.count({
      where: {
        userId: Number(userId),
        campaignId: Number(campaignId),
        playedAt: {
          gte: todayStart
        }
      }
    }),
    tx.playRecord.count({
      where: {
        userId: Number(userId),
        campaignId: Number(campaignId)
      }
    })
  ])

  if (campaign.dailyLimit !== null && campaign.dailyLimit !== undefined) {
    if (todayCount >= Number(campaign.dailyLimit)) {
      throw new Error('今日遊玩次數已達上限')
    }
  }

  if (campaign.totalLimit !== null && campaign.totalLimit !== undefined) {
    if (totalCount >= Number(campaign.totalLimit)) {
      throw new Error('總遊玩次數已達上限')
    }
  }

  return {
    todayCount,
    totalCount
  }
}

const createLoseResult = async ({
  tx,
  userId,
  campaign,
  selectedPrize = null,
  loseReason = 'LOSE'
}) => {
  const playRecord = await tx.playRecord.create({
    data: buildPlayRecordData({
      userId,
      campaignId: campaign.id,
      prizeId: selectedPrize?.id || null,
      isWin: false
    })
  })

  return {
    isWin: false,
    resultType: 'LOSE',
    loseReason,
    gameType: normalizeGameType(campaign.gameType),
    prize: buildPublicPrize(selectedPrize),
    reward: null,
    playRecord,
    code: ''
  }
}

const createWinResult = async ({
  tx,
  userId,
  campaign,
  selectedPrize
}) => {
  const updateResult = await tx.prize.updateMany({
    where: {
      id: selectedPrize.id,
      remainStock: {
        gt: 0
      }
    },
    data: {
      remainStock: {
        decrement: 1
      }
    }
  })

  if (updateResult.count <= 0) {
    return createLoseResult({
      tx,
      userId,
      campaign,
      selectedPrize,
      loseReason: 'OUT_OF_STOCK'
    })
  }

  const updatedPrize = await tx.prize.findUnique({
    where: {
      id: selectedPrize.id
    }
  })

  const rewardCode = generateRewardCode()

  const reward = await tx.userReward.create({
    data: {
      userId: Number(userId),
      campaignId: campaign.id,
      prizeId: updatedPrize.id,
      code: rewardCode,
      status: 'UNUSED'
    },
    include: {
      user: true,
      campaign: true,
      prize: true
    }
  })

  const playRecord = await tx.playRecord.create({
    data: buildPlayRecordData({
      userId,
      campaignId: campaign.id,
      prizeId: updatedPrize.id,
      isWin: true
    })
  })

  return {
    isWin: true,
    resultType: 'WIN',
    loseReason: '',
    gameType: normalizeGameType(campaign.gameType),
    prize: buildPublicPrize(updatedPrize),
    reward,
    playRecord,
    code: rewardCode
  }
}

export const playDrawWithPrisma = async ({
  userId,
  campaignId,
  clientMeta = {}
}) => {
  const safeUserId = Number(userId)
  const safeCampaignId = Number(campaignId)

  if (!safeUserId) {
    throw new Error('尚未登入，請先登入後再遊玩')
  }

  if (!safeCampaignId) {
    throw new Error('缺少 campaignId')
  }

  return prisma.$transaction(async (tx) => {
    const campaign = await tx.campaign.findUnique({
      where: {
        id: safeCampaignId
      },
      include: {
        prizes: {
          orderBy: {
            id: 'asc'
          }
        }
      }
    })

    const now = new Date()

    checkCampaignPlayable({
      campaign,
      now
    })

    const user = await tx.user.findUnique({
      where: {
        id: safeUserId
      }
    })

    checkUserEligibility({
      campaign,
      user
    })

    const limitInfo = await checkPlayLimit({
      tx,
      userId: safeUserId,
      campaignId: safeCampaignId,
      campaign
    })

    const gameType = normalizeGameType(campaign.gameType || clientMeta.gameType)

    const availablePrizes = campaign.prizes.filter((item) => {
      return toNumber(item.remainStock, 0) > 0
    })

    if (availablePrizes.length === 0) {
      const loseResult = await createLoseResult({
        tx,
        userId: safeUserId,
        campaign,
        selectedPrize: null,
        loseReason: 'EMPTY'
      })

      return {
        ...loseResult,
        gameType,
        campaign: {
          id: campaign.id,
          title: campaign.title,
          gameType
        },
        limitInfo
      }
    }

    const selectedPrize = pickPrizeByProbability(availablePrizes)

    if (!selectedPrize) {
      const loseResult = await createLoseResult({
        tx,
        userId: safeUserId,
        campaign,
        selectedPrize: null,
        loseReason: 'NO_PRIZE'
      })

      return {
        ...loseResult,
        gameType,
        campaign: {
          id: campaign.id,
          title: campaign.title,
          gameType
        },
        limitInfo
      }
    }

    if (isNoPrizeTitle(selectedPrize.title)) {
      const loseResult = await createLoseResult({
        tx,
        userId: safeUserId,
        campaign,
        selectedPrize,
        loseReason: getLoseReason(selectedPrize.title)
      })

      return {
        ...loseResult,
        gameType,
        campaign: {
          id: campaign.id,
          title: campaign.title,
          gameType
        },
        limitInfo
      }
    }

    const winResult = await createWinResult({
      tx,
      userId: safeUserId,
      campaign,
      selectedPrize
    })

    return {
      ...winResult,
      gameType,
      campaign: {
        id: campaign.id,
        title: campaign.title,
        gameType
      },
      limitInfo
    }
  })
}