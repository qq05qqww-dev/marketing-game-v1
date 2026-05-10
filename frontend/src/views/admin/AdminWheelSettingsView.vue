// 第 49201～49600 批：輪盤設定中心中文化與分類操作版
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
    return isLocalOrigin(origin) ? PRODUCTION_FRONTEND_URL : origin
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
  prizes: [
    { id: 1, icon: '🎁', name: '50 元折價券', weight: 35, color: '#facc15' },
    { id: 2, icon: '🎫', name: '100 元折價券', weight: 25, color: '#fb7185' },
    { id: 3, icon: '🏆', name: '200 元折價券', weight: 15, color: '#fb923c' },
    { id: 4, icon: '😊', name: '未中獎', weight: 25, color: '#ef4444' }
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

const safePreviewUrl = computed(() => {
  const separator = playerUrl.value.includes('?') ? '&' : '?'
  return `${playerUrl.value}${separator}adminPreview=1&previewKey=${previewKey.value}`
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

const saveSettings = () => {
  try {
    localStorage.setItem(storageKey.value, JSON.stringify(settings))
    previewKey.value += 1
    savedMessage.value = '輪盤設定已儲存。正式串接後可同步給玩家頁讀取。'
    window.setTimeout(() => {
      savedMessage.value = ''
    }, 2200)
  } catch (error) {
    savedMessage.value = '儲存失敗，請檢查瀏覽器儲存權限。'
  }
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
})

onMounted(() => {
  loadSettings()
})
</script>

<template>
  <div class="space-y-6">
    <section class="overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-sm">
      <div class="grid gap-0 xl:grid-cols-[1fr_0.72fr]">
        <div class="bg-gradient-to-br from-slate-950 via-orange-950 to-slate-900 p-6 text-white">
          <p class="text-xs font-black uppercase tracking-[0.24em] text-orange-200">
            Wheel Admin Center｜第 49201～49600 批
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
            <button type="button" class="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-500" @click="resetSettings">
              還原預設
            </button>
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
        </section>

        <section v-show="activeCategory === 'theme' || activeCategory === 'wheel'" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-orange-500">主題色彩</p>
          <h2 class="mt-2 text-2xl font-black text-slate-950">視覺設定</h2>
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

        <section v-show="activeCategory === 'display' || activeCategory === 'sound' || activeCategory === 'rules'" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-orange-500">顯示開關</p>
          <h2 class="mt-2 text-2xl font-black text-slate-950">玩家畫面顯示設定</h2>
          <p class="mt-2 text-sm font-bold text-slate-500">這裡已改成中文名稱，避免商家看到英文欄位看不懂。</p>
          <div class="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <label v-for="(value, key) in settings.display" :key="key" class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              <span class="min-w-0">
                <span class="block">{{ displayLabels[key] || key }}</span>
                <span class="mt-1 block text-xs font-bold leading-5 text-slate-400">{{ displayDescriptions[key] || '控制玩家頁顯示或隱藏。' }}</span>
              </span>
              <input v-model="settings.display[key]" type="checkbox" class="h-5 w-5 shrink-0 rounded border-slate-300 text-orange-500" />
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
              <p class="mt-2 text-sm font-bold text-slate-500">這裡先提供商家設定 UI，正式機率仍以後端獎項資料為準。</p>
            </div>
            <button type="button" class="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white" @click="addPrize">
              新增獎項
            </button>
          </div>

          <div class="grid gap-3">
            <article v-for="(prize, index) in settings.prizes" :key="prize.id" class="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[80px_1fr_120px_120px_auto] md:items-end">
              <label class="grid gap-2 text-xs font-black text-slate-500">
                圖示
                <input v-model="prize.icon" class="rounded-2xl border border-slate-200 px-3 py-3 text-center text-xl" />
              </label>
              <label class="grid gap-2 text-xs font-black text-slate-500">
                獎項名稱
                <input v-model="prize.name" class="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
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
            </article>
          </div>
        </section>
      </div>

      <aside class="xl:sticky xl:top-5 xl:self-start">
        <section class="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div class="bg-slate-950 p-5 text-white">
            <p class="text-xs font-black uppercase tracking-[0.22em] text-orange-200">Live Preview</p>
            <h2 class="mt-2 text-xl font-black">右側即時預覽</h2>
            <p class="mt-2 text-xs font-bold leading-5 text-white/60">此預覽讓商家先看輪盤視覺；玩家正式頁仍由目前 WheelGameView 顯示。</p>
          </div>

          <div class="bg-slate-950 px-4 pb-5">
            <div class="mx-auto overflow-hidden rounded-[2rem] border-[10px] border-slate-900 bg-white shadow-2xl" style="max-width: 360px;">
              <div class="h-[680px] overflow-y-auto" :style="{ background: `linear-gradient(180deg, ${settings.theme.backgroundFrom}, ${settings.theme.backgroundTo})` }">
                <div class="p-5 text-white">
                  <div v-if="settings.display.showBrandCard" class="rounded-[2rem] border border-white/30 bg-white/20 p-4 shadow-inner backdrop-blur">
                    <p class="text-xs font-black uppercase tracking-[0.18em] text-white/80">{{ settings.brandName }}</p>
                    <h3 class="mt-2 text-xl font-black">{{ settings.pageTitle }}</h3>
                    <p class="mt-1 text-xs font-bold text-white/75">{{ settings.brandSubtitle }}</p>
                  </div>

                  <div class="mt-5 rounded-[2rem] border border-white/30 bg-white/20 p-5 text-center shadow-inner backdrop-blur">
                    <div class="mx-auto inline-flex rounded-full bg-white/20 px-4 py-2 text-xs font-black">👑 {{ settings.badgeText }}</div>
                    <h2 class="mt-5 text-4xl font-black drop-shadow">{{ settings.headline }}</h2>
                    <p class="mt-2 text-lg font-black text-white/90">{{ settings.subtitle }}</p>
                  </div>

                  <div v-if="settings.display.showRemainingChance" class="mt-4 rounded-full bg-white/20 px-4 py-3 text-center text-sm font-black shadow-inner">
                    剩餘次數 99｜可轉盤
                  </div>

                  <div class="relative mx-auto mt-5 aspect-square max-w-[300px] rounded-full border-[12px] border-white/80 p-3 shadow-2xl" :style="{ background: conicGradient }">
                    <div class="absolute -top-5 left-1/2 z-10 -translate-x-1/2 text-4xl" :style="{ color: settings.theme.pointerColor }">▼</div>
                    <div class="absolute inset-[38%] flex items-center justify-center rounded-full text-lg font-black text-white shadow-xl" :style="{ background: settings.theme.spinButtonColor }">
                      SPIN
                    </div>
                    <div class="grid h-full w-full place-items-center rounded-full border border-white/70 bg-white/10 text-center text-sm font-black text-white/95 backdrop-blur-[1px]">
                      <div class="grid gap-1">
                        <span v-for="prize in previewPrizes.slice(0, 4)" :key="prize.id">{{ settings.display.hidePrizesBeforeDraw ? '神秘獎品' : `${prize.icon} ${prize.name}` }}</span>
                      </div>
                    </div>
                  </div>

                  <button class="mt-5 w-full rounded-full px-5 py-4 text-base font-black text-white shadow-xl" :style="{ background: `linear-gradient(90deg, ${settings.theme.actionButtonFrom}, ${settings.theme.actionButtonTo})` }">
                    {{ settings.playButtonText }}
                  </button>

                  <div v-if="settings.display.showSerialBox" class="mt-5 rounded-[2rem] border border-white/30 bg-white/20 p-4 text-center shadow-inner backdrop-blur">
                    <h3 class="font-black">{{ settings.serialTitle }}</h3>
                    <p class="mt-2 text-xs font-bold leading-5 text-white/75">{{ settings.serialHint }}</p>
                    <div class="mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-black text-orange-600">請輸入序號</div>
                    <div class="mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-black text-orange-600">{{ settings.verifyButtonText }}</div>
                  </div>

                  <div v-if="settings.display.showHistory" class="mt-5 rounded-[2rem] bg-white/95 p-4 text-slate-900 shadow-xl">
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="text-sm font-black">我的抽獎紀錄</p>
                        <p class="mt-1 text-xs font-bold text-slate-400">最近 0 筆紀錄直接顯示在前台</p>
                      </div>
                      <span class="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-600">全部紀錄</span>
                    </div>
                    <div class="mt-3 rounded-2xl bg-orange-50 px-4 py-4 text-center text-xs font-black text-orange-600">完成轉盤後會直接顯示在這裡。</div>
                  </div>

                  <div class="mt-5 grid gap-3">
                    <div v-if="settings.display.showRules" class="rounded-3xl bg-white/95 p-4 text-slate-900">
                      <p class="font-black">活動規則</p>
                      <p class="mt-1 text-xs font-bold text-slate-400">點擊展開查看參加方式</p>
                    </div>
                    <div v-if="settings.display.showPrizeInfo" class="rounded-3xl bg-white/95 p-4 text-slate-900">
                      <p class="font-black">獎品說明</p>
                      <p class="mt-1 text-xs font-bold text-slate-400">點擊展開查看獎品規則</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-2">
              <button type="button" class="rounded-2xl bg-white px-4 py-3 text-xs font-black text-slate-950" @click="previewKey += 1">重新整理預覽</button>
              <button type="button" class="rounded-2xl border border-white/20 px-4 py-3 text-xs font-black text-white" @click="downloadJson">下載設定 JSON</button>
            </div>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>
