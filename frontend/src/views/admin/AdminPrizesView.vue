<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  getAdminCampaignsApi,
  getCampaignPrizesApi,
  createPrizeApi,
  updatePrizeApi,
  deletePrizeApi
} from '../../api/campaign'

const loading = ref(false)
const submitting = ref(false)
const campaigns = ref([])
const prizes = ref([])
const editingPrizeId = ref(null)

const filters = reactive({
  keyword: '',
  campaignId: ''
})

const prizeForm = reactive({
  campaignId: '',
  title: '',
  remainStock: '',
  probability: ''
})

const quickPrizeTemplates = [
  {
    title: '銘謝惠顧',
    remainStock: 9999,
    probability: 40
  },
  {
    title: '再玩一次',
    remainStock: 9999,
    probability: 10
  },
  {
    title: '小獎',
    remainStock: 50,
    probability: 20
  },
  {
    title: '大獎',
    remainStock: 5,
    probability: 5
  }
]

const fetchCampaigns = async () => {
  try {
    const res = await getAdminCampaignsApi()
    campaigns.value = Array.isArray(res?.data?.data) ? res.data.data : []
  } catch (error) {
    console.error('取得活動清單失敗:', error)
    alert(error?.response?.data?.message || '取得活動清單失敗')
    campaigns.value = []
  }
}

const fetchPrizes = async () => {
  loading.value = true

  try {
    const res = await getCampaignPrizesApi({
      keyword: filters.keyword,
      campaignId: filters.campaignId
    })

    prizes.value = Array.isArray(res?.data?.data) ? res.data.data : []
  } catch (error) {
    console.error('取得獎項列表失敗:', error)
    alert(error?.response?.data?.message || '取得獎項列表失敗')
    prizes.value = []
  } finally {
    loading.value = false
  }
}

const resetPrizeForm = () => {
  prizeForm.campaignId = ''
  prizeForm.title = ''
  prizeForm.remainStock = ''
  prizeForm.probability = ''
  editingPrizeId.value = null
}

const applyTemplate = (template) => {
  prizeForm.title = template.title
  prizeForm.remainStock = template.remainStock
  prizeForm.probability = template.probability
}

const validateForm = () => {
  if (!prizeForm.campaignId) {
    alert('請先選擇活動')
    return false
  }

  if (!String(prizeForm.title || '').trim()) {
    alert('請輸入獎項名稱')
    return false
  }

  if (prizeForm.remainStock === '' || Number(prizeForm.remainStock) < 0) {
    alert('請輸入正確庫存，不能小於 0')
    return false
  }

  if (prizeForm.probability === '') {
    alert('請輸入中獎機率百分比')
    return false
  }

  const probability = Number(prizeForm.probability)

  if (!Number.isFinite(probability) || probability < 0 || probability > 100) {
    alert('中獎機率請輸入 0 到 100 之間的百分比')
    return false
  }

  return true
}

const submitPrize = async () => {
  if (!validateForm()) return

  submitting.value = true

  const payload = {
    campaignId: Number(prizeForm.campaignId),
    title: String(prizeForm.title || '').trim(),
    remainStock: Number(prizeForm.remainStock),
    probability: Number(prizeForm.probability)
  }

  try {
    if (editingPrizeId.value) {
      await updatePrizeApi(editingPrizeId.value, payload)
      alert('更新獎項成功')
    } else {
      await createPrizeApi(payload)
      alert('新增獎項成功')
    }

    resetPrizeForm()
    await fetchPrizes()
  } catch (error) {
    console.error('獎項操作失敗:', error)
    alert(error?.response?.data?.message || '獎項操作失敗')
  } finally {
    submitting.value = false
  }
}

