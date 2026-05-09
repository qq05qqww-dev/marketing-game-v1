<script setup>
import { computed, reactive, ref } from 'vue'
import {
  COMMON_FRONT_PLAYER_SECTIONS,
  DEFAULT_COMMON_GAME_PLAYER_LAYOUT,
  GAME_TEMPLATE_VERSION,
  getGameTemplateByType
} from '../../../config/gameTemplateConfig'
import PremiumGridPlayBoard from '../../games/playboards/PremiumGridPlayBoard.vue'
import EggSmashPlayBoard from './playboards/EggSmashPlayBoard.vue'
import WheelPlayBoard from './playboards/WheelPlayBoard.vue'
import GameResultModal from '../../../components/game-common/GameResultModal.vue'
import GamePrizeShowcase from '../../../components/game-common/GamePrizeShowcase.vue'
import GameRulesPanel from '../../../components/game-common/GameRulesPanel.vue'
import GameClaimInfo from '../../../components/game-common/GameClaimInfo.vue'
import GameDrawLogs from '../../../components/game-common/GameDrawLogs.vue'
import GameChanceCard from '../../../components/game-common/GameChanceCard.vue'

/**
 * Multi Game Platform V2.3 第 253 批：前台公用玩家頁模板狀態穩定備份版
 *
 * 檔案位置：
 * frontend/src/views/front/games/CommonGamePlayerView.vue
 *
 * 本批目的：
 * 1. 延續第 252 批：CommonGamePlayerView 已顯示模板來源狀態。
 * 2. 本批建立「前台公用玩家頁模板狀態穩定備份」。
 * 3. CommonGamePlayerView 已支援 premium-grid / egg-smash / wheel。
 * 4. 遊戲資料來源已對齊 gameTemplateConfig.js。
 * 5. 抽獎結果、紀錄、剩餘次數、規則、獎品、領獎仍走公用玩家頁流程。
 *
 * 本批安全原則：
 * - 不修改 router/index.js
 * - 不修改 WheelGameView.vue
 * - 不修改 PremiumGridLotteryView.vue
 * - 不取代正式輪盤玩家頁
 * - 不取代正式九宮格玩家頁
 * - 只增加 CommonGamePlayerView 的前台穩定備份標記
 */

const props = defineProps({
  gameType: {
    type: String,
    default: 'premium-grid'
  },
  campaign: {
    type: Object,
    default: () => ({
      id: 'demo-common-campaign',
      title: '公用玩家頁試驗',
      subtitle: 'Common Game Player View',
      description: '這是公用玩家頁安全試驗版，可以依照 gameType 切換不同 PlayBoard。',
      statusText: '安全試驗',
      tenantSlug: 'a-shop',
      brandName: 'Demo Shop',
      claimTitle: '領獎提醒',
      claimDescription: '中獎後請依照活動頁面提示或店家公告完成領獎。',
      contactText: '如有問題請聯繫活動客服。',
      pageTitle: '公用玩家頁'
    })
  },
  player: {
    type: Object,
    default: () => ({
      id: 'demo-player',
      name: '訪客玩家',
      chances: 3,
      usedChances: 0
    })
  },
  prizes: {
    type: Array,
    default: () => [
      {
        id: 1,
        name: '優惠券 100 元',
        title: '優惠券 100 元',
        icon: '🎁',
        quantity: 10,
        remaining: 10
      },
      {
        id: 2,
        name: '限定小禮',
        title: '限定小禮',
        icon: '✨',
        quantity: 5,
        remaining: 5
      },
      {
        id: 3,
        name: '再接再厲',
        title: '再接再厲',
        icon: '🍀',
        quantity: 999,
        remaining: 999
      }
    ]
  },
  drawLogs: {
    type: Array,
    default: () => []
  },
  rules: {
    type: Array,
    default: () => [
      '每位玩家可依活動設定取得遊玩次數。',
      '獎品數量有限，抽完為止。',
      '中獎資格與領獎方式依店家公告為準。'
    ]
  },
  claimInfo: {
    type: Object,
    default: () => ({
      title: '領獎提醒',
      description: '中獎後請依照活動頁面提示或店家公告完成領獎。',
      contactText: '如有問題請聯繫活動客服。'
    })
  },
  loading: {
    type: Boolean,
    default: false
  },
  eggSmashOptions: {
    type: Object,
    default: () => ({
      eggCount: 9,
      hammerEnabled: true,
      brokenEggEffect: 'gold-particles',
      buttonText: '立即砸蛋'
    })
  },
  wheelOptions: {
    type: Object,
    default: () => ({
      buttonText: '立即轉動',
      spinDuration: 2800
    })
  }
})

