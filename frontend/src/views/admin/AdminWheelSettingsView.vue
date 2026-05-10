// 第 51201～51600 批：輪盤設定右側正式玩家頁 iframe 即時預覽版
<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const STORAGE_PREFIX = 'mgp:wheel-admin-settings:'
const PRODUCTION_FRONTEND_URL = 'https://marketing-game-v1.vercel.app'

const campaignId = computed(() => String(route.params.id || route.query.campaignId || '').trim())
const tenantSlug = computed(() => String(route.query.tenantSlug || 'a-shop').trim() || 'a-shop')

const normalizeUrl = (value = '') => String(value || '').trim().replace(/\/$/, '')
const isLocalOrigin = (value = '') => /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(String(value || ''))

const frontOrigin = computed(() => {
  const envUrl = normalizeUrl(
    import.meta.env.VITE_PUBLIC_FRONTEND_URL ||
      import.meta.env.VITE_FRONTEND_URL ||
      import.meta.env.VITE_APP_FRONTEND_URL ||
      ''
  )

  if (envUrl) return envUrl

  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = normalizeUrl(window.location.origin)
    return origin || PRODUCTION_FRONTEND_URL
  }

  return PRODUCTION_FRONTEND_URL
})

const playerUrl = computed(() => {
  const raw = String(route.query.playerUrl || '').trim()

  if (raw) {
    try {
      const parsed = new URL(raw)
      const path = `${parsed.pathname}${parsed.search || ''}`
      return `${frontOrigin.value}${path}`
    } catch (error) {
      return raw.startsWith('/') ? `${frontOrigin.value}${raw}` : raw
    }
  }

  const query = campaignId.value ? `?campaignId=${campaignId.value}` : ''
  return `${frontOrigin.value}/play/${tenantSlug.value}/wheel${query}`
})

const storageKey = computed(() => `${STORAGE_PREFIX}${tenantSlug.value}:${campaignId.value || 'draft'}`)
const savedMessage = ref('')
const copiedMessage = ref('')
const previewKey = ref(0)
const activeCategory = ref('basic')


const settingCategories = [
  { key: 'basic', icon: '文', title: '基本文字', desc: '活動標題、副標題、提示文字' },
  { key: 'theme', icon: '色', title: '主題色彩', desc: '背景、按鈕、指針與輪盤顏色' },
  { key: 'wheel', icon: '盤', title: '輪盤樣式', desc: '輪盤外框、中心按鈕與獎項顯示' },
  { key: 'display', icon: '示', title: '展示區塊', desc: '剩餘次數、紀錄、獎品牆' },
  { key: 'serial', icon: '碼', title: '序號抽獎', desc: '序號標題、提示與驗證文字' },
  { key: 'result', icon: '窗', title: '結果彈窗', desc: '中獎標題與行動按鈕文字' },
  { key: 'sound', icon: '效', title: '音效特效', desc: '音效開關與抽獎遮蔽' },
  { key: 'rules', icon: '規', title: '規則說明', desc: '活動規則與獎品說明顯示' },
  { key: 'frontend', icon: '設', title: '前台設定', desc: '玩家網址、預覽與公開顯示' },
  { key: 'prizes', icon: '獎', title: '輪盤獎項', desc: '獎項名稱、權重與顏色' }
]

const themeLabels = {
  backgroundFrom: '背景起始色',
  backgroundTo: '背景結束色',
  panelColor: '面板底色',
  wheelOuterColor: '輪盤外框色',
  pointerColor: '指針顏色',
  spinButtonColor: '中心按鈕色',
  actionButtonFrom: '主按鈕起始色',
  actionButtonTo: '主按鈕結束色'
}

const themeDescriptions = {
  backgroundFrom: '玩家頁上方與底色的第一個顏色。',
  backgroundTo: '玩家頁背景漸層的結束顏色。',
  panelColor: '資訊卡片與提示區塊的柔和底色。',
  wheelOuterColor: '輪盤外圈、光暈與金色框的主色。',
  pointerColor: '輪盤上方指針顏色。',
  spinButtonColor: '輪盤中心 SPIN 按鈕顏色。',
  actionButtonFrom: '開始轉盤按鈕漸層左側顏色。',
  actionButtonTo: '開始轉盤按鈕漸層右側顏色。'
}

const displayLabels = {
  showBrandCard: '顯示品牌卡片',
  showStatusCard: '顯示活動狀態',
  showRemainingChance: '顯示剩餘次數',
  showSerialBox: '顯示序號輸入區',
  showRules: '顯示活動規則',
  showPrizeInfo: '顯示獎品說明',
  showPrizeShelf: '顯示獎品展示',
  showHistory: '顯示抽獎紀錄',
  hidePrizesBeforeDraw: '抽中前隱藏獎品',
  enableSound: '開啟遊戲音效',
  showDebugInfo: '顯示除錯資訊'
}

