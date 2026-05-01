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
  closable: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close'])

const typeClassMap = {
  default: 'border-slate-200 bg-slate-50 text-slate-600',
  primary: 'border-blue-200 bg-blue-50 text-blue-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
  purple: 'border-purple-200 bg-purple-50 text-purple-700'
}
</script>

<template>
  <span
    class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
    :class="[
      typeClassMap[type] || typeClassMap.default,
      disabled ? 'opacity-60' : ''
    ]"
  >
    <slot>
      {{ text }}
    </slot>

    <button
      v-if="closable"
      type="button"
      class="inline-flex h-4 w-4 items-center justify-center rounded-full text-current transition hover:bg-black/10 disabled:cursor-not-allowed"
      :disabled="disabled"
      @click="$emit('close')"
    >
      ×
    </button>
  </span>
</template>