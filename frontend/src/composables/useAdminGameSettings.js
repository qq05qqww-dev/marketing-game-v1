// Multi Game Platform V2.3 Tenant Edition
// 第 38001～38400 批：模板預覽與商家正式玩家頁對齊修正版
//
// 覆蓋位置：
// frontend/src/composables/useAdminGameSettings.js
//
// 修正重點：
// 1. 正式商家遊戲固定為 premium-grid / wheel / golden-egg。
// 2. 舊 grid-lottery 自動視為 premium-grid 的舊模板，不再當成正式商家入口。
// 3. 舊 egg-smash 自動視為 golden-egg 的舊模板，不再當成正式商家入口。
// 4. 新增模板不再產生 /games/1、/games/99 這種不存在路由。
// 5. 所有複製版模板會走 /games/{正式模板}?gameId={自訂ID}，不會 404。
// 6. localStorage 舊資料會自動清理路由，不需要手動刪瀏覽器快取。

import { computed, ref } from 'vue'
import { gameSettings as defaultGameSettings } from '../constants/gameSettings'

const STORAGE_KEY = 'v22_admin_game_settings'

const OFFICIAL_GAME_IDS = ['premium-grid', 'wheel', 'golden-egg']

const LEGACY_TEMPLATE_ALIAS_MAP = {
  'grid-lottery': 'premium-grid',
  'egg-smash': 'golden-egg',
  'premium-nine-grid': 'premium-grid',
  'nine-golden-egg': 'golden-egg',
  'golden-egg-deluxe': 'golden-egg'
}

const OFFICIAL_TEMPLATE_ROUTE_MAP = {
  'premium-grid': '/games/premium-grid',
  wheel: '/games/wheel',
  'golden-egg': '/games/golden-egg',
  'scratch-card': '/games/scratch-card',
  'flip-card': '/games/flip-card',
  'slot-machine': '/games/slot-machine',
  'ring-toss': '/games/ring-toss',
  'claw-machine': '/games/claw-machine',
  'referral-task': '/games/referral-task'
}

const RESERVED_ROUTE_IDS = new Set([
  'scratch-card',
  'flip-card',
  'slot-machine',
  'ring-toss',
  'claw-machine',
  'referral-task'
])

const cloneData = (data) => {
  return JSON.parse(JSON.stringify(data))
}

const gameSettings = ref([])

const normalizeSlug = (value = '') => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
}

const normalizeGameTemplateId = (value = '') => {
  const id = normalizeSlug(value)

  return LEGACY_TEMPLATE_ALIAS_MAP[id] || id
}

const inferTemplateIdFromText = (game = {}) => {
  const text = [
    game.id,
    game.templateId,
    game.name,
    game.title,
    game.description,
    game.route
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (/premium|九宮格|nine|grid/.test(text)) return 'premium-grid'
  if (/wheel|輪盤|轉盤/.test(text)) return 'wheel'
  if (/golden|egg|金蛋|砸金蛋|敲金蛋/.test(text)) return 'golden-egg'
  if (/scratch|刮刮/.test(text)) return 'scratch-card'
  if (/flip|翻牌/.test(text)) return 'flip-card'
  if (/slot|拉霸/.test(text)) return 'slot-machine'
  if (/ring|套圈/.test(text)) return 'ring-toss'
  if (/claw|夾娃娃/.test(text)) return 'claw-machine'
  if (/referral|推薦/.test(text)) return 'referral-task'

  return normalizeGameTemplateId(game.templateId || game.id || '')
}

const isNumericLikeId = (value = '') => {
  return /^\d+$/.test(String(value || '').trim())
}

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

  // 舊正式別名
  if (value.startsWith('/games/grid-lottery')) {
    const query = value.includes('?') ? value.slice(value.indexOf('?')) : ''

    return `/games/premium-grid${query}`
  }

  if (value.startsWith('/games/egg-smash')) {
    const query = value.includes('?') ? value.slice(value.indexOf('?')) : ''

    return `/games/golden-egg${query}`
  }

  // 正確情況：/games/xxx
  if (value.startsWith('/games/')) {
    return value
  }

  // 正確情況：/play/xxx
  if (value.startsWith('/play/')) {
    return value
  }

  // 其他相對路徑，保守補 /
  if (!value.startsWith('/')) {
    return `/${value}`
  }

  return value
}

