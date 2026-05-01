<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const PREMIUM_SCRATCH_STORAGE_KEY = 'multi_game_platform_premium_scratch_v1'
const GAME_HISTORY_STORAGE_KEY = 'multi_game_platform_game_history_v1'

const cloneByJson = (value) => JSON.parse(JSON.stringify(value))

const safeJsonParse = (value, fallback = null) => {
  try {
    return JSON.parse(value)
  } catch (error) {
    console.warn('JSON parse failed:', error)
    return fallback
  }
}

const urlGameId = computed(() => {
  return String(route.query.gameId || '').trim()
})

const isAdminMode = computed(() => {
  return String(route.query.mode || '').toLowerCase() === 'admin'
})

const currentGameId = computed(() => {
  return urlGameId.value || 'premium-scratch'
})

const sourcePath = computed(() => {
  const query = urlGameId.value ? `?gameId=${urlGameId.value}` : ''

  return `/games/scratch-card${query}`
})

const adminSourcePath = computed(() => {
  const query = urlGameId.value
    ? `?gameId=${urlGameId.value}&mode=admin`
    : '?mode=admin'

  return `/games/scratch-card${query}`
})

const campaign = reactive({
  brandName: 'Multi Game Platform',
  pageTitle: '精緻刮刮卡',
  mainTitle: '幸運刮刮樂',
  subTitle: '每日登入刮好禮',
  heroTagline: '刮開你的專屬驚喜',
  chanceText: '還有 3 次刮卡機會',
  buttonText: '分享活動',
  shareHint: '分享給好友可獲得額外刮卡次數',
  noticeText: '本活動為原創版型，可自由替換名稱、圖片與獎項內容。',
  logoText: 'S',
  logoImageUrl: '',
  bannerImageUrl: '',
  brandTagline: '打造專屬互動抽獎體驗',
  websiteUrl: '',
  websiteText: '官方網站',
  themeStart: '#ffb237',
  themeMiddle: '#ff7a18',
  themeEnd: '#ee3f24'
})

const player = reactive({
  chances: 3,
  sharedCount: 0
})

const prizes = ref([
  {
    id: 'coupon-100',
    name: '折價券 100 元',
    shortName: '100',
    description: '下次消費可折抵 100 元',
    icon: '🎟️',
    probability: 35,
    stock: 20,
    type: 'win'
  },
  {
    id: 'coupon-50',
    name: '折價券 50 元',
    shortName: '50',
    description: '下次消費可折抵 50 元',
    icon: '🎫',
    probability: 45,
    stock: 30,
    type: 'win'
  },
  {
    id: 'thanks',
    name: '銘謝惠顧',
    shortName: '謝謝',
    description: '這次沒有中獎，再接再厲',
    icon: '🙂',
    probability: 20,
    stock: 9999,
    type: 'lose'
  }
])

const scratchProgress = ref(0)
const isScratching = ref(false)
const hasScratched = ref(false)
const resultPrize = ref(null)
const showResultModal = ref(false)
const showShareMessage = ref(false)
const shareMessage = ref('')
const savedMessage = ref('')
const scratchLogs = ref([])
const scratchCardSeed = ref(Date.now())
const showPlayerRules = ref(false)
const showPrizeNotes = ref(false)

const defaultCampaignSnapshot = cloneByJson(campaign)
const defaultPlayerSnapshot = cloneByJson(player)
const defaultPrizesSnapshot = cloneByJson(prizes.value)

const playerRuleItems = [
  '每次刮卡會消耗 1 次刮卡機會。',
  '分享活動可增加 1 次刮卡機會。',
  '刮卡完成後，結果會自動寫入我的遊戲紀錄。',
  '獎項數量有限，抽完為止。',
  '實際兌獎方式以主辦單位公告為準。'
]

const prizeNoteItems = [
  '獎品名稱、機率與庫存可由管理版調整。',
  '庫存為 0 的獎項不會再被刮中。',
  '銘謝惠顧可作為未中獎結果使用。',
  '玩家可在我的遊戲紀錄查看已刮出的結果。'
]

