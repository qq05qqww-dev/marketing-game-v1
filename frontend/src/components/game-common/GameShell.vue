<script setup>
// Multi Game Platform V2.3
// 第 75 批：GameShell.vue 共用活動頁外框元件版
//
// 放置位置：
// frontend/src/components/game-common/GameShell.vue
//
// 目的：
// 1. 統一多遊戲前台活動頁外框。
// 2. 提供左側手機預覽框、右側資訊區 / 管理區的基本結構。
// 3. 保留插槽 slot，讓金蛋、九宮格、輪盤、刮刮卡各自放入玩法內容。
// 4. 這一批只建立元件，不接入任何遊戲頁。

const props = defineProps({
  isAdminMode: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '互動抽獎活動'
  },
  description: {
    type: String,
    default: '多遊戲互動活動平台'
  },
  themeStart: {
    type: String,
    default: '#ffb237'
  },
  themeMiddle: {
    type: String,
    default: '#ff7a18'
  },
  themeEnd: {
    type: String,
    default: '#ee3f24'
  },
  backgroundImageUrl: {
    type: String,
    default: ''
  },
  showPhoneFrame: {
    type: Boolean,
    default: true
  },
  maxWidthClass: {
    type: String,
    default: 'max-w-7xl'
  },
  phoneWidthClass: {
    type: String,
    default: 'max-w-[430px]'
  }
})
</script>

<template>
  <div class="min-h-screen overflow-hidden bg-slate-950 text-slate-900">
    <div
      class="relative min-h-screen px-4 py-6 sm:px-6 lg:px-8"
      :style="{
        background: backgroundImageUrl
          ? `linear-gradient(rgba(15,23,42,.82), rgba(15,23,42,.94)), url(${backgroundImageUrl}) center/cover`
          : `radial-gradient(circle at top left, ${themeStart}55, transparent 30%), radial-gradient(circle at bottom right, ${themeEnd}55, transparent 34%), linear-gradient(135deg, #0f172a, #111827 44%, #020617)`
      }"
    >
      <div class="pointer-events-none absolute inset-0 opacity-40">
        <div class="absolute left-10 top-12 h-56 w-56 rounded-full bg-white/10 blur-3xl"></div>
        <div class="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-orange-400/20 blur-3xl"></div>
      </div>

      <div
        class="relative mx-auto grid gap-6"
        :class="[maxWidthClass, isAdminMode ? 'xl:grid-cols-[minmax(380px,480px)_1fr]' : 'justify-center']"
      >
        <section
          class="relative"
          :class="isAdminMode ? 'order-1' : 'mx-auto w-full'"
        >
          <div
            v-if="showPhoneFrame"
            class="relative mx-auto rounded-[44px] border border-white/20 bg-slate-950 p-2 shadow-2xl"
            :class="phoneWidthClass"
          >
            <div class="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-slate-950"></div>

            <div class="overflow-hidden rounded-[36px] bg-white">
              <slot name="phone"></slot>
            </div>

            <div class="pointer-events-none absolute inset-x-0 bottom-2 mx-auto hidden h-1.5 w-32 rounded-full bg-slate-900/80 sm:block"></div>
          </div>

          <div
            v-else
            class="relative mx-auto w-full"
            :class="phoneWidthClass"
          >
            <slot name="phone"></slot>
          </div>
        </section>

        <aside
          v-if="isAdminMode"
          class="order-2 grid gap-5 md:grid-cols-2 xl:sticky xl:top-6 xl:grid-cols-1 xl:self-start"
        >
          <slot name="admin"></slot>
        </aside>

        <section
          v-if="$slots.after"
          class="order-3"
          :class="isAdminMode ? 'xl:col-span-2' : ''"
        >
          <slot name="after"></slot>
        </section>
      </div>
    </div>
  </div>
</template>
