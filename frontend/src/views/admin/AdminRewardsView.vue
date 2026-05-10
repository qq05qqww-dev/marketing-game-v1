<script setup>
// Multi Game Platform V2.3 Tenant Edition
// 第 44401～44800 批：發獎核銷中心精緻簡化與待處理優先版
import { computed, onMounted, ref, watch } from 'vue'
import {
  getAdminRewardsApi,
  updateRewardStatusApi,
  deleteRewardApi,
  getAdminCampaignsApi
} from '../../api/campaign'

const loading = ref(false)
const actionLoadingId = ref(null)
const quickStatus = ref('ALL')
const detailsOpen = ref({})

const rewards = ref([])
const campaigns = ref([])

const filters = ref({
  keyword: '',
  status: '',
  campaignId: '',
  page: 1,
  pageSize: 10
})

const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 1
})

const statusOptions = [
  {
    label: '全部狀態',
    value: ''
  },
  {
    label: '待核銷',
    value: 'UNUSED'
  },
  {
    label: '已核銷',
    value: 'USED'
  },
  {
    label: '已作廢',
    value: 'EXPIRED'
  }
]

const total = computed(() => pagination.value.total)

const currentPageStart = computed(() => {
  if (pagination.value.total === 0) return 0
  return (pagination.value.page - 1) * pagination.value.pageSize + 1
})

const currentPageEnd = computed(() => {
  const end = pagination.value.page * pagination.value.pageSize
  return Math.min(end, pagination.value.total)
})

const rewardSummaryCards = computed(() => {
  const rows = rewards.value
  const pending = rows.filter((item) => String(item.status || 'UNUSED').toUpperCase() === 'UNUSED').length
  const used = rows.filter((item) => String(item.status || '').toUpperCase() === 'USED').length
  const expired = rows.filter((item) => String(item.status || '').toUpperCase() === 'EXPIRED').length

  return [
    {
      label: '總筆數',
      value: total.value,
      description: '目前查詢條件',
      icon: '🎁',
      className: 'border-slate-200 bg-white text-slate-950'
    },
    {
      label: '本頁待核銷',
      value: pending,
      description: '優先處理',
      icon: '⏳',
      className: 'border-amber-100 bg-amber-50 text-amber-700'
    },
    {
      label: '本頁已核銷',
      value: used,
      description: '已完成',
      icon: '✅',
      className: 'border-emerald-100 bg-emerald-50 text-emerald-700'
    },
    {
      label: '本頁已作廢',
      value: expired,
      description: '不可兌換',
      icon: '🚫',
      className: 'border-rose-100 bg-rose-50 text-rose-700'
    }
  ]
})

const quickStatusOptions = [
  { label: '全部', value: 'ALL', icon: '📋' },
  { label: '待核銷', value: 'UNUSED', icon: '⏳' },
  { label: '已核銷', value: 'USED', icon: '✅' },
  { label: '已作廢', value: 'EXPIRED', icon: '🚫' }
]

const fetchCampaigns = async () => {
  try {
    const res = await getAdminCampaignsApi()
    campaigns.value = Array.isArray(res?.data?.data) ? res.data.data : []
  } catch (error) {
    console.error('取得活動清單失敗:', error)
    campaigns.value = []
  }
}

