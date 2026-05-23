<script setup>
// Multi Game Platform V2.3
// 第 83201～83600 批：九宮格平台模板正式資料庫儲存版
//
// 覆蓋位置：
// frontend/src/views/admin/AdminPremiumGridSettingsView.vue
//
// 本批定位：
// 1. 序號抽獎設定改成精緻卡片式操作。
// 2. 新增序號格式、長度、產生數量、有效天數、每日/總限制與格式預覽。
// 3. 新增序號操作 checklist，讓商家知道建立活動後下一步要產生與匯出序號。
// 4. 保留官方品牌連結、還原、文字大小、獎品圖片、百分比機率。
// 5. 不改 router / DB schema / draw-core。

import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCampaignGameConfigApi, saveCampaignGameConfigApi } from '../../api/campaign'
import http from '../../api/http'

const route = useRoute()
const router = useRouter()

const activeSection = ref('basicText')
const savedMessage = ref('')
const warningMessage = ref('')
const inlineSaveMessage = ref('')
const previewActiveIndex = ref(-1)
const previewDrawing = ref(false)
const configLoading = ref(false)
const configSaving = ref(false)
const configLoadedAt = ref('')
const configSavedAt = ref('')
const configModeMessage = ref('目前是正式資料庫模式。若網址包含活動 ID，例如 /admin/premium-grid-settings/1，儲存會寫入 GameConfig settings 並重新讀取確認。')
const previewTenantSlug = ref('a-shop')
const previewRefreshKey = ref(1)
const formalPreviewIframeRef = ref(null)
const previewMode = ref('formal')
const currentCampaignTitle = ref('')
const operationGuideOpen = ref(true)
const probabilitySimulationCount = ref(1000)
const probabilitySimulationResults = ref([])
const probabilitySimulatorOpen = ref(false)
const probabilityBackendGuardOpen = ref(true)

const simpleMode = ref(true)
const quickStatusOpen = ref(true)

const makeDefaultBasicTextSettings = () => ({
  pageTitle: '超級九宮格',
  brandName: 'Multi Game Platform',
  brandSubtitle: '打造專屬互動抽獎體驗',
  headline: '豪華九宮格',
  subtitle: '無敵大幸運',
  badgeText: '每日登入抽好禮',
  playButtonText: '開始抽獎',
  serialPlaceholder: '請輸入商家提供的序號'
})

const makeDefaultTextSizeSettings = () => ({
  pageTitleSize: 14,
  brandNameSize: 16,
  brandSubtitleSize: 12,
  headlineSize: 36,
  subtitleSize: 28,
  badgeTextSize: 14,
  prizeTextSize: 13,
  buttonTextSize: 16
})

const makeDefaultOfficialLinkSettings = () => ({
  enabled: true,
  label: '官方品牌',
  url: 'https://www.love888.xyz',
  textSize: 12,
  textColor: '#ffffff',
  backgroundColor: 'rgba(255,255,255,0.22)',
  openInNewTab: true
})

const makeDefaultSerialSettings = () => ({
  requireSerial: true,
  prefix: 'GRID',
  codeLength: 8,
  batchQuantity: 100,
  expiresDays: 30,
  dailyLimit: 1,
  totalLimit: 1,
  formatMode: 'PREFIX-RANDOM',
  caseMode: 'upper',
  serialHint: '請輸入商家提供的序號後開始九宮格抽獎。',
  emptySerialText: '請先輸入序號。',
  usedSerialText: '此序號已使用，請確認或聯繫客服。',
  expiredSerialText: '此序號已過期。',
  successSerialText: '序號驗證成功，可以開始抽獎。',
  exportFileName: 'premium-grid-serial-codes'
})

const makeDefaultThemeSettings = () => ({
  themeStart: '#ffbd4a',
  themeMiddle: '#ff8a1c',
  themeEnd: '#f25a1d',
  cardColor: '#fff1a8',
  cardActiveColor: '#ef2f16',
  gridFrameColor: '#fb5a08',
  buttonColor: '#ffffff',
  buttonTextColor: '#ea580c',
  textColor: '#ffffff'
})

const makeDefaultPrizeSettings = () => [
  { id: 'grid_1', position: 1, icon: '🎁', imageUrl: '', title: '折價券', name: '折價券', shortName: '折價券', quantity: 50, awardLimit: 50, maxAwardCount: 50, weight: 20, probabilityPercent: 20, enabled: true },
  { id: 'grid_2', position: 2, icon: '🪙', imageUrl: '', title: '點數', name: '點數', shortName: '點數', quantity: 100, awardLimit: 100, maxAwardCount: 100, weight: 20, probabilityPercent: 20, enabled: true },
  { id: 'grid_3', position: 3, icon: '🥤', imageUrl: '', title: '飲品券', name: '飲品券', shortName: '飲品券', quantity: 30, awardLimit: 30, maxAwardCount: 30, weight: 12, probabilityPercent: 12, enabled: true },
  { id: 'grid_4', position: 4, icon: '🎀', imageUrl: '', title: '小禮物', name: '小禮物', shortName: '小禮物', quantity: 20, awardLimit: 20, maxAwardCount: 20, weight: 10, probabilityPercent: 10, enabled: true },
  { id: 'grid_5', position: 5, icon: '✨', imageUrl: '', title: '點擊抽獎', name: '點擊抽獎', shortName: '點擊抽獎', quantity: 0, awardLimit: 0, maxAwardCount: 0, weight: 0, probabilityPercent: 0, enabled: true, isButton: true },
  { id: 'grid_6', position: 6, icon: '🎫', imageUrl: '', title: '優惠券', name: '優惠券', shortName: '優惠券', quantity: 80, awardLimit: 80, maxAwardCount: 80, weight: 25, probabilityPercent: 25, enabled: true },
  { id: 'grid_7', position: 7, icon: '🎟️', imageUrl: '', title: '抽獎券', name: '抽獎券', shortName: '抽獎券', quantity: 20, awardLimit: 20, maxAwardCount: 20, weight: 8, probabilityPercent: 8, enabled: true },
  { id: 'grid_8', position: 8, icon: '📦', imageUrl: '', title: '神秘禮', name: '神秘禮', shortName: '神秘禮', quantity: 10, awardLimit: 10, maxAwardCount: 10, weight: 4, probabilityPercent: 4, enabled: true },
  { id: 'grid_9', position: 9, icon: '👑', imageUrl: '', title: '大獎', name: '大獎', shortName: '大獎', quantity: 3, awardLimit: 3, maxAwardCount: 3, weight: 1, probabilityPercent: 1, enabled: true }
]

const livePreviewEnabled = ref(true)
const livePreviewDebounceTimer = ref(null)
const livePreviewLastSyncedAt = ref('')




const campaignId = computed(() => route.params.id || route.query.campaignId || 'demo')

const normalizedCampaignId = computed(() => {
  const id = Number(campaignId.value)

  return Number.isInteger(id) && id > 0 ? id : null
})

const canUseGameConfigApi = computed(() => Boolean(normalizedCampaignId.value))
const isTemplateDraftMode = computed(() => !canUseGameConfigApi.value)

const PLATFORM_PREMIUM_GRID_TEMPLATE_ID = 'premium-grid'
const PLATFORM_PREMIUM_GRID_TEMPLATE_SLUG = 'platform-premium-grid-template-premium-grid'
const PLATFORM_PREMIUM_GRID_TEMPLATE_MODE = 'PLATFORM_PREMIUM_GRID_TEMPLATE'


const normalizeApiList = (payload = null) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.rows)) return payload.rows
  if (Array.isArray(payload?.campaigns)) return payload.campaigns
  return []
}

const findSavedPlatformPremiumGridTemplate = async () => {
  const response = await http.get('/campaigns', {
    params: {
      slug: PLATFORM_PREMIUM_GRID_TEMPLATE_SLUG,
      gameType: 'GRID'
    }
  })

  const list = normalizeApiList(unwrapApiPayload(response))
  return list.find((item) => String(item?.slug || '') === PLATFORM_PREMIUM_GRID_TEMPLATE_SLUG) || list[0] || null
}

const buildPlatformPremiumGridTemplateSettings = () => {
  const settingsPayload = buildSettingsSavePayload()

  return {
    ...settingsPayload,
    templateMeta: {
      ...(settingsPayload.templateMeta || {}),
      source: 'PLATFORM_PREMIUM_GRID_TEMPLATE',
      sourceType: 'platform_template',
      targetType: 'platform_template',
      cloneMode: 'CREATE_CAMPAIGN_ONLY',
      templateId: PLATFORM_PREMIUM_GRID_TEMPLATE_ID,
      platformTemplateSlug: PLATFORM_PREMIUM_GRID_TEMPLATE_SLUG,
      savedAt: new Date().toISOString(),
      version: 'v23_batch83201_83600',
      batch: '83201-83600',
      note: '這是九宮格平台模板正式資料庫設定；商家建立新九宮格活動時應複製此模板，既有商家活動不會被自動覆蓋。'
    }
  }
}

const formalPlayerPreviewUrl = computed(() => {
  // 第 82001～82400 批：平台模板中心不能再用 /play/a-shop/premium-grid 當預覽來源，
  // 否則 iframe 會先讀 A 商家正式活動，再套草稿，造成使用者誤以為「儲存沒有存到模板」。
  // 沒有正式 campaignId 時固定走模板預覽入口 /games/premium-grid。
  const baseUrl = isTemplateDraftMode.value
    ? '/games/premium-grid'
    : `/play/${encodeURIComponent(String(previewTenantSlug.value || 'a-shop').trim() || 'a-shop')}/premium-grid`

  if (previewMode.value === 'legacy') return `${baseUrl}?legacyGrid=1`
  if (previewMode.value === 'common') return `${baseUrl}?commonGrid=1`
  if (previewMode.value === 'original') return `${baseUrl}?originalGrid=1`

  return baseUrl
})

const adminPreviewDraftKey = computed(() => {
  const id = isTemplateDraftMode.value
    ? 'platform-template'
    : (normalizedCampaignId.value || campaignId.value || 'demo')
  const slug = isTemplateDraftMode.value
    ? 'platform'
    : (String(previewTenantSlug.value || 'a-shop').trim() || 'a-shop')

  return `premium-grid-admin-preview-draft:${id}:${slug}`
})

const formalPlayerPreviewSrc = computed(() => {
  const separator = formalPlayerPreviewUrl.value.includes('?') ? '&' : '?'
  const draftQuery = livePreviewEnabled.value
    ? `adminPreviewDraft=1&draftKey=${encodeURIComponent(adminPreviewDraftKey.value)}`
    : 'adminPreviewDraft=0'

  return `${formalPlayerPreviewUrl.value}${separator}${draftQuery}&previewRefresh=${previewRefreshKey.value}`
})

const campaignDisplayName = computed(() => {
  return currentCampaignTitle.value || `活動 #${campaignId.value}`
})

const serialManagementHint = computed(() => {
  return '序號產生與 CSV 匯出目前在「活動管理」頁操作。'
})

const merchantOperationSteps = computed(() => [
  '確認活動名稱與商家網址代碼 tenantSlug。',
  '修改左側分類設定，例如文字、顏色、九宮格樣式、分享設定。',
  '按「儲存設定」寫入 GameConfig settings。',
  '右側正式玩家頁預覽會自動重新載入。',
  '回活動管理產生序號並匯出 CSV。',
  '複製玩家連結與序號給客人。'
])

const completionChecks = computed(() => [
  {
    key: 'title',
    label: '活動標題',
    done: Boolean(settings.basicText?.pageTitle && settings.basicText?.headline),
    tip: '已設定標題'
  },
  {
    key: 'theme',
    label: '主題色彩',
    done: Boolean(settings.theme?.themeStart && settings.theme?.themeMiddle && settings.theme?.themeEnd),
    tip: '已設定主色'
  },
  {
    key: 'prizes',
    label: '九宮格獎項',
    done: Array.isArray(settings.prizes) && settings.prizes.filter((item) => item.enabled).length >= 8,
    tip: '已設定獎項'
  },
  {
    key: 'share',
    label: '分享資訊',
    done: Boolean(settings.share?.shareTitle && settings.share?.shareUrl),
    tip: '已設定分享'
  },
  {
    key: 'preview',
    label: '正式預覽',
    done: Boolean(livePreviewLastSyncedAt || configSavedAt),
    tip: '已同步預覽'
  }
])

const completionPercent = computed(() => {
  const total = completionChecks.value.length || 1
  const done = completionChecks.value.filter((item) => item.done).length

  return Math.round((done / total) * 100)
})

const quickSettingSummary = computed(() => [
  {
    label: '玩家頁標題',
    value: settings.basicText?.pageTitle || '尚未設定'
  },
  {
    label: '主標',
    value: settings.basicText?.headline || '尚未設定'
  },
  {
    label: '商家代碼',
    value: previewTenantSlug.value || 'a-shop'
  },
  {
    label: '啟用獎項',
    value: `${enabledPrizes.value.length} 格`
  },
  {
    label: '預覽狀態',
    value: livePreviewEnabled.value ? '即時同步中' : '手動刷新'
  },
  {
    label: '最後同步',
    value: livePreviewLastSyncedAt.value || '尚未同步'
  }
])

