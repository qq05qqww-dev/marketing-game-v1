<script setup>
/**
 * Multi Game Platform V2.3 第 355 批：後台共用模板設定表單落地版
 *
 * 檔案位置：
 * frontend/src/components/common-game/CommonGameTemplateForm.vue
 *
 * 本批目的：
 * 1. 建立真正可重用的後台共用模板設定表單元件。
 * 2. 先提供純前端表單，不碰正式頁、不碰 router、不碰 API、不碰 DB。
 * 3. 搭配 commonGameModuleCore.js 使用 normalize / validate / createDefaultTemplate 工具。
 * 4. 後續可讓 AdminCommonGameEditorView.vue 套用此表單，逐步替代重複設定區塊。
 */

import { computed, reactive, watch } from 'vue'
import {
  COMMON_GAME_MODULE_VERSION,
  createDefaultCommonGameTemplate,
  normalizeCommonGameTemplate,
  validateCommonGameTemplate,
  getCommonGameTypeOptions,
  getCommonGameStatusOptions,
  getCommonGameFieldGroupList,
  getCommonGameSafeRules
} from '../../config/commonGameModuleCore'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  },
  gameType: {
    type: String,
    default: 'GRID'
  },
  compact: {
    type: Boolean,
    default: false
  },
  showValidation: {
    type: Boolean,
    default: true
  },
  showSafeRules: {
    type: Boolean,
    default: true
  },
  showRawPreview: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:modelValue',
  'change',
  'submit',
  'reset',
  'copy',
  'open-test'
])

const createInitialForm = () => {
  return normalizeCommonGameTemplate({
    ...createDefaultCommonGameTemplate(props.gameType),
    ...(props.modelValue || {})
  })
}

const form = reactive(createInitialForm())

const syncForm = (nextTemplate = {}) => {
  const normalized = normalizeCommonGameTemplate({
    ...createDefaultCommonGameTemplate(props.gameType),
    ...(nextTemplate || {})
  })

  Object.assign(form, normalized)
}

watch(
  () => props.modelValue,
  (nextValue) => {
    syncForm(nextValue)
  },
  { deep: true }
)

watch(
  () => props.gameType,
  () => {
    syncForm({
      ...form,
      type: props.gameType
    })
  }
)

const normalizedForm = computed(() => {
  return normalizeCommonGameTemplate(form)
})

const validationResult = computed(() => {
  return validateCommonGameTemplate(normalizedForm.value)
})

const gameTypeOptions = computed(() => {
  return getCommonGameTypeOptions()
})

const statusOptions = computed(() => {
  return getCommonGameStatusOptions()
})

const fieldGroups = computed(() => {
  return getCommonGameFieldGroupList()
})

const safeRules = computed(() => {
  return getCommonGameSafeRules()
})

const statusCards = computed(() => [
  {
    label: '模板 ID',
    value: normalizedForm.value.id,
    icon: '🆔'
  },
  {
    label: '遊戲類型',
    value: normalizedForm.value.type,
    icon: '🎮'
  },
  {
    label: '狀態',
    value: normalizedForm.value.status,
    icon: '✅'
  },
  {
    label: 'PlayBoard',
    value: normalizedForm.value.playBoardName,
    icon: '🧱'
  },
  {
    label: '正式頁保護',
    value: normalizedForm.value.playBoard?.formalUrlSafe ? '啟用' : '關閉',
    icon: '🔒'
  },
  {
    label: '驗證結果',
    value: validationResult.value.valid ? '通過' : '需修正',
    icon: validationResult.value.valid ? '✅' : '⚠️'
  }
])

const validationMessages = computed(() => {
  return [
    ...validationResult.value.errors.map((message) => ({
      type: 'error',
      icon: '❌',
      message
    })),
    ...validationResult.value.warnings.map((message) => ({
      type: 'warning',
      icon: '⚠️',
      message
    }))
  ]
})

const updateAndEmit = () => {
  const normalized = normalizeCommonGameTemplate(form)
  emit('update:modelValue', normalized)
  emit('change', normalized)
}

const handleBasicChange = () => {
  const normalized = normalizeCommonGameTemplate(form)
  Object.assign(form, normalized)
  updateAndEmit()
}

const handleSubmit = () => {
  const normalized = normalizeCommonGameTemplate(form)
  emit('update:modelValue', normalized)
  emit('submit', {
    template: normalized,
    validation: validateCommonGameTemplate(normalized)
  })
}

const handleReset = () => {
  const nextTemplate = createDefaultCommonGameTemplate(props.gameType)
  syncForm(nextTemplate)
  emit('update:modelValue', normalizeCommonGameTemplate(nextTemplate))
  emit('reset', normalizeCommonGameTemplate(nextTemplate))
}

