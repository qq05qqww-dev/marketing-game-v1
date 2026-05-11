<script setup>
// 第 74001～74400 批：輪盤百分比準確驗證與防呆版
// 延續第 73601～74000 批：輪盤指針顏色控制版
// 第 69201～69600 批：輪盤中心按鈕文字控制與高規格一鍵套用版
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const STORAGE_PREFIX = 'mgp:wheel-admin-settings:'
const PRODUCTION_FRONTEND_URL = 'https://marketing-game-v1.vercel.app'
const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/$/, '')

const normalizeSingleQueryValue = (value = '') => {
  const raw = Array.isArray(value) ? value[0] : value
  return String(raw || '').split(',')[0].trim()
}

const getAuthToken = () => {
  if (typeof localStorage === 'undefined') return ''
  return localStorage.getItem('token') || localStorage.getItem('authToken') || ''
}

const getAuthHeaders = () => {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const routeRecordId = computed(() => normalizeSingleQueryValue(route.params.id || route.query.campaignId || route.query.id || ''))
const templateId = computed(() => normalizeSingleQueryValue(route.query.gameId || route.query.templateId || 'wheel') || 'wheel')
const isPlatformTemplateMode = computed(() => {
  const id = routeRecordId.value

  return route.query.templateMode === '1' ||
    route.query.templateOnly === '1' ||
    id === 'template' ||
    id === 'wheel-template' ||
    id === 'platform-template'
})
const campaignId = computed(() => (isPlatformTemplateMode.value ? '' : routeRecordId.value))
const tenantSlug = computed(() => normalizeSingleQueryValue(route.query.tenantSlug || 'a-shop') || 'a-shop')

const getStoredAuthUser = () => {
  if (typeof localStorage === 'undefined') return {}

  try {
    const raw = localStorage.getItem('user') || localStorage.getItem('authUser') || ''
    return raw ? JSON.parse(raw) : {}
  } catch (error) {
    return {}
  }
}

const getWindowOrigin = () => {
  if (typeof window === 'undefined') return ''
  return String(window.location?.origin || '')
}

const normalizeTenantScopeSlug = (value = '') => normalizeSingleQueryValue(value).toLowerCase()

const normalizeUrl = (value = '') => String(value || '').trim().replace(/\/$/, '')
const isLocalOrigin = (value = '') => /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(String(value || ''))

const frontOrigin = computed(() => {
  const envUrl = normalizeUrl(
    import.meta.env.VITE_PUBLIC_FRONTEND_URL ||
      import.meta.env.VITE_FRONTEND_URL ||
      import.meta.env.VITE_APP_FRONTEND_URL ||
      ''
  )

  if (envUrl) return envUrl

  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = normalizeUrl(window.location.origin)
    return origin || PRODUCTION_FRONTEND_URL
  }

  return PRODUCTION_FRONTEND_URL
})

const apiEnvironmentGuard = computed(() => {
  const currentFrontendOrigin = normalizeUrl(getWindowOrigin()) || frontOrigin.value
  const currentApiBase = normalizeUrl(API_BASE_URL)
  const frontendIsLocal = isLocalOrigin(currentFrontendOrigin)
  const apiIsLocal = isLocalOrigin(currentApiBase)
  const apiIsRender = /onrender\.com/i.test(currentApiBase)
  const frontendIsVercel = /vercel\.app/i.test(currentFrontendOrigin)
  const user = getStoredAuthUser()
  const loggedTenantSlug = normalizeTenantScopeSlug(
    user?.tenantSlug ||
      user?.merchantSlug ||
      user?.tenant?.slug ||
      user?.tenant?.tenantSlug ||
      ''
  )
  const urlTenantSlug = normalizeTenantScopeSlug(tenantSlug.value)
  const role = String(user?.role || '').toUpperCase()
  const isTenantMismatch = Boolean(
    !isPlatformTemplateMode.value &&
      loggedTenantSlug &&
      urlTenantSlug &&
      loggedTenantSlug !== urlTenantSlug
  )
  const willSyncOfficialPlayer = frontendIsVercel && apiIsRender && !isTenantMismatch

  return {
    eyebrow: 'API Environment Guard｜第 60801～61200 批',
    title: willSyncOfficialPlayer
      ? '目前正在修改線上正式資料庫'
      : (apiIsLocal ? '目前正在修改本機測試資料庫' : '目前 API 環境需確認'),
    frontendLabel: frontendIsLocal ? '本機前端 localhost' : (frontendIsVercel ? 'Vercel 線上前端' : '其他前端來源'),
    frontendValue: currentFrontendOrigin || '-',
    apiLabel: apiIsLocal ? '本機 API / 本機資料庫' : (apiIsRender ? 'Render API / 線上資料庫' : '自訂 API'),
    apiValue: currentApiBase || '-',
    playerSyncLabel: willSyncOfficialPlayer
      ? '正式玩家頁會讀取同一套線上資料庫，儲存後玩家重新整理即可看到。'
      : (apiIsLocal
          ? '目前會寫入本機 localhost 資料庫；Vercel 正式玩家頁不會同步這些本機修改。'
          : '請確認 VITE_API_BASE_URL 是否指向正式 Render API。'),
    loggedTenantLabel: loggedTenantSlug || (role.includes('ADMIN') ? '平台管理員 / 可跨商家' : '尚未讀到登入商家'),
    urlTenantLabel: isPlatformTemplateMode.value ? '平台模板模式' : (urlTenantSlug || '網址未帶 tenantSlug'),
    roleLabel: role || 'UNKNOWN',
    mismatch: isTenantMismatch,
    safe: willSyncOfficialPlayer,
    toneClass: isTenantMismatch
      ? 'border-rose-200 bg-rose-50 text-rose-800'
      : (willSyncOfficialPlayer ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'),
    badgeClass: isTenantMismatch
      ? 'bg-rose-100 text-rose-800 ring-1 ring-rose-200'
      : (willSyncOfficialPlayer ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200' : 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'),
    badge: isTenantMismatch ? '商家不一致' : (willSyncOfficialPlayer ? '線上同步正常' : '本機 / 測試環境'),
    warning: isTenantMismatch
      ? `登入商家是 ${loggedTenantSlug}，但網址 tenantSlug 是 ${urlTenantSlug}。請從「我的活動」點進設定頁，不要手動混用別的商家網址。`
      : (apiIsLocal
          ? '你現在可以測右側預覽，但正式客人網址要同步，必須在線上 Vercel 後台儲存，或把本機 VITE_API_BASE_URL 指到 Render。'
          : 'Render 是後端 API，不是商家後台網址；商家要進 Vercel 的 /admin 頁面操作。')
  }
})

const apiEnvironmentItems = computed(() => [
  { label: '目前前端', value: apiEnvironmentGuard.value.frontendValue, note: apiEnvironmentGuard.value.frontendLabel },
  { label: '目前 API', value: apiEnvironmentGuard.value.apiValue, note: apiEnvironmentGuard.value.apiLabel },
  { label: '登入商家', value: apiEnvironmentGuard.value.loggedTenantLabel, note: `role: ${apiEnvironmentGuard.value.roleLabel}` },
  { label: '網址商家', value: apiEnvironmentGuard.value.urlTenantLabel, note: isPlatformTemplateMode.value ? '平台模板不綁單一商家' : '來自 tenantSlug query' }
])

const playerUrl = computed(() => {
  if (isPlatformTemplateMode.value) {
    const rawTemplateUrl = normalizeSingleQueryValue(route.query.playerUrl || '/games/wheel') || '/games/wheel'
    const path = rawTemplateUrl.startsWith('/') ? rawTemplateUrl : `/${rawTemplateUrl}`
    return `${frontOrigin.value}${path}`
  }

  const raw = normalizeSingleQueryValue(route.query.playerUrl || '')

  const buildCleanUrl = (baseUrl) => {
    try {
      const parsed = new URL(baseUrl, frontOrigin.value)
      parsed.searchParams.delete('adminPreview')
      parsed.searchParams.delete('adminPreviewDraft')
      parsed.searchParams.delete('previewKey')
      parsed.searchParams.delete('tenantSlug')

      if (campaignId.value) {
        parsed.searchParams.set('campaignId', campaignId.value)
      }

      return `${frontOrigin.value}${parsed.pathname}${parsed.search || ''}`
    } catch (error) {
      const query = campaignId.value ? `?campaignId=${encodeURIComponent(campaignId.value)}` : ''
      return `${frontOrigin.value}/play/${tenantSlug.value}/wheel${query}`
    }
  }

  if (raw) {
    return buildCleanUrl(raw.startsWith('/') ? `${frontOrigin.value}${raw}` : raw)
  }

  const query = campaignId.value ? `?campaignId=${encodeURIComponent(campaignId.value)}` : ''
  return `${frontOrigin.value}/play/${tenantSlug.value}/wheel${query}`
})
const storageKey = computed(() => isPlatformTemplateMode.value
  ? `${STORAGE_PREFIX}platform-template:${templateId.value}`
  : `${STORAGE_PREFIX}${tenantSlug.value}:${campaignId.value || 'draft'}`
)
const saveAuditHistoryKey = computed(() => `${storageKey.value}:save-audit-history`)
const platformWheelTemplateSlug = computed(() => `platform-wheel-template-${templateId.value || 'wheel'}`)
const platformTemplateCampaignId = ref('')
const platformTemplateRemoteLoaded = ref(false)
const savedMessage = ref('')
const copiedMessage = ref('')
const saveErrorMessage = ref('')
const saveAuditRecord = ref(null)
const saveAuditHistory = ref([])
const remoteConfigLoaded = ref(false)
const isSaving = ref(false)
const previewKey = ref(0)
const activeCategory = ref('basic')
const categoryPanelCollapsed = ref(false)
const settingSearchQuery = ref('')
const previewIframeRef = ref(null)
const previewFocusMode = ref('wheel')
const previewDeviceMode = ref('phone')
const previewZoomMode = ref('100')
const isSettingsHydrating = ref(true)
const hasUnsavedChanges = ref(false)
const lastChangedAt = ref('')
const lastSavedAt = ref('')
const settingsSnapshotAfterSave = ref('')
const unsavedChangeReason = ref('尚未偵測到本次修改')
const previewSmoothSyncStatus = ref('平滑預覽待命')
const previewSmoothSyncAt = ref('')
const previewSmoothSyncCount = ref(0)
const previewSmoothSyncMode = ref('idle')
const prizePercentSimulationDraws = ref(1000)
const prizePercentSimulationResults = ref([])
const prizePercentSimulationAt = ref('')
const prizePercentSimulatorExpanded = ref(false)

const previewFocusOptions = [
  { key: 'top', label: '上方' },
  { key: 'wheel', label: '輪盤' },
  { key: 'serial', label: '序號' },
  { key: 'records', label: '紀錄' }
]

const previewDeviceOptions = [
  { key: 'phone', label: '手機', desc: '390×760', frameWidth: '430px', iframeHeightClass: 'h-[760px]' },
  { key: 'longPhone', label: '長手機', desc: '390×880', frameWidth: '430px', iframeHeightClass: 'h-[880px]' },
  { key: 'tablet', label: '平板', desc: '520×780', frameWidth: '560px', iframeHeightClass: 'h-[780px]' }
]

const previewZoomOptions = [
  { key: '90', label: '90%', scale: 0.9, desc: '縮小檢查滿版' },
  { key: '100', label: '100%', scale: 1, desc: '標準比例' },
  { key: '110', label: '110%', scale: 1.1, desc: '放大檢查細節' },
  { key: '120', label: '120%', scale: 1.2, desc: '滿版壓力測試' }
]

const previewDeviceProfile = computed(() => {
  return previewDeviceOptions.find((item) => item.key === previewDeviceMode.value) || previewDeviceOptions[0]
})

const previewZoomProfile = computed(() => {
  return previewZoomOptions.find((item) => item.key === previewZoomMode.value) || previewZoomOptions[1]
})

const previewFrameStyle = computed(() => ({
  maxWidth: previewDeviceProfile.value.frameWidth
}))

const previewIframeHeightClass = computed(() => previewDeviceProfile.value.iframeHeightClass)

const previewIframeScaleStyle = computed(() => ({
  zoom: previewZoomProfile.value.scale
}))

const setPreviewDeviceMode = (mode = 'phone') => {
  // 第 66401～66800 批：裝置框架只改外層尺寸，不重載 iframe，避免右側白畫面閃爍。
  previewDeviceMode.value = mode
  previewSmoothSyncStatus.value = `已切換預覽裝置：${previewDeviceProfile.value.label}`
  previewSmoothSyncMode.value = 'frame'
  previewSmoothSyncAt.value = new Date().toLocaleTimeString('zh-TW', { hour12: false })
  nextTick(scrollPreviewToFocus)
}

const setPreviewZoomMode = (mode = '100') => {
  // 第 66401～66800 批：縮放只套用 CSS，不重載 iframe。
  previewZoomMode.value = mode
  previewSmoothSyncStatus.value = `已切換預覽縮放：${previewZoomProfile.value.label}`
  previewSmoothSyncMode.value = 'frame'
  previewSmoothSyncAt.value = new Date().toLocaleTimeString('zh-TW', { hour12: false })
  nextTick(scrollPreviewToFocus)
}

const settingCategories = [
  { key: 'polish', icon: '精', title: '模組精緻', desc: '一鍵套用高級輪盤視覺預設' },
  { key: 'basic', icon: '文', title: '基本文字', desc: '活動標題、副標題、提示文字' },
  { key: 'theme', icon: '色', title: '主題色彩', desc: '背景、按鈕、指針與輪盤顏色' },
  { key: 'wheel', icon: '盤', title: '輪盤樣式', desc: '輪盤外框、中心按鈕與獎項顯示' },
  { key: 'display', icon: '示', title: '展示區塊', desc: '剩餘次數、紀錄、獎品牆' },
  { key: 'serial', icon: '碼', title: '序號抽獎', desc: '序號標題、提示與驗證文字' },
  { key: 'result', icon: '窗', title: '結果彈窗', desc: '中獎標題與行動按鈕文字' },
  { key: 'sound', icon: '效', title: '音效特效', desc: '音效開關與抽獎遮蔽' },
  { key: 'rules', icon: '規', title: '規則說明', desc: '活動規則與獎品說明顯示' },
  { key: 'frontend', icon: '設', title: '前台設定', desc: '玩家網址、預覽與公開顯示' },
  { key: 'prizes', icon: '獎', title: '輪盤獎項', desc: '獎項名稱、中獎百分比與顏色' }
]


const quickSettingCategoryKeys = ['polish', 'basic', 'theme', 'wheel', 'prizes']

const settingSearchKeywordMap = {
  polish: ['精緻', '模組', '預設', '金白', '綠金', '紅金', '清爽', '高級', '實體活動', 'polish', 'preset'],
  basic: ['標題', '副標題', '文字', '活動名稱', '品牌', 'logo', 'page', 'title', 'headline'],
  theme: ['顏色', '色彩', '背景', '按鈕', '指針', '外框', '主題', 'color', 'theme'],
  wheel: ['輪盤', '尺寸', '大小', '中心', '中心按鈕', '按鈕文字', '字色', '外圈', '圖示', '文字大小', '指針', 'wheel', 'spin'],
  display: ['顯示', '展示', '剩餘次數', '狀態', '紀錄', '獎品牆', 'debug'],
  serial: ['序號', '驗證', '輸入', 'serial', 'code'],
  result: ['結果', '中獎', '彈窗', '恭喜', 'result'],
  sound: ['音效', '特效', '聲音', '彩帶', '光暈', '抖動', 'sound', 'effect'],
  rules: ['規則', '說明', '獎品說明', '兌換', 'footer'],
  frontend: ['前台', '玩家網址', '預覽', '公開', '連結', 'url'],
  prizes: ['獎項', '獎品', '百分比', '機率', '權重', '顏色', '優惠券', 'prize', 'reward', 'percent']
}

const normalizeSearchText = (value = '') => String(value || '').trim().toLowerCase()

const enrichedSettingCategories = computed(() => settingCategories.map((category) => ({
  ...category,
  searchText: normalizeSearchText([
    category.key,
    category.title,
    category.desc,
    ...(settingSearchKeywordMap[category.key] || [])
  ].join(' '))
})))

const normalizedSettingSearchQuery = computed(() => normalizeSearchText(settingSearchQuery.value))

const quickSettingCategories = computed(() => {
  return enrichedSettingCategories.value.filter((category) => quickSettingCategoryKeys.includes(category.key))
})

const settingSearchMatchedCategories = computed(() => {
  const keyword = normalizedSettingSearchQuery.value
  if (!keyword) return []

  return enrichedSettingCategories.value.filter((category) => category.searchText.includes(keyword))
})

const filteredSettingCategories = computed(() => {
  const keyword = normalizedSettingSearchQuery.value
  if (!keyword) return enrichedSettingCategories.value

  return settingSearchMatchedCategories.value
})

const settingSearchSummary = computed(() => {
  const keyword = normalizedSettingSearchQuery.value
  const total = settingSearchMatchedCategories.value.length

  if (!keyword) {
    return '輸入關鍵字可以快速定位標題、顏色、輪盤、指針、按鈕、獎項、序號與音效設定。'
  }

  return total
    ? `已找到 ${total} 個相關設定分類，點選結果可直接切換。`
    : '沒有找到符合的分類，請改用「顏色、輪盤、獎項、序號、音效」等關鍵字。'
})

const clearSettingSearch = () => {
  settingSearchQuery.value = ''
}

const setCategoryFromSearch = (key) => {
  setCategory(key)
  categoryPanelCollapsed.value = false
}

const currentSettingCategory = computed(() => {
  return settingCategories.find((category) => category.key === activeCategory.value) || settingCategories[0]
})

const categoryPanelSummary = computed(() => {
  const current = currentSettingCategory.value

  return {
    eyebrow: 'Quick Category Guard｜第 63601～64000 批',
    title: categoryPanelCollapsed.value ? `目前編輯：${current.title}` : '輪盤設定分類',
    desc: categoryPanelCollapsed.value
      ? `分類清單已收合，左側只保留常用設定與目前分類：${current.desc}`
      : '設定分類與模組精緻集中在左側，右側固定顯示輪盤玩家預覽。可收合分類清單，避免左側過長、修改時一直上下滑。',
    activeTitle: current.title,
    activeDesc: current.desc,
    activeIcon: current.icon
  }
})

const collapseCategoryPanel = () => {
  categoryPanelCollapsed.value = true
}

const expandCategoryPanel = () => {
  categoryPanelCollapsed.value = false
}

const toggleCategoryPanel = () => {
  categoryPanelCollapsed.value = !categoryPanelCollapsed.value
}

const themeLabels = {
  backgroundFrom: '背景起始色',
  backgroundTo: '背景結束色',
  panelColor: '面板底色',
  wheelOuterColor: '輪盤外框色',
  pointerColor: '指針顏色',
  spinButtonColor: '中心按鈕色',
  actionButtonFrom: '主按鈕起始色',
  actionButtonTo: '主按鈕結束色'
}

const themeDescriptions = {
  backgroundFrom: '玩家頁上方與底色的第一個顏色。',
  backgroundTo: '玩家頁背景漸層的結束顏色。',
  panelColor: '資訊卡片與提示區塊的柔和底色。',
  wheelOuterColor: '輪盤外圈、光暈與金色框的主色。',
  pointerColor: '輪盤上方指針顏色。',
  spinButtonColor: '輪盤中心 SPIN 按鈕顏色。',
  actionButtonFrom: '開始轉盤按鈕漸層左側顏色。',
  actionButtonTo: '開始轉盤按鈕漸層右側顏色。'
}

const wheelPolishPresets = [
  {
    key: 'luxuryGold',
    name: '典雅金白實體活動版',
    badge: '推薦',
    desc: '乾淨高級、像實體活動輪盤：香檳金外圈、小燈泡、綠白交錯扇形、紅色固定指針，玩家一眼覺得精緻但不複雜。',
    theme: {
      backgroundFrom: '#fff8e7',
      backgroundTo: '#b45309',
      panelColor: '#fff7ed',
      wheelOuterColor: '#f6c453',
      pointerColor: '#dc2626',
      spinButtonColor: '#14532d',
      actionButtonFrom: '#f59e0b',
      actionButtonTo: '#b45309'
    },
    wheelStyle: {
      wheelSize: 372,
      outerRingWidth: 18,
      showRimLights: true,
      rimLightCount: 30,
      rimLightSize: 9,
      wheelDepthLevel: 78,
      stageGlowLevel: 72,
      stageShadowLevel: 70,
      stageCornerLevel: 76,
      stageInnerLightLevel: 64,
      centerButtonSize: 98,
      centerButtonText: 'SPIN',
      centerButtonTextSize: 18,
      centerButtonTextColor: '#ffffff',
      centerButtonBorderColor: '#fde68a',
      pointerSize: 52,
      pointerOffsetY: -10,
      pointerGlossLevel: 72,
      pointerShadowLevel: 68,
      pointerTopColor: '#dc2626',
      pointerArrowColor: '#b91c1c',
      pointerDotColor: '#fde047',
      prizeTextSize: 14,
      prizeIconSize: 40,
      prizeLabelRadius: 76,
      prizeTextColor: '#ffffff',
      prizeTextStrokeColor: '#1f2937',
      prizeBadgeBgOpacity: 16,
      sliceGlossLevel: 48,
      prizeTextBoxWidth: 92,
      showPrizeIcon: true,
      showPrizeName: true,
      showSliceBorder: true
    },
    effects: {
      enableTickSound: true,
      enableResultSound: true,
      enablePointerShake: true,
      enableLightGlow: true,
      enableConfetti: true,
      enableSpinMask: true
    }
  },
  {
    key: 'emeraldGold',
    name: '翡翠金店面精品版',
    badge: '精品',
    desc: '深翡翠綠搭配金白外圈，適合會員制、精品店、餐飲品牌與高單價促銷，質感明顯但不會太暗。',
    theme: {
      backgroundFrom: '#ecfdf5',
      backgroundTo: '#065f46',
      panelColor: '#fefce8',
      wheelOuterColor: '#eab308',
      pointerColor: '#dc2626',
      spinButtonColor: '#064e3b',
      actionButtonFrom: '#10b981',
      actionButtonTo: '#047857'
    },
    wheelStyle: {
      wheelSize: 376,
      outerRingWidth: 20,
      showRimLights: true,
      rimLightCount: 32,
      rimLightSize: 9,
      wheelDepthLevel: 86,
      stageGlowLevel: 72,
      stageShadowLevel: 70,
      stageCornerLevel: 76,
      stageInnerLightLevel: 64,
      centerButtonSize: 100,
      centerButtonText: 'START',
      centerButtonTextSize: 17,
      centerButtonTextColor: '#fef3c7',
      centerButtonBorderColor: '#fde68a',
      pointerSize: 54,
      pointerOffsetY: -12,
      pointerGlossLevel: 76,
      pointerShadowLevel: 72,
      pointerTopColor: '#dc2626',
      pointerArrowColor: '#991b1b',
      pointerDotColor: '#fde047',
      prizeTextSize: 14,
      prizeIconSize: 40,
      prizeLabelRadius: 77,
      prizeTextColor: '#ffffff',
      prizeTextStrokeColor: '#1f2937',
      prizeBadgeBgOpacity: 16,
      sliceGlossLevel: 48,
      prizeTextBoxWidth: 94,
      showPrizeIcon: true,
      showPrizeName: true,
      showSliceBorder: true
    },
    effects: {
      enableTickSound: true,
      enableResultSound: true,
      enablePointerShake: true,
      enableLightGlow: true,
      enableConfetti: true,
      enableSpinMask: true
    }
  },
  {
    key: 'redGoldStage',
    name: '紅金舞台活動版',
    badge: '熱鬧',
    desc: '紅色指針、金色厚外圈與亮燈舞台感，適合開幕、週年慶、門市現場活動與直播抽獎。',
    theme: {
      backgroundFrom: '#fff1f2',
      backgroundTo: '#b91c1c',
      panelColor: '#fff7ed',
      wheelOuterColor: '#facc15',
      pointerColor: '#b91c1c',
      spinButtonColor: '#7f1d1d',
      actionButtonFrom: '#f97316',
      actionButtonTo: '#b91c1c'
    },
    wheelStyle: {
      wheelSize: 368,
      outerRingWidth: 18,
      showRimLights: true,
      rimLightCount: 30,
      rimLightSize: 9,
      wheelDepthLevel: 78,
      stageGlowLevel: 72,
      stageShadowLevel: 70,
      stageCornerLevel: 76,
      stageInnerLightLevel: 64,
      centerButtonSize: 96,
      centerButtonText: '抽獎',
      centerButtonTextSize: 18,
      centerButtonTextColor: '#ffffff',
      centerButtonBorderColor: '#fde68a',
      pointerSize: 54,
      pointerOffsetY: -12,
      pointerGlossLevel: 76,
      pointerShadowLevel: 72,
      pointerTopColor: '#dc2626',
      pointerArrowColor: '#991b1b',
      pointerDotColor: '#fde047',
      prizeTextSize: 14,
      prizeIconSize: 40,
      prizeLabelRadius: 75,
      prizeTextColor: '#ffffff',
      prizeTextStrokeColor: '#1f2937',
      prizeBadgeBgOpacity: 16,
      sliceGlossLevel: 48,
      prizeTextBoxWidth: 92,
      showPrizeIcon: true,
      showPrizeName: true,
      showSliceBorder: true
    },
    effects: {
      enableTickSound: true,
      enableResultSound: true,
      enablePointerShake: true,
      enableLightGlow: true,
      enableConfetti: true,
      enableSpinMask: true
    }
  },
  {
    key: 'royalBlueGold',
    name: '皇家藍金企業版',
    badge: '企業',
    desc: '藍金配色更沉穩，適合企業活動、品牌發表、展場抽獎。整體高規格但保持文字清楚。',
    theme: {
      backgroundFrom: '#eff6ff',
      backgroundTo: '#1d4ed8',
      panelColor: '#dbeafe',
      wheelOuterColor: '#facc15',
      pointerColor: '#dc2626',
      spinButtonColor: '#1e3a8a',
      actionButtonFrom: '#3b82f6',
      actionButtonTo: '#1d4ed8'
    },
    wheelStyle: {
      wheelSize: 372,
      outerRingWidth: 19,
      showRimLights: true,
      rimLightCount: 32,
      rimLightSize: 8,
      wheelDepthLevel: 94,
      stageGlowLevel: 72,
      stageShadowLevel: 70,
      stageCornerLevel: 76,
      stageInnerLightLevel: 64,
      centerButtonSize: 98,
      centerButtonText: 'GO',
      centerButtonTextSize: 20,
      centerButtonTextColor: '#ffffff',
      centerButtonBorderColor: '#fef3c7',
      pointerSize: 52,
      pointerOffsetY: -10,
      pointerGlossLevel: 72,
      pointerShadowLevel: 68,
      pointerTopColor: '#dc2626',
      pointerArrowColor: '#b91c1c',
      pointerDotColor: '#fde047',
      prizeTextSize: 14,
      prizeIconSize: 40,
      prizeLabelRadius: 76,
      prizeTextColor: '#ffffff',
      prizeTextStrokeColor: '#1f2937',
      prizeBadgeBgOpacity: 16,
      sliceGlossLevel: 48,
      prizeTextBoxWidth: 92,
      showPrizeIcon: true,
      showPrizeName: true,
      showSliceBorder: true
    },
    effects: {
      enableTickSound: true,
      enableResultSound: true,
      enablePointerShake: true,
      enableLightGlow: true,
      enableConfetti: true,
      enableSpinMask: true
    }
  },
  {
    key: 'carnivalYellowGreen',
    name: '嘉年華黃綠燈泡版',
    badge: '現場',
    desc: '更接近實體活動輪盤：黃金外圈、綠白扇形、紅指針、明亮燈泡，適合門市與市集活動。',
    theme: {
      backgroundFrom: '#fefce8',
      backgroundTo: '#ca8a04',
      panelColor: '#fef9c3',
      wheelOuterColor: '#facc15',
      pointerColor: '#dc2626',
      spinButtonColor: '#166534',
      actionButtonFrom: '#eab308',
      actionButtonTo: '#a16207'
    },
    wheelStyle: {
      wheelSize: 380,
      outerRingWidth: 21,
      showRimLights: true,
      rimLightCount: 36,
      rimLightSize: 10,
      wheelDepthLevel: 94,
      stageGlowLevel: 72,
      stageShadowLevel: 70,
      stageCornerLevel: 76,
      stageInnerLightLevel: 64,
      centerButtonSize: 96,
      centerButtonText: 'START',
      centerButtonTextSize: 16,
      centerButtonTextColor: '#ffffff',
      centerButtonBorderColor: '#fef08a',
      pointerSize: 56,
      pointerOffsetY: -14,
      pointerGlossLevel: 78,
      pointerShadowLevel: 78,
      pointerTopColor: '#e11d48',
      pointerArrowColor: '#be123c',
      pointerDotColor: '#facc15',
      prizeTextSize: 13,
      prizeIconSize: 38,
      prizeLabelRadius: 78,
      prizeTextColor: '#ffffff',
      prizeTextStrokeColor: '#1f2937',
      prizeBadgeBgOpacity: 16,
      sliceGlossLevel: 48,
      prizeTextBoxWidth: 90,
      showPrizeIcon: true,
      showPrizeName: true,
      showSliceBorder: true
    },
    effects: {
      enableTickSound: true,
      enableResultSound: true,
      enablePointerShake: true,
      enableLightGlow: true,
      enableConfetti: true,
      enableSpinMask: true
    }
  },
  {
    key: 'cleanOrange',
    name: '清爽金橘商家版',
    badge: '乾淨',
    desc: '保留乾淨橘白風格，但加厚外圈、提高文字清晰度與中心按鈕質感，適合一般商家直接套用。',
    theme: {
      backgroundFrom: '#fff7ed',
      backgroundTo: '#fdba74',
      panelColor: '#ffffff',
      wheelOuterColor: '#f59e0b',
      pointerColor: '#ea580c',
      spinButtonColor: '#92400e',
      actionButtonFrom: '#fb923c',
      actionButtonTo: '#ea580c'
    },
    wheelStyle: {
      wheelSize: 352,
      outerRingWidth: 15,
      showRimLights: true,
      rimLightCount: 24,
      rimLightSize: 7,
      wheelDepthLevel: 52,
      stageGlowLevel: 72,
      stageShadowLevel: 70,
      stageCornerLevel: 76,
      stageInnerLightLevel: 64,
      centerButtonSize: 92,
      centerButtonText: 'SPIN',
      centerButtonTextSize: 17,
      centerButtonTextColor: '#ffffff',
      centerButtonBorderColor: '#ffedd5',
      pointerSize: 48,
      pointerOffsetY: -8,
      pointerGlossLevel: 64,
      pointerShadowLevel: 58,
      pointerTopColor: '#ea580c',
      pointerArrowColor: '#c2410c',
      pointerDotColor: '#fde047',
      prizeTextSize: 14,
      prizeIconSize: 38,
      prizeLabelRadius: 74,
      prizeTextColor: '#ffffff',
      prizeTextStrokeColor: '#1f2937',
      prizeBadgeBgOpacity: 16,
      sliceGlossLevel: 48,
      prizeTextBoxWidth: 90,
      showPrizeIcon: true,
      showPrizeName: true,
      showSliceBorder: true
    },
    effects: {
      enableTickSound: true,
      enableResultSound: true,
      enablePointerShake: true,
      enableLightGlow: true,
      enableConfetti: true,
      enableSpinMask: true
    }
  }
]
const wheelPolishSummary = computed(() => ({
  eyebrow: 'Wheel Module Polish｜第 70401～70800 批',
  title: '正確基準輪盤高規格預設清理版',
  desc: isPlatformTemplateMode.value
    ? '這裡從第 69601～70000 正確檔案往下重作輪盤，只保留乾淨、高級、實體活動輪盤方向；新輪盤活動建立時才會複製這些設定，既有商家活動不會被同步污染。'
    : '這裡從第 69601～70000 正確檔案往下重作輪盤，只調整目前商家活動的輪盤高級視覺，不會回寫平台模板，也不會影響其他商家。',
  target: isPlatformTemplateMode.value
    ? platformWheelTemplateSlug.value
    : `tenant:${tenantSlug.value} / campaignId:${campaignId.value || '-'}`,
  guard: isPlatformTemplateMode.value
    ? '只保存平台模板草稿；玩家頁不直接讀模板。'
    : '只更新目前活動 gameConfig.settings；玩家頁讀此活動資料庫設定。'
}))


const currentWheelPolishMeta = computed(() => {
  const meta = settings?.templateMeta?.visualPolish

  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
    return {}
  }

  return meta
})

