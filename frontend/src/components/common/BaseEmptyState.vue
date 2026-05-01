<script setup>
defineProps({
  icon: {
    type: String,
    default: '📭'
  },
  title: {
    type: String,
    default: '目前沒有資料'
  },
  description: {
    type: String,
    default: '尚未建立任何內容，請稍後再查看。'
  },
  actionText: {
    type: String,
    default: ''
  },
  compact: {
    type: Boolean,
    default: false
  }
})

defineEmits(['action'])
</script>

<template>
  <div
    class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-center"
    :class="compact ? 'px-4 py-8' : 'px-6 py-14'"
  >
    <div
      class="flex items-center justify-center rounded-full bg-slate-100"
      :class="compact ? 'h-12 w-12 text-2xl' : 'h-16 w-16 text-3xl'"
    >
      {{ icon }}
    </div>

    <h3
      class="mt-4 font-bold text-slate-800"
      :class="compact ? 'text-base' : 'text-lg'"
    >
      {{ title }}
    </h3>

    <p
      v-if="description"
      class="mt-2 max-w-md text-sm leading-6 text-slate-500"
    >
      {{ description }}
    </p>

    <button
      v-if="actionText"
      type="button"
      class="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
      @click="$emit('action')"
    >
      {{ actionText }}
    </button>
  </div>
</template>