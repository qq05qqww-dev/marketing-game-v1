<script setup>
// Multi Game Platform V2.3
// 第 71 批修正版 v2：GameQuickNav.vue 單一根節點修正版
//
// 放置位置：
// frontend/src/components/game-common/GameQuickNav.vue
//
// 修正重點：
// 1. 改成單一根節點，避免 Vue extraneous non-props attributes warning。
// 2. 保留快速導覽。
// 3. 保留右下角回到頂部浮動按鈕。
// 4. 不影響正式九宮格邏輯。

const props = defineProps({
  items: {
    type: Array,
    default: () => [
      {
        label: '頂部',
        icon: '🏠',
        target: 'hero'
      },
      {
        label: '獎品',
        icon: '🎁',
        target: 'prizes'
      },
      {
        label: '規則',
        icon: '📋',
        target: 'rules'
      },
      {
        label: '紀錄',
        icon: '🏆',
        target: 'logs'
      }
    ]
  },
  showFloatingTop: {
    type: Boolean,
    default: true
  },
  showNavBar: {
    type: Boolean,
    default: true
  },
  floatingTopLabel: {
    type: String,
    default: '回到活動頂部'
  },
  variant: {
    type: String,
    default: 'dark'
  }
})

const emit = defineEmits([
  'navigate'
])

const isDarkVariant = () => {
  return props.variant === 'dark'
}

const navigate = (target) => {
  emit('navigate', target)
}
</script>

<template>
  <div>
    <section
      v-if="showNavBar"
      class="relative rounded-[28px] p-3 shadow-inner backdrop-blur"
      :class="isDarkVariant()
        ? 'border border-white/20 bg-white/15'
        : 'border border-slate-100 bg-white shadow-xl'
      "
    >
      <div
        class="grid gap-2"
        :class="items.length <= 3 ? 'grid-cols-3' : 'grid-cols-4'"
      >
        <button
          v-for="item in items"
          :key="item.target"
          type="button"
          class="rounded-2xl px-2 py-3 text-center transition hover:-translate-y-0.5"
          :class="isDarkVariant()
            ? 'bg-white/15 text-white hover:bg-white/25'
            : 'bg-slate-50 text-slate-700 hover:bg-orange-50 hover:text-orange-600'
          "
          @click="navigate(item.target)"
        >
          <span class="block text-lg leading-none">
            {{ item.icon }}
          </span>

          <span class="mt-1 block text-[10px] font-black">
            {{ item.label }}
          </span>
        </button>
      </div>
    </section>

    <button
      v-if="showFloatingTop"
      type="button"
      class="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-orange-600 text-xl font-black text-white shadow-2xl transition hover:-translate-y-0.5 hover:bg-orange-700"
      :title="floatingTopLabel"
      @click="navigate('hero')"
    >
      ↑
    </button>
  </div>
</template>
