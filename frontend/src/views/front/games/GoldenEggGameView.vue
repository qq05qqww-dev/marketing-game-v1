// Multi Game Platform V2.3 Tenant Edition
// 第 90401～90800 批：金蛋正式玩家序號驗證後可敲擊防呆修正版
//
// 覆蓋位置：
// frontend/src/views/front/games/GoldenEggGameView.vue
//
// 修正重點：
// 1. 正式玩家頁輸入序號成功後，不再被前端本地獎項庫存判斷擋住。
// 2. 正式 GOLDEN_EGG 抽獎由後端 Draw Engine 依後台 GameConfig 百分比與庫存正式計算。
// 3. 前端只負責序號成功後允許點金蛋、送出 play API、顯示後端回傳結果。
// 4. 「目前獎品已抽完」只保留給離線/模板本地模擬；正式玩家頁由後端回覆真實錯誤。

<script setup>
/**
 * Multi Game Platform V2.3 第 89601～90000 批：金蛋平台模板與商家活動預覽隔離修正版
 *
 * 修正重點：
 * 1. 砸金蛋即使沒有上傳音效網址，也會使用 Web Audio 產生敲擊、裂開、成功提示聲。
 * 2. 點擊金蛋會有連續敲擊音、裂開音與手機震動。
 * 3. 中獎會有短促上揚提示音；未中獎也有柔和收尾音。
 * 4. 離開頁面會停止音效，不影響正式 draw-engine / 序號扣次數。
 */
/**
 * Multi Game Platform V2.3 第 27101～27500 批：三遊戲正式資料庫遠端玩家串接版｜
 * 金蛋正式玩家頁 GameConfig settings 完整套用與獎品同步版
 *
 * 本批定位：
 * 1. 延續第 4001～4400 批金蛋正式上線後監控、部署交付與營運維護完整收斂版。
 * 1-1. 正式 /play/:tenantSlug/golden-egg 會讀 PostgreSQL Campaign / GameConfig / SerialCode / PlayRecord / RewardRecord。
 * 2. 正式金蛋玩家頁改回真正玩家砸金蛋畫面。
 * 3. ?legacyEgg=1 保留最高優先緊急 fallback。
 * 4. ?commonEgg=1 測試區保留 CommonGamePlayBoard placeholder / 測試用途。
 * 5. verify / play API guard 不放寬。
 * 6. 不修改 router / DB schema / 抽獎核心。
 * 7. 本批重點是正式上線後監控、部署交付、rollback SOP、商家客服交接與長期維護。
 *
 * 第 4001～4050 批：
 * - 金蛋正式上線後監控 summary。
 * - 正式頁 / commonEgg / legacyEgg 三路線監控。
 * - route availability、render crash、fallback 可用性檢查。
 *
 * 第 4051～4100 批：
 * - verify / play guard、結果回填、錯誤提示與兌獎提示觀測。
 * - 玩家操作流程、等待狀態、中獎結果顯示回歸。
 *
 * 第 4101～4150 批：
 * - 手機版 / 平板 / 桌機 UX 收斂。
 * - 正式入口提示、結果卡片、兌獎卡片、客服提示整理。
 *
 * 第 4151～4200 批：
 * - rollback SOP、legacyEgg 緊急回退、異常回報流程。
 * - 商家、客服、內部維護人員處理流程。
 *
 * 第 4201～4250 批：
 * - 部署指令、PowerShell、frontend build、backend health check、Git / Render 檢查。
 * - 正式網址、commonEgg 測試區、legacyEgg 回退三路線驗收。
 *
 * 第 4251～4300 批：
 * - 商家交付文件、客服話術、玩家 FAQ、兌獎流程。
 * - 序號不能用、敲蛋沒反應、中獎結果查不到、領獎問題等提示。
 *
 * 第 4301～4350 批：
 * - 上線後觀測指標與後台報表銜接。
 * - verify 成功率、play 成功率、錯誤率、兌獎率、商家回報、玩家紀錄。
 *
 * 第 4351～4400 批：
 * - 長期維護、版本封存、多遊戲共用模組擴展銜接。
 * - 每日 / 每週 / 每月巡檢節奏。
 * - 金蛋正式上線後完整營運維護穩定備份。
 *
 * 正式路線：
 * - /play/:tenantSlug/golden-egg 與 /games/golden-egg 預設顯示真正玩家砸金蛋畫面。
 *
 * 回退路線：
 * - /games/golden-egg?legacyEgg=1 顯示原本金蛋 fallback。
 *
 * 測試區：
 * - /games/golden-egg?commonEgg=1 保留 commonEgg 測試區。
 */

import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CommonGamePlayBoard from '../../../components/common-game/CommonGamePlayBoard.vue'
import {
  getCampaignDetailApi,
  getCampaignGameConfigApi,
  getTenantGoldenEggCampaignApi,
  playDrawEngineCampaignApi,
  verifyDrawEngineSerialApi
} from '../../../api/campaign.js'

const router = useRouter()
const route = useRoute()

const isAdminMode = computed(() => {
  return route.query?.mode === 'admin' || route.query?.preview !== undefined || route.query?.adminPreview !== undefined
})

const isPlatformTemplatePreviewMode = computed(() => {
  const mode = String(route.query?.mode || route.query?.templateMode || '').trim().toLowerCase()

  return Boolean(
    route.query?.templatePreview === '1' ||
      route.query?.platformTemplate === '1' ||
      (mode === 'admin' && !route.query?.campaignId && !route.params?.tenantSlug && !route.query?.tenantSlug)
  )
})

const isLegacyEggRoute = computed(() => {
  return route.query.legacyEgg === '1'
})

const isCommonEggRoute = computed(() => {
  return route.query.commonEgg === '1' && !isLegacyEggRoute.value
})

const isEggDryRunRoute = computed(() => {
  return isCommonEggRoute.value && route.query.eggDryRun === '1'
})

const isEggVerifyApiPreviewRoute = computed(() => {
  return isEggDryRunRoute.value && route.query.eggVerifyApi === '1'
})

const isEggPlayApiPreviewRoute = computed(() => {
  return isEggDryRunRoute.value && route.query.eggPlayApi === '1'
})

const isEggVerifySendRoute = computed(() => {
  return isEggVerifyApiPreviewRoute.value && route.query.eggVerifySend === '1'
})

const isEggConfirmVerifyRoute = computed(() => {
  return isEggVerifySendRoute.value && route.query.eggConfirmVerify === '1'
})

const isEggLocalVerifySwitchRoute = computed(() => {
  return isEggConfirmVerifyRoute.value && route.query.eggLocalVerifySwitch === '1'
})

const isEggPlaySendRoute = computed(() => {
  return isEggPlayApiPreviewRoute.value && route.query.eggSendPlayApi === '1'
})

const isEggConfirmPlayRoute = computed(() => {
  return isEggPlaySendRoute.value && route.query.eggConfirmPlay === '1'
})

const isEggLocalPlaySwitchRoute = computed(() => {
  return isEggConfirmPlayRoute.value && route.query.eggLocalPlaySwitch === '1'
})

const isEggFormalDryRunRoute = computed(() => {
  return route.query.eggFormalDryRun === '1' && !isLegacyEggRoute.value
})

const isEggFormalCommonRoute = computed(() => {
  return isEggFormalDryRunRoute.value && route.query.eggFormalCommon === '1'
})

const isEggFormalGrayRoute = computed(() => {
  return isEggFormalCommonRoute.value && route.query.eggFormalGray === '1'
})

const isEggFormalCanaryRoute = computed(() => {
  return isEggFormalGrayRoute.value && route.query.eggFormalCanary === '1'
})

const isEggFormalApplyRoute = computed(() => {
  return isEggFormalCanaryRoute.value && route.query.eggFormalApply === '1'
})

const isEggFormalCanaryActualDisplayRoute = computed(() => {
  return isEggFormalApplyRoute.value && !isLegacyEggRoute.value
})

const isEggFormalLiveApplyPreAcceptanceRoute = computed(() => {
  return isEggFormalCanaryActualDisplayRoute.value && route.query.eggLivePreAccept === '1'
})

const eggFormalRouteMode = computed(() => {
  if (isLegacyEggRoute.value) return 'legacy-fallback'
  if (isEggFormalLiveApplyPreAcceptanceRoute.value) return 'formal-live-pre-acceptance'
  if (isEggFormalCanaryActualDisplayRoute.value) return 'formal-canary-actual-display'
  if (isEggFormalCanaryRoute.value) return 'formal-canary-preview'
  if (isEggFormalGrayRoute.value) return 'formal-gray-preview'
  if (isEggFormalCommonRoute.value) return 'formal-common-dry-run'
  if (isEggFormalDryRunRoute.value) return 'formal-dry-run'
  if (isCommonEggRoute.value) return 'commonEgg-test-area'
  return 'formal-original'
})

const showFormalEggCanaryCommonBoard = computed(() => {
  return isEggFormalCanaryActualDisplayRoute.value
})

const isEggFormalLiveAppliedDefault = computed(() => {
  // 第 23101～23500 批修正：
  // 正式玩家頁不能預設顯示 CommonGamePlayBoard placeholder / post-live debug 區塊。
  // 只有 commonEgg=1 或完整 canary 測試旗標才允許顯示共用模組測試區。
  return false
})

const showFormalEggCommonBoardByDefault = computed(() => {
  return false
})

const shouldShowEggCommonGamePlayBoard = computed(() => {
  return showCommonEggTestArea.value || showFormalEggCanaryCommonBoard.value
})

const shouldShowLegacyEggOriginalPage = computed(() => {
  return isLegacyEggRoute.value
})

const eggLiveApplyRouteMode = computed(() => {
  if (isLegacyEggRoute.value) return 'legacy-egg-fallback'
  if (isCommonEggRoute.value) return 'commonEgg-test-area'
  if (showFormalEggCanaryCommonBoard.value) return 'formal-canary-common-board'
  return 'formal-player-original'
})

const commonEggPostLiveOpsSummary = computed(() => {
  return {
    batch: '第 4001～4400 批',
    title: '金蛋正式上線後監控、部署交付與營運維護完整收斂版',
    formalLiveApplied: true,
    routeMode: eggLiveApplyRouteMode.value,
    formalUrl: '/games/golden-egg',
    testUrl: '/games/golden-egg?commonEgg=1',
    rollbackUrl: '/games/golden-egg?legacyEgg=1',
    protectedItems: [
      'legacyEgg=1 最高優先緊急回退',
      'commonEgg=1 測試區保留',
      'verify / play API guard 不放寬',
      '不改 router / DB schema / 抽獎核心'
    ],
    acceptanceGroups: [
      '正式頁 / commonEgg / legacyEgg 三路線監控',
      'verify / play guard 與結果回填觀測',
      '手機版 / 平板 / 桌機 UX 收斂',
      'rollback SOP 與異常回報流程',
      'PowerShell / Git / Render 部署檢查',
      '商家交付 / 客服話術 / 玩家 FAQ',
      '後台報表與營運觀測指標銜接',
      '每日 / 每週 / 每月長期維護節奏'
    ]
  }
})

