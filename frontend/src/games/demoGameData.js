// Multi Game Platform V2.3
// 第 103 批：demoGameData.js 多玩法預覽資料檔版
//
// 放置位置：
// frontend/src/games/demoGameData.js
//
// 目的：
// 1. 集中管理 GenericGamePlayView 草案預覽頁使用的本機示範資料。
// 2. 後續可把 demoPrizes、gridItems、eggs、cards、packets、slot symbols 從 GenericGamePlayView 抽出。
// 3. 這一批只新增資料檔，不接入任何頁面。

export const DEMO_PRIZES = [
  {
    id: 1,
    title: '品牌折價券',
    shortName: '折價券',
    icon: '🎟️',
    quantity: 10,
    weight: 35,
    type: 'WIN'
  },
  {
    id: 2,
    title: '咖啡兌換券',
    shortName: '咖啡',
    icon: '☕',
    quantity: 8,
    weight: 25,
    type: 'WIN'
  },
  {
    id: 3,
    title: '神秘好禮',
    shortName: '好禮',
    icon: '🎁',
    quantity: 5,
    weight: 15,
    type: 'WIN'
  },
  {
    id: 4,
    title: '再玩一次',
    shortName: '再玩',
    icon: '🔁',
    quantity: 20,
    weight: 10,
    type: 'REPLAY'
  },
  {
    id: 5,
    title: '銘謝惠顧',
    shortName: '謝謝',
    icon: '💫',
    quantity: 99,
    weight: 15,
    type: 'LOSE'
  }
]

export const createDemoPrizes = () => {
  return DEMO_PRIZES.map((item) => ({
    ...item
  }))
}

export const createDemoGridItems = (prizes = DEMO_PRIZES) => {
  const prizeItems = prizes.slice(0, 8)

  return [
    prizeItems[0],
    prizeItems[1],
    prizeItems[2],
    prizeItems[3],
    {
      id: 'draw_button',
      isButton: true,
      title: '開始',
      shortName: '開始',
      icon: '🎯'
    },
    prizeItems[4],
    prizeItems[0],
    prizeItems[1],
    prizeItems[2]
  ].map((item, index) => ({
    ...(item || {}),
    id: item?.id || `grid_item_${index}`
  }))
}

export const createDemoEggItems = (count = 9) => {
  return Array.from({ length: count }, (_, index) => ({
    id: `egg_${index}`,
    title: `金蛋 ${index + 1}`,
    shortName: `金蛋 ${index + 1}`,
    icon: '🥚'
  }))
}

export const createDemoCardItems = (count = 9) => {
  return Array.from({ length: count }, (_, index) => ({
    id: `card_${index}`,
    title: `卡片 ${index + 1}`,
    shortName: `卡片 ${index + 1}`,
    icon: '🎴'
  }))
}

export const createDemoPacketItems = (count = 16) => {
  return Array.from({ length: count }, (_, index) => ({
    id: `packet_${index}`,
    title: `紅包 ${index + 1}`,
    shortName: '紅包',
    icon: '🧧',
    left: 8 + ((index * 17) % 78),
    delay: (index % 6) * 0.24,
    duration: 2.8 + (index % 5) * 0.32
  }))
}

export const createDemoSlotSymbols = () => {
  return [
    {
      id: 'slot_1',
      title: '大獎',
      shortName: '大獎',
      icon: '🏆'
    },
    {
      id: 'slot_2',
      title: '折價券',
      shortName: '折價',
      icon: '🎟️'
    },
    {
      id: 'slot_3',
      title: '咖啡券',
      shortName: '咖啡',
      icon: '☕'
    },
    {
      id: 'slot_4',
      title: '神秘好禮',
      shortName: '好禮',
      icon: '🎁'
    },
    {
      id: 'slot_5',
      title: '再玩一次',
      shortName: '再玩',
      icon: '🔁'
    },
    {
      id: 'slot_6',
      title: '銘謝惠顧',
      shortName: '謝謝',
      icon: '💫'
    }
  ]
}

export const createDemoBoardItemsByGameType = (gameType = 'GRID', prizes = DEMO_PRIZES) => {
  const normalizedType = String(gameType || '').trim().toUpperCase()

  if (normalizedType === 'GRID') return createDemoGridItems(prizes)
  if (normalizedType === 'GOLDEN_EGG') return createDemoEggItems()
  if (normalizedType === 'FLIP_CARD') return createDemoCardItems()
  if (normalizedType === 'RED_PACKET') return createDemoPacketItems()
  if (normalizedType === 'SLOT_MACHINE') return createDemoSlotSymbols()

  return prizes.map((item) => ({
    ...item
  }))
}

export const DEMO_PREVIEW_GUIDE_ITEMS = [
  {
    title: '草案預覽頁',
    description: '此頁只用來測試共用元件、PlayBoard 玩法骨架與多遊戲切換，不是正式商家活動頁。',
    icon: '🧩'
  },
  {
    title: '本機示範資料',
    description: '目前獎品、機會、紀錄都使用前端 demo 資料，尚未接正式 Campaign / Prize / DrawEngine API。',
    icon: '🧪'
  },
  {
    title: '正式頁不受影響',
    description: '正式九宮格 /play/:tenantSlug/premium-grid 與金蛋 /play/:tenantSlug/golden-egg 不會被這個預覽頁取代。',
    icon: '🛡️'
  },
  {
    title: '切換玩法測試',
    description: '可用畫面按鈕或網址 query，例如 ?gameType=WHEEL、?gameType=RED_PACKET、?gameType=SLOT_MACHINE。',
    icon: '🎮'
  }
]

export const createDemoPreviewGuideItems = () => {
  return DEMO_PREVIEW_GUIDE_ITEMS.map((item) => ({
    ...item
  }))
}

export const DEMO_RULE_ITEMS = [
  '每次抽獎會消耗 1 次抽獎機會。',
  '分享活動可增加抽獎機會。',
  '中獎結果會寫入抽獎紀錄。',
  '獎項數量有限，抽完為止。'
]

export const DEMO_PRIZE_NOTE_ITEMS = [
  '獎品資料會依活動後台設定同步。',
  '庫存為 0 的獎項不會再被抽中。',
  '實際領獎方式以主辦單位公告為準。'
]

export const createDemoRuleItems = () => {
  return DEMO_RULE_ITEMS.slice()
}

export const createDemoPrizeNoteItems = () => {
  return DEMO_PRIZE_NOTE_ITEMS.slice()
}
