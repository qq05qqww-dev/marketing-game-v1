<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseBadge from '../../components/common/BaseBadge.vue'
import BaseEmptyState from '../../components/common/BaseEmptyState.vue'
import BaseSearchInput from '../../components/common/BaseSearchInput.vue'
import BaseModal from '../../components/common/BaseModal.vue'
import { useAdminGameSettings } from '../../composables/useAdminGameSettings'

const router = useRouter()

const {
  gameSettings,
  getGameSettingSummary,
  resetGameSettings,
  addGameSetting,
  updateGameSetting,
  fixAllGameRoutes,
  getRawGameSettingById
} = useAdminGameSettings()

const keyword = ref('')
const activeType = ref('all')
const activeStatus = ref('all')
const activeRouteStatus = ref('all')
const activeRouteTestStatus = ref('all')
const activeTestGameId = ref('')
const showAddGameModal = ref(false)
const savedMessage = ref('')
const routeFixLogs = ref([])
const routeTestMap = ref({})
const reportExportLogs = ref([])
const showReportPreview = ref(false)
const reportMeta = reactive({
  platformName: 'Multi Game Platform',
  reportVersion: 'V2.2 Stable',
  author: '系統管理員',
  note: '本報表由後台遊戲設定管理頁依目前篩選條件自動產生。'
})

const reportColumns = reactive({
  route: true,
  routeHealth: true,
  testStatus: true,
  prizeCount: true,
  weight: true,
  quantity: true
})

const activeReportLayout = ref('management')

const reportLayoutOptions = [
  {
    label: '完整管理版',
    value: 'management',
    icon: '🛠️',
    description: '顯示路徑、網址健康、測試狀態、獎項、權重與庫存，適合內部管理檢查。',
    buttonClass: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
  },
  {
    label: '簡潔交付版',
    value: 'simple',
    icon: '📄',
    description: '保留基本資訊與檢查狀態，隱藏較技術性的權重與庫存欄位。',
    buttonClass: 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
  },
  {
    label: '測試檢查版',
    value: 'audit',
    icon: '✅',
    description: '聚焦前台路徑、網址健康與測試狀態，適合逐項驗收。',
    buttonClass: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
  }
]

const FILTER_STORAGE_KEY = 'v22_admin_game_settings_filters'
const REPORT_EXPORT_LOG_STORAGE_KEY = 'v22_admin_game_settings_report_export_logs'
const REPORT_EXPORT_LOG_LIMIT = 10

const addGameForm = reactive({
  templateId: 'premium-grid',
  id: '',
  name: '',
  description: '',
  icon: '🎮',
  route: '',
  type: 'lottery',
  status: 'enabled',
  playLimit: 1,
  probabilityMode: 'weight',
  requiredInviteCount: 0
})

const templateOptions = [
  {
    id: 'premium-grid',
    name: '精緻九宮格模板',
    description: '使用精緻九宮格前台頁面，支援手機、平板與電腦相容版',
    icon: '✨',
    route: '/games/premium-grid',
    type: 'premium',
    playLimit: 3,
    probabilityMode: 'weight'
  },
  {
    id: 'grid-lottery',
    name: '九宮格模板',
    description: '使用九宮格抽獎前台頁面',
    icon: '🎁',
    route: '/games/grid-lottery',
    type: 'lottery',
    playLimit: 1,
    probabilityMode: 'weight'
  },
  {
    id: 'scratch-card',
    name: '精緻刮刮卡模板',
    description: '使用精緻刮刮卡前台頁面，正式路徑 /games/scratch-card',
    icon: '🎫',
    route: '/games/scratch-card',
    type: 'lottery',
    playLimit: 3,
    probabilityMode: 'weight',
    badgeText: 'RWD 精緻版'
  },
  {
    id: 'wheel',
    name: '精緻轉盤模板',
    description: '使用精緻轉盤前台頁面，正式路徑 /games/wheel',
    icon: '🎡',
    route: '/games/wheel',
    type: 'lottery',
    playLimit: 3,
    probabilityMode: 'weight',
    badgeText: 'RWD 精緻版'
  },
  {
    id: 'flip-card',
    name: '翻牌遊戲模板',
    description: '使用翻牌抽獎前台頁面',
    icon: '🃏'
  },
  {
    id: 'egg-smash',
    name: '敲金蛋模板',
    description: '使用敲金蛋前台頁面',
    icon: '🥚'
  },
  {
    id: 'slot-machine',
    name: '拉霸機模板',
    description: '使用拉霸機前台頁面',
    icon: '🎰'
  },
  {
    id: 'ring-toss',
    name: '套圈圈模板',
    description: '使用套圈圈前台頁面',
    icon: '⭕'
  },
  {
    id: 'claw-machine',
    name: '夾娃娃模板',
    description: '使用夾娃娃前台頁面',
    icon: '🧸'
  },
  {
    id: 'referral-task',
    name: '推薦任務模板',
    description: '使用推薦任務前台頁面',
    icon: '🤝'
  }
]

const typeTabs = [
  {
    label: '全部',
    value: 'all'
  },
  {
    label: '抽獎遊戲',
    value: 'lottery'
  },
  {
    label: '技巧遊戲',
    value: 'skill'
  },
  {
    label: '任務活動',
    value: 'mission'
  }
]

const statusTabs = [
  {
    label: '全部狀態',
    value: 'all'
  },
  {
    label: '已啟用',
    value: 'enabled'
  },
  {
    label: '未啟用',
    value: 'disabled'
  }
]

const routeTestStatusTabs = [
  {
    label: '全部測試',
    value: 'all'
  },
  {
    label: '尚未測試',
    value: 'untested'
  },
  {
    label: '已開啟測試',
    value: 'opened'
  },
  {
    label: '修正後開啟',
    value: 'warning'
  },
  {
    label: '網址異常',
    value: 'error'
  }
]

const routeStatusTabs = [
  {
    label: '全部網址',
    value: 'all'
  },
  {
    label: '網址正常',
    value: 'ok'
  },
  {
    label: '網址異常',
    value: 'abnormal'
  },
  {
    label: '少了 /',
    value: 'missingSlash'
  },
  {
    label: '後台網址',
    value: 'adminRoute'
  },
  {
    label: '非前台路徑',
    value: 'notGameRoute'
  }
]

const filterPresetCards = [
  {
    title: '全部遊戲',
    description: '清除類型、狀態、網址與測試篩選',
    icon: '🎮',
    preset: 'all',
    buttonClass: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
  },
  {
    title: '已啟用抽獎',
    description: '只看已啟用的抽獎遊戲',
    icon: '🎁',
    preset: 'enabledLottery',
    buttonClass: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
  },
  {
    title: '尚未測試',
    description: '只看還沒用新分頁測試的遊戲',
    icon: '🕘',
    preset: 'untested',
    buttonClass: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
  },
  {
    title: '正常但未測',
    description: '網址正常，但是前台還沒測試',
    icon: '✅',
    preset: 'normalUntested',
    buttonClass: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
  },
  {
    title: '網址異常',
    description: '只看需要修正的前台網址',
    icon: '🚫',
    preset: 'abnormalRoute',
    buttonClass: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
  },
  {
    title: '已啟用未測',
    description: '只看已啟用、網址正常、尚未測試',
    icon: '🚀',
    preset: 'enabledUntested',
    buttonClass: 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100'
  }
]

const typeOptions = [
  {
    label: '抽獎遊戲',
    value: 'lottery'
  },
  {
    label: '技巧遊戲',
    value: 'skill'
  },
  {
    label: '任務活動',
    value: 'mission'
  }
]

const statusOptions = [
  {
    label: '已啟用',
    value: 'enabled'
  },
  {
    label: '未啟用',
    value: 'disabled'
  }
]

const probabilityModeOptions = [
  {
    label: '權重機率',
    value: 'weight'
  },
  {
    label: '百分比機率',
    value: 'percent'
  },
  {
    label: '固定結果',
    value: 'fixed'
  }
]

const typeTextMap = {
  lottery: '抽獎遊戲',
  skill: '技巧遊戲',
  mission: '任務活動'
}

const typeBadgeMap = {
  lottery: 'primary',
  skill: 'warning',
  mission: 'info'
}

const statusTextMap = {
  enabled: '已啟用',
  disabled: '未啟用'
}

const statusBadgeMap = {
  enabled: 'success',
  disabled: 'danger'
}

const probabilityModeTextMap = {
  weight: '權重機率',
  percent: '百分比機率',
  fixed: '固定結果'
}

const createSlug = (value) => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
}

const normalizeRoute = (route = '') => {
  const value = String(route || '').trim()

  if (!value) return ''

  if (value.startsWith('/admin/games/')) {
    return value.replace(/^\/admin/, '')
  }

  if (value.startsWith('admin/games/')) {
    return `/${value.replace(/^admin\//, '')}`
  }

  if (value.startsWith('games/')) {
    return `/${value}`
  }

  if (!value.startsWith('/')) {
    return `/${value}`
  }

  return value
}

const templateRouteMap = {
  'premium-grid': '/games/premium-grid',
  'grid-lottery': '/games/grid-lottery',
  'scratch-card': '/games/scratch-card',
  wheel: '/games/wheel',
  'flip-card': '/games/flip-card',
  'egg-smash': '/games/egg-smash',
  'slot-machine': '/games/slot-machine',
  'ring-toss': '/games/ring-toss',
  'claw-machine': '/games/claw-machine',
  'referral-task': '/games/referral-task'
}

const getGameLogoText = (game) => {
  return String(game?.icon || '🎮').trim() || '🎮'
}

const getGameWebsiteHint = (game) => {
  const route = getPlayerPreviewRoute(game)

  if (!route) return '尚未設定玩家版網址'

  return route
}

const getPlayerPreviewRoute = (game) => {
  return normalizeRoute(game?.route || '/games')
}

const getAdminPreviewRoute = (game) => {
  const route = getPlayerPreviewRoute(game)

  if (!route) return '/games'

  const separator = route.includes('?') ? '&' : '?'

  return `${route}${separator}mode=admin`
}

const getPreviewRouteStatus = (route) => {
  const value = String(route || '').trim()

  if (!value) {
    return {
      label: '尚未設定',
      className: 'bg-slate-100 text-slate-500'
    }
  }

  return {
    label: '可測試',
    className: 'bg-emerald-100 text-emerald-700'
  }
}

const getAllPreviewStatusPayload = () => {
  const items = gameSettings.value.map((game) => getPreviewStatusPayload(game))

  return {
    type: 'all_game_preview_route_status',
    exportedAt: new Date().toISOString(),
    total: items.length,
    items
  }
}

const downloadAllPreviewStatusJson = () => {
  const payload = getAllPreviewStatusPayload()

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8'
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `all-game-preview-route-status-${Date.now()}.json`
  link.click()

  URL.revokeObjectURL(url)
  showToast('全部玩家版 / 管理版狀態 JSON 已下載')
}

const getPreviewStatusPayload = (game) => {
  const playerRoute = getPlayerPreviewRoute(game)
  const adminRoute = getAdminPreviewRoute(game)

  return {
    type: 'game_preview_route_status',
    exportedAt: new Date().toISOString(),
    gameName: game?.name || '未命名遊戲',
    gameId: game?.id || '',
    gameIcon: game?.icon || '🎮',
    playerRoute,
    playerStatus: getPreviewRouteStatus(playerRoute).label,
    adminRoute,
    adminStatus: getPreviewRouteStatus(adminRoute).label
  }
}

