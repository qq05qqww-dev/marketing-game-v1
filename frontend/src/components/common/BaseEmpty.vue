<script setup>
defineProps({
  icon: {
    type: String,
    default: '🪄'
  },
  title: {
    type: String,
    default: '目前沒有資料'
  },
  message: {
    type: String,
    default: '資料建立後會顯示在這裡。'
  },
  buttonText: {
    type: String,
    default: ''
  },
  showButton: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['action'])
</script>

<template>
  <div class="w-full rounded-[32px] border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
    <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl shadow-sm">
      {{ icon }}
    </div>

    <h3 class="mt-5 text-2xl font-black text-slate-800">
      {{ title }}
    </h3>

    <p class="mt-2 text-sm leading-6 text-slate-500">
      {{ message }}
    </p>

    <button
      v-if="showButton && buttonText"
      type="button"
      class="mt-6 rounded-2xl bg-slate-900 px-6 py-3 font-black text-white transition hover:bg-slate-800"
      @click="emit('action')"
    >
      {{ buttonText }}
    </button>
  </div>
</template>