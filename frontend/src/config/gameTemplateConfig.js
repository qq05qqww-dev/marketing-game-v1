/**
 * Multi Game Platform V2.3 第 345 批：公用模板完整整合前後台穩定備份版
 *
 * 檔案位置：
 * frontend/src/config/gameTemplateConfig.js
 *
 * 本批目的：
 * 1. 延續第 338 批：gameTemplateConfig.js 已建立 150～200 項同步完成穩定備份前後台總對齊版。
 * 2. 延續第 339 批：後台公用設定頁已讀取 150～200 項同步完成穩定備份前後台總對齊版。
 * 3. 延續第 340 批：前台測試入口已讀取 150～200 項同步完成穩定備份前後台總對齊版。
 * 4. 本批建立「150～200 項同步完成穩定備份前後台總對齊完成版」。
 * 5. 穩定整理 / 規格 / 總覽 / 流程 / 狀態 / 檢查清單可用 150～200 項。
 * 6. 核心邏輯 / router / 正式頁 / API / DB 仍需分批保守處理。
 * 7. 有錯誤時先小批修錯 1～5 項。
 *
 * 本批安全原則：
 * - 不修改 router/index.js
 * - 不修改 WheelGameView.vue
 * - 不修改 PremiumGridLotteryView.vue
 * - 不修改 CommonGamePlayerView.vue
 * - 不取代正式頁
 * - 只補公用模板設定檔
 */

export const GAME_TEMPLATE_VERSION = 'Multi Game Platform V2.3 第 345 批：公用模板完整整合前後台穩定備份版'

export const COMMON_FRONT_PLAYER_SECTIONS = [
  {
    key: 'hero',
    label: '活動主視覺',
    description: '顯示活動名稱、副標、狀態與主要說明。'
  },
  {
    key: 'chanceCard',
    label: '遊玩次數',
    description: '顯示玩家剩餘次數、分享狀態與快速操作。'
  },
  {
    key: 'playBoard',
    label: '玩法區',
    description: '依照 gameType 顯示不同 PlayBoard。'
  },
  {
    key: 'prizeShowcase',
    label: '獎品展示',
    description: '共用獎品列表與庫存展示。'
  },
  {
    key: 'rulesPanel',
    label: '活動規則',
    description: '共用活動規則與注意事項。'
  },
  {
    key: 'claimInfo',
    label: '領獎資訊',
    description: '共用領獎說明、客服資訊與提醒。'
  },
  {
    key: 'drawLogs',
    label: '抽獎紀錄',
    description: '共用玩家抽獎紀錄與最新結果。'
  },
  {
    key: 'resultModal',
    label: '結果彈窗',
    description: '共用中獎 / 未中獎結果彈窗。'
  }
]

export const COMMON_ADMIN_SETTING_SECTIONS = [
  {
    key: 'basic',
    label: '基本設定',
    description: '活動名稱、副標、說明、狀態、品牌與活動期間。'
  },
  {
    key: 'chance',
    label: '遊玩次數',
    description: '預設次數、每日限制、登入限制與分享加次數。'
  },
  {
    key: 'prizes',
    label: '獎品設定',
    description: '獎品名稱、圖示、數量、剩餘數量、機率與啟用狀態。'
  },
  {
    key: 'rules',
    label: '活動規則',
    description: '前台顯示的規則文字與注意事項。'
  },
  {
    key: 'claim',
    label: '領獎設定',
    description: '領獎說明、客服資訊與中獎後提示。'
  },
  {
    key: 'style',
    label: '樣式設定',
    description: '主題名稱、主色、背景、按鈕文字與卡片風格。'
  },
  {
    key: 'share',
    label: '分享設定',
    description: '分享標題、描述、圖片與分享加次數設定。'
  },
  {
    key: 'records',
    label: '紀錄管理',
    description: '玩家數、抽獎數、中獎數與最後更新時間。'
  },
  {
    key: 'reports',
    label: '報表設定',
    description: '匯出、日期範圍與報表備註。'
  },
  {
    key: 'preview',
    label: '前台預覽',
    description: '用 CommonGamePlayerView 預覽目前設定。'
  }
]

export const DEFAULT_COMMON_GAME_PLAYER_LAYOUT = {
  maxWidth: '1180px',
  showHero: true,
  showChanceCard: true,
  showPlayBoard: true,
  showPrizeShowcase: true,
  showRulesPanel: true,
  showClaimInfo: true,
  showDrawLogs: true,
  showResultModal: true
}

export const COMMON_GAME_CREATE_FLOW = [
  {
    step: 1,
    key: 'choose-template',
    title: '選擇遊戲模板',
    description: '先選 premium-grid、egg-smash、wheel，或後續新增的遊戲模板。'
  },
  {
    step: 2,
    key: 'create-playboard',
    title: '建立 PlayBoard',
    description: '每個新遊戲只新增自己的 PlayBoard，負責玩法畫面與 @draw。'
  },
  {
    step: 3,
    key: 'register-config',
    title: '登記 gameTemplateConfig',
    description: '把新遊戲 type、label、icon、PlayBoard、共用區塊登記進設定檔。'
  },
  {
    step: 4,
    key: 'connect-front-common',
    title: '接入 CommonGamePlayerView',
    description: '前台活動資訊、獎品、規則、領獎、紀錄、結果彈窗都走公用流程。'
  },
  {
    step: 5,
    key: 'connect-admin-common',
    title: '接入 AdminCommonGameEditorView',
    description: '後台基本設定、獎品、機率、樣式、紀錄、報表與即時預覽都走公用流程。'
  },
  {
    step: 6,
    key: 'add-specific-settings',
    title: '補遊戲專屬設定',
    description: '只補該遊戲獨有的設定，例如輪盤速度、金蛋數量、刮刮卡面積。'
  },
  {
    step: 7,
    key: 'test-and-stabilize',
    title: '測試與穩定備份',
    description: '確認前台測試入口、後台預覽與正式頁互不影響，再建立穩定批次。'
  }
]