const premiumVersionInfo = computed(() => {
  return {
    version: 'Premium Scratch Card V1 Stable',
    platformVersion: 'Multi Game Platform V2.2 Stable',
    batch: '第 148 批',
    playerMode: '玩家簡潔版',
    adminMode: '管理預覽版',
    status: '基礎骨架 / 可測試 / 可延伸'
  }
})

const safeWebsiteUrl = computed(() => {
  const value = String(campaign.websiteUrl || '').trim()

  if (!value) return ''

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }

  return `https://${value}`
})

const websiteButtonText = computed(() => {
  return String(campaign.websiteText || '').trim() || '官方網站'
})

const pageBackgroundStyle = computed(() => {
  return {
    background: `linear-gradient(180deg, ${campaign.themeStart} 0%, ${campaign.themeMiddle} 48%, ${campaign.themeEnd} 100%)`
  }
})

const bannerBackgroundStyle = computed(() => {
  if (!campaign.bannerImageUrl) {
    return {
      background: 'linear-gradient(135deg, rgba(255,255,255,0.24), rgba(255,255,255,0.1))'
    }
  }

  return {
    background: `linear-gradient(135deg, rgba(15,23,42,0.58), rgba(249,115,22,0.48)), url(${campaign.bannerImageUrl}) center/cover`
  }
})

const availablePrizePool = computed(() => {
  return prizes.value.filter((prize) => Number(prize.stock) > 0 && Number(prize.probability) > 0)
})

const canScratch = computed(() => {
  return player.chances > 0 && availablePrizePool.value.length > 0 && !isScratching.value && !hasScratched.value
})

const scratchButtonText = computed(() => {
  if (isScratching.value) return '刮卡中'

  if (hasScratched.value) return '查看結果'

  if (player.chances <= 0) return '次數用完'

  if (!availablePrizePool.value.length) return '獎品已抽完'

  return '開始刮卡'
})

const playerStatusMessage = computed(() => {
  if (isScratching.value) return '正在刮開獎區，請稍候。'

  if (hasScratched.value) return '刮卡完成，可以查看結果。'

  if (!availablePrizePool.value.length) return '目前獎品庫存已抽完，請等待主辦單位更新活動。'

  if (player.chances <= 0) return '目前沒有刮卡機會，可以分享活動增加 1 次。'

  return `目前還有 ${player.chances} 次刮卡機會。`
})

const scratchMaskStyle = computed(() => {
  const opacity = Math.max(0, 1 - scratchProgress.value / 100)

  return {
    opacity,
    background: 'linear-gradient(135deg, #cbd5e1, #f8fafc 45%, #94a3b8)'
  }
})

const updateChanceText = () => {
  campaign.chanceText = `還有 ${player.chances} 次刮卡機會`
}

const showSavedMessage = (message) => {
  savedMessage.value = message

  setTimeout(() => {
    savedMessage.value = ''
  }, 2200)
}

const getShareUrl = () => {
  if (typeof window === 'undefined') return sourcePath.value

  return `${window.location.origin}${sourcePath.value}`
}

const getShareText = () => {
  return `${campaign.pageTitle}｜${campaign.subTitle}\n${campaign.mainTitle} ${campaign.heroTagline}\n立即參加：${getShareUrl()}`
}

const showShareSuccess = (message) => {
  shareMessage.value = message
  showShareMessage.value = true

  setTimeout(() => {
    showShareMessage.value = false
    shareMessage.value = ''
  }, 2600)
}

const pickPrize = () => {
  const pool = availablePrizePool.value

  if (!pool.length) return null

  const total = pool.reduce((sum, prize) => sum + Number(prize.probability || 0), 0)
  const target = Math.random() * total
  let current = 0

  for (const prize of pool) {
    current += Number(prize.probability || 0)

    if (target <= current) {
      return prize
    }
  }

  return pool[pool.length - 1]
}

