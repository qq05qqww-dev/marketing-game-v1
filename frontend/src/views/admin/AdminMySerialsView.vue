<script setup>
// Multi Game Platform V2.3 Tenant Edition
// 第 42801～43200 批：商家序號管理版面美化與操作分區優化版
//
// 新增位置：
// frontend/src/views/admin/AdminMySerialsView.vue
//
// 本頁目的：
// 1. 商家不用再進複雜的活動管理找序號。
// 2. 從「我的遊戲中心 → 管理序號」可直接帶 game / campaignId 進來。
// 3. 支援查詢、新增、批次新增、自動產生、停用、恢復、刪除、複製。
// 4. 使用既有後端 /api/serial-codes/campaigns/:campaignId API，不改 DB。

import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAdminCampaignsApi } from '../../api/campaign'
import http from '../../api/http'
import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const GAME_DEFINITIONS = [
  {
    type: 'WHEEL',
    key: 'wheel',
    path: 'wheel',
    title: '幸運輪盤',
    icon: '🎡',
    accent: 'orange'
  },
  {
    type: 'GRID',
    key: 'premium-grid',
    path: 'premium-grid',
    title: '精緻九宮格',
    icon: '🎁',
    accent: 'amber'
  },
  {
    type: 'GOLDEN_EGG',
    key: 'golden-egg',
    path: 'golden-egg',
    title: '砸金蛋',
    icon: '🥚',
    accent: 'rose'
  }
]

const PRODUCTION_FRONTEND_URL = 'https://marketing-game-v1.vercel.app'

const normalizePublicFrontendUrl = (value = '') => {
  return String(value || '').trim().replace(/\/$/, '')
}

const isLocalFrontendOrigin = (value = '') => {
  return /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(String(value || ''))
}

const publicFrontendOrigin = computed(() => {
  const envUrl = normalizePublicFrontendUrl(
    import.meta.env.VITE_PUBLIC_FRONTEND_URL ||
      import.meta.env.VITE_FRONTEND_URL ||
      import.meta.env.VITE_APP_FRONTEND_URL ||
      ''
  )

  if (envUrl) {
    return envUrl
  }

  if (typeof window === 'undefined') return PRODUCTION_FRONTEND_URL

  const currentOrigin = normalizePublicFrontendUrl(window.location.origin)

  if (isLocalFrontendOrigin(currentOrigin)) {
    return PRODUCTION_FRONTEND_URL
  }

  return currentOrigin || PRODUCTION_FRONTEND_URL
})

const campaigns = ref([])
const serialCodes = ref([])
const loadingCampaigns = ref(false)
const loadingSerials = ref(false)
const creating = ref(false)
const bulkCreating = ref(false)
const generating = ref(false)
const updatingId = ref(null)
const deletingId = ref(null)
const selectedGameKey = ref(String(route.query.game || 'wheel'))
const selectedCampaignId = ref(String(route.query.campaignId || ''))
const searchKeyword = ref('')
const statusFilter = ref('ALL')
const copiedMessage = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const lastReloadAt = ref('')
const autoRefreshEnabled = ref(true)
const refreshingByUser = ref(false)
const refreshTimer = ref(null)
const expandedCreate = ref(true)
const expandedBulk = ref(false)

const manualForm = reactive({
  code: '',
  rewardChance: 1,
  batchCode: 'MANUAL',
  note: '',
  status: 'UNUSED'
})

const bulkForm = reactive({
  codesText: '',
  rewardChance: 1,
  batchCode: 'BULK',
  note: ''
})

const generateForm = reactive({
  count: 10,
  rewardChance: 1,
  prefix: 'MGP',
  batchCode: 'AUTO',
  length: 12,
  note: ''
})

const role = computed(() => String(authStore.user?.role || '').toUpperCase())
const isPlatformAdmin = computed(() => ['ADMIN', 'SUPER_ADMIN'].includes(role.value))
const tenantSlug = computed(() => {
  return authStore.user?.tenantSlug || authStore.user?.tenant?.slug || route.query.tenantSlug || 'a-shop'
})

const currentGame = computed(() => {
  return GAME_DEFINITIONS.find((item) => item.key === selectedGameKey.value || item.type === selectedGameKey.value) || GAME_DEFINITIONS[0]
})

const availableCampaigns = computed(() => {
  return campaigns.value.filter((campaign) => {
    const gameType = String(campaign.gameType || '').toUpperCase()
    const isTargetGame = GAME_DEFINITIONS.some((game) => game.type === gameType)

    if (!isTargetGame) return false
    if (isPlatformAdmin.value) return true

    const campaignTenantSlug = campaign.tenant?.slug || campaign.tenantSlug || campaign.merchantSlug || tenantSlug.value

    return String(campaignTenantSlug || '') === String(tenantSlug.value || '')
  })
})

