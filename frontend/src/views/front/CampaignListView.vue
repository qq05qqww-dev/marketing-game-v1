<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getCampaignsApi } from '../../api/campaign'
import PlatformNavbar from '../../components/PlatformNavbar.vue'
import PlatformFooter from '../../components/PlatformFooter.vue'
import BasePageHeader from '../../components/common/BasePageHeader.vue'
import BaseStatCard from '../../components/common/BaseStatCard.vue'
import BaseSectionHeader from '../../components/common/BaseSectionHeader.vue'
import BaseStatusBadge from '../../components/common/BaseStatusBadge.vue'
import BaseMiniInfoPill from '../../components/common/BaseMiniInfoPill.vue'
import BaseInfoRow from '../../components/common/BaseInfoRow.vue'
import BaseEmptyAction from '../../components/common/BaseEmptyAction.vue'
import BaseButton from '../../components/common/BaseButton.vue'
import BaseLoading from '../../components/common/BaseLoading.vue'
import BaseEmpty from '../../components/common/BaseEmpty.vue'
import BaseToast from '../../components/common/BaseToast.vue'
import { useToast } from '../../composables/useToast'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const campaigns = ref([])
const loading = ref(false)
const keyword = ref('')
const gameTypeFilter = ref('')
const statusFilter = ref('')
const eligibilityFilter = ref('')

const {
  toast,
  showSuccess,
  showError,
  showWarning,
  showInfo,
  closeToast
} = useToast()

const gameTypeOptions = [
  { label: '全部遊戲', value: '', emoji: '🎮' },
  { label: '輪盤', value: 'WHEEL', emoji: '🎡' },
  { label: '翻牌', value: 'FLIP', emoji: '🎴' },
  { label: '九宮格', value: 'GRID', emoji: '🔲' },
  { label: '刮刮樂', value: 'SCRATCH', emoji: '🎫' }
]

const statusOptions = [
  { label: '全部狀態', value: '' },
  { label: 'ACTIVE', value: 'ACTIVE' },
  { label: 'DRAFT', value: 'DRAFT' },
  { label: 'INACTIVE', value: 'INACTIVE' },
  { label: 'ENDED', value: 'ENDED' }
]

const eligibilityOptions = [
  { label: '全部活動', value: '' },
  { label: '我可以玩', value: 'PLAYABLE' },
  { label: '需要登入', value: 'LOGIN' },
  { label: '會員限制', value: 'LIMITED' }
]

const currentUser = computed(() => authStore.user || {})
const isLoggedIn = computed(() => authStore.isLoggedIn)

const fetchCampaigns = async (showToastMessage = false) => {
  loading.value = true

  try {
    const res = await getCampaignsApi()
    campaigns.value = Array.isArray(res?.data?.data) ? res.data.data : []

    if (showToastMessage) {
      showSuccess('活動已更新', `目前共有 ${campaigns.value.length} 筆活動`)
    }
  } catch (error) {
    console.error('取得活動列表失敗:', error)
    campaigns.value = []

    showError(
      '取得活動列表失敗',
      error?.response?.data?.message || '目前無法取得活動資料，請稍後再試'
    )
  } finally {
    loading.value = false
  }
}

const isBeforeStart = (item) => {
  if (!item?.startAt) return false
  return new Date(item.startAt) > new Date()
}

const isAfterEnd = (item) => {
  if (!item?.endAt) return false
  return new Date(item.endAt) < new Date()
}

const getPlayableReason = (item) => {
  const status = String(item?.status || '').toUpperCase()

  if (status !== 'ACTIVE') return '活動尚未啟用'
  if (isBeforeStart(item)) return '活動尚未開始'
  if (isAfterEnd(item)) return '活動已結束'

  if (item?.requireLogin && !isLoggedIn.value) {
    return '需要先登入'
  }

  if (item?.allowedRole) {
    const role = String(currentUser.value?.role || '').toUpperCase()
    const allowedRole = String(item.allowedRole || '').toUpperCase()

    if (role !== allowedRole) {
      return `限 ${allowedRole} 角色`
    }
  }

  if (item?.requiredLevel) {
    const level = String(currentUser.value?.memberLevel || '').toUpperCase()
    const requiredLevel = String(item.requiredLevel || '').toUpperCase()

    if (level !== requiredLevel) {
      return `限 ${requiredLevel} 會員`
    }
  }

  return ''
}

