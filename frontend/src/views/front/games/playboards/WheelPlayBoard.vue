<script setup>
import { computed, ref } from 'vue'

/**
 * Multi Game Platform V2.3 第 241 批：WheelPlayBoard 幸運輪盤玩法區骨架版
 *
 * 檔案位置：
 * frontend/src/views/front/games/playboards/WheelPlayBoard.vue
 *
 * 本批目的：
 * 1. 延續第 240 批公用模板階段穩定備份。
 * 2. 新增「幸運輪盤」公用 PlayBoard 骨架。
 * 3. WheelPlayBoard 只負責輪盤畫面、旋轉狀態、指針、動畫與送出 @draw。
 * 4. 抽獎結果、獎品、紀錄、剩餘次數、領獎仍由 CommonGamePlayerView 處理。
 *
 * 本批安全原則：
 * - 不修改 router/index.js
 * - 不修改 WheelGameView.vue
 * - 不修改 PremiumGridLotteryView.vue
 * - 不修改 EggSmashPlayBoard.vue
 * - 不修改 CommonGamePlayerView.vue
 * - 不修改 AdminCommonGameEditorView.vue
 * - 不取代正式頁
 * - 不接正式路由
 * - 只新增 WheelPlayBoard.vue
 */

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  isDrawing: {
    type: Boolean,
    default: false
  },
  activeIndex: {
    type: Number,
    default: -1
  },
  disabled: {
    type: Boolean,
    default: false
  },
  buttonText: {
    type: String,
    default: '立即轉動'
  },
  spinDuration: {
    type: Number,
    default: 2800
  }
})

const emit = defineEmits(['draw', 'spin-start', 'spin-end'])

const localSpinning = ref(false)
const selectedIndex = ref(-1)
const rotationDeg = ref(0)
const localMessage = ref('點擊按鈕，開始轉動幸運輪盤。')

const normalizedItems = computed(() => {
  const source = props.items.length > 0 ? props.items : [
    {
      id: 1,
      name: '優惠券 100 元',
      shortName: '100 元',
      icon: '🎁'
    },
    {
      id: 2,
      name: '限定小禮',
      shortName: '小禮',
      icon: '✨'
    },
    {
      id: 3,
      name: '再接再厲',
      shortName: '再來',
      icon: '🍀'
    },
    {
      id: 4,
      name: '神秘好禮',
      shortName: '好禮',
      icon: '🎊'
    },
    {
      id: 5,
      name: '會員點數',
      shortName: '點數',
      icon: '⭐'
    },
    {
      id: 6,
      name: '品牌折扣',
      shortName: '折扣',
      icon: '🏷️'
    }
  ]

  return source.slice(0, 10).map((item, index) => ({
    id: item.id || `wheel-item-${index + 1}`,
    index,
    name: item.name || item.title || `獎項 ${index + 1}`,
    title: item.title || item.name || `獎項 ${index + 1}`,
    shortName: item.shortName || item.name || item.title || `獎項 ${index + 1}`,
    icon: item.icon || '🎁',
    remaining: Number(item.remaining ?? item.quantity ?? 1),
    disabled: Boolean(item.disabled),
    raw: item
  }))
})

const enabledItems = computed(() => {
  return normalizedItems.value.filter((item) => !item.disabled)
})

const canSpin = computed(() => {
  return !props.disabled && !props.isDrawing && !localSpinning.value && enabledItems.value.length > 0
})

const statusText = computed(() => {
  if (props.isDrawing) return '抽獎結果處理中...'
  if (localSpinning.value) return '輪盤轉動中...'
  if (props.disabled) return '目前暫不可玩'
  if (selectedIndex.value >= 0) return `本次停在第 ${selectedIndex.value + 1} 格`

  return '等待開始'
})

const segmentCount = computed(() => {
  return Math.max(1, normalizedItems.value.length)
})

const segmentDeg = computed(() => {
  return 360 / segmentCount.value
})

const selectedItem = computed(() => {
  return normalizedItems.value[selectedIndex.value] || null
})

