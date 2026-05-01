<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  getCampaignsApi,
  createCampaignApi,
  updateCampaignApi,
  deleteCampaignApi
} from '../../api/campaign'

const loading = ref(true)
const submitting = ref(false)
const campaigns = ref([])
const editingId = ref(null)

const defaultForm = () => ({
  title: '',
  description: '',
  gameType: 'WHEEL',
  startAt: '',
  endAt: '',
  dailyLimit: 3,
  totalLimit: 10,
  requireLogin: true,
  allowedRole: '',
  requiredLevel: '',
  status: 'ACTIVE'
})

const form = reactive(defaultForm())

const gameTypeOptions = [
  {
    label: 'WHEEL · 輪盤',
    value: 'WHEEL',
    emoji: '🎡',
    desc: '大型轉盤抽獎'
  },
  {
    label: 'FLIP · 翻牌',
    value: 'FLIP',
    emoji: '🎴',
    desc: '卡牌翻開抽獎'
  },
  {
    label: 'GRID · 九宮格',
    value: 'GRID',
    emoji: '🔲',
    desc: '九宮格互動抽獎'
  },
  {
    label: 'SCRATCH · 刮刮樂',
    value: 'SCRATCH',
    emoji: '🎫',
    desc: '刮刮卡抽獎'
  }
]

const statusOptions = [
  {
    label: 'DRAFT · 草稿',
    value: 'DRAFT'
  },
  {
    label: 'ACTIVE · 啟用',
    value: 'ACTIVE'
  },
  {
    label: 'INACTIVE · 停用',
    value: 'INACTIVE'
  },
  {
    label: 'ENDED · 已結束',
    value: 'ENDED'
  }
]

const roleOptions = [
  {
    label: '不限角色',
    value: ''
  },
  {
    label: 'USER · 一般會員',
    value: 'USER'
  },
  {
    label: 'ADMIN · 管理員',
    value: 'ADMIN'
  }
]

const levelOptions = [
  {
    label: '不限等級',
    value: ''
  },
  {
    label: 'NORMAL · 一般會員',
    value: 'NORMAL'
  },
  {
    label: 'VIP · VIP 會員',
    value: 'VIP'
  }
]

