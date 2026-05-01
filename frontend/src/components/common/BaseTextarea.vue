<script setup>
defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  rows: {
    type: [String, Number],
    default: 4
  },
  disabled: {
    type: Boolean,
    default: false
  },
  readonly: {
    type: Boolean,
    default: false
  },
  error: {
    type: Boolean,
    default: false
  },
  resize: {
    type: Boolean,
    default: true
  }
})

defineEmits(['update:modelValue'])
</script>

<template>
  <textarea
    :value="modelValue"
    :placeholder="placeholder"
    :rows="rows"
    :disabled="disabled"
    :readonly="readonly"
    class="w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
    :class="[
      error
        ? 'border-rose-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-100'
        : 'border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100',
      resize ? 'resize-y' : 'resize-none'
    ]"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>