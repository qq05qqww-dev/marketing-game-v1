<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getCampaignsApi } from '../../api/campaign'
import { getPrizeListApi } from '../../api/prize'
import WheelStylePreview from '../../components/admin/WheelStylePreview.vue'
import {
  defaultCampaignStyleConfig,
  getCampaignStyleConfig,
  saveCampaignStyleConfig,
  resetCampaignStyleConfig
} from '../../utils/campaignStyleStorage'

const router = useRouter()

const campaignOptions = ref([])
const allPrizes = ref([])
const selectedCampaignId = ref('')
const selectedCampaign = ref(null)
const loading = ref(false)
const prizeLoading = ref(false)
const saving = ref(false)
const saveMessage = ref('')
const activeTab = ref('appearance')

const styleForm = reactive(defaultCampaignStyleConfig())

const normalizePrizeRows = (raw) => {
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.data)) return raw.data
  if (Array.isArray(raw?.rows)) return raw.rows
  if (Array.isArray(raw?.items)) return raw.items
  return []
}

const loadStyle = (campaignId) => {
  const config = getCampaignStyleConfig(campaignId)
  Object.assign(styleForm, config)
}

const resetStyle = () => {
  if (!selectedCampaignId.value) return

  resetCampaignStyleConfig(selectedCampaignId.value)
  Object.assign(styleForm, defaultCampaignStyleConfig())
  saveMessage.value = '已重設為預設樣式'
}

const saveStyle = async () => {
  if (!selectedCampaignId.value) {
    alert('請先選擇活動')
    return
  }

  saving.value = true
  saveMessage.value = ''

  try {
    saveCampaignStyleConfig(selectedCampaignId.value, { ...styleForm })
    saveMessage.value = '樣式已儲存成功'
  } finally {
    saving.value = false
  }
}

const fetchCampaigns = async () => {
  try {
    const res = await getCampaignsApi()
    const rows = Array.isArray(res.data?.data) ? res.data.data : []
    campaignOptions.value = rows
  } catch (error) {
    campaignOptions.value = [
      { id: 'demo-1', title: '週年慶大轉盤' },
      { id: 'demo-2', title: '夏季翻牌活動' }
    ]
  }
}

const fetchPrizes = async () => {
  prizeLoading.value = true

  try {
    const res = await getPrizeListApi('')
    const rows = normalizePrizeRows(res.data)
    allPrizes.value = rows
  } catch (error) {
    allPrizes.value = []
  } finally {
    prizeLoading.value = false
  }
}

const initializePage = async () => {
  loading.value = true

  try {
    await Promise.all([fetchCampaigns(), fetchPrizes()])

    if (campaignOptions.value.length > 0) {
      selectedCampaignId.value = String(campaignOptions.value[0].id)
      selectedCampaign.value = campaignOptions.value[0]
      loadStyle(selectedCampaignId.value)
    }
  } finally {
    loading.value = false
  }
}

watch(selectedCampaignId, (newId) => {
  if (!newId) return

  selectedCampaign.value =
    campaignOptions.value.find(
      (item) => String(item.id) === String(newId)
    ) || null

  loadStyle(newId)
  saveMessage.value = ''
})

const selectedCampaignTitle = computed(() => {
  return selectedCampaign.value?.title || '週年慶大轉盤'
})

const selectedCampaignPrizes = computed(() => {
  return allPrizes.value.filter((item) => {
    const relationId =
      item.activityId ??
      item.campaignId ??
      item.eventId ??
      item.campaign?.id ??
      item.activity?.id

    return String(relationId) === String(selectedCampaignId.value)
  })
})

const refreshPrizeSync = async () => {
  await fetchPrizes()
  saveMessage.value = '已重新同步獎項資料'
}

const goPrizeAdmin = () => {
  router.push('/admin/prizes')
}