const commonEggPostLiveChecklist = computed(() => {
  return [
    { label: '正式頁', value: '/games/golden-egg', ok: !isLegacyEggRoute.value },
    { label: '測試區', value: '?commonEgg=1 保留', ok: true },
    { label: '緊急回退', value: '?legacyEgg=1 最高優先', ok: true },
    { label: 'API guard', value: 'verify / play 不放寬', ok: true },
    { label: '核心保護', value: 'router / DB / draw-core 不變', ok: true },
    { label: '營運交付', value: '監控 / 部署 / 客服 / 維護已整理', ok: true }
  ]
})

const canSendCommonEggVerifyApi = computed(() => {
  return isCommonEggRoute.value && isEggLocalVerifySwitchRoute.value
})

const canSendCommonEggPlayApi = computed(() => {
  return isCommonEggRoute.value && isEggLocalVerifySwitchRoute.value && isEggLocalPlaySwitchRoute.value
})

const showCommonEggTestArea = computed(() => {
  return isCommonEggRoute.value
})


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
const trafficSource = computed(() => getRouteTrafficSource())
const trafficSourceLabel = computed(() => {
  const source = trafficSource.value

  if (source === 'line') return 'LINE'
  if (source === 'facebook') return 'Facebook'
  if (source === 'instagram') return 'Instagram'
  if (source === 'direct') return '直接開啟'

  return source || '其他來源'
})
const remoteCrackDuration = computed(() => 2.8)

const GOLDEN_EGG_HISTORY_KEY = 'multi_game_platform_golden_egg_history_v1'
const GOLDEN_EGG_ADMIN_STATE_KEY = 'multi_game_platform_golden_egg_admin_state_v1'
const GOLDEN_EGG_ADMIN_SYNC_KEY = 'multi_game_platform_golden_egg_admin_sync_ping_v1'
const GOLDEN_EGG_PLATFORM_TEMPLATE_STATE_KEY = 'multi_game_platform_golden_egg_platform_template_state_v1'
const GOLDEN_EGG_PLATFORM_TEMPLATE_SYNC_KEY = 'multi_game_platform_golden_egg_platform_template_sync_ping_v1'
const GOLDEN_EGG_SERIAL_CODES_KEY = 'multi_game_platform_golden_egg_serial_codes_v1'
const GOLDEN_EGG_SERIAL_REDEEM_LOG_KEY = 'multi_game_platform_golden_egg_serial_redeem_log_v1'

const normalizeScopePart = (value = '', fallback = 'unknown') => {
  const normalized = String(value || '').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-')
  return normalized || fallback
}

const getGoldenEggPreviewScopeMeta = () => {
  if (isPlatformTemplatePreviewMode.value) {
    return {
      mode: 'platform_template',
      key: GOLDEN_EGG_PLATFORM_TEMPLATE_STATE_KEY,
      syncKey: GOLDEN_EGG_PLATFORM_TEMPLATE_SYNC_KEY,
      tenantSlug: '',
      campaignId: '',
      templateId: 'golden-egg'
    }
  }

  const tenantSlug = normalizeScopePart(route.params?.tenantSlug || route.query?.tenantSlug || 'unknown-tenant', 'unknown-tenant')
  const campaignId = normalizeScopePart(route.query?.campaignId || route.query?.onlineCampaignId || route.params?.campaignId || 'draft', 'draft')

  return {
    mode: 'merchant_campaign',
    key: `${GOLDEN_EGG_ADMIN_STATE_KEY}:tenant:${tenantSlug}:campaign:${campaignId}`,
    syncKey: `${GOLDEN_EGG_ADMIN_SYNC_KEY}:tenant:${tenantSlug}:campaign:${campaignId}`,
    tenantSlug,
    campaignId,
    templateId: ''
  }
}

const getGoldenEggAdminStateKey = () => getGoldenEggPreviewScopeMeta().key
const getGoldenEggAdminSyncKey = () => getGoldenEggPreviewScopeMeta().syncKey

const isSavedGoldenEggStateForCurrentScope = (saved = {}) => {
  if (!saved || typeof saved !== 'object') return false
  const savedScope = saved.scope || {}
  const current = getGoldenEggPreviewScopeMeta()

  // 舊資料沒有 scope 時，只允許平台模板預覽讀平台模板舊資料；商家活動不可讀全域舊資料。
  if (!savedScope.mode) return current.mode === 'platform_template'
  if (savedScope.mode !== current.mode) return false
  if (current.mode === 'platform_template') return true

  return String(savedScope.tenantSlug || '') === String(current.tenantSlug || '') &&
    String(savedScope.campaignId || '') === String(current.campaignId || '')
}

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
  chanceText: '請先輸入抽獎序號，驗證成功後即可砸蛋。',
  buttonText: '分享活動',
  shareHint: '請向主辦單位索取抽獎序號，輸入後可增加砸蛋機會。',
  noticeText: '本活動為原創互動版型，可自由替換品牌、獎項與活動內容。',
  activityStartAt: '',
  activityEndAt: '',
  activityNotStartedText: '活動尚未開始，請於指定時間再回來參加。',
  activityEndedText: '活動已結束，感謝你的參與。',
  activityPausedText: '活動暫停中，請稍後再回來參加。',
  activityDraftText: '活動尚未開放，請等待主辦單位公告。',
  activityRunningText: '活動進行中，請選擇一顆金蛋。',
  showActivityTimeSection: false,
  showActivityCountdown: false,
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
  resultWinImageUrl: '',
  resultLoseImageUrl: '',
  resultIconSize: 96,
  resultIconTextSize: 48,
  resultBadgeTextSize: 12,
  resultTitleTextSize: 24,
  resultTitleColor: '#ffffff',
  resultDescriptionTextSize: 14,
  resultDescriptionColor: '#fef3c7',
  resultPrimaryButtonText: '繼續查看',
  resultPrimaryButtonTextSize: 14,
  resultPrimaryButtonBgColor: '#fde047',
  resultPrimaryButtonTextColor: '#991b1b',
  resultCopyButtonText: '複製結果',
  resultCopyButtonTextSize: 14,
  resultCopyButtonBgColor: 'rgba(255,255,255,0.12)',
  resultCopyButtonTextColor: '#ffffff',
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
  serialRedeemSuccessText: '序號驗證成功，請選擇一顆金蛋。',
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
  showBottomNav: false,
  lineBrowserHintCloseButtonText: '我知道了',
  lineBrowserHintCopyButtonText: '複製活動連結',
  lineBrowserHintText: '你目前可能正在 LINE 內建瀏覽器中瀏覽。若畫面、分享或互動功能不穩，請點右上角「⋯」→ 選擇「以瀏覽器開啟」。',
  lineBrowserHintTitle: '建議使用外部瀏覽器開啟',
  showLineBrowserHint: false,
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
  enableWinSound: true,
  winSoundUrl: '',
  winSoundVolume: 70,
  enableHammerSound: true,
  hammerSoundUrl: '',
  hammerSoundVolume: 68,
  winEffectDuration: 5,
  confettiCount: 48,
  goldRainCount: 54,
  ruleTitle: '活動規則',
  ruleContent: '請先輸入主辦單位提供的抽獎序號。\n序號驗證成功後，才會取得可用砸蛋次數。\n每次砸蛋會消耗 1 次序號機會。\n獎項數量有限，送完為止。',
  prizeInfoTitle: '獎品說明',
  prizeInfoContent: '中獎結果會顯示於畫面與最近紀錄。\n實際兌換方式以主辦單位公告為準。\n請保留中獎畫面或截圖作為兌獎依據。',
  // 第 46001～46400 批：玩家前台清潔顯示開關。
  showFrontRules: true,
  showFrontPrizeInfo: true,
  showFrontPrizeShelf: false,
  showFrontHistoryButton: true,
  showFrontRecentRecords: true,
  showFrontShareButton: false,
  showFrontActivityTime: false,
  showFrontActivityCountdown: false,
  showFrontBottomNav: false,
  showFrontDebugInfo: false
})

const player = reactive({
  chances: 0,
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
  if (!isSavedGoldenEggStateForCurrentScope(payload)) return

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

  const saved = safeJsonParse(localStorage.getItem(getGoldenEggAdminStateKey()), null)
  applyGoldenEggAdminState(saved)
}

const frontDisplay = computed(() => {
  const admin = Boolean(isAdminMode.value)

  return {
    showRules: admin || campaign.showFrontRules !== false,
    showPrizeInfo: admin || campaign.showFrontPrizeInfo !== false,
    showPrizeShelf: admin || campaign.showFrontPrizeShelf === true,
    showHistoryButton: admin || campaign.showFrontHistoryButton !== false,
    showRecentRecords: admin || campaign.showFrontRecentRecords === true,
    showShareButton: admin || campaign.showFrontShareButton === true,
    showActivityTime: admin || campaign.showFrontActivityTime === true,
    showActivityCountdown: admin || campaign.showFrontActivityCountdown === true,
    showBottomNav: admin || campaign.showFrontBottomNav === true,
    showDebugInfo: admin || campaign.showFrontDebugInfo === true
  }
})

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

const getSerialVerifyStatusMessage = (result = {}) => {
  const status = String(result?.status || '').toUpperCase()
  const apiMessage = String(result?.message || '').trim()

  if (result?.valid) {
    const remainingChance = Number(
      result?.serialCode?.remainingChance
        ?? result?.serialCode?.rewardChance
        ?? result?.remainingChance
        ?? result?.rewardChance
        ?? 1
    )

    return `序號驗證成功，目前可用 ${Math.max(1, remainingChance)} 次。`
  }

  if (status === 'NOT_FOUND') return '找不到此序號，請確認是否輸入正確或是否為此活動的序號。'
  if (status === 'USED') return '此序號可用次數已用完，請更換新的抽獎序號。'
  if (status === 'DISABLED') return '此序號已停用，請聯絡主辦單位確認。'
  if (status === 'EXPIRED') return '此序號已過期，請更換新的抽獎序號。'
  if (status === 'INVALID') return '序號格式不正確，請重新輸入。'

  return apiMessage || campaign.serialRedeemErrorText || '序號無效、已使用或不存在。'
}

const getSerialVerifyErrorMessage = (error) => {
  const payload = error?.response?.data?.data || error?.response?.data || error?.data || null
  const status = String(payload?.status || '').toUpperCase()

  if (status === 'NOT_FOUND') return '找不到此序號，請確認是否輸入正確或是否為此活動的序號。'
  if (status === 'USED') return '此序號可用次數已用完，請更換新的抽獎序號。'
  if (status === 'DISABLED') return '此序號已停用，請聯絡主辦單位確認。'
  if (status === 'EXPIRED') return '此序號已過期，請更換新的抽獎序號。'

  return payload?.message || error?.message || campaign.serialRedeemErrorText || '序號驗證失敗，請稍後再試。'
}



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

  const saved = safeJsonParse(localStorage.getItem(getGoldenEggAdminStateKey()), null)

  return saved?.campaign || null
}

