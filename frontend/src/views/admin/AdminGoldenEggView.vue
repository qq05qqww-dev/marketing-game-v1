<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import {
  getAdminGoldenEggCampaign,
  updateAdminGoldenEggCampaign,
  getAdminGoldenEggPrizes,
  updateAdminGoldenEggGameConfig,
  createAdminGoldenEggPrize,
  updateAdminGoldenEggPrize,
  deleteAdminGoldenEggPrize,
  getAdminGoldenEggSerialCodes,
  generateAdminGoldenEggSerialCodes,
  createAdminGoldenEggSerialCode,
  bulkCreateAdminGoldenEggSerialCodes,
  updateAdminGoldenEggSerialCode,
  markAdminGoldenEggSerialDistributed,
  deleteAdminGoldenEggSerialCode,
  getAdminGoldenEggSerialExportUrl,
  getAdminGoldenEggPlayRecords,
  getAdminGoldenEggRewardRecords,
  claimAdminGoldenEggRewardRecord,
  cancelAdminGoldenEggRewardRecord,
  getAdminGoldenEggPlayRecordExportUrl,
  getAdminGoldenEggDrawPool
} from '../../api/goldenEggAdminApi.js'
import { useRouter } from 'vue-router'

const router = useRouter()

const GOLDEN_EGG_ADMIN_STATE_KEY = 'multi_game_platform_golden_egg_admin_state_v1'
const GOLDEN_EGG_ADMIN_SYNC_KEY = 'multi_game_platform_golden_egg_admin_sync_ping_v1'
const GOLDEN_EGG_SERIAL_CODES_KEY = 'multi_game_platform_golden_egg_serial_codes_v1'
const GOLDEN_EGG_SERIAL_REDEEM_LOG_KEY = 'multi_game_platform_golden_egg_serial_redeem_log_v1'
const GOLDEN_EGG_HISTORY_KEY = 'multi_game_platform_golden_egg_history_v1'


const cloneByJson = (value) => JSON.parse(JSON.stringify(value))

const safeJsonParse = (value, fallback = null) => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch (error) {
    console.warn('Golden egg admin JSON parse failed:', error)
    return fallback
  }
}

const previewRefreshKey = ref(Date.now())
const savedMessage = ref('')
const savedMessageType = ref('success')
const operationMessage = ref('')
const operationMessageType = ref('info')
const activeSection = ref('databaseMode')
const databaseCampaignId = ref(localStorage.getItem('golden_egg_admin_database_campaign_id') || '')
const isLoadingDatabaseCampaign = ref(false)
const databaseLoadMessage = ref('')
const databaseCampaign = ref(null)
const databasePrizes = ref([])
const databaseSerialCodes = ref([])
const selectedDatabaseSerialIds = ref([])
const isBatchDeletingDatabaseSerials = ref(false)
const databaseSerialSearchKeyword = ref('')
const databaseSerialBatchFilter = ref('ALL')
const databaseSerialStatusFilter = ref('ALL')
const databaseSerialIssueFilter = ref('ALL')
const databaseSerialViewMode = ref('CARD')
const databasePlayRecords = ref([])
const databaseRewardRecords = ref([])
const databaseDrawPool = ref(null)
const isSavingDatabasePrize = ref(false)
const databasePrizeForm = reactive({
  id: null,
  title: '',
  shortName: '',
  description: '',
  icon: '🎁',
  imageUrl: '',
  type: 'WIN',
  status: 'ACTIVE',
  probability: 10,
  stockTotal: 100,
  remainStock: 100,
  stockUsed: 0,
  sortOrder: 1
})
const isSavingDatabaseSerial = ref(false)
const databaseSerialAction = ref('')
const databaseSerialForm = reactive({
  code: '',
  codesText: '',
  prefix: 'EGG',
  batchCode: 'DEMO',
  count: 10,
  rewardChance: 1,
  length: 18,
  expireAt: '',
  note: '後台資料庫模式建立',
  distributedTo: '',
  distributedChannel: 'LINE'
})
const databaseRecordKeyword = ref('')
const databaseRecordWinFilter = ref('all')
const databaseRewardStatusFilter = ref('all')
const databaseRecordPrizeFilter = ref('all')
const databaseRecordDateFilter = ref('all')
const databaseSectionOpen = reactive({
  links: true,
  summary: true,
  campaign: false,
  gameConfig: false,
  prizes: false,
  serials: false,
  records: false
})


const databaseRecordTableOpen = reactive({
  plays: false,
  rewards: false
})

const toggleDatabaseRecordTable = (key) => {
  databaseRecordTableOpen[key] = !databaseRecordTableOpen[key]
}


const databaseRecordDisplayLimit = reactive({
  plays: 20,
  rewards: 20
})

const databaseRecordLimitOptions = [
  { label: '最近 10 筆', value: 10 },
  { label: '最近 20 筆', value: 20 },
  { label: '最近 50 筆', value: 50 },
  { label: '全部', value: 0 }
]


const getRecordSourceArray = (source) => {
  if (Array.isArray(source)) return source
  if (Array.isArray(source?.value)) return source.value
  return []
}

const displayedDatabasePlayRecords = computed(() => {
  const records = getRecordSourceArray(filteredDatabasePlayRecords)
  const limit = Number(databaseRecordDisplayLimit.plays || 0)

  if (!limit) return records

  return records.slice(0, limit)
})

const displayedDatabaseRewardRecords = computed(() => {
  const records = getRecordSourceArray(filteredDatabaseRewardRecords)
  const limit = Number(databaseRecordDisplayLimit.rewards || 0)

  if (!limit) return records

  return records.slice(0, limit)
})


const databaseRecordStats = computed(() => {
  const playRecords = getRecordSourceArray(filteredDatabasePlayRecords)
  const rewardRecords = getRecordSourceArray(filteredDatabaseRewardRecords)

  const wonPlayCount = playRecords.filter((item) => item.isWin || item.result === 'WIN' || item.prize).length
  const losePlayCount = Math.max(0, playRecords.length - wonPlayCount)

  const rewardStatusCounts = rewardRecords.reduce((summary, item) => {
    const status = String(item.status || 'PENDING').toUpperCase()
    summary[status] = (summary[status] || 0) + 1
    return summary
  }, {})

  return {
    playTotal: playRecords.length,
    playWon: wonPlayCount,
    playLose: losePlayCount,
    rewardTotal: rewardRecords.length,
    rewardPending: rewardStatusCounts.PENDING || 0,
    rewardIssued: (rewardStatusCounts.ISSUED || 0) + (rewardStatusCounts.CLAIMED || 0),
    rewardCancelled: rewardStatusCounts.CANCELLED || 0
  }
})




const databasePreviewSyncMessage = ref('')
const isSavingDatabaseCampaign = ref(false)
const databaseCampaignForm = reactive({
  title: '',
  slug: '',
  description: '',
  gameType: 'GOLDEN_EGG',
  status: 'ACTIVE',
  startAt: '',
  endAt: '',
  dailyLimit: 99,
  totalLimit: 999,
  requireLogin: false
})

const isSavingDatabaseGameConfig = ref(false)
const databaseGameConfigForm = reactive({
  pageTitle: '',
  mainTitle: '',
  subTitle: '',
  heroTagline: '',
  noticeText: '',
  serialRedeemTitle: '',
  serialRedeemDescription: '',
  serialRedeemButtonText: '',
  serialRedeemSuccessText: '',
  serialRedeemErrorText: '',
  activityRunningText: '',
  activityNotStartedText: '',
  activityEndedText: '',
  showActivityTimeSection: true,
  showActivityCountdown: true,
  activityCountdownAlwaysShowSeconds: true,
  showBottomNav: true,
  eggSize: 74,
  eggCardSize: 128,
  eggGridGap: 12,
  eggColorTop: '#fff7ad',
  eggColorMiddle: '#fde047',
  eggColorBottom: '#b45309'
})
const isAutoPreviewEnabled = ref(true)
const serialCodes = ref([])
const serialCodePrefix = ref('EGG')
const serialBatchCode = ref('')
const serialRewardChance = ref(1)
const serialGenerateCount = ref(1)
const serialCodeLength = ref(18)
const serialExpireMode = ref('none')
const serialExpireDays = ref(7)
const serialCustomExpireAt = ref('')
const bulkExpireMode = ref('none')
const bulkExpireDays = ref(7)
const bulkCustomExpireAt = ref('')
const serialSearchText = ref('')
const serialStatusFilter = ref('all')
const serialSortMode = ref('newest')
const bulkDistributeTo = ref('')
const bulkDistributeChannel = ref('LINE')
const manualSerialCode = ref('')
const bulkSerialCodesText = ref('')
const localSerialAction = ref('')
const manualSerialRewardChance = ref(1)
const manualSerialBatchCode = ref('')
const manualSerialExpireMode = ref('none')
const manualSerialExpireDays = ref(7)
const manualCustomExpireAt = ref('')
const serialImportFileInput = ref(null)
const replaceSerialCodesOnImport = ref(false)
const serialImportPreview = ref(null)
const serialRedeemLogs = ref([])
const autoRefreshRedeemLogs = ref(true)
const redeemLogRefreshSeconds = ref(3)
const lastRedeemLogRefreshAt = ref('')
const eggPlayLogs = ref([])
const autoRefreshEggPlayLogs = ref(true)
const eggPlayLogRefreshSeconds = ref(3)
const lastEggPlayLogRefreshAt = ref('')
const eggPlayLogStatusFilter = ref('all')
const eggPlayLogSearchText = ref('')


const campaign = reactive({
  brandName: 'Multi Game Platform',
  pageTitle: '砸金蛋抽獎',
  mainTitle: '砸金蛋中大奖',
  subTitle: '九宮格金蛋活動',
  heroTagline: '9 顆金蛋任你選，敲開就有機會中大獎',
  chanceText: '還有 3 次砸蛋機會',
  buttonText: '分享活動',
  shareHint: '分享活動可增加 1 次砸蛋機會',
  noticeText: '本活動為原創互動版型，可自由替換品牌、獎項與活動內容。',
  activityStartAt: '',
  activityEndAt: '',
  activityNotStartedText: '活動尚未開始，請於指定時間再回來參加。',
  activityEndedText: '活動已結束，感謝你的參與。',
  activityRunningText: '活動進行中，請選擇一顆金蛋。',
  showActivityTimeSection: true,
  showActivityCountdown: true,
  activityCountdownTitle: '活動倒數',
  activityCountdownBgColor: '#7f1d1d',
  activityCountdownTextColor: '#fef3c7',
  activityCountdownNumberColor: '#fde047',
  activityCountdownTitleTextSize: 12,
  activityCountdownNumberTextSize: 18,
  activityCountdownAlwaysShowSeconds: true,
  activityTimeBgColor: '#7f1d1d',
  activityTimeBorderColor: '#fde68a',
  activityTimeTitleColor: '#fef3c7',
  activityTimeCardBgColor: '#450a0a',
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
  headerWebsiteBgColor: '#7f1d1d',
  headerWebsiteTextColor: '#ffffff',
  headerSideBoxWidth: 72,
  headerBoxHeight: 48,
  headerBoxRadius: 16,
  headerGap: 12,
  headerPaddingX: 16,
  headerPaddingY: 12,
  eggSize: 74,
  eggCardSize: 128,
  eggGridGap: 12,
  showEggNumber: true,
  eggNumberBgColor: '#7f1d1d',
  eggNumberTextColor: '#fef3c7',
  eggColorTop: '#fff7ad',
  eggColorMiddle: '#fde047',
  eggColorBottom: '#b45309',
  eggCardBgFrom: '#ef4444',
  eggCardBgTo: '#7f1d1d',
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
  shareHashtags: '砸金蛋,抽獎活動',
  serialRedeemTitle: '輸入抽獎序號',
  serialRedeemPlaceholder: '請輸入主辦單位提供的序號',
  serialRedeemButtonText: '兌換砸蛋機會',
  serialRedeemSuccessText: '序號兌換成功，已增加砸蛋機會。',
  serialRedeemErrorText: '序號無效、已使用或不存在。',
  showSerialRedeemSection: true,
  serialRedeemBgColor: '#7f1d1d',
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
  systemShareButtonBgColor: '#7f1d1d',
  systemShareButtonTextColor: '#ffffff',
  lineShareButtonBgColor: '#22c55e',
  lineShareButtonTextColor: '#ffffff',
  telegramShareButtonBgColor: '#0ea5e9',
  telegramShareButtonTextColor: '#ffffff',
  shareButtonRadius: 16,
  shareButtonTextSize: 12,
  shareButtonGap: 8,
  shareButtonPaddingY: 12,
  maxSerialRedeemErrors: 5,
  serialRedeemLockSeconds: 60,
  showBottomNav: true,
  bottomNavBgColor: '#7f1d1d',
  bottomNavBorderColor: '#fde68a',
  bottomNavButtonBgColor: '#92400e',
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
  ruleContent: '每次砸蛋會消耗 1 次機會。\n點選任一金蛋後，系統會依獎項百分比產生結果。\n分享活動可依設定增加砸蛋機會。\n獎項數量有限，送完為止。',
  prizeInfoTitle: '獎品說明',
  prizeInfoContent: '中獎結果會顯示於畫面與最近紀錄。\n實際兌換方式以主辦單位公告為準。\n請保留中獎畫面或截圖作為兌獎依據。'
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

const normalizePrizeProbability = (value) => {
  return Math.min(100, Math.max(0, Number(value || 0)))
}

let saveTimer = null

const adminSections = [
  {
    key: 'basic',
    label: '基本文字',
    icon: '文'
  },
  {
    key: 'theme',
    label: '主題色彩',
    icon: '色'
  },
  {
    key: 'activityTime',
    label: '活動時間',
    icon: '時'
  },
  {
    key: 'background',
    label: '背景舞台',
    icon: '景'
  },
  {
    key: 'eggStyle',
    label: '金蛋樣式',
    icon: '蛋'
  },
  {
    key: 'prizes',
    label: '獎項百分比',
    icon: '獎'
  },
  {
    key: 'eggLogs',
    label: '砸蛋紀錄',
    icon: '錄'
  },
  {
    key: 'serial',
    label: '序號抽獎',
    icon: '碼'
  },
  {
    key: 'bottomNav',
    label: '底部功能列',
    icon: '底'
  },
  {
    key: 'display',
    label: '展示區塊',
    icon: '示'
  },
  {
    key: 'result',
    label: '結果彈窗',
    icon: '窗'
  },
  {
    key: 'effects',
    label: '音效特效',
    icon: '效'
  },
  {
    key: 'rules',
    label: '規則說明',
    icon: '規'
  }
]

const previewUrl = computed(() => {
  return `/games/golden-egg?preview=${previewRefreshKey.value}`
})

const probabilityTotal = computed(() => {
  return prizes.value.reduce((sum, prize) => sum + Number(prize.probability || 0), 0)
})

const enabledPrizeCount = computed(() => {
  return prizes.value.filter((prize) => prize.isEnabled !== false).length
})

const winPrizeCount = computed(() => {
  return prizes.value.filter((prize) => prize.isEnabled !== false && prize.type !== 'lose').length
})

const serialCodeStats = computed(() => {
  const total = serialCodes.value.length
  const used = serialCodes.value.filter((item) => item.usedAt).length
  const unused = serialCodes.value.filter((item) => !item.usedAt && item.isEnabled !== false).length
  const expired = serialCodes.value.filter((item) => isSerialCodeExpired(item)).length
  const disabled = serialCodes.value.filter((item) => item.isEnabled === false).length
  const distributed = serialCodes.value.filter((item) => item.distributedAt).length
  const undistributed = serialCodes.value.filter((item) => !item.distributedAt).length

  return {
    total,
    used,
    unused,
    disabled,
    expired,
    distributed,
    undistributed
  }
})

const filteredSerialCodes = computed(() => {
  const keyword = String(serialSearchText.value || '').trim().toUpperCase()
  const status = serialStatusFilter.value

  const filtered = serialCodes.value.filter((item) => {
    const matchedKeyword = !keyword
      || String(item.code || '').toUpperCase().includes(keyword)
      || String(item.note || '').toUpperCase().includes(keyword)
      || String(item.batchCode || '').toUpperCase().includes(keyword)

    if (!matchedKeyword) return false

    if (status === 'unused') {
      return !item.usedAt && item.isEnabled !== false && !isSerialCodeExpired(item)
    }

    if (status === 'used') {
      return !!item.usedAt
    }

    if (status === 'disabled') {
      return item.isEnabled === false
    }

    if (status === 'expired') {
      return isSerialCodeExpired(item)
    }

    if (status === 'distributed') {
      return !!item.distributedAt
    }

    if (status === 'undistributed') {
      return !item.distributedAt
    }

    return true
  })

  const getTimeValue = (value) => {
    if (!value) return 0

    const time = new Date(value).getTime()

    return Number.isNaN(time) ? 0 : time
  }

  const getStatusWeight = (item) => {
    if (!item.usedAt && item.isEnabled !== false && !isSerialCodeExpired(item)) return 1
    if (item.usedAt) return 2
    if (isSerialCodeExpired(item)) return 3
    if (item.isEnabled === false) return 4

    return 9
  }

  return [...filtered].sort((a, b) => {
    if (serialSortMode.value === 'oldest') {
      return getTimeValue(a.createdAt) - getTimeValue(b.createdAt)
    }

    if (serialSortMode.value === 'unusedFirst') {
      return getStatusWeight(a) - getStatusWeight(b)
    }

    if (serialSortMode.value === 'usedFirst') {
      return Number(!!b.usedAt) - Number(!!a.usedAt)
    }

    if (serialSortMode.value === 'expireSoon') {
      const aExpire = a.expireAt ? getTimeValue(a.expireAt) : Number.MAX_SAFE_INTEGER
      const bExpire = b.expireAt ? getTimeValue(b.expireAt) : Number.MAX_SAFE_INTEGER

      return aExpire - bExpire
    }

    if (serialSortMode.value === 'expiredFirst') {
      return Number(isSerialCodeExpired(b)) - Number(isSerialCodeExpired(a))
    }

    if (serialSortMode.value === 'distributedFirst') {
      return Number(!!b.distributedAt) - Number(!!a.distributedAt)
    }

    if (serialSortMode.value === 'undistributedFirst') {
      return Number(!b.distributedAt) - Number(!a.distributedAt)
    }

    if (serialSortMode.value === 'codeAsc') {
      return String(a.code || '').localeCompare(String(b.code || ''))
    }

    if (serialSortMode.value === 'codeDesc') {
      return String(b.code || '').localeCompare(String(a.code || ''))
    }

    return getTimeValue(b.createdAt) - getTimeValue(a.createdAt)
  })
})

const availableSerialCodes = computed(() => {
  return serialCodes.value.filter((item) => !item.usedAt && item.isEnabled !== false && !isSerialCodeExpired(item))
})

const recentSerialRedeemLogs = computed(() => {
  return serialRedeemLogs.value.slice(0, 20)
})

const filteredEggPlayLogs = computed(() => {
  const keyword = String(eggPlayLogSearchText.value || '').trim().toUpperCase()
  const status = eggPlayLogStatusFilter.value

  return eggPlayLogs.value.filter((item) => {
    const matchedKeyword = !keyword
      || String(item.prizeName || '').toUpperCase().includes(keyword)
      || String(item.eggNumber || '').toUpperCase().includes(keyword)
      || String(item.createdAt || '').toUpperCase().includes(keyword)

    if (!matchedKeyword) return false

    if (status === 'win') return item.prizeType !== 'lose'
    if (status === 'lose') return item.prizeType === 'lose'

    return true
  })
})

const eggPlayLogStats = computed(() => {
  const total = eggPlayLogs.value.length
  const win = eggPlayLogs.value.filter((item) => item.prizeType !== 'lose').length
  const lose = eggPlayLogs.value.filter((item) => item.prizeType === 'lose').length

  return {
    total,
    win,
    lose
  }
})

const probabilityHintClass = computed(() => {
  return probabilityTotal.value === 100
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-amber-200 bg-amber-50 text-amber-700'
})

const probabilityHintText = computed(() => {
  return probabilityTotal.value === 100
    ? '目前機率總和剛好 100%。'
    : '目前使用權重抽選；建議調整到 100，後續比較好理解。'
})

const payload = computed(() => {
  return {
    version: 'golden_egg_admin_v1',
    updatedAt: new Date().toISOString(),
    campaign: cloneByJson(campaign),
    prizes: cloneByJson(prizes.value)
  }
})

let savedMessageTimer = null
let operationMessageTimer = null

const clearSavedMessageTimer = () => {
  if (savedMessageTimer) {
    window.clearTimeout(savedMessageTimer)
    savedMessageTimer = null
  }
}

const clearOperationMessageTimer = () => {
  if (operationMessageTimer) {
    window.clearTimeout(operationMessageTimer)
    operationMessageTimer = null
  }
}

const showSavedMessage = (message, type = 'success') => {
  clearSavedMessageTimer()
  savedMessage.value = message
  savedMessageType.value = type

  savedMessageTimer = window.setTimeout(() => {
    savedMessage.value = ''
    savedMessageTimer = null
  }, type === 'error' ? 3600 : 2400)
}

const showOperationMessage = (message, type = 'info', autoClear = true) => {
  clearOperationMessageTimer()
  operationMessage.value = message
  operationMessageType.value = type

  if (autoClear) {
    operationMessageTimer = window.setTimeout(() => {
      operationMessage.value = ''
      operationMessageTimer = null
    }, type === 'error' ? 4200 : 2600)
  }
}

const showOperationSuccess = (message) => {
  showSavedMessage(message, 'success')
  showOperationMessage(message, 'success')
}

const showOperationError = (message) => {
  showSavedMessage(message, 'error')
  showOperationMessage(message, 'error')
}

const showOperationInfo = (message, autoClear = true) => {
  showOperationMessage(message, 'info', autoClear)
}


const waitOperationFeedbackFrame = async (minimumMs = 450) => {
  await nextTick()
  await new Promise((resolve) => window.setTimeout(resolve, minimumMs))
}

const adminToastClass = computed(() => {
  if (savedMessageType.value === 'error') {
    return 'bg-rose-600 text-white'
  }

  if (savedMessageType.value === 'info') {
    return 'bg-blue-700 text-white'
  }

  return 'bg-slate-900 text-white'
})

const operationMessageClass = computed(() => {
  if (operationMessageType.value === 'error') {
    return 'border-rose-200 bg-rose-50 text-rose-700'
  }

  if (operationMessageType.value === 'success') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  return 'border-blue-200 bg-blue-50 text-blue-700'
})

const saveState = (message = '') => {
  localStorage.setItem(GOLDEN_EGG_ADMIN_STATE_KEY, JSON.stringify(payload.value))
  localStorage.setItem(
    GOLDEN_EGG_ADMIN_SYNC_KEY,
    JSON.stringify({
      updatedAt: new Date().toISOString(),
      source: 'golden-egg-admin'
    })
  )

  if (isAutoPreviewEnabled.value) {
    previewRefreshKey.value = Date.now()
  }

  if (message) {
    showSavedMessage(message)
  }
}

const scheduleSaveState = () => {
  if (saveTimer) {
    window.clearTimeout(saveTimer)
  }

  saveTimer = window.setTimeout(() => {
    saveTimer = null
    saveState()
  }, 260)
}

const loadState = () => {
  const saved = safeJsonParse(localStorage.getItem(GOLDEN_EGG_ADMIN_STATE_KEY), null)

  if (!saved) {
    saveState()
    return
  }

  if (saved.campaign) {
    Object.assign(campaign, {
      ...cloneByJson(defaultCampaignSnapshot),
      ...saved.campaign
    })
  }

  if (Array.isArray(saved.prizes) && saved.prizes.length) {
    prizes.value = saved.prizes.map((prize, index) => ({
      id: prize.id || `admin-prize-${index + 1}`,
      name: prize.name || `獎項 ${index + 1}`,
      shortName: prize.shortName || prize.name || `獎${index + 1}`,
      description: prize.description || '請洽主辦單位兌換。',
      icon: prize.icon || '🎁',
      imageUrl: prize.imageUrl || '',
      isEnabled: prize.isEnabled !== false,
      probability: normalizePrizeProbability(prize.probability),
      stock: Number(prize.stock ?? 0),
      type: prize.type === 'lose' ? 'lose' : 'win',
      rank: prize.rank || (prize.type === 'lose' ? 'none' : 'normal')
    }))
  }

  previewRefreshKey.value = Date.now()
}

const syncPreviewVisualSettingsToDatabaseForm = () => {
  databaseGameConfigForm.eggSize = Number(campaign.eggSize || databaseGameConfigForm.eggSize || 74)
  databaseGameConfigForm.eggCardSize = Number(campaign.eggCardSize || databaseGameConfigForm.eggCardSize || 128)
  databaseGameConfigForm.eggGridGap = Number(campaign.eggGridGap || campaign.eggGap || databaseGameConfigForm.eggGridGap || 12)
  databaseGameConfigForm.eggColorTop = campaign.eggColorTop || databaseGameConfigForm.eggColorTop || '#fff7ad'
  databaseGameConfigForm.eggColorMiddle = campaign.eggColorMiddle || databaseGameConfigForm.eggColorMiddle || '#fde047'
  databaseGameConfigForm.eggColorBottom = campaign.eggColorBottom || databaseGameConfigForm.eggColorBottom || '#b45309'
  databaseGameConfigForm.shareTitle = campaign.shareTitle || databaseGameConfigForm.shareTitle || '九宮格砸金蛋抽獎活動'
  databaseGameConfigForm.shareDescription = campaign.shareDescription || databaseGameConfigForm.shareDescription || '輸入活動序號，立即砸金蛋抽好禮！'
  databaseGameConfigForm.shareUrl = campaign.shareUrl || databaseGameConfigForm.shareUrl || `https://marketing-game-v1-em29.vercel.app/games/golden-egg?campaignId=${normalizedDatabaseCampaignId.value || 1}`
  databaseGameConfigForm.shareImageUrl = campaign.shareImageUrl || databaseGameConfigForm.shareImageUrl || ''
  databaseGameConfigForm.systemShareText = campaign.systemShareText || databaseGameConfigForm.systemShareText || '🎉 九宮格砸金蛋抽獎活動\n輸入活動序號，立即砸金蛋抽好禮！'
  databaseGameConfigForm.lineShareText = campaign.lineShareText || databaseGameConfigForm.lineShareText || '🎉 九宮格砸金蛋抽獎活動｜輸入序號就有機會中大獎！'
  databaseGameConfigForm.telegramShareText = campaign.telegramShareText || databaseGameConfigForm.telegramShareText || '🎉 九宮格砸金蛋抽獎活動｜輸入序號就有機會中大獎！'
}

const syncToFrontNow = async () => {
  // 第 353 批：
  // 這顆按鈕以前只存 localStorage，會造成電腦前台同步、手機不同步。
  // 現在若已載入正式 campaignId，就同步寫入 PostgreSQL gameConfig.settings。
  syncSystemShareButtonSettingsToPreview()
  saveState('已同步到右側預覽。')
  showOperationSuccess('已同步到右側預覽。')

  if (!normalizedDatabaseCampaignId.value) {
    setDatabasePreviewSyncMessage('尚未載入正式 campaignId；目前只同步本機預覽。若要同步手機前台，請先在資料庫模式讀取活動。')
    return
  }

  syncPreviewVisualSettingsToDatabaseForm()
  await saveDatabaseGameConfig()
}

const refreshPreview = () => {
  refreshRightPreviewFromSystemShareSettings()
  previewRefreshKey.value = Date.now()
  showOperationSuccess('已重新整理右側預覽。')
}

const resetAllSettings = () => {
  const confirmed = window.confirm('確定要還原砸金蛋後台設定嗎？目前文字、色彩與獎項會回到預設值。')

  if (!confirmed) return

  Object.assign(campaign, cloneByJson(defaultCampaignSnapshot))
  prizes.value = cloneByJson(defaultPrizesSnapshot)
  saveState('已還原砸金蛋預設設定。')
  showOperationSuccess('已還原砸金蛋預設設定。')
}

const addPrize = () => {
  const nextNumber = prizes.value.length + 1

  prizes.value = [
    ...prizes.value,
    {
      id: `custom-golden-egg-prize-${Date.now()}`,
      name: `自訂獎項 ${nextNumber}`,
      shortName: `獎${nextNumber}`,
      description: '請在後台填寫獎項說明。',
      icon: '🎁',
      imageUrl: '',
      isEnabled: true,
      probability: 10,
      stock: 10,
      type: 'win',
      rank: 'normal'
    }
  ]

  saveState('已新增獎項。')
}

const duplicatePrize = (prize) => {
  const copiedPrize = {
    ...cloneByJson(prize),
    id: `copy-golden-egg-prize-${Date.now()}`,
    name: `${prize.name || '獎項'} 複製`,
    shortName: prize.shortName || '複製',
    isEnabled: true
  }

  prizes.value = [
    ...prizes.value,
    copiedPrize
  ]

  saveState('已複製獎項。')
}

const removePrize = (prize) => {
  if (prizes.value.length <= 1) {
    window.alert('至少需要保留 1 個獎項。')
    return
  }

  const confirmed = window.confirm(`確定要刪除「${prize.name}」嗎？`)

  if (!confirmed) return

  prizes.value = prizes.value.filter((item) => item.id !== prize.id)
  saveState('已刪除獎項。')
}

const averageProbability = () => {
  if (!prizes.value.length) return

  const baseValue = Math.floor(100 / prizes.value.length)
  const remainder = 100 - baseValue * prizes.value.length

  prizes.value = prizes.value.map((prize, index) => ({
    ...prize,
    probability: baseValue + (index < remainder ? 1 : 0)
  }))

  saveState('已已平均分配百分比機率，總和為 100%。')
}

const clearProbability = () => {
  const confirmed = window.confirm('確定要清空所有百分比機率嗎？清空後前台會暫時無法抽出獎項。')

  if (!confirmed) return

  prizes.value = prizes.value.map((prize) => ({
    ...prize,
    probability: 0
  }))

  saveState('已清空所有百分比機率。')
}

const movePrize = (index, direction) => {
  const targetIndex = index + direction

  if (targetIndex < 0 || targetIndex >= prizes.value.length) return

  const nextPrizes = [...prizes.value]
  const current = nextPrizes[index]
  nextPrizes[index] = nextPrizes[targetIndex]
  nextPrizes[targetIndex] = current
  prizes.value = nextPrizes

  saveState('已調整獎項排序。')
}


const readImageFileAsDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve('')
      return
    }

    if (!String(file.type || '').startsWith('image/')) {
      reject(new Error('請選擇圖片檔案'))
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      resolve(String(reader.result || ''))
    }

    reader.onerror = () => {
      reject(new Error('圖片讀取失敗'))
    }

    reader.readAsDataURL(file)
  })
}

const handleResultImageUpload = async (event) => {
  const file = event.target?.files?.[0]

  if (!file) return

  try {
    campaign.resultImageUrl = await readImageFileAsDataUrl(file)
    saveState('已上傳全域結果圖片。')
  } catch (error) {
    console.error('上傳全域結果圖片失敗：', error)
    showOperationError(error.message || '上傳圖片失敗')
  } finally {
    if (event.target) {
      event.target.value = ''
    }
  }
}

const clearResultImage = () => {
  campaign.resultImageUrl = ''
  saveState('已清除全域結果圖片。')
}

const handlePrizeImageUpload = async (event, prize) => {
  const file = event.target?.files?.[0]

  if (!file || !prize) return

  try {
    prize.imageUrl = await readImageFileAsDataUrl(file)
    saveState(`已上傳「${prize.name || '獎項'}」圖片。`)
  } catch (error) {
    console.error('上傳獎項圖片失敗：', error)
    showOperationError(error.message || '上傳圖片失敗')
  } finally {
    if (event.target) {
      event.target.value = ''
    }
  }
}

const clearPrizeImage = (prize) => {
  if (!prize) return

  prize.imageUrl = ''
  saveState(`已清除「${prize.name || '獎項'}」圖片。`)
}


const isSerialCodeExpired = (item) => {
  if (!item?.expireAt) return false

  const expireTime = new Date(item.expireAt).getTime()

  if (Number.isNaN(expireTime)) return false

  return expireTime < Date.now()
}

const getSerialStatusLabel = (item) => {
  if (item.usedAt) return '已使用'
  if (item.isEnabled === false) return '停用'
  if (isSerialCodeExpired(item)) return '已過期'

  return '可用'
}

const getSerialStatusClass = (item) => {
  if (item.usedAt) return 'bg-amber-50 text-amber-700 ring-1 ring-amber-100'
  if (item.isEnabled === false) return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
  if (isSerialCodeExpired(item)) return 'bg-rose-50 text-rose-700 ring-1 ring-rose-100'

  return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
}

const applySerialExpirePreset = (preset) => {
  serialExpireMode.value = preset === 'none' ? 'none' : 'days'

  if (preset === 'today') {
    serialExpireMode.value = 'custom'
    const date = new Date()
    date.setHours(23, 59, 0, 0)
    serialCustomExpireAt.value = date.toISOString().slice(0, 16)
    return
  }

  if (preset === '3days') {
    serialExpireDays.value = 3
    return
  }

  if (preset === '7days') {
    serialExpireDays.value = 7
    return
  }

  if (preset === '30days') {
    serialExpireDays.value = 30
  }
}

const getSerialExpireAt = () => {
  if (serialExpireMode.value === 'days') {
    const days = Math.max(1, Number(serialExpireDays.value || 1))
    const date = new Date()

    date.setDate(date.getDate() + days)
    date.setHours(23, 59, 59, 999)

    return date.toISOString()
  }

  if (serialExpireMode.value === 'custom' && serialCustomExpireAt.value) {
    const date = new Date(serialCustomExpireAt.value)

    if (!Number.isNaN(date.getTime())) {
      return date.toISOString()
    }
  }

  return ''
}

const formatSerialExpireText = (value) => {
  if (!value) return '永不過期'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '永不過期'

  return date.toLocaleString('zh-TW')
}

const getBulkSerialExpireAt = () => {
  if (bulkExpireMode.value === 'days') {
    const days = Math.max(1, Number(bulkExpireDays.value || 1))
    const date = new Date()

    date.setDate(date.getDate() + days)
    date.setHours(23, 59, 59, 999)

    return date.toISOString()
  }

  if (bulkExpireMode.value === 'custom' && bulkCustomExpireAt.value) {
    const date = new Date(bulkCustomExpireAt.value)

    if (!Number.isNaN(date.getTime())) {
      return date.toISOString()
    }
  }

  return ''
}

const applyBulkExpirePreset = (preset) => {
  bulkExpireMode.value = preset === 'none' ? 'none' : 'days'

  if (preset === 'today') {
    bulkExpireMode.value = 'custom'
    const date = new Date()
    date.setHours(23, 59, 0, 0)
    bulkCustomExpireAt.value = date.toISOString().slice(0, 16)
    return
  }

  if (preset === '3days') {
    bulkExpireDays.value = 3
    return
  }

  if (preset === '7days') {
    bulkExpireDays.value = 7
    return
  }

  if (preset === '30days') {
    bulkExpireDays.value = 30
  }
}

const getFilteredSerialCodeIds = () => {
  return new Set(filteredSerialCodes.value.map((item) => item.id))
}

const updateFilteredSerialCodes = (updater) => {
  const ids = getFilteredSerialCodeIds()

  if (!ids.size) {
    window.alert('目前篩選結果沒有序號可以操作。')
    return 0
  }

  serialCodes.value = serialCodes.value.map((item) => {
    if (!ids.has(item.id)) return item

    return updater(item)
  })

  saveSerialCodes()

  return ids.size
}

const applyBulkExpireToFiltered = () => {
  const count = filteredSerialCodes.value.length

  if (!count) {
    window.alert('目前篩選結果沒有序號可以修改。')
    return
  }

  const confirmed = window.confirm(`確定要把目前篩選出的 ${count} 組序號套用新的有效期限嗎？`)

  if (!confirmed) return

  const expireAt = getBulkSerialExpireAt()
  const expireAtText = formatSerialExpireText(expireAt)

  const updatedCount = updateFilteredSerialCodes((item) => ({
    ...item,
    expireAt,
    expireAtText
  }))

  showSavedMessage(`已批次更新 ${updatedCount} 組序號有效期限。`)
}

const enableFilteredSerialCodes = () => {
  const count = filteredSerialCodes.value.length

  if (!count) {
    window.alert('目前篩選結果沒有序號可以啟用。')
    return
  }

  const confirmed = window.confirm(`確定要啟用目前篩選出的 ${count} 組序號嗎？`)

  if (!confirmed) return

  const updatedCount = updateFilteredSerialCodes((item) => ({
    ...item,
    isEnabled: true
  }))

  showSavedMessage(`已啟用 ${updatedCount} 組序號。`)
}

const disableFilteredSerialCodes = () => {
  const count = filteredSerialCodes.value.length

  if (!count) {
    window.alert('目前篩選結果沒有序號可以停用。')
    return
  }

  const confirmed = window.confirm(`確定要停用目前篩選出的 ${count} 組序號嗎？`)

  if (!confirmed) return

  const updatedCount = updateFilteredSerialCodes((item) => ({
    ...item,
    isEnabled: false
  }))

  showSavedMessage(`已停用 ${updatedCount} 組序號。`)
}

const deleteFilteredSerialCodes = () => {
  const ids = getFilteredSerialCodeIds()
  const count = ids.size

  if (!count) {
    window.alert('目前篩選結果沒有序號可以刪除。')
    return
  }

  const confirmed = window.confirm(`確定要刪除目前篩選出的 ${count} 組序號嗎？這個動作不能復原。`)

  if (!confirmed) return

  serialCodes.value = serialCodes.value.filter((item) => !ids.has(item.id))
  saveSerialCodes()
  showSavedMessage(`已刪除 ${count} 組序號。`)
}

const loadEggPlayLogs = () => {
  eggPlayLogs.value = safeJsonParse(localStorage.getItem(GOLDEN_EGG_HISTORY_KEY), []) || []
  lastEggPlayLogRefreshAt.value = new Date().toLocaleTimeString('zh-TW')
}

let eggPlayLogRefreshTimer = null

const startEggPlayLogAutoRefresh = () => {
  if (eggPlayLogRefreshTimer) {
    window.clearInterval(eggPlayLogRefreshTimer)
  }

  eggPlayLogRefreshTimer = window.setInterval(() => {
    if (autoRefreshEggPlayLogs.value) {
      loadEggPlayLogs()
    }
  }, Math.max(1, Number(eggPlayLogRefreshSeconds.value || 3)) * 1000)
}

