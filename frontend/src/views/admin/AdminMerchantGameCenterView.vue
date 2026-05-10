<script setup>
// Multi Game Platform V2.3
// 第 41601～42000 批：正式對客網址避免 localhost 交付修正版
//
// 建議放置位置：
// frontend/src/views/admin/AdminMerchantGameCenterView.vue
//
// 本頁目的：
// 1. 給商家一個簡單、精緻、正式營運用的入口。
// 2. 只顯示商家最常用的三個正式遊戲：輪盤、九宮格、砸金蛋。
// 3. 每個遊戲提供玩家網址、複製網址、開啟玩家頁、到活動管理、序號管理、報表入口。
// 4. 此頁才是商家真正會看到的遊戲操作中心；平台模板中心不再當作商家操作入口。
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
const customerTextEditMode = ref(false)
const customerTextDraft = ref('')
const savedCustomerText = ref('')

const CUSTOMER_TEXT_STORAGE_PREFIX = 'mgp_merchant_customer_text_v1'


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

const customerTextStorageKey = computed(() => {
  return `${CUSTOMER_TEXT_STORAGE_PREFIX}_${tenantSlug.value || 'default'}`
})

const generatedCustomerText = computed(() => {
  const activeGames = gameCards.value.filter((item) => item.hasCampaign)

  const lines = [
    `您好，這是 ${tenantName.value} 的抽獎活動網址：`,
    ''
  ]

  if (activeGames.length) {
    activeGames.forEach((item) => {
      lines.push(`${item.title}：`)
      lines.push(item.playerUrl)
      lines.push('')
    })
  } else {
    lines.push('目前活動尚未建立完成，請稍後再確認活動網址。')
    lines.push('')
  }

  lines.push('請輸入店家提供的活動序號後即可參加抽獎。')
  lines.push('中獎後請依店家公告方式兌換獎品。')

  return lines.join('\n').trim()
})

