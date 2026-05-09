// Multi Game Platform V2.3
// 第 60 批：useGameDrawEngine.js 共用抽獎流程 composable 版
//
// 放置位置：
// frontend/src/composables/useGameDrawEngine.js
//
// 目的：
// 1. 統一處理所有遊戲前台抽獎流程。
// 2. 讓金蛋、九宮格、輪盤、刮刮卡未來都能吃同一種抽獎結果格式。
// 3. 這一批只新增檔案，不接入任何現有頁面。

import { computed, ref } from 'vue'
import { normalizeGameType, getGameLabel } from '../games/gameRegistry'
import { normalizeTrafficSource } from './useGameActivityCore'

export const DRAW_RESULT_TYPES = {
  WIN: 'WIN',
  LOSE: 'LOSE',
  REPLAY: 'REPLAY',
  UNKNOWN: 'UNKNOWN'
}

export const normalizePrizeFromDrawResult = (rawPrize = {}) => {
  if (!rawPrize) return null

  const title = rawPrize.title || rawPrize.name || rawPrize.shortName || '活動獎項'
  const shortName = rawPrize.shortName || rawPrize.displayName || rawPrize.title || rawPrize.name || title
  const icon = rawPrize.icon || rawPrize.emoji || '🎁'
  const imageUrl = rawPrize.imageUrl || rawPrize.image || ''

  return {
    ...rawPrize,
    id: rawPrize.id || rawPrize.prizeId || null,
    title,
    name: rawPrize.name || title,
    shortName,
    icon,
    emoji: icon,
    imageUrl,
    type: rawPrize.type || DRAW_RESULT_TYPES.WIN
  }
}

export const getDrawResultType = (drawResult = {}) => {
  const rawType = String(
    drawResult?.result
      || drawResult?.resultType
      || drawResult?.type
      || drawResult?.prize?.type
      || ''
  ).toUpperCase()

  const prizeTitle = String(
    drawResult?.prize?.title
      || drawResult?.prize?.name
      || drawResult?.prize?.shortName
      || drawResult?.prizeName
      || ''
  )

  if (rawType === 'LOSE' || prizeTitle.includes('銘謝惠顧') || prizeTitle.includes('未中獎') || prizeTitle.includes('謝謝參加')) {
    return DRAW_RESULT_TYPES.LOSE
  }

  if (rawType === 'REPLAY' || prizeTitle.includes('再玩一次') || prizeTitle.includes('再抽一次')) {
    return DRAW_RESULT_TYPES.REPLAY
  }

  if (rawType === 'WIN' || drawResult?.prize || drawResult?.prizeId) {
    return DRAW_RESULT_TYPES.WIN
  }

  return DRAW_RESULT_TYPES.UNKNOWN
}

export const normalizeDrawResult = (payload = {}) => {
  const data = payload?.data?.data || payload?.data || payload || {}
  const prize = normalizePrizeFromDrawResult(data.prize || data.reward || data.resultPrize || {
    id: data.prizeId,
    title: data.prizeTitle || data.prizeName,
    name: data.prizeName || data.prizeTitle,
    shortName: data.prizeShortName,
    icon: data.prizeIcon,
    imageUrl: data.prizeImageUrl,
    type: data.prizeType || data.result
  })

  const gameType = normalizeGameType(data.gameType || data.campaign?.gameType || data.campaignType || '')
  const resultType = getDrawResultType({
    ...data,
    prize
  })

  return {
    raw: data,
    success: Boolean(data.success ?? payload?.success ?? true),
    message: data.message || payload?.message || '',
    playRecordId: data.playRecordId || data.playRecord?.id || data.recordId || null,
    rewardRecordId: data.rewardRecordId || data.rewardRecord?.id || null,
    campaignId: data.campaignId || data.campaign?.id || null,
    tenantId: data.tenantId || data.tenant?.id || null,
    gameType,
    gameLabel: gameType ? getGameLabel(gameType) : '互動抽獎',
    resultType,
    isWin: resultType === DRAW_RESULT_TYPES.WIN || resultType === DRAW_RESULT_TYPES.REPLAY,
    isLose: resultType === DRAW_RESULT_TYPES.LOSE,
    source: normalizeTrafficSource(data.source || data.from || data.meta?.from || 'direct'),
    prize,
    player: {
      remainingChances: Number(
        data.player?.remainingChances
          ?? data.remainingChances
          ?? data.chances
          ?? 0
      )
    },
    meta: {
      ...(data.meta || {}),
      serialCode: data.serialCode || data.meta?.serialCode || '',
      from: normalizeTrafficSource(data.source || data.from || data.meta?.from || 'direct')
    }
  }
}

