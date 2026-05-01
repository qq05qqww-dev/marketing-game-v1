<script setup>
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '確認操作'
  },
  message: {
    type: String,
    default: '你確定要執行這個操作嗎？'
  },
  confirmText: {
    type: String,
    default: '確認'
  },
  cancelText: {
    type: String,
    default: '取消'
  },
  type: {
    type: String,
    default: 'warning'
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['confirm', 'cancel', 'close'])

const handleCancel = () => {
  if (props.loading) return

  emit('cancel')
  emit('close')
}

const handleConfirm = () => {
  if (props.loading) return

  emit('confirm')
}

const getIcon = () => {
  if (props.type === 'danger') return '⚠️'
  if (props.type === 'success') return '✅'
  if (props.type === 'info') return 'ℹ️'

  return '🔔'
}

const getIconClass = () => {
  if (props.type === 'danger') {
    return 'bg-rose-100 text-rose-700'
  }

  if (props.type === 'success') {
    return 'bg-emerald-100 text-emerald-700'
  }

  if (props.type === 'info') {
    return 'bg-blue-100 text-blue-700'
  }

  return 'bg-amber-100 text-amber-700'
}

const getConfirmClass = () => {
  if (props.type === 'danger') {
    return 'bg-rose-500 hover:bg-rose-600'
  }

  if (props.type === 'success') {
    return 'bg-emerald-500 hover:bg-emerald-600'
  }

  if (props.type === 'info') {
    return 'bg-blue-600 hover:bg-blue-700'
  }

  return 'bg-amber-500 hover:bg-amber-600'
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
        v-if="show"
        class="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden bg-slate-950/50 px-4 py-6 backdrop-blur-sm"
        @click.self="handleCancel"
      >
        <Transition
          appear
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="translate-y-3 scale-95 opacity-0"
          enter-to-class="translate-y-0 scale-100 opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="translate-y-0 scale-100 opacity-100"
          leave-to-class="translate-y-3 scale-95 opacity-0"
        >
          <div class="w-full max-w-md overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl">
            <div class="max-h-[calc(100vh-48px)] overflow-y-auto p-6">
              <div class="flex items-start gap-4">
                <div
                  class="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl text-3xl"
                  :class="getIconClass()"
                >
                  {{ getIcon() }}
                </div>

                <div class="min-w-0 flex-1">
                  <h3 class="text-2xl font-black text-slate-900">
                    {{ title }}
                  </h3>

                  <p class="mt-2 whitespace-pre-line text-sm leading-7 text-slate-500">
                    {{ message }}
                  </p>
                </div>

                <button
                  type="button"
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl font-black text-slate-500 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="loading"
                  @click="handleCancel"
                >
                  ×
                </button>
              </div>

              <div class="mt-8 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  class="rounded-2xl bg-slate-100 px-5 py-3 font-black text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="loading"
                  @click="handleCancel"
                >
                  {{ cancelText }}
                </button>

                <button
                  type="button"
                  class="rounded-2xl px-5 py-3 font-black text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                  :class="getConfirmClass()"
                  :disabled="loading"
                  @click="handleConfirm"
                >
                  {{ loading ? '處理中...' : confirmText }}
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>