const fieldGroups = computed(() => {
  return {
    appearance: [
      {
        label: '轉盤背景色 1',
        key: 'wheelBg1',
        type: 'color'
      },
      {
        label: '轉盤背景色 2',
        key: 'wheelBg2',
        type: 'color'
      },
      {
        label: '外框顏色 1',
        key: 'outerBorder1',
        type: 'color'
      },
      {
        label: '外框顏色 2',
        key: 'outerBorder2',
        type: 'color'
      },
      {
        label: '指針顏色',
        key: 'pointerColor',
        type: 'color'
      },
      {
        label: '中心底色',
        key: 'centerBg',
        type: 'color'
      },
      {
        label: '中心文字顏色',
        key: 'centerTextColor',
        type: 'color'
      },
      {
        label: '獎項文字顏色',
        key: 'prizeTextColor',
        type: 'color'
      }
    ],
    text: [
      {
        label: '中心按鈕文字',
        key: 'buttonText',
        type: 'text',
        placeholder: '開始'
      },
      {
        label: '上方說明文字',
        key: 'descriptionText',
        type: 'text',
        placeholder: '立即登入抽驚喜好禮'
      },
      {
        label: '按鈕字體大小',
        key: 'buttonFontSize',
        type: 'number',
        min: 16,
        max: 48
      },
      {
        label: '說明字體大小',
        key: 'descriptionFontSize',
        type: 'number',
        min: 10,
        max: 24
      }
    ]
  }
})

onMounted(() => {
  initializePage()
})
</script>