const emit = defineEmits([
  'draw',
  'close-result',
  'open-rule',
  'open-claim',
  'share',
  'clear-logs'
])

const isDrawing = ref(false)
const activeIndex = ref(-1)
const showResultModal = ref(false)
const resultPrize = ref(null)
const localDrawLogs = ref([])
const sharedCount = ref(0)
const loadedAt = ref(new Date().toLocaleString('zh-TW'))

const frontPlayerStableCheckpoint = {
  batch: 'V2.3 第 253 批',
  title: '前台公用玩家頁模板狀態穩定備份版',
  view: 'CommonGamePlayerView.vue',
  templateSource: 'gameTemplateConfig.js',
  supportedGameTypes: [
    'premium-grid',
    'egg-smash',
    'wheel'
  ],
  supportedPlayBoards: [
    'PremiumGridPlayBoard',
    'EggSmashPlayBoard',
    'WheelPlayBoard'
  ],
  safeNote: '此批可作為前台公用玩家頁模板狀態的安全基準。'
}


const layout = reactive({
  ...DEFAULT_COMMON_GAME_PLAYER_LAYOUT
})

const gameTemplate = computed(() => {
  return getGameTemplateByType(props.gameType)
})

const gameLabel = computed(() => {
  return gameTemplate.value?.label || '未登記遊戲'
})

const gameIcon = computed(() => {
  return gameTemplate.value?.icon || '🎮'
})

const playBoardComponentName = computed(() => {
  return gameTemplate.value?.playBoardComponent || '尚未設定 PlayBoard'
})

const usePremiumGridPlayBoard = computed(() => {
  return props.gameType === 'premium-grid' && playBoardComponentName.value === 'PremiumGridPlayBoard'
})

const useEggSmashPlayBoard = computed(() => {
  return props.gameType === 'egg-smash' && playBoardComponentName.value === 'EggSmashPlayBoard'
})

const useWheelPlayBoard = computed(() => {
  return props.gameType === 'wheel' && playBoardComponentName.value === 'WheelPlayBoard'
})

const supportedPlayBoardReady = computed(() => {
  return usePremiumGridPlayBoard.value || useEggSmashPlayBoard.value || useWheelPlayBoard.value
})

const activeFrontSections = computed(() => {
  const enabledSectionKeys = gameTemplate.value?.commonFrontSections || [
    'hero',
    'chanceCard',
    'playBoard',
    'prizeShowcase',
    'rulesPanel',
    'claimInfo',
    'drawLogs',
    'resultModal'
  ]

  return COMMON_FRONT_PLAYER_SECTIONS.filter((section) => {
    return enabledSectionKeys.includes(section.key)
  })
})

const requiredBoardItemCount = computed(() => {
  if (usePremiumGridPlayBoard.value) return 9
  if (useEggSmashPlayBoard.value) return Number(props.eggSmashOptions?.eggCount || 9)
  if (useWheelPlayBoard.value) return Math.max(3, Math.min(props.prizes.length || 6, 10))

  return Math.max(props.prizes.length, 1)
})