const handleCopy = async () => {
  const normalized = normalizeCommonGameTemplate(form)
  const text = JSON.stringify(normalized, null, 2)

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    }
  } catch (error) {
    console.warn('Copy common game template failed:', error)
  }

  emit('copy', normalized)
}

const handleOpenTest = () => {
  emit('open-test', normalizeCommonGameTemplate(form))
}
</script>

<template>
  <section class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 sm:p-6 lg:p-8">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <p class="text-sm font-black uppercase tracking-[0.25em] text-orange-500">
          Common Game Template Form
        </p>
        <h2 class="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
          後台共用模板設定表單
        </h2>
        <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          {{ COMMON_GAME_MODULE_VERSION }}。此元件負責共用模板的基本設定、視覺設定、PlayBoard 設定、前台顯示設定與安全規則。
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5"
          @click="handleSubmit"
        >
          套用設定
        </button>
        <button
          type="button"
          class="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
          @click="handleCopy"
        >
          複製 JSON
        </button>
        <button
          type="button"
          class="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
          @click="handleReset"
        >
          還原預設
        </button>
      </div>
    </div>

    <div class="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
      <div
        v-for="card in statusCards"
        :key="card.label"
        class="rounded-2xl border border-slate-100 bg-slate-50 p-4"
      >
        <p class="text-2xl">{{ card.icon }}</p>
        <p class="mt-2 text-xs font-black text-slate-500">{{ card.label }}</p>
        <p class="mt-1 line-clamp-2 text-sm font-black text-slate-950">{{ card.value }}</p>
      </div>
    </div>

    <div class="mt-6 grid gap-5 lg:grid-cols-2">
      <div class="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
        <p class="font-black text-slate-950">基本設定</p>

        <div class="mt-4 space-y-4">
          <label class="block">
            <span class="text-xs font-black text-slate-500">模板 ID</span>
            <input
              v-model="form.id"
              class="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              placeholder="common-grid-template"
              @input="updateAndEmit"
            />
          </label>

          <label class="block">
            <span class="text-xs font-black text-slate-500">模板名稱</span>
            <input
              v-model="form.label"
              class="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              placeholder="精緻九宮格"
              @input="updateAndEmit"
            />
          </label>

          <label class="block">
            <span class="text-xs font-black text-slate-500">說明</span>
            <textarea
              v-model="form.description"
              rows="4"
              class="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold leading-6 text-slate-800 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              placeholder="模板說明"
              @input="updateAndEmit"
            ></textarea>
          </label>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="text-xs font-black text-slate-500">遊戲類型</span>
              <select
                v-model="form.type"
                class="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                @change="handleBasicChange"
              >
                <option
                  v-for="option in gameTypeOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.icon }} {{ option.label }}｜{{ option.value }}
                </option>
              </select>
            </label>

            <label class="block">
              <span class="text-xs font-black text-slate-500">模板狀態</span>
              <select
                v-model="form.status"
                class="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                @change="updateAndEmit"
              >
                <option
                  v-for="option in statusOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.icon }} {{ option.label }}
                </option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <div class="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
        <p class="font-black text-slate-950">視覺設定</p>

        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="text-xs font-black text-slate-500">主題色</span>
            <input
              v-model="form.theme.themeColor"
              type="color"
              class="mt-1 h-12 w-full rounded-2xl border border-slate-200 bg-white p-2"
              @input="updateAndEmit"
            />
          </label>

          <label class="block">
            <span class="text-xs font-black text-slate-500">強調色</span>
            <input
              v-model="form.theme.accentColor"
              type="color"
              class="mt-1 h-12 w-full rounded-2xl border border-slate-200 bg-white p-2"
              @input="updateAndEmit"
            />
          </label>

          <label class="block">
            <span class="text-xs font-black text-slate-500">背景樣式</span>
            <input
              v-model="form.theme.backgroundStyle"
              class="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              @input="updateAndEmit"
            />
          </label>

          <label class="block">
            <span class="text-xs font-black text-slate-500">卡片樣式</span>
            <input
              v-model="form.theme.cardStyle"
              class="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              @input="updateAndEmit"
            />
          </label>
        </div>

        <div class="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
          <p class="text-xs font-black text-slate-500">視覺預覽</p>
          <div
            class="mt-3 rounded-2xl p-4 text-white"
            :style="{ background: `linear-gradient(135deg, ${form.theme.themeColor}, ${form.theme.accentColor})` }"
          >
            <p class="text-2xl">{{ form.icon || '🧩' }}</p>
            <p class="mt-2 font-black">{{ form.label }}</p>
            <p class="mt-1 text-sm opacity-80">{{ form.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-6 grid gap-5 lg:grid-cols-2">
      <div class="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
        <p class="font-black text-slate-950">PlayBoard 設定</p>

        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <label class="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700">
            <input v-model="form.playBoard.enabled" type="checkbox" @change="updateAndEmit" />
            啟用 PlayBoard
          </label>
          <label class="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700">
            <input v-model="form.playBoard.testOnly" type="checkbox" @change="updateAndEmit" />
            測試模式
          </label>
          <label class="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700">
            <input v-model="form.playBoard.formalUrlSafe" type="checkbox" @change="updateAndEmit" />
            正式頁保護
          </label>
          <label class="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700">
            <input v-model="form.playBoard.legacyFallback" type="checkbox" @change="updateAndEmit" />
            舊版 fallback
          </label>
          <label class="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700">
            <input v-model="form.playBoard.showResultPanel" type="checkbox" @change="updateAndEmit" />
            結果區
          </label>
          <label class="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700">
            <input v-model="form.playBoard.showDebugPanel" type="checkbox" @change="updateAndEmit" />
            Debug 面板
          </label>
        </div>

        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="text-xs font-black text-slate-500">動畫模式</span>
            <input
              v-model="form.playBoard.animationMode"
              class="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              @input="updateAndEmit"
            />
          </label>

          <label class="block">
            <span class="text-xs font-black text-slate-500">版面模式</span>
            <input
              v-model="form.playBoard.layoutMode"
              class="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              @input="updateAndEmit"
            />
          </label>
        </div>
      </div>

      <div class="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
        <p class="font-black text-slate-950">前台顯示設定</p>

        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <label class="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700">
            <input v-model="form.front.showCampaignHeader" type="checkbox" @change="updateAndEmit" />
            活動標題
          </label>
          <label class="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700">
            <input v-model="form.front.showGameBoard" type="checkbox" @change="updateAndEmit" />
            遊戲主區
          </label>
          <label class="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700">
            <input v-model="form.front.showPrizeHint" type="checkbox" @change="updateAndEmit" />
            獎品提示
          </label>
          <label class="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700">
            <input v-model="form.front.showPlayCount" type="checkbox" @change="updateAndEmit" />
            次數顯示
          </label>
          <label class="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700">
            <input v-model="form.front.showResultModal" type="checkbox" @change="updateAndEmit" />
            結果彈窗
          </label>
          <label class="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700">
            <input v-model="form.front.showSafeFallback" type="checkbox" @change="updateAndEmit" />
            安全 fallback
          </label>
        </div>

        <button
          type="button"
          class="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100"
          @click="handleOpenTest"
        >
          開啟前台測試入口
        </button>
      </div>
    </div>

    <div class="mt-6 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
      <p class="font-black text-slate-950">欄位分類</p>
      <div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div
          v-for="group in fieldGroups"
          :key="group.key"
          class="rounded-2xl border border-slate-100 bg-white p-4"
        >
          <p class="text-2xl">{{ group.icon }}</p>
          <p class="mt-2 text-sm font-black text-slate-950">{{ group.label }}</p>
          <p class="mt-1 text-xs font-bold text-slate-500">{{ group.fields.length }} 個欄位</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <span
              v-for="field in group.fields"
              :key="field"
              class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600"
            >
              {{ field }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showValidation"
      class="mt-6 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5"
    >
      <p class="font-black text-slate-950">驗證結果</p>

      <div
        v-if="validationMessages.length"
        class="mt-4 space-y-2"
      >
        <div
          v-for="item in validationMessages"
          :key="item.message"
          class="rounded-2xl px-4 py-3 text-sm font-bold"
          :class="item.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'"
        >
          {{ item.icon }} {{ item.message }}
        </div>
      </div>

      <div
        v-else
        class="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700"
      >
        ✅ 目前模板驗證通過
      </div>
    </div>

    <div
      v-if="showSafeRules"
      class="mt-6 rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5"
    >
      <p class="font-black text-emerald-700">正式頁安全規則</p>
      <div class="mt-4 grid gap-2 md:grid-cols-2">
        <div
          v-for="rule in safeRules"
          :key="rule"
          class="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700"
        >
          ✅ {{ rule }}
        </div>
      </div>
    </div>

    <div
      v-if="showRawPreview"
      class="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5"
    >
      <p class="font-black text-white">Raw Template Preview</p>
      <pre class="mt-4 max-h-96 overflow-auto rounded-2xl bg-black/40 p-4 text-xs leading-6 text-slate-300">{{ normalizedForm }}</pre>
    </div>
  </section>
</template>