const stopEggPlayLogAutoRefresh = () => {
  if (!eggPlayLogRefreshTimer) return

  window.clearInterval(eggPlayLogRefreshTimer)
  eggPlayLogRefreshTimer = null
}

const refreshEggPlayLogs = () => {
  loadEggPlayLogs()
  showSavedMessage('已重新讀取砸蛋紀錄。')
}

const clearEggPlayLogs = () => {
  const confirmed = window.confirm('確定要清除所有砸蛋紀錄嗎？這會清除目前瀏覽器 localStorage 裡的前台砸蛋紀錄。')

  if (!confirmed) return

  eggPlayLogs.value = []
  localStorage.setItem(GOLDEN_EGG_HISTORY_KEY, JSON.stringify([]))
  showSavedMessage('已清除砸蛋紀錄。')
}

const exportEggPlayLogsCsv = () => {
  const header = [
    'logId',
    'createdAt',
    'eggNumber',
    'prizeName',
    'prizeType',
    'status'
  ]

  const rows = filteredEggPlayLogs.value.map((item) => [
    item.id || '',
    item.createdAt || '',
    item.eggNumber || '',
    item.prizeName || '',
    item.prizeType || '',
    item.prizeType === 'lose' ? 'lose' : 'win'
  ])

  const csv = [
    header.join(','),
    ...rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
  ].join('\n')

  const blob = new Blob([`\ufeff${csv}`], {
    type: 'text/csv;charset=utf-8'
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `golden-egg-play-logs-${Date.now()}.csv`
  link.click()

  URL.revokeObjectURL(url)
  showSavedMessage('已匯出砸蛋紀錄 CSV。')
}

const normalizeManualSerialCode = (value) => {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-')
    .replace(/[^A-Z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
}

const getManualSerialExpireAt = () => {
  if (manualSerialExpireMode.value === 'days') {
    const days = Math.max(1, Number(manualSerialExpireDays.value || 1))
    const date = new Date()

    date.setDate(date.getDate() + days)
    date.setHours(23, 59, 59, 999)

    return date.toISOString()
  }

  if (manualSerialExpireMode.value === 'custom' && manualCustomExpireAt.value) {
    const date = new Date(manualCustomExpireAt.value)

    if (!Number.isNaN(date.getTime())) {
      return date.toISOString()
    }
  }

  return ''
}

const applyManualExpirePreset = (preset) => {
  manualSerialExpireMode.value = preset === 'none' ? 'none' : 'days'

  if (preset === 'today') {
    manualSerialExpireMode.value = 'custom'
    const date = new Date()
    date.setHours(23, 59, 0, 0)
    manualCustomExpireAt.value = date.toISOString().slice(0, 16)
    return
  }

  if (preset === '3days') {
    manualSerialExpireDays.value = 3
    return
  }

  if (preset === '7days') {
    manualSerialExpireDays.value = 7
    return
  }

  if (preset === '30days') {
    manualSerialExpireDays.value = 30
  }
}

const createManualSerialItem = (code) => {
  const expireAt = getManualSerialExpireAt()
  const batchCode = normalizeManualSerialCode(manualSerialBatchCode.value).slice(0, 16)

  return {
    id: `manual-serial-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    code,
    rewardChance: Math.min(99, Math.max(1, Number(manualSerialRewardChance.value || 1))),
    batchCode,
    codeLength: code.replaceAll('-', '').length,
    isEnabled: true,
    createdAt: new Date().toISOString(),
    createdAtText: new Date().toLocaleString('zh-TW'),
    expireAt,
    expireAtText: formatSerialExpireText(expireAt),
    usedAt: '',
    usedAtText: '',
    usedBy: '',
    distributedAt: '',
    distributedAtText: '',
    distributedTo: '',
    distributedChannel: '',
    note: '手動新增'
  }
}

const addManualSerialCode = async () => {
  const code = normalizeManualSerialCode(manualSerialCode.value)

  if (!code) {
    showOperationError('請先輸入序號。')
    return
  }

  if (code.length < 6) {
    showOperationError('序號太短，至少需要 6 個字元。')
    return
  }

  const exists = serialCodes.value.some((item) => String(item.code || '').toUpperCase() === code)

  if (exists) {
    showOperationError('這組序號已經存在，不能重複新增。')
    return
  }

  localSerialAction.value = 'manual-create'
  showOperationInfo('正在新增單組序號，請稍候...', false)

  try {
    await waitOperationFeedbackFrame()

    serialCodes.value = [
      createManualSerialItem(code),
      ...serialCodes.value
    ]

    manualSerialCode.value = ''
    saveSerialCodes()
    showOperationSuccess('已手動新增 1 組序號。')
  } finally {
    localSerialAction.value = ''
  }
}

const addBulkManualSerialCodes = async () => {
  const rawText = String(bulkSerialCodesText.value || '').trim()

  if (!rawText) {
    showOperationError('請先貼上要新增的序號。')
    return
  }

  const candidates = rawText
    .split(/[\n,;，；\t ]+/)
    .map(normalizeManualSerialCode)
    .filter((code) => code && code.length >= 6)

  if (!candidates.length) {
    showOperationError('沒有找到可用的序號，請確認格式。')
    return
  }

  const existingCodes = new Set(serialCodes.value.map((item) => String(item.code || '').toUpperCase()))
  const uniqueCodes = []

  candidates.forEach((code) => {
    if (existingCodes.has(code)) return

    existingCodes.add(code)
    uniqueCodes.push(code)
  })

  if (!uniqueCodes.length) {
    showOperationError('貼上的序號都已經存在，沒有新增。')
    return
  }

  localSerialAction.value = 'manual-bulk'
  showOperationInfo(`正在批次新增 ${uniqueCodes.length} 組序號，請稍候...`, false)

  try {
    await waitOperationFeedbackFrame()

    const newItems = uniqueCodes.map((code) => createManualSerialItem(code))

    serialCodes.value = [
      ...newItems,
      ...serialCodes.value
    ]

    bulkSerialCodesText.value = ''
    saveSerialCodes()
    showOperationSuccess(`已批次新增 ${newItems.length} 組序號，略過 ${candidates.length - uniqueCodes.length} 組重複序號。`)
  } finally {
    localSerialAction.value = ''
  }
}

const parseCsvLine = (line) => {
  const values = []
  let current = ''
  let insideQuote = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const nextChar = line[index + 1]

    if (char === '"' && insideQuote && nextChar === '"') {
      current += '"'
      index += 1
      continue
    }

    if (char === '"') {
      insideQuote = !insideQuote
      continue
    }

    if (char === ',' && !insideQuote) {
      values.push(current)
      current = ''
      continue
    }

    current += char
  }

  values.push(current)

  return values.map((value) => value.trim())
}

const normalizeImportedSerialItem = (rawItem, fallbackIndex = 0) => {
  const code = normalizeManualSerialCode(rawItem.code || rawItem.serialCode || rawItem[0] || '')

  if (!code || code.length < 6) return null

  const rewardChance = Math.min(99, Math.max(1, Number(rawItem.rewardChance || rawItem.chance || rawItem[1] || 1)))
  const expireAt = rawItem.expireAt || rawItem.expire_at || ''
  const batchCode = normalizeManualSerialCode(rawItem.batchCode || rawItem.batch || rawItem[2] || '').slice(0, 16)
  const createdAt = rawItem.createdAt || new Date().toISOString()
  const usedAt = rawItem.usedAt || ''

  return {
    id: rawItem.id || `import-serial-${Date.now()}-${fallbackIndex}`,
    code,
    rewardChance,
    batchCode,
    codeLength: Number(rawItem.codeLength || code.replaceAll('-', '').length),
    isEnabled: rawItem.isEnabled === false || rawItem.status === 'disabled' ? false : true,
    createdAt,
    createdAtText: rawItem.createdAtText || new Date(createdAt).toLocaleString('zh-TW'),
    expireAt,
    expireAtText: rawItem.expireAtText || formatSerialExpireText(expireAt),
    usedAt,
    usedAtText: rawItem.usedAtText || (usedAt ? new Date(usedAt).toLocaleString('zh-TW') : ''),
    usedBy: rawItem.usedBy || '',
    distributedAt: rawItem.distributedAt || '',
    distributedAtText: rawItem.distributedAtText || '',
    distributedTo: rawItem.distributedTo || rawItem.recipient || '',
    distributedChannel: rawItem.distributedChannel || rawItem.channel || '',
    note: rawItem.note || rawItem.memo || '匯入序號'
  }
}

const parseImportedSerialCodes = (text, filename = '') => {
  const trimmedText = String(text || '').trim()

  if (!trimmedText) return []

  if (filename.toLowerCase().endsWith('.json') || trimmedText.startsWith('[') || trimmedText.startsWith('{')) {
    const parsed = JSON.parse(trimmedText)
    const items = Array.isArray(parsed) ? parsed : parsed.serialCodes || parsed.codes || []

    return items
      .map((item, index) => normalizeImportedSerialItem(item, index))
      .filter(Boolean)
  }

  const lines = trimmedText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (!lines.length) return []

  const firstRow = parseCsvLine(lines[0]).map((value) => value.trim())
  const hasHeader = firstRow.some((value) => ['code', 'serialCode', 'rewardChance', 'batchCode'].includes(value))

  const headers = hasHeader
    ? firstRow
    : ['code', 'rewardChance', 'batchCode', 'expireAt', 'note']

  const dataLines = hasHeader ? lines.slice(1) : lines

  return dataLines
    .map((line, index) => {
      const values = parseCsvLine(line)
      const rawItem = {}

      headers.forEach((header, headerIndex) => {
        rawItem[header] = values[headerIndex] || ''
      })

      return normalizeImportedSerialItem(rawItem, index)
    })
    .filter(Boolean)
}

const downloadSerialCsvTemplate = () => {
  const rows = [
    ['code', 'rewardChance', 'batchCode', 'expireAt', 'note'],
    ['VIP001', '1', 'VIP', '', '範例：永不過期'],
    ['VIP002', '2', 'VIP', '2026-12-31T23:59:00.000Z', '範例：指定有效期限'],
    ['APRIL001', '1', 'APRIL', '', '範例：4月活動']
  ]

  const csv = rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([`\ufeff${csv}`], {
    type: 'text/csv;charset=utf-8'
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = 'golden-egg-serial-import-template.csv'
  link.click()

  URL.revokeObjectURL(url)
  showSavedMessage('已下載序號匯入 CSV 範本。')
}

const copySerialCsvExample = async () => {
  const example = [
    'code,rewardChance,batchCode,expireAt,note',
    'VIP001,1,VIP,,範例：永不過期',
    'VIP002,2,VIP,2026-12-31T23:59:00.000Z,範例：指定有效期限',
    'APRIL001,1,APRIL,,範例：4月活動'
  ].join('\n')

  try {
    await navigator.clipboard.writeText(example)
    showSavedMessage('已複製 CSV 範例格式。')
  } catch (error) {
    window.prompt('請手動複製 CSV 範例：', example)
  }
}

const triggerSerialImport = () => {
  serialImportFileInput.value?.click()
}

const buildSerialImportPreview = (items = [], filename = '') => {
  const baseCodes = replaceSerialCodesOnImport.value ? [] : serialCodes.value
  const existingCodes = new Set(baseCodes.map((item) => String(item.code || '').toUpperCase()))
  const seenInFile = new Set()
  const validItems = []
  const duplicateItems = []
  const invalidItems = []

  items.forEach((item, index) => {
    const code = String(item?.code || '').toUpperCase()

    if (!code || code.length < 6) {
      invalidItems.push({
        index: index + 1,
        raw: item,
        reason: '序號空白或長度不足'
      })
      return
    }

    if (existingCodes.has(code) || seenInFile.has(code)) {
      duplicateItems.push(item)
      return
    }

    seenInFile.add(code)
    validItems.push(item)
  })

  serialImportPreview.value = {
    filename,
    total: items.length,
    validItems,
    duplicateItems,
    invalidItems,
    createdAt: new Date().toLocaleString('zh-TW')
  }
}

const handleSerialImportFile = async (event) => {
  const file = event.target?.files?.[0]

  if (!file) return

  try {
    const text = await file.text()
    const importedItems = parseImportedSerialCodes(text, file.name)

    if (!importedItems.length) {
      window.alert('沒有找到可匯入的序號。')
      return
    }

    buildSerialImportPreview(importedItems, file.name)
    showSavedMessage('已讀取檔案，請確認預覽後再匯入。')
  } catch (error) {
    console.error('讀取序號匯入檔失敗：', error)
    window.alert('讀取失敗，請確認 JSON / CSV 格式是否正確。')
  } finally {
    if (event.target) {
      event.target.value = ''
    }
  }
}

const copyImportPreviewDuplicates = async () => {
  if (!serialImportPreview.value?.duplicateItems?.length) {
    window.alert('目前沒有重複序號可以複製。')
    return
  }

  const text = serialImportPreview.value.duplicateItems
    .map((item) => item.code)
    .filter(Boolean)
    .join('\n')

  try {
    await navigator.clipboard.writeText(text)
    showSavedMessage('已複製重複序號清單。')
  } catch (error) {
    window.prompt('請手動複製重複序號：', text)
  }
}

const copyImportPreviewInvalidRows = async () => {
  if (!serialImportPreview.value?.invalidItems?.length) {
    window.alert('目前沒有無效資料可以複製。')
    return
  }

  const text = serialImportPreview.value.invalidItems
    .map((item) => `第 ${item.index} 筆｜${item.reason}`)
    .join('\n')

  try {
    await navigator.clipboard.writeText(text)
    showSavedMessage('已複製無效資料清單。')
  } catch (error) {
    window.prompt('請手動複製無效資料：', text)
  }
}

const exportSerialImportPreviewReportCsv = () => {
  if (!serialImportPreview.value) {
    window.alert('目前沒有匯入預覽可以匯出。')
    return
  }

  const rows = [
    ['type', 'code', 'rewardChance', 'batchCode', 'expireAt', 'note', 'reason'],
    ...serialImportPreview.value.validItems.map((item) => [
      'valid',
      item.code || '',
      item.rewardChance || '',
      item.batchCode || '',
      item.expireAtText || item.expireAt || '',
      item.note || '',
      ''
    ]),
    ...serialImportPreview.value.duplicateItems.map((item) => [
      'duplicate',
      item.code || '',
      item.rewardChance || '',
      item.batchCode || '',
      item.expireAtText || item.expireAt || '',
      item.note || '',
      '序號重複'
    ]),
    ...serialImportPreview.value.invalidItems.map((item) => [
      'invalid',
      '',
      '',
      '',
      '',
      '',
      item.reason || '資料無效'
    ])
  ]

  const csv = rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([`\ufeff${csv}`], {
    type: 'text/csv;charset=utf-8'
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `golden-egg-serial-import-preview-${Date.now()}.csv`
  link.click()

  URL.revokeObjectURL(url)
  showSavedMessage('已匯出匯入檢查報告 CSV。')
}

const confirmSerialImportPreview = () => {
  if (!serialImportPreview.value) {
    window.alert('目前沒有待匯入的序號預覽。')
    return
  }

  const validItems = serialImportPreview.value.validItems || []

  if (!validItems.length) {
    window.alert('沒有可匯入的新序號。')
    return
  }

  const baseCodes = replaceSerialCodesOnImport.value ? [] : serialCodes.value

  serialCodes.value = [
    ...validItems,
    ...baseCodes
  ]

  saveSerialCodes()
  showSavedMessage(`匯入完成：新增 ${validItems.length} 組，略過 ${serialImportPreview.value.duplicateItems.length} 組重複，無效 ${serialImportPreview.value.invalidItems.length} 組。`)
  serialImportPreview.value = null
}

const cancelSerialImportPreview = () => {
  serialImportPreview.value = null
  showSavedMessage('已取消序號匯入。')
}

const markSerialDistributed = (item) => {
  if (!item) return

  item.distributedAt = new Date().toISOString()
  item.distributedAtText = new Date().toLocaleString('zh-TW')
  item.distributedTo = item.distributedTo || ''
  item.distributedChannel = item.distributedChannel || bulkDistributeChannel.value || 'LINE'

  saveSerialCodes()
  showSavedMessage('已標記序號為已發放。')
}

const unmarkSerialDistributed = (item) => {
  if (!item) return

  item.distributedAt = ''
  item.distributedAtText = ''
  item.distributedTo = ''
  item.distributedChannel = ''

  saveSerialCodes()
  showSavedMessage('已取消序號發放狀態。')
}

const markFilteredSerialCodesDistributed = () => {
  const count = filteredSerialCodes.value.length

  if (!count) {
    window.alert('目前篩選結果沒有序號可以標記。')
    return
  }

  const confirmed = window.confirm(`確定要把目前篩選出的 ${count} 組序號標記為已發放嗎？`)

  if (!confirmed) return

  const distributedAt = new Date().toISOString()
  const distributedAtText = new Date().toLocaleString('zh-TW')
  const distributedTo = String(bulkDistributeTo.value || '').trim()
  const distributedChannel = String(bulkDistributeChannel.value || '').trim() || 'LINE'

  const updatedCount = updateFilteredSerialCodes((item) => ({
    ...item,
    distributedAt,
    distributedAtText,
    distributedTo: distributedTo || item.distributedTo || '',
    distributedChannel
  }))

  showSavedMessage(`已批次標記 ${updatedCount} 組序號為已發放。`)
}

const unmarkFilteredSerialCodesDistributed = () => {
  const count = filteredSerialCodes.value.length

  if (!count) {
    window.alert('目前篩選結果沒有序號可以取消發放。')
    return
  }

  const confirmed = window.confirm(`確定要把目前篩選出的 ${count} 組序號改為未發放嗎？`)

  if (!confirmed) return

  const updatedCount = updateFilteredSerialCodes((item) => ({
    ...item,
    distributedAt: '',
    distributedAtText: '',
    distributedTo: '',
    distributedChannel: ''
  }))

  showSavedMessage(`已批次取消 ${updatedCount} 組序號發放狀態。`)
}

const loadSerialCodes = () => {
  serialCodes.value = safeJsonParse(localStorage.getItem(GOLDEN_EGG_SERIAL_CODES_KEY), []) || []
}

const loadSerialRedeemLogs = () => {
  serialRedeemLogs.value = safeJsonParse(localStorage.getItem(GOLDEN_EGG_SERIAL_REDEEM_LOG_KEY), []) || []
  lastRedeemLogRefreshAt.value = new Date().toLocaleTimeString('zh-TW')
}

let redeemLogRefreshTimer = null

const startRedeemLogAutoRefresh = () => {
  if (redeemLogRefreshTimer) {
    window.clearInterval(redeemLogRefreshTimer)
  }

  redeemLogRefreshTimer = window.setInterval(() => {
    if (autoRefreshRedeemLogs.value) {
      loadSerialRedeemLogs()
    }
  }, Math.max(1, Number(redeemLogRefreshSeconds.value || 3)) * 1000)
}

const stopRedeemLogAutoRefresh = () => {
  if (!redeemLogRefreshTimer) return

  window.clearInterval(redeemLogRefreshTimer)
  redeemLogRefreshTimer = null
}

const saveSerialCodes = () => {
  localStorage.setItem(GOLDEN_EGG_SERIAL_CODES_KEY, JSON.stringify(serialCodes.value))
}

const createSecureRandomText = (length = 18) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const normalizedLength = Math.min(32, Math.max(12, Number(length || 18)))
  const bytes = new Uint32Array(normalizedLength)

  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes)
  } else {
    for (let index = 0; index < normalizedLength; index += 1) {
      bytes[index] = Math.floor(Math.random() * 4294967295)
    }
  }

  return Array.from(bytes, (value) => chars[value % chars.length]).join('')
}

const formatSerialCodeBlocks = (value) => {
  return String(value || '')
    .replace(/(.{4})/g, '$1-')
    .replace(/-$/, '')
}

const createRandomSerialCode = () => {
  const prefix = String(serialCodePrefix.value || 'EGG')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8) || 'EGG'

  const batch = String(serialBatchCode.value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8)

  const randomText = formatSerialCodeBlocks(createSecureRandomText(serialCodeLength.value))

  return [prefix, batch, randomText].filter(Boolean).join('-')
}

const generateSerialCodes = async () => {
  const count = Math.min(100, Math.max(1, Number(serialGenerateCount.value || 1)))
  const rewardChance = Math.min(99, Math.max(1, Number(serialRewardChance.value || 1)))
  const batch = String(serialBatchCode.value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8)
  const existingCodes = new Set(serialCodes.value.map((item) => String(item.code || '').toUpperCase()))
  const nextCodes = []

  localSerialAction.value = 'generate'
  showOperationInfo(`正在自動產生 ${count} 組序號，請稍候...`, false)

  try {
    await waitOperationFeedbackFrame()

    while (nextCodes.length < count) {
      const code = createRandomSerialCode()

      if (existingCodes.has(code)) continue

      existingCodes.add(code)
      nextCodes.push({
        id: `serial-${Date.now()}-${nextCodes.length}`,
        code,
        rewardChance,
        batchCode: batch,
        codeLength: Number(serialCodeLength.value || 18),
        isEnabled: true,
        createdAt: new Date().toISOString(),
        createdAtText: new Date().toLocaleString('zh-TW'),
        expireAt: getSerialExpireAt(),
        expireAtText: formatSerialExpireText(getSerialExpireAt()),
        usedAt: '',
        usedAtText: '',
        usedBy: '',
        distributedAt: '',
        distributedAtText: '',
        distributedTo: '',
        distributedChannel: '',
        note: ''
      })
    }

    serialCodes.value = [
      ...nextCodes,
      ...serialCodes.value
    ]

    saveSerialCodes()
    showOperationSuccess(`已產生 ${nextCodes.length} 組抽獎序號。`)
  } finally {
    localSerialAction.value = ''
  }
}

const copySerialCode = async (code) => {
  try {
    await navigator.clipboard.writeText(code)
    showSavedMessage('已複製序號。')
  } catch (error) {
    window.prompt('請手動複製序號：', code)
  }
}

const toggleSerialCodeEnabled = (item) => {
  item.isEnabled = item.isEnabled === false
  saveSerialCodes()
  showSavedMessage(item.isEnabled ? '已啟用序號。' : '已停用序號。')
}

const resetSerialCodeUsed = (item) => {
  const confirmed = window.confirm(`確定要把序號「${item.code}」改回未使用嗎？`)

  if (!confirmed) return

  item.usedAt = ''
  item.usedAtText = ''
  item.usedBy = ''
  saveSerialCodes()
  showSavedMessage('已重置序號使用狀態。')
}

const removeSerialCode = (item) => {
  const confirmed = window.confirm(`確定要刪除序號「${item.code}」嗎？`)

  if (!confirmed) return

  serialCodes.value = serialCodes.value.filter((codeItem) => codeItem.id !== item.id)
  saveSerialCodes()
  showSavedMessage('已刪除序號。')
}

const clearUsedSerialCodes = () => {
  const confirmed = window.confirm('確定要清除所有已使用序號嗎？')

  if (!confirmed) return

  serialCodes.value = serialCodes.value.filter((item) => !item.usedAt)
  saveSerialCodes()
  showSavedMessage('已清除已使用序號。')
}

const copyAvailableSerialCodes = async () => {
  const codes = availableSerialCodes.value.map((item) => item.code)

  if (!codes.length) {
    window.alert('目前沒有可用序號可以複製。')
    return
  }

  try {
    await navigator.clipboard.writeText(codes.join('\n'))
    showSavedMessage(`已複製 ${codes.length} 組可用序號。`)
  } catch (error) {
    window.prompt('請手動複製可用序號：', codes.join('\n'))
  }
}

const exportSerialCodesCsv = () => {
  const header = ['code', 'rewardChance', 'status', 'batchCode', 'createdAt', 'expireAt', 'distributedAt', 'distributedTo', 'distributedChannel', 'usedAt', 'note']
  const rows = serialCodes.value.map((item) => {
    const status = item.usedAt
      ? 'used'
      : item.isEnabled === false
        ? 'disabled'
        : 'unused'

    return [
      item.code || '',
      item.rewardChance || 1,
      status,
      item.batchCode || '',
      item.createdAtText || item.createdAt || '',
      item.expireAtText || item.expireAt || '',
      item.distributedAtText || item.distributedAt || '',
      item.distributedTo || '',
      item.distributedChannel || '',
      item.usedAtText || item.usedAt || '',
      item.note || ''
    ]
  })

  const csv = [
    header.join(','),
    ...rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
  ].join('\n')

  const blob = new Blob([`\ufeff${csv}`], {
    type: 'text/csv;charset=utf-8'
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `golden-egg-serial-codes-${Date.now()}.csv`
  link.click()

  URL.revokeObjectURL(url)
  showSavedMessage('已匯出序號 CSV。')
}

const clearAllSerialCodes = () => {
  const confirmed = window.confirm('確定要清除全部序號嗎？此動作會刪除可用、已使用、停用的所有序號。')

  if (!confirmed) return

  serialCodes.value = []
  saveSerialCodes()
  showSavedMessage('已清除全部序號。')
}


const clearSerialRedeemLogs = () => {
  const confirmed = window.confirm('確定要清除前台序號兌換紀錄嗎？')

  if (!confirmed) return

  serialRedeemLogs.value = []
  localStorage.setItem(GOLDEN_EGG_SERIAL_REDEEM_LOG_KEY, JSON.stringify([]))
  showSavedMessage('已清除序號兌換紀錄。')
}

const refreshSerialRedeemLogs = () => {
  loadSerialRedeemLogs()
  showSavedMessage('已重新讀取兌換紀錄。')
}

const exportSerialRedeemLogsCsv = () => {
  const codeMap = new Map(
    serialCodes.value.map((item) => [
      String(item.code || '').toUpperCase(),
      item
    ])
  )

  const header = [
    'redeemLogId',
    'redeemTime',
    'redeemIsoTime',
    'code',
    'status',
    'reason',
    'rewardChance',
    'batchCode',
    'serialCreatedAt',
    'serialExpireAt',
    'serialDistributedAt',
    'serialDistributedTo',
    'serialDistributedChannel',
    'serialUsedAt',
    'serialUsedBy',
    'serialEnabled',
    'serialNote'
  ]

  const rows = serialRedeemLogs.value.map((log) => {
    const matchedCode = codeMap.get(String(log.code || '').toUpperCase()) || {}

    return [
      log.id || '',
      log.createdAtText || '',
      log.createdAt || '',
      log.code || '',
      log.status === 'success' ? 'success' : 'failed',
      log.reason || '',
      log.rewardChance || 0,
      matchedCode.batchCode || '',
      matchedCode.createdAtText || matchedCode.createdAt || '',
      matchedCode.expireAtText || matchedCode.expireAt || '',
      matchedCode.distributedAtText || matchedCode.distributedAt || '',
      matchedCode.distributedTo || '',
      matchedCode.distributedChannel || '',
      matchedCode.usedAtText || matchedCode.usedAt || '',
      matchedCode.usedBy || '',
      matchedCode.isEnabled === false ? 'disabled' : 'enabled',
      matchedCode.note || ''
    ]
  })

  const csv = [
    header.join(','),
    ...rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
  ].join('\n')

  const blob = new Blob([`\ufeff${csv}`], {
    type: 'text/csv;charset=utf-8'
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `golden-egg-serial-redeem-logs-detail-${Date.now()}.csv`
  link.click()

  URL.revokeObjectURL(url)
  showSavedMessage('已匯出詳細兌換紀錄 CSV。')
}

const exportSerialCodes = () => {
  const blob = new Blob([JSON.stringify(serialCodes.value, null, 2)], {
    type: 'application/json;charset=utf-8'
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `golden-egg-serial-codes-${Date.now()}.json`
  link.click()

  URL.revokeObjectURL(url)
  showSavedMessage('已匯出序號 JSON。')
}


const exportSettings = () => {
  const blob = new Blob([JSON.stringify(payload.value, null, 2)], {
    type: 'application/json;charset=utf-8'
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `golden-egg-admin-settings-${Date.now()}.json`
  link.click()

  URL.revokeObjectURL(url)
  showOperationSuccess('已匯出砸金蛋設定 JSON。')
}

const goFront = () => {
  router.push('/games/golden-egg')
}

const goGames = () => {
  router.push('/games')
}

const normalizeAllPrizeProbabilities = () => {
  prizes.value.forEach((prize) => {
    prize.probability = normalizePrizeProbability(prize.probability)
  })
}

watch(
  () => campaign,
  () => {
    scheduleSaveState()
  },
  {
    deep: true
  }
)

watch(
  prizes,
  () => {
    normalizeAllPrizeProbabilities()
    scheduleSaveState()
  },
  {
    deep: true
  }
)


const normalizedDatabaseCampaignId = computed(() => {
  const id = Number(databaseCampaignId.value)

  return Number.isInteger(id) && id > 0 ? id : null
})

const databaseFrontUrl = computed(() => {
  if (!normalizedDatabaseCampaignId.value) return ''

  return `${window.location.origin}/games/golden-egg?campaignId=${normalizedDatabaseCampaignId.value}`
})

const databaseApiUrls = computed(() => {
  if (!normalizedDatabaseCampaignId.value) return []

  const id = normalizedDatabaseCampaignId.value

  return [
    {
      label: '活動 API',
      url: `http://localhost:3000/api/campaigns/${id}`
    },
    {
      label: '獎項 API',
      url: `http://localhost:3000/api/prizes/campaigns/${id}/prizes`
    },
    {
      label: '序號 API',
      url: `http://localhost:3000/api/serial-codes/campaigns/${id}`
    },
    {
      label: '遊玩紀錄 API',
      url: `http://localhost:3000/api/play-records/campaigns/${id}`
    },
    {
      label: '中獎紀錄 API',
      url: `http://localhost:3000/api/play-records/campaigns/${id}/rewards`
    },
    {
      label: '抽獎池 API',
      url: `http://localhost:3000/api/draw-engine/campaigns/${id}/pool`
    }
  ]
})

const databaseStats = computed(() => {
  return {
    prizeCount: databasePrizes.value.length,
    serialCount: databaseSerialCodes.value.length,
    unusedSerialCount: databaseSerialCodes.value.filter((item) => item.effectiveStatus === 'UNUSED' || item.status === 'UNUSED').length,
    usedSerialCount: databaseSerialCodes.value.filter((item) => item.effectiveStatus === 'USED' || item.status === 'USED').length,
    playCount: databasePlayRecords.value.length,
    rewardCount: databaseRewardRecords.value.length
  }
})


const normalizeDatabaseRecordText = (value) => String(value ?? '').trim().toUpperCase()

const getDatabaseRecordPrizeTitle = (item = {}) => {
  return item.prize?.title || item.prizeTitle || item.prizeName || item.rewardTitle || ''
}

const getDatabaseRecordCreatedAt = (item = {}) => {
  return item.playedAt || item.createdAt || item.updatedAt || item.claimedAt || null
}

const getDatabaseRewardStatus = (item = {}) => {
  return String(item.status || 'PENDING').toUpperCase()
}

const isDatabaseRewardIssuedStatus = (item = {}) => {
  const status = getDatabaseRewardStatus(item)
  return status === 'ISSUED' || status === 'CLAIMED'
}

const isDatabaseRecordWithinDateFilter = (item = {}, filter = 'all') => {
  if (filter === 'all') return true

  const sourceDate = new Date(getDatabaseRecordCreatedAt(item))
  if (Number.isNaN(sourceDate.getTime())) return false

  const now = new Date()
  const start = new Date(now)

  if (filter === 'today') {
    return sourceDate.toDateString() === now.toDateString()
  }

  if (filter === '7days') {
    start.setDate(now.getDate() - 7)
    return sourceDate >= start
  }

  if (filter === '30days') {
    start.setDate(now.getDate() - 30)
    return sourceDate >= start
  }

  return true
}

const matchDatabaseRecordKeyword = (item = {}, keyword = '') => {
  if (!keyword) return true

  const searchableText = [
    item.id,
    item.gameType,
    item.result,
    item.status,
    item.playerName,
    item.playerPhone,
    item.playerEmail,
    item.winnerName,
    item.winnerPhone,
    item.winnerEmail,
    item.claimCode,
    item.serialCode?.code,
    item.serialCodeCode,
    getDatabaseRecordPrizeTitle(item),
    item.prize?.shortName,
    item.prize?.description
  ]
    .map((value) => normalizeDatabaseRecordText(value))
    .join(' ')

  return searchableText.includes(keyword)
}

const databaseRecordPrizeOptions = computed(() => {
  const titleMap = new Map()

  databasePrizes.value.forEach((item) => {
    const title = String(item.title || item.name || '').trim()
    if (title) titleMap.set(title, title)
  })

  databasePlayRecords.value.forEach((item) => {
    const title = String(getDatabaseRecordPrizeTitle(item)).trim()
    if (title) titleMap.set(title, title)
  })

  databaseRewardRecords.value.forEach((item) => {
    const title = String(getDatabaseRecordPrizeTitle(item)).trim()
    if (title) titleMap.set(title, title)
  })

  return Array.from(titleMap.values()).sort((a, b) => a.localeCompare(b, 'zh-Hant'))
})

const filteredDatabasePlayRecords = computed(() => {
  const keyword = normalizeDatabaseRecordText(databaseRecordKeyword.value)
  const winFilter = databaseRecordWinFilter.value
  const prizeFilter = databaseRecordPrizeFilter.value
  const dateFilter = databaseRecordDateFilter.value

  return databasePlayRecords.value.filter((item) => {
    const isWin = item.isWin || item.result === 'WIN' || Boolean(item.prize)
    const prizeTitle = getDatabaseRecordPrizeTitle(item)

    if (winFilter === 'win' && !isWin) return false
    if (winFilter === 'lose' && isWin) return false
    if (prizeFilter !== 'all' && prizeTitle !== prizeFilter) return false
    if (!isDatabaseRecordWithinDateFilter(item, dateFilter)) return false

    return matchDatabaseRecordKeyword(item, keyword)
  })
})

const filteredDatabaseRewardRecords = computed(() => {
  const keyword = normalizeDatabaseRecordText(databaseRecordKeyword.value)
  const statusFilter = databaseRewardStatusFilter.value
  const prizeFilter = databaseRecordPrizeFilter.value
  const dateFilter = databaseRecordDateFilter.value

  return databaseRewardRecords.value.filter((item) => {
    const status = getDatabaseRewardStatus(item)
    const prizeTitle = getDatabaseRecordPrizeTitle(item)

    if (statusFilter === 'PENDING' && status !== 'PENDING') return false
    if (statusFilter === 'ISSUED' && !isDatabaseRewardIssuedStatus(item)) return false
    if (statusFilter === 'CANCELLED' && status !== 'CANCELLED') return false
    if (prizeFilter !== 'all' && prizeTitle !== prizeFilter) return false
    if (!isDatabaseRecordWithinDateFilter(item, dateFilter)) return false

    return matchDatabaseRecordKeyword(item, keyword)
  })
})

const databaseRecordHasActiveFilters = computed(() => {
  return Boolean(String(databaseRecordKeyword.value || '').trim())
    || databaseRecordWinFilter.value !== 'all'
    || databaseRewardStatusFilter.value !== 'all'
    || databaseRecordPrizeFilter.value !== 'all'
    || databaseRecordDateFilter.value !== 'all'
})

const databaseRecordFilterSummary = computed(() => {
  const chips = []

  if (String(databaseRecordKeyword.value || '').trim()) chips.push(`關鍵字：${databaseRecordKeyword.value}`)

  if (databaseRecordWinFilter.value === 'win') chips.push('遊玩：只看中獎')
  if (databaseRecordWinFilter.value === 'lose') chips.push('遊玩：只看未中獎')

  if (databaseRewardStatusFilter.value === 'PENDING') chips.push('發獎：待核銷')
  if (databaseRewardStatusFilter.value === 'ISSUED') chips.push('發獎：已發獎')
  if (databaseRewardStatusFilter.value === 'CANCELLED') chips.push('發獎：已取消')

  if (databaseRecordPrizeFilter.value !== 'all') chips.push(`獎項：${databaseRecordPrizeFilter.value}`)

  if (databaseRecordDateFilter.value === 'today') chips.push('時間：今天')
  if (databaseRecordDateFilter.value === '7days') chips.push('時間：近 7 天')
  if (databaseRecordDateFilter.value === '30days') chips.push('時間：近 30 天')

  return chips
})

const resetDatabaseRecordFilters = () => {
  databaseRecordKeyword.value = ''
  databaseRecordWinFilter.value = 'all'
  databaseRewardStatusFilter.value = 'all'
  databaseRecordPrizeFilter.value = 'all'
  databaseRecordDateFilter.value = 'all'
  showOperationSuccess('已清除紀錄搜尋與篩選條件。')
}

const setDatabasePreviewSyncMessage = (message = '資料庫已更新，請刷新前台正式頁查看最新結果。') => {
  databasePreviewSyncMessage.value = message
}

const reloadDatabaseAndOpenFrontPreview = async () => {
  await loadDatabaseGoldenEggCampaign()
  openDatabaseFrontPreview()
}

const copyDatabaseFrontPreviewUrl = async () => {
  if (!databaseFrontUrl.value) {
    showOperationError('請先輸入正式活動 campaignId。')
    return
  }

  await copyDatabaseText(databaseFrontUrl.value)
}

const openDatabaseFrontPreview = () => {
  if (!databaseFrontUrl.value) {
    showOperationError('請先輸入正式活動 campaignId。')
    return
  }

  window.open(databaseFrontUrl.value, '_blank')
}

const loadDatabaseGoldenEggCampaign = async () => {
  if (!normalizedDatabaseCampaignId.value) {
    databaseLoadMessage.value = '請先輸入正確的 campaignId。'
    return
  }

  isLoadingDatabaseCampaign.value = true
  databaseLoadMessage.value = '正在讀取正式資料庫活動...'

  try {
    const id = normalizedDatabaseCampaignId.value

    localStorage.setItem('golden_egg_admin_database_campaign_id', String(id))

    const [
      campaignResult,
      prizesResult,
      serialCodesResult,
      playRecordsResult,
      rewardRecordsResult,
      drawPoolResult
    ] = await Promise.all([
      getAdminGoldenEggCampaign(id),
      getAdminGoldenEggPrizes(id),
      getAdminGoldenEggSerialCodes(id),
      getAdminGoldenEggPlayRecords(id),
      getAdminGoldenEggRewardRecords(id),
      getAdminGoldenEggDrawPool(id)
    ])

    databaseCampaign.value = campaignResult
    databasePrizes.value = Array.isArray(prizesResult) ? prizesResult : []
    databaseSerialCodes.value = Array.isArray(serialCodesResult) ? serialCodesResult : []
    syncSelectedDatabaseSerialsAfterRefresh()
    databasePlayRecords.value = Array.isArray(playRecordsResult) ? playRecordsResult : []
    databaseRewardRecords.value = Array.isArray(rewardRecordsResult) ? rewardRecordsResult : []
    databaseDrawPool.value = drawPoolResult
    loadDatabaseCampaignFormFromCampaign(campaignResult)
    loadDatabaseGameConfigFormFromCampaign(campaignResult)

    databaseLoadMessage.value = `已載入正式資料庫活動：${campaignResult?.title || `ID ${id}`}`
  } catch (error) {
    console.error('讀取正式金蛋資料庫活動失敗：', error)
    databaseLoadMessage.value = error.message || '讀取正式資料庫活動失敗。'
  } finally {
    isLoadingDatabaseCampaign.value = false
  }
}

const resetDatabasePrizeForm = () => {
  databasePrizeForm.id = null
  databasePrizeForm.title = ''
  databasePrizeForm.shortName = ''
  databasePrizeForm.description = ''
  databasePrizeForm.icon = '🎁'
  databasePrizeForm.imageUrl = ''
  databasePrizeForm.type = 'WIN'
  databasePrizeForm.status = 'ACTIVE'
  databasePrizeForm.probability = 10
  databasePrizeForm.stockTotal = 100
  databasePrizeForm.remainStock = 100
  databasePrizeForm.stockUsed = 0
  databasePrizeForm.sortOrder = Math.max(1, databasePrizes.value.length + 1)
}

const editDatabasePrize = (item) => {
  databasePrizeForm.id = item.id
  databasePrizeForm.title = item.title || ''
  databasePrizeForm.shortName = item.shortName || ''
  databasePrizeForm.description = item.description || ''
  databasePrizeForm.icon = item.icon || '🎁'
  databasePrizeForm.imageUrl = item.imageUrl || ''
  databasePrizeForm.type = item.type || 'WIN'
  databasePrizeForm.status = item.status || 'ACTIVE'
  databasePrizeForm.probability = Number(item.probability || 0)
  databasePrizeForm.stockTotal = Number(item.stockTotal || 0)
  databasePrizeForm.remainStock = Number(item.remainStock || 0)
  databasePrizeForm.stockUsed = Number(item.stockUsed || 0)
  databasePrizeForm.sortOrder = Number(item.sortOrder || 0)

  showOperationSuccess('已載入資料庫獎項到編輯表單。')
}

const buildDatabasePrizePayload = () => {
  return {
    title: databasePrizeForm.title,
    shortName: databasePrizeForm.shortName,
    description: databasePrizeForm.description,
    icon: databasePrizeForm.icon,
    imageUrl: databasePrizeForm.imageUrl,
    type: databasePrizeForm.type,
    status: databasePrizeForm.status,
    probability: Number(databasePrizeForm.probability || 0),
    stockTotal: Number(databasePrizeForm.stockTotal || 0),
    remainStock: Number(databasePrizeForm.remainStock || 0),
    stockUsed: Number(databasePrizeForm.stockUsed || 0),
    sortOrder: Number(databasePrizeForm.sortOrder || 0)
  }
}

const saveDatabasePrize = async () => {
  if (!normalizedDatabaseCampaignId.value) {
    showOperationError('請先輸入並讀取正式活動 campaignId。')
    return
  }

  if (!String(databasePrizeForm.title || '').trim()) {
    showOperationError('獎項名稱不能空白。')
    return
  }

  isSavingDatabasePrize.value = true
  showOperationInfo(databasePrizeForm.id ? '正在更新資料庫獎項，請稍候...' : '正在新增資料庫獎項，請稍候...', false)

  try {
    const payload = buildDatabasePrizePayload()

    if (databasePrizeForm.id) {
      await updateAdminGoldenEggPrize(databasePrizeForm.id, payload)
      showOperationSuccess('已更新資料庫獎項。')
      setDatabasePreviewSyncMessage()
    } else {
      await createAdminGoldenEggPrize(normalizedDatabaseCampaignId.value, payload)
      showOperationSuccess('已新增資料庫獎項。')
      setDatabasePreviewSyncMessage()
    }

    resetDatabasePrizeForm()
    await loadDatabaseGoldenEggCampaign()
  } catch (error) {
    console.error('儲存資料庫獎項失敗：', error)
    showOperationError(error.message || '儲存資料庫獎項失敗。')
  } finally {
    isSavingDatabasePrize.value = false
  }
}

const removeDatabasePrize = async (item) => {
  if (!item?.id) return

  const confirmed = window.confirm(`確定要刪除資料庫獎項「${item.title}」嗎？`)

  if (!confirmed) return

  showOperationInfo('正在刪除資料庫獎項，請稍候...', false)

  try {
    await deleteAdminGoldenEggPrize(item.id)
    showOperationSuccess('已刪除資料庫獎項。')
    setDatabasePreviewSyncMessage()
    await loadDatabaseGoldenEggCampaign()
  } catch (error) {
    console.error('刪除資料庫獎項失敗：', error)
    showOperationError(error.message || '刪除資料庫獎項失敗。')
  }
}

const resetDatabaseSerialForm = () => {
  databaseSerialForm.code = ''
  databaseSerialForm.codesText = ''
  databaseSerialForm.prefix = 'EGG'
  databaseSerialForm.batchCode = 'DEMO'
  databaseSerialForm.count = 10
  databaseSerialForm.rewardChance = 1
  databaseSerialForm.length = 18
  databaseSerialForm.expireAt = ''
  databaseSerialForm.note = '後台資料庫模式建立'
  databaseSerialForm.distributedTo = ''
  databaseSerialForm.distributedChannel = 'LINE'
}



const databaseSerialBatchOptions = computed(() => {
  const batchSet = new Set()

  databaseSerialCodes.value.forEach((item) => {
    if (item?.batchCode) {
      batchSet.add(String(item.batchCode))
    }
  })

  return ['ALL', ...Array.from(batchSet).sort()]
})

const filteredDatabaseSerialCodes = computed(() => {
  const keyword = databaseSerialSearchKeyword.value.trim().toLowerCase()
  const batchFilter = databaseSerialBatchFilter.value
  const statusFilter = databaseSerialStatusFilter.value
  const issueFilter = databaseSerialIssueFilter.value

  return databaseSerialCodes.value.filter((item) => {
    const code = String(item?.code || '').toLowerCase()
    const batchCode = String(item?.batchCode || '')
    const statusInfo = getDatabaseSerialStatusInfo(item)
    const isIssued = Boolean(item?.isIssued)

    const keywordMatched = !keyword
      || code.includes(keyword)
      || batchCode.toLowerCase().includes(keyword)

    const batchMatched = batchFilter === 'ALL'
      || batchCode === batchFilter

    const statusMatched = statusFilter === 'ALL'
      || statusInfo.key === statusFilter

    const issueMatched = issueFilter === 'ALL'
      || (issueFilter === 'ISSUED' && isIssued)
      || (issueFilter === 'UNISSUED' && !isIssued)

    return keywordMatched && batchMatched && statusMatched && issueMatched
  })
})

const databaseSerialFilterSummary = computed(() => {
  const total = databaseSerialCodes.value.length
  const filtered = filteredDatabaseSerialCodes.value.length
  const used = filteredDatabaseSerialCodes.value.filter((item) => getDatabaseSerialStatusInfo(item).key === 'USED').length
  const unused = filteredDatabaseSerialCodes.value.filter((item) => getDatabaseSerialStatusInfo(item).key === 'UNUSED').length
  const disabled = filteredDatabaseSerialCodes.value.filter((item) => getDatabaseSerialStatusInfo(item).key === 'DISABLED').length

  return {
    total,
    filtered,
    used,
    unused,
    disabled
  }
})

const setDatabaseSerialQuickFilter = (type) => {
  if (type === 'LIVE01') {
    databaseSerialBatchFilter.value = 'LIVE01'
    databaseSerialStatusFilter.value = 'ALL'
    databaseSerialIssueFilter.value = 'ALL'
    return
  }

  if (type === 'USED') {
    databaseSerialStatusFilter.value = 'USED'
    return
  }

  if (type === 'UNUSED') {
    databaseSerialStatusFilter.value = 'UNUSED'
    return
  }

  if (type === 'TEST') {
    databaseSerialSearchKeyword.value = ''
    databaseSerialBatchFilter.value = 'ALL'
    databaseSerialStatusFilter.value = 'ALL'
    databaseSerialIssueFilter.value = 'ALL'
    databaseSerialSearchKeyword.value = 'TEST'
    return
  }

  databaseSerialSearchKeyword.value = ''
  databaseSerialBatchFilter.value = 'ALL'
  databaseSerialStatusFilter.value = 'ALL'
  databaseSerialIssueFilter.value = 'ALL'
}

const visibleDatabaseSerialCodes = computed(() => {
  return filteredDatabaseSerialCodes.value.slice(0, 60)
})

const selectedDatabaseSerialIdSet = computed(() => {
  return new Set(selectedDatabaseSerialIds.value.map((id) => Number(id)))
})

const selectedDatabaseSerialCount = computed(() => selectedDatabaseSerialIds.value.length)

const isAllVisibleDatabaseSerialSelected = computed(() => {
  return visibleDatabaseSerialCodes.value.length > 0
    && selectedDatabaseSerialIds.value.length === visibleDatabaseSerialCodes.value.length
})

const toggleDatabaseSerialSelection = (item) => {
  const id = Number(item?.id)

  if (!Number.isFinite(id)) return

  if (selectedDatabaseSerialIdSet.value.has(id)) {
    selectedDatabaseSerialIds.value = selectedDatabaseSerialIds.value.filter((serialId) => serialId !== id)
    return
  }

  selectedDatabaseSerialIds.value = [...selectedDatabaseSerialIds.value, id]
}

const selectAllVisibleDatabaseSerials = () => {
  selectedDatabaseSerialIds.value = visibleDatabaseSerialCodes.value
    .map((item) => Number(item.id))
    .filter((id) => Number.isFinite(id))
}

const clearSelectedDatabaseSerials = () => {
  selectedDatabaseSerialIds.value = []
}

const syncSelectedDatabaseSerialsAfterRefresh = () => {
  const aliveIds = new Set(
    databaseSerialCodes.value
      .map((item) => Number(item.id))
      .filter((id) => Number.isFinite(id))
  )

  selectedDatabaseSerialIds.value = selectedDatabaseSerialIds.value.filter((id) => aliveIds.has(id))
}


const refreshDatabaseSerialCodesWithFeedback = async () => {
  if (!normalizedDatabaseCampaignId.value) {
    setDatabasePreviewSyncMessage('請先輸入 campaignId 並讀取資料庫活動，再重新讀取序號。')
    return
  }

  setDatabasePreviewSyncMessage('正在重新讀取資料庫序號...')
  await refreshDatabaseSerialCodes()
  clearSelectedDatabaseSerials()
  setDatabasePreviewSyncMessage(`資料庫序號已重新讀取，目前顯示 ${visibleDatabaseSerialCodes.value.length} 筆。`)
}


const batchDeleteSelectedDatabaseSerials = async () => {
  if (!selectedDatabaseSerialIds.value.length) {
    showOperationError('請先勾選要刪除的序號。')
    return
  }

  const selectedItems = databaseSerialCodes.value.filter((item) => {
    return selectedDatabaseSerialIdSet.value.has(Number(item.id))
  })

  const previewCodes = selectedItems
    .slice(0, 5)
    .map((item) => item.code)
    .join('\n')

  const confirmed = window.confirm(
    `確定要批次刪除 ${selectedDatabaseSerialIds.value.length} 組序號嗎？\n\n` +
    `前幾筆：\n${previewCodes || '未取得序號'}\n\n` +
    '此動作會直接刪除 PostgreSQL 裡的 SerialCode，建議只用於刪除 TEST01 / DEMO 測試序號。'
  )

  if (!confirmed) return

  isBatchDeletingDatabaseSerials.value = true
  showOperationInfo(`正在批次刪除 ${selectedDatabaseSerialIds.value.length} 組序號，請稍候...`, false)

  try {
    const ids = [...selectedDatabaseSerialIds.value]

    await Promise.all(
      ids.map((id) => deleteAdminGoldenEggSerialCode(id))
    )

    selectedDatabaseSerialIds.value = []
    showOperationSuccess(`已批次刪除 ${ids.length} 組資料庫序號。`)
    setDatabasePreviewSyncMessage(`已批次刪除 ${ids.length} 組資料庫序號，序號列表已重新讀取。`)
    await refreshDatabaseSerialCodes()
  } catch (error) {
    console.error('批次刪除資料庫序號失敗：', error)
    showOperationError(error.message || '批次刪除資料庫序號失敗。')
  } finally {
    isBatchDeletingDatabaseSerials.value = false
  }
}


const refreshDatabaseSerialCodes = async () => {
  if (!normalizedDatabaseCampaignId.value) return

  databaseSerialCodes.value = await getAdminGoldenEggSerialCodes(normalizedDatabaseCampaignId.value)
}

const generateDatabaseSerialCodes = async () => {
  if (!normalizedDatabaseCampaignId.value) {
    showOperationError('請先輸入並讀取正式活動 campaignId。')
    return
  }

  isSavingDatabaseSerial.value = true
  databaseSerialAction.value = 'generate'
  showOperationInfo('正在自動產生資料庫序號，請稍候...', false)

  try {
    await waitOperationFeedbackFrame()
    await generateAdminGoldenEggSerialCodes(normalizedDatabaseCampaignId.value, {
      prefix: databaseSerialForm.prefix,
      batchCode: databaseSerialForm.batchCode,
      count: databaseSerialForm.count,
      rewardChance: databaseSerialForm.rewardChance,
      length: databaseSerialForm.length,
      expireAt: databaseSerialForm.expireAt || null,
      note: databaseSerialForm.note
    })

    showOperationSuccess('已自動產生資料庫序號。')
    setDatabasePreviewSyncMessage('已更新序號資料，前台輸入序號時會使用最新資料庫狀態。')
    await loadDatabaseGoldenEggCampaign()
  } catch (error) {
    console.error('自動產生資料庫序號失敗：', error)
    showOperationError(error.message || '自動產生資料庫序號失敗。')
  } finally {
    isSavingDatabaseSerial.value = false
    databaseSerialAction.value = ''
  }
}

const createDatabaseSerialCode = async () => {
  if (!normalizedDatabaseCampaignId.value) {
    showOperationError('請先輸入並讀取正式活動 campaignId。')
    return
  }

  if (!String(databaseSerialForm.code || '').trim()) {
    showOperationError('請先輸入單組序號。')
    return
  }

  isSavingDatabaseSerial.value = true
  databaseSerialAction.value = 'create'
  showOperationInfo('正在新增單組資料庫序號，請稍候...', false)

  try {
    await waitOperationFeedbackFrame()
    await createAdminGoldenEggSerialCode(normalizedDatabaseCampaignId.value, {
      code: databaseSerialForm.code,
      rewardChance: databaseSerialForm.rewardChance,
      batchCode: databaseSerialForm.batchCode,
      expireAt: databaseSerialForm.expireAt || null,
      note: databaseSerialForm.note
    })

    databaseSerialForm.code = ''
    showOperationSuccess('已新增單組資料庫序號。')
    setDatabasePreviewSyncMessage('已更新序號資料，前台輸入序號時會使用最新資料庫狀態。')
    await loadDatabaseGoldenEggCampaign()
  } catch (error) {
    console.error('新增單組資料庫序號失敗：', error)
    showOperationError(error.message || '新增單組資料庫序號失敗。')
  } finally {
    isSavingDatabaseSerial.value = false
    databaseSerialAction.value = ''
  }
}

const bulkCreateDatabaseSerialCodes = async () => {
  if (!normalizedDatabaseCampaignId.value) {
    showOperationError('請先輸入並讀取正式活動 campaignId。')
    return
  }

  if (!String(databaseSerialForm.codesText || '').trim()) {
    showOperationError('請先貼上多組序號。')
    return
  }

  isSavingDatabaseSerial.value = true
  databaseSerialAction.value = 'bulk'
  showOperationInfo('正在批次新增資料庫序號，請稍候...', false)

  try {
    await waitOperationFeedbackFrame()
    await bulkCreateAdminGoldenEggSerialCodes(normalizedDatabaseCampaignId.value, {
      codesText: databaseSerialForm.codesText,
      rewardChance: databaseSerialForm.rewardChance,
      batchCode: databaseSerialForm.batchCode,
      expireAt: databaseSerialForm.expireAt || null,
      note: databaseSerialForm.note
    })

    databaseSerialForm.codesText = ''
    showOperationSuccess('已批次新增資料庫序號。')
    setDatabasePreviewSyncMessage('已更新序號資料，前台輸入序號時會使用最新資料庫狀態。')
    await loadDatabaseGoldenEggCampaign()
  } catch (error) {
    console.error('批次新增資料庫序號失敗：', error)
    showOperationError(error.message || '批次新增資料庫序號失敗。')
  } finally {
    isSavingDatabaseSerial.value = false
    databaseSerialAction.value = ''
  }
}

const toggleDatabaseSerialStatus = async (item) => {
  if (!item?.id) return

  const nextStatus = item.status === 'DISABLED' ? 'UNUSED' : 'DISABLED'

  showOperationInfo(nextStatus === 'DISABLED' ? '正在停用資料庫序號，請稍候...' : '正在啟用資料庫序號，請稍候...', false)

  try {
    await updateAdminGoldenEggSerialCode(item.id, {
      status: nextStatus
    })

    showOperationSuccess(nextStatus === 'DISABLED' ? '已停用資料庫序號。' : '已啟用資料庫序號。')
    setDatabasePreviewSyncMessage('已更新序號狀態，前台會依最新資料庫狀態判斷是否可抽。')
    await refreshDatabaseSerialCodes()
  } catch (error) {
    console.error('更新資料庫序號狀態失敗：', error)
    showOperationError(error.message || '更新資料庫序號狀態失敗。')
  }
}

const distributeDatabaseSerialCode = async (item) => {
  if (!item?.id) return

  showOperationInfo('正在標記資料庫序號發放狀態，請稍候...', false)

  try {
    await markAdminGoldenEggSerialDistributed(item.id, {
      distributedTo: databaseSerialForm.distributedTo || '後台標記發放',
      distributedChannel: databaseSerialForm.distributedChannel || 'LINE',
      note: item.note || databaseSerialForm.note
    })

    showOperationSuccess('已標記資料庫序號為已發放。')
    setDatabasePreviewSyncMessage('已更新序號發放資料。')
    await refreshDatabaseSerialCodes()
  } catch (error) {
    console.error('標記資料庫序號發放失敗：', error)
    showOperationError(error.message || '標記資料庫序號發放失敗。')
  }
}

const removeDatabaseSerialCode = async (item) => {
  if (!item?.id) return

  const confirmed = window.confirm(`確定要刪除資料庫序號「${item.code}」嗎？`)

  if (!confirmed) return

  showOperationInfo('正在刪除資料庫序號，請稍候...', false)

  try {
    await deleteAdminGoldenEggSerialCode(item.id)
    showOperationSuccess('已刪除資料庫序號。')
    await refreshDatabaseSerialCodes()
  } catch (error) {
    console.error('刪除資料庫序號失敗：', error)
    showOperationError(error.message || '刪除資料庫序號失敗。')
  }
}

const openDatabaseSerialExport = () => {
  const records = getRecordSourceArray(filteredDatabaseSerialCodes)

  if (!records.length) {
    showOperationError('目前沒有資料庫序號可以匯出。')
    return
  }

  const rows = records.map((item) => {
    const statusInfo = getDatabaseSerialStatusInfo(item)

    return [
      item.id || '',
      item.code || '',
      statusInfo.label || item.status || '',
      item.batchCode || '',
      item.rewardChance ?? item.maxUseCount ?? item.totalCount ?? '',
      getDatabaseSerialUsedCount(item),
      getDatabaseSerialRemainingCount(item),
      item.isIssued ? '已發放' : '未發放',
      item.distributedTo || '',
      item.distributedChannel || '',
      formatDatabaseDateTime(item.expireAt),
      formatDatabaseDateTime(item.usedAt || item.redeemedAt),
      formatDatabaseDateTime(item.createdAt),
      item.note || ''
    ]
  })

  downloadCsvFile(
    `golden-egg-database-serial-codes-${getExportDateStamp()}.csv`,
    ['序號ID', '序號', '狀態', '批次代碼', '可用次數', '已用次數', '剩餘次數', '發放狀態', '發放對象', '發放管道', '有效期限', '使用時間', '建立時間', '備註'],
    rows
  )

  showOperationSuccess(`已匯出 ${records.length} 組資料庫序號 CSV。`)
}


const copyTextToClipboardWithFallback = async (text, fallbackTitle = '請手動複製內容：') => {
  const content = String(text || '')

  if (!content.trim()) {
    showOperationError('目前沒有可複製的內容。')
    return false
  }

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(content)
      return true
    }
  } catch (error) {
    console.warn('剪貼簿複製失敗，改用手動複製：', error)
  }

  window.prompt(fallbackTitle, content)
  return true
}

