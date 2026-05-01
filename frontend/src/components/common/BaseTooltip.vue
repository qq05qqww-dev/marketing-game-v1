<script setup>
defineProps({
  text: {
    type: String,
    default: ''
  },
  placement: {
    type: String,
    default: 'top'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const placementClassMap = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  bottom: 'left-1/2 top-full mt-2 -translate-x-1/2',
  left: 'right-full top-1/2 mr-2 -translate-y-1/2',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2'
}

const arrowClassMap = {
  top: 'left-1/2 top-full -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-slate-900',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-slate-900',
  left: 'left-full top-1/2 -translate-y-1/2 border-y-transparent border-r-transparent border-l-slate-900',
  right: 'right-full top-1/2 -translate-y-1/2 border-y-transparent border-l-transparent border-r-slate-900'
}
</script>

<template>
  <span class="group relative inline-flex">
    <slot />

    <span
      v-if="text && !disabled"
      class="pointer-events-none absolute z-50 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100"
      :class="placementClassMap[placement] || placementClassMap.top"
    >
      {{ text }}

      <span
        class="absolute h-0 w-0 border-4"
        :class="arrowClassMap[placement] || arrowClassMap.top"
      />
    </span>
  </span>
</template>