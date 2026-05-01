import { computed, ref } from 'vue'

const STORAGE_KEY = 'v22_draw_histories'

const histories = ref([])

const getUrlGameId = () => {
  if (typeof window === 'undefined') return ''

  const normalParams = new URLSearchParams(window.location.search)
  const normalGameId = normalParams.get('gameId')

  if (normalGameId) {
    return normalGameId
  }

  const hash = window.location.hash || ''
  const queryIndex = hash.indexOf('?')

  if (queryIndex >= 0) {
    const hashQuery = hash.slice(queryIndex + 1)
    const hashParams = new URLSearchParams(hashQuery)
    const hashGameId = hashParams.get('gameId')

    if (hashGameId) {
      return hashGameId
    }
  }

  return ''
}

const getEffectiveGameId = (fallbackGameId = '') => {
  const urlGameId = getUrlGameId()

  if (urlGameId) {
    return urlGameId
  }

  return fallbackGameId
}
const getCurrentSourcePath = () => {
  if (typeof window === 'undefined') return ''

  return `${window.location.pathname}${window.location.search}`
}


const loadHistories = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      histories.value = []
      return
    }

    const parsed = JSON.parse(raw)

    histories.value = Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('讀取遊戲紀錄失敗：', error)
    histories.value = []
  }
}

const saveHistories = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(histories.value))
}

const createHistoryId = () => {
  return `history_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

const addHistory = (payload = {}) => {
  const urlGameId = getUrlGameId()
  const finalGameId = getEffectiveGameId(payload.gameId)

  const history = {
    id: createHistoryId(),

    // 如果網址有 ?gameId=summer-grid-2026，就存 summer-grid-2026
    gameId: finalGameId,

    // 原本前台頁面傳進來的遊戲 ID，例如 grid-lottery
    templateGameId: urlGameId ? payload.gameId || '' : '',

    gameName: payload.gameName || '未知遊戲',
    prizeId: payload.prizeId ?? null,
    prizeName: payload.prizeName || '未知獎項',
    prizeDescription: payload.prizeDescription || '',
    prizeIcon: payload.prizeIcon || '🎁',
    playerName: payload.playerName || '訪客玩家',
    sourcePath: payload.sourcePath || getCurrentSourcePath(),
    createdAt: payload.createdAt || new Date().toISOString()
  }

  histories.value.unshift(history)
  saveHistories()

  return history
}

const getHistoriesByGameId = (gameId) => {
  const targetGameId = getEffectiveGameId(gameId)

  return histories.value.filter((history) => {
    return history.gameId === targetGameId
  })
}

const clearHistories = () => {
  histories.value = []
  saveHistories()
}

const clearHistoriesByGameId = (gameId) => {
  const targetGameId = getEffectiveGameId(gameId)

  histories.value = histories.value.filter((history) => {
    return history.gameId !== targetGameId
  })

  saveHistories()
}

const removeHistory = (historyId) => {
  histories.value = histories.value.filter((history) => {
    return history.id !== historyId
  })

  saveHistories()
}

loadHistories()

export function useDrawHistory() {
  const historyCount = computed(() => {
    return histories.value.length
  })

  const latestHistories = computed(() => {
    return histories.value.slice(0, 10)
  })

  return {
    histories,
    historyCount,
    latestHistories,
    addHistory,
    getHistoriesByGameId,
    clearHistories,
    clearHistoriesByGameId,
    removeHistory,
    getEffectiveGameId,
    getUrlGameId,
    getCurrentSourcePath
  }
}