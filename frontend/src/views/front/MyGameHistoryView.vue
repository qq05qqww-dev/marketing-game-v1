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
const activeGameId = ref('all')

const {
  histories,
  clearHistories,
  clearHistoriesByGameId,
  removeHistory
} = useDrawHistory()

const {
  gameSettings
} = useAdminGameSettings()

const templateTextMap = {
  'grid-lottery': '九宮格模板',
  'premium-grid': '精緻九宮格模板',
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

const isTemplateHistory = (history) => {
  return Boolean(history.templateGameId && history.templateGameId !== history.gameId)
}

const getTemplateText = (history) => {
  if (!isTemplateHistory(history)) return ''

  return templateTextMap[history.templateGameId] || history.templateGameId
}

const normalizeRoutePath = (value = '') => {
  const text = String(value || '').trim()

  if (!text) return ''

  if (text.startsWith('http://') || text.startsWith('https://')) {
    try {
      const url = new URL(text)

      return `${url.pathname}${url.search}${url.hash}`
    } catch (error) {
      console.error('來源網址解析失敗：', error)
      return text
    }
  }

  if (text.startsWith('/')) return text

  return `/${text}`
}

const getSourcePath = (history) => {
  return normalizeRoutePath(history.sourcePath || '')
}

const hasSourcePath = (history) => {
  return Boolean(getSourcePath(history))
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
  const sourcePath = getSourcePath(history)

  if (sourcePath) {
    return sourcePath
  }

  const game = getHistoryGame(history)

  if (game?.route) {
    return normalizeRoutePath(game.route)
  }

  if (history.templateGameId) {
    return `/games/${history.templateGameId}?gameId=${history.gameId}`
  }

  return `/games/${history.gameId}`
}

const getSourcePathText = (history) => {
  return getSourcePath(history) || '尚無來源網址紀錄'
}

const enhancedHistories = computed(() => {
  return histories.value.map((history) => {
    const game = getHistoryGame(history)
    const templateGame = getHistoryTemplateGame(history)
    const sourcePath = getSourcePath(history)

    return {
      ...history,
      game,
      templateGame,
      sourcePath,
      hasSourcePath: Boolean(sourcePath),
      isTemplate: isTemplateHistory(history),
      templateText: getTemplateText(history),
      displayGameName: getHistoryGameName(history),
      displayGameIcon: getHistoryGameIcon(history),
      displayGameType: getHistoryGameType(history),
      displayGameRoute: getHistoryGameRoute(history),
      displaySourcePath: getSourcePathText(history)
    }
  })
})

const gameOptions = computed(() => {
  const map = new Map()

  enhancedHistories.value.forEach((history) => {
    if (!map.has(history.gameId)) {
      map.set(history.gameId, {
        label: history.displayGameName,
        value: history.gameId,
        isTemplate: history.isTemplate
      })
    }
  })

  return [
    {
      label: '全部遊戲',
      value: 'all'
    },
    ...Array.from(map.values())
  ]
})

const filteredHistories = computed(() => {
  return enhancedHistories.value.filter((history) => {
    const matchGame =
      activeGameId.value === 'all' ||
      history.gameId === activeGameId.value

    const searchText = [
      history.displayGameName,
      history.gameId,
      history.templateGameId,
      history.templateText,
      history.prizeName,
      history.prizeDescription,
      history.playerName,
      history.sourcePath,
      history.displaySourcePath
    ].join(' ')

    const matchKeyword =
      !keyword.value ||
      searchText.includes(keyword.value)

    return matchGame && matchKeyword
  })
})

const totalHistoryCount = computed(() => {
  return histories.value.length
})

const uniqueGameCount = computed(() => {
  const ids = histories.value.map((history) => history.gameId)

  return new Set(ids).size
})

const templateHistoryCount = computed(() => {
  return enhancedHistories.value.filter((history) => history.isTemplate).length
})

const sourcePathHistoryCount = computed(() => {
  return enhancedHistories.value.filter((history) => history.hasSourcePath).length
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
      description: '已完成過的不同遊戲數',
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
      title: '可返回活動',
      value: sourcePathHistoryCount.value,
      description: '有保存來源網址的紀錄',
      icon: '↩️',
      colorClass: 'from-emerald-500 to-teal-400'
    }
  ]
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

const goGame = (history) => {
  router.push(history.displayGameRoute)
}

const goSourceActivity = (history) => {
  const sourcePath = getSourcePath(history)

  if (sourcePath) {
    router.push(sourcePath)
    return
  }

  goGame(history)
}

const goBack = () => {
  router.push('/games')
}

const clearAllHistories = () => {
  const confirmed = window.confirm('確定要清除全部遊戲紀錄嗎？')

  if (!confirmed) return

  clearHistories()
}

const clearSingleGameHistories = (history) => {
  const confirmed = window.confirm(`確定要清除「${history.displayGameName}」的全部紀錄嗎？`)

  if (!confirmed) return

  clearHistoriesByGameId(history.gameId)
}

const deleteHistory = (history) => {
  const confirmed = window.confirm(`確定要刪除「${history.prizeName}」這筆紀錄嗎？`)

  if (!confirmed) return

  removeHistory(history.id)
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-slate-100">
    <PlatformNavbar />

    <main class="flex-1">
      <div class="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <BasePageHeader
          eyebrow="My Game History"
          title="我的遊戲紀錄"
          description="查看目前瀏覽器保存的遊戲結果、模板活動紀錄、獎項內容、遊玩時間與來源活動網址。"
        />

        <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

                <BaseBadge
                  v-if="latestHistory.hasSourcePath"
                  text="可返回活動"
                  type="success"
                />
              </div>

              <h2 class="mt-4 text-2xl font-black text-slate-900">
                最新遊戲
              </h2>

              <div class="mt-5 flex items-center gap-4">
                <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-slate-100 text-4xl">
                  {{ latestHistory.prizeIcon }}
                </div>

                <div class="min-w-0">
                  <p class="truncate text-lg font-black text-slate-900">
                    {{ latestHistory.displayGameName }}
                  </p>

                  <p class="mt-1 text-sm text-slate-500">
                    {{ latestHistory.prizeName }}・{{ formatDateTime(latestHistory.createdAt) }}
                  </p>
                </div>
              </div>

              <div
                v-if="latestHistory.isTemplate"
                class="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4"
              >
                <p class="text-sm font-black text-blue-900">
                  自訂活動 gameId：{{ latestHistory.gameId }}
                </p>

                <p class="mt-1 text-sm text-blue-700">
                  template：{{ latestHistory.templateGameId }} / {{ latestHistory.templateText }}
                </p>
              </div>

              <div class="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p class="text-sm font-black text-emerald-900">
                  來源活動網址
                </p>

                <p class="mt-1 break-all text-sm font-bold text-emerald-700">
                  {{ latestHistory.displaySourcePath }}
                </p>
              </div>

              <div class="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  class="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-600"
                  @click="goGame(latestHistory)"
                >
                  查看遊戲
                </button>

                <button
                  v-if="latestHistory.hasSourcePath"
                  type="button"
                  class="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
                  @click="goSourceActivity(latestHistory)"
                >
                  返回活動
                </button>
              </div>
            </div>

            <div class="flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-500 p-8 text-white">
              <div class="text-center">
                <div class="text-7xl drop-shadow">
                  {{ latestHistory.displayGameIcon }}
                </div>

                <p class="mt-5 text-2xl font-black">
                  {{ latestHistory.displayGameName }}
                </p>

                <p class="mt-2 break-all text-sm font-bold text-white/80">
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
                精緻版活動來源說明
              </h2>

              <p class="mt-1 text-sm leading-6 text-blue-700">
                如果前台網址是 /games/premium-grid?gameId=summer-grid-2026，紀錄會保存來源網址，之後可以從這裡按「返回活動」直接回到原本活動頁。
              </p>
            </div>

            <div class="flex flex-wrap gap-2">
              <BaseBadge
                text="支援自訂 gameId"
                type="primary"
              />

              <BaseBadge
                text="支援 sourcePath"
                type="success"
              />
            </div>
          </div>
        </section>

        <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="grid gap-4 lg:grid-cols-[1fr_260px_auto_auto] lg:items-center">
            <BaseSearchInput
              v-model="keyword"
              placeholder="搜尋遊戲名稱、gameId、template、獎項、玩家、來源網址"
            />

            <select
              v-model="activeGameId"
              class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option
                v-for="option in gameOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}{{ option.isTemplate ? '（模板）' : '' }}
              </option>
            </select>

            <button
              type="button"
              class="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-100"
              @click="goBack"
            >
              回遊戲中心
            </button>

            <button
              v-if="histories.length"
              type="button"
              class="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-black text-rose-600 transition hover:bg-rose-100"
              @click="clearAllHistories"
            >
              清除全部紀錄
            </button>
          </div>
        </section>

        <section
          v-if="filteredHistories.length"
          class="space-y-5"
        >
          <article
            v-for="history in filteredHistories"
            :key="history.id"
            class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div class="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-center">
              <div class="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
                <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-slate-100 text-4xl">
                  {{ history.prizeIcon }}
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <h2 class="text-xl font-black text-slate-900">
                      {{ history.prizeName }}
                    </h2>

                    <BaseBadge
                      :text="typeTextMap[history.displayGameType] || history.displayGameType"
                      :type="typeBadgeMap[history.displayGameType] || 'default'"
                    />

                    <BaseBadge
                      text="已完成"
                      type="success"
                    />

                    <BaseBadge
                      v-if="history.isTemplate"
                      text="模板遊戲"
                      type="info"
                    />

                    <BaseBadge
                      v-if="history.hasSourcePath"
                      text="有來源網址"
                      type="success"
                    />
                  </div>

                  <p class="mt-2 text-sm font-black text-slate-700">
                    {{ history.displayGameName }}
                  </p>

                  <p class="mt-1 text-sm leading-6 text-slate-500">
                    {{ history.prizeDescription || '尚無獎項說明' }}
                  </p>

                  <div class="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-400">
                    <span>玩家：{{ history.playerName || '訪客玩家' }}</span>
                    <span>時間：{{ formatDateTime(history.createdAt) }}</span>
                    <span>gameId：{{ history.gameId }}</span>
                    <span v-if="history.templateGameId">template：{{ history.templateGameId }}</span>
                  </div>

                  <div
                    v-if="history.isTemplate"
                    class="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4"
                  >
                    <p class="text-sm font-black text-blue-900">
                      自訂模板活動
                    </p>

                    <p class="mt-1 text-sm text-blue-700">
                      此紀錄屬於 {{ history.gameId }}，使用模板 {{ history.templateGameId }}。
                    </p>
                  </div>

                  <div class="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <div class="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                      <div class="min-w-0">
                        <p class="text-sm font-black text-emerald-900">
                          來源活動網址
                        </p>

                        <p class="mt-1 break-all text-sm font-bold text-emerald-700">
                          {{ history.displaySourcePath }}
                        </p>
                      </div>

                      <button
                        v-if="history.hasSourcePath"
                        type="button"
                        class="shrink-0 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-700"
                        @click="goSourceActivity(history)"
                      >
                        返回活動
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex flex-wrap justify-start gap-2 xl:justify-end">
                <button
                  type="button"
                  class="rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-600"
                  @click="goGame(history)"
                >
                  查看遊戲
                </button>

                <button
                  v-if="history.hasSourcePath"
                  type="button"
                  class="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
                  @click="goSourceActivity(history)"
                >
                  返回活動
                </button>

                <button
                  type="button"
                  class="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-black text-amber-600 transition hover:bg-amber-100"
                  @click="clearSingleGameHistories(history)"
                >
                  清除此遊戲
                </button>

                <button
                  type="button"
                  class="rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-black text-rose-600 transition hover:bg-rose-100"
                  @click="deleteHistory(history)"
                >
                  刪除
                </button>
              </div>
            </div>
          </article>
        </section>

        <BaseEmptyState
          v-else
          icon="📋"
          title="目前沒有符合的遊戲紀錄"
          description="完成遊戲後，這裡會顯示一般遊戲、模板遊戲、精緻版活動來源與結果紀錄。"
        />
      </div>
    </main>

    <PlatformFooter />
  </div>
</template>
