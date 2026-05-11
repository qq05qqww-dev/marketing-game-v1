<!--
  Multi Game Platform V2.3
  第 77201～77600 批：遊戲模板中心模板模組按鈕正式導頁修正版

  覆蓋位置：
  frontend/src/views/admin/AdminGameSettingsView.vue

  本批重點：
  1. 修正「模板模組設定」按鈕點擊後停在原地的問題。
  2. 遊戲模板中心所有玩家版、管理版、模板模組設定入口改用正式 marketing-game-v1 網址導頁。
  3. 輪盤、九宮格、金蛋三張卡片的模板模組入口保留統一命名。
  4. 不改 DB / router / draw-core。
-->
<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseBadge from '../../components/common/BaseBadge.vue'
import BaseEmptyState from '../../components/common/BaseEmptyState.vue'
import BaseSearchInput from '../../components/common/BaseSearchInput.vue'
import { useAdminGameSettings } from '../../composables/useAdminGameSettings'

const router = useRouter()

const {
  gameSettings,
  getGameSettingSummary,
  resetGameSettings,
  fixAllGameRoutes
} = useAdminGameSettings()

const keyword = ref('')
const activeTemplateVisibility = ref('official')
const savedMessage = ref('')

const OFFICIAL_FRONTEND_ORIGIN = 'https://marketing-game-v1.vercel.app'

const normalizeText = (value = '') => String(value || '').trim().toLowerCase()

const officialTemplateOrder = ['premium-grid', 'wheel', 'golden-egg']

const templateAliasMap = {
  'grid-lottery': 'premium-grid',
  'premium-nine-grid': 'premium-grid',
  'egg-smash': 'golden-egg',
  'golden-egg-deluxe': 'golden-egg',
  wheel: 'wheel',
  'premium-grid': 'premium-grid',
  'golden-egg': 'golden-egg'
}

const normalizeTemplateId = (value = '') => {
  const raw = String(value || '').trim()
  return templateAliasMap[raw] || raw
}

const officialTemplateMeta = {
  'premium-grid': {
    id: 'premium-grid',
    icon: '✨',
    title: '精緻九宮格',
    subtitle: '九宮格互動抽獎模板',
    type: 'GRID',
    badge: '正式模板',
    playerPath: '/games/premium-grid',
    adminPath: '/games/premium-grid?mode=admin',
    modulePath: '/admin/premium-grid-settings/template?templateMode=1&templateOnly=1&gameId=premium-grid&playerUrl=/games/premium-grid',
    prizePath: '/admin/game-settings/premium-grid/prizes',
    probabilityPath: '/admin/game-settings/premium-grid/probability',
    description: '平台總管理員維護九宮格模板；商家建立新九宮格活動時可作為預設外觀來源。',
    accentClass: 'from-emerald-50 to-teal-50 border-emerald-100 text-emerald-900',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-700'
  },
  wheel: {
    id: 'wheel',
    icon: '🎡',
    title: '幸運輪盤',
    subtitle: '實體活動感輪盤模板',
    type: 'WHEEL',
    badge: '正式模板',
    playerPath: '/games/wheel',
    adminPath: '/games/wheel?mode=admin',
    modulePath: '/admin/wheel-settings/template?templateMode=1&templateOnly=1&gameId=wheel&playerUrl=/games/wheel',
    prizePath: '/admin/game-settings/wheel/prizes',
    probabilityPath: '/admin/game-settings/wheel/probability',
    description: '平台總管理員維護輪盤模板；本入口會進入輪盤模組視覺設定，不會直接改既有商家活動。',
    accentClass: 'from-orange-50 to-amber-50 border-orange-100 text-orange-900',
    buttonClass: 'bg-slate-950 hover:bg-orange-700'
  },
  'golden-egg': {
    id: 'golden-egg',
    icon: '🥚',
    title: '敲金蛋',
    subtitle: '金蛋互動抽獎模板',
    type: 'GOLDEN_EGG',
    badge: '正式模板',
    playerPath: '/games/golden-egg',
    adminPath: '/games/golden-egg?mode=admin',
    modulePath: '/admin/golden-egg?templateMode=1&templateOnly=1&gameId=golden-egg&playerUrl=/games/golden-egg',
    prizePath: '/admin/game-settings/golden-egg/prizes',
    probabilityPath: '/admin/game-settings/golden-egg/probability',
    description: '平台總管理員維護金蛋模板；入口文字已和輪盤、九宮格統一為模板模組設定。',
    accentClass: 'from-yellow-50 to-amber-50 border-yellow-100 text-yellow-900',
    buttonClass: 'bg-amber-600 hover:bg-amber-700'
  }
}

