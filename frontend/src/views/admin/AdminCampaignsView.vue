<script setup>
// Multi Game Platform V2.3
// 第 33601～34000 批：正式網址與序號活動綁定檢查修正版
//
// 覆蓋位置：
// frontend/src/views/admin/AdminCampaignsView.vue
//
// 本批重點：
// 1. 保留既有活動建立 / 序號 / 設定入口。
// 2. 新增正式商家交付中心：三遊戲正式玩家網址、一鍵複製、一鍵開啟。
// 3. 新增客服可直接複製的活動文案。
// 4. 不改 router / DB schema / draw-core。

import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getAdminCampaignsApi,
  createCampaignApi,
  updateCampaignApi,
  deleteCampaignApi
} from '../../api/campaign'
import http from '../../api/http'

const router = useRouter()
const route = useRoute()

const campaigns = ref([])
const serialCodes = ref([])
const loading = ref(false)
const submitting = ref(false)
const lastCreateMode = ref('')
const deletingCampaignId = ref(null)
const quickCreatingGameType = ref('')
const serialLoading = ref(false)
const serialListLoading = ref(false)
const selectedCampaignId = ref('')
const serialSearchKeyword = ref('')
const serialStatusFilter = ref('ALL')
const serialPageSize = ref(20)
const serialCurrentPage = ref(1)
const selectedSerialIds = ref([])
const campaignStatusOverrides = reactive({})

const message = ref('')
const errorMessage = ref('')

const form = reactive({
  title: '',
  gameType: 'GRID',
  description: '',
  startAt: '',
  endAt: '',
  dailyLimit: 1,
  totalLimit: 1,
  status: 'DRAFT',
  requireLogin: false,
  allowedRole: '',
  requiredLevel: '',
  settings: {
    operationMode: 'MERCHANT_SELF_CREATE_GRID',
    requireSerialCode: true,
    serialPrefix: 'GRID',
    playerHint: '請輸入商家提供的序號後開始九宮格抽獎。',
    gridItems: []
  }
})

const serialForm = reactive({
  count: 20,
  prefix: 'GRID',
  batchCode: 'QUICK',
  rewardChance: 1,
  length: 18,
  expiresAt: '',
  note: '九宮格活動序號'
})

const manualSerialForm = reactive({
  code: '',
  rewardChance: 1,
  batchCode: 'MANUAL',
  note: '商家手動指定序號',
  expiresAt: ''
})

const resetMessages = () => {
  message.value = ''
  errorMessage.value = ''
}

const normalizeManualSerialCode = (value) => {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '')
    .toUpperCase()
}

const resetManualSerialForm = () => {
  manualSerialForm.code = ''
  manualSerialForm.rewardChance = 1
  manualSerialForm.batchCode = 'MANUAL'
  manualSerialForm.note = '商家手動指定序號'
  manualSerialForm.expiresAt = ''
}

const localCampaignDrafts = ref([])

const getCurrentTenantSlug = () => {
  const querySlug = route?.query?.tenantSlug
  if (querySlug) return String(querySlug)

  try {
    const rawUser = localStorage.getItem('user') || localStorage.getItem('auth_user') || ''
    const parsed = rawUser ? JSON.parse(rawUser) : null

    return parsed?.tenantSlug || parsed?.tenant?.slug || parsed?.merchantSlug || 'local-shop'
  } catch (error) {
    return 'local-shop'
  }
}

const getCurrentUserRole = () => {
  try {
    const rawUser = localStorage.getItem('user') || localStorage.getItem('auth_user') || ''
    const parsed = rawUser ? JSON.parse(rawUser) : null

    return String(parsed?.role || parsed?.user?.role || '').toUpperCase()
  } catch (error) {
    return ''
  }
}

const isPlatformScopeUser = () => {
  return ['ADMIN', 'SUPER_ADMIN'].includes(getCurrentUserRole())
}

const normalizeTenantSlug = (value) => {
  return String(value || '').trim().toLowerCase()
}

const getCampaignTenantSlug = (campaign) => {
  return normalizeTenantSlug(
    campaign?.tenantSlug ||
      campaign?.tenant?.slug ||
      campaign?.merchantSlug ||
      campaign?.settings?.tenantSlug ||
      campaign?.config?.tenantSlug ||
      ''
  )
}

const isCampaignOwnedByCurrentTenant = (campaign) => {
  if (isPlatformScopeUser()) return true

  const currentSlug = normalizeTenantSlug(getCurrentTenantSlug())
  const campaignSlug = getCampaignTenantSlug(campaign)

  if (!currentSlug || currentSlug === 'local-shop') return true
  if (!campaignSlug) return false

  return campaignSlug === currentSlug
}

const canOperateCampaign = (campaign) => {
  return isCampaignOwnedByCurrentTenant(campaign)
}

const getCampaignOperateHint = (campaign) => {
  if (canOperateCampaign(campaign)) return ''

  return `目前登入商家是 ${getCurrentTenantSlug()}，這筆活動屬於 ${getCampaignTenantSlug(campaign) || '未綁定商家'}，不能操作。`
}

const localDraftStorageKey = computed(() => {
  return `multi-game-local-campaign-drafts:${getCurrentTenantSlug()}`
})

const recentCreatedCampaignStorageKey = computed(() => {
  return `multi-game-recent-created-campaigns:${getCurrentTenantSlug()}`
})

const recentCreatedCampaigns = ref([])
const saveRecentCreatedCampaigns = () => {
  try {
    localStorage.setItem(recentCreatedCampaignStorageKey.value, JSON.stringify(recentCreatedCampaigns.value.slice(0, 20)))
  } catch (error) {
    console.warn('儲存最近建立活動失敗:', error)
  }
}

const loadRecentCreatedCampaigns = () => {
  try {
    const raw = localStorage.getItem(recentCreatedCampaignStorageKey.value)
    const parsed = raw ? JSON.parse(raw) : []

    recentCreatedCampaigns.value = Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.warn('讀取最近建立活動失敗:', error)
    recentCreatedCampaigns.value = []
  }
}

const rememberRecentCreatedCampaign = (campaign) => {
  if (!campaign?.id) return

  const saved = {
    ...campaign,
    sourceType: campaign.sourceType || 'RECENT_CREATED',
    isLocalDraft: false,
    cachedAt: new Date().toISOString()
  }

  recentCreatedCampaigns.value = [
    saved,
    ...recentCreatedCampaigns.value.filter((item) => String(item.id) !== String(saved.id))
  ].slice(0, 20)

  saveRecentCreatedCampaigns()
}

const removeCampaignFromLocalCaches = (campaignId) => {
  const id = String(campaignId)

  localCampaignDrafts.value = localCampaignDrafts.value.filter((item) => String(item.id) !== id)
  recentCreatedCampaigns.value = recentCreatedCampaigns.value.filter((item) => String(item.id) !== id)

  saveLocalCampaignDrafts()
  saveRecentCreatedCampaigns()
}

const removeCampaignFromList = (campaignId) => {
  const id = String(campaignId)

  campaigns.value = campaigns.value.filter((item) => String(item.id) !== id)

  if (String(selectedCampaignId.value) === id) {
    selectedCampaignId.value = campaigns.value[0]?.id || ''
    serialCodes.value = []
    selectedSerialIds.value = []
  }
}

const saveLocalCampaignDrafts = () => {
  try {
    localStorage.setItem(localDraftStorageKey.value, JSON.stringify(localCampaignDrafts.value))
  } catch (error) {
    console.warn('儲存本頁草稿失敗:', error)
  }
}

const loadLocalCampaignDrafts = () => {
  try {
    const raw = localStorage.getItem(localDraftStorageKey.value)
    const parsed = raw ? JSON.parse(raw) : []

    localCampaignDrafts.value = Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.warn('讀取本頁草稿失敗:', error)
    localCampaignDrafts.value = []
  }
}

const isLocalDraftCampaign = (campaign) => {
  return Boolean(campaign?.isLocalDraft || String(campaign?.id || '').startsWith('local-'))
}

const getCampaignSourceText = (campaign) => {
  if (isLocalDraftCampaign(campaign)) return '本頁草稿'
  if (campaign?.sourceType === 'RECENT_CREATED') return '正式資料｜本機保留'

  return '正式資料'
}

const getCampaignSourceClass = (campaign) => {
  if (isLocalDraftCampaign(campaign)) return 'bg-amber-100 text-amber-700'
  if (campaign?.sourceType === 'RECENT_CREATED') return 'bg-blue-100 text-blue-700'

  return 'bg-emerald-100 text-emerald-700'
}

