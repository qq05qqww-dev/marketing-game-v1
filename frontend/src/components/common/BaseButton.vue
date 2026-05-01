<script setup>
defineProps({
  type: {
    type: String,
    default: 'button'
  },
  variant: {
    type: String,
    default: 'primary'
  },
  size: {
    type: String,
    default: 'md'
  },
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  full: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])

const getVariantClass = (variant) => {
  if (variant === 'secondary') {
    return 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
  }

  if (variant === 'dark') {
    return 'bg-slate-900 text-white hover:bg-slate-800'
  }

  if (variant === 'danger') {
    return 'bg-rose-500 text-white hover:bg-rose-600'
  }

  if (variant === 'warning') {
    return 'bg-amber-500 text-white hover:bg-amber-600'
  }

  if (variant === 'success') {
    return 'bg-emerald-600 text-white hover:bg-emerald-700'
  }

  if (variant === 'info') {
    return 'bg-blue-600 text-white hover:bg-blue-700'
  }

  if (variant === 'indigo') {
    return 'bg-indigo-600 text-white hover:bg-indigo-700'
  }

  if (variant === 'muted') {
    return 'bg-slate-200 text-slate-700 hover:bg-slate-300'
  }

  return 'bg-rose-500 text-white hover:bg-rose-600'
}

const getSizeClass = (size) => {
  if (size === 'sm') {
    return 'px-4 py-2 text-sm'
  }

  if (size === 'lg') {
    return 'px-7 py-4 text-base'
  }

  return 'px-6 py-3 text-sm'
}
</script>

<template>
  <button
    :type="type"
    class="inline-flex items-center justify-center gap-2 rounded-2xl font-black shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60"
    :class="[
      getVariantClass(variant),
      getSizeClass(size),
      full ? 'w-full' : ''
    ]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span
      v-if="loading"
      class="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white"
    ></span>

    <slot>
      按鈕
    </slot>
  </button>
</template>