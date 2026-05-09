/**
 * Multi Game Platform V2.3 第 358 批：精緻九宮格共用模組轉接器落地版
 *
 * 檔案位置：
 * frontend/src/config/commonGamePremiumGridAdapter.js
 *
 * 本批目的：
 * 1. 建立精緻九宮格 PremiumGrid 與共用遊戲模組之間的轉接層。
 * 2. 先提供純前端 config / adapter / utils，不碰正式頁、不碰 router、不碰 API、不碰 DB。
 * 3. 讓後續第 359 / 360 批可以安全地在測試入口與後台中控台讀取 GRID 共用模板。
 * 4. 正式 PremiumGridLotteryView.vue 先不修改，正式接入會在安全檢查後進行。
 */

import {
  COMMON_GAME_SAFE_RULES,
  createDefaultCommonGameTemplate,
  normalizeCommonGameTemplate,
  validateCommonGameTemplate,
  buildCommonGameAdminSummaryCards,
  buildCommonGameFrontSummaryCards,
  createCommonGameFormalSafeNote,
  createCommonGameTestUrl,
  createCommonGameAdminUrl
} from './commonGameModuleCore'

export const PREMIUM_GRID_COMMON_ADAPTER_VERSION =
  'Multi Game Platform V2.3 第 358 批：精緻九宮格共用模組轉接器落地版'

export const PREMIUM_GRID_COMMON_ADAPTER_BATCH = {
  batch: 'V2.3 第 358 批',
  title: '精緻九宮格共用模組轉接器落地版',
  previousStableBatch: 'V2.3 第 357 批：後台套用共用模板設定表單版',
  configFile: 'src/config/commonGamePremiumGridAdapter.js',
  gameType: 'GRID',
  gameLabel: '精緻九宮格',
  testUrl: '/dev/common-game-player-test?gameType=GRID',
  adminUrl: '/admin/common-game-editor?gameType=GRID',
  formalUrlSafety: '正式 PremiumGridLotteryView.vue 暫不修改，正式接入前需另做安全檢查。',
  nextBatch: 'V2.3 第 359 批：前台測試入口讀取精緻九宮格共用轉接器版',
  note:
    '本批建立 GRID 專用 adapter，讓 PremiumGrid 可以轉成共用模板格式。先用測試入口驗證，不直接修改正式玩家頁。'
}

export const PREMIUM_GRID_COMMON_SAFE_RULES = [
  ...COMMON_GAME_SAFE_RULES,
  '本批不修改 PremiumGridLotteryView.vue',
  '本批不修改 PremiumGridPlayBoard.vue',
  '本批不修改正式 /play/:tenantSlug/premium-grid 路由',
  '本批不修改 legacyGrid fallback',
  '本批不修改正式九宮格抽獎機率',
  '本批不修改九宮格 API 與 DB',
  '必須先在 /dev/common-game-player-test?gameType=GRID 驗證',
  '正式接入前要保留 legacy fallback 與 formalUrlSafe'
]

export const PREMIUM_GRID_COMMON_DEFAULTS = {
  id: 'premium-grid-common-template',
  type: 'GRID',
  label: '精緻九宮格共用模板',
  status: 'testing',
  icon: '🔲',
  routeKey: 'premium-grid',
  description:
    '精緻九宮格共用模板，用於測試入口與後台中控台驗證；正式頁接入前保留安全隔離與 fallback。',
  theme: {
    themeColor: '#f97316',
    accentColor: '#facc15',
    backgroundStyle: 'premium-grid-gradient',
    cardStyle: 'rounded-premium-grid',
    buttonStyle: 'gold-primary',
    textColor: '#0f172a',
    mutedTextColor: '#64748b'
  },
  playBoard: {
    enabled: true,
    testOnly: true,
    formalUrlSafe: true,
    legacyFallback: true,
    showHeader: true,
    showPrizePreview: true,
    showActivityInfo: true,
    showResultPanel: true,
    showDebugPanel: false,
    showCopyTools: false,
    showOpenTools: false,
    animationMode: 'safe-grid',
    resultMode: 'inline',
    layoutMode: 'responsive-grid',
    mobileMode: 'compact-grid',
    grid: {
      rows: 3,
      cols: 3,
      totalCells: 9,
      revealMode: 'single-cell',
      highlightMode: 'active-cell',
      animationPreset: 'premium-soft-pop'
    }
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
    allowFormalUrlTool: false,
    showGridSettings: true,
    showCellPreview: true,
    showPrizeMapping: true
  },
  front: {
    showCampaignHeader: true,
    showGameBoard: true,
    showPrizeHint: true,
    showPlayCount: true,
    showSerialInput: false,
    showMemberHint: true,
    showResultModal: true,
    showSafeFallback: true,
    showTestingBadge: true,
    showGridCells: true,
    showSelectedCell: true,
    showGridResult: true
  }
}