export const GAME_TEMPLATE_TYPES = [
  {
    type: 'premium-grid',
    label: '精緻九宮格',
    icon: '🎯',
    status: 'active',
    playBoardComponent: 'PremiumGridPlayBoard',
    routeMode: 'common-player',
    description: '九宮格抽獎玩法，使用公用玩家頁與 PremiumGridPlayBoard。',
    commonFrontSections: [
      'hero',
      'chanceCard',
      'playBoard',
      'prizeShowcase',
      'rulesPanel',
      'claimInfo',
      'drawLogs',
      'resultModal'
    ],
    commonAdminSections: [
      'basic',
      'chance',
      'prizes',
      'rules',
      'claim',
      'style',
      'share',
      'records',
      'reports',
      'preview'
    ],
    specificSettings: [
      {
        key: 'gridSize',
        label: '九宮格格數',
        type: 'number',
        defaultValue: 9,
        description: '目前固定 9 格。'
      },
      {
        key: 'centerButtonText',
        label: '中心按鈕文字',
        type: 'text',
        defaultValue: '立即抽獎',
        description: '九宮格中心格顯示的操作文字。'
      },
      {
        key: 'lightSpeed',
        label: '跑燈速度',
        type: 'number',
        defaultValue: 70,
        description: '九宮格跑燈動畫速度。'
      }
    ]
  },
  {
    type: 'egg-smash',
    label: '砸金蛋',
    icon: '🥚',
    status: 'active',
    playBoardComponent: 'EggSmashPlayBoard',
    routeMode: 'common-player',
    description: '砸金蛋抽獎玩法，使用公用玩家頁與 EggSmashPlayBoard。',
    commonFrontSections: [
      'hero',
      'chanceCard',
      'playBoard',
      'prizeShowcase',
      'rulesPanel',
      'claimInfo',
      'drawLogs',
      'resultModal'
    ],
    commonAdminSections: [
      'basic',
      'chance',
      'prizes',
      'rules',
      'claim',
      'style',
      'share',
      'records',
      'reports',
      'preview'
    ],
    specificSettings: [
      {
        key: 'eggCount',
        label: '金蛋數量',
        type: 'number',
        defaultValue: 9,
        description: '前台顯示的金蛋數量。'
      },
      {
        key: 'hammerEnabled',
        label: '錘子動畫',
        type: 'boolean',
        defaultValue: true,
        description: '是否啟用砸蛋錘子動畫。'
      },
      {
        key: 'brokenEggEffect',
        label: '破蛋特效',
        type: 'select',
        defaultValue: 'gold-particles',
        options: [
          {
            value: 'gold-particles',
            label: '金粉粒子'
          },
          {
            value: 'shine-burst',
            label: '閃光爆發'
          },
          {
            value: 'confetti-pop',
            label: '彩帶彈出'
          },
          {
            value: 'simple-crack',
            label: '簡易裂蛋'
          }
        ],
        description: '金蛋破掉後的視覺效果。'
      },
      {
        key: 'buttonText',
        label: '砸蛋按鈕文字',
        type: 'text',
        defaultValue: '立即砸蛋',
        description: '砸金蛋玩法區的主要操作按鈕文字。'
      }
    ]
  },
  {
    type: 'wheel',
    label: '幸運輪盤',
    icon: '🎡',
    status: 'active',
    playBoardComponent: 'WheelPlayBoard',
    routeMode: 'common-player',
    description: '幸運輪盤抽獎玩法，使用公用玩家頁與 WheelPlayBoard。正式 WheelGameView.vue 不受影響。',
    commonFrontSections: [
      'hero',
      'chanceCard',
      'playBoard',
      'prizeShowcase',
      'rulesPanel',
      'claimInfo',
      'drawLogs',
      'resultModal'
    ],
    commonAdminSections: [
      'basic',
      'chance',
      'prizes',
      'rules',
      'claim',
      'style',
      'share',
      'records',
      'reports',
      'preview'
    ],
    specificSettings: [
      {
        key: 'buttonText',
        label: '輪盤按鈕文字',
        type: 'text',
        defaultValue: '立即轉動',
        description: '幸運輪盤玩法區的主要操作按鈕文字。'
      },
      {
        key: 'spinDuration',
        label: '旋轉秒數 ms',
        type: 'number',
        defaultValue: 2800,
        description: '輪盤旋轉動畫時間，單位毫秒。'
      },
      {
        key: 'wheelTheme',
        label: '輪盤主題',
        type: 'select',
        defaultValue: 'gold-stage',
        options: [
          {
            value: 'gold-stage',
            label: '金色舞台'
          },
          {
            value: 'festival-red',
            label: '節慶紅金'
          },
          {
            value: 'premium-dark',
            label: '高級深色'
          }
        ],
        description: '輪盤視覺主題。'
      },
      {
        key: 'pointerStyle',
        label: '指針樣式',
        type: 'select',
        defaultValue: 'red-pointer',
        options: [
          {
            value: 'red-pointer',
            label: '紅色指針'
          },
          {
            value: 'gold-pointer',
            label: '金色指針'
          },
          {
            value: 'neon-pointer',
            label: '霓虹指針'
          }
        ],
        description: '輪盤指針外觀。'
      }
    ]
  },
  {
    type: 'scratch-card',
    label: '刮刮卡',
    icon: '🎫',
    status: 'planned',
    playBoardComponent: 'ScratchCardPlayBoard',
    routeMode: 'common-player',
    description: '刮刮卡玩法規劃中，後續可套用公用玩家頁與公用後台。',
    commonFrontSections: [
      'hero',
      'chanceCard',
      'playBoard',
      'prizeShowcase',
      'rulesPanel',
      'claimInfo',
      'drawLogs',
      'resultModal'
    ],
    commonAdminSections: [
      'basic',
      'chance',
      'prizes',
      'rules',
      'claim',
      'style',
      'share',
      'records',
      'reports',
      'preview'
    ],
    specificSettings: [
      {
        key: 'scratchAreaSize',
        label: '刮刮區大小',
        type: 'select',
        defaultValue: 'medium',
        options: [
          {
            value: 'small',
            label: '小'
          },
          {
            value: 'medium',
            label: '中'
          },
          {
            value: 'large',
            label: '大'
          }
        ],
        description: '刮刮卡可刮區域大小。'
      }
    ]
  },
  {
    type: 'flip-card',
    label: '翻牌遊戲',
    icon: '🃏',
    status: 'planned',
    playBoardComponent: 'FlipCardPlayBoard',
    routeMode: 'common-player',
    description: '翻牌玩法規劃中，後續可套用公用玩家頁與公用後台。',
    commonFrontSections: [
      'hero',
      'chanceCard',
      'playBoard',
      'prizeShowcase',
      'rulesPanel',
      'claimInfo',
      'drawLogs',
      'resultModal'
    ],
    commonAdminSections: [
      'basic',
      'chance',
      'prizes',
      'rules',
      'claim',
      'style',
      'share',
      'records',
      'reports',
      'preview'
    ],
    specificSettings: [
      {
        key: 'cardCount',
        label: '卡牌數量',
        type: 'number',
        defaultValue: 9,
        description: '前台顯示的卡牌數量。'
      }
    ]
  },
  {
    type: 'slot-machine',
    label: '拉霸機',
    icon: '🎰',
    status: 'planned',
    playBoardComponent: 'SlotMachinePlayBoard',
    routeMode: 'common-player',
    description: '拉霸機玩法規劃中，後續可套用公用玩家頁與公用後台。',
    commonFrontSections: [
      'hero',
      'chanceCard',
      'playBoard',
      'prizeShowcase',
      'rulesPanel',
      'claimInfo',
      'drawLogs',
      'resultModal'
    ],
    commonAdminSections: [
      'basic',
      'chance',
      'prizes',
      'rules',
      'claim',
      'style',
      'share',
      'records',
      'reports',
      'preview'
    ],
    specificSettings: [
      {
        key: 'reelCount',
        label: '滾輪數量',
        type: 'number',
        defaultValue: 3,
        description: '拉霸機滾輪數量。'
      }
    ]
  }
]

export const getGameTemplateByType = (type) => {
  return GAME_TEMPLATE_TYPES.find((template) => template.type === type) || GAME_TEMPLATE_TYPES[0]
}

export const getActiveGameTemplates = () => {
  return GAME_TEMPLATE_TYPES.filter((template) => template.status === 'active')
}

export const getPlannedGameTemplates = () => {
  return GAME_TEMPLATE_TYPES.filter((template) => template.status === 'planned')
}

export const isGameTemplateActive = (type) => {
  const template = getGameTemplateByType(type)

  return template?.status === 'active'
}

export const getPlayBoardComponentName = (type) => {
  const template = getGameTemplateByType(type)

  return template?.playBoardComponent || ''
}

export const getGameSpecificSettings = (type) => {
  const template = getGameTemplateByType(type)

  return template?.specificSettings || []
}

