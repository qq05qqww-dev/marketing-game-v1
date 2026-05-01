<script setup>
defineProps({
  type: {
    type: String,
    default: 'info'
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  closable: {
    type: Boolean,
    default: false
  },
  showIcon: {
    type: Boolean,
    default: true
  }
})

defineEmits(['close'])

const alertClassMap = {
  info: {
    wrapper: 'border-sky-200 bg-sky-50 text-sky-700',
    icon: 'ℹ️',
    close: 'hover:bg-sky-100'
  },
  success: {
    wrapper: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    icon: '✅',
    close: 'hover:bg-emerald-100'
  },
  warning: {
    wrapper: 'border-amber-200 bg-amber-50 text-amber-700',
    icon: '⚠️',
    close: 'hover:bg-amber-100'
  },
  danger: {
    wrapper: 'border-rose-200 bg-rose-50 text-rose-700',
    icon: '🚫',
    close: 'hover:bg-rose-100'
  }
}
</script>

<template>
  <div
    class="flex gap-3 rounded-2xl border px-4 py-4"
    :class="alertClassMap[type]?.wrapper || alertClassMap.info.wrapper"
  >
    <div
      v-if="showIcon"
      class="shrink-0 text-lg"
    >
      {{ alertClassMap[type]?.icon || alertClassMap.info.icon }}
    </div>

    <div class="min-w-0 flex-1">
      <p
        v-if="title"
        class="text-sm font-bold"
      >
        {{ title }}
      </p>

      <p
        v-if="message"
        class="text-sm leading-6"
        :class="title ? 'mt-1' : ''"
      >
        {{ message }}
      </p>

      <slot />
    </div>

    <button
      v-if="closable"
      type="button"
      class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition"
      :class="alertClassMap[type]?.close || alertClassMap.info.close"
      @click="$emit('close')"
    >
      ×
    </button>
  </div>
</template>