const currentWheelPolishPreset = computed(() => {
  const presetKey = String(currentWheelPolishMeta.value?.presetKey || '').trim()

  return wheelPolishPresets.find((item) => item.key === presetKey) || null
})

const currentWheelPolishStatus = computed(() => {
  const preset = currentWheelPolishPreset.value
  const meta = currentWheelPolishMeta.value

  if (!preset) {
    return {
      eyebrow: 'Polish Active Preset｜第 70001～70400 批',
      title: '尚未套用精緻預設',
      badge: '未套用',
      badgeClass: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
      desc: '目前輪盤使用一般設定。你可以在下方選擇一個精緻預設，右側預覽會立即更新；本批已清理後續無效方向，從正確檔案重新延伸。',
      presetName: '尚未套用',
      appliedAt: '尚未套用',
      target: wheelPolishSummary.value.target,
      safe: false
    }
  }

  return {
    eyebrow: 'Polish Active Preset｜第 70001～70400 批',
    title: `目前套用：${preset.name}`,
    badge: preset.badge || '已套用',
    badgeClass: 'bg-orange-100 text-orange-800 ring-1 ring-orange-200',
    desc: preset.desc,
    presetName: preset.name,
    appliedAt: meta.appliedAt ? formatSaveAuditTime(meta.appliedAt) : '尚未記錄時間',
    target: meta.target || wheelPolishSummary.value.target,
    safe: true
  }
})

const isCurrentWheelPolishPreset = (presetKey = '') => {
  return String(currentWheelPolishMeta.value?.presetKey || '') === String(presetKey || '')
}

const applyWheelPolishPreset = (presetKey = '') => {
  const preset = wheelPolishPresets.find((item) => item.key === presetKey)
  if (!preset) return

  assignDeep(settings.theme, preset.theme)
  assignDeep(settings.wheelStyle, preset.wheelStyle)
  assignDeep(settings.effects, preset.effects)
  settings.display.showBrandCard = true
  settings.display.showStatusCard = true
  settings.display.showRemainingChance = true
  settings.display.showSerialBox = true
  settings.display.showHistory = true
  settings.display.enableSound = true

  if (!settings.templateMeta || typeof settings.templateMeta !== 'object' || Array.isArray(settings.templateMeta)) {
    settings.templateMeta = {}
  }

  settings.templateMeta.visualPolish = {
    batch: '70001-70400',
    presetKey: preset.key,
    presetName: preset.name,
    appliedAt: new Date().toISOString(),
    mode: isPlatformTemplateMode.value ? 'platform_template' : 'merchant_campaign',
    target: isPlatformTemplateMode.value
      ? platformWheelTemplateSlug.value
      : `tenant:${tenantSlug.value} / campaignId:${campaignId.value || '-'}`,
    isolationGuard: isPlatformTemplateMode.value
      ? '平台模板預設只供新活動建立時複製，不自動覆蓋既有商家活動。'
      : '商家活動視覺只保存到目前活動，不回寫平台模板。'
  }

  activeCategory.value = 'polish'

  // 第 60401～60800 批：套用精緻預設後立即寫入右側預覽草稿。
  // 原本只切換 previewKey，iframe 可能先重新載入舊 localStorage，導致右側預覽看起來沒有變。
  // 這裡先保存草稿，再重新載入 preview，確保點套用後右側畫面立即同步。
  if (typeof window !== 'undefined') {
    window.clearTimeout(previewSyncTimer)
  }

  persistLocalDraft('settings-update')
  previewFocusMode.value = 'wheel'
  nextTick(scrollPreviewToFocus)

  markSettingsDirty(`已套用「${preset.name}」，右側預覽已更新但尚未儲存`)
  savedMessage.value = `已套用「${preset.name}」，右側預覽已更新；請按儲存設定保存。`
  window.setTimeout(() => {
    savedMessage.value = ''
  }, 2600)
}


// 第 66001～66400 批：輪盤精緻預設微調面板。
// 讓平台模板與商家活動在同一個「模組精緻」分類內快速微調常用輪盤尺寸，不必切到多個分類。
const polishFineTuneControls = [
  {
    key: 'wheelSize',
    label: '輪盤大小',
    unit: 'px',
    min: 280,
    max: 420,
    step: 4,
    desc: '控制整個輪盤直徑。手機版建議 320～376。'
  },
  {
    key: 'outerRingWidth',
    label: '外框厚度',
    unit: 'px',
    min: 8,
    max: 26,
    step: 1,
    desc: '控制金屬外圈厚度。高級實體活動版建議略厚，會更像真實抽獎輪盤。'
  },
  {
    key: 'pointerSize',
    label: '指針大小',
    unit: 'px',
    min: 32,
    max: 68,
    step: 1,
    desc: '控制上方指針比例，太大會壓到輪盤文字。'
  },
  {
    key: 'pointerOffsetY',
    label: '指針上下位置',
    unit: 'px',
    min: -36,
    max: 24,
    step: 1,
    desc: '第 72401～72800 批：微調指針高度。負數往上，正數往下；用來對齊輪盤外圈與命中點。'
  },
  {
    key: 'pointerGlossLevel',
    label: '指針高光質感',
    unit: '%',
    min: 0,
    max: 100,
    step: 1,
    desc: '控制指針表面反光，數字越高越像立體烤漆。'
  },
  {
    key: 'pointerShadowLevel',
    label: '指針陰影厚度',
    unit: '%',
    min: 0,
    max: 100,
    step: 1,
    desc: '控制指針落影與厚重感，數字越高越有舞台指針感。'
  },
  {
    key: 'centerButtonSize',
    label: '中心按鈕',
    unit: 'px',
    min: 72,
    max: 116,
    step: 2,
    desc: '控制 SPIN 中心按鈕大小。'
  },
  {
    key: 'prizeTextSize',
    label: '獎項文字',
    unit: 'px',
    min: 8,
    max: 26,
    step: 1,
    desc: '第 68401～68800 批：放大有效控制範圍。獎項多時也會保留明顯變化；建議 10～16。'
  },
  {
    key: 'prizeIconSize',
    label: '獎項圖示',
    unit: 'px',
    min: 16,
    max: 76,
    step: 1,
    desc: '第 68401～68800 批：圖示大小不再被密度模式過度限制；建議 24～54。'
  },
  {
    key: 'prizeLabelRadius',
    label: '獎項半徑',
    unit: '%',
    min: 36,
    max: 94,
    step: 1,
    desc: '第 68401～68800 批：半徑改成強力模式。數字小明顯靠中心，數字大明顯靠外圈；建議 62～82。'
  },
  {
    key: 'prizeLabelOffsetY',
    label: '獎項上下校正',
    unit: 'px',
    min: -24,
    max: 24,
    step: 1,
    desc: '微調獎項文字與圖示上下位置，讓它更貼近自己的格子中心。'
  },
  {
    key: 'prizeTextBoxWidth',
    label: '獎項文字寬',
    unit: 'px',
    min: 48,
    max: 112,
    step: 2,
    desc: '控制每個獎項文字的可用寬度，避免文字跨到隔壁格。'
  },
  {
    key: 'pointerHitCorrection',
    label: '指針命中校正',
    unit: '°',
    min: -10,
    max: 10,
    step: 1,
    desc: '如果實際停點看起來偏左或偏右，可微調指針命中角度。'
  }
]

const polishFineTuneSummary = computed(() => {
  const meta = currentWheelPolishMeta.value
  const presetName = String(meta?.presetName || currentWheelPolishPreset.value?.name || '尚未套用精緻預設')

  return {
    eyebrow: 'Polish Fine Tune｜第 66001～66400 批',
    title: '精緻預設微調面板',
    desc: '先套用精緻預設，再在這裡微調輪盤大小、外框、指針、中心按鈕與獎項顯示。右側預覽會即時更新，正式玩家頁仍需按「儲存設定」。',
    presetName,
    target: isPlatformTemplateMode.value
      ? `platform-template:${templateId.value}`
      : `tenant:${tenantSlug.value} / campaignId:${campaignId.value || '-'}`,
    updatedAt: meta?.fineTune?.updatedAt ? formatSaveAuditTime(meta.fineTune.updatedAt) : '尚未微調'
  }
})

const normalizeFineTuneNumber = (value, control = {}) => {
  const raw = Number(value)
  const fallback = Number(defaultSettings().wheelStyle?.[control.key] || 0)
  const parsed = Number.isFinite(raw) ? raw : fallback
  const min = Number(control.min ?? parsed)
  const max = Number(control.max ?? parsed)
  const step = Number(control.step || 1)
  const clamped = Math.min(Math.max(parsed, min), max)

  return Math.round(clamped / step) * step
}

const getWheelFineTuneValue = (key = '') => {
  const value = Number(settings?.wheelStyle?.[key])
  if (Number.isFinite(value)) return value

  return Number(defaultSettings().wheelStyle?.[key] || 0)
}

const setWheelFineTuneValue = (key = '', value = '') => {
  const control = polishFineTuneControls.find((item) => item.key === key)
  if (!control) return

  if (!settings.wheelStyle || typeof settings.wheelStyle !== 'object' || Array.isArray(settings.wheelStyle)) {
    settings.wheelStyle = {}
  }

  settings.wheelStyle[key] = normalizeFineTuneNumber(value, control)

  if (!settings.templateMeta || typeof settings.templateMeta !== 'object' || Array.isArray(settings.templateMeta)) {
    settings.templateMeta = {}
  }

  const existingVisualPolish = settings.templateMeta.visualPolish &&
    typeof settings.templateMeta.visualPolish === 'object' &&
    !Array.isArray(settings.templateMeta.visualPolish)
    ? settings.templateMeta.visualPolish
    : {}

  settings.templateMeta.visualPolish = {
    ...existingVisualPolish,
    fineTune: {
      ...(existingVisualPolish.fineTune || {}),
      batch: '66001-66400',
      updatedAt: new Date().toISOString(),
      updatedKey: key,
      updatedLabel: control.label,
      updatedValue: settings.wheelStyle[key],
      mode: isPlatformTemplateMode.value ? 'platform_template' : 'merchant_campaign',
      target: isPlatformTemplateMode.value
        ? `platform-template:${templateId.value}`
        : `tenant:${tenantSlug.value} / campaignId:${campaignId.value || '-'}`
    }
  }

  if (typeof window !== 'undefined') {
    window.clearTimeout(previewSyncTimer)
  }

  persistLocalDraft('settings-update')
  previewFocusMode.value = 'wheel'
  nextTick(scrollPreviewToFocus)

  markSettingsDirty(`已微調「${control.label}」為 ${settings.wheelStyle[key]}${control.unit || ''}，尚未儲存`)
}


const displayLabels = {
  showBrandCard: '顯示品牌卡片',
  showStatusCard: '顯示活動狀態',
  showRemainingChance: '顯示剩餘次數',
  showSerialBox: '顯示序號輸入區',
  showRules: '顯示活動規則',
  showPrizeInfo: '顯示獎品說明',
  showPrizeShelf: '顯示獎品展示',
  showHistory: '顯示抽獎紀錄',
  hidePrizesBeforeDraw: '抽中前隱藏獎品',
  enableSound: '開啟遊戲音效',
  showDebugInfo: '顯示除錯資訊'
}

const displayDescriptions = {
  showBrandCard: '玩家頁上方品牌 Logo / 活動名稱區塊。',
  showStatusCard: '顯示活動進行中、活動提示等狀態資訊。',
  showRemainingChance: '顯示目前剩餘轉盤次數。',
  showSerialBox: '讓玩家輸入商家提供的序號。',
  showRules: '顯示活動規則收合區塊。',
  showPrizeInfo: '顯示獎品說明收合區塊。',
  showPrizeShelf: '顯示獎品展示橫向區塊。',
  showHistory: '顯示我的抽獎紀錄卡片。',
  hidePrizesBeforeDraw: '抽中前先顯示神秘獎品，抽中後才揭曉。',
  enableSound: '開啟轉盤卡點聲、結果音效等效果。',
  showDebugInfo: '只建議測試時開啟，正式玩家頁請關閉。'
}

const setCategory = (key) => {
  activeCategory.value = key
}

const defaultSettings = () => ({
  pageTitle: '幸運輪盤抽獎',
  brandName: 'Multi Game Platform',
  brandSubtitle: '打造專屬互動抽獎體驗',
  brandLogoUrl: '',
  brandLinkUrl: '',
  brandLinkText: '官方品牌',
  brandLogoSize: 64,
  brandTitleSize: 20,
  brandTextColor: '#ffffff',
  brandButtonBgColor: '#ffffff',
  brandButtonTextColor: '#c2410c',
  brandButtonTextSize: 12,
  headline: '幸運輪盤抽獎',
  subtitle: '轉出你的專屬驚喜',
  badgeText: '輸入序號後即可轉盤抽獎',
  serialTitle: '輸入序號開始轉盤',
  serialHint: '請輸入商家提供的序號，驗證成功後即可使用轉盤機會。',
  playButtonText: '開始轉盤',
  verifyButtonText: '驗證序號',
  resultTitle: '恭喜中獎',
  theme: {
    backgroundFrom: '#fff8e7',
    backgroundTo: '#b45309',
    panelColor: '#fff7ed',
    wheelOuterColor: '#f6c453',
    pointerColor: '#dc2626',
    spinButtonColor: '#14532d',
    actionButtonFrom: '#f59e0b',
    actionButtonTo: '#b45309'
  },
  display: {
    showBrandCard: true,
    showStatusCard: true,
    showRemainingChance: true,
    showSerialBox: true,
    showRules: true,
    showPrizeInfo: true,
    showPrizeShelf: false,
    showHistory: true,
    hidePrizesBeforeDraw: false,
    enableSound: true,
    showDebugInfo: false
  },
  wheelStyle: {
    wheelSize: 372,
    outerRingWidth: 18,
    showRimLights: true,
    rimLightCount: 30,
    rimLightSize: 9,
    wheelDepthLevel: 78,
      stageGlowLevel: 72,
      stageShadowLevel: 70,
      stageCornerLevel: 76,
      stageInnerLightLevel: 64,
    centerButtonSize: 98,
    centerButtonText: 'SPIN',
    centerButtonTextSize: 18,
    centerButtonTextColor: '#ffffff',
    centerButtonBorderColor: '#fde68a',
    pointerSize: 52,
    pointerOffsetY: -10,
    pointerGlossLevel: 72,
    pointerShadowLevel: 68,
    pointerTopColor: '#dc2626',
    pointerArrowColor: '#b91c1c',
    pointerDotColor: '#fde047',
    prizeTextSize: 14,
    prizeIconSize: 40,
    cellGap: 2,
    prizeLabelRadius: 76,
    prizeTextColor: '#ffffff',
    prizeTextStrokeColor: '#1f2937',
    prizeBadgeBgOpacity: 16,
    sliceGlossLevel: 48,
    // 第 68001～68400 批：獎項密度自適應與半徑控制修正版
// 第 67601～68000 批：獎項標籤置中與指針命中校正。
    prizeLabelOffsetX: 0,
    prizeLabelOffsetY: 0,
    prizeTextBoxWidth: 92,
    pointerHitCorrection: 0,
    showPrizeIcon: true,
    showPrizeName: true,
    showSliceBorder: true
  },
  effects: {
    enableTickSound: true,
    enableResultSound: true,
    enablePointerShake: true,
    enableLightGlow: true,
    enableConfetti: true,
    enableSpinMask: true
  },
  content: {
    rulesTitle: '活動規則',
    rulesText: '請輸入商家提供的序號，驗證成功後即可開始轉盤。中獎後請依主辦單位公告方式兌換。',
    prizeInfoTitle: '獎品說明',
    prizeInfoText: '獎項、兌換方式與使用期限，以主辦單位現場或官方公告為準。',
    footerNote: '請依照活動規則參加抽獎；獎項與兌換方式以主辦單位公告為準。'
  },
  prizes: [
    { id: 1, icon: '🎁', imageUrl: '', linkUrl: '', name: '50 元折價券', weight: 35, color: '#fef3c7' },
    { id: 2, icon: '🎫', imageUrl: '', linkUrl: '', name: '100 元折價券', weight: 25, color: '#16a34a' },
    { id: 3, icon: '🏆', imageUrl: '', linkUrl: '', name: '200 元折價券', weight: 15, color: '#fde68a' },
    { id: 4, icon: '😊', imageUrl: '', linkUrl: '', name: '再接再厲', weight: 25, color: '#15803d' }
  ]
})

