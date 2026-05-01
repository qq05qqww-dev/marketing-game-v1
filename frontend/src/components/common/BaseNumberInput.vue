<script setup>
defineProps({
  modelValue: {
    type: [Number, String],
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  min: {
    type: [Number, String],
    default: ''
  },
  max: {
    type: [Number, String],
    default: ''
  },
  step: {
    type: [Number, String],
    default: 1
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
  }
})

const emit = defineEmits(['update:modelValue'])

const handleInput = (event) => {
  const value = event.target.value

  if (value === '') {
    emit('update:modelValue', '')
    return
  }

  emit('update:modelValue', Number(value))
}
</script>

<template>
  <input
    type="number"
    :value="modelValue"
    :placeholder="placeholder"
    :min="min"
    :max="max"
    :step="step"
    :disabled="disabled"
    :readonly="readonly"
    class="w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
    :class="error
      ? 'border-rose-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-100'
      : 'border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100'
    "
    @input="handleInput"
  />
</template>