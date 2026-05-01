<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getMyRewardsApi } from '../../api/reward'
import { useAuthStore } from '../../stores/auth'
import PlatformNavbar from '../../components/PlatformNavbar.vue'
import PlatformFooter from '../../components/PlatformFooter.vue'
import BasePageHeader from '../../components/common/BasePageHeader.vue'
import BaseStatCard from '../../components/common/BaseStatCard.vue'
import BaseSectionHeader from '../../components/common/BaseSectionHeader.vue'
import BaseStatusBadge from '../../components/common/BaseStatusBadge.vue'
import BaseEmptyAction from '../../components/common/BaseEmptyAction.vue'
import BaseButton from '../../components/common/BaseButton.vue'
import BaseLoading from '../../components/common/BaseLoading.vue'
import BaseEmpty from '../../components/common/BaseEmpty.vue'
import BaseToast from '../../components/common/BaseToast.vue'
import { useToast } from '../../composables/useToast'

const router = useRouter()
const authStore = useAuthStore()

const rewards = ref([])
const loading = ref(true)
const keyword = ref('')
const statusFilter = ref('')
const sortType = ref('NEWEST')
const copiedCode = ref('')

const {
  toast,
  showSuccess,
  showError,
  showWarning,
  closeToast
} = useToast()

const statusOptions = [
  {
    label: '全部狀態',
    value: ''
  },
  {
    label: '未使用',
    value: 'UNUSED'
  },
  {
    label: '已核銷',
    value: 'USED'
  },
  {
    label: '已過期 / 作廢',
    value: 'EXPIRED'
  }
]

const sortOptions = [
  {
    label: '最新取得',
    value: 'NEWEST'
  },
  {
    label: '最舊取得',
    value: 'OLDEST'
  }
]

const fetchMyRewards = async (showToastMessage = false) => {
  loading.value = true

  if (typeof authStore.restoreLogin === 'function') {
    authStore.restoreLogin()
  }

  if (!authStore.isLoggedIn) {
    showWarning('請先登入', '登入後才能查看我的獎品')

    setTimeout(() => {
      router.push('/login?redirect=/my-rewards')
    }, 500)

    return
  }

  try {
    const res = await getMyRewardsApi()
    rewards.value = Array.isArray(res?.data?.data) ? res.data.data : []

    if (showToastMessage) {
      showSuccess('獎品已更新', `目前共有 ${rewards.value.length} 筆獎品`)
    }
  } catch (error) {
    console.error('取得獎品失敗:', error)

    const message = error?.response?.data?.message || '取得獎品失敗'
    showError('取得獎品失敗', message)

    rewards.value = []
  } finally {
    loading.value = false
  }
}

const formatDateTime = (value) => {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value).replace('T', ' ').slice(0, 16)
  }

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}

const getRewardPrizeTitle = (item) => {
  return item?.prizeTitle || item?.prize?.title || '未命名獎品'
}

const getRewardCampaignTitle = (item) => {
  return item?.campaignTitle || item?.campaign?.title || '未命名活動'
}

const getStatusLabel = (status) => {
  const value = String(status || '').toUpperCase()

  if (value === 'USED') return '已核銷'
  if (value === 'EXPIRED') return '已過期 / 作廢'

  return '未使用'
}

const getStatusClass = (status) => {
  const value = String(status || '').toUpperCase()

  if (value === 'USED') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (value === 'EXPIRED') {
    return 'border-rose-200 bg-rose-50 text-rose-700'
  }

  return 'border-amber-200 bg-amber-50 text-amber-700'
}

const getCardClass = (status) => {
  const value = String(status || '').toUpperCase()

  if (value === 'USED') {
    return 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white'
  }

  if (value === 'EXPIRED') {
    return 'border-rose-200 bg-gradient-to-br from-rose-50 via-white to-white'
  }

  return 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white'
}

const getStatusEmoji = (status) => {
  const value = String(status || '').toUpperCase()

  if (value === 'USED') return '✅'
  if (value === 'EXPIRED') return '⏰'

  return '🎁'
}

const getStatusLargeText = (status) => {
  const value = String(status || '').toUpperCase()

  if (value === 'USED') {
    return {
      title: '已完成核銷',
      desc: '此獎品已使用，兌換碼不可再次核銷。'
    }
  }

  if (value === 'EXPIRED') {
    return {
      title: '已過期 / 作廢',
      desc: '此獎品目前不可使用，請洽活動人員確認。'
    }
  }

  return {
    title: '可使用獎品',
    desc: '請出示兌換碼給現場人員或管理員核銷。'
  }
}

const unusedCount = computed(() => {
  return rewards.value.filter((item) => String(item.status || '').toUpperCase() === 'UNUSED').length
})

const usedCount = computed(() => {
  return rewards.value.filter((item) => String(item.status || '').toUpperCase() === 'USED').length
})

