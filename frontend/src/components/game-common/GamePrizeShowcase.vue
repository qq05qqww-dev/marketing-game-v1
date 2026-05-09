<script setup>
// Multi Game Platform V2.3
// 第 53 批：GamePrizeShowcase.vue 共用獎品展示元件版
//
// 放置位置：
// frontend/src/components/game-common/GamePrizeShowcase.vue
//
// 這一批只建立共用元件，不接入任何遊戲頁。
// 後續第 54 批才會讓 PremiumGridLotteryView.vue 改接這個元件。

import { computed, ref } from 'vue'

const props = defineProps({
  prizes: {
    type: Array,
    default: () => []
  },
  title: {
    type: String,
    default: '獎品展示'
  },
  description: {
    type: String,
    default: '預設精簡顯示，點擊可展開完整獎品清單。'
  },
  compactCount: {
    type: Number,
    default: 4
  },
  showHighlight: {
    type: Boolean,
    default: true
  },
  defaultExpanded: {
    type: Boolean,
    default: false
  }
})

const showAll = ref(props.defaultExpanded)

const normalizedPrizes = computed(() => {
  return props.prizes.map((item, index) => {
    const title = item.title || item.name || item.shortName || `獎品 ${index + 1}`
    const shortName = item.shortName || item.title || item.name || title
    const icon = item.icon || item.emoji || '🎁'
    const imageUrl = item.imageUrl || item.image || ''
    const quantity = Number(item.quantity ?? item.remainStock ?? item.remainingStock ?? item.stock ?? 0)
    const weight = Number(item.weight ?? item.probability ?? item.chance ?? 0)

    return {
      ...item,
      id: item.id || `prize_${index}`,
      title,
      shortName,
      icon,
      imageUrl,
      quantity,
      weight
    }
  })
})

const visiblePrizes = computed(() => {
  if (showAll.value) return normalizedPrizes.value

  return normalizedPrizes.value.slice(0, props.compactCount)
})

const hiddenPrizeCount = computed(() => {
  return Math.max(0, normalizedPrizes.value.length - visiblePrizes.value.length)
})

const totalWeight = computed(() => {
  return normalizedPrizes.value.reduce((sum, item) => {
    return sum + Number(item.weight || 0)
  }, 0)
})

const topPrize = computed(() => {
  const availablePrizes = normalizedPrizes.value.filter((item) => Number(item.quantity || 0) > 0)

  if (!availablePrizes.length) return null

  return [...availablePrizes].sort((a, b) => {
    return Number(a.weight || 0) - Number(b.weight || 0)
  })[0]
})

const getPrizeStockInfo = (prize = {}) => {
  const quantity = Number(prize.quantity || 0)

  if (quantity <= 0) {
    return {
      label: '已抽完',
      class: 'bg-rose-50 text-rose-600 border-rose-100',
      barClass: 'bg-rose-500',
      percent: 6
    }
  }

  if (quantity <= 10) {
    return {
      label: `剩 ${quantity}`,
      class: 'bg-amber-50 text-amber-600 border-amber-100',
      barClass: 'bg-amber-500',
      percent: Math.max(14, Math.min(100, quantity))
    }
  }

  return {
    label: `庫存 ${quantity}`,
    class: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    barClass: 'bg-emerald-500',
    percent: Math.min(100, Math.max(18, quantity))
  }
}

const getPrizeChanceInfo = (prize = {}) => {
  const weight = Number(prize.weight || 0)
  const percent = totalWeight.value > 0 ? (weight / totalWeight.value) * 100 : 0

  if (percent <= 0) {
    return {
      label: '未開放',
      percent: 0
    }
  }

  return {
    label: `${percent.toFixed(percent >= 10 ? 0 : 1)}%`,
    percent: Math.min(100, Math.max(6, percent))
  }
}

const expandAll = () => {
  showAll.value = true
}

const collapseAll = () => {
  showAll.value = false
}

const toggleExpanded = () => {
  showAll.value = !showAll.value
}
</script>

