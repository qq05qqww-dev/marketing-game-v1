<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'md'
  },
  closable: {
    type: Boolean,
    default: true
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

const sizeClassMap = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[96vw]'
}

const closeModal = () => {
  emit('update:modelValue', false)
  emit('close')
}

const handleBackdropClick = () => {
  if (!closeOnBackdrop) return

  closeModal()
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6"
        @click.self="handleBackdropClick"
      >
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="scale-95 opacity-0 translate-y-2"
          enter-to-class="scale-100 opacity-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="scale-100 opacity-100 translate-y-0"
          leave-to-class="scale-95 opacity-0 translate-y-2"
        >
          <div
            v-if="modelValue"
            class="max-h-[90vh] w-full overflow-hidden rounded-2xl bg-white shadow-2xl"
            :class="sizeClassMap[size] || sizeClassMap.md"
          >
            <div class="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div class="min-w-0">
                <h3
                  v-if="title"
                  class="text-lg font-bold text-slate-800"
                >
                  {{ title }}
                </h3>

                <p
                  v-if="description"
                  class="mt-1 text-sm leading-6 text-slate-500"
                >
                  {{ description }}
                </p>
              </div>

              <button
                v-if="closable"
                type="button"
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                @click="closeModal"
              >
                ×
              </button>
            </div>

            <div class="max-h-[calc(90vh-150px)] overflow-y-auto px-6 py-5">
              <slot />
            </div>

            <div
              v-if="$slots.footer"
              class="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4"
            >
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>