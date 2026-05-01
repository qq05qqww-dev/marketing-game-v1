<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseBadge from '../../components/common/BaseBadge.vue'
import { useAdminGameSettings } from '../../composables/useAdminGameSettings'

const router = useRouter()

const {
  gameSettings,
  getGameSettingSummary
} = useAdminGameSettings()

const summary = computed(() => {
  return getGameSettingSummary()
})

const totalPrizeCount = computed(() => {
  return gameSettings.value.reduce((sum, game) => {
    return sum + (game.prizes?.length || 0)
  }, 0)
})

const totalPrizeWeight = computed(() => {
  return gameSettings.value.reduce((sum, game) => {
    const gameWeight = (game.prizes || []).reduce((prizeSum, prize) => {
      return prizeSum + Number(prize.weight || 0)
    }, 0)

    return sum + gameWeight
  }, 0)
})

const totalPrizeQuantity = computed(() => {
  return gameSettings.value.reduce((sum, game) => {
    const gameQuantity = (game.prizes || []).reduce((prizeSum, prize) => {
      return prizeSum + Number(prize.quantity || 0)
    }, 0)

    return sum + gameQuantity
  }, 0)
})

const enabledGames = computed(() => {
  return gameSettings.value.filter((game) => game.status === 'enabled')
})

const disabledGames = computed(() => {
  return gameSettings.value.filter((game) => game.status !== 'enabled')
})

const recentGames = computed(() => {
  return gameSettings.value.slice(0, 6)
})

const statCards = computed(() => {
  return [
    {
      title: '全部遊戲',
      value: summary.value.total,
      description: `已啟用 ${summary.value.enabled} 個，未啟用 ${summary.value.disabled} 個`,
      icon: '🎮',
      colorClass: 'from-slate-700 to-slate-500'
    },
    {
      title: '已啟用遊戲',
      value: summary.value.enabled,
      description: '目前玩家可在前台遊玩的遊戲',
      icon: '✅',
      colorClass: 'from-emerald-500 to-teal-400'
    },
    {
      title: '總獎項數',
      value: totalPrizeCount.value,
      description: '所有遊戲獎項數量加總',
      icon: '🎁',
      colorClass: 'from-blue-500 to-cyan-400'
    },
    {
      title: '總權重',
      value: totalPrizeWeight.value,
      description: '所有獎項權重加總',
      icon: '⚖️',
      colorClass: 'from-amber-500 to-orange-400'
    }
  ]
})

const categoryCards = computed(() => {
  return [
    {
      title: '抽獎遊戲',
      value: summary.value.lottery,
      icon: '🎁',
      description: '九宮格、刮刮卡、輪盤、翻牌、金蛋、拉霸等',
      badgeType: 'primary'
    },
    {
      title: '技巧遊戲',
      value: summary.value.skill,
      icon: '🚀',
      description: '套圈圈、夾娃娃等互動式玩法',
      badgeType: 'warning'
    },
    {
      title: '任務活動',
      value: summary.value.mission,
      icon: '🤝',
      description: '推薦任務、好友邀請、裂變活動',
      badgeType: 'info'
    }
  ]
})

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

const statusTextMap = {
  enabled: '已啟用',
  disabled: '未啟用'
}

const statusBadgeMap = {
  enabled: 'success',
  disabled: 'danger'
}

const goGameSettings = () => {
  router.push('/admin/game-settings')
}

const goFrontGames = () => {
  router.push('/games')
}

const goEditGame = (game) => {
  router.push(`/admin/game-settings/${game.id}/edit`)
}

const goPrizeSettings = (game) => {
  router.push(`/admin/game-settings/${game.id}/prizes`)
}

const goProbabilitySettings = (game) => {
  router.push(`/admin/game-settings/${game.id}/probability`)
}
</script>

