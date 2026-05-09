<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
  getAdminCampaignsApi,
  getCampaignPrizesApi,
  createPrizeApi,
  updatePrizeApi,
  deletePrizeApi
} from '../../api/campaign'

// Multi Game Platform V2.3 Tenant Edition
// 第 31 批：精緻九宮格後台獎品管理接入版
//
// 放置位置：
// frontend/src/views/admin/AdminPrizesView.vue
//
// 目標：
// 1. 後台獎品管理可直接篩選 GRID 精緻九宮格活動。
// 2. 商家管理員只會看到自己 tenant 權限可看的活動 / 獎品。
// 3. 平台總管理員可管理所有商家的活動 / 獎品。
// 4. 可一鍵建立精緻九宮格 8 個預設獎品。
// 5. 可一鍵補貨目前九宮格活動，避免前台顯示「目前獎品庫存已抽完」。
// 6. 不動砸金蛋功能，只是在獎品管理頁增加遊戲類型篩選與 GRID 快速工具。

const loading = ref(false)
const submitting = ref(false)
const batchSubmitting = ref(false)
const campaigns = ref([])
const prizes = ref([])
const editingPrizeId = ref(null)

const filters = reactive({
  keyword: '',
  campaignId: '',
  gameType: 'GRID'
})

const prizeForm = reactive({
  campaignId: '',
  title: '',
  shortName: '',
  icon: '',
  remainStock: '',
  probability: '',
  type: 'WIN',
  status: 'ACTIVE',
  sortOrder: ''
})

const gridDefaultTemplates = [
  {
    title: '品牌折價券',
    shortName: '折價券',
    icon: '🎁',
    remainStock: 100,
    probability: 25,
    type: 'WIN',
    status: 'ACTIVE',
    sortOrder: 1
  },
  {
    title: '會員點數 100 點',
    shortName: '點數',
    icon: '💯',
    remainStock: 100,
    probability: 20,
    type: 'WIN',
    status: 'ACTIVE',
    sortOrder: 2
  },
  {
    title: '飲品兌換券',
    shortName: '飲品券',
    icon: '🥤',
    remainStock: 80,
    probability: 15,
    type: 'WIN',
    status: 'ACTIVE',
    sortOrder: 3
  },
  {
    title: '小禮物',
    shortName: '小禮物',
    icon: '🎀',
    remainStock: 60,
    probability: 15,
    type: 'WIN',
    status: 'ACTIVE',
    sortOrder: 4
  },
  {
    title: '限定優惠券',
    shortName: '優惠券',
    icon: '🎫',
    remainStock: 60,
    probability: 12,
    type: 'WIN',
    status: 'ACTIVE',
    sortOrder: 5
  },
  {
    title: '抽獎券',
    shortName: '抽獎券',
    icon: '🎟️',
    remainStock: 50,
    probability: 8,
    type: 'WIN',
    status: 'ACTIVE',
    sortOrder: 6
  },
  {
    title: '神秘禮',
    shortName: '神秘禮',
    icon: '📦',
    remainStock: 30,
    probability: 4,
    type: 'WIN',
    status: 'ACTIVE',
    sortOrder: 7
  },
  {
    title: '超級大獎',
    shortName: '大獎',
    icon: '👑',
    remainStock: 5,
    probability: 1,
    type: 'WIN',
    status: 'ACTIVE',
    sortOrder: 8
  }
]

const quickPrizeTemplates = [
  {
    title: '銘謝惠顧',
    shortName: '未中獎',
    icon: '🙏',
    remainStock: 9999,
    probability: 40,
    type: 'LOSE',
    status: 'ACTIVE',
    sortOrder: 90
  },
  {
    title: '再玩一次',
    shortName: '再玩一次',
    icon: '🔁',
    remainStock: 9999,
    probability: 10,
    type: 'WIN',
    status: 'ACTIVE',
    sortOrder: 91
  },
  {
    title: '小獎',
    shortName: '小獎',
    icon: '🎁',
    remainStock: 50,
    probability: 20,
    type: 'WIN',
    status: 'ACTIVE',
    sortOrder: 92
  },
  {
    title: '大獎',
    shortName: '大獎',
    icon: '👑',
    remainStock: 5,
    probability: 5,
    type: 'WIN',
    status: 'ACTIVE',
    sortOrder: 93
  }
]