const fetchCampaigns = async () => {
  loading.value = true

  try {
    const res = await getCampaignsApi()
    campaigns.value = Array.isArray(res?.data?.data) ? res.data.data : []
  } catch (error) {
    console.error('取得活動列表失敗:', error)
    alert(error?.response?.data?.message || '取得活動列表失敗')
    campaigns.value = []
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  editingId.value = null

  Object.assign(form, defaultForm())
}

const toDatetimeLocal = (value) => {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')

  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

const handleEdit = (item) => {
  editingId.value = item.id

  form.title = item.title || ''
  form.description = item.description || ''
  form.gameType = item.gameType || 'WHEEL'
  form.startAt = toDatetimeLocal(item.startAt)
  form.endAt = toDatetimeLocal(item.endAt)
  form.dailyLimit = item.dailyLimit ?? 3
  form.totalLimit = item.totalLimit ?? 10
  form.requireLogin = item.requireLogin ?? true
  form.allowedRole = item.allowedRole || ''
  form.requiredLevel = item.requiredLevel || ''
  form.status = item.status || 'ACTIVE'

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

const validateForm = () => {
  if (!String(form.title || '').trim()) {
    alert('請輸入活動名稱')
    return false
  }

  if (!form.gameType) {
    alert('請選擇活動類型')
    return false
  }

  if (form.startAt && form.endAt) {
    const start = new Date(form.startAt)
    const end = new Date(form.endAt)

    if (start > end) {
      alert('結束時間不可早於開始時間')
      return false
    }
  }

  if (form.dailyLimit !== null && form.dailyLimit !== '' && Number(form.dailyLimit) < 0) {
    alert('每日次數不可小於 0')
    return false
  }

  if (form.totalLimit !== null && form.totalLimit !== '' && Number(form.totalLimit) < 0) {
    alert('總次數不可小於 0')
    return false
  }

  return true
}

const buildPayload = () => {
  return {
    title: String(form.title || '').trim(),
    description: String(form.description || '').trim(),
    gameType: form.gameType,
    startAt: form.startAt || null,
    endAt: form.endAt || null,
    dailyLimit:
      form.dailyLimit === '' || form.dailyLimit === null
        ? null
        : Number(form.dailyLimit),
    totalLimit:
      form.totalLimit === '' || form.totalLimit === null
        ? null
        : Number(form.totalLimit),
    requireLogin: Boolean(form.requireLogin),
    allowedRole: form.allowedRole || null,
    requiredLevel: form.requiredLevel || null,
    status: form.status
  }
}

const handleSubmit = async () => {
  if (!validateForm()) return

  submitting.value = true

  try {
    const payload = buildPayload()

    if (editingId.value) {
      await updateCampaignApi(editingId.value, payload)
      alert('活動更新成功')
    } else {
      await createCampaignApi(payload)
      alert('新增活動成功')
    }

    resetForm()
    await fetchCampaigns()
  } catch (error) {
    console.error('儲存活動失敗:', error)
    alert(error?.response?.data?.message || '儲存活動失敗')
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (item) => {
  const ok = window.confirm(
    `確定要刪除活動「${item.title}」嗎？\n\n這會一併刪除該活動的獎項、遊玩紀錄與發獎紀錄。`
  )

  if (!ok) return

  try {
    await deleteCampaignApi(item.id)
    alert('刪除成功')

    if (editingId.value === item.id) {
      resetForm()
    }

    await fetchCampaigns()
  } catch (error) {
    console.error('刪除活動失敗:', error)
    alert(error?.response?.data?.message || '刪除活動失敗')
  }
}

const formatDateTime = (value) => {
  if (!value) return '未設定'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}

const getGameTypeMeta = (gameType) => {
  const type = String(gameType || '').toUpperCase()

  if (type === 'WHEEL') {
    return {
      text: 'WHEEL · 輪盤',
      class: 'bg-blue-100 text-blue-700 border-blue-200'
    }
  }

  if (type === 'FLIP') {
    return {
      text: 'FLIP · 翻牌',
      class: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200'
    }
  }

  if (type === 'GRID') {
    return {
      text: 'GRID · 九宮格',
      class: 'bg-amber-100 text-amber-700 border-amber-200'
    }
  }

  if (type === 'SCRATCH') {
    return {
      text: 'SCRATCH · 刮刮樂',
      class: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    }
  }

  return {
    text: type || '未設定',
    class: 'bg-slate-100 text-slate-700 border-slate-200'
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

const getLoginText = (value) => {
  return value ? '需要登入' : '免登入'
}

const getRoleText = (value) => {
  if (value === 'USER') return 'USER'
  if (value === 'ADMIN') return 'ADMIN'
  return '不限'
}

const getLevelText = (value) => {
  if (value === 'NORMAL') return 'NORMAL'
  if (value === 'VIP') return 'VIP'
  return '不限'
}

const openPreview = (item) => {
  if (!item?.id) return
  window.open(`/play/${item.id}`, '_blank')
}

const openDetail = (item) => {
  if (!item?.id) return
  window.open(`/campaigns/${item.id}`, '_blank')
}

const totalCount = computed(() => campaigns.value.length)

const activeCount = computed(() => {
  return campaigns.value.filter((item) => String(item.status || '').toUpperCase() === 'ACTIVE').length
})

const draftCount = computed(() => {
  return campaigns.value.filter((item) => String(item.status || '').toUpperCase() === 'DRAFT').length
})

const endedCount = computed(() => {
  return campaigns.value.filter((item) => String(item.status || '').toUpperCase() === 'ENDED').length
})

onMounted(() => {
  fetchCampaigns()
})
</script>

<template>
  <div class="space-y-8">
    <!-- Summary -->
    <section class="grid grid-cols-2 gap-4 md:grid-cols-4">
      <div class="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm">
        <p class="text-xs font-bold text-slate-400">
          活動總數
        </p>
        <p class="mt-2 text-3xl font-black text-slate-900">
          {{ totalCount }}
        </p>
      </div>

      <div class="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 text-center shadow-sm">
        <p class="text-xs font-bold text-emerald-500">
          啟用中
        </p>
        <p class="mt-2 text-3xl font-black text-emerald-700">
          {{ activeCount }}
        </p>
      </div>

      <div class="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-center shadow-sm">
        <p class="text-xs font-bold text-slate-400">
          草稿
        </p>
        <p class="mt-2 text-3xl font-black text-slate-800">
          {{ draftCount }}
        </p>
      </div>

      <div class="rounded-3xl border border-rose-100 bg-rose-50 p-5 text-center shadow-sm">
        <p class="text-xs font-bold text-rose-500">
          已結束
        </p>
        <p class="mt-2 text-3xl font-black text-rose-700">
          {{ endedCount }}
        </p>
      </div>
    </section>

    <!-- Form -->
    <section class="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
      <div class="mb-6">
        <p class="text-sm font-black text-blue-600">
          Campaign Builder
        </p>

        <h2 class="mt-1 text-3xl font-black text-slate-900">
          {{ editingId ? '編輯活動' : '新增活動' }}
        </h2>

        <p class="mt-2 text-slate-500">
          {{ editingId ? '你正在編輯既有活動資料。' : '建立新的多遊戲活動，供前台活動列表、遊戲入口與報表使用。' }}
        </p>
      </div>

      <div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">
            活動名稱
          </label>
          <input
            v-model="form.title"
            type="text"
            placeholder="例如：週年慶幸運抽獎"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">
            活動類型
          </label>
          <select
            v-model="form.gameType"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          >
            <option
              v-for="item in gameTypeOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </option>
          </select>
        </div>

        <div class="xl:col-span-2">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div
              v-for="item in gameTypeOptions"
              :key="item.value"
              class="rounded-2xl border p-4"
              :class="form.gameType === item.value ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-slate-50'"
            >
              <div class="text-2xl">
                {{ item.emoji }}
              </div>
              <p class="mt-2 font-black text-slate-900">
                {{ item.label }}
              </p>
              <p class="mt-1 text-xs text-slate-500">
                {{ item.desc }}
              </p>
            </div>
          </div>
        </div>

        <div class="xl:col-span-2">
          <label class="mb-2 block text-sm font-bold text-slate-700">
            活動說明
          </label>
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="請輸入活動說明"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          ></textarea>
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">
            開始時間
          </label>
          <input
            v-model="form.startAt"
            type="datetime-local"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">
            結束時間
          </label>
          <input
            v-model="form.endAt"
            type="datetime-local"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">
            每日遊玩次數
          </label>
          <input
            v-model.number="form.dailyLimit"
            type="number"
            min="0"
            placeholder="空白代表不限制"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          />
          <p class="mt-1 text-xs text-slate-400">
            每位會員每天最多可玩幾次。
          </p>
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">
            每人總遊玩次數
          </label>
          <input
            v-model.number="form.totalLimit"
            type="number"
            min="0"
            placeholder="空白代表不限制"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          />
          <p class="mt-1 text-xs text-slate-400">
            每位會員在整個活動最多可玩幾次。
          </p>
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">
            活動狀態
          </label>
          <select
            v-model="form.status"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          >
            <option
              v-for="item in statusOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </option>
          </select>
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">
            是否需要登入
          </label>
          <select
            v-model="form.requireLogin"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          >
            <option :value="true">
              需要登入
            </option>
            <option :value="false">
              免登入
            </option>
          </select>
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">
            角色限制
          </label>
          <select
            v-model="form.allowedRole"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          >
            <option
              v-for="item in roleOptions"
              :key="item.value || 'NONE'"
              :value="item.value"
            >
              {{ item.label }}
            </option>
          </select>
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">
            會員等級限制
          </label>
          <select
            v-model="form.requiredLevel"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          >
            <option
              v-for="item in levelOptions"
              :key="item.value || 'NONE'"
              :value="item.value"
            >
              {{ item.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="mt-6 flex flex-wrap gap-3">
        <button
          @click="handleSubmit"
          :disabled="submitting"
          class="rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {{ submitting ? (editingId ? '更新中...' : '新增中...') : (editingId ? '更新活動' : '新增活動') }}
        </button>

        <button
          @click="resetForm"
          type="button"
          class="rounded-2xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
        >
          {{ editingId ? '取消編輯' : '重設' }}
        </button>
      </div>
    </section>

    <!-- List -->
    <section class="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
      <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-3xl font-black text-slate-900">
            活動列表
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            顯示目前平台所有活動與設定狀態。
          </p>
        </div>

        <div class="text-slate-400">
          共 {{ totalCount }} 筆
        </div>
      </div>

      <div
        v-if="loading"
        class="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-500"
      >
        載入中...
      </div>

      <div
        v-else-if="campaigns.length === 0"
        class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center"
      >
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
          🎮
        </div>
        <h3 class="mt-4 text-xl font-black text-slate-800">
          目前沒有活動資料
        </h3>
        <p class="mt-2 text-sm text-slate-500">
          可以先使用上方表單建立第一個活動。
        </p>
      </div>

      <div
        v-else
        class="grid grid-cols-1 gap-5 xl:grid-cols-2"
      >
        <article
          v-for="item in campaigns"
          :key="item.id"
          class="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div class="border-b border-slate-100 bg-slate-50 p-6">
            <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div class="flex flex-wrap gap-2">
                  <span
                    class="inline-flex rounded-full border px-3 py-1 text-xs font-black"
                    :class="getGameTypeMeta(item.gameType).class"
                  >
                    {{ getGameTypeMeta(item.gameType).text }}
                  </span>

                  <span
                    class="inline-flex rounded-full border px-3 py-1 text-xs font-black"
                    :class="getStatusClass(item.status)"
                  >
                    {{ item.status || 'ACTIVE' }}
                  </span>
                </div>

                <h3 class="mt-3 text-2xl font-black text-slate-900">
                  {{ item.title }}
                </h3>

                <p class="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                  {{ item.description || '尚未設定活動說明' }}
                </p>
              </div>

              <div class="shrink-0 rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
                <p class="text-xs font-bold text-slate-400">
                  Activity ID
                </p>
                <p class="mt-1 text-xl font-black text-slate-900">
                  #{{ item.id }}
                </p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 p-6 md:grid-cols-4">
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-xs font-bold text-slate-400">
                每日次數
              </p>
              <p class="mt-1 font-black text-slate-800">
                {{ item.dailyLimit ?? '不限' }}
              </p>
            </div>

            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-xs font-bold text-slate-400">
                總次數
              </p>
              <p class="mt-1 font-black text-slate-800">
                {{ item.totalLimit ?? '不限' }}
              </p>
            </div>

            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-xs font-bold text-slate-400">
                登入
              </p>
              <p class="mt-1 font-black text-slate-800">
                {{ getLoginText(item.requireLogin) }}
              </p>
            </div>

            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-xs font-bold text-slate-400">
                獎項數
              </p>
              <p class="mt-1 font-black text-slate-800">
                {{ item.prizes?.length ?? item._count?.prizes ?? 0 }}
              </p>
            </div>

            <div class="rounded-2xl bg-slate-50 p-4 md:col-span-2">
              <p class="text-xs font-bold text-slate-400">
                角色限制
              </p>
              <p class="mt-1 font-black text-slate-800">
                {{ getRoleText(item.allowedRole) }}
              </p>
            </div>

            <div class="rounded-2xl bg-slate-50 p-4 md:col-span-2">
              <p class="text-xs font-bold text-slate-400">
                等級限制
              </p>
              <p class="mt-1 font-black text-slate-800">
                {{ getLevelText(item.requiredLevel) }}
              </p>
            </div>

            <div class="rounded-2xl bg-slate-50 p-4 md:col-span-4">
              <p class="text-xs font-bold text-slate-400">
                活動期間
              </p>
              <p class="mt-1 text-sm font-bold text-slate-700">
                {{ formatDateTime(item.startAt) }} ～ {{ formatDateTime(item.endAt) }}
              </p>
            </div>
          </div>

          <div class="grid gap-3 border-t border-slate-100 bg-slate-50 p-5 md:grid-cols-4">
            <button
              @click="handleEdit(item)"
              class="rounded-2xl bg-amber-500 px-4 py-3 font-bold text-white transition hover:bg-amber-600"
            >
              編輯
            </button>

            <button
              @click="openPreview(item)"
              class="rounded-2xl bg-indigo-600 px-4 py-3 font-bold text-white transition hover:bg-indigo-700"
            >
              觀賞
            </button>

            <button
              @click="openDetail(item)"
              class="rounded-2xl bg-white px-4 py-3 font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
            >
              詳情
            </button>

            <button
              @click="handleDelete(item)"
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