const isPlayable = (item) => {
  return !getPlayableReason(item)
}

const getPlayableStatus = (item) => {
  const reason = getPlayableReason(item)

  if (!reason) return 'PLAYABLE'
  if (reason.includes('登入')) return 'LOGIN'
  if (reason.includes('限')) return 'LIMITED'

  return 'LOCKED'
}

const filteredCampaigns = computed(() => {
  const key = String(keyword.value || '').trim().toLowerCase()
  const gameType = String(gameTypeFilter.value || '').toUpperCase()
  const status = String(statusFilter.value || '').toUpperCase()
  const eligibility = String(eligibilityFilter.value || '').toUpperCase()

  return campaigns.value.filter((item) => {
    const title = String(item.title || '').toLowerCase()
    const description = String(item.description || '').toLowerCase()
    const itemGameType = String(item.gameType || '').toUpperCase()
    const itemStatus = String(item.status || '').toUpperCase()
    const reason = getPlayableReason(item)

    const matchKeyword = !key || title.includes(key) || description.includes(key)
    const matchGameType = !gameType || itemGameType === gameType
    const matchStatus = !status || itemStatus === status

    let matchEligibility = true

    if (eligibility === 'PLAYABLE') {
      matchEligibility = !reason
    }

    if (eligibility === 'LOGIN') {
      matchEligibility = reason.includes('登入')
    }

    if (eligibility === 'LIMITED') {
      matchEligibility = reason.includes('限')
    }

    return matchKeyword && matchGameType && matchStatus && matchEligibility
  })
})

const wheelCount = computed(() => {
  return campaigns.value.filter((item) => String(item.gameType || '').toUpperCase() === 'WHEEL').length
})

const flipCount = computed(() => {
  return campaigns.value.filter((item) => String(item.gameType || '').toUpperCase() === 'FLIP').length
})

const gridCount = computed(() => {
  return campaigns.value.filter((item) => String(item.gameType || '').toUpperCase() === 'GRID').length
})

const scratchCount = computed(() => {
  return campaigns.value.filter((item) => String(item.gameType || '').toUpperCase() === 'SCRATCH').length
})

const playableCount = computed(() => {
  return campaigns.value.filter((item) => isPlayable(item)).length
})

const resetFilters = () => {
  keyword.value = ''
  gameTypeFilter.value = ''
  statusFilter.value = ''
  eligibilityFilter.value = ''

  showSuccess('篩選已重設', '已恢復顯示全部活動')
}

const filterByGameType = (type) => {
  gameTypeFilter.value = type
}

const filterPlayable = () => {
  eligibilityFilter.value = 'PLAYABLE'
}

const openCampaign = (item) => {
  router.push(`/campaigns/${item.id}`)
}

const playCampaign = (item) => {
  if (!isPlayable(item)) {
    const reason = getPlayableReason(item)

    if (reason.includes('登入')) {
      showWarning('需要先登入', '登入後才能參加此活動')

      setTimeout(() => {
        router.push({
          path: '/login',
          query: {
            redirect: `/play/${item.id}`
          }
        })
      }, 500)

      return
    }

    showInfo('目前無法遊玩', reason || '請先查看活動詳情')
    openCampaign(item)
    return
  }

  router.push(`/play/${item.id}`)
}

