<script setup>
import CommonGameTemplateForm from '../../components/common-game/CommonGameTemplateForm.vue'
import {
  createPremiumGridCommonAdapterSummary,
  createPremiumGridCommonTemplate,
  getPremiumGridCommonAdapterStatusCards
} from '../../config/commonGamePremiumGridAdapter'
import {
  getPremiumGridFormalSafetySummary,
  getPremiumGridFormalSafetyStatusCards,
  getPremiumGridFormalSafetyPhaseCards
} from '../../config/premiumGridCommonFormalSafetyCheck'
import {
  createDefaultCommonGameTemplate,
  normalizeCommonGameTemplate,
  createCommonGameTestUrl,
  getCommonGameModuleSummary
} from '../../config/commonGameModuleCore'
import { computed, reactive, ref } from 'vue'
import {
  COMMON_ADMIN_SETTING_SECTIONS,
  GAME_TEMPLATE_VERSION,
  getActiveGameTemplates,
  getPlannedGameTemplates,
  getCommonTemplateStableSummary,
  getCommonTemplateFrontendBackendSyncCheckpoint,
  getCommonTemplateTotalSyncStableCheckpoint,
  getCommonTemplateBulkBatchModeCheckpoint,
  getCommonTemplateBulk4050Mode,
  getCommonTemplateBulk4050StableCheckpoint,
  getCommonTemplateBulk4050SyncedStableCheckpoint,
  getCommonTemplateBulk150200Mode,
  getCommonTemplateBulk150200SyncedStableCheckpoint,
  getCommonTemplateBulk150200TotalStableCheckpoint,
  getCommonTemplateBulk150200FinalSafeCheckpoint,
  getCommonTemplateBulk150200CompletedCheckpoint,
  getCommonTemplateBulk150200TotalCompletedCheckpoint,
  getCommonTemplateBulk150200FinalTotalCheckpoint,
  getCommonTemplateBulk150200SyncedCompletedCheckpoint,
  getCommonTemplateBulk150200SyncedCompletedStableCheckpoint,
  getCommonTemplateBulk150200SyncedStableTotalCheckpoint,
  getCommonTemplateBulk150200SyncedAlignedCheckpoint,
  getCommonTemplateBulk150200SyncedTotalAlignedCheckpoint,
  getCommonTemplateBulk150200SyncedTotalAlignedCompletedCheckpoint,
  getCommonTemplateCompleteIntegrationStableCheckpoint,
  getCommonTemplateCompleteIntegrationReadCompletedCheckpoint,
  getCommonTemplateCompleteIntegrationTotalStableCheckpoint,
  getNextGameCreateDirection,
  getGameTemplateByType
} from '../../config/gameTemplateConfig'
import CommonGamePlayerView from '../front/games/CommonGamePlayerView.vue'

/**
 * Multi Game Platform V2.3 第 363 批：後台讀取精緻九宮格正式接入前安全檢查總基準版
 *
 * 檔案位置：
 * frontend/src/views/admin/AdminCommonGameEditorView.vue
 *
 * 本批目的：
 * 1. 延續第 240 批後台讀取精緻九宮格正式接入前安全檢查。
 * 2. 延續第 241～243 批 WheelPlayBoard 已建立、CommonGamePlayerView 已接入、前台測試入口已可切換 wheel。
 * 3. 後台公用設定頁新增預覽遊戲切換：egg-smash / wheel。
 * 3. 摘要會顯示：
 *    - 新遊戲 type
 *    - 新遊戲名稱
 *    - PlayBoard 路徑
 *    - 要修改哪些檔案
 *    - 前台共用哪些功能
 *    - 後台共用哪些功能
 *    - 下一步要做什麼
 * 4. 可下載 TXT 摘要，方便保存與貼到新對話延續。
 * 5. 產生可直接貼到新對話的延續提示。
 * 4. 可產生提示、複製提示、下載提示 TXT。
 * 5. 提示內容包含第 255 / 253 / 256 / 258 批基準。
 * 6. 延續第 343 批：後台讀取精緻九宮格正式接入前安全檢查版正常。
 * 7. 延續第 344 批：前台測試入口完整整合版正常。
 * 8. 延續第 345 批：gameTemplateConfig.js 已記錄完整整合前後台穩定備份。
 * 9. 本批讓後台讀取 getCommonTemplateCompleteIntegrationStableCheckpoint()。
 * 10. 不會修改正式 WheelGameView.vue，不會修改正式 PremiumGridLotteryView.vue，不會修改 router，不會影響正式頁。
 *
 * 本批安全原則：
 * - 不修改 router/index.js
 * - 不修改 PremiumGridLotteryView.vue
 * - 不修改 EggSmashPlayBoard.vue
 * - 不取代正式前台
 * - 不取代正式後台
 * - 只修改 /admin/common-game-editor 測試頁
 */

const selectedGameType = ref('wheel')
const activeSectionKey = ref('preview')
const previewMode = ref('desktop')
const isSaving = ref(false)
const savedMessage = ref('')
const previewDrawLogs = ref([])
const generatedSummaryVisible = ref(false)
const generatedSummaryAt = ref('')
const downloadedSummaryCount = ref(0)
const newChatPromptVisible = ref(false)
const stableBackupConfirmed = ref(true)
const templateFlowStableConfirmed = ref(true)
const frontCommonStableBatch = ref('V2.3 第 253 批')
const frontTestStableBatch = ref('V2.3 第 258 批')
const adminPromptFixStableBatch = ref('V2.3 第 260 批')
const configTotalStableBatch = ref('V2.3 第 261 批')
const adminEventLogs = ref([
  {
    id: 'init',
    text: '後台公用設定頁已載入',
    time: new Date().toLocaleString('zh-TW')
  }
])

const adminPreviewDescriptions = {
  'premium-grid': '測試精緻九宮格套用後台公用設定與前台公用玩家頁。',
  'egg-smash': '測試砸金蛋後台設定同步到前台公用玩家頁。',
  wheel: '測試幸運輪盤套用後台公用設定與前台公用玩家頁。'
}

const adminPreviewGameOptions = computed(() => {
  return getActiveGameTemplates().map((template) => ({
    type: template.type,
    label: template.label,
    icon: template.icon,
    playBoard: template.playBoardComponent,
    description: adminPreviewDescriptions[template.type] || template.description || '測試此遊戲套用後台公用設定與前台公用玩家頁。'
  }))
})

const commonTemplateStableSummary = computed(() => {
  return getCommonTemplateStableSummary()
})

const frontendBackendSyncCheckpoint = computed(() => {
  return getCommonTemplateFrontendBackendSyncCheckpoint()
})

const totalSyncStableCheckpoint = computed(() => {
  return getCommonTemplateTotalSyncStableCheckpoint()
})

const bulkBatchModeCheckpoint = computed(() => {
  return getCommonTemplateBulkBatchModeCheckpoint()
})

const bulk4050ModeCheckpoint = computed(() => {
  return getCommonTemplateBulk4050Mode()
})

const bulk4050StableCheckpoint = computed(() => {
  return getCommonTemplateBulk4050StableCheckpoint()
})

const bulk4050SyncedStableCheckpoint = computed(() => {
  return getCommonTemplateBulk4050SyncedStableCheckpoint()
})

const bulk150200ModeCheckpoint = computed(() => {
  return getCommonTemplateBulk150200Mode()
})

const bulk150200SyncedStableCheckpoint = computed(() => {
  return getCommonTemplateBulk150200SyncedStableCheckpoint()
})

const bulk150200TotalStableCheckpoint = computed(() => {
  return getCommonTemplateBulk150200TotalStableCheckpoint()
})

const bulk150200FinalSafeCheckpoint = computed(() => {
  return getCommonTemplateBulk150200FinalSafeCheckpoint()
})

const bulk150200CompletedCheckpoint = computed(() => {
  return getCommonTemplateBulk150200CompletedCheckpoint()
})

const bulk150200TotalCompletedCheckpoint = computed(() => {
  return getCommonTemplateBulk150200TotalCompletedCheckpoint()
})

const bulk150200FinalTotalCheckpoint = computed(() => {
  return getCommonTemplateBulk150200FinalTotalCheckpoint()
})

const bulk150200SyncedCompletedCheckpoint = computed(() => {
  return getCommonTemplateBulk150200SyncedCompletedCheckpoint()
})

const bulk150200SyncedCompletedStableCheckpoint = computed(() => {
  return getCommonTemplateBulk150200SyncedCompletedStableCheckpoint()
})

const bulk150200SyncedStableTotalCheckpoint = computed(() => {
  return getCommonTemplateBulk150200SyncedStableTotalCheckpoint()
})

const bulk150200SyncedAlignedCheckpoint = computed(() => {
  return getCommonTemplateBulk150200SyncedAlignedCheckpoint()
})

const bulk150200SyncedTotalAlignedCheckpoint = computed(() => {
  return getCommonTemplateBulk150200SyncedTotalAlignedCheckpoint()
})

const bulk150200SyncedTotalAlignedCompletedCheckpoint = computed(() => {
  return getCommonTemplateBulk150200SyncedTotalAlignedCompletedCheckpoint()
})

const completeIntegrationStableCheckpoint = computed(() => {
  return getCommonTemplateCompleteIntegrationStableCheckpoint()
})

const completeIntegrationReadCompletedCheckpoint = computed(() => {
  return getCommonTemplateCompleteIntegrationReadCompletedCheckpoint()
})

const completeIntegrationTotalStableCheckpoint = computed(() => {
  return getCommonTemplateCompleteIntegrationTotalStableCheckpoint()
})

const commonGameModuleSummary = computed(() => {
  return getCommonGameModuleSummary()
})

// 第 56001～56400 批：修正 v-model 綁定 const reactive 警告
// 這個物件會被 CommonGameTemplateForm 的 v-model 更新，必須用 let，避免 Vue compiler 警告。
let commonTemplateFormModel = reactive(
  createDefaultCommonGameTemplate('GRID', {
    id: 'admin-common-grid-template-form-test',
    label: '後台共用模板表單測試',
    status: 'testing',
    description: '第 357 批：後台正式套用 CommonGameTemplateForm，用來驗證共用模板基本設定、視覺設定、PlayBoard 設定、前台顯示設定與安全規則。',
    playBoard: {
      testOnly: true,
      formalUrlSafe: true,
      legacyFallback: true,
      showHeader: true,
      showPrizePreview: true,
      showActivityInfo: true,
      showResultPanel: true,
      showDebugPanel: false,
      animationMode: 'safe',
      layoutMode: 'responsive'
    },
    admin: {
      showTemplateSummary: true,
      showStatusCards: true,
      showFieldGroups: true,
      showPreviewPanel: true,
      stickyPreview: true,
      rememberCollapseState: true,
      allowResetSection: true,
      allowCopyConfig: true,
      allowOpenTestUrl: true,
      allowFormalUrlTool: false
    }
  })
)

const commonTemplateFormCards = computed(() => [
  {
    label: '共用核心',
    value: commonGameModuleSummary.value.batch,
    icon: '🧩'
  },
  {
    label: '共用 PlayBoard',
    value: 'V2.3 第 354 批',
    icon: '🧱'
  },
  {
    label: '共用表單',
    value: 'V2.3 第 355 批',
    icon: '📝'
  },
  {
    label: '前台套用',
    value: 'V2.3 第 356 批',
    icon: '🧪'
  },
  {
    label: '本批後台套用',
    value: 'V2.3 第 363 批',
    icon: '✅'
  },
  {
    label: '正式頁保護',
    value: '啟用',
    icon: '🔒'
  },
  {
    label: '交付模式',
    value: '整份 TXT 覆蓋',
    icon: '📄'
  },
  {
    label: '下一步',
    value: `V2.3 第 ${nextBatchNumber.value} 批`,
    icon: '➡️'
  }
])

const premiumGridCommonTemplate = computed(() => {
  return createPremiumGridCommonTemplate({
    id: 'admin-premium-grid-common-adapter-test',
    label: '後台精緻九宮格共用模板',
    status: 'testing',
    description: '第 360 批：後台讀取 commonGamePremiumGridAdapter.js，驗證 GRID 共用模板、九宮格欄位、後台摘要卡與正式頁安全檢查。'
  })
})

const premiumGridAdapterSummary = computed(() => {
  return createPremiumGridCommonAdapterSummary(premiumGridCommonTemplate.value)
})

const premiumGridAdapterStatusCards = computed(() => {
  return getPremiumGridCommonAdapterStatusCards()
})

const premiumGridAdminCards = computed(() => {
  return premiumGridAdapterSummary.value.adminCards || []
})

const premiumGridFormalSafeChecks = computed(() => {
  return premiumGridAdapterSummary.value.formalSafeCheck?.checks || []
})

const premiumGridAdapterSafeRules = computed(() => {
  return premiumGridAdapterSummary.value.safeRules || []
})

const premiumGridAdapterFlowGroups = computed(() => [
  {
    key: 'adapter',
    title: 'GRID 共用轉接器',
    icon: '🔌',
    description: 'commonGamePremiumGridAdapter.js 負責把精緻九宮格資料轉成共用模板格式。',
    items: [
      'PremiumGrid template',
      'GRID 欄位分類',
      '後台摘要卡',
      '前台摘要卡',
      'formalSafeCheck',
      'adapterSummary'
    ]
  },
  {
    key: 'admin',
    title: '後台中控台讀取',
    icon: '🛠️',
    description: '後台先讀取 GRID adapter，確認設定表單與安全檢查可以共用。',
    items: [
      'GRID 模板',
      '後台摘要卡',
      'CommonGameTemplateForm',
      '九宮格欄位',
      '正式頁隔離',
      '下一步正式接入前檢查'
    ]
  },
  {
    key: 'formal-safe',
    title: '正式頁安全檢查',
    icon: '🔒',
    description: '本批只檢查安全狀態，不修改正式 PremiumGridLotteryView.vue。',
    items: [
      'formalUrlSafe',
      'legacyFallback',
      'testOnly',
      'gridCells',
      'validation',
      '不接正式頁'
    ]
  }
])

const premiumGridFormalSafetySummary = computed(() => {
  return getPremiumGridFormalSafetySummary()
})

const premiumGridFormalSafetyStatusCards = computed(() => {
  return getPremiumGridFormalSafetyStatusCards()
})

const premiumGridFormalSafetyPhaseCards = computed(() => {
  return getPremiumGridFormalSafetyPhaseCards()
})

const premiumGridFormalCriticalChecks = computed(() => {
  return premiumGridFormalSafetySummary.value.criticalChecks || []
})

const premiumGridFormalCriticalRules = computed(() => {
  return premiumGridFormalSafetySummary.value.criticalRules || []
})

