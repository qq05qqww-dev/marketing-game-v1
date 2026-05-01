<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import PlatformNavbar from '../../../components/PlatformNavbar.vue'
import PlatformFooter from '../../../components/PlatformFooter.vue'
import BaseBadge from '../../../components/common/BaseBadge.vue'
import BaseAlert from '../../../components/common/BaseAlert.vue'
import BaseModal from '../../../components/common/BaseModal.vue'
import { useDrawHistory } from '../../../composables/useDrawHistory'
import { useAdminGameSettings } from '../../../composables/useAdminGameSettings'

const router = useRouter()

const {
  addHistory,
  clearHistoriesByGameId,
  getHistoriesByGameId,
  getEffectiveGameId,
  getUrlGameId
} = useDrawHistory()

const {
  getGameSettingById
} = useAdminGameSettings()

const templateGameId = 'flip-card'

const effectiveGameId = computed(() => {
  return getEffectiveGameId(templateGameId)
})

const urlGameId = computed(() => {
  return getUrlGameId()
})

const isTemplateGame = computed(() => {
  return Boolean(urlGameId.value && urlGameId.value !== templateGameId)
})

const gameSetting = computed(() => {
  return getGameSettingById(templateGameId)
})

const gameTitle = computed(() => {
  return gameSetting.value?.name || '翻牌遊戲'
})

const gameDescription = computed(() => {
  return gameSetting.value?.description || '選擇一張卡片並翻開，系統會依照權重機率產生抽獎結果。'
})

const gameIcon = computed(() => {
  return gameSetting.value?.icon || '🃏'
})

const gamePlayLimit = computed(() => {
  return Number(gameSetting.value?.playLimit || 1)
})

const gameProbabilityMode = computed(() => {
  return gameSetting.value?.probabilityMode || 'weight'
})

const probabilityModeText = computed(() => {
  if (gameProbabilityMode.value === 'weight') return '權重機率'
  if (gameProbabilityMode.value === 'percent') return '百分比機率'
  if (gameProbabilityMode.value === 'fixed') return '固定結果'

  return gameProbabilityMode.value
})

const defaultPrizes = [
  {
    id: 1,
    name: '頭獎',
    description: '品牌旗艦大獎',
    icon: '🏆',
    type: 'success',
    weight: 1,
    quantity: 1
  },
  {
    id: 2,
    name: '二獎',
    description: '精美好禮一份',
    icon: '🎁',
    type: 'primary',
    weight: 3,
    quantity: 3
  },
  {
    id: 3,
    name: '折價券',
    description: '消費折抵優惠',
    icon: '🎫',
    type: 'info',
    weight: 12,
    quantity: 9999
  },
  {
    id: 4,
    name: '會員點數',
    description: '會員點數加碼',
    icon: '💎',
    type: 'purple',
    weight: 15,
    quantity: 9999
  },
  {
    id: 5,
    name: '幸運獎',
    description: '小禮物一份',
    icon: '✨',
    type: 'warning',
    weight: 20,
    quantity: 9999
  },
  {
    id: 6,
    name: '銘謝惠顧',
    description: '下次再接再厲',
    icon: '🙏',
    type: 'default',
    weight: 40,
    quantity: 9999
  }
]

const prizes = computed(() => {
  return gameSetting.value?.prizes?.length
    ? gameSetting.value.prizes
    : defaultPrizes
})

const cards = computed(() => {
  const sourceCards = prizes.value.slice(0, 6)

  while (sourceCards.length < 6) {
    sourceCards.push(defaultPrizes[sourceCards.length % defaultPrizes.length])
  }

  return sourceCards.map((prize, index) => {
    return {
      ...prize,
      cardIndex: index + 1
    }
  })
})

const selectedCardIndex = ref(null)
const isFlipped = ref(false)
const resultPrize = ref(null)
const showResultModal = ref(false)

const flipHistories = computed(() => {
  return getHistoriesByGameId(templateGameId)
})

const hasPlayedFlipCard = computed(() => {
  return flipHistories.value.length >= gamePlayLimit.value
})

const latestFlipHistory = computed(() => {
  return flipHistories.value[0] || null
})

const totalWeight = computed(() => {
  return prizes.value.reduce((sum, prize) => {
    const weight = Number(prize.weight || 0)

    return sum + (weight > 0 ? weight : 0)
  }, 0)
})