const expiredCount = computed(() => {
  return rewards.value.filter((item) => String(item.status || '').toUpperCase() === 'EXPIRED').length
})

const filteredRewards = computed(() => {
  const key = String(keyword.value || '').trim().toLowerCase()
  const status = String(statusFilter.value || '').toUpperCase()

  const list = rewards.value.filter((item) => {
    const prizeTitle = getRewardPrizeTitle(item).toLowerCase()
    const campaignTitle = getRewardCampaignTitle(item).toLowerCase()
    const code = String(item?.code || '').toLowerCase()
    const itemStatus = String(item?.status || 'UNUSED').toUpperCase()

    const matchKeyword =
      !key ||
      prizeTitle.includes(key) ||
      campaignTitle.includes(key) ||
      code.includes(key)

    const matchStatus = !status || itemStatus === status

    return matchKeyword && matchStatus
  })

  return [...list].sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime()
    const bTime = new Date(b.createdAt || 0).getTime()

    if (sortType.value === 'OLDEST') {
      return aTime - bTime
    }

    return bTime - aTime
  })
})

const resetFilters = () => {
  keyword.value = ''
  statusFilter.value = ''
  sortType.value = 'NEWEST'

  showSuccess('篩選已重設', '已恢復顯示全部獎品')
}

const filterByStatus = (status) => {
  statusFilter.value = status
}

const copyCode = async (code) => {
  if (!code) {
    showWarning('沒有兌換碼', '此獎品目前沒有可複製的兌換碼')
    return
  }

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(code)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = code
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }

    copiedCode.value = code
    showSuccess('兌換碼已複製', code)

    setTimeout(() => {
      if (copiedCode.value === code) {
        copiedCode.value = ''
      }
    }, 1800)
  } catch (error) {
    console.error('複製兌換碼失敗:', error)
    showError('複製失敗', '請手動複製兌換碼')
  }
}

const goCampaigns = () => {
  router.push('/campaigns')
}

onMounted(() => {
  fetchMyRewards()
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-slate-100">
    <PlatformNavbar />

    <main class="flex-1">
      <div class="mx-auto max-w-7xl space-y-8 px-4 py-8">
        <BasePageHeader
          eyebrow="My Rewards Center"
          title="我的獎品"
          description="查看你在活動中獲得的獎品、兌換碼與核銷狀態，也可以搜尋、篩選與複製兌換碼。"
          variant="amber"
          badgeIcon="🎁"
          :badgeText="`${filteredRewards.length} 筆獎品`"
        >
          <BaseButton
  variant="warning"
  @click="goCampaigns"
>
  去看活動
</BaseButton>

<BaseButton
  variant="dark"
  @click="fetchMyRewards(true)"
>
  重新整理
</BaseButton>

<BaseButton
  variant="secondary"
  @click="resetFilters"
>
  重設篩選
</BaseButton>
        </BasePageHeader>

        <!-- Stats -->
        <section class="grid grid-cols-2 gap-4 md:grid-cols-4">
          <BaseStatCard
            label="全部獎品"
            :value="rewards.length"
            icon="🎁"
            variant="slate"
            :clickable="true"
            @click="filterByStatus('')"
          />

          <BaseStatCard
            label="未使用"
            :value="unusedCount"
            icon="🎫"
            variant="amber"
            :clickable="true"
            @click="filterByStatus('UNUSED')"
          />

          <BaseStatCard
            label="已核銷"
            :value="usedCount"
            icon="✅"
            variant="emerald"
            :clickable="true"
            @click="filterByStatus('USED')"
          />

          <BaseStatCard
            label="已過期 / 作廢"
            :value="expiredCount"
            icon="⏰"
            variant="rose"
            :clickable="true"
            @click="filterByStatus('EXPIRED')"
          />
        </section>

        <!-- Filters -->
        <section class="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <BaseSectionHeader
            icon="🔎"
            eyebrow="Filter"
            title="獎品篩選"
            description="可搜尋獎品名稱、活動名稱、兌換碼，也可以依狀態與取得時間排序。"
          />

          <div class="grid grid-cols-1 gap-4 xl:grid-cols-5">
            <div class="xl:col-span-2">
              <label class="mb-2 block text-sm font-bold text-slate-700">
                關鍵字搜尋
              </label>

              <input
                v-model="keyword"
                type="text"
                placeholder="搜尋獎品、活動或兌換碼"
                class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-amber-500"
              />
            </div>

            <div>
              <label class="mb-2 block text-sm font-bold text-slate-700">
                狀態
              </label>

              <select
                v-model="statusFilter"
                class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-amber-500"
              >
                <option
                  v-for="item in statusOptions"
                  :key="item.value || 'ALL'"
                  :value="item.value"
                >
                  {{ item.label }}
                </option>
              </select>
            </div>

            <div>
              <label class="mb-2 block text-sm font-bold text-slate-700">
                排序
              </label>

              <select
                v-model="sortType"
                class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-amber-500"
              >
                <option
                  v-for="item in sortOptions"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ item.label }}
                </option>
              </select>
            </div>

            <div class="flex items-end">
  <BaseButton
    variant="muted"
    full
    @click="resetFilters"
  >
    重設
  </BaseButton>
