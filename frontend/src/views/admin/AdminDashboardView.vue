<script setup>
// Multi Game Platform V2.3 Tenant Edition
// 第 45201～45600 批：商家後台首頁儀表板精緻版
//
// 目的：
// 商家登入後先看到今日狀態、三遊戲狀態、待核銷提醒與下一步入口。
// 這頁只做讀取與導引，不改 DB schema / draw-core。

import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  getAdminCampaignsApi,
  getAdminRewardsApi
} from '../../api/campaign'
import http from '../../api/http'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const refreshing = ref(false)
const campaigns = ref([])
const rewards = ref([])
const serialSummary = ref({})
const errorMessage = ref('')
const lastUpdatedAt = ref('')

const GAME_DEFINITIONS = [
  {
    type: 'WHEEL',
    key: 'wheel',
    path: 'wheel',
    title: '幸運輪盤',
    icon: '🎡',
    tone: 'orange',
    description: '適合折扣券、再玩一次、活動現場抽獎。'
  },
  {
    type: 'GRID',
    key: 'premium-grid',
    path: 'premium-grid',
    title: '精緻九宮格',
    icon: '🎁',
    tone: 'amber',
    description: '適合九格獎項、序號抽獎、品牌活動。'
  },
  {
    type: 'GOLDEN_EGG',
    key: 'golden-egg',
    path: 'golden-egg',
    title: '砸金蛋',
    icon: '🥚',
    tone: 'rose',
    description: '適合高互動視覺活動、敲蛋中獎。'
  }
]

const PRODUCTION_FRONTEND_URL = 'https://marketing-game-v1.vercel.app'

const role = computed(() => String(authStore.user?.role || '').toUpperCase())
const isPlatformAdmin = computed(() => ['ADMIN', 'SUPER_ADMIN'].includes(role.value))
const tenantSlug = computed(() => authStore.user?.tenantSlug || authStore.user?.tenant?.slug || 'a-shop')
const tenantName = computed(() => authStore.user?.tenantName || authStore.user?.tenant?.name || tenantSlug.value || '商家')
const userName = computed(() => authStore.user?.name || authStore.user?.email || '管理員')

const normalizeFrontendUrl = (value = '') => {
  return String(value || '').trim().replace(/\/$/, '')
}

const isLocalFrontendUrl = (value = '') => {
  return /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(String(value || ''))
}

const frontendOrigin = computed(() => {
  const envUrl = normalizeFrontendUrl(
    import.meta.env.VITE_PUBLIC_FRONTEND_URL ||
      import.meta.env.VITE_FRONTEND_URL ||
      import.meta.env.VITE_APP_FRONTEND_URL ||
      ''
  )

  if (envUrl) return envUrl

  if (typeof window === 'undefined') return PRODUCTION_FRONTEND_URL

  const origin = normalizeFrontendUrl(window.location.origin)

  return isLocalFrontendUrl(origin) ? PRODUCTION_FRONTEND_URL : origin
})

const safeArray = (value) => Array.isArray(value) ? value : []

const unwrapData = (response) => {
  const payload = response?.data ?? response

  return payload?.data ?? payload
}

const normalizeCampaignList = (response) => {
  const data = unwrapData(response)

  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.campaigns)) return data.campaigns

  return []
}

const normalizeRewardList = (response) => {
  const data = unwrapData(response)

  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.rewards)) return data.rewards

  return []
}

const getCampaignTenantSlug = (campaign = {}) => {
  return campaign.tenant?.slug || campaign.tenantSlug || campaign.merchantSlug || tenantSlug.value
}

const belongsToCurrentScope = (campaign = {}) => {
  if (isPlatformAdmin.value) return true

  return String(getCampaignTenantSlug(campaign) || '') === String(tenantSlug.value || '')
}

const merchantCampaigns = computed(() => {
  const supported = GAME_DEFINITIONS.map((game) => game.type)

  return campaigns.value.filter((campaign) => {
    return supported.includes(String(campaign.gameType || '').toUpperCase()) && belongsToCurrentScope(campaign)
  })
})

