<script setup>
// Multi Game Platform V2.3
// 第 38001～38400 批：模板預覽與商家正式玩家頁對齊修正版
//
// 建議放置位置：
// frontend/src/views/admin/AdminMerchantGameCenterView.vue
//
// 本頁目的：
// 1. 給商家一個簡單、精緻、正式營運用的入口。
// 2. 只顯示商家最常用的三個正式遊戲：輪盤、九宮格、砸金蛋。
// 3. 每個遊戲提供玩家網址、複製網址、開啟玩家頁、到活動管理、序號管理、報表入口。\n// 4. 此頁才是商家真正會看到的遊戲操作中心；平台模板中心不再當作商家操作入口。
// 4. 不再讓商家誤進「遊戲模板中心」或 debug 頁。

import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getAdminCampaignsApi } from '../../api/campaign'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const campaigns = ref([])
const loading = ref(false)
const loadError = ref('')
const copiedMessage = ref('')

const officialFrontendBase = computed(() => {
  const envUrl = import.meta.env.VITE_PUBLIC_FRONTEND_URL || ''

  if (envUrl) {
    return String(envUrl).replace(/\/$/, '')
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }

  return 'https://marketing-game-v1.vercel.app'
})

const tenantSlug = computed(() => {
  return (
    authStore.user?.tenantSlug ||
    authStore.user?.tenant?.slug ||
    authStore.user?.merchantSlug ||
    'a-shop'
  )
})

const tenantName = computed(() => {
  return (
    authStore.user?.tenantName ||
    authStore.user?.tenant?.name ||
    tenantSlug.value ||
    '目前商家'
  )
})

const role = computed(() => String(authStore.user?.role || '').toUpperCase())
const isPlatformAdmin = computed(() => ['ADMIN', 'SUPER_ADMIN'].includes(role.value))

const merchantCenterNotice = computed(() => {
  return isPlatformAdmin.value
    ? '平台管理員目前看到的是商家交付版入口，用來確認商家拿到的玩家網址與操作按鈕。'
    : '這裡只顯示你目前正式可用的遊戲。若要新增其他遊戲，請聯絡平台管理員開通。'
})

const gameCards = computed(() => {
  const gameDefinitions = [
    {
      type: 'WHEEL',
      key: 'wheel',
      path: 'wheel',
      emoji: '🎡',
      title: '幸運輪盤',
      subtitle: '轉盤抽獎活動',
      gradient: 'from-amber-400 via-orange-500 to-rose-500',
      accentClass: 'bg-orange-50 text-orange-700 border-orange-100',
      description: '適合直播、門市、社群導流，用序號控制抽獎次數。'
    },
    {
      type: 'GRID',
      key: 'premium-grid',
      path: 'premium-grid',
      emoji: '🎁',
      title: '精緻九宮格',
      subtitle: '九宮格跑燈抽獎',
      gradient: 'from-yellow-300 via-orange-400 to-orange-600',
      accentClass: 'bg-yellow-50 text-yellow-700 border-yellow-100',
      description: '適合優惠券、點數、小禮物與大獎活動，手機體驗清楚。'
    },
    {
      type: 'GOLDEN_EGG',
      key: 'golden-egg',
      path: 'golden-egg',
      emoji: '🥚',
      title: '砸金蛋',
      subtitle: '金蛋互動抽獎',
      gradient: 'from-red-500 via-rose-600 to-red-900',
      accentClass: 'bg-red-50 text-red-700 border-red-100',
      description: '適合節慶、會員回饋與高互動促銷，搭配音效更有感。'
    }
  ]

  return gameDefinitions.map((game) => {
    const matched = campaigns.value.find((campaign) => {
      return String(campaign.gameType || '').toUpperCase() === game.type
    })

    const campaignId = matched?.id || ''
    const playerUrl = campaignId
      ? `${officialFrontendBase.value}/play/${tenantSlug.value}/${game.path}?campaignId=${campaignId}`
      : `${officialFrontendBase.value}/play/${tenantSlug.value}/${game.path}`

    return {
      ...game,
      campaign: matched || null,
      campaignId,
      playerUrl,
      status: matched?.status || 'NOT_CREATED',
      hasCampaign: Boolean(matched?.id),
      isActive: String(matched?.status || '').toUpperCase() === 'ACTIVE'
    }
  })
})

