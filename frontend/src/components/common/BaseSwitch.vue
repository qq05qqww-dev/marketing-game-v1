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
  description: {
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
    class="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 transition"
    :class="disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-blue-300 hover:bg-blue-50'"
  >
    <div class="min-w-0">
      <p
        v-if="label"
        class="text-sm font-semibold text-slate-700"
      >
        {{ label }}
      </p>

      <p
        v-if="description"
        class="mt-1 text-xs text-slate-400"
      >
        {{ description }}
      </p>
    </div>

    <input
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      class="sr-only"
      @change="$emit('update:modelValue', $event.target.checked)"
    />

    <span
      class="relative inline-flex h-6 w-11 shrink-0 rounded-full transition"
      :class="modelValue ? 'bg-blue-600' : 'bg-slate-300'"
    >
      <span
        class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition"
        :class="modelValue ? 'translate-x-5' : 'translate-x-0'"
      />
    </span>
  </label>
</template>