const normalizeRemoteGoldenEggSettings = (apiCampaign = {}) => {
  const rawSettings = apiCampaign?.gameConfig?.settings && typeof apiCampaign.gameConfig.settings === 'object'
    ? apiCampaign.gameConfig.settings
    : {}

  const nestedCampaign = rawSettings?.campaign && typeof rawSettings.campaign === 'object'
    ? rawSettings.campaign
    : {}

  const basicText = rawSettings?.basicText && typeof rawSettings.basicText === 'object'
    ? rawSettings.basicText
    : {}

  const theme = rawSettings?.theme && typeof rawSettings.theme === 'object'
    ? rawSettings.theme
    : {}

  return {
    rawSettings,
    nestedCampaign,
    basicText,
    theme,
    prizeSettings: Array.isArray(rawSettings?.prizes) ? rawSettings.prizes : []
  }
}

const applyRemoteCampaignSettingsToCampaign = (apiCampaign = {}, normalized = {}) => {
  const {
    rawSettings = {},
    nestedCampaign = {},
    basicText = {},
    theme = {}
  } = normalized

  const flatSettings = {
    ...rawSettings
  }

  delete flatSettings.campaign
  delete flatSettings.prizes
  delete flatSettings.basicText
  delete flatSettings.theme
  delete flatSettings.__meta

  Object.assign(campaign, flatSettings)

  if (Object.keys(nestedCampaign).length) {
    Object.assign(campaign, nestedCampaign)
  }

  campaign.pageTitle =
    basicText.pageTitle ||
    nestedCampaign.pageTitle ||
    rawSettings.pageTitle ||
    apiCampaign.title ||
    campaign.pageTitle

  campaign.brandName =
    basicText.brandName ||
    nestedCampaign.brandName ||
    rawSettings.brandName ||
    campaign.brandName

  campaign.brandSubtitle =
    basicText.brandSubtitle ||
    nestedCampaign.brandSubtitle ||
    rawSettings.brandSubtitle ||
    campaign.brandSubtitle

  campaign.mainTitle =
    basicText.headline ||
    basicText.mainTitle ||
    nestedCampaign.mainTitle ||
    rawSettings.mainTitle ||
    apiCampaign.title ||
    campaign.mainTitle

  campaign.subTitle =
    basicText.subtitle ||
    nestedCampaign.subTitle ||
    rawSettings.subTitle ||
    (apiCampaign.gameType === 'GOLDEN_EGG' ? '正式資料庫砸金蛋活動' : campaign.subTitle)

  campaign.heroTagline =
    basicText.heroTagline ||
    nestedCampaign.heroTagline ||
    rawSettings.heroTagline ||
    apiCampaign.description ||
    campaign.heroTagline

  campaign.noticeText =
    basicText.noticeText ||
    nestedCampaign.noticeText ||
    rawSettings.noticeText ||
    apiCampaign.description ||
    campaign.noticeText

  campaign.serialRedeemTitle =
    basicText.serialRedeemTitle ||
    nestedCampaign.serialRedeemTitle ||
    rawSettings.serialRedeemTitle ||
    campaign.serialRedeemTitle

  campaign.serialRedeemDescription =
    basicText.serialRedeemDescription ||
    nestedCampaign.serialRedeemDescription ||
    rawSettings.serialRedeemDescription ||
    campaign.serialRedeemDescription

  campaign.serialRedeemButtonText =
    basicText.serialRedeemButtonText ||
    nestedCampaign.serialRedeemButtonText ||
    rawSettings.serialRedeemButtonText ||
    campaign.serialRedeemButtonText

  campaign.serialRedeemPlaceholder =
    basicText.serialRedeemPlaceholder ||
    nestedCampaign.serialRedeemPlaceholder ||
    rawSettings.serialRedeemPlaceholder ||
    campaign.serialRedeemPlaceholder

  const contentSettings = rawSettings.content && typeof rawSettings.content === 'object' ? rawSettings.content : {}
  campaign.ruleTitle =
    rawSettings.ruleTitle ||
    rawSettings.rulesTitle ||
    contentSettings.ruleTitle ||
    contentSettings.rulesTitle ||
    nestedCampaign.ruleTitle ||
    campaign.ruleTitle

  campaign.ruleContent =
    rawSettings.ruleContent ||
    rawSettings.rulesText ||
    contentSettings.ruleContent ||
    contentSettings.rulesText ||
    nestedCampaign.ruleContent ||
    campaign.ruleContent

  campaign.prizeInfoTitle =
    rawSettings.prizeInfoTitle ||
    contentSettings.prizeInfoTitle ||
    nestedCampaign.prizeInfoTitle ||
    campaign.prizeInfoTitle

  campaign.prizeInfoContent =
    rawSettings.prizeInfoContent ||
    rawSettings.prizeInfoText ||
    contentSettings.prizeInfoContent ||
    contentSettings.prizeInfoText ||
    nestedCampaign.prizeInfoContent ||
    campaign.prizeInfoContent

  campaign.themeBgFrom = theme.themeBgFrom || theme.from || rawSettings.themeBgFrom || campaign.themeBgFrom
  campaign.themeBgMiddle = theme.themeBgMiddle || theme.middle || rawSettings.themeBgMiddle || campaign.themeBgMiddle
  campaign.themeBgTo = theme.themeBgTo || theme.to || rawSettings.themeBgTo || campaign.themeBgTo
  campaign.cardBgColor = theme.cardBgColor || rawSettings.cardBgColor || campaign.cardBgColor
  campaign.primaryColor = theme.primaryColor || rawSettings.primaryColor || campaign.primaryColor
  campaign.accentColor = theme.accentColor || rawSettings.accentColor || campaign.accentColor
  campaign.textColor = theme.textColor || rawSettings.textColor || campaign.textColor
}

const normalizeRemotePrizeSettings = (apiCampaign = {}, normalized = {}) => {
  const { prizeSettings = [] } = normalized

  if (Array.isArray(prizeSettings) && prizeSettings.length) {
    return prizeSettings.map((prize, index) => {
      const rawType = String(prize.type || prize.rewardType || '').trim().toUpperCase()
      const title = prize.name || prize.title || prize.shortName || `獎項 ${index + 1}`
      const isLose = rawType === 'LOSE' || /未中|沒中|謝謝|再接再厲|銘謝/.test(String(title || ''))

      return {
        id: prize.id || `remote-setting-prize-${index + 1}`,
        name: title,
        title,
        shortName: prize.shortName || prize.label || prize.name || prize.title || `獎項 ${index + 1}`,
        description: prize.description || prize.note || '',
        type: isLose ? 'lose' : 'win',
        probability: Number(prize.probabilityPercent ?? prize.probability ?? prize.percent ?? prize.chance ?? prize.weight ?? 10),
        weight: Number(prize.weight ?? prize.probabilityPercent ?? prize.probability ?? prize.chance ?? 10),
        inventory: Number(prize.inventory ?? prize.stock ?? prize.quantity ?? prize.remainStock ?? 0),
        imageUrl: prize.imageUrl || prize.image || prize.prizeImageUrl || prize.iconUrl || '',
        icon: prize.icon || prize.emoji || (isLose ? '🙂' : '🎁'),
        isEnabled: prize.isEnabled !== false && prize.enabled !== false && String(prize.status || 'ACTIVE').toUpperCase() !== 'DISABLED'
      }
    })
  }

  if (Array.isArray(apiCampaign.prizes) && apiCampaign.prizes.length) {
    return apiCampaign.prizes.map(mapApiPrizeToLocalPrize)
  }

  return []
}

// 第 106801～107200 批：正式玩家彈窗圖片依「實際抽中的獎項」回查最新 GameConfig。
// 目的：後台改 A 獎項圖片，玩家抽到 A 時才顯示 A；抽到 B 時顯示 B，避免看起來不同步。
const normalizePrizeLookupValue = (value = '') => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
}

const getPrizeLookupCandidates = (prize = {}) => {
  return [
    prize.id,
    prize.prizeId,
    prize.rewardId,
    prize.title,
    prize.name,
    prize.shortName,
    prize.label
  ]
    .map(normalizePrizeLookupValue)
    .filter(Boolean)
}

const findLatestPrizeSettingForResult = (rawPrize = {}, fallbackPrize = {}) => {
  const candidates = new Set([
    ...getPrizeLookupCandidates(rawPrize),
    ...getPrizeLookupCandidates(fallbackPrize)
  ])

  if (!candidates.size) return null

  return prizes.value.find((item) => {
    return getPrizeLookupCandidates(item).some((key) => candidates.has(key))
  }) || null
}

const mergeLatestPrizeImageForResult = (rawPrize = {}, fallbackPrize = {}) => {
  const latestPrize = findLatestPrizeSettingForResult(rawPrize, fallbackPrize)

  if (!latestPrize) return fallbackPrize

  return {
    ...fallbackPrize,
    id: fallbackPrize.id || latestPrize.id,
    name: latestPrize.name || latestPrize.title || fallbackPrize.name,
    title: latestPrize.title || latestPrize.name || fallbackPrize.title,
    shortName: latestPrize.shortName || fallbackPrize.shortName,
    description: latestPrize.description || fallbackPrize.description,
    icon: latestPrize.icon || fallbackPrize.icon,
    imageUrl: latestPrize.imageUrl || fallbackPrize.imageUrl || '',
    type: String(latestPrize.type || fallbackPrize.type || '').toLowerCase() === 'lose' ? 'lose' : 'win',
    __imageSource: latestPrize.imageUrl ? 'LATEST_GAME_CONFIG_PRIZE_IMAGE' : 'DRAW_ENGINE_RESULT_IMAGE'
  }
}

