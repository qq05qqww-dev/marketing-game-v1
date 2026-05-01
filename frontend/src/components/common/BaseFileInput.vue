<script setup>
defineProps({
  modelValue: {
    type: [File, Array, null],
    default: null
  },
  accept: {
    type: String,
    default: ''
  },
  multiple: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  error: {
    type: Boolean,
    default: false
  },
  buttonText: {
    type: String,
    default: '選擇檔案'
  },
  emptyText: {
    type: String,
    default: '尚未選擇檔案'
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const handleChange = (event) => {
  const files = Array.from(event.target.files || [])
  const value = files.length === 0 ? null : files

  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<template>
  <label
    class="block rounded-xl border bg-white px-4 py-4 transition"
    :class="[
      error
        ? 'border-rose-300 focus-within:border-rose-400 focus-within:ring-4 focus-within:ring-rose-100'
        : 'border-slate-200 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100',
      disabled ? 'cursor-not-allowed bg-slate-100 opacity-60' : 'cursor-pointer hover:border-blue-300 hover:bg-blue-50'
    ]"
  >
    <input
      type="file"
      class="sr-only"
      :accept="accept"
      :multiple="multiple"
      :disabled="disabled"
      @change="handleChange"
    />

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="min-w-0">
        <p class="text-sm font-semibold text-slate-700">
          {{ buttonText }}
        </p>

        <p class="mt-1 truncate text-xs text-slate-400">
          <template v-if="Array.isArray(modelValue) && modelValue.length">
            {{ modelValue.map((file) => file.name).join('、') }}
          </template>

          <template v-else-if="modelValue && modelValue.name">
            {{ modelValue.name }}
          </template>

          <template v-else>
            {{ emptyText }}
          </template>
        </p>
      </div>

      <span class="inline-flex shrink-0 items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
        瀏覽
      </span>
    </div>
  </label>
</template>