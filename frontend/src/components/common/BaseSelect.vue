<script setup>
defineProps({
  modelValue: {
    type: [String, Number, Boolean],
    default: ''
  },
  options: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: '請選擇'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  error: {
    type: Boolean,
    default: false
  }
})

defineEmits(['update:modelValue'])
</script>

<template>
  <select
    :value="modelValue"
    :disabled="disabled"
    class="w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
    :class="error
      ? 'border-rose-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-100'
      : 'border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100'
    "
    @change="$emit('update:modelValue', $event.target.value)"
  >
    <option value="" disabled>
      {{ placeholder }}
    </option>

    <option
      v-for="option in options"
      :key="option.value"
      :value="option.value"
    >
      {{ option.label }}
    </option>
  </select>
</template>