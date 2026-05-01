<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '請輸入搜尋關鍵字'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const hasValue = computed(() => String(props.modelValue || '').length > 0)

const updateValue = (event) => {
  emit('update:modelValue', event.target.value)
}

const clearValue = () => {
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="relative w-full">
    <span
      class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400"
    >
      🔍
    </span>

    <input
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      type="text"
      class="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-12 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
      @input="updateValue"
    >

    <button
      v-if="hasValue"
      type="button"
      class="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
      @click="clearValue"
    >
      ✕
    </button>
  </div>
</template>