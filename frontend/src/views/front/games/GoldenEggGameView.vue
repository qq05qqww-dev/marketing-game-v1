<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getGoldenEggCampaign,
  playGoldenEggDraw,
  verifyGoldenEggSerialCode
} from '../../../api/goldenEggApi.js'

const router = useRouter()
const route = useRoute()

const currentTimeTick = ref(Date.now())
const activityCountdownTimer = ref(null)
const onlineCampaignId = ref(null)
const isOnlineMode = ref(false)
const isLoadingRemoteCampaign = ref(false)
const remoteLoadMessage = ref('')
const remoteVerifiedSerialCode = ref('')
const remoteCampaignTitle = ref('')
const remoteCampaignStatus = ref('')
const remoteSerialMessageType = ref('info')
const remoteDrawNotice = ref('')
const remoteCrackDuration = computed(() => 2.8)

const GOLDEN_EGG_HISTORY_KEY = 'multi_game_platform_golden_egg_history_v1'
const GOLDEN_EGG_ADMIN_STATE_KEY = 'multi_game_platform_golden_egg_admin_state_v1'
const GOLDEN_EGG_ADMIN_SYNC_KEY = 'multi_game_platform_golden_egg_admin_sync_ping_v1'
const GOLDEN_EGG_SERIAL_CODES_KEY = 'multi_game_platform_golden_egg_serial_codes_v1'
const GOLDEN_EGG_SERIAL_REDEEM_LOG_KEY = 'multi_game_platform_golden_egg_serial_redeem_log_v1'

const cloneByJson = (value) => JSON.parse(JSON.stringify(value))

const safeJsonParse = (value, fallback = null) => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch (error) {
    console.warn('Golden egg JSON parse failed:', error)
    return fallback
  }
}


const campaign = reactive({
  brandName: 'Multi Game Platform',
  pageTitle: '砸金蛋抽獎',
  mainTitle: '砸金蛋中大奖',
  subTitle: '九宮格金蛋活動',
  heroTagline: '9 顆金蛋任你選，敲開就有機會中大獎',
  chanceText: '還有 3 次砸蛋機會',
  buttonText: '分享活動',
  shareHint: '請向主辦單位索取抽獎序號，輸入後可增加砸蛋機會。',
  noticeText: '本活動為原創互動版型，可自由替換品牌、獎項與活動內容。',
  activityStartAt: '',
  activityEndAt: '',
  activityNotStartedText: '活動尚未開始，請於指定時間再回來參加。',
  activityEndedText: '活動已結束，感謝你的參與。',
  activityRunningText: '活動進行中，請選擇一顆金蛋。',
  showActivityTimeSection: true,
  showActivityCountdown: true,
  activityCountdownTitle: '活動倒數',
  activityCountdownBgColor: 'rgba(0, 0, 0, 0.16)',
  activityCountdownTextColor: '#fef3c7',
  activityCountdownNumberColor: '#fde047',
  activityCountdownTitleTextSize: 12,
  activityCountdownNumberTextSize: 18,
  activityCountdownAlwaysShowSeconds: true,
  activityTimeBgColor: 'rgba(255, 255, 255, 0.10)',
  activityTimeBorderColor: 'rgba(255, 255, 255, 0.15)',
  activityTimeTitleColor: '#fef3c7',
  activityTimeCardBgColor: 'rgba(0, 0, 0, 0.14)',
  activityTimeTextColor: '#fef3c7',
  activityTimeRadius: 16,
  activityTimePadding: 12,
  activityTimeTitleTextSize: 12,
  activityTimeTextSize: 11,
  activityStatusBadgeTextSize: 10,
  logoText: '金蛋',
  websiteUrl: '',
  websiteButtonText: '官網',
  headerTitleTextSize: 16,
  headerTitleColor: '#ffffff',
  headerSubTitleColor: '#fef3c7',
  headerLogoTextSize: 12,
  headerLogoBgColor: '#fde047',
  headerLogoTextColor: '#991b1b',
  headerWebsiteTextSize: 12,
  headerWebsiteBgColor: 'rgba(255, 255, 255, 0.15)',
  headerWebsiteTextColor: '#ffffff',
  headerSideBoxWidth: 72,
  headerBoxHeight: 48,
  headerBoxRadius: 16,
  headerGap: 12,
  headerPaddingX: 16,
  headerPaddingY: 12,
  eggSize: 74,
  eggGridGap: 12,
  showEggNumber: true,
  eggNumberBgColor: '#7f1d1d',
  eggNumberTextColor: '#fef3c7',
  eggColorTop: '#fff7ad',
  eggColorMiddle: '#fde047',
  eggColorBottom: '#b45309',
  eggCardBgFrom: 'rgba(239, 68, 68, 0.4)',
  eggCardBgTo: 'rgba(127, 29, 29, 0.45)',
  showMarqueeSection: true,
  marqueeCustomText: '',
  marqueeBgColor: '#fde047',
  marqueeTextColor: '#991b1b',
  marqueeSpeed: 12,
  showPrizeShelfSection: true,
  prizeShelfTitle: 'PRIZE',
  prizeShelfSubTitle: '活動獎品',
  prizeShelfBgColor: '#fde047',
  prizeShelfTextColor: '#991b1b',
  prizeShelfItemBgTop: '#fff7ad',
  prizeShelfItemBgBottom: '#f59e0b',
  pageDotOpacity: 70,
  pageGlowOpacity: 34,
  stageBgOpacity: 22,
  stageBorderColor: '#fde68a',
  stageBorderOpacity: 25,
  stageInnerBorderOpacity: 18,
  stageRadius: 32,
  stagePadding: 16,
  resultModalBgFrom: '#dc2626',
  resultModalBgTo: '#450a0a',
  resultModalBorderColor: '#fde68a',
  resultIconBgColor: '#fde047',
  resultIconTextColor: '#991b1b',
  resultImageUrl: '',
  resultIconSize: 96,
  resultIconTextSize: 48,
  resultBadgeTextSize: 12,
  resultTitleTextSize: 24,
  resultTitleColor: '#ffffff',
  resultDescriptionTextSize: 14,
  resultDescriptionColor: '#fef3c7',
  resultPrimaryButtonText: '繼續查看',
  resultPrimaryButtonTextSize: 14,
  resultCopyButtonText: '複製結果',
  resultCopyButtonTextSize: 14,
  showResultCopyButton: true,
  showResultShareButton: true,
  shareTitle: '砸金蛋抽獎活動',
  shareDescription: '快來參加九宮格砸金蛋活動，敲開金蛋就有機會中大獎！',
  shareUrl: '',
  systemShareText: '🎉 九宮格砸金蛋抽獎活動\n輸入活動序號，立即砸金蛋抽好禮！',
  shareHashtags: '砸金蛋,抽獎活動',
  serialRedeemTitle: '輸入抽獎序號',
  serialRedeemPlaceholder: '請輸入主辦單位提供的序號',
  serialRedeemButtonText: '兌換砸蛋機會',
  serialRedeemSuccessText: '序號兌換成功，已增加砸蛋機會。',
  serialRedeemErrorText: '序號無效、已使用或不存在。',
  showSerialRedeemSection: true,
  serialRedeemBgColor: 'rgba(0, 0, 0, 0.16)',
  serialRedeemBorderColor: '#fde68a',
  serialRedeemTextColor: '#ffffff',
  serialRedeemHintColor: '#fef3c7',
  serialRedeemInputBgColor: '#ffffff',
  serialRedeemInputTextColor: '#991b1b',
  serialRedeemButtonBgColor: '#fde047',
  serialRedeemButtonTextColor: '#991b1b',
  serialRedeemRadius: 24,
  serialRedeemPadding: 12,
  serialRedeemTitleTextSize: 14,
  serialRedeemHintTextSize: 11,
  serialRedeemInputTextSize: 14,
  serialRedeemButtonTextSize: 14,
  showShareButtonSection: true,
  showSystemShareButton: true,
  systemShareButtonPaddingY: 12,
  systemShareButtonRadius: 16,
  systemShareButtonTextSize: 14,
  systemShareButtonText: '系統分享',
  systemShareButtonBgColor: 'rgba(255, 255, 255, 0.12)',
  systemShareButtonTextColor: '#ffffff',
  maxSerialRedeemErrors: 5,
  serialRedeemLockSeconds: 60,
  shareButtonRadius: 16,
  shareButtonTextSize: 12,
  shareButtonGap: 8,
  shareButtonPaddingY: 12,
  showBottomNav: true,
  bottomNavBgColor: 'rgba(127, 29, 29, 0.72)',
  bottomNavBorderColor: '#fde68a',
  bottomNavButtonBgColor: 'rgba(255, 255, 255, 0.12)',
  bottomNavButtonTextColor: '#fef3c7',
  bottomNavRadius: 24,
  bottomNavBottom: 12,
  bottomNavEggIcon: '🥚',
  bottomNavEggText: '重置',
  bottomNavShareIcon: '📣',
  bottomNavShareText: '分享',
  bottomNavResultIcon: '🎁',
  bottomNavResultText: '結果',
  bottomNavWebsiteIcon: '↩️',
  bottomNavWebsiteText: '官網',
  bottomNavPadding: 8,
  bottomNavButtonGap: 8,
  bottomNavButtonHeight: 54,
  bottomNavButtonRadius: 16,
  bottomNavIconSize: 18,
  bottomNavTextSize: 11,
  showRecentLogsSection: true,
  showRuleSection: true,
  showPrizeInfoSection: true,
  defaultRecentLogsOpen: false,
  defaultRuleOpen: false,
  defaultPrizeInfoOpen: false,
  logoImageUrl: '',
  bannerImageUrl: '',
  themeBgFrom: '#991b1b',
  themeBgMiddle: '#dc2626',
  themeBgTo: '#450a0a',
  themePanelColor: '#fff7ed',
  themeAccentColor: '#facc15',
  themeButtonColor: '#ef4444',
  themeButtonDarkColor: '#991b1b',
  enableWinConfetti: true,
  enableGoldRain: true,
  enableWinSound: false,
  winSoundUrl: '',
  winSoundVolume: 70,
  enableHammerSound: false,
  hammerSoundUrl: '',
  hammerSoundVolume: 60,
  winEffectDuration: 5,
  confettiCount: 48,
  goldRainCount: 54,
  ruleTitle: '活動規則',
  ruleContent: '每次砸蛋會消耗 1 次機會。\n點選任一金蛋後，系統會依獎項機率產生結果。\n分享活動可依設定增加砸蛋機會。\n獎項數量有限，送完為止。',
  prizeInfoTitle: '獎品說明',
  prizeInfoContent: '中獎結果會顯示於畫面與最近紀錄。\n實際兌換方式以主辦單位公告為準。\n請保留中獎畫面或截圖作為兌獎依據。'
})

const player = reactive({
  chances: 3,
  sharedCount: 0
})

const prizes = ref([
  {
    id: 'coupon-300',
    name: '折價券 300 元',
    shortName: '300',
    description: '下次消費可折抵 300 元',
    icon: '🎁',
    imageUrl: '',
    isEnabled: true,
    probability: 12,
    stock: 6,
    type: 'win',
    rank: 'first'
  },
  {
    id: 'coupon-200',
    name: '折價券 200 元',
    shortName: '200',
    description: '下次消費可折抵 200 元',
    icon: '🎟️',
    imageUrl: '',
    isEnabled: true,
    probability: 18,
    stock: 10,
    type: 'win',
    rank: 'second'
  },
  {
    id: 'coupon-100',
    name: '折價券 100 元',
    shortName: '100',
    description: '下次消費可折抵 100 元',
    icon: '🎫',
    imageUrl: '',
    isEnabled: true,
    probability: 25,
    stock: 20,
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
    probability: 45,
    stock: 9999,
    type: 'lose',
    rank: 'none'
  }
])

const defaultCampaignSnapshot = cloneByJson(campaign)
const defaultPrizesSnapshot = cloneByJson(prizes.value)

