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

const loading = ref(true)
const summary = ref({
  totalCampaigns: 0,
  totalPrizes: 0,
  totalUsers: 0,
  totalRewards: 0,
  totalPlayRecords: 0
})
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
  page: 1,
  pageSize: 10
})

const safeArray = (value) => (Array.isArray(value) ? value : [])

const fetchReports = async () => {
  loading.value = true
  try {
    const [summaryRes, dailyRes, rewardRes] = await Promise.all([
      getReportSummaryApi({
        startDate: filters.value.startDate,
        endDate: filters.value.endDate
      }),
      getReportDailyApi({
        startDate: filters.value.startDate,
        endDate: filters.value.endDate
      }),
      getRewardRecordsApi({
        keyword: filters.value.keyword,
        status: filters.value.status,
        campaignId: filters.value.campaignId,
        page: filters.value.page,
        pageSize: filters.value.pageSize
      })
    ])

    summary.value = summaryRes?.data?.data || {
      totalCampaigns: 0,
      totalPrizes: 0,
      totalUsers: 0,
      totalRewards: 0,
      totalPlayRecords: 0
    }

    dailyRows.value = safeArray(dailyRes?.data?.data)
    rewardRows.value = safeArray(rewardRes?.data?.data)

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
    summary.value = {
      totalCampaigns: 0,
      totalPrizes: 0,
      totalUsers: 0,
      totalRewards: 0,
      totalPlayRecords: 0
    }
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

const exportRewardsCsv = () => {
  window.open(
    downloadRewardsCsvUrl({
      keyword: filters.value.keyword,
      status: filters.value.status,
      campaignId: filters.value.campaignId
    }),
    '_blank'
  )
}

const exportRewardsXlsx = () => {
  window.open(
    downloadRewardsXlsxUrl({
      keyword: filters.value.keyword,
      status: filters.value.status,
      campaignId: filters.value.campaignId
    }),
    '_blank'
  )
}

const exportPlayCsv = () => {
  window.open(
    downloadPlayRecordsCsvUrl({
      startDate: filters.value.startDate,
      endDate: filters.value.endDate
    }),
    '_blank'
  )
}

const exportPlayXlsx = () => {
  window.open(
    downloadPlayRecordsXlsxUrl({
      startDate: filters.value.startDate,
      endDate: filters.value.endDate
    }),
    '_blank'
  )
}

const applyFilters = async () => {
  filters.value.page = 1
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

onMounted(() => {
  fetchReports()
})
</script>

<template>
  <div class="space-y-8">
    <section class="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
      <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 class="text-3xl font-black text-slate-900">報表中心</h2>
          <p class="mt-2 text-slate-500">
            查看活動摘要、每日統計與獎勵紀錄。
          </p>
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

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div class="text-sm text-slate-500">活動總數</div>
          <div class="mt-2 text-4xl font-black text-slate-900">
            {{ summary.totalCampaigns ?? 0 }}
          </div>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div class="text-sm text-slate-500">獎項總數</div>
          <div class="mt-2 text-4xl font-black text-slate-900">
            {{ summary.totalPrizes ?? 0 }}
          </div>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div class="text-sm text-slate-500">會員總數</div>
          <div class="mt-2 text-4xl font-black text-slate-900">
            {{ summary.totalUsers ?? 0 }}
          </div>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div class="text-sm text-slate-500">發獎總數</div>
          <div class="mt-2 text-4xl font-black text-slate-900">
            {{ summary.totalRewards ?? 0 }}
          </div>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div class="text-sm text-slate-500">遊玩總數</div>
          <div class="mt-2 text-4xl font-black text-slate-900">
            {{ summary.totalPlayRecords ?? 0 }}
          </div>
        </div>
      </div>
    </section>

    <section class="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
      <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 class="text-2xl font-black text-slate-900">查詢條件</h3>
          <p class="mt-2 text-slate-500">可依日期與關鍵字篩選資料。</p>
        </div>

        <div class="flex flex-wrap gap-3">
          <button
            @click="exportPlayCsv"
            class="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 hover:bg-slate-50"
          >
            匯出遊玩 CSV
          </button>
          <button
            @click="exportPlayXlsx"
            class="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 hover:bg-slate-50"
          >
            匯出遊玩 XLSX
          </button>
          <button
            @click="exportRewardsCsv"
            class="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 hover:bg-slate-50"
          >
            匯出獎勵 CSV
          </button>
          <button
            @click="exportRewardsXlsx"
            class="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 hover:bg-slate-50"
          >
            匯出獎勵 XLSX
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-5 xl:grid-cols-6">
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
          <label class="mb-2 block text-sm font-bold text-slate-700">關鍵字</label>
          <input
            v-model="filters.keyword"
            type="text"
            placeholder="使用者 / 獎項 / 活動"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">獎勵狀態</label>
          <select
            v-model="filters.status"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          >
            <option value="">全部</option>
            <option value="UNUSED">UNUSED</option>
            <option value="USED">USED</option>
            <option value="EXPIRED">EXPIRED</option>
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

        <div class="flex items-end">
          <button
            @click="applyFilters"
            class="w-full rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700"
          >
            套用查詢
          </button>
        </div>
      </div>
    </section>

    <section class="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
      <div class="mb-6 flex items-center justify-between">
        <h3 class="text-2xl font-black text-slate-900">每日統計</h3>
        <div class="text-slate-400">共 {{ totalDailyRows }} 筆</div>
      </div>

      <div
        v-if="loading"
        class="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-500"
      >
        載入中...
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full">
          <thead>
            <tr class="border-b border-slate-200 text-left text-sm font-bold text-slate-500">
              <th class="px-4 py-4">日期</th>
              <th class="px-4 py-4">遊玩次數</th>
              <th class="px-4 py-4">中獎次數</th>
              <th class="px-4 py-4">活動數</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in dailyRows" :key="item.date" class="border-b border-slate-100">
              <td class="px-4 py-4 text-slate-700">{{ item.date }}</td>
              <td class="px-4 py-4 text-slate-700">{{ item.playCount ?? 0 }}</td>
              <td class="px-4 py-4 text-slate-700">{{ item.winCount ?? 0 }}</td>
              <td class="px-4 py-4 text-slate-700">{{ item.campaignCount ?? 0 }}</td>
            </tr>

            <tr v-if="dailyRows.length === 0">
              <td colspan="4" class="px-4 py-10 text-center text-slate-400">
                目前沒有每日統計資料
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
      <div class="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h3 class="text-2xl font-black text-slate-900">獎勵紀錄</h3>

        <div class="text-sm text-slate-500">
          第 {{ pagination.page }} / {{ pagination.totalPages }} 頁　
          顯示 {{ currentPageStart }} - {{ currentPageEnd }} 筆　
          共 {{ totalRewardRows }} 筆
        </div>
      </div>

      <div
        v-if="loading"
        class="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-500"
      >
        載入中...
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full">
          <thead>
            <tr class="border-b border-slate-200 text-left text-sm font-bold text-slate-500">
              <th class="px-4 py-4">ID</th>
              <th class="px-4 py-4">會員</th>
              <th class="px-4 py-4">活動</th>
              <th class="px-4 py-4">獎項</th>
              <th class="px-4 py-4">兌換碼</th>
              <th class="px-4 py-4">狀態</th>
              <th class="px-4 py-4">建立時間</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in rewardRows" :key="item.id" class="border-b border-slate-100">
              <td class="px-4 py-4 text-slate-700">{{ item.id }}</td>
              <td class="px-4 py-4 text-slate-700">
                {{ item.user?.name || '—' }}
                <div class="text-xs text-slate-400">{{ item.user?.email || '' }}</div>
              </td>
              <td class="px-4 py-4 text-slate-700">{{ item.campaign?.title || '—' }}</td>
              <td class="px-4 py-4 text-slate-700">{{ item.prize?.title || '—' }}</td>
              <td class="px-4 py-4 text-slate-700">{{ item.code || '—' }}</td>
              <td class="px-4 py-4 text-slate-700">{{ item.status || '—' }}</td>
              <td class="px-4 py-4 text-slate-700">{{ formatDateTime(item.createdAt) }}</td>
            </tr>

            <tr v-if="rewardRows.length === 0">
              <td colspan="7" class="px-4 py-10 text-center text-slate-400">
                目前沒有獎勵紀錄資料
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-6 flex items-center justify-end gap-3">
        <button
          @click="goPrevPage"
          :disabled="pagination.page <= 1"
          class="rounded-2xl border border-slate-300 bg-white px-5 py-2 font-bold text-slate-700 disabled:opacity-40"
        >
          上一頁
        </button>

        <div class="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
          第 {{ pagination.page }} 頁 / 共 {{ pagination.totalPages }} 頁
        </div>

        <button
          @click="goNextPage"
          :disabled="pagination.page >= pagination.totalPages"
          class="rounded-2xl border border-slate-300 bg-white px-5 py-2 font-bold text-slate-700 disabled:opacity-40"
        >
          下一頁
        </button>
      </div>
    </section>
  </div>
</template>