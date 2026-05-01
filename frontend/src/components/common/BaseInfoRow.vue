<script setup>
defineProps({
  label: {
    type: String,
    default: '欄位名稱'
  },
  value: {
    type: [String, Number],
    default: '—'
  },
  icon: {
    type: String,
    default: ''
  },
  mono: {
    type: Boolean,
    default: false
  },
  copyable: {
    type: Boolean,
    default: false
  }
})

defineEmits(['copy'])
</script>

<template>
  <div class="rounded-2xl bg-slate-50 p-5">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0 flex-1">
        <p class="flex items-center gap-2 text-xs font-bold text-slate-400">
          <span v-if="icon">
            {{ icon }}
          </span>

          <span>
            {{ label }}
          </span>
        </p>

        <p
          class="mt-2 break-all font-black text-slate-800"
          :class="mono ? 'font-mono tracking-wide' : ''"
        >
          {{ value || '—' }}
        </p>
      </div>

      <button
        v-if="copyable"
        type="button"
        class="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-100"
        @click="$emit('copy', value)"
      >
        複製
      </button>
    </div>
  </div>
</template>