const getDatabaseSerialCodeText = (items = []) => {
  return items
    .map((item) => String(item?.code || '').trim())
    .filter(Boolean)
    .join('\n')
}

const availableDatabaseSerialCodesForCopy = computed(() => {
  return databaseSerialCodes.value.filter((item) => {
    const statusInfo = getDatabaseSerialStatusInfo(item)
    return statusInfo.key === 'UNUSED'
  })
})

const filteredDatabaseSerialCodesForCopy = computed(() => {
  return filteredDatabaseSerialCodes.value.filter((item) => String(item?.code || '').trim())
})

const selectedDatabaseSerialCodesForCopy = computed(() => {
  const selectedIds = selectedDatabaseSerialIdSet.value
  return databaseSerialCodes.value.filter((item) => selectedIds.has(Number(item?.id)) && String(item?.code || '').trim())
})

const copyDatabaseSerialItems = async (items = [], successPrefix = '已複製') => {
  const codeText = getDatabaseSerialCodeText(items)
  const count = codeText ? codeText.split('\n').filter(Boolean).length : 0

  if (!count) {
    showOperationError('目前沒有可複製序號。')
    return
  }

  const copied = await copyTextToClipboardWithFallback(codeText, '請手動複製資料庫序號：')

  if (copied) {
    showOperationSuccess(`${successPrefix} ${count} 組序號。`)
  }
}

const copyDatabaseSerialCode = async (item) => {
  await copyDatabaseSerialItems([item], '已複製')
}

const copyAllAvailableDatabaseSerialCodes = async () => {
  await copyDatabaseSerialItems(availableDatabaseSerialCodesForCopy.value, '已複製全部可用')
}

const copyFilteredDatabaseSerialCodes = async () => {
  await copyDatabaseSerialItems(filteredDatabaseSerialCodesForCopy.value, '已複製目前篩選結果')
}

const copySelectedDatabaseSerialCodes = async () => {
  await copyDatabaseSerialItems(selectedDatabaseSerialCodesForCopy.value, '已複製已選取')
}

const toDatetimeLocalValue = (value) => {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)

  return offsetDate.toISOString().slice(0, 16)
}

const fromDatetimeLocalValue = (value) => {
  if (!value) return null

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return null

  return date.toISOString()
}

const databaseQuickSections = [
  {
    key: 'links',
    label: '正式網址',
    icon: '連'
  },
  {
    key: 'summary',
    label: '資料總覽',
    icon: '覽'
  },
  {
    key: 'campaign',
    label: '活動資料',
    icon: '活'
  },
  {
    key: 'gameConfig',
    label: '前台設定',
    icon: '設'
  },
  {
    key: 'prizes',
    label: '獎項管理',
    icon: '獎'
  },
  {
    key: 'serials',
    label: '序號管理',
    icon: '序'
  },
  {
    key: 'records',
    label: '紀錄管理',
    icon: '錄'
  }
]

const toggleDatabaseSection = (key) => {
  if (databaseSectionOpen[key] === undefined) return

  databaseSectionOpen[key] = !databaseSectionOpen[key]
}

const openAllDatabaseSections = () => {
  Object.keys(databaseSectionOpen).forEach((key) => {
    databaseSectionOpen[key] = true
  })
}

const closeAllDatabaseSections = () => {
  Object.keys(databaseSectionOpen).forEach((key) => {
    databaseSectionOpen[key] = false
  })

  databaseSectionOpen.links = true
}


const applySystemShareButtonSettingsToForm = (settings = {}) => {
  databaseGameConfigForm.systemShareButtonText = settings.systemShareButtonText || databaseGameConfigForm.systemShareButtonText || '系統分享'
  databaseGameConfigForm.systemShareButtonTextSize = Number(settings.systemShareButtonTextSize ?? databaseGameConfigForm.systemShareButtonTextSize ?? 14)
  databaseGameConfigForm.systemShareButtonBgColor = settings.systemShareButtonBgColor || databaseGameConfigForm.systemShareButtonBgColor || '#7f1d1d'
  databaseGameConfigForm.systemShareButtonTextColor = settings.systemShareButtonTextColor || databaseGameConfigForm.systemShareButtonTextColor || '#ffffff'
  databaseGameConfigForm.systemShareButtonRadius = Number(settings.systemShareButtonRadius ?? databaseGameConfigForm.systemShareButtonRadius ?? 16)
  databaseGameConfigForm.systemShareButtonPaddingY = Number(settings.systemShareButtonPaddingY ?? databaseGameConfigForm.systemShareButtonPaddingY ?? 12)
}

const getSystemShareButtonSettingsPayload = () => {
  return {
    systemShareButtonText: databaseGameConfigForm.systemShareButtonText || '系統分享',
    systemShareButtonTextSize: Number(databaseGameConfigForm.systemShareButtonTextSize || 14),
    systemShareButtonBgColor: databaseGameConfigForm.systemShareButtonBgColor || '#7f1d1d',
    systemShareButtonTextColor: databaseGameConfigForm.systemShareButtonTextColor || '#ffffff',
    systemShareButtonRadius: Number(databaseGameConfigForm.systemShareButtonRadius || 16),
    systemShareButtonPaddingY: Number(databaseGameConfigForm.systemShareButtonPaddingY || 12)
  }
}


const loadDatabaseCampaignFormFromCampaign = (campaignData = null) => {
  databaseCampaignForm.title = campaignData?.title || ''
  databaseCampaignForm.slug = campaignData?.slug || ''
  databaseCampaignForm.description = campaignData?.description || ''
  databaseCampaignForm.gameType = campaignData?.gameType || 'GOLDEN_EGG'
  databaseCampaignForm.status = campaignData?.status || 'ACTIVE'
  databaseCampaignForm.startAt = toDatetimeLocalValue(campaignData?.startAt)
  databaseCampaignForm.endAt = toDatetimeLocalValue(campaignData?.endAt)
  databaseCampaignForm.dailyLimit = Number(campaignData?.dailyLimit ?? 99)
  databaseCampaignForm.totalLimit = Number(campaignData?.totalLimit ?? 999)
  databaseCampaignForm.requireLogin = campaignData?.requireLogin === true
}

const buildDatabaseCampaignPayload = () => {
  return {
    title: databaseCampaignForm.title,
    slug: databaseCampaignForm.slug || null,
    description: databaseCampaignForm.description || null,
    gameType: databaseCampaignForm.gameType,
    status: databaseCampaignForm.status,
    startAt: fromDatetimeLocalValue(databaseCampaignForm.startAt),
    endAt: fromDatetimeLocalValue(databaseCampaignForm.endAt),
    dailyLimit: Number(databaseCampaignForm.dailyLimit || 0),
    totalLimit: Number(databaseCampaignForm.totalLimit || 0),
    requireLogin: databaseCampaignForm.requireLogin
  }
}

const saveDatabaseCampaign = async () => {
  if (!normalizedDatabaseCampaignId.value) {
    showOperationError('請先輸入並讀取正式活動 campaignId。')
    return
  }

  if (!String(databaseCampaignForm.title || '').trim()) {
    showOperationError('活動名稱不能空白。')
    return
  }

  isSavingDatabaseCampaign.value = true
  showOperationInfo('正在儲存資料庫活動基本資料，請稍候...', false)

  try {
    await updateAdminGoldenEggCampaign(
      normalizedDatabaseCampaignId.value,
      buildDatabaseCampaignPayload()
    )

    showOperationSuccess('已儲存資料庫活動基本資料。')
    setDatabasePreviewSyncMessage('活動基本資料已更新，請刷新前台正式頁查看最新活動狀態與時間。')
    await loadDatabaseGoldenEggCampaign()
  } catch (error) {
    console.error('儲存資料庫 Campaign 失敗：', error)
    showOperationError(error.message || '儲存資料庫活動基本資料失敗。')
  } finally {
    isSavingDatabaseCampaign.value = false
  }
}

const resetDatabaseCampaignForm = () => {
  loadDatabaseCampaignFormFromCampaign(databaseCampaign.value)
  showSavedMessage('已還原目前資料庫活動資料到表單。')
}

const loadDatabaseGameConfigFormFromCampaign = (campaignData = null) => {
  const settings = campaignData?.gameConfig?.settings || {}
  applySystemShareButtonSettingsToForm(settings)

  databaseGameConfigForm.pageTitle = settings.pageTitle || campaignData?.title || ''
  databaseGameConfigForm.mainTitle = settings.mainTitle || campaignData?.title || ''
  databaseGameConfigForm.subTitle = settings.subTitle || ''
  databaseGameConfigForm.heroTagline = settings.heroTagline || campaignData?.description || ''
  databaseGameConfigForm.noticeText = settings.noticeText || campaignData?.description || ''
  databaseGameConfigForm.serialRedeemTitle = settings.serialRedeemTitle || '輸入抽獎序號'
  databaseGameConfigForm.serialRedeemDescription = settings.serialRedeemDescription || '請輸入主辦單位提供的序號，驗證成功後即可砸蛋。'
  databaseGameConfigForm.serialRedeemButtonText = settings.serialRedeemButtonText || '驗證序號'
  databaseGameConfigForm.serialRedeemSuccessText = settings.serialRedeemSuccessText || '序號驗證成功，請選擇一顆金蛋。'
  databaseGameConfigForm.serialRedeemErrorText = settings.serialRedeemErrorText || '序號無效、已使用或不存在。'
  databaseGameConfigForm.activityRunningText = settings.activityRunningText || '正式資料庫活動進行中，請輸入序號參加。'
  databaseGameConfigForm.activityNotStartedText = settings.activityNotStartedText || '活動尚未開始。'
  databaseGameConfigForm.activityEndedText = settings.activityEndedText || '活動已結束。'
  databaseGameConfigForm.showActivityTimeSection = settings.showActivityTimeSection !== false
  databaseGameConfigForm.showActivityCountdown = settings.showActivityCountdown !== false
  databaseGameConfigForm.activityCountdownAlwaysShowSeconds = settings.activityCountdownAlwaysShowSeconds !== false
  databaseGameConfigForm.showBottomNav = settings.showBottomNav !== false
  databaseGameConfigForm.shareTitle = settings.shareTitle || campaign.shareTitle || '九宮格砸金蛋抽獎活動'
  databaseGameConfigForm.shareDescription = settings.shareDescription || campaign.shareDescription || '輸入活動序號，立即砸金蛋抽好禮！'
  databaseGameConfigForm.shareUrl = settings.shareUrl || campaign.shareUrl || `https://marketing-game-v1-em29.vercel.app/games/golden-egg?campaignId=${normalizedDatabaseCampaignId.value || 1}`
  databaseGameConfigForm.shareImageUrl = settings.shareImageUrl || campaign.shareImageUrl || ''
    databaseGameConfigForm.systemShareButtonText = settings.systemShareButtonText || campaign.systemShareButtonText || '系統分享'
  databaseGameConfigForm.systemShareButtonTextSize = Number(settings.systemShareButtonTextSize || campaign.systemShareButtonTextSize || 14)
  databaseGameConfigForm.systemShareButtonBgColor = settings.systemShareButtonBgColor || campaign.systemShareButtonBgColor || '#7f1d1d'
  databaseGameConfigForm.systemShareButtonTextColor = settings.systemShareButtonTextColor || campaign.systemShareButtonTextColor || '#ffffff'
  databaseGameConfigForm.systemShareButtonRadius = Number(settings.systemShareButtonRadius || campaign.systemShareButtonRadius || 16)
  databaseGameConfigForm.systemShareButtonPaddingY = Number(settings.systemShareButtonPaddingY || campaign.systemShareButtonPaddingY || 12)
  databaseGameConfigForm.systemShareText = settings.systemShareText || campaign.systemShareText || '🎉 九宮格砸金蛋抽獎活動\n輸入活動序號，立即砸金蛋抽好禮！'
  databaseGameConfigForm.lineShareText = settings.lineShareText || campaign.lineShareText || '🎉 九宮格砸金蛋抽獎活動｜輸入序號就有機會中大獎！'
  databaseGameConfigForm.telegramShareText = settings.telegramShareText || campaign.telegramShareText || '🎉 九宮格砸金蛋抽獎活動｜輸入序號就有機會中大獎！'

  // 第 353 批：資料庫視覺設定只能從 PostgreSQL gameConfig.settings 載入。
  databaseGameConfigForm.eggSize = Number(settings.eggSize ?? 74)
  databaseGameConfigForm.eggCardSize = Number(settings.eggCardSize ?? 128)
  databaseGameConfigForm.eggGridGap = Number(settings.eggGridGap ?? settings.eggGap ?? 12)
  databaseGameConfigForm.eggColorTop = settings.eggColorTop || '#fff7ad'
  databaseGameConfigForm.eggColorMiddle = settings.eggColorMiddle || '#fde047'
  databaseGameConfigForm.eggColorBottom = settings.eggColorBottom || '#b45309'
}

const buildDatabaseGameConfigPayload = () => {
  const originalSettings = databaseCampaign.value?.gameConfig?.settings || {}

  return {
    ...originalSettings,
    pageTitle: databaseGameConfigForm.pageTitle,
    mainTitle: databaseGameConfigForm.mainTitle,
    subTitle: databaseGameConfigForm.subTitle,
    heroTagline: databaseGameConfigForm.heroTagline,
    noticeText: databaseGameConfigForm.noticeText,
    serialRedeemTitle: databaseGameConfigForm.serialRedeemTitle,
    serialRedeemDescription: databaseGameConfigForm.serialRedeemDescription,
    serialRedeemButtonText: databaseGameConfigForm.serialRedeemButtonText,
    serialRedeemSuccessText: databaseGameConfigForm.serialRedeemSuccessText,
    serialRedeemErrorText: databaseGameConfigForm.serialRedeemErrorText,
    activityRunningText: databaseGameConfigForm.activityRunningText,
    activityNotStartedText: databaseGameConfigForm.activityNotStartedText,
    activityEndedText: databaseGameConfigForm.activityEndedText,
    showActivityTimeSection: databaseGameConfigForm.showActivityTimeSection,
    showActivityCountdown: databaseGameConfigForm.showActivityCountdown,
    activityCountdownAlwaysShowSeconds: databaseGameConfigForm.activityCountdownAlwaysShowSeconds,
    showBottomNav: databaseGameConfigForm.showBottomNav,
    eggSize: Number(databaseGameConfigForm.eggSize || 74),
    eggCardSize: Number(databaseGameConfigForm.eggCardSize || 128),
    eggGridGap: Number(databaseGameConfigForm.eggGridGap || 12),
    // 第 353 批：三個金蛋顏色欄位必須明確寫進 PostgreSQL。
    eggColorTop: databaseGameConfigForm.eggColorTop || '#fff7ad',
    eggColorMiddle: databaseGameConfigForm.eggColorMiddle || '#fde047',
    eggColorBottom: databaseGameConfigForm.eggColorBottom || '#b45309',
    shareTitle: databaseGameConfigForm.shareTitle || '九宮格砸金蛋抽獎活動',
    shareDescription: databaseGameConfigForm.shareDescription || '輸入活動序號，立即砸金蛋抽好禮！',
    shareUrl: databaseGameConfigForm.shareUrl || `https://marketing-game-v1-em29.vercel.app/games/golden-egg?campaignId=${normalizedDatabaseCampaignId.value || 1}`,
    shareImageUrl: databaseGameConfigForm.shareImageUrl || '',
    systemShareButtonText: '系統分享',
  systemShareButtonTextSize: 14,
  systemShareButtonBgColor: '#7f1d1d',
  systemShareButtonTextColor: '#ffffff',
  systemShareButtonRadius: 16,
  systemShareButtonPaddingY: 12,
  systemShareButtonText: databaseGameConfigForm.systemShareButtonText || '系統分享',
    systemShareButtonTextSize: Number(databaseGameConfigForm.systemShareButtonTextSize || 14),
    systemShareButtonBgColor: databaseGameConfigForm.systemShareButtonBgColor || '#7f1d1d',
    systemShareButtonTextColor: databaseGameConfigForm.systemShareButtonTextColor || '#ffffff',
    systemShareButtonRadius: Number(databaseGameConfigForm.systemShareButtonRadius || 16),
    systemShareButtonPaddingY: Number(databaseGameConfigForm.systemShareButtonPaddingY || 12),
    systemShareText: databaseGameConfigForm.systemShareText || '🎉 九宮格砸金蛋抽獎活動\n輸入活動序號，立即砸金蛋抽好禮！',
    lineShareText: databaseGameConfigForm.lineShareText || '🎉 九宮格砸金蛋抽獎活動｜輸入序號就有機會中大獎！',
    telegramShareText: databaseGameConfigForm.telegramShareText || '🎉 九宮格砸金蛋抽獎活動｜輸入序號就有機會中大獎！'
  }
}

