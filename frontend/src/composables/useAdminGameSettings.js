import { computed, ref } from 'vue'
import { gameSettings as defaultGameSettings } from '../constants/gameSettings'

const STORAGE_KEY = 'v22_admin_game_settings'

const cloneData = (data) => {
  return JSON.parse(JSON.stringify(data))
}

const gameSettings = ref([])

const normalizeRoute = (route = '') => {
  const value = String(route || '').trim()

  if (!value) return ''

  // 錯誤情況：admin/games/xxx
  if (value.startsWith('admin/games/')) {
    return `/${value.replace(/^admin\//, '')}`
  }

  // 錯誤情況：/admin/games/xxx
  if (value.startsWith('/admin/games/')) {
    return value.replace(/^\/admin/, '')
  }

  // 錯誤情況：games/xxx
  if (value.startsWith('games/')) {
    return `/${value}`
  }

  // 正確情況：/games/xxx
  if (value.startsWith('/games/')) {
    return value
  }

  // 其他相對路徑，保守補 /
  if (!value.startsWith('/')) {
    return `/${value}`
  }

  return value
}

const normalizeGame = (game = {}) => {
  return {
    ...game,
    route: normalizeRoute(game.route)
  }
}

const normalizeGameSettings = (settings = []) => {
  return settings.map((game) => normalizeGame(game))
}

const saveGameSettings = () => {
  const normalizedSettings = normalizeGameSettings(gameSettings.value)

  gameSettings.value = normalizedSettings
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedSettings))
}

const loadGameSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (raw) {
      const parsed = JSON.parse(raw)

      if (Array.isArray(parsed)) {
        gameSettings.value = normalizeGameSettings(parsed)
        saveGameSettings()
        return
      }
    }

    gameSettings.value = normalizeGameSettings(cloneData(defaultGameSettings))
    saveGameSettings()
  } catch (error) {
    console.error('讀取遊戲設定失敗：', error)

    gameSettings.value = normalizeGameSettings(cloneData(defaultGameSettings))
    saveGameSettings()
  }
}

const resetGameSettings = () => {
  gameSettings.value = normalizeGameSettings(cloneData(defaultGameSettings))
  saveGameSettings()
}

const getUrlGameId = () => {
  if (typeof window === 'undefined') return ''

  const params = new URLSearchParams(window.location.search)

  return params.get('gameId') || ''
}

const getGameSettingById = (id) => {
  const directGame = gameSettings.value.find((game) => game.id === id)

  const urlGameId = getUrlGameId()

  if (urlGameId) {
    const customGame = gameSettings.value.find((game) => {
      return game.id === urlGameId && game.templateId === id
    })

    if (customGame) {
      return customGame
    }
  }

  return directGame
}

const getRawGameSettingById = (id) => {
  return gameSettings.value.find((game) => game.id === id)
}

const createSlug = (value) => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
}

const buildTemplateRoute = (templateRoute, gameId) => {
  const normalizedTemplateRoute = normalizeRoute(templateRoute)

  if (!normalizedTemplateRoute) {
    return `/games/${gameId}`
  }

  const baseRoute = normalizedTemplateRoute.split('?')[0]

  return `${baseRoute}?gameId=${gameId}`
}

const addGameSetting = (payload = {}) => {
  const id = createSlug(payload.id)

  if (!id) {
    return {
      success: false,
      message: '請輸入遊戲 ID'
    }
  }

  const existed = gameSettings.value.some((game) => game.id === id)

  if (existed) {
    return {
      success: false,
      message: '這個遊戲 ID 已經存在'
    }
  }

  const templateGame = payload.templateId
    ? getRawGameSettingById(payload.templateId)
    : null

  const sourcePrizes = payload.prizes?.length
    ? payload.prizes
    : templateGame?.prizes?.length
      ? cloneData(templateGame.prizes)
      : [
          {
            id: 1,
            name: '頭獎',
            description: '主要大獎',
            icon: '🏆',
            type: 'success',
            weight: 1,
            quantity: 1
          },
          {
            id: 2,
            name: '二獎',
            description: '精美好禮',
            icon: '🎁',
            type: 'primary',
            weight: 5,
            quantity: 10
          },
          {
            id: 3,
            name: '銘謝惠顧',
            description: '下次再接再厲',
            icon: '🙏',
            type: 'default',
            weight: 30,
            quantity: 9999
          }
        ]

  const templateRoute = templateGame?.route?.split('?')[0] || ''
  const route = payload.templateId
    ? buildTemplateRoute(templateRoute, id)
    : normalizeRoute(payload.route || `/games/${id}`)

  const newGame = normalizeGame({
    id,
    templateId: payload.templateId || templateGame?.id || '',
    name: payload.name || templateGame?.name || '新遊戲',
    description: payload.description || templateGame?.description || '請輸入遊戲說明',
    icon: payload.icon || templateGame?.icon || '🎮',
    route,
    type: payload.type || templateGame?.type || 'lottery',
    status: payload.status || 'enabled',
    playLimit: Number(payload.playLimit || templateGame?.playLimit || 1),
    probabilityMode: payload.probabilityMode || templateGame?.probabilityMode || 'weight',
    requiredInviteCount: Number(payload.requiredInviteCount || templateGame?.requiredInviteCount || 0),
    prizes: sourcePrizes
  })

  gameSettings.value.unshift(newGame)
  saveGameSettings()

  return {
    success: true,
    message: '新增遊戲設定成功',
    data: newGame
  }
}

