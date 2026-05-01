<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCampaignDetailApi } from '../../api/campaign'
import PlatformNavbar from '../../components/PlatformNavbar.vue'
import PlatformFooter from '../../components/PlatformFooter.vue'
import BaseLoading from '../../components/common/BaseLoading.vue'
import BaseError from '../../components/common/BaseError.vue'
import BaseEmpty from '../../components/common/BaseEmpty.vue'
import BaseToast from '../../components/common/BaseToast.vue'
import { useToast } from '../../composables/useToast'
import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const campaign = ref(null)
const loading = ref(true)
const errorMessage = ref('')
const playNotice = ref('')

const {
  toast,
  showSuccess,
  showError,
  showWarning,
  showInfo,
  closeToast
} = useToast()

const gameMetaMap = {
  WHEEL: {
    label: '輪盤抽獎',
    emoji: '🎡',
    heroClass: 'from-blue-50 via-white to-cyan-50',
    badgeClass: 'border-blue-200 bg-blue-100 text-blue-700',
    buttonClass: 'bg-blue-600 hover:bg-blue-700',
    desc: '轉動輪盤，等待指針停下後揭曉獎項。',
    featureList: ['SVG 實體輪盤', '指針對位', 'WIN 慶祝特效']
  },
  FLIP: {
    label: '翻牌遊戲',
    emoji: '🎴',
    heroClass: 'from-fuchsia-50 via-white to-violet-50',
    badgeClass: 'border-fuchsia-200 bg-fuchsia-100 text-fuchsia-700',
    buttonClass: 'bg-fuchsia-600 hover:bg-fuchsia-700',
    desc: '選擇一張神秘卡牌，翻開後揭曉結果。',
    featureList: ['卡片翻轉', '結果彈窗', '資格錯誤提示']
  },
  GRID: {
    label: '九宮格遊戲',
    emoji: '🔲',
    heroClass: 'from-amber-50 via-white to-orange-50',
    badgeClass: 'border-amber-200 bg-amber-100 text-amber-700',
    buttonClass: 'bg-amber-500 hover:bg-amber-600',
    desc: '點選幸運格子，觸發九宮格抽獎結果。',
    featureList: ['3x3 九宮格', '格子閃爍動畫', '結果彈窗']
  },
  SCRATCH: {
    label: '刮刮樂',
    emoji: '🎫',
    heroClass: 'from-emerald-50 via-white to-lime-50',
    badgeClass: 'border-emerald-200 bg-emerald-100 text-emerald-700',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-700',
    desc: '滑動刮開刮刮卡表層，揭曉本次獎勵結果。',
    featureList: ['滑動刮開', '刮開進度', 'WIN 慶祝特效']
  }
}

const gameMeta = computed(() => {
  const type = String(campaign.value?.gameType || '').toUpperCase()

  return (
    gameMetaMap[type] || {
      label: type || '未知類型',
      emoji: '🧩',
      heroClass: 'from-slate-50 via-white to-slate-100',
      badgeClass: 'border-slate-200 bg-slate-100 text-slate-700',
      buttonClass: 'bg-slate-900 hover:bg-slate-800',
      desc: '這個活動目前尚未設定完整遊戲類型。',
      featureList: ['活動互動', '抽獎 API', '會員限制']
    }
  )
})

const currentUser = computed(() => authStore.user || {})
const isLoggedIn = computed(() => authStore.isLoggedIn)

const status = computed(() => {
  return String(campaign.value?.status || '').toUpperCase()
})

const statusMeta = computed(() => {
  if (status.value === 'ACTIVE') {
    return {
      label: '進行中',
      emoji: '🟢',
      class: 'border-emerald-200 bg-emerald-100 text-emerald-700'
    }
  }

  if (status.value === 'DRAFT') {
    return {
      label: '草稿',
      emoji: '⚪',
      class: 'border-slate-200 bg-slate-100 text-slate-700'
    }
  }

  if (status.value === 'INACTIVE') {
    return {
      label: '未啟用',
      emoji: '🟡',
      class: 'border-amber-200 bg-amber-100 text-amber-700'
    }
  }

  if (status.value === 'ENDED') {
    return {
      label: '已結束',
      emoji: '🔴',
      class: 'border-rose-200 bg-rose-100 text-rose-700'
    }
  }

  return {
    label: campaign.value?.status || '未知',
    emoji: '⚪',
    class: 'border-slate-200 bg-slate-100 text-slate-700'
  }
})