const saveDatabaseGameConfig = async () => {
  if (!normalizedDatabaseCampaignId.value) {
    showOperationError('請先輸入並讀取正式活動 campaignId。')
    return
  }

  isSavingDatabaseGameConfig.value = true
  showOperationInfo('正在儲存資料庫前台設定，請稍候...', false)

  try {
    await updateAdminGoldenEggGameConfig(
      normalizedDatabaseCampaignId.value,
      buildDatabaseGameConfigPayload()
    )

    showOperationSuccess('已儲存資料庫前台設定，並寫入 PostgreSQL gameConfig.settings。')
    setDatabasePreviewSyncMessage(`資料庫前台設定已更新：金蛋顏色 ${databaseGameConfigForm.eggColorTop} / ${databaseGameConfigForm.eggColorMiddle} / ${databaseGameConfigForm.eggColorBottom}`)
    await loadDatabaseGoldenEggCampaign()
  } catch (error) {
    console.error('儲存資料庫 GameConfig 失敗：', error)
    showOperationError(error.message || '儲存資料庫前台設定失敗。')
  } finally {
    isSavingDatabaseGameConfig.value = false
  }
}

const resetDatabaseGameConfigForm = () => {
  loadDatabaseGameConfigFormFromCampaign(databaseCampaign.value)
  showSavedMessage('已還原目前資料庫設定到表單。')
}

const refreshDatabaseRecords = async () => {
  if (!normalizedDatabaseCampaignId.value) return

  try {
    const [playRecordsResult, rewardRecordsResult] = await Promise.all([
      getAdminGoldenEggPlayRecords(normalizedDatabaseCampaignId.value),
      getAdminGoldenEggRewardRecords(normalizedDatabaseCampaignId.value)
    ])

    databasePlayRecords.value = Array.isArray(playRecordsResult) ? playRecordsResult : []
    databaseRewardRecords.value = Array.isArray(rewardRecordsResult) ? rewardRecordsResult : []
    showOperationSuccess('已重新讀取資料庫紀錄。')
  } catch (error) {
    console.error('重新讀取資料庫紀錄失敗：', error)
    showOperationError(error.message || '重新讀取資料庫紀錄失敗。')
  }
}

const claimDatabaseRewardRecord = async (item) => {
  if (!item?.id) return

  const confirmed = window.confirm(`確定要核銷領獎「${item.prize?.title || item.claimCode || item.id}」嗎？`)

  if (!confirmed) return

  showOperationInfo('正在核銷領獎紀錄，請稍候...', false)

  try {
    await claimAdminGoldenEggRewardRecord(item.id, {
      claimedBy: 'admin',
      note: '後台資料庫模式核銷'
    })

    showOperationSuccess('已核銷領獎。')
    await refreshDatabaseRecords()
  } catch (error) {
    console.error('核銷領獎失敗：', error)
    showOperationError(error.message || '核銷領獎失敗。')
  }
}

const cancelDatabaseRewardRecord = async (item) => {
  if (!item?.id) return

  const confirmed = window.confirm(`確定要取消發獎「${item.prize?.title || item.claimCode || item.id}」嗎？`)

  if (!confirmed) return

  showOperationInfo('正在取消發獎紀錄，請稍候...', false)

  try {
    await cancelAdminGoldenEggRewardRecord(item.id, {
      note: '後台資料庫模式取消發獎'
    })

    showOperationSuccess('已取消發獎。')
    await refreshDatabaseRecords()
  } catch (error) {
    console.error('取消發獎失敗：', error)
    showOperationError(error.message || '取消發獎失敗。')
  }
}

const formatExportDatePart = (value) => String(value).padStart(2, '0')

const getExportDateStamp = () => {
  const now = new Date()

  return [
    now.getFullYear(),
    formatExportDatePart(now.getMonth() + 1),
    formatExportDatePart(now.getDate())
  ].join('-')
}

const escapeCsvValue = (value) => `"${String(value ?? '').replaceAll('\"', '\"\"')}"`

const downloadCsvFile = (filename, header = [], rows = []) => {
  const csv = [
    header.map(escapeCsvValue).join(','),
    ...rows.map((row) => row.map(escapeCsvValue).join(','))
  ].join('\n')

  const blob = new Blob([`\ufeff${csv}`], {
    type: 'text/csv;charset=utf-8'
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}

const getDatabaseExportFilterText = () => {
  const filters = getRecordSourceArray(databaseRecordFilterSummary)

  return filters.length ? filters.join('；') : '未套用篩選'
}

const exportDatabasePlayRecordsCsv = () => {
  const records = getRecordSourceArray(filteredDatabasePlayRecords)

  if (!records.length) {
    showOperationError('目前篩選結果沒有遊玩紀錄可以匯出。')
    return
  }

  const filterText = getDatabaseExportFilterText()
  const rows = records.map((item) => {
    const isWin = item.isWin || item.result === 'WIN' || Boolean(item.prize)

    return [
      item.id || '',
      isWin ? '中獎' : '未中獎',
      getDatabaseRecordPrizeTitle(item) || '未記錄獎項',
      item.playerName || '',
      item.playerPhone || '',
      item.playerEmail || '',
      item.serialCode?.code || item.serialCodeCode || '',
      item.gameType || '',
      item.result || '',
      formatDatabaseDateTime(item.playedAt || item.createdAt),
      filterText
    ]
  })

  downloadCsvFile(
    `golden-egg-play-records-${getExportDateStamp()}.csv`,
    ['紀錄ID', '結果', '獎項', '玩家名稱', '手機', 'Email', '序號', '遊戲類型', '原始結果', '時間', '匯出篩選'],
    rows
  )

  showOperationSuccess(`已依目前搜尋 / 篩選結果匯出 ${records.length} 筆遊玩紀錄 CSV。`)
}

const exportDatabaseRewardRecordsCsv = () => {
  const records = getRecordSourceArray(filteredDatabaseRewardRecords)

  if (!records.length) {
    showOperationError('目前篩選結果沒有中獎 / 發獎紀錄可以匯出。')
    return
  }

  const filterText = getDatabaseExportFilterText()
  const rows = records.map((item) => [
    item.id || '',
    getDatabaseRewardStatus(item),
    getDatabaseRecordPrizeTitle(item) || '未記錄獎項',
    item.winnerName || '',
    item.winnerPhone || '',
    item.winnerEmail || '',
    item.claimCode || '',
    item.serialCode?.code || item.serialCodeCode || '',
    formatDatabaseDateTime(item.createdAt),
    formatDatabaseDateTime(item.claimedAt || item.issuedAt),
    item.claimedBy || item.issuedBy || '',
    item.note || '',
    filterText
  ])

  downloadCsvFile(
    `golden-egg-reward-records-${getExportDateStamp()}.csv`,
    ['紀錄ID', '發獎狀態', '獎項', '得獎者名稱', '手機', 'Email', '核銷碼', '序號', '建立時間', '發獎 / 核銷時間', '處理人員', '備註', '匯出篩選'],
    rows
  )

  showOperationSuccess(`已依目前搜尋 / 篩選結果匯出 ${records.length} 筆中獎 / 發獎紀錄 CSV。`)
}

const exportDatabaseAllFilteredRecordsCsv = () => {
  exportDatabasePlayRecordsCsv()
  exportDatabaseRewardRecordsCsv()
}

const openDatabasePlayRecordExport = exportDatabasePlayRecordsCsv

const formatDatabaseDateTime = (value) => {
  if (!value) return '未記錄'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleString('zh-TW')
}


const formatDatabaseOverviewDate = (value) => {
  if (!value) return '未設定'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return String(value)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return `${year}/${month}/${day} ${hour}:${minute}`
}

const getDatabaseCampaignStatusMeta = (campaign = {}) => {
  const rawStatus = String(campaign.status || '').toUpperCase()
  const now = new Date()
  const startDate = campaign.startAt ? new Date(campaign.startAt) : null
  const endDate = campaign.endAt ? new Date(campaign.endAt) : null
  const hasValidStart = startDate && !Number.isNaN(startDate.getTime())
  const hasValidEnd = endDate && !Number.isNaN(endDate.getTime())

  if (rawStatus === 'DRAFT') {
    return {
      label: '草稿',
      tone: 'bg-slate-100 text-slate-700 ring-slate-200',
      description: '活動尚未正式啟用'
    }
  }

  if (rawStatus === 'INACTIVE') {
    return {
      label: '停用',
      tone: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
      description: '活動目前已停用'
    }
  }

  if (rawStatus === 'ENDED' || (hasValidEnd && now > endDate)) {
    return {
      label: '已結束',
      tone: 'bg-rose-50 text-rose-700 ring-rose-100',
      description: '活動時間已結束'
    }
  }

  if (hasValidStart && now < startDate) {
    return {
      label: '尚未開始',
      tone: 'bg-amber-50 text-amber-700 ring-amber-100',
      description: '活動尚未到開始時間'
    }
  }

  if (rawStatus === 'ACTIVE') {
    return {
      label: '進行中',
      tone: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
      description: '活動目前可正常參加'
    }
  }

  return {
    label: rawStatus || '未設定',
    tone: 'bg-slate-100 text-slate-700 ring-slate-200',
    description: '請確認活動狀態設定'
  }
}

const databaseActivityOverview = computed(() => {
  const campaign = databaseCampaign.value || {}
  const statusMeta = getDatabaseCampaignStatusMeta(campaign)
  const totalPrizeStock = databasePrizes.value.reduce((total, item) => total + Number(item.stockTotal || 0), 0)
  const remainingPrizeStock = databasePrizes.value.reduce((total, item) => {
    const remainStock = item.remainStock ?? item.stockRemaining ?? null
    const stockUsed = Number(item.stockUsed || 0)
    const stockTotal = Number(item.stockTotal || 0)

    return total + Number((remainStock ?? Math.max(0, stockTotal - stockUsed)) || 0)
  }, 0)
  const issuedRewardCount = databaseRewardRecords.value.filter((item) => ['ISSUED', 'CLAIMED'].includes(String(item.status || '').toUpperCase())).length
  const pendingRewardCount = databaseRewardRecords.value.filter((item) => String(item.status || 'PENDING').toUpperCase() === 'PENDING').length
  const winRate = databasePlayRecords.value.length
    ? Math.round((databaseRewardRecords.value.length / databasePlayRecords.value.length) * 1000) / 10
    : 0

  return {
    title: campaign.title || databaseCampaignForm.title || '未命名砸金蛋活動',
    slug: campaign.slug || databaseCampaignForm.slug || '未設定',
    rawStatus: campaign.status || databaseCampaignForm.status || '未設定',
    statusLabel: statusMeta.label,
    statusTone: statusMeta.tone,
    statusDescription: statusMeta.description,
    activityStartText: formatDatabaseOverviewDate(campaign.startAt || databaseCampaignForm.startAt),
    activityEndText: formatDatabaseOverviewDate(campaign.endAt || databaseCampaignForm.endAt),
    activityTimeText: `${formatDatabaseOverviewDate(campaign.startAt || databaseCampaignForm.startAt)} ～ ${formatDatabaseOverviewDate(campaign.endAt || databaseCampaignForm.endAt)}`,
    prizeCount: databasePrizes.value.length,
    totalPrizeStock,
    remainingPrizeStock,
    serialTotal: databaseSerialCodes.value.length,
    serialUsed: databaseStats.value.usedSerialCount,
    serialUnused: databaseStats.value.unusedSerialCount,
    playTotal: databasePlayRecords.value.length,
    rewardTotal: databaseRewardRecords.value.length,
    issuedRewardCount,
    pendingRewardCount,
    winRate
  }
})

const copyDatabaseText = async (text) => {
  if (!text) return

  try {
    await navigator.clipboard.writeText(text)
    showSavedMessage('已複製連結。')
  } catch (error) {
    window.prompt('請手動複製：', text)
  }
}


onMounted(() => {
  loadState()
  loadSerialCodes()
  loadSerialRedeemLogs()
  loadEggPlayLogs()
  startRedeemLogAutoRefresh()
  startEggPlayLogAutoRefresh()
})

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    stopRedeemLogAutoRefresh()
    stopEggPlayLogAutoRefresh()
  })
}

const getDatabaseSerialUsedCount = (item) => {
  return Number(item?.usedCount ?? item?.redeemedCount ?? item?.playCount ?? item?.currentUseCount ?? (item?.status === 'USED' ? item?.rewardChance || 1 : 0) ?? 0)
}

const getDatabaseSerialTotalCount = (item) => {
  return Number(item?.rewardChance ?? item?.maxUseCount ?? item?.totalCount ?? 1)
}

const getDatabaseSerialRemainingCount = (item) => {
  return Math.max(0, getDatabaseSerialTotalCount(item) - getDatabaseSerialUsedCount(item))
}

const getDatabaseSerialStatusInfo = (item) => {
  const status = String(item?.status || '').toUpperCase()
  const usedCount = getDatabaseSerialUsedCount(item)
  const totalCount = getDatabaseSerialTotalCount(item)
  const remainingCount = getDatabaseSerialRemainingCount(item)

  if (status === 'DISABLED' || item?.isDisabled) {
    return {
      key: 'DISABLED',
      label: '已停用',
      badgeClass: 'bg-slate-700 text-white',
      cardClass: 'border-slate-200 bg-slate-100/90 opacity-75',
      textClass: 'text-slate-700'
    }
  }

  if (status === 'USED' || remainingCount <= 0 || usedCount >= totalCount) {
    return {
      key: 'USED',
      label: '已使用',
      badgeClass: 'bg-rose-600 text-white',
      cardClass: 'border-rose-200 bg-rose-50/95 ring-1 ring-rose-100',
      textClass: 'text-rose-700'
    }
  }

  return {
    key: 'UNUSED',
    label: '可使用',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    cardClass: 'border-emerald-100 bg-white/90',
    textClass: 'text-emerald-700'
  }
}

const formatDatabaseSerialTime = (value) => {
  if (!value) return '尚未使用'

  try {
    return new Date(value).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return String(value)
  }
}



const normalizeColorInputValue = (value, fallback = '#7f1d1d') => {
  const text = String(value || '').trim()

  if (/^#[0-9a-fA-F]{6}$/.test(text)) return text
  if (/^#[0-9a-fA-F]{3}$/.test(text)) return text

  return fallback
}





const livePreviewSystemShareButtonStyle = computed(() => {
  const radius = Math.min(40, Math.max(0, Number(campaign.systemShareButtonRadius || 16)))
  const fontSize = Math.min(28, Math.max(10, Number(campaign.systemShareButtonTextSize || 14)))
  const paddingY = Math.min(28, Math.max(6, Number(campaign.systemShareButtonPaddingY || 12)))

  return {
    borderRadius: `${radius}px`,
    fontSize: `${fontSize}px`,
    paddingTop: `${paddingY}px`,
    paddingBottom: `${paddingY}px`,
    background: campaign.systemShareButtonBgColor || '#7f1d1d',
    color: campaign.systemShareButtonTextColor || '#ffffff'
  }
})


const syncSystemShareButtonSettingsToPreview = () => {
  campaign.systemShareButtonText = databaseGameConfigForm.systemShareButtonText || '系統分享'
  campaign.systemShareButtonTextSize = Number(databaseGameConfigForm.systemShareButtonTextSize || 14)
  campaign.systemShareButtonBgColor = databaseGameConfigForm.systemShareButtonBgColor || '#7f1d1d'
  campaign.systemShareButtonTextColor = databaseGameConfigForm.systemShareButtonTextColor || '#ffffff'
  campaign.systemShareButtonRadius = Number(databaseGameConfigForm.systemShareButtonRadius || 16)
  campaign.systemShareButtonPaddingY = Number(databaseGameConfigForm.systemShareButtonPaddingY || 12)
  campaign.systemShareText = databaseGameConfigForm.systemShareText || campaign.systemShareText || ''
  campaign.shareTitle = databaseGameConfigForm.shareTitle || campaign.shareTitle || ''
  campaign.shareDescription = databaseGameConfigForm.shareDescription || campaign.shareDescription || ''
  campaign.shareUrl = databaseGameConfigForm.shareUrl || campaign.shareUrl || ''
}


let systemSharePreviewTimer = null

const refreshRightPreviewFromSystemShareSettings = () => {
  syncSystemShareButtonSettingsToPreview()

  // 右側 Live Preview 是 iframe。
  // 必須把 campaign 寫進 localStorage，並更新 previewRefreshKey，iframe 才會重新讀到最新資料。
  saveState('已同步系統分享按鈕到右側預覽。')
}

const scheduleSystemSharePreviewRefresh = () => {
  if (systemSharePreviewTimer) {
    window.clearTimeout(systemSharePreviewTimer)
  }

  systemSharePreviewTimer = window.setTimeout(() => {
    systemSharePreviewTimer = null
    refreshRightPreviewFromSystemShareSettings()
  }, 120)
}


watch(
  () => [
    databaseGameConfigForm.systemShareButtonText,
    databaseGameConfigForm.systemShareButtonTextSize,
    databaseGameConfigForm.systemShareButtonBgColor,
    databaseGameConfigForm.systemShareButtonTextColor,
    databaseGameConfigForm.systemShareButtonRadius,
    databaseGameConfigForm.systemShareButtonPaddingY,
    databaseGameConfigForm.systemShareText,
    databaseGameConfigForm.shareTitle,
    databaseGameConfigForm.shareDescription,
    databaseGameConfigForm.shareUrl
  ],
  () => {
    scheduleSystemSharePreviewRefresh()
  }
)






// 第 396 批：還原資料庫區塊完整功能版，以第 381 批穩定版為基準。

// 第 398 批：紀錄管理展開按鈕位置修正版。

// 第 399 批：紀錄管理顯示筆數控制版。

// 第 400 批：紀錄管理顯示筆數真正生效版。

// 第 401 批：紀錄管理快速篩選統計版。
// 第 404 批：紀錄搜尋與篩選強化版。

// 第 402 批：操作狀態提示強化與序號處理中顯示補強版。

// 第 403 批：砸金蛋後台活動總覽卡版。

// 第 403 批修正版：活動總覽卡橫向條列排版版。
</script>

<template>
  <div class="min-h-screen bg-slate-100">
    <header class="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div class="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.22em] text-yellow-600">
            Golden Egg Admin
          </p>
          <h1 class="text-2xl font-black text-slate-900">
            砸金蛋後台管理
          </h1>
          <p class="mt-1 text-sm font-medium text-slate-500">
            左邊修改文字、色彩、獎項與特效；右邊即時顯示前台畫面。
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-2xl bg-yellow-400 px-4 py-2 text-sm font-black text-red-700 shadow-sm transition hover:bg-yellow-300"
            @click="syncToFrontNow"
          >
            立即同步前台
          </button>

          <button
            type="button"
            class="rounded-2xl bg-white px-4 py-2 text-sm font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
            @click="refreshPreview"
          >
            重新整理預覽
          </button>

          <button
            type="button"
            class="rounded-2xl bg-white px-4 py-2 text-sm font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
            @click="goFront"
          >
            開啟前台
          </button>

          <button
            type="button"
            class="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-black text-white transition hover:bg-slate-800"
            @click="goGames"
          >
            遊戲入口
          </button>
        </div>
      </div>
    </header>

    <transition name="admin-toast">
      <div
        v-if="savedMessage"
        :class="['fixed left-1/2 top-24 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl px-4 py-3 text-center text-sm font-black shadow-2xl', adminToastClass]"
      >
        {{ savedMessage }}
      </div>
    </transition>

    <transition name="admin-toast">
      <div
        v-if="operationMessage"
        :class="['mx-auto mt-4 flex max-w-[1600px] items-center justify-between gap-3 rounded-3xl border px-4 py-3 text-sm font-black shadow-sm', operationMessageClass]"
      >
        <span>{{ operationMessage }}</span>
        <button
          type="button"
          class="shrink-0 rounded-full bg-white/70 px-3 py-1 text-xs font-black text-slate-600 ring-1 ring-black/5"
          @click="operationMessage = ''"
        >
          關閉
        </button>
      </div>
    </transition>

    <main class="mx-auto grid max-w-[1600px] gap-4 px-4 py-4 xl:grid-cols-[520px_minmax(0,1fr)]">
      <aside class="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto">
        <div class="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5 xl:grid-cols-2">
          <button
            v-for="section in adminSections"
            :key="section.key"
            type="button"
            class="rounded-2xl border px-3 py-3 text-left transition"
            :class="activeSection === section.key ? 'border-yellow-300 bg-yellow-50 text-yellow-700' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'"
            @click="activeSection = section.key"
          >
            <span class="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-xl bg-white text-xs font-black shadow-sm">
              {{ section.icon }}
            </span>
            <span class="text-sm font-black">
              {{ section.label }}
            </span>
          </button>
        </div>

        <section
          v-if="activeSection === 'databaseMode'"
          class="space-y-4"
        >
          <div class="rounded-3xl bg-slate-50 p-4">
            <h2 class="text-lg font-black text-slate-900">
              正式資料庫模式
            </h2>
            <p class="mt-1 text-sm leading-6 text-slate-500">
              輸入正式 GOLDEN_EGG 活動的 campaignId，後台會從 PostgreSQL 讀取活動、獎項、序號、遊玩紀錄與中獎紀錄。這一批先做讀取與檢視，不會覆蓋你原本 localStorage 設定。
            </p>
          </div>

          <div class="rounded-3xl border border-indigo-100 bg-indigo-50 p-4">
            <h3 class="text-base font-black text-indigo-900">
              連線設定
            </h3>

            <div class="mt-4 rounded-3xl bg-white/55 p-3 ring-1 ring-indigo-100/70">
              <label class="admin-field">
                <span>正式活動 campaignId</span>
                <input
                  v-model="databaseCampaignId"
                  type="number"
                  min="1"
                  placeholder="例如：7"
                />
              </label>

              <div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                <button
                  type="button"
                  class="min-w-0 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="isLoadingDatabaseCampaign"
                  @click="loadDatabaseGoldenEggCampaign"
                >
                  {{ isLoadingDatabaseCampaign ? '讀取中...' : '讀取資料庫活動' }}
                </button>

                <button
                  type="button"
                  class="min-w-0 rounded-2xl bg-white px-4 py-3 text-sm font-black text-indigo-700 ring-1 ring-indigo-100"
                  @click="openDatabaseFrontPreview"
                >
                  開啟前台正式版
                </button>

                <button
                  type="button"
                  class="min-w-0 rounded-2xl bg-indigo-950 px-4 py-3 text-sm font-black text-white sm:col-span-2 xl:col-span-1"
                  @click="reloadDatabaseAndOpenFrontPreview"
                >
                  重讀並開啟前台
                </button>
              </div>
            </div>

            <p
              v-if="databaseLoadMessage"
              class="mt-3 rounded-2xl bg-white/70 px-4 py-3 text-xs font-black text-indigo-700"
            >
              {{ databaseLoadMessage }}
            </p>

            <div
              v-if="databasePreviewSyncMessage"
              class="mt-3 flex flex-col gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-black text-amber-700 ring-1 ring-amber-100 md:flex-row md:items-center md:justify-between"
            >
              <span>{{ databasePreviewSyncMessage }}</span>

              <button
                type="button"
                class="rounded-xl bg-amber-500 px-3 py-2 text-xs font-black text-amber-950"
                @click="openDatabaseFrontPreview"
              >
                開啟前台查看
              </button>
            </div>
          </div>

          <div class="rounded-3xl border border-slate-200 bg-white p-4">
            <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 class="text-base font-black text-slate-900">
                  資料庫模式快速導航
                </h3>
                <p class="mt-1 text-xs font-bold text-slate-500">
                  功能很多時，可用下方按鈕快速展開 / 收合各區塊。
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="rounded-2xl bg-slate-900 px-3 py-2 text-xs font-black text-white"
                  @click="openAllDatabaseSections"
                >
                  全部展開
                </button>

                <button
                  type="button"
                  class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-slate-700 ring-1 ring-slate-200"
                  @click="closeAllDatabaseSections"
                >
                  全部收合
                </button>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-2 2xl:grid-cols-4 xl:grid-cols-7">
              <button
                v-for="item in databaseQuickSections"
                :key="item.key"
                type="button"
                class="rounded-2xl px-3 py-3 text-left text-xs font-black transition"
                :class="databaseSectionOpen[item.key] ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-50 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'"
                @click="toggleDatabaseSection(item.key)"
              >
                <span class="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-xl bg-white/20">
                  {{ item.icon }}
                </span>
                {{ item.label }}
              </button>
            </div>
          </div>

          <div
            v-if="databaseCampaign && !databaseSectionOpen.summary && !databaseSectionOpen.campaign && !databaseSectionOpen.gameConfig && !databaseSectionOpen.prizes && !databaseSectionOpen.serials && !databaseSectionOpen.records"
            class="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center"
          >
            <p class="text-sm font-black text-slate-700">
              目前資料庫功能區塊已收合，可用上方快速導航展開需要的區塊。
            </p>
          </div>

          <div
            v-if="normalizedDatabaseCampaignId && databaseSectionOpen.links"
            class="rounded-3xl border border-emerald-100 bg-emerald-50 p-4"
          >
            <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 class="text-base font-black text-emerald-900">
                  正式觀看網址
                </h3>
                <p class="mt-1 text-xs font-bold text-emerald-700/80">
                  後台儲存資料庫設定後，請到前台正式頁刷新確認同步結果。
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-black text-white"
                  @click="openDatabaseFrontPreview"
                >
                  開啟前台
                </button>

                <button
                  type="button"
                  class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-emerald-700 ring-1 ring-emerald-100"
                  @click="copyDatabaseFrontPreviewUrl"
                >
                  複製前台網址
                </button>
              </div>
            </div>

            <div class="mt-3 rounded-2xl bg-white/80 p-3">
              <p class="text-xs font-bold text-emerald-600">
                前台正式資料庫金蛋
              </p>
              <div class="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
                <code class="flex-1 overflow-x-auto rounded-xl bg-emerald-950 px-3 py-2 text-xs font-bold text-emerald-50">
                  {{ databaseFrontUrl }}
                </code>
                <button
                  type="button"
                  class="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white"
                  @click="copyDatabaseText(databaseFrontUrl)"
                >
                  複製
                </button>
              </div>
            </div>

            <div class="mt-3 space-y-2">
              <article
                v-for="item in databaseApiUrls"
                :key="item.label"
                class="rounded-2xl bg-white/70 p-3"
              >
                <p class="text-xs font-black text-emerald-700">
                  {{ item.label }}
                </p>
                <div class="mt-1 flex flex-col gap-2 md:flex-row md:items-center">
                  <code class="flex-1 overflow-x-auto rounded-xl bg-slate-900 px-3 py-2 text-[11px] font-bold text-slate-50">
                    {{ item.url }}
                  </code>
                  <button
                    type="button"
                    class="rounded-xl bg-white px-3 py-2 text-xs font-black text-emerald-700 ring-1 ring-emerald-100"
                    @click="copyDatabaseText(item.url)"
                  >
                    複製
                  </button>
                </div>
              </article>
            </div>
          </div>

          <div
            v-if="databaseCampaign && databaseSectionOpen.summary"
            class="rounded-3xl border border-yellow-100 bg-gradient-to-br from-yellow-50 via-white to-orange-50 p-4 shadow-sm"
          >
            <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p class="text-xs font-black uppercase tracking-[0.2em] text-yellow-600">
                  Activity Overview
                </p>
                <h3 class="mt-1 text-lg font-black text-slate-900">
                  {{ databaseActivityOverview.title }}
                </h3>
                <p class="mt-1 text-xs font-bold text-slate-500">
                  Slug：{{ databaseActivityOverview.slug }}<span class="mx-1 text-slate-300">｜</span>原始狀態：{{ databaseActivityOverview.rawStatus }}
                </p>
              </div>

              <div class="flex flex-col items-start gap-2 md:items-end">
                <span :class="['inline-flex rounded-2xl px-4 py-2 text-sm font-black ring-1', databaseActivityOverview.statusTone]">
                  {{ databaseActivityOverview.statusLabel }}
                </span>
                <p class="text-xs font-black text-slate-500">
                  {{ databaseActivityOverview.statusDescription }}
                </p>
              </div>
            </div>

            <div class="mt-4 space-y-3">
              <article class="rounded-3xl bg-white/85 p-4 ring-1 ring-yellow-100">
                <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p class="text-xs font-black text-slate-400">活動期間</p>
                  <p class="text-[11px] font-bold text-slate-400">橫向顯示，避免時間被擠成直排</p>
                </div>

                <div class="mt-3 space-y-2">
                  <div class="flex min-w-0 items-center justify-between gap-3 rounded-2xl bg-yellow-50/80 px-4 py-3">
                    <p class="shrink-0 text-xs font-black text-yellow-600">開始</p>
                    <p class="min-w-0 truncate text-right text-sm font-black text-slate-900 sm:text-base">{{ databaseActivityOverview.activityStartText }}</p>
                  </div>

                  <div class="flex min-w-0 items-center justify-between gap-3 rounded-2xl bg-orange-50/80 px-4 py-3">
                    <p class="shrink-0 text-xs font-black text-orange-600">結束</p>
                    <p class="min-w-0 truncate text-right text-sm font-black text-slate-900 sm:text-base">{{ databaseActivityOverview.activityEndText }}</p>
                  </div>
                </div>
              </article>

              <article class="flex min-w-0 items-center justify-between gap-3 rounded-3xl bg-white/85 p-4 ring-1 ring-yellow-100">
                <div class="min-w-0">
                  <p class="text-xs font-black text-slate-400">獎項庫存</p>
                  <p class="mt-1 text-xs font-bold text-slate-500">共 {{ databaseActivityOverview.prizeCount }} 個獎項</p>
                </div>
                <p class="shrink-0 text-right text-2xl font-black text-slate-900">
                  {{ databaseActivityOverview.remainingPrizeStock }} / {{ databaseActivityOverview.totalPrizeStock }}
                </p>
              </article>

              <article class="flex min-w-0 items-center justify-between gap-3 rounded-3xl bg-white/85 p-4 ring-1 ring-yellow-100">
                <div class="min-w-0">
                  <p class="text-xs font-black text-slate-400">序號使用</p>
                  <p class="mt-1 text-xs font-bold text-slate-500">未使用 {{ databaseActivityOverview.serialUnused }} 組</p>
                </div>
                <p class="shrink-0 text-right text-2xl font-black text-slate-900">
                  {{ databaseActivityOverview.serialUsed }} / {{ databaseActivityOverview.serialTotal }}
                </p>
              </article>

              <article class="flex min-w-0 items-center justify-between gap-3 rounded-3xl bg-white/85 p-4 ring-1 ring-yellow-100">
                <div class="min-w-0">
                  <p class="text-xs font-black text-slate-400">中獎率概覽</p>
                  <p class="mt-1 text-xs font-bold text-slate-500">
                    {{ databaseActivityOverview.rewardTotal }} 次中獎 / {{ databaseActivityOverview.playTotal }} 次遊玩
                  </p>
                </div>
                <p class="shrink-0 text-right text-2xl font-black text-slate-900">
                  {{ databaseActivityOverview.winRate }}%
                </p>
              </article>

              <article class="rounded-3xl bg-white/85 p-4 ring-1 ring-yellow-100">
                <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div class="rounded-2xl bg-slate-50 p-3 text-center">
                    <p class="text-xs font-black text-slate-400">遊玩次數</p>
                    <p class="mt-1 text-xl font-black text-slate-900">{{ databaseActivityOverview.playTotal }}</p>
                  </div>

                  <div class="rounded-2xl bg-rose-50 p-3 text-center">
                    <p class="text-xs font-black text-rose-400">中獎次數</p>
                    <p class="mt-1 text-xl font-black text-rose-700">{{ databaseActivityOverview.rewardTotal }}</p>
                  </div>

                  <div class="rounded-2xl bg-emerald-50 p-3 text-center">
                    <p class="text-xs font-black text-emerald-500">已發獎</p>
                    <p class="mt-1 text-xl font-black text-emerald-700">{{ databaseActivityOverview.issuedRewardCount }}</p>
                  </div>

                  <div class="rounded-2xl bg-amber-50 p-3 text-center">
                    <p class="text-xs font-black text-amber-500">未發獎</p>
                    <p class="mt-1 text-xl font-black text-amber-700">{{ databaseActivityOverview.pendingRewardCount }}</p>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <div
            v-if="databaseCampaign && databaseSectionOpen.summary"
            class="grid grid-cols-2 gap-3 xl:grid-cols-6"
          >
            <div class="rounded-3xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-200">
              <p class="text-xs font-bold text-slate-400">獎項</p>
              <p class="mt-1 text-3xl font-black text-slate-900">{{ databaseStats.prizeCount }}</p>
            </div>

            <div class="rounded-3xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-200">
              <p class="text-xs font-bold text-slate-400">序號</p>
              <p class="mt-1 text-3xl font-black text-slate-900">{{ databaseStats.serialCount }}</p>
            </div>

            <div class="rounded-3xl bg-emerald-50 p-4 text-center shadow-sm ring-1 ring-emerald-100">
              <p class="text-xs font-bold text-emerald-500">可用序號</p>
              <p class="mt-1 text-3xl font-black text-emerald-700">{{ databaseStats.unusedSerialCount }}</p>
            </div>

            <div class="rounded-3xl bg-amber-50 p-4 text-center shadow-sm ring-1 ring-amber-100">
              <p class="text-xs font-bold text-amber-500">已用序號</p>
              <p class="mt-1 text-3xl font-black text-amber-700">{{ databaseStats.usedSerialCount }}</p>
            </div>

            <div class="rounded-3xl bg-indigo-50 p-4 text-center shadow-sm ring-1 ring-indigo-100">
              <p class="text-xs font-bold text-indigo-500">遊玩紀錄</p>
              <p class="mt-1 text-3xl font-black text-indigo-700">{{ databaseStats.playCount }}</p>
            </div>

            <div class="rounded-3xl bg-rose-50 p-4 text-center shadow-sm ring-1 ring-rose-100">
              <p class="text-xs font-bold text-rose-500">中獎紀錄</p>
              <p class="mt-1 text-3xl font-black text-rose-700">{{ databaseStats.rewardCount }}</p>
            </div>
          </div>

          <div
            v-if="databaseCampaign && databaseSectionOpen.campaign"
            class="rounded-3xl border border-orange-100 bg-orange-50 p-4"
          >
            <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 class="text-base font-black text-orange-900">
                  資料庫活動基本資料 Campaign
                </h3>
                <p class="mt-1 text-xs font-bold text-orange-700/80">
                  儲存後會直接更新 Campaign 主表，前台正式網址與 API 都會讀到新資料。
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-orange-700 ring-1 ring-orange-100"
                  @click="resetDatabaseCampaignForm"
                >
                  還原表單
                </button>

                <button
                  type="button"
                  class="rounded-2xl bg-orange-600 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="isSavingDatabaseCampaign"
                  @click="saveDatabaseCampaign"
                >
                  {{ isSavingDatabaseCampaign ? '儲存中...' : '儲存活動資料' }}
                </button>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <label class="admin-field">
                <span>活動名稱 title</span>
                <input
                  v-model="databaseCampaignForm.title"
                  type="text"
                  placeholder="例如：正式砸金蛋測試活動"
                />
              </label>

              <label class="admin-field">
                <span>活動網址代碼 slug</span>
                <input
                  v-model="databaseCampaignForm.slug"
                  type="text"
                  placeholder="例如：golden-egg-demo-v22"
                />
              </label>

              <label class="admin-field">
                <span>活動類型 gameType</span>
                <select v-model="databaseCampaignForm.gameType">
                  <option value="GOLDEN_EGG">GOLDEN_EGG 砸金蛋</option>
                  <option value="WHEEL">WHEEL 輪盤</option>
                  <option value="GRID">GRID 九宮格</option>
                  <option value="FLIP">FLIP 翻牌</option>
                  <option value="SCRATCH">SCRATCH 刮刮卡</option>
                </select>
              </label>

              <label class="admin-field">
                <span>活動狀態 status</span>
                <select v-model="databaseCampaignForm.status">
                  <option value="ACTIVE">ACTIVE 啟用</option>
                  <option value="DRAFT">DRAFT 草稿</option>
                  <option value="INACTIVE">INACTIVE 停用</option>
                  <option value="ENDED">ENDED 已結束</option>
                </select>
              </label>

              <label class="admin-field">
                <span>開始時間 startAt</span>
                <input
                  v-model="databaseCampaignForm.startAt"
                  type="datetime-local"
                />
              </label>

              <label class="admin-field">
                <span>結束時間 endAt</span>
                <input
                  v-model="databaseCampaignForm.endAt"
                  type="datetime-local"
                />
              </label>

              <label class="admin-field">
                <span>每日限制 dailyLimit</span>
                <input
                  v-model.number="databaseCampaignForm.dailyLimit"
                  type="number"
                  min="0"
                />
              </label>

              <label class="admin-field">
                <span>總限制 totalLimit</span>
                <input
                  v-model.number="databaseCampaignForm.totalLimit"
                  type="number"
                  min="0"
                />
              </label>

              <label class="admin-field md:col-span-2">
                <span>活動描述 description</span>
                <textarea
                  v-model="databaseCampaignForm.description"
                  rows="3"
                  placeholder="輸入活動說明"
                />
              </label>
            </div>

            <label class="admin-toggle mt-4">
              <input v-model="databaseCampaignForm.requireLogin" type="checkbox" />
              <span>需要登入才能參加 requireLogin</span>
            </label>
          </div>

          <div
            v-if="databaseCampaign && databaseSectionOpen.summary"
            class="rounded-3xl border border-slate-200 bg-white p-4"
          >
            <h3 class="text-base font-black text-slate-900">
              活動資料
            </h3>

            <div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div class="rounded-2xl bg-slate-50 p-3">
                <p class="text-xs font-bold text-slate-400">活動名稱</p>
                <p class="mt-1 text-sm font-black text-slate-900">{{ databaseCampaign.title }}</p>
              </div>

              <div class="rounded-2xl bg-slate-50 p-3">
                <p class="text-xs font-bold text-slate-400">活動類型 / 狀態</p>
                <p class="mt-1 text-sm font-black text-slate-900">
                  {{ databaseCampaign.gameType }} / {{ databaseCampaign.status }}
                </p>
              </div>

              <div class="rounded-2xl bg-slate-50 p-3">
                <p class="text-xs font-bold text-slate-400">開始時間</p>
                <p class="mt-1 text-sm font-black text-slate-900">{{ databaseCampaign.startAt || '未設定' }}</p>
              </div>

              <div class="rounded-2xl bg-slate-50 p-3">
                <p class="text-xs font-bold text-slate-400">結束時間</p>
                <p class="mt-1 text-sm font-black text-slate-900">{{ databaseCampaign.endAt || '未設定' }}</p>
              </div>
            </div>
          </div>

          <div
            v-if="databaseCampaign && databaseSectionOpen.gameConfig"
            class="rounded-3xl border border-blue-100 bg-blue-50 p-4"
          >
            <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 class="text-base font-black text-blue-900">
                  資料庫前台設定 GameConfig
                </h3>
                <p class="mt-1 text-xs font-bold text-blue-700/80">
                  儲存後會寫入 GameConfig.settings，前台正式資料庫模式會讀取這些設定。
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-blue-700 ring-1 ring-blue-100"
                  @click="resetDatabaseGameConfigForm"
                >
                  還原表單
                </button>

                <button
                  type="button"
                  class="rounded-2xl bg-blue-600 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="isSavingDatabaseGameConfig"
                  @click="saveDatabaseGameConfig"
                >
                  {{ isSavingDatabaseGameConfig ? '儲存中...' : '儲存前台設定' }}
                </button>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <label class="admin-field">
                <span>頁面名稱 pageTitle</span>
                <input v-model="databaseGameConfigForm.pageTitle" type="text" />
              </label>

              <label class="admin-field">
                <span>主標題 mainTitle</span>
                <input v-model="databaseGameConfigForm.mainTitle" type="text" />
              </label>

              <label class="admin-field">
                <span>副標題 subTitle</span>
                <input v-model="databaseGameConfigForm.subTitle" type="text" />
              </label>

              <label class="admin-field">
                <span>標語 heroTagline</span>
                <input v-model="databaseGameConfigForm.heroTagline" type="text" />
              </label>

              <label class="admin-field md:col-span-2">
                <span>公告文字 noticeText</span>
                <textarea
                  v-model="databaseGameConfigForm.noticeText"
                  rows="3"
                />
              </label>

              <label class="admin-field">
                <span>序號區塊標題</span>
                <input v-model="databaseGameConfigForm.serialRedeemTitle" type="text" />
              </label>

              <label class="admin-field">
                <span>序號按鈕文字</span>
                <input v-model="databaseGameConfigForm.serialRedeemButtonText" type="text" />
              </label>

              <label class="admin-field md:col-span-2">
                <span>序號說明文字</span>
                <textarea
                  v-model="databaseGameConfigForm.serialRedeemDescription"
                  rows="3"
                />
              </label>

              <label class="admin-field">
                <span>序號成功文字</span>
                <input v-model="databaseGameConfigForm.serialRedeemSuccessText" type="text" />
              </label>

              <label class="admin-field">
                <span>序號錯誤文字</span>
                <input v-model="databaseGameConfigForm.serialRedeemErrorText" type="text" />
              </label>

              <label class="admin-field">
                <span>活動進行中文字</span>
                <input v-model="databaseGameConfigForm.activityRunningText" type="text" />
              </label>

              <label class="admin-field">
                <span>活動尚未開始文字</span>
                <input v-model="databaseGameConfigForm.activityNotStartedText" type="text" />
              </label>

              <label class="admin-field md:col-span-2">
                <span>活動已結束文字</span>
                <input v-model="databaseGameConfigForm.activityEndedText" type="text" />
              </label>
            </div>

            <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <label class="admin-field">
                <span>正式前台金蛋大小 eggSize</span>
                <input
                  v-model.number="databaseGameConfigForm.eggSize"
                  type="range"
                  min="48"
                  max="120"
                />
                <span class="text-xs font-black text-blue-700">{{ databaseGameConfigForm.eggSize }}px</span>
              </label>

              <label class="admin-field">
                <span>正式前台金蛋格子大小 eggCardSize</span>
                <input
                  v-model.number="databaseGameConfigForm.eggCardSize"
                  type="range"
                  min="96"
                  max="160"
                />
                <span class="text-xs font-black text-blue-700">{{ databaseGameConfigForm.eggCardSize }}px</span>
              </label>

              <label class="admin-field">
                <span>正式前台金蛋間距 eggGridGap</span>
                <input
                  v-model.number="databaseGameConfigForm.eggGridGap"
                  type="range"
                  min="6"
                  max="24"
                />
                <span class="text-xs font-black text-blue-700">{{ databaseGameConfigForm.eggGridGap }}px</span>
              </label>
            </div>

            
            <div class="mt-4 rounded-3xl border border-sky-100 bg-sky-50/70 p-4">
              <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <h4 class="text-sm font-black text-slate-950">
                    分享設定
                  </h4>
                  <p class="mt-1 text-xs font-bold text-sky-700">
                    控制前台「系統分享 / LINE 分享 / Telegram」按鈕要帶出的文字與網址。
                  </p>
                </div>

                <button
                  type="button"
                  class="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white"
                  @click="databaseGameConfigForm.shareUrl = `https://marketing-game-v1-em29.vercel.app/games/golden-egg?campaignId=${normalizedDatabaseCampaignId || 1}`"
                >
                  套用正式活動網址
                </button>
              </div>

              <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <label class="admin-field">
                  <span>分享標題 shareTitle</span>
                  <input
                    v-model="databaseGameConfigForm.shareTitle"
                    type="text"
                    placeholder="九宮格砸金蛋抽獎活動"
                  />
                </label>

                <label class="admin-field">
                  <span>分享網址 shareUrl</span>
                  <input
                    v-model="databaseGameConfigForm.shareUrl"
                    type="url"
                    placeholder="https://marketing-game-v1-em29.vercel.app/games/golden-egg?campaignId=1"
                  />
                </label>

                <label class="admin-field md:col-span-2">
                  <span>分享描述 shareDescription</span>
                  <input
                    v-model="databaseGameConfigForm.shareDescription"
                    type="text"
                    placeholder="輸入活動序號，立即砸金蛋抽好禮！"
                  />
                </label>

                <label class="admin-field md:col-span-2">
                  <span>分享圖片網址 shareImageUrl</span>
                  <input
                    v-model="databaseGameConfigForm.shareImageUrl"
                    type="url"
                    placeholder="https://example.com/share-golden-egg.jpg"
                  />
                  <small class="text-xs font-bold text-slate-400">
                    LINE 預覽圖需要 Open Graph 支援；目前先作為分享資料欄位保存。
                  </small>
                </label>

                
                <label class="admin-field md:col-span-2">
                  <span>系統分享按鈕文字 systemShareButtonText</span>
                  <input
                    v-model="databaseGameConfigForm.systemShareButtonText"
                    type="text"
                    placeholder="系統分享"
                  />
                </label>

                <div class="rounded-3xl border border-slate-100 bg-white/80 p-4">
                  <div class="flex items-center justify-between gap-3">
                    <div>
                      <p class="text-sm font-black text-slate-800">文字大小</p>
                      <p class="text-xs font-bold text-slate-400">
                        {{ databaseGameConfigForm.systemShareButtonTextSize || 14 }} px
                      </p>
                    </div>
                    <span class="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
                      {{ databaseGameConfigForm.systemShareButtonTextSize || 14 }}
                    </span>
                  </div>
                  <input
                    v-model.number="databaseGameConfigForm.systemShareButtonTextSize"
                    class="mt-3 w-full accent-slate-950"
                    type="range"
                    min="10"
                    max="28"
                    step="1"
                  />
                </div>

                <div class="rounded-3xl border border-slate-100 bg-white/80 p-4">
                  <div class="flex items-center justify-between gap-3">
                    <div>
                      <p class="text-sm font-black text-slate-800">背景顏色</p>
                      <p class="text-xs font-bold text-slate-400">
                        {{ databaseGameConfigForm.systemShareButtonBgColor || '#7f1d1d' }}
                      </p>
                    </div>
                    <input
                      v-model="databaseGameConfigForm.systemShareButtonBgColor"
                      class="h-10 w-14 cursor-pointer rounded-2xl border border-slate-200 bg-white p-1"
                      type="color"
                    />
                  </div>
                </div>

                <div class="rounded-3xl border border-slate-100 bg-white/80 p-4">
                  <div class="flex items-center justify-between gap-3">
                    <div>
                      <p class="text-sm font-black text-slate-800">文字顏色</p>
                      <p class="text-xs font-bold text-slate-400">
                        {{ databaseGameConfigForm.systemShareButtonTextColor || '#ffffff' }}
                      </p>
                    </div>
                    <input
                      v-model="databaseGameConfigForm.systemShareButtonTextColor"
                      class="h-10 w-14 cursor-pointer rounded-2xl border border-slate-200 bg-white p-1"
                      type="color"
                    />
                  </div>
                </div>

                <div class="rounded-3xl border border-slate-100 bg-white/80 p-4">
                  <div class="flex items-center justify-between gap-3">
                    <div>
                      <p class="text-sm font-black text-slate-800">按鈕圓角</p>
                      <p class="text-xs font-bold text-slate-400">
                        {{ databaseGameConfigForm.systemShareButtonRadius || 16 }} px
                      </p>
                    </div>
                    <span class="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
                      {{ databaseGameConfigForm.systemShareButtonRadius || 16 }}
                    </span>
                  </div>
                  <input
                    v-model.number="databaseGameConfigForm.systemShareButtonRadius"
                    class="mt-3 w-full accent-slate-950"
                    type="range"
                    min="0"
                    max="40"
                    step="1"
                  />
                </div>

                <div class="rounded-3xl border border-slate-100 bg-white/80 p-4">
                  <div class="flex items-center justify-between gap-3">
                    <div>
                      <p class="text-sm font-black text-slate-800">按鈕高度</p>
                      <p class="text-xs font-bold text-slate-400">
                        上下內距 {{ databaseGameConfigForm.systemShareButtonPaddingY || 12 }} px
                      </p>
                    </div>
                    <span class="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
                      {{ databaseGameConfigForm.systemShareButtonPaddingY || 12 }}
                    </span>
                  </div>
                  <input
                    v-model.number="databaseGameConfigForm.systemShareButtonPaddingY"
                    class="mt-3 w-full accent-slate-950"
                    type="range"
                    min="6"
                    max="28"
                    step="1"
                  />
                </div>


                <div class="md:col-span-2 rounded-3xl border border-amber-100 bg-amber-50/80 p-4">
                  <p class="text-sm font-black text-slate-800">快速配色</p>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="rounded-2xl bg-[#7f1d1d] px-4 py-2 text-xs font-black text-white"
                      @click="databaseGameConfigForm.systemShareButtonBgColor = '#7f1d1d'; databaseGameConfigForm.systemShareButtonTextColor = '#ffffff'"
                    >
                      深紅
                    </button>
                    <button
                      type="button"
                      class="rounded-2xl bg-[#facc15] px-4 py-2 text-xs font-black text-[#7f1d1d]"
                      @click="databaseGameConfigForm.systemShareButtonBgColor = '#facc15'; databaseGameConfigForm.systemShareButtonTextColor = '#7f1d1d'"
                    >
                      金色
                    </button>
                    <button
                      type="button"
                      class="rounded-2xl bg-[#22c55e] px-4 py-2 text-xs font-black text-white"
                      @click="databaseGameConfigForm.systemShareButtonBgColor = '#22c55e'; databaseGameConfigForm.systemShareButtonTextColor = '#ffffff'"
                    >
                      綠色
                    </button>
                    <button
                      type="button"
                      class="rounded-2xl bg-[#111827] px-4 py-2 text-xs font-black text-white"
                      @click="databaseGameConfigForm.systemShareButtonBgColor = '#111827'; databaseGameConfigForm.systemShareButtonTextColor = '#ffffff'"
                    >
                      深色
                    </button>
                  </div>
                </div>

<label class="admin-field md:col-span-2">
                  <span>系統分享文字 systemShareText</span>
                  <textarea
                    v-model="databaseGameConfigForm.systemShareText"
                    rows="3"
                    placeholder="🎉 九宮格砸金蛋抽獎活動&#10;輸入活動序號，立即砸金蛋抽好禮！"
                  ></textarea>
                </label>

                <label class="admin-field md:col-span-2">
                  <span>LINE 分享文字 lineShareText</span>
                  <textarea
                    v-model="databaseGameConfigForm.lineShareText"
                    rows="3"
                    placeholder="🎉 九宮格砸金蛋抽獎活動｜輸入序號就有機會中大獎！"
                  ></textarea>
                </label>

                <label class="admin-field md:col-span-2">
                  <span>Telegram 分享文字 telegramShareText</span>
                  <textarea
                    v-model="databaseGameConfigForm.telegramShareText"
                    rows="3"
                    placeholder="🎉 九宮格砸金蛋抽獎活動｜輸入序號就有機會中大獎！"
                  ></textarea>
                </label>
              </div>

              
              <div class="mt-3 rounded-2xl bg-white/80 p-3">
                <p class="mb-2 text-xs font-black text-slate-500">系統分享按鈕預覽</p>
                <p class="mt-1 text-xs font-bold text-rose-500">右側預覽是 iframe；調整後會自動刷新右側預覽。若正式前台要同步，仍需按「儲存前台設定 / 立即同步前台」。</p>
                <button
                  type="button"
                  class="w-full font-black shadow-lg"
                  :style="{
                    borderRadius: `${Number(databaseGameConfigForm.systemShareButtonRadius || 16)}px`,
                    fontSize: `${Number(databaseGameConfigForm.systemShareButtonTextSize || 14)}px`,
                    paddingTop: `${Number(databaseGameConfigForm.systemShareButtonPaddingY || 12)}px`,
                    paddingBottom: `${Number(databaseGameConfigForm.systemShareButtonPaddingY || 12)}px`,
                    background: databaseGameConfigForm.systemShareButtonBgColor || '#7f1d1d',
                    color: databaseGameConfigForm.systemShareButtonTextColor || '#ffffff'
                  }"
                >
                  {{ databaseGameConfigForm.systemShareButtonText || '系統分享' }}
                </button>
              </div>

