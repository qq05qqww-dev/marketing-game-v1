<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const PREMIUM_WHEEL_STORAGE_KEY = 'multi_game_platform_premium_wheel_v1'
const PREMIUM_WHEEL_SYNC_PING_KEY = 'premium-wheel-sync-ping'
const GAME_HISTORY_STORAGE_KEY = 'multi_game_platform_game_history_v1'
const ADMIN_SECTION_STATE_STORAGE_KEY = 'multi_game_platform_premium_wheel_admin_sections_v1'

const cloneByJson = (value) => JSON.parse(JSON.stringify(value))

const safeJsonParse = (value, fallback = null) => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch (error) {
    console.warn('JSON parse failed:', error)
    return fallback
  }
}

const urlGameId = computed(() => {
  return String(route.query.gameId || '').trim()
})

const isAdminMode = computed(() => {
  return String(route.query.mode || '').toLowerCase() === 'admin'
})

const currentGameId = computed(() => {
  return urlGameId.value || 'premium-wheel'
})

const sourcePath = computed(() => {
  const query = urlGameId.value ? `?gameId=${urlGameId.value}` : ''

  return `/games/wheel${query}`
})

const adminSourcePath = computed(() => {
  const query = urlGameId.value
    ? `?gameId=${urlGameId.value}&mode=admin`
    : '?mode=admin'

  return `/games/wheel${query}`
})

const campaign = reactive({
  brandName: 'Multi Game Platform',
  pageTitle: '精緻幸運轉盤',
  mainTitle: '幸運大轉盤',
  subTitle: '每日登入轉好禮',
  heroTagline: '轉出你的專屬驚喜',
  chanceText: '還有 3 次轉盤機會',
  buttonText: '分享活動',
  shareHint: '分享給好友可獲得額外轉盤次數',
  noticeText: '本活動為原創版型，可自由替換名稱、圖片與獎項內容。',
  logoText: 'W',
  logoImageUrl: '',
  bannerImageUrl: '',
  brandTagline: '打造專屬互動抽獎體驗',
  websiteUrl: '',
  websiteText: '官方網站',
  themeStart: '#f97316',
  themeMiddle: '#ef4444',
  themeEnd: '#7c2d12',
  enableWinConfetti: true,
  enableGoldRain: true,
  enableWinSound: true,
  winSoundUrl: '',
  winSoundVolume: 75,
  winEffectDuration: 6,
  confettiCount: 54,
  goldRainCount: 48,
  enableWinFlash: true,
  enablePrizeBounce: true,
  enableGoldenAura: true,
  enableSpinSound: false,
  spinSoundUrl: '',
  spinSoundVolume: 45,
  shareTitle: '',
  shareDescription: '',
  shareImageUrl: '',
  shareButtonText: '分享增加機會',
  enableShareReward: true,
  shareRewardDailyLimit: 1,
  shareRewardCooldownSeconds: 30,
  ruleTitle: '活動規則',
  ruleContent: '每日登入可獲得 1 次轉盤機會。\n分享活動可依設定增加轉盤機會。\n獎項數量有限，送完為止。',
  prizeInfoTitle: '獎品說明',
  prizeInfoContent: '中獎結果會顯示於畫面與最近轉盤紀錄。\n實際兌換方式以主辦單位公告為準。\n部分獎項可能有使用期限或資格限制。',
  wheelCenterText: 'SPIN',
  wheelCenterSize: 92,
  wheelCenterTextSize: 18,
  wheelCenterBgColor: '#111827',
  wheelCenterTextColor: '#ffffff',
  wheelCenterBorderColor: '#fde68a',
  wheelCenterBorderWidth: 4,
  wheelPointerScale: 100,
  wheelPointerTopColor: '#334155',
  wheelPointerArrowColor: '#020617',
  wheelPointerDotColor: '#fde047',
  wheelPointerPreset: 'classic-black-gold',
  enablePointerTipShake: true,
  pointerTipShakeSpeed: 70,
  enablePointerTickSound: true,
  pointerTickVolume: 35,
  pointerTickSpeed: 85,
  pointerTickTone: 'crisp',
  themeBgFrom: '#fb923c',
  themeBgTo: '#dc2626',
  themePanelColor: '#fff7ed',
  themeAccentColor: '#facc15',
  themeButtonColor: '#ea580c',
  themeButtonDarkColor: '#7c2d12',
  themeTextColor: '#fff7ed',
  themeGlowLevel: 70,
  enableLuxuryDots: true,
  enableGlassCards: true,
  frameTopColor: '#fed7aa',
  frameMiddleColor: '#fb923c',
  frameBottomColor: '#7c2d12',
  frameBorderColor: '#fdba74',
  frameHighlightColor: '#facc15',
  brandPreset: 'orange-gold'
})

const player = reactive({
  chances: 3,
  sharedCount: 0
})

const prizes = ref([
  {
    id: 'coupon-200',
    name: '折價券 200 元',
    shortName: '200',
    description: '下次消費可折抵 200 元',
    icon: '🎁',
    imageUrl: '',
    isEnabled: true,
    probability: 20,
    stock: 10,
    type: 'win',
    rank: 'first'
  },
  {
    id: 'coupon-100',
    name: '折價券 100 元',
    shortName: '100',
    description: '下次消費可折抵 100 元',
    icon: '🎟️',
    imageUrl: '',
    isEnabled: true,
    probability: 30,
    stock: 20,
    type: 'win',
    rank: 'second'
  },
  {
    id: 'coupon-50',
    name: '折價券 50 元',
    shortName: '50',
    description: '下次消費可折抵 50 元',
    icon: '🎫',
    imageUrl: '',
    isEnabled: true,
    probability: 35,
    stock: 30,
    type: 'win',
    rank: 'third'
  },
  {
    id: 'thanks',
    name: '銘謝惠顧',
    shortName: '謝謝',
    description: '這次沒有中獎，再接再厲',
    icon: '🙂',
    imageUrl: '',
    isEnabled: true,
    probability: 15,
    stock: 9999,
    type: 'lose',
    rank: 'none'
  }
])

const isSpinning = ref(false)
const wheelRotation = ref(0)
const activePrizeIndex = ref(-1)
const resultPrize = ref(null)
const showResultModal = ref(false)
const isResultActionProcessing = ref(false)
const showWinEffects = ref(false)
const winAudio = ref(null)
const spinAudio = ref(null)
const effectImportInput = ref(null)
const showShareMessage = ref(false)
const shareMessage = ref('')
const showSharePreviewModal = ref(false)
const isRecentLogsExpanded = ref(false)
const restorePointState = ref(null)
const isShareActionProcessing = ref(false)
const shareRewardState = ref({
  date: '',
  count: 0,
  lastRewardAt: 0
})
const isShareRewardStatusLoading = ref(false)
const shareRewardStatusMessage = ref('')
const shareRewardApiDiagnostic = ref({
  status: '尚未測試',
  message: '尚未執行分享獎勵 API 測試。',
  apiBaseUrl: '',
  hasToken: false,
  tokenKey: '未偵測到',
  testedAt: ''
})
const savedMessage = ref('')
const lastSyncMessage = ref('')
const lastSyncAt = ref('')
const isApplyingPremiumWheelRemoteState = ref(false)
const isSavingPremiumWheelState = ref(false)
const drawLogs = ref([])

let premiumWheelSaveTimer = null

const schedulePremiumWheelStateSave = () => {
  if (isApplyingPremiumWheelRemoteState.value) return
  if (typeof window === 'undefined') return

  if (premiumWheelSaveTimer) {
    window.clearTimeout(premiumWheelSaveTimer)
  }

  premiumWheelSaveTimer = window.setTimeout(() => {
    premiumWheelSaveTimer = null
    savePremiumWheelState()
  }, 260)
}


const defaultCampaignSnapshot = cloneByJson(campaign)
const defaultPlayerSnapshot = cloneByJson(player)
const defaultPrizesSnapshot = cloneByJson(prizes.value)




const defaultAdminOpenSections = {
  basic: true,
  frame: false,
  theme: false,
  pointer: false,
  center: false,
  share: false,
  effects: false,
  prizes: false
}

const loadAdminOpenSections = () => {
  if (typeof localStorage === 'undefined') {
    return cloneByJson(defaultAdminOpenSections)
  }

  const saved = safeJsonParse(localStorage.getItem(ADMIN_SECTION_STATE_STORAGE_KEY), null)

  return {
    ...cloneByJson(defaultAdminOpenSections),
    ...(saved || {})
  }
}

const adminOpenSections = ref(loadAdminOpenSections())

const saveAdminOpenSections = () => {
  if (typeof localStorage === 'undefined') return

  localStorage.setItem(
    ADMIN_SECTION_STATE_STORAGE_KEY,
    JSON.stringify(adminOpenSections.value)
  )
}

const toggleAdminSection = (sectionKey) => {
  adminOpenSections.value[sectionKey] = !adminOpenSections.value[sectionKey]
  saveAdminOpenSections()
}

const isAdminSectionOpen = (sectionKey) => {
  return adminOpenSections.value[sectionKey] !== false
}

const openAdminSection = (sectionKey) => {
  adminOpenSections.value[sectionKey] = true
  saveAdminOpenSections()
}

const openAllAdminSections = () => {
  Object.keys(defaultAdminOpenSections).forEach((key) => {
    adminOpenSections.value[key] = true
  })

  saveAdminOpenSections()
  showSavedMessage('已展開全部後台功能區。')
}

const closeAllAdminSections = () => {
  Object.keys(defaultAdminOpenSections).forEach((key) => {
    adminOpenSections.value[key] = false
  })

  saveAdminOpenSections()
  showSavedMessage('已收合全部後台功能區。')
}

const keepOnlyBasicAdminSection = () => {
  Object.keys(defaultAdminOpenSections).forEach((key) => {
    adminOpenSections.value[key] = key === 'basic'
  })

  saveAdminOpenSections()
  showSavedMessage('已只保留基本畫面設定展開。')
}


const adminQuickSections = [
  {
    key: 'basic',
    label: '基本畫面',
    icon: '①'
  },
  {
    key: 'frame',
    label: '底框顏色',
    icon: '色'
  },
  {
    key: 'theme',
    label: '整體主題',
    icon: '彩'
  },
  {
    key: 'pointer',
    label: '轉盤指針',
    icon: '針'
  },
  {
    key: 'center',
    label: '中心按鈕',
    icon: '中'
  },
  {
    key: 'share',
    label: '分享活動',
    icon: '享'
  },
  {
    key: 'effects',
    label: '音效特效',
    icon: '效'
  },
  {
    key: 'prizes',
    label: '獎項機率',
    icon: '獎'
  }
]

const scrollToAdminSection = (sectionKey) => {
  if (typeof document === 'undefined') return

  openAdminSection(sectionKey)

  window.setTimeout(() => {
    const target = document.querySelector(`[data-admin-section="${sectionKey}"]`)

    if (!target) {
      showSavedMessage(`目前找不到「${sectionKey}」區塊。`)
      return
    }

    target.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }, 80)
}


const restoreCampaignFields = (fieldNames = [], label = '此區塊') => {
  if (!Array.isArray(fieldNames) || !fieldNames.length) return

  const confirmed = window.confirm(`確定要還原「${label}」設定嗎？`)

  if (!confirmed) return

  fieldNames.forEach((fieldName) => {
    if (Object.prototype.hasOwnProperty.call(defaultCampaignSnapshot, fieldName)) {
      campaign[fieldName] = cloneByJson(defaultCampaignSnapshot[fieldName])
    }
  })

  updateChanceText()
  savePremiumWheelState()
  showSavedMessage(`已還原「${label}」設定。`)
}

const restoreBasicSettings = () => {
  restoreCampaignFields([
    'brandName',
    'pageTitle',
    'mainTitle',
    'subTitle',
    'heroTagline',
    'chanceText',
    'buttonText',
    'shareHint',
    'noticeText',
    'logoText',
    'logoImageUrl',
    'bannerImageUrl',
    'brandTagline',
    'websiteUrl',
    'websiteText'
  ], '基本畫面')
}

const restoreFrameThemeSettings = () => {
  restoreCampaignFields([
    'frameTopColor',
    'frameMiddleColor',
    'frameBottomColor',
    'frameBorderColor',
    'frameHighlightColor',
    'brandPreset'
  ], '底框顏色')
}

const restoreGameThemeSettings = () => {
  restoreCampaignFields([
    'themeBgFrom',
    'themeBgTo',
    'themePanelColor',
    'themeAccentColor',
    'themeButtonColor',
    'themeButtonDarkColor',
    'themeTextColor',
    'themeGlowLevel',
    'enableLuxuryDots',
    'enableGlassCards'
  ], '整體主題')
}

const restorePointerSettings = () => {
  restoreCampaignFields([
    'wheelPointerScale',
    'wheelPointerTopColor',
    'wheelPointerArrowColor',
    'wheelPointerDotColor',
    'wheelPointerPreset',
    'enablePointerTipShake',
    'pointerTipShakeSpeed',
    'enablePointerTickSound',
    'pointerTickVolume',
    'pointerTickSpeed',
    'pointerTickTone'
  ], '轉盤指針')
}

const restoreWheelCenterSettings = () => {
  restoreCampaignFields([
    'wheelCenterText',
    'wheelCenterSize',
    'wheelCenterTextSize',
    'wheelCenterBgColor',
    'wheelCenterTextColor',
    'wheelCenterBorderColor',
    'wheelCenterBorderWidth'
  ], '轉盤中心按鈕')
}

const restoreRulePrizeInfoSettings = () => {
  restoreCampaignFields([
    'ruleTitle',
    'ruleContent',
    'prizeInfoTitle',
    'prizeInfoContent'
  ], '活動規則與獎品說明')
}

const restoreShareSettings = () => {
  restoreCampaignFields([
    'shareTitle',
    'shareDescription',
    'shareImageUrl',
    'shareButtonText',
    'websiteUrl'
  ], '分享活動')
}

const restoreShareRewardSettings = () => {
  restoreCampaignFields([
    'enableShareReward',
    'shareRewardDailyLimit',
    'shareRewardCooldownSeconds'
  ], '分享防作弊')
}

const restoreEffectSettings = () => {
  restoreCampaignFields([
    'enableWinConfetti',
    'enableGoldRain',
    'enableWinSound',
    'winSoundUrl',
    'winSoundVolume',
    'winEffectDuration',
    'confettiCount',
    'goldRainCount',
    'enableWinFlash',
    'enablePrizeBounce',
    'enableGoldenAura',
    'enableSpinSound',
    'spinSoundUrl',
    'spinSoundVolume'
  ], '音效特效')
}

const restorePrizeSettings = () => {
  const confirmed = window.confirm('確定要還原「獎項設定」嗎？目前獎項會回到預設值。')

  if (!confirmed) return

  prizes.value = cloneByJson(defaultPrizesSnapshot)
  savePremiumWheelState()
  showSavedMessage('已還原「獎項設定」。')
}


const prizeTypeOptions = [
  {
    label: '中獎',
    value: 'win'
  },
  {
    label: '未中獎',
    value: 'lose'
  }
]

const prizeRankOptions = [
  {
    label: '頭獎',
    value: 'first'
  },
  {
    label: '二獎',
    value: 'second'
  },
  {
    label: '三獎',
    value: 'third'
  },
  {
    label: '一般獎',
    value: 'normal'
  },
  {
    label: '未中獎',
    value: 'none'
  }
]

const adminSectionTips = {
  basic: '調整客人前台會看到的品牌、LOGO、標題、Banner、官方網站、底框主題色、整體主題色、轉盤指針、轉盤中心按鈕、活動規則、獎品說明與分享活動內容。',
  effects: '設定中獎後的彩帶、金沙、音樂與高級特效，也可以直接測試。',
  prizes: '管理轉盤獎項圖片、排序、啟用狀態、機率、庫存、中獎 / 未中獎類型，以及頭獎、二獎、三獎等級。',
  reports: '查看最近抽獎紀錄、統計數據，並可匯出或清除紀錄。'
}



const wheelPointerPresets = [
  {
    key: 'classic-black-gold',
    name: '經典黑金',
    description: '黑色箭頭搭配金色圓點，最百搭。',
    colors: ['#334155', '#020617', '#fde047'],
    payload: {
      wheelPointerScale: 100,
      wheelPointerTopColor: '#334155',
      wheelPointerArrowColor: '#020617',
      wheelPointerDotColor: '#fde047',
      wheelPointerPreset: 'classic-black-gold'
    }
  },
  {
    key: 'royal-gold',
    name: '皇家金色',
    description: '金色高級感，適合豪華抽獎活動。',
    colors: ['#f59e0b', '#92400e', '#fff7ad'],
    payload: {
      wheelPointerScale: 108,
      wheelPointerTopColor: '#f59e0b',
      wheelPointerArrowColor: '#92400e',
      wheelPointerDotColor: '#fff7ad',
      wheelPointerPreset: 'royal-gold'
    }
  },
  {
    key: 'ice-blue',
    name: '冰藍科技',
    description: '清爽科技藍，適合飲品與生活風格。',
    colors: ['#38bdf8', '#075985', '#e0f2fe'],
    payload: {
      wheelPointerScale: 104,
      wheelPointerTopColor: '#38bdf8',
      wheelPointerArrowColor: '#075985',
      wheelPointerDotColor: '#e0f2fe',
      wheelPointerPreset: 'ice-blue'
    }
  },
  {
    key: 'rose-purple',
    name: '玫瑰紫粉',
    description: '甜美亮眼，適合女性向與節慶活動。',
    colors: ['#f472b6', '#7e22ce', '#fce7f3'],
    payload: {
      wheelPointerScale: 104,
      wheelPointerTopColor: '#f472b6',
      wheelPointerArrowColor: '#7e22ce',
      wheelPointerDotColor: '#fce7f3',
      wheelPointerPreset: 'rose-purple'
    }
  },
  {
    key: 'premium-black',
    name: '深黑高級',
    description: '低調質感，適合 VIP 與精品感活動。',
    colors: ['#111827', '#000000', '#fbbf24'],
    payload: {
      wheelPointerScale: 112,
      wheelPointerTopColor: '#111827',
      wheelPointerArrowColor: '#000000',
      wheelPointerDotColor: '#fbbf24',
      wheelPointerPreset: 'premium-black'
    }
  }
]

const applyWheelPointerPreset = (preset) => {
  if (!preset?.payload) return

  createRestorePoint('套用指針預設前')
  Object.assign(campaign, preset.payload)
  savePremiumWheelState()
  showSavedMessage(`已套用「${preset.name}」指針。`)
}


const brandFramePresets = [
  {
    key: 'classic-orange-board',
    name: '經典橘色版',
    shortName: '經典橘',
    description: '目前畫面同款橘色主底板，適合大部分抽獎活動。',
    icon: '🧡',
    recommended: true,
    colors: ['#ff8a2a', '#ff6500', '#8b2f10'],
    payload: {
      themeBgFrom: '#ff8a2a',
      themeBgTo: '#c2410c',
      themePanelColor: '#fff7ed',
      themeAccentColor: '#facc15',
      themeButtonColor: '#e85d1f',
      themeButtonDarkColor: '#7c2d12',
      themeTextColor: '#fff7ed',
      frameTopColor: '#ff8a2a',
      frameMiddleColor: '#ff6500',
      frameBottomColor: '#8b2f10',
      frameBorderColor: '#ffb45f',
      frameHighlightColor: '#ffd166'
    }
  },
  {
    key: 'orange-gold',
    name: '橘金活動色',
    shortName: '橘金',
    description: '適合抽獎、優惠券、會員促銷活動。',
    icon: '🧡',
    recommended: false,
    colors: ['#fed7aa', '#fb923c', '#7c2d12'],
    payload: {
      themeBgFrom: '#fb923c',
      themeBgTo: '#dc2626',
      themePanelColor: '#fff7ed',
      themeAccentColor: '#facc15',
      themeButtonColor: '#ea580c',
      themeButtonDarkColor: '#7c2d12',
      themeTextColor: '#fff7ed',
      frameTopColor: '#fed7aa',
      frameMiddleColor: '#fb923c',
      frameBottomColor: '#7c2d12',
      frameBorderColor: '#fdba74',
      frameHighlightColor: '#facc15'
    }
  },
  {
    key: 'luxury-dark',
    name: 'VIP 深色質感',
    shortName: 'VIP',
    description: '適合高級會員、精品感活動。',
    icon: '🖤',
    recommended: true,
    colors: ['#f8fafc', '#111827', '#020617'],
    payload: {
      themeBgFrom: '#111827',
      themeBgTo: '#020617',
      themePanelColor: '#f8fafc',
      themeAccentColor: '#facc15',
      themeButtonColor: '#374151',
      themeButtonDarkColor: '#020617',
      themeTextColor: '#f8fafc',
      frameTopColor: '#f8fafc',
      frameMiddleColor: '#111827',
      frameBottomColor: '#020617',
      frameBorderColor: '#facc15',
      frameHighlightColor: '#fbbf24'
    }
  },
  {
    key: 'fresh-bluegreen',
    name: '藍綠清新色',
    shortName: '藍綠',
    description: '適合飲品、美容、生活風格活動。',
    icon: '💙',
    recommended: false,
    colors: ['#67e8f9', '#14b8a6', '#0f766e'],
    payload: {
      themeBgFrom: '#67e8f9',
      themeBgTo: '#0f766e',
      themePanelColor: '#ecfeff',
      themeAccentColor: '#22d3ee',
      themeButtonColor: '#14b8a6',
      themeButtonDarkColor: '#0f766e',
      themeTextColor: '#ecfeff',
      frameTopColor: '#67e8f9',
      frameMiddleColor: '#14b8a6',
      frameBottomColor: '#0f766e',
      frameBorderColor: '#99f6e4',
      frameHighlightColor: '#22d3ee'
    }
  },
  {
    key: 'sweet-purple',
    name: '紫粉甜美色',
    shortName: '紫粉',
    description: '適合可愛、女性向、節慶活動。',
    icon: '💜',
    recommended: true,
    colors: ['#f0abfc', '#a855f7', '#6d28d9'],
    payload: {
      themeBgFrom: '#f0abfc',
      themeBgTo: '#7e22ce',
      themePanelColor: '#fdf4ff',
      themeAccentColor: '#f472b6',
      themeButtonColor: '#a855f7',
      themeButtonDarkColor: '#6d28d9',
      themeTextColor: '#fff7ed',
      frameTopColor: '#f0abfc',
      frameMiddleColor: '#a855f7',
      frameBottomColor: '#6d28d9',
      frameBorderColor: '#f9a8d4',
      frameHighlightColor: '#f472b6'
    }
  }
]

const applyBrandFramePreset = (preset) => {
  if (!preset?.payload) return

  createRestorePoint('套用品牌預設前')
  Object.assign(campaign, preset.payload)
  campaign.brandPreset = preset.key
  savePremiumWheelState()
  showSavedMessage(`已套用「${preset.name}」。`)
}

const frameThemeStyle = computed(() => {
  return {
    '--frame-top-color': campaign.frameTopColor || '#fed7aa',
    '--frame-middle-color': campaign.frameMiddleColor || '#fb923c',
    '--frame-bottom-color': campaign.frameBottomColor || '#7c2d12',
    '--frame-border-color': campaign.frameBorderColor || '#fdba74',
    '--frame-highlight-color': campaign.frameHighlightColor || '#facc15'
  }
})

const gameBoardFrameStyle = computed(() => {
  return {
    background: `
      radial-gradient(circle at 20% 8%, rgba(255, 255, 255, 0.22), transparent 24%),
      radial-gradient(circle at 82% 18%, color-mix(in srgb, ${campaign.frameHighlightColor || '#facc15'} 38%, transparent), transparent 28%),
      linear-gradient(180deg, ${campaign.frameTopColor || '#fed7aa'} 0%, ${campaign.frameMiddleColor || '#fb923c'} 48%, ${campaign.frameBottomColor || '#7c2d12'} 100%)
    `,
    borderColor: campaign.frameBorderColor || '#fdba74',
    boxShadow: `
      inset 0 1px 0 rgba(255, 255, 255, 0.26),
      inset 0 0 0 1px color-mix(in srgb, ${campaign.frameBorderColor || '#fdba74'} 42%, transparent),
      0 28px 70px color-mix(in srgb, ${campaign.frameBottomColor || '#7c2d12'} 35%, transparent)
    `
  }
})

const playerRuleItems = [
  '每次轉盤會消耗 1 次轉盤機會。',
  '分享活動可增加 1 次轉盤機會。',
  '轉盤完成後，結果會自動寫入我的遊戲紀錄。',
  '獎項數量有限，抽完為止。',
  '實際兌獎方式以主辦單位公告為準。'
]

const prizeNoteItems = [
  '獎品名稱、機率與庫存可由管理版調整。',
  '庫存為 0 的獎項不會再被抽中。',
  '銘謝惠顧可作為未中獎結果使用。',
  '玩家可在我的遊戲紀錄查看已抽出的結果。'
]

const showPlayerRules = ref(false)
const showPrizeNotes = ref(false)
const marqueeBulbs = Array.from({ length: 32 }, (_, index) => index)

const confettiColors = [
  '#f97316',
  '#ef4444',
  '#facc15',
  '#22c55e',
  '#38bdf8',
  '#a855f7',
  '#ec4899'
]

const normalizedEffectDuration = computed(() => {
  return Math.min(10, Math.max(2, Number(campaign.winEffectDuration || 6)))
})

const normalizedConfettiCount = computed(() => {
  return Math.min(120, Math.max(0, Number(campaign.confettiCount || 0)))
})

const normalizedGoldRainCount = computed(() => {
  return Math.min(120, Math.max(0, Number(campaign.goldRainCount || 0)))
})

const normalizedWinSoundVolume = computed(() => {
  return Math.min(100, Math.max(0, Number(campaign.winSoundVolume || 0)))
})

const normalizedSpinSoundVolume = computed(() => {
  return Math.min(100, Math.max(0, Number(campaign.spinSoundVolume || 0)))
})

const wheelCenterButtonStyle = computed(() => {
  const size = Math.min(130, Math.max(58, Number(campaign.wheelCenterSize || 92)))
  const fontSize = Math.min(34, Math.max(10, Number(campaign.wheelCenterTextSize || 18)))
  const borderWidth = Math.min(12, Math.max(0, Number(campaign.wheelCenterBorderWidth || 4)))

  return {
    width: `${size}px`,
    height: `${size}px`,
    fontSize: `${fontSize}px`,
    background: campaign.wheelCenterBgColor || '#111827',
    color: campaign.wheelCenterTextColor || '#ffffff',
    borderColor: campaign.wheelCenterBorderColor || '#fde68a',
    borderWidth: `${borderWidth}px`
  }
})

const normalizedWheelPointerScale = computed(() => {
  return Math.min(160, Math.max(60, Number(campaign.wheelPointerScale || 100)))
})

const normalizedPointerTipShakeSpeed = computed(() => {
  return Math.min(140, Math.max(30, Number(campaign.pointerTipShakeSpeed || 70)))
})