const fetchRewards = async () => {
  loading.value = true

  try {
    const res = await getAdminRewardsApi({
      keyword: filters.value.keyword,
      status: filters.value.status,
      campaignId: filters.value.campaignId,
      page: filters.value.page,
      pageSize: filters.value.pageSize
    })

    rewards.value = Array.isArray(res?.data?.data) ? res.data.data : []

    const p = res?.data?.pagination || {}

    pagination.value = {
      page: Number(p.page || filters.value.page || 1),
      pageSize: Number(p.pageSize || filters.value.pageSize || 10),
      total: Number(p.total || 0),
      totalPages: Number(p.totalPages || 1)
    }
  } catch (error) {
    console.error('取得發獎核銷資料失敗:', error)
    alert(error?.response?.data?.message || '取得發獎核銷資料失敗')

    rewards.value = []
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

const searchRewards = async () => {
  filters.value.page = 1
  await fetchRewards()
}

const applyQuickStatus = async (status) => {
  quickStatus.value = status
  filters.value.status = status === 'ALL' ? '' : status
  filters.value.page = 1
  await fetchRewards()
}

const toggleDetails = (id) => {
  detailsOpen.value = {
    ...detailsOpen.value,
    [id]: !detailsOpen.value[id]
  }
}

const isDetailsOpen = (id) => {
  return Boolean(detailsOpen.value[id])
}

const resetFilters = async () => {
  filters.value.keyword = ''
  filters.value.status = ''
  filters.value.campaignId = ''
  filters.value.page = 1
  filters.value.pageSize = 10
  await fetchRewards()
}

const updateRewardStatus = async (reward, status) => {
  if (!reward?.id) return

  const statusTextMap = {
    UNUSED: '恢復為未使用',
    USED: '核銷',
    EXPIRED: '作廢'
  }

  const text = statusTextMap[status] || '更新狀態'
  const ok = window.confirm(`確定要將這筆獎勵「${text}」嗎？`)

  if (!ok) return

  actionLoadingId.value = reward.id

  try {
    await updateRewardStatusApi(reward.id, {
      status
    })

    alert('獎勵狀態更新成功')
    await fetchRewards()
  } catch (error) {
    console.error('更新獎勵狀態失敗:', error)
    alert(error?.response?.data?.message || '更新獎勵狀態失敗')
  } finally {
    actionLoadingId.value = null
  }
}

const deleteReward = async (reward) => {
  if (!reward?.id) return

  const ok = window.confirm(
    `確定要刪除這筆發獎紀錄嗎？\n\nID：${reward.id}\n獎項：${reward.prize?.title || '—'}\n會員：${reward.user?.name || '—'}`
  )

  if (!ok) return

  actionLoadingId.value = reward.id

  try {
    await deleteRewardApi(reward.id)
    alert('發獎紀錄刪除成功')

    if (rewards.value.length === 1 && filters.value.page > 1) {
      filters.value.page -= 1
    }

    await fetchRewards()
  } catch (error) {
    console.error('刪除發獎紀錄失敗:', error)
    alert(error?.response?.data?.message || '刪除發獎紀錄失敗')
  } finally {
    actionLoadingId.value = null
  }
}

const prevPage = async () => {
  if (filters.value.page <= 1) return
  filters.value.page -= 1
  await fetchRewards()
}

const nextPage = async () => {
  if (filters.value.page >= pagination.value.totalPages) return
  filters.value.page += 1
  await fetchRewards()
}

const changePageSize = async () => {
  filters.value.page = 1
  await fetchRewards()
}

const formatDateTime = (value) => {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}

const getStatusLabel = (status) => {
  if (status === 'USED') return '已核銷'
  if (status === 'EXPIRED') return '已作廢'
  return '未使用'
}

const getStatusClass = (status) => {
  if (status === 'USED') {
    return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  }

  if (status === 'EXPIRED') {
    return 'bg-rose-100 text-rose-700 border-rose-200'
  }

  return 'bg-amber-100 text-amber-700 border-amber-200'
}

const getCardClass = (status) => {
  if (status === 'USED') {
    return 'border-emerald-200 bg-emerald-50/40'
  }

  if (status === 'EXPIRED') {
    return 'border-rose-200 bg-rose-50/40'
  }

  return 'border-amber-200 bg-amber-50/40'
}

const getStatusDotClass = (status) => {
  if (status === 'USED') {
    return 'bg-emerald-500'
  }

  if (status === 'EXPIRED') {
    return 'bg-rose-500'
  }

  return 'bg-amber-500'
}

const getRewardMemberName = (reward = {}) => {
  return reward.user?.name || reward.user?.email || '未填會員資料'
}

const getRewardCode = (reward = {}) => {
  return reward.code || reward.redeemCode || reward.serialCode?.code || '—'
}

const getRewardPrimaryActionText = (reward = {}) => {
  const status = String(reward.status || 'UNUSED').toUpperCase()

  if (status === 'USED') return '已完成核銷'
  if (status === 'EXPIRED') return '已作廢'
  return '等待核銷'
}

const getRewardCardTone = (reward = {}) => {
  const status = String(reward.status || 'UNUSED').toUpperCase()

  if (status === 'USED') return 'border-emerald-100 bg-emerald-50/40'
  if (status === 'EXPIRED') return 'border-rose-100 bg-rose-50/40'

  return 'border-amber-100 bg-amber-50/50'
}

watch(
  () => filters.value.pageSize,
  async () => {
    await changePageSize()
  }
)

onMounted(async () => {
  await fetchCampaigns()
  await fetchRewards()
})
</script>

<template>
  <div class="space-y-6">
    <section class="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
      <div class="bg-gradient-to-br from-slate-950 via-amber-950 to-slate-900 p-8 text-white">
        <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.3em] text-amber-200">
              Reward Redemption Center
            </p>
            <h2 class="mt-3 text-3xl font-black">
              發獎核銷
            </h2>
            <p class="mt-3 max-w-3xl text-sm font-bold leading-7 text-white/70">
              商家可在這裡快速查看待核銷、已核銷與已作廢紀錄。資料多時，先用快速篩選找出要處理的獎項。
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <button
              type="button"
              class="rounded-2xl bg-amber-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-200"
              @click="fetchRewards"
            >
              重新整理
            </button>
            <button
              type="button"
              class="rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
              @click="applyQuickStatus('UNUSED')"
            >
              查看待核銷
            </button>
          </div>
        </div>
      </div>

      <div class="grid gap-4 bg-slate-50 p-6 md:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="card in rewardSummaryCards"
          :key="card.label"
          class="rounded-3xl border p-5 shadow-sm"
          :class="card.className"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.18em] opacity-70">
                {{ card.label }}
              </p>
              <p class="mt-3 text-4xl font-black">
                {{ card.value }}
              </p>
              <p class="mt-2 text-xs font-bold opacity-70">
                {{ card.description }}
              </p>
            </div>
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
              {{ card.icon }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
      <div class="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 class="text-xl font-black text-slate-900">
            快速篩選
          </h3>
          <p class="mt-1 text-sm font-bold text-slate-500">
            建議商家日常先看「待核銷」，處理完再看已核銷紀錄。
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            v-for="item in quickStatusOptions"
            :key="item.value"
            type="button"
            class="rounded-2xl border px-4 py-3 text-sm font-black transition"
            :class="quickStatus === item.value
              ? 'border-slate-950 bg-slate-950 text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'"
            @click="applyQuickStatus(item.value)"
          >
            {{ item.icon }} {{ item.label }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-6">
        <div class="xl:col-span-2">
          <label class="mb-2 block text-sm font-bold text-slate-700">
            關鍵字
          </label>
          <input
            v-model="filters.keyword"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-50"
            placeholder="姓名 / Email / 活動 / 獎項 / 兌換碼"
            @keyup.enter="searchRewards"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">
            狀態
          </label>
          <select
            v-model="filters.status"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-50"
          >
            <option
              v-for="item in statusOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </option>
          </select>
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">
            活動
          </label>
          <select
            v-model="filters.campaignId"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-50"
          >
            <option value="">全部活動</option>
            <option
              v-for="campaign in campaigns"
              :key="campaign.id"
              :value="campaign.id"
            >
              {{ campaign.title }}
            </option>
          </select>
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">
            每頁筆數
          </label>
          <select
            v-model.number="filters.pageSize"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-50"
          >
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </div>

        <div class="flex items-end gap-3">
          <button
            type="button"
            @click="searchRewards"
            class="flex-1 rounded-2xl bg-amber-500 px-5 py-3 font-black text-white transition hover:bg-amber-600"
          >
            搜尋
          </button>

          <button
            type="button"
            @click="resetFilters"
            class="flex-1 rounded-2xl bg-slate-200 px-5 py-3 font-black text-slate-700 transition hover:bg-slate-300"
          >
            重設
          </button>
        </div>
      </div>
    </section>

    <section class="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
      <div class="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
            Redemption List
          </p>
          <h3 class="mt-1 text-2xl font-black text-slate-900">
            核銷清單
          </h3>
          <p class="mt-2 text-sm font-bold text-slate-500">
            顯示 {{ currentPageStart }} - {{ currentPageEnd }} 筆，共 {{ total }} 筆。
          </p>
        </div>

        <button
          type="button"
          @click="fetchRewards"
          class="rounded-2xl bg-slate-900 px-5 py-3 font-black text-white transition hover:bg-slate-800"
        >
          重新整理
        </button>
      </div>

      <div
        v-if="loading"
        class="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-500"
      >
        載入發獎核銷資料中...
      </div>

      <div
        v-else-if="rewards.length === 0"
        class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center"
      >
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
          🎁
        </div>
        <h4 class="mt-4 text-lg font-black text-slate-800">
          目前沒有符合條件的發獎核銷資料
        </h4>
        <p class="mt-2 text-sm text-slate-500">
          可以調整搜尋條件、狀態或活動篩選後重新查詢。
        </p>
      </div>

      <div
        v-else
        class="space-y-4"
      >
        <article
          v-for="reward in rewards"
          :key="reward.id"
          class="overflow-hidden rounded-[28px] border shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          :class="getRewardCardTone(reward)"
        >
          <div class="grid gap-4 bg-white/75 p-5 xl:grid-cols-[1.05fr_1fr_auto] xl:items-center">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="h-3 w-3 rounded-full"
                  :class="getStatusDotClass(reward.status)"
                ></span>

                <span
                  class="inline-flex rounded-full border px-3 py-1 text-xs font-black"
                  :class="getStatusClass(reward.status)"
                >
                  {{ getStatusLabel(reward.status) }}
                </span>

                <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                  ID #{{ reward.id }}
                </span>

                <span class="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm">
                  {{ getRewardPrimaryActionText(reward) }}
                </span>
              </div>

              <h4 class="mt-3 text-xl font-black text-slate-900">
                {{ reward.prize?.title || '未命名獎項' }}
              </h4>

              <p class="mt-1 text-sm font-bold text-slate-500">
                {{ reward.campaign?.title || '未指定活動' }}
              </p>
            </div>

            <div class="grid gap-3 md:grid-cols-2">
              <div class="rounded-2xl bg-white p-4 shadow-sm">
                <p class="text-xs font-black text-slate-400">會員</p>
                <p class="mt-2 text-base font-black text-slate-900">
                  {{ getRewardMemberName(reward) }}
                </p>
                <p class="mt-1 break-all text-xs font-bold text-slate-500">
                  {{ reward.user?.email || '—' }}
                </p>
              </div>

              <div class="rounded-2xl bg-white p-4 shadow-sm">
                <p class="text-xs font-black text-slate-400">兌換碼</p>
                <p class="mt-2 break-all rounded-xl bg-slate-100 px-3 py-2 font-mono text-sm font-black text-slate-700">
                  {{ getRewardCode(reward) }}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 xl:w-36 xl:grid-cols-1">
              <button
                v-if="reward.status !== 'USED'"
                type="button"
                @click="updateRewardStatus(reward, 'USED')"
                :disabled="actionLoadingId === reward.id"
                class="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-40"
              >
                核銷
              </button>

              <button
                v-if="reward.status !== 'EXPIRED'"
                type="button"
                @click="updateRewardStatus(reward, 'EXPIRED')"
                :disabled="actionLoadingId === reward.id"
                class="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white transition hover:bg-rose-700 disabled:opacity-40"
              >
                作廢
              </button>

              <button
                v-if="reward.status !== 'UNUSED'"
                type="button"
                @click="updateRewardStatus(reward, 'UNUSED')"
                :disabled="actionLoadingId === reward.id"
                class="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-white transition hover:bg-amber-600 disabled:opacity-40"
              >
                恢復
              </button>

              <button
                type="button"
                class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
                @click="toggleDetails(reward.id)"
              >
                {{ isDetailsOpen(reward.id) ? '收合' : '詳情' }}
              </button>
            </div>
          </div>

          <div
            v-if="isDetailsOpen(reward.id)"
            class="grid gap-4 border-t border-white/70 bg-white/80 p-5 md:grid-cols-3"
          >
            <div class="rounded-2xl bg-white p-4 shadow-sm">
              <p class="text-xs font-black text-slate-400">活動資料</p>
              <p class="mt-2 font-bold text-slate-800">{{ reward.campaign?.title || '—' }}</p>
              <p class="mt-2 text-xs text-slate-400">Campaign ID：{{ reward.campaignId || '—' }}</p>
            </div>

            <div class="rounded-2xl bg-white p-4 shadow-sm">
              <p class="text-xs font-black text-slate-400">獎項資料</p>
              <p class="mt-2 font-bold text-slate-800">{{ reward.prize?.title || '—' }}</p>
              <p class="mt-2 text-xs text-slate-400">Prize ID：{{ reward.prizeId || '—' }}</p>
            </div>

            <div class="rounded-2xl bg-white p-4 shadow-sm">
              <p class="text-xs font-black text-slate-400">時間 / 操作</p>
              <p class="mt-2 text-sm font-bold text-slate-700">建立：{{ formatDateTime(reward.createdAt) }}</p>
              <button
                type="button"
                @click="deleteReward(reward)"
                :disabled="actionLoadingId === reward.id"
                class="mt-3 rounded-xl bg-slate-200 px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-300 disabled:opacity-40"
              >
                刪除紀錄
              </button>
            </div>
          </div>
        </article>
      </div>

      <div class="mt-6 flex flex-col gap-4 rounded-3xl bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
        <div class="text-sm font-bold text-slate-500">
          第 {{ pagination.page }} / {{ pagination.totalPages }} 頁，
          顯示 {{ currentPageStart }} - {{ currentPageEnd }} 筆，
          共 {{ pagination.total }} 筆
        </div>

        <div class="flex gap-3">
          <button
            type="button"
            @click="prevPage"
            :disabled="pagination.page <= 1 || loading"
            class="rounded-xl bg-slate-200 px-5 py-2 font-bold text-slate-700 transition hover:bg-slate-300 disabled:opacity-40"
          >
            上一頁
          </button>

          <button
            type="button"
            @click="nextPage"
            :disabled="pagination.page >= pagination.totalPages || loading"
            class="rounded-xl bg-slate-900 px-5 py-2 font-bold text-white transition hover:bg-slate-800 disabled:opacity-40"
          >
            下一頁
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