<div class="mt-3 rounded-2xl bg-white/80 p-3 text-xs font-bold text-slate-600">
                分享預覽：
                <span class="font-black text-slate-950">{{ databaseGameConfigForm.shareTitle }}</span>
                <span class="mx-1">｜</span>
                <span>{{ databaseGameConfigForm.shareDescription }}</span>
              </div>
            </div>

            <div class="mt-4 rounded-3xl border border-amber-100 bg-amber-50/70 p-4">
              <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <h4 class="text-sm font-black text-amber-950">
                    資料庫金蛋顏色同步
                  </h4>
                  <p class="mt-1 text-xs font-bold text-amber-700">
                    這三個顏色會寫入 PostgreSQL gameConfig.settings，手機 / 電腦前台都會以這裡為準。
                  </p>
                </div>

                <button
                  type="button"
                  class="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white"
                  @click="databaseGameConfigForm.eggColorTop = campaign.eggColorTop || '#fff7ad'; databaseGameConfigForm.eggColorMiddle = campaign.eggColorMiddle || '#fde047'; databaseGameConfigForm.eggColorBottom = campaign.eggColorBottom || '#b45309'"
                >
                  套用右側預覽顏色
                </button>
              </div>

              <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <label class="admin-field">
                  <span>DB 金蛋亮色 eggColorTop</span>
                  <input
                    v-model="databaseGameConfigForm.eggColorTop"
                    type="color"
                  />
                  <code class="text-xs font-black text-slate-700">{{ databaseGameConfigForm.eggColorTop }}</code>
                </label>

                <label class="admin-field">
                  <span>DB 金蛋主色 eggColorMiddle</span>
                  <input
                    v-model="databaseGameConfigForm.eggColorMiddle"
                    type="color"
                  />
                  <code class="text-xs font-black text-slate-700">{{ databaseGameConfigForm.eggColorMiddle }}</code>
                </label>

                <label class="admin-field">
                  <span>DB 金蛋暗色 eggColorBottom</span>
                  <input
                    v-model="databaseGameConfigForm.eggColorBottom"
                    type="color"
                  />
                  <code class="text-xs font-black text-slate-700">{{ databaseGameConfigForm.eggColorBottom }}</code>
                </label>
              </div>

              <div class="mt-3 rounded-2xl bg-white/80 p-3 text-xs font-black text-slate-600">
                目前準備寫入資料庫：
                <span class="ml-2 text-slate-900">{{ databaseGameConfigForm.eggColorTop }}</span>
                <span class="mx-1">/</span>
                <span class="text-slate-900">{{ databaseGameConfigForm.eggColorMiddle }}</span>
                <span class="mx-1">/</span>
                <span class="text-slate-900">{{ databaseGameConfigForm.eggColorBottom }}</span>
              </div>
            </div>

<div class="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
              <label class="admin-toggle">
                <input v-model="databaseGameConfigForm.showActivityTimeSection" type="checkbox" />
                <span>顯示活動時間</span>
              </label>

              <label class="admin-toggle">
                <input v-model="databaseGameConfigForm.showActivityCountdown" type="checkbox" />
                <span>顯示活動倒數</span>
              </label>

              <label class="admin-toggle">
                <input v-model="databaseGameConfigForm.activityCountdownAlwaysShowSeconds" type="checkbox" />
                <span>倒數顯示秒數</span>
              </label>

              <label class="admin-toggle">
                <input v-model="databaseGameConfigForm.showBottomNav" type="checkbox" />
                <span>顯示底部功能列</span>
              </label>
            </div>
          </div>

          <div
            v-if="databaseCampaign && (databaseSectionOpen.prizes || databaseSectionOpen.serials)"
            class="grid grid-cols-1 gap-4 xl:grid-cols-2"
          >
            <div
              v-if="databaseSectionOpen.prizes"
              class="rounded-3xl border border-yellow-100 bg-yellow-50 p-5 xl:col-span-2"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h3 class="text-base font-black text-yellow-900">
                    資料庫獎項管理
                  </h3>
                  <p class="mt-1 text-xs font-bold text-yellow-700/80">
                    可直接新增、修改、刪除 PostgreSQL 裡的 Prize 獎項。此區已改為寬版，避免欄位太擠。
                  </p>
                </div>

                <button
                  type="button"
                  class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-yellow-700 ring-1 ring-yellow-100"
                  @click="resetDatabasePrizeForm"
                >
                  清空表單
                </button>
              </div>

              <div class="mt-4 rounded-3xl bg-white/75 p-4">
                <h4 class="text-sm font-black text-slate-900">
                  {{ databasePrizeForm.id ? '編輯資料庫獎項' : '新增資料庫獎項' }}
                </h4>

                <div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                  <label class="admin-field">
                    <span>獎項名稱</span>
                    <input
                      v-model="databasePrizeForm.title"
                      type="text"
                      placeholder="例如：金蛋大獎"
                    />
                  </label>

                  <label class="admin-field">
                    <span>獎項簡稱</span>
                    <input
                      v-model="databasePrizeForm.shortName"
                      type="text"
                      placeholder="例如：大獎"
                    />
                  </label>

                  <label class="admin-field">
                    <span>圖示</span>
                    <input
                      v-model="databasePrizeForm.icon"
                      type="text"
                      placeholder="例如：🎁"
                    />
                  </label>

                  <label class="admin-field">
                    <span>圖片網址</span>
                    <input
                      v-model="databasePrizeForm.imageUrl"
                      type="text"
                      placeholder="https://..."
                    />
                  </label>

                  <label class="admin-field">
                    <span>類型</span>
                    <select v-model="databasePrizeForm.type">
                      <option value="WIN">中獎</option>
                      <option value="LOSE">未中獎</option>
                    </select>
                  </label>

                  <label class="admin-field">
                    <span>狀態</span>
                    <select v-model="databasePrizeForm.status">
                      <option value="ACTIVE">啟用</option>
                      <option value="DISABLED">停用</option>
                    </select>
                  </label>

                  <label class="admin-field">
                    <span>百分比機率</span>
                    <input
                      v-model.number="databasePrizeForm.probability"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </label>

                  <label class="admin-field">
                    <span>排序</span>
                    <input
                      v-model.number="databasePrizeForm.sortOrder"
                      type="number"
                      min="0"
                    />
                  </label>

                  <label class="admin-field">
                    <span>總庫存 stockTotal</span>
                    <input
                      v-model.number="databasePrizeForm.stockTotal"
                      type="number"
                      min="0"
                    />
                  </label>

                  <label class="admin-field">
                    <span>剩餘庫存 remainStock</span>
                    <input
                      v-model.number="databasePrizeForm.remainStock"
                      type="number"
                      min="0"
                    />
                  </label>

                  <label class="admin-field">
                    <span>已用庫存 stockUsed</span>
                    <input
                      v-model.number="databasePrizeForm.stockUsed"
                      type="number"
                      min="0"
                    />
                  </label>

                  <label class="admin-field md:col-span-2 2xl:col-span-3">
                    <span>獎項說明</span>
                    <textarea
                      v-model="databasePrizeForm.description"
                      rows="3"
                      placeholder="例如：恭喜獲得金蛋大獎，請洽主辦單位兌換。"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  class="mt-3 w-full rounded-2xl bg-yellow-500 px-4 py-3 text-sm font-black text-yellow-950 shadow-sm transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="isSavingDatabasePrize"
                  @click="saveDatabasePrize"
                >
                  {{ isSavingDatabasePrize ? '儲存中...' : databasePrizeForm.id ? '更新資料庫獎項' : '新增資料庫獎項' }}
                </button>
              </div>

              <div class="mt-4 max-h-[560px] space-y-3 overflow-y-auto pr-1">
                <article
                  v-for="item in databasePrizes"
                  :key="item.id"
                  class="rounded-2xl bg-white/80 p-3"
                >
                  <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p class="text-sm font-black text-slate-900">
                        {{ item.icon || '🎁' }} {{ item.title }}
                      </p>
                      <p class="mt-1 text-xs font-bold text-slate-500">
                        {{ item.type }}｜{{ item.status }}｜機率 {{ item.probability }}%｜剩餘 {{ item.remainStock }}｜總庫存 {{ item.stockTotal }}｜已用 {{ item.stockUsed }}
                      </p>
                      <p
                        v-if="item.description"
                        class="mt-1 text-xs font-bold text-slate-400"
                      >
                        {{ item.description }}
                      </p>
                    </div>

                    <div class="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        class="rounded-xl bg-yellow-100 px-3 py-2 text-xs font-black text-yellow-700"
                        @click="editDatabasePrize(item)"
                      >
                        編輯
                      </button>

                      <button
                        type="button"
                        class="rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 ring-1 ring-rose-100"
                        @click="removeDatabasePrize(item)"
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                </article>
              </div>
            </div>

            <div
              v-if="databaseSectionOpen.serials"
              class="rounded-3xl border border-cyan-100 bg-cyan-50 p-5 xl:col-span-2"
            >
              <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 class="text-base font-black text-cyan-900">
                    資料庫序號管理
                  </h3>
                  <p class="mt-1 text-xs font-bold text-cyan-700/80">
                    可直接新增、產生、停用、發放與刪除 PostgreSQL 裡的 SerialCode。此區已改為寬版，避免欄位太擠。
                  </p>
                </div>

                <button
                  type="button"
                  class="self-start rounded-2xl bg-white px-4 py-2 text-xs font-black text-cyan-700 shadow-sm ring-1 ring-cyan-100 transition hover:-translate-y-0.5 hover:bg-cyan-50"
                  @click="openDatabaseSerialExport"
                >
                  匯出目前序號 CSV
                </button>
              </div>

              <div class="mt-4 rounded-3xl bg-white/75 p-4">
                <h4 class="text-sm font-black text-slate-900">
                  建立資料庫序號
                </h4>

                <div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                  <label class="admin-field">
                    <span>單組序號</span>
                    <input
                      v-model="databaseSerialForm.code"
                      type="text"
                      placeholder="例如：VIP-CODE-001"
                    />
                  </label>

                  <label class="admin-field">
                    <span>批次代碼</span>
                    <input
                      v-model="databaseSerialForm.batchCode"
                      type="text"
                      placeholder="例如：DEMO"
                    />
                  </label>

                  <label class="admin-field">
                    <span>增加次數 rewardChance</span>
                    <input
                      v-model.number="databaseSerialForm.rewardChance"
                      type="number"
                      min="1"
                      max="99"
                    />
                  </label>

                  <label class="admin-field">
                    <span>有效期限</span>
                    <input
                      v-model="databaseSerialForm.expireAt"
                      type="datetime-local"
                    />
                  </label>

                  <label class="admin-field">
                    <span>自動產生前綴</span>
                    <input
                      v-model="databaseSerialForm.prefix"
                      type="text"
                      placeholder="EGG"
                    />
                  </label>

                  <label class="admin-field">
                    <span>自動產生數量</span>
                    <input
                      v-model.number="databaseSerialForm.count"
                      type="number"
                      min="1"
                      max="500"
                    />
                  </label>

                  <label class="admin-field">
                    <span>序號長度</span>
                    <input
                      v-model.number="databaseSerialForm.length"
                      type="number"
                      min="12"
                      max="32"
                    />
                  </label>

                  <label class="admin-field">
                    <span>備註</span>
                    <input
                      v-model="databaseSerialForm.note"
                      type="text"
                      placeholder="例如：活動現場發放"
                    />
                  </label>

                  <label class="admin-field">
                    <span>發放對象</span>
                    <input
                      v-model="databaseSerialForm.distributedTo"
                      type="text"
                      placeholder="例如：VIP 客戶"
                    />
                  </label>

                  <label class="admin-field">
                    <span>發放管道</span>
                    <select v-model="databaseSerialForm.distributedChannel">
                      <option value="LINE">LINE</option>
                      <option value="Facebook">Facebook</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Telegram">Telegram</option>
                      <option value="現場">現場</option>
                      <option value="其他">其他</option>
                    </select>
                  </label>

                  <label class="admin-field md:col-span-2 2xl:col-span-3">
                    <span>批次貼上多組序號</span>
                    <textarea
                      v-model="databaseSerialForm.codesText"
                      rows="5"
                      placeholder="一行一組，或用逗號、空白分隔"
                    />
                  </label>
                </div>

                <div class="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                  <button
                    type="button"
                    class="rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="isSavingDatabaseSerial"
                    @click="createDatabaseSerialCode"
                  >
                    {{ databaseSerialAction === 'create' ? '新增處理中...' : '新增單組' }}
                  </button>

                  <button
                    type="button"
                    class="rounded-2xl bg-cyan-700 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="isSavingDatabaseSerial"
                    @click="bulkCreateDatabaseSerialCodes"
                  >
                    {{ databaseSerialAction === 'bulk' ? '批次處理中...' : '批次新增' }}
                  </button>

                  <button
                    type="button"
                    class="rounded-2xl bg-cyan-950 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="isSavingDatabaseSerial"
                    @click="generateDatabaseSerialCodes"
                  >
                    {{ databaseSerialAction === 'generate' ? '產生處理中...' : '自動產生' }}
                  </button>
                </div>
              </div>

              
              <div class="mt-4 rounded-3xl border border-violet-100 bg-violet-50/70 p-4">
                <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h4 class="text-sm font-black text-slate-950">
                      序號查詢與營運篩選
                    </h4>
                    <p class="mt-1 text-xs font-bold text-slate-500">
                      序號多時可用搜尋、批次、狀態快速篩選，避免一直往下滑。
                    </p>
                  </div>

                  <div class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-violet-700 ring-1 ring-violet-100"
                      @click="setDatabaseSerialQuickFilter('LIVE01')"
                    >
                      只看 LIVE01
                    </button>
                    <button
                      type="button"
                      class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-rose-700 ring-1 ring-rose-100"
                      @click="setDatabaseSerialQuickFilter('USED')"
                    >
                      只看已使用
                    </button>
                    <button
                      type="button"
                      class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-emerald-700 ring-1 ring-emerald-100"
                      @click="setDatabaseSerialQuickFilter('UNUSED')"
                    >
                      只看可使用
                    </button>
                    <button
                      type="button"
                      class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-slate-700 ring-1 ring-slate-100"
                      @click="setDatabaseSerialQuickFilter('TEST')"
                    >
                      找測試序號
                    </button>
                    <button
                      type="button"
                      class="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white"
                      @click="setDatabaseSerialQuickFilter('CLEAR')"
                    >
                      清除篩選
                    </button>
                  </div>
                </div>

                <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                  <label class="admin-field">
                    <span>搜尋序號 / 批次</span>
                    <input
                      v-model="databaseSerialSearchKeyword"
                      type="text"
                      placeholder="輸入部分序號、LIVE01、TEST..."
                    />
                  </label>

                  <label class="admin-field">
                    <span>批次篩選</span>
                    <select v-model="databaseSerialBatchFilter">
                      <option value="ALL">全部批次</option>
                      <option
                        v-for="batch in databaseSerialBatchOptions.filter((item) => item !== 'ALL')"
                        :key="batch"
                        :value="batch"
                      >
                        {{ batch }}
                      </option>
                    </select>
                  </label>

                  <label class="admin-field">
                    <span>狀態篩選</span>
                    <select v-model="databaseSerialStatusFilter">
                      <option value="ALL">全部狀態</option>
                      <option value="UNUSED">可使用</option>
                      <option value="USED">已使用</option>
                      <option value="DISABLED">已停用</option>
                    </select>
                  </label>

                  <label class="admin-field">
                    <span>發放篩選</span>
                    <select v-model="databaseSerialIssueFilter">
                      <option value="ALL">全部</option>
                      <option value="ISSUED">已發放</option>
                      <option value="UNISSUED">未發放</option>
                    </select>
                  </label>
                </div>

                <div class="mt-4 grid grid-cols-2 gap-2 md:grid-cols-5">
                  <div class="rounded-2xl bg-white/80 p-3">
                    <p class="text-[11px] font-black text-slate-400">全部序號</p>
                    <p class="text-lg font-black text-slate-950">{{ databaseSerialFilterSummary.total }}</p>
                  </div>
                  <div class="rounded-2xl bg-white/80 p-3">
                    <p class="text-[11px] font-black text-slate-400">篩選結果</p>
                    <p class="text-lg font-black text-violet-700">{{ databaseSerialFilterSummary.filtered }}</p>
                  </div>
                  <div class="rounded-2xl bg-white/80 p-3">
                    <p class="text-[11px] font-black text-slate-400">可使用</p>
                    <p class="text-lg font-black text-emerald-700">{{ databaseSerialFilterSummary.unused }}</p>
                  </div>
                  <div class="rounded-2xl bg-white/80 p-3">
                    <p class="text-[11px] font-black text-slate-400">已使用</p>
                    <p class="text-lg font-black text-rose-700">{{ databaseSerialFilterSummary.used }}</p>
                  </div>
                  <div class="rounded-2xl bg-white/80 p-3">
                    <p class="text-[11px] font-black text-slate-400">已停用</p>
                    <p class="text-lg font-black text-slate-700">{{ databaseSerialFilterSummary.disabled }}</p>
                  </div>
                </div>

                <p class="mt-3 text-xs font-bold text-slate-500">
                  目前列表最多顯示前 60 筆篩選結果；若正式資料超過上千筆，下一階段建議改成後端分頁查詢。
                </p>
              </div>


<div class="mt-4 rounded-3xl border border-cyan-100 bg-white/75 p-3">
                <div class="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    class="rounded-2xl bg-cyan-700 px-4 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="isDatabaseLoading"
                    @click="refreshDatabaseSerialCodesWithFeedback"
                  >
                    重新讀取
                  </button>

                  <button
                    type="button"
                    class="rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="!availableDatabaseSerialCodesForCopy.length"
                    @click="copyAllAvailableDatabaseSerialCodes"
                  >
                    複製全部可用 {{ availableDatabaseSerialCodesForCopy.length }} 組
                  </button>

                  <button
                    type="button"
                    class="rounded-2xl bg-violet-600 px-4 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="!filteredDatabaseSerialCodesForCopy.length"
                    @click="copyFilteredDatabaseSerialCodes"
                  >
                    複製目前篩選 {{ filteredDatabaseSerialCodesForCopy.length }} 組
                  </button>

                  <button
                    type="button"
                    class="rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="!selectedDatabaseSerialCodesForCopy.length"
                    @click="copySelectedDatabaseSerialCodes"
                  >
                    複製已選取 {{ selectedDatabaseSerialCodesForCopy.length }} 組
                  </button>

                  <button
                    type="button"
                    class="rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="!visibleDatabaseSerialCodes.length"
                    @click="isAllVisibleDatabaseSerialSelected ? clearSelectedDatabaseSerials() : selectAllVisibleDatabaseSerials()"
                  >
                    {{ isAllVisibleDatabaseSerialSelected ? '取消全選' : '全選目前顯示' }}
                  </button>

                  <button
                    type="button"
                    class="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="!selectedDatabaseSerialCount"
                    @click="clearSelectedDatabaseSerials"
                  >
                    清除選取
                  </button>

                  <button
                    type="button"
                    class="rounded-2xl bg-rose-600 px-4 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="!selectedDatabaseSerialCount || isBatchDeletingDatabaseSerials"
                    @click="batchDeleteSelectedDatabaseSerials"
                  >
                    {{ isBatchDeletingDatabaseSerials ? '批次刪除中...' : `批次刪除 ${selectedDatabaseSerialCount} 筆` }}
                  </button>

                  <span class="text-xs font-black text-slate-500">
                    已選取 {{ selectedDatabaseSerialCount }} / 目前顯示 {{ visibleDatabaseSerialCodes.length }} 筆
                  </span>
                </div>

                <p class="mt-2 text-xs font-bold text-cyan-700">
                  可先用篩選找出指定批次，再複製目前篩選結果貼到 LINE、Excel 或客服訊息；正式 LIVE01 序號請不要任意刪除。
                </p>
              </div>

              <div class="mt-4 rounded-3xl border border-cyan-100 bg-white/80 p-3 shadow-inner">
                <div class="mb-3 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <p class="text-sm font-black text-slate-900">
                    資料庫序號列表
                  </p>
                  <p class="text-xs font-bold text-cyan-700">
                    窄版畫面可左右滑動查看，避免序號資料被擠成直排。
                  </p>
                </div>

                <div class="max-h-[560px] overflow-auto pr-1">
                  <div class="min-w-[980px] space-y-2">
                    <div class="grid grid-cols-[76px_230px_120px_120px_150px_1fr_270px] gap-3 rounded-2xl bg-cyan-50 px-4 py-3 text-xs font-black text-cyan-900 ring-1 ring-cyan-100">
                      <span>選取</span>
                      <span>序號</span>
                      <span>狀態</span>
                      <span>批次</span>
                      <span>使用次數</span>
                      <span>發放 / 期限</span>
                      <span>操作</span>
                    </div>

                    <article
                      v-for="item in visibleDatabaseSerialCodes"
                      :key="item.id"
                      class="grid grid-cols-[76px_230px_120px_120px_150px_1fr_270px] items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition"
                      :class="[
                        getDatabaseSerialStatusInfo(item).cardClass,
                        selectedDatabaseSerialIdSet.has(Number(item.id)) ? 'ring-2 ring-violet-300' : ''
                      ]"
                    >
                      <label class="inline-flex cursor-pointer items-center gap-2 text-xs font-black text-slate-700">
                        <input
                          type="checkbox"
                          class="h-4 w-4 rounded border-slate-300"
                          :checked="selectedDatabaseSerialIdSet.has(Number(item.id))"
                          @change.stop="toggleDatabaseSerialSelection(item)"
                        />
                        選取
                      </label>

                      <div>
                        <p class="font-mono text-sm font-black leading-5 text-slate-950">
                          {{ item.code }}
                        </p>
                        <p class="mt-1 text-[11px] font-bold text-slate-400">
                          ID：{{ item.id }}
                        </p>
                      </div>

                      <div>
                        <span class="inline-flex rounded-full px-3 py-1 text-xs font-black" :class="getDatabaseSerialStatusInfo(item).badgeClass">
                          {{ getDatabaseSerialStatusInfo(item).label }}
                        </span>
                      </div>

                      <div>
                        <p class="text-xs font-black text-indigo-700">
                          {{ item.batchCode || '未分類' }}
                        </p>
                        <p class="mt-1 text-[11px] font-bold text-slate-400">
                          增加 {{ item.rewardChance }} 次
                        </p>
                      </div>

                      <div>
                        <p class="text-xs font-black text-cyan-700">
                          已用 {{ getDatabaseSerialUsedCount(item) }} / {{ getDatabaseSerialTotalCount(item) }} 次
                        </p>
                        <p class="mt-1 text-[11px] font-bold text-slate-400">
                          {{ item.effectiveStatus || item.status }}
                        </p>
                      </div>

                      <div>
                        <p class="text-xs font-bold text-slate-500">
                          發放：{{ item.distributedAt ? `${item.distributedChannel || '未填管道'}｜${item.distributedTo || '未填對象'}` : '未發放' }}
                        </p>
                        <p class="mt-1 text-xs font-bold text-slate-400">
                          期限：{{ item.expireAt || '永不過期' }}
                        </p>
                      </div>

                      <div class="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          class="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 ring-1 ring-emerald-100"
                          @click="copyDatabaseSerialCode(item)"
                        >
                          複製序號
                        </button>

                        <button
                          type="button"
                          class="rounded-xl bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-700 ring-1 ring-cyan-100"
                          @click="distributeDatabaseSerialCode(item)"
                        >
                          標記發放
                        </button>

                        <button
                          type="button"
                          class="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700"
                          @click="toggleDatabaseSerialStatus(item)"
                        >
                          {{ item.status === 'DISABLED' ? '啟用' : '停用' }}
                        </button>

                        <button
                          type="button"
                          class="rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 ring-1 ring-rose-100"
                          @click="removeDatabaseSerialCode(item)"
                        >
                          刪除
                        </button>
                      </div>
                    </article>
                  </div>
                </div>
              </div>

            </div>
          </div>
          <div
            v-if="databaseCampaign && databaseSectionOpen.records"
            class="rounded-3xl border border-violet-100 bg-violet-50 p-5"
          >
            <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 class="text-base font-black text-violet-900">
                  資料庫遊玩紀錄 / 中獎紀錄
                </h3>
                <p class="mt-1 text-xs font-bold text-violet-700/80">
                  讀取 PostgreSQL 正式遊玩紀錄與中獎紀錄，可核銷、取消發獎、匯出 CSV。
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-violet-700 ring-1 ring-violet-100"
                  @click="refreshDatabaseRecords"
                >
                  重新讀取紀錄
                </button>

                <button
                  type="button"
                  class="rounded-2xl bg-violet-600 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5"
                  @click="exportDatabasePlayRecordsCsv"
                >
                  匯出遊玩 CSV
                </button>

                <button
                  type="button"
                  class="rounded-2xl bg-fuchsia-600 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5"
                  @click="exportDatabaseRewardRecordsCsv"
                >
                  匯出中獎 CSV
                </button>
              </div>
            </div>

            <div class="mt-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-violet-100">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 class="text-sm font-black text-slate-900">
                    紀錄搜尋與篩選
                  </h4>
                  <p class="mt-1 text-xs font-bold text-slate-500">
                    可依玩家、手機、序號、獎項、發獎狀態與時間範圍快速找資料。
                  </p>
                </div>

                <button
                  type="button"
                  class="rounded-2xl px-4 py-2 text-xs font-black shadow-sm ring-1 transition disabled:cursor-not-allowed disabled:opacity-40"
                  :class="databaseRecordHasActiveFilters ? 'bg-violet-600 text-white ring-violet-500 hover:-translate-y-0.5' : 'bg-slate-50 text-slate-400 ring-slate-100'"
                  :disabled="!databaseRecordHasActiveFilters"
                  @click="resetDatabaseRecordFilters"
                >
                  清除篩選
                </button>
              </div>

              <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
                <label class="admin-field xl:col-span-2">
                  <span>搜尋紀錄</span>
                  <input
                    v-model="databaseRecordKeyword"
                    type="text"
                    placeholder="搜尋玩家、手機、Email、獎項、序號、核銷碼"
                  />
                </label>

                <label class="admin-field">
                  <span>遊玩結果</span>
                  <select v-model="databaseRecordWinFilter">
                    <option value="all">全部遊玩</option>
                    <option value="win">只看中獎</option>
                    <option value="lose">只看未中獎</option>
                  </select>
                </label>

                <label class="admin-field">
                  <span>發獎狀態</span>
                  <select v-model="databaseRewardStatusFilter">
                    <option value="all">全部狀態</option>
                    <option value="PENDING">待核銷</option>
                    <option value="ISSUED">已發獎</option>
                    <option value="CANCELLED">已取消</option>
                  </select>
                </label>

                <label class="admin-field">
                  <span>獎項名稱</span>
                  <select v-model="databaseRecordPrizeFilter">
                    <option value="all">全部獎項</option>
                    <option
                      v-for="title in databaseRecordPrizeOptions"
                      :key="`record-prize-${title}`"
                      :value="title"
                    >
                      {{ title }}
                    </option>
                  </select>
                </label>

                <label class="admin-field">
                  <span>時間範圍</span>
                  <select v-model="databaseRecordDateFilter">
                    <option value="all">全部時間</option>
                    <option value="today">今天</option>
                    <option value="7days">近 7 天</option>
                    <option value="30days">近 30 天</option>
                  </select>
                </label>

                <div class="flex flex-col justify-end rounded-3xl bg-white p-3 ring-1 ring-violet-100">
                  <span class="mb-2 text-xs font-black text-slate-500">篩選操作</span>
                  <button
                    type="button"
                    class="rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-700"
                    @click="resetDatabaseRecordFilters"
                  >
                    清除篩選
                  </button>
                </div>
              </div>

              <div class="mt-4 rounded-2xl bg-violet-50/70 p-3 text-xs font-black text-violet-700">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="rounded-full bg-white px-3 py-1 ring-1 ring-violet-100">
                    遊玩符合 {{ filteredDatabasePlayRecords.length }} / {{ databasePlayRecords.length }} 筆
                  </span>
                  <span class="rounded-full bg-white px-3 py-1 ring-1 ring-violet-100">
                    發獎符合 {{ filteredDatabaseRewardRecords.length }} / {{ databaseRewardRecords.length }} 筆
                  </span>
                  <span
                    v-if="!databaseRecordHasActiveFilters"
                    class="rounded-full bg-white px-3 py-1 text-slate-500 ring-1 ring-slate-100"
                  >
                    目前未套用篩選
                  </span>
                  <span
                    v-for="chip in databaseRecordFilterSummary"
                    :key="chip"
                    class="rounded-full bg-white px-3 py-1 ring-1 ring-violet-100"
                  >
                    {{ chip }}
                  </span>
                </div>
              </div>

              <div class="mt-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-violet-100">
                <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h4 class="text-sm font-black text-slate-900">
                      匯出目前篩選結果
                    </h4>
                    <p class="mt-1 text-xs font-bold leading-5 text-slate-500">
                      匯出會依照上方搜尋 / 篩選條件產生 CSV，檔名會自動加上今天日期。
                    </p>
                  </div>

                  <div class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                      :disabled="!filteredDatabasePlayRecords.length"
                      @click="exportDatabasePlayRecordsCsv"
                    >
                      匯出遊玩 {{ filteredDatabasePlayRecords.length }} 筆
                    </button>

                    <button
                      type="button"
                      class="rounded-2xl bg-fuchsia-600 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                      :disabled="!filteredDatabaseRewardRecords.length"
                      @click="exportDatabaseRewardRecordsCsv"
                    >
                      匯出中獎 {{ filteredDatabaseRewardRecords.length }} 筆
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-4 space-y-4">
              
                <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div class="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-violet-100">
                    <p class="text-xs font-black text-slate-400">遊玩總數</p>
                    <p class="mt-1 text-2xl font-black text-slate-950">
                      {{ databaseRecordStats.playTotal }}
                    </p>
                  </div>

                  <div class="rounded-3xl bg-emerald-50 p-4 shadow-sm ring-1 ring-emerald-100">
                    <p class="text-xs font-black text-emerald-600">中獎</p>
                    <p class="mt-1 text-2xl font-black text-emerald-700">
                      {{ databaseRecordStats.playWon }}
                    </p>
                  </div>

                  <div class="rounded-3xl bg-slate-50 p-4 shadow-sm ring-1 ring-slate-100">
                    <p class="text-xs font-black text-slate-500">未中獎</p>
                    <p class="mt-1 text-2xl font-black text-slate-700">
                      {{ databaseRecordStats.playLose }}
                    </p>
                  </div>

                  <div class="rounded-3xl bg-amber-50 p-4 shadow-sm ring-1 ring-amber-100">
                    <p class="text-xs font-black text-amber-600">待發獎</p>
                    <p class="mt-1 text-2xl font-black text-amber-700">
                      {{ databaseRecordStats.rewardPending }}
                    </p>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div class="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-violet-100">
                    <p class="text-xs font-black text-slate-400">發獎紀錄</p>
                    <p class="mt-1 text-2xl font-black text-slate-950">
                      {{ databaseRecordStats.rewardTotal }}
                    </p>
                  </div>

                  <div class="rounded-3xl bg-sky-50 p-4 shadow-sm ring-1 ring-sky-100">
                    <p class="text-xs font-black text-sky-600">已發獎</p>
                    <p class="mt-1 text-2xl font-black text-sky-700">
                      {{ databaseRecordStats.rewardIssued }}
                    </p>
                  </div>

                  <div class="rounded-3xl bg-rose-50 p-4 shadow-sm ring-1 ring-rose-100">
                    <p class="text-xs font-black text-rose-600">已取消</p>
                    <p class="mt-1 text-2xl font-black text-rose-700">
                      {{ databaseRecordStats.rewardCancelled }}
                    </p>
                  </div>

                  <div class="rounded-3xl bg-violet-50 p-4 shadow-sm ring-1 ring-violet-100">
                    <p class="text-xs font-black text-violet-600">目前篩選</p>
                    <p class="mt-1 text-sm font-black leading-6 text-violet-700">
                      遊玩 {{ displayedDatabasePlayRecords.length }} 筆<br />
                      發獎 {{ displayedDatabaseRewardRecords.length }} 筆
                    </p>
                  </div>
                </div>