const activeGameCount = computed(() => gameCards.value.filter((item) => item.isActive).length)
const createdGameCount = computed(() => gameCards.value.filter((item) => item.hasCampaign).length)

const statusTextMap = {
  ACTIVE: '啟用中',
  DRAFT: '草稿',
  INACTIVE: '已停用',
  ENDED: '已結束',
  NOT_CREATED: '尚未建立'
}

const getStatusText = (status) => {
  return statusTextMap[String(status || 'NOT_CREATED').toUpperCase()] || status || '未知'
}

const getStatusClass = (item) => {
  if (!item.hasCampaign) return 'bg-slate-100 text-slate-500 border-slate-200'
  if (item.isActive) return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  return 'bg-amber-100 text-amber-700 border-amber-200'
}

const loadCampaigns = async () => {
  loading.value = true
  loadError.value = ''

  try {
    const response = await getAdminCampaignsApi()
    const payload = response?.data?.data ?? response?.data ?? []
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.campaigns)
          ? payload.campaigns
          : []

    const currentTenantSlug = tenantSlug.value

    campaigns.value = list.filter((campaign) => {
      const gameType = String(campaign.gameType || '').toUpperCase()
      const campaignTenantSlug = campaign.tenant?.slug || campaign.tenantSlug || campaign.merchantSlug || currentTenantSlug
      const isTargetGame = ['WHEEL', 'GRID', 'GOLDEN_EGG'].includes(gameType)

      if (isPlatformAdmin.value) return isTargetGame

      return isTargetGame && String(campaignTenantSlug || '') === String(currentTenantSlug || '')
    })
  } catch (error) {
    console.error('載入商家遊戲中心失敗:', error)
    loadError.value = error?.response?.data?.message || error?.message || '載入遊戲活動失敗，請稍後再試。'
  } finally {
    loading.value = false
  }
}

const copyText = async (text) => {
  if (!text) return

  try {
    await navigator.clipboard.writeText(text)
    copiedMessage.value = '已複製到剪貼簿'
  } catch (error) {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copiedMessage.value = '已複製到剪貼簿'
  }

  window.setTimeout(() => {
    copiedMessage.value = ''
  }, 1800)
}

const copyPlayerUrl = (item) => {
  copyText(item.playerUrl)
}

const openPlayerUrl = (item) => {
  window.open(item.playerUrl, '_blank', 'noopener,noreferrer')
}

const goCampaigns = (item = null) => {
  router.push({
    path: '/admin/campaigns',
    query: item?.campaignId
      ? {
          campaignId: item.campaignId,
          gameType: item.type
        }
      : {}
  })
}

const goSerials = (item) => {
  router.push({
    path: '/admin/campaigns',
    query: {
      campaignId: item.campaignId || '',
      gameType: item.type,
      panel: 'serials'
    }
  })
}

const goPrizes = (item) => {
  if (!item.campaignId) {
    goCampaigns(item)
    return
  }

  router.push({
    path: '/admin/prizes',
    query: {
      campaignId: item.campaignId,
      gameType: item.type
    }
  })
}

const goReports = (item) => {
  router.push({
    path: '/admin/reports',
    query: item?.campaignId
      ? {
          campaignId: item.campaignId,
          gameType: item.type
        }
      : {}
  })
}

const copyCustomerText = () => {
  const lines = [
    `您好，這是 ${tenantName.value} 的抽獎活動網址：`,
    '',
    ...gameCards.value
      .filter((item) => item.hasCampaign)
      .map((item) => `${item.title}：\n${item.playerUrl}`),
    '',
    '請輸入店家提供的活動序號後即可參加抽獎。'
  ]

  copyText(lines.join('\n'))
}

onMounted(() => {
  loadCampaigns()
})
</script>