</div>
          </div>
        </section>

        <!-- Content -->
        <section class="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <BaseSectionHeader
            icon="🎁"
            eyebrow="Reward Cards"
            title="獎品卡片"
            :description="`目前顯示 ${filteredRewards.length} 筆獎品。出示兌換碼即可讓店員或管理員核銷。`"
          />

          <BaseLoading
            v-if="loading"
            title="讀取我的獎品中..."
            message="請稍候，系統正在取得你的獎品與兌換碼。"
          />

          <div
  v-else-if="rewards.length === 0"
  class="space-y-4"
>
  <BaseEmpty
    icon="🎁"
    title="目前還沒有獎品"
    message="參加活動並中獎後，獎品會顯示在這裡。"
    :showButton="false"
  />

  <BaseEmptyAction
    icon="🎮"
    title="前往活動列表"
    description="去看看目前有哪些活動可以參加，中獎後獎品會自動出現在這裡。"
    buttonText="去看活動"
    variant="amber"
    @action="goCampaigns"
  />
</div>

          <div
  v-else-if="filteredRewards.length === 0"
  class="space-y-4"
>
  <BaseEmpty
    icon="🔎"
    title="沒有符合條件的獎品"
    message="可以調整搜尋條件，或按下方按鈕重設篩選。"
    :showButton="false"
  />

  <BaseEmptyAction
    icon="♻️"
    title="重設目前篩選條件"
    description="清除關鍵字、狀態與排序條件，恢復顯示全部獎品。"
    buttonText="重設篩選"
    variant="rose"
    @action="resetFilters"
  />
</div>

          <div
            v-else
            class="grid grid-cols-1 gap-5 xl:grid-cols-2"
          >
            <article
              v-for="item in filteredRewards"
              :key="item.id"
              class="overflow-hidden rounded-[32px] border shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              :class="getCardClass(item.status)"
            >
              <div class="border-b border-white/80 bg-white/70 p-6">
                <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div class="flex flex-wrap gap-2">
                      <BaseStatusBadge
  :status="item.status || 'UNUSED'"
  :label="`${item.status || 'UNUSED'}｜${getStatusLabel(item.status)}`"
/>

                      <span class="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600">
                        Reward ID #{{ item.id }}
                      </span>
                    </div>

                    <h3 class="mt-4 text-2xl font-black text-slate-900">
                      {{ getRewardPrizeTitle(item) }}
                    </h3>

                    <p class="mt-2 text-sm text-slate-500">
                      活動：{{ getRewardCampaignTitle(item) }}
                    </p>
                  </div>

                  <div class="shrink-0 rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
                    <p class="text-xs font-bold text-slate-400">
                      狀態
                    </p>
                    <p class="mt-1 text-lg font-black text-slate-900">
                      {{ getStatusLabel(item.status) }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="grid gap-4 p-6 md:grid-cols-2">
                <div class="rounded-2xl bg-white p-4 shadow-sm md:col-span-2">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="text-xs font-bold text-slate-400">
                        兌換碼
                      </p>

                      <p class="mt-3 break-all rounded-2xl bg-slate-100 px-4 py-4 font-mono text-2xl font-black tracking-wider text-slate-900">
                        {{ item.code || '—' }}
                      </p>
                    </div>

                    <BaseButton
  variant="dark"
  size="sm"
  :disabled="!item.code"
  @click="copyCode(item.code)"
>
  {{ copiedCode === item.code ? '已複製' : '複製' }}
</BaseButton>
                  </div>

                  <p class="mt-3 text-xs text-slate-400">
                    {{ getStatusLargeText(item.status).desc }}
                  </p>
                </div>

                <div class="rounded-2xl bg-white p-4 shadow-sm">
                  <p class="text-xs font-bold text-slate-400">
                    取得時間
                  </p>
                  <p class="mt-2 font-bold text-slate-800">
                    {{ formatDateTime(item.createdAt) }}
                  </p>
                </div>

                <div class="rounded-2xl bg-white p-4 shadow-sm">
                  <p class="text-xs font-bold text-slate-400">
                    目前狀態
                  </p>
                  <p class="mt-2 font-bold text-slate-800">
                    {{ getStatusLargeText(item.status).title }}
                  </p>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>

    <PlatformFooter />

    <BaseToast
      :show="toast.show"
      :type="toast.type"
      :title="toast.title"
      :message="toast.message"
      :position="toast.position"
      @close="closeToast"
    />
  </div>
</template>