/**
 * Multi Game Platform V2.3 第 353 批：共用遊戲模組核心落地版
 *
 * 檔案位置：
 * frontend/src/config/commonGameModuleCore.js
 *
 * 本批目的：
 * 1. 正式建立可被後台、前台、各遊戲共用的核心模組。
 * 2. 先提供純前端 config / utils，不碰正式頁、不碰 router、不碰 API、不碰 DB。
 * 3. 提供遊戲類型、模板狀態、批次策略、安全規則、欄位分類、PlayBoard 預設值。
 * 4. 提供 normalize / validate / createDefaultTemplate 工具。
 * 5. 後續第 354 批可建立共用 PlayBoard 元件，第 355 批可讓後台表單開始套用。
 */

export const COMMON_GAME_MODULE_VERSION =
  'Multi Game Platform V2.3 第 353 批：共用遊戲模組核心落地版'

export const COMMON_GAME_MODULE_BATCH = {
  batch: 'V2.3 第 353 批',
  title: '共用遊戲模組核心落地版',
  previousStableBatch: 'V2.3 第 352 批：後台讀取完整整合前後台讀取完成總穩定備份版',
  configFile: 'src/config/commonGameModuleCore.js',
  deliveryMode: '整份 TXT 覆蓋 / 新檔案建立',
  nextBatch: 'V2.3 第 354 批：共用 PlayBoard 顯示元件落地版',
  note:
    '本批建立共用遊戲模組核心設定與工具，後續讓後台、前台測試入口、正式玩家頁與各遊戲模組逐步共用。正式頁、router、API、DB 皆不在本批修改。'
}

export const COMMON_GAME_BATCH_STRATEGY = {
  stable: {
    label: '穩定整理',
    range: '150～200 項',
    description: '文案、狀態、設定、總覽、流程、檢查清單、純前端 config 可用此模式。'
  },
  mediumRisk: {
    label: '中風險改動',
    range: '40～80 項',
    description: '牽涉元件結構、表單資料流、前後台同步顯示時，建議縮小批次。'
  },
  errorFix: {
    label: '錯誤修正',
    range: '1～5 項',
    description: '遇到 import、render、runtime、router、API、DB 錯誤時，先小批修正。'
  }
}

export const COMMON_GAME_SAFE_RULES = [
  '不直接修改正式 WheelGameView.vue',
  '不直接修改正式 PremiumGridLotteryView.vue',
  '不直接修改 router/index.js',
  '不直接修改 API endpoint',
  '不直接修改 Prisma schema',
  '不直接修改 DB migration',
  '不直接修改登入、tenant、role 權限',
  '不直接修改正式抽獎機率核心',
  '所有正式頁接入前先通過測試入口',
  '穩定整理型功能優先提供整份 TXT'
]

export const COMMON_GAME_TYPES = {
  WHEEL: {
    type: 'WHEEL',
    label: '幸運輪盤',
    icon: '🎡',
    routeKey: 'wheel',
    status: 'active',
    playBoard: 'CommonWheelPlayBoard',
    description: '適合抽獎、轉盤、權重中獎、品牌活動。'
  },
  GRID: {
    type: 'GRID',
    label: '精緻九宮格',
    icon: '🔲',
    routeKey: 'premium-grid',
    status: 'active',
    playBoard: 'CommonGridPlayBoard',
    description: '適合九宮格抽獎、格子翻轉、快速互動活動。'
  },
  SCRATCH: {
    type: 'SCRATCH',
    label: '刮刮卡',
    icon: '🎫',
    routeKey: 'scratch',
    status: 'planned',
    playBoard: 'CommonScratchPlayBoard',
    description: '適合刮卡、即開即中、優惠券活動。'
  },
  FLIP: {
    type: 'FLIP',
    label: '翻牌',
    icon: '🃏',
    routeKey: 'flip',
    status: 'planned',
    playBoard: 'CommonFlipPlayBoard',
    description: '適合記憶翻牌、抽卡、配對活動。'
  },
  GOLDEN_EGG: {
    type: 'GOLDEN_EGG',
    label: '砸金蛋',
    icon: '🥚',
    routeKey: 'golden-egg',
    status: 'planned',
    playBoard: 'CommonGoldenEggPlayBoard',
    description: '適合砸蛋、開獎、節慶促銷活動。'
  },
  SLOT: {
    type: 'SLOT',
    label: '拉霸機',
    icon: '🎰',
    routeKey: 'slot',
    status: 'planned',
    playBoard: 'CommonSlotPlayBoard',
    description: '適合拉霸、連線獎勵、娛樂互動活動。'
  }
}

