<script setup>
// Multi Game Platform V2.3
// 第 67 批：GameActivityHeader.vue 共用活動主視覺元件版
//
// 放置位置：
// frontend/src/components/game-common/GameActivityHeader.vue
//
// 目的：
// 1. 統一顯示活動主視覺。
// 2. 統一顯示活動狀態、標題、商家名稱、統計卡。
// 3. 金蛋、九宮格、輪盤、刮刮卡未來都可共用。
// 4. 這一批只建立元件，不接入任何遊戲頁。

import { computed } from 'vue'

const props = defineProps({
  brandName: {
    type: String,
    default: 'Multi Game Platform'
  },
  brandTagline: {
    type: String,
    default: '打造專屬互動抽獎體驗'
  },
  logoText: {
    type: String,
    default: 'M'
  },
  logoImageUrl: {
    type: String,
    default: ''
  },
  pageTitle: {
    type: String,
    default: '互動抽獎活動'
  },
  mainTitle: {
    type: String,
    default: '互動抽獎'
  },
  heroTagline: {
    type: String,
    default: '好禮等你拿'
  },
  subTitle: {
    type: String,
    default: '每日參加抽好禮'
  },
  statusLabel: {
    type: String,
    default: '活動進行中'
  },
  statusIcon: {
    type: String,
    default: '✅'
  },
  statusType: {
    type: String,
    default: 'active'
  },
  chances: {
    type: Number,
    default: 0
  },
  availablePrizeCount: {
    type: Number,
    default: 0
  },
  sharedCount: {
    type: Number,
    default: 0
  },
  websiteUrl: {
    type: String,
    default: ''
  },
  websiteText: {
    type: String,
    default: '官方網站'
  },
  bannerLayout: {
    type: String,
    default: 'standard'
  }
})

const emit = defineEmits([
  'open-website'
])

const logoDisplayText = computed(() => {
  return String(props.logoText || props.brandName || 'M').slice(0, 1).toUpperCase()
})

const statusBadgeClass = computed(() => {
  const type = String(props.statusType || '').toLowerCase()

  if (['blocked', 'closed', 'ended', 'error'].includes(type)) {
    return 'border-rose-200 bg-rose-50 text-rose-700'
  }

  if (['loading', 'pending', 'draft', 'scheduled'].includes(type)) {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  return 'border-emerald-100 bg-emerald-50 text-emerald-700'
})

const heroStats = computed(() => {
  return [
    {
      label: '抽獎機會',
      value: `${props.chances}`,
      suffix: '次',
      icon: '🎯'
    },
    {
      label: '可抽獎品',
      value: `${props.availablePrizeCount}`,
      suffix: '項',
      icon: '🎁'
    },
    {
      label: '分享次數',
      value: `${props.sharedCount}`,
      suffix: '次',
      icon: '📣'
    }
  ]
})

const isCenterLayout = computed(() => {
  return props.bannerLayout === 'center'
})

const openWebsite = () => {
  emit('open-website', props.websiteUrl)
}
</script>

<template>
  <section class="relative scroll-mt-4">
    <div
      class="relative overflow-hidden rounded-[34px] border border-white/25 bg-white/15 p-4 text-white shadow-inner backdrop-blur"
      :class="isCenterLayout ? 'text-center' : 'text-left'"
    >
      <div
        class="flex gap-3"
        :class="isCenterLayout ? 'flex-col items-center justify-center' : 'items-center justify-between'"
      >
        <div
          class="flex min-w-0 items-center gap-3"
          :class="isCenterLayout ? 'flex-col text-center' : ''"
        >
          <div class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/20 text-2xl font-black shadow-inner">
            <img
              v-if="logoImageUrl"
              :src="logoImageUrl"
              :alt="brandName"
              class="h-full w-full object-cover"
            />

            <span v-else>
              {{ logoDisplayText }}
            </span>
          </div>

          <div class="min-w-0">
            <p class="truncate text-sm font-black">
              {{ brandName }}
            </p>

            <p class="mt-1 truncate text-xs font-bold text-white/65">
              {{ brandTagline }}
            </p>
          </div>
        </div>

        <button
          v-if="websiteUrl"
          type="button"
          class="shrink-0 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-xs font-black text-white transition hover:bg-white/25"
          @click="openWebsite"
        >
          {{ websiteText }}
        </button>
      </div>

      <div class="mt-4 overflow-hidden rounded-[32px] border border-white/20 bg-white/12 p-4 text-center shadow-inner backdrop-blur">
        <div class="flex justify-center">
          <span
            class="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-black shadow-sm"
            :class="statusBadgeClass"
          >
            <span>{{ statusIcon }}</span>
            <span>{{ statusLabel }}</span>
          </span>
        </div>

        <p class="mx-auto mt-3 max-w-[320px] text-3xl font-black leading-tight tracking-wide text-yellow-100 drop-shadow-[0_4px_0_rgba(154,52,18,0.45)] sm:text-4xl">
          {{ mainTitle }}
        </p>

        <p class="mt-1 text-xl font-black leading-tight text-yellow-200 drop-shadow-[0_4px_0_rgba(154,52,18,0.45)] sm:text-3xl">
          {{ heroTagline }}
        </p>

        <p class="mx-auto mt-3 max-w-[300px] rounded-full bg-white/20 px-4 py-2 text-xs font-black leading-5 text-white shadow-inner backdrop-blur sm:text-sm">
          {{ subTitle }}
        </p>

        <div class="mt-4 grid grid-cols-3 gap-2">
          <div
            v-for="stat in heroStats"
            :key="stat.label"
            class="rounded-2xl border border-white/15 bg-white/15 px-2 py-3 text-white shadow-inner"
          >
            <p class="text-lg leading-none">
              {{ stat.icon }}
            </p>

            <p class="mt-1 text-lg font-black leading-none">
              {{ stat.value }}<span class="text-[10px]">{{ stat.suffix }}</span>
            </p>

            <p class="mt-1 text-[10px] font-black text-white/65">
              {{ stat.label }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
