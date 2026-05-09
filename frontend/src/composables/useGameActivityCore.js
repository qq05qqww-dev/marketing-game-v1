// Multi Game Platform V2.3
// 第 59 批：useGameActivityCore.js 共用活動核心 composable 版
//
// 放置位置：
// frontend/src/composables/useGameActivityCore.js
//
// 目的：
// 1. 統一處理多遊戲前台活動核心資料。
// 2. 以砸金蛋成熟活動流程為基礎，整理給所有遊戲共用。
// 3. 後續九宮格、金蛋、輪盤、刮刮卡可以逐步改接這支 composable。
// 4. 這一批只新增檔案，不接入任何現有頁面。

import { computed, reactive, ref } from 'vue'
import {
  getGameDefinition,
  getGameDefinitionOrFallback,
  getGameIcon,
  getGameLabel,
  getGameTheme,
  normalizeGameType,
  buildTenantGamePath
} from '../games/gameRegistry'

export const normalizeCampaignStatus = (value = '') => {
  return String(value || '').trim().toUpperCase()
}

export const normalizeTrafficSource = (value = '') => {
  const source = String(value || '').trim().toLowerCase()

  if (source === 'fb') return 'facebook'
  if (source === 'ig') return 'instagram'
  if (['line', 'facebook', 'instagram', 'direct'].includes(source)) return source

  return source || 'direct'
}

export const getTrafficSourceLabel = (source = '') => {
  const value = normalizeTrafficSource(source)

  const labels = {
    line: 'LINE',
    facebook: 'Facebook',
    instagram: 'Instagram',
    direct: '直接進入'
  }

  return labels[value] || value || '直接進入'
}

