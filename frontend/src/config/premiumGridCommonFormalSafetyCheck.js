/**
 * Multi Game Platform V2.3 第 361 批：精緻九宮格共用模組正式接入前安全檢查版
 *
 * 檔案位置：
 * frontend/src/config/premiumGridCommonFormalSafetyCheck.js
 *
 * 本批目的：
 * 1. 在正式 PremiumGridLotteryView.vue 接入共用模組前，建立完整安全檢查。
 * 2. 只新增純前端 config / checklist / utils，不碰正式頁、不碰 router、不碰 API、不碰 DB。
 * 3. 確認 legacyGrid fallback、formalUrlSafe、測試 URL / 正式 URL 分離、共用 PlayBoard 接入風險。
 * 4. 後續第 362 批可讓後台 / 前台測試入口讀取這份正式接入前檢查。
 */

import {
  createPremiumGridCommonAdapterSummary,
  createPremiumGridCommonFormalSafeCheck,
  createPremiumGridCommonTemplate
} from './commonGamePremiumGridAdapter'

export const PREMIUM_GRID_FORMAL_SAFETY_VERSION =
  'Multi Game Platform V2.3 第 361 批：精緻九宮格共用模組正式接入前安全檢查版'

export const PREMIUM_GRID_FORMAL_SAFETY_BATCH = {
  batch: 'V2.3 第 361 批',
  title: '精緻九宮格共用模組正式接入前安全檢查版',
  previousStableBatch: 'V2.3 第 360 批：後台讀取精緻九宮格共用轉接器版',
  configFile: 'src/config/premiumGridCommonFormalSafetyCheck.js',
  targetFormalFile: 'src/views/games/PremiumGridLotteryView.vue',
  targetFormalUrl: '/play/:tenantSlug/premium-grid',
  testUrl: '/dev/common-game-player-test?gameType=GRID',
  adminUrl: '/admin/common-game-editor?gameType=GRID',
  nextBatch: 'V2.3 第 362 批：前後台讀取精緻九宮格正式接入前安全檢查版',
  note:
    '本批只建立正式接入前安全檢查，不直接修改 PremiumGridLotteryView.vue、不修改 router、不修改 API、不修改 DB。'
}

export const PREMIUM_GRID_FORMAL_CRITICAL_RULES = [
  {
    key: 'doNotBreakFormalUrl',
    level: 'critical',
    label: '不可破壞正式網址',
    description: '正式網址 /play/:tenantSlug/premium-grid 必須維持可開啟。',
    required: true
  },
  {
    key: 'keepLegacyGridFallback',
    level: 'critical',
    label: '保留 legacyGrid fallback',
    description: '正式頁接入共用模組後，必須能用 legacyGrid=1 或內部 fallback 回舊版。',
    required: true
  },
  {
    key: 'keepFormalUrlSafe',
    level: 'critical',
    label: 'formalUrlSafe 必須啟用',
    description: '共用模組接正式頁前，formalUrlSafe 必須為 true。',
    required: true
  },
  {
    key: 'separateTestAndFormal',
    level: 'critical',
    label: '測試 URL / 正式 URL 分離',
    description: '測試面板、debug 卡片、copy/open 工具不可出現在正式玩家頁。',
    required: true
  },
  {
    key: 'doNotTouchRouterFirst',
    level: 'critical',
    label: '先不修改 router',
    description: '正式接入初期優先在 PremiumGridLotteryView.vue 內做安全切換，不先動 router。',
    required: true
  },
  {
    key: 'doNotTouchApiDb',
    level: 'critical',
    label: '不修改 API / DB',
    description: '共用前端模組接入不應影響抽獎 API、獎項 DB、紀錄 DB。',
    required: true
  },
  {
    key: 'doNotChangeProbabilityCore',
    level: 'critical',
    label: '不修改機率核心',
    description: '接入共用 PlayBoard 不應改動抽獎機率、獎項權重、序號驗證核心。',
    required: true
  },
  {
    key: 'keepTenantIsolation',
    level: 'critical',
    label: '保留 tenant 隔離',
    description: 'A 商家、B 商家活動與資料不可互相影響。',
    required: true
  }
]