const commonMerchantActions = computed(() => [
  {
    key: 'save',
    title: '儲存設定',
    description: '把目前草稿正式寫入後端',
    action: 'save'
  },
  {
    key: 'copy',
    title: '複製玩家連結',
    description: '把正式玩家網址傳給客人',
    action: 'copy'
  },
  {
    key: 'serial',
    title: '產生序號',
    description: '回活動管理匯出序號 CSV',
    action: 'serial'
  }
])

const merchantCoreFunctionCards = computed(() => [
  {
    key: 'basicText',
    icon: '文',
    title: '基本資料',
    description: '活動名稱、主標、副標、品牌文字',
    sectionKey: 'basicText',
    status: settings.basicText?.pageTitle && settings.basicText?.headline ? '已設定' : '待設定'
  },
  {
    key: 'theme',
    icon: '色',
    title: '視覺外觀',
    description: '主題色、九宮格大小、品牌舞台',
    sectionKey: 'theme',
    status: settings.theme?.themeStart ? '已設定' : '待設定'
  },
  {
    key: 'prizes',
    icon: '獎',
    title: '獎項內容',
    description: '九宮格獎項、庫存、權重',
    sectionKey: 'prizes',
    status: `${enabledPrizes.value.length} 格啟用`
  },
  {
    key: 'serial',
    icon: '碼',
    title: '序號抽獎',
    description: '序號提示、限制、產生與匯出',
    sectionKey: 'serial',
    status: settings.serial?.requireSerial ? '需要序號' : '可直接玩'
  },
  {
    key: 'share',
    icon: '分',
    title: '分享發布',
    description: '玩家連結、分享標題與描述',
    sectionKey: 'share',
    status: settings.share?.shareTitle ? '已設定' : '待設定'
  }
])

const advancedSectionKeys = [
  'activityTime',
  'stage',
  'footer',
  'display',
  'resultModal',
  'effects',
  'rules',
  'front'
]

const advancedSections = computed(() => {
  return sections.filter((section) => advancedSectionKeys.includes(section.key))
})

const isAdvancedSection = (key) => {
  return advancedSectionKeys.includes(key)
}


const sections = [
  { key: 'basicText', icon: '文', label: '基本文字', description: '活動標題、副標題、提示文字' },
  { key: 'theme', icon: '色', label: '主題色彩', description: '背景、按鈕、格子顏色' },
  { key: 'activityTime', icon: '時', label: '活動時間', description: '開始結束與關閉文字' },
  { key: 'stage', icon: '景', label: '背景舞台', description: '品牌區、背景圖與舞台效果' },
  { key: 'gridStyle', icon: '格', label: '九宮格樣式', description: '格子大小、間距、圓角' },
  { key: 'prizes', icon: '獎', label: '獎項百分比', description: '九格獎項、庫存、權重' },
  { key: 'serial', icon: '碼', label: '序號抽獎', description: '序號前綴、提示與限制' },
  { key: 'footer', icon: '底', label: '底部功能列', description: '規則、紀錄、我的獎品' },
  { key: 'display', icon: '示', label: '展示區塊', description: '剩餘次數、紀錄、獎品牆' },
  { key: 'resultModal', icon: '窗', label: '結果彈窗', description: '中獎彈窗與按鈕文字' },
  { key: 'effects', icon: '效', label: '音效特效', description: '閃光、跳動、音效開關' },
  { key: 'rules', icon: '規', label: '規則說明', description: '活動規則與兌換說明' },
  { key: 'front', icon: '設', label: '前台設定', description: '玩家網址與公開顯示' },
  { key: 'share', icon: '分', label: '分享設定', description: 'LINE / Telegram 分享文字' }
]

const simpleModeSectionKeys = [
  'basicText',
  'theme',
  'gridStyle',
  'prizes',
  'serial',
  'share',
  'front'
]

const visibleSections = computed(() => {
  if (!simpleMode.value) return sections

  return sections.filter((section) => simpleModeSectionKeys.includes(section.key))
})

const quickActionCards = computed(() => [
  {
    key: 'edit',
    title: '1. 改畫面',
    description: '先改標題、顏色、九宮格獎項。',
    sectionKey: 'basicText',
    tone: 'violet'
  },
  {
    key: 'save',
    title: '2. 儲存預覽',
    description: '按儲存設定，右側正式頁會刷新。',
    sectionKey: 'front',
    tone: 'emerald'
  },
  {
    key: 'serial',
    title: '3. 產生序號',
    description: '回活動管理產生序號給客人。',
    sectionKey: 'serial',
    tone: 'amber'
  }
])

const currentSectionProgressText = computed(() => {
  const label = activeSectionInfo.value?.label || '設定'

  if (simpleMode.value) {
    return `簡易模式｜目前正在修改：${label}`
  }

  return `完整模式｜目前正在修改：${label}`
})

const simpleModeHint = computed(() => {
  return simpleMode.value
    ? '目前只顯示商家最常用的設定，適合日常操作。'
    : '目前顯示所有設定，適合進階調整與維護。'
})

const settings = reactive({
  basicText: makeDefaultBasicTextSettings(),
  textSize: makeDefaultTextSizeSettings(),
  officialLink: makeDefaultOfficialLinkSettings(),
  theme: makeDefaultThemeSettings(),
  activityTime: {
    startAt: '',
    endAt: '',
    endedText: '活動已結束。',
    notStartedText: '活動尚未開始。',
    countdownLabel: '活動倒數'
  },
  stage: {
    logoText: 'P',
    backgroundImageUrl: '',
    brandCardEnabled: true,
    dottedBackground: true,
    glowEnabled: true
  },
  gridStyle: {
    gridCardSize: 128,
    gridGap: 12,
    gridRadius: 24,
    gridBorderWidth: 3,
    gridShadow: true,
    centerButtonText: '點擊抽獎'
  },
  prizes: makeDefaultPrizeSettings(),
  serial: makeDefaultSerialSettings(),
  footer: {
    showRules: true,
    showRewards: true,
    showHistory: true,
    showShare: true,
    rulesText: '規則',
    rewardsText: '我的獎品',
    historyText: '紀錄',
    shareText: '分享'
  },
  display: {
    showChanceText: true,
    showPrizeWall: true,
    showDrawLogs: true,
    showCustomerServiceHint: true,
    showParticipation: true,
    showAccordionBlocks: true,
    chanceText: '還有 {count} 次抽獎機會',
    chanceSubText: '目前還有 {count} 次抽獎機會，點擊中間按鈕即可抽獎。',
    participationTitle: '活動參加方式',
    participationText: '點擊九宮格中間按鈕開始抽獎，中獎後會自動寫入遊戲紀錄。分享活動會複製活動連結並增加抽獎機會。',
    customerServiceText: '請依照活動規則參加抽獎，獎項與兌換方式以主辦單位公告為準。'
  },
  resultModal: {
    winTitle: '恭喜中獎！',
    loseTitle: '再接再厲',
    confirmText: '關閉結果',
    continueText: '繼續抽獎',
    rewardHint: '請依商家公告方式兌換獎品。',
    winImageUrl: '',
    loseImageUrl: '',
    imageSize: 96,
    modalBackgroundColor: '#ffffff',
    headerFromColor: '#fb923c',
    headerToColor: '#dc2626',
    titleTextSize: 24,
    titleTextColor: '#ffffff',
    prizeTextSize: 18,
    prizeTextColor: '#fef3c7',
    hintTextSize: 14,
    hintTextColor: '#64748b',
    buttonColor: '#ea580c',
    buttonTextColor: '#ffffff'
  },
  effects: {
    soundEnabled: true,
    flashEnabled: true,
    confettiEnabled: true,
    vibrationEnabled: true,
    animationSpeed: 1
  },
  rules: {
    content: '每組序號限使用一次。活動獎項、使用期限與兌換方式依商家公告為準。',
    redemption: '請保留中獎畫面，並依客服指示完成兌換。',
    privacy: '玩家資料僅用於活動紀錄與兌獎確認。'
  },
  front: {
    publicEnabled: true,
    playerUrl: 'http://localhost:5173/games/premium-grid',
    commonTestUrl: 'http://localhost:5173/games/premium-grid?commonGrid=1',
    legacyUrl: 'http://localhost:5173/games/premium-grid?legacyGrid=1',
    showBrandHeader: true
  },
  share: {
    shareTitle: '老茶棧｜九宮格抽獎活動',
    shareUrl: 'https://www.love888.xyz/play/a-shop/premium-grid',
    shareDescription: '快來參加九宮格抽獎活動，輸入序號就有機會中大獎！',
    shareImageUrl: 'https://lady.love888.xyz/items/grid-share.png',
    systemShareButtonText: '分享'
  }
})

const drawLogs = [
  { id: 1, icon: '🎁', prizeName: '品牌折價券', createdAt: '05/07 下午10:21' },
  { id: 2, icon: '🎁', prizeName: '品牌折價券', createdAt: '05/07 下午10:11' },
  { id: 3, icon: '🥤', prizeName: '飲品兌換券', createdAt: '05/07 下午10:08' },
  { id: 4, icon: '🪙', prizeName: '會員點數 100 點', createdAt: '05/07 下午10:08' },
  { id: 5, icon: '🎟️', prizeName: '加碼抽獎券', createdAt: '05/05 下午10:55' }
]


// 第 110401～110800 批：九宮格小批量抽獎券發獎上限與防超發控管版
// 第 98801～99200 批：九宮格舊 BUTTON 標記清除與機率總和修正
// 問題來源：部分格子曾經是「中間開始按鈕」，即使後來改成獎項，資料仍殘留 isButton / BUTTON，
// 導致上方總和、試算器、正式 gridItems 儲存都漏算該格。
const getGridPrizePercent = (item = {}) => {
  return Math.max(0, Number(item.probabilityPercent ?? item.weight ?? item.probability ?? item.percent ?? 0))
}

const getGridPrizeAwardLimit = (item = {}) => {
  const explicit = item.awardLimit ?? item.maxAwardCount ?? item.maxAwards

  if (explicit !== undefined && explicit !== null && explicit !== '') {
    const limit = Number(explicit)
    return Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 0
  }

  const fallback = Number(item.quantity ?? item.stock ?? item.inventory ?? item.stockTotal ?? item.total ?? 0)
  return Number.isFinite(fallback) ? Math.max(0, Math.floor(fallback)) : 0
}

const syncPrizeAwardLimit = (item = {}) => {
  const limit = getGridPrizeAwardLimit(item)
  item.awardLimit = limit
  item.maxAwardCount = limit
  item.maxAwards = limit
}

const normalizeGridPrizeTitleKey = (value = '') => {
  return String(value || '').trim().replace(/\s+/g, '')
}

const isLegacyButtonMarkedItem = (item = {}) => {
  return item.isButton === true ||
    String(item.type || '').toUpperCase() === 'BUTTON' ||
    String(item.rewardType || '').toUpperCase() === 'BUTTON'
}

const isActualGridStartButtonItem = (item = {}) => {
  if (!isLegacyButtonMarkedItem(item)) return false

  const percent = getGridPrizePercent(item)
  const titleKey = normalizeGridPrizeTitleKey(item.title || item.name || item.shortName || item.label)
  const buttonText = ['點擊抽獎', '開始抽獎', '開始', '抽獎按鈕']

  // 只有「沒有機率」且文字仍像開始按鈕時，才視為真正按鈕。
  // 若商家把舊按鈕格改成「銘謝惠顧 / 再接再厲」並填 41%，它必須被當成正式獎項計算。
  return percent <= 0 && buttonText.some((text) => titleKey.includes(text))
}

const isDrawableGridPrizeItem = (item = {}) => {
  if (!item) return false
  if (item.enabled === false || item.isEnabled === false) return false
  return !isActualGridStartButtonItem(item)
}

const inferGridPrizeType = (item = {}) => {
  const titleKey = normalizeGridPrizeTitleKey(item.title || item.name || item.shortName || item.label)
  const existingType = String(item.type || item.rewardType || '').toUpperCase()

  if (existingType === 'LOSE') return 'LOSE'
  if (/銘謝|再接|未中|謝謝|落空|不中/.test(titleKey)) return 'LOSE'

  return 'WIN'
}

const sanitizeGridPrizeItemForSave = (item = {}, index = 0) => {
  const percent = getGridPrizePercent(item)
  const awardLimit = getGridPrizeAwardLimit(item)
  const title = item.title || item.name || item.shortName || item.label || `第 ${index + 1} 格`
  const isActualButton = isActualGridStartButtonItem(item)
  const normalizedType = isActualButton ? 'BUTTON' : inferGridPrizeType({ ...item, title })

  return {
    ...item,
    id: item.id || `grid_${index + 1}`,
    position: Number(item.position || index + 1),
    title,
    name: item.name || title,
    shortName: item.shortName || item.label || title,
    label: item.label || item.shortName || title,
    enabled: item.enabled !== false,
    isEnabled: item.enabled !== false,
    awardLimit: isActualButton ? 0 : awardLimit,
    maxAwardCount: isActualButton ? 0 : awardLimit,
    maxAwards: isActualButton ? 0 : awardLimit,
    probabilityPercent: isActualButton ? 0 : percent,
    weight: isActualButton ? 0 : percent,
    probability: isActualButton ? 0 : percent,
    percent: isActualButton ? 0 : percent,
    type: normalizedType,
    rewardType: normalizedType,
    isButton: isActualButton
  }
}