export const formatCampaignDateTime = (value) => {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const getCampaignStartTime = (campaignData = {}) => {
  return campaignData?.startAt
    || campaignData?.startTime
    || campaignData?.startedAt
    || campaignData?.publishedAt
    || ''
}

export const getCampaignEndTime = (campaignData = {}) => {
  return campaignData?.endAt
    || campaignData?.endTime
    || campaignData?.endedAt
    || campaignData?.expiredAt
    || ''
}

export const getCampaignTitle = (campaignData = {}) => {
  return campaignData?.title
    || campaignData?.name
    || campaignData?.campaignTitle
    || '互動抽獎活動'
}

export const getCampaignDescription = (campaignData = {}) => {
  return campaignData?.description
    || campaignData?.summary
    || campaignData?.intro
    || '歡迎參加本次互動抽獎活動。'
}

export const getTenantName = (tenantData = {}, campaignData = {}) => {
  return tenantData?.name
    || tenantData?.tenantName
    || campaignData?.tenant?.name
    || campaignData?.tenantName
    || '活動商家'
}

export const normalizePrize = (item = {}, index = 0) => {
  const title = item.title || item.name || item.shortName || `獎品 ${index + 1}`
  const shortName = item.shortName || item.displayName || item.title || item.name || title
  const icon = item.icon || item.emoji || '🎁'
  const imageUrl = item.imageUrl || item.image || ''
  const quantity = Number(
    item.quantity
      ?? item.remainStock
      ?? item.remainingStock
      ?? item.remainingQuantity
      ?? item.stock
      ?? item.totalStock
      ?? 0
  )
  const weight = Number(
    item.weight
      ?? item.probabilityWeight
      ?? item.probability
      ?? item.chance
      ?? item.rate
      ?? 0
  )

  return {
    ...item,
    id: item.id || `prize_${index}`,
    title,
    name: item.name || title,
    shortName,
    icon,
    emoji: icon,
    imageUrl,
    quantity,
    remainStock: quantity,
    weight,
    probability: Number(item.probability ?? item.chance ?? weight),
    type: item.type || 'WIN',
    status: item.status || 'ACTIVE',
    sortOrder: Number(item.sortOrder ?? item.displayOrder ?? index + 1)
  }
}

export const normalizePrizeList = (items = []) => {
  return Array.isArray(items)
    ? items.map((item, index) => normalizePrize(item, index))
    : []
}

export const getCampaignStatusInfo = (campaignData = {}) => {
  if (!campaignData) {
    return {
      canPlay: false,
      title: '活動資料不存在',
      label: '無資料',
      buttonText: '尚未開放',
      message: '目前找不到活動資料，請稍後再試。',
      status: 'MISSING'
    }
  }

  const status = normalizeCampaignStatus(campaignData?.status || campaignData?.publishStatus || campaignData?.state)
  const startValue = getCampaignStartTime(campaignData)
  const endValue = getCampaignEndTime(campaignData)
  const startDate = startValue ? new Date(startValue) : null
  const endDate = endValue ? new Date(endValue) : null
  const now = new Date()

  if (['DRAFT', 'INACTIVE', 'DISABLED', 'ARCHIVED', 'PAUSED', 'UNPUBLISHED'].includes(status)) {
    return {
      canPlay: false,
      title: '活動尚未上架',
      label: '尚未開放',
      buttonText: '尚未開放',
      message: '目前活動尚未上架，請等待商家正式開放後再參加。',
      status
    }
  }

  if (startDate && !Number.isNaN(startDate.getTime()) && now < startDate) {
    return {
      canPlay: false,
      title: '活動尚未開始',
      label: '未開始',
      buttonText: '尚未開始',
      message: `活動開始時間：${formatCampaignDateTime(startValue)}，請於開始後再回來參加。`,
      status: status || 'NOT_STARTED'
    }
  }

  if (endDate && !Number.isNaN(endDate.getTime()) && now > endDate) {
    return {
      canPlay: false,
      title: '活動已結束',
      label: '已結束',
      buttonText: '已結束',
      message: `活動已於 ${formatCampaignDateTime(endValue)} 結束，感謝你的參與。`,
      status: status || 'ENDED'
    }
  }

  if (['CLOSED', 'ENDED', 'EXPIRED'].includes(status)) {
    return {
      canPlay: false,
      title: '活動已結束',
      label: '已結束',
      buttonText: '已結束',
      message: '目前活動已結束，感謝你的參與。',
      status
    }
  }

  return {
    canPlay: true,
    title: '活動進行中',
    label: status === 'ACTIVE' ? '進行中' : '可參加',
    buttonText: '',
    message: '活動已開放，請依照活動規則開始抽獎。',
    status: status || 'ACTIVE'
  }
}

export const buildActivityCoreState = () => {
  return reactive({
    tenantSlug: '',
    tenantName: '',
    gameType: '',
    campaignId: null,
    campaign: null,
    gameConfig: null,
    prizes: [],
    source: 'direct',
    loadedAt: '',
    error: '',
    loading: false
  })
}

export const useGameActivityCore = (options = {}) => {
  const state = buildActivityCoreState()

  const {
    defaultGameType = '',
    defaultSource = 'direct'
  } = options

  const initialized = ref(false)

  state.gameType = normalizeGameType(defaultGameType)
  state.source = normalizeTrafficSource(defaultSource)

  const gameDefinition = computed(() => {
    return getGameDefinitionOrFallback(state.gameType)
  })

  const gameLabel = computed(() => {
    return getGameLabel(state.gameType)
  })

  const gameIcon = computed(() => {
    return getGameIcon(state.gameType)
  })

  const gameTheme = computed(() => {
    return getGameTheme(state.gameType)
  })

  const campaignTitle = computed(() => {
    return getCampaignTitle(state.campaign || {})
  })

  const campaignDescription = computed(() => {
    return getCampaignDescription(state.campaign || {})
  })

  const statusInfo = computed(() => {
    return getCampaignStatusInfo(state.campaign)
  })

  const canPlay = computed(() => {
    return Boolean(statusInfo.value.canPlay && !state.loading && !state.error)
  })

  const normalizedPrizes = computed(() => {
    return normalizePrizeList(state.prizes)
  })

  const availablePrizes = computed(() => {
    return normalizedPrizes.value.filter((item) => {
      const status = String(item.status || 'ACTIVE').toUpperCase()
      return Number(item.quantity || 0) > 0 && !['DISABLED', 'INACTIVE', 'ARCHIVED'].includes(status)
    })
  })

  const availablePrizeCount = computed(() => {
    return availablePrizes.value.length
  })

  const totalPrizeStock = computed(() => {
    return normalizedPrizes.value.reduce((sum, item) => {
      return sum + Number(item.quantity || 0)
    }, 0)
  })

  const totalPrizeWeight = computed(() => {
    return normalizedPrizes.value.reduce((sum, item) => {
      return sum + Number(item.weight || 0)
    }, 0)
  })

  const trafficSourceLabel = computed(() => {
    return getTrafficSourceLabel(state.source)
  })

  const tenantGamePath = computed(() => {
    return buildTenantGamePath(state.tenantSlug, state.gameType, {
      from: state.source
    })
  })

  const activitySummary = computed(() => {
    return {
      tenantSlug: state.tenantSlug,
      tenantName: state.tenantName,
      gameType: state.gameType,
      gameLabel: gameLabel.value,
      gameIcon: gameIcon.value,
      campaignId: state.campaignId,
      campaignTitle: campaignTitle.value,
      campaignDescription: campaignDescription.value,
      statusInfo: statusInfo.value,
      availablePrizeCount: availablePrizeCount.value,
      totalPrizeStock: totalPrizeStock.value,
      totalPrizeWeight: totalPrizeWeight.value,
      source: state.source,
      sourceLabel: trafficSourceLabel.value,
      loadedAt: state.loadedAt
    }
  })

  const setLoading = (value) => {
    state.loading = Boolean(value)
  }

  const setError = (message = '') => {
    state.error = String(message || '')
  }

  const clearError = () => {
    state.error = ''
  }

  const setTrafficSource = (source = '') => {
    state.source = normalizeTrafficSource(source)
  }

  const setGameType = (gameType = '') => {
    state.gameType = normalizeGameType(gameType)
  }

  const setTenant = (tenant = {}) => {
    state.tenantSlug = tenant?.slug || tenant?.tenantSlug || state.tenantSlug
    state.tenantName = tenant?.name || tenant?.tenantName || state.tenantName
  }

  const setCampaign = (campaignData = {}) => {
    state.campaign = campaignData || null
    state.campaignId = campaignData?.id || campaignData?.campaignId || state.campaignId

    const campaignGameType = normalizeGameType(
      campaignData?.gameType
        || campaignData?.type
        || campaignData?.campaignType
        || campaignData?.gameKey
        || state.gameType
    )

    if (campaignGameType) {
      state.gameType = campaignGameType
    }

    if (!state.tenantName) {
      state.tenantName = getTenantName({}, campaignData)
    }

    if (Array.isArray(campaignData?.prizes)) {
      state.prizes = campaignData.prizes
    }

    state.loadedAt = new Date().toLocaleString('zh-TW', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })

    initialized.value = true
  }

  const setGameConfig = (config = {}) => {
    state.gameConfig = config || null
  }

  const setPrizes = (items = []) => {
    state.prizes = Array.isArray(items) ? items : []
  }

  const resetActivityCore = () => {
    state.tenantSlug = ''
    state.tenantName = ''
    state.gameType = normalizeGameType(defaultGameType)
    state.campaignId = null
    state.campaign = null
    state.gameConfig = null
    state.prizes = []
    state.source = normalizeTrafficSource(defaultSource)
    state.loadedAt = ''
    state.error = ''
    state.loading = false
    initialized.value = false
  }

  return {
    state,
    initialized,

    gameDefinition,
    gameLabel,
    gameIcon,
    gameTheme,
    campaignTitle,
    campaignDescription,
    statusInfo,
    canPlay,
    normalizedPrizes,
    availablePrizes,
    availablePrizeCount,
    totalPrizeStock,
    totalPrizeWeight,
    trafficSourceLabel,
    tenantGamePath,
    activitySummary,

    setLoading,
    setError,
    clearError,
    setTrafficSource,
    setGameType,
    setTenant,
    setCampaign,
    setGameConfig,
    setPrizes,
    resetActivityCore
  }
}