export const COMMON_TEMPLATE_BULK_150_200_MODE = {
  batch: 'V2.3 第 345 批',
  title: '公用模板完整整合前後台穩定備份版',
  stableMode: '穩定整理狀態可一次整理 150～200 項',
  mediumRiskMode: '中等風險改動建議一次 40～80 項',
  errorMode: '有錯誤、編譯失敗、畫面異常時，先小批修錯 1～5 項',
  reason: '目前公用模板、前台測試入口、後台設定頁已多次同步且使用者確認沒有明顯問題，為避免進度過慢，升級為超大批次整理。',
  recommendedBatchSize: {
    stableMin: 150,
    stableMax: 200,
    mediumRiskMin: 40,
    mediumRiskMax: 80,
    fixMin: 1,
    fixMax: 5
  },
  allowedLargeBatchScopes: [
    '規格整理',
    '總覽整理',
    '狀態面板',
    '流程說明',
    '檢查清單',
    '模板清單',
    '文案標籤',
    '安全提示',
    '新對話提示',
    'TXT 下載內容',
    '公用設定摘要',
    '前台測試入口總覽',
    '後台總覽面板',
    '新遊戲生成器規劃',
    'PlayBoard 規格對照',
    'active / planned 模板對照',
    '批次基準同步',
    '非正式頁 UI 整理'
  ],
  riskyBatchScopes: [
    'router/index.js',
    '正式 WheelGameView.vue',
    '正式 PremiumGridLotteryView.vue',
    '正式 API 串接',
    '資料庫 schema',
    'Prisma migration',
    '登入權限',
    '正式 tenant 權限',
    '抽獎核心機率',
    '正式前台路由切換'
  ],
  superBatchGroups: [
    {
      key: 'template-config',
      label: '模板設定檔與基準',
      targetCount: 25,
      items: [
        '總穩定基準',
        '前台基準',
        '後台基準',
        '測試入口基準',
        'active 模板',
        'planned 模板',
        'PlayBoard 對照',
        '批次策略',
        '安全策略',
        '下一步批次',
        '版本字串',
        'helper function',
        '同步狀態',
        '前後台狀態',
        '大批次策略',
        '錯誤修正策略',
        '中風險策略',
        '正式頁保護',
        'TXT 交付偏好',
        '新對話提示偏好',
        '模板新增流程',
        'planned 轉 active 流程',
        'legacy fallback',
        '正式 URL 安全',
        '穩定備份註記'
      ]
    },
    {
      key: 'front-common-player',
      label: '前台公用玩家頁',
      targetCount: 30,
      items: [
        '活動主標題',
        '活動副標題',
        '品牌資訊',
        '狀態標籤',
        '剩餘次數',
        '玩法區容器',
        'PlayBoard 注入',
        '獎品列表',
        '獎品卡片',
        '規則列表',
        '領獎說明',
        '聯絡資訊',
        '結果彈窗',
        '中獎狀態',
        '未中獎狀態',
        '抽獎紀錄',
        '紀錄空狀態',
        '活動時間',
        '安全提示',
        '模板來源狀態',
        'gameType 顯示',
        'PlayBoard 顯示',
        'active 狀態',
        'planned 說明',
        '事件 log',
        '錯誤提示',
        '載入狀態',
        '手機版排列',
        '桌機版排列',
        '正式頁隔離'
      ]
    },
    {
      key: 'admin-common-editor',
      label: '後台公用設定頁',
      targetCount: 35,
      items: [
        '基本設定',
        '品牌設定',
        '活動狀態',
        '活動時間',
        '次數設定',
        '序號設定',
        '獎品設定',
        '規則設定',
        '領獎設定',
        '樣式設定',
        '分享設定',
        '安全設定',
        '預覽切換',
        'active 預覽',
        'planned 生成器',
        '生成流程',
        'TXT 下載',
        '複製提示',
        '新對話提示',
        '批次狀態',
        '總穩定基準',
        '前台基準',
        '後台基準',
        '測試入口基準',
        '40～50 模式',
        '150～200 模式',
        '錯誤修正模式',
        '正式頁安全',
        'router 安全',
        'PlayBoard 對照',
        '事件紀錄',
        '狀態卡片',
        '風險提示',
        '下階段目標',
        '穩定備份'
      ]
    },
    {
      key: 'front-test-entry',
      label: '前台測試入口',
      targetCount: 30,
      items: [
        '遊戲切換',
        'active 模板卡',
        'planned 模板卡',
        '總基準卡',
        '前台基準卡',
        '後台基準卡',
        '測試入口基準卡',
        '批次策略卡',
        '40～50 模式卡',
        '150～200 模式卡',
        '錯誤模式卡',
        '中風險模式卡',
        '快速連結',
        '正式頁連結',
        '測試頁連結',
        '後台頁連結',
        '新對話提示',
        '複製提示',
        '下載提示 TXT',
        '事件紀錄',
        '玩法區預覽',
        'PlayBoard 名稱',
        '模板來源',
        '安全提示',
        '正式頁隔離',
        '路由不動提示',
        '新增遊戲流程',
        '生成器流程',
        '下一批提示',
        '穩定備份提示'
      ]
    },
    {
      key: 'new-game-generator',
      label: '新遊戲生成器與規劃',
      targetCount: 30,
      items: [
        'planned 模板讀取',
        'gameType 命名',
        'label 命名',
        'icon 設定',
        'PlayBoard 命名',
        '檔案路徑',
        '前台接入',
        '後台接入',
        '測試入口接入',
        'active 切換',
        'planned 狀態',
        '生成摘要',
        'TXT 摘要',
        '複製摘要',
        '下載摘要',
        '新增 ScratchCard',
        '新增 FlipCard',
        '新增 SlotMachine',
        '新增 future game',
        '共用結果流程',
        '共用獎品流程',
        '共用規則流程',
        '共用領獎流程',
        '共用紀錄流程',
        '專屬設定插槽',
        '專屬動畫插槽',
        '測試流程',
        '驗收流程',
        '穩定備份',
        '回退策略'
      ]
    },
    {
      key: 'safety-and-release',
      label: '安全與正式頁保護',
      targetCount: 30,
      items: [
        '不動 router',
        '不動正式 WheelGameView',
        '不動正式 PremiumGridLotteryView',
        '不動正式 API',
        '不動資料庫 schema',
        '不動 Prisma migration',
        '不動登入權限',
        '不動 tenant 權限',
        '不動正式活動資料',
        '不動正式抽獎機率',
        '不動正式領獎流程',
        '不動正式序號驗證',
        '不動正式報表',
        '不動正式會員',
        '不動正式部署設定',
        '保留 legacy fallback',
        '保留正式 URL 安全',
        '保留測試 URL',
        '保留 TXT 交付',
        '保留可回退基準',
        '錯誤先修小批',
        '編譯錯誤優先',
        '畫面異常優先',
        '重複宣告檢查',
        'import 檢查',
        'helper export 檢查',
        '瀏覽器 console 檢查',
        'Vite overlay 檢查',
        '新對話基準提示',
        '下一批安全說明'
      ]
    },
    {
      key: 'documentation-and-handoff',
      label: '文件與交接提示',
      targetCount: 20,
      items: [
        '目前批次',
        '上一個穩定批次',
        '下一個批次',
        '檔案覆蓋路徑',
        '測試網址',
        '正常回覆格式',
        '錯誤回報格式',
        '新對話提示',
        'TXT 檔命名',
        '批次摘要',
        '功能清單',
        '安全清單',
        '風險清單',
        '回退清單',
        '開發方向',
        '新增遊戲方向',
        '公用模板方向',
        '正式頁保護方向',
        '大批次策略',
        '小批修錯策略'
      ]
    }
  ]
}

export const COMMON_TEMPLATE_BULK_40_50_MODE = {
  batch: 'V2.3 第 345 批',
  title: '公用模板完整整合前後台穩定備份版',
  stableMode: '每批建議一次整理 40～50 項',
  errorMode: '遇到錯誤、編譯失敗、畫面異常時，先小批修錯',
  reason: '目前公用模板流程已多次前後台同步，若沒有明顯錯誤，繼續小批次會太慢。',
  recommendedBatchSize: {
    stableMin: 40,
    stableMax: 50,
    fixMin: 1,
    fixMax: 5
  },
  nextBatch: 'V2.3 第 342 批',
  checklistGroups: [
    {
      key: 'template-config',
      label: '模板設定檔',
      targetCount: 6,
      items: [
        '總穩定基準',
        'active 模板',
        'planned 模板',
        'PlayBoard 對應',
        '批次策略',
        '下一步批次'
      ]
    },
    {
      key: 'front-common',
      label: '前台公用玩家頁',
      targetCount: 8,
      items: [
        '活動主視覺',
        '次數卡片',
        '玩法區',
        '獎品展示',
        '規則面板',
        '領獎資訊',
        '抽獎紀錄',
        '結果彈窗'
      ]
    },
    {
      key: 'admin-common',
      label: '後台公用設定頁',
      targetCount: 10,
      items: [
        '基本設定',
        '次數設定',
        '獎品設定',
        '規則設定',
        '領獎設定',
        '樣式設定',
        '分享設定',
        '紀錄管理',
        '報表設定',
        '前台預覽'
      ]
    },
    {
      key: 'test-entry',
      label: '前台測試入口',
      targetCount: 8,
      items: [
        '遊戲切換',
        'active 顯示',
        'planned 顯示',
        '總基準顯示',
        '新對話提示',
        '快速連結',
        '事件紀錄',
        '安全提示'
      ]
    },
    {
      key: 'generator',
      label: '新遊戲生成器',
      targetCount: 8,
      items: [
        'planned 模板讀取',
        'PlayBoard 命名',
        '路徑規劃',
        '前台接入步驟',
        '後台接入步驟',
        '專屬設定',
        '測試流程',
        '穩定備份'
      ]
    },
    {
      key: 'safety',
      label: '正式頁安全',
      targetCount: 10,
      items: [
        '不動 router',
        '不動正式 WheelGameView',
        '不動正式 PremiumGridLotteryView',
        '不動正式路由',
        '不動正式 API',
        '不動正式資料庫',
        '不動登入權限',
        '不動正式 tenant',
        '保留 legacy fallback',
        '保留 TXT 下載'
      ]
    }
  ]
}

