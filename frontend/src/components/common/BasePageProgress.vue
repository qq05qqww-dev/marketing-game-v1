<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false
  },
  percent: {
    type: Number,
    default: 0
  }
})
</script>

<template>
  <Transition
    enter-active-class="transition duration-150 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-300 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="show"
      class="fixed left-0 top-0 z-[100000] h-1 w-full bg-transparent"
    >
      <div
        class="h-full rounded-r-full bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-rose-500 shadow-[0_0_18px_rgba(99,102,241,0.55)] transition-all duration-300 ease-out"
        :style="{ width: `${percent}%` }"
      ></div>
    </div>
  </Transition>
</template>