<script setup>
import PlatformNavbar from './PlatformNavbar.vue'
import PlatformFooter from './PlatformFooter.vue'

defineProps({
  contentClass: {
    type: String,
    default: 'max-w-7xl mx-auto px-4 py-8 space-y-8'
  },
  useFooter: {
    type: Boolean,
    default: true
  }
})
</script>

<template>
  <div class="min-h-screen bg-slate-100">
    <PlatformNavbar />

    <main>
      <div :class="contentClass">
        <slot />
      </div>
    </main>

    <PlatformFooter v-if="useFooter" />
  </div>
</template>