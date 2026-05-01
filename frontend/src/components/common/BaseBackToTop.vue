<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const showButton = ref(false)

const checkScroll = () => {
  showButton.value = window.scrollY > 360
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

onMounted(() => {
  checkScroll()
  window.addEventListener('scroll', checkScroll, {
    passive: true
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', checkScroll)
})
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-4 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-4 opacity-0"
  >
    <button
      v-if="showButton"
      type="button"
      class="fixed bottom-6 right-6 z-[9997] flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-900 text-2xl font-black text-white shadow-2xl transition hover:-translate-y-0.5 hover:bg-slate-800"
      title="返回頂部"
      @click="scrollToTop"
    >
      ↑
    </button>
  </Transition>
</template>