const premiumGridFormalRecommendedRules = computed(() => {
  return premiumGridFormalSafetySummary.value.recommendedRules || []
})

const premiumGridFormalSafetyFlowGroups = computed(() => [
  {
    key: 'critical',
    title: 'Critical 安全檢查',
    icon: '🛡️',
    description: '正式九宮格頁接入共用模組前，critical checks 必須全部通過。',
    items: [
      'formalUrlSafe',
      'legacyFallback',
      'testOnly',
      'adapterFormalCheck',
      'readyForFormalPage'
    ]
  },
  {
    key: 'phase',
    title: '正式接入階段',
    icon: '🧭',
    description: '目前只在第 363 批讓後台讀取安全檢查，正式頁仍不修改。',
    items: [
      '第 361 批安全檢查',
      '第 362 批前台讀取',
      '第 363 批後台讀取',
      '第 364 批正式旗標',
      '第 365 批正式 PlayBoard',
      '第 366 批穩定備份'
    ]
  },
  {
    key: 'formal-lock',
    title: '正式頁鎖定',
    icon: '🔒',
    description: '本批仍禁止直接修改正式 PremiumGridLotteryView.vue。',
    items: [
      '不動正式頁',
      '不動 router',
      '不動 API',
      '不動 DB',
      '不動機率核心',
      '不動 tenant 權限'
    ]
  }
])

const commonTemplateFormFlowGroups = computed(() => [
  {
    key: 'core',
    title: '共用核心資料',
    icon: '🧩',
    description: '由 commonGameModuleCore.js 提供共用遊戲類型、模板狀態、預設值、驗證與 URL 工具。',
    items: [
      '遊戲類型',
      '模板狀態',
      '欄位分類',
      '安全規則',
      'normalize',
      'validate'
    ]
  },
  {
    key: 'form',
    title: '共用後台表單',
    icon: '📝',
    description: '由 CommonGameTemplateForm.vue 提供可重用的後台模板設定區。',
    items: [
      '基本設定',
      '視覺設定',
      'PlayBoard 設定',
      '前台顯示',
      '驗證結果',
      '安全規則'
    ]
  },
  {
    key: 'safe',
    title: '正式頁安全隔離',
    icon: '🔒',
    description: '本批只在後台中控台套用表單，不接正式玩家頁、不改 router、不改 API、不改 DB。',
    items: [
      '不動正式頁',
      '不動 router',
      '不動 API',
      '不動 DB',
      '不動機率核心',
      '保留 fallback'
    ]
  }
])

const handleCommonTemplateFormChange = (template) => {
  Object.assign(commonTemplateFormModel, normalizeCommonGameTemplate(template))
}

const handleCommonTemplateFormSubmit = ({ template, validation }) => {
  Object.assign(commonTemplateFormModel, normalizeCommonGameTemplate(template))
  console.log('Common template form submit:', { template, validation })
}

const handleCommonTemplateFormReset = (template) => {
  Object.assign(commonTemplateFormModel, normalizeCommonGameTemplate(template))
}

const handleCommonTemplateFormCopy = (template) => {
  console.log('Common template copied:', template)
}

const handleCommonTemplateFormOpenTest = (template) => {
  const url = createCommonGameTestUrl(template?.type || 'GRID')
  window.open(url, '_blank', 'noopener,noreferrer')
}

const nextGameCreateDirection = computed(() => {
  return getNextGameCreateDirection()
})

const nextBatchNumber = computed(() => 364)

const newChatPromptText = computed(() => {
  return [
    `請以這份為目前最新基準，下一步從第 ${nextBatchNumber.value} 批開始。`,
    ``,
    `目前專案：Multi Game Platform V2.3`,
    ``,
    `目前總穩定基準：`,
    `- ${totalSyncStableCheckpoint.value.batch}：${totalSyncStableCheckpoint.value.title}`,
    `- 前台公用玩家頁：${commonTemplateStableSummary.value.frontStableBatch}`,
    `- 後台公用設定頁：${commonTemplateStableSummary.value.adminStableBatch || adminPromptFixStableBatch.value}`,
    `- 前台測試入口：${frontTestStableBatch.value}`,
    `- 設定檔：${commonTemplateStableSummary.value.configFile}`,
    ``,
    `目前已完成：`,
    `- gameTemplateConfig.js 已建立公用模板總穩定基準`,
    `- CommonGamePlayerView 已支援 premium-grid / egg-smash / wheel`,
    `- CommonGamePlayerTestView 已可產生新對話延續提示`,
    `- AdminCommonGameEditorView 已可讀取總穩定基準並產生新對話延續提示`,
    `- active 模板給前台 / 後台預覽切換`,
    `- planned 模板給新遊戲生成器規劃`,
    ``,
    `active 模板：`,
    ...adminPreviewGameOptions.value.map((game) => `- ${game.type}｜${game.label}｜${game.playBoard}`),
    ``,
    `planned 模板：`,
    ...generatorPresets.value.map((game) => `- ${game.gameType}｜${game.gameLabel}｜${game.playBoardName}`),
    ``,
    `後續新增新遊戲流程：`,
    ...nextGameCreateDirection.value.map((step) => `- ${step}`),
    ``,
    `重要要求：`,
    `- 後面請繼續從公用模板方向做`,
    `- 新遊戲先 planned 規劃，再建立自己的 PlayBoard`,
    `- 前台繼續套 CommonGamePlayerView`,
    `- 後台繼續套 AdminCommonGameEditorView`,
    `- 若系統很穩定，整理型批次可一次整理 150～200 項`,
    `- 中風險改動建議 40～80 項`,
    `- 若有錯誤，先小批修錯 1～5 項`,
    `- 每次修改請給我 TXT 下載檔`,
    `- 不要做圖片，除非我明確要求做圖片`,
    `- 不要影響正式 WheelGameView.vue、PremiumGridLotteryView.vue、router/index.js`
  ].join('\n')
})

const generatorForm = reactive({
  gameType: 'scratch-card',
  gameLabel: '刮刮卡',
  gameIcon: '🎫',
  playBoardName: 'ScratchCardPlayBoard',
  frontTestEnabled: true,
  adminCommonEnabled: true,
  needPrizeSettings: true,
  needStyleSettings: true,
  needAnimationSettings: true,
  note: '新遊戲先套公用前台與後台，再補自己的 PlayBoard。'
})

const commonGameForm = reactive({
  basic: {
    title: '砸金蛋活動',
    subtitle: '敲開金蛋 抽限定好禮',
    description: '這是砸金蛋套用公用模板的安全預覽版。後台專屬設定會同步到前台 EggSmashPlayBoard。',
    status: 'draft',
    startAt: '',
    endAt: '',
    tenantSlug: 'a-shop',
    brandName: 'Demo Shop'
  },
  chance: {
    defaultChances: 3,
    dailyLimit: 1,
    requireLogin: true,
    shareBonusEnabled: true,
    shareBonusChances: 1
  },
  prizes: [
    {
      id: 1,
      name: '金蛋大獎',
      title: '金蛋大獎',
      shortName: '大獎',
      icon: '🏆',
      quantity: 3,
      remaining: 3,
      probability: 5,
      enabled: true
    },
    {
      id: 2,
      name: '優惠券 100 元',
      title: '優惠券 100 元',
      shortName: '100 元',
      icon: '🎁',
      quantity: 20,
      remaining: 20,
      probability: 25,
      enabled: true
    },
    {
      id: 3,
      name: '再接再厲',
      title: '再接再厲',
      shortName: '再來',
      icon: '🍀',
      quantity: 999,
      remaining: 999,
      probability: 70,
      enabled: true
    }
  ],
  rules: [
    '玩家點選金蛋後，系統會進入正式抽獎流程。',
    '金蛋數量、破蛋動畫、錘子效果會由砸金蛋專屬 PlayBoard 控制。',
    '獎品、規則、領獎、紀錄、報表仍走公用模板。'
  ],
  claim: {
    title: '砸金蛋領獎提醒',
    description: '中獎後請依活動頁面或店家公告完成領獎。',
    contactText: '如有問題請聯繫活動客服。'
  },
  style: {
    themeName: 'golden-egg',
    primaryColor: '#f59e0b',
    backgroundStyle: 'gold-gradient',
    buttonText: '立即砸蛋',
    cardStyle: 'gold-soft'
  },
  share: {
    enabled: true,
    title: '快來砸金蛋抽好禮',
    description: '敲開金蛋，有機會獲得限定優惠與神秘大獎。',
    imageUrl: '',
    siteButtonText: '立即砸蛋'
  },
  records: {
    totalPlayers: 0,
    totalDraws: 0,
    totalWins: 0,
    lastUpdatedAt: new Date().toLocaleString('zh-TW')
  },
  reports: {
    exportEnabled: true,
    dateRange: 'last_7_days',
    note: '砸金蛋正式接入後，會共用報表中心與匯出功能。'
  },
  eggSmashSpecific: {
    eggCount: 9,
    hammerEnabled: true,
    brokenEggEffect: 'gold-particles',
    eggImageMode: 'card-gold',
    resultRevealMode: 'modal-after-break',
    buttonText: '立即砸蛋'
  },
  wheelSpecific: {
    buttonText: '立即轉動',
    spinDuration: 2800,
    wheelTheme: 'gold-stage',
    pointerStyle: 'red-pointer'
  }
})

const stableCheckpoint = {
  batch: 'V2.3 第 363 批',
  title: '後台讀取精緻九宮格正式接入前安全檢查版',
  frontCommonView: 'CommonGamePlayerView.vue',
  adminCommonView: 'AdminCommonGameEditorView.vue',
  testEntryView: 'CommonGamePlayerTestView.vue',
  configFile: 'gameTemplateConfig.js',
  currentSafeDirection: '新遊戲先套公用前台與後台，再補自己的 PlayBoard 與專屬設定',
  stableNote: '之後若做壞，可回到第 240 批作為公用模板階段安全基準。'
}

const quickLinks = [
  {
    label: '前台公用測試入口',
    description: '測 CommonGamePlayerView 與遊戲切換。',
    url: '/dev/common-game-player-test',
    icon: '🧩',
    type: 'front-test'
  },
  {
    label: '後台公用設定頁',
    description: '目前這一頁，測後台設定同步預覽。',
    url: '/admin/common-game-editor',
    icon: '🛠️',
    type: 'current'
  },
  {
    label: '正式九宮格玩家頁',
    description: '確認正式玩家頁沒有被公用測試影響。',
    url: '/play/a-shop/premium-grid',
    icon: '🎯',
    type: 'formal'
  }
]

const generatorPresets = computed(() => {
  return getPlannedGameTemplates().map((template) => ({
    gameType: template.type,
    gameLabel: template.label,
    gameIcon: template.icon,
    playBoardName: template.playBoardComponent,
    description: template.description || '此遊戲目前為 planned，可用生成器規劃下一步。'
  }))
})

const selectedGameTemplate = computed(() => {
  return getGameTemplateByType(selectedGameType.value)
})

const selectedPreviewGameOption = computed(() => {
  return adminPreviewGameOptions.value.find((item) => item.type === selectedGameType.value) || adminPreviewGameOptions.value[0]
})

const templateStatusOverviewCards = computed(() => [
  {
    label: '總穩定基準',
    value: commonTemplateStableSummary.value.batch,
    icon: '🛡️',
    class: 'border-emerald-100 bg-emerald-50 text-emerald-700'
  },
  {
    label: '前台公用基準',
    value: commonTemplateStableSummary.value.frontStableBatch || frontCommonStableBatch.value,
    icon: '🧩',
    class: 'border-cyan-100 bg-cyan-50 text-cyan-700'
  },
  {
    label: '後台公用基準',
    value: commonTemplateStableSummary.value.adminStableBatch || 'V2.3 第 363 批',
    icon: '🛠️',
    class: 'border-indigo-100 bg-indigo-50 text-indigo-700'
  },
  {
    label: '資料來源',
    value: commonTemplateStableSummary.value.configFile || 'gameTemplateConfig.js',
    icon: '🧬',
    class: 'border-violet-100 bg-violet-50 text-violet-700'
  }
])

const activeSection = computed(() => {
  return COMMON_ADMIN_SETTING_SECTIONS.find((section) => section.key === activeSectionKey.value) || COMMON_ADMIN_SETTING_SECTIONS[0]
})

const enabledPrizes = computed(() => {
  return commonGameForm.prizes.filter((prize) => prize.enabled)
})

const premiumGridPreviewPrizes = computed(() => [
  {
    id: 'grid-1',
    name: '優惠券 100 元',
    title: '優惠券 100 元',
    shortName: '100 元',
    icon: '🎁',
    quantity: 10,
    remaining: 10
  },
  {
    id: 'grid-2',
    name: '限定小禮',
    title: '限定小禮',
    shortName: '小禮',
    icon: '✨',
    quantity: 5,
    remaining: 5
  },
  {
    id: 'grid-3',
    name: '品牌折扣',
    title: '品牌折扣',
    shortName: '折扣',
    icon: '🏷️',
    quantity: 20,
    remaining: 20
  },
  {
    id: 'grid-4',
    name: '會員點數',
    title: '會員點數',
    shortName: '點數',
    icon: '⭐',
    quantity: 30,
    remaining: 30
  },
  {
    id: 'grid-5',
    name: '立即抽獎',
    title: '立即抽獎',
    shortName: '抽獎',
    icon: '🎯',
    quantity: 999,
    remaining: 999,
    isCenter: true
  },
  {
    id: 'grid-6',
    name: '再接再厲',
    title: '再接再厲',
    shortName: '再來',
    icon: '🍀',
    quantity: 999,
    remaining: 999
  },
  {
    id: 'grid-7',
    name: '飲品兌換',
    title: '飲品兌換',
    shortName: '飲品',
    icon: '🥤',
    quantity: 12,
    remaining: 12
  },
  {
    id: 'grid-8',
    name: '神秘好禮',
    title: '神秘好禮',
    shortName: '好禮',
    icon: '🎊',
    quantity: 3,
    remaining: 3
  },
  {
    id: 'grid-9',
    name: '下次優惠',
    title: '下次優惠',
    shortName: '優惠',
    icon: '💎',
    quantity: 18,
    remaining: 18
  }
])