const gameCampaignMap = computed(() => {
  const map = {}

  GAME_DEFINITIONS.forEach((game) => {
    map[game.key] = availableCampaigns.value.find((campaign) => {
      return String(campaign.gameType || '').toUpperCase() === game.type
    }) || null
  })

  return map
})

const selectedCampaign = computed(() => {
  if (selectedCampaignId.value) {
    return availableCampaigns.value.find((campaign) => String(campaign.id) === String(selectedCampaignId.value)) || null
  }

  return gameCampaignMap.value[currentGame.value.key] || null
})

const selectedCampaignTitle = computed(() => {
  return selectedCampaign.value?.title || selectedCampaign.value?.name || '尚未選擇活動'
})

const selectedPlayerUrl = computed(() => {
  if (!selectedCampaign.value?.id) return ''

  return `${publicFrontendOrigin.value}/play/${tenantSlug.value}/${currentGame.value.path}?campaignId=${selectedCampaign.value.id}`
})

const filteredSerialCodes = computed(() => {
  const keyword = searchKeyword.value.trim().toUpperCase()

  return serialCodes.value.filter((item) => {
    const effectiveStatus = String(item.effectiveStatus || item.status || '').toUpperCase()
    const matchStatus = statusFilter.value === 'ALL' || effectiveStatus === statusFilter.value
    const matchKeyword = !keyword ||
      String(item.code || '').toUpperCase().includes(keyword) ||
      String(item.batchCode || '').toUpperCase().includes(keyword) ||
      String(item.note || '').toUpperCase().includes(keyword) ||
      String(item.distributedTo || '').toUpperCase().includes(keyword)

    return matchStatus && matchKeyword
  })
})

const bulkCodeCount = computed(() => {
  return bulkForm.codesText
    .split(/[\s,，、]+/)
    .map((item) => normalizeCode(item))
    .filter(Boolean).length
})

const generatePreviewText = computed(() => {
  const count = Number(generateForm.count || 0)
  const chance = Number(generateForm.rewardChance || 1)
  const prefix = String(generateForm.prefix || 'MGP').trim().toUpperCase()

  return `預計產生 ${count} 組，每組 ${chance} 次，前綴 ${prefix}`
})

const selectedGameHint = computed(() => {
  if (!selectedCampaign.value?.id) {
    return '請先建立並選擇活動後，再新增序號。'
  }

  return `目前正在管理：${currentGame.value.title}｜${selectedCampaignTitle.value}`
})

const summary = computed(() => {
  const rows = serialCodes.value
  const base = {
    total: rows.length,
    unused: 0,
    used: 0,
    disabled: 0,
    expired: 0,
    distributed: 0,
    undistributed: 0,
    totalChance: 0,
    usedCount: 0,
    remainingChance: 0
  }

  rows.forEach((item) => {
    const status = String(item.effectiveStatus || item.status || '').toUpperCase()

    if (status === 'UNUSED') base.unused += 1
    if (status === 'USED') base.used += 1
    if (status === 'DISABLED') base.disabled += 1
    if (status === 'EXPIRED') base.expired += 1
    if (item.distributedAt) base.distributed += 1
    if (!item.distributedAt) base.undistributed += 1

    base.totalChance += Number(item.totalChance ?? item.rewardChance ?? 1)
    base.usedCount += Number(item.usedCount ?? item.serialUsedCount ?? 0)
    base.remainingChance += Number(item.remainingChance ?? item.remainingSerialChances ?? item.rewardChance ?? 1)
  })

  return base
})

const statusOptions = [
  { label: '全部狀態', value: 'ALL' },
  { label: '可用', value: 'UNUSED' },
  { label: '已用完', value: 'USED' },
  { label: '已停用', value: 'DISABLED' },
  { label: '已過期', value: 'EXPIRED' }
]

const statusTextMap = {
  UNUSED: '可用',
  USED: '已用完',
  DISABLED: '已停用',
  EXPIRED: '已過期'
}

const getStatusText = (status) => {
  return statusTextMap[String(status || '').toUpperCase()] || status || '未知'
}

const getStatusClass = (status) => {
  const value = String(status || '').toUpperCase()

  if (value === 'UNUSED') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  if (value === 'USED') return 'bg-slate-100 text-slate-600 border-slate-200'
  if (value === 'DISABLED') return 'bg-amber-100 text-amber-700 border-amber-200'
  if (value === 'EXPIRED') return 'bg-rose-100 text-rose-700 border-rose-200'

  return 'bg-slate-100 text-slate-500 border-slate-200'
}