<template>
  <section class="relative overflow-hidden rounded-[30px] bg-white/95 p-4 shadow-xl">
    <div class="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
      <div>
        <p class="text-xs font-black text-slate-700">
          {{ title }}
        </p>

        <p class="mt-1 text-[10px] font-bold text-slate-400">
          {{ description }}
        </p>
      </div>

      <button
        v-if="normalizedPrizes.length > compactCount"
        type="button"
        class="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-500 transition hover:bg-slate-200"
        @click="toggleExpanded"
      >
        {{ showAll ? '收合' : '展開全部' }}
      </button>
    </div>

    <div
      v-if="showHighlight && topPrize"
      class="mt-3 rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 to-yellow-50 p-3"
    >
      <div class="flex items-center gap-3">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-inner">
          <img
            v-if="topPrize.imageUrl"
            :src="topPrize.imageUrl"
            :alt="topPrize.title"
            class="h-full w-full rounded-2xl object-cover"
          />

          <span v-else>
            {{ topPrize.icon }}
          </span>
        </div>

        <div class="min-w-0 flex-1">
          <p class="text-[10px] font-black tracking-[0.2em] text-orange-500">
            今日亮點獎項
          </p>

          <p class="mt-1 truncate text-sm font-black text-slate-900">
            {{ topPrize.title }}
          </p>
        </div>

        <span class="rounded-full border border-orange-200 bg-white px-3 py-1 text-[10px] font-black text-orange-600">
          {{ getPrizeChanceInfo(topPrize).label }}
        </span>
      </div>
    </div>

    <div
      v-if="visiblePrizes.length"
      class="mt-3 grid grid-cols-2 gap-3"
    >
      <article
        v-for="prize in visiblePrizes"
        :key="prize.id"
        class="min-w-0 rounded-3xl border border-slate-100 bg-white p-3 text-center shadow-sm"
      >
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-yellow-200 bg-gradient-to-br from-yellow-100 to-orange-200 text-2xl shadow-inner">
          <img
            v-if="prize.imageUrl"
            :src="prize.imageUrl"
            :alt="prize.title"
            class="h-full w-full rounded-2xl object-cover"
          />

          <span v-else>
            {{ prize.icon }}
          </span>
        </div>

        <p class="mt-2 line-clamp-2 min-h-[28px] text-[11px] font-black leading-4 text-slate-700">
          {{ prize.title }}
        </p>

        <div class="mt-2 flex justify-center">
          <span
            class="max-w-full truncate rounded-full border px-2 py-0.5 text-[10px] font-black"
            :class="getPrizeStockInfo(prize).class"
          >
            {{ getPrizeStockInfo(prize).label }}
          </span>
        </div>

        <div class="mt-2 space-y-1 text-left">
          <div class="flex items-center justify-between gap-2 text-[10px] font-black text-slate-400">
            <span>權重</span>
            <span>{{ getPrizeChanceInfo(prize).label }}</span>
          </div>

          <div class="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              class="h-full rounded-full bg-orange-500"
              :style="{ width: `${getPrizeChanceInfo(prize).percent}%` }"
            ></div>
          </div>
        </div>
      </article>
    </div>

    <div
      v-else
      class="mt-3 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center"
    >
      <p class="text-sm font-black text-slate-500">
        目前尚無獎品資料
      </p>

      <p class="mt-1 text-xs font-bold text-slate-400">
        請至後台獎品管理建立活動獎品。
      </p>
    </div>

    <button
      v-if="hiddenPrizeCount > 0"
      type="button"
      class="mt-3 w-full rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-xs font-black text-orange-600 transition hover:bg-orange-100"
      @click="expandAll"
    >
      還有 {{ hiddenPrizeCount }} 個獎品，點擊展開全部
    </button>

    <button
      v-else-if="showAll && normalizedPrizes.length > compactCount"
      type="button"
      class="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black text-slate-500 transition hover:bg-slate-100"
      @click="collapseAll"
    >
      收合獎品展示
    </button>
  </section>
</template>