const getRandomPrize = () => {
  if (!prizes.value.length) return null

  if (totalWeight.value <= 0) {
    return prizes.value[Math.floor(Math.random() * prizes.value.length)]
  }

  let random = Math.random() * totalWeight.value

  for (const prize of prizes.value) {
    const weight = Number(prize.weight || 0)

    if (weight <= 0) continue

    random -= weight

    if (random <= 0) {
      return prize
    }
  }

  return prizes.value[prizes.value.length - 1]
}

const goBack = () => {
  router.push('/games')
}

const flipCard = (cardIndex) => {
  if (hasPlayedFlipCard.value) {
    showResultModal.value = true
    return
  }

  if (isFlipped.value) {
    showResultModal.value = true
    return
  }

  const prize = getRandomPrize()

  if (!prize) return

  selectedCardIndex.value = cardIndex
  resultPrize.value = prize

  setTimeout(() => {
    isFlipped.value = true

    addHistory({
      gameId: templateGameId,
      gameName: gameTitle.value,
      prizeId: prize.id,
      prizeName: prize.name,
      prizeDescription: prize.description,
      prizeIcon: prize.icon,
      playerName: '訪客玩家'
    })

    setTimeout(() => {
      showResultModal.value = true
    }, 600)
  }, 250)
}

const resetFlipCard = () => {
  if (hasPlayedFlipCard.value) {
    showResultModal.value = true
    return
  }

  selectedCardIndex.value = null
  isFlipped.value = false
  resultPrize.value = null
  showResultModal.value = false
}

const clearCurrentGameHistories = () => {
  const targetName = isTemplateGame.value
    ? `${gameTitle.value}（${effectiveGameId.value}）`
    : gameTitle.value

  const confirmed = window.confirm(`確定要清除「${targetName}」的測試紀錄嗎？`)

  if (!confirmed) return

  clearHistoriesByGameId(templateGameId)

  selectedCardIndex.value = null
  isFlipped.value = false
  resultPrize.value = null
  showResultModal.value = false
}

const closeResult = () => {
  showResultModal.value = false
}

const getCardContent = (card) => {
  if (isFlipped.value && selectedCardIndex.value === card.cardIndex && resultPrize.value) {
    return resultPrize.value
  }

  return card
}