<div class="rounded-3xl bg-white/80 p-4">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <h4 class="text-sm font-black text-slate-900">
                    遊玩紀錄
                  </h4>

                  <div class="flex flex-wrap items-center gap-2">
                    <span class="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">
                      {{ filteredDatabasePlayRecords.length }} 筆
                    </span>

                    <select
                      v-model.number="databaseRecordDisplayLimit.plays"
                      class="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 outline-none transition focus:border-violet-400"
                    >
                      <option
                        v-for="option in databaseRecordLimitOptions"
                        :key="`plays-${option.value}`"
                        :value="option.value"
                      >
                        {{ option.label }}
                      </option>
                    </select>

                    <button
                      type="button"
                      class="rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5"
                      @click="toggleDatabaseRecordTable('plays')"
                    >
                      {{ databaseRecordTableOpen.plays ? '收合' : '展開' }}
                    </button>
                  </div>
                </div>

                <div
                  v-if="!databaseRecordTableOpen.plays"
                  class="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-500"
                >
                  目前已收合「遊玩紀錄」。可先選擇顯示筆數，再點右上方「展開」查看。
                
                  <div class="mt-2 text-xs font-black text-violet-600">
                    目前顯示：{{ displayedDatabasePlayRecords.length }} / {{ filteredDatabasePlayRecords.length }} 筆
                  </div>
