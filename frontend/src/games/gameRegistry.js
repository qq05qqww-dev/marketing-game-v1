// Multi Game Platform V2.3
// 第 58 批：gameRegistry.js 遊戲註冊表版
//
// 放置位置：
// frontend/src/games/gameRegistry.js
//
// 目的：
// 1. 統一管理所有遊戲類型。
// 2. 未來新增遊戲時，不需要到處硬寫 gameType / route / label。
// 3. 前台、後台、報表、活動建立可以逐步改讀這份 registry。
// 4. 這一批只新增檔案，不接入任何現有頁面。

export const GAME_TYPES = {
  GOLDEN_EGG: 'GOLDEN_EGG',
  GRID: 'GRID',
  WHEEL: 'WHEEL',
  SCRATCH_CARD: 'SCRATCH_CARD',
  FLIP_CARD: 'FLIP_CARD',
  RED_PACKET: 'RED_PACKET',
  SLOT_MACHINE: 'SLOT_MACHINE'
}

export const GAME_REGISTRY = {
  [GAME_TYPES.GOLDEN_EGG]: {
    gameType: GAME_TYPES.GOLDEN_EGG,
    label: '砸金蛋',
    shortLabel: '金蛋',
    description: '玩家點擊金蛋進行抽獎，適合序號兌換、門市活動與會員抽獎。',
    icon: '🥚',
    emoji: '🥚',
    frontPath: 'golden-egg',
    adminPath: 'golden-egg',
    boardComponent: 'GoldenEggPlayBoard',
    defaultRouteName: 'TenantGoldenEggGame',
    defaultRequireSerialCode: true,
    supportsSerialCode: true,
    supportsShareBonus: true,
    supportsSourceTracking: true,
    supportsPrizeWeight: true,
    supportsStock: true,
    supportsRewardRecord: true,
    status: 'STABLE',
    theme: {
      start: '#facc15',
      middle: '#f97316',
      end: '#dc2626'
    },
    defaultConfig: {
      eggCount: 9,
      animationType: 'crack',
      showHammer: true,
      showPrizeBeforeDraw: false
    }
  },

  [GAME_TYPES.GRID]: {
    gameType: GAME_TYPES.GRID,
    label: '精緻九宮格',
    shortLabel: '九宮格',
    description: '玩家點擊九宮格中間按鈕，跑燈停在本次抽獎結果。',
    icon: '🎯',
    emoji: '🎯',
    frontPath: 'premium-grid',
    adminPath: 'premium-grid',
    boardComponent: 'PremiumGridPlayBoard',
    defaultRouteName: 'TenantPremiumGridGame',
    defaultRequireSerialCode: false,
    supportsSerialCode: true,
    supportsShareBonus: true,
    supportsSourceTracking: true,
    supportsPrizeWeight: true,
    supportsStock: true,
    supportsRewardRecord: true,
    status: 'STABLE',
    theme: {
      start: '#ffb237',
      middle: '#ff7a18',
      end: '#ee3f24'
    },
    defaultConfig: {
      gridSize: 9,
      drawPath: [0, 1, 2, 5, 8, 7, 6, 3],
      centerButtonIndex: 4,
      animationType: 'runner-light'
    }
  },

  [GAME_TYPES.WHEEL]: {
    gameType: GAME_TYPES.WHEEL,
    label: '幸運輪盤',
    shortLabel: '輪盤',
    description: '玩家點擊輪盤開始旋轉，指針停留位置決定本次結果。',
    icon: '🎡',
    emoji: '🎡',
    frontPath: 'wheel',
    adminPath: 'wheel',
    boardComponent: 'LuckyWheelPlayBoard',
    defaultRouteName: 'TenantWheelGame',
    defaultRequireSerialCode: false,
    supportsSerialCode: true,
    supportsShareBonus: true,
    supportsSourceTracking: true,
    supportsPrizeWeight: true,
    supportsStock: true,
    supportsRewardRecord: true,
    status: 'PLANNED',
    theme: {
      start: '#38bdf8',
      middle: '#6366f1',
      end: '#7c3aed'
    },
    defaultConfig: {
      pointerStyle: 'classic',
      spinDuration: 4200,
      showOuterLights: true,
      showPointerShake: true
    }
  },

  [GAME_TYPES.SCRATCH_CARD]: {
    gameType: GAME_TYPES.SCRATCH_CARD,
    label: '刮刮卡',
    shortLabel: '刮刮卡',
    description: '玩家刮開遮罩後顯示中獎或未中獎結果。',
    icon: '🎫',
    emoji: '🎫',
    frontPath: 'scratch-card',
    adminPath: 'scratch-card',
    boardComponent: 'ScratchCardPlayBoard',
    defaultRouteName: 'TenantScratchCardGame',
    defaultRequireSerialCode: false,
    supportsSerialCode: true,
    supportsShareBonus: true,
    supportsSourceTracking: true,
    supportsPrizeWeight: true,
    supportsStock: true,
    supportsRewardRecord: true,
    status: 'PLANNED',
    theme: {
      start: '#f9a8d4',
      middle: '#c084fc',
      end: '#7c3aed'
    },
    defaultConfig: {
      scratchThreshold: 65,
      brushSize: 28,
      maskStyle: 'silver'
    }
  },

  [GAME_TYPES.FLIP_CARD]: {
    gameType: GAME_TYPES.FLIP_CARD,
    label: '翻牌抽獎',
    shortLabel: '翻牌',
    description: '玩家選擇卡牌翻開結果，適合卡牌式互動活動。',
    icon: '🃏',
    emoji: '🃏',
    frontPath: 'flip-card',
    adminPath: 'flip-card',
    boardComponent: 'FlipCardPlayBoard',
    defaultRouteName: 'TenantFlipCardGame',
    defaultRequireSerialCode: false,
    supportsSerialCode: true,
    supportsShareBonus: true,
    supportsSourceTracking: true,
    supportsPrizeWeight: true,
    supportsStock: true,
    supportsRewardRecord: true,
    status: 'PLANNED',
    theme: {
      start: '#818cf8',
      middle: '#6366f1',
      end: '#312e81'
    },
    defaultConfig: {
      cardCount: 9,
      allowMultipleFlip: false,
      animationType: 'flip-3d'
    }
  },

  [GAME_TYPES.RED_PACKET]: {
    gameType: GAME_TYPES.RED_PACKET,
    label: '紅包雨',
    shortLabel: '紅包',
    description: '玩家點擊掉落紅包取得抽獎結果，適合節慶促銷活動。',
    icon: '🧧',
    emoji: '🧧',
    frontPath: 'red-packet',
    adminPath: 'red-packet',
    boardComponent: 'RedPacketPlayBoard',
    defaultRouteName: 'TenantRedPacketGame',
    defaultRequireSerialCode: false,
    supportsSerialCode: true,
    supportsShareBonus: true,
    supportsSourceTracking: true,
    supportsPrizeWeight: true,
    supportsStock: true,
    supportsRewardRecord: true,
    status: 'PLANNED',
    theme: {
      start: '#f87171',
      middle: '#ef4444',
      end: '#991b1b'
    },
    defaultConfig: {
      durationSeconds: 15,
      packetCount: 24,
      maxClicks: 5
    }
  },

  [GAME_TYPES.SLOT_MACHINE]: {
    gameType: GAME_TYPES.SLOT_MACHINE,
    label: '拉霸機',
    shortLabel: '拉霸',
    description: '玩家啟動拉霸轉軸，停止後顯示抽獎結果。',
    icon: '🎰',
    emoji: '🎰',
    frontPath: 'slot-machine',
    adminPath: 'slot-machine',
    boardComponent: 'SlotMachinePlayBoard',
    defaultRouteName: 'TenantSlotMachineGame',
    defaultRequireSerialCode: false,
    supportsSerialCode: true,
    supportsShareBonus: true,
    supportsSourceTracking: true,
    supportsPrizeWeight: true,
    supportsStock: true,
    supportsRewardRecord: true,
    status: 'PLANNED',
    theme: {
      start: '#fbbf24',
      middle: '#ef4444',
      end: '#7f1d1d'
    },
    defaultConfig: {
      reelCount: 3,
      spinDuration: 3000,
      symbolSet: 'classic'
    }
  }
}

