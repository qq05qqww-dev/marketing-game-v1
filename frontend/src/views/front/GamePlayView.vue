<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCampaignDetailApi } from '../../api/campaign'
import { getCampaignStyleConfig, defaultCampaignStyleConfig } from '../../utils/campaignStyleStorage'
import BaseLoading from '../../components/common/BaseLoading.vue'
import BaseError from '../../components/common/BaseError.vue'
import BaseEmpty from '../../components/common/BaseEmpty.vue'
import BaseToast from '../../components/common/BaseToast.vue'
import { useToast } from '../../composables/useToast'

import WheelGameView from './WheelGameView.vue'
import FlipGameView from './FlipGameView.vue'
import GridGameView from './GridGameView.vue'
import ScratchGameView from './ScratchGameView.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const campaign = ref(null)
const styleConfig = ref(defaultCampaignStyleConfig())
const playResult = ref(null)
const errorMessage = ref('')

const {
  toast,
  showSuccess,
  showError,
  showInfo,
  closeToast
} = useToast()

const gameType = computed(() => {
  return String(campaign.value?.gameType || '').toUpperCase()
})

const gameTypeLabel = computed(() => {
  if (gameType.value === 'WHEEL') return '輪盤抽獎'
  if (gameType.value === 'FLIP') return '翻牌遊戲'
  if (gameType.value === 'GRID') return '九宮格'
  if (gameType.value === 'SCRATCH') return '刮刮樂'

  return gameType.value || '未設定'
})

const fetchCampaign = async (showLoading = true) => {
  if (showLoading) {
    loading.value = true
    errorMessage.value = ''
  }

  try {
    const res = await getCampaignDetailApi(route.params.id)
    campaign.value = res.data?.data || null

    if (!campaign.value && showLoading) {
      errorMessage.value = '找不到活動資料'
      showError('找不到活動資料', '此活動不存在，或目前無法讀取活動資料。')
    }
  } catch (error) {
    console.error('取得活動失敗', error)

    if (showLoading) {
      campaign.value = null
      errorMessage.value =
        error?.response?.data?.message ||
        error?.message ||
        '取得活動失敗，請稍後再試'

      showError('取得活動失敗', errorMessage.value)
    }
  } finally {
    if (showLoading) {
      loading.value = false
    }
  }
}

const refreshCampaignSilently = async () => {
  try {
    await fetchCampaign(false)
  } catch (error) {
    console.error('背景更新活動資料失敗:', error)
  }
}

const refreshCampaignWithToast = async () => {
  await fetchCampaign(true)

  if (campaign.value) {
    showSuccess('活動資料已更新', '已重新取得最新活動資料')
  }
}

const loadStyle = () => {
  styleConfig.value = getCampaignStyleConfig(route.params.id)
}

const handleSpinStart = () => {
  playResult.value = null
}

const handleSpinEnd = (result) => {
  playResult.value = result
}

const goBack = () => {
  showInfo('返回上一頁', '正在回到上一個頁面')

  setTimeout(() => {
    router.back()
  }, 300)
}

const goCampaignDetail = () => {
  router.push(`/campaigns/${route.params.id}`)
}

const goCampaigns = () => {
  router.push('/campaigns')
}

const goHome = () => {
  router.push('/')
}

watch(
  () => route.params.id,
  async () => {
    playResult.value = null
    loadStyle()
    await fetchCampaign(true)
  }
)

onMounted(async () => {
  loadStyle()
  await fetchCampaign(true)
})
</script>

<template>
  <div class="min-h-screen bg-slate-100">
    <div class="mx-auto max-w-7xl px-4 py-6">
      <!-- Top Control -->
      <div class="mb-6 flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div class="flex flex-wrap gap-3">
          <button
            @click="goBack"
            class="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
          >
            ← 返回上一頁
          </button>

          <button
            @click="goCampaignDetail"
            class="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
          >
            查看活動詳情
          </button>

          <button
            @click="goCampaigns"
            class="rounded-2xl bg-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-300"
          >
            活動列表
          </button>

          <button
            @click="goHome"
            class="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            首頁
          </button>

          <button
            @click="refreshCampaignWithToast"
            class="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
          >
            重新整理
          </button>
        </div>

        <div class="text-sm font-bold text-slate-400">
          Game Play Center
        </div>
      </div>

      <BaseLoading
        v-if="loading"
        title="載入遊戲中..."
        message="請稍候，系統正在取得活動與遊戲資料。"
      />

      <BaseError
        v-else-if="!campaign"
        title="找不到活動資料"
        :message="errorMessage || '此活動不存在，或目前無法讀取活動資料。'"
        buttonText="返回活動列表"
        @retry="goCampaigns"
      />

      <div
        v-else
        class="space-y-8"
      >
        <!-- Activity Header -->
        <section class="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="text-sm font-black text-blue-600">
                Multi Game Platform
              </p>

              <h1 class="mt-1 text-3xl font-black text-slate-900">
                {{ campaign.title }}
              </h1>

              <p class="mt-2 text-sm text-slate-500">
                {{ gameTypeLabel }}｜{{ campaign.gameType }}
              </p>
            </div>

            <div class="flex flex-wrap gap-3">
              <span class="rounded-full bg-slate-100 px-5 py-3 text-sm font-black text-slate-700">
                Activity ID：{{ campaign.id }}
              </span>

              <span class="rounded-full bg-blue-100 px-5 py-3 text-sm font-black text-blue-700">
                {{ campaign.gameType || '未設定' }}
              </span>
            </div>
          </div>
        </section>

        <WheelGameView
          v-if="gameType === 'WHEEL'"
          :campaign="campaign"
          :prizes="campaign?.prizes || []"
          :config="styleConfig"
          :playResult="playResult"
          @spin-start="handleSpinStart"
          @spin-end="handleSpinEnd"
        />

        <FlipGameView
          v-else-if="gameType === 'FLIP'"
          :campaign="campaign"
          :prizes="campaign?.prizes || []"
          @refresh-campaign="refreshCampaignSilently"
        />

        <GridGameView
          v-else-if="gameType === 'GRID'"
          :campaign="campaign"
          :prizes="campaign?.prizes || []"
          @refresh-campaign="refreshCampaignSilently"
        />

        <ScratchGameView
          v-else-if="gameType === 'SCRATCH'"
          :campaign="campaign"
          :prizes="campaign?.prizes || []"
          @refresh-campaign="refreshCampaignSilently"
        />

        <BaseEmpty
          v-else
          icon="🧩"
          title="找不到對應遊戲類型"
          :message="`目前遊戲類型為：${gameType || '未設定'}，請確認活動設定是否正確。`"
          buttonText="返回活動列表"
          :showButton="true"
          @action="goCampaigns"
        />
      </div>
    </div>

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