const normalizedPlayBoardItems = computed(() => {
  const source = props.prizes.length > 0 ? props.prizes : []
  const requiredCount = Math.max(1, requiredBoardItemCount.value)

  const list = Array.from({ length: requiredCount }).map((_, index) => {
    const prize = source[index % Math.max(source.length, 1)] || {}

    return {
      id: prize.id ?? `item-${index + 1}`,
      index,
      name: prize.name || prize.title || `獎項 ${index + 1}`,
      title: prize.title || prize.name || `獎項 ${index + 1}`,
      label: prize.label || prize.name || prize.title || `獎項 ${index + 1}`,
      shortName: prize.shortName || prize.name || prize.title || `獎項 ${index + 1}`,
      icon: prize.icon || (useEggSmashPlayBoard.value ? '🥚' : useWheelPlayBoard.value ? '🎡' : '🎁'),
      imageUrl: prize.imageUrl || prize.image || '',
      remaining: Number(prize.remaining ?? prize.quantity ?? 1),
      quantity: Number(prize.quantity ?? prize.remaining ?? 1),
      disabled: Boolean(prize.disabled),
      isCenter: Boolean(prize.isCenter || (usePremiumGridPlayBoard.value && index === 4)),
      raw: prize
    }
  })

  if (usePremiumGridPlayBoard.value) {
    return list.slice(0, 9).map((item, index) => ({
      ...item,
      isCenter: item.isCenter || index === 4,
      name: index === 4 ? '立即抽獎' : item.name,
      title: index === 4 ? '立即抽獎' : item.title,
      shortName: index === 4 ? '抽獎' : item.shortName,
      icon: index === 4 ? '🎯' : item.icon
    }))
  }

  return list
})

const remainingPrizeCount = computed(() => {
  return normalizedPlayBoardItems.value.reduce((total, prize) => {
    if (prize.isCenter) return total

    return total + Number(prize.remaining || 0)
  }, 0)
})

const availablePrizeCount = computed(() => {
  return normalizedPlayBoardItems.value.filter((item) => {
    return !item.isCenter && Number(item.remaining || 0) > 0
  }).length
})

const canDraw = computed(() => {
  return !props.loading && !isDrawing.value && Number(props.player?.chances || 0) > 0 && remainingPrizeCount.value > 0
})

const playerChanceText = computed(() => {
  const chances = Number(props.player?.chances || 0)
  const usedChances = Number(props.player?.usedChances || 0)

  return `剩餘 ${chances} 次｜已使用 ${usedChances} 次`
})

const mergedDrawLogs = computed(() => {
  return [
    ...localDrawLogs.value,
    ...props.drawLogs
  ]
})

const latestDrawLogId = computed(() => {
  return mergedDrawLogs.value[0]?.id || ''
})

const ruleItems = computed(() => {
  return props.rules.map((rule, index) => {
    if (typeof rule === 'string') {
      return {
        id: `rule-${index + 1}`,
        title: `規則 ${index + 1}`,
        description: rule,
        icon: index === 0 ? '🎯' : index === 1 ? '🎁' : '✅'
      }
    }

    return {
      id: rule.id || `rule-${index + 1}`,
      title: rule.title || `規則 ${index + 1}`,
      description: rule.description || rule.text || '',
      icon: rule.icon || '✅',
      ...rule
    }
  })
})

const prizeNoteItems = computed(() => {
  return [
    {
      id: 'stock',
      title: '獎品數量有限',
      description: `目前可用獎品類型 ${availablePrizeCount.value} 種，實際領獎依活動設定為準。`,
      icon: '🎁'
    },
    {
      id: 'claim',
      title: '領獎請依公告',
      description: props.claimInfo?.description || props.campaign?.claimDescription || '中獎後請依活動頁面提示完成領獎。',
      icon: '📌'
    }
  ]
})

const statusCards = computed(() => {
  return [
    {
      label: '遊戲類型',
      value: gameLabel.value,
      icon: gameIcon.value,
      class: 'bg-indigo-50 text-indigo-700 border-indigo-100'
    },
    {
      label: '剩餘次數',
      value: `${Number(props.player?.chances || 0)} 次`,
      icon: '🎯',
      class: Number(props.player?.chances || 0) > 0
        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
        : 'bg-rose-50 text-rose-700 border-rose-100'
    },
    {
      label: '獎品狀態',
      value: `剩餘 ${remainingPrizeCount.value} 份`,
      icon: '🎁',
      class: remainingPrizeCount.value > 0
        ? 'bg-amber-50 text-amber-700 border-amber-100'
        : 'bg-slate-50 text-slate-600 border-slate-100'
    },
    {
      label: 'PlayBoard',
      value: supportedPlayBoardReady.value ? '已接入' : '未接入',
      icon: supportedPlayBoardReady.value ? '🧩' : '🕒',
      class: supportedPlayBoardReady.value
        ? 'bg-cyan-50 text-cyan-700 border-cyan-100'
        : 'bg-slate-50 text-slate-600 border-slate-100'
    }
  ]
})