<template>
  <div class="space-y-6 p-4 sm:p-6 lg:p-8">
    <section class="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div class="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 px-6 py-7 text-white md:px-8">
        <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.25em] text-cyan-200">
              Merchant Game Center｜第 36401～36800 批
            </p>
            <h1 class="mt-3 text-3xl font-black tracking-tight md:text-4xl">
              商家遊戲中心
            </h1>
            <p class="mt-3 max-w-3xl text-sm font-bold leading-7 text-slate-300">
              這裡是正式給商家使用的簡化入口。要修改商家的遊戲，不用進複雜的模板頁，直接從這裡進入輪盤、九宮格、砸金蛋的活動、序號、獎項與報表。
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div class="rounded-3xl bg-white/10 px-5 py-4 text-center ring-1 ring-white/10">
              <p class="text-2xl font-black">{{ createdGameCount }}</p>
              <p class="mt-1 text-xs font-bold text-slate-300">已建立</p>
            </div>
            <div class="rounded-3xl bg-white/10 px-5 py-4 text-center ring-1 ring-white/10">
              <p class="text-2xl font-black">{{ activeGameCount }}</p>
              <p class="mt-1 text-xs font-bold text-slate-300">啟用中</p>
            </div>
            <button
              type="button"
              class="rounded-3xl bg-cyan-300 px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
              @click="loadCampaigns"
            >
              重新整理
            </button>
          </div>
        </div>
      </div>

      <div class="grid gap-4 border-t border-slate-100 bg-slate-50 px-6 py-5 md:grid-cols-3 md:px-8">
        <div class="rounded-3xl bg-white p-4 shadow-sm">
          <p class="text-xs font-black text-slate-400">目前商家</p>
          <p class="mt-1 text-lg font-black text-slate-950">{{ tenantName }}</p>
          <p class="mt-1 text-xs font-bold text-slate-500">slug：{{ tenantSlug }}</p>
        </div>
        <div class="rounded-3xl bg-white p-4 shadow-sm">
          <p class="text-xs font-black text-slate-400">正式前台</p>
          <p class="mt-1 break-all text-sm font-black text-slate-950">{{ officialFrontendBase }}</p>
        </div>
        <div class="rounded-3xl bg-white p-4 shadow-sm">
          <p class="text-xs font-black text-slate-400">建議操作</p>
          <p class="mt-1 text-sm font-bold leading-6 text-slate-600">
            建立活動 → 建立序號 → 設定獎項 → 複製玩家網址 → 查看報表。
          </p>
        </div>
      </div>
    </section>

    <p
      v-if="copiedMessage"
      class="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-700"
    >
      {{ copiedMessage }}
    </p>

    <p
      v-if="loadError"
      class="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-black text-rose-700"
    >
      {{ loadError }}
    </p>

    <section class="grid gap-5 xl:grid-cols-3">
      <article
        v-for="item in gameCards"
        :key="item.type"
        class="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"
      >
        <div :class="['bg-gradient-to-br px-6 py-6 text-white', item.gradient]">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-5xl drop-shadow-sm">{{ item.emoji }}</p>
              <h2 class="mt-4 text-2xl font-black">{{ item.title }}</h2>
              <p class="mt-1 text-sm font-bold text-white/85">{{ item.subtitle }}</p>
            </div>
            <span :class="['rounded-full border px-3 py-1 text-xs font-black', getStatusClass(item)]">
              {{ getStatusText(item.status) }}
            </span>
          </div>
          <p class="mt-4 text-sm font-bold leading-7 text-white/90">
            {{ item.description }}
          </p>
        </div>

        <div class="space-y-4 p-6">
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-3xl bg-slate-50 p-4">
              <p class="text-xs font-black text-slate-400">活動 ID</p>
              <p class="mt-1 text-2xl font-black text-slate-950">{{ item.campaignId || '-' }}</p>
            </div>
            <div class="rounded-3xl bg-slate-50 p-4">
              <p class="text-xs font-black text-slate-400">活動狀態</p>
              <p class="mt-1 text-lg font-black text-slate-950">{{ getStatusText(item.status) }}</p>
            </div>
          </div>

          <div class="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-xs font-black text-slate-400">正式玩家網址</p>
            <p class="mt-2 break-all font-mono text-xs font-bold leading-6 text-slate-700">
              {{ item.playerUrl }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
              @click="openPlayerUrl(item)"
            >
              開啟玩家頁
            </button>
            <button
              type="button"
              class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              @click="copyPlayerUrl(item)"
            >
              複製網址
            </button>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-black text-indigo-700 transition hover:bg-indigo-100"
              @click="goCampaigns(item)"
            >
              編輯活動
            </button>
            <button
              type="button"
              class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-700 transition hover:bg-amber-100"
              @click="goSerials(item)"
            >
              管理序號
            </button>
            <button
              type="button"
              class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
              @click="goPrizes(item)"
            >
              管理獎項
            </button>
            <button
              type="button"
              class="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-black text-cyan-700 transition hover:bg-cyan-100"
              @click="goReports(item)"
            >
              查看報表
            </button>
          </div>

          <p
            v-if="!item.hasCampaign"
            class="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-6 text-amber-700"
          >
            目前尚未建立這個遊戲的正式活動。請先到「活動管理」建立並啟用活動，再回來複製玩家網址。
          </p>
        </div>
      </article>
    </section>

    <section class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 class="text-xl font-black text-slate-950">商家客服文字</h2>
          <p class="mt-2 text-sm font-bold leading-6 text-slate-500">
            可以直接複製貼到 LINE、簡訊、社群貼文或客服對話。
          </p>
        </div>
        <button
          type="button"
          class="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
          @click="copyCustomerText"
        >
          複製客服文字
        </button>
      </div>

      <div class="mt-5 rounded-3xl bg-slate-50 p-5 text-sm font-bold leading-7 text-slate-600">
        <p>您好，這是 {{ tenantName }} 的抽獎活動網址：</p>
        <template
          v-for="item in gameCards.filter((game) => game.hasCampaign)"
          :key="item.type"
        >
          <p class="mt-3 font-black text-slate-950">{{ item.title }}</p>
          <p class="break-all font-mono text-xs">{{ item.playerUrl }}</p>
        </template>
        <p class="mt-3">請輸入店家提供的活動序號後即可參加抽獎。</p>
      </div>
    </section>

    <section class="rounded-[2rem] border border-blue-100 bg-blue-50 p-6">
      <h2 class="text-lg font-black text-blue-950">商家操作說明</h2>
      <div class="mt-4 grid gap-3 md:grid-cols-4">
        <div class="rounded-3xl bg-white p-4">
          <p class="text-2xl">1️⃣</p>
          <p class="mt-2 text-sm font-black text-slate-900">建立活動</p>
          <p class="mt-1 text-xs font-bold leading-5 text-slate-500">到活動管理建立輪盤、九宮格或砸金蛋。</p>
        </div>
        <div class="rounded-3xl bg-white p-4">
          <p class="text-2xl">2️⃣</p>
          <p class="mt-2 text-sm font-black text-slate-900">建立序號</p>
          <p class="mt-1 text-xs font-bold leading-5 text-slate-500">每個活動都要有自己的序號，不能跨活動共用。</p>
        </div>
        <div class="rounded-3xl bg-white p-4">
          <p class="text-2xl">3️⃣</p>
          <p class="mt-2 text-sm font-black text-slate-900">複製網址</p>
          <p class="mt-1 text-xs font-bold leading-5 text-slate-500">把正式玩家網址給客人或放到 LINE 官方帳號。</p>
        </div>
        <div class="rounded-3xl bg-white p-4">
          <p class="text-2xl">4️⃣</p>
          <p class="mt-2 text-sm font-black text-slate-900">看報表</p>
          <p class="mt-1 text-xs font-bold leading-5 text-slate-500">查看遊玩紀錄、中獎紀錄與發獎狀態。</p>
        </div>
      </div>
    </section>

    <div
      v-if="loading"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm"
    >
      <div class="rounded-3xl bg-white px-6 py-5 text-sm font-black text-slate-700 shadow-xl">
        載入商家遊戲中心中...
      </div>
    </div>
  </div>
</template>