const editPrize = (item) => {
  prizeForm.campaignId = item.campaignId || ''
  prizeForm.title = item.title || ''
  prizeForm.remainStock = item.remainStock ?? ''
  prizeForm.probability = item.probability ?? ''
  editingPrizeId.value = item.id

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

const deletePrize = async (item) => {
  const ok = window.confirm(
    `確定要刪除獎項「${item.title}」嗎？\n\n如果已有中獎紀錄，可能會影響報表與發獎資料。`
  )

  if (!ok) return

  try {
    await deletePrizeApi(item.id)
    alert('刪除獎項成功')

    if (editingPrizeId.value === item.id) {
      resetPrizeForm()
    }

    await fetchPrizes()
  } catch (error) {
    console.error('刪除獎項失敗:', error)
    alert(error?.response?.data?.message || '刪除獎項失敗')
  }
}

const resetSearch = async () => {
  filters.keyword = ''
  filters.campaignId = ''
  await fetchPrizes()
}

const getCampaignTitle = (campaignId) => {
  const campaign = campaigns.value.find((item) => String(item.id) === String(campaignId))
  return campaign?.title || '未指定活動'
}

const getPrizeType = (title) => {
  const text = String(title || '').trim()

  if (text === '銘謝惠顧' || text === '謝謝參加' || text === '未中獎' || text === '再接再厲') {
    return {
      label: '未中獎項',
      class: 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  if (text === '再玩一次') {
    return {
      label: '再玩一次',
      class: 'bg-sky-100 text-sky-700 border-sky-200'
    }
  }

  return {
    label: '實體 / 一般獎項',
    class: 'bg-emerald-100 text-emerald-700 border-emerald-200'
  }
}

const getStockPercent = (stock) => {
  const value = Number(stock || 0)

  if (value <= 0) return 0
  if (value >= 100) return 100

  return value
}

const getProbabilityPercent = (probability) => {
  const value = Number(probability || 0)

  if (value <= 0) return 0
  if (value >= 100) return 100

  return value
}

const getStockClass = (stock) => {
  const value = Number(stock || 0)

  if (value <= 0) return 'bg-rose-500'
  if (value <= 10) return 'bg-amber-500'

  return 'bg-emerald-500'
}

const getProbabilityClass = (probability) => {
  const value = Number(probability || 0)

  if (value <= 0) return 'bg-slate-400'
  if (value <= 10) return 'bg-blue-500'
  if (value <= 50) return 'bg-violet-500'

  return 'bg-fuchsia-500'
}

const formatPercent = (value) => {
  const n = Number(value || 0)

  if (!Number.isFinite(n)) {
    return '0%'
  }

  return `${Number(n.toFixed(2))}%`
}

const totalPrizes = computed(() => prizes.value.length)

const totalStock = computed(() => {
  return prizes.value.reduce((sum, item) => sum + Number(item.remainStock || 0), 0)
})

const totalProbability = computed(() => {
  return prizes.value.reduce((sum, item) => sum + Number(item.probability || 0), 0)
})

const noStockCount = computed(() => {
  return prizes.value.filter((item) => Number(item.remainStock || 0) <= 0).length
})

const loseProbability = computed(() => {
  const remain = 100 - Number(totalProbability.value || 0)
  return remain > 0 ? remain : 0
})

const probabilityWarningText = computed(() => {
  if (totalProbability.value < 100) {
    return `目前獎項機率合計 ${formatPercent(totalProbability.value)}，剩餘 ${formatPercent(loseProbability.value)} 會視為未中獎。`
  }

  if (totalProbability.value === 100) {
    return '目前獎項機率合計剛好 100%，沒有額外未中獎空間。'
  }

  return `目前獎項機率合計 ${formatPercent(totalProbability.value)}，已超過 100%，請調整各獎項百分比。`
})

const probabilityWarningClass = computed(() => {
  if (totalProbability.value < 100) {
    return 'border-blue-200 bg-blue-50 text-blue-700'
  }

  if (totalProbability.value === 100) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  return 'border-rose-200 bg-rose-50 text-rose-700'
})

onMounted(async () => {
  await fetchCampaigns()
  await fetchPrizes()
})
</script>

<template>
  <div class="space-y-8">
    <!-- 統計卡 -->
    <section class="grid grid-cols-2 gap-4 md:grid-cols-5">
      <div class="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm">
        <p class="text-xs font-bold text-slate-400">
          獎項總數
        </p>
        <p class="mt-2 text-3xl font-black text-slate-900">
          {{ totalPrizes }}
        </p>
      </div>

      <div class="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 text-center shadow-sm">
        <p class="text-xs font-bold text-emerald-500">
          總庫存
        </p>
        <p class="mt-2 text-3xl font-black text-emerald-700">
          {{ totalStock }}
        </p>
      </div>

      <div class="rounded-3xl border border-violet-100 bg-violet-50 p-5 text-center shadow-sm">
        <p class="text-xs font-bold text-violet-500">
          機率合計
        </p>
        <p class="mt-2 text-3xl font-black text-violet-700">
          {{ formatPercent(totalProbability) }}
        </p>
      </div>

      <div class="rounded-3xl border border-blue-100 bg-blue-50 p-5 text-center shadow-sm">
        <p class="text-xs font-bold text-blue-500">
          未中獎機率
        </p>
        <p class="mt-2 text-3xl font-black text-blue-700">
          {{ formatPercent(loseProbability) }}
        </p>
      </div>

      <div class="rounded-3xl border border-rose-100 bg-rose-50 p-5 text-center shadow-sm">
        <p class="text-xs font-bold text-rose-500">
          無庫存
        </p>
        <p class="mt-2 text-3xl font-black text-rose-700">
          {{ noStockCount }}
        </p>
      </div>
    </section>

    <section
      class="rounded-3xl border p-5 text-sm font-bold"
      :class="probabilityWarningClass"
    >
      {{ probabilityWarningText }}
    </section>

    <!-- 搜尋 + 表單 -->
    <section class="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
      <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="text-sm font-black text-violet-600">
            Prize Manager
          </p>

          <h2 class="mt-1 text-3xl font-black text-slate-900">
            {{ editingPrizeId ? '編輯獎項' : '新增獎項' }}
          </h2>

          <p class="mt-2 text-sm text-slate-500">
            建立活動獎項、設定庫存與中獎百分比，也可以加入「銘謝惠顧」或「再玩一次」。
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <input
            v-model="filters.keyword"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-500 md:w-72"
            placeholder="搜尋獎項名稱或活動名稱"
            @keyup.enter="fetchPrizes"
          />

          <select
            v-model="filters.campaignId"
            class="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-500"
          >
            <option value="">
              全部活動
            </option>
            <option
              v-for="campaign in campaigns"
              :key="campaign.id"
              :value="campaign.id"
            >
              {{ campaign.id }} - {{ campaign.title }}
            </option>
          </select>

          <button
            @click="fetchPrizes"
            class="rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
          >
            搜尋
          </button>

          <button
            @click="resetSearch"
            class="rounded-2xl bg-slate-200 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-300"
          >
            重設
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">
            所屬活動
          </label>
          <select
            v-model="prizeForm.campaignId"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-500"
          >
            <option value="">
              請選擇活動
            </option>
            <option
              v-for="campaign in campaigns"
              :key="campaign.id"
              :value="campaign.id"
            >
              {{ campaign.id }} - {{ campaign.title }}
            </option>
          </select>
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">
            獎項名稱
          </label>
          <input
            v-model="prizeForm.title"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-500"
            placeholder="例如：VIP 折價券 / 銘謝惠顧 / 再玩一次"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">
            剩餘庫存
          </label>
          <input
            v-model.number="prizeForm.remainStock"
            type="number"
            min="0"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-500"
            placeholder="例如 100"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">
            中獎機率百分比
          </label>

          <div class="relative">
            <input
              v-model.number="prizeForm.probability"
              type="number"
              step="0.01"
              min="0"
              max="100"
              class="w-full rounded-2xl border border-slate-300 px-4 py-3 pr-12 outline-none focus:border-violet-500"
              placeholder="例如 20 代表 20%"
            />

            <div class="pointer-events-none absolute inset-y-0 right-4 flex items-center text-lg font-black text-slate-400">
              %
            </div>
          </div>

          <div class="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              class="h-full rounded-full"
              :class="getProbabilityClass(prizeForm.probability)"
              :style="{ width: `${getProbabilityPercent(prizeForm.probability)}%` }"
            ></div>
          </div>

          <p class="mt-1 text-xs text-slate-400">
            請輸入 0～100，例如 5 代表 5%，20 代表 20%。
          </p>
        </div>
      </div>

      <div class="mt-5">
        <p class="mb-3 text-sm font-bold text-slate-700">
          快速套用
        </p>

        <div class="flex flex-wrap gap-3">
          <button
            v-for="template in quickPrizeTemplates"
            :key="template.title"
            @click="applyTemplate(template)"
            class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
          >
            {{ template.title }}｜{{ formatPercent(template.probability) }}
          </button>
        </div>
      </div>

      <div class="mt-6 flex flex-wrap gap-3">
        <button
          @click="submitPrize"
          :disabled="submitting"
          class="rounded-2xl bg-violet-600 px-6 py-3 font-bold text-white transition hover:bg-violet-700 disabled:opacity-60"
        >
          {{ submitting ? '處理中...' : editingPrizeId ? '更新獎項' : '新增獎項' }}
        </button>

        <button
          @click="resetPrizeForm"
          class="rounded-2xl bg-slate-200 px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-300"
        >
          {{ editingPrizeId ? '取消編輯' : '清空表單' }}
        </button>
      </div>
    </section>

    <!-- 獎項卡片 -->
    <section class="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
      <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-3xl font-black text-slate-900">
            獎項列表
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            卡片式管理所有活動獎項、庫存與中獎百分比。
          </p>
        </div>

        <span class="text-sm text-slate-400">
          共 {{ prizes.length }} 筆
        </span>
      </div>

      <div
        v-if="loading"
        class="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-500"
      >
        載入獎項中...
      </div>

      <div
        v-else-if="prizes.length === 0"
        class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center"
      >
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
          🎁
        </div>

        <h3 class="mt-4 text-xl font-black text-slate-800">
          目前沒有符合條件的獎項
        </h3>

        <p class="mt-2 text-sm text-slate-500">
          可以先選擇活動並新增第一個獎項。
        </p>
      </div>

      <div
        v-else
        class="grid grid-cols-1 gap-5 xl:grid-cols-2"
      >
        <article
          v-for="item in prizes"
          :key="item.id"
          class="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div class="border-b border-slate-100 bg-gradient-to-br from-violet-50 via-white to-slate-50 p-6">
            <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div class="flex flex-wrap gap-2">
                  <span
                    class="inline-flex rounded-full border px-3 py-1 text-xs font-black"
                    :class="getPrizeType(item.title).class"
                  >
                    {{ getPrizeType(item.title).label }}
                  </span>

                  <span class="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600">
                    Prize ID #{{ item.id }}
                  </span>
                </div>

                <h3 class="mt-3 text-2xl font-black text-slate-900">
                  {{ item.title }}
                </h3>

                <p class="mt-2 text-sm text-slate-500">
                  {{ item.campaign?.title || getCampaignTitle(item.campaignId) }}
                </p>
              </div>

              <div class="shrink-0 rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
                <p class="text-xs font-bold text-slate-400">
                  中獎機率
                </p>
                <p class="mt-1 text-xl font-black text-violet-700">
                  {{ formatPercent(item.probability) }}
                </p>
              </div>
            </div>
          </div>

          <div class="space-y-5 p-6">
            <div>
              <div class="mb-2 flex items-center justify-between">
                <p class="text-sm font-bold text-slate-600">
                  剩餘庫存
                </p>
                <p class="text-sm font-black text-slate-900">
                  {{ item.remainStock }}
                </p>
              </div>

              <div class="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full"
                  :class="getStockClass(item.remainStock)"
                  :style="{ width: `${getStockPercent(item.remainStock)}%` }"
                ></div>
              </div>
            </div>

            <div>
              <div class="mb-2 flex items-center justify-between">
                <p class="text-sm font-bold text-slate-600">
                  中獎百分比
                </p>
                <p class="text-sm font-black text-slate-900">
                  {{ formatPercent(item.probability) }}
                </p>
              </div>

              <div class="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full"
                  :class="getProbabilityClass(item.probability)"
                  :style="{ width: `${getProbabilityPercent(item.probability)}%` }"
                ></div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 border-t border-slate-100 bg-slate-50 p-5">
            <button
              @click="editPrize(item)"
              class="rounded-2xl bg-amber-500 px-4 py-3 font-bold text-white transition hover:bg-amber-600"
            >
              編輯
            </button>

            <button
              @click="deletePrize(item)"
              class="rounded-2xl bg-rose-500 px-4 py-3 font-bold text-white transition hover:bg-rose-600"
            >
              刪除
            </button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>