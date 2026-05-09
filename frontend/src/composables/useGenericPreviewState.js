// Multi Game Platform V2.3
// 第 104 批：useGenericPreviewState.js 改用 demoGameData.js 版
//
// 放置位置：
// frontend/src/composables/useGenericPreviewState.js
//
// 目的：
// 1. 整理 GenericGamePlayView 草案預覽頁的本機狀態。
// 2. 集中管理 chances、sharedCount、drawLogs、resultPrize、isDrawing，並從 demoGameData.js 讀取示範獎品。
// 3. 之後可逐步把 GenericGamePlayView 裡面的 demo 狀態抽到這裡。
// 4. 這一批只新增檔案，不接入任何現有頁面。

import { computed, ref } from 'vue'
import {
  createDemoPrizes
} from '../games/demoGameData'

export const createGenericPreviewPrizeList = () => {
  return createDemoPrizes()
}

export const createGenericPreviewLog = (prize = {}, source = 'direct') => {
  return {
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    prizeName: prize?.title || prize?.name || prize?.shortName || '活動獎項',
    shortName: prize?.shortName || prize?.title || prize?.name || '獎項',
    icon: prize?.icon || prize?.emoji || '🎁',
    type: prize?.type || 'WIN',
    source,
    createdAt: new Date().toLocaleString('zh-TW')
  }
}

export const useGenericPreviewState = (options = {}) => {
  const {
    initialChances = 3,
    initialSharedCount = 0,
    initialSource = 'direct',
    maxLogs = 8
  } = options

  const demoPrizes = ref(createGenericPreviewPrizeList())
  const chances = ref(initialChances)
  const sharedCount = ref(initialSharedCount)
  const source = ref(initialSource)
  const isDrawing = ref(false)
  const resultPrize = ref(null)
  const drawLogs = ref([])
  const latestDrawLogId = ref('')
  const loadedAt = ref(new Date().toLocaleString('zh-TW'))

  const canDraw = computed(() => {
    return chances.value > 0 && !isDrawing.value && demoPrizes.value.length > 0
  })

  const drawLogCount = computed(() => {
    return drawLogs.value.length
  })

  const availablePrizeCount = computed(() => {
    return demoPrizes.value.filter((item) => Number(item.quantity || 0) > 0).length
  })

  const totalPrizeStock = computed(() => {
    return demoPrizes.value.reduce((sum, item) => {
      return sum + Number(item.quantity || 0)
    }, 0)
  })

  const getRandomPrize = () => {
    const pool = demoPrizes.value.filter((item) => Number(item.quantity || 0) > 0)

    if (!pool.length) return demoPrizes.value[0] || null

    return pool[Math.floor(Math.random() * pool.length)]
  }

  const setDrawing = (value) => {
    isDrawing.value = Boolean(value)
  }

  const setResultPrize = (prize = null) => {
    resultPrize.value = prize
  }

  const consumeChance = () => {
    chances.value = Math.max(0, Number(chances.value || 0) - 1)
  }

  const addChance = (amount = 1) => {
    chances.value = Math.max(0, Number(chances.value || 0) + Number(amount || 0))
  }

  const addShareCount = (amount = 1) => {
    sharedCount.value = Math.max(0, Number(sharedCount.value || 0) + Number(amount || 0))
  }

  const addDrawLog = (prize = {}, logSource = source.value) => {
    const log = createGenericPreviewLog(prize, logSource)

    latestDrawLogId.value = log.id
    drawLogs.value = [log, ...drawLogs.value].slice(0, maxLogs)

    return log
  }

  const clearDrawLogs = () => {
    drawLogs.value = []
    latestDrawLogId.value = ''
  }

  const resetPreviewState = () => {
    demoPrizes.value = createGenericPreviewPrizeList()
    chances.value = initialChances
    sharedCount.value = initialSharedCount
    source.value = initialSource
    isDrawing.value = false
    resultPrize.value = null
    drawLogs.value = []
    latestDrawLogId.value = ''
    loadedAt.value = new Date().toLocaleString('zh-TW')
  }

  const refreshLoadedAt = () => {
    loadedAt.value = new Date().toLocaleString('zh-TW')
  }

  return {
    demoPrizes,
    chances,
    sharedCount,
    source,
    isDrawing,
    resultPrize,
    drawLogs,
    latestDrawLogId,
    loadedAt,

    canDraw,
    drawLogCount,
    availablePrizeCount,
    totalPrizeStock,

    getRandomPrize,
    setDrawing,
    setResultPrize,
    consumeChance,
    addChance,
    addShareCount,
    addDrawLog,
    clearDrawLogs,
    resetPreviewState,
    refreshLoadedAt
  }
}
