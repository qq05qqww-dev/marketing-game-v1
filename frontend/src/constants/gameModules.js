export const gameModules = [
  {
    id: 'grid-lottery',
    name: '九宮格抽獎',
    subtitle: '經典九宮格抽獎玩法',
    description: '玩家點擊開始後，燈格快速跳動，最後停在中獎獎項。',
    icon: '🎁',
    type: 'lottery',
    difficulty: 'easy',
    status: 'enabled',
    route: '/games/grid-lottery',
    coverColor: 'from-blue-500 to-cyan-400',
    features: [
      '九宮格動畫',
      '獎項機率設定',
      '中獎紀錄',
      '防止重複中獎'
    ]
  },
  {
    id: 'scratch-card',
    name: '刮刮卡',
    subtitle: '手機常見刮卡抽獎',
    description: '玩家用手指或滑鼠刮開卡面，顯示是否中獎。',
    icon: '🎫',
    type: 'lottery',
    difficulty: 'easy',
    status: 'enabled',
    route: '/games/scratch-card',
    coverColor: 'from-amber-500 to-orange-400',
    features: [
      '刮開動畫',
      '立即顯示結果',
      '獎項機率設定',
      '適合 LINE 活動'
    ]
  },
  {
    id: 'wheel',
    name: '幸運輪盤',
    subtitle: '活動現場最常用玩法',
    description: '玩家點擊按鈕後轉動輪盤，停下後顯示中獎結果。',
    icon: '🎡',
    type: 'lottery',
    difficulty: 'medium',
    status: 'enabled',
    route: '/games/wheel',
    coverColor: 'from-purple-500 to-pink-400',
    features: [
      '輪盤旋轉動畫',
      '指針停留效果',
      '百分比機率',
      '主持人模式'
    ]
  },
  {
    id: 'flip-card',
    name: '翻牌遊戲',
    subtitle: '翻開卡片抽獎',
    description: '玩家選擇一張卡片翻開，顯示獎項或銘謝惠顧。',
    icon: '🃏',
    type: 'lottery',
    difficulty: 'easy',
    status: 'enabled',
    route: '/games/flip-card',
    coverColor: 'from-emerald-500 to-teal-400',
    features: [
      '卡片翻轉動畫',
      '多張卡選擇',
      '中獎結果顯示',
      '適合簡單活動'
    ]
  },
  {
    id: 'egg-smash',
    name: '敲金蛋',
    subtitle: '點擊金蛋開獎',
    description: '玩家選擇金蛋並敲開，產生中獎結果。',
    icon: '🥚',
    type: 'lottery',
    difficulty: 'medium',
    status: 'enabled',
    route: '/games/egg-smash',
    coverColor: 'from-yellow-500 to-amber-400',
    features: [
      '敲蛋動畫',
      '破裂特效',
      '獎項設定',
      '中獎彈窗'
    ]
  },
  {
    id: 'slot-machine',
    name: '拉霸機',
    subtitle: '轉軸式抽獎玩法',
    description: '玩家啟動拉霸機，圖示滾動後依結果判斷是否中獎。',
    icon: '🎰',
    type: 'lottery',
    difficulty: 'hard',
    status: 'enabled',
    route: '/games/slot-machine',
    coverColor: 'from-rose-500 to-red-400',
    features: [
      '三軸滾動動畫',
      '圖示組合判斷',
      '中獎音效',
      '高互動感'
    ]
  },
  {
    id: 'ring-toss',
    name: '套圈圈',
    subtitle: '模擬夜市套圈玩法',
    description: '玩家丟出圈圈，套中指定物品後獲得獎項。',
    icon: '⭕',
    type: 'skill',
    difficulty: 'hard',
    status: 'enabled',
    route: '/games/ring-toss',
    coverColor: 'from-indigo-500 to-blue-400',
    features: [
      '丟圈動畫',
      '命中判定',
      '物品獎項設定',
      '遊戲感較強'
    ]
  },
  {
    id: 'claw-machine',
    name: '夾娃娃',
    subtitle: '模擬夾娃娃機玩法',
    description: '玩家控制爪子移動並夾取獎品，依結果判斷是否成功。',
    icon: '🧸',
    type: 'skill',
    difficulty: 'expert',
    status: 'enabled',
    route: '/games/claw-machine',
    coverColor: 'from-pink-500 to-fuchsia-400',
    features: [
      '爪子移動動畫',
      '夾取判定',
      '獎品展示',
      '沉浸式遊戲體驗'
    ]
  },
  {
    id: 'referral-task',
    name: '推薦任務',
    subtitle: '好友邀請裂變活動',
    description: '玩家分享活動連結，邀請好友參加後累積抽獎資格。',
    icon: '🤝',
    type: 'mission',
    difficulty: 'hard',
    status: 'enabled',
    route: '/games/referral-task',
    coverColor: 'from-slate-700 to-slate-500',
    features: [
      '邀請碼機制',
      '好友推薦紀錄',
      '任務達成條件',
      '適合 LINE 行銷'
    ]
  }
]

export const enabledGameModules = gameModules.filter((game) => {
  return game.status === 'enabled'
})

export const comingSoonGameModules = gameModules.filter((game) => {
  return game.status === 'coming-soon'
})

export const getGameModuleById = (id) => {
  return gameModules.find((game) => game.id === id)
}

export const getGameModuleByRoute = (route) => {
  return gameModules.find((game) => game.route === route)
}