const displayCustomerText = computed(() => {
  return savedCustomerText.value || generatedCustomerText.value
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
const totalGameCount = computed(() => gameCards.value.length)
const readyGameCount = computed(() => {
  return gameCards.value.filter((item) => getReadinessPercent(item) >= 75).length
})

const operationOverview = computed(() => {
  const created = createdGameCount.value
  const active = activeGameCount.value
  const pending = Math.max(totalGameCount.value - created, 0)

  return [
    {
      label: '正式遊戲',
      value: `${created} / ${totalGameCount.value}`,
      description: '已建立活動數',
      icon: '🎮',
      tone: 'slate'
    },
    {
      label: '啟用中',
      value: active,
      description: '目前可交付客人的活動',
      icon: '✅',
      tone: 'emerald'
    },
    {
      label: '待建立',
      value: pending,
      description: '尚未建立正式活動',
      icon: '🧩',
      tone: 'amber'
    },
    {
      label: '準備完成',
      value: readyGameCount.value,
      description: '完成度達 75% 以上',
      icon: '🚀',
      tone: 'blue'
    }
  ]
})

const notCreatedGameCount = computed(() => gameCards.value.filter((item) => !item.hasCampaign).length)
const inactiveGameCount = computed(() => gameCards.value.filter((item) => item.hasCampaign && !item.isActive).length)

const operationSteps = [
  {
    step: '01',
    title: '確認活動',
    description: '先確認輪盤、九宮格、砸金蛋是否已建立並啟用。',
    action: '活動管理',
    icon: '📣'
  },
  {
    step: '02',
    title: '建立序號',
    description: '每個活動都要建立自己的序號，客人才能驗證遊玩。',
    action: '管理序號',
    icon: '🎟️'
  },
  {
    step: '03',
    title: '確認獎項',
    description: '檢查獎項名稱、庫存與兌換說明，避免客人中獎後不清楚。',
    action: '管理獎項',
    icon: '🎁'
  },
  {
    step: '04',
    title: '複製網址',
    description: '把正式玩家網址貼到 LINE、簡訊、社群或門市 QR Code。',
    action: '複製玩家網址',
    icon: '🔗'
  },
  {
    step: '05',
    title: '查看報表',
    description: '活動開始後，到報表中心追蹤遊玩、中獎與兌獎紀錄。',
    action: '查看報表',
    icon: '📊'
  }
]

const deliveryChecklist = computed(() => [
  {
    label: '已建立正式活動',
    done: createdGameCount.value > 0,
    description: `${createdGameCount.value} / 3 個遊戲已有活動`
  },
  {
    label: '至少一個活動啟用',
    done: activeGameCount.value > 0,
    description: `${activeGameCount.value} 個活動啟用中`
  },
  {
    label: '可複製玩家網址',
    done: gameCards.value.some((item) => item.playerUrl),
    description: '玩家網址已依商家 slug 自動產生'
  },
  {
    label: '可查看營運資料',
    done: true,
    description: '可由報表中心與發獎核銷追蹤結果'
  }
])

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

const getCampaignTitle = (item) => {
  return item?.campaign?.title || item?.campaign?.name || '尚未建立正式活動'
}

const getNextActionText = (item) => {
  if (!item.hasCampaign) return '先建立活動'
  if (!item.isActive) return '確認活動狀態'
  return '可直接交付客人'
}

const getReadinessItems = (item = {}) => {
  return [
    {
      label: '活動已建立',
      done: Boolean(item.hasCampaign),
      hint: item.hasCampaign ? '已找到正式活動' : '請先到活動管理建立活動'
    },
    {
      label: '活動已啟用',
      done: Boolean(item.isActive),
      hint: item.isActive ? '玩家可進入活動' : '請確認活動狀態為進行中'
    },
    {
      label: '玩家網址可用',
      done: Boolean(item.playerUrl),
      hint: item.playerUrl ? '可複製給客人' : '缺少玩家網址'
    },
    {
      label: '序號入口已備妥',
      done: Boolean(item.hasCampaign),
      hint: item.hasCampaign ? '可進入管理序號' : '活動建立後才能管理序號'
    },
    {
      label: '報表入口已備妥',
      done: Boolean(item.hasCampaign),
      hint: item.hasCampaign ? '可查看遊玩與中獎紀錄' : '活動建立後才能查看報表'
    }
  ]
}

const getReadinessPercent = (item = {}) => {
  const checklist = getReadinessItems(item)
  const done = checklist.filter((step) => step.done).length

  return Math.round((done / checklist.length) * 100)
}

const getReadinessClass = (item = {}) => {
  const percent = getReadinessPercent(item)

  if (percent >= 80) return 'bg-emerald-500'
  if (percent >= 50) return 'bg-amber-400'
  return 'bg-slate-400'
}

const getReadinessTextClass = (item = {}) => {
  const percent = getReadinessPercent(item)

  if (percent >= 80) return 'text-emerald-700'
  if (percent >= 50) return 'text-amber-700'
  return 'text-slate-500'
}

const buildHandoffPackageText = () => {
  const lines = [
    `【${tenantName.value} 抽獎活動交付包】`,
    '',
    '一、玩家活動網址'
  ]

  gameCards.value.forEach((item) => {
    lines.push(`${item.title}：${item.playerUrl}`)
  })

  lines.push('')
  lines.push('二、操作提醒')
  lines.push('1. 請先確認活動狀態為進行中。')
  lines.push('2. 每個活動都要建立自己的序號，不能跨活動共用。')
  lines.push('3. 客人輸入店家提供的序號後即可參加抽獎。')
  lines.push('4. 中獎後請依店家公告方式兌換獎品。')
  lines.push('')
  lines.push('三、客服文案')
  lines.push(displayCustomerText.value)
  lines.push('')
  lines.push('四、後台操作')
  lines.push('商家可到「我的遊戲中心」管理網址、序號、獎項、報表與發獎核銷。')

  return lines.join('\n')
}

const copyHandoffPackage = () => {
  copyText(buildHandoffPackageText())
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

const loadCustomerText = () => {
  try {
    savedCustomerText.value = localStorage.getItem(customerTextStorageKey.value) || ''
  } catch (error) {
    console.warn('讀取客服文字失敗:', error)
    savedCustomerText.value = ''
  }
}

const startEditCustomerText = () => {
  customerTextDraft.value = displayCustomerText.value
  customerTextEditMode.value = true
}

const cancelEditCustomerText = () => {
  customerTextDraft.value = ''
  customerTextEditMode.value = false
}

const saveCustomerText = () => {
  const text = customerTextDraft.value.trim()

  try {
    if (text) {
      localStorage.setItem(customerTextStorageKey.value, text)
      savedCustomerText.value = text
    } else {
      localStorage.removeItem(customerTextStorageKey.value)
      savedCustomerText.value = ''
    }

    customerTextEditMode.value = false
    copiedMessage.value = '客服文字已儲存'
    window.setTimeout(() => {
      copiedMessage.value = ''
    }, 1800)
  } catch (error) {
    console.error('儲存客服文字失敗:', error)
    loadError.value = '儲存客服文字失敗，請稍後再試。'
  }
}

const resetCustomerText = () => {
  try {
    localStorage.removeItem(customerTextStorageKey.value)
    savedCustomerText.value = ''
    customerTextDraft.value = generatedCustomerText.value
    copiedMessage.value = '已還原預設客服文字'
    window.setTimeout(() => {
      copiedMessage.value = ''
    }, 1800)
  } catch (error) {
    console.error('還原客服文字失敗:', error)
    loadError.value = '還原客服文字失敗，請稍後再試。'
  }
}

const copyCustomerText = () => {
  copyText(displayCustomerText.value)
}

onMounted(() => {
  loadCustomerText()
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
              Merchant Game Center｜第 41601～42000 批
            </p>
            <h1 class="mt-3 text-3xl font-black tracking-tight md:text-4xl">
              商家遊戲中心
            </h1>
            <p class="mt-3 max-w-3xl text-sm font-bold leading-7 text-slate-300">
              這裡是商家正式交付入口。商家要給客人遊玩、複製玩家網址、管理序號、檢查獎項與查看報表，都從這裡開始，不需要進平台模板中心。
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
            <div class="rounded-3xl bg-white/10 px-5 py-4 text-center ring-1 ring-white/10">
              <p class="text-2xl font-black">{{ notCreatedGameCount }}</p>
              <p class="mt-1 text-xs font-bold text-slate-300">待建立</p>
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


    <section class="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
      <div class="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
              Official Handoff
            </p>
            <h2 class="mt-2 text-2xl font-black text-emerald-950">
              商家正式交付檢查
            </h2>
            <p class="mt-2 text-sm font-bold leading-6 text-emerald-700">
              給商家或客人之前，先確認活動、網址、序號與報表入口都能正常使用。
            </p>
          </div>
          <div class="rounded-3xl bg-white px-5 py-4 text-center shadow-sm">
            <p class="text-3xl font-black text-emerald-700">{{ activeGameCount }}</p>
            <p class="mt-1 text-xs font-black text-slate-500">可交付遊戲</p>
          </div>
        </div>

        <div class="mt-5 grid gap-3 md:grid-cols-2">
          <div
            v-for="item in deliveryChecklist"
            :key="item.label"
            class="rounded-3xl border bg-white p-4"
            :class="item.done ? 'border-emerald-100' : 'border-amber-100'"
          >
            <div class="flex items-start gap-3">
              <span
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-sm font-black"
                :class="item.done ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'"
              >
                {{ item.done ? '✓' : '!' }}
              </span>
              <div>
                <p class="text-sm font-black text-slate-950">{{ item.label }}</p>
                <p class="mt-1 text-xs font-bold leading-5 text-slate-500">{{ item.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-sm">
        <p class="text-xs font-black uppercase tracking-[0.2em] text-blue-500">
          Merchant Guide
        </p>
        <h2 class="mt-2 text-2xl font-black text-slate-950">
          商家操作導引
        </h2>
        <div class="mt-5 space-y-3">
          <div
            v-for="step in operationSteps"
            :key="step.step"
            class="rounded-3xl border border-slate-100 bg-slate-50 p-4"
          >
            <div class="flex items-start gap-3">
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                {{ step.icon }}
              </div>
              <div>
                <p class="text-sm font-black text-slate-950">
                  {{ step.step }}｜{{ step.title }}
                </p>
                <p class="mt-1 text-xs font-bold leading-5 text-slate-500">
                  {{ step.description }}
                </p>
                <p class="mt-2 text-xs font-black text-blue-600">
                  建議點：{{ step.action }}
                </p>
              </div>
            </div>
          </div>
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


    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="item in operationOverview"
        :key="item.label"
        class="rounded-[2rem] border bg-white p-5 shadow-sm"
        :class="{
          'border-slate-200': item.tone === 'slate',
          'border-emerald-100 bg-emerald-50': item.tone === 'emerald',
          'border-amber-100 bg-amber-50': item.tone === 'amber',
          'border-blue-100 bg-blue-50': item.tone === 'blue'
        }"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              {{ item.label }}
            </p>
            <p class="mt-3 text-3xl font-black text-slate-950">
              {{ item.value }}
            </p>
            <p class="mt-2 text-xs font-bold leading-5 text-slate-500">
              {{ item.description }}
            </p>
          </div>
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
            {{ item.icon }}
          </div>
        </div>
      </div>
    </section>

    <section class="overflow-hidden rounded-[2rem] border border-indigo-100 bg-white shadow-sm">
      <div class="grid gap-0 xl:grid-cols-[1fr_0.9fr]">
        <div class="bg-gradient-to-br from-indigo-950 via-slate-950 to-slate-900 p-6 text-white">
          <p class="text-xs font-black uppercase tracking-[0.24em] text-cyan-200">
            Handoff Package
          </p>
          <h2 class="mt-3 text-2xl font-black">
            一鍵複製完整交付包
          </h2>
          <p class="mt-3 text-sm font-bold leading-7 text-white/75">
            交付包會包含三個遊戲玩家網址、客服文字、序號提醒與兌獎提醒。適合直接貼給商家、門市人員或客服。
          </p>
          <div class="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              class="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
              @click="copyHandoffPackage"
            >
              複製完整交付包
            </button>
            <button
              type="button"
              class="rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
              @click="startEditCustomerText"
            >
              編輯客服文案
            </button>
          </div>
        </div>

        <div class="space-y-3 bg-indigo-50/60 p-6">
          <div
            v-for="item in gameCards"
            :key="`ready-${item.type}`"
            class="rounded-3xl border border-white bg-white/90 p-4"
          >
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-sm font-black text-slate-950">{{ item.title }}</p>
                <p class="mt-1 text-xs font-bold text-slate-500">{{ getNextActionText(item) }}</p>
              </div>
              <p
                class="text-2xl font-black"
                :class="getReadinessTextClass(item)"
              >
                {{ getReadinessPercent(item) }}%
              </p>
            </div>
            <div class="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                class="h-full rounded-full transition-all"
                :class="getReadinessClass(item)"
                :style="{ width: `${getReadinessPercent(item)}%` }"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

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

          <div class="rounded-3xl border border-indigo-100 bg-indigo-50 p-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xs font-black text-indigo-500">目前活動</p>
                <p class="mt-1 text-sm font-black text-slate-950">{{ getCampaignTitle(item) }}</p>
              </div>
              <span class="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-indigo-700">
                {{ getNextActionText(item) }}
              </span>
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
            可以自行修改文字，儲存後會記住這個商家的文案，再複製到 LINE、簡訊、社群貼文或客服對話。
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            v-if="!customerTextEditMode"
            type="button"
            class="rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-black text-indigo-700 transition hover:bg-indigo-100"
            @click="startEditCustomerText"
          >
            編輯文字
          </button>

          <button
            type="button"
            class="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
            @click="copyCustomerText"
          >
            複製客服文字
          </button>
        </div>
      </div>

      <div
        v-if="customerTextEditMode"
        class="mt-5 rounded-3xl border border-indigo-100 bg-indigo-50 p-5"
      >
        <label class="block">
          <span class="text-sm font-black text-indigo-900">可編輯客服文案</span>
          <textarea
            v-model="customerTextDraft"
            rows="10"
            class="mt-3 w-full rounded-2xl border border-indigo-100 bg-white px-4 py-3 text-sm font-bold leading-7 text-slate-700 outline-none transition focus:border-indigo-400"
            placeholder="請輸入要給客人的客服文字..."
          />
        </label>

        <div class="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            class="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            @click="cancelEditCustomerText"
          >
            取消
          </button>

          <button
            type="button"
            class="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-black text-amber-700 transition hover:bg-amber-100"
            @click="resetCustomerText"
          >
            還原預設
          </button>

          <button
            type="button"
            class="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-700"
            @click="saveCustomerText"
          >
            儲存文字
          </button>
        </div>
      </div>

      <div
        v-else
        class="mt-5 whitespace-pre-wrap rounded-3xl bg-slate-50 p-5 text-sm font-bold leading-7 text-slate-600"
      >
        {{ displayCustomerText }}
      </div>
    </section>

    <section class="rounded-[2rem] border border-blue-100 bg-blue-50 p-6">
      <h2 class="text-lg font-black text-blue-950">新手快速流程提醒</h2>
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
