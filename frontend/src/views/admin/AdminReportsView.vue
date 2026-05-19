<script setup>
// Multi Game Platform V2.3 Tenant Edition
// 第 97201～97600 批：報表中心 30 秒自動更新版
// 延續第 44001-1 批：報表中心四區塊展開收合修正版
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  getReportSummaryApi,
  getReportDailyApi,
  getPlayRecordsApi,
  getRewardRecordsApi,
  downloadRewardsCsvUrl,
  downloadRewardsXlsxUrl,
  downloadPlayRecordsCsvUrl,
  downloadPlayRecordsXlsxUrl
} from '../../api/campaign'
import http from '../../api/http'

const API_BASE = http?.defaults?.baseURL || 'http://localhost:3000/api'
const REPORT_AUTO_REFRESH_MS = 30000

const loading = ref(true)
const reportRefreshing = ref(false)
const lastReportRefreshAt = ref('')
const reportAutoRefreshTimer = ref(null)
const exporting = ref(false)
const advancedFiltersOpen = ref(false)
const savedQueriesOpen = ref(true)
const savedQueries = ref([])
const compactRecordsOpen = ref(true)
const activeRecordsPanel = ref('play')
const reportSectionsOpen = ref({
  prizePerformance: true,
  dailyStats: true,
  playRecords: true,
  rewardRecords: true
})


const emptySummary = () => ({
  scope: 'ALL',
  tenantId: null,
  totalCampaigns: 0,
  totalPrizes: 0,
  totalUsers: 0,
  totalRewards: 0,
  totalPlayRecords: 0,
  totalWins: 0,
  claimedRewards: 0,
  pendingRewards: 0,
  winRate: 0,
  canSelectTenant: false,
  selectedTenant: null,
  sourceStats: {
    total: 0,
    items: []
  }
})

const summary = ref(emptySummary())
const tenantOptions = ref([])
const dailyRows = ref([])
const playRows = ref([])
const rewardRows = ref([])
const prizePerformanceRows = ref([])
const prizeRankingRows = ref([])

const playPagination = ref({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 1
})

const rewardPagination = ref({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 1
})

const prizePagination = ref({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 1
})

const filters = ref({
  startDate: '',
  endDate: '',
  keyword: '',
  status: '',
  source: '',
  isWin: '',
  prizeId: '',
  serialCode: '',
  campaignId: '',
  tenantId: '',
  playPage: 1,
  rewardPage: 1,
  prizePage: 1,
  pageSize: 10
})

const getStoredReportUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}') || {}
  } catch (error) {
    console.error('報表使用者資料解析失敗', error)
    return {}
  }
}

const getSavedQueryStorageKey = () => {
  const user = getStoredReportUser()
  const role = String(user?.role || 'guest').toLowerCase()
  const tenantId = user?.tenantId || 'platform'
  const userId = user?.id || user?.email || 'default'

  return `multi_game_platform_v23_report_saved_queries_${role}_${tenantId}_${userId}`
}

const cloneFiltersForStorage = () => ({
  startDate: filters.value.startDate || '',
  endDate: filters.value.endDate || '',
  keyword: filters.value.keyword || '',
  status: filters.value.status || '',
  source: filters.value.source || '',
  isWin: filters.value.isWin || '',
  prizeId: filters.value.prizeId || '',
  serialCode: filters.value.serialCode || '',
  campaignId: filters.value.campaignId || '',
  tenantId: filters.value.tenantId || '',
  pageSize: Number(filters.value.pageSize || 10)
})

const loadSavedQueries = () => {
  try {
    const raw = localStorage.getItem(getSavedQueryStorageKey())
    const parsed = raw ? JSON.parse(raw) : []
    savedQueries.value = Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('讀取常用查詢失敗', error)
    savedQueries.value = []
  }
}

const persistSavedQueries = () => {
  localStorage.setItem(getSavedQueryStorageKey(), JSON.stringify(savedQueries.value))
}

const getSavedQuerySummary = (item = {}) => {
  const f = item.filters || {}
  const parts = []

  if (f.tenantId && selectedTenantName.value) parts.push(selectedTenantName.value)
  if (f.startDate || f.endDate) parts.push(`${f.startDate || '不限'}～${f.endDate || '不限'}`)
  if (f.keyword) parts.push(`關鍵字 ${f.keyword}`)
  if (f.source) parts.push(sourceFilterOptions.find((option) => option.value === f.source)?.label || f.source)
  if (f.isWin) parts.push(winFilterOptions.find((option) => option.value === f.isWin)?.label || f.isWin)
  if (f.status) parts.push(rewardStatusOptions.find((option) => option.value === f.status)?.label || f.status)
  if (f.serialCode) parts.push(`序號 ${f.serialCode}`)
  if (f.campaignId) parts.push(`活動 ${f.campaignId}`)
  if (f.prizeId) parts.push(`獎項 ${f.prizeId}`)

  return parts.length ? parts.join('｜') : '未限制條件'
}

const saveCurrentQuery = () => {
  const defaultName = queryBadges.value.filter((badge) => badge !== '目前未套用進階查詢條件').slice(0, 3).join('｜') || '常用查詢'
  const name = window.prompt('請輸入常用查詢名稱', defaultName)

  if (!name || !name.trim()) return

  const newItem = {
    id: `saved-${Date.now()}`,
    name: name.trim(),
    filters: cloneFiltersForStorage(),
    createdAt: new Date().toISOString()
  }

  savedQueries.value = [newItem, ...savedQueries.value].slice(0, 20)
  persistSavedQueries()
}

const applySavedQuery = async (item) => {
  const f = item?.filters || {}

  filters.value = {
    ...filters.value,
    ...f,
    playPage: 1,
    rewardPage: 1,
    prizePage: 1,
    pageSize: Number(f.pageSize || filters.value.pageSize || 10)
  }

  advancedFiltersOpen.value = true
  await fetchReports()
}

const deleteSavedQuery = (id) => {
  const target = savedQueries.value.find((item) => item.id === id)
  const confirmed = window.confirm(`確定刪除常用查詢「${target?.name || ''}」嗎？`)

  if (!confirmed) return

  savedQueries.value = savedQueries.value.filter((item) => item.id !== id)
  persistSavedQueries()
}

const safeArray = (value) => (Array.isArray(value) ? value : [])

const apiData = (response, fallback = null) => {
  return response?.data?.data ?? response?.data ?? fallback
}

const sourceLabelMap = {
  line: 'LINE',
  facebook: 'Facebook',
  instagram: 'Instagram',
  direct: '一般 / 直接'
}


const padDatePart = (value) => String(value).padStart(2, '0')

const toLocalDateInputValue = (date) => {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''

  return `${d.getFullYear()}-${padDatePart(d.getMonth() + 1)}-${padDatePart(d.getDate())}`
}

const getMonthRange = (monthOffset = 0) => {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0)

  return {
    startDate: toLocalDateInputValue(firstDay),
    endDate: toLocalDateInputValue(lastDay)
  }
}

const dateQuickRanges = computed(() => {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  const last7Start = new Date(today)
  last7Start.setDate(today.getDate() - 6)

  const last30Start = new Date(today)
  last30Start.setDate(today.getDate() - 29)

  return [
    {
      key: 'today',
      label: '今日',
      startDate: toLocalDateInputValue(today),
      endDate: toLocalDateInputValue(today)
    },
    {
      key: 'yesterday',
      label: '昨日',
      startDate: toLocalDateInputValue(yesterday),
      endDate: toLocalDateInputValue(yesterday)
    },
    {
      key: 'last7',
      label: '近 7 天',
      startDate: toLocalDateInputValue(last7Start),
      endDate: toLocalDateInputValue(today)
    },
    {
      key: 'last30',
      label: '近 30 天',
      startDate: toLocalDateInputValue(last30Start),
      endDate: toLocalDateInputValue(today)
    },
    {
      key: 'thisMonth',
      label: '本月',
      ...getMonthRange(0)
    },
    {
      key: 'lastMonth',
      label: '上月',
      ...getMonthRange(-1)
    }
  ]
})

