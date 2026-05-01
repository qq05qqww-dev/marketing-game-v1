<script setup>
const props = defineProps({
  src: {
    type: String,
    default: ''
  },
  alt: {
    type: String,
    default: 'avatar'
  },
  name: {
    type: String,
    default: ''
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

const sizeClassMap = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg'
}

const getInitials = () => {
  if (!props.name) return '?'

  return props.name
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
</script>

<template>
  <div
    class="inline-flex shrink-0 items-center justify-center overflow-hidden bg-slate-100 font-bold text-slate-600"
    :class="[
      sizeClassMap[size] || sizeClassMap.md,
      rounded ? 'rounded-full' : 'rounded-xl'
    ]"
  >
    <img
      v-if="src"
      :src="src"
      :alt="alt"
      class="h-full w-full object-cover"
    />

    <span v-else>
      {{ getInitials() }}
    </span>
  </div>
</template>