<template>
  <div class="min-h-screen bg-slate-100 px-4 py-6">
    <div class="mx-auto max-w-[1440px] space-y-6">
      <div class="rounded-[30px] border border-slate-200 bg-white px-8 py-7 shadow-sm">
        <div class="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div class="text-sm font-medium text-slate-400">Admin Editor</div>
            <h1 class="mt-1 text-[42px] font-black tracking-tight text-slate-900">
              活動樣式編輯器 V2
            </h1>
            <div class="mt-2 text-[17px] leading-8 text-slate-500">
              後台可直接調整輪盤顏色、按鈕文字、說明文案，左側即時預覽。
            </div>
          </div>

          <div class="flex flex-wrap gap-3">
            <button
              type="button"
              @click="resetStyle"
              class="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-[16px] font-bold text-slate-700 transition hover:bg-slate-50"
            >
              重設預設值
            </button>

            <button
              type="button"
              @click="saveStyle"
              :disabled="saving"
              class="rounded-2xl bg-emerald-500 px-6 py-3 text-[16px] font-bold text-white transition hover:bg-emerald-600 disabled:opacity-60"
            >
              {{ saving ? '儲存中...' : '儲存樣式' }}
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-7 xl:grid-cols-[520px_1fr]">
        <!-- 左側預覽 -->
        <div class="rounded-[32px] border border-slate-200 bg-[#4a4a4a] p-7 shadow-sm">
          <div class="mb-5 text-[20px] font-black text-white">即時預覽</div>

          <div class="rounded-[28px] border border-white/10 bg-[#555555] p-6 shadow-inner">
            <WheelStylePreview
              :config="styleForm"
              :campaign-title="selectedCampaignTitle"
              :prizes="selectedCampaignPrizes"
            />
          </div>

          <div
            v-if="saveMessage"
            class="mt-5 rounded-2xl bg-emerald-500/15 px-4 py-4 text-[14px] font-medium text-emerald-300"
          >
            {{ saveMessage }}
          </div>

          <div class="mt-5 rounded-[20px] bg-white/6 px-5 py-4 text-[15px] text-white/85">
            目前預覽獎項數：{{ selectedCampaignPrizes.length }}
          </div>
        </div>

        <!-- 右側設定 -->
        <div class="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <!-- tabs -->
          <div class="border-b border-slate-200 px-8 pt-7">
            <div class="flex flex-wrap gap-3">
              <button
                type="button"
                @click="activeTab = 'appearance'"
                class="rounded-t-[18px] px-8 py-4 text-[16px] font-black transition"
                :class="
                  activeTab === 'appearance'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                "
              >
                外觀調整
              </button>

              <button
                type="button"
                @click="activeTab = 'text'"
                class="rounded-t-[18px] px-8 py-4 text-[16px] font-black transition"
                :class="
                  activeTab === 'text'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                "
              >
                文字設定
              </button>
            </div>
          </div>

          <div class="space-y-6 p-8">
            <!-- 活動選擇 -->
            <section class="rounded-[24px] border border-slate-200 bg-slate-50 px-6 py-6">
              <label class="mb-4 block text-[15px] font-bold text-slate-700">選擇活動</label>

              <select
                v-model="selectedCampaignId"
                class="w-full rounded-[18px] border border-slate-300 bg-white px-5 py-4 text-[16px] outline-none transition focus:border-emerald-500"
              >
                <option value="" disabled>請選擇活動</option>
                <option
                  v-for="item in campaignOptions"
                  :key="item.id"
                  :value="String(item.id)"
                >
                  {{ item.title }}
                </option>
              </select>

              <div v-if="loading" class="mt-3 text-sm text-slate-400">
                讀取活動中...
              </div>
            </section>

            <!-- 同步獎項 -->
            <section class="rounded-[24px] border border-slate-200 bg-slate-50 px-6 py-6">
              <div class="mb-4 text-[15px] font-bold text-slate-700">同步獎項預覽</div>

              <div v-if="prizeLoading" class="text-sm text-slate-400">
                獎項同步中...
              </div>

              <div
                v-else-if="selectedCampaignPrizes.length > 0"
                class="flex flex-wrap gap-3"
              >
                <span
                  v-for="item in selectedCampaignPrizes"
                  :key="item.id"
                  class="rounded-full border border-slate-300 bg-white px-4 py-2 text-[14px] text-slate-600"
                >
                  {{ item.title }}
                </span>
              </div>

              <div v-else class="text-sm text-slate-400">
                此活動目前尚無獎項
              </div>

              <div class="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  @click="refreshPrizeSync"
                  :disabled="prizeLoading"
                  class="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-[15px] font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                >
                  {{ prizeLoading ? '同步中...' : '同步獎項' }}
                </button>

                <button
                  type="button"
                  @click="goPrizeAdmin"
                  class="rounded-2xl border border-blue-300 bg-blue-50 px-5 py-3 text-[15px] font-bold text-blue-700 transition hover:bg-blue-100"
                >
                  編輯獎項
                </button>
              </div>
            </section>

            <!-- 外觀設定 -->
            <template v-if="activeTab === 'appearance'">
              <section class="rounded-[24px] border border-slate-200 bg-white px-6 py-6">
                <div class="mb-6 text-[18px] font-black text-slate-900">主外觀樣式</div>

                <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  <div
                    v-for="field in fieldGroups.appearance"
                    :key="field.key"
                    class="space-y-3"
                  >
                    <label class="block text-[15px] font-bold text-slate-700">
                      {{ field.label }}
                    </label>

                    <div class="flex items-center gap-3 rounded-[18px] border border-slate-300 bg-white px-3 py-3">
                      <input
                        v-model="styleForm[field.key]"
                        type="color"
                        class="h-12 w-full cursor-pointer rounded-xl border-0 bg-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div class="mt-7 rounded-[20px] border border-slate-200 bg-slate-50 px-5 py-4">
                  <label class="flex items-center gap-3 text-[15px] font-bold text-slate-700">
                    <input
                      v-model="styleForm.showTopDescription"
                      type="checkbox"
                      class="h-5 w-5 rounded border-slate-300"
                    />
                    顯示上方說明文字
                  </label>
                </div>
              </section>
            </template>

            <!-- 文字設定 -->
            <template v-else>
              <section class="rounded-[24px] border border-slate-200 bg-white px-6 py-6">
                <div class="mb-6 text-[18px] font-black text-slate-900">文字樣式</div>

                <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  <div
                    v-for="field in fieldGroups.text"
                    :key="field.key"
                    class="space-y-3"
                  >
                    <label class="block text-[15px] font-bold text-slate-700">
                      {{ field.label }}
                    </label>

                    <input
                      v-if="field.type === 'text'"
                      v-model="styleForm[field.key]"
                      :type="field.type"
                      :placeholder="field.placeholder"
                      class="w-full rounded-[18px] border border-slate-300 bg-white px-5 py-4 text-[16px] outline-none transition focus:border-emerald-500"
                    />

                    <input
                      v-else
                      v-model.number="styleForm[field.key]"
                      :type="field.type"
                      :min="field.min"
                      :max="field.max"
                      class="w-full rounded-[18px] border border-slate-300 bg-white px-5 py-4 text-[16px] outline-none transition focus:border-emerald-500"
                    />
                  </div>
                </div>
              </section>
            </template>

            <!-- bottom buttons -->
            <div class="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                @click="resetStyle"
                class="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-[16px] font-bold text-slate-700 transition hover:bg-slate-50"
              >
                取消 / 重設
              </button>

              <button
                type="button"
                @click="saveStyle"
                :disabled="saving"
                class="rounded-2xl bg-emerald-500 px-6 py-3 text-[16px] font-bold text-white transition hover:bg-emerald-600 disabled:opacity-60"
              >
                {{ saving ? '儲存中...' : '確定儲存' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>