const applyGoldenEggAdminState = (payload) => {
  if (!payload || typeof payload !== 'object') return

  if (payload.campaign && typeof payload.campaign === 'object') {
    Object.assign(campaign, {
      ...cloneByJson(defaultCampaignSnapshot),
      ...payload.campaign
    })
  }

  if (Array.isArray(payload.prizes) && payload.prizes.length) {
    prizes.value = payload.prizes.map((prize, index) => ({
      id: prize.id || `admin-prize-${index + 1}`,
      name: prize.name || `獎項 ${index + 1}`,
      shortName: prize.shortName || prize.name || `獎${index + 1}`,
      description: prize.description || '請洽主辦單位兌換。',
      icon: prize.icon || '🎁',
      imageUrl: prize.imageUrl || '',
      isEnabled: prize.isEnabled !== false,
      probability: Number(prize.probability || 0),
      stock: Number(prize.stock ?? 0),
      type: prize.type === 'lose' ? 'lose' : 'win',
      rank: prize.rank || (prize.type === 'lose' ? 'none' : 'normal')
    }))
  }

  syncSectionOpenStateFromCampaign()
  updateChanceText()
}

const syncSectionOpenStateFromCampaign = () => {
  isRecentLogsOpen.value = Boolean(campaign.defaultRecentLogsOpen)
  isRulesOpen.value = Boolean(campaign.defaultRuleOpen)
  isPrizeInfoOpen.value = Boolean(campaign.defaultPrizeInfoOpen)
}

const loadGoldenEggAdminState = () => {
  if (typeof localStorage === 'undefined') return

  const saved = safeJsonParse(localStorage.getItem(GOLDEN_EGG_ADMIN_STATE_KEY), null)
  applyGoldenEggAdminState(saved)
}

const onlineModeLabel = computed(() => {
  if (!isOnlineMode.value) return ''

  const title = remoteCampaignTitle.value || campaign.pageTitle || campaign.mainTitle || '正式資料庫活動'

  return `正式資料庫模式｜ID ${onlineCampaignId.value}｜${title}`
})

const onlineModeStatusClass = computed(() => {
  if (!isOnlineMode.value) return 'border-white/15 bg-black/18 text-yellow-50'
  if (remoteCampaignStatus.value === 'ACTIVE') return 'border-emerald-200/40 bg-emerald-500/20 text-emerald-50'
  if (remoteCampaignStatus.value === 'DRAFT') return 'border-amber-200/40 bg-amber-500/20 text-amber-50'
  return 'border-white/15 bg-black/18 text-yellow-50'
})

const serialMessageClass = computed(() => {
  if (remoteSerialMessageType.value === 'success') return 'text-emerald-100'
  if (remoteSerialMessageType.value === 'error') return 'text-rose-100'
  return 'text-yellow-50'
})



const mapApiPrizeToLocalPrize = (prize = {}, index = 0) => {
  const stockTotal = Number(prize.stockTotal || 0)
  const stockUsed = Number(prize.stockUsed || 0)
  const remainStock = stockTotal > 0
    ? Math.max(0, stockTotal - stockUsed)
    : Number(prize.remainStock || 0)

  return {
    id: prize.id || `api-prize-${index + 1}`,
    name: prize.title || prize.name || `獎項 ${index + 1}`,
    shortName: prize.shortName || prize.title || prize.name || `獎${index + 1}`,
    description: prize.description || '請洽主辦單位兌換。',
    icon: prize.icon || (prize.type === 'LOSE' ? '🙂' : '🎁'),
    imageUrl: prize.imageUrl || '',
    isEnabled: prize.status !== 'DISABLED',
    probability: Number(prize.probability || 0),
    stock: remainStock,
    type: prize.type === 'LOSE' ? 'lose' : 'win',
    rank: prize.type === 'LOSE' ? 'none' : 'normal'
  }
}

const getLocalAdminCampaignFallback = () => {
  if (typeof localStorage === 'undefined') return null

  const saved = safeJsonParse(localStorage.getItem(GOLDEN_EGG_ADMIN_STATE_KEY), null)

  return saved?.campaign || null
}

const applyRemoteCampaignData = (apiCampaign = {}) => {
  // 第 350 批修正：
  // 正式資料庫模式必須完全以 API / PostgreSQL 回傳資料為準。
  // 不再混用本機 localStorage 的後台預覽設定，避免同一個正式網址：
  // - 電腦因為曾開過後台而顯示黑色蛋
  // - 手機因為沒有 localStorage 而顯示金色蛋
  Object.assign(campaign, cloneByJson(defaultCampaignSnapshot))

  remoteCampaignTitle.value = apiCampaign.title || ''
  remoteCampaignStatus.value = apiCampaign.status || ''
  campaign.pageTitle = apiCampaign.title || campaign.pageTitle
  campaign.mainTitle = apiCampaign.title || campaign.mainTitle
  campaign.subTitle = apiCampaign.gameType === 'GOLDEN_EGG' ? '正式資料庫砸金蛋活動' : campaign.subTitle
  campaign.heroTagline = apiCampaign.description || campaign.heroTagline
  campaign.noticeText = apiCampaign.description || campaign.noticeText
  campaign.activityStartAt = apiCampaign.startAt || ''
  campaign.activityEndAt = apiCampaign.endAt || ''

  // 第 353 批：正式前台顏色唯一來源 = PostgreSQL gameConfig.settings。
  // 手機和電腦不能再讀 localStorage 顏色，避免不同裝置不同步。
  const remoteSettings = apiCampaign.gameConfig?.settings && typeof apiCampaign.gameConfig.settings === 'object'
    ? apiCampaign.gameConfig.settings
    : {}

  if (Object.keys(remoteSettings).length) {
    Object.assign(campaign, remoteSettings)
  }

  campaign.eggSize = Number(remoteSettings.eggSize ?? campaign.eggSize ?? 74)
  campaign.eggCardSize = Number(remoteSettings.eggCardSize ?? campaign.eggCardSize ?? 128)
  campaign.eggGap = Number(remoteSettings.eggGap ?? remoteSettings.eggGridGap ?? campaign.eggGap ?? campaign.eggGridGap ?? 12)
  campaign.eggGridGap = campaign.eggGap

  // 若正式資料庫尚未存入金蛋顏色，統一使用預設金色。
  // 之後在後台按「立即同步前台」並寫入 gameConfig 後，所有裝置會同步使用資料庫顏色。
  campaign.eggColorTop = remoteSettings.eggColorTop || '#fff7ad'
  campaign.eggColorMiddle = remoteSettings.eggColorMiddle || '#fde047'
  campaign.eggColorBottom = remoteSettings.eggColorBottom || '#b45309'

  if (Array.isArray(apiCampaign.prizes) && apiCampaign.prizes.length) {
    prizes.value = apiCampaign.prizes.map(mapApiPrizeToLocalPrize)
  }

  syncSectionOpenStateFromCampaign()
  updateChanceText()
}

const getRouteCampaignId = () => {
  const value = route.query.campaignId || route.query.onlineCampaignId || route.params?.campaignId

  if (!value) return null

  const id = Number(value)

  return Number.isInteger(id) && id > 0 ? id : null
}

const loadGoldenEggRemoteState = async () => {
  const campaignId = getRouteCampaignId()

  if (!campaignId) {
    isOnlineMode.value = false
    onlineCampaignId.value = null
    return
  }

  isLoadingRemoteCampaign.value = true
  remoteLoadMessage.value = '正在讀取正式活動資料...'

  try {
    const apiCampaign = await getGoldenEggCampaign(campaignId)

    onlineCampaignId.value = campaignId
    isOnlineMode.value = true
    player.chances = 0
    remoteVerifiedSerialCode.value = ''
    remoteSerialMessageType.value = 'info'
    serialRedeemMessage.value = campaign.serialRedeemDescription || '請輸入主辦單位提供的序號，驗證成功後即可砸蛋。'

    applyRemoteCampaignData(apiCampaign)

    remoteLoadMessage.value = `已載入正式資料庫活動：${apiCampaign?.title || `ID ${campaignId}`}。`
  } catch (error) {
    console.error('讀取正式金蛋活動失敗：', error)
    isOnlineMode.value = false
    onlineCampaignId.value = null
    remoteCampaignTitle.value = ''
    remoteCampaignStatus.value = ''
    remoteLoadMessage.value = '正式活動讀取失敗，已改用本機展示資料。'
  } finally {
    isLoadingRemoteCampaign.value = false
  }
}

const handleGoldenEggAdminStorageSync = (event) => {
  if (!event) return

  if (event.key === GOLDEN_EGG_ADMIN_STATE_KEY || event.key === GOLDEN_EGG_ADMIN_SYNC_KEY) {
    loadGoldenEggAdminState()
  }
}

const eggCount = 9
const eggs = ref(
  Array.from({ length: eggCount }, (_, index) => ({
    id: `egg-${index + 1}`,
    number: index + 1,
    status: 'idle',
    prize: null
  }))
)

const isCracking = ref(false)
const activeEggId = ref('')
const resultPrize = ref(null)
const showResultModal = ref(false)
const showWinEffects = ref(false)
const showShareMessage = ref(false)
const shareMessage = ref('')
const serialCodeInput = ref('')
const serialRedeemMessage = ref('')
const isSerialRedeeming = ref(false)
const serialRedeemErrorCount = ref(0)
const serialRedeemLockedUntil = ref(0)
const serialRedeemLockLeftSeconds = ref(0)
const recentLogs = ref([])
const isRecentLogsOpen = ref(false)
const isRulesOpen = ref(false)
const isPrizeInfoOpen = ref(false)
const hammerAudio = ref(null)
const winAudio = ref(null)

const confettiColors = [
  '#f97316',
  '#ef4444',
  '#facc15',
  '#22c55e',
  '#38bdf8',
  '#a855f7',
  '#ec4899'
]

const activePrizes = computed(() => {
  return prizes.value.filter((prize) => prize.isEnabled !== false)
})

const availablePrizePool = computed(() => {
  return activePrizes.value.filter((prize) => Number(prize.stock) > 0 && Number(prize.probability) > 0)
})

const canPlay = computed(() => {
  return isActivityPlayable.value && player.chances > 0 && availablePrizePool.value.length > 0 && !isCracking.value
})

const statusText = computed(() => {
  if (!isActivityPlayable.value) return activityStatusText.value
  if (isCracking.value) return '金蛋敲擊中，請稍候結果揭曉。'
  if (!availablePrizePool.value.length) return '目前獎品已抽完，請等待主辦單位更新。'
  if (player.chances <= 0) return '目前沒有砸蛋機會，請輸入主辦單位提供的序號兌換。'
  return `目前還有 ${player.chances} 次砸蛋機會，請選擇一顆金蛋。`
})

const resultLabel = computed(() => {
  if (!resultPrize.value) return ''
  return resultPrize.value.type === 'lose' ? '再接再厲' : '恭喜中獎'
})

const resultBadgeClass = computed(() => {
  if (!resultPrize.value) return 'bg-slate-100 text-slate-500'
  return resultPrize.value.type === 'lose'
    ? 'bg-slate-100 text-slate-600'
    : 'bg-yellow-100 text-yellow-700'
})

const safeWebsiteUrl = computed(() => {
  const value = String(campaign.websiteUrl || '').trim()

  if (!value) return ''

  if (/^https?:\/\//i.test(value)) {
    return value
  }

  return `https://${value}`
})

const websiteButtonText = computed(() => {
  return String(campaign.websiteButtonText || '').trim() || '官網'
})

const headerTitleStyle = computed(() => {
  const fontSize = Math.min(26, Math.max(12, Number(campaign.headerTitleTextSize || 16)))

  return {
    fontSize: `${fontSize}px`,
    color: campaign.headerTitleColor || '#ffffff'
  }
})

const headerSubTitleStyle = computed(() => {
  return {
    color: campaign.headerSubTitleColor || '#fef3c7'
  }
})

const normalizedHeaderBoxHeight = computed(() => {
  return Math.min(72, Math.max(38, Number(campaign.headerBoxHeight || 48)))
})

const normalizedHeaderSideBoxWidth = computed(() => {
  return Math.min(112, Math.max(56, Number(campaign.headerSideBoxWidth || 72)))
})

const normalizedHeaderBoxRadius = computed(() => {
  return Math.min(28, Math.max(8, Number(campaign.headerBoxRadius || 16)))
})

const headerBarStyle = computed(() => {
  const gap = Math.min(24, Math.max(6, Number(campaign.headerGap || 12)))
  const paddingX = Math.min(28, Math.max(8, Number(campaign.headerPaddingX || 16)))
  const paddingY = Math.min(22, Math.max(6, Number(campaign.headerPaddingY || 12)))

  return {
    gridTemplateColumns: `${normalizedHeaderSideBoxWidth.value}px minmax(0, 1fr) ${normalizedHeaderSideBoxWidth.value}px`,
    gap: `${gap}px`,
    padding: `${paddingY}px ${paddingX}px`
  }
})