const sanitizeGridPrizeListForSave = (list = []) => {
  return Array.isArray(list)
    ? list.map((item, index) => sanitizeGridPrizeItemForSave(item, index))
    : []
}

const getEffectiveGridPrizeList = () => {
  return sanitizeGridPrizeListForSave(settings.prizes).filter(isDrawableGridPrizeItem)
}

const activeSectionInfo = computed(() => {
  return sections.find((item) => item.key === activeSection.value) || sections[0]
})

const enabledPrizes = computed(() => {
  return getEffectiveGridPrizeList()
})

const totalWeight = computed(() => {
  return getEffectiveGridPrizeList().reduce((sum, item) => {
    return sum + getGridPrizePercent(item)
  }, 0)
})

const totalProbabilityPercent = computed(() => {
  const total = getEffectiveGridPrizeList().reduce((sum, item) => {
    return sum + getGridPrizePercent(item)
  }, 0)

  return Number(total.toFixed(2))
})

const probabilityStatusText = computed(() => {
  const total = totalProbabilityPercent.value
  if (total === 100) return '機率總和 100%，設定正常。'
  if (total < 100) return `目前機率總和 ${total}%，尚有 ${100 - total}% 未分配。`
  return `目前機率總和 ${total}%，超過 ${total - 100}%，請調整。`
})

const probabilityStatusClass = computed(() => {
  if (totalProbabilityPercent.value === 100) return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (totalProbabilityPercent.value < 100) return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-rose-200 bg-rose-50 text-rose-700'
})

const probabilityBackendGuard = computed(() => {
  const total = Number(totalProbabilityPercent.value || 0)
  const ok = Math.abs(total - 100) < 0.001

  return {
    ok,
    badge: ok ? '後端可準確依 100% 抽選' : '請先修正到 100%',
    title: '正式玩家抽獎由後端 Draw Engine 計算',
    description: '商家後台儲存後，九宮格玩家頁會呼叫 /api/draw-engine/campaigns/:id/play，由後端讀取 GameConfig settings.gridItems 的 probabilityPercent / weight 來加權抽選；玩家前台不自行決定中獎結果。',
    source: canUseGameConfigApi.value ? `campaignId: ${normalizedCampaignId.value} / GameConfig settings` : '目前沒有正式活動 ID，僅能做模板與預覽。',
    totalText: `目前機率總和：${total}%`
  }
})

const probabilitySimulationItems = computed(() => {
  return getEffectiveGridPrizeList()
    .map((item, index) => {
      const percent = getGridPrizePercent(item)
      return {
        id: item.id || `grid-prize-${index + 1}`,
        title: item.title || item.name || `第 ${index + 1} 格`,
        icon: item.icon || '🎁',
        percent: Math.max(0, percent),
        awardLimit: getGridPrizeAwardLimit(item)
      }
    })
    .filter((item) => item.percent > 0)
})

const probabilitySimulationSummary = computed(() => {
  const total = probabilitySimulationItems.value.reduce((sum, item) => sum + item.percent, 0)
  return {
    total,
    totalText: `${Number(total.toFixed(2))}%`,
    itemCount: probabilitySimulationItems.value.length
  }
})

const runProbabilitySimulation = () => {
  const items = probabilitySimulationItems.value
  const total = probabilitySimulationSummary.value.total
  const count = Math.min(10000, Math.max(100, Number(probabilitySimulationCount.value || 1000)))
  probabilitySimulationCount.value = count

  if (!items.length || total <= 0) {
    probabilitySimulationResults.value = []
    warningMessage.value = '目前沒有可試算的九宮格獎項，請確認獎項已啟用且機率大於 0。'
    return
  }

  const hitMap = new Map(items.map((item) => [item.id, 0]))

  for (let i = 0; i < count; i += 1) {
    let point = Math.random() * total
    let picked = items[items.length - 1]

    for (const item of items) {
      point -= item.percent
      if (point <= 0) {
        picked = item
        break
      }
    }

    hitMap.set(picked.id, Number(hitMap.get(picked.id) || 0) + 1)
  }

  probabilitySimulationResults.value = items.map((item) => {
    const hits = Number(hitMap.get(item.id) || 0)
    return {
      ...item,
      theoreticalPercent: total > 0 ? Number(((item.percent / total) * 100).toFixed(2)) : 0,
      awardLimit: item.awardLimit,
      hits,
      simulatedPercent: Number(((hits / count) * 100).toFixed(2))
    }
  })

  savedMessage.value = `已完成 ${count} 次九宮格機率試算；正式玩家抽獎仍以後端 draw-engine 實際結果為準。`
}

const exportDraftJson = computed(() => {
  return JSON.stringify(settings, null, 2)
})

const cloneJson = (value) => {
  return JSON.parse(JSON.stringify(value))
}

const unwrapApiPayload = (response) => {
  return response?.data?.data ?? response?.data ?? response ?? {}
}

const normalizeGameConfigResponse = (response) => {
  const payload = unwrapApiPayload(response)

  if (payload?.settings && typeof payload.settings === 'object') {
    return payload.settings
  }

  if (payload?.gameConfig?.settings && typeof payload.gameConfig.settings === 'object') {
    return payload.gameConfig.settings
  }

  if (payload?.campaign?.gameConfig?.settings && typeof payload.campaign.gameConfig.settings === 'object') {
    return payload.campaign.gameConfig.settings
  }

  if (payload?.data?.gameConfig?.settings && typeof payload.data.gameConfig.settings === 'object') {
    return payload.data.gameConfig.settings
  }

  return payload && typeof payload === 'object' ? payload : {}
}

const normalizeGameConfigMeta = (response) => {
  const payload = unwrapApiPayload(response)

  return {
    campaign: payload?.campaign || payload?.gameConfig?.campaign || null,
    tenant: payload?.tenant || payload?.campaign?.tenant || null,
    tenantSlug:
      payload?.tenantSlug ||
      payload?.tenant?.slug ||
      payload?.campaign?.tenant?.slug ||
      payload?.gameConfig?.campaign?.tenant?.slug ||
      ''
  }
}

const buildSettingsSavePayload = () => {
  const payload = cloneJson(settings)
  const normalizedPrizes = sanitizeGridPrizeListForSave(payload.prizes)

  // 九宮格正式 Draw Engine 以 settings.gridItems 為第一來源。
  // prizes 同步保留給舊版畫面 / 舊活動 fallback，但不能再與 gridItems 不一致。
  payload.prizes = normalizedPrizes
  payload.gridItems = normalizedPrizes.map((item) => ({
    ...item,
    source: 'ADMIN_PREMIUM_GRID_SETTINGS',
    probabilityPercent: getGridPrizePercent(item),
    weight: getGridPrizePercent(item),
    probability: getGridPrizePercent(item)
  }))

  return {
    ...payload,
    __meta: {
      source: 'AdminPremiumGridSettingsView',
      savedAt: new Date().toISOString(),
      campaignId: normalizedCampaignId.value,
      tenantSlug: previewTenantSlug.value,
      gridItemsSynced: true,
      awardLimitGuard: true,
      batch: '110401-110800'
    }
  }
}

const isSettingsObjectValid = (value = {}) => {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

const isNotFoundApiError = (error) => {
  return Number(error?.response?.status) === 404
}

const buildMissingCampaignMessage = () => {
  return `活動 #${normalizedCampaignId.value} 不存在正式資料庫，或目前登入商家沒有權限讀取。請返回活動管理，清除本機暫存活動後，重新從正式活動列表進入。`
}

const setInlineSaveFeedback = (message = '', type = 'success') => {
  inlineSaveMessage.value = message

  if (type === 'error') {
    warningMessage.value = message
    return
  }

  savedMessage.value = message
}

const syncPlatformTemplateToLocalPreviewCache = (settingsPayload = null) => {
  if (typeof window === 'undefined') return

  const settingsToStore = settingsPayload || buildPlatformPremiumGridTemplateSettings()
  const previewDraftPayload = {
    settings: settingsToStore,
    meta: {
      source: 'PLATFORM_PREMIUM_GRID_TEMPLATE_DATABASE_PREVIEW',
      templateSlug: PLATFORM_PREMIUM_GRID_TEMPLATE_SLUG,
      syncedAt: new Date().toISOString()
    }
  }

  const storageKeys = [
    'mgp:premium-grid-platform-template-draft',
    'mgp:premium-grid-platform-template-saved',
    'mgp:premium-grid-template-draft:last',
    'mgp:premium-grid-template-source:platform',
    adminPreviewDraftKey.value,
    `mgp:premium-grid-template-draft:${previewTenantSlug.value || 'a-shop'}`
  ]

  storageKeys.forEach((key) => {
    const value = key === adminPreviewDraftKey.value ? previewDraftPayload : settingsToStore
    window.localStorage.setItem(key, JSON.stringify(value))
  })

  syncDraftToPreviewStorage({ refresh: false })
  window.setTimeout(() => postDraftToPreviewIframe(previewDraftPayload), 60)
}

const savePlatformTemplateToDatabase = async () => {
  configSaving.value = true
  savedMessage.value = ''
  warningMessage.value = ''
  inlineSaveMessage.value = '儲存中，正在寫入九宮格平台模板資料庫...'

  try {
    const settingsPayload = buildPlatformPremiumGridTemplateSettings()
    const title = settingsPayload?.basicText?.pageTitle || settingsPayload?.basicText?.headline || '九宮格平台模板'
    const existing = await findSavedPlatformPremiumGridTemplate()

    let templateCampaign = existing

    if (existing?.id) {
      await http.patch(`/campaigns/${existing.id}`, {
        title,
        name: title,
        slug: PLATFORM_PREMIUM_GRID_TEMPLATE_SLUG,
        gameType: 'GRID',
        status: 'ACTIVE',
        templateStorageMode: PLATFORM_PREMIUM_GRID_TEMPLATE_MODE,
        settings: settingsPayload,
        gameConfig: {
          settings: settingsPayload
        }
      })

      await http.put(`/campaigns/${existing.id}/game-config`, {
        settings: settingsPayload,
        gameConfig: {
          settings: settingsPayload
        },
        templateStorageMode: PLATFORM_PREMIUM_GRID_TEMPLATE_MODE,
        source: 'AdminPremiumGridSettingsView',
        savedAt: new Date().toISOString()
      })
    } else {
      const createResponse = await http.post('/campaigns', {
        title,
        name: title,
        slug: PLATFORM_PREMIUM_GRID_TEMPLATE_SLUG,
        gameType: 'GRID',
        status: 'ACTIVE',
        templateStorageMode: PLATFORM_PREMIUM_GRID_TEMPLATE_MODE,
        settings: settingsPayload,
        gameConfig: {
          settings: settingsPayload
        }
      })

      templateCampaign = unwrapApiPayload(createResponse)
    }

    const savedTemplate = templateCampaign?.id
      ? await findSavedPlatformPremiumGridTemplate()
      : await findSavedPlatformPremiumGridTemplate()

    const savedSettings = savedTemplate?.gameConfig?.settings || settingsPayload
    mergeSettingsIntoDraft(savedSettings)
    syncPlatformTemplateToLocalPreviewCache(savedSettings)

    configSavedAt.value = new Date().toLocaleString('zh-TW', { hour12: false })
    configLoadedAt.value = configSavedAt.value
    configModeMessage.value = '已儲存九宮格平台模板到線上資料庫：商家之後建立新九宮格活動時，應套用這份平台模板；既有商家活動不會被自動覆蓋。'
    setInlineSaveFeedback('儲存完成：九宮格平台模板已寫入線上資料庫，右側模板預覽已同步，重新整理後不會回彈。')
  } catch (error) {
    console.error('儲存九宮格平台模板失敗:', error)
    const message = error?.response?.data?.message || error?.message || '儲存九宮格平台模板失敗，請確認登入權限與 Render API。'
    warningMessage.value = message
    inlineSaveMessage.value = message
  } finally {
    configSaving.value = false
  }
}

const loadPlatformTemplateFromDatabase = async () => {
  configLoading.value = true
  savedMessage.value = ''
  warningMessage.value = ''
  inlineSaveMessage.value = ''

  try {
    const templateCampaign = await findSavedPlatformPremiumGridTemplate()
    const savedSettings = templateCampaign?.gameConfig?.settings

    if (isSettingsObjectValid(savedSettings)) {
      mergeSettingsIntoDraft(savedSettings)
      configLoadedAt.value = new Date().toLocaleString('zh-TW', { hour12: false })
      configModeMessage.value = '已讀取線上資料庫中的九宮格平台模板。按「儲存設定」會直接更新平台模板，不再存成草稿。'
      savedMessage.value = '已載入九宮格平台模板資料庫設定。'
      syncPlatformTemplateToLocalPreviewCache(savedSettings)
    } else {
      configLoadedAt.value = new Date().toLocaleString('zh-TW', { hour12: false })
      configModeMessage.value = '尚未建立九宮格平台模板資料庫設定。按「儲存設定」會建立正式平台模板。'
      savedMessage.value = '尚未找到九宮格平台模板，已使用目前預設值。'
      syncPlatformTemplateToLocalPreviewCache(buildPlatformPremiumGridTemplateSettings())
    }
  } catch (error) {
    console.error('讀取九宮格平台模板失敗:', error)
    warningMessage.value = error?.response?.data?.message || '讀取九宮格平台模板失敗，請確認後端與權限。'
  } finally {
    configLoading.value = false
  }
}

const mergeSettingsIntoDraft = (incoming = {}) => {
  const preferredGridPrizeSource = Array.isArray(incoming?.gridItems) && incoming.gridItems.length
    ? incoming.gridItems
    : Array.isArray(incoming?.prizes)
      ? incoming.prizes
      : null

  if (preferredGridPrizeSource) {
    settings.prizes.splice(
      0,
      settings.prizes.length,
      ...sanitizeGridPrizeListForSave(preferredGridPrizeSource)
    )
  }

  Object.entries(incoming || {}).forEach(([key, value]) => {
    if (key === 'prizes' || key === 'gridItems') {
      return
    }

    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      settings[key] &&
      typeof settings[key] === 'object' &&
      !Array.isArray(settings[key])
    ) {
      Object.assign(settings[key], value)
      return
    }

    if (key in settings) {
      settings[key] = value
    }
  })
}