const createLocalCampaignDraft = (payload = {}) => {
  const id = `local-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  const type = String(payload.gameType || 'GRID').toUpperCase()
  const tenantSlug = payload.tenantSlug || route.query.tenantSlug || 'local-shop'

  return {
    ...payload,
    id,
    campaignId: id,
    title: payload.title || getDefaultTitleByGameType(type),
    name: payload.name || payload.title || getDefaultTitleByGameType(type),
    gameType: type,
    status: payload.status || 'DRAFT',
    tenantSlug,
    tenant: {
      slug: tenantSlug,
      name: '目前商家'
    },
    isLocalDraft: true,
    sourceType: 'LOCAL_DRAFT',
    createdAt: new Date().toISOString()
  }
}

const insertCampaignToListAndSelect = (campaign) => {
  if (!campaign?.id) return

  const id = String(campaign.id)
  const exists = campaigns.value.some((item) => String(item.id) === id)

  if (!exists) {
    campaigns.value = [
      campaign,
      ...campaigns.value
    ]
  } else {
    campaigns.value = campaigns.value.map((item) => {
      return String(item.id) === id
        ? {
            ...item,
            ...campaign
          }
        : item
    })
  }

  selectedCampaignId.value = campaign.id

  if (!isLocalDraftCampaign(campaign)) {
    rememberRecentCreatedCampaign(campaign)
    loadSerialList(campaign.id, false)
  } else {
    serialCodes.value = []
    selectedSerialIds.value = []
  }
}

const createLocalDraftAndInsert = (payload, reasonMessage = '') => {
  const localDraft = createLocalCampaignDraft(payload)

  localCampaignDrafts.value = [
    localDraft,
    ...localCampaignDrafts.value.filter((item) => String(item.id) !== String(localDraft.id))
  ]
  saveLocalCampaignDrafts()

  insertCampaignToListAndSelect(localDraft)

  message.value = reasonMessage ||
    `已建立本頁草稿：${localDraft.title}。活動已出現在下方列表；正式使用前請按「重新送出建立」。`

  return localDraft
}

const normalizeCreatedCampaignForList = (created = {}, fallbackPayload = {}) => {
  const id = created?.id || fallbackPayload?.id

  return {
    ...fallbackPayload,
    ...created,
    id,
    title: created?.title || created?.name || fallbackPayload?.title || fallbackPayload?.name || getDefaultTitleByGameType(fallbackPayload?.gameType),
    name: created?.name || created?.title || fallbackPayload?.name || fallbackPayload?.title || getDefaultTitleByGameType(fallbackPayload?.gameType),
    gameType: created?.gameType || fallbackPayload?.gameType || 'GRID',
    status: created?.status || fallbackPayload?.status || 'ACTIVE',
    tenant: created?.tenant || fallbackPayload?.tenant,
    tenantSlug: created?.tenantSlug || created?.tenant?.slug || fallbackPayload?.tenantSlug || getCurrentTenantSlug(),
    isLocalDraft: false,
    sourceType: 'REMOTE'
  }
}

const mergeCampaignsWithLocalDrafts = (items = []) => {
  const remoteIds = new Set(items.map((item) => String(item.id)))

  // 正式資料庫模式：活動列表以後端資料為主。
  // 本頁草稿只保留真正 isLocalDraft 的資料，不再混入 recentCreatedCampaigns，避免不存在 DB 的 ID 進入設定頁。
  return [
    ...localCampaignDrafts.value.filter((item) => {
      return isLocalDraftCampaign(item) && !remoteIds.has(String(item.id))
    }),
    ...items
  ]
}

const filterCampaignsForCurrentTenant = (items = []) => {
  if (isPlatformScopeUser()) return items

  return items.filter((campaign) => isCampaignOwnedByCurrentTenant(campaign))
}

const scrollToCreateForm = () => {
  requestAnimationFrame(() => {
    document.getElementById('merchant-campaign-create-form')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  })
}

const selectSafeCampaignAfterLoad = async () => {
  const supported = merchantGameCampaigns.value
  const selectedExists = supported.some((campaign) => String(campaign.id) === String(selectedCampaignId.value))

  if (!selectedExists) {
    selectedCampaignId.value = supported[0]?.id || ''
  }

  if (selectedCampaignId.value) {
    await loadSerialList(selectedCampaignId.value, false)
    return
  }

  serialCodes.value = []
}

const defaultGridItems = () => [
  { position: 1, title: '折價券', rewardType: 'COUPON', quantity: 50, weight: 20, enabled: true },
  { position: 2, title: '點數', rewardType: 'POINTS', quantity: 100, weight: 20, enabled: true },
  { position: 3, title: '飲品券', rewardType: 'COUPON', quantity: 30, weight: 12, enabled: true },
  { position: 4, title: '小禮物', rewardType: 'GIFT', quantity: 20, weight: 10, enabled: true },
  { position: 5, title: '點擊抽獎', rewardType: 'BUTTON', quantity: 0, weight: 0, enabled: true },
  { position: 6, title: '優惠券', rewardType: 'COUPON', quantity: 80, weight: 25, enabled: true },
  { position: 7, title: '抽獎券', rewardType: 'TICKET', quantity: 20, weight: 8, enabled: true },
  { position: 8, title: '神秘禮', rewardType: 'GIFT', quantity: 10, weight: 4, enabled: true },
  { position: 9, title: '大獎', rewardType: 'GIFT', quantity: 3, weight: 1, enabled: true }
]

form.settings.gridItems = defaultGridItems()

const normalizeResponseData = (response) => {
  const payload = response?.data

  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.data?.items)) return payload.data.items

  return []
}

const normalizeSingleData = (response) => {
  return response?.data?.data || response?.data || null
}

const gridCampaigns = computed(() => {
  return campaigns.value.filter((item) => String(item.gameType || '').toUpperCase() === 'GRID')
})

const merchantGameCampaigns = computed(() => {
  const supportedTypes = ['GRID', 'WHEEL', 'GOLDEN_EGG']

  return campaigns.value.filter((item) => supportedTypes.includes(String(item.gameType || '').toUpperCase()))
})

const selectedGameCampaign = computed(() => {
  return campaigns.value.find((item) => String(item.id) === String(selectedCampaignId.value)) || null
})

const selectedGameType = computed(() => {
  return String(selectedGameCampaign.value?.gameType || 'GRID').toUpperCase()
})

const gameTypeLabelMap = {
  GRID: '九宮格',
  WHEEL: '幸運輪盤',
  GOLDEN_EGG: '砸金蛋',
  SCRATCH: '刮刮卡',
  FLIP: '翻牌'
}

const getGameTypeLabel = (type) => {
  return gameTypeLabelMap[String(type || '').toUpperCase()] || type || '遊戲'
}

const gameTypeOptions = [
  {
    value: 'GRID',
    label: '九宮格',
    description: '適合序號抽獎、九格獎項、百分比機率'
  },
  {
    value: 'WHEEL',
    label: '幸運輪盤',
    description: '適合轉盤折扣券、再玩一次、實體活動'
  },
  {
    value: 'GOLDEN_EGG',
    label: '砸金蛋',
    description: '適合高互動視覺活動、敲蛋中獎'
  }
]

const selectedCampaign = computed(() => {
  return campaigns.value.find((item) => String(item.id) === String(selectedCampaignId.value)) || null
})

const apiBaseUrl = computed(() => {
  return String(http?.defaults?.baseURL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/$/, '')
})

const OFFICIAL_FRONTEND_URL = 'https://marketing-game-v1.vercel.app'

const isLocalFrontHost = () => {
  if (typeof window === 'undefined') return false

  return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
}

const frontOrigin = computed(() => {
  // 第 33601～34000 批：
  // 後台交付中心一律產生「正式可給玩家」網址。
  // 本機 / 手機測試時不要把 localhost 給客人，否則手機會連到自己的 localhost。
  const publicFrontendUrl = String(import.meta.env.VITE_PUBLIC_FRONTEND_URL || '').trim().replace(/\/$/, '')

  if (publicFrontendUrl) {
    return publicFrontendUrl
  }

  if (isLocalFrontHost()) {
    return OFFICIAL_FRONTEND_URL
  }

  if (typeof window === 'undefined') return OFFICIAL_FRONTEND_URL

  return window.location.origin
})

const getCampaignDisplayStatus = (campaign) => {
  const id = String(campaign?.id || '')

  return campaignStatusOverrides[id] || campaign?.status || 'DRAFT'
}

const isCampaignActive = (campaign) => {
  return String(getCampaignDisplayStatus(campaign) || '').toUpperCase() === 'ACTIVE'
}

const getCampaignStatusClass = (campaign) => {
  return isCampaignActive(campaign)
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-amber-100 text-amber-700'
}

const getCampaignStatusText = (campaign) => {
  return String(getCampaignDisplayStatus(campaign) || 'DRAFT').toUpperCase()
}

const serialStats = computed(() => {
  const total = serialCodes.value.length
  const unused = serialCodes.value.filter((item) => String(item.status || '').toUpperCase() === 'UNUSED').length
  const used = serialCodes.value.filter((item) => String(item.status || '').toUpperCase() === 'USED').length
  const issued = serialCodes.value.filter((item) => ['ISSUED', 'SENT'].includes(String(item.status || '').toUpperCase())).length

  return {
    total,
    unused,
    used,
    issued
  }
})

const filteredSerialCodes = computed(() => {
  const keyword = String(serialSearchKeyword.value || '').trim().toLowerCase()
  const status = String(serialStatusFilter.value || 'ALL').toUpperCase()

  return serialCodes.value.filter((item) => {
    const codeText = String(item.code || item.serial || item.value || '').toLowerCase()
    const noteText = String(item.note || '').toLowerCase()
    const batchText = String(item.batchCode || item.batch || '').toLowerCase()
    const itemStatus = String(item.status || '').toUpperCase()

    const matchKeyword = !keyword || codeText.includes(keyword) || noteText.includes(keyword) || batchText.includes(keyword)
    const matchStatus = status === 'ALL' || itemStatus === status

    return matchKeyword && matchStatus
  })
})

const serialTotalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredSerialCodes.value.length / Number(serialPageSize.value || 20)))
})

const pagedSerialCodes = computed(() => {
  const pageSize = Number(serialPageSize.value || 20)
  const safePage = Math.min(Math.max(Number(serialCurrentPage.value || 1), 1), serialTotalPages.value)
  const start = (safePage - 1) * pageSize

  return filteredSerialCodes.value.slice(start, start + pageSize)
})

const getSerialRowId = (code) => {
  return String(code?.id || code?.serialCodeId || code?.codeId || code?.code || code?.serial || code?.value || '')
}

const pagedSerialIds = computed(() => {
  return pagedSerialCodes.value
    .map((code) => getSerialRowId(code))
    .filter(Boolean)
})

const selectedSerialCodes = computed(() => {
  const selectedSet = new Set(selectedSerialIds.value.map(String))

  return serialCodes.value.filter((code) => selectedSet.has(getSerialRowId(code)))
})

const selectedSerialCountText = computed(() => {
  return selectedSerialIds.value.length
    ? `已選 ${selectedSerialIds.value.length} 筆`
    : '尚未選擇序號'
})

const isCurrentPageAllSelected = computed(() => {
  return pagedSerialIds.value.length > 0 && pagedSerialIds.value.every((id) => selectedSerialIds.value.includes(id))
})

const serialPageInfoText = computed(() => {
  if (!filteredSerialCodes.value.length) return '目前沒有符合條件的序號'

  const pageSize = Number(serialPageSize.value || 20)
  const safePage = Math.min(Math.max(Number(serialCurrentPage.value || 1), 1), serialTotalPages.value)
  const start = (safePage - 1) * pageSize + 1
  const end = Math.min(start + pageSize - 1, filteredSerialCodes.value.length)

  return `顯示 ${start} - ${end} 筆，共 ${filteredSerialCodes.value.length} 筆`
})

const selectedPlayerUrl = computed(() => {
  return selectedCampaign.value ? getPlayerUrl(selectedCampaign.value) : ''
})

const selectedExportUrl = computed(() => {
  if (!selectedCampaignId.value) return ''
  return `${apiBaseUrl.value}/serial-codes/campaigns/${selectedCampaignId.value}/export.csv`
})

const serialStatusTextMap = {
  UNUSED: '未使用',
  USED: '已使用',
  ISSUED: '已發放',
  SENT: '已發放',
  PAUSED: '暫停使用',
  EXPIRED: '已過期',
  DISABLED: '停用'
}

const getSerialStatusText = (status) => {
  const normalized = String(status || '').toUpperCase()

  return serialStatusTextMap[normalized] || status || '-'
}

const formatCsvCell = (value) => {
  const text = String(value ?? '').replace(/"/g, '""')

  return `"${text}"`
}

const getSerialCodeText = (code) => {
  return code?.code || code?.serial || code?.value || ''
}

const getSerialBatchText = (code) => {
  return code?.batchCode || code?.batch || ''
}

const getSerialExpireText = (code) => {
  return code?.expiresAt || code?.expiredAt || ''
}

const getSerialCreatedAtText = (code) => {
  return code?.createdAt || ''
}

const buildChineseSerialCsv = (items = []) => {
  const headers = [
    '序號ID',
    '活動ID',
    '序號',
    '狀態',
    '可用次數',
    '批次',
    '過期時間',
    '備註',
    '建立時間'
  ]

  const rows = items.map((item) => [
    item.id || '',
    item.campaignId || selectedCampaignId.value || '',
    getSerialCodeText(item),
    getSerialStatusText(item.status),
    item.rewardChance || item.chance || 1,
    getSerialBatchText(item),
    getSerialExpireText(item),
    item.note || '',
    getSerialCreatedAtText(item)
  ])

  return [headers, ...rows]
    .map((row) => row.map(formatCsvCell).join(','))
    .join('\r\n')
}

const downloadTextFile = (content, filename, mimeType = 'text/csv;charset=utf-8;') => {
  const blob = new Blob([`\ufeff${content}`], {
    type: mimeType
  })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

const merchantTodaySteps = computed(() => [
  {
    step: '01',
    title: '選遊戲活動',
    description: selectedCampaign.value ? `目前選用：${selectedCampaign.value.title || selectedCampaign.value.name}` : '先從下拉選單或活動列表選一個遊戲活動',
    done: Boolean(selectedCampaign.value)
  },
  {
    step: '02',
    title: '設定活動畫面',
    description: '文字、顏色、獎品、官方連結都到對應遊戲設定中心調整',
    done: Boolean(selectedCampaign.value)
  },
  {
    step: '03',
    title: '產生序號',
    description: serialStats.value.total > 0 ? `目前已有 ${serialStats.value.total} 組序號` : '按「產生 20 組序號」建立給客人的序號',
    done: serialStats.value.total > 0
  },
  {
    step: '04',
    title: '匯出與發送',
    description: '匯出中文 CSV，把序號和玩家連結發給客人',
    done: Boolean(selectedCampaign.value && serialStats.value.total > 0)
  }
])

const selectedCampaignSummaryCards = computed(() => [
  {
    label: '目前活動',
    value: selectedCampaign.value ? `#${selectedCampaign.value.id}` : '-',
    note: selectedCampaign.value?.title || '尚未選擇'
  },
  {
    label: '活動狀態',
    value: selectedCampaign.value ? getCampaignStatusText(selectedCampaign.value) : '-',
    note: selectedCampaign.value ? (isCampaignActive(selectedCampaign.value) ? '玩家可進入' : '目前暫停') : '請先選活動'
  },
  {
    label: '序號總數',
    value: serialStats.value.total,
    note: `未使用 ${serialStats.value.unused}｜已使用 ${serialStats.value.used}`
  },
  {
    label: '玩家連結',
    value: selectedCampaign.value ? '可複製' : '-',
    note: selectedCampaign.value ? `${getGameTypeLabel(selectedCampaign.value.gameType)} 玩家入口` : '請先選活動'
  }
])

const resetForm = () => {
  form.title = ''
  form.gameType = 'GRID'
  form.description = ''
  form.startAt = ''
  form.endAt = ''
  form.dailyLimit = 1
  form.totalLimit = 1
  form.status = 'DRAFT'
  form.requireLogin = false
  form.allowedRole = ''
  form.requiredLevel = ''
  form.settings.operationMode = 'MERCHANT_SELF_CREATE_GRID'
  form.settings.requireSerialCode = true
  form.settings.serialPrefix = 'GRID'
  form.settings.playerHint = '請輸入商家提供的序號後開始九宮格抽獎。'
  form.settings.gridItems = defaultGridItems()
}

