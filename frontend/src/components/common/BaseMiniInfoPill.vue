<script setup>
defineProps({
  icon: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  value: {
    type: [String, Number],
    default: ''
  },
  variant: {
    type: String,
    default: 'slate'
  }
})

const getPillClass = (variant) => {
  if (variant === 'rose') {
    return 'border-rose-100 bg-rose-50 text-rose-700'
  }

  if (variant === 'amber') {
    return 'border-amber-100 bg-amber-50 text-amber-700'
  }

  if (variant === 'emerald') {
    return 'border-emerald-100 bg-emerald-50 text-emerald-700'
  }

  if (variant === 'blue') {
    return 'border-blue-100 bg-blue-50 text-blue-700'
  }

  if (variant === 'indigo') {
    return 'border-indigo-100 bg-indigo-50 text-indigo-700'
  }

  if (variant === 'violet') {
    return 'border-violet-100 bg-violet-50 text-violet-700'
  }

  return 'border-slate-200 bg-white text-slate-600'
}
</script>

<template>
  <span
    class="inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold"
    :class="getPillClass(variant)"
  >
    <span v-if="icon">
      {{ icon }}
    </span>

    <span v-if="label">
      {{ label }}：
    </span>

    <span class="truncate">
      {{ value || '—' }}
    </span>
  </span>
</template>