const loadSettingsFromGameConfig = async () => {
  if (!canUseGameConfigApi.value) {
    warningMessage.value = '目前是平台模板模式，會儲存到九宮格平台模板資料庫。'
    return
  }

  configLoading.value = true
  savedMessage.value = ''
  warningMessage.value = ''
  inlineSaveMessage.value = ''

  try {
    const response = await getCampaignGameConfigApi(normalizedCampaignId.value)
    const loadedSettings = normalizeGameConfigResponse(response)
    const meta = normalizeGameConfigMeta(response)

    currentCampaignTitle.value =
      meta?.campaign?.title ||
      loadedSettings?.basicText?.pageTitle ||
      currentCampaignTitle.value

    if (meta?.tenantSlug) {
      previewTenantSlug.value = meta.tenantSlug
    }

    if (loadedSettings && Object.keys(loadedSettings).length) {
      mergeSettingsIntoDraft(loadedSettings)
      configLoadedAt.value = new Date().toLocaleString('zh-TW', { hour12: false })
      savedMessage.value = `已讀取活動 #${normalizedCampaignId.value} 的 GameConfig settings。`
      configModeMessage.value = '目前設定已從後端 GameConfig settings 載入，修改後可按「儲存設定」。'
      syncDraftToPreviewStorage({ refresh: true })
    } else {
      configLoadedAt.value = new Date().toLocaleString('zh-TW', { hour12: false })
      savedMessage.value = `活動 #${normalizedCampaignId.value} 尚未有設定，已保留目前預設草稿。`
      configModeMessage.value = '後端目前沒有既有 settings，按「儲存設定」即可建立。'
    }
  } catch (error) {
    console.error('讀取九宮格設定失敗:', error)
    warningMessage.value = error?.response?.data?.message || '讀取九宮格設定失敗，請確認後端與權限。'
  } finally {
    configLoading.value = false
  }
}

const saveSettingsToGameConfig = async () => {
  inlineSaveMessage.value = ''

  if (!canUseGameConfigApi.value) {
    await savePlatformTemplateToDatabase()
    return
  }

  configSaving.value = true
  savedMessage.value = ''
  warningMessage.value = ''
  inlineSaveMessage.value = '儲存中，正在寫入 GameConfig settings...'

  try {
    const payload = buildSettingsSavePayload()
    const saveResponse = await saveCampaignGameConfigApi(normalizedCampaignId.value, payload)
    const savedSettings = normalizeGameConfigResponse(saveResponse)

    if (!isSettingsObjectValid(savedSettings)) {
      throw new Error('後端已回應，但沒有回傳完整 settings，請檢查 game-config API。')
    }

    const reloadResponse = await getCampaignGameConfigApi(normalizedCampaignId.value)
    const reloadedSettings = normalizeGameConfigResponse(reloadResponse)
    const meta = normalizeGameConfigMeta(reloadResponse)

    if (!isSettingsObjectValid(reloadedSettings)) {
      throw new Error('儲存後重新讀取不到完整 settings，資料庫可能沒有成功寫入。')
    }

    mergeSettingsIntoDraft(reloadedSettings)

    if (meta?.campaign?.title) {
      currentCampaignTitle.value = meta.campaign.title
    } else if (reloadedSettings?.basicText?.pageTitle) {
      currentCampaignTitle.value = reloadedSettings.basicText.pageTitle
    }

    if (meta?.tenantSlug) {
      previewTenantSlug.value = meta.tenantSlug
    }

    configSavedAt.value = new Date().toLocaleString('zh-TW', { hour12: false })
    configLoadedAt.value = configSavedAt.value
    savedMessage.value = `已同步資料庫：${campaignDisplayName.value} 的九宮格設定已寫入 PostgreSQL，並已重新讀取確認。`
    inlineSaveMessage.value = '儲存完成：已寫入資料庫並重新讀取確認，正式玩家頁重新整理後會同步。'
    configModeMessage.value = '設定已正式儲存到後端 GameConfig settings；重新進入此頁會讀取資料庫設定。'
    syncDraftToPreviewStorage({ refresh: true })
  } catch (error) {
    console.error('儲存九宮格設定失敗:', error)

    if (isNotFoundApiError(error)) {
      warningMessage.value = buildMissingCampaignMessage()
      inlineSaveMessage.value = warningMessage.value
      configModeMessage.value = '儲存失敗：活動不存在正式資料庫，請不要使用本機暫存活動 ID。'
    } else {
      warningMessage.value = error?.response?.data?.message || error?.message || '儲存九宮格設定失敗，請確認後端與權限。'
      inlineSaveMessage.value = warningMessage.value
    }
  } finally {
    configSaving.value = false
  }
}


const buildAdminPreviewDraftPayload = () => {
  return {
    source: 'AdminPremiumGridSettingsView',
    updatedAt: new Date().toISOString(),
    settings: JSON.parse(JSON.stringify(settings))
  }
}

const postDraftToPreviewIframe = (payload = null) => {
  if (typeof window === 'undefined') return

  const iframeWindow = formalPreviewIframeRef.value?.contentWindow
  if (!iframeWindow) return

  iframeWindow.postMessage({
    type: 'MGP_PREMIUM_GRID_ADMIN_DRAFT_UPDATE',
    draftKey: adminPreviewDraftKey.value,
    payload: payload || buildAdminPreviewDraftPayload()
  }, window.location.origin)
}

const syncDraftToPreviewStorage = ({ refresh = false } = {}) => {
  if (!livePreviewEnabled.value || typeof window === 'undefined') return

  try {
    const payload = buildAdminPreviewDraftPayload()
    window.localStorage.setItem(adminPreviewDraftKey.value, JSON.stringify(payload))
    livePreviewLastSyncedAt.value = new Date().toLocaleTimeString('zh-TW', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })

    // 第 80801～81200 批：一般欄位修改改用 postMessage 更新 iframe，
    // 不再每次刷新 src，避免先閃遠端 A 商家資料再跳回草稿。
    postDraftToPreviewIframe(payload)

    if (refresh) {
      refreshFormalPreview()
    }
  } catch (error) {
    console.error('同步九宮格即時預覽草稿失敗：', error)
    warningMessage.value = '即時預覽同步失敗，請改用儲存設定後重新載入預覽。'
  }
}

const scheduleDraftPreviewSync = () => {
  if (!livePreviewEnabled.value || typeof window === 'undefined') return

  window.clearTimeout(livePreviewDebounceTimer.value)
  livePreviewDebounceTimer.value = window.setTimeout(() => {
    syncDraftToPreviewStorage({ refresh: false })
  }, 120)
}

const refreshFormalPreview = () => {
  previewRefreshKey.value += 1
}

const copyPlayerUrl = async () => {
  try {
    const absoluteUrl = `${window.location.origin}${formalPlayerPreviewUrl.value}`
    await navigator.clipboard.writeText(absoluteUrl)
    savedMessage.value = `已複製玩家連結：${absoluteUrl}`
  } catch (error) {
    warningMessage.value = '複製玩家連結失敗，請手動複製右側網址。'
  }
}

const goCampaignsAndSerial = () => {
  router.push('/admin/campaigns')
}

const cloneDefaultValue = (value) => JSON.parse(JSON.stringify(value))

const resetSectionSettings = (sectionKey) => {
  if (!window.confirm(`確定要還原「${sectionKey}」這個功能區塊嗎？`)) return

  const resetMap = {
    basicText: () => {
      Object.assign(settings.basicText, cloneDefaultValue(makeDefaultBasicTextSettings()))
      Object.assign(settings.textSize, cloneDefaultValue(makeDefaultTextSizeSettings()))
      Object.assign(settings.officialLink, cloneDefaultValue(makeDefaultOfficialLinkSettings()))
    },
    theme: () => Object.assign(settings.theme, cloneDefaultValue(makeDefaultThemeSettings())),
    prizes: () => settings.prizes.splice(0, settings.prizes.length, ...cloneDefaultValue(makeDefaultPrizeSettings())),
    gridStyle: () => Object.assign(settings.gridStyle, {
      gridCardSize: 128,
      gridGap: 12,
      gridRadius: 24,
      gridBorderWidth: 3,
      gridShadow: true,
      centerButtonText: '點擊抽獎'
    }),
    share: () => Object.assign(settings.share, {
      shareTitle: '老茶棧｜九宮格抽獎活動',
      shareUrl: 'https://www.love888.xyz/play/a-shop/premium-grid',
      shareDescription: '快來參加九宮格抽獎活動，輸入序號就有機會中大獎！',
      shareImageUrl: 'https://lady.love888.xyz/items/grid-share.png',
      systemShareButtonText: '分享'
    }),
    serial: () => Object.assign(settings.serial, cloneDefaultValue(makeDefaultSerialSettings()))
  }

  if (resetMap[sectionKey]) {
    resetMap[sectionKey]()
    savedMessage.value = `已還原「${sectionKey}」區塊設定。`
    syncDraftToPreviewStorage({ refresh: true })
    return
  }

  warningMessage.value = '這個區塊尚未設定專用還原，請使用頁面重設。'
}

const normalizeProbabilityTo100 = () => {
  const editablePrizes = settings.prizes.filter(isDrawableGridPrizeItem)
  if (!editablePrizes.length) return

  const average = Math.floor((100 / editablePrizes.length) * 100) / 100
  let used = 0

  editablePrizes.forEach((item, index) => {
    if (index === editablePrizes.length - 1) {
      item.probabilityPercent = Number((100 - used).toFixed(2))
    } else {
      item.probabilityPercent = average
      used += average
    }
    item.weight = item.probabilityPercent
  })

  savedMessage.value = '已將啟用獎項機率平均分配為 100%。'
  syncDraftToPreviewStorage({ refresh: true })
}

const syncPrizeWeightFromPercent = (item) => {
  const percent = getGridPrizePercent(item)
  item.probabilityPercent = percent
  item.weight = percent
  item.probability = percent

  // 只要商家把舊的開始按鈕格改成有機率獎項，就清除舊 BUTTON 標記。
  if (percent > 0 || !isActualGridStartButtonItem(item)) {
    item.isButton = false
    item.type = inferGridPrizeType(item)
    item.rewardType = item.type
  }

  syncPrizeAwardLimit(item)
  probabilitySimulationResults.value = []
}

const handleResultModalImageFile = (event, targetKey) => {
  const file = event?.target?.files?.[0]
  if (!file) return

  if (!String(file.type || '').startsWith('image/')) {
    window.alert('請選擇圖片檔案。')
    event.target.value = ''
    return
  }

  if (file.size > 1024 * 1024 * 1.5) {
    window.alert('圖片建議小於 1.5MB，避免設定資料過大。請先壓縮圖片後再選擇。')
    event.target.value = ''
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    settings.resultModal[targetKey] = String(reader.result || '')
    savedMessage.value = targetKey === 'winImageUrl'
      ? '已套用本機中獎圖片，請儲存設定後同步到正式玩家頁。'
      : '已套用本機未中獎圖片，請儲存設定後同步到正式玩家頁。'
  }
  reader.readAsDataURL(file)
}

const clearResultModalImage = (targetKey) => {
  settings.resultModal[targetKey] = ''
  savedMessage.value = targetKey === 'winImageUrl' ? '已清除中獎圖片。' : '已清除未中獎圖片。'
}

const runCommonMerchantAction = (action) => {
  if (action === 'save') {
    saveSettingsToGameConfig()
    return
  }

  if (action === 'copy') {
    copyPlayerUrl()
    return
  }

  if (action === 'serial') {
    goCampaignsAndSerial()
  }
}

const jumpToSection = (key) => {
  activeSection.value = key
  savedMessage.value = ''
  warningMessage.value = ''

  if (typeof window !== 'undefined') {
    window.setTimeout(() => {
      const target = document.querySelector('[data-settings-panel="main"]')
      target?.scrollIntoView?.({
        behavior: 'smooth',
        block: 'start'
      })
    }, 80)
  }
}

const setActiveSection = (key) => {
  activeSection.value = key
  savedMessage.value = ''
  warningMessage.value = ''
}

const markDraftSaved = () => {
  savedMessage.value = '這裡不再提供草稿儲存；已改為正式儲存平台模板。需要備份請用「複製設定 JSON」。'
  warningMessage.value = ''
}

