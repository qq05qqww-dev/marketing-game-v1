<script setup>
// Multi Game Platform V2.3
// 第 63 批：GameDrawLogs.vue 共用抽獎紀錄元件版
//
// 放置位置：
// frontend/src/components/game-common/GameDrawLogs.vue
//
// 目的：
// 1. 統一顯示最新抽獎紀錄。
// 2. 支援中獎 / 未中獎 / 加碼標籤。
// 3. 支援分享來源顯示。
// 4. 支援最新紀錄高亮。
// 5. 金蛋、九宮格、輪盤、刮刮卡未來都可共用。
// 6. 這一批只建立元件，不接入任何遊戲頁。

import { computed } from 'vue'

const props = defineProps({
  logs: {
    type: Array,
    default: () => []
  },
  latestLogId: {
    type: [String, Number],
    default: ''
  },
  title: {
    type: String,
    default: '最新抽獎紀錄'
  },
  description: {
    type: String,
    default: '顯示本頁最近 8 筆抽獎結果與來源，最新結果會自動高亮。'
  },
  emptyTitle: {
    type: String,
    default: '尚無抽獎紀錄'
  },
  emptyDescription: {
    type: String,
    default: '完成抽獎後，紀錄會同步顯示在這裡。'
  },
  maxVisible: {
    type: Number,
    default: 8
  },
  variant: {
    type: String,
    default: 'light'
  },
  showClearButton: {
    type: Boolean,
    default: true
  },
  compact: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'clear'
])

const visibleLogs = computed(() => {
  return props.logs.slice(0, props.maxVisible)
})

const isDarkVariant = computed(() => {
  return props.variant === 'dark'
})

const getTrafficSourceLabel = (source = '') => {
  const value = String(source || '').trim().toLowerCase()

  const labels = {
    line: 'LINE',
    facebook: 'Facebook',
    instagram: 'Instagram',
    direct: '直接進入'
  }

  return labels[value] || value || '直接進入'
}

const getDrawLogPrizeName = (log = {}) => {
  return log.prizeName || log.title || log.name || log.shortName || '活動獎項'
}

const getDrawLogIcon = (log = {}) => {
  return log.icon || log.emoji || '🎁'
}

const getDrawLogTypeInfo = (log = {}) => {
  const title = String(getDrawLogPrizeName(log))
  const type = String(log.type || log.result || '').toUpperCase()

  if (type === 'LOSE' || title.includes('銘謝惠顧') || title.includes('未中獎') || title.includes('謝謝參加')) {
    return {
      label: '未中獎',
      lightClass: 'border-slate-200 bg-slate-50 text-slate-600',
      darkClass: 'bg-white/20 text-white'
    }
  }

  if (type === 'REPLAY' || title.includes('再玩一次') || title.includes('再抽一次')) {
    return {
      label: '加碼',
      lightClass: 'border-sky-200 bg-sky-50 text-sky-700',
      darkClass: 'bg-sky-300/25 text-white'
    }
  }

  return {
    label: '中獎',
    lightClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    darkClass: 'bg-emerald-300/25 text-white'
  }
}

const isLatestLog = (log = {}) => {
  return Boolean(props.latestLogId && String(log.id) === String(props.latestLogId))
}

const getLogCardClass = (log = {}) => {
  if (isDarkVariant.value) {
    return isLatestLog(log)
      ? 'bg-yellow-300/25 ring-2 ring-yellow-200/70 game-draw-log-glow'
      : 'bg-white/15'
  }

  return isLatestLog(log)
    ? 'border-amber-200 bg-amber-50 game-draw-log-glow'
    : 'border-slate-100 bg-white'
}

const getTypeBadgeClass = (log = {}) => {
  const info = getDrawLogTypeInfo(log)
  return isDarkVariant.value ? info.darkClass : info.lightClass
}

const clearLogs = () => {
  emit('clear')
}
</script>

<template>
  <section
    class="rounded-[32px] p-5 shadow-xl backdrop-blur"
    :class="isDarkVariant
      ? 'border border-white/70 bg-white/80 text-slate-900'
      : 'border border-slate-200 bg-white text-slate-900'
    "
  >
    <div class="flex items-center justify-between gap-3">
      <div>
        <p
          class="text-xs font-black uppercase tracking-[0.25em]"
          :class="isDarkVariant ? 'text-purple-500' : 'text-purple-500'"
        >
          Draw Logs
        </p>

        <h2 class="mt-2 text-xl font-black text-slate-900">
          {{ title }}
        </h2>

        <p class="mt-1 text-xs font-bold text-slate-400">
          {{ description }}
        </p>
      </div>

      <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-3xl">
        🏆
      </div>
    </div>

    <div
      v-if="visibleLogs.length"
      class="mt-5 space-y-3"
    >
      <article
        v-for="(log, index) in visibleLogs"
        :key="log.id || index"
        class="group rounded-3xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md"
        :class="getLogCardClass(log)"
      >
        <div class="flex items-start gap-3">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-50 to-orange-50 text-2xl shadow-inner">
            {{ getDrawLogIcon(log) }}
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span
                v-if="isLatestLog(log)"
                class="inline-flex rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-[11px] font-black text-amber-700"
              >
                最新
              </span>

              <span
                class="inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black"
                :class="getTypeBadgeClass(log)"
              >
                {{ getDrawLogTypeInfo(log).label }}
              </span>

              <span class="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-500">
                #{{ index + 1 }}
              </span>
            </div>

            <p class="mt-2 truncate text-sm font-black text-slate-900">
              {{ getDrawLogPrizeName(log) }}
            </p>

            <p
              v-if="log.shortName"
              class="mt-1 truncate text-xs font-bold text-slate-400"
            >
              顯示名稱：{{ log.shortName }}
            </p>
          </div>
        </div>

        <div class="mt-3 grid grid-cols-2 gap-2">
          <div class="rounded-2xl bg-slate-50 px-3 py-2">
            <p class="text-[11px] font-black text-slate-400">
              抽獎時間
            </p>

            <p class="mt-1 text-xs font-black text-slate-700">
              {{ log.createdAt || log.time || '-' }}
            </p>
          </div>

          <div class="rounded-2xl bg-blue-50 px-3 py-2">
            <p class="text-[11px] font-black text-blue-400">
              分享來源
            </p>

            <p class="mt-1 text-xs font-black text-blue-700">
              {{ getTrafficSourceLabel(log.source) }}
            </p>
          </div>
        </div>
      </article>

      <button
        v-if="showClearButton"
        type="button"
        class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        @click="clearLogs"
      >
        清空畫面暫存紀錄
      </button>
    </div>

    <div
      v-else
      class="mt-5 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center"
    >
      <p class="text-sm font-black text-slate-500">
        {{ emptyTitle }}
      </p>

      <p class="mt-1 text-xs font-bold text-slate-400">
        {{ emptyDescription }}
      </p>
    </div>
  </section>
</template>

<style scoped>
.game-draw-log-glow {
  animation: game-draw-log-glow 1.15s ease-in-out infinite alternate;
}

@keyframes game-draw-log-glow {
  from {
    box-shadow: 0 0 0 rgba(250, 204, 21, 0.15);
  }

  to {
    box-shadow: 0 0 24px rgba(250, 204, 21, 0.42);
  }
}
</style>
