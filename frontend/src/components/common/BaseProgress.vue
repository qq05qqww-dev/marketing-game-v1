<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: {
    type: Number,
    default: 0
  },
  max: {
    type: Number,
    default: 100
  },
  label: {
    type: String,
    default: ''
  },
  showValue: {
    type: Boolean,
    default: true
  },
  size: {
    type: String,
    default: 'md'
  },
  type: {
    type: String,
    default: 'primary'
  },
  striped: {
    type: Boolean,
    default: false
  }
})

const percent = computed(() => {
  if (!props.max || props.max <= 0) return 0

  const result = Math.round((props.value / props.max) * 100)

  if (result < 0) return 0
  if (result > 100) return 100

  return result
})

const sizeClassMap = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4'
}

const typeClassMap = {
  primary: 'bg-blue-600',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-sky-500',
  purple: 'bg-purple-500'
}
</script>

<template>
  <div class="w-full">
    <div
      v-if="label || showValue"
      class="mb-2 flex items-center justify-between gap-3"
    >
      <p
        v-if="label"
        class="text-sm font-semibold text-slate-700"
      >
        {{ label }}
      </p>

      <p
        v-if="showValue"
        class="text-sm font-semibold text-slate-500"
      >
        {{ percent }}%
      </p>
    </div>

    <div
      class="w-full overflow-hidden rounded-full bg-slate-100"
      :class="sizeClassMap[size] || sizeClassMap.md"
    >
      <div
        class="h-full rounded-full transition-all duration-500"
        :class="[
          typeClassMap[type] || typeClassMap.primary,
          striped ? 'bg-[linear-gradient(45deg,rgba(255,255,255,.25)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.25)_50%,rgba(255,255,255,.25)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem]' : ''
        ]"
        :style="{ width: `${percent}%` }"
      />
    </div>
  </div>
</template>