const copyDraftJson = async () => {
  try {
    await navigator.clipboard.writeText(exportDraftJson.value)
    savedMessage.value = '已複製目前九宮格設定 JSON 備份。'
  } catch (error) {
    warningMessage.value = '複製失敗，請手動複製 JSON。'
  }
}

const resetToDefault = () => {
  if (!window.confirm('確定要重設為預設九宮格設定嗎？')) return
  window.location.reload()
}

const goBackCampaigns = () => {
  router.push('/admin/campaigns')
}

const runPreviewDraw = () => {
  if (previewDrawing.value) return

  previewDrawing.value = true
  savedMessage.value = '預覽模式：只播放右側跑燈，不會送出 verify/play API。'

  let count = 0
  const timer = window.setInterval(() => {
    previewActiveIndex.value = count % 9
    count += 1

    if (count > 18) {
      window.clearInterval(timer)
      previewActiveIndex.value = 7
      previewDrawing.value = false
    }
  }, 90)
}

const handlePreviewEvent = (label) => {
  savedMessage.value = `預覽事件：${label}。目前不會送出 API。`
}

const getInputClass = () => {
  return 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100'
}

watch(
  settings,
  () => {
    scheduleDraftPreviewSync()
  },
  {
    deep: true
  }
)

watch(
  [previewTenantSlug, livePreviewEnabled],
  () => {
    syncDraftToPreviewStorage({ refresh: true })
  }
)

onMounted(() => {
  if (canUseGameConfigApi.value) {
    loadSettingsFromGameConfig()
  } else {
    loadPlatformTemplateFromDatabase()
  }

  syncDraftToPreviewStorage({ refresh: true })
})

</script>