</div>

                <div
                  v-else
                  class="mt-3 overflow-x-auto rounded-2xl border border-slate-100 bg-white"
                >
                  <table class="min-w-[980px] w-full text-left text-xs">
                    <thead class="bg-slate-50 text-slate-500">
                      <tr>
                        <th class="px-4 py-3 font-black">結果</th>
                        <th class="px-4 py-3 font-black">獎項</th>
                        <th class="px-4 py-3 font-black">玩家</th>
                        <th class="px-4 py-3 font-black">序號</th>
                        <th class="px-4 py-3 font-black">遊戲</th>
                        <th class="px-4 py-3 font-black">時間</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      <tr
                        v-for="item in displayedDatabasePlayRecords"
                        :key="item.id"
                        class="align-top hover:bg-slate-50"
                      >
                        <td class="px-4 py-3">
                          <span
                            class="rounded-full px-3 py-1 text-xs font-black"
                            :class="item.isWin ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'"
                          >
                            {{ item.isWin ? '中獎' : '未中獎' }}
                          </span>
                        </td>
                        <td class="px-4 py-3 font-black text-slate-900">
                          {{ item.prize?.title || '未記錄獎項' }}
                        </td>
                        <td class="px-4 py-3 text-slate-600">
                          {{ item.playerName || item.playerPhone || item.playerEmail || '匿名玩家' }}
                        </td>
                        <td class="px-4 py-3">
                          <code class="font-mono text-[11px] font-black text-violet-700">
                            {{ item.serialCode?.code || '未綁定' }}
                          </code>
                        </td>
                        <td class="px-4 py-3 font-bold text-slate-500">
                          {{ item.gameType }}
                        </td>
                        <td class="px-4 py-3 font-bold text-slate-500">
                          {{ formatDatabaseDateTime(item.playedAt) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <p
                    v-if="!displayedDatabasePlayRecords.length"
                    class="px-4 py-8 text-center text-sm font-bold text-slate-500"
                  >
                    目前沒有符合條件的遊玩紀錄。
                  </p>
                </div>
              </div>

              <div class="rounded-3xl bg-white/80 p-4">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <h4 class="text-sm font-black text-slate-900">
                    中獎 / 發獎紀錄
                  </h4>

                  <div class="flex flex-wrap items-center gap-2">
                    <span class="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">
                      {{ filteredDatabaseRewardRecords.length }} 筆
                    </span>

                    <select
                      v-model.number="databaseRecordDisplayLimit.rewards"
                      class="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 outline-none transition focus:border-violet-400"
                    >
                      <option
                        v-for="option in databaseRecordLimitOptions"
                        :key="`rewards-${option.value}`"
                        :value="option.value"
                      >
                        {{ option.label }}
                      </option>
                    </select>

                    <button
                      type="button"
                      class="rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5"
                      @click="toggleDatabaseRecordTable('rewards')"
                    >
                      {{ databaseRecordTableOpen.rewards ? '收合' : '展開' }}
                    </button>
                  </div>
                </div>

                <div
                  v-if="!databaseRecordTableOpen.rewards"
                  class="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-500"
                >
                  目前已收合「中獎 / 發獎紀錄」。可先選擇顯示筆數，再點右上方「展開」查看。
                
                  <div class="mt-2 text-xs font-black text-violet-600">
                    目前顯示：{{ displayedDatabaseRewardRecords.length }} / {{ filteredDatabaseRewardRecords.length }} 筆
                  </div>
</div>

                <div
                  v-else
                  class="mt-3 overflow-x-auto rounded-2xl border border-slate-100 bg-white"
                >
                  <table class="min-w-[1040px] w-full text-left text-xs">
                    <thead class="bg-slate-50 text-slate-500">
                      <tr>
                        <th class="px-4 py-3 font-black">狀態</th>
                        <th class="px-4 py-3 font-black">獎項</th>
                        <th class="px-4 py-3 font-black">得獎者</th>
                        <th class="px-4 py-3 font-black">核銷碼</th>
                        <th class="px-4 py-3 font-black">建立時間</th>
                        <th class="px-4 py-3 font-black">操作</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      <tr
                        v-for="item in displayedDatabaseRewardRecords"
                        :key="item.id"
                        class="align-top hover:bg-slate-50"
                      >
                        <td class="px-4 py-3">
                          <span
                            class="rounded-full px-3 py-1 text-xs font-black"
                            :class="item.status === 'CLAIMED' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : item.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-100'"
                          >
                            {{ item.status }}
                          </span>
                        </td>
                        <td class="px-4 py-3 font-black text-slate-900">
                          {{ item.prize?.title || '未記錄獎項' }}
                        </td>
                        <td class="px-4 py-3 text-slate-600">
                          {{ item.winnerName || item.winnerPhone || item.winnerEmail || '匿名玩家' }}
                        </td>
                        <td class="px-4 py-3">
                          <code class="font-mono text-[11px] font-black text-violet-700">
                            {{ item.claimCode || '未建立' }}
                          </code>
                        </td>
                        <td class="px-4 py-3 font-bold text-slate-500">
                          {{ formatDatabaseDateTime(item.createdAt) }}
                        </td>
                        <td class="px-4 py-3">
                          <div class="flex flex-wrap gap-2">
                            <button
                              type="button"
                              class="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 ring-1 ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                              :disabled="isDatabaseRewardIssuedStatus(item)"
                              @click="claimDatabaseRewardRecord(item)"
                            >
                              核銷
                            </button>

                            <button
                              type="button"
                              class="rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 ring-1 ring-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                              :disabled="item.status === 'CANCELLED'"
                              @click="cancelDatabaseRewardRecord(item)"
                            >
                              取消
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <p
                    v-if="!displayedDatabaseRewardRecords.length"
                    class="px-4 py-8 text-center text-sm font-bold text-slate-500"
                  >
                    目前沒有符合條件的中獎紀錄。
                  </p>
                </div>
              </div>
            </div>
          </div>

        </section>

        <section
          v-if="activeSection === 'basic'"
          class="space-y-4"
        >
          <div class="rounded-3xl bg-slate-50 p-4">
            <h2 class="text-lg font-black text-slate-900">
              基本文字設定
            </h2>
            <p class="mt-1 text-sm text-slate-500">
              修改前台上方品牌、主標題、副標題與提示文案。
            </p>
          </div>

          <label class="admin-field">
            <span>品牌名稱</span>
            <input v-model="campaign.brandName" type="text" />
          </label>

          <label class="admin-field">
            <span>頁面名稱</span>
            <input v-model="campaign.pageTitle" type="text" />
          </label>

          <label class="admin-field">
            <span>主標題</span>
            <input v-model="campaign.mainTitle" type="text" />
          </label>

          <label class="admin-field">
            <span>副標題</span>
            <input v-model="campaign.subTitle" type="text" />
          </label>

          <label class="admin-field">
            <span>標語文字</span>
            <input v-model="campaign.heroTagline" type="text" />
          </label>

          <label class="admin-field">
            <span>左上 LOGO 文字</span>
            <input v-model="campaign.logoText" type="text" />
          </label>

          <label class="admin-field">
            <span>右上網站按鈕文字</span>
            <input v-model="campaign.websiteButtonText" type="text" placeholder="例如：官網、LINE、預約" />
          </label>

          <label class="admin-field">
            <span>右上網站連結網址</span>
            <input v-model="campaign.websiteUrl" type="text" placeholder="例如：https://example.com" />
          </label>

          <label class="admin-field">
            <span>分享按鈕文字</span>
            <input v-model="campaign.buttonText" type="text" />
          </label>

          <div class="rounded-3xl border border-yellow-100 bg-yellow-50 p-4">
            <h3 class="text-base font-black text-yellow-800">
              頂部中間文字樣式
            </h3>
            <p class="mt-1 text-xs font-bold leading-5 text-yellow-700/80">
              這裡控制前台手機預覽最上方中間標題的文字大小與顏色。
            </p>

            <label class="admin-field mt-4">
              <span>頁面名稱文字大小：{{ campaign.headerTitleTextSize }}px</span>
              <input
                v-model.number="campaign.headerTitleTextSize"
                type="range"
                min="12"
                max="26"
              />
            </label>

            <div class="mt-4 grid grid-cols-2 gap-3">
              <label class="admin-color-field">
                <span>頁面名稱顏色</span>
                <input v-model="campaign.headerTitleColor" type="color" />
              </label>

              <label class="admin-color-field">
                <span>品牌名稱顏色</span>
                <input v-model="campaign.headerSubTitleColor" type="color" />
              </label>
            </div>
          </div>

          <div class="rounded-3xl border border-red-100 bg-red-50 p-4">
            <h3 class="text-base font-black text-red-800">
              左上 LOGO 按鈕樣式
            </h3>
            <p class="mt-1 text-xs font-bold leading-5 text-red-700/80">
              控制前台左上黃色 LOGO 區塊的文字大小、背景色與文字色。
            </p>

            <label class="admin-field mt-4">
              <span>LOGO 文字大小：{{ campaign.headerLogoTextSize }}px</span>
              <input
                v-model.number="campaign.headerLogoTextSize"
                type="range"
                min="10"
                max="22"
              />
            </label>

            <div class="mt-4 grid grid-cols-2 gap-3">
              <label class="admin-color-field">
                <span>LOGO 背景色</span>
                <input v-model="campaign.headerLogoBgColor" type="color" />
              </label>

              <label class="admin-color-field">
                <span>LOGO 文字色</span>
                <input v-model="campaign.headerLogoTextColor" type="color" />
              </label>
            </div>
          </div>

          <div class="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <h3 class="text-base font-black text-slate-900">
              右上網站按鈕樣式
            </h3>
            <p class="mt-1 text-xs font-bold leading-5 text-slate-500">
              控制前台右上官網 / LINE / 預約按鈕的文字大小、背景色與文字色。
            </p>

            <label class="admin-field mt-4">
              <span>網站按鈕文字大小：{{ campaign.headerWebsiteTextSize }}px</span>
              <input
                v-model.number="campaign.headerWebsiteTextSize"
                type="range"
                min="10"
                max="22"
              />
            </label>

            <div class="mt-4 grid grid-cols-2 gap-3">
              <label class="admin-color-field">
                <span>網站按鈕背景色</span>
                <input v-model="campaign.headerWebsiteBgColor" type="color" />
              </label>

              <label class="admin-color-field">
                <span>網站按鈕文字色</span>
                <input v-model="campaign.headerWebsiteTextColor" type="color" />
              </label>
            </div>
          </div>

          <div class="rounded-3xl border border-indigo-100 bg-indigo-50 p-4">
            <h3 class="text-base font-black text-indigo-900">
              頂部三區塊尺寸與間距
            </h3>
            <p class="mt-1 text-xs font-bold leading-5 text-indigo-700/80">
              控制前台最上方左、中、右三個紅框區域的寬度、高度、圓角與間距。
            </p>

            <div class="mt-4 space-y-4">
              <label class="admin-field">
                <span>左右按鈕寬度：{{ campaign.headerSideBoxWidth }}px</span>
                <input
                  v-model.number="campaign.headerSideBoxWidth"
                  type="range"
                  min="56"
                  max="112"
                />
              </label>

              <label class="admin-field">
                <span>三區塊高度：{{ campaign.headerBoxHeight }}px</span>
                <input
                  v-model.number="campaign.headerBoxHeight"
                  type="range"
                  min="38"
                  max="72"
                />
              </label>

              <label class="admin-field">
                <span>區塊圓角：{{ campaign.headerBoxRadius }}px</span>
                <input
                  v-model.number="campaign.headerBoxRadius"
                  type="range"
                  min="8"
                  max="28"
                />
              </label>

              <label class="admin-field">
                <span>左右間距：{{ campaign.headerGap }}px</span>
                <input
                  v-model.number="campaign.headerGap"
                  type="range"
                  min="6"
                  max="24"
                />
              </label>

              <div class="grid grid-cols-2 gap-3">
                <label class="admin-field">
                  <span>外框左右內距：{{ campaign.headerPaddingX }}px</span>
                  <input
                    v-model.number="campaign.headerPaddingX"
                    type="range"
                    min="8"
                    max="28"
                  />
                </label>

                <label class="admin-field">
                  <span>外框上下內距：{{ campaign.headerPaddingY }}px</span>
                  <input
                    v-model.number="campaign.headerPaddingY"
                    type="range"
                    min="6"
                    max="22"
                  />
                </label>
              </div>
            </div>
          </div>
        </section>

        <section
          v-if="activeSection === 'theme'"
          class="space-y-4"
        >
          <div class="rounded-3xl bg-slate-50 p-4">
            <h2 class="text-lg font-black text-slate-900">
              主題色彩設定
            </h2>
            <p class="mt-1 text-sm text-slate-500">
              可以直接修改前台紅金活動頁的背景、按鈕與強調色。
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <label class="admin-color-field">
              <span>背景上方</span>
              <input v-model="campaign.themeBgFrom" type="color" />
            </label>

            <label class="admin-color-field">
              <span>背景中間</span>
              <input v-model="campaign.themeBgMiddle" type="color" />
            </label>

            <label class="admin-color-field">
              <span>背景下方</span>
              <input v-model="campaign.themeBgTo" type="color" />
            </label>

            <label class="admin-color-field">
              <span>金色強調</span>
              <input v-model="campaign.themeAccentColor" type="color" />
            </label>

            <label class="admin-color-field">
              <span>按鈕色</span>
              <input v-model="campaign.themeButtonColor" type="color" />
            </label>

            <label class="admin-color-field">
              <span>按鈕深色</span>
              <input v-model="campaign.themeButtonDarkColor" type="color" />
            </label>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              class="rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white"
              @click="Object.assign(campaign, { themeBgFrom: '#991b1b', themeBgMiddle: '#dc2626', themeBgTo: '#450a0a', themeAccentColor: '#facc15', themeButtonColor: '#ef4444', themeButtonDarkColor: '#991b1b' })"
            >
              經典紅金
            </button>

            <button
              type="button"
              class="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white"
              @click="Object.assign(campaign, { themeBgFrom: '#111827', themeBgMiddle: '#7c2d12', themeBgTo: '#020617', themeAccentColor: '#facc15', themeButtonColor: '#f59e0b', themeButtonDarkColor: '#78350f' })"
            >
              VIP 黑金
            </button>
          </div>
        </section>

        <section
          v-if="activeSection === 'activityTime'"
          class="space-y-4"
        >
          <div class="rounded-3xl bg-slate-50 p-4">
            <h2 class="text-lg font-black text-slate-900">
              活動開始與結束時間
            </h2>
            <p class="mt-1 text-sm leading-6 text-slate-500">
              控制前台活動是否可玩。未開始或已結束時，玩家不能砸蛋，也不能兌換序號。
            </p>
          </div>

          <div class="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
            <h3 class="text-base font-black text-emerald-800">
              活動期間
            </h3>

            <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <label class="admin-field">
                <span>活動開始時間</span>
                <input
                  v-model="campaign.activityStartAt"
                  type="datetime-local"
                />
              </label>

              <label class="admin-field">
                <span>活動結束時間</span>
                <input
                  v-model="campaign.activityEndAt"
                  type="datetime-local"
                />
              </label>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4">
              <button
                type="button"
                class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-emerald-700 ring-1 ring-emerald-100"
                @click="campaign.activityStartAt = ''; campaign.activityEndAt = ''"
              >
                不限制期間
              </button>

              <button
                type="button"
                class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-emerald-700 ring-1 ring-emerald-100"
                @click="campaign.activityStartAt = new Date().toISOString().slice(0, 16)"
              >
                立即開始
              </button>

              <button
                type="button"
                class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-emerald-700 ring-1 ring-emerald-100"
                @click="(() => { const d = new Date(); d.setDate(d.getDate() + 7); d.setHours(23, 59, 0, 0); campaign.activityEndAt = d.toISOString().slice(0, 16) })()"
              >
                結束設 7 天後
              </button>

              <button
                type="button"
                class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-emerald-700 ring-1 ring-emerald-100"
                @click="(() => { const d = new Date(); d.setDate(d.getDate() + 30); d.setHours(23, 59, 0, 0); campaign.activityEndAt = d.toISOString().slice(0, 16) })()"
              >
                結束設 30 天後
              </button>
            </div>
          </div>

          <div class="rounded-3xl border border-yellow-100 bg-yellow-50 p-4">
            <h3 class="text-base font-black text-yellow-800">
              前台狀態文字
            </h3>

            <div class="mt-4 space-y-4">
              <label class="admin-toggle">
                <input v-model="campaign.showActivityTimeSection" type="checkbox" />
                <span>前台顯示活動時間區塊</span>
              </label>

              <label class="admin-field">
                <span>活動進行中文字</span>
                <input v-model="campaign.activityRunningText" type="text" />
              </label>

              <label class="admin-field">
                <span>尚未開始文字</span>
                <input v-model="campaign.activityNotStartedText" type="text" />
              </label>

              <label class="admin-field">
                <span>活動結束文字</span>
                <input v-model="campaign.activityEndedText" type="text" />
              </label>
            </div>
          </div>

          <div class="rounded-3xl border border-orange-100 bg-orange-50 p-4">
            <h3 class="text-base font-black text-orange-800">
              前台活動時間區塊樣式
            </h3>
            <p class="mt-1 text-xs font-bold leading-5 text-orange-700/80">
              控制前台「活動時間」那一塊的背景、文字、時間卡片與狀態標籤大小。
            </p>

            <div class="mt-4 grid grid-cols-2 gap-3">
              <label class="admin-color-field">
                <span>區塊背景色</span>
                <input v-model="campaign.activityTimeBgColor" type="color" />
              </label>

              <label class="admin-color-field">
                <span>區塊邊框色</span>
                <input v-model="campaign.activityTimeBorderColor" type="color" />
              </label>

              <label class="admin-color-field">
                <span>標題文字色</span>
                <input v-model="campaign.activityTimeTitleColor" type="color" />
              </label>

              <label class="admin-color-field">
                <span>時間卡片背景</span>
                <input v-model="campaign.activityTimeCardBgColor" type="color" />
              </label>

              <label class="admin-color-field">
                <span>時間文字色</span>
                <input v-model="campaign.activityTimeTextColor" type="color" />
              </label>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-3">
              <label class="admin-field">
                <span>區塊圓角：{{ campaign.activityTimeRadius }}px</span>
                <input
                  v-model.number="campaign.activityTimeRadius"
                  type="range"
                  min="10"
                  max="30"
                />
              </label>

              <label class="admin-field">
                <span>區塊內距：{{ campaign.activityTimePadding }}px</span>
                <input
                  v-model.number="campaign.activityTimePadding"
                  type="range"
                  min="8"
                  max="24"
                />
              </label>

              <label class="admin-field">
                <span>標題文字大小：{{ campaign.activityTimeTitleTextSize }}px</span>
                <input
                  v-model.number="campaign.activityTimeTitleTextSize"
                  type="range"
                  min="10"
                  max="20"
                />
              </label>

              <label class="admin-field">
                <span>時間文字大小：{{ campaign.activityTimeTextSize }}px</span>
                <input
                  v-model.number="campaign.activityTimeTextSize"
                  type="range"
                  min="10"
                  max="18"
                />
              </label>

              <label class="admin-field">
                <span>狀態標籤文字：{{ campaign.activityStatusBadgeTextSize }}px</span>
                <input
                  v-model.number="campaign.activityStatusBadgeTextSize"
                  type="range"
                  min="9"
                  max="18"
                />
              </label>
            </div>
          </div>

          <div class="rounded-3xl border border-red-100 bg-red-50 p-4">
            <h3 class="text-base font-black text-red-800">
              前台活動倒數
            </h3>
            <p class="mt-1 text-xs font-bold leading-5 text-red-700/80">
              活動尚未開始時會倒數到開始時間；活動進行中會倒數到結束時間。
            </p>

            <div class="mt-4 space-y-4">
              <label class="admin-toggle">
                <input v-model="campaign.showActivityCountdown" type="checkbox" />
                <span>顯示活動倒數</span>
              </label>

              <label class="admin-toggle">
                <input v-model="campaign.activityCountdownAlwaysShowSeconds" type="checkbox" />
                <span>超過 1 天也顯示秒數，每秒即時跳動</span>
              </label>

              <label class="admin-field">
                <span>倒數標題</span>
                <input v-model="campaign.activityCountdownTitle" type="text" />
              </label>

              <div class="grid grid-cols-2 gap-3">
                <label class="admin-color-field">
                  <span>倒數背景色</span>
                  <input v-model="campaign.activityCountdownBgColor" type="color" />
                </label>

                <label class="admin-color-field">
                  <span>倒數文字色</span>
                  <input v-model="campaign.activityCountdownTextColor" type="color" />
                </label>

                <label class="admin-color-field">
                  <span>倒數數字色</span>
                  <input v-model="campaign.activityCountdownNumberColor" type="color" />
                </label>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <label class="admin-field">
                  <span>倒數標題大小：{{ campaign.activityCountdownTitleTextSize }}px</span>
                  <input
                    v-model.number="campaign.activityCountdownTitleTextSize"
                    type="range"
                    min="10"
                    max="20"
                  />
                </label>

                <label class="admin-field">
                  <span>倒數數字大小：{{ campaign.activityCountdownNumberTextSize }}px</span>
                  <input
                    v-model.number="campaign.activityCountdownNumberTextSize"
                    type="range"
                    min="14"
                    max="34"
                  />
                </label>
              </div>
            </div>
          </div>
        </section>

        <section
          v-if="activeSection === 'background'"
          class="space-y-4"
        >
          <div class="rounded-3xl bg-slate-50 p-4">
            <h2 class="text-lg font-black text-slate-900">
              背景與金蛋舞台
            </h2>
            <p class="mt-1 text-sm leading-6 text-slate-500">
              控制前台整體紅金背景、光暈、點點紋理，以及 9 顆金蛋外框舞台的透明度、圓角與間距。
            </p>
          </div>

          <div class="rounded-3xl border border-red-100 bg-red-50 p-4">
            <h3 class="text-base font-black text-red-800">
              整體頁面背景
            </h3>

            <div class="mt-4 grid grid-cols-2 gap-3">
              <label class="admin-color-field">
                <span>背景上方</span>
                <input v-model="campaign.themeBgFrom" type="color" />
              </label>

              <label class="admin-color-field">
                <span>背景中間</span>
                <input v-model="campaign.themeBgMiddle" type="color" />
              </label>

              <label class="admin-color-field">
                <span>背景下方</span>
                <input v-model="campaign.themeBgTo" type="color" />
              </label>

              <label class="admin-color-field">
                <span>舞台邊框色</span>
                <input v-model="campaign.stageBorderColor" type="color" />
              </label>
            </div>

            <div class="mt-4 space-y-4">
              <label class="admin-field">
                <span>背景點點紋理透明度：{{ campaign.pageDotOpacity }}%</span>
                <input
                  v-model.number="campaign.pageDotOpacity"
                  type="range"
                  min="0"
                  max="100"
                />
              </label>

              <label class="admin-field">
                <span>背景金色光暈強度：{{ campaign.pageGlowOpacity }}%</span>
                <input
                  v-model.number="campaign.pageGlowOpacity"
                  type="range"
                  min="0"
                  max="100"
                />
              </label>
            </div>
          </div>

          <div class="rounded-3xl border border-yellow-100 bg-yellow-50 p-4">
            <h3 class="text-base font-black text-yellow-800">
              金蛋舞台外框
            </h3>

            <div class="mt-4 space-y-4">
              <label class="admin-field">
                <span>舞台背景透明度：{{ campaign.stageBgOpacity }}%</span>
                <input
                  v-model.number="campaign.stageBgOpacity"
                  type="range"
                  min="0"
                  max="100"
                />
              </label>

              <label class="admin-field">
                <span>舞台邊框透明度：{{ campaign.stageBorderOpacity }}%</span>
                <input
                  v-model.number="campaign.stageBorderOpacity"
                  type="range"
                  min="0"
                  max="100"
                />
              </label>

              <label class="admin-field">
                <span>舞台內框虛線透明度：{{ campaign.stageInnerBorderOpacity }}%</span>
                <input
                  v-model.number="campaign.stageInnerBorderOpacity"
                  type="range"
                  min="0"
                  max="100"
                />
              </label>

              <div class="grid grid-cols-2 gap-3">
                <label class="admin-field">
                  <span>舞台圓角：{{ campaign.stageRadius }}px</span>
                  <input
                    v-model.number="campaign.stageRadius"
                    type="range"
                    min="16"
                    max="48"
                  />
                </label>

                <label class="admin-field">
                  <span>舞台內距：{{ campaign.stagePadding }}px</span>
                  <input
                    v-model.number="campaign.stagePadding"
                    type="range"
                    min="10"
                    max="28"
                  />
                </label>
              </div>
            </div>
          </div>
        </section>

        <section
          v-if="activeSection === 'eggStyle'"
          class="space-y-4"
        >
          <div class="rounded-3xl bg-slate-50 p-4">
            <h2 class="text-lg font-black text-slate-900">
              9 顆金蛋樣式
            </h2>
            <p class="mt-1 text-sm leading-6 text-slate-500">
              調整前台九宮格金蛋大小、間距、顏色與編號顯示，方便做成更像活動海報的版型。
            </p>
          </div>

          <div class="rounded-3xl border border-yellow-100 bg-yellow-50 p-4">
            <h3 class="text-base font-black text-yellow-800">
              金蛋尺寸與排列
            </h3>

            <div class="mt-4 space-y-4">
              <label class="admin-field">
                <span>金蛋大小：{{ campaign.eggSize }}px</span>
                <input
                  v-model.number="campaign.eggSize"
                  type="range"
                  min="48"
                  max="120"
                />
              </label>

              <label class="admin-field">
                <span>卡牌安全寬度：{{ campaign.eggCardSize }}px</span>
                <input
                  v-model.number="campaign.eggCardSize"
                  type="range"
                  min="96"
                  max="160"
                />
                <small class="text-xs font-bold text-yellow-700">
                  卡牌會固定在框框內，不會硬撐超出預覽區。
                </small>
              </label>

              <label class="admin-field">
                <span>金蛋間距：{{ campaign.eggGridGap }}px</span>
                <input
                  v-model.number="campaign.eggGridGap"
                  type="range"
                  min="6"
                  max="24"
                />
              </label>

              <label class="admin-toggle">
                <input v-model="campaign.showEggNumber" type="checkbox" />
                <span>顯示金蛋編號</span>
              </label>
            </div>
          </div>

          <div class="rounded-3xl border border-amber-100 bg-amber-50 p-4">
            <h3 class="text-base font-black text-amber-800">
              金蛋顏色
            </h3>
            <p class="mt-1 text-xs font-bold leading-5 text-amber-700/80">
              可調整金蛋上方亮色、中間金色、底部深色，做出不同金蛋質感。
            </p>

            <div class="mt-4 grid grid-cols-3 gap-3">
              <label class="admin-color-field">
                <span>金蛋亮色</span>
                <input v-model="campaign.eggColorTop" type="color" />
              </label>

              <label class="admin-color-field">
                <span>金蛋主色</span>
                <input v-model="campaign.eggColorMiddle" type="color" />
              </label>

              <label class="admin-color-field">
                <span>金蛋暗色</span>
                <input v-model="campaign.eggColorBottom" type="color" />
              </label>
            </div>
          </div>

          <div class="rounded-3xl border border-red-100 bg-red-50 p-4">
            <h3 class="text-base font-black text-red-800">
              每顆金蛋底板顏色
            </h3>

            <div class="mt-4 grid grid-cols-2 gap-3">
              <label class="admin-color-field">
                <span>底板上方色</span>
                <input v-model="campaign.eggCardBgFrom" type="color" />
              </label>

              <label class="admin-color-field">
                <span>底板下方色</span>
                <input v-model="campaign.eggCardBgTo" type="color" />
              </label>
            </div>
          </div>

          <div class="rounded-3xl border border-slate-200 bg-white p-4">
            <h3 class="text-base font-black text-slate-900">
              金蛋編號樣式
            </h3>

            <div class="mt-4 grid grid-cols-2 gap-3">
              <label class="admin-color-field">
                <span>編號背景色</span>
                <input v-model="campaign.eggNumberBgColor" type="color" />
              </label>

              <label class="admin-color-field">
                <span>編號文字色</span>
                <input v-model="campaign.eggNumberTextColor" type="color" />
              </label>
            </div>
          </div>
        </section>

        <section
          v-if="activeSection === 'prizes'"
          class="space-y-4"
        >
          <div class="rounded-3xl bg-slate-50 p-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h2 class="text-lg font-black text-slate-900">
                  獎項與百分比機率設定
                </h2>
                <p class="mt-1 text-sm text-slate-500">
                  管理獎項名稱、短名稱、百分比機率、庫存與中獎類型。所有獎項百分比建議加總為 100%。
                </p>
              </div>
              <button
                type="button"
                class="rounded-2xl bg-yellow-400 px-3 py-2 text-xs font-black text-red-700"
                @click="addPrize"
              >
                新增
              </button>
            </div>

            <div
              class="mt-3 rounded-2xl border px-3 py-2 text-sm font-black"
              :class="probabilityHintClass"
            >
              百分比總和：{{ probabilityTotal }}%｜{{ probabilityHintText }}
            </div>

            <div class="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                class="rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-black text-white"
                @click="averageProbability"
              >
                平均到 100
              </button>

              <button
                type="button"
                class="rounded-2xl bg-slate-200 px-3 py-2 text-xs font-black text-slate-700"
                @click="clearProbability"
              >
                清空機率
              </button>
            </div>
          </div>

          <div class="space-y-3">
            <article
              v-for="(prize, index) in prizes"
              :key="prize.id"
              class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div class="mb-3 flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-yellow-100 text-xl">
                    {{ prize.icon || '🎁' }}
                  </div>
                  <div>
                    <p class="text-sm font-black text-slate-900">
                      獎項 {{ index + 1 }}
                    </p>
                    <p class="text-xs font-bold text-slate-400">
                      {{ prize.id }}
                    </p>
                  </div>
                </div>

                <label class="flex items-center gap-2 text-xs font-black text-slate-500">
                  <input
                    v-model="prize.isEnabled"
                    type="checkbox"
                  />
                  啟用
                </label>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <label class="admin-field compact">
                  <span>圖示</span>
                  <input v-model="prize.icon" type="text" />
                </label>

                <label class="admin-field compact">
                  <span>短名稱</span>
                  <input v-model="prize.shortName" type="text" />
                </label>

                <label class="admin-field compact col-span-2">
                  <span>獎項圖片 URL / 上傳後圖片資料</span>
                  <input
                    v-model="prize.imageUrl"
                    type="text"
                    placeholder="此獎項中獎時優先顯示這張圖片，也可使用下方上傳"
                  />
                </label>

                <div class="col-span-2 grid grid-cols-2 gap-2">
                  <label class="admin-upload-button compact">
                    <input
                      type="file"
                      accept="image/*"
                      class="hidden"
                      @change="handlePrizeImageUpload($event, prize)"
                    />
                    上傳獎項圖片
                  </label>

                  <button
                    type="button"
                    class="rounded-2xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 ring-1 ring-rose-100"
                    @click="clearPrizeImage(prize)"
                  >
                    清除圖片
                  </button>
                </div>

                <div
                  v-if="prize.imageUrl"
                  class="col-span-2 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2"
                >
                  <img
                    :src="prize.imageUrl"
                    alt="獎項圖片預覽"
                    class="h-24 w-full rounded-xl object-cover"
                  />
                </div>

                <label class="admin-field compact col-span-2">
                  <span>獎項名稱</span>
                  <input v-model="prize.name" type="text" />
                </label>

                <label class="admin-field compact col-span-2">
                  <span>獎項說明</span>
                  <input v-model="prize.description" type="text" />
                </label>

                <label class="admin-field compact">
                  <span>中獎機率 (%)</span>
                  <input
                    v-model.number="prize.probability"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="0-100"
                  />
                </label>

                <label class="admin-field compact">
                  <span>庫存</span>
                  <input v-model.number="prize.stock" type="number" min="0" />
                </label>

                <label class="admin-field compact">
                  <span>類型</span>
                  <select v-model="prize.type">
                    <option value="win">中獎</option>
                    <option value="lose">未中獎</option>
                  </select>
                </label>

                <label class="admin-field compact">
                  <span>等級</span>
                  <select v-model="prize.rank">
                    <option value="first">頭獎</option>
                    <option value="second">二獎</option>
                    <option value="third">三獎</option>
                    <option value="normal">一般獎</option>
                    <option value="none">未中獎</option>
                  </select>
                </label>
              </div>

              <div class="mt-3 grid grid-cols-4 gap-2">
                <button
                  type="button"
                  class="admin-small-button"
                  :disabled="index === 0"
                  @click="movePrize(index, -1)"
                >
                  上移
                </button>

                <button
                  type="button"
                  class="admin-small-button"
                  :disabled="index === prizes.length - 1"
                  @click="movePrize(index, 1)"
                >
                  下移
                </button>

                <button
                  type="button"
                  class="admin-small-button"
                  @click="duplicatePrize(prize)"
                >
                  複製
                </button>

                <button
                  type="button"
                  class="admin-small-button danger"
                  @click="removePrize(prize)"
                >
                  刪除
                </button>
              </div>
            </article>
          </div>
        </section>

        <section
          v-if="activeSection === 'eggLogs'"
          class="space-y-4"
        >
          <div class="rounded-3xl bg-slate-50 p-4">
            <h2 class="text-lg font-black text-slate-900">
              砸蛋紀錄管理
            </h2>
            <p class="mt-1 text-sm leading-6 text-slate-500">
              讀取前台最近砸蛋紀錄，可篩選、匯出 CSV、清除紀錄。紀錄目前保存在同一瀏覽器 localStorage。
            </p>
          </div>

          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p class="text-xs font-bold text-slate-400">全部紀錄</p>
              <p class="mt-1 text-3xl font-black text-slate-900">{{ eggPlayLogStats.total }}</p>
            </div>

            <div class="rounded-3xl bg-emerald-50 p-4 shadow-sm ring-1 ring-emerald-100">
              <p class="text-xs font-bold text-emerald-500">中獎</p>
              <p class="mt-1 text-3xl font-black text-emerald-700">{{ eggPlayLogStats.win }}</p>
            </div>

            <div class="rounded-3xl bg-slate-100 p-4 shadow-sm ring-1 ring-slate-200">
              <p class="text-xs font-bold text-slate-500">未中獎</p>
              <p class="mt-1 text-3xl font-black text-slate-700">{{ eggPlayLogStats.lose }}</p>
            </div>
          </div>

          <div class="rounded-3xl border border-indigo-100 bg-indigo-50 p-4">
            <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 class="text-base font-black text-indigo-900">
                  紀錄更新與匯出
                </h3>
                <p class="mt-1 text-xs font-black text-indigo-600">
                  {{ autoRefreshEggPlayLogs ? `自動更新中，每 ${eggPlayLogRefreshSeconds} 秒刷新` : '已關閉自動更新' }}
                  <span v-if="lastEggPlayLogRefreshAt">｜最後更新：{{ lastEggPlayLogRefreshAt }}</span>
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-indigo-700 ring-1 ring-indigo-100"
                  @click="refreshEggPlayLogs"
                >
                  重新讀取
                </button>

                <button
                  type="button"
                  class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-indigo-700 ring-1 ring-indigo-100"
                  @click="exportEggPlayLogsCsv"
                >
                  匯出 CSV
                </button>

                <button
                  type="button"
                  class="rounded-2xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 ring-1 ring-rose-100"
                  @click="clearEggPlayLogs"
                >
                  清除紀錄
                </button>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-1 gap-3 rounded-2xl bg-white/70 p-3 md:grid-cols-[1fr_180px]">
              <label class="admin-toggle">
                <input v-model="autoRefreshEggPlayLogs" type="checkbox" />
                <span>自動更新砸蛋紀錄</span>
              </label>

              <label class="admin-field compact">
                <span>刷新秒數</span>
                <input
                  v-model.number="eggPlayLogRefreshSeconds"
                  type="number"
                  min="1"
                  max="60"
                  @change="startEggPlayLogAutoRefresh"
                />
              </label>
            </div>
          </div>

          <div class="rounded-3xl border border-slate-200 bg-white p-4">
            <div class="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px]">
              <label class="admin-field">
                <span>搜尋紀錄</span>
                <input
                  v-model="eggPlayLogSearchText"
                  type="text"
                  placeholder="可搜尋獎項名稱、金蛋號碼或時間"
                />
              </label>

              <label class="admin-field">
                <span>狀態篩選</span>
                <select v-model="eggPlayLogStatusFilter">
                  <option value="all">全部紀錄</option>
                  <option value="win">只看中獎</option>
                  <option value="lose">只看未中獎</option>
                </select>
              </label>
            </div>

            <div
              v-if="filteredEggPlayLogs.length"
              class="mt-4 max-h-[560px] space-y-2 overflow-y-auto pr-1"
            >
              <article
                v-for="item in filteredEggPlayLogs"
                :key="item.id"
                class="rounded-2xl border border-slate-100 bg-slate-50 p-3"
              >
                <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p class="text-sm font-black text-slate-900">
                      {{ item.prizeName || '未知獎項' }}
                    </p>
                    <p class="mt-1 text-xs font-bold text-slate-500">
                      金蛋 {{ item.eggNumber || '-' }}｜{{ item.createdAt || '未記錄時間' }}
                    </p>
                    <p class="mt-1 text-xs font-bold text-slate-400">
                      紀錄 ID：{{ item.id }}
                    </p>
                  </div>

                  <span
                    class="rounded-full px-3 py-1 text-xs font-black"
                    :class="item.prizeType === 'lose' ? 'bg-slate-200 text-slate-700' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'"
                  >
                    {{ item.prizeType === 'lose' ? '未中獎' : '中獎' }}
                  </span>
                </div>
              </article>
            </div>

            <p
              v-else
              class="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-bold text-slate-500"
            >
              目前沒有符合條件的砸蛋紀錄。
            </p>
          </div>
        </section>

        <section
          v-if="activeSection === 'serial'"
          class="space-y-4"
        >
          <div class="rounded-3xl bg-slate-50 p-4">
            <h2 class="text-lg font-black text-slate-900">
              序號抽獎與分享內容
            </h2>
            <p class="mt-1 text-sm leading-6 text-slate-500">
              分享不再自動增加機會。主辦單位可在這裡產生序號，客人在前台輸入序號後才會增加砸蛋機會。
            </p>
          </div>

          <div class="rounded-3xl border border-sky-100 bg-sky-50 p-4">
            <h3 class="text-base font-black text-sky-800">
              分享內容設定
            </h3>

            <div class="mt-4 space-y-4">
              <label class="admin-field">
                <span>分享標題</span>
                <input v-model="campaign.shareTitle" type="text" />
              </label>

              <label class="admin-field">
                <span>分享描述</span>
                <textarea v-model="campaign.shareDescription" rows="4" />
              </label>

              <label class="admin-field">
                <span>分享網址</span>
                <input
                  v-model="campaign.shareUrl"
                  type="text"
                  placeholder="留空時使用目前前台網址"
                />
              </label>

              <label class="admin-field">
                <span>分享 Hashtags</span>
                <input v-model="campaign.shareHashtags" type="text" />
              </label>
            </div>
          </div>

          <div class="rounded-3xl border border-yellow-100 bg-yellow-50 p-4">
            <h3 class="text-base font-black text-yellow-800">
              前台序號兌換文字
            </h3>

            <div class="mt-4 space-y-4">
              <label class="admin-toggle">
                <input v-model="campaign.showSerialRedeemSection" type="checkbox" />
                <span>顯示前台序號輸入區</span>
              </label>

              <label class="admin-field">
                <span>區塊標題</span>
                <input v-model="campaign.serialRedeemTitle" type="text" />
              </label>

              <label class="admin-field">
                <span>輸入框提示文字</span>
                <input v-model="campaign.serialRedeemPlaceholder" type="text" />
              </label>

              <label class="admin-field">
                <span>兌換按鈕文字</span>
                <input v-model="campaign.serialRedeemButtonText" type="text" />
              </label>

              <label class="admin-field">
                <span>兌換成功訊息</span>
                <input v-model="campaign.serialRedeemSuccessText" type="text" />
              </label>

              <label class="admin-field">
                <span>兌換失敗訊息</span>
                <input v-model="campaign.serialRedeemErrorText" type="text" />
              </label>

              <div class="grid grid-cols-2 gap-3">
                <label class="admin-field">
                  <span>錯誤上限：{{ campaign.maxSerialRedeemErrors }} 次</span>
                  <input
                    v-model.number="campaign.maxSerialRedeemErrors"
                    type="range"
                    min="3"
                    max="10"
                  />
                </label>

                <label class="admin-field">
                  <span>鎖定秒數：{{ campaign.serialRedeemLockSeconds }} 秒</span>
                  <input
                    v-model.number="campaign.serialRedeemLockSeconds"
                    type="range"
                    min="10"
                    max="300"
                  />
                </label>
              </div>
            </div>
          </div>

          <div class="rounded-3xl border border-orange-100 bg-orange-50 p-4">
            <h3 class="text-base font-black text-orange-800">
              序號輸入區樣式
            </h3>

            <div class="mt-4 grid grid-cols-2 gap-3">
              <label class="admin-color-field">
                <span>區塊背景色</span>
                <input v-model="campaign.serialRedeemBgColor" type="color" />
              </label>

              <label class="admin-color-field">
                <span>區塊邊框色</span>
                <input v-model="campaign.serialRedeemBorderColor" type="color" />
              </label>

              <label class="admin-color-field">
                <span>標題文字色</span>
                <input v-model="campaign.serialRedeemTextColor" type="color" />
              </label>

              <label class="admin-color-field">
                <span>提示文字色</span>
                <input v-model="campaign.serialRedeemHintColor" type="color" />
              </label>

              <label class="admin-color-field">
                <span>輸入框背景色</span>
                <input v-model="campaign.serialRedeemInputBgColor" type="color" />
              </label>

              <label class="admin-color-field">
                <span>輸入框文字色</span>
                <input v-model="campaign.serialRedeemInputTextColor" type="color" />
              </label>

              <label class="admin-color-field">
                <span>按鈕背景色</span>
                <input v-model="campaign.serialRedeemButtonBgColor" type="color" />
              </label>

              <label class="admin-color-field">
                <span>按鈕文字色</span>
                <input v-model="campaign.serialRedeemButtonTextColor" type="color" />
              </label>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-3">
              <label class="admin-field">
                <span>區塊圓角：{{ campaign.serialRedeemRadius }}px</span>
                <input
                  v-model.number="campaign.serialRedeemRadius"
                  type="range"
                  min="12"
                  max="34"
                />
              </label>

              <label class="admin-field">
                <span>區塊內距：{{ campaign.serialRedeemPadding }}px</span>
                <input
                  v-model.number="campaign.serialRedeemPadding"
                  type="range"
                  min="8"
                  max="24"
                />
              </label>

              <label class="admin-field">
                <span>標題文字大小：{{ campaign.serialRedeemTitleTextSize }}px</span>
                <input
                  v-model.number="campaign.serialRedeemTitleTextSize"
                  type="range"
                  min="12"
                  max="24"
                />
              </label>

              <label class="admin-field">
                <span>提示文字大小：{{ campaign.serialRedeemHintTextSize }}px</span>
                <input
                  v-model.number="campaign.serialRedeemHintTextSize"
                  type="range"
                  min="10"
                  max="18"
                />
              </label>

              <label class="admin-field">
                <span>輸入文字大小：{{ campaign.serialRedeemInputTextSize }}px</span>
                <input
                  v-model.number="campaign.serialRedeemInputTextSize"
                  type="range"
                  min="12"
                  max="20"
                />
              </label>

              <label class="admin-field">
                <span>按鈕文字大小：{{ campaign.serialRedeemButtonTextSize }}px</span>
                <input
                  v-model.number="campaign.serialRedeemButtonTextSize"
                  type="range"
                  min="12"
                  max="20"
                />
              </label>
            </div>
          </div>

          <div class="rounded-3xl border border-sky-100 bg-sky-50 p-4">
            <h3 class="text-base font-black text-sky-800">
              前台分享按鈕
            </h3>
            <p class="mt-1 text-xs font-bold leading-5 text-sky-700/80">
              控制序號輸入區下方的系統分享、LINE 分享、Telegram 分享按鈕。
            </p>

            <div class="mt-4 space-y-3">
              <label class="admin-toggle">
                <input v-model="campaign.showShareButtonSection" type="checkbox" />
                <span>顯示分享按鈕區</span>
              </label>

              <div class="grid grid-cols-3 gap-2">
                <label class="admin-toggle">
                  <input v-model="campaign.showSystemShareButton" type="checkbox" />
                  <span>系統</span>
                </label>

                <label class="admin-toggle">
                  <input v-model="campaign.showLineShareButton" type="checkbox" />
                  <span>LINE</span>
                </label>

                <label class="admin-toggle">
                  <input v-model="campaign.showTelegramShareButton" type="checkbox" />
                  <span>Telegram</span>
                </label>
              </div>

              <div class="grid grid-cols-3 gap-2">
                <label class="admin-field">
                  <span>系統按鈕文字</span>
                  <input v-model="campaign.systemShareButtonText" type="text" />
                </label>

                <label class="admin-field">
                  <span>LINE 按鈕文字</span>
                  <input v-model="campaign.lineShareButtonText" type="text" />
                </label>

                <label class="admin-field">
                  <span>Telegram 文字</span>
                  <input v-model="campaign.telegramShareButtonText" type="text" />
                </label>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <label class="admin-color-field">
                  <span>系統背景色</span>
                  <input v-model="campaign.systemShareButtonBgColor" type="color" />
                </label>

                <label class="admin-color-field">
                  <span>系統文字色</span>
                  <input v-model="campaign.systemShareButtonTextColor" type="color" />
                </label>

                <label class="admin-color-field">
                  <span>LINE 背景色</span>
                  <input v-model="campaign.lineShareButtonBgColor" type="color" />
                </label>

                <label class="admin-color-field">
                  <span>LINE 文字色</span>
                  <input v-model="campaign.lineShareButtonTextColor" type="color" />
                </label>

                <label class="admin-color-field">
                  <span>Telegram 背景色</span>
                  <input v-model="campaign.telegramShareButtonBgColor" type="color" />
                </label>

                <label class="admin-color-field">
                  <span>Telegram 文字色</span>
                  <input v-model="campaign.telegramShareButtonTextColor" type="color" />
                </label>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <label class="admin-field">
                  <span>分享按鈕圓角：{{ campaign.shareButtonRadius }}px</span>
                  <input
                    v-model.number="campaign.shareButtonRadius"
                    type="range"
                    min="8"
                    max="28"
                  />
                </label>

                <label class="admin-field">
                  <span>分享按鈕文字：{{ campaign.shareButtonTextSize }}px</span>
                  <input
                    v-model.number="campaign.shareButtonTextSize"
                    type="range"
                    min="10"
                    max="20"
                  />
                </label>

                <label class="admin-field">
                  <span>分享按鈕間距：{{ campaign.shareButtonGap }}px</span>
                  <input
                    v-model.number="campaign.shareButtonGap"
                    type="range"
                    min="4"
                    max="18"
                  />
                </label>

                <label class="admin-field">
                  <span>分享按鈕上下內距：{{ campaign.shareButtonPaddingY }}px</span>
                  <input
                    v-model.number="campaign.shareButtonPaddingY"
                    type="range"
                    min="8"
                    max="20"
                  />
                </label>
              </div>
            </div>
          </div>

          <div class="rounded-3xl border border-purple-100 bg-purple-50 p-4">
            <h3 class="text-base font-black text-purple-900">
              手動新增 / 批次貼上序號
            </h3>
            <p class="mt-1 text-xs font-bold leading-5 text-purple-700/80">
              可自行指定序號，或從外部名單一次貼上多組序號。系統會自動略過重複序號。
            </p>

            <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_140px_140px]">
              <label class="admin-field">
                <span>手動新增單組序號</span>
                <input
                  v-model="manualSerialCode"
                  type="text"
                  placeholder="例如：VIP-CODE-001"
                />
              </label>

              <label class="admin-field">
                <span>增加次數</span>
                <input
                  v-model.number="manualSerialRewardChance"
                  type="number"
                  min="1"
                  max="99"
                />
              </label>

              <label class="admin-field">
                <span>批次代碼</span>
                <input
                  v-model="manualSerialBatchCode"
                  type="text"
                  placeholder="例如：VIP"
                />
              </label>
            </div>

            <div class="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-5">
              <button
                type="button"
                class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-purple-700 ring-1 ring-purple-100"
                @click="applyManualExpirePreset('none')"
              >
                永不過期
              </button>

              <button
                type="button"
                class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-purple-700 ring-1 ring-purple-100"
                @click="applyManualExpirePreset('today')"
              >
                今天 23:59
              </button>

              <button
                type="button"
                class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-purple-700 ring-1 ring-purple-100"
                @click="applyManualExpirePreset('3days')"
              >
                3 天
              </button>

              <button
                type="button"
                class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-purple-700 ring-1 ring-purple-100"
                @click="applyManualExpirePreset('7days')"
              >
                7 天
              </button>

              <button
                type="button"
                class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-purple-700 ring-1 ring-purple-100"
                @click="applyManualExpirePreset('30days')"
              >
                30 天
              </button>
            </div>

            <div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
              <label class="admin-field">
                <span>有效期限模式</span>
                <select v-model="manualSerialExpireMode">
                  <option value="none">永不過期</option>
                  <option value="days">從今天起 N 天</option>
                  <option value="custom">指定日期時間</option>
                </select>
              </label>

              <label
                v-if="manualSerialExpireMode === 'days'"
                class="admin-field"
              >
                <span>有效天數</span>
                <input
                  v-model.number="manualSerialExpireDays"
                  type="number"
                  min="1"
                  max="365"
                />
              </label>

              <label
                v-if="manualSerialExpireMode === 'custom'"
                class="admin-field"
              >
                <span>指定過期時間</span>
                <input
                  v-model="manualCustomExpireAt"
                  type="datetime-local"
                />
              </label>
            </div>

            <button
              type="button"
              class="mt-3 w-full rounded-2xl bg-purple-600 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="!!localSerialAction"
              @click="addManualSerialCode"
            >
              {{ localSerialAction === 'manual-create' ? '新增處理中...' : '新增單組序號' }}
            </button>

            <label class="admin-field mt-4">
              <span>批次貼上多組序號</span>
              <textarea
                v-model="bulkSerialCodesText"
                rows="6"
                placeholder="一行一組，或用逗號、空白分隔&#10;VIP001&#10;VIP002&#10;VIP003"
              />
            </label>

            <button
              type="button"
              class="mt-3 w-full rounded-2xl bg-purple-900 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="!!localSerialAction"
              @click="addBulkManualSerialCodes"
            >
              {{ localSerialAction === 'manual-bulk' ? '批次處理中...' : '批次新增貼上的序號' }}
            </button>
          </div>

          <div class="rounded-3xl border border-cyan-100 bg-cyan-50 p-4">
            <h3 class="text-base font-black text-cyan-900">
              匯入序號 JSON / CSV
            </h3>
            <p class="mt-1 text-xs font-bold leading-5 text-cyan-700/80">
              可匯入之前匯出的 JSON / CSV，或外部整理好的序號清單。匯入時會自動略過重複序號。
            </p>

            <div class="mt-4 space-y-3">
              <label class="admin-toggle">
                <input v-model="replaceSerialCodesOnImport" type="checkbox" />
                <span>匯入前先清空目前序號</span>
              </label>

              <div class="grid grid-cols-1 gap-2 md:grid-cols-3">
                <label class="admin-import-upload-button">
                  <input
                    type="file"
                    accept=".json,.csv,text/csv,application/json"
                    class="hidden"
                    @change="handleSerialImportFile"
                  />
                  選擇 JSON / CSV 檔匯入
                </label>

                <button
                  type="button"
                  class="rounded-2xl bg-white px-4 py-3 text-sm font-black text-cyan-700 ring-1 ring-cyan-100 transition hover:bg-cyan-50"
                  @click="downloadSerialCsvTemplate"
                >
                  下載 CSV 範本
                </button>

                <button
                  type="button"
                  class="rounded-2xl bg-white px-4 py-3 text-sm font-black text-cyan-700 ring-1 ring-cyan-100 transition hover:bg-cyan-50"
                  @click="copySerialCsvExample"
                >
                  複製 CSV 範例
                </button>
              </div>

              <div class="rounded-2xl bg-white/70 p-3 text-xs font-bold leading-6 text-cyan-800">
                <p class="font-black">CSV 支援欄位：</p>
                <p class="font-mono">code, rewardChance, batchCode, expireAt, note</p>
                <p class="mt-1">也支援只有第一欄是序號的簡單 CSV。</p>
                <p class="mt-2 font-black">範例：</p>
                <pre class="mt-1 overflow-x-auto rounded-xl bg-cyan-950 px-3 py-2 text-[11px] leading-5 text-cyan-50">code,rewardChance,batchCode,expireAt,note
VIP001,1,VIP,,永不過期
VIP002,2,VIP,2026-12-31T23:59:00.000Z,指定有效期限</pre>
              </div>

              <div
                v-if="serialImportPreview"
                class="rounded-3xl border border-cyan-200 bg-white p-4"
              >
                <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h4 class="text-base font-black text-cyan-900">
                      匯入前預覽
                    </h4>
                    <p class="mt-1 text-xs font-bold text-cyan-700">
                      檔案：{{ serialImportPreview.filename }}｜讀取時間：{{ serialImportPreview.createdAt }}
                    </p>
                  </div>

                  <div class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="rounded-2xl bg-cyan-600 px-4 py-2 text-xs font-black text-white"
                      @click="confirmSerialImportPreview"
                    >
                      確認匯入
                    </button>

                    <button
                      type="button"
                      class="rounded-2xl bg-white px-4 py-2 text-xs font-black text-cyan-700 ring-1 ring-cyan-100"
                      @click="exportSerialImportPreviewReportCsv"
                    >
                      匯出檢查報告
                    </button>

                    <button
                      type="button"
                      class="rounded-2xl bg-rose-50 px-4 py-2 text-xs font-black text-rose-700 ring-1 ring-rose-100"
                      @click="cancelSerialImportPreview"
                    >
                      取消
                    </button>
                  </div>
                </div>

                <div class="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                  <div class="rounded-2xl bg-slate-50 p-3 text-center">
                    <p class="text-xs font-bold text-slate-400">讀取總數</p>
                    <p class="text-2xl font-black text-slate-900">{{ serialImportPreview.total }}</p>
                  </div>

                  <div class="rounded-2xl bg-emerald-50 p-3 text-center">
                    <p class="text-xs font-bold text-emerald-500">可新增</p>
                    <p class="text-2xl font-black text-emerald-700">{{ serialImportPreview.validItems.length }}</p>
                  </div>

                  <div class="rounded-2xl bg-amber-50 p-3 text-center">
                    <p class="text-xs font-bold text-amber-500">重複</p>
                    <p class="text-2xl font-black text-amber-700">{{ serialImportPreview.duplicateItems.length }}</p>
                  </div>

                  <div class="rounded-2xl bg-rose-50 p-3 text-center">
                    <p class="text-xs font-bold text-rose-500">無效</p>
                    <p class="text-2xl font-black text-rose-700">{{ serialImportPreview.invalidItems.length }}</p>
                  </div>
                </div>

                <div
                  v-if="serialImportPreview.validItems.length"
                  class="mt-4 rounded-2xl bg-slate-50 p-3"
                >
                  <p class="mb-2 text-xs font-black text-slate-500">
                    前 10 筆可新增序號預覽
                  </p>

                  <div class="max-h-52 space-y-2 overflow-y-auto">
                    <div
                      v-for="item in serialImportPreview.validItems.slice(0, 10)"
                      :key="item.id"
                      class="rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-700"
                    >
                      <span class="font-mono font-black text-slate-900">{{ item.code }}</span>
                      <span class="ml-2">增加 {{ item.rewardChance }} 次</span>
                      <span class="ml-2">批次：{{ item.batchCode || '無' }}</span>
                      <span class="ml-2">期限：{{ item.expireAtText || '永不過期' }}</span>
                    </div>
                  </div>
                </div>

                <div
                  v-if="serialImportPreview.duplicateItems.length"
                  class="mt-4 rounded-2xl bg-amber-50 p-3 ring-1 ring-amber-100"
                >
                  <div class="mb-2 flex items-center justify-between gap-2">
                    <p class="text-xs font-black text-amber-700">
                      前 10 筆重複序號
                    </p>

                    <button
                      type="button"
                      class="rounded-xl bg-white px-3 py-1 text-[11px] font-black text-amber-700 ring-1 ring-amber-100"
                      @click="copyImportPreviewDuplicates"
                    >
                      複製重複清單
                    </button>
                  </div>

                  <div class="max-h-52 space-y-2 overflow-y-auto">
                    <div
                      v-for="item in serialImportPreview.duplicateItems.slice(0, 10)"
                      :key="item.id || item.code"
                      class="rounded-xl bg-white px-3 py-2 text-xs font-bold text-amber-700"
                    >
                      <span class="font-mono font-black">{{ item.code }}</span>
                      <span class="ml-2">批次：{{ item.batchCode || '無' }}</span>
                    </div>
                  </div>
                </div>

                <div
                  v-if="serialImportPreview.invalidItems.length"
                  class="mt-4 rounded-2xl bg-rose-50 p-3 ring-1 ring-rose-100"
                >
                  <div class="mb-2 flex items-center justify-between gap-2">
                    <p class="text-xs font-black text-rose-700">
                      前 10 筆無效資料
                    </p>

                    <button
                      type="button"
                      class="rounded-xl bg-white px-3 py-1 text-[11px] font-black text-rose-700 ring-1 ring-rose-100"
                      @click="copyImportPreviewInvalidRows"
                    >
                      複製無效清單
                    </button>
                  </div>

                  <div class="max-h-52 space-y-2 overflow-y-auto">
                    <div
                      v-for="item in serialImportPreview.invalidItems.slice(0, 10)"
                      :key="item.index"
                      class="rounded-xl bg-white px-3 py-2 text-xs font-bold text-rose-700"
                    >
                      第 {{ item.index }} 筆｜{{ item.reason }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
            <h3 class="text-base font-black text-emerald-800">
              產生抽獎序號
            </h3>

            <div class="mt-4 grid grid-cols-2 gap-3">
              <label class="admin-field">
                <span>序號前綴</span>
                <input v-model="serialCodePrefix" type="text" />
              </label>

              <label class="admin-field">
                <span>批次代碼</span>
                <input
                  v-model="serialBatchCode"
                  type="text"
                  placeholder="例如：VIP01 / APRIL"
                />
              </label>

              <label class="admin-field">
                <span>每組增加次數</span>
                <input
                  v-model.number="serialRewardChance"
                  type="number"
                  min="1"
                  max="99"
                />
              </label>

              <label class="admin-field">
                <span>產生數量</span>
                <input
                  v-model.number="serialGenerateCount"
                  type="number"
                  min="1"
                  max="100"
                />
              </label>

              <label class="admin-field col-span-2">
                <span>亂數長度：{{ serialCodeLength }} 字元</span>
                <input
                  v-model.number="serialCodeLength"
                  type="range"
                  min="12"
                  max="32"
                />
              </label>

              <div class="col-span-2 rounded-3xl border border-amber-100 bg-amber-50 p-4">
                <h4 class="text-sm font-black text-amber-800">
                  序號有效期限
                </h4>
                <p class="mt-1 text-xs font-bold text-amber-700/80">
                  只影響接下來新產生的序號；已產生的序號不會自動改變。
                </p>

                <div class="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-5">
                  <button
                    type="button"
                    class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-amber-700 ring-1 ring-amber-100"
                    @click="applySerialExpirePreset('none')"
                  >
                    永不過期
                  </button>

                  <button
                    type="button"
                    class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-amber-700 ring-1 ring-amber-100"
                    @click="applySerialExpirePreset('today')"
                  >
                    今天 23:59
                  </button>

                  <button
                    type="button"
                    class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-amber-700 ring-1 ring-amber-100"
                    @click="applySerialExpirePreset('3days')"
                  >
                    3 天
                  </button>

                  <button
                    type="button"
                    class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-amber-700 ring-1 ring-amber-100"
                    @click="applySerialExpirePreset('7days')"
                  >
                    7 天
                  </button>

                  <button
                    type="button"
                    class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-amber-700 ring-1 ring-amber-100"
                    @click="applySerialExpirePreset('30days')"
                  >
                    30 天
                  </button>
                </div>

                <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label class="admin-field">
                    <span>有效期限模式</span>
                    <select v-model="serialExpireMode">
                      <option value="none">永不過期</option>
                      <option value="days">產生後 N 天</option>
                      <option value="custom">指定日期時間</option>
                    </select>
                  </label>

                  <label
                    v-if="serialExpireMode === 'days'"
                    class="admin-field"
                  >
                    <span>有效天數</span>
                    <input
                      v-model.number="serialExpireDays"
                      type="number"
                      min="1"
                      max="365"
                    />
                  </label>

                  <label
                    v-if="serialExpireMode === 'custom'"
                    class="admin-field"
                  >
                    <span>指定過期時間</span>
                    <input
                      v-model="serialCustomExpireAt"
                      type="datetime-local"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-5">
              <button
                type="button"
                class="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="!!localSerialAction"
                @click="generateSerialCodes"
              >
                {{ localSerialAction === 'generate' ? '產生處理中...' : '自動產生序號' }}
              </button>

              <button
                type="button"
                class="rounded-2xl bg-white px-4 py-3 text-sm font-black text-emerald-700 ring-1 ring-emerald-100"
                @click="copyAvailableSerialCodes"
              >
                複製可用序號
              </button>

              <button
                type="button"
                class="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-200"
                @click="exportSerialCodesCsv"
              >
                匯出 CSV
              </button>

              <button
                type="button"
                class="rounded-2xl bg-white px-4 py-3 text-sm font-black text-emerald-700 ring-1 ring-emerald-100"
                @click="exportSerialCodes"
              >
                匯出 JSON
              </button>

              <button
                type="button"
                class="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 ring-1 ring-rose-100"
                @click="clearUsedSerialCodes"
              >
                清除已使用
              </button>
            </div>

            <button
              type="button"
              class="mt-2 w-full rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white"
              @click="clearAllSerialCodes"
            >
              清除全部序號
            </button>
          </div>

          <div class="rounded-3xl border border-slate-200 bg-white p-4">
            <div class="mb-4 grid grid-cols-2 gap-2 text-center xl:grid-cols-7">
              <div class="rounded-2xl bg-slate-50 p-3">
                <p class="text-xs font-bold text-slate-400">全部</p>
                <p class="text-2xl font-black text-slate-900">{{ serialCodeStats.total }}</p>
              </div>
              <div class="rounded-2xl bg-emerald-50 p-3">
                <p class="text-xs font-bold text-emerald-500">可用</p>
                <p class="text-2xl font-black text-emerald-700">{{ serialCodeStats.unused }}</p>
              </div>
              <div class="rounded-2xl bg-amber-50 p-3">
                <p class="text-xs font-bold text-amber-500">已用</p>
                <p class="text-2xl font-black text-amber-700">{{ serialCodeStats.used }}</p>
              </div>
              <div class="rounded-2xl bg-slate-100 p-3">
                <p class="text-xs font-bold text-slate-500">停用</p>
                <p class="text-2xl font-black text-slate-700">{{ serialCodeStats.disabled }}</p>
              </div>
              <div class="rounded-2xl bg-rose-50 p-3">
                <p class="text-xs font-bold text-rose-500">過期</p>
                <p class="text-2xl font-black text-rose-700">{{ serialCodeStats.expired }}</p>
              </div>
              <div class="rounded-2xl bg-cyan-50 p-3">
                <p class="text-xs font-bold text-cyan-500">已發放</p>
                <p class="text-2xl font-black text-cyan-700">{{ serialCodeStats.distributed }}</p>
              </div>
              <div class="rounded-2xl bg-violet-50 p-3">
                <p class="text-xs font-bold text-violet-500">未發放</p>
                <p class="text-2xl font-black text-violet-700">{{ serialCodeStats.undistributed }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_180px_220px]">
              <label class="admin-field">
                <span>搜尋序號</span>
                <input
                  v-model="serialSearchText"
                  type="text"
                  placeholder="輸入序號、批次代碼或備註關鍵字"
                />
              </label>

              <label class="admin-field">
                <span>狀態篩選</span>
                <select v-model="serialStatusFilter">
                  <option value="all">全部序號</option>
                  <option value="unused">只看可用</option>
                  <option value="used">只看已使用</option>
                  <option value="disabled">只看停用</option>
                  <option value="expired">只看過期</option>
                  <option value="distributed">只看已發放</option>
                  <option value="undistributed">只看未發放</option>
                </select>
              </label>

              <label class="admin-field">
                <span>排序方式</span>
                <select v-model="serialSortMode">
                  <option value="newest">最新產生優先</option>
                  <option value="oldest">最舊產生優先</option>
                  <option value="unusedFirst">可用序號優先</option>
                  <option value="usedFirst">已使用優先</option>
                  <option value="expireSoon">即將過期優先</option>
                  <option value="expiredFirst">已過期優先</option>
                  <option value="distributedFirst">已發放優先</option>
                  <option value="undistributedFirst">未發放優先</option>
                  <option value="codeAsc">序號 A → Z</option>
                  <option value="codeDesc">序號 Z → A</option>
                </select>
              </label>
            </div>

            <div class="mt-4 rounded-3xl border border-violet-100 bg-violet-50 p-4">
              <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 class="text-base font-black text-violet-900">
                    篩選結果批次管理
                  </h3>
                  <p class="mt-1 text-xs font-bold leading-5 text-violet-700/80">
                    會套用到目前搜尋、狀態篩選與排序後的序號，共 {{ filteredSerialCodes.length }} 組。
                  </p>
                </div>

                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-violet-700 ring-1 ring-violet-100"
                    @click="enableFilteredSerialCodes"
                  >
                    批次啟用
                  </button>

                  <button
                    type="button"
                    class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-violet-700 ring-1 ring-violet-100"
                    @click="disableFilteredSerialCodes"
                  >
                    批次停用
                  </button>

                  <button
                    type="button"
                    class="rounded-2xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 ring-1 ring-rose-100"
                    @click="deleteFilteredSerialCodes"
                  >
                    批次刪除
                  </button>
                </div>
              </div>

              <div class="mt-4 rounded-2xl bg-white/70 p-3">
                <h4 class="text-sm font-black text-violet-900">
                  批次標記發放狀態
                </h4>

                <div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_160px_160px]">
                  <label class="admin-field">
                    <span>發放對象 / 備註</span>
                    <input
                      v-model="bulkDistributeTo"
                      type="text"
                      placeholder="例如：LINE 客戶、VIP 名單、現場客人"
                    />
                  </label>

                  <label class="admin-field">
                    <span>發放管道</span>
                    <select v-model="bulkDistributeChannel">
                      <option value="LINE">LINE</option>
                      <option value="Facebook">Facebook</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Telegram">Telegram</option>
                      <option value="現場">現場</option>
                      <option value="簡訊">簡訊</option>
                      <option value="其他">其他</option>
                    </select>
                  </label>

                  <button
                    type="button"
                    class="rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-black text-white md:self-end"
                    @click="markFilteredSerialCodesDistributed"
                  >
                    批次標記已發放
                  </button>

                  <button
                    type="button"
                    class="rounded-2xl bg-white px-4 py-3 text-sm font-black text-violet-700 ring-1 ring-violet-100 md:self-end"
                    @click="unmarkFilteredSerialCodesDistributed"
                  >
                    批次改未發放
                  </button>
                </div>
              </div>

              <div class="mt-4 rounded-2xl bg-white/70 p-3">
                <h4 class="text-sm font-black text-violet-900">
                  批次修改有效期限
                </h4>

                <div class="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-5">
                  <button
                    type="button"
                    class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-violet-700 ring-1 ring-violet-100"
                    @click="applyBulkExpirePreset('none')"
                  >
                    永不過期
                  </button>

                  <button
                    type="button"
                    class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-violet-700 ring-1 ring-violet-100"
                    @click="applyBulkExpirePreset('today')"
                  >
                    今天 23:59
                  </button>

                  <button
                    type="button"
                    class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-violet-700 ring-1 ring-violet-100"
                    @click="applyBulkExpirePreset('3days')"
                  >
                    3 天
                  </button>

                  <button
                    type="button"
                    class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-violet-700 ring-1 ring-violet-100"
                    @click="applyBulkExpirePreset('7days')"
                  >
                    7 天
                  </button>

                  <button
                    type="button"
                    class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-violet-700 ring-1 ring-violet-100"
                    @click="applyBulkExpirePreset('30days')"
                  >
                    30 天
                  </button>
                </div>

                <div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label class="admin-field">
                    <span>批次有效期限模式</span>
                    <select v-model="bulkExpireMode">
                      <option value="none">永不過期</option>
                      <option value="days">從今天起 N 天</option>
                      <option value="custom">指定日期時間</option>
                    </select>
                  </label>

                  <label
                    v-if="bulkExpireMode === 'days'"
                    class="admin-field"
                  >
                    <span>有效天數</span>
                    <input
                      v-model.number="bulkExpireDays"
                      type="number"
                      min="1"
                      max="365"
                    />
                  </label>

                  <label
                    v-if="bulkExpireMode === 'custom'"
                    class="admin-field"
                  >
                    <span>指定過期時間</span>
                    <input
                      v-model="bulkCustomExpireAt"
                      type="datetime-local"
                    />
                  </label>

                  <button
                    type="button"
                    class="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white md:self-end"
                    @click="applyBulkExpireToFiltered"
                  >
                    套用到目前篩選結果
                  </button>
                </div>
              </div>
            </div>

            <div
              v-if="filteredSerialCodes.length"
              class="mt-4 max-h-[460px] space-y-2 overflow-y-auto pr-1"
            >
              <article
                v-for="item in filteredSerialCodes"
                :key="item.id"
                class="rounded-2xl border border-slate-100 bg-slate-50 p-3"
              >
                <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p class="font-mono text-sm font-black text-slate-900">
                      {{ item.code }}
                    </p>
                    <p class="mt-1 text-xs font-bold text-slate-500">
                      增加 {{ item.rewardChance }} 次｜批次：{{ item.batchCode || '無' }}｜建立：{{ item.createdAtText }}
                    </p>
                    <p class="mt-1 text-xs font-bold text-slate-500">
                      有效期限：{{ item.expireAtText || formatSerialExpireText(item.expireAt) }}
                    </p>
                    <p class="mt-1 text-xs font-bold" :class="item.distributedAt ? 'text-cyan-600' : 'text-slate-400'">
                      發放狀態：{{ item.distributedAt ? `已發放｜${item.distributedChannel || '未填管道'}｜${item.distributedTo || '未填對象'}` : '未發放' }}
                    </p>
                    <p
                      v-if="item.usedAtText"
                      class="mt-1 text-xs font-bold text-amber-600"
                    >
                      已使用：{{ item.usedAtText }}
                    </p>

                    <input
                      v-model="item.note"
                      type="text"
                      placeholder="備註，例如：客人姓名 / 發放管道"
                      class="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none"
                      @change="saveSerialCodes"
                    />

                    <div class="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                      <input
                        v-model="item.distributedTo"
                        type="text"
                        placeholder="發放對象"
                        class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none"
                        @change="saveSerialCodes"
                      />

                      <input
                        v-model="item.distributedChannel"
                        type="text"
                        placeholder="發放管道"
                        class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none"
                        @change="saveSerialCodes"
                      />
                    </div>
                  </div>

                  <div class="flex flex-wrap gap-2">
                    <span
                      class="rounded-xl px-3 py-2 text-xs font-black"
                      :class="getSerialStatusClass(item)"
                    >
                      {{ getSerialStatusLabel(item) }}
                    </span>

                    <button
                      type="button"
                      class="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-700 ring-1 ring-slate-200"
                      @click="copySerialCode(item.code)"
                    >
                      複製
                    </button>

                    <button
                      type="button"
                      class="rounded-xl px-3 py-2 text-xs font-black"
                      :class="item.isEnabled === false ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-slate-200 text-slate-700'"
                      @click="toggleSerialCodeEnabled(item)"
                    >
                      {{ item.isEnabled === false ? '啟用' : '停用' }}
                    </button>

                    <button
                      v-if="item.usedAt"
                      type="button"
                      class="rounded-xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-700 ring-1 ring-amber-100"
                      @click="resetSerialCodeUsed(item)"
                    >
                      重置
                    </button>

                    <button
                      v-if="!item.distributedAt"
                      type="button"
                      class="rounded-xl bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-700 ring-1 ring-cyan-100"
                      @click="markSerialDistributed(item)"
                    >
                      標記發放
                    </button>

                    <button
                      v-else
                      type="button"
                      class="rounded-xl bg-white px-3 py-2 text-xs font-black text-cyan-700 ring-1 ring-cyan-100"
                      @click="unmarkSerialDistributed(item)"
                    >
                      取消發放
                    </button>

                    <button
                      type="button"
                      class="rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 ring-1 ring-rose-100"
                      @click="removeSerialCode(item)"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              </article>
            </div>

            <p
              v-else
              class="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-bold text-slate-500"
            >
              目前沒有序號，請先點「自動產生序號」。
            </p>
          </div>
        </section>

        <section
          v-if="activeSection === 'bottomNav'"
          class="space-y-4"
        >
          <div class="rounded-3xl bg-slate-50 p-4">
            <h2 class="text-lg font-black text-slate-900">
              底部固定功能列
            </h2>
            <p class="mt-1 text-sm leading-6 text-slate-500">
              控制前台底部紅框那一排固定按鈕：重置、分享、結果、官網。
            </p>
          </div>

          <div class="rounded-3xl border border-yellow-100 bg-yellow-50 p-4">
            <h3 class="text-base font-black text-yellow-800">
              顯示與外觀
            </h3>

            <div class="mt-4 space-y-4">
              <label class="admin-toggle">
                <input v-model="campaign.showBottomNav" type="checkbox" />
                <span>顯示底部固定功能列</span>
              </label>

              <div class="grid grid-cols-2 gap-3">
                <label class="admin-color-field">
                  <span>功能列背景色</span>
                  <input v-model="campaign.bottomNavBgColor" type="color" />
                </label>

                <label class="admin-color-field">
                  <span>功能列邊框色</span>
                  <input v-model="campaign.bottomNavBorderColor" type="color" />
                </label>

                <label class="admin-color-field">
                  <span>按鈕背景色</span>
                  <input v-model="campaign.bottomNavButtonBgColor" type="color" />
                </label>

                <label class="admin-color-field">
                  <span>按鈕文字色</span>
                  <input v-model="campaign.bottomNavButtonTextColor" type="color" />
                </label>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <label class="admin-field">
                  <span>功能列圓角：{{ campaign.bottomNavRadius }}px</span>
                  <input
                    v-model.number="campaign.bottomNavRadius"
                    type="range"
                    min="12"
                    max="36"
                  />
                </label>

                <label class="admin-field">
                  <span>距離底部：{{ campaign.bottomNavBottom }}px</span>
                  <input
                    v-model.number="campaign.bottomNavBottom"
                    type="range"
                    min="0"
                    max="48"
                  />
                </label>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <label class="admin-field">
                  <span>整排內距：{{ campaign.bottomNavPadding }}px</span>
                  <input
                    v-model.number="campaign.bottomNavPadding"
                    type="range"
                    min="4"
                    max="18"
                  />
                </label>

                <label class="admin-field">
                  <span>按鈕間距：{{ campaign.bottomNavButtonGap }}px</span>
                  <input
                    v-model.number="campaign.bottomNavButtonGap"
                    type="range"
                    min="4"
                    max="18"
                  />
                </label>
              </div>
            </div>
          </div>

          <div class="rounded-3xl border border-orange-100 bg-orange-50 p-4">
            <h3 class="text-base font-black text-orange-800">
              按鈕尺寸
            </h3>

            <div class="mt-4 grid grid-cols-2 gap-3">
              <label class="admin-field">
                <span>按鈕高度：{{ campaign.bottomNavButtonHeight }}px</span>
                <input
                  v-model.number="campaign.bottomNavButtonHeight"
                  type="range"
                  min="42"
                  max="82"
                />
              </label>

              <label class="admin-field">
                <span>按鈕圓角：{{ campaign.bottomNavButtonRadius }}px</span>
                <input
                  v-model.number="campaign.bottomNavButtonRadius"
                  type="range"
                  min="8"
                  max="30"
                />
              </label>

              <label class="admin-field">
                <span>圖示大小：{{ campaign.bottomNavIconSize }}px</span>
                <input
                  v-model.number="campaign.bottomNavIconSize"
                  type="range"
                  min="14"
                  max="32"
                />
              </label>

              <label class="admin-field">
                <span>文字大小：{{ campaign.bottomNavTextSize }}px</span>
                <input
                  v-model.number="campaign.bottomNavTextSize"
                  type="range"
                  min="9"
                  max="18"
                />
              </label>
            </div>
          </div>

          <div class="rounded-3xl border border-slate-200 bg-white p-4">
            <h3 class="text-base font-black text-slate-900">
              四個按鈕文字與圖示
            </h3>

            <div class="mt-4 grid gap-4">
              <div class="rounded-2xl bg-slate-50 p-3">
                <p class="mb-2 text-xs font-black text-slate-500">
                  第一顆：重置金蛋
                </p>
                <div class="grid grid-cols-[90px_minmax(0,1fr)] gap-2">
                  <label class="admin-field compact">
                    <span>圖示</span>
                    <input v-model="campaign.bottomNavEggIcon" type="text" />
                  </label>
                  <label class="admin-field compact">
                    <span>文字</span>
                    <input v-model="campaign.bottomNavEggText" type="text" />
                  </label>
                </div>
              </div>

              <div class="rounded-2xl bg-slate-50 p-3">
                <p class="mb-2 text-xs font-black text-slate-500">
                  第二顆：分享活動
                </p>
                <div class="grid grid-cols-[90px_minmax(0,1fr)] gap-2">
                  <label class="admin-field compact">
                    <span>圖示</span>
                    <input v-model="campaign.bottomNavShareIcon" type="text" />
                  </label>
                  <label class="admin-field compact">
                    <span>文字</span>
                    <input v-model="campaign.bottomNavShareText" type="text" />
                  </label>
                </div>
              </div>

              <div class="rounded-2xl bg-slate-50 p-3">
                <p class="mb-2 text-xs font-black text-slate-500">
                  第三顆：複製結果
                </p>
                <div class="grid grid-cols-[90px_minmax(0,1fr)] gap-2">
                  <label class="admin-field compact">
                    <span>圖示</span>
                    <input v-model="campaign.bottomNavResultIcon" type="text" />
                  </label>
                  <label class="admin-field compact">
                    <span>文字</span>
                    <input v-model="campaign.bottomNavResultText" type="text" />
                  </label>
                </div>
              </div>

              <div class="rounded-2xl bg-slate-50 p-3">
                <p class="mb-2 text-xs font-black text-slate-500">
                  第四顆：官網 / 返回
                </p>
                <div class="grid grid-cols-[90px_minmax(0,1fr)] gap-2">
                  <label class="admin-field compact">
                    <span>圖示</span>
                    <input v-model="campaign.bottomNavWebsiteIcon" type="text" />
                  </label>
                  <label class="admin-field compact">
                    <span>文字</span>
                    <input v-model="campaign.bottomNavWebsiteText" type="text" />
                  </label>
                </div>
                <p class="mt-2 text-xs font-bold text-slate-400">
                  這顆按鈕會使用「基本文字」裡設定的右上網站連結網址；若未設定網址，會執行返回。
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          v-if="activeSection === 'eggLogs'"
          class="space-y-4"
        >
          <div class="rounded-3xl bg-slate-50 p-4">
            <h2 class="text-lg font-black text-slate-900">
              砸蛋紀錄管理
            </h2>
            <p class="mt-1 text-sm leading-6 text-slate-500">
              讀取前台最近砸蛋紀錄，可篩選、匯出 CSV、清除紀錄。紀錄目前保存在同一瀏覽器 localStorage。
            </p>
          </div>

          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p class="text-xs font-bold text-slate-400">全部紀錄</p>
              <p class="mt-1 text-3xl font-black text-slate-900">{{ eggPlayLogStats.total }}</p>
            </div>

            <div class="rounded-3xl bg-emerald-50 p-4 shadow-sm ring-1 ring-emerald-100">
              <p class="text-xs font-bold text-emerald-500">中獎</p>
              <p class="mt-1 text-3xl font-black text-emerald-700">{{ eggPlayLogStats.win }}</p>
            </div>

            <div class="rounded-3xl bg-slate-100 p-4 shadow-sm ring-1 ring-slate-200">
              <p class="text-xs font-bold text-slate-500">未中獎</p>
              <p class="mt-1 text-3xl font-black text-slate-700">{{ eggPlayLogStats.lose }}</p>
            </div>
          </div>

          <div class="rounded-3xl border border-indigo-100 bg-indigo-50 p-4">
            <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 class="text-base font-black text-indigo-900">
                  紀錄更新與匯出
                </h3>
                <p class="mt-1 text-xs font-black text-indigo-600">
                  {{ autoRefreshEggPlayLogs ? `自動更新中，每 ${eggPlayLogRefreshSeconds} 秒刷新` : '已關閉自動更新' }}
                  <span v-if="lastEggPlayLogRefreshAt">｜最後更新：{{ lastEggPlayLogRefreshAt }}</span>
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-indigo-700 ring-1 ring-indigo-100"
                  @click="refreshEggPlayLogs"
                >
                  重新讀取
                </button>

                <button
                  type="button"
                  class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-indigo-700 ring-1 ring-indigo-100"
                  @click="exportEggPlayLogsCsv"
                >
                  匯出 CSV
                </button>

                <button
                  type="button"
                  class="rounded-2xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 ring-1 ring-rose-100"
                  @click="clearEggPlayLogs"
                >
                  清除紀錄
                </button>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-1 gap-3 rounded-2xl bg-white/70 p-3 md:grid-cols-[1fr_180px]">
              <label class="admin-toggle">
                <input v-model="autoRefreshEggPlayLogs" type="checkbox" />
                <span>自動更新砸蛋紀錄</span>
              </label>

              <label class="admin-field compact">
                <span>刷新秒數</span>
                <input
                  v-model.number="eggPlayLogRefreshSeconds"
                  type="number"
                  min="1"
                  max="60"
                  @change="startEggPlayLogAutoRefresh"
                />
              </label>
            </div>
          </div>

          <div class="rounded-3xl border border-slate-200 bg-white p-4">
            <div class="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px]">
              <label class="admin-field">
                <span>搜尋紀錄</span>
                <input
                  v-model="eggPlayLogSearchText"
                  type="text"
                  placeholder="可搜尋獎項名稱、金蛋號碼或時間"
                />
              </label>

              <label class="admin-field">
                <span>狀態篩選</span>
                <select v-model="eggPlayLogStatusFilter">
                  <option value="all">全部紀錄</option>
                  <option value="win">只看中獎</option>
                  <option value="lose">只看未中獎</option>
                </select>
              </label>
            </div>

            <div
              v-if="filteredEggPlayLogs.length"
              class="mt-4 max-h-[560px] space-y-2 overflow-y-auto pr-1"
            >
              <article
                v-for="item in filteredEggPlayLogs"
                :key="item.id"
                class="rounded-2xl border border-slate-100 bg-slate-50 p-3"
              >
                <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p class="text-sm font-black text-slate-900">
                      {{ item.prizeName || '未知獎項' }}
                    </p>
                    <p class="mt-1 text-xs font-bold text-slate-500">
                      金蛋 {{ item.eggNumber || '-' }}｜{{ item.createdAt || '未記錄時間' }}
                    </p>
                    <p class="mt-1 text-xs font-bold text-slate-400">
                      紀錄 ID：{{ item.id }}
                    </p>
                  </div>

                  <span
                    class="rounded-full px-3 py-1 text-xs font-black"
                    :class="item.prizeType === 'lose' ? 'bg-slate-200 text-slate-700' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'"
                  >
                    {{ item.prizeType === 'lose' ? '未中獎' : '中獎' }}
                  </span>
                </div>
              </article>
            </div>

            <p
              v-else
              class="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-bold text-slate-500"
            >
              目前沒有符合條件的砸蛋紀錄。
            </p>
          </div>
        </section>

        <section
          v-if="activeSection === 'serial'"
          class="space-y-4"
        >
          <div class="rounded-3xl border border-indigo-100 bg-indigo-50 p-4">
            <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 class="text-base font-black text-indigo-900">
                  前台序號兌換紀錄
                </h3>
                <p class="mt-1 text-xs font-bold text-indigo-700/80">
                  會記錄成功與失敗的序號兌換嘗試，方便查詢是否有人重複輸入或亂猜序號。
                </p>
                <p class="mt-1 text-xs font-black text-indigo-600">
                  {{ autoRefreshRedeemLogs ? `自動更新中，每 ${redeemLogRefreshSeconds} 秒刷新` : '已關閉自動更新' }}
                  <span v-if="lastRedeemLogRefreshAt">｜最後更新：{{ lastRedeemLogRefreshAt }}</span>
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-indigo-700 ring-1 ring-indigo-100"
                  @click="refreshSerialRedeemLogs"
                >
                  重新讀取
                </button>

                <button
                  type="button"
                  class="rounded-2xl bg-white px-3 py-2 text-xs font-black text-indigo-700 ring-1 ring-indigo-100"
                  @click="exportSerialRedeemLogsCsv"
                >
                  匯出詳細 CSV
                </button>

                <button
                  type="button"
                  class="rounded-2xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 ring-1 ring-rose-100"
                  @click="clearSerialRedeemLogs"
                >
                  清除紀錄
                </button>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-1 gap-3 rounded-2xl bg-white/70 p-3 md:grid-cols-[1fr_180px]">
              <label class="admin-toggle">
                <input v-model="autoRefreshRedeemLogs" type="checkbox" />
                <span>自動更新兌換紀錄</span>
              </label>

              <label class="admin-field compact">
                <span>刷新秒數</span>
                <input
                  v-model.number="redeemLogRefreshSeconds"
                  type="number"
                  min="1"
                  max="60"
                  @change="startRedeemLogAutoRefresh"
                />
              </label>
            </div>

            <div
              v-if="recentSerialRedeemLogs.length"
              class="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1"
            >
              <div
                v-for="log in recentSerialRedeemLogs"
                :key="log.id"
                class="rounded-2xl bg-white px-3 py-2 text-xs font-bold text-slate-600"
              >
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="font-mono font-black text-slate-900">{{ log.code }}</span>
                  <span
                    class="rounded-full px-2 py-1 text-[10px] font-black"
                    :class="log.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'"
                  >
                    {{ log.status === 'success' ? '成功' : '失敗' }}
                  </span>
                </div>
                <p class="mt-1">
                  時間：{{ log.createdAtText }}｜原因：{{ log.reason }}｜增加：{{ log.rewardChance || 0 }} 次
                </p>
                <p class="mt-1 text-slate-400">
                  紀錄 ID：{{ log.id }}
                </p>
              </div>
            </div>

            <p
              v-else
              class="mt-4 rounded-2xl border border-dashed border-indigo-200 bg-white/70 px-4 py-6 text-center text-sm font-bold text-indigo-500"
            >
              目前尚無前台兌換紀錄。
            </p>
          </div>
        </section>

        <section
          v-if="activeSection === 'display'"
          class="space-y-4"
        >
          <div class="rounded-3xl bg-slate-50 p-4">
            <h2 class="text-lg font-black text-slate-900">
              跑馬燈與獎品展示
            </h2>
            <p class="mt-1 text-sm leading-6 text-slate-500">
              控制前台金蛋區上方跑馬燈與下方 PRIZE 獎品展示列，避免資訊太多或顏色不符合活動主題。
            </p>
          </div>

          <div class="rounded-3xl border border-yellow-100 bg-yellow-50 p-4">
            <h3 class="text-base font-black text-yellow-800">
              跑馬燈設定
            </h3>

            <div class="mt-4 space-y-4">
              <label class="admin-toggle">
                <input v-model="campaign.showMarqueeSection" type="checkbox" />
                <span>顯示跑馬燈</span>
              </label>

              <label class="admin-field">
                <span>自訂跑馬燈文字</span>
                <input
                  v-model="campaign.marqueeCustomText"
                  type="text"
                  placeholder="留空時會自動顯示最新砸蛋紀錄"
                />
              </label>

              <label class="admin-field">
                <span>跑馬燈速度：{{ campaign.marqueeSpeed }} 秒</span>
                <input
                  v-model.number="campaign.marqueeSpeed"
                  type="range"
                  min="6"
                  max="28"
                />
              </label>

              <div class="grid grid-cols-2 gap-3">
                <label class="admin-color-field">
                  <span>跑馬燈背景色</span>
                  <input v-model="campaign.marqueeBgColor" type="color" />
                </label>

                <label class="admin-color-field">
                  <span>跑馬燈文字色</span>
                  <input v-model="campaign.marqueeTextColor" type="color" />
                </label>
              </div>
            </div>
          </div>

          <div class="rounded-3xl border border-amber-100 bg-amber-50 p-4">
            <h3 class="text-base font-black text-amber-800">
              獎品展示列設定
            </h3>

            <div class="mt-4 space-y-4">
              <label class="admin-toggle">
                <input v-model="campaign.showPrizeShelfSection" type="checkbox" />
                <span>顯示 PRIZE 獎品展示列</span>
              </label>

              <div class="grid grid-cols-2 gap-3">
                <label class="admin-field">
                  <span>左側標題</span>
                  <input v-model="campaign.prizeShelfTitle" type="text" />
                </label>

                <label class="admin-field">
                  <span>右側標題</span>
                  <input v-model="campaign.prizeShelfSubTitle" type="text" />
                </label>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <label class="admin-color-field">
                  <span>展示列背景色</span>
                  <input v-model="campaign.prizeShelfBgColor" type="color" />
                </label>

                <label class="admin-color-field">
                  <span>展示列文字色</span>
                  <input v-model="campaign.prizeShelfTextColor" type="color" />
                </label>

                <label class="admin-color-field">
                  <span>獎品卡上方色</span>
                  <input v-model="campaign.prizeShelfItemBgTop" type="color" />
                </label>

                <label class="admin-color-field">
                  <span>獎品卡下方色</span>
                  <input v-model="campaign.prizeShelfItemBgBottom" type="color" />
                </label>
              </div>
            </div>
          </div>
        </section>

        <section
          v-if="activeSection === 'result'"
          class="space-y-4"
        >
          <div class="rounded-3xl bg-slate-50 p-4">
            <h2 class="text-lg font-black text-slate-900">
              中獎結果彈窗
            </h2>
            <p class="mt-1 text-sm leading-6 text-slate-500">
              控制玩家敲開金蛋後顯示的結果視窗樣式、顏色、按鈕文字與功能開關。
            </p>
          </div>

          <div class="rounded-3xl border border-yellow-100 bg-yellow-50 p-4">
            <h3 class="text-base font-black text-yellow-800">
              結果圖片與大小
            </h3>
            <p class="mt-1 text-xs font-bold leading-5 text-yellow-700/80">
              可貼上全域結果圖片。若獎項本身有圖片，會優先顯示獎項圖片；兩者都沒有才使用 emoji。
            </p>

            <label class="admin-field mt-4">
              <span>結果圖片 URL / 上傳後圖片資料</span>
              <input
                v-model="campaign.resultImageUrl"
                type="text"
                placeholder="例如：https://example.com/win.png，或使用下方上傳"
              />
            </label>

            <div class="mt-3 grid grid-cols-2 gap-3">
              <label class="admin-upload-button">
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleResultImageUpload"
                />
                上傳結果圖片
              </label>

              <button
                type="button"
                class="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 ring-1 ring-rose-100"
                @click="clearResultImage"
              >
                清除結果圖片
              </button>
            </div>

            <div
              v-if="campaign.resultImageUrl"
              class="mt-3 overflow-hidden rounded-3xl border border-yellow-200 bg-white p-2"
            >
              <img
                :src="campaign.resultImageUrl"
                alt="結果圖片預覽"
                class="h-32 w-full rounded-2xl object-cover"
              />
            </div>

            <div class="mt-4 grid grid-cols-2 gap-3">
              <label class="admin-field">
                <span>圖片 / 圖示大小：{{ campaign.resultIconSize }}px</span>
                <input
                  v-model.number="campaign.resultIconSize"
                  type="range"
                  min="64"
                  max="150"
                />
              </label>

              <label class="admin-field">
                <span>emoji 圖示文字大小：{{ campaign.resultIconTextSize }}px</span>
                <input
                  v-model.number="campaign.resultIconTextSize"
                  type="range"
                  min="28"
                  max="82"
                />
              </label>
            </div>
          </div>

          <div class="rounded-3xl border border-red-100 bg-red-50 p-4">
            <h3 class="text-base font-black text-red-800">
              彈窗顏色
            </h3>

            <div class="mt-4 grid grid-cols-2 gap-3">
              <label class="admin-color-field">
                <span>彈窗上方色</span>
                <input v-model="campaign.resultModalBgFrom" type="color" />
              </label>

              <label class="admin-color-field">
                <span>彈窗下方色</span>
                <input v-model="campaign.resultModalBgTo" type="color" />
              </label>

              <label class="admin-color-field">
                <span>彈窗邊框色</span>
                <input v-model="campaign.resultModalBorderColor" type="color" />
              </label>

              <label class="admin-color-field">
                <span>獎品圖示背景</span>
                <input v-model="campaign.resultIconBgColor" type="color" />
              </label>

              <label class="admin-color-field">
                <span>獎品圖示文字</span>
                <input v-model="campaign.resultIconTextColor" type="color" />
              </label>

              <label class="admin-color-field">
                <span>結果標題顏色</span>
                <input v-model="campaign.resultTitleColor" type="color" />
              </label>

              <label class="admin-color-field">
                <span>結果說明顏色</span>
                <input v-model="campaign.resultDescriptionColor" type="color" />
              </label>
            </div>
          </div>

          <div class="rounded-3xl border border-slate-200 bg-white p-4">
            <h3 class="text-base font-black text-slate-900">
              彈窗文字大小
            </h3>

            <div class="mt-4 space-y-4">
              <label class="admin-field">
                <span>狀態標籤文字大小：{{ campaign.resultBadgeTextSize }}px</span>
                <input
                  v-model.number="campaign.resultBadgeTextSize"
                  type="range"
                  min="10"
                  max="20"
                />
              </label>

              <label class="admin-field">
                <span>結果標題文字大小：{{ campaign.resultTitleTextSize }}px</span>
                <input
                  v-model.number="campaign.resultTitleTextSize"
                  type="range"
                  min="16"
                  max="40"
                />
              </label>

              <label class="admin-field">
                <span>結果說明文字大小：{{ campaign.resultDescriptionTextSize }}px</span>
                <input
                  v-model.number="campaign.resultDescriptionTextSize"
                  type="range"
                  min="12"
                  max="24"
                />
              </label>

              <div class="grid grid-cols-2 gap-3">
                <label class="admin-field">
                  <span>主要按鈕文字大小：{{ campaign.resultPrimaryButtonTextSize }}px</span>
                  <input
                    v-model.number="campaign.resultPrimaryButtonTextSize"
                    type="range"
                    min="12"
                    max="22"
                  />
                </label>

                <label class="admin-field">
                  <span>複製按鈕文字大小：{{ campaign.resultCopyButtonTextSize }}px</span>
                  <input
                    v-model.number="campaign.resultCopyButtonTextSize"
                    type="range"
                    min="12"
                    max="22"
                  />
                </label>
              </div>
            </div>
          </div>

          <div class="rounded-3xl border border-yellow-100 bg-yellow-50 p-4">
            <h3 class="text-base font-black text-yellow-800">
              彈窗按鈕與功能
            </h3>

            <div class="mt-4 space-y-4">
              <label class="admin-field">
                <span>主要按鈕文字</span>
                <input v-model="campaign.resultPrimaryButtonText" type="text" />
              </label>

              <label class="admin-field">
                <span>複製按鈕文字</span>
                <input v-model="campaign.resultCopyButtonText" type="text" />
              </label>

              <label class="admin-toggle">
                <input v-model="campaign.showResultCopyButton" type="checkbox" />
                <span>顯示複製結果按鈕</span>
              </label>

              <label class="admin-toggle">
                <input v-model="campaign.showResultShareButton" type="checkbox" />
                <span>次數用完時顯示分享增加機會</span>
              </label>
            </div>
          </div>
        </section>

        <section
          v-if="activeSection === 'effects'"
          class="space-y-4"
        >
          <div class="rounded-3xl bg-slate-50 p-4">
            <h2 class="text-lg font-black text-slate-900">
              音效與特效
            </h2>
            <p class="mt-1 text-sm text-slate-500">
              調整中獎彩帶、金粉、音效連結與特效數量。
            </p>
          </div>

          <label class="admin-toggle">
            <input v-model="campaign.enableWinConfetti" type="checkbox" />
            <span>開啟中獎彩帶</span>
          </label>

          <label class="admin-toggle">
            <input v-model="campaign.enableGoldRain" type="checkbox" />
            <span>開啟金粉掉落</span>
          </label>

          <label class="admin-toggle">
            <input v-model="campaign.enableHammerSound" type="checkbox" />
            <span>開啟敲擊音效</span>
          </label>

          <label class="admin-field">
            <span>敲擊音效 URL</span>
            <input v-model="campaign.hammerSoundUrl" type="text" placeholder="https://..." />
          </label>

          <label class="admin-field">
            <span>敲擊音量 {{ campaign.hammerSoundVolume }}</span>
            <input v-model.number="campaign.hammerSoundVolume" type="range" min="0" max="100" />
          </label>

          <label class="admin-toggle">
            <input v-model="campaign.enableWinSound" type="checkbox" />
            <span>開啟中獎音效</span>
          </label>

          <label class="admin-field">
            <span>中獎音效 URL</span>
            <input v-model="campaign.winSoundUrl" type="text" placeholder="https://..." />
          </label>

          <label class="admin-field">
            <span>中獎音量 {{ campaign.winSoundVolume }}</span>
            <input v-model.number="campaign.winSoundVolume" type="range" min="0" max="100" />
          </label>

          <label class="admin-field">
            <span>彩帶數量 {{ campaign.confettiCount }}</span>
            <input v-model.number="campaign.confettiCount" type="range" min="0" max="120" />
          </label>

          <label class="admin-field">
            <span>金粉數量 {{ campaign.goldRainCount }}</span>
            <input v-model.number="campaign.goldRainCount" type="range" min="0" max="140" />
          </label>

          <label class="admin-field">
            <span>特效秒數 {{ campaign.winEffectDuration }}</span>
            <input v-model.number="campaign.winEffectDuration" type="range" min="2" max="10" />
          </label>
        </section>

        <section
          v-if="activeSection === 'rules'"
          class="space-y-4"
        >
          <div class="rounded-3xl bg-slate-50 p-4">
            <h2 class="text-lg font-black text-slate-900">
              規則與獎品說明
            </h2>
            <p class="mt-1 text-sm text-slate-500">
              修改前台下方的活動規則與兌換說明，也可以整個區塊關閉，讓前台更乾淨。
            </p>
          </div>

          <div class="rounded-3xl border border-yellow-100 bg-yellow-50 p-4">
            <h3 class="text-base font-black text-yellow-800">
              前台區塊顯示開關
            </h3>
            <p class="mt-1 text-xs font-bold leading-5 text-yellow-700/80">
              關閉後，前台會直接隱藏整個區塊；不是只有收合。
            </p>

            <div class="mt-4 space-y-3">
              <label class="admin-toggle">
                <input v-model="campaign.showRecentLogsSection" type="checkbox" />
                <span>顯示最近砸蛋紀錄</span>
              </label>

              <label class="admin-toggle">
                <input v-model="campaign.showRuleSection" type="checkbox" />
                <span>顯示活動規則</span>
              </label>

              <label class="admin-toggle">
                <input v-model="campaign.showPrizeInfoSection" type="checkbox" />
                <span>顯示獎品說明</span>
              </label>
            </div>
          </div>

          <div class="rounded-3xl border border-slate-200 bg-white p-4">
            <h3 class="text-base font-black text-slate-900">
              前台預設展開狀態
            </h3>
            <p class="mt-1 text-xs font-bold leading-5 text-slate-500">
              開啟後，玩家進入前台時該區塊會自動展開；關閉則預設收合。
            </p>

            <div class="mt-4 space-y-3">
              <label class="admin-toggle">
                <input
                  v-model="campaign.defaultRecentLogsOpen"
                  type="checkbox"
                  :disabled="!campaign.showRecentLogsSection"
                />
                <span>最近砸蛋紀錄預設展開</span>
              </label>

              <label class="admin-toggle">
                <input
                  v-model="campaign.defaultRuleOpen"
                  type="checkbox"
                  :disabled="!campaign.showRuleSection"
                />
                <span>活動規則預設展開</span>
              </label>

              <label class="admin-toggle">
                <input
                  v-model="campaign.defaultPrizeInfoOpen"
                  type="checkbox"
                  :disabled="!campaign.showPrizeInfoSection"
                />
                <span>獎品說明預設展開</span>
              </label>
            </div>
          </div>

          <label class="admin-field">
            <span>規則標題</span>
            <input v-model="campaign.ruleTitle" type="text" />
          </label>

          <label class="admin-field">
            <span>規則內容</span>
            <textarea v-model="campaign.ruleContent" rows="6" />
          </label>

          <label class="admin-field">
            <span>獎品說明標題</span>
            <input v-model="campaign.prizeInfoTitle" type="text" />
          </label>

          <label class="admin-field">
            <span>獎品說明內容</span>
            <textarea v-model="campaign.prizeInfoContent" rows="6" />
          </label>
        </section>

        <div class="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            class="rounded-2xl bg-yellow-400 px-4 py-3 text-sm font-black text-red-700"
            @click="syncToFrontNow"
          >
            儲存同步
          </button>

          <button
            type="button"
            class="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-200"
            @click="exportSettings"
          >
            匯出 JSON
          </button>

          <button
            type="button"
            class="col-span-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 ring-1 ring-rose-100"
            @click="resetAllSettings"
          >
            還原預設設定
          </button>
        </div>
      </aside>

      <section class="min-h-[calc(100vh-8rem)] rounded-[2rem] border border-slate-200 bg-slate-900 p-4 shadow-sm">
        <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.22em] text-yellow-300">
              Live Preview
            </p>
            <h2 class="text-xl font-black text-white">
              前台即時預覽
            </h2>
          </div>

          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="rounded-2xl bg-white/10 px-3 py-2 text-white">
              <p class="text-[10px] font-bold text-slate-300">獎項</p>
              <p class="text-lg font-black">{{ enabledPrizeCount }}</p>
            </div>
            <div class="rounded-2xl bg-white/10 px-3 py-2 text-white">
              <p class="text-[10px] font-bold text-slate-300">中獎</p>
              <p class="text-lg font-black">{{ winPrizeCount }}</p>
            </div>
            <div class="rounded-2xl bg-white/10 px-3 py-2 text-white">
              <p class="text-[10px] font-bold text-slate-300">總權重</p>
              <p class="text-lg font-black">{{ probabilityTotal }}</p>
            </div>
          </div>
        </div>

        <div class="mx-auto h-[calc(100vh-13rem)] max-w-[430px] overflow-hidden rounded-[2rem] border-[10px] border-slate-800 bg-black shadow-2xl">
          <!-- 第 381 批：右側預覽是 iframe，需靠 previewRefreshKey 重新掛載讀 localStorage。 -->
          <iframe
            :key="previewRefreshKey"
            :src="previewUrl"
            title="砸金蛋前台預覽"
            class="h-full w-full bg-white"
          />
        </div>

        <p class="mt-4 text-center text-xs font-bold text-slate-400">
          修改左側設定後會自動儲存並同步。若右側沒有變化，請按「重新整理預覽」。
        </p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.admin-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.admin-field span,
