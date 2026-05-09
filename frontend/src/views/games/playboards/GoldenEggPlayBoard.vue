<script setup>
// Multi Game Platform V2.3
// 第 82 批：GoldenEggPlayBoard.vue 砸金蛋玩法元件骨架版
//
// 放置位置：
// frontend/src/views/games/playboards/GoldenEggPlayBoard.vue
//
// 目的：
// 1. 先建立砸金蛋玩法區的共用化骨架。
// 2. 未來金蛋前台接入共用 GameShell / GameResultModal / GamePrizeShowcase 時，可直接使用這個玩法元件。
// 3. 這一批只建立骨架，不接入任何頁面。
// 4. 不會影響目前正常的九宮格、金蛋功能。

import { computed, ref, watch } from 'vue'

const props = defineProps({
  eggs: {
    type: Array,
    default: () => []
  },
  selectedIndex: {
    type: Number,
    default: -1
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
  eggCount: {
    type: Number,
    default: 9
  },
  allowMultipleBreak: {
    type: Boolean,
    default: false
  },
  drawButtonText: {
    type: String,
    default: '選一顆金蛋'
  },
  hammerText: {
    type: String,
    default: '點擊砸蛋'
  },
  emptyText: {
    type: String,
    default: '請選擇一顆金蛋開始抽獎'
  }
})

const emit = defineEmits([
  'draw',
  'select-egg',
  'break-start',
  'break-end',
  'reset'
])

const localSelectedIndex = ref(props.selectedIndex)
const brokenIndexes = ref([])

watch(
  () => props.selectedIndex,
  (value) => {
    localSelectedIndex.value = value

    if (value >= 0 && !brokenIndexes.value.includes(value)) {
      brokenIndexes.value = props.allowMultipleBreak
        ? [...brokenIndexes.value, value]
        : [value]
    }
  }
)

const fallbackEggs = computed(() => {
  return Array.from({ length: props.eggCount }, (_, index) => ({
    id: `golden_egg_${index}`,
    title: `金蛋 ${index + 1}`,
    shortName: `金蛋 ${index + 1}`,
    icon: '🥚'
  }))
})

const normalizedEggs = computed(() => {
  const source = props.eggs.length ? props.eggs : fallbackEggs.value

  return source.map((item, index) => ({
    ...item,
    id: item.id || `golden_egg_${index}`,
    title: item.title || item.name || item.shortName || `金蛋 ${index + 1}`,
    shortName: item.shortName || item.displayName || item.title || item.name || `金蛋 ${index + 1}`,
    icon: item.icon || item.emoji || '🥚',
    imageUrl: item.imageUrl || item.image || ''
  }))
})

const canBreak = computed(() => {
  return !props.disabled && !props.isDrawing && normalizedEggs.value.length > 0
})

const resultTitle = computed(() => {
  return props.resultPrize?.title
    || props.resultPrize?.name
    || props.resultPrize?.shortName
    || '活動獎項'
})

const resultShortName = computed(() => {
  return props.resultPrize?.shortName
    || props.resultPrize?.title
    || props.resultPrize?.name
    || '獎項'
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

const isEggBroken = (index) => {
  return brokenIndexes.value.includes(index)
}

const selectEgg = (egg, index) => {
  if (!canBreak.value) return

  if (!props.allowMultipleBreak && brokenIndexes.value.length > 0) {
    return
  }

  localSelectedIndex.value = index
  brokenIndexes.value = props.allowMultipleBreak
    ? [...new Set([...brokenIndexes.value, index])]
    : [index]

  emit('break-start', {
    egg,
    index
  })

  emit('select-egg', {
    egg,
    index
  })

  emit('draw', {
    egg,
    index
  })

  window.setTimeout(() => {
    emit('break-end', {
      egg,
      index,
      prize: props.resultPrize
    })
  }, 520)
}

const resetEggs = () => {
  localSelectedIndex.value = -1
  brokenIndexes.value = []
  emit('reset')
}
</script>

<template>
  <section class="relative mx-auto w-full max-w-[420px]">
    <div class="relative overflow-hidden rounded-[34px] border-[6px] border-yellow-300 bg-gradient-to-br from-amber-500 via-orange-600 to-red-700 p-4 shadow-[0_28px_60px_rgba(154,52,18,.45)]">
      <div class="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-yellow-100/25 blur-2xl"></div>
      <div class="absolute -bottom-14 -left-12 h-40 w-40 rounded-full bg-white/15 blur-3xl"></div>

      <div class="relative mb-4 flex items-center justify-between gap-3 text-white">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.22em] text-white/65">
            Golden Egg
          </p>

          <h3 class="mt-1 text-xl font-black">
            砸金蛋抽獎
          </h3>

          <p class="mt-1 text-xs font-bold text-white/70">
            {{ drawButtonText }}
          </p>
        </div>

        <div
          class="golden-egg-hammer flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl shadow-inner"
          :class="isDrawing ? 'golden-egg-hammer-swing' : ''"
          :title="hammerText"
        >
          🔨
        </div>
      </div>

      <div
        v-if="normalizedEggs.length"
        class="grid grid-cols-3 gap-3"
      >
        <button
          v-for="(egg, index) in normalizedEggs"
          :key="egg.id"
          type="button"
          class="group relative aspect-square rounded-[28px] border border-yellow-200/70 bg-gradient-to-br from-yellow-100 via-yellow-300 to-orange-300 p-2 text-center text-orange-950 shadow-[inset_0_2px_0_rgba(255,255,255,.75),0_12px_24px_rgba(120,53,15,.24)] transition hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-75"
          :class="[
            isEggBroken(index) ? 'golden-egg-broken bg-gradient-to-br from-slate-100 to-orange-100' : '',
            localSelectedIndex === index ? 'ring-4 ring-white/80' : ''
          ]"
          :disabled="!canBreak"
          @click="selectEgg(egg, index)"
        >
          <div class="absolute left-2 top-2 h-6 w-6 rounded-full border-l-4 border-t-4 border-white/80"></div>
          <div class="absolute bottom-2 right-2 h-6 w-6 rounded-full border-b-4 border-r-4 border-white/40"></div>

          <div class="relative flex h-full flex-col items-center justify-center gap-1">
            <template v-if="isEggBroken(index) && resultPrize">
              <span class="rounded-full border px-2 py-0.5 text-[10px] font-black" :class="resultTypeInfo.class">
                {{ resultTypeInfo.label }}
              </span>

              <div class="mt-1 flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white text-3xl shadow-inner">
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

              <p class="mt-1 line-clamp-2 text-xs font-black leading-4">
                {{ resultShortName }}
              </p>
            </template>

            <template v-else>
              <div class="golden-egg-shape flex h-14 w-12 items-center justify-center rounded-[50%_50%_46%_46%] bg-gradient-to-br from-yellow-100 via-yellow-300 to-amber-500 text-4xl shadow-inner group-hover:scale-105">
                {{ egg.icon || '🥚' }}
              </div>

              <p class="mt-2 line-clamp-2 text-xs font-black leading-4">
                {{ egg.shortName }}
              </p>
            </template>
          </div>
        </button>
      </div>

      <div
        v-else
        class="rounded-3xl border border-dashed border-white/30 bg-white/10 p-6 text-center"
      >
        <p class="text-sm font-black text-white">
          {{ emptyText }}
        </p>
      </div>

      <div class="mt-4 rounded-3xl bg-white/10 p-3 text-center text-white">
        <p class="text-xs font-bold leading-5 text-white/75">
          {{ resultPrize ? `目前結果：${resultTitle}` : emptyText }}
        </p>

        <button
          type="button"
          class="mt-3 rounded-2xl border border-white/30 bg-white/15 px-4 py-2 text-xs font-black text-white transition hover:bg-white/25"
          @click="resetEggs"
        >
          重置金蛋
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

.golden-egg-shape {
  transition: transform 0.22s ease, filter 0.22s ease;
}

.golden-egg-broken {
  animation: golden-egg-break 0.52s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.golden-egg-hammer-swing {
  animation: golden-egg-hammer-swing 0.28s ease-in-out infinite alternate;
}

@keyframes golden-egg-break {
  0% {
    transform: scale(1) rotate(0deg);
    filter: brightness(1);
  }

  45% {
    transform: scale(1.08) rotate(-4deg);
    filter: brightness(1.2);
  }

  100% {
    transform: scale(1) rotate(0deg);
    filter: brightness(0.98);
  }
}

@keyframes golden-egg-hammer-swing {
  from {
    transform: rotate(-14deg) translateY(-2px);
  }

  to {
    transform: rotate(16deg) translateY(2px);
  }
}
</style>