const downloadPreviewStatusJson = (game) => {
  const payload = getPreviewStatusPayload(game)
  const safeName = String(payload.gameId || payload.gameName || 'game-preview-status')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[\\/:*?"<>|]/g, '')
    .toLowerCase()

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8'
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `${safeName || 'game-preview-status'}-preview-route-status-${Date.now()}.json`
  link.click()

  URL.revokeObjectURL(url)
  showToast('玩家版 / 管理版狀態 JSON 已下載')
}

const copyPreviewStatus = async (game) => {
  const playerRoute = getPlayerPreviewRoute(game)
  const adminRoute = getAdminPreviewRoute(game)
  const playerStatus = getPreviewRouteStatus(playerRoute).label
  const adminStatus = getPreviewRouteStatus(adminRoute).label

  const payload = [
    `遊戲名稱：${game?.name || '未命名遊戲'}`,
    `遊戲 ID：${game?.id || '未設定'}`,
    `玩家版路徑：${playerRoute}`,
    `玩家版狀態：${playerStatus}`,
    `管理版路徑：${adminRoute}`,
    `管理版狀態：${adminStatus}`
  ].join('\n')

  try {
    await navigator.clipboard.writeText(payload)
    showToast('玩家版 / 管理版狀態已複製')
  } catch (error) {
    console.error('複製玩家版 / 管理版狀態失敗：', error)
    window.prompt('瀏覽器不支援自動複製，請手動複製：', payload)
  }
}

const copyPreviewRoute = async (route, label = '預覽路徑') => {
  try {
    await navigator.clipboard.writeText(route)
    showToast(`${label}已複製`)
  } catch (error) {
    console.error(`${label}複製失敗：`, error)
    window.prompt('瀏覽器不支援自動複製，請手動複製：', route)
  }
}

const toAbsolutePreviewUrl = (route) => {
  const value = String(route || '').trim()

  if (!value) return window.location.origin

  if (/^https?:\/\//i.test(value)) return value

  const normalizedPath = value.startsWith('/') ? value : `/${value}`

  return `${window.location.origin}${normalizedPath}`
}

const openPreviewRouteSafely = (route, label = '預覽頁面') => {
  const absoluteUrl = toAbsolutePreviewUrl(route)

  try {
    const link = document.createElement('a')

    link.href = absoluteUrl
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showToast(`正在開啟${label}：${absoluteUrl}`)
  } catch (error) {
    console.error(`${label}開啟失敗：`, error)
    window.prompt(`${label}開啟失敗，請手動複製網址：`, absoluteUrl)
  }
}

const openPlayerPreview = (game) => {
  const route = getPlayerPreviewRoute(game)

  openPreviewRouteSafely(route, '玩家版')
}

const openAdminPreview = (game) => {
  const route = getAdminPreviewRoute(game)

  openPreviewRouteSafely(route, '管理版')
}

const getTemplateBaseRoute = () => {
  const mappedRoute = templateRouteMap[addGameForm.templateId]

  if (mappedRoute) return mappedRoute

  const template = getRawGameSettingById(addGameForm.templateId)

  if (!template?.route) return `/games/${addGameForm.templateId}`

  return normalizeRoute(template.route).split('?')[0]
}

const syncTemplateToForm = () => {
  const template =
    getRawGameSettingById(addGameForm.templateId) ||
    templateOptions.find((item) => item.id === addGameForm.templateId)

  if (!template) return

  addGameForm.name = `${template.name} 複製版`
  addGameForm.description = template.description || ''
  addGameForm.icon = template.icon || '🎮'
  addGameForm.type = template.type || 'lottery'
  addGameForm.status = 'enabled'
  addGameForm.playLimit = Number(template.playLimit || 1)
  addGameForm.probabilityMode = template.probabilityMode || 'weight'
  addGameForm.requiredInviteCount = Number(template.requiredInviteCount || 0)

  const slug = createSlug(addGameForm.id)

  addGameForm.route = slug
    ? `${getTemplateBaseRoute()}?gameId=${slug}`
    : getTemplateBaseRoute()
}

watch(
  () => addGameForm.templateId,
  () => {
    syncTemplateToForm()
  }
)

watch(
  () => addGameForm.id,
  (value) => {
    const slug = createSlug(value)

    addGameForm.route = slug
      ? `${getTemplateBaseRoute()}?gameId=${slug}`
      : getTemplateBaseRoute()
  }
)

watch(
  [
    keyword,
    activeType,
    activeStatus,
    activeRouteStatus,
    activeRouteTestStatus
  ],
  () => {
    saveFiltersToStorage()
  }
)

watch(
  reportExportLogs,
  () => {
    saveReportExportLogsToStorage()
  },
  {
    deep: true
  }
)

const summary = computed(() => {
  return getGameSettingSummary()
})

const checkFrontendRoute = (game) => {
  const route = String(game?.route || '').trim()

  if (!route) {
    return {
      ok: false,
      text: '網址空白',
      type: 'danger',
      message: '尚未設定前台路徑',
      suggestion: '/games/your-game-path'
    }
  }

  if (route.startsWith('/admin/games/')) {
    return {
      ok: false,
      text: '網址異常',
      type: 'danger',
      message: '目前路徑會跑到後台頁面，玩家版預覽會 404',
      suggestion: route.replace(/^\/admin/, '')
    }
  }

  if (route.startsWith('admin/games/')) {
    return {
      ok: false,
      text: '網址異常',
      type: 'danger',
      message: '目前路徑少了 /，而且會跑到後台頁面',
      suggestion: `/${route.replace(/^admin\//, '')}`
    }
  }

  if (route.startsWith('games/')) {
    return {
      ok: false,
      text: '少了 /',
      type: 'warning',
      message: '目前路徑少了開頭 /，可能會被接成錯誤網址',
      suggestion: `/${route}`
    }
  }

  if (!route.startsWith('/games/')) {
    return {
      ok: false,
      text: '非前台遊戲路徑',
      type: 'warning',
      message: '建議前台遊戲路徑使用 /games/ 開頭',
      suggestion: route.startsWith('/') ? route : `/${route}`
    }
  }

  return {
    ok: true,
    text: '網址正常',
    type: 'success',
    message: '前台路徑格式正確',
    suggestion: route
  }
}

const getRouteHealthStatus = (game) => {
  const route = String(game?.route || '').trim()
  const checkResult = checkFrontendRoute(game)

  if (checkResult.ok) return 'ok'

  if (!route) return 'abnormal'

  if (route.startsWith('games/')) return 'missingSlash'

  if (route.startsWith('/admin/games/') || route.startsWith('admin/games/')) {
    return 'adminRoute'
  }

  if (!route.startsWith('/games/')) return 'notGameRoute'

  return 'abnormal'
}

const abnormalRouteCount = computed(() => {
  return gameSettings.value.filter((game) => {
    return !checkFrontendRoute(game).ok
  }).length
})

const getRouteTestStatus = (game) => {
  return routeTestMap.value[game.id] || {
    status: 'untested',
    text: '尚未測試',
    type: 'default',
    message: '尚未用新分頁測試玩家版 / 管理版網址',
    testedAt: ''
  }
}

const routeTestSummary = computed(() => {
  const data = {
    total: gameSettings.value.length,
    untested: 0,
    opened: 0,
    warning: 0,
    error: 0
  }

  gameSettings.value.forEach((game) => {
    const status = getRouteTestStatus(game).status

    if (status === 'opened') {
      data.opened += 1
      return
    }

    if (status === 'warning') {
      data.warning += 1
      return
    }

    if (status === 'error') {
      data.error += 1
      return
    }

    data.untested += 1
  })

  return data
})

const filteredGames = computed(() => {
  return gameSettings.value.filter((game) => {
    const routeTestStatus = getRouteTestStatus(game).status
    const routeHealthStatus = getRouteHealthStatus(game)

    const matchKeyword =
      !keyword.value ||
      game.name.includes(keyword.value) ||
      game.description.includes(keyword.value) ||
      game.id.includes(keyword.value) ||
      game.route?.includes(keyword.value) ||
      game.templateId?.includes(keyword.value)

    const matchType =
      activeType.value === 'all' ||
      game.type === activeType.value

    const matchStatus =
      activeStatus.value === 'all' ||
      game.status === activeStatus.value

    const matchRouteStatus =
      activeRouteStatus.value === 'all' ||
      (activeRouteStatus.value === 'abnormal' && routeHealthStatus !== 'ok') ||
      routeHealthStatus === activeRouteStatus.value

    const matchRouteTestStatus =
      activeRouteTestStatus.value === 'all' ||
      routeTestStatus === activeRouteTestStatus.value

    return matchKeyword && matchType && matchStatus && matchRouteStatus && matchRouteTestStatus
  })
})

const filteredGameSummary = computed(() => {
  const total = gameSettings.value.length
  const filtered = filteredGames.value.length
  const hidden = Math.max(0, total - filtered)

  const enabled = filteredGames.value.filter((game) => {
    return game.status === 'enabled'
  }).length

  const disabled = filteredGames.value.filter((game) => {
    return game.status !== 'enabled'
  }).length

  const routeOk = filteredGames.value.filter((game) => {
    return checkFrontendRoute(game).ok
  }).length

  const routeAbnormal = filteredGames.value.filter((game) => {
    return !checkFrontendRoute(game).ok
  }).length

  const untested = filteredGames.value.filter((game) => {
    return getRouteTestStatus(game).status === 'untested'
  }).length

  const tested = filteredGames.value.filter((game) => {
    return getRouteTestStatus(game).status !== 'untested'
  }).length

  return {
    total,
    filtered,
    hidden,
    enabled,
    disabled,
    routeOk,
    routeAbnormal,
    untested,
    tested
  }
})

const statCards = computed(() => {
  return [
    {
      title: '全部遊戲',
      value: summary.value.total,
      description: '目前平台遊戲總數',
      icon: '🎮',
      colorClass: 'from-slate-700 to-slate-500'
    },
    {
      title: '已啟用',
      value: summary.value.enabled,
      description: '目前可在前台遊玩的遊戲',
      icon: '✅',
      colorClass: 'from-emerald-500 to-teal-400'
    },
    {
      title: '抽獎遊戲',
      value: summary.value.lottery,
      description: '九宮格、刮刮卡、輪盤等',
      icon: '🎁',
      colorClass: 'from-blue-500 to-cyan-400'
    },
    {
      title: '網址異常',
      value: abnormalRouteCount.value,
      description: '需要檢查或修正的前台路徑',
      icon: '🔗',
      colorClass: abnormalRouteCount.value > 0
        ? 'from-amber-500 to-orange-400'
        : 'from-emerald-500 to-teal-400'
    }
  ]
})

const routeTestStatCards = computed(() => {
  return [
    {
      title: '全部遊戲',
      value: routeTestSummary.value.total,
      description: '目前所有遊戲設定數量',
      icon: '🎮',
      colorClass: 'from-slate-700 to-slate-500'
    },
    {
      title: '尚未測試',
      value: routeTestSummary.value.untested,
      description: '尚未用新分頁測試玩家版 / 管理版網址',
      icon: '🕘',
      colorClass: 'from-slate-500 to-slate-400'
    },
    {
      title: '已開啟測試',
      value: routeTestSummary.value.opened,
      description: '已用新分頁開啟過前台網址',
      icon: '✅',
      colorClass: 'from-emerald-500 to-teal-400'
    },
    {
      title: '修正後開啟',
      value: routeTestSummary.value.warning,
      description: '原路徑異常，但已用建議路徑開啟',
      icon: '🛠️',
      colorClass: 'from-amber-500 to-orange-400'
    },
    {
      title: '網址異常',
      value: routeTestSummary.value.error,
      description: '找不到可測試的前台網址',
      icon: '🚫',
      colorClass: 'from-rose-500 to-pink-400'
    }
  ]
})

const filteredResultCards = computed(() => {
  return [
    {
      title: '目前顯示',
      value: filteredGameSummary.value.filtered,
      description: `全部 ${filteredGameSummary.value.total} 筆中，目前符合條件的數量`,
      icon: '📌',
      colorClass: 'from-blue-500 to-cyan-400'
    },
    {
      title: '已被篩掉',
      value: filteredGameSummary.value.hidden,
      description: '因搜尋或篩選條件而暫時隱藏的數量',
      icon: '🧹',
      colorClass: 'from-slate-600 to-slate-400'
    },
    {
      title: '已啟用',
      value: filteredGameSummary.value.enabled,
      description: '目前結果中，前台可遊玩的遊戲',
      icon: '✅',
      colorClass: 'from-emerald-500 to-teal-400'
    },
    {
      title: '網址正常',
      value: filteredGameSummary.value.routeOk,
      description: '目前結果中，前台路徑格式正確的數量',
      icon: '🔗',
      colorClass: 'from-indigo-500 to-blue-400'
    },
    {
      title: '尚未測試',
      value: filteredGameSummary.value.untested,
      description: '目前結果中，尚未用新分頁測試的數量',
      icon: '🕘',
      colorClass: 'from-amber-500 to-orange-400'
    }
  ]
})

const getPrizeCount = (game) => {
  return game.prizes?.length || 0
}

const getTotalPrizeQuantity = (game) => {
  return (game.prizes || []).reduce((sum, prize) => {
    const quantity = Number(prize.quantity || 0)

    return sum + quantity
  }, 0)
}

const getTotalPrizeWeight = (game) => {
  return (game.prizes || []).reduce((sum, prize) => {
    const weight = Number(prize.weight || 0)

    return sum + weight
  }, 0)
}

const getFrontendUrl = (game) => {
  if (!game?.route) return ''

  const origin = window.location.origin
  const route = String(game.route || '').startsWith('/')
    ? game.route
    : `/${game.route}`

  return `${origin}${route}`
}

const downloadTextFile = (filename, content, mimeType) => {
  const blob = new Blob([content], {
    type: mimeType
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 1000)
}

const getExportTimeText = () => {
  const date = new Date()

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')

  return `${year}${month}${day}_${hour}${minute}${second}`
}

const createSafeFilenameText = (value) => {
  return String(value || '')
    .trim()
    .replace(/[\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'report'
}

const suggestedPdfFilename = computed(() => {
  const platformName = createSafeFilenameText(reportMeta.platformName || 'Multi Game Platform')
  const layoutName = createSafeFilenameText(getReportLayoutLabel())

  return `${platformName}_遊戲設定報表_${layoutName}_${getExportTimeText()}.pdf`
})

const saveReportExportLogsToStorage = () => {
  try {
    const payload = reportExportLogs.value.slice(0, REPORT_EXPORT_LOG_LIMIT)

    localStorage.setItem(REPORT_EXPORT_LOG_STORAGE_KEY, JSON.stringify(payload))
  } catch (error) {
    console.error('保存報表匯出紀錄失敗：', error)
  }
}

const loadReportExportLogsFromStorage = () => {
  try {
    const raw = localStorage.getItem(REPORT_EXPORT_LOG_STORAGE_KEY)

    if (!raw) return

    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) return

    reportExportLogs.value = parsed
      .filter((log) => log && typeof log === 'object')
      .map((log) => {
        return {
          id: log.id || `report_export_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          type: log.type || 'PDF',
          filename: log.filename || '未命名報表',
          count: Number(log.count || 0),
          layout: log.layout || '自訂版型',
          createdAt: log.createdAt || new Date().toISOString()
        }
      })
      .slice(0, REPORT_EXPORT_LOG_LIMIT)
  } catch (error) {
    console.error('讀取報表匯出紀錄失敗：', error)
  }
}

const addReportExportHistory = (payload = {}) => {
  reportExportLogs.value.unshift({
    id: `report_export_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: payload.type || 'PDF',
    filename: payload.filename || suggestedPdfFilename.value,
    count: payload.count ?? filteredGames.value.length,
    layout: payload.layout || getReportLayoutLabel(),
    createdAt: new Date().toISOString()
  })

  reportExportLogs.value = reportExportLogs.value.slice(0, REPORT_EXPORT_LOG_LIMIT)
  saveReportExportLogsToStorage()
}

const formatReportExportTime = (value) => {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const clearReportExportLogs = () => {
  const confirmed = window.confirm('確定要清空報表匯出紀錄嗎？這會同步清除 localStorage 保存資料。')

  if (!confirmed) return

  reportExportLogs.value = []
  localStorage.removeItem(REPORT_EXPORT_LOG_STORAGE_KEY)

  savedMessage.value = '已清空報表匯出紀錄，並清除 localStorage 保存資料。'

  setTimeout(() => {
    savedMessage.value = ''
  }, 1800)
}

const exportReportExportLogsJson = () => {
  if (!reportExportLogs.value.length) {
    window.alert('目前沒有可匯出的報表紀錄')
    return
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    version: 'Multi Game Platform V2.2 Stable 第 155 批',
    type: 'admin_game_settings_report_export_history',
    total: reportExportLogs.value.length,
    logs: reportExportLogs.value
  }

  const filename = `admin-game-settings-report-history-${getExportTimeText()}.json`

  downloadTextFile(
    filename,
    JSON.stringify(payload, null, 2),
    'application/json;charset=utf-8'
  )

  savedMessage.value = `已匯出報表匯出紀錄 JSON，共 ${reportExportLogs.value.length} 筆。`

  setTimeout(() => {
    savedMessage.value = ''
  }, 2500)
}

const copySuggestedPdfFilename = async () => {
  try {
    await navigator.clipboard.writeText(suggestedPdfFilename.value)

    savedMessage.value = `已複製 PDF 檔名建議：${suggestedPdfFilename.value}`
  } catch (error) {
    console.error('複製 PDF 檔名失敗：', error)
    window.prompt('瀏覽器不支援自動複製，請手動複製：', suggestedPdfFilename.value)
    savedMessage.value = '已開啟手動複製視窗。'
  }

  setTimeout(() => {
    savedMessage.value = ''
  }, 2500)
}

const escapeCsvValue = (value) => {
  const text = String(value ?? '')

  if (
    text.includes(',') ||
    text.includes('"') ||
    text.includes('\n') ||
    text.includes('\r')
  ) {
    return `"${text.replace(/"/g, '""')}"`
  }

  return text
}

const exportFilteredGamesJson = () => {
  if (!filteredGames.value.length) {
    window.alert('目前沒有可匯出的篩選結果')
    return
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    version: 'Multi Game Platform V2.2 Stable',
    type: 'admin_game_settings_filtered_export',
    summary: {
      total: filteredGameSummary.value.total,
      filtered: filteredGameSummary.value.filtered,
      hidden: filteredGameSummary.value.hidden,
      enabled: filteredGameSummary.value.enabled,
      disabled: filteredGameSummary.value.disabled,
      routeOk: filteredGameSummary.value.routeOk,
      routeAbnormal: filteredGameSummary.value.routeAbnormal,
      tested: filteredGameSummary.value.tested,
      untested: filteredGameSummary.value.untested
    },
    filters: {
      keyword: keyword.value,
      activeType: activeType.value,
      activeStatus: activeStatus.value,
      activeRouteStatus: activeRouteStatus.value,
      activeRouteTestStatus: activeRouteTestStatus.value
    },
    games: filteredGames.value.map((game) => {
      return {
        id: game.id,
        templateId: game.templateId || '',
        name: game.name,
        description: game.description,
        icon: game.icon,
        route: game.route,
        type: game.type,
        status: game.status,
        playLimit: game.playLimit,
        probabilityMode: game.probabilityMode,
        requiredInviteCount: game.requiredInviteCount || 0,
        prizeCount: getPrizeCount(game),
        totalPrizeWeight: getTotalPrizeWeight(game),
        totalPrizeQuantity: getTotalPrizeQuantity(game),
        routeHealth: {
          status: getRouteHealthStatus(game),
          ok: checkFrontendRoute(game).ok,
          text: checkFrontendRoute(game).text,
          message: checkFrontendRoute(game).message,
          suggestion: checkFrontendRoute(game).suggestion
        },
        routeTest: getRouteTestStatus(game),
        prizes: game.prizes || []
      }
    })
  }

  const jsonText = JSON.stringify(payload, null, 2)

  const filename = `admin-game-settings-filtered-${getExportTimeText()}.json`

  downloadTextFile(
    filename,
    jsonText,
    'application/json;charset=utf-8'
  )

  addReportExportHistory({
    type: 'JSON',
    filename,
    count: filteredGames.value.length
  })

  savedMessage.value = `已匯出目前篩選結果 JSON，共 ${filteredGames.value.length} 筆。`

  setTimeout(() => {
    savedMessage.value = ''
  }, 2500)
}

const exportFilteredGamesCsv = () => {
  if (!filteredGames.value.length) {
    window.alert('目前沒有可匯出的篩選結果')
    return
  }

  const headers = [
    '遊戲ID',
    '模板ID',
    '遊戲名稱',
    '說明',
    '圖示',
    '前台路徑',
    '完整前台網址',
    '遊戲類型',
    '啟用狀態',
    '遊玩限制',
    '機率模式',
    '推薦邀請門檻',
    '獎項數量',
    '總權重',
    '總庫存',
    '網址健康狀態',
    '網址是否正常',
    '網址檢查訊息',
    '建議修正路徑',
    '前台測試狀態',
    '前台測試訊息',
    '前台測試時間'
  ]

  const rows = filteredGames.value.map((game) => {
    const routeCheck = checkFrontendRoute(game)
    const routeTest = getRouteTestStatus(game)

    return [
      game.id,
      game.templateId || '',
      game.name,
      game.description,
      game.icon,
      game.route,
      getFrontendUrl(game),
      typeTextMap[game.type] || game.type,
      statusTextMap[game.status] || game.status,
      game.playLimit,
      probabilityModeTextMap[game.probabilityMode] || game.probabilityMode,
      game.requiredInviteCount || 0,
      getPrizeCount(game),
      getTotalPrizeWeight(game),
      getTotalPrizeQuantity(game),
      routeCheck.text,
      routeCheck.ok ? '是' : '否',
      routeCheck.message,
      routeCheck.suggestion,
      routeTest.text,
      routeTest.message,
      routeTest.testedAt || ''
    ]
  })

  const csvLines = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) => {
      return row.map(escapeCsvValue).join(',')
    })
  ]

  const csvText = `\uFEFF${csvLines.join('\r\n')}`

  const filename = `admin-game-settings-filtered-${getExportTimeText()}.csv`

  downloadTextFile(
    filename,
    csvText,
    'text/csv;charset=utf-8'
  )

  addReportExportHistory({
    type: 'CSV',
    filename,
    count: filteredGames.value.length
  })

  savedMessage.value = `已匯出目前篩選結果 CSV，共 ${filteredGames.value.length} 筆。`

  setTimeout(() => {
    savedMessage.value = ''
  }, 2500)
}

const getFilterLabel = (tabs, value) => {
  const target = tabs.find((tab) => tab.value === value)

  return target?.label || value || '全部'
}

const getPrintTimeText = () => {
  const date = new Date()

  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const openReportPreview = () => {
  if (!filteredGames.value.length) {
    window.alert('目前沒有可預覽的篩選結果')
    return
  }

  showReportPreview.value = true

  savedMessage.value = `已產生報表預覽，共 ${filteredGames.value.length} 筆。`

  setTimeout(() => {
    savedMessage.value = ''
  }, 2500)
}

const closeReportPreview = () => {
  showReportPreview.value = false

  savedMessage.value = '已收合報表預覽。'

  setTimeout(() => {
    savedMessage.value = ''
  }, 1800)
}

const showAllReportColumns = () => {
  reportColumns.route = true
  reportColumns.routeHealth = true
  reportColumns.testStatus = true
  reportColumns.prizeCount = true
  reportColumns.weight = true
  reportColumns.quantity = true

  savedMessage.value = '已顯示全部報表欄位。'

  setTimeout(() => {
    savedMessage.value = ''
  }, 1500)
}

const useSimpleReportColumns = () => {
  reportColumns.route = false
  reportColumns.routeHealth = true
  reportColumns.testStatus = true
  reportColumns.prizeCount = true
  reportColumns.weight = false
  reportColumns.quantity = false

  savedMessage.value = '已套用簡潔報表欄位。'

  setTimeout(() => {
    savedMessage.value = ''
  }, 1500)
}

const useManagerReportColumns = () => {
  reportColumns.route = true
  reportColumns.routeHealth = true
  reportColumns.testStatus = true
  reportColumns.prizeCount = true
  reportColumns.weight = true
  reportColumns.quantity = true

  savedMessage.value = '已套用完整管理版欄位。'

  setTimeout(() => {
    savedMessage.value = ''
  }, 1500)
}

const applyReportLayout = (layout) => {
  activeReportLayout.value = layout

  if (layout === 'management') {
    reportColumns.route = true
    reportColumns.routeHealth = true
    reportColumns.testStatus = true
    reportColumns.prizeCount = true
    reportColumns.weight = true
    reportColumns.quantity = true
    savedMessage.value = '已套用報表版型：完整管理版。'
  }

  if (layout === 'simple') {
    reportColumns.route = false
    reportColumns.routeHealth = true
    reportColumns.testStatus = true
    reportColumns.prizeCount = true
    reportColumns.weight = false
    reportColumns.quantity = false
    savedMessage.value = '已套用報表版型：簡潔交付版。'
  }

  if (layout === 'audit') {
    reportColumns.route = true
    reportColumns.routeHealth = true
    reportColumns.testStatus = true
    reportColumns.prizeCount = false
    reportColumns.weight = false
    reportColumns.quantity = false
    savedMessage.value = '已套用報表版型：測試檢查版。'
  }

  setTimeout(() => {
    savedMessage.value = ''
  }, 1800)
}

const getReportLayoutLabel = () => {
  const target = reportLayoutOptions.find((layout) => layout.value === activeReportLayout.value)

  return target?.label || '自訂版型'
}

const printCurrentReportPreview = () => {
  if (!filteredGames.value.length) {
    window.alert('目前沒有可列印的篩選結果')
    return
  }

  if (!showReportPreview.value) {
    openReportPreview()
  }

  addReportExportHistory({
    type: 'PDF',
    filename: suggestedPdfFilename.value,
    count: filteredGames.value.length
  })

  setTimeout(() => {
    window.print()
  }, 300)
}

const copyFrontendUrl = async (game) => {
  const url = getFrontendUrl(game)

  if (!url) {
    window.alert('找不到前台網址')
    return
  }

  try {
    await navigator.clipboard.writeText(url)

    savedMessage.value = `已複製前台網址：${url}`

    setTimeout(() => {
      savedMessage.value = ''
    }, 2500)
  } catch (error) {
    console.error('複製前台網址失敗：', error)

    window.prompt('瀏覽器不支援自動複製，請手動複製：', url)
  }
}

const openFrontendUrlInNewTab = (game) => {
  const checkResult = checkFrontendRoute(game)
  const route = checkResult.ok
    ? game.route
    : checkResult.suggestion

  if (!route) {
    routeTestMap.value[game.id] = {
      status: 'error',
      text: '網址異常',
      type: 'danger',
      message: '找不到可測試的前台網址',
      testedAt: new Date().toISOString()
    }

    window.alert('找不到可測試的前台網址')
    return
  }

  const normalizedRoute = normalizeRoute(route)
  const url = `${window.location.origin}${normalizedRoute}`

  if (!checkResult.ok) {
    routeTestMap.value[game.id] = {
      status: 'warning',
      text: '修正後開啟',
      type: 'warning',
      message: `原路徑異常，已使用建議路徑開啟：${normalizedRoute}`,
      testedAt: new Date().toISOString()
    }
  } else {
    routeTestMap.value[game.id] = {
      status: 'opened',
      text: '已開啟測試',
      type: 'success',
      message: `已用新分頁開啟：${normalizedRoute}`,
      testedAt: new Date().toISOString()
    }
  }

  window.open(url, '_blank', 'noopener,noreferrer')

  savedMessage.value = `已用新分頁開啟：${url}`

  setTimeout(() => {
    savedMessage.value = ''
  }, 2500)
}

const formatRouteTestTime = (value) => {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const clearRouteTestStatus = () => {
  const confirmed = window.confirm('確定要清除本頁全部前台測試狀態嗎？')

  if (!confirmed) return

  routeTestMap.value = {}

  savedMessage.value = '已清除前台測試狀態。'

  setTimeout(() => {
    savedMessage.value = ''
  }, 2500)
}

const showUntestedGames = () => {
  activeRouteTestStatus.value = 'untested'

  savedMessage.value = '已切換為只看尚未測試的遊戲。'

  setTimeout(() => {
    savedMessage.value = ''
  }, 2000)
}

const showAllRouteTestGames = () => {
  activeRouteTestStatus.value = 'all'

  savedMessage.value = '已切換為查看全部測試狀態。'

  setTimeout(() => {
    savedMessage.value = ''
  }, 2000)
}

const showAbnormalRouteGames = () => {
  activeRouteStatus.value = 'abnormal'

  savedMessage.value = '已切換為只看網址異常的遊戲。'

  setTimeout(() => {
    savedMessage.value = ''
  }, 2000)
}

const showNormalRouteGames = () => {
  activeRouteStatus.value = 'ok'

  savedMessage.value = '已切換為只看網址正常的遊戲。'

  setTimeout(() => {
    savedMessage.value = ''
  }, 2000)
}

const showAllRouteHealthGames = () => {
  activeRouteStatus.value = 'all'

  savedMessage.value = '已切換為查看全部網址健康狀態。'

  setTimeout(() => {
    savedMessage.value = ''
  }, 2000)
}

const saveFiltersToStorage = () => {
  const payload = {
    keyword: keyword.value,
    activeType: activeType.value,
    activeStatus: activeStatus.value,
    activeRouteStatus: activeRouteStatus.value,
    activeRouteTestStatus: activeRouteTestStatus.value
  }

  localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(payload))
}

const loadFiltersFromStorage = () => {
  try {
    const raw = localStorage.getItem(FILTER_STORAGE_KEY)

    if (!raw) return

    const parsed = JSON.parse(raw)

    keyword.value = parsed.keyword || ''
    activeType.value = parsed.activeType || 'all'
    activeStatus.value = parsed.activeStatus || 'all'
    activeRouteStatus.value = parsed.activeRouteStatus || 'all'
    activeRouteTestStatus.value = parsed.activeRouteTestStatus || 'all'
  } catch (error) {
    console.error('讀取篩選條件失敗：', error)
  }
}

const resetAllFilters = () => {
  keyword.value = ''
  activeType.value = 'all'
  activeStatus.value = 'all'
  activeRouteStatus.value = 'all'
  activeRouteTestStatus.value = 'all'

  localStorage.removeItem(FILTER_STORAGE_KEY)

  savedMessage.value = '已重置所有篩選條件，並清除已保存的篩選。'

  setTimeout(() => {
    savedMessage.value = ''
  }, 2000)
}

const clearKeywordFilter = () => {
  keyword.value = ''

  savedMessage.value = '已清除關鍵字篩選。'

  setTimeout(() => {
    savedMessage.value = ''
  }, 1500)
}

const clearTypeFilter = () => {
  activeType.value = 'all'

  savedMessage.value = '已清除遊戲類型篩選。'

  setTimeout(() => {
    savedMessage.value = ''
  }, 1500)
}

const clearStatusFilter = () => {
  activeStatus.value = 'all'

  savedMessage.value = '已清除啟用狀態篩選。'

  setTimeout(() => {
    savedMessage.value = ''
  }, 1500)
}

const clearRouteStatusFilter = () => {
  activeRouteStatus.value = 'all'

  savedMessage.value = '已清除網址健康篩選。'

  setTimeout(() => {
    savedMessage.value = ''
  }, 1500)
}

const clearRouteTestStatusFilter = () => {
  activeRouteTestStatus.value = 'all'

  savedMessage.value = '已清除前台測試篩選。'

  setTimeout(() => {
    savedMessage.value = ''
  }, 1500)
}

const applyFilterPreset = (preset) => {
  keyword.value = ''

  if (preset === 'all') {
    activeType.value = 'all'
    activeStatus.value = 'all'
    activeRouteStatus.value = 'all'
    activeRouteTestStatus.value = 'all'
    savedMessage.value = '已套用快速篩選：全部遊戲。'
  }

  if (preset === 'enabledLottery') {
    activeType.value = 'lottery'
    activeStatus.value = 'enabled'
    activeRouteStatus.value = 'all'
    activeRouteTestStatus.value = 'all'
    savedMessage.value = '已套用快速篩選：已啟用抽獎遊戲。'
  }

  if (preset === 'untested') {
    activeType.value = 'all'
    activeStatus.value = 'all'
    activeRouteStatus.value = 'all'
    activeRouteTestStatus.value = 'untested'
    savedMessage.value = '已套用快速篩選：尚未測試遊戲。'
  }

  if (preset === 'normalUntested') {
    activeType.value = 'all'
    activeStatus.value = 'all'
    activeRouteStatus.value = 'ok'
    activeRouteTestStatus.value = 'untested'
    savedMessage.value = '已套用快速篩選：網址正常但尚未測試。'
  }

  if (preset === 'abnormalRoute') {
    activeType.value = 'all'
    activeStatus.value = 'all'
    activeRouteStatus.value = 'abnormal'
    activeRouteTestStatus.value = 'all'
    savedMessage.value = '已套用快速篩選：網址異常遊戲。'
  }

  if (preset === 'enabledUntested') {
    activeType.value = 'all'
    activeStatus.value = 'enabled'
    activeRouteStatus.value = 'ok'
    activeRouteTestStatus.value = 'untested'
    savedMessage.value = '已套用快速篩選：已啟用且尚未測試。'
  }

  setTimeout(() => {
    savedMessage.value = ''
  }, 2000)
}

const addRouteFixLog = (payload = {}) => {
  routeFixLogs.value.unshift({
    id: `route_fix_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    gameId: payload.gameId || '',
    gameName: payload.gameName || '未知遊戲',
    oldRoute: payload.oldRoute || '',
    newRoute: payload.newRoute || '',
    type: payload.type || 'single',
    createdAt: new Date().toISOString()
  })
}

const clearRouteFixLogs = () => {
  const confirmed = window.confirm('確定要清空網址修正紀錄嗎？')

  if (!confirmed) return

  routeFixLogs.value = []

  savedMessage.value = '已清空網址修正紀錄。'

  setTimeout(() => {
    savedMessage.value = ''
  }, 2500)
}

const formatRouteFixTime = (value) => {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const fixFrontendRoute = (game) => {
  const checkResult = checkFrontendRoute(game)

  if (checkResult.ok) {
    savedMessage.value = '這個前台網址已經是正常格式，不需要修正。'

    setTimeout(() => {
      savedMessage.value = ''
    }, 2500)

    return
  }

  const oldRoute = game.route || ''
  const fixedRoute = checkResult.suggestion

  if (!fixedRoute) {
    window.alert('找不到可修正的前台路徑')
    return
  }

  const updatedGame = updateGameSetting(game.id, {
    route: fixedRoute
  })

  if (!updatedGame) {
    window.alert('修正失敗，找不到遊戲設定')
    return
  }

  addRouteFixLog({
    gameId: game.id,
    gameName: game.name,
    oldRoute,
    newRoute: fixedRoute,
    type: 'single'
  })

  savedMessage.value = `已修正「${game.name}」前台網址：${fixedRoute}`

  setTimeout(() => {
    savedMessage.value = ''
  }, 2500)
}

const fixAllFrontendRoutes = () => {
  const abnormalGames = gameSettings.value.filter((game) => {
    return !checkFrontendRoute(game).ok
  })

  if (!abnormalGames.length) {
    savedMessage.value = '目前所有前台網址都是正常格式，不需要批次修正。'

    setTimeout(() => {
      savedMessage.value = ''
    }, 2500)

    return
  }

  const confirmed = window.confirm(`偵測到 ${abnormalGames.length} 個異常前台網址，確定要批次修正嗎？`)

  if (!confirmed) return

  const logs = abnormalGames.map((game) => {
    const checkResult = checkFrontendRoute(game)

    return {
      gameId: game.id,
      gameName: game.name,
      oldRoute: game.route || '',
      newRoute: checkResult.suggestion,
      type: 'batch'
    }
  })

  fixAllGameRoutes()

  logs.forEach((log) => {
    addRouteFixLog(log)
  })

  savedMessage.value = `已批次修正 ${abnormalGames.length} 個前台網址。`

  setTimeout(() => {
    savedMessage.value = ''
  }, 2500)
}

const getTestSteps = (game) => {
  return [
    {
      title: '編輯設定',
      description: '修改遊戲名稱、圖示、說明、遊玩限制',
      icon: '✏️',
      path: `/admin/game-settings/${game.id}/edit`,
      buttonText: '去編輯'
    },
    {
      title: '獎項設定',
      description: '新增、編輯、刪除獎項資料',
      icon: '🎁',
      path: `/admin/game-settings/${game.id}/prizes`,
      buttonText: '去獎項'
    },
    {
      title: '機率設定',
      description: '調整獎項權重與庫存',
      icon: '⚖️',
      path: `/admin/game-settings/${game.id}/probability`,
      buttonText: '去機率'
    },
    {
      title: '玩家版預覽',
      description: '給客人看的正式遊玩畫面，不顯示後台工具',
      icon: '👤',
      path: getPlayerPreviewRoute(game),
      buttonText: '玩家版'
    },
    {
      title: '管理版預覽',
      description: '給後台管理者測試設定用，網址會自動加上 mode=admin',
      icon: '🛠️',
      path: getAdminPreviewRoute(game),
      buttonText: '管理版'
    }
  ]
}

const resetAddGameForm = () => {
  addGameForm.templateId = 'premium-grid'
  addGameForm.id = ''
  addGameForm.name = ''
  addGameForm.description = ''
  addGameForm.icon = '🎮'
  addGameForm.route = ''
  addGameForm.type = 'lottery'
  addGameForm.status = 'enabled'
  addGameForm.playLimit = 1
  addGameForm.probabilityMode = 'weight'
  addGameForm.requiredInviteCount = 0
}

const openAddGameModal = () => {
  resetAddGameForm()
  syncTemplateToForm()
  showAddGameModal.value = true
}

const closeAddGameModal = () => {
  showAddGameModal.value = false
  resetAddGameForm()
}

const saveNewGame = () => {
  if (!addGameForm.id.trim()) {
    window.alert('請輸入遊戲 ID')
    return
  }

  if (!addGameForm.name.trim()) {
    window.alert('請輸入遊戲名稱')
    return
  }

  if (!addGameForm.icon.trim()) {
    window.alert('請輸入遊戲圖示')
    return
  }

  if (!addGameForm.route.trim()) {
    window.alert('請輸入前台路徑')
    return
  }

  const result = addGameSetting({
    templateId: addGameForm.templateId,
    id: addGameForm.id,
    name: addGameForm.name,
    description: addGameForm.description,
    icon: addGameForm.icon,
    route: normalizeRoute(addGameForm.route),
    type: addGameForm.type,
    status: addGameForm.status,
    playLimit: addGameForm.playLimit,
    probabilityMode: addGameForm.probabilityMode,
    requiredInviteCount: addGameForm.requiredInviteCount
  })

  if (!result.success) {
    window.alert(result.message)
    return
  }

  savedMessage.value = '新增遊戲設定成功，前台模板頁會顯示自訂活動名稱。'
  closeAddGameModal()

  setTimeout(() => {
    savedMessage.value = ''
  }, 2500)
}

const previewGame = (game) => {
  router.push(normalizeRoute(game.route))
}

const goPrizeSettings = (game) => {
  router.push(`/admin/game-settings/${game.id}/prizes`)
}

const goProbabilitySettings = (game) => {
  router.push(`/admin/game-settings/${game.id}/probability`)
}

const editGameSettings = (game) => {
  router.push(`/admin/game-settings/${game.id}/edit`)
}

const goTestStep = (step) => {
  router.push(normalizeRoute(step.path))
}

const toggleTestFlow = (game) => {
  activeTestGameId.value = activeTestGameId.value === game.id ? '' : game.id
}

const resetSettings = () => {
  const confirmed = window.confirm('確定要還原所有遊戲設定嗎？這會清除目前 localStorage 內的修改。')

  if (!confirmed) return

  resetGameSettings()
}

loadFiltersFromStorage()
loadReportExportLogsFromStorage()
</script>

<template>
  <div class="space-y-8">
    <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div class="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-600">
            Admin Game Settings
          </div>

          <h1 class="mt-4 text-3xl font-black text-slate-900">
            遊戲設定管理
          </h1>

          <p class="mt-2 text-sm leading-6 text-slate-500">
            管理前台九宮格、刮刮卡、輪盤、翻牌、敲金蛋、拉霸機、套圈圈、夾娃娃與推薦任務等遊戲設定。
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <button
            type="button"
            class="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            @click="router.push('/games')"
          >
            查看前台遊戲中心
          </button>

          <button
            type="button"
            class="rounded-2xl border px-5 py-3 text-sm font-black transition"
            :class="abnormalRouteCount > 0
              ? 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100'
              : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
            "
            @click="fixAllFrontendRoutes"
          >
            批次修正全部網址
            <span v-if="abnormalRouteCount > 0">
              （{{ abnormalRouteCount }}）
            </span>
          </button>

          <button
            type="button"
            class="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-black text-rose-600 transition hover:bg-rose-100"
            @click="resetSettings"
          >
            還原預設設定
          </button>

          <button
            type="button"
            class="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-600"
            @click="openAddGameModal"
          >
            新增遊戲設定
          </button>
        </div>
      </div>
    </section>

    <section
      v-if="savedMessage"
      class="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-black text-emerald-700"
    >
      {{ savedMessage }}
    </section>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article
        v-for="card in statCards"
        :key="card.title"
        class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
      >
        <div
          class="bg-gradient-to-br p-5 text-white"
          :class="card.colorClass"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm font-bold text-white/80">
                {{ card.title }}
              </p>

              <p class="mt-3 text-4xl font-black">
                {{ card.value }}
              </p>
            </div>

            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-3xl">
              {{ card.icon }}
            </div>
          </div>

          <p class="mt-4 text-sm font-semibold text-white/80">
            {{ card.description }}
          </p>
        </div>
      </article>
    </section>

    <section
      class="rounded-3xl border p-5 shadow-sm"
      :class="abnormalRouteCount > 0 ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'"
    >
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2
            class="text-lg font-black"
            :class="abnormalRouteCount > 0 ? 'text-amber-900' : 'text-emerald-900'"
          >
            前台網址健康檢查
          </h2>

          <p
            class="mt-1 text-sm leading-6"
            :class="abnormalRouteCount > 0 ? 'text-amber-700' : 'text-emerald-700'"
          >
            {{
              abnormalRouteCount > 0
                ? `目前偵測到 ${abnormalRouteCount} 個前台網址格式異常，可使用批次修正。`
                : '目前所有前台網址格式正常。'
            }}
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <button
            type="button"
            class="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-black text-amber-600 transition hover:bg-amber-100"
            @click="showAbnormalRouteGames"
          >
            只看網址異常
            <span v-if="abnormalRouteCount > 0">
              （{{ abnormalRouteCount }}）
            </span>
          </button>

          <button
            type="button"
            class="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-600 transition hover:bg-emerald-100"
            @click="showNormalRouteGames"
          >
            只看網址正常
          </button>

          <button
            type="button"
            class="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black text-blue-600 transition hover:bg-blue-100"
            @click="showAllRouteHealthGames"
          >
            查看全部網址
          </button>

          <BaseBadge
            :text="abnormalRouteCount > 0 ? `異常 ${abnormalRouteCount} 個` : '全部正常'"
            :type="abnormalRouteCount > 0 ? 'warning' : 'success'"
          />
        </div>
      </div>
    </section>

    <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div class="inline-flex rounded-full bg-purple-50 px-4 py-2 text-sm font-black text-purple-600">
            Frontend Test Summary
          </div>

          <h2 class="mt-4 text-xl font-black text-slate-900">
            前台測試狀態統計
          </h2>

          <p class="mt-1 text-sm leading-6 text-slate-500">
            統計本次頁面中，每個遊戲是否已用新分頁測試過前台網址。
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <button
            type="button"
            class="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-black text-amber-600 transition hover:bg-amber-100"
            @click="showUntestedGames"
          >
            只看未測試
            <span v-if="routeTestSummary.untested > 0">
              （{{ routeTestSummary.untested }}）
            </span>
          </button>

          <button
            type="button"
            class="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black text-blue-600 transition hover:bg-blue-100"
            @click="showAllRouteTestGames"
          >
            查看全部
          </button>

          <button
            type="button"
            class="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-100"
            @click="clearRouteTestStatus"
          >
            清除測試狀態
          </button>
        </div>
      </div>

      <div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <article
          v-for="card in routeTestStatCards"
          :key="card.title"
          class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
        >
          <div
            class="bg-gradient-to-br p-5 text-white"
            :class="card.colorClass"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-sm font-bold text-white/80">
                  {{ card.title }}
                </p>

                <p class="mt-3 text-4xl font-black">
                  {{ card.value }}
                </p>
              </div>

              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-3xl">
                {{ card.icon }}
              </div>
            </div>

            <p class="mt-4 text-sm font-semibold text-white/80">
              {{ card.description }}
            </p>
          </div>
        </article>
      </div>
    </section>

    <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div class="inline-flex rounded-full bg-indigo-50 px-4 py-2 text-sm font-black text-indigo-600">
            Filter Presets
          </div>

          <h2 class="mt-4 text-xl font-black text-slate-900">
            快速篩選組合
          </h2>

          <p class="mt-1 text-sm leading-6 text-slate-500">
            一鍵套用常用篩選條件，快速檢查啟用狀態、網址狀態與前台測試狀態。
          </p>
        </div>

        <button
          type="button"
          class="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-600"
          @click="applyFilterPreset('all')"
        >
          回到全部遊戲
        </button>
      </div>

      <div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <button
          v-for="preset in filterPresetCards"
          :key="preset.preset"
          type="button"
          class="rounded-3xl border p-5 text-left transition hover:-translate-y-1 hover:shadow-md"
          :class="preset.buttonClass"
          @click="applyFilterPreset(preset.preset)"
        >
          <div class="flex items-start gap-4">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-3xl shadow-sm">
              {{ preset.icon }}
            </div>

            <div>
              <p class="text-base font-black">
                {{ preset.title }}
              </p>

              <p class="mt-1 text-sm leading-6 opacity-80">
                {{ preset.description }}
              </p>
            </div>
          </div>
        </button>
      </div>
    </section>

    <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="space-y-4">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div class="w-full xl:max-w-[460px]">
            <BaseSearchInput
              v-model="keyword"
              placeholder="搜尋遊戲名稱、ID、template 或說明"
            />
          </div>

          <div class="flex flex-1 flex-wrap gap-2">
            <button
              v-for="tab in typeTabs"
              :key="tab.value"
              type="button"
              class="rounded-xl px-4 py-2.5 text-sm font-black transition"
              :class="activeType === tab.value
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
              "
              @click="activeType = tab.value"
            >
              {{ tab.label }}
            </button>
          </div>

          <div class="flex flex-wrap gap-2 xl:justify-end">
            <button
              v-for="tab in statusTabs"
              :key="tab.value"
              type="button"
              class="rounded-xl px-4 py-2.5 text-sm font-black transition"
              :class="activeStatus === tab.value
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              "
              @click="activeStatus = tab.value"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="tab in routeTestStatusTabs"
              :key="tab.value"
              type="button"
              class="rounded-xl px-4 py-2.5 text-sm font-black transition"
              :class="activeRouteTestStatus === tab.value
                ? 'bg-purple-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-purple-700'
              "
              @click="activeRouteTestStatus = tab.value"
            >
              {{ tab.label }}
            </button>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-100"
              @click="resetAllFilters"
            >
              重置篩選
            </button>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            v-for="tab in routeStatusTabs"
            :key="tab.value"
            type="button"
            class="rounded-xl px-4 py-2.5 text-sm font-black transition"
            :class="activeRouteStatus === tab.value
              ? 'bg-amber-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
            "
            @click="activeRouteStatus = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
    </section>

    <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="text-lg font-black text-slate-900">
              目前篩選狀態
            </h2>

            <BaseBadge
              text="自動保存中"
              type="info"
            />
          </div>

          <p class="mt-1 text-sm leading-6 text-slate-500">
            顯示目前套用中的篩選條件；有 ✕ 的標籤可單獨點擊清除，重新整理後會自動保留。
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <button
            type="button"
            class="rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-3 text-sm font-black text-cyan-700 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="filteredGames.length === 0"
            @click="exportFilteredGamesJson"
          >
            匯出 JSON
          </button>

          <button
            type="button"
            class="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="filteredGames.length === 0"
            @click="exportFilteredGamesCsv"
          >
            匯出 CSV
          </button>
<button
  type="button"
  class="rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-black text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
  :disabled="filteredGames.length === 0"
  @click="openReportPreview"
>
  報表預覽
</button>

<button
  type="button"
  class="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 px-5 py-3 text-sm font-black text-fuchsia-700 transition hover:bg-fuchsia-100 disabled:cursor-not-allowed disabled:opacity-60"
  :disabled="filteredGames.length === 0"
  @click="printCurrentReportPreview"
>
  直接列印預覽
</button>

          <button
            type="button"
            class="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-600"
            @click="resetAllFilters"
          >
            全部重置
          </button>
        </div>
      </div>

      <div class="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black transition"
          :class="keyword
            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            : 'bg-slate-100 text-slate-500'
          "
          @click="keyword ? clearKeywordFilter() : null"
        >
          <span>
            {{ keyword ? `關鍵字：${keyword}` : '關鍵字：全部' }}
          </span>

          <span v-if="keyword">
            ✕
          </span>
        </button>

        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black transition"
          :class="activeType !== 'all'
            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            : 'bg-slate-100 text-slate-500'
          "
          @click="activeType !== 'all' ? clearTypeFilter() : null"
        >
          <span>
            遊戲類型：{{ typeTabs.find((tab) => tab.value === activeType)?.label || '全部' }}
          </span>

          <span v-if="activeType !== 'all'">
            ✕
          </span>
        </button>

        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black transition"
          :class="activeStatus !== 'all'
            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            : 'bg-slate-100 text-slate-500'
          "
          @click="activeStatus !== 'all' ? clearStatusFilter() : null"
        >
          <span>
            啟用狀態：{{ statusTabs.find((tab) => tab.value === activeStatus)?.label || '全部' }}
          </span>

          <span v-if="activeStatus !== 'all'">
            ✕
          </span>
        </button>

        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black transition"
          :class="activeRouteStatus !== 'all'
            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            : 'bg-slate-100 text-slate-500'
          "
          @click="activeRouteStatus !== 'all' ? clearRouteStatusFilter() : null"
        >
          <span>
            網址健康：{{ routeStatusTabs.find((tab) => tab.value === activeRouteStatus)?.label || '全部' }}
          </span>

          <span v-if="activeRouteStatus !== 'all'">
            ✕
          </span>
        </button>

        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black transition"
          :class="activeRouteTestStatus !== 'all'
            ? 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            : 'bg-slate-100 text-slate-500'
          "
          @click="activeRouteTestStatus !== 'all' ? clearRouteTestStatusFilter() : null"
        >
          <span>
            前台測試：{{ routeTestStatusTabs.find((tab) => tab.value === activeRouteTestStatus)?.label || '全部' }}
          </span>

          <span v-if="activeRouteTestStatus !== 'all'">
            ✕
          </span>
        </button>

        <BaseBadge
          :text="`目前顯示：${filteredGames.length} 筆`"
          type="success"
        />
      </div>
    </section>

    <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div class="inline-flex rounded-full bg-cyan-50 px-4 py-2 text-sm font-black text-cyan-600">
            Filter Result Summary
          </div>

          <h2 class="mt-4 text-xl font-black text-slate-900">
            篩選結果數量統計
          </h2>

          <p class="mt-1 text-sm leading-6 text-slate-500">
            根據目前搜尋與篩選條件，即時計算顯示筆數、隱藏筆數、啟用狀態、網址狀態與前台測試狀態。
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <BaseBadge
            :text="`全部 ${filteredGameSummary.total} 筆`"
            type="default"
          />

          <BaseBadge
            :text="`顯示 ${filteredGameSummary.filtered} 筆`"
            type="success"
          />

          <BaseBadge
            :text="`隱藏 ${filteredGameSummary.hidden} 筆`"
            :type="filteredGameSummary.hidden > 0 ? 'warning' : 'default'"
          />

          <button
            type="button"
            class="rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-3 text-sm font-black text-cyan-700 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="filteredGames.length === 0"
            @click="exportFilteredGamesJson"
          >
            匯出目前結果 JSON
          </button>

          <button
            type="button"
            class="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="filteredGames.length === 0"
            @click="exportFilteredGamesCsv"
          >
            匯出目前結果 CSV
          </button>

          <button
            type="button"
            class="rounded-2xl border border-purple-200 bg-purple-50 px-5 py-3 text-sm font-black text-purple-700 transition hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="filteredGames.length === 0"
            @click="printCurrentReportPreview"
          >
            直接列印目前結果
          </button>
        </div>
      </div>

      <div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <article
          v-for="card in filteredResultCards"
          :key="card.title"
          class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
        >
          <div
            class="bg-gradient-to-br p-5 text-white"
            :class="card.colorClass"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-sm font-bold text-white/80">
                  {{ card.title }}
                </p>

                <p class="mt-3 text-4xl font-black">
                  {{ card.value }}
                </p>
              </div>

              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-3xl">
                {{ card.icon }}
              </div>
            </div>

            <p class="mt-4 text-sm font-semibold text-white/80">
              {{ card.description }}
            </p>
          </div>
        </article>
      </div>

      <div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs font-black text-slate-400">
            啟用 / 未啟用
          </p>

          <p class="mt-2 text-sm font-black text-slate-700">
            已啟用 {{ filteredGameSummary.enabled }} 筆，未啟用 {{ filteredGameSummary.disabled }} 筆
          </p>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs font-black text-slate-400">
            網址狀態
          </p>

          <p class="mt-2 text-sm font-black text-slate-700">
            正常 {{ filteredGameSummary.routeOk }} 筆，異常 {{ filteredGameSummary.routeAbnormal }} 筆
          </p>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs font-black text-slate-400">
            前台測試
          </p>

          <p class="mt-2 text-sm font-black text-slate-700">
            已測 {{ filteredGameSummary.tested }} 筆，未測 {{ filteredGameSummary.untested }} 筆
          </p>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs font-black text-slate-400">
            篩選比例
          </p>

          <p class="mt-2 text-sm font-black text-slate-700">
            目前顯示 {{ filteredGameSummary.filtered }} / {{ filteredGameSummary.total }} 筆
          </p>
        </div>
      </div>
    </section>

    <section
      v-if="showReportPreview"
      id="admin-game-report-preview"
      class="print-report-area rounded-3xl border border-indigo-200 bg-white p-6 shadow-sm"
    >
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div class="inline-flex rounded-full bg-indigo-50 px-4 py-2 text-sm font-black text-indigo-600">
            Report Preview
          </div>

          <h2 class="mt-4 text-2xl font-black text-slate-900">
            遊戲設定篩選結果報表
          </h2>

          <p class="mt-2 text-sm leading-6 text-slate-500">
            此報表只顯示目前篩選後的遊戲資料，可先確認內容是否正確。
          </p>

          <p class="mt-1 text-xs font-bold text-slate-400">
            產生時間：{{ getPrintTimeText() }}
          </p>
        </div>

        <div class="flex flex-wrap gap-3 no-print">
          <button
            type="button"
            class="rounded-2xl border border-purple-200 bg-purple-50 px-5 py-3 text-sm font-black text-purple-700 transition hover:bg-purple-100"
            @click="printCurrentReportPreview"
          >
            直接列印預覽
          </button>

          <button
            type="button"
            class="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-100"
            @click="closeReportPreview"
          >
            收合預覽
          </button>
        </div>
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p class="text-xs font-black text-slate-400">
            全部遊戲
          </p>

          <p class="mt-2 text-3xl font-black text-slate-900">
            {{ filteredGameSummary.total }}
          </p>
        </div>

        <div class="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <p class="text-xs font-black text-blue-500">
            目前顯示
          </p>

          <p class="mt-2 text-3xl font-black text-blue-700">
            {{ filteredGameSummary.filtered }}
          </p>
        </div>

        <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p class="text-xs font-black text-emerald-500">
            已啟用
          </p>

          <p class="mt-2 text-3xl font-black text-emerald-700">
            {{ filteredGameSummary.enabled }}
          </p>
        </div>

        <div class="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p class="text-xs font-black text-amber-500">
            尚未測試
          </p>

          <p class="mt-2 text-3xl font-black text-amber-700">
            {{ filteredGameSummary.untested }}
          </p>
        </div>
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label class="mb-2 block text-xs font-black text-slate-400">
            平台名稱
          </label>

          <input
            v-model="reportMeta.platformName"
            type="text"
            class="no-print w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          >

          <p class="hidden text-sm font-black text-slate-800 print:block">
            {{ reportMeta.platformName }}
          </p>
        </div>

        <div>
          <label class="mb-2 block text-xs font-black text-slate-400">
            報表版本
          </label>

          <input
            v-model="reportMeta.reportVersion"
            type="text"
            class="no-print w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          >

          <p class="hidden text-sm font-black text-slate-800 print:block">
            {{ reportMeta.reportVersion }}
          </p>
        </div>

        <div>
          <label class="mb-2 block text-xs font-black text-slate-400">
            製表人
          </label>

          <input
            v-model="reportMeta.author"
            type="text"
            class="no-print w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          >

          <p class="hidden text-sm font-black text-slate-800 print:block">
            {{ reportMeta.author }}
          </p>
        </div>

        <div>
          <label class="mb-2 block text-xs font-black text-slate-400">
            報表類型
          </label>

          <p class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
            遊戲設定篩選結果
          </p>
        </div>
      </div>

      <div class="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <h3 class="text-lg font-black text-slate-900">
          目前篩選條件
        </h3>

        <div class="mt-4 flex flex-wrap gap-2">
          <BaseBadge
            :text="`關鍵字：${keyword || '全部'}`"
            :type="keyword ? 'primary' : 'default'"
          />

          <BaseBadge
            :text="`遊戲類型：${getFilterLabel(typeTabs, activeType)}`"
            :type="activeType === 'all' ? 'default' : 'primary'"
          />

          <BaseBadge
            :text="`啟用狀態：${getFilterLabel(statusTabs, activeStatus)}`"
            :type="activeStatus === 'all' ? 'default' : 'success'"
          />

          <BaseBadge
            :text="`網址健康：${getFilterLabel(routeStatusTabs, activeRouteStatus)}`"
            :type="activeRouteStatus === 'all' ? 'default' : 'warning'"
          />

          <BaseBadge
            :text="`前台測試：${getFilterLabel(routeTestStatusTabs, activeRouteTestStatus)}`"
            :type="activeRouteTestStatus === 'all' ? 'default' : 'info'"
          />
        </div>
      </div>

      <div class="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
        <h3 class="text-lg font-black text-slate-900">
          報表備註
        </h3>

        <textarea
          v-model="reportMeta.note"
          rows="3"
          class="no-print mt-4 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold leading-6 text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          placeholder="請輸入報表備註"
        />

        <p class="mt-4 hidden whitespace-pre-line text-sm font-bold leading-7 text-slate-700 print:block">
          {{ reportMeta.note }}
        </p>

        <p class="mt-3 text-xs font-bold text-slate-400 no-print">
          列印 PDF 時會顯示備註內容，不會顯示輸入框。
        </p>
      </div>

      <div class="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 class="text-lg font-black text-slate-900">
              報表版型切換
            </h3>

            <p class="mt-1 text-sm leading-6 text-slate-500">
              依照使用情境快速切換報表欄位組合，目前版型會同步影響預覽與 PDF 列印。
            </p>
          </div>

          <BaseBadge
            :text="`目前版型：${getReportLayoutLabel()}`"
            type="info"
          />
        </div>

        <div class="mt-5 grid gap-4 md:grid-cols-3 no-print">
          <button
            v-for="layout in reportLayoutOptions"
            :key="layout.value"
            type="button"
            class="rounded-3xl border p-5 text-left transition hover:-translate-y-1 hover:shadow-md"
            :class="activeReportLayout === layout.value
              ? `${layout.buttonClass} ring-4 ring-white`
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            "
            @click="applyReportLayout(layout.value)"
          >
            <div class="flex items-start gap-4">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-3xl shadow-sm">
                {{ layout.icon }}
              </div>

              <div>
                <p class="text-base font-black">
                  {{ layout.label }}
                </p>

                <p class="mt-1 text-sm leading-6 opacity-80">
                  {{ layout.description }}
                </p>
              </div>
            </div>
          </button>
        </div>

        <div class="mt-4 hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 print:block">
          報表版型：{{ getReportLayoutLabel() }}
        </div>
      </div>

      <div class="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 class="text-lg font-black text-slate-900">
              欄位顯示設定
            </h3>

            <p class="mt-1 text-sm leading-6 text-slate-500">
              控制報表表格要顯示哪些管理欄位，列印 PDF 時會依照目前設定輸出。
            </p>
          </div>

          <div class="flex flex-wrap gap-2 no-print">
            <button
              type="button"
              class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-100"
              @click="showAllReportColumns"
            >
              全部顯示
            </button>

            <button
              type="button"
              class="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-black text-indigo-700 transition hover:bg-indigo-100"
              @click="useSimpleReportColumns"
            >
              簡潔版
            </button>

            <button
              type="button"
              class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
              @click="useManagerReportColumns"
            >
              完整管理版
            </button>
          </div>
        </div>

        <div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3 no-print">
          <label class="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <span class="text-sm font-black text-slate-700">
              前台路徑
            </span>

            <input
              v-model="reportColumns.route"
              type="checkbox"
              class="h-5 w-5 accent-indigo-600"
            >
          </label>

          <label class="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <span class="text-sm font-black text-slate-700">
              網址健康
            </span>

            <input
              v-model="reportColumns.routeHealth"
              type="checkbox"
              class="h-5 w-5 accent-indigo-600"
            >
          </label>

          <label class="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <span class="text-sm font-black text-slate-700">
              測試狀態
            </span>

            <input
              v-model="reportColumns.testStatus"
              type="checkbox"
              class="h-5 w-5 accent-indigo-600"
            >
          </label>

          <label class="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <span class="text-sm font-black text-slate-700">
              獎項數
            </span>

            <input
              v-model="reportColumns.prizeCount"
              type="checkbox"
              class="h-5 w-5 accent-indigo-600"
            >
          </label>

          <label class="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <span class="text-sm font-black text-slate-700">
              權重
            </span>

            <input
              v-model="reportColumns.weight"
              type="checkbox"
              class="h-5 w-5 accent-indigo-600"
            >
          </label>

          <label class="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <span class="text-sm font-black text-slate-700">
              庫存
            </span>

            <input
              v-model="reportColumns.quantity"
              type="checkbox"
              class="h-5 w-5 accent-indigo-600"
            >
          </label>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <BaseBadge
            :text="reportColumns.route ? '前台路徑：顯示' : '前台路徑：隱藏'"
            :type="reportColumns.route ? 'success' : 'default'"
          />

          <BaseBadge
            :text="reportColumns.routeHealth ? '網址健康：顯示' : '網址健康：隱藏'"
            :type="reportColumns.routeHealth ? 'success' : 'default'"
          />

          <BaseBadge
            :text="reportColumns.testStatus ? '測試狀態：顯示' : '測試狀態：隱藏'"
            :type="reportColumns.testStatus ? 'success' : 'default'"
          />

          <BaseBadge
            :text="reportColumns.prizeCount ? '獎項數：顯示' : '獎項數：隱藏'"
            :type="reportColumns.prizeCount ? 'success' : 'default'"
          />

          <BaseBadge
            :text="reportColumns.weight ? '權重：顯示' : '權重：隱藏'"
            :type="reportColumns.weight ? 'success' : 'default'"
          />

          <BaseBadge
            :text="reportColumns.quantity ? '庫存：顯示' : '庫存：隱藏'"
            :type="reportColumns.quantity ? 'success' : 'default'"
          />
        </div>
      </div>

      <div class="mt-6 overflow-x-auto rounded-3xl border border-slate-200">
        <table class="w-full min-w-[980px] text-left">
          <thead>
            <tr class="bg-slate-900 text-sm text-white">
              <th class="px-5 py-4 font-black">
                #
              </th>

              <th class="px-5 py-4 font-black">
                遊戲
              </th>

              <th class="px-5 py-4 font-black">
                類型
              </th>

              <th class="px-5 py-4 font-black">
                狀態
              </th>

              <th
                v-if="reportColumns.route"
                class="px-5 py-4 font-black"
              >
                前台路徑
              </th>

              <th
                v-if="reportColumns.routeHealth"
                class="px-5 py-4 font-black"
              >
                網址健康
              </th>

              <th
                v-if="reportColumns.testStatus"
                class="px-5 py-4 font-black"
              >
                測試狀態
              </th>

              <th
                v-if="reportColumns.prizeCount"
                class="px-5 py-4 font-black"
              >
                獎項
              </th>

              <th
                v-if="reportColumns.weight"
                class="px-5 py-4 font-black"
              >
                權重
              </th>

              <th
                v-if="reportColumns.quantity"
                class="px-5 py-4 font-black"
              >
                庫存
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(game, index) in filteredGames"
              :key="`report_${game.id}`"
              class="border-b border-slate-100 transition hover:bg-slate-50"
            >
              <td class="px-5 py-4 text-sm font-black text-slate-500">
                {{ index + 1 }}
              </td>

              <td class="px-5 py-4">
                <p class="text-sm font-black text-slate-900">
                  {{ game.name }}
                </p>

                <p class="mt-1 text-xs font-bold text-slate-400">
                  {{ game.id }}
                </p>

                <p
                  v-if="game.templateId"
                  class="mt-1 text-xs font-black text-blue-500"
                >
                  模板：{{ game.templateId }}
                </p>
              </td>

              <td class="px-5 py-4">
                <BaseBadge
                  :text="typeTextMap[game.type] || game.type"
                  :type="typeBadgeMap[game.type] || 'default'"
                />
              </td>

              <td class="px-5 py-4">
                <BaseBadge
                  :text="statusTextMap[game.status] || game.status"
                  :type="statusBadgeMap[game.status] || 'default'"
                />
              </td>

              <td
                v-if="reportColumns.route"
                class="px-5 py-4"
              >
                <p class="max-w-[260px] break-all text-xs font-black text-slate-600">
                  {{ game.route }}
                </p>
              </td>

              <td
                v-if="reportColumns.routeHealth"
                class="px-5 py-4"
              >
                <BaseBadge
                  :text="checkFrontendRoute(game).text"
                  :type="checkFrontendRoute(game).type"
                />
              </td>

              <td
                v-if="reportColumns.testStatus"
                class="px-5 py-4"
              >
                <BaseBadge
                  :text="getRouteTestStatus(game).text"
                  :type="getRouteTestStatus(game).type"
                />
              </td>

              <td
                v-if="reportColumns.prizeCount"
                class="px-5 py-4 text-sm font-black text-slate-700"
              >
                {{ getPrizeCount(game) }}
              </td>

              <td
                v-if="reportColumns.weight"
                class="px-5 py-4 text-sm font-black text-slate-700"
              >
                {{ getTotalPrizeWeight(game) }}
              </td>

              <td
                v-if="reportColumns.quantity"
                class="px-5 py-4 text-sm font-black text-slate-700"
              >
                {{ getTotalPrizeQuantity(game) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

<section
      v-if="filteredGames.length"
      class="grid gap-6 xl:grid-cols-2"
    >
      <article
        v-for="game in filteredGames"
        :key="game.id"
        class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg"
      >
        <div class="border-b border-slate-100 p-6">
          <div class="flex items-start justify-between gap-4">
            <div class="flex min-w-0 items-start gap-4">
              <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-slate-100 text-4xl">
                {{ game.icon }}
              </div>

              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="text-xl font-black text-slate-900">
                    {{ game.name }}
                  </h2>

                  <BaseBadge
                    :text="statusTextMap[game.status] || game.status"
                    :type="statusBadgeMap[game.status] || 'default'"
                  />

                  <BaseBadge
                    :text="typeTextMap[game.type] || game.type"
                    :type="typeBadgeMap[game.type] || 'default'"
                  />
                </div>

                <p class="mt-1 text-xs font-bold text-slate-400">
                  {{ game.id }}
                </p>

                <p class="mt-3 text-sm leading-6 text-slate-500">
                  {{ game.description }}
                </p>

                <p
                  v-if="game.templateId"
                  class="mt-2 text-xs font-black text-blue-500"
                >
                  模板：{{ game.templateId }}
                </p>
              </div>
            </div>

            <button
              type="button"
              class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-50"
              @click="previewGame(game)"
            >
              預覽
            </button>
          </div>
        </div>

        <div class="grid gap-4 p-6 md:grid-cols-4">
          <div class="rounded-2xl bg-slate-50 p-4">
            <p class="text-xs font-black text-slate-400">
              遊戲類型
            </p>

            <div class="mt-3">
              <BaseBadge
                :text="typeTextMap[game.type] || game.type"
                :type="typeBadgeMap[game.type] || 'default'"
              />
            </div>
          </div>

          <div class="rounded-2xl bg-slate-50 p-4">
            <p class="text-xs font-black text-slate-400">
              遊玩限制
            </p>

            <p class="mt-3 text-lg font-black text-slate-800">
              {{ game.playLimit }} 次
            </p>
          </div>

          <div class="rounded-2xl bg-slate-50 p-4">
            <p class="text-xs font-black text-slate-400">
              獎項數量
            </p>

            <p class="mt-3 text-lg font-black text-slate-800">
              {{ getPrizeCount(game) }} 個
            </p>
          </div>

          <div class="rounded-2xl bg-slate-50 p-4">
            <p class="text-xs font-black text-slate-400">
              機率模式
            </p>

            <p class="mt-3 text-sm font-black text-slate-800">
              {{ probabilityModeTextMap[game.probabilityMode] || game.probabilityMode }}
            </p>
          </div>
        </div>

        <div class="grid gap-4 px-6 pb-6 md:grid-cols-3">
          <div class="rounded-2xl border border-slate-200 bg-white p-4">
            <p class="text-xs font-black text-slate-400">
              總權重
            </p>

            <p class="mt-2 text-2xl font-black text-slate-800">
              {{ getTotalPrizeWeight(game) }}
            </p>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-4">
            <p class="text-xs font-black text-slate-400">
              總獎項庫存
            </p>

            <p class="mt-2 text-2xl font-black text-slate-800">
              {{ getTotalPrizeQuantity(game) }}
            </p>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-4">
            <div class="flex items-center justify-between gap-3">
              <p class="text-xs font-black text-slate-400">
                前台路徑
              </p>

              <BaseBadge
                :text="checkFrontendRoute(game).text"
                :type="checkFrontendRoute(game).type"
                size="sm"
              />
            </div>

            <p class="mt-2 break-all text-sm font-black text-slate-700">
              {{ game.route || '尚未設定' }}
            </p>

            <p
              class="mt-2 text-xs leading-5"
              :class="checkFrontendRoute(game).ok ? 'text-emerald-500' : 'text-amber-600'"
            >
              {{ checkFrontendRoute(game).message }}
            </p>

            <div class="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div class="flex items-center justify-between gap-3">
                <p class="text-xs font-black text-slate-400">
                  前台測試狀態
                </p>

                <BaseBadge
                  :text="getRouteTestStatus(game).text"
                  :type="getRouteTestStatus(game).type"
                  size="sm"
                />
              </div>

              <p class="mt-2 text-xs leading-5 text-slate-500">
                {{ getRouteTestStatus(game).message }}
              </p>

              <p
                v-if="getRouteTestStatus(game).testedAt"
                class="mt-1 text-xs font-bold text-slate-400"
              >
                測試時間：{{ formatRouteTestTime(getRouteTestStatus(game).testedAt) }}
              </p>
            </div>

            <div
              v-if="!checkFrontendRoute(game).ok"
              class="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3"
            >
              <p class="text-xs font-black text-amber-700">
                建議修正為：
              </p>

              <p class="mt-1 break-all text-xs font-black text-amber-800">
                {{ checkFrontendRoute(game).suggestion }}
              </p>

              <button
                type="button"
                class="mt-3 w-full rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-black text-white transition hover:bg-amber-600"
                @click="fixFrontendRoute(game)"
              >
                一鍵修正網址
              </button>
            </div>
          </div>
        </div>

        <div class="border-t border-slate-100 bg-slate-50 p-6">
          <div class="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="text-sm font-black text-slate-700">
                快速跳轉
              </p>

              <p class="mt-1 text-xs text-slate-400">
                玩家版給客人看；管理版會自動加 mode=admin，方便後台測試。
              </p>
            </div>

            <BaseBadge
              :text="game.status === 'enabled' ? '前台可遊玩' : '前台未開放'"
              :type="game.status === 'enabled' ? 'success' : 'danger'"
            />
          </div>

                    <div class="mt-3 grid gap-3 rounded-3xl border border-amber-100 bg-amber-50 p-4 text-xs font-bold leading-5 text-amber-800 lg:grid-cols-2">
            <div class="rounded-2xl bg-white/75 p-3">
              <div class="flex items-center gap-3">
                <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
                  {{ getGameLogoText(game) }}
                </div>

                <div class="min-w-0">
                  <p class="text-sm font-black text-amber-900">
                    客人版頂部 LOGO
                  </p>

                  <p class="mt-1 text-xs font-bold text-amber-700">
                    玩家看到的活動品牌入口，可在遊戲頁管理版設定 LOGO 圖片。
                  </p>
                </div>
              </div>

              <p class="mt-3 break-all rounded-xl bg-amber-100/70 px-3 py-2 text-xs font-black text-amber-800">
                客人版網址：{{ getGameWebsiteHint(game) }}
              </p>
            </div>

            <div class="rounded-2xl bg-white/75 p-3">
              <div class="flex items-center gap-3">
                <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-2xl">
                  🛠️
                </div>

                <div class="min-w-0">
                  <p class="text-sm font-black text-indigo-900">
                    後台版頂部 LOGO / 網址
                  </p>

                  <p class="mt-1 text-xs font-bold text-indigo-700">
                    管理者預覽會自動加上 mode=admin，方便測試 LOGO、網址與活動品牌。
                  </p>
                </div>
              </div>

              <p class="mt-3 break-all rounded-xl bg-indigo-100/70 px-3 py-2 text-xs font-black text-indigo-800">
                後台版網址：{{ getAdminPreviewRoute(game) }}
              </p>
            </div>
          </div>

          <div class="mt-3 grid gap-2 rounded-3xl border border-slate-100 bg-slate-50 p-4 text-xs font-bold leading-5 text-slate-500 sm:grid-cols-2">
            <p>
              <span class="font-black text-emerald-700">玩家版：</span>
              客人正式看到的簡潔遊戲畫面，不顯示後台工具。
            </p>

            <p>
              <span class="font-black text-indigo-700">管理版：</span>
              後台測試與設定預覽畫面，網址會自動加上 mode=admin。
            </p>
          </div>

          <div class="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-blue-100 bg-blue-50 p-4">
            <div>
              <p class="text-sm font-black text-blue-900">
                玩家版 / 管理版路徑狀態
              </p>

              <p class="mt-1 text-xs font-bold leading-5 text-blue-600">
                可查看、複製玩家版與管理版路徑，也可一鍵複製或下載完整狀態；上方可匯出全部遊戲預覽狀態。客人版與後台版頂部 LOGO / 網址會在此區清楚提示。
              </p>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded-full bg-blue-600 px-4 py-2 text-xs font-black text-white transition hover:bg-blue-700"
                @click="copyPreviewStatus(game)"
              >
                複製完整狀態
              </button>

              <button
                type="button"
                class="rounded-full bg-slate-900 px-4 py-2 text-xs font-black text-white transition hover:bg-slate-700"
                @click="downloadPreviewStatusJson(game)"
              >
                下載狀態 JSON
              </button>
            </div>
          </div>

          <div class="mt-3 grid gap-3 rounded-3xl border border-blue-100 bg-blue-50 p-4 text-xs font-bold leading-5 text-blue-700 lg:grid-cols-2">
            <div class="rounded-2xl bg-white/70 p-3">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="rounded-full px-3 py-1 text-xs font-black"
                  :class="getPreviewRouteStatus(getPlayerPreviewRoute(game)).className"
                >
                  {{ getPreviewRouteStatus(getPlayerPreviewRoute(game)).label }}
                </span>

                <span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                  玩家版
                </span>
              </div>

              <p class="mt-2 break-all">
                <span class="font-black text-blue-900">玩家版路徑：</span>
                {{ getPlayerPreviewRoute(game) }}
              </p>

              <button
                type="button"
                class="mt-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700 transition hover:bg-emerald-200"
                @click="copyPreviewRoute(getPlayerPreviewRoute(game), '玩家版路徑')"
              >
                複製玩家版
              </button>
            </div>

            <div class="rounded-2xl bg-white/70 p-3">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="rounded-full px-3 py-1 text-xs font-black"
                  :class="getPreviewRouteStatus(getAdminPreviewRoute(game)).className"
                >
                  {{ getPreviewRouteStatus(getAdminPreviewRoute(game)).label }}
                </span>

                <span class="rounded-full bg-indigo-100 px-3 py-1 text-xs font-black text-indigo-700">
                  管理版
                </span>
              </div>

              <p class="mt-2 break-all">
                <span class="font-black text-blue-900">管理版路徑：</span>
                {{ getAdminPreviewRoute(game) }}
              </p>

              <button
                type="button"
                class="mt-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-black text-indigo-700 transition hover:bg-indigo-200"
                @click="copyPreviewRoute(getAdminPreviewRoute(game), '管理版路徑')"
              >
                複製管理版
              </button>
            </div>
          </div>

<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-8">
            <button
              type="button"
              class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-md"
              title="開啟客人實際看到的玩家版畫面，不顯示後台工具"
              @click.stop.prevent="openPlayerPreview(game)"
            >
              玩家版
            </button>

            <button
              type="button"
              class="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-black text-indigo-700 transition hover:-translate-y-0.5 hover:bg-indigo-100 hover:shadow-md"
              title="開啟後台管理版預覽畫面，網址會自動加上 mode=admin"
              @click.stop.prevent="openAdminPreview(game)"
            >
              管理版
            </button>

            <button
              type="button"
              class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-600 transition hover:bg-emerald-100"
              @click="copyFrontendUrl(game)"
            >
              複製網址
            </button>

            <button
              type="button"
              class="rounded-2xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm font-black text-purple-600 transition hover:bg-purple-100"
              @click="openFrontendUrlInNewTab(game)"
            >
              {{ getRouteTestStatus(game).status === 'untested' ? '新分頁測試' : '重新測試' }}
            </button>

            <button
              type="button"
              class="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-600 transition hover:bg-blue-100"
              @click="goPrizeSettings(game)"
            >
              獎項設定
            </button>

            <button
              type="button"
              class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-600 transition hover:bg-amber-100"
              @click="goProbabilitySettings(game)"
            >
              機率設定
            </button>

            <button
              type="button"
              class="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-600"
              @click="editGameSettings(game)"
            >
              編輯設定
            </button>

            <button
              type="button"
              class="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700"
              @click="toggleTestFlow(game)"
            >
              {{ activeTestGameId === game.id ? '收合測試' : '測試流程' }}
            </button>
          </div>
        </div>

        <div
          v-if="activeTestGameId === game.id"
          class="border-t border-blue-100 bg-blue-50 p-6"
        >
          <div class="mb-5">
            <h3 class="text-lg font-black text-blue-900">
              {{ game.name }}｜一鍵測試流程
            </h3>

            <p class="mt-1 text-sm leading-6 text-blue-700">
              建議依照 1 → 2 → 3 → 4 的順序測試，確認後台修改後前台有同步。
            </p>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <button
              v-for="(step, index) in getTestSteps(game)"
              :key="step.title"
              type="button"
              class="rounded-3xl border border-blue-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              @click="goTestStep(step)"
            >
              <div class="flex items-start gap-4">
                <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                  {{ step.icon }}
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <span class="rounded-full bg-blue-600 px-2.5 py-1 text-xs font-black text-white">
                      {{ index + 1 }}
                    </span>

                    <h4 class="text-base font-black text-slate-900">
                      {{ step.title }}
                    </h4>
                  </div>

                  <p class="mt-2 text-sm leading-6 text-slate-500">
                    {{ step.description }}
                  </p>

                  <p class="mt-3 text-sm font-black text-blue-600">
                    {{ step.buttonText }} →
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </article>
    </section>

    <BaseEmptyState
      v-else
      icon="🎮"
      title="找不到符合的遊戲設定"
      :description="`目前全部 ${filteredGameSummary.total} 筆遊戲都被篩選條件排除了，請調整搜尋關鍵字、遊戲類型、啟用狀態、網址健康狀態或前台測試狀態篩選。`"
    />

    <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm no-print">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div class="inline-flex rounded-full bg-fuchsia-50 px-4 py-2 text-sm font-black text-fuchsia-600">
            Export History
          </div>

          <h2 class="mt-4 text-xl font-black text-slate-900">
            報表匯出紀錄
          </h2>

          <p class="mt-1 text-sm leading-6 text-slate-500">
            記錄 JSON、CSV 與 PDF 列印預覽的匯出歷程；第 71 批已加入 localStorage 保存，重新整理後仍會保留最近 {{ REPORT_EXPORT_LOG_LIMIT }} 筆。
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <BaseBadge
            :text="`${reportExportLogs.length} 筆紀錄`"
            :type="reportExportLogs.length ? 'info' : 'default'"
          />

          <button
            v-if="reportExportLogs.length"
            type="button"
            class="rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-3 text-sm font-black text-cyan-700 transition hover:bg-cyan-100"
            @click="exportReportExportLogsJson"
          >
            匯出紀錄 JSON
          </button>

          <button
            v-if="reportExportLogs.length"
            type="button"
            class="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-black text-rose-600 transition hover:bg-rose-100"
            @click="clearReportExportLogs"
          >
            清空紀錄
          </button>
        </div>
      </div>

      <div
        v-if="reportExportLogs.length"
        class="mt-5 overflow-x-auto"
      >
        <table class="w-full min-w-[960px] text-left">
          <thead>
            <tr class="border-b border-slate-100 bg-slate-50 text-sm text-slate-500">
              <th class="px-5 py-4 font-black">
                時間
              </th>

              <th class="px-5 py-4 font-black">
                類型
              </th>

              <th class="px-5 py-4 font-black">
                檔名
              </th>

              <th class="px-5 py-4 font-black">
                筆數
              </th>

              <th class="px-5 py-4 font-black">
                版型
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="log in reportExportLogs"
              :key="log.id"
              class="border-b border-slate-100 transition hover:bg-slate-50"
            >
              <td class="px-5 py-4">
                <p class="text-sm font-black text-slate-700">
                  {{ formatReportExportTime(log.createdAt) }}
                </p>
              </td>

              <td class="px-5 py-4">
                <BaseBadge
                  :text="log.type"
                  :type="log.type === 'PDF'
                    ? 'warning'
                    : log.type === 'CSV'
                      ? 'success'
                      : 'info'
                  "
                />
              </td>

              <td class="px-5 py-4">
                <p class="break-all rounded-xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-700">
                  {{ log.filename }}
                </p>
              </td>

              <td class="px-5 py-4">
                <p class="text-sm font-black text-slate-700">
                  {{ log.count }} 筆
                </p>
              </td>

              <td class="px-5 py-4">
                <p class="text-sm font-black text-slate-700">
                  {{ log.layout }}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-else
        class="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center"
      >
        <div class="text-4xl">
          📦
        </div>

        <h3 class="mt-3 text-lg font-black text-slate-700">
          尚無報表匯出紀錄
        </h3>

        <p class="mt-2 text-sm text-slate-400">
          使用「匯出 JSON」、「匯出 CSV」或「直接列印預覽」後，這裡會自動保存最近的匯出紀錄。
        </p>
      </div>
    </section>

    <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 class="text-xl font-black text-slate-900">
            網址修正紀錄
          </h2>

          <p class="mt-1 text-sm leading-6 text-slate-500">
            記錄本次頁面操作中，單筆修正或批次修正前台網址的歷程。
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <BaseBadge
            :text="`${routeFixLogs.length} 筆紀錄`"
            :type="routeFixLogs.length ? 'info' : 'default'"
          />

          <button
            v-if="routeFixLogs.length"
            type="button"
            class="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-black text-rose-600 transition hover:bg-rose-100"
            @click="clearRouteFixLogs"
          >
            清空紀錄
          </button>
        </div>
      </div>

      <div
        v-if="routeFixLogs.length"
        class="mt-5 overflow-x-auto"
      >
        <table class="w-full min-w-[920px] text-left">
          <thead>
            <tr class="border-b border-slate-100 bg-slate-50 text-sm text-slate-500">
              <th class="px-5 py-4 font-black">
                時間
              </th>

              <th class="px-5 py-4 font-black">
                類型
              </th>

              <th class="px-5 py-4 font-black">
                遊戲
              </th>

              <th class="px-5 py-4 font-black">
                修正前
              </th>

              <th class="px-5 py-4 font-black">
                修正後
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="log in routeFixLogs"
              :key="log.id"
              class="border-b border-slate-100 transition hover:bg-slate-50"
            >
              <td class="px-5 py-4">
                <p class="text-sm font-black text-slate-700">
                  {{ formatRouteFixTime(log.createdAt) }}
                </p>
              </td>

              <td class="px-5 py-4">
                <BaseBadge
                  :text="log.type === 'batch' ? '批次修正' : '單筆修正'"
                  :type="log.type === 'batch' ? 'warning' : 'success'"
                />
              </td>

              <td class="px-5 py-4">
                <p class="text-sm font-black text-slate-800">
                  {{ log.gameName }}
                </p>

                <p class="mt-1 text-xs font-bold text-slate-400">
                  {{ log.gameId }}
                </p>
              </td>

              <td class="px-5 py-4">
                <p class="break-all rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">
                  {{ log.oldRoute || '空白' }}
                </p>
              </td>

              <td class="px-5 py-4">
                <p class="break-all rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                  {{ log.newRoute || '空白' }}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-else
        class="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center"
      >
        <div class="text-4xl">
          🧾
        </div>

        <h3 class="mt-3 text-lg font-black text-slate-700">
          尚無網址修正紀錄
        </h3>

        <p class="mt-2 text-sm text-slate-400">
          使用「一鍵修正網址」或「批次修正全部網址」後，這裡會顯示修正紀錄。
        </p>
      </div>
    </section>

    
          <button
            type="button"
            class="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-100"
            @click="downloadAllPreviewStatusJson"
          >
            匯出全部預覽狀態
          </button>

<BaseModal
      v-model="showAddGameModal"
      title="新增遊戲設定"
      description="選擇現有遊戲模板後，會自動帶入路徑、類型、圖示與預設獎項。"
      size="md"
      :close-on-backdrop="false"
      @close="closeAddGameModal"
    >
      <div class="grid gap-5">
        <div class="rounded-3xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
          新增模板遊戲後，前台路徑會自動變成「模板頁面 + gameId」。精緻九宮格：/games/premium-grid；精緻刮刮卡：/games/scratch-card；精緻轉盤：/games/wheel。
        </div>

        <div>
          <label class="mb-3 block text-sm font-black text-slate-700">
            選擇現有遊戲模板
          </label>

          <div class="grid gap-3 md:grid-cols-3">
            <button
              v-for="template in templateOptions"
              :key="template.id"
              type="button"
              class="rounded-3xl border p-4 text-left transition"
              :class="addGameForm.templateId === template.id
                ? 'border-blue-300 bg-blue-50 ring-4 ring-blue-100'
                : 'border-slate-200 bg-white hover:bg-slate-50'
              "
              @click="addGameForm.templateId = template.id"
            >
              <div class="text-3xl">
                {{ template.icon }}
              </div>

              <p class="mt-3 text-sm font-black text-slate-900">
                {{ template.name }}
              </p>

              <p class="mt-1 text-xs leading-5 text-slate-400">
                {{ template.description }}
              </p>

              <div
                v-if="template.id === 'premium-grid' || template.id === 'scratch-card' || template.id === 'wheel'"
                class="mt-3 flex flex-wrap gap-2"
              >
                <span
                  class="rounded-full px-3 py-1 text-xs font-black"
                  :class="template.id === 'premium-grid'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-sky-100 text-sky-700'
                  "
                >
                  RWD 精緻版
                </span>

                <span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                  目前正式使用
                </span>
              </div>

              <p
                v-if="template.id === 'premium-grid' || template.id === 'scratch-card' || template.id === 'wheel'"
                class="mt-2 break-all rounded-2xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-500"
              >
                路徑：{{ template.id === 'premium-grid' ? '/games/premium-grid' : template.id === 'scratch-card' ? '/games/scratch-card' : '/games/wheel' }}
              </p>
            </button>
          </div>
        </div>

        <div class="grid gap-5 md:grid-cols-[120px_1fr]">
          <div class="rounded-3xl bg-slate-50 p-5 text-center">
            <div class="text-5xl">
              {{ addGameForm.icon || '🎮' }}
            </div>

            <p class="mt-3 text-xs font-black text-slate-400">
              遊戲圖示
            </p>
          </div>

          <div class="grid gap-4">
            <div>
              <label class="mb-2 block text-sm font-black text-slate-700">
                遊戲 ID
              </label>

              <input
                v-model="addGameForm.id"
                type="text"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="例如：summer-grid-2026"
              />
            </div>

            <div>
              <label class="mb-2 block text-sm font-black text-slate-700">
                遊戲名稱
              </label>

              <input
                v-model="addGameForm.name"
                type="text"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="例如：夏季九宮格活動"
              />
            </div>
          </div>
        </div>

        <div>
          <label class="mb-2 block text-sm font-black text-slate-700">
            遊戲說明
          </label>

          <textarea
            v-model="addGameForm.description"
            rows="3"
            class="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            placeholder="請輸入遊戲說明"
          />
        </div>

        <div class="grid gap-5 md:grid-cols-2">
          <div>
            <label class="mb-2 block text-sm font-black text-slate-700">
              圖示
            </label>

            <input
              v-model="addGameForm.icon"
              type="text"
              class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              placeholder="例如：🔥"
            />
          </div>

          <div>
            <label class="mb-2 block text-sm font-black text-slate-700">
              前台路徑
            </label>

            <input
              v-model="addGameForm.route"
              type="text"
              class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              placeholder="/games/premium-grid?gameId=summer-premium-grid-2026"
            />
          </div>
        </div>

        <div class="grid gap-5 md:grid-cols-2">
          <div>
            <label class="mb-2 block text-sm font-black text-slate-700">
              遊戲類型
            </label>

            <select
              v-model="addGameForm.type"
              class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option
                v-for="option in typeOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>

          <div>
            <label class="mb-2 block text-sm font-black text-slate-700">
              啟用狀態
            </label>

            <select
              v-model="addGameForm.status"
              class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option
                v-for="option in statusOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>

        <div class="grid gap-5 md:grid-cols-2">
          <div>
            <label class="mb-2 block text-sm font-black text-slate-700">
              每位玩家可玩次數
            </label>

            <input
              v-model.number="addGameForm.playLimit"
              type="number"
              min="1"
              class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label class="mb-2 block text-sm font-black text-slate-700">
              機率模式
            </label>

            <select
              v-model="addGameForm.probabilityMode"
              class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option
                v-for="option in probabilityModeOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>

        <div v-if="addGameForm.type === 'mission'">
          <label class="mb-2 block text-sm font-black text-slate-700">
            推薦任務邀請人數
          </label>

          <input
            v-model.number="addGameForm.requiredInviteCount"
            type="number"
            min="0"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </div>

      <template #footer>
        <button
          type="button"
          class="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
          @click.stop="closeAddGameModal"
        >
          取消
        </button>

        <button
          type="button"
          class="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
          @click.stop="saveNewGame"
        >
          新增遊戲
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<style>
@media print {
  body {
    background: #ffffff !important;
  }

  body * {
    visibility: hidden !important;
  }

  .print-report-area,
  .print-report-area * {
    visibility: visible !important;
  }

  .print-report-area {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    max-width: none !important;
    border: 0 !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    padding: 24px !important;
  }

  .no-print,
  .no-print * {
    display: none !important;
    visibility: hidden !important;
  }

  .print-report-area input,
  .print-report-area textarea {
    display: none !important;
  }

  .print-report-area .print\:block {
    display: block !important;
  }

  .print-report-area table {
    width: 100% !important;
    border-collapse: collapse !important;
    font-size: 11px !important;
  }

  .print-report-area th {
    background: #0f172a !important;
    color: #ffffff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .print-report-area th,
  .print-report-area td {
    padding: 8px !important;
    border-bottom: 1px solid #e2e8f0 !important;
  }

  .print-report-area .rounded-3xl,
  .print-report-area .rounded-2xl,
  .print-report-area .rounded-xl,
  .print-report-area .rounded-full {
    border-radius: 8px !important;
  }

  .print-report-area .shadow-sm,
  .print-report-area .shadow-md,
  .print-report-area .shadow-lg {
    box-shadow: none !important;
  }

  @page {
    size: A4 landscape;
    margin: 10mm;
  }
}
</style>
