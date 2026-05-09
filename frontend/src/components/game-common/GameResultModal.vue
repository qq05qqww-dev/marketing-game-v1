<script setup>
// Multi Game Platform V2.3
// 第 51 批修正版 v2：GameResultModal.vue 共用結果彈窗元件語法修正版
//
// 放置位置：
// frontend/src/components/game-common/GameResultModal.vue

import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  prize: {
    type: Object,
    default: null
  },
  gameTitle: {
    type: String,
    default: '活動抽獎'
  },
  merchantName: {
    type: String,
    default: '活動商家'
  },
  activityUrl: {
    type: String,
    default: ''
  },
  remainingChances: {
    type: Number,
    default: 0
  },
  sharedCount: {
    type: Number,
    default: 0
  },
  claimDescription: {
    type: String,
    default: '請保留此畫面或前往遊戲紀錄查看。實際兌換、核銷與發放方式以主辦單位公告為準。'
  },
  contactText: {
    type: String,
    default: '請依主辦單位公告完成兌換。'
  },
  syncedAt: {
    type: String,
    default: ''
  }
})

const emit = defineEmits([
  'close',
  'continue',
  'share',
  'copy-result',
  'open-history'
])

const prizeName = computed(() => {
  return props.prize?.name
    || props.prize?.title
    || props.prize?.shortName
    || '活動獎項'
})

const prizeShortName = computed(() => {
  return props.prize?.shortName
    || props.prize?.name
    || props.prize?.title
    || '獎項'
})

const prizeIcon = computed(() => {
  return props.prize?.icon || props.prize?.emoji || '🎁'
})

const prizeImageUrl = computed(() => {
  return props.prize?.imageUrl || props.prize?.image || ''
})

const isLoseResult = computed(() => {
  const title = String(prizeName.value || '').trim()
  const type = String(props.prize?.type || '').toUpperCase()

  return type === 'LOSE'
    || title.includes('銘謝惠顧')
    || title.includes('謝謝參加')
    || title.includes('未中獎')
    || title.includes('再接再厲')
})

const isReplayResult = computed(() => {
  const title = String(prizeName.value || '').trim()
  return title.includes('再玩一次') || title.includes('再抽一次')
})

const modalTitle = computed(() => {
  if (isLoseResult.value) return '差一點點！'
  if (isReplayResult.value) return '獲得再玩一次！'
  return '恭喜中獎！'
})

const modalSubtitle = computed(() => {
  if (isLoseResult.value) return '這次沒有中獎，還有機會可以繼續挑戰。'
  if (isReplayResult.value) return '太幸運了，這個獎項可以當作活動加碼提示。'
  return '獎項已成功產生，請依主辦單位規則完成兌換。'
})

const badgeText = computed(() => {
  if (isLoseResult.value) return '謝謝參加'
  if (isReplayResult.value) return '加碼機會'
  return '中獎成功'
})

const gradientClass = computed(() => {
  if (isLoseResult.value) {
    return 'from-slate-500 via-slate-600 to-slate-800'
  }

  if (isReplayResult.value) {
    return 'from-sky-400 via-blue-500 to-indigo-600'
  }

  return 'from-orange-400 via-rose-500 to-red-600'
})

const claimText = computed(() => {
  if (isLoseResult.value) {
    return '本次結果已寫入遊戲紀錄。可分享活動增加機會後再次挑戰。'
  }

  if (isReplayResult.value) {
    return '請依活動頁面顯示的剩餘次數繼續參加；實際使用規則以主辦單位設定為準。'
  }

  return props.claimDescription
})

const modalHint = computed(() => {
  if (props.remainingChances > 0) {
    return `獎項已寫入我的遊戲紀錄。你還有 ${props.remainingChances} 次抽獎機會，可以繼續參加。`
  }

  return '獎項已寫入我的遊戲紀錄。你目前沒有剩餘抽獎機會，可先查看紀錄或分享活動增加次數。'
})

