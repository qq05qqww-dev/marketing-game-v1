<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseBadge from '../../components/common/BaseBadge.vue'
import BaseEmptyState from '../../components/common/BaseEmptyState.vue'
import { useAdminGameSettings } from '../../composables/useAdminGameSettings'

const route = useRoute()
const router = useRouter()

const {
  getGameSettingById,
  getRawGameSettingById,
  updateGameSetting
} = useAdminGameSettings()

const savedMessage = ref('')

const gameId = computed(() => {
  return String(route.params.gameId || '')
})

const game = computed(() => {
  return getRawGameSettingById(gameId.value) || getGameSettingById(gameId.value)
})

const form = reactive({
  templateId: '',
  name: '',
  description: '',
  route: '',
  icon: '',
  type: 'lottery',
  status: 'enabled',
  playLimit: 1,
  probabilityMode: 'weight',
  requiredInviteCount: 0
})

const typeOptions = [
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

const statusOptions = [
  {
    label: '已啟用',
    value: 'enabled'
  },
  {
    label: '未啟用',
    value: 'disabled'
  }
]

const probabilityModeOptions = [
  {
    label: '權重機率',
    value: 'weight'
  },
  {
    label: '百分比機率',
    value: 'percent'
  },
  {
    label: '固定結果',
    value: 'fixed'
  }
]

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

const probabilityModeTextMap = {
  weight: '權重機率',
  percent: '百分比機率',
  fixed: '固定結果'
}

const isTemplateGame = computed(() => {
  return Boolean(form.templateId)
})

const templateGame = computed(() => {
  if (!form.templateId) return null

  return getRawGameSettingById(form.templateId)
})

const templateBaseRoute = computed(() => {
  if (!templateGame.value?.route) return ''

  return templateGame.value.route.split('?')[0]
})

const suggestedTemplateRoute = computed(() => {
  if (!isTemplateGame.value) return ''

  const baseRoute = templateBaseRoute.value || form.route.split('?')[0]

  if (!baseRoute) return ''

  return `${baseRoute}?gameId=${gameId.value}`
})

const isRouteCorrect = computed(() => {
  if (!isTemplateGame.value) return true

  return form.route === suggestedTemplateRoute.value
})

const prizeCount = computed(() => {
  return game.value?.prizes?.length || 0
})

const totalWeight = computed(() => {
  return (game.value?.prizes || []).reduce((sum, prize) => {
    return sum + Number(prize.weight || 0)
  }, 0)
})

const totalQuantity = computed(() => {
  return (game.value?.prizes || []).reduce((sum, prize) => {
    return sum + Number(prize.quantity || 0)
  }, 0)
})

const statCards = computed(() => {
  return [
    {
      title: '獎項數量',
      value: prizeCount.value,
      description: '目前此遊戲設定的獎項總數',
      icon: '🎁',
      colorClass: 'from-blue-500 to-cyan-400'
    },
    {
      title: '總權重',
      value: totalWeight.value,
      description: '所有獎項權重加總',
      icon: '⚖️',
      colorClass: 'from-amber-500 to-orange-400'
    },
    {
      title: '總庫存',
      value: totalQuantity.value,
      description: '所有獎項可發放數量加總',
      icon: '📦',
      colorClass: 'from-emerald-500 to-teal-400'
    }
  ]
})

const loadForm = () => {
  if (!game.value) return

  form.templateId = game.value.templateId || ''
  form.name = game.value.name || ''
  form.description = game.value.description || ''
  form.route = game.value.route || ''
  form.icon = game.value.icon || ''
  form.type = game.value.type || 'lottery'
  form.status = game.value.status || 'enabled'
  form.playLimit = Number(game.value.playLimit || 1)
  form.probabilityMode = game.value.probabilityMode || 'weight'
  form.requiredInviteCount = Number(game.value.requiredInviteCount || 0)

  savedMessage.value = ''
}

watch(
  game,
  () => {
    loadForm()
  },
  {
    immediate: true
  }
)

const goBack = () => {
  router.push('/admin/game-settings')
}

const goPrizeSettings = () => {
  router.push(`/admin/game-settings/${gameId.value}/prizes`)
}

const goProbabilitySettings = () => {
  router.push(`/admin/game-settings/${gameId.value}/probability`)
}

const previewGame = () => {
  if (!form.route) return

  router.push(form.route)
}

const fixTemplateRoute = () => {
  if (!suggestedTemplateRoute.value) return

  form.route = suggestedTemplateRoute.value
  savedMessage.value = '已自動修正前台路徑，請記得按「儲存設定」。'
}

const saveForm = () => {
  const updatedGame = updateGameSetting(gameId.value, {
    templateId: form.templateId,
    name: form.name,
    description: form.description,
    route: form.route,
    icon: form.icon,
    type: form.type,
    status: form.status,
    playLimit: form.playLimit,
    probabilityMode: form.probabilityMode,
    requiredInviteCount: form.requiredInviteCount
  })

  if (!updatedGame) {
    savedMessage.value = '儲存失敗，找不到遊戲設定。'
    return
  }

  savedMessage.value = '設定已儲存到 localStorage，前台會同步讀取最新設定。'

  setTimeout(() => {
    savedMessage.value = ''
  }, 2500)
}
</script>

<template>
  <div class="space-y-8">
    <section
      v-if="game"
      class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <button
            type="button"
            class="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-200"
            @click="goBack"
          >
            ← 返回遊戲設定
          </button>

          <div class="mt-5 inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-600">
            Admin Game Edit
          </div>

          <h1 class="mt-4 flex items-center gap-3 text-3xl font-black text-slate-900">
            <span>{{ game.icon }}</span>
            <span>{{ game.name }}｜編輯設定</span>
          </h1>

          <p class="mt-2 text-sm leading-6 text-slate-500">
            編輯遊戲名稱、說明、狀態、前台路徑、遊玩限制與機率模式。
          </p>

          <p class="mt-2 text-xs font-bold text-slate-400">
            遊戲 ID：{{ gameId }}
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <button
            type="button"
            class="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            @click="previewGame"
          >
            預覽前台
          </button>

          <button
            type="button"
            class="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black text-blue-600 transition hover:bg-blue-100"
            @click="goPrizeSettings"
          >
            獎項設定
          </button>

          <button
            type="button"
            class="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-black text-amber-600 transition hover:bg-amber-100"
            @click="goProbabilitySettings"
          >
            機率設定
          </button>
        </div>
      </div>
    </section>

    <BaseEmptyState
      v-else
      icon="🎮"
      title="找不到遊戲設定"
      description="請確認網址中的 gameId 是否正確。"
    />

    <template v-if="game">
      <section
        v-if="savedMessage"
        class="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-black text-emerald-700"
      >
        {{ savedMessage }}
      </section>

      <section
        v-if="isTemplateGame"
        class="rounded-3xl border p-5 shadow-sm"
        :class="isRouteCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'"
      >
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div
              class="inline-flex rounded-full px-4 py-2 text-sm font-black"
              :class="isRouteCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'"
            >
              Template Game Route Check
            </div>

            <h2
              class="mt-4 text-xl font-black"
              :class="isRouteCorrect ? 'text-emerald-900' : 'text-amber-900'"
            >
              模板遊戲前台路徑檢查
            </h2>

            <p
              class="mt-2 text-sm leading-6"
              :class="isRouteCorrect ? 'text-emerald-700' : 'text-amber-700'"
            >
              這是模板遊戲，前台路徑需要帶上 gameId，前台才會顯示自訂活動名稱。
            </p>

            <div class="mt-4 grid gap-3">
              <div class="rounded-2xl bg-white/70 p-4">
                <p class="text-xs font-black text-slate-400">
                  目前路徑
                </p>

                <p class="mt-1 break-all text-sm font-black text-slate-800">
                  {{ form.route }}
                </p>
              </div>

              <div class="rounded-2xl bg-white/70 p-4">
                <p class="text-xs font-black text-slate-400">
                  建議路徑
                </p>

                <p class="mt-1 break-all text-sm font-black text-slate-800">
                  {{ suggestedTemplateRoute }}
                </p>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-3">
            <BaseBadge
              :text="isRouteCorrect ? '路徑正確' : '建議修正路徑'"
              :type="isRouteCorrect ? 'success' : 'warning'"
            />

            <button
              v-if="!isRouteCorrect"
              type="button"
              class="rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-white transition hover:bg-amber-600"
              @click="fixTemplateRoute"
            >
              一鍵修正前台路徑
            </button>
          </div>
        </div>
      </section>

      <section class="grid gap-4 md:grid-cols-3">
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
        <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="mb-6">
            <h2 class="text-xl font-black text-slate-900">
              基本設定
            </h2>

            <p class="mt-1 text-sm text-slate-400">
              這裡支援 localStorage 儲存，重新整理後仍會保留設定。
            </p>
          </div>

          <div class="grid gap-5">
            <div v-if="isTemplateGame">
              <label class="mb-2 block text-sm font-black text-slate-700">
                套用模板
              </label>

              <input
                v-model="form.templateId"
                type="text"
                disabled
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500 outline-none"
              />

              <p class="mt-2 text-xs text-slate-400">
                這個遊戲使用模板頁面，實際前台頁會依照 gameId 讀取自訂活動資料。
              </p>
            </div>

            <div>
              <label class="mb-2 block text-sm font-black text-slate-700">
                遊戲名稱
              </label>

              <input
                v-model="form.name"
                type="text"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="請輸入遊戲名稱"
              />
            </div>

            <div>
              <label class="mb-2 block text-sm font-black text-slate-700">
                遊戲說明
              </label>

              <textarea
                v-model="form.description"
                rows="4"
                class="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="請輸入遊戲說明"
              />
            </div>

            <div class="grid gap-5 md:grid-cols-2">
              <div>
                <label class="mb-2 block text-sm font-black text-slate-700">
                  遊戲圖示
                </label>

                <input
                  v-model="form.icon"
                  type="text"
                  class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  placeholder="例如 🎁"
                />
              </div>

              <div>
                <label class="mb-2 block text-sm font-black text-slate-700">
                  前台路徑
                </label>

                <input
                  v-model="form.route"
                  type="text"
                  class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  placeholder="/games/grid-lottery?gameId=summer-grid-2026"
                />
              </div>
            </div>

            <div class="grid gap-5 md:grid-cols-2">
              <div>
                <label class="mb-2 block text-sm font-black text-slate-700">
                  遊戲類型
                </label>

                <select
                  v-model="form.type"
                  class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                >
                  <option
                    v-for="option in typeOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </div>

              <div>
                <label class="mb-2 block text-sm font-black text-slate-700">
                  啟用狀態
                </label>

                <select
                  v-model="form.status"
                  class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                >
                  <option
                    v-for="option in statusOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </div>
            </div>

            <div class="grid gap-5 md:grid-cols-2">
              <div>
                <label class="mb-2 block text-sm font-black text-slate-700">
                  每位玩家可玩次數
                </label>

                <input
                  v-model.number="form.playLimit"
                  type="number"
                  min="1"
                  class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label class="mb-2 block text-sm font-black text-slate-700">
                  機率模式
                </label>

                <select
                  v-model="form.probabilityMode"
                  class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                >
                  <option
                    v-for="option in probabilityModeOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </div>
            </div>

            <div v-if="form.type === 'mission'">
              <label class="mb-2 block text-sm font-black text-slate-700">
                推薦任務邀請人數
              </label>

              <input
                v-model.number="form.requiredInviteCount"
                type="number"
                min="0"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div class="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              class="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
              @click="loadForm"
            >
              還原設定
            </button>

            <button
              v-if="isTemplateGame && !isRouteCorrect"
              type="button"
              class="rounded-2xl bg-amber-500 px-6 py-3 text-sm font-black text-white transition hover:bg-amber-600"
              @click="fixTemplateRoute"
            >
              一鍵修正路徑
            </button>

            <button
              type="button"
              class="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-700"
              @click="saveForm"
            >
              儲存設定
            </button>
          </div>
        </div>

        <aside class="space-y-5">
          <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="text-lg font-black text-slate-900">
              目前設定預覽
            </h2>

            <div class="mt-5 rounded-3xl bg-slate-50 p-5 text-center">
              <div class="text-5xl">
                {{ form.icon || '🎮' }}
              </div>

              <h3 class="mt-4 text-xl font-black text-slate-900">
                {{ form.name || '未命名遊戲' }}
              </h3>

              <p class="mt-2 text-sm leading-6 text-slate-500">
                {{ form.description || '尚未填寫說明' }}
              </p>
            </div>

            <div class="mt-5 space-y-4">
              <div
                v-if="isTemplateGame"
                class="flex items-center justify-between gap-3"
              >
                <span class="text-sm text-slate-500">模板 ID</span>
                <BaseBadge
                  :text="form.templateId"
                  type="info"
                />
              </div>

              <div class="flex items-center justify-between gap-3">
                <span class="text-sm text-slate-500">遊戲類型</span>
                <BaseBadge
                  :text="typeTextMap[form.type] || form.type"
                  :type="typeBadgeMap[form.type] || 'default'"
                />
              </div>

              <div class="flex items-center justify-between gap-3">
                <span class="text-sm text-slate-500">啟用狀態</span>
                <BaseBadge
                  :text="statusTextMap[form.status] || form.status"
                  :type="statusBadgeMap[form.status] || 'default'"
                />
              </div>

              <div class="flex items-center justify-between gap-3">
                <span class="text-sm text-slate-500">機率模式</span>
                <BaseBadge
                  :text="probabilityModeTextMap[form.probabilityMode] || form.probabilityMode"
                  type="warning"
                />
              </div>

              <div class="flex items-center justify-between gap-3">
                <span class="text-sm text-slate-500">遊玩限制</span>
                <span class="text-sm font-black text-slate-700">
                  {{ form.playLimit }} 次
                </span>
              </div>

              <div>
                <span class="text-sm text-slate-500">前台路徑</span>

                <p class="mt-2 break-all rounded-2xl bg-slate-50 p-3 text-sm font-black text-slate-700">
                  {{ form.route }}
                </p>
              </div>
            </div>
          </div>

          <div
            v-if="isTemplateGame"
            class="rounded-3xl border border-blue-200 bg-blue-50 p-6"
          >
            <h2 class="text-lg font-black text-blue-900">
              模板遊戲說明
            </h2>

            <div class="mt-4 space-y-3 text-sm leading-6 text-blue-800">
              <p>1. 這個遊戲會使用模板前台頁面。</p>
              <p>2. 網址需要帶 gameId 才會讀到自訂活動。</p>
              <p>3. 正確格式：模板路徑 + ?gameId=遊戲ID。</p>
              <p>4. 儲存後點「預覽前台」即可測試。</p>
            </div>
          </div>

          <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="text-lg font-black text-slate-900">
              目前儲存方式
            </h2>

            <div class="mt-4 space-y-3 text-sm leading-6 text-slate-500">
              <p>1. 目前資料會儲存在瀏覽器 localStorage。</p>
              <p>2. 重新整理後仍會保留設定。</p>
              <p>3. 前台遊戲頁會讀取這份設定。</p>
              <p>4. 之後可再改成 backend API + database。</p>
            </div>
          </div>
        </aside>
      </section>
    </template>
  </div>
</template>