const wheelPreviewPrizes = computed(() => [
  {
    id: 'wheel-1',
    name: '輪盤大獎',
    title: '輪盤大獎',
    shortName: '大獎',
    icon: '🏆',
    quantity: 2,
    remaining: 2,
    probability: 5
  },
  {
    id: 'wheel-2',
    name: '優惠券 200 元',
    title: '優惠券 200 元',
    shortName: '200 元',
    icon: '🎁',
    quantity: 8,
    remaining: 8,
    probability: 15
  },
  {
    id: 'wheel-3',
    name: '限定飲品',
    title: '限定飲品',
    shortName: '飲品',
    icon: '🥤',
    quantity: 12,
    remaining: 12,
    probability: 20
  },
  {
    id: 'wheel-4',
    name: '會員點數',
    title: '會員點數',
    shortName: '點數',
    icon: '⭐',
    quantity: 30,
    remaining: 30,
    probability: 20
  },
  {
    id: 'wheel-5',
    name: '品牌折扣',
    title: '品牌折扣',
    shortName: '折扣',
    icon: '🏷️',
    quantity: 16,
    remaining: 16,
    probability: 20
  },
  {
    id: 'wheel-6',
    name: '再接再厲',
    title: '再接再厲',
    shortName: '再來',
    icon: '🍀',
    quantity: 999,
    remaining: 999,
    probability: 20
  }
])

const eggSmashPreviewPrizes = computed(() => {
  return enabledPrizes.value.map((prize, index) => ({
    id: prize.id || index + 1,
    name: prize.name || prize.title || `獎項 ${index + 1}`,
    title: prize.title || prize.name || `獎項 ${index + 1}`,
    shortName: prize.shortName || prize.name || prize.title || `獎項 ${index + 1}`,
    icon: prize.icon || '🎁',
    quantity: Number(prize.quantity || 0),
    remaining: Number(prize.remaining ?? prize.quantity ?? 0),
    probability: Number(prize.probability || 0),
    isCenter: false
  }))
})

const previewPrizes = computed(() => {
  if (selectedGameType.value === 'wheel') return wheelPreviewPrizes.value
  if (selectedGameType.value === 'premium-grid') return premiumGridPreviewPrizes.value

  return eggSmashPreviewPrizes.value
})

const previewCampaign = computed(() => ({
  id: `preview-${selectedGameType.value}`,
  title: commonGameForm.basic.title,
  subtitle: commonGameForm.basic.subtitle,
  description: commonGameForm.basic.description,
  statusText: commonGameForm.basic.status === 'active' ? '活動進行中' : '草稿預覽',
  tenantSlug: commonGameForm.basic.tenantSlug || 'a-shop',
  brandName: commonGameForm.basic.brandName || 'Demo Shop',
  claimTitle: commonGameForm.claim.title,
  claimDescription: commonGameForm.claim.description,
  contactText: commonGameForm.claim.contactText,
  pageTitle: commonGameForm.basic.title
}))

const previewPlayer = computed(() => ({
  id: 'admin-preview-player',
  name: '後台預覽玩家',
  chances: Number(commonGameForm.chance.defaultChances || 0),
  usedChances: 0
}))

const previewRules = computed(() => {
  if (selectedGameType.value === 'wheel') {
    return [
      '玩家點擊立即轉動後，輪盤會旋轉並停在其中一個獎項。',
      'WheelPlayBoard 只負責輪盤畫面與旋轉互動，正式結果由 CommonGamePlayerView 處理。',
      '獎品、規則、領獎、紀錄與結果彈窗共用 CommonGamePlayerView。',
      '這是安全預覽，不會取代正式 WheelGameView.vue。'
    ]
  }

  if (selectedGameType.value === 'premium-grid') {
    return [
      '玩家點擊九宮格中心按鈕後，九宮格會進入抽獎流程。',
      'PremiumGridPlayBoard 只負責九宮格玩法互動，正式結果由 CommonGamePlayerView 處理。',
      '獎品、規則、領獎、紀錄與結果彈窗共用 CommonGamePlayerView。',
      '這是安全預覽，不會影響正式九宮格玩家頁。'
    ]
  }

  return commonGameForm.rules.filter((rule) => String(rule || '').trim())
})

const previewClaimInfo = computed(() => ({
  title: commonGameForm.claim.title,
  description: commonGameForm.claim.description,
  contactText: commonGameForm.claim.contactText
}))

const previewEggSmashOptions = computed(() => ({
  eggCount: Number(commonGameForm.eggSmashSpecific.eggCount || 9),
  hammerEnabled: Boolean(commonGameForm.eggSmashSpecific.hammerEnabled),
  brokenEggEffect: commonGameForm.eggSmashSpecific.brokenEggEffect || 'gold-particles',
  buttonText: commonGameForm.eggSmashSpecific.buttonText || commonGameForm.style.buttonText || '立即砸蛋',
  eggImageMode: commonGameForm.eggSmashSpecific.eggImageMode,
  resultRevealMode: commonGameForm.eggSmashSpecific.resultRevealMode
}))

const previewWheelOptions = computed(() => ({
  buttonText: commonGameForm.wheelSpecific.buttonText || '立即轉動',
  spinDuration: Number(commonGameForm.wheelSpecific.spinDuration || 2800),
  wheelTheme: commonGameForm.wheelSpecific.wheelTheme || 'gold-stage',
  pointerStyle: commonGameForm.wheelSpecific.pointerStyle || 'red-pointer'
}))

const totalPrizeQuantity = computed(() => {
  return commonGameForm.prizes.reduce((total, prize) => {
    return total + Number(prize.quantity || 0)
  }, 0)
})

const totalProbability = computed(() => {
  return commonGameForm.prizes.reduce((total, prize) => {
    return total + Number(prize.probability || 0)
  }, 0)
})

const playBoardPath = computed(() => {
  return `frontend/src/views/front/games/playboards/${generatorForm.playBoardName || 'NewGamePlayBoard'}.vue`
})

const generatedPaths = computed(() => {
  const type = generatorForm.gameType || 'new-game'
  const playBoard = generatorForm.playBoardName || 'NewGamePlayBoard'

  return [
    {
      label: 'PlayBoard 元件',
      path: `frontend/src/views/front/games/playboards/${playBoard}.vue`,
      description: '新遊戲唯一需要主要製作的玩法區。'
    },
    {
      label: '公用模板設定',
      path: 'frontend/src/config/gameTemplateConfig.js',
      description: `新增 type: "${type}"，指定 playBoardComponent: "${playBoard}"。`
    },
    {
      label: '前台公用測試入口',
      path: 'frontend/src/views/front/games/CommonGamePlayerTestView.vue',
      description: '加入遊戲切換選項與測試資料。'
    },
    {
      label: '後台公用設定頁',
      path: 'frontend/src/views/admin/AdminCommonGameEditorView.vue',
      description: '共用基本設定、獎品、規則、樣式、紀錄、報表與預覽。'
    }
  ]
})

const frontSharedFeatures = [
  '活動標題 / 副標 / 說明',
  '玩家剩餘次數',
  '獎品展示',
  '活動規則',
  '領獎資訊',
  '抽獎紀錄',
  '結果彈窗',
  '分享事件'
]

const adminSharedFeatures = [
  '基本設定',
  '遊玩次數設定',
  '獎品與機率設定',
  '規則設定',
  '領獎設定',
  '樣式設定',
  '紀錄 / 報表骨架',
  '前台即時預覽'
]

const generatorChecklist = computed(() => [
  {
    label: '建立 PlayBoard',
    done: false,
    description: `建立 ${generatorForm.playBoardName || 'NewGamePlayBoard'}.vue，只負責玩法互動與 @draw。`
  },
  {
    label: '登記 gameTemplateConfig',
    done: false,
    description: `新增 ${generatorForm.gameType || 'new-game'} 模板設定。`
  },
  {
    label: '套用 CommonGamePlayerView',
    done: true,
    description: '前台活動資訊、獎品、規則、領獎、紀錄與結果彈窗共用。'
  },
  {
    label: '套用 AdminCommonGameEditorView',
    done: true,
    description: '後台基本設定、獎品、機率、樣式與即時預覽共用。'
  },
  {
    label: '補遊戲專屬設定',
    done: false,
    description: '只補該遊戲獨有的玩法設定，例如格數、速度、翻牌數、刮刮區大小。'
  },
  {
    label: '加入測試入口切換',
    done: false,
    description: '/dev/common-game-player-test 加入新遊戲選項。'
  }
])

const generatedSummaryText = computed(() => {
  return [
    `【公用模板新遊戲規劃摘要】`,
    `產生時間：${generatedSummaryAt.value || '尚未產生'}`,
    ``,
    `1. 新遊戲基本資料`,
    `- type：${generatorForm.gameType || 'new-game'}`,
    `- 名稱：${generatorForm.gameLabel || '未命名遊戲'}`,
    `- icon：${generatorForm.gameIcon || '🎮'}`,
    `- PlayBoard：${generatorForm.playBoardName || 'NewGamePlayBoard'}`,
    ``,
    `2. 主要檔案位置`,
    `- PlayBoard：${playBoardPath.value}`,
    `- 模板設定：frontend/src/config/gameTemplateConfig.js`,
    `- 前台測試入口：frontend/src/views/front/games/CommonGamePlayerTestView.vue`,
    `- 後台公用設定頁：frontend/src/views/admin/AdminCommonGameEditorView.vue`,
    ``,
    `3. 前台共用功能`,
    ...frontSharedFeatures.map((item) => `- ${item}`),
    ``,
    `4. 後台共用功能`,
    ...adminSharedFeatures.map((item) => `- ${item}`),
    ``,
    `5. 目前穩定基準`,
    `- ${stableCheckpoint.batch}：${stableCheckpoint.title}`,
    `- ${stableCheckpoint.stableNote}`,
    ``,
    `6. 下一步`,
    `- 先建立 ${generatorForm.playBoardName || 'NewGamePlayBoard'}.vue`,
    `- 讓 PlayBoard 只負責玩法畫面與 @draw 事件`,
    `- 把新遊戲登記到 gameTemplateConfig.js`,
    `- 加入 CommonGamePlayerTestView 遊戲切換`,
    `- 再補 AdminCommonGameEditorView 的專屬設定面板`
  ].join('\n')
})

const adminSummaryCards = computed(() => [
  {
    label: '目前遊戲',
    value: selectedPreviewGameOption.value?.label || '幸運輪盤',
    icon: selectedPreviewGameOption.value?.icon || '🎡',
    class: 'bg-indigo-50 text-indigo-700 border-indigo-100'
  },
  {
    label: '新遊戲生成器',
    value: generatorForm.gameLabel || '未命名',
    icon: generatorForm.gameIcon || '🎮',
    class: 'bg-violet-50 text-violet-700 border-violet-100'
  },
  {
    label: '穩定基準',
    value: stableBackupConfirmed.value ? '第 250 批' : '未標記',
    icon: '🛡️',
    class: stableBackupConfirmed.value
      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
      : 'bg-slate-50 text-slate-600 border-slate-100'
  },
  {
    label: '前台預覽',
    value: '已同步',
    icon: '🖥️',
    class: 'bg-cyan-50 text-cyan-700 border-cyan-100'
  }
])

const safetyItems = computed(() => [
  {
    label: '不取代原後台',
    value: '安全',
    done: true
  },
  {
    label: '不真的寫檔',
    value: '安全',
    done: true
  },
  {
    label: '穩定備份',
    value: '第 240 批',
    done: true
  },
  {
    label: '公用模板方向',
    value: '正確',
    done: true
  }
])

const switchPreviewGame = (type) => {
  selectedGameType.value = type
  previewDrawLogs.value = []
  addAdminEventLog(`切換後台預覽遊戲：${type}`)
}

const generateNewChatPrompt = () => {
  newChatPromptVisible.value = true
  addAdminEventLog('產生後台公用模板總穩定備份新對話提示')
}

const copyNewChatPrompt = async () => {
  try {
    await navigator.clipboard.writeText(newChatPromptText.value)
    addAdminEventLog('新對話延續提示已複製到剪貼簿')
  } catch (error) {
    addAdminEventLog('新對話延續提示複製失敗，請手動選取複製')
  }
}

const downloadNewChatPromptTxt = () => {
  if (!newChatPromptVisible.value) {
    generateNewChatPrompt()
  }

  const fileName = 'admin_common_template_new_chat_prompt_v23_batch363.txt'
  const blob = new Blob([newChatPromptText.value], {
    type: 'text/plain;charset=utf-8'
  })

  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)

  addAdminEventLog(`下載新對話延續提示 TXT：${fileName}`)
}

const addAdminEventLog = (text) => {
  adminEventLogs.value.unshift({
    id: `admin-event-${Date.now()}-${Math.random()}`,
    text,
    time: new Date().toLocaleString('zh-TW')
  })
}

const applyGeneratorPreset = (preset) => {
  generatorForm.gameType = preset.gameType
  generatorForm.gameLabel = preset.gameLabel
  generatorForm.gameIcon = preset.gameIcon
  generatorForm.playBoardName = preset.playBoardName
  generatedSummaryVisible.value = false
  generatedSummaryAt.value = ''

  addAdminEventLog(`套用新遊戲預設：${preset.gameLabel}`)
}

const generateSummary = () => {
  generatedSummaryAt.value = new Date().toLocaleString('zh-TW')
  generatedSummaryVisible.value = true

  addAdminEventLog(`產生新遊戲規劃摘要：${generatorForm.gameLabel}`)
}

const copySummary = async () => {
  try {
    await navigator.clipboard.writeText(generatedSummaryText.value)
    addAdminEventLog('規劃摘要已複製到剪貼簿')
  } catch (error) {
    addAdminEventLog('規劃摘要複製失敗，請手動選取複製')
  }
}

const downloadSummaryTxt = () => {
  if (!generatedSummaryVisible.value) {
    generateSummary()
  }

  const safeType = String(generatorForm.gameType || 'new-game')
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, '-')

  const fileName = `common_game_template_plan_${safeType}_v23_batch240.txt`
  const blob = new Blob([generatedSummaryText.value], {
    type: 'text/plain;charset=utf-8'
  })

  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)

  downloadedSummaryCount.value += 1
  addAdminEventLog(`下載規劃摘要 TXT：${fileName}`)
}

const switchSection = (key) => {
  activeSectionKey.value = key
  addAdminEventLog(`切換後台設定區塊：${key}`)
}

const addPrize = () => {
  const nextId = commonGameForm.prizes.length + 1

  commonGameForm.prizes.push({
    id: Date.now(),
    name: `新獎項 ${nextId}`,
    title: `新獎項 ${nextId}`,
    shortName: `獎項 ${nextId}`,
    icon: '🎁',
    quantity: 1,
    remaining: 1,
    probability: 0,
    enabled: true
  })

  addAdminEventLog(`新增獎品：新獎項 ${nextId}`)
}

const removePrize = (index) => {
  const prize = commonGameForm.prizes[index]

  commonGameForm.prizes.splice(index, 1)
  addAdminEventLog(`刪除獎品：${prize?.name || index + 1}`)
}

