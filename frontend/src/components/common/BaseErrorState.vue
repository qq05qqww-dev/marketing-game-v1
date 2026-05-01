<script setup>
defineProps({
  icon: {
    type: String,
    default: '⚠️'
  },
  title: {
    type: String,
    default: '發生錯誤'
  },
  description: {
    type: String,
    default: '資料載入失敗，請稍後再試。'
  },
  actionText: {
    type: String,
    default: '重新整理'
  },
  secondaryText: {
    type: String,
    default: ''
  },
  compact: {
    type: Boolean,
    default: false
  }
})

defineEmits(['action', 'secondary'])
</script>

<template>
  <div
    class="flex flex-col items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-center"
    :class="compact ? 'px-4 py-8' : 'px-6 py-14'"
  >
    <div
      class="flex items-center justify-center rounded-full bg-white text-rose-500 shadow-sm"
      :class="compact ? 'h-12 w-12 text-2xl' : 'h-16 w-16 text-3xl'"
    >
      {{ icon }}
    </div>

    <h3
      class="mt-4 font-bold text-rose-700"
      :class="compact ? 'text-base' : 'text-lg'"
    >
      {{ title }}
    </h3>

    <p
      v-if="description"
      class="mt-2 max-w-md text-sm leading-6 text-rose-500"
    >
      {{ description }}
    </p>

    <div
      v-if="actionText || secondaryText"
      class="mt-6 flex flex-wrap items-center justify-center gap-3"
    >
      <button
        v-if="secondaryText"
        type="button"
        class="rounded-xl border border-rose-200 bg-white px-5 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
        @click="$emit('secondary')"
      >
        {{ secondaryText }}
      </button>

      <button
        v-if="actionText"
        type="button"
        class="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
        @click="$emit('action')"
      >
        {{ actionText }}
      </button>
    </div>
  </div>
</template>