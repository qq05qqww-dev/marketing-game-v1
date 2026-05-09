<script setup>
// Multi Game Platform V2.3
// 第 73 批：GameFooterInfo.vue 共用底部活動資訊元件版
//
// 放置位置：
// frontend/src/components/game-common/GameFooterInfo.vue
//
// 目的：
// 1. 統一顯示前台底部活動資訊。
// 2. 顯示活動商家、活動狀態、活動來源、同步時間。
// 3. 金蛋、九宮格、輪盤、刮刮卡未來都可共用。
// 4. 這一批只建立元件，不接入任何遊戲頁。

import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: '活動資訊'
  },
  description: {
    type: String,
    default: '參加前請確認活動狀態與商家提醒。'
  },
  merchantName: {
    type: String,
    default: '活動商家'
  },
  statusLabel: {
    type: String,
    default: '活動進行中'
  },
  statusIcon: {
    type: String,
    default: '✅'
  },
  sourceLabel: {
    type: String,
    default: '直接進入'
  },
  loadedAt: {
    type: String,
    default: ''
  },
  noticeText: {
    type: String,
    default: '本活動頁會依商家後台設定同步獎品、庫存與抽獎狀態。'
  },
  variant: {
    type: String,
    default: 'dark'
  },
  extraItems: {
    type: Array,
    default: () => []
  }
})

const isDarkVariant = computed(() => {
  return props.variant === 'dark'
})

const footerInfoItems = computed(() => {
  return [
    {
      label: '活動商家',
      value: props.merchantName || '活動商家',
      icon: '🏪'
    },
    {
      label: '活動狀態',
      value: props.statusLabel || '活動進行中',
      icon: props.statusIcon || '✅'
    },
    {
      label: '活動來源',
      value: props.sourceLabel || '直接進入',
      icon: '📣'
    },
    ...props.extraItems
  ]
})

const footerNoticeText = computed(() => {
  if (props.loadedAt) {
    return `活動資料已同步：${props.loadedAt}`
  }

  return props.noticeText
})
</script>

<template>
  <section
    class="relative overflow-hidden rounded-[30px] p-4 shadow-inner backdrop-blur"
    :class="isDarkVariant
      ? 'border border-white/20 bg-white/15 text-white'
      : 'border border-slate-100 bg-white text-slate-900 shadow-xl'
    "
  >
    <div class="flex items-center justify-between gap-3">
      <div>
        <p
          class="text-sm font-black"
          :class="isDarkVariant ? 'text-white' : 'text-slate-900'"
        >
          {{ title }}
        </p>

        <p
          class="mt-1 text-xs font-bold"
          :class="isDarkVariant ? 'text-white/65' : 'text-slate-500'"
        >
          {{ description }}
        </p>
      </div>

      <div
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-inner"
        :class="isDarkVariant ? 'bg-white/15' : 'bg-orange-50'"
      >
        ℹ️
      </div>
    </div>

    <div class="mt-3 grid gap-2">
      <article
        v-for="item in footerInfoItems"
        :key="item.label"
        class="flex items-center justify-between gap-3 rounded-2xl px-3 py-2"
        :class="isDarkVariant ? 'bg-white/12' : 'bg-slate-50'"
      >
        <div class="flex min-w-0 items-center gap-2">
          <span class="text-base">
            {{ item.icon }}
          </span>

          <span
            class="text-xs font-black"
            :class="isDarkVariant ? 'text-white/70' : 'text-slate-500'"
          >
            {{ item.label }}
          </span>
        </div>

        <span
          class="truncate text-right text-xs font-black"
          :class="isDarkVariant ? 'text-white' : 'text-slate-800'"
        >
          {{ item.value }}
        </span>
      </article>
    </div>

    <p
      class="mt-3 rounded-2xl px-3 py-2 text-[11px] font-bold leading-5"
      :class="isDarkVariant
        ? 'bg-white/10 text-white/65'
        : 'bg-orange-50 text-orange-700'
      "
    >
      {{ footerNoticeText }}
    </p>
  </section>
</template>