const settings = reactive(defaultSettings())

const previewPrizes = computed(() => {
  const list = Array.isArray(settings.prizes) ? settings.prizes : []
  return list.filter((item) => item && String(item.name || '').trim()).slice(0, 8)
})

const conicGradient = computed(() => {
  const list = previewPrizes.value.length ? previewPrizes.value : defaultSettings().prizes
  const step = 100 / list.length
  let current = 0

  const parts = list.map((item, index) => {
    const start = current
    const end = index === list.length - 1 ? 100 : current + step
    current = end
    return `${item.color || '#f59e0b'} ${start}% ${end}%`
  })

  return `conic-gradient(${parts.join(', ')})`
})

const wheelSegments = computed(() => {
  const list = previewPrizes.value.length ? previewPrizes.value : defaultSettings().prizes
  const total = list.length || 1

  return list.map((item, index) => {
    const mid = (index + 0.5) * (360 / total) - 90
    const radius = Number(settings.wheelStyle.prizeLabelRadius || 34)
    const x = 50 + Math.cos((mid * Math.PI) / 180) * radius
    const y = 50 + Math.sin((mid * Math.PI) / 180) * radius

    return {
      ...item,
      labelX: x,
      labelY: y,
      rotate: mid + 90
    }
  })
})

const getPrizeImageSrc = (prize = {}) => String(prize.imageUrl || '').trim()

const getPrizeDisplayIcon = (prize = {}) => {
  if (settings.display.hidePrizesBeforeDraw) return '🎁'
  return prize.icon || '🎁'
}

const getPrizeDisplayName = (prize = {}) => {
  if (settings.display.hidePrizesBeforeDraw) return '神秘獎品'
  return prize.name || '獎項'
}

const previewRemainingText = computed(() => {
  return settings.display.showRemainingChance ? '剩餘次數 99｜可轉盤' : ''
})

const normalizePrizePercent = (value = 0) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return 0
  return Math.max(0, Math.min(100, Math.round(number)))
}

const prizePercentTotal = computed(() => {
  return (Array.isArray(settings.prizes) ? settings.prizes : []).reduce((sum, prize) => {
    return sum + normalizePrizePercent(prize?.weight)
  }, 0)
})

const prizePercentSummary = computed(() => {
  const total = prizePercentTotal.value
  const diff = Math.abs(total - 100)
  const isPerfect = diff === 0
  const isOver = total > 100
  const isZero = total <= 0

  return {
    total,
    diff,
    isPerfect,
    isOver,
    isZero,
    normalizedNote: total > 0
      ? '抽獎時會依照各獎項百分比占總和的比例抽選；總和等於 100% 時最直覺。'
      : '目前總和為 0%，沒有可抽選的百分比分配，請先設定獎項百分比。',
    badge: isPerfect ? '100% 正常' : (isOver ? `超過 ${total - 100}%` : `尚餘 ${100 - total}%`),
    message: isPerfect
      ? '目前獎項百分比總和剛好 100%，玩家抽選比例最直覺。'
      : (isOver
          ? '目前總和超過 100%，系統仍可依比例抽選，但商家看到會誤會成超過 100%，建議修正。'
          : '目前總和低於 100%，系統仍可依比例抽選，但建議補滿到 100% 才方便營運驗收。'),
    saveHint: isPerfect
      ? '可直接儲存。'
      : '儲存前會再提醒一次；建議先用「平均分配 100%」或手動修正總和。',
    toneClass: isPerfect
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : (isOver ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-amber-200 bg-amber-50 text-amber-800'),
    badgeClass: isPerfect
      ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200'
      : (isOver ? 'bg-rose-100 text-rose-800 ring-1 ring-rose-200' : 'bg-amber-100 text-amber-800 ring-1 ring-amber-200')
  }
})

const prizePercentExpectedRows = computed(() => {
  const total = prizePercentTotal.value
  const list = Array.isArray(settings.prizes) ? settings.prizes : []

  return list.map((prize, index) => {
    const percent = normalizePrizePercent(prize?.weight)
    const expectedRate = total > 0 ? Number(((percent / total) * 100).toFixed(2)) : 0

    return {
      id: prize?.id || `prize-percent-${index + 1}`,
      index,
      name: prize?.name || `獎項 ${index + 1}`,
      color: prize?.color || '#f59e0b',
      percent,
      expectedRate
    }
  })
})

const prizePercentVisibleRows = computed(() => {
  return prizePercentSimulatorExpanded.value
    ? prizePercentExpectedRows.value
    : prizePercentExpectedRows.value.slice(0, 5)
})

const prizePercentHiddenRowsCount = computed(() => {
  return Math.max(0, prizePercentExpectedRows.value.length - prizePercentVisibleRows.value.length)
})


const prizePercentSaveGuard = computed(() => ({
  title: prizePercentSummary.value.isPerfect ? '百分比驗證通過' : '百分比總和需要確認',
  ok: prizePercentSummary.value.isPerfect,
  badge: prizePercentSummary.value.badge,
  message: prizePercentSummary.value.isPerfect
    ? '目前總和為 100%，前端抽選與營運理解一致。'
    : `目前總和為 ${prizePercentSummary.value.total}%。前端仍會依比例抽選，但建議正式活動調整為 100%。`,
  detail: '本批只做前端設定驗證與防呆，不修改 DB / router / draw-core；正式後端 play API 是否完全吃同欄位，仍需後端抽獎核心驗證。'
}))

const updatePrizePercent = (prize, value) => {
  if (!prize) return
  prize.weight = normalizePrizePercent(value)
  prizePercentSimulationResults.value = []
  prizePercentSimulationAt.value = ''
  if (typeof markSettingsDirty === 'function') {
    markSettingsDirty('已調整獎項中獎百分比，尚未儲存')
  }
}

const averagePrizePercent = () => {
  if (!Array.isArray(settings.prizes) || !settings.prizes.length) return

  const base = Math.floor(100 / settings.prizes.length)
  const remainder = 100 - base * settings.prizes.length

  settings.prizes.forEach((prize, index) => {
    prize.weight = base + (index < remainder ? 1 : 0)
  })

  savedMessage.value = '已平均分配獎項中獎百分比，總和為 100%。請按儲存設定保存。'
  setTimeout(() => {
    savedMessage.value = ''
  }, 1800)
}

const clearPrizePercent = () => {
  if (!Array.isArray(settings.prizes)) return
  const confirmed = window.confirm('確定要把所有獎項中獎百分比清為 0% 嗎？')
  if (!confirmed) return

  settings.prizes.forEach((prize) => {
    prize.weight = 0
  })

  prizePercentSimulationResults.value = []
  prizePercentSimulationAt.value = ''
  savedMessage.value = '已將所有獎項中獎百分比清為 0%。請重新分配後再儲存。'
  setTimeout(() => {
    savedMessage.value = ''
  }, 1800)
}

const normalizeSimulationDraws = (value = 1000) => {
  const number = Math.round(Number(value))
  if (!Number.isFinite(number)) return 1000
  return Math.max(100, Math.min(10000, number))
}

const runPrizePercentSimulation = () => {
  const rows = prizePercentExpectedRows.value.filter((item) => item.percent > 0)
  const total = rows.reduce((sum, item) => sum + item.percent, 0)
  const draws = normalizeSimulationDraws(prizePercentSimulationDraws.value)
  prizePercentSimulationDraws.value = draws

  if (!rows.length || total <= 0) {
    prizePercentSimulationResults.value = []
    savedMessage.value = '目前沒有可試算的獎項百分比，請先設定至少一個大於 0% 的獎項。'
    window.setTimeout(() => {
      savedMessage.value = ''
    }, 2200)
    return
  }

  const results = rows.map((item) => ({
    ...item,
    hits: 0,
    actualRate: 0
  }))

  for (let i = 0; i < draws; i += 1) {
    const target = Math.random() * total
    let current = 0

    for (const item of results) {
      current += item.percent
      if (target <= current) {
        item.hits += 1
        break
      }
    }
  }

  prizePercentSimulationResults.value = results.map((item) => ({
    ...item,
    actualRate: Number(((item.hits / draws) * 100).toFixed(2))
  }))
  prizePercentSimulationAt.value = new Date().toLocaleTimeString('zh-TW', { hour12: false })
  savedMessage.value = `已完成 ${draws.toLocaleString('zh-TW')} 次百分比模擬試算。`
  window.setTimeout(() => {
    savedMessage.value = ''
  }, 1800)
}

const normalizePrizePercentTo100 = () => {
  const rows = Array.isArray(settings.prizes) ? settings.prizes : []
  const total = prizePercentTotal.value

  if (!rows.length) return

  if (total <= 0) {
    averagePrizePercent()
    return
  }

  const normalized = rows.map((prize, index) => {
    const raw = normalizePrizePercent(prize?.weight)
    const exact = (raw / total) * 100
    const floor = Math.floor(exact)

    return {
      index,
      exact,
      floor,
      remainder: exact - floor
    }
  })

  let currentTotal = normalized.reduce((sum, item) => sum + item.floor, 0)
  const sorted = [...normalized].sort((a, b) => b.remainder - a.remainder)

  for (const item of sorted) {
    if (currentTotal >= 100) break
    item.floor += 1
    currentTotal += 1
  }

  normalized.forEach((item) => {
    const source = sorted.find((candidate) => candidate.index === item.index) || item
    rows[item.index].weight = source.floor
  })

  prizePercentSimulationResults.value = []
  prizePercentSimulationAt.value = ''
  savedMessage.value = '已依照原本比例重新校正為總和 100%。請確認後按儲存設定。'
  window.setTimeout(() => {
    savedMessage.value = ''
  }, 2200)
}

const templateMeta = computed(() => {
  const meta = settings?.templateMeta

  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
    return {}
  }

  return meta
})

const templateCloneStatus = computed(() => {
  if (isPlatformTemplateMode.value) {
    return {
      title: '平台輪盤模板',
      badge: '模板來源',
      tone: 'platform',
      sourceLabel: '平台總管理員 / 遊戲模板中心',
      copyLabel: '這是模板本體，不是商家活動副本',
      syncLabel: '不會直接改動 A / B 商家的既有活動',
      batchLabel: '第 55201～55600 批顯示保護',
      safe: true
    }
  }

  const meta = templateMeta.value
  const source = String(meta.source || '').trim()
  const cloneBatch = String(meta.cloneBatch || '').trim()
  const version = String(meta.version || '').trim()
  const isMerchantOwnedCopy = meta.isMerchantOwnedCopy === true
  const lockTemplateSync = meta.lockTemplateSync === true
  const allowAutoSyncFromPlatformTemplate = meta.allowAutoSyncFromPlatformTemplate === true
  const clonedFromPlatformWheelTemplate = source === 'PLATFORM_WHEEL_TEMPLATE' || String(meta.sourceType || '') === 'platform_template'
  const safe = clonedFromPlatformWheelTemplate && isMerchantOwnedCopy && lockTemplateSync && !allowAutoSyncFromPlatformTemplate

  return {
    title: safe ? '平台模板複製狀態正常' : '尚未確認平台模板複製狀態',
    badge: safe ? '安全副本' : '待檢查',
    tone: safe ? 'safe' : 'warning',
    sourceLabel: clonedFromPlatformWheelTemplate ? '平台輪盤模板' : '沒有找到平台模板來源標記',
    copyLabel: isMerchantOwnedCopy ? '商家活動獨立副本' : '尚未標記為商家副本',
    syncLabel: lockTemplateSync && !allowAutoSyncFromPlatformTemplate
      ? '已鎖定，不允許平台模板自動覆蓋'
      : '同步保護未完整，請檢查 templateMeta',
    batchLabel: cloneBatch || version || '沒有批次標記',
    safe
  }
})

const templateCloneStatusItems = computed(() => {
  const status = templateCloneStatus.value

  return [
    { label: '模板來源', value: status.sourceLabel },
    { label: '副本狀態', value: status.copyLabel },
    { label: '同步保護', value: status.syncLabel },
    { label: '批次標記', value: status.batchLabel }
  ]
})

const editScopeGuard = computed(() => {
  if (isPlatformTemplateMode.value) {
    return {
      eyebrow: 'Scope Guard｜第 55601～56000 批',
      title: '目前正在修改：平台輪盤模板',
      badge: '平台模板模式',
      badgeClass: 'bg-orange-100 text-orange-800 ring-1 ring-orange-200',
      description: '這裡只會保存平台模板草稿，用來當新輪盤活動建立時的預設來源；不會直接覆蓋 A / B 商家的既有活動。',
      primaryLabel: '儲存目標',
      primaryValue: platformWheelTemplateSlug.value,
      secondaryLabel: '玩家頁資料來源',
      secondaryValue: '玩家頁不直接讀平台模板；玩家頁只讀商家活動資料庫設定。',
      warning: '如果你要修改某一個商家的正式活動畫面，請回到該商家的活動設定頁，不要在模板模式直接修改。',
      safe: true
    }
  }

  const cloneStatus = templateCloneStatus.value

  return {
    eyebrow: 'Scope Guard｜第 55601～56000 批',
    title: '目前正在修改：商家單一輪盤活動',
    badge: cloneStatus.safe ? '商家安全副本' : '商家活動模式',
    badgeClass: cloneStatus.safe
      ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200'
      : 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
    description: '這裡只會儲存目前這個商家活動的 gameConfig.settings；不會回寫平台輪盤模板，也不會同步污染其他商家活動。',
    primaryLabel: '儲存目標',
    primaryValue: `tenant:${tenantSlug.value} / campaignId:${campaignId.value || '-'}`,
    secondaryLabel: '玩家頁資料來源',
    secondaryValue: remoteConfigLoaded.value ? '已連接資料庫設定，玩家頁重新整理後會讀取此活動設定。' : '尚未確認資料庫設定載入狀態，請確認 campaignId 與登入權限。',
    warning: cloneStatus.safe
      ? '此活動已標記為平台模板建立時複製的商家獨立副本。後續平台模板變更不會自動覆蓋它。'
      : '這個活動可能是舊流程建立，或尚未帶有完整 templateMeta；可以繼續編輯，但請不要把它當成平台模板本體。',
    safe: cloneStatus.safe
  }
})

const editScopeChecklist = computed(() => {
  if (isPlatformTemplateMode.value) {
    return [
      { label: '平台模板', value: '可修改', tone: 'orange' },
      { label: '商家既有活動', value: '不會被改動', tone: 'emerald' },
      { label: '玩家頁', value: '不直接讀模板', tone: 'slate' },
      { label: '新活動', value: '建立時才複製', tone: 'blue' }
    ]
  }

  return [
    { label: '目前活動', value: campaignId.value || '未指定', tone: 'blue' },
    { label: '目前商家', value: tenantSlug.value || '未指定', tone: 'slate' },
    { label: '平台模板', value: '不會被回寫', tone: 'emerald' },
    { label: '其他商家', value: '不會被改動', tone: 'emerald' }
  ]
})

const saveScopeGuard = computed(() => {
  if (isPlatformTemplateMode.value) {
    return {
      eyebrow: 'Save Guard｜第 56401～56800 批',
      title: '儲存前確認：這次只會保存平台輪盤模板',
      badge: '模板草稿儲存',
      badgeClass: 'bg-orange-100 text-orange-800 ring-1 ring-orange-200',
      targetLabel: '儲存目標',
      targetValue: platformWheelTemplateSlug.value,
      effectLabel: '影響範圍',
      effectValue: '只更新平台模板資料庫來源，不會直接修改任何既有商家活動；新建輪盤活動才會複製一次。',
      confirmLabel: '按下儲存時會跳出確認視窗，避免誤把商家活動與平台模板搞混。',
      warning: '如果你想改 A 商家或 B 商家的正式玩家畫面，請回到該商家的活動設定頁。'
    }
  }

  return {
    eyebrow: 'Save Guard｜第 56401～56800 批',
    title: '儲存前確認：這次只會寫入目前商家活動',
    badge: '商家活動儲存',
    badgeClass: templateCloneStatus.value.safe
      ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200'
      : 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
    targetLabel: '儲存目標',
    targetValue: `tenant:${tenantSlug.value} / campaignId:${campaignId.value || '-'}`,
    effectLabel: '影響範圍',
    effectValue: '只更新目前這個商家活動的 gameConfig.settings，不會回寫平台模板，也不會影響其他商家。',
    confirmLabel: '按下儲存時會跳出確認視窗，確認後才正式寫入資料庫。',
    warning: templateCloneStatus.value.safe
      ? '此活動是平台模板建立時複製出的安全商家副本，可以放心單獨調整。'
      : '此活動尚未確認完整 templateMeta，仍可儲存，但建議先確認目前 campaignId 與 tenantSlug 是否正確。'
  }
})


const formatSaveAuditTime = (value = '') => {
  if (!value) return '尚未儲存'

  try {
    return new Date(value).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  } catch (error) {
    return String(value)
  }
}


const serializeSettingsForDirtyCheck = () => {
  try {
    return JSON.stringify(settings)
  } catch (error) {
    return `${Date.now()}`
  }
}

const markSettingsSaved = (message = '已儲存目前設定') => {
  settingsSnapshotAfterSave.value = serializeSettingsForDirtyCheck()
  hasUnsavedChanges.value = false
  lastSavedAt.value = new Date().toISOString()
  unsavedChangeReason.value = message
}

const markSettingsDirty = (reason = '設定已修改，尚未正式儲存') => {
  if (isSettingsHydrating.value) return

  const currentSnapshot = serializeSettingsForDirtyCheck()

  if (!settingsSnapshotAfterSave.value) {
    settingsSnapshotAfterSave.value = currentSnapshot
    return
  }

  if (currentSnapshot === settingsSnapshotAfterSave.value) {
    hasUnsavedChanges.value = false
    return
  }

  hasUnsavedChanges.value = true
  lastChangedAt.value = new Date().toISOString()
  unsavedChangeReason.value = reason
}

const unsavedChangesGuard = computed(() => {
  const dirty = hasUnsavedChanges.value
  const platformMode = isPlatformTemplateMode.value
  const target = platformMode
    ? `platform-template:${templateId.value}`
    : `tenant:${tenantSlug.value} / campaignId:${campaignId.value || '-'}`

  return {
    eyebrow: 'Unsaved Changes Guard｜第 64401～64800 批',
    title: dirty ? '目前有尚未儲存的修改' : '目前設定已完成儲存檢查',
    badge: dirty ? '尚未儲存' : '已儲存 / 未修改',
    badgeClass: dirty
      ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
      : 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200',
    toneClass: dirty
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : 'border-emerald-200 bg-emerald-50 text-emerald-900',
    target,
    modeLabel: platformMode ? '平台輪盤模板' : '商家單一輪盤活動',
    changedAtLabel: lastChangedAt.value ? formatSaveAuditTime(lastChangedAt.value) : '尚未修改',
    savedAtLabel: lastSavedAt.value ? formatSaveAuditTime(lastSavedAt.value) : '尚未完成本次儲存',
    reason: dirty
      ? unsavedChangeReason.value
      : '目前右側預覽與左側設定沒有偵測到新的未儲存差異。',
    nextAction: dirty
      ? '右側預覽可能已更新，但正式玩家頁必須按「儲存設定」後才會同步。'
      : '可以繼續修改設定；下一次變更後，這裡會提示尚未儲存。'
  }
})

const unsavedChangesItems = computed(() => [
  { label: '目前模式', value: unsavedChangesGuard.value.modeLabel },
  { label: '儲存目標', value: unsavedChangesGuard.value.target },
  { label: '最近修改', value: unsavedChangesGuard.value.changedAtLabel },
  { label: '最近儲存', value: unsavedChangesGuard.value.savedAtLabel }
])

const handleBeforeUnload = (event) => {
  if (!hasUnsavedChanges.value) return

  event.preventDefault()
  event.returnValue = '目前輪盤設定有尚未儲存的修改，離開頁面後正式玩家頁不會同步這些變更。'
}

const buildSaveAuditRecord = (status = 'success', extra = {}) => {
  const platformMode = isPlatformTemplateMode.value

  return {
    status,
    batch: '57601-58000',
    savedAt: new Date().toISOString(),
    mode: platformMode ? 'platform_template' : 'merchant_campaign',
    title: platformMode ? '平台輪盤模板儲存驗收' : '商家輪盤活動儲存驗收',
    target: platformMode
      ? platformWheelTemplateSlug.value
      : `tenant:${tenantSlug.value} / campaignId:${campaignId.value || '-'}`,
    effect: platformMode
      ? '只更新平台模板資料庫來源，不會修改任何既有商家活動；新建輪盤活動會複製一次。'
      : '只更新目前商家活動 gameConfig.settings，不會回寫平台模板或影響其他商家。',
    playerSource: platformMode
      ? '玩家頁不直接讀平台模板。新輪盤活動建立時會複製最新已儲存的平台模板。'
      : '玩家頁讀取目前商家活動資料庫設定，手機重新整理後才會看到更新。',
    templateGuard: platformMode
      ? '平台模板本體'
      : (templateCloneStatus.value.safe ? '安全商家副本，已鎖定不自動同步平台模板' : '尚未確認完整 templateMeta，建議檢查活動來源'),
    ...extra
  }
}

const normalizeSaveAuditHistoryItem = (record = {}) => ({
  id: `${record.savedAt || new Date().toISOString()}-${Math.random().toString(36).slice(2, 8)}`,
  status: record.status || 'unknown',
  batch: record.batch || '57601-58000',
  savedAt: record.savedAt || new Date().toISOString(),
  mode: record.mode || (isPlatformTemplateMode.value ? 'platform_template' : 'merchant_campaign'),
  title: record.title || '儲存驗收紀錄',
  target: record.target || (isPlatformTemplateMode.value
    ? platformWheelTemplateSlug.value
    : `tenant:${tenantSlug.value} / campaignId:${campaignId.value || '-'}`),
  effect: record.effect || '尚未提供影響範圍',
  templateGuard: record.templateGuard || '尚未提供隔離保護說明',
  message: record.message || ''
})

const persistSaveAuditHistory = () => {
  if (typeof localStorage === 'undefined') return

  try {
    localStorage.setItem(saveAuditHistoryKey.value, JSON.stringify(saveAuditHistory.value.slice(0, 8)))
  } catch (error) {
    console.warn('儲存輪盤設定驗收歷史失敗：', error)
  }
}

const loadSaveAuditHistory = () => {
  if (typeof localStorage === 'undefined') return

  try {
    const raw = localStorage.getItem(saveAuditHistoryKey.value)
    if (!raw) {
      saveAuditHistory.value = []
      return
    }

    const parsed = JSON.parse(raw)
    saveAuditHistory.value = Array.isArray(parsed)
      ? parsed.slice(0, 8).map((item) => normalizeSaveAuditHistoryItem(item))
      : []
  } catch (error) {
    console.warn('讀取輪盤設定驗收歷史失敗：', error)
    saveAuditHistory.value = []
  }
}

const pushSaveAuditHistory = (record = null) => {
  if (!record) return

  const normalized = normalizeSaveAuditHistoryItem({
    ...record,
    batch: record.batch || '57601-58000'
  })

  const nextHistory = [
    normalized,
    ...saveAuditHistory.value.filter((item) => item.savedAt !== normalized.savedAt)
  ].slice(0, 8)

  saveAuditHistory.value = nextHistory
  persistSaveAuditHistory()
}

const clearSaveAuditHistory = () => {
  saveAuditHistory.value = []

  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(saveAuditHistoryKey.value)
  }

  copiedMessage.value = '已清除目前頁面的儲存驗收歷史紀錄。'
  window.setTimeout(() => {
    copiedMessage.value = ''
  }, 2200)
}