const reservedTemplates = [
  {
    id: 'scratch-card',
    icon: '🎫',
    title: '刮刮卡',
    subtitle: '平台預留模組',
    type: 'SCRATCH',
    badge: '預留',
    playerPath: '/games/scratch-card',
    adminPath: '/games/scratch-card?mode=admin',
    description: '尚未列入目前三個正式商家模板。'
  },
  {
    id: 'flip-card',
    icon: '🃏',
    title: '翻牌遊戲',
    subtitle: '平台預留模組',
    type: 'FLIP',
    badge: '預留',
    playerPath: '/games/flip-card',
    adminPath: '/games/flip-card?mode=admin',
    description: '尚未列入目前三個正式商家模板。'
  },
  {
    id: 'slot-machine',
    icon: '🎰',
    title: '拉霸機',
    subtitle: '平台預留模組',
    type: 'SLOT',
    badge: '預留',
    playerPath: '/games/slot-machine',
    adminPath: '/games/slot-machine?mode=admin',
    description: '尚未列入目前三個正式商家模板。'
  }
]

const officialTemplates = computed(() => {
  const fromStorage = Array.isArray(gameSettings.value) ? gameSettings.value : []

  return officialTemplateOrder.map((id) => {
    const raw = fromStorage.find((item) => normalizeTemplateId(item.id || item.templateId) === id) || {}
    const meta = officialTemplateMeta[id]

    return {
      ...meta,
      rawId: raw.id || id,
      status: raw.status || 'enabled',
      route: meta.playerPath,
      prizeCount: Array.isArray(raw.prizes) ? raw.prizes.length : 0,
      weightTotal: Array.isArray(raw.prizes)
        ? raw.prizes.reduce((sum, prize) => sum + Number(prize.weight || prize.probability || 0), 0)
        : 0
    }
  })
})

const templateVisibilityTabs = [
  {
    label: '正式三遊戲',
    value: 'official',
    icon: '✅',
    description: '輪盤、九宮格、金蛋三個模板入口完全統一。'
  },
  {
    label: '平台預留',
    value: 'reserved',
    icon: '🧩',
    description: '保留未正式交付給商家的遊戲模板。'
  },
  {
    label: '全部',
    value: 'all',
    icon: '🗂️',
    description: '同時顯示正式模板與平台預留模板。'
  }
]

const filteredTemplates = computed(() => {
  const key = normalizeText(keyword.value)
  const source = activeTemplateVisibility.value === 'official'
    ? officialTemplates.value
    : activeTemplateVisibility.value === 'reserved'
      ? reservedTemplates
      : [...officialTemplates.value, ...reservedTemplates]

  if (!key) return source

  return source.filter((item) => {
    return [item.id, item.title, item.subtitle, item.type, item.description]
      .map(normalizeText)
      .some((text) => text.includes(key))
  })
})

const officialSummary = computed(() => {
  const summary = typeof getGameSettingSummary === 'function' ? getGameSettingSummary() : {}

  return {
    officialCount: officialTemplates.value.length,
    totalCount: summary?.total || gameSettings.value?.length || officialTemplates.value.length,
    enabledCount: officialTemplates.value.filter((item) => item.status !== 'disabled').length
  }
})