const mergeLatestGameConfigIntoCampaignPayload = async (campaignId, apiCampaign = {}) => {
  try {
    const latestGameConfigPayload = unwrapApiPayload(await getCampaignGameConfigApi(campaignId))

    if (latestGameConfigPayload?.settings && typeof latestGameConfigPayload.settings === 'object') {
      return {
        ...apiCampaign,
        gameConfig: latestGameConfigPayload
      }
    }
  } catch (error) {
    console.warn('重新讀取金蛋 GameConfig 失敗，暫以活動詳情內資料顯示：', error)
  }

  return apiCampaign
}

const applyRemoteCampaignData = (apiCampaign = {}) => {
  // 第 23501～23900 批修正：
  // 正式玩家頁必須完整吃 PostgreSQL GameConfig.settings。
  // 支援三種資料形狀：
  // 1. flat settings：{ pageTitle, mainTitle, themeBgFrom... }
  // 2. admin payload：{ campaign: {...}, prizes: [...] }
  // 3. grid-like settings：{ basicText: {...}, theme: {...}, prizes: [...] }
  Object.assign(campaign, cloneByJson(defaultCampaignSnapshot))

  const normalized = normalizeRemoteGoldenEggSettings(apiCampaign)

  remoteCampaignTitle.value = apiCampaign.title || ''
  remoteCampaignStatus.value = apiCampaign.status || ''

  campaign.pageTitle = apiCampaign.title || campaign.pageTitle
  campaign.mainTitle = apiCampaign.title || campaign.mainTitle
  campaign.subTitle = apiCampaign.gameType === 'GOLDEN_EGG' ? '正式資料庫砸金蛋活動' : campaign.subTitle
  campaign.heroTagline = apiCampaign.description || campaign.heroTagline
  campaign.noticeText = apiCampaign.description || campaign.noticeText
  campaign.activityStartAt = apiCampaign.startAt || ''
  campaign.activityEndAt = apiCampaign.endAt || ''

  if (Object.keys(normalized.rawSettings || {}).length) {
    applyRemoteCampaignSettingsToCampaign(apiCampaign, normalized)
  }

  // 正式活動時間以 Campaign.startAt / endAt 優先，避免 GameConfig 舊空值覆蓋活動時間。
  campaign.activityStartAt =
    apiCampaign.startAt ||
    normalized.nestedCampaign?.activityStartAt ||
    normalized.rawSettings?.activityStartAt ||
    ''

  campaign.activityEndAt =
    apiCampaign.endAt ||
    normalized.nestedCampaign?.activityEndAt ||
    normalized.rawSettings?.activityEndAt ||
    ''

  campaign.eggSize = Number(normalized.rawSettings?.eggSize ?? normalized.nestedCampaign?.eggSize ?? campaign.eggSize ?? 74)
  campaign.eggCardSize = Number(normalized.rawSettings?.eggCardSize ?? normalized.nestedCampaign?.eggCardSize ?? campaign.eggCardSize ?? 128)
  campaign.eggGap = Number(
    normalized.rawSettings?.eggGap ??
      normalized.rawSettings?.eggGridGap ??
      normalized.nestedCampaign?.eggGap ??
      normalized.nestedCampaign?.eggGridGap ??
      campaign.eggGap ??
      campaign.eggGridGap ??
      12
  )
  campaign.eggGridGap = campaign.eggGap

  // 若正式資料庫尚未存入金蛋顏色，統一使用預設金色。
  campaign.eggColorTop = normalized.rawSettings?.eggColorTop || normalized.nestedCampaign?.eggColorTop || campaign.eggColorTop || '#fff7ad'
  campaign.eggColorMiddle = normalized.rawSettings?.eggColorMiddle || normalized.nestedCampaign?.eggColorMiddle || campaign.eggColorMiddle || '#fde047'
  campaign.eggColorBottom = normalized.rawSettings?.eggColorBottom || normalized.nestedCampaign?.eggColorBottom || campaign.eggColorBottom || '#b45309'

  const remotePrizes = normalizeRemotePrizeSettings(apiCampaign, normalized)

  if (remotePrizes.length) {
    prizes.value = remotePrizes
  }

  syncSectionOpenStateFromCampaign()
  updateChanceText()
}



// 第 384 批：LINE 內建瀏覽器外部開啟提示
const isLineInAppBrowser = ref(false)
const isLineBrowserHintClosed = ref(false)
const lineBrowserCopyMessage = ref('')

const currentActivityUrl = computed(() => {
  if (typeof window === 'undefined') return ''

  const url = new URL(window.location.href)

  if (getRouteTenantSlug()) {
    url.searchParams.delete('campaignId')
    url.searchParams.delete('onlineCampaignId')
    return url.toString()
  }

  url.searchParams.set('campaignId', String(onlineCampaignId.value || getRouteCampaignId() || 1))
  return url.toString()
})

const shouldShowLineBrowserHint = computed(() => {
  return isLineInAppBrowser.value
    && !isLineBrowserHintClosed.value
    && campaign.showLineBrowserHint !== false
})

const detectLineInAppBrowser = () => {
  if (typeof navigator === 'undefined') return false

  const ua = navigator.userAgent || ''
  return /Line\//i.test(ua) || /Line/i.test(ua)
}

const copyActivityUrlFromLineHint = async () => {
  const url = currentActivityUrl.value

  try {
    await navigator.clipboard.writeText(url)
    lineBrowserCopyMessage.value = '活動連結已複製，請貼到 Chrome 或 Safari 開啟。'
  } catch (error) {
    lineBrowserCopyMessage.value = url
  }

  window.setTimeout(() => {
    lineBrowserCopyMessage.value = ''
  }, 3500)
}

onMounted(() => {
  isLineInAppBrowser.value = detectLineInAppBrowser()
})



const getRouteTenantSlug = () => {
  const value = route.params?.tenantSlug || route.query.tenantSlug || ''
  return String(value || '').trim()
}

const normalizeTrafficSource = (value = '') => {
  const source = String(value || '').trim().toLowerCase()

  if (source === 'fb') return 'facebook'
  if (source === 'ig') return 'instagram'
  if (['line', 'facebook', 'instagram', 'direct'].includes(source)) return source

  return source || 'direct'
}

const getRouteTrafficSource = () => {
  return normalizeTrafficSource(
    route.query?.from ||
    route.query?.source ||
    route.query?.utm_source ||
    'direct'
  )
}

const getCurrentFrontUrlForTracking = () => {
  if (typeof window === 'undefined') return ''
  return window.location.pathname + window.location.search
}

const unwrapApiPayload = (response) => {
  return response?.data?.data ?? response?.data ?? response ?? null
}


const toSafeChanceNumber = (value, fallback = 0) => {
  const number = Number(value)

  if (!Number.isFinite(number)) return fallback

  return Math.max(0, Math.floor(number))
}

const extractSerialRemainingChance = (payload = {}, fallback = 0) => {
  const data = unwrapApiPayload(payload) || {}

  return toSafeChanceNumber(
    data?.result?.remainingSerialChances
      ?? data?.result?.serialRemainingChance
      ?? data?.result?.remainingChance
      ?? data?.serialCode?.remainingChance
      ?? data?.serialCode?.remainingSerialChances
      ?? data?.serialCode?.serialRemainingChance
      ?? data?.remainingSerialChances
      ?? data?.serialRemainingChance
      ?? data?.remainingChance,
    fallback
  )
}

const syncRemainingChanceAfterDraw = (drawResult = {}, fallback = 0) => {
  const remainingChance = extractSerialRemainingChance(drawResult, fallback)

  player.chances = remainingChance
  updateChanceText()

  if (remainingChance <= 0) {
    remoteVerifiedSerialCode.value = ''
    remoteSerialMessageType.value = 'error'
    serialRedeemMessage.value = '此序號可用次數已用完，請輸入新的抽獎序號。'
    remoteDrawNotice.value = '本次抽獎已完成，此序號可用次數已用完。'
  } else {
    remoteSerialMessageType.value = 'success'
    serialRedeemMessage.value = `已扣除 1 次砸蛋機會，此序號還剩 ${remainingChance} 次。`
    remoteDrawNotice.value = `已扣除 1 次砸蛋機會，此序號還剩 ${remainingChance} 次。`
  }

  return remainingChance
}

const extractCampaignList = (payload) => {
  const data = unwrapApiPayload(payload)

  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.campaigns)) return data.campaigns
  if (Array.isArray(data?.rows)) return data.rows
  if (Array.isArray(data?.data)) return data.data

  return []
}

const resolveTenantGoldenEggCampaign = async (tenantSlug) => {
  if (!tenantSlug) return null

  const response = await getTenantGoldenEggCampaignApi(tenantSlug)
  const campaigns = extractCampaignList(response)

  return campaigns.find((item) => String(item?.gameType || '').toUpperCase() === 'GOLDEN_EGG') || campaigns[0] || null
}

const getRouteCampaignId = () => {
  const value = route.query.campaignId || route.query.onlineCampaignId || route.params?.campaignId

  if (!value) return null

  const id = Number(value)

  return Number.isInteger(id) && id > 0 ? id : null
}

const loadGoldenEggRemoteState = async () => {
  let campaignId = getRouteCampaignId()
  const tenantSlug = getRouteTenantSlug()
  let apiCampaign = null

  if (isPlatformTemplatePreviewMode.value) {
    isOnlineMode.value = false
    onlineCampaignId.value = null
    return
  }

  if (!campaignId && !tenantSlug) {
    isOnlineMode.value = false
    onlineCampaignId.value = null
    return
  }

  isLoadingRemoteCampaign.value = true
  remoteLoadMessage.value = tenantSlug
    ? `正在讀取 ${tenantSlug} 的砸金蛋活動...`
    : '正在讀取正式活動資料...'

  try {
    if (!campaignId && tenantSlug) {
      apiCampaign = await resolveTenantGoldenEggCampaign(tenantSlug)
      campaignId = Number(apiCampaign?.id || 0)

      if (!campaignId) {
        throw new Error(`找不到 ${tenantSlug} 的 GOLDEN_EGG 活動`)
      }
    }

    if (!apiCampaign) {
      apiCampaign = unwrapApiPayload(await getCampaignDetailApi(campaignId))
    }

    // 第 106801～107200 批：正式玩家頁再讀一次 /game-config，確保吃到後台最新儲存的獎項圖片。
    apiCampaign = await mergeLatestGameConfigIntoCampaignPayload(campaignId, apiCampaign)

    onlineCampaignId.value = campaignId
    isOnlineMode.value = true
    player.chances = 0
    remoteVerifiedSerialCode.value = ''
    remoteSerialMessageType.value = 'info'
    serialRedeemMessage.value = campaign.serialRedeemDescription || '請輸入主辦單位提供的序號，驗證成功後即可砸蛋。'

    applyRemoteCampaignData(apiCampaign)

    remoteLoadMessage.value = tenantSlug
      ? `已載入 ${apiCampaign?.tenant?.name || tenantSlug} 的砸金蛋活動與 GameConfig 設定：${apiCampaign?.title || `ID ${campaignId}`}。`
      : `已載入正式資料庫活動與 GameConfig 設定：${apiCampaign?.title || `ID ${campaignId}`}。`
  } catch (error) {
    console.error('讀取正式金蛋活動失敗：', error)
    isOnlineMode.value = false
    onlineCampaignId.value = null
    remoteCampaignTitle.value = ''
    remoteCampaignStatus.value = ''
    remoteLoadMessage.value = tenantSlug
      ? `找不到 ${tenantSlug} 的砸金蛋活動，請確認商家網址是否正確。`
      : '正式活動讀取失敗，已改用本機展示資料。'
  } finally {
    isLoadingRemoteCampaign.value = false
  }
}