const addRule = () => {
  commonGameForm.rules.push('新的活動規則')
  addAdminEventLog('新增活動規則')
}

const removeRule = (index) => {
  commonGameForm.rules.splice(index, 1)
  addAdminEventLog(`刪除活動規則：第 ${index + 1} 條`)
}

const saveSettings = () => {
  isSaving.value = true
  savedMessage.value = ''

  window.setTimeout(() => {
    isSaving.value = false
    savedMessage.value = `第 240 批後台讀取精緻九宮格正式接入前安全檢查測試儲存完成：${new Date().toLocaleString('zh-TW')}`
    addAdminEventLog('測試儲存完成')
  }, 600)
}

const handlePreviewDraw = (payload) => {
  previewDrawLogs.value.unshift({
    id: `preview-log-${Date.now()}`,
    prizeName: '砸金蛋預覽抽獎事件',
    name: '砸金蛋預覽抽獎事件',
    icon: '🥚',
    createdAt: new Date().toLocaleString('zh-TW'),
    payloadSource: payload?.source || 'preview'
  })

  addAdminEventLog(`收到前台預覽抽獎事件：${payload?.gameType || selectedGameType.value}`)
}

const openLink = (url) => {
  window.open(url, '_blank', 'noopener,noreferrer')
  addAdminEventLog(`開啟快速連結：${url}`)
}