.admin-color-field span {
  color: #475569;
  font-size: 13px;
  font-weight: 900;
}

.admin-field input,
.admin-field select,
.admin-field textarea {
  width: 100%;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 11px 13px;
  color: #0f172a;
  font-size: 14px;
  font-weight: 700;
  outline: none;
}

.admin-field input:focus,
.admin-field select:focus,
.admin-field textarea:focus {
  border-color: #facc15;
  box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.18);
}

.admin-field.compact input,
.admin-field.compact select {
  padding: 9px 11px;
}

.admin-color-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 12px;
}

.admin-color-field input {
  height: 46px;
  width: 100%;
  cursor: pointer;
  border: 0;
  background: transparent;
}

.admin-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 18px;
  background: #f8fafc;
  padding: 13px;
  color: #334155;
  font-size: 14px;
  font-weight: 900;
}

.admin-toggle input {
  height: 18px;
  width: 18px;
  accent-color: #eab308;
}



.admin-import-upload-button {
  display: flex;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: #0891b2;
  padding: 12px 16px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 900;
  text-align: center;
  box-shadow: 0 8px 18px rgba(8, 145, 178, 0.18);
  transition:
    transform 0.18s ease,
    background 0.18s ease;
}

.admin-import-upload-button:hover {
  transform: translateY(-1px);
  background: #06b6d4;
}


.admin-upload-button {
  display: flex;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: #facc15;
  padding: 12px 14px;
  color: #991b1b;
  font-size: 14px;
  font-weight: 900;
  text-align: center;
  transition:
    transform 0.18s ease,
    background 0.18s ease;
}

.admin-upload-button:hover {
  transform: translateY(-1px);
  background: #fde047;
}

.admin-upload-button.compact {
  border-radius: 14px;
  padding: 9px 10px;
  font-size: 12px;
}


.admin-small-button {
  border-radius: 14px;
  background: #f1f5f9;
  padding: 9px 8px;
  color: #334155;
  font-size: 12px;
  font-weight: 900;
  transition: background 0.18s ease;
}

.admin-small-button:hover:not(:disabled) {
  background: #e2e8f0;
}

.admin-small-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.admin-small-button.danger {
  background: #fff1f2;
  color: #be123c;
}

.admin-toast-enter-active,
.admin-toast-leave-active {
  transition: all 0.22s ease;
}

.admin-toast-enter-from,
.admin-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -12px);
}
</style>