const formatDate = (value) => {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatTime = (value) => {
  if (!value) return '尚未重新讀取'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '尚未重新讀取'

  return date.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const setReloadTimestamp = () => {
  lastReloadAt.value = new Date().toISOString()
}

const unwrapData = (response) => {
  const payload = response?.data ?? response

  return payload?.data ?? payload
}

const setSuccess = (message) => {
  successMessage.value = message
  errorMessage.value = ''

  window.setTimeout(() => {
    successMessage.value = ''
  }, 2200)
}

const setError = (message) => {
  errorMessage.value = message
  successMessage.value = ''
}

const normalizeCode = (value) => {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-')
    .replace(/[^A-Z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
}

const syncQuery = () => {
  router.replace({
    path: '/admin/my-serials',
    query: {
      game: selectedGameKey.value,
      ...(selectedCampaign.value?.id ? { campaignId: selectedCampaign.value.id } : {})
    }
  })
}

const loadCampaigns = async () => {
  loadingCampaigns.value = true
  errorMessage.value = ''

  try {
    const response = await getAdminCampaignsApi()
    const data = unwrapData(response)
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.campaigns)
          ? data.campaigns
          : []

    campaigns.value = list

    if (!selectedCampaignId.value) {
      const defaultCampaign = gameCampaignMap.value[currentGame.value.key]
      if (defaultCampaign?.id) {
        selectedCampaignId.value = String(defaultCampaign.id)
      }
    }
  } catch (error) {
    console.error('載入活動失敗:', error)
    setError(error?.response?.data?.message || error?.message || '載入活動失敗，請稍後再試。')
  } finally {
    loadingCampaigns.value = false
  }
}

const loadSerialCodes = async () => {
  if (!selectedCampaign.value?.id) {
    serialCodes.value = []
    return
  }

  loadingSerials.value = true
  errorMessage.value = ''

  try {
    const params = {}

    if (statusFilter.value !== 'ALL') params.status = statusFilter.value
    if (searchKeyword.value.trim()) params.keyword = searchKeyword.value.trim()

    const response = await http.get(`/serial-codes/campaigns/${selectedCampaign.value.id}`, { params })
    const data = unwrapData(response)

    serialCodes.value = Array.isArray(data) ? data : data?.items || data?.serialCodes || []
    setReloadTimestamp()
  } catch (error) {
    console.error('載入序號失敗:', error)
    setError(error?.response?.data?.message || error?.message || '載入序號失敗。')
  } finally {
    loadingSerials.value = false
  }
}

const refreshSerialCodes = async ({ silent = false } = {}) => {
  if (!selectedCampaign.value?.id) {
    serialCodes.value = []
    return
  }

  if (!silent) {
    refreshingByUser.value = true
  }

  try {
    await loadSerialCodes()

    if (!silent) {
      setSuccess('序號列表已重新讀取，玩家遊玩後的剩餘次數已同步。')
    }
  } finally {
    if (!silent) {
      refreshingByUser.value = false
    }
  }
}

const startAutoRefresh = () => {
  stopAutoRefresh()

  if (!autoRefreshEnabled.value) return

  refreshTimer.value = window.setInterval(() => {
    if (document.hidden) return
    if (!selectedCampaign.value?.id) return
    refreshSerialCodes({ silent: true })
  }, 15000)
}

const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    window.clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

const handleVisibilityChange = () => {
  if (!document.hidden) {
    refreshSerialCodes({ silent: true })
  }
}

const createManualSerialCode = async () => {
  if (!selectedCampaign.value?.id) {
    setError('請先選擇已建立的正式活動。')
    return
  }

  const code = normalizeCode(manualForm.code)

  if (!code || code.length < 4) {
    setError('序號至少需要 4 個字元。')
    return
  }

  creating.value = true

  try {
    await http.post(`/serial-codes/campaigns/${selectedCampaign.value.id}/manual`, {
      code,
      rewardChance: Number(manualForm.rewardChance || 1),
      batchCode: manualForm.batchCode || 'MANUAL',
      note: manualForm.note || '',
      status: manualForm.status || 'UNUSED'
    })

    manualForm.code = ''
    setSuccess('手動序號已建立。')
    await loadSerialCodes()
  } catch (error) {
    console.error('建立手動序號失敗:', error)
    setError(error?.response?.data?.message || error?.message || '建立序號失敗。')
  } finally {
    creating.value = false
  }
}

const createBulkSerialCodes = async () => {
  if (!selectedCampaign.value?.id) {
    setError('請先選擇已建立的正式活動。')
    return
  }

  if (!bulkForm.codesText.trim()) {
    setError('請輸入要批次建立的序號。')
    return
  }

  bulkCreating.value = true

  try {
    const response = await http.post(`/serial-codes/campaigns/${selectedCampaign.value.id}/bulk`, {
      codesText: bulkForm.codesText,
      rewardChance: Number(bulkForm.rewardChance || 1),
      batchCode: bulkForm.batchCode || 'BULK',
      note: bulkForm.note || ''
    })
    const result = unwrapData(response)

    bulkForm.codesText = ''
    setSuccess(`批次建立完成，新增 ${result?.createdCount ?? 0} 組，略過 ${result?.skippedCount ?? 0} 組。`)
    await loadSerialCodes()
  } catch (error) {
    console.error('批次建立序號失敗:', error)
    setError(error?.response?.data?.message || error?.message || '批次建立序號失敗。')
  } finally {
    bulkCreating.value = false
  }
}

const generateSerialCodes = async () => {
  if (!selectedCampaign.value?.id) {
    setError('請先選擇已建立的正式活動。')
    return
  }

  generating.value = true

  try {
    const response = await http.post(`/serial-codes/campaigns/${selectedCampaign.value.id}/generate`, {
      count: Number(generateForm.count || 1),
      rewardChance: Number(generateForm.rewardChance || 1),
      prefix: generateForm.prefix || 'MGP',
      batchCode: generateForm.batchCode || 'AUTO',
      length: Number(generateForm.length || 12),
      note: generateForm.note || ''
    })
    const result = unwrapData(response)

    setSuccess(`自動產生完成，新增 ${result?.createdCount ?? 0} 組。`)
    await loadSerialCodes()
  } catch (error) {
    console.error('自動產生序號失敗:', error)
    setError(error?.response?.data?.message || error?.message || '自動產生序號失敗。')
  } finally {
    generating.value = false
  }
}

const updateSerialStatus = async (serialCode, status) => {
  updatingId.value = serialCode.id

  try {
    await http.patch(`/serial-codes/${serialCode.id}`, {
      status
    })

    setSuccess(status === 'UNUSED' ? '序號已恢復可用。' : '序號狀態已更新。')
    await loadSerialCodes()
  } catch (error) {
    console.error('更新序號狀態失敗:', error)
    setError(error?.response?.data?.message || error?.message || '更新序號狀態失敗。')
  } finally {
    updatingId.value = null
  }
}

const markDistributed = async (serialCode) => {
  updatingId.value = serialCode.id

  try {
    await http.patch(`/serial-codes/${serialCode.id}/distribute`, {
      distributedChannel: 'MERCHANT',
      note: serialCode.note || ''
    })

    setSuccess('已標記為已發放。')
    await loadSerialCodes()
  } catch (error) {
    console.error('標記發放失敗:', error)
    setError(error?.response?.data?.message || error?.message || '標記發放失敗。')
  } finally {
    updatingId.value = null
  }
}

const deleteSerialCode = async (serialCode) => {
  const confirmed = window.confirm(`確定要刪除序號「${serialCode.code}」嗎？此操作無法復原。`)

  if (!confirmed) return

  deletingId.value = serialCode.id

  try {
    await http.delete(`/serial-codes/${serialCode.id}`)
    setSuccess('序號已刪除。')
    await loadSerialCodes()
  } catch (error) {
    console.error('刪除序號失敗:', error)
    setError(error?.response?.data?.message || error?.message || '刪除序號失敗。')
  } finally {
    deletingId.value = null
  }
}

const copyText = async (text, message = '已複製到剪貼簿') => {
  if (!text) return

  try {
    await navigator.clipboard.writeText(text)
    copiedMessage.value = message
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
    copiedMessage.value = message
  }

  window.setTimeout(() => {
    copiedMessage.value = ''
  }, 1800)
}

const copyVisibleCodes = () => {
  const codes = filteredSerialCodes.value.map((item) => item.code).join('\n')

  copyText(codes, `已複製 ${filteredSerialCodes.value.length} 組序號。`)
}

const exportCsv = () => {
  if (!selectedCampaign.value?.id) {
    setError('請先選擇活動。')
    return
  }

  const url = `${http.defaults.baseURL || ''}/serial-codes/campaigns/${selectedCampaign.value.id}/export.csv`
  window.open(url, '_blank', 'noopener,noreferrer')
}

const goCampaigns = () => {
  router.push({
    path: '/admin/campaigns',
    query: {
      campaignId: selectedCampaign.value?.id || '',
      gameType: currentGame.value.type,
      panel: 'serials'
    }
  })
}

const goMyGames = () => {
  router.push('/admin/my-games')
}

watch(selectedGameKey, async () => {
  const campaign = gameCampaignMap.value[currentGame.value.key]
  selectedCampaignId.value = campaign?.id ? String(campaign.id) : ''
  serialCodes.value = []
  syncQuery()
  await loadSerialCodes()
})

watch(selectedCampaignId, async () => {
  syncQuery()
  await loadSerialCodes()
})

watch([statusFilter, searchKeyword], () => {
  loadSerialCodes()
})

watch(autoRefreshEnabled, () => {
  startAutoRefresh()
})

onMounted(async () => {
  await loadCampaigns()

  const routeCampaignId = String(route.query.campaignId || '')
  if (routeCampaignId) {
    selectedCampaignId.value = routeCampaignId
  }

  await loadSerialCodes()
  startAutoRefresh()
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('focus', handleVisibilityChange)
})

onBeforeUnmount(() => {
  stopAutoRefresh()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('focus', handleVisibilityChange)
})
</script>

<template>
  <div class="space-y-6 p-4 sm:p-6 lg:p-8">
    <section class="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div class="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 px-6 py-7 text-white md:px-8">
        <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.25em] text-cyan-200">
              Merchant Serials｜第 42801～43200 批
            </p>
            <h1 class="mt-3 text-3xl font-black tracking-tight md:text-4xl">
              我的序號管理
            </h1>
            <p class="mt-3 max-w-3xl text-sm font-bold leading-7 text-slate-300">
              商家可以在這裡直接管理自己的輪盤、九宮格、砸金蛋序號，不用再進複雜的活動管理頁尋找。
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <button
              type="button"
              class="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:opacity-60"
              :disabled="refreshingByUser || loadingSerials || !selectedCampaign"
              @click="refreshSerialCodes()"
            >
              {{ refreshingByUser || loadingSerials ? '讀取中...' : '重新讀取序號' }}
            </button>
            <button
              type="button"
              class="rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
              @click="autoRefreshEnabled = !autoRefreshEnabled"
            >
              {{ autoRefreshEnabled ? '自動同步：開' : '自動同步：關' }}
            </button>
            <button
              type="button"
              class="rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
              @click="goMyGames"
            >
              回我的遊戲中心
            </button>
          </div>
        </div>
      </div>

      <div class="grid gap-4 border-t border-slate-100 bg-slate-50 px-6 py-5 md:grid-cols-3 md:px-8">
        <label class="rounded-3xl bg-white p-4 shadow-sm">
          <span class="text-xs font-black text-slate-400">選擇遊戲</span>
          <select
            v-model="selectedGameKey"
            class="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black outline-none focus:border-indigo-400"
          >
            <option
              v-for="game in GAME_DEFINITIONS"
              :key="game.key"
              :value="game.key"
            >
              {{ game.icon }} {{ game.title }}
            </option>
          </select>
        </label>

        <label class="rounded-3xl bg-white p-4 shadow-sm">
          <span class="text-xs font-black text-slate-400">目前活動</span>
          <select
            v-model="selectedCampaignId"
            class="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black outline-none focus:border-indigo-400"
          >
            <option value="">尚未選擇活動</option>
            <option
              v-for="campaign in availableCampaigns.filter((item) => String(item.gameType || '').toUpperCase() === currentGame.type)"
              :key="campaign.id"
              :value="String(campaign.id)"
            >
              #{{ campaign.id }}｜{{ campaign.title || campaign.name }}
            </option>
          </select>
        </label>

        <div class="rounded-3xl bg-white p-4 shadow-sm">
          <p class="text-xs font-black text-slate-400">正式玩家網址</p>
          <p class="mt-2 break-all text-xs font-black text-slate-700">
            {{ selectedPlayerUrl || '請先建立並選擇活動' }}
          </p>
          <button
            type="button"
            class="mt-3 rounded-xl border border-emerald-200 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-50"
            :disabled="!selectedPlayerUrl"
            @click="copyText(selectedPlayerUrl, '玩家網址已複製')"
          >
            複製玩家網址
          </button>
        </div>
      </div>
    </section>

    <div
      v-if="successMessage || errorMessage || copiedMessage"
      class="rounded-3xl border px-5 py-4 text-sm font-black"
      :class="errorMessage
        ? 'border-rose-200 bg-rose-50 text-rose-700'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700'"
    >
      {{ errorMessage || successMessage || copiedMessage }}
    </div>

    <section class="rounded-[2rem] border border-blue-100 bg-blue-50 p-5 shadow-sm">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-sm font-black text-blue-900">
            序號同步狀態
          </p>
          <p class="mt-1 text-xs font-bold leading-5 text-blue-700">
            玩家遊玩後，後端資料已更新；此頁需要重新讀取才會看到最新剩餘次數。已開啟自動同步時，每 15 秒會自動讀取一次。
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span class="rounded-full bg-white px-4 py-2 text-xs font-black text-blue-700 shadow-sm">
            最後讀取：{{ formatTime(lastReloadAt) }}
          </span>
          <span
            class="rounded-full px-4 py-2 text-xs font-black shadow-sm"
            :class="autoRefreshEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'"
          >
            {{ autoRefreshEnabled ? '自動同步中' : '手動同步' }}
          </span>
          <button
            type="button"
            class="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-60"
            :disabled="refreshingByUser || loadingSerials || !selectedCampaign"
            @click="refreshSerialCodes()"
          >
            {{ refreshingByUser || loadingSerials ? '讀取中...' : '立即重新讀取' }}
          </button>
        </div>
      </div>
    </section>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">全部序號</p>
        <p class="mt-3 text-3xl font-black text-slate-950">{{ summary.total }}</p>
        <p class="mt-1 text-xs font-bold text-slate-500">目前活動：{{ selectedCampaignTitle }}</p>
      </div>

      <div class="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
        <p class="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">可用序號</p>
        <p class="mt-3 text-3xl font-black text-emerald-700">{{ summary.unused }}</p>
        <p class="mt-1 text-xs font-bold text-emerald-600">剩餘次數 {{ summary.remainingChance }}</p>
      </div>

      <div class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">已使用</p>
        <p class="mt-3 text-3xl font-black text-slate-950">{{ summary.used }}</p>
        <p class="mt-1 text-xs font-bold text-slate-500">已消耗 {{ summary.usedCount }} 次</p>
      </div>

      <div class="rounded-[2rem] border border-amber-100 bg-amber-50 p-5 shadow-sm">
        <p class="text-xs font-black uppercase tracking-[0.18em] text-amber-600">停用 / 過期</p>
        <p class="mt-3 text-3xl font-black text-amber-700">{{ summary.disabled + summary.expired }}</p>
        <p class="mt-1 text-xs font-bold text-amber-600">已發放 {{ summary.distributed }} 組</p>
      </div>
    </section>

    <section class="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
      <div class="space-y-5">
        <section class="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div class="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6 text-white">
            <p class="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
              Serial Builder
            </p>
            <h2 class="mt-2 text-2xl font-black">
              建立序號
            </h2>
            <p class="mt-2 text-sm font-bold leading-6 text-white/70">
              {{ selectedGameHint }}
            </p>
          </div>

          <div class="grid gap-3 border-b border-slate-100 bg-slate-50 p-4 sm:grid-cols-3">
            <button
              type="button"
              class="rounded-2xl border px-4 py-3 text-left text-sm font-black transition"
              :class="expandedCreate ? 'border-slate-950 bg-slate-950 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'"
              @click="expandedCreate = true; expandedBulk = false"
            >
              <span class="block text-lg">➕</span>
              單組新增
            </button>
            <button
              type="button"
              class="rounded-2xl border px-4 py-3 text-left text-sm font-black transition"
              :class="expandedBulk ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'"
              @click="expandedBulk = true; expandedCreate = false"
            >
              <span class="block text-lg">📋</span>
              批次新增
            </button>
            <button
              type="button"
              class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
              @click="expandedCreate = false; expandedBulk = false"
            >
              <span class="block text-lg">⚡</span>
              自動產生
            </button>
          </div>

          <div class="p-6">
            <div
              v-if="expandedCreate"
              class="space-y-4"
            >
              <div class="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <p class="text-sm font-black text-slate-950">新增單組序號</p>
                <p class="mt-1 text-xs font-bold leading-5 text-slate-500">
                  適合指定 VIP、門市、活動券序號。
                </p>
              </div>

              <label class="block space-y-2">
                <span class="text-xs font-black text-slate-500">序號代碼</span>
                <input
                  v-model="manualForm.code"
                  class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black uppercase outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  placeholder="輸入序號，例如 VIP001"
                  @blur="manualForm.code = normalizeCode(manualForm.code)"
                >
              </label>

              <div class="grid gap-3 sm:grid-cols-2">
                <label class="block space-y-2">
                  <span class="text-xs font-black text-slate-500">可用次數</span>
                  <input
                    v-model.number="manualForm.rewardChance"
                    type="number"
                    min="1"
                    max="99"
                    class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  >
                </label>
                <label class="block space-y-2">
                  <span class="text-xs font-black text-slate-500">批次</span>
                  <input
                    v-model="manualForm.batchCode"
                    class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  >
                </label>
              </div>

              <label class="block space-y-2">
                <span class="text-xs font-black text-slate-500">備註</span>
                <input
                  v-model="manualForm.note"
                  class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  placeholder="例如：LINE 客戶、門市發放"
                >
              </label>

              <button
                type="button"
                class="w-full rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-black text-white transition hover:bg-indigo-700 disabled:opacity-60"
                :disabled="creating || !selectedCampaign"
                @click="createManualSerialCode"
              >
                {{ creating ? '建立中...' : '新增單組序號' }}
              </button>
            </div>

            <div
              v-else-if="expandedBulk"
              class="space-y-4"
            >
              <div class="rounded-3xl border border-indigo-100 bg-indigo-50 p-4">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-sm font-black text-indigo-950">批次新增序號</p>
                    <p class="mt-1 text-xs font-bold leading-5 text-indigo-600">
                      一行一組，或用逗號、空白分隔。系統會自動整理格式。
                    </p>
                  </div>
                  <span class="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-indigo-700 shadow-sm">
                    {{ bulkCodeCount }} 組
                  </span>
                </div>
              </div>

              <textarea
                v-model="bulkForm.codesText"
                rows="8"
                class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black uppercase leading-7 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                placeholder="VIP001&#10;VIP002&#10;VIP003"
              />

              <div class="grid gap-3 sm:grid-cols-2">
                <label class="block space-y-2">
                  <span class="text-xs font-black text-slate-500">每組可用次數</span>
                  <input
                    v-model.number="bulkForm.rewardChance"
                    type="number"
                    min="1"
                    max="99"
                    class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  >
                </label>
                <label class="block space-y-2">
                  <span class="text-xs font-black text-slate-500">批次</span>
                  <input
                    v-model="bulkForm.batchCode"
                    class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  >
                </label>
              </div>

              <button
                type="button"
                class="w-full rounded-2xl bg-indigo-600 px-5 py-3.5 text-sm font-black text-white transition hover:bg-indigo-700 disabled:opacity-60"
                :disabled="bulkCreating || !selectedCampaign"
                @click="createBulkSerialCodes"
              >
                {{ bulkCreating ? '批次建立中...' : '批次新增序號' }}
              </button>
            </div>

            <div
              v-else
              class="space-y-4"
            >
              <div class="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
                <p class="text-sm font-black text-emerald-950">自動產生序號</p>
                <p class="mt-1 text-xs font-bold leading-5 text-emerald-600">
                  適合一次產生大量隨機序號。{{ generatePreviewText }}
                </p>
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <label class="block space-y-2">
                  <span class="text-xs font-black text-slate-500">數量</span>
                  <input
                    v-model.number="generateForm.count"
                    type="number"
                    min="1"
                    max="500"
                    class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
                  >
                </label>
                <label class="block space-y-2">
                  <span class="text-xs font-black text-slate-500">每組可用次數</span>
                  <input
                    v-model.number="generateForm.rewardChance"
                    type="number"
                    min="1"
                    max="99"
                    class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
                  >
                </label>
                <label class="block space-y-2">
                  <span class="text-xs font-black text-slate-500">前綴</span>
                  <input
                    v-model="generateForm.prefix"
                    class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black uppercase outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
                  >
                </label>
                <label class="block space-y-2">
                  <span class="text-xs font-black text-slate-500">批次</span>
                  <input
                    v-model="generateForm.batchCode"
                    class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
                  >
                </label>
              </div>

              <button
                type="button"
                class="w-full rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
                :disabled="generating || !selectedCampaign"
                @click="generateSerialCodes"
              >
                {{ generating ? '產生中...' : '自動產生序號' }}
              </button>
            </div>
          </div>
        </section>

        <section class="rounded-[2rem] border border-amber-100 bg-amber-50 p-5">
          <p class="text-sm font-black text-amber-900">操作提醒</p>
          <div class="mt-3 grid gap-2 text-xs font-bold leading-5 text-amber-700">
            <p>1. 同一個序號不要跨活動共用。</p>
            <p>2. 客人玩完後可按右側「重新讀取」同步剩餘次數。</p>
            <p>3. 批次發放前可先用「複製目前序號」整理給門市。</p>
          </div>
        </section>
      </div>

      <section class="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div class="border-b border-slate-100 bg-gradient-to-r from-white to-slate-50 p-6">
          <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Serial List</p>
              <h2 class="mt-1 text-2xl font-black text-slate-950">序號列表</h2>
              <p class="mt-2 text-sm font-bold text-slate-500">
                可搜尋、篩選、複製、停用、恢復或刪除序號。
              </p>
            </div>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-black text-blue-700 transition hover:bg-blue-100 disabled:opacity-60"
              :disabled="refreshingByUser || loadingSerials || !selectedCampaign"
              @click="refreshSerialCodes()"
            >
              {{ refreshingByUser || loadingSerials ? '讀取中...' : '重新讀取' }}
            </button>
            <button
              type="button"
              class="rounded-2xl border border-slate-200 px-4 py-3 text-xs font-black text-slate-600 transition hover:bg-slate-50"
              @click="copyVisibleCodes"
            >
              複製目前序號
            </button>
            <button
              type="button"
              class="rounded-2xl border border-slate-200 px-4 py-3 text-xs font-black text-slate-600 transition hover:bg-slate-50"
              @click="exportCsv"
            >
              匯出 CSV
            </button>
            <button
              type="button"
              class="rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white transition hover:bg-indigo-700"
              @click="goCampaigns"
            >
              回活動序號面板
            </button>
          </div>
        </div>

        <div class="p-6">
        <div class="mb-5 grid gap-3 md:grid-cols-[1fr_180px]">
          <input
            v-model="searchKeyword"
            class="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-indigo-400"
            placeholder="搜尋序號、批次、備註、發放對象"
          >

          <select
            v-model="statusFilter"
            class="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black outline-none focus:border-indigo-400"
          >
            <option
              v-for="option in statusOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>

        <div
          v-if="!selectedCampaign"
          class="rounded-3xl border border-amber-100 bg-amber-50 p-6 text-sm font-black leading-7 text-amber-700"
        >
          目前尚未建立這個遊戲的正式活動。請先到「我的活動」建立並啟用活動，再回來建立序號。
        </div>

        <div
          v-else-if="loadingSerials"
          class="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-sm font-black text-slate-500"
        >
          正在載入序號...
        </div>

        <div
          v-else-if="!filteredSerialCodes.length"
          class="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-sm font-black text-slate-500"
        >
          目前沒有符合條件的序號。可以從左側新增單組、批次新增或自動產生。
        </div>

        <div
          v-else
          class="overflow-hidden rounded-3xl border border-slate-200"
        >
          <div class="max-h-[720px] overflow-auto">
            <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead class="sticky top-0 z-10 bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                <tr>
                  <th class="px-4 py-3">序號</th>
                  <th class="px-4 py-3">狀態</th>
                  <th class="px-4 py-3">次數</th>
                  <th class="px-4 py-3">批次 / 備註</th>
                  <th class="px-4 py-3">建立時間</th>
                  <th class="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>

              <tbody class="divide-y divide-slate-100 bg-white">
                <tr
                  v-for="item in filteredSerialCodes"
                  :key="item.id"
                  class="align-top"
                >
                  <td class="px-4 py-4">
                    <p class="font-mono text-sm font-black text-slate-950">{{ item.code }}</p>
                    <button
                      type="button"
                      class="mt-2 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-600 transition hover:bg-slate-50"
                      @click="copyText(item.code, '序號已複製')"
                    >
                      複製
                    </button>
                  </td>
                  <td class="px-4 py-4">
                    <span
                      class="rounded-full border px-3 py-1 text-xs font-black"
                      :class="getStatusClass(item.effectiveStatus || item.status)"
                    >
                      {{ getStatusText(item.effectiveStatus || item.status) }}
                    </span>
                    <p
                      v-if="item.distributedAt"
                      class="mt-2 text-xs font-bold text-slate-400"
                    >
                      已發放：{{ formatDate(item.distributedAt) }}
                    </p>
                  </td>
                  <td class="px-4 py-4 text-xs font-bold leading-6 text-slate-500">
                    <p>總次數：<span class="font-black text-slate-950">{{ item.totalChance ?? item.rewardChance ?? 1 }}</span></p>
                    <p>已使用：<span class="font-black text-slate-950">{{ item.usedCount ?? 0 }}</span></p>
                    <p>剩餘：<span class="font-black text-emerald-700">{{ item.remainingChance ?? item.rewardChance ?? 1 }}</span></p>
                  </td>
                  <td class="px-4 py-4 text-xs font-bold leading-6 text-slate-500">
                    <p>{{ item.batchCode || '-' }}</p>
                    <p>{{ item.note || '-' }}</p>
                  </td>
                  <td class="px-4 py-4 text-xs font-bold text-slate-500">
                    {{ formatDate(item.createdAt) }}
                  </td>
                  <td class="px-4 py-4 text-right">
                    <div class="flex flex-col items-end gap-2">
                      <button
                        v-if="!item.distributedAt"
                        type="button"
                        class="rounded-xl border border-blue-200 px-3 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-50 disabled:opacity-50"
                        :disabled="updatingId === item.id"
                        @click="markDistributed(item)"
                      >
                        標記已發放
                      </button>

                      <button
                        v-if="String(item.status).toUpperCase() !== 'DISABLED'"
                        type="button"
                        class="rounded-xl border border-amber-200 px-3 py-2 text-xs font-black text-amber-700 transition hover:bg-amber-50 disabled:opacity-50"
                        :disabled="updatingId === item.id"
                        @click="updateSerialStatus(item, 'DISABLED')"
                      >
                        停用
                      </button>

                      <button
                        v-else
                        type="button"
                        class="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                        :disabled="updatingId === item.id"
                        @click="updateSerialStatus(item, 'UNUSED')"
                      >
                        恢復
                      </button>

                      <button
                        type="button"
                        class="rounded-xl border border-rose-200 px-3 py-2 text-xs font-black text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                        :disabled="deletingId === item.id"
                        @click="deleteSerialCode(item)"
                      >
                        刪除
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </section>
    </section>
  </div>
</template>