export const PREMIUM_GRID_FORMAL_RECOMMENDED_RULES = [
  {
    key: 'startWithDisplayOnly',
    level: 'recommended',
    label: '先顯示層接入',
    description: '第一階段只接共用顯示與模板，不改抽獎提交流程。'
  },
  {
    key: 'useFeatureFlag',
    level: 'recommended',
    label: '使用 feature flag',
    description: '建議使用 usePremiumGridCommonPlayBoard=true 這類旗標，方便回退。'
  },
  {
    key: 'keepOldDrawSectionsHidden',
    level: 'recommended',
    label: '避免重複區塊',
    description: '新舊 PlayBoard 同時存在時，正式玩家頁不可出現重複 draw/prize/activity 區塊。'
  },
  {
    key: 'mobileFirstCheck',
    level: 'recommended',
    label: '手機版優先檢查',
    description: '九宮格正式頁要確認手機、平板、桌機都不破版。'
  },
  {
    key: 'adminPreviewLater',
    level: 'recommended',
    label: '後台預覽後續再接',
    description: '正式頁第一階段先不要一次接太多後台 live preview 資料流。'
  }
]

export const PREMIUM_GRID_FORMAL_PHASES = [
  {
    phase: 1,
    key: 'safety-read',
    title: '讀取安全檢查',
    status: 'current',
    batch: 'V2.3 第 361 批',
    description: '建立正式接入前檢查，不修改正式頁。'
  },
  {
    phase: 2,
    key: 'admin-front-read',
    title: '前後台讀取檢查',
    status: 'next',
    batch: 'V2.3 第 362 批',
    description: '讓後台與前台測試入口讀取正式接入前安全檢查。'
  },
  {
    phase: 3,
    key: 'formal-display-flag',
    title: '正式頁顯示旗標',
    status: 'planned',
    batch: 'V2.3 第 363 批',
    description: '在正式九宮格頁建立共用模組顯示旗標，但先預設關閉或保守開啟。'
  },
  {
    phase: 4,
    key: 'formal-common-playboard',
    title: '正式頁接共用 PlayBoard',
    status: 'planned',
    batch: 'V2.3 第 364 批',
    description: '正式頁開始接 CommonGamePlayBoard，但保留 legacy fallback。'
  },
  {
    phase: 5,
    key: 'formal-clean-duplicates',
    title: '正式頁清理重複區塊',
    status: 'planned',
    batch: 'V2.3 第 365 批',
    description: '確認新舊區塊不重複顯示。'
  },
  {
    phase: 6,
    key: 'formal-stable-backup',
    title: '正式頁穩定備份',
    status: 'planned',
    batch: 'V2.3 第 366 批',
    description: '正式九宮格共用模組接入後建立穩定備份。'
  }
]

export const createPremiumGridFormalSafetyTemplate = (overrides = {}) => {
  return createPremiumGridCommonTemplate({
    id: 'premium-grid-formal-safety-check-template',
    label: '精緻九宮格正式接入前安全檢查模板',
    status: 'testing',
    description:
      '正式 PremiumGridLotteryView.vue 接入共用模組前使用的安全檢查模板，確保正式網址、fallback、router、API、DB 與機率核心不受影響。',
    playBoard: {
      testOnly: true,
      formalUrlSafe: true,
      legacyFallback: true,
      showDebugPanel: false,
      showCopyTools: false,
      showOpenTools: false,
      animationMode: 'safe-grid',
      layoutMode: 'responsive-grid'
    },
    ...overrides
  })
}