const updateGameSetting = (gameId, payload = {}) => {
  const index = gameSettings.value.findIndex((game) => game.id === gameId)

  if (index < 0) {
    return null
  }

  const currentGame = gameSettings.value[index]

  const updatedGame = normalizeGame({
    ...currentGame,
    templateId: payload.templateId ?? currentGame.templateId ?? '',
    name: payload.name ?? currentGame.name,
    description: payload.description ?? currentGame.description,
    route: normalizeRoute(payload.route ?? currentGame.route),
    icon: payload.icon ?? currentGame.icon,
    type: payload.type ?? currentGame.type,
    status: payload.status ?? currentGame.status,
    playLimit: Number(payload.playLimit ?? currentGame.playLimit ?? 1),
    probabilityMode: payload.probabilityMode ?? currentGame.probabilityMode,
    requiredInviteCount: Number(payload.requiredInviteCount ?? currentGame.requiredInviteCount ?? 0),
    prizes: currentGame.prizes || []
  })

  gameSettings.value.splice(index, 1, updatedGame)
  saveGameSettings()

  return updatedGame
}

const updateGamePrize = (gameId, prizeId, payload = {}) => {
  const gameIndex = gameSettings.value.findIndex((game) => game.id === gameId)

  if (gameIndex < 0) {
    return null
  }

  const currentGame = gameSettings.value[gameIndex]
  const prizes = currentGame.prizes || []
  const prizeIndex = prizes.findIndex((prize) => String(prize.id) === String(prizeId))

  if (prizeIndex < 0) {
    return null
  }

  const currentPrize = prizes[prizeIndex]

  const updatedPrize = {
    ...currentPrize,
    name: payload.name ?? currentPrize.name,
    description: payload.description ?? currentPrize.description,
    icon: payload.icon ?? currentPrize.icon,
    type: payload.type ?? currentPrize.type,
    weight: Number(payload.weight ?? currentPrize.weight ?? 1),
    quantity: Number(payload.quantity ?? currentPrize.quantity ?? 0)
  }

  const updatedPrizes = [...prizes]
  updatedPrizes.splice(prizeIndex, 1, updatedPrize)

  const updatedGame = normalizeGame({
    ...currentGame,
    prizes: updatedPrizes
  })

  gameSettings.value.splice(gameIndex, 1, updatedGame)
  saveGameSettings()

  return updatedPrize
}

const addGamePrize = (gameId, payload = {}) => {
  const gameIndex = gameSettings.value.findIndex((game) => game.id === gameId)

  if (gameIndex < 0) {
    return null
  }

  const currentGame = gameSettings.value[gameIndex]
  const prizes = currentGame.prizes || []

  const maxId = prizes.reduce((max, prize) => {
    return Math.max(max, Number(prize.id || 0))
  }, 0)

  const newPrize = {
    id: maxId + 1,
    name: payload.name || '新獎項',
    description: payload.description || '請輸入獎項說明',
    icon: payload.icon || '🎁',
    type: payload.type || 'primary',
    weight: Number(payload.weight || 1),
    quantity: Number(payload.quantity || 1)
  }

  const updatedGame = normalizeGame({
    ...currentGame,
    prizes: [...prizes, newPrize]
  })

  gameSettings.value.splice(gameIndex, 1, updatedGame)
  saveGameSettings()

  return newPrize
}

const deleteGamePrize = (gameId, prizeId) => {
  const gameIndex = gameSettings.value.findIndex((game) => game.id === gameId)

  if (gameIndex < 0) {
    return false
  }

  const currentGame = gameSettings.value[gameIndex]
  const prizes = currentGame.prizes || []

  const updatedPrizes = prizes.filter((prize) => String(prize.id) !== String(prizeId))

  const updatedGame = normalizeGame({
    ...currentGame,
    prizes: updatedPrizes
  })

  gameSettings.value.splice(gameIndex, 1, updatedGame)
  saveGameSettings()

  return true
}

const fixAllGameRoutes = () => {
  gameSettings.value = normalizeGameSettings(gameSettings.value)
  saveGameSettings()

  return true
}

const getGameSettingSummary = () => {
  return {
    total: gameSettings.value.length,
    enabled: gameSettings.value.filter((game) => game.status === 'enabled').length,
    disabled: gameSettings.value.filter((game) => game.status !== 'enabled').length,
    lottery: gameSettings.value.filter((game) => game.type === 'lottery').length,
    skill: gameSettings.value.filter((game) => game.type === 'skill').length,
    mission: gameSettings.value.filter((game) => game.type === 'mission').length
  }
}

loadGameSettings()

export function useAdminGameSettings() {
  const enabledGameSettings = computed(() => {
    return gameSettings.value.filter((game) => game.status === 'enabled')
  })

  return {
    gameSettings,
    enabledGameSettings,
    loadGameSettings,
    saveGameSettings,
    resetGameSettings,
    getGameSettingById,
    getRawGameSettingById,
    addGameSetting,
    updateGameSetting,
    updateGamePrize,
    addGamePrize,
    deleteGamePrize,
    fixAllGameRoutes,
    normalizeRoute,
    getGameSettingSummary
  }
}