const now = computed(() => new Date())

const isBeforeStart = computed(() => {
  if (!campaign.value?.startAt) return false
  return new Date(campaign.value.startAt) > now.value
})

const isAfterEnd = computed(() => {
  if (!campaign.value?.endAt) return false
  return new Date(campaign.value.endAt) < now.value
})

const isRoleAllowed = computed(() => {
  if (!campaign.value?.allowedRole) return true

  const userRole = String(currentUser.value?.role || '').toUpperCase()
  const allowedRole = String(campaign.value.allowedRole || '').toUpperCase()

  return userRole === allowedRole
})

const isLevelAllowed = computed(() => {
  if (!campaign.value?.requiredLevel) return true

  const userLevel = String(currentUser.value?.memberLevel || '').toUpperCase()
  const requiredLevel = String(campaign.value.requiredLevel || '').toUpperCase()

  return userLevel === requiredLevel
})

const isLoginAllowed = computed(() => {
  if (!campaign.value?.requireLogin) return true
  return isLoggedIn.value
})

const prizeCount = computed(() => {
  return campaign.value?.prizes?.length || 0
})

const playableReason = computed(() => {
  if (!campaign.value) return '找不到活動資料'
  if (status.value !== 'ACTIVE') return '活動目前尚未啟用'
  if (isBeforeStart.value) return '活動尚未開始'
  if (isAfterEnd.value) return '活動已結束'
  if (!isLoginAllowed.value) return '本活動需要先登入'
  if (!isRoleAllowed.value) return `本活動限 ${campaign.value.allowedRole} 角色參加`
  if (!isLevelAllowed.value) return `本活動限 ${campaign.value.requiredLevel} 會員參加`
  if (prizeCount.value <= 0) return '活動尚未設定獎項'

  return ''
})

const isPlayable = computed(() => {
  return !playableReason.value
})

const playButtonText = computed(() => {
  if (isPlayable.value) return `開始遊玩 ${gameMeta.value.label}`

  return playableReason.value || '暫時無法遊玩'
})

const totalStock = computed(() => {
  return (campaign.value?.prizes || []).reduce((sum, prize) => {
    return sum + Number(prize.remainStock || 0)
  }, 0)
})

const totalProbability = computed(() => {
  return (campaign.value?.prizes || []).reduce((sum, prize) => {
    return sum + Number(prize.probability || 0)
  }, 0)
})

const loseProbability = computed(() => {
  const remain = 100 - totalProbability.value
  return remain > 0 ? remain : 0
})

const probabilityStatusText = computed(() => {
  if (totalProbability.value < 100) {
    return `目前獎項機率合計 ${formatPercent(totalProbability.value)}，剩餘 ${formatPercent(loseProbability.value)} 會視為未中獎。`
  }

  if (totalProbability.value === 100) {
    return '目前獎項機率合計剛好 100%。'
  }

  return `目前獎項機率合計 ${formatPercent(totalProbability.value)}，已超過 100%。`
})

const probabilityStatusClass = computed(() => {
  if (totalProbability.value < 100) {
    return 'border-blue-200 bg-blue-50 text-blue-700'
  }

  if (totalProbability.value === 100) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  return 'border-rose-200 bg-rose-50 text-rose-700'
})

const sortedPrizes = computed(() => {
  return [...(campaign.value?.prizes || [])].sort((a, b) => {
    return Number(b.remainStock || 0) - Number(a.remainStock || 0)
  })
})

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

const formatPercent = (value) => {
  const n = Number(value || 0)

  if (!Number.isFinite(n)) {
    return '0%'
  }

  return `${Number(n.toFixed(2))}%`
}