export const PREMIUM_GRID_COMMON_FIELD_GROUPS = {
  basic: {
    key: 'basic',
    label: '九宮格基本設定',
    icon: '🧾',
    fields: ['id', 'type', 'label', 'status', 'description']
  },
  grid: {
    key: 'grid',
    label: '九宮格格子設定',
    icon: '🔲',
    fields: ['rows', 'cols', 'totalCells', 'revealMode', 'highlightMode', 'animationPreset']
  },
  visual: {
    key: 'visual',
    label: '九宮格視覺設定',
    icon: '🎨',
    fields: ['themeColor', 'accentColor', 'backgroundStyle', 'cardStyle', 'buttonStyle']
  },
  playBoard: {
    key: 'playBoard',
    label: 'PlayBoard 設定',
    icon: '🧱',
    fields: ['enabled', 'testOnly', 'formalUrlSafe', 'legacyFallback', 'layoutMode', 'mobileMode']
  },
  prize: {
    key: 'prize',
    label: '獎項與結果',
    icon: '🎁',
    fields: ['showPrizePreview', 'showPrizeHint', 'showResultPanel', 'showResultModal']
  },
  safety: {
    key: 'safety',
    label: '正式頁安全',
    icon: '🔒',
    fields: ['formalUrlSafe', 'legacyFallback', 'testOnly', 'showSafeFallback']
  }
}

export const createPremiumGridCommonTemplate = (overrides = {}) => {
  const baseTemplate = createDefaultCommonGameTemplate('GRID', {
    ...PREMIUM_GRID_COMMON_DEFAULTS,
    fieldGroups: PREMIUM_GRID_COMMON_FIELD_GROUPS,
    safeRules: PREMIUM_GRID_COMMON_SAFE_RULES
  })

  return normalizeCommonGameTemplate({
    ...baseTemplate,
    ...overrides,
    theme: {
      ...baseTemplate.theme,
      ...(overrides.theme || {})
    },
    playBoard: {
      ...baseTemplate.playBoard,
      ...(overrides.playBoard || {}),
      grid: {
        ...(baseTemplate.playBoard?.grid || {}),
        ...(overrides.playBoard?.grid || {})
      }
    },
    admin: {
      ...baseTemplate.admin,
      ...(overrides.admin || {})
    },
    front: {
      ...baseTemplate.front,
      ...(overrides.front || {})
    },
    fieldGroups: overrides.fieldGroups || PREMIUM_GRID_COMMON_FIELD_GROUPS,
    safeRules: overrides.safeRules || PREMIUM_GRID_COMMON_SAFE_RULES
  })
}

export const normalizePremiumGridCommonTemplate = (template = {}) => {
  return createPremiumGridCommonTemplate(template)
}