const buildOfficialUrl = (path = '') => {
  const value = String(path || '').trim()
  if (!value) return OFFICIAL_FRONTEND_ORIGIN
  if (/^https?:\/\//i.test(value)) return value
  return `${OFFICIAL_FRONTEND_ORIGIN}${value.startsWith('/') ? value : `/${value}`}`
}

const openPath = (path = '') => {
  // 第 77201～77600 批：遊戲模板中心按鈕不再使用 router.push，
  // 避免目前在 localhost 或同一路由時看起來停在原地。
  // 全部正式導向 marketing-game-v1 Vercel 網址。
  if (!path) return
  window.location.href = buildOfficialUrl(path)
}

const openExternalOfficialPath = (path = '') => {
  if (!path) return
  window.open(buildOfficialUrl(path), '_blank', 'noopener,noreferrer')
}

const copyText = async (text = '', message = '已複製') => {
  const value = String(text || '').trim()
  if (!value) return

  try {
    await navigator.clipboard.writeText(value)
    savedMessage.value = message
  } catch (error) {
    window.prompt('請手動複製：', value)
  }
}

const copyOfficialUrl = (path = '', label = '網址') => {
  copyText(buildOfficialUrl(path), `已複製${label}`)
}

const resetTemplateCenter = () => {
  const confirmed = window.confirm('確定要還原遊戲模板中心資料嗎？這只會還原模板中心清單，不會修改商家既有活動。')
  if (!confirmed) return

  if (typeof resetGameSettings === 'function') {
    resetGameSettings()
  }

  savedMessage.value = '已還原模板中心資料。'
}

const fixTemplateRoutes = () => {
  if (typeof fixAllGameRoutes === 'function') {
    fixAllGameRoutes()
  }

  savedMessage.value = '已整理模板路徑：輪盤 / 九宮格 / 金蛋入口已統一。'
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
    <div class="mx-auto max-w-7xl space-y-6">
      <section class="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div class="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div class="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6 text-white sm:p-8">
            <p class="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-100">
              Game Template Center｜第 76801～77200 批
            </p>

            <h1 class="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
              遊戲模板中心
            </h1>

            <p class="mt-4 max-w-3xl text-sm font-bold leading-7 text-white/75">
              這裡是平台總管理員維護「平台模板 / 模組」的地方。輪盤、九宮格、金蛋現在統一都有「模板模組設定」入口；這裡不是商家既有活動設定，不會直接覆蓋商家正式玩家頁。
            </p>

            <div class="mt-6 grid gap-3 sm:grid-cols-3">
              <div class="rounded-3xl bg-white/10 p-4">
                <p class="text-xs font-black text-white/50">正式模板</p>
                <p class="mt-2 text-3xl font-black">{{ officialSummary.officialCount }}</p>
              </div>
              <div class="rounded-3xl bg-white/10 p-4">
                <p class="text-xs font-black text-white/50">啟用模板</p>
                <p class="mt-2 text-3xl font-black">{{ officialSummary.enabledCount }}</p>
              </div>
              <div class="rounded-3xl bg-white/10 p-4">
                <p class="text-xs font-black text-white/50">資料總數</p>
                <p class="mt-2 text-3xl font-black">{{ officialSummary.totalCount }}</p>
              </div>
            </div>
          </div>

          <div class="grid content-center gap-4 bg-gradient-to-br from-white to-indigo-50 p-6 sm:p-8">
            <article class="rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
              <p class="text-sm font-black text-emerald-900">
                三遊戲入口已統一
              </p>
              <p class="mt-2 text-xs font-bold leading-6 text-emerald-700">
                輪盤、九宮格、金蛋都會顯示「模板模組設定」。以後平台管理員從這裡編輯模板，商家建立新活動時才套用模板預設。
              </p>
            </article>

            <article class="rounded-3xl border border-amber-100 bg-amber-50 p-5">
              <p class="text-sm font-black text-amber-900">
                重要分流
              </p>
              <p class="mt-2 text-xs font-bold leading-6 text-amber-700">
                平台模板中心 ≠ 商家活動設定。已建立的商家活動請到「我的活動」進入設定，不要在模板中心直接當成正式活動修改。
              </p>
            </article>
          </div>
        </div>
      </section>

      <section
        v-if="savedMessage"
        class="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-700"
      >
        {{ savedMessage }}
      </section>

      <section class="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div class="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.22em] text-indigo-500">
              Template Filter
            </p>
            <h2 class="mt-2 text-2xl font-black text-slate-950">
              模板分類
            </h2>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              v-for="tab in templateVisibilityTabs"
              :key="tab.value"
              type="button"
              class="rounded-2xl px-4 py-3 text-sm font-black transition"
              :class="activeTemplateVisibility === tab.value
                ? 'bg-slate-950 text-white shadow-lg'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              "
              @click="activeTemplateVisibility = tab.value"
            >
              {{ tab.icon }} {{ tab.label }}
            </button>
          </div>
        </div>

        <div class="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
          <BaseSearchInput
            v-model="keyword"
            placeholder="搜尋輪盤、九宮格、金蛋、模板名稱..."
          />

          <button
            type="button"
            class="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
            @click="fixTemplateRoutes"
          >
            批次整理入口
          </button>

          <button
            type="button"
            class="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            @click="resetTemplateCenter"
          >
            還原預設
          </button>
        </div>
      </section>

      <section v-if="filteredTemplates.length" class="grid gap-5 xl:grid-cols-2">
        <article
          v-for="game in filteredTemplates"
          :key="game.id"
          class="overflow-hidden rounded-[32px] border bg-white shadow-sm"
          :class="game.accentClass || 'border-slate-200'"
        >
          <div class="bg-gradient-to-br p-5 sm:p-6" :class="game.accentClass || 'from-slate-50 to-white text-slate-900'">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div class="flex items-start gap-4">
                <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white/80 text-3xl shadow-sm">
                  {{ game.icon }}
                </div>

                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="text-2xl font-black text-slate-950">
                      {{ game.title }}
                    </h3>
                    <BaseBadge :text="game.badge" type="success" />
                  </div>

                  <p class="mt-1 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                    {{ game.id }}｜{{ game.type }}
                  </p>

                  <p class="mt-3 max-w-xl text-sm font-bold leading-7 text-slate-600">
                    {{ game.description }}
                  </p>
                </div>
              </div>
            </div>

            <div class="mt-5 grid gap-3 rounded-3xl border border-white/70 bg-white/65 p-4 text-xs font-bold leading-6 text-slate-600 sm:grid-cols-2">
              <div>
                <p class="font-black text-slate-900">玩家版路徑</p>
                <p class="mt-1 break-all font-mono text-[11px]">{{ game.playerPath }}</p>
              </div>
              <div>
                <p class="font-black text-slate-900">管理版路徑</p>
                <p class="mt-1 break-all font-mono text-[11px]">{{ game.adminPath }}</p>
              </div>
            </div>
          </div>

          <div class="border-t border-slate-100 bg-white p-5 sm:p-6">
            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <button
                type="button"
                class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
                @click="openPath(game.playerPath)"
              >
                玩家版
              </button>

              <button
                type="button"
                class="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-4 text-sm font-black text-indigo-700 transition hover:bg-indigo-100"
                @click="openPath(game.adminPath)"
              >
                管理版
              </button>

              <button
                type="button"
                class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
                @click="copyOfficialUrl(game.playerPath, `${game.title}玩家網址`)"
              >
                複製網址
              </button>

              <button
                type="button"
                class="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 px-4 py-4 text-sm font-black text-fuchsia-700 transition hover:bg-fuchsia-100"
                @click="openExternalOfficialPath(game.playerPath)"
              >
                新分頁測試
              </button>

              <button
                type="button"
                class="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm font-black text-sky-700 transition hover:bg-sky-100"
                @click="openPath(game.prizePath || `/admin/game-settings/${game.id}/prizes`)"
              >
                獎項設定
              </button>

              <button
                type="button"
                class="rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-4 text-sm font-black text-yellow-700 transition hover:bg-yellow-100"
                @click="openPath(game.probabilityPath || `/admin/game-settings/${game.id}/probability`)"
              >
                機率設定
              </button>

              <button
                type="button"
                class="rounded-2xl px-4 py-4 text-sm font-black text-white shadow-lg transition"
                :class="game.buttonClass || 'bg-slate-950 hover:bg-slate-800'"
                @click="openPath(game.modulePath || game.adminPath)"
              >
                模板模組設定
              </button>

              <button
                type="button"
                class="rounded-2xl bg-blue-600 px-4 py-4 text-sm font-black text-white shadow-lg transition hover:bg-blue-700"
                @click="openPath(game.playerPath)"
              >
                測試流程
              </button>
            </div>
          </div>
        </article>
      </section>

      <BaseEmptyState
        v-else
        title="找不到模板"
        description="請調整搜尋關鍵字或切換模板分類。"
      />
    </div>
  </div>
</template>