const handleGoldenEggAdminStorageSync = (event) => {
  if (!event) return

  if (event.key === getGoldenEggAdminStateKey() || event.key === getGoldenEggAdminSyncKey()) {
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
let goldenEggAudioContext = null
let goldenEggSoundTimers = []

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


const commonEggTemplateProps = computed(() => {
  return {
    gameKey: 'golden-egg',
    gameType: 'GOLDEN_EGG',
    title: campaign.pageTitle || campaign.mainTitle || '砸金蛋抽獎',
    subtitle: campaign.subTitle || '選一顆金蛋，敲開驚喜好禮',
    brandName: campaign.brandName || 'Multi Game Platform',
    heroTitle: campaign.mainTitle || '砸金蛋中大奖',
    heroDescription: campaign.heroTagline || campaign.noticeText || '請先輸入序號，驗證成功後即可砸蛋。',
    theme: {
      from: campaign.themeBgFrom || '#7f1d1d',
      middle: campaign.themeBgMiddle || '#b91c1c',
      to: campaign.themeBgTo || '#f59e0b',
      accent: campaign.themeAccentColor || '#fde047',
      button: campaign.themeButtonColor || '#facc15'
    },
    items: activePrizes.value.map((prize, index) => {
      return {
        id: prize.id || `egg-prize-${index + 1}`,
        title: prize.name || prize.shortName || `獎項 ${index + 1}`,
        name: prize.name || prize.shortName || `獎項 ${index + 1}`,
        shortName: prize.shortName || prize.name || `獎項 ${index + 1}`,
        description: prize.description || '',
        icon: prize.icon || '🥚',
        imageUrl: prize.imageUrl || '',
        weight: Number(prize.probability || 0),
        quantity: Number(prize.stock || 0),
        type: prize.type || 'win',
        rank: prize.rank || ''
      }
    }),
    source: {
      route: 'GoldenEggGameView.vue',
      batch: '第 4001～4400 批',
      mode: isCommonEggRoute.value ? 'commonEgg-test-area' : 'formal-original'
    }
  }
})

const commonEggSerialVerificationProps = computed(() => {
  return {
    enabled: false,
    testMode: true,
    status: remoteVerifiedSerialCode.value ? 'verified' : 'idle',
    serialCode: remoteVerifiedSerialCode.value || serialCodeInput.value || '',
    inputValue: serialCodeInput.value || '',
    message: serialRedeemMessage.value || 'commonEgg 測試區目前只顯示 props preview，尚未送出 verify API。',
    messageType: remoteSerialMessageType.value || 'info',
    loading: isSerialRedeeming.value,
    requestPreview: {
      routeEnabled: isEggVerifyApiPreviewRoute.value,
      requestWillBeSent: canSendCommonEggVerifyApi.value,
      reason: canSendCommonEggVerifyApi.value
        ? 'verify API 已符合 commonEgg 嚴格測試旗標，但仍需使用者手動操作確認。'
        : 'verify API 尚未符合完整測試旗標或不在 commonEgg 測試區。',
      requiredFlags: ['commonEgg=1', 'eggDryRun=1', 'eggVerifyApi=1', 'eggVerifySend=1', 'eggConfirmVerify=1', 'eggLocalVerifySwitch=1']
    }
  }
})

const commonEggOperationHintProps = computed(() => {
  return {
    title: isCommonEggRoute.value ? '金蛋共用模組測試區' : '金蛋正式頁',
    description: isCommonEggRoute.value
      ? '目前正在 commonEgg=1 測試區預覽 CommonGamePlayBoard props，正式金蛋頁仍保留原本流程。'
      : '正式金蛋頁保留原本流程。',
    statusText: isEggDryRunRoute.value ? 'dry-run preview' : 'props preview',
    routeMode: isCommonEggRoute.value ? 'commonEgg' : 'formal',
    badges: [
      isCommonEggRoute.value ? 'commonEgg=1' : 'formal',
      isLegacyEggRoute.value ? 'legacyEgg=1' : 'legacy 保留',
      isEggDryRunRoute.value ? 'eggDryRun=1' : 'dry-run 未開啟',
      isEggVerifyApiPreviewRoute.value ? 'eggVerifyApi=1' : 'verify preview 未開啟',
      isEggPlayApiPreviewRoute.value ? 'eggPlayApi=1' : 'play preview 未開啟',
      isEggVerifySendRoute.value ? 'eggVerifySend=1' : 'verify send 未開啟',
      isEggPlaySendRoute.value ? 'eggSendPlayApi=1' : 'play send 未開啟',
      isEggFormalApplyRoute.value ? 'formal canary apply' : 'formal apply 未開啟'
    ],
    nextSteps: [
      '第 2751～2800 批只顯示 CommonGamePlayBoard preview，不切換正式金蛋頁。',
      '下一階段才進入 Golden Egg props 實際綁定第一階段。',
      'verify / play API guard 仍維持保護，不會在本批送出。'
    ]
  }
})

const commonEggPlayControlProps = computed(() => {
  return {
    enabled: false,
    canPlay: false,
    requestWillBeSent: false,
    loading: false,
    disabledReason: canSendCommonEggPlayApi.value ? 'play API 已符合測試旗標，可進行測試區送出候選。' : 'play API 尚未符合完整測試旗標，正式頁不送出。',
    requestPreview: {
      routeEnabled: isEggPlayApiPreviewRoute.value,
      requestWillBeSent: canSendCommonEggPlayApi.value,
      requiredFlags: ['commonEgg=1', 'eggDryRun=1', 'eggVerifyApi=1', 'eggVerifySend=1', 'eggConfirmVerify=1', 'eggLocalVerifySwitch=1', 'eggPlayApi=1', 'eggSendPlayApi=1', 'eggConfirmPlay=1', 'eggLocalPlaySwitch=1'],
      payload: {
        gameType: 'GOLDEN_EGG',
        campaignId: onlineCampaignId.value || null,
        serialCode: remoteVerifiedSerialCode.value || '',
        source: trafficSource.value || 'direct'
      }
    }
  }
})

const commonEggSafetyProps = computed(() => {
  return {
    formalPageKept: true,
    formalLiveApplied: true,
    legacyFallbackKept: true,
    commonEggTestOnly: true,
    routerChanged: false,
    dbChanged: false,
    drawCoreChanged: false,
    verifyApiWillBeSent: canSendCommonEggVerifyApi.value,
    playApiWillBeSent: canSendCommonEggPlayApi.value,
    highestPriorityFallback: '?legacyEgg=1',
    routeChecks: {
      commonEgg: isCommonEggRoute.value,
      legacyEgg: isLegacyEggRoute.value,
      eggDryRun: isEggDryRunRoute.value,
      eggVerifyApi: isEggVerifyApiPreviewRoute.value,
      eggPlayApi: isEggPlayApiPreviewRoute.value,
      eggFormalDryRun: isEggFormalDryRunRoute.value,
      eggFormalCommon: isEggFormalCommonRoute.value,
      eggFormalGray: isEggFormalGrayRoute.value,
      eggFormalCanary: isEggFormalCanaryRoute.value,
      eggFormalApply: isEggFormalApplyRoute.value,
      routeMode: eggLiveApplyRouteMode.value,
      formalLiveAppliedDefault: showFormalEggCommonBoardByDefault.value
    }
  }
})

const commonEggBoundGameBoardProps = computed(() => {
  return {
    template: commonEggTemplateProps.value,
    gameType: 'GOLDEN_EGG',
    serialVerification: commonEggSerialVerificationProps.value,
    operationHint: commonEggOperationHintProps.value,
    playControl: commonEggPlayControlProps.value,
    safety: commonEggSafetyProps.value,
    testMode: true,
    showSafeRules: true,
    showNextSteps: true,
    bindingStage: {
      batch: '第 4001～4400 批',
      title: '金蛋正式上線後監控、部署交付與營運維護完整收斂版',
      actualBindingStage: 'post_live_monitor_deploy_ops_handoff_complete',
      itemCount: commonEggTemplateProps.value.items.length,
      requestWillBeSent: false,
      formalEggKept: true,
      legacyEggFallbackKept: true,
      note: '第 4001～4400 批整理 formal canary 實際顯示、live apply 前驗收與 rollback 壓測；正式金蛋頁預設仍不永久切換。'
    }
  }
})

const commonEggStageChecks = computed(() => {
  return [
    {
      label: 'CommonGamePlayBoard',
      status: showCommonEggTestArea.value ? '測試區已顯示' : '待 commonEgg=1 測試',
      ok: true
    },
    {
      label: '金蛋正式頁',
      status: '保留原流程',
      ok: true
    },
    {
      label: 'legacy fallback',
      status: '?legacyEgg=1 規格保留',
      ok: true
    },
    {
      label: 'verify / play API',
      status: '本批不送出',
      ok: true
    }
  ]
})


const commonEggLargeBatchSummary = computed(() => {
  return {
    batch: '第 4001～4400 批',
    title: '金蛋正式上線後監控、部署交付與營運維護完整收斂版',
    ranges: [
      '第 4001～4050 批：正式頁 / commonEgg / legacyEgg 三路線監控',
      '第 4051～4100 批：verify / play guard、結果回填與兌獎提示觀測',
      '第 4101～4150 批：手機版 / 平板 / 桌機 UX 收斂',
      '第 4151～4200 批：rollback SOP、legacyEgg 緊急回退與異常回報流程',
      '第 4201～4250 批：PowerShell、frontend build、backend health、Git / Render 檢查',
      '第 4251～4300 批：商家交付文件、客服話術、玩家 FAQ、兌獎流程',
      '第 4301～4350 批：上線後觀測指標與後台報表銜接',
      '第 4351～4400 批：長期維護、版本封存與多遊戲擴展銜接'
    ],
    formalPageChanged: true,
    legacyFallback: '?legacyEgg=1',
    testArea: '?commonEgg=1',
    routerChanged: false,
    dbChanged: false,
    drawCoreChanged: false
  }
})

const handleCommonEggPlayBoardPlay = () => {
  serialRedeemMessage.value = 'commonEgg 測試區目前是 preview-only，play API 尚未開啟。'
  remoteSerialMessageType.value = 'info'
}

const handleCommonEggPlayBoardPreview = () => {
  serialRedeemMessage.value = '已更新 commonEgg props preview 狀態；正式頁不受影響。'
  remoteSerialMessageType.value = 'info'
}

const handleCommonEggPlayBoardReset = () => {
  serialRedeemMessage.value = 'commonEgg 測試區 reset 目前只重整提示，不會清除正式資料。'
  remoteSerialMessageType.value = 'info'
}


const availablePrizePool = computed(() => {
  return activePrizes.value.filter((prize) => {
    const probability = Number(prize.probability || 0)
    const stock = Number(prize.stock ?? prize.remainStock ?? prize.quantity ?? 0)
    const prizeType = String(prize.type || '').toLowerCase()

    if (probability <= 0) return false

    // 未中獎/謝謝類獎項沒有庫存概念，仍可作為合法抽獎池。
    if (['lose', 'thanks', 'no_prize', 'none'].includes(prizeType)) return true

    return stock > 0
  })
})

const shouldUseBackendDrawPool = computed(() => {
  // 第 90401～90800 批：正式玩家頁只要序號驗證成功，就允許玩家點金蛋。
  // 真正獎項是否可抽、庫存是否足夠、百分比是否有效，全部交給後端 Draw Engine 判斷。
  return Boolean(isOnlineMode.value && onlineCampaignId.value)
})

const hasPlayablePrizePool = computed(() => {
  if (shouldUseBackendDrawPool.value) return true
  return availablePrizePool.value.length > 0
})

const canPlay = computed(() => {
  return isActivityPlayable.value && player.chances > 0 && hasPlayablePrizePool.value && !isCracking.value
})

const statusText = computed(() => {
  if (!isActivityPlayable.value) return activityStatusText.value
  if (isCracking.value) return '金蛋敲擊中，請稍候結果揭曉。'
  if (player.chances <= 0) return '目前沒有砸蛋機會，請輸入主辦單位提供的序號兌換。'
  if (shouldUseBackendDrawPool.value) return `序號已驗證，目前可砸 ${player.chances} 次，請選擇一顆金蛋。`
  if (!availablePrizePool.value.length) return '目前獎品已抽完，請等待主辦單位更新。'
  return `序號已驗證，目前可砸 ${player.chances} 次，請選擇一顆金蛋。`
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
  const bgColor = campaign.systemShareButtonBgColor || campaign.shareButtonBgColor || '#7f1d1d'
  const textColor = campaign.systemShareButtonTextColor || campaign.shareButtonTextColor || '#ffffff'

  return {
    borderRadius: `${radius}px`,
    fontSize: `${fontSize}px`,
    paddingTop: `${paddingY}px`,
    paddingBottom: `${paddingY}px`,
    background: bgColor,
    color: textColor
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

const normalizedRemoteCampaignStatus = computed(() => {
  return String(remoteCampaignStatus.value || '').toUpperCase()
})

const normalizedLocalCampaignStatus = computed(() => {
  return String(campaign.status || campaign.campaignStatus || '').toUpperCase()
})

const normalizeCampaignRuntimeStatus = (status) => {
  const value = String(status || '').toUpperCase()

  if (!value || value === 'ACTIVE') return ''
  if (value === 'DRAFT') return 'draft'
  if (['ENDED', 'END', 'FINISHED', 'CLOSED'].includes(value)) return 'ended'
  if (['INACTIVE', 'PAUSED', 'SUSPENDED', 'DISABLED'].includes(value)) return 'paused'

  return 'paused'
}

const activityStatus = computed(() => {
  // V2.3 第 18 批修正版：
  // 右側 iframe 預覽多數時候不是正式 API onlineMode，而是吃後台同步到 localStorage 的 campaign.status。
  // 因此不能只看 remoteCampaignStatus，否則後台切成 INACTIVE / ENDED 時，預覽仍會顯示「進行中」。
  const databaseStatus = normalizeCampaignRuntimeStatus(normalizedRemoteCampaignStatus.value)
  const localPreviewStatus = normalizeCampaignRuntimeStatus(normalizedLocalCampaignStatus.value)

  if (databaseStatus) return databaseStatus
  if (localPreviewStatus) return localPreviewStatus

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
  if (activityStatus.value === 'draft') return '未開放'
  if (activityStatus.value === 'paused') return '暫停中'
  if (activityStatus.value === 'ended') return '已結束'

  return '進行中'
})

const activityStatusText = computed(() => {
  if (activityStatus.value === 'not-started') return campaign.activityNotStartedText || '活動尚未開始，請於指定時間再回來參加。'
  if (activityStatus.value === 'draft') return campaign.activityDraftText || '活動尚未開放，請等待主辦單位公告。'
  if (activityStatus.value === 'paused') return campaign.activityPausedText || '活動暫停中，請稍後再回來參加。'
  if (activityStatus.value === 'ended') return campaign.activityEndedText || '活動已結束，感謝你的參與。'

  return campaign.activityRunningText || '活動進行中，請選擇一顆金蛋。'
})

const activityStatusClass = computed(() => {
  if (activityStatus.value === 'not-started') return 'bg-amber-100 text-amber-700'
  if (activityStatus.value === 'draft') return 'bg-slate-100 text-slate-700'
  if (activityStatus.value === 'paused') return 'bg-orange-100 text-orange-700'
  if (activityStatus.value === 'ended') return 'bg-rose-100 text-rose-700'

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
    if (activityStatus.value === 'draft') return '活動尚未開放'
    if (activityStatus.value === 'paused') return '活動暫停中'
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
  const verifyingText = isSerialRedeeming.value ? '驗證中' : ''
  const serialStatusText = verifyingText || (remoteVerifiedSerialCode.value ? '已驗證' : '未驗證')

  return [
    {
      label: '序號狀態',
      value: serialStatusText,
      subText: remoteVerifiedSerialCode.value ? '可以砸蛋' : '請先輸入序號'
    },
    {
      label: '可用次數',
      value: player.chances,
      subText: remoteVerifiedSerialCode.value ? '序號剩餘' : '驗證後開放'
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
  const latestPrize = findLatestPrizeSettingForResult(resultPrize.value || {}, resultPrize.value || {})
  const latestPrizeImageUrl = String(latestPrize?.imageUrl || '').trim()
  const prizeImageUrl = String(resultPrize.value?.imageUrl || '').trim()
  const isLoseResult = String(latestPrize?.type || resultPrize.value?.type || '').toLowerCase() === 'lose'
  const winImageUrl = String(campaign.resultWinImageUrl || '').trim()
  const loseImageUrl = String(campaign.resultLoseImageUrl || '').trim()
  const globalImageUrl = String(campaign.resultImageUrl || '').trim()
  const typedImageUrl = isLoseResult ? loseImageUrl : winImageUrl

  return latestPrizeImageUrl || prizeImageUrl || typedImageUrl || globalImageUrl
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
    fontSize: `${fontSize}px`,
    backgroundColor: campaign.resultPrimaryButtonBgColor || '#fde047',
    color: campaign.resultPrimaryButtonTextColor || '#991b1b'
  }
})

const resultCopyButtonStyle = computed(() => {
  const fontSize = Math.min(22, Math.max(12, Number(campaign.resultCopyButtonTextSize || 14)))

  return {
    fontSize: `${fontSize}px`,
    backgroundColor: campaign.resultCopyButtonBgColor || 'rgba(255,255,255,0.12)',
    color: campaign.resultCopyButtonTextColor || '#ffffff'
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
  campaign.chanceText = player.chances > 0
    ? `序號已驗證，可砸 ${player.chances} 次`
    : '請先輸入抽獎序號，驗證成功後即可砸蛋。'
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

const getGoldenEggAudioContext = () => {
  if (typeof window === 'undefined') return null

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext

    if (!AudioContextClass) return null

    if (!goldenEggAudioContext) {
      goldenEggAudioContext = new AudioContextClass()
    }

    if (goldenEggAudioContext.state === 'suspended') {
      goldenEggAudioContext.resume?.()
    }

    return goldenEggAudioContext
  } catch (error) {
    console.warn('初始化金蛋音效失敗：', error)
    return null
  }
}

const playGoldenEggTone = ({
  frequency = 420,
  duration = 0.08,
  delay = 0,
  volume = 0.35,
  type = 'triangle',
  slideTo = null
} = {}) => {
  const context = getGoldenEggAudioContext()

  if (!context) return

  try {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const now = context.currentTime + Math.max(0, delay)
    const safeVolume = Math.min(0.9, Math.max(0.001, Number(volume || 0.25)))

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, now)

    if (slideTo) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), now + duration)
    }

    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(safeVolume, now + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(now)
    oscillator.stop(now + duration + 0.025)
  } catch (error) {
    console.warn('播放金蛋合成音效失敗：', error)
  }
}

const stopGoldenEggSyntheticSounds = () => {
  goldenEggSoundTimers.forEach((timer) => window.clearTimeout(timer))
  goldenEggSoundTimers = []
}

const playGoldenEggCrackSequence = (volume = campaign.hammerSoundVolume) => {
  if (!campaign.enableHammerSound) return

  stopGoldenEggSyntheticSounds()

  const baseVolume = Math.min(0.75, Math.max(0.08, Number(volume || 60) / 140))
  const sequence = [
    { delay: 0, frequency: 210, slideTo: 150, duration: 0.075, volume: baseVolume, type: 'square' },
    { delay: 85, frequency: 280, slideTo: 190, duration: 0.065, volume: baseVolume * 0.78, type: 'triangle' },
    { delay: 170, frequency: 720, slideTo: 360, duration: 0.095, volume: baseVolume * 0.52, type: 'sawtooth' }
  ]

  sequence.forEach((item) => {
    const timer = window.setTimeout(() => {
      playGoldenEggTone({ ...item, delay: 0 })
    }, item.delay)

    goldenEggSoundTimers.push(timer)
  })

  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate([28, 35, 24])
  }
}

const playGoldenEggResultSound = (isWin = true, volume = campaign.winSoundVolume) => {
  if (!campaign.enableWinSound) return

  const baseVolume = Math.min(0.7, Math.max(0.08, Number(volume || 70) / 150))

  if (isWin) {
    playGoldenEggTone({ frequency: 520, slideTo: 760, duration: 0.12, volume: baseVolume, type: 'triangle' })
    playGoldenEggTone({ frequency: 760, slideTo: 1040, duration: 0.16, delay: 0.11, volume: baseVolume * 0.8, type: 'sine' })
  } else {
    playGoldenEggTone({ frequency: 260, slideTo: 180, duration: 0.18, volume: baseVolume * 0.55, type: 'triangle' })
  }
}

const playAudio = async (audioRef, enabled, volume) => {
  if (!enabled) return

  const isHammerAudio = audioRef === hammerAudio
  const isWinAudio = audioRef === winAudio

  if (!audioRef.value) {
    if (isHammerAudio) {
      playGoldenEggCrackSequence(volume)
      return
    }

    if (isWinAudio) {
      playGoldenEggResultSound(true, volume)
      return
    }

    return
  }

  try {
    audioRef.value.pause()
    audioRef.value.currentTime = 0
    audioRef.value.volume = Math.min(1, Math.max(0, Number(volume || 0) / 100))
    await audioRef.value.play()
  } catch (error) {
    console.warn('Audio play failed，改用金蛋合成音效：', error)

    if (isHammerAudio) {
      playGoldenEggCrackSequence(volume)
    }

    if (isWinAudio) {
      playGoldenEggResultSound(true, volume)
    }
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

  if (!isActivityPlayable.value) {
    remoteSerialMessageType.value = 'error'
    serialRedeemMessage.value = activityStatusText.value
    remoteDrawNotice.value = activityStatusText.value
    return
  }
  if (!remoteVerifiedSerialCode.value || player.chances <= 0) {
    remoteSerialMessageType.value = 'error'
    serialRedeemMessage.value = player.chances <= 0
      ? '此序號可用次數已用完，請輸入新的抽獎序號。'
      : '請先輸入並驗證抽獎序號。'
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
    const rawDrawResult = await playDrawEngineCampaignApi(onlineCampaignId.value, {
      gameType: 'GOLDEN_EGG',
      serialCode: remoteVerifiedSerialCode.value,
      playerName: '',
      playerPhone: '',
      playerEmail: '',
      source: trafficSource.value,
      trafficSource: trafficSource.value,
      tenantSlug: getRouteTenantSlug(),
      frontUrl: getCurrentFrontUrlForTracking(),
      resultPayload: {
        eggNumber: egg.number,
        source: trafficSource.value,
        trafficSource: trafficSource.value,
        sourceLabel: trafficSourceLabel.value,
        tenantSlug: getRouteTenantSlug(),
        frontUrl: getCurrentFrontUrlForTracking()
      },
      note: '前台金蛋正式 API 串接'
    })
    const drawResult = unwrapApiPayload(rawDrawResult)
    const remainingSerialChances = syncRemainingChanceAfterDraw(
      drawResult,
      Math.max(0, Number(player.chances || 0) - 1)
    )

    const rawPrizeFromDraw = drawResult?.prize || drawResult?.result || {}
    const prize = mergeLatestPrizeImageForResult(
      rawPrizeFromDraw,
      mapApiPrizeToLocalPrize(rawPrizeFromDraw, 0)
    )

    window.setTimeout(async () => {

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
      } else {
        playGoldenEggResultSound(false, campaign.winSoundVolume)
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
    // 第 84801～85200 批：正式商家玩家頁必須走後端 Draw Engine。
    // 後端會讀取後台儲存的金蛋百分比設定，前端只負責動畫與結果顯示。
    await crackEggWithRemoteApi(egg)
    return
  }

  // 只有模板預覽 / 離線展示才使用本地模擬；正式玩家不靠前端決定結果。
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
    } else {
      playGoldenEggResultSound(false, campaign.winSoundVolume)
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

    if (getRouteTenantSlug()) {
      url.searchParams.delete('campaignId')
      url.searchParams.delete('onlineCampaignId')
      return url.toString()
    }

    url.searchParams.set('campaignId', String(onlineCampaignId.value || getRouteCampaignId() || 1))
    return url.toString()
  }

  const tenantSlug = getRouteTenantSlug()

  if (tenantSlug) {
    return `https://marketing-game-v1.vercel.app/play/${tenantSlug}/golden-egg`
  }

  return `https://marketing-game-v1.vercel.app/games/golden-egg?campaignId=${onlineCampaignId.value || getRouteCampaignId() || 1}`
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

  if (!isActivityPlayable.value) {
    remoteSerialMessageType.value = 'error'
    serialRedeemMessage.value = activityStatusText.value
    return
  }

  if (!code) {
    remoteSerialMessageType.value = 'error'
    serialRedeemMessage.value = '請先輸入抽獎序號。'
    return
  }

  isSerialRedeeming.value = true
  remoteSerialMessageType.value = 'info'
  serialRedeemMessage.value = '正在檢查序號，請稍候...'

  try {
    if (isOnlineMode.value && onlineCampaignId.value) {
      const rawVerifyResult = await verifyDrawEngineSerialApi(onlineCampaignId.value, {
        code,
        serialCode: code,
        gameType: 'GOLDEN_EGG',
        tenantSlug: getRouteTenantSlug(),
        frontUrl: getCurrentFrontUrlForTracking(),
        source: trafficSource.value,
        trafficSource: trafficSource.value
      })
      const result = unwrapApiPayload(rawVerifyResult)

      if (!result?.valid) {
        remoteSerialMessageType.value = 'error'
        remoteVerifiedSerialCode.value = ''
        player.chances = 0
        updateChanceText()
        serialRedeemMessage.value = `${getSerialVerifyStatusMessage(result)}（目前活動 ID：${onlineCampaignId.value}，請確認此序號是否建立在同一個砸金蛋活動。）`
        return
      }

      remoteVerifiedSerialCode.value = code
      remoteDrawNotice.value = '序號已驗證，請選擇一顆金蛋開始正式抽獎。'
      const rewardChance = Math.max(1, Number(result.serialCode?.remainingChance || result.serialCode?.rewardChance || 1))
      player.chances = rewardChance
      updateChanceText()
      serialCodeInput.value = ''
      remoteSerialMessageType.value = 'success'
      serialRedeemMessage.value = getSerialVerifyStatusMessage(result)
      return
    }
    const codes = getSerialCodes()
    const target = codes.find((item) => String(item.code || '').toUpperCase() === code)

    if (!target || target.usedAt || target.isEnabled === false) {
      remoteSerialMessageType.value = 'error'
      serialRedeemMessage.value = target?.usedAt
        ? '此序號可用次數已用完，請更換新的抽獎序號。'
        : '找不到此序號，請確認是否輸入正確或是否為此活動的序號。'
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
    remoteSerialMessageType.value = 'success'
    serialRedeemMessage.value = `${campaign.serialRedeemSuccessText || '序號驗證成功，請選擇一顆金蛋。'}目前可用 ${player.chances} 次。`
  } catch (error) {
    console.error('序號驗證失敗:', error)
    serialRedeemErrorCount.value += 1
    remoteSerialMessageType.value = 'error'
    remoteVerifiedSerialCode.value = ''
    player.chances = 0
    updateChanceText()

    if (serialRedeemErrorCount.value >= Number(campaign.serialRedeemMaxErrorCount || 5)) {
      lockSerialRedeem()
    }

    serialRedeemMessage.value = getSerialVerifyErrorMessage(error)
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
  const isAdminPreviewMode = route.query?.preview !== undefined || route.query?.adminPreview !== undefined

  // 第 19 批修正：
  // 後台右側 iframe 預覽要先進入正式資料庫模式，讓序號驗證走
  // /api/draw-engine/campaigns/:campaignId/verify-serial；
  // 再套用後台 localStorage 視覺設定，保留即時預覽效果。
  if (isAdminPreviewMode) {
    await loadGoldenEggRemoteState()
    loadGoldenEggAdminState()
  } else {
    loadGoldenEggAdminState()
    await loadGoldenEggRemoteState()
  }

  syncSectionOpenStateFromCampaign()
  updateChanceText()
  loadHistory()

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

  stopGoldenEggSyntheticSounds()

  try {
    hammerAudio.value?.pause?.()
    winAudio.value?.pause?.()
  } catch (error) {
    console.warn('停止金蛋音效失敗：', error)
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

        <section
          v-if="showCommonEggTestArea"
          class="mb-5 rounded-[2rem] border border-emerald-200/30 bg-emerald-950/70 p-4 text-left text-white shadow-2xl backdrop-blur"
        >
          <div class="rounded-3xl border border-emerald-200/30 bg-emerald-300/10 p-4">
            <p class="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
              Golden Egg Post-live Ops
            </p>
            <h2 class="mt-1 text-xl font-black text-white">
              第 4001～4400 批：正式上線後監控、部署交付與營運維護
            </h2>
            <p class="mt-2 text-sm font-bold leading-6 text-emerald-50/90">
              正式金蛋頁已套用共用模組；本區整理正式上線後監控、rollback、部署驗收、商家客服交付與長期維護狀態。
            </p>

            <div class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <div
                v-for="item in commonEggPostLiveChecklist"
                :key="item.label"
                class="rounded-2xl border border-white/10 bg-white/10 px-3 py-2"
              >
                <p class="text-xs font-black text-emerald-100">{{ item.label }}</p>
                <p class="mt-1 text-sm font-black text-white">{{ item.value }}</p>
              </div>
            </div>
          </div>
        </section>


        <section
          v-if="showFormalEggCommonBoardByDefault"
          class="mb-5 rounded-[2rem] border border-orange-200/40 bg-slate-950/85 p-4 text-left text-white shadow-2xl backdrop-blur"
        >
          <div class="mb-4 rounded-3xl border border-orange-200/30 bg-orange-300/10 p-4">
            <p class="text-xs font-black uppercase tracking-[0.22em] text-orange-200">
              Formal Egg Live Apply
            </p>
            <h2 class="mt-1 text-xl font-black text-white">
              第 4001～4400 批：正式金蛋頁共用模組 live apply 完整正式套用
            </h2>
            <p class="mt-2 text-sm font-bold leading-6 text-orange-50/90">
              正式金蛋頁目前預設顯示 CommonGamePlayBoard 共用模組；如需緊急回退，請使用
              <span class="text-orange-200">?legacyEgg=1</span>。
            </p>
            <div class="mt-3 grid gap-2 sm:grid-cols-3">
              <div class="rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
                <p class="text-xs font-black text-orange-100">route mode</p>
                <p class="mt-1 text-sm font-black text-white">{{ eggLiveApplyRouteMode }}</p>
              </div>
              <div class="rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
                <p class="text-xs font-black text-orange-100">fallback</p>
                <p class="mt-1 text-sm font-black text-white">?legacyEgg=1</p>
              </div>
              <div class="rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
                <p class="text-xs font-black text-orange-100">test area</p>
                <p class="mt-1 text-sm font-black text-white">?commonEgg=1</p>
              </div>
            </div>
          </div>

          <CommonGamePlayBoard
            v-bind="commonEggBoundGameBoardProps"
            @play="handleCommonEggPlayBoardPlay"
            @preview="handleCommonEggPlayBoardPreview"
            @reset="handleCommonEggPlayBoardReset"
          />
        </section>


        <section
          v-if="showCommonEggTestArea"
          class="mb-5 rounded-[2rem] border border-yellow-200/40 bg-slate-950/80 p-4 text-left text-white shadow-2xl backdrop-blur"
        >
          <div class="mb-4 rounded-3xl border border-yellow-200/30 bg-yellow-300/10 p-4">
            <p class="text-xs font-black uppercase tracking-[0.22em] text-yellow-200">
              Common Egg Test Area
            </p>
            <h2 class="mt-1 text-xl font-black text-white">
              第 4001～4400 批：verify/play 安全開關、結果回填與正式 dry-run 預備
            </h2>
            <p class="mt-2 text-sm font-bold leading-6 text-yellow-50/90">
              目前只在 <span class="text-yellow-200">?commonEgg=1</span> 測試區整理 verify/play 安全開關與結果回填預備；正式金蛋頁仍不切換，legacyEgg 回退保留最高優先。
            </p>

            <div class="mt-3 grid gap-2 sm:grid-cols-2">
              <div
                v-for="item in commonEggStageChecks"
                :key="item.label"
                class="rounded-2xl border border-white/10 bg-white/10 px-3 py-2"
              >
                <p class="text-xs font-black text-yellow-100">{{ item.label }}</p>
                <p class="mt-1 text-sm font-black text-white">{{ item.status }}</p>
              </div>
            </div>
          </div>

          <CommonGamePlayBoard
            v-bind="commonEggBoundGameBoardProps"
            @play="handleCommonEggPlayBoardPlay"
            @preview="handleCommonEggPlayBoardPreview"
            @reset="handleCommonEggPlayBoardReset"
          />
        </section>


        <section
          v-if="showFormalEggCanaryCommonBoard"
          class="mb-5 rounded-[2rem] border border-amber-200/40 bg-red-950/80 p-4 text-left text-white shadow-2xl backdrop-blur"
        >
          <div class="mb-4 rounded-3xl border border-amber-200/30 bg-amber-300/10 p-4">
            <p class="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
              Formal Egg Canary Actual Display
            </p>
            <h2 class="mt-1 text-xl font-black text-white">
              第 4001～4400 批：正式金蛋頁 canary 實際顯示與 live apply 前驗收
            </h2>
            <p class="mt-2 text-sm font-bold leading-6 text-amber-50/90">
              目前只有在完整 formal canary 旗標下顯示 CommonGamePlayBoard；正式金蛋頁預設仍保留原流程，<span class="text-amber-200">?legacyEgg=1</span> 仍最高優先回退。
            </p>
            <div class="mt-3 grid gap-2 sm:grid-cols-2">
              <div class="rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
                <p class="text-xs font-black text-amber-100">route mode</p>
                <p class="mt-1 text-sm font-black text-white">{{ eggFormalRouteMode }}</p>
              </div>
              <div class="rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
                <p class="text-xs font-black text-amber-100">fallback</p>
                <p class="mt-1 text-sm font-black text-white">?legacyEgg=1 保留最高優先</p>
              </div>
            </div>
          </div>

          <CommonGamePlayBoard
            v-bind="commonEggBoundGameBoardProps"
            @play="handleCommonEggPlayBoardPlay"
            @preview="handleCommonEggPlayBoardPreview"
            @reset="handleCommonEggPlayBoardReset"
          />
        </section>

        
      <div
        v-if="shouldShowLineBrowserHint"
        class="mx-auto mb-4 max-w-3xl rounded-3xl border border-amber-200 bg-amber-50/95 p-4 text-amber-950 shadow-xl"
      >
        <div class="flex items-start gap-3">
          <div class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-400 text-xl">
            🌐
          </div>

          <div class="min-w-0 flex-1">
            <h3 class="text-base font-black">
              {{ campaign.lineBrowserHintTitle || '建議使用外部瀏覽器開啟' }}
            </h3>
            <p class="mt-1 text-sm font-bold leading-6 text-amber-900/80">
              你目前可能正在 LINE 內建瀏覽器中瀏覽。若畫面、分享或互動功能不穩，請點右上角「⋯」→ 選擇「以瀏覽器開啟」。
            </p>

            <div class="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-black text-white shadow-sm"
                @click="copyActivityUrlFromLineHint"
              >
                複製活動連結
              </button>

              <button
                type="button"
                class="rounded-2xl bg-white px-4 py-2 text-sm font-black text-amber-800 ring-1 ring-amber-200"
                @click="isLineBrowserHintClosed = true"
              >
                我知道了
              </button>
            </div>

            <p
              v-if="lineBrowserCopyMessage"
              class="mt-2 break-all rounded-2xl bg-white/80 p-2 text-xs font-bold text-amber-800"
            >
              {{ lineBrowserCopyMessage }}
            </p>
          </div>
        </div>
      </div>

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
              v-if="frontDisplay.showDebugInfo && (isOnlineMode || remoteLoadMessage)"
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
              v-if="!isActivityPlayable"
              class="mt-3 rounded-3xl border border-white/20 bg-white/15 px-4 py-4 text-center shadow-xl backdrop-blur"
            >
              <p class="text-sm font-black text-white">
                {{ activityStatusLabel }}
              </p>
              <p class="mt-1 text-xs font-bold text-yellow-50/90">
                {{ activityStatusText }}
              </p>
            </div>

            <div
              v-if="frontDisplay.showActivityTime && campaign.showActivityTimeSection"
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
                v-if="frontDisplay.showActivityCountdown && campaign.showActivityCountdown"
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
          v-if="frontDisplay.showRecentRecords && campaign.showMarqueeSection"
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
              v-if="isAdminMode"
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
                請輸入主辦單位產生的序號；驗證成功後才會取得砸蛋次數。
              </p>
            </div>

            <div class="flex flex-col gap-2 sm:flex-row">
              <input
                v-model="serialCodeInput"
                type="text"
                :placeholder="campaign.serialRedeemPlaceholder"
                class="min-h-[48px] flex-1 rounded-2xl border border-white/15 px-4 font-black uppercase outline-none placeholder:text-slate-400"
                :style="serialRedeemInputStyle"
                :disabled="!isActivityPlayable || isCracking || isSerialRedeeming || isSerialRedeemLocked"
                @keyup.enter="redeemSerialCode"
              />

              <button
                type="button"
                class="rounded-2xl px-5 py-3 font-black shadow-xl transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                :style="serialRedeemButtonStyle"
                :disabled="!isActivityPlayable || isCracking || isSerialRedeeming || isSerialRedeemLocked"
                @click="redeemSerialCode"
              >
                {{ isSerialRedeeming ? '正在檢查序號...' : (isSerialRedeemLocked ? `${serialRedeemLockLeftSeconds} 秒後再試` : campaign.serialRedeemButtonText) }}
              </button>
            </div>

            <p
              v-if="serialRedeemMessage"
              class="mt-2 rounded-2xl bg-white/12 px-3 py-2 text-xs font-black"
              :class="serialMessageClass"
            >
              {{ serialRedeemMessage }}
            </p>
          </div>

          <div
            v-if="frontDisplay.showShareButton && campaign.showShareButtonSection && campaign.showSystemShareButton"
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
            v-if="frontDisplay.showPrizeShelf && campaign.showPrizeShelfSection"
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
          v-if="frontDisplay.showRecentRecords && campaign.showRecentLogsSection"
          class="mt-4 rounded-3xl bg-white/95 p-4 text-slate-900 shadow-xl"
        >
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-sm font-black text-slate-900">
                我的抽獎紀錄
              </p>
              <p class="mt-1 text-xs font-bold text-slate-400">
                最近 {{ recentLogsPreview.length }} 筆紀錄直接顯示在前台
              </p>
            </div>

            <button
              v-if="recentLogs.length > recentLogsPreview.length"
              type="button"
              class="rounded-full bg-yellow-50 px-3 py-1.5 text-xs font-black text-yellow-700"
              @click="isRecentLogsOpen = !isRecentLogsOpen"
            >
              {{ isRecentLogsOpen ? '收合' : '全部紀錄' }}
            </button>
          </div>

          <div v-if="recentLogsPreview.length" class="mt-3 grid gap-2">
            <article
              v-for="log in recentLogsPreview"
              :key="log.id"
              class="flex items-center justify-between gap-3 rounded-2xl bg-yellow-50 px-3 py-2"
            >
              <div class="flex min-w-0 items-center gap-2">
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-lg shadow-sm">
                  🥚
                </span>
                <div class="min-w-0 text-left">
                  <p class="truncate text-xs font-black text-slate-900">
                    {{ log.prizeName }}
                  </p>
                  <p class="mt-0.5 truncate text-[11px] font-bold text-slate-400">
                    金蛋 {{ log.eggNumber }}｜{{ log.createdAt }}
                  </p>
                </div>
              </div>

              <span
                class="shrink-0 rounded-full bg-white px-3 py-1 text-[11px] font-black shadow-sm"
                :class="log.prizeType === 'lose' ? 'text-slate-500' : 'text-yellow-700'"
              >
                {{ log.prizeType === 'lose' ? '未中獎' : '中獎' }}
              </span>
            </article>
          </div>

          <div
            v-else
            class="mt-3 rounded-2xl bg-yellow-50 px-4 py-4 text-center text-xs font-black leading-5 text-yellow-700"
          >
            目前尚無抽獎紀錄，完成砸蛋後會直接顯示在這裡。
          </div>
        </section>

            <section
          v-if="frontDisplay.showRules || frontDisplay.showPrizeInfo"
          class="mt-4 grid gap-3 pb-8 md:grid-cols-2"
        >
          <div
            v-if="frontDisplay.showRules && campaign.showRuleSection"
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
            v-if="frontDisplay.showPrizeInfo && campaign.showPrizeInfoSection"
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
      v-if="frontDisplay.showBottomNav && campaign.showBottomNav"
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
            v-if="frontDisplay.showShareButton && player.chances <= 0 && campaign.showResultShareButton"
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
