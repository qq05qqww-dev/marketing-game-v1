<script setup>
// Multi Game Platform V2.3
// 第 61 批：GameChanceCard.vue 共用抽獎機會元件版
//
// 放置位置：
// frontend/src/components/game-common/GameChanceCard.vue
//
// 目的：
// 1. 統一顯示抽獎機會、分享次數、狀態提示。
// 2. 金蛋、九宮格、輪盤、刮刮卡未來都可共用。
// 3. 這一批只建立元件，不接入任何遊戲頁。

import { computed } from 'vue'

const props = defineProps({
  chances: {
    type: Number,
    default: 0
  },
  sharedCount: {
    type: Number,
    default: 0
  },
  availablePrizeCount: {
    type: Number,
    default: 0
  },
  isDrawing: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  blocked: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  statusMessage: {
    type: String,
    default: ''
  },
  shareHint: {
    type: String,
    default: '分享活動可增加抽獎機會'
  },
  drawButtonText: {
    type: String,
    default: '點擊抽選'
  },
  shareButtonText: {
    type: String,
    default: '分享'
  },
  showShareButton: {
    type: Boolean,
    default: true
  },
  showPrimaryButton: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits([
  'draw',
  'share'
])

const chanceProgressPercent = computed(() => {
  const value = Number(props.chances || 0)
  return Math.min(100, Math.max(0, value * 25))
})

const shareProgressPercent = computed(() => {
  const value = Number(props.sharedCount || 0)
  return Math.min(100, Math.max(0, value * 25))
})

const canDraw = computed(() => {
  return !props.loading
    && !props.blocked
    && !props.error
    && !props.isDrawing
    && Number(props.chances || 0) > 0
    && Number(props.availablePrizeCount || 0) > 0
})

const canShare = computed(() => {
  return !props.loading
    && !props.blocked
    && !props.isDrawing
})

const chanceLevelInfo = computed(() => {
  if (props.loading) {
    return {
      label: '載入中',
      description: '正在同步活動資料',
      icon: '⏳',
      class: 'from-blue-400 to-indigo-500'
    }
  }

  if (props.error || props.blocked) {
    return {
      label: '尚未開放',
      description: props.error || props.statusMessage || '目前活動暫時無法參加',
      icon: '🔒',
      class: 'from-slate-500 to-slate-700'
    }
  }

  if (Number(props.availablePrizeCount || 0) <= 0) {
    return {
      label: '補貨等待',
      description: '目前獎品已抽完',
      icon: '📦',
      class: 'from-rose-400 to-red-500'
    }
  }

  if (props.isDrawing) {
    return {
      label: '抽選中',
      description: '系統正在產生本次抽獎結果',
      icon: '✨',
      class: 'from-yellow-400 to-orange-500'
    }
  }

  if (Number(props.chances || 0) <= 0) {
    return {
      label: '需要分享',
      description: props.shareHint || '分享活動可增加機會',
      icon: '🎁',
      class: 'from-blue-400 to-indigo-500'
    }
  }

  if (Number(props.chances || 0) <= 2) {
    return {
      label: '可抽獎',
      description: '機會有限，把握抽獎',
      icon: '🎯',
      class: 'from-orange-400 to-red-500'
    }
  }

  return {
    label: '機會充足',
    description: '可以連續挑戰活動',
    icon: '🔥',
    class: 'from-emerald-400 to-teal-500'
  }
})

const primaryButtonText = computed(() => {
  if (props.loading) return '載入中'
  if (props.blocked || props.error) return '尚未開放'
  if (props.isDrawing) return '抽選中'
  if (Number(props.availablePrizeCount || 0) <= 0) return '獎品已抽完'
  if (Number(props.chances || 0) <= 0) return '分享增加機會'

  return props.drawButtonText || '點擊抽選'
})

const handlePrimaryClick = () => {
  if (canDraw.value) {
    emit('draw')
    return
  }

  if (!props.loading && !props.blocked && !props.error && Number(props.chances || 0) <= 0) {
    emit('share')
  }
}

const handleShareClick = () => {
  if (!canShare.value) return

  emit('share')
}
</script>

<template>
  <section class="relative">
    <div class="rounded-[30px] border border-white/20 bg-white/15 p-4 text-white shadow-inner backdrop-blur">
      <div class="flex items-center gap-3 text-left">
        <div
          class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl shadow-lg"
          :class="chanceLevelInfo.class"
        >
          {{ chanceLevelInfo.icon }}
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-3">
            <p class="text-sm font-black">
              {{ chanceLevelInfo.label }}
            </p>

            <span class="rounded-full bg-white/20 px-3 py-1 text-[11px] font-black">
              {{ chances }} 次
            </span>
          </div>

          <p class="mt-1 truncate text-xs font-bold text-white/75">
            {{ chanceLevelInfo.description }}
          </p>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-3">
        <div class="rounded-2xl bg-white/15 p-3">
          <div class="flex items-center justify-between text-[11px] font-black">
            <span>抽獎機會</span>
            <span>{{ chances }}</span>
          </div>

          <div class="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
            <div
              class="h-full rounded-full bg-white"
              :style="{ width: `${chanceProgressPercent}%` }"
            ></div>
          </div>
        </div>

        <div class="rounded-2xl bg-white/15 p-3">
          <div class="flex items-center justify-between text-[11px] font-black">
            <span>分享次數</span>
            <span>{{ sharedCount }}</span>
          </div>

          <div class="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
            <div
              class="h-full rounded-full bg-yellow-200"
              :style="{ width: `${shareProgressPercent}%` }"
            ></div>
          </div>
        </div>
      </div>

      <p
        v-if="statusMessage"
        class="mt-3 rounded-2xl px-4 py-2 text-center text-xs font-black leading-5 shadow-inner"
        :class="canDraw
          ? 'bg-white/10 text-white/80'
          : 'bg-white text-orange-600'
        "
      >
        {{ statusMessage }}
      </p>

      <div
        v-if="showPrimaryButton || showShareButton"
        class="mt-3 grid gap-3"
        :class="showPrimaryButton && showShareButton ? 'grid-cols-2' : 'grid-cols-1'"
      >
        <button
          v-if="showPrimaryButton"
          type="button"
          class="rounded-2xl bg-white px-4 py-3 text-sm font-black text-orange-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="loading || blocked || Boolean(error) || isDrawing || (availablePrizeCount <= 0)"
          @click="handlePrimaryClick"
        >
          {{ primaryButtonText }}
        </button>

        <button
          v-if="showShareButton"
          type="button"
          class="rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-sm font-black text-white shadow-inner backdrop-blur transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="!canShare"
          @click="handleShareClick"
        >
          {{ shareButtonText }}
        </button>
      </div>

      <p class="mt-3 text-center text-xs font-bold leading-5 text-white/75">
        {{ shareHint }}，目前已分享 {{ sharedCount }} 次
      </p>
    </div>
  </section>
</template>