const getSafeTemplateRoute = (templateId = '') => {
  const normalizedTemplateId = normalizeGameTemplateId(templateId)

  return OFFICIAL_TEMPLATE_ROUTE_MAP[normalizedTemplateId] || `/games/${normalizedTemplateId || 'premium-grid'}`
}

const buildTemplateRoute = (templateRoute, gameId, templateId = '') => {
  const normalizedGameId = normalizeSlug(gameId)
  const normalizedTemplateId = normalizeGameTemplateId(templateId)
  const normalizedTemplateRoute = normalizeRoute(templateRoute)
  const safeBaseRoute = normalizedTemplateRoute && !/^\/games\/\d+/.test(normalizedTemplateRoute)
    ? normalizedTemplateRoute.split('?')[0]
    : getSafeTemplateRoute(normalizedTemplateId)

  if (!normalizedGameId || normalizedGameId === normalizedTemplateId) {
    return safeBaseRoute
  }

  return `${safeBaseRoute}?gameId=${normalizedGameId}`
}

const getCanonicalOfficialGame = (game = {}) => {
  const inferredTemplateId = inferTemplateIdFromText(game)
  const normalizedTemplateId = normalizeGameTemplateId(inferredTemplateId)
  const id = normalizeSlug(game.id || normalizedTemplateId)

  return {
    normalizedId: normalizeGameTemplateId(id),
    templateId: normalizedTemplateId
  }
}

const normalizeGame = (game = {}) => {
  const originalId = normalizeSlug(game.id || '')
  const inferredTemplateId = inferTemplateIdFromText(game)
  const templateId = normalizeGameTemplateId(game.templateId || inferredTemplateId)
  const normalizedId = normalizeGameTemplateId(originalId || templateId)
  const isCustomClone = isNumericLikeId(originalId) || (!!game.templateId && originalId !== templateId)
  const baseRoute = getSafeTemplateRoute(templateId || normalizedId)
  const normalizedExistingRoute = normalizeRoute(game.route)

  let route = normalizedExistingRoute

  if (!route || /^\/games\/\d+/.test(route)) {
    route = isCustomClone
      ? buildTemplateRoute(baseRoute, originalId, templateId || normalizedId)
      : baseRoute
  }

  if (route.startsWith('/games/grid-lottery')) {
    route = route.replace('/games/grid-lottery', '/games/premium-grid')
  }

  if (route.startsWith('/games/egg-smash')) {
    route = route.replace('/games/egg-smash', '/games/golden-egg')
  }

  if (/^\/games\/\d+/.test(route)) {
    route = buildTemplateRoute(baseRoute, originalId, templateId || normalizedId)
  }

  const officialId = OFFICIAL_GAME_IDS.includes(normalizedId)
    ? normalizedId
    : templateId

  return {
    ...game,
    id: originalId || officialId,
    templateId: templateId || '',
    route,
    isOfficialMerchantGame: OFFICIAL_GAME_IDS.includes(originalId || normalizedId) && !isCustomClone,
    merchantVisibility: OFFICIAL_GAME_IDS.includes(originalId || normalizedId) && !isCustomClone
      ? 'official'
      : 'reserved'
  }
}

const dedupeOfficialGames = (settings = []) => {
  const normalizedSettings = settings.map((game) => normalizeGame(game))
  const usedOfficialIds = new Set()
  const result = []

  normalizedSettings.forEach((game) => {
    const id = normalizeGameTemplateId(game.id)
    const templateId = normalizeGameTemplateId(game.templateId)
    const isCanonicalOfficial = OFFICIAL_GAME_IDS.includes(id) && id === templateId

    if (isCanonicalOfficial) {
      if (usedOfficialIds.has(id)) {
        result.push({
          ...game,
          id: `${id}-reserved-${Date.now()}`,
          merchantVisibility: 'reserved',
          isOfficialMerchantGame: false,
          name: `${game.name || id}（平台預留）`
        })
        return
      }

      usedOfficialIds.add(id)
      result.push({
        ...game,
        id,
        templateId: id,
        route: getSafeTemplateRoute(id),
        merchantVisibility: 'official',
        isOfficialMerchantGame: true
      })
      return
    }

    result.push(game)
  })

  return result
}

