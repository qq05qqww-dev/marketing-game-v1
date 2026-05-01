<script setup>
defineProps({
  text: {
    type: String,
    default: '資料載入中...'
  },
  description: {
    type: String,
    default: ''
  },
  fullPage: {
    type: Boolean,
    default: false
  },
  compact: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <div
    class="flex flex-col items-center justify-center text-center"
    :class="[
      fullPage ? 'min-h-[60vh]' : '',
      compact ? 'py-6' : 'py-12'
    ]"
  >
    <div class="relative">
      <div
        class="rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin"
        :class="compact ? 'h-8 w-8' : 'h-12 w-12'"
      />
    </div>

    <p
      v-if="text"
      class="mt-4 text-sm font-semibold text-slate-700"
    >
      {{ text }}
    </p>

    <p
      v-if="description"
      class="mt-2 max-w-md text-sm leading-6 text-slate-400"
    >
      {{ description }}
    </p>
  </div>
</template>