const unwrapList = (res) => {
  const data = res?.data?.data

  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(res?.data)) return res.data

  return []
}

const getGameType = (campaign = {}) => {
  return String(campaign.gameType || campaign.type || campaign.campaignType || campaign.gameKey || '').toUpperCase()
}

const getTenantName = (item = {}) => {
  return item.tenant?.name || item.tenantName || item.tenant?.slug || item.tenantSlug || '平台 / 未指定商家'
}

const isGridCampaign = (campaign = {}) => {
  const gameType = getGameType(campaign)
  const text = `${campaign.title || ''} ${campaign.name || ''} ${campaign.slug || ''}`

  return gameType === 'GRID' || gameType === 'PREMIUM_GRID' || text.includes('九宮格') || text.includes('grid')
}

const isGoldenEggCampaign = (campaign = {}) => {
  const gameType = getGameType(campaign)
  const text = `${campaign.title || ''} ${campaign.name || ''} ${campaign.slug || ''}`

  return gameType === 'GOLDEN_EGG' || text.includes('金蛋') || text.includes('golden')
}

const visibleCampaigns = computed(() => {
  let list = [...campaigns.value]

  if (filters.gameType === 'GRID') {
    list = list.filter((campaign) => isGridCampaign(campaign))
  } else if (filters.gameType === 'GOLDEN_EGG') {
    list = list.filter((campaign) => isGoldenEggCampaign(campaign))
  }

  return list
})

const selectedCampaign = computed(() => {
  return campaigns.value.find((campaign) => String(campaign.id) === String(filters.campaignId || prizeForm.campaignId))
})

const selectedCampaignTitle = computed(() => {
  return selectedCampaign.value?.title || selectedCampaign.value?.name || '尚未選擇活動'
})

const currentCampaignPrizes = computed(() => {
  if (!filters.campaignId && !prizeForm.campaignId) return prizes.value

  const campaignId = filters.campaignId || prizeForm.campaignId
  return prizes.value.filter((item) => String(item.campaignId) === String(campaignId))
})

const fetchCampaigns = async () => {
  try {
    const res = await getAdminCampaignsApi()
    campaigns.value = unwrapList(res)

    if (filters.gameType === 'GRID' && !filters.campaignId) {
      const firstGridCampaign = campaigns.value.find((campaign) => isGridCampaign(campaign))
      if (firstGridCampaign) {
        filters.campaignId = String(firstGridCampaign.id)
        prizeForm.campaignId = String(firstGridCampaign.id)
      }
    }
  } catch (error) {
    console.error('取得活動清單失敗:', error)
    alert(error?.response?.data?.message || '取得活動清單失敗')
    campaigns.value = []
  }
}

const fetchPrizes = async () => {
  loading.value = true

  try {
    const res = await getCampaignPrizesApi({
      keyword: filters.keyword,
      campaignId: filters.campaignId,
      gameType: filters.gameType
    })

    let list = unwrapList(res)

    if (filters.keyword) {
      const keyword = String(filters.keyword).trim().toLowerCase()
      list = list.filter((item) => {
        const text = `${item.title || ''} ${item.shortName || ''} ${item.campaign?.title || ''}`.toLowerCase()
        return text.includes(keyword)
      })
    }

    if (filters.campaignId) {
      list = list.filter((item) => String(item.campaignId) === String(filters.campaignId))
    }

    prizes.value = list
  } catch (error) {
    console.error('取得獎項列表失敗:', error)
    alert(error?.response?.data?.message || '取得獎項列表失敗')
    prizes.value = []
  } finally {
    loading.value = false
  }
}