const getHistoryItems = () => {
  return safeJsonParse(localStorage.getItem(GAME_HISTORY_STORAGE_KEY), [])
}

const saveHistoryItem = (prize) => {
  const history = Array.isArray(getHistoryItems()) ? getHistoryItems() : []

  const item = {
    id: `scratch-${Date.now()}`,
    gameId: currentGameId.value,
    gameType: 'premium-scratch',
    gameName: campaign.pageTitle,
    prizeId: prize?.id || '',
    prizeName: prize?.name || '未知結果',
    prizeIcon: prize?.icon || '🎁',
    prizeType: prize?.type || 'win',
    sourcePath: sourcePath.value,
    createdAt: new Date().toISOString()
  }

  localStorage.setItem(
    GAME_HISTORY_STORAGE_KEY,
    JSON.stringify([item, ...history].slice(0, 50))
  )
}

const savePremiumScratchState = () => {
  const payload = {
    version: premiumVersionInfo.value.version,
    platformVersion: premiumVersionInfo.value.platformVersion,
    batch: premiumVersionInfo.value.batch,
    currentGameId: currentGameId.value,
    campaign: cloneByJson(campaign),
    player: cloneByJson(player),
    prizes: cloneByJson(prizes.value),
    scratchLogs: cloneByJson(scratchLogs.value),
    savedAt: new Date().toISOString()
  }

  localStorage.setItem(`${PREMIUM_SCRATCH_STORAGE_KEY}_${currentGameId.value}`, JSON.stringify(payload))
}

const loadPremiumScratchState = () => {
  const payload = safeJsonParse(
    localStorage.getItem(`${PREMIUM_SCRATCH_STORAGE_KEY}_${currentGameId.value}`),
    null
  )

  if (!payload) {
    updateChanceText()
    return
  }

  if (payload.campaign) {
    Object.assign(campaign, {
      ...defaultCampaignSnapshot,
      ...payload.campaign
    })
  }

  if (payload.player) {
    Object.assign(player, {
      ...defaultPlayerSnapshot,
      ...payload.player
    })
  }

  if (Array.isArray(payload.prizes)) {
    prizes.value = payload.prizes
  }

  if (Array.isArray(payload.scratchLogs)) {
    scratchLogs.value = payload.scratchLogs.slice(0, 8)
  }

  updateChanceText()
}

const resetScratchCard = () => {
  scratchProgress.value = 0
  isScratching.value = false
  hasScratched.value = false
  resultPrize.value = null
  showResultModal.value = false
  scratchCardSeed.value = Date.now()
}

const finishScratch = (prize) => {
  resultPrize.value = prize
  scratchProgress.value = 100
  isScratching.value = false
  hasScratched.value = true

  if (prize && prize.stock < 9999) {
    prize.stock = Math.max(0, Number(prize.stock) - 1)
  }

  const log = {
    id: `log-${Date.now()}`,
    prizeName: prize?.name || '未知結果',
    prizeIcon: prize?.icon || '🎁',
    prizeType: prize?.type || 'win',
    createdAt: new Date().toLocaleString('zh-TW')
  }

  scratchLogs.value = [log, ...scratchLogs.value].slice(0, 8)

  if (prize) {
    saveHistoryItem(prize)
  }

  savePremiumScratchState()

  setTimeout(() => {
    showResultModal.value = true
  }, 450)
}

const startScratch = () => {
  if (hasScratched.value && resultPrize.value) {
    showResultModal.value = true
    return
  }

  if (player.chances <= 0) {
    showShareSuccess('目前沒有刮卡機會，請先分享活動增加次數。')
    return
  }

  const prize = pickPrize()

  if (!prize) {
    showShareSuccess('目前獎品已抽完，請等待主辦單位更新活動。')
    return
  }

  player.chances -= 1
  updateChanceText()
  isScratching.value = true
  scratchProgress.value = 0

  const timer = window.setInterval(() => {
    scratchProgress.value = Math.min(100, scratchProgress.value + 12 + Math.floor(Math.random() * 9))

    if (scratchProgress.value >= 100) {
      window.clearInterval(timer)
      finishScratch(prize)
    }
  }, 120)
}

