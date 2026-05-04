<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  getReportSummaryApi,
  getReportDailyApi,
  getRewardRecordsApi,
  downloadRewardsCsvUrl,
  downloadRewardsXlsxUrl,
  downloadPlayRecordsCsvUrl,
  downloadPlayRecordsXlsxUrl
} from '../../api/campaign'
import http from '../../api/http'

const loading = ref(true)
const exporting = ref(false)

const emptySummary = () => ({
  scope: 'ALL',
  tenantId: null,
  totalCampaigns: 0,
  totalPrizes: 0,
  totalUsers: 0,
  totalRewards: 0,
  totalPlayRecords: 0,
  totalWins: 0,
  claimedRewards: 0,
  pendingRewards: 0,
  winRate: 0,
  canSelectTenant: false,
  selectedTenant: null,
  sourceStats: {
    total: 0,
    items: []
  }
})

const summary = ref(emptySummary())
const tenantOptions = ref([])
const dailyRows = ref([])
const rewardRows = ref([])

const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 1
})

const filters = ref({
  startDate: '',
  endDate: '',
  keyword: '',
  status: '',
  campaignId: '',
  tenantId: '',
  page: 1,
  pageSize: 10
})

const safeArray = (value) => (Array.isArray(value) ? value : [])

const apiData = (response, fallback = null) => {
  return response?.data?.data ?? response?.data ?? fallback
}

const sourceLabelMap = {
  line: 'LINE',
  facebook: 'Facebook',
  instagram: 'Instagram',
  direct: '一般 / 直接'
}

const sourceStats = computed(() => {
  const items = safeArray(summary.value?.sourceStats?.items)

  if (items.length) return items

  return [
    { key: 'line', label: 'LINE', count: 0, percent: 0 },
    { key: 'facebook', label: 'Facebook', count: 0, percent: 0 },
    { key: 'instagram', label: 'Instagram', count: 0, percent: 0 },
    { key: 'direct', label: '一般 / 直接', count: 0, percent: 0 }
  ]
})

const fetchReports = async () => {
  loading.value = true

  try {
    const [summaryRes, dailyRes, rewardRes] = await Promise.all([
      getReportSummaryApi({
        startDate: filters.value.startDate,
        endDate: filters.value.endDate,
        campaignId: filters.value.campaignId,
        tenantId: filters.value.tenantId
      }),
      getReportDailyApi({
        startDate: filters.value.startDate,
        endDate: filters.value.endDate,
        campaignId: filters.value.campaignId,
        tenantId: filters.value.tenantId
      }),
      getRewardRecordsApi({
        keyword: filters.value.keyword,
        status: filters.value.status,
        campaignId: filters.value.campaignId,
        tenantId: filters.value.tenantId,
        startDate: filters.value.startDate,
        endDate: filters.value.endDate,
        page: filters.value.page,
        pageSize: filters.value.pageSize
      })
    ])

    summary.value = {
      ...emptySummary(),
      ...(apiData(summaryRes, {}) || {})
    }

    dailyRows.value = safeArray(apiData(dailyRes, []))
    rewardRows.value = safeArray(apiData(rewardRes, []))

    const p = rewardRes?.data?.pagination || {}
    pagination.value = {
      page: Number(p.page || filters.value.page || 1),
      pageSize: Number(p.pageSize || filters.value.pageSize || 10),
      total: Number(p.total || 0),
      totalPages: Number(p.totalPages || 1)
    }
  } catch (error) {
    console.error('取得報表資料失敗', error)
    alert(error?.response?.data?.message || '取得報表資料失敗')
    summary.value = emptySummary()
    dailyRows.value = []
    rewardRows.value = []
    pagination.value = {
      page: 1,
      pageSize: filters.value.pageSize,
      total: 0,
      totalPages: 1
    }
  } finally {
    loading.value = false
  }
}

const totalDailyRows = computed(() => dailyRows.value.length)
const totalRewardRows = computed(() => pagination.value.total)

const currentPageStart = computed(() => {
  if (pagination.value.total === 0) return 0
  return (pagination.value.page - 1) * pagination.value.pageSize + 1
})

const currentPageEnd = computed(() => {
  const end = pagination.value.page * pagination.value.pageSize
  return Math.min(end, pagination.value.total)
})

const isPlatformReport = computed(() => {
  return ['ALL', 'PLATFORM_TENANT'].includes(String(summary.value?.scope || '').toUpperCase())
})

const selectedTenantName = computed(() => {
  return summary.value?.selectedTenant?.name || tenantOptions.value.find((item) => String(item.id) === String(filters.value.tenantId))?.name || ''
})

