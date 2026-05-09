// Multi Game Platform V2.3
// 第 89 批：gameCommonIndex.js 補入 GamePreviewSwitcher.vue 版
//
// 放置位置：
// frontend/src/components/game-common/gameCommonIndex.js
//
// 目的：
// 1. 統一匯出 game-common 底下的共用元件。
// 2. 未來金蛋、九宮格、輪盤、刮刮卡要使用共用元件時，可以從同一個索引檔引用。
// 3. 這一批只新增檔案，不接入任何現有頁面。

import GameActivityHeader from './GameActivityHeader.vue'
import GameChanceCard from './GameChanceCard.vue'
import GameClaimInfo from './GameClaimInfo.vue'
import GameDrawLogs from './GameDrawLogs.vue'
import GameFooterInfo from './GameFooterInfo.vue'
import GamePrizeShowcase from './GamePrizeShowcase.vue'
import GamePreviewSwitcher from './GamePreviewSwitcher.vue'
import GameQuickNav from './GameQuickNav.vue'
import GameResultModal from './GameResultModal.vue'
import GameRulesPanel from './GameRulesPanel.vue'
import GameShell from './GameShell.vue'
import GameStatusNotice from './GameStatusNotice.vue'

export {
  GameActivityHeader,
  GameChanceCard,
  GameClaimInfo,
  GameDrawLogs,
  GameFooterInfo,
  GamePrizeShowcase,
  GamePreviewSwitcher,
  GameQuickNav,
  GameResultModal,
  GameRulesPanel,
  GameShell,
  GameStatusNotice
}

export const GAME_COMMON_COMPONENTS = {
  GameActivityHeader,
  GameChanceCard,
  GameClaimInfo,
  GameDrawLogs,
  GameFooterInfo,
  GamePrizeShowcase,
  GamePreviewSwitcher,
  GameQuickNav,
  GameResultModal,
  GameRulesPanel,
  GameShell,
  GameStatusNotice
}

export const GAME_COMMON_COMPONENT_LIST = [
  {
    name: 'GameActivityHeader',
    label: '活動主視覺',
    description: '商家名稱、活動狀態、活動標題、統計卡。'
  },
  {
    name: 'GameStatusNotice',
    label: '活動狀態提示',
    description: '載入中、載入失敗、尚未開放、未開始、已結束。'
  },
  {
    name: 'GameShell',
    label: '活動頁外框',
    description: '前台手機框、管理右側區塊、背景漸層與插槽。'
  },
  {
    name: 'GamePreviewSwitcher',
    label: '玩法切換器',
    description: '共用遊戲頁草案使用，切換金蛋、九宮格、輪盤、刮刮卡、翻牌等玩法預覽。'
  },
  {
    name: 'GamePrizeShowcase',
    label: '獎品展示',
    description: '獎品清單、亮點獎項、庫存、權重、展開收合。'
  },
  {
    name: 'GameRulesPanel',
    label: '規則說明',
    description: '活動規則、獎品說明、STEP / NOTE 卡片。'
  },
  {
    name: 'GameChanceCard',
    label: '抽獎機會',
    description: '抽獎機會、分享次數、狀態提示、主按鈕。'
  },
  {
    name: 'GameResultModal',
    label: '結果彈窗',
    description: '中獎 / 未中獎結果、領獎提醒、下一步流程。'
  },
  {
    name: 'GameDrawLogs',
    label: '抽獎紀錄',
    description: '最新抽獎紀錄、來源、時間、最新高亮。'
  },
  {
    name: 'GameClaimInfo',
    label: '領獎提醒',
    description: '保留結果、查看紀錄、聯絡確認。'
  },
  {
    name: 'GameQuickNav',
    label: '快速導覽',
    description: '頂部、獎品、規則、紀錄、回到頂部。'
  },
  {
    name: 'GameFooterInfo',
    label: '底部活動資訊',
    description: '活動商家、活動狀態、活動來源、同步時間。'
  }
]

export const getGameCommonComponent = (name = '') => {
  return GAME_COMMON_COMPONENTS[name] || null
}

export const hasGameCommonComponent = (name = '') => {
  return Boolean(getGameCommonComponent(name))
}

export default GAME_COMMON_COMPONENTS
