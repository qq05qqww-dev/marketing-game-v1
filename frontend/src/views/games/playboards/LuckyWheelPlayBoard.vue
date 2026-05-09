<script setup>
// Multi Game Platform V2.3
// 第 79 批：LuckyWheelPlayBoard.vue 幸運輪盤玩法元件骨架版
//
// 放置位置：
// frontend/src/views/games/playboards/LuckyWheelPlayBoard.vue
//
// 目的：
// 1. 先建立幸運輪盤玩法區的共用化骨架。
// 2. 未來新增 WHEEL 幸運輪盤遊戲時，可直接使用這個玩法元件。
// 3. 這一批只建立骨架，不接入任何頁面。
// 4. 不會影響目前正常的九宮格、金蛋功能。

import { computed } from 'vue'

const props = defineProps({
  prizes: {
    type: Array,
    default: () => []
  },
  activeIndex: {
    type: Number,
    default: -1
  },
  rotation: {
    type: Number,
    default: 0
  },
  disabled: {
    type: Boolean,
    default: false
  },
  isDrawing: {
    type: Boolean,
    default: false
  },
  drawButtonText: {
    type: String,
    default: '開始轉動'
  },
  drawButtonIcon: {
    type: String,
    default: '🎡'
  },
  pointerText: {
    type: String,
    default: 'LUCKY'
  },
  showOuterLights: {
    type: Boolean,
    default: true
  },
  emptyText: {
    type: String,
    default: '尚未設定輪盤獎項'
  }
})

const emit = defineEmits([
  'draw',
  'select-prize'
])

const fallbackPrizes = [
  {
    id: 'wheel_1',
    title: '折價券',
    shortName: '折價券',
    icon: '🎟️',
    quantity: 10
  },
  {
    id: 'wheel_2',
    title: '咖啡券',
    shortName: '咖啡',
    icon: '☕',
    quantity: 8
  },
  {
    id: 'wheel_3',
    title: '再玩一次',
    shortName: '再玩',
    icon: '🔁',
    quantity: 20
  },
  {
    id: 'wheel_4',
    title: '神秘好禮',
    shortName: '好禮',
    icon: '🎁',
    quantity: 5
  },
  {
    id: 'wheel_5',
    title: '銘謝惠顧',
    shortName: '謝謝',
    icon: '💫',
    quantity: 99
  },
  {
    id: 'wheel_6',
    title: '大獎',
    shortName: '大獎',
    icon: '🏆',
    quantity: 1
  }
]

const normalizedPrizes = computed(() => {
  const source = props.prizes.length ? props.prizes : fallbackPrizes

  return source.map((item, index) => {
    const title = item.title || item.name || item.shortName || `獎項 ${index + 1}`

    return {
      ...item,
      id: item.id || `wheel_prize_${index}`,
      title,
      shortName: item.shortName || item.displayName || title,
      icon: item.icon || item.emoji || '🎁',
      imageUrl: item.imageUrl || item.image || '',
      quantity: Number(item.quantity ?? item.remainStock ?? item.stock ?? 0)
    }
  })
})

const canDraw = computed(() => {
  return !props.disabled && !props.isDrawing && normalizedPrizes.value.length > 0
})

const wheelSegmentStyle = (index) => {
  const count = Math.max(1, normalizedPrizes.value.length)
  const angle = 360 / count
  const rotate = index * angle
  const skew = 90 - angle

  return {
    transform: `rotate(${rotate}deg) skewY(${skew}deg)`,
    background: index % 2 === 0
      ? 'linear-gradient(135deg, #fde68a, #fb923c)'
      : 'linear-gradient(135deg, #fff7ed, #f97316)'
  }
}

const wheelPrizeStyle = (index) => {
  const count = Math.max(1, normalizedPrizes.value.length)
  const angle = 360 / count
  const rotate = index * angle + angle / 2

  return {
    transform: `rotate(${rotate}deg) translateY(-110px) rotate(${-rotate}deg)`
  }
}

const outerLights = computed(() => {
  return Array.from({ length: 24 }, (_, index) => {
    const angle = (360 / 24) * index

    return {
      id: `light_${index}`,
      style: {
        transform: `rotate(${angle}deg) translateY(-164px)`
      }
    }
  })
})

const handleDraw = () => {
  if (!canDraw.value) return

  emit('draw')
}

const handlePrizeClick = (prize, index) => {
  emit('select-prize', {
    prize,
    index
  })
}
</script>