const claimSteps = computed(() => {
  if (!props.prize) return []

  if (isLoseResult.value) {
    return [
      {
        title: '查看結果',
        description: '本次結果已寫入畫面紀錄。',
        icon: '🧾'
      },
      {
        title: '分享活動',
        description: '分享活動可以增加抽獎機會。',
        icon: '📣'
      },
      {
        title: '再次挑戰',
        description: '取得機會後可繼續參加抽獎。',
        icon: '🎯'
      }
    ]
  }

  return [
    {
      title: '保存結果',
      description: '保留此畫面、截圖或複製抽獎結果。',
      icon: '📸'
    },
    {
      title: '核對獎項',
      description: `確認獎項名稱：${prizeName.value}`,
      icon: '🎁'
    },
    {
      title: '聯絡兌換',
      description: props.contactText || '請依主辦單位公告完成兌換。',
      icon: '💬'
    }
  ]
})

const resultCopyText = computed(() => {
  const lines = [
    '【抽獎結果】',
    `活動：${props.gameTitle || '活動抽獎'}`,
    `商家：${props.merchantName || '活動商家'}`,
    `結果：${modalTitle.value}`,
    `獎項：${prizeName.value}`,
    `領獎提醒：${claimText.value}`
  ]

  if (props.syncedAt) {
    lines.splice(3, 0, `資料同步：${props.syncedAt}`)
  }

  if (props.activityUrl) {
    lines.push(`活動連結：${props.activityUrl}`)
  }

  return lines.join('\n')
})

