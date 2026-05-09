<script setup>
// Multi Game Platform V2.3
// 第 95 批：SlotMachinePlayBoard.vue 拉霸機玩法元件骨架版
//
// 放置位置：
// frontend/src/views/games/playboards/SlotMachinePlayBoard.vue
//
// 目的：
// 1. 先建立拉霸機玩法區的共用化骨架。
// 2. 未來新增 SLOT_MACHINE 拉霸機遊戲時，可直接使用這個玩法元件。
// 3. 這一批只建立骨架，不接入任何頁面。
// 4. 不會影響目前正常的九宮格、金蛋功能。

import { computed, ref, watch } from 'vue'

const props = defineProps({
  symbols: {
    type: Array,
    default: () => []
  },
  resultPrize: {
    type: Object,
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  },
  isDrawing: {
    type: Boolean,
    default: false
  },
  reelCount: {
    type: Number,
    default: 3
  },
  spinDuration: {
    type: Number,
    default: 3000
  },
  drawButtonText: {
    type: String,
    default: '啟動拉霸'
  },
  leverText: {
    type: String,
    default: 'PULL'
  },
  emptyText: {
    type: String,
    default: '點擊啟動，開始拉霸抽獎。'
  }
})

const emit = defineEmits([
  'draw',
  'spin-start',
  'spin-end',
  'select-symbol',
  'reset'
])

const isSpinning = ref(false)
const reelIndexes = ref([0, 1, 2])
const completedReels = ref([])

const fallbackSymbols = [
  {
    id: 'symbol_1',
    title: '大獎',
    shortName: '大獎',
    icon: '🏆'
  },
  {
    id: 'symbol_2',
    title: '折價券',
    shortName: '折價',
    icon: '🎟️'
  },
  {
    id: 'symbol_3',
    title: '咖啡券',
    shortName: '咖啡',
    icon: '☕'
  },
  {
    id: 'symbol_4',
    title: '神秘好禮',
    shortName: '好禮',
    icon: '🎁'
  },
  {
    id: 'symbol_5',
    title: '再玩一次',
    shortName: '再玩',
    icon: '🔁'
  },
  {
    id: 'symbol_6',
    title: '銘謝惠顧',
    shortName: '謝謝',
    icon: '💫'
  }
]

const normalizedSymbols = computed(() => {
  const source = props.symbols.length ? props.symbols : fallbackSymbols

  return source.map((item, index) => ({
    ...item,
    id: item.id || `slot_symbol_${index}`,
    title: item.title || item.name || item.shortName || `圖示 ${index + 1}`,
    shortName: item.shortName || item.displayName || item.title || item.name || `圖示 ${index + 1}`,
    icon: item.icon || item.emoji || '🎰',
    imageUrl: item.imageUrl || item.image || ''
  }))
})

watch(
  () => props.resultPrize,
  (value) => {
    if (!value) return

    const matchedIndex = normalizedSymbols.value.findIndex((item) => {
      return String(item.title) === String(value.title || value.name)
        || String(item.shortName) === String(value.shortName)
        || String(item.icon) === String(value.icon || value.emoji)
    })

    const targetIndex = matchedIndex >= 0 ? matchedIndex : 0

    reelIndexes.value = Array.from({ length: props.reelCount }, () => targetIndex)
  }
)

const canSpin = computed(() => {
  return !props.disabled && !props.isDrawing && !isSpinning.value && normalizedSymbols.value.length > 0
})

const displayReels = computed(() => {
  return Array.from({ length: props.reelCount }, (_, reelIndex) => {
    const symbolIndex = reelIndexes.value[reelIndex] ?? reelIndex % normalizedSymbols.value.length
    return {
      reelIndex,
      symbol: normalizedSymbols.value[symbolIndex % normalizedSymbols.value.length]
    }
  })
})

const resultTitle = computed(() => {
  return props.resultPrize?.title
    || props.resultPrize?.name
    || props.resultPrize?.shortName
    || '活動獎項'
})

const resultIcon = computed(() => {
  return props.resultPrize?.icon || props.resultPrize?.emoji || '🎁'
})

const resultImageUrl = computed(() => {
  return props.resultPrize?.imageUrl || props.resultPrize?.image || ''
})

const resultTypeInfo = computed(() => {
  const title = String(resultTitle.value || '')
  const type = String(props.resultPrize?.type || '').toUpperCase()

  if (type === 'LOSE' || title.includes('銘謝惠顧') || title.includes('未中獎') || title.includes('謝謝參加')) {
    return {
      label: '未中獎',
      class: 'border-slate-200 bg-slate-50 text-slate-600'
    }
  }

  if (type === 'REPLAY' || title.includes('再玩一次') || title.includes('再抽一次')) {
    return {
      label: '加碼',
      class: 'border-sky-200 bg-sky-50 text-sky-700'
    }
  }

  return {
    label: '中獎',
    class: 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }
})

const startSpin = () => {
  if (!canSpin.value) return

  isSpinning.value = true
  completedReels.value = []

  emit('spin-start')
  emit('draw')

  const symbolCount = Math.max(1, normalizedSymbols.value.length)

  Array.from({ length: props.reelCount }).forEach((_, reelIndex) => {
    const interval = window.setInterval(() => {
      reelIndexes.value[reelIndex] = Math.floor(Math.random() * symbolCount)
      reelIndexes.value = [...reelIndexes.value]
    }, 90 + reelIndex * 20)

    window.setTimeout(() => {
      window.clearInterval(interval)

      const resultIndex = props.resultPrize
        ? Math.max(0, normalizedSymbols.value.findIndex((item) => {
          return item.title === props.resultPrize.title
            || item.shortName === props.resultPrize.shortName
            || item.icon === props.resultPrize.icon
        }))
        : Math.floor(Math.random() * symbolCount)

      reelIndexes.value[reelIndex] = resultIndex >= 0 ? resultIndex : 0
      reelIndexes.value = [...reelIndexes.value]
      completedReels.value = [...completedReels.value, reelIndex]

      if (completedReels.value.length >= props.reelCount) {
        isSpinning.value = false

        emit('spin-end', {
          prize: props.resultPrize,
          reelIndexes: reelIndexes.value
        })
      }
    }, 900 + reelIndex * 420)
  })
}