const getCardClass = (card) => {
  if (selectedCardIndex.value === card.cardIndex && isFlipped.value) {
    return 'border-indigo-300 bg-indigo-50 shadow-xl ring-4 ring-indigo-100'
  }

  if (selectedCardIndex.value === card.cardIndex) {
    return 'border-indigo-300 bg-indigo-50 scale-95'
  }

  return 'border-slate-200 bg-white hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl'
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-slate-100">
    <PlatformNavbar />

    <main class="flex-1">
      <div class="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <section class="overflow-hidden rounded-3xl bg-slate-950 shadow-xl">
          <div class="relative px-6 py-8 text-white md:px-10 md:py-10">
            <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,.42),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,.32),transparent_35%)]" />

            <div class="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <button
                  type="button"
                  class="mb-5 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20"
                  @click="goBack"
                >
                  ← 返回遊戲中心
                </button>

                <div class="flex flex-wrap gap-2">
                  <div class="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-indigo-100 backdrop-blur">
                    Flip Card Game
                  </div>

                  <BaseBadge
                    v-if="isTemplateGame"
                    text="模板遊戲"
                    type="info"
                  />
                </div>

                <h1 class="mt-5 text-3xl font-black md:text-5xl">
                  {{ gameTitle }}
                </h1>

                <p class="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                  {{ gameDescription }}
                </p>

                <div
                  v-if="isTemplateGame"
                  class="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50/10 p-4 text-sm leading-6 text-indigo-100"
                >
                  <p class="font-black">
                    自訂活動 gameId：{{ effectiveGameId }}
                  </p>

                  <p class="mt-1">
                    template：{{ templateGameId }} / 翻牌遊戲模板
                  </p>
                </div>
              </div>

              <div class="rounded-3xl border border-white/10 bg-white/10 p-5 text-center backdrop-blur">
                <div class="text-5xl">
                  {{ gameIcon }}
                </div>

                <p class="mt-3 text-sm font-bold text-slate-200">
                  翻開你的幸運卡
                </p>

                <p class="mt-1 text-xs text-slate-400">
                  每位玩家限玩 {{ gamePlayLimit }} 次
                </p>
              </div>
            </div>
          </div>
        </section>

        <BaseAlert
          :type="hasPlayedFlipCard ? 'warning' : 'success'"
          :title="hasPlayedFlipCard ? '你已經完成本次翻牌遊戲' : '可以開始翻牌'"
          :message="hasPlayedFlipCard ? `目前活動 ${effectiveGameId} 已達遊玩限制。需要重新測試可以清除此活動紀錄。` : '選擇一張卡片翻開，系統會依照權重機率產生抽獎結果。'"
        />

        <section class="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-8">
            <div class="mx-auto max-w-4xl">
              <div class="mb-8 text-center">
                <h2 class="text-2xl font-black text-slate-900">
                  選擇一張幸運卡片
                </h2>

                <p class="mt-2 text-sm text-slate-400">
                  點擊任一卡片後，即可揭曉本次抽獎結果。
                </p>
              </div>

              <div class="grid gap-4 md:grid-cols-3">
                <button
                  v-for="card in cards"
                  :key="`${card.id}-${card.cardIndex}`"
                  type="button"
                  class="min-h-48 rounded-3xl border p-5 text-center shadow-sm transition disabled:cursor-not-allowed disabled:opacity-80"
                  :class="getCardClass(card)"
                  :disabled="hasPlayedFlipCard"
                  @click="flipCard(card.cardIndex)"
                >
                  <template v-if="isFlipped && selectedCardIndex === card.cardIndex">
                    <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-5xl shadow-sm">
                      {{ getCardContent(card).icon }}
                    </div>

                    <h3 class="mt-5 text-xl font-black text-slate-900">
                      {{ getCardContent(card).name }}
                    </h3>

                    <p class="mt-2 text-sm leading-6 text-slate-500">
                      {{ getCardContent(card).description }}
                    </p>
                  </template>

                  <template v-else>
                    <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-5xl shadow-sm">
                      🃏
                    </div>

                    <h3 class="mt-5 text-xl font-black text-slate-900">
                      CARD {{ card.cardIndex }}
                    </h3>

                    <p class="mt-2 text-sm text-slate-400">
                      點擊翻開卡片
                    </p>
                  </template>
                </button>
              </div>

              <div class="mt-8 flex justify-center">
                <button
                  type="button"
                  class="rounded-2xl bg-slate-900 px-10 py-3 text-sm font-black text-white shadow-lg transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-400"
                  :disabled="hasPlayedFlipCard"
                  @click="isFlipped ? showResultModal = true : null"
                >
                  {{
                    hasPlayedFlipCard
                      ? '你已經玩過了'
                      : isFlipped
                        ? '查看結果'
                        : '請先選擇卡片'
                  }}
                </button>
              </div>
            </div>
          </div>

          <aside class="space-y-5">
            <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 class="text-lg font-black text-slate-800">
                活動資訊
              </h2>

              <div class="mt-5 space-y-4">
                <div class="flex items-center justify-between gap-3">
                  <span class="text-sm text-slate-500">遊戲狀態</span>
                  <BaseBadge text="進行中" type="success" />
                </div>

                <div class="flex items-center justify-between gap-3">
                  <span class="text-sm text-slate-500">遊戲類型</span>
                  <BaseBadge text="抽獎遊戲" type="primary" />
                </div>

                <div class="flex items-center justify-between gap-3">
                  <span class="text-sm text-slate-500">抽獎邏輯</span>
                  <BaseBadge :text="probabilityModeText" type="warning" />
                </div>

                <div class="flex items-center justify-between gap-3">
                  <span class="text-sm text-slate-500">遊玩限制</span>
                  <BaseBadge :text="`${gamePlayLimit} 次`" type="info" />
                </div>

                <div class="border-t border-slate-100 pt-4">
                  <div class="rounded-2xl bg-slate-50 p-4">
                    <p class="text-xs font-black text-slate-400">
                      目前紀錄 gameId
                    </p>

                    <p class="mt-1 break-all text-sm font-black text-slate-800">
                      {{ effectiveGameId }}
                    </p>

                    <p
                      v-if="isTemplateGame"
                      class="mt-2 text-xs font-bold text-blue-500"
                    >
                      template：{{ templateGameId }}
                    </p>
                  </div>

                  <button
                    type="button"
                    class="mt-4 w-full rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-black text-indigo-600 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="hasPlayedFlipCard"
                    @click="resetFlipCard"
                  >
                    重新測試翻牌
                  </button>

                  <button
                    type="button"
                    class="mt-3 w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-600 transition hover:bg-rose-100"
                    @click="clearCurrentGameHistories"
                  >
                    清除此活動紀錄
                  </button>

                  <p class="mt-2 text-center text-xs leading-5 text-slate-400">
                    只會清除目前 gameId：{{ effectiveGameId }}
                  </p>
                </div>
              </div>
            </div>

            <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div class="flex items-center justify-between gap-3">
                <h2 class="text-lg font-black text-slate-800">
                  最近翻牌紀錄
                </h2>

                <BaseBadge
                  :text="`${flipHistories.length} 筆`"
                  type="info"
                />
              </div>

              <div
                v-if="flipHistories.length"
                class="mt-5 space-y-3"
              >
                <div
                  v-for="history in flipHistories.slice(0, 5)"
                  :key="history.id"
                  class="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"
                >
                  <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                    {{ history.prizeIcon }}
                  </div>

                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-black text-slate-700">
                      {{ history.prizeName }}
                    </p>

                    <p class="truncate text-xs text-slate-400">
                      {{ history.gameId }}
                    </p>
                  </div>
                </div>
              </div>

              <p
                v-else
                class="mt-5 rounded-2xl bg-slate-50 px-4 py-5 text-center text-sm font-semibold text-slate-400"
              >
                尚無此活動紀錄
              </p>
            </div>

            <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 class="text-lg font-black text-slate-800">
                獎項列表
              </h2>

              <div class="mt-5 space-y-3">
                <div
                  v-for="prize in prizes"
                  :key="prize.id"
                  class="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"
                >
                  <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                    {{ prize.icon }}
                  </div>

                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-black text-slate-700">
                      {{ prize.name }}
                    </p>

                    <p class="truncate text-xs text-slate-400">
                      {{ prize.description }}
                    </p>
                  </div>

                  <BaseBadge
                    :text="`權重 ${prize.weight}`"
                    type="default"
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>

    <PlatformFooter />

    <BaseModal
      v-model="showResultModal"
      :title="`${gameTitle}結果`"
      :description="`本次${gameTitle}結果如下`"
      size="sm"
      :close-on-backdrop="true"
      @close="closeResult"
    >
      <div
        v-if="resultPrize"
        class="text-center"
      >
        <div class="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-100 text-5xl">
          {{ resultPrize.icon }}
        </div>

        <h2 class="mt-5 text-2xl font-black text-slate-800">
          {{ resultPrize.name }}
        </h2>

        <p class="mt-2 text-sm leading-6 text-slate-500">
          {{ resultPrize.description }}
        </p>

        <div class="mt-5 flex justify-center gap-2">
          <BaseBadge
            :text="`權重 ${resultPrize.weight || 1}`"
            :type="resultPrize.type || 'default'"
          />

          <BaseBadge
            v-if="isTemplateGame"
            text="模板活動"
            type="info"
          />
        </div>
      </div>

      <div
        v-else-if="hasPlayedFlipCard && latestFlipHistory"
        class="text-center"
      >
        <div class="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-100 text-5xl">
          {{ latestFlipHistory.prizeIcon }}
        </div>

        <h2 class="mt-5 text-2xl font-black text-slate-800">
          你已經玩過了
        </h2>

        <p class="mt-2 text-sm leading-6 text-slate-500">
          本次翻牌結果是：{{ latestFlipHistory.prizeName }}
        </p>

        <p class="mt-2 text-xs font-bold text-slate-400">
          gameId：{{ latestFlipHistory.gameId }}
        </p>
      </div>

      <template #footer>
        <button
          type="button"
          class="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
          @click.stop="closeResult"
        >
          關閉
        </button>

        <button
          type="button"
          class="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
          @click.stop="closeResult"
        >
          確認
        </button>
      </template>
    </BaseModal>
  </div>
</template>