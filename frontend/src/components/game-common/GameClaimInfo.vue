<script setup>
// Multi Game Platform V2.3
// 第 65 批：GameClaimInfo.vue 共用領獎提醒元件版
//
// 放置位置：
// frontend/src/components/game-common/GameClaimInfo.vue
//
// 目的：
// 1. 統一顯示領獎提醒。
// 2. 統一顯示保留結果 / 查看紀錄 / 聯絡確認。
// 3. 金蛋、九宮格、輪盤、刮刮卡未來都可共用。
// 4. 這一批只建立元件，不接入任何遊戲頁。

const props = defineProps({
  title: {
    type: String,
    default: '領獎提醒'
  },
  description: {
    type: String,
    default: '中獎後請保留結果畫面或前往我的遊戲紀錄查看，實際兌換方式以主辦單位公告為準。'
  },
  contactText: {
    type: String,
    default: '請洽活動主辦單位確認兌換方式。'
  },
  showHistoryButton: {
    type: Boolean,
    default: true
  },
  showShareButton: {
    type: Boolean,
    default: true
  },
  historyButtonText: {
    type: String,
    default: '查看我的紀錄'
  },
  shareButtonText: {
    type: String,
    default: '複製活動連結'
  },
  variant: {
    type: String,
    default: 'dark'
  }
})

const emit = defineEmits([
  'open-history',
  'share'
])

const claimInfoItems = [
  {
    title: '保留結果',
    description: '抽中獎項後，請保留結果畫面或截圖方便後續核對。',
    icon: '📸'
  },
  {
    title: '查看紀錄',
    description: '可點擊「查看我的紀錄」再次確認本次抽獎結果。',
    icon: '🧾'
  },
  {
    title: '聯絡確認',
    description: props.contactText || '請洽活動主辦單位確認兌換方式。',
    icon: '💬'
  }
]

const isDarkVariant = () => {
  return props.variant === 'dark'
}
</script>

<template>
  <section
    class="relative overflow-hidden rounded-[30px] p-4 shadow-inner backdrop-blur"
    :class="isDarkVariant()
      ? 'border border-white/20 bg-white/15 text-white'
      : 'border border-slate-100 bg-white text-slate-900 shadow-xl'
    "
  >
    <div class="flex items-start gap-3">
      <div
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-inner"
        :class="isDarkVariant() ? 'bg-white/20' : 'bg-orange-50'"
      >
        🎫
      </div>

      <div class="min-w-0 flex-1 text-left">
        <p
          class="text-sm font-black"
          :class="isDarkVariant() ? 'text-white' : 'text-slate-900'"
        >
          {{ title }}
        </p>

        <p
          class="mt-1 text-xs font-bold leading-6"
          :class="isDarkVariant() ? 'text-white/75' : 'text-slate-500'"
        >
          {{ description }}
        </p>
      </div>
    </div>

    <div class="mt-3 grid gap-3">
      <article
        v-for="item in claimInfoItems"
        :key="item.title"
        class="flex items-start gap-3 rounded-2xl p-3"
        :class="isDarkVariant() ? 'bg-white/12' : 'bg-orange-50/70'"
      >
        <div
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
          :class="isDarkVariant() ? 'bg-white/15' : 'bg-white shadow-sm'"
        >
          {{ item.icon }}
        </div>

        <div class="min-w-0 text-left">
          <p
            class="text-xs font-black"
            :class="isDarkVariant() ? 'text-white' : 'text-slate-800'"
          >
            {{ item.title }}
          </p>

          <p
            class="mt-1 text-[11px] font-bold leading-5"
            :class="isDarkVariant() ? 'text-white/65' : 'text-slate-500'"
          >
            {{ item.description }}
          </p>
        </div>
      </article>
    </div>

    <div
      v-if="showHistoryButton || showShareButton"
      class="mt-3 grid gap-3"
      :class="showHistoryButton && showShareButton ? 'grid-cols-2' : 'grid-cols-1'"
    >
      <button
        v-if="showHistoryButton"
        type="button"
        class="rounded-2xl bg-white px-4 py-3 text-xs font-black text-orange-600 shadow-sm transition hover:bg-orange-50"
        @click="emit('open-history')"
      >
        {{ historyButtonText }}
      </button>

      <button
        v-if="showShareButton"
        type="button"
        class="rounded-2xl px-4 py-3 text-xs font-black transition"
        :class="isDarkVariant()
          ? 'border border-white/30 bg-white/15 text-white hover:bg-white/25'
          : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
        "
        @click="emit('share')"
      >
        {{ shareButtonText }}
      </button>
    </div>
  </section>
</template>