const gameCards = computed(() => {
  return GAME_DEFINITIONS.map((game) => {
    const campaign = merchantCampaigns.value.find((item) => String(item.gameType || '').toUpperCase() === game.type)
    const status = String(campaign?.status || '尚未建立').toUpperCase()
    const isActive = status === 'ACTIVE'
    const playerUrl = campaign?.id
      ? `${frontendOrigin.value}/play/${getCampaignTenantSlug(campaign)}/${game.path}?campaignId=${campaign.id}`
      : `${frontendOrigin.value}/play/${tenantSlug.value}/${game.path}`
    const serial = campaign?.id ? serialSummary.value[String(campaign.id)] || {} : {}

    return {
      ...game,
      campaign,
      campaignId: campaign?.id || '',
      status,
      isActive,
      hasCampaign: Boolean(campaign?.id),
      playerUrl,
      serialTotal: Number(serial.total || 0),
      serialUnused: Number(serial.unused || 0),
      serialUsed: Number(serial.used || 0),
      serialRemaining: Number(serial.remainingChance || 0)
    }
  })
})

const pendingRewards = computed(() => {
  return rewards.value.filter((item) => String(item.status || 'UNUSED').toUpperCase() === 'UNUSED')
})

const usedRewards = computed(() => {
  return rewards.value.filter((item) => String(item.status || '').toUpperCase() === 'USED')
})

const expiredRewards = computed(() => {
  return rewards.value.filter((item) => String(item.status || '').toUpperCase() === 'EXPIRED')
})

const dashboardCards = computed(() => {
  const activeGames = gameCards.value.filter((game) => game.isActive).length
  const createdGames = gameCards.value.filter((game) => game.hasCampaign).length
  const totalSerials = gameCards.value.reduce((sum, game) => sum + Number(game.serialTotal || 0), 0)
  const remainingSerials = gameCards.value.reduce((sum, game) => sum + Number(game.serialRemaining || game.serialUnused || 0), 0)

  return [
    {
      label: '三遊戲建立',
      value: `${createdGames}/3`,
      description: '輪盤 / 九宮格 / 砸金蛋',
      icon: '🎮',
      className: 'border-slate-200 bg-white text-slate-950'
    },
    {
      label: '啟用中',
      value: `${activeGames}/3`,
      description: activeGames === 3 ? '三個遊戲都可交付' : '仍有遊戲未啟用',
      icon: '✅',
      className: 'border-emerald-100 bg-emerald-50 text-emerald-700'
    },
    {
      label: '待核銷',
      value: pendingRewards.value.length,
      description: '需要商家處理',
      icon: '🎁',
      className: 'border-amber-100 bg-amber-50 text-amber-700'
    },
    {
      label: '序號剩餘',
      value: remainingSerials || totalSerials,
      description: `總序號 ${totalSerials} 組`,
      icon: '🎟️',
      className: 'border-blue-100 bg-blue-50 text-blue-700'
    }
  ]
})

const nextActionCards = computed(() => {
  const hasPendingRewards = pendingRewards.value.length > 0
  const missingGame = gameCards.value.find((game) => !game.hasCampaign)
  const inactiveGame = gameCards.value.find((game) => game.hasCampaign && !game.isActive)
  const lowSerialGame = gameCards.value.find((game) => game.hasCampaign && Number(game.serialUnused || game.serialRemaining || 0) <= 3)

  return [
    {
      title: hasPendingRewards ? '先處理待核銷' : '核銷狀態正常',
      description: hasPendingRewards
        ? `目前有 ${pendingRewards.value.length} 筆獎項等待核銷，建議先處理。`
        : '目前沒有急需處理的待核銷獎項。',
      icon: hasPendingRewards ? '🚨' : '✅',
      buttonText: '前往發獎核銷',
      to: '/admin/rewards',
      tone: hasPendingRewards ? 'amber' : 'emerald'
    },
    {
      title: missingGame ? `建立${missingGame.title}` : inactiveGame ? `啟用${inactiveGame.title}` : '三個遊戲都已建立',
      description: missingGame
        ? `${missingGame.title} 尚未建立活動，建議補齊三個正式遊戲。`
        : inactiveGame
          ? `${inactiveGame.title} 目前不是啟用狀態，交付前請確認。`
          : '三個遊戲活動都已建立，可進一步確認序號與網址。',
      icon: missingGame || inactiveGame ? '🧩' : '🚀',
      buttonText: '前往活動管理',
      to: '/admin/campaigns',
      tone: missingGame || inactiveGame ? 'indigo' : 'emerald'
    },
    {
      title: lowSerialGame ? `${lowSerialGame.title} 序號偏少` : '序號狀態正常',
      description: lowSerialGame
        ? `${lowSerialGame.title} 可用序號偏少，建議補充或重新讀取確認。`
        : '目前序號狀態沒有明顯異常。',
      icon: lowSerialGame ? '🎟️' : '✅',
      buttonText: '前往序號管理',
      to: '/admin/my-serials',
      tone: lowSerialGame ? 'blue' : 'slate'
    }
  ]
})

