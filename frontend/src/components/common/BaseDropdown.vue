<script setup>
import { ref } from 'vue'

defineProps({
  items: {
    type: Array,
    default: () => []
  },
  buttonText: {
    type: String,
    default: '選單'
  },
  align: {
    type: String,
    default: 'right'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select'])

const isOpen = ref(false)

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const closeDropdown = () => {
  isOpen.value = false
}

const handleSelect = (item) => {
  if (item.disabled) return

  emit('select', item)
  closeDropdown()
}
</script>

<template>
  <div class="relative inline-block text-left">
    <button
      type="button"
      class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      :disabled="disabled"
      @click="toggleDropdown"
    >
      <slot name="button">
        {{ buttonText }}
        <span class="text-xs">▾</span>
      </slot>
    </button>

    <div
      v-if="isOpen"
      class="fixed inset-0 z-40"
      @click="closeDropdown"
    />

    <div
      v-if="isOpen"
      class="absolute z-50 mt-2 min-w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-xl"
      :class="align === 'left' ? 'left-0' : 'right-0'"
    >
      <button
        v-for="item in items"
        :key="item.value || item.label"
        type="button"
        class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition"
        :class="item.disabled
          ? 'cursor-not-allowed text-slate-300'
          : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
        "
        :disabled="item.disabled"
        @click="handleSelect(item)"
      >
        <span v-if="item.icon">
          {{ item.icon }}
        </span>

        <span class="flex-1">
          {{ item.label }}
        </span>

        <span
          v-if="item.badge"
          class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500"
        >
          {{ item.badge }}
        </span>
      </button>

      <div
        v-if="items.length === 0"
        class="px-4 py-3 text-sm text-slate-400"
      >
        沒有可用選項
      </div>
    </div>
  </div>
</template>