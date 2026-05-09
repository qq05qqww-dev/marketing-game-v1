<script setup>
// Multi Game Platform V2.3
// 第 80 批：ScratchCardPlayBoard.vue 刮刮卡玩法元件骨架版
//
// 放置位置：
// frontend/src/views/games/playboards/ScratchCardPlayBoard.vue
//
// 目的：
// 1. 先建立刮刮卡玩法區的共用化骨架。
// 2. 未來新增 SCRATCH_CARD 刮刮卡遊戲時，可直接使用這個玩法元件。
// 3. 這一批只建立骨架，不接入任何頁面。
// 4. 不會影響目前正常的九宮格、金蛋功能。

import { computed, ref } from 'vue'

const props = defineProps({
  prize: {
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
  scratchedPercent: {
    type: Number,
    default: 0
  },
  scratchThreshold: {
    type: Number,
    default: 65
  },
  maskText: {
    type: String,
    default: '刮開看結果'
  },
  drawButtonText: {
    type: String,
    default: '產生刮刮卡'
  },
  drawButtonIcon: {
    type: String,
    default: '🎫'
  },
  emptyText: {
    type: String,
    default: '尚未產生刮刮卡結果'
  }
})

const emit = defineEmits([
  'draw',
  'scratch-start',
  'scratch-progress',
  'scratch-complete',
  'reset'
])

const localScratchedPercent = ref(0)
const hasStartedScratch = ref(false)
const isLocalComplete = ref(false)

const displayedPercent = computed(() => {
  return Math.max(0, Math.min(100, Number(props.scratchedPercent || localScratchedPercent.value || 0)))
})

const isComplete = computed(() => {
  return isLocalComplete.value || displayedPercent.value >= props.scratchThreshold
})

const canDraw = computed(() => {
  return !props.disabled && !props.isDrawing
})

const canScratch = computed(() => {
  return Boolean(props.prize) && !props.disabled && !props.isDrawing && !isComplete.value
})

const prizeTitle = computed(() => {
  return props.prize?.title || props.prize?.name || props.prize?.shortName || '活動獎項'
})

const prizeShortName = computed(() => {
  return props.prize?.shortName || props.prize?.title || props.prize?.name || '獎項'
})

const prizeIcon = computed(() => {
  return props.prize?.icon || props.prize?.emoji || '🎁'
})

const prizeImageUrl = computed(() => {
  return props.prize?.imageUrl || props.prize?.image || ''
})

const maskStyle = computed(() => {
  const opacity = Math.max(0, 1 - displayedPercent.value / 100)

  return {
    opacity,
    clipPath: `inset(0 0 0 ${displayedPercent.value}%)`
  }
})

const resultTypeInfo = computed(() => {
  const title = String(prizeTitle.value || '')
  const type = String(props.prize?.type || '').toUpperCase()

  if (type === 'LOSE' || title.includes('銘謝惠顧') || title.includes('未中獎') || title.includes('謝謝參加')) {
    return {
      label: '未中獎',
      class: 'bg-slate-100 text-slate-600 border-slate-200'
    }
  }

  if (type === 'REPLAY' || title.includes('再玩一次') || title.includes('再抽一次')) {
    return {
      label: '加碼',
      class: 'bg-sky-50 text-sky-700 border-sky-200'
    }
  }

  return {
    label: '中獎',
    class: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }
})

const startDraw = () => {
  if (!canDraw.value) return

  localScratchedPercent.value = 0
  hasStartedScratch.value = false
  isLocalComplete.value = false
  emit('draw')
}

const simulateScratch = () => {
  if (!canScratch.value) return

  if (!hasStartedScratch.value) {
    hasStartedScratch.value = true
    emit('scratch-start')
  }

  const nextPercent = Math.min(100, localScratchedPercent.value + 18)
  localScratchedPercent.value = nextPercent

  emit('scratch-progress', {
    percent: nextPercent
  })

  if (nextPercent >= props.scratchThreshold && !isLocalComplete.value) {
    isLocalComplete.value = true
    emit('scratch-complete', {
      percent: nextPercent,
      prize: props.prize
    })
  }
}

const resetScratch = () => {
  localScratchedPercent.value = 0
  hasStartedScratch.value = false
  isLocalComplete.value = false
  emit('reset')
}
</script>

<template>
  <section class="relative mx-auto w-full max-w-[390px]">
    <div class="relative overflow-hidden rounded-[34px] border-[6px] border-yellow-300 bg-gradient-to-br from-rose-500 via-orange-500 to-yellow-400 p-4 shadow-[0_28px_60px_rgba(154,52,18,.42)]">
      <div class="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/20 blur-2xl"></div>
      <div class="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-yellow-200/30 blur-3xl"></div>

      <div class="relative rounded-[28px] bg-white p-4 shadow-2xl">
        <div class="mb-3 flex items-center justify-between gap-3">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
              Scratch Card
            </p>

            <h3 class="mt-1 text-xl font-black text-slate-900">
              刮刮卡抽獎
            </h3>
          </div>

          <span
            v-if="prize"
            class="rounded-full border px-3 py-1 text-[11px] font-black"
            :class="resultTypeInfo.class"
          >
            {{ resultTypeInfo.label }}
          </span>
        </div>

        <div class="relative overflow-hidden rounded-[28px] border border-slate-100 bg-gradient-to-br from-yellow-50 to-orange-50 p-4 text-center shadow-inner">
          <div
            v-if="prize"
            class="relative z-0 flex min-h-[210px] flex-col items-center justify-center gap-3"
          >
            <div class="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[26px] bg-white text-5xl shadow-inner">
              <img
                v-if="prizeImageUrl"
                :src="prizeImageUrl"
                :alt="prizeTitle"
                class="h-full w-full object-cover"
              />

              <span v-else>
                {{ prizeIcon }}
              </span>
            </div>

            <div>
              <p class="text-xs font-black tracking-[0.18em] text-orange-400">
                本次結果
              </p>

              <h4 class="mt-2 text-2xl font-black text-slate-900">
                {{ prizeTitle }}
              </h4>

              <p
                v-if="prizeShortName && prizeShortName !== prizeTitle"
                class="mt-1 text-xs font-bold text-slate-500"
              >
                顯示名稱：{{ prizeShortName }}
              </p>
            </div>
          </div>

          <div
            v-else
            class="flex min-h-[210px] flex-col items-center justify-center gap-3 text-center"
          >
            <div class="flex h-20 w-20 items-center justify-center rounded-[26px] bg-orange-50 text-5xl">
              🎫
            </div>

            <p class="text-sm font-black text-slate-500">
              {{ emptyText }}
            </p>
          </div>

          <button
            v-if="prize && !isComplete"
            type="button"
            class="absolute inset-4 z-10 flex flex-col items-center justify-center rounded-[24px] border border-white/60 bg-gradient-to-br from-slate-300 via-slate-200 to-slate-400 text-slate-700 shadow-inner transition"
            :style="maskStyle"
            :disabled="!canScratch"
            @click="simulateScratch"
          >
            <span class="text-4xl">🪙</span>
            <span class="mt-2 text-sm font-black">{{ maskText }}</span>
            <span class="mt-1 text-[11px] font-bold text-slate-500">點擊模擬刮開</span>
          </button>
        </div>

        <div class="mt-4">
          <div class="flex items-center justify-between text-[11px] font-black text-slate-400">
            <span>刮開進度</span>
            <span>{{ displayedPercent }}%</span>
          </div>

          <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              class="h-full rounded-full bg-orange-500 transition-all"
              :style="{ width: `${displayedPercent}%` }"
            ></div>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            class="rounded-2xl bg-orange-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="!canDraw"
            @click="startDraw"
          >
            {{ isDrawing ? '產生中' : `${drawButtonIcon} ${drawButtonText}` }}
          </button>

          <button
            type="button"
            class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-100"
            @click="resetScratch"
          >
            重置刮卡
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