const recentRewardCards = computed(() => {
  return rewards.value.slice(0, 5)
})

const formatDateTime = (value) => {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatTime = (value) => {
  if (!value) return '尚未更新'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '尚未更新'

  return date.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const getRewardTitle = (reward = {}) => {
  return reward.prize?.title || reward.prizeTitle || '未命名獎項'
}

const getRewardMember = (reward = {}) => {
  return reward.user?.name || reward.user?.email || reward.memberName || '未填會員資料'
}

const getStatusClass = (status) => {
  const value = String(status || '').toUpperCase()

  if (value === 'ACTIVE') return 'bg-emerald-100 text-emerald-700'
  if (value === 'USED') return 'bg-emerald-100 text-emerald-700'
  if (value === 'UNUSED') return 'bg-amber-100 text-amber-700'
  if (value === 'EXPIRED') return 'bg-rose-100 text-rose-700'

  return 'bg-slate-100 text-slate-600'
}

const go = (path) => {
  router.push(path)
}

const goGameSerials = (game) => {
  router.push({
    path: '/admin/my-serials',
    query: {
      game: game.key,
      ...(game.campaignId ? { campaignId: game.campaignId } : {})
    }
  })
}

const copyText = async (text, successText = '已複製') => {
  const value = String(text || '').trim()

  if (!value) return

  try {
    await navigator.clipboard.writeText(value)
    window.alert(successText)
  } catch (error) {
    const textarea = document.createElement('textarea')
    textarea.value = value
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    window.alert(successText)
  }
}

const loadSerialSummaryForCampaign = async (campaign) => {
  if (!campaign?.id) return

  try {
    const response = await http.get(`/serial-codes/campaigns/${campaign.id}`)
    const data = unwrapData(response)
    const rows = safeArray(data?.items || data?.serialCodes || data)

    const summary = rows.reduce((acc, code) => {
      const status = String(code.status || code.effectiveStatus || '').toUpperCase()
      acc.total += 1
      if (status === 'UNUSED') acc.unused += 1
      if (status === 'USED') acc.used += 1
      acc.remainingChance += Number(code.remainingChance ?? code.remainingSerialChances ?? code.rewardChance ?? 0)

      return acc
    }, {
      total: 0,
      unused: 0,
      used: 0,
      remainingChance: 0
    })

    serialSummary.value = {
      ...serialSummary.value,
      [String(campaign.id)]: summary
    }
  } catch (error) {
    serialSummary.value = {
      ...serialSummary.value,
      [String(campaign.id)]: {
        total: 0,
        unused: 0,
        used: 0,
        remainingChance: 0
      }
    }
  }
}

const loadDashboard = async () => {
  loading.value = true
  refreshing.value = true
  errorMessage.value = ''

  try {
    const [campaignRes, rewardRes] = await Promise.all([
      getAdminCampaignsApi(),
      getAdminRewardsApi({
        page: 1,
        pageSize: 20
      }).catch(() => ({ data: { data: [] } }))
    ])

    campaigns.value = normalizeCampaignList(campaignRes)
    rewards.value = normalizeRewardList(rewardRes)

    await Promise.all(merchantCampaigns.value.map((campaign) => loadSerialSummaryForCampaign(campaign)))

    lastUpdatedAt.value = new Date().toISOString()
  } catch (error) {
    console.error('載入商家首頁儀表板失敗:', error)
    errorMessage.value = error?.response?.data?.message || error?.message || '載入商家首頁儀表板失敗。'
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

onMounted(() => {
  loadDashboard()
})
</script>

<template>
  <div class="space-y-6">
    <section class="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div class="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-8 text-white">
        <div class="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.3em] text-cyan-200">
              Merchant Dashboard｜第 45201～45600 批
            </p>
            <h1 class="mt-3 text-3xl font-black md:text-4xl">
              {{ tenantName }} 後台首頁
            </h1>
            <p class="mt-3 max-w-4xl text-sm font-bold leading-7 text-white/70">
              {{ userName }}，這裡會整理今天最重要的操作：三個遊戲狀態、待核銷、序號與商家下一步。
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <button
              type="button"
              class="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:opacity-60"
              :disabled="refreshing"
              @click="loadDashboard"
            >
              {{ refreshing ? '更新中...' : '重新整理' }}
            </button>
            <button
              type="button"
              class="rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
              @click="go('/admin/my-games')"
            >
              我的遊戲中心
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="errorMessage"
        class="border-t border-rose-100 bg-rose-50 px-6 py-4 text-sm font-black text-rose-700"
      >
        {{ errorMessage }}
      </div>

      <div class="grid gap-4 bg-slate-50 p-6 md:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="card in dashboardCards"
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

      <div class="border-t border-slate-100 px-6 py-4 text-xs font-bold text-slate-500">
        最後更新：{{ formatTime(lastUpdatedAt) }}
      </div>
    </section>

    <section class="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
              Game Status
            </p>
            <h2 class="mt-2 text-2xl font-black text-slate-950">
              三遊戲狀態
            </h2>
          </div>
          <button
            type="button"
            class="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            @click="go('/admin/campaigns')"
          >
            前往活動管理
          </button>
        </div>

        <div class="grid gap-4 lg:grid-cols-3">
          <article
            v-for="game in gameCards"
            :key="game.type"
            class="rounded-3xl border p-5 shadow-sm"
            :class="game.isActive ? 'border-emerald-100 bg-emerald-50/50' : game.hasCampaign ? 'border-amber-100 bg-amber-50/50' : 'border-slate-200 bg-slate-50'"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-3xl">{{ game.icon }}</p>
                <h3 class="mt-2 text-xl font-black text-slate-950">
                  {{ game.title }}
                </h3>
                <p class="mt-2 text-xs font-bold leading-5 text-slate-500">
                  {{ game.description }}
                </p>
              </div>
              <span
                class="rounded-full px-3 py-1 text-xs font-black"
                :class="game.isActive ? 'bg-emerald-100 text-emerald-700' : game.hasCampaign ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'"
              >
                {{ game.hasCampaign ? game.status : '未建立' }}
              </span>
            </div>

            <div class="mt-4 grid grid-cols-3 gap-2 text-center">
              <div class="rounded-2xl bg-white p-3">
                <p class="text-[11px] font-black text-slate-400">序號</p>
                <p class="mt-1 text-lg font-black text-slate-950">{{ game.serialTotal }}</p>
              </div>
              <div class="rounded-2xl bg-white p-3">
                <p class="text-[11px] font-black text-slate-400">可用</p>
                <p class="mt-1 text-lg font-black text-emerald-700">{{ game.serialUnused }}</p>
              </div>
              <div class="rounded-2xl bg-white p-3">
                <p class="text-[11px] font-black text-slate-400">剩餘</p>
                <p class="mt-1 text-lg font-black text-blue-700">{{ game.serialRemaining }}</p>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                class="rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white transition hover:bg-slate-800"
                @click="go('/admin/campaigns')"
              >
                活動管理
              </button>
              <button
                type="button"
                class="rounded-2xl border border-indigo-200 bg-white px-4 py-3 text-xs font-black text-indigo-700 transition hover:bg-indigo-50"
                @click="goGameSerials(game)"
              >
                序號管理
              </button>
              <button
                type="button"
                class="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-xs font-black text-emerald-700 transition hover:bg-emerald-50"
                @click="copyText(game.playerUrl, '已複製玩家網址')"
              >
                複製網址
              </button>
              <button
                type="button"
                class="rounded-2xl border border-blue-200 bg-white px-4 py-3 text-xs font-black text-blue-700 transition hover:bg-blue-50"
                @click="go('/admin/reports')"
              >
                查看報表
              </button>
            </div>
          </article>
        </div>
      </div>

      <div class="space-y-5">
        <section class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
                Next Actions
              </p>
              <h2 class="mt-2 text-2xl font-black text-slate-950">
                商家下一步
              </h2>
            </div>
            <span class="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-500">
              建議操作
            </span>
          </div>

          <div class="mt-5 grid gap-3">
            <article
              v-for="item in nextActionCards"
              :key="item.title"
              class="rounded-3xl border p-4"
              :class="{
                'border-amber-100 bg-amber-50': item.tone === 'amber',
                'border-emerald-100 bg-emerald-50': item.tone === 'emerald',
                'border-indigo-100 bg-indigo-50': item.tone === 'indigo',
                'border-blue-100 bg-blue-50': item.tone === 'blue',
                'border-slate-200 bg-slate-50': item.tone === 'slate'
              }"
            >
              <div class="flex items-start gap-3">
                <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                  {{ item.icon }}
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="font-black text-slate-950">{{ item.title }}</h3>
                  <p class="mt-1 text-sm font-bold leading-6 text-slate-600">{{ item.description }}</p>
                  <button
                    type="button"
                    class="mt-3 rounded-2xl bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                    @click="go(item.to)"
                  >
                    {{ item.buttonText }}
                  </button>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
                Quick Links
              </p>
              <h2 class="mt-2 text-2xl font-black text-slate-950">
                快速入口
              </h2>
            </div>
          </div>

          <div class="mt-5 grid grid-cols-2 gap-3">
            <button class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50" @click="go('/admin/my-games')">我的遊戲中心</button>
            <button class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50" @click="go('/admin/campaigns')">活動管理</button>
            <button class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50" @click="go('/admin/my-serials')">我的序號管理</button>
            <button class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50" @click="go('/admin/reports')">報表中心</button>
            <button class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-700 hover:bg-amber-100" @click="go('/admin/rewards')">發獎核銷</button>
            <button class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50" @click="go('/admin/account')">我的帳號</button>
          </div>
        </section>
      </div>
    </section>

    <section class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div class="mb-5 flex items-center justify-between gap-3">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
            Recent Rewards
          </p>
          <h2 class="mt-2 text-2xl font-black text-slate-950">
            最近發獎核銷
          </h2>
        </div>
        <button
          type="button"
          class="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
          @click="go('/admin/rewards')"
        >
          查看全部
        </button>
      </div>

      <div
        v-if="!recentRewardCards.length"
        class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm font-bold text-slate-500"
      >
        目前沒有最近發獎紀錄。
      </div>

      <div
        v-else
        class="grid gap-3 md:grid-cols-2 xl:grid-cols-5"
      >
        <article
          v-for="reward in recentRewardCards"
          :key="reward.id"
          class="rounded-3xl border border-slate-100 bg-slate-50 p-4"
        >
          <span
            class="rounded-full px-3 py-1 text-xs font-black"
            :class="getStatusClass(reward.status || 'UNUSED')"
          >
            {{ reward.status || 'UNUSED' }}
          </span>
          <h3 class="mt-3 line-clamp-2 text-sm font-black text-slate-950">
            {{ getRewardTitle(reward) }}
          </h3>
          <p class="mt-2 text-xs font-bold text-slate-500">
            {{ getRewardMember(reward) }}
          </p>
          <p class="mt-2 text-xs font-bold text-slate-400">
            {{ formatDateTime(reward.createdAt) }}
          </p>
        </article>
      </div>
    </section>
  </div>
</template>