const activeDatePreset = computed(() => {
  const matched = dateQuickRanges.value.find((item) => {
    return item.startDate === filters.value.startDate && item.endDate === filters.value.endDate
  })

  return matched?.key || ''
})

const currentDateRangeText = computed(() => {
  if (!filters.value.startDate && !filters.value.endDate) {
    return '目前未限制日期範圍，顯示可查詢的全部資料。'
  }

  if (filters.value.startDate && filters.value.endDate) {
    return `目前查詢期間：${filters.value.startDate} ～ ${filters.value.endDate}`
  }

  if (filters.value.startDate) {
    return `目前查詢期間：${filters.value.startDate} 之後`
  }

  return `目前查詢期間：${filters.value.endDate} 以前`
})


const sourceFilterOptions = [
  { value: '', label: '全部來源' },
  { value: 'line', label: 'LINE' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'direct', label: '一般 / 直接' }
]

const winFilterOptions = [
  { value: '', label: '全部結果' },
  { value: 'WIN', label: '只看中獎' },
  { value: 'LOSE', label: '只看未中獎' }
]

const rewardStatusOptions = [
  { value: '', label: '全部發獎狀態' },
  { value: 'PENDING', label: '待發獎' },
  { value: 'CLAIMED', label: '已核銷' },
  { value: 'CANCELLED', label: '已取消' }
]

const applyDatePreset = async (preset) => {
  filters.value.startDate = preset.startDate
  filters.value.endDate = preset.endDate
  filters.value.playPage = 1
  filters.value.rewardPage = 1
  await fetchReports()
}

const clearDateRange = async () => {
  filters.value.startDate = ''
  filters.value.endDate = ''
  filters.value.playPage = 1
  filters.value.rewardPage = 1
  await fetchReports()
}

const sourceStats = computed(() => {
  const items = safeArray(summary.value?.sourceStats?.items)

  if (items.length) return items

  return [
    { key: 'line', label: 'LINE', count: 0, percent: 0 },
    { key: 'facebook', label: 'Facebook', count: 0, percent: 0 },
    { key: 'instagram', label: 'Instagram', count: 0, percent: 0 },
    { key: 'direct', label: '一般 / 直接', count: 0, percent: 0 }
  ]
})


const reportFocusCards = computed(() => [
  {
    label: '遊玩紀錄',
    value: totalPlayRows.value,
    description: '目前條件下的遊玩筆數',
    icon: '🎮',
    className: 'border-slate-200 bg-white text-slate-950'
  },
  {
    label: '中獎紀錄',
    value: summary.value.totalWins ?? 0,
    description: `中獎率 ${summary.value.winRate ?? 0}%`,
    icon: '🏆',
    className: 'border-emerald-100 bg-emerald-50 text-emerald-700'
  },
  {
    label: '待發獎',
    value: summary.value.pendingRewards ?? 0,
    description: '需要商家處理的獎項',
    icon: '🎁',
    className: 'border-amber-100 bg-amber-50 text-amber-700'
  },
  {
    label: '已核銷',
    value: summary.value.claimedRewards ?? 0,
    description: '已完成兌獎處理',
    icon: '✅',
    className: 'border-blue-100 bg-blue-50 text-blue-700'
  }
])

const recordPanelTabs = computed(() => [
  {
    key: 'play',
    label: '遊玩紀錄',
    count: totalPlayRows.value,
    description: '玩家每一次遊玩的完整紀錄'
  },
  {
    key: 'reward',
    label: '中獎 / 發獎',
    count: totalRewardRows.value,
    description: '中獎後發獎與核銷狀態'
  }
])

const latestDailyChartRows = computed(() => {
  return safeArray(dailyRows.value)
    .slice()
    .reverse()
    .slice(-14)
    .map((row) => {
      const playCount = Number(row.playCount || row.totalPlays || 0)
      const winCount = Number(row.winCount || row.totalWins || 0)
      const winRate = playCount > 0 ? Number(((winCount / playCount) * 100).toFixed(1)) : 0

      return {
        ...row,
        dateLabel: String(row.date || '').slice(5) || '—',
        playCount,
        winCount,
        winRate
      }
    })
})

const maxDailyPlayCount = computed(() => {
  return Math.max(1, ...latestDailyChartRows.value.map((row) => Number(row.playCount || 0)))
})

const maxDailyWinCount = computed(() => {
  return Math.max(1, ...latestDailyChartRows.value.map((row) => Number(row.winCount || 0)))
})

const maxSourceCount = computed(() => {
  return Math.max(1, ...sourceStats.value.map((item) => Number(item.count || 0)))
})

const hasChartData = computed(() => {
  return latestDailyChartRows.value.some((row) => row.playCount > 0 || row.winCount > 0) ||
    sourceStats.value.some((item) => Number(item.count || 0) > 0)
})


const topPrizePerformanceRows = computed(() => {
  const sourceRows = safeArray(prizeRankingRows.value).length
    ? safeArray(prizeRankingRows.value)
    : safeArray(prizePerformanceRows.value)

  return sourceRows
    .slice()
    .sort((a, b) => Number(b.winCount || 0) - Number(a.winCount || 0))
    .slice(0, 8)
})

const maxPrizeWinCount = computed(() => {
  return Math.max(1, ...topPrizePerformanceRows.value.map((row) => Number(row.winCount || 0)))
})

const hasPrizePerformanceData = computed(() => {
  return safeArray(prizePerformanceRows.value).some((row) => {
    return Number(row.winCount || 0) > 0 || Number(row.rewardCount || 0) > 0 || Number(row.remainStock || 0) > 0
  })
})

const getPrizeBarWidth = (count) => {
  return `${Math.max(3, Math.round((Number(count || 0) / maxPrizeWinCount.value) * 100))}%`
}

const getPlayBarHeight = (count) => {
  return `${Math.max(6, Math.round((Number(count || 0) / maxDailyPlayCount.value) * 100))}%`
}

const getWinBarHeight = (count) => {
  return `${Math.max(6, Math.round((Number(count || 0) / maxDailyWinCount.value) * 100))}%`
}

const getSourceBarWidth = (count) => {
  return `${Math.max(3, Math.round((Number(count || 0) / maxSourceCount.value) * 100))}%`
}

const getWinRateBarHeight = (rate) => {
  return `${Math.max(6, Math.min(100, Math.round(Number(rate || 0))))}%`
}

