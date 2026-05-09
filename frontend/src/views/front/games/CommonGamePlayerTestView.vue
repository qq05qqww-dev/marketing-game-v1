<script setup>
import CommonGamePlayBoard from '../../../components/common-game/CommonGamePlayBoard.vue'
import {
  createPremiumGridCommonAdapterSummary,
  createPremiumGridCommonTemplate,
  getPremiumGridCommonAdapterStatusCards
} from '../../../config/commonGamePremiumGridAdapter'
import {
  getPremiumGridFormalSafetySummary,
  getPremiumGridFormalSafetyStatusCards,
  getPremiumGridFormalSafetyPhaseCards
} from '../../../config/premiumGridCommonFormalSafetyCheck'
import {
  createDefaultCommonGameTemplate,
  normalizeCommonGameTemplate,
  createCommonGameAdminUrl,
  createCommonGameTestUrl,
  getCommonGameModuleSummary
} from '../../../config/commonGameModuleCore'
import { computed, ref } from 'vue'
import { getActiveGameTemplates, getPlannedGameTemplates, getCommonTemplateStableSummary, getCommonTemplateFrontendBackendSyncCheckpoint, getCommonTemplateTotalSyncStableCheckpoint, getCommonTemplateBulk4050Mode, getCommonTemplateBulk4050StableCheckpoint, getCommonTemplateBulk150200Mode, getCommonTemplateBulk150200SyncedStableCheckpoint, getCommonTemplateBulk150200TotalStableCheckpoint, getCommonTemplateBulk150200FinalSafeCheckpoint, getCommonTemplateBulk150200CompletedCheckpoint, getCommonTemplateBulk150200TotalCompletedCheckpoint, getCommonTemplateBulk150200FinalTotalCheckpoint, getCommonTemplateBulk150200SyncedCompletedCheckpoint, getCommonTemplateBulk150200SyncedCompletedStableCheckpoint, getCommonTemplateBulk150200SyncedStableTotalCheckpoint, getCommonTemplateBulk150200SyncedAlignedCheckpoint, getCommonTemplateBulk150200SyncedTotalAlignedCheckpoint, getCommonTemplateBulk150200SyncedTotalAlignedCompletedCheckpoint, getCommonTemplateCompleteIntegrationStableCheckpoint, getCommonTemplateCompleteIntegrationReadCompletedCheckpoint, getNextGameCreateDirection } from '../../../config/gameTemplateConfig'
import CommonGamePlayerView from './CommonGamePlayerView.vue'

/**
 * Multi Game Platform V2.3 第 362 批：前台測試入口讀取精緻九宮格正式接入前安全檢查總基準版
 *
 * 檔案位置：
 * frontend/src/views/front/games/CommonGamePlayerTestView.vue
 *
 * 本批目的：
 * 1. 延續第 353 批：commonGameModuleCore.js 已建立共用遊戲模組核心。
 * 2. 延續第 354 批：CommonGamePlayBoard.vue 已建立共用 PlayBoard 顯示元件。
 * 3. 延續第 356 批：前台測試入口已讀取精緻九宮格正式接入前安全檢查。
 * 4. 延續第 358 批：commonGamePremiumGridAdapter.js 已建立精緻九宮格共用轉接器。
 * 5. 本批讓前台測試入口讀取 PremiumGrid / GRID 共用轉接器。
 * 6. 新對話延續提示下一步改為第 360 批。
 *
 * 本批安全原則：
 * - 不修改 router/index.js
 * - 不修改 WheelGameView.vue
 * - 不修改 PremiumGridLotteryView.vue
 * - 不修改 AdminCommonGameEditorView.vue
 * - 不修改 EggSmashPlayBoard.vue
 * - 不修改 WheelPlayBoard.vue
 * - 不取代正式玩家頁
 * - 只修改 /dev/common-game-player-test 測試入口
 */

const selectedGameType = ref('wheel')
const newChatPromptVisible = ref(false)
const testLogs = ref([])
const eventLogs = ref([
  {
    id: 'init',
    text: '公用玩家頁測試入口已載入',
    time: new Date().toLocaleString('zh-TW')
  }
])

const templateDescriptions = {
  'premium-grid': '測試 PremiumGridPlayBoard 是否仍可正常走公用玩家頁。',
  'egg-smash': '測試 EggSmashPlayBoard 是否可正常走公用玩家頁。',
  wheel: '測試 WheelPlayBoard 是否可正常走公用玩家頁。'
}

const gameOptions = computed(() => {
  return getActiveGameTemplates().map((template) => ({
    type: template.type,
    label: template.label,
    icon: template.icon,
    playBoardComponent: template.playBoardComponent,
    description: templateDescriptions[template.type] || template.description || '測試此遊戲是否可正常走公用玩家頁。'
  }))
})

