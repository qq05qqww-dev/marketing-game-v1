<script setup>
/**
 * Multi Game Platform V2.3 第 354 批：共用 PlayBoard 顯示元件落地版
 *
 * 檔案位置：
 * frontend/src/components/common-game/CommonGamePlayBoard.vue
 *
 * 本批目的：
 * 1. 建立真正可重用的共用玩家頁 PlayBoard 顯示元件。
 * 2. 先給前台測試入口與後續正式玩家頁共用，不直接改正式頁、不改 router、不改 API、不改 DB。
 * 3. 讀取 commonGameModuleCore.js 的 normalize / validate / summary 工具。
 * 4. 顯示模板資訊、狀態、PlayBoard 設定、安全規則、欄位群組與測試 placeholder。
 */

import { computed } from 'vue'
import {
  COMMON_GAME_MODULE_VERSION,
  createDefaultCommonGameTemplate,
  normalizeCommonGameTemplate,
  validateCommonGameTemplate,
  buildCommonGameFrontSummaryCards,
  createCommonGameFormalSafeNote,
  getCommonGameModuleNextSteps
} from '../../config/commonGameModuleCore'

const props = defineProps({
  template: {
    type: Object,
    default: () => ({})
  },
  gameType: {
    type: String,
    default: 'GRID'
  },
  testMode: {
    type: Boolean,
    default: true
  },
  showDebug: {
    type: Boolean,
    default: false
  },
  showSafeRules: {
    type: Boolean,
    default: true
  },
  showNextSteps: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits([
  'play',
  'preview',
  'reset',
  'open-admin',
  'open-test'
])

const normalizedTemplate = computed(() => {
  const fallbackTemplate = createDefaultCommonGameTemplate(props.gameType)

  return normalizeCommonGameTemplate({
    ...fallbackTemplate,
    ...(props.template || {}),
    type: props.template?.type || props.gameType || fallbackTemplate.type
  })
})

const validationResult = computed(() => {
  return validateCommonGameTemplate(normalizedTemplate.value)
})

const summaryCards = computed(() => {
  return buildCommonGameFrontSummaryCards(normalizedTemplate.value)
})

const formalSafeNote = computed(() => {
  return createCommonGameFormalSafeNote(normalizedTemplate.value.type)
})

const nextSteps = computed(() => {
  return getCommonGameModuleNextSteps()
})

const statusLabel = computed(() => {
  const status = normalizedTemplate.value.status

  const map = {
    active: '已啟用',
    planned: '規劃中',
    testing: '測試中',
    disabled: '已停用'
  }

  return map[status] || status || '未設定'
})

const statusClass = computed(() => {
  const status = normalizedTemplate.value.status

  if (status === 'active') return 'border-emerald-300/40 bg-emerald-400/15 text-emerald-100'
  if (status === 'planned') return 'border-amber-300/40 bg-amber-400/15 text-amber-100'
  if (status === 'disabled') return 'border-rose-300/40 bg-rose-400/15 text-rose-100'

  return 'border-sky-300/40 bg-sky-400/15 text-sky-100'
})

const playBoardCards = computed(() => [
  {
    label: 'PlayBoard',
    value: normalizedTemplate.value.playBoardName || 'CommonGamePlayBoard',
    icon: '🧱'
  },
  {
    label: '測試模式',
    value: props.testMode ? '啟用' : '關閉',
    icon: '🧪'
  },
  {
    label: '正式頁保護',
    value: normalizedTemplate.value.playBoard?.formalUrlSafe ? '啟用' : '未啟用',
    icon: '🔒'
  },
  {
    label: '舊版 fallback',
    value: normalizedTemplate.value.playBoard?.legacyFallback ? '保留' : '未保留',
    icon: '🛡️'
  },
  {
    label: '動畫模式',
    value: normalizedTemplate.value.playBoard?.animationMode || 'safe',
    icon: '✨'
  },
  {
    label: '版面模式',
    value: normalizedTemplate.value.playBoard?.layoutMode || 'responsive',
    icon: '📱'
  }
])

const fieldGroupCards = computed(() => {
  return Object.values(normalizedTemplate.value.fieldGroups || {}).map((group) => ({
    key: group.key,
    label: group.label,
    icon: group.icon,
    count: Array.isArray(group.fields) ? group.fields.length : 0,
    fields: group.fields || []
  }))
})

const hasValidationMessages = computed(() => {
  return validationResult.value.errors.length > 0 || validationResult.value.warnings.length > 0
})

const handlePlay = () => {
  emit('play', normalizedTemplate.value)
}

const handlePreview = () => {
  emit('preview', normalizedTemplate.value)
}

const handleReset = () => {
  emit('reset', normalizedTemplate.value)
}

const handleOpenAdmin = () => {
  emit('open-admin', normalizedTemplate.value)
}

const handleOpenTest = () => {
  emit('open-test', normalizedTemplate.value)
}
</script>

<template>
  <section class="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 text-white shadow-2xl shadow-slate-950/30">
    <div class="relative">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.28),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.25),transparent_34%)]"></div>

      <div class="relative p-5 sm:p-7 lg:p-8">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black text-slate-100">
                {{ COMMON_GAME_MODULE_VERSION }}
              </span>
              <span
                class="rounded-full border px-3 py-1 text-xs font-black"
                :class="statusClass"
              >
                {{ statusLabel }}
              </span>
              <span
                v-if="testMode"
                class="rounded-full border border-fuchsia-300/40 bg-fuchsia-400/15 px-3 py-1 text-xs font-black text-fuchsia-100"
              >
                測試入口模式
              </span>
            </div>

            <h2 class="mt-4 text-3xl font-black leading-tight sm:text-4xl">
              {{ normalizedTemplate.icon }} {{ normalizedTemplate.label }}
            </h2>

            <p class="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              {{ normalizedTemplate.description }}
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-2xl bg-white px-4 py-2 text-sm font-black text-slate-950 shadow-lg shadow-white/10 transition hover:-translate-y-0.5"
              @click="handlePlay"
            >
              測試遊玩
            </button>
            <button
              type="button"
              class="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/15"
              @click="handlePreview"
            >
              預覽模板
            </button>
            <button
              type="button"
              class="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-black text-slate-200 transition hover:-translate-y-0.5 hover:bg-white/10"
              @click="handleReset"
            >
              重置
            </button>
          </div>
        </div>

        <div class="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div
            v-for="card in summaryCards"
            :key="card.label"
            class="rounded-2xl border border-white/10 bg-white/10 p-4"
          >
            <p class="text-2xl">{{ card.icon }}</p>
            <p class="mt-2 text-xs font-black text-slate-300">{{ card.label }}</p>
            <p class="mt-1 line-clamp-2 text-sm font-black text-white">{{ card.value }}</p>
          </div>
        </div>

        <div class="mt-6 rounded-[1.5rem] border border-white/10 bg-white/10 p-5">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.25em] text-sky-200">
                Common PlayBoard Placeholder
              </p>
              <h3 class="mt-2 text-2xl font-black">
                {{ normalizedTemplate.playBoardName || 'CommonGamePlayBoard' }}
              </h3>
              <p class="mt-2 text-sm leading-6 text-slate-300">
                這裡是共用 PlayBoard 的安全 placeholder。後續第 356 批會讓測試入口真正套用這個元件流程。
              </p>
            </div>

            <div class="grid h-28 w-full place-items-center rounded-[1.5rem] border border-dashed border-white/20 bg-slate-950/40 text-center lg:w-56">
              <div>
                <p class="text-4xl">{{ normalizedTemplate.icon }}</p>
                <p class="mt-1 text-xs font-black text-slate-300">共用遊戲顯示區</p>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 grid gap-4 lg:grid-cols-2">
          <div class="rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-5">
            <p class="font-black text-sky-200">PlayBoard 設定</p>
            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <div
                v-for="card in playBoardCards"
                :key="card.label"
                class="rounded-2xl border border-white/10 bg-white/10 p-4"
              >
                <p class="text-2xl">{{ card.icon }}</p>
                <p class="mt-2 text-xs font-black text-slate-300">{{ card.label }}</p>
                <p class="mt-1 text-sm font-black text-white">{{ card.value }}</p>
              </div>
            </div>
          </div>

          <div class="rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-5">
            <p class="font-black text-emerald-200">欄位群組</p>
            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <div
                v-for="group in fieldGroupCards"
                :key="group.key"
                class="rounded-2xl border border-white/10 bg-white/10 p-4"
              >
                <p class="text-2xl">{{ group.icon }}</p>
                <p class="mt-2 text-xs font-black text-slate-300">{{ group.label }}</p>
                <p class="mt-1 text-sm font-black text-white">{{ group.count }} 個欄位</p>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="hasValidationMessages"
          class="mt-6 grid gap-4 lg:grid-cols-2"
        >
          <div
            v-if="validationResult.errors.length"
            class="rounded-[1.5rem] border border-rose-300/20 bg-rose-400/10 p-5"
          >
            <p class="font-black text-rose-200">錯誤</p>
            <div class="mt-3 space-y-2">
              <p
                v-for="error in validationResult.errors"
                :key="error"
                class="rounded-2xl bg-slate-950/40 px-4 py-3 text-sm font-bold text-rose-100"
              >
                ❌ {{ error }}
              </p>
            </div>
          </div>

          <div
            v-if="validationResult.warnings.length"
            class="rounded-[1.5rem] border border-amber-300/20 bg-amber-400/10 p-5"
          >
            <p class="font-black text-amber-200">提醒</p>
            <div class="mt-3 space-y-2">
              <p
                v-for="warning in validationResult.warnings"
                :key="warning"
                class="rounded-2xl bg-slate-950/40 px-4 py-3 text-sm font-bold text-amber-100"
              >
                ⚠️ {{ warning }}
              </p>
            </div>
          </div>
        </div>

        <div
          v-if="showSafeRules"
          class="mt-6 rounded-[1.5rem] border border-emerald-300/20 bg-emerald-400/10 p-5"
        >
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p class="font-black text-emerald-200">{{ formalSafeNote.title }}</p>
              <p class="mt-1 text-sm leading-6 text-emerald-100">{{ formalSafeNote.message }}</p>
            </div>

            <div class="flex gap-2">
              <button
                type="button"
                class="rounded-2xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-xs font-black text-emerald-100"
                @click="handleOpenTest"
              >
                開測試入口
              </button>
              <button
                type="button"
                class="rounded-2xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-xs font-black text-emerald-100"
                @click="handleOpenAdmin"
              >
                開後台設定
              </button>
            </div>
          </div>

          <div class="mt-4 grid gap-2 md:grid-cols-2">
            <div
              v-for="rule in formalSafeNote.safeRules"
              :key="rule"
              class="rounded-2xl bg-slate-950/40 px-4 py-3 text-sm font-bold text-emerald-100"
            >
              ✅ {{ rule }}
            </div>
          </div>
        </div>

        <div
          v-if="showNextSteps"
          class="mt-6 rounded-[1.5rem] border border-white/10 bg-white/10 p-5"
        >
          <p class="font-black text-slate-100">後續批次方向</p>
          <div class="mt-4 grid gap-3 lg:grid-cols-2">
            <div
              v-for="step in nextSteps"
              :key="step.batch"
              class="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
            >
              <p class="text-xs font-black text-sky-200">{{ step.batch }}</p>
              <p class="mt-1 font-black text-white">{{ step.title }}</p>
              <p class="mt-1 text-sm leading-6 text-slate-300">{{ step.note }}</p>
              <p class="mt-2 text-xs font-bold text-slate-400">目標：{{ step.target }}</p>
            </div>
          </div>
        </div>

        <div
          v-if="showDebug"
          class="mt-6 rounded-[1.5rem] border border-white/10 bg-black/30 p-5"
        >
          <p class="font-black text-slate-200">Debug Template</p>
          <pre class="mt-3 max-h-80 overflow-auto rounded-2xl bg-black/40 p-4 text-xs leading-6 text-slate-300">{{ normalizedTemplate }}</pre>
        </div>
      </div>
    </div>
  </section>
</template>