const fetchReports = async (options = {}) => {
  const silent = options?.silent === true

  if (reportRefreshing.value) {
    return
  }

  reportRefreshing.value = true

  if (!silent) {
    loading.value = true
  }

  try {
    const commonParams = {
      startDate: filters.value.startDate,
      endDate: filters.value.endDate,
      campaignId: filters.value.campaignId,
      tenantId: filters.value.tenantId,
      keyword: filters.value.keyword,
      source: filters.value.source,
      prizeId: filters.value.prizeId,
      serialCode: filters.value.serialCode
    }

    const [summaryRes, dailyRes, playRes, rewardRes, prizePerformanceRes] = await Promise.all([
      getReportSummaryApi({
        ...commonParams,
        isWin: filters.value.isWin,
        status: filters.value.status
      }),
      getReportDailyApi({
        ...commonParams,
        isWin: filters.value.isWin
      }),
      getPlayRecordsApi({
        ...commonParams,
        isWin: filters.value.isWin,
        page: filters.value.playPage,
        pageSize: filters.value.pageSize
      }),
      getRewardRecordsApi({
        ...commonParams,
        status: filters.value.status,
        page: filters.value.rewardPage,
        pageSize: filters.value.pageSize
      }),
      http.get('/admin/reports/prize-performance', {
        params: {
          ...commonParams,
          isWin: filters.value.isWin,
          status: filters.value.status,
          page: filters.value.prizePage,
          pageSize: filters.value.pageSize
        }
      })
    ])

    summary.value = {
      ...emptySummary(),
      ...(apiData(summaryRes, {}) || {})
    }

    dailyRows.value = safeArray(apiData(dailyRes, []))
    playRows.value = safeArray(apiData(playRes, []))
    rewardRows.value = safeArray(apiData(rewardRes, []))
    const prizePayload = apiData(prizePerformanceRes, [])
    prizePerformanceRows.value = Array.isArray(prizePayload)
      ? safeArray(prizePayload)
      : safeArray(prizePayload?.items)
    prizeRankingRows.value = Array.isArray(prizePayload)
      ? safeArray(prizePayload)
      : safeArray(prizePayload?.topRows)

    const prizeP = Array.isArray(prizePayload) ? {} : (prizePayload?.pagination || {})
    prizePagination.value = {
      page: Number(prizeP.page || filters.value.prizePage || 1),
      pageSize: Number(prizeP.pageSize || filters.value.pageSize || 10),
      total: Number(prizeP.total || prizePerformanceRows.value.length || 0),
      totalPages: Number(prizeP.totalPages || 1)
    }

    const playP = playRes?.data?.pagination || {}
    playPagination.value = {
      page: Number(playP.page || filters.value.playPage || 1),
      pageSize: Number(playP.pageSize || filters.value.pageSize || 10),
      total: Number(playP.total || 0),
      totalPages: Number(playP.totalPages || 1)
    }

    const rewardP = rewardRes?.data?.pagination || {}
    rewardPagination.value = {
      page: Number(rewardP.page || filters.value.rewardPage || 1),
      pageSize: Number(rewardP.pageSize || filters.value.pageSize || 10),
      total: Number(rewardP.total || 0),
      totalPages: Number(rewardP.totalPages || 1)
    }
    lastReportRefreshAt.value = new Date().toLocaleTimeString('zh-TW', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch (error) {
    console.error('取得報表資料失敗', error)

    if (!silent) {
      alert(error?.response?.data?.message || '取得報表資料失敗')
    }
    summary.value = emptySummary()
    dailyRows.value = []
    playRows.value = []
    rewardRows.value = []
    prizePerformanceRows.value = []
    prizeRankingRows.value = []
    playPagination.value = { page: 1, pageSize: filters.value.pageSize, total: 0, totalPages: 1 }
    rewardPagination.value = { page: 1, pageSize: filters.value.pageSize, total: 0, totalPages: 1 }
    prizePagination.value = { page: 1, pageSize: filters.value.pageSize, total: 0, totalPages: 1 }
  } finally {
    reportRefreshing.value = false

    if (!silent) {
      loading.value = false
    }
  }
}

const totalDailyRows = computed(() => dailyRows.value.length)
const totalPlayRows = computed(() => playPagination.value.total)
const totalRewardRows = computed(() => rewardPagination.value.total)
const totalPrizePerformanceRows = computed(() => prizePagination.value.total)

const getPageStart = (pager) => {
  if (!pager?.total) return 0
  return (Number(pager.page || 1) - 1) * Number(pager.pageSize || filters.value.pageSize || 10) + 1
}

const getPageEnd = (pager) => {
  const end = Number(pager?.page || 1) * Number(pager?.pageSize || filters.value.pageSize || 10)
  return Math.min(end, Number(pager?.total || 0))
}

const playPageStart = computed(() => getPageStart(playPagination.value))
const playPageEnd = computed(() => getPageEnd(playPagination.value))
const rewardPageStart = computed(() => getPageStart(rewardPagination.value))
const rewardPageEnd = computed(() => getPageEnd(rewardPagination.value))
const prizePageStart = computed(() => getPageStart(prizePagination.value))
const prizePageEnd = computed(() => getPageEnd(prizePagination.value))

const isPlatformReport = computed(() => {
  return ['ALL', 'PLATFORM_TENANT'].includes(String(summary.value?.scope || '').toUpperCase())
})

const selectedTenantName = computed(() => {
  return summary.value?.selectedTenant?.name || tenantOptions.value.find((item) => String(item.id) === String(filters.value.tenantId))?.name || ''
})

const reportScopeText = computed(() => {
  const scope = String(summary.value?.scope || '').toUpperCase()

  if (scope === 'ALL') return '平台總管理員目前檢視全部商家的合併資料'
  if (scope === 'PLATFORM_TENANT') return `平台總管理員目前檢視「${selectedTenantName.value || '指定商家'}」的資料`

  return '目前只顯示此商家的資料'
})

const fetchTenantOptions = async () => {
  try {
    const response = await http.get('/admin/reports/tenants')
    const data = response?.data?.data || response?.data || {}
    tenantOptions.value = safeArray(data.tenants)
  } catch (error) {
    console.error('取得商家篩選清單失敗', error)
    tenantOptions.value = []
  }
}

const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}

const getRewardStatusText = (status) => {
  const value = String(status || '').toUpperCase()

  if (value === 'CLAIMED') return '已核銷'
  if (value === 'CANCELLED') return '已取消'
  if (value === 'PENDING') return '待發獎'

  return value || '—'
}

const getRewardWinner = (row) => {
  return row?.winnerName || row?.winnerPhone || row?.winnerEmail || '—'
}

const getRewardSerialCode = (row) => {
  return row?.playRecord?.serialCode?.code || row?.serialCode?.code || '—'
}

const getRewardSource = (row) => {
  const payload = row?.playRecord?.resultPayload || {}
  const source = String(payload.source || payload.trafficSource || 'direct').toLowerCase()

  return sourceLabelMap[source] || '一般 / 直接'
}

const getPlaySource = (row) => {
  const payload = row?.resultPayload || {}
  const source = String(payload.source || payload.trafficSource || 'direct').toLowerCase()

  return sourceLabelMap[source] || '一般 / 直接'
}

const getPlayResultText = (row) => (row?.isWin ? '中獎' : '未中獎')

const getPlaySerialCode = (row) => row?.serialCode?.code || '—'


const getPlayPlayer = (row) => {
  return row?.playerName || row?.playerPhone || row?.playerEmail || '未填玩家資料'
}

const getCampaignTitle = (row) => {
  return row?.campaign?.title || row?.campaignTitle || '未命名活動'
}

const getPrizeTitle = (row) => {
  return row?.prize?.title || row?.prizeTitle || '未命名獎項'
}

const getPlayRowClass = (row = {}) => {
  return row.isWin
    ? 'border-emerald-100 bg-emerald-50/50'
    : 'border-slate-100 bg-white'
}

const getRewardStatusClass = (status) => {
  const value = String(status || '').toUpperCase()

  if (value === 'CLAIMED') return 'bg-blue-100 text-blue-700 border-blue-200'
  if (value === 'PENDING') return 'bg-amber-100 text-amber-700 border-amber-200'
  if (value === 'CANCELLED') return 'bg-slate-100 text-slate-500 border-slate-200'

  return 'bg-slate-100 text-slate-600 border-slate-200'
}

const getRewardRowClass = (row = {}) => {
  const status = String(row.status || '').toUpperCase()

  if (status === 'PENDING') return 'border-amber-100 bg-amber-50/50'
  if (status === 'CLAIMED') return 'border-blue-100 bg-blue-50/40'
  return 'border-slate-100 bg-white'
}

const getRecordSourceBadgeClass = (source = '') => {
  const value = String(source || '').toLowerCase()

  if (value.includes('line')) return 'bg-emerald-50 text-emerald-700'
  if (value.includes('facebook')) return 'bg-blue-50 text-blue-700'
  if (value.includes('instagram')) return 'bg-rose-50 text-rose-700'

  return 'bg-slate-100 text-slate-600'
}

const getStockWarningText = (row) => {
  const remainStock = Number(row?.remainStock || 0)
  const status = String(row?.prizeStatus || '').toUpperCase()

  if (status !== 'ACTIVE') return '未啟用'
  if (remainStock <= 0 && String(row?.prizeType || '').toUpperCase() !== 'LOSE') return '庫存已空'
  if (remainStock <= 5 && String(row?.prizeType || '').toUpperCase() !== 'LOSE') return '庫存偏低'
  return '正常'
}

const getStockWarningClass = (row) => {
  const text = getStockWarningText(row)

  if (text === '庫存已空') return 'bg-rose-100 text-rose-700'
  if (text === '庫存偏低') return 'bg-amber-100 text-amber-700'
  if (text === '未啟用') return 'bg-slate-100 text-slate-500'
  return 'bg-emerald-100 text-emerald-700'
}

const buildExportParams = () => ({
  startDate: filters.value.startDate,
  endDate: filters.value.endDate,
  keyword: filters.value.keyword,
  status: filters.value.status,
  source: filters.value.source,
  isWin: filters.value.isWin,
  prizeId: filters.value.prizeId,
  serialCode: filters.value.serialCode,
  campaignId: filters.value.campaignId,
  tenantId: filters.value.tenantId
})

const buildDownloadUrl = (path, params = {}) => {
  const search = new URLSearchParams(params).toString()
  return `${API_BASE}${path}${search ? `?${search}` : ''}`
}

const downloadPrizePerformanceCsvUrl = (params = {}) => buildDownloadUrl('/admin/reports/prize-performance/csv', params)
const downloadPrizePerformanceXlsxUrl = (params = {}) => buildDownloadUrl('/admin/reports/prize-performance/xlsx', params)

const downloadByFetch = async (url, fallbackFilename) => {
  exporting.value = true

  try {
    const token = localStorage.getItem('token') || ''
    const response = await fetch(url, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `下載失敗：${response.status}`)
    }

    const blob = await response.blob()
    const disposition = response.headers.get('Content-Disposition') || ''
    const filenameMatch = disposition.match(/filename="?([^";]+)"?/i)
    const filename = filenameMatch?.[1] || fallbackFilename
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = objectUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(objectUrl)
  } catch (error) {
    console.error('匯出失敗', error)
    alert(error?.message || '匯出失敗')
  } finally {
    exporting.value = false
  }
}

