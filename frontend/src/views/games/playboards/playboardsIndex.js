// Multi Game Platform V2.3
// 第 96 批：playboardsIndex.js 補入 SlotMachinePlayBoard.vue 版
//
// 放置位置：
// frontend/src/views/games/playboards/playboardsIndex.js
//
// 目的：
// 1. 統一匯出所有遊戲玩法元件 PlayBoard。
// 2. 未來 GamePlayView 或各遊戲頁可以從這裡取得玩法元件。
// 3. 新增遊戲時，只要新增 PlayBoard 並補到這個索引檔。
// 4. 這一批只新增檔案，不接入任何現有頁面。

import GoldenEggPlayBoard from './GoldenEggPlayBoard.vue'
import PremiumGridPlayBoard from './PremiumGridPlayBoard.vue'
import LuckyWheelPlayBoard from './LuckyWheelPlayBoard.vue'
import ScratchCardPlayBoard from './ScratchCardPlayBoard.vue'
import FlipCardPlayBoard from './FlipCardPlayBoard.vue'
import RedPacketPlayBoard from './RedPacketPlayBoard.vue'
import SlotMachinePlayBoard from './SlotMachinePlayBoard.vue'

export {
  GoldenEggPlayBoard,
  PremiumGridPlayBoard,
  LuckyWheelPlayBoard,
  ScratchCardPlayBoard,
  FlipCardPlayBoard,
  RedPacketPlayBoard,
  SlotMachinePlayBoard
}

export const PLAYBOARD_COMPONENTS = {
  GOLDEN_EGG: GoldenEggPlayBoard,
  GRID: PremiumGridPlayBoard,
  WHEEL: LuckyWheelPlayBoard,
  SCRATCH_CARD: ScratchCardPlayBoard,
  FLIP_CARD: FlipCardPlayBoard,
  RED_PACKET: RedPacketPlayBoard,
  SLOT_MACHINE: SlotMachinePlayBoard
}

export const PLAYBOARD_COMPONENT_LIST = [
  {
    gameType: 'GOLDEN_EGG',
    name: 'GoldenEggPlayBoard',
    label: '砸金蛋玩法',
    description: '3x3 金蛋、錘子提示、破蛋動畫、金蛋點擊事件。'
  },
  {
    gameType: 'GRID',
    name: 'PremiumGridPlayBoard',
    label: '精緻九宮格玩法',
    description: '3x3 九宮格、中心抽獎按鈕、跑燈高亮、抽選事件。'
  },
  {
    gameType: 'WHEEL',
    name: 'LuckyWheelPlayBoard',
    label: '幸運輪盤玩法',
    description: '輪盤扇形、指針、外圈燈效、中心開始按鈕。'
  },
  {
    gameType: 'SCRATCH_CARD',
    name: 'ScratchCardPlayBoard',
    label: '刮刮卡玩法',
    description: '刮刮卡遮罩、刮開進度、結果顯示、刮卡完成事件。'
  },
  {
    gameType: 'FLIP_CARD',
    name: 'FlipCardPlayBoard',
    label: '翻牌抽獎玩法',
    description: '3x3 翻牌、3D 翻轉、選牌事件、翻牌完成事件。'
  },
  {
    gameType: 'RED_PACKET',
    name: 'RedPacketPlayBoard',
    label: '紅包雨玩法',
    description: '紅包掉落動畫、紅包點擊、倒數秒數、點擊次數限制。'
  },
  {
    gameType: 'SLOT_MACHINE',
    name: 'SlotMachinePlayBoard',
    label: '拉霸機玩法',
    description: '3 軸拉霸畫面、拉桿按鈕、轉軸動畫、停止結果。'
  },
]

export const getPlayBoardComponent = (gameType = '') => {
  const normalizedType = String(gameType || '').trim().toUpperCase()

  return PLAYBOARD_COMPONENTS[normalizedType] || null
}

export const hasPlayBoardComponent = (gameType = '') => {
  return Boolean(getPlayBoardComponent(gameType))
}

export const listPlayBoardDefinitions = () => {
  return PLAYBOARD_COMPONENT_LIST.slice()
}

export default PLAYBOARD_COMPONENTS