export const COMMON_TEMPLATE_STABLE_CHECKPOINT = {
  batch: 'V2.3 第 345 批',
  title: '公用模板完整整合前後台穩定備份版',
  previousStableBatch: 'V2.3 第 341-1 批：補齊總對齊完成 export 修正版',
  frontStableBatch: 'V2.3 第 253 批：前台公用玩家頁模板狀態穩定備份版',
  adminStableBatch: 'V2.3 第 260 批：後台提示同步修正穩定備份版',
  frontTestStableBatch: 'V2.3 第 344 批：前台測試入口完整整合版',
  backendEditorSyncBatch: 'V2.3 第 339 批：後台讀取 150～200 項同步完成穩定備份前後台總對齊版',
  configFile: 'gameTemplateConfig.js',
  frontCommonView: 'CommonGamePlayerView.vue',
  adminCommonView: 'AdminCommonGameEditorView.vue',
  testEntryView: 'CommonGamePlayerTestView.vue',
  activeTemplates: [
    'premium-grid',
    'egg-smash',
    'wheel'
  ],
  plannedTemplates: [
    'scratch-card',
    'flip-card',
    'slot-machine'
  ],
  activePlayBoards: [
    'PremiumGridPlayBoard',
    'EggSmashPlayBoard',
    'WheelPlayBoard'
  ],
  plannedPlayBoards: [
    'ScratchCardPlayBoard',
    'FlipCardPlayBoard',
    'SlotMachinePlayBoard'
  ],
  safeDirection: '新遊戲先以 planned 模板規劃，建立自己的 PlayBoard，再接入 CommonGamePlayerView 與 AdminCommonGameEditorView，確認正常後改為 active 測試。',
  nextBatch: 'V2.3 第 342 批',
  bulkBatchMode: '穩定整理狀態可一次整理 150～200 項；中風險改動 40～80 項；錯誤修正 1～5 項',
  frontBulkBatch: 'V2.3 第 302 批：前台測試入口讀取 40～50 項總穩定基準版',
  adminBulkBatch: 'V2.3 第 301 批：後台讀取 40～50 項總穩定基準版',
  note: '此批已同步第 339 批後台與第 340 批前台測試入口，正式建立 150～200 項同步完成穩定備份前後台總對齊完成版。適用於穩定整理、規格、總覽、流程、狀態與檢查清單；核心邏輯、router、正式頁、API、DB 仍採保守分批；錯誤狀態先小批修錯。正式 WheelGameView.vue、正式 PremiumGridLotteryView.vue 與正式路由不受影響。'
}

export const getCommonTemplateStableSummary = () => {
  return {
    ...COMMON_TEMPLATE_STABLE_CHECKPOINT,
    activeTemplates: getActiveGameTemplates().map((template) => ({
      type: template.type,
      label: template.label,
      icon: template.icon,
      playBoardComponent: template.playBoardComponent,
      status: template.status
    })),
    plannedTemplates: getPlannedGameTemplates().map((template) => ({
      type: template.type,
      label: template.label,
      icon: template.icon,
      playBoardComponent: template.playBoardComponent,
      status: template.status
    }))
  }
}

export const getNextGameCreateDirection = () => {
  return [
    '1. 先在 gameTemplateConfig.js 建立 planned 模板。',
    '2. 建立該遊戲自己的 PlayBoard.vue。',
    '3. 讓 CommonGamePlayerView 可依 playBoardComponent 顯示玩法區。',
    '4. 讓 CommonGamePlayerTestView 可由 active 模板切換測試。',
    '5. 讓 AdminCommonGameEditorView 可預覽與設定。',
    '6. 測試正常後，再將模板狀態從 planned 改成 active。'
  ]
}

export const getCommonTemplateFrontendBackendSyncCheckpoint = () => {
  return {
    batch: COMMON_TEMPLATE_STABLE_CHECKPOINT.batch,
    title: COMMON_TEMPLATE_STABLE_CHECKPOINT.title,
    configFile: COMMON_TEMPLATE_STABLE_CHECKPOINT.configFile,
    frontCommonView: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontCommonView,
    frontStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontStableBatch,
    frontTestStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontTestStableBatch,
    adminCommonView: COMMON_TEMPLATE_STABLE_CHECKPOINT.adminCommonView,
    adminStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.adminStableBatch,
    backendEditorSyncBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.backendEditorSyncBatch,
    nextBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.nextBatch,
    activeTemplates: getActiveGameTemplates().map((template) => template.type),
    plannedTemplates: getPlannedGameTemplates().map((template) => template.type),
    note: COMMON_TEMPLATE_STABLE_CHECKPOINT.note
  }
}

export const getCommonTemplateTotalSyncStableCheckpoint = () => {
  return {
    batch: COMMON_TEMPLATE_STABLE_CHECKPOINT.batch,
    title: COMMON_TEMPLATE_STABLE_CHECKPOINT.title,
    previousStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.previousStableBatch,
    configFile: COMMON_TEMPLATE_STABLE_CHECKPOINT.configFile,
    frontCommonView: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontCommonView,
    frontStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontStableBatch,
    frontTestStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontTestStableBatch,
    adminCommonView: COMMON_TEMPLATE_STABLE_CHECKPOINT.adminCommonView,
    adminStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.adminStableBatch,
    backendEditorSyncBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.backendEditorSyncBatch,
    nextBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.nextBatch,
    activeTemplates: COMMON_TEMPLATE_STABLE_CHECKPOINT.activeTemplates,
    plannedTemplates: COMMON_TEMPLATE_STABLE_CHECKPOINT.plannedTemplates,
    note: COMMON_TEMPLATE_STABLE_CHECKPOINT.note
  }
}

export const getCommonTemplateBulkBatchModeCheckpoint = () => {
  return {
    batch: COMMON_TEMPLATE_STABLE_CHECKPOINT.batch,
    title: COMMON_TEMPLATE_STABLE_CHECKPOINT.title,
    bulkBatchMode: COMMON_TEMPLATE_STABLE_CHECKPOINT.bulkBatchMode,
    frontBulkBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontBulkBatch,
    adminBulkBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.adminBulkBatch,
    nextBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.nextBatch,
    activeTemplates: COMMON_TEMPLATE_STABLE_CHECKPOINT.activeTemplates,
    plannedTemplates: COMMON_TEMPLATE_STABLE_CHECKPOINT.plannedTemplates,
    note: COMMON_TEMPLATE_STABLE_CHECKPOINT.note
  }
}

export const getCommonTemplateBulk4050Mode = () => {
  return {
    ...COMMON_TEMPLATE_BULK_40_50_MODE,
    stableCheckpoint: COMMON_TEMPLATE_STABLE_CHECKPOINT,
    totalTargetCount: COMMON_TEMPLATE_BULK_40_50_MODE.checklistGroups.reduce((sum, group) => {
      return sum + Number(group.targetCount || 0)
    }, 0)
  }
}

export const getCommonTemplateBulk4050StableCheckpoint = () => {
  return {
    batch: COMMON_TEMPLATE_STABLE_CHECKPOINT.batch,
    title: COMMON_TEMPLATE_STABLE_CHECKPOINT.title,
    previousStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.previousStableBatch,
    frontCommonView: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontCommonView,
    frontStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontStableBatch,
    frontBulkBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontBulkBatch,
    adminCommonView: COMMON_TEMPLATE_STABLE_CHECKPOINT.adminCommonView,
    adminBulkBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.adminBulkBatch,
    configFile: COMMON_TEMPLATE_STABLE_CHECKPOINT.configFile,
    bulkBatchMode: COMMON_TEMPLATE_STABLE_CHECKPOINT.bulkBatchMode,
    nextBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.nextBatch,
    activeTemplates: COMMON_TEMPLATE_STABLE_CHECKPOINT.activeTemplates,
    plannedTemplates: COMMON_TEMPLATE_STABLE_CHECKPOINT.plannedTemplates,
    note: COMMON_TEMPLATE_STABLE_CHECKPOINT.note,
    mode: COMMON_TEMPLATE_BULK_40_50_MODE
  }
}

