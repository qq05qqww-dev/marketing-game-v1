<script setup>
defineProps({
  resultText: {
    type: String,
    default: '尚未抽獎'
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['play'])
</script>

<template>
  <div class="bg-white rounded-2xl shadow p-6 text-center">
    <div
      class="w-72 h-72 mx-auto rounded-full border-8 border-yellow-400 flex items-center justify-center text-2xl font-bold mb-6 bg-yellow-50"
    >
      輪盤區
    </div>

    <button
      @click="emit('play')"
      :disabled="isLoading"
      class="px-6 py-3 rounded-xl bg-red-500 text-white text-lg disabled:opacity-50"
    >
      {{ isLoading ? '抽獎中...' : '開始抽獎' }}
    </button>

    <div class="mt-6 text-xl font-bold">
      {{ resultText }}
    </div>
  </div>
</template>