<template>
  <section class="relative mx-auto w-full max-w-[380px]">
    <div class="relative aspect-square rounded-full border-[10px] border-orange-500 bg-gradient-to-br from-yellow-200 to-orange-500 p-4 shadow-[0_28px_60px_rgba(154,52,18,.42)]">
      <div
        v-if="showOuterLights"
        class="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full"
      >
        <span
          v-for="light in outerLights"
          :key="light.id"
          class="absolute h-3 w-3 rounded-full bg-yellow-100 shadow-[0_0_16px_rgba(254,240,138,.95)]"
          :class="isDrawing ? 'lucky-wheel-light-running' : ''"
          :style="light.style"
        ></span>
      </div>

      <div class="absolute -top-4 left-1/2 z-20 -translate-x-1/2">
        <div
          class="lucky-wheel-pointer flex h-20 w-14 flex-col items-center justify-start"
          :class="isDrawing ? 'lucky-wheel-pointer-shake' : ''"
        >
          <div class="rounded-full bg-white px-2 py-1 text-[9px] font-black text-orange-600 shadow-lg">
            {{ pointerText }}
          </div>

          <div class="h-0 w-0 border-l-[14px] border-r-[14px] border-t-[42px] border-l-transparent border-r-transparent border-t-red-600 drop-shadow-xl"></div>
        </div>
      </div>

      <div
        class="relative h-full w-full overflow-hidden rounded-full border-[6px] border-white bg-orange-200 shadow-inner transition-transform duration-700"
        :class="isDrawing ? 'lucky-wheel-spin-preview' : ''"
        :style="{ transform: `rotate(${rotation}deg)` }"
      >
        <div
          v-if="normalizedPrizes.length"
          class="absolute inset-0"
        >
          <div
            v-for="(prize, index) in normalizedPrizes"
            :key="prize.id"
            class="absolute left-1/2 top-1/2 h-1/2 w-1/2 origin-top-left"
            :class="activeIndex === index ? 'brightness-125 saturate-125' : ''"
            :style="wheelSegmentStyle(index)"
          ></div>

          <button
            v-for="(prize, index) in normalizedPrizes"
            :key="`${prize.id}_label`"
            type="button"
            class="absolute left-1/2 top-1/2 z-10 flex w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center text-center text-orange-950"
            :style="wheelPrizeStyle(index)"
            @click.stop="handlePrizeClick(prize, index)"
          >
            <span class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-white/80 text-2xl shadow-inner">
              <img
                v-if="prize.imageUrl"
                :src="prize.imageUrl"
                :alt="prize.title"
                class="h-full w-full object-cover"
              />

              <span v-else>
                {{ prize.icon }}
              </span>
            </span>

            <span class="mt-1 line-clamp-2 text-[10px] font-black leading-tight">
              {{ prize.shortName }}
            </span>
          </button>
        </div>

        <div
          v-else
          class="flex h-full items-center justify-center p-8 text-center"
        >
          <p class="text-sm font-black text-orange-900">
            {{ emptyText }}
          </p>
        </div>
      </div>

      <button
        type="button"
        class="absolute left-1/2 top-1/2 z-30 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-[6px] border-white bg-gradient-to-br from-red-500 to-orange-600 text-white shadow-2xl transition hover:-translate-y-[52%] disabled:cursor-not-allowed disabled:opacity-70"
        :disabled="!canDraw"
        @click="handleDraw"
      >
        <span class="text-3xl">
          {{ drawButtonIcon }}
        </span>

        <span class="mt-1 text-xs font-black leading-tight">
          {{ isDrawing ? '轉動中' : drawButtonText }}
        </span>
      </button>
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

.lucky-wheel-spin-preview {
  animation: lucky-wheel-spin-preview 1s linear infinite;
}

.lucky-wheel-pointer-shake {
  animation: lucky-wheel-pointer-shake 0.12s ease-in-out infinite alternate;
}

.lucky-wheel-light-running:nth-child(odd) {
  animation: lucky-wheel-light-pulse 0.32s ease-in-out infinite alternate;
}

.lucky-wheel-light-running:nth-child(even) {
  animation: lucky-wheel-light-pulse 0.32s ease-in-out infinite alternate-reverse;
}

@keyframes lucky-wheel-spin-preview {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@keyframes lucky-wheel-pointer-shake {
  from {
    transform: translateX(-3px) rotate(-4deg);
  }

  to {
    transform: translateX(3px) rotate(4deg);
  }
}

@keyframes lucky-wheel-light-pulse {
  from {
    opacity: 0.45;
    transform: scale(0.78);
  }

  to {
    opacity: 1;
    transform: scale(1.12);
  }
}
</style>