const safetyChecks = computed(() => {
  return [
    {
      label: '未取代正式頁',
      value: '安全',
      done: true
    },
    {
      label: '目前玩法區',
      value: playBoardComponentName.value,
      done: supportedPlayBoardReady.value
    },
    {
      label: '九宮格',
      value: usePremiumGridPlayBoard.value ? '使用中' : '待命',
      done: true
    },
    {
      label: '砸金蛋 / 輪盤',
      value: useEggSmashPlayBoard.value ? '砸金蛋使用中' : useWheelPlayBoard.value ? '輪盤使用中' : '待命',
      done: true
    }
  ]
})

const templateSourceCards = computed(() => [
  {
    label: '穩定基準',
    value: frontPlayerStableCheckpoint.batch,
    icon: '🛡️',
    class: 'bg-emerald-50 text-emerald-700 border-emerald-100'
  },
  {
    label: '模板來源',
    value: frontPlayerStableCheckpoint.templateSource,
    icon: '🧬',
    class: 'bg-violet-50 text-violet-700 border-violet-100'
  },
  {
    label: 'gameType',
    value: props.gameType,
    icon: gameIcon.value,
    class: 'bg-indigo-50 text-indigo-700 border-indigo-100'
  },
  {
    label: 'PlayBoard',
    value: playBoardComponentName.value,
    icon: '🧩',
    class: supportedPlayBoardReady.value
      ? 'bg-cyan-50 text-cyan-700 border-cyan-100'
      : 'bg-rose-50 text-rose-700 border-rose-100'
  }
])

const boardTitle = computed(() => {
  if (useWheelPlayBoard.value) return '幸運輪盤公用玩家頁測試'
  if (useEggSmashPlayBoard.value) return '砸金蛋公用玩家頁測試'
  if (usePremiumGridPlayBoard.value) return '九宮格公用玩家頁測試'

  return '公用玩家頁測試'
})

const boardDescription = computed(() => {
  if (useWheelPlayBoard.value) {
    return '第 253 批已標記為前台公用玩家頁模板狀態安全基準。'
  }

  if (useEggSmashPlayBoard.value) {
    return 'EggSmashPlayBoard 已接入 CommonGamePlayerView。'
  }

  if (usePremiumGridPlayBoard.value) {
    return 'PremiumGridPlayBoard 維持可用，正式九宮格頁不受影響。'
  }

  return '目前遊戲類型尚未接入對應 PlayBoard。'
})

const boardThemeClass = computed(() => {
  if (useWheelPlayBoard.value) return 'border-amber-100 bg-gradient-to-br from-slate-950 via-amber-950 to-slate-950'
  if (useEggSmashPlayBoard.value) return 'border-amber-100 bg-gradient-to-br from-amber-50 via-white to-yellow-50'

  return 'border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-amber-50'
})

const sectionIsEnabled = (key) => {
  return activeFrontSections.value.some((section) => section.key === key)
}

const pickDemoResultPrize = (payload = {}) => {
  const payloadPrize = payload?.item || payload?.egg || payload?.card

  if (payloadPrize?.name || payloadPrize?.title) {
    return {
      ...payloadPrize,
      prizeName: payloadPrize.name || payloadPrize.title,
      isWin: (payloadPrize.name || payloadPrize.title) !== '再接再厲'
    }
  }

  const candidates = normalizedPlayBoardItems.value.filter((item) => {
    return !item.isCenter && !item.disabled && Number(item.remaining || 0) > 0
  })

  if (candidates.length === 0) {
    return {
      id: 'empty',
      name: '再接再厲',
      title: '再接再厲',
      icon: '🍀',
      index: 0,
      isWin: false
    }
  }

  const randomIndex = Math.floor(Math.random() * candidates.length)
  const selected = candidates[randomIndex]

  return {
    ...selected,
    prizeName: selected.name || selected.title,
    isWin: selected.name !== '再接再厲'
  }
}