const normalizedPointerTickVolume = computed(() => {
  return Math.min(100, Math.max(0, Number(campaign.pointerTickVolume || 35)))
})

const normalizedPointerTickSpeed = computed(() => {
  return Math.min(180, Math.max(40, Number(campaign.pointerTickSpeed || 85)))
})

const wheelPointerStyle = computed(() => {
  return {
    '--wheel-pointer-scale': normalizedWheelPointerScale.value / 100,
    '--wheel-pointer-top-color': campaign.wheelPointerTopColor || '#334155',
    '--wheel-pointer-arrow-color': campaign.wheelPointerArrowColor || '#020617',
    '--wheel-pointer-dot-color': campaign.wheelPointerDotColor || '#fde047',
    '--wheel-pointer-tip-shake-speed': `${normalizedPointerTipShakeSpeed.value}ms`
  }
})

const normalizedThemeGlowLevel = computed(() => {
  return Math.min(100, Math.max(0, Number(campaign.themeGlowLevel || 0)))
})

const gameThemeStyle = computed(() => {
  const glowAlpha = normalizedThemeGlowLevel.value / 100

  return {
    '--premium-bg-from': campaign.themeBgFrom || '#fb923c',
    '--premium-bg-to': campaign.themeBgTo || '#dc2626',
    '--premium-panel-color': campaign.themePanelColor || '#fff7ed',
    '--premium-accent-color': campaign.themeAccentColor || '#facc15',
    '--premium-button-color': campaign.themeButtonColor || '#ea580c',
    '--premium-button-dark-color': campaign.themeButtonDarkColor || '#7c2d12',
    '--premium-text-color': campaign.themeTextColor || '#fff7ed',
    '--premium-glow-alpha': glowAlpha,
    '--frame-top-color': campaign.frameTopColor || '#fed7aa',
    '--frame-middle-color': campaign.frameMiddleColor || '#fb923c',
    '--frame-bottom-color': campaign.frameBottomColor || '#7c2d12',
    '--frame-border-color': campaign.frameBorderColor || '#fdba74',
    '--frame-highlight-color': campaign.frameHighlightColor || '#facc15'
  }
})

const mergedPageThemeStyle = computed(() => {
  const originalStyle = {
    ...(pageBackgroundStyle?.value || {})
  }

  delete originalStyle.background
  delete originalStyle.backgroundColor
  delete originalStyle.backgroundImage

  return {
    ...originalStyle,
    ...(gameThemeStyle?.value || {}),
    ...(frameThemeStyle?.value || {}),
    background: `
      radial-gradient(circle at 18% 10%, rgba(255, 255, 255, 0.22), transparent 24%),
      radial-gradient(circle at 82% 18%, color-mix(in srgb, ${campaign.themeAccentColor || '#facc15'} 42%, transparent), transparent 28%),
      linear-gradient(135deg, ${campaign.themeBgFrom || '#fb923c'}, ${campaign.themeBgTo || '#dc2626'})
    `
  }
})

const confettiPieces = computed(() => {
  return Array.from({ length: normalizedConfettiCount.value }, (_, index) => {
    return {
      id: `confetti-${index}`,
      style: {
        left: `${(index * 17 + 7) % 100}%`,
        backgroundColor: confettiColors[index % confettiColors.length],
        animationDelay: `${(index % 14) * 0.07}s`,
        animationDuration: `${Math.max(2, normalizedEffectDuration.value - 1.2) + (index % 6) * 0.08}s`,
        width: `${8 + (index % 4)}px`,
        height: `${14 + (index % 5)}px`,
        transform: `rotate(${index * 19}deg)`
      }
    }
  })
})

const goldRainPieces = computed(() => {
  return Array.from({ length: normalizedGoldRainCount.value }, (_, index) => {
    return {
      id: `gold-${index}`,
      style: {
        left: `${(index * 23 + 11) % 100}%`,
        animationDelay: `${(index % 12) * 0.08}s`,
        animationDuration: `${Math.max(2.4, normalizedEffectDuration.value - 0.6) + (index % 5) * 0.08}s`,
        width: `${5 + (index % 4)}px`,
        height: `${5 + (index % 4)}px`
      }
    }
  })
})

const premiumVersionInfo = computed(() => {
  return {
    version: 'Premium Wheel V1 Stable',
    platformVersion: 'Multi Game Platform V2.2 Stable',
    batch: '第 258 批',
    playerMode: 'VIP 精緻版',
    adminMode: '管理預覽版',
    status: '基礎骨架 / 可測試 / 可延伸'
  }
})

const safeWebsiteUrl = computed(() => {
  const value = String(campaign.websiteUrl || '').trim()

  if (!value) return ''

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }

  return `https://${value}`
})

const websiteButtonText = computed(() => {
  return String(campaign.websiteText || '').trim() || '官方網站'
})

const pageBackgroundStyle = computed(() => {
  return {
    background: `linear-gradient(180deg, ${campaign.themeStart} 0%, ${campaign.themeMiddle} 48%, ${campaign.themeEnd} 100%)`
  }
})

const bannerBackgroundStyle = computed(() => {
  if (!campaign.bannerImageUrl) {
    return {
      background: 'linear-gradient(135deg, rgba(255,255,255,0.24), rgba(255,255,255,0.1))'
    }
  }

  return {
    background: `linear-gradient(135deg, rgba(15,23,42,0.58), rgba(249,115,22,0.48)), url(${campaign.bannerImageUrl}) center/cover`
  }
})

const activePrizes = computed(() => {
  return prizes.value.filter((prize) => prize.isEnabled !== false)
})

const availablePrizePool = computed(() => {
  return activePrizes.value.filter((prize) => Number(prize.stock) > 0 && Number(prize.probability) > 0)
})

const probabilitySummary = computed(() => {
  const totalProbability = prizes.value.reduce((sum, prize) => {
    return sum + Number(prize.probability || 0)
  }, 0)

  const winCount = prizes.value.filter((prize) => prize.type !== 'lose').length
  const loseCount = prizes.value.filter((prize) => prize.type === 'lose').length
  const enabledCount = activePrizes.value.length
  const availableCount = availablePrizePool.value.length

  return {
    totalProbability,
    winCount,
    loseCount,
    enabledCount,
    availableCount,
    isPerfectPercent: totalProbability === 100
  }
})

const probabilityStatusText = computed(() => {
  if (probabilitySummary.value.isPerfectPercent) {
    return '機率總和剛好 100，可作為百分比參考。'
  }

  return '目前採權重抽選，總和不必一定等於 100。'
})

const probabilityStatusClass = computed(() => {
  return probabilitySummary.value.isPerfectPercent
    ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
    : 'border-amber-100 bg-amber-50 text-amber-700'
})

const recentLogCount = computed(() => {
  return drawLogs.value.length
})

const recentLogsToggleText = computed(() => {
  return isRecentLogsExpanded.value ? '收合紀錄' : '展開紀錄'
})

const toggleRecentLogs = () => {
  isRecentLogsExpanded.value = !isRecentLogsExpanded.value
}

const drawLogStats = computed(() => {
  const total = drawLogs.value.length
  const winCount = drawLogs.value.filter((log) => log.prizeType !== 'lose').length
  const loseCount = drawLogs.value.filter((log) => log.prizeType === 'lose').length
  const winRate = total > 0 ? Math.round((winCount / total) * 100) : 0
  const latestLog = drawLogs.value[0] || null

  return {
    total,
    winCount,
    loseCount,
    winRate,
    latestAt: latestLog?.createdAt || '尚無紀錄'
  }
})

const averagePrizeProbability = () => {
  if (!prizes.value.length) {
    showSavedMessage('目前沒有獎項可平均分配。')
    return
  }

  const baseValue = Math.floor(100 / prizes.value.length)
  const remainder = 100 - baseValue * prizes.value.length

  prizes.value = prizes.value.map((prize, index) => {
    return {
      ...prize,
      probability: baseValue + (index < remainder ? 1 : 0)
    }
  })

  savePremiumWheelState()
  showSavedMessage('已平均分配轉盤機率，總和為 100。')
}

const clearAllPrizeProbability = () => {
  const confirmed = window.confirm('確定要把所有獎項機率清零嗎？清零後玩家將暫時無法轉出獎項。')

  if (!confirmed) return

  prizes.value = prizes.value.map((prize) => {
    return {
      ...prize,
      probability: 0
    }
  })

  savePremiumWheelState()
  showSavedMessage('已將所有轉盤機率清零。')
}

const restoreDefaultPrizes = () => {
  const confirmed = window.confirm('確定要還原預設轉盤獎項嗎？目前獎項設定會被覆蓋。')

  if (!confirmed) return

  prizes.value = cloneByJson(defaultPrizesSnapshot)
  savePremiumWheelState()
  showSavedMessage('已還原精緻轉盤預設獎項。')
}

const addPrizeItem = () => {
  const nextNumber = prizes.value.length + 1

  prizes.value = [
    ...prizes.value,
    {
      id: `custom-prize-${Date.now()}`,
      name: `自訂獎項 ${nextNumber}`,
      shortName: `獎項${nextNumber}`,
      description: '請在後台修改獎項說明',
      icon: '🎁',
      imageUrl: '',
    isEnabled: true,
      probability: 10,
      stock: 10,
      type: 'win',
      rank: 'normal'
    }
  ]

  savePremiumWheelState()
  showSavedMessage('已新增一個轉盤獎項。')
}

const removePrizeItem = (prize) => {
  if (prizes.value.length <= 1) {
    window.alert('至少需要保留 1 個獎項。')
    return
  }

  const confirmed = window.confirm(`確定要刪除「${prize.name}」嗎？`)

  if (!confirmed) return

  prizes.value = prizes.value.filter((item) => item.id !== prize.id)

  if (resultPrize.value?.id === prize.id) {
    resultPrize.value = null
    activePrizeIndex.value = -1
  }

  savePremiumWheelState()
  showSavedMessage('已刪除轉盤獎項。')
}

const duplicatePrizeItem = (prize) => {
  const copiedPrize = {
    ...cloneByJson(prize),
    id: `copy-prize-${Date.now()}`,
    name: `${prize.name || '獎項'} 複製`,
    shortName: prize.shortName || '複製',
    isEnabled: true
  }

  prizes.value = [
    ...prizes.value,
    copiedPrize
  ]

  savePremiumWheelState()
  showSavedMessage('已複製一個轉盤獎項。')
}

const togglePrizeEnabled = (prize) => {
  prize.isEnabled = prize.isEnabled === false

  if (resultPrize.value?.id === prize.id && prize.isEnabled === false) {
    resultPrize.value = null
    activePrizeIndex.value = -1
  }

  savePremiumWheelState()
  showSavedMessage(prize.isEnabled ? '已啟用獎項。' : '已停用獎項。')
}

const movePrizeItem = (index, direction) => {
  const targetIndex = index + direction

  if (targetIndex < 0 || targetIndex >= prizes.value.length) return

  const nextPrizes = [...prizes.value]
  const currentPrize = nextPrizes[index]

  nextPrizes[index] = nextPrizes[targetIndex]
  nextPrizes[targetIndex] = currentPrize
  prizes.value = nextPrizes

  if (activePrizeIndex.value === index) {
    activePrizeIndex.value = targetIndex
  } else if (activePrizeIndex.value === targetIndex) {
    activePrizeIndex.value = index
  }

  savePremiumWheelState()
  showSavedMessage('已更新轉盤獎項排序。')
}

const canSpin = computed(() => {
  return player.chances > 0 && availablePrizePool.value.length > 0 && !isSpinning.value
})

const wheelButtonText = computed(() => {
  if (isSpinning.value) return '轉盤中'

  if (player.chances <= 0) return '次數用完'

  if (!availablePrizePool.value.length) return '獎品已抽完'

  return '開始轉盤'
})

const wheelResultLabel = computed(() => {
  if (!resultPrize.value) return ''

  return resultPrize.value.type === 'lose' ? '再接再厲' : '恭喜中獎'
})

const wheelResultClass = computed(() => {
  if (!resultPrize.value) return 'bg-slate-100 text-slate-500'

  return resultPrize.value.type === 'lose'
    ? 'bg-slate-100 text-slate-600'
    : 'bg-orange-100 text-orange-700'
})

const resultActionText = computed(() => {
  if (isResultActionProcessing.value) return '處理中...'

  if (player.chances > 0) return '繼續轉盤'

  return '分享增加機會'
})

const resultHintText = computed(() => {
  if (!resultPrize.value) return '結果已寫入我的遊戲紀錄。'

  if (player.chances > 0) {
    return `結果已寫入我的遊戲紀錄，目前還有 ${player.chances} 次轉盤機會。`
  }

  return '結果已寫入我的遊戲紀錄，目前轉盤機會已用完，可分享活動增加 1 次。'
})

const handleResultPrimaryAction = async () => {
  if (isResultActionProcessing.value) return

  isResultActionProcessing.value = true

  try {
    if (player.chances > 0) {
      closeResultAndContinue()
      return
    }

    showResultModal.value = false
    await shareCampaign()
    resetWheelState()
    savePremiumWheelState()
  } finally {
    isResultActionProcessing.value = false
  }
}

const playerStatusMessage = computed(() => {
  if (isSpinning.value) return '轉盤進行中，系統會自動顯示結果。'

  if (!availablePrizePool.value.length) return '目前獎品庫存已抽完，請等待主辦單位更新活動。'

  if (player.chances <= 0) return '目前沒有轉盤機會，可以分享活動增加 1 次。'

  return `目前還有 ${player.chances} 次轉盤機會。`
})

const frontPlayerSummaryItems = computed(() => {
  return [
    {
      label: '剩餘次數',
      value: `${player.chances}`,
      subText: '可轉盤',
      tone: 'yellow'
    },
    {
      label: '分享次數',
      value: `${player.sharedCount}`,
      subText: '已分享',
      tone: 'orange'
    },
    {
      label: '會員狀態',
      value: isUserLoggedIn.value ? '已登入' : '未登入',
      subText: isUserLoggedIn.value ? '可領獎勵' : '需登入',
      tone: isUserLoggedIn.value ? 'green' : 'slate'
    }
  ]
})

const frontVipFeatureItems = computed(() => {
  return [
    {
      icon: '👑',
      label: 'VIP 專屬',
      text: isUserLoggedIn.value ? '會員獎勵已啟用' : '登入後領分享獎勵'
    },
    {
      icon: '✨',
      label: '精緻轉盤',
      text: '獎項、動畫、音效同步展示'
    },
    {
      icon: '🎁',
      label: '即時紀錄',
      text: `${recentLogCount.value} 筆抽獎紀錄`
    }
  ]
})

const spinningHintText = computed(() => {
  if (!isSpinning.value) return ''

  return '轉盤轉動中，請不要重複點擊或關閉畫面。'
})

const wheelSliceStyle = (index) => {
  const total = Math.max(1, activePrizes.value.length)
  const angle = 360 / total
  const rotate = index * angle
  const skew = 90 - angle

  return {
    transform: `rotate(${rotate}deg) skewY(${skew}deg)`,
    background: index % 2 === 0
      ? 'linear-gradient(135deg, #fff7c2 0%, #facc15 38%, #fb923c 72%, #c2410c 100%)'
      : 'linear-gradient(135deg, #ffe4e6 0%, #fb7185 35%, #ef4444 72%, #991b1b 100%)'
  }
}

const wheelLabelStyle = (index) => {
  const total = Math.max(1, activePrizes.value.length)
  const angle = 360 / total
  const rotate = index * angle + angle / 2

  return {
    transform: `rotate(${rotate}deg) translateY(calc(var(--wheel-size) * -0.39)) rotate(${-rotate}deg)`
  }
}

const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  }
}

const getWheelSlicePath = (index) => {
  const total = Math.max(1, activePrizes.value.length)
  const angle = 360 / total
  const startAngle = index * angle
  const endAngle = startAngle + angle
  const start = polarToCartesian(160, 160, 150, endAngle)
  const end = polarToCartesian(160, 160, 150, startAngle)
  const largeArcFlag = angle > 180 ? 1 : 0

  return [
    'M',
    160,
    160,
    'L',
    start.x,
    start.y,
    'A',
    150,
    150,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
    'Z'
  ].join(' ')
}

const getWheelSliceFill = (index) => {
  return index % 2 === 0 ? 'url(#wheelGoldGradient)' : 'url(#wheelRoseGradient)'
}

const getWheelSvgLabelPosition = (index) => {
  const total = Math.max(1, activePrizes.value.length)
  const angle = 360 / total
  const middleAngle = index * angle + angle / 2
  const point = polarToCartesian(160, 160, 92, middleAngle)

  return {
    x: point.x,
    y: point.y
  }
}

const getWheelSliceClass = (index) => {
  if (activePrizeIndex.value !== index) return ''

  if (!resultPrize.value) return ''

  return resultPrize.value.type === 'lose'
    ? 'premium-wheel-slice-lose'
    : 'premium-wheel-slice-win'
}

const getWheelLabelClass = (index) => {
  if (activePrizeIndex.value !== index) return ''

  if (!resultPrize.value) return ''

  return resultPrize.value.type === 'lose'
    ? 'premium-wheel-label-lose'
    : 'premium-wheel-label-win'
}

const wheelStyle = computed(() => {
  return {
    transform: `rotate(${wheelRotation.value}deg)`
  }
})

const getPrizeTypeLabel = (type) => {
  return type === 'lose' ? '未中獎' : '中獎'
}

const getPrizeRankLabel = (rank, type = 'win') => {
  if (type === 'lose') return '未中獎'

  const option = prizeRankOptions.find((item) => item.value === rank)

  return option?.label || '一般獎'
}

const getPrizeRankClass = (rank, type = 'win') => {
  if (type === 'lose' || rank === 'none') {
    return 'bg-slate-100 text-slate-500'
  }

  if (rank === 'first') {
    return 'bg-yellow-100 text-yellow-700'
  }

  if (rank === 'second') {
    return 'bg-orange-100 text-orange-700'
  }

  if (rank === 'third') {
    return 'bg-amber-100 text-amber-700'
  }

  return 'bg-emerald-100 text-emerald-700'
}

const hasPrizeImage = (prize) => {
  return Boolean(String(prize?.imageUrl || '').trim())
}

const getPrizeImageUrl = (prize) => {
  return String(prize?.imageUrl || '').trim()
}

const updateChanceText = () => {
  campaign.chanceText = `還有 ${player.chances} 次轉盤機會`
}

const showSavedMessage = (message) => {
  savedMessage.value = message

  setTimeout(() => {
    savedMessage.value = ''
  }, 2200)
}

const getStorageKey = () => {
  return `${PREMIUM_WHEEL_STORAGE_KEY}_${currentGameId.value}`
}

const pingPremiumWheelSync = () => {
  if (typeof localStorage === 'undefined') return

  localStorage.setItem(
    PREMIUM_WHEEL_SYNC_PING_KEY,
    JSON.stringify({
      key: getStorageKey(),
      gameId: currentGameId.value,
      updatedAt: new Date().toISOString()
    })
  )
}

const handlePremiumWheelStorageSync = (event) => {
  if (!event) return
  if (isSavingPremiumWheelState.value) return

  if (event.key === getStorageKey()) {
    loadPremiumWheelState()
    return
  }

  if (event.key === PREMIUM_WHEEL_SYNC_PING_KEY) {
    const payload = safeJsonParse(event.newValue, null)

    if (payload?.key === getStorageKey()) {
      lastSyncAt.value = new Date().toLocaleString('zh-TW')
      lastSyncMessage.value = '已收到管理版同步，玩家畫面已更新。'
      loadPremiumWheelState()
    }
  }
}

const syncPremiumWheelToPlayer = () => {
  savePremiumWheelState()
  pingPremiumWheelSync()

  lastSyncAt.value = new Date().toLocaleString('zh-TW')
  lastSyncMessage.value = `已同步到玩家版：${sourcePath.value}`

  showSavedMessage('已同步最新轉盤設定到玩家版。')
}

const getShareUrl = () => {
  if (typeof window === 'undefined') return sourcePath.value

  return `${window.location.origin}${sourcePath.value}`
}

const getCustomShareTitle = () => {
  return String(campaign.shareTitle || '').trim() || campaign.pageTitle
}

const getCustomShareDescription = () => {
  return String(campaign.shareDescription || '').trim() || `${campaign.mainTitle} ${campaign.heroTagline}`
}

const getCustomShareImageUrl = () => {
  return String(campaign.shareImageUrl || '').trim()
}

const getCustomShareButtonText = () => {
  return String(campaign.shareButtonText || '').trim() || '分享增加機會'
}

const splitMultilineText = (value) => {
  return String(value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

const getOfficialWebsiteUrl = () => {
  const rawUrl = String(campaign.websiteUrl || '').trim()

  if (!rawUrl) return ''

  if (/^https?:\/\//i.test(rawUrl)) {
    return rawUrl
  }

  return `https://${rawUrl}`
}

const getShareText = () => {
  return [
    `${getCustomShareTitle()}｜${campaign.subTitle}`,
    getCustomShareDescription(),
    `立即參加：${getShareUrl()}`
  ].join('\n')
}

const getTodayKey = () => {
  return new Date().toISOString().slice(0, 10)
}

const normalizedShareRewardDailyLimit = computed(() => {
  return Math.max(0, Number(campaign.shareRewardDailyLimit || 0))
})

const normalizedShareRewardCooldownSeconds = computed(() => {
  return Math.max(0, Number(campaign.shareRewardCooldownSeconds || 0))
})

const syncShareRewardDate = () => {
  const todayKey = getTodayKey()

  if (shareRewardState.value.date !== todayKey) {
    shareRewardState.value = {
      date: todayKey,
      count: 0,
      lastRewardAt: 0
    }
  }
}

const shareRewardRemainingToday = computed(() => {
  syncShareRewardDate()

  return Math.max(0, normalizedShareRewardDailyLimit.value - Number(shareRewardState.value.count || 0))
})

const shareRewardCooldownRemaining = computed(() => {
  const cooldownMs = normalizedShareRewardCooldownSeconds.value * 1000
  const lastRewardAt = Number(shareRewardState.value.lastRewardAt || 0)

  if (!cooldownMs || !lastRewardAt) return 0

  const remainingMs = cooldownMs - (Date.now() - lastRewardAt)

  return Math.max(0, Math.ceil(remainingMs / 1000))
})

const canClaimShareReward = computed(() => {
  if (!campaign.enableShareReward) return false
  if (shareRewardRemainingToday.value <= 0) return false
  if (shareRewardCooldownRemaining.value > 0) return false

  return true
})

const getShareRewardBlockedMessage = () => {
  if (!campaign.enableShareReward) {
    return '目前未開啟分享增加機會。'
  }

  if (shareRewardRemainingToday.value <= 0) {
    return '今日分享增加機會已達上限。'
  }

  if (shareRewardCooldownRemaining.value > 0) {
    return `分享獎勵冷卻中，請 ${shareRewardCooldownRemaining.value} 秒後再試。`
  }

  return ''
}

const getAuthTokenInfo = () => {
  const tokenKeys = [
    'token',
    'authToken',
    'accessToken',
    'jwt',
    'userToken',
    'marketingGameToken',
    'mg_token'
  ]

  for (const key of tokenKeys) {
    const value = localStorage.getItem(key)

    if (value) {
      return {
        key,
        value
      }
    }
  }

  return {
    key: '',
    value: ''
  }
}

const getAuthToken = () => {
  return getAuthTokenInfo().value
}

const getAuthTokenKey = () => {
  return getAuthTokenInfo().key || '未偵測到'
}

const isUserLoggedIn = computed(() => {
  return Boolean(getAuthToken())
})

const getCurrentRedirectPath = () => {
  return route.fullPath || window.location.pathname + window.location.search
}

const goLoginPage = () => {
  router.push({
    path: '/login',
    query: {
      redirect: getCurrentRedirectPath()
    }
  })
}

const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
}

const syncShareRewardStateFromServer = (status) => {
  if (!status) return

  shareRewardState.value = {
    date: getTodayKey(),
    count: Number(status.todayCount || 0),
    lastRewardAt: status.lastClaimedAt ? new Date(status.lastClaimedAt).getTime() : 0
  }
}

const claimShareRewardFromServer = async () => {
  const token = getAuthToken()

  if (!token) {
    return {
      success: false,
      message: '請先登入後再領取分享獎勵'
    }
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/share-rewards/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        gameId: currentGameId.value || 'wheel',
        campaignId: campaign.id || null,
        dailyLimit: normalizedShareRewardDailyLimit.value,
        cooldownSeconds: normalizedShareRewardCooldownSeconds.value
      })
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.success) {
      if (payload?.data) {
        syncShareRewardStateFromServer(payload.data)
      }

      return {
        success: false,
        message: payload?.message || '分享獎勵領取失敗'
      }
    }

    const rewardCount = Number(payload.data?.rewardCount || 1)
    syncShareRewardStateFromServer(payload.data?.status)

    return {
      success: true,
      rewardCount,
      message: payload.message || '分享獎勵領取成功'
    }
  } catch (error) {
    console.error('claimShareRewardFromServer error:', error)

    return {
      success: false,
      message: '無法連線到分享獎勵 API，請確認後端是否啟動'
    }
  }
}

const fetchShareRewardStatusFromServer = async () => {
  const token = getAuthToken()

  if (!token) {
    shareRewardStatusMessage.value = '尚未登入，無法同步分享獎勵狀態。'
    return
  }

  isShareRewardStatusLoading.value = true

  try {
    const params = new URLSearchParams({
      gameId: currentGameId.value || 'wheel',
      dailyLimit: String(normalizedShareRewardDailyLimit.value),
      cooldownSeconds: String(normalizedShareRewardCooldownSeconds.value)
    })

    const response = await fetch(`${getApiBaseUrl()}/share-rewards/status?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.success) {
      shareRewardStatusMessage.value = payload?.message || '分享獎勵狀態同步失敗。'
      return
    }

    syncShareRewardStateFromServer(payload.data)
    shareRewardStatusMessage.value = '分享獎勵狀態已同步。'
  } catch (error) {
    console.error('fetchShareRewardStatusFromServer error:', error)
    shareRewardStatusMessage.value = '無法連線到分享獎勵狀態 API。'
  } finally {
    isShareRewardStatusLoading.value = false
  }
}

const testShareRewardApiConnection = async () => {
  const token = getAuthToken()
  const tokenKey = getAuthTokenKey()
  const apiBaseUrl = getApiBaseUrl()

  shareRewardApiDiagnostic.value = {
    status: '測試中',
    message: '正在測試分享獎勵 API...',
    apiBaseUrl,
    hasToken: Boolean(token),
    tokenKey,
    testedAt: new Date().toLocaleString('zh-TW')
  }

  if (!token) {
    shareRewardApiDiagnostic.value = {
      status: '失敗',
      message: '找不到登入 Token，請先登入會員後再測試。',
      apiBaseUrl,
      hasToken: false,
    tokenKey,
      testedAt: new Date().toLocaleString('zh-TW')
    }
    return
  }

  try {
    const params = new URLSearchParams({
      gameId: currentGameId.value || 'wheel',
      dailyLimit: String(normalizedShareRewardDailyLimit.value),
      cooldownSeconds: String(normalizedShareRewardCooldownSeconds.value)
    })

    const response = await fetch(`${apiBaseUrl}/share-rewards/status?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.success) {
      shareRewardApiDiagnostic.value = {
        status: '失敗',
        message: payload?.message || `API 測試失敗，HTTP ${response.status}`,
        apiBaseUrl,
        hasToken: true,
    tokenKey,
        testedAt: new Date().toLocaleString('zh-TW')
      }
      return
    }

    syncShareRewardStateFromServer(payload.data)
    shareRewardApiDiagnostic.value = {
      status: '成功',
      message: payload?.message || '分享獎勵 API 連線正常。',
      apiBaseUrl,
      hasToken: true,
    tokenKey,
      testedAt: new Date().toLocaleString('zh-TW')
    }
    shareRewardStatusMessage.value = '分享獎勵 API 測試成功，狀態已同步。'
  } catch (error) {
    console.error('testShareRewardApiConnection error:', error)
    shareRewardApiDiagnostic.value = {
      status: '失敗',
      message: '無法連線到後端 API，請確認後端是否啟動於 http://localhost:3000。',
      apiBaseUrl,
      hasToken: true,
    tokenKey,
      testedAt: new Date().toLocaleString('zh-TW')
    }
  }
}