const resetPrizeForm = () => {
  prizeForm.campaignId = filters.campaignId || ''
  prizeForm.title = ''
  prizeForm.shortName = ''
  prizeForm.icon = ''
  prizeForm.remainStock = ''
  prizeForm.probability = ''
  prizeForm.type = 'WIN'
  prizeForm.status = 'ACTIVE'
  prizeForm.sortOrder = ''
  editingPrizeId.value = null
}

const applyTemplate = (template) => {
  prizeForm.campaignId = prizeForm.campaignId || filters.campaignId || ''
  prizeForm.title = template.title
  prizeForm.shortName = template.shortName || ''
  prizeForm.icon = template.icon || ''
  prizeForm.remainStock = template.remainStock
  prizeForm.probability = template.probability
  prizeForm.type = template.type || 'WIN'
  prizeForm.status = template.status || 'ACTIVE'
  prizeForm.sortOrder = template.sortOrder ?? ''
}

const buildPrizePayload = (source = prizeForm) => {
  const remainStock = Number(source.remainStock ?? 0)

  return {
    campaignId: Number(source.campaignId),
    title: String(source.title || '').trim(),
    shortName: source.shortName || null,
    icon: source.icon || null,
    remainStock,
    stockTotal: Number(source.stockTotal ?? remainStock),
    stockUsed: Number(source.stockUsed ?? 0),
    probability: Number(source.probability || 0),
    type: source.type || 'WIN',
    status: source.status || 'ACTIVE',
    sortOrder: Number(source.sortOrder || 0)
  }
}

const validateForm = () => {
  if (!prizeForm.campaignId) {
    alert('請先選擇活動')
    return false
  }

  if (!String(prizeForm.title || '').trim()) {
    alert('請輸入獎項名稱')
    return false
  }

  if (prizeForm.remainStock === '' || Number(prizeForm.remainStock) < 0) {
    alert('請輸入正確庫存，不能小於 0')
    return false
  }

  if (prizeForm.probability === '') {
    alert('請輸入中獎機率百分比')
    return false
  }

  const probability = Number(prizeForm.probability)

  if (!Number.isFinite(probability) || probability < 0 || probability > 100) {
    alert('中獎機率請輸入 0 到 100 之間的百分比')
    return false
  }

  return true
}

const submitPrize = async () => {
  if (!validateForm()) return

  submitting.value = true
  const payload = buildPrizePayload(prizeForm)

  try {
    if (editingPrizeId.value) {
      await updatePrizeApi(editingPrizeId.value, payload)
      alert('更新獎項成功')
    } else {
      await createPrizeApi(payload)
      alert('新增獎項成功')
    }

    resetPrizeForm()
    await fetchPrizes()
  } catch (error) {
    console.error('獎項操作失敗:', error)
    alert(error?.response?.data?.message || '獎項操作失敗')
  } finally {
    submitting.value = false
  }
}

