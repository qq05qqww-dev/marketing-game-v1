<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import PlatformNavbar from '../../components/PlatformNavbar.vue'
import PlatformFooter from '../../components/PlatformFooter.vue'
import BasePageHeader from '../../components/common/BasePageHeader.vue'
import BaseBadge from '../../components/common/BaseBadge.vue'
import BaseEmptyState from '../../components/common/BaseEmptyState.vue'
import BaseSearchInput from '../../components/common/BaseSearchInput.vue'
import { useDrawHistory } from '../../composables/useDrawHistory'
import { useAdminGameSettings } from '../../composables/useAdminGameSettings'

const router = useRouter()

const keyword = ref('')
const activeType = ref('all')

const {
  histories,
  clearHistories,
  clearHistoriesByGameId,
  removeHistory
} = useDrawHistory()

const {
  gameSettings
} = useAdminGameSettings()

const typeTabs = [
  {
    label: '全部紀錄',
    value: 'all'
  },
  {
    label: '抽獎遊戲',
    value: 'lottery'
  },
  {
    label: '技巧遊戲',
    value: 'skill'
  },
  {
    label: '任務活動',
    value: 'mission'
  },
  {
    label: '模板遊戲',
    value: 'template'
  }
]

const templateTextMap = {
  'grid-lottery': '九宮格模板',
  'scratch-card': '刮刮卡模板',
  wheel: '幸運輪盤模板',
  'flip-card': '翻牌遊戲模板',
  'egg-smash': '敲金蛋模板',
  'slot-machine': '拉霸機模板',
  'ring-toss': '套圈圈模板',
  'claw-machine': '夾娃娃模板',
  'referral-task': '推薦任務模板'
}

const typeTextMap = {
  lottery: '抽獎遊戲',
  skill: '技巧遊戲',
  mission: '任務活動'
}

const typeBadgeMap = {
  lottery: 'primary',
  skill: 'warning',
  mission: 'info'
}

const getGameById = (gameId) => {
  return gameSettings.value.find((game) => game.id === gameId)
}

const getTemplateGameById = (templateGameId) => {
  return gameSettings.value.find((game) => game.id === templateGameId)
}

const getHistoryGame = (history) => {
  return getGameById(history.gameId)
}

const getHistoryTemplateGame = (history) => {
  if (!history.templateGameId) return null

  return getTemplateGameById(history.templateGameId)
}

const getHistoryGameName = (history) => {
  const game = getHistoryGame(history)

  return game?.name || history.gameName || '未知遊戲'
}

const getHistoryGameIcon = (history) => {
  const game = getHistoryGame(history)

  return game?.icon || history.prizeIcon || '🎮'
}

const getHistoryGameType = (history) => {
  const game = getHistoryGame(history)

  return game?.type || 'lottery'
}

const getHistoryGameRoute = (history) => {
  const game = getHistoryGame(history)

  if (game?.route) {
    return game.route
  }

  if (history.templateGameId) {
    return `/games/${history.templateGameId}?gameId=${history.gameId}`
  }

  return `/games/${history.gameId}`
}

const isTemplateHistory = (history) => {
  return Boolean(history.templateGameId && history.templateGameId !== history.gameId)
}

const getTemplateText = (history) => {
  if (!isTemplateHistory(history)) return ''

  return templateTextMap[history.templateGameId] || history.templateGameId
}

const enhancedHistories = computed(() => {
  return histories.value.map((history) => {
    const game = getHistoryGame(history)
    const templateGame = getHistoryTemplateGame(history)
    const gameType = getHistoryGameType(history)

    return {
      ...history,
      displayGameName: getHistoryGameName(history),
      displayGameIcon: getHistoryGameIcon(history),
      displayGameType: gameType,
      displayGameRoute: getHistoryGameRoute(history),
      game,
      templateGame,
      isTemplate: isTemplateHistory(history),
      templateText: getTemplateText(history)
    }
  })
})