export const getCommonTemplateBulk4050SyncedStableCheckpoint = () => {
  return {
    batch: COMMON_TEMPLATE_STABLE_CHECKPOINT.batch,
    title: COMMON_TEMPLATE_STABLE_CHECKPOINT.title,
    previousStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.previousStableBatch,
    configFile: COMMON_TEMPLATE_STABLE_CHECKPOINT.configFile,
    frontCommonView: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontCommonView,
    frontStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontStableBatch,
    frontBulkBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontBulkBatch,
    adminCommonView: COMMON_TEMPLATE_STABLE_CHECKPOINT.adminCommonView,
    adminBulkBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.adminBulkBatch,
    bulkBatchMode: COMMON_TEMPLATE_STABLE_CHECKPOINT.bulkBatchMode,
    nextBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.nextBatch,
    activeTemplates: COMMON_TEMPLATE_STABLE_CHECKPOINT.activeTemplates,
    plannedTemplates: COMMON_TEMPLATE_STABLE_CHECKPOINT.plannedTemplates,
    syncedStatus: 'gameTemplateConfig 第 303 批、後台第 301 批、前台測試入口第 302 批已對齊。',
    stableMode: COMMON_TEMPLATE_BULK_40_50_MODE.stableMode,
    errorMode: COMMON_TEMPLATE_BULK_40_50_MODE.errorMode,
    totalTargetCount: COMMON_TEMPLATE_BULK_40_50_MODE.checklistGroups.reduce((sum, group) => {
      return sum + Number(group.targetCount || 0)
    }, 0),
    note: COMMON_TEMPLATE_STABLE_CHECKPOINT.note
  }
}

export const getCommonTemplateBulk150200Mode = () => {
  return {
    ...COMMON_TEMPLATE_BULK_150_200_MODE,
    stableCheckpoint: COMMON_TEMPLATE_STABLE_CHECKPOINT,
    totalTargetCount: COMMON_TEMPLATE_BULK_150_200_MODE.superBatchGroups.reduce((sum, group) => {
      return sum + Number(group.targetCount || 0)
    }, 0)
  }
}

export const getCommonTemplateBulk150200SyncedStableCheckpoint = () => {
  return {
    batch: COMMON_TEMPLATE_STABLE_CHECKPOINT.batch,
    title: COMMON_TEMPLATE_STABLE_CHECKPOINT.title,
    previousStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.previousStableBatch,
    configFile: COMMON_TEMPLATE_STABLE_CHECKPOINT.configFile,
    frontCommonView: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontCommonView,
    frontStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontStableBatch,
    frontBulkBatch: 'V2.3 第 344 批：前台測試入口完整整合版',
    adminCommonView: COMMON_TEMPLATE_STABLE_CHECKPOINT.adminCommonView,
    adminBulkBatch: 'V2.3 第 339 批：後台讀取 150～200 項同步完成穩定備份前後台總對齊版',
    bulkBatchMode: COMMON_TEMPLATE_STABLE_CHECKPOINT.bulkBatchMode,
    nextBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.nextBatch,
    activeTemplates: COMMON_TEMPLATE_STABLE_CHECKPOINT.activeTemplates,
    plannedTemplates: COMMON_TEMPLATE_STABLE_CHECKPOINT.plannedTemplates,
    syncedStatus: 'gameTemplateConfig 第 329 批、後台第 327 批、前台測試入口第 328 批已對齊。',
    stableMode: COMMON_TEMPLATE_BULK_150_200_MODE.stableMode,
    mediumRiskMode: COMMON_TEMPLATE_BULK_150_200_MODE.mediumRiskMode,
    errorMode: COMMON_TEMPLATE_BULK_150_200_MODE.errorMode,
    totalTargetCount: COMMON_TEMPLATE_BULK_150_200_MODE.superBatchGroups.reduce((sum, group) => {
      return sum + Number(group.targetCount || 0)
    }, 0),
    note: COMMON_TEMPLATE_STABLE_CHECKPOINT.note,
    mode: COMMON_TEMPLATE_BULK_150_200_MODE
  }
}

export const getCommonTemplateBulk150200TotalStableCheckpoint = () => {
  return {
    batch: COMMON_TEMPLATE_STABLE_CHECKPOINT.batch,
    title: COMMON_TEMPLATE_STABLE_CHECKPOINT.title,
    previousStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.previousStableBatch,
    configFile: COMMON_TEMPLATE_STABLE_CHECKPOINT.configFile,
    frontCommonView: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontCommonView,
    frontStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontStableBatch,
    frontBulkBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontTestStableBatch,
    adminCommonView: COMMON_TEMPLATE_STABLE_CHECKPOINT.adminCommonView,
    adminBulkBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.backendEditorSyncBatch,
    bulkBatchMode: COMMON_TEMPLATE_STABLE_CHECKPOINT.bulkBatchMode,
    nextBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.nextBatch,
    activeTemplates: COMMON_TEMPLATE_STABLE_CHECKPOINT.activeTemplates,
    plannedTemplates: COMMON_TEMPLATE_STABLE_CHECKPOINT.plannedTemplates,
    syncedStatus: 'gameTemplateConfig 第 329 批、後台第 327 批、前台測試入口第 328 批已完成 150～200 項模式同步。',
    stableMode: COMMON_TEMPLATE_BULK_150_200_MODE.stableMode,
    mediumRiskMode: COMMON_TEMPLATE_BULK_150_200_MODE.mediumRiskMode,
    errorMode: COMMON_TEMPLATE_BULK_150_200_MODE.errorMode,
    totalTargetCount: COMMON_TEMPLATE_BULK_150_200_MODE.superBatchGroups.reduce((sum, group) => {
      return sum + Number(group.targetCount || 0)
    }, 0),
    note: COMMON_TEMPLATE_STABLE_CHECKPOINT.note,
    mode: COMMON_TEMPLATE_BULK_150_200_MODE
  }
}

export const getCommonTemplateBulk150200FinalSafeCheckpoint = () => {
  return {
    batch: COMMON_TEMPLATE_STABLE_CHECKPOINT.batch,
    title: COMMON_TEMPLATE_STABLE_CHECKPOINT.title,
    previousStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.previousStableBatch,
    configFile: COMMON_TEMPLATE_STABLE_CHECKPOINT.configFile,
    frontCommonView: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontCommonView,
    frontStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontStableBatch,
    frontBulkBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontTestStableBatch,
    adminCommonView: COMMON_TEMPLATE_STABLE_CHECKPOINT.adminCommonView,
    adminBulkBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.backendEditorSyncBatch,
    bulkBatchMode: COMMON_TEMPLATE_STABLE_CHECKPOINT.bulkBatchMode,
    nextBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.nextBatch,
    activeTemplates: COMMON_TEMPLATE_STABLE_CHECKPOINT.activeTemplates,
    plannedTemplates: COMMON_TEMPLATE_STABLE_CHECKPOINT.plannedTemplates,
    syncedStatus: 'gameTemplateConfig 第 329 批、後台第 327 批、前台測試入口第 328 批已完成 150～200 項模式最終安全同步。',
    stableMode: COMMON_TEMPLATE_BULK_150_200_MODE.stableMode,
    mediumRiskMode: COMMON_TEMPLATE_BULK_150_200_MODE.mediumRiskMode,
    errorMode: COMMON_TEMPLATE_BULK_150_200_MODE.errorMode,
    totalTargetCount: COMMON_TEMPLATE_BULK_150_200_MODE.superBatchGroups.reduce((sum, group) => {
      return sum + Number(group.targetCount || 0)
    }, 0),
    note: COMMON_TEMPLATE_STABLE_CHECKPOINT.note,
    mode: COMMON_TEMPLATE_BULK_150_200_MODE
  }
}