const formatDateTime = (value) => {
  if (!value) return '未設定'

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

const getGameMeta = (gameType) => {
  const type = String(gameType || '').toUpperCase()

  if (type === 'WHEEL') {
    return {
      label: '輪盤抽獎',
      emoji: '🎡',
      bg: 'from-blue-50 via-white to-cyan-50',
      button: 'bg-blue-600 hover:bg-blue-700'
    }
  }

  if (type === 'FLIP') {
    return {
      label: '翻牌遊戲',
      emoji: '🎴',
      bg: 'from-fuchsia-50 via-white to-violet-50',
      button: 'bg-fuchsia-600 hover:bg-fuchsia-700'
    }
  }

  if (type === 'GRID') {
    return {
      label: '九宮格',
      emoji: '🔲',
      bg: 'from-amber-50 via-white to-orange-50',
      button: 'bg-amber-500 hover:bg-amber-600'
    }
  }

  if (type === 'SCRATCH') {
    return {
      label: '刮刮樂',
      emoji: '🎫',
      bg: 'from-emerald-50 via-white to-lime-50',
      button: 'bg-emerald-600 hover:bg-emerald-700'
    }
  }

  return {
    label: type || '未設定',
    emoji: '🎮',
    bg: 'from-slate-50 via-white to-slate-50',
    button: 'bg-slate-900 hover:bg-slate-800'
  }
}

onMounted(() => {
  if (typeof authStore.restoreLogin === 'function') {
    authStore.restoreLogin()
  }

  fetchCampaigns()
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-slate-100">
    <PlatformNavbar />

    <main class="flex-1">
      <div class="mx-auto max-w-7xl space-y-8 px-4 py-8">
        <BasePageHeader
          eyebrow="Campaign Center"
          title="活動列表"
          description="選擇想參加的活動，進入輪盤、翻牌、九宮格或刮刮樂互動遊戲。"
          variant="rose"
          badgeIcon="🎮"
          :badgeText="`${filteredCampaigns.length} 筆活動`"
        >
          <BaseButton
  variant="dark"
  @click="fetchCampaigns(true)"
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
        <section class="grid grid-cols-2 gap-4 md:grid-cols-6">
          <BaseStatCard
            label="全部活動"
            :value="campaigns.length"
            icon="🎮"
            variant="slate"
          />

          <BaseStatCard
            label="可遊玩"
            :value="playableCount"
            icon="✅"
            variant="emerald"
            :clickable="true"
            @click="filterPlayable"
          />

          <BaseStatCard
            label="輪盤"
            :value="wheelCount"
            icon="🎡"
            variant="blue"
            :clickable="true"
            @click="filterByGameType('WHEEL')"
          />

          <BaseStatCard
            label="翻牌"
            :value="flipCount"
            icon="🎴"
            variant="fuchsia"
            :clickable="true"
            @click="filterByGameType('FLIP')"
          />

          <BaseStatCard
            label="九宮格"
            :value="gridCount"
            icon="🔲"
            variant="amber"
            :clickable="true"
            @click="filterByGameType('GRID')"
          />

          <BaseStatCard
            label="刮刮樂"
            :value="scratchCount"
            icon="🎫"
            variant="emerald"
            :clickable="true"
            @click="filterByGameType('SCRATCH')"
          />
        </section>

        <!-- Filters -->
        <section class="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <BaseSectionHeader
            icon="🔎"
            eyebrow="Filter"
            title="快速篩選"
            description="可依活動名稱、遊戲類型、狀態與可參加資格篩選。"
          />

          <div class="grid grid-cols-1 gap-4 xl:grid-cols-6">
            <div class="xl:col-span-2">
              <label class="mb-2 block text-sm font-bold text-slate-700">
                搜尋活動
              </label>
              <input
                v-model="keyword"
                type="text"
                placeholder="輸入活動名稱或說明"
                class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-rose-500"
              />
            </div>

            <div>
              <label class="mb-2 block text-sm font-bold text-slate-700">
                遊戲類型
              </label>
              <select
                v-model="gameTypeFilter"
                class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-rose-500"
              >
                <option
                  v-for="item in gameTypeOptions"
                  :key="item.value || 'ALL'"
                  :value="item.value"
                >
                  {{ item.emoji }} {{ item.label }}
                </option>
              </select>
            </div>

            <div>
              <label class="mb-2 block text-sm font-bold text-slate-700">
                狀態
              </label>
              <select
                v-model="statusFilter"
                class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-rose-500"
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
                參加資格
              </label>
              <select
                v-model="eligibilityFilter"
                class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-rose-500"
              >
                <option
                  v-for="item in eligibilityOptions"
                  :key="item.value || 'ALL'"
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

        <!-- List -->
        <section class="rounded-[36px] border border-slate-200 bg-white p-8 shadow-sm">
          <BaseSectionHeader
            icon="🎮"
            eyebrow="Campaign Cards"
            title="活動卡片"
            :description="`目前顯示 ${filteredCampaigns.length} 筆活動。`"
          />

          <BaseLoading
            v-if="loading"
            title="載入活動中..."
            message="請稍候，系統正在取得最新活動資料。"
          />

          <div
  v-else-if="filteredCampaigns.length === 0"
  class="space-y-4"
>
  <BaseEmpty
    icon="🎮"
    title="目前沒有符合條件的活動"
    message="可以調整搜尋條件，或稍後再回來查看最新活動。"
    :showButton="false"
  />

  <BaseEmptyAction
    icon="♻️"
    title="重設目前篩選條件"
    description="清除活動名稱、遊戲類型、狀態與參加資格條件，恢復顯示全部活動。"
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
              v-for="item in filteredCampaigns"
              :key="item.id"
              class="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div
                class="bg-gradient-to-br p-6"
                :class="getGameMeta(item.gameType).bg"
              >
                <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div class="flex flex-wrap gap-2">
                      <BaseStatusBadge
                        status="GAME"
                        :icon="getGameMeta(item.gameType).emoji"
                        :label="getGameMeta(item.gameType).label"
                      />

                      <BaseStatusBadge
                        :status="item.status || 'ACTIVE'"
                      />

                      <BaseStatusBadge
                        :status="getPlayableStatus(item)"
                        :label="isPlayable(item) ? '可遊玩' : getPlayableReason(item)"
                      />
                    </div>

                    <h3 class="mt-4 text-2xl font-black text-slate-900">
                      {{ item.title }}
                    </h3>

                    <p class="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                      {{ item.description || '尚未設定活動說明' }}
                    </p>
                  </div>

                  <div class="shrink-0 rounded-2xl bg-white/80 px-4 py-3 text-right shadow-sm">
                    <p class="text-xs font-bold text-slate-400">
                      Activity ID
                    </p>
                    <p class="mt-1 text-xl font-black text-slate-900">
                      #{{ item.id }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="grid gap-3 p-6 md:grid-cols-3">
  <BaseMiniInfoPill
    icon="📅"
    label="每日次數"
    :value="item.dailyLimit ?? '不限'"
    variant="blue"
  />

  <BaseMiniInfoPill
    icon="🎯"
    label="總次數"
    :value="item.totalLimit ?? '不限'"
    variant="indigo"
  />

  <BaseMiniInfoPill
    icon="🎁"
    label="獎項數"
    :value="item.prizes?.length ?? item._count?.prizes ?? 0"
    variant="amber"
  />

  <BaseInfoRow
  class="md:col-span-3"
  icon="🕒"
  label="活動期間"
  :value="`${formatDateTime(item.startAt)} ～ ${formatDateTime(item.endAt)}`"
/>

<BaseInfoRow
  class="md:col-span-3"
  icon="🔐"
  label="參加限制"
  :value="`${item.requireLogin ? '需登入' : '免登入'} ｜ ${item.allowedRole || '不限角色'} ｜ ${item.requiredLevel || '不限等級'}`"
/>
              </div>

              <div class="grid gap-3 border-t border-slate-100 bg-slate-50 p-5 md:grid-cols-2">
  <BaseButton
    :variant="isPlayable(item) ? 'primary' : 'muted'"
    full
    @click="playCampaign(item)"
  >
    {{ isPlayable(item) ? '開始遊玩' : '查看原因' }}
  </BaseButton>

  <BaseButton
    variant="secondary"
    full
    @click="openCampaign(item)"
  >
    查看活動
  </BaseButton>
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