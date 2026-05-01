<script setup>
defineProps({
  label: {
    type: String,
    default: '統計項目'
  },
  value: {
    type: [String, Number],
    default: 0
  },
  description: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  variant: {
    type: String,
    default: 'slate'
  },
  clickable: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])

const getCardClass = (variant) => {
  if (variant === 'rose') {
    return 'border-rose-100 bg-rose-50'
  }

  if (variant === 'amber') {
    return 'border-amber-100 bg-amber-50'
  }

  if (variant === 'emerald') {
    return 'border-emerald-100 bg-emerald-50'
  }

  if (variant === 'blue') {
    return 'border-blue-100 bg-blue-50'
  }

  if (variant === 'indigo') {
    return 'border-indigo-100 bg-indigo-50'
  }

  if (variant === 'violet') {
    return 'border-violet-100 bg-violet-50'
  }

  if (variant === 'fuchsia') {
    return 'border-fuchsia-100 bg-fuchsia-50'
  }

  return 'border-slate-200 bg-white'
}

const getLabelClass = (variant) => {
  if (variant === 'rose') return 'text-rose-500'
  if (variant === 'amber') return 'text-amber-500'
  if (variant === 'emerald') return 'text-emerald-500'
  if (variant === 'blue') return 'text-blue-500'
  if (variant === 'indigo') return 'text-indigo-500'
  if (variant === 'violet') return 'text-violet-500'
  if (variant === 'fuchsia') return 'text-fuchsia-500'

  return 'text-slate-400'
}

const getValueClass = (variant) => {
  if (variant === 'rose') return 'text-rose-700'
  if (variant === 'amber') return 'text-amber-700'
  if (variant === 'emerald') return 'text-emerald-700'
  if (variant === 'blue') return 'text-blue-700'
  if (variant === 'indigo') return 'text-indigo-700'
  if (variant === 'violet') return 'text-violet-700'
  if (variant === 'fuchsia') return 'text-fuchsia-700'

  return 'text-slate-900'
}
</script>

<template>
  <component
    :is="clickable ? 'button' : 'div'"
    type="button"
    class="rounded-3xl border p-5 text-center shadow-sm transition"
    :class="[
      getCardClass(variant),
      clickable ? 'hover:-translate-y-0.5 hover:shadow-md' : ''
    ]"
    @click="$emit('click')"
  >
    <div
      v-if="icon"
      class="mb-2 text-3xl"
    >
      {{ icon }}
    </div>

    <p
      class="text-xs font-bold"
      :class="getLabelClass(variant)"
    >
      {{ label }}
    </p>

    <p
      class="mt-2 text-3xl font-black"
      :class="getValueClass(variant)"
    >
      {{ value }}
    </p>

    <p
      v-if="description"
      class="mt-2 text-sm text-slate-500"
    >
      {{ description }}
    </p>
  </component>
</template>