const fillGridExample = () => {
  form.gameType = 'GRID'
  form.title = form.title || '九宮格抽獎活動'
  form.description = form.description || '輸入活動序號後即可參加九宮格抽獎。'
  form.dailyLimit = 1
  form.totalLimit = 1
  form.status = 'ACTIVE'
  form.requireLogin = false
  form.settings.serialPrefix = 'GRID'
  form.settings.playerHint = '請輸入商家提供的序號後開始九宮格抽獎。'
  form.settings.gridItems = defaultGridItems()
  message.value = '已帶入九宮格範例。'
}

const fillWheelExample = () => {
  form.gameType = 'WHEEL'
  form.title = form.title || '幸運輪盤抽獎活動'
  form.description = form.description || '輸入活動序號後即可參加幸運輪盤抽獎。'
  form.dailyLimit = 1
  form.totalLimit = 1
  form.status = 'ACTIVE'
  form.requireLogin = false
  form.settings.operationMode = 'MERCHANT_SELF_CREATE_WHEEL'
  form.settings.requireSerialCode = true
  form.settings.serialPrefix = 'WHEEL'
  form.settings.playerHint = '請輸入商家提供的序號後開始幸運輪盤抽獎。'
  message.value = '已帶入幸運輪盤範例。'
}

const fillGoldenEggExample = () => {
  form.gameType = 'GOLDEN_EGG'
  form.title = form.title || '砸金蛋抽獎活動'
  form.description = form.description || '輸入活動序號後即可參加砸金蛋抽獎。'
  form.dailyLimit = 1
  form.totalLimit = 1
  form.status = 'ACTIVE'
  form.requireLogin = false
  form.settings.operationMode = 'MERCHANT_SELF_CREATE_GOLDEN_EGG'
  form.settings.requireSerialCode = true
  form.settings.serialPrefix = 'EGG'
  form.settings.playerHint = '請輸入商家提供的序號後開始砸金蛋抽獎。'
  message.value = '已帶入砸金蛋範例。'
}

const fillExampleByGameType = (type = form.gameType) => {
  const normalized = String(type || '').toUpperCase()

  if (normalized === 'WHEEL') {
    fillWheelExample()
    scrollToCreateForm()
    return
  }

  if (normalized === 'GOLDEN_EGG') {
    fillGoldenEggExample()
    scrollToCreateForm()
    return
  }

  fillGridExample()
  scrollToCreateForm()
}

const getDefaultTitleByGameType = (type) => {
  const normalized = String(type || '').toUpperCase()

  if (normalized === 'WHEEL') return '幸運輪盤抽獎活動'
  if (normalized === 'GOLDEN_EGG') return '砸金蛋抽獎活動'

  return '九宮格抽獎活動'
}

const prepareCampaignFormBeforeCreate = () => {
  const type = String(form.gameType || 'GRID').toUpperCase()

  form.gameType = type

  if (!String(form.title || '').trim()) {
    form.title = getDefaultTitleByGameType(type)
  }

  if (!String(form.description || '').trim()) {
    if (type === 'WHEEL') {
      form.description = '輸入活動序號後即可參加幸運輪盤抽獎。'
    } else if (type === 'GOLDEN_EGG') {
      form.description = '輸入活動序號後即可參加砸金蛋抽獎。'
    } else {
      form.description = '輸入活動序號後即可參加九宮格抽獎。'
    }
  }

  if (type === 'GRID' && (!Array.isArray(form.settings.gridItems) || form.settings.gridItems.length !== 9)) {
    form.settings.gridItems = defaultGridItems()
  }

  if (type === 'WHEEL') {
    form.settings.operationMode = 'MERCHANT_SELF_CREATE_WHEEL'
    form.settings.requireSerialCode = true
    form.settings.serialPrefix = form.settings.serialPrefix || 'WHEEL'
    form.settings.playerHint = form.settings.playerHint || '請輸入商家提供的序號後開始幸運輪盤抽獎。'
  }

  if (type === 'GOLDEN_EGG') {
    form.settings.operationMode = 'MERCHANT_SELF_CREATE_GOLDEN_EGG'
    form.settings.requireSerialCode = true
    form.settings.serialPrefix = form.settings.serialPrefix || 'EGG'
    form.settings.playerHint = form.settings.playerHint || '請輸入商家提供的序號後開始砸金蛋抽獎。'
  }

  if (type === 'GRID') {
    form.settings.operationMode = 'MERCHANT_SELF_CREATE_GRID'
    form.settings.requireSerialCode = true
    form.settings.serialPrefix = form.settings.serialPrefix || 'GRID'
    form.settings.playerHint = form.settings.playerHint || '請輸入商家提供的序號後開始九宮格抽獎。'
  }

  if (!form.status || form.status === 'DRAFT') {
    form.status = 'ACTIVE'
  }
}

const quickCreateGameCampaign = async (type) => {
  resetMessages()

  const normalized = String(type || 'GRID').toUpperCase()

  resetForm()
  form.gameType = normalized
  fillExampleByGameType(normalized)
  form.title = getDefaultTitleByGameType(normalized)
  prepareCampaignFormBeforeCreate()

  quickCreatingGameType.value = normalized

  try {
    await createCampaign()
  } finally {
    quickCreatingGameType.value = ''
  }
}

const buildCampaignPayload = () => {
  const isGrid = String(form.gameType || '').toUpperCase() === 'GRID'

  const settings = isGrid
    ? {
        ...form.settings,
        operationMode: 'MERCHANT_SELF_CREATE_GRID',
        requireSerialCode: true,
        serialPrefix: form.settings.serialPrefix || 'GRID',
        gridItems: form.settings.gridItems.map((item, index) => ({
          position: index + 1,
          title: String(item.title || '').trim() || `第 ${index + 1} 格`,
          rewardType: String(item.rewardType || 'COUPON').trim().toUpperCase(),
          quantity: Number(item.quantity || 0),
          weight: Number(item.weight || 1),
          enabled: Boolean(item.enabled)
        }))
      }
    : {
        ...form.settings,
        operationMode: `MERCHANT_SELF_CREATE_${String(form.gameType || 'GAME').toUpperCase()}`,
        requireSerialCode: true,
        serialPrefix: form.settings.serialPrefix || String(form.gameType || 'GAME').toUpperCase(),
        playerHint: form.settings.playerHint || '請輸入商家提供的序號後開始遊戲。'
      }

  return {
    title: String(form.title || '').trim(),
    name: String(form.title || '').trim(),
    gameType: String(form.gameType || 'GRID').toUpperCase(),
    description: form.description || '',
    startAt: form.startAt || null,
    endAt: form.endAt || null,
    dailyLimit: Number(form.dailyLimit || 1),
    totalLimit: Number(form.totalLimit || 1),
    status: form.status || 'DRAFT',
    requireLogin: Boolean(form.requireLogin),
    allowedRole: form.allowedRole || null,
    requiredLevel: form.requiredLevel || null,
    settings
  }
}

const buildCampaignPayloadFromCampaign = (campaign) => {
  const type = String(campaign?.gameType || 'GRID').toUpperCase()

  return {
    title: campaign?.title || campaign?.name || getDefaultTitleByGameType(type),
    name: campaign?.name || campaign?.title || getDefaultTitleByGameType(type),
    gameType: type,
    description: campaign?.description || '',
    startAt: campaign?.startAt || null,
    endAt: campaign?.endAt || null,
    dailyLimit: Number(campaign?.dailyLimit || 1),
    totalLimit: Number(campaign?.totalLimit || 1),
    status: campaign?.status || 'DRAFT',
    requireLogin: Boolean(campaign?.requireLogin),
    allowedRole: campaign?.allowedRole || null,
    requiredLevel: campaign?.requiredLevel || null,
    tenantSlug: campaign?.tenantSlug || campaign?.tenant?.slug || getCurrentTenantSlug(),
    settings: campaign?.settings || {
      operationMode: `MERCHANT_SELF_CREATE_${type}`,
      requireSerialCode: true,
      serialPrefix: type,
      playerHint: '請輸入商家提供的序號後開始遊戲。'
    }
  }
}

const loadCampaigns = async () => {
  loading.value = true
  resetMessages()
  loadLocalCampaignDrafts()
  loadRecentCreatedCampaigns()
  recentCreatedCampaigns.value = []
  saveRecentCreatedCampaigns()

  try {
    const response = await getAdminCampaignsApi()
    campaigns.value = filterCampaignsForCurrentTenant(mergeCampaignsWithLocalDrafts(normalizeResponseData(response)))
    campaigns.value.forEach((campaign) => {
      const id = String(campaign?.id || '')
      if (id && !campaignStatusOverrides[id]) {
        campaignStatusOverrides[id] = campaign.status || 'DRAFT'
      }
    })

    await selectSafeCampaignAfterLoad()
  } catch (error) {
    console.error('取得活動列表失敗:', error)
    campaigns.value = filterCampaignsForCurrentTenant(mergeCampaignsWithLocalDrafts([]))
    await selectSafeCampaignAfterLoad()
    errorMessage.value = error?.response?.data?.message || '目前無法取得後端活動列表，已保留本頁本地草稿；請確認後端或權限。'
  } finally {
    loading.value = false
  }
}

const createCampaign = async () => {
  resetMessages()
  prepareCampaignFormBeforeCreate()

  if (String(form.gameType).toUpperCase() === 'GRID' && form.settings.gridItems.length !== 9) {
    form.settings.gridItems = defaultGridItems()
  }

  submitting.value = true
  lastCreateMode.value = 'REMOTE'

  const payload = buildCampaignPayload()

  try {
    let response

    try {
      response = await createCampaignApi(payload)
    } catch (firstError) {
      if ([404, 405].includes(firstError?.response?.status)) {
        response = await http.post('/campaigns', payload)
      } else {
        throw firstError
      }
    }

    const created = normalizeCreatedCampaignForList(normalizeSingleData(response), payload)

    if (!created?.id) {
      throw new Error('建立活動 API 沒有回傳活動 ID')
    }

    insertCampaignToListAndSelect(created)
    rememberRecentCreatedCampaign(created)

    message.value = `已建立正式資料庫活動：${created.title || created.name}`

    resetForm()
    await loadCampaigns()
  } catch (error) {
    console.error('建立正式活動失敗，降級成本頁草稿:', error)

    lastCreateMode.value = 'LOCAL_DRAFT'

    const draft = createLocalDraftAndInsert(
      payload,
      `正式資料庫建立失敗，已先建立本頁草稿：${payload.title || getDefaultTitleByGameType(payload.gameType)}。請確認後端 API / 權限後，再按「重新送出建立」。`
    )

    errorMessage.value = error?.response?.data?.message
      ? `正式資料庫建立失敗：${error.response.data.message}`
      : '正式資料庫建立失敗，已降級成本頁草稿。請查看後端 npm run dev 視窗。'

    selectedCampaignId.value = draft.id
    resetForm()
  } finally {
    submitting.value = false
  }
}

const retryCreateLocalDraftCampaign = async (campaign) => {
  resetMessages()

  if (!isLocalDraftCampaign(campaign)) {
    errorMessage.value = '這筆活動已經是正式資料，不需要重新送出。'
    return
  }

  submitting.value = true
  lastCreateMode.value = 'REMOTE_RETRY'

  try {
    const payload = buildCampaignPayloadFromCampaign(campaign)
    let response

    try {
      response = await createCampaignApi(payload)
    } catch (firstError) {
      if ([404, 405].includes(firstError?.response?.status)) {
        response = await http.post('/campaigns', payload)
      } else {
        throw firstError
      }
    }

    const created = normalizeCreatedCampaignForList(normalizeSingleData(response), payload)

    if (!created?.id) {
      throw new Error('重新送出建立 API 沒有回傳活動 ID')
    }

    const localId = String(campaign.id)

    localCampaignDrafts.value = localCampaignDrafts.value.filter((item) => String(item.id) !== localId)
    saveLocalCampaignDrafts()

    campaigns.value = campaigns.value.filter((item) => String(item.id) !== localId)
    insertCampaignToListAndSelect(created)
    rememberRecentCreatedCampaign(created)

    selectedCampaignId.value = created.id
    message.value = `草稿已正式寫入資料庫：${created.title || campaign.title}`

    await loadCampaigns()
  } catch (error) {
    console.error('重新送出草稿失敗:', error)
    errorMessage.value = error?.response?.data?.message || '草稿重新送出失敗，請確認後端商家自建活動 API 權限。'
  } finally {
    submitting.value = false
  }
}