const runDemoLightAnimation = (targetIndex) => {
  const total = normalizedPlayBoardItems.value.length || 9
  const rounds = useWheelPlayBoard.value ? 1 : 28 + targetIndex
  let currentStep = 0

  return new Promise((resolve) => {
    if (useWheelPlayBoard.value) {
      activeIndex.value = targetIndex
      window.setTimeout(resolve, 320)
      return
    }

    const timer = window.setInterval(() => {
      activeIndex.value = currentStep % total
      currentStep += 1

      if (currentStep > rounds) {
        window.clearInterval(timer)
        activeIndex.value = targetIndex
        resolve()
      }
    }, useEggSmashPlayBoard.value ? 45 : 70)
  })
}

const handleDraw = async (payload = {}) => {
  if (!canDraw.value) return

  isDrawing.value = true
  resultPrize.value = null

  emit('draw', {
    gameType: props.gameType,
    campaign: props.campaign,
    player: props.player,
    items: normalizedPlayBoardItems.value,
    source: 'CommonGamePlayerView_v23_batch253',
    playBoardPayload: payload
  })

  const selectedPrize = pickDemoResultPrize(payload)
  const targetIndex = Number(payload?.wheelIndex ?? payload?.eggIndex ?? selectedPrize.index ?? 0)

  await runDemoLightAnimation(targetIndex)

  resultPrize.value = {
    ...selectedPrize,
    index: targetIndex
  }

  localDrawLogs.value.unshift({
    id: `demo-log-${Date.now()}`,
    prizeId: selectedPrize.id,
    prizeName: selectedPrize.name || selectedPrize.title,
    name: selectedPrize.name || selectedPrize.title,
    title: selectedPrize.title || selectedPrize.name,
    icon: selectedPrize.icon || (useWheelPlayBoard.value ? '🎡' : useEggSmashPlayBoard.value ? '🥚' : '🎁'),
    isWin: selectedPrize.isWin,
    gameType: props.gameType,
    createdAt: new Date().toLocaleString()
  })

  showResultModal.value = true
  isDrawing.value = false
}

const closeResultModal = () => {
  showResultModal.value = false
  emit('close-result', resultPrize.value)
}

const shareCampaign = () => {
  sharedCount.value += 1
  emit('share', {
    gameType: props.gameType,
    campaign: props.campaign,
    sharedCount: sharedCount.value
  })
}

const clearDrawLogs = () => {
  localDrawLogs.value = []
  emit('clear-logs')
}