const selectSymbol = (symbol, index) => {
  emit('select-symbol', {
    symbol,
    index
  })
}

const resetSlot = () => {
  isSpinning.value = false
  completedReels.value = []
  reelIndexes.value = Array.from({ length: props.reelCount }, (_, index) => index)
  emit('reset')
}
</script>

<template>
  <section class="relative mx-auto w-full max-w-[420px]">
    <div class="relative overflow-hidden rounded-[34px] border-[6px] border-yellow-300 bg-gradient-to-br from-slate-950 via-red-950 to-orange-800 p-4 shadow-[0_28px_60px_rgba(127,29,29,.45)]">
      <div class="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-yellow-200/20 blur-2xl"></div>
      <div class="absolute -bottom-14 -left-12 h-40 w-40 rounded-full bg-red-400/20 blur-3xl"></div>

      <div class="relative mb-4 flex items-center justify-between gap-3 text-white">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.22em] text-yellow-200/75">
            Slot Machine
          </p>

          <h3 class="mt-1 text-xl font-black">
            拉霸機抽獎
          </h3>

          <p class="mt-1 text-xs font-bold text-white/70">
            {{ emptyText }}
          </p>
        </div>

        <button
          type="button"
          class="slot-lever flex h-16 w-12 flex-col items-center justify-start rounded-full bg-red-600 p-1 shadow-xl transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          :class="isSpinning || isDrawing ? 'slot-lever-pulled' : ''"
          :disabled="!canSpin"
          @click="startSpin"
        >
          <span class="h-7 w-7 rounded-full bg-white shadow-inner"></span>
          <span class="mt-1 text-[9px] font-black text-white">
            {{ leverText }}
          </span>
        </button>
      </div>

      <div class="relative rounded-[30px] border border-yellow-200/30 bg-gradient-to-b from-yellow-200 to-orange-500 p-3 shadow-inner">
        <div class="rounded-[24px] bg-slate-950 p-3 shadow-2xl">
          <div class="grid gap-3" :style="{ gridTemplateColumns: `repeat(${reelCount}, minmax(0, 1fr))` }">
            <button
              v-for="reel in displayReels"
              :key="reel.reelIndex"
              type="button"
              class="relative flex aspect-[0.72] flex-col items-center justify-center overflow-hidden rounded-2xl border border-yellow-200/40 bg-gradient-to-b from-white to-yellow-50 text-slate-900 shadow-inner"
              :class="isSpinning ? 'slot-reel-spinning' : ''"
              @click="selectSymbol(reel.symbol, reel.reelIndex)"
            >
              <div class="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white/80 to-transparent"></div>
              <div class="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-orange-100/80 to-transparent"></div>

              <div class="flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl bg-orange-50 text-5xl shadow-inner">
                <img
                  v-if="reel.symbol.imageUrl"
                  :src="reel.symbol.imageUrl"
                  :alt="reel.symbol.title"
                  class="h-full w-full object-cover"
                />

                <span v-else>
                  {{ reel.symbol.icon }}
                </span>
              </div>

              <p class="mt-3 line-clamp-2 text-xs font-black leading-4">
                {{ reel.symbol.shortName }}
              </p>
            </button>
          </div>
        </div>

        <div class="mt-3 rounded-2xl bg-white/25 px-4 py-3 text-center text-white">
          <span
            v-if="resultPrize"
            class="inline-flex rounded-full border px-3 py-1 text-[11px] font-black"
            :class="resultTypeInfo.class"
          >
            {{ resultTypeInfo.label }}
          </span>

          <p class="mt-2 text-sm font-black">
            {{ resultPrize ? `目前結果：${resultTitle}` : '等待拉霸結果' }}
          </p>

          <div
            v-if="resultPrize"
            class="mx-auto mt-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white text-3xl shadow-inner"
          >
            <img
              v-if="resultImageUrl"
              :src="resultImageUrl"
              :alt="resultTitle"
              class="h-full w-full object-cover"
            />

            <span v-else>
              {{ resultIcon }}
            </span>
          </div>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          class="rounded-2xl bg-white px-4 py-3 text-sm font-black text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="!canSpin"
          @click="startSpin"
        >
          {{ isSpinning || isDrawing ? '轉動中' : drawButtonText }}
        </button>

        <button
          type="button"
          class="rounded-2xl border border-white/30 bg-white/15 px-4 py-3 text-sm font-black text-white transition hover:bg-white/25"
          @click="resetSlot"
        >
          重置
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.slot-reel-spinning {
  animation: slot-reel-shake 0.12s ease-in-out infinite alternate;
}

.slot-lever-pulled {
  transform: translateY(8px) rotate(8deg);
}

@keyframes slot-reel-shake {
  from {
    filter: blur(0.2px) brightness(1);
    transform: translateY(-2px);
  }

  to {
    filter: blur(0.8px) brightness(1.1);
    transform: translateY(2px);
  }
}
</style>