const exportSaveAuditHistory = () => {
  const exportedAt = new Date().toISOString()
  const mode = isPlatformTemplateMode.value ? 'platform_template' : 'merchant_campaign'
  const target = isPlatformTemplateMode.value
    ? platformWheelTemplateSlug.value
    : `tenant:${tenantSlug.value} / campaignId:${campaignId.value || '-'}`

  const payload = {
    product: 'Multi Game Platform V2.3',
    batch: '57601-58000',
    page: 'AdminWheelSettingsView',
    mode,
    target,
    tenantSlug: tenantSlug.value,
    campaignId: campaignId.value || null,
    templateId: templateId.value,
    storageKey: saveAuditHistoryKey.value,
    exportedAt,
    isolationGuard: isPlatformTemplateMode.value
      ? '平台模板匯出只包含本機驗收歷史，不會修改任何商家既有活動。'
      : '商家活動匯出只包含目前活動本機驗收歷史，不會回寫平台模板或其他商家。',
    total: saveAuditHistory.value.length,
    records: saveAuditHistory.value.map((item) => ({
      status: item.status,
      batch: item.batch,
      savedAt: item.savedAt,
      mode: item.mode,
      title: item.title,
      target: item.target,
      effect: item.effect,
      templateGuard: item.templateGuard,
      message: item.message || ''
    }))
  }

  const fileSafeTarget = String(target)
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'wheel-save-audit'
  const fileName = `wheel-save-audit-history-${fileSafeTarget}-${exportedAt.slice(0, 10)}.json`
  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)

  copiedMessage.value = saveAuditHistory.value.length
    ? `已匯出 ${saveAuditHistory.value.length} 筆儲存驗收歷史 JSON。`
    : '目前沒有歷史紀錄，已匯出空白驗收 JSON。'
  window.setTimeout(() => {
    copiedMessage.value = ''
  }, 2600)
}

const saveAuditHistorySummary = computed(() => {
  const total = saveAuditHistory.value.length
  const latest = saveAuditHistory.value[0]

  return {
    eyebrow: 'Save Audit History｜第 57601～58000 批',
    title: isPlatformTemplateMode.value ? '平台模板儲存歷史' : '商家活動儲存歷史',
    badge: total ? `最近 ${total} 筆` : '尚無紀錄',
    badgeClass: total
      ? 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200'
      : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
    desc: isPlatformTemplateMode.value
      ? '此區只記錄目前平台輪盤模板頁面的儲存、取消與失敗驗收結果，可清除或匯出 JSON，不會寫入商家活動資料庫。'
      : '此區只記錄目前商家輪盤活動頁面的儲存、取消與失敗驗收結果，可清除或匯出 JSON，方便確認沒有改錯模板或其他商家。',
    latestLabel: latest ? `${formatSaveAuditTime(latest.savedAt)}｜${latest.title}` : '尚未產生本頁驗收紀錄'
  }
})

const saveAuditHistoryItems = computed(() => saveAuditHistory.value.map((item) => ({
  ...item,
  savedAtLabel: formatSaveAuditTime(item.savedAt),
  statusLabel: item.status === 'success' ? '成功' : (item.status === 'cancelled' ? '取消' : (item.status === 'failed' ? '失敗' : item.status)),
  statusClass: item.status === 'success'
    ? 'bg-emerald-100 text-emerald-800'
    : (item.status === 'cancelled' ? 'bg-slate-100 text-slate-700' : 'bg-rose-100 text-rose-800')
})))

const saveResultAudit = computed(() => {
  const record = saveAuditRecord.value

  if (!record) {
    return {
      eyebrow: 'Save Result Audit｜第 56801～57200 批',
      title: '尚未執行本次儲存',
      badge: '等待儲存',
      badgeClass: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
      statusText: '目前尚未有本次儲存結果。按下儲存並確認後，這裡會顯示儲存目標、影響範圍與隔離狀態。',
      target: isPlatformTemplateMode.value
        ? platformWheelTemplateSlug.value
        : `tenant:${tenantSlug.value} / campaignId:${campaignId.value || '-'}`,
      effect: isPlatformTemplateMode.value
        ? '預計只保存平台模板草稿，不會動到商家既有活動。'
        : '預計只更新目前商家活動設定，不會回寫平台模板。',
      playerSource: isPlatformTemplateMode.value
        ? '玩家頁不直接讀平台模板。'
        : '玩家頁會讀目前活動的資料庫設定。',
      templateGuard: isPlatformTemplateMode.value
        ? '平台模板本體'
        : templateCloneStatus.value.syncLabel,
      savedAtLabel: '尚未儲存',
      batch: '56801-57200',
      safe: true
    }
  }

  const isSuccess = record.status === 'success'
  const isCancelled = record.status === 'cancelled'

  return {
    eyebrow: 'Save Result Audit｜第 56801～57200 批',
    title: record.title || '儲存結果驗收',
    badge: isSuccess ? '儲存成功' : (isCancelled ? '已取消儲存' : '儲存失敗'),
    badgeClass: isSuccess
      ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200'
      : (isCancelled ? 'bg-slate-100 text-slate-700 ring-1 ring-slate-200' : 'bg-rose-100 text-rose-800 ring-1 ring-rose-200'),
    statusText: record.message || (isSuccess ? '本次儲存已完成，並已通過儲存範圍檢查。' : '本次儲存沒有完成。'),
    target: record.target,
    effect: record.effect,
    playerSource: record.playerSource,
    templateGuard: record.templateGuard,
    savedAtLabel: formatSaveAuditTime(record.savedAt),
    batch: record.batch || '57601-58000',
    safe: isSuccess || isCancelled
  }
})

const saveResultAuditItems = computed(() => [
  { label: '儲存目標', value: saveResultAudit.value.target },
  { label: '影響範圍', value: saveResultAudit.value.effect },
  { label: '玩家頁來源', value: saveResultAudit.value.playerSource },
  { label: '隔離保護', value: saveResultAudit.value.templateGuard },
  { label: '驗收批次', value: saveResultAudit.value.batch || '57601-58000' },
  { label: '儲存時間', value: saveResultAudit.value.savedAtLabel }
])


const onlineSaveSyncCheck = computed(() => {
  const env = apiEnvironmentGuard.value
  const record = saveAuditRecord.value
  const hasSaved = Boolean(record)
  const isSuccess = record?.status === 'success'
  const isFailed = record?.status === 'failed'
  const isCancelled = record?.status === 'cancelled'
  const apiValue = env.apiValue || API_BASE_URL
  const frontendValue = env.frontendValue || frontOrigin.value
  const officialPlayerUrl = isPlatformTemplateMode.value ? '平台模板不直接提供正式玩家頁' : playerUrl.value
  const officialCanSync = Boolean(isSuccess && env.safe && !isPlatformTemplateMode.value)
  const platformTemplateSavedOnline = Boolean(isSuccess && env.safe && isPlatformTemplateMode.value)
  const localOnly = /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(String(apiValue || ''))

  let title = '尚未完成正式同步檢查'
  let badge = '等待儲存'
  let badgeClass = 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
  let toneClass = 'border-slate-200 bg-slate-50 text-slate-700'
  let statusText = '按下「儲存設定」後，這裡會告訴你這次是寫入本機資料庫，還是 Render 線上正式資料庫。'
  let nextAction = isPlatformTemplateMode.value
    ? '若要讓新商家活動吃到模板，請在線上後台儲存平台模板後，再建立新的 WHEEL 活動。'
    : '若要讓客人正式玩家頁同步，請確認目前 API 是 Render，並在儲存成功後重新整理正式玩家頁。'

  if (hasSaved && isCancelled) {
    title = '本次已取消儲存'
    badge = '未寫入'
    statusText = '你取消了儲存，本次沒有寫入本機或線上資料庫。'
    nextAction = '重新調整設定後，再按「儲存設定」。'
  } else if (hasSaved && isFailed) {
    title = '本次儲存失敗'
    badge = '失敗'
    badgeClass = 'bg-rose-100 text-rose-800 ring-1 ring-rose-200'
    toneClass = 'border-rose-200 bg-rose-50 text-rose-800'
    statusText = record?.message || '本次沒有成功寫入資料庫，正式玩家頁不會同步。'
    nextAction = '請確認登入權限、campaignId、tenantSlug 與後端 API 狀態後再儲存。'
  } else if (isSuccess && localOnly) {
    title = '已儲存到本機測試資料庫'
    badge = '本機儲存'
    badgeClass = 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
    toneClass = 'border-amber-200 bg-amber-50 text-amber-800'
    statusText = '這次儲存寫入 localhost 本機資料庫；Vercel 正式玩家頁不會讀到這筆本機修改。'
    nextAction = '要同步正式玩家頁，請到 Vercel 線上後台操作，或確認本機 VITE_API_BASE_URL 指向 Render API。'
  } else if (officialCanSync) {
    title = '已儲存到線上正式資料庫'
    badge = '正式玩家頁會同步'
    badgeClass = 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200'
    toneClass = 'border-emerald-200 bg-emerald-50 text-emerald-800'
    statusText = '這次儲存寫入 Render 線上資料庫；客人重新整理正式玩家頁後應該會看到最新設定。'
    nextAction = '請點「開啟正式玩家頁」或複製玩家網址，用無痕視窗重新整理確認。'
  } else if (platformTemplateSavedOnline) {
    title = '平台模板已儲存到線上資料庫'
    badge = '新活動會套用'
    badgeClass = 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200'
    toneClass = 'border-emerald-200 bg-emerald-50 text-emerald-800'
    statusText = '平台輪盤模板已保存到線上資料庫；它不會改既有活動，但新建立的輪盤活動會複製這份模板。'
    nextAction = '請建立新的 WHEEL 活動，再進入該活動確認是否套用最新模板。'
  } else if (isSuccess) {
    title = '已儲存，但正式同步狀態需確認'
    badge = '需確認 API'
    badgeClass = 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
    toneClass = 'border-amber-200 bg-amber-50 text-amber-800'
    statusText = '本次有儲存紀錄，但目前前端 / API / 商家網址狀態不是完整線上同步組合。'
    nextAction = '請檢查 API Environment Guard，確認 API 是否為 Render，且登入商家與網址 tenantSlug 是否一致。'
  }

  return {
    eyebrow: 'Online Save Sync Check｜第 61201～61600 批',
    title,
    badge,
    badgeClass,
    toneClass,
    statusText,
    nextAction,
    apiValue,
    frontendValue,
    officialPlayerUrl,
    savedAtLabel: record?.savedAt ? formatSaveAuditTime(record.savedAt) : '尚未儲存',
    officialCanSync,
    safe: officialCanSync || platformTemplateSavedOnline,
    showPlayerButton: Boolean(!isPlatformTemplateMode.value && playerUrl.value)
  }
})

const onlineSaveSyncItems = computed(() => [
  { label: '本次寫入 API', value: onlineSaveSyncCheck.value.apiValue },
  { label: '目前前端來源', value: onlineSaveSyncCheck.value.frontendValue },
  { label: '正式玩家頁', value: onlineSaveSyncCheck.value.officialPlayerUrl },
  { label: '儲存時間', value: onlineSaveSyncCheck.value.savedAtLabel }
])


// 第 67201～67600 批：右側預覽狀態收斂與正式儲存導引。
// 把「預覽只是草稿 / 是否已儲存 / 目前 API 是否會同步正式玩家頁」集中在右側預覽區，避免商家誤以為右側即時預覽已等於正式玩家頁更新。
const previewSaveGuidance = computed(() => {
  const env = apiEnvironmentGuard.value
  const save = onlineSaveSyncCheck.value
  const dirty = hasUnsavedChanges.value
  const isOfficialOnline = env.safe === true
  const isLocalApi = isLocalOrigin(env.apiValue)
  const previewReady = previewSmoothSyncMode.value === 'smooth' || previewSmoothSyncMode.value === 'reload'

  let title = '右側是即時預覽草稿'
  let badge = dirty ? '尚未儲存' : '已儲存'
  let badgeClass = dirty
    ? 'bg-amber-300 text-slate-950'
    : 'bg-emerald-300 text-slate-950'
  let toneClass = dirty
    ? 'border-amber-300/30 bg-amber-300/10 text-amber-100'
    : 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100'
  let summary = dirty
    ? '左側設定已更新右側預覽，但還沒有正式寫入資料庫。請按「儲存設定」後，正式玩家頁才會同步。'
    : '目前沒有尚未儲存的設定變更。右側預覽與最近一次保存狀態已收斂。'
  let officialHint = isOfficialOnline
    ? '目前是 Vercel 前端 + Render API，儲存成功後正式玩家頁會讀同一套線上資料庫。'
    : (isLocalApi
        ? '目前 API 是 localhost，本機修改不會同步到 Vercel 正式玩家頁。'
        : '目前 API 環境需確認，請先看 API Environment Guard。')

  if (env.mismatch) {
    title = '登入商家與網址商家不一致'
    badge = '先停止操作'
    badgeClass = 'bg-rose-300 text-slate-950'
    toneClass = 'border-rose-300/30 bg-rose-300/10 text-rose-100'
    summary = '目前登入商家與網址 tenantSlug 不一致。請從「我的活動」重新進入正確活動，避免改錯商家。'
  } else if (dirty && isOfficialOnline) {
    title = '預覽已更新，等待儲存到正式資料庫'
    badge = '待正式儲存'
  } else if (!dirty && isOfficialOnline && save.officialCanSync) {
    title = '已儲存到線上正式資料庫'
    badge = '正式頁可同步'
    badgeClass = 'bg-emerald-300 text-slate-950'
    toneClass = 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100'
    summary = '最近一次儲存已寫入 Render 線上資料庫。請重新整理正式玩家頁確認。'
  } else if (isLocalApi) {
    title = dirty ? '本機預覽已變更，尚未儲存' : '目前是本機測試環境'
    badge = dirty ? '本機草稿' : '本機模式'
    badgeClass = 'bg-amber-300 text-slate-950'
    toneClass = 'border-amber-300/30 bg-amber-300/10 text-amber-100'
  }

  return {
    eyebrow: 'Preview Draft Guard｜第 74801～75200 批',
    title,
    badge,
    badgeClass,
    toneClass,
    summary,
    officialHint,
    previewStatus: previewReady ? previewSmoothSyncStatus.value : '預覽尚未完成平滑同步',
    unsavedLabel: dirty ? '尚未儲存' : '已儲存',
    apiLabel: env.apiValue,
    playerUrl: playerUrl.value,
    showPlayerActions: Boolean(!isPlatformTemplateMode.value && playerUrl.value)
  }
})

const previewSaveGuidanceItems = computed(() => [
  { label: '預覽狀態', value: previewSaveGuidance.value.previewStatus },
  { label: '儲存狀態', value: previewSaveGuidance.value.unsavedLabel },
  { label: '目前 API', value: previewSaveGuidance.value.apiLabel },
  { label: '正式玩家頁', value: previewSaveGuidance.value.playerUrl }
])


// 第 74801～75200 批：輪盤資料來源統一提示與正式玩家同步修正版。
// 目的：把「玩家正式頁 / 商家活動設定 / 平台模板」三種來源一次講清楚，避免誤以為三者會自動同步。
const wheelUnifiedSourceGuide = computed(() => {
  const modeLabel = isPlatformTemplateMode.value ? '平台模板模式' : '商家活動模式'
  const targetLabel = isPlatformTemplateMode.value
    ? `平台模板：${platformWheelTemplateSlug.value}`
    : `商家：${tenantSlug.value || '-'}｜活動：${campaignId.value || '-'}`
  const playerSource = isPlatformTemplateMode.value
    ? '玩家正式頁不會直接讀平台模板；平台模板只在新建輪盤活動時複製一次。'
    : `玩家正式頁會讀取同一筆商家活動設定：campaignId=${campaignId.value || '-'}。`
  const previewSource = isPlatformTemplateMode.value
    ? '右側是平台模板草稿預覽，用來檢查未來新活動的預設外觀。'
    : '右側是目前商家活動的草稿預覽；按儲存設定後，玩家正式頁重新整理才會同步。'

  return {
    eyebrow: 'Unified Source Guard｜第 74801～75200 批',
    title: isPlatformTemplateMode.value
      ? '目前看到的是平台模板，不是商家正式活動'
      : '目前正在編輯商家正式活動資料來源',
    badge: modeLabel,
    badgeClass: isPlatformTemplateMode.value
      ? 'bg-orange-100 text-orange-800 ring-1 ring-orange-200'
      : 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200',
    toneClass: isPlatformTemplateMode.value
      ? 'border-orange-200 bg-orange-50 text-orange-800'
      : 'border-emerald-200 bg-emerald-50 text-emerald-800',
    targetLabel,
    playerSource,
    previewSource,
    templateSource: '平台模板只負責新建立輪盤活動的預設值；既有商家活動不會被模板自動覆蓋。',
    finalHint: isPlatformTemplateMode.value
      ? '如果要改玩家手機看到的活動，請從「商家活動 / 我的活動」進入該 campaignId 的設定頁。'
      : '如果玩家手機畫面沒有變，請先確認你是在 Vercel 線上後台儲存，且玩家網址 campaignId 與本頁相同。'
  }
})

const wheelUnifiedSourceRows = computed(() => [
  {
    label: '玩家手機正式頁',
    value: isPlatformTemplateMode.value ? '不讀平台模板' : `讀 campaignId=${campaignId.value || '-'}`,
    note: isPlatformTemplateMode.value
      ? '玩家頁只讀商家活動資料，不會直接讀模板中心。'
      : `正式網址：${playerUrl.value}`
  },
  {
    label: '商家輪盤設定頁',
    value: isPlatformTemplateMode.value ? '目前不是商家活動' : `tenant=${tenantSlug.value || '-'} / campaign=${campaignId.value || '-'}`,
    note: isPlatformTemplateMode.value
      ? '請回到商家活動列表，從某一筆 WHEEL 活動進入。'
      : '左側修改先進草稿預覽，按儲存設定才寫入資料庫。'
  },
  {
    label: '平台模板中心',
    value: platformWheelTemplateSlug.value,
    note: '只提供新建活動的預設外觀，不會自動改掉既有活動。'
  },
  {
    label: '右側 iframe 預覽',
    value: isPlatformTemplateMode.value ? '模板草稿預覽' : '商家活動草稿預覽',
    note: '預覽不是正式玩家資料庫結果；正式結果以儲存後的玩家頁重新整理為準。'
  }
])

const wheelUnifiedActionSteps = computed(() => {
  if (isPlatformTemplateMode.value) {
    return [
      '要改新活動預設：在這裡調整平台模板後按「儲存設定」。',
      '要改既有玩家活動：回商家活動列表，進入該 campaignId 的輪盤設定。',
      '模板儲存後，只會影響之後新建的輪盤活動，不會改既有活動。'
    ]
  }

  return [
    '確認本頁 campaignId 與玩家網址 campaignId 相同。',
    '調整設定後先看右側草稿預覽。',
    '按「儲存設定」寫入資料庫，再重新整理正式玩家頁確認。'
  ]
})

const safePreviewUrl = computed(() => {
  try {
    const parsed = new URL(playerUrl.value, frontOrigin.value)
    parsed.searchParams.set('adminPreview', '1')
    parsed.searchParams.set('adminPreviewDraft', '1')
    parsed.searchParams.set('previewKey', String(previewKey.value))
    if (!isPlatformTemplateMode.value) {
      parsed.searchParams.set('tenantSlug', tenantSlug.value)
    }
    parsed.searchParams.set('adminPreviewFocus', previewFocusMode.value)

    if (isPlatformTemplateMode.value) {
      parsed.searchParams.set('templatePreview', '1')
      parsed.searchParams.set('templateMode', '1')
      parsed.searchParams.set('templateId', templateId.value)
    }

    if (!isPlatformTemplateMode.value && campaignId.value) {
      parsed.searchParams.set('campaignId', campaignId.value)
    }

    return `${parsed.pathname}${parsed.search}`
  } catch (error) {
    const separator = playerUrl.value.includes('?') ? '&' : '?'
    const params = new URLSearchParams({
      adminPreview: '1',
      adminPreviewDraft: '1',
      previewKey: String(previewKey.value),
      adminPreviewFocus: previewFocusMode.value
    })

    if (!isPlatformTemplateMode.value) {
      params.set('tenantSlug', tenantSlug.value)
    }

    if (isPlatformTemplateMode.value) {
      params.set('templatePreview', '1')
      params.set('templateMode', '1')
      params.set('templateId', templateId.value)
    }

    if (campaignId.value) params.set('campaignId', campaignId.value)

    return `${playerUrl.value}${separator}${params.toString()}`
  }
})

const buildPreviewDraftSyncPayload = (reason = 'settings-update') => ({
  type: 'MGP_WHEEL_ADMIN_DRAFT_UPDATE',
  source: 'AdminWheelSettingsView',
  batch: '66401-66800',
  reason,
  storageKey: storageKey.value,
  settings: JSON.parse(JSON.stringify(settings)),
  route: {
    isPlatformTemplateMode: isPlatformTemplateMode.value,
    templateId: templateId.value,
    tenantSlug: tenantSlug.value,
    campaignId: campaignId.value || '',
    previewFocusMode: previewFocusMode.value
  },
  updatedAt: new Date().toISOString()
})

const postPreviewDraftUpdate = (reason = 'settings-update') => {
  if (typeof window === 'undefined') return false

  const frameWindow = previewIframeRef.value?.contentWindow
  if (!frameWindow) {
    previewSmoothSyncStatus.value = '預覽尚未載入，草稿已先保存。'
    previewSmoothSyncMode.value = 'pending'
    previewSmoothSyncAt.value = new Date().toLocaleTimeString('zh-TW', { hour12: false })
    return false
  }

  try {
    frameWindow.postMessage(buildPreviewDraftSyncPayload(reason), window.location.origin)
    previewSmoothSyncStatus.value = '右側預覽已平滑更新，沒有重新載入 iframe。'
    previewSmoothSyncMode.value = 'smooth'
    previewSmoothSyncCount.value += 1
    previewSmoothSyncAt.value = new Date().toLocaleTimeString('zh-TW', { hour12: false })
    return true
  } catch (error) {
    console.warn('同步輪盤右側預覽失敗，保留草稿等待下次重載：', error)
    previewSmoothSyncStatus.value = '平滑同步失敗，已保存草稿；必要時可手動重整預覽。'
    previewSmoothSyncMode.value = 'warning'
    previewSmoothSyncAt.value = new Date().toLocaleTimeString('zh-TW', { hour12: false })
    return false
  }
}

const forcePreviewReload = (reason = 'manual-reload') => {
  previewKey.value += 1
  previewSmoothSyncStatus.value = `已重載預覽：${reason}`
  previewSmoothSyncMode.value = 'reload'
  previewSmoothSyncAt.value = new Date().toLocaleTimeString('zh-TW', { hour12: false })
  nextTick(scrollPreviewToFocus)
}

// 第 66801～67200 批：右側預覽平滑同步監控與手動重整保險。
// 平常使用 postMessage 平滑同步，不白屏；若 iframe 因瀏覽器限制或跨環境沒有接到訊息，可手動重整一次。
const previewSmoothSyncToneClass = computed(() => {
  if (previewSmoothSyncMode.value === 'smooth') return 'bg-emerald-50 text-emerald-700'
  if (previewSmoothSyncMode.value === 'warning') return 'bg-amber-50 text-amber-700'
  if (previewSmoothSyncMode.value === 'pending') return 'bg-blue-50 text-blue-700'
  if (previewSmoothSyncMode.value === 'reload') return 'bg-orange-50 text-orange-700'
  return 'bg-slate-50 text-slate-600'
})

const manualRefreshPreview = () => {
  persistLocalDraft('manual-preview-refresh')
  forcePreviewReload('手動重整預覽')
}

const assignDeep = (target, source) => {
  Object.keys(source || {}).forEach((key) => {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {}
      assignDeep(target[key], source[key])
      return
    }

    target[key] = source[key]
  })
}

const unwrapApiPayload = (payload) => {
  if (!payload || typeof payload !== 'object') return payload
  return payload.data ?? payload.result ?? payload
}

const buildPlatformTemplatePayload = () => ({
  title: `平台輪盤模板｜${templateId.value}`,
  slug: platformWheelTemplateSlug.value,
  description: '平台總管理員維護的輪盤模板來源；新建輪盤活動時會複製一次成商家活動副本。',
  gameType: 'WHEEL',
  status: 'DRAFT',
  templateStorageMode: 'PLATFORM_WHEEL_TEMPLATE',
  templateId: templateId.value,
  settings: JSON.parse(JSON.stringify(settings))
})