const wheelStyle = computed(() => {
  const colorPairs = [
    '#facc15',
    '#fb923c',
    '#f97316',
    '#fbbf24',
    '#fde047',
    '#fdba74',
    '#f59e0b',
    '#fcd34d',
    '#ea580c',
    '#fef08a'
  ]

  const gradients = normalizedItems.value.map((item, index) => {
    const start = index * segmentDeg.value
    const end = (index + 1) * segmentDeg.value
    const color = colorPairs[index % colorPairs.length]

    return `${color} ${start}deg ${end}deg`
  })

  return {
    transform: `rotate(${rotationDeg.value}deg)`,
    background: `conic-gradient(${gradients.join(', ')})`,
    transition: localSpinning.value ? `transform ${Number(props.spinDuration || 2800)}ms cubic-bezier(.12,.72,.12,1)` : 'transform 280ms ease'
  }
})

const pickTargetItem = () => {
  const candidates = enabledItems.value.length > 0 ? enabledItems.value : normalizedItems.value
  const randomIndex = Math.floor(Math.random() * candidates.length)

  return candidates[randomIndex] || normalizedItems.value[0] || null
}

const spinWheel = () => {
  if (!canSpin.value) return

  const targetItem = pickTargetItem()

  if (!targetItem) {
    localMessage.value = '目前沒有可抽的獎項。'
    return
  }

  localSpinning.value = true
  selectedIndex.value = targetItem.index
  localMessage.value = '輪盤加速轉動中...'

  emit('spin-start', {
    source: 'WheelPlayBoard_v23_batch241',
    items: normalizedItems.value
  })

  const rounds = 6
  const targetCenterDeg = targetItem.index * segmentDeg.value + segmentDeg.value / 2
  const pointerDeg = 270
  const finalRotation = rounds * 360 + (pointerDeg - targetCenterDeg)

  rotationDeg.value = rotationDeg.value + finalRotation

  window.setTimeout(() => {
    localSpinning.value = false
    localMessage.value = `輪盤停在「${targetItem.shortName || targetItem.name}」，等待公用結果流程。`

    emit('spin-end', {
      source: 'WheelPlayBoard_v23_batch241',
      item: targetItem,
      index: targetItem.index
    })

    emit('draw', {
      source: 'WheelPlayBoard_v23_batch241',
      item: targetItem,
      wheelIndex: targetItem.index,
      segmentCount: segmentCount.value
    })
  }, Number(props.spinDuration || 2800) + 80)
}

const resetWheel = () => {
  if (props.isDrawing || localSpinning.value) return

  selectedIndex.value = -1
  rotationDeg.value = 0
  localMessage.value = '點擊按鈕，開始轉動幸運輪盤。'
}
</script>

