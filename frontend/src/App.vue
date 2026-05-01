<script setup>
import BasePageProgress from './components/common/BasePageProgress.vue'
import BaseBackToTop from './components/common/BaseBackToTop.vue'
import { usePageProgress } from './composables/usePageProgress'

const { progressState } = usePageProgress()
</script>

<template>
  <BasePageProgress
    :show="progressState.show"
    :percent="progressState.percent"
  />

  <router-view v-slot="{ Component, route }">
    <Transition
      name="page-fade"
      mode="out-in"
    >
      <component
        :is="Component"
        :key="route.fullPath"
      />
    </Transition>
  </router-view>

  <BaseBackToTop />
</template>

<style scoped>
.page-fade-enter-active,
.page-fade-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>