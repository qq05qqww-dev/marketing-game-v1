<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'success'
  },
  title: {
    type: String,
    default: '提示'
  },
  message: {
    type: String,
    default: ''
  },
  position: {
    type: String,
    default: 'top-right'
  }
})

const emit = defineEmits(['close'])

const toastClass = computed(() => {
  if (props.type === 'error') {
    return 'border-rose-200 bg-rose-50 text-rose-700'
  }

  if (props.type === 'warning') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  if (props.type === 'info') {
    return 'border-blue-200 bg-blue-50 text-blue-700'
  }

  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
})

const iconText = computed(() => {
  if (props.type === 'error') return '⚠️'
  if (props.type === 'warning') return '🔔'
  if (props.type === 'info') return 'ℹ️'

  return '✅'
})

const positionClass = computed(() => {
  if (props.position === 'top-left') {
    return 'left-4 top-4'
  }

  if (props.position === 'bottom-right') {
    return 'bottom-4 right-4'
  }

  if (props.position === 'bottom-left') {
    return 'bottom-4 left-4'
  }

  return 'right-4 top-4'
})
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-[-8px] opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-[-8px] opacity-0"
  >
    <div
      v-if="show"
      class="fixed z-[9999] w-[calc(100%-32px)] max-w-sm rounded-3xl border p-4 shadow-xl backdrop-blur"
      :class="[toastClass, positionClass]"
    >
      <div class="flex items-start gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
          {{ iconText }}
        </div>

        <div class="min-w-0 flex-1">
          <div class="font-black">
            {{ title }}
          </div>

          <div
            v-if="message"
            class="mt-1 text-sm leading-6 opacity-80"
          >
            {{ message }}
          </div>
        </div>

        <button
          type="button"
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/70 text-lg font-black transition hover:bg-white"
          @click="emit('close')"
        >
          ×
        </button>
      </div>
    </div>
  </Transition>
</template>