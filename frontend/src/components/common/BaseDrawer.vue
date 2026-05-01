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
  placement: {
    type: String,
    default: 'right'
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
  sm: 'w-full max-w-sm',
  md: 'w-full max-w-md',
  lg: 'w-full max-w-xl',
  xl: 'w-full max-w-2xl',
  full: 'w-full'
}

const placementClassMap = {
  right: 'right-0 top-0 h-full',
  left: 'left-0 top-0 h-full'
}

const transitionClassMap = {
  right: {
    enterFrom: 'translate-x-full',
    leaveTo: 'translate-x-full'
  },
  left: {
    enterFrom: '-translate-x-full',
    leaveTo: '-translate-x-full'
  }
}

const closeDrawer = () => {
  emit('update:modelValue', false)
  emit('close')
}

const handleBackdropClick = () => {
  if (!closeOnBackdrop) return

  closeDrawer()
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
        class="fixed inset-0 z-50 bg-slate-900/50"
        @click.self="handleBackdropClick"
      />
    </Transition>

    <Transition
      enter-active-class="transition duration-300 ease-out"
      :enter-from-class="transitionClassMap[placement]?.enterFrom || transitionClassMap.right.enterFrom"
      enter-to-class="translate-x-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-x-0"
      :leave-to-class="transitionClassMap[placement]?.leaveTo || transitionClassMap.right.leaveTo"
    >
      <aside
        v-if="modelValue"
        class="fixed z-50 flex flex-col bg-white shadow-2xl"
        :class="[
          placementClassMap[placement] || placementClassMap.right,
          sizeClassMap[size] || sizeClassMap.md
        ]"
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
            @click="closeDrawer"
          >
            ×
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-6 py-5">
          <slot />
        </div>

        <div
          v-if="$slots.footer"
          class="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4"
        >
          <slot name="footer" />
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>