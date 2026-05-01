<script setup>
defineProps({
  title: {
    type: String,
    default: '載入中...'
  },
  message: {
    type: String,
    default: '請稍候，資料正在讀取。'
  },
  fullPage: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <div
    class="flex items-center justify-center"
    :class="fullPage ? 'min-h-screen bg-slate-100 px-4' : 'w-full p-10'"
  >
    <div class="w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-sm">
      <div class="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>

      <h3 class="text-2xl font-black text-slate-900">
        {{ title }}
      </h3>

      <p class="mt-2 text-sm leading-6 text-slate-500">
        {{ message }}
      </p>
    </div>
  </div>
</template>