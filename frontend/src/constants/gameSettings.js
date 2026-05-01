export const gameSettings = [
  {
    id: 'grid-lottery',
    name: '九宮格抽獎',
    route: '/games/grid-lottery',
    icon: '🎁',
    type: 'lottery',
    status: 'enabled',
    playLimit: 1,
    probabilityMode: 'weight',
    description: '經典九宮格抽獎玩法，適合優惠券、抽獎券與即抽即中活動。',
    prizes: [
      {
        id: 1,
        name: '頭獎',
        description: '品牌旗艦大獎',
        icon: '🏆',
        type: 'success',
        weight: 1,
        quantity: 1
      },
      {
        id: 2,
        name: '二獎',
        description: '精美好禮一份',
        icon: '🎁',
        type: 'primary',
        weight: 3,
        quantity: 3
      },
      {
        id: 3,
        name: '三獎',
        description: '限定折價券',
        icon: '🎫',
        type: 'warning',
        weight: 8,
        quantity: 10
      },
      {
        id: 4,
        name: '幸運獎',
        description: '神秘小禮物',
        icon: '✨',
        type: 'info',
        weight: 10,
        quantity: 20
      },
      {
        id: 5,
        name: '銘謝惠顧',
        description: '下次再接再厲',
        icon: '🙏',
        type: 'default',
        weight: 40,
        quantity: 9999
      }
    ]
  },
  {
    id: 'scratch-card',
    name: '刮刮卡',
    route: '/games/scratch-card',
    icon: '🎫',
    type: 'lottery',
    status: 'enabled',
    playLimit: 1,
    probabilityMode: 'weight',
    description: '手機常見刮卡玩法，適合 LINE 活動、優惠券與會員抽獎。',
    prizes: [
      {
        id: 1,
        name: '頭獎',
        description: '品牌旗艦大獎',
        icon: '🏆',
        type: 'success',
        weight: 1,
        quantity: 1
      },
      {
        id: 2,
        name: '二獎',
        description: '精美好禮一份',
        icon: '🎁',
        type: 'primary',
        weight: 3,
        quantity: 3
      },
      {
        id: 3,
        name: '折價券',
        description: '消費折抵優惠',
        icon: '🎫',
        type: 'warning',
        weight: 12,
        quantity: 50
      },
      {
        id: 4,
        name: '會員點數',
        description: '會員點數加碼',
        icon: '💎',
        type: 'purple',
        weight: 15,
        quantity: 100
      },
      {
        id: 5,
        name: '銘謝惠顧',
        description: '下次再接再厲',
        icon: '🙏',
        type: 'default',
        weight: 40,
        quantity: 9999
      }
    ]
  },
  {
    id: 'wheel',
    name: '幸運輪盤',
    route: '/games/wheel',
    icon: '🎡',
    type: 'lottery',
    status: 'enabled',
    playLimit: 1,
    probabilityMode: 'weight',
    description: '活動現場感強，適合大螢幕、主持人與直播抽獎。',
    prizes: [
      {
        id: 1,
        name: '頭獎',
        description: '品牌旗艦大獎',
        icon: '🏆',
        type: 'success',
        weight: 1,
        quantity: 1
      },
      {
        id: 2,
        name: '二獎',
        description: '精美好禮一份',
        icon: '🎁',
        type: 'primary',
        weight: 3,
        quantity: 3
      },
      {
        id: 3,
        name: '優惠券',
        description: '消費折抵優惠',
        icon: '🎫',
        type: 'warning',
        weight: 12,
        quantity: 50
      },
      {
        id: 4,
        name: '會員點數',
        description: '會員點數加碼',
        icon: '💎',
        type: 'purple',
        weight: 15,
        quantity: 100
      },
      {
        id: 5,
        name: '銘謝惠顧',
        description: '下次再接再厲',
        icon: '🙏',
        type: 'default',
        weight: 40,
        quantity: 9999
      }
    ]
  },
  {
    id: 'flip-card',
    name: '翻牌遊戲',
    route: '/games/flip-card',
    icon: '🃏',
    type: 'lottery',
    status: 'enabled',
    playLimit: 1,
    probabilityMode: 'weight',
    description: '玩家選擇卡牌翻開，適合簡單快速的互動抽獎。',
    prizes: [
      {
        id: 1,
        name: '頭獎',
        description: '品牌旗艦大獎',
        icon: '🏆',
        type: 'success',
        weight: 1,
        quantity: 1
      },
      {
        id: 2,
        name: '二獎',
        description: '精美好禮一份',
        icon: '🎁',
        type: 'primary',
        weight: 3,
        quantity: 3
      },
      {
        id: 3,
        name: '優惠券',
        description: '消費折抵優惠',
        icon: '🎫',
        type: 'warning',
        weight: 12,
        quantity: 50
      },
      {
        id: 4,
        name: '銘謝惠顧',
        description: '下次再接再厲',
        icon: '🙏',
        type: 'default',
        weight: 40,
        quantity: 9999
      }
    ]
  },
  {
    id: 'egg-smash',
    name: '敲金蛋',
    route: '/games/egg-smash',
    icon: '🥚',
    type: 'lottery',
    status: 'enabled',
    playLimit: 1,
    probabilityMode: 'weight',
    description: '玩家選擇金蛋敲開，適合節慶、促銷與開獎活動。',
    prizes: [
      {
        id: 1,
        name: '頭獎',
        description: '品牌旗艦大獎',
        icon: '🏆',
        type: 'success',
        weight: 1,
        quantity: 1
      },
      {
        id: 2,
        name: '優惠券',
        description: '消費折抵優惠',
        icon: '🎫',
        type: 'warning',
        weight: 12,
        quantity: 50
      },
      {
        id: 3,
        name: '幸運獎',
        description: '神秘小禮物',
        icon: '✨',
        type: 'info',
        weight: 10,
        quantity: 30
      },
      {
        id: 4,
        name: '銘謝惠顧',
        description: '下次再接再厲',
        icon: '🙏',
        type: 'default',
        weight: 40,
        quantity: 9999
      }
    ]
  },
  {
    id: 'slot-machine',
    name: '拉霸機',
    route: '/games/slot-machine',
    icon: '🎰',
    type: 'lottery',
    status: 'enabled',
    playLimit: 1,
    probabilityMode: 'weight',
    description: '三軸滾動式抽獎玩法，互動感強，適合娛樂型活動。',
    prizes: [
      {
        id: 1,
        name: '頭獎',
        description: '三個頭獎圖示連線',
        icon: '🏆',
        type: 'success',
        weight: 1,
        quantity: 1
      },
      {
        id: 2,
        name: '二獎',
        description: '三個禮物圖示連線',
        icon: '🎁',
        type: 'primary',
        weight: 3,
        quantity: 3
      },
      {
        id: 3,
        name: '優惠券',
        description: '三個票券圖示連線',
        icon: '🎫',
        type: 'warning',
        weight: 12,
        quantity: 50
      },
      {
        id: 4,
        name: '銘謝惠顧',
        description: '未連線結果',
        icon: '🙏',
        type: 'default',
        weight: 40,
        quantity: 9999
      }
    ]
  },
  {
    id: 'ring-toss',
    name: '套圈圈',
    route: '/games/ring-toss',
    icon: '⭕',
    type: 'skill',
    status: 'enabled',
    playLimit: 1,
    probabilityMode: 'weight',
    description: '模擬夜市套圈玩法，適合趣味互動與闖關抽獎。',
    prizes: [
      {
        id: 1,
        name: '頭獎',
        description: '套中高價目標',
        icon: '🏆',
        type: 'success',
        weight: 1,
        quantity: 1
      },
      {
        id: 2,
        name: '小禮物',
        description: '套中一般目標',
        icon: '🎁',
        type: 'primary',
        weight: 8,
        quantity: 30
      },
      {
        id: 3,
        name: '優惠券',
        description: '套中票券目標',
        icon: '🎫',
        type: 'warning',
        weight: 15,
        quantity: 80
      },
      {
        id: 4,
        name: '銘謝惠顧',
        description: '未成功套中',
        icon: '🙏',
        type: 'default',
        weight: 40,
        quantity: 9999
      }
    ]
  },
  {
    id: 'claw-machine',
    name: '夾娃娃',
    route: '/games/claw-machine',
    icon: '🧸',
    type: 'skill',
    status: 'enabled',
    playLimit: 1,
    probabilityMode: 'weight',
    description: '模擬夾娃娃機玩法，適合沉浸式遊戲抽獎活動。',
    prizes: [
      {
        id: 1,
        name: '頭獎',
        description: '成功夾到高價獎品',
        icon: '🏆',
        type: 'success',
        weight: 1,
        quantity: 1
      },
      {
        id: 2,
        name: '娃娃獎',
        description: '成功夾到娃娃',
        icon: '🧸',
        type: 'primary',
        weight: 8,
        quantity: 30
      },
      {
        id: 3,
        name: '優惠券',
        description: '獲得折抵優惠',
        icon: '🎫',
        type: 'warning',
        weight: 15,
        quantity: 80
      },
      {
        id: 4,
        name: '銘謝惠顧',
        description: '沒有成功夾取',
        icon: '🙏',
        type: 'default',
        weight: 40,
        quantity: 9999
      }
    ]
  },
  {
    id: 'referral-task',
    name: '推薦任務',
    route: '/games/referral-task',
    icon: '🤝',
    type: 'mission',
    status: 'enabled',
    playLimit: 1,
    probabilityMode: 'weight',
    requiredInviteCount: 3,
    description: '玩家分享邀請連結，邀請好友達標後領取推薦任務獎勵。',
    prizes: [
      {
        id: 1,
        name: '推薦大獎',
        description: '完成推薦任務專屬大獎',
        icon: '🏆',
        type: 'success',
        weight: 1,
        quantity: 1
      },
      {
        id: 2,
        name: '好友禮包',
        description: '推薦好友專屬禮包',
        icon: '🎁',
        type: 'primary',
        weight: 5,
        quantity: 20
      },
      {
        id: 3,
        name: '折價券',
        description: '推薦任務折抵優惠',
        icon: '🎫',
        type: 'warning',
        weight: 15,
        quantity: 100
      },
      {
        id: 4,
        name: '任務完成獎',
        description: '感謝完成好友推薦任務',
        icon: '🤝',
        type: 'info',
        weight: 30,
        quantity: 9999
      }
    ]
  }
]

export const getGameSettingById = (id) => {
  return gameSettings.find((game) => game.id === id)
}

export const getGamePrizesByGameId = (gameId) => {
  const game = getGameSettingById(gameId)

  return game?.prizes || []
}

export const getEnabledGameSettings = () => {
  return gameSettings.filter((game) => game.status === 'enabled')
}

export const getGameSettingSummary = () => {
  return {
    total: gameSettings.length,
    enabled: gameSettings.filter((game) => game.status === 'enabled').length,
    disabled: gameSettings.filter((game) => game.status !== 'enabled').length,
    lottery: gameSettings.filter((game) => game.type === 'lottery').length,
    skill: gameSettings.filter((game) => game.type === 'skill').length,
    mission: gameSettings.filter((game) => game.type === 'mission').length
  }
}