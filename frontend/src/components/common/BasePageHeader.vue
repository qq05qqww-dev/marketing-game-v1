<script setup>
defineProps({
  eyebrow: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: '頁面標題'
  },
  description: {
    type: String,
    default: ''
  },
  badgeText: {
    type: String,
    default: ''
  },
  badgeIcon: {
    type: String,
    default: ''
  },
  variant: {
    type: String,
    default: 'default'
  }
})

const getVariantClass = (variant) => {
  if (variant === 'rose') {
    return 'from-rose-50 via-white to-pink-50'
  }

  if (variant === 'amber') {
    return 'from-amber-50 via-white to-orange-50'
  }

  if (variant === 'indigo') {
    return 'from-indigo-50 via-white to-violet-50'
  }

  if (variant === 'emerald') {
    return 'from-emerald-50 via-white to-lime-50'
  }

  if (variant === 'slate') {
    return 'from-slate-50 via-white to-slate-100'
  }

  return 'from-blue-50 via-white to-fuchsia-50'
}

const getEyebrowClass = (variant) => {
  if (variant === 'rose') return 'text-rose-600 bg-rose-100'
  if (variant === 'amber') return 'text-amber-700 bg-amber-100'
  if (variant === 'indigo') return 'text-indigo-700 bg-indigo-100'
  if (variant === 'emerald') return 'text-emerald-700 bg-emerald-100'
  if (variant === 'slate') return 'text-slate-700 bg-slate-100'

  return 'text-blue-700 bg-blue-100'
}
</script>

<template>
  <section
    class="relative overflow-hidden rounded-[40px] border border-slate-200 bg-gradient-to-br p-8 shadow-sm md:p-12"
    :class="getVariantClass(variant)"
  >
    <div class="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/50 blur-3xl"></div>
    <div class="absolute -bottom-28 -left-24 h-96 w-96 rounded-full bg-white/60 blur-3xl"></div>

    <div class="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div
          v-if="eyebrow"
          class="mb-4 inline-flex rounded-full px-4 py-2 text-sm font-black"
          :class="getEyebrowClass(variant)"
        >
          {{ eyebrow }}
        </div>

        <h1 class="text-4xl font-black leading-tight text-slate-900 md:text-6xl">
          {{ title }}
        </h1>

        <p
          v-if="description"
          class="mt-5 max-w-3xl text-lg leading-8 text-slate-600"
        >
          {{ description }}
        </p>

        <div
          v-if="$slots.default"
          class="mt-8 flex flex-wrap gap-3"
        >
          <slot />
        </div>
      </div>

      <div
        v-if="badgeText || $slots.right"
        class="shrink-0"
      >
        <slot name="right">
          <div class="rounded-[32px] border border-white/70 bg-white/80 p-6 text-center shadow-sm backdrop-blur">
            <div
              v-if="badgeIcon"
              class="text-5xl"
            >
              {{ badgeIcon }}
            </div>

            <div class="mt-3 text-2xl font-black text-slate-900">
              {{ badgeText }}
            </div>
          </div>
        </slot>
      </div>
    </div>
  </section>
</template>