export const getCommonTemplateBulk150200CompletedCheckpoint = () => {
  return {
    batch: COMMON_TEMPLATE_STABLE_CHECKPOINT.batch,
    title: COMMON_TEMPLATE_STABLE_CHECKPOINT.title,
    previousStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.previousStableBatch,
    configFile: COMMON_TEMPLATE_STABLE_CHECKPOINT.configFile,
    frontCommonView: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontCommonView,
    frontStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontStableBatch,
    frontBulkBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontTestStableBatch,
    adminCommonView: COMMON_TEMPLATE_STABLE_CHECKPOINT.adminCommonView,
    adminBulkBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.backendEditorSyncBatch,
    bulkBatchMode: COMMON_TEMPLATE_STABLE_CHECKPOINT.bulkBatchMode,
    nextBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.nextBatch,
    activeTemplates: COMMON_TEMPLATE_STABLE_CHECKPOINT.activeTemplates,
    plannedTemplates: COMMON_TEMPLATE_STABLE_CHECKPOINT.plannedTemplates,
    syncedStatus: 'gameTemplateConfig 第 329 批、後台第 327 批、前台測試入口第 328 批已完成 150～200 項模式前後台完成備份。',
    stableMode: COMMON_TEMPLATE_BULK_150_200_MODE.stableMode,
    mediumRiskMode: COMMON_TEMPLATE_BULK_150_200_MODE.mediumRiskMode,
    errorMode: COMMON_TEMPLATE_BULK_150_200_MODE.errorMode,
    totalTargetCount: COMMON_TEMPLATE_BULK_150_200_MODE.superBatchGroups.reduce((sum, group) => {
      return sum + Number(group.targetCount || 0)
    }, 0),
    note: COMMON_TEMPLATE_STABLE_CHECKPOINT.note,
    mode: COMMON_TEMPLATE_BULK_150_200_MODE
  }
}

export const getCommonTemplateBulk150200TotalCompletedCheckpoint = () => {
  return {
    batch: COMMON_TEMPLATE_STABLE_CHECKPOINT.batch,
    title: COMMON_TEMPLATE_STABLE_CHECKPOINT.title,
    previousStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.previousStableBatch,
    configFile: COMMON_TEMPLATE_STABLE_CHECKPOINT.configFile,
    frontCommonView: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontCommonView,
    frontStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontStableBatch,
    frontBulkBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontTestStableBatch,
    adminCommonView: COMMON_TEMPLATE_STABLE_CHECKPOINT.adminCommonView,
    adminBulkBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.backendEditorSyncBatch,
    bulkBatchMode: COMMON_TEMPLATE_STABLE_CHECKPOINT.bulkBatchMode,
    nextBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.nextBatch,
    activeTemplates: COMMON_TEMPLATE_STABLE_CHECKPOINT.activeTemplates,
    plannedTemplates: COMMON_TEMPLATE_STABLE_CHECKPOINT.plannedTemplates,
    syncedStatus: 'gameTemplateConfig 第 329 批、後台第 327 批、前台測試入口第 328 批已完成 150～200 項最終總基準前後台同步完成版。',
    stableMode: COMMON_TEMPLATE_BULK_150_200_MODE.stableMode,
    mediumRiskMode: COMMON_TEMPLATE_BULK_150_200_MODE.mediumRiskMode,
    errorMode: COMMON_TEMPLATE_BULK_150_200_MODE.errorMode,
    totalTargetCount: COMMON_TEMPLATE_BULK_150_200_MODE.superBatchGroups.reduce((sum, group) => {
      return sum + Number(group.targetCount || 0)
    }, 0),
    note: COMMON_TEMPLATE_STABLE_CHECKPOINT.note,
    mode: COMMON_TEMPLATE_BULK_150_200_MODE
  }
}

export const getCommonTemplateBulk150200FinalTotalCheckpoint = () => {
  return {
    batch: COMMON_TEMPLATE_STABLE_CHECKPOINT.batch,
    title: COMMON_TEMPLATE_STABLE_CHECKPOINT.title,
    previousStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.previousStableBatch,
    configFile: COMMON_TEMPLATE_STABLE_CHECKPOINT.configFile,
    frontCommonView: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontCommonView,
    frontStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontStableBatch,
    frontBulkBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontTestStableBatch,
    adminCommonView: COMMON_TEMPLATE_STABLE_CHECKPOINT.adminCommonView,
    adminBulkBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.backendEditorSyncBatch,
    bulkBatchMode: COMMON_TEMPLATE_STABLE_CHECKPOINT.bulkBatchMode,
    nextBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.nextBatch,
    activeTemplates: COMMON_TEMPLATE_STABLE_CHECKPOINT.activeTemplates,
    plannedTemplates: COMMON_TEMPLATE_STABLE_CHECKPOINT.plannedTemplates,
    syncedStatus: 'gameTemplateConfig 第 329 批、後台第 327 批、前台測試入口第 328 批已完成 150～200 項最終總基準前後台同步完成版。',
    stableMode: COMMON_TEMPLATE_BULK_150_200_MODE.stableMode,
    mediumRiskMode: COMMON_TEMPLATE_BULK_150_200_MODE.mediumRiskMode,
    errorMode: COMMON_TEMPLATE_BULK_150_200_MODE.errorMode,
    totalTargetCount: COMMON_TEMPLATE_BULK_150_200_MODE.superBatchGroups.reduce((sum, group) => {
      return sum + Number(group.targetCount || 0)
    }, 0),
    note: COMMON_TEMPLATE_STABLE_CHECKPOINT.note,
    mode: COMMON_TEMPLATE_BULK_150_200_MODE
  }
}

export const getCommonTemplateBulk150200SyncedCompletedCheckpoint = () => {
  return {
    batch: COMMON_TEMPLATE_STABLE_CHECKPOINT.batch,
    title: COMMON_TEMPLATE_STABLE_CHECKPOINT.title,
    previousStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.previousStableBatch,
    configFile: COMMON_TEMPLATE_STABLE_CHECKPOINT.configFile,
    frontCommonView: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontCommonView,
    frontStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontStableBatch,
    frontBulkBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontTestStableBatch,
    adminCommonView: COMMON_TEMPLATE_STABLE_CHECKPOINT.adminCommonView,
    adminBulkBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.backendEditorSyncBatch,
    bulkBatchMode: COMMON_TEMPLATE_STABLE_CHECKPOINT.bulkBatchMode,
    nextBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.nextBatch,
    activeTemplates: COMMON_TEMPLATE_STABLE_CHECKPOINT.activeTemplates,
    plannedTemplates: COMMON_TEMPLATE_STABLE_CHECKPOINT.plannedTemplates,
    syncedStatus: 'gameTemplateConfig 第 329 批、後台第 327 批、前台測試入口第 328 批已完成 150～200 項最終總基準前後台同步完成版。',
    stableMode: COMMON_TEMPLATE_BULK_150_200_MODE.stableMode,
    mediumRiskMode: COMMON_TEMPLATE_BULK_150_200_MODE.mediumRiskMode,
    errorMode: COMMON_TEMPLATE_BULK_150_200_MODE.errorMode,
    totalTargetCount: COMMON_TEMPLATE_BULK_150_200_MODE.superBatchGroups.reduce((sum, group) => {
      return sum + Number(group.targetCount || 0)
    }, 0),
    note: COMMON_TEMPLATE_STABLE_CHECKPOINT.note,
    mode: COMMON_TEMPLATE_BULK_150_200_MODE
  }
}

export const getCommonTemplateBulk150200SyncedCompletedStableCheckpoint = () => {
  return {
    batch: COMMON_TEMPLATE_STABLE_CHECKPOINT.batch,
    title: COMMON_TEMPLATE_STABLE_CHECKPOINT.title,
    previousStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.previousStableBatch,
    configFile: COMMON_TEMPLATE_STABLE_CHECKPOINT.configFile,
    frontCommonView: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontCommonView,
    frontStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontStableBatch,
    frontBulkBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontTestStableBatch,
    adminCommonView: COMMON_TEMPLATE_STABLE_CHECKPOINT.adminCommonView,
    adminBulkBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.backendEditorSyncBatch,
    bulkBatchMode: COMMON_TEMPLATE_STABLE_CHECKPOINT.bulkBatchMode,
    nextBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.nextBatch,
    activeTemplates: COMMON_TEMPLATE_STABLE_CHECKPOINT.activeTemplates,
    plannedTemplates: COMMON_TEMPLATE_STABLE_CHECKPOINT.plannedTemplates,
    syncedStatus: 'gameTemplateConfig 第 341 批、後台第 339 批、前台測試入口第 340 批已完成 150～200 項同步完成穩定備份前後台總對齊完成版。',
    stableMode: COMMON_TEMPLATE_BULK_150_200_MODE.stableMode,
    mediumRiskMode: COMMON_TEMPLATE_BULK_150_200_MODE.mediumRiskMode,
    errorMode: COMMON_TEMPLATE_BULK_150_200_MODE.errorMode,
    totalTargetCount: COMMON_TEMPLATE_BULK_150_200_MODE.superBatchGroups.reduce((sum, group) => {
      return sum + Number(group.targetCount || 0)
    }, 0),
    note: COMMON_TEMPLATE_STABLE_CHECKPOINT.note,
    mode: COMMON_TEMPLATE_BULK_150_200_MODE
  }
}