const headerLogoStyle = computed(() => {
  const fontSize = Math.min(22, Math.max(10, Number(campaign.headerLogoTextSize || 12)))

  return {
    height: `${normalizedHeaderBoxHeight.value}px`,
    borderRadius: `${normalizedHeaderBoxRadius.value}px`,
    fontSize: `${fontSize}px`,
    background: campaign.headerLogoBgColor || '#fde047',
    color: campaign.headerLogoTextColor || '#991b1b'
  }
})

const headerWebsiteButtonStyle = computed(() => {
  const fontSize = Math.min(22, Math.max(10, Number(campaign.headerWebsiteTextSize || 12)))

  return {
    height: `${normalizedHeaderBoxHeight.value}px`,
    borderRadius: `${normalizedHeaderBoxRadius.value}px`,
    fontSize: `${fontSize}px`,
    background: campaign.headerWebsiteBgColor || 'rgba(255, 255, 255, 0.15)',
    color: campaign.headerWebsiteTextColor || '#ffffff'
  }
})

const eggGridStyle = computed(() => {
  const cardSize = Math.min(160, Math.max(96, Number(campaign.eggCardSize || 128)))
  const gap = Math.min(24, Math.max(6, Number(campaign.eggGridGap || campaign.eggGap || 12)))

  return {
    width: '100%',
    maxWidth: `calc(${cardSize}px * 3 + ${gap}px * 2)`,
    margin: '0 auto',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: `${gap}px`,
    justifyContent: 'center'
  }
})

const eggCardStyle = computed(() => {
  const cardSize = Math.min(150, Math.max(104, Number(campaign.eggCardSize || 128)))

  return {
    width: '100%',
    maxWidth: `${cardSize}px`,
    minWidth: '0',
    aspectRatio: '0.88 / 1',
    minHeight: `${Math.round(cardSize * 1.08)}px`,
    overflow: 'hidden',
    background: `linear-gradient(180deg, ${campaign.eggCardBgFrom || 'rgba(239, 68, 68, 0.4)'}, ${campaign.eggCardBgTo || 'rgba(127, 29, 29, 0.45)'})`
  }
})


const eggShellStyle = computed(() => {
  const size = Math.min(120, Math.max(48, Number(campaign.eggSize || 74)))
  const eggColorTop = campaign.eggColorTop || '#fff7ad'
  const eggColorMiddle = campaign.eggColorMiddle || '#fde047'
  const eggColorBottom = campaign.eggColorBottom || '#b45309'

  return {
    width: `min(${size}px, 72%)`,
    height: 'auto',
    aspectRatio: '1 / 1.24',
    maxHeight: '78%',
    '--egg-color-top': eggColorTop,
    '--egg-color-middle': eggColorMiddle,
    '--egg-color-bottom': eggColorBottom,
    background: `
      radial-gradient(circle at 34% 22%, rgba(255, 255, 255, 0.95), transparent 14%),
      radial-gradient(circle at 64% 72%, rgba(161, 98, 7, 0.32), transparent 24%),
      linear-gradient(135deg, ${eggColorTop} 0%, ${eggColorMiddle} 36%, ${eggColorBottom} 100%)
    `
  }
})


const eggNumberStyle = computed(() => {
  return {
    background: campaign.eggNumberBgColor || '#7f1d1d',
    color: campaign.eggNumberTextColor || '#fef3c7'
  }
})

const serialRedeemStyle = computed(() => {
  const radius = Math.min(34, Math.max(12, Number(campaign.serialRedeemRadius || 24)))
  const padding = Math.min(24, Math.max(8, Number(campaign.serialRedeemPadding || 12)))

  return {
    borderRadius: `${radius}px`,
    padding: `${padding}px`,
    background: campaign.serialRedeemBgColor || 'rgba(0, 0, 0, 0.16)',
    borderColor: campaign.serialRedeemBorderColor || '#fde68a'
  }
})

const serialRedeemTitleStyle = computed(() => {
  const fontSize = Math.min(24, Math.max(12, Number(campaign.serialRedeemTitleTextSize || 14)))

  return {
    fontSize: `${fontSize}px`,
    color: campaign.serialRedeemTextColor || '#ffffff'
  }
})

const serialRedeemHintStyle = computed(() => {
  const fontSize = Math.min(18, Math.max(10, Number(campaign.serialRedeemHintTextSize || 11)))

  return {
    fontSize: `${fontSize}px`,
    color: campaign.serialRedeemHintColor || '#fef3c7'
  }
})

const serialRedeemInputStyle = computed(() => {
  const fontSize = Math.min(20, Math.max(12, Number(campaign.serialRedeemInputTextSize || 14)))

  return {
    fontSize: `${fontSize}px`,
    background: campaign.serialRedeemInputBgColor || '#ffffff',
    color: campaign.serialRedeemInputTextColor || '#991b1b'
  }
})

const serialRedeemButtonStyle = computed(() => {
  const fontSize = Math.min(20, Math.max(12, Number(campaign.serialRedeemButtonTextSize || 14)))

  return {
    fontSize: `${fontSize}px`,
    background: campaign.serialRedeemButtonBgColor || '#fde047',
    color: campaign.serialRedeemButtonTextColor || '#991b1b'
  }
})

const shareButtonGridStyle = computed(() => {
  const gap = Math.min(18, Math.max(4, Number(campaign.shareButtonGap || 8)))

  return {
    gap: `${gap}px`
  }
})

const getShareButtonStyle = () => {
  const radius = Math.min(40, Math.max(0, Number(campaign.systemShareButtonRadius ?? campaign.shareButtonRadius ?? 16)))
  const fontSize = Math.min(28, Math.max(10, Number(campaign.systemShareButtonTextSize ?? campaign.shareButtonTextSize ?? 14)))
  const paddingY = Math.min(28, Math.max(6, Number(campaign.systemShareButtonPaddingY ?? campaign.shareButtonPaddingY ?? 12)))

  return {
    borderRadius: `${radius}px`,
    fontSize: `${fontSize}px`,
    paddingTop: `${paddingY}px`,
    paddingBottom: `${paddingY}px`,
    background: campaign.systemShareButtonBgColor || 'rgba(255, 255, 255, 0.12)',
    color: campaign.systemShareButtonTextColor || '#ffffff'
  }
}

const bottomNavStyle = computed(() => {
  const radius = Math.min(36, Math.max(12, Number(campaign.bottomNavRadius || 24)))
  const bottom = Math.min(48, Math.max(0, Number(campaign.bottomNavBottom || 12)))
  const padding = Math.min(18, Math.max(4, Number(campaign.bottomNavPadding || 8)))

  return {
    bottom: `${bottom}px`,
    padding: `${padding}px`,
    borderColor: campaign.bottomNavBorderColor || '#fde68a',
    background: campaign.bottomNavBgColor || 'rgba(127, 29, 29, 0.72)',
    borderRadius: `${radius}px`
  }
})

const bottomNavGridStyle = computed(() => {
  const gap = Math.min(18, Math.max(4, Number(campaign.bottomNavButtonGap || 8)))

  return {
    gap: `${gap}px`
  }
})

const bottomNavButtonStyle = computed(() => {
  const height = Math.min(82, Math.max(42, Number(campaign.bottomNavButtonHeight || 54)))
  const radius = Math.min(30, Math.max(8, Number(campaign.bottomNavButtonRadius || 16)))
  const textSize = Math.min(18, Math.max(9, Number(campaign.bottomNavTextSize || 11)))
  const iconSize = Math.min(32, Math.max(14, Number(campaign.bottomNavIconSize || 18)))

  return {
    minHeight: `${height}px`,
    borderRadius: `${radius}px`,
    fontSize: `${textSize}px`,
    background: campaign.bottomNavButtonBgColor || 'rgba(255, 255, 255, 0.12)',
    color: campaign.bottomNavButtonTextColor || '#fef3c7',
    '--bottom-nav-icon-size': `${iconSize}px`
  }
})

const bottomWebsiteIcon = computed(() => {
  return safeWebsiteUrl.value
    ? (campaign.bottomNavWebsiteIcon || '🔗')
    : (campaign.bottomNavWebsiteIcon || '↩️')
})

const bottomWebsiteText = computed(() => {
  return String(campaign.bottomNavWebsiteText || websiteButtonText.value || '官網').trim()
})

const parseCampaignDateTime = (value) => {
  if (!value) return null

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return null

  return date
}

