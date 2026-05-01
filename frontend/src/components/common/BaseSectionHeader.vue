<script setup>
defineProps({
  title: {
    type: String,
    default: '區塊標題'
  },
  description: {
    type: String,
    default: ''
  },
  eyebrow: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
    <div>
      <div
        v-if="eyebrow || icon"
        class="mb-2 flex items-center gap-2 text-sm font-black text-slate-400"
      >
        <span v-if="icon">
          {{ icon }}
        </span>

        <span v-if="eyebrow">
          {{ eyebrow }}
        </span>
      </div>

      <h2 class="text-2xl font-black text-slate-900 md:text-3xl">
        {{ title }}
      </h2>

      <p
        v-if="description"
        class="mt-1 text-sm leading-6 text-slate-500"
      >
        {{ description }}
      </p>
    </div>

    <div
      v-if="$slots.default"
      class="flex flex-wrap gap-3"
    >
      <slot />
    </div>
  </div>
</template>