const loadSerialList = async (campaignId = selectedCampaignId.value, showMessage = true) => {
  if (!campaignId) {
    serialCodes.value = []
    selectedSerialIds.value = []
    if (showMessage) errorMessage.value = '請先選擇遊戲活動。'
    return
  }

  const selected = campaigns.value.find((item) => String(item.id) === String(campaignId))
  if (isLocalDraftCampaign(selected)) {
    serialCodes.value = []
    selectedSerialIds.value = []
    if (showMessage) errorMessage.value = '這筆目前是本頁草稿，正式建立後才能載入序號。'
    return
  }

  serialListLoading.value = true

  try {
    const response = await http.get(`/serial-codes/campaigns/${campaignId}`)
    serialCodes.value = normalizeResponseData(response)
    serialCurrentPage.value = 1
    selectedSerialIds.value = []

    if (showMessage) {
      message.value = `已重新載入序號，共 ${serialCodes.value.length} 筆。`
    }
  } catch (error) {
    if (Number(error?.response?.status) === 404) {
      serialCodes.value = []
      selectedSerialIds.value = []
      serialPagination.page = 1
      serialPagination.total = 0

      if (showMessage) {
        message.value = '目前後端尚未啟用序號列表 API，已先顯示空列表。'
      }

      return
    }

    console.error('取得序號列表失敗:', error)
    serialCodes.value = []
    selectedSerialIds.value = []
    if (showMessage) errorMessage.value = error?.response?.data?.message || '取得序號列表失敗。'
  } finally {
    serialListLoading.value = false
  }
}

const createManualSerialCode = async () => {
  resetMessages()

  if (!selectedCampaignId.value) {
    errorMessage.value = '請先選擇遊戲活動。'
    return
  }

  if (isLocalDraftCampaign(selectedCampaign.value)) {
    errorMessage.value = '這筆目前是本頁草稿，請先按「重新送出建立」變成正式資料後，再建立指定序號。'
    return
  }

  const manualCode = normalizeManualSerialCode(manualSerialForm.code)

  if (!manualCode) {
    errorMessage.value = '請輸入要給客人的指定序號。'
    return
  }

  if (manualCode.length < 4) {
    errorMessage.value = '指定序號至少需要 4 個字元。'
    return
  }

  serialLoading.value = true

  try {
    const payload = {
      code: manualCode,
      serial: manualCode,
      value: manualCode,
      count: 1,
      prefix: '',
      batchCode: manualSerialForm.batchCode || 'MANUAL',
      rewardChance: Number(manualSerialForm.rewardChance || 1),
      length: manualCode.length,
      expiresAt: manualSerialForm.expiresAt || null,
      note: manualSerialForm.note || '商家手動指定序號'
    }

    let createdManually = false

    const attempts = [
      () => http.post(`/serial-codes/campaigns/${selectedCampaignId.value}/manual`, payload),
      () => http.post(`/serial-codes/campaigns/${selectedCampaignId.value}`, payload),
      () => http.post(`/serial-codes/campaigns/${selectedCampaignId.value}/generate`, payload)
    ]

    let lastError = null

    for (const attempt of attempts) {
      try {
        await attempt()
        createdManually = true
        break
      } catch (error) {
        lastError = error

        if (![404, 405].includes(error?.response?.status)) {
          throw error
        }
      }
    }

    if (!createdManually) {
      throw lastError
    }

    message.value = `已建立指定序號「${manualCode}」，可使用 ${manualSerialForm.rewardChance || 1} 次。`
    resetManualSerialForm()
    await loadSerialList(selectedCampaignId.value, false)
  } catch (error) {
    console.error('建立指定序號失敗:', error)
    errorMessage.value = error?.response?.data?.message || '建立指定序號失敗，可能後端尚未提供手動建立序號 API。'
  } finally {
    serialLoading.value = false
  }
}

const generateSerialCodes = async (count = Number(serialForm.count || 20)) => {
  resetMessages()

  if (!selectedCampaignId.value) {
    errorMessage.value = '請先選擇遊戲活動。'
    return
  }

  if (isLocalDraftCampaign(selectedCampaign.value)) {
    errorMessage.value = '這筆目前是本頁草稿，請先按「重新送出建立」變成正式資料後，再產生序號。'
    return
  }

  serialLoading.value = true

  try {
    await http.post(`/serial-codes/campaigns/${selectedCampaignId.value}/generate`, {
      count: Number(count || serialForm.count || 20),
      prefix: serialForm.prefix || 'GRID',
      batchCode: serialForm.batchCode || 'QUICK',
      rewardChance: Number(serialForm.rewardChance || 1),
      length: Number(serialForm.length || 18),
      expiresAt: serialForm.expiresAt || null,
      note: serialForm.note || selectedCampaign.value?.title || '九宮格活動序號'
    })

    message.value = `已產生 ${count || serialForm.count} 組序號，可直接匯出中文 CSV。`
    await loadSerialList(selectedCampaignId.value, false)
  } catch (error) {
    console.error('產生序號失敗:', error)
    errorMessage.value = error?.response?.data?.message || '產生序號失敗，請確認 API 與登入權限。'
  } finally {
    serialLoading.value = false
  }
}

const exportSerialCsv = () => {
  resetMessages()

  if (!selectedCampaignId.value) {
    errorMessage.value = '請先選擇遊戲活動。'
    return
  }

  const exportItems = filteredSerialCodes.value.length
    ? filteredSerialCodes.value
    : serialCodes.value

  if (!exportItems.length) {
    errorMessage.value = '目前沒有序號可以匯出。'
    return
  }

  const safeTitle = String(selectedCampaign.value?.title || '九宮格活動序號')
    .replace(/[\\/:*?"<>|]/g, '-')
  const csv = buildChineseSerialCsv(exportItems)

  downloadTextFile(csv, `${safeTitle}-中文序號清單.csv`)
  message.value = `已匯出 ${exportItems.length} 筆中文序號 CSV。`
}

const getSerialCodeId = (code) => {
  return code?.id || code?.serialCodeId || code?.codeId || code?.code || code?.serial || code?.value
}

const findSerialIndex = (code) => {
  const targetId = String(getSerialCodeId(code) || '')

  return serialCodes.value.findIndex((item) => String(getSerialCodeId(item) || '') === targetId)
}

const patchLocalSerialStatus = (code, nextStatus) => {
  const index = findSerialIndex(code)
  if (index === -1) return

  serialCodes.value[index] = {
    ...serialCodes.value[index],
    status: nextStatus
  }
}

const removeLocalSerialCode = (code) => {
  const targetId = String(getSerialCodeId(code) || '')

  serialCodes.value = serialCodes.value.filter((item) => String(getSerialCodeId(item) || '') !== targetId)
  selectedSerialIds.value = selectedSerialIds.value.filter((id) => String(id) !== targetId)
}

const requestUpdateSerialStatus = async (code, nextStatus) => {
  const codeId = getSerialCodeId(code)
  const codeValue = code?.code || code?.serial || code?.value || codeId
  const payload = {
    status: nextStatus
  }

  const attempts = [
    () => http.patch(`/serial-codes/${codeId}`, payload),
    () => http.patch(`/serial-codes/${codeId}/status`, payload),
    () => http.patch(`/serial-codes/campaigns/${selectedCampaignId.value}/codes/${codeId}`, payload),
    () => http.patch(`/serial-codes/campaigns/${selectedCampaignId.value}/codes/${codeValue}/status`, payload)
  ]

  let lastError = null

  for (const attempt of attempts) {
    try {
      await attempt()
      return true
    } catch (error) {
      lastError = error
      if (![404, 405].includes(error?.response?.status)) {
        throw error
      }
    }
  }

  throw lastError
}

const requestDeleteSerialCode = async (code) => {
  const codeId = getSerialCodeId(code)
  const codeValue = code?.code || code?.serial || code?.value || codeId

  const attempts = [
    () => http.delete(`/serial-codes/${codeId}`),
    () => http.delete(`/serial-codes/campaigns/${selectedCampaignId.value}/codes/${codeId}`),
    () => http.delete(`/serial-codes/campaigns/${selectedCampaignId.value}/codes/${codeValue}`)
  ]

  let lastError = null

  for (const attempt of attempts) {
    try {
      await attempt()
      return true
    } catch (error) {
      lastError = error
      if (![404, 405].includes(error?.response?.status)) {
        throw error
      }
    }
  }

  throw lastError
}

const updateSerialStatus = async (code, nextStatus) => {
  resetMessages()

  const codeId = getSerialCodeId(code)

  if (!codeId) {
    errorMessage.value = '找不到序號 ID，無法更新狀態。'
    return
  }

  const oldStatus = code.status

  patchLocalSerialStatus(code, nextStatus)
  message.value = `畫面已先將序號狀態改為 ${nextStatus}。`

  try {
    await requestUpdateSerialStatus(code, nextStatus)
    message.value = `已將序號狀態改為 ${nextStatus}。`
  } catch (error) {
    console.error('更新序號狀態失敗:', error)
    patchLocalSerialStatus({ ...code, status: nextStatus }, oldStatus)
    errorMessage.value = error?.response?.data?.message || '更新序號狀態失敗，可能後端尚未提供暫停 / 恢復 API。'
  }
}

const deleteSerialCode = async (code) => {
  resetMessages()

  const codeId = getSerialCodeId(code)
  const codeText = code?.code || code?.serial || code?.value || codeId

  if (!codeId) {
    errorMessage.value = '找不到序號 ID，無法刪除。'
    return
  }

  if (!window.confirm(`確定要從畫面移除序號「${codeText}」嗎？`)) {
    return
  }

  removeLocalSerialCode(code)
  message.value = '已從目前畫面移除序號。若要同步資料庫，下一步需補後端刪除 API。'

  try {
    await requestDeleteSerialCode(code)
    message.value = '已刪除序號並同步資料庫。'
  } catch (error) {
    console.warn('後端刪除序號 API 尚未同步，畫面先保留移除結果：', error)
  }
}

const toggleSerialSelection = (code) => {
  const id = getSerialRowId(code)
  if (!id) return

  if (selectedSerialIds.value.includes(id)) {
    selectedSerialIds.value = selectedSerialIds.value.filter((item) => item !== id)
    return
  }

  selectedSerialIds.value = [...selectedSerialIds.value, id]
}

const toggleCurrentPageSelection = () => {
  if (isCurrentPageAllSelected.value) {
    const currentPageSet = new Set(pagedSerialIds.value)
    selectedSerialIds.value = selectedSerialIds.value.filter((id) => !currentPageSet.has(id))
    return
  }

  selectedSerialIds.value = Array.from(new Set([...selectedSerialIds.value, ...pagedSerialIds.value]))
}

const clearSerialSelection = () => {
  selectedSerialIds.value = []
}

const bulkUpdateSelectedSerialStatus = async (nextStatus) => {
  resetMessages()

  const targets = selectedSerialCodes.value

  if (!targets.length) {
    errorMessage.value = '請先勾選要操作的序號。'
    return
  }

  const backups = targets.map((code) => ({
    code,
    oldStatus: code.status
  }))

  targets.forEach((code) => patchLocalSerialStatus(code, nextStatus))
  message.value = `畫面已先將 ${targets.length} 筆序號改為 ${nextStatus}。`

  const failed = []

  for (const code of targets) {
    try {
      await requestUpdateSerialStatus(code, nextStatus)
    } catch (error) {
      failed.push({ code, error })
    }
  }

  if (failed.length) {
    backups.forEach(({ code, oldStatus }) => {
      if (failed.some((item) => String(getSerialCodeId(item.code)) === String(getSerialCodeId(code)))) {
        patchLocalSerialStatus(code, oldStatus)
      }
    })
    errorMessage.value = `${failed.length} 筆序號更新失敗，可能後端尚未提供批次狀態 API。`
    return
  }

  message.value = `已批次更新 ${targets.length} 筆序號為 ${nextStatus}。`
}

const bulkDeleteSelectedSerialCodes = async () => {
  resetMessages()

  const targets = selectedSerialCodes.value

  if (!targets.length) {
    errorMessage.value = '請先勾選要刪除的序號。'
    return
  }

  if (!window.confirm(`確定要從畫面移除已勾選的 ${targets.length} 筆序號嗎？`)) {
    return
  }

  targets.forEach((code) => removeLocalSerialCode(code))
  const deleteCount = targets.length
  clearSerialSelection()
  message.value = `已從目前畫面移除 ${deleteCount} 筆序號。若要同步資料庫，下一步需補後端批次刪除 API。`

  const failed = []

  for (const code of targets) {
    try {
      await requestDeleteSerialCode(code)
    } catch (error) {
      failed.push({ code, error })
    }
  }

  if (!failed.length) {
    message.value = `已刪除 ${deleteCount} 筆序號並同步資料庫。`
    return
  }

  console.warn('部分或全部序號後端刪除 API 尚未同步，畫面先保留移除結果：', failed)
}

const resetSerialFilters = () => {
  serialSearchKeyword.value = ''
  serialStatusFilter.value = 'ALL'
  serialPageSize.value = 20
  serialCurrentPage.value = 1
  selectedSerialIds.value = []
}

const getTenantSlug = (campaign) => {
  return campaign?.tenant?.slug || campaign?.tenantSlug || campaign?.slug || 'demo-shop'
}

const appendCampaignIdQuery = (url, campaign) => {
  const campaignId = campaign?.id

  if (!campaignId) return url

  const connector = String(url).includes('?') ? '&' : '?'

  return `${url}${connector}campaignId=${encodeURIComponent(campaignId)}`
}

const getPlayerUrl = (campaign) => {
  const type = String(campaign?.gameType || '').toUpperCase()
  const tenantSlug = getCampaignTenantSlug(campaign) || normalizeTenantSlug(getCurrentTenantSlug())

  // 第 33601～34000 批：
  // 1. 三個正式對客玩家網址都固定使用 /play/:tenantSlug/...。
  // 2. 一律帶 campaignId，避免同一商家有多個 ACTIVE 活動時，前台抓到別的活動，造成「後台有序號但前台找不到序號」。
  // 3. 序號仍維持正式規則：只屬於自己的 campaign，不跨遊戲共用。
  if (type === 'GRID') {
    const url = tenantSlug
      ? `${frontOrigin.value}/play/${tenantSlug}/premium-grid`
      : `${frontOrigin.value}/games/premium-grid`

    return appendCampaignIdQuery(url, campaign)
  }

  if (type === 'WHEEL') {
    const url = tenantSlug
      ? `${frontOrigin.value}/play/${tenantSlug}/wheel`
      : `${frontOrigin.value}/games/wheel`

    return appendCampaignIdQuery(url, campaign)
  }

  if (type === 'GOLDEN_EGG') {
    const url = tenantSlug
      ? `${frontOrigin.value}/play/${tenantSlug}/golden-egg`
      : `${frontOrigin.value}/games/golden-egg`

    return appendCampaignIdQuery(url, campaign)
  }

  return campaign?.shareUrl || campaign?.playerUrl || `${frontOrigin.value}/games`
}


const officialGameDefinitions = [
  {
    type: 'WHEEL',
    label: '幸運輪盤',
    slug: 'wheel',
    emoji: '🎡',
    description: '適合折扣券、再玩一次、活動現場抽獎。'
  },
  {
    type: 'GRID',
    label: '九宮格',
    slug: 'premium-grid',
    emoji: '🎯',
    description: '適合九格獎項、序號抽獎、品牌活動。'
  },
  {
    type: 'GOLDEN_EGG',
    label: '砸金蛋',
    slug: 'golden-egg',
    emoji: '🥚',
    description: '適合高互動視覺活動、敲蛋中獎。'
  }
]

const officialTenantSlug = computed(() => {
  const selectedSlug = getCampaignTenantSlug(selectedCampaign.value)
  const currentSlug = normalizeTenantSlug(getCurrentTenantSlug())

  return selectedSlug || currentSlug || 'a-shop'
})

const getOfficialPlayerUrlByType = (gameType, tenantSlug = officialTenantSlug.value) => {
  const definition = officialGameDefinitions.find((item) => item.type === String(gameType || '').toUpperCase())
  const safeSlug = normalizeTenantSlug(tenantSlug) || 'a-shop'

  if (!definition) return `${frontOrigin.value}/play/${safeSlug}`

  return `${frontOrigin.value}/play/${safeSlug}/${definition.slug}`
}

const findCampaignByGameType = (gameType) => {
  const normalizedType = String(gameType || '').toUpperCase()
  const tenantSlug = normalizeTenantSlug(officialTenantSlug.value)

  return merchantGameCampaigns.value.find((campaign) => {
    const sameType = String(campaign?.gameType || '').toUpperCase() === normalizedType
    const sameTenant = !tenantSlug || getCampaignTenantSlug(campaign) === tenantSlug || isPlatformScopeUser()

    return sameType && sameTenant
  }) || null
}

const officialDeliveryLinks = computed(() => {
  return officialGameDefinitions.map((definition) => {
    const campaign = findCampaignByGameType(definition.type)
    const url = campaign ? getPlayerUrl(campaign) : getOfficialPlayerUrlByType(definition.type)

    return {
      ...definition,
      campaign,
      url,
      status: campaign ? getCampaignStatusText(campaign) : '尚未建立活動',
      isActive: campaign ? isCampaignActive(campaign) : false,
      hasCampaign: Boolean(campaign)
    }
  })
})

const officialDeliverySummaryCards = computed(() => {
  const total = officialDeliveryLinks.value.length
  const created = officialDeliveryLinks.value.filter((item) => item.hasCampaign).length
  const active = officialDeliveryLinks.value.filter((item) => item.isActive).length

  return [
    {
      label: '正式商家',
      value: officialTenantSlug.value,
      note: '玩家網址使用這個 tenantSlug'
    },
    {
      label: '三遊戲活動',
      value: `${created}/${total}`,
      note: created === total ? '三個活動都有資料' : '尚有遊戲未建立活動'
    },
    {
      label: '可對客狀態',
      value: `${active}/${total}`,
      note: active === total ? '三個遊戲皆啟用' : '請確認活動狀態'
    },
    {
      label: '目前序號',
      value: serialStats.value.total,
      note: `未使用 ${serialStats.value.unused}｜已使用 ${serialStats.value.used}`
    }
  ]
})

const officialCustomerServiceText = computed(() => {
  const lines = [
    '您好，這是本次活動抽獎網址：',
    '',
    ...officialDeliveryLinks.value.flatMap((item) => [
      `${item.label}抽獎：`,
      item.url,
      ''
    ]),
    '請輸入店家提供的活動序號後即可參加抽獎。',
    '',
    '提醒：序號綁定活動，不同遊戲 / 不同活動的序號不能互相共用。'
  ]

  return lines.join('\n')
})

const copyTextToClipboard = async (text, successText = '已複製。') => {
  const value = String(text || '').trim()

  if (!value) {
    errorMessage.value = '目前沒有可複製的內容。'
    return
  }

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = value
      textarea.setAttribute('readonly', 'readonly')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }

    message.value = successText
    errorMessage.value = ''
  } catch (error) {
    console.error('複製失敗:', error)
    errorMessage.value = '複製失敗，請手動反白複製。'
  }
}

