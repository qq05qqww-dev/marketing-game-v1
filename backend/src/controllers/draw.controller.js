import { playDrawWithPrisma } from '../services/draw.service.js'

const toNumberOrNull = (value) => {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : null
}

const normalizeGameType = (value) => {
  const gameType = String(value || '').toUpperCase()

  if (['WHEEL', 'FLIP', 'GRID', 'SCRATCH'].includes(gameType)) {
    return gameType
  }

  return ''
}

const buildClientMeta = (body = {}) => {
  return {
    gameType: normalizeGameType(body.gameType),
    selectedIndex: body.selectedIndex ?? null,
    selectedCard: body.selectedCard ?? null,
    selectedCell: body.selectedCell ?? null,
    scratchPosition: body.scratchPosition ?? null,
    clientTime: body.clientTime || new Date().toISOString()
  }
}

export const playDraw = async (req, res) => {
  try {
    const campaignId = toNumberOrNull(req.body?.campaignId)
    const userId = toNumberOrNull(req.user?.id)

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '尚未登入，請先登入後再遊玩'
      })
    }

    if (!campaignId) {
      return res.status(400).json({
        success: false,
        message: '缺少 campaignId 或 campaignId 格式錯誤'
      })
    }

    const clientMeta = buildClientMeta(req.body)

    const result = await playDrawWithPrisma({
      userId,
      campaignId,
      clientMeta
    })

    return res.json({
      success: true,
      message: '抽獎完成',
      data: {
        campaignId,
        userId,
        gameType: result?.gameType || clientMeta.gameType || '',
        resultType: result?.resultType || (result?.isWin ? 'WIN' : 'LOSE'),
        isWin: Boolean(result?.isWin),
        prize: result?.prize || null,
        reward: result?.reward || null,
        playRecord: result?.playRecord || null,
        code: result?.code || result?.reward?.code || '',
        clientMeta,
        raw: result
      }
    })
  } catch (error) {
    console.error('抽獎失敗:', error)

    const message = error?.message || '抽獎失敗'

    const statusCodeMap = {
      '找不到活動': 404,
      '活動不存在': 404,
      '活動尚未開始': 400,
      '活動已結束': 400,
      '活動未啟用': 400,
      '今日遊玩次數已達上限': 429,
      '總遊玩次數已達上限': 429,
      '尚未登入，請先登入後再遊玩': 401
    }

    const statusCode = statusCodeMap[message] || 500

    return res.status(statusCode).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    })
  }
}