<template>
  <section class="relative overflow-hidden rounded-[2rem] border border-amber-100 bg-gradient-to-br from-slate-950 via-amber-950 to-slate-950 p-4 text-white shadow-xl shadow-amber-100/70 sm:p-6">
    <div class="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-yellow-400/25 blur-3xl"></div>
    <div class="pointer-events-none absolute -bottom-20 left-8 h-56 w-56 rounded-full bg-orange-400/20 blur-3xl"></div>

    <div class="relative z-10 space-y-5">
      <header class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black text-amber-100">
            <span>🎡</span>
            <span>WheelPlayBoard</span>
            <span class="text-white/40">｜</span>
            <span>第 241 批骨架</span>
          </div>

          <h2 class="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
            幸運輪盤抽好禮
          </h2>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-amber-100">
            這是公用模板用的輪盤 PlayBoard。它只負責輪盤畫面與旋轉互動，正式結果仍交給 CommonGamePlayerView。
          </p>
        </div>

        <div class="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm shadow-lg backdrop-blur">
          <p class="font-black text-white">{{ statusText }}</p>
          <p class="mt-1 text-xs leading-5 text-amber-100">{{ localMessage }}</p>
          <p class="mt-2 inline-flex rounded-full bg-amber-300/20 px-3 py-1 text-xs font-black text-amber-100">
            獎項格數：{{ segmentCount }}
          </p>
        </div>
      </header>

      <div class="grid gap-5 lg:grid-cols-[1fr_300px] lg:items-center">
        <div class="flex justify-center">
          <div class="relative flex h-[320px] w-[320px] items-center justify-center sm:h-[420px] sm:w-[420px]">
            <div class="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-200 via-amber-500 to-orange-700 p-3 shadow-2xl shadow-black/50">
              <div class="h-full w-full rounded-full bg-slate-950 p-3">
                <div class="h-full w-full rounded-full border-[10px] border-yellow-300 bg-slate-900 shadow-inner shadow-black/70">
                  <div
                    class="relative h-full w-full overflow-hidden rounded-full shadow-[inset_0_0_40px_rgba(0,0,0,0.35)]"
                    :style="wheelStyle"
                  >
                    <div
                      v-for="item in normalizedItems"
                      :key="item.id"
                      class="absolute left-1/2 top-1/2 flex h-1/2 w-20 origin-bottom -translate-x-1/2 -translate-y-full flex-col items-center justify-start pt-5 text-center text-slate-950 sm:w-24 sm:pt-7"
                      :style="{ transform: `translate(-50%, -100%) rotate(${item.index * segmentDeg + segmentDeg / 2}deg)` }"
                    >
                      <div
                        class="flex rotate-90 flex-col items-center rounded-2xl bg-white/80 px-2 py-1 shadow-lg backdrop-blur"
                        :class="selectedIndex === item.index ? 'ring-4 ring-white' : ''"
                      >
                        <span class="text-lg sm:text-2xl">{{ item.icon }}</span>
                        <span class="mt-1 max-w-[70px] truncate text-[10px] font-black sm:text-xs">
                          {{ item.shortName }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="absolute left-1/2 top-0 z-30 -translate-x-1/2">
              <div class="h-0 w-0 border-l-[18px] border-r-[18px] border-t-[46px] border-l-transparent border-r-transparent border-t-red-500 drop-shadow-lg"></div>
            </div>

            <button
              type="button"
              class="relative z-40 flex h-24 w-24 items-center justify-center rounded-full border-4 border-yellow-200 bg-gradient-to-br from-red-500 via-rose-600 to-red-800 text-center text-sm font-black text-white shadow-2xl shadow-black/50 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-70 sm:h-32 sm:w-32 sm:text-base"
              :disabled="!canSpin"
              @click="spinWheel"
            >
              <span>{{ localSpinning ? '轉動中' : buttonText }}</span>
            </button>
          </div>
        </div>

        <aside class="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/10 p-4 shadow-inner">
          <div>
            <p class="text-sm font-black uppercase tracking-[0.2em] text-amber-200">
              Prize Segments
            </p>
            <p class="mt-1 text-xs leading-5 text-amber-100">
              目前輪盤獎項由 props.items 傳入，後續會接 CommonGamePlayerView。
            </p>
          </div>

          <div class="max-h-[360px] space-y-2 overflow-auto pr-1">
            <div
              v-for="item in normalizedItems"
              :key="item.id"
              class="rounded-2xl border border-white/10 bg-white/10 p-3"
              :class="selectedIndex === item.index ? 'ring-4 ring-yellow-300/30' : ''"
            >
              <div class="flex items-center gap-3">
                <span class="text-2xl">{{ item.icon }}</span>
                <div class="min-w-0">
                  <p class="truncate text-sm font-black text-white">
                    {{ item.shortName }}
                  </p>
                  <p class="mt-0.5 text-xs text-amber-100">
                    第 {{ item.index + 1 }} 格｜剩餘 {{ item.remaining }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-2">
            <button
              type="button"
              class="rounded-2xl bg-yellow-400 px-4 py-3 text-sm font-black text-slate-950 shadow-lg shadow-yellow-900/20 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:bg-slate-500 disabled:text-slate-300"
              :disabled="!canSpin"
              @click="spinWheel"
            >
              {{ localSpinning ? '轉動中...' : buttonText }}
            </button>

            <button
              type="button"
              class="rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="props.isDrawing || localSpinning"
              @click="resetWheel"
            >
              重置測試
            </button>
          </div>

          <div class="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-xs leading-5 text-amber-100">
            <p class="font-black text-white">第 241 批安全提示</p>
            <p class="mt-1">
              這是新的公用 WheelPlayBoard，不會覆蓋原本 WheelGameView.vue，也不會影響正式頁。
            </p>
          </div>
        </aside>
      </div>
    </div>
  </section>
</template>