export const GAME_STATUS_LABELS = {
  STABLE: '穩定可用',
  BETA: '測試中',
  PLANNED: '規劃中',
  DISABLED: '停用'
}

export const GAME_STATUS_BADGE_CLASSES = {
  STABLE: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  BETA: 'bg-blue-50 text-blue-700 border-blue-100',
  PLANNED: 'bg-amber-50 text-amber-700 border-amber-100',
  DISABLED: 'bg-slate-100 text-slate-600 border-slate-200'
}

export const getGameDefinition = (gameType) => {
  const normalizedType = String(gameType || '').trim().toUpperCase()

  return GAME_REGISTRY[normalizedType] || null
}

export const getGameDefinitionOrFallback = (gameType) => {
  return getGameDefinition(gameType) || GAME_REGISTRY[GAME_TYPES.GOLDEN_EGG]
}

export const getGameLabel = (gameType) => {
  return getGameDefinition(gameType)?.label || String(gameType || '未知遊戲')
}

export const getGameShortLabel = (gameType) => {
  return getGameDefinition(gameType)?.shortLabel || getGameLabel(gameType)
}

export const getGameIcon = (gameType) => {
  return getGameDefinition(gameType)?.icon || '🎮'
}

export const getGameFrontPath = (gameType) => {
  return getGameDefinition(gameType)?.frontPath || ''
}