<template>
  <div class="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-7xl space-y-6">
      <header class="rounded-[32px] border border-violet-100 bg-white p-6 shadow-sm">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p class="text-sm font-black uppercase tracking-[0.22em] text-violet-600">
              V2.3 第 21500-2 批｜正式活動不存在防呆
            </p>
            <h1 class="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              九宮格商家後台設定中心
            </h1>
            <p class="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
              本批防止使用不存在資料庫的活動 ID：如果 API 回 404，會提示返回活動管理清除本機暫存活動，避免把本機假 ID 拿去儲存。
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <button type="button" class="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50" @click="goBackCampaigns">
              返回活動管理
            </button>
            <button
              type="button"
              :disabled="!canUseGameConfigApi || configLoading"
              class="rounded-2xl border border-blue-200 bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
              @click="loadSettingsFromGameConfig"
            >
              {{ configLoading ? '讀取中...' : '讀取設定' }}
            </button>
            <button
              type="button"
              :disabled="configSaving"
              class="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              @click="saveSettingsToGameConfig"
            >
              {{ configSaving ? '儲存中...' : '儲存設定' }}
            </button>
            <button
              type="button"
              class="rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-700 shadow-sm transition hover:bg-emerald-50"
              @click="copyPlayerUrl"
            >
              複製玩家連結
            </button>
            <button
              type="button"
              class="rounded-2xl border border-amber-200 bg-white px-4 py-2 text-sm font-black text-amber-700 shadow-sm transition hover:bg-amber-50"
              @click="goCampaignsAndSerial"
            >
              回活動 / 序號
            </button>
            <button type="button" class="rounded-2xl border border-violet-200 bg-white px-4 py-2 text-sm font-black text-violet-700 shadow-sm transition hover:bg-violet-50" @click="copyDraftJson">
              複製設定 JSON
            </button>
            <button type="button" class="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-slate-800" @click="markDraftSaved">
              複製備份 JSON
            </button>
          </div>
        </div>

        <div class="mt-4 grid gap-3 md:grid-cols-4">
          <div class="rounded-2xl bg-violet-50 px-4 py-3">
            <p class="text-xs font-black text-violet-500">目前活動 ID</p>
            <p class="mt-1 text-lg font-black text-violet-900">#{{ campaignId }}</p>
          </div>
          <div class="rounded-2xl bg-emerald-50 px-4 py-3">
            <p class="text-xs font-black text-emerald-500">預覽來源</p>
            <p class="mt-1 text-lg font-black text-emerald-800">{{ isTemplateDraftMode ? '平台模板預覽' : '正式玩家頁 iframe' }}</p>
          </div>
          <div class="rounded-2xl bg-amber-50 px-4 py-3">
            <p class="text-xs font-black text-amber-500">設定 API</p>
            <p class="mt-1 text-lg font-black text-amber-800">{{ canUseGameConfigApi ? '資料庫儲存' : '平台模板資料庫' }}</p>
          </div>
          <div class="rounded-2xl bg-blue-50 px-4 py-3">
            <p class="text-xs font-black text-blue-500">讀取 / 儲存</p>
            <p class="mt-1 text-xs font-black leading-5 text-blue-800">
              讀取：{{ configLoadedAt || '尚未讀取' }}<br />
              儲存：{{ configSavedAt || '尚未儲存' }}
            </p>
          </div>
        </div>

        <section class="mt-4 rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p class="text-sm font-black text-violet-600">
                商家快速操作台
              </p>
              <h2 class="mt-1 text-2xl font-black text-slate-950">
                先改畫面 → 儲存預覽 → 產生序號
              </h2>
              <p class="mt-2 text-sm font-bold leading-6 text-slate-500">
                {{ simpleModeHint }}
              </p>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                :class="[
                  'rounded-2xl px-4 py-2 text-sm font-black shadow-sm transition',
                  simpleMode
                    ? 'bg-violet-600 text-white hover:bg-violet-700'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                ]"
                @click="simpleMode = true"
              >
                簡易模式
              </button>
              <button
                type="button"
                :class="[
                  'rounded-2xl px-4 py-2 text-sm font-black shadow-sm transition',
                  !simpleMode
                    ? 'bg-slate-950 text-white hover:bg-slate-800'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                ]"
                @click="simpleMode = false"
              >
                完整模式
              </button>
            </div>
          </div>

          <div class="mt-5 grid gap-3 md:grid-cols-3">
            <button
              v-for="card in quickActionCards"
              :key="card.key"
              type="button"
              class="group rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50"
              @click="jumpToSection(card.sectionKey)"
            >
              <p class="text-base font-black text-slate-950">
                {{ card.title }}
              </p>
              <p class="mt-2 text-sm font-bold leading-6 text-slate-500">
                {{ card.description }}
              </p>
              <p class="mt-3 text-xs font-black text-violet-600">
                點我前往 →
              </p>
            </button>
          </div>

          <div class="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">
            {{ currentSectionProgressText }}
          </div>
        </section>

        <div class="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold leading-6 text-blue-700">
          {{ configModeMessage }}
        </div>

        <div v-if="savedMessage" class="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {{ savedMessage }}
        </div>

        <div v-if="warningMessage" class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {{ warningMessage }}
        </div>
      </header>

      <section class="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-sm font-black text-violet-600">
              商家五大常用功能
            </p>
            <h2 class="mt-1 text-2xl font-black text-slate-950">
              商家只需要照這五格完成設定
            </h2>
            <p class="mt-2 text-sm font-bold leading-6 text-slate-500">
              進階設定已收合，日常只需要改這五個區塊就能完成九宮格活動。
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-violet-700"
              @click="simpleMode = true"
            >
              商家簡易版
            </button>
            <button
              type="button"
              class="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
              @click="simpleMode = false"
            >
              進階完整設定
            </button>
          </div>
        </div>

        <div class="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <button
            v-for="card in merchantCoreFunctionCards"
            :key="card.key"
            type="button"
            class="rounded-[28px] border border-slate-200 bg-slate-50 px-4 py-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50 hover:shadow-md"
            @click="jumpToSection(card.sectionKey)"
          >
            <div class="flex items-center gap-3">
              <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-base font-black text-violet-600 shadow-sm">
                {{ card.icon }}
              </span>
              <div>
                <p class="text-base font-black text-slate-950">
                  {{ card.title }}
                </p>
                <p class="mt-1 text-xs font-black text-emerald-600">
                  {{ card.status }}
                </p>
              </div>
            </div>
            <p class="mt-4 text-sm font-bold leading-6 text-slate-500">
              {{ card.description }}
            </p>
          </button>
        </div>
      </section>

      <section class="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div class="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p class="text-sm font-black text-violet-600">
                商家設定完成度
              </p>
              <h2 class="mt-1 text-2xl font-black text-slate-950">
                {{ completionPercent }}% 已準備完成
              </h2>
              <p class="mt-2 text-sm font-bold leading-6 text-slate-500">
                完成基本文字、主題、獎項、分享與預覽同步後，就可以回活動管理產生序號。
              </p>
            </div>

            <div class="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-2xl font-black text-white shadow-lg shadow-violet-200">
              {{ completionPercent }}%
            </div>
          </div>

          <div class="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              class="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-400 transition-all"
              :style="{ width: `${completionPercent}%` }"
            ></div>
          </div>

          <div class="mt-4 grid gap-2 sm:grid-cols-5">
            <div
              v-for="item in completionChecks"
              :key="item.key"
              :class="[
                'rounded-2xl px-3 py-3 text-xs font-black',
                item.done ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'
              ]"
            >
              <p>{{ item.done ? '✅' : '○' }} {{ item.label }}</p>
              <p class="mt-1 text-[11px] opacity-75">{{ item.tip }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-black text-slate-500">
            常用操作
          </p>
          <div class="mt-4 grid gap-3">
            <button
              v-for="action in commonMerchantActions"
              :key="action.key"
              type="button"
              class="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50"
              @click="runCommonMerchantAction(action.action)"
            >
              <p class="text-base font-black text-slate-950">
                {{ action.title }}
              </p>
              <p class="mt-1 text-sm font-bold text-slate-500">
                {{ action.description }}
              </p>
            </button>
          </div>
        </div>
      </section>

      <section class="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-sm font-black text-slate-500">
              目前設定摘要
            </p>
            <h2 class="mt-1 text-xl font-black text-slate-950">
              商家可以快速確認目前活動內容
            </h2>
          </div>
          <button
            type="button"
            class="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
            @click="refreshFormalPreview"
          >
            重新載入右側預覽
          </button>
        </div>

        <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div
            v-for="item in quickSettingSummary"
            :key="item.label"
            class="rounded-2xl bg-slate-50 px-4 py-3"
          >
            <p class="text-xs font-black text-slate-400">
              {{ item.label }}
            </p>
            <p class="mt-1 truncate text-sm font-black text-slate-800">
              {{ item.value }}
            </p>
          </div>
        </div>
      </section>

      <section class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_580px]">
        <div class="space-y-6">
          <section class="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 class="text-xl font-black text-slate-950">
                  設定分類
                </h2>
                <p class="mt-1 text-sm text-slate-500">
                  簡易模式會隱藏較少用的進階項目，讓商家操作更清楚。
                </p>
              </div>
              <div class="flex gap-2">
                <button type="button" class="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white" @click="simpleMode = !simpleMode">
                  {{ simpleMode ? '顯示完整設定' : '回到簡易模式' }}
                </button>
                <button type="button" class="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700" @click="resetToDefault">
                  重設
                </button>
              </div>
            </div>

            <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <button
                v-for="section in visibleSections"
                :key="section.key"
                type="button"
                :class="[
                  'group rounded-3xl border px-4 py-4 text-left transition',
                  activeSection === section.key
                    ? 'border-violet-500 bg-violet-600 text-white shadow-lg shadow-violet-200'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-violet-200 hover:bg-violet-50'
                ]"
                @click="setActiveSection(section.key)"
              >
                <div class="flex items-center gap-3">
                  <span
                    :class="[
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black shadow-sm',
                      activeSection === section.key ? 'bg-white/20 text-white' : 'bg-white text-slate-600'
                    ]"
                  >
                    {{ section.icon }}
                  </span>
                  <div>
                    <p class="font-black">{{ section.label }}</p>
                    <p :class="['mt-1 text-xs leading-5', activeSection === section.key ? 'text-violet-100' : 'text-slate-500']">
                      {{ section.description }}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </section>

          <section
            data-settings-panel="main"
            class="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-sm font-black text-violet-600">
                  {{ activeSectionInfo.icon }} {{ activeSectionInfo.label }}
                  <span
                    v-if="isAdvancedSection(activeSection)"
                    class="ml-2 rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700"
                  >
                    進階
                  </span>
                </p>
                <h2 class="mt-1 text-2xl font-black text-slate-950">
                  {{ activeSectionInfo.description }}
                </h2>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
                  @click="saveSettingsToGameConfig"
                >
                  儲存設定
                </button>
                <button
                  type="button"
                  class="rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-black text-rose-700 transition hover:bg-rose-50"
                  @click="resetSectionSettings(activeSection)"
                >
                  還原此功能
                </button>
                <button
                  type="button"
                  class="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                  @click="markDraftSaved"
                >
                  複製備份 JSON
                </button>
              </div>
              <p
                v-if="inlineSaveMessage"
                class="mt-2 w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black leading-6 text-emerald-700"
              >
                {{ inlineSaveMessage }}
              </p>
            </div>

            <div v-if="activeSection === 'basicText'" class="mt-6 space-y-6">
              <div class="grid gap-4 md:grid-cols-2">
                <label class="space-y-2"><span class="text-sm font-black text-slate-700">頁面標題 pageTitle</span><input v-model="settings.basicText.pageTitle" :class="getInputClass()" /></label>
                <label class="space-y-2"><span class="text-sm font-black text-slate-700">品牌名稱 brandName</span><input v-model="settings.basicText.brandName" :class="getInputClass()" /></label>
                <label class="space-y-2"><span class="text-sm font-black text-slate-700">品牌副標 brandSubtitle</span><input v-model="settings.basicText.brandSubtitle" :class="getInputClass()" /></label>
                <label class="space-y-2"><span class="text-sm font-black text-slate-700">主標 headline</span><input v-model="settings.basicText.headline" :class="getInputClass()" /></label>
                <label class="space-y-2"><span class="text-sm font-black text-slate-700">副標 subtitle</span><input v-model="settings.basicText.subtitle" :class="getInputClass()" /></label>
                <label class="space-y-2"><span class="text-sm font-black text-slate-700">標籤文字 badgeText</span><input v-model="settings.basicText.badgeText" :class="getInputClass()" /></label>
                <label class="space-y-2"><span class="text-sm font-black text-slate-700">抽獎按鈕文字 playButtonText</span><input v-model="settings.basicText.playButtonText" :class="getInputClass()" /><span class="block text-xs font-bold text-slate-400">同步控制九宮格中間紅色按鈕與下方白色開始按鈕文字。</span></label>
              </div>

              <div class="rounded-3xl border border-violet-100 bg-violet-50 p-5">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <p class="text-sm font-black text-violet-700">文字大小調整</p>
                    <p class="mt-1 text-xs font-bold text-violet-500">調整後會同步到右側即時預覽草稿。</p>
                  </div>
                  <button type="button" class="rounded-2xl border border-violet-200 bg-white px-4 py-2 text-xs font-black text-violet-700" @click="Object.assign(settings.textSize, makeDefaultTextSizeSettings())">
                    還原文字大小
                  </button>
                </div>

                <div class="mt-4 grid gap-4 md:grid-cols-2">
                  <label class="space-y-2"><span class="text-sm font-black text-slate-700">主標大小 headlineSize：{{ settings.textSize.headlineSize }}px</span><input v-model.number="settings.textSize.headlineSize" type="range" min="24" max="56" class="w-full" /></label>
                  <label class="space-y-2"><span class="text-sm font-black text-slate-700">副標大小 subtitleSize：{{ settings.textSize.subtitleSize }}px</span><input v-model.number="settings.textSize.subtitleSize" type="range" min="18" max="44" class="w-full" /></label>
                  <label class="space-y-2"><span class="text-sm font-black text-slate-700">品牌名稱大小 brandNameSize：{{ settings.textSize.brandNameSize }}px</span><input v-model.number="settings.textSize.brandNameSize" type="range" min="12" max="32" class="w-full" /></label>
                  <label class="space-y-2"><span class="text-sm font-black text-slate-700">抽獎按鈕文字大小 buttonTextSize：{{ settings.textSize.buttonTextSize }}px</span><input v-model.number="settings.textSize.buttonTextSize" type="range" min="12" max="32" class="w-full" /></label>
                  <label class="space-y-2"><span class="text-sm font-black text-slate-700">獎品文字大小 prizeTextSize：{{ settings.textSize.prizeTextSize }}px</span><input v-model.number="settings.textSize.prizeTextSize" type="range" min="10" max="24" class="w-full" /></label>
                </div>
              </div>

              <div class="rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <p class="text-sm font-black text-emerald-700">官方品牌連結按鈕</p>
                    <p class="mt-1 text-xs font-bold text-emerald-600">顯示在玩家頁品牌卡右上方，可連到官方網站、LINE、品牌頁。</p>
                  </div>
                  <button
                    type="button"
                    class="rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-xs font-black text-emerald-700"
                    @click="Object.assign(settings.officialLink, makeDefaultOfficialLinkSettings())"
                  >
                    還原官方連結
                  </button>
                </div>

                <div class="mt-4 grid gap-4 md:grid-cols-2">
                  <label class="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm">
                    <input v-model="settings.officialLink.enabled" type="checkbox" class="h-5 w-5" />
                    顯示官方品牌按鈕
                  </label>
                  <label class="space-y-2">
                    <span class="text-sm font-black text-slate-700">按鈕文字 label</span>
                    <input v-model="settings.officialLink.label" :class="getInputClass()" placeholder="官方品牌" />
                  </label>
                  <label class="space-y-2 md:col-span-2">
                    <span class="text-sm font-black text-slate-700">連結網址 url</span>
                    <input v-model="settings.officialLink.url" :class="getInputClass()" placeholder="https://..." />
                  </label>
                  <label class="space-y-2">
                    <span class="text-sm font-black text-slate-700">文字大小 textSize：{{ settings.officialLink.textSize }}px</span>
                    <input v-model.number="settings.officialLink.textSize" type="range" min="10" max="20" class="w-full" />
                  </label>
                  <label class="space-y-2">
                    <span class="text-sm font-black text-slate-700">文字顏色 textColor</span>
                    <input v-model="settings.officialLink.textColor" type="color" class="h-12 w-full rounded-2xl border border-slate-200 bg-white p-1" />
                  </label>
                  <label class="space-y-2">
                    <span class="text-sm font-black text-slate-700">背景顏色 backgroundColor</span>
                    <input v-model="settings.officialLink.backgroundColor" type="color" class="h-12 w-full rounded-2xl border border-slate-200 bg-white p-1" />
                  </label>
                </div>
              </div>
            </div>

            <div v-else-if="activeSection === 'theme'" class="mt-6 grid gap-4 md:grid-cols-2">
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">背景上方 themeStart</span><input v-model="settings.theme.themeStart" type="color" class="h-14 w-full rounded-2xl border border-slate-200 bg-white p-2" /></label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">背景中段 themeMiddle</span><input v-model="settings.theme.themeMiddle" type="color" class="h-14 w-full rounded-2xl border border-slate-200 bg-white p-2" /></label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">背景底部 themeEnd</span><input v-model="settings.theme.themeEnd" type="color" class="h-14 w-full rounded-2xl border border-slate-200 bg-white p-2" /></label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">格子顏色 cardColor</span><input v-model="settings.theme.cardColor" type="color" class="h-14 w-full rounded-2xl border border-slate-200 bg-white p-2" /></label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">中間格顏色 cardActiveColor</span><input v-model="settings.theme.cardActiveColor" type="color" class="h-14 w-full rounded-2xl border border-slate-200 bg-white p-2" /></label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">九宮格底框 gridFrameColor</span><input v-model="settings.theme.gridFrameColor" type="color" class="h-14 w-full rounded-2xl border border-slate-200 bg-white p-2" /></label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">按鈕顏色 buttonColor</span><input v-model="settings.theme.buttonColor" type="color" class="h-14 w-full rounded-2xl border border-slate-200 bg-white p-2" /></label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">按鈕文字 buttonTextColor</span><input v-model="settings.theme.buttonTextColor" type="color" class="h-14 w-full rounded-2xl border border-slate-200 bg-white p-2" /></label>
            </div>

            <div v-else-if="activeSection === 'activityTime'" class="mt-6 grid gap-4 md:grid-cols-2">
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">活動開始時間</span><input v-model="settings.activityTime.startAt" type="datetime-local" :class="getInputClass()" /></label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">活動結束時間</span><input v-model="settings.activityTime.endAt" type="datetime-local" :class="getInputClass()" /></label>
              <label class="space-y-2 md:col-span-2"><span class="text-sm font-black text-slate-700">活動已結束文字</span><input v-model="settings.activityTime.endedText" :class="getInputClass()" /></label>
              <label class="space-y-2 md:col-span-2"><span class="text-sm font-black text-slate-700">活動尚未開始文字</span><input v-model="settings.activityTime.notStartedText" :class="getInputClass()" /></label>
            </div>

            <div v-else-if="activeSection === 'stage'" class="mt-6 grid gap-4 md:grid-cols-2">
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">Logo 文字</span><input v-model="settings.stage.logoText" maxlength="2" :class="getInputClass()" /></label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">背景圖片網址</span><input v-model="settings.stage.backgroundImageUrl" :class="getInputClass()" /></label>
              <label class="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-black text-slate-700"><input v-model="settings.stage.brandCardEnabled" type="checkbox" class="h-5 w-5" />顯示品牌卡片</label>
              <label class="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-black text-slate-700"><input v-model="settings.stage.dottedBackground" type="checkbox" class="h-5 w-5" />顯示點點背景</label>
            </div>

            <div v-else-if="activeSection === 'gridStyle'" class="mt-6 grid gap-5 md:grid-cols-2">
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">格子大小 gridCardSize</span><input v-model.number="settings.gridStyle.gridCardSize" type="range" min="96" max="160" class="w-full" /><p class="text-lg font-black text-slate-700">{{ settings.gridStyle.gridCardSize }}px</p></label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">格子間距 gridGap</span><input v-model.number="settings.gridStyle.gridGap" type="range" min="4" max="28" class="w-full" /><p class="text-lg font-black text-slate-700">{{ settings.gridStyle.gridGap }}px</p></label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">格子圓角 gridRadius</span><input v-model.number="settings.gridStyle.gridRadius" type="range" min="8" max="40" class="w-full" /><p class="text-lg font-black text-slate-700">{{ settings.gridStyle.gridRadius }}px</p></label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">邊框寬度 gridBorderWidth</span><input v-model.number="settings.gridStyle.gridBorderWidth" type="range" min="0" max="8" class="w-full" /><p class="text-lg font-black text-slate-700">{{ settings.gridStyle.gridBorderWidth }}px</p></label>
              <label class="space-y-2 md:col-span-2"><span class="text-sm font-black text-slate-700">中間按鈕文字</span><input v-model="settings.gridStyle.centerButtonText" :class="getInputClass()" /></label>
            </div>

            <div v-else-if="activeSection === 'prizes'" class="mt-6 space-y-4">
              <div :class="['rounded-2xl border px-4 py-3 text-sm font-black', probabilityStatusClass]">
                {{ probabilityStatusText }}
              </div>

              <div class="rounded-[28px] border border-indigo-100 bg-indigo-50 p-5">
                <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p class="text-xs font-black uppercase tracking-[0.22em] text-indigo-500">Backend Probability Guard｜第 79201～79600 批</p>
                    <h3 class="mt-2 text-xl font-black text-slate-950">{{ probabilityBackendGuard.title }}</h3>
                    <p class="mt-2 text-sm font-bold leading-6 text-indigo-700">{{ probabilityBackendGuard.description }}</p>
                    <p class="mt-2 text-xs font-black text-indigo-500">{{ probabilityBackendGuard.source }}</p>
                  </div>
                  <div class="rounded-3xl bg-white px-5 py-4 text-center shadow-sm">
                    <p class="text-xs font-black text-slate-400">後端機率狀態</p>
                    <p class="mt-1 text-sm font-black" :class="probabilityBackendGuard.ok ? 'text-emerald-700' : 'text-rose-700'">{{ probabilityBackendGuard.badge }}</p>
                    <p class="mt-1 text-xs font-bold text-slate-500">{{ probabilityBackendGuard.totalText }}</p>
                  </div>
                </div>
              </div>

              <div class="rounded-[28px] border border-slate-200 bg-white p-5">
                <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p class="text-xs font-black uppercase tracking-[0.22em] text-fuchsia-500">Percent Simulator｜第 79601～80000 批</p>
                    <h3 class="mt-2 text-lg font-black text-slate-950">九宮格機率試算器</h3>
                    <p class="mt-1 text-sm font-bold text-slate-500">預設收合，資料多時不佔版面；展開後可用同一組後台百分比模擬。</p>
                    <p class="mt-2 text-xs font-black text-slate-400">目前可試算 {{ probabilitySimulationSummary.itemCount }} 個獎項，總和 {{ probabilitySimulationSummary.totalText }}。</p>
                  </div>
                  <div class="flex flex-wrap items-center gap-2">
                    <span v-if="probabilitySimulationResults.length" class="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">已試算 {{ probabilitySimulationCount }} 次</span>
                    <button
                      type="button"
                      class="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 px-4 py-3 text-sm font-black text-fuchsia-700"
                      @click="probabilitySimulatorOpen = !probabilitySimulatorOpen"
                    >
                      {{ probabilitySimulatorOpen ? '收合試算器' : '展開試算器' }}
                    </button>
                  </div>
                </div>

                <div v-if="probabilitySimulatorOpen" class="mt-4 space-y-4 rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p class="text-sm font-bold leading-6 text-slate-500">此處用同一組後台百分比模擬；正式玩家抽獎仍由後端 Draw Engine 計算。</p>
                    <div class="flex flex-wrap items-center gap-2">
                      <input v-model.number="probabilitySimulationCount" type="number" min="100" max="10000" step="100" class="w-32 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black" />
                      <button type="button" class="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white" @click="runProbabilitySimulation">開始試算</button>
                    </div>
                  </div>

                  <div v-if="probabilitySimulationResults.length" class="max-h-80 overflow-auto rounded-2xl border border-slate-100 bg-white">
                    <table class="w-full min-w-[640px] text-left text-sm">
                      <thead class="sticky top-0 bg-slate-950 text-white">
                        <tr>
                          <th class="px-4 py-3">獎項</th>
                          <th class="px-4 py-3">設定%</th>
                          <th class="px-4 py-3">理論命中</th>
                          <th class="px-4 py-3">模擬命中</th>
                          <th class="px-4 py-3">最多發出</th>
                          <th class="px-4 py-3">次數</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100 bg-white">
                        <tr v-for="item in probabilitySimulationResults" :key="item.id">
                          <td class="px-4 py-3 font-black text-slate-800">{{ item.icon }} {{ item.title }}</td>
                          <td class="px-4 py-3 font-black text-slate-600">{{ item.percent }}%</td>
                          <td class="px-4 py-3 font-black text-indigo-700">{{ item.theoreticalPercent }}%</td>
                          <td class="px-4 py-3 font-black text-emerald-700">{{ item.simulatedPercent }}%</td>
                          <td class="px-4 py-3 font-black text-amber-700">{{ item.awardLimit > 0 ? item.awardLimit + ' 張' : '不限制' }}</td>
                          <td class="px-4 py-3 font-black text-slate-500">{{ item.hits }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div v-else class="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm font-bold text-slate-500">
                    尚未試算。輸入模擬次數後按「開始試算」，結果會顯示在這裡。
                  </div>
                </div>
              </div>

              <div class="rounded-[28px] border border-amber-200 bg-amber-50 p-5 text-sm font-bold leading-6 text-amber-800">
                <p class="text-xs font-black uppercase tracking-[0.18em] text-amber-600">Award Limit｜第 110401～110800 批</p>
                <h3 class="mt-2 text-lg font-black text-slate-950">小批量抽獎券防超發控管</h3>
                <p class="mt-2">機率只能控制長期平均，11 張、20 張這種小批量很容易短期偏高。請在每個中獎獎項設定「最多發出數量」，後端 Draw Engine 會在達到上限後自動排除該獎項，避免商家超發虧損。</p>
                <p class="mt-1 text-xs font-black text-amber-700">範例：今天發 11 張券，折價券 100 最多發 1 張、折價券 200 最多發 0～1 張，其餘會落到銘謝惠顧 / 再接再厲。</p>
              </div>

              <div class="flex flex-wrap gap-2">
                <button type="button" class="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white" @click="normalizeProbabilityTo100">
                  平均分配成 100%
                </button>
                <button type="button" class="rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-black text-rose-700" @click="resetSectionSettings('prizes')">
                  還原獎項設定
                </button>
              </div>

              <div class="grid gap-4 md:grid-cols-3">
                <div v-for="item in settings.prizes" :key="item.position" class="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div class="mb-3 flex items-center justify-between">
                    <span class="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700">第 {{ item.position }} 格</span>
                    <label class="flex items-center gap-2 text-xs font-bold text-slate-600"><input v-model="item.enabled" type="checkbox" />啟用</label>
                  </div>

                  <div class="mb-3 flex items-center gap-3 rounded-2xl bg-white p-3">
                    <div class="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-yellow-100 text-2xl shadow-sm">
                      <img v-if="item.imageUrl" :src="item.imageUrl" alt="" class="h-full w-full object-cover" />
                      <span v-else>{{ item.icon || '🎁' }}</span>
                    </div>
                    <div class="min-w-0">
                      <p class="truncate text-sm font-black text-slate-900">{{ item.title || item.name }}</p>
                      <p class="text-xs font-bold text-slate-400">{{ item.probabilityPercent || 0 }}%</p>
                    </div>
                  </div>

                  <div class="grid gap-3">
                    <label class="space-y-1"><span class="text-xs font-black text-slate-500">emoji icon</span><input v-model="item.icon" :class="getInputClass()" /></label>
                    <label class="space-y-1"><span class="text-xs font-black text-slate-500">獎品圖片網址 imageUrl</span><input v-model="item.imageUrl" :class="getInputClass()" placeholder="https://..." /></label>
                    <label class="space-y-1"><span class="text-xs font-black text-slate-500">獎品名稱 title</span><input v-model="item.title" :class="getInputClass()" /></label>
                    <div class="grid grid-cols-2 gap-2 xl:grid-cols-3">
                      <label class="space-y-1"><span class="text-xs font-black text-slate-500">庫存</span><input v-model.number="item.quantity" type="number" min="0" :class="getInputClass()" @input="syncPrizeAwardLimit(item)" /></label>
                      <label class="space-y-1"><span class="text-xs font-black text-slate-500">最多發出數量</span><input v-model.number="item.awardLimit" type="number" min="0" step="1" :class="getInputClass()" @input="syncPrizeAwardLimit(item)" /></label>
                      <label class="space-y-1">
                        <span class="text-xs font-black text-slate-500">機率 %</span>
                        <input v-model.number="item.probabilityPercent" type="number" min="0" max="100" step="0.1" :class="getInputClass()" @input="syncPrizeWeightFromPercent(item)" />
                      </label>
                    </div>
                    <p class="rounded-2xl bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-700">最多發出數量是後端防超發硬上限；達到上限後，此獎項會自動排除，改由其他可用獎項 / 未中獎項承接。</p>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="activeSection === 'serial'" class="mt-6 space-y-5">
              <div class="rounded-[28px] border border-indigo-100 bg-indigo-50 p-5">
                <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p class="text-sm font-black text-indigo-700">序號抽獎模式</p>
                    <h3 class="mt-1 text-xl font-black text-slate-950">
                      {{ settings.serial.requireSerial ? '需要序號才能抽獎' : '不需要序號，玩家可直接玩' }}
                    </h3>
                    <p class="mt-2 text-sm font-bold leading-6 text-indigo-700">
                      {{ serialModeDescription }}
                    </p>
                  </div>
                  <label class="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm">
                    <input v-model="settings.serial.requireSerial" type="checkbox" class="h-5 w-5" />
                    啟用序號驗證
                  </label>
                </div>
              </div>

              <div class="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <section class="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                  <div class="flex items-center justify-between gap-3">
                    <div>
                      <p class="text-sm font-black text-slate-700">序號格式設定</p>
                      <p class="mt-1 text-xs font-bold text-slate-500">這裡控制之後產生序號時的格式與數量。</p>
                    </div>
                    <button
                      type="button"
                      class="rounded-2xl border border-rose-200 bg-white px-4 py-2 text-xs font-black text-rose-700"
                      @click="resetSectionSettings('serial')"
                    >
                      還原序號設定
                    </button>
                  </div>

                  <div class="mt-4 grid gap-4 md:grid-cols-2">
                    <label class="space-y-2">
                      <span class="text-sm font-black text-slate-700">序號格式 formatMode</span>
                      <select v-model="settings.serial.formatMode" :class="getInputClass()">
                        <option value="PREFIX-RANDOM">前綴 + 隨機碼，例如 GRID-8K29QX1A</option>
                        <option value="PREFIXDATE-RANDOM">前綴 + 日期 + 隨機碼，例如 GRID-202605-8K29QX1A</option>
                        <option value="RANDOM">純隨機碼，例如 8K29QX1A</option>
                      </select>
                    </label>
                    <label class="space-y-2">
                      <span class="text-sm font-black text-slate-700">序號前綴 prefix</span>
                      <input v-model="settings.serial.prefix" :class="getInputClass()" placeholder="GRID" />
                    </label>
                    <label class="space-y-2">
                      <span class="text-sm font-black text-slate-700">隨機碼長度 codeLength：{{ settings.serial.codeLength }}</span>
                      <input v-model.number="settings.serial.codeLength" type="range" min="4" max="16" class="w-full" />
                    </label>
                    <label class="space-y-2">
                      <span class="text-sm font-black text-slate-700">本批產生數量 batchQuantity</span>
                      <input v-model.number="settings.serial.batchQuantity" type="number" min="1" max="10000" :class="getInputClass()" />
                    </label>
                    <label class="space-y-2">
                      <span class="text-sm font-black text-slate-700">有效天數 expiresDays</span>
                      <input v-model.number="settings.serial.expiresDays" type="number" min="1" max="365" :class="getInputClass()" />
                    </label>
                    <label class="space-y-2">
                      <span class="text-sm font-black text-slate-700">匯出檔名 exportFileName</span>
                      <input v-model="settings.serial.exportFileName" :class="getInputClass()" />
                    </label>
                  </div>
                </section>

                <section class="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5">
                  <p class="text-sm font-black text-emerald-700">序號格式預覽</p>
                  <p class="mt-1 text-xs font-bold text-emerald-600">商家產生序號時，格式會類似下面這樣。</p>

                  <div class="mt-4 space-y-2">
                    <div
                      v-for="code in serialPreviewCodes"
                      :key="code"
                      class="rounded-2xl bg-white px-4 py-3 font-mono text-sm font-black text-emerald-800 shadow-sm"
                    >
                      {{ code }}
                    </div>
                  </div>

                  <div class="mt-4 rounded-2xl border border-emerald-200 bg-white/80 px-4 py-3 text-xs font-bold leading-6 text-emerald-700">
                    目前這裡是設定格式預覽；實際產生與匯出 CSV 請回「活動管理」執行。
                  </div>
                </section>
              </div>

              <div class="grid gap-4 xl:grid-cols-2">
                <section class="rounded-[28px] border border-slate-200 bg-white p-5">
                  <p class="text-sm font-black text-slate-700">使用限制</p>
                  <div class="mt-4 grid gap-4 md:grid-cols-2">
                    <label class="space-y-2">
                      <span class="text-sm font-black text-slate-700">每日限制 dailyLimit</span>
                      <input v-model.number="settings.serial.dailyLimit" type="number" min="1" :class="getInputClass()" />
                    </label>
                    <label class="space-y-2">
                      <span class="text-sm font-black text-slate-700">總限制 totalLimit</span>
                      <input v-model.number="settings.serial.totalLimit" type="number" min="1" :class="getInputClass()" />
                    </label>
                  </div>

                  <div class="mt-4 grid gap-2 sm:grid-cols-2">
                    <div class="rounded-2xl bg-slate-50 px-4 py-3">
                      <p class="text-xs font-black text-slate-400">每日可用</p>
                      <p class="mt-1 text-xl font-black text-slate-900">{{ settings.serial.dailyLimit }} 次</p>
                    </div>
                    <div class="rounded-2xl bg-slate-50 px-4 py-3">
                      <p class="text-xs font-black text-slate-400">活動總共</p>
                      <p class="mt-1 text-xl font-black text-slate-900">{{ settings.serial.totalLimit }} 次</p>
                    </div>
                  </div>
                </section>

                <section class="rounded-[28px] border border-amber-200 bg-amber-50 p-5">
                  <p class="text-sm font-black text-amber-700">商家操作 checklist</p>
                  <div class="mt-4 space-y-2">
                    <div
                      v-for="item in serialOperationChecklist"
                      :key="item.label"
                      class="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 text-sm font-black text-amber-800"
                    >
                      <span>{{ item.done ? '✅' : '○' }}</span>
                      <span>{{ item.label }}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    class="mt-4 w-full rounded-2xl bg-amber-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-amber-700"
                    @click="goCampaignsAndSerial"
                  >
                    回活動管理產生 / 匯出序號
                  </button>
                </section>
              </div>

              <section class="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                <p class="text-sm font-black text-slate-700">玩家提示文字</p>
                <div class="mt-4 grid gap-4 md:grid-cols-2">
                  <label class="space-y-2 md:col-span-2">
                    <span class="text-sm font-black text-slate-700">序號提示 serialHint</span>
                    <input v-model="settings.serial.serialHint" :class="getInputClass()" />
                  </label>
                  <label class="space-y-2">
                    <span class="text-sm font-black text-slate-700">空序號提示 emptySerialText</span>
                    <input v-model="settings.serial.emptySerialText" :class="getInputClass()" />
                  </label>
                  <label class="space-y-2">
                    <span class="text-sm font-black text-slate-700">已使用提示 usedSerialText</span>
                    <input v-model="settings.serial.usedSerialText" :class="getInputClass()" />
                  </label>
                  <label class="space-y-2">
                    <span class="text-sm font-black text-slate-700">過期提示 expiredSerialText</span>
                    <input v-model="settings.serial.expiredSerialText" :class="getInputClass()" />
                  </label>
                  <label class="space-y-2">
                    <span class="text-sm font-black text-slate-700">驗證成功提示 successSerialText</span>
                    <input v-model="settings.serial.successSerialText" :class="getInputClass()" />
                  </label>
                </div>
              </section>
            </div>

            <div v-else-if="activeSection === 'footer'" class="mt-6 grid gap-4 md:grid-cols-2">
              <label class="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-black text-slate-700"><input v-model="settings.footer.showRules" type="checkbox" class="h-5 w-5" />顯示規則</label>
              <label class="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-black text-slate-700"><input v-model="settings.footer.showRewards" type="checkbox" class="h-5 w-5" />顯示我的獎品</label>
              <label class="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-black text-slate-700"><input v-model="settings.footer.showHistory" type="checkbox" class="h-5 w-5" />顯示紀錄</label>
              <label class="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-black text-slate-700"><input v-model="settings.footer.showShare" type="checkbox" class="h-5 w-5" />顯示分享</label>
            </div>

            <div v-else-if="activeSection === 'display'" class="mt-6 grid gap-4 md:grid-cols-2">
              <label class="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-black text-slate-700"><input v-model="settings.display.showChanceText" type="checkbox" class="h-5 w-5" />顯示剩餘次數</label>
              <label class="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-black text-slate-700"><input v-model="settings.display.showPrizeWall" type="checkbox" class="h-5 w-5" />顯示獎品展示</label>
              <label class="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-black text-slate-700"><input v-model="settings.display.showDrawLogs" type="checkbox" class="h-5 w-5" />顯示最新中獎紀錄</label>
              <label class="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-black text-slate-700"><input v-model="settings.display.showParticipation" type="checkbox" class="h-5 w-5" />顯示活動參加方式</label>
              <label class="space-y-2 md:col-span-2"><span class="text-sm font-black text-slate-700">剩餘次數文字，使用 {'{count}'} 表示次數</span><input v-model="settings.display.chanceText" :class="getInputClass()" /></label>
              <label class="space-y-2 md:col-span-2"><span class="text-sm font-black text-slate-700">剩餘次數副文字</span><input v-model="settings.display.chanceSubText" :class="getInputClass()" /></label>
              <label class="space-y-2 md:col-span-2"><span class="text-sm font-black text-slate-700">活動參加方式文字</span><textarea v-model="settings.display.participationText" rows="3" :class="getInputClass()"></textarea></label>
            </div>

            <div v-else-if="activeSection === 'resultModal'" class="mt-6 grid gap-4 md:grid-cols-2">
              <div class="rounded-[28px] border border-violet-100 bg-violet-50/70 p-5 md:col-span-2">
                <p class="text-xs font-black uppercase tracking-[0.24em] text-violet-500">Result Modal Media｜第 78801～79200 批</p>
                <h3 class="mt-2 text-lg font-black text-slate-900">結果彈窗圖片與文字樣式</h3>
                <p class="mt-2 text-sm font-bold leading-6 text-slate-500">可貼網路圖片網址，也可選擇本機圖片轉成 Data URL；正式玩家手機要看得到，請按「儲存設定」同步到線上資料庫。</p>
              </div>

              <label class="space-y-2"><span class="text-sm font-black text-slate-700">中獎標題</span><input v-model="settings.resultModal.winTitle" :class="getInputClass()" /></label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">未中獎標題</span><input v-model="settings.resultModal.loseTitle" :class="getInputClass()" /></label>

              <div class="space-y-3 rounded-[24px] border border-slate-100 bg-white p-4">
                <label class="space-y-2"><span class="text-sm font-black text-slate-700">中獎圖片網址</span><input v-model="settings.resultModal.winImageUrl" :class="getInputClass()" placeholder="https://... 或選擇本機圖片" /></label>
                <div class="flex flex-wrap items-center gap-2">
                  <label class="cursor-pointer rounded-2xl bg-violet-600 px-4 py-2 text-xs font-black text-white shadow-sm">選擇本機中獎圖<input type="file" accept="image/*" class="hidden" @change="handleResultModalImageFile($event, 'winImageUrl')" /></label>
                  <button type="button" class="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600" @click="clearResultModalImage('winImageUrl')">清除</button>
                </div>
              </div>

              <div class="space-y-3 rounded-[24px] border border-slate-100 bg-white p-4">
                <label class="space-y-2"><span class="text-sm font-black text-slate-700">未中獎圖片網址</span><input v-model="settings.resultModal.loseImageUrl" :class="getInputClass()" placeholder="https://... 或選擇本機圖片" /></label>
                <div class="flex flex-wrap items-center gap-2">
                  <label class="cursor-pointer rounded-2xl bg-violet-600 px-4 py-2 text-xs font-black text-white shadow-sm">選擇本機未中獎圖<input type="file" accept="image/*" class="hidden" @change="handleResultModalImageFile($event, 'loseImageUrl')" /></label>
                  <button type="button" class="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600" @click="clearResultModalImage('loseImageUrl')">清除</button>
                </div>
              </div>

              <label class="space-y-2"><span class="text-sm font-black text-slate-700">圖片大小</span><input v-model.number="settings.resultModal.imageSize" type="range" min="56" max="180" step="2" class="w-full" /><p class="text-sm font-black text-slate-500">{{ settings.resultModal.imageSize }} px</p></label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">彈窗背景色</span><input v-model="settings.resultModal.modalBackgroundColor" type="color" class="h-12 w-20 rounded-2xl border border-slate-200 bg-white p-1" /></label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">上方漸層起始色</span><input v-model="settings.resultModal.headerFromColor" type="color" class="h-12 w-20 rounded-2xl border border-slate-200 bg-white p-1" /></label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">上方漸層結束色</span><input v-model="settings.resultModal.headerToColor" type="color" class="h-12 w-20 rounded-2xl border border-slate-200 bg-white p-1" /></label>

              <label class="space-y-2"><span class="text-sm font-black text-slate-700">標題文字大小</span><input v-model.number="settings.resultModal.titleTextSize" type="range" min="16" max="42" step="1" class="w-full" /><p class="text-sm font-black text-slate-500">{{ settings.resultModal.titleTextSize }} px</p></label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">標題文字顏色</span><input v-model="settings.resultModal.titleTextColor" type="color" class="h-12 w-20 rounded-2xl border border-slate-200 bg-white p-1" /></label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">獎項文字大小</span><input v-model.number="settings.resultModal.prizeTextSize" type="range" min="14" max="36" step="1" class="w-full" /><p class="text-sm font-black text-slate-500">{{ settings.resultModal.prizeTextSize }} px</p></label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">獎項文字顏色</span><input v-model="settings.resultModal.prizeTextColor" type="color" class="h-12 w-20 rounded-2xl border border-slate-200 bg-white p-1" /></label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">提示文字大小</span><input v-model.number="settings.resultModal.hintTextSize" type="range" min="12" max="24" step="1" class="w-full" /><p class="text-sm font-black text-slate-500">{{ settings.resultModal.hintTextSize }} px</p></label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">提示文字顏色</span><input v-model="settings.resultModal.hintTextColor" type="color" class="h-12 w-20 rounded-2xl border border-slate-200 bg-white p-1" /></label>

              <label class="space-y-2"><span class="text-sm font-black text-slate-700">確認按鈕</span><input v-model="settings.resultModal.confirmText" :class="getInputClass()" /></label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">繼續按鈕</span><input v-model="settings.resultModal.continueText" :class="getInputClass()" /></label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">按鈕顏色</span><input v-model="settings.resultModal.buttonColor" type="color" class="h-12 w-20 rounded-2xl border border-slate-200 bg-white p-1" /></label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">按鈕文字顏色</span><input v-model="settings.resultModal.buttonTextColor" type="color" class="h-12 w-20 rounded-2xl border border-slate-200 bg-white p-1" /></label>
              <label class="space-y-2 md:col-span-2"><span class="text-sm font-black text-slate-700">兌換提醒</span><input v-model="settings.resultModal.rewardHint" :class="getInputClass()" /></label>
            </div>

            <div v-else-if="activeSection === 'effects'" class="mt-6 grid gap-4 md:grid-cols-2">
              <label class="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-black text-slate-700"><input v-model="settings.effects.soundEnabled" type="checkbox" class="h-5 w-5" />音效</label>
              <label class="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-black text-slate-700"><input v-model="settings.effects.flashEnabled" type="checkbox" class="h-5 w-5" />閃光</label>
              <label class="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-black text-slate-700"><input v-model="settings.effects.confettiEnabled" type="checkbox" class="h-5 w-5" />彩帶</label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">動畫速度</span><input v-model.number="settings.effects.animationSpeed" type="range" min="0.5" max="2" step="0.1" class="w-full" /><p class="text-lg font-black text-slate-700">{{ settings.effects.animationSpeed }}x</p></label>
            </div>

            <div v-else-if="activeSection === 'rules'" class="mt-6 grid gap-4">
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">活動規則</span><textarea v-model="settings.rules.content" rows="4" :class="getInputClass()"></textarea></label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">兌換說明</span><textarea v-model="settings.rules.redemption" rows="3" :class="getInputClass()"></textarea></label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">隱私說明</span><textarea v-model="settings.rules.privacy" rows="3" :class="getInputClass()"></textarea></label>
            </div>

            <div v-else-if="activeSection === 'front'" class="mt-6 grid gap-4">
              <label class="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-black text-slate-700"><input v-model="settings.front.publicEnabled" type="checkbox" class="h-5 w-5" />公開玩家頁</label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">正式玩家網址</span><input v-model="settings.front.playerUrl" :class="getInputClass()" /></label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">commonGrid 測試網址</span><input v-model="settings.front.commonTestUrl" :class="getInputClass()" /></label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">legacyGrid 回退網址</span><input v-model="settings.front.legacyUrl" :class="getInputClass()" /></label>
            </div>

            <div v-else-if="activeSection === 'share'" class="mt-6 grid gap-4">
              <div class="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-800">
                LINE 預覽圖需要 Open Graph 支援；目前先作為分享資料欄位保存。
              </div>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">分享標題 shareTitle</span><input v-model="settings.share.shareTitle" :class="getInputClass()" /></label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">分享網址 shareUrl</span><input v-model="settings.share.shareUrl" :class="getInputClass()" /></label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">分享描述 shareDescription</span><textarea v-model="settings.share.shareDescription" rows="3" :class="getInputClass()"></textarea></label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">分享圖片 shareImageUrl</span><input v-model="settings.share.shareImageUrl" :class="getInputClass()" /></label>
              <label class="space-y-2"><span class="text-sm font-black text-slate-700">系統分享按鈕文字</span><input v-model="settings.share.systemShareButtonText" :class="getInputClass()" /></label>
            </div>
          </section>
        </div>

        <aside class="xl:sticky xl:top-6">
          <section class="rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm">
            <div class="mb-4 flex flex-col gap-3">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
                    Formal Player Preview
                  </p>
                  <h2 class="mt-1 text-lg font-black text-slate-950">
                    右側正式玩家頁預覽
                  </h2>
                </div>
                <span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                  iframe
                </span>
              </div>

              <div class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-6 text-amber-800">
                {{ isTemplateDraftMode
                  ? '目前是九宮格平台模板預覽：右側不是 A 商家正式活動，而是商家建立新九宮格活動時會看到的平台模板。按「儲存設定」會保存這份平台模板。'
                  : '這裡直接顯示真正玩家網址，不再用 PremiumGridPlayBoard.vue 模仿。左側修改會先同步到右側 iframe 預覽，不影響正式客人頁。' }}
              </div>

              <div class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <label class="flex items-center justify-between gap-3 text-sm font-black text-emerald-800">
                  <span>即時預覽同步</span>
                  <input
                    v-model="livePreviewEnabled"
                    type="checkbox"
                    class="h-5 w-5"
                  />
                </label>
                <p class="mt-2 text-xs font-bold leading-6 text-emerald-700">
                  {{ livePreviewEnabled ? '已啟用：左側修改會自動更新右側預覽。' : '已關閉：需儲存或手動重新載入預覽。' }}
                  <span v-if="livePreviewLastSyncedAt">最後同步：{{ livePreviewLastSyncedAt }}</span>
                </p>
              </div>

              <div class="grid gap-3 md:grid-cols-[1fr_auto]">
                <label class="space-y-2">
                  <span class="text-xs font-black text-slate-500">商家網址代碼 tenantSlug</span>
                  <input
                    v-model="previewTenantSlug"
                    class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    placeholder="a-shop"
                  />
                </label>

                <label class="space-y-2">
                  <span class="text-xs font-black text-slate-500">預覽模式</span>
                  <select
                    v-model="previewMode"
                    class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  >
                    <option value="formal">正式頁</option>
                    <option value="legacy">legacyGrid</option>
                    <option value="common">commonGrid</option>
                    <option value="original">originalGrid</option>
                  </select>
                </label>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  class="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-slate-800"
                  @click="refreshFormalPreview"
                >
                  重新載入預覽
                </button>
                <button
                  type="button"
                  class="rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                  @click="copyPlayerUrl"
                >
                  複製玩家連結
                </button>
                <a
                  :href="formalPlayerPreviewUrl"
                  target="_blank"
                  rel="noreferrer"
                  class="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  新分頁開啟
                </a>
              </div>

              <p class="rounded-2xl bg-slate-50 px-4 py-3 text-xs font-bold leading-6 text-slate-500">
                目前預覽網址：<span class="font-black text-slate-700">{{ formalPlayerPreviewUrl }}</span><br />
                {{ isTemplateDraftMode
                  ? '右側會讀取已儲存的九宮格平台平台模板；這是商家新建九宮格活動時要套用的畫面，不是既有商家活動。'
                  : '右側 iframe 會讀取後台即時草稿；修改文字、顏色、獎項後會用平滑同步更新，不再每次重載畫面。正式客人頁只讀已儲存設定。' }}
              </p>
            </div>

            <div class="mx-auto max-w-[560px] overflow-hidden rounded-[40px] border-[12px] border-slate-950 bg-slate-950 shadow-2xl">
              <iframe
                ref="formalPreviewIframeRef"
                :key="previewRefreshKey"
                :src="formalPlayerPreviewSrc"
                title="九宮格正式玩家頁預覽"
                class="h-[860px] w-full rounded-[28px] border-0 bg-white"
              ></iframe>
            </div>
          </section>
        </aside>
      </section>
    </div>
  </div>
</template>