const copyOfficialPlayerUrl = (item) => {
  return copyTextToClipboard(item?.url, `已複製${item?.label || '遊戲'}正式玩家網址。`)
}

const copyOfficialCustomerServiceText = () => {
  return copyTextToClipboard(officialCustomerServiceText.value, '已複製商家客服活動文字。')
}

const openOfficialPlayerUrl = (item) => {
  if (!item?.url) {
    errorMessage.value = '目前沒有可開啟的正式玩家網址。'
    return
  }

  window.open(item.url, '_blank', 'noopener,noreferrer')
}

const copyPlayerUrl = () => {
  if (!selectedPlayerUrl.value) {
    errorMessage.value = '請先選擇遊戲活動。'
    return
  }

  return copyTextToClipboard(selectedPlayerUrl.value, '已複製目前活動玩家連結。')
}


const goGameSettings = (campaign = selectedCampaign.value) => {
  if (!campaign?.id) {
    errorMessage.value = '請先選擇遊戲活動。'
    return
  }

  if (!canOperateCampaign(campaign)) {
    errorMessage.value = getCampaignOperateHint(campaign)
    return
  }

  if (isLocalDraftCampaign(campaign) || campaign.sourceType === 'RECENT_CREATED') {
    errorMessage.value = '這筆不是正式資料庫活動，請先重新送出建立成功後，再進入設定。'
    return
  }

  const type = String(campaign.gameType || '').toUpperCase()

  if (type === 'GRID') {
    router.push(`/admin/premium-grid-settings/${campaign.id}`)
    return
  }

  if (type === 'GOLDEN_EGG') {
    const tenantSlug = getTenantSlug(campaign)
    const playerUrl = getPlayerUrl(campaign)
    const query = new URLSearchParams({
      singleGame: '1',
      gameId: 'golden-egg',
      gameType: 'GOLDEN_EGG',
      campaignId: String(campaign.id),
      tenantSlug: String(tenantSlug || ''),
      playerUrl: String(playerUrl || '')
    })

    router.push(`/admin/golden-egg?${query.toString()}`)
    return
  }

  if (type === 'WHEEL') {
    const tenantSlug = getTenantSlug(campaign)
    const playerUrl = getPlayerUrl(campaign)
    const query = new URLSearchParams({
      singleGame: '1',
      gameId: 'wheel',
      gameType: 'WHEEL',
      campaignId: String(campaign.id),
      tenantSlug: String(tenantSlug || ''),
      playerUrl: String(playerUrl || '')
    })

    router.push(`/admin/game-settings?${query.toString()}`)
    return
  }

  router.push('/admin/campaigns')
}

const goPremiumGridSettings = goGameSettings

const toggleCampaignStatus = async (campaign) => {
  resetMessages()

  const currentStatus = getCampaignDisplayStatus(campaign)
  const nextStatus = String(currentStatus || '').toUpperCase() === 'ACTIVE'
    ? 'INACTIVE'
    : 'ACTIVE'
  const id = String(campaign?.id || '')

  if (!id) {
    errorMessage.value = '找不到活動 ID，無法切換狀態。'
    return
  }

  if (!canOperateCampaign(campaign)) {
    errorMessage.value = getCampaignOperateHint(campaign)
    return
  }

  campaignStatusOverrides[id] = nextStatus

  const index = campaigns.value.findIndex((item) => String(item.id) === id)
  if (index !== -1) {
    campaigns.value[index] = {
      ...campaigns.value[index],
      status: nextStatus
    }
  }

  message.value = `畫面已切換為 ${nextStatus}，正在同步後端。`

  try {
    try {
      await updateCampaignApi(campaign.id, {
        status: nextStatus
      })
    } catch (firstError) {
      if ([404, 405].includes(firstError?.response?.status)) {
        await http.patch(`/campaigns/${campaign.id}`, {
          status: nextStatus
        })
      } else {
        throw firstError
      }
    }

    message.value = `活動狀態已同步為 ${nextStatus}。`
  } catch (error) {
    console.error('更新活動狀態失敗:', error)
    errorMessage.value = error?.response?.data?.message || '後端狀態同步失敗，但畫面已先切換；請確認 API 是否支援活動狀態更新。'
  }
}

const removeCampaign = async (campaign) => {
  resetMessages()

  if (!campaign?.id) {
    errorMessage.value = '找不到活動 ID，無法刪除。'
    return
  }

  if (!canOperateCampaign(campaign)) {
    errorMessage.value = getCampaignOperateHint(campaign)
    return
  }

  if (!window.confirm(`確定要刪除活動「${campaign.title || campaign.name || campaign.id}」嗎？這會同步刪除資料庫活動與相關序號 / 獎品 / 紀錄。`)) {
    return
  }

  const campaignId = campaign.id
  const title = campaign.title || campaign.name || campaign.id
  deletingCampaignId.value = campaignId

  // 本頁草稿只存在前端，直接清掉本機快取即可。
  if (isLocalDraftCampaign(campaign)) {
    removeCampaignFromList(campaignId)
    removeCampaignFromLocalCaches(campaignId)
    message.value = `已刪除本頁草稿：${title}`
    deletingCampaignId.value = null
    return
  }

  try {
    let response

    try {
      response = await deleteCampaignApi(campaignId)
    } catch (firstError) {
      if ([404, 405].includes(firstError?.response?.status)) {
        response = await http.delete(`/campaigns/${campaignId}`)
      } else {
        throw firstError
      }
    }

    removeCampaignFromList(campaignId)
    removeCampaignFromLocalCaches(campaignId)

    message.value = response?.data?.message
      ? `${response.data.message}：${title}`
      : `已從資料庫刪除活動：${title}`

    await loadCampaigns()
  } catch (error) {
    console.error('資料庫刪除活動失敗:', error)

    errorMessage.value = error?.response?.data?.message
      ? `刪除失敗：${error.response.data.message}`
      : '刪除失敗，資料庫尚未刪除。請查看後端 npm run dev 視窗錯誤。'
  } finally {
    deletingCampaignId.value = null
  }
}