const ensureOfficialGames = (settings = []) => {
  const normalizedSettings = dedupeOfficialGames(settings)
  const result = [...normalizedSettings]

  OFFICIAL_GAME_IDS.forEach((officialId) => {
    const exists = result.some((game) => {
      return normalizeGameTemplateId(game.id) === officialId && game.merchantVisibility === 'official'
    })

    if (exists) return

    const defaultGame = normalizeGame(defaultGameSettings.find((game) => {
      return normalizeGameTemplateId(game.id) === officialId ||
        normalizeGameTemplateId(game.templateId) === officialId ||
        normalizeGame(game).templateId === officialId
    }) || {})

    result.unshift({
      ...defaultGame,
      id: officialId,
      templateId: officialId,
      name: officialId === 'premium-grid'
        ? '精緻九宮格'
        : officialId === 'wheel'
          ? '幸運輪盤'
          : '砸金蛋',
      icon: officialId === 'premium-grid'
        ? '✨'
        : officialId === 'wheel'
          ? '🎡'
          : '🥚',
      route: getSafeTemplateRoute(officialId),
      status: 'enabled',
      merchantVisibility: 'official',
      isOfficialMerchantGame: true
    })
  })

  return result
}

const normalizeGameSettings = (settings = []) => {
  return ensureOfficialGames(settings)
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
      return game.id === urlGameId && normalizeGameTemplateId(game.templateId) === normalizeGameTemplateId(id)
    })

    if (customGame) {
      return customGame
    }
  }

  return directGame
}

const getRawGameSettingById = (id) => {
  const normalizedId = normalizeGameTemplateId(id)

  return gameSettings.value.find((game) => {
    return game.id === id || normalizeGameTemplateId(game.id) === normalizedId
  })
}

const createSlug = (value) => {
  return normalizeSlug(value)
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

  const templateId = normalizeGameTemplateId(payload.templateId || inferTemplateIdFromText(payload))
  const templateGame = templateId
    ? getRawGameSettingById(templateId)
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

  const templateRoute = templateGame?.route?.split('?')[0] || getSafeTemplateRoute(templateId)
  const route = buildTemplateRoute(templateRoute, id, templateId)

  const newGame = normalizeGame({
    id,
    templateId,
    name: payload.name || templateGame?.name || '新遊戲',
    description: payload.description || templateGame?.description || '請輸入遊戲說明',
    icon: payload.icon || templateGame?.icon || '🎮',
    route,
    type: payload.type || templateGame?.type || 'lottery',
    status: payload.status || 'enabled',
    playLimit: Number(payload.playLimit || templateGame?.playLimit || 1),
    probabilityMode: payload.probabilityMode || templateGame?.probabilityMode || 'weight',
    requiredInviteCount: Number(payload.requiredInviteCount || templateGame?.requiredInviteCount || 0),
    prizes: sourcePrizes,
    merchantVisibility: 'reserved',
    isOfficialMerchantGame: false
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
  const nextTemplateId = normalizeGameTemplateId(payload.templateId ?? currentGame.templateId ?? inferTemplateIdFromText(currentGame))

  const updatedGame = normalizeGame({
    ...currentGame,
    templateId: nextTemplateId,
    name: payload.name ?? currentGame.name,
    description: payload.description ?? currentGame.description,
    route: payload.route
      ? normalizeRoute(payload.route)
      : buildTemplateRoute(getSafeTemplateRoute(nextTemplateId), currentGame.id, nextTemplateId),
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
    mission: gameSettings.value.filter((game) => game.type === 'mission').length,
    official: gameSettings.value.filter((game) => game.merchantVisibility === 'official').length,
    reserved: gameSettings.value.filter((game) => game.merchantVisibility !== 'official').length
  }
}

loadGameSettings()

export function useAdminGameSettings() {
  const enabledGameSettings = computed(() => {
    return gameSettings.value.filter((game) => game.status === 'enabled')
  })

  const officialMerchantGameSettings = computed(() => {
    return gameSettings.value.filter((game) => game.merchantVisibility === 'official')
  })

  const reservedGameSettings = computed(() => {
    return gameSettings.value.filter((game) => game.merchantVisibility !== 'official')
  })

  return {
    gameSettings,
    enabledGameSettings,
    officialMerchantGameSettings,
    reservedGameSettings,
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
    normalizeGameTemplateId,
    getSafeTemplateRoute,
    getGameSettingSummary
  }
}