const clearAdminEventLogs = () => {
  adminEventLogs.value = [
    {
      id: `clear-${Date.now()}`,
      text: '後台事件紀錄已清空',
      time: new Date().toLocaleString('zh-TW')
    }
  ]
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-7xl space-y-6">
      <section class="overflow-hidden rounded-[2rem] border border-white bg-white shadow-xl shadow-slate-200/80">
        <div class="relative isolate overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 px-5 py-6 text-white sm:px-8">
          <div class="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-violet-400/30 blur-3xl"></div>
          <div class="pointer-events-none absolute -bottom-16 left-10 h-52 w-52 rounded-full bg-cyan-300/20 blur-3xl"></div>

          <div class="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div class="inline-flex flex-wrap items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-violet-100">
                <span>📄</span>
                <span>V2.3 第 363 批</span>
                <span class="text-white/40">｜</span>
                <span>{{ GAME_TEMPLATE_VERSION }}</span>
              </div>

              <h1 class="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                後台讀取精緻九宮格正式接入前安全檢查
              </h1>
              <p class="mt-2 max-w-3xl text-sm leading-6 text-violet-100 sm:text-base">
                這批從第 342 批正常版延續，整理成後台讀取精緻九宮格正式接入前安全檢查版，後續可從第 344 批繼續。
              </p>
            </div>

            <div class="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm shadow-lg backdrop-blur">
              <p class="font-bold text-white">目前狀態：後台讀取精緻九宮格正式接入前安全檢查完成完成總基準</p>
              <p class="mt-1 text-violet-100">預計新遊戲：{{ generatorForm.gameIcon }} {{ generatorForm.gameLabel }}</p>
              <p class="mt-1 text-xs text-violet-200">第 341 批 150～200 項同步完成穩定備份前後台總對齊完成已同步到後台</p>
            </div>
          </div>
        </div>

        <div class="grid gap-3 bg-white px-5 py-5 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          <div
            v-for="card in adminSummaryCards"
            :key="card.label"
            class="rounded-2xl border p-4"
            :class="card.class"
          >
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-xs font-bold opacity-75">{{ card.label }}</p>
                <p class="mt-1 text-lg font-black">{{ card.value }}</p>
              </div>
              <div class="text-2xl">{{ card.icon }}</div>
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8">
        <div class="mb-5">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-emerald-500">
            Stable Checkpoint
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            後台讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            目前公用模板設定流程已可作為安全基準。後面若做壞，就從第 250 批回來繼續。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div class="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p class="text-xs font-black text-emerald-600">目前穩定基準</p>
            <p class="mt-1 text-lg font-black text-emerald-800">{{ stableCheckpoint.batch }}</p>
            <p class="mt-1 text-xs leading-5 text-emerald-700">{{ stableCheckpoint.title }}</p>
          </div>

          <div class="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
            <p class="text-xs font-black text-cyan-600">公用前台</p>
            <p class="mt-1 text-lg font-black text-cyan-800">{{ stableCheckpoint.frontCommonView }}</p>
            <p class="mt-1 text-xs leading-5 text-cyan-700">負責活動資訊、獎品、規則、領獎、紀錄、結果彈窗。</p>
          </div>

          <div class="rounded-2xl border border-violet-100 bg-violet-50 p-4">
            <p class="text-xs font-black text-violet-600">公用後台</p>
            <p class="mt-1 text-lg font-black text-violet-800">{{ stableCheckpoint.adminCommonView }}</p>
            <p class="mt-1 text-xs leading-5 text-violet-700">負責設定、生成器、摘要、前台預覽與互通導覽。</p>
          </div>

          <div class="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <p class="text-xs font-black text-amber-600">測試入口</p>
            <p class="mt-1 text-lg font-black text-amber-800">{{ stableCheckpoint.testEntryView }}</p>
            <p class="mt-1 text-xs leading-5 text-amber-700">可切換 premium-grid / egg-smash 測試 PlayBoard。</p>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-white">
          <p class="text-sm font-black uppercase tracking-[0.2em] text-emerald-300">
            Stable Note
          </p>
          <p class="mt-2 text-sm leading-6 text-slate-200">
            {{ stableCheckpoint.currentSafeDirection }}
          </p>
          <p class="mt-2 text-sm leading-6 text-emerald-200">
            {{ stableCheckpoint.stableNote }}
          </p>
        </div>
      </section>

      <section class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8">
        <div class="mb-5">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-emerald-500">
            PremiumGrid Formal Safety Check
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            後台讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm leading-6 text-slate-500">
            第 363 批讀取 premiumGridCommonFormalSafetyCheck.js，確認正式接入前的 critical checks、階段表與正式頁鎖定狀態。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div
            v-for="card in premiumGridFormalSafetyStatusCards"
            :key="card.label"
            class="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-emerald-700">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-slate-950">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 grid gap-4 lg:grid-cols-3">
          <div
            v-for="group in premiumGridFormalSafetyFlowGroups"
            :key="group.key"
            class="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5"
          >
            <div class="flex items-start gap-3">
              <div class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-2xl shadow-sm">
                {{ group.icon }}
              </div>
              <div>
                <h3 class="font-black text-slate-950">{{ group.title }}</h3>
                <p class="mt-1 text-sm leading-6 text-slate-500">{{ group.description }}</p>
              </div>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="item in group.items"
                :key="item"
                class="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600"
              >
                {{ item }}
              </span>
            </div>
          </div>
        </div>

        <div class="mt-5 grid gap-4 lg:grid-cols-2">
          <div class="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5">
            <p class="font-black text-emerald-700">Critical Checks</p>
            <div class="mt-4 space-y-2">
              <div
                v-for="check in premiumGridFormalCriticalChecks"
                :key="check.key"
                class="rounded-2xl bg-white px-4 py-3 text-sm font-bold"
                :class="check.passed ? 'text-emerald-700' : 'text-rose-700'"
              >
                {{ check.passed ? '✅' : '❌' }} {{ check.label }}｜{{ check.message }}
              </div>
            </div>
          </div>

          <div class="rounded-[1.5rem] border border-sky-100 bg-sky-50 p-5">
            <p class="font-black text-sky-700">正式接入階段表</p>
            <div class="mt-4 space-y-2">
              <div
                v-for="phase in premiumGridFormalSafetyPhaseCards"
                :key="phase.label"
                class="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700"
              >
                {{ phase.icon }} {{ phase.label }}｜{{ phase.value }}
                <p class="mt-1 text-xs leading-5 text-slate-500">{{ phase.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-5 grid gap-4 lg:grid-cols-2">
          <div class="rounded-[1.5rem] border border-rose-100 bg-rose-50 p-5">
            <p class="font-black text-rose-700">Critical Rules</p>
            <div class="mt-4 space-y-2">
              <div
                v-for="rule in premiumGridFormalCriticalRules"
                :key="rule.key"
                class="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-rose-700"
              >
                🔒 {{ rule.label }}｜{{ rule.description }}
              </div>
            </div>
          </div>

          <div class="rounded-[1.5rem] border border-amber-100 bg-amber-50 p-5">
            <p class="font-black text-amber-700">Recommended Rules</p>
            <div class="mt-4 space-y-2">
              <div
                v-for="rule in premiumGridFormalRecommendedRules"
                :key="rule.key"
                class="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-amber-700"
              >
                💡 {{ rule.label }}｜{{ rule.description }}
              </div>
            </div>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-emerald-100 bg-white p-5 text-sm leading-6 text-slate-600">
          <p class="font-black text-emerald-700">第 363 批結論</p>
          <p class="mt-2">
            {{ premiumGridFormalSafetySummary.conclusion }}
          </p>
        </div>
      </section>

      <section class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8">
        <div class="mb-5">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-violet-500">
            PremiumGrid Common Adapter
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            後台讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm leading-6 text-slate-500">
            第 360 批讀取 commonGamePremiumGridAdapter.js，先在後台中控台驗證 GRID 共用模板，不修改正式九宮格玩家頁。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div
            v-for="card in premiumGridAdapterStatusCards"
            :key="card.label"
            class="rounded-2xl border border-violet-100 bg-violet-50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-violet-700">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-slate-950">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 grid gap-4 lg:grid-cols-3">
          <div
            v-for="group in premiumGridAdapterFlowGroups"
            :key="group.key"
            class="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5"
          >
            <div class="flex items-start gap-3">
              <div class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-2xl shadow-sm">
                {{ group.icon }}
              </div>
              <div>
                <h3 class="font-black text-slate-950">{{ group.title }}</h3>
                <p class="mt-1 text-sm leading-6 text-slate-500">{{ group.description }}</p>
              </div>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="item in group.items"
                :key="item"
                class="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600"
              >
                {{ item }}
              </span>
            </div>
          </div>
        </div>

        <div class="mt-5 grid gap-4 lg:grid-cols-2">
          <div class="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
            <p class="font-black text-violet-700">GRID 後台摘要卡</p>
            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <div
                v-for="card in premiumGridAdminCards"
                :key="card.label"
                class="rounded-2xl border border-slate-100 bg-white p-4"
              >
                <p class="text-2xl">{{ card.icon }}</p>
                <p class="mt-2 text-xs font-black text-slate-500">{{ card.label }}</p>
                <p class="mt-1 line-clamp-2 text-sm font-black text-slate-950">{{ card.value }}</p>
              </div>
            </div>
          </div>

          <div class="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5">
            <p class="font-black text-emerald-700">正式頁安全檢查</p>
            <div class="mt-4 space-y-2">
              <div
                v-for="check in premiumGridFormalSafeChecks"
                :key="check.key"
                class="rounded-2xl bg-white px-4 py-3 text-sm font-bold"
                :class="check.passed ? 'text-emerald-700' : 'text-rose-700'"
              >
                {{ check.passed ? '✅' : '❌' }} {{ check.label }}｜{{ check.message }}
              </div>
            </div>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-amber-100 bg-amber-50 p-5">
          <p class="font-black text-amber-700">GRID adapter 安全規則</p>
          <div class="mt-3 grid gap-2 md:grid-cols-2">
            <div
              v-for="rule in premiumGridAdapterSafeRules"
              :key="rule"
              class="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700"
            >
              ✅ {{ rule }}
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8">
        <div class="mb-5">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-orange-500">
            Common Template Form Applied
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            後台讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm leading-6 text-slate-500">
            第 357 批正式在後台套用 CommonGameTemplateForm.vue，確認共用後台表單可以被中控台使用。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="card in commonTemplateFormCards"
            :key="card.label"
            class="rounded-2xl border border-orange-100 bg-orange-50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-orange-700">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-slate-950">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 grid gap-4 lg:grid-cols-3">
          <div
            v-for="group in commonTemplateFormFlowGroups"
            :key="group.key"
            class="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5"
          >
            <div class="flex items-start gap-3">
              <div class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-2xl shadow-sm">
                {{ group.icon }}
              </div>
              <div>
                <h3 class="font-black text-slate-950">{{ group.title }}</h3>
                <p class="mt-1 text-sm leading-6 text-slate-500">{{ group.description }}</p>
              </div>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="item in group.items"
                :key="item"
                class="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600"
              >
                {{ item }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <CommonGameTemplateForm
        v-model="commonTemplateFormModel"
        game-type="GRID"
        show-validation
        show-safe-rules
        show-raw-preview
        @change="handleCommonTemplateFormChange"
        @submit="handleCommonTemplateFormSubmit"
        @reset="handleCommonTemplateFormReset"
        @copy="handleCommonTemplateFormCopy"
        @open-test="handleCommonTemplateFormOpenTest"
      />

      <section class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8">
        <div class="mb-5">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-cyan-500">
            Complete Integration Total Stable
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            後台讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm leading-6 text-slate-500">
            第 352 批讀取 gameTemplateConfig.js 第 351 批總穩定備份，確認後台第 349 批與前台第 350 批讀取完成狀態。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="card in completeIntegrationTotalStableCards"
            :key="card.label"
            class="rounded-2xl border border-cyan-100 bg-cyan-50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-cyan-700">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-slate-950">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 grid gap-4 lg:grid-cols-2">
          <div
            v-for="group in completeIntegrationTotalStableGroups"
            :key="group.key"
            class="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5"
          >
            <div class="flex items-start gap-3">
              <div class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-2xl shadow-sm">
                {{ group.icon }}
              </div>
              <div>
                <h3 class="font-black text-slate-950">{{ group.title }}</h3>
                <p class="mt-1 text-sm leading-6 text-slate-500">{{ group.description }}</p>
              </div>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="item in group.items"
                :key="item"
                class="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600"
              >
                {{ item }}
              </span>
            </div>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5">
          <p class="font-black text-emerald-700">第 351 批安全規則讀取</p>
          <div class="mt-3 grid gap-2 md:grid-cols-2">
            <div
              v-for="rule in completeIntegrationTotalStableSafeRules"
              :key="rule"
              class="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700"
            >
              ✅ {{ rule }}
            </div>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-cyan-100 bg-white p-5 text-sm leading-6 text-slate-600">
          <p class="font-black text-cyan-700">第 352 批說明</p>
          <p class="mt-2">
            這批只讓後台讀取第 351 批完整整合前後台讀取完成總穩定備份，不修改正式頁、不修改 router、不修改 API、不修改 DB。
          </p>
        </div>
      </section>

      <section class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8">
        <div class="mb-5">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-teal-500">
            Complete Integration Read Completed
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            後台讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm leading-6 text-slate-500">
            第 349 批讀取 gameTemplateConfig.js 第 348 批備份，確認後台第 346 批與前台第 347 批都已正常讀取完整整合備份。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="card in completeIntegrationReadCompletedCards"
            :key="card.label"
            class="rounded-2xl border border-teal-100 bg-teal-50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-teal-700">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-slate-950">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 grid gap-4 lg:grid-cols-2">
          <div
            v-for="group in completeIntegrationReadCompletedGroups"
            :key="group.key"
            class="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5"
          >
            <div class="flex items-start gap-3">
              <div class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-2xl shadow-sm">
                {{ group.icon }}
              </div>
              <div>
                <h3 class="font-black text-slate-950">{{ group.title }}</h3>
                <p class="mt-1 text-sm leading-6 text-slate-500">{{ group.description }}</p>
              </div>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="item in group.items"
                :key="item"
                class="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600"
              >
                {{ item }}
              </span>
            </div>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5">
          <p class="font-black text-emerald-700">第 348 批安全規則讀取</p>
          <div class="mt-3 grid gap-2 md:grid-cols-2">
            <div
              v-for="rule in completeIntegrationReadCompletedSafeRules"
              :key="rule"
              class="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700"
            >
              ✅ {{ rule }}
            </div>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-teal-100 bg-white p-5 text-sm leading-6 text-slate-600">
          <p class="font-black text-teal-700">第 349 批說明</p>
          <p class="mt-2">
            這批只讓後台讀取第 348 批完整整合前後台讀取完成穩定備份，不修改正式頁、不修改 router、不修改 API、不修改 DB。
          </p>
        </div>
      </section>

      <section class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8">
        <div class="mb-5">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-indigo-500">
            Complete Integration Stable Backup
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            後台讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm leading-6 text-slate-500">
            第 346 批讀取 gameTemplateConfig.js 第 345 批穩定備份，確認後台第 343 批與前台第 344 批已完成整合。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="card in completeIntegrationStableCards"
            :key="card.label"
            class="rounded-2xl border border-indigo-100 bg-indigo-50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-indigo-700">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-slate-950">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 grid gap-4 lg:grid-cols-2">
          <div
            v-for="group in completeIntegrationStableGroups"
            :key="group.key"
            class="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5"
          >
            <div class="flex items-start gap-3">
              <div class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-2xl shadow-sm">
                {{ group.icon }}
              </div>
              <div>
                <h3 class="font-black text-slate-950">{{ group.title }}</h3>
                <p class="mt-1 text-sm leading-6 text-slate-500">{{ group.description }}</p>
              </div>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="item in group.items"
                :key="item"
                class="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600"
              >
                {{ item }}
              </span>
            </div>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5">
          <p class="font-black text-emerald-700">第 345 批安全規則讀取</p>
          <div class="mt-3 grid gap-2 md:grid-cols-2">
            <div
              v-for="rule in completeIntegrationStableSafeRules"
              :key="rule"
              class="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700"
            >
              ✅ {{ rule }}
            </div>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-indigo-100 bg-white p-5 text-sm leading-6 text-slate-600">
          <p class="font-black text-indigo-700">第 346 批說明</p>
          <p class="mt-2">
            這批只讓後台讀取第 345 批完整整合前後台穩定備份，不修改正式頁、不修改 router、不修改 API、不修改 DB。
          </p>
        </div>
      </section>

      <section class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8">
        <div class="mb-5">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-rose-500">
            Complete Integration
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            後台讀取精緻九宮格正式接入前安全檢查版
          </h2>
          <p class="mt-1 text-sm leading-6 text-slate-500">
            第 343 批開始改成整份完整檔案交付模式：穩定整理型功能直接做完整 TXT，方便整份覆蓋，不再一直小批次疊加。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="card in completeIntegrationCards"
            :key="card.label"
            class="rounded-2xl border border-rose-100 bg-rose-50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-rose-700">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-slate-950">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 grid gap-4 lg:grid-cols-2">
          <div
            v-for="group in completeIntegrationGroups"
            :key="group.key"
            class="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5"
          >
            <div class="flex items-start gap-3">
              <div class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-2xl shadow-sm">
                {{ group.icon }}
              </div>
              <div>
                <h3 class="font-black text-slate-950">{{ group.title }}</h3>
                <p class="mt-1 text-sm leading-6 text-slate-500">{{ group.description }}</p>
              </div>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="item in group.items"
                :key="item"
                class="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600"
              >
                {{ item }}
              </span>
            </div>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5">
          <p class="font-black text-emerald-700">正式頁安全保護清單</p>
          <div class="mt-3 grid gap-2 md:grid-cols-2">
            <div
              v-for="rule in completeIntegrationSafeRules"
              :key="rule"
              class="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700"
            >
              ✅ {{ rule }}
            </div>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-rose-100 bg-white p-5 text-sm leading-6 text-slate-600">
          <p class="font-black text-rose-700">第 343 批說明</p>
          <p class="mt-2">
            這批從第 342 批正常版延續，正式整理成「後台讀取精緻九宮格正式接入前安全檢查版」。之後穩定整理型功能會優先給整份 TXT，讓你直接下載、全選、複製、覆蓋。
          </p>
        </div>
      </section>

      <section class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8">
        <div class="mb-5">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-green-500">
            Bulk 150-200 Synced Total Aligned Completed
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            後台讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            這段資料來自 gameTemplateConfig.js 的 getCommonTemplateBulk150200SyncedTotalAlignedCompletedCheckpoint()。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-9">
          <div
            v-for="card in bulk150200SyncedTotalAlignedCompletedCards"
            :key="card.label"
            class="rounded-2xl border border-green-100 bg-green-50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-green-700">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-slate-950">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-green-100 bg-white p-5 text-sm leading-6 text-slate-600">
          <p class="font-black text-green-700">第 342 批說明</p>
          <p class="mt-2">
            後台已讀取第 341 批前後台總對齊完成基準：設定檔第 341 批、後台第 339 批、前台測試入口第 340 批已完成 150～200 項同步完成穩定備份前後台總對齊完成。
          </p>
        </div>
      </section>

      <section class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8">
        <div class="mb-5">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-lime-500">
            Bulk 150-200 Synced Total Aligned
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            後台讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            這段資料來自 gameTemplateConfig.js 的 getCommonTemplateBulk150200SyncedTotalAlignedCheckpoint()。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-9">
          <div
            v-for="card in bulk150200SyncedTotalAlignedCards"
            :key="card.label"
            class="rounded-2xl border border-lime-100 bg-lime-50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-lime-700">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-slate-950">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-lime-100 bg-white p-5 text-sm leading-6 text-slate-600">
          <p class="font-black text-lime-700">第 339 批說明</p>
          <p class="mt-2">
            後台已讀取第 338 批前後台總對齊基準：設定檔第 338 批、後台第 336 批、前台測試入口第 337 批已完成 150～200 項同步完成穩定備份前後台總對齊。
          </p>
        </div>
      </section>

      <section class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8">
        <div class="mb-5">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-amber-500">
            Bulk 150-200 Synced Aligned
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            後台讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            這段資料來自 gameTemplateConfig.js 的 getCommonTemplateBulk150200SyncedAlignedCheckpoint()。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-9">
          <div
            v-for="card in bulk150200SyncedAlignedCards"
            :key="card.label"
            class="rounded-2xl border border-amber-100 bg-amber-50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-amber-700">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-slate-950">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-amber-100 bg-white p-5 text-sm leading-6 text-slate-600">
          <p class="font-black text-amber-700">第 336 批說明</p>
          <p class="mt-2">
            後台已讀取第 335 批前後台對齊基準：設定檔第 335 批、後台第 333 批、前台測試入口第 334 批已完成 150～200 項同步完成穩定備份前後台對齊。
          </p>
        </div>
      </section>

      <section class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8">
        <div class="mb-5">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-sky-500">
            Bulk 150-200 Synced Stable Total
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            後台讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            這段資料來自 gameTemplateConfig.js 的 getCommonTemplateBulk150200SyncedStableTotalCheckpoint()。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-9">
          <div
            v-for="card in bulk150200SyncedStableTotalCards"
            :key="card.label"
            class="rounded-2xl border border-sky-100 bg-sky-50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-sky-700">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-slate-950">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-sky-100 bg-white p-5 text-sm leading-6 text-slate-600">
          <p class="font-black text-sky-700">第 333 批說明</p>
          <p class="mt-2">
            後台已讀取第 332 批總基準：設定檔第 332 批、後台第 330 批、前台測試入口第 331 批已完成 150～200 項同步完成穩定備份總基準。
          </p>
        </div>
      </section>

      <section class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8">
        <div class="mb-5">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-purple-500">
            Bulk 150-200 Synced Completed Stable
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            後台讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            這段資料來自 gameTemplateConfig.js 的 getCommonTemplateBulk150200SyncedCompletedStableCheckpoint()。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-9">
          <div
            v-for="card in bulk150200SyncedCompletedStableCards"
            :key="card.label"
            class="rounded-2xl border border-purple-100 bg-purple-50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-purple-700">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-slate-950">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-purple-100 bg-white p-5 text-sm leading-6 text-slate-600">
          <p class="font-black text-purple-700">第 330 批說明</p>
          <p class="mt-2">
            後台已讀取第 329 批穩定備份：設定檔第 329 批、後台第 327 批、前台測試入口第 328 批已完成 150～200 項最終總基準前後台同步完成穩定備份。
          </p>
        </div>
      </section>

      <section class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8">
        <div class="mb-5">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-fuchsia-500">
            Bulk 150-200 Synced Completed
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            後台讀取精緻九宮格正式接入前安全檢查版
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            這段資料來自 gameTemplateConfig.js 的 getCommonTemplateBulk150200SyncedCompletedCheckpoint()。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-9">
          <div
            v-for="card in bulk150200SyncedCompletedCards"
            :key="card.label"
            class="rounded-2xl border border-fuchsia-100 bg-fuchsia-50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-fuchsia-700">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-slate-950">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-fuchsia-100 bg-white p-5 text-sm leading-6 text-slate-600">
          <p class="font-black text-fuchsia-700">第 327 批說明</p>
          <p class="mt-2">
            後台已讀取第 326 批同步完成基準：設定檔第 326 批、後台第 324 批、前台測試入口第 325 批已完成 150～200 項最終總基準前後台同步完成版。
          </p>
        </div>
      </section>

      <section class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8">
        <div class="mb-5">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-violet-500">
            Bulk 150-200 Final Total
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            後台讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            這段資料來自 gameTemplateConfig.js 的 getCommonTemplateBulk150200FinalTotalCheckpoint()。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-9">
          <div
            v-for="card in bulk150200FinalTotalCards"
            :key="card.label"
            class="rounded-2xl border border-violet-100 bg-violet-50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-violet-700">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-slate-950">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-violet-100 bg-white p-5 text-sm leading-6 text-slate-600">
          <p class="font-black text-violet-700">第 324 批說明</p>
          <p class="mt-2">
            後台已讀取第 323 批最終總基準：設定檔第 323 批、後台第 321 批、前台測試入口第 322 批已完成 150～200 項前後台完成最終總基準。
          </p>
        </div>
      </section>

      <section class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8">
        <div class="mb-5">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-blue-500">
            Bulk 150-200 Total Completed
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            後台讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            這段資料來自 gameTemplateConfig.js 的 getCommonTemplateBulk150200TotalCompletedCheckpoint()。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-9">
          <div
            v-for="card in bulk150200TotalCompletedCards"
            :key="card.label"
            class="rounded-2xl border border-blue-100 bg-blue-50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-blue-700">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-slate-950">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-blue-100 bg-white p-5 text-sm leading-6 text-slate-600">
          <p class="font-black text-blue-700">第 321 批說明</p>
          <p class="mt-2">
            後台已讀取第 320 批總穩定備份：設定檔第 320 批、後台第 318 批、前台測試入口第 319 批已完成 150～200 項前後台完成總穩定備份。
          </p>
        </div>
      </section>

      <section class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8">
        <div class="mb-5">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-cyan-500">
            Bulk 150-200 Completed Checkpoint
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            後台讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            這段資料來自 gameTemplateConfig.js 的 getCommonTemplateBulk150200CompletedCheckpoint()。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-9">
          <div
            v-for="card in bulk150200CompletedCards"
            :key="card.label"
            class="rounded-2xl border border-cyan-100 bg-cyan-50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-cyan-700">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-slate-950">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-cyan-100 bg-white p-5 text-sm leading-6 text-slate-600">
          <p class="font-black text-cyan-700">第 318 批說明</p>
          <p class="mt-2">
            後台已讀取第 317 批完成備份：設定檔第 317 批、後台第 315 批、前台測試入口第 316 批已完成 150～200 項模式前後台完成備份。
          </p>
        </div>
      </section>

      <section class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8">
        <div class="mb-5">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-emerald-500">
            Bulk 150-200 Final Safe
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            後台讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            這段資料來自 gameTemplateConfig.js 的 getCommonTemplateBulk150200FinalSafeCheckpoint()。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-9">
          <div
            v-for="card in bulk150200FinalSafeCards"
            :key="card.label"
            class="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-emerald-700">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-slate-950">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-emerald-100 bg-white p-5 text-sm leading-6 text-slate-600">
          <p class="font-black text-emerald-700">第 315 批說明</p>
          <p class="mt-2">
            後台已讀取第 314 批最終安全基準：設定檔第 314 批、後台第 312 批、前台測試入口第 313 批已完成 150～200 項模式最終安全同步。
          </p>
        </div>
      </section>

      <section class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8">
        <div class="mb-5">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-indigo-500">
            Bulk 150-200 Total Stable
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            後台讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            這段資料來自 gameTemplateConfig.js 的 getCommonTemplateBulk150200TotalStableCheckpoint()。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-9">
          <div
            v-for="card in bulk150200TotalStableCards"
            :key="card.label"
            class="rounded-2xl border border-indigo-100 bg-indigo-50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-indigo-700">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-slate-950">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-indigo-100 bg-white p-5 text-sm leading-6 text-slate-600">
          <p class="font-black text-indigo-700">第 312 批說明</p>
          <p class="mt-2">
            後台已讀取第 311 批總穩定備份：設定檔第 311 批、後台第 309 批、前台測試入口第 310 批已完成 150～200 項模式同步。
          </p>
        </div>
      </section>

      <section class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8">
        <div class="mb-5">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-teal-500">
            Bulk 150-200 Synced Stable
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            後台讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            這段資料來自 gameTemplateConfig.js 的 getCommonTemplateBulk150200SyncedStableCheckpoint()。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-9">
          <div
            v-for="card in bulk150200SyncedStableCards"
            :key="card.label"
            class="rounded-2xl border border-teal-100 bg-teal-50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-teal-700">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-slate-950">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-teal-100 bg-white p-5 text-sm leading-6 text-slate-600">
          <p class="font-black text-teal-700">第 309 批說明</p>
          <p class="mt-2">
            後台已讀取第 308 批同步基準：設定檔第 308 批、後台第 306 批、前台測試入口第 307 批已對齊。穩定整理可使用 150～200 項超大批次。
          </p>
        </div>
      </section>

      <section class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8">
        <div class="mb-5">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-orange-500">
            Bulk 150-200 Mode
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            後台讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            這段資料來自 gameTemplateConfig.js 的 getCommonTemplateBulk150200Mode()。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-9">
          <div
            v-for="card in bulk150200SummaryCards"
            :key="card.label"
            class="rounded-2xl border border-orange-100 bg-orange-50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-orange-700">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-slate-950">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="group in bulk150200ModeCheckpoint.superBatchGroups"
            :key="group.key"
            class="rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4"
          >
            <div class="flex items-center justify-between gap-3">
              <p class="font-black text-slate-950">{{ group.label }}</p>
              <span class="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
                {{ group.targetCount }} 項
              </span>
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="item in group.items"
                :key="item"
                class="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600"
              >
                {{ item }}
              </span>
            </div>
          </div>
        </div>

        <div class="mt-5 grid gap-3 lg:grid-cols-2">
          <div class="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5 text-sm leading-6 text-emerald-800">
            <p class="font-black">適合超大批次整理</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="scope in bulk150200ModeCheckpoint.allowedLargeBatchScopes"
                :key="scope"
                class="rounded-full bg-white px-3 py-1 text-xs font-bold"
              >
                {{ scope }}
              </span>
            </div>
          </div>

          <div class="rounded-[1.5rem] border border-rose-100 bg-rose-50 p-5 text-sm leading-6 text-rose-800">
            <p class="font-black">仍需保守分批</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="scope in bulk150200ModeCheckpoint.riskyBatchScopes"
                :key="scope"
                class="rounded-full bg-white px-3 py-1 text-xs font-bold"
              >
                {{ scope }}
              </span>
            </div>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-orange-100 bg-white p-5 text-sm leading-6 text-slate-600">
          <p class="font-black text-orange-700">第 306 批說明</p>
          <p class="mt-2">
            後台已讀取第 305 批寫入設定檔的 150～200 項超大批次整理策略。穩定整理可大批推進；涉及核心邏輯、router、正式頁、API、DB 時仍需保守分批。
          </p>
        </div>
      </section>

      <section class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8">
        <div class="mb-5">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-teal-500">
            Bulk 40-50 Synced Stable Checkpoint
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            後台讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            這段資料來自 gameTemplateConfig.js 的 getCommonTemplateBulk4050SyncedStableCheckpoint()。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="card in bulk4050SyncedStableCards"
            :key="card.label"
            class="rounded-2xl border border-teal-100 bg-teal-50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-teal-700">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-slate-950">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-teal-100 bg-white p-5 text-sm leading-6 text-slate-600">
          <p class="font-black text-teal-700">第 304 批說明</p>
          <p class="mt-2">
            後台已讀取第 303 批同步基準：設定檔第 303 批、後台第 301 批、前台測試入口第 302 批已對齊。之後穩定時採 40～50 項大批整理。
          </p>
        </div>
      </section>

      <section class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8">
        <div class="mb-5">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-emerald-500">
            Bulk 40-50 Stable Checkpoint
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            後台讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            這段資料來自 gameTemplateConfig.js 的 getCommonTemplateBulk4050StableCheckpoint()。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <div
            v-for="card in bulk4050StableCards"
            :key="card.label"
            class="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-emerald-700">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-slate-950">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-emerald-100 bg-white p-5 text-sm leading-6 text-slate-600">
          <p class="font-black text-emerald-700">第 301 批說明</p>
          <p class="mt-2">
            後台已讀取第 300 批寫入設定檔的 40～50 項總穩定基準。之後若畫面穩定，會以 40～50 項大批次推進；若出現錯誤，先縮小為 1～5 項修錯。
          </p>
        </div>
      </section>

      <section class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8">
        <div class="mb-5">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-rose-500">
            Bulk 40-50 Mode
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            後台讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            這段資料來自 gameTemplateConfig.js 的 getCommonTemplateBulk4050Mode()。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <div
            v-for="card in bulk4050SummaryCards"
            :key="card.label"
            class="rounded-2xl border border-rose-100 bg-rose-50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-rose-700">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-slate-950">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 grid gap-3 lg:grid-cols-3">
          <div
            v-for="group in bulk4050ModeCheckpoint.checklistGroups"
            :key="group.key"
            class="rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4"
          >
            <div class="flex items-center justify-between gap-3">
              <p class="font-black text-slate-950">{{ group.label }}</p>
              <span class="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-700">
                {{ group.targetCount }} 項
              </span>
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="item in group.items"
                :key="item"
                class="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600"
              >
                {{ item }}
              </span>
            </div>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-rose-100 bg-white p-5 text-sm leading-6 text-slate-600">
          <p class="font-black text-rose-700">第 298 批說明</p>
          <p class="mt-2">
            後台已讀取第 297 批寫入設定檔的 40～50 項整理策略。穩定時採大批推進；只要出現錯誤、編譯失敗或畫面異常，就先縮小成 1～5 項修錯。
          </p>
        </div>
      </section>

      <section class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8">
        <div class="mb-5">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-fuchsia-500">
            Bulk Batch Mode
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            後台讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            這段資料來自 gameTemplateConfig.js 的 getCommonTemplateBulkBatchModeCheckpoint()。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-5">
          <div
            v-for="card in bulkBatchModeCards"
            :key="card.label"
            class="rounded-2xl border border-fuchsia-100 bg-fuchsia-50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-fuchsia-700">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-slate-950">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-fuchsia-100 bg-white p-5 text-sm leading-6 text-slate-600">
          <p class="font-black text-fuchsia-700">第 296 批說明</p>
          <p class="mt-2">
            後台已讀取第 295 批寫入設定檔的批次整理模式，後續每批盡量一次整理 10～20 項，減少零散小改。
          </p>
        </div>
      </section>

      <section class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8">
        <div class="mb-5">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-emerald-500">
            Batch 296 Bulk Admin Sync
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            後台公用設定頁 18 項總同步狀態
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            這批開始後，後台也改成一次整理 10～20 項，不再只小改 1～2 個點。
          </p>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div
            v-for="item in adminBulkSyncStatusItems"
            :key="item.id"
            class="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-xs font-black text-emerald-700">{{ item.title }}</p>
                <p class="mt-1 truncate text-sm font-black text-slate-950">{{ item.value }}</p>
              </div>
              <span class="text-2xl">{{ item.icon }}</span>
            </div>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-sm leading-6 text-slate-200">
          <p class="font-black text-emerald-300">第 294 批整合說明</p>
          <p class="mt-2">
            後台已集中顯示總同步基準、前台基準、後台基準、測試入口基準、active / planned 模板、生成流程、新對話提示與正式頁安全狀態。
          </p>
        </div>
      </section>

      <section class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8">
        <div class="mb-5">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-sky-500">
            Template Status Overview
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            後台公用模板總穩定基準
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            這裡直接讀取 gameTemplateConfig.js 的 COMMON_TEMPLATE_STABLE_CHECKPOINT 與下一步生成流程。
          </p>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="card in templateStatusOverviewCards"
            :key="card.label"
            class="rounded-2xl border p-4"
            :class="card.class"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0">
                <p class="text-xs font-bold opacity-75">{{ card.label }}</p>
                <p class="mt-1 truncate text-lg font-black">{{ card.value }}</p>
              </div>
              <div class="text-2xl">{{ card.icon }}</div>
            </div>
          </div>
        </div>

        <div class="mt-5 grid gap-4 lg:grid-cols-3">
          <div class="rounded-[1.5rem] border border-cyan-100 bg-cyan-50 p-5">
            <p class="text-sm font-black uppercase tracking-[0.2em] text-cyan-600">
              Front Common Stable
            </p>
            <h3 class="mt-1 text-xl font-black text-cyan-900">
              CommonGamePlayerView
            </h3>
            <p class="mt-2 text-sm leading-6 text-cyan-700">
              {{ commonTemplateStableSummary.frontStableBatch }}
            </p>
          </div>

          <div class="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5">
            <p class="text-sm font-black uppercase tracking-[0.2em] text-emerald-600">
              Active
            </p>
            <h3 class="mt-1 text-xl font-black text-emerald-900">
              預覽切換使用
            </h3>
            <div class="mt-3 space-y-2">
              <div
                v-for="game in adminPreviewGameOptions"
                :key="game.type"
                class="rounded-2xl bg-white px-4 py-3 text-sm font-black text-emerald-800"
              >
                {{ game.icon }} {{ game.type }}｜{{ game.playBoard }}
              </div>
            </div>
          </div>

          <div class="rounded-[1.5rem] border border-violet-100 bg-violet-50 p-5">
            <p class="text-sm font-black uppercase tracking-[0.2em] text-violet-600">
              Planned
            </p>
            <h3 class="mt-1 text-xl font-black text-violet-900">
              生成器規劃使用
            </h3>
            <div class="mt-3 space-y-2">
              <div
                v-for="game in generatorPresets"
                :key="game.gameType"
                class="rounded-2xl bg-white px-4 py-3 text-sm font-black text-violet-800"
              >
                {{ game.gameIcon }} {{ game.gameType }}｜{{ game.playBoardName }}
              </div>
            </div>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-white">
          <p class="text-sm font-black uppercase tracking-[0.2em] text-emerald-300">
            Stable Summary From Config
          </p>
          <h3 class="mt-1 text-xl font-black">
            {{ commonTemplateStableSummary.title }}
          </h3>
          <p class="mt-2 text-sm leading-6 text-slate-200">
            {{ commonTemplateStableSummary.safeDirection }}
          </p>
          <p class="mt-2 text-sm leading-6 text-emerald-200">
            {{ commonTemplateStableSummary.note }}
          </p>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-purple-100 bg-purple-50 p-5">
          <p class="text-sm font-black uppercase tracking-[0.2em] text-purple-600">
            Total Sync Stable Checkpoint
          </p>
          <h3 class="mt-1 text-xl font-black text-purple-900">
            後台已讀取 150～200 項同步完成穩定備份前後台總對齊完成
          </h3>
          <p class="mt-2 text-sm leading-6 text-purple-700">
            這段資料來自 gameTemplateConfig.js 的 getCommonTemplateTotalSyncStableCheckpoint()。
            目前會跟第 341 批設定檔的 150～200 項同步完成穩定備份前後台總對齊完成保持一致。
          </p>

          <div class="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
            <div class="rounded-2xl bg-white px-4 py-3 text-sm font-black text-purple-800">
              🧬 Config：{{ totalSyncStableCheckpoint.batch }}
            </div>
            <div class="rounded-2xl bg-white px-4 py-3 text-sm font-black text-purple-800">
              🧩 Front：{{ totalSyncStableCheckpoint.frontStableBatch }}
            </div>
            <div class="rounded-2xl bg-white px-4 py-3 text-sm font-black text-purple-800">
              🧪 Test：{{ totalSyncStableCheckpoint.frontTestStableBatch }}
            </div>
            <div class="rounded-2xl bg-white px-4 py-3 text-sm font-black text-purple-800">
              🛠️ Admin：{{ totalSyncStableCheckpoint.backendEditorSyncBatch || totalSyncStableCheckpoint.adminStableBatch }}
            </div>
            <div class="rounded-2xl bg-white px-4 py-3 text-sm font-black text-purple-800">
              ➡️ Next：{{ totalSyncStableCheckpoint.nextBatch }}
            </div>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-sky-100 bg-sky-50 p-5">
          <p class="text-sm font-black uppercase tracking-[0.2em] text-sky-600">
            Front / Admin Sync Checkpoint
          </p>
          <h3 class="mt-1 text-xl font-black text-sky-900">
            後台已讀取第 264 批前後台同步基準
          </h3>
          <p class="mt-2 text-sm leading-6 text-sky-700">
            這段資料來自 gameTemplateConfig.js 的 getCommonTemplateFrontendBackendSyncCheckpoint()。
          </p>

          <div class="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
            <div class="rounded-2xl bg-white px-4 py-3 text-sm font-black text-sky-800">
              🧬 Config：{{ frontendBackendSyncCheckpoint.batch }}
            </div>
            <div class="rounded-2xl bg-white px-4 py-3 text-sm font-black text-sky-800">
              🧩 Front：{{ frontendBackendSyncCheckpoint.frontStableBatch }}
            </div>
            <div class="rounded-2xl bg-white px-4 py-3 text-sm font-black text-sky-800">
              🧪 Test：{{ frontendBackendSyncCheckpoint.frontTestStableBatch }}
            </div>
            <div class="rounded-2xl bg-white px-4 py-3 text-sm font-black text-sky-800">
              🛠️ Admin：{{ frontendBackendSyncCheckpoint.adminStableBatch }}
            </div>
            <div class="rounded-2xl bg-white px-4 py-3 text-sm font-black text-sky-800">
              ➡️ Next：{{ frontendBackendSyncCheckpoint.nextBatch }}
            </div>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-indigo-100 bg-indigo-50 p-5">
          <p class="text-sm font-black uppercase tracking-[0.2em] text-indigo-600">
            Config Stable Sync
          </p>
          <h3 class="mt-1 text-xl font-black text-indigo-900">
            後台已同步第 261 批總穩定基準
          </h3>
          <p class="mt-2 text-sm leading-6 text-indigo-700">
            目前後台會從 gameTemplateConfig.js 的 getCommonTemplateStableSummary() 讀取總基準、前台基準、後台基準與下一步流程。
          </p>

          <div class="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <div class="rounded-2xl bg-white px-4 py-3 text-sm font-black text-indigo-800">
              🛡️ 總基準：{{ commonTemplateStableSummary.batch || configTotalStableBatch }}
            </div>
            <div class="rounded-2xl bg-white px-4 py-3 text-sm font-black text-indigo-800">
              🧩 前台：{{ commonTemplateStableSummary.frontStableBatch }}
            </div>
            <div class="rounded-2xl bg-white px-4 py-3 text-sm font-black text-indigo-800">
              🧪 測試入口：{{ commonTemplateStableSummary.frontTestStableBatch || frontTestStableBatch }}
            </div>
            <div class="rounded-2xl bg-white px-4 py-3 text-sm font-black text-indigo-800">
              🛠️ 後台：{{ commonTemplateStableSummary.adminStableBatch || adminPromptFixStableBatch }}
            </div>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5">
          <p class="text-sm font-black uppercase tracking-[0.2em] text-emerald-600">
            Admin Prompt Fix Stable
          </p>
          <h3 class="mt-1 text-xl font-black text-emerald-900">
            後台讀取精緻九宮格正式接入前安全檢查
          </h3>
          <p class="mt-2 text-sm leading-6 text-emerald-700">
            目前後台提示同步已完成重複宣告清理，原修正基準為 {{ adminPromptFixStableBatch }}，目前後台頁面同步到第 262 批。
          </p>

          <div class="mt-4 grid gap-2 md:grid-cols-3">
            <div class="rounded-2xl bg-white px-4 py-3 text-sm font-black text-emerald-800">
              ✅ newChatPromptVisible 不重複
            </div>
            <div class="rounded-2xl bg-white px-4 py-3 text-sm font-black text-emerald-800">
              ✅ newChatPromptText 不重複
            </div>
            <div class="rounded-2xl bg-white px-4 py-3 text-sm font-black text-emerald-800">
              ✅ 提示複製 / 下載保留
            </div>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-cyan-100 bg-cyan-50 p-5">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p class="text-sm font-black uppercase tracking-[0.2em] text-cyan-600">
                New Chat Continue Prompt
              </p>
              <h3 class="mt-1 text-xl font-black text-cyan-900">
                後台新對話延續提示
              </h3>
              <p class="mt-2 text-sm leading-6 text-cyan-700">
                對話變卡時，產生這段提示，複製到新對話就能從第 364 批繼續。
              </p>
            </div>

            <div class="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                class="rounded-2xl bg-cyan-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-cyan-200 hover:bg-cyan-700"
                @click="generateNewChatPrompt"
              >
                產生提示
              </button>

              <button
                type="button"
                class="rounded-2xl border border-cyan-200 bg-white px-4 py-2 text-sm font-black text-cyan-700 hover:bg-cyan-100"
                @click="copyNewChatPrompt"
              >
                複製提示
              </button>

              <button
                type="button"
                class="rounded-2xl border border-cyan-200 bg-white px-4 py-2 text-sm font-black text-cyan-700 hover:bg-cyan-100"
                @click="downloadNewChatPromptTxt"
              >
                下載提示 TXT
              </button>
            </div>
          </div>

          <pre
            v-if="newChatPromptVisible"
            class="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-2xl border border-cyan-200 bg-white p-4 text-sm leading-6 text-slate-800"
          >{{ newChatPromptText }}</pre>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-amber-100 bg-amber-50 p-5">
          <p class="text-sm font-black uppercase tracking-[0.2em] text-amber-600">
            Next Game Create Direction
          </p>
          <h3 class="mt-1 text-xl font-black text-amber-900">
            新遊戲後續建立流程
          </h3>

          <div class="mt-4 space-y-2">
            <div
              v-for="step in nextGameCreateDirection"
              :key="step"
              class="rounded-2xl bg-white px-4 py-3 text-sm font-bold leading-6 text-amber-800"
            >
              {{ step }}
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8">
        <div class="mb-5">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-emerald-500">
            Template Flow Stable
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            後台讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            目前 active / planned 分流已完成。active 給預覽切換，planned 給生成器規劃。
          </p>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <div class="rounded-[1.5rem] border border-cyan-100 bg-cyan-50 p-5">
            <div class="flex items-center gap-3">
              <span class="text-3xl">✅</span>
              <div>
                <p class="text-sm font-black uppercase tracking-[0.2em] text-cyan-600">Active Templates</p>
                <h3 class="mt-1 text-xl font-black text-cyan-900">前台 / 後台預覽切換</h3>
              </div>
            </div>

            <div class="mt-4 grid gap-2">
              <div
                v-for="type in stableCheckpoint.activeTemplates"
                :key="type"
                class="rounded-2xl bg-white px-4 py-3 text-sm font-black text-cyan-800"
              >
                {{ type }}
              </div>
            </div>
          </div>

          <div class="rounded-[1.5rem] border border-violet-100 bg-violet-50 p-5">
            <div class="flex items-center gap-3">
              <span class="text-3xl">🧪</span>
              <div>
                <p class="text-sm font-black uppercase tracking-[0.2em] text-violet-600">Planned Templates</p>
                <h3 class="mt-1 text-xl font-black text-violet-900">新遊戲生成器規劃</h3>
              </div>
            </div>

            <div class="mt-4 grid gap-2">
              <div
                v-for="type in stableCheckpoint.plannedTemplates"
                :key="type"
                class="rounded-2xl bg-white px-4 py-3 text-sm font-black text-violet-800"
              >
                {{ type }}
              </div>
            </div>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5">
          <p class="text-sm font-black uppercase tracking-[0.2em] text-emerald-300">
            第 250 批安全基準
          </p>
          <p class="mt-2 text-sm leading-6 text-slate-200">
            {{ stableCheckpoint.currentSafeDirection }}
          </p>
          <p class="mt-2 text-sm leading-6 text-emerald-200">
            {{ stableCheckpoint.stableNote }}
          </p>
        </div>
      </section>

      <section class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8">
        <div class="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-sm font-black uppercase tracking-[0.25em] text-violet-500">
              New Game Generator
            </p>
            <h2 class="mt-1 text-2xl font-black text-slate-950">
              新遊戲生成器面板
            </h2>
            <p class="mt-1 text-sm text-slate-500">
              這裡先規劃新遊戲要生成與套用的檔案。預設選項來自 gameTemplateConfig.js 的 planned 模板，不會真的寫入專案。
            </p>
          </div>

          <div class="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              class="rounded-2xl bg-violet-600 px-5 py-2 text-sm font-black text-white shadow-lg shadow-violet-200 hover:bg-violet-700"
              @click="generateSummary"
            >
              產生規劃摘要
            </button>

            <button
              type="button"
              class="rounded-2xl bg-cyan-600 px-5 py-2 text-sm font-black text-white shadow-lg shadow-cyan-200 hover:bg-cyan-700"
              @click="generateNewChatPrompt"
            >
              產生新對話提示
            </button>
          </div>
        </div>

        <div class="grid gap-3 md:grid-cols-4">
          <button
            v-for="preset in generatorPresets"
            :key="preset.gameType"
            type="button"
            class="rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
            :class="generatorForm.gameType === preset.gameType
              ? 'border-violet-300 bg-violet-50 ring-4 ring-violet-100'
              : 'border-slate-100 bg-slate-50'"
            @click="applyGeneratorPreset(preset)"
          >
            <p class="text-3xl">{{ preset.gameIcon }}</p>
            <p class="mt-2 font-black text-slate-950">{{ preset.gameLabel }}</p>
            <p class="mt-1 text-xs font-bold text-violet-600">{{ preset.gameType }}</p>
            <p class="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{{ preset.description }}</p>
          </button>
        </div>

        <div class="mt-5 grid gap-4 lg:grid-cols-4">
          <label class="block rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <span class="text-sm font-black text-slate-700">遊戲 type</span>
            <input
              v-model="generatorForm.gameType"
              class="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            />
          </label>

          <label class="block rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <span class="text-sm font-black text-slate-700">遊戲名稱</span>
            <input
              v-model="generatorForm.gameLabel"
              class="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            />
          </label>

          <label class="block rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <span class="text-sm font-black text-slate-700">遊戲 icon</span>
            <input
              v-model="generatorForm.gameIcon"
              class="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            />
          </label>

          <label class="block rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <span class="text-sm font-black text-slate-700">PlayBoard 名稱</span>
            <input
              v-model="generatorForm.playBoardName"
              class="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            />
          </label>
        </div>

        <div class="mt-5 grid gap-3 lg:grid-cols-2">
          <div class="rounded-[1.5rem] border border-violet-100 bg-violet-50 p-5">
            <p class="text-sm font-black uppercase tracking-[0.2em] text-violet-500">
              Generated Paths
            </p>

            <div class="mt-4 space-y-3">
              <div
                v-for="item in generatedPaths"
                :key="item.label"
                class="rounded-2xl bg-white p-4"
              >
                <p class="font-black text-slate-950">{{ item.label }}</p>
                <p class="mt-1 break-all rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-cyan-200">
                  {{ item.path }}
                </p>
                <p class="mt-2 text-xs leading-5 text-slate-500">{{ item.description }}</p>
              </div>
            </div>
          </div>

          <div class="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5">
            <p class="text-sm font-black uppercase tracking-[0.2em] text-emerald-500">
              Checklist
            </p>

            <div class="mt-4 space-y-3">
              <div
                v-for="item in generatorChecklist"
                :key="item.label"
                class="rounded-2xl bg-white p-4"
              >
                <div class="flex items-start gap-3">
                  <span class="text-2xl">{{ item.done ? '✅' : '🧪' }}</span>
                  <div>
                    <p class="font-black text-slate-950">{{ item.label }}</p>
                    <p class="mt-1 text-xs leading-5 text-slate-500">{{ item.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="generatedSummaryVisible"
          class="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-slate-100 shadow-inner"
        >
          <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
                Generated Summary
              </p>
              <h3 class="mt-1 text-xl font-black text-white">
                公用模板新遊戲規劃摘要
              </h3>
            </div>

            <div class="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                class="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-black text-white hover:bg-white/20"
                @click="copySummary"
              >
                複製摘要
              </button>

              <button
                type="button"
                class="rounded-2xl bg-cyan-400 px-4 py-2 text-sm font-black text-slate-950 shadow-lg shadow-cyan-900/20 hover:bg-cyan-300"
                @click="downloadSummaryTxt"
              >
                下載摘要 TXT
              </button>
            </div>
          </div>

          <pre class="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-slate-100">{{ generatedSummaryText }}</pre>
        </div>

        <div
          v-if="newChatPromptVisible"
          class="mt-5 rounded-[1.5rem] border border-cyan-200 bg-cyan-50 p-5"
        >
          <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-sm font-black uppercase tracking-[0.2em] text-cyan-600">
                New Chat Prompt
              </p>
              <h3 class="mt-1 text-xl font-black text-slate-950">
                新對話延續提示
              </h3>
              <p class="mt-1 text-sm text-cyan-700">
                開新對話時，把這段複製貼上，就能從目前批次與方向繼續。
              </p>
            </div>

            <div class="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                class="rounded-2xl border border-cyan-200 bg-white px-4 py-2 text-sm font-black text-cyan-700 hover:bg-cyan-100"
                @click="copyNewChatPrompt"
              >
                複製提示
              </button>

              <button
                type="button"
                class="rounded-2xl bg-cyan-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-cyan-200 hover:bg-cyan-700"
                @click="downloadNewChatPromptTxt"
              >
                下載提示 TXT
              </button>
            </div>
          </div>

          <pre class="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-2xl border border-cyan-200 bg-white p-4 text-sm leading-6 text-slate-800">{{ newChatPromptText }}</pre>
        </div>
      </section>

      <section class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8">
        <div class="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-sm font-black uppercase tracking-[0.25em] text-cyan-500">
              Quick Links
            </p>
            <h2 class="mt-1 text-2xl font-black text-slate-950">
              前後台快速互通
            </h2>
            <p class="mt-1 text-sm text-slate-500">
              從後台快速打開前台測試入口與正式頁，確認公用模板沒有影響正式九宮格。
            </p>
          </div>

          <button
            type="button"
            class="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-50"
            @click="clearAdminEventLogs"
          >
            清空後台事件
          </button>
        </div>

        <div class="grid gap-3 md:grid-cols-3">
          <button
            v-for="link in quickLinks"
            :key="link.url"
            type="button"
            class="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-xl"
            @click="openLink(link.url)"
          >
            <div class="flex items-start gap-3">
              <span class="text-3xl">{{ link.icon }}</span>
              <div>
                <p class="text-lg font-black text-slate-950">{{ link.label }}</p>
                <p class="mt-1 text-sm leading-6 text-slate-500">{{ link.description }}</p>
                <p class="mt-2 text-xs font-black text-cyan-600">{{ link.url }}</p>
              </div>
            </div>
          </button>
        </div>
      </section>

      <section class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8">
        <div class="mb-5">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-cyan-500">
            Preview Game Switch
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            後台預覽遊戲切換
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            後台公用設定頁現在從 gameTemplateConfig.js 讀取 active 遊戲模板。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-2">
          <button
            v-for="game in adminPreviewGameOptions"
            :key="game.type"
            type="button"
            class="rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
            :class="selectedGameType === game.type
              ? 'border-cyan-300 bg-cyan-50 ring-4 ring-cyan-100'
              : 'border-slate-100 bg-slate-50'"
            @click="switchPreviewGame(game.type)"
          >
            <div class="flex items-start gap-3">
              <span class="text-3xl">{{ game.icon }}</span>
              <div>
                <p class="text-lg font-black text-slate-950">{{ game.label }}</p>
                <p class="mt-1 text-sm leading-6 text-slate-500">{{ game.description }}</p>
                <p class="mt-2 text-xs font-black text-cyan-600">{{ game.type }}｜{{ game.playBoard }}</p>
              </div>
            </div>
          </button>
        </div>
      </section>

      <section
        v-if="selectedGameType === 'premium-grid'"
        class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8"
      >
        <div class="mb-2">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-indigo-500">
            Premium Grid Settings
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            精緻九宮格公用預覽
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            九宮格目前讀取 gameTemplateConfig.js 的 PremiumGridPlayBoard 登記，玩法設定先維持公用預設。
          </p>
        </div>
      </section>

      <section
        v-if="selectedGameType === 'wheel'"
        class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8"
      >
        <div class="mb-6">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-amber-500">
            Wheel Sync Settings
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            幸運輪盤專屬設定同步面板
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            這些欄位會傳給 CommonGamePlayerView，再傳進 WheelPlayBoard。
          </p>
        </div>

        <div class="grid gap-4 lg:grid-cols-4">
          <label class="block rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <span class="text-sm font-black text-amber-800">輪盤按鈕文字</span>
            <input
              v-model="commonGameForm.wheelSpecific.buttonText"
              class="mt-2 w-full rounded-xl border border-amber-200 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
            />
          </label>

          <label class="block rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <span class="text-sm font-black text-amber-800">旋轉秒數 ms</span>
            <input
              v-model.number="commonGameForm.wheelSpecific.spinDuration"
              type="number"
              min="800"
              max="6000"
              step="100"
              class="mt-2 w-full rounded-xl border border-amber-200 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
            />
          </label>

          <label class="block rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <span class="text-sm font-black text-amber-800">輪盤主題</span>
            <select
              v-model="commonGameForm.wheelSpecific.wheelTheme"
              class="mt-2 w-full rounded-xl border border-amber-200 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
            >
              <option value="gold-stage">gold-stage</option>
              <option value="festival-red">festival-red</option>
              <option value="premium-dark">premium-dark</option>
            </select>
          </label>

          <label class="block rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <span class="text-sm font-black text-amber-800">指針樣式</span>
            <select
              v-model="commonGameForm.wheelSpecific.pointerStyle"
              class="mt-2 w-full rounded-xl border border-amber-200 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
            >
              <option value="red-pointer">red-pointer</option>
              <option value="gold-pointer">gold-pointer</option>
              <option value="neon-pointer">neon-pointer</option>
            </select>
          </label>
        </div>
      </section>

      <section
        v-if="selectedGameType === 'egg-smash'"
        class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8"
      >
        <div class="mb-6">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-amber-500">
            Egg Smash Sync Settings
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            砸金蛋專屬設定同步面板
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            這些欄位會直接傳給 CommonGamePlayerView，再傳進 EggSmashPlayBoard。
          </p>
        </div>

        <div class="grid gap-4 lg:grid-cols-4">
          <label class="block rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <span class="text-sm font-black text-amber-800">金蛋數量</span>
            <input
              v-model.number="commonGameForm.eggSmashSpecific.eggCount"
              type="number"
              min="1"
              max="12"
              class="mt-2 w-full rounded-xl border border-amber-200 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
            />
            <p class="mt-2 text-xs text-amber-700">建議 6～9 顆，手機版較穩。</p>
          </label>

          <label class="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <input
              v-model="commonGameForm.eggSmashSpecific.hammerEnabled"
              type="checkbox"
              class="h-5 w-5"
            />
            <div>
              <p class="text-sm font-black text-amber-800">啟用錘子動畫</p>
              <p class="mt-1 text-xs text-amber-700">點擊砸蛋時顯示 🔨 動畫。</p>
            </div>
          </label>

          <label class="block rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <span class="text-sm font-black text-amber-800">破蛋特效</span>
            <select
              v-model="commonGameForm.eggSmashSpecific.brokenEggEffect"
              class="mt-2 w-full rounded-xl border border-amber-200 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
            >
              <option value="gold-particles">gold-particles</option>
              <option value="shine-burst">shine-burst</option>
              <option value="confetti-pop">confetti-pop</option>
              <option value="simple-crack">simple-crack</option>
            </select>
          </label>

          <label class="block rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <span class="text-sm font-black text-amber-800">按鈕文字</span>
            <input
              v-model="commonGameForm.eggSmashSpecific.buttonText"
              class="mt-2 w-full rounded-xl border border-amber-200 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
            />
          </label>
        </div>
      </section>

      <section class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8">
        <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-sm font-black uppercase tracking-[0.25em] text-indigo-500">
              Live Preview
            </p>
            <h2 class="mt-1 text-2xl font-black text-slate-950">
              {{ selectedPreviewGameOption.label }} 即時預覽
            </h2>
            <p class="mt-1 text-sm text-slate-500">
              下面直接使用 CommonGamePlayerView，依 selectedGameType 切換 EggSmashPlayBoard / WheelPlayBoard。
            </p>
          </div>

          <button
            type="button"
            class="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-50"
            @click="previewMode = previewMode === 'desktop' ? 'mobile' : 'desktop'"
          >
            預覽：{{ previewMode === 'desktop' ? '桌機' : '手機' }}
          </button>
        </div>

        <div class="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-900 p-3">
          <div
            class="mx-auto overflow-hidden rounded-[1.5rem] bg-white transition-all"
            :class="previewMode === 'mobile' ? 'max-w-[420px]' : 'max-w-full'"
          >
            <CommonGamePlayerView
              :game-type="selectedGameType"
              :campaign="previewCampaign"
              :player="previewPlayer"
              :prizes="previewPrizes"
              :draw-logs="previewDrawLogs"
              :rules="previewRules"
              :claim-info="previewClaimInfo"
              :egg-smash-options="previewEggSmashOptions"
              @draw="handlePreviewDraw"
            />
          </div>
        </div>
      </section>

      <section class="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside class="space-y-3">
          <div class="rounded-[2rem] border border-white bg-white p-4 shadow-lg shadow-slate-200/70">
            <p class="px-2 text-sm font-black uppercase tracking-[0.2em] text-slate-400">
              Setting Sections
            </p>

            <div class="mt-4 space-y-2">
              <button
                v-for="section in COMMON_ADMIN_SETTING_SECTIONS"
                :key="section.key"
                type="button"
                class="w-full rounded-2xl px-4 py-3 text-left transition"
                :class="activeSectionKey === section.key
                  ? 'bg-slate-950 text-white shadow-lg'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'"
                @click="switchSection(section.key)"
              >
                <p class="font-black">{{ section.label }}</p>
                <p
                  class="mt-1 text-xs leading-5"
                  :class="activeSectionKey === section.key ? 'text-slate-300' : 'text-slate-400'"
                >
                  {{ section.key }}
                </p>
              </button>
            </div>
          </div>

          <div class="rounded-[2rem] border border-dashed border-slate-300 bg-white/80 p-4 text-sm text-slate-500">
            <p class="font-black text-slate-700">第 237 批安全提示</p>
            <p class="mt-2 leading-6">
              本批只新增後台讀取精緻九宮格正式接入前安全檢查標記，不會真的建立專案檔案，也不影響正式頁。
            </p>
          </div>
        </aside>

        <main class="space-y-6">
          <section class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8">
            <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p class="text-sm font-black uppercase tracking-[0.25em] text-indigo-500">
                  {{ activeSection?.key }}
                </p>
                <h2 class="mt-1 text-2xl font-black text-slate-950">
                  {{ activeSection?.label }}
                </h2>
                <p class="mt-1 text-sm text-slate-500">
                  {{ activeSection?.description }}
                </p>
              </div>

              <button
                type="button"
                class="rounded-2xl bg-violet-600 px-5 py-2 text-sm font-black text-white shadow-lg shadow-violet-200 hover:bg-violet-700"
                :disabled="isSaving"
                @click="saveSettings"
              >
                {{ isSaving ? '儲存中...' : '測試儲存' }}
              </button>
            </div>

            <div v-if="savedMessage" class="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
              {{ savedMessage }}
            </div>

            <div v-if="activeSectionKey === 'basic'" class="grid gap-4">
              <label class="block">
                <span class="text-sm font-black text-slate-700">活動名稱</span>
                <input
                  v-model="commonGameForm.basic.title"
                  class="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                />
              </label>

              <label class="block">
                <span class="text-sm font-black text-slate-700">活動副標</span>
                <input
                  v-model="commonGameForm.basic.subtitle"
                  class="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                />
              </label>

              <label class="block">
                <span class="text-sm font-black text-slate-700">活動說明</span>
                <textarea
                  v-model="commonGameForm.basic.description"
                  rows="4"
                  class="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                ></textarea>
              </label>
            </div>

            <div v-else-if="activeSectionKey === 'chance'" class="grid gap-4 sm:grid-cols-2">
              <label class="block">
                <span class="text-sm font-black text-slate-700">預設遊玩次數</span>
                <input
                  v-model.number="commonGameForm.chance.defaultChances"
                  type="number"
                  min="0"
                  class="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                />
              </label>

              <label class="block">
                <span class="text-sm font-black text-slate-700">每日限制</span>
                <input
                  v-model.number="commonGameForm.chance.dailyLimit"
                  type="number"
                  min="0"
                  class="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                />
              </label>
            </div>

            <div v-else-if="activeSectionKey === 'prizes'" class="space-y-4">
              <div class="flex items-center justify-between">
                <p class="text-sm font-bold text-slate-500">
                  獎品總數：{{ totalPrizeQuantity }}｜機率總和：{{ totalProbability }}%
                </p>

                <button
                  type="button"
                  class="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-black text-white hover:bg-amber-600"
                  @click="addPrize"
                >
                  新增獎品
                </button>
              </div>

              <div class="space-y-3">
                <div
                  v-for="(prize, index) in commonGameForm.prizes"
                  :key="prize.id"
                  class="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 lg:grid-cols-[70px_1fr_100px_100px_90px_80px]"
                >
                  <input
                    v-model="prize.icon"
                    class="rounded-xl border border-slate-200 px-3 py-2 text-center text-sm"
                  />
                  <input
                    v-model="prize.name"
                    class="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    v-model.number="prize.quantity"
                    type="number"
                    min="0"
                    class="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    v-model.number="prize.probability"
                    type="number"
                    min="0"
                    max="100"
                    class="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <label class="flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-600">
                    <input v-model="prize.enabled" type="checkbox" />
                    啟用
                  </label>
                  <button
                    type="button"
                    class="rounded-xl bg-rose-50 px-3 py-2 text-sm font-black text-rose-600 hover:bg-rose-100"
                    @click="removePrize(index)"
                  >
                    刪除
                  </button>
                </div>
              </div>
            </div>

            <div v-else-if="activeSectionKey === 'rules'" class="space-y-4">
              <div class="flex justify-end">
                <button
                  type="button"
                  class="rounded-2xl bg-cyan-600 px-4 py-2 text-sm font-black text-white hover:bg-cyan-700"
                  @click="addRule"
                >
                  新增規則
                </button>
              </div>

              <div class="space-y-3">
                <div
                  v-for="(rule, index) in commonGameForm.rules"
                  :key="index"
                  class="flex gap-3"
                >
                  <textarea
                    v-model="commonGameForm.rules[index]"
                    rows="2"
                    class="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  ></textarea>
                  <button
                    type="button"
                    class="h-12 rounded-2xl bg-rose-50 px-4 text-sm font-black text-rose-600 hover:bg-rose-100"
                    @click="removeRule(index)"
                  >
                    刪除
                  </button>
                </div>
              </div>
            </div>

            <div v-else-if="activeSectionKey === 'claim'" class="grid gap-4">
              <label class="block">
                <span class="text-sm font-black text-slate-700">領獎標題</span>
                <input
                  v-model="commonGameForm.claim.title"
                  class="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                />
              </label>

              <label class="block">
                <span class="text-sm font-black text-slate-700">領獎說明</span>
                <textarea
                  v-model="commonGameForm.claim.description"
                  rows="4"
                  class="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                ></textarea>
              </label>

              <label class="block">
                <span class="text-sm font-black text-slate-700">客服 / 聯絡提醒</span>
                <input
                  v-model="commonGameForm.claim.contactText"
                  class="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                />
              </label>
            </div>

            <div v-else-if="activeSectionKey === 'style'" class="grid gap-4 sm:grid-cols-2">
              <label class="block">
                <span class="text-sm font-black text-slate-700">主題名稱</span>
                <input
                  v-model="commonGameForm.style.themeName"
                  class="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                />
              </label>

              <label class="block">
                <span class="text-sm font-black text-slate-700">按鈕文字</span>
                <input
                  v-model="commonGameForm.style.buttonText"
                  class="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                />
              </label>
            </div>

            <div v-else-if="activeSectionKey === 'share'" class="grid gap-4">
              <label class="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                <input
                  v-model="commonGameForm.share.enabled"
                  type="checkbox"
                  class="h-5 w-5 rounded"
                />
                <span class="text-sm font-black text-slate-700">啟用分享設定</span>
              </label>

              <label class="block">
                <span class="text-sm font-black text-slate-700">分享標題</span>
                <input
                  v-model="commonGameForm.share.title"
                  class="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                />
              </label>

              <label class="block">
                <span class="text-sm font-black text-slate-700">分享描述</span>
                <textarea
                  v-model="commonGameForm.share.description"
                  rows="3"
                  class="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                ></textarea>
              </label>
            </div>

            <div v-else-if="activeSectionKey === 'records'" class="grid gap-4 sm:grid-cols-3">
              <div class="rounded-2xl bg-slate-50 p-5">
                <p class="text-sm font-black text-slate-500">玩家數</p>
                <p class="mt-2 text-3xl font-black text-slate-950">{{ commonGameForm.records.totalPlayers }}</p>
              </div>
              <div class="rounded-2xl bg-slate-50 p-5">
                <p class="text-sm font-black text-slate-500">抽獎數</p>
                <p class="mt-2 text-3xl font-black text-slate-950">{{ commonGameForm.records.totalDraws }}</p>
              </div>
              <div class="rounded-2xl bg-slate-50 p-5">
                <p class="text-sm font-black text-slate-500">中獎數</p>
                <p class="mt-2 text-3xl font-black text-slate-950">{{ commonGameForm.records.totalWins }}</p>
              </div>
            </div>

            <div v-else-if="activeSectionKey === 'reports'" class="rounded-2xl bg-slate-50 p-5">
              <p class="text-sm font-black text-slate-500">報表中心骨架</p>
              <p class="mt-2 text-sm leading-6 text-slate-600">{{ commonGameForm.reports.note }}</p>
            </div>

            <div v-else-if="activeSectionKey === 'preview'" class="rounded-2xl bg-violet-50 p-5 text-sm text-violet-700">
              目前前台預覽已移到上方「{{ selectedPreviewGameOption.label }} 即時預覽」區塊，方便直接觀察同步效果。
            </div>

            <div v-else class="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
              {{ activeSection?.label }} 區塊骨架已建立，後續批次會逐步補正式控制項。
            </div>
          </section>

          <section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div
              v-for="item in safetyItems"
              :key="item.label"
              class="rounded-2xl border bg-white p-4 shadow-sm"
              :class="item.done ? 'border-emerald-100' : 'border-amber-100'"
            >
              <p class="text-xs font-black text-slate-500">{{ item.label }}</p>
              <p
                class="mt-1 text-lg font-black"
                :class="item.done ? 'text-emerald-700' : 'text-amber-700'"
              >
                {{ item.value }}
              </p>
            </div>
          </section>

          <section class="rounded-[2rem] border border-white bg-white p-5 shadow-lg shadow-slate-200/70 sm:p-6">
            <div class="mb-4 flex items-center justify-between">
              <div>
                <p class="text-sm font-black uppercase tracking-[0.25em] text-violet-500">
                  Admin Events
                </p>
                <h2 class="mt-1 text-2xl font-black text-slate-950">
                  後台事件紀錄
                </h2>
              </div>

              <span class="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                {{ adminEventLogs.length }} 筆
              </span>
            </div>

            <div class="space-y-3">
              <div
                v-for="log in adminEventLogs"
                :key="log.id"
                class="rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <p class="font-bold text-slate-900">{{ log.text }}</p>
                <p class="mt-1 text-xs text-slate-500">{{ log.time }}</p>
              </div>
            </div>
          </section>
        </main>
      </section>
    </div>
  </div>
</template>