const shareCampaign = async () => {
  if (isScratching.value) return

  player.sharedCount += 1
  player.chances += 1
  updateChanceText()
  savePremiumScratchState()

  const shareText = getShareText()

  try {
    await navigator.clipboard.writeText(shareText)
    showShareSuccess('已複製分享文案，並增加 1 次刮卡機會。')
  } catch (error) {
    console.error('複製分享文案失敗：', error)
    showShareSuccess('已增加 1 次刮卡機會；目前瀏覽器不支援自動複製。')
  }
}

const closeResultAndContinue = () => {
  showResultModal.value = false
  resetScratchCard()
  savePremiumScratchState()
}

const goGameHistory = () => {
  showResultModal.value = false
  router.push('/game-history')
}

const goGamesCenter = () => {
  router.push('/games')
}

const resetDemo = () => {
  const confirmed = window.confirm('確定要重置精緻刮刮卡示範資料嗎？')

  if (!confirmed) return

  localStorage.removeItem(`${PREMIUM_SCRATCH_STORAGE_KEY}_${currentGameId.value}`)

  Object.assign(campaign, cloneByJson(defaultCampaignSnapshot))
  Object.assign(player, cloneByJson(defaultPlayerSnapshot))
  prizes.value = cloneByJson(defaultPrizesSnapshot)
  scratchLogs.value = []
  resetScratchCard()
  updateChanceText()
  savePremiumScratchState()
  showSavedMessage('已重置精緻刮刮卡示範資料。')
}