const plannedGameOptions = computed(() => {
  return getPlannedGameTemplates().map((template) => ({
    type: template.type,
    label: template.label,
    icon: template.icon,
    playBoardComponent: template.playBoardComponent,
    description: template.description || '此遊戲目前為 planned，會出現在後台新遊戲生成器。'
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

const bulk4050ModeCheckpoint = computed(() => {
  return getCommonTemplateBulk4050Mode()
})

const bulk4050StableCheckpoint = computed(() => {
  return getCommonTemplateBulk4050StableCheckpoint()
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

const commonGameModuleSummary = computed(() => {
  return getCommonGameModuleSummary()
})

const commonPlayBoardTemplate = computed(() => {
  return normalizeCommonGameTemplate(
    createDefaultCommonGameTemplate('GRID', {
      id: 'dev-common-grid-playboard-test',
      label: '前台測試入口共用 PlayBoard',
      status: 'testing',
      description: '第 356 批：前台測試入口正式套用 CommonGamePlayBoard，用來驗證共用玩家頁顯示區、狀態卡、安全隔離與後續正式接入前流程。',
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
      front: {
        showCampaignHeader: true,
        showGameBoard: true,
        showPrizeHint: true,
        showPlayCount: true,
        showResultModal: true,
        showSafeFallback: true,
        showTestingBadge: true
      }
    })
  )
})

const premiumGridCommonTemplate = computed(() => {
  return createPremiumGridCommonTemplate({
    id: 'dev-premium-grid-common-adapter-test',
    label: '前台測試入口精緻九宮格共用模板',
    status: 'testing',
    description: '第 359 批：前台測試入口讀取 commonGamePremiumGridAdapter.js，驗證 GRID 共用模板、九宮格欄位、前台摘要卡與正式頁安全檢查。'
  })
})

const premiumGridAdapterSummary = computed(() => {
  return createPremiumGridCommonAdapterSummary(premiumGridCommonTemplate.value)
})

const premiumGridAdapterStatusCards = computed(() => {
  return getPremiumGridCommonAdapterStatusCards()
})

const premiumGridFrontCards = computed(() => {
  return premiumGridAdapterSummary.value.frontCards || []
})

const premiumGridFormalSafeChecks = computed(() => {
  return premiumGridAdapterSummary.value.formalSafeCheck?.checks || []
})

const premiumGridAdapterFlowGroups = computed(() => [
  {
    key: 'adapter',
    title: 'GRID 共用轉接器',
    icon: '🔌',
    description: 'commonGamePremiumGridAdapter.js 負責把精緻九宮格轉成共用模板格式。',
    items: [
      'createPremiumGridCommonTemplate',
      'normalizePremiumGridCommonTemplate',
      'validatePremiumGridCommonTemplate',
      'buildPremiumGridCommonFrontCards',
      'formalSafeCheck',
      'adapterSummary'
    ]
  },
  {
    key: 'front',
    title: '前台測試讀取',
    icon: '🧪',
    description: '測試入口先讀取 GRID adapter，確認資料與 CommonGamePlayBoard 可共用。',
    items: [
      'GRID 模板',
      '前台摘要卡',
      'PlayBoard placeholder',
      '九宮格設定',
      '正式頁隔離',
      '下一步後台讀取'
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
    description: '目前只在第 362 批讀取安全檢查，正式頁仍不修改。',
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

const commonPlayBoardCards = computed(() => [
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
    label: '本批套用',
    value: 'V2.3 第 362 批',
    icon: '✅'
  },
  {
    label: '測試入口',
    value: '/dev/common-game-player-test',
    icon: '🧪'
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

const commonPlayBoardFlowGroups = computed(() => [
  {
    key: 'core',
    title: '共用核心資料',
    icon: '🧩',
    description: '由 commonGameModuleCore.js 提供遊戲類型、模板狀態、預設值、驗證與 URL 工具。',
    items: [
      'COMMON_GAME_TYPES',
      'COMMON_GAME_TEMPLATE_STATUS',
      'normalizeCommonGameTemplate',
      'validateCommonGameTemplate',
      'createDefaultCommonGameTemplate',
      'safeRules'
    ]
  },
  {
    key: 'playboard',
    title: '共用 PlayBoard 顯示',
    icon: '🧱',
    description: '由 CommonGamePlayBoard.vue 顯示玩家頁共用資訊、PlayBoard 設定、欄位群組與安全隔離。',
    items: [
      '模板資訊',
      '狀態卡片',
      'PlayBoard placeholder',
      '欄位群組',
      '安全規則',
      '後續批次方向'
    ]
  },
  {
    key: 'safe',
    title: '正式頁安全隔離',
    icon: '🔒',
    description: '本批只在測試入口套用，不接正式玩家頁、不改 router、不改 API、不改 DB。',
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

const nextGameCreateDirection = computed(() => {
  return getNextGameCreateDirection()
})

const nextBatchNumber = computed(() => 363)

const newChatPromptText = computed(() => {
  return [
    `請以這份為目前最新基準，下一步從第 ${nextBatchNumber.value} 批開始。`,
    ``,
    `目前專案：Multi Game Platform V2.3`,
    ``,
    `目前總穩定基準：`,
    `- ${totalSyncStableCheckpoint.value.batch}：${totalSyncStableCheckpoint.value.title}`,
    `- 前台公用基準：${commonTemplateStableSummary.value.frontStableBatch}`,
    `- 後台公用基準：${commonTemplateStableSummary.value.adminStableBatch}`,
    `- 設定檔：${commonTemplateStableSummary.value.configFile}`,
    ``,
    `目前已完成：`,
    `- CommonGamePlayerView 已支援 premium-grid / egg-smash / wheel`,
    `- CommonGamePlayerTestView 已讀取 gameTemplateConfig.js 的總穩定基準`,
    `- AdminCommonGameEditorView 已讀取 gameTemplateConfig.js 的總穩定基準`,
    `- active 模板給前台 / 後台預覽切換`,
    `- planned 模板給新遊戲生成器規劃`,
    ``,
    `active 模板：`,
    ...gameOptions.value.map((game) => `- ${game.type}｜${game.label}｜${game.playBoardComponent}`),
    ``,
    `planned 模板：`,
    ...plannedGameOptions.value.map((game) => `- ${game.type}｜${game.label}｜${game.playBoardComponent}`),
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

const templateFlowCards = computed(() => [
  {
    label: '總穩定基準',
    value: commonTemplateStableSummary.value.batch,
    icon: '🛡️',
    class: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
  },
  {
    label: 'active 模板',
    value: `${gameOptions.value.length} 個`,
    icon: '✅',
    class: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200'
  },
  {
    label: 'planned 模板',
    value: `${plannedGameOptions.value.length} 個`,
    icon: '🧪',
    class: 'border-violet-400/20 bg-violet-400/10 text-violet-200'
  },
  {
    label: '測試入口',
    value: '讀取模板設定',
    icon: '🧩',
    class: 'border-amber-400/20 bg-amber-400/10 text-amber-200'
  }
])

const bulkSyncUpgradeItems = computed(() => [
  {
    id: 'config',
    title: '設定檔基準',
    value: totalSyncStableCheckpoint.value.batch,
    icon: '🧬',
    status: 'done'
  },
  {
    id: 'front-common',
    title: '前台公用玩家頁',
    value: totalSyncStableCheckpoint.value.frontStableBatch,
    icon: '🧩',
    status: 'done'
  },
  {
    id: 'front-test',
    title: '前台測試入口',
    value: 'V2.3 第 362 批',
    icon: '🧪',
    status: 'done'
  },
  {
    id: 'admin',
    title: '後台公用設定頁',
    value: 'V2.3 第 298 批',
    icon: '🛠️',
    status: 'done'
  },
  {
    id: 'next',
    title: '下一步批次',
    value: `V2.3 第 ${nextBatchNumber.value} 批`,
    icon: '➡️',
    status: 'done'
  },
  {
    id: 'active',
    title: 'active 模板數',
    value: `${gameOptions.value.length} 個`,
    icon: '✅',
    status: 'done'
  },
  {
    id: 'planned',
    title: 'planned 模板數',
    value: `${plannedGameOptions.value.length} 個`,
    icon: '🧪',
    status: 'done'
  },
  {
    id: 'playboard',
    title: '目前 PlayBoard',
    value: currentPlayBoardName.value,
    icon: '🎮',
    status: 'done'
  },
  {
    id: 'selected',
    title: '目前測試遊戲',
    value: selectedGameOption.value?.label || selectedGameType.value,
    icon: selectedGameOption.value?.icon || '🎯',
    status: 'done'
  },
  {
    id: 'common-result',
    title: '共用結果流程',
    value: 'GameResultModal',
    icon: '🏆',
    status: 'done'
  },
  {
    id: 'common-prizes',
    title: '共用獎品展示',
    value: 'GamePrizeShowcase',
    icon: '🎁',
    status: 'done'
  },
  {
    id: 'common-rules',
    title: '共用規則面板',
    value: 'GameRulesPanel',
    icon: '📋',
    status: 'done'
  },
  {
    id: 'common-claim',
    title: '共用領獎資訊',
    value: 'GameClaimInfo',
    icon: '📌',
    status: 'done'
  },
  {
    id: 'common-logs',
    title: '共用紀錄區',
    value: 'GameDrawLogs',
    icon: '🧾',
    status: 'done'
  },
  {
    id: 'formal-safe',
    title: '正式頁安全',
    value: '不動 router / 正式頁',
    icon: '🛡️',
    status: 'done'
  }
])

const bulk4050SummaryCards = computed(() => [
  {
    label: '穩定狀態',
    value: bulk4050ModeCheckpoint.value.stableMode,
    icon: '🚀'
  },
  {
    label: '錯誤狀態',
    value: bulk4050ModeCheckpoint.value.errorMode,
    icon: '🧯'
  },
  {
    label: '建議整理數',
    value: `${bulk4050ModeCheckpoint.value.recommendedBatchSize?.stableMin || 40}～${bulk4050ModeCheckpoint.value.recommendedBatchSize?.stableMax || 50} 項`,
    icon: '📦'
  },
  {
    label: '修錯整理數',
    value: `${bulk4050ModeCheckpoint.value.recommendedBatchSize?.fixMin || 1}～${bulk4050ModeCheckpoint.value.recommendedBatchSize?.fixMax || 5} 項`,
    icon: '🛠️'
  },
  {
    label: '合計方向',
    value: `${bulk4050ModeCheckpoint.value.totalTargetCount || 50} 項`,
    icon: '✅'
  },
  {
    label: '下一步',
    value: `V2.3 第 ${nextBatchNumber.value} 批`,
    icon: '➡️'
  }
])

const bulk4050StableCards = computed(() => [
  {
    label: '總穩定基準',
    value: bulk4050StableCheckpoint.value.batch,
    icon: '🛡️'
  },
  {
    label: '設定檔',
    value: bulk4050StableCheckpoint.value.configFile || 'gameTemplateConfig.js',
    icon: '🧬'
  },
  {
    label: '後台讀取基準',
    value: bulk4050StableCheckpoint.value.adminBulkBatch,
    icon: '🛠️'
  },
  {
    label: '前台測試入口',
    value: 'V2.3 第 362 批',
    icon: '🧪'
  },
  {
    label: '批次策略',
    value: bulk4050StableCheckpoint.value.bulkBatchMode,
    icon: '🚀'
  },
  {
    label: '下一步',
    value: `V2.3 第 ${nextBatchNumber.value} 批`,
    icon: '➡️'
  }
])

const bulk150200SummaryCards = computed(() => [
  {
    label: '超大批次基準',
    value: bulk150200ModeCheckpoint.value.batch,
    icon: '🛡️'
  },
  {
    label: '穩定整理',
    value: bulk150200ModeCheckpoint.value.stableMode,
    icon: '🚀'
  },
  {
    label: '中風險改動',
    value: bulk150200ModeCheckpoint.value.mediumRiskMode,
    icon: '⚖️'
  },
  {
    label: '錯誤修正',
    value: bulk150200ModeCheckpoint.value.errorMode,
    icon: '🧯'
  },
  {
    label: '建議整理數',
    value: `${bulk150200ModeCheckpoint.value.recommendedBatchSize?.stableMin || 150}～${bulk150200ModeCheckpoint.value.recommendedBatchSize?.stableMax || 200} 項`,
    icon: '📦'
  },
  {
    label: '中風險整理數',
    value: `${bulk150200ModeCheckpoint.value.recommendedBatchSize?.mediumRiskMin || 40}～${bulk150200ModeCheckpoint.value.recommendedBatchSize?.mediumRiskMax || 80} 項`,
    icon: '🧭'
  },
  {
    label: '修錯整理數',
    value: `${bulk150200ModeCheckpoint.value.recommendedBatchSize?.fixMin || 1}～${bulk150200ModeCheckpoint.value.recommendedBatchSize?.fixMax || 5} 項`,
    icon: '🛠️'
  },
  {
    label: '合計方向',
    value: `${bulk150200ModeCheckpoint.value.totalTargetCount || 200} 項`,
    icon: '✅'
  },
  {
    label: '下一步',
    value: `V2.3 第 ${nextBatchNumber.value} 批`,
    icon: '➡️'
  }
])

const bulk150200SyncedStableCards = computed(() => [
  {
    label: '同步總基準',
    value: bulk150200SyncedStableCheckpoint.value.batch,
    icon: '🛡️'
  },
  {
    label: '同步狀態',
    value: bulk150200SyncedStableCheckpoint.value.syncedStatus,
    icon: '🔗'
  },
  {
    label: '後台讀取基準',
    value: bulk150200SyncedStableCheckpoint.value.adminBulkBatch,
    icon: '🛠️'
  },
  {
    label: '前台測試入口',
    value: bulk150200SyncedStableCheckpoint.value.frontBulkBatch,
    icon: '🧪'
  },
  {
    label: '穩定模式',
    value: bulk150200SyncedStableCheckpoint.value.stableMode,
    icon: '🚀'
  },
  {
    label: '中風險模式',
    value: bulk150200SyncedStableCheckpoint.value.mediumRiskMode,
    icon: '⚖️'
  },
  {
    label: '錯誤模式',
    value: bulk150200SyncedStableCheckpoint.value.errorMode,
    icon: '🧯'
  },
  {
    label: '總整理方向',
    value: `${bulk150200SyncedStableCheckpoint.value.totalTargetCount || 200} 項`,
    icon: '📦'
  },
  {
    label: '下一步',
    value: `V2.3 第 ${nextBatchNumber.value} 批`,
    icon: '➡️'
  }
])

const bulk150200TotalStableCards = computed(() => [
  {
    label: '總穩定備份',
    value: bulk150200TotalStableCheckpoint.value.batch,
    icon: '🛡️'
  },
  {
    label: '同步狀態',
    value: bulk150200TotalStableCheckpoint.value.syncedStatus,
    icon: '🔗'
  },
  {
    label: '後台讀取基準',
    value: bulk150200TotalStableCheckpoint.value.adminBulkBatch,
    icon: '🛠️'
  },
  {
    label: '前台測試入口',
    value: bulk150200TotalStableCheckpoint.value.frontBulkBatch,
    icon: '🧪'
  },
  {
    label: '穩定整理',
    value: bulk150200TotalStableCheckpoint.value.stableMode,
    icon: '🚀'
  },
  {
    label: '中風險改動',
    value: bulk150200TotalStableCheckpoint.value.mediumRiskMode,
    icon: '⚖️'
  },
  {
    label: '錯誤修正',
    value: bulk150200TotalStableCheckpoint.value.errorMode,
    icon: '🧯'
  },
  {
    label: '總整理方向',
    value: `${bulk150200TotalStableCheckpoint.value.totalTargetCount || 200} 項`,
    icon: '📦'
  },
  {
    label: '下一步',
    value: `V2.3 第 ${nextBatchNumber.value} 批`,
    icon: '➡️'
  }
])

const bulk150200FinalSafeCards = computed(() => [
  {
    label: '最終安全基準',
    value: bulk150200FinalSafeCheckpoint.value.batch,
    icon: '🛡️'
  },
  {
    label: '同步狀態',
    value: bulk150200FinalSafeCheckpoint.value.syncedStatus,
    icon: '🔗'
  },
  {
    label: '後台讀取基準',
    value: bulk150200FinalSafeCheckpoint.value.adminBulkBatch,
    icon: '🛠️'
  },
  {
    label: '前台測試入口',
    value: bulk150200FinalSafeCheckpoint.value.frontBulkBatch,
    icon: '🧪'
  },
  {
    label: '穩定整理',
    value: bulk150200FinalSafeCheckpoint.value.stableMode,
    icon: '🚀'
  },
  {
    label: '中風險改動',
    value: bulk150200FinalSafeCheckpoint.value.mediumRiskMode,
    icon: '⚖️'
  },
  {
    label: '錯誤修正',
    value: bulk150200FinalSafeCheckpoint.value.errorMode,
    icon: '🧯'
  },
  {
    label: '總整理方向',
    value: `${bulk150200FinalSafeCheckpoint.value.totalTargetCount || 200} 項`,
    icon: '📦'
  },
  {
    label: '下一步',
    value: `V2.3 第 ${nextBatchNumber.value} 批`,
    icon: '➡️'
  }
])

const bulk150200CompletedCards = computed(() => [
  {
    label: '完成備份基準',
    value: bulk150200CompletedCheckpoint.value.batch,
    icon: '🛡️'
  },
  {
    label: '同步狀態',
    value: bulk150200CompletedCheckpoint.value.syncedStatus,
    icon: '🔗'
  },
  {
    label: '後台讀取基準',
    value: bulk150200CompletedCheckpoint.value.adminBulkBatch,
    icon: '🛠️'
  },
  {
    label: '前台測試入口',
    value: bulk150200CompletedCheckpoint.value.frontBulkBatch,
    icon: '🧪'
  },
  {
    label: '穩定整理',
    value: bulk150200CompletedCheckpoint.value.stableMode,
    icon: '🚀'
  },
  {
    label: '中風險改動',
    value: bulk150200CompletedCheckpoint.value.mediumRiskMode,
    icon: '⚖️'
  },
  {
    label: '錯誤修正',
    value: bulk150200CompletedCheckpoint.value.errorMode,
    icon: '🧯'
  },
  {
    label: '總整理方向',
    value: `${bulk150200CompletedCheckpoint.value.totalTargetCount || 200} 項`,
    icon: '📦'
  },
  {
    label: '下一步',
    value: `V2.3 第 ${nextBatchNumber.value} 批`,
    icon: '➡️'
  }
])

const bulk150200TotalCompletedCards = computed(() => [
  {
    label: '總穩定備份',
    value: bulk150200TotalCompletedCheckpoint.value.batch,
    icon: '🛡️'
  },
  {
    label: '同步狀態',
    value: bulk150200TotalCompletedCheckpoint.value.syncedStatus,
    icon: '🔗'
  },
  {
    label: '後台讀取基準',
    value: bulk150200TotalCompletedCheckpoint.value.adminBulkBatch,
    icon: '🛠️'
  },
  {
    label: '前台測試入口',
    value: bulk150200TotalCompletedCheckpoint.value.frontBulkBatch,
    icon: '🧪'
  },
  {
    label: '穩定整理',
    value: bulk150200TotalCompletedCheckpoint.value.stableMode,
    icon: '🚀'
  },
  {
    label: '中風險改動',
    value: bulk150200TotalCompletedCheckpoint.value.mediumRiskMode,
    icon: '⚖️'
  },
  {
    label: '錯誤修正',
    value: bulk150200TotalCompletedCheckpoint.value.errorMode,
    icon: '🧯'
  },
  {
    label: '總整理方向',
    value: `${bulk150200TotalCompletedCheckpoint.value.totalTargetCount || 200} 項`,
    icon: '📦'
  },
  {
    label: '下一步',
    value: `V2.3 第 ${nextBatchNumber.value} 批`,
    icon: '➡️'
  }
])

const bulk150200FinalTotalCards = computed(() => [
  {
    label: '最終總基準',
    value: bulk150200FinalTotalCheckpoint.value.batch,
    icon: '🛡️'
  },
  {
    label: '同步狀態',
    value: bulk150200FinalTotalCheckpoint.value.syncedStatus,
    icon: '🔗'
  },
  {
    label: '後台讀取基準',
    value: bulk150200FinalTotalCheckpoint.value.adminBulkBatch,
    icon: '🛠️'
  },
  {
    label: '前台測試入口',
    value: bulk150200FinalTotalCheckpoint.value.frontBulkBatch,
    icon: '🧪'
  },
  {
    label: '穩定整理',
    value: bulk150200FinalTotalCheckpoint.value.stableMode,
    icon: '🚀'
  },
  {
    label: '中風險改動',
    value: bulk150200FinalTotalCheckpoint.value.mediumRiskMode,
    icon: '⚖️'
  },
  {
    label: '錯誤修正',
    value: bulk150200FinalTotalCheckpoint.value.errorMode,
    icon: '🧯'
  },
  {
    label: '總整理方向',
    value: `${bulk150200FinalTotalCheckpoint.value.totalTargetCount || 200} 項`,
    icon: '📦'
  },
  {
    label: '下一步',
    value: `V2.3 第 ${nextBatchNumber.value} 批`,
    icon: '➡️'
  }
])

const bulk150200SyncedCompletedCards = computed(() => [
  {
    label: '同步完成基準',
    value: bulk150200SyncedCompletedCheckpoint.value.batch,
    icon: '🛡️'
  },
  {
    label: '同步狀態',
    value: bulk150200SyncedCompletedCheckpoint.value.syncedStatus,
    icon: '🔗'
  },
  {
    label: '後台讀取基準',
    value: bulk150200SyncedCompletedCheckpoint.value.adminBulkBatch,
    icon: '🛠️'
  },
  {
    label: '前台測試入口',
    value: bulk150200SyncedCompletedCheckpoint.value.frontBulkBatch,
    icon: '🧪'
  },
  {
    label: '穩定整理',
    value: bulk150200SyncedCompletedCheckpoint.value.stableMode,
    icon: '🚀'
  },
  {
    label: '中風險改動',
    value: bulk150200SyncedCompletedCheckpoint.value.mediumRiskMode,
    icon: '⚖️'
  },
  {
    label: '錯誤修正',
    value: bulk150200SyncedCompletedCheckpoint.value.errorMode,
    icon: '🧯'
  },
  {
    label: '總整理方向',
    value: `${bulk150200SyncedCompletedCheckpoint.value.totalTargetCount || 200} 項`,
    icon: '📦'
  },
  {
    label: '下一步',
    value: `V2.3 第 ${nextBatchNumber.value} 批`,
    icon: '➡️'
  }
])

const bulk150200SyncedCompletedStableCards = computed(() => [
  {
    label: '穩定備份基準',
    value: bulk150200SyncedCompletedStableCheckpoint.value.batch,
    icon: '🛡️'
  },
  {
    label: '同步狀態',
    value: bulk150200SyncedCompletedStableCheckpoint.value.syncedStatus,
    icon: '🔗'
  },
  {
    label: '後台讀取基準',
    value: bulk150200SyncedCompletedStableCheckpoint.value.adminBulkBatch,
    icon: '🛠️'
  },
  {
    label: '前台測試入口',
    value: bulk150200SyncedCompletedStableCheckpoint.value.frontBulkBatch,
    icon: '🧪'
  },
  {
    label: '穩定整理',
    value: bulk150200SyncedCompletedStableCheckpoint.value.stableMode,
    icon: '🚀'
  },
  {
    label: '中風險改動',
    value: bulk150200SyncedCompletedStableCheckpoint.value.mediumRiskMode,
    icon: '⚖️'
  },
  {
    label: '錯誤修正',
    value: bulk150200SyncedCompletedStableCheckpoint.value.errorMode,
    icon: '🧯'
  },
  {
    label: '總整理方向',
    value: `${bulk150200SyncedCompletedStableCheckpoint.value.totalTargetCount || 200} 項`,
    icon: '📦'
  },
  {
    label: '下一步',
    value: `V2.3 第 ${nextBatchNumber.value} 批`,
    icon: '➡️'
  }
])

const bulk150200SyncedStableTotalCards = computed(() => [
  {
    label: '總基準',
    value: bulk150200SyncedStableTotalCheckpoint.value.batch,
    icon: '🛡️'
  },
  {
    label: '同步狀態',
    value: bulk150200SyncedStableTotalCheckpoint.value.syncedStatus,
    icon: '🔗'
  },
  {
    label: '後台讀取基準',
    value: bulk150200SyncedStableTotalCheckpoint.value.adminBulkBatch,
    icon: '🛠️'
  },
  {
    label: '前台測試入口',
    value: bulk150200SyncedStableTotalCheckpoint.value.frontBulkBatch,
    icon: '🧪'
  },
  {
    label: '穩定整理',
    value: bulk150200SyncedStableTotalCheckpoint.value.stableMode,
    icon: '🚀'
  },
  {
    label: '中風險改動',
    value: bulk150200SyncedStableTotalCheckpoint.value.mediumRiskMode,
    icon: '⚖️'
  },
  {
    label: '錯誤修正',
    value: bulk150200SyncedStableTotalCheckpoint.value.errorMode,
    icon: '🧯'
  },
  {
    label: '總整理方向',
    value: `${bulk150200SyncedStableTotalCheckpoint.value.totalTargetCount || 200} 項`,
    icon: '📦'
  },
  {
    label: '下一步',
    value: `V2.3 第 ${nextBatchNumber.value} 批`,
    icon: '➡️'
  }
])

const bulk150200SyncedAlignedCards = computed(() => [
  {
    label: '前後台對齊基準',
    value: bulk150200SyncedAlignedCheckpoint.value.batch,
    icon: '🛡️'
  },
  {
    label: '同步狀態',
    value: bulk150200SyncedAlignedCheckpoint.value.syncedStatus,
    icon: '🔗'
  },
  {
    label: '後台讀取基準',
    value: bulk150200SyncedAlignedCheckpoint.value.adminBulkBatch,
    icon: '🛠️'
  },
  {
    label: '前台測試入口',
    value: bulk150200SyncedAlignedCheckpoint.value.frontBulkBatch,
    icon: '🧪'
  },
  {
    label: '穩定整理',
    value: bulk150200SyncedAlignedCheckpoint.value.stableMode,
    icon: '🚀'
  },
  {
    label: '中風險改動',
    value: bulk150200SyncedAlignedCheckpoint.value.mediumRiskMode,
    icon: '⚖️'
  },
  {
    label: '錯誤修正',
    value: bulk150200SyncedAlignedCheckpoint.value.errorMode,
    icon: '🧯'
  },
  {
    label: '總整理方向',
    value: `${bulk150200SyncedAlignedCheckpoint.value.totalTargetCount || 200} 項`,
    icon: '📦'
  },
  {
    label: '下一步',
    value: `V2.3 第 ${nextBatchNumber.value} 批`,
    icon: '➡️'
  }
])

const bulk150200SyncedTotalAlignedCards = computed(() => [
  {
    label: '總對齊基準',
    value: bulk150200SyncedTotalAlignedCheckpoint.value.batch,
    icon: '🛡️'
  },
  {
    label: '同步狀態',
    value: bulk150200SyncedTotalAlignedCheckpoint.value.syncedStatus,
    icon: '🔗'
  },
  {
    label: '後台讀取基準',
    value: bulk150200SyncedTotalAlignedCheckpoint.value.adminBulkBatch,
    icon: '🛠️'
  },
  {
    label: '前台測試入口',
    value: bulk150200SyncedTotalAlignedCheckpoint.value.frontBulkBatch,
    icon: '🧪'
  },
  {
    label: '穩定整理',
    value: bulk150200SyncedTotalAlignedCheckpoint.value.stableMode,
    icon: '🚀'
  },
  {
    label: '中風險改動',
    value: bulk150200SyncedTotalAlignedCheckpoint.value.mediumRiskMode,
    icon: '⚖️'
  },
  {
    label: '錯誤修正',
    value: bulk150200SyncedTotalAlignedCheckpoint.value.errorMode,
    icon: '🧯'
  },
  {
    label: '總整理方向',
    value: `${bulk150200SyncedTotalAlignedCheckpoint.value.totalTargetCount || 200} 項`,
    icon: '📦'
  },
  {
    label: '下一步',
    value: `V2.3 第 ${nextBatchNumber.value} 批`,
    icon: '➡️'
  }
])

const frontCompleteIntegrationCards = computed(() => [
  {
    label: '目前基準',
    value: 'V2.3 第 362 批',
    icon: '🏁'
  },
  {
    label: '前台入口',
    value: '/dev/common-game-player-test',
    icon: '🧪'
  },
  {
    label: '後台對齊',
    value: 'V2.3 第 343 批',
    icon: '🛠️'
  },
  {
    label: '設定檔修正',
    value: 'V2.3 第 341-1 批',
    icon: '🧬'
  },
  {
    label: '穩定整理',
    value: '150～200 項',
    icon: '🚀'
  },
  {
    label: '交付方式',
    value: '整份 TXT 覆蓋',
    icon: '📄'
  },
  {
    label: '正式頁隔離',
    value: '安全保護',
    icon: '🔒'
  },
  {
    label: '下一步',
    value: `V2.3 第 ${nextBatchNumber.value} 批`,
    icon: '➡️'
  }
])

const frontCompleteIntegrationStableCards = computed(() => [
  {
    label: '設定檔修正版',
    value: completeIntegrationStableCheckpoint.value.batch,
    icon: '🧬'
  },
  {
    label: '後台完整整合',
    value: completeIntegrationStableCheckpoint.value.adminIntegrationBatch,
    icon: '🛠️'
  },
  {
    label: '後台讀取備份',
    value: completeIntegrationStableCheckpoint.value.adminReadBatch || 'V2.3 第 346 批',
    icon: '📖'
  },
  {
    label: '前台完整整合',
    value: completeIntegrationStableCheckpoint.value.frontIntegrationBatch,
    icon: '🧪'
  },
  {
    label: '交付模式',
    value: completeIntegrationStableCheckpoint.value.deliveryMode,
    icon: '📄'
  },
  {
    label: '穩定整理',
    value: completeIntegrationStableCheckpoint.value.batchStrategy?.stable || '150～200 項',
    icon: '🚀'
  },
  {
    label: '修錯模式',
    value: completeIntegrationStableCheckpoint.value.batchStrategy?.errorFix || '1～5 項',
    icon: '🧯'
  },
  {
    label: '下一步',
    value: `V2.3 第 ${nextBatchNumber.value} 批`,
    icon: '➡️'
  }
])

const frontCompleteIntegrationReadCompletedCards = computed(() => [
  {
    label: '設定檔讀取完成',
    value: completeIntegrationReadCompletedCheckpoint.value.batch,
    icon: '🧬'
  },
  {
    label: '後台讀取完成',
    value: completeIntegrationReadCompletedCheckpoint.value.adminReadBatch,
    icon: '🛠️'
  },
  {
    label: '前台讀取完成',
    value: completeIntegrationReadCompletedCheckpoint.value.frontIntegrationBatch,
    icon: '🧪'
  },
  {
    label: '讀取完成狀態',
    value: completeIntegrationReadCompletedCheckpoint.value.readCompletedStatus,
    icon: '✅'
  },
  {
    label: '交付模式',
    value: completeIntegrationReadCompletedCheckpoint.value.deliveryMode,
    icon: '📄'
  },
  {
    label: '穩定整理',
    value: completeIntegrationReadCompletedCheckpoint.value.stableMode,
    icon: '🚀'
  },
  {
    label: '修錯模式',
    value: completeIntegrationReadCompletedCheckpoint.value.errorMode,
    icon: '🧯'
  },
  {
    label: '下一步',
    value: `V2.3 第 ${nextBatchNumber.value} 批`,
    icon: '➡️'
  }
])

const frontCompleteIntegrationReadCompletedGroups = computed(() => [
  {
    key: 'read-completed',
    title: '前後台讀取完成穩定備份',
    icon: '✅',
    description: completeIntegrationReadCompletedCheckpoint.value.syncedStatus,
    items: completeIntegrationReadCompletedCheckpoint.value.integrationGroups || []
  },
  {
    key: 'front-confirm',
    title: '前台測試入口讀取確認',
    icon: '🧪',
    description: '第 350 批確認前台測試入口也已讀取第 348 批讀取完成備份，與後台第 349 批對齊。',
    items: [
      '設定檔第 348 批',
      '後台第 349 批',
      '前台第 350 批',
      '整份 TXT',
      '正式頁隔離',
      '測試入口確認',
      '讀取完成備份',
      '下一步第 351 批'
    ]
  }
])

const frontCompleteIntegrationReadCompletedSafeRules = computed(() => {
  return completeIntegrationReadCompletedCheckpoint.value.safeRules || []
})


const frontCompleteIntegrationStableGroups = computed(() => [
  {
    key: 'stable-checkpoint',
    title: '完整整合穩定備份讀取',
    icon: '🧬',
    description: completeIntegrationStableCheckpoint.value.syncedStatus,
    items: completeIntegrationStableCheckpoint.value.integrationGroups || []
  },
  {
    key: 'front-check',
    title: '前台測試入口檢查',
    icon: '🧪',
    description: '前台測試入口用來確認模板測試、玩家頁流程、整份交付規則與正式頁隔離是否正常。',
    items: [
      '模板測試',
      '玩家頁測試',
      'PlayBoard 測試',
      '狀態卡顯示',
      '同步基準',
      '安全隔離',
      '整份交付',
      '新對話延續'
    ]
  }
])

const frontCompleteIntegrationStableSafeRules = computed(() => {
  return completeIntegrationStableCheckpoint.value.safeRules || frontCompleteSafeRules.value || []
})


const frontCompleteIntegrationGroups = computed(() => [
  {
    key: 'template-test',
    title: '模板測試流程',
    icon: '🧩',
    description: '確認 active / planned 模板、遊戲類型、設定欄位、前台顯示與測試頁狀態。',
    items: [
      'active 模板',
      'planned 模板',
      '遊戲類型',
      '設定欄位',
      '顯示狀態',
      '測試入口',
      '同步基準',
      '下一步提示'
    ]
  },
  {
    key: 'player-test',
    title: '玩家頁測試流程',
    icon: '🎮',
    description: '用測試入口驗證玩家頁畫面、PlayBoard 區塊、提示文案、狀態卡與安全隔離。',
    items: [
      '玩家頁總覽',
      'PlayBoard 測試',
      '結果顯示',
      '活動資訊',
      '獎品提示',
      '錯誤狀態',
      '響應式檢查',
      '正式頁隔離'
    ]
  },
  {
    key: 'delivery-rule',
    title: '整份交付規則',
    icon: '📦',
    description: '穩定整理型功能直接給完整 TXT，避免一段一段貼造成漏貼或版本不同步。',
    items: [
      '整份 TXT',
      '全選複製',
      '整份覆蓋',
      '少拆小段',
      '正常後再下一份',
      '錯誤先補修正版',
      '保留基準',
      '新對話可延續'
    ]
  },
  {
    key: 'safe-rule',
    title: '正式頁安全隔離',
    icon: '🔒',
    description: '測試入口只負責驗證，不直接改正式玩家頁、正式路由、API、DB 或抽獎核心。',
    items: [
      '不動正式頁',
      '不動 router',
      '不動 API',
      '不動 DB',
      '不動登入權限',
      '不動機率核心',
      '測試頁隔離',
      '正式接入前再檢查'
    ]
  }
])

const frontCompleteSafeRules = computed(() => [
  '測試網址固定使用 /dev/common-game-player-test',
  '正式 WheelGameView.vue 不在本批修改',
  '正式 PremiumGridLotteryView.vue 不在本批修改',
  'router/index.js 不在本批修改',
  'API 與 DB 不在本批修改',
  '登入、tenant 權限不在本批修改',
  '抽獎機率核心不在本批修改',
  '穩定整理可以整份 TXT 交付',
  '有錯誤先補修正版',
  '正式接入前需要再做一次安全檢查'
])

















const quickLinks = [
  {
    label: '前台公用測試入口',
    description: '目前這一頁，用來測 CommonGamePlayerView。',
    url: '/dev/common-game-player-test',
    icon: '🧩',
    type: 'current'
  },
  {
    label: '後台公用設定頁',
    description: '測後台設定同步到前台預覽。',
    url: '/admin/common-game-editor',
    icon: '🛠️',
    type: 'admin'
  },
  {
    label: '正式九宮格玩家頁',
    description: '確認正式玩家頁沒有被公用測試影響。',
    url: '/play/a-shop/premium-grid',
    icon: '🎯',
    type: 'formal'
  }
]

const selectedGameOption = computed(() => {
  return gameOptions.value.find((item) => item.type === selectedGameType.value) || gameOptions.value[0]
})

const currentPlayBoardName = computed(() => {
  return selectedGameOption.value?.playBoardComponent || 'UnknownPlayBoard'
})

const demoCampaign = computed(() => {
  if (selectedGameType.value === 'egg-smash') {
    return {
      id: 'common-test-egg-smash',
      title: '砸金蛋公用玩家頁測試',
      subtitle: 'Egg Smash Common Player Test',
      description: '這個頁面用來測試砸金蛋套用前台公用玩家頁。玩法區使用 EggSmashPlayBoard，資訊、結果、紀錄、領獎仍走 CommonGamePlayerView。',
      statusText: '砸金蛋測試',
      tenantSlug: 'a-shop',
      brandName: 'Demo Shop',
      claimTitle: '砸金蛋領獎提醒',
      claimDescription: '中獎後請依活動頁面或店家公告完成領獎。',
      contactText: '如有問題請聯繫活動客服。',
      pageTitle: '砸金蛋公用玩家頁'
    }
  }

  if (selectedGameType.value === 'wheel') {
    return {
      id: 'common-test-wheel',
      title: '幸運輪盤公用玩家頁測試',
      subtitle: 'Wheel Common Player Test',
      description: '這個頁面用來測試幸運輪盤套用前台公用玩家頁。玩法區使用 WheelPlayBoard，資訊、結果、紀錄、領獎仍走 CommonGamePlayerView。',
      statusText: '輪盤測試',
      tenantSlug: 'a-shop',
      brandName: 'Demo Shop',
      claimTitle: '輪盤領獎提醒',
      claimDescription: '中獎後請依活動頁面或店家公告完成領獎。',
      contactText: '如有問題請聯繫活動客服。',
      pageTitle: '幸運輪盤公用玩家頁'
    }
  }

  return {
    id: 'common-test-premium-grid',
    title: '公用版九宮格測試入口',
    subtitle: 'Common Premium Grid Player Test',
    description: '這個頁面用來測試精緻九宮格套用前台公用玩家頁。玩法區使用 PremiumGridPlayBoard。',
    statusText: '九宮格測試',
    tenantSlug: 'a-shop',
    brandName: 'Demo Shop',
    claimTitle: '九宮格領獎提醒',
    claimDescription: '中獎後請依活動頁面或店家公告完成領獎。',
    contactText: '如有問題請聯繫活動客服。',
    pageTitle: '精緻九宮格公用玩家頁'
  }
})

const demoPlayer = computed(() => ({
  id: `demo-player-${selectedGameType.value}`,
  name: '測試玩家',
  chances: selectedGameType.value === 'egg-smash' ? 5 : selectedGameType.value === 'wheel' ? 4 : 3,
  usedChances: 0
}))

const premiumGridPrizes = computed(() => [
  {
    id: 1,
    name: '優惠券 100 元',
    title: '優惠券 100 元',
    shortName: '100 元',
    icon: '🎁',
    quantity: 10,
    remaining: 10
  },
  {
    id: 2,
    name: '限定小禮',
    title: '限定小禮',
    shortName: '小禮',
    icon: '✨',
    quantity: 5,
    remaining: 5
  },
  {
    id: 3,
    name: '品牌折扣',
    title: '品牌折扣',
    shortName: '折扣',
    icon: '🏷️',
    quantity: 20,
    remaining: 20
  },
  {
    id: 4,
    name: '會員點數',
    title: '會員點數',
    shortName: '點數',
    icon: '⭐',
    quantity: 30,
    remaining: 30
  },
  {
    id: 5,
    name: '立即抽獎',
    title: '立即抽獎',
    shortName: '抽獎',
    icon: '🎯',
    quantity: 999,
    remaining: 999,
    isCenter: true
  },
  {
    id: 6,
    name: '再接再厲',
    title: '再接再厲',
    shortName: '再來',
    icon: '🍀',
    quantity: 999,
    remaining: 999
  },
  {
    id: 7,
    name: '飲品兌換',
    title: '飲品兌換',
    shortName: '飲品',
    icon: '🥤',
    quantity: 12,
    remaining: 12
  },
  {
    id: 8,
    name: '神秘好禮',
    title: '神秘好禮',
    shortName: '好禮',
    icon: '🎊',
    quantity: 3,
    remaining: 3
  },
  {
    id: 9,
    name: '下次優惠',
    title: '下次優惠',
    shortName: '優惠',
    icon: '💎',
    quantity: 18,
    remaining: 18
  }
])

const eggSmashPrizes = computed(() => [
  {
    id: 1,
    name: '金蛋大獎',
    title: '金蛋大獎',
    shortName: '大獎',
    icon: '🏆',
    quantity: 3,
    remaining: 3
  },
  {
    id: 2,
    name: '優惠券 100 元',
    title: '優惠券 100 元',
    shortName: '100 元',
    icon: '🎁',
    quantity: 20,
    remaining: 20
  },
  {
    id: 3,
    name: '限定飲品',
    title: '限定飲品',
    shortName: '飲品',
    icon: '🥤',
    quantity: 12,
    remaining: 12
  },
  {
    id: 4,
    name: '會員點數',
    title: '會員點數',
    shortName: '點數',
    icon: '⭐',
    quantity: 30,
    remaining: 30
  },
  {
    id: 5,
    name: '神秘禮物',
    title: '神秘禮物',
    shortName: '神秘',
    icon: '🎊',
    quantity: 5,
    remaining: 5
  },
  {
    id: 6,
    name: '品牌折扣',
    title: '品牌折扣',
    shortName: '折扣',
    icon: '🏷️',
    quantity: 16,
    remaining: 16
  },
  {
    id: 7,
    name: '下次優惠',
    title: '下次優惠',
    shortName: '優惠',
    icon: '💎',
    quantity: 18,
    remaining: 18
  },
  {
    id: 8,
    name: '限定小禮',
    title: '限定小禮',
    shortName: '小禮',
    icon: '✨',
    quantity: 8,
    remaining: 8
  },
  {
    id: 9,
    name: '再接再厲',
    title: '再接再厲',
    shortName: '再來',
    icon: '🍀',
    quantity: 999,
    remaining: 999
  }
])

const wheelPrizes = computed(() => [
  {
    id: 1,
    name: '輪盤大獎',
    title: '輪盤大獎',
    shortName: '大獎',
    icon: '🏆',
    quantity: 2,
    remaining: 2
  },
  {
    id: 2,
    name: '優惠券 200 元',
    title: '優惠券 200 元',
    shortName: '200 元',
    icon: '🎁',
    quantity: 8,
    remaining: 8
  },
  {
    id: 3,
    name: '限定飲品',
    title: '限定飲品',
    shortName: '飲品',
    icon: '🥤',
    quantity: 12,
    remaining: 12
  },
  {
    id: 4,
    name: '會員點數',
    title: '會員點數',
    shortName: '點數',
    icon: '⭐',
    quantity: 30,
    remaining: 30
  },
  {
    id: 5,
    name: '品牌折扣',
    title: '品牌折扣',
    shortName: '折扣',
    icon: '🏷️',
    quantity: 16,
    remaining: 16
  },
  {
    id: 6,
    name: '再接再厲',
    title: '再接再厲',
    shortName: '再來',
    icon: '🍀',
    quantity: 999,
    remaining: 999
  }
])

const demoPrizes = computed(() => {
  if (selectedGameType.value === 'egg-smash') return eggSmashPrizes.value
  if (selectedGameType.value === 'wheel') return wheelPrizes.value

  return premiumGridPrizes.value
})

const demoRules = computed(() => {
  if (selectedGameType.value === 'egg-smash') {
    return [
      '玩家選擇金蛋後，點擊立即砸蛋進入抽獎流程。',
      '砸金蛋玩法區只負責互動與動畫，正式結果由公用玩家頁處理。',
      '獎品、規則、領獎、紀錄與結果彈窗共用 CommonGamePlayerView。',
      '這是安全測試入口，不會取代正式玩家頁。'
    ]
  }

  if (selectedGameType.value === 'wheel') {
    return [
      '玩家點擊立即轉動後，輪盤會旋轉並停在其中一個獎項。',
      '輪盤玩法區只負責互動與動畫，正式結果由公用玩家頁處理。',
      '獎品、規則、領獎、紀錄與結果彈窗共用 CommonGamePlayerView。',
      '這是安全測試入口，不會取代正式 WheelGameView.vue。'
    ]
  }

  return [
    '玩家點擊九宮格中間按鈕開始抽獎。',
    '九宮格玩法區只負責互動與動畫，正式結果由公用玩家頁處理。',
    '獎品、規則、領獎、紀錄與結果彈窗共用 CommonGamePlayerView。',
    '這是安全測試入口，不會取代正式玩家頁。'
  ]
})

const demoClaimInfo = computed(() => {
  if (selectedGameType.value === 'egg-smash') {
    return {
      title: '砸金蛋領獎提醒',
      description: '中獎後請依照活動頁面提示或店家公告完成領獎。',
      contactText: '正式活動會改成讀取後台設定的客服資訊與領獎說明。'
    }
  }

  if (selectedGameType.value === 'wheel') {
    return {
      title: '輪盤領獎提醒',
      description: '中獎後請依照活動頁面提示或店家公告完成領獎。',
      contactText: '正式活動會改成讀取後台設定的客服資訊與領獎說明。'
    }
  }

  return {
    title: '九宮格領獎提醒',
    description: '中獎後請依照活動頁面提示或店家公告完成領獎。',
    contactText: '正式活動會改成讀取後台設定的客服資訊與領獎說明。'
  }
})

const eggSmashOptions = computed(() => ({
  eggCount: 9,
  hammerEnabled: true,
  brokenEggEffect: 'gold-particles',
  buttonText: '立即砸蛋'
}))

const wheelOptions = computed(() => ({
  buttonText: '立即轉動',
  spinDuration: 2800
}))

const generateNewChatPrompt = () => {
  newChatPromptVisible.value = true
  addEventLog('產生前台測試入口讀取精緻九宮格正式接入前安全檢查')
}

const copyNewChatPrompt = async () => {
  try {
    await navigator.clipboard.writeText(newChatPromptText.value)
    addEventLog('新對話延續提示已複製到剪貼簿')
  } catch (error) {
    addEventLog('新對話延續提示複製失敗，請手動選取複製')
  }
}

const downloadNewChatPromptTxt = () => {
  if (!newChatPromptVisible.value) {
    generateNewChatPrompt()
  }

  const fileName = 'common_template_new_chat_prompt_v23_batch362.txt'
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

  addEventLog(`下載新對話延續提示 TXT：${fileName}`)
}

const addEventLog = (text) => {
  eventLogs.value.unshift({
    id: `event-${Date.now()}-${Math.random()}`,
    text,
    time: new Date().toLocaleString('zh-TW')
  })
}

const switchGame = (type) => {
  selectedGameType.value = type
  testLogs.value = []

  addEventLog(`切換測試遊戲：${type}`)
}

const handleDraw = (payload) => {
  addEventLog(`收到 CommonGamePlayerView 抽獎事件：${payload?.gameType || selectedGameType.value}`)

  const gameIconMap = {
    'egg-smash': '🥚',
    wheel: '🎡',
    'premium-grid': '🧩'
  }

  const gameTextMap = {
    'egg-smash': '砸金蛋測試抽獎',
    wheel: '輪盤測試抽獎',
    'premium-grid': '九宮格測試抽獎'
  }

  testLogs.value.unshift({
    id: `draw-${Date.now()}`,
    prizeName: gameTextMap[selectedGameType.value] || '公用測試抽獎',
    name: gameTextMap[selectedGameType.value] || '公用測試抽獎',
    icon: gameIconMap[selectedGameType.value] || '🎮',
    createdAt: new Date().toLocaleString('zh-TW')
  })
}

const handleCloseResult = (result) => {
  const name = result?.name || result?.title || '未知結果'

  addEventLog(`結果彈窗已關閉：${name}`)
}

const clearEventLogs = () => {
  eventLogs.value = [
    {
      id: `clear-${Date.now()}`,
      text: '事件紀錄已清空',
      time: new Date().toLocaleString('zh-TW')
    }
  ]
}

const openLink = (url) => {
  window.open(url, '_blank', 'noopener,noreferrer')
  addEventLog(`開啟快速連結：${url}`)
}

const handleCommonPlayBoardPlay = (template) => {
  console.log('Common PlayBoard play:', template)
}

const handleCommonPlayBoardPreview = (template) => {
  console.log('Common PlayBoard preview:', template)
}

const handleCommonPlayBoardReset = (template) => {
  console.log('Common PlayBoard reset:', template)
}

const handleCommonPlayBoardOpenAdmin = (template) => {
  const url = createCommonGameAdminUrl(template?.type || 'GRID')
  window.open(url, '_blank', 'noopener,noreferrer')
}

const handleCommonPlayBoardOpenTest = (template) => {
  const url = createCommonGameTestUrl(template?.type || 'GRID')
  window.open(url, '_blank', 'noopener,noreferrer')
}

</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <section class="border-b border-white/10 bg-slate-950 px-4 py-5 sm:px-6 lg:px-8">
      <div class="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div class="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-200">
            <span>🎡</span>
            <span>V2.3 第 362 批</span>
            <span class="text-cyan-400/60">｜</span>
            <span>前台測試入口讀取精緻九宮格正式接入前安全檢查</span>
          </div>

          <h1 class="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
            CommonGamePlayerView 測試入口
          </h1>
          <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            這個頁面專門測試前台公用玩家頁。這批從第 340 批正常版延續，整理成前台測試入口讀取精緻九宮格正式接入前安全檢查版，並與後台第 343 批對齊。
          </p>
        </div>

        <div class="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
          <p class="font-black text-white">
            目前測試：{{ selectedGameOption.icon }} {{ selectedGameOption.label }}
          </p>
          <p class="mt-1 text-slate-300">PlayBoard：{{ currentPlayBoardName }}</p>
        </div>
      </div>
    </section>

    <section class="bg-slate-900/80 px-4 py-4 sm:px-6 lg:px-8">
      <div class="mx-auto grid max-w-6xl gap-3 md:grid-cols-4">
        <div class="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
          <p class="text-xs font-black text-emerald-200">安全狀態</p>
          <p class="mt-1 text-lg font-black text-white">不影響正式頁</p>
        </div>

        <div class="rounded-2xl border border-indigo-400/20 bg-indigo-400/10 p-4">
          <p class="text-xs font-black text-indigo-200">目前遊戲</p>
          <p class="mt-1 text-lg font-black text-white">{{ selectedGameOption.label }}</p>
        </div>

        <div class="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
          <p class="text-xs font-black text-amber-200">目前 PlayBoard</p>
          <p class="mt-1 text-lg font-black text-white">{{ currentPlayBoardName }}</p>
        </div>

        <div class="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
          <p class="text-xs font-black text-cyan-200">測試網址</p>
          <p class="mt-1 text-lg font-black text-white">/dev/common-game-player-test</p>
        </div>
      </div>
    </section>

    <section class="bg-slate-950 px-4 py-5 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-4 shadow-2xl sm:p-5">
        <div class="mb-4">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-emerald-300">
            PremiumGrid Formal Safety Check
          </p>
          <h2 class="mt-1 text-2xl font-black text-white">
            前台測試入口讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm leading-6 text-emerald-100">
            第 362 批讀取 premiumGridCommonFormalSafetyCheck.js，確認正式接入前的 critical checks、階段表與正式頁鎖定狀態。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div
            v-for="card in premiumGridFormalSafetyStatusCards"
            :key="card.label"
            class="rounded-2xl border border-emerald-300/20 bg-slate-950/50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-emerald-200">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-white">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 grid gap-4 lg:grid-cols-3">
          <div
            v-for="group in premiumGridFormalSafetyFlowGroups"
            :key="group.key"
            class="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-5"
          >
            <div class="flex items-start gap-3">
              <div class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-2xl">
                {{ group.icon }}
              </div>
              <div>
                <h3 class="font-black text-white">{{ group.title }}</h3>
                <p class="mt-1 text-sm leading-6 text-slate-300">{{ group.description }}</p>
              </div>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="item in group.items"
                :key="item"
                class="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200"
              >
                {{ item }}
              </span>
            </div>
          </div>
        </div>

        <div class="mt-5 grid gap-4 lg:grid-cols-2">
          <div class="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-5">
            <p class="font-black text-emerald-200">Critical Checks</p>
            <div class="mt-4 space-y-2">
              <div
                v-for="check in premiumGridFormalCriticalChecks"
                :key="check.key"
                class="rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold"
                :class="check.passed ? 'text-emerald-100' : 'text-rose-100'"
              >
                {{ check.passed ? '✅' : '❌' }} {{ check.label }}｜{{ check.message }}
              </div>
            </div>
          </div>

          <div class="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-5">
            <p class="font-black text-sky-200">正式接入階段表</p>
            <div class="mt-4 space-y-2">
              <div
                v-for="phase in premiumGridFormalSafetyPhaseCards"
                :key="phase.label"
                class="rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-slate-100"
              >
                {{ phase.icon }} {{ phase.label }}｜{{ phase.value }}
                <p class="mt-1 text-xs leading-5 text-slate-300">{{ phase.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-5 grid gap-4 lg:grid-cols-2">
          <div class="rounded-[1.5rem] border border-rose-300/20 bg-rose-400/10 p-5">
            <p class="font-black text-rose-200">Critical Rules</p>
            <div class="mt-4 space-y-2">
              <div
                v-for="rule in premiumGridFormalCriticalRules"
                :key="rule.key"
                class="rounded-2xl bg-slate-950/50 px-4 py-3 text-sm font-bold text-rose-100"
              >
                🔒 {{ rule.label }}｜{{ rule.description }}
              </div>
            </div>
          </div>

          <div class="rounded-[1.5rem] border border-amber-300/20 bg-amber-400/10 p-5">
            <p class="font-black text-amber-200">Recommended Rules</p>
            <div class="mt-4 space-y-2">
              <div
                v-for="rule in premiumGridFormalRecommendedRules"
                :key="rule.key"
                class="rounded-2xl bg-slate-950/50 px-4 py-3 text-sm font-bold text-amber-100"
              >
                💡 {{ rule.label }}｜{{ rule.description }}
              </div>
            </div>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-5 text-sm leading-6 text-emerald-100">
          <p class="font-black text-emerald-200">第 362 批結論</p>
          <p class="mt-2">
            {{ premiumGridFormalSafetySummary.conclusion }}
          </p>
        </div>
      </div>
    </section>

    <section class="bg-slate-950 px-4 py-5 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl rounded-[2rem] border border-violet-400/20 bg-violet-400/10 p-4 shadow-2xl sm:p-5">
        <div class="mb-4">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-violet-300">
            PremiumGrid Common Adapter
          </p>
          <h2 class="mt-1 text-2xl font-black text-white">
            前台測試入口讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm leading-6 text-violet-100">
            第 359 批讀取 commonGamePremiumGridAdapter.js，先在測試入口驗證 GRID 共用模板，不修改正式九宮格玩家頁。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div
            v-for="card in premiumGridAdapterStatusCards"
            :key="card.label"
            class="rounded-2xl border border-violet-300/20 bg-slate-950/50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-violet-200">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-white">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 grid gap-4 lg:grid-cols-3">
          <div
            v-for="group in premiumGridAdapterFlowGroups"
            :key="group.key"
            class="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-5"
          >
            <div class="flex items-start gap-3">
              <div class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-2xl">
                {{ group.icon }}
              </div>
              <div>
                <h3 class="font-black text-white">{{ group.title }}</h3>
                <p class="mt-1 text-sm leading-6 text-slate-300">{{ group.description }}</p>
              </div>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="item in group.items"
                :key="item"
                class="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200"
              >
                {{ item }}
              </span>
            </div>
          </div>
        </div>

        <div class="mt-5 grid gap-4 lg:grid-cols-2">
          <div class="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-5">
            <p class="font-black text-violet-200">GRID 前台摘要卡</p>
            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <div
                v-for="card in premiumGridFrontCards"
                :key="card.label"
                class="rounded-2xl border border-white/10 bg-white/10 p-4"
              >
                <p class="text-2xl">{{ card.icon }}</p>
                <p class="mt-2 text-xs font-black text-slate-300">{{ card.label }}</p>
                <p class="mt-1 line-clamp-2 text-sm font-black text-white">{{ card.value }}</p>
              </div>
            </div>
          </div>

          <div class="rounded-[1.5rem] border border-emerald-300/20 bg-emerald-400/10 p-5">
            <p class="font-black text-emerald-200">正式頁安全檢查</p>
            <div class="mt-4 space-y-2">
              <div
                v-for="check in premiumGridFormalSafeChecks"
                :key="check.key"
                class="rounded-2xl bg-slate-950/50 px-4 py-3 text-sm font-bold"
                :class="check.passed ? 'text-emerald-100' : 'text-rose-100'"
              >
                {{ check.passed ? '✅' : '❌' }} {{ check.label }}｜{{ check.message }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-slate-950 px-4 py-5 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl rounded-[2rem] border border-orange-400/20 bg-orange-400/10 p-4 shadow-2xl sm:p-5">
        <div class="mb-4">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-orange-300">
            Common PlayBoard Applied
          </p>
          <h2 class="mt-1 text-2xl font-black text-white">
            前台測試入口讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm leading-6 text-orange-100">
            第 356 批正式在測試入口套用 CommonGamePlayBoard.vue，確認共用玩家頁顯示區可以被前台使用。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="card in commonPlayBoardCards"
            :key="card.label"
            class="rounded-2xl border border-orange-300/20 bg-slate-950/50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-orange-200">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-white">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 grid gap-4 lg:grid-cols-3">
          <div
            v-for="group in commonPlayBoardFlowGroups"
            :key="group.key"
            class="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-5"
          >
            <div class="flex items-start gap-3">
              <div class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-2xl">
                {{ group.icon }}
              </div>
              <div>
                <h3 class="font-black text-white">{{ group.title }}</h3>
                <p class="mt-1 text-sm leading-6 text-slate-300">{{ group.description }}</p>
              </div>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="item in group.items"
                :key="item"
                class="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200"
              >
                {{ item }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-slate-950 px-4 py-5 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl">
        <CommonGamePlayBoard
          :template="commonPlayBoardTemplate"
          game-type="GRID"
          test-mode
          show-safe-rules
          show-next-steps
          @play="handleCommonPlayBoardPlay"
          @preview="handleCommonPlayBoardPreview"
          @reset="handleCommonPlayBoardReset"
          @open-admin="handleCommonPlayBoardOpenAdmin"
          @open-test="handleCommonPlayBoardOpenTest"
        />
      </div>
    </section>

    <section class="bg-slate-950 px-4 py-5 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl rounded-[2rem] border border-teal-400/20 bg-teal-400/10 p-4 shadow-2xl sm:p-5">
        <div class="mb-4">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-teal-300">
            Front Complete Integration Read Completed
          </p>
          <h2 class="mt-1 text-2xl font-black text-white">
            前台測試入口讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm leading-6 text-teal-100">
            第 350 批讀取 gameTemplateConfig.js 第 348 批備份，確認後台第 349 批與前台測試入口第 350 批已對齊。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="card in frontCompleteIntegrationReadCompletedCards"
            :key="card.label"
            class="rounded-2xl border border-teal-300/20 bg-slate-950/50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-teal-200">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-white">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 grid gap-4 lg:grid-cols-2">
          <div
            v-for="group in frontCompleteIntegrationReadCompletedGroups"
            :key="group.key"
            class="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-5"
          >
            <div class="flex items-start gap-3">
              <div class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-2xl">
                {{ group.icon }}
              </div>
              <div>
                <h3 class="font-black text-white">{{ group.title }}</h3>
                <p class="mt-1 text-sm leading-6 text-slate-300">{{ group.description }}</p>
              </div>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="item in group.items"
                :key="item"
                class="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200"
              >
                {{ item }}
              </span>
            </div>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-emerald-300/20 bg-emerald-400/10 p-5">
          <p class="font-black text-emerald-200">第 348 批安全規則讀取</p>
          <div class="mt-3 grid gap-2 md:grid-cols-2">
            <div
              v-for="rule in frontCompleteIntegrationReadCompletedSafeRules"
              :key="rule"
              class="rounded-2xl bg-slate-950/50 px-4 py-3 text-sm font-bold text-emerald-100"
            >
              ✅ {{ rule }}
            </div>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-teal-300/20 bg-slate-950/50 p-5 text-sm leading-6 text-teal-100">
          <p class="font-black text-teal-200">第 350 批說明</p>
          <p class="mt-2">
            這批只讓前台測試入口讀取第 348 批完整整合前後台讀取完成穩定備份，不修改正式頁、不修改 router、不修改 API、不修改 DB。
          </p>
        </div>
      </div>
    </section>

    <section class="bg-slate-950 px-4 py-5 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl rounded-[2rem] border border-indigo-400/20 bg-indigo-400/10 p-4 shadow-2xl sm:p-5">
        <div class="mb-4">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-indigo-300">
            Front Complete Integration Stable Backup
          </p>
          <h2 class="mt-1 text-2xl font-black text-white">
            前台測試入口讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm leading-6 text-indigo-100">
            第 347 批讀取 gameTemplateConfig.js 第 346-1 批修正版，確認後台第 343 / 346 批與前台第 344 批完整整合狀態。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="card in frontCompleteIntegrationStableCards"
            :key="card.label"
            class="rounded-2xl border border-indigo-300/20 bg-slate-950/50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-indigo-200">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-white">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 grid gap-4 lg:grid-cols-2">
          <div
            v-for="group in frontCompleteIntegrationStableGroups"
            :key="group.key"
            class="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-5"
          >
            <div class="flex items-start gap-3">
              <div class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-2xl">
                {{ group.icon }}
              </div>
              <div>
                <h3 class="font-black text-white">{{ group.title }}</h3>
                <p class="mt-1 text-sm leading-6 text-slate-300">{{ group.description }}</p>
              </div>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="item in group.items"
                :key="item"
                class="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200"
              >
                {{ item }}
              </span>
            </div>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-emerald-300/20 bg-emerald-400/10 p-5">
          <p class="font-black text-emerald-200">第 346-1 批安全規則讀取</p>
          <div class="mt-3 grid gap-2 md:grid-cols-2">
            <div
              v-for="rule in frontCompleteIntegrationStableSafeRules"
              :key="rule"
              class="rounded-2xl bg-slate-950/50 px-4 py-3 text-sm font-bold text-emerald-100"
            >
              ✅ {{ rule }}
            </div>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-indigo-300/20 bg-slate-950/50 p-5 text-sm leading-6 text-indigo-100">
          <p class="font-black text-indigo-200">第 347 批說明</p>
          <p class="mt-2">
            這批只讓前台測試入口讀取精緻九宮格正式接入前安全檢查，不修改正式頁、不修改 router、不修改 API、不修改 DB。
          </p>
        </div>
      </div>
    </section>

    <section class="bg-slate-950 px-4 py-5 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl rounded-[2rem] border border-rose-400/20 bg-rose-400/10 p-4 shadow-2xl sm:p-5">
        <div class="mb-4">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-rose-300">
            Front Complete Integration
          </p>
          <h2 class="mt-1 text-2xl font-black text-white">
            前台測試入口讀取精緻九宮格正式接入前安全檢查版
          </h2>
          <p class="mt-1 text-sm leading-6 text-rose-100">
            第 344 批把前台測試入口整理成完整中控台，用來驗證模板、玩家頁、測試流程與正式頁隔離狀態。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="card in frontCompleteIntegrationCards"
            :key="card.label"
            class="rounded-2xl border border-rose-300/20 bg-slate-950/50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-rose-200">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-white">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 grid gap-4 lg:grid-cols-2">
          <div
            v-for="group in frontCompleteIntegrationGroups"
            :key="group.key"
            class="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-5"
          >
            <div class="flex items-start gap-3">
              <div class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-2xl">
                {{ group.icon }}
              </div>
              <div>
                <h3 class="font-black text-white">{{ group.title }}</h3>
                <p class="mt-1 text-sm leading-6 text-slate-300">{{ group.description }}</p>
              </div>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="item in group.items"
                :key="item"
                class="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200"
              >
                {{ item }}
              </span>
            </div>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-emerald-300/20 bg-emerald-400/10 p-5">
          <p class="font-black text-emerald-200">正式頁安全隔離清單</p>
          <div class="mt-3 grid gap-2 md:grid-cols-2">
            <div
              v-for="rule in frontCompleteSafeRules"
              :key="rule"
              class="rounded-2xl bg-slate-950/50 px-4 py-3 text-sm font-bold text-emerald-100"
            >
              ✅ {{ rule }}
            </div>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-rose-300/20 bg-slate-950/50 p-5 text-sm leading-6 text-rose-100">
          <p class="font-black text-rose-200">第 344 批說明</p>
          <p class="mt-2">
            這批從第 340 批正常版延續，並與第 343 批後台完整整合版對齊。之後穩定整理型功能會優先用整份 TXT 交付。
          </p>
        </div>
      </div>
    </section>

    <section class="bg-slate-950 px-4 py-5 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl rounded-[2rem] border border-lime-400/20 bg-lime-400/10 p-4 shadow-2xl sm:p-5">
        <div class="mb-4">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-lime-300">
            Bulk 150-200 Synced Total Aligned
          </p>
          <h2 class="mt-1 text-2xl font-black text-white">
            前台測試入口讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm leading-6 text-lime-100">
            這段資料來自 gameTemplateConfig.js 的 getCommonTemplateBulk150200SyncedTotalAlignedCheckpoint()。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-9">
          <div
            v-for="card in bulk150200SyncedTotalAlignedCards"
            :key="card.label"
            class="rounded-2xl border border-lime-300/20 bg-slate-950/50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-lime-200">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-white">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-lime-300/20 bg-slate-950/50 p-5 text-sm leading-6 text-lime-100">
          <p class="font-black text-lime-200">第 340 批說明</p>
          <p class="mt-2">
            前台測試入口已讀取第 338 批前後台總對齊基準：設定檔第 338 批、後台第 336 批、前台測試入口第 337 批已完成 150～200 項同步完成穩定備份前後台總對齊。
          </p>
        </div>
      </div>
    </section>

    <section class="bg-slate-950 px-4 py-5 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl rounded-[2rem] border border-amber-400/20 bg-amber-400/10 p-4 shadow-2xl sm:p-5">
        <div class="mb-4">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-amber-300">
            Bulk 150-200 Synced Aligned
          </p>
          <h2 class="mt-1 text-2xl font-black text-white">
            前台測試入口讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm leading-6 text-amber-100">
            這段資料來自 gameTemplateConfig.js 的 getCommonTemplateBulk150200SyncedAlignedCheckpoint()。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-9">
          <div
            v-for="card in bulk150200SyncedAlignedCards"
            :key="card.label"
            class="rounded-2xl border border-amber-300/20 bg-slate-950/50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-amber-200">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-white">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-amber-300/20 bg-slate-950/50 p-5 text-sm leading-6 text-amber-100">
          <p class="font-black text-amber-200">第 337 批說明</p>
          <p class="mt-2">
            前台測試入口已讀取第 335 批前後台對齊基準：設定檔第 335 批、後台第 333 批、前台測試入口第 334 批已完成 150～200 項同步完成穩定備份前後台對齊。
          </p>
        </div>
      </div>
    </section>

    <section class="bg-slate-950 px-4 py-5 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl rounded-[2rem] border border-sky-400/20 bg-sky-400/10 p-4 shadow-2xl sm:p-5">
        <div class="mb-4">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-sky-300">
            Bulk 150-200 Synced Stable Total
          </p>
          <h2 class="mt-1 text-2xl font-black text-white">
            前台測試入口讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm leading-6 text-sky-100">
            這段資料來自 gameTemplateConfig.js 的 getCommonTemplateBulk150200SyncedStableTotalCheckpoint()。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-9">
          <div
            v-for="card in bulk150200SyncedStableTotalCards"
            :key="card.label"
            class="rounded-2xl border border-sky-300/20 bg-slate-950/50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-sky-200">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-white">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-sky-300/20 bg-slate-950/50 p-5 text-sm leading-6 text-sky-100">
          <p class="font-black text-sky-200">第 334 批說明</p>
          <p class="mt-2">
            前台測試入口已讀取第 332 批總基準：設定檔第 332 批、後台第 330 批、前台測試入口第 331 批已完成 150～200 項同步完成穩定備份總基準。
          </p>
        </div>
      </div>
    </section>

    <section class="bg-slate-950 px-4 py-5 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl rounded-[2rem] border border-purple-400/20 bg-purple-400/10 p-4 shadow-2xl sm:p-5">
        <div class="mb-4">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-purple-300">
            Bulk 150-200 Synced Completed Stable
          </p>
          <h2 class="mt-1 text-2xl font-black text-white">
            前台測試入口讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm leading-6 text-purple-100">
            這段資料來自 gameTemplateConfig.js 的 getCommonTemplateBulk150200SyncedCompletedStableCheckpoint()。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-9">
          <div
            v-for="card in bulk150200SyncedCompletedStableCards"
            :key="card.label"
            class="rounded-2xl border border-purple-300/20 bg-slate-950/50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-purple-200">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-white">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-purple-300/20 bg-slate-950/50 p-5 text-sm leading-6 text-purple-100">
          <p class="font-black text-purple-200">第 331 批說明</p>
          <p class="mt-2">
            前台測試入口已讀取第 329 批穩定備份：設定檔第 329 批、後台第 327 批、前台測試入口第 328 批已完成 150～200 項最終總基準前後台同步完成穩定備份。
          </p>
        </div>
      </div>
    </section>

    <section class="bg-slate-950 px-4 py-5 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl rounded-[2rem] border border-fuchsia-400/20 bg-fuchsia-400/10 p-4 shadow-2xl sm:p-5">
        <div class="mb-4">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-fuchsia-300">
            Bulk 150-200 Synced Completed
          </p>
          <h2 class="mt-1 text-2xl font-black text-white">
            前台測試入口讀取精緻九宮格正式接入前安全檢查版
          </h2>
          <p class="mt-1 text-sm leading-6 text-fuchsia-100">
            這段資料來自 gameTemplateConfig.js 的 getCommonTemplateBulk150200SyncedCompletedCheckpoint()。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-9">
          <div
            v-for="card in bulk150200SyncedCompletedCards"
            :key="card.label"
            class="rounded-2xl border border-fuchsia-300/20 bg-slate-950/50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-fuchsia-200">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-white">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-fuchsia-300/20 bg-slate-950/50 p-5 text-sm leading-6 text-fuchsia-100">
          <p class="font-black text-fuchsia-200">第 328 批說明</p>
          <p class="mt-2">
            前台測試入口已讀取第 326 批同步完成基準：設定檔第 326 批、後台第 324 批、前台測試入口第 325 批已完成 150～200 項最終總基準前後台同步完成版。
          </p>
        </div>
      </div>
    </section>

    <section class="bg-slate-950 px-4 py-5 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl rounded-[2rem] border border-violet-400/20 bg-violet-400/10 p-4 shadow-2xl sm:p-5">
        <div class="mb-4">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-violet-300">
            Bulk 150-200 Final Total
          </p>
          <h2 class="mt-1 text-2xl font-black text-white">
            前台測試入口讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm leading-6 text-violet-100">
            這段資料來自 gameTemplateConfig.js 的 getCommonTemplateBulk150200FinalTotalCheckpoint()。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-9">
          <div
            v-for="card in bulk150200FinalTotalCards"
            :key="card.label"
            class="rounded-2xl border border-violet-300/20 bg-slate-950/50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-violet-200">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-white">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-violet-300/20 bg-slate-950/50 p-5 text-sm leading-6 text-violet-100">
          <p class="font-black text-violet-200">第 325 批說明</p>
          <p class="mt-2">
            前台測試入口已讀取第 323 批最終總基準：設定檔第 323 批、後台第 321 批、前台測試入口第 322 批已完成 150～200 項前後台完成最終總基準。
          </p>
        </div>
      </div>
    </section>

    <section class="bg-slate-950 px-4 py-5 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl rounded-[2rem] border border-blue-400/20 bg-blue-400/10 p-4 shadow-2xl sm:p-5">
        <div class="mb-4">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-blue-300">
            Bulk 150-200 Total Completed
          </p>
          <h2 class="mt-1 text-2xl font-black text-white">
            前台測試入口讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm leading-6 text-blue-100">
            這段資料來自 gameTemplateConfig.js 的 getCommonTemplateBulk150200TotalCompletedCheckpoint()。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-9">
          <div
            v-for="card in bulk150200TotalCompletedCards"
            :key="card.label"
            class="rounded-2xl border border-blue-300/20 bg-slate-950/50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-blue-200">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-white">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-blue-300/20 bg-slate-950/50 p-5 text-sm leading-6 text-blue-100">
          <p class="font-black text-blue-200">第 322 批說明</p>
          <p class="mt-2">
            前台測試入口已讀取第 320 批總穩定備份：設定檔第 320 批、後台第 318 批、前台測試入口第 319 批已完成 150～200 項前後台完成總穩定備份。
          </p>
        </div>
      </div>
    </section>

    <section class="bg-slate-950 px-4 py-5 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl rounded-[2rem] border border-cyan-400/20 bg-cyan-400/10 p-4 shadow-2xl sm:p-5">
        <div class="mb-4">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
            Bulk 150-200 Completed Checkpoint
          </p>
          <h2 class="mt-1 text-2xl font-black text-white">
            前台測試入口讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm leading-6 text-cyan-100">
            這段資料來自 gameTemplateConfig.js 的 getCommonTemplateBulk150200CompletedCheckpoint()。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-9">
          <div
            v-for="card in bulk150200CompletedCards"
            :key="card.label"
            class="rounded-2xl border border-cyan-300/20 bg-slate-950/50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-cyan-200">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-white">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-cyan-300/20 bg-slate-950/50 p-5 text-sm leading-6 text-cyan-100">
          <p class="font-black text-cyan-200">第 319 批說明</p>
          <p class="mt-2">
            前台測試入口已讀取第 317 批完成備份：設定檔第 317 批、後台第 315 批、前台測試入口第 316 批已完成 150～200 項模式前後台完成備份。
          </p>
        </div>
      </div>
    </section>

    <section class="bg-slate-950 px-4 py-5 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-4 shadow-2xl sm:p-5">
        <div class="mb-4">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-emerald-300">
            Bulk 150-200 Final Safe
          </p>
          <h2 class="mt-1 text-2xl font-black text-white">
            前台測試入口讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm leading-6 text-emerald-100">
            這段資料來自 gameTemplateConfig.js 的 getCommonTemplateBulk150200FinalSafeCheckpoint()。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-9">
          <div
            v-for="card in bulk150200FinalSafeCards"
            :key="card.label"
            class="rounded-2xl border border-emerald-300/20 bg-slate-950/50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-emerald-200">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-white">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-emerald-300/20 bg-slate-950/50 p-5 text-sm leading-6 text-emerald-100">
          <p class="font-black text-emerald-200">第 316 批說明</p>
          <p class="mt-2">
            前台測試入口已讀取第 314 批最終安全基準：設定檔第 314 批、後台第 312 批、前台測試入口第 313 批已完成 150～200 項模式最終安全同步。
          </p>
        </div>
      </div>
    </section>

    <section class="bg-slate-950 px-4 py-5 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl rounded-[2rem] border border-indigo-400/20 bg-indigo-400/10 p-4 shadow-2xl sm:p-5">
        <div class="mb-4">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-indigo-300">
            Bulk 150-200 Total Stable
          </p>
          <h2 class="mt-1 text-2xl font-black text-white">
            前台測試入口讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm leading-6 text-indigo-100">
            這段資料來自 gameTemplateConfig.js 的 getCommonTemplateBulk150200TotalStableCheckpoint()。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-9">
          <div
            v-for="card in bulk150200TotalStableCards"
            :key="card.label"
            class="rounded-2xl border border-indigo-300/20 bg-slate-950/50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-indigo-200">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-white">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-indigo-300/20 bg-slate-950/50 p-5 text-sm leading-6 text-indigo-100">
          <p class="font-black text-indigo-200">第 313 批說明</p>
          <p class="mt-2">
            前台測試入口已讀取第 311 批總穩定備份：設定檔第 311 批、後台第 309 批、前台測試入口第 310 批已完成 150～200 項模式同步。
          </p>
        </div>
      </div>
    </section>

    <section class="bg-slate-950 px-4 py-5 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl rounded-[2rem] border border-teal-400/20 bg-teal-400/10 p-4 shadow-2xl sm:p-5">
        <div class="mb-4">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-teal-300">
            Bulk 150-200 Synced Stable
          </p>
          <h2 class="mt-1 text-2xl font-black text-white">
            前台測試入口讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm leading-6 text-teal-100">
            這段資料來自 gameTemplateConfig.js 的 getCommonTemplateBulk150200SyncedStableCheckpoint()。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-9">
          <div
            v-for="card in bulk150200SyncedStableCards"
            :key="card.label"
            class="rounded-2xl border border-teal-300/20 bg-slate-950/50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-teal-200">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-white">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-teal-300/20 bg-slate-950/50 p-5 text-sm leading-6 text-teal-100">
          <p class="font-black text-teal-200">第 310 批說明</p>
          <p class="mt-2">
            前台測試入口已讀取第 308 批同步基準：設定檔第 308 批、後台第 306 批、前台測試入口第 307 批已對齊。穩定整理可使用 150～200 項超大批次。
          </p>
        </div>
      </div>
    </section>

    <section class="bg-slate-950 px-4 py-5 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl rounded-[2rem] border border-orange-400/20 bg-orange-400/10 p-4 shadow-2xl sm:p-5">
        <div class="mb-4">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-orange-300">
            Bulk 150-200 Mode
          </p>
          <h2 class="mt-1 text-2xl font-black text-white">
            前台測試入口讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm leading-6 text-orange-100">
            這段資料來自 gameTemplateConfig.js 的 getCommonTemplateBulk150200Mode()。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-9">
          <div
            v-for="card in bulk150200SummaryCards"
            :key="card.label"
            class="rounded-2xl border border-orange-300/20 bg-slate-950/50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-orange-200">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-white">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="group in bulk150200ModeCheckpoint.superBatchGroups"
            :key="group.key"
            class="rounded-[1.25rem] border border-white/10 bg-slate-950/50 p-4"
          >
            <div class="flex items-center justify-between gap-3">
              <p class="font-black text-white">{{ group.label }}</p>
              <span class="rounded-full bg-orange-400/20 px-3 py-1 text-xs font-black text-orange-100">
                {{ group.targetCount }} 項
              </span>
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="item in group.items"
                :key="item"
                class="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200"
              >
                {{ item }}
              </span>
            </div>
          </div>
        </div>

        <div class="mt-5 grid gap-3 lg:grid-cols-2">
          <div class="rounded-[1.5rem] border border-emerald-300/20 bg-emerald-400/10 p-5 text-sm leading-6 text-emerald-100">
            <p class="font-black text-emerald-200">適合超大批次整理</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="scope in bulk150200ModeCheckpoint.allowedLargeBatchScopes"
                :key="scope"
                class="rounded-full bg-slate-950/40 px-3 py-1 text-xs font-bold"
              >
                {{ scope }}
              </span>
            </div>
          </div>

          <div class="rounded-[1.5rem] border border-rose-300/20 bg-rose-400/10 p-5 text-sm leading-6 text-rose-100">
            <p class="font-black text-rose-200">仍需保守分批</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="scope in bulk150200ModeCheckpoint.riskyBatchScopes"
                :key="scope"
                class="rounded-full bg-slate-950/40 px-3 py-1 text-xs font-bold"
              >
                {{ scope }}
              </span>
            </div>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-orange-300/20 bg-slate-950/50 p-5 text-sm leading-6 text-orange-100">
          <p class="font-black text-orange-200">第 307 批說明</p>
          <p class="mt-2">
            前台測試入口已讀取第 305 批寫入設定檔的 150～200 項超大批次整理策略，並與後台第 306 批對齊。
          </p>
        </div>
      </div>
    </section>

    <section class="bg-slate-950 px-4 py-5 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-4 shadow-2xl sm:p-5">
        <div class="mb-4">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-emerald-300">
            Bulk 40-50 Stable Checkpoint
          </p>
          <h2 class="mt-1 text-2xl font-black text-white">
            前台測試入口讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm leading-6 text-emerald-100">
            這段資料來自 gameTemplateConfig.js 的 getCommonTemplateBulk4050StableCheckpoint()。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <div
            v-for="card in bulk4050StableCards"
            :key="card.label"
            class="rounded-2xl border border-emerald-300/20 bg-slate-950/50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-emerald-200">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-white">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 rounded-[1.5rem] border border-emerald-300/20 bg-slate-950/50 p-5 text-sm leading-6 text-emerald-100">
          <p class="font-black text-emerald-200">第 302 批說明</p>
          <p class="mt-2">
            前台測試入口已讀取第 300 批的 40～50 項總穩定基準，並與後台第 301 批對齊。穩定時大批整理，錯誤時先縮小修正。
          </p>
        </div>
      </div>
    </section>

    <section class="bg-slate-950 px-4 py-5 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl rounded-[2rem] border border-rose-400/20 bg-rose-400/10 p-4 shadow-2xl sm:p-5">
        <div class="mb-4">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-rose-300">
            Bulk 40-50 Mode
          </p>
          <h2 class="mt-1 text-2xl font-black text-white">
            前台測試入口讀取精緻九宮格正式接入前安全檢查
          </h2>
          <p class="mt-1 text-sm leading-6 text-rose-100">
            這段資料來自 gameTemplateConfig.js 的 getCommonTemplateBulk4050Mode()。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <div
            v-for="card in bulk4050SummaryCards"
            :key="card.label"
            class="rounded-2xl border border-rose-300/20 bg-slate-950/50 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-rose-200">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-white">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-5 grid gap-3 lg:grid-cols-3">
          <div
            v-for="group in bulk4050ModeCheckpoint.checklistGroups"
            :key="group.key"
            class="rounded-[1.25rem] border border-white/10 bg-slate-950/50 p-4"
          >
            <div class="flex items-center justify-between gap-3">
              <p class="font-black text-white">{{ group.label }}</p>
              <span class="rounded-full bg-rose-400/20 px-3 py-1 text-xs font-black text-rose-100">
                {{ group.targetCount }} 項
              </span>
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="item in group.items"
                :key="item"
                class="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200"
              >
                {{ item }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-slate-950 px-4 py-5 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-4 shadow-2xl sm:p-5">
        <div class="mb-4">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-emerald-300">
            Batch 299 Bulk Sync Check
          </p>
          <h2 class="mt-1 text-2xl font-black text-white">
            前台測試入口總同步狀態
          </h2>
          <p class="mt-1 text-sm leading-6 text-emerald-100">
            這批開始後，穩定狀態每批建議一次整理 40～50 項；有錯誤時先小批修錯。
          </p>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div
            v-for="item in bulkSyncUpgradeItems"
            :key="item.id"
            class="rounded-2xl border border-emerald-300/20 bg-slate-950/50 p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-xs font-black text-emerald-200">{{ item.title }}</p>
                <p class="mt-1 truncate text-sm font-black text-white">{{ item.value }}</p>
              </div>
              <span class="text-2xl">{{ item.icon }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-slate-950 px-4 py-5 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-2xl sm:p-5">
        <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
              Quick Links
            </p>
            <h2 class="mt-1 text-2xl font-black text-white">
              前後台快速互通
            </h2>
            <p class="mt-1 text-sm text-slate-400">
              測試公用版時，可以快速開啟前台、後台與正式頁做對照。
            </p>
          </div>

          <button
            type="button"
            class="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-slate-200 hover:bg-white/10"
            @click="clearEventLogs"
          >
            清空事件紀錄
          </button>
        </div>

        <div class="grid gap-3 md:grid-cols-3">
          <button
            v-for="link in quickLinks"
            :key="link.url"
            type="button"
            class="rounded-2xl border border-white/10 bg-slate-900 p-4 text-left transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl"
            @click="openLink(link.url)"
          >
            <div class="flex items-start gap-3">
              <span class="text-3xl">{{ link.icon }}</span>
              <div>
                <p class="text-lg font-black text-white">{{ link.label }}</p>
                <p class="mt-1 text-sm leading-6 text-slate-400">{{ link.description }}</p>
                <p class="mt-2 text-xs font-black text-cyan-300">{{ link.url }}</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </section>

    <section class="bg-slate-950 px-4 py-5 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-2xl sm:p-5">
        <div class="mb-4">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
            Game Switch
          </p>
          <h2 class="mt-1 text-2xl font-black text-white">
            公用玩家頁遊戲切換
          </h2>
          <p class="mt-1 text-sm text-slate-400">
            用同一個 CommonGamePlayerView 測不同 PlayBoard。
          </p>
        </div>

        <div class="grid gap-3 md:grid-cols-3">
          <button
            v-for="game in gameOptions"
            :key="game.type"
            type="button"
            class="rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-xl"
            :class="selectedGameType === game.type
              ? 'border-cyan-300 bg-cyan-400/10 ring-4 ring-cyan-400/10'
              : 'border-white/10 bg-slate-900 hover:bg-slate-800'"
            @click="switchGame(game.type)"
          >
            <div class="flex items-start gap-3">
              <span class="text-3xl">{{ game.icon }}</span>
              <div>
                <p class="text-lg font-black text-white">{{ game.label }}</p>
                <p class="mt-1 text-sm leading-6 text-slate-400">{{ game.description }}</p>
                <p class="mt-2 text-xs font-black text-cyan-300">{{ game.type }}</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </section>

    <CommonGamePlayerView
      :game-type="selectedGameType"
      :campaign="demoCampaign"
      :player="demoPlayer"
      :prizes="demoPrizes"
      :draw-logs="testLogs"
      :rules="demoRules"
      :claim-info="demoClaimInfo"
      :egg-smash-options="eggSmashOptions"
      :wheel-options="wheelOptions"
      @draw="handleDraw"
      @close-result="handleCloseResult"
    />

    <section class="bg-slate-950 px-4 py-5 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl rounded-[2rem] border border-amber-400/20 bg-amber-400/10 p-5 shadow-2xl sm:p-6">
        <p class="text-sm font-black uppercase tracking-[0.25em] text-amber-200">
          Next Game Create Direction
        </p>
        <h2 class="mt-1 text-2xl font-black text-white">
          新遊戲後續建立流程
        </h2>
        <p class="mt-2 text-sm leading-6 text-amber-100">
          這段流程直接來自 gameTemplateConfig.js 的 getNextGameCreateDirection()。
        </p>

        <div class="mt-4 space-y-2">
          <div
            v-for="step in nextGameCreateDirection"
            :key="step"
            class="rounded-2xl bg-slate-950/60 px-4 py-3 text-sm font-bold leading-6 text-amber-100"
          >
            {{ step }}
          </div>
        </div>
      </div>
    </section>

    <section class="bg-slate-950 px-4 py-5 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-5 shadow-2xl sm:p-6">
        <p class="text-sm font-black uppercase tracking-[0.25em] text-emerald-200">
          第 257 批安全提示
        </p>
        <h2 class="mt-1 text-2xl font-black text-white">
          前台測試入口已讀取總穩定基準
        </h2>
        <p class="mt-2 text-sm leading-6 text-emerald-100">
          這批只整理 /dev/common-game-player-test 前台測試入口讀取精緻九宮格正式接入前安全檢查版，不修改正式頁、不修改 router、不影響正式 WheelGameView.vue。
        </p>
      </div>
    </section>

    <section class="bg-slate-950 px-4 py-8 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl sm:p-6">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <p class="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
              Test Events
            </p>
            <h2 class="mt-1 text-2xl font-black text-white">
              測試事件紀錄
            </h2>
          </div>

          <span class="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">
            {{ eventLogs.length }} 筆
          </span>
        </div>

        <div class="space-y-3">
          <div
            v-for="log in eventLogs"
            :key="log.id"
            class="rounded-2xl border border-white/10 bg-slate-900 p-4"
          >
            <p class="font-bold text-white">{{ log.text }}</p>
            <p class="mt-1 text-xs text-slate-400">{{ log.time }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

