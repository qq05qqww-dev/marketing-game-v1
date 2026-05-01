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

const templateGameId = 'referral-task'

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
  return gameSetting.value?.name || '推薦任務'
})

const gameDescription = computed(() => {
  return gameSetting.value?.description || '完成好友推薦任務後，即可領取對應獎項。'
})

const gameIcon = computed(() => {
  return gameSetting.value?.icon || '🤝'
})

const gamePlayLimit = computed(() => {
  return Number(gameSetting.value?.playLimit || 1)
})

const requiredInviteCount = computed(() => {
  return Number(gameSetting.value?.requiredInviteCount || 3)
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
    name: '推薦達標獎',
    description: '完成好友推薦任務後可獲得',
    icon: '🎁',
    type: 'success',
    weight: 10,
    quantity: 9999
  },
  {
    id: 2,
    name: '好友加碼券',
    description: '好友成功參與後可獲得加碼券',
    icon: '🎫',
    type: 'primary',
    weight: 20,
    quantity: 9999
  },
  {
    id: 3,
    name: '會員點數',
    description: '推薦成功即可獲得會員點數',
    icon: '💎',
    type: 'info',
    weight: 30,
    quantity: 9999
  },
  {
    id: 4,
    name: '銘謝參與',
    description: '任務尚未達標，請繼續邀請好友',
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

const invitedCount = ref(0)
const isClaiming = ref(false)
const resultPrize = ref(null)
const showResultModal = ref(false)

const referralHistories = computed(() => {
  return getHistoriesByGameId(templateGameId)
})

const hasPlayedReferralTask = computed(() => {
  return referralHistories.value.length >= gamePlayLimit.value
})

const latestReferralHistory = computed(() => {
  return referralHistories.value[0] || null
})

const progressPercent = computed(() => {
  if (requiredInviteCount.value <= 0) return 100

  const percent = (invitedCount.value / requiredInviteCount.value) * 100

  return Math.min(100, Math.round(percent))
})

const isTaskCompleted = computed(() => {
  return invitedCount.value >= requiredInviteCount.value
})

const remainingInviteCount = computed(() => {
  return Math.max(0, requiredInviteCount.value - invitedCount.value)
})

const totalWeight = computed(() => {
  return prizes.value.reduce((sum, prize) => {
    const weight = Number(prize.weight || 0)

    return sum + (weight > 0 ? weight : 0)
  }, 0)
})

const getRandomPrize = () => {
  if (!prizes.value.length) return null

  const availablePrizes = isTaskCompleted.value
    ? prizes.value.filter((prize) => prize.name !== '銘謝參與')
    : prizes.value

  const sourcePrizes = availablePrizes.length ? availablePrizes : prizes.value

  const sourceTotalWeight = sourcePrizes.reduce((sum, prize) => {
    const weight = Number(prize.weight || 0)

    return sum + (weight > 0 ? weight : 0)
  }, 0)

  if (sourceTotalWeight <= 0) {
    return sourcePrizes[Math.floor(Math.random() * sourcePrizes.length)]
  }

  let random = Math.random() * sourceTotalWeight

  for (const prize of sourcePrizes) {
    const weight = Number(prize.weight || 0)

    if (weight <= 0) continue

    random -= weight

    if (random <= 0) {
      return prize
    }
  }

  return sourcePrizes[sourcePrizes.length - 1]
}

const goBack = () => {
  router.push('/games')
}

const addInvite = () => {
  if (hasPlayedReferralTask.value) {
    showResultModal.value = true
    return
  }

  invitedCount.value += 1
}

const completeInviteTask = () => {
  if (hasPlayedReferralTask.value) {
    showResultModal.value = true
    return
  }

  invitedCount.value = requiredInviteCount.value
}

const claimReward = () => {
  if (hasPlayedReferralTask.value) {
    showResultModal.value = true
    return
  }

  if (isClaiming.value) return

  if (!isTaskCompleted.value) {
    window.alert(`還差 ${remainingInviteCount.value} 位好友，完成後才可以領獎。`)
    return
  }

  const prize = getRandomPrize()

  if (!prize) return

  isClaiming.value = true
  resultPrize.value = prize
  showResultModal.value = false

  setTimeout(() => {
    isClaiming.value = false

    addHistory({
      gameId: templateGameId,
      gameName: gameTitle.value,
      prizeId: prize.id,
      prizeName: prize.name,
      prizeDescription: prize.description,
      prizeIcon: prize.icon,
      playerName: '訪客玩家'
    })

    showResultModal.value = true
  }, 700)
}

const resetReferralTask = () => {
  if (hasPlayedReferralTask.value) {
    showResultModal.value = true
    return
  }

  invitedCount.value = 0
  isClaiming.value = false
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

  invitedCount.value = 0
  isClaiming.value = false
  resultPrize.value = null
  showResultModal.value = false
}

const closeResult = () => {
  showResultModal.value = false
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-slate-100">
    <PlatformNavbar />

    <main class="flex-1">
      <div class="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <section class="overflow-hidden rounded-3xl bg-slate-950 shadow-xl">
          <div class="relative px-6 py-8 text-white md:px-10 md:py-10">
            <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,.42),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,.30),transparent_35%)]" />

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
                  <div class="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-emerald-100 backdrop-blur">
                    Referral Task
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
                  class="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/10 p-4 text-sm leading-6 text-emerald-100"
                >
                  <p class="font-black">
                    自訂活動 gameId：{{ effectiveGameId }}
                  </p>

                  <p class="mt-1">
                    template：{{ templateGameId }} / 推薦任務模板
                  </p>
                </div>
              </div>

              <div class="rounded-3xl border border-white/10 bg-white/10 p-5 text-center backdrop-blur">
                <div class="text-5xl">
                  {{ gameIcon }}
                </div>

                <p class="mt-3 text-sm font-bold text-slate-200">
                  邀請好友完成任務
                </p>

                <p class="mt-1 text-xs text-slate-400">
                  需邀請 {{ requiredInviteCount }} 位好友
                </p>
              </div>
            </div>
          </div>
        </section>

        <BaseAlert
          :type="hasPlayedReferralTask ? 'warning' : isTaskCompleted ? 'success' : 'info'"
          :title="hasPlayedReferralTask ? '你已經完成本次推薦任務' : isTaskCompleted ? '任務已達標，可以領獎' : '開始推薦好友'"
          :message="hasPlayedReferralTask ? `目前活動 ${effectiveGameId} 已達遊玩限制。需要重新測試可以清除此活動紀錄。` : isTaskCompleted ? '推薦人數已達標，點擊領取獎勵即可完成任務。' : `目前還差 ${remainingInviteCount} 位好友，完成後即可領獎。`"
        />

        <section class="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-8">
            <div class="mx-auto max-w-4xl">
              <div class="mb-8 text-center">
                <h2 class="text-2xl font-black text-slate-900">
                  推薦任務進度
                </h2>

                <p class="mt-2 text-sm text-slate-400">
                  測試版可用按鈕模擬好友成功加入。
                </p>
              </div>

              <div class="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-6 md:p-8">
                <div class="grid gap-5 md:grid-cols-3">
                  <div class="rounded-3xl bg-white p-5 text-center shadow-sm">
                    <div class="text-4xl">👥</div>

                    <p class="mt-3 text-sm font-black text-slate-400">
                      已邀請
                    </p>

                    <p class="mt-2 text-4xl font-black text-emerald-600">
                      {{ invitedCount }}
                    </p>
                  </div>

                  <div class="rounded-3xl bg-white p-5 text-center shadow-sm">
                    <div class="text-4xl">🎯</div>

                    <p class="mt-3 text-sm font-black text-slate-400">
                      目標人數
                    </p>

                    <p class="mt-2 text-4xl font-black text-slate-900">
                      {{ requiredInviteCount }}
                    </p>
                  </div>

                  <div class="rounded-3xl bg-white p-5 text-center shadow-sm">
                    <div class="text-4xl">🎁</div>

                    <p class="mt-3 text-sm font-black text-slate-400">
                      任務狀態
                    </p>

                    <p
                      class="mt-2 text-2xl font-black"
                      :class="isTaskCompleted ? 'text-emerald-600' : 'text-amber-600'"
                    >
                      {{ isTaskCompleted ? '已達標' : '進行中' }}
                    </p>
                  </div>
                </div>

                <div class="mt-8">
                  <div class="mb-2 flex items-center justify-between text-sm font-black text-slate-500">
                    <span>完成進度</span>
                    <span>{{ progressPercent }}%</span>
                  </div>

                  <div class="h-5 overflow-hidden rounded-full bg-white">
                    <div
                      class="h-full rounded-full bg-emerald-500 transition-all"
                      :style="{ width: `${progressPercent}%` }"
                    />
                  </div>
                </div>

                <div class="mt-8 grid gap-3 md:grid-cols-3">
                  <button
                    type="button"
                    class="rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-600 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="hasPlayedReferralTask || isClaiming"
                    @click="addInvite"
                  >
                    模擬邀請 +1
                  </button>

                  <button
                    type="button"
                    class="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black text-blue-600 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="hasPlayedReferralTask || isClaiming"
                    @click="completeInviteTask"
                  >
                    一鍵達標
                  </button>

                  <button
                    type="button"
                    class="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-400"
                    :disabled="hasPlayedReferralTask || isClaiming"
                    @click="claimReward"
                  >
                    {{
                      isClaiming
                        ? '領獎中...'
                        : hasPlayedReferralTask
                          ? '你已經領過了'
                          : '領取獎勵'
                    }}
                  </button>
                </div>
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
                  <BaseBadge text="任務活動" type="info" />
                </div>

                <div class="flex items-center justify-between gap-3">
                  <span class="text-sm text-slate-500">領獎邏輯</span>
                  <BaseBadge :text="probabilityModeText" type="warning" />
                </div>

                <div class="flex items-center justify-between gap-3">
                  <span class="text-sm text-slate-500">邀請門檻</span>
                  <BaseBadge :text="`${requiredInviteCount} 人`" type="primary" />
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
                    class="mt-4 w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-600 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="hasPlayedReferralTask || isClaiming"
                    @click="resetReferralTask"
                  >
                    重新測試推薦任務
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
                  最近推薦紀錄
                </h2>

                <BaseBadge
                  :text="`${referralHistories.length} 筆`"
                  type="info"
                />
              </div>

              <div
                v-if="referralHistories.length"
                class="mt-5 space-y-3"
              >
                <div
                  v-for="history in referralHistories.slice(0, 5)"
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
        v-else-if="hasPlayedReferralTask && latestReferralHistory"
        class="text-center"
      >
        <div class="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-100 text-5xl">
          {{ latestReferralHistory.prizeIcon }}
        </div>

        <h2 class="mt-5 text-2xl font-black text-slate-800">
          你已經領過了
        </h2>

        <p class="mt-2 text-sm leading-6 text-slate-500">
          本次推薦任務結果是：{{ latestReferralHistory.prizeName }}
        </p>

        <p class="mt-2 text-xs font-bold text-slate-400">
          gameId：{{ latestReferralHistory.gameId }}
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
          class="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
          @click.stop="closeResult"
        >
          確認
        </button>
      </template>
    </BaseModal>
  </div>
</template>