onMounted(() => {
  loadCampaigns()
})
</script>

<template>
  <div class="min-h-screen bg-slate-100 px-4 py-6 text-slate-900">
    <div class="mx-auto max-w-7xl space-y-6">
      <header class="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p class="text-sm font-black text-violet-600">
              Multi Game Platform V2.3｜第 17501～17900 批
            </p>
            <h1 class="mt-2 text-3xl font-black">
              活動管理｜正式資料庫活動列表版
            </h1>
            <p class="mt-3 max-w-4xl text-sm font-bold leading-7 text-slate-500">
              這版活動列表只以 PostgreSQL 正式資料為準，不再混入最近建立快取，避免點進不存在資料庫的活動 ID。
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
              @click="loadCampaigns"
            >
              重新整理
            </button>
            <button
              type="button"
              class="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-black text-rose-700 shadow-sm transition hover:bg-rose-100"
              @click="localCampaignDrafts = []; recentCreatedCampaigns = []; saveLocalCampaignDrafts(); saveRecentCreatedCampaigns(); loadCampaigns()"
            >
              清除本機暫存活動
            </button>
            <button
              type="button"
              class="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-slate-800"
              @click="fillExampleByGameType(form.gameType)"
            >
              一鍵帶入目前遊戲範例
            </button>
          </div>
        </div>

        <div
          v-if="message"
          class="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"
        >
          {{ message }}
        </div>
        <div
          v-if="errorMessage"
          class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700"
        >
          {{ errorMessage }}
        </div>
      </header>

      <section class="rounded-[32px] border border-emerald-200 bg-white p-6 shadow-sm">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p class="text-sm font-black text-emerald-600">
              正式商家交付中心｜第 33201～33600 批
            </p>
            <h2 class="mt-1 text-2xl font-black text-slate-950">
              三遊戲正式玩家網址、客服文字與營運狀態
            </h2>
            <p class="mt-2 max-w-4xl text-sm font-bold leading-7 text-slate-500">
              這裡整理輪盤、九宮格、砸金蛋三個正式網址。商家可以一鍵複製網址、一鍵開啟玩家頁，也可以直接複製客服發送文字。
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
              @click="copyOfficialCustomerServiceText"
            >
              複製客服文字
            </button>
            <button
              type="button"
              class="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              @click="loadCampaigns"
            >
              重新整理活動
            </button>
          </div>
        </div>

        <div class="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="card in officialDeliverySummaryCards"
            :key="card.label"
            class="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4"
          >
            <p class="text-xs font-black text-slate-400">
              {{ card.label }}
            </p>
            <p class="mt-2 truncate text-2xl font-black text-slate-950">
              {{ card.value }}
            </p>
            <p class="mt-1 truncate text-xs font-bold text-slate-500">
              {{ card.note }}
            </p>
          </div>
        </div>

        <div class="mt-5 grid gap-4 lg:grid-cols-3">
          <article
            v-for="item in officialDeliveryLinks"
            :key="item.type"
            class="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-3xl">{{ item.emoji }}</p>
                <h3 class="mt-2 text-xl font-black text-slate-950">
                  {{ item.label }}
                </h3>
                <p class="mt-2 text-sm font-bold leading-6 text-slate-500">
                  {{ item.description }}
                </p>
              </div>
              <span
                :class="[
                  'rounded-full px-3 py-1 text-xs font-black',
                  item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                ]"
              >
                {{ item.status }}
              </span>
            </div>

            <div class="mt-4 rounded-2xl bg-white px-4 py-3 text-xs font-bold leading-6 text-slate-600">
              <p class="font-black text-slate-900">正式玩家網址</p>
              <p class="break-all font-mono text-[11px] text-slate-500">
                {{ item.url }}
              </p>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                class="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
                @click="copyOfficialPlayerUrl(item)"
              >
                複製網址
              </button>
              <button
                type="button"
                class="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                @click="openOfficialPlayerUrl(item)"
              >
                開啟玩家頁
              </button>
            </div>

            <p
              v-if="!item.hasCampaign"
              class="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-6 text-amber-700"
            >
              目前尚未在活動列表找到這個遊戲的正式活動，請先建立並啟用活動後再交付商家。
            </p>
          </article>
        </div>

        <div class="mt-5 rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="text-sm font-black text-emerald-700">
                商家客服可複製文字
              </p>
              <p class="mt-1 text-xs font-bold text-emerald-600">
                可以直接貼到 LINE、簡訊、社群或客服對話。
              </p>
            </div>
            <button
              type="button"
              class="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
              @click="copyOfficialCustomerServiceText"
            >
              複製整段文字
            </button>
          </div>
          <pre class="mt-4 whitespace-pre-wrap rounded-2xl bg-white p-4 text-sm font-bold leading-7 text-slate-700">{{ officialCustomerServiceText }}</pre>
        </div>
      </section>

      <section class="rounded-[32px] border border-violet-200 bg-white p-6 shadow-sm">
        <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p class="text-sm font-black text-violet-600">
              商家快速建立遊戲
            </p>
            <h2 class="mt-1 text-2xl font-black text-slate-950">
              先選一種遊戲，系統會幫商家建立活動草稿
            </h2>
            <p class="mt-2 text-sm font-bold leading-6 text-slate-500">
              A / B 商家進來這裡，就可以直接建立自己的九宮格、幸運輪盤或砸金蛋活動。
            </p>
          </div>
          <span class="rounded-full bg-violet-50 px-4 py-2 text-xs font-black text-violet-700">
            建立後可再進入設定修改
          </span>
        </div>

        <div class="mt-5 grid gap-4 md:grid-cols-3">
          <div
            v-for="option in gameTypeOptions"
            :key="option.value"
            class="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xl font-black text-slate-950">
                  {{ option.label }}
                </p>
                <p class="mt-2 text-sm font-bold leading-6 text-slate-500">
                  {{ option.description }}
                </p>
              </div>
              <span
                :class="[
                  'rounded-full px-3 py-1 text-xs font-black',
                  form.gameType === option.value
                    ? 'bg-violet-600 text-white'
                    : 'bg-white text-slate-500'
                ]"
              >
                {{ option.value }}
              </span>
            </div>

            <div class="mt-5 grid gap-2">
              <button
                type="button"
                class="rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm font-black text-violet-700 transition hover:bg-violet-50"
                @click="form.gameType = option.value; fillExampleByGameType(option.value)"
              >
                帶入範例並往下編輯
              </button>
              <button
                type="button"
                :disabled="Boolean(quickCreatingGameType)"
                class="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
                @click="quickCreateGameCampaign(option.value)"
              >
                {{ quickCreatingGameType === option.value ? '建立中...' : `建立${option.label}活動` }}
              </button>
            </div>
          </div>
        </div>

        <div class="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-700">
          提醒：快速建立會先產生活動，之後請在活動列表按「進入設定」調整文字、顏色、獎項、序號與玩家預覽。
        </div>
      </section>

      <section class="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p class="text-sm font-black text-violet-600">
              商家今日操作流程
            </p>
            <h2 class="mt-1 text-2xl font-black text-slate-950">
              只要照這 4 步驟，就能把遊戲活動發給客人
            </h2>
          </div>
          <button
            type="button"
            class="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3 text-sm font-black text-violet-700 transition hover:bg-violet-100"
            @click="fillExampleByGameType(form.gameType)"
          >
            一鍵帶入目前遊戲範例
          </button>
        </div>

        <div class="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="item in merchantTodaySteps"
            :key="item.step"
            :class="[
              'rounded-3xl border p-5 shadow-sm',
              item.done ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'
            ]"
          >
            <div class="flex items-center justify-between gap-3">
              <span
                :class="[
                  'flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-black',
                  item.done ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500'
                ]"
              >
                {{ item.step }}
              </span>
              <span
                :class="[
                  'rounded-full px-3 py-1 text-xs font-black',
                  item.done ? 'bg-white text-emerald-700' : 'bg-white text-slate-400'
                ]"
              >
                {{ item.done ? '完成' : '待處理' }}
              </span>
            </div>
            <p class="mt-4 text-lg font-black text-slate-950">
              {{ item.title }}
            </p>
            <p class="mt-2 text-sm font-bold leading-6 text-slate-500">
              {{ item.description }}
            </p>
          </div>
        </div>
      </section>

      <section class="rounded-[32px] border border-violet-200 bg-white p-6 shadow-sm">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p class="text-sm font-black text-violet-600">
              遊戲活動統一操作區
            </p>
            <h2 class="mt-1 text-2xl font-black">
              選遊戲 → 產生序號 → 匯出中文 CSV → 複製正式遠端玩家連結
            </h2>
            <p class="mt-2 text-sm font-bold leading-6 text-slate-500">
              商家最常用的建立、修改、序號與連結操作都集中在這裡。
            </p>
          </div>

          <div class="w-full xl:max-w-sm">
            <label class="space-y-2">
              <span class="text-xs font-black text-slate-500">目前遊戲活動</span>
              <select
                v-model="selectedCampaignId"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                @change="loadSerialList(selectedCampaignId)"
              >
                <option value="">請選擇遊戲活動</option>
                <option
                  v-for="campaign in merchantGameCampaigns"
                  :key="campaign.id"
                  :value="campaign.id"
                >
                  #{{ campaign.id }}｜{{ campaign.title || campaign.name }}
                </option>
              </select>
            </label>
          </div>
        </div>

        <div class="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="card in selectedCampaignSummaryCards"
            :key="card.label"
            class="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4"
          >
            <p class="text-xs font-black text-slate-400">
              {{ card.label }}
            </p>
            <p class="mt-2 truncate text-2xl font-black text-slate-950">
              {{ card.value }}
            </p>
            <p class="mt-1 truncate text-xs font-bold text-slate-500">
              {{ card.note }}
            </p>
          </div>
        </div>

        <div class="mt-5 rounded-3xl border border-violet-100 bg-violet-50 p-4">
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="text-sm font-black text-violet-700">
                快速操作
              </p>
              <p class="mt-1 text-xs font-bold text-violet-500">
                這四個按鈕就是商家每天最常用的完整流程。
              </p>
            </div>
            <span class="rounded-full bg-white px-4 py-2 text-xs font-black text-violet-700">
              {{ selectedCampaign ? '已選活動' : '請先選活動' }}
            </span>
          </div>
        </div>

        <div
          v-if="isLocalDraftCampaign(selectedCampaign)"
          class="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-700"
        >
          目前選到的是「本頁草稿」。請先在活動列表按「重新送出建立」，成功寫入資料庫後，才能產生序號、匯出 CSV 與給客人使用。
        </div>

        <div class="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr_1fr_1fr]">
          <button
            type="button"
            class="rounded-3xl bg-violet-600 px-5 py-4 text-left text-white shadow-sm transition hover:bg-violet-700"
            @click="goGameSettings()"
          >
            <p class="text-sm font-black opacity-80">STEP 1</p>
            <p class="mt-1 text-xl font-black">進入遊戲設定</p>
            <p class="mt-2 text-sm font-bold opacity-80">修改文字、顏色、獎項、序號與玩家預覽。</p>
          </button>

          <button
            type="button"
            :disabled="serialLoading"
            class="rounded-3xl bg-indigo-600 px-5 py-4 text-left text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
            @click="generateSerialCodes(20)"
          >
            <p class="text-sm font-black opacity-80">STEP 2</p>
            <p class="mt-1 text-xl font-black">{{ serialLoading ? '產生中...' : '產生 20 組序號' }}</p>
            <p class="mt-2 text-sm font-bold opacity-80">一般商家最常用數量，會套用下方可使用次數。</p>
          </button>

          <button
            type="button"
            class="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-left text-emerald-800 shadow-sm transition hover:bg-emerald-100"
            @click="exportSerialCsv"
          >
            <p class="text-sm font-black opacity-80">STEP 3</p>
            <p class="mt-1 text-xl font-black">匯出中文 CSV</p>
            <p class="mt-2 text-sm font-bold opacity-80">下載中文欄位序號清單。</p>
          </button>

          <button
            type="button"
            class="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-left text-slate-800 shadow-sm transition hover:bg-slate-100"
            @click="copyPlayerUrl"
          >
            <p class="text-sm font-black opacity-80">STEP 4</p>
            <p class="mt-1 text-xl font-black">複製玩家連結</p>
            <p class="mt-2 text-sm font-bold opacity-80">連結 + 序號一起給客人。</p>
          </button>
        </div>

        <div class="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1fr_1fr]">
          <label class="space-y-2">
            <span class="text-xs font-black text-slate-500">自訂產生數量</span>
            <input
              v-model.number="serialForm.count"
              type="number"
              min="1"
              max="500"
              class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
            />
          </label>
          <label class="space-y-2">
            <span class="text-xs font-black text-slate-500">每組可使用次數</span>
            <input
              v-model.number="serialForm.rewardChance"
              type="number"
              min="1"
              max="999"
              class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
            />
          </label>
          <label class="space-y-2">
            <span class="text-xs font-black text-slate-500">序號前綴</span>
            <input
              v-model="serialForm.prefix"
              class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
            />
          </label>
          <label class="space-y-2">
            <span class="text-xs font-black text-slate-500">批次代碼</span>
            <input
              v-model="serialForm.batchCode"
              class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
            />
          </label>
          <button
            type="button"
            :disabled="serialLoading"
            class="self-end rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
            @click="generateSerialCodes(serialForm.count)"
          >
            {{ serialLoading ? '產生中...' : '自訂數量產生' }}
          </button>
        </div>

        <div class="mt-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-bold leading-6 text-indigo-700">
          目前設定：每產生 1 組序號，可讓客人使用
          <span class="font-black text-indigo-900">{{ serialForm.rewardChance || 1 }}</span>
          次。
        </div>
        <div class="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="text-sm font-black text-amber-700">
                手動建立指定序號
              </p>
              <h3 class="mt-1 text-xl font-black text-slate-950">
                自己打一組序號給客人輸入遊玩
              </h3>
              <p class="mt-1 text-sm font-bold leading-6 text-amber-700">
                適合 VIP 客人、現場客人、補發序號、特殊活動碼。
              </p>
            </div>
            <span class="rounded-full bg-white px-4 py-2 text-xs font-black text-amber-700">
              MANUAL
            </span>
          </div>

          <div class="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
            <label class="space-y-2">
              <span class="text-xs font-black text-slate-600">指定序號</span>
              <input
                v-model="manualSerialForm.code"
                class="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
                placeholder="例如 VIP520 或 A-SHOP-001"
                @blur="manualSerialForm.code = normalizeManualSerialCode(manualSerialForm.code)"
              />
            </label>
            <label class="space-y-2">
              <span class="text-xs font-black text-slate-600">可使用次數</span>
              <input
                v-model.number="manualSerialForm.rewardChance"
                type="number"
                min="1"
                max="999"
                class="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
              />
            </label>
            <label class="space-y-2">
              <span class="text-xs font-black text-slate-600">批次代碼</span>
              <input
                v-model="manualSerialForm.batchCode"
                class="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
              />
            </label>
            <label class="space-y-2">
              <span class="text-xs font-black text-slate-600">備註</span>
              <input
                v-model="manualSerialForm.note"
                class="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
              />
            </label>
          </div>

          <div class="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div class="rounded-2xl bg-white/80 px-4 py-3 text-sm font-bold leading-6 text-amber-800">
              預覽：
              <span class="font-mono font-black">
                {{ normalizeManualSerialCode(manualSerialForm.code) || '尚未輸入' }}
              </span>
              ｜可用 {{ manualSerialForm.rewardChance || 1 }} 次
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                class="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-black text-amber-700 transition hover:bg-amber-100"
                @click="resetManualSerialForm"
              >
                清空
              </button>
              <button
                type="button"
                :disabled="serialLoading"
                class="rounded-2xl bg-amber-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-50"
                @click="createManualSerialCode"
              >
                {{ serialLoading ? '建立中...' : '建立指定序號' }}
              </button>
            </div>
          </div>
        </div>

        <div class="mt-5 grid gap-4 md:grid-cols-4">
          <div class="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p class="text-xs font-black text-slate-400">總數</p>
            <p class="mt-2 text-3xl font-black">{{ serialStats.total }}</p>
          </div>
          <div class="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 shadow-sm">
            <p class="text-xs font-black text-emerald-600">未使用</p>
            <p class="mt-2 text-3xl font-black text-emerald-700">{{ serialStats.unused }}</p>
          </div>
          <div class="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 shadow-sm">
            <p class="text-xs font-black text-slate-400">已使用</p>
            <p class="mt-2 text-3xl font-black">{{ serialStats.used }}</p>
          </div>
          <div class="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm">
            <p class="text-xs font-black text-amber-600">已發放</p>
            <p class="mt-2 text-3xl font-black text-amber-700">{{ serialStats.issued }}</p>
          </div>
        </div>

        <div class="mt-5 rounded-3xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold leading-7 text-blue-800">
          <p>
            玩家連結：
            <span class="font-black">{{ selectedPlayerUrl || '請先選擇九宮格活動' }}</span>
          </p>
          <p>
            中文 CSV：
            <span class="font-black">目前會依照下方搜尋 / 狀態篩選結果匯出中文 CSV</span>
          </p>
        </div>
      </section>

      <section class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
        <div id="merchant-campaign-create-form" class="scroll-mt-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 class="text-2xl font-black">
                一、建立遊戲活動
              </h2>
              <p class="mt-2 text-sm font-bold leading-6 text-slate-500">
                商家可以自行選擇九宮格、輪盤或砸金蛋，建立成功後即可進入設定與產生序號。
              </p>
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                class="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                @click="resetForm"
              >
                清空表單
              </button>
              <button
                type="button"
                :disabled="submitting"
                class="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
                @click="createCampaign"
              >
                {{ submitting ? '新增中...' : '新增活動' }}
              </button>
            </div>
          </div>

          <div class="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-bold leading-6 text-indigo-700">
            商家可以直接按「新增活動」；如果沒有輸入活動名稱，系統會依照目前選擇的遊戲自動建立預設名稱。
          </div>

          <div class="mt-6 grid gap-3 md:grid-cols-3">
            <button
              v-for="option in gameTypeOptions"
              :key="option.value"
              type="button"
              :class="[
                'rounded-3xl border p-5 text-left transition',
                form.gameType === option.value
                  ? 'border-violet-300 bg-violet-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              ]"
              @click="form.gameType = option.value; fillExampleByGameType(option.value)"
            >
              <p class="text-lg font-black text-slate-950">
                {{ option.label }}
              </p>
              <p class="mt-2 text-sm font-bold leading-6 text-slate-500">
                {{ option.description }}
              </p>
              <span
                v-if="form.gameType === option.value"
                class="mt-4 inline-flex rounded-full bg-violet-600 px-3 py-1 text-xs font-black text-white"
              >
                已選擇
              </span>
            </button>
          </div>

          <div class="mt-6 grid gap-4 md:grid-cols-2">
            <label class="space-y-2">
              <span class="text-sm font-black text-slate-700">活動名稱</span>
              <input
                v-model="form.title"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
                placeholder="例如：母親節抽獎活動"
              />
            </label>
            <label class="space-y-2">
              <span class="text-sm font-black text-slate-700">活動類型</span>
              <select
                v-model="form.gameType"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
              >
                <option value="GRID">九宮格 GRID</option>
                <option value="WHEEL">輪盤 WHEEL</option>
                <option value="GOLDEN_EGG">砸金蛋 GOLDEN_EGG</option>
              </select>
            </label>
            <label class="space-y-2 md:col-span-2">
              <span class="text-sm font-black text-slate-700">活動說明</span>
              <textarea
                v-model="form.description"
                rows="3"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
                placeholder="輸入給玩家看的活動說明"
              ></textarea>
            </label>
            <label class="space-y-2">
              <span class="text-sm font-black text-slate-700">開始時間</span>
              <input
                v-model="form.startAt"
                type="datetime-local"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
              />
            </label>
            <label class="space-y-2">
              <span class="text-sm font-black text-slate-700">結束時間</span>
              <input
                v-model="form.endAt"
                type="datetime-local"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
              />
            </label>
            <label class="space-y-2">
              <span class="text-sm font-black text-slate-700">每日遊玩次數</span>
              <input
                v-model.number="form.dailyLimit"
                type="number"
                min="1"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
              />
            </label>
            <label class="space-y-2">
              <span class="text-sm font-black text-slate-700">每人總遊玩次數</span>
              <input
                v-model.number="form.totalLimit"
                type="number"
                min="1"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
              />
            </label>
            <label class="space-y-2">
              <span class="text-sm font-black text-slate-700">活動狀態</span>
              <select
                v-model="form.status"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
              >
                <option value="DRAFT">草稿 DRAFT</option>
                <option value="ACTIVE">啟用 ACTIVE</option>
                <option value="INACTIVE">暫停 INACTIVE</option>
              </select>
            </label>
            <label class="space-y-2">
              <span class="text-sm font-black text-slate-700">是否需要登入</span>
              <select
                v-model="form.requireLogin"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
              >
                <option :value="false">否，客人輸入序號即可玩</option>
                <option :value="true">是，需要登入</option>
              </select>
            </label>
          </div>

          <div class="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5">
            <h3 class="text-xl font-black">
              二、序號規則
            </h3>
            <div class="mt-4 grid gap-4 md:grid-cols-2">
              <label class="space-y-2">
                <span class="text-sm font-black text-slate-700">預設序號前綴</span>
                <input
                  v-model="form.settings.serialPrefix"
                  class="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
                />
              </label>
              <label class="space-y-2">
                <span class="text-sm font-black text-slate-700">玩家提示文字</span>
                <input
                  v-model="form.settings.playerHint"
                  class="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
                />
              </label>
            </div>
          </div>
        </div>

        <aside class="space-y-6">
          <section class="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="text-xl font-black">
              商家最簡流程
            </h2>
            <ol class="mt-4 space-y-3 text-sm font-bold leading-6 text-slate-600">
              <li class="rounded-2xl bg-slate-50 px-4 py-3">1. 建立九宮格活動。</li>
              <li class="rounded-2xl bg-slate-50 px-4 py-3">2. 到上方統一操作區產生序號。</li>
              <li class="rounded-2xl bg-slate-50 px-4 py-3">3. 匯出中文 CSV 給客人。</li>
              <li class="rounded-2xl bg-slate-50 px-4 py-3">4. 複製玩家連結給客人。</li>
              <li class="rounded-2xl bg-slate-50 px-4 py-3">5. 客人打開連結輸入序號遊玩。</li>
            </ol>
          </section>

          <section class="rounded-[32px] border border-blue-200 bg-blue-50 p-6 shadow-sm">
            <h2 class="text-xl font-black text-blue-950">
              固定保護連結
            </h2>
            <div class="mt-4 space-y-3 text-sm font-bold leading-6 text-blue-800">
              <div class="rounded-2xl bg-white/70 px-4 py-3">
                <p class="font-black">commonGrid 測試區</p>
                <p>{{ frontOrigin }}/games/premium-grid?commonGrid=1</p>
              </div>
              <div class="rounded-2xl bg-white/70 px-4 py-3">
                <p class="font-black">legacyGrid 緊急回退</p>
                <p>{{ frontOrigin }}/games/premium-grid?legacyGrid=1</p>
              </div>
            </div>
          </section>
        </aside>
      </section>

      <section class="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 class="text-2xl font-black">
              活動列表
            </h2>
            <p class="mt-2 text-sm font-bold text-slate-500">
              點「使用此活動」後，上方統一操作區會載入這個活動的序號與正式遠端玩家連結。
            </p>
          </div>
          <span class="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">
            共 {{ merchantGameCampaigns.length }} 個活動｜可營運 {{ merchantGameCampaigns.length }} 個
          </span>
        </div>

        <div
          v-if="loading"
          class="mt-6 rounded-3xl bg-slate-50 px-6 py-10 text-center text-sm font-black text-slate-500"
        >
          載入中...
        </div>

        <div
          v-else-if="!campaigns.length"
          class="mt-6 rounded-3xl bg-slate-50 px-6 py-10 text-center text-sm font-black text-slate-500"
        >
          目前沒有活動，請先新增遊戲活動。
        </div>

        <div
          v-else
          class="mt-6 overflow-hidden rounded-3xl border border-slate-200"
        >
          <table class="w-full min-w-[960px] text-left text-sm">
            <thead class="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-4 py-3">活動</th>
                <th class="px-4 py-3">類型</th>
                <th class="px-4 py-3">狀態</th>
                <th class="px-4 py-3">時間</th>
                <th class="px-4 py-3">商家</th>
                <th class="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="campaign in merchantGameCampaigns"
                :key="campaign.id"
                :class="[
                  'border-t border-slate-100 align-top transition',
                  String(selectedCampaignId) === String(campaign.id) ? 'bg-violet-50/60' : 'bg-white'
                ]"
              >
                <td class="px-4 py-4">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="font-black text-slate-950">
                      {{ campaign.title || campaign.name }}
                    </p>
                    <span
                      v-if="String(selectedCampaignId) === String(campaign.id)"
                      class="rounded-full bg-violet-600 px-3 py-1 text-xs font-black text-white"
                    >
                      目前選用
                    </span>
                    <span
                      :class="[
                        'rounded-full px-3 py-1 text-xs font-black',
                        getCampaignSourceClass(campaign)
                      ]"
                    >
                      {{ getCampaignSourceText(campaign) }}
                    </span>
                  </div>
                  <p class="mt-1 text-xs font-bold text-slate-500">
                    {{ campaign.description || '沒有活動說明' }}
                  </p>
                  <div
                    v-if="['GRID', 'WHEEL', 'GOLDEN_EGG'].includes(String(campaign.gameType).toUpperCase())"
                    class="mt-3 rounded-2xl bg-indigo-50 px-4 py-3 text-xs font-bold leading-5 text-indigo-700"
                  >
                    <p class="font-black">{{ getGameTypeLabel(campaign.gameType) }}玩家連結</p>
                    <p>{{ getPlayerUrl(campaign) }}</p>
                  </div>
                </td>
                <td class="px-4 py-4">
                  <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                    {{ campaign.gameType }}
                  </span>
                </td>
                <td class="px-4 py-4">
                  <span
                    :class="[
                      'rounded-full px-3 py-1 text-xs font-black',
                      getCampaignStatusClass(campaign)
                    ]"
                  >
                    {{ getCampaignStatusText(campaign) }}
                  </span>
                </td>
                <td class="px-4 py-4 text-xs font-bold leading-6 text-slate-500">
                  <p>開始：{{ campaign.startAt || '-' }}</p>
                  <p>結束：{{ campaign.endAt || '-' }}</p>
                </td>
                <td class="px-4 py-4 text-xs font-bold leading-6 text-slate-500">
                  <p>{{ campaign.tenant?.name || campaign.tenantName || '平台 / 未綁定商家' }}</p>
                  <p>slug：{{ getTenantSlug(campaign) }}</p>
                </td>
                <td class="px-4 py-4">
                  <div class="grid gap-2">
                    <button
                      v-if="isLocalDraftCampaign(campaign)"
                      type="button"
                      class="rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-black text-amber-700 transition hover:bg-amber-50"
                      @click="retryCreateLocalDraftCampaign(campaign)"
                    >
                      重新送出建立
                    </button>
                    <button
                      v-if="['GRID', 'WHEEL', 'GOLDEN_EGG'].includes(String(campaign.gameType).toUpperCase())"
                      type="button"
                      :disabled="!canOperateCampaign(campaign)"
                      class="rounded-xl bg-violet-600 px-3 py-2 text-xs font-black text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
                      @click="selectedCampaignId = campaign.id; loadSerialList(campaign.id); goGameSettings(campaign)"
                    >
                      進入設定
                    </button>
                    <button
                      v-if="['GRID', 'WHEEL', 'GOLDEN_EGG'].includes(String(campaign.gameType).toUpperCase())"
                      type="button"
                      :disabled="!canOperateCampaign(campaign)"
                      class="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-black text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40"
                      @click="selectedCampaignId = campaign.id; loadSerialList(campaign.id)"
                    >
                      使用此活動
                    </button>
                    <button
                      type="button"
                      :class="[
                        'rounded-xl border px-3 py-2 text-xs font-black transition',
                        isCampaignActive(campaign)
                          ? 'border-amber-200 bg-white text-amber-700 hover:bg-amber-50'
                          : 'border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50'
                      ]"
                      @click="toggleCampaignStatus(campaign)"
                    >
                      {{ isCampaignActive(campaign) ? '暫停活動' : '啟用活動' }}
                    </button>
                    <button
                      type="button"
                      :disabled="String(deletingCampaignId) === String(campaign.id) || !canOperateCampaign(campaign)"
                      class="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-black text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                      @click="removeCampaign(campaign)"
                    >
                      {{ String(deletingCampaignId) === String(campaign.id) ? '刪除資料庫中...' : '刪除' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 class="text-2xl font-black">
              序號管理
            </h2>
            <p class="mt-2 text-sm font-bold text-slate-500">
              目前選擇活動：{{ selectedCampaign ? `#${selectedCampaign.id}｜${selectedCampaign.title || selectedCampaign.name}` : '尚未選擇' }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
              @click="resetSerialFilters"
            >
              清除篩選
            </button>
            <button
              type="button"
              :disabled="serialListLoading"
              class="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              @click="loadSerialList(selectedCampaignId, true)"
            >
              {{ serialListLoading ? '載入中...' : '重新載入序號' }}
            </button>
          </div>
        </div>

        <div class="mt-5 grid gap-3 xl:grid-cols-[1fr_180px_180px_180px_180px]">
          <label class="space-y-2">
            <span class="text-xs font-black text-slate-500">搜尋序號 / 批次 / 備註</span>
            <input
              v-model="serialSearchKeyword"
              class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              placeholder="輸入序號關鍵字"
              @input="serialCurrentPage = 1"
            />
          </label>
          <label class="space-y-2">
            <span class="text-xs font-black text-slate-500">狀態</span>
            <select
              v-model="serialStatusFilter"
              class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
              @change="serialCurrentPage = 1"
            >
              <option value="ALL">全部</option>
              <option value="UNUSED">未使用</option>
              <option value="USED">已使用</option>
              <option value="ISSUED">已發放</option>
              <option value="PAUSED">暫停使用</option>
              <option value="EXPIRED">已過期</option>
            </select>
          </label>
          <label class="space-y-2">
            <span class="text-xs font-black text-slate-500">每頁顯示</span>
            <select
              v-model.number="serialPageSize"
              class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
              @change="serialCurrentPage = 1"
            >
              <option :value="10">10 筆</option>
              <option :value="20">20 筆</option>
              <option :value="50">50 筆</option>
              <option :value="100">100 筆</option>
            </select>
          </label>
          <div class="rounded-2xl bg-slate-50 px-4 py-3">
            <p class="text-xs font-black text-slate-400">目前顯示</p>
            <p class="mt-1 text-sm font-black text-slate-800">{{ serialPageInfoText }}</p>
          </div>
          <div class="rounded-2xl bg-violet-50 px-4 py-3">
            <p class="text-xs font-black text-violet-500">勾選狀態</p>
            <p class="mt-1 text-sm font-black text-violet-800">{{ selectedSerialCountText }}</p>
          </div>
        </div>

        <div
          v-if="serialCodes.length"
          class="mt-4 rounded-3xl border border-violet-100 bg-violet-50 p-4"
        >
          <div class="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="text-sm font-black text-violet-700">
                序號批次工具列
              </p>
              <p class="mt-1 text-xs font-bold text-violet-500">
                先勾選序號，再批次暫停、恢復或刪除。
              </p>
            </div>
            <span class="rounded-full bg-white px-4 py-2 text-xs font-black text-violet-700">
              {{ selectedSerialCountText }}
            </span>
          </div>

          <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-xl border border-violet-200 bg-white px-4 py-2 text-sm font-black text-violet-700 transition hover:bg-violet-100"
            @click="toggleCurrentPageSelection"
          >
            {{ isCurrentPageAllSelected ? '取消本頁勾選' : '勾選本頁' }}
          </button>
          <button
            type="button"
            class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            @click="clearSerialSelection"
          >
            清除勾選
          </button>
          <button
            type="button"
            class="rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-black text-amber-700 transition hover:bg-amber-50"
            @click="bulkUpdateSelectedSerialStatus('PAUSED')"
          >
            批次暫停
          </button>
          <button
            type="button"
            class="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
            @click="bulkUpdateSelectedSerialStatus('UNUSED')"
          >
            批次恢復
          </button>
          <button
            type="button"
            class="rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-black text-rose-700 transition hover:bg-rose-50"
            @click="bulkDeleteSelectedSerialCodes"
          >
            批次刪除
          </button>
          </div>
        </div>

        <div
          v-if="!selectedCampaignId"
          class="mt-6 rounded-3xl bg-slate-50 px-6 py-10 text-center text-sm font-black text-slate-500"
        >
          請先在上方選擇遊戲活動。
        </div>

        <div
          v-else-if="!serialCodes.length"
          class="mt-6 rounded-3xl bg-slate-50 px-6 py-10 text-center text-sm font-black text-slate-500"
        >
          尚無序號，請按上方「產生 20 組序號」。
        </div>

        <div
          v-else-if="!filteredSerialCodes.length"
          class="mt-6 rounded-3xl bg-slate-50 px-6 py-10 text-center text-sm font-black text-slate-500"
        >
          沒有符合搜尋或狀態篩選的序號。
        </div>

        <div
          v-else
          class="mt-6 overflow-hidden rounded-3xl border border-slate-200"
        >
          <table class="w-full min-w-[960px] text-left text-sm">
            <thead class="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-4 py-3">
                  <input
                    type="checkbox"
                    :checked="isCurrentPageAllSelected"
                    @change="toggleCurrentPageSelection"
                  />
                </th>
                <th class="px-4 py-3">序號</th>
                <th class="px-4 py-3">狀態</th>
                <th class="px-4 py-3">可用次數</th>
                <th class="px-4 py-3">批次</th>
                <th class="px-4 py-3">過期</th>
                <th class="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="code in pagedSerialCodes"
                :key="code.id || code.code"
                class="border-t border-slate-100"
              >
                <td class="px-4 py-3">
                  <input
                    type="checkbox"
                    :checked="selectedSerialIds.includes(getSerialRowId(code))"
                    @change="toggleSerialSelection(code)"
                  />
                </td>
                <td class="px-4 py-3 font-mono text-xs font-black">
                  {{ code.code || code.serial || code.value }}
                  <p class="mt-1 font-sans text-xs font-bold text-slate-400">
                    {{ code.note || '-' }}
                  </p>
                </td>
                <td class="px-4 py-3">
                  <span
                    :class="[
                      'rounded-full px-3 py-1 text-xs font-black',
                      String(code.status).toUpperCase() === 'UNUSED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : String(code.status).toUpperCase() === 'USED'
                          ? 'bg-slate-100 text-slate-600'
                          : String(code.status).toUpperCase() === 'PAUSED'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                    ]"
                  >
                    {{ getSerialStatusText(code.status) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-xs font-black text-slate-700">
                  {{ code.rewardChance || code.chance || 1 }} 次
                </td>
                <td class="px-4 py-3 text-xs font-bold text-slate-500">
                  {{ code.batchCode || code.batch || '-' }}
                </td>
                <td class="px-4 py-3 text-xs font-bold text-slate-500">
                  {{ code.expiresAt || code.expiredAt || '-' }}
                </td>
                <td class="px-4 py-3">
                  <div class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                      @click="copyText(code.code || code.serial || code.value, '已複製序號')"
                    >
                      複製
                    </button>
                    <button
                      type="button"
                      class="rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-black text-amber-700 transition hover:bg-amber-50"
                      @click="updateSerialStatus(code, 'PAUSED')"
                    >
                      暫停
                    </button>
                    <button
                      type="button"
                      class="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-50"
                      @click="updateSerialStatus(code, 'UNUSED')"
                    >
                      恢復
                    </button>
                    <button
                      type="button"
                      class="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-black text-rose-700 transition hover:bg-rose-50"
                      @click="deleteSerialCode(code)"
                    >
                      刪除
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-if="filteredSerialCodes.length"
          class="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
        >
          <p class="text-sm font-bold text-slate-500">
            {{ serialPageInfoText }}
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              :disabled="serialCurrentPage <= 1"
              class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 disabled:opacity-40"
              @click="serialCurrentPage = Math.max(1, serialCurrentPage - 1)"
            >
              上一頁
            </button>
            <span class="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">
              第 {{ serialCurrentPage }} / {{ serialTotalPages }} 頁
            </span>
            <button
              type="button"
              :disabled="serialCurrentPage >= serialTotalPages"
              class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 disabled:opacity-40"
              @click="serialCurrentPage = Math.min(serialTotalPages, serialCurrentPage + 1)"
            >
              下一頁
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
