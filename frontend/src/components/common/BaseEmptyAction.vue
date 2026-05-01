<script setup>
defineProps({
  icon: {
    type: String,
    default: '🧭'
  },
  title: {
    type: String,
    default: '下一步操作'
  },
  description: {
    type: String,
    default: ''
  },
  buttonText: {
    type: String,
    default: '前往'
  },
  variant: {
    type: String,
    default: 'slate'
  }
})

defineEmits(['action'])

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

  return 'border-slate-200 bg-slate-50'
}

const getButtonClass = (variant) => {
  if (variant === 'rose') {
    return 'bg-rose-500 hover:bg-rose-600'
  }

  if (variant === 'amber') {
    return 'bg-amber-500 hover:bg-amber-600'
  }

  if (variant === 'emerald') {
    return 'bg-emerald-600 hover:bg-emerald-700'
  }

  if (variant === 'blue') {
    return 'bg-blue-600 hover:bg-blue-700'
  }

  if (variant === 'indigo') {
    return 'bg-indigo-600 hover:bg-indigo-700'
  }

  if (variant === 'violet') {
    return 'bg-violet-600 hover:bg-violet-700'
  }

  return 'bg-slate-900 hover:bg-slate-800'
}
</script>

<template>
  <div
    class="rounded-[28px] border p-5 shadow-sm"
    :class="getCardClass(variant)"
  >
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div class="flex items-start gap-4">
        <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
          {{ icon }}
        </div>

        <div>
          <h3 class="text-lg font-black text-slate-900">
            {{ title }}
          </h3>

          <p
            v-if="description"
            class="mt-1 text-sm leading-6 text-slate-600"
          >
            {{ description }}
          </p>
        </div>
      </div>

      <button
        type="button"
        class="shrink-0 rounded-2xl px-5 py-3 text-sm font-black text-white transition"
        :class="getButtonClass(variant)"
        @click="$emit('action')"
      >
        {{ buttonText }}
      </button>
    </div>
  </div>
</template>