const getPrizeType = (title) => {
  const text = String(title || '').trim()

  if (['銘謝惠顧', '謝謝參加', '未中獎', '沒有中獎', '再接再厲'].includes(text)) {
    return {
      label: '未中獎項',
      emoji: '🙏',
      class: 'border-slate-200 bg-slate-100 text-slate-700'
    }
  }

  if (text === '再玩一次') {
    return {
      label: '再玩一次',
      emoji: '🔁',
      class: 'border-sky-200 bg-sky-100 text-sky-700'
    }
  }

  return {
    label: '獎品',
    emoji: '🎁',
    class: 'border-emerald-200 bg-emerald-100 text-emerald-700'
  }
}

const getStockPercent = (stock) => {
  const value = Number(stock || 0)

  if (value <= 0) return 0
  if (value >= 100) return 100

  return value
}

const getProbabilityPercent = (probability) => {
  const value = Number(probability || 0)

  if (value <= 0) return 0
  if (value >= 100) return 100

  return value
}

const getStockClass = (stock) => {
  const value = Number(stock || 0)

  if (value <= 0) return 'bg-rose-500'
  if (value <= 10) return 'bg-amber-500'

  return 'bg-emerald-500'
}

const getProbabilityClass = (probability) => {
  const value = Number(probability || 0)

  if (value <= 0) return 'bg-slate-400'
  if (value <= 10) return 'bg-blue-500'
  if (value <= 50) return 'bg-violet-500'

  return 'bg-fuchsia-500'
}

const fetchCampaignDetail = async (showToastMessage = false) => {
  loading.value = true
  errorMessage.value = ''
  playNotice.value = ''

  try {
    const res = await getCampaignDetailApi(route.params.id)
    campaign.value = res?.data?.data || null

    if (!campaign.value) {
      errorMessage.value = '找不到活動資料'
      showError('找不到活動資料', '此活動不存在，或目前無法讀取活動資料。')
      return
    }

    if (showToastMessage) {
      showSuccess('活動詳情已更新', '已取得最新活動資料')
    }
  } catch (error) {
    console.error('取得活動資料失敗:', error)

    errorMessage.value =
      error?.response?.data?.message ||
      error?.message ||
      '取得活動資料失敗'

    showError('取得活動詳情失敗', errorMessage.value)
  } finally {
    loading.value = false
  }
}

const goToPlay = () => {
  if (!isPlayable.value) {
    playNotice.value = playableReason.value || '此活動目前暫時無法遊玩'

    if (!isLoginAllowed.value) {
      showWarning('需要先登入', '登入後才能參加此活動')

      setTimeout(() => {
        router.push({
          path: '/login',
          query: {
            redirect: `/campaigns/${route.params.id}`
          }
        })
      }, 500)

      return
    }

    showInfo('目前無法遊玩', playNotice.value)
    return
  }

  router.push(`/play/${route.params.id}`)
}

const goToCampaigns = () => {
  showInfo('返回活動列表', '正在前往活動列表')

  setTimeout(() => {
    router.push('/campaigns')
  }, 300)
}

const goToGames = () => {
  showInfo('前往遊戲入口', '正在前往遊戲入口')

  setTimeout(() => {
    router.push('/games')
  }, 300)
}

const goLogin = () => {
  showWarning('需要先登入', '登入後才能參加此活動')

  setTimeout(() => {
    router.push({
      path: '/login',
      query: {
        redirect: `/campaigns/${route.params.id}`
      }
    })
  }, 500)
}