const displayDescriptions = {
  showBrandCard: '玩家頁上方品牌 Logo / 活動名稱區塊。',
  showStatusCard: '顯示活動進行中、活動提示等狀態資訊。',
  showRemainingChance: '顯示目前剩餘轉盤次數。',
  showSerialBox: '讓玩家輸入商家提供的序號。',
  showRules: '顯示活動規則收合區塊。',
  showPrizeInfo: '顯示獎品說明收合區塊。',
  showPrizeShelf: '顯示獎品展示橫向區塊。',
  showHistory: '顯示我的抽獎紀錄卡片。',
  hidePrizesBeforeDraw: '抽中前先顯示神秘獎品，抽中後才揭曉。',
  enableSound: '開啟轉盤卡點聲、結果音效等效果。',
  showDebugInfo: '只建議測試時開啟，正式玩家頁請關閉。'
}

const setCategory = (key) => {
  activeCategory.value = key
}

const defaultSettings = () => ({
  pageTitle: '幸運輪盤抽獎',
  brandName: 'Multi Game Platform',
  brandSubtitle: '打造專屬互動抽獎體驗',
  brandLogoUrl: '',
  brandLinkUrl: '',
  brandLinkText: '官方品牌',
  brandLogoSize: 64,
  brandTitleSize: 20,
  brandTextColor: '#ffffff',
  headline: '幸運輪盤抽獎',
  subtitle: '轉出你的專屬驚喜',
  badgeText: '輸入序號後即可轉盤抽獎',
  serialTitle: '輸入序號開始轉盤',
  serialHint: '請輸入商家提供的序號，驗證成功後即可使用轉盤機會。',
  playButtonText: '開始轉盤',
  verifyButtonText: '驗證序號',
  resultTitle: '恭喜中獎',
  theme: {
    backgroundFrom: '#fff7ed',
    backgroundTo: '#f97316',
    panelColor: '#fed7aa',
    wheelOuterColor: '#f59e0b',
    pointerColor: '#dc2626',
    spinButtonColor: '#111827',
    actionButtonFrom: '#fb923c',
    actionButtonTo: '#dc2626'
  },
  display: {
    showBrandCard: true,
    showStatusCard: true,
    showRemainingChance: true,
    showSerialBox: true,
    showRules: true,
    showPrizeInfo: true,
    showPrizeShelf: false,
    showHistory: true,
    hidePrizesBeforeDraw: false,
    enableSound: true,
    showDebugInfo: false
  },
  wheelStyle: {
    wheelSize: 320,
    outerRingWidth: 12,
    centerButtonSize: 86,
    pointerSize: 42,
    prizeTextSize: 13,
    prizeIconSize: 38,
    cellGap: 2,
    prizeLabelRadius: 34,
    showPrizeIcon: true,
    showPrizeName: true,
    showSliceBorder: true
  },
  effects: {
    enableTickSound: true,
    enableResultSound: true,
    enablePointerShake: true,
    enableLightGlow: true,
    enableConfetti: true,
    enableSpinMask: true
  },
  content: {
    rulesTitle: '活動規則',
    rulesText: '請輸入商家提供的序號，驗證成功後即可開始轉盤。中獎後請依主辦單位公告方式兌換。',
    prizeInfoTitle: '獎品說明',
    prizeInfoText: '獎項、兌換方式與使用期限，以主辦單位現場或官方公告為準。',
    footerNote: '請依照活動規則參加抽獎；獎項與兌換方式以主辦單位公告為準。'
  },
  prizes: [
    { id: 1, icon: '🎁', imageUrl: '', linkUrl: '', name: '50 元折價券', weight: 35, color: '#facc15' },
    { id: 2, icon: '🎫', imageUrl: '', linkUrl: '', name: '100 元折價券', weight: 25, color: '#fb7185' },
    { id: 3, icon: '🏆', imageUrl: '', linkUrl: '', name: '200 元折價券', weight: 15, color: '#fb923c' },
    { id: 4, icon: '😊', imageUrl: '', linkUrl: '', name: '未中獎', weight: 25, color: '#ef4444' }
  ]
})

const settings = reactive(defaultSettings())

const previewPrizes = computed(() => {
  const list = Array.isArray(settings.prizes) ? settings.prizes : []
  return list.filter((item) => item && String(item.name || '').trim()).slice(0, 8)
})

const conicGradient = computed(() => {
  const list = previewPrizes.value.length ? previewPrizes.value : defaultSettings().prizes
  const step = 100 / list.length
  let current = 0

  const parts = list.map((item, index) => {
    const start = current
    const end = index === list.length - 1 ? 100 : current + step
    current = end
    return `${item.color || '#f59e0b'} ${start}% ${end}%`
  })

  return `conic-gradient(${parts.join(', ')})`
})