const filteredHistories = computed(() => {
  return enhancedHistories.value.filter((history) => {
    const matchKeyword =
      !keyword.value ||
      history.displayGameName.includes(keyword.value) ||
      history.gameId.includes(keyword.value) ||
      history.templateGameId?.includes(keyword.value) ||
      history.prizeName?.includes(keyword.value) ||
      history.playerName?.includes(keyword.value) ||
      history.templateText?.includes(keyword.value)

    const matchType =
      activeType.value === 'all' ||
      (activeType.value === 'template' && history.isTemplate) ||
      history.displayGameType === activeType.value

    return matchKeyword && matchType
  })
})

const totalHistoryCount = computed(() => {
  return histories.value.length
})

const templateHistoryCount = computed(() => {
  return enhancedHistories.value.filter((history) => history.isTemplate).length
})

const normalHistoryCount = computed(() => {
  return enhancedHistories.value.filter((history) => !history.isTemplate).length
})

const uniqueGameCount = computed(() => {
  const ids = histories.value.map((history) => history.gameId)

  return new Set(ids).size
})

const latestHistory = computed(() => {
  return enhancedHistories.value[0] || null
})

const statCards = computed(() => {
  return [
    {
      title: '全部紀錄',
      value: totalHistoryCount.value,
      description: '目前瀏覽器保存的遊戲紀錄',
      icon: '📋',
      colorClass: 'from-slate-700 to-slate-500'
    },
    {
      title: '已玩遊戲',
      value: uniqueGameCount.value,
      description: '不重複遊戲 ID 數量',
      icon: '🎮',
      colorClass: 'from-blue-500 to-cyan-400'
    },
    {
      title: '模板紀錄',
      value: templateHistoryCount.value,
      description: '自訂模板遊戲產生的紀錄',
      icon: '🧩',
      colorClass: 'from-purple-500 to-pink-400'
    },
    {
      title: '原始紀錄',
      value: normalHistoryCount.value,
      description: '原始 9 種遊戲產生的紀錄',
      icon: '✅',
      colorClass: 'from-emerald-500 to-teal-400'
    }
  ]
})

const groupedHistories = computed(() => {
  const groups = {}

  filteredHistories.value.forEach((history) => {
    const key = history.gameId

    if (!groups[key]) {
      groups[key] = {
        gameId: key,
        gameName: history.displayGameName,
        gameIcon: history.displayGameIcon,
        gameType: history.displayGameType,
        gameRoute: history.displayGameRoute,
        isTemplate: history.isTemplate,
        templateGameId: history.templateGameId,
        templateText: history.templateText,
        histories: []
      }
    }

    groups[key].histories.push(history)
  })

  return Object.values(groups)
})

