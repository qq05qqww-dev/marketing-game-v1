<script setup>
// Multi Game Platform V2.3
// 第 55 批：GameRulesPanel.vue 共用規則說明元件版
//
// 放置位置：
// frontend/src/components/game-common/GameRulesPanel.vue
//
// 這一批只建立共用元件，不接入任何遊戲頁。
// 後續第 56 批才會讓 PremiumGridLotteryView.vue 改接這個元件。

import { ref } from 'vue'

const props = defineProps({
  rules: {
    type: Array,
    default: () => []
  },
  prizeNotes: {
    type: Array,
    default: () => []
  },
  defaultRulesOpen: {
    type: Boolean,
    default: false
  },
  defaultPrizeNotesOpen: {
    type: Boolean,
    default: false
  },
  rulesTitle: {
    type: String,
    default: '活動規則'
  },
  rulesDescription: {
    type: String,
    default: '點擊展開查看參加方式'
  },
  prizeNotesTitle: {
    type: String,
    default: '獎品說明'
  },
  prizeNotesDescription: {
    type: String,
    default: '點擊展開查看獎品規則'
  }
})

const showRules = ref(props.defaultRulesOpen)
const showPrizeNotes = ref(props.defaultPrizeNotesOpen)

const getRuleStepIcon = (index) => {
  const icons = ['👆', '🎯', '📌', '🎁', '📱', '✅']
  return icons[index % icons.length]
}

const getPrizeNoteIcon = (index) => {
  const icons = ['🏆', '📦', '⚖️', '🧾', '🔔', '💬']
  return icons[index % icons.length]
}
</script>

<template>
  <section class="relative space-y-3">
    <div class="overflow-hidden rounded-3xl bg-white/95 shadow-xl">
      <button
        type="button"
        class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        @click="showRules = !showRules"
      >
        <div class="flex min-w-0 items-center gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-xl">
            📋
          </div>

          <div class="min-w-0">
            <p class="text-sm font-black text-slate-800">
              {{ rulesTitle }}
            </p>

            <p class="mt-1 truncate text-xs font-bold text-slate-400">
              {{ showRules ? '已展開參加方式' : rulesDescription }}
            </p>
          </div>
        </div>

        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-lg font-black text-orange-500">
          {{ showRules ? '−' : '+' }}
        </span>
      </button>

      <div
        v-if="showRules"
        class="border-t border-slate-100 px-4 pb-4 pt-3"
      >
        <div
          v-if="rules.length"
          class="grid gap-3"
        >
          <article
            v-for="(rule, index) in rules"
            :key="`${rule}_${index}`"
            class="flex gap-3 rounded-2xl bg-orange-50/70 p-3"
          >
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-base shadow-sm">
              {{ getRuleStepIcon(index) }}
            </div>

            <div class="min-w-0">
              <p class="text-[10px] font-black tracking-[0.16em] text-orange-500">
                STEP {{ index + 1 }}
              </p>

              <p class="mt-1 text-xs font-bold leading-5 text-slate-600">
                {{ rule }}
              </p>
            </div>
          </article>
        </div>

        <div
          v-else
          class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center"
        >
          <p class="text-xs font-black text-slate-500">
            尚未設定活動規則
          </p>
        </div>
      </div>
    </div>

    <div class="overflow-hidden rounded-3xl bg-white/95 shadow-xl">
      <button
        type="button"
        class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        @click="showPrizeNotes = !showPrizeNotes"
      >
        <div class="flex min-w-0 items-center gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-xl">
            🎁
          </div>

          <div class="min-w-0">
            <p class="text-sm font-black text-slate-800">
              {{ prizeNotesTitle }}
            </p>

            <p class="mt-1 truncate text-xs font-bold text-slate-400">
              {{ showPrizeNotes ? '已展開獎品規則' : prizeNotesDescription }}
            </p>
          </div>
        </div>

        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-lg font-black text-amber-500">
          {{ showPrizeNotes ? '−' : '+' }}
        </span>
      </button>

      <div
        v-if="showPrizeNotes"
        class="border-t border-slate-100 px-4 pb-4 pt-3"
      >
        <div
          v-if="prizeNotes.length"
          class="grid gap-3"
        >
          <article
            v-for="(note, index) in prizeNotes"
            :key="`${note}_${index}`"
            class="flex gap-3 rounded-2xl bg-amber-50/70 p-3"
          >
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-base shadow-sm">
              {{ getPrizeNoteIcon(index) }}
            </div>

            <div class="min-w-0">
              <p class="text-[10px] font-black tracking-[0.16em] text-amber-500">
                NOTE {{ index + 1 }}
              </p>

              <p class="mt-1 text-xs font-bold leading-5 text-slate-600">
                {{ note }}
              </p>
            </div>
          </article>
        </div>

        <div
          v-else
          class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center"
        >
          <p class="text-xs font-black text-slate-500">
            尚未設定獎品說明
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
