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
  shareImageUrl: '',
  systemShareText: '🎉 九宮格砸金蛋抽獎活動\n輸入活動序號，立即砸金蛋抽好禮！',
  lineShareText: '🎉 九宮格砸金蛋抽獎活動｜輸入序號就有機會中大獎！',
  telegramShareText: '🎉 九宮格砸金蛋抽獎活動｜輸入序號就有機會中大獎！',
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
  showLineShareButton: true,
  showTelegramShareButton: true,
  systemShareButtonText: '系統分享',
  lineShareButtonText: 'LINE 分享',
  telegramShareButtonText: 'Telegram',
  systemShareButtonBgColor: 'rgba(255, 255, 255, 0.12)',
  systemShareButtonTextColor: '#ffffff',
  lineShareButtonBgColor: '#22c55e',
  lineShareButtonTextColor: '#ffffff',
  telegramShareButtonBgColor: '#0ea5e9',
  telegramShareButtonTextColor: '#ffffff',
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

// 第 370 批：分享功能完全重建版
// 注意：這一段取代第 364～369 批所有舊分享函式。
// 三顆分享按鈕只綁定：
// 1. handleSystemShare()
// 2. handleLineShare()
// 3. handleTelegramShare()
const getCurrentCampaignIdForShare = () => {
  if (typeof onlineCampaignId !== 'undefined' && onlineCampaignId.value) {
    return onlineCampaignId.value
  }

  if (typeof getRouteCampaignId === 'function') {
    return getRouteCampaignId() || 1
  }

  return 1
}

const getFrontendShareUrl = () => {
  const customUrl = String(campaign.shareUrl || '').trim()

  if (customUrl) return customUrl

  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href)
    url.searchParams.set('campaignId', String(getCurrentCampaignIdForShare()))
    return url.toString()
  }

  return `https://marketing-game-v1-em29.vercel.app/games/golden-egg?campaignId=${getCurrentCampaignIdForShare()}`
}

const getOgShareLandingUrl = () => {
  const apiBase = String(import.meta.env.VITE_API_BASE_URL || 'https://marketing-game-api.onrender.com/api')
    .replace(/\/api\/?$/, '')

  const params = new URLSearchParams({
    campaignId: String(getCurrentCampaignIdForShare()),
    sv: String(Date.now())
  })

  return `${apiBase}/share/golden-egg?${params.toString()}`
}

const getShareTitle = () => {
  return String(campaign.shareTitle || campaign.pageTitle || campaign.mainTitle || '九宮格砸金蛋抽獎活動').trim()
}

const getShareDescription = () => {
  return String(campaign.shareDescription || campaign.heroTagline || campaign.noticeText || '輸入活動序號，立即砸金蛋抽好禮！').trim()
}

const getSystemShareText = () => {
  return String(campaign.systemShareText || `${getShareTitle()}\n${getShareDescription()}`).trim()
}

const getLineShareText = () => {
  return String(campaign.lineShareText || `${getShareTitle()}｜${getShareDescription()}`).trim()
}

const getTelegramShareText = () => {
  return String(campaign.telegramShareText || `${getShareTitle()}｜${getShareDescription()}`).trim()
}

const copyTextSilently = (textValue) => {
  try {
    navigator.clipboard?.writeText(textValue).catch(() => {})
  } catch (error) {
    // ignore clipboard errors
  }
}

const handleSystemShare = async () => {
  const frontUrl = getFrontendShareUrl()
  const title = getShareTitle()
  const text = getSystemShareText()
  const fallbackText = `${text}\n${frontUrl}`

  try {
    if (navigator.share) {
      await navigator.share({
        title,
        text,
        url: frontUrl
      })
      noticeText.value = '系統分享已開啟。'
    } else {
      await navigator.clipboard.writeText(fallbackText)
      noticeText.value = '系統分享文字已複製。'
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
    noticeText.value = '系統分享失敗，已複製分享文字。'
    copyTextSilently(fallbackText)
  }
}

const handleLineShare = () => {
  const frontUrl = getFrontendShareUrl()
  const ogUrl = getOgShareLandingUrl()

  // LINE 文字分享最穩：line.me/R/msg/text。
  // 同時複製含前台網址的文字，避免 LINE App 只帶文字不帶預覽時也能貼上。
  const shareText = `${getLineShareText()}\n${frontUrl}`
  copyTextSilently(shareText)

  const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(shareText)}`

  noticeText.value = '正在開啟 LINE 分享。若沒有自動帶出預覽，可直接貼上已複製文字。'
  window.location.href = lineUrl
}

const handleTelegramShare = () => {
  const ogUrl = getOgShareLandingUrl()
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(ogUrl)}&text=${encodeURIComponent(getTelegramShareText())}`

  noticeText.value = '正在開啟 Telegram 分享。'
  window.location.href = telegramUrl
}

// 保留相容舊 template 的函式名稱，但全部導向新的乾淨函式。
const shareCampaign = handleSystemShare
const shareToLine = handleLineShare
const shareToTelegram = handleTelegramShare
const shareViaLine = handleLineShare
const shareViaTelegram = handleTelegramShare

const openDirectShare = (platform) => {
  if (platform === 'line') {
    handleLineShare()
    return
  }

  if (platform === 'telegram') {
    handleTelegramShare()
    return
  }

  if (platform === 'facebook') {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getOgShareLandingUrl())}`
    window.location.href = facebookUrl
    return
  }

  noticeText.value = '找不到可用的分享方式。'
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

            <div class="serial-redeem-row flex flex-col gap-2 sm:flex-row">
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
                class="serial-redeem-button rounded-2xl px-5 py-3 font-black shadow-xl transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                :style="serialRedeemButtonStyle"
                :disabled="isCracking || isSerialRedeeming"
                @click="redeemSerialCode"
              >
                <span class="serial-redeem-button-text">
                  {{ isSerialRedeemLocked ? `${serialRedeemLockLeftSeconds} 秒後再試` : (campaign.serialRedeemButtonText || '驗證序號') }}
                </span>
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
            v-if="campaign.showShareButtonSection"
            class="mt-3 grid grid-cols-3"
            :style="shareButtonGridStyle"
          >
            <button
              v-if="campaign.showSystemShareButton"
              type="button"
              class="border border-white/20 px-3 font-black shadow-xl transition hover:brightness-110"
              :style="getShareButtonStyle('system')"
              @click="handleSystemShare"
            >
              {{ campaign.systemShareButtonText }}
            </button>

            <button
              v-if="campaign.showLineShareButton"
              type="button"
              class="px-3 font-black shadow-xl transition hover:brightness-110"
              :style="getShareButtonStyle('line')"
              @click="handleLineShare"
            >
              {{ campaign.lineShareButtonText }}
            </button>

            <button
              v-if="campaign.showTelegramShareButton"
              type="button"
              class="px-3 font-black shadow-xl transition hover:brightness-110"
              :style="getShareButtonStyle('telegram')"
              @click="handleTelegramShare"
            >
              {{ campaign.telegramShareButtonText }}
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
          @click="handleSystemShare"
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
            @click="handleSystemShare"
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


/* 第 360 批：前台序號驗證按鈕跑版修正 */
.serial-redeem-row {
  align-items: stretch;
}

.serial-redeem-button {
  display: inline-flex;
  min-width: 136px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  text-align: center;
  line-height: 1.2;
}

.serial-redeem-button-text {
  display: inline-block;
  min-width: 4em;
}

@media (max-width: 640px) {
  .serial-redeem-button {
    width: 100%;
    min-width: 0;
  }
}

</style>