export const getCommonTemplateBulk150200SyncedStableTotalCheckpoint = () => {
  return {
    batch: COMMON_TEMPLATE_STABLE_CHECKPOINT.batch,
    title: COMMON_TEMPLATE_STABLE_CHECKPOINT.title,
    previousStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.previousStableBatch,
    configFile: COMMON_TEMPLATE_STABLE_CHECKPOINT.configFile,
    frontCommonView: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontCommonView,
    frontStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontStableBatch,
    frontBulkBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontTestStableBatch,
    adminCommonView: COMMON_TEMPLATE_STABLE_CHECKPOINT.adminCommonView,
    adminBulkBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.backendEditorSyncBatch,
    bulkBatchMode: COMMON_TEMPLATE_STABLE_CHECKPOINT.bulkBatchMode,
    nextBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.nextBatch,
    activeTemplates: COMMON_TEMPLATE_STABLE_CHECKPOINT.activeTemplates,
    plannedTemplates: COMMON_TEMPLATE_STABLE_CHECKPOINT.plannedTemplates,
    syncedStatus: 'gameTemplateConfig 第 341 批、後台第 339 批、前台測試入口第 340 批已完成 150～200 項同步完成穩定備份前後台總對齊完成版。',
    stableMode: COMMON_TEMPLATE_BULK_150_200_MODE.stableMode,
    mediumRiskMode: COMMON_TEMPLATE_BULK_150_200_MODE.mediumRiskMode,
    errorMode: COMMON_TEMPLATE_BULK_150_200_MODE.errorMode,
    totalTargetCount: COMMON_TEMPLATE_BULK_150_200_MODE.superBatchGroups.reduce((sum, group) => {
      return sum + Number(group.targetCount || 0)
    }, 0),
    note: COMMON_TEMPLATE_STABLE_CHECKPOINT.note,
    mode: COMMON_TEMPLATE_BULK_150_200_MODE
  }
}

export const getCommonTemplateBulk150200SyncedAlignedCheckpoint = () => {
  return {
    batch: COMMON_TEMPLATE_STABLE_CHECKPOINT.batch,
    title: COMMON_TEMPLATE_STABLE_CHECKPOINT.title,
    previousStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.previousStableBatch,
    configFile: COMMON_TEMPLATE_STABLE_CHECKPOINT.configFile,
    frontCommonView: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontCommonView,
    frontStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontStableBatch,
    frontBulkBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontTestStableBatch,
    adminCommonView: COMMON_TEMPLATE_STABLE_CHECKPOINT.adminCommonView,
    adminBulkBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.backendEditorSyncBatch,
    bulkBatchMode: COMMON_TEMPLATE_STABLE_CHECKPOINT.bulkBatchMode,
    nextBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.nextBatch,
    activeTemplates: COMMON_TEMPLATE_STABLE_CHECKPOINT.activeTemplates,
    plannedTemplates: COMMON_TEMPLATE_STABLE_CHECKPOINT.plannedTemplates,
    syncedStatus: 'gameTemplateConfig 第 341 批、後台第 339 批、前台測試入口第 340 批已完成 150～200 項同步完成穩定備份前後台總對齊完成版。',
    stableMode: COMMON_TEMPLATE_BULK_150_200_MODE.stableMode,
    mediumRiskMode: COMMON_TEMPLATE_BULK_150_200_MODE.mediumRiskMode,
    errorMode: COMMON_TEMPLATE_BULK_150_200_MODE.errorMode,
    totalTargetCount: COMMON_TEMPLATE_BULK_150_200_MODE.superBatchGroups.reduce((sum, group) => {
      return sum + Number(group.targetCount || 0)
    }, 0),
    note: COMMON_TEMPLATE_STABLE_CHECKPOINT.note,
    mode: COMMON_TEMPLATE_BULK_150_200_MODE
  }
}

export const getCommonTemplateBulk150200SyncedTotalAlignedCheckpoint = () => {
  return {
    batch: COMMON_TEMPLATE_STABLE_CHECKPOINT.batch,
    title: COMMON_TEMPLATE_STABLE_CHECKPOINT.title,
    previousStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.previousStableBatch,
    configFile: COMMON_TEMPLATE_STABLE_CHECKPOINT.configFile,
    frontCommonView: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontCommonView,
    frontStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontStableBatch,
    frontBulkBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontTestStableBatch,
    adminCommonView: COMMON_TEMPLATE_STABLE_CHECKPOINT.adminCommonView,
    adminBulkBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.backendEditorSyncBatch,
    bulkBatchMode: COMMON_TEMPLATE_STABLE_CHECKPOINT.bulkBatchMode,
    nextBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.nextBatch,
    activeTemplates: COMMON_TEMPLATE_STABLE_CHECKPOINT.activeTemplates,
    plannedTemplates: COMMON_TEMPLATE_STABLE_CHECKPOINT.plannedTemplates,
    syncedStatus: 'gameTemplateConfig 第 341 批、後台第 339 批、前台測試入口第 340 批已完成 150～200 項同步完成穩定備份前後台總對齊完成版。',
    stableMode: COMMON_TEMPLATE_BULK_150_200_MODE.stableMode,
    mediumRiskMode: COMMON_TEMPLATE_BULK_150_200_MODE.mediumRiskMode,
    errorMode: COMMON_TEMPLATE_BULK_150_200_MODE.errorMode,
    totalTargetCount: COMMON_TEMPLATE_BULK_150_200_MODE.superBatchGroups.reduce((sum, group) => {
      return sum + Number(group.targetCount || 0)
    }, 0),
    note: COMMON_TEMPLATE_STABLE_CHECKPOINT.note,
    mode: COMMON_TEMPLATE_BULK_150_200_MODE
  }
}

export const getCommonTemplateBulk150200SyncedTotalAlignedCompletedCheckpoint = () => {
  return {
    batch: COMMON_TEMPLATE_STABLE_CHECKPOINT.batch,
    title: COMMON_TEMPLATE_STABLE_CHECKPOINT.title,
    previousStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.previousStableBatch,
    configFile: COMMON_TEMPLATE_STABLE_CHECKPOINT.configFile,
    frontCommonView: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontCommonView,
    frontStableBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontStableBatch,
    frontBulkBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.frontTestStableBatch,
    adminCommonView: COMMON_TEMPLATE_STABLE_CHECKPOINT.adminCommonView,
    adminBulkBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.backendEditorSyncBatch,
    bulkBatchMode: COMMON_TEMPLATE_STABLE_CHECKPOINT.bulkBatchMode,
    nextBatch: COMMON_TEMPLATE_STABLE_CHECKPOINT.nextBatch,
    activeTemplates: COMMON_TEMPLATE_STABLE_CHECKPOINT.activeTemplates,
    plannedTemplates: COMMON_TEMPLATE_STABLE_CHECKPOINT.plannedTemplates,
    syncedStatus: 'gameTemplateConfig 第 341 批、後台第 339 批、前台測試入口第 340 批已完成 150～200 項同步完成穩定備份前後台總對齊完成版。',
    stableMode: COMMON_TEMPLATE_BULK_150_200_MODE.stableMode,
    mediumRiskMode: COMMON_TEMPLATE_BULK_150_200_MODE.mediumRiskMode,
    errorMode: COMMON_TEMPLATE_BULK_150_200_MODE.errorMode,
    totalTargetCount: COMMON_TEMPLATE_BULK_150_200_MODE.superBatchGroups.reduce((sum, group) => {
      return sum + Number(group.targetCount || 0)
    }, 0),
    note: COMMON_TEMPLATE_STABLE_CHECKPOINT.note,
    mode: COMMON_TEMPLATE_BULK_150_200_MODE
  }
}