const reportScopeText = computed(() => {
  const scope = String(summary.value?.scope || '').toUpperCase()

  if (scope === 'ALL') return '平台總管理員目前檢視全部商家的合併資料'
  if (scope === 'PLATFORM_TENANT') return `平台總管理員目前檢視「${selectedTenantName.value || '指定商家'}」的資料`

  return '目前只顯示此商家的資料'
})

const fetchTenantOptions = async () => {
  try {
    const response = await http.get('/admin/reports/tenants')
    const data = response?.data?.data || response?.data || {}
    tenantOptions.value = safeArray(data.tenants)
  } catch (error) {
    console.error('取得商家篩選清單失敗', error)
    tenantOptions.value = []
  }
}

const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}

const getRewardStatusText = (status) => {
  const value = String(status || '').toUpperCase()

  if (value === 'CLAIMED') return '已核銷'
  if (value === 'CANCELLED') return '已取消'
  if (value === 'PENDING') return '待發獎'

  return value || '—'
}

const getRewardWinner = (row) => {
  return row?.winnerName || row?.winnerPhone || row?.winnerEmail || '—'
}

const getRewardSerialCode = (row) => {
  return row?.playRecord?.serialCode?.code || row?.serialCode?.code || '—'
}

const getRewardSource = (row) => {
  const payload = row?.playRecord?.resultPayload || {}
  const source = String(payload.source || payload.trafficSource || 'direct').toLowerCase()

  return sourceLabelMap[source] || '一般 / 直接'
}

const buildExportParams = () => ({
  startDate: filters.value.startDate,
  endDate: filters.value.endDate,
  keyword: filters.value.keyword,
  status: filters.value.status,
  campaignId: filters.value.campaignId,
  tenantId: filters.value.tenantId
})

const downloadByFetch = async (url, fallbackFilename) => {
  exporting.value = true

  try {
    const token = localStorage.getItem('token') || ''
    const response = await fetch(url, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `下載失敗：${response.status}`)
    }

    const blob = await response.blob()
    const disposition = response.headers.get('Content-Disposition') || ''
    const filenameMatch = disposition.match(/filename="?([^";]+)"?/i)
    const filename = filenameMatch?.[1] || fallbackFilename
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = objectUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(objectUrl)
  } catch (error) {
    console.error('匯出失敗', error)
    alert(error?.message || '匯出失敗')
  } finally {
    exporting.value = false
  }
}

const exportRewardsCsv = () => {
  downloadByFetch(downloadRewardsCsvUrl(buildExportParams()), 'reward-records.csv')
}

const exportRewardsXlsx = () => {
  downloadByFetch(downloadRewardsXlsxUrl(buildExportParams()), 'reward-records.xlsx')
}

const exportPlayCsv = () => {
  downloadByFetch(downloadPlayRecordsCsvUrl(buildExportParams()), 'play-records.csv')
}

const exportPlayXlsx = () => {
  downloadByFetch(downloadPlayRecordsXlsxUrl(buildExportParams()), 'play-records.xlsx')
}

const applyFilters = async () => {
  filters.value.page = 1
  await fetchReports()
}

const clearFilters = async () => {
  filters.value = {
    startDate: '',
    endDate: '',
    keyword: '',
    status: '',
    campaignId: '',
    tenantId: '',
    page: 1,
    pageSize: filters.value.pageSize || 10
  }

  await fetchReports()
}

const goPrevPage = async () => {
  if (filters.value.page > 1) {
    filters.value.page -= 1
    await fetchReports()
  }
}

const goNextPage = async () => {
  if (filters.value.page < pagination.value.totalPages) {
    filters.value.page += 1
    await fetchReports()
  }
}

const changePageSize = async () => {
  filters.value.page = 1
  await fetchReports()
}

onMounted(async () => {
  await fetchTenantOptions()
  await fetchReports()
})
</script>