const fetchPlatformTemplateCampaign = async () => {
  const response = await fetch(`${API_BASE_URL}/campaigns?gameType=WHEEL&slug=${encodeURIComponent(platformWheelTemplateSlug.value)}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...getAuthHeaders()
    }
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || '讀取平台輪盤模板失敗')
  }

  const data = unwrapApiPayload(payload)
  const list = Array.isArray(data) ? data : []
  return list.find((item) => item?.slug === platformWheelTemplateSlug.value) || null
}

const createPlatformTemplateCampaign = async () => {
  const response = await fetch(`${API_BASE_URL}/campaigns`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(buildPlatformTemplatePayload())
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || '建立平台輪盤模板來源失敗')
  }

  return unwrapApiPayload(payload)
}

const savePlatformTemplateGameConfig = async (templateCampaignId) => {
  if (!templateCampaignId) {
    throw new Error('缺少平台模板 campaignId，無法儲存平台模板設定')
  }

  const response = await fetch(`${API_BASE_URL}/campaigns/${encodeURIComponent(templateCampaignId)}/game-config`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({
      settings: JSON.parse(JSON.stringify(settings))
    })
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || '儲存平台輪盤模板設定失敗')
  }

  return unwrapApiPayload(payload)
}

const savePlatformTemplateRemote = async () => {
  let templateCampaign = await fetchPlatformTemplateCampaign()

  if (!templateCampaign) {
    templateCampaign = await createPlatformTemplateCampaign()
  }

  const templateCampaignId = templateCampaign?.id || templateCampaign?.campaign?.id || templateCampaign?.data?.id

  if (!templateCampaignId) {
    throw new Error('建立平台輪盤模板來源後，無法取得 campaignId')
  }

  platformTemplateCampaignId.value = String(templateCampaignId)
  await savePlatformTemplateGameConfig(templateCampaignId)
  platformTemplateRemoteLoaded.value = true

  return {
    success: true,
    mode: 'platform-template-remote-source',
    templateCampaignId,
    platformTemplateSlug: platformWheelTemplateSlug.value
  }
}

const loadPlatformTemplateRemote = async () => {
  const templateCampaign = await fetchPlatformTemplateCampaign()

  if (!templateCampaign?.gameConfig?.settings) {
    platformTemplateRemoteLoaded.value = false
    return null
  }

  platformTemplateCampaignId.value = String(templateCampaign.id || '')
  platformTemplateRemoteLoaded.value = true
  return templateCampaign.gameConfig.settings
}

const fetchGameConfig = async () => {
  if (isPlatformTemplateMode.value) return null
  if (!campaignId.value) return null

  const response = await fetch(`${API_BASE_URL}/campaigns/${encodeURIComponent(campaignId.value)}/game-config`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...getAuthHeaders()
    }
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || '讀取輪盤資料庫設定失敗')
  }

  const data = unwrapApiPayload(payload)
  return data?.settings || data?.gameConfig?.settings || {}
}

const saveGameConfig = async () => {
  if (isPlatformTemplateMode.value) {
    return savePlatformTemplateRemote()
  }

  if (!campaignId.value) {
    throw new Error('缺少 campaignId，無法儲存到資料庫')
  }

  const response = await fetch(`${API_BASE_URL}/campaigns/${encodeURIComponent(campaignId.value)}/game-config`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({
      settings: JSON.parse(JSON.stringify(settings))
    })
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || '儲存輪盤資料庫設定失敗')
  }

  return unwrapApiPayload(payload)
}

const persistLocalDraft = (reason = 'settings-update') => {
  try {
    localStorage.setItem(storageKey.value, JSON.stringify(settings))
    // 第 66401～66800 批：一般設定變更只透過 postMessage 推送到右側 iframe，
    // 不再增加 previewKey，避免 iframe 整頁重載造成白畫面與跳動。
    postPreviewDraftUpdate(reason)
    return true
  } catch (error) {
    console.warn('暫存輪盤設定草稿失敗：', error)
    return false
  }
}

const loadRemoteGameConfig = async () => {
  if (isPlatformTemplateMode.value) {
    try {
      const remoteSettings = await loadPlatformTemplateRemote()
      if (remoteSettings && Object.keys(remoteSettings).length) {
        assignDeep(settings, defaultSettings())
        assignDeep(settings, remoteSettings)
        persistLocalDraft('platform-template-remote-loaded')
        forcePreviewReload('平台模板資料載入')
      }
      remoteConfigLoaded.value = platformTemplateRemoteLoaded.value
    } catch (error) {
      console.warn('讀取平台輪盤模板來源失敗，暫用本機草稿：', error)
      remoteConfigLoaded.value = false
      platformTemplateRemoteLoaded.value = false
    }
    return
  }

  if (!campaignId.value) return

  try {
    const remoteSettings = await fetchGameConfig()
    if (remoteSettings && Object.keys(remoteSettings).length) {
      assignDeep(settings, defaultSettings())
      assignDeep(settings, remoteSettings)
      persistLocalDraft('merchant-remote-loaded')
      forcePreviewReload('商家活動資料載入')
    }
    remoteConfigLoaded.value = true
  } catch (error) {
    console.warn('讀取輪盤資料庫設定失敗，暫用本機草稿：', error)
    remoteConfigLoaded.value = false
    saveErrorMessage.value = error?.message || '讀取資料庫設定失敗，暫用本機草稿。'
  }
}

const loadSettings = () => {
  try {
    const raw = localStorage.getItem(storageKey.value)
    if (!raw) return

    const parsed = JSON.parse(raw)
    assignDeep(settings, parsed)
  } catch (error) {
    console.warn('讀取輪盤設定失敗：', error)
  }
}

const saveSettings = async (options = {}) => {
  const silent = options?.silent === true

  saveErrorMessage.value = ''
  persistLocalDraft('settings-update')

  if (isPlatformTemplateMode.value) {
    isSaving.value = true

    try {
      const result = await saveGameConfig()
      remoteConfigLoaded.value = true
      platformTemplateRemoteLoaded.value = true
      saveAuditRecord.value = buildSaveAuditRecord('success', {
        batch: '58401-58800',
        message: `平台輪盤模板已儲存到資料庫來源 ${result.platformTemplateSlug || platformWheelTemplateSlug.value}；之後新建輪盤活動會複製這份最新模板一次。`,
        effect: '只更新平台模板來源資料，不會修改任何既有商家活動；新建 WHEEL 活動時才會複製一次。',
        templateGuard: `平台模板來源 campaignId:${result.templateCampaignId || platformTemplateCampaignId.value || '-'} / slug:${result.platformTemplateSlug || platformWheelTemplateSlug.value}`
      })
      markSettingsSaved('平台輪盤模板已正式儲存')
      if (!silent) {
        savedMessage.value = '已儲存平台輪盤模板到資料庫。新建輪盤活動會複製這份最新模板。'
        window.setTimeout(() => {
          savedMessage.value = ''
        }, 3000)
      }
    } catch (error) {
      const message = error?.message || '儲存平台輪盤模板到資料庫失敗，請確認後端與平台管理員權限。'
      saveAuditRecord.value = buildSaveAuditRecord('failed', {
        batch: '58401-58800',
        message,
        effect: '本次平台模板儲存失敗，新建活動不會取得這次修改的模板內容。'
      })
      saveErrorMessage.value = message
      savedMessage.value = ''
    } finally {
      isSaving.value = false
    }
    return
  }

  if (options?.localOnly === true) {
    saveAuditRecord.value = buildSaveAuditRecord('success', {
      title: '商家輪盤活動本機草稿驗收',
      message: '本次只暫存本機草稿與預覽，尚未寫入後端資料庫。',
      effect: '只更新瀏覽器本機草稿與右側預覽，不會寫入平台模板或商家活動資料庫。'
    })
    markSettingsDirty('已暫存本機草稿，但尚未正式寫入資料庫')
    if (!silent) {
      savedMessage.value = '已暫存本機草稿，右側預覽已重新載入。'
      window.setTimeout(() => {
        savedMessage.value = ''
      }, 2200)
    }
    return
  }

  isSaving.value = true

  try {
    await saveGameConfig()
    remoteConfigLoaded.value = true
    saveAuditRecord.value = buildSaveAuditRecord('success', {
      message: '商家輪盤活動設定已正式寫入資料庫；平台模板與其他商家活動沒有被修改。'
    })
    markSettingsSaved('商家輪盤活動已正式儲存')

    if (!silent) {
      savedMessage.value = '已正式儲存到資料庫，玩家手機重新整理後會同步看到。'
      window.setTimeout(() => {
        savedMessage.value = ''
      }, 2600)
    }
  } catch (error) {
    const message = error?.message || '儲存到資料庫失敗，請確認後端與登入權限。'
    saveAuditRecord.value = buildSaveAuditRecord('failed', {
      message,
      effect: '本次儲存失敗，沒有完成資料庫寫入。請先確認後端、登入權限與 campaignId。'
    })
    saveErrorMessage.value = message
    savedMessage.value = ''
  } finally {
    isSaving.value = false
  }
}

const buildSaveConfirmMessage = () => {
  if (isPlatformTemplateMode.value) {
    return [
      '確認儲存平台輪盤模板？',
      '',
      `儲存目標：${platformWheelTemplateSlug.value}`,
      '影響範圍：儲存為平台模板資料庫來源，不會改到任何既有商家活動。',
      '新建輪盤活動：建立時會複製這份最新模板一次。',
      '玩家頁：不會直接讀平台模板。',
      `獎項百分比：${prizePercentSummary.value.badge}｜${prizePercentSummary.value.normalizedNote}`,
      '正式抽獎提醒：本批不修改後端 draw-engine，正式 play API 欄位對齊需另行驗證。',
      '',
      '確認後才會儲存。'
    ].join('\n')
  }

  return [
    '確認儲存目前商家輪盤活動？',
    '',
    `儲存目標：tenant:${tenantSlug.value} / campaignId:${campaignId.value || '-'}`,
    '影響範圍：只寫入目前這個活動的 gameConfig.settings。',
    '平台模板：不會被回寫。',
    '其他商家：不會被改動。',
    `獎項百分比：${prizePercentSummary.value.badge}｜${prizePercentSummary.value.normalizedNote}`,
    '正式抽獎提醒：本批不修改後端 draw-engine，正式 play API 欄位對齊需另行驗證。',
    '',
    '確認後才會正式寫入資料庫。'
  ].join('\n')
}

const guardedSaveSettings = async (options = {}) => {
  if (options?.silent === true || options?.localOnly === true) {
    return saveSettings(options)
  }

  if (!prizePercentSummary.value.isPerfect && typeof window !== 'undefined') {
    const percentConfirmed = window.confirm([
      '獎項百分比總和目前不是 100%。',
      '',
      `目前狀態：${prizePercentSummary.value.badge}`,
      prizePercentSummary.value.message,
      '',
      '系統仍會依比例抽選，但正式活動建議先修正到 100%。',
      '是否仍要繼續儲存？'
    ].join('\n'))

    if (!percentConfirmed) {
      copiedMessage.value = '已取消儲存，請先修正獎項百分比總和。'
      window.setTimeout(() => {
        copiedMessage.value = ''
      }, 2400)
      return
    }
  }

  const confirmed = typeof window === 'undefined'
    ? true
    : window.confirm(buildSaveConfirmMessage())

  if (!confirmed) {
    saveAuditRecord.value = buildSaveAuditRecord('cancelled', {
      title: isPlatformTemplateMode.value ? '平台輪盤模板儲存已取消' : '商家輪盤活動儲存已取消',
      message: '你已取消儲存，本次沒有修改平台模板或商家活動。',
      effect: '取消後不會寫入任何資料。'
    })
    copiedMessage.value = '已取消儲存，沒有修改平台模板或商家活動。'
    window.setTimeout(() => {
      copiedMessage.value = ''
    }, 2400)
    return
  }

  return saveSettings(options)
}


let previewSyncTimer = null

const schedulePreviewSync = () => {
  if (typeof window === 'undefined') return

  window.clearTimeout(previewSyncTimer)
  previewSyncTimer = window.setTimeout(() => {
    persistLocalDraft('settings-update')
  }, 650)
}

const resetSettings = () => {
  const fresh = defaultSettings()
  Object.keys(settings).forEach((key) => delete settings[key])
  assignDeep(settings, fresh)
  localStorage.setItem(storageKey.value, JSON.stringify(settings))
  persistLocalDraft('reset-all-defaults')
  forcePreviewReload('還原全部預設')
  savedMessage.value = isPlatformTemplateMode.value ? '已還原平台輪盤模板預設，右側預覽已同步；請按儲存設定保存模板草稿。' : '已還原輪盤預設設定，右側預覽已同步；請按儲存設定寫入資料庫。'
  markSettingsDirty('已還原預設，尚未儲存')
}


const sectionResetOptions = [
  { key: 'polish', label: '清除精緻預設標記', desc: '移除 templateMeta.visualPolish，保留目前顏色與輪盤數值。' },
  { key: 'basic', label: '還原基本文字', desc: '活動標題、品牌文字、主要按鈕文字回到預設。' },
  { key: 'theme', label: '還原主題色彩', desc: '背景、按鈕、輪盤外框、指針顏色回到預設。' },
  { key: 'wheel', label: '還原輪盤樣式', desc: '輪盤大小、外圈、中心按鈕、獎項文字回到預設。' },
  { key: 'display', label: '還原展示區塊', desc: '品牌卡、狀態卡、紀錄、獎品牆等開關回到預設。' },
  { key: 'serial', label: '還原序號文字', desc: '序號標題、提示、驗證按鈕與抽獎按鈕回到預設。' },
  { key: 'sound', label: '還原音效特效', desc: '卡點聲、結果音效、指針抖動、光暈與彩帶回到預設。' },
  { key: 'rules', label: '還原規則說明', desc: '活動規則、獎品說明與頁尾備註回到預設。' },
  { key: 'frontend', label: '還原品牌前台設定', desc: 'Logo、品牌連結、品牌按鈕與文字大小回到預設。' },
  { key: 'prizes', label: '還原輪盤獎項', desc: '獎項名稱、中獎百分比、圖示與顏色回到預設。' }
]

const currentSectionResetOption = computed(() => {
  return sectionResetOptions.find((item) => item.key === activeCategory.value) || sectionResetOptions[0]
})

const replaceReactiveObject = (target, source) => {
  if (!target || typeof target !== 'object') return
  Object.keys(target).forEach((key) => delete target[key])
  assignDeep(target, source || {})
}

const clonePlainValue = (value) => {
  try {
    return JSON.parse(JSON.stringify(value))
  } catch (error) {
    return value
  }
}

const resetTopLevelFields = (fresh = {}, fieldKeys = []) => {
  fieldKeys.forEach((key) => {
    settings[key] = clonePlainValue(fresh[key])
  })
}

const resetSectionToDefault = (sectionKey = activeCategory.value) => {
  const option = sectionResetOptions.find((item) => item.key === sectionKey)
  const label = option?.label || '還原目前分類'

  if (typeof window !== 'undefined') {
    const confirmed = window.confirm([
      `確認執行「${label}」？`,
      '',
      '這只會改目前畫面草稿與右側預覽。',
      '正式玩家頁必須再按「儲存設定」後才會同步。'
    ].join('\n'))

    if (!confirmed) return
  }

  const fresh = defaultSettings()

  if (sectionKey === 'polish') {
    if (settings.templateMeta && typeof settings.templateMeta === 'object' && !Array.isArray(settings.templateMeta)) {
      delete settings.templateMeta.visualPolish
    }
  } else if (sectionKey === 'basic') {
    resetTopLevelFields(fresh, [
      'pageTitle',
      'brandName',
      'brandSubtitle',
      'headline',
      'subtitle',
      'badgeText',
      'playButtonText',
      'verifyButtonText',
      'resultTitle'
    ])
  } else if (sectionKey === 'theme') {
    replaceReactiveObject(settings.theme, fresh.theme)
  } else if (sectionKey === 'wheel') {
    replaceReactiveObject(settings.wheelStyle, fresh.wheelStyle)
  } else if (sectionKey === 'display') {
    replaceReactiveObject(settings.display, fresh.display)
  } else if (sectionKey === 'serial') {
    resetTopLevelFields(fresh, ['serialTitle', 'serialHint', 'verifyButtonText', 'playButtonText', 'badgeText'])
    settings.serialPrefix = settings.serialPrefix || 'WHEEL'
    settings.requireSerialCode = true
  } else if (sectionKey === 'sound') {
    replaceReactiveObject(settings.effects, fresh.effects)
    if (settings.display) settings.display.enableSound = true
  } else if (sectionKey === 'rules') {
    replaceReactiveObject(settings.content, fresh.content)
    if (settings.display) {
      settings.display.showRules = true
      settings.display.showPrizeInfo = true
    }
  } else if (sectionKey === 'frontend') {
    resetTopLevelFields(fresh, [
      'brandLogoUrl',
      'brandLinkUrl',
      'brandLinkText',
      'brandLogoSize',
      'brandTitleSize',
      'brandTextColor',
      'brandButtonBgColor',
      'brandButtonTextColor',
      'brandButtonTextSize'
    ])
    settings.logoText = fresh.logoText || 'W'
  } else if (sectionKey === 'prizes') {
    settings.prizes.splice(0, settings.prizes.length, ...clonePlainValue(fresh.prizes))
  }

  activeCategory.value = sectionKey
  persistLocalDraft('settings-update')
  previewFocusMode.value = ['theme', 'wheel', 'polish', 'prizes'].includes(sectionKey) ? 'wheel' : 'top'
  nextTick(scrollPreviewToFocus)
  markSettingsDirty(`已執行「${label}」，尚未儲存`)
  savedMessage.value = `已執行「${label}」，右側預覽已更新；請按儲存設定保存。`
  window.setTimeout(() => {
    savedMessage.value = ''
  }, 2600)
}

const resetCurrentSectionToDefault = () => {
  resetSectionToDefault(activeCategory.value)
}

const copyText = async (text, message = '已複製到剪貼簿') => {
  try {
    await navigator.clipboard.writeText(text)
  } catch (error) {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }

  copiedMessage.value = message
  window.setTimeout(() => {
    copiedMessage.value = ''
  }, 1800)
}

const openPlayer = () => {
  window.open(playerUrl.value, '_blank', 'noopener,noreferrer')
}

const backToCampaigns = () => {
  if (isPlatformTemplateMode.value) {
    router.push('/admin/game-settings')
    return
  }

  router.push({
    path: '/admin/campaigns',
    query: campaignId.value
      ? {
          campaignId: campaignId.value,
          gameType: 'WHEEL'
        }
      : {}
  })
}

const addPrize = () => {
  const remainingPercent = Math.max(0, 100 - prizePercentTotal.value)

  settings.prizes.push({
    id: Date.now(),
    icon: '🎁',
    imageUrl: '',
    linkUrl: '',
    name: '新獎項',
    weight: remainingPercent > 0 ? Math.min(remainingPercent, 10) : 0,
    color: '#f59e0b'
  })
}

const removePrize = (index) => {
  if (settings.prizes.length <= 2) return
  settings.prizes.splice(index, 1)
}

const downloadJson = () => {
  const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = isPlatformTemplateMode.value
    ? `wheel-platform-template-${templateId.value}.json`
    : `wheel-settings-${tenantSlug.value}-${campaignId.value || 'draft'}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}


const getPreviewFocusSelector = () => {
  if (previewFocusMode.value === 'wheel') return '.premium-wheel-stage, .premium-wheel-svg-wrap'
  if (previewFocusMode.value === 'serial') return '.premium-wheel-serial-card, [data-admin-preview-section="serial"]'
  if (previewFocusMode.value === 'records') return '[data-admin-preview-section="records"], .premium-wheel-history-panel'
  return '.premium-vip-header-card, body'
}

const scrollPreviewToFocus = () => {
  if (typeof window === 'undefined') return

  window.setTimeout(() => {
    try {
      const frame = previewIframeRef.value
      const doc = frame?.contentDocument || frame?.contentWindow?.document
      if (!doc) return

      const target = doc.querySelector(getPreviewFocusSelector()) || doc.body
      target.scrollIntoView({ block: previewFocusMode.value === 'wheel' ? 'center' : 'start', behavior: 'auto' })
    } catch (error) {
      console.warn('同步右側預覽位置失敗：', error)
    }
  }, 420)
}

const setPreviewFocus = (mode = 'wheel') => {
  // 第 66401～66800 批：切換焦點只捲動 iframe 內既有內容，不重載頁面。
  previewFocusMode.value = mode
  postPreviewDraftUpdate('preview-focus-change')
  nextTick(scrollPreviewToFocus)
}

const handlePreviewIframeLoad = () => {
  scrollPreviewToFocus()
}

watch(storageKey, () => {
  isSettingsHydrating.value = true
  assignDeep(settings, defaultSettings())
  loadSettings()
  loadSaveAuditHistory()
  forcePreviewReload('切換活動或模板')
  markSettingsSaved('已切換頁面並載入目前設定')
  nextTick(() => {
    isSettingsHydrating.value = false
  })
})

watch(saveAuditRecord, (record) => {
  pushSaveAuditHistory(record)
})


watch(activeCategory, (key) => {
  if (['wheel', 'prizes', 'theme', 'polish'].includes(key)) {
    setPreviewFocus('wheel')
    return
  }

  if (key === 'serial') {
    setPreviewFocus('serial')
    return
  }

  if (key === 'display') {
    setPreviewFocus('records')
    return
  }

  setPreviewFocus('top')
})

watch(
  settings,
  () => {
    schedulePreviewSync()
    markSettingsDirty('設定已修改，右側預覽已更新但尚未正式儲存')
  },
  { deep: true }
)

onMounted(async () => {
  isSettingsHydrating.value = true
  loadSettings()
  loadSaveAuditHistory()
  await loadRemoteGameConfig()
  persistLocalDraft('settings-update')
  markSettingsSaved('頁面已載入目前設定')
  window.addEventListener('beforeunload', handleBeforeUnload)
  nextTick(() => {
    isSettingsHydrating.value = false
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<template>
  <div class="space-y-6">
    <section class="sticky top-0 z-40 rounded-b-[1.75rem] border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.18em] text-orange-500">設定操作</p>
          <p class="text-sm font-bold text-slate-500">
            {{ isPlatformTemplateMode ? '目前是平台模板模式：修改只保存平台模板草稿，不會改到任何商家既有活動。' : '修改會先同步右側預覽；按「儲存設定」後會正式寫入資料庫，客人手機重新整理就會同步。' }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span v-if="savedMessage" class="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">
            {{ savedMessage }}
          </span>
          <span v-if="copiedMessage" class="rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700">
            {{ copiedMessage }}
          </span>
          <span v-if="saveErrorMessage" class="rounded-full bg-rose-50 px-4 py-2 text-xs font-black text-rose-700">
            {{ saveErrorMessage }}
          </span>
          <span v-else-if="remoteConfigLoaded" class="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600">
            {{ isPlatformTemplateMode ? (platformTemplateRemoteLoaded ? '已連接平台模板來源' : '平台模板草稿模式') : '已連接資料庫設定' }}
          </span>
          <span
            class="rounded-full px-4 py-2 text-xs font-black"
            :class="hasUnsavedChanges ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'"
          >
            {{ hasUnsavedChanges ? '尚未儲存' : '已儲存' }}
          </span>

          <button
            type="button"
            class="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow transition hover:-translate-y-0.5 hover:bg-slate-800"
            :disabled="isSaving"
            @click="guardedSaveSettings"
          >
            {{ isSaving ? '儲存中...' : '儲存設定' }}
          </button>
          <button
            type="button"
            class="rounded-2xl border border-orange-200 bg-orange-50 px-5 py-3 text-sm font-black text-orange-700 transition hover:bg-orange-100"
            @click="openPlayer"
          >
            {{ isPlatformTemplateMode ? '開啟模板預覽' : '開啟玩家頁' }}
          </button>
          <button
            type="button"
            class="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            @click="resetSettings"
          >
            還原預設
          </button>
        </div>
      </div>
    </section>

    <section class="rounded-[2rem] border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5 shadow-sm">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.18em] text-amber-600">Polish Workflow｜第 65251～65600 批</p>
          <h2 class="mt-2 text-xl font-black text-slate-950">輪盤模組精緻操作流程</h2>
          <p class="mt-2 max-w-3xl text-sm font-bold leading-7 text-slate-500">
            建議順序：先套用模組精緻預設，再看右側手機預覽，確認後按「儲存設定」，最後開啟正式玩家頁檢查。
            如果目前 API 是 localhost，代表只改本機資料庫；正式玩家頁要同步必須在線上 Vercel 後台儲存。
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-white shadow transition hover:-translate-y-0.5 hover:bg-amber-600"
            @click="setCategory('polish')"
          >
            ① 前往模組精緻
          </button>
          <button
            type="button"
            class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
            @click="setPreviewFocus('wheel')"
          >
            ② 對準輪盤預覽
          </button>
          <button
            type="button"
            class="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-100"
            @click="openPlayer"
          >
            ③ 開啟玩家頁
          </button>
          <button
            type="button"
            class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
            @click="copyText(playerUrl, '已複製正式玩家頁網址。')"
          >
            複製玩家網址
          </button>
        </div>
      </div>

      <div class="mt-4 grid gap-3 md:grid-cols-4">
        <div class="rounded-3xl border border-white/80 bg-white/75 p-4 shadow-sm">
          <p class="text-xs font-black text-slate-400">目前模式</p>
          <p class="mt-1 text-sm font-black text-slate-900">{{ isPlatformTemplateMode ? '平台輪盤模板' : '商家活動設定' }}</p>
        </div>
        <div class="rounded-3xl border border-white/80 bg-white/75 p-4 shadow-sm">
          <p class="text-xs font-black text-slate-400">目前 API</p>
          <p class="mt-1 break-all text-sm font-black text-slate-900">{{ API_BASE_URL }}</p>
        </div>
        <div class="rounded-3xl border border-white/80 bg-white/75 p-4 shadow-sm">
          <p class="text-xs font-black text-slate-400">目前活動</p>
          <p class="mt-1 text-sm font-black text-slate-900">{{ campaignId || '平台模板' }}</p>
        </div>
        <div class="rounded-3xl border border-white/80 bg-white/75 p-4 shadow-sm">
          <p class="text-xs font-black text-slate-400">正式玩家頁</p>
          <p class="mt-1 break-all text-xs font-black text-slate-700">{{ playerUrl }}</p>
        </div>
      </div>
    </section>
    <section class="rounded-[2rem] border p-5 shadow-sm" :class="wheelUnifiedSourceGuide.toneClass">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.2em] opacity-70">{{ wheelUnifiedSourceGuide.eyebrow }}</p>
          <h2 class="mt-2 text-2xl font-black">{{ wheelUnifiedSourceGuide.title }}</h2>
          <p class="mt-2 max-w-4xl text-sm font-bold leading-6 opacity-85">
            {{ wheelUnifiedSourceGuide.finalHint }}
          </p>
        </div>
        <span class="inline-flex rounded-full px-4 py-2 text-xs font-black" :class="wheelUnifiedSourceGuide.badgeClass">
          {{ wheelUnifiedSourceGuide.badge }}
        </span>
      </div>

      <div class="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="item in wheelUnifiedSourceRows"
          :key="item.label"
          class="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-sm"
        >
          <p class="text-xs font-black opacity-60">{{ item.label }}</p>
          <p class="mt-2 break-all text-sm font-black leading-6">{{ item.value }}</p>
          <p class="mt-1 text-xs font-bold leading-5 opacity-70">{{ item.note }}</p>
        </div>
      </div>

      <div class="mt-4 grid gap-3 lg:grid-cols-3">
        <div class="rounded-3xl border border-white/70 bg-white/80 p-4 text-sm font-bold leading-6">
          <p class="text-xs font-black opacity-60">目前儲存目標</p>
          <p class="mt-2 break-all font-black">{{ wheelUnifiedSourceGuide.targetLabel }}</p>
        </div>
        <div class="rounded-3xl border border-white/70 bg-white/80 p-4 text-sm font-bold leading-6">
          <p class="text-xs font-black opacity-60">玩家頁資料來源</p>
          <p class="mt-2">{{ wheelUnifiedSourceGuide.playerSource }}</p>
        </div>
        <div class="rounded-3xl border border-white/70 bg-white/80 p-4 text-sm font-bold leading-6">
          <p class="text-xs font-black opacity-60">右側預覽來源</p>
          <p class="mt-2">{{ wheelUnifiedSourceGuide.previewSource }}</p>
        </div>
      </div>

      <div class="mt-4 rounded-3xl border border-white/70 bg-white/80 p-4">
        <p class="text-xs font-black opacity-60">正確操作順序</p>
        <ol class="mt-2 grid gap-2 text-sm font-bold leading-6 md:grid-cols-3">
          <li
            v-for="(step, index) in wheelUnifiedActionSteps"
            :key="step"
            class="rounded-2xl border border-white/70 bg-white/70 px-4 py-3"
          >
            <span class="font-black">{{ index + 1 }}.</span> {{ step }}
          </li>
        </ol>
      </div>
    </section>

    <section class="overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-sm">
      <div class="grid gap-0 xl:grid-cols-[1fr_0.72fr]">
        <div class="bg-gradient-to-br from-slate-950 via-orange-950 to-slate-900 p-6 text-white">
          <p class="text-xs font-black uppercase tracking-[0.24em] text-orange-200">
            Wheel Template Center｜第 53201～53600 批
          </p>
          <h1 class="mt-3 text-3xl font-black">
            {{ isPlatformTemplateMode ? '平台輪盤模板設定' : '輪盤單一活動設定' }}
          </h1>
          <p class="mt-3 max-w-3xl text-sm font-bold leading-7 text-white/75">
            {{ isPlatformTemplateMode ? '這裡是平台總管理員編輯輪盤模組模板的地方。這份模板用來當新商家活動的預設外觀，不會直接覆蓋既有商家活動。' : '這裡是商家編輯幸運輪盤玩家畫面的地方。九宮格、砸金蛋已經有專屬設定頁，這批補上輪盤設定中心，避免進入模板中心後看不到可修改內容。' }}
          </p>

          <div class="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              class="rounded-2xl bg-orange-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-orange-200"
              @click="guardedSaveSettings"
            >
              儲存設定
            </button>
            <button
              type="button"
              class="rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
              @click="openPlayer"
            >
              {{ isPlatformTemplateMode ? '開啟模板預覽' : '開啟玩家頁' }}
            </button>
            <button
              type="button"
              class="rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
              @click="backToCampaigns"
            >
              {{ isPlatformTemplateMode ? '回模板中心' : '回我的活動' }}
            </button>
          </div>
        </div>

        <div class="grid gap-3 bg-orange-50 p-5">
          <div class="rounded-3xl border border-orange-100 bg-white p-4">
            <p class="text-xs font-black text-slate-400">目前活動</p>
            <p class="mt-2 text-2xl font-black text-slate-950">{{ isPlatformTemplateMode ? '模板 wheel' : `ID ${campaignId || '-'}` }}</p>
            <p class="mt-1 text-sm font-bold text-slate-500">{{ isPlatformTemplateMode ? '平台總管理員 / 模組模板' : `商家：${tenantSlug}` }}</p>
          </div>

          <div class="rounded-3xl border border-orange-100 bg-white p-4">
            <p class="text-xs font-black text-slate-400">{{ isPlatformTemplateMode ? '模板預覽網址' : '正式玩家網址' }}</p>
            <p class="mt-2 break-all font-mono text-xs font-black leading-6 text-slate-700">{{ playerUrl }}</p>
            <button
              type="button"
              class="mt-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-black text-orange-700"
              @click="copyText(playerUrl, isPlatformTemplateMode ? '已複製輪盤模板預覽網址' : '已複製輪盤玩家網址')"
            >
              複製網址
            </button>

            <div class="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-6 text-amber-800">
              {{ isPlatformTemplateMode ? '平台模板模式只保存模板草稿；商家活動要另外從模板複製後才會套用。' : '此頁會儲存商家單一活動設定；客人手機重新整理後會讀取資料庫設定。' }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section v-if="savedMessage || copiedMessage" class="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-700">
      {{ savedMessage || copiedMessage }}
    </section>

    <section class="rounded-[2rem] border p-5 shadow-sm" :class="unsavedChangesGuard.toneClass">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.2em] opacity-70">{{ unsavedChangesGuard.eyebrow }}</p>
          <h2 class="mt-2 text-2xl font-black">{{ unsavedChangesGuard.title }}</h2>
          <p class="mt-2 max-w-4xl text-sm font-bold leading-6 opacity-80">
            {{ unsavedChangesGuard.reason }}
          </p>
        </div>
        <span class="inline-flex rounded-full px-4 py-2 text-xs font-black" :class="unsavedChangesGuard.badgeClass">
          {{ unsavedChangesGuard.badge }}
        </span>
      </div>

      <div class="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="item in unsavedChangesItems"
          :key="item.label"
          class="rounded-3xl border border-white/50 bg-white/70 p-4"
        >
          <p class="text-xs font-black opacity-60">{{ item.label }}</p>
          <p class="mt-2 break-all text-sm font-black leading-6">{{ item.value }}</p>
        </div>
      </div>

      <div class="mt-4 flex flex-col gap-3 rounded-3xl border border-white/50 bg-white/70 p-4 text-sm font-bold leading-6 lg:flex-row lg:items-center lg:justify-between">
        <p>{{ unsavedChangesGuard.nextAction }}</p>
        <button
          type="button"
          class="rounded-2xl bg-slate-950 px-5 py-3 text-xs font-black text-white shadow transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isSaving || !hasUnsavedChanges"
          @click="guardedSaveSettings"
        >
          {{ isSaving ? '儲存中...' : '立即儲存設定' }}
        </button>
      </div>
    </section>

    <section v-if="isPlatformTemplateMode" class="rounded-3xl border border-orange-200 bg-orange-50 p-5 text-sm font-bold leading-6 text-orange-800">
      <span class="font-black">目前是平台輪盤模板模式。</span>
      這裡改的是「遊戲模板中心 / 輪盤模組」的預設外觀，不會修改 A 商家、campaignId=3 或任何已存在的商家活動。
    </section>

    <section class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.2em] text-blue-500">{{ apiEnvironmentGuard.eyebrow }}</p>
          <h2 class="mt-2 text-2xl font-black text-slate-950">{{ apiEnvironmentGuard.title }}</h2>
          <p class="mt-2 max-w-4xl text-sm font-bold leading-6 text-slate-500">
            這裡會直接判斷你現在是本機 localhost 還是 Vercel 線上後台，也會檢查目前 API 是否指向 Render 正式資料庫，避免商家改了畫面但正式玩家頁沒有同步。
          </p>
        </div>
        <span class="inline-flex rounded-full px-4 py-2 text-xs font-black" :class="apiEnvironmentGuard.badgeClass">
          {{ apiEnvironmentGuard.badge }}
        </span>
      </div>

      <div class="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="item in apiEnvironmentItems"
          :key="item.label"
          class="rounded-3xl border border-slate-100 bg-slate-50 p-4"
        >
          <p class="text-xs font-black text-slate-400">{{ item.label }}</p>
          <p class="mt-2 break-all text-sm font-black leading-6 text-slate-800">{{ item.value }}</p>
          <p class="mt-1 text-xs font-bold leading-5 text-slate-500">{{ item.note }}</p>
        </div>
      </div>

      <div class="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
        <div class="rounded-3xl border p-4 text-sm font-bold leading-6" :class="apiEnvironmentGuard.toneClass">
          {{ apiEnvironmentGuard.playerSyncLabel }}
        </div>
        <div class="rounded-3xl border p-4 text-sm font-bold leading-6" :class="apiEnvironmentGuard.toneClass">
          {{ apiEnvironmentGuard.warning }}
        </div>
      </div>

      <div class="mt-4 rounded-3xl border border-blue-200 bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-800">
        商家後台網址應該是 Vercel 的 <span class="font-black">/admin</span> 頁面；Render 的 <span class="font-black">/api</span> 是後端資料接口，不是給商家直接開的後台頁面。
      </div>
    </section>

    <section class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.2em] text-orange-500">{{ editScopeGuard.eyebrow }}</p>
          <h2 class="mt-2 text-2xl font-black text-slate-950">{{ editScopeGuard.title }}</h2>
          <p class="mt-2 max-w-4xl text-sm font-bold leading-6 text-slate-500">
            {{ editScopeGuard.description }}
          </p>
        </div>

        <span
          class="inline-flex rounded-full px-4 py-2 text-xs font-black"
          :class="editScopeGuard.badgeClass"
        >
          {{ editScopeGuard.badge }}
        </span>
      </div>

      <div class="mt-5 grid gap-3 md:grid-cols-2">
        <div class="rounded-3xl border border-slate-100 bg-slate-50 p-4">
          <p class="text-xs font-black text-slate-400">{{ editScopeGuard.primaryLabel }}</p>
          <p class="mt-2 break-all text-sm font-black leading-6 text-slate-800">{{ editScopeGuard.primaryValue }}</p>
        </div>
        <div class="rounded-3xl border border-slate-100 bg-slate-50 p-4">
          <p class="text-xs font-black text-slate-400">{{ editScopeGuard.secondaryLabel }}</p>
          <p class="mt-2 text-sm font-black leading-6 text-slate-800">{{ editScopeGuard.secondaryValue }}</p>
        </div>
      </div>

      <div class="mt-4 grid gap-3 md:grid-cols-4">
        <div
          v-for="item in editScopeChecklist"
          :key="item.label"
          class="rounded-3xl border border-slate-100 bg-white p-4"
        >
          <p class="text-xs font-black text-slate-400">{{ item.label }}</p>
          <p class="mt-2 text-sm font-black leading-6 text-slate-800">{{ item.value }}</p>
        </div>
      </div>

      <div
        class="mt-4 rounded-3xl border p-4 text-sm font-bold leading-6"
        :class="editScopeGuard.safe ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'"
      >
        {{ editScopeGuard.warning }}
      </div>
    </section>

    <section class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.2em] text-orange-500">{{ saveScopeGuard.eyebrow }}</p>
          <h2 class="mt-2 text-2xl font-black text-slate-950">{{ saveScopeGuard.title }}</h2>
          <p class="mt-2 max-w-4xl text-sm font-bold leading-6 text-slate-500">
            {{ saveScopeGuard.confirmLabel }}
          </p>
        </div>

        <span
          class="inline-flex rounded-full px-4 py-2 text-xs font-black"
          :class="saveScopeGuard.badgeClass"
        >
          {{ saveScopeGuard.badge }}
        </span>
      </div>

      <div class="mt-5 grid gap-3 md:grid-cols-2">
        <div class="rounded-3xl border border-slate-100 bg-slate-50 p-4">
          <p class="text-xs font-black text-slate-400">{{ saveScopeGuard.targetLabel }}</p>
          <p class="mt-2 break-all text-sm font-black leading-6 text-slate-800">{{ saveScopeGuard.targetValue }}</p>
        </div>
        <div class="rounded-3xl border border-slate-100 bg-slate-50 p-4">
          <p class="text-xs font-black text-slate-400">{{ saveScopeGuard.effectLabel }}</p>
          <p class="mt-2 text-sm font-black leading-6 text-slate-800">{{ saveScopeGuard.effectValue }}</p>
        </div>
      </div>

      <div class="mt-4 rounded-3xl border border-blue-200 bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-800">
        {{ saveScopeGuard.warning }}
      </div>
    </section>

    <section class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.2em] text-emerald-500">{{ saveResultAudit.eyebrow }}</p>
          <h2 class="mt-2 text-2xl font-black text-slate-950">{{ saveResultAudit.title }}</h2>
          <p class="mt-2 max-w-4xl text-sm font-bold leading-6 text-slate-500">
            {{ saveResultAudit.statusText }}
          </p>
        </div>

        <span
          class="inline-flex rounded-full px-4 py-2 text-xs font-black"
          :class="saveResultAudit.badgeClass"
        >
          {{ saveResultAudit.badge }}
        </span>
      </div>

      <div class="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div
          v-for="item in saveResultAuditItems"
          :key="item.label"
          class="rounded-3xl border border-slate-100 bg-slate-50 p-4"
        >
          <p class="text-xs font-black text-slate-400">{{ item.label }}</p>
          <p class="mt-2 break-all text-sm font-black leading-6 text-slate-800">{{ item.value }}</p>
        </div>
      </div>

      <div
        class="mt-4 rounded-3xl border p-4 text-sm font-bold leading-6"
        :class="saveResultAudit.safe ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'"
      >
        {{ isPlatformTemplateMode ? '驗收重點：平台模板儲存後仍只是模板草稿，不會直接同步到任何既有商家活動。' : '驗收重點：商家活動儲存後仍是該活動自己的設定，不會回寫平台模板，也不會影響其他商家。' }}
      </div>
    </section>

    <section class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.2em] text-cyan-500">{{ onlineSaveSyncCheck.eyebrow }}</p>
          <h2 class="mt-2 text-2xl font-black text-slate-950">{{ onlineSaveSyncCheck.title }}</h2>
          <p class="mt-2 max-w-4xl text-sm font-bold leading-6 text-slate-500">
            {{ onlineSaveSyncCheck.statusText }}
          </p>
        </div>

        <span
          class="inline-flex rounded-full px-4 py-2 text-xs font-black"
          :class="onlineSaveSyncCheck.badgeClass"
        >
          {{ onlineSaveSyncCheck.badge }}
        </span>
      </div>

      <div class="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="item in onlineSaveSyncItems"
          :key="item.label"
          class="rounded-3xl border border-slate-100 bg-slate-50 p-4"
        >
          <p class="text-xs font-black text-slate-400">{{ item.label }}</p>
          <p class="mt-2 break-all text-sm font-black leading-6 text-slate-800">{{ item.value }}</p>
        </div>
      </div>

      <div class="mt-4 rounded-3xl border p-4 text-sm font-bold leading-6" :class="onlineSaveSyncCheck.toneClass">
        {{ onlineSaveSyncCheck.nextAction }}
      </div>

      <div v-if="onlineSaveSyncCheck.showPlayerButton" class="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow transition hover:bg-slate-800"
          @click="openPlayer"
        >
          開啟正式玩家頁確認
        </button>
        <button
          type="button"
          class="rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-3 text-sm font-black text-cyan-700 transition hover:bg-cyan-100"
          @click="copyText(playerUrl, '已複製正式玩家頁網址')"
        >
          複製正式玩家頁網址
        </button>
      </div>
    </section>

    <section class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.2em] text-indigo-500">{{ saveAuditHistorySummary.eyebrow }}</p>
          <h2 class="mt-2 text-2xl font-black text-slate-950">{{ saveAuditHistorySummary.title }}</h2>
          <p class="mt-2 max-w-4xl text-sm font-bold leading-6 text-slate-500">
            {{ saveAuditHistorySummary.desc }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span
            class="inline-flex rounded-full px-4 py-2 text-xs font-black"
            :class="saveAuditHistorySummary.badgeClass"
          >
            {{ saveAuditHistorySummary.badge }}
          </span>
          <button
            type="button"
            class="rounded-full border border-indigo-200 bg-white px-4 py-2 text-xs font-black text-indigo-700 hover:bg-indigo-50"
            @click="exportSaveAuditHistory"
          >
            匯出 JSON
          </button>
          <button
            type="button"
            class="rounded-full border border-slate-200 px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"
            @click="clearSaveAuditHistory"
          >
            清除紀錄
          </button>
        </div>
      </div>

      <div class="mt-5 rounded-3xl border border-indigo-100 bg-indigo-50 p-4 text-sm font-bold leading-6 text-indigo-800">
        最近一次：{{ saveAuditHistorySummary.latestLabel }}
      </div>

      <div v-if="saveAuditHistoryItems.length" class="mt-5 space-y-3">
        <div
          v-for="item in saveAuditHistoryItems"
          :key="item.id"
          class="rounded-3xl border border-slate-100 bg-slate-50 p-4"
        >
          <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <p class="text-sm font-black text-slate-900">{{ item.title }}</p>
              <p class="mt-1 text-xs font-bold text-slate-500">{{ item.savedAtLabel }}｜{{ item.target }}</p>
            </div>
            <span class="inline-flex w-fit rounded-full px-3 py-1 text-xs font-black" :class="item.statusClass">
              {{ item.statusLabel }}
            </span>
          </div>
          <div class="mt-3 grid gap-2 md:grid-cols-2">
            <p class="rounded-2xl bg-white p-3 text-xs font-bold leading-5 text-slate-600">影響範圍：{{ item.effect }}</p>
            <p class="rounded-2xl bg-white p-3 text-xs font-bold leading-5 text-slate-600">隔離保護：{{ item.templateGuard }}</p>
          </div>
        </div>
      </div>

      <div v-else class="mt-5 rounded-3xl border border-slate-100 bg-slate-50 p-4 text-sm font-bold text-slate-500">
        尚無儲存驗收歷史。完成一次儲存、取消或失敗後，這裡會保留最近 8 筆；也可以匯出 JSON 留存驗收紀錄。
      </div>
    </section>

    <section class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.2em] text-orange-500">Template Clone Guard｜第 55201～55600 批</p>
          <h2 class="mt-2 text-2xl font-black text-slate-950">{{ templateCloneStatus.title }}</h2>
          <p class="mt-2 text-sm font-bold leading-6 text-slate-500">
            {{ isPlatformTemplateMode ? '這張卡用來提醒：目前正在改平台模板本體，不會直接同步到任何商家既有活動。' : '這張卡會讀取活動 settings.templateMeta，用來確認此輪盤活動是否為平台模板建立時複製出來的安全商家副本。' }}
          </p>
        </div>

        <span
          class="inline-flex rounded-full px-4 py-2 text-xs font-black"
          :class="templateCloneStatus.safe ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'"
        >
          {{ templateCloneStatus.badge }}
        </span>
      </div>

      <div class="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="item in templateCloneStatusItems"
          :key="item.label"
          class="rounded-3xl border border-slate-100 bg-slate-50 p-4"
        >
          <p class="text-xs font-black text-slate-400">{{ item.label }}</p>
          <p class="mt-2 text-sm font-black leading-6 text-slate-800">{{ item.value }}</p>
        </div>
      </div>

      <div
        v-if="!isPlatformTemplateMode && !templateCloneStatus.safe"
        class="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800"
      >
        找不到完整的 templateMeta 安全副本標記。舊活動可能是在第 54001～55200 批之前建立，這不代表活動壞掉；只代表它不是新模板複製流程建立的活動。
      </div>
    </section>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px] 2xl:grid-cols-[minmax(0,1fr)_460px]">
      <div class="space-y-6">
        <section class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div class="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.2em] text-orange-500">{{ categoryPanelSummary.eyebrow }}</p>
              <h2 class="mt-2 text-2xl font-black text-slate-950">{{ categoryPanelSummary.title }}</h2>
              <p class="mt-2 text-sm font-bold text-slate-500">{{ categoryPanelSummary.desc }}</p>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                @click="setCategory('basic')"
              >
                回到簡易模式
              </button>
              <button
                type="button"
                class="rounded-2xl border border-orange-200 bg-orange-50 px-5 py-3 text-sm font-black text-orange-700 transition hover:bg-orange-100"
                @click="toggleCategoryPanel"
              >
                {{ categoryPanelCollapsed ? '展開分類' : '收合分類' }}
              </button>
              <button
                type="button"
                class="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
                @click="resetSettings"
              >
                重設
              </button>
            </div>
          </div>

          <div class="mb-4 rounded-[1.5rem] border border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 p-4">
            <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div class="flex items-center gap-3">
                <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-orange-700 shadow-sm">
                  {{ categoryPanelSummary.activeIcon }}
                </span>
                <div>
                  <p class="text-sm font-black text-slate-900">目前分類：{{ categoryPanelSummary.activeTitle }}</p>
                  <p class="mt-1 text-xs font-bold leading-5 text-slate-500">{{ categoryPanelSummary.activeDesc }}</p>
                </div>
              </div>
              <div class="w-full lg:max-w-xl">
                <label class="text-[11px] font-black uppercase tracking-[0.18em] text-orange-500">
                  Settings Search｜第 64001～64400 批
                </label>
                <div class="mt-2 flex items-center gap-2 rounded-2xl border border-orange-100 bg-white px-3 py-2 shadow-sm">
                  <input
                    v-model="settingSearchQuery"
                    type="search"
                    class="min-w-0 flex-1 border-0 bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400"
                    placeholder="搜尋：顏色、輪盤、指針、按鈕、獎項、序號、音效"
                  >
                  <button
                    v-if="settingSearchQuery"
                    type="button"
                    class="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 transition hover:bg-slate-200"
                    @click="clearSettingSearch"
                  >
                    清除
                  </button>
                </div>
                <p class="mt-2 text-xs font-bold leading-5 text-slate-500">{{ settingSearchSummary }}</p>
                <div v-if="settingSearchQuery" class="mt-3 flex flex-wrap gap-2">
                  <button
                    v-for="category in settingSearchMatchedCategories"
                    :key="`search-${category.key}`"
                    type="button"
                    class="rounded-full bg-orange-100 px-3 py-1.5 text-xs font-black text-orange-700 transition hover:bg-orange-200"
                    @click="setCategoryFromSearch(category.key)"
                  >
                    {{ category.title }}
                  </button>
                  <span v-if="!settingSearchMatchedCategories.length" class="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-500">
                    沒有符合分類
                  </span>
                </div>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="category in quickSettingCategories"
                  :key="`quick-${category.key}`"
                  type="button"
                  class="rounded-full px-4 py-2 text-xs font-black transition"
                  :class="activeCategory === category.key
                    ? 'bg-slate-950 text-white shadow'
                    : 'bg-white text-slate-600 ring-1 ring-orange-100 hover:bg-orange-100 hover:text-orange-700'
                  "
                  @click="setCategory(category.key)"
                >
                  {{ category.title }}
                </button>
              </div>
            </div>
          </div>

          <div class="mb-4 rounded-[1.5rem] border border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 p-4">
            <div class="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p class="text-[11px] font-black uppercase tracking-[0.18em] text-blue-500">
                  Section Reset Guard｜第 64801～65200 批
                </p>
                <h3 class="mt-2 text-base font-black text-slate-950">分類局部還原</h3>
                <p class="mt-1 text-xs font-bold leading-5 text-slate-500">
                  可只還原目前分類，不會整份設定重置。右側會先更新預覽，正式玩家頁仍需按「儲存設定」。
                </p>
              </div>
              <div class="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-blue-100 xl:min-w-[260px]">
                <p class="text-xs font-black text-blue-500">目前可還原</p>
                <p class="mt-1 text-sm font-black text-slate-900">{{ currentSectionResetOption.label }}</p>
                <p class="mt-1 text-xs font-bold leading-5 text-slate-500">{{ currentSectionResetOption.desc }}</p>
              </div>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded-2xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white shadow transition hover:bg-blue-700"
                @click="resetCurrentSectionToDefault"
              >
                還原目前分類
              </button>
              <button
                v-for="option in sectionResetOptions"
                :key="`section-reset-${option.key}`"
                type="button"
                class="rounded-full px-3 py-1.5 text-xs font-black transition"
                :class="activeCategory === option.key
                  ? 'bg-slate-950 text-white shadow'
                  : 'bg-white text-slate-600 ring-1 ring-blue-100 hover:bg-blue-100 hover:text-blue-700'
                "
                @click="resetSectionToDefault(option.key)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div v-show="!categoryPanelCollapsed" class="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            <button
              v-for="category in filteredSettingCategories"
              :key="category.key"
              type="button"
              class="group rounded-[1.6rem] border p-4 text-left transition"
              :class="activeCategory === category.key
                ? 'border-orange-300 bg-gradient-to-br from-orange-500 to-purple-600 text-white shadow-xl shadow-orange-200/70'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-orange-200 hover:bg-orange-50'
              "
              @click="setCategory(category.key)"
            >
              <div class="flex items-center gap-3">
                <span
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black shadow-sm"
                  :class="activeCategory === category.key ? 'bg-white/20 text-white' : 'bg-white text-slate-700'"
                >
                  {{ category.icon }}
                </span>
                <div>
                  <p class="text-base font-black">{{ category.title }}</p>
                  <p :class="['mt-1 text-xs font-bold leading-5', activeCategory === category.key ? 'text-white/80' : 'text-slate-400']">
                    {{ category.desc }}
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div
            v-if="!categoryPanelCollapsed && settingSearchQuery && !filteredSettingCategories.length"
            class="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-500"
          >
            沒有找到符合「{{ settingSearchQuery }}」的設定分類，請嘗試搜尋：顏色、輪盤、指針、按鈕、獎項、序號、音效。
          </div>

          <div v-show="categoryPanelCollapsed" class="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-500">
            分類清單已收合。你可以用上方常用設定或搜尋框快速定位，或按「展開分類」查看全部設定分類。
          </div>
        </section>

        <section v-show="activeCategory === 'polish'" class="rounded-[2rem] border border-orange-200 bg-white p-6 shadow-sm">
          <div class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.2em] text-orange-500">{{ wheelPolishSummary.eyebrow }}</p>
              <h2 class="mt-2 text-2xl font-black text-slate-950">{{ wheelPolishSummary.title }}</h2>
              <p class="mt-2 max-w-4xl text-sm font-bold leading-6 text-slate-500">{{ wheelPolishSummary.desc }}</p>
            </div>
            <button
              type="button"
              class="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow transition hover:-translate-y-0.5 hover:bg-slate-800"
              @click="guardedSaveSettings"
            >
              儲存精緻設定
            </button>
          </div>

          <div class="grid gap-3 md:grid-cols-2">
            <div class="rounded-3xl border border-orange-100 bg-orange-50 p-4">
              <p class="text-xs font-black text-orange-500">套用目標</p>
              <p class="mt-2 break-all text-sm font-black leading-6 text-orange-900">{{ wheelPolishSummary.target }}</p>
            </div>
            <div class="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
              <p class="text-xs font-black text-emerald-600">隔離保護</p>
              <p class="mt-2 text-sm font-black leading-6 text-emerald-900">{{ wheelPolishSummary.guard }}</p>
            </div>
          </div>

          <div class="mt-5 rounded-[1.75rem] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-5 shadow-sm">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p class="text-xs font-black uppercase tracking-[0.18em] text-orange-500">{{ currentWheelPolishStatus.eyebrow }}</p>
                <h3 class="mt-2 text-xl font-black text-slate-950">{{ currentWheelPolishStatus.title }}</h3>
                <p class="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-500">{{ currentWheelPolishStatus.desc }}</p>
              </div>
              <span class="inline-flex w-fit rounded-full px-4 py-2 text-xs font-black" :class="currentWheelPolishStatus.badgeClass">
                {{ currentWheelPolishStatus.badge }}
              </span>
            </div>
            <div class="mt-4 grid gap-3 md:grid-cols-3">
              <div class="rounded-2xl bg-white/80 p-4 ring-1 ring-orange-100">
                <p class="text-xs font-black text-slate-400">目前預設</p>
                <p class="mt-1 text-sm font-black text-slate-900">{{ currentWheelPolishStatus.presetName }}</p>
              </div>
              <div class="rounded-2xl bg-white/80 p-4 ring-1 ring-orange-100">
                <p class="text-xs font-black text-slate-400">套用時間</p>
                <p class="mt-1 text-sm font-black text-slate-900">{{ currentWheelPolishStatus.appliedAt }}</p>
              </div>
              <div class="rounded-2xl bg-white/80 p-4 ring-1 ring-orange-100">
                <p class="text-xs font-black text-slate-400">套用目標</p>
                <p class="mt-1 break-all text-xs font-black text-slate-900">{{ currentWheelPolishStatus.target }}</p>
              </div>
            </div>
          </div>

          <div class="mt-5 rounded-[1.75rem] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-5 shadow-sm">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p class="text-xs font-black uppercase tracking-[0.18em] text-indigo-500">{{ polishFineTuneSummary.eyebrow }}</p>
                <h3 class="mt-2 text-xl font-black text-slate-950">{{ polishFineTuneSummary.title }}</h3>
                <p class="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-500">{{ polishFineTuneSummary.desc }}</p>
              </div>
              <div class="grid gap-2 rounded-3xl bg-white/80 p-4 text-xs font-black text-slate-600 ring-1 ring-indigo-100">
                <span>目前預設：{{ polishFineTuneSummary.presetName }}</span>
                <span>微調目標：{{ polishFineTuneSummary.target }}</span>
                <span>最近微調：{{ polishFineTuneSummary.updatedAt }}</span>
              </div>
            </div>

            <div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div
                v-for="control in polishFineTuneControls"
                :key="control.key"
                class="rounded-3xl border border-white bg-white/90 p-4 shadow-sm ring-1 ring-indigo-50"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-sm font-black text-slate-900">{{ control.label }}</p>
                    <p class="mt-1 text-xs font-bold leading-5 text-slate-500">{{ control.desc }}</p>
                  </div>
                  <span class="rounded-full bg-indigo-100 px-3 py-1 text-xs font-black text-indigo-700">
                    {{ getWheelFineTuneValue(control.key) }}{{ control.unit }}
                  </span>
                </div>

                <input
                  type="range"
                  class="mt-4 w-full accent-indigo-600"
                  :min="control.min"
                  :max="control.max"
                  :step="control.step"
                  :value="getWheelFineTuneValue(control.key)"
                  @input="setWheelFineTuneValue(control.key, $event.target.value)"
                />

                <div class="mt-3 flex items-center gap-2">
                  <input
                    type="number"
                    class="w-28 rounded-2xl border border-indigo-100 px-3 py-2 text-sm font-black text-slate-800 outline-none focus:border-indigo-400"
                    :min="control.min"
                    :max="control.max"
                    :step="control.step"
                    :value="getWheelFineTuneValue(control.key)"
                    @input="setWheelFineTuneValue(control.key, $event.target.value)"
                  />
                  <span class="text-xs font-black text-slate-400">{{ control.min }}～{{ control.max }}{{ control.unit }}</span>
                </div>
              </div>
            </div>

            <div class="mt-4 rounded-3xl border border-indigo-200 bg-indigo-50 p-4 text-sm font-bold leading-6 text-indigo-800">
              微調會立即更新右側預覽與本機草稿；要讓平台模板或商家正式玩家頁同步，仍需按「儲存設定」。
            </div>
          </div>

          <div class="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            <article
              v-for="preset in wheelPolishPresets"
              :key="preset.key"
              class="group overflow-hidden rounded-[1.75rem] border p-4 transition hover:-translate-y-1 hover:border-orange-300 hover:bg-orange-50 hover:shadow-xl"
              :class="isCurrentWheelPolishPreset(preset.key) ? 'border-orange-400 bg-orange-50 shadow-xl ring-2 ring-orange-200' : 'border-slate-200 bg-slate-50'"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <span class="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-orange-700 ring-1 ring-orange-100">{{ preset.badge }}</span>
                  <h3 class="mt-3 text-lg font-black text-slate-950">{{ preset.name }}</h3>
                  <p v-if="isCurrentWheelPolishPreset(preset.key)" class="mt-2 inline-flex rounded-full bg-orange-500 px-3 py-1 text-xs font-black text-white">
                    目前已套用
                  </p>
                </div>
                <div
                  class="h-14 w-14 shrink-0 rounded-full border-[6px] shadow-inner"
                  :style="{ background: `linear-gradient(135deg, ${preset.theme.backgroundFrom}, ${preset.theme.backgroundTo})`, borderColor: preset.theme.wheelOuterColor }"
                ></div>
              </div>
              <p class="mt-3 min-h-[4.5rem] text-sm font-bold leading-6 text-slate-500">{{ preset.desc }}</p>
              <div class="mt-4 flex gap-2">
                <span
                  v-for="color in [preset.theme.backgroundFrom, preset.theme.backgroundTo, preset.theme.wheelOuterColor, preset.theme.pointerColor]"
                  :key="color"
                  class="h-7 w-7 rounded-full border border-white shadow"
                  :style="{ backgroundColor: color }"
                ></span>
              </div>
              <button
                type="button"
                class="mt-5 w-full rounded-2xl px-4 py-3 text-sm font-black text-white shadow transition"
                :class="isCurrentWheelPolishPreset(preset.key) ? 'bg-slate-900 hover:bg-slate-800' : 'bg-orange-500 hover:bg-orange-600'"
                @click="applyWheelPolishPreset(preset.key)"
              >
                {{ isCurrentWheelPolishPreset(preset.key) ? '重新套用目前預設' : '套用這個精緻預設' }}
              </button>
            </article>
          </div>

          <div class="mt-5 rounded-3xl border border-blue-200 bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-800">
            本批只新增輪盤模組的視覺預設控制。套用後仍需按「儲存設定」；平台模板模式只保存模板草稿，商家活動模式只保存目前活動。
          </div>
        </section>

        <section v-show="activeCategory === 'basic'" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div class="mb-5 flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.2em] text-orange-500">基本文字</p>
              <h2 class="mt-2 text-2xl font-black text-slate-950">基本文字</h2>
              <p class="mt-2 text-sm font-bold text-slate-500">調整玩家頁標題、品牌文字與按鈕文字。</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button type="button" class="rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white" @click="guardedSaveSettings">
                儲存設定
              </button>
              <button type="button" class="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-500" @click="resetSettings">
                還原預設
              </button>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <label class="grid gap-2 text-sm font-black text-slate-700">
              頁面標題
              <input v-model="settings.pageTitle" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
            </label>
            <label class="grid gap-2 text-sm font-black text-slate-700">
              品牌名稱
              <input v-model="settings.brandName" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
            </label>
            <label class="grid gap-2 text-sm font-black text-slate-700">
              品牌副標
              <input v-model="settings.brandSubtitle" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
            </label>
            <label class="grid gap-2 text-sm font-black text-slate-700">
              主標題
              <input v-model="settings.headline" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
            </label>
            <label class="grid gap-2 text-sm font-black text-slate-700">
              副標題
              <input v-model="settings.subtitle" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
            </label>
            <label class="grid gap-2 text-sm font-black text-slate-700">
              標籤文字
              <input v-model="settings.badgeText" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
            </label>
            <label class="grid gap-2 text-sm font-black text-slate-700">
              抽獎按鈕文字
              <input v-model="settings.playButtonText" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
            </label>
            <label class="grid gap-2 text-sm font-black text-slate-700">
              驗證按鈕文字
              <input v-model="settings.verifyButtonText" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
            </label>
          </div>

          <div class="mt-6 rounded-3xl border border-orange-100 bg-orange-50 p-5">
            <p class="text-xs font-black uppercase tracking-[0.2em] text-orange-500">品牌格子設定</p>
            <h3 class="mt-2 text-lg font-black text-slate-950">上方品牌格子 / LOGO / 超連結</h3>
            <p class="mt-1 text-sm font-bold text-slate-500">可放商家 LOGO 圖片網址，點擊後連到官網、LINE 或活動頁。</p>

            <div class="mt-4 grid gap-4 md:grid-cols-2">
              <label class="grid gap-2 text-sm font-black text-slate-700">
                品牌 LOGO 圖片網址
                <input v-model="settings.brandLogoUrl" placeholder="https://..." class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
              </label>
              <label class="grid gap-2 text-sm font-black text-slate-700">
                品牌超連結
                <input v-model="settings.brandLinkUrl" placeholder="https:// 或 LINE 官方帳號連結" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
              </label>
              <label class="grid gap-2 text-sm font-black text-slate-700">
                品牌連結文字
                <input v-model="settings.brandLinkText" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
              </label>
              <label class="grid gap-2 text-sm font-black text-slate-700">
                品牌文字顏色
                <div class="flex gap-2">
                  <input v-model="settings.brandTextColor" type="color" class="h-12 w-14 rounded-xl border border-slate-200 bg-white p-1" />
                  <input v-model="settings.brandTextColor" class="min-w-0 flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400" />
                </div>
              </label>
              <label class="grid gap-2 text-sm font-black text-slate-700">
                連結按鈕底色
                <div class="flex gap-2">
                  <input v-model="settings.brandButtonBgColor" type="color" class="h-12 w-14 rounded-xl border border-slate-200 bg-white p-1" />
                  <input v-model="settings.brandButtonBgColor" class="min-w-0 flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400" />
                </div>
              </label>
              <label class="grid gap-2 text-sm font-black text-slate-700">
                連結按鈕文字顏色
                <div class="flex gap-2">
                  <input v-model="settings.brandButtonTextColor" type="color" class="h-12 w-14 rounded-xl border border-slate-200 bg-white p-1" />
                  <input v-model="settings.brandButtonTextColor" class="min-w-0 flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400" />
                </div>
              </label>
              <label class="grid gap-2 text-sm font-black text-slate-700">
                LOGO 大小
                <input v-model.number="settings.brandLogoSize" type="range" min="40" max="96" class="w-full" />
                <span class="text-xs font-bold text-slate-400">{{ settings.brandLogoSize }} px</span>
              </label>
              <label class="grid gap-2 text-sm font-black text-slate-700">
                品牌標題文字大小
                <input v-model.number="settings.brandTitleSize" type="range" min="14" max="34" class="w-full" />
                <span class="text-xs font-bold text-slate-400">{{ settings.brandTitleSize }} px</span>
              </label>
              <label class="grid gap-2 text-sm font-black text-slate-700">
                連結按鈕文字大小
                <input v-model.number="settings.brandButtonTextSize" type="range" min="10" max="22" class="w-full" />
                <span class="text-xs font-bold text-slate-400">{{ settings.brandButtonTextSize }} px</span>
              </label>
            </div>
          </div>
        </section>

        <section v-show="activeCategory === 'theme'" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-orange-500">主題色彩</p>
          <h2 class="mt-2 text-2xl font-black text-slate-950">主題色彩設定</h2>
          <p class="mt-2 text-sm font-bold text-slate-500">只調整整體配色：背景、面板、按鈕、指針與輪盤主色。</p>

          <div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label v-for="(value, key) in settings.theme" :key="key" class="grid gap-2 text-sm font-black text-slate-700">
              <span>{{ themeLabels[key] || key }}</span>
              <div class="flex gap-2">
                <input v-model="settings.theme[key]" type="color" class="h-12 w-14 rounded-xl border border-slate-200 bg-white p-1" />
                <input v-model="settings.theme[key]" class="min-w-0 flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400" />
              </div>
              <span class="text-xs font-bold leading-5 text-slate-400">{{ themeDescriptions[key] || '調整輪盤玩家頁視覺顏色。' }}</span>
            </label>
          </div>
        </section>

        <section v-show="activeCategory === 'wheel'" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-orange-500">輪盤樣式</p>
          <h2 class="mt-2 text-2xl font-black text-slate-950">輪盤外觀與獎項顯示</h2>
          <p class="mt-2 text-sm font-bold text-slate-500">這裡只管輪盤本體：尺寸、外框、中心按鈕、指針、獎項文字與圖示。</p>

          <div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label class="grid gap-2 text-sm font-black text-slate-700">
              輪盤尺寸
              <input v-model.number="settings.wheelStyle.wheelSize" type="range" min="260" max="420" class="w-full" />
              <span class="text-xs font-bold text-slate-400">{{ settings.wheelStyle.wheelSize }} px</span>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              外框粗細
              <input v-model.number="settings.wheelStyle.outerRingWidth" type="range" min="6" max="22" class="w-full" />
              <span class="text-xs font-bold text-slate-400">{{ settings.wheelStyle.outerRingWidth }} px</span>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              外圈燈泡數量
              <input v-model.number="settings.wheelStyle.rimLightCount" type="range" min="12" max="48" class="w-full" />
              <span class="text-xs font-bold text-slate-400">{{ settings.wheelStyle.rimLightCount || 30 }} 顆｜建議 24～36</span>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              燈泡大小
              <input v-model.number="settings.wheelStyle.rimLightSize" type="range" min="4" max="16" class="w-full" />
              <span class="text-xs font-bold text-slate-400">{{ settings.wheelStyle.rimLightSize || 9 }} px｜讓外圈更像實體活動輪盤</span>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              輪盤厚度立體感（強化）
              <input v-model.number="settings.wheelStyle.wheelDepthLevel" type="range" min="0" max="100" class="w-full" />
              <span class="text-xs font-bold text-slate-400">{{ settings.wheelStyle.wheelDepthLevel ?? 72 }} %｜0=平面，100=厚底、陰影、內盤浮起最明顯</span>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              舞台光暈強度
              <input v-model.number="settings.wheelStyle.stageGlowLevel" type="range" min="0" max="100" class="w-full" />
              <span class="text-xs font-bold text-slate-400">{{ settings.wheelStyle.stageGlowLevel ?? 72 }} %｜控制輪盤後方柔光與高級展示感</span>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              舞台底座陰影
              <input v-model.number="settings.wheelStyle.stageShadowLevel" type="range" min="0" max="100" class="w-full" />
              <span class="text-xs font-bold text-slate-400">{{ settings.wheelStyle.stageShadowLevel ?? 70 }} %｜讓輪盤像放在實體展架上</span>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              舞台圓角高級感
              <input v-model.number="settings.wheelStyle.stageCornerLevel" type="range" min="0" max="100" class="w-full" />
              <span class="text-xs font-bold text-slate-400">{{ settings.wheelStyle.stageCornerLevel ?? 76 }} %｜控制外框圓角與精品卡片感</span>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              舞台內層亮面
              <input v-model.number="settings.wheelStyle.stageInnerLightLevel" type="range" min="0" max="100" class="w-full" />
              <span class="text-xs font-bold text-slate-400">{{ settings.wheelStyle.stageInnerLightLevel ?? 64 }} %｜增加內框玻璃反光，但不會變成圖片</span>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              中心按鈕大小
              <input v-model.number="settings.wheelStyle.centerButtonSize" type="range" min="64" max="120" class="w-full" />
              <span class="text-xs font-bold text-slate-400">{{ settings.wheelStyle.centerButtonSize }} px</span>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              中心按鈕文字
              <input v-model="settings.wheelStyle.centerButtonText" maxlength="8" class="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700" placeholder="SPIN" />
              <span class="text-xs font-bold text-slate-400">會同步到玩家輪盤中心按鈕</span>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              中心文字大小
              <input v-model.number="settings.wheelStyle.centerButtonTextSize" type="range" min="10" max="34" class="w-full" />
              <span class="text-xs font-bold text-slate-400">{{ settings.wheelStyle.centerButtonTextSize || 18 }} px</span>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              中心文字顏色
              <input v-model="settings.wheelStyle.centerButtonTextColor" type="color" class="h-10 rounded-2xl border border-slate-200 bg-white px-2" />
              <span class="text-xs font-bold text-slate-400">控制中心按鈕文字顏色，右側預覽會即時同步</span>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              中心外框顏色
              <input v-model="settings.wheelStyle.centerButtonBorderColor" type="color" class="h-10 rounded-2xl border border-slate-200 bg-white px-2" />
              <span class="text-xs font-bold text-slate-400">控制中心按鈕外框線顏色，右側預覽會即時同步</span>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              指針大小
              <input v-model.number="settings.wheelStyle.pointerSize" type="range" min="28" max="64" class="w-full" />
              <span class="text-xs font-bold text-slate-400">{{ settings.wheelStyle.pointerSize }} px</span>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              指針上下位置
              <input v-model.number="settings.wheelStyle.pointerOffsetY" type="range" min="-36" max="24" class="w-full" />
              <span class="text-xs font-bold text-slate-400">{{ settings.wheelStyle.pointerOffsetY ?? -10 }} px｜負數往上，正數往下</span>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              指針高光質感
              <input v-model.number="settings.wheelStyle.pointerGlossLevel" type="range" min="0" max="100" class="w-full" />
              <span class="text-xs font-bold text-slate-400">{{ settings.wheelStyle.pointerGlossLevel ?? 72 }} %｜增加烤漆反光</span>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              指針陰影厚度
              <input v-model.number="settings.wheelStyle.pointerShadowLevel" type="range" min="0" max="100" class="w-full" />
              <span class="text-xs font-bold text-slate-400">{{ settings.wheelStyle.pointerShadowLevel ?? 68 }} %｜讓指針更有立體壓住輪盤的感覺</span>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              指針上蓋顏色
              <input v-model="settings.wheelStyle.pointerTopColor" type="color" class="h-10 rounded-2xl border border-slate-200 bg-white px-2" />
              <span class="text-xs font-bold text-slate-400">控制指針上方圓頭 / 底座顏色，右側預覽會即時同步</span>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              指針箭頭顏色
              <input v-model="settings.wheelStyle.pointerArrowColor" type="color" class="h-10 rounded-2xl border border-slate-200 bg-white px-2" />
              <span class="text-xs font-bold text-slate-400">控制紅色三角指針本體顏色</span>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              指針燈珠顏色
              <input v-model="settings.wheelStyle.pointerDotColor" type="color" class="h-10 rounded-2xl border border-slate-200 bg-white px-2" />
              <span class="text-xs font-bold text-slate-400">控制指針上方圓形燈珠顏色</span>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              獎項文字大小
              <input v-model.number="settings.wheelStyle.prizeTextSize" type="range" min="8" max="26" class="w-full" />
              <span class="text-xs font-bold text-slate-400">{{ settings.wheelStyle.prizeTextSize }} px｜建議 10～16</span>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              獎項圖示大小
              <input v-model.number="settings.wheelStyle.prizeIconSize" type="range" min="16" max="76" class="w-full" />
              <span class="text-xs font-bold text-slate-400">{{ settings.wheelStyle.prizeIconSize }} px｜建議 24～54</span>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              獎項離中心距離
              <input v-model.number="settings.wheelStyle.prizeLabelRadius" type="range" min="36" max="94" class="w-full" />
              <span class="text-xs font-bold text-slate-400">{{ settings.wheelStyle.prizeLabelRadius }} %｜高級版建議 72～80，獎項多時比較清楚</span>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              獎項文字顏色
              <input v-model="settings.wheelStyle.prizeTextColor" type="color" class="h-10 rounded-2xl border border-slate-200 bg-white px-2" />
              <span class="text-xs font-bold text-slate-400">控制輪盤扇形上的獎項名稱顏色</span>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              獎項文字描邊
              <input v-model="settings.wheelStyle.prizeTextStrokeColor" type="color" class="h-10 rounded-2xl border border-slate-200 bg-white px-2" />
              <span class="text-xs font-bold text-slate-400">讓白色 / 淺色扇形上文字更清楚</span>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              獎項文字底霧
              <input v-model.number="settings.wheelStyle.prizeBadgeBgOpacity" type="range" min="0" max="55" class="w-full" />
              <span class="text-xs font-bold text-slate-400">{{ settings.wheelStyle.prizeBadgeBgOpacity ?? 16 }} %｜獎項多時建議 12～28</span>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              扇面高級光澤
              <input v-model.number="settings.wheelStyle.sliceGlossLevel" type="range" min="0" max="100" class="w-full" />
              <span class="text-xs font-bold text-slate-400">{{ settings.wheelStyle.sliceGlossLevel ?? 48 }} %｜增加輪盤表面高級反光</span>
            </label>
          </div>

          <div class="mt-5 grid gap-3 md:grid-cols-4">
            <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              顯示外圈燈泡
              <input v-model="settings.wheelStyle.showRimLights" type="checkbox" class="h-5 w-5 shrink-0" />
            </label>
            <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              顯示獎項圖示
              <input v-model="settings.wheelStyle.showPrizeIcon" type="checkbox" class="h-5 w-5 shrink-0" />
            </label>
            <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              顯示獎項名稱
              <input v-model="settings.wheelStyle.showPrizeName" type="checkbox" class="h-5 w-5 shrink-0" />
            </label>
            <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              顯示分隔線
              <input v-model="settings.wheelStyle.showSliceBorder" type="checkbox" class="h-5 w-5 shrink-0" />
            </label>
          </div>
        </section>

        <section v-show="activeCategory === 'display'" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-orange-500">展示區塊</p>
          <h2 class="mt-2 text-2xl font-black text-slate-950">玩家頁展示區塊</h2>
          <p class="mt-2 text-sm font-bold text-slate-500">控制玩家頁要不要顯示剩餘次數、抽獎紀錄、獎品展示等區塊。</p>

          <div class="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              <span>
                <span class="block">顯示剩餘次數</span>
                <span class="mt-1 block text-xs font-bold text-slate-400">顯示目前可轉盤次數。</span>
              </span>
              <input v-model="settings.display.showRemainingChance" type="checkbox" class="h-5 w-5 shrink-0" />
            </label>

            <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              <span>
                <span class="block">顯示抽獎紀錄</span>
                <span class="mt-1 block text-xs font-bold text-slate-400">玩家頁下方顯示我的抽獎紀錄。</span>
              </span>
              <input v-model="settings.display.showHistory" type="checkbox" class="h-5 w-5 shrink-0" />
            </label>

            <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              <span>
                <span class="block">顯示獎品展示</span>
                <span class="mt-1 block text-xs font-bold text-slate-400">顯示獎品展示橫向區塊。</span>
              </span>
              <input v-model="settings.display.showPrizeShelf" type="checkbox" class="h-5 w-5 shrink-0" />
            </label>

            <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              <span>
                <span class="block">顯示品牌卡片</span>
                <span class="mt-1 block text-xs font-bold text-slate-400">玩家頁上方品牌 Logo / 活動名稱。</span>
              </span>
              <input v-model="settings.display.showBrandCard" type="checkbox" class="h-5 w-5 shrink-0" />
            </label>

            <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              <span>
                <span class="block">顯示活動狀態</span>
                <span class="mt-1 block text-xs font-bold text-slate-400">顯示活動進行中、活動提示。</span>
              </span>
              <input v-model="settings.display.showStatusCard" type="checkbox" class="h-5 w-5 shrink-0" />
            </label>

            <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              <span>
                <span class="block">顯示除錯資訊</span>
                <span class="mt-1 block text-xs font-bold text-slate-400">只建議測試時開啟，正式頁請關閉。</span>
              </span>
              <input v-model="settings.display.showDebugInfo" type="checkbox" class="h-5 w-5 shrink-0" />
            </label>
          </div>
        </section>

        <section v-show="activeCategory === 'sound'" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-orange-500">音效特效</p>
          <h2 class="mt-2 text-2xl font-black text-slate-950">音效與動畫效果</h2>
          <p class="mt-2 text-sm font-bold text-slate-500">這裡只管理聲音、跑燈、指針抖動、結果特效，不再混到展示開關。</p>

          <div class="mt-5 grid gap-3 md:grid-cols-2">
            <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              開啟遊戲音效
              <input v-model="settings.display.enableSound" type="checkbox" class="h-5 w-5 shrink-0" />
            </label>
            <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              轉盤卡點聲
              <input v-model="settings.effects.enableTickSound" type="checkbox" class="h-5 w-5 shrink-0" />
            </label>
            <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              結果音效
              <input v-model="settings.effects.enableResultSound" type="checkbox" class="h-5 w-5 shrink-0" />
            </label>
            <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              指針微震動
              <input v-model="settings.effects.enablePointerShake" type="checkbox" class="h-5 w-5 shrink-0" />
            </label>
            <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              外圈光暈
              <input v-model="settings.effects.enableLightGlow" type="checkbox" class="h-5 w-5 shrink-0" />
            </label>
            <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              中獎彩帶
              <input v-model="settings.effects.enableConfetti" type="checkbox" class="h-5 w-5 shrink-0" />
            </label>
          </div>
        </section>

        <section v-show="activeCategory === 'rules'" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-orange-500">規則說明</p>
          <h2 class="mt-2 text-2xl font-black text-slate-950">活動規則與獎品說明</h2>
          <p class="mt-2 text-sm font-bold text-slate-500">這裡只編輯玩家會看到的規則文字與獎品說明。</p>

          <div class="mt-5 grid gap-4">
            <div class="grid gap-3 md:grid-cols-2">
              <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
                顯示活動規則
                <input v-model="settings.display.showRules" type="checkbox" class="h-5 w-5 shrink-0" />
              </label>
              <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
                顯示獎品說明
                <input v-model="settings.display.showPrizeInfo" type="checkbox" class="h-5 w-5 shrink-0" />
              </label>
            </div>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              活動規則標題
              <input v-model="settings.content.rulesTitle" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              活動規則內容
              <textarea v-model="settings.content.rulesText" rows="5" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"></textarea>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              獎品說明標題
              <input v-model="settings.content.prizeInfoTitle" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              獎品說明內容
              <textarea v-model="settings.content.prizeInfoText" rows="5" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"></textarea>
            </label>
          </div>
        </section>

        <section v-show="activeCategory === 'serial'" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-orange-500">序號抽獎</p>
          <h2 class="mt-2 text-2xl font-black text-slate-950">序號輸入與驗證文字</h2>
          <p class="mt-2 text-sm font-bold text-slate-500">讓商家可以調整玩家輸入序號時看到的提示文字。</p>

          <div class="mt-5 grid gap-4 md:grid-cols-2">
            <label class="grid gap-2 text-sm font-black text-slate-700">
              序號區標題
              <input v-model="settings.serialTitle" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
            </label>
            <label class="grid gap-2 text-sm font-black text-slate-700">
              驗證按鈕文字
              <input v-model="settings.verifyButtonText" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
            </label>
            <label class="grid gap-2 text-sm font-black text-slate-700 md:col-span-2">
              序號提示文字
              <textarea v-model="settings.serialHint" rows="4" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"></textarea>
            </label>
          </div>
        </section>

        <section v-show="activeCategory === 'result'" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-orange-500">結果彈窗</p>
          <h2 class="mt-2 text-2xl font-black text-slate-950">中獎結果與按鈕文字</h2>
          <p class="mt-2 text-sm font-bold text-slate-500">整理玩家抽完輪盤後會看到的主要文字。</p>

          <div class="mt-5 grid gap-4 md:grid-cols-2">
            <label class="grid gap-2 text-sm font-black text-slate-700">
              結果標題
              <input v-model="settings.resultTitle" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
            </label>
            <label class="grid gap-2 text-sm font-black text-slate-700">
              開始轉盤按鈕
              <input v-model="settings.playButtonText" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
            </label>
          </div>
        </section>

        <section v-show="activeCategory === 'frontend'" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-orange-500">前台設定</p>
          <h2 class="mt-2 text-2xl font-black text-slate-950">玩家網址與預覽操作</h2>
          <p class="mt-2 text-sm font-bold text-slate-500">{{ isPlatformTemplateMode ? '這裡協助平台管理員複製模板預覽網址、開啟模板預覽或下載目前模板草稿。' : '這裡協助商家複製正式玩家網址、開啟玩家頁或下載目前設定。' }}</p>

          <div class="mt-5 rounded-3xl border border-orange-100 bg-orange-50 p-5">
            <p class="text-xs font-black text-orange-500">{{ isPlatformTemplateMode ? '模板預覽網址' : '正式玩家網址' }}</p>
            <p class="mt-2 break-all font-mono text-sm font-black leading-7 text-slate-800">{{ playerUrl }}</p>
            <div class="mt-4 flex flex-wrap gap-3">
              <button type="button" class="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white" @click="openPlayer">{{ isPlatformTemplateMode ? '開啟模板預覽' : '開啟玩家頁' }}</button>
              <button type="button" class="rounded-2xl border border-orange-200 bg-white px-5 py-3 text-sm font-black text-orange-700" @click="copyText(playerUrl, isPlatformTemplateMode ? '已複製輪盤模板預覽網址' : '已複製輪盤玩家網址')">複製網址</button>
              <button type="button" class="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600" @click="downloadJson">下載設定 JSON</button>
            </div>
          </div>
        </section>

        <section v-show="activeCategory === 'prizes'" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div class="mb-5 flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.2em] text-orange-500">Prize Wheel</p>
              <h2 class="mt-2 text-2xl font-black text-slate-950">輪盤獎項</h2>
              <p class="mt-2 text-sm font-bold text-slate-500">可設定獎項名稱、emoji、圖片網址、連結、中獎百分比與色塊；百分比總和建議維持 100%，圖片會自動縮放成適合輪盤的大小。</p>
            </div>
            <button type="button" class="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white" @click="addPrize">
              新增獎項
            </button>
          </div>

          <div class="mb-4 rounded-3xl border p-4 shadow-sm" :class="prizePercentSummary.toneClass">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="min-w-0">
                <p class="text-[11px] font-black uppercase tracking-[0.18em] opacity-70">Prize Percent Guard｜第 74401～74800 批</p>
                <h3 class="mt-1 text-lg font-black">獎項百分比總和：{{ prizePercentSummary.total }}%</h3>
                <p class="mt-1 text-xs font-bold leading-5 opacity-80">{{ prizePercentSummary.message }}</p>
              </div>
              <span class="rounded-full px-4 py-2 text-xs font-black" :class="prizePercentSummary.badgeClass">
                {{ prizePercentSummary.badge }}
              </span>
            </div>

            <div class="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" class="rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white" @click="averagePrizePercent">
                平均分配 100%
              </button>
              <button type="button" class="rounded-2xl border border-current bg-white/70 px-4 py-2.5 text-xs font-black" @click="normalizePrizePercentTo100">
                依比例校正 100%
              </button>
              <button type="button" class="rounded-2xl border border-current bg-white/70 px-4 py-2.5 text-xs font-black" @click="clearPrizePercent">
                全部清為 0%
              </button>
              <button type="button" class="rounded-2xl border border-current bg-white/70 px-4 py-2.5 text-xs font-black" @click="prizePercentSimulatorExpanded = !prizePercentSimulatorExpanded">
                {{ prizePercentSimulatorExpanded ? '收合試算器' : '展開機率試算器' }}
              </button>
              <p class="text-xs font-black opacity-65">
                用原本 weight 欄位儲存；本批把上方區塊縮短，避免獎項列表被擠到太下面。
              </p>
            </div>

            <div v-show="prizePercentSimulatorExpanded" class="mt-4 rounded-3xl border border-current/20 bg-white/65 p-4">
              <div class="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p class="text-xs font-black uppercase tracking-[0.18em] opacity-60">Percent Simulator</p>
                  <h4 class="mt-1 text-base font-black">機率試算器</h4>
                  <p class="mt-1 text-xs font-bold leading-5 opacity-70">可模擬抽獎結果，確認目前百分比配置是否接近預期。正式後端抽獎核心未在本批修改。</p>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <label class="flex items-center gap-2 text-xs font-black opacity-80">
                    模擬次數
                    <input v-model.number="prizePercentSimulationDraws" type="number" min="100" max="10000" step="100" class="h-10 w-28 rounded-2xl border border-current/20 bg-white px-3 text-sm font-black" />
                  </label>
                  <button type="button" class="rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white" @click="runPrizePercentSimulation">
                    開始試算
                  </button>
                </div>
              </div>

              <div class="mt-4 max-h-[320px] overflow-auto rounded-2xl border border-current/15 bg-white">
                <div class="sticky top-0 z-10 grid grid-cols-[1.3fr_0.7fr_0.8fr_0.8fr] gap-2 bg-slate-950 px-4 py-3 text-xs font-black text-white">
                  <span>獎項</span>
                  <span>設定%</span>
                  <span>理論命中</span>
                  <span>模擬命中</span>
                </div>
                <div v-for="row in prizePercentVisibleRows" :key="row.id" class="grid grid-cols-[1.3fr_0.7fr_0.8fr_0.8fr] gap-2 border-t border-slate-100 px-4 py-3 text-xs font-black text-slate-700">
                  <span class="truncate">{{ row.name }}</span>
                  <span>{{ row.percent }}%</span>
                  <span>{{ row.expectedRate }}%</span>
                  <span>
                    {{ (prizePercentSimulationResults.find((item) => item.id === row.id)?.actualRate ?? '-') }}<template v-if="prizePercentSimulationResults.find((item) => item.id === row.id)">%</template>
                  </span>
                </div>
                <button v-if="prizePercentHiddenRowsCount" type="button" class="w-full border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs font-black text-slate-500" @click="prizePercentSimulatorExpanded = true">
                  還有 {{ prizePercentHiddenRowsCount }} 個獎項，展開查看完整試算
                </button>
              </div>
              <p class="mt-3 text-xs font-black opacity-60">
                {{ prizePercentSimulationAt ? `最近試算時間：${prizePercentSimulationAt}` : '尚未執行試算。' }}
              </p>
            </div>
          </div>

          <div class="grid gap-4">
            <article v-for="(prize, index) in settings.prizes" :key="prize.id" class="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <div class="grid gap-4 2xl:grid-cols-[72px_minmax(120px,0.75fr)_minmax(220px,1.3fr)_minmax(240px,1.45fr)_96px_118px_76px] 2xl:items-end">
                <div class="grid gap-2 text-xs font-black text-slate-500">
                  預覽
                  <div class="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white text-2xl shadow-inner">
                    <img v-if="prize.imageUrl" :src="prize.imageUrl" alt="獎項圖片" class="h-full w-full object-contain p-1" />
                    <span v-else>{{ prize.icon || '🎁' }}</span>
                  </div>
                </div>

                <label class="grid min-w-0 gap-2 text-xs font-black text-slate-500">
                  圖示 / emoji
                  <input v-model="prize.icon" class="h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-center text-xl" />
                </label>

                <label class="grid min-w-0 gap-2 text-xs font-black text-slate-500">
                  獎項名稱
                  <input v-model="prize.name" class="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold" />
                </label>

                <label class="grid min-w-0 gap-2 text-xs font-black text-slate-500">
                  圖片網址
                  <input v-model="prize.imageUrl" placeholder="https://...png / jpg / webp" class="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm" />
                </label>

                <label class="grid min-w-0 gap-2 text-xs font-black text-slate-500">
                  中獎百分比
                  <div class="relative">
                    <input :value="Number(prize.weight || 0)" type="number" min="0" max="100" step="1" class="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm font-black" @input="updatePrizePercent(prize, $event.target.value)" />
                    <span class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">%</span>
                  </div>
                </label>

                <label class="grid min-w-0 gap-2 text-xs font-black text-slate-500">
                  顏色
                  <input v-model="prize.color" type="color" class="h-12 w-full rounded-2xl border border-slate-200 bg-white p-1" />
                </label>

                <button type="button" class="h-12 rounded-2xl border border-rose-200 bg-rose-50 px-3 text-xs font-black text-rose-600 disabled:opacity-40" :disabled="settings.prizes.length <= 2" @click="removePrize(index)">
                  刪除
                </button>
              </div>

              <label class="mt-3 grid gap-2 text-xs font-black text-slate-500">
                獎項連結網址，可選
                <input v-model="prize.linkUrl" placeholder="https:// 商品頁 / 兌換說明 / LINE 連結" class="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm" />
              </label>
            </article>
          </div>
        </section>
      </div>

      <aside class="xl:sticky xl:top-24 xl:self-start">
        <section class="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 shadow-sm">
          <div class="p-5 text-white">
            <p class="text-xs font-black uppercase tracking-[0.22em] text-orange-200">Live Player Preview</p>
            <h2 class="mt-2 text-xl font-black">右側正式玩家頁預覽</h2>
            <p class="mt-2 text-xs font-bold leading-5 text-white/60">
              {{ isPlatformTemplateMode ? '平台模板模式：右側只讀平台模板草稿，不會連到商家活動資料，也不會寫入商家資料庫。' : '這裡直接載入 WheelGameView 正式玩家頁。修改左側設定後會平滑同步到右側預覽；按儲存設定後才會正式寫入資料庫。' }}
            </p>
          </div>

          <div class="px-4 pb-5">
            <div class="mb-3 grid grid-cols-4 gap-2">
              <button
                v-for="option in previewFocusOptions"
                :key="option.key"
                type="button"
                class="rounded-2xl px-3 py-2 text-xs font-black transition"
                :class="previewFocusMode === option.key ? 'bg-orange-300 text-slate-950' : 'border border-white/20 text-white hover:bg-white/10'"
                @click="setPreviewFocus(option.key)"
              >
                {{ option.label }}
              </button>
            </div>

            <div class="mb-3 rounded-2xl border border-white/10 bg-white/5 p-2">
              <div class="mb-2 flex items-center justify-between gap-2 px-1">
                <p class="text-[11px] font-black uppercase tracking-[0.18em] text-white/50">Preview Device｜第 62801～63200 批</p>
                <p class="text-[11px] font-bold text-white/40">{{ previewDeviceProfile.desc }}</p>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="device in previewDeviceOptions"
                  :key="device.key"
                  type="button"
                  class="rounded-2xl px-3 py-2 text-xs font-black transition"
                  :class="previewDeviceMode === device.key ? 'bg-white text-slate-950' : 'border border-white/15 text-white/70 hover:bg-white/10'"
                  @click="setPreviewDeviceMode(device.key)"
                >
                  {{ device.label }}
                </button>
              </div>
            </div>

            <div class="mb-3 rounded-2xl border border-white/10 bg-white/5 p-2">
              <div class="mb-2 flex items-center justify-between gap-2 px-1">
                <p class="text-[11px] font-black uppercase tracking-[0.18em] text-white/50">Preview Zoom｜第 63201～63600 批</p>
                <p class="text-[11px] font-bold text-white/40">{{ previewZoomProfile.desc }}</p>
              </div>
              <div class="grid grid-cols-4 gap-2">
                <button
                  v-for="zoom in previewZoomOptions"
                  :key="zoom.key"
                  type="button"
                  class="rounded-2xl px-3 py-2 text-xs font-black transition"
                  :class="previewZoomMode === zoom.key ? 'bg-orange-300 text-slate-950' : 'border border-white/15 text-white/70 hover:bg-white/10'"
                  @click="setPreviewZoomMode(zoom.key)"
                >
                  {{ zoom.label }}
                </button>
              </div>
            </div>

            <div class="mb-3 rounded-2xl border p-3" :class="previewSaveGuidance.toneClass">
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="text-[11px] font-black uppercase tracking-[0.18em] opacity-70">{{ previewSaveGuidance.eyebrow }}</p>
                  <h3 class="mt-1 text-sm font-black">{{ previewSaveGuidance.title }}</h3>
                  <p class="mt-1 text-[11px] font-bold leading-5 opacity-90">{{ previewSaveGuidance.summary }}</p>
                </div>
                <span class="shrink-0 rounded-full px-3 py-1 text-[11px] font-black" :class="previewSaveGuidance.badgeClass">
                  {{ previewSaveGuidance.badge }}
                </span>
              </div>

              <div class="mt-3 grid gap-2 sm:grid-cols-2">
                <div
                  v-for="item in previewSaveGuidanceItems"
                  :key="item.label"
                  class="rounded-2xl border border-white/10 bg-black/10 px-3 py-2"
                >
                  <p class="text-[10px] font-black uppercase tracking-[0.14em] opacity-60">{{ item.label }}</p>
                  <p class="mt-1 break-all text-[11px] font-black leading-5">{{ item.value }}</p>
                </div>
              </div>

              <p class="mt-3 text-[11px] font-bold leading-5 opacity-90">{{ previewSaveGuidance.officialHint }}</p>

              <div v-if="previewSaveGuidance.showPlayerActions" class="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  class="rounded-2xl bg-white px-3 py-2 text-[11px] font-black text-slate-950 transition hover:bg-white/90"
                  @click="openPlayer"
                >
                  開啟正式玩家頁
                </button>
                <button
                  type="button"
                  class="rounded-2xl border border-white/20 px-3 py-2 text-[11px] font-black transition hover:bg-white/10"
                  @click="copyText(playerUrl, '已複製正式玩家頁網址')"
                >
                  複製玩家網址
                </button>
              </div>
            </div>

            <div class="mx-auto overflow-hidden rounded-[2rem] border-[10px] border-slate-900 bg-white shadow-2xl transition-all duration-300" :style="previewFrameStyle">
              <div class="border-b border-slate-200 bg-white px-4 py-2 text-center text-[11px] font-black text-slate-400">
                {{ isPlatformTemplateMode ? '平台模板草稿 iframe 預覽' : '商家活動草稿 iframe 預覽' }}｜{{ previewDeviceProfile.label }}｜{{ previewZoomProfile.label }}
              </div>
              <div class="border-b border-slate-100 px-4 py-2 text-[11px] font-black" :class="previewSmoothSyncToneClass">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="min-w-0 text-left">
                    <p class="uppercase tracking-[0.16em] opacity-70">Smooth Preview Guard｜第 66801～67200 批</p>
                    <p class="mt-1 truncate">
                      {{ previewSmoothSyncStatus }}<span v-if="previewSmoothSyncAt">｜{{ previewSmoothSyncAt }}</span><span v-if="previewSmoothSyncCount">｜平滑更新 {{ previewSmoothSyncCount }} 次</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    class="rounded-full border border-current/20 bg-white/70 px-3 py-1 text-[11px] font-black transition hover:bg-white"
                    @click="manualRefreshPreview"
                  >
                    手動重整預覽
                  </button>
                </div>
              </div>

              <iframe
                ref="previewIframeRef"
                :key="`preview-${previewKey}`"
                :src="safePreviewUrl"
                title="輪盤正式玩家頁即時預覽"
                class="w-full bg-white"
                :class="previewIframeHeightClass"
                :style="previewIframeScaleStyle"
                loading="eager"
                @load="handlePreviewIframeLoad"
              ></iframe>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                class="rounded-2xl bg-white px-4 py-3 text-xs font-black text-slate-950"
                @click="guardedSaveSettings"
              >
                儲存設定
              </button>
              <button
                type="button"
                class="rounded-2xl border border-white/20 px-4 py-3 text-xs font-black text-white"
                @click="openPlayer"
              >
                開啟正式玩家頁
              </button>
            </div>

            <div class="mt-3 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-xs font-bold leading-6 text-amber-100">
              提示：預覽會自動跳到目前分類最相關的位置；按「輪盤」可以直接看輪盤本體。需要檢查手機長畫面時，可切換「長手機」預覽。
            </div>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>