export const getCommonTemplateCompleteIntegrationStableCheckpoint = () => {
  const baseCheckpoint = getCommonTemplateBulk150200SyncedTotalAlignedCompletedCheckpoint()

  return {
    ...baseCheckpoint,
    batch: 'V2.3 第 345 批',
    title: '公用模板完整整合前後台穩定備份版',
    previousStableBatch: 'V2.3 第 341-1 批：補齊總對齊完成 export 修正版',
    configFile: 'src/config/gameTemplateConfig.js',
    adminCommonView: 'src/views/admin/AdminCommonGameEditorView.vue',
    adminIntegrationBatch: 'V2.3 第 343 批：後台公用模板管理系統完整整合版',
    frontCommonView: 'src/views/front/games/CommonGamePlayerTestView.vue',
    frontIntegrationBatch: 'V2.3 第 350 批：前台測試入口讀取完整整合前後台讀取完成穩定備份版',
    nextBatch: 'V2.3 第 346 批',
    deliveryMode: '穩定整理型功能優先整份 TXT 交付',
    batchStrategy: {
      stable: '150～200 項',
      mediumRisk: '40～80 項',
      errorFix: '1～5 項'
    },
    integrationGroups: [
      '後台公用模板管理系統完整整合',
      '前台測試入口完整整合',
      '公用模板設定檔穩定備份',
      '正式頁安全隔離',
      '整份 TXT 覆蓋交付',
      '新對話延續提示'
    ],
    safeRules: [
      '不修改正式 WheelGameView.vue',
      '不修改正式 PremiumGridLotteryView.vue',
      '不修改 router/index.js',
      '不修改 API',
      '不修改 DB',
      '不修改登入與 tenant 權限',
      '不修改正式抽獎機率核心',
      '穩定整理型功能可整份 TXT 交付',
      '有錯誤先補小修正版'
    ],
    syncedStatus: 'gameTemplateConfig 第 345 批已記錄：後台第 343 批完整整合、前台第 344 批完整整合，前後台穩定備份完成。',
    stableMode: '穩定整理可一次處理 150～200 項',
    mediumRiskMode: '中風險改動建議 40～80 項',
    errorMode: '錯誤修正建議 1～5 項',
    totalTargetCount: 200,
    note: '第 345 批為完整整合前後台穩定備份基準。後續可從第 346 批開始繼續做整份完整檔案交付。'
  }
}

export const getCommonTemplateCompleteIntegrationReadCompletedCheckpoint = () => {
  const baseCheckpoint = getCommonTemplateCompleteIntegrationStableCheckpoint()

  return {
    ...baseCheckpoint,
    batch: 'V2.3 第 351 批',
    title: '完整整合前後台讀取完成總穩定備份版',
    previousStableBatch: 'V2.3 第 348 批：完整整合前後台讀取完成穩定備份版',
    configFile: 'src/config/gameTemplateConfig.js',
    adminCommonView: 'src/views/admin/AdminCommonGameEditorView.vue',
    adminIntegrationBatch: 'V2.3 第 343 批：後台公用模板管理系統完整整合版',
    adminReadBatch: 'V2.3 第 349 批：後台讀取完整整合前後台讀取完成穩定備份版',
    frontCommonView: 'src/views/front/games/CommonGamePlayerTestView.vue',
    frontIntegrationBatch: 'V2.3 第 350 批：前台測試入口讀取完整整合前後台讀取完成穩定備份版',
    nextBatch: 'V2.3 第 352 批',
    deliveryMode: '穩定整理型功能優先整份 TXT 交付',
    readCompletedStatus: '後台第 349 批與前台第 350 批皆已正常讀取完整整合前後台讀取完成穩定備份。',
    integrationGroups: [
      'gameTemplateConfig 第 348 批穩定備份',
      '後台第 346 批讀取完成',
      '前台第 347 批讀取完成',
      '整份 TXT 交付模式確認',
      '正式頁安全隔離確認',
      '後續可從第 349 批繼續'
    ],
    safeRules: [
      '不修改正式 WheelGameView.vue',
      '不修改正式 PremiumGridLotteryView.vue',
      '不修改 router/index.js',
      '不修改 API',
      '不修改 DB',
      '不修改登入與 tenant 權限',
      '不修改正式抽獎機率核心',
      '穩定整理型功能可整份 TXT 交付',
      '有錯誤先補小修正版'
    ],
    syncedStatus: 'gameTemplateConfig 第 348 批已記錄：後台第 346 批、前台第 347 批完整整合讀取完成。',
    stableMode: '穩定整理可一次處理 150～200 項',
    mediumRiskMode: '中風險改動建議 40～80 項',
    errorMode: '錯誤修正建議 1～5 項',
    totalTargetCount: 200,
    note: '第 348 批為完整整合前後台讀取完成穩定備份。後續可從第 349 批開始繼續做整份完整檔案交付。'
  }
}

export const getCommonTemplateCompleteIntegrationTotalStableCheckpoint = () => {
  const baseCheckpoint = getCommonTemplateCompleteIntegrationReadCompletedCheckpoint()

  return {
    ...baseCheckpoint,
    batch: 'V2.3 第 351 批',
    title: '完整整合前後台讀取完成總穩定備份版',
    previousStableBatch: 'V2.3 第 348 批：完整整合前後台讀取完成穩定備份版',
    configFile: 'src/config/gameTemplateConfig.js',
    adminCommonView: 'src/views/admin/AdminCommonGameEditorView.vue',
    adminIntegrationBatch: 'V2.3 第 343 批：後台公用模板管理系統完整整合版',
    adminReadBatch: 'V2.3 第 349 批：後台讀取完整整合前後台讀取完成穩定備份版',
    frontCommonView: 'src/views/front/games/CommonGamePlayerTestView.vue',
    frontIntegrationBatch: 'V2.3 第 350 批：前台測試入口讀取完整整合前後台讀取完成穩定備份版',
    nextBatch: 'V2.3 第 352 批',
    deliveryMode: '穩定整理型功能優先整份 TXT 交付',
    totalStableStatus: '後台第 349 批與前台第 350 批皆已正常讀取完整整合前後台讀取完成穩定備份，已建立第 351 批總穩定備份。',
    integrationGroups: [
      'gameTemplateConfig 第 351 批總穩定備份',
      '後台第 349 批讀取完成',
      '前台第 350 批讀取完成',
      '整份 TXT 交付模式確認',
      '正式頁安全隔離確認',
      '後續可從第 352 批繼續'
    ],
    safeRules: [
      '不修改正式 WheelGameView.vue',
      '不修改正式 PremiumGridLotteryView.vue',
      '不修改 router/index.js',
      '不修改 API',
      '不修改 DB',
      '不修改登入與 tenant 權限',
      '不修改正式抽獎機率核心',
      '穩定整理型功能可整份 TXT 交付',
      '有錯誤先補小修正版'
    ],
    syncedStatus: 'gameTemplateConfig 第 351 批已記錄：後台第 349 批、前台第 350 批完整整合前後台讀取完成總穩定備份。',
    stableMode: '穩定整理可一次處理 150～200 項',
    mediumRiskMode: '中風險改動建議 40～80 項',
    errorMode: '錯誤修正建議 1～5 項',
    totalTargetCount: 200,
    note: '第 351 批為完整整合前後台讀取完成總穩定備份。後續可從第 352 批開始繼續做整份完整檔案交付。'
  }
}

export default {
  getCommonTemplateCompleteIntegrationTotalStableCheckpoint,
  getCommonTemplateCompleteIntegrationReadCompletedCheckpoint,
  getCommonTemplateCompleteIntegrationStableCheckpoint,
  GAME_TEMPLATE_VERSION,
  COMMON_FRONT_PLAYER_SECTIONS,
  COMMON_ADMIN_SETTING_SECTIONS,
  DEFAULT_COMMON_GAME_PLAYER_LAYOUT,
  COMMON_GAME_CREATE_FLOW,
  GAME_TEMPLATE_TYPES,
  COMMON_TEMPLATE_STABLE_CHECKPOINT,
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
  getNextGameCreateDirection,
  getGameTemplateByType,
  getActiveGameTemplates,
  getPlannedGameTemplates,
  isGameTemplateActive,
  getPlayBoardComponentName,
  getGameSpecificSettings
}