export const COMMON_GAME_TEMPLATE_STATUS = {
  ACTIVE: {
    value: 'active',
    label: '已啟用',
    icon: '✅',
    description: '可在後台與前台測試入口使用。'
  },
  PLANNED: {
    value: 'planned',
    label: '規劃中',
    icon: '🕓',
    description: '保留模板方向，尚未接入正式流程。'
  },
  DISABLED: {
    value: 'disabled',
    label: '已停用',
    icon: '⛔',
    description: '暫時不顯示或不允許建立。'
  },
  TESTING: {
    value: 'testing',
    label: '測試中',
    icon: '🧪',
    description: '只允許在測試入口驗證。'
  }
}

export const COMMON_GAME_FIELD_GROUPS = {
  basic: {
    key: 'basic',
    label: '基本設定',
    icon: '🧾',
    fields: ['title', 'subtitle', 'description', 'gameType', 'status']
  },
  visual: {
    key: 'visual',
    label: '視覺設定',
    icon: '🎨',
    fields: ['themeColor', 'accentColor', 'backgroundStyle', 'cardStyle', 'buttonStyle']
  },
  play: {
    key: 'play',
    label: '玩法設定',
    icon: '🎮',
    fields: ['attemptsPerUser', 'playMode', 'animationMode', 'resultMode', 'serialCodeMode']
  },
  prize: {
    key: 'prize',
    label: '獎項設定',
    icon: '🎁',
    fields: ['prizeMode', 'prizeDisplayMode', 'rewardClaimMode', 'emptyPrizeText']
  },
  safety: {
    key: 'safety',
    label: '安全設定',
    icon: '🔒',
    fields: ['formalUrlSafe', 'testOnly', 'legacyFallback', 'tenantScoped', 'roleRequired']
  },
  advanced: {
    key: 'advanced',
    label: '進階設定',
    icon: '⚙️',
    fields: ['debugPanel', 'copyTools', 'openTools', 'stateMemory', 'resetTools']
  }
}

export const COMMON_GAME_DEFAULT_THEME = {
  themeColor: '#f97316',
  accentColor: '#fb923c',
  backgroundStyle: 'soft-gradient',
  cardStyle: 'rounded-glass',
  buttonStyle: 'primary-solid',
  textColor: '#0f172a',
  mutedTextColor: '#64748b'
}

export const COMMON_GAME_DEFAULT_PLAYBOARD = {
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
  animationMode: 'safe',
  resultMode: 'inline',
  layoutMode: 'responsive',
  mobileMode: 'compact'
}

