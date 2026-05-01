<script setup>
defineProps({
  label: {
    type: String,
    default: '欄位名稱'
  },
  description: {
    type: String,
    default: ''
  },
  error: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <div>
    <label class="mb-2 block text-sm font-bold text-slate-700">
      {{ label }}

      <span
        v-if="required"
        class="ml-1 text-rose-500"
      >
        *
      </span>
    </label>

    <slot />

    <p
      v-if="description && !error"
      class="mt-2 text-xs leading-5 text-slate-400"
    >
      {{ description }}
    </p>

    <p
      v-if="error"
      class="mt-2 text-xs font-bold leading-5 text-rose-500"
    >
      {{ error }}
    </p>
  </div>
</template>