const editPrize = (item) => {
  prizeForm.campaignId = item.campaignId || ''
  prizeForm.title = item.title || ''
  prizeForm.shortName = item.shortName || ''
  prizeForm.icon = item.icon || ''
  prizeForm.remainStock = item.remainStock ?? ''
  prizeForm.probability = item.probability ?? ''
  prizeForm.type = item.type || 'WIN'
  prizeForm.status = item.status || 'ACTIVE'
  prizeForm.sortOrder = item.sortOrder ?? ''
  editingPrizeId.value = item.id

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

const deletePrize = async (item) => {
  const ok = window.confirm(
    `確定要刪除獎項「${item.title}」嗎？\n\n如果已有中獎紀錄，可能會影響報表與發獎資料。`
  )

  if (!ok) return

  try {
    await deletePrizeApi(item.id)
    alert('刪除獎項成功')

    if (editingPrizeId.value === item.id) {
      resetPrizeForm()
    }

    await fetchPrizes()
  } catch (error) {
    console.error('刪除獎項失敗:', error)
    alert(error?.response?.data?.message || '刪除獎項失敗')
  }
}

const resetSearch = async () => {
  filters.keyword = ''
  filters.campaignId = ''
  filters.gameType = 'GRID'

  const firstGridCampaign = campaigns.value.find((campaign) => isGridCampaign(campaign))
  if (firstGridCampaign) {
    filters.campaignId = String(firstGridCampaign.id)
    prizeForm.campaignId = String(firstGridCampaign.id)
  }

  await fetchPrizes()
}

const syncSelectedCampaignToForm = () => {
  if (!editingPrizeId.value) {
    prizeForm.campaignId = filters.campaignId || prizeForm.campaignId || ''
  }
}

const createGridDefaultPrizes = async () => {
  const campaignId = filters.campaignId || prizeForm.campaignId

  if (!campaignId) {
    alert('請先選擇一個精緻九宮格活動')
    return
  }

  const ok = window.confirm(
    `確定要替「${selectedCampaignTitle.value}」新增 8 個精緻九宮格預設獎品嗎？\n\n如果已經有獎品，建議先確認不要重複新增。`
  )

  if (!ok) return

  batchSubmitting.value = true

  try {
    for (const template of gridDefaultTemplates) {
      await createPrizeApi({
        ...buildPrizePayload({
          ...template,
          campaignId
        }),
        campaignId: Number(campaignId)
      })
    }

    alert('已建立 8 個精緻九宮格預設獎品')
    await fetchPrizes()
  } catch (error) {
    console.error('建立九宮格預設獎品失敗:', error)
    alert(error?.response?.data?.message || '建立九宮格預設獎品失敗')
  } finally {
    batchSubmitting.value = false
  }
}

const refillCurrentGridPrizes = async () => {
  const campaignId = filters.campaignId || prizeForm.campaignId

  if (!campaignId) {
    alert('請先選擇一個精緻九宮格活動')
    return
  }

  const targets = currentCampaignPrizes.value

  if (!targets.length) {
    alert('目前活動還沒有獎品，請先按「建立九宮格預設獎品」。')
    return
  }

  const ok = window.confirm(
    `確定要替「${selectedCampaignTitle.value}」補貨嗎？\n\n會把目前活動獎品依九宮格模板補回庫存、啟用狀態與機率。`
  )

  if (!ok) return

  batchSubmitting.value = true

  try {
    for (let index = 0; index < targets.length; index += 1) {
      const item = targets[index]
      const template = gridDefaultTemplates[index % gridDefaultTemplates.length]

      await updatePrizeApi(item.id, {
        title: item.title || template.title,
        shortName: item.shortName || template.shortName,
        icon: item.icon || template.icon,
        remainStock: template.remainStock,
        stockTotal: template.remainStock,
        stockUsed: 0,
        probability: Number(item.probability || template.probability),
        type: item.type || template.type,
        status: 'ACTIVE',
        sortOrder: item.sortOrder ?? template.sortOrder
      })
    }

    alert('九宮格獎品已補貨完成')
    await fetchPrizes()
  } catch (error) {
    console.error('九宮格獎品補貨失敗:', error)
    alert(error?.response?.data?.message || '九宮格獎品補貨失敗')
  } finally {
    batchSubmitting.value = false
  }
}

const getCampaignTitle = (campaignId) => {
  const campaign = campaigns.value.find((item) => String(item.id) === String(campaignId))
  return campaign?.title || '未指定活動'
}

const getPrizeType = (item) => {
  const title = String(item?.title || '').trim()
  const type = String(item?.type || '').toUpperCase()

  if (type === 'LOSE' || title === '銘謝惠顧' || title === '謝謝參加' || title === '未中獎' || title === '再接再厲') {
    return {
      label: '未中獎項',
      class: 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  if (title === '再玩一次') {
    return {
      label: '再玩一次',
      class: 'bg-sky-100 text-sky-700 border-sky-200'
    }
  }

  return {
    label: '中獎獎項',
    class: 'bg-emerald-100 text-emerald-700 border-emerald-200'
  }
}

const getPrizeStatus = (item) => {
  const status = String(item?.status || 'ACTIVE').toUpperCase()

  if (status === 'DISABLED') {
    return {
      label: '停用',
      class: 'bg-slate-100 text-slate-600 border-slate-200'
    }
  }

  return {
    label: '啟用',
    class: 'bg-emerald-100 text-emerald-700 border-emerald-200'
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

const formatPercent = (value) => {
  const n = Number(value || 0)

  if (!Number.isFinite(n)) {
    return '0%'
  }

  return `${Number(n.toFixed(2))}%`
}

const totalPrizes = computed(() => prizes.value.length)

const totalStock = computed(() => {
  return prizes.value.reduce((sum, item) => sum + Number(item.remainStock || 0), 0)
})

const totalProbability = computed(() => {
  return prizes.value.reduce((sum, item) => sum + Number(item.probability || 0), 0)
})

const noStockCount = computed(() => {
  return prizes.value.filter((item) => Number(item.remainStock || 0) <= 0).length
})

const activePrizeCount = computed(() => {
  return prizes.value.filter((item) => String(item.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length
})

const loseProbability = computed(() => {
  const remain = 100 - Number(totalProbability.value || 0)
  return remain > 0 ? remain : 0
})

const probabilityWarningText = computed(() => {
  if (totalProbability.value < 100) {
    return `目前獎項機率合計 ${formatPercent(totalProbability.value)}，剩餘 ${formatPercent(loseProbability.value)} 會視為未中獎。`
  }

  if (totalProbability.value === 100) {
    return '目前獎項機率合計剛好 100%，沒有額外未中獎空間。'
  }

  return `目前獎項機率合計 ${formatPercent(totalProbability.value)}，已超過 100%，請調整各獎項百分比。`
})

const probabilityWarningClass = computed(() => {
  if (totalProbability.value < 100) {
    return 'border-blue-200 bg-blue-50 text-blue-700'
  }

  if (totalProbability.value === 100) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  return 'border-rose-200 bg-rose-50 text-rose-700'
})

watch(
  () => filters.campaignId,
  () => {
    syncSelectedCampaignToForm()
  }
)

watch(
  () => filters.gameType,
  async () => {
    filters.campaignId = ''

    if (filters.gameType === 'GRID') {
      const firstGridCampaign = campaigns.value.find((campaign) => isGridCampaign(campaign))
      if (firstGridCampaign) {
        filters.campaignId = String(firstGridCampaign.id)
      }
    }

    syncSelectedCampaignToForm()
    await fetchPrizes()
  }
)

onMounted(async () => {
  await fetchCampaigns()
  await fetchPrizes()
  resetPrizeForm()
})
</script>

<template>
  <div class="space-y-8">
    <section class="rounded-[32px] border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 shadow-sm">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p class="text-sm font-black text-orange-600">
            V2.3 Tenant Edition｜Premium Grid Prize Admin
          </p>
          <h1 class="mt-2 text-3xl font-black text-slate-900">
            精緻九宮格獎品管理
          </h1>
          <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            這裡可以直接替 GRID 精緻九宮格活動新增獎品、補庫存、調整機率與啟用狀態。
            之後前台抽獎會讀取這裡的設定，不需要每次靠腳本補資料。
          </p>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            @click="createGridDefaultPrizes"
            :disabled="batchSubmitting || !filters.campaignId"
            class="rounded-2xl bg-orange-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            建立九宮格預設獎品
          </button>

          <button
            @click="refillCurrentGridPrizes"
            :disabled="batchSubmitting || !filters.campaignId"
            class="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            一鍵補貨目前活動
          </button>
        </div>
      </div>

      <div class="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div class="rounded-3xl border border-white/80 bg-white/80 p-4">
          <p class="text-xs font-black text-slate-400">
            目前管理活動
          </p>
          <p class="mt-1 text-lg font-black text-slate-900">
            {{ selectedCampaignTitle }}
          </p>
        </div>

        <div class="rounded-3xl border border-white/80 bg-white/80 p-4">
          <p class="text-xs font-black text-slate-400">
            商家
          </p>
          <p class="mt-1 text-lg font-black text-slate-900">
            {{ selectedCampaign ? getTenantName(selectedCampaign) : '尚未選擇' }}
          </p>
        </div>

        <div class="rounded-3xl border border-white/80 bg-white/80 p-4">
          <p class="text-xs font-black text-slate-400">
            遊戲類型
          </p>
          <p class="mt-1 text-lg font-black text-slate-900">
            {{ selectedCampaign ? getGameType(selectedCampaign) || '未標示' : '尚未選擇' }}
          </p>
        </div>
      </div>
    </section>

    <!-- 統計卡 -->
    <section class="grid grid-cols-2 gap-4 md:grid-cols-6">
      <div class="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm">
        <p class="text-xs font-bold text-slate-400">
          獎項總數
        </p>
        <p class="mt-2 text-3xl font-black text-slate-900">
          {{ totalPrizes }}
        </p>
      </div>

      <div class="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 text-center shadow-sm">
        <p class="text-xs font-bold text-emerald-500">
          總庫存
        </p>
        <p class="mt-2 text-3xl font-black text-emerald-700">
          {{ totalStock }}
        </p>
      </div>

      <div class="rounded-3xl border border-violet-100 bg-violet-50 p-5 text-center shadow-sm">
        <p class="text-xs font-bold text-violet-500">
          機率合計
        </p>
        <p class="mt-2 text-3xl font-black text-violet-700">
          {{ formatPercent(totalProbability) }}
        </p>
      </div>

      <div class="rounded-3xl border border-blue-100 bg-blue-50 p-5 text-center shadow-sm">
        <p class="text-xs font-bold text-blue-500">
          未中獎機率
        </p>
        <p class="mt-2 text-3xl font-black text-blue-700">
          {{ formatPercent(loseProbability) }}
        </p>
      </div>

      <div class="rounded-3xl border border-rose-100 bg-rose-50 p-5 text-center shadow-sm">
        <p class="text-xs font-bold text-rose-500">
          無庫存
        </p>
        <p class="mt-2 text-3xl font-black text-rose-700">
          {{ noStockCount }}
        </p>
      </div>

      <div class="rounded-3xl border border-teal-100 bg-teal-50 p-5 text-center shadow-sm">
        <p class="text-xs font-bold text-teal-500">
          啟用獎品
        </p>
        <p class="mt-2 text-3xl font-black text-teal-700">
          {{ activePrizeCount }}
        </p>
      </div>
    </section>

    <section
      class="rounded-3xl border p-5 text-sm font-bold"
      :class="probabilityWarningClass"
    >
      {{ probabilityWarningText }}
    </section>

    <!-- 搜尋 + 表單 -->
    <section class="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
      <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="text-sm font-black text-violet-600">
            Prize Manager
          </p>

          <h2 class="mt-1 text-3xl font-black text-slate-900">
            {{ editingPrizeId ? '編輯獎項' : '新增獎項' }}
          </h2>

          <p class="mt-2 text-sm text-slate-500">
            建立活動獎項、設定庫存與中獎百分比。GRID 九宮格請先選擇對應商家的精緻九宮格活動。
          </p>
        </div>

        <div class="grid w-full grid-cols-1 gap-3 lg:w-auto xl:grid-cols-5">
          <select
            v-model="filters.gameType"
            class="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-500"
          >
            <option value="GRID">
              只看精緻九宮格
            </option>
            <option value="GOLDEN_EGG">
              只看砸金蛋
            </option>
            <option value="ALL">
              全部遊戲
            </option>
          </select>

          <input
            v-model="filters.keyword"
            class="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-500 xl:col-span-2"
            placeholder="搜尋獎項名稱或活動名稱"
          />

          <select
            v-model="filters.campaignId"
            class="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-500 xl:col-span-2"
          >
            <option value="">
              全部活動
            </option>
            <option
              v-for="campaign in visibleCampaigns"
              :key="campaign.id"
              :value="campaign.id"
            >
              {{ campaign.id }} - {{ campaign.title }}｜{{ getTenantName(campaign) }}
            </option>
          </select>

          <button
            @click="fetchPrizes"
            class="rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
          >
            搜尋
          </button>

          <button
            @click="resetSearch"
            class="rounded-2xl bg-slate-200 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-300"
          >
            重設
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">
            所屬活動
          </label>
          <select
            v-model="prizeForm.campaignId"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-500"
          >
            <option value="">
              請選擇活動
            </option>
            <option
              v-for="campaign in visibleCampaigns"
              :key="campaign.id"
              :value="campaign.id"
            >
              {{ campaign.id }} - {{ campaign.title }}｜{{ getTenantName(campaign) }}
            </option>
          </select>
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">
            獎項名稱
          </label>
          <input
            v-model="prizeForm.title"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-500"
            placeholder="例如：VIP 折價券 / 銘謝惠顧 / 再玩一次"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">
            簡稱 / 九宮格顯示名稱
          </label>
          <input
            v-model="prizeForm.shortName"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-500"
            placeholder="例如：折價券 / 大獎"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">
            圖示
          </label>
          <input
            v-model="prizeForm.icon"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-500"
            placeholder="例如 🎁 / 👑 / 🎫"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">
            剩餘庫存
          </label>
          <input
            v-model.number="prizeForm.remainStock"
            type="number"
            min="0"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-500"
            placeholder="例如 100"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">
            中獎機率百分比
          </label>

          <div class="relative">
            <input
              v-model.number="prizeForm.probability"
              type="number"
              step="0.01"
              min="0"
              max="100"
              class="w-full rounded-2xl border border-slate-300 px-4 py-3 pr-12 outline-none focus:border-violet-500"
              placeholder="例如 20 代表 20%"
            />

            <div class="pointer-events-none absolute inset-y-0 right-4 flex items-center text-lg font-black text-slate-400">
              %
            </div>
          </div>
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">
            獎項類型
          </label>
          <select
            v-model="prizeForm.type"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-500"
          >
            <option value="WIN">
              中獎
            </option>
            <option value="LOSE">
              未中獎
            </option>
          </select>
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">
            狀態
          </label>
          <select
            v-model="prizeForm.status"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-500"
          >
            <option value="ACTIVE">
              啟用
            </option>
            <option value="DISABLED">
              停用
            </option>
          </select>
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">
            排序
          </label>
          <input
            v-model.number="prizeForm.sortOrder"
            type="number"
            min="0"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-500"
            placeholder="例如 1"
          />
        </div>
      </div>

      <div class="mt-5">
        <p class="mb-3 text-sm font-bold text-slate-700">
          快速套用
        </p>

        <div class="flex flex-wrap gap-3">
          <button
            v-for="template in quickPrizeTemplates"
            :key="template.title"
            @click="applyTemplate(template)"
            class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
          >
            {{ template.icon }} {{ template.title }}｜{{ formatPercent(template.probability) }}
          </button>
        </div>
      </div>

      <div class="mt-6 flex flex-wrap gap-3">
        <button
          @click="submitPrize"
          :disabled="submitting"
          class="rounded-2xl bg-violet-600 px-6 py-3 font-bold text-white transition hover:bg-violet-700 disabled:opacity-60"
        >
          {{ submitting ? '處理中...' : editingPrizeId ? '更新獎項' : '新增獎項' }}
        </button>

        <button
          @click="resetPrizeForm"
          class="rounded-2xl bg-slate-200 px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-300"
        >
          {{ editingPrizeId ? '取消編輯' : '清空表單' }}
        </button>
      </div>
    </section>

    <!-- 獎項卡片 -->
    <section class="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
      <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-3xl font-black text-slate-900">
            獎項列表
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            卡片式管理目前查詢活動的獎項、庫存、狀態與中獎百分比。
          </p>
        </div>

        <span class="text-sm text-slate-400">
          共 {{ prizes.length }} 筆
        </span>
      </div>

      <div
        v-if="loading"
        class="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-500"
      >
        載入獎項中...
      </div>

      <div
        v-else-if="prizes.length === 0"
        class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center"
      >
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
          🎁
        </div>

        <h3 class="mt-4 text-xl font-black text-slate-800">
          目前沒有符合條件的獎項
        </h3>

        <p class="mt-2 text-sm text-slate-500">
          如果這是精緻九宮格活動，可以按上方「建立九宮格預設獎品」快速建立 8 個獎項。
        </p>
      </div>

      <div
        v-else
        class="grid grid-cols-1 gap-5 xl:grid-cols-2"
      >
        <article
          v-for="item in prizes"
          :key="item.id"
          class="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div class="border-b border-slate-100 bg-gradient-to-br from-violet-50 via-white to-slate-50 p-6">
            <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div class="flex flex-wrap gap-2">
                  <span
                    class="inline-flex rounded-full border px-3 py-1 text-xs font-black"
                    :class="getPrizeType(item).class"
                  >
                    {{ getPrizeType(item).label }}
                  </span>

                  <span
                    class="inline-flex rounded-full border px-3 py-1 text-xs font-black"
                    :class="getPrizeStatus(item).class"
                  >
                    {{ getPrizeStatus(item).label }}
                  </span>

                  <span class="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600">
                    Prize ID #{{ item.id }}
                  </span>
                </div>

                <h3 class="mt-3 flex items-center gap-2 text-2xl font-black text-slate-900">
                  <span v-if="item.icon">
                    {{ item.icon }}
                  </span>
                  <span>{{ item.title }}</span>
                </h3>

                <p class="mt-2 text-sm text-slate-500">
                  {{ item.campaign?.title || getCampaignTitle(item.campaignId) }}
                </p>

                <p
                  v-if="item.shortName"
                  class="mt-1 text-xs font-bold text-slate-400"
                >
                  九宮格顯示：{{ item.shortName }}
                </p>
              </div>

              <div class="shrink-0 rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
                <p class="text-xs font-bold text-slate-400">
                  中獎機率
                </p>
                <p class="mt-1 text-xl font-black text-violet-700">
                  {{ formatPercent(item.probability) }}
                </p>
              </div>
            </div>
          </div>

          <div class="space-y-5 p-6">
            <div>
              <div class="mb-2 flex items-center justify-between">
                <p class="text-sm font-bold text-slate-600">
                  剩餘庫存
                </p>
                <p class="text-sm font-black text-slate-900">
                  {{ item.remainStock }}
                </p>
              </div>

              <div class="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full"
                  :class="getStockClass(item.remainStock)"
                  :style="{ width: `${getStockPercent(item.remainStock)}%` }"
                ></div>
              </div>
            </div>

            <div>
              <div class="mb-2 flex items-center justify-between">
                <p class="text-sm font-bold text-slate-600">
                  中獎百分比
                </p>
                <p class="text-sm font-black text-slate-900">
                  {{ formatPercent(item.probability) }}
                </p>
              </div>

              <div class="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full"
                  :class="getProbabilityClass(item.probability)"
                  :style="{ width: `${getProbabilityPercent(item.probability)}%` }"
                ></div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 border-t border-slate-100 bg-slate-50 p-5">
            <button
              @click="editPrize(item)"
              class="rounded-2xl bg-amber-500 px-4 py-3 font-bold text-white transition hover:bg-amber-600"
            >
              編輯
            </button>

            <button
              @click="deletePrize(item)"
              class="rounded-2xl bg-rose-500 px-4 py-3 font-bold text-white transition hover:bg-rose-600"
            >
              刪除
            </button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