export const getGameAdminPath = (gameType) => {
  return getGameDefinition(gameType)?.adminPath || ''
}

export const getGameDefaultConfig = (gameType) => {
  const definition = getGameDefinition(gameType)

  return {
    ...(definition?.defaultConfig || {})
  }
}

export const getGameTheme = (gameType) => {
  const definition = getGameDefinition(gameType)

  return {
    ...(definition?.theme || {
      start: '#ffb237',
      middle: '#ff7a18',
      end: '#ee3f24'
    })
  }
}

export const isGameStable = (gameType) => {
  return getGameDefinition(gameType)?.status === 'STABLE'
}

export const isGamePlanned = (gameType) => {
  return getGameDefinition(gameType)?.status === 'PLANNED'
}

export const gameSupportsFeature = (gameType, featureName) => {
  const definition = getGameDefinition(gameType)
  if (!definition) return false

  return Boolean(definition[featureName])
}

export const listGameDefinitions = (options = {}) => {
  const {
    includePlanned = true,
    includeDisabled = false
  } = options

  return Object.values(GAME_REGISTRY).filter((definition) => {
    if (!includeDisabled && definition.status === 'DISABLED') return false
    if (!includePlanned && definition.status === 'PLANNED') return false

    return true
  })
}

export const listStableGameDefinitions = () => {
  return listGameDefinitions({
    includePlanned: false,
    includeDisabled: false
  })
}

export const listPlayableGameDefinitions = () => {
  return Object.values(GAME_REGISTRY).filter((definition) => {
    return ['STABLE', 'BETA'].includes(definition.status)
  })
}

export const buildTenantGamePath = (tenantSlug, gameType, query = {}) => {
  const definition = getGameDefinition(gameType)
  const slug = String(tenantSlug || '').trim()

  if (!definition || !slug) return ''

  const params = new URLSearchParams()

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  })

  const queryString = params.toString()

  return `/play/${slug}/${definition.frontPath}${queryString ? `?${queryString}` : ''}`
}

export const normalizeGameType = (value = '') => {
  const normalized = String(value || '').trim().toUpperCase()

  if (normalized === 'PREMIUM_GRID') return GAME_TYPES.GRID
  if (normalized === 'GRID_LOTTERY') return GAME_TYPES.GRID
  if (normalized === 'GOLDENEGG') return GAME_TYPES.GOLDEN_EGG
  if (normalized === 'EGG') return GAME_TYPES.GOLDEN_EGG
  if (normalized === 'LUCKY_WHEEL') return GAME_TYPES.WHEEL
  if (normalized === 'SCRATCH') return GAME_TYPES.SCRATCH_CARD
  if (normalized === 'FLIP') return GAME_TYPES.FLIP_CARD

  return normalized
}