onMounted(() => {
  if (typeof authStore.restoreLogin === 'function') {
    authStore.restoreLogin()
  }

  fetchCampaignDetail()
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-slate-100">
    <PlatformNavbar />

    <main class="flex-1">
      <div class="mx-auto max-w-7xl px-4 py-8">
        <BaseLoading
          v-if="loading"
          title="載入活動資料中..."
          message="請稍候，系統正在取得活動詳情。"
        />

        <BaseError
          v-else-if="errorMessage"
          title="無法開啟活動"
          :message="errorMessage"
          buttonText="返回活動列表"
          @retry="goToCampaigns"
        />

        <div
          v-else-if="campaign"
          class="space-y-8"
        >
          <!-- Hero -->
          <section
            class="relative overflow-hidden rounded-[40px] border border-slate-200 bg-gradient-to-br p-8 shadow-sm md:p-12"
            :class="gameMeta.heroClass"
          >
            <div class="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/50 blur-3xl"></div>
            <div class="absolute -bottom-28 -left-24 h-96 w-96 rounded-full bg-white/60 blur-3xl"></div>

            <div class="relative z-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div>
                <div class="mb-5 flex flex-wrap items-center gap-3">
                  <span
                    class="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black"
                    :class="gameMeta.badgeClass"
                  >
                    <span>{{ gameMeta.emoji }}</span>
                    <span>{{ gameMeta.label }}</span>
                  </span>

                  <span
                    class="inline-flex gap-2 rounded-full border px-4 py-2 text-sm font-black"
                    :class="statusMeta.class"
                  >
                    <span>{{ statusMeta.emoji }}</span>
                    <span>{{ statusMeta.label }}</span>
                  </span>

                  <span class="inline-flex rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-black text-slate-700">
                    Activity ID #{{ campaign.id }}
                  </span>
                </div>

                <h1 class="text-4xl font-black leading-tight text-slate-900 md:text-6xl">
                  {{ campaign.title }}
                </h1>

                <p class="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
                  {{ campaign.description || '這個活動目前尚未填寫活動說明。' }}
                </p>

                <p class="mt-3 max-w-3xl text-sm font-bold text-slate-500">
                  {{ gameMeta.desc }}
                </p>

                <div
                  v-if="playNotice || playableReason"
                  class="mt-6 rounded-3xl border p-5 text-sm font-bold"
                  :class="isPlayable ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'"
                >
                  {{ playNotice || (isPlayable ? '此活動目前可以遊玩。' : playableReason) }}

                  <button
                    v-if="campaign.requireLogin && !isLoggedIn"
                    @click="goLogin"
                    class="ml-2 font-black underline"
                  >
                    前往登入
                  </button>
                </div>

                <div class="mt-8 flex flex-wrap gap-3">
                  <button
                    @click="goToPlay"
                    class="rounded-2xl px-6 py-3 text-base font-black text-white shadow transition"
                    :class="isPlayable ? gameMeta.buttonClass : 'bg-slate-400 cursor-not-allowed'"
                  >
                    {{ playButtonText }}
                  </button>

                  <button
                    @click="goToCampaigns"
                    class="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-base font-black text-slate-700 transition hover:bg-slate-50"
                  >
                    返回活動列表
                  </button>

                  <button
                    @click="goToGames"
                    class="rounded-2xl border border-slate-300 bg-white/80 px-6 py-3 text-base font-black text-slate-700 transition hover:bg-white"
                  >
                    遊戲入口
                  </button>

                  <button
                    @click="fetchCampaignDetail(true)"
                    class="rounded-2xl border border-slate-300 bg-white/80 px-6 py-3 text-base font-black text-slate-700 transition hover:bg-white"
                  >
                    重新整理
                  </button>
                </div>
              </div>

              <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div class="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur">
                  <div class="mb-2 text-sm font-bold text-slate-400">
                    活動期間
                  </div>
                  <div class="font-black text-slate-900">
                    {{ formatDateTime(campaign.startAt) }}
                  </div>
                  <div class="mt-1 font-black text-slate-900">
                    {{ formatDateTime(campaign.endAt) }}
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="rounded-3xl border border-white/70 bg-white/80 p-5 text-center shadow-sm backdrop-blur">
                    <p class="text-xs font-bold text-slate-400">
                      獎項數
                    </p>
                    <p class="mt-2 text-3xl font-black text-slate-900">
                      {{ prizeCount }}
                    </p>
                  </div>

                  <div class="rounded-3xl border border-white/70 bg-white/80 p-5 text-center shadow-sm backdrop-blur">
                    <p class="text-xs font-bold text-slate-400">
                      總庫存
                    </p>
                    <p class="mt-2 text-3xl font-black text-slate-900">
                      {{ totalStock }}
                    </p>
                  </div>
                </div>

                <div class="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur">
                  <div class="mb-3 text-sm font-bold text-slate-400">
                    遊戲特色
                  </div>

                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="feature in gameMeta.featureList"
                      :key="feature"
                      class="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700"
                    >
                      {{ feature }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Summary -->
          <section class="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div class="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm">
              <p class="text-xs font-bold text-slate-400">
                每日次數
              </p>
              <p class="mt-2 text-2xl font-black text-slate-900">
                {{ campaign.dailyLimit ?? '不限' }}
              </p>
            </div>

            <div class="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm">
              <p class="text-xs font-bold text-slate-400">
                總次數
              </p>
              <p class="mt-2 text-2xl font-black text-slate-900">
                {{ campaign.totalLimit ?? '不限' }}
              </p>
            </div>

            <div class="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm">
              <p class="text-xs font-bold text-slate-400">
                登入限制
              </p>
              <p class="mt-2 text-2xl font-black text-slate-900">
                {{ campaign.requireLogin ? '需登入' : '免登入' }}
              </p>
            </div>

            <div class="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm">
              <p class="text-xs font-bold text-slate-400">
                會員限制
              </p>
              <p class="mt-2 text-2xl font-black text-slate-900">
                {{ campaign.requiredLevel || '不限' }}
              </p>
            </div>
          </section>

          <section class="grid gap-8 lg:grid-cols-[0.88fr_1.12fr]">
            <!-- Left -->
            <div class="space-y-6">
              <div class="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 class="mb-5 text-2xl font-black text-slate-900">
                  活動規則
                </h2>

                <div class="space-y-4 text-slate-700">
                  <div class="flex items-start gap-3">
                    <div class="mt-1 text-xl">✅</div>
                    <div>
                      <div class="font-bold text-slate-900">活動遊戲類型</div>
                      <div class="text-sm leading-7">{{ gameMeta.label }}</div>
                    </div>
                  </div>

                  <div class="flex items-start gap-3">
                    <div class="mt-1 text-xl">✅</div>
                    <div>
                      <div class="font-bold text-slate-900">每日遊玩次數</div>
                      <div class="text-sm leading-7">{{ campaign.dailyLimit ?? '不限次數' }}</div>
                    </div>
                  </div>

                  <div class="flex items-start gap-3">
                    <div class="mt-1 text-xl">✅</div>
                    <div>
                      <div class="font-bold text-slate-900">每人總遊玩次數</div>
                      <div class="text-sm leading-7">{{ campaign.totalLimit ?? '不限次數' }}</div>
                    </div>
                  </div>

                  <div class="flex items-start gap-3">
                    <div class="mt-1 text-xl">✅</div>
                    <div>
                      <div class="font-bold text-slate-900">角色限制</div>
                      <div class="text-sm leading-7">{{ campaign.allowedRole || '不限角色' }}</div>
                    </div>
                  </div>

                  <div class="flex items-start gap-3">
                    <div class="mt-1 text-xl">✅</div>
                    <div>
                      <div class="font-bold text-slate-900">會員等級限制</div>
                      <div class="text-sm leading-7">{{ campaign.requiredLevel || '不限等級' }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                class="rounded-3xl border p-5 text-sm font-bold"
                :class="probabilityStatusClass"
              >
                {{ probabilityStatusText }}
              </div>

              <div class="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 class="mb-5 text-2xl font-black text-slate-900">
                  快速操作
                </h2>

                <div class="grid gap-3">
                  <button
                    @click="goToPlay"
                    class="rounded-2xl px-5 py-4 text-left text-white transition hover:opacity-95"
                    :class="isPlayable ? gameMeta.buttonClass : 'bg-slate-400 cursor-not-allowed'"
                  >
                    <div class="text-lg font-black">
                      {{ playButtonText }}
                    </div>
                    <div class="mt-1 text-sm text-white/80">
                      {{ isPlayable ? `進入 ${gameMeta.label} 遊戲頁` : '請確認活動狀態與會員資格' }}
                    </div>
                  </button>

                  <button
                    @click="goToCampaigns"
                    class="rounded-2xl border border-slate-300 bg-slate-50 px-5 py-4 text-left transition hover:bg-slate-100"
                  >
                    <div class="text-lg font-black text-slate-900">
                      返回活動列表
                    </div>
                    <div class="mt-1 text-sm text-slate-500">
                      查看其他活動與遊戲
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <!-- Right -->
            <div class="space-y-6">
              <div class="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                <div class="mb-5 flex items-center justify-between">
                  <h2 class="text-2xl font-black text-slate-900">
                    獎項列表
                  </h2>

                  <span class="text-sm text-slate-400">
                    共 {{ prizeCount }} 筆
                  </span>
                </div>

                <div
                  v-if="sortedPrizes.length > 0"
                  class="grid gap-4 md:grid-cols-2"
                >
                  <div
                    v-for="prize in sortedPrizes"
                    :key="prize.id"
                    class="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div class="flex items-start justify-between gap-4">
                      <div>
                        <span
                          class="inline-flex rounded-full border px-3 py-1 text-xs font-black"
                          :class="getPrizeType(prize.title).class"
                        >
                          {{ getPrizeType(prize.title).emoji }}
                          {{ getPrizeType(prize.title).label }}
                        </span>

                        <div class="mt-3 text-xl font-black text-slate-900">
                          {{ prize.title }}
                        </div>

                        <div class="mt-2 text-sm leading-7 text-slate-600">
                          實際結果依活動機率與庫存判定。
                        </div>
                      </div>

                      <div class="text-3xl">
                        🎁
                      </div>
                    </div>

                    <div class="mt-5 space-y-4">
                      <div>
                        <div class="mb-2 flex items-center justify-between">
                          <p class="text-sm font-bold text-slate-600">
                            剩餘庫存
                          </p>
                          <p class="text-sm font-black text-slate-900">
                            {{ prize.remainStock }}
                          </p>
                        </div>

                        <div class="h-3 overflow-hidden rounded-full bg-white">
                          <div
                            class="h-full rounded-full"
                            :class="getStockClass(prize.remainStock)"
                            :style="{ width: `${getStockPercent(prize.remainStock)}%` }"
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div class="mb-2 flex items-center justify-between">
                          <p class="text-sm font-bold text-slate-600">
                            中獎機率
                          </p>
                          <p class="text-sm font-black text-slate-900">
                            {{ formatPercent(prize.probability) }}
                          </p>
                        </div>

                        <div class="h-3 overflow-hidden rounded-full bg-white">
                          <div
                            class="h-full rounded-full"
                            :class="getProbabilityClass(prize.probability)"
                            :style="{ width: `${getProbabilityPercent(prize.probability)}%` }"
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <BaseEmpty
                  v-else
                  icon="🎁"
                  title="目前尚未設定獎項"
                  message="此活動還沒有獎項資料，請等待主辦方新增獎項。"
                />
              </div>

              <div class="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 class="mb-5 text-2xl font-black text-slate-900">
                  活動資訊總覽
                </h2>

                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div class="mb-2 text-sm text-slate-400">活動 ID</div>
                    <div class="text-2xl font-black text-slate-900">
                      {{ campaign.id }}
                    </div>
                  </div>

                  <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div class="mb-2 text-sm text-slate-400">活動狀態</div>
                    <div class="text-2xl font-black text-slate-900">
                      {{ statusMeta.label }}
                    </div>
                  </div>

                  <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div class="mb-2 text-sm text-slate-400">遊戲類型</div>
                    <div class="text-2xl font-black text-slate-900">
                      {{ campaign.gameType }}
                    </div>
                  </div>

                  <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div class="mb-2 text-sm text-slate-400">機率合計</div>
                    <div class="text-2xl font-black text-slate-900">
                      {{ formatPercent(totalProbability) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
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