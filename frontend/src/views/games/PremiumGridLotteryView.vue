<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminGameSettings } from '../../composables/useAdminGameSettings'
import { useDrawHistory } from '../../composables/useDrawHistory'

const route = useRoute()
const router = useRouter()

const {
  gameSettings
} = useAdminGameSettings()

const {
  addHistory
} = useDrawHistory()

const isDrawing = ref(false)
const activeIndex = ref(-1)
const resultPrize = ref(null)
const showResultModal = ref(false)
const drawLogs = ref([])
const showDesignPanel = ref(false)
const storageMessage = ref('')
const lastSyncMessage = ref('')
const lastSyncAt = ref('')
const shareMessage = ref('')
const showShareMessage = ref(false)
const showPlayerRules = ref(false)
const showPrizeNotes = ref(false)
const showThemeTools = ref(true)
const showThemeGuide = ref(true)
const logoImageError = ref(false)
const bannerImageError = ref(false)
const brandImportFileInput = ref(null)
const themeImportFileInput = ref(null)

const PREMIUM_GRID_STORAGE_KEY = 'v22_premium_grid_lottery_state'
const PREMIUM_GRID_SYNC_EVENT = 'premium-grid-state-updated'
const PREMIUM_GRID_SYNC_PING_KEY = 'premium-grid-sync-ping'
const isApplyingPremiumGridRemoteState = ref(false)
const isSavingPremiumGridState = ref(false)

const isAdminMode = computed(() => {
  return route.query.mode === 'admin'
})

const urlGameId = computed(() => {
  return String(route.query.gameId || '')
})

const safeJsonParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch (error) {
    console.error('解析精緻九宮格保存資料失敗：', error)
    return fallback
  }
}

const cloneByJson = (value) => {
  return JSON.parse(JSON.stringify(value))
}

const campaign = reactive({
  brandName: 'Multi Game Platform',
  pageTitle: '超級九宮格',
  mainTitle: '豪華九宮格',
  subTitle: '每日登入抽好禮',
  heroTagline: '無敵大幸運',
  chanceText: '還有 97 次抽獎機會',
  buttonText: '分享',
  shareHint: '分享給好友可獲得額外抽獎次數',
  noticeText: '本活動為原創版型，可自由替換名稱、圖片與獎項內容。',
  topImageUrl: '',
  backgroundImageUrl: '',
  logoText: 'P',
  logoImageUrl: '',
  bannerImageUrl: '',
  bannerLayout: 'standard',
  lastAppliedPreset: '',
  lastAppliedThemePalette: '',
  previousThemeStart: '',
  previousThemeMiddle: '',
  previousThemeEnd: '',
  previousThemeLabel: '',
  lastThemeAction: '',
  brandTagline: '打造專屬互動抽獎體驗',
  websiteUrl: '',
  websiteText: '官方網站',
  themeStart: '#ffb237',
  themeMiddle: '#ff7a18',
  themeEnd: '#ee3f24'
})

const player = reactive({
  chances: 97,
  sharedCount: 0
})

const playerRuleItems = [
  '每次抽獎會消耗 1 次抽獎機會。',
  '分享活動可增加 1 次抽獎機會。',
  '中獎結果會自動寫入我的遊戲紀錄。',
  '獎項數量有限，抽完為止。',
  '實際兌獎方式以主辦單位公告為準。'
]

const prizeNoteItems = [
  '獎品圖片與名稱可由後台或管理模式調整。',
  '獎品會依照權重與庫存進行抽選。',
  '庫存為 0 的獎項不會再被抽中。',
  '玩家可在我的遊戲紀錄查看已抽中的獎項。'
]

const bannerLayoutOptions = [
  {
    label: '標準版',
    value: 'standard',
    description: 'LOGO、品牌資訊與網站按鈕左右排列，適合一般活動頁。'
  },
  {
    label: '置中版',
    value: 'center',
    description: 'LOGO、品牌名稱與標語置中，適合形象感較強的活動。'
  },
  {
    label: '精簡版',
    value: 'compact',
    description: '只保留必要資訊，讓玩家更快進入抽獎。'
  }
]

const brandPresetOptions = [
  {
    id: 'orange-gold',
    name: '活力橘金版',
    description: '適合抽獎、優惠券、會員促銷活動。',
    icon: '🧡',
    brandName: 'Lucky Brand Club',
    pageTitle: '品牌會員抽獎',
    brandTagline: '會員限定好禮，天天都有驚喜',
    logoText: 'L',
    bannerLayout: 'standard',
    themeStart: '#ffb237',
    themeMiddle: '#ff7a18',
    themeEnd: '#ee3f24'
  },
  {
    id: 'dark-premium',
    name: '質感深色版',
    description: '適合高級會員、VIP、精品感活動。',
    icon: '🖤',
    brandName: 'Premium Club',
    pageTitle: 'VIP 專屬抽獎',
    brandTagline: '高質感會員活動，限定好禮即刻開抽',
    logoText: 'V',
    bannerLayout: 'center',
    themeStart: '#334155',
    themeMiddle: '#1e293b',
    themeEnd: '#020617'
  },
  {
    id: 'fresh-blue',
    name: '清新藍綠版',
    description: '適合飲品、美容、生活風格活動。',
    icon: '💙',
    brandName: 'Fresh Life',
    pageTitle: '清新好禮抽抽樂',
    brandTagline: '輕鬆參加活動，把好禮帶回家',
    logoText: 'F',
    bannerLayout: 'compact',
    themeStart: '#67e8f9',
    themeMiddle: '#14b8a6',
    themeEnd: '#0f766e'
  }
]

const themePaletteOptions = [
  {
    id: 'orange-gold',
    name: '橘金活動色',
    description: '適合抽獎、優惠、促銷活動',
    icon: '🧡',
    themeStart: '#ffb237',
    themeMiddle: '#ff7a18',
    themeEnd: '#ee3f24'
  },
  {
    id: 'vip-dark',
    name: 'VIP 深色質感',
    description: '適合高級會員、精品感活動',
    icon: '🖤',
    themeStart: '#334155',
    themeMiddle: '#1e293b',
    themeEnd: '#020617'
  },
  {
    id: 'fresh-blue-green',
    name: '藍綠清新色',
    description: '適合飲品、美容、生活風格',
    icon: '💙',
    themeStart: '#67e8f9',
    themeMiddle: '#14b8a6',
    themeEnd: '#0f766e'
  },
  {
    id: 'pink-purple',
    name: '紫粉甜美色',
    description: '適合可愛、女性向、節慶活動',
    icon: '💜',
    themeStart: '#f9a8d4',
    themeMiddle: '#c084fc',
    themeEnd: '#7c3aed'
  }
]

const colorInputItems = [
  {
    key: 'themeStart',
    label: '上方背景色',
    description: '控制活動頁上半部主色'
  },
  {
    key: 'themeMiddle',
    label: '中段背景色',
    description: '控制活動頁中段過渡色'
  },
  {
    key: 'themeEnd',
    label: '底部背景色',
    description: '控制活動頁底部主色'
  }
]

const themeToolGuideItems = [
  {
    title: '套用色系',
    description: '把目前輸入的三段色碼套用到玩家頁背景。'
  },
  {
    title: '還原預設',
    description: '回到系統預設橘金色，還原前會先備份目前色系。'
  },
  {
    title: '回復上一組',
    description: '回復上一次套用前備份的色系。'
  },
  {
    title: '複製 / 下載 / 匯入',
    description: '可把主色系保存成文字或 JSON，之後套用到其他活動。'
  }
]

const copyThemeToolGuide = async () => {
  const payload = themeToolGuideItems
    .map((item, index) => `${index + 1}. ${item.title}：${item.description}`)
    .join('\n')

  try {
    await navigator.clipboard.writeText(payload)
    showStorageMessage('已複製主色系操作說明。')
  } catch (error) {
    console.error('複製主色系操作說明失敗：', error)
    window.prompt('瀏覽器不支援自動複製，請手動複製：', payload)
    showStorageMessage('已開啟手動複製視窗。')
  }
}

const normalizeColorValue = (value, fallback) => {
  const text = String(value || '').trim()
  const withoutHash = text.startsWith('#') ? text.slice(1) : text

  if (/^[0-9a-fA-F]{6}$/.test(withoutHash)) {
    return `#${withoutHash.toUpperCase()}`
  }

  return fallback
}

const setLastThemeAction = (message) => {
  campaign.lastThemeAction = `${message}｜${new Date().toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })}`
}

const clearLastThemeAction = () => {
  if (!campaign.lastThemeAction) {
    showStorageMessage('目前沒有主色系操作紀錄。')
    return
  }

  const confirmed = window.confirm('確定要清除主色系最後操作紀錄嗎？這不會影響目前色系。')

  if (!confirmed) return

  campaign.lastThemeAction = ''
  savePremiumGridState()
  showStorageMessage('已清除主色系最後操作紀錄。')
}

const backupCurrentThemeColors = (label = '上一組色系') => {
  campaign.previousThemeStart = campaign.themeStart
  campaign.previousThemeMiddle = campaign.themeMiddle
  campaign.previousThemeEnd = campaign.themeEnd
  campaign.previousThemeLabel = label
}

const hasPreviousThemeColors = computed(() => {
  return Boolean(
    campaign.previousThemeStart &&
    campaign.previousThemeMiddle &&
    campaign.previousThemeEnd
  )
})

const restorePreviousThemeColors = () => {
  if (!hasPreviousThemeColors.value) {
    window.alert('目前沒有可回復的上一組色系。')
    return
  }

  const confirmed = window.confirm(`確定要回復「${campaign.previousThemeLabel || '上一組色系'}」嗎？`)

  if (!confirmed) return

  const currentTheme = {
    start: campaign.themeStart,
    middle: campaign.themeMiddle,
    end: campaign.themeEnd,
    label: campaign.lastAppliedThemePalette || '回復前色系'
  }

  campaign.themeStart = campaign.previousThemeStart
  campaign.themeMiddle = campaign.previousThemeMiddle
  campaign.themeEnd = campaign.previousThemeEnd
  campaign.lastAppliedThemePalette = campaign.previousThemeLabel || '已回復上一組色系'

  campaign.previousThemeStart = currentTheme.start
  campaign.previousThemeMiddle = currentTheme.middle
  campaign.previousThemeEnd = currentTheme.end
  campaign.previousThemeLabel = currentTheme.label

  setLastThemeAction('回復上一組主色系')
  savePremiumGridState()
  showStorageMessage('已回復上一組主色系。')
}

const getThemeColorPayload = () => {
  return {
    type: 'premium_grid_theme_colors',
    version: premiumVersionInfo.value.version,
    exportedAt: new Date().toISOString(),
    themeStart: campaign.themeStart,
    themeMiddle: campaign.themeMiddle,
    themeEnd: campaign.themeEnd,
    lastAppliedThemePalette: campaign.lastAppliedThemePalette || '',
    previousThemeLabel: campaign.previousThemeLabel || '',
    lastThemeAction: campaign.lastThemeAction || '',
    themeHasLightWarning: hasLightThemeWarning.value,
    themePanelState: getThemePanelStatePayload()
  }
}

const copyThemeColorsJson = async () => {
  const payload = JSON.stringify(getThemeColorPayload(), null, 2)

  try {
    await navigator.clipboard.writeText(payload)
    showStorageMessage('已複製目前主色系 JSON。')
  } catch (error) {
    console.error('複製主色系 JSON 失敗：', error)
    window.prompt('瀏覽器不支援自動複製，請手動複製：', payload)
    showStorageMessage('已開啟手動複製視窗。')
  }
}

const copyThemeColorsText = async () => {
  const payload = [
    `上方背景色：${campaign.themeStart}`,
    `中段背景色：${campaign.themeMiddle}`,
    `底部背景色：${campaign.themeEnd}`,
    `最近色系：${campaign.lastAppliedThemePalette || '未記錄'}`
  ].join('\n')

  try {
    await navigator.clipboard.writeText(payload)
    setLastThemeAction('複製三段主色系')
    savePremiumGridState()
    showStorageMessage(`已複製目前三段主色系：${campaign.themeStart} / ${campaign.themeMiddle} / ${campaign.themeEnd}`)
  } catch (error) {
    console.error('複製主色系色碼失敗：', error)
    window.prompt('瀏覽器不支援自動複製，請手動複製：', payload)
    showStorageMessage('已開啟手動複製視窗。')
  }
}

const copySingleThemeColor = async (item) => {
  const payload = `${item.label}背景色：${item.value}`

  try {
    await navigator.clipboard.writeText(item.value)
    setLastThemeAction(`複製${item.label}背景色`)
    savePremiumGridState()
    showStorageMessage(`已複製 ${item.label}背景色 ${item.value}`)
  } catch (error) {
    console.error('複製單一色碼失敗：', error)
    window.prompt('瀏覽器不支援自動複製，請手動複製：', payload)
    showStorageMessage('已開啟手動複製視窗。')
  }
}

const copyThemeFileName = async () => {
  const fileName = getThemeExportFileName()

  try {
    await navigator.clipboard.writeText(fileName)
    setLastThemeAction('複製主色系檔名')
    savePremiumGridState()
    showStorageMessage('已複製主色系檔名建議。')
  } catch (error) {
    console.error('複製主色系檔名失敗：', error)
    window.prompt('瀏覽器不支援自動複製，請手動複製：', fileName)
    showStorageMessage('已開啟手動複製視窗。')
  }
}

