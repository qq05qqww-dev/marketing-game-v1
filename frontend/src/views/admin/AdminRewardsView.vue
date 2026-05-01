<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import {
  getAdminRewardsApi,
  updateRewardStatusApi,
  deleteRewardApi,
  getAdminCampaignsApi
} from '../../api/campaign'

const loading = ref(false)
const actionLoadingId = ref(null)

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
    label: 'UNUSED 未使用',
    value: 'UNUSED'
  },
  {
    label: 'USED 已核銷',
    value: 'USED'
  },
  {
    label: 'EXPIRED 已作廢',
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
    <!-- 頁面標題 -->
    <section class="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-sm font-bold text-amber-600">
            Reward Redemption Center
          </p>

          <h2 class="mt-1 text-2xl font-black text-slate-900">
            發獎核銷
          </h2>

          <p class="mt-2 text-sm text-slate-500">
            卡片式檢視會員中獎紀錄、兌換碼、核銷狀態與發獎資料。
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div class="rounded-2xl bg-slate-50 px-5 py-4 text-center">
            <p class="text-xs text-slate-500">
              總筆數
            </p>
            <p class="mt-1 text-2xl font-black text-slate-900">
              {{ total }}
            </p>
          </div>

          <div class="rounded-2xl bg-amber-50 px-5 py-4 text-center">
            <p class="text-xs text-amber-600">
              目前頁
            </p>
            <p class="mt-1 text-2xl font-black text-amber-700">
              {{ pagination.page }}
            </p>
          </div>

          <div class="rounded-2xl bg-blue-50 px-5 py-4 text-center">
            <p class="text-xs text-blue-600">
              共幾頁
            </p>
            <p class="mt-1 text-2xl font-black text-blue-700">
              {{ pagination.totalPages }}
            </p>
          </div>

          <div class="rounded-2xl bg-emerald-50 px-5 py-4 text-center">
            <p class="text-xs text-emerald-600">
              每頁筆數
            </p>
            <p class="mt-1 text-2xl font-black text-emerald-700">
              {{ pagination.pageSize }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 查詢篩選 -->
    <section class="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div class="mb-5 flex flex-col gap-2">
        <h3 class="text-xl font-black text-slate-900">
          發獎核銷篩選
        </h3>

        <p class="text-sm text-slate-500">
          可依會員、Email、活動、獎項、兌換碼、狀態與活動進行查詢。
        </p>
      </div>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-6">
        <div class="xl:col-span-2">
          <label class="mb-2 block text-sm font-bold text-slate-700">
            關鍵字
          </label>
          <input
            v-model="filters.keyword"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
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
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
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
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
          >
            <option value="">
              全部活動
            </option>
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
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
          >
            <option :value="5">
              5
            </option>
            <option :value="10">
              10
            </option>
            <option :value="20">
              20
            </option>
            <option :value="50">
              50
            </option>
            <option :value="100">
              100
            </option>
          </select>
        </div>

        <div class="flex items-end gap-3">
          <button
            @click="searchRewards"
            class="flex-1 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
          >
            搜尋
          </button>

          <button
            @click="resetFilters"
            class="flex-1 rounded-2xl bg-slate-200 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-300"
          >
            重設
          </button>
        </div>
      </div>
    </section>

    <!-- 卡片列表 -->
    <section class="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div class="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 class="text-xl font-black text-slate-900">
            發獎核銷卡片列表
          </h3>

          <p class="mt-1 text-sm text-slate-500">
            顯示 {{ currentPageStart }} - {{ currentPageEnd }} 筆，共 {{ total }} 筆
          </p>
        </div>

        <button
          @click="fetchRewards"
          class="rounded-2xl bg-slate-900 px-5 py-3 font-bold text-white transition hover:bg-slate-800"
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
        class="grid grid-cols-1 gap-5 xl:grid-cols-2"
      >
        <article
          v-for="reward in rewards"
          :key="reward.id"
          class="overflow-hidden rounded-[28px] border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          :class="getCardClass(reward.status)"
        >
          <!-- 卡片上方 -->
          <div class="flex flex-col gap-4 border-b border-white/70 bg-white/70 p-5 md:flex-row md:items-start md:justify-between">
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
                  {{ reward.status || 'UNUSED' }}｜{{ getStatusLabel(reward.status) }}
                </span>

                <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                  ID #{{ reward.id }}
                </span>
              </div>

              <h4 class="mt-3 truncate text-xl font-black text-slate-900">
                {{ reward.prize?.title || '未命名獎項' }}
              </h4>

              <p class="mt-1 text-sm text-slate-500">
                {{ reward.campaign?.title || '未指定活動' }}
              </p>
            </div>

            <div class="shrink-0 rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
              <p class="text-xs font-bold text-slate-400">
                建立時間
              </p>
              <p class="mt-1 text-sm font-bold text-slate-700">
                {{ formatDateTime(reward.createdAt) }}
              </p>
            </div>
          </div>

          <!-- 卡片內容 -->
          <div class="grid gap-4 p-5 md:grid-cols-2">
            <div class="rounded-2xl bg-white p-4 shadow-sm">
              <p class="text-xs font-bold text-slate-400">
                會員
              </p>
              <p class="mt-2 text-lg font-black text-slate-900">
                {{ reward.user?.name || '—' }}
              </p>
              <p class="mt-1 break-all text-sm text-slate-500">
                {{ reward.user?.email || '—' }}
              </p>
              <p class="mt-2 text-xs text-slate-400">
                User ID：{{ reward.userId || '—' }}
              </p>
            </div>

            <div class="rounded-2xl bg-white p-4 shadow-sm">
              <p class="text-xs font-bold text-slate-400">
                兌換碼
              </p>
              <p class="mt-2 break-all rounded-xl bg-slate-100 px-3 py-3 font-mono text-sm font-bold text-slate-700">
                {{ reward.code || '—' }}
              </p>
              <p class="mt-2 text-xs text-slate-400">
                用於現場核銷或後台人工確認
              </p>
            </div>

            <div class="rounded-2xl bg-white p-4 shadow-sm">
              <p class="text-xs font-bold text-slate-400">
                活動資料
              </p>
              <p class="mt-2 font-bold text-slate-800">
                {{ reward.campaign?.title || '—' }}
              </p>
              <p class="mt-2 text-xs text-slate-400">
                Campaign ID：{{ reward.campaignId || '—' }}
              </p>
            </div>

            <div class="rounded-2xl bg-white p-4 shadow-sm">
              <p class="text-xs font-bold text-slate-400">
                獎項資料
              </p>
              <p class="mt-2 font-bold text-slate-800">
                {{ reward.prize?.title || '—' }}
              </p>
              <p class="mt-2 text-xs text-slate-400">
                Prize ID：{{ reward.prizeId || '—' }}
              </p>
            </div>
          </div>

          <!-- 操作區 -->
          <div class="border-t border-white/70 bg-white/80 p-5">
            <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
              <button
                v-if="reward.status !== 'USED'"
                @click="updateRewardStatus(reward, 'USED')"
                :disabled="actionLoadingId === reward.id"
                class="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-40"
              >
                核銷
              </button>

              <button
                v-if="reward.status !== 'EXPIRED'"
                @click="updateRewardStatus(reward, 'EXPIRED')"
                :disabled="actionLoadingId === reward.id"
                class="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white transition hover:bg-rose-700 disabled:opacity-40"
              >
                作廢
              </button>

              <button
                v-if="reward.status !== 'UNUSED'"
                @click="updateRewardStatus(reward, 'UNUSED')"
                :disabled="actionLoadingId === reward.id"
                class="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-white transition hover:bg-amber-600 disabled:opacity-40"
              >
                恢復
              </button>

              <button
                @click="deleteReward(reward)"
                :disabled="actionLoadingId === reward.id"
                class="rounded-2xl bg-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-300 disabled:opacity-40"
              >
                刪除
              </button>
            </div>
          </div>
        </article>
      </div>

      <!-- 分頁 -->
      <div class="mt-6 flex flex-col gap-4 rounded-3xl bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
        <div class="text-sm text-slate-500">
          第 {{ pagination.page }} / {{ pagination.totalPages }} 頁，
          顯示 {{ currentPageStart }} - {{ currentPageEnd }} 筆，
          共 {{ pagination.total }} 筆
        </div>

        <div class="flex gap-3">
          <button
            @click="prevPage"
            :disabled="pagination.page <= 1 || loading"
            class="rounded-xl bg-slate-200 px-5 py-2 font-bold text-slate-700 transition hover:bg-slate-300 disabled:opacity-40"
          >
            上一頁
          </button>

          <button
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