const exportDemoState = () => {
  const payload = {
    version: premiumVersionInfo.value.version,
    platformVersion: premiumVersionInfo.value.platformVersion,
    batch: premiumVersionInfo.value.batch,
    exportedAt: new Date().toISOString(),
    currentGameId: currentGameId.value,
    sourcePath: sourcePath.value,
    adminSourcePath: adminSourcePath.value,
    campaign: cloneByJson(campaign),
    player: cloneByJson(player),
    prizes: cloneByJson(prizes.value),
    scratchLogs: cloneByJson(scratchLogs.value)
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8'
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `premium-scratch-demo-${Date.now()}.json`
  link.click()

  URL.revokeObjectURL(url)
  showSavedMessage('已匯出精緻刮刮卡示範資料。')
}

onMounted(() => {
  loadPremiumScratchState()
})

watch(
  campaign,
  () => {
    updateChanceText()
    savePremiumScratchState()
  },
  {
    deep: true
  }
)

watch(
  player,
  () => {
    updateChanceText()
    savePremiumScratchState()
  },
  {
    deep: true
  }
)

watch(
  prizes,
  () => {
    savePremiumScratchState()
  },
  {
    deep: true
  }
)
</script>

<template>
  <div
    class="min-h-screen overflow-hidden px-4 py-6 text-slate-900 sm:px-6 lg:px-8"
    :style="pageBackgroundStyle"
  >
    <div class="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[420px_1fr]">
      <aside
        v-if="isAdminMode"
        class="rounded-[32px] bg-white/95 p-5 shadow-2xl backdrop-blur"
      >
        <p class="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
          Admin Preview
        </p>

        <h1 class="mt-2 text-2xl font-black text-slate-900">
          精緻刮刮卡管理預覽
        </h1>

        <p class="mt-3 text-sm font-bold leading-7 text-slate-500">
          一般玩家只會看到簡潔刮卡畫面。只有網址加上
          <span class="font-black text-orange-600">?mode=admin</span>
          時，才會顯示此管理工具。
        </p>

        <div class="mt-5 rounded-3xl border border-orange-100 bg-orange-50 p-4">
          <p class="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
            Stable Milestone
          </p>

          <h2 class="mt-2 text-xl font-black text-orange-900">
            {{ premiumVersionInfo.version }}
          </h2>

          <p class="mt-2 text-sm font-bold leading-6 text-orange-700">
            {{ premiumVersionInfo.platformVersion }}｜{{ premiumVersionInfo.batch }}｜{{ premiumVersionInfo.status }}
          </p>
        </div>

        <div class="mt-5 grid gap-3">
          <label class="grid gap-1 text-xs font-black text-slate-600">
            品牌名稱
            <input
              v-model="campaign.brandName"
              class="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
            />
          </label>

          <label class="grid gap-1 text-xs font-black text-slate-600">
            活動名稱
            <input
              v-model="campaign.pageTitle"
              class="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
            />
          </label>

          <label class="grid gap-1 text-xs font-black text-slate-600">
            主標題
            <input
              v-model="campaign.mainTitle"
              class="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
            />
          </label>

          <label class="grid gap-1 text-xs font-black text-slate-600">
            活動標語
            <input
              v-model="campaign.heroTagline"
              class="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
            />
          </label>

          <label class="grid gap-1 text-xs font-black text-slate-600">
            LOGO 圖片網址
            <input
              v-model="campaign.logoImageUrl"
              placeholder="https://..."
              class="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
            />
          </label>

          <label class="grid gap-1 text-xs font-black text-slate-600">
            Banner 圖片網址
            <input
              v-model="campaign.bannerImageUrl"
              placeholder="https://..."
              class="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
            />
          </label>

          <label class="grid gap-1 text-xs font-black text-slate-600">
            網站連結
            <input
              v-model="campaign.websiteUrl"
              placeholder="example.com"
              class="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
            />
          </label>
        </div>

        <div class="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <h3 class="text-sm font-black text-slate-900">
            獎項資料
          </h3>

          <div class="mt-3 space-y-3">
            <article
              v-for="prize in prizes"
              :key="prize.id"
              class="rounded-2xl bg-white p-3 shadow-sm"
            >
              <div class="flex items-center gap-2">
                <span class="text-2xl">{{ prize.icon }}</span>
                <input
                  v-model="prize.name"
                  class="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold outline-none focus:border-orange-400"
                />
              </div>

              <div class="mt-2 grid grid-cols-2 gap-2">
                <label class="grid gap-1 text-[11px] font-black text-slate-500">
                  機率
                  <input
                    v-model.number="prize.probability"
                    type="number"
                    class="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-orange-400"
                  />
                </label>

                <label class="grid gap-1 text-[11px] font-black text-slate-500">
                  庫存
                  <input
                    v-model.number="prize.stock"
                    type="number"
                    class="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-orange-400"
                  />
                </label>
              </div>
            </article>
          </div>
        </div>

        <div class="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            class="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-orange-600"
            @click="exportDemoState"
          >
            匯出 JSON
          </button>

          <button
            type="button"
            class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-600 transition hover:bg-rose-100"
            @click="resetDemo"
          >
            重置示範
          </button>
        </div>

        <div
          v-if="savedMessage"
          class="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-black text-emerald-700"
        >
          {{ savedMessage }}
        </div>

        <div class="mt-5 rounded-3xl border border-blue-100 bg-blue-50 p-4 text-xs font-bold leading-6 text-blue-700">
          <p class="font-black text-blue-900">
            預覽路徑
          </p>
          <p class="break-all">玩家版：{{ sourcePath }}</p>
          <p class="break-all">管理版：{{ adminSourcePath }}</p>
        </div>
      </aside>

      <main class="flex min-h-screen items-start justify-center">
        <div class="w-full max-w-[430px] rounded-[40px] bg-white/10 p-2 shadow-[0_30px_80px_rgba(15,23,42,.25)] backdrop-blur sm:p-3">
          <div class="premium-scrollbar-y relative h-[calc(100vh-3rem)] min-h-[720px] overflow-y-auto rounded-[34px] bg-orange-500 p-4 text-white shadow-inner sm:h-[860px] sm:p-5">
            <div class="absolute inset-0 opacity-20">
              <div class="premium-dot-bg h-full w-full"></div>
            </div>

            <div class="relative">
              <section
                class="overflow-hidden rounded-[30px] border border-white/25 p-3 shadow-2xl backdrop-blur sm:p-4"
                :style="bannerBackgroundStyle"
              >
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div class="flex min-w-0 items-center gap-3">
                    <div
                      v-if="campaign.logoImageUrl"
                      class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/50 bg-white shadow-lg"
                    >
                      <img
                        :src="campaign.logoImageUrl"
                        alt="品牌 LOGO"
                        class="h-full w-full object-contain"
                      />
                    </div>

                    <div
                      v-else
                      class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-[4px] border-yellow-200 bg-gradient-to-br from-amber-300 to-orange-500 text-3xl font-black text-white shadow-2xl"
                    >
                      {{ campaign.logoText }}
                    </div>

                    <div class="min-w-0 text-left">
                      <p class="truncate text-sm font-black text-white/80">
                        {{ campaign.brandName }}
                      </p>

                      <p class="line-clamp-2 text-base font-black leading-5 text-white">
                        {{ campaign.pageTitle }}
                      </p>

                      <p class="mt-1 line-clamp-2 text-[11px] font-bold leading-5 text-white/75">
                        {{ campaign.brandTagline }}
                      </p>
                    </div>
                  </div>

                  <a
                    v-if="safeWebsiteUrl"
                    :href="safeWebsiteUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex w-full shrink-0 items-center justify-center rounded-full bg-white px-4 py-2.5 text-xs font-black text-orange-600 shadow-lg transition hover:bg-yellow-50 sm:w-auto"
                  >
                    {{ websiteButtonText }}
                  </a>
                </div>
              </section>

              <section class="mt-5 text-center">
                <p class="text-3xl font-black leading-tight tracking-wide text-yellow-100 drop-shadow-[0_4px_0_rgba(154,52,18,0.45)] sm:text-4xl">
                  {{ campaign.mainTitle }}
                </p>

                <p class="mt-1 text-xl font-black leading-tight text-yellow-200 drop-shadow-[0_4px_0_rgba(154,52,18,0.45)] sm:text-2xl">
                  {{ campaign.heroTagline }}
                </p>

                <p class="mt-3 inline-flex rounded-full bg-white/20 px-4 py-2 text-xs font-black text-white shadow-inner backdrop-blur sm:text-sm">
                  {{ campaign.subTitle }}
                </p>
              </section>

              <section class="mt-5 rounded-3xl border border-white/25 bg-white/15 p-4 text-center shadow-inner backdrop-blur">
                <p class="text-sm font-black text-white">
                  {{ campaign.chanceText }}
                </p>

                <p class="mx-auto mt-2 max-w-xs rounded-2xl bg-white/15 px-4 py-2 text-xs font-black leading-5 text-white/80">
                  {{ playerStatusMessage }}
                </p>

                <div
                  v-if="showShareMessage"
                  class="mx-auto mt-3 max-w-xs rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-xs font-black leading-5 text-white shadow-inner backdrop-blur"
                >
                  {{ shareMessage }}
                </div>
              </section>

              <section class="relative mt-6 rounded-[30px] border-[5px] border-yellow-300/70 bg-gradient-to-br from-yellow-100 to-orange-100 p-4 shadow-[0_24px_40px_rgba(154,52,18,.35)]">
                <div class="rounded-[26px] bg-white p-4 text-center text-slate-900 shadow-inner">
                  <div class="mx-auto flex h-48 items-center justify-center overflow-hidden rounded-[24px] border-4 border-dashed border-orange-300 bg-orange-50 p-4">
                    <div class="relative h-full w-full overflow-hidden rounded-[20px] bg-white">
                      <div class="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                        <div class="text-5xl">
                          {{ resultPrize?.icon || '🎁' }}
                        </div>

                        <p class="mt-3 text-xl font-black text-slate-900">
                          {{ resultPrize?.name || '刮開看結果' }}
                        </p>

                        <p class="mt-2 text-xs font-bold leading-5 text-slate-500">
                          {{ resultPrize?.description || '完成刮卡後會顯示中獎結果' }}
                        </p>
                      </div>

                      <div
                        v-if="!hasScratched"
                        :key="scratchCardSeed"
                        class="absolute inset-0 flex flex-col items-center justify-center text-center transition duration-300"
                        :style="scratchMaskStyle"
                      >
                        <div class="text-4xl">✨</div>
                        <p class="mt-2 text-lg font-black text-slate-700">
                          SCRATCH
                        </p>
                        <p class="mt-1 text-xs font-black text-slate-500">
                          點下方按鈕開始刮卡
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      class="h-full rounded-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-150"
                      :style="{ width: `${scratchProgress}%` }"
                    ></div>
                  </div>

                  <button
                    type="button"
                    class="mt-5 w-full rounded-2xl px-5 py-4 text-base font-black text-white shadow-xl transition"
                    :class="canScratch || hasScratched
                      ? 'bg-slate-900 hover:bg-orange-600'
                      : 'cursor-not-allowed bg-slate-400'
                    "
                    :disabled="!canScratch && !hasScratched"
                    @click="startScratch"
                  >
                    {{ scratchButtonText }}
                  </button>

                  <button
                    v-if="hasScratched"
                    type="button"
                    class="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                    @click="closeResultAndContinue"
                  >
                    再刮一次
                  </button>
                </div>
              </section>

              <section
                v-if="!isAdminMode && player.chances <= 0"
                class="relative mt-4 rounded-3xl border border-white/30 bg-white/20 p-4 text-center shadow-inner backdrop-blur"
              >
                <p class="text-sm font-black text-white">
                  刮卡機會已用完
                </p>

                <p class="mt-2 text-xs font-bold leading-6 text-white/75">
                  分享活動可立即增加 1 次刮卡機會。
                </p>

                <button
                  type="button"
                  class="mt-3 rounded-full bg-white px-5 py-2.5 text-xs font-black text-orange-600 shadow-lg transition hover:bg-yellow-50"
                  @click="shareCampaign"
                >
                  分享增加機會
                </button>
              </section>

              <section class="relative mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  class="rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-sm font-black text-white shadow-inner backdrop-blur transition hover:bg-white/30"
                  :disabled="isScratching"
                  @click="shareCampaign"
                >
                  {{ isScratching ? '刮卡中...' : campaign.buttonText }}
                </button>

                <button
                  type="button"
                  class="rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-sm font-black text-white shadow-inner backdrop-blur transition hover:bg-white/30"
                  @click="goGameHistory"
                >
                  查看我的紀錄
                </button>

                <button
                  type="button"
                  class="rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-sm font-black text-white shadow-inner backdrop-blur transition hover:bg-white/30 sm:col-span-2"
                  @click="goGamesCenter"
                >
                  回遊戲中心
                </button>
              </section>

              <section
                v-if="!isAdminMode"
                class="relative mt-4 space-y-3"
              >
                <div class="overflow-hidden rounded-3xl bg-white/95 shadow-xl">
                  <button
                    type="button"
                    class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                    @click="showPlayerRules = !showPlayerRules"
                  >
                    <div>
                      <p class="text-sm font-black text-slate-800">
                        活動規則
                      </p>

                      <p class="mt-1 text-xs font-bold text-slate-400">
                        點擊展開查看參加方式
                      </p>
                    </div>

                    <span class="text-lg font-black text-orange-500">
                      {{ showPlayerRules ? '−' : '+' }}
                    </span>
                  </button>

                  <div
                    v-if="showPlayerRules"
                    class="border-t border-slate-100 px-4 pb-4 pt-3"
                  >
                    <ul class="space-y-2">
                      <li
                        v-for="rule in playerRuleItems"
                        :key="rule"
                        class="flex gap-2 text-xs font-bold leading-5 text-slate-500"
                      >
                        <span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400"></span>
                        <span>{{ rule }}</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div class="overflow-hidden rounded-3xl bg-white/95 shadow-xl">
                  <button
                    type="button"
                    class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                    @click="showPrizeNotes = !showPrizeNotes"
                  >
                    <div>
                      <p class="text-sm font-black text-slate-800">
                        獎品說明
                      </p>

                      <p class="mt-1 text-xs font-bold text-slate-400">
                        點擊展開查看獎品規則
                      </p>
                    </div>

                    <span class="text-lg font-black text-orange-500">
                      {{ showPrizeNotes ? '−' : '+' }}
                    </span>
                  </button>

                  <div
                    v-if="showPrizeNotes"
                    class="border-t border-slate-100 px-4 pb-4 pt-3"
                  >
                    <ul class="space-y-2">
                      <li
                        v-for="note in prizeNoteItems"
                        :key="note"
                        class="flex gap-2 text-xs font-bold leading-5 text-slate-500"
                      >
                        <span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400"></span>
                        <span>{{ note }}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              <section class="mt-5 overflow-hidden rounded-3xl bg-white/95 p-3 shadow-xl">
                <h3 class="px-2 pt-2 text-sm font-black text-slate-900">
                  最近刮卡紀錄
                </h3>

                <div class="mt-3 space-y-2">
                  <article
                    v-for="log in scratchLogs"
                    :key="log.id"
                    class="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"
                  >
                    <div class="text-2xl">{{ log.prizeIcon }}</div>

                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-black text-slate-900">
                        {{ log.prizeName }}
                      </p>

                      <p class="text-xs font-bold text-slate-400">
                        {{ log.createdAt }}
                      </p>
                    </div>
                  </article>

                  <p
                    v-if="!scratchLogs.length"
                    class="rounded-2xl bg-slate-50 p-4 text-center text-xs font-bold text-slate-400"
                  >
                    目前尚無刮卡紀錄
                  </p>
                </div>
              </section>

              <p class="relative mt-4 text-center text-[11px] font-bold leading-5 text-white/70">
                {{ isAdminMode ? campaign.noticeText : '請依照活動規則參加刮卡；獎項與兌換方式以主辦單位公告為準。' }}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>

    <div
      v-if="showResultModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur"
    >
      <div class="w-full max-w-sm overflow-hidden rounded-[32px] bg-white shadow-2xl">
        <div
          class="p-6 text-center text-white"
          :class="resultPrize?.type === 'lose'
            ? 'bg-gradient-to-br from-slate-500 to-slate-800'
            : 'bg-gradient-to-br from-orange-500 to-red-600'
          "
        >
          <div class="text-6xl">
            {{ resultPrize?.icon || '🎁' }}
          </div>

          <p class="mt-4 text-2xl font-black">
            {{ resultPrize?.type === 'lose' ? '再接再厲' : '恭喜中獎' }}
          </p>

          <p class="mt-2 text-lg font-black text-yellow-100">
            {{ resultPrize?.name }}
          </p>
        </div>

        <div class="p-6 text-center">
          <p class="text-sm leading-6 text-slate-500">
            {{ resultPrize?.description || '結果已寫入我的遊戲紀錄。' }}
          </p>

          <div class="mt-5 grid gap-3">
            <button
              type="button"
              class="w-full rounded-2xl bg-orange-600 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-700"
              @click="closeResultAndContinue"
            >
              {{ player.chances > 0 ? '繼續刮卡' : '關閉結果' }}
            </button>

            <button
              type="button"
              class="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              @click="goGameHistory"
            >
              查看我的遊戲紀錄
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.premium-scrollbar-y {
  scrollbar-width: none;
}

.premium-scrollbar-y::-webkit-scrollbar {
  width: 0;
}

.premium-dot-bg {
  background-image: radial-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px);
  background-size: 34px 34px;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