const formatCampaignDateTime = (value) => {
  const date = parseCampaignDateTime(value)

  if (!date) return '未設定'

  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const activityStartDate = computed(() => parseCampaignDateTime(campaign.activityStartAt))
const activityEndDate = computed(() => parseCampaignDateTime(campaign.activityEndAt))

const activityStatus = computed(() => {
  const now = currentTimeTick.value
  const start = activityStartDate.value?.getTime()
  const end = activityEndDate.value?.getTime()

  if (start && now < start) return 'not-started'
  if (end && now > end) return 'ended'

  return 'running'
})

const isActivityPlayable = computed(() => activityStatus.value === 'running')

const activityStatusLabel = computed(() => {
  if (activityStatus.value === 'not-started') return '尚未開始'
  if (activityStatus.value === 'ended') return '已結束'

  return '進行中'
})

const activityStatusText = computed(() => {
  if (activityStatus.value === 'not-started') return campaign.activityNotStartedText || '活動尚未開始，請於指定時間再回來參加。'
  if (activityStatus.value === 'ended') return campaign.activityEndedText || '活動已結束，感謝你的參與。'

  return campaign.activityRunningText || '活動進行中，請選擇一顆金蛋。'
})

const activityStatusClass = computed(() => {
  if (activityStatus.value === 'not-started') return 'bg-amber-100 text-amber-700'
  if (activityStatus.value === 'ended') return 'bg-slate-100 text-slate-700'

  return 'bg-emerald-100 text-emerald-700'
})

const activityTimeBoxStyle = computed(() => {
  const radius = Math.min(30, Math.max(10, Number(campaign.activityTimeRadius || 16)))
  const padding = Math.min(24, Math.max(8, Number(campaign.activityTimePadding || 12)))

  return {
    borderRadius: `${radius}px`,
    padding: `${padding}px`,
    background: campaign.activityTimeBgColor || 'rgba(255, 255, 255, 0.10)',
    borderColor: campaign.activityTimeBorderColor || 'rgba(255, 255, 255, 0.15)'
  }
})

const activityTimeTitleStyle = computed(() => {
  const fontSize = Math.min(20, Math.max(10, Number(campaign.activityTimeTitleTextSize || 12)))

  return {
    fontSize: `${fontSize}px`,
    color: campaign.activityTimeTitleColor || '#fef3c7'
  }
})

const activityTimeCardStyle = computed(() => {
  const fontSize = Math.min(18, Math.max(10, Number(campaign.activityTimeTextSize || 11)))

  return {
    fontSize: `${fontSize}px`,
    background: campaign.activityTimeCardBgColor || 'rgba(0, 0, 0, 0.14)',
    color: campaign.activityTimeTextColor || '#fef3c7'
  }
})

const activityStatusBadgeStyle = computed(() => {
  const fontSize = Math.min(18, Math.max(9, Number(campaign.activityStatusBadgeTextSize || 10)))

  return {
    fontSize: `${fontSize}px`
  }
})

const activityCountdownTarget = computed(() => {
  currentTimeTick.value

  if (activityStatus.value === 'not-started') {
    return activityStartDate.value
  }

  if (activityStatus.value === 'running') {
    return activityEndDate.value
  }

  return null
})

const activityCountdownText = computed(() => {
  currentTimeTick.value

  const target = activityCountdownTarget.value

  if (!target) {
    return activityStatus.value === 'ended' ? '活動已結束' : '未設定倒數時間'
  }

  const diff = Math.max(0, target.getTime() - currentTimeTick.value)
  const totalSeconds = Math.floor(diff / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (days > 0) {
    const baseText = `${days} 天 ${String(hours).padStart(2, '0')} 小時 ${String(minutes).padStart(2, '0')} 分`

    if (campaign.activityCountdownAlwaysShowSeconds) {
      return `${baseText} ${String(seconds).padStart(2, '0')} 秒`
    }

    return baseText
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

const activityCountdownLabel = computed(() => {
  if (activityStatus.value === 'not-started') return '距離活動開始'
  if (activityStatus.value === 'running') return '距離活動結束'

  return '活動狀態'
})

const activityCountdownStyle = computed(() => {
  return {
    background: campaign.activityCountdownBgColor || 'rgba(0, 0, 0, 0.16)',
    color: campaign.activityCountdownTextColor || '#fef3c7'
  }
})

const activityCountdownTitleStyle = computed(() => {
  const fontSize = Math.min(20, Math.max(10, Number(campaign.activityCountdownTitleTextSize || 12)))

  return {
    fontSize: `${fontSize}px`,
    color: campaign.activityCountdownTextColor || '#fef3c7'
  }
})

const activityCountdownNumberStyle = computed(() => {
  const fontSize = Math.min(34, Math.max(14, Number(campaign.activityCountdownNumberTextSize || 18)))

  return {
    fontSize: `${fontSize}px`,
    color: campaign.activityCountdownNumberColor || '#fde047'
  }
})

const playerSummaryItems = computed(() => {
  return [
    {
      label: '剩餘次數',
      value: player.chances,
      subText: '可砸蛋'
    },
    {
      label: '已分享',
      value: player.sharedCount,
      subText: '分享次數'
    },
    {
      label: '金蛋數',
      value: eggCount,
      subText: '九宮格'
    }
  ]
})

const prizePreviewItems = computed(() => {
  return prizes.value
    .filter((prize) => prize.isEnabled !== false)
    .slice(0, 5)
    .map((prize) => ({
      id: prize.id,
      icon: prize.icon || '🎁',
      imageUrl: prize.imageUrl || '',
      name: prize.shortName || prize.name || '獎品',
      type: prize.type || 'win'
    }))
})

const marqueeText = computed(() => {
  const customText = String(campaign.marqueeCustomText || '').trim()

  if (customText) return customText

  if (!recentLogs.value.length) {
    return '歡迎參加九宮格砸金蛋活動｜選一顆金蛋敲開你的今日驚喜｜獎項數量有限送完為止'
  }

  const latest = recentLogs.value[0]

  return `最新紀錄：金蛋 ${latest.eggNumber} 開出 ${latest.prizeName}｜繼續砸蛋還有機會中大獎`
})

const marqueeStyle = computed(() => {
  const speed = Math.min(28, Math.max(6, Number(campaign.marqueeSpeed || 12)))

  return {
    background: campaign.marqueeBgColor || '#fde047',
    '--golden-marquee-text-color': campaign.marqueeTextColor || '#991b1b',
    '--golden-marquee-speed': `${speed}s`
  }
})

const prizeShelfStyle = computed(() => {
  return {
    background: campaign.prizeShelfBgColor || '#fde047',
    color: campaign.prizeShelfTextColor || '#991b1b',
    '--golden-prize-item-bg-top': campaign.prizeShelfItemBgTop || '#fff7ad',
    '--golden-prize-item-bg-bottom': campaign.prizeShelfItemBgBottom || '#f59e0b'
  }
})

const pageVisualStyle = computed(() => {
  const dotOpacity = Math.min(100, Math.max(0, Number(campaign.pageDotOpacity || 70))) / 100
  const glowOpacity = Math.min(100, Math.max(0, Number(campaign.pageGlowOpacity || 34))) / 100

  return {
    '--golden-page-dot-opacity': dotOpacity,
    '--golden-page-glow-opacity': glowOpacity
  }
})

const stageStyle = computed(() => {
  const bgOpacity = Math.min(100, Math.max(0, Number(campaign.stageBgOpacity || 22))) / 100
  const borderOpacity = Math.min(100, Math.max(0, Number(campaign.stageBorderOpacity || 25))) / 100
  const innerBorderOpacity = Math.min(100, Math.max(0, Number(campaign.stageInnerBorderOpacity || 18))) / 100
  const radius = Math.min(48, Math.max(16, Number(campaign.stageRadius || 32)))
  const padding = Math.min(28, Math.max(10, Number(campaign.stagePadding || 16)))

  return {
    borderColor: `color-mix(in srgb, ${campaign.stageBorderColor || '#fde68a'} ${Math.round(borderOpacity * 100)}%, transparent)`,
    borderRadius: `${radius}px`,
    padding: `${padding}px`,
    background: `
      radial-gradient(circle at 50% 0%, rgba(250, 204, 21, ${Math.min(0.45, bgOpacity + 0.06)}), transparent 32%),
      linear-gradient(180deg, rgba(127, 29, 29, ${bgOpacity + 0.14}), rgba(69, 10, 10, ${bgOpacity}))
    `,
    '--golden-stage-inner-border-opacity': innerBorderOpacity
  }
})

const resultModalStyle = computed(() => {
  return {
    background: `linear-gradient(180deg, ${campaign.resultModalBgFrom || '#dc2626'}, ${campaign.resultModalBgTo || '#450a0a'})`,
    borderColor: campaign.resultModalBorderColor || '#fde68a'
  }
})

const resultIconStyle = computed(() => {
  const iconSize = Math.min(150, Math.max(64, Number(campaign.resultIconSize || 96)))
  const iconTextSize = Math.min(82, Math.max(28, Number(campaign.resultIconTextSize || 48)))

  return {
    width: `${iconSize}px`,
    height: `${iconSize}px`,
    fontSize: `${iconTextSize}px`,
    background: campaign.resultIconBgColor || '#fde047',
    color: campaign.resultIconTextColor || '#991b1b'
  }
})

const resultImageUrl = computed(() => {
  const prizeImageUrl = String(resultPrize.value?.imageUrl || '').trim()
  const globalImageUrl = String(campaign.resultImageUrl || '').trim()

  return prizeImageUrl || globalImageUrl
})

const resultBadgeStyle = computed(() => {
  const fontSize = Math.min(20, Math.max(10, Number(campaign.resultBadgeTextSize || 12)))

  return {
    fontSize: `${fontSize}px`
  }
})

const resultTitleStyle = computed(() => {
  const fontSize = Math.min(40, Math.max(16, Number(campaign.resultTitleTextSize || 24)))

  return {
    fontSize: `${fontSize}px`,
    color: campaign.resultTitleColor || '#ffffff'
  }
})

const resultDescriptionStyle = computed(() => {
  const fontSize = Math.min(24, Math.max(12, Number(campaign.resultDescriptionTextSize || 14)))

  return {
    fontSize: `${fontSize}px`,
    color: campaign.resultDescriptionColor || '#fef3c7'
  }
})

const resultPrimaryButtonStyle = computed(() => {
  const fontSize = Math.min(22, Math.max(12, Number(campaign.resultPrimaryButtonTextSize || 14)))

  return {
    fontSize: `${fontSize}px`
  }
})

const resultCopyButtonStyle = computed(() => {
  const fontSize = Math.min(22, Math.max(12, Number(campaign.resultCopyButtonTextSize || 14)))

  return {
    fontSize: `${fontSize}px`
  }
})

const sectionToggleText = (isOpen) => {
  return isOpen ? '收合' : '展開'
}

const recentLogsPreview = computed(() => {
  return recentLogs.value.slice(0, isRecentLogsOpen.value ? 8 : 2)
})

const ruleLineCount = computed(() => {
  return String(campaign.ruleContent || '')
    .split('\n')
    .filter((line) => line.trim())
    .length
})

const prizeInfoLineCount = computed(() => {
  return String(campaign.prizeInfoContent || '')
    .split('\n')
    .filter((line) => line.trim())
    .length
})

const normalizedEffectDuration = computed(() => {
  return Math.min(10, Math.max(2, Number(campaign.winEffectDuration || 5)))
})

const confettiPieces = computed(() => {
  const count = Math.min(120, Math.max(0, Number(campaign.confettiCount || 0)))

  return Array.from({ length: count }, (_, index) => ({
    id: `confetti-${index}`,
    style: {
      left: `${(index * 17 + 8) % 100}%`,
      backgroundColor: confettiColors[index % confettiColors.length],
      animationDelay: `${(index % 12) * 0.06}s`,
      animationDuration: `${Math.max(2, normalizedEffectDuration.value - 1) + (index % 5) * 0.1}s`,
      width: `${7 + (index % 4)}px`,
      height: `${12 + (index % 5)}px`
    }
  }))
})

const goldRainPieces = computed(() => {
  const count = Math.min(140, Math.max(0, Number(campaign.goldRainCount || 0)))

  return Array.from({ length: count }, (_, index) => ({
    id: `gold-${index}`,
    style: {
      left: `${(index * 23 + 9) % 100}%`,
      animationDelay: `${(index % 14) * 0.055}s`,
      animationDuration: `${Math.max(2.4, normalizedEffectDuration.value - 0.5) + (index % 6) * 0.08}s`,
      width: `${5 + (index % 4)}px`,
      height: `${5 + (index % 4)}px`
    }
  }))
})

const updateChanceText = () => {
  campaign.chanceText = `還有 ${player.chances} 次砸蛋機會`
}

const pickPrize = () => {
  const pool = availablePrizePool.value
  if (!pool.length) return null

  const total = pool.reduce((sum, prize) => sum + Number(prize.probability || 0), 0)
  const target = Math.random() * total
  let current = 0

  for (const prize of pool) {
    current += Number(prize.probability || 0)
    if (target <= current) return prize
  }

  return pool[pool.length - 1]
}

const playAudio = async (audioRef, enabled, volume) => {
  if (!enabled || !audioRef.value) return

  try {
    audioRef.value.pause()
    audioRef.value.currentTime = 0
    audioRef.value.volume = Math.min(1, Math.max(0, Number(volume || 0) / 100))
    await audioRef.value.play()
  } catch (error) {
    console.warn('Audio play failed:', error)
  }
}

const loadHistory = () => {
  recentLogs.value = safeJsonParse(localStorage.getItem(GOLDEN_EGG_HISTORY_KEY), []) || []
}

const saveHistory = (prize, eggNumber) => {
  const item = {
    id: `golden-egg-${Date.now()}`,
    gameType: 'GOLDEN_EGG',
    gameName: campaign.pageTitle,
    prizeId: prize?.id || '',
    prizeName: prize?.name || '未知結果',
    prizeType: prize?.type || 'lose',
    prizeRank: prize?.rank || 'none',
    eggNumber,
    createdAt: new Date().toLocaleString('zh-TW')
  }

  const nextLogs = [item, ...recentLogs.value].slice(0, 12)
  recentLogs.value = nextLogs
  localStorage.setItem(GOLDEN_EGG_HISTORY_KEY, JSON.stringify(nextLogs))
}

const triggerWinEffects = () => {
  showWinEffects.value = true

  window.setTimeout(() => {
    showWinEffects.value = false
  }, normalizedEffectDuration.value * 1000)
}

const crackEggWithRemoteApi = async (egg) => {
  if (!onlineCampaignId.value) return
  if (!remoteVerifiedSerialCode.value) {
    remoteSerialMessageType.value = 'error'
    serialRedeemMessage.value = '請先輸入並驗證抽獎序號。'
    return
  }

  isCracking.value = true
  activeEggId.value = egg.id
  resultPrize.value = null
  showResultModal.value = false
  remoteDrawNotice.value = '金蛋敲擊中，請稍候 2～3 秒，正在由後端正式抽獎...'

  eggs.value = eggs.value.map((item) => ({
    ...item,
    status: item.id === egg.id ? 'cracking' : item.status
  }))

  await playAudio(hammerAudio, campaign.enableHammerSound, campaign.hammerSoundVolume)

  try {
    const drawResult = await playGoldenEggDraw(onlineCampaignId.value, {
      gameType: 'GOLDEN_EGG',
      serialCode: remoteVerifiedSerialCode.value,
      playerName: '',
      playerPhone: '',
      playerEmail: '',
      resultPayload: {
        eggNumber: egg.number
      },
      note: '前台金蛋正式 API 串接'
    })

    const prize = mapApiPrizeToLocalPrize(drawResult.prize || drawResult.result || {}, 0)

    window.setTimeout(async () => {
      const remainingSerialChances = Number(drawResult?.result?.remainingSerialChances ?? Math.max(0, player.chances - 1))
      player.chances = remainingSerialChances
      updateChanceText()

      if (remainingSerialChances <= 0) {
        remoteVerifiedSerialCode.value = ''
      }

      eggs.value = eggs.value.map((item) => {
        if (item.id !== egg.id) return item

        return {
          ...item,
          status: 'opened',
          prize
        }
      })

      resultPrize.value = prize
      remoteDrawNotice.value = prize.type === 'win'
        ? `恭喜中獎：${prize.name || prize.shortName || '獎項'}！`
        : '這次沒有中獎，請輸入新的序號再試一次。'
      saveHistory(prize, egg.number)

      if (prize.type === 'win') {
        await playAudio(winAudio, campaign.enableWinSound, campaign.winSoundVolume)
        triggerWinEffects()
      }

      window.setTimeout(() => {
        showResultModal.value = true
      }, 360)
      isCracking.value = false
      activeEggId.value = ''
      remoteSerialMessageType.value = 'info'
      if (player.chances > 0) {
        remoteDrawNotice.value = `抽獎完成，結果已顯示。此序號還剩 ${player.chances} 次機會，可繼續選金蛋。`
        serialRedeemMessage.value = `此序號還剩 ${player.chances} 次機會，可繼續選金蛋。`
      } else {
        remoteDrawNotice.value = '抽獎完成，結果已顯示。本次序號已使用完畢，請輸入新的序號才能再次抽獎。'
        serialRedeemMessage.value = '本次序號已使用完畢，請輸入新的序號。'
      }
    }, remoteCrackDuration.value * 1000)
  } catch (error) {
    console.error('正式金蛋抽獎失敗：', error)
    eggs.value = eggs.value.map((item) => ({
      ...item,
      status: item.id === egg.id ? 'idle' : item.status
    }))
    remoteDrawNotice.value = ''
    remoteSerialMessageType.value = 'error'
    serialRedeemMessage.value = error.message || '正式抽獎失敗，請稍後再試。'
    isCracking.value = false
    activeEggId.value = ''
  }
}

const crackEgg = async (egg) => {
  if (!canPlay.value) return
  if (!egg || egg.status === 'opened') return

  if (isOnlineMode.value) {
    await crackEggWithRemoteApi(egg)
    return
  }

  const prize = pickPrize()
  if (!prize) return

  isCracking.value = true
  activeEggId.value = egg.id
  resultPrize.value = null
  showResultModal.value = false

  eggs.value = eggs.value.map((item) => ({
    ...item,
    status: item.id === egg.id ? 'cracking' : item.status
  }))

  await playAudio(hammerAudio, campaign.enableHammerSound, campaign.hammerSoundVolume)

  window.setTimeout(async () => {
    player.chances = Math.max(0, player.chances - 1)
    updateChanceText()

    if (Number(prize.stock) > 0 && Number(prize.stock) < 9999) {
      prize.stock = Number(prize.stock) - 1
    }

    eggs.value = eggs.value.map((item) => {
      if (item.id !== egg.id) return item

      return {
        ...item,
        status: 'opened',
        prize
      }
    })

    resultPrize.value = prize
    saveHistory(prize, egg.number)

    if (prize.type !== 'lose') {
      triggerWinEffects()
      await playAudio(winAudio, campaign.enableWinSound, campaign.winSoundVolume)
    }

    window.setTimeout(() => {
      showResultModal.value = true
      isCracking.value = false
      activeEggId.value = ''
    }, 480)
  }, 980)
}

const resetEggBoard = () => {
  eggs.value = Array.from({ length: eggCount }, (_, index) => ({
    id: `egg-${index + 1}-${Date.now()}`,
    number: index + 1,
    status: 'idle',
    prize: null
  }))

  resultPrize.value = null
  showResultModal.value = false
  isCracking.value = false
  activeEggId.value = ''
}

// 第 376 批：分享區重置，只保留系統分享。
const getSystemShareUrl = () => {
  const customUrl = String(campaign.shareUrl || '').trim()

  if (customUrl) return customUrl

  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href)
    url.searchParams.set('campaignId', String(onlineCampaignId.value || getRouteCampaignId() || 1))
    return url.toString()
  }

  return `https://marketing-game-v1-em29.vercel.app/games/golden-egg?campaignId=${onlineCampaignId.value || getRouteCampaignId() || 1}`
}

const getSystemShareTitle = () => {
  return String(campaign.shareTitle || campaign.pageTitle || campaign.mainTitle || '九宮格砸金蛋抽獎活動').trim()
}

const getSystemShareBody = () => {
  return String(campaign.systemShareText || campaign.shareDescription || campaign.heroTagline || '輸入活動序號，立即砸金蛋抽好禮！').trim()
}

const getSystemShareFullText = () => {
  return [getSystemShareBody(), getSystemShareUrl()].filter(Boolean).join('\n')
}

const isSerialRedeemLocked = computed(() => {
  return serialRedeemLockedUntil.value > Date.now()
})

const updateSerialRedeemLockCountdown = () => {
  if (!isSerialRedeemLocked.value) {
    serialRedeemLockLeftSeconds.value = 0
    return
  }

  serialRedeemLockLeftSeconds.value = Math.ceil((serialRedeemLockedUntil.value - Date.now()) / 1000)

  window.setTimeout(updateSerialRedeemLockCountdown, 1000)
}

const addSerialRedeemLog = (payload) => {
  const logs = safeJsonParse(localStorage.getItem(GOLDEN_EGG_SERIAL_REDEEM_LOG_KEY), []) || []
  const nextLogs = [
    {
      id: `redeem-${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdAtText: new Date().toLocaleString('zh-TW'),
      ...payload
    },
    ...logs
  ].slice(0, 200)

  localStorage.setItem(GOLDEN_EGG_SERIAL_REDEEM_LOG_KEY, JSON.stringify(nextLogs))
}

const getSerialCodes = () => {
  return safeJsonParse(localStorage.getItem(GOLDEN_EGG_SERIAL_CODES_KEY), []) || []
}

const saveSerialCodes = (codes = []) => {
  localStorage.setItem(GOLDEN_EGG_SERIAL_CODES_KEY, JSON.stringify(codes))
}

const isSerialCodeExpired = (item) => {
  if (!item?.expireAt) return false

  const expireTime = new Date(item.expireAt).getTime()

  if (Number.isNaN(expireTime)) return false

  return expireTime < Date.now()
}

const redeemSerialCode = async () => {
  if (isSerialRedeeming.value) return

  const code = String(serialCodeInput.value || '').trim().toUpperCase()

  serialRedeemMessage.value = ''

  if (!code) {
    remoteSerialMessageType.value = 'error'
    serialRedeemMessage.value = '請先輸入抽獎序號。'
    return
  }

  isSerialRedeeming.value = true

  try {
    if (isOnlineMode.value && onlineCampaignId.value) {
      const result = await verifyGoldenEggSerialCode(onlineCampaignId.value, code)

      if (!result.valid) {
        remoteSerialMessageType.value = 'error'
        serialRedeemMessage.value = result.message || campaign.serialRedeemErrorText || '序號無效、已使用或不存在。'
        return
      }

      remoteVerifiedSerialCode.value = code
      remoteDrawNotice.value = '序號已驗證，請選擇一顆金蛋開始正式抽獎。'
      const rewardChance = Math.max(1, Number(result.serialCode?.remainingChance || result.serialCode?.rewardChance || 1))
      player.chances = rewardChance
      updateChanceText()
      serialCodeInput.value = ''
      remoteSerialMessageType.value = 'success'
      serialRedeemMessage.value = `${campaign.serialRedeemSuccessText || '序號驗證成功，請選擇一顆金蛋。'}｜目前剩餘 ${rewardChance} 次。`
      return
    }
    const codes = getSerialCodes()
    const target = codes.find((item) => String(item.code || '').toUpperCase() === code)

    if (!target || target.usedAt || target.isEnabled === false) {
      serialRedeemMessage.value = campaign.serialRedeemErrorText || '序號無效、已使用或不存在。'
      return
    }

    const rewardChance = Math.max(1, Number(target.rewardChance || 1))

    target.usedAt = new Date().toISOString()
    target.usedAtText = new Date().toLocaleString('zh-TW')
    target.usedBy = 'front-player'

    saveSerialCodes(codes)

    player.chances += rewardChance
    updateChanceText()
    serialCodeInput.value = ''
    serialRedeemMessage.value = `${campaign.serialRedeemSuccessText || '序號兌換成功，已增加砸蛋機會。'}目前還有 ${player.chances} 次。`
  } finally {
    isSerialRedeeming.value = false
  }
}


const shareCampaign = async () => {
  const title = getSystemShareTitle()
  const text = getSystemShareBody()
  const url = getSystemShareUrl()
  const fallbackText = getSystemShareFullText()

  try {
    if (navigator.share) {
      await navigator.share({
        title,
        text,
        url
      })
      noticeText.value = '系統分享已開啟。'
    } else {
      await navigator.clipboard.writeText(fallbackText)
      noticeText.value = '分享文字已複製，可貼到社群或訊息 App。'
    }

    player.sharedCount += 1
    shareMessage.value = '分享內容已送出或複製。抽獎機會請使用主辦單位提供的序號兌換。'
    showShareMessage.value = true

    window.setTimeout(() => {
      showShareMessage.value = false
      shareMessage.value = ''
    }, 2600)
  } catch (error) {
    if (error?.name === 'AbortError') return

    console.warn('系統分享失敗：', error)

    try {
      await navigator.clipboard.writeText(fallbackText)
      noticeText.value = '系統分享失敗，已改為複製分享文字。'
    } catch (copyError) {
      noticeText.value = fallbackText
    }
  }
}

const copyResultText = async () => {
  if (!resultPrize.value) return

  const openedEgg = eggs.value.find((egg) => egg.prize?.id === resultPrize.value?.id)

  const payload = [
    `活動名稱：${campaign.pageTitle}`,
    `金蛋編號：${openedEgg?.number || '-'}`,
    `抽獎結果：${resultPrize.value.type === 'lose' ? '未中獎' : '中獎'}`,
    `獎項名稱：${resultPrize.value.name}`,
    `獎項說明：${resultPrize.value.description}`,
    `抽獎時間：${new Date().toLocaleString('zh-TW')}`
  ].join('\n')

  try {
    await navigator.clipboard.writeText(payload)
    shareMessage.value = '已複製砸蛋結果。'
    showShareMessage.value = true
    window.setTimeout(() => {
      showShareMessage.value = false
      shareMessage.value = ''
    }, 2200)
  } catch (error) {
    window.prompt('瀏覽器不支援自動複製，請手動複製：', payload)
  }
}

const goBack = () => {
  router.back()
}

const closeResultModal = () => {
  showResultModal.value = false
}

onMounted(async () => {
  loadGoldenEggAdminState()
  syncSectionOpenStateFromCampaign()
  updateChanceText()
  loadHistory()
  await loadGoldenEggRemoteState()

  if (!activityCountdownTimer.value) {
    activityCountdownTimer.value = window.setInterval(() => {
      currentTimeTick.value = Date.now()
    }, 1000)
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleGoldenEggAdminStorageSync)
  }
})

onUnmounted(() => {
  if (activityCountdownTimer.value) {
    window.clearInterval(activityCountdownTimer.value)
    activityCountdownTimer.value = null
  }

  if (typeof window !== 'undefined') {
    window.removeEventListener('storage', handleGoldenEggAdminStorageSync)
  }
})
</script>

<template>
  <div
    class="golden-egg-page min-h-screen overflow-hidden text-white"
    :style="{
      '--egg-bg-from': campaign.themeBgFrom,
      '--egg-bg-middle': campaign.themeBgMiddle,
      '--egg-bg-to': campaign.themeBgTo,
      '--egg-accent': campaign.themeAccentColor,
      '--egg-button': campaign.themeButtonColor,
      '--egg-button-dark': campaign.themeButtonDarkColor,
      '--egg-panel': campaign.themePanelColor,
      ...pageVisualStyle
    }"
  >
    <audio
      v-if="campaign.hammerSoundUrl"
      ref="hammerAudio"
      :src="campaign.hammerSoundUrl"
      preload="auto"
    />
    <audio
      v-if="campaign.winSoundUrl"
      ref="winAudio"
      :src="campaign.winSoundUrl"
      preload="auto"
    />

    <div
      v-if="showWinEffects"
      class="pointer-events-none fixed inset-0 z-40 overflow-hidden"
    >
      <span
        v-if="campaign.enableWinConfetti"
        v-for="piece in confettiPieces"
        :key="piece.id"
        class="golden-egg-confetti"
        :style="piece.style"
      />
      <span
        v-if="campaign.enableGoldRain"
        v-for="piece in goldRainPieces"
        :key="piece.id"
        class="golden-egg-rain"
        :style="piece.style"
      />
    </div>

    <div class="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-24 pt-4 sm:max-w-lg md:max-w-2xl">
      <header
        class="relative z-10 mb-3 grid items-center rounded-3xl border border-white/15 bg-white/10 shadow-2xl backdrop-blur"
        :style="headerBarStyle"
      >
        <div
          class="flex h-12 w-full items-center justify-center rounded-2xl px-2 font-black shadow-lg"
          :style="headerLogoStyle"
        >
          {{ campaign.logoText }}
        </div>

        <div class="min-w-0 text-center">
          <p
            class="truncate text-[11px] font-black uppercase tracking-[0.28em]"
            :style="headerSubTitleStyle"
          >
            {{ campaign.brandName }}
          </p>
          <h1
            class="truncate font-black tracking-wide"
            :style="headerTitleStyle"
          >
            {{ campaign.pageTitle }}
          </h1>
        </div>

        <a
          v-if="safeWebsiteUrl"
          :href="safeWebsiteUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="flex h-12 w-full items-center justify-center rounded-2xl px-2 font-black shadow-lg transition hover:brightness-110"
          :style="headerWebsiteButtonStyle"
        >
          {{ websiteButtonText }}
        </a>

        <button
          v-else
          type="button"
          class="flex h-12 w-full items-center justify-center rounded-2xl px-2 font-black shadow-lg transition hover:brightness-110"
          :style="headerWebsiteButtonStyle"
          @click="goBack"
        >
          {{ websiteButtonText }}
        </button>
      </header>

      <main class="relative z-10 flex flex-1 flex-col">
        <section class="golden-egg-hero relative overflow-hidden rounded-[2rem] border border-yellow-200/30 px-5 pb-5 pt-6 text-center shadow-2xl">
          <div class="pointer-events-none absolute inset-0 opacity-60">
            <span class="golden-light golden-light-left" />
            <span class="golden-light golden-light-right" />
          </div>

          <div class="relative z-10">
            <p class="mx-auto mb-2 inline-flex rounded-full bg-yellow-300 px-4 py-1 text-xs font-black text-red-700 shadow-lg">
              {{ campaign.subTitle }}
            </p>

            <div class="golden-title-board mx-auto max-w-[320px] rounded-[1.4rem] border border-yellow-200/50 bg-red-950/24 px-4 py-3 shadow-2xl">
              <h2 class="golden-title text-4xl font-black leading-tight sm:text-5xl">
                {{ campaign.mainTitle }}
              </h2>
              <p class="mt-1 text-xs font-black tracking-[0.22em] text-yellow-100">
                LUCKY GOLDEN EGG
              </p>
            </div>

            <p class="mt-3 text-sm font-bold text-yellow-50">
              {{ campaign.heroTagline }}
            </p>

            <div class="mt-4 grid grid-cols-3 gap-2">
              <div
                v-for="item in playerSummaryItems"
                :key="item.label"
                class="rounded-2xl border border-white/15 bg-white/12 px-3 py-2 shadow-lg backdrop-blur"
              >
                <p class="text-[11px] font-bold text-yellow-100">
                  {{ item.label }}
                </p>
                <p class="text-2xl font-black text-white">
                  {{ item.value }}
                </p>
                <p class="text-[10px] font-bold text-yellow-50/80">
                  {{ item.subText }}
                </p>
              </div>
            </div>

            <div
              v-if="isOnlineMode || remoteLoadMessage"
              class="mt-3 rounded-2xl border px-4 py-2 text-xs font-black"
              :class="onlineModeStatusClass"
            >
              <span v-if="isLoadingRemoteCampaign">正在讀取正式資料庫活動...</span>
              <span v-else-if="isOnlineMode">{{ onlineModeLabel }}</span>
              <span v-else>{{ remoteLoadMessage }}</span>
            </div>
            <div
              v-if="remoteDrawNotice"
              class="mt-3 rounded-2xl border border-yellow-200/40 bg-yellow-300/15 px-4 py-2 text-center text-xs font-black text-yellow-50"
            >
              {{ remoteDrawNotice }}
            </div>

            <p class="mt-3 rounded-2xl bg-black/18 px-4 py-2 text-xs font-bold text-yellow-50">
              {{ statusText }}
            </p>

            <div
              v-if="campaign.showActivityTimeSection"
              class="mt-3 border text-left"
              :style="activityTimeBoxStyle"
            >
              <div class="mb-2 flex items-center justify-between gap-2">
                <p
                  class="font-black"
                  :style="activityTimeTitleStyle"
                >
                  活動時間
                </p>
                <span
                  class="rounded-full px-3 py-1 font-black"
                  :class="activityStatusClass"
                  :style="activityStatusBadgeStyle"
                >
                  {{ activityStatusLabel }}
                </span>
              </div>

              <div class="grid grid-cols-1 gap-2 text-[11px] font-bold text-yellow-50/85 sm:grid-cols-2">
                <div
                  class="rounded-xl px-3 py-2"
                  :style="activityTimeCardStyle"
                >
                  開始：{{ formatCampaignDateTime(campaign.activityStartAt) }}
                </div>
                <div
                  class="rounded-xl px-3 py-2"
                  :style="activityTimeCardStyle"
                >
                  結束：{{ formatCampaignDateTime(campaign.activityEndAt) }}
                </div>
              </div>

              <div
                v-if="campaign.showActivityCountdown"
                class="mt-3 rounded-2xl px-3 py-3 text-center"
                :style="activityCountdownStyle"
              >
                <p
                  class="font-black"
                  :style="activityCountdownTitleStyle"
                >
                  {{ campaign.activityCountdownTitle }}｜{{ activityCountdownLabel }}
                </p>

                <p
                  class="mt-1 font-black tracking-wide"
                  :style="activityCountdownNumberStyle"
                >
                  {{ activityCountdownText }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          v-if="campaign.showMarqueeSection"
          class="golden-marquee mt-4 overflow-hidden rounded-[1.25rem] border border-yellow-200/35 px-3 py-2 shadow-xl"
          :style="marqueeStyle"
        >
          <div class="golden-marquee-track text-xs font-black">
            {{ marqueeText }}
          </div>
        </section>

        <section
          class="golden-egg-stage relative mt-4 flex-1 border shadow-2xl backdrop-blur"
          :style="stageStyle"
        >
          <div class="mb-3 flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.2em] text-yellow-100">
                Golden Egg Board
              </p>
              <h3 class="text-lg font-black text-white">
                選一顆金蛋敲開
              </h3>
            </div>

            <button
              type="button"
              class="rounded-2xl border border-yellow-200/30 bg-yellow-300 px-3 py-2 text-xs font-black text-red-700 shadow-lg transition hover:bg-yellow-200 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="isCracking"
              @click="resetEggBoard"
            >
              重置金蛋
            </button>
          </div>

          <div
            class="golden-egg-grid grid grid-cols-3"
            :style="eggGridStyle"
          >
            <button
              v-for="egg in eggs"
              :key="egg.id"
              type="button"
              class="golden-egg-card group relative flex aspect-[0.88] flex-col items-center justify-center rounded-[1.65rem] border border-yellow-200/35 bg-gradient-to-b from-red-500/40 to-red-900/45 shadow-xl transition disabled:cursor-not-allowed"
              :class="[
                egg.status === 'cracking' ? 'is-cracking' : '',
                egg.status === 'opened' ? 'is-opened' : '',
                activeEggId === egg.id ? 'is-active' : '',
                isOnlineMode && activeEggId === egg.id && egg.status === 'cracking' ? 'golden-egg-remote-cracking' : ''
              ]"
              :disabled="!canPlay || egg.status === 'opened'"
              :style="eggCardStyle"
              @click="crackEgg(egg)"
            >
              <span
                v-if="egg.status === 'cracking'"
                class="golden-hammer"
              >
                🔨
              </span>

              <span
                v-if="egg.status !== 'opened'"
                class="golden-egg-shell"
                :style="eggShellStyle"
              >
                <span class="egg-shine" />
                <span class="egg-star egg-star-a">✦</span>
                <span class="egg-star egg-star-b">✦</span>
                <span
                  v-if="campaign.showEggNumber"
                  class="egg-number"
                  :style="eggNumberStyle"
                >
                  {{ egg.number }}
                </span>
              </span>

              <span
                v-else
                class="golden-egg-opened"
              >
                <span class="broken-shell broken-left" />
                <span class="broken-shell broken-right" />
                <span class="prize-pop">
                  <img
                    v-if="egg.prize?.imageUrl"
                    :src="egg.prize.imageUrl"
                    alt="獎品圖片"
                    class="h-8 w-8 rounded-xl object-cover"
                  />
                  <span
                    v-else
                    class="text-2xl"
                  >
                    {{ egg.prize?.icon || '🎁' }}
                  </span>
                  <span class="mt-1 line-clamp-2 px-1 text-center text-[11px] font-black text-yellow-50">
                    {{ egg.prize?.shortName || egg.prize?.name }}
                  </span>
                </span>
              </span>

              <span class="absolute bottom-2 rounded-full bg-black/20 px-2 py-1 text-[10px] font-black text-yellow-100">
                GOLD {{ egg.number }}
              </span>
            </button>
          </div>

          <div
            v-if="campaign.showSerialRedeemSection"
            class="mt-4 border"
            :style="serialRedeemStyle"
          >
            <div class="mb-3">
              <p
                class="font-black"
                :style="serialRedeemTitleStyle"
              >
                {{ campaign.serialRedeemTitle }}
              </p>
              <p
                class="mt-1 font-bold"
                :style="serialRedeemHintStyle"
              >
                輸入主辦單位產生的序號，可兌換砸蛋機會。
              </p>
            </div>

            <div class="flex flex-col gap-2 sm:flex-row">
              <input
                v-model="serialCodeInput"
                type="text"
                :placeholder="campaign.serialRedeemPlaceholder"
                class="min-h-[48px] flex-1 rounded-2xl border border-white/15 px-4 font-black uppercase outline-none placeholder:text-slate-400"
                :style="serialRedeemInputStyle"
                @keyup.enter="redeemSerialCode"
              />

              <button
                type="button"
                class="rounded-2xl px-5 py-3 font-black shadow-xl transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                :style="serialRedeemButtonStyle"
                :disabled="isCracking || isSerialRedeeming"
                @click="redeemSerialCode"
              >
                {{ isSerialRedeemLocked ? `${serialRedeemLockLeftSeconds} 秒後再試` : campaign.serialRedeemButtonText }}
              </button>
            </div>

            <p
              v-if="serialRedeemMessage"
              class="mt-2 rounded-2xl bg-white/12 px-3 py-2 text-xs font-black text-yellow-50"
            >
              {{ serialRedeemMessage }}
            </p>
          </div>

          <div
            v-if="campaign.showShareButtonSection && campaign.showSystemShareButton"
            class="mt-3 grid grid-cols-1"
            :style="shareButtonGridStyle"
          >
            <button
              type="button"
              class="border border-white/20 px-3 font-black shadow-xl transition hover:brightness-110"
              :style="getShareButtonStyle()"
              @click="shareCampaign"
            >
              {{ campaign.systemShareButtonText || '系統分享' }}
            </button>
          </div>

          <div
            v-if="campaign.showPrizeShelfSection"
            class="golden-prize-shelf mt-4 rounded-[1.6rem] border border-yellow-200/45 p-3 shadow-2xl"
            :style="prizeShelfStyle"
          >
            <div class="mb-2 flex items-center justify-between px-1">
              <p class="text-xs font-black tracking-[0.18em]">
                {{ campaign.prizeShelfTitle }}
              </p>
              <p class="text-xs font-black">
                {{ campaign.prizeShelfSubTitle }}
              </p>
            </div>

            <div class="grid grid-cols-5 gap-2">
              <div
                v-for="item in prizePreviewItems"
                :key="item.id"
                class="golden-prize-item"
                :class="item.type === 'lose' ? 'is-lose' : ''"
              >
                <img
                  v-if="item.imageUrl"
                  :src="item.imageUrl"
                  alt="獎品圖片"
                  class="h-6 w-6 rounded-lg object-cover"
                />
                <span
                  v-else
                  class="text-xl leading-none"
                >
                  {{ item.icon }}
                </span>
                <span class="mt-1 line-clamp-1 text-[10px] font-black leading-none">
                  {{ item.name }}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section
          v-if="campaign.showRecentLogsSection"
          class="golden-collapsible-section mt-4 rounded-[2rem] border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur"
        >
          <button
            type="button"
            class="flex w-full items-center justify-between gap-3 text-left"
            @click="isRecentLogsOpen = !isRecentLogsOpen"
          >
            <div>
              <p class="text-xs font-black uppercase tracking-[0.2em] text-yellow-100">
                Recent Logs
              </p>
              <h3 class="text-lg font-black text-white">
                最近砸蛋紀錄
              </h3>
              <p class="mt-1 text-xs font-bold text-yellow-50/70">
                {{ isRecentLogsOpen ? '目前顯示較多紀錄' : '目前只顯示摘要，點擊可展開' }}
              </p>
            </div>

            <div class="flex shrink-0 items-center gap-2">
              <span class="rounded-full bg-yellow-300 px-3 py-1 text-xs font-black text-red-700">
                {{ recentLogs.length }} 筆
              </span>
              <span class="golden-collapse-arrow" :class="isRecentLogsOpen ? 'is-open' : ''">
                ⌄
              </span>
            </div>
          </button>

          <div
            v-if="recentLogs.length"
            class="mt-3 space-y-2"
          >
            <div
              v-for="log in recentLogsPreview"
              :key="log.id"
              class="flex items-center justify-between gap-3 rounded-2xl bg-black/16 px-3 py-2"
            >
              <div>
                <p class="text-sm font-black text-white">
                  {{ log.prizeName }}
                </p>
                <p class="text-[11px] font-bold text-yellow-100/80">
                  金蛋 {{ log.eggNumber }}｜{{ log.createdAt }}
                </p>
              </div>
              <span
                class="rounded-full px-2 py-1 text-[10px] font-black"
                :class="log.prizeType === 'lose' ? 'bg-slate-100 text-slate-600' : 'bg-yellow-100 text-yellow-700'"
              >
                {{ log.prizeType === 'lose' ? '未中獎' : '中獎' }}
              </span>
            </div>

            <button
              v-if="recentLogs.length > 2"
              type="button"
              class="mt-2 w-full rounded-2xl border border-yellow-200/30 bg-white/10 px-4 py-2 text-xs font-black text-yellow-50 transition hover:bg-white/20"
              @click="isRecentLogsOpen = !isRecentLogsOpen"
            >
              {{ sectionToggleText(isRecentLogsOpen) }}完整砸蛋紀錄
            </button>
          </div>

          <p
            v-else
            class="mt-3 rounded-2xl bg-black/16 px-3 py-3 text-sm font-bold text-yellow-50/80"
          >
            尚無砸蛋紀錄，點選金蛋後會顯示在這裡。
          </p>
        </section>

            <section
          v-if="campaign.showRuleSection || campaign.showPrizeInfoSection"
          class="mt-4 grid gap-3 pb-8 md:grid-cols-2"
        >
          <div
            v-if="campaign.showRuleSection"
            class="golden-collapsible-section rounded-[2rem] border border-white/15 bg-white/10 p-4 shadow-xl backdrop-blur"
          >
            <button
              type="button"
              class="flex w-full items-center justify-between gap-3 text-left"
              @click="isRulesOpen = !isRulesOpen"
            >
              <div>
                <h3 class="text-base font-black text-white">
                  {{ campaign.ruleTitle }}
                </h3>
                <p class="mt-1 text-xs font-bold text-yellow-50/70">
                  {{ isRulesOpen ? `${ruleLineCount} 條規則已展開` : '點擊展開活動規則' }}
                </p>
              </div>

              <span class="golden-collapse-arrow" :class="isRulesOpen ? 'is-open' : ''">
                ⌄
              </span>
            </button>

            <transition name="golden-collapse">
              <p
                v-if="isRulesOpen"
                class="mt-3 whitespace-pre-line rounded-2xl bg-black/16 px-3 py-3 text-sm font-medium leading-6 text-yellow-50/85"
              >
                {{ campaign.ruleContent }}
              </p>
            </transition>
          </div>

          <div
            v-if="campaign.showPrizeInfoSection"
            class="golden-collapsible-section rounded-[2rem] border border-white/15 bg-white/10 p-4 shadow-xl backdrop-blur"
          >
            <button
              type="button"
              class="flex w-full items-center justify-between gap-3 text-left"
              @click="isPrizeInfoOpen = !isPrizeInfoOpen"
            >
              <div>
                <h3 class="text-base font-black text-white">
                  {{ campaign.prizeInfoTitle }}
                </h3>
                <p class="mt-1 text-xs font-bold text-yellow-50/70">
                  {{ isPrizeInfoOpen ? `${prizeInfoLineCount} 條說明已展開` : '點擊展開獎品說明' }}
                </p>
              </div>

              <span class="golden-collapse-arrow" :class="isPrizeInfoOpen ? 'is-open' : ''">
                ⌄
              </span>
            </button>

            <transition name="golden-collapse">
              <p
                v-if="isPrizeInfoOpen"
                class="mt-3 whitespace-pre-line rounded-2xl bg-black/16 px-3 py-3 text-sm font-medium leading-6 text-yellow-50/85"
              >
                {{ campaign.prizeInfoContent }}
              </p>
            </transition>
          </div>
        </section>
      </main>
    </div>

    <nav
      v-if="campaign.showBottomNav"
      class="fixed left-1/2 z-30 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 border p-2 shadow-2xl backdrop-blur-xl md:max-w-lg"
      :style="bottomNavStyle"
    >
      <div
        class="grid grid-cols-4"
        :style="bottomNavGridStyle"
      >
        <button
          type="button"
          class="golden-bottom-button"
          :style="bottomNavButtonStyle"
          @click="resetEggBoard"
        >
          <span class="bottom-nav-icon">{{ campaign.bottomNavEggIcon }}</span>
          <span>{{ campaign.bottomNavEggText }}</span>
        </button>

        <button
          type="button"
          class="golden-bottom-button"
          :style="bottomNavButtonStyle"
          @click="shareCampaign"
        >
          <span class="bottom-nav-icon">{{ campaign.bottomNavShareIcon }}</span>
          <span>{{ campaign.bottomNavShareText }}</span>
        </button>

        <button
          type="button"
          class="golden-bottom-button"
          :style="bottomNavButtonStyle"
          @click="copyResultText"
        >
          <span class="bottom-nav-icon">{{ campaign.bottomNavResultIcon }}</span>
          <span>{{ campaign.bottomNavResultText }}</span>
        </button>

        <a
          v-if="safeWebsiteUrl"
          :href="safeWebsiteUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="golden-bottom-button"
          :style="bottomNavButtonStyle"
        >
          <span class="bottom-nav-icon">{{ bottomWebsiteIcon }}</span>
          <span>{{ bottomWebsiteText }}</span>
        </a>

        <button
          v-else
          type="button"
          class="golden-bottom-button"
          :style="bottomNavButtonStyle"
          @click="goBack"
        >
          <span class="bottom-nav-icon">{{ bottomWebsiteIcon }}</span>
          <span>{{ bottomWebsiteText }}</span>
        </button>
      </div>
    </nav>

    <transition name="golden-egg-fade">
      <div
        v-if="showShareMessage"
        class="fixed left-1/2 top-5 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-yellow-200/50 bg-yellow-300 px-4 py-3 text-center text-sm font-black text-red-700 shadow-2xl"
      >
        {{ shareMessage }}
      </div>
    </transition>

    <transition name="golden-egg-modal">
      <div
        v-if="showResultModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      >
        <div
          class="relative w-full max-w-sm overflow-hidden rounded-[2rem] border p-6 text-center shadow-2xl"
          :style="resultModalStyle"
        >
          <button
            type="button"
            class="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/12 text-lg font-black text-white transition hover:bg-white/20"
            @click="closeResultModal"
          >
            ×
          </button>

          <p
            class="mx-auto inline-flex rounded-full px-4 py-1 font-black"
            :class="resultBadgeClass"
            :style="resultBadgeStyle"
          >
            {{ resultLabel }}
          </p>

          <div
            class="mx-auto mt-5 flex items-center justify-center overflow-hidden rounded-[2rem] shadow-2xl"
            :style="resultIconStyle"
          >
            <img
              v-if="resultImageUrl"
              :src="resultImageUrl"
              alt="結果圖片"
              class="h-full w-full object-cover"
            />
            <span v-else>
              {{ resultPrize?.icon || '🎁' }}
            </span>
          </div>

          <h3
            class="mt-5 text-2xl font-black"
            :style="resultTitleStyle"
          >
            {{ resultPrize?.name || '未知結果' }}
          </h3>

          <p
            class="mt-2 text-sm font-bold leading-6"
            :style="resultDescriptionStyle"
          >
            {{ resultPrize?.description || '結果已寫入最近砸蛋紀錄。' }}
          </p>

          <div class="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              class="rounded-2xl bg-yellow-300 px-4 py-3 font-black text-red-700 shadow-lg transition hover:bg-yellow-200"
              :style="resultPrimaryButtonStyle"
              @click="closeResultModal"
            >
              {{ campaign.resultPrimaryButtonText }}
            </button>

            <button
              v-if="campaign.showResultCopyButton"
              type="button"
              class="rounded-2xl border border-white/20 bg-white/12 px-4 py-3 font-black text-white shadow-lg transition hover:bg-white/20"
              :style="resultCopyButtonStyle"
              @click="copyResultText"
            >
              {{ campaign.resultCopyButtonText }}
            </button>
          </div>

          <button
            v-if="player.chances <= 0 && campaign.showResultShareButton"
            type="button"
            class="mt-3 w-full rounded-2xl bg-white px-4 py-3 text-sm font-black text-red-700 shadow-lg transition hover:bg-yellow-50"
            @click="shareCampaign"
          >
            分享活動
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.golden-egg-page {
  background:
    radial-gradient(circle at 18% 10%, rgba(255, 255, 255, 0.18), transparent 23%),
    radial-gradient(circle at 82% 18%, rgba(250, 204, 21, var(--golden-page-glow-opacity, 0.34)), transparent 30%),
    linear-gradient(180deg, var(--egg-bg-from), var(--egg-bg-middle) 48%, var(--egg-bg-to));
}

.golden-egg-page::before {
  position: fixed;
  inset: 0;
  pointer-events: none;
  content: '';
  background-image:
    radial-gradient(circle, rgba(255, 255, 255, 0.18) 0 1px, transparent 1px),
    radial-gradient(circle, rgba(250, 204, 21, 0.18) 0 1px, transparent 1px);
  background-position:
    0 0,
    14px 18px;
  background-size:
    34px 34px,
    46px 46px;
  opacity: var(--golden-page-dot-opacity, 0.7);
}

.golden-egg-hero {
  background:
    radial-gradient(circle at 20% 16%, rgba(255, 255, 255, 0.26), transparent 26%),
    radial-gradient(circle at 80% 22%, rgba(250, 204, 21, 0.4), transparent 28%),
    linear-gradient(155deg, rgba(239, 68, 68, 0.86), rgba(127, 29, 29, 0.78));
}

.golden-title {
  color: #fff8d6;
  text-shadow:
    0 3px 0 #991b1b,
    0 8px 18px rgba(69, 10, 10, 0.48),
    0 0 24px rgba(250, 204, 21, 0.55);
}

.golden-light {
  position: absolute;
  top: -26px;
  width: 88px;
  height: 180px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.42), transparent);
  filter: blur(2px);
  transform-origin: top;
}

.golden-light-left {
  left: 18%;
  transform: rotate(22deg);
}

.golden-light-right {
  right: 16%;
  transform: rotate(-22deg);
}


.golden-title-board {
  position: relative;
}

.golden-title-board::before,
.golden-title-board::after {
  position: absolute;
  top: 50%;
  width: 42px;
  height: 18px;
  content: '';
  background: linear-gradient(90deg, rgba(254, 243, 199, 0.96), rgba(250, 204, 21, 0.72));
  clip-path: polygon(0 0, 100% 50%, 0 100%);
  filter: drop-shadow(0 6px 8px rgba(69, 10, 10, 0.28));
}

.golden-title-board::before {
  left: -32px;
  transform: translateY(-50%) rotate(180deg);
}

.golden-title-board::after {
  right: -32px;
  transform: translateY(-50%);
}


.golden-marquee {
  position: relative;
}

.golden-marquee::before,
.golden-marquee::after {
  position: absolute;
  top: 0;
  z-index: 2;
  width: 42px;
  height: 100%;
  content: '';
  pointer-events: none;
}

.golden-marquee::before {
  left: 0;
  background: linear-gradient(90deg, color-mix(in srgb, var(--golden-marquee-text-color, #991b1b) 10%, transparent), transparent);
}

.golden-marquee::after {
  right: 0;
  background: linear-gradient(270deg, color-mix(in srgb, var(--golden-marquee-text-color, #991b1b) 10%, transparent), transparent);
}

.golden-marquee-track {
  display: inline-block;
  min-width: 100%;
  white-space: nowrap;
  color: var(--golden-marquee-text-color, #991b1b);
  animation: goldenMarquee var(--golden-marquee-speed, 12s) linear infinite;
}

.golden-prize-shelf {
  position: relative;
  z-index: 2;
}

.golden-prize-item {
  display: flex;
  min-height: 58px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  border: 1px solid rgba(127, 29, 29, 0.16);
  background:
    radial-gradient(circle at 34% 18%, rgba(255, 255, 255, 0.75), transparent 26%),
    linear-gradient(180deg, var(--golden-prize-item-bg-top, #fff7ad), var(--golden-prize-item-bg-bottom, #f59e0b));
  color: #7f1d1d;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.45),
    0 8px 14px rgba(127, 29, 29, 0.18);
}

.golden-prize-item.is-lose {
  background:
    radial-gradient(circle at 34% 18%, rgba(255, 255, 255, 0.68), transparent 26%),
    linear-gradient(180deg, #f8fafc, #cbd5e1);
  color: #334155;
}


.golden-egg-stage {
  background:
    radial-gradient(circle at 50% 0%, rgba(250, 204, 21, 0.22), transparent 32%),
    linear-gradient(180deg, rgba(127, 29, 29, 0.36), rgba(69, 10, 10, 0.2));
}

.golden-egg-stage::before {
  position: absolute;
  inset: 12px;
  pointer-events: none;
  content: '';
  border-radius: 1.45rem;
  border: 1px dashed rgba(254, 243, 199, var(--golden-stage-inner-border-opacity, 0.18));
}

.golden-egg-grid {
  position: relative;
  z-index: 2;
}


.golden-collapsible-section {
  position: relative;
}

.golden-collapse-arrow {
  display: flex;
  height: 34px;
  width: 34px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(250, 204, 21, 0.95);
  color: #991b1b;
  font-size: 20px;
  font-weight: 900;
  line-height: 1;
  box-shadow: 0 8px 16px rgba(69, 10, 10, 0.2);
  transition:
    transform 0.2s ease,
    background 0.2s ease;
}

.golden-collapse-arrow.is-open {
  transform: rotate(180deg);
  background: #fef3c7;
}

.golden-collapse-enter-active,
.golden-collapse-leave-active {
  overflow: hidden;
  transition:
    opacity 0.22s ease,
    transform 0.22s ease,
    max-height 0.22s ease;
}

.golden-collapse-enter-from,
.golden-collapse-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-6px);
}

.golden-collapse-enter-to,
.golden-collapse-leave-from {
  max-height: 360px;
  opacity: 1;
  transform: translateY(0);
}


.bottom-nav-icon {
  font-size: var(--bottom-nav-icon-size, 18px);
  line-height: 1;
}

.golden-bottom-button {
  display: flex;
  min-height: 54px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.12);
  color: #fef3c7;
  font-size: 11px;
  font-weight: 900;
  transition:
    transform 0.18s ease,
    background 0.18s ease;
}

.golden-bottom-button:hover {
  transform: translateY(-2px);
  background: rgba(250, 204, 21, 0.24);
}


.golden-egg-card {
  transform: translateZ(0);
}

.golden-egg-card::before {
  position: absolute;
  inset: 8px;
  border-radius: 1.25rem;
  pointer-events: none;
  content: '';
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.golden-egg-card:not(.is-opened):not(:disabled):hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow:
    0 18px 34px rgba(127, 29, 29, 0.35),
    0 0 0 3px rgba(250, 204, 21, 0.18);
}

.golden-egg-shell {
  position: relative;
  display: flex;
  width: min(74px, 19vw);
  height: min(92px, 24vw);
  align-items: center;
  justify-content: center;
  border-radius: 50% 50% 46% 46%;
  background:
    radial-gradient(circle at 34% 22%, rgba(255, 255, 255, 0.95), transparent 14%),
    radial-gradient(circle at 64% 72%, rgba(161, 98, 7, 0.32), transparent 24%),
    linear-gradient(
      135deg,
      var(--egg-color-top, #fff7ad) 0%,
      var(--egg-color-middle, #fde047) 36%,
      var(--egg-color-bottom, #b45309) 100%
    );
  box-shadow:
    inset -10px -14px 18px rgba(120, 53, 15, 0.24),
    inset 8px 8px 18px rgba(255, 255, 255, 0.34),
    0 13px 20px rgba(69, 26, 3, 0.32);
}

.egg-shine {
  position: absolute;
  left: 18%;
  top: 16%;
  width: 20%;
  height: 28%;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  filter: blur(0.5px);
  transform: rotate(24deg);
}

.egg-star {
  position: absolute;
  color: rgba(255, 255, 255, 0.82);
  font-size: 12px;
  text-shadow: 0 2px 6px rgba(120, 53, 15, 0.35);
}

.egg-star-a {
  right: 16%;
  top: 28%;
}

.egg-star-b {
  bottom: 24%;
  left: 18%;
  font-size: 9px;
}

.egg-number {
  position: absolute;
  bottom: 18%;
  display: flex;
  height: 22px;
  min-width: 22px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(127, 29, 29, 0.72);
  padding: 0 7px;
  color: #fef3c7;
  font-size: 12px;
  font-weight: 900;
}

.golden-egg-card.is-cracking .golden-egg-shell {
  animation: eggShake 0.16s linear infinite;
}

.golden-hammer {
  position: absolute;
  right: 6%;
  top: 1%;
  z-index: 5;
  font-size: clamp(2.2rem, 8vw, 3.5rem);
  filter: drop-shadow(0 10px 14px rgba(69, 10, 10, 0.36));
  transform-origin: 70% 90%;
  animation: hammerHit 0.48s ease-in-out infinite;
}

.golden-egg-opened {
  position: relative;
  display: flex;
  width: min(82px, 22vw);
  height: min(88px, 24vw);
  align-items: center;
  justify-content: center;
}

.broken-shell {
  position: absolute;
  bottom: 10px;
  width: 42px;
  height: 36px;
  background:
    linear-gradient(135deg, #fff7ad, #f59e0b 60%, #92400e);
  box-shadow: inset -5px -5px 10px rgba(120, 53, 15, 0.25);
}

.broken-left {
  left: 0;
  border-radius: 10px 8px 20px 28px;
  clip-path: polygon(0 28%, 20% 0, 38% 28%, 58% 0, 80% 32%, 100% 14%, 100% 100%, 0 100%);
  transform: rotate(-18deg);
}

.broken-right {
  right: 0;
  border-radius: 8px 10px 28px 20px;
  clip-path: polygon(0 18%, 18% 34%, 38% 0, 58% 30%, 78% 0, 100% 32%, 100% 100%, 0 100%);
  transform: rotate(18deg);
}

.prize-pop {
  position: relative;
  z-index: 3;
  display: flex;
  min-height: 68px;
  min-width: 68px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 1.4rem;
  background:
    radial-gradient(circle at 35% 20%, rgba(255, 255, 255, 0.65), transparent 26%),
    linear-gradient(135deg, #facc15, #f97316);
  box-shadow:
    0 13px 22px rgba(69, 10, 10, 0.3),
    0 0 0 4px rgba(255, 255, 255, 0.18);
  animation: prizePop 0.54s cubic-bezier(0.2, 1.2, 0.28, 1) both;
}

.golden-egg-confetti {
  position: absolute;
  top: -24px;
  border-radius: 4px;
  animation-name: goldenConfettiFall;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

.golden-egg-rain {
  position: absolute;
  top: -20px;
  border-radius: 999px;
  background:
    radial-gradient(circle at 32% 28%, #ffffff, #fde047 30%, #f59e0b 74%);
  box-shadow: 0 0 14px rgba(250, 204, 21, 0.65);
  animation-name: goldenRainFall;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

.golden-egg-fade-enter-active,
.golden-egg-fade-leave-active {
  transition: all 0.22s ease;
}

.golden-egg-fade-enter-from,
.golden-egg-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -12px);
}

.golden-egg-modal-enter-active,
.golden-egg-modal-leave-active {
  transition: all 0.26s ease;
}

.golden-egg-modal-enter-from,
.golden-egg-modal-leave-to {
  opacity: 0;
  transform: scale(0.96);
}

@keyframes hammerHit {
  0% {
    transform: rotate(-24deg) translateY(-4px);
  }

  48% {
    transform: rotate(28deg) translateY(8px);
  }

  100% {
    transform: rotate(-24deg) translateY(-4px);
  }
}

@keyframes eggShake {
  0%,
  100% {
    transform: translateX(0) rotate(0deg);
  }

  25% {
    transform: translateX(-3px) rotate(-3deg);
  }

  50% {
    transform: translateX(2px) rotate(2deg);
  }

  75% {
    transform: translateX(-2px) rotate(-2deg);
  }
}

@keyframes prizePop {
  0% {
    opacity: 0;
    transform: translateY(18px) scale(0.72);
  }

  70% {
    opacity: 1;
    transform: translateY(-8px) scale(1.12);
  }

  100% {
    opacity: 1;
    transform: translateY(-2px) scale(1);
  }
}

@keyframes goldenConfettiFall {
  0% {
    opacity: 1;
    transform: translateY(-30px) rotate(0deg);
  }

  100% {
    opacity: 0;
    transform: translateY(110vh) rotate(760deg);
  }
}

@keyframes goldenRainFall {
  0% {
    opacity: 1;
    transform: translateY(-24px) scale(0.7);
  }

  100% {
    opacity: 0;
    transform: translateY(108vh) scale(1.12);
  }
}

@keyframes goldenMarquee {
  0% {
    transform: translateX(88%);
  }

  100% {
    transform: translateX(-100%);
  }
}

@media (max-width: 380px) {
  .golden-egg-shell {
    width: 54px;
    height: 68px;
  }

  .prize-pop {
    min-height: 58px;
    min-width: 58px;
  }
}

.golden-egg-remote-cracking {
  animation: goldenEggRemoteShake 0.32s ease-in-out infinite alternate, goldenEggRemoteJump 0.9s ease-in-out infinite;
  transform-origin: center bottom;
}

@keyframes goldenEggRemoteShake {
  0% {
    transform: translateX(-3px) rotate(-3deg) scale(1.02);
  }
  100% {
    transform: translateX(3px) rotate(3deg) scale(1.06);
  }
}

@keyframes goldenEggRemoteJump {
  0%,
  100% {
    filter: drop-shadow(0 12px 18px rgba(255, 214, 72, 0.18));
  }
  50% {
    filter: drop-shadow(0 22px 28px rgba(255, 214, 72, 0.38));
  }
}

/* 第 329 批：正式資料庫模式金蛋尺寸歸零重做 */
.golden-egg-remote-cracking,
[style*="--egg-size"] .egg-shape,
[style*="--egg-size"] .egg-image,
[style*="--egg-size"] img {
  width: var(--egg-size) !important;
  height: var(--egg-size) !important;
  max-width: var(--egg-size) !important;
  max-height: var(--egg-size) !important;
}

/* 第 331 批：卡牌框內固定 */
.golden-egg-grid {
  overflow: hidden;
}

.golden-egg-card {
  margin-left: auto;
  margin-right: auto;
}

.golden-egg-shell {
  flex-shrink: 0;
}


/* 第 356 批：手機金蛋九宮格乾淨重整版
   注意：
   1. 本段只處理手機滑動時漏繪。
   2. 不改資料庫、不改顏色、不覆蓋金蛋內部結構。
   3. 不使用第 355 批那種強制 display:block，避免蛋和標籤分離。
*/
@media (hover: none) and (pointer: coarse) {
  .golden-egg-stage {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }

  .golden-egg-grid {
    overflow: visible;
    transform: none;
    will-change: auto;
    contain: layout;
  }

  .golden-egg-card {
    transform: none;
    will-change: auto;
    backface-visibility: visible;
    -webkit-backface-visibility: visible;
    contain: layout paint;
    isolation: isolate;
    -webkit-tap-highlight-color: transparent;
  }

  .golden-egg-card:not(.is-opened):not(:disabled):hover,
  .golden-egg-card:not(.is-opened):not(:disabled):active,
  .golden-egg-card:not(.is-opened):not(:disabled):focus {
    transform: none;
  }

  .golden-egg-shell {
    will-change: auto;
    backface-visibility: visible;
    -webkit-backface-visibility: visible;
  }
}

@media (max-width: 430px) {
  .golden-egg-grid {
    gap: 10px !important;
  }

  .golden-egg-card {
    min-height: 116px;
  }
}

@media (max-width: 360px) {
  .golden-egg-card {
    min-height: 104px;
  }
}

</style>
