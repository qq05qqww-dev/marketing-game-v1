<script setup>
defineProps({
  text: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'default'
  },
  size: {
    type: String,
    default: 'md'
  },
  rounded: {
    type: Boolean,
    default: true
  }
})

const typeClassMap = {
  default: 'bg-slate-100 text-slate-600',
  primary: 'bg-blue-100 text-blue-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-rose-100 text-rose-700',
  info: 'bg-sky-100 text-sky-700',
  purple: 'bg-purple-100 text-purple-700'
}

const sizeClassMap = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm'
}
</script>

<template>
  <span
    class="inline-flex items-center font-semibold"
    :class="[
      typeClassMap[type] || typeClassMap.default,
      sizeClassMap[size] || sizeClassMap.md,
      rounded ? 'rounded-full' : 'rounded-lg'
    ]"
  >
    <slot>
      {{ text }}
    </slot>
  </span>
</template>