<script setup>
// Multi Game Platform V2.3
// 第 69 批：GameStatusNotice.vue 共用活動狀態提示元件版
//
// 放置位置：
// frontend/src/components/game-common/GameStatusNotice.vue
//
// 目的：
// 1. 統一顯示活動載入中、載入失敗、尚未開放、未開始、已結束等提示。
// 2. 統一顯示活動資料同步時間。
// 3. 支援重新載入活動資料按鈕。
// 4. 金蛋、九宮格、輪盤、刮刮卡未來都可共用。
// 5. 這一批只建立元件，不接入任何遊戲頁。

import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  blocked: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  loadedAt: {
    type: String,
    default: ''
  },
  infoMessage: {
    type: String,
    default: ''
  },
  canRetry: {
    type: Boolean,
    default: true
  },
  retryText: {
    type: String,
    default: '重新載入活動資料'
  }
})

const emit = defineEmits([
  'retry'
])

const noticeInfo = computed(() => {
  if (props.loading) {
    return {
      show: true,
      title: props.title || '正在載入活動資料',
      message: props.message || '系統正在同步商家活動與獎品資料，請稍候。',
      icon: '⏳',
      badge: props.label || 'Loading',
      badgeClass: 'border-blue-200/70 bg-blue-50 text-blue-700',
      cardClass: 'border-white/25 bg-white/20'
    }
  }

  if (props.error) {
    return {
      show: true,
      title: props.title || '活動資料載入失敗',
      message: props.error || props.message || '載入活動資料失敗，請稍後再試。',
      icon: '⚠️',
      badge: props.label || 'Error',
      badgeClass: 'border-rose-200/70 bg-rose-50 text-rose-700',
      cardClass: 'border-rose-200/60 bg-rose-500/20'
    }
  }

  if (props.blocked) {
    return {
      show: true,
      title: props.title || '活動尚未開放',
      message: props.message || '目前活動暫時無法參加，請依主辦單位公告為準。',
      icon: '🔒',
      badge: props.label || '尚未開放',
      badgeClass: 'border-amber-200/70 bg-amber-50 text-amber-700',
      cardClass: 'border-amber-200/60 bg-amber-500/20'
    }
  }

  if (props.infoMessage) {
    return {
      show: true,
      title: props.title || '活動資料提示',
      message: props.infoMessage,
      icon: 'ℹ️',
      badge: props.label || 'Info',
      badgeClass: 'border-white/40 bg-white text-orange-600',
      cardClass: 'border-white/25 bg-white/20'
    }
  }

  return {
    show: false,
    title: '',
    message: '',
    icon: '',
    badge: '',
    badgeClass: '',
    cardClass: ''
  }
})

const shouldShow = computed(() => {
  return Boolean(props.show && noticeInfo.value.show)
})

const retry = () => {
  emit('retry')
}
</script>

<template>
  <section
    v-if="shouldShow"
    class="relative overflow-hidden rounded-[30px] border p-4 text-left shadow-inner backdrop-blur"
    :class="noticeInfo.cardClass"
  >
    <div class="flex items-start gap-3">
      <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl shadow-inner">
        {{ noticeInfo.icon }}
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <span
            class="inline-flex rounded-full border px-3 py-1 text-[11px] font-black"
            :class="noticeInfo.badgeClass"
          >
            {{ noticeInfo.badge }}
          </span>

          <span
            v-if="loadedAt && !loading"
            class="inline-flex rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[11px] font-black text-white/65"
          >
            已同步
          </span>
        </div>

        <p class="mt-2 text-sm font-black text-white">
          {{ noticeInfo.title }}
        </p>

        <p class="mt-1 text-xs font-bold leading-6 text-white/75">
          {{ noticeInfo.message }}
        </p>

        <p
          v-if="loadedAt && !loading"
          class="mt-2 text-[11px] font-bold text-white/55"
        >
          活動資料同步時間：{{ loadedAt }}
        </p>
      </div>
    </div>

    <button
      v-if="error && canRetry"
      type="button"
      class="mt-3 w-full rounded-2xl bg-white px-4 py-3 text-xs font-black text-orange-600 shadow-sm transition hover:bg-orange-50"
      @click="retry"
    >
      {{ retryText }}
    </button>
  </section>
</template>
