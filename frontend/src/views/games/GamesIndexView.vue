<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import PlatformNavbar from '../../components/PlatformNavbar.vue'
import PlatformFooter from '../../components/PlatformFooter.vue'
import BasePageHeader from '../../components/common/BasePageHeader.vue'
import BaseBadge from '../../components/common/BaseBadge.vue'
import BaseEmptyState from '../../components/common/BaseEmptyState.vue'
import BaseSearchInput from '../../components/common/BaseSearchInput.vue'
import { gameModules } from '../../constants/gameModules'

const router = useRouter()

const keyword = ref('')
const activeType = ref('all')

const typeTabs = [
  {
    label: '全部',
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
  }
]

const filteredGames = computed(() => {
  return gameModules.filter((game) => {
    const matchKeyword =
      !keyword.value ||
      game.name.includes(keyword.value) ||
      game.subtitle.includes(keyword.value) ||
      game.description.includes(keyword.value)

    const matchType =
      activeType.value === 'all' ||
      game.type === activeType.value

    return matchKeyword && matchType
  })
})

const statusTextMap = {
  enabled: '已開放',
  'coming-soon': '即將開放'
}

const statusTypeMap = {
  enabled: 'success',
  'coming-soon': 'warning'
}

const difficultyTextMap = {
  easy: '簡單',
  medium: '中等',
  hard: '進階',
  expert: '專業'
}

const difficultyTypeMap = {
  easy: 'success',
  medium: 'info',
  hard: 'warning',
  expert: 'danger'
}

const goGame = (game) => {
  if (game.status !== 'enabled') return

  router.push(game.route)
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-slate-100">
    <PlatformNavbar />

    <main class="flex-1">
      <div class="mx-auto max-w-7xl space-y-8 px-4 py-8">
        <BasePageHeader
          eyebrow="Game Center"
          title="互動遊戲中心"
          description="選擇活動遊戲玩法，建立更有參與感的抽獎與行銷互動體驗。"
        />

        <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div class="w-full lg:max-w-md">
              <BaseSearchInput
                v-model="keyword"
                placeholder="搜尋遊戲名稱、玩法或說明"
              />
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                v-for="tab in typeTabs"
                :key="tab.value"
                type="button"
                class="rounded-xl px-4 py-2.5 text-sm font-bold transition"
                :class="activeType === tab.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                "
                @click="activeType = tab.value"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>
        </section>

        <section v-if="filteredGames.length" class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <article
            v-for="game in filteredGames"
            :key="game.id"
            class="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            :class="game.status === 'enabled' ? 'cursor-pointer' : 'opacity-75'"
            @click="goGame(game)"
          >
            <div
              class="relative min-h-44 overflow-hidden bg-gradient-to-br p-6 text-white"
              :class="game.coverColor"
            >
              <div class="absolute right-[-24px] top-[-24px] h-28 w-28 rounded-full bg-white/20" />
              <div class="absolute bottom-[-36px] left-[-36px] h-32 w-32 rounded-full bg-white/10" />

              <div class="relative z-10 flex items-start justify-between gap-4">
                <div>
                  <div class="text-5xl drop-shadow">
                    {{ game.icon }}
                  </div>

                  <h2 class="mt-5 text-2xl font-black">
                    {{ game.name }}
                  </h2>

                  <p class="mt-2 text-sm font-semibold text-white/85">
                    {{ game.subtitle }}
                  </p>
                </div>

                <BaseBadge
                  :text="statusTextMap[game.status] || game.status"
                  :type="statusTypeMap[game.status] || 'default'"
                />
              </div>
            </div>

            <div class="space-y-5 p-6">
              <p class="min-h-[48px] text-sm leading-6 text-slate-500">
                {{ game.description }}
              </p>

              <div class="flex flex-wrap gap-2">
                <BaseBadge
                  :text="difficultyTextMap[game.difficulty] || game.difficulty"
                  :type="difficultyTypeMap[game.difficulty] || 'default'"
                />

                <BaseBadge
                  :text="game.type"
                  type="primary"
                />
              </div>

              <div class="space-y-2">
                <p class="text-xs font-black uppercase tracking-wider text-slate-400">
                  功能特色
                </p>

                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="feature in game.features"
                    :key="feature"
                    class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500"
                  >
                    {{ feature }}
                  </span>
                </div>
              </div>

              <button
                type="button"
                class="w-full rounded-2xl px-4 py-3 text-sm font-black transition"
                :class="game.status === 'enabled'
                  ? 'bg-slate-900 text-white hover:bg-blue-600'
                  : 'cursor-not-allowed bg-slate-100 text-slate-400'
                "
                :disabled="game.status !== 'enabled'"
              >
                {{ game.status === 'enabled' ? '開始建立遊戲' : '尚未開放' }}
              </button>
            </div>
          </article>
        </section>

        <BaseEmptyState
          v-else
          icon="🎮"
          title="找不到符合的遊戲"
          description="請調整搜尋關鍵字或切換遊戲分類。"
        />
      </div>
    </main>

    <PlatformFooter />
  </div>
</template>