export const COMMON_GAME_DEFAULT_ADMIN = {
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

export const COMMON_GAME_DEFAULT_FRONT = {
  showCampaignHeader: true,
  showGameBoard: true,
  showPrizeHint: true,
  showPlayCount: true,
  showSerialInput: false,
  showMemberHint: true,
  showResultModal: true,
  showSafeFallback: true,
  showTestingBadge: true
}

export const COMMON_GAME_DEFAULT_TEMPLATE = {
  id: 'common-template',
  type: 'COMMON',
  label: '共用遊戲模板',
  status: 'testing',
  icon: '🧩',
  description: '共用遊戲模板基礎設定。',
  theme: COMMON_GAME_DEFAULT_THEME,
  playBoard: COMMON_GAME_DEFAULT_PLAYBOARD,
  admin: COMMON_GAME_DEFAULT_ADMIN,
  front: COMMON_GAME_DEFAULT_FRONT,
  fieldGroups: COMMON_GAME_FIELD_GROUPS,
  safeRules: COMMON_GAME_SAFE_RULES,
  batchStrategy: COMMON_GAME_BATCH_STRATEGY
}

export const getCommonGameTypeList = () => {
  return Object.values(COMMON_GAME_TYPES)
}

export const getCommonGameTypeOptions = () => {
  return getCommonGameTypeList().map((game) => ({
    label: game.label,
    value: game.type,
    icon: game.icon,
    status: game.status,
    routeKey: game.routeKey,
    description: game.description
  }))
}

export const getCommonGameStatusOptions = () => {
  return Object.values(COMMON_GAME_TEMPLATE_STATUS).map((status) => ({
    label: status.label,
    value: status.value,
    icon: status.icon,
    description: status.description
  }))
}

export const getCommonGameFieldGroupList = () => {
  return Object.values(COMMON_GAME_FIELD_GROUPS)
}

export const getCommonGameSafeRules = () => {
  return [...COMMON_GAME_SAFE_RULES]
}

export const getCommonGameBatchStrategy = () => {
  return {
    ...COMMON_GAME_BATCH_STRATEGY
  }
}

export const getCommonGameModuleSummary = () => {
  return {
    ...COMMON_GAME_MODULE_BATCH,
    version: COMMON_GAME_MODULE_VERSION,
    supportedGameTypes: getCommonGameTypeList(),
    statusOptions: getCommonGameStatusOptions(),
    fieldGroups: getCommonGameFieldGroupList(),
    safeRules: getCommonGameSafeRules(),
    batchStrategy: getCommonGameBatchStrategy()
  }
}

export const getCommonGameTypeByType = (type) => {
  if (!type) return null
  const normalizedType = String(type).trim().toUpperCase()
  return COMMON_GAME_TYPES[normalizedType] || null
}

export const isCommonGameTypeActive = (type) => {
  const gameType = getCommonGameTypeByType(type)
  return gameType?.status === 'active'
}

export const isCommonGameTypePlanned = (type) => {
  const gameType = getCommonGameTypeByType(type)
  return gameType?.status === 'planned'
}

export const createCommonGameTemplateId = (type = 'COMMON') => {
  return `common-${String(type).toLowerCase().replace(/_/g, '-')}-template`
}

export const createDefaultCommonGameTemplate = (type = 'COMMON', overrides = {}) => {
  const gameType = getCommonGameTypeByType(type)

  const baseTemplate = {
    ...COMMON_GAME_DEFAULT_TEMPLATE,
    id: createCommonGameTemplateId(gameType?.type || type),
    type: gameType?.type || String(type || 'COMMON').toUpperCase(),
    label: gameType?.label || COMMON_GAME_DEFAULT_TEMPLATE.label,
    status: gameType?.status || COMMON_GAME_DEFAULT_TEMPLATE.status,
    icon: gameType?.icon || COMMON_GAME_DEFAULT_TEMPLATE.icon,
    description: gameType?.description || COMMON_GAME_DEFAULT_TEMPLATE.description,
    routeKey: gameType?.routeKey || '',
    playBoardName: gameType?.playBoard || 'CommonGamePlayBoard'
  }

  return normalizeCommonGameTemplate({
    ...baseTemplate,
    ...overrides,
    theme: {
      ...baseTemplate.theme,
      ...(overrides.theme || {})
    },
    playBoard: {
      ...baseTemplate.playBoard,
      ...(overrides.playBoard || {})
    },
    admin: {
      ...baseTemplate.admin,
      ...(overrides.admin || {})
    },
    front: {
      ...baseTemplate.front,
      ...(overrides.front || {})
    }
  })
}

export const normalizeCommonGameTemplate = (template = {}) => {
  const type = template.type || 'COMMON'
  const gameType = getCommonGameTypeByType(type)

  return {
    ...COMMON_GAME_DEFAULT_TEMPLATE,
    ...template,
    id: template.id || createCommonGameTemplateId(gameType?.type || type),
    type: gameType?.type || String(type || 'COMMON').toUpperCase(),
    label: template.label || gameType?.label || COMMON_GAME_DEFAULT_TEMPLATE.label,
    status: template.status || gameType?.status || COMMON_GAME_DEFAULT_TEMPLATE.status,
    icon: template.icon || gameType?.icon || COMMON_GAME_DEFAULT_TEMPLATE.icon,
    description: template.description || gameType?.description || COMMON_GAME_DEFAULT_TEMPLATE.description,
    routeKey: template.routeKey || gameType?.routeKey || '',
    playBoardName: template.playBoardName || gameType?.playBoard || 'CommonGamePlayBoard',
    theme: {
      ...COMMON_GAME_DEFAULT_THEME,
      ...(template.theme || {})
    },
    playBoard: {
      ...COMMON_GAME_DEFAULT_PLAYBOARD,
      ...(template.playBoard || {})
    },
    admin: {
      ...COMMON_GAME_DEFAULT_ADMIN,
      ...(template.admin || {})
    },
    front: {
      ...COMMON_GAME_DEFAULT_FRONT,
      ...(template.front || {})
    },
    fieldGroups: template.fieldGroups || COMMON_GAME_FIELD_GROUPS,
    safeRules: template.safeRules || COMMON_GAME_SAFE_RULES,
    batchStrategy: template.batchStrategy || COMMON_GAME_BATCH_STRATEGY
  }
}

export const validateCommonGameTemplate = (template = {}) => {
  const normalized = normalizeCommonGameTemplate(template)
  const errors = []
  const warnings = []

  if (!normalized.id) {
    errors.push('缺少模板 id。')
  }

  if (!normalized.type) {
    errors.push('缺少遊戲 type。')
  }

  if (!normalized.label) {
    errors.push('缺少模板名稱 label。')
  }

  if (!normalized.playBoardName) {
    warnings.push('尚未指定 playBoardName，將使用 CommonGamePlayBoard。')
  }

  if (normalized.playBoard?.formalUrlSafe !== true) {
    warnings.push('formalUrlSafe 建議保持 true，避免測試設定影響正式頁。')
  }

  if (normalized.playBoard?.testOnly !== true && normalized.status !== 'active') {
    warnings.push('非 active 模板建議保持 testOnly=true。')
  }

  if (!['active', 'planned', 'disabled', 'testing'].includes(normalized.status)) {
    warnings.push('模板 status 非標準值，建議使用 active / planned / disabled / testing。')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    template: normalized
  }
}

export const buildCommonGameAdminSummaryCards = (template = {}) => {
  const normalized = normalizeCommonGameTemplate(template)

  return [
    {
      label: '模板名稱',
      value: normalized.label,
      icon: normalized.icon || '🧩'
    },
    {
      label: '遊戲類型',
      value: normalized.type,
      icon: '🎮'
    },
    {
      label: '狀態',
      value: normalized.status,
      icon: COMMON_GAME_TEMPLATE_STATUS[String(normalized.status).toUpperCase()]?.icon || '🧪'
    },
    {
      label: 'PlayBoard',
      value: normalized.playBoardName,
      icon: '🧱'
    },
    {
      label: '正式頁保護',
      value: normalized.playBoard?.formalUrlSafe ? '已啟用' : '未啟用',
      icon: '🔒'
    },
    {
      label: '交付模式',
      value: '整份 TXT 覆蓋',
      icon: '📄'
    }
  ]
}

export const buildCommonGameFrontSummaryCards = (template = {}) => {
  const normalized = normalizeCommonGameTemplate(template)

  return [
    {
      label: '活動模板',
      value: normalized.label,
      icon: normalized.icon || '🧩'
    },
    {
      label: '玩家頁',
      value: normalized.front?.showGameBoard ? '顯示' : '隱藏',
      icon: '🎮'
    },
    {
      label: '獎品提示',
      value: normalized.front?.showPrizeHint ? '顯示' : '隱藏',
      icon: '🎁'
    },
    {
      label: '結果彈窗',
      value: normalized.front?.showResultModal ? '啟用' : '停用',
      icon: '🏆'
    },
    {
      label: '測試標記',
      value: normalized.front?.showTestingBadge ? '顯示' : '隱藏',
      icon: '🧪'
    },
    {
      label: '安全 fallback',
      value: normalized.front?.showSafeFallback ? '啟用' : '停用',
      icon: '🛡️'
    }
  ]
}

export const createCommonGameTestUrl = (type = 'COMMON') => {
  const gameType = getCommonGameTypeByType(type)
  const queryType = gameType?.type || String(type || 'COMMON').toUpperCase()

  return `/dev/common-game-player-test?gameType=${encodeURIComponent(queryType)}`
}

export const createCommonGameAdminUrl = (type = 'COMMON') => {
  const gameType = getCommonGameTypeByType(type)
  const queryType = gameType?.type || String(type || 'COMMON').toUpperCase()

  return `/admin/common-game-editor?gameType=${encodeURIComponent(queryType)}`
}

export const createCommonGameFormalSafeNote = (type = 'COMMON') => {
  const gameType = getCommonGameTypeByType(type)

  return {
    type: gameType?.type || String(type || 'COMMON').toUpperCase(),
    title: '正式頁安全提醒',
    message:
      '目前共用模組仍先在測試入口與後台中控台驗證。正式頁接入前，需要另外做 router、fallback、legacy、API、DB 與權限檢查。',
    safeRules: getCommonGameSafeRules()
  }
}

export const COMMON_GAME_MODULE_NEXT_STEPS = [
  {
    batch: 'V2.3 第 354 批',
    title: '共用 PlayBoard 顯示元件落地版',
    target: '建立 src/components/common-game/CommonGamePlayBoard.vue',
    risk: 'medium',
    note: '開始讓前台測試入口可以使用真正的共用 PlayBoard。'
  },
  {
    batch: 'V2.3 第 355 批',
    title: '後台共用模板設定表單落地版',
    target: '建立或整理後台共用設定表單',
    risk: 'medium',
    note: '讓後台可以用欄位分類管理不同遊戲模板。'
  },
  {
    batch: 'V2.3 第 356 批',
    title: '前台測試入口套用共用 PlayBoard 版',
    target: 'CommonGamePlayerTestView.vue',
    risk: 'medium',
    note: '讓測試入口真正渲染共用 PlayBoard，而不是只看狀態卡。'
  },
  {
    batch: 'V2.3 第 357 批',
    title: '精緻九宮格接入共用模組測試版',
    target: 'PremiumGridLotteryView / PremiumGridPlayBoard',
    risk: 'high',
    note: '開始接單一遊戲，需保留正式頁 fallback。'
  }
]

export const getCommonGameModuleNextSteps = () => {
  return [...COMMON_GAME_MODULE_NEXT_STEPS]
}

export default {
  COMMON_GAME_MODULE_VERSION,
  COMMON_GAME_MODULE_BATCH,
  COMMON_GAME_BATCH_STRATEGY,
  COMMON_GAME_SAFE_RULES,
  COMMON_GAME_TYPES,
  COMMON_GAME_TEMPLATE_STATUS,
  COMMON_GAME_FIELD_GROUPS,
  COMMON_GAME_DEFAULT_THEME,
  COMMON_GAME_DEFAULT_PLAYBOARD,
  COMMON_GAME_DEFAULT_ADMIN,
  COMMON_GAME_DEFAULT_FRONT,
  COMMON_GAME_DEFAULT_TEMPLATE,
  COMMON_GAME_MODULE_NEXT_STEPS,
  getCommonGameTypeList,
  getCommonGameTypeOptions,
  getCommonGameStatusOptions,
  getCommonGameFieldGroupList,
  getCommonGameSafeRules,
  getCommonGameBatchStrategy,
  getCommonGameModuleSummary,
  getCommonGameTypeByType,
  isCommonGameTypeActive,
  isCommonGameTypePlanned,
  createCommonGameTemplateId,
  createDefaultCommonGameTemplate,
  normalizeCommonGameTemplate,
  validateCommonGameTemplate,
  buildCommonGameAdminSummaryCards,
  buildCommonGameFrontSummaryCards,
  createCommonGameTestUrl,
  createCommonGameAdminUrl,
  createCommonGameFormalSafeNote,
  getCommonGameModuleNextSteps
}
