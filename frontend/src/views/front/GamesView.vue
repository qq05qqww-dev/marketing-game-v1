<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getCampaignsApi } from '../../api/campaign'
import { useAuthStore } from '../../stores/auth'
import PlatformNavbar from '../../components/PlatformNavbar.vue'
import PlatformFooter from '../../components/PlatformFooter.vue'

const router = useRouter()
const authStore = useAuthStore()

const campaigns = ref([])
const loading = ref(false)

onMounted(async () => {
  if (typeof authStore.restoreLogin === 'function') {
    authStore.restoreLogin()
  }

  await fetchCampaigns()
})

const fetchCampaigns = async () => {
  loading.value = true

  try {
    const res = await getCampaignsApi()
    campaigns.value = Array.isArray(res?.data?.data) ? res.data.data : []
  } catch (error) {
    console.error('取得活動列表失敗:', error)
    campaigns.value = []
  } finally {
    loading.value = false
  }
}

const isLoggedIn = computed(() => authStore.isLoggedIn)
const currentUser = computed(() => authStore.user)

const visibleCampaigns = computed(() => {
  return campaigns.value.slice(0, 6)
})

const activeCampaigns = computed(() => {
  return campaigns.value.filter((item) => String(item.status || '').toUpperCase() === 'ACTIVE').length
})

const logout = () => {
  authStore.logout()
  alert('已登出')
  router.push('/')
}

const goToRegister = () => router.push('/register')
const goToCampaigns = () => router.push('/campaigns')
const goToGames = () => router.push('/games')
const goToLogin = () => router.push('/login')
const goToMyRewards = () => router.push('/my-rewards')
const goToAdmin = () => router.push('/admin/campaigns')
const goToPreview = () => router.push('/admin/game-preview')
const goToGoldenEgg = () => router.push('/games/golden-egg')

const openCampaign = (item) => {
  router.push(`/campaigns/${item.id}`)
}

const playCampaign = (item) => {
  router.push(`/play/${item.id}`)
}

const openGameCard = (item) => {
  if (!item?.route) return

  router.push(item.route)
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
      class: 'bg-blue-100 text-blue-700 border-blue-200',
      bg: 'from-blue-50 via-white to-cyan-50'
    }
  }

  if (type === 'FLIP') {
    return {
      label: '翻牌遊戲',
      emoji: '🎴',
      class: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
      bg: 'from-fuchsia-50 via-white to-violet-50'
    }
  }

  if (type === 'GRID') {
    return {
      label: '九宮格',
      emoji: '🔲',
      class: 'bg-amber-100 text-amber-700 border-amber-200',
      bg: 'from-amber-50 via-white to-orange-50'
    }
  }

  if (type === 'SCRATCH') {
    return {
      label: '刮刮樂',
      emoji: '🎫',
      class: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      bg: 'from-emerald-50 via-white to-lime-50'
    }
  }

  if (type === 'GOLDEN_EGG') {
    return {
      label: '九宮格砸金蛋',
      emoji: '🥚',
      class: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      bg: 'from-yellow-50 via-white to-red-50'
    }
  }

  return {
    label: type || '未設定',
    emoji: '🎮',
    class: 'bg-slate-100 text-slate-700 border-slate-200',
    bg: 'from-slate-50 via-white to-slate-50'
  }
}

const getStatusClass = (status) => {
  const value = String(status || '').toUpperCase()

  if (value === 'ACTIVE') {
    return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  }

  if (value === 'DRAFT') {
    return 'bg-slate-100 text-slate-700 border-slate-200'
  }

  if (value === 'INACTIVE') {
    return 'bg-amber-100 text-amber-700 border-amber-200'
  }

  if (value === 'ENDED') {
    return 'bg-rose-100 text-rose-700 border-rose-200'
  }

  return 'bg-slate-100 text-slate-700 border-slate-200'
}

const gameCards = [
  {
    type: 'GOLDEN_EGG',
    title: '九宮格砸金蛋',
    emoji: '🥚',
    desc: '9 顆金蛋排列，點選後槌子敲擊、蛋殼破裂、獎項跳出。',
    class: 'from-yellow-100 via-orange-100 to-red-100',
    route: '/games/golden-egg',
    badge: 'NEW'
  },
  {
    type: 'WHEEL',
    title: '輪盤抽獎',
    emoji: '🎡',
    desc: '適合大型活動、現場抽獎、品牌互動。',
    class: 'from-blue-100 to-cyan-100',
    route: '/games/wheel',
    badge: 'Stable'
  },
  {
    type: 'FLIP',
    title: '翻牌遊戲',
    emoji: '🎴',
    desc: '翻開卡牌揭曉獎勵，互動感強。',
    class: 'from-fuchsia-100 to-violet-100',
    route: '/games/flip-card',
    badge: 'Game'
  },
  {
    type: 'GRID',
    title: '九宮格',
    emoji: '🔲',
    desc: '點選幸運格，快速進入抽獎結果。',
    class: 'from-amber-100 to-orange-100',
    route: '/games/grid-lottery',
    badge: 'Game'
  },
  {
    type: 'SCRATCH',
    title: '刮刮樂',
    emoji: '🎫',
    desc: '刮開驚喜結果，適合會員促銷。',
    class: 'from-emerald-100 to-lime-100',
    route: '/games/scratch-card',
    badge: 'Game'
  }
]