const validateThemeColorPayload = (payload) => {
  if (!payload || payload.type !== 'premium_grid_theme_colors') {
    return {
      ok: false,
      message: '這不是正確的主色系 JSON。'
    }
  }

  const colors = [
    payload.themeStart,
    payload.themeMiddle,
    payload.themeEnd
  ]

  const isValid = colors.every((color) => /^#[0-9a-fA-F]{6}$/.test(String(color || '').trim()))

  if (!isValid) {
    return {
      ok: false,
      message: '主色系必須是 #RRGGBB 格式，例如 #ffb237。'
    }
  }

  return {
    ok: true,
    message: '格式正確'
  }
}

const applyThemeColorPayload = (payload) => {
  const validation = validateThemeColorPayload(payload)

  if (!validation.ok) {
    window.alert(`匯入失敗：${validation.message}`)
    return false
  }

  backupCurrentThemeColors(campaign.lastAppliedThemePalette || '匯入前色系')

  campaign.themeStart = normalizeColorValue(payload.themeStart, campaign.themeStart)
  campaign.themeMiddle = normalizeColorValue(payload.themeMiddle, campaign.themeMiddle)
  campaign.themeEnd = normalizeColorValue(payload.themeEnd, campaign.themeEnd)
  campaign.lastAppliedThemePalette = getSafeTextValue(payload.lastAppliedThemePalette, '匯入色系')

  setLastThemeAction('匯入主色系 JSON')
  savePremiumGridState()
  showStorageMessage('已匯入並套用主色系 JSON。')

  return true
}

const importThemeColorsJson = () => {
  const raw = window.prompt('請貼上主色系 JSON：')

  if (!raw) return

  const payload = safeJsonParse(raw, null)

  applyThemeColorPayload(payload)
}

const getThemeExportFileName = () => {
  const safeName = String(campaign.brandName || campaign.pageTitle || 'premium-grid-theme')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[\\/:*?"<>|]/g, '')
    .toLowerCase()

  return `${safeName || 'premium-grid-theme'}-theme-colors-${getExportTimeText()}.json`
}

const downloadThemeColorsJson = () => {
  const payload = JSON.stringify(getThemeColorPayload(), null, 2)

  downloadTextFile(
    getThemeExportFileName(),
    payload,
    'application/json;charset=utf-8'
  )

  setLastThemeAction('下載主色系 JSON 檔')
  savePremiumGridState()
  showStorageMessage('已下載目前主色系 JSON 檔。')
}

const openThemeImportFilePicker = () => {
  themeImportFileInput.value?.click()
}

const handleThemeImportFileChange = async (event) => {
  const file = event.target.files?.[0]

  if (!file) return

  if (!file.name.toLowerCase().endsWith('.json')) {
    window.alert('匯入失敗：請選擇 .json 主色系設定檔。')
    event.target.value = ''
    return
  }

  try {
    const raw = await file.text()
    const payload = safeJsonParse(raw, null)
    const success = applyThemeColorPayload(payload)

    if (success) {
      showStorageMessage(`已從檔案匯入主色系：${file.name}`)
    }
  } catch (error) {
    console.error('讀取主色系設定檔失敗：', error)
    window.alert('匯入失敗：無法讀取這個 JSON 檔案。')
  }

  event.target.value = ''
}

const applyThemePalette = (palette) => {
  if (!palette) return

  const confirmed = window.confirm(`確定要套用「${palette.name}」嗎？這會覆蓋目前的三段主色系。`)

  if (!confirmed) return

  backupCurrentThemeColors(campaign.lastAppliedThemePalette || '手動調整色系')

  campaign.themeStart = palette.themeStart
  campaign.themeMiddle = palette.themeMiddle
  campaign.themeEnd = palette.themeEnd
  campaign.lastAppliedThemePalette = palette.name

  setLastThemeAction(`套用推薦色系：${palette.name}`)
  savePremiumGridState()
  showStorageMessage(`已套用推薦色系：${palette.name}。`)
}

const toggleThemeTools = () => {
  showThemeTools.value = !showThemeTools.value
  savePremiumGridState()

  showStorageMessage(showThemeTools.value ? '已展開主色系工具。' : '已收合主色系工具。')
}

const toggleThemeGuide = () => {
  showThemeGuide.value = !showThemeGuide.value
  savePremiumGridState()

  showStorageMessage(showThemeGuide.value ? '已顯示主色系操作說明。' : '已隱藏主色系操作說明。')
}

const resetThemePanelState = () => {
  showThemeTools.value = true
  showThemeGuide.value = true

  savePremiumGridState()
  showStorageMessage('已還原主色系管理區顯示狀態。')
}

const copyThemePanelState = async () => {
  const payload = [
    '主色系管理區狀態',
    `工具狀態：${showThemeTools.value ? '展開' : '收合'}`,
    `操作說明：${showThemeGuide.value ? '顯示' : '隱藏'}`,
    `上方背景色：${campaign.themeStart}`,
    `中段背景色：${campaign.themeMiddle}`,
    `底部背景色：${campaign.themeEnd}`,
    `最近色系：${campaign.lastAppliedThemePalette || '尚未套用色系'}`,
    `可回復色系：${hasPreviousThemeColors.value ? (campaign.previousThemeLabel || '上一組色系') : '無可回復色系'}`,
    `最後操作：${campaign.lastThemeAction || '尚無操作紀錄'}`
  ].join('\n')

  try {
    await navigator.clipboard.writeText(payload)
    showStorageMessage('已複製主色系管理區狀態。')
  } catch (error) {
    console.error('複製主色系管理區狀態失敗：', error)
    window.prompt('瀏覽器不支援自動複製，請手動複製：', payload)
    showStorageMessage('已開啟手動複製視窗。')
  }
}

const getThemePanelStatePayload = () => {
  return {
    type: 'premium_grid_theme_panel_state',
    version: premiumVersionInfo.value.version,
    exportedAt: new Date().toISOString(),
    showThemeTools: showThemeTools.value,
    showThemeGuide: showThemeGuide.value,
    themeStart: campaign.themeStart,
    themeMiddle: campaign.themeMiddle,
    themeEnd: campaign.themeEnd,
    lastAppliedThemePalette: campaign.lastAppliedThemePalette || '',
    previousThemeLabel: hasPreviousThemeColors.value ? (campaign.previousThemeLabel || '上一組色系') : '',
    lastThemeAction: campaign.lastThemeAction || '',
    themeHasLightWarning: hasLightThemeWarning.value
  }
}

const getThemePanelStateFileName = () => {
  const safeName = String(campaign.brandName || campaign.pageTitle || 'premium-grid-theme-panel')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[\\/:*?"<>|]/g, '')
    .toLowerCase()

  return `${safeName || 'premium-grid-theme-panel'}-theme-panel-state-${getExportTimeText()}.json`
}

const downloadThemePanelStateJson = () => {
  const payload = JSON.stringify(getThemePanelStatePayload(), null, 2)

  downloadTextFile(
    getThemePanelStateFileName(),
    payload,
    'application/json;charset=utf-8'
  )

  showStorageMessage('已下載主色系管理區狀態 JSON。')
}

const validateManualThemeColors = () => {
  const invalidItems = colorInputItems.filter((item) => {
    const text = String(campaign[item.key] || '').trim()
    const withoutHash = text.startsWith('#') ? text.slice(1) : text

    return !/^[0-9a-fA-F]{6}$/.test(withoutHash)
  })

  if (!invalidItems.length) {
    return {
      ok: true,
      message: '格式正確'
    }
  }

  return {
    ok: false,
    message: `請檢查 ${invalidItems.map((item) => item.label).join('、')}，色碼可輸入 #RRGGBB 或 RRGGBB，例如 #ffb237 或 ffb237。`
  }
}

const isThemeColorInputValid = (key) => {
  const text = String(campaign[key] || '').trim()
  const withoutHash = text.startsWith('#') ? text.slice(1) : text

  return /^[0-9a-fA-F]{6}$/.test(withoutHash)
}

const getThemeColorInputStatus = (key) => {
  return isThemeColorInputValid(key) ? '格式正常' : '需要修正'
}

const canApplyManualThemeColors = computed(() => {
  return validateManualThemeColors().ok
})

const applyThemeColorsButtonText = computed(() => {
  return canApplyManualThemeColors.value ? '套用色系' : '先修正色碼'
})

const applyThemeColors = () => {
  const validation = validateManualThemeColors()

  if (!validation.ok) {
    window.alert(validation.message)
    return
  }

  backupCurrentThemeColors(campaign.lastAppliedThemePalette || '套用前色系')

  campaign.themeStart = normalizeColorValue(campaign.themeStart, defaultCampaignSnapshot.themeStart)
  campaign.themeMiddle = normalizeColorValue(campaign.themeMiddle, defaultCampaignSnapshot.themeMiddle)
  campaign.themeEnd = normalizeColorValue(campaign.themeEnd, defaultCampaignSnapshot.themeEnd)
  campaign.lastAppliedThemePalette = '手動調整'

  savePremiumGridState()
  setLastThemeAction('手動套用品牌主色系')
  showStorageMessage('已套用品牌主色系，色碼已自動整理為標準格式。')
}

const resetThemeColors = () => {
  const confirmed = window.confirm('確定要還原預設主色系嗎？目前色系會先備份，可用「回復上一組」還原。')

  if (!confirmed) return

  backupCurrentThemeColors(campaign.lastAppliedThemePalette || '還原前色系')

  campaign.themeStart = defaultCampaignSnapshot.themeStart
  campaign.themeMiddle = defaultCampaignSnapshot.themeMiddle
  campaign.themeEnd = defaultCampaignSnapshot.themeEnd
  campaign.lastAppliedThemePalette = ''

  savePremiumGridState()
  setLastThemeAction('還原預設主色系')
  showStorageMessage('已還原預設主色系；原本色系已備份，可用「回復上一組」。')
}

const getHexBrightness = (hexColor = '') => {
  const value = String(hexColor || '').replace('#', '')

  if (!/^[0-9a-fA-F]{6}$/.test(value)) return 0

  const red = parseInt(value.slice(0, 2), 16)
  const green = parseInt(value.slice(2, 4), 16)
  const blue = parseInt(value.slice(4, 6), 16)

  return Math.round((red * 299 + green * 587 + blue * 114) / 1000)
}

const themeColorPreviewItems = computed(() => {
  return [
    {
      label: '上方',
      value: campaign.themeStart,
      brightness: getHexBrightness(campaign.themeStart)
    },
    {
      label: '中段',
      value: campaign.themeMiddle,
      brightness: getHexBrightness(campaign.themeMiddle)
    },
    {
      label: '底部',
      value: campaign.themeEnd,
      brightness: getHexBrightness(campaign.themeEnd)
    }
  ]
})

const hasLightThemeWarning = computed(() => {
  return themeColorPreviewItems.value.some((item) => item.brightness > 225)
})

const themePreviewStyle = computed(() => {
  return {
    background: `linear-gradient(180deg, ${campaign.themeStart} 0%, ${campaign.themeMiddle} 48%, ${campaign.themeEnd} 100%)`
  }
})

const themeColorSummary = computed(() => {
  return {
    themeStart: campaign.themeStart,
    themeMiddle: campaign.themeMiddle,
    themeEnd: campaign.themeEnd,
    lastPalette: campaign.lastAppliedThemePalette || '尚未套用色系',
    previousTheme: hasPreviousThemeColors.value ? (campaign.previousThemeLabel || '上一組色系') : '無可回復色系',
    warning: hasLightThemeWarning.value ? '有亮色提醒' : '對比正常',
    lastThemeAction: campaign.lastThemeAction || '尚無操作紀錄',
    suggestedFileName: getThemeExportFileName()
  }
})

const applyBrandPreset = (preset) => {
  if (!preset) return

  const confirmed = window.confirm(`確定要套用「${preset.name}」嗎？這會覆蓋目前的品牌名稱、活動名稱、標語、文字 LOGO、橫幅模式與主色系。`)

  if (!confirmed) return

  backupCurrentThemeColors(campaign.lastAppliedThemePalette || '套用品牌預設前色系')

  campaign.brandName = preset.brandName
  campaign.pageTitle = preset.pageTitle
  campaign.brandTagline = preset.brandTagline
  campaign.logoText = preset.logoText
  campaign.bannerLayout = preset.bannerLayout
  campaign.themeStart = preset.themeStart
  campaign.themeMiddle = preset.themeMiddle
  campaign.themeEnd = preset.themeEnd
  campaign.lastAppliedPreset = preset.name
  campaign.lastAppliedThemePalette = preset.name

  logoImageError.value = false
  bannerImageError.value = false

  setLastThemeAction(`套用品牌預設色系：${preset.name}`)
  savePremiumGridState()
  showStorageMessage(`已套用品牌預設：${preset.name}。`)
}

const applyBannerLayout = (layout) => {
  campaign.bannerLayout = layout
  savePremiumGridState()
  showStorageMessage(`已切換品牌橫幅：${getBannerLayoutLabel(layout)}。`)
}

const getBannerLayoutLabel = (layout = campaign.bannerLayout) => {
  const target = bannerLayoutOptions.find((item) => item.value === layout)

  return target?.label || '標準版'
}

const defaultGridItems = [
  {
    id: 'gift-1',
    name: '品牌折價券',
    shortName: '折價券',
    icon: '🎁',
    imageUrl: '',
    weight: 35,
    quantity: 100
  },
  {
    id: 'gift-2',
    name: '會員點數 100 點',
    shortName: '點數',
    icon: '🪙',
    imageUrl: '',
    weight: 30,
    quantity: 100
  },
  {
    id: 'gift-3',
    name: '飲品兌換券',
    shortName: '飲品券',
    icon: '🥤',
    imageUrl: '',
    weight: 20,
    quantity: 50
  },
  {
    id: 'gift-4',
    name: '小禮物',
    shortName: '小禮物',
    icon: '🎀',
    imageUrl: '',
    weight: 25,
    quantity: 80
  },
  {
    id: 'draw-button',
    name: '點擊抽獎',
    shortName: '抽獎',
    icon: '✨',
    imageUrl: '',
    weight: 0,
    quantity: 0,
    isButton: true
  },
  {
    id: 'gift-5',
    name: '限定優惠券',
    shortName: '優惠券',
    icon: '🎟️',
    imageUrl: '',
    weight: 18,
    quantity: 60
  },
  {
    id: 'gift-6',
    name: '加碼抽獎券',
    shortName: '抽獎券',
    icon: '🎫',
    imageUrl: '',
    weight: 15,
    quantity: 30
  },
  {
    id: 'gift-7',
    name: '神秘禮盒',
    shortName: '神秘禮',
    icon: '📦',
    imageUrl: '',
    weight: 8,
    quantity: 20
  },
  {
    id: 'gift-8',
    name: '最大獎',
    shortName: '大獎',
    icon: '👑',
    imageUrl: '',
    weight: 3,
    quantity: 5
  }
]

const gridItems = ref(cloneByJson(defaultGridItems))

const defaultCampaignSnapshot = cloneByJson(campaign)
const defaultPlayerSnapshot = cloneByJson(player)
const defaultGridItemsSnapshot = cloneByJson(defaultGridItems)

const showcaseGames = [
  {
    title: '九宮格抽獎',
    icon: '🎁',
    gradient: 'from-orange-400 to-red-500'
  },
  {
    title: '幸運輪盤',
    icon: '🎡',
    gradient: 'from-yellow-400 to-orange-500'
  },
  {
    title: '刮刮卡',
    icon: '🧧',
    gradient: 'from-amber-400 to-red-600'
  },
  {
    title: '翻牌活動',
    icon: '🃏',
    gradient: 'from-indigo-500 to-violet-800'
  },
  {
    title: '金蛋抽獎',
    icon: '🥚',
    gradient: 'from-orange-500 to-red-700'
  },
  {
    title: '好友任務',
    icon: '🤝',
    gradient: 'from-slate-100 to-amber-300 text-slate-900'
  }
]

const drawPath = [0, 1, 2, 5, 8, 7, 6, 3]

const currentGame = computed(() => {
  if (!urlGameId.value) return null

  return gameSettings.value.find((game) => game.id === urlGameId.value) || null
})

const currentGameId = computed(() => {
  return currentGame.value?.id || urlGameId.value || 'premium-grid'
})

const hasGameIdQuery = computed(() => {
  return Boolean(urlGameId.value)
})

const isGameIdNotFound = computed(() => {
  return hasGameIdQuery.value && !currentGame.value
})

const gameIdStatusText = computed(() => {
  if (!isGameIdNotFound.value) return ''

  if (isAdminMode.value) {
    return `找不到活動 ID「${urlGameId.value}」對應的後台遊戲設定，目前使用精緻九宮格預設示範資料顯示。`
  }

  return '目前活動資料尚未同步，頁面會先使用預設活動內容。'
})

const sourcePath = computed(() => {
  const query = urlGameId.value ? `?gameId=${urlGameId.value}` : ''

  return `/games/premium-grid${query}`
})

const adminSourcePath = computed(() => {
  const query = urlGameId.value
    ? `?gameId=${urlGameId.value}&mode=admin`
    : '?mode=admin'

  return `/games/premium-grid${query}`
})

const premiumVersionInfo = computed(() => {
  return {
    version: 'Premium Grid V1 Stable',
    platformVersion: 'Multi Game Platform V2.2 Stable',
    batch: '第 175 批',
    playerMode: '玩家簡潔版',
    adminMode: '管理預覽版',
    status: '可展示 / 可測試 / 可延伸'
  }
})

const stableChecklist = computed(() => {
  return [
    {
      title: '玩家簡潔版',
      status: '完成',
      description: '玩家只看到活動、九宮格、分享、規則、獎品與中獎結果，最上方可放 LOGO、品牌橫幅 Banner 與網站連結，管理版可快速套用或清空範例，網站連結會自動補上 https，手機版橫幅不會擠壓變形，管理版可即時預覽 LOGO 與 Banner，圖片失敗時會自動使用預設樣式，並可切換品牌橫幅顯示模式，品牌設定可隨匯出匯入同步，也可一鍵複製與貼上匯入 JSON，並具備格式防呆，也可下載成獨立 JSON 檔並用檔案匯入，並支援多組品牌預設風格，套用前會確認並記錄最近套用項目，也可手動調整品牌主色系、套用推薦色系並即時預覽漸層效果，最近色系會被記錄，並可快速回復上一組主色系，也可複製、下載與選檔匯入目前主色系，並提供設定摘要、檔名建議、可保存收合狀態的主色系工具區、還原預設防誤觸與手動色碼格式防呆、色碼自動整理、即時狀態提示、套用按鈕防誤觸、單色色碼快速複製、複製提示強化、最後操作紀錄、紀錄清除、操作說明、說明一鍵複製、說明顯示狀態保存、管理區顯示還原、狀態複製與狀態 JSON 下載。',
      icon: '🎮'
    },
    {
      title: '管理預覽版',
      status: '完成',
      description: '網址加上 mode=admin 後才顯示管理面板、匯出匯入與快速編輯。',
      icon: '🛠️'
    },
    {
      title: '雙預覽路徑',
      status: '完成',
      description: '玩家版與管理版路徑已分流，方便測試與分享。',
      icon: '🔗'
    },
    {
      title: '分享加次數',
      status: '完成',
      description: '分享會複製活動連結並增加 1 次抽獎機會。',
      icon: '📣'
    },
    {
      title: '遊戲紀錄',
      status: '完成',
      description: '中獎結果會寫入我的遊戲紀錄，並保留來源活動路徑。',
      icon: '📋'
    },
    {
      title: '活動 ID 保護',
      status: '完成',
      description: '找不到 gameId 時會顯示提示，不會讓畫面壞掉。',
      icon: '🛡️'
    },
    {
      title: 'RWD 相容',
      status: '完成',
      description: '手機、平板、電腦都可觀看與操作。',
      icon: '📱'
    }
  ]
})

const websiteButtonText = computed(() => {
  return String(campaign.websiteText || '').trim() || '官方網站'
})

const safeWebsiteUrl = computed(() => {
  const value = String(campaign.websiteUrl || '').trim()

  if (!value) return ''

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }

  return `https://${value}`
})

const hasLogoImage = computed(() => {
  return Boolean(campaign.logoImageUrl) && !logoImageError.value
})

const hasBannerImage = computed(() => {
  return Boolean(campaign.bannerImageUrl) && !bannerImageError.value
})

const bannerBackgroundStyle = computed(() => {
  if (!hasBannerImage.value) {
    return {
      background: 'linear-gradient(135deg, rgba(255,255,255,0.24), rgba(255,255,255,0.1))'
    }
  }

  return {
    background: `linear-gradient(135deg, rgba(15,23,42,0.58), rgba(249,115,22,0.48)), url(${campaign.bannerImageUrl}) center/cover`
  }
})

const handleLogoImageError = () => {
  logoImageError.value = true

  if (isAdminMode.value) {
    showStorageMessage('LOGO 圖片載入失敗，已改用文字 LOGO。')
  }
}

const handleBannerImageError = () => {
  bannerImageError.value = true

  if (isAdminMode.value) {
    showStorageMessage('Banner 圖片載入失敗，已改用預設漸層背景。')
  }
}

const brandBannerSummary = computed(() => {
  return {
    layout: getBannerLayoutLabel(),
    hasLogoImage: Boolean(campaign.logoImageUrl),
    hasBannerImage: Boolean(campaign.bannerImageUrl),
    hasWebsiteUrl: Boolean(safeWebsiteUrl.value),
    websiteUrl: safeWebsiteUrl.value || '尚未設定',
    brandName: campaign.brandName || '尚未設定',
    brandTagline: campaign.brandTagline || '尚未設定',
    lastAppliedPreset: campaign.lastAppliedPreset || '尚未套用預設',
    lastAppliedThemePalette: campaign.lastAppliedThemePalette || '尚未套用色系',
    previousThemeLabel: hasPreviousThemeColors.value ? (campaign.previousThemeLabel || '上一組色系') : '無可回復色系'
  }
})

const getBrandBannerPayload = () => {
  return {
    type: 'premium_grid_brand_banner_settings',
    version: premiumVersionInfo.value.version,
    exportedAt: new Date().toISOString(),
    brandName: campaign.brandName,
    pageTitle: campaign.pageTitle,
    brandTagline: campaign.brandTagline,
    logoText: campaign.logoText,
    logoImageUrl: campaign.logoImageUrl,
    bannerImageUrl: campaign.bannerImageUrl,
    bannerLayout: campaign.bannerLayout,
    lastAppliedPreset: campaign.lastAppliedPreset,
    lastAppliedThemePalette: campaign.lastAppliedThemePalette,
    previousThemeStart: campaign.previousThemeStart,
    previousThemeMiddle: campaign.previousThemeMiddle,
    previousThemeEnd: campaign.previousThemeEnd,
    previousThemeLabel: campaign.previousThemeLabel,
    lastThemeAction: campaign.lastThemeAction,
    themeStart: campaign.themeStart,
    themeMiddle: campaign.themeMiddle,
    themeEnd: campaign.themeEnd,
    themeHasLightWarning: hasLightThemeWarning.value,
    themeColorPayload: getThemeColorPayload(),
    themePaletteHint: '此設定可搭配 themePaletteOptions 推薦色系使用',
    websiteText: campaign.websiteText,
    websiteUrl: campaign.websiteUrl,
    safeWebsiteUrl: safeWebsiteUrl.value,
    presetHint: '可搭配 brandPresetOptions 預設風格使用'
  }
}

const copyBrandBannerSettings = async () => {
  const payload = JSON.stringify(getBrandBannerPayload(), null, 2)

  try {
    await navigator.clipboard.writeText(payload)
    showStorageMessage('已複製品牌橫幅設定 JSON。')
  } catch (error) {
    console.error('複製品牌設定失敗：', error)
    window.prompt('瀏覽器不支援自動複製，請手動複製：', payload)
    showStorageMessage('已開啟手動複製視窗。')
  }
}

const getBrandExportFileName = () => {
  const safeName = String(campaign.brandName || campaign.pageTitle || 'premium-grid-brand')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[\\/:*?"<>|]/g, '')
    .toLowerCase()

  return `${safeName || 'premium-grid-brand'}-banner-settings-${getExportTimeText()}.json`
}

const downloadBrandBannerSettings = () => {
  const payload = JSON.stringify(getBrandBannerPayload(), null, 2)

  downloadTextFile(
    getBrandExportFileName(),
    payload,
    'application/json;charset=utf-8'
  )

  showStorageMessage('已下載品牌橫幅設定 JSON 檔。')
}

const getSafeTextValue = (value, fallback = '') => {
  const text = String(value ?? '').trim()

  return text || fallback
}

const getSafeBannerLayout = (value) => {
  const allowList = bannerLayoutOptions.map((item) => item.value)

  return allowList.includes(value) ? value : 'standard'
}

const validateBrandBannerPayload = (payload) => {
  if (!payload || payload.type !== 'premium_grid_brand_banner_settings') {
    return {
      ok: false,
      message: '這不是正確的品牌橫幅設定 JSON。'
    }
  }

  const hasAnyBrandField =
    payload.brandName ||
    payload.pageTitle ||
    payload.brandTagline ||
    payload.logoText ||
    payload.logoImageUrl ||
    payload.bannerImageUrl ||
    payload.websiteText ||
    payload.websiteUrl

  if (!hasAnyBrandField) {
    return {
      ok: false,
      message: '這份 JSON 沒有可套用的品牌欄位。'
    }
  }

  return {
    ok: true,
    message: '格式正確'
  }
}

const applyBrandBannerPayload = (payload) => {
  const validation = validateBrandBannerPayload(payload)

  if (!validation.ok) {
    window.alert(`匯入失敗：${validation.message}`)
    return false
  }

  campaign.brandName = getSafeTextValue(payload.brandName, campaign.brandName)
  campaign.pageTitle = getSafeTextValue(payload.pageTitle, campaign.pageTitle)
  campaign.brandTagline = getSafeTextValue(payload.brandTagline, campaign.brandTagline)
  campaign.logoText = getSafeTextValue(payload.logoText, campaign.logoText)
  campaign.logoImageUrl = getSafeTextValue(payload.logoImageUrl, '')
  campaign.bannerImageUrl = getSafeTextValue(payload.bannerImageUrl, '')
  campaign.bannerLayout = getSafeBannerLayout(payload.bannerLayout)
  campaign.lastAppliedPreset = getSafeTextValue(payload.lastAppliedPreset, campaign.lastAppliedPreset)
  campaign.lastAppliedThemePalette = getSafeTextValue(payload.lastAppliedThemePalette, campaign.lastAppliedThemePalette)
  campaign.previousThemeStart = getSafeTextValue(payload.previousThemeStart, campaign.previousThemeStart)
  campaign.previousThemeMiddle = getSafeTextValue(payload.previousThemeMiddle, campaign.previousThemeMiddle)
  campaign.previousThemeEnd = getSafeTextValue(payload.previousThemeEnd, campaign.previousThemeEnd)
  campaign.previousThemeLabel = getSafeTextValue(payload.previousThemeLabel, campaign.previousThemeLabel)
  campaign.lastThemeAction = getSafeTextValue(payload.lastThemeAction, campaign.lastThemeAction)
  campaign.themeStart = normalizeColorValue(payload.themeStart, campaign.themeStart)
  campaign.themeMiddle = normalizeColorValue(payload.themeMiddle, campaign.themeMiddle)
  campaign.themeEnd = normalizeColorValue(payload.themeEnd, campaign.themeEnd)
  campaign.websiteText = getSafeTextValue(payload.websiteText, '官方網站')
  campaign.websiteUrl = getSafeTextValue(payload.websiteUrl, '')

  logoImageError.value = false
  bannerImageError.value = false

  savePremiumGridState()
  showStorageMessage(`已匯入品牌橫幅設定，模式：${getBannerLayoutLabel(campaign.bannerLayout)}。`)

  return true
}

const openBrandImportFilePicker = () => {
  brandImportFileInput.value?.click()
}

const handleBrandImportFileChange = async (event) => {
  const file = event.target.files?.[0]

  if (!file) return

  if (!file.name.toLowerCase().endsWith('.json')) {
    window.alert('匯入失敗：請選擇 .json 品牌設定檔。')
    event.target.value = ''
    return
  }

  try {
    const raw = await file.text()
    const payload = safeJsonParse(raw, null)
    const success = applyBrandBannerPayload(payload)

    if (success) {
      showStorageMessage(`已從檔案匯入品牌設定：${file.name}`)
    }
  } catch (error) {
    console.error('讀取品牌設定檔失敗：', error)
    window.alert('匯入失敗：無法讀取這個 JSON 檔案。')
  }

  event.target.value = ''
}

const importBrandBannerSettings = () => {
  const raw = window.prompt('請貼上品牌橫幅設定 JSON：')

  if (!raw) return

  const payload = safeJsonParse(raw, null)

  applyBrandBannerPayload(payload)
}

const rewardTicker = computed(() => {
  return gridItems.value
    .filter((item) => !item.isButton)
    .map((item) => {
      return {
        id: item.id,
        title: item.name,
        icon: item.icon,
        imageUrl: item.imageUrl,
        quantity: item.quantity,
        weight: item.weight
      }
    })
})

const prizeSummary = computed(() => {
  const prizes = gridItems.value.filter((item) => !item.isButton)
  const totalQuantity = prizes.reduce((sum, item) => {
    return sum + Number(item.quantity || 0)
  }, 0)
  const totalWeight = prizes.reduce((sum, item) => {
    return sum + Number(item.weight || 0)
  }, 0)

  return {
    totalPrizes: prizes.length,
    totalQuantity,
    totalWeight
  }
})

const availablePrizeCount = computed(() => {
  return getPrizePool().length
})

const canDraw = computed(() => {
  return player.chances > 0 && availablePrizeCount.value > 0 && !isDrawing.value
})

const drawButtonText = computed(() => {
  if (isDrawing.value) return '抽選中'

  if (player.chances <= 0) return '次數用完'

  if (availablePrizeCount.value <= 0) return '獎品已抽完'

  return '點擊抽選'
})

const playerStatusMessage = computed(() => {
  if (isDrawing.value) {
    return '抽獎進行中，請稍候結果出現。'
  }

  if (availablePrizeCount.value <= 0) {
    return '目前獎品庫存已抽完，請等待主辦單位補貨或更新活動。'
  }

  if (player.chances <= 0) {
    return '目前沒有抽獎機會，可以分享活動增加 1 次抽獎機會。'
  }

  return `目前還有 ${player.chances} 次抽獎機會，點擊中間按鈕即可抽獎。`
})

const drawingStatusText = computed(() => {
  if (!isDrawing.value) return ''

  return '系統正在抽選獎項，請不要關閉畫面。'
})

const layoutFeatureCards = computed(() => {
  return [
    {
      title: '玩家模式',
      value: '簡潔',
      description: '玩家只看到活動、九宮格、獎品與中獎結果',
      icon: '🎮'
    },
    {
      title: '管理模式',
      value: '工具',
      description: '網址加上 ?mode=admin 才顯示設定面板',
      icon: '🛠️'
    },
    {
      title: 'RWD',
      value: '相容',
      description: '手機、平板、電腦都可觀看',
      icon: '📱'
    }
  ]
})

const sleep = (time) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}

const showStorageMessage = (message) => {
  storageMessage.value = message

  setTimeout(() => {
    storageMessage.value = ''
  }, 2400)
}

const updateChanceText = () => {
  campaign.chanceText = `還有 ${player.chances} 次抽獎機會`
}

const applyGameSettingsToCampaign = () => {
  const game = currentGame.value

  if (!game) return

  campaign.pageTitle = game.name || campaign.pageTitle
  campaign.mainTitle = game.name || campaign.mainTitle
  campaign.subTitle = game.description || campaign.subTitle
  campaign.heroTagline = game.subtitle || campaign.heroTagline
  campaign.logoText = game.icon || campaign.logoText
  player.chances = Number(game.playLimit || player.chances || 1)
  updateChanceText()

  if (Array.isArray(game.prizes) && game.prizes.length) {
    const prizes = game.prizes.slice(0, 8)

    gridItems.value = defaultGridItems.map((item, index) => {
      if (item.isButton) return item

      const prize = prizes[index]

      if (!prize) return item

      return {
        ...item,
        id: prize.id || item.id,
        name: prize.name || item.name,
        shortName: prize.shortName || prize.name || item.shortName,
        icon: prize.icon || item.icon,
        imageUrl: prize.imageUrl || '',
        weight: Number(prize.weight || item.weight || 0),
        quantity: Number(prize.quantity || item.quantity || 0)
      }
    })
  }
}

const getPrizePool = () => {
  return gridItems.value.filter((item) => {
    return !item.isButton && Number(item.quantity || 0) > 0 && Number(item.weight || 0) > 0
  })
}

const pickPrize = () => {
  const prizePool = getPrizePool()

  if (!prizePool.length) return null

  const totalWeight = prizePool.reduce((sum, item) => {
    return sum + Number(item.weight || 0)
  }, 0)

  let randomValue = Math.random() * totalWeight

  return prizePool.find((item) => {
    randomValue -= Number(item.weight || 0)
    return randomValue <= 0
  }) || prizePool[prizePool.length - 1]
}

const getPremiumGridStorageKey = () => {
  return `${PREMIUM_GRID_STORAGE_KEY}_${currentGameId.value}`
}

const broadcastPremiumGridStateChange = () => {
  // 不再對同一個頁面發送自訂事件，避免 watch -> save -> load -> save 形成迴圈。
  // 不同分頁會透過瀏覽器 storage 事件同步。
}

const pingPremiumGridSync = () => {
  if (typeof localStorage === 'undefined') return

  localStorage.setItem(
    PREMIUM_GRID_SYNC_PING_KEY,
    JSON.stringify({
      key: getPremiumGridStorageKey(),
      gameId: currentGameId.value,
      updatedAt: new Date().toISOString()
    })
  )
}

const syncPremiumGridToPlayer = () => {
  savePremiumGridState()
  pingPremiumGridSync()

  lastSyncAt.value = new Date().toLocaleString('zh-TW')
  lastSyncMessage.value = `已同步到玩家版：${sourcePath.value}`

  showStorageMessage('已同步最新九宮格設定到玩家版。')
}

const handlePremiumGridStorageSync = (event) => {
  if (!event) return
  if (isSavingPremiumGridState.value) return

  if (event.key === getPremiumGridStorageKey()) {
    loadPremiumGridState()
    return
  }

  if (event.key === PREMIUM_GRID_SYNC_PING_KEY) {
    const payload = safeJsonParse(event.newValue, null)

    if (payload?.key === getPremiumGridStorageKey()) {
      lastSyncAt.value = new Date().toLocaleString('zh-TW')
      lastSyncMessage.value = '已收到管理版同步，玩家畫面已更新。'
      loadPremiumGridState()
    }
  }
}

const handlePremiumGridCustomSync = (event) => {
  if (!event?.detail || event.detail.key !== getPremiumGridStorageKey()) return
  if (isSavingPremiumGridState.value) return

  loadPremiumGridState()
}

const savePremiumGridState = () => {
  if (typeof localStorage === 'undefined') return
  if (isApplyingPremiumGridRemoteState.value) return

  isSavingPremiumGridState.value = true

  const payload = {
    campaign: cloneByJson(campaign),
    player: cloneByJson(player),
    gridItems: cloneByJson(gridItems.value),
    drawLogs: cloneByJson(drawLogs.value),
    ui: {
      showThemeTools: showThemeTools.value,
      showThemeGuide: showThemeGuide.value
    },
    savedAt: new Date().toISOString()
  }

  localStorage.setItem(getPremiumGridStorageKey(), JSON.stringify(payload))
  pingPremiumGridSync()

  setTimeout(() => {
    isSavingPremiumGridState.value = false
  }, 0)
}

const loadPremiumGridState = () => {
  if (typeof localStorage === 'undefined') return

  isApplyingPremiumGridRemoteState.value = true

  const payload = safeJsonParse(
    localStorage.getItem(getPremiumGridStorageKey()),
    null
  )

  if (!payload) {
    applyGameSettingsToCampaign()
    isApplyingPremiumGridRemoteState.value = false
    return
  }

  Object.assign(campaign, {
    ...defaultCampaignSnapshot,
    ...(payload.campaign || {})
  })

  Object.assign(player, {
    ...defaultPlayerSnapshot,
    ...(payload.player || {})
  })

  if (Array.isArray(payload.gridItems) && payload.gridItems.length) {
    gridItems.value = payload.gridItems
  }

  if (Array.isArray(payload.drawLogs)) {
    drawLogs.value = payload.drawLogs.slice(0, 8)
  }

  if (typeof payload.ui?.showThemeTools === 'boolean') {
    showThemeTools.value = payload.ui.showThemeTools
  }

  if (typeof payload.ui?.showThemeGuide === 'boolean') {
    showThemeGuide.value = payload.ui.showThemeGuide
  }

  updateChanceText()

  setTimeout(() => {
    isApplyingPremiumGridRemoteState.value = false
  }, 0)
}

const clearPremiumGridState = () => {
  const confirmed = window.confirm('確定要清除精緻九宮格本機保存資料，並還原示範狀態嗎？')

  if (!confirmed) return

  localStorage.removeItem(`${PREMIUM_GRID_STORAGE_KEY}_${currentGameId.value}`)

  Object.assign(campaign, cloneByJson(defaultCampaignSnapshot))
  Object.assign(player, cloneByJson(defaultPlayerSnapshot))
  gridItems.value = cloneByJson(defaultGridItemsSnapshot)
  activeIndex.value = -1
  resultPrize.value = null
  showResultModal.value = false
  drawLogs.value = []
  showThemeTools.value = true
  showThemeGuide.value = true

  applyGameSettingsToCampaign()
  updateChanceText()
  showStorageMessage('已清除保存資料，並還原示範狀態。')
}

const getSavedStateText = () => {
  if (typeof localStorage === 'undefined') return '尚未保存'

  const payload = safeJsonParse(
    localStorage.getItem(`${PREMIUM_GRID_STORAGE_KEY}_${currentGameId.value}`),
    null
  )

  if (!payload?.savedAt) return '尚未保存'

  const date = new Date(payload.savedAt)

  if (Number.isNaN(date.getTime())) return '已保存'

  return date.toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const downloadTextFile = (filename, content, mimeType = 'text/plain;charset=utf-8') => {
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

const exportPremiumGridState = () => {
  savePremiumGridState()

  const payload = {
    version: premiumVersionInfo.value.platformVersion,
    premiumVersion: premiumVersionInfo.value.version,
    batch: premiumVersionInfo.value.batch,
    type: 'premium_grid_lottery_demo_state',
    exportedAt: new Date().toISOString(),
    currentGameId: currentGameId.value,
    sourcePath: sourcePath.value,
    adminSourcePath: adminSourcePath.value,
    brandBannerSettings: getBrandBannerPayload(),
    campaign: cloneByJson(campaign),
    player: cloneByJson(player),
    gridItems: cloneByJson(gridItems.value),
    drawLogs: cloneByJson(drawLogs.value)
  }

  downloadTextFile(
    `premium-grid-state-${getExportTimeText()}.json`,
    JSON.stringify(payload, null, 2),
    'application/json;charset=utf-8'
  )

  showStorageMessage('已匯出精緻九宮格本機示範資料。')
}

const importPremiumGridState = () => {
  const raw = window.prompt('請貼上之前匯出的 premium-grid-state JSON 內容：')

  if (!raw) return

  const payload = safeJsonParse(raw, null)

  if (!payload || payload.type !== 'premium_grid_lottery_demo_state') {
    window.alert('匯入失敗：這不是正確的精緻九宮格保存資料。')
    return
  }

  Object.assign(campaign, {
    ...defaultCampaignSnapshot,
    ...(payload.campaign || {})
  })

  Object.assign(player, {
    ...defaultPlayerSnapshot,
    ...(payload.player || {})
  })

  if (Array.isArray(payload.gridItems) && payload.gridItems.length) {
    gridItems.value = payload.gridItems
  }

  if (Array.isArray(payload.drawLogs)) {
    drawLogs.value = payload.drawLogs.slice(0, 8)
  }

  logoImageError.value = false
  bannerImageError.value = false
  updateChanceText()
  savePremiumGridState()
  showStorageMessage('已匯入精緻九宮格示範資料，品牌橫幅設定已同步還原。')
}

const addDrawHistory = (prize) => {
  addHistory({
    gameId: currentGameId.value,
    templateGameId: 'premium-grid',
    gameName: campaign.pageTitle || '精緻九宮格',
    prizeId: prize.id,
    prizeName: prize.name,
    prizeDescription: prize.shortName || '',
    prizeIcon: prize.icon || '🎁',
    playerName: '訪客玩家',
    sourcePath: sourcePath.value,
    createdAt: new Date().toISOString()
  })
}

const getShareUrl = () => {
  if (typeof window === 'undefined') return sourcePath.value

  return `${window.location.origin}${sourcePath.value}`
}

const getShareText = () => {
  return `${campaign.pageTitle}｜${campaign.subTitle}\n${campaign.mainTitle} ${campaign.heroTagline}\n立即參加：${getShareUrl()}`
}

const showShareSuccess = (message) => {
  shareMessage.value = message
  showShareMessage.value = true

  setTimeout(() => {
    showShareMessage.value = false
    shareMessage.value = ''
  }, 2600)
}

const startDraw = async () => {
  if (isDrawing.value) return

  if (player.chances <= 0) {
    showShareSuccess('目前沒有抽獎機會，請先分享活動增加次數。')
    return
  }

  const prize = pickPrize()

  if (!prize) {
    showShareSuccess('目前獎品已抽完，請等待主辦單位更新活動。')
    return
  }

  isDrawing.value = true
  resultPrize.value = null
  showResultModal.value = false
  player.chances -= 1
  updateChanceText()

  const targetIndex = gridItems.value.findIndex((item) => item.id === prize.id)
  const targetPathIndex = drawPath.findIndex((index) => index === targetIndex)
  const baseRounds = 4
  const totalSteps = baseRounds * drawPath.length + targetPathIndex + 1

  for (let step = 0; step < totalSteps; step += 1) {
    activeIndex.value = drawPath[step % drawPath.length]

    const speed = Math.min(55 + step * 5, 180)
    await sleep(speed)
  }

  prize.quantity = Math.max(0, Number(prize.quantity || 0) - 1)
  resultPrize.value = prize

  drawLogs.value.unshift({
    id: `draw_${Date.now()}`,
    prizeName: prize.name,
    icon: prize.icon,
    createdAt: new Date().toLocaleString('zh-TW', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  })

  drawLogs.value = drawLogs.value.slice(0, 8)
  addDrawHistory(prize)
  savePremiumGridState()

  await sleep(300)
  showResultModal.value = true
  isDrawing.value = false
}

const shareCampaign = async () => {
  player.sharedCount += 1
  player.chances += 1
  updateChanceText()
  savePremiumGridState()

  const shareText = getShareText()

  try {
    await navigator.clipboard.writeText(shareText)
    showShareSuccess('已複製分享文案，並增加 1 次抽獎機會。')
  } catch (error) {
    console.error('複製分享文案失敗：', error)
    showShareSuccess('已增加 1 次抽獎機會；目前瀏覽器不支援自動複製。')
  }
}

const applyBrandBannerDemo = () => {
  campaign.brandName = 'Lucky Brand Club'
  campaign.pageTitle = '品牌會員抽獎'
  campaign.brandTagline = '會員限定好禮，天天都有驚喜'
  campaign.mainTitle = '豪華九宮格'
  campaign.heroTagline = '幸運抽好禮'
  campaign.subTitle = '登入會員即可參加'
  campaign.logoText = 'L'
  campaign.logoImageUrl = ''
  campaign.bannerImageUrl = ''
  campaign.websiteText = '前往官網'
  campaign.websiteUrl = 'https://example.com'

  logoImageError.value = false
  bannerImageError.value = false
  savePremiumGridState()
  showStorageMessage('已套用品牌橫幅範例。')
}

const clearBrandBannerSettings = () => {
  const confirmed = window.confirm('確定要清空 LOGO、Banner 與網站連結設定嗎？')

  if (!confirmed) return

  campaign.logoImageUrl = ''
  campaign.bannerImageUrl = ''
  campaign.websiteUrl = ''
  campaign.websiteText = '官方網站'
  campaign.brandTagline = '打造專屬互動抽獎體驗'

  logoImageError.value = false
  bannerImageError.value = false
  savePremiumGridState()
  showStorageMessage('已清空品牌橫幅圖片與網站連結。')
}

const resetDemo = () => {
  const confirmed = window.confirm('確定要重置本頁示範資料嗎？')

  if (!confirmed) return

  localStorage.removeItem(`${PREMIUM_GRID_STORAGE_KEY}_${currentGameId.value}`)

  Object.assign(campaign, cloneByJson(defaultCampaignSnapshot))
  Object.assign(player, cloneByJson(defaultPlayerSnapshot))
  activeIndex.value = -1
  resultPrize.value = null
  showResultModal.value = false
  drawLogs.value = []
  gridItems.value = cloneByJson(defaultGridItemsSnapshot)
  showThemeTools.value = true
  showThemeGuide.value = true

  applyGameSettingsToCampaign()
  updateChanceText()
  savePremiumGridState()
}

const closeResultAndContinue = () => {
  showResultModal.value = false
  resultPrize.value = null
  activeIndex.value = -1
}

const goGameHistory = () => {
  showResultModal.value = false
  router.push('/game-history')
}

const goGamesCenter = () => {
  router.push('/games')
}

const getResultModalHint = () => {
  if (isAdminMode.value) {
    return '這是前台精緻版抽獎效果示範；目前可接後台活動資料、獎項庫存、抽獎紀錄與本機保存。'
  }

  if (player.chances > 0) {
    return `獎項已寫入我的遊戲紀錄。你還有 ${player.chances} 次抽獎機會，可以繼續參加。`
  }

  return '獎項已寫入我的遊戲紀錄。你目前沒有剩餘抽獎機會，可先查看紀錄或分享活動增加次數。'
}

const getCellStyle = (index) => {
  const isActive = activeIndex.value === index

  return {
    transform: isActive ? 'scale(1.08)' : 'scale(1)',
    boxShadow: isActive
      ? '0 0 0 4px rgba(255,255,255,0.88), 0 22px 38px rgba(154, 52, 18, 0.42)'
      : 'inset 0 2px 0 rgba(255,255,255,0.65), 0 10px 22px rgba(154, 52, 18, 0.2)'
  }
}

loadPremiumGridState()

onMounted(() => {
  if (typeof window === 'undefined') return

  window.addEventListener('storage', handlePremiumGridStorageSync)
})

onBeforeUnmount(() => {
  if (typeof window === 'undefined') return

  window.removeEventListener('storage', handlePremiumGridStorageSync)
})

watch(
  () => route.fullPath,
  () => {
    loadPremiumGridState()
  }
)

watch(
  [
    () => campaign.pageTitle,
    () => campaign.mainTitle,
    () => campaign.subTitle,
    () => campaign.heroTagline,
    () => campaign.topImageUrl,
    () => campaign.backgroundImageUrl,
    () => campaign.logoText,
    () => campaign.logoImageUrl,
    () => campaign.bannerImageUrl,
    () => campaign.bannerLayout,
    () => campaign.lastAppliedPreset,
    () => campaign.lastAppliedThemePalette,
    () => campaign.previousThemeStart,
    () => campaign.previousThemeMiddle,
    () => campaign.previousThemeEnd,
    () => campaign.previousThemeLabel,
    () => campaign.lastThemeAction,
    () => campaign.brandName,
    () => campaign.brandTagline,
    () => campaign.websiteUrl,
    () => campaign.websiteText,
    () => campaign.themeStart,
    () => campaign.themeMiddle,
    () => campaign.themeEnd
  ],
  () => {
    savePremiumGridState()
  }
)

watch(
  gridItems,
  () => {
    savePremiumGridState()
  },
  {
    deep: true
  }
)

watch(
  player,
  () => {
    updateChanceText()
    savePremiumGridState()
  },
  {
    deep: true
  }
)

watch(
  () => campaign.logoImageUrl,
  () => {
    logoImageError.value = false
  }
)

watch(
  () => campaign.bannerImageUrl,
  () => {
    bannerImageError.value = false
  }
)

watch(
  showThemeTools,
  () => {
    savePremiumGridState()
  }
)

watch(
  showThemeGuide,
  () => {
    savePremiumGridState()
  }
)
</script>

<template>
  <div class="min-h-screen overflow-hidden bg-slate-100 text-slate-900">
    <div class="relative min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.72),transparent_28%),linear-gradient(135deg,#ffd0b2_0%,#f4a37d_44%,#b7d8d9_100%)] px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div class="absolute inset-0 opacity-30">
        <div class="premium-dot-bg h-full w-full"></div>
      </div>

      <div
        class="relative mx-auto grid w-full gap-5 md:gap-7 xl:items-start"
        :class="isAdminMode
          ? 'max-w-7xl xl:grid-cols-[minmax(330px,420px)_minmax(390px,430px)_minmax(280px,1fr)]'
          : 'max-w-[520px] justify-center'
        "
      >
        <section
          v-if="isAdminMode"
          class="order-2 rounded-[32px] border border-white/70 bg-white/75 p-4 shadow-xl backdrop-blur md:p-5 xl:order-1 xl:sticky xl:top-6"
        >
          <div class="flex items-center gap-4">
            <div class="flex h-16 w-16 rotate-[-8deg] items-center justify-center rounded-full border-[8px] border-slate-800 bg-white text-4xl font-black text-teal-500 shadow-xl sm:h-20 sm:w-20 sm:text-5xl">
              ✓
            </div>

            <div>
              <p class="text-xs font-black uppercase tracking-[0.28em] text-slate-500 sm:text-sm">
                Admin Preview
              </p>

              <h1 class="mt-1 text-xl font-black text-slate-900 sm:text-2xl lg:text-3xl">
                遊戲精緻版管理預覽
              </h1>
            </div>
          </div>

          <p class="mt-4 text-sm font-bold leading-7 text-slate-600">
            一般玩家只會看到簡潔活動頁。只有網址加上 <span class="font-black text-orange-600">?mode=admin</span> 時，才會顯示設計、匯出、匯入、獎項快速編輯與資料面板。
          </p>

          <div class="mt-4 rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-xs font-black leading-5 text-emerald-700">
            後台修改品牌名稱、LOGO、Banner、網址、色系與獎項後，可按下方按鈕強制通知玩家版重新讀取最新設定。
          </div>

          <button
            type="button"
            class="mt-4 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
            @click="syncPremiumGridToPlayer"
          >
            同步到玩家版
          </button>

          <div class="mt-3 rounded-3xl border border-emerald-100 bg-white p-4 text-xs font-bold leading-5 text-slate-500">
            <p class="font-black text-emerald-700">
              同步狀態
            </p>

            <p class="mt-1 break-all">
              玩家版網址：{{ sourcePath }}
            </p>

            <p class="mt-1">
              最後同步：{{ lastSyncAt || '尚未手動同步' }}
            </p>

            <p
              v-if="lastSyncMessage"
              class="mt-2 rounded-2xl bg-emerald-50 px-3 py-2 font-black text-emerald-700"
            >
              {{ lastSyncMessage }}
            </p>
          </div>

          <div class="mt-5 rounded-3xl border border-orange-100 bg-orange-50 p-4">
            <p class="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
              Stable Milestone
            </p>

            <h2 class="mt-2 text-xl font-black text-orange-900">
              {{ premiumVersionInfo.version }}
            </h2>

            <p class="mt-2 text-sm font-bold leading-6 text-orange-700">
              {{ premiumVersionInfo.platformVersion }}｜{{ premiumVersionInfo.batch }}｜{{ premiumVersionInfo.status }}
            </p>
          </div>

          <div class="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <article
              v-for="card in layoutFeatureCards"
              :key="card.title"
              class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div class="flex items-start gap-3">
                <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-2xl">
                  {{ card.icon }}
                </div>

                <div>
                  <p class="text-sm font-black text-slate-900">
                    {{ card.title }}
                  </p>

                  <p class="mt-1 text-lg font-black text-orange-600">
                    {{ card.value }}
                  </p>

                  <p class="mt-1 text-xs font-bold leading-5 text-slate-500">
                    {{ card.description }}
                  </p>
                </div>
              </div>
            </article>
          </div>

          <div class="mt-5 hidden grid-cols-3 gap-3 sm:grid xl:grid-cols-3">
            <article
              v-for="game in showcaseGames"
              :key="game.title"
              class="group overflow-hidden rounded-[22px] bg-white p-1.5 shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div
                class="flex aspect-[9/14] flex-col justify-between rounded-[18px] bg-gradient-to-br p-2 text-white"
                :class="game.gradient"
              >
                <div class="flex items-center justify-between text-[8px] font-black text-white/90">
                  <span>10:58</span>
                  <span>•••</span>
                </div>

                <div class="text-center">
                  <div class="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-2xl shadow-inner">
                    {{ game.icon }}
                  </div>

                  <p class="mt-2 text-[11px] font-black leading-tight drop-shadow">
                    {{ game.title }}
                  </p>
                </div>

                <div class="grid grid-cols-3 gap-1">
                  <span
                    v-for="item in 6"
                    :key="item"
                    class="h-4 rounded-md bg-white/35 shadow-inner"
                  ></span>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section
          class="order-1 mx-auto w-full max-w-[430px] sm:max-w-[520px] md:max-w-[560px]"
          :class="isAdminMode ? 'xl:order-2 xl:max-w-[430px]' : 'xl:max-w-[520px]'"
        >
          <div class="relative mx-auto overflow-hidden rounded-[36px] bg-slate-950 p-2 shadow-[0_35px_80px_rgba(15,23,42,0.38)] sm:rounded-[54px] sm:border-[10px] sm:border-slate-950 sm:p-3 xl:sticky xl:top-6">
            <div class="pointer-events-none absolute left-1/2 top-0 z-20 hidden h-8 w-40 -translate-x-1/2 rounded-b-3xl bg-slate-950 sm:block"></div>

            <div class="relative overflow-hidden rounded-[30px] bg-white sm:rounded-[40px]">
              <div class="hidden h-10 items-center justify-between bg-white px-6 text-xs font-black text-slate-900 sm:flex">
                <span>5:04</span>
                <span class="flex items-center gap-1">
                  <span>▮▮▮</span>
                  <span>98%</span>
                </span>
              </div>

              <div class="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3 sm:px-5">
                <button
                  type="button"
                  class="text-xl font-black text-slate-500"
                >
                  ‹
                </button>

                <div class="text-center">
                  <h2 class="text-sm font-black text-slate-900">
                    {{ campaign.pageTitle }}
                  </h2>

                  <p class="text-[10px] font-bold text-slate-400">
                    {{ isAdminMode ? 'admin-preview.demo.local' : 'activity.demo.local' }}
                  </p>
                </div>

                <button
                  type="button"
                  class="text-xl font-black text-slate-500"
                >
                  ×
                </button>
              </div>

              <main
                class="relative min-h-[calc(100vh-88px)] overflow-hidden px-4 pb-6 pt-5 text-white sm:min-h-[720px] sm:px-5 md:min-h-[760px] xl:min-h-[720px]"
                :style="{
                  background: campaign.backgroundImageUrl
                    ? `linear-gradient(rgba(255,122,24,.78), rgba(238,63,36,.95)), url(${campaign.backgroundImageUrl}) center/cover`
                    : `linear-gradient(180deg, ${campaign.themeStart} 0%, ${campaign.themeMiddle} 42%, ${campaign.themeEnd} 100%)`
                }"
              >
                <div class="absolute -right-16 top-12 h-52 w-52 rounded-full bg-white/15 blur-2xl"></div>
                <div class="absolute -left-20 bottom-20 h-60 w-60 rounded-full bg-yellow-200/20 blur-3xl"></div>

                <section class="relative">
                  <div
                    class="overflow-hidden rounded-[30px] border border-white/25 p-3 shadow-2xl backdrop-blur sm:p-4"
                    :style="bannerBackgroundStyle"
                  >
                    <div
                      v-if="campaign.bannerLayout === 'center'"
                      class="flex flex-col items-center gap-3 text-center"
                    >
                      <div
                            v-if="hasLogoImage"
                            class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/50 bg-white shadow-lg sm:h-16 sm:w-16"
                          >
                            <img
                              :src="campaign.logoImageUrl"
                              alt="品牌 LOGO"
                              class="h-full w-full object-contain"
                              @error="handleLogoImageError"
                            />
                          </div>

                          <div
                            v-else
                            class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-[4px] border-yellow-200 bg-gradient-to-br from-amber-300 to-orange-500 text-3xl font-black text-white shadow-2xl sm:h-16 sm:w-16"
                          >
                            {{ campaign.logoText }}
                          </div>

                      <div class="max-w-full">
                        <p class="text-sm font-black text-white/80">
                          {{ campaign.brandName }}
                        </p>

                        <p class="line-clamp-2 text-lg font-black leading-6 text-white sm:text-xl">
                          {{ campaign.pageTitle }}
                        </p>

                        <p class="mt-1 line-clamp-2 text-xs font-bold leading-5 text-white/75">
                          {{ campaign.brandTagline }}
                        </p>
                      </div>

                      <a
                        v-if="safeWebsiteUrl"
                        :href="safeWebsiteUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex w-full max-w-[220px] items-center justify-center rounded-full bg-white px-4 py-2.5 text-xs font-black text-orange-600 shadow-lg transition hover:bg-yellow-50"
                      >
                        {{ websiteButtonText }}
                      </a>
                    </div>

                    <div
                      v-else-if="campaign.bannerLayout === 'compact'"
                      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div class="flex min-w-0 items-center gap-3">
                        <div
                            v-if="hasLogoImage"
                            class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/50 bg-white shadow-lg sm:h-16 sm:w-16"
                          >
                            <img
                              :src="campaign.logoImageUrl"
                              alt="品牌 LOGO"
                              class="h-full w-full object-contain"
                              @error="handleLogoImageError"
                            />
                          </div>

                          <div
                            v-else
                            class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-[4px] border-yellow-200 bg-gradient-to-br from-amber-300 to-orange-500 text-3xl font-black text-white shadow-2xl sm:h-16 sm:w-16"
                          >
                            {{ campaign.logoText }}
                          </div>

                        <div class="min-w-0 flex-1 text-left">
                          <p class="truncate text-sm font-black text-white/80">
                            {{ campaign.brandName }}
                          </p>

                          <p class="truncate text-base font-black text-white sm:text-lg">
                            {{ campaign.pageTitle }}
                          </p>
                        </div>
                      </div>

                      <a
                        v-if="safeWebsiteUrl"
                        :href="safeWebsiteUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex w-full shrink-0 items-center justify-center rounded-full bg-white px-4 py-2.5 text-xs font-black text-orange-600 shadow-lg transition hover:bg-yellow-50 sm:w-auto sm:py-2"
                      >
                        {{ websiteButtonText }}
                      </a>
                    </div>

                    <div
                      v-else
                      class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div class="flex min-w-0 items-center gap-3">
                        <div
                            v-if="hasLogoImage"
                            class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/50 bg-white shadow-lg sm:h-16 sm:w-16"
                          >
                            <img
                              :src="campaign.logoImageUrl"
                              alt="品牌 LOGO"
                              class="h-full w-full object-contain"
                              @error="handleLogoImageError"
                            />
                          </div>

                          <div
                            v-else
                            class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-[4px] border-yellow-200 bg-gradient-to-br from-amber-300 to-orange-500 text-3xl font-black text-white shadow-2xl sm:h-16 sm:w-16"
                          >
                            {{ campaign.logoText }}
                          </div>

                        <div class="min-w-0 flex-1 text-left">
                          <p class="truncate text-sm font-black text-white/80">
                            {{ campaign.brandName }}
                          </p>

                          <p class="line-clamp-2 text-base font-black leading-5 text-white sm:text-lg sm:leading-6">
                            {{ campaign.pageTitle }}
                          </p>

                          <p class="mt-1 line-clamp-2 text-[11px] font-bold leading-5 text-white/75 sm:text-xs">
                            {{ campaign.brandTagline }}
                          </p>
                        </div>
                      </div>

                      <a
                        v-if="safeWebsiteUrl"
                        :href="safeWebsiteUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex w-full shrink-0 items-center justify-center rounded-full bg-white px-4 py-2.5 text-xs font-black text-orange-600 shadow-lg transition hover:bg-yellow-50 sm:w-auto sm:py-2"
                      >
                        {{ websiteButtonText }}
                      </a>
                    </div>
                  </div>

                  <div
                    v-if="campaign.topImageUrl"
                    class="mx-auto mt-4 mb-3 h-24 w-56 overflow-hidden rounded-3xl border-4 border-white/40 bg-white/15 shadow-2xl"
                  >
                    <img
                      :src="campaign.topImageUrl"
                      alt="活動主視覺"
                      class="h-full w-full object-cover"
                    />
                  </div>

                  <div class="mt-4 text-center">
                    <p class="text-3xl font-black leading-tight tracking-wide text-yellow-100 drop-shadow-[0_4px_0_rgba(154,52,18,0.45)] sm:text-4xl">
                      {{ campaign.mainTitle }}
                    </p>

                    <p class="mt-1 text-2xl font-black leading-tight text-yellow-200 drop-shadow-[0_4px_0_rgba(154,52,18,0.45)] sm:text-3xl">
                      {{ campaign.heroTagline }}
                    </p>

                    <p class="mt-3 inline-flex rounded-full bg-white/20 px-4 py-2 text-xs font-black text-white shadow-inner backdrop-blur sm:text-sm">
                      {{ campaign.subTitle }}
                    </p>
                  </div>
                </section>

                <section
                  v-if="gameIdStatusText"
                  class="relative mt-5 rounded-3xl border border-white/30 bg-white/20 p-4 text-center shadow-inner backdrop-blur"
                >
                  <p class="text-sm font-black text-white">
                    {{ isAdminMode ? '活動 ID 檢查' : '活動資料提示' }}
                  </p>

                  <p class="mt-2 text-xs font-bold leading-6 text-white/75">
                    {{ gameIdStatusText }}
                  </p>
                </section>

                <section
                  class="relative mt-6 rounded-[30px] border-[5px] border-orange-400/80 bg-gradient-to-b from-yellow-300 to-orange-500 p-2.5 shadow-[inset_0_3px_0_rgba(255,255,255,.45),0_24px_40px_rgba(154,52,18,.35)] sm:mt-8 sm:rounded-[36px] sm:border-[6px] sm:p-3"
                  :class="isDrawing ? 'premium-drawing-glow' : ''"
                >
                  <div class="grid grid-cols-3 gap-2.5 sm:gap-3">
                    <button
                      v-for="(item, index) in gridItems"
                      :key="item.id"
                      type="button"
                      class="relative aspect-square overflow-hidden rounded-2xl border border-orange-200/80 text-center transition duration-150 sm:rounded-3xl"
                      :class="item.isButton
                        ? canDraw
                          ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white'
                          : 'bg-gradient-to-br from-slate-400 to-slate-600 text-white'
                        : 'bg-gradient-to-br from-yellow-100 via-yellow-300 to-orange-300 text-orange-900'
                      "
                      :style="getCellStyle(index)"
                      :disabled="item.isButton && !canDraw"
                      @click="item.isButton ? startDraw() : null"
                    >
                      <div class="absolute left-2 top-2 h-6 w-6 rounded-full border-l-4 border-t-4 border-white/80 sm:h-8 sm:w-8"></div>
                      <div class="absolute bottom-2 right-2 h-6 w-6 rounded-full border-b-4 border-r-4 border-white/40 sm:h-8 sm:w-8"></div>

                      <div class="flex h-full flex-col items-center justify-center gap-1 px-1.5 sm:px-2">
                        <img
                          v-if="item.imageUrl"
                          :src="item.imageUrl"
                          :alt="item.name"
                          class="h-9 w-9 rounded-xl object-cover shadow-md sm:h-10 sm:w-10"
                        />

                        <span
                          v-else
                          class="text-3xl drop-shadow sm:text-4xl"
                        >
                          {{ item.icon }}
                        </span>

                        <span
                          class="text-[11px] font-black leading-tight sm:text-xs"
                          :class="item.isButton ? 'text-white' : 'text-orange-900'"
                        >
                          {{ item.isButton ? drawButtonText : item.shortName }}
                        </span>
                      </div>
                    </button>
                  </div>
                </section>

                <section class="relative mt-5 text-center sm:mt-6">
                  <p class="text-sm font-black text-white/90">
                    {{ campaign.chanceText }}
                  </p>

                  <p
                    class="mx-auto mt-2 max-w-xs rounded-2xl px-4 py-2 text-xs font-black leading-5 shadow-inner backdrop-blur"
                    :class="canDraw
                      ? 'bg-white/15 text-white/80'
                      : 'bg-white text-orange-600'
                    "
                  >
                    {{ playerStatusMessage }}
                  </p>

                  <div class="mt-3 flex items-center justify-center gap-2 sm:gap-3">
                    <button
                      v-if="isAdminMode"
                      type="button"
                      class="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-xl font-black shadow-inner backdrop-blur transition hover:bg-white/30"
                      :disabled="isDrawing"
                      :class="isDrawing ? 'cursor-not-allowed opacity-50' : ''"
                      @click="showDesignPanel = !showDesignPanel"
                    >
                      ⚙
                    </button>

                    <button
                      type="button"
                      class="min-w-[150px] rounded-full bg-white px-6 py-3 text-base font-black text-orange-600 shadow-xl transition hover:-translate-y-0.5 hover:bg-yellow-50 sm:min-w-[170px] sm:px-8"
                      :disabled="isDrawing"
                      :class="isDrawing ? 'cursor-not-allowed opacity-70' : ''"
                      @click="shareCampaign"
                    >
                      {{ isDrawing ? '抽選中...' : campaign.buttonText }}
                    </button>

                    <button
                      v-if="isAdminMode"
                      type="button"
                      class="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-xl font-black shadow-inner backdrop-blur transition hover:bg-white/30"
                      :disabled="isDrawing"
                      :class="isDrawing ? 'cursor-not-allowed opacity-50' : ''"
                      @click="resetDemo"
                    >
                      ⟳
                    </button>
                  </div>

                  <p class="mt-2 text-xs font-bold leading-5 text-white/75">
                    {{ campaign.shareHint }}，目前已分享 {{ player.sharedCount }} 次
                  </p>

                  <div
                    v-if="showShareMessage"
                    class="mx-auto mt-3 max-w-xs rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-xs font-black leading-5 text-white shadow-inner backdrop-blur"
                  >
                    {{ shareMessage }}
                  </div>

                  <div
                    v-if="drawingStatusText"
                    class="mx-auto mt-3 max-w-xs rounded-2xl border border-yellow-200/60 bg-yellow-100 px-4 py-3 text-xs font-black leading-5 text-orange-700 shadow-lg"
                  >
                    {{ drawingStatusText }}
                  </div>
                </section>

                <section
                  v-if="!isAdminMode"
                  class="relative mt-5 rounded-3xl bg-white/15 p-4 text-center shadow-inner backdrop-blur"
                >
                  <p class="text-sm font-black text-white">
                    活動參加方式
                  </p>

                  <p class="mt-2 text-xs font-bold leading-6 text-white/75">
                    點擊九宮格中間按鈕開始抽獎，中獎後會自動寫入遊戲紀錄。分享活動會複製活動連結並增加抽獎機會。
                  </p>

                  <p class="mt-3 break-all rounded-2xl bg-white/10 px-3 py-2 text-[11px] font-bold leading-5 text-white/70">
                    活動連結：{{ getShareUrl() }}
                  </p>
                </section>

                <section
                  v-if="!isAdminMode && player.chances <= 0 && availablePrizeCount > 0"
                  class="relative mt-4 rounded-3xl border border-white/30 bg-white/20 p-4 text-center shadow-inner backdrop-blur"
                >
                  <p class="text-sm font-black text-white">
                    抽獎機會已用完
                  </p>

                  <p class="mt-2 text-xs font-bold leading-6 text-white/75">
                    分享活動可立即增加 1 次抽獎機會，複製活動連結後可以繼續抽。
                  </p>

                  <button
                    type="button"
                    class="mt-3 rounded-full bg-white px-5 py-2.5 text-xs font-black text-orange-600 shadow-lg transition hover:bg-yellow-50"
                    @click="shareCampaign"
                  >
                    分享增加機會
                  </button>
                </section>

                <section
                  v-if="!isAdminMode && availablePrizeCount <= 0"
                  class="relative mt-4 rounded-3xl border border-white/30 bg-white/20 p-4 text-center shadow-inner backdrop-blur"
                >
                  <p class="text-sm font-black text-white">
                    獎品已抽完
                  </p>

                  <p class="mt-2 text-xs font-bold leading-6 text-white/75">
                    目前所有可抽獎品都已沒有庫存，請等待主辦單位更新活動。
                  </p>
                </section>

                <section
                  v-if="!isAdminMode"
                  class="relative mt-4 space-y-3"
                >
                  <div class="overflow-hidden rounded-3xl bg-white/95 shadow-xl">
                    <button
                      type="button"
                      class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                      @click="showPlayerRules = !showPlayerRules"
                    >
                      <div>
                        <p class="text-sm font-black text-slate-800">
                          活動規則
                        </p>

                        <p class="mt-1 text-xs font-bold text-slate-400">
                          點擊展開查看參加方式
                        </p>
                      </div>

                      <span class="text-lg font-black text-orange-500">
                        {{ showPlayerRules ? '−' : '+' }}
                      </span>
                    </button>

                    <div
                      v-if="showPlayerRules"
                      class="border-t border-slate-100 px-4 pb-4 pt-3"
                    >
                      <ul class="space-y-2">
                        <li
                          v-for="rule in playerRuleItems"
                          :key="rule"
                          class="flex gap-2 text-xs font-bold leading-5 text-slate-500"
                        >
                          <span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400"></span>
                          <span>{{ rule }}</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div class="overflow-hidden rounded-3xl bg-white/95 shadow-xl">
                    <button
                      type="button"
                      class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                      @click="showPrizeNotes = !showPrizeNotes"
                    >
                      <div>
                        <p class="text-sm font-black text-slate-800">
                          獎品說明
                        </p>

                        <p class="mt-1 text-xs font-bold text-slate-400">
                          點擊展開查看獎品規則
                        </p>
                      </div>

                      <span class="text-lg font-black text-orange-500">
                        {{ showPrizeNotes ? '−' : '+' }}
                      </span>
                    </button>

                    <div
                      v-if="showPrizeNotes"
                      class="border-t border-slate-100 px-4 pb-4 pt-3"
                    >
                      <ul class="space-y-2">
                        <li
                          v-for="note in prizeNoteItems"
                          :key="note"
                          class="flex gap-2 text-xs font-bold leading-5 text-slate-500"
                        >
                          <span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400"></span>
                          <span>{{ note }}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section class="relative mt-5 overflow-hidden rounded-3xl bg-white/95 p-3 shadow-xl">
                  <div class="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
                    <p class="text-xs font-black text-slate-700">
                      獎品展示
                    </p>

                    <p class="text-[10px] font-bold text-slate-400">
                      可橫向滑動
                    </p>
                  </div>

                  <div class="mt-3 flex gap-3 overflow-x-auto pb-1 premium-scrollbar">
                    <article
                      v-for="reward in rewardTicker"
                      :key="reward.id"
                      class="w-20 shrink-0 text-center"
                    >
                      <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-yellow-200 bg-gradient-to-br from-yellow-100 to-orange-200 text-3xl shadow-inner">
                        <img
                          v-if="reward.imageUrl"
                          :src="reward.imageUrl"
                          :alt="reward.title"
                          class="h-full w-full rounded-2xl object-cover"
                        />

                        <span v-else>
                          {{ reward.icon }}
                        </span>
                      </div>

                      <p class="mt-1 truncate text-[10px] font-black text-slate-600">
                        {{ reward.title }}
                      </p>
                    </article>
                  </div>
                </section>

                <section
                  v-if="drawLogs.length"
                  class="relative mt-4 rounded-3xl bg-white/15 p-4 backdrop-blur"
                >
                  <h3 class="text-sm font-black text-white">
                    最新中獎紀錄
                  </h3>

                  <div class="mt-3 space-y-2">
                    <div
                      v-for="log in drawLogs"
                      :key="log.id"
                      class="flex items-center justify-between rounded-2xl bg-white/15 px-3 py-2 text-xs font-bold text-white"
                    >
                      <span>{{ log.icon }} {{ log.prizeName }}</span>
                      <span class="text-white/70">{{ log.createdAt }}</span>
                    </div>
                  </div>
                </section>

                <section
                  v-if="isAdminMode && showDesignPanel"
                  class="relative mt-4 rounded-3xl bg-white p-4 text-slate-900 shadow-2xl"
                >
                  <div class="flex items-center justify-between gap-3">
                    <div>
                      <h3 class="text-sm font-black text-slate-900">
                        管理預覽設定
                      </h3>

                      <p class="mt-1 text-xs font-bold text-slate-500">
                        這裡只有管理預覽模式會顯示，玩家一般模式不會看到。
                      </p>
                    </div>

                    <div class="flex flex-wrap gap-2">
                      <button
                        type="button"
                        class="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-600 transition hover:bg-blue-100"
                        @click="exportPremiumGridState"
                      >
                        匯出
                      </button>

                      <button
                        type="button"
                        class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-600 transition hover:bg-emerald-100"
                        @click="importPremiumGridState"
                      >
                        匯入
                      </button>

                      <button
                        type="button"
                        class="rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-500 transition hover:bg-rose-100"
                        @click="clearPremiumGridState"
                      >
                        清除保存
                      </button>

                      <button
                        type="button"
                        class="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500 transition hover:bg-slate-200"
                        @click="showDesignPanel = false"
                      >
                        收合
                      </button>
                    </div>
                  </div>

                  <div class="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-xs font-bold leading-5 text-blue-700">
                    <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <span>本機保存狀態：{{ getSavedStateText() }}</span>
                      <span>支援匯出 / 匯入示範資料</span>
                    </div>
                  </div>

                  <div
                    v-if="storageMessage"
                    class="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-black text-emerald-700"
                  >
                    {{ storageMessage }}
                  </div>

                  <div class="mt-4 rounded-3xl border border-orange-100 bg-orange-50 p-4">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h4 class="text-sm font-black text-orange-900">
                          品牌橫幅快速工具
                        </h4>

                        <p class="mt-1 text-xs font-bold leading-5 text-orange-700">
                          可快速套用範例或清空 LOGO、Banner、網站連結，方便測試玩家版最上方視覺；手機版網站按鈕會自動換行顯示。
                        </p>
                      </div>

                      <div class="flex flex-wrap gap-2">
                        <button
                          type="button"
                          class="rounded-2xl bg-orange-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-orange-700"
                          @click="applyBrandBannerDemo"
                        >
                          套用範例
                        </button>

                        <button
                          type="button"
                          class="rounded-2xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-black text-rose-600 transition hover:bg-rose-50"
                          @click="clearBrandBannerSettings"
                        >
                          清空品牌圖
                        </button>

                        <button
                          type="button"
                          class="rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-xs font-black text-emerald-600 transition hover:bg-emerald-50"
                          @click="importBrandBannerSettings"
                        >
                          貼上匯入
                        </button>

                        <button
                          type="button"
                          class="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                          @click="downloadBrandBannerSettings"
                        >
                          下載設定
                        </button>

                        <button
                          type="button"
                          class="rounded-2xl border border-purple-200 bg-white px-4 py-2.5 text-xs font-black text-purple-600 transition hover:bg-purple-50"
                          @click="openBrandImportFilePicker"
                        >
                          選檔匯入
                        </button>
                      </div>
                    </div>
                  </div>

                  <div class="mt-5 rounded-3xl border border-amber-100 bg-amber-50 p-4">
                    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h4 class="text-sm font-black text-amber-900">
                          品牌橫幅預設風格
                        </h4>

                        <p class="mt-1 text-xs font-bold leading-5 text-amber-700">
                          一鍵套用常用品牌視覺，之後仍可自行修改 LOGO、Banner 與網站連結。
                        </p>
                      </div>

                      <span class="rounded-full bg-white px-3 py-1 text-xs font-black text-amber-700">
                        快速套版
                      </span>
                    </div>

                    <div class="mt-4 grid gap-3 sm:grid-cols-3">
                      <button
                        v-for="preset in brandPresetOptions"
                        :key="preset.id"
                        type="button"
                        class="rounded-2xl border border-amber-100 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
                        @click="applyBrandPreset(preset)"
                      >
                        <div class="text-2xl">
                          {{ preset.icon }}
                        </div>

                        <div class="mt-2 flex flex-wrap items-center gap-2">
                          <p class="text-sm font-black text-slate-900">
                            {{ preset.name }}
                          </p>

                          <span
                            v-if="campaign.lastAppliedPreset === preset.name"
                            class="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700"
                          >
                            已套用
                          </span>
                        </div>

                        <p class="mt-1 text-xs font-bold leading-5 text-slate-500">
                          {{ preset.description }}
                        </p>
                      </button>
                    </div>
                  </div>

                  <div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <label class="grid gap-1 text-xs font-black text-slate-600">
                      品牌名稱
                      <input
                        v-model="campaign.brandName"
                        class="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                      />
                    </label>

                    <label class="grid gap-1 text-xs font-black text-slate-600">
                      品牌標語
                      <input
                        v-model="campaign.brandTagline"
                        placeholder="例如：打造專屬互動抽獎體驗"
                        class="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                      />
                    </label>

                    <label class="grid gap-1 text-xs font-black text-slate-600">
                      主標題
                      <input
                        v-model="campaign.mainTitle"
                        class="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                      />
                    </label>

                    <label class="grid gap-1 text-xs font-black text-slate-600">
                      副標題
                      <input
                        v-model="campaign.heroTagline"
                        class="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                      />
                    </label>

                    <label class="grid gap-1 text-xs font-black text-slate-600 sm:col-span-2 xl:col-span-1">
                      主視覺圖片網址，可空白
                      <input
                        v-model="campaign.topImageUrl"
                        placeholder="https://..."
                        class="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                      />
                    </label>

                    <label class="grid gap-1 text-xs font-black text-slate-600 sm:col-span-2 xl:col-span-1">
                      背景圖片網址，可空白
                      <input
                        v-model="campaign.backgroundImageUrl"
                        placeholder="https://..."
                        class="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                      />
                    </label>

                    <label class="grid gap-1 text-xs font-black text-slate-600 sm:col-span-2 xl:col-span-1">
                      LOGO 圖片網址，可空白
                      <input
                        v-model="campaign.logoImageUrl"
                        placeholder="https://..."
                        class="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                      />
                    </label>

                    <label class="grid gap-1 text-xs font-black text-slate-600 sm:col-span-2 xl:col-span-1">
                      Banner 橫幅圖片網址，可空白
                      <input
                        v-model="campaign.bannerImageUrl"
                        placeholder="https://..."
                        class="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                      />
                    </label>

                    <label class="grid gap-1 text-xs font-black text-slate-600">
                      網站按鈕文字
                      <input
                        v-model="campaign.websiteText"
                        placeholder="官方網站"
                        class="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                      />
                    </label>

                    <label class="grid gap-1 text-xs font-black text-slate-600">
                      網站連結網址
                      <input
                        v-model="campaign.websiteUrl"
                        placeholder="例如：https://example.com 或 example.com"
                        class="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                      />
                    </label>

                    <div class="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-xs font-bold leading-5 text-blue-700 sm:col-span-2 xl:col-span-1">
                      <p class="font-black">
                        目前網站連結預覽
                      </p>

                      <p class="mt-1 break-all">
                        {{ safeWebsiteUrl || '尚未設定網站連結' }}
                      </p>
                    </div>
                  </div>

                  <div class="mt-5 rounded-3xl border border-indigo-100 bg-indigo-50 p-4">
                    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h4 class="text-sm font-black text-indigo-900">
                          品牌橫幅顯示模式
                        </h4>

                        <p class="mt-1 text-xs font-bold leading-5 text-indigo-700">
                          選擇玩家版最上方品牌橫幅的排列方式，目前使用：{{ getBannerLayoutLabel() }}
                        </p>
                      </div>
                    </div>

                    <div class="mt-4 grid gap-3 sm:grid-cols-3">
                      <button
                        v-for="option in bannerLayoutOptions"
                        :key="option.value"
                        type="button"
                        class="rounded-2xl border p-3 text-left transition"
                        :class="campaign.bannerLayout === option.value
                          ? 'border-indigo-500 bg-white text-indigo-700 shadow-sm'
                          : 'border-indigo-100 bg-white/60 text-slate-600 hover:bg-white'
                        "
                        @click="applyBannerLayout(option.value)"
                      >
                        <p class="text-sm font-black">
                          {{ option.label }}
                        </p>

                        <p class="mt-1 text-xs font-bold leading-5 opacity-75">
                          {{ option.description }}
                        </p>
                      </button>
                    </div>
                  </div>

                  <div class="mt-5 rounded-3xl border border-rose-100 bg-rose-50 p-4">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h4 class="text-sm font-black text-rose-900">
                          品牌主色系設定
                        </h4>

                        <p class="mt-1 text-xs font-bold leading-5 text-rose-700">
                          可手動調整玩家活動頁背景漸層色，支援 #RRGGBB 或 RRGGBB 色碼；套用時會自動整理成標準格式，並即時提示每個欄位是否正確；色碼錯誤時會停用套用按鈕，也可複製、下載、貼上匯入或選檔匯入目前色系。
                        </p>
                      </div>

                      <div class="flex flex-wrap gap-2">
                        <button
                          type="button"
                          class="rounded-full bg-white px-3 py-1 text-xs font-black text-rose-600 transition hover:bg-rose-100"
                          @click="toggleThemeTools"
                        >
                          {{ showThemeTools ? '收合色系工具' : '展開色系工具' }}
                        </button>

                        <button
                          v-if="showThemeTools"
                          type="button"
                          class="rounded-full bg-white px-3 py-1 text-xs font-black text-indigo-600 transition hover:bg-indigo-50"
                          @click="toggleThemeGuide"
                        >
                          {{ showThemeGuide ? '隱藏說明' : '顯示說明' }}
                        </button>

                        <button
                          type="button"
                          class="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 transition hover:bg-slate-50"
                          @click="resetThemePanelState"
                        >
                          還原顯示
                        </button>

                        <button
                          type="button"
                          class="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-600 transition hover:bg-blue-50"
                          @click="copyThemePanelState"
                        >
                          複製狀態
                        </button>

                        <button
                          type="button"
                          class="rounded-full bg-white px-3 py-1 text-xs font-black text-purple-600 transition hover:bg-purple-50"
                          @click="downloadThemePanelStateJson"
                        >
                          下載狀態
                        </button>

                        <button
                          type="button"
                          class="rounded-full px-3 py-1 text-xs font-black transition"
                          :class="canApplyManualThemeColors
                            ? 'bg-rose-600 text-white hover:bg-rose-700'
                            : 'cursor-not-allowed bg-rose-100 text-rose-400'
                          "
                          :disabled="!canApplyManualThemeColors"
                          @click="applyThemeColors"
                        >
                          {{ applyThemeColorsButtonText }}
                        </button>

                        <button
                          type="button"
                          class="rounded-full bg-white px-3 py-1 text-xs font-black text-rose-600 transition hover:bg-rose-100"
                          @click="resetThemeColors"
                        >
                          還原預設
                        </button>

                        <button
                          type="button"
                          class="rounded-full px-3 py-1 text-xs font-black transition"
                          :class="hasPreviousThemeColors
                            ? 'bg-slate-900 text-white hover:bg-slate-700'
                            : 'cursor-not-allowed bg-slate-100 text-slate-400'
                          "
                          :disabled="!hasPreviousThemeColors"
                          @click="restorePreviousThemeColors"
                        >
                          回復上一組
                        </button>

                        <button
                          type="button"
                          class="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-600 transition hover:bg-blue-50"
                          @click="copyThemeColorsJson"
                        >
                          複製色系 JSON
                        </button>

                        <button
                          type="button"
                          class="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-600 transition hover:bg-emerald-50"
                          @click="copyThemeColorsText"
                        >
                          複製色碼
                        </button>

                        <button
                          type="button"
                          class="rounded-full bg-white px-3 py-1 text-xs font-black text-purple-600 transition hover:bg-purple-50"
                          @click="importThemeColorsJson"
                        >
                          貼上匯入
                        </button>

                        <button
                          type="button"
                          class="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                          @click="downloadThemeColorsJson"
                        >
                          下載色系
                        </button>

                        <button
                          type="button"
                          class="rounded-full bg-white px-3 py-1 text-xs font-black text-indigo-600 transition hover:bg-indigo-50"
                          @click="openThemeImportFilePicker"
                        >
                          選檔匯入
                        </button>

                        <button
                          type="button"
                          class="rounded-full bg-white px-3 py-1 text-xs font-black text-orange-600 transition hover:bg-orange-50"
                          @click="copyThemeFileName"
                        >
                          複製檔名
                        </button>

                        <button
                          type="button"
                          class="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500 transition hover:bg-slate-50"
                          @click="clearLastThemeAction"
                        >
                          清除紀錄
                        </button>
                      </div>
                    </div>

                    <input
                      ref="themeImportFileInput"
                      type="file"
                      accept="application/json,.json"
                      class="hidden"
                      @change="handleThemeImportFileChange"
                    />

                    <div
                      v-if="showThemeTools && showThemeGuide"
                      class="mt-4 rounded-3xl border border-rose-100 bg-white p-4"
                    >
                      <div class="flex items-center justify-between gap-3">
                        <div>
                          <h5 class="text-sm font-black text-slate-900">
                            操作說明
                          </h5>

                          <p class="mt-1 text-xs font-bold leading-5 text-slate-500">
                            不確定按鈕用途時，可以先看這裡，也可以複製成文字；此區可單獨顯示或隱藏。
                          </p>
                        </div>

                        <div class="flex flex-wrap gap-2">
                          <span class="rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-600">
                            Guide
                          </span>

                          <button
                            type="button"
                            class="rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white transition hover:bg-slate-700"
                            @click="copyThemeToolGuide"
                          >
                            複製說明
                          </button>
                        </div>
                      </div>

                      <div class="mt-4 grid gap-3 sm:grid-cols-2">
                        <article
                          v-for="guide in themeToolGuideItems"
                          :key="guide.title"
                          class="rounded-2xl bg-slate-50 p-3"
                        >
                          <p class="text-xs font-black text-slate-800">
                            {{ guide.title }}
                          </p>

                          <p class="mt-1 text-xs font-bold leading-5 text-slate-500">
                            {{ guide.description }}
                          </p>
                        </article>
                      </div>
                    </div>

                    <div
                      v-if="showThemeTools && !showThemeGuide"
                      class="mt-4 rounded-3xl border border-indigo-100 bg-indigo-50 p-4 text-center"
                    >
                      <p class="text-sm font-black text-indigo-800">
                        操作說明已隱藏
                      </p>

                      <p class="mt-1 text-xs font-bold text-indigo-500">
                        可按「顯示說明」再次展開，或按「還原顯示」恢復預設管理狀態。
                      </p>
                    </div>

                    <div class="mt-4 rounded-3xl border border-white/70 bg-white p-4">
                      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <h5 class="text-sm font-black text-slate-900">
                            主色系設定摘要
                          </h5>

                          <p class="mt-1 text-xs font-bold leading-5 text-slate-500">
                            下載或交付前可先確認目前色系狀態，也可以單獨複製某一段色碼；最後操作紀錄可手動清除。
                          </p>
                        </div>

                        <span
                          class="rounded-full px-3 py-1 text-xs font-black"
                          :class="hasLightThemeWarning ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'"
                        >
                          {{ themeColorSummary.warning }}
                        </span>
                      </div>

                      <div class="mt-4 grid gap-2 text-xs font-bold leading-5 text-slate-600 sm:grid-cols-2">
                        <p>上方背景色：{{ themeColorSummary.themeStart }}</p>
                        <p>中段背景色：{{ themeColorSummary.themeMiddle }}</p>
                        <p>底部背景色：{{ themeColorSummary.themeEnd }}</p>
                        <p>最近色系：{{ themeColorSummary.lastPalette }}</p>
                        <p>可回復：{{ themeColorSummary.previousTheme }}</p>
                        <p>管理區狀態：{{ showThemeTools ? '工具展開' : '工具收合' }} / {{ showThemeGuide ? '說明顯示' : '說明隱藏' }}</p>
                        <p class="break-all">最後操作：{{ themeColorSummary.lastThemeAction }}</p>
                        <p class="break-all">檔名建議：{{ themeColorSummary.suggestedFileName }}</p>
                      </div>
                    </div>

                    <div
                      v-if="!showThemeTools"
                      class="mt-4 rounded-3xl border border-rose-100 bg-white p-4 text-center"
                    >
                      <p class="text-sm font-black text-slate-700">
                        主色系工具已收合
                      </p>

                      <p class="mt-1 text-xs font-bold leading-5 text-slate-400">
                        摘要仍會保留；可按「展開色系工具」繼續調整推薦色系、手動色碼與預覽。
                      </p>
                    </div>

                    <div
                      class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
                      :class="showThemeTools ? '' : 'hidden'"
                    >
                      <button
                        v-for="palette in themePaletteOptions"
                        :key="palette.id"
                        type="button"
                        class="rounded-2xl border border-rose-100 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-md"
                        @click="applyThemePalette(palette)"
                      >
                        <div class="flex items-center justify-between gap-2">
                          <span class="text-2xl">
                            {{ palette.icon }}
                          </span>

                          <span class="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-600">
                            推薦
                          </span>
                        </div>

                        <div class="mt-2 flex flex-wrap items-center gap-2">
                          <p class="text-sm font-black text-slate-900">
                            {{ palette.name }}
                          </p>

                          <span
                            v-if="campaign.lastAppliedThemePalette === palette.name"
                            class="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700"
                          >
                            已套用
                          </span>
                        </div>

                        <p class="mt-1 text-xs font-bold leading-5 text-slate-500">
                          {{ palette.description }}
                        </p>

                        <div class="mt-3 grid grid-cols-3 gap-1">
                          <span
                            class="h-5 rounded-lg"
                            :style="{ backgroundColor: palette.themeStart }"
                          ></span>
                          <span
                            class="h-5 rounded-lg"
                            :style="{ backgroundColor: palette.themeMiddle }"
                          ></span>
                          <span
                            class="h-5 rounded-lg"
                            :style="{ backgroundColor: palette.themeEnd }"
                          ></span>
                        </div>
                      </button>
                    </div>

                    <div
                      class="mt-4 grid gap-3 sm:grid-cols-3"
                      :class="showThemeTools ? '' : 'hidden'"
                    >
                      <label
                        v-for="item in colorInputItems"
                        :key="item.key"
                        class="rounded-2xl bg-white p-3"
                      >
                        <p class="text-xs font-black text-slate-700">
                          {{ item.label }}
                        </p>

                        <p class="mt-1 text-[11px] font-bold leading-4 text-slate-400">
                          {{ item.description }}
                        </p>

                        <div class="mt-3 flex items-center gap-2">
                          <input
                            v-model="campaign[item.key]"
                            type="color"
                            class="h-10 w-12 shrink-0 cursor-pointer rounded-xl border border-slate-200 bg-white"
                          />

                          <input
                            v-model="campaign[item.key]"
                            class="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold outline-none focus:border-rose-400"
                            placeholder="#FFB237 或 FFB237"
                          />
                        </div>

                        <p
                          class="mt-2 rounded-xl px-2.5 py-1.5 text-[11px] font-black"
                          :class="isThemeColorInputValid(item.key)
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                          "
                        >
                          {{ getThemeColorInputStatus(item.key) }}
                        </p>
                      </label>
                    </div>

                    <p
                      v-if="!canApplyManualThemeColors"
                      class="mt-3 rounded-2xl bg-amber-100 px-4 py-3 text-xs font-black leading-5 text-amber-700"
                    >
                      {{ validateManualThemeColors().message }}
                    </p>

                    <div
                      class="mt-4 grid gap-3 lg:grid-cols-[1fr_1.2fr]"
                      :class="showThemeTools ? '' : 'hidden'"
                    >
                      <div class="rounded-3xl bg-white p-4">
                        <p class="text-xs font-black text-slate-700">
                          三段主色預覽
                        </p>

                        <div class="mt-3 grid grid-cols-3 gap-2">
                          <div
                            v-for="item in themeColorPreviewItems"
                            :key="item.label"
                            class="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50"
                          >
                            <div
                              class="h-14"
                              :style="{ backgroundColor: item.value }"
                            ></div>

                            <div class="p-2">
                              <p class="text-[11px] font-black text-slate-600">
                                {{ item.label }}
                              </p>

                              <p class="mt-0.5 truncate text-[10px] font-bold text-slate-400">
                                {{ item.value }}
                              </p>

                              <button
                                type="button"
                                class="mt-2 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600 transition hover:bg-slate-200"
                                :title="`複製${item.label}背景色 ${item.value}`"
                                @click="copySingleThemeColor(item)"
                              >
                                複製
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="rounded-3xl bg-white p-4">
                        <div class="flex items-center justify-between gap-3">
                          <p class="text-xs font-black text-slate-700">
                            玩家背景漸層預覽
                          </p>

                          <span
                            v-if="hasLightThemeWarning"
                            class="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-700"
                          >
                            亮色提醒
                          </span>
                        </div>

                        <div
                          class="mt-3 flex h-24 items-center justify-center rounded-2xl p-4 text-center text-sm font-black text-white shadow-inner"
                          :style="themePreviewStyle"
                        >
                          玩家頁背景效果
                        </div>

                        <p class="mt-2 text-xs font-bold leading-5 text-slate-400">
                          {{ hasLightThemeWarning ? '目前有顏色偏亮，玩家頁白色文字可能較不清楚，建議搭配較深的中段或底部顏色。' : '目前主色系對比正常，適合玩家頁使用。' }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="mt-5 rounded-3xl border border-blue-100 bg-blue-50 p-4">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h4 class="text-sm font-black text-blue-900">
                          品牌橫幅保存摘要
                        </h4>

                        <p class="mt-1 text-xs font-bold leading-5 text-blue-700">
                          這些內容會跟著本機保存、匯出與匯入一起同步，也可以單獨複製成 JSON，再貼到其他活動匯入，也可以下載成獨立 JSON 檔，再用選檔匯入；匯入時會自動檢查格式與欄位。
                        </p>
                      </div>

                      <div class="flex flex-wrap gap-2">
                        <span class="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-600">
                          已同步
                        </span>

                        <button
                          type="button"
                          class="rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white transition hover:bg-blue-700"
                          @click="copyBrandBannerSettings"
                        >
                          複製品牌設定
                        </button>

                        <button
                          type="button"
                          class="rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white transition hover:bg-slate-700"
                          @click="downloadBrandBannerSettings"
                        >
                          下載品牌設定
                        </button>

                        <button
                          type="button"
                          class="rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white transition hover:bg-emerald-700"
                          @click="importBrandBannerSettings"
                        >
                          貼上匯入
                        </button>

                        <button
                          type="button"
                          class="rounded-full bg-purple-600 px-3 py-1 text-xs font-black text-white transition hover:bg-purple-700"
                          @click="openBrandImportFilePicker"
                        >
                          選檔匯入
                        </button>
                      </div>
                    </div>

                    <input
                      ref="brandImportFileInput"
                      type="file"
                      accept="application/json,.json"
                      class="hidden"
                      @change="handleBrandImportFileChange"
                    />

                    <div class="mt-4 grid gap-2 text-xs font-bold leading-5 text-blue-700 sm:grid-cols-2">
                      <p>顯示模式：{{ brandBannerSummary.layout }}</p>
                      <p>品牌名稱：{{ brandBannerSummary.brandName }}</p>
                      <p>品牌標語：{{ brandBannerSummary.brandTagline }}</p>
                      <p>最近預設：{{ brandBannerSummary.lastAppliedPreset }}</p>
                      <p>主色系：{{ campaign.themeStart }} / {{ campaign.themeMiddle }} / {{ campaign.themeEnd }}</p>
                      <p>最近色系：{{ brandBannerSummary.lastAppliedThemePalette }}</p>
                      <p>可回復色系：{{ brandBannerSummary.previousThemeLabel }}</p>
                      <p>LOGO 圖片：{{ brandBannerSummary.hasLogoImage ? '已設定' : '未設定' }}</p>
                      <p>Banner 圖片：{{ brandBannerSummary.hasBannerImage ? '已設定' : '未設定' }}</p>
                      <p class="break-all">網站連結：{{ brandBannerSummary.websiteUrl }}</p>
                    </div>
                  </div>

                  <div class="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h4 class="text-sm font-black text-slate-900">
                          品牌圖片預覽
                        </h4>

                        <p class="mt-1 text-xs font-bold leading-5 text-slate-500">
                          用來檢查 LOGO 與 Banner 圖片網址是否正確。
                        </p>
                      </div>

                      <span class="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500">
                        即時預覽
                      </span>
                    </div>

                    <div class="mt-4 grid gap-4 sm:grid-cols-2">
                      <div class="rounded-3xl border border-slate-200 bg-white p-4">
                        <p class="text-xs font-black text-slate-500">
                          LOGO 預覽
                        </p>

                        <div class="mt-3 flex h-28 items-center justify-center rounded-2xl bg-slate-100 p-3">
                          <img
                            v-if="hasLogoImage"
                            :src="campaign.logoImageUrl"
                            alt="LOGO 預覽"
                            class="max-h-full max-w-full object-contain"
                            @error="handleLogoImageError"
                          />

                          <div
                            v-else
                            class="flex h-16 w-16 items-center justify-center rounded-2xl border-[4px] border-yellow-200 bg-gradient-to-br from-amber-300 to-orange-500 text-3xl font-black text-white shadow-lg"
                          >
                            {{ campaign.logoText }}
                          </div>
                        </div>

                        <p class="mt-2 text-xs font-bold leading-5 text-slate-400">
                          {{ hasLogoImage ? '目前使用 LOGO 圖片。' : logoImageError ? 'LOGO 圖片載入失敗，目前使用文字 LOGO。' : '目前使用文字 LOGO。' }}
                        </p>
                      </div>

                      <div class="rounded-3xl border border-slate-200 bg-white p-4">
                        <p class="text-xs font-black text-slate-500">
                          Banner 預覽
                        </p>

                        <div
                          class="mt-3 flex h-28 items-center justify-center overflow-hidden rounded-2xl p-3 text-center text-xs font-black text-white"
                          :style="bannerBackgroundStyle"
                        >
                          <span>
                            {{ hasBannerImage ? 'Banner 圖片已套用' : bannerImageError ? 'Banner 圖片載入失敗，已使用預設漸層 Banner' : '目前使用預設漸層 Banner' }}
                          </span>
                        </div>

                        <p class="mt-2 text-xs font-bold leading-5 text-slate-400">
                          {{ hasBannerImage ? '玩家版最上方會套用這張 Banner。' : bannerImageError ? 'Banner 圖片網址可能無法讀取，玩家版會使用漸層背景。' : '沒有圖片時會使用漸層背景。' }}
                        </p>

                        <img
                          v-if="campaign.bannerImageUrl"
                          :src="campaign.bannerImageUrl"
                          alt=""
                          class="hidden"
                          @error="handleBannerImageError"
                        />
                      </div>
                    </div>
                  </div>

                  <div class="mt-5 rounded-3xl border border-orange-100 bg-orange-50 p-4">
                    <h4 class="text-sm font-black text-orange-900">
                      玩家次數設定
                    </h4>

                    <div class="mt-4 grid gap-3 sm:grid-cols-2">
                      <label class="grid gap-1 text-xs font-black text-orange-700">
                        剩餘抽獎次數
                        <input
                          v-model.number="player.chances"
                          type="number"
                          min="0"
                          class="rounded-2xl border border-orange-100 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400"
                        />
                      </label>

                      <label class="grid gap-1 text-xs font-black text-orange-700">
                        已分享次數
                        <input
                          v-model.number="player.sharedCount"
                          type="number"
                          min="0"
                          class="rounded-2xl border border-orange-100 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400"
                        />
                      </label>
                    </div>
                  </div>

                  <div class="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <h4 class="text-sm font-black text-slate-900">
                      獎項快速編輯
                    </h4>

                    <p class="mt-1 text-xs font-bold leading-5 text-slate-500">
                      修改後會立即同步畫面並自動保存。
                    </p>

                    <div class="mt-4 space-y-4">
                      <article
                        v-for="item in gridItems.filter((gridItem) => !gridItem.isButton)"
                        :key="item.id"
                        class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div class="flex items-start gap-3">
                          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-100 to-orange-100 text-2xl">
                            <img
                              v-if="item.imageUrl"
                              :src="item.imageUrl"
                              :alt="item.name"
                              class="h-full w-full rounded-2xl object-cover"
                            />

                            <span v-else>
                              {{ item.icon }}
                            </span>
                          </div>

                          <div class="min-w-0 flex-1">
                            <p class="truncate text-sm font-black text-slate-900">
                              {{ item.name || '未命名獎項' }}
                            </p>

                            <p class="mt-1 text-xs font-bold text-slate-400">
                              權重 {{ Number(item.weight || 0) }}｜庫存 {{ Number(item.quantity || 0) }}
                            </p>
                          </div>
                        </div>

                        <div class="mt-4 grid gap-3 sm:grid-cols-2">
                          <label class="grid gap-1 text-xs font-black text-slate-600">
                            獎項名稱
                            <input
                              v-model="item.name"
                              class="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                            />
                          </label>

                          <label class="grid gap-1 text-xs font-black text-slate-600">
                            短名稱
                            <input
                              v-model="item.shortName"
                              class="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                            />
                          </label>

                          <label class="grid gap-1 text-xs font-black text-slate-600">
                            Emoji 圖示
                            <input
                              v-model="item.icon"
                              class="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                            />
                          </label>

                          <label class="grid gap-1 text-xs font-black text-slate-600">
                            圖片網址，可空白
                            <input
                              v-model="item.imageUrl"
                              placeholder="https://..."
                              class="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                            />
                          </label>

                          <label class="grid gap-1 text-xs font-black text-slate-600">
                            中獎權重
                            <input
                              v-model.number="item.weight"
                              type="number"
                              min="0"
                              class="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                            />
                          </label>

                          <label class="grid gap-1 text-xs font-black text-slate-600">
                            剩餘庫存
                            <input
                              v-model.number="item.quantity"
                              type="number"
                              min="0"
                              class="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                            />
                          </label>
                        </div>
                      </article>
                    </div>
                  </div>
                </section>

                <section
                  v-if="!isAdminMode"
                  class="relative mt-4 grid gap-3 sm:grid-cols-2"
                >
                  <button
                    type="button"
                    class="rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-sm font-black text-white shadow-inner backdrop-blur transition hover:bg-white/30"
                    @click="goGameHistory"
                  >
                    查看我的紀錄
                  </button>

                  <button
                    type="button"
                    class="rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-sm font-black text-white shadow-inner backdrop-blur transition hover:bg-white/30"
                    @click="goGamesCenter"
                  >
                    回遊戲中心
                  </button>
                </section>

                <p class="relative mt-4 text-center text-[11px] font-bold leading-5 text-white/70">
                  {{ isAdminMode ? campaign.noticeText : '請依照活動規則參加抽獎；獎項與兌換方式以主辦單位公告為準。' }}
                </p>
              </main>

              <div class="pointer-events-none absolute inset-x-0 bottom-2 mx-auto hidden h-1.5 w-32 rounded-full bg-slate-900/80 sm:block"></div>
            </div>
          </div>
        </section>

        <aside
          v-if="isAdminMode"
          class="order-3 grid gap-5 md:grid-cols-2 xl:sticky xl:top-6 xl:grid-cols-1"
        >
          <section class="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-xl backdrop-blur">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-xs font-black uppercase tracking-[0.25em] text-orange-500">
                  Campaign Data
                </p>

                <h2 class="mt-2 text-xl font-black text-slate-900">
                  活動資訊面板
                </h2>
              </div>

              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-3xl">
                📊
              </div>
            </div>

            <div class="mt-5 rounded-3xl border border-slate-200 bg-white p-4">
              <p class="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                Version Info
              </p>

              <h3 class="mt-2 text-lg font-black text-slate-900">
                {{ premiumVersionInfo.version }}
              </h3>

              <div class="mt-3 grid gap-2 text-xs font-bold leading-5 text-slate-500">
                <p>
                  平台版本：{{ premiumVersionInfo.platformVersion }}
                </p>

                <p>
                  開發批次：{{ premiumVersionInfo.batch }}
                </p>

                <p>
                  目前模式：{{ isAdminMode ? premiumVersionInfo.adminMode : premiumVersionInfo.playerMode }}
                </p>

                <p>
                  活動 ID：{{ currentGameId }}
                </p>

                <p class="break-all">
                  玩家版路徑：{{ sourcePath }}
                </p>

                <p class="break-all">
                  管理版路徑：{{ adminSourcePath }}
                </p>
              </div>
            </div>

            <div class="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="text-xs font-black uppercase tracking-[0.22em] text-emerald-500">
                    Stable Checklist
                  </p>

                  <h3 class="mt-2 text-lg font-black text-emerald-900">
                    V1 完成度檢查清單
                  </h3>
                </div>

                <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
                  ✅
                </div>
              </div>

              <div class="mt-4 space-y-3">
                <article
                  v-for="item in stableChecklist"
                  :key="item.title"
                  class="rounded-2xl bg-white p-3 shadow-sm"
                >
                  <div class="flex items-start gap-3">
                    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl">
                      {{ item.icon }}
                    </div>

                    <div class="min-w-0 flex-1">
                      <div class="flex flex-wrap items-center gap-2">
                        <p class="text-sm font-black text-slate-900">
                          {{ item.title }}
                        </p>

                        <span class="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-emerald-700">
                          {{ item.status }}
                        </span>
                      </div>

                      <p class="mt-1 text-xs font-bold leading-5 text-slate-500">
                        {{ item.description }}
                      </p>
                    </div>
                  </div>
                </article>
              </div>
            </div>

            <div
              v-if="isGameIdNotFound"
              class="mt-5 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-rose-700"
            >
              <p class="text-sm font-black">
                找不到活動 ID
              </p>

              <p class="mt-2 break-all text-xs font-bold leading-5">
                目前網址帶入的 gameId：{{ urlGameId }}，但後台遊戲設定列表沒有找到對應資料。
              </p>

              <p class="mt-2 text-xs font-bold leading-5">
                建議回到後台遊戲設定檢查活動 ID、路徑或重新新增模板活動。
              </p>
            </div>

            <div class="mt-5 rounded-3xl border border-orange-100 bg-orange-50 p-3 text-xs font-bold leading-5 text-orange-700">
              本頁會自動保存示範狀態：抽獎次數、庫存、最新紀錄與快速換圖設定，重新整理後仍會保留。
              <div class="mt-2 font-black text-orange-900">
                最近保存：{{ getSavedStateText() }}
              </div>
            </div>

            <div class="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                class="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-black text-blue-600 transition hover:bg-blue-100"
                @click="exportPremiumGridState"
              >
                匯出資料
              </button>

              <button
                type="button"
                class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-600 transition hover:bg-emerald-100"
                @click="importPremiumGridState"
              >
                匯入資料
              </button>
            </div>

            <div class="mt-3 grid gap-3 sm:grid-cols-3 md:grid-cols-1">
              <div class="rounded-3xl bg-slate-900 p-4 text-white">
                <p class="text-xs font-bold text-white/60">
                  剩餘抽獎次數
                </p>

                <p class="mt-2 text-3xl font-black">
                  {{ player.chances }}
                </p>
              </div>

              <div class="rounded-3xl bg-orange-50 p-4 text-orange-700">
                <p class="text-xs font-bold text-orange-400">
                  已分享次數
                </p>

                <p class="mt-2 text-3xl font-black">
                  {{ player.sharedCount }}
                </p>
              </div>

              <div class="rounded-3xl bg-emerald-50 p-4 text-emerald-700">
                <p class="text-xs font-bold text-emerald-500">
                  獎項庫存
                </p>

                <p class="mt-2 text-3xl font-black">
                  {{ prizeSummary.totalQuantity }}
                </p>
              </div>
            </div>
          </section>

          <section class="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-xl backdrop-blur">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-xs font-black uppercase tracking-[0.25em] text-amber-500">
                  Reward List
                </p>

                <h2 class="mt-2 text-xl font-black text-slate-900">
                  獎品與庫存
                </h2>
              </div>

              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-3xl">
                🎁
              </div>
            </div>

            <div class="mt-5 max-h-[360px] space-y-3 overflow-y-auto pr-1 premium-scrollbar-y">
              <article
                v-for="reward in rewardTicker"
                :key="reward.id"
                class="flex items-center gap-3 rounded-3xl border border-slate-100 bg-white p-3 shadow-sm"
              >
                <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-100 to-orange-100 text-2xl">
                  <img
                    v-if="reward.imageUrl"
                    :src="reward.imageUrl"
                    :alt="reward.title"
                    class="h-full w-full rounded-2xl object-cover"
                  />

                  <span v-else>
                    {{ reward.icon }}
                  </span>
                </div>

                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-black text-slate-900">
                    {{ reward.title }}
                  </p>

                  <p class="mt-1 text-xs font-bold text-slate-400">
                    權重 {{ reward.weight }}｜庫存 {{ reward.quantity }}
                  </p>
                </div>
              </article>
            </div>
          </section>

          <section class="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-xl backdrop-blur md:col-span-2 xl:col-span-1">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-xs font-black uppercase tracking-[0.25em] text-purple-500">
                  Draw Logs
                </p>

                <h2 class="mt-2 text-xl font-black text-slate-900">
                  最新中獎紀錄
                </h2>
              </div>

              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-3xl">
                🏆
              </div>
            </div>

            <div
              v-if="drawLogs.length"
              class="mt-5 space-y-3"
            >
              <article
                v-for="log in drawLogs"
                :key="log.id"
                class="flex items-center justify-between rounded-3xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
              >
                <span class="text-sm font-black text-slate-800">
                  {{ log.icon }} {{ log.prizeName }}
                </span>

                <span class="text-xs font-bold text-slate-400">
                  {{ log.createdAt }}
                </span>
              </article>
            </div>

            <div
              v-else
              class="mt-5 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center"
            >
              <p class="text-sm font-black text-slate-500">
                尚無中獎紀錄
              </p>

              <p class="mt-1 text-xs font-bold text-slate-400">
                點擊中間抽獎按鈕後，紀錄會同步顯示在這裡。
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showResultModal && resultPrize"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm"
      >
        <div class="w-full max-w-sm overflow-hidden rounded-[32px] bg-white shadow-2xl">
          <div class="bg-gradient-to-br from-orange-400 to-red-600 px-6 py-8 text-center text-white">
            <div class="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-white/20 text-6xl shadow-inner">
              <img
                v-if="resultPrize.imageUrl"
                :src="resultPrize.imageUrl"
                :alt="resultPrize.name"
                class="h-full w-full rounded-3xl object-cover"
              />

              <span v-else>
                {{ resultPrize.icon }}
              </span>
            </div>

            <h2 class="mt-5 text-2xl font-black">
              恭喜中獎！
            </h2>

            <p class="mt-2 text-lg font-black text-yellow-100">
              {{ resultPrize.name }}
            </p>
          </div>

          <div class="p-6 text-center">
            <p class="text-sm leading-6 text-slate-500">
              {{ getResultModalHint() }}
            </p>

            <div class="mt-5 grid gap-3">
              <button
                type="button"
                class="w-full rounded-2xl bg-orange-600 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-700"
                @click="closeResultAndContinue"
              >
                {{ player.chances > 0 ? '繼續抽獎' : '關閉結果' }}
              </button>

              <button
                type="button"
                class="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                @click="goGameHistory"
              >
                查看我的遊戲紀錄
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.premium-dot-bg {
  background-image:
    radial-gradient(circle, rgba(255, 255, 255, 0.65) 1px, transparent 1px),
    radial-gradient(circle, rgba(255, 255, 255, 0.35) 1px, transparent 1px);
  background-position: 0 0, 18px 18px;
  background-size: 36px 36px;
}

.premium-scrollbar::-webkit-scrollbar {
  height: 0;
}

.premium-scrollbar-y::-webkit-scrollbar {
  width: 0;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.premium-drawing-glow {
  animation: premium-drawing-pulse 0.9s ease-in-out infinite alternate;
}

@keyframes premium-drawing-pulse {
  from {
    filter: brightness(1);
  }

  to {
    filter: brightness(1.08);
  }
}

@media (max-width: 380px) {
  .premium-dot-bg {
    background-size: 28px 28px;
  }
}
</style>