export const buildDrawRequestPayload = (options = {}) => {
  const {
    campaignId,
    tenantId,
    gameType,
    source = 'direct',
    serialCode = '',
    player = {},
    extra = {}
  } = options

  return {
    campaignId,
    tenantId,
    gameType: normalizeGameType(gameType),
    source: normalizeTrafficSource(source),
    serialCode,
    player,
    meta: {
      from: normalizeTrafficSource(source),
      ...extra
    }
  }
}

export const useGameDrawEngine = (options = {}) => {
  const {
    drawApi = null,
    campaignId = null,
    tenantId = null,
    gameType = '',
    source = 'direct',
    beforeDraw = null,
    afterDraw = null,
    onError = null
  } = options

  const isDrawing = ref(false)
  const drawError = ref('')
  const lastDrawResult = ref(null)
  const lastDrawAt = ref('')
  const drawCount = ref(0)

  const hasResult = computed(() => {
    return Boolean(lastDrawResult.value)
  })

  const resultPrize = computed(() => {
    return lastDrawResult.value?.prize || null
  })

  const resultType = computed(() => {
    return lastDrawResult.value?.resultType || DRAW_RESULT_TYPES.UNKNOWN
  })

  const isWinResult = computed(() => {
    return Boolean(lastDrawResult.value?.isWin)
  })

  const isLoseResult = computed(() => {
    return Boolean(lastDrawResult.value?.isLose)
  })

  const remainingChances = computed(() => {
    return Number(lastDrawResult.value?.player?.remainingChances ?? 0)
  })

  const clearDrawError = () => {
    drawError.value = ''
  }

  const clearDrawResult = () => {
    lastDrawResult.value = null
    lastDrawAt.value = ''
  }

  const runDraw = async (overrideOptions = {}) => {
    if (isDrawing.value) {
      return lastDrawResult.value
    }

    if (typeof drawApi !== 'function' && typeof overrideOptions.drawApi !== 'function') {
      drawError.value = '尚未設定抽獎 API，無法執行抽獎。'
      throw new Error(drawError.value)
    }

    const activeDrawApi = overrideOptions.drawApi || drawApi

    const requestPayload = buildDrawRequestPayload({
      campaignId: overrideOptions.campaignId ?? campaignId,
      tenantId: overrideOptions.tenantId ?? tenantId,
      gameType: overrideOptions.gameType ?? gameType,
      source: overrideOptions.source ?? source,
      serialCode: overrideOptions.serialCode || '',
      player: overrideOptions.player || {},
      extra: overrideOptions.extra || {}
    })

    isDrawing.value = true
    drawError.value = ''

    try {
      if (typeof beforeDraw === 'function') {
        await beforeDraw(requestPayload)
      }

      const response = await activeDrawApi(requestPayload)
      const normalized = normalizeDrawResult(response)

      lastDrawResult.value = normalized
      lastDrawAt.value = new Date().toLocaleString('zh-TW', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
      drawCount.value += 1

      if (typeof afterDraw === 'function') {
        await afterDraw(normalized)
      }

      return normalized
    } catch (error) {
      const message = error?.response?.data?.message
        || error?.message
        || '抽獎失敗，請稍後再試。'

      drawError.value = message

      if (typeof onError === 'function') {
        await onError(error, message)
      }

      throw error
    } finally {
      isDrawing.value = false
    }
  }

  const resetDrawEngine = () => {
    isDrawing.value = false
    drawError.value = ''
    lastDrawResult.value = null
    lastDrawAt.value = ''
    drawCount.value = 0
  }

  return {
    isDrawing,
    drawError,
    lastDrawResult,
    lastDrawAt,
    drawCount,

    hasResult,
    resultPrize,
    resultType,
    isWinResult,
    isLoseResult,
    remainingChances,

    clearDrawError,
    clearDrawResult,
    runDraw,
    resetDrawEngine
  }
}