export const runPremiumGridFormalSafetyCheck = (template = {}) => {
  const safetyTemplate = createPremiumGridFormalSafetyTemplate(template)
  const adapterSummary = createPremiumGridCommonAdapterSummary(safetyTemplate)
  const adapterFormalCheck = createPremiumGridCommonFormalSafeCheck(safetyTemplate)

  const criticalChecks = [
    {
      key: 'formalUrlSafe',
      label: 'formalUrlSafe',
      passed: safetyTemplate.playBoard?.formalUrlSafe === true,
      message: safetyTemplate.playBoard?.formalUrlSafe
        ? 'formalUrlSafe 已啟用。'
        : 'formalUrlSafe 未啟用，禁止正式接入。'
    },
    {
      key: 'legacyFallback',
      label: 'legacy fallback',
      passed: safetyTemplate.playBoard?.legacyFallback === true,
      message: safetyTemplate.playBoard?.legacyFallback
        ? 'legacy fallback 已保留。'
        : 'legacy fallback 未保留，禁止正式接入。'
    },
    {
      key: 'testOnly',
      label: '測試隔離',
      passed: safetyTemplate.playBoard?.testOnly === true,
      message: safetyTemplate.playBoard?.testOnly
        ? '目前仍為測試隔離狀態。'
        : 'testOnly 已關閉，正式接入前需要人工確認。'
    },
    {
      key: 'adapterFormalCheck',
      label: 'adapter 安全檢查',
      passed: adapterFormalCheck.passed === true,
      message: adapterFormalCheck.passed
        ? 'adapter formal safe check 通過。'
        : 'adapter formal safe check 尚未通過。'
    },
    {
      key: 'readyForFormalPage',
      label: '正式頁接入狀態',
      passed: adapterSummary.readyForFormalPage === false,
      message:
        adapterSummary.readyForFormalPage === false
          ? '目前仍保持不接正式頁，符合第 361 批安全策略。'
          : 'adapter 已標記可接正式頁，需要人工確認。'
    }
  ]

  const allCriticalPassed = criticalChecks.every((check) => check.passed)

  return {
    ...PREMIUM_GRID_FORMAL_SAFETY_BATCH,
    version: PREMIUM_GRID_FORMAL_SAFETY_VERSION,
    template: safetyTemplate,
    adapterSummary,
    adapterFormalCheck,
    criticalRules: PREMIUM_GRID_FORMAL_CRITICAL_RULES,
    recommendedRules: PREMIUM_GRID_FORMAL_RECOMMENDED_RULES,
    phases: PREMIUM_GRID_FORMAL_PHASES,
    criticalChecks,
    allCriticalPassed,
    readyForNextReadBatch: allCriticalPassed,
    readyForFormalPageChange: false,
    conclusion: allCriticalPassed
      ? '正式接入前安全檢查資料已建立，可進入第 362 批讓前後台讀取檢查。正式頁仍不可直接修改。'
      : '正式接入前安全檢查尚未通過，禁止進入正式頁接入。'
  }
}

export const getPremiumGridFormalSafetyStatusCards = () => {
  const result = runPremiumGridFormalSafetyCheck()

  return [
    {
      label: '安全檢查版本',
      value: result.batch,
      icon: '🛡️'
    },
    {
      label: '正式頁目標',
      value: result.targetFormalFile,
      icon: '🔲'
    },
    {
      label: '正式網址',
      value: result.targetFormalUrl,
      icon: '🌐'
    },
    {
      label: 'critical checks',
      value: result.allCriticalPassed ? '通過' : '未通過',
      icon: result.allCriticalPassed ? '✅' : '❌'
    },
    {
      label: '可進第 362 批',
      value: result.readyForNextReadBatch ? '可以' : '暫停',
      icon: '➡️'
    },
    {
      label: '可直接改正式頁',
      value: result.readyForFormalPageChange ? '可以' : '不可以',
      icon: '🔒'
    }
  ]
}

export const getPremiumGridFormalSafetyPhaseCards = () => {
  return PREMIUM_GRID_FORMAL_PHASES.map((phase) => ({
    label: phase.batch,
    value: phase.title,
    icon:
      phase.status === 'current'
        ? '🟢'
        : phase.status === 'next'
          ? '🔵'
          : '⚪',
    description: phase.description,
    status: phase.status
  }))
}

export const getPremiumGridFormalSafetySummary = () => {
  const result = runPremiumGridFormalSafetyCheck()

  return {
    ...result,
    statusCards: getPremiumGridFormalSafetyStatusCards(),
    phaseCards: getPremiumGridFormalSafetyPhaseCards()
  }
}

export default {
  PREMIUM_GRID_FORMAL_SAFETY_VERSION,
  PREMIUM_GRID_FORMAL_SAFETY_BATCH,
  PREMIUM_GRID_FORMAL_CRITICAL_RULES,
  PREMIUM_GRID_FORMAL_RECOMMENDED_RULES,
  PREMIUM_GRID_FORMAL_PHASES,
  createPremiumGridFormalSafetyTemplate,
  runPremiumGridFormalSafetyCheck,
  getPremiumGridFormalSafetyStatusCards,
  getPremiumGridFormalSafetyPhaseCards,
  getPremiumGridFormalSafetySummary
}
