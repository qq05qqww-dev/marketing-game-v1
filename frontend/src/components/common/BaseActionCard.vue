<script setup>
defineProps({
  icon: {
    type: String,
    default: '⚡'
  },
  title: {
    type: String,
    default: '快速入口'
  },
  description: {
    type: String,
    default: ''
  },
  variant: {
    type: String,
    default: 'slate'
  }
})

defineEmits(['click'])

const getCardClass = (variant) => {
  if (variant === 'rose') {
    return 'border-rose-200 bg-rose-50 hover:bg-rose-100'
  }

  if (variant === 'amber') {
    return 'border-amber-200 bg-amber-50 hover:bg-amber-100'
  }

  if (variant === 'emerald') {
    return 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
  }

  if (variant === 'blue') {
    return 'border-blue-200 bg-blue-50 hover:bg-blue-100'
  }

  if (variant === 'indigo') {
    return 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100'
  }

  if (variant === 'violet') {
    return 'border-violet-200 bg-violet-50 hover:bg-violet-100'
  }

  if (variant === 'dark') {
    return 'border-slate-800 bg-slate-900 text-white hover:bg-slate-800'
  }

  return 'border-slate-200 bg-white hover:bg-slate-50'
}

const getTitleClass = (variant) => {
  if (variant === 'rose') return 'text-rose-800'
  if (variant === 'amber') return 'text-amber-800'
  if (variant === 'emerald') return 'text-emerald-800'
  if (variant === 'blue') return 'text-blue-800'
  if (variant === 'indigo') return 'text-indigo-800'
  if (variant === 'violet') return 'text-violet-800'
  if (variant === 'dark') return 'text-white'

  return 'text-slate-900'
}

const getDescriptionClass = (variant) => {
  if (variant === 'rose') return 'text-rose-700'
  if (variant === 'amber') return 'text-amber-700'
  if (variant === 'emerald') return 'text-emerald-700'
  if (variant === 'blue') return 'text-blue-700'
  if (variant === 'indigo') return 'text-indigo-700'
  if (variant === 'violet') return 'text-violet-700'
  if (variant === 'dark') return 'text-slate-300'

  return 'text-slate-500'
}
</script>

<template>
  <button
    type="button"
    class="rounded-3xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    :class="getCardClass(variant)"
    @click="$emit('click')"
  >
    <div class="text-4xl">
      {{ icon }}
    </div>

    <div
      class="mt-3 text-xl font-black"
      :class="getTitleClass(variant)"
    >
      {{ title }}
    </div>

    <div
      v-if="description"
      class="mt-1 text-sm leading-6"
      :class="getDescriptionClass(variant)"
    >
      {{ description }}
    </div>
  </button>
</template>