const wheelSegments = computed(() => {
  const list = previewPrizes.value.length ? previewPrizes.value : defaultSettings().prizes
  const total = list.length || 1

  return list.map((item, index) => {
    const mid = (index + 0.5) * (360 / total) - 90
    const radius = Number(settings.wheelStyle.prizeLabelRadius || 34)
    const x = 50 + Math.cos((mid * Math.PI) / 180) * radius
    const y = 50 + Math.sin((mid * Math.PI) / 180) * radius

    return {
      ...item,
      labelX: x,
      labelY: y,
      rotate: mid + 90
    }
  })
})

const getPrizeImageSrc = (prize = {}) => String(prize.imageUrl || '').trim()

const getPrizeDisplayIcon = (prize = {}) => {
  if (settings.display.hidePrizesBeforeDraw) return '🎁'
  return prize.icon || '🎁'
}

const getPrizeDisplayName = (prize = {}) => {
  if (settings.display.hidePrizesBeforeDraw) return '神秘獎品'
  return prize.name || '獎項'
}

const previewRemainingText = computed(() => {
  return settings.display.showRemainingChance ? '剩餘次數 99｜可轉盤' : ''
})

const safePreviewUrl = computed(() => {
  const separator = playerUrl.value.includes('?') ? '&' : '?'
  const params = new URLSearchParams({
    adminPreview: '1',
    adminPreviewDraft: '1',
    previewKey: String(previewKey.value),
    tenantSlug: tenantSlug.value
  })

  if (campaignId.value) {
    params.set('campaignId', campaignId.value)
  }

  return `${playerUrl.value}${separator}${params.toString()}`
})

const assignDeep = (target, source) => {
  Object.keys(source || {}).forEach((key) => {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {}
      assignDeep(target[key], source[key])
      return
    }

    target[key] = source[key]
  })
}

const loadSettings = () => {
  try {
    const raw = localStorage.getItem(storageKey.value)
    if (!raw) return

    const parsed = JSON.parse(raw)
    assignDeep(settings, parsed)
  } catch (error) {
    console.warn('讀取輪盤設定失敗：', error)
  }
}

const saveSettings = (options = {}) => {
  const silent = options?.silent === true

  try {
    localStorage.setItem(storageKey.value, JSON.stringify(settings))
    previewKey.value += 1

    if (!silent) {
      savedMessage.value = '已儲存，右側正式玩家頁預覽已重新載入。'
      window.setTimeout(() => {
        savedMessage.value = ''
      }, 2200)
    }
  } catch (error) {
    savedMessage.value = '儲存失敗，請檢查瀏覽器儲存權限。'
  }
}

let previewSyncTimer = null

const schedulePreviewSync = () => {
  if (typeof window === 'undefined') return

  window.clearTimeout(previewSyncTimer)
  previewSyncTimer = window.setTimeout(() => {
    saveSettings({ silent: true })
  }, 650)
}

const resetSettings = () => {
  const fresh = defaultSettings()
  Object.keys(settings).forEach((key) => delete settings[key])
  assignDeep(settings, fresh)
  localStorage.removeItem(storageKey.value)
  previewKey.value += 1
  savedMessage.value = '已還原輪盤預設設定。'
}

const copyText = async (text, message = '已複製到剪貼簿') => {
  try {
    await navigator.clipboard.writeText(text)
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
  }

  copiedMessage.value = message
  window.setTimeout(() => {
    copiedMessage.value = ''
  }, 1800)
}

const openPlayer = () => {
  window.open(playerUrl.value, '_blank', 'noopener,noreferrer')
}

const backToCampaigns = () => {
  router.push({
    path: '/admin/campaigns',
    query: campaignId.value
      ? {
          campaignId: campaignId.value,
          gameType: 'WHEEL'
        }
      : {}
  })
}

const addPrize = () => {
  settings.prizes.push({
    id: Date.now(),
    icon: '🎁',
    imageUrl: '',
    linkUrl: '',
    name: '新獎項',
    weight: 10,
    color: '#f59e0b'
  })
}

const removePrize = (index) => {
  if (settings.prizes.length <= 2) return
  settings.prizes.splice(index, 1)
}