const scrollToLogs = () => {
  emit('open-claim')
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
    <div
      class="mx-auto space-y-6"
      :style="{ maxWidth: layout.maxWidth }"
    >
      <section class="overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-xl shadow-slate-200/80">
        <div
          class="relative isolate overflow-hidden px-5 py-6 text-white sm:px-8 sm:py-8"
          :class="useWheelPlayBoard
            ? 'bg-gradient-to-br from-slate-950 via-amber-950 to-orange-950'
            : useEggSmashPlayBoard
              ? 'bg-gradient-to-br from-amber-950 via-slate-950 to-yellow-900'
              : 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950'"
        >
          <div class="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-indigo-400/30 blur-3xl"></div>
          <div class="pointer-events-none absolute -bottom-16 left-10 h-44 w-44 rounded-full bg-amber-300/20 blur-3xl"></div>

          <div class="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div class="space-y-3">
              <div class="inline-flex flex-wrap items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-100">
                <span>{{ gameIcon }}</span>
                <span>{{ gameLabel }}</span>
                <span class="text-white/40">｜</span>
                <span>第 253 批前台穩定備份</span>
              </div>

              <div>
                <p class="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-200">
                  Common Game Player
                </p>
                <h1 class="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                  {{ campaign.title }}
                </h1>
                <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                  {{ campaign.description }}
                </p>
              </div>
            </div>

            <div class="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm shadow-lg backdrop-blur">
              <p class="font-bold text-white">{{ campaign.statusText || '活動進行中' }}</p>
              <p class="mt-1 text-indigo-100">{{ playerChanceText }}</p>
              <p class="mt-1 text-xs text-slate-300">
                PlayBoard：{{ playBoardComponentName }}
              </p>
              <p class="mt-1 text-xs text-slate-400">
                {{ GAME_TEMPLATE_VERSION }}
              </p>
            </div>
          </div>
        </div>

        <div class="grid gap-3 bg-white px-5 py-5 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          <div
            v-for="card in statusCards"
            :key="card.label"
            class="rounded-2xl border p-4"
            :class="card.class"
          >
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-xs font-bold opacity-75">{{ card.label }}</p>
                <p class="mt-1 text-lg font-black">{{ card.value }}</p>
              </div>
              <div class="text-2xl">{{ card.icon }}</div>
            </div>
          </div>
        </div>
      </section>

      <section
        v-if="sectionIsEnabled('playBoard')"
        class="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-8"
      >
        <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-sm font-black uppercase tracking-[0.25em] text-indigo-500">
              Dynamic PlayBoard
            </p>
            <h2 class="mt-1 text-2xl font-black text-slate-950">
              {{ boardTitle }}
            </h2>
            <p class="mt-1 text-sm text-slate-500">
              {{ boardDescription }}
            </p>
          </div>

          <div
            class="rounded-2xl border px-4 py-3 text-sm font-black"
            :class="canDraw
              ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
              : 'border-slate-100 bg-slate-50 text-slate-500'"
          >
            {{ isDrawing ? '抽選中...' : canDraw ? '目前可測試' : '目前不可抽' }}
          </div>
        </div>

        <div
          class="rounded-[1.5rem] border p-3 sm:p-5"
          :class="boardThemeClass"
        >
          <PremiumGridPlayBoard
            v-if="usePremiumGridPlayBoard"
            :items="normalizedPlayBoardItems"
            :is-drawing="isDrawing"
            :active-index="activeIndex"
            :disabled="!canDraw"
            @draw="handleDraw"
          />

          <EggSmashPlayBoard
            v-else-if="useEggSmashPlayBoard"
            :items="normalizedPlayBoardItems"
            :is-drawing="isDrawing"
            :active-index="activeIndex"
            :disabled="!canDraw"
            :egg-count="Number(eggSmashOptions?.eggCount || 9)"
            :hammer-enabled="Boolean(eggSmashOptions?.hammerEnabled ?? true)"
            :broken-egg-effect="eggSmashOptions?.brokenEggEffect || 'gold-particles'"
            :button-text="eggSmashOptions?.buttonText || '立即砸蛋'"
            @draw="handleDraw"
          />

          <WheelPlayBoard
            v-else-if="useWheelPlayBoard"
            :items="normalizedPlayBoardItems"
            :is-drawing="isDrawing"
            :active-index="activeIndex"
            :disabled="!canDraw"
            :button-text="wheelOptions?.buttonText || '立即轉動'"
            :spin-duration="Number(wheelOptions?.spinDuration || 2800)"
            @draw="handleDraw"
          />

          <div
            v-else
            class="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500"
          >
            目前遊戲類型尚未接入對應 PlayBoard。
          </div>
        </div>
      </section>

      <section class="rounded-[2rem] border border-white bg-white p-5 shadow-lg shadow-slate-200/70 sm:p-8">
        <div class="mb-5">
          <p class="text-sm font-black uppercase tracking-[0.25em] text-violet-500">
            Stable Template Source
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            前台公用玩家頁模板狀態穩定備份
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            這裡顯示目前 CommonGamePlayerView 的穩定基準、模板來源與 PlayBoard 狀態。
          </p>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="card in templateSourceCards"
            :key="card.label"
            class="rounded-2xl border p-4"
            :class="card.class"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0">
                <p class="text-xs font-bold opacity-75">{{ card.label }}</p>
                <p class="mt-1 truncate text-lg font-black">{{ card.value }}</p>
              </div>
              <div class="text-2xl">{{ card.icon }}</div>
            </div>
          </div>
        </div>

        <div class="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          <p class="font-black text-slate-800">第 253 批穩定備份說明</p>
          <p class="mt-1">
            {{ frontPlayerStableCheckpoint.safeNote }}
            目前支援 premium-grid / egg-smash / wheel，並只呈現 active 模板對應的 PlayBoard。
          </p>
        </div>
      </section>

      <section
        v-if="sectionIsEnabled('chanceCard')"
        class="rounded-[2rem] border border-white bg-white p-5 shadow-lg shadow-slate-200/70 sm:p-8"
      >
        <GameChanceCard
          :chances="Number(player?.chances || 0)"
          :shared-count="sharedCount"
          :available-prize-count="availablePrizeCount"
          :is-drawing="isDrawing"
          status-message="第 242 批：目前使用公用玩家頁測試資料。"
          @draw="handleDraw"
          @share="shareCampaign"
        />
      </section>

      <section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="check in safetyChecks"
          :key="check.label"
          class="rounded-2xl border bg-white p-4 shadow-sm"
          :class="check.done ? 'border-emerald-100' : 'border-amber-100'"
        >
          <p class="text-xs font-black text-slate-500">{{ check.label }}</p>
          <p
            class="mt-1 text-lg font-black"
            :class="check.done ? 'text-emerald-700' : 'text-amber-700'"
          >
            {{ check.value }}
          </p>
        </div>
      </section>

      <section
        v-if="sectionIsEnabled('prizeShowcase')"
        class="rounded-[2rem] border border-white bg-white p-5 shadow-lg shadow-slate-200/70 sm:p-8"
      >
        <GamePrizeShowcase
          :prizes="prizes"
          title="共用獎品展示"
          description="第 242 批：獎品資料仍由公用玩家頁統一處理。"
        />
      </section>

      <section
        v-if="sectionIsEnabled('rulesPanel')"
        class="rounded-[2rem] border border-white bg-white p-5 shadow-lg shadow-slate-200/70 sm:p-8"
      >
        <GameRulesPanel
          :rules="ruleItems"
          :prize-notes="prizeNoteItems"
        />
      </section>

      <GameClaimInfo
        v-if="sectionIsEnabled('claimInfo')"
        class="rounded-[2rem] border border-white bg-white p-5 shadow-lg shadow-slate-200/70 sm:p-8"
        :title="claimInfo.title || campaign.claimTitle || '領獎提醒'"
        :description="claimInfo.description || campaign.claimDescription || '中獎後請依照活動頁面提示完成領獎。'"
        :contact-text="claimInfo.contactText || campaign.contactText || '如有問題請聯繫活動客服。'"
        @open-history="scrollToLogs"
        @share="shareCampaign"
      />

      <section
        v-if="sectionIsEnabled('drawLogs')"
        class="rounded-[2rem] border border-white bg-white p-5 shadow-lg shadow-slate-200/70 sm:p-8"
      >
        <GameDrawLogs
          :logs="mergedDrawLogs"
          :latest-log-id="latestDrawLogId"
          @clear="clearDrawLogs"
        />
      </section>

      <section class="rounded-[2rem] border border-dashed border-slate-300 bg-white/80 p-5 text-sm text-slate-500 sm:p-6">
        <p class="font-black text-slate-700">第 242 批安全提示</p>
        <p class="mt-2 leading-6">
          CommonGamePlayerView.vue 現在支援 premium-grid、egg-smash、wheel 三種 PlayBoard。
          這批仍只作用在測試頁與後台預覽，不會取代正式 WheelGameView.vue，也不會影響正式九宮格頁。
        </p>
      </section>
    </div>

    <GameResultModal
      v-if="showResultModal"
      :show="showResultModal"
      :prize="resultPrize"
      :game-title="campaign.pageTitle || campaign.title"
      :merchant-name="campaign.brandName || campaign.tenantSlug || 'Demo Shop'"
      :remaining-chances="Number(player?.chances || 0)"
      :shared-count="sharedCount"
      :claim-description="claimInfo.description || campaign.claimDescription"
      :contact-text="claimInfo.contactText || campaign.contactText"
      :synced-at="loadedAt"
      @close="closeResultModal"
      @continue="closeResultModal"
      @share="shareCampaign"
      @open-history="scrollToLogs"
    />
  </div>
</template>
