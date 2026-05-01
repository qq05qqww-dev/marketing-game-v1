<script setup>
defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  tabs: {
    type: Array,
    default: () => []
  },
  size: {
    type: String,
    default: 'md'
  },
  fullWidth: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

defineEmits(['update:modelValue', 'change'])

const sizeClassMap = {
  sm: 'px-3 py-2 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base'
}
</script>

<template>
  <div class="w-full">
    <div
      class="flex gap-2 rounded-2xl bg-slate-100 p-1"
      :class="fullWidth ? 'w-full' : 'inline-flex'"
    >
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="rounded-xl font-semibold transition"
        :class="[
          sizeClassMap[size] || sizeClassMap.md,
          fullWidth ? 'flex-1' : '',
          modelValue === tab.value
            ? 'bg-white text-blue-700 shadow-sm'
            : 'text-slate-500 hover:bg-white/70 hover:text-slate-700',
          disabled || tab.disabled
            ? 'cursor-not-allowed opacity-50 hover:bg-transparent hover:text-slate-500'
            : ''
        ]"
        :disabled="disabled || tab.disabled"
        @click="
          $emit('update:modelValue', tab.value);
          $emit('change', tab.value)
        "
      >
        <span v-if="tab.icon" class="mr-1">
          {{ tab.icon }}
        </span>

        {{ tab.label }}

        <span
          v-if="tab.count !== undefined"
          class="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500"
          :class="modelValue === tab.value ? 'bg-blue-50 text-blue-600' : ''"
        >
          {{ tab.count }}
        </span>
      </button>
    </div>
  </div>
</template>