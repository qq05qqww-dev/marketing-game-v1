<script setup>
// Multi Game Platform V2.3
// 第 87 批：GamePreviewSwitcher.vue 共用玩法切換器元件版
//
// 放置位置：
// frontend/src/components/game-common/GamePreviewSwitcher.vue
//
// 目的：
// 1. 統一顯示 GenericGamePlayView 的玩法切換器。
// 2. 支援金蛋 / 九宮格 / 輪盤 / 刮刮卡 / 翻牌等玩法預覽切換。
// 3. 之後可把 GenericGamePlayView 裡的 inline 切換區塊抽到這裡。
// 4. 這一批只建立元件，不接入任何現有頁面。

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  activeGameType: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: '切換玩法預覽'
  },
  hint: {
    type: String,
    default: ''
  },
  variant: {
    type: String,
    default: 'dark'
  }
})

const emit = defineEmits([
  'switch'
])

const isDarkVariant = () => {
  return props.variant === 'dark'
}

const getItemLabel = (item = {}) => {
  return item.shortLabel || item.label || item.gameType || '遊戲'
}

const getItemIcon = (item = {}) => {
  return item.icon || item.emoji || '🎮'
}

const switchGame = (gameType) => {
  emit('switch', gameType)
}
</script>

<template>
  <section
    class="relative rounded-[28px] p-3 shadow-inner backdrop-blur"
    :class="isDarkVariant()
      ? 'border border-white/20 bg-white/15 text-white'
      : 'border border-slate-100 bg-white text-slate-900 shadow-xl'
    "
  >
    <p
      class="mb-3 text-center text-xs font-black tracking-[0.18em]"
      :class="isDarkVariant() ? 'text-white/70' : 'text-slate-500'"
    >
      {{ title }}
    </p>

    <div
      v-if="items.length"
      class="grid grid-cols-2 gap-2 sm:grid-cols-3"
    >
      <button
        v-for="item in items"
        :key="item.gameType"
        type="button"
        class="rounded-2xl px-3 py-3 text-center text-xs font-black transition hover:-translate-y-0.5"
        :class="String(item.gameType) === String(activeGameType)
          ? 'bg-white text-orange-600 shadow-lg'
          : isDarkVariant()
            ? 'bg-white/15 text-white hover:bg-white/25'
            : 'bg-slate-50 text-slate-700 hover:bg-orange-50 hover:text-orange-600'
        "
        @click="switchGame(item.gameType)"
      >
        <span class="block text-xl leading-none">
          {{ getItemIcon(item) }}
        </span>

        <span class="mt-1 block">
          {{ getItemLabel(item) }}
        </span>

        <span
          v-if="item.status"
          class="mt-1 inline-flex rounded-full px-2 py-0.5 text-[9px] font-black"
          :class="String(item.gameType) === String(activeGameType)
            ? 'bg-orange-50 text-orange-600'
            : isDarkVariant()
              ? 'bg-white/10 text-white/55'
              : 'bg-white text-slate-400'
          "
        >
          {{ item.status === 'STABLE' ? '穩定' : item.status === 'PLANNED' ? '規劃' : item.status }}
        </span>
      </button>
    </div>

    <div
      v-else
      class="rounded-2xl border border-dashed p-4 text-center"
      :class="isDarkVariant()
        ? 'border-white/20 bg-white/10 text-white/65'
        : 'border-slate-200 bg-slate-50 text-slate-500'
      "
    >
      <p class="text-xs font-black">
        尚未設定可預覽玩法
      </p>
    </div>

    <p
      v-if="hint"
      class="mt-3 break-all rounded-2xl px-3 py-2 text-center text-[11px] font-bold leading-5"
      :class="isDarkVariant()
        ? 'bg-white/10 text-white/65'
        : 'bg-orange-50 text-orange-700'
      "
    >
      {{ hint }}
    </p>
  </section>
</template>