export const validatePremiumGridCommonTemplate = (template = {}) => {
  const normalized = normalizePremiumGridCommonTemplate(template)
  const baseValidation = validateCommonGameTemplate(normalized)
  const errors = [...baseValidation.errors]
  const warnings = [...baseValidation.warnings]

  const grid = normalized.playBoard?.grid || {}

  if (Number(grid.rows || 0) !== 3) {
    warnings.push('精緻九宮格目前建議 rows 維持 3。')
  }

  if (Number(grid.cols || 0) !== 3) {
    warnings.push('精緻九宮格目前建議 cols 維持 3。')
  }

  if (Number(grid.totalCells || 0) !== 9) {
    warnings.push('精緻九宮格 totalCells 建議維持 9。')
  }

  if (normalized.playBoard?.formalUrlSafe !== true) {
    errors.push('精緻九宮格接入共用模組前，formalUrlSafe 必須為 true。')
  }

  if (normalized.playBoard?.legacyFallback !== true) {
    warnings.push('正式接入前建議 legacyFallback 維持 true，避免正式頁無法回退。')
  }

  if (normalized.playBoard?.testOnly !== true && normalized.status !== 'active') {
    warnings.push('尚未正式接入前，GRID 共用模板建議 testOnly=true。')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    template: normalized
  }
}

export const buildPremiumGridCommonAdminCards = (template = {}) => {
  const normalized = normalizePremiumGridCommonTemplate(template)
  const baseCards = buildCommonGameAdminSummaryCards(normalized)
  const grid = normalized.playBoard?.grid || {}

  return [
    ...baseCards,
    {
      label: '格子數',
      value: `${grid.rows || 3} x ${grid.cols || 3}`,
      icon: '🔲'
    },
    {
      label: '總格數',
      value: `${grid.totalCells || 9} 格`,
      icon: '9️⃣'
    },
    {
      label: '揭示模式',
      value: grid.revealMode || 'single-cell',
      icon: '👆'
    },
    {
      label: '正式接入',
      value: normalized.playBoard?.testOnly ? '尚未接正式頁' : '可評估接入',
      icon: '🚦'
    }
  ]
}

export const buildPremiumGridCommonFrontCards = (template = {}) => {
  const normalized = normalizePremiumGridCommonTemplate(template)
  const baseCards = buildCommonGameFrontSummaryCards(normalized)
  const grid = normalized.playBoard?.grid || {}

  return [
    ...baseCards,
    {
      label: '九宮格',
      value: `${grid.totalCells || 9} 格`,
      icon: '🔲'
    },
    {
      label: '動畫',
      value: grid.animationPreset || 'premium-soft-pop',
      icon: '✨'
    },
    {
      label: '測試入口',
      value: createCommonGameTestUrl('GRID'),
      icon: '🧪'
    },
    {
      label: '後台入口',
      value: createCommonGameAdminUrl('GRID'),
      icon: '🛠️'
    }
  ]
}

export const createPremiumGridCommonFormalSafeCheck = (template = {}) => {
  const normalized = normalizePremiumGridCommonTemplate(template)
  const validation = validatePremiumGridCommonTemplate(normalized)
  const safeNote = createCommonGameFormalSafeNote('GRID')

  const checks = [
    {
      key: 'formalUrlSafe',
      label: '正式頁保護',
      passed: normalized.playBoard?.formalUrlSafe === true,
      message: normalized.playBoard?.formalUrlSafe
        ? 'formalUrlSafe 已啟用。'
        : 'formalUrlSafe 未啟用，禁止接正式頁。'
    },
    {
      key: 'legacyFallback',
      label: '舊版 fallback',
      passed: normalized.playBoard?.legacyFallback === true,
      message: normalized.playBoard?.legacyFallback
        ? 'legacy fallback 已保留。'
        : 'legacy fallback 未保留，正式接入前需要補上。'
    },
    {
      key: 'testOnly',
      label: '測試隔離',
      passed: normalized.playBoard?.testOnly === true,
      message: normalized.playBoard?.testOnly
        ? '目前仍隔離在測試模式。'
        : 'testOnly 已關閉，正式接入前需要確認所有安全項目。'
    },
    {
      key: 'gridCells',
      label: '九宮格格數',
      passed: Number(normalized.playBoard?.grid?.totalCells || 0) === 9,
      message:
        Number(normalized.playBoard?.grid?.totalCells || 0) === 9
          ? '九宮格格數為 9。'
          : '九宮格格數不是 9，請確認是否為預期。'
    },
    {
      key: 'validation',
      label: '模板驗證',
      passed: validation.valid,
      message: validation.valid ? '模板驗證通過。' : '模板仍有錯誤，禁止正式接入。'
    }
  ]

  return {
    title: '精緻九宮格正式頁安全檢查',
    type: 'GRID',
    template: normalized,
    validation,
    safeNote,
    checks,
    passed: checks.every((check) => check.passed),
    safeRules: PREMIUM_GRID_COMMON_SAFE_RULES
  }
}