const copyResult = () => {
  emit('copy-result', resultCopyText.value)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show && prize"
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/75 px-4 py-5 backdrop-blur-md sm:items-center sm:py-6"
    >
      <div class="game-result-modal relative my-auto max-h-[calc(100vh-40px)] w-full max-w-lg overflow-y-auto rounded-[32px] bg-white shadow-2xl sm:rounded-[36px]">
        <div class="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/20 to-transparent"></div>

        <div
          class="relative overflow-hidden bg-gradient-to-br px-5 pb-6 pt-5 text-center text-white sm:px-6 sm:pb-8 sm:pt-7"
          :class="gradientClass"
        >
          <button
            type="button"
            class="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-lg font-black text-white backdrop-blur transition hover:bg-white/25"
            @click="emit('close')"
          >
            ×
          </button>

          <div class="game-result-sparkle game-result-sparkle-one"></div>
          <div class="game-result-sparkle game-result-sparkle-two"></div>
          <div class="game-result-sparkle game-result-sparkle-three"></div>

          <div class="mx-auto mb-3 inline-flex rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-xs font-black tracking-[0.2em] text-white/95 shadow-sm sm:mb-5">
            {{ badgeText }}
          </div>

          <div class="game-result-prize mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] bg-white/20 text-5xl text-white shadow-2xl ring-4 ring-white/30 sm:h-28 sm:w-28 sm:rounded-[32px] sm:text-6xl">
            <img
              v-if="prizeImageUrl"
              :src="prizeImageUrl"
              :alt="prizeName"
              class="h-full w-full rounded-[26px] object-cover sm:rounded-[32px]"
            />

            <span v-else>
              {{ prizeIcon }}
            </span>
          </div>

          <h2 class="mt-4 text-2xl font-black tracking-tight sm:mt-5 sm:text-3xl">
            {{ modalTitle }}
          </h2>

          <p class="mx-auto mt-2 max-w-sm text-xs font-bold leading-5 text-white/85 sm:text-sm sm:leading-6">
            {{ modalSubtitle }}
          </p>
        </div>

        <div class="relative px-4 pb-4 pt-5 text-center sm:px-6 sm:pb-5 sm:pt-6">
          <div class="-mt-9 rounded-[24px] border border-slate-100 bg-white p-4 shadow-xl sm:-mt-12 sm:rounded-[28px] sm:p-5">
            <p class="text-xs font-black tracking-[0.18em] text-slate-400">
              本次結果
            </p>

            <h3 class="mt-2 text-xl font-black text-slate-900 sm:text-2xl">
              {{ prizeName }}
            </h3>

            <p
              v-if="prizeShortName && prizeShortName !== prizeName"
              class="mt-1 text-sm font-bold text-slate-500"
            >
              九宮格顯示：{{ prizeShortName }}
            </p>

            <div class="mt-4 grid grid-cols-2 gap-3 sm:mt-5">
              <div class="rounded-2xl bg-orange-50 p-4">
                <p class="text-xs font-black text-orange-500">
                  剩餘次數
                </p>

                <p class="mt-1 text-2xl font-black text-orange-700">
                  {{ remainingChances }}
                </p>
              </div>

              <div class="rounded-2xl bg-violet-50 p-4">
                <p class="text-xs font-black text-violet-500">
                  分享次數
                </p>

                <p class="mt-1 text-2xl font-black text-violet-700">
                  {{ sharedCount }}
                </p>
              </div>
            </div>
          </div>

          <div class="mt-4 rounded-3xl border border-amber-100 bg-amber-50 px-4 py-3 text-left sm:mt-5 sm:px-5 sm:py-4">
            <p class="text-sm font-black text-amber-800">
              領獎提醒
            </p>

            <p class="mt-1 text-sm leading-6 text-amber-700">
              {{ claimText }}
            </p>
          </div>

          <div class="mt-4 rounded-3xl border border-slate-100 bg-slate-50 p-3 text-left sm:p-4">
            <div class="flex items-center justify-between gap-3">
              <p class="text-sm font-black text-slate-800">
                下一步流程
              </p>

              <span class="rounded-full bg-white px-3 py-1 text-[11px] font-black text-slate-500">
                {{ isLoseResult ? '再挑戰' : '領獎' }}
              </span>
            </div>

            <div class="mt-3 grid gap-3">
              <article
                v-for="(step, index) in claimSteps"
                :key="step.title"
                class="flex items-start gap-3 rounded-2xl bg-white p-2.5 shadow-sm sm:p-3"
              >
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-lg">
                  {{ step.icon }}
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <span class="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black text-orange-600">
                      {{ index + 1 }}
                    </span>

                    <p class="text-xs font-black text-slate-800">
                      {{ step.title }}
                    </p>
                  </div>

                  <p class="mt-1 text-xs font-bold leading-5 text-slate-500">
                    {{ step.description }}
                  </p>
                </div>
              </article>
            </div>
          </div>

          <p class="mt-4 text-sm leading-6 text-slate-500">
            {{ modalHint }}
          </p>

          <div class="sticky bottom-0 -mx-4 mt-4 border-t border-slate-100 bg-white/95 px-4 pb-1 pt-4 backdrop-blur sm:-mx-6 sm:mt-5 sm:px-6">
            <div class="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                class="rounded-2xl bg-orange-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-700"
                @click="emit('continue')"
              >
                {{ remainingChances > 0 ? '繼續抽獎' : '關閉結果' }}
              </button>

              <button
                type="button"
                class="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
                @click="emit('share')"
              >
                分享增加機會
              </button>

              <button
                type="button"
                class="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-black text-amber-700 transition hover:bg-amber-100 sm:col-span-2"
                @click="copyResult"
              >
                複製本次抽獎結果
              </button>

              <button
                type="button"
                class="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 sm:col-span-2"
                @click="emit('open-history')"
              >
                查看我的遊戲紀錄
              </button>
            </div>

            <button
              type="button"
              class="mt-3 w-full text-sm font-black text-slate-400 transition hover:text-slate-700"
              @click="emit('close')"
            >
              先關閉結果視窗
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.game-result-modal {
  animation: game-result-enter 0.32s ease-out both;
}

.game-result-prize {
  animation: game-result-prize-pop 0.72s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.game-result-sparkle {
  position: absolute;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.8);
  filter: blur(0.2px);
  animation: game-result-sparkle-float 1.8s ease-in-out infinite alternate;
}

.game-result-sparkle-one {
  left: 14%;
  top: 20%;
  width: 10px;
  height: 10px;
}

.game-result-sparkle-two {
  right: 18%;
  top: 30%;
  width: 7px;
  height: 7px;
  animation-delay: 0.35s;
}

.game-result-sparkle-three {
  left: 25%;
  bottom: 24%;
  width: 6px;
  height: 6px;
  animation-delay: 0.65s;
}

@keyframes game-result-enter {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.96);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes game-result-prize-pop {
  0% {
    transform: scale(0.58) rotate(-8deg);
    opacity: 0;
  }

  65% {
    transform: scale(1.08) rotate(3deg);
    opacity: 1;
  }

  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes game-result-sparkle-float {
  from {
    transform: translateY(0) scale(1);
    opacity: 0.55;
  }

  to {
    transform: translateY(-10px) scale(1.35);
    opacity: 1;
  }
}
</style>
