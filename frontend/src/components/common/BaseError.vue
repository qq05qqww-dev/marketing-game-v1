<script setup>
defineProps({
  title: {
    type: String,
    default: '發生錯誤'
  },
  message: {
    type: String,
    default: '資料讀取失敗，請稍後再試。'
  },
  buttonText: {
    type: String,
    default: '重新整理'
  },
  showButton: {
    type: Boolean,
    default: true
  },
  fullPage: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['retry'])
</script>

<template>
  <div
    class="flex items-center justify-center"
    :class="fullPage ? 'min-h-screen bg-slate-100 px-4' : 'w-full p-10'"
  >
    <div class="w-full max-w-md rounded-[32px] border border-rose-200 bg-white p-10 text-center shadow-sm">
      <div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 text-4xl">
        ⚠️
      </div>

      <h3 class="text-2xl font-black text-slate-900">
        {{ title }}
      </h3>

      <p class="mt-3 text-sm leading-6 text-slate-500">
        {{ message }}
      </p>

      <button
        v-if="showButton"
        type="button"
        class="mt-6 rounded-2xl bg-rose-500 px-6 py-3 font-black text-white transition hover:bg-rose-600"
        @click="emit('retry')"
      >
        {{ buttonText }}
      </button>
    </div>
  </div>
</template>