export const createPremiumGridCommonAdapterSummary = (template = {}) => {
  const normalized = normalizePremiumGridCommonTemplate(template)
  const validation = validatePremiumGridCommonTemplate(normalized)
  const formalSafeCheck = createPremiumGridCommonFormalSafeCheck(normalized)

  return {
    ...PREMIUM_GRID_COMMON_ADAPTER_BATCH,
    version: PREMIUM_GRID_COMMON_ADAPTER_VERSION,
    template: normalized,
    validation,
    formalSafeCheck,
    adminCards: buildPremiumGridCommonAdminCards(normalized),
    frontCards: buildPremiumGridCommonFrontCards(normalized),
    safeRules: PREMIUM_GRID_COMMON_SAFE_RULES,
    fieldGroups: PREMIUM_GRID_COMMON_FIELD_GROUPS,
    readyForTestEntry: true,
    readyForAdminConsole: true,
    readyForFormalPage: false,
    nextSteps: [
      {
        batch: 'V2.3 第 359 批',
        title: '前台測試入口讀取精緻九宮格共用轉接器版',
        target: 'CommonGamePlayerTestView.vue',
        note: '先在測試入口讀取 GRID adapter，不動正式頁。'
      },
      {
        batch: 'V2.3 第 360 批',
        title: '後台讀取精緻九宮格共用轉接器版',
        target: 'AdminCommonGameEditorView.vue',
        note: '後台中控台讀取 GRID adapter，顯示安全檢查與表單資料。'
      },
      {
        batch: 'V2.3 第 361 批',
        title: '精緻九宮格共用模組正式接入前檢查版',
        target: 'PremiumGridLotteryView.vue / route safety review',
        note: '正式接入前檢查，不直接覆蓋正式頁。'
      }
    ]
  }
}

export const getPremiumGridCommonAdapterStatusCards = () => {
  const summary = createPremiumGridCommonAdapterSummary()

  return [
    {
      label: '轉接器版本',
      value: summary.batch,
      icon: '🔌'
    },
    {
      label: '遊戲類型',
      value: summary.gameType,
      icon: '🔲'
    },
    {
      label: '測試入口',
      value: summary.readyForTestEntry ? '可測試' : '未完成',
      icon: '🧪'
    },
    {
      label: '後台中控台',
      value: summary.readyForAdminConsole ? '可讀取' : '未完成',
      icon: '🛠️'
    },
    {
      label: '正式頁',
      value: summary.readyForFormalPage ? '可接入' : '暫不接入',
      icon: '🔒'
    },
    {
      label: '下一步',
      value: summary.nextBatch,
      icon: '➡️'
    }
  ]
}

export default {
  PREMIUM_GRID_COMMON_ADAPTER_VERSION,
  PREMIUM_GRID_COMMON_ADAPTER_BATCH,
  PREMIUM_GRID_COMMON_SAFE_RULES,
  PREMIUM_GRID_COMMON_DEFAULTS,
  PREMIUM_GRID_COMMON_FIELD_GROUPS,
  createPremiumGridCommonTemplate,
  normalizePremiumGridCommonTemplate,
  validatePremiumGridCommonTemplate,
  buildPremiumGridCommonAdminCards,
  buildPremiumGridCommonFrontCards,
  createPremiumGridCommonFormalSafeCheck,
  createPremiumGridCommonAdapterSummary,
  getPremiumGridCommonAdapterStatusCards
}