<template>
  <div class="space-y-8">
    <section class="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
      <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.35em] text-indigo-500">Tenant Reports</p>
          <h2 class="mt-2 text-3xl font-black text-slate-900">報表中心</h2>
          <p class="mt-2 text-slate-500">
            查看活動摘要、每日統計、來源成效與發獎紀錄。{{ reportScopeText }}。
          </p>
          <div class="mt-4 inline-flex rounded-2xl px-4 py-2 text-sm font-black" :class="isPlatformReport ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'">
            {{ isPlatformReport ? '平台總管理員報表' : '商家報表' }}
          </div>
        </div>

        <div class="flex flex-wrap gap-3">
          <button
            @click="fetchReports"
            class="rounded-2xl bg-slate-900 px-6 py-3 font-bold text-white transition hover:bg-slate-800"
          >
            重新整理
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div class="text-sm text-slate-500">活動總數</div>
          <div class="mt-2 text-4xl font-black text-slate-900">{{ summary.totalCampaigns ?? 0 }}</div>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div class="text-sm text-slate-500">遊玩總數</div>
          <div class="mt-2 text-4xl font-black text-slate-900">{{ summary.totalPlayRecords ?? 0 }}</div>
        </div>

        <div class="rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
          <div class="text-sm text-emerald-700">中獎數</div>
          <div class="mt-2 text-4xl font-black text-emerald-700">{{ summary.totalWins ?? 0 }}</div>
        </div>

        <div class="rounded-3xl border border-amber-100 bg-amber-50 p-6">
          <div class="text-sm text-amber-700">待發獎</div>
          <div class="mt-2 text-4xl font-black text-amber-700">{{ summary.pendingRewards ?? 0 }}</div>
        </div>

        <div class="rounded-3xl border border-blue-100 bg-blue-50 p-6">
          <div class="text-sm text-blue-700">已核銷</div>
          <div class="mt-2 text-4xl font-black text-blue-700">{{ summary.claimedRewards ?? 0 }}</div>
        </div>

        <div class="rounded-3xl border border-rose-100 bg-rose-50 p-6">
          <div class="text-sm text-rose-700">中獎率</div>
          <div class="mt-2 text-4xl font-black text-rose-700">{{ summary.winRate ?? 0 }}%</div>
        </div>
      </div>
    </section>

    <section class="rounded-[32px] border border-cyan-100 bg-cyan-50/60 p-8 shadow-sm">
      <div class="mb-6 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.35em] text-cyan-600">Traffic Source</p>
          <h3 class="mt-2 text-2xl font-black text-slate-900">來源成效統計</h3>
          <p class="mt-2 text-sm text-slate-500">
            依第 22 批分享連結的 <span class="font-bold text-slate-700">?from=</span> 參數統計玩家來源。
          </p>
        </div>
        <div class="rounded-2xl bg-white px-5 py-3 text-sm font-black text-cyan-700 shadow-sm">
          總來源筆數：{{ summary.sourceStats?.total || 0 }}
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="item in sourceStats"
          :key="item.key"
          class="rounded-3xl border border-cyan-100 bg-white p-6 shadow-sm"
        >
          <div class="flex items-center justify-between gap-3">
            <div>
              <div class="text-sm font-bold text-slate-500">{{ item.label }}</div>
              <div class="mt-2 text-4xl font-black text-slate-900">{{ item.count }}</div>
            </div>
            <div class="rounded-2xl bg-cyan-50 px-4 py-2 text-lg font-black text-cyan-700">
              {{ item.percent }}%
            </div>
          </div>
          <div class="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              class="h-full rounded-full bg-cyan-500"
              :style="{ width: `${Math.min(100, Math.max(0, item.percent || 0))}%` }"
            ></div>
          </div>
        </div>
      </div>
    </section>

    <section class="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
      <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 class="text-2xl font-black text-slate-900">查詢條件</h3>
          <p class="mt-2 text-slate-500">可依商家、日期、活動 ID、關鍵字與發獎狀態篩選資料。</p>
        </div>

        <div class="flex flex-wrap gap-3">
          <button
            @click="exportPlayCsv"
            :disabled="exporting"
            class="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            匯出遊玩 CSV
          </button>
          <button
            @click="exportPlayXlsx"
            :disabled="exporting"
            class="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            匯出遊玩 XLSX
          </button>
          <button
            @click="exportRewardsCsv"
            :disabled="exporting"
            class="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            匯出發獎 CSV
          </button>
          <button
            @click="exportRewardsXlsx"
            :disabled="exporting"
            class="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            匯出發獎 XLSX
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-5 xl:grid-cols-8">
        <div v-if="isPlatformReport" class="xl:col-span-2">
          <label class="mb-2 block text-sm font-bold text-slate-700">商家篩選</label>
          <select
            v-model="filters.tenantId"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          >
            <option value="">全部商家</option>
            <option
              v-for="tenant in tenantOptions"
              :key="tenant.id"
              :value="String(tenant.id)"
            >
              {{ tenant.name }} / {{ tenant.slug }}
            </option>
          </select>
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">開始日期</label>
          <input
            v-model="filters.startDate"
            type="date"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">結束日期</label>
          <input
            v-model="filters.endDate"
            type="date"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">活動 ID</label>
          <input
            v-model="filters.campaignId"
            type="number"
            min="1"
            placeholder="例如：13"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">關鍵字</label>
          <input
            v-model="filters.keyword"
            type="text"
            placeholder="姓名 / 電話 / 獎項 / 活動"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">發獎狀態</label>
          <select
            v-model="filters.status"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          >
            <option value="">全部</option>
            <option value="PENDING">待發獎</option>
            <option value="CLAIMED">已核銷</option>
            <option value="CANCELLED">已取消</option>
          </select>
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">每頁筆數</label>
          <select
            v-model.number="filters.pageSize"
            @change="changePageSize"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          >
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </div>

        <div class="flex gap-3 xl:flex-col xl:justify-end">
          <button
            @click="applyFilters"
            class="flex-1 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700"
          >
            套用
          </button>
          <button
            @click="clearFilters"
            class="flex-1 rounded-2xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
          >
            清除
          </button>
        </div>
      </div>
    </section>

    <section class="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
      <div class="mb-6 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 class="text-2xl font-black text-slate-900">每日遊玩統計</h3>
          <p class="mt-2 text-slate-500">目前顯示 {{ totalDailyRows }} 天資料。</p>
        </div>
      </div>

      <div class="overflow-x-auto rounded-3xl border border-slate-200">
        <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead class="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th class="px-5 py-4">日期</th>
              <th class="px-5 py-4">遊玩數</th>
              <th class="px-5 py-4">中獎數</th>
              <th class="px-5 py-4">活動數</th>
              <th class="px-5 py-4">LINE</th>
              <th class="px-5 py-4">FB</th>
              <th class="px-5 py-4">IG</th>
              <th class="px-5 py-4">一般</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            <tr v-if="loading">
              <td colspan="8" class="px-5 py-10 text-center text-slate-500">讀取中...</td>
            </tr>
            <tr v-else-if="dailyRows.length === 0">
              <td colspan="8" class="px-5 py-10 text-center text-slate-500">目前沒有每日統計資料。</td>
            </tr>
            <tr v-for="row in dailyRows" v-else :key="row.date" class="hover:bg-slate-50">
              <td class="px-5 py-4 font-bold text-slate-900">{{ row.date }}</td>
              <td class="px-5 py-4">{{ row.playCount }}</td>
              <td class="px-5 py-4">{{ row.winCount }}</td>
              <td class="px-5 py-4">{{ row.campaignCount }}</td>
              <td class="px-5 py-4">{{ row.sourceLine || 0 }}</td>
              <td class="px-5 py-4">{{ row.sourceFacebook || 0 }}</td>
              <td class="px-5 py-4">{{ row.sourceInstagram || 0 }}</td>
              <td class="px-5 py-4">{{ row.sourceDirect || 0 }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
      <div class="mb-6 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 class="text-2xl font-black text-slate-900">中獎 / 發獎紀錄</h3>
          <p class="mt-2 text-slate-500">
            目前顯示 {{ currentPageStart }} - {{ currentPageEnd }} 筆，共 {{ totalRewardRows }} 筆。
          </p>
        </div>
      </div>

      <div class="overflow-x-auto rounded-3xl border border-slate-200">
        <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead class="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th class="px-5 py-4">ID</th>
              <th class="px-5 py-4">活動</th>
              <th class="px-5 py-4">獎項</th>
              <th class="px-5 py-4">得獎者</th>
              <th class="px-5 py-4">序號</th>
              <th class="px-5 py-4">來源</th>
              <th class="px-5 py-4">狀態</th>
              <th class="px-5 py-4">建立時間</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            <tr v-if="loading">
              <td colspan="8" class="px-5 py-10 text-center text-slate-500">讀取中...</td>
            </tr>
            <tr v-else-if="rewardRows.length === 0">
              <td colspan="8" class="px-5 py-10 text-center text-slate-500">目前沒有發獎紀錄。</td>
            </tr>
            <tr v-for="row in rewardRows" v-else :key="row.id" class="hover:bg-slate-50">
              <td class="px-5 py-4 font-bold text-slate-900">#{{ row.id }}</td>
              <td class="px-5 py-4">{{ row.campaign?.title || '—' }}</td>
              <td class="px-5 py-4">{{ row.prize?.title || '—' }}</td>
              <td class="px-5 py-4">{{ getRewardWinner(row) }}</td>
              <td class="px-5 py-4 font-mono text-xs">{{ getRewardSerialCode(row) }}</td>
              <td class="px-5 py-4">{{ getRewardSource(row) }}</td>
              <td class="px-5 py-4">
                <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                  {{ getRewardStatusText(row.status) }}
                </span>
              </td>
              <td class="px-5 py-4">{{ formatDateTime(row.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div class="text-sm text-slate-500">
          第 {{ pagination.page }} / {{ pagination.totalPages }} 頁
        </div>
        <div class="flex gap-3">
          <button
            @click="goPrevPage"
            :disabled="pagination.page <= 1"
            class="rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            上一頁
          </button>
          <button
            @click="goNextPage"
            :disabled="pagination.page >= pagination.totalPages"
            class="rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            下一頁
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