const exportRewardsCsv = () => {
  downloadByFetch(downloadRewardsCsvUrl(buildExportParams()), 'reward-records.csv')
}

const exportRewardsXlsx = () => {
  downloadByFetch(downloadRewardsXlsxUrl(buildExportParams()), 'reward-records.xlsx')
}

const exportPlayCsv = () => {
  downloadByFetch(downloadPlayRecordsCsvUrl(buildExportParams()), 'play-records.csv')
}

const exportPlayXlsx = () => {
  downloadByFetch(downloadPlayRecordsXlsxUrl(buildExportParams()), 'play-records.xlsx')
}

const exportPrizePerformanceCsv = () => {
  downloadByFetch(downloadPrizePerformanceCsvUrl(buildExportParams()), 'prize-performance.csv')
}

const exportPrizePerformanceXlsx = () => {
  downloadByFetch(downloadPrizePerformanceXlsxUrl(buildExportParams()), 'prize-performance.xlsx')
}

const applyFilters = async () => {
  filters.value.playPage = 1
  filters.value.rewardPage = 1
  filters.value.prizePage = 1
  await fetchReports()
}

const clearFilters = async () => {
  filters.value = {
    startDate: '',
    endDate: '',
    keyword: '',
    status: '',
    source: '',
    isWin: '',
    prizeId: '',
    serialCode: '',
    campaignId: '',
    tenantId: '',
    playPage: 1,
    rewardPage: 1,
    prizePage: 1,
    pageSize: filters.value.pageSize || 10
  }

  await fetchReports()
}

const getPagerKey = (type = 'reward') => {
  if (type === 'play') return 'playPage'
  if (type === 'prize') return 'prizePage'
  return 'rewardPage'
}

const getPagerByType = (type = 'reward') => {
  if (type === 'play') return playPagination.value
  if (type === 'prize') return prizePagination.value
  return rewardPagination.value
}

const goPrevPage = async (type = 'reward') => {
  const key = getPagerKey(type)

  if (filters.value[key] > 1) {
    filters.value[key] -= 1
    await fetchReports()
  }
}

const goNextPage = async (type = 'reward') => {
  const key = getPagerKey(type)
  const pager = getPagerByType(type)

  if (filters.value[key] < pager.totalPages) {
    filters.value[key] += 1
    await fetchReports()
  }
}

const changePageSize = async () => {
  filters.value.playPage = 1
  filters.value.rewardPage = 1
  filters.value.prizePage = 1
  await fetchReports()
}

const queryBadges = computed(() => {
  const badges = []

  if (selectedTenantName.value) badges.push(`商家：${selectedTenantName.value}`)
  if (filters.value.startDate || filters.value.endDate) badges.push(currentDateRangeText.value.replace('目前查詢期間：', '日期：'))
  if (filters.value.keyword) badges.push(`關鍵字：${filters.value.keyword}`)
  if (filters.value.source) badges.push(`來源：${sourceFilterOptions.find((item) => item.value === filters.value.source)?.label || filters.value.source}`)
  if (filters.value.isWin) badges.push(`結果：${winFilterOptions.find((item) => item.value === filters.value.isWin)?.label || filters.value.isWin}`)
  if (filters.value.status) badges.push(`發獎：${rewardStatusOptions.find((item) => item.value === filters.value.status)?.label || filters.value.status}`)
  if (filters.value.campaignId) badges.push(`活動 ID：${filters.value.campaignId}`)
  if (filters.value.prizeId) badges.push(`獎項 ID：${filters.value.prizeId}`)
  if (filters.value.serialCode) badges.push(`序號：${filters.value.serialCode}`)

  return badges.length ? badges : ['目前未套用進階查詢條件']
})

const toggleReportSection = (key) => {
  reportSectionsOpen.value[key] = !reportSectionsOpen.value[key]
}

const setAllReportSections = (isOpen) => {
  reportSectionsOpen.value = {
    prizePerformance: isOpen,
    dailyStats: isOpen,
    playRecords: isOpen,
    rewardRecords: isOpen
  }
}

const getSectionToggleText = (key) => {
  return reportSectionsOpen.value[key] ? '收合' : '展開'
}

const getSectionToggleIcon = (key) => {
  return reportSectionsOpen.value[key] ? '▲' : '▼'
}

const reportRefreshStatusText = computed(() => {
  if (reportRefreshing.value) return '更新中…'

  return lastReportRefreshAt.value
    ? `最後更新：${lastReportRefreshAt.value}`
    : '尚未更新'
})

const handleManualReportRefresh = async () => {
  await fetchReports()
}

const stopReportAutoRefresh = () => {
  if (reportAutoRefreshTimer.value) {
    window.clearInterval(reportAutoRefreshTimer.value)
    reportAutoRefreshTimer.value = null
  }
}

const startReportAutoRefresh = () => {
  if (typeof window === 'undefined') return

  stopReportAutoRefresh()

  reportAutoRefreshTimer.value = window.setInterval(() => {
    fetchReports({ silent: true })
  }, REPORT_AUTO_REFRESH_MS)
}

onMounted(async () => {
  loadSavedQueries()
  await fetchTenantOptions()
  await fetchReports()
  startReportAutoRefresh()
})

onUnmounted(() => {
  stopReportAutoRefresh()
})
</script>