const formatDateTime = (value) => {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const goBack = () => {
  router.push('/games')
}

const goGame = (history) => {
  router.push(history.displayGameRoute)
}

const goGameByGroup = (group) => {
  router.push(group.gameRoute)
}

const clearAll = () => {
  const confirmed = window.confirm('確定要清除全部遊戲紀錄嗎？')

  if (!confirmed) return

  clearHistories()
}

const clearGameGroup = (group) => {
  const confirmed = window.confirm(`確定要清除「${group.gameName}」的全部紀錄嗎？`)

  if (!confirmed) return

  clearHistoriesByGameId(group.gameId)
}

const removeSingleHistory = (history) => {
  const confirmed = window.confirm(`確定要刪除「${history.displayGameName} - ${history.prizeName}」這筆紀錄嗎？`)

  if (!confirmed) return

  removeHistory(history.id)
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-slate-100">
    <PlatformNavbar />

    <main class="flex-1">
      <div class="mx-auto max-w-7xl space-y-8 px-4 py-8">
        <BasePageHeader
          eyebrow="Game History"
          title="我的遊戲紀錄"
          description="查看目前瀏覽器保存的遊戲結果、模板活動紀錄、獎項內容與遊玩時間。"
        />

        <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <button
                type="button"
                class="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-200"
                @click="goBack"
              >
                ← 返回遊戲中心
              </button>

              <h1 class="mt-5 text-3xl font-black text-slate-900">
                遊戲紀錄總覽
              </h1>

              <p class="mt-2 text-sm leading-6 text-slate-500">
                模板遊戲會獨立顯示自訂 gameId，例如 summer-grid-2026，不會跟原始 grid-lottery 混在一起。
              </p>
            </div>

            <div class="flex flex-wrap gap-3">
              <button
                type="button"
                class="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
                @click="goBack"
              >
                查看遊戲中心
              </button>

              <button
                v-if="histories.length"
                type="button"
                class="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-black text-rose-600 transition hover:bg-rose-100"
                @click="clearAll"
              >
                清除全部紀錄
              </button>
            </div>
          </div>
        </section>

        <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article
            v-for="card in statCards"
            :key="card.title"
            class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
          >
            <div
              class="bg-gradient-to-br p-5 text-white"
              :class="card.colorClass"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-sm font-bold text-white/80">
                    {{ card.title }}
                  </p>

                  <p class="mt-3 text-4xl font-black">
                    {{ card.value }}
                  </p>
                </div>

                <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-3xl">
                  {{ card.icon }}
                </div>
              </div>

              <p class="mt-4 text-sm font-semibold text-white/80">
                {{ card.description }}
              </p>
            </div>
          </article>
        </section>

        <section
          v-if="latestHistory"
          class="overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-sm"
        >
          <div class="grid gap-0 lg:grid-cols-[1.2fr_.8fr]">
            <div class="p-6 md:p-8">
              <div class="flex flex-wrap gap-2">
                <div class="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-600">
                  Latest Result
                </div>

                <BaseBadge
                  v-if="latestHistory.isTemplate"
                  text="模板遊戲紀錄"
                  type="info"
                />
              </div>

              <h2 class="mt-4 text-2xl font-black text-slate-900">
                最近一次遊戲結果
              </h2>

              <div class="mt-5 flex items-center gap-4">
                <div class="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-4xl">
                  {{ latestHistory.prizeIcon }}
                </div>

                <div>
                  <p class="text-lg font-black text-slate-900">
                    {{ latestHistory.prizeName }}
                  </p>

                  <p class="mt-1 text-sm text-slate-500">
                    {{ latestHistory.displayGameName }}・{{ formatDateTime(latestHistory.createdAt) }}
                  </p>
                </div>
              </div>

              <div
                v-if="latestHistory.isTemplate"
                class="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4"
              >
                <p class="text-sm font-black text-blue-900">
                  自訂活動 ID：{{ latestHistory.gameId }}
                </p>

                <p class="mt-1 text-sm text-blue-700">
                  使用模板：{{ latestHistory.templateText }}
                </p>
              </div>

              <div class="mt-6">
                <button
                  type="button"
                  class="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-700"
                  @click="goGame(latestHistory)"
                >
                  查看這個遊戲
                </button>
              </div>
            </div>

            <div class="flex items-center justify-center bg-gradient-to-br from-blue-600 to-cyan-500 p-8 text-white">
              <div class="text-center">
                <div class="text-7xl drop-shadow">
                  {{ latestHistory.displayGameIcon }}
                </div>

                <p class="mt-5 text-2xl font-black">
                  {{ latestHistory.displayGameName }}
                </p>

                <p class="mt-2 text-sm font-bold text-white/80">
                  {{ latestHistory.gameId }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section class="rounded-3xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 class="text-lg font-black text-blue-900">
                模板遊戲紀錄說明
              </h2>

              <p class="mt-1 text-sm leading-6 text-blue-700">
                如果前台網址是 /games/grid-lottery?gameId=summer-grid-2026，紀錄會顯示為 summer-grid-2026，並標示它使用九宮格模板。
              </p>
            </div>

            <BaseBadge
              text="支援自訂 gameId"
              type="primary"
            />
          </div>
        </section>

        <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
            <BaseSearchInput
              v-model="keyword"
              placeholder="搜尋遊戲名稱、gameId、模板、獎項或玩家名稱"
            />

            <div class="flex flex-wrap gap-2">
              <button
                v-for="tab in typeTabs"
                :key="tab.value"
                type="button"
                class="rounded-xl px-4 py-2.5 text-sm font-black transition"
                :class="activeType === tab.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                "
                @click="activeType = tab.value"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>
        </section>

        <section
          v-if="groupedHistories.length"
          class="grid gap-6"
        >
          <article
            v-for="group in groupedHistories"
            :key="group.gameId"
            class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
          >
            <div class="border-b border-slate-100 p-6">
              <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div class="flex min-w-0 items-start gap-4">
                  <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-slate-100 text-4xl">
                    {{ group.gameIcon }}
                  </div>

                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <h2 class="text-xl font-black text-slate-900">
                        {{ group.gameName }}
                      </h2>

                      <BaseBadge
                        :text="typeTextMap[group.gameType] || group.gameType"
                        :type="typeBadgeMap[group.gameType] || 'default'"
                      />

                      <BaseBadge
                        v-if="group.isTemplate"
                        text="模板遊戲"
                        type="info"
                      />

                      <BaseBadge
                        :text="`${group.histories.length} 筆紀錄`"
                        type="success"
                      />
                    </div>

                    <p class="mt-1 text-xs font-bold text-slate-400">
                      遊戲 ID：{{ group.gameId }}
                    </p>

                    <p
                      v-if="group.isTemplate"
                      class="mt-2 text-xs font-black text-blue-500"
                    >
                      使用模板：{{ group.templateText }} / {{ group.templateGameId }}
                    </p>
                  </div>
                </div>

                <div class="flex flex-wrap gap-3">
                  <button
                    type="button"
                    class="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
                    @click="goGameByGroup(group)"
                  >
                    查看遊戲
                  </button>

                  <button
                    type="button"
                    class="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-black text-rose-600 transition hover:bg-rose-100"
                    @click="clearGameGroup(group)"
                  >
                    清除此遊戲紀錄
                  </button>
                </div>
              </div>
            </div>

            <div class="divide-y divide-slate-100">
              <div
                v-for="history in group.histories"
                :key="history.id"
                class="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center"
              >
                <div class="flex min-w-0 items-center gap-4">
                  <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
                    {{ history.prizeIcon }}
                  </div>

                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <p class="text-base font-black text-slate-900">
                        {{ history.prizeName }}
                      </p>

                      <BaseBadge
                        text="已完成"
                        type="success"
                        size="sm"
                      />

                      <BaseBadge
                        v-if="history.isTemplate"
                        text="自訂活動"
                        type="info"
                        size="sm"
                      />
                    </div>

                    <p class="mt-1 text-sm leading-6 text-slate-500">
                      {{ history.prizeDescription || '尚無獎項說明' }}
                    </p>

                    <div class="mt-2 flex flex-wrap gap-2 text-xs font-bold text-slate-400">
                      <span>玩家：{{ history.playerName || '訪客玩家' }}</span>
                      <span>時間：{{ formatDateTime(history.createdAt) }}</span>
                      <span>gameId：{{ history.gameId }}</span>
                      <span v-if="history.templateGameId">template：{{ history.templateGameId }}</span>
                    </div>
                  </div>
                </div>

                <div class="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    class="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-black text-blue-600 transition hover:bg-blue-100"
                    @click="goGame(history)"
                  >
                    查看遊戲
                  </button>

                  <button
                    type="button"
                    class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-black text-rose-600 transition hover:bg-rose-100"
                    @click="removeSingleHistory(history)"
                  >
                    刪除
                  </button>
                </div>
              </div>
            </div>
          </article>
        </section>

        <BaseEmptyState
          v-else
          icon="📋"
          title="目前沒有符合的遊戲紀錄"
          description="完成遊戲後，這裡會顯示一般遊戲與模板遊戲的結果紀錄。"
        />
      </div>
    </main>

    <PlatformFooter />
  </div>
</template>