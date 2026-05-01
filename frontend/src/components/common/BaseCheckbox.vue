<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

defineEmits(['update:modelValue'])
</script>

<template>
  <label
    class="inline-flex cursor-pointer items-center gap-3 text-sm text-slate-700"
    :class="disabled ? 'cursor-not-allowed opacity-60' : ''"
  >
    <input
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
      @change="$emit('update:modelValue', $event.target.checked)"
    />

    <span v-if="label">
      {{ label }}
    </span>
  </label>
</template>