<template>
  <div class="space-y-8">
    <section class="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
      <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.35em] text-indigo-500">Tenant Reports</p>
          <h2 class="mt-2 text-3xl font-black text-slate-900">報表中心</h2>
          <p class="mt-2 text-slate-500">
            查看活動摘要、每日統計、來源成效與發獎紀錄。{{ reportScopeText }}。
          </p>
          <div class="mt-4 inline-flex rounded-2xl px-4 py-2 text-sm font-black" :class="isPlatformReport ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'">
            {{ isPlatformReport ? '平台總管理員報表' : '商家報表' }}
          </div>
        </div>

        <div class="flex flex-wrap gap-3">
          <button
            @click="handleManualReportRefresh"
            class="rounded-2xl bg-slate-900 px-6 py-3 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="reportRefreshing"
          >
            {{ reportRefreshing ? '更新中…' : '重新整理' }}
          </button>
          <div class="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700">
            每 30 秒自動更新｜{{ reportRefreshStatusText }}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div class="text-sm text-slate-500">活動總數</div>
          <div class="mt-2 text-4xl font-black text-slate-900">{{ summary.totalCampaigns ?? 0 }}</div>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div class="text-sm text-slate-500">遊玩總數</div>
          <div class="mt-2 text-4xl font-black text-slate-900">{{ summary.totalPlayRecords ?? 0 }}</div>
        </div>

        <div class="rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
          <div class="text-sm text-emerald-700">中獎數</div>
          <div class="mt-2 text-4xl font-black text-emerald-700">{{ summary.totalWins ?? 0 }}</div>
        </div>

        <div class="rounded-3xl border border-amber-100 bg-amber-50 p-6">
          <div class="text-sm text-amber-700">待發獎</div>
          <div class="mt-2 text-4xl font-black text-amber-700">{{ summary.pendingRewards ?? 0 }}</div>
        </div>

        <div class="rounded-3xl border border-blue-100 bg-blue-50 p-6">
          <div class="text-sm text-blue-700">已核銷</div>
          <div class="mt-2 text-4xl font-black text-blue-700">{{ summary.claimedRewards ?? 0 }}</div>
        </div>

        <div class="rounded-3xl border border-rose-100 bg-rose-50 p-6">
          <div class="text-sm text-rose-700">中獎率</div>
          <div class="mt-2 text-4xl font-black text-rose-700">{{ summary.winRate ?? 0 }}%</div>
        </div>
      </div>
    </section>

    <section class="rounded-[32px] border border-cyan-100 bg-cyan-50/60 p-8 shadow-sm">
      <div class="mb-6 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.35em] text-cyan-600">Traffic Source</p>
          <h3 class="mt-2 text-2xl font-black text-slate-900">來源成效統計</h3>
          <p class="mt-2 text-sm text-slate-500">
            依第 22 批分享連結的 <span class="font-bold text-slate-700">?from=</span> 參數統計玩家來源。
          </p>
        </div>
        <div class="rounded-2xl bg-white px-5 py-3 text-sm font-black text-cyan-700 shadow-sm">
          總來源筆數：{{ summary.sourceStats?.total || 0 }}
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="item in sourceStats"
          :key="item.key"
          class="rounded-3xl border border-cyan-100 bg-white p-6 shadow-sm"
        >
          <div class="flex items-center justify-between gap-3">
            <div>
              <div class="text-sm font-bold text-slate-500">{{ item.label }}</div>
              <div class="mt-2 text-4xl font-black text-slate-900">{{ item.count }}</div>
            </div>
            <div class="rounded-2xl bg-cyan-50 px-4 py-2 text-lg font-black text-cyan-700">
              {{ item.percent }}%
            </div>
          </div>
          <div class="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              class="h-full rounded-full bg-cyan-500"
              :style="{ width: `${Math.min(100, Math.max(0, item.percent || 0))}%` }"
            ></div>
          </div>
        </div>
      </div>
    </section>


    <section class="rounded-[32px] border border-indigo-100 bg-white p-8 shadow-sm">
      <div class="mb-6 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.35em] text-indigo-500">Visual Analytics</p>
          <h3 class="mt-2 text-2xl font-black text-slate-900">圖表視覺化</h3>
          <p class="mt-2 text-sm text-slate-500">
            圖表會依照目前商家與日期篩選自動更新，方便快速判斷遊玩趨勢、來源成效與中獎率。
          </p>
        </div>
        <div class="rounded-2xl bg-indigo-50 px-5 py-3 text-sm font-black text-indigo-700">
          顯示最近 {{ latestDailyChartRows.length }} 天
        </div>
      </div>

      <div v-if="!hasChartData && !loading" class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
        目前篩選條件下沒有可視覺化資料。
      </div>

      <div v-else class="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div class="mb-5 flex items-center justify-between gap-3">
            <div>
              <h4 class="text-lg font-black text-slate-900">每日遊玩 / 中獎</h4>
              <p class="mt-1 text-xs text-slate-500">深色為遊玩數，淺色為中獎數。</p>
            </div>
          </div>

          <div class="flex h-64 items-end gap-3 overflow-x-auto rounded-2xl bg-white p-4">
            <div
              v-for="row in latestDailyChartRows"
              :key="`daily-chart-${row.date}`"
              class="flex min-w-[44px] flex-1 flex-col items-center gap-2"
            >
              <div class="flex h-44 w-full items-end justify-center gap-1 rounded-xl bg-slate-100 px-2 py-2">
                <div
                  class="w-3 rounded-t-full bg-slate-800 transition-all"
                  :style="{ height: getPlayBarHeight(row.playCount) }"
                  :title="`遊玩 ${row.playCount}`"
                ></div>
                <div
                  class="w-3 rounded-t-full bg-emerald-400 transition-all"
                  :style="{ height: getWinBarHeight(row.winCount) }"
                  :title="`中獎 ${row.winCount}`"
                ></div>
              </div>
              <div class="text-center text-[11px] font-bold text-slate-500">{{ row.dateLabel }}</div>
              <div class="text-center text-[11px] text-slate-400">{{ row.playCount }} / {{ row.winCount }}</div>
            </div>
          </div>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div class="mb-5">
            <h4 class="text-lg font-black text-slate-900">來源成效排行</h4>
            <p class="mt-1 text-xs text-slate-500">依分享來源統計遊玩紀錄。</p>
          </div>

          <div class="space-y-4 rounded-2xl bg-white p-4">
            <div v-for="item in sourceStats" :key="`source-chart-${item.key}`" class="space-y-2">
              <div class="flex items-center justify-between gap-3 text-sm">
                <span class="font-black text-slate-700">{{ item.label }}</span>
                <span class="font-black text-slate-900">{{ item.count }} 筆・{{ item.percent }}%</span>
              </div>
              <div class="h-4 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-cyan-500 transition-all"
                  :style="{ width: getSourceBarWidth(item.count) }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div class="mb-5">
            <h4 class="text-lg font-black text-slate-900">每日中獎率</h4>
            <p class="mt-1 text-xs text-slate-500">每日中獎數 ÷ 每日遊玩數。</p>
          </div>

          <div class="flex h-64 items-end gap-3 overflow-x-auto rounded-2xl bg-white p-4">
            <div
              v-for="row in latestDailyChartRows"
              :key="`rate-chart-${row.date}`"
              class="flex min-w-[44px] flex-1 flex-col items-center gap-2"
            >
              <div class="flex h-44 w-full items-end justify-center rounded-xl bg-slate-100 px-2 py-2">
                <div
                  class="w-5 rounded-t-full bg-rose-400 transition-all"
                  :style="{ height: getWinRateBarHeight(row.winRate) }"
                  :title="`中獎率 ${row.winRate}%`"
                ></div>
              </div>
              <div class="text-center text-[11px] font-bold text-slate-500">{{ row.dateLabel }}</div>
              <div class="text-center text-[11px] text-slate-400">{{ row.winRate }}%</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
      <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 class="text-2xl font-black text-slate-900">查詢條件</h3>
          <p class="mt-2 text-slate-500">可依商家、日期、活動 ID、關鍵字與發獎狀態篩選資料；匯出會自動套用目前條件。</p>
        </div>

        <div class="flex flex-wrap gap-3">
          <button
            @click="exportPlayCsv"
            :disabled="exporting"
            class="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            匯出遊玩 CSV
          </button>
          <button
            @click="exportPlayXlsx"
            :disabled="exporting"
            class="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            匯出遊玩 XLSX
          </button>
          <button
            @click="exportRewardsCsv"
            :disabled="exporting"
            class="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            匯出發獎 CSV
          </button>
          <button
            @click="exportRewardsXlsx"
            :disabled="exporting"
            class="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            匯出發獎 XLSX
          </button>
          <button
            @click="exportPrizePerformanceCsv"
            :disabled="exporting"
            class="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3 font-bold text-violet-700 hover:bg-violet-100 disabled:opacity-50"
          >
            匯出獎項 CSV
          </button>
          <button
            @click="exportPrizePerformanceXlsx"
            :disabled="exporting"
            class="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3 font-bold text-violet-700 hover:bg-violet-100 disabled:opacity-50"
          >
            匯出獎項 XLSX
          </button>
        </div>
      </div>

      <div class="mb-6 rounded-3xl border border-indigo-100 bg-indigo-50/60 p-5">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.25em] text-indigo-500">Date Range</p>
            <h4 class="mt-1 text-lg font-black text-slate-900">日期快速篩選</h4>
            <p class="mt-1 text-sm font-semibold text-slate-500">{{ currentDateRangeText }}</p>
          </div>
          <button
            @click="clearDateRange"
            class="rounded-2xl border border-indigo-200 bg-white px-5 py-3 text-sm font-black text-indigo-700 transition hover:bg-indigo-50"
          >
            清除日期
          </button>
        </div>

        <div class="mt-4 flex flex-wrap gap-3">
          <button
            v-for="preset in dateQuickRanges"
            :key="preset.key"
            @click="applyDatePreset(preset)"
            class="rounded-2xl px-5 py-3 text-sm font-black transition"
            :class="activeDatePreset === preset.key ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'border border-indigo-100 bg-white text-slate-700 hover:bg-indigo-50'"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>

      <div class="mb-6 rounded-3xl border border-amber-100 bg-amber-50/70 p-5">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.25em] text-amber-600">Saved Queries</p>
            <h4 class="mt-1 text-lg font-black text-slate-900">常用查詢收藏</h4>
            <p class="mt-1 text-sm text-slate-500">可把目前商家、日期、來源、序號、結果等條件保存起來，下次一鍵套用。</p>
          </div>

          <div class="flex flex-wrap gap-3">
            <button
              @click="saveCurrentQuery"
              class="rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-white transition hover:bg-amber-600"
            >
              儲存目前查詢
            </button>
            <button
              @click="savedQueriesOpen = !savedQueriesOpen"
              class="rounded-2xl border border-amber-200 bg-white px-5 py-3 text-sm font-black text-amber-700 transition hover:bg-amber-50"
            >
              {{ savedQueriesOpen ? '收合收藏' : '展開收藏' }}
            </button>
          </div>
        </div>

        <div v-if="savedQueriesOpen" class="mt-5">
          <div v-if="!savedQueries.length" class="rounded-2xl border border-dashed border-amber-200 bg-white/70 p-5 text-sm font-semibold text-slate-500">
            目前尚未儲存常用查詢。先設定查詢條件後，點「儲存目前查詢」即可建立收藏。
          </div>

          <div v-else class="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div
              v-for="item in savedQueries"
              :key="item.id"
              class="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm"
            >
              <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div class="min-w-0">
                  <h5 class="truncate text-base font-black text-slate-900">{{ item.name }}</h5>
                  <p class="mt-2 text-sm font-semibold leading-6 text-slate-500">{{ getSavedQuerySummary(item) }}</p>
                  <p class="mt-2 text-xs font-bold text-slate-400">建立時間：{{ formatDateTime(item.createdAt) }}</p>
                </div>

                <div class="flex shrink-0 gap-2">
                  <button
                    @click="applySavedQuery(item)"
                    class="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-black text-white transition hover:bg-slate-800"
                  >
                    套用
                  </button>
                  <button
                    @click="deleteSavedQuery(item.id)"
                    class="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-2 text-sm font-black text-rose-600 transition hover:bg-rose-100"
                  >
                    刪除
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-3xl border border-slate-200 bg-white p-5">
        <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h4 class="text-lg font-black text-slate-900">查詢條件</h4>
            <p class="mt-1 text-sm text-slate-500">先用基本查詢快速縮小資料，資料量大時再展開進階查詢。</p>
          </div>
          <button
            @click="advancedFiltersOpen = !advancedFiltersOpen"
            class="rounded-2xl border border-slate-300 bg-slate-50 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100"
          >
            {{ advancedFiltersOpen ? '收合進階查詢' : '展開進階查詢' }}
          </button>
        </div>

        <div class="grid grid-cols-1 gap-5 lg:grid-cols-4">
          <div v-if="isPlatformReport">
            <label class="mb-2 block text-sm font-bold text-slate-700">商家篩選</label>
            <select
              v-model="filters.tenantId"
              class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="">全部商家</option>
              <option
                v-for="tenant in tenantOptions"
                :key="tenant.id"
                :value="String(tenant.id)"
              >
                {{ tenant.name }} / {{ tenant.slug }}
              </option>
            </select>
          </div>

          <div>
            <label class="mb-2 block text-sm font-bold text-slate-700">開始日期</label>
            <input
              v-model="filters.startDate"
              type="date"
              class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label class="mb-2 block text-sm font-bold text-slate-700">結束日期</label>
            <input
              v-model="filters.endDate"
              type="date"
              class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label class="mb-2 block text-sm font-bold text-slate-700">關鍵字</label>
            <input
              v-model="filters.keyword"
              type="text"
              placeholder="姓名 / 電話 / Email / 序號 / 獎項"
              class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div v-if="advancedFiltersOpen" class="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-4">
          <div>
            <label class="mb-2 block text-sm font-bold text-slate-700">活動 ID</label>
            <input
              v-model="filters.campaignId"
              type="number"
              min="1"
              placeholder="例如：13"
              class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label class="mb-2 block text-sm font-bold text-slate-700">獎項 ID</label>
            <input
              v-model="filters.prizeId"
              type="number"
              min="1"
              placeholder="例如：5"
              class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label class="mb-2 block text-sm font-bold text-slate-700">序號</label>
            <input
              v-model="filters.serialCode"
              type="text"
              placeholder="例如：888888"
              class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label class="mb-2 block text-sm font-bold text-slate-700">來源</label>
            <select
              v-model="filters.source"
              class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            >
              <option v-for="item in sourceFilterOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </div>

          <div>
            <label class="mb-2 block text-sm font-bold text-slate-700">遊玩結果</label>
            <select
              v-model="filters.isWin"
              class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            >
              <option v-for="item in winFilterOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </div>

          <div>
            <label class="mb-2 block text-sm font-bold text-slate-700">發獎狀態</label>
            <select
              v-model="filters.status"
              class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            >
              <option v-for="item in rewardStatusOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </div>

          <div>
            <label class="mb-2 block text-sm font-bold text-slate-700">每頁筆數</label>
            <select
              v-model.number="filters.pageSize"
              @change="changePageSize"
              class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            >
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </div>
        </div>

        <div class="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex flex-wrap gap-2">
            <span
              v-for="badge in queryBadges"
              :key="badge"
              class="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600"
            >
              {{ badge }}
            </span>
          </div>

          <div class="flex flex-wrap gap-3">
            <button
              @click="saveCurrentQuery"
              class="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-3 font-bold text-amber-700 transition hover:bg-amber-100"
            >
              儲存查詢
            </button>
            <button
              @click="applyFilters"
              class="rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700"
            >
              套用查詢
            </button>
            <button
              @click="clearFilters"
              class="rounded-2xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
            >
              清除條件
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Report Sections</p>
          <h3 class="mt-2 text-2xl font-black text-slate-900">報表區塊顯示控制</h3>
          <p class="mt-2 text-sm font-bold text-slate-500">
            資料太多時，可以只展開目前要看的區塊，畫面會比較簡潔。
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            @click="setAllReportSections(true)"
          >
            全部展開
          </button>
          <button
            type="button"
            class="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            @click="setAllReportSections(false)"
          >
            全部收合
          </button>
        </div>
      </div>

      <div class="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          class="rounded-2xl border px-4 py-3 text-left text-sm font-black transition"
          :class="reportSectionsOpen.prizePerformance ? 'border-violet-200 bg-violet-50 text-violet-700' : 'border-slate-200 bg-white text-slate-500'"
          @click="toggleReportSection('prizePerformance')"
        >
          🎁 獎項成效統計｜{{ getSectionToggleText('prizePerformance') }}
        </button>
        <button
          type="button"
          class="rounded-2xl border px-4 py-3 text-left text-sm font-black transition"
          :class="reportSectionsOpen.dailyStats ? 'border-cyan-200 bg-cyan-50 text-cyan-700' : 'border-slate-200 bg-white text-slate-500'"
          @click="toggleReportSection('dailyStats')"
        >
          📅 每日遊玩統計｜{{ getSectionToggleText('dailyStats') }}
        </button>
        <button
          type="button"
          class="rounded-2xl border px-4 py-3 text-left text-sm font-black transition"
          :class="reportSectionsOpen.playRecords ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500'"
          @click="toggleReportSection('playRecords')"
        >
          🎮 遊玩紀錄｜{{ getSectionToggleText('playRecords') }}
        </button>
        <button
          type="button"
          class="rounded-2xl border px-4 py-3 text-left text-sm font-black transition"
          :class="reportSectionsOpen.rewardRecords ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-500'"
          @click="toggleReportSection('rewardRecords')"
        >
          🏆 中獎 / 發獎紀錄｜{{ getSectionToggleText('rewardRecords') }}
        </button>
      </div>
    </section>

    <section class="rounded-[32px] border border-violet-100 bg-white p-8 shadow-sm">
      <div class="mb-6 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.35em] text-violet-500">Prize Performance</p>
          <h3 class="mt-2 text-2xl font-black text-slate-900">獎項成效統計</h3>
          <p class="mt-2 text-slate-500">
            依目前商家與日期篩選統計各獎項的中獎、發放、核銷與庫存狀態。
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="reportRefreshing"
            @click="handleManualReportRefresh"
          >
            {{ reportRefreshing ? '更新中…' : '重新整理' }}
          </button>
          <div class="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700">
            每 30 秒自動更新｜{{ reportRefreshStatusText }}
          </div>
          <div class="rounded-2xl bg-violet-50 px-5 py-3 text-sm font-black text-violet-700">
            目前顯示 {{ prizePageStart }} - {{ prizePageEnd }} 筆，共 {{ totalPrizePerformanceRows }} 筆
          </div>
          <button
            type="button"
            class="rounded-2xl border border-violet-200 bg-white px-5 py-3 text-sm font-black text-violet-700 transition hover:bg-violet-50"
            @click="toggleReportSection('prizePerformance')"
          >
            {{ getSectionToggleIcon('prizePerformance') }} {{ getSectionToggleText('prizePerformance') }}
          </button>
        </div>
      </div>

      <div v-show="reportSectionsOpen.prizePerformance" class="space-y-6">
      <div v-if="!hasPrizePerformanceData && !loading" class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
        目前篩選條件下沒有獎項成效資料。
      </div>

      <div v-else class="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div class="rounded-3xl border border-slate-200 bg-slate-50 p-6 xl:col-span-1">
          <h4 class="text-lg font-black text-slate-900">中獎排行</h4>
          <p class="mt-1 text-xs text-slate-500">依中獎次數排序，最多顯示前 8 名。</p>

          <div class="mt-5 space-y-4 rounded-2xl bg-white p-4">
            <div v-for="row in topPrizePerformanceRows" :key="`prize-rank-${row.id}`" class="space-y-2">
              <div class="flex items-center justify-between gap-3 text-sm">
                <span class="font-black text-slate-700">{{ row.prizeTitle || '未命名獎項' }}</span>
                <span class="font-black text-violet-700">{{ row.winCount || 0 }} 次</span>
              </div>
              <div class="h-4 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-violet-500 transition-all"
                  :style="{ width: getPrizeBarWidth(row.winCount) }"
                ></div>
              </div>
              <div class="flex justify-between text-xs text-slate-400">
                <span>{{ row.campaignTitle || '—' }}</span>
                <span>剩餘 {{ row.remainStock ?? 0 }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="overflow-x-auto rounded-3xl border border-slate-200 xl:col-span-2">
          <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead class="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th class="px-5 py-4">獎項</th>
                <th class="px-5 py-4">活動</th>
                <th class="px-5 py-4">中獎</th>
                <th class="px-5 py-4">發放</th>
                <th class="px-5 py-4">已核銷</th>
                <th class="px-5 py-4">待發獎</th>
                <th class="px-5 py-4">剩餘庫存</th>
                <th class="px-5 py-4">中獎率</th>
                <th class="px-5 py-4">庫存狀態</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr v-if="loading">
                <td colspan="9" class="px-5 py-10 text-center text-slate-500">讀取中...</td>
              </tr>
              <tr v-else-if="prizePerformanceRows.length === 0">
                <td colspan="9" class="px-5 py-10 text-center text-slate-500">目前沒有獎項成效資料。</td>
              </tr>
              <tr v-for="row in prizePerformanceRows" v-else :key="row.id" class="hover:bg-slate-50">
                <td class="px-5 py-4 font-black text-slate-900">{{ row.prizeTitle || '—' }}</td>
                <td class="px-5 py-4 text-slate-600">{{ row.campaignTitle || '—' }}</td>
                <td class="px-5 py-4 font-bold text-emerald-700">{{ row.winCount || 0 }}</td>
                <td class="px-5 py-4">{{ row.rewardCount || 0 }}</td>
                <td class="px-5 py-4">{{ row.claimedCount || 0 }}</td>
                <td class="px-5 py-4">{{ row.pendingCount || 0 }}</td>
                <td class="px-5 py-4 font-bold">{{ row.remainStock ?? 0 }}</td>
                <td class="px-5 py-4">{{ row.winRate || 0 }}%</td>
                <td class="px-5 py-4">
                  <span class="rounded-full px-3 py-1 text-xs font-black" :class="getStockWarningClass(row)">
                    {{ getStockWarningText(row) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div class="text-sm font-semibold text-slate-500">
              第 {{ prizePagination.page }} / {{ prizePagination.totalPages }} 頁，每頁 {{ filters.pageSize }} 筆
            </div>
            <div class="flex gap-3">
              <button
                @click="goPrevPage('prize')"
                :disabled="prizePagination.page <= 1"
                class="rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                上一頁
              </button>
              <button
                @click="goNextPage('prize')"
                :disabled="prizePagination.page >= prizePagination.totalPages"
                class="rounded-2xl bg-slate-900 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                下一頁
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>

    <section class="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
      <div class="mb-6 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 class="text-2xl font-black text-slate-900">每日遊玩統計</h3>
          <p class="mt-2 text-slate-500">目前顯示 {{ totalDailyRows }} 天資料。</p>
        </div>

        <button
          type="button"
          class="rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-3 text-sm font-black text-cyan-700 transition hover:bg-cyan-100"
          @click="toggleReportSection('dailyStats')"
        >
          {{ getSectionToggleIcon('dailyStats') }} {{ getSectionToggleText('dailyStats') }}
        </button>
      </div>

      <div v-show="reportSectionsOpen.dailyStats" class="overflow-x-auto rounded-3xl border border-slate-200">
        <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead class="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th class="px-5 py-4">日期</th>
              <th class="px-5 py-4">遊玩數</th>
              <th class="px-5 py-4">中獎數</th>
              <th class="px-5 py-4">活動數</th>
              <th class="px-5 py-4">LINE</th>
              <th class="px-5 py-4">FB</th>
              <th class="px-5 py-4">IG</th>
              <th class="px-5 py-4">一般</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            <tr v-if="loading">
              <td colspan="8" class="px-5 py-10 text-center text-slate-500">讀取中...</td>
            </tr>
            <tr v-else-if="dailyRows.length === 0">
              <td colspan="8" class="px-5 py-10 text-center text-slate-500">目前沒有每日統計資料。</td>
            </tr>
            <tr v-for="row in dailyRows" v-else :key="row.date" class="hover:bg-slate-50">
              <td class="px-5 py-4 font-bold text-slate-900">{{ row.date }}</td>
              <td class="px-5 py-4">{{ row.playCount }}</td>
              <td class="px-5 py-4">{{ row.winCount }}</td>
              <td class="px-5 py-4">{{ row.campaignCount }}</td>
              <td class="px-5 py-4">{{ row.sourceLine || 0 }}</td>
              <td class="px-5 py-4">{{ row.sourceFacebook || 0 }}</td>
              <td class="px-5 py-4">{{ row.sourceInstagram || 0 }}</td>
              <td class="px-5 py-4">{{ row.sourceDirect || 0 }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section
      v-show="activeRecordsPanel === 'play'"
      class="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm"
    >
      <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Play Records</p>
          <h3 class="mt-2 text-2xl font-black text-slate-900">遊玩紀錄</h3>
          <p class="mt-2 text-slate-500">
            目前顯示 {{ playPageStart }} - {{ playPageEnd }} 筆，共 {{ totalPlayRows }} 筆。
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
            @click="toggleReportSection('playRecords')"
          >
            {{ getSectionToggleIcon('playRecords') }} {{ getSectionToggleText('playRecords') }}
          </button>
          <button
            type="button"
            class="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
            @click="filters.isWin = 'WIN'; applyFilters()"
          >
            只看中獎
          </button>
          <button
            type="button"
            class="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            @click="filters.isWin = ''; applyFilters()"
          >
            全部結果
          </button>
        </div>
      </div>

      <div v-show="reportSectionsOpen.playRecords" class="space-y-6">
      <div v-if="loading" class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
        讀取中...
      </div>

      <div v-else-if="playRows.length === 0" class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
        目前沒有遊玩紀錄。
      </div>

      <div v-else class="space-y-3">
        <article
          v-for="row in playRows"
          :key="row.id"
          class="rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          :class="getPlayRowClass(row)"
        >
          <div class="grid gap-4 xl:grid-cols-[1.05fr_1fr_0.9fr_auto] xl:items-center">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white">#{{ row.id }}</span>
                <span
                  class="rounded-full px-3 py-1 text-xs font-black"
                  :class="row.isWin ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'"
                >
                  {{ getPlayResultText(row) }}
                </span>
                <span
                  class="rounded-full px-3 py-1 text-xs font-black"
                  :class="getRecordSourceBadgeClass(getPlaySource(row))"
                >
                  {{ getPlaySource(row) }}
                </span>
              </div>
              <h4 class="mt-3 text-lg font-black text-slate-950">{{ getCampaignTitle(row) }}</h4>
              <p class="mt-1 text-sm font-bold text-slate-500">{{ getPrizeTitle(row) }}</p>
            </div>

            <div class="rounded-2xl border border-slate-100 bg-white/80 p-4">
              <p class="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">序號</p>
              <p class="mt-2 break-all font-mono text-sm font-black text-slate-950">{{ getPlaySerialCode(row) }}</p>
            </div>

            <div class="rounded-2xl border border-slate-100 bg-white/80 p-4 text-sm font-bold leading-6 text-slate-500">
              <p><span class="font-black text-slate-400">玩家：</span>{{ getPlayPlayer(row) }}</p>
              <p><span class="font-black text-slate-400">時間：</span>{{ formatDateTime(row.playedAt) }}</p>
            </div>

            <button
              type="button"
              class="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
              @click="filters.serialCode = getPlaySerialCode(row) === '—' ? '' : getPlaySerialCode(row); applyFilters()"
            >
              查此序號
            </button>
          </div>
        </article>
      </div>

      <div class="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div class="text-sm font-bold text-slate-500">
          第 {{ playPagination.page }} / {{ playPagination.totalPages }} 頁，每頁 {{ filters.pageSize }} 筆
        </div>
        <div class="flex gap-3">
          <button
            @click="goPrevPage('play')"
            :disabled="playPagination.page <= 1"
            class="rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            上一頁
          </button>
          <button
            @click="goNextPage('play')"
            :disabled="playPagination.page >= playPagination.totalPages"
            class="rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            下一頁
          </button>
        </div>
      </div>
      </div>
    </section>

    <section
      v-show="activeRecordsPanel === 'reward'"
      class="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm"
    >
      <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.3em] text-amber-500">Reward Records</p>
          <h3 class="mt-2 text-2xl font-black text-slate-900">中獎 / 發獎紀錄</h3>
          <p class="mt-2 text-slate-500">
            目前顯示 {{ rewardPageStart }} - {{ rewardPageEnd }} 筆，共 {{ totalRewardRows }} 筆。
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-2xl border border-amber-200 bg-white px-5 py-3 text-sm font-black text-amber-700 transition hover:bg-amber-50"
            @click="toggleReportSection('rewardRecords')"
          >
            {{ getSectionToggleIcon('rewardRecords') }} {{ getSectionToggleText('rewardRecords') }}
          </button>
          <button
            type="button"
            class="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-black text-amber-700 transition hover:bg-amber-100"
            @click="filters.status = 'PENDING'; applyFilters()"
          >
            只看待發獎
          </button>
          <button
            type="button"
            class="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-100"
            @click="filters.status = 'CLAIMED'; applyFilters()"
          >
            只看已核銷
          </button>
          <button
            type="button"
            class="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            @click="filters.status = ''; applyFilters()"
          >
            全部發獎
          </button>
        </div>
      </div>

      <div v-show="reportSectionsOpen.rewardRecords" class="space-y-6">
      <div v-if="loading" class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
        讀取中...
      </div>

      <div v-else-if="rewardRows.length === 0" class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
        目前沒有發獎紀錄。
      </div>

      <div v-else class="space-y-3">
        <article
          v-for="row in rewardRows"
          :key="row.id"
          class="rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          :class="getRewardRowClass(row)"
        >
          <div class="grid gap-4 xl:grid-cols-[1.05fr_1fr_0.9fr_auto] xl:items-center">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white">#{{ row.id }}</span>
                <span
                  class="rounded-full border px-3 py-1 text-xs font-black"
                  :class="getRewardStatusClass(row.status)"
                >
                  {{ getRewardStatusText(row.status) }}
                </span>
                <span
                  class="rounded-full px-3 py-1 text-xs font-black"
                  :class="getRecordSourceBadgeClass(getRewardSource(row))"
                >
                  {{ getRewardSource(row) }}
                </span>
              </div>
              <h4 class="mt-3 text-lg font-black text-slate-950">{{ getPrizeTitle(row) }}</h4>
              <p class="mt-1 text-sm font-bold text-slate-500">{{ getCampaignTitle(row) }}</p>
            </div>

            <div class="rounded-2xl border border-slate-100 bg-white/80 p-4">
              <p class="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">得獎序號</p>
              <p class="mt-2 break-all font-mono text-sm font-black text-slate-950">{{ getRewardSerialCode(row) }}</p>
            </div>

            <div class="rounded-2xl border border-slate-100 bg-white/80 p-4 text-sm font-bold leading-6 text-slate-500">
              <p><span class="font-black text-slate-400">得獎者：</span>{{ getRewardWinner(row) }}</p>
              <p><span class="font-black text-slate-400">建立：</span>{{ formatDateTime(row.createdAt) }}</p>
            </div>

            <button
              type="button"
              class="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
              @click="filters.serialCode = getRewardSerialCode(row) === '—' ? '' : getRewardSerialCode(row); applyFilters()"
            >
              查此序號
            </button>
          </div>
        </article>
      </div>

      <div class="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div class="text-sm font-bold text-slate-500">
          第 {{ rewardPagination.page }} / {{ rewardPagination.totalPages }} 頁，每頁 {{ filters.pageSize }} 筆
        </div>
        <div class="flex gap-3">
          <button
            @click="goPrevPage('reward')"
            :disabled="rewardPagination.page <= 1"
            class="rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            上一頁
          </button>
          <button
            @click="goNextPage('reward')"
            :disabled="rewardPagination.page >= rewardPagination.totalPages"
            class="rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            下一頁
          </button>
        </div>
      </div>
      </div>
    </section>
  </div>
</template>
