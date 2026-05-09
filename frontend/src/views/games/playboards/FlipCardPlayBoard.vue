<script setup>
// Multi Game Platform V2.3
// 第 81 批：FlipCardPlayBoard.vue 翻牌玩法元件骨架版
//
// 放置位置：
// frontend/src/views/games/playboards/FlipCardPlayBoard.vue
//
// 目的：
// 1. 先建立翻牌抽獎玩法區的共用化骨架。
// 2. 未來新增 FLIP_CARD 翻牌抽獎遊戲時，可直接使用這個玩法元件。
// 3. 這一批只建立骨架，不接入任何頁面。
// 4. 不會影響目前正常的九宮格、金蛋功能。

import { computed, ref, watch } from 'vue'

const props = defineProps({
  cards: {
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
  cardCount: {
    type: Number,
    default: 9
  },
  allowMultipleFlip: {
    type: Boolean,
    default: false
  },
  drawButtonText: {
    type: String,
    default: '開始翻牌'
  },
  cardBackText: {
    type: String,
    default: 'LUCKY'
  },
  emptyText: {
    type: String,
    default: '請選擇一張卡片翻開'
  }
})

const emit = defineEmits([
  'draw',
  'select-card',
  'flip-start',
  'flip-end',
  'reset'
])

const localSelectedIndex = ref(props.selectedIndex)
const flippedIndexes = ref([])

watch(
  () => props.selectedIndex,
  (value) => {
    localSelectedIndex.value = value

    if (value >= 0 && !flippedIndexes.value.includes(value)) {
      flippedIndexes.value = props.allowMultipleFlip
        ? [...flippedIndexes.value, value]
        : [value]
    }
  }
)

const fallbackCards = computed(() => {
  return Array.from({ length: props.cardCount }, (_, index) => ({
    id: `flip_card_${index}`,
    title: `卡片 ${index + 1}`,
    shortName: `卡片 ${index + 1}`,
    icon: '🎴'
  }))
})

const normalizedCards = computed(() => {
  const source = props.cards.length ? props.cards : fallbackCards.value

  return source.map((item, index) => ({
    ...item,
    id: item.id || `flip_card_${index}`,
    title: item.title || item.name || item.shortName || `卡片 ${index + 1}`,
    shortName: item.shortName || item.displayName || item.title || item.name || `卡片 ${index + 1}`,
    icon: item.icon || item.emoji || '🎴',
    imageUrl: item.imageUrl || item.image || ''
  }))
})

const canFlip = computed(() => {
  return !props.disabled && !props.isDrawing && normalizedCards.value.length > 0
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

const isCardFlipped = (index) => {
  return flippedIndexes.value.includes(index)
}

const startDraw = () => {
  if (!canFlip.value) return

  emit('draw')
}

const selectCard = (card, index) => {
  if (!canFlip.value) return

  if (!props.allowMultipleFlip && flippedIndexes.value.length > 0) {
    return
  }

  localSelectedIndex.value = index
  flippedIndexes.value = props.allowMultipleFlip
    ? [...new Set([...flippedIndexes.value, index])]
    : [index]

  emit('flip-start', {
    card,
    index
  })

  emit('select-card', {
    card,
    index
  })

  window.setTimeout(() => {
    emit('flip-end', {
      card,
      index,
      prize: props.resultPrize
    })
  }, 420)
}

const resetCards = () => {
  localSelectedIndex.value = -1
  flippedIndexes.value = []
  emit('reset')
}
</script>

<template>
  <section class="relative mx-auto w-full max-w-[420px]">
    <div class="relative overflow-hidden rounded-[34px] border-[6px] border-indigo-300 bg-gradient-to-br from-indigo-700 via-purple-700 to-fuchsia-700 p-4 shadow-[0_28px_60px_rgba(49,46,129,.45)]">
      <div class="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/15 blur-2xl"></div>
      <div class="absolute -bottom-14 -left-12 h-40 w-40 rounded-full bg-pink-300/20 blur-3xl"></div>

      <div class="relative mb-4 flex items-center justify-between gap-3 text-white">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.22em] text-white/65">
            Flip Card
          </p>

          <h3 class="mt-1 text-xl font-black">
            翻牌抽獎
          </h3>
        </div>

        <button
          type="button"
          class="rounded-full bg-white px-4 py-2 text-xs font-black text-purple-700 shadow-sm transition hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="!canFlip"
          @click="startDraw"
        >
          {{ isDrawing ? '抽選中' : drawButtonText }}
        </button>
      </div>

      <div
        v-if="normalizedCards.length"
        class="grid grid-cols-3 gap-3"
      >
        <button
          v-for="(card, index) in normalizedCards"
          :key="card.id"
          type="button"
          class="flip-card relative aspect-[0.78] rounded-3xl text-center transition"
          :class="[
            isCardFlipped(index) ? 'flip-card-open' : '',
            !canFlip ? 'cursor-not-allowed opacity-80' : 'hover:-translate-y-1'
          ]"
          :disabled="!canFlip"
          @click="selectCard(card, index)"
        >
          <div class="flip-card-inner absolute inset-0 rounded-3xl">
            <div class="flip-card-face flip-card-front absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-white/30 bg-gradient-to-br from-yellow-200 via-orange-300 to-orange-500 p-2 text-orange-950 shadow-xl">
              <span class="text-3xl">🎴</span>
              <span class="mt-2 text-[11px] font-black tracking-[0.12em]">
                {{ cardBackText }}
              </span>
              <span class="mt-1 text-[10px] font-bold opacity-70">
                #{{ index + 1 }}
              </span>
            </div>

            <div class="flip-card-face flip-card-back absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-white/40 bg-white p-2 text-slate-900 shadow-xl">
              <template v-if="resultPrize && isCardFlipped(index)">
                <span class="rounded-full border px-2 py-0.5 text-[10px] font-black" :class="resultTypeInfo.class">
                  {{ resultTypeInfo.label }}
                </span>

                <div class="mt-2 flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-purple-50 text-3xl shadow-inner">
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

                <p class="mt-2 line-clamp-2 text-xs font-black leading-4">
                  {{ resultShortName }}
                </p>
              </template>

              <template v-else>
                <span class="text-3xl">{{ card.icon }}</span>
                <p class="mt-2 line-clamp-2 text-xs font-black leading-4">
                  {{ card.shortName }}
                </p>
              </template>
            </div>
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
          @click="resetCards"
        >
          重置卡片
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

.flip-card {
  perspective: 1000px;
}

.flip-card-inner {
  transform-style: preserve-3d;
  transition: transform 0.52s cubic-bezier(0.16, 1, 0.3, 1);
}

.flip-card-open .flip-card-inner {
  transform: rotateY(180deg);
}

.flip-card-face {
  backface-visibility: hidden;
}

.flip-card-back {
  transform: rotateY(180deg);
}
</style>