const postShareRewardAdminAction = async (endpoint, successMessage) => {
  const token = getAuthToken()

  if (!token) {
    showSavedMessage('請先登入後再操作後台分享防作弊功能。')
    return false
  }

  isShareRewardStatusLoading.value = true

  try {
    const response = await fetch(`${getApiBaseUrl()}/share-rewards/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        gameId: currentGameId.value || 'wheel'
      })
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.success) {
      const message = payload?.message || '後端操作失敗'
      shareRewardStatusMessage.value = message
      showSavedMessage(message)
      return false
    }

    shareRewardStatusMessage.value = successMessage
    showSavedMessage(successMessage)
    await fetchShareRewardStatusFromServer()
    return true
  } catch (error) {
    console.error(`postShareRewardAdminAction ${endpoint} error:`, error)
    shareRewardStatusMessage.value = '無法連線到分享獎勵後端 API。'
    showSavedMessage('無法連線到分享獎勵後端 API。')
    return false
  } finally {
    isShareRewardStatusLoading.value = false
  }
}

const shareRewardAdminStatus = computed(() => {
  syncShareRewardDate()

  return {
    date: shareRewardState.value.date || getTodayKey(),
    usedCount: Number(shareRewardState.value.count || 0),
    remainingCount: shareRewardRemainingToday.value,
    dailyLimit: normalizedShareRewardDailyLimit.value,
    cooldownSeconds: normalizedShareRewardCooldownSeconds.value,
    cooldownRemaining: shareRewardCooldownRemaining.value,
    lastRewardAt: shareRewardState.value.lastRewardAt
      ? new Date(Number(shareRewardState.value.lastRewardAt)).toLocaleString('zh-TW')
      : '尚未領取',
    enabled: Boolean(campaign.enableShareReward)
  }
})

const resetShareRewardToday = async () => {
  const confirmed = window.confirm('確定要重置今日分享獎勵領取次數嗎？')

  if (!confirmed) return

  const success = await postShareRewardAdminAction('reset-today', '後端已重置今日分享獎勵。')

  if (!success) return

  shareRewardState.value = {
    date: getTodayKey(),
    count: 0,
    lastRewardAt: 0
  }

  savePremiumWheelState()
}

const clearShareRewardCooldown = async () => {
  const success = await postShareRewardAdminAction('clear-cooldown', '後端已清除分享獎勵冷卻。')

  if (!success) return

  shareRewardState.value = {
    ...shareRewardState.value,
    date: shareRewardState.value.date || getTodayKey(),
    lastRewardAt: 0
  }

  savePremiumWheelState()
}

const exportShareRewardStatus = () => {
  const payload = {
    type: 'premium_wheel_share_reward_status',
    exportedAt: new Date().toISOString(),
    currentGameId: currentGameId.value,
    sourcePath: sourcePath.value,
    campaign: {
      enableShareReward: campaign.enableShareReward,
      shareRewardDailyLimit: campaign.shareRewardDailyLimit,
      shareRewardCooldownSeconds: campaign.shareRewardCooldownSeconds
    },
    status: cloneByJson(shareRewardAdminStatus.value),
    rawState: cloneByJson(shareRewardState.value)
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8'
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `premium-wheel-share-reward-status-${Date.now()}.json`
  link.click()

  URL.revokeObjectURL(url)
  showSavedMessage('已匯出分享防作弊狀態 JSON。')
}

const completeShareActivity = async (message = '分享成功，已增加 1 次轉盤機會。') => {
  syncShareRewardDate()

  if (!canClaimShareReward.value) {
    showShareSuccess(getShareRewardBlockedMessage())
    return false
  }

  const serverResult = await claimShareRewardFromServer()

  if (!serverResult.success) {
    showShareSuccess(serverResult.message || '分享獎勵領取失敗')
    return false
  }

  player.sharedCount += 1
  player.chances += Number(serverResult.rewardCount || 1)

  updateChanceText()
  savePremiumWheelState()
  shareRewardStatusMessage.value = '後端已核准分享獎勵。'
  showShareSuccess(message)
  return true
}

const openSharePreviewModal = () => {
  showSharePreviewModal.value = true
}

const closeSharePreviewModal = () => {
  isShareActionProcessing.value = false
  showSharePreviewModal.value = false
}

const handleShareActivity = () => {
  openSharePreviewModal()
}

const runSystemShareFromPreview = async () => {
  const shareText = getShareText()
  const shareUrl = getShareUrl()

  isShareActionProcessing.value = true

  try {
    if (navigator.share) {
      await navigator.share({
        title: getCustomShareTitle(),
        text: shareText,
        url: shareUrl
      })

      const granted = await completeShareActivity('分享成功，已增加 1 次轉盤機會。')
      if (granted) closeSharePreviewModal()
      return
    }

    await navigator.clipboard.writeText(shareText)
    const granted = await completeShareActivity('此裝置不支援系統分享，已改為複製文案並增加 1 次轉盤機會。')
    if (granted) closeSharePreviewModal()
  } catch (error) {
    console.warn('分享活動失敗或使用者取消分享：', error)
    isShareActionProcessing.value = false
  }
}

const copyShareTextFromPreview = async () => {
  const shareText = getShareText()

  isShareActionProcessing.value = true

  try {
    await navigator.clipboard.writeText(shareText)
    const granted = await completeShareActivity('已複製分享文案，並增加 1 次轉盤機會。')
    if (granted) closeSharePreviewModal()
  } catch (error) {
    console.error('複製分享文案失敗：', error)
    isShareActionProcessing.value = false
    window.prompt('瀏覽器不支援自動複製，請手動複製：', shareText)
  }
}

const getResultCopyText = () => {
  const prize = resultPrize.value

  return [
    `活動名稱：${campaign.pageTitle}`,
    `抽獎結果：${prize?.type === 'lose' ? '未中獎' : '中獎'}`,
    `獎項名稱：${prize?.name || '未知獎項'}`,
    `獎項等級：${getPrizeRankLabel(prize?.rank, prize?.type)}`,
    `抽獎時間：${new Date().toLocaleString('zh-TW')}`,
    `兌獎提醒：請截圖或保存此結果，並依主辦單位公告方式兌換。`
  ].join('\n')
}

const copyResultText = async () => {
  if (!resultPrize.value) return

  const payload = getResultCopyText()

  try {
    await navigator.clipboard.writeText(payload)
    showSavedMessage('已複製中獎結果。')
  } catch (error) {
    console.error('複製中獎結果失敗：', error)
    window.prompt('瀏覽器不支援自動複製，請手動複製：', payload)
  }
}

const getResultShareText = () => {
  const prize = resultPrize.value

  return [
    `我參加「${campaign.pageTitle}」抽中了：${prize?.name || '神秘獎項'}`,
    `獎項等級：${getPrizeRankLabel(prize?.rank, prize?.type)}`,
    `一起來玩：${getShareUrl()}`
  ].join('\n')
}

const shareResultText = async () => {
  if (!resultPrize.value) return

  const payload = getResultShareText()

  if (navigator.share) {
    try {
      await navigator.share({
        title: campaign.pageTitle,
        text: payload,
        url: getShareUrl()
      })
      showSavedMessage('已開啟分享中獎結果。')
      return
    } catch (error) {
      console.warn('原生分享取消或失敗，改用複製分享文案：', error)
    }
  }

  try {
    await navigator.clipboard.writeText(payload)
    showSavedMessage('已複製分享文案。')
  } catch (error) {
    console.error('複製分享文案失敗：', error)
    window.prompt('瀏覽器不支援自動分享，請手動複製：', payload)
  }
}

const getShareSuccessText = (prefix = '已增加 1 次轉盤機會') => {
  return `${prefix}，目前還有 ${player.chances} 次轉盤機會。`
}

const showShareSuccess = (message) => {
  shareMessage.value = message
  showShareMessage.value = true

  setTimeout(() => {
    showShareMessage.value = false
    shareMessage.value = ''
  }, 2600)
}

const pickPrize = () => {
  const pool = availablePrizePool.value

  if (!pool.length) return null

  const total = pool.reduce((sum, prize) => sum + Number(prize.probability || 0), 0)
  const target = Math.random() * total
  let current = 0

  for (const prize of pool) {
    current += Number(prize.probability || 0)

    if (target <= current) {
      return prize
    }
  }

  return pool[pool.length - 1]
}

const getHistoryItems = () => {
  return safeJsonParse(localStorage.getItem(GAME_HISTORY_STORAGE_KEY), [])
}

const saveHistoryItem = (prize) => {
  const history = Array.isArray(getHistoryItems()) ? getHistoryItems() : []

  const item = {
    id: `wheel-${Date.now()}`,
    gameId: currentGameId.value,
    gameType: 'premium-wheel',
    gameName: campaign.pageTitle,
    prizeId: prize?.id || '',
    prizeName: prize?.name || '未知結果',
    prizeIcon: prize?.icon || '🎁',
    prizeImageUrl: prize?.imageUrl || '',
    prizeType: prize?.type || 'win',
    prizeRank: prize?.rank || (prize?.type === 'lose' ? 'none' : 'normal'),
    prizeRankLabel: getPrizeRankLabel(prize?.rank, prize?.type),
    sourcePath: sourcePath.value,
    createdAt: new Date().toISOString()
  }

  localStorage.setItem(
    GAME_HISTORY_STORAGE_KEY,
    JSON.stringify([item, ...history].slice(0, 50))
  )
}

const savePremiumWheelState = () => {
  if (isApplyingPremiumWheelRemoteState.value) return

  isSavingPremiumWheelState.value = true

  const payload = {
    version: premiumVersionInfo.value.version,
    platformVersion: premiumVersionInfo.value.platformVersion,
    batch: premiumVersionInfo.value.batch,
    currentGameId: currentGameId.value,
    campaign: cloneByJson(campaign),
    player: cloneByJson(player),
    prizes: cloneByJson(prizes.value),
    drawLogs: cloneByJson(drawLogs.value),
    shareRewardState: cloneByJson(shareRewardState.value),
    savedAt: new Date().toISOString()
  }

  localStorage.setItem(getStorageKey(), JSON.stringify(payload))
  pingPremiumWheelSync()

  setTimeout(() => {
    isSavingPremiumWheelState.value = false
  }, 0)
}

const loadPremiumWheelState = () => {
  isApplyingPremiumWheelRemoteState.value = true

  const payload = safeJsonParse(localStorage.getItem(getStorageKey()), null)

  if (!payload) {
    updateChanceText()
    isApplyingPremiumWheelRemoteState.value = false
    return
  }

  if (payload.campaign) {
    Object.assign(campaign, {
      ...defaultCampaignSnapshot,
      ...payload.campaign
    })
  }

  if (payload.player) {
    Object.assign(player, {
      ...defaultPlayerSnapshot,
      ...payload.player
    })
  }

  if (Array.isArray(payload.prizes)) {
    prizes.value = payload.prizes.map((prize) => {
      return {
        ...prize,
        imageUrl: prize.imageUrl || '',
        isEnabled: prize.isEnabled !== false,
        rank: prize.rank || (prize.type === 'lose' ? 'none' : 'normal')
      }
    })
  }

  if (Array.isArray(payload.drawLogs)) {
    drawLogs.value = payload.drawLogs.slice(0, 8)
  }

  updateChanceText()

  setTimeout(() => {
    isApplyingPremiumWheelRemoteState.value = false
  }, 0)
}

const resetWheelState = () => {
  stopPointerTickSound()
  stopSpinSound()
  stopWinSound()
  showWinEffects.value = false
  isSpinning.value = false
  activePrizeIndex.value = -1
  resultPrize.value = null
  showResultModal.value = false
}

const stopSpinSound = () => {
  if (!spinAudio.value) return

  spinAudio.value.pause()
  spinAudio.value.currentTime = 0
}

const playSpinSound = async () => {
  if (!campaign.enableSpinSound) return
  if (!campaign.spinSoundUrl) return

  try {
    stopSpinSound()

    spinAudio.value = new Audio(campaign.spinSoundUrl)
    spinAudio.value.volume = normalizedSpinSoundVolume.value / 100
    spinAudio.value.loop = true

    await spinAudio.value.play()
  } catch (error) {
    console.warn('轉盤轉動音效播放失敗，可能被瀏覽器阻擋或音效網址無法讀取：', error)
  }
}

const testSpinSound = async () => {
  if (!campaign.spinSoundUrl) {
    window.alert('請先填入轉動音效網址。')
    return
  }

  const wasEnabled = campaign.enableSpinSound

  campaign.enableSpinSound = true
  await playSpinSound()
  campaign.enableSpinSound = wasEnabled

  showSavedMessage('正在測試轉盤轉動音效。')

  setTimeout(() => {
    stopSpinSound()
  }, 2800)
}

const testWinSound = async () => {
  if (!campaign.winSoundUrl) {
    window.alert('請先填入中獎音樂網址。')
    return
  }

  const wasEnabled = campaign.enableWinSound

  campaign.enableWinSound = true
  await playWinSound()
  campaign.enableWinSound = wasEnabled

  showSavedMessage('正在測試中獎音樂。')
}

const stopAllSounds = () => {
  stopSpinSound()
  stopWinSound()
  showSavedMessage('已停止所有音效。')
}

const stopWinSound = () => {
  if (!winAudio.value) return

  winAudio.value.pause()
  winAudio.value.currentTime = 0
}

const playWinSound = async () => {
  if (!campaign.enableWinSound) return
  if (!campaign.winSoundUrl) return

  try {
    stopWinSound()

    winAudio.value = new Audio(campaign.winSoundUrl)
    winAudio.value.volume = normalizedWinSoundVolume.value / 100

    await winAudio.value.play()
  } catch (error) {
    console.warn('中獎音樂播放失敗，可能被瀏覽器阻擋或音樂網址無法讀取：', error)
  }
}

const triggerWinEffects = (prize) => {
  if (!prize || prize.type === 'lose') return

  showWinEffects.value = Boolean(campaign.enableWinConfetti || campaign.enableGoldRain)

  playWinSound()

  setTimeout(() => {
    showWinEffects.value = false
  }, normalizedEffectDuration.value * 1000)
}

const getWinEffectSettingsPayload = () => {
  return {
    type: 'premium_wheel_win_effect_settings',
    version: premiumVersionInfo.value.version,
    exportedAt: new Date().toISOString(),
    settings: {
      enableWinConfetti: campaign.enableWinConfetti,
      enableGoldRain: campaign.enableGoldRain,
      enableWinSound: campaign.enableWinSound,
      winSoundUrl: campaign.winSoundUrl,
      winSoundVolume: campaign.winSoundVolume,
      winEffectDuration: campaign.winEffectDuration,
      confettiCount: campaign.confettiCount,
      goldRainCount: campaign.goldRainCount,
      enableWinFlash: campaign.enableWinFlash,
      enablePrizeBounce: campaign.enablePrizeBounce,
      enableGoldenAura: campaign.enableGoldenAura,
      enableSpinSound: campaign.enableSpinSound,
      spinSoundUrl: campaign.spinSoundUrl,
      spinSoundVolume: campaign.spinSoundVolume
    }
  }
}

const applyWinEffectSettingsPayload = (payload) => {
  const settings = payload?.settings || payload

  if (!settings || typeof settings !== 'object') {
    window.alert('匯入失敗：找不到中獎特效設定。')
    return
  }

  Object.assign(campaign, {
    enableWinConfetti: Boolean(settings.enableWinConfetti),
    enableGoldRain: Boolean(settings.enableGoldRain),
    enableWinSound: Boolean(settings.enableWinSound),
    winSoundUrl: settings.winSoundUrl || '',
    winSoundVolume: Number(settings.winSoundVolume ?? 75),
    winEffectDuration: Number(settings.winEffectDuration ?? 6),
    confettiCount: Number(settings.confettiCount ?? 54),
    goldRainCount: Number(settings.goldRainCount ?? 48),
    enableWinFlash: Boolean(settings.enableWinFlash),
    enablePrizeBounce: Boolean(settings.enablePrizeBounce),
    enableGoldenAura: Boolean(settings.enableGoldenAura),
    enableSpinSound: Boolean(settings.enableSpinSound),
    spinSoundUrl: settings.spinSoundUrl || '',
    spinSoundVolume: Number(settings.spinSoundVolume ?? 45)
  })

  savePremiumWheelState()
  showSavedMessage('已匯入中獎特效設定。')
}

const exportWinEffectSettings = () => {
  const payload = getWinEffectSettingsPayload()
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8'
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `premium-wheel-win-effects-${Date.now()}.json`
  link.click()

  URL.revokeObjectURL(url)
  showSavedMessage('已匯出中獎特效設定。')
}

const openWinEffectImport = () => {
  effectImportInput.value?.click()
}

const importWinEffectSettings = async (event) => {
  const file = event?.target?.files?.[0]

  if (!file) return

  try {
    const content = await file.text()
    const payload = JSON.parse(content)

    applyWinEffectSettingsPayload(payload)
  } catch (error) {
    console.error('匯入中獎特效設定失敗：', error)
    window.alert('匯入失敗：請確認檔案是正確的 JSON。')
  } finally {
    if (event?.target) {
      event.target.value = ''
    }
  }
}

const applyWinEffectPreset = (preset) => {
  const presets = {
    elegant: {
      label: '低調質感',
      enableWinConfetti: true,
      enableGoldRain: true,
      enableWinFlash: false,
      enablePrizeBounce: true,
      enableGoldenAura: true,
      confettiCount: 26,
      goldRainCount: 22,
      winEffectDuration: 4,
      winSoundVolume: 55
    },
    luxury: {
      label: '豪華高級',
      enableWinConfetti: true,
      enableGoldRain: true,
      enableWinFlash: true,
      enablePrizeBounce: true,
      enableGoldenAura: true,
      confettiCount: 54,
      goldRainCount: 48,
      winEffectDuration: 6,
      winSoundVolume: 75
    },
    party: {
      label: '熱鬧派對',
      enableWinConfetti: true,
      enableGoldRain: true,
      enableWinFlash: true,
      enablePrizeBounce: true,
      enableGoldenAura: true,
      confettiCount: 96,
      goldRainCount: 84,
      winEffectDuration: 8,
      winSoundVolume: 90
    }
  }

  const selectedPreset = presets[preset]

  if (!selectedPreset) return

  Object.assign(campaign, {
    enableWinConfetti: selectedPreset.enableWinConfetti,
    enableGoldRain: selectedPreset.enableGoldRain,
    enableWinFlash: selectedPreset.enableWinFlash,
    enablePrizeBounce: selectedPreset.enablePrizeBounce,
    enableGoldenAura: selectedPreset.enableGoldenAura,
    confettiCount: selectedPreset.confettiCount,
    goldRainCount: selectedPreset.goldRainCount,
    winEffectDuration: selectedPreset.winEffectDuration,
    winSoundVolume: selectedPreset.winSoundVolume
  })

  savePremiumWheelState()
  showSavedMessage(`已套用「${selectedPreset.label}」中獎特效風格。`)
}

const previewWinEffects = () => {
  const previewPrize = prizes.value.find((prize) => prize.type !== 'lose') || prizes.value[0]

  if (!previewPrize) {
    window.alert('目前沒有可測試的獎項。')
    return
  }

  showWinEffects.value = false

  setTimeout(() => {
    triggerWinEffects({
      ...previewPrize,
      type: 'win'
    })
    showSavedMessage('已測試中獎彩帶 / 金沙 / 音樂特效。')
  }, 80)
}

const finishSpin = (prize, index) => {
  stopSpinSound()
  resultPrize.value = prize
  activePrizeIndex.value = index
  isSpinning.value = false

  if (prize && prize.stock < 9999) {
    prize.stock = Math.max(0, Number(prize.stock) - 1)
  }

  const log = {
    id: `log-${Date.now()}`,
    prizeName: prize?.name || '未知結果',
    prizeIcon: prize?.icon || '🎁',
    prizeImageUrl: prize?.imageUrl || '',
    prizeType: prize?.type || 'win',
    prizeRank: prize?.rank || (prize?.type === 'lose' ? 'none' : 'normal'),
    prizeRankLabel: getPrizeRankLabel(prize?.rank, prize?.type),
    createdAt: new Date().toLocaleString('zh-TW')
  }

  drawLogs.value = [log, ...drawLogs.value].slice(0, 8)

  if (prize) {
    saveHistoryItem(prize)
  }

  savePremiumWheelState()
  triggerWinEffects(prize)

  setTimeout(() => {
    showResultModal.value = true
  }, 450)
}


let pointerTickTimer = null
let pointerTickAudioContext = null

const getPointerTickFrequency = () => {
  const tone = campaign.pointerTickTone || 'crisp'

  if (tone === 'wood') return 280
  if (tone === 'metal') return 880

  return 520
}

const getPointerTickWaveType = () => {
  const tone = campaign.pointerTickTone || 'crisp'

  if (tone === 'wood') return 'triangle'
  if (tone === 'metal') return 'square'

  return 'sine'
}

const playPointerTickOnce = () => {
  if (!campaign.enablePointerTickSound) return
  if (normalizedPointerTickVolume.value <= 0) return
  if (typeof window === 'undefined') return

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext

    if (!AudioContextClass) return

    if (!pointerTickAudioContext) {
      pointerTickAudioContext = new AudioContextClass()
    }

    const context = pointerTickAudioContext
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const now = context.currentTime

    oscillator.type = getPointerTickWaveType()
    oscillator.frequency.setValueAtTime(getPointerTickFrequency(), now)

    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(normalizedPointerTickVolume.value / 450, now + 0.006)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045)

    oscillator.connect(gain)
    gain.connect(context.destination)

    oscillator.start(now)
    oscillator.stop(now + 0.05)
  } catch (error) {
    console.warn('播放指針卡點音效失敗：', error)
  }
}

const stopPointerTickSound = () => {
  if (pointerTickTimer) {
    window.clearInterval(pointerTickTimer)
    pointerTickTimer = null
  }
}

const startPointerTickSound = () => {
  stopPointerTickSound()

  if (!campaign.enablePointerTickSound) return
  if (normalizedPointerTickVolume.value <= 0) return
  if (typeof window === 'undefined') return

  playPointerTickOnce()

  pointerTickTimer = window.setInterval(() => {
    playPointerTickOnce()
  }, normalizedPointerTickSpeed.value)
}


const startSpin = () => {
  if (!canSpin.value) {
    if (player.chances <= 0) {
      showShareSuccess('目前沒有轉盤機會，請先分享活動增加次數。')
      return
    }

    if (!availablePrizePool.value.length) {
      showShareSuccess('目前獎品已抽完，請等待主辦單位更新活動。')
    }

    return
  }

  const prize = pickPrize()

  if (!prize) return

  const prizeIndex = prizes.value.findIndex((item) => item.id === prize.id)
  const activeIndex = activePrizes.value.findIndex((item) => item.id === prize.id)
  const targetIndex = Math.max(0, activeIndex)
  const total = Math.max(1, activePrizes.value.length)
  const angle = 360 / total
  const pointerOffset = 360 - (targetIndex * angle + angle / 2)
  const extraTurns = 360 * 6

  player.chances -= 1
  updateChanceText()
  isSpinning.value = true
  startPointerTickSound()
  activePrizeIndex.value = -1
  resultPrize.value = null
  playSpinSound()

  wheelRotation.value += extraTurns + pointerOffset

  setTimeout(() => {
    finishSpin(prize, targetIndex)
  }, 3600)
}

const shareCampaign = async () => {
  if (isSpinning.value) return

  player.sharedCount += 1
  player.chances += 1
  updateChanceText()
  savePremiumWheelState()

  const shareText = getShareText()

  try {
    await navigator.clipboard.writeText(shareText)
    showShareSuccess(getShareSuccessText('已複製分享文案並增加 1 次轉盤機會'))
  } catch (error) {
    console.error('複製分享文案失敗：', error)
    showShareSuccess(getShareSuccessText('已增加 1 次轉盤機會；目前瀏覽器不支援自動複製'))
  }
}

const closeResultAndContinue = () => {
  isResultActionProcessing.value = false
  showWinEffects.value = false
  stopWinSound()
  showResultModal.value = false
  resultPrize.value = null
  activePrizeIndex.value = -1
  savePremiumWheelState()
}

const goGameHistory = () => {
  showResultModal.value = false
  router.push('/game-history')
}

const goGamesCenter = () => {
  router.push('/games')
}

const resetDemo = () => {
  const confirmed = window.confirm('確定要重置精緻轉盤示範資料嗎？')

  if (!confirmed) return

  localStorage.removeItem(getStorageKey())

  Object.assign(campaign, cloneByJson(defaultCampaignSnapshot))
  Object.assign(player, cloneByJson(defaultPlayerSnapshot))
  prizes.value = cloneByJson(defaultPrizesSnapshot)
  drawLogs.value = []
  wheelRotation.value = 0
  resetWheelState()
  updateChanceText()
  savePremiumWheelState()
  showSavedMessage('已重置精緻轉盤示範資料。')
}

const exportDemoState = () => {
  const payload = {
    version: premiumVersionInfo.value.version,
    platformVersion: premiumVersionInfo.value.platformVersion,
    batch: premiumVersionInfo.value.batch,
    exportedAt: new Date().toISOString(),
    currentGameId: currentGameId.value,
    sourcePath: sourcePath.value,
    adminSourcePath: adminSourcePath.value,
    campaign: cloneByJson(campaign),
    player: cloneByJson(player),
    prizes: cloneByJson(prizes.value),
    drawLogs: cloneByJson(drawLogs.value)
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8'
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `premium-wheel-demo-${Date.now()}.json`
  link.click()

  URL.revokeObjectURL(url)
  showSavedMessage('已匯出精緻轉盤示範資料。')
}

const downloadTextFile = (content, filename, type = 'text/plain;charset=utf-8') => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}

const escapeCsvCell = (value) => {
  const text = String(value ?? '')

  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }

  return text
}

const exportDrawLogsJson = () => {
  const payload = {
    type: 'premium_wheel_draw_logs',
    version: premiumVersionInfo.value.version,
    exportedAt: new Date().toISOString(),
    currentGameId: currentGameId.value,
    sourcePath: sourcePath.value,
    total: drawLogs.value.length,
    items: cloneByJson(drawLogs.value)
  }

  downloadTextFile(
    JSON.stringify(payload, null, 2),
    `premium-wheel-draw-logs-${Date.now()}.json`,
    'application/json;charset=utf-8'
  )

  showSavedMessage('已匯出轉盤抽獎紀錄 JSON。')
}

const exportDrawLogsCsv = () => {
  const headers = [
    'id',
    'prizeName',
    'prizeIcon',
    'prizeImageUrl',
    'prizeType',
    'prizeRank',
    'prizeRankLabel',
    'createdAt'
  ]

  const rows = drawLogs.value.map((log) => {
    return headers.map((key) => escapeCsvCell(log[key])).join(',')
  })

  const csvContent = [
    headers.join(','),
    ...rows
  ].join('\n')

  downloadTextFile(
    `\ufeff${csvContent}`,
    `premium-wheel-draw-logs-${Date.now()}.csv`,
    'text/csv;charset=utf-8'
  )

  showSavedMessage('已匯出轉盤抽獎紀錄 CSV。')
}

const clearDrawLogs = () => {
  if (!drawLogs.value.length) {
    showSavedMessage('目前沒有轉盤抽獎紀錄可清除。')
    return
  }

  const confirmed = window.confirm('確定要清除目前這個轉盤頁面的抽獎紀錄嗎？此操作不會刪除我的遊戲紀錄。')

  if (!confirmed) return

  drawLogs.value = []
  savePremiumWheelState()
  showSavedMessage('已清除目前轉盤頁面的抽獎紀錄。')
}


const createRestorePoint = (label = '目前設定') => {
  restorePointState.value = {
    label,
    createdAt: new Date().toLocaleString('zh-TW'),
    campaign: cloneByJson(campaign),
    prizes: cloneByJson(prizes.value),
    player: cloneByJson(player)
  }

  showSavedMessage('已建立還原點。')
}

const restoreFromRestorePoint = () => {
  if (!restorePointState.value) {
    showSavedMessage('尚未建立還原點。')
    return
  }

  const confirmed = window.confirm(`確定要復原到「${restorePointState.value.label}」嗎？`)

  if (!confirmed) return

  Object.assign(campaign, cloneByJson(restorePointState.value.campaign))
  prizes.value = cloneByJson(restorePointState.value.prizes)
  Object.assign(player, cloneByJson(restorePointState.value.player))

  updateChanceText()
  savePremiumWheelState()
  showSavedMessage(`已復原到 ${restorePointState.value.createdAt} 的還原點。`)
}

const resetAllPremiumWheelDefaults = () => {
  const confirmed = window.confirm('確定要還原全部預設設定嗎？目前後台設定、獎項與玩家次數會回到本檔預設值。')

  if (!confirmed) return

  Object.assign(campaign, cloneByJson(defaultCampaignSnapshot))
  prizes.value = cloneByJson(defaultPrizesSnapshot)
  Object.assign(player, cloneByJson(defaultPlayerSnapshot))
  drawLogs.value = []

  updateChanceText()
  savePremiumWheelState()
  showSavedMessage('已還原全部預設設定。')
}

onMounted(() => {
  if (getAuthToken()) {
    fetchShareRewardStatusFromServer()
  }

  loadPremiumWheelState()

  if (typeof window === 'undefined') return

  window.addEventListener('storage', handlePremiumWheelStorageSync)
})

onBeforeUnmount(() => {
  if (premiumWheelSaveTimer) {
    window.clearTimeout(premiumWheelSaveTimer)
    premiumWheelSaveTimer = null
  }
  stopPointerTickSound()
  if (typeof window === 'undefined') return

  window.removeEventListener('storage', handlePremiumWheelStorageSync)
})

watch(
  campaign,
  () => {
    updateChanceText()
    schedulePremiumWheelStateSave()
  },
  {
    deep: true
  }
)

watch(
  player,
  () => {
    updateChanceText()
    schedulePremiumWheelStateSave()
  },
  {
    deep: true
  }
)

watch(
  prizes,
  () => {
    schedulePremiumWheelStateSave()
  },
  {
    deep: true
  }
)
</script>

<template>
  <div
    class="premium-wheel-page min-h-screen overflow-x-hidden px-4 py-6 text-slate-900 sm:px-6 lg:px-8"
    :class="isAdminMode ? 'premium-wheel-admin-mode premium-wheel-admin-performance' : ''"
    :style="mergedPageThemeStyle"
  >
    <div
      v-if="campaign.enableLuxuryDots"
      class="premium-luxury-bg-dots pointer-events-none absolute inset-0"
    ></div>
    <div
      class="mx-auto grid max-w-7xl items-start gap-6 xl:grid-cols-[420px_1fr]"
      :class="isAdminMode ? 'premium-admin-layout-fixed-preview' : ''"
    >
      <aside
        v-if="isAdminMode"
        class="rounded-[32px] bg-white/95 p-5 shadow-2xl backdrop-blur"
      >
        <p class="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
          Admin Preview
        </p>

        <h1 class="mt-2 text-2xl font-black text-slate-900">
          精緻轉盤管理預覽
        </h1>

        <p class="mt-3 text-sm font-bold leading-7 text-slate-500">
          後台管理只出現在 <span class="font-black text-orange-600">?mode=admin</span>，客人前台會自動保持簡潔。
        </p>

        <div class="mt-4 rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-xs font-black leading-5 text-emerald-700">
          這裡可快速調整 LOGO、Banner、網站網址、獎項與轉盤機率。還原中心與快速導航已置頂，方便一開始就建立還原點與快速跳區。
        </div>

        <div class="mt-4 grid gap-4">
<div>
              <p class="text-sm font-black text-amber-900">
                還原 / 復原中心
              </p>

              <p class="mt-1 text-xs font-bold leading-5 text-amber-700">
                修改任何功能前可先建立還原點，調錯可快速復原。
              </p>
            </div>
<div>
              <p class="text-sm font-black text-slate-900">
                後台快速導航
              </p>

              <p class="mt-1 text-xs font-bold leading-5 text-slate-500">
                功能很多時，可直接跳到要調整的區塊；展開狀態會自動記住。
              </p>
            </div>
        </div>


        <button
          type="button"
          class="mt-4 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
          @click="syncPremiumWheelToPlayer"
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

        <div class="mt-4 grid gap-2 sm:grid-cols-2">
          <a
            :href="sourcePath"
            target="_blank"
            rel="noopener noreferrer"
            class="rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-orange-600"
          >
            開啟客人前台
          </a>

          <button
            type="button"
            class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
            @click="syncPremiumWheelToPlayer"
          >
            同步到玩家版
          </button>
        </div>

        <div class="mt-5 rounded-3xl border border-slate-100 bg-slate-50 p-4">
          <div class="flex items-center justify-between gap-3"
            data-admin-section="basic">
            <p class="text-sm font-black text-slate-900">
              ① 基本畫面設定
            </p>
              <button
                type="button"
                class="admin-section-toggle-button rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm transition hover:bg-slate-100"
                @click="toggleAdminSection('basic')"
              >
                {{ isAdminSectionOpen('basic') ? '收合' : '展開' }}
              </button>

            <button
              type="button"
              class="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm transition hover:bg-slate-100"
              @click="restoreBasicSettings"
            >
              還原此區
            </button>
          </div>

          <p class="mt-1 text-xs font-bold leading-5 text-slate-500">
            {{ adminSectionTips.basic }}
          </p>

          <div class="mt-4 grid gap-3"
              v-show="isAdminSectionOpen('basic')">
          <label class="grid gap-1 text-xs font-black text-slate-600">
            品牌名稱
            <input
              v-model="campaign.brandName"
              class="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
            />
          </label>

          <label class="grid gap-1 text-xs font-black text-slate-600">
            活動名稱
            <input
              v-model="campaign.pageTitle"
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
            活動標語
            <input
              v-model="campaign.heroTagline"
              class="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
            />
          </label>

          <label class="grid gap-1 text-xs font-black text-slate-600">
            LOGO 圖片網址
            <input
              v-model="campaign.logoImageUrl"
              placeholder="https://..."
              class="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
            />
          </label>

          <label class="grid gap-1 text-xs font-black text-slate-600">
            Banner 圖片網址
            <input
              v-model="campaign.bannerImageUrl"
              placeholder="https://..."
              class="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
            />
          </label>

          <label class="grid gap-1 text-xs font-black text-slate-600">
            網站連結
            <input
              v-model="campaign.websiteUrl"
              placeholder="example.com"
              class="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
            />
          </label>

          <div class="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
            <p class="text-xs font-black uppercase tracking-[0.18em] text-emerald-500">
              Rules
            </p>

            <div class="mt-1 flex items-center justify-between gap-3">
              <p class="text-sm font-black text-emerald-900">
                前台規則與獎品說明
              </p>

              <button
                type="button"
                class="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                @click="restoreRulePrizeInfoSettings"
              >
                還原此區
              </button>
            </div>

            <p class="mt-1 text-xs font-bold leading-5 text-emerald-700">
              客人前台會以收合區塊顯示，點開後看到以下內容。
            </p>

            <div class="mt-3 grid gap-3">
              <label class="grid gap-1 text-xs font-black text-emerald-800">
                活動規則標題
                <input
                  v-model="campaign.ruleTitle"
                  placeholder="活動規則"
                  class="rounded-2xl border border-emerald-200 px-4 py-3 text-sm outline-none focus:border-emerald-400"
                />
              </label>

              <label class="grid gap-1 text-xs font-black text-emerald-800">
                活動規則內容
                <textarea
                  v-model="campaign.ruleContent"
                  rows="5"
                  placeholder="每一行一條規則"
                  class="resize-none rounded-2xl border border-emerald-200 px-4 py-3 text-sm font-bold leading-6 outline-none focus:border-emerald-400"
                ></textarea>
              </label>

              <label class="grid gap-1 text-xs font-black text-emerald-800">
                獎品說明標題
                <input
                  v-model="campaign.prizeInfoTitle"
                  placeholder="獎品說明"
                  class="rounded-2xl border border-emerald-200 px-4 py-3 text-sm outline-none focus:border-emerald-400"
                />
              </label>

              <label class="grid gap-1 text-xs font-black text-emerald-800">
                獎品說明內容
                <textarea
                  v-model="campaign.prizeInfoContent"
                  rows="5"
                  placeholder="每一行一條獎品說明"
                  class="resize-none rounded-2xl border border-emerald-200 px-4 py-3 text-sm font-bold leading-6 outline-none focus:border-emerald-400"
                ></textarea>
              </label>
            </div>
          </div>

          <div class="rounded-3xl border border-amber-100 bg-amber-50 p-4">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="text-xs font-black uppercase tracking-[0.18em] text-amber-600">
                  Brand Frame
                </p>

                <div class="mt-1 flex items-center justify-between gap-3"
            data-admin-section="frame">
                  <p class="text-sm font-black text-amber-900">
                    品牌橫幅預設風格 / 底框顏色
                  </p>
              <button
                type="button"
                class="admin-section-toggle-button rounded-full bg-white px-3 py-1 text-xs font-black text-amber-700 shadow-sm transition hover:bg-slate-100"
                @click="toggleAdminSection('frame')"
              >
                {{ isAdminSectionOpen('frame') ? '收合' : '展開' }}
              </button>

                  <button
                    type="button"
                    class="rounded-full bg-white px-3 py-1 text-xs font-black text-amber-700 shadow-sm transition hover:bg-amber-100"
                    @click="restoreFrameThemeSettings"
                  >
                    還原此區
                  </button>
                </div>

                <p class="mt-1 text-xs font-bold leading-5 text-amber-700">
                  一鍵套用常用品牌視覺，之後仍可自行修改 LOGO、Banner 與底框顏色。
                </p>
              </div>

              <span class="rounded-full bg-white px-3 py-1 text-xs font-black text-amber-700 shadow-sm">
                快速套版
              </span>
            </div>

            <div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
              v-show="isAdminSectionOpen('frame')">
              <button
                v-for="preset in brandFramePresets"
                :key="preset.key"
                type="button"
                class="relative rounded-3xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                :class="campaign.brandPreset === preset.key ? 'border-emerald-200 ring-2 ring-emerald-100' : 'border-amber-100'"
                @click="applyBrandFramePreset(preset)"
              >
                <span
                  v-if="preset.recommended"
                  class="absolute right-3 top-3 rounded-full bg-rose-50 px-2 py-1 text-[10px] font-black text-rose-600"
                >
                  推薦
                </span>

                <div class="text-3xl">
                  {{ preset.icon }}
                </div>

                <p class="mt-3 text-sm font-black text-slate-900">
                  {{ preset.name }}
                </p>

                <p class="mt-2 text-xs font-bold leading-5 text-slate-500">
                  {{ preset.description }}
                </p>

                <div class="mt-4 flex gap-1">
                  <span
                    v-for="color in preset.colors"
                    :key="color"
                    class="h-6 flex-1 rounded-full"
                    :style="{ backgroundColor: color }"
                  ></span>
                </div>

                <p
                  v-if="campaign.brandPreset === preset.key"
                  class="mt-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700"
                >
                  已套用
                </p>
              </button>
            </div>

            <div class="mt-4 grid gap-3 sm:grid-cols-3">
              <label class="grid gap-1 rounded-3xl bg-white p-4 text-xs font-black text-amber-800 shadow-sm">
                上方底框色
                <input
                  v-model="campaign.frameTopColor"
                  type="color"
                  class="h-12 rounded-2xl border border-amber-200 bg-white px-2 py-1"
                />
                <span class="text-[11px] font-bold text-slate-400">
                  控制活動頁面上半部主色
                </span>
              </label>

              <label class="grid gap-1 rounded-3xl bg-white p-4 text-xs font-black text-amber-800 shadow-sm">
                中段底框色
                <input
                  v-model="campaign.frameMiddleColor"
                  type="color"
                  class="h-12 rounded-2xl border border-amber-200 bg-white px-2 py-1"
                />
                <span class="text-[11px] font-bold text-slate-400">
                  控制活動頁面中段過渡色
                </span>
              </label>

              <label class="grid gap-1 rounded-3xl bg-white p-4 text-xs font-black text-amber-800 shadow-sm">
                底部底框色
                <input
                  v-model="campaign.frameBottomColor"
                  type="color"
                  class="h-12 rounded-2xl border border-amber-200 bg-white px-2 py-1"
                />
                <span class="text-[11px] font-bold text-slate-400">
                  控制活動頁面底部主色
                </span>
              </label>
            </div>

            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <label class="grid gap-1 rounded-3xl bg-white p-4 text-xs font-black text-amber-800 shadow-sm">
                底框外框色
                <input
                  v-model="campaign.frameBorderColor"
                  type="color"
                  class="h-12 rounded-2xl border border-amber-200 bg-white px-2 py-1"
                />
              </label>

              <label class="grid gap-1 rounded-3xl bg-white p-4 text-xs font-black text-amber-800 shadow-sm">
                高光點綴色
                <input
                  v-model="campaign.frameHighlightColor"
                  type="color"
                  class="h-12 rounded-2xl border border-amber-200 bg-white px-2 py-1"
                />
              </label>
            </div>

            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <div class="rounded-3xl bg-white p-4 shadow-sm">
                <p class="text-sm font-black text-slate-900">
                  三段主色預覽
                </p>

                <div class="mt-4 flex h-28 overflow-hidden rounded-3xl">
                  <div
                    class="flex-1"
                    :style="{ backgroundColor: campaign.frameTopColor }"
                  ></div>
                  <div
                    class="flex-1"
                    :style="{ backgroundColor: campaign.frameMiddleColor }"
                  ></div>
                  <div
                    class="flex-1"
                    :style="{ backgroundColor: campaign.frameBottomColor }"
                  ></div>
                </div>
              </div>

              <div class="rounded-3xl bg-white p-4 shadow-sm">
                <p class="text-sm font-black text-slate-900">
                  玩家頁底框預覽
                </p>

                <div
                  class="mt-4 flex h-28 items-center justify-center rounded-3xl text-sm font-black text-white shadow-inner"
                  :style="{
                    background: `linear-gradient(180deg, ${campaign.frameTopColor}, ${campaign.frameMiddleColor} 48%, ${campaign.frameBottomColor})`,
                    border: `3px solid ${campaign.frameBorderColor}`
                  }"
                >
                  玩家頁背景效果
                </div>

                <p class="mt-3 text-xs font-bold leading-5 text-slate-400">
                  目前主色會套用到底框、外框與主要活動卡片。
                </p>
              </div>
            </div>
          </div>

          <div class="rounded-3xl border border-fuchsia-100 bg-fuchsia-50 p-4">
            <p class="text-xs font-black uppercase tracking-[0.18em] text-fuchsia-500">
              Theme
            </p>

            <div class="mt-1 flex items-center justify-between gap-3"
            data-admin-section="theme">
              <p class="text-sm font-black text-fuchsia-900">
                整體遊戲主題設定
              </p>
              <button
                type="button"
                class="admin-section-toggle-button rounded-full bg-white px-3 py-1 text-xs font-black text-fuchsia-700 shadow-sm transition hover:bg-slate-100"
                @click="toggleAdminSection('theme')"
              >
                {{ isAdminSectionOpen('theme') ? '收合' : '展開' }}
              </button>

              <button
                type="button"
                class="rounded-full bg-white px-3 py-1 text-xs font-black text-fuchsia-700 shadow-sm transition hover:bg-fuchsia-100"
                @click="restoreGameThemeSettings"
              >
                還原此區
              </button>
            </div>

            <p class="mt-1 text-xs font-bold leading-5 text-fuchsia-700">
              可調整整體遊戲背景、按鈕、卡片與華麗光暈，讓活動視覺更精緻。
            </p>

            <div class="mt-4 grid gap-3"
              v-show="isAdminSectionOpen('theme')">
              <div class="grid gap-3 sm:grid-cols-2">
                <label class="grid gap-1 text-xs font-black text-fuchsia-800">
                  主背景色 1
                  <input
                    v-model="campaign.themeBgFrom"
                    type="color"
                    class="h-12 rounded-2xl border border-fuchsia-200 bg-white px-2 py-1"
                  />
                </label>

                <label class="grid gap-1 text-xs font-black text-fuchsia-800">
                  主背景色 2
                  <input
                    v-model="campaign.themeBgTo"
                    type="color"
                    class="h-12 rounded-2xl border border-fuchsia-200 bg-white px-2 py-1"
                  />
                </label>
              </div>

              <div class="grid gap-3 sm:grid-cols-3">
                <label class="grid gap-1 text-xs font-black text-fuchsia-800">
                  卡片底色
                  <input
                    v-model="campaign.themePanelColor"
                    type="color"
                    class="h-12 rounded-2xl border border-fuchsia-200 bg-white px-2 py-1"
                  />
                </label>

                <label class="grid gap-1 text-xs font-black text-fuchsia-800">
                  重點文字色
                  <input
                    v-model="campaign.themeTextColor"
                    type="color"
                    class="h-12 rounded-2xl border border-fuchsia-200 bg-white px-2 py-1"
                  />
                </label>

                <label class="grid gap-1 text-xs font-black text-fuchsia-800">
                  點綴色
                  <input
                    v-model="campaign.themeAccentColor"
                    type="color"
                    class="h-12 rounded-2xl border border-fuchsia-200 bg-white px-2 py-1"
                  />
                </label>
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <label class="grid gap-1 text-xs font-black text-fuchsia-800">
                  按鈕主色
                  <input
                    v-model="campaign.themeButtonColor"
                    type="color"
                    class="h-12 rounded-2xl border border-fuchsia-200 bg-white px-2 py-1"
                  />
                </label>

                <label class="grid gap-1 text-xs font-black text-fuchsia-800">
                  按鈕深色
                  <input
                    v-model="campaign.themeButtonDarkColor"
                    type="color"
                    class="h-12 rounded-2xl border border-fuchsia-200 bg-white px-2 py-1"
                  />
                </label>
              </div>

              <label class="grid gap-1 text-xs font-black text-fuchsia-800">
                光暈強度 0-100
                <input
                  v-model.number="campaign.themeGlowLevel"
                  type="range"
                  min="0"
                  max="100"
                  class="accent-fuchsia-500"
                />
                <span class="text-xs text-fuchsia-600">
                  目前：{{ normalizedThemeGlowLevel }}
                </span>
              </label>

              <div class="grid gap-2 sm:grid-cols-2">
                <label class="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-xs font-black text-fuchsia-800 shadow-sm">
                  <input
                    v-model="campaign.enableLuxuryDots"
                    type="checkbox"
                    class="h-4 w-4"
                  />
                  開啟華麗光點背景
                </label>

                <label class="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-xs font-black text-fuchsia-800 shadow-sm">
                  <input
                    v-model="campaign.enableGlassCards"
                    type="checkbox"
                    class="h-4 w-4"
                  />
                  開啟玻璃質感卡片
                </label>
              </div>

              <div
                class="rounded-3xl p-4 text-center shadow-sm"
                :style="{
                  background: `linear-gradient(135deg, ${campaign.themeBgFrom}, ${campaign.themeBgTo})`,
                  color: campaign.themeTextColor
                }"
              >
                <p class="text-sm font-black">
                  主題預覽
                </p>

                <p class="mt-1 text-xs font-bold opacity-80">
                  背景、卡片與按鈕色會即時套用到前台遊戲畫面。
                </p>

                <div
                  class="mx-auto mt-3 inline-flex rounded-full px-4 py-2 text-xs font-black text-white shadow-lg"
                  :style="{
                    background: `linear-gradient(135deg, ${campaign.themeButtonColor}, ${campaign.themeButtonDarkColor})`
                  }"
                >
                  按鈕預覽
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-3xl border border-slate-100 bg-slate-50 p-4">
            <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Pointer
            </p>

            <div class="mt-1 flex items-center justify-between gap-3"
            data-admin-section="pointer">
              <p class="text-sm font-black text-slate-900">
                轉盤指針設定
              </p>
              <button
                type="button"
                class="admin-section-toggle-button rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm transition hover:bg-slate-100"
                @click="toggleAdminSection('pointer')"
              >
                {{ isAdminSectionOpen('pointer') ? '收合' : '展開' }}
              </button>

              <button
                type="button"
                class="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm transition hover:bg-slate-100"
                @click="restorePointerSettings"
              >
                還原此區
              </button>
            </div>

            <p class="mt-1 text-xs font-bold leading-5 text-slate-600">
              可調整指針大小、顏色與旋轉時尖端左右抖動，讓指針更像實體轉盤卡點。
            </p>

            <div class="mt-4 grid gap-3"
              v-show="isAdminSectionOpen('pointer')">
              <div>
                <p class="text-xs font-black text-slate-700">
                  指針樣式一鍵套用
                </p>

                <div class="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                  <button
                    v-for="preset in wheelPointerPresets"
                    :key="preset.key"
                    type="button"
                    class="rounded-3xl border bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    :class="campaign.wheelPointerPreset === preset.key ? 'border-emerald-200 ring-2 ring-emerald-100' : 'border-slate-100'"
                    @click="applyWheelPointerPreset(preset)"
                  >
                    <p class="text-xs font-black text-slate-900">
                      {{ preset.name }}
                    </p>

                    <p class="mt-1 min-h-[34px] text-[11px] font-bold leading-4 text-slate-400">
                      {{ preset.description }}
                    </p>

                    <div class="mt-3 flex gap-1">
                      <span
                        v-for="color in preset.colors"
                        :key="color"
                        class="h-5 flex-1 rounded-full"
                        :style="{ backgroundColor: color }"
                      ></span>
                    </div>

                    <p
                      v-if="campaign.wheelPointerPreset === preset.key"
                      class="mt-2 inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700"
                    >
                      已套用
                    </p>
                  </button>
                </div>
              </div>

              <label class="grid gap-1 text-xs font-black text-slate-700">
                指針大小 60-160
                <input
                  v-model.number="campaign.wheelPointerScale"
                  type="range"
                  min="60"
                  max="160"
                  class="accent-slate-700"
                />
                <span class="text-xs text-slate-500">
                  目前：{{ normalizedWheelPointerScale }}%
                </span>
              </label>

              <div class="grid gap-3 sm:grid-cols-2">
                <label class="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-xs font-black text-slate-700 shadow-sm">
                  <input
                    v-model="campaign.enablePointerTipShake"
                    type="checkbox"
                    class="h-4 w-4"
                  />
                  旋轉時指針尖端左右抖動
                </label>

                <label class="grid gap-1 rounded-2xl bg-white px-4 py-3 text-xs font-black text-slate-700 shadow-sm">
                  抖動速度 30-140
                  <input
                    v-model.number="campaign.pointerTipShakeSpeed"
                    type="range"
                    min="30"
                    max="140"
                    class="accent-slate-700"
                  />
                  <span class="text-xs text-slate-500">
                    目前：{{ normalizedPointerTipShakeSpeed }}ms
                  </span>
                </label>
              </div>

              <div class="grid gap-3 sm:grid-cols-3">
                <label class="grid gap-1 text-xs font-black text-slate-700">
                  指針上方顏色
                  <input
                    v-model="campaign.wheelPointerTopColor"
                    type="color"
                    class="h-12 rounded-2xl border border-slate-200 bg-white px-2 py-1"
                  />
                </label>

                <label class="grid gap-1 text-xs font-black text-slate-700">
                  指針箭頭顏色
                  <input
                    v-model="campaign.wheelPointerArrowColor"
                    type="color"
                    class="h-12 rounded-2xl border border-slate-200 bg-white px-2 py-1"
                  />
                </label>

                <label class="grid gap-1 text-xs font-black text-slate-700">
                  指針圓點顏色
                  <input
                    v-model="campaign.wheelPointerDotColor"
                    type="color"
                    class="h-12 rounded-2xl border border-slate-200 bg-white px-2 py-1"
                  />
                </label>
              </div>

              <div class="rounded-3xl bg-white p-4 text-center shadow-sm">
                <p class="text-xs font-black text-slate-600">
                  指針預覽
                </p>

                <div class="mt-4 flex justify-center">
                  <div
                    class="premium-wheel-pointer-preview relative"
                    :style="wheelPointerStyle"
                  >
                    <div class="premium-wheel-pointer-head mx-auto h-7 w-9 rounded-t-2xl shadow-xl"></div>
                    <div class="premium-wheel-pointer-arrow mx-auto h-0 w-0 border-l-[20px] border-r-[20px] border-t-[36px] border-l-transparent border-r-transparent"></div>
                    <div class="premium-wheel-pointer-highlight pointer-events-none absolute left-1/2 top-2 h-10 w-3 -translate-x-1/2 rounded-full"></div>
                    <div class="premium-wheel-pointer-dot absolute left-1/2 top-3 h-3 w-3 -translate-x-1/2 rounded-full shadow-inner"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-3xl border border-violet-100 bg-violet-50 p-4">
            <p class="text-xs font-black uppercase tracking-[0.18em] text-violet-500">
              Wheel Center
            </p>

            <div class="mt-1 flex items-center justify-between gap-3"
            data-admin-section="center">
              <p class="text-sm font-black text-violet-900">
                轉盤中心按鈕設定
              </p>
              <button
                type="button"
                class="admin-section-toggle-button rounded-full bg-white px-3 py-1 text-xs font-black text-violet-700 shadow-sm transition hover:bg-slate-100"
                @click="toggleAdminSection('center')"
              >
                {{ isAdminSectionOpen('center') ? '收合' : '展開' }}
              </button>

              <button
                type="button"
                class="rounded-full bg-white px-3 py-1 text-xs font-black text-violet-700 shadow-sm transition hover:bg-violet-100"
                @click="restoreWheelCenterSettings"
              >
                還原此區
              </button>
            </div>

            <p class="mt-1 text-xs font-bold leading-5 text-violet-700">
              可調整紅框位置的中心按鈕大小、文字大小、顏色與外框。
            </p>

            <div class="mt-4 grid gap-3"
              v-show="isAdminSectionOpen('center')">
              <label class="grid gap-1 text-xs font-black text-violet-800">
                中心文字
                <input
                  v-model="campaign.wheelCenterText"
                  placeholder="SPIN"
                  class="rounded-2xl border border-violet-200 px-4 py-3 text-sm outline-none focus:border-violet-400"
                />
              </label>

              <div class="grid gap-3 sm:grid-cols-3">
                <label class="grid gap-1 text-xs font-black text-violet-800">
                  按鈕大小 58-130
                  <input
                    v-model.number="campaign.wheelCenterSize"
                    type="number"
                    min="58"
                    max="130"
                    class="rounded-2xl border border-violet-200 px-4 py-3 text-sm outline-none focus:border-violet-400"
                  />
                </label>

                <label class="grid gap-1 text-xs font-black text-violet-800">
                  文字大小 10-34
                  <input
                    v-model.number="campaign.wheelCenterTextSize"
                    type="number"
                    min="10"
                    max="34"
                    class="rounded-2xl border border-violet-200 px-4 py-3 text-sm outline-none focus:border-violet-400"
                  />
                </label>

                <label class="grid gap-1 text-xs font-black text-violet-800">
                  外框粗細 0-12
                  <input
                    v-model.number="campaign.wheelCenterBorderWidth"
                    type="number"
                    min="0"
                    max="12"
                    class="rounded-2xl border border-violet-200 px-4 py-3 text-sm outline-none focus:border-violet-400"
                  />
                </label>
              </div>

              <div class="grid gap-3 sm:grid-cols-3">
                <label class="grid gap-1 text-xs font-black text-violet-800">
                  背景色
                  <input
                    v-model="campaign.wheelCenterBgColor"
                    type="color"
                    class="h-12 rounded-2xl border border-violet-200 bg-white px-2 py-1"
                  />
                </label>

                <label class="grid gap-1 text-xs font-black text-violet-800">
                  文字顏色
                  <input
                    v-model="campaign.wheelCenterTextColor"
                    type="color"
                    class="h-12 rounded-2xl border border-violet-200 bg-white px-2 py-1"
                  />
                </label>

                <label class="grid gap-1 text-xs font-black text-violet-800">
                  外框顏色
                  <input
                    v-model="campaign.wheelCenterBorderColor"
                    type="color"
                    class="h-12 rounded-2xl border border-violet-200 bg-white px-2 py-1"
                  />
                </label>
              </div>

              <div class="rounded-3xl bg-white p-4 text-center shadow-sm">
                <p class="text-xs font-black text-violet-700">
                  中心按鈕預覽
                </p>

                <div class="mt-3 flex justify-center">
                  <div
                    class="flex items-center justify-center rounded-full border font-black shadow-xl"
                    :style="wheelCenterButtonStyle"
                  >
                    {{ campaign.wheelCenterText || 'SPIN' }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-3xl border border-sky-100 bg-sky-50 p-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="text-xs font-black uppercase tracking-[0.18em] text-sky-500">
                  Share
                </p>

                <div class="mt-1 flex items-center justify-between gap-3"
            data-admin-section="share">
                  <p class="text-base font-black text-sky-900">
                    分享活動設定
                  </p>
              <button
                type="button"
                class="admin-section-toggle-button rounded-full bg-white px-3 py-1 text-xs font-black text-sky-700 shadow-sm transition hover:bg-slate-100"
                @click="toggleAdminSection('share')"
              >
                {{ isAdminSectionOpen('share') ? '收合' : '展開' }}
              </button>

                  <button
                    type="button"
                    class="rounded-full bg-white px-3 py-1 text-xs font-black text-sky-700 shadow-sm transition hover:bg-sky-100"
                    @click="restoreShareSettings"
                  >
                    還原此區
                  </button>
                </div>

                <p class="mt-1 text-xs font-bold leading-5 text-sky-700">
                  可自訂客人分享活動時看到的標題、描述、圖片與官方網站按鈕。
                </p>
              </div>

              <span class="rounded-full bg-white px-3 py-1 text-xs font-black text-sky-700 shadow-sm">
                前台分享卡片
              </span>
            </div>

            <div class="mt-4 grid gap-4"
              v-show="isAdminSectionOpen('share')">
              <div class="rounded-3xl bg-white/80 p-4 shadow-sm">
                <p class="text-sm font-black text-sky-900">
                  ① 分享文字
                </p>

                <div class="mt-3 grid gap-3">
                  <label class="grid gap-1 text-xs font-black text-sky-800">
                    分享標題
                    <input
                      v-model="campaign.shareTitle"
                      placeholder="例如：幸運大轉盤，快來抽好禮"
                      class="rounded-2xl border border-sky-200 px-4 py-3 text-base font-black outline-none focus:border-sky-400"
                    />
                  </label>

                  <label class="grid gap-1 text-xs font-black text-sky-800">
                    分享描述
                    <textarea
                      v-model="campaign.shareDescription"
                      rows="4"
                      placeholder="例如：每日登入可抽一次，分享活動還能增加轉盤機會。"
                      class="resize-none rounded-2xl border border-sky-200 px-4 py-3 text-base font-bold leading-7 outline-none focus:border-sky-400"
                    ></textarea>
                  </label>
                </div>
              </div>

              <div class="rounded-3xl bg-white/80 p-4 shadow-sm">
                <p class="text-sm font-black text-sky-900">
                  ② 分享圖片與連結
                </p>

                <div class="mt-3 grid gap-3">
                  <label class="grid gap-1 text-xs font-black text-sky-800">
                    分享圖片網址
                    <input
                      v-model="campaign.shareImageUrl"
                      placeholder="https://example.com/share-cover.png"
                      class="rounded-2xl border border-sky-200 px-4 py-3 text-sm outline-none focus:border-sky-400"
                    />
                  </label>

                  <div
                    v-if="getCustomShareImageUrl()"
                    class="overflow-hidden rounded-3xl border border-sky-100 bg-white p-2"
                  >
                    <img
                      :src="getCustomShareImageUrl()"
                      alt="分享圖片預覽"
                      class="h-44 w-full rounded-2xl object-cover"
                    />
                  </div>

                  <label class="grid gap-1 text-xs font-black text-sky-800">
                    分享按鈕文字
                    <input
                      v-model="campaign.shareButtonText"
                      placeholder="分享增加機會"
                      class="rounded-2xl border border-sky-200 px-4 py-3 text-sm outline-none focus:border-sky-400"
                    />
                  </label>

                  <div class="rounded-2xl border border-sky-100 bg-sky-50 p-3">
                    <div class="flex items-center justify-between gap-3">
                      <p class="text-xs font-black text-sky-900">
                        分享增加機會防作弊設定
                      </p>

                      <button
                        type="button"
                        class="rounded-full bg-white px-3 py-1 text-[11px] font-black text-sky-700 shadow-sm transition hover:bg-sky-100"
                        @click="restoreShareRewardSettings"
                      >
                        還原
                      </button>
                    </div>

                    <div class="mt-3 grid gap-3 sm:grid-cols-2">
                      <label class="flex items-center gap-2 text-xs font-black text-sky-800 sm:col-span-2">
                        <input
                          v-model="campaign.enableShareReward"
                          type="checkbox"
                          class="h-4 w-4 rounded border-sky-300"
                        />
                        開啟分享增加機會
                      </label>

                      <label class="grid gap-1 text-xs font-black text-sky-800">
                        每日可領次數
                        <input
                          v-model.number="campaign.shareRewardDailyLimit"
                          type="number"
                          min="0"
                          max="20"
                          class="rounded-2xl border border-sky-200 px-4 py-3 text-sm outline-none focus:border-sky-400"
                        />
                      </label>

                      <label class="grid gap-1 text-xs font-black text-sky-800">
                        冷卻秒數
                        <input
                          v-model.number="campaign.shareRewardCooldownSeconds"
                          type="number"
                          min="0"
                          max="3600"
                          class="rounded-2xl border border-sky-200 px-4 py-3 text-sm outline-none focus:border-sky-400"
                        />
                      </label>
                    </div>

                    <p class="mt-3 rounded-2xl bg-white px-3 py-2 text-xs font-bold leading-5 text-sky-700">
                      目前玩家今日剩餘 {{ shareRewardRemainingToday }} 次；冷卻 {{ shareRewardCooldownRemaining }} 秒。
                    </p>
                  </div>

                  <div class="rounded-2xl border border-indigo-100 bg-indigo-50 p-3">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p class="text-xs font-black text-indigo-900">
                          後台分享防作弊狀態
                        </p>

                        <p class="mt-1 text-xs font-bold leading-5 text-indigo-700">
                          可查看目前玩家今日分享獎勵狀態，也可直接呼叫後端重置或清除冷卻。
                        </p>
                      </div>

                      <span
                        class="rounded-full px-3 py-1 text-xs font-black"
                        :class="shareRewardAdminStatus.enabled
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                        "
                      >
                        {{ shareRewardAdminStatus.enabled ? '已開啟' : '未開啟' }}
                      </span>
                    </div>

                    <div class="mt-3 grid grid-cols-2 gap-2">
                      <div class="rounded-2xl bg-white p-3 text-center shadow-sm">
                        <p class="text-xl font-black text-indigo-900">
                          {{ shareRewardAdminStatus.usedCount }}
                        </p>

                        <p class="mt-1 text-[11px] font-black text-slate-400">
                          今日已領
                        </p>
                      </div>

                      <div class="rounded-2xl bg-white p-3 text-center shadow-sm">
                        <p class="text-xl font-black text-emerald-700">
                          {{ shareRewardAdminStatus.remainingCount }}
                        </p>

                        <p class="mt-1 text-[11px] font-black text-slate-400">
                          今日剩餘
                        </p>
                      </div>

                      <div class="rounded-2xl bg-white p-3 text-center shadow-sm">
                        <p class="text-xl font-black text-orange-700">
                          {{ shareRewardAdminStatus.cooldownRemaining }}
                        </p>

                        <p class="mt-1 text-[11px] font-black text-slate-400">
                          冷卻秒數
                        </p>
                      </div>

                      <div class="rounded-2xl bg-white p-3 text-center shadow-sm">
                        <p class="text-xs font-black leading-5 text-slate-700">
                          {{ shareRewardAdminStatus.lastRewardAt }}
                        </p>

                        <p class="mt-1 text-[11px] font-black text-slate-400">
                          最後領取
                        </p>
                      </div>
                    </div>

                    <div class="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      <button
                        type="button"
                        class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-indigo-700 shadow-sm transition hover:bg-indigo-100"
                        :disabled="isShareRewardStatusLoading"
                        @click="resetShareRewardToday"
                      >
                        {{ isShareRewardStatusLoading ? '處理中' : '重置今日' }}
                      </button>

                      <button
                        type="button"
                        class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-orange-700 shadow-sm transition hover:bg-orange-100"
                        :disabled="isShareRewardStatusLoading"
                        @click="clearShareRewardCooldown"
                      >
                        {{ isShareRewardStatusLoading ? '處理中' : '清除冷卻' }}
                      </button>

                      <button
                        type="button"
                        class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-sky-700 shadow-sm transition hover:bg-sky-100"
                        :disabled="isShareRewardStatusLoading"
                        @click="fetchShareRewardStatusFromServer"
                      >
                        {{ isShareRewardStatusLoading ? '同步中' : '同步後端' }}
                      </button>

                      <button
                        type="button"
                        class="rounded-2xl bg-slate-900 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-slate-700"
                        @click="exportShareRewardStatus"
                      >
                        匯出狀態
                      </button>
                    </div>
                  </div>

                  <div class="rounded-2xl border border-slate-100 bg-white p-3">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <p class="text-xs font-black text-slate-900">
                        分享 API 診斷
                      </p>

                      <span
                        class="rounded-full px-3 py-1 text-xs font-black"
                        :class="shareRewardApiDiagnostic.status === '成功'
                          ? 'bg-emerald-100 text-emerald-700'
                          : shareRewardApiDiagnostic.status === '失敗'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-slate-100 text-slate-500'
                        "
                      >
                        {{ shareRewardApiDiagnostic.status }}
                      </span>
                    </div>

                    <div class="mt-3 grid gap-2 text-xs font-bold leading-5 text-slate-600">
                      <p class="break-all">
                        API：{{ shareRewardApiDiagnostic.apiBaseUrl || getApiBaseUrl() }}
                      </p>

                      <p>
                        Token：{{ shareRewardApiDiagnostic.hasToken ? '已偵測到' : '尚未偵測到' }}
                      </p>

                        <p>
                          Token Key：{{ shareRewardApiDiagnostic.tokenKey || getAuthTokenKey() }}
                        </p>

                      <p>
                        訊息：{{ shareRewardApiDiagnostic.message }}
                      </p>

                      <p v-if="shareRewardApiDiagnostic.testedAt">
                        測試時間：{{ shareRewardApiDiagnostic.testedAt }}
                      </p>
                    </div>

                    <button
                      type="button"
                      class="mt-3 w-full rounded-2xl bg-sky-600 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-sky-700"
                      @click="testShareRewardApiConnection"
                    >
                      測試分享 API
                    </button>
                  </div>

                  <p class="rounded-2xl bg-sky-100 px-4 py-3 text-xs font-bold leading-5 text-sky-700">
                    官方網站小按鈕會使用上方「網站連結」欄位；有填網站連結時，前台會自動顯示。正式防作弊建議再接後端會員驗證。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-3xl border border-amber-100 bg-amber-50 p-4">
            <p class="text-xs font-black uppercase tracking-[0.18em] text-amber-500">
              Effects
            </p>

            <div class="mt-1 flex items-center justify-between gap-3"
            data-admin-section="effects">
              <p class="text-sm font-black text-amber-900">
                音效與特效設定
              </p>
              <button
                type="button"
                class="admin-section-toggle-button rounded-full bg-white px-3 py-1 text-xs font-black text-amber-700 shadow-sm transition hover:bg-slate-100"
                @click="toggleAdminSection('effects')"
              >
                {{ isAdminSectionOpen('effects') ? '收合' : '展開' }}
              </button>

              <button
                type="button"
                class="rounded-full bg-white px-3 py-1 text-xs font-black text-amber-700 shadow-sm transition hover:bg-amber-100"
                @click="restoreEffectSettings"
              >
                還原此區
              </button>
            </div>

            <p class="mt-1 text-xs font-bold leading-5 text-amber-700">
              中獎後可顯示彩帶、金沙、閃光、金色光暈與播放音樂；轉盤轉動時也可播放自訂音效，並可在後台直接測試 / 停止音效。
            </p>

            <div class="mt-3 grid gap-2"
              v-show="isAdminSectionOpen('effects')">
              <label class="flex items-center gap-2 text-xs font-black text-amber-800">
                <input
                  v-model="campaign.enableWinConfetti"
                  type="checkbox"
                  class="h-4 w-4 rounded border-amber-300"
                />
                開啟中獎彩帶
              </label>

              <label class="flex items-center gap-2 text-xs font-black text-amber-800">
                <input
                  v-model="campaign.enableGoldRain"
                  type="checkbox"
                  class="h-4 w-4 rounded border-amber-300"
                />
                開啟金沙粒子
              </label>

              <label class="flex items-center gap-2 text-xs font-black text-amber-800">
                <input
                  v-model="campaign.enableWinSound"
                  type="checkbox"
                  class="h-4 w-4 rounded border-amber-300"
                />
                開啟中獎音樂
              </label>

              <label class="grid gap-1 text-xs font-black text-amber-800">
                中獎音樂網址
                <input
                  v-model="campaign.winSoundUrl"
                  placeholder="https://example.com/win.mp3"
                  class="rounded-2xl border border-amber-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                />
              </label>

              <div class="grid gap-2 rounded-2xl bg-white/70 p-3">
                <p class="text-xs font-black text-amber-900">
                  一鍵套用特效風格
                </p>

                <div class="grid gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-amber-700 shadow-sm transition hover:bg-amber-100"
                    @click="applyWinEffectPreset('elegant')"
                  >
                    低調質感
                  </button>

                  <button
                    type="button"
                    class="rounded-2xl bg-amber-600 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-amber-700"
                    @click="applyWinEffectPreset('luxury')"
                  >
                    豪華高級
                  </button>

                  <button
                    type="button"
                    class="rounded-2xl bg-rose-500 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-rose-600"
                    @click="applyWinEffectPreset('party')"
                  >
                    熱鬧派對
                  </button>
                </div>

                <div class="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    class="rounded-2xl border border-amber-200 bg-white px-3 py-2 text-xs font-black text-amber-700 shadow-sm transition hover:bg-amber-100"
                    @click="exportWinEffectSettings"
                  >
                    匯出特效設定
                  </button>

                  <button
                    type="button"
                    class="rounded-2xl border border-amber-200 bg-white px-3 py-2 text-xs font-black text-amber-700 shadow-sm transition hover:bg-amber-100"
                    @click="openWinEffectImport"
                  >
                    匯入特效設定
                  </button>
                </div>

                <input
                  ref="effectImportInput"
                  type="file"
                  accept="application/json,.json"
                  class="hidden"
                  @change="importWinEffectSettings"
                />
              </div>

              <div class="grid gap-2 rounded-2xl bg-white/70 p-3">
                <label class="flex items-center gap-2 text-xs font-black text-amber-800">
                  <input
                    v-model="campaign.enableWinFlash"
                    type="checkbox"
                    class="h-4 w-4 rounded border-amber-300"
                  />
                  開啟中獎閃光爆發
                </label>

                <label class="flex items-center gap-2 text-xs font-black text-amber-800">
                  <input
                    v-model="campaign.enablePrizeBounce"
                    type="checkbox"
                    class="h-4 w-4 rounded border-amber-300"
                  />
                  開啟獎項放大跳動
                </label>

                <label class="flex items-center gap-2 text-xs font-black text-amber-800">
                  <input
                    v-model="campaign.enableGoldenAura"
                    type="checkbox"
                    class="h-4 w-4 rounded border-amber-300"
                  />
                  開啟金色光暈
                </label>
              </div>

              <div class="grid gap-2 sm:grid-cols-2">
                <label class="grid gap-1 text-xs font-black text-amber-800">
                  彩帶數量
                  <input
                    v-model.number="campaign.confettiCount"
                    type="number"
                    min="0"
                    max="120"
                    class="rounded-2xl border border-amber-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                  />
                </label>

                <label class="grid gap-1 text-xs font-black text-amber-800">
                  金沙數量
                  <input
                    v-model.number="campaign.goldRainCount"
                    type="number"
                    min="0"
                    max="120"
                    class="rounded-2xl border border-amber-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                  />
                </label>

                <label class="grid gap-1 text-xs font-black text-amber-800">
                  特效秒數
                  <input
                    v-model.number="campaign.winEffectDuration"
                    type="number"
                    min="2"
                    max="10"
                    class="rounded-2xl border border-amber-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                  />
                </label>

                <label class="grid gap-1 text-xs font-black text-amber-800">
                  音樂音量 0-100
                  <input
                    v-model.number="campaign.winSoundVolume"
                    type="number"
                    min="0"
                    max="100"
                    class="rounded-2xl border border-amber-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                  />
                </label>
              </div>

              <div class="rounded-2xl bg-white/70 px-4 py-3 text-xs font-black leading-5 text-amber-700">
                目前設定：彩帶 {{ normalizedConfettiCount }} 片、金沙 {{ normalizedGoldRainCount }} 顆、特效 {{ normalizedEffectDuration }} 秒、中獎音量 {{ normalizedWinSoundVolume }}%。
              </div>

              <div class="rounded-2xl bg-white/70 p-3">
                <p class="text-xs font-black text-amber-900">
                  轉盤轉動音效設定
                </p>

                <label class="mt-2 flex items-center gap-2 text-xs font-black text-amber-800">
                  <input
                    v-model="campaign.enableSpinSound"
                    type="checkbox"
                    class="h-4 w-4 rounded border-amber-300"
                  />
                  開啟轉盤轉動音效
                </label>

                <label class="mt-2 grid gap-1 text-xs font-black text-amber-800">
                  轉動音效網址
                  <input
                    v-model="campaign.spinSoundUrl"
                    placeholder="https://example.com/spin.mp3"
                    class="rounded-2xl border border-amber-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                  />
                </label>

                <label class="mt-2 grid gap-1 text-xs font-black text-amber-800">
                  轉動音效音量 0-100
                  <input
                    v-model.number="campaign.spinSoundVolume"
                    type="number"
                    min="0"
                    max="100"
                    class="rounded-2xl border border-amber-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                  />
                </label>

                <div class="mt-3 grid gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-amber-700 shadow-sm transition hover:bg-amber-100"
                    @click="testSpinSound"
                  >
                    測試轉動音效
                  </button>

                  <button
                    type="button"
                    class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-amber-700 shadow-sm transition hover:bg-amber-100"
                    @click="testWinSound"
                  >
                    測試中獎音樂
                  </button>

                  <button
                    type="button"
                    class="rounded-2xl bg-slate-900 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-slate-700"
                    @click="stopAllSounds"
                  >
                    停止所有音效
                  </button>
                </div>
              </div>

              <button
                type="button"
                class="rounded-2xl bg-amber-600 px-4 py-3 text-sm font-black text-white transition hover:bg-amber-700"
                @click="previewWinEffects"
              >
                測試中獎特效
              </button>
            </div>
          </div>
        </div>

        </div>

        <div class="mt-5 rounded-3xl border border-slate-100 bg-slate-50 p-4">
          <div class="flex items-center justify-between gap-3"
            data-admin-section="prizes">
            <p class="text-sm font-black text-slate-900">
              獎項與機率設定
            </p>
              <button
                type="button"
                class="admin-section-toggle-button rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm transition hover:bg-slate-100"
                @click="toggleAdminSection('prizes')"
              >
                {{ isAdminSectionOpen('prizes') ? '收合' : '展開' }}
              </button>

            <button
              type="button"
              class="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm transition hover:bg-slate-100"
              @click="restorePrizeSettings"
            >
              還原此區
            </button>
          </div>

          <p class="mt-1 text-xs font-bold leading-5 text-slate-500">
            {{ adminSectionTips.prizes }}
          </p>
        </div>

        <div class="mt-3 rounded-3xl border border-slate-200 bg-white p-4"
              v-show="isAdminSectionOpen('prizes')">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-sm font-black text-slate-900">
                轉盤機率總覽
              </p>

              <p class="mt-1 text-xs font-bold leading-5 text-slate-500">
                調整獎項機率時，可先看這裡確認目前權重狀態。
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <span
                class="rounded-full border px-3 py-1 text-xs font-black"
                :class="probabilityStatusClass"
              >
                {{ probabilitySummary.totalProbability }} 權重
              </span>

              <button
                type="button"
                class="rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white transition hover:bg-orange-600"
                @click="averagePrizeProbability"
              >
                平均分配機率
              </button>
            </div>
          </div>

          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <div class="rounded-2xl bg-slate-50 p-3 text-center">
              <p class="text-xl font-black text-slate-900">
                {{ probabilitySummary.availableCount }}
              </p>

              <p class="mt-1 text-xs font-black text-slate-400">
                可抽獎項
              </p>
            </div>

            <div class="rounded-2xl bg-emerald-50 p-3 text-center">
              <p class="text-xl font-black text-emerald-700">
                {{ probabilitySummary.enabledCount }}
              </p>

              <p class="mt-1 text-xs font-black text-emerald-400">
                已啟用
              </p>
            </div>

            <div class="rounded-2xl bg-orange-50 p-3 text-center">
              <p class="text-xl font-black text-orange-700">
                {{ probabilitySummary.winCount }}
              </p>

              <p class="mt-1 text-xs font-black text-orange-400">
                中獎類型
              </p>
            </div>

            <div class="rounded-2xl bg-slate-100 p-3 text-center">
              <p class="text-xl font-black text-slate-700">
                {{ probabilitySummary.loseCount }}
              </p>

              <p class="mt-1 text-xs font-black text-slate-400">
                未中獎類型
              </p>
            </div>
          </div>

          <p
            class="mt-4 rounded-2xl border px-4 py-3 text-xs font-black leading-5"
            :class="probabilityStatusClass"
          >
            {{ probabilityStatusText }}
          </p>

          <p class="mt-2 rounded-2xl bg-slate-50 px-4 py-3 text-xs font-bold leading-5 text-slate-500">
            想快速改成百分比設定時，可按「平均分配機率」；若要重新設定，可先「機率清零」或「還原預設」。
          </p>
        </div>

        <div class="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 class="text-sm font-black text-slate-900">
                獎項資料
              </h3>

              <p class="mt-1 text-xs font-bold text-slate-400">
                可新增、複製、啟用、停用、排序或刪除轉盤獎項。
              </p>
            </div>

            <button
              type="button"
              class="rounded-full bg-orange-600 px-4 py-2 text-xs font-black text-white transition hover:bg-orange-700"
              @click="addPrizeItem"
            >
              新增獎項
            </button>
          </div>

          <div class="mt-3 space-y-3">
            <article
              v-for="(prize, index) in activePrizes"
              :key="prize.id"
              class="rounded-2xl bg-white p-3 shadow-sm"
            >
              <div class="flex items-center gap-2">
                <input
                  v-model="prize.icon"
                  class="h-10 w-12 rounded-xl border border-slate-200 px-2 text-center text-xl outline-none focus:border-orange-400"
                />

                <input
                  v-model="prize.name"
                  class="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold outline-none focus:border-orange-400"
                  placeholder="獎項名稱"
                />

                <div class="flex shrink-0 gap-1">
                  <button
                    type="button"
                    class="rounded-xl bg-slate-100 px-2 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                    :disabled="index === 0"
                    @click="movePrizeItem(index, -1)"
                  >
                    ↑
                  </button>

                  <button
                    type="button"
                    class="rounded-xl bg-slate-100 px-2 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                    :disabled="index === prizes.length - 1"
                    @click="movePrizeItem(index, 1)"
                  >
                    ↓
                  </button>

                  <button
                    type="button"
                    class="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-100"
                    @click="duplicatePrizeItem(prize)"
                  >
                    複製
                  </button>

                  <button
                    type="button"
                    class="rounded-xl px-3 py-2 text-xs font-black transition"
                    :class="prize.isEnabled === false
                      ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    "
                    @click="togglePrizeEnabled(prize)"
                  >
                    {{ prize.isEnabled === false ? '啟用' : '停用' }}
                  </button>

                  <button
                    type="button"
                    class="rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-600 transition hover:bg-rose-100"
                    @click="removePrizeItem(prize)"
                  >
                    刪除
                  </button>
                </div>
              </div>

              <div class="mt-2 flex flex-wrap gap-2">
                <p class="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-500">
                  轉盤順序：第 {{ index + 1 }} 格
                </p>

                <p
                  class="inline-flex rounded-full px-3 py-1 text-[11px] font-black"
                  :class="prize.isEnabled === false
                    ? 'bg-slate-100 text-slate-500'
                    : 'bg-emerald-100 text-emerald-700'
                  "
                >
                  {{ prize.isEnabled === false ? '已停用' : '已啟用' }}
                </p>
              </div>

              <label class="mt-2 grid gap-1 text-[11px] font-black text-slate-500">
                獎項圖片網址
                <input
                  v-model="prize.imageUrl"
                  class="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-orange-400"
                  placeholder="https://example.com/prize.png"
                />
              </label>

              <div
                v-if="hasPrizeImage(prize)"
                class="mt-2 overflow-hidden rounded-2xl border border-slate-100 bg-white p-2"
              >
                <img
                  :src="getPrizeImageUrl(prize)"
                  alt="獎項圖片預覽"
                  class="h-24 w-full rounded-xl object-contain"
                />
              </div>

              <div class="mt-2 grid gap-2 sm:grid-cols-2">
                <label class="grid gap-1 text-[11px] font-black text-slate-500">
                  轉盤短名
                  <input
                    v-model="prize.shortName"
                    class="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-orange-400"
                    placeholder="例如 100 / 謝謝"
                  />
                </label>

                <label class="grid gap-1 text-[11px] font-black text-slate-500">
                  獎項說明
                  <input
                    v-model="prize.description"
                    class="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-orange-400"
                    placeholder="兌換或活動說明"
                  />
                </label>
              </div>

              <div class="mt-2 grid grid-cols-2 gap-2">
                <label class="grid gap-1 text-[11px] font-black text-slate-500">
                  機率 / 權重
                  <input
                    v-model.number="prize.probability"
                    type="number"
                    class="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-orange-400"
                  />
                </label>

                <label class="grid gap-1 text-[11px] font-black text-slate-500">
                  庫存
                  <input
                    v-model.number="prize.stock"
                    type="number"
                    class="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-orange-400"
                  />
                </label>
              </div>

              <div class="mt-2 grid gap-2 sm:grid-cols-2">
                <label class="grid gap-1 text-[11px] font-black text-slate-500">
                  獎項類型
                  <select
                    v-model="prize.type"
                    class="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-orange-400"
                  >
                    <option
                      v-for="option in prizeTypeOptions"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                </label>

                <label class="grid gap-1 text-[11px] font-black text-slate-500">
                  獎項等級
                  <select
                    v-model="prize.rank"
                    class="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-orange-400"
                  >
                    <option
                      v-for="option in prizeRankOptions"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                </label>
              </div>

              <p
                class="mt-2 inline-flex rounded-full px-3 py-1 text-[11px] font-black"
                :class="getPrizeRankClass(prize.rank, prize.type)"
              >
                {{ getPrizeRankLabel(prize.rank, prize.type) }}
              </p>
            </article>
          </div>
        </div>

        <div class="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            class="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-orange-600"
            @click="exportDemoState"
          >
            匯出 JSON
          </button>

          <button
            type="button"
            class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-600 transition hover:bg-rose-100"
            @click="resetDemo"
          >
            重置示範
          </button>
        </div>

        <div class="mt-5 rounded-3xl border border-slate-100 bg-slate-50 p-4">
          <p class="text-sm font-black text-slate-900">
            ③ 紀錄與報表
          </p>

          <p class="mt-1 text-xs font-bold leading-5 text-slate-500">
            {{ adminSectionTips.reports }}
          </p>
        </div>

        <div class="mt-3 rounded-3xl border border-indigo-100 bg-indigo-50 p-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-sm font-black text-indigo-900">
                抽獎統計面板
              </p>

              <p class="mt-1 text-xs font-bold leading-5 text-indigo-700">
                依目前頁面的最近轉盤紀錄計算，方便快速檢查活動表現。
              </p>
            </div>

            <span class="rounded-full bg-white px-3 py-1 text-xs font-black text-indigo-700 shadow-sm">
              最近：{{ drawLogStats.latestAt }}
            </span>
          </div>

          <div class="mt-4 grid grid-cols-2 gap-3">
            <div class="rounded-2xl bg-white p-3 text-center shadow-sm">
              <p class="text-2xl font-black text-slate-900">
                {{ drawLogStats.total }}
              </p>

              <p class="mt-1 text-xs font-black text-slate-400">
                總抽獎次數
              </p>
            </div>

            <div class="rounded-2xl bg-white p-3 text-center shadow-sm">
              <p class="text-2xl font-black text-orange-700">
                {{ drawLogStats.winRate }}%
              </p>

              <p class="mt-1 text-xs font-black text-slate-400">
                中獎率
              </p>
            </div>

            <div class="rounded-2xl bg-white p-3 text-center shadow-sm">
              <p class="text-2xl font-black text-emerald-700">
                {{ drawLogStats.winCount }}
              </p>

              <p class="mt-1 text-xs font-black text-slate-400">
                中獎次數
              </p>
            </div>

            <div class="rounded-2xl bg-white p-3 text-center shadow-sm">
              <p class="text-2xl font-black text-slate-600">
                {{ drawLogStats.loseCount }}
              </p>

              <p class="mt-1 text-xs font-black text-slate-400">
                未中獎次數
              </p>
            </div>
          </div>
        </div>

        <div class="mt-3 rounded-3xl border border-blue-100 bg-blue-50 p-4">
          <p class="text-sm font-black text-blue-900">
            抽獎紀錄管理
          </p>

          <p class="mt-1 text-xs font-bold leading-5 text-blue-700">
            可匯出或清除目前轉盤頁面的最近抽獎紀錄，不會影響獎項、庫存與機率。
          </p>

          <div class="mt-3 grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              class="rounded-2xl bg-blue-600 px-3 py-2 text-xs font-black text-white transition hover:bg-blue-700"
              @click="exportDrawLogsJson"
            >
              匯出紀錄 JSON
            </button>

            <button
              type="button"
              class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-blue-700 shadow-sm transition hover:bg-blue-100"
              @click="exportDrawLogsCsv"
            >
              匯出紀錄 CSV
            </button>

            <button
              type="button"
              class="rounded-2xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-600 transition hover:bg-rose-100"
              @click="clearDrawLogs"
            >
              清除紀錄
            </button>
          </div>
        </div>

        <div
          v-if="savedMessage"
          class="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-black text-emerald-700"
        >
          {{ savedMessage }}
        </div>

        <div class="mt-4 rounded-3xl border border-amber-100 bg-amber-50 p-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            

            <span
              class="rounded-full bg-white px-3 py-1 text-xs font-black text-amber-700 shadow-sm"
            >
              {{ restorePointState ? '已有還原點' : '尚未建立' }}
            </span>
          </div>

          <p
            v-if="restorePointState"
            class="mt-3 rounded-2xl bg-white px-3 py-2 text-xs font-bold leading-5 text-slate-500"
          >
            還原點：{{ restorePointState.createdAt }}｜{{ restorePointState.label }}
          </p>

          <div class="mt-3 grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              class="rounded-2xl bg-amber-600 px-3 py-2 text-xs font-black text-white transition hover:bg-amber-700"
              @click="createRestorePoint('手動建立')"
            >
              建立還原點
            </button>

            <button
              type="button"
              class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-amber-700 shadow-sm transition hover:bg-amber-100"
              @click="restoreFromRestorePoint"
            >
              復原到還原點
            </button>

            <button
              type="button"
              class="rounded-2xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-600 transition hover:bg-rose-100"
              @click="resetAllPremiumWheelDefaults"
            >
              還原全部預設
            </button>
          </div>
        </div>


        <div class="mt-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-3">
            

            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
              Quick Nav
            </span>
          </div>

          <div class="mt-3 grid grid-cols-3 gap-2">
            <button
              type="button"
              class="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-100"
              @click="openAllAdminSections"
            >
              全部展開
            </button>

            <button
              type="button"
              class="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-200"
              @click="closeAllAdminSections"
            >
              全部收合
            </button>

            <button
              type="button"
              class="rounded-2xl bg-orange-50 px-3 py-2 text-xs font-black text-orange-600 transition hover:bg-orange-100"
              @click="keepOnlyBasicAdminSection"
            >
              保留基本
            </button>
          </div>

          <div class="mt-3 grid grid-cols-4 gap-2">
            <button
              v-for="section in adminQuickSections"
              :key="section.key"
              type="button"
              class="rounded-2xl border px-2 py-3 text-xs font-black transition hover:-translate-y-0.5 hover:bg-slate-900 hover:text-white"
              :class="isAdminSectionOpen(section.key)
                ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                : 'border-slate-100 bg-slate-50 text-slate-600'
              "
              @click="scrollToAdminSection(section.key)"
            >
              <span class="block text-sm">
                {{ section.icon }}
              </span>
              <span class="mt-1 block">
                {{ section.label }}
              </span>
            </button>
          </div>
        </div>

        <div class="mt-5 rounded-3xl border border-blue-100 bg-blue-50 p-4 text-xs font-bold leading-6 text-blue-700">
          <p class="font-black text-blue-900">
            預覽路徑
          </p>
          <p class="break-all">玩家版：{{ sourcePath }}</p>
          <p class="break-all">管理版：{{ adminSourcePath }}</p>
          <p class="mt-2 rounded-2xl bg-emerald-50 px-3 py-2 text-emerald-700">
            右側玩家預覽已啟用固定模式；滑鼠在左邊可滑後台，滑鼠在右邊可滑玩家預覽。後台效能模式已啟用，滾動會更順。
          </p>
        </div>
      </aside>

      <main
        class="flex items-start justify-center"
        :class="isAdminMode ? 'premium-admin-preview-fixed xl:self-start' : 'min-h-screen'"
      >
        <div class="w-full max-w-[430px] rounded-[40px] bg-white/10 p-2 shadow-[0_30px_80px_rgba(15,23,42,.25)] backdrop-blur sm:p-3">
          <div
            class="premium-game-board premium-vip-front-board premium-scrollbar-y relative h-[calc(100vh-3rem)] min-h-[720px] overflow-y-auto rounded-[34px] p-4 text-white shadow-inner sm:h-[860px] sm:p-5"
            :style="gameBoardFrameStyle"
          >
            <div class="absolute inset-0 opacity-20">
              <div class="premium-dot-bg premium-game-board-dots h-full w-full"></div>
            </div>

            <div class="premium-vip-light-beam pointer-events-none absolute inset-x-8 top-0 h-48 rounded-full"></div>
            <div class="premium-vip-orb premium-vip-orb-left pointer-events-none"></div>
            <div class="premium-vip-orb premium-vip-orb-right pointer-events-none"></div>

            <div class="relative">
              <section class="premium-vip-header-card overflow-hidden rounded-[32px] border border-white/25 p-3 shadow-2xl backdrop-blur sm:p-4" :style="bannerBackgroundStyle">
                <div class="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-yellow-100/80 to-transparent"></div>

                <div class="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div class="flex min-w-0 items-center gap-3">
                    <div
                      v-if="campaign.logoImageUrl"
                      class="premium-vip-logo-frame flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-yellow-100/80 bg-white shadow-lg"
                    >
                      <img
                        :src="campaign.logoImageUrl"
                        alt="品牌 LOGO"
                        class="h-full w-full object-contain"
                      />
                    </div>

                    <div
                      v-else
                      class="premium-vip-logo-frame flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-[4px] border-yellow-100 bg-gradient-to-br from-yellow-200 via-amber-400 to-orange-600 text-3xl font-black text-white shadow-2xl"
                    >
                      {{ campaign.logoText }}
                    </div>

                    <div class="min-w-0 text-left">
                      <p class="inline-flex rounded-full border border-yellow-100/40 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-yellow-100 shadow-inner">
                        VIP Lucky Club
                      </p>

                      <p class="mt-2 truncate text-sm font-black text-white/85">
                        {{ campaign.brandName }}
                      </p>

                      <p class="line-clamp-2 text-base font-black leading-5 text-white">
                        {{ campaign.pageTitle }}
                      </p>

                      <p class="mt-1 line-clamp-2 text-[11px] font-bold leading-5 text-white/75">
                        {{ campaign.brandTagline }}
                      </p>
                    </div>
                  </div>

                  <a
                    v-if="safeWebsiteUrl"
                    :href="safeWebsiteUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex w-full shrink-0 items-center justify-center rounded-full border border-yellow-100/70 bg-white px-4 py-2.5 text-xs font-black text-orange-600 shadow-lg transition hover:-translate-y-0.5 hover:bg-yellow-50 sm:w-auto"
                  >
                    {{ websiteButtonText }}
                  </a>
                </div>
              </section>

              <section class="premium-front-hero premium-vip-hero mt-4 overflow-hidden rounded-[34px] border border-yellow-100/35 bg-black/15 px-4 py-5 text-center shadow-inner backdrop-blur">
                <div class="premium-vip-crown mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-yellow-100/70 bg-yellow-100/15 text-2xl shadow-lg">
                  👑
                </div>

                <p class="mt-3 inline-flex rounded-full border border-yellow-100/40 bg-white/15 px-4 py-2 text-[11px] font-black text-yellow-50 shadow-inner">
                  {{ campaign.subTitle }}
                </p>

                <h1 class="mt-3 text-3xl font-black leading-tight tracking-wide text-yellow-100 drop-shadow-[0_5px_0_rgba(92,38,8,0.45)] sm:text-4xl">
                  {{ campaign.mainTitle }}
                </h1>

                <p class="mx-auto mt-2 max-w-sm text-sm font-black leading-6 text-yellow-50/95 sm:text-lg">
                  {{ campaign.heroTagline }}
                </p>

                <p
                  v-if="!isAdminMode"
                  class="mx-auto mt-3 max-w-xs rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-bold leading-5 text-white/75"
                >
                  VIP 精緻版已啟用，點擊轉盤後會自動顯示結果並寫入紀錄。
                </p>
              </section>

              <section
                v-if="showShareMessage || (!isAdminMode && lastSyncMessage) || spinningHintText"
                class="mt-4 rounded-3xl border border-yellow-100/25 bg-white/15 p-4 text-center shadow-inner backdrop-blur"
              >
                <div
                  v-if="showShareMessage"
                  class="mx-auto max-w-xs rounded-2xl border border-yellow-100/40 bg-black/20 px-4 py-3 text-xs font-black leading-5 text-yellow-50 shadow-inner backdrop-blur"
                >
                  {{ shareMessage }}
                </div>

                <div
                  v-if="!isAdminMode && lastSyncMessage"
                  class="mx-auto mt-3 max-w-xs rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-black leading-5 text-emerald-700 shadow-lg"
                >
                  {{ lastSyncMessage }}
                </div>

                <div
                  v-if="spinningHintText"
                  class="mx-auto mt-3 max-w-xs rounded-2xl border border-yellow-200/60 bg-yellow-100 px-4 py-3 text-xs font-black leading-5 text-orange-700 shadow-lg"
                >
                  {{ spinningHintText }}
                </div>
              </section>

              <section class="premium-front-summary premium-vip-summary mt-4 grid grid-cols-3 gap-2">
                <div
                  v-for="item in frontPlayerSummaryItems"
                  :key="item.label"
                  class="rounded-3xl border border-yellow-100/25 bg-white/15 px-2 py-3 text-center shadow-inner backdrop-blur"
                >
                  <p class="text-[10px] font-black text-yellow-50/70">
                    {{ item.label }}
                  </p>

                  <p class="mt-1 truncate text-xl font-black text-white drop-shadow">
                    {{ item.value }}
                  </p>

                  <p class="mt-0.5 text-[10px] font-bold text-yellow-50/70">
                    {{ item.subText }}
                  </p>
                </div>
              </section>

              <section class="premium-vip-benefits mt-3 grid gap-2 sm:grid-cols-3">
                <article
                  v-for="item in frontVipFeatureItems"
                  :key="item.label"
                  class="rounded-3xl border border-white/15 bg-black/15 px-3 py-3 text-left shadow-inner backdrop-blur"
                >
                  <div class="flex items-center gap-2">
                    <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-yellow-100/15 text-base shadow-inner">
                      {{ item.icon }}
                    </span>

                    <div class="min-w-0">
                      <p class="truncate text-[11px] font-black text-yellow-50">
                        {{ item.label }}
                      </p>
                      <p class="mt-0.5 line-clamp-2 text-[10px] font-bold leading-4 text-white/60">
                        {{ item.text }}
                      </p>
                    </div>
                  </div>
                </article>
              </section>

              <section
                class="premium-wheel-stage premium-vip-wheel-stage relative mx-auto mt-6 w-full max-w-[350px] rounded-[36px] border border-yellow-100/70 bg-gradient-to-br from-yellow-50 via-orange-50 to-orange-200 p-3 shadow-[0_30px_70px_rgba(78,29,4,.48)] sm:max-w-[430px] sm:p-4 lg:max-w-[520px] lg:p-5"
                :class="isSpinning ? 'premium-wheel-active' : ''"
              >
                <div
                  class="premium-wheel-pointer absolute left-1/2 top-[-6px] z-30"
                  :class="isSpinning ? 'premium-wheel-pointer-shake' : ''"
                  :style="wheelPointerStyle"
                >
                  <div class="premium-wheel-pointer-head mx-auto h-7 w-9 rounded-t-2xl shadow-xl sm:h-8 sm:w-10 lg:h-9 lg:w-12"></div>
                  <div
                    class="premium-wheel-pointer-arrow mx-auto h-0 w-0 border-l-[20px] border-r-[20px] border-t-[36px] border-l-transparent border-r-transparent drop-shadow-[0_10px_10px_rgba(15,23,42,.45)] sm:border-l-[24px] sm:border-r-[24px] sm:border-t-[42px] lg:border-l-[28px] lg:border-r-[28px] lg:border-t-[48px]"
                    :class="isSpinning && campaign.enablePointerTipShake ? 'premium-wheel-pointer-tip-shake' : ''"
                  ></div>
                  <div class="premium-wheel-pointer-highlight pointer-events-none absolute left-1/2 top-2 h-10 w-3 -translate-x-1/2 rounded-full"></div>
                  <div class="premium-wheel-pointer-dot absolute left-1/2 top-3 h-3 w-3 -translate-x-1/2 rounded-full shadow-inner"></div>
                </div>

                <div class="premium-wheel-shell relative mx-auto aspect-square w-full max-w-[335px] rounded-full p-1 sm:max-w-[410px] sm:p-2 lg:max-w-[475px] lg:p-3">
                  <div class="premium-wheel-svg-wrap relative h-full w-full rounded-full">
                    <svg
                      class="premium-wheel-svg h-full w-full transition-transform duration-[3600ms] ease-out"
                      viewBox="0 0 320 320"
                      :style="wheelStyle"
                    >
                      <defs>
                        <radialGradient id="wheelGoldGradient" cx="32%" cy="24%" r="78%">
                          <stop offset="0%" stop-color="#fff7c2" />
                          <stop offset="42%" stop-color="#facc15" />
                          <stop offset="72%" stop-color="#fb923c" />
                          <stop offset="100%" stop-color="#c2410c" />
                        </radialGradient>

                        <radialGradient id="wheelRoseGradient" cx="30%" cy="24%" r="80%">
                          <stop offset="0%" stop-color="#ffe4e6" />
                          <stop offset="38%" stop-color="#fb7185" />
                          <stop offset="74%" stop-color="#ef4444" />
                          <stop offset="100%" stop-color="#991b1b" />
                        </radialGradient>

                        <filter id="wheelInnerShadow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#7c2d12" flood-opacity="0.28" />
                        </filter>
                      </defs>

                      <circle
                        cx="160"
                        cy="160"
                        r="154"
                        fill="#fff7ed"
                        filter="url(#wheelInnerShadow)"
                      />

                      <g>
                        <path
                          v-for="(prize, index) in activePrizes"
                          :key="prize.id"
                          :d="getWheelSlicePath(index)"
                          :fill="getWheelSliceFill(index)"
                          class="premium-wheel-svg-slice"
                          :class="getWheelSliceClass(index)"
                        />
                      </g>

                      <circle
                        cx="160"
                        cy="160"
                        r="151"
                        fill="none"
                        stroke="rgba(255,255,255,.86)"
                        stroke-width="8"
                      />

                      <g
                        v-for="(prize, index) in prizes"
                        :key="`${prize.id}-svg-label`"
                        class="premium-wheel-svg-label"
                        :class="getWheelLabelClass(index)"
                      >
                        <foreignObject
                          :x="getWheelSvgLabelPosition(index).x - 22"
                          :y="getWheelSvgLabelPosition(index).y - 33"
                          width="44"
                          height="44"
                        >
                          <div class="premium-wheel-prize-media">
                            <img
                              v-if="hasPrizeImage(prize)"
                              :src="getPrizeImageUrl(prize)"
                              alt="獎項圖片"
                            />
                            <span v-else>{{ prize.icon }}</span>
                          </div>
                        </foreignObject>

                        <text
                          :x="getWheelSvgLabelPosition(index).x"
                          :y="getWheelSvgLabelPosition(index).y + 24"
                          text-anchor="middle"
                          dominant-baseline="middle"
                          class="premium-wheel-svg-text"
                        >
                          {{ prize.shortName || prize.name }}
                        </text>
                      </g>
                    </svg>

                    <div class="premium-wheel-shine pointer-events-none absolute inset-0 z-[15] rounded-full"></div>

                    <div
                      class="premium-wheel-center absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-center font-black"
                      :style="wheelCenterButtonStyle"
                    >
                      <span class="relative z-10">
                        {{ isSpinning ? '轉動中' : resultPrize ? '完成' : (campaign.wheelCenterText || 'SPIN') }}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  class="premium-wheel-start-button mx-auto mt-5 flex h-14 w-[76%] items-center justify-center rounded-[999px] text-sm font-black text-white transition sm:h-16 sm:text-base lg:h-[72px] lg:text-lg"
                  :class="canSpin
                    ? 'hover:-translate-y-0.5 active:translate-y-0'
                    : 'cursor-not-allowed opacity-75'
                  "
                  :disabled="!canSpin"
                  @click="startSpin"
                >
                  {{ wheelButtonText }}
                </button>
              </section>

              <section class="premium-front-action-card premium-vip-action-card relative mt-4 overflow-hidden rounded-[30px] border border-yellow-100/30 bg-white/15 p-4 text-center shadow-inner backdrop-blur">
                <div class="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-yellow-100/80 to-transparent"></div>
                <div class="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-yellow-100/20 blur-2xl"></div>

                <p class="mx-auto max-w-sm rounded-2xl border border-yellow-100/25 bg-black/15 px-4 py-2 text-xs font-black leading-5 text-yellow-50">
                  {{ playerStatusMessage }}
                </p>

                <div class="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <button
                    v-if="!isUserLoggedIn"
                    type="button"
                    class="rounded-full border border-yellow-100/80 bg-white px-4 py-2 text-xs font-black text-orange-600 shadow-lg transition hover:-translate-y-0.5 hover:bg-yellow-50"
                    @click="goLoginPage"
                  >
                    👑 會員登入領獎勵
                  </button>

                  <span
                    v-else
                    class="inline-flex rounded-full border border-emerald-100/50 bg-emerald-100/20 px-4 py-2 text-xs font-black text-emerald-50"
                  >
                    👑 已登入，可領取 VIP 分享獎勵
                  </span>

                  <button
                    type="button"
                    class="rounded-full border border-white/25 bg-white/20 px-4 py-2 text-xs font-black text-white shadow-inner transition hover:-translate-y-0.5 hover:bg-white/30"
                    @click="shareCampaign"
                  >
                    ✨ {{ getCustomShareButtonText() }}
                  </button>
                </div>
              </section>

              <section
                v-if="resultPrize"
                class="relative mt-4 rounded-[30px] bg-white p-4 text-center text-slate-900 shadow-xl"
              >
                <div
                  class="rounded-3xl border border-orange-100 bg-orange-50 p-4 text-left"
                >
                  <div class="flex items-center justify-between gap-3">
                    <span
                      class="rounded-full px-3 py-1 text-xs font-black"
                      :class="wheelResultClass"
                    >
                      {{ wheelResultLabel }}
                    </span>

                    <span
                      class="rounded-full px-3 py-1 text-xs font-black"
                      :class="getPrizeRankClass(resultPrize.rank, resultPrize.type)"
                    >
                      {{ getPrizeRankLabel(resultPrize.rank, resultPrize.type) }}
                    </span>

                    <span class="rounded-full bg-white px-3 py-1 text-xs font-black text-orange-600">
                      剩餘 {{ player.chances }} 次
                    </span>
                  </div>

                  <div class="mt-3 flex items-center gap-3">
                    <div class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white text-2xl shadow-sm">
                      <img
                        v-if="hasPrizeImage(resultPrize)"
                        :src="getPrizeImageUrl(resultPrize)"
                        alt="獎項圖片"
                        class="h-full w-full object-contain p-1"
                      />
                      <span v-else>{{ resultPrize.icon || '🎁' }}</span>
                    </div>

                    <div class="min-w-0">
                      <p class="truncate text-sm font-black text-slate-900">
                        {{ resultPrize.name }}
                      </p>

                      <p class="mt-1 text-xs font-bold leading-5 text-slate-500">
                        {{ resultPrize.description || '結果已寫入我的遊戲紀錄。' }}
                      </p>
                    </div>
                  </div>

                  <p class="mt-3 rounded-2xl bg-white px-3 py-2 text-xs font-black text-orange-600">
                    已高亮顯示轉到的獎項位置。
                  </p>
                </div>
              </section>

              <section
                v-if="!isAdminMode && player.chances <= 0"
                class="relative mt-4 rounded-3xl border border-white/30 bg-white/20 p-4 text-center shadow-inner backdrop-blur"
              >
                <p class="text-sm font-black text-white">
                  轉盤機會已用完
                </p>

                <p class="mt-2 text-xs font-bold leading-6 text-white/75">
                  分享活動可立即增加 1 次轉盤機會。
                </p>

                <button
                  type="button"
                  class="mt-3 rounded-full bg-white px-5 py-2.5 text-xs font-black text-orange-600 shadow-lg transition hover:bg-yellow-50"
                  @click.stop.prevent="handleShareActivity"
                >
                  分享增加機會
                </button>
              </section>

              <section
                v-if="getCustomShareImageUrl() || campaign.shareTitle || campaign.shareDescription"
                class="relative mt-4 overflow-hidden rounded-[30px] border border-white/25 bg-white/15 p-3 shadow-inner backdrop-blur"
              >
                <div class="flex items-center gap-3 rounded-[26px] border border-white/20 bg-white/15 p-3 text-white shadow-inner">
                  <div class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/30 bg-white/20 text-2xl font-black shadow-lg">
                    <img
                      v-if="campaign.logoUrl"
                      :src="campaign.logoUrl"
                      alt="活動 LOGO"
                      class="h-full w-full object-cover"
                    />
                    <span v-else>W</span>
                  </div>

                  <div class="min-w-0 flex-1 text-left">
                    <p class="truncate text-base font-black leading-tight drop-shadow sm:text-lg">
                      {{ getCustomShareTitle() }}
                    </p>

                    <p class="mt-1 line-clamp-2 text-xs font-bold leading-5 text-white/80 sm:text-sm">
                      {{ getCustomShareDescription() }}
                    </p>
                  </div>

                  <a
                    v-if="getOfficialWebsiteUrl()"
                    :href="getOfficialWebsiteUrl()"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="shrink-0 rounded-full bg-white px-3 py-2 text-[11px] font-black text-orange-600 shadow-lg transition hover:-translate-y-0.5 hover:bg-yellow-50 sm:px-4 sm:text-xs"
                  >
                    官方網站
                  </a>
                </div>

                <div
                  v-if="getCustomShareImageUrl()"
                  class="mt-3 overflow-hidden rounded-3xl bg-white/20 p-2 shadow-lg"
                >
                  <img
                    :src="getCustomShareImageUrl()"
                    alt="分享活動圖片"
                    class="h-44 w-full rounded-2xl object-cover sm:h-52"
                  />
                </div>
              </section>

              <section class="relative mt-4 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  class="rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-sm font-black text-white shadow-inner backdrop-blur transition hover:bg-white/30"
                  :class="isSpinning ? 'cursor-not-allowed opacity-60' : ''"
                  :disabled="isSpinning"
                  @click.stop.prevent="handleShareActivity"
                >
                  {{ isSpinning ? '轉盤中...' : campaign.buttonText }}
                </button>

                <button
                  type="button"
                  class="rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-sm font-black text-white shadow-inner backdrop-blur transition hover:bg-white/30"
                  :class="isSpinning ? 'cursor-not-allowed opacity-60' : ''"
                  :disabled="isSpinning"
                  @click="goGameHistory"
                >
                  {{ isSpinning ? '轉盤中...' : '查看我的紀錄' }}
                </button>

                <button
                  type="button"
                  class="rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-sm font-black text-white shadow-inner backdrop-blur transition hover:bg-white/30 sm:col-span-2"
                  :class="isSpinning ? 'cursor-not-allowed opacity-60' : ''"
                  :disabled="isSpinning"
                  @click="goGamesCenter"
                >
                  {{ isSpinning ? '轉盤中...' : '回遊戲中心' }}
                </button>
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
                        {{ campaign.ruleTitle || '活動規則' }}
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
                        v-for="rule in splitMultilineText(campaign.ruleContent)"
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
                        {{ campaign.prizeInfoTitle || '獎品說明' }}
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
                        v-for="note in splitMultilineText(campaign.prizeInfoContent)"
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

              <section class="mt-5 overflow-hidden rounded-3xl bg-white/95 p-3 shadow-xl">
                <div class="flex items-center justify-between gap-3 px-2 pt-2">
                  <div>
                    <h3 class="text-sm font-black text-slate-900">
                      最近轉盤紀錄
                    </h3>

                    <p class="mt-1 text-xs font-bold text-slate-400">
                      目前共有 {{ recentLogCount }} 筆紀錄
                    </p>
                  </div>

                  <button
                    type="button"
                    class="rounded-full bg-orange-50 px-4 py-2 text-xs font-black text-orange-600 transition hover:bg-orange-100"
                    @click="toggleRecentLogs"
                  >
                    {{ recentLogsToggleText }}
                  </button>
                </div>

                <div
                  v-if="!isRecentLogsExpanded"
                  class="premium-recent-logs-collapsed mt-4 rounded-3xl px-4 py-4 text-center"
                >
                  <p class="text-sm font-black text-orange-700">
                    最近紀錄已收合
                  </p>

                  <p class="mt-1 text-xs font-bold leading-5 text-orange-500">
                    點擊展開後查看最近中獎與未中獎紀錄。
                  </p>
                </div>

                <div
                  v-if="isRecentLogsExpanded"
                  class="mt-3 space-y-2"
                >
                  <article
                    v-for="log in drawLogs"
                    :key="log.id"
                    class="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"
                  >
                    <div class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white text-2xl shadow-sm">
                      <img
                        v-if="log.prizeImageUrl"
                        :src="log.prizeImageUrl"
                        alt="獎項圖片"
                        class="h-full w-full object-contain p-1"
                      />
                      <span v-else>{{ log.prizeIcon }}</span>
                    </div>

                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-black text-slate-900">
                        {{ log.prizeName }}
                      </p>

                      <p class="text-xs font-bold text-slate-400">
                        {{ log.createdAt }}
                      </p>

                      <div class="mt-1 flex flex-wrap gap-1">
                        <p
                          class="inline-flex rounded-full px-2 py-0.5 text-[10px] font-black"
                          :class="log.prizeType === 'lose'
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-orange-100 text-orange-700'
                          "
                        >
                          {{ getPrizeTypeLabel(log.prizeType) }}
                        </p>

                        <p
                          class="inline-flex rounded-full px-2 py-0.5 text-[10px] font-black"
                          :class="getPrizeRankClass(log.prizeRank, log.prizeType)"
                        >
                          {{ log.prizeRankLabel || getPrizeRankLabel(log.prizeRank, log.prizeType) }}
                        </p>
                      </div>
                    </div>
                  </article>

                  <div
                    v-if="!drawLogs.length"
                    class="rounded-2xl bg-slate-50 px-4 py-5 text-center text-xs font-black text-slate-400"
                  >
                    目前還沒有轉盤紀錄。
                  </div>

                  <p
                    v-if="isRecentLogsExpanded && !drawLogs.length"
                    class="rounded-2xl bg-slate-50 p-4 text-center text-xs font-bold text-slate-400"
                  >
                    目前尚無轉盤紀錄
                  </p>
                </div>
              </section>

              <p class="relative mt-4 text-center text-[11px] font-bold leading-5 text-white/70">
                {{ isAdminMode ? campaign.noticeText : '請依照活動規則參加轉盤；獎項與兌換方式以主辦單位公告為準。' }}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>

    <div
      v-if="showSharePreviewModal"
      class="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-md"
    >
      <div class="premium-share-preview-card w-full max-w-sm overflow-hidden rounded-[36px] bg-white shadow-2xl">
        <div class="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 p-5 text-white">
          <div class="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/20 blur-2xl"></div>
          <div class="absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-yellow-200/20 blur-3xl"></div>

          <p class="relative text-xs font-black uppercase tracking-[0.24em] text-white/70">
            Share Preview
          </p>

          <h3 class="relative mt-2 text-2xl font-black leading-tight">
            分享活動預覽
          </h3>

          <p class="relative mt-1 text-sm font-bold text-white/75">
            確認分享內容後，再選擇系統分享或複製文案。
          </p>
        </div>

        <div class="bg-gradient-to-b from-white to-orange-50 p-5">
          <div
            v-if="getCustomShareImageUrl()"
            class="overflow-hidden rounded-3xl border border-orange-100 bg-white p-2 shadow-sm"
          >
            <img
              :src="getCustomShareImageUrl()"
              alt="分享活動圖片"
              class="h-44 w-full rounded-2xl object-cover"
            />
          </div>

          <div class="mt-4 rounded-3xl bg-white p-4 text-center shadow-sm">
            <p class="text-xl font-black leading-tight text-slate-900">
              {{ getCustomShareTitle() }}
            </p>

            <p class="mx-auto mt-3 max-w-xs text-sm font-bold leading-6 text-slate-500">
              {{ getCustomShareDescription() }}
            </p>

            <p class="mt-3 break-all rounded-2xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-500">
              {{ getShareUrl() }}
            </p>

            <a
              v-if="getOfficialWebsiteUrl()"
              :href="getOfficialWebsiteUrl()"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-3 inline-flex rounded-full bg-orange-50 px-4 py-2 text-xs font-black text-orange-600 transition hover:bg-orange-100"
            >
              官方網站
            </a>
          </div>

          <div class="mt-4 rounded-2xl bg-sky-50 px-4 py-3 text-center text-xs font-black leading-5 text-sky-700">
            <p>
              今日還可領 {{ shareRewardRemainingToday }} 次分享獎勵
              <span v-if="shareRewardCooldownRemaining > 0">
                ，冷卻剩餘 {{ shareRewardCooldownRemaining }} 秒
              </span>
            </p>

            <p
              v-if="shareRewardStatusMessage"
              class="mt-1 text-[11px] text-sky-600"
            >
              {{ shareRewardStatusMessage }}
            </p>

            <button
              v-if="isUserLoggedIn"
              type="button"
              class="mt-2 rounded-full bg-white px-3 py-1 text-[11px] font-black text-sky-700 shadow-sm transition hover:bg-sky-100"
              :disabled="isShareRewardStatusLoading"
              @click="fetchShareRewardStatusFromServer"
            >
              {{ isShareRewardStatusLoading ? '同步中...' : '同步狀態' }}
            </button>
          </div>

          <div
            v-if="!isUserLoggedIn"
            class="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-center"
          >
            <p class="text-xs font-black leading-5 text-amber-700">
              你目前尚未登入。登入後會回到目前轉盤頁，分享後系統才會發放轉盤機會。
            </p>

            <button
              type="button"
              class="mt-2 rounded-full bg-amber-600 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-amber-700"
              @click="goLoginPage"
            >
              會員登入
            </button>
          </div>

          <p
            v-if="isShareActionProcessing"
            class="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-center text-xs font-black leading-5 text-slate-500"
          >
            系統處理中，請稍候。
          </p>

          <div class="mt-5 grid gap-3">
            <button
              type="button"
              class="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:brightness-110"
              :class="isShareActionProcessing || !isUserLoggedIn ? 'cursor-not-allowed opacity-70' : ''"
              :disabled="isShareActionProcessing || !isUserLoggedIn"
              @click="runSystemShareFromPreview"
            >
              {{ !isUserLoggedIn ? '請先登入' : (canClaimShareReward ? '開啟系統分享' : '今日已達上限 / 冷卻中') }}
            </button>

            <button
              type="button"
              class="w-full rounded-2xl border border-orange-100 bg-orange-50 px-5 py-3 text-sm font-black text-orange-700 shadow-sm transition hover:bg-orange-100"
              :class="isShareActionProcessing || !isUserLoggedIn ? 'cursor-not-allowed opacity-70' : ''"
              :disabled="isShareActionProcessing || !isUserLoggedIn"
              @click="copyShareTextFromPreview"
            >
              {{ !isUserLoggedIn ? '請先登入' : '複製分享文案' }}
            </button>

            <button
              type="button"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-black text-slate-500 transition hover:bg-slate-100"
              :class="isShareActionProcessing ? 'cursor-not-allowed opacity-70' : ''"
              :disabled="isShareActionProcessing"
              @click="closeSharePreviewModal"
            >
              先關閉
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showWinEffects"
      class="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
    >
      <template v-if="campaign.enableWinConfetti">
        <span
          v-for="piece in confettiPieces"
          :key="piece.id"
          class="premium-win-confetti"
          :style="piece.style"
        ></span>
      </template>

      <div
        v-if="campaign.enableGoldenAura"
        class="premium-win-golden-aura"
      ></div>

      <div
        v-if="campaign.enableWinFlash"
        class="premium-win-flash"
      ></div>

      <template v-if="campaign.enableGoldRain">
        <span
          v-for="piece in goldRainPieces"
          :key="piece.id"
          class="premium-gold-rain"
          :style="piece.style"
        ></span>
      </template>
    </div>

    <div
      v-if="showResultModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-md"
    >
      <div class="premium-result-card w-full max-w-sm overflow-hidden rounded-[36px] bg-white shadow-2xl">
        <div
          class="relative overflow-hidden p-6 text-center text-white"
          :class="resultPrize?.type === 'lose'
            ? 'bg-gradient-to-br from-slate-500 via-slate-700 to-slate-950'
            : 'bg-gradient-to-br from-amber-400 via-orange-500 to-red-600'
          "
        >
          <div class="absolute inset-0 opacity-25 premium-result-dot-bg"></div>
          <div class="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/20 blur-2xl"></div>
          <div class="absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-yellow-200/20 blur-3xl"></div>

          <div
            class="premium-result-prize-image relative mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-[36px] border border-white/40 bg-white/20 text-7xl shadow-2xl backdrop-blur sm:h-36 sm:w-36"
            :class="campaign.enablePrizeBounce && resultPrize?.type !== 'lose' ? 'premium-prize-bounce' : ''"
          >
            <img
              v-if="hasPrizeImage(resultPrize)"
              :src="getPrizeImageUrl(resultPrize)"
              alt="獎項圖片"
              class="h-full w-full object-contain p-2"
            />
            <span v-else>{{ resultPrize?.icon || '🎁' }}</span>
          </div>

          <p class="relative mt-4 text-xs font-black uppercase tracking-[0.26em] text-white/70">
            Wheel Result
          </p>

          <p class="relative mt-2 text-3xl font-black drop-shadow">
            {{ resultPrize?.type === 'lose' ? '再接再厲' : '恭喜中獎' }}
          </p>

          <p class="relative mt-2 rounded-full bg-white/20 px-4 py-2 text-lg font-black text-yellow-50 shadow-inner">
            {{ resultPrize?.name }}
          </p>

          <p class="relative mx-auto mt-3 inline-flex rounded-full bg-white px-4 py-2 text-xs font-black text-orange-600 shadow-lg">
            {{ getPrizeRankLabel(resultPrize?.rank, resultPrize?.type) }}
          </p>
        </div>

        <div class="bg-gradient-to-b from-white to-orange-50 p-6 text-center">
          <p class="rounded-3xl bg-white px-4 py-4 text-sm font-bold leading-6 text-slate-500 shadow-sm">
            {{ resultPrize?.description || '結果已寫入我的遊戲紀錄。' }}
          </p>

          <div class="mt-4 grid grid-cols-2 gap-3">
            <div class="rounded-3xl bg-orange-100 px-3 py-4">
              <p class="text-2xl font-black text-orange-700">
                {{ player.chances }}
              </p>

              <p class="mt-1 text-xs font-black text-orange-500">
                剩餘次數
              </p>
            </div>

            <div class="rounded-3xl bg-slate-100 px-3 py-4">
              <p class="text-2xl font-black text-slate-800">
                {{ resultPrize?.type === 'lose' ? '未中' : '中獎' }}
              </p>

              <p class="mt-1 text-xs font-black text-slate-500">
                結果狀態
              </p>
            </div>
          </div>

          <p class="mt-4 rounded-2xl bg-orange-50 px-4 py-3 text-xs font-black leading-5 text-orange-700">
            {{ resultHintText }}
          </p>

          <div
            v-if="resultPrize?.type !== 'lose'"
            class="mt-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-left text-xs font-bold leading-5 text-amber-700"
          >
            <p class="font-black text-amber-900">
              兌獎提醒
            </p>

            <p class="mt-1">
              建議截圖、複製或分享中獎結果；兌換方式以主辦單位公告為準。
            </p>
          </div>

          <p
            v-if="isResultActionProcessing"
            class="mt-3 rounded-2xl bg-slate-100 px-4 py-3 text-xs font-black leading-5 text-slate-500"
          >
            系統處理中，請稍候。
          </p>

          <div class="mt-5 grid gap-3">
            <p
              v-if="resultPrize?.type !== 'lose'"
              class="rounded-2xl bg-white px-4 py-3 text-xs font-bold leading-5 text-slate-500 shadow-sm"
            >
              本頁僅提供中獎結果保存與分享，不產生核銷碼或兌獎碼。
            </p>

            <button
              type="button"
              class="w-full rounded-2xl px-5 py-3 text-sm font-black text-white shadow-lg transition"
              :class="isResultActionProcessing
                ? 'cursor-not-allowed bg-orange-300'
                : 'bg-gradient-to-r from-orange-500 to-red-600 hover:brightness-110'
              "
              :disabled="isResultActionProcessing"
              @click="handleResultPrimaryAction"
            >
              {{ resultActionText }}
            </button>

            <button
              type="button"
              class="w-full rounded-2xl border border-orange-100 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-orange-50"
              :class="isResultActionProcessing ? 'cursor-not-allowed opacity-60' : ''"
              :disabled="isResultActionProcessing"
              @click="goGameHistory"
            >
              查看我的遊戲紀錄
            </button>

            <button
              type="button"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-black text-slate-500 transition hover:bg-slate-100"
              :class="isResultActionProcessing ? 'cursor-not-allowed opacity-60' : ''"
              :disabled="isResultActionProcessing"
              @click="stopAllSounds(); showResultModal = false"
            >
              先關閉
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.premium-scrollbar-y {
  scrollbar-width: none;
}

.premium-scrollbar-y::-webkit-scrollbar {
  width: 0;
}

.premium-dot-bg {
  background-image: radial-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px);
  background-size: 34px 34px;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 第 257 批：穩定版 RWD 尺寸，避免 Tailwind var 尺寸導致輪盤消失 */
.premium-wheel-stage {
  --wheel-size: 246px;
  --bulb-radius: 143px;
}

@media (min-width: 640px) {
  .premium-wheel-stage {
    --wheel-size: 318px;
    --bulb-radius: 192px;
  }
}

@media (min-width: 1024px) {
  .premium-wheel-stage {
    --wheel-size: 382px;
    --bulb-radius: 232px;
  }
}

.premium-wheel-bulb {
  transform:
    translate(-50%, -50%)
    rotate(var(--bulb-angle))
    translateY(calc(var(--bulb-radius) * -1));
}

@keyframes premium-wheel-bulb-chase-fixed {
  0%,
  100% {
    opacity: 0.35;
    filter: brightness(0.9);
    transform:
      translate(-50%, -50%)
      rotate(var(--bulb-angle))
      translateY(calc(var(--bulb-radius) * -1))
      scale(0.82);
  }

  45% {
    opacity: 1;
    filter: brightness(1.55);
    transform:
      translate(-50%, -50%)
      rotate(var(--bulb-angle))
      translateY(calc(var(--bulb-radius) * -1))
      scale(1.18);
  }
}

.premium-wheel-bulb {
  animation-name: premium-wheel-bulb-chase-fixed;
}


/* 第 257 批：手機尺寸修正與圓形跑馬燈 */
.premium-wheel-marquee {
  display: none;
}

.premium-wheel-circle-bulb {
  --bulb-count: 32;
  --bulb-angle: calc(360deg / var(--bulb-count) * var(--bulb-index));
  position: absolute;
  left: 50%;
  top: 50%;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: radial-gradient(circle at 35% 30%, #ffffff 0%, #fef3c7 28%, #facc15 58%, #fb923c 100%);
  box-shadow:
    0 0 10px rgba(250, 204, 21, 0.9),
    0 0 18px rgba(249, 115, 22, 0.55);
  transform:
    translate(-50%, -50%)
    rotate(var(--bulb-angle))
    translateY(calc(var(--bulb-radius) * -1));
  animation: premium-wheel-circle-bulb-chase 1.1s linear infinite;
  animation-delay: calc(var(--bulb-index) * -0.055s);
}

@media (min-width: 640px) {
  .premium-wheel-circle-bulb {
    width: 10px;
    height: 10px;
  }
}

@media (min-width: 1024px) {
  .premium-wheel-circle-bulb {
    width: 12px;
    height: 12px;
  }
}

@keyframes premium-wheel-circle-bulb-chase {
  0%,
  100% {
    opacity: 0.28;
    filter: brightness(0.85);
    transform:
      translate(-50%, -50%)
      rotate(var(--bulb-angle))
      translateY(calc(var(--bulb-radius) * -1))
      scale(0.8);
  }

  45% {
    opacity: 1;
    filter: brightness(1.7);
    transform:
      translate(-50%, -50%)
      rotate(var(--bulb-angle))
      translateY(calc(var(--bulb-radius) * -1))
      scale(1.24);
  }
}


/* 第 257 批：SVG 響應式轉盤重製版 */
.premium-wheel-stage {
  overflow: visible;
}

.premium-wheel-shell {
  background:
    radial-gradient(circle at 35% 25%, rgba(255, 255, 255, 0.96), transparent 22%),
    radial-gradient(circle, #fef3c7 0%, #fbbf24 46%, #d97706 68%, #7c2d12 100%);
  box-shadow:
    inset 0 12px 20px rgba(255, 255, 255, 0.6),
    inset 0 -18px 32px rgba(120, 53, 15, 0.48),
    0 28px 45px rgba(120, 53, 15, 0.42);
}

.premium-wheel-shell::before {
  content: '';
  position: absolute;
  inset: 8px;
  border-radius: 999px;
  border: 3px dashed rgba(255, 255, 255, 0.7);
  box-shadow: inset 0 0 0 6px rgba(255, 255, 255, 0.18);
}

.premium-wheel-svg-wrap {
  border: 8px solid rgba(255, 255, 255, 0.96);
  background: #fff7ed;
  box-shadow:
    inset 0 10px 22px rgba(255, 255, 255, 0.72),
    inset 0 -18px 30px rgba(127, 29, 29, 0.35),
    0 16px 30px rgba(120, 53, 15, 0.32);
  overflow: hidden;
}

.premium-wheel-svg-slice {
  stroke: rgba(255, 255, 255, 0.42);
  stroke-width: 2;
}

.premium-wheel-svg-icon {
  font-size: 26px;
  filter: drop-shadow(0 2px 2px rgba(15, 23, 42, 0.25));
}

.premium-wheel-svg-text {
  font-size: 14px;
  font-weight: 900;
  fill: #0f172a;
  paint-order: stroke;
  stroke: rgba(255, 255, 255, 0.86);
  stroke-width: 5px;
  stroke-linejoin: round;
}

.premium-wheel-circle-bulb {
  --bulb-count: 32;
  --bulb-angle: calc(360deg / var(--bulb-count) * var(--bulb-index));
  position: absolute;
  left: 50%;
  top: 50%;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: radial-gradient(circle at 35% 30%, #ffffff 0%, #fef3c7 28%, #facc15 58%, #fb923c 100%);
  box-shadow:
    0 0 10px rgba(250, 204, 21, 0.9),
    0 0 18px rgba(249, 115, 22, 0.55);
  transform:
    translate(-50%, -50%)
    rotate(var(--bulb-angle))
    translateY(calc((min(100%, 430px) / -2) + 4px));
  animation: premium-wheel-svg-bulb-chase 1.1s linear infinite;
  animation-delay: calc(var(--bulb-index) * -0.055s);
}

@media (min-width: 640px) {
  .premium-wheel-circle-bulb {
    width: 10px;
    height: 10px;
  }
}

@media (min-width: 1024px) {
  .premium-wheel-circle-bulb {
    width: 12px;
    height: 12px;
  }
}

@keyframes premium-wheel-svg-bulb-chase {
  0%,
  100% {
    opacity: 0.3;
    filter: brightness(0.88);
    scale: 0.82;
  }

  45% {
    opacity: 1;
    filter: brightness(1.7);
    scale: 1.22;
  }
}

.premium-wheel-shine {
  background:
    radial-gradient(circle at 28% 20%, rgba(255, 255, 255, 0.58), transparent 22%),
    linear-gradient(120deg, rgba(255, 255, 255, 0.36), transparent 40%, rgba(255, 255, 255, 0.18) 62%, transparent 78%);
  mix-blend-mode: screen;
}

.premium-wheel-center {
  border-style: solid;
  line-height: 1;
  box-shadow:
    inset 0 12px 20px rgba(255, 255, 255, 0.16),
    inset 0 -14px 22px rgba(15, 23, 42, 0.5),
    0 16px 32px rgba(15, 23, 42, 0.34);
}

.premium-wheel-pointer {
  transform-origin: 50% 18px;
  filter: drop-shadow(0 12px 12px rgba(15, 23, 42, 0.45));
}

.premium-wheel-base {
  background:
    radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.38), transparent 45%),
    linear-gradient(180deg, #92400e 0%, #7c2d12 55%, #431407 100%);
  box-shadow:
    inset 0 8px 12px rgba(255, 255, 255, 0.14),
    0 18px 28px rgba(67, 20, 7, 0.35);
}

.premium-wheel-slice-win {
  filter: brightness(1.2) saturate(1.15);
}

.premium-wheel-slice-lose {
  filter: grayscale(0.25) brightness(1.06);
}


/* 第 257 批：放大輪盤、移除外圈、底座美化 */
.premium-wheel-shell {
  box-shadow:
    inset 0 10px 18px rgba(255, 255, 255, 0.48),
    inset 0 -14px 26px rgba(120, 53, 15, 0.34),
    0 24px 42px rgba(120, 53, 15, 0.36);
}

.premium-wheel-shell::before {
  display: none;
}

.premium-wheel-circle-marquee,
.premium-wheel-circle-bulb,
.premium-wheel-marquee,
.premium-wheel-bulb {
  display: none !important;
}

.premium-wheel-svg-wrap {
  border-width: 7px;
  box-shadow:
    inset 0 10px 20px rgba(255, 255, 255, 0.62),
    inset 0 -16px 26px rgba(127, 29, 29, 0.28),
    0 18px 34px rgba(120, 53, 15, 0.34);
}

.premium-wheel-base {
  background:
    radial-gradient(ellipse at 50% 14%, rgba(255, 255, 255, 0.48), transparent 36%),
    linear-gradient(180deg, #b45309 0%, #7c2d12 48%, #431407 100%);
  box-shadow:
    inset 0 9px 14px rgba(255, 255, 255, 0.18),
    inset 0 -10px 18px rgba(67, 20, 7, 0.42),
    0 16px 24px rgba(67, 20, 7, 0.32);
  transform: perspective(420px) rotateX(58deg);
  transform-origin: center top;
}


/* 第 257 批：移除黃色厚外圈，輪盤本體再放大 */
.premium-wheel-shell {
  background: transparent !important;
  box-shadow: none !important;
  padding: 0.25rem;
}

.premium-wheel-svg-wrap {
  border-width: 8px;
  border-color: rgba(255, 255, 255, 0.96);
  box-shadow:
    inset 0 10px 20px rgba(255, 255, 255, 0.62),
    inset 0 -16px 26px rgba(127, 29, 29, 0.26),
    0 20px 38px rgba(120, 53, 15, 0.36);
}

.premium-wheel-stage {
  background:
    radial-gradient(circle at 50% 42%, rgba(255, 255, 255, 0.42), transparent 42%),
    linear-gradient(145deg, #fff7ed 0%, #fed7aa 58%, #fb923c 100%);
}


/* 第 257 批：高級遊戲機外框與底座開始按鈕 */
.premium-wheel-shell {
  background:
    radial-gradient(circle at 28% 22%, rgba(255, 255, 255, 0.92), transparent 19%),
    conic-gradient(from -20deg, #fef3c7, #ffffff, #facc15, #fb923c, #ffffff, #fef3c7) !important;
  box-shadow:
    inset 0 10px 18px rgba(255, 255, 255, 0.75),
    inset 0 -18px 28px rgba(120, 53, 15, 0.28),
    0 22px 42px rgba(120, 53, 15, 0.36),
    0 0 0 1px rgba(255, 255, 255, 0.56) !important;
  padding: 0.45rem !important;
}

.premium-wheel-shell::after {
  content: '';
  position: absolute;
  inset: 13px;
  border-radius: 999px;
  pointer-events: none;
  border: 2px solid rgba(255, 255, 255, 0.72);
  box-shadow:
    inset 0 0 18px rgba(255, 255, 255, 0.48),
    0 0 20px rgba(250, 204, 21, 0.22);
}

.premium-wheel-svg-wrap {
  border-width: 9px;
  border-color: rgba(255, 255, 255, 0.98);
  background:
    radial-gradient(circle at 32% 24%, rgba(255, 255, 255, 0.92), transparent 26%),
    #fff7ed;
  box-shadow:
    inset 0 12px 22px rgba(255, 255, 255, 0.72),
    inset 0 -18px 30px rgba(127, 29, 29, 0.25),
    0 18px 34px rgba(120, 53, 15, 0.32),
    0 0 0 7px rgba(255, 255, 255, 0.22);
}

.premium-wheel-start-button {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 50% 12%, rgba(255, 255, 255, 0.38), transparent 32%),
    linear-gradient(180deg, #b45309 0%, #7c2d12 52%, #431407 100%);
  box-shadow:
    inset 0 9px 15px rgba(255, 255, 255, 0.2),
    inset 0 -12px 22px rgba(67, 20, 7, 0.55),
    0 14px 0 rgba(67, 20, 7, 0.36),
    0 22px 28px rgba(67, 20, 7, 0.34);
  text-shadow: 0 2px 4px rgba(67, 20, 7, 0.6);
}

.premium-wheel-start-button::before {
  content: '';
  position: absolute;
  inset: 8px 24px auto 24px;
  height: 16px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.38), transparent);
  pointer-events: none;
}

.premium-wheel-start-button:hover {
  filter: brightness(1.08);
}

.premium-wheel-start-button:disabled {
  background:
    radial-gradient(ellipse at 50% 12%, rgba(255, 255, 255, 0.28), transparent 32%),
    linear-gradient(180deg, #94a3b8 0%, #64748b 56%, #334155 100%);
  box-shadow:
    inset 0 7px 12px rgba(255, 255, 255, 0.16),
    inset 0 -10px 20px rgba(15, 23, 42, 0.42),
    0 10px 0 rgba(15, 23, 42, 0.18),
    0 18px 24px rgba(15, 23, 42, 0.2);
}


/* 第 257 批：玩家版資訊區整理 */
.premium-wheel-start-button + section,
.premium-wheel-stage + section {
  backdrop-filter: blur(14px);
}


/* 第 257 批：結果彈窗高級視覺 */
.premium-result-card {
  animation: premium-result-pop 0.28s ease-out;
}

.premium-result-dot-bg {
  background-image: radial-gradient(rgba(255, 255, 255, 0.65) 1px, transparent 1px);
  background-size: 18px 18px;
}

@keyframes premium-result-pop {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.96);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}


/* 第 257 批：中獎彩帶 / 金沙顯示修復 */
.premium-win-confetti {
  position: absolute;
  top: -14vh;
  border-radius: 3px;
  box-shadow: 0 0 12px rgba(255, 255, 255, 0.45);
  animation-name: premium-confetti-fall-fixed;
  animation-timing-function: ease-in;
  animation-fill-mode: forwards;
  will-change: transform, opacity;
}

.premium-gold-rain {
  position: absolute;
  top: -12vh;
  border-radius: 999px;
  background: radial-gradient(circle at 30% 30%, #ffffff 0%, #fef3c7 28%, #facc15 58%, #d97706 100%);
  box-shadow:
    0 0 12px rgba(250, 204, 21, 0.95),
    0 0 22px rgba(249, 115, 22, 0.5);
  animation-name: premium-gold-rain-fall-fixed;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
  will-change: transform, opacity;
}

@keyframes premium-confetti-fall-fixed {
  0% {
    opacity: 0;
    transform: translate3d(0, -12vh, 0) rotate(0deg);
  }

  10% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translate3d(24px, 116vh, 0) rotate(760deg);
  }
}

@keyframes premium-gold-rain-fall-fixed {
  0% {
    opacity: 0;
    transform: translate3d(0, -10vh, 0) scale(0.7);
  }

  12% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translate3d(-16px, 116vh, 0) scale(1.18);
  }
}


/* 第 257 批：中獎高級閃光 / 獎項跳動 / 金色光暈 */
.premium-win-flash {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 44%, rgba(255, 255, 255, 0.92), transparent 12%),
    radial-gradient(circle at 50% 48%, rgba(250, 204, 21, 0.52), transparent 32%);
  animation: premium-win-flash-burst 1.2s ease-out forwards;
  mix-blend-mode: screen;
}

.premium-win-golden-aura {
  position: absolute;
  left: 50%;
  top: 45%;
  width: min(74vw, 420px);
  height: min(74vw, 420px);
  border-radius: 999px;
  background:
    radial-gradient(circle, rgba(250, 204, 21, 0.32), transparent 62%),
    conic-gradient(from 0deg, transparent, rgba(255, 255, 255, 0.42), transparent, rgba(250, 204, 21, 0.48), transparent);
  filter: blur(1px);
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.72);
  animation: premium-golden-aura-pulse 2.8s ease-out forwards;
}

.premium-prize-bounce {
  animation: premium-prize-bounce 1.05s ease-in-out 0.12s 3;
}

@keyframes premium-win-flash-burst {
  0% {
    opacity: 0;
    transform: scale(0.25);
  }

  18% {
    opacity: 1;
    transform: scale(1.04);
  }

  100% {
    opacity: 0;
    transform: scale(2.2);
  }
}

@keyframes premium-golden-aura-pulse {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.65) rotate(0deg);
  }

  18% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.35) rotate(180deg);
  }
}

@keyframes premium-prize-bounce {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }

  35% {
    transform: translateY(-8px) scale(1.12) rotate(-2deg);
  }

  68% {
    transform: translateY(2px) scale(0.98) rotate(2deg);
  }
}


/* 第 257 批：前台 / 後台精簡清爽操作 */
aside {
  scroll-behavior: smooth;
}

.premium-admin-section-card {
  border: 1px solid rgba(226, 232, 240, 0.85);
  background: rgba(248, 250, 252, 0.82);
}


/* 第 257 批：中獎彈窗獎項圖片放大 */
.premium-result-prize-image {
  box-shadow:
    inset 0 10px 18px rgba(255, 255, 255, 0.22),
    inset 0 -14px 24px rgba(120, 53, 15, 0.18),
    0 22px 38px rgba(67, 20, 7, 0.28);
}

.premium-result-prize-image img {
  filter: drop-shadow(0 10px 18px rgba(15, 23, 42, 0.28));
}

@media (max-width: 380px) {
  .premium-result-prize-image {
    width: 7.25rem;
    height: 7.25rem;
    font-size: 4rem;
  }
}


/* 第 257 批：轉盤扇區獎項圖片顯示 */
.premium-wheel-prize-media {
  display: flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow:
    inset 0 2px 5px rgba(255, 255, 255, 0.65),
    0 5px 12px rgba(120, 53, 15, 0.24);
  font-size: 24px;
  font-weight: 900;
}

.premium-wheel-prize-media img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 4px;
  filter: drop-shadow(0 3px 5px rgba(15, 23, 42, 0.22));
}

@media (max-width: 380px) {
  .premium-wheel-prize-media {
    width: 40px;
    height: 40px;
    font-size: 22px;
  }
}


/* 第 257 批：分享活動設定版面優化 */
.premium-share-card-title {
  text-wrap: balance;
}


/* 第 257 批：分享前自訂預覽彈窗 */
.premium-share-preview-card {
  animation: premium-share-preview-pop 0.25s ease-out;
}

@keyframes premium-share-preview-pop {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.96);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}


/* 第 257 批：前台最近轉盤紀錄收合 */
.premium-recent-logs-collapsed {
  background: linear-gradient(135deg, rgba(255, 247, 237, 0.94), rgba(255, 237, 213, 0.88));
}


/* 第 257 批：前台分享卡片精簡品牌列 */
.line-clamp-2 {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}


/* 第 257 批：轉盤中心按鈕樣式可調整 */
.premium-wheel-center {
  transition:
    width 0.2s ease,
    height 0.2s ease,
    font-size 0.2s ease,
    background 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
}


/* 第 257 批：整體遊戲主題色 / 華麗精緻視覺 */
.premium-wheel-page {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 18% 10%, rgba(255, 255, 255, calc(var(--premium-glow-alpha) * 0.35)), transparent 24%),
    radial-gradient(circle at 82% 18%, color-mix(in srgb, var(--premium-accent-color) 45%, transparent), transparent 26%),
    linear-gradient(135deg, var(--premium-bg-from), var(--premium-bg-to));
}

.premium-luxury-bg-dots {
  background-image:
    radial-gradient(circle, rgba(255, 255, 255, 0.32) 1px, transparent 1.5px),
    radial-gradient(circle, color-mix(in srgb, var(--premium-accent-color) 42%, transparent) 1px, transparent 1.5px);
  background-position: 0 0, 13px 18px;
  background-size: 28px 28px, 34px 34px;
  opacity: calc(var(--premium-glow-alpha) * 0.55);
  animation: premium-luxury-dots-float 18s linear infinite;
}

@keyframes premium-luxury-dots-float {
  from {
    transform: translate3d(0, 0, 0);
  }

  to {
    transform: translate3d(-34px, 28px, 0);
  }
}

.premium-game-shell,
.premium-wheel-stage-card,
.premium-share-preview-card {
  box-shadow:
    0 24px 64px rgba(67, 20, 7, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.16);
}

.premium-wheel-page .premium-wheel-start-button {
  background:
    radial-gradient(circle at 50% 18%, rgba(255, 255, 255, 0.3), transparent 32%),
    linear-gradient(180deg, var(--premium-button-color), var(--premium-button-dark-color));
}

.premium-wheel-page .premium-wheel-stage-card {
  background:
    radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.7), transparent 46%),
    var(--premium-panel-color);
}

.premium-wheel-page [data-glass-card='true'] {
  backdrop-filter: blur(16px);
  background: rgba(255, 255, 255, 0.16);
}


/* 第 257 批：主題色前台同步顯示修復 */
.premium-wheel-page {
  background:
    radial-gradient(circle at 18% 10%, rgba(255, 255, 255, calc(var(--premium-glow-alpha) * 0.35)), transparent 24%),
    radial-gradient(circle at 82% 18%, color-mix(in srgb, var(--premium-accent-color) 45%, transparent), transparent 26%),
    linear-gradient(135deg, var(--premium-bg-from), var(--premium-bg-to)) !important;
}

.premium-wheel-page .premium-wheel-stage-card,
.premium-wheel-page .premium-share-preview-card {
  background:
    radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.72), transparent 48%),
    var(--premium-panel-color) !important;
}

.premium-wheel-page .premium-wheel-start-button {
  background:
    radial-gradient(circle at 50% 18%, rgba(255, 255, 255, 0.3), transparent 32%),
    linear-gradient(180deg, var(--premium-button-color), var(--premium-button-dark-color)) !important;
}

.premium-wheel-page .premium-player-badge,
.premium-wheel-page .premium-theme-accent {
  color: var(--premium-text-color) !important;
}

.premium-wheel-page .premium-luxury-bg-dots {
  opacity: calc(var(--premium-glow-alpha) * 0.55);
}


/* 第 257 批：底框主題色 / 品牌預設風格 */
.premium-wheel-page {
  background:
    radial-gradient(circle at 18% 10%, rgba(255, 255, 255, calc(var(--premium-glow-alpha) * 0.28)), transparent 24%),
    radial-gradient(circle at 82% 18%, color-mix(in srgb, var(--frame-highlight-color) 42%, transparent), transparent 26%),
    linear-gradient(180deg, var(--frame-top-color), var(--frame-middle-color) 46%, var(--frame-bottom-color)) !important;
}

.premium-game-shell,
.premium-wheel-page > .relative,
.premium-wheel-page .mx-auto.max-w-md {
  border-color: color-mix(in srgb, var(--frame-border-color) 72%, white) !important;
}

.premium-wheel-page .premium-wheel-stage-card {
  border-color: color-mix(in srgb, var(--frame-border-color) 70%, white) !important;
  box-shadow:
    0 26px 58px color-mix(in srgb, var(--frame-bottom-color) 36%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.3) !important;
}

.premium-wheel-page .premium-wheel-shell,
.premium-wheel-page .premium-wheel-ring {
  box-shadow:
    0 20px 38px color-mix(in srgb, var(--frame-bottom-color) 32%, transparent),
    0 0 0 8px color-mix(in srgb, var(--frame-border-color) 26%, transparent) !important;
}

.premium-wheel-page .premium-wheel-start-button {
  background:
    radial-gradient(circle at 50% 18%, rgba(255, 255, 255, 0.3), transparent 32%),
    linear-gradient(180deg, var(--frame-middle-color), var(--frame-bottom-color)) !important;
}

.premium-wheel-page .premium-brand-card,
.premium-wheel-page [data-frame-card='true'] {
  border-color: color-mix(in srgb, var(--frame-border-color) 62%, white) !important;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--frame-top-color) 72%, white), color-mix(in srgb, var(--frame-middle-color) 64%, white)) !important;
}


/* 第 257 批：紅框內橘色遊戲主畫布變色修復 */
.premium-game-board {
  border-style: solid !important;
  border-width: 1px !important;
  background:
    radial-gradient(circle at 20% 8%, rgba(255, 255, 255, 0.22), transparent 24%),
    radial-gradient(circle at 82% 18%, color-mix(in srgb, var(--frame-highlight-color) 38%, transparent), transparent 28%),
    linear-gradient(180deg, var(--frame-top-color) 0%, var(--frame-middle-color) 48%, var(--frame-bottom-color) 100%) !important;
}

.premium-game-board::before {
  content: "";
  pointer-events: none;
  position: absolute;
  inset: 10px;
  border-radius: 28px;
  border: 1px solid color-mix(in srgb, var(--frame-border-color) 45%, transparent);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    0 0 24px color-mix(in srgb, var(--frame-highlight-color) 20%, transparent);
}

.premium-game-board-dots {
  opacity: 0.85;
  filter: hue-rotate(0deg);
}

.premium-game-board .premium-brand-card {
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--frame-top-color) 78%, white), color-mix(in srgb, var(--frame-middle-color) 65%, white)) !important;
  border-color: color-mix(in srgb, var(--frame-border-color) 62%, white) !important;
}

.premium-game-board .premium-wheel-stage {
  border-color: color-mix(in srgb, var(--frame-border-color) 72%, white) !important;
}


/* 第 257 批：管理預覽跟隨 / 指針樣式可調 / 全域還原復原 */
.premium-wheel-pointer {
  --wheel-pointer-scale: 1;
  --wheel-pointer-top-color: #334155;
  --wheel-pointer-arrow-color: #020617;
  --wheel-pointer-dot-color: #fde047;
  transform: translateX(-50%) scale(var(--wheel-pointer-scale));
  transform-origin: 50% 18px;
}

.premium-wheel-pointer-preview {
  --wheel-pointer-scale: 1;
  --wheel-pointer-top-color: #334155;
  --wheel-pointer-arrow-color: #020617;
  --wheel-pointer-dot-color: #fde047;
  transform: scale(var(--wheel-pointer-scale));
  transform-origin: 50% 18px;
}

.premium-wheel-pointer-head {
  background: linear-gradient(180deg, color-mix(in srgb, var(--wheel-pointer-top-color) 76%, white), var(--wheel-pointer-top-color));
}

.premium-wheel-pointer-arrow {
  border-top-color: var(--wheel-pointer-arrow-color);
}

.premium-wheel-pointer-dot {
  background: var(--wheel-pointer-dot-color);
}

@media (min-width: 1280px) {
  .premium-wheel-page main.xl\:sticky {
    max-height: calc(100vh - 3rem);
  }
}


/* 第 257 批：每區塊獨立還原 / 後台預覽跟隨修正 */
@media (min-width: 1280px) {
  .premium-admin-preview-fixed {
    position: sticky !important;
    top: 24px !important;
    align-self: flex-start !important;
    height: calc(100vh - 48px);
    overflow: visible;
  }

  .premium-admin-preview-fixed > div {
    max-height: calc(100vh - 48px);
  }
}

.premium-admin-section-restore-button {
  white-space: nowrap;
}


/* 第 257 批：經典橘色主題 / 3D 指針一鍵套用 */
.premium-wheel-pointer {
  filter:
    drop-shadow(0 16px 14px rgba(15, 23, 42, 0.42))
    drop-shadow(0 3px 0 rgba(255, 255, 255, 0.12));
}

.premium-wheel-pointer-head {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 18%, rgba(255, 255, 255, 0.42), transparent 22%),
    linear-gradient(145deg, color-mix(in srgb, var(--wheel-pointer-top-color) 72%, white), var(--wheel-pointer-top-color) 48%, color-mix(in srgb, var(--wheel-pointer-top-color) 72%, black));
  box-shadow:
    inset 0 4px 8px rgba(255, 255, 255, 0.24),
    inset 0 -7px 10px rgba(0, 0, 0, 0.26),
    0 8px 14px rgba(15, 23, 42, 0.28);
}

.premium-wheel-pointer-head::after {
  content: "";
  position: absolute;
  inset: 3px 8px auto 8px;
  height: 38%;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.28);
  filter: blur(1px);
}

.premium-wheel-pointer-arrow {
  border-top-color: var(--wheel-pointer-arrow-color);
  filter:
    drop-shadow(0 10px 10px rgba(15, 23, 42, 0.36))
    drop-shadow(0 -2px 0 color-mix(in srgb, var(--wheel-pointer-arrow-color) 70%, white));
}

.premium-wheel-pointer-highlight {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.36), transparent 82%);
  filter: blur(0.5px);
  opacity: 0.8;
}

.premium-wheel-pointer-dot {
  background:
    radial-gradient(circle at 34% 28%, rgba(255, 255, 255, 0.75), transparent 28%),
    linear-gradient(145deg, color-mix(in srgb, var(--wheel-pointer-dot-color) 86%, white), var(--wheel-pointer-dot-color));
  box-shadow:
    inset 0 2px 3px rgba(255, 255, 255, 0.32),
    inset 0 -2px 4px rgba(0, 0, 0, 0.22),
    0 2px 7px rgba(0, 0, 0, 0.3);
}


/* 第 257 批：後台右側玩家預覽 Sticky 跟隨修復 */
.premium-wheel-admin-mode {
  overflow-y: visible !important;
}

@media (min-width: 1280px) {
  .premium-wheel-admin-mode {
    min-height: 100vh;
  }

  .premium-wheel-admin-mode .premium-admin-preview-fixed {
    z-index: 30;
  }

  .premium-wheel-admin-mode aside {
    align-self: start;
  }
}


/* 第 257 批：後台右側玩家預覽 Fixed 固定修復 */
@media (min-width: 1280px) {
  .premium-wheel-admin-mode .premium-admin-layout-fixed-preview {
    grid-template-columns: 420px minmax(430px, 1fr);
    padding-right: 500px;
  }

  .premium-wheel-admin-mode .premium-admin-preview-fixed {
    position: fixed !important;
    top: 24px !important;
    right: max(24px, calc((100vw - 1280px) / 2 + 24px));
    width: 430px;
    height: calc(100vh - 48px);
    max-height: calc(100vh - 48px);
    z-index: 30;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    pointer-events: auto;
  }

  .premium-wheel-admin-mode .premium-admin-preview-fixed > div {
    width: 100%;
    max-height: calc(100vh - 48px);
  }
}

@media (min-width: 1536px) {
  .premium-wheel-admin-mode .premium-admin-layout-fixed-preview {
    padding-right: 540px;
  }

  .premium-wheel-admin-mode .premium-admin-preview-fixed {
    width: 460px;
  }
}


/* 第 257 批：轉盤旋轉時指針尖端左右抖動 */
.premium-wheel-pointer-tip-shake {
  animation: premium-pointer-tip-wiggle var(--wheel-pointer-tip-shake-speed, 70ms) ease-in-out infinite alternate;
  transform-origin: 50% 0;
}

@keyframes premium-pointer-tip-wiggle {
  0% {
    transform: translateX(-2px) rotate(-7deg);
  }

  100% {
    transform: translateX(2px) rotate(7deg);
  }
}


/* 第 257 批：指針卡點音效 / 震動節奏強化 */
.premium-wheel-pointer-tip-shake {
  filter:
    drop-shadow(0 12px 12px rgba(15, 23, 42, 0.42))
    brightness(1.08);
}


/* 第 257 批：後台滾動順暢 / 效能優化 */
@media (min-width: 1280px) {
  .premium-wheel-admin-mode .premium-admin-preview-fixed {
    pointer-events: auto;
  }

  .premium-wheel-admin-mode .premium-admin-preview-fixed * {
    pointer-events: auto;
  }
}

/* 後台模式降低重繪成本，讓左側設定長頁面滑動更順 */
.premium-wheel-admin-performance .premium-luxury-bg-dots {
  animation: none !important;
  opacity: 0.16 !important;
}

.premium-wheel-admin-performance .premium-dot-bg,
.premium-wheel-admin-performance .premium-result-dot-bg {
  animation: none !important;
}

.premium-wheel-admin-performance .backdrop-blur,
.premium-wheel-admin-performance .backdrop-blur-md {
  backdrop-filter: none !important;
}

.premium-wheel-admin-performance aside,
.premium-wheel-admin-performance main,
.premium-wheel-admin-performance section,
.premium-wheel-admin-performance .premium-game-board,
.premium-wheel-admin-performance .premium-wheel-stage,
.premium-wheel-admin-performance .premium-wheel-shell {
  will-change: auto !important;
}

/* 讓瀏覽器知道左側後台是主要滾動區，減少滾輪卡住 */
.premium-wheel-admin-performance {
  overscroll-behavior-y: auto;
  scroll-behavior: auto;
}


/* 第 257 批：右側固定玩家預覽可滾動 */
@media (min-width: 1280px) {
  .premium-wheel-admin-mode .premium-admin-preview-fixed {
    overflow: hidden;
  }

  .premium-wheel-admin-mode .premium-admin-preview-fixed .premium-scrollbar-y {
    overflow-y: auto !important;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    max-height: calc(100vh - 72px);
  }

  .premium-wheel-admin-mode .premium-admin-preview-fixed:hover .premium-scrollbar-y {
    scrollbar-width: thin;
  }
}


/* 第 257 批：後台快速導航 / 區塊定位 */
[data-admin-section] {
  scroll-margin-top: 24px;
}

@media (min-width: 1280px) {
  [data-admin-section] {
    scroll-margin-top: 32px;
  }
}


/* 第 257 批：後台功能區塊收合 */
.admin-collapse-body {
  overflow: hidden;
}

.admin-collapse-enter-active,
.admin-collapse-leave-active {
  transition:
    max-height 0.24s ease,
    opacity 0.2s ease,
    transform 0.2s ease;
}

.admin-collapse-enter-from,
.admin-collapse-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-6px);
}

.admin-collapse-enter-to,
.admin-collapse-leave-from {
  max-height: 4000px;
  opacity: 1;
  transform: translateY(0);
}

.admin-section-toggle-button {
  white-space: nowrap;
}


/* 第 257 批：後台收合狀態記憶 / 一鍵展開收合 */
.admin-section-toggle-button {
  min-width: 56px;
}

.admin-quick-nav-control {
  white-space: nowrap;
}


/* 第 257 批：前台玩家畫面清爽優化 */
.premium-front-hero {
  text-wrap: balance;
}

.premium-front-summary > div {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 10px 22px rgba(67, 20, 7, 0.16);
}

.premium-front-main-cta {
  letter-spacing: 0.08em;
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.24),
    inset 0 -8px 18px rgba(67, 20, 7, 0.24),
    0 16px 28px rgba(67, 20, 7, 0.32);
}

.premium-front-action-card {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 16px 28px rgba(67, 20, 7, 0.18);
}


/* 第 258 批：前台 VIP 精緻美化版 */
.premium-vip-front-board {
  isolation: isolate;
}

.premium-vip-light-beam {
  background: linear-gradient(90deg, transparent, rgba(255, 248, 196, 0.38), transparent);
  filter: blur(16px);
  transform: translateY(-45%) rotate(-3deg);
  opacity: 0.88;
}

.premium-vip-orb {
  position: absolute;
  z-index: 0;
  border-radius: 999px;
  filter: blur(20px);
  opacity: 0.58;
}

.premium-vip-orb-left {
  left: -3.5rem;
  top: 11rem;
  width: 8rem;
  height: 8rem;
  background: rgba(254, 240, 138, 0.42);
}

.premium-vip-orb-right {
  right: -4rem;
  top: 25rem;
  width: 9rem;
  height: 9rem;
  background: rgba(251, 191, 36, 0.3);
}

.premium-vip-header-card,
.premium-vip-hero,
.premium-vip-action-card,
.premium-vip-benefits article {
  position: relative;
}

.premium-vip-header-card::before,
.premium-vip-hero::before,
.premium-vip-action-card::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.28), transparent 26%),
    radial-gradient(circle at 90% 18%, rgba(254, 240, 138, 0.18), transparent 30%);
}

.premium-vip-logo-frame {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.45),
    0 14px 28px rgba(67, 20, 7, 0.26),
    0 0 0 5px rgba(255, 255, 255, 0.12);
}

.premium-vip-crown {
  animation: premiumVipCrownFloat 2.8s ease-in-out infinite;
}

.premium-vip-summary > div,
.premium-vip-benefits article {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 14px 26px rgba(67, 20, 7, 0.18);
}

.premium-vip-wheel-stage::before {
  content: '';
  position: absolute;
  inset: 0.45rem;
  z-index: 0;
  pointer-events: none;
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.58);
  box-shadow: inset 0 0 26px rgba(255, 251, 235, 0.75);
}

.premium-vip-wheel-stage > * {
  position: relative;
  z-index: 1;
}

@keyframes premiumVipCrownFloat {
  0%, 100% {
    transform: translateY(0) scale(1);
  }

  50% {
    transform: translateY(-4px) scale(1.04);
  }
}

@media (max-width: 420px) {
  .premium-front-summary {
    gap: 0.4rem;
  }

  .premium-front-summary > div {
    padding-left: 0.35rem;
    padding-right: 0.35rem;
  }
}

</style>