<template>
  <div class="space-y-8">
    <section class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div class="grid gap-0 lg:grid-cols-[1.2fr_.8fr]">
        <div class="p-6 md:p-8">
          <div class="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-600">
            Admin Dashboard
          </div>

          <h1 class="mt-4 text-3xl font-black text-slate-900 md:text-4xl">
            後台活動總覽
          </h1>

          <p class="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            這裡可以快速查看目前多遊戲平台的遊戲設定狀態、獎項總數、權重設定與前台同步狀態。
          </p>

          <div class="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              class="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-700"
              @click="goGameSettings"
            >
              前往遊戲設定管理
            </button>

            <button
              type="button"
              class="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
              @click="goFrontGames"
            >
              查看前台遊戲中心
            </button>
          </div>
        </div>

        <div class="flex items-center justify-center bg-gradient-to-br from-blue-600 to-cyan-500 p-8 text-white">
          <div class="text-center">
            <div class="text-7xl drop-shadow">
              🎮
            </div>

            <p class="mt-5 text-5xl font-black">
              {{ summary.total }}
            </p>

            <p class="mt-2 text-sm font-bold text-white/80">
              目前平台遊戲總數
            </p>
          </div>
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

    <section class="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div class="space-y-6">
        <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 class="text-xl font-black text-slate-900">
                遊戲分類狀態
              </h2>

              <p class="mt-1 text-sm text-slate-400">
                目前平台依遊戲類型分類統計。
              </p>
            </div>

            <BaseBadge
              text="即時讀取 localStorage"
              type="primary"
            />
          </div>

          <div class="mt-5 grid gap-4 md:grid-cols-3">
            <article
              v-for="card in categoryCards"
              :key="card.title"
              class="rounded-3xl border border-slate-200 bg-slate-50 p-5"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-sm font-black text-slate-500">
                    {{ card.title }}
                  </p>

                  <p class="mt-3 text-4xl font-black text-slate-900">
                    {{ card.value }}
                  </p>
                </div>

                <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
                  {{ card.icon }}
                </div>
              </div>

              <p class="mt-4 min-h-[48px] text-sm leading-6 text-slate-500">
                {{ card.description }}
              </p>

              <div class="mt-4">
                <BaseBadge
                  :text="card.title"
                  :type="card.badgeType"
                />
              </div>
            </article>
          </div>
        </section>

        <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 class="text-xl font-black text-slate-900">
                遊戲設定快速管理
              </h2>

              <p class="mt-1 text-sm text-slate-400">
                可快速進入編輯、獎項設定與機率設定。
              </p>
            </div>

            <button
              type="button"
              class="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-600"
              @click="goGameSettings"
            >
              查看全部
            </button>
          </div>

          <div class="mt-5 grid gap-4">
            <article
              v-for="game in recentGames"
              :key="game.id"
              class="rounded-3xl border border-slate-200 bg-slate-50 p-5"
            >
              <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div class="flex min-w-0 items-start gap-4">
                  <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
                    {{ game.icon }}
                  </div>

                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <h3 class="text-lg font-black text-slate-900">
                        {{ game.name }}
                      </h3>

                      <BaseBadge
                        :text="statusTextMap[game.status] || game.status"
                        :type="statusBadgeMap[game.status] || 'default'"
                      />

                      <BaseBadge
                        :text="typeTextMap[game.type] || game.type"
                        :type="typeBadgeMap[game.type] || 'default'"
                      />
                    </div>

                    <p class="mt-1 text-xs font-bold text-slate-400">
                      {{ game.id }}・{{ game.route }}
                    </p>

                    <p class="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                      {{ game.description }}
                    </p>
                  </div>
                </div>

                <div class="grid gap-2 sm:grid-cols-3 lg:w-[330px]">
                  <button
                    type="button"
                    class="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-100"
                    @click="goEditGame(game)"
                  >
                    編輯
                  </button>

                  <button
                    type="button"
                    class="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-black text-blue-600 transition hover:bg-blue-100"
                    @click="goPrizeSettings(game)"
                  >
                    獎項
                  </button>

                  <button
                    type="button"
                    class="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-black text-amber-600 transition hover:bg-amber-100"
                    @click="goProbabilitySettings(game)"
                  >
                    機率
                  </button>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>

      <aside class="space-y-6">
        <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="text-xl font-black text-slate-900">
            設定同步狀態
          </h2>

          <p class="mt-1 text-sm leading-6 text-slate-400">
            目前後台遊戲設定、獎項設定與前台遊戲頁都已經串接 localStorage。
          </p>

          <div class="mt-5 space-y-4">
            <div class="flex items-center justify-between gap-3">
              <span class="text-sm text-slate-500">資料來源</span>
              <BaseBadge text="localStorage" type="primary" />
            </div>

            <div class="flex items-center justify-between gap-3">
              <span class="text-sm text-slate-500">Storage Key</span>
              <BaseBadge text="v22_admin_game_settings" type="default" />
            </div>

            <div class="flex items-center justify-between gap-3">
              <span class="text-sm text-slate-500">前台同步</span>
              <BaseBadge text="已同步" type="success" />
            </div>

            <div class="flex items-center justify-between gap-3">
              <span class="text-sm text-slate-500">獎項編輯</span>
              <BaseBadge text="已支援" type="success" />
            </div>

            <div class="flex items-center justify-between gap-3">
              <span class="text-sm text-slate-500">權重編輯</span>
              <BaseBadge text="已支援" type="success" />
            </div>
          </div>
        </section>

        <section class="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
          <h2 class="text-xl font-black text-emerald-900">
            已啟用遊戲
          </h2>

          <p class="mt-1 text-sm text-emerald-700">
            目前前台可遊玩的遊戲列表。
          </p>

          <div class="mt-5 space-y-3">
            <div
              v-for="game in enabledGames"
              :key="game.id"
              class="flex items-center gap-3 rounded-2xl bg-white p-3"
            >
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-xl">
                {{ game.icon }}
              </div>

              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-black text-emerald-900">
                  {{ game.name }}
                </p>

                <p class="truncate text-xs text-emerald-600">
                  {{ game.route }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          v-if="disabledGames.length"
          class="rounded-3xl border border-rose-200 bg-rose-50 p-6"
        >
          <h2 class="text-xl font-black text-rose-900">
            未啟用遊戲
          </h2>

          <p class="mt-1 text-sm text-rose-700">
            目前前台未開放的遊戲。
          </p>

          <div class="mt-5 space-y-3">
            <div
              v-for="game in disabledGames"
              :key="game.id"
              class="flex items-center gap-3 rounded-2xl bg-white p-3"
            >
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-xl">
                {{ game.icon }}
              </div>

              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-black text-rose-900">
                  {{ game.name }}
                </p>

                <p class="truncate text-xs text-rose-600">
                  {{ game.route }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section class="rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <h2 class="text-xl font-black text-amber-900">
            獎項庫存總覽
          </h2>

          <div class="mt-5 space-y-4">
            <div class="flex items-center justify-between gap-3">
              <span class="text-sm text-amber-700">總獎項數</span>
              <span class="text-lg font-black text-amber-900">
                {{ totalPrizeCount }}
              </span>
            </div>

            <div class="flex items-center justify-between gap-3">
              <span class="text-sm text-amber-700">總權重</span>
              <span class="text-lg font-black text-amber-900">
                {{ totalPrizeWeight }}
              </span>
            </div>

            <div class="flex items-center justify-between gap-3">
              <span class="text-sm text-amber-700">總庫存</span>
              <span class="text-lg font-black text-amber-900">
                {{ totalPrizeQuantity }}
              </span>
            </div>
          </div>
        </section>
      </aside>
    </section>
  </div>
</template>