const platformFeatures = [
  {
    title: '多遊戲活動',
    desc: '輪盤、翻牌、九宮格、刮刮樂、九宮格砸金蛋可共用同一套活動平台概念。',
    emoji: '🕹️'
  },
  {
    title: '會員與獎品',
    desc: '會員登入後可參加活動，中獎後可到我的獎品查看兌換碼。',
    emoji: '🎁'
  },
  {
    title: '後台營運',
    desc: '管理活動、獎項、會員、核銷、報表與遊戲預覽。',
    emoji: '📋'
  },
  {
    title: '報表匯出',
    desc: '支援遊玩紀錄、獎勵紀錄、CSV / XLSX 匯出。',
    emoji: '📊'
  }
]
</script>

<template>
  <div class="flex min-h-screen flex-col bg-slate-100">
    <PlatformNavbar />

    <main class="flex-1">
      <div class="mx-auto max-w-7xl space-y-8 px-4 py-8">
        <!-- Hero -->
        <section class="relative overflow-hidden rounded-[40px] border border-slate-200 bg-white p-8 shadow-sm md:p-12">
          <div class="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-pink-200/40 blur-3xl"></div>
          <div class="absolute -bottom-28 -left-24 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl"></div>

          <div class="relative z-10 grid grid-cols-1 gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div>
              <div class="mb-4 inline-flex rounded-full bg-indigo-100 px-4 py-2 text-sm font-black text-indigo-700">
                Multi Game Platform V2.2 Stable
              </div>

              <h1 class="text-4xl font-black leading-tight text-slate-900 md:text-6xl">
                多遊戲互動活動平台
              </h1>

              <p class="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                整合輪盤、翻牌、九宮格、刮刮樂與 9 個金蛋砸蛋遊戲，支援活動管理、獎項機率、會員登入、發獎核銷與報表查詢。
              </p>

              <div class="mt-8 flex flex-wrap gap-3">
                <button
                  @click="goToGoldenEgg"
                  class="rounded-2xl bg-yellow-400 px-6 py-3 font-black text-red-700 shadow-sm transition hover:bg-yellow-300"
                >
                  立即玩砸金蛋
                </button>

                <button
                  @click="goToCampaigns"
                  class="rounded-2xl bg-rose-500 px-6 py-3 font-black text-white transition hover:bg-rose-600"
                >
                  查看活動
                </button>

                <button
                  @click="goToGames"
                  class="rounded-2xl bg-pink-500 px-6 py-3 font-black text-white transition hover:bg-pink-600"
                >
                  遊戲入口
                </button>

                <button
                  v-if="!isLoggedIn"
                  @click="goToLogin"
                  class="rounded-2xl bg-blue-600 px-6 py-3 font-black text-white transition hover:bg-blue-700"
                >
                  會員登入
                </button>

                <button
                  v-else
                  @click="goToMyRewards"
                  class="rounded-2xl bg-amber-500 px-6 py-3 font-black text-white transition hover:bg-amber-600"
                >
                  我的獎品
                </button>

                <button
                  @click="goToAdmin"
                  class="rounded-2xl bg-slate-900 px-6 py-3 font-black text-white transition hover:bg-slate-800"
                >
                  後台管理
                </button>
              </div>

              <div class="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                <div class="rounded-3xl border border-slate-200 bg-white/80 p-4 text-center shadow-sm">
                  <p class="text-xs font-bold text-slate-400">
                    活動總數
                  </p>
                  <p class="mt-2 text-3xl font-black text-slate-900">
                    {{ campaigns.length }}
                  </p>
                </div>

                <div class="rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-center shadow-sm">
                  <p class="text-xs font-bold text-emerald-500">
                    啟用活動
                  </p>
                  <p class="mt-2 text-3xl font-black text-emerald-700">
                    {{ activeCampaigns }}
                  </p>
                </div>

                <div class="rounded-3xl border border-amber-100 bg-amber-50 p-4 text-center shadow-sm">
                  <p class="text-xs font-bold text-amber-500">
                    會員狀態
                  </p>
                  <p class="mt-2 text-lg font-black text-amber-700">
                    {{ isLoggedIn ? '已登入' : '未登入' }}
                  </p>
                </div>

                <div class="rounded-3xl border border-violet-100 bg-violet-50 p-4 text-center shadow-sm">
                  <p class="text-xs font-bold text-violet-500">
                    系統版本
                  </p>
                  <p class="mt-2 text-lg font-black text-violet-700">
                    V2.2
                  </p>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                v-for="item in gameCards"
                :key="item.type"
                type="button"
                class="group relative overflow-hidden rounded-[32px] border border-white bg-gradient-to-br p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                :class="item.class"
                @click="openGameCard(item)"
              >
                <div class="absolute right-4 top-4 rounded-full bg-white/80 px-3 py-1 text-xs font-black text-slate-700 shadow-sm">
                  {{ item.badge }}
                </div>

                <div class="text-5xl transition group-hover:scale-110">
                  {{ item.emoji }}
                </div>

                <h3 class="mt-4 text-xl font-black text-slate-900">
                  {{ item.title }}
                </h3>

                <p class="mt-2 text-sm leading-6 text-slate-600">
                  {{ item.desc }}
                </p>

                <div class="mt-4 inline-flex items-center rounded-full bg-white/80 px-4 py-2 text-xs font-black text-slate-700 shadow-sm transition group-hover:bg-slate-900 group-hover:text-white">
                  立即體驗 →
                </div>
              </button>
            </div>
          </div>
        </section>

        <!-- Golden Egg shortcut -->
        <section class="overflow-hidden rounded-[36px] border border-yellow-200 bg-gradient-to-br from-red-600 via-red-500 to-yellow-500 p-6 text-white shadow-sm md:p-8">
          <div class="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <div class="inline-flex rounded-full bg-yellow-300 px-4 py-2 text-sm font-black text-red-700 shadow-sm">
                NEW GAME｜九宮格砸金蛋
              </div>

              <h2 class="mt-4 text-3xl font-black md:text-4xl">
                新增 9 個金蛋砸蛋遊戲
              </h2>

              <p class="mt-3 max-w-2xl text-sm font-medium leading-7 text-yellow-50 md:text-base">
                參考活動型砸金蛋玩法，前台提供 3 × 3 金蛋排列、槌子敲擊、蛋殼破裂、獎項彈出與最近紀錄。這是獨立遊戲，不會覆蓋原本輪盤。
              </p>

              <button
                type="button"
                class="mt-5 rounded-2xl bg-yellow-300 px-6 py-3 font-black text-red-700 shadow-lg transition hover:bg-yellow-200"
                @click="goToGoldenEgg"
              >
                打開砸金蛋遊戲
              </button>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div
                v-for="index in 9"
                :key="index"
                class="flex aspect-square flex-col items-center justify-center rounded-3xl border border-yellow-200/50 bg-red-900/20 shadow-lg backdrop-blur"
              >
                <div class="text-4xl drop-shadow md:text-5xl">
                  🥚
                </div>
                <p class="mt-2 rounded-full bg-yellow-300 px-3 py-1 text-xs font-black text-red-700">
                  金蛋 {{ index }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Login Status -->
        <section class="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 class="text-2xl font-black text-slate-900">
                會員狀態
              </h2>

              <div
                v-if="isLoggedIn && currentUser"
                class="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-4"
              >
                <div>姓名：{{ currentUser.name }}</div>
                <div>Email：{{ currentUser.email }}</div>
                <div>角色：{{ currentUser.role }}</div>
                <div>等級：{{ currentUser.memberLevel }}</div>
              </div>

              <p
                v-else
                class="mt-2 text-slate-500"
              >
                目前尚未登入，登入後可參加活動與查看我的獎品。
              </p>
            </div>

            <div class="flex flex-wrap gap-3">
              <button
                v-if="!isLoggedIn"
                @click="goToRegister"
                class="rounded-2xl bg-emerald-500 px-5 py-3 font-bold text-white transition hover:bg-emerald-600"
              >
                會員註冊
              </button>

              <button
                v-if="!isLoggedIn"
                @click="goToLogin"
                class="rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
              >
                會員登入
              </button>

              <button
                v-if="isLoggedIn"
                @click="goToMyRewards"
                class="rounded-2xl bg-violet-600 px-5 py-3 font-bold text-white transition hover:bg-violet-700"
              >
                我的獎品
              </button>

              <button
                v-if="isLoggedIn"
                @click="logout"
                class="rounded-2xl bg-slate-200 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-300"
              >
                登出
              </button>
            </div>
          </div>
        </section>

        <!-- Features -->
        <section class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="item in platformFeatures"
            :key="item.title"
            class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div class="mb-4 text-4xl">
              {{ item.emoji }}
            </div>
            <h2 class="mb-2 text-xl font-black text-slate-900">
              {{ item.title }}
            </h2>
            <p class="leading-7 text-slate-600">
              {{ item.desc }}
            </p>
          </div>
        </section>

        <!-- Featured Campaigns -->
        <section class="rounded-[36px] border border-slate-200 bg-white p-8 shadow-sm">
          <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 class="text-3xl font-black text-slate-900">
                活動精選
              </h2>
              <p class="mt-2 text-slate-500">
                從這裡快速進入目前活動，開始互動遊戲。
              </p>
            </div>

            <button
              @click="goToCampaigns"
              class="rounded-2xl bg-slate-900 px-5 py-3 font-black text-white transition hover:bg-slate-800"
            >
              查看全部活動
            </button>
          </div>

          <div
            v-if="loading"
            class="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-500"
          >
            載入活動中...
          </div>

          <div
            v-else-if="visibleCampaigns.length === 0"
            class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center"
          >
            <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
              🎮
            </div>
            <h3 class="mt-4 text-xl font-black text-slate-800">
              目前沒有活動
            </h3>
            <p class="mt-2 text-sm text-slate-500">
              可以先到後台建立活動。
            </p>
          </div>

          <div
            v-else
            class="grid grid-cols-1 gap-5 xl:grid-cols-2"
          >
            <article
              v-for="item in visibleCampaigns"
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
                      <span
                        class="inline-flex rounded-full border px-3 py-1 text-xs font-black"
                        :class="getGameMeta(item.gameType).class"
                      >
                        {{ getGameMeta(item.gameType).emoji }} {{ getGameMeta(item.gameType).label }}
                      </span>

                      <span
                        class="inline-flex rounded-full border px-3 py-1 text-xs font-black"
                        :class="getStatusClass(item.status)"
                      >
                        {{ item.status || 'ACTIVE' }}
                      </span>
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
                <div class="rounded-2xl bg-slate-50 p-4">
                  <p class="text-xs font-bold text-slate-400">每日次數</p>
                  <p class="mt-1 font-black text-slate-800">
                    {{ item.dailyLimit ?? '不限' }}
                  </p>
                </div>

                <div class="rounded-2xl bg-slate-50 p-4">
                  <p class="text-xs font-bold text-slate-400">總次數</p>
                  <p class="mt-1 font-black text-slate-800">
                    {{ item.totalLimit ?? '不限' }}
                  </p>
                </div>

                <div class="rounded-2xl bg-slate-50 p-4">
                  <p class="text-xs font-bold text-slate-400">獎項數</p>
                  <p class="mt-1 font-black text-slate-800">
                    {{ item.prizes?.length ?? item._count?.prizes ?? 0 }}
                  </p>
                </div>

                <div class="rounded-2xl bg-slate-50 p-4 md:col-span-3">
                  <p class="text-xs font-bold text-slate-400">活動期間</p>
                  <p class="mt-1 text-sm font-bold text-slate-700">
                    {{ formatDateTime(item.startAt) }} ～ {{ formatDateTime(item.endAt) }}
                  </p>
                </div>
              </div>

              <div class="grid gap-3 border-t border-slate-100 bg-slate-50 p-5 md:grid-cols-2">
                <button
                  @click="playCampaign(item)"
                  class="rounded-2xl bg-rose-500 px-5 py-3 font-black text-white transition hover:bg-rose-600"
                >
                  開始遊玩
                </button>

                <button
                  @click="openCampaign(item)"
                  class="rounded-2xl bg-white px-5 py-3 font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
                >
                  查看詳情
                </button>
              </div>
            </article>
          </div>
        </section>

        <!-- Admin shortcut -->
        <section class="rounded-[36px] border border-slate-800 bg-slate-900 p-8 text-white shadow-sm">
          <div class="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 class="text-3xl font-black">
                後台營運入口
              </h2>
              <p class="mt-2 max-w-2xl text-slate-300">
                管理活動、獎項、會員、核銷、報表、遊戲預覽與樣式設定。
              </p>
            </div>

            <div class="flex flex-wrap gap-3">
              <button
                @click="goToAdmin"
                class="rounded-2xl bg-white px-5 py-3 font-black text-slate-900 transition hover:bg-slate-100"
              >
                後台管理
              </button>

              <button
                @click="goToPreview"
                class="rounded-2xl bg-indigo-600 px-5 py-3 font-black text-white transition hover:bg-indigo-700"
              >
                遊戲預覽
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>

    <PlatformFooter />
  </div>
</template>
