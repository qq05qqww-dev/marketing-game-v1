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
  name: {
    type: String,
    default: 'radio-group'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  direction: {
    type: String,
    default: 'vertical'
  }
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div
    class="flex gap-3"
    :class="direction === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col'"
  >
    <label
      v-for="option in options"
      :key="option.value"
      class="inline-flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
      :class="[
        modelValue === option.value
          ? 'border-blue-400 bg-blue-50 text-blue-700 ring-4 ring-blue-100'
          : '',
        disabled || option.disabled
          ? 'cursor-not-allowed opacity-60 hover:border-slate-200 hover:bg-white'
          : ''
      ]"
    >
      <input
        type="radio"
        :name="name"
        :value="option.value"
        :checked="modelValue === option.value"
        :disabled="disabled || option.disabled"
        class="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
        @change="$emit('update:modelValue', option.value)"
      />

      <span>
        {{ option.label }}
      </span>
    </label>
  </div>
</template>