const downloadJson = () => {
  const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `wheel-settings-${tenantSlug.value}-${campaignId.value || 'draft'}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

watch(storageKey, () => {
  assignDeep(settings, defaultSettings())
  loadSettings()
  previewKey.value += 1
})

watch(
  settings,
  () => {
    schedulePreviewSync()
  },
  { deep: true }
)

onMounted(() => {
  loadSettings()
  saveSettings({ silent: true })
})
</script>

<template>
  <div class="space-y-6">
    <section class="sticky top-0 z-40 rounded-b-[1.75rem] border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.18em] text-orange-500">設定操作</p>
          <p class="text-sm font-bold text-slate-500">
            修改會自動同步右側正式玩家頁預覽；需要保存時仍可按「儲存設定」。
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span v-if="savedMessage" class="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">
            {{ savedMessage }}
          </span>
          <span v-if="copiedMessage" class="rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700">
            {{ copiedMessage }}
          </span>

          <button
            type="button"
            class="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow transition hover:-translate-y-0.5 hover:bg-slate-800"
            @click="saveSettings"
          >
            儲存設定
          </button>
          <button
            type="button"
            class="rounded-2xl border border-orange-200 bg-orange-50 px-5 py-3 text-sm font-black text-orange-700 transition hover:bg-orange-100"
            @click="openPlayer"
          >
            開啟玩家頁
          </button>
          <button
            type="button"
            class="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            @click="resetSettings"
          >
            還原預設
          </button>
        </div>
      </div>
    </section>
    <section class="overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-sm">
      <div class="grid gap-0 xl:grid-cols-[1fr_0.72fr]">
        <div class="bg-gradient-to-br from-slate-950 via-orange-950 to-slate-900 p-6 text-white">
          <p class="text-xs font-black uppercase tracking-[0.24em] text-orange-200">
            Wheel Admin Center｜第 51201～51600 批
          </p>
          <h1 class="mt-3 text-3xl font-black">
            輪盤單一活動設定
          </h1>
          <p class="mt-3 max-w-3xl text-sm font-bold leading-7 text-white/75">
            這裡是商家編輯幸運輪盤玩家畫面的地方。九宮格、砸金蛋已經有專屬設定頁，這批補上輪盤設定中心，避免進入模板中心後看不到可修改內容。
          </p>

          <div class="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              class="rounded-2xl bg-orange-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-orange-200"
              @click="saveSettings"
            >
              儲存設定
            </button>
            <button
              type="button"
              class="rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
              @click="openPlayer"
            >
              開啟玩家頁
            </button>
            <button
              type="button"
              class="rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
              @click="backToCampaigns"
            >
              回我的活動
            </button>
          </div>
        </div>

        <div class="grid gap-3 bg-orange-50 p-5">
          <div class="rounded-3xl border border-orange-100 bg-white p-4">
            <p class="text-xs font-black text-slate-400">目前活動</p>
            <p class="mt-2 text-2xl font-black text-slate-950">ID {{ campaignId || '-' }}</p>
            <p class="mt-1 text-sm font-bold text-slate-500">商家：{{ tenantSlug }}</p>
          </div>

          <div class="rounded-3xl border border-orange-100 bg-white p-4">
            <p class="text-xs font-black text-slate-400">正式玩家網址</p>
            <p class="mt-2 break-all font-mono text-xs font-black leading-6 text-slate-700">{{ playerUrl }}</p>
            <button
              type="button"
              class="mt-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-black text-orange-700"
              @click="copyText(playerUrl, '已複製輪盤玩家網址')"
            >
              複製網址
            </button>

            <div class="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-6 text-amber-800">
              目前此頁先儲存「輪盤設定草稿」與右側預覽。若要讓正式玩家網址立即套用，需要下一批把 WheelGameView.vue 串接這份設定。
            </div>
          </div>
        </div>
      </div>
    </section>

    <section v-if="savedMessage || copiedMessage" class="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-700">
      {{ savedMessage || copiedMessage }}
    </section>

    <section class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div class="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.2em] text-orange-500">設定分類</p>
          <h2 class="mt-2 text-2xl font-black text-slate-950">輪盤設定分類</h2>
          <p class="mt-2 text-sm font-bold text-slate-500">簡易模式會把進階項目收起來，商家只要照分類修改就好。</p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            @click="activeCategory = 'basic'"
          >
            回到簡易模式
          </button>
          <button
            type="button"
            class="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            @click="resetSettings"
          >
            重設
          </button>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <button
          v-for="category in settingCategories"
          :key="category.key"
          type="button"
          class="group rounded-[1.6rem] border p-4 text-left transition"
          :class="activeCategory === category.key
            ? 'border-orange-300 bg-gradient-to-br from-orange-500 to-purple-600 text-white shadow-xl shadow-orange-200/70'
            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-orange-200 hover:bg-orange-50'
          "
          @click="setCategory(category.key)"
        >
          <div class="flex items-center gap-3">
            <span
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black shadow-sm"
              :class="activeCategory === category.key ? 'bg-white/20 text-white' : 'bg-white text-slate-700'"
            >
              {{ category.icon }}
            </span>
            <div>
              <p class="text-base font-black">{{ category.title }}</p>
              <p :class="['mt-1 text-xs font-bold leading-5', activeCategory === category.key ? 'text-white/80' : 'text-slate-400']">
                {{ category.desc }}
              </p>
            </div>
          </div>
        </button>
      </div>
    </section>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
      <div class="space-y-6">
        <section v-show="activeCategory === 'basic'" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div class="mb-5 flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.2em] text-orange-500">基本文字</p>
              <h2 class="mt-2 text-2xl font-black text-slate-950">基本文字</h2>
              <p class="mt-2 text-sm font-bold text-slate-500">調整玩家頁標題、品牌文字與按鈕文字。</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button type="button" class="rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white" @click="saveSettings">
                儲存設定
              </button>
              <button type="button" class="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-500" @click="resetSettings">
                還原預設
              </button>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <label class="grid gap-2 text-sm font-black text-slate-700">
              頁面標題
              <input v-model="settings.pageTitle" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
            </label>
            <label class="grid gap-2 text-sm font-black text-slate-700">
              品牌名稱
              <input v-model="settings.brandName" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
            </label>
            <label class="grid gap-2 text-sm font-black text-slate-700">
              品牌副標
              <input v-model="settings.brandSubtitle" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
            </label>
            <label class="grid gap-2 text-sm font-black text-slate-700">
              主標題
              <input v-model="settings.headline" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
            </label>
            <label class="grid gap-2 text-sm font-black text-slate-700">
              副標題
              <input v-model="settings.subtitle" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
            </label>
            <label class="grid gap-2 text-sm font-black text-slate-700">
              標籤文字
              <input v-model="settings.badgeText" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
            </label>
            <label class="grid gap-2 text-sm font-black text-slate-700">
              抽獎按鈕文字
              <input v-model="settings.playButtonText" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
            </label>
            <label class="grid gap-2 text-sm font-black text-slate-700">
              驗證按鈕文字
              <input v-model="settings.verifyButtonText" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
            </label>
          </div>

          <div class="mt-6 rounded-3xl border border-orange-100 bg-orange-50 p-5">
            <p class="text-xs font-black uppercase tracking-[0.2em] text-orange-500">品牌格子設定</p>
            <h3 class="mt-2 text-lg font-black text-slate-950">上方品牌格子 / LOGO / 超連結</h3>
            <p class="mt-1 text-sm font-bold text-slate-500">可放商家 LOGO 圖片網址，點擊後連到官網、LINE 或活動頁。</p>

            <div class="mt-4 grid gap-4 md:grid-cols-2">
              <label class="grid gap-2 text-sm font-black text-slate-700">
                品牌 LOGO 圖片網址
                <input v-model="settings.brandLogoUrl" placeholder="https://..." class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
              </label>
              <label class="grid gap-2 text-sm font-black text-slate-700">
                品牌超連結
                <input v-model="settings.brandLinkUrl" placeholder="https:// 或 LINE 官方帳號連結" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
              </label>
              <label class="grid gap-2 text-sm font-black text-slate-700">
                品牌連結文字
                <input v-model="settings.brandLinkText" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
              </label>
              <label class="grid gap-2 text-sm font-black text-slate-700">
                品牌文字顏色
                <div class="flex gap-2">
                  <input v-model="settings.brandTextColor" type="color" class="h-12 w-14 rounded-xl border border-slate-200 bg-white p-1" />
                  <input v-model="settings.brandTextColor" class="min-w-0 flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400" />
                </div>
              </label>
              <label class="grid gap-2 text-sm font-black text-slate-700">
                LOGO 大小
                <input v-model.number="settings.brandLogoSize" type="range" min="40" max="96" class="w-full" />
                <span class="text-xs font-bold text-slate-400">{{ settings.brandLogoSize }} px</span>
              </label>
              <label class="grid gap-2 text-sm font-black text-slate-700">
                品牌標題文字大小
                <input v-model.number="settings.brandTitleSize" type="range" min="14" max="34" class="w-full" />
                <span class="text-xs font-bold text-slate-400">{{ settings.brandTitleSize }} px</span>
              </label>
            </div>
          </div>
        </section>

        <section v-show="activeCategory === 'theme'" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-orange-500">主題色彩</p>
          <h2 class="mt-2 text-2xl font-black text-slate-950">主題色彩設定</h2>
          <p class="mt-2 text-sm font-bold text-slate-500">只調整整體配色：背景、面板、按鈕、指針與輪盤主色。</p>

          <div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label v-for="(value, key) in settings.theme" :key="key" class="grid gap-2 text-sm font-black text-slate-700">
              <span>{{ themeLabels[key] || key }}</span>
              <div class="flex gap-2">
                <input v-model="settings.theme[key]" type="color" class="h-12 w-14 rounded-xl border border-slate-200 bg-white p-1" />
                <input v-model="settings.theme[key]" class="min-w-0 flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400" />
              </div>
              <span class="text-xs font-bold leading-5 text-slate-400">{{ themeDescriptions[key] || '調整輪盤玩家頁視覺顏色。' }}</span>
            </label>
          </div>
        </section>

        <section v-show="activeCategory === 'wheel'" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-orange-500">輪盤樣式</p>
          <h2 class="mt-2 text-2xl font-black text-slate-950">輪盤外觀與獎項顯示</h2>
          <p class="mt-2 text-sm font-bold text-slate-500">這裡只管輪盤本體：尺寸、外框、中心按鈕、指針、獎項文字與圖示。</p>

          <div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label class="grid gap-2 text-sm font-black text-slate-700">
              輪盤尺寸
              <input v-model.number="settings.wheelStyle.wheelSize" type="range" min="260" max="420" class="w-full" />
              <span class="text-xs font-bold text-slate-400">{{ settings.wheelStyle.wheelSize }} px</span>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              外框粗細
              <input v-model.number="settings.wheelStyle.outerRingWidth" type="range" min="6" max="22" class="w-full" />
              <span class="text-xs font-bold text-slate-400">{{ settings.wheelStyle.outerRingWidth }} px</span>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              中心按鈕大小
              <input v-model.number="settings.wheelStyle.centerButtonSize" type="range" min="64" max="120" class="w-full" />
              <span class="text-xs font-bold text-slate-400">{{ settings.wheelStyle.centerButtonSize }} px</span>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              指針大小
              <input v-model.number="settings.wheelStyle.pointerSize" type="range" min="28" max="64" class="w-full" />
              <span class="text-xs font-bold text-slate-400">{{ settings.wheelStyle.pointerSize }} px</span>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              獎項文字大小
              <input v-model.number="settings.wheelStyle.prizeTextSize" type="range" min="10" max="20" class="w-full" />
              <span class="text-xs font-bold text-slate-400">{{ settings.wheelStyle.prizeTextSize }} px</span>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              獎項圖示大小
              <input v-model.number="settings.wheelStyle.prizeIconSize" type="range" min="24" max="54" class="w-full" />
              <span class="text-xs font-bold text-slate-400">{{ settings.wheelStyle.prizeIconSize }} px</span>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              獎項離中心距離
              <input v-model.number="settings.wheelStyle.prizeLabelRadius" type="range" min="20" max="42" class="w-full" />
              <span class="text-xs font-bold text-slate-400">{{ settings.wheelStyle.prizeLabelRadius }} %</span>
            </label>
          </div>

          <div class="mt-5 grid gap-3 md:grid-cols-3">
            <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              顯示獎項圖示
              <input v-model="settings.wheelStyle.showPrizeIcon" type="checkbox" class="h-5 w-5 shrink-0" />
            </label>
            <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              顯示獎項名稱
              <input v-model="settings.wheelStyle.showPrizeName" type="checkbox" class="h-5 w-5 shrink-0" />
            </label>
            <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              顯示分隔線
              <input v-model="settings.wheelStyle.showSliceBorder" type="checkbox" class="h-5 w-5 shrink-0" />
            </label>
          </div>
        </section>

        <section v-show="activeCategory === 'display'" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-orange-500">展示區塊</p>
          <h2 class="mt-2 text-2xl font-black text-slate-950">玩家頁展示區塊</h2>
          <p class="mt-2 text-sm font-bold text-slate-500">控制玩家頁要不要顯示剩餘次數、抽獎紀錄、獎品展示等區塊。</p>

          <div class="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              <span>
                <span class="block">顯示剩餘次數</span>
                <span class="mt-1 block text-xs font-bold text-slate-400">顯示目前可轉盤次數。</span>
              </span>
              <input v-model="settings.display.showRemainingChance" type="checkbox" class="h-5 w-5 shrink-0" />
            </label>

            <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              <span>
                <span class="block">顯示抽獎紀錄</span>
                <span class="mt-1 block text-xs font-bold text-slate-400">玩家頁下方顯示我的抽獎紀錄。</span>
              </span>
              <input v-model="settings.display.showHistory" type="checkbox" class="h-5 w-5 shrink-0" />
            </label>

            <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              <span>
                <span class="block">顯示獎品展示</span>
                <span class="mt-1 block text-xs font-bold text-slate-400">顯示獎品展示橫向區塊。</span>
              </span>
              <input v-model="settings.display.showPrizeShelf" type="checkbox" class="h-5 w-5 shrink-0" />
            </label>

            <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              <span>
                <span class="block">顯示品牌卡片</span>
                <span class="mt-1 block text-xs font-bold text-slate-400">玩家頁上方品牌 Logo / 活動名稱。</span>
              </span>
              <input v-model="settings.display.showBrandCard" type="checkbox" class="h-5 w-5 shrink-0" />
            </label>

            <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              <span>
                <span class="block">顯示活動狀態</span>
                <span class="mt-1 block text-xs font-bold text-slate-400">顯示活動進行中、活動提示。</span>
              </span>
              <input v-model="settings.display.showStatusCard" type="checkbox" class="h-5 w-5 shrink-0" />
            </label>

            <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              <span>
                <span class="block">顯示除錯資訊</span>
                <span class="mt-1 block text-xs font-bold text-slate-400">只建議測試時開啟，正式頁請關閉。</span>
              </span>
              <input v-model="settings.display.showDebugInfo" type="checkbox" class="h-5 w-5 shrink-0" />
            </label>
          </div>
        </section>

        <section v-show="activeCategory === 'sound'" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-orange-500">音效特效</p>
          <h2 class="mt-2 text-2xl font-black text-slate-950">音效與動畫效果</h2>
          <p class="mt-2 text-sm font-bold text-slate-500">這裡只管理聲音、跑燈、指針抖動、結果特效，不再混到展示開關。</p>

          <div class="mt-5 grid gap-3 md:grid-cols-2">
            <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              開啟遊戲音效
              <input v-model="settings.display.enableSound" type="checkbox" class="h-5 w-5 shrink-0" />
            </label>
            <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              轉盤卡點聲
              <input v-model="settings.effects.enableTickSound" type="checkbox" class="h-5 w-5 shrink-0" />
            </label>
            <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              結果音效
              <input v-model="settings.effects.enableResultSound" type="checkbox" class="h-5 w-5 shrink-0" />
            </label>
            <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              指針微震動
              <input v-model="settings.effects.enablePointerShake" type="checkbox" class="h-5 w-5 shrink-0" />
            </label>
            <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              外圈光暈
              <input v-model="settings.effects.enableLightGlow" type="checkbox" class="h-5 w-5 shrink-0" />
            </label>
            <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              中獎彩帶
              <input v-model="settings.effects.enableConfetti" type="checkbox" class="h-5 w-5 shrink-0" />
            </label>
          </div>
        </section>

        <section v-show="activeCategory === 'rules'" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-orange-500">規則說明</p>
          <h2 class="mt-2 text-2xl font-black text-slate-950">活動規則與獎品說明</h2>
          <p class="mt-2 text-sm font-bold text-slate-500">這裡只編輯玩家會看到的規則文字與獎品說明。</p>

          <div class="mt-5 grid gap-4">
            <div class="grid gap-3 md:grid-cols-2">
              <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
                顯示活動規則
                <input v-model="settings.display.showRules" type="checkbox" class="h-5 w-5 shrink-0" />
              </label>
              <label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
                顯示獎品說明
                <input v-model="settings.display.showPrizeInfo" type="checkbox" class="h-5 w-5 shrink-0" />
              </label>
            </div>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              活動規則標題
              <input v-model="settings.content.rulesTitle" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              活動規則內容
              <textarea v-model="settings.content.rulesText" rows="5" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"></textarea>
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              獎品說明標題
              <input v-model="settings.content.prizeInfoTitle" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
            </label>

            <label class="grid gap-2 text-sm font-black text-slate-700">
              獎品說明內容
              <textarea v-model="settings.content.prizeInfoText" rows="5" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"></textarea>
            </label>
          </div>
        </section>

        <section v-show="activeCategory === 'serial'" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-orange-500">序號抽獎</p>
          <h2 class="mt-2 text-2xl font-black text-slate-950">序號輸入與驗證文字</h2>
          <p class="mt-2 text-sm font-bold text-slate-500">讓商家可以調整玩家輸入序號時看到的提示文字。</p>

          <div class="mt-5 grid gap-4 md:grid-cols-2">
            <label class="grid gap-2 text-sm font-black text-slate-700">
              序號區標題
              <input v-model="settings.serialTitle" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
            </label>
            <label class="grid gap-2 text-sm font-black text-slate-700">
              驗證按鈕文字
              <input v-model="settings.verifyButtonText" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
            </label>
            <label class="grid gap-2 text-sm font-black text-slate-700 md:col-span-2">
              序號提示文字
              <textarea v-model="settings.serialHint" rows="4" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"></textarea>
            </label>
          </div>
        </section>

        <section v-show="activeCategory === 'result'" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-orange-500">結果彈窗</p>
          <h2 class="mt-2 text-2xl font-black text-slate-950">中獎結果與按鈕文字</h2>
          <p class="mt-2 text-sm font-bold text-slate-500">整理玩家抽完輪盤後會看到的主要文字。</p>

          <div class="mt-5 grid gap-4 md:grid-cols-2">
            <label class="grid gap-2 text-sm font-black text-slate-700">
              結果標題
              <input v-model="settings.resultTitle" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
            </label>
            <label class="grid gap-2 text-sm font-black text-slate-700">
              開始轉盤按鈕
              <input v-model="settings.playButtonText" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
            </label>
          </div>
        </section>

        <section v-show="activeCategory === 'frontend'" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-orange-500">前台設定</p>
          <h2 class="mt-2 text-2xl font-black text-slate-950">玩家網址與預覽操作</h2>
          <p class="mt-2 text-sm font-bold text-slate-500">這裡協助商家複製正式玩家網址、開啟玩家頁或下載目前設定。</p>

          <div class="mt-5 rounded-3xl border border-orange-100 bg-orange-50 p-5">
            <p class="text-xs font-black text-orange-500">正式玩家網址</p>
            <p class="mt-2 break-all font-mono text-sm font-black leading-7 text-slate-800">{{ playerUrl }}</p>
            <div class="mt-4 flex flex-wrap gap-3">
              <button type="button" class="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white" @click="openPlayer">開啟玩家頁</button>
              <button type="button" class="rounded-2xl border border-orange-200 bg-white px-5 py-3 text-sm font-black text-orange-700" @click="copyText(playerUrl, '已複製輪盤玩家網址')">複製網址</button>
              <button type="button" class="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600" @click="downloadJson">下載設定 JSON</button>
            </div>
          </div>
        </section>

        <section v-show="activeCategory === 'prizes'" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div class="mb-5 flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.2em] text-orange-500">Prize Wheel</p>
              <h2 class="mt-2 text-2xl font-black text-slate-950">輪盤獎項</h2>
              <p class="mt-2 text-sm font-bold text-slate-500">可設定獎項名稱、emoji、圖片網址、連結、權重與色塊；圖片會自動縮放成適合輪盤的大小。</p>
            </div>
            <button type="button" class="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white" @click="addPrize">
              新增獎項
            </button>
          </div>

          <div class="grid gap-3">
            <article v-for="(prize, index) in settings.prizes" :key="prize.id" class="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 xl:grid-cols-[92px_1fr_1fr_110px_110px_auto] xl:items-end">
              <label class="grid gap-2 text-xs font-black text-slate-500">
                圖示 / emoji
                <input v-model="prize.icon" class="rounded-2xl border border-slate-200 px-3 py-3 text-center text-xl" />
              </label>
              <label class="grid gap-2 text-xs font-black text-slate-500">
                獎項名稱
                <input v-model="prize.name" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              </label>
              <label class="grid gap-2 text-xs font-black text-slate-500">
                圖片網址
                <input v-model="prize.imageUrl" placeholder="https://...png / jpg / webp" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              </label>
              <label class="grid gap-2 text-xs font-black text-slate-500">
                權重
                <input v-model.number="prize.weight" type="number" min="0" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              </label>
              <label class="grid gap-2 text-xs font-black text-slate-500">
                顏色
                <input v-model="prize.color" type="color" class="h-12 w-full rounded-2xl border border-slate-200 bg-white p-1" />
              </label>
              <button type="button" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-black text-rose-600 disabled:opacity-40" :disabled="settings.prizes.length <= 2" @click="removePrize(index)">
                刪除
              </button>

              <label class="grid gap-2 text-xs font-black text-slate-500 xl:col-span-6">
                獎項連結網址，可選
                <input v-model="prize.linkUrl" placeholder="https:// 商品頁 / 兌換說明 / LINE 連結" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              </label>
            </article>
          </div>
        </section>
      </div>

      <aside class="xl:sticky xl:top-5 xl:self-start">
        <section class="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 shadow-sm">
          <div class="p-5 text-white">
            <p class="text-xs font-black uppercase tracking-[0.22em] text-orange-200">Live Player Preview</p>
            <h2 class="mt-2 text-xl font-black">右側正式玩家頁預覽</h2>
            <p class="mt-2 text-xs font-bold leading-5 text-white/60">
              這裡改成直接載入 WheelGameView 正式玩家頁，不再使用簡易模擬畫面。修改左側設定後會自動儲存草稿並重新載入預覽。
            </p>
          </div>

          <div class="px-4 pb-5">
            <div class="mx-auto overflow-hidden rounded-[2rem] border-[10px] border-slate-900 bg-white shadow-2xl" style="max-width: 390px;">
              <div class="border-b border-slate-200 bg-white px-4 py-2 text-center text-[11px] font-black text-slate-400">
                正式玩家頁 iframe 預覽
              </div>

              <iframe
                :key="previewKey"
                :src="safePreviewUrl"
                title="輪盤正式玩家頁即時預覽"
                class="h-[720px] w-full bg-white"
                loading="eager"
              ></iframe>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                class="rounded-2xl bg-white px-4 py-3 text-xs font-black text-slate-950"
                @click="saveSettings"
              >
                儲存並重整預覽
              </button>
              <button
                type="button"
                class="rounded-2xl border border-white/20 px-4 py-3 text-xs font-black text-white"
                @click="openPlayer"
              >
                開啟正式玩家頁
              </button>
            </div>

            <div class="mt-3 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-xs font-bold leading-6 text-amber-100">
              注意：這個預覽會與目前瀏覽器的設定草稿同步。若要讓其他客人的手機也看到同樣設定，下一階段要把輪盤設定存進資料庫 API。
            </div>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>
