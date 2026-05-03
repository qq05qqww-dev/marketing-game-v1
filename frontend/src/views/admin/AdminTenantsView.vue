<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()

const tenants = ref([])
const summary = ref({
  total: 0,
  active: 0,
  inactive: 0,
  disabled: 0,
  suspended: 0,
  draft: 0
})
const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const keyword = ref('')
const statusFilter = ref('')
const showCreateForm = ref(false)
const editingTenantId = ref(null)

const form = ref({
  name: '',
  slug: '',
  status: 'ACTIVE',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  createDefaultCampaign: true,
  defaultCampaignTitle: '',
  defaultCampaignStatus: 'ACTIVE',
  defaultSerialCount: 10
})

const role = computed(() => String(authStore.user?.role || '').toUpperCase())
const isPlatformAdmin = computed(() => ['ADMIN', 'SUPER_ADMIN'].includes(role.value))
const isEditing = computed(() => !!editingTenantId.value)

const authHeaders = computed(() => ({
  Authorization: `Bearer ${authStore.token || localStorage.getItem('token') || ''}`,
  'Content-Type': 'application/json'
}))

const statusOptions = [
  { label: '全部狀態', value: '' },
  { label: '啟用', value: 'ACTIVE' },
  { label: '停用', value: 'INACTIVE' },
  { label: '暫停', value: 'SUSPENDED' }
]

const statusTextMap = {
  ACTIVE: '啟用',
  INACTIVE: '停用',
  DISABLED: '停用',
  SUSPENDED: '暫停',
  DRAFT: '草稿'
}

const statusClassMap = {
  ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  INACTIVE: 'border-slate-200 bg-slate-100 text-slate-600',
  DISABLED: 'border-slate-200 bg-slate-100 text-slate-600',
  SUSPENDED: 'border-amber-200 bg-amber-50 text-amber-700',
  DRAFT: 'border-sky-200 bg-sky-50 text-sky-700'
}


const getApiBaseUrl = () => {
  const envBase = String(
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    ''
  ).trim()

  if (envBase) {
    return envBase.replace(/\/$/, '')
  }

  const isViteDevServer = window.location.hostname === 'localhost' && window.location.port === '5173'

  if (isViteDevServer) {
    return 'http://localhost:3000'
  }

  return ''
}

const API_BASE_URL = getApiBaseUrl()
const apiUrl = (path) => `${API_BASE_URL}${path}`

const campaignStatusTextMap = {
  ACTIVE: '啟用',
  DRAFT: '草稿',
  INACTIVE: '停用',
  ENDED: '已結束'
}

const resetForm = () => {
  form.value = {
    name: '',
    slug: '',
    status: 'ACTIVE',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    createDefaultCampaign: true,
    defaultCampaignTitle: '',
    defaultCampaignStatus: 'ACTIVE',
    defaultSerialCount: 10
  }
  editingTenantId.value = null
  showCreateForm.value = false
}

const normalizeSlugText = (value) => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
}

const buildQuery = () => {
  const params = new URLSearchParams()

  if (keyword.value.trim()) {
    params.set('keyword', keyword.value.trim())
  }

  if (statusFilter.value) {
    params.set('status', statusFilter.value)
  }

  const queryString = params.toString()

  return queryString ? `?${queryString}` : ''
}

const readApiData = async (response) => {
  const data = await response.json().catch(() => ({}))

  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || `API 錯誤：${response.status}`)
  }

  return data?.data ?? data
}

const loadSummary = async () => {
  const response = await fetch(apiUrl('/api/tenants/summary'), {
    headers: authHeaders.value,
    cache: 'no-store'
  })

  summary.value = await readApiData(response)
}

const loadTenants = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    await loadSummary()

    const response = await fetch(apiUrl(`/api/tenants${buildQuery()}`), {
      headers: authHeaders.value,
      cache: 'no-store'
    })

    tenants.value = await readApiData(response)
  } catch (error) {
    console.error('載入商家資料失敗:', error)
    errorMessage.value = error.message || '載入商家資料失敗'
  } finally {
    loading.value = false
  }
}

const startCreate = () => {
  resetForm()
  showCreateForm.value = true
}

const startEdit = (tenant) => {
  showCreateForm.value = true
  editingTenantId.value = tenant.id
  form.value = {
    name: tenant.name || '',
    slug: tenant.slug || '',
    status: tenant.status === 'DISABLED' ? 'INACTIVE' : tenant.status || 'ACTIVE',
    contactName: tenant.contactName || '',
    contactPhone: tenant.contactPhone || '',
    contactEmail: tenant.contactEmail || '',
    createDefaultCampaign: false,
    defaultCampaignTitle: '',
    defaultCampaignStatus: 'ACTIVE',
    defaultSerialCount: 10
  }
}

const buildSavePayload = () => {
  const payload = {
    name: form.value.name,
    slug: form.value.slug,
    status: form.value.status,
    contactName: form.value.contactName,
    contactPhone: form.value.contactPhone,
    contactEmail: form.value.contactEmail
  }

  if (!isEditing.value) {
    payload.createDefaultCampaign = Boolean(form.value.createDefaultCampaign)
    payload.defaultCampaignTitle = form.value.defaultCampaignTitle
    payload.defaultCampaignStatus = form.value.defaultCampaignStatus
    payload.defaultSerialCount = Number(form.value.defaultSerialCount || 0)
  }

  return payload
}

const saveTenant = async () => {
  if (!form.value.name.trim()) {
    errorMessage.value = '請輸入商家名稱'
    return
  }

  if (!form.value.slug.trim()) {
    errorMessage.value = '請輸入商家 slug'
    return
  }

  if (!isEditing.value && form.value.createDefaultCampaign) {
    const ok = window.confirm(
      `建立「${form.value.name}」後，系統會同步建立預設砸金蛋活動、GameConfig、獎項與 ${Number(form.value.defaultSerialCount || 0)} 組測試序號。是否繼續？`
    )

    if (!ok) return
  }

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const isEdit = !!editingTenantId.value
    const url = isEdit ? apiUrl(`/api/tenants/${editingTenantId.value}`) : apiUrl('/api/tenants')
    const method = isEdit ? 'PATCH' : 'POST'

    const response = await fetch(url, {
      method,
      headers: authHeaders.value,
      body: JSON.stringify(buildSavePayload())
    })

    const data = await readApiData(response)

    const createdTenantName = data?.tenant?.name || form.value.name
    const createdCampaignTitle = data?.defaultCampaign?.campaign?.title || ''

    if (!isEdit) {
      keyword.value = ''
      statusFilter.value = ''
    }

    if (!isEdit && createdCampaignTitle) {
      successMessage.value = `商家「${createdTenantName}」已建立，並已自動建立「${createdCampaignTitle}」。列表已切回全部商家並重新整理。`
    } else {
      successMessage.value = isEdit ? '商家已更新' : `商家「${createdTenantName}」已建立，列表已切回全部商家並重新整理。`
    }

    resetForm()
    await loadTenants()
  } catch (error) {
    console.error('儲存商家失敗:', error)
    errorMessage.value = error.message || '儲存商家失敗'
  } finally {
    saving.value = false
  }
}

const toggleTenantStatus = async (tenant) => {
  const currentStatus = tenant.status === 'DISABLED' ? 'INACTIVE' : tenant.status
  const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
  const confirmText = nextStatus === 'ACTIVE'
    ? `確定要啟用「${tenant.name}」？`
    : `確定要停用「${tenant.name}」？`

  if (!window.confirm(confirmText)) return

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await fetch(apiUrl(`/api/tenants/${tenant.id}`), {
      method: 'PATCH',
      headers: authHeaders.value,
      body: JSON.stringify({
        status: nextStatus
      })
    })

    await readApiData(response)

    successMessage.value = nextStatus === 'ACTIVE' ? '商家已啟用' : '商家已停用'
    await loadTenants()
  } catch (error) {
    console.error('更新商家狀態失敗:', error)
    errorMessage.value = error.message || '更新商家狀態失敗'
  } finally {
    saving.value = false
  }
}

const deleteTenant = async (tenant) => {
  if (!window.confirm(`確定要刪除「${tenant.name}」？如果商家已有活動或紀錄，系統會阻止刪除。`)) {
    return
  }

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await fetch(apiUrl(`/api/tenants/${tenant.id}`), {
      method: 'DELETE',
      headers: authHeaders.value
    })

    await readApiData(response)

    successMessage.value = '商家已刪除'
    await loadTenants()
  } catch (error) {
    console.error('刪除商家失敗:', error)
    errorMessage.value = error.message || '刪除商家失敗'
  } finally {
    saving.value = false
  }
}

const formatDateTime = (value) => {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleString('zh-TW', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const normalizeSlugInput = () => {
  form.value.slug = normalizeSlugText(form.value.slug)
}

const autoFillSlug = () => {
  if (form.value.slug.trim()) return

  form.value.slug = normalizeSlugText(form.value.name)
}

const autoFillDefaultCampaignTitle = () => {
  if (form.value.defaultCampaignTitle.trim()) return

  form.value.defaultCampaignTitle = `${form.value.name || '新商家'} 砸金蛋活動`
}

const clearFilters = async () => {
  keyword.value = ''
  statusFilter.value = ''
  await loadTenants()
}

onMounted(() => {
  if (isPlatformAdmin.value) {
    loadTenants()
  }
})
</script>

<template>
  <section class="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-7xl space-y-6">
      <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
              TENANT MANAGEMENT
            </p>
            <h1 class="mt-2 text-2xl font-black text-slate-950">
              商家管理
            </h1>
            <p class="mt-2 text-sm text-slate-500">
              平台總管理員可以建立商家，並可選擇同步建立預設砸金蛋活動、GameConfig、獎項與測試序號。
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
              :disabled="loading"
              @click="loadTenants"
            >
              {{ loading ? '重新整理中...' : '重新整理' }}
            </button>
            <button
              v-if="isPlatformAdmin"
              type="button"
              class="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
              @click="startCreate"
            >
              新增商家
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="!isPlatformAdmin"
        class="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-700"
      >
        此頁只開放平台總管理員使用。
      </div>

      <template v-else>
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <p class="text-xs font-bold text-slate-400">全部商家</p>
            <p class="mt-2 text-3xl font-black text-slate-950">{{ summary.total || 0 }}</p>
          </div>
          <div class="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
            <p class="text-xs font-bold text-emerald-600">啟用</p>
            <p class="mt-2 text-3xl font-black text-emerald-700">{{ summary.active || 0 }}</p>
          </div>
          <div class="rounded-3xl border border-slate-200 bg-slate-100 p-4 shadow-sm">
            <p class="text-xs font-bold text-slate-500">停用</p>
            <p class="mt-2 text-3xl font-black text-slate-700">{{ summary.inactive || summary.disabled || 0 }}</p>
          </div>
          <div class="rounded-3xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <p class="text-xs font-bold text-amber-600">暫停</p>
            <p class="mt-2 text-3xl font-black text-amber-700">{{ summary.suspended || 0 }}</p>
          </div>
        </div>

        <div
          v-if="errorMessage"
          class="rounded-3xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-700"
        >
          {{ errorMessage }}
        </div>

        <div
          v-if="successMessage"
          class="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-700"
        >
          {{ successMessage }}
        </div>

        <div
          v-if="showCreateForm"
          class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                TENANT FORM
              </p>
              <h2 class="text-lg font-black text-slate-950">
                {{ editingTenantId ? '編輯商家' : '新增商家' }}
              </h2>
            </div>
            <button
              type="button"
              class="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
              @click="resetForm"
            >
              取消
            </button>
          </div>

          <div class="mt-5 grid gap-4 lg:grid-cols-2">
            <label class="block">
              <span class="text-sm font-bold text-slate-700">商家名稱</span>
              <input
                v-model="form.name"
                type="text"
                class="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                placeholder="例如：A 商家"
                @blur="autoFillSlug(); autoFillDefaultCampaignTitle()"
              />
            </label>

            <label class="block">
              <span class="text-sm font-bold text-slate-700">商家 Slug</span>
              <input
                v-model="form.slug"
                type="text"
                class="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                placeholder="例如：a-shop"
                @blur="normalizeSlugInput"
              />
            </label>

            <label class="block">
              <span class="text-sm font-bold text-slate-700">狀態</span>
              <select
                v-model="form.status"
                class="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
              >
                <option value="ACTIVE">啟用</option>
                <option value="INACTIVE">停用</option>
                <option value="SUSPENDED">暫停</option>
              </select>
            </label>

            <label class="block">
              <span class="text-sm font-bold text-slate-700">聯絡人</span>
              <input
                v-model="form.contactName"
                type="text"
                class="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                placeholder="例如：王小明"
              />
            </label>

            <label class="block">
              <span class="text-sm font-bold text-slate-700">聯絡電話</span>
              <input
                v-model="form.contactPhone"
                type="text"
                class="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                placeholder="例如：0912345678"
              />
            </label>

            <label class="block">
              <span class="text-sm font-bold text-slate-700">聯絡 Email</span>
              <input
                v-model="form.contactEmail"
                type="email"
                class="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                placeholder="例如：owner@example.com"
              />
            </label>
          </div>

          <div
            v-if="!isEditing"
            class="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-4"
          >
            <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p class="text-xs font-black uppercase tracking-[0.2em] text-amber-600">
                  DEFAULT CAMPAIGN
                </p>
                <h3 class="mt-1 text-base font-black text-amber-900">
                  商家建立後自動建立預設砸金蛋活動
                </h3>
                <p class="mt-1 text-sm font-medium text-amber-800">
                  勾選後會同步建立 Campaign、GameConfig、4 個預設獎項與測試序號。商家登入後可以直接進砸金蛋後台調整。
                </p>
              </div>
              <label class="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-black text-amber-800 shadow-sm">
                <input
                  v-model="form.createDefaultCampaign"
                  type="checkbox"
                  class="h-4 w-4 rounded border-amber-300"
                />
                建立預設活動
              </label>
            </div>

            <div
              v-if="form.createDefaultCampaign"
              class="mt-4 grid gap-4 lg:grid-cols-3"
            >
              <label class="block lg:col-span-1">
                <span class="text-sm font-bold text-amber-900">預設活動名稱</span>
                <input
                  v-model="form.defaultCampaignTitle"
                  type="text"
                  class="mt-2 w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500"
                  placeholder="例如：A 商家砸金蛋活動"
                />
              </label>

              <label class="block">
                <span class="text-sm font-bold text-amber-900">活動初始狀態</span>
                <select
                  v-model="form.defaultCampaignStatus"
                  class="mt-2 w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500"
                >
                  <option value="ACTIVE">啟用</option>
                  <option value="DRAFT">草稿</option>
                  <option value="INACTIVE">停用</option>
                </select>
              </label>

              <label class="block">
                <span class="text-sm font-bold text-amber-900">測試序號數量</span>
                <input
                  v-model.number="form.defaultSerialCount"
                  type="number"
                  min="0"
                  max="100"
                  class="mt-2 w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500"
                />
              </label>
            </div>
          </div>

          <div class="mt-5 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              class="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
              @click="resetForm"
            >
              取消
            </button>
            <button
              type="button"
              class="rounded-2xl bg-slate-950 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
              :disabled="saving"
              @click="saveTenant"
            >
              {{ saving ? '儲存中...' : editingTenantId ? '儲存修改' : form.createDefaultCampaign ? '建立商家與預設活動' : '建立商家' }}
            </button>
          </div>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div class="grid flex-1 gap-3 lg:grid-cols-[1fr_220px]">
              <label class="block">
                <span class="text-sm font-bold text-slate-700">搜尋商家</span>
                <input
                  v-model="keyword"
                  type="text"
                  class="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                  placeholder="搜尋名稱、slug、聯絡人、電話、Email"
                  @keyup.enter="loadTenants"
                />
              </label>

              <label class="block">
                <span class="text-sm font-bold text-slate-700">狀態篩選</span>
                <select
                  v-model="statusFilter"
                  class="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                >
                  <option
                    v-for="option in statusOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </label>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
                @click="loadTenants"
              >
                套用篩選
              </button>
              <button
                type="button"
                class="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                @click="clearFilters"
              >
                清除
              </button>
            </div>
          </div>
        </div>

        <div class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                TENANT LIST
              </p>
              <h2 class="text-lg font-black text-slate-950">
                商家列表
              </h2>
            </div>
            <p class="text-sm font-bold text-slate-500">
              共 {{ tenants.length }} 筆
            </p>
          </div>

          <div
            v-if="loading"
            class="p-8 text-center text-sm font-bold text-slate-500"
          >
            載入商家資料中...
          </div>

          <div
            v-else-if="!tenants.length"
            class="p-8 text-center text-sm font-bold text-slate-500"
          >
            目前沒有符合條件的商家。
          </div>

          <div
            v-else
            class="overflow-x-auto"
          >
            <table class="min-w-[1180px] w-full text-left text-sm">
              <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th class="px-5 py-3">商家</th>
                  <th class="px-5 py-3">狀態</th>
                  <th class="px-5 py-3">預設活動 / 最近活動</th>
                  <th class="px-5 py-3">聯絡資料</th>
                  <th class="px-5 py-3">活動</th>
                  <th class="px-5 py-3">帳號</th>
                  <th class="px-5 py-3">序號</th>
                  <th class="px-5 py-3">紀錄</th>
                  <th class="px-5 py-3">建立時間</th>
                  <th class="px-5 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="tenant in tenants"
                  :key="tenant.id"
                  class="hover:bg-slate-50/80"
                >
                  <td class="px-5 py-4">
                    <div class="font-black text-slate-950">{{ tenant.name }}</div>
                    <div class="mt-1 text-xs font-bold text-slate-400">/{{ tenant.slug }}</div>
                  </td>
                  <td class="px-5 py-4">
                    <span
                      class="inline-flex rounded-full border px-3 py-1 text-xs font-black"
                      :class="statusClassMap[tenant.status] || statusClassMap.INACTIVE"
                    >
                      {{ statusTextMap[tenant.status] || tenant.status }}
                    </span>
                  </td>
                  <td class="px-5 py-4">
                    <div v-if="tenant.recentCampaigns?.length" class="space-y-1">
                      <div
                        v-for="campaign in tenant.recentCampaigns"
                        :key="campaign.id"
                        class="rounded-2xl bg-slate-50 px-3 py-2"
                      >
                        <div class="font-black text-slate-700">{{ campaign.title }}</div>
                        <div class="mt-1 text-xs font-bold text-slate-400">
                          #{{ campaign.id }}・{{ campaign.gameType }}・{{ campaignStatusTextMap[campaign.status] || campaign.status }}
                        </div>
                      </div>
                    </div>
                    <span v-else class="text-xs font-bold text-slate-400">尚未建立活動</span>
                  </td>
                  <td class="px-5 py-4">
                    <div class="font-bold text-slate-700">{{ tenant.contactName || '-' }}</div>
                    <div class="mt-1 text-xs text-slate-500">{{ tenant.contactPhone || '-' }}</div>
                    <div class="mt-1 text-xs text-slate-500">{{ tenant.contactEmail || '-' }}</div>
                  </td>
                  <td class="px-5 py-4 font-black text-slate-700">
                    {{ tenant.counts?.campaigns || 0 }}
                  </td>
                  <td class="px-5 py-4 font-black text-slate-700">
                    {{ tenant.counts?.users || 0 }}
                  </td>
                  <td class="px-5 py-4 font-black text-slate-700">
                    {{ tenant.counts?.serialCodes || 0 }}
                  </td>
                  <td class="px-5 py-4">
                    <div class="text-xs font-bold text-slate-500">
                      遊玩 {{ tenant.counts?.playRecords || 0 }}
                    </div>
                    <div class="mt-1 text-xs font-bold text-slate-500">
                      中獎 {{ tenant.counts?.rewardRecords || 0 }}
                    </div>
                  </td>
                  <td class="px-5 py-4 text-xs font-bold text-slate-500">
                    {{ formatDateTime(tenant.createdAt) }}
                  </td>
                  <td class="px-5 py-4">
                    <div class="flex justify-end gap-2">
                      <button
                        type="button"
                        class="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"
                        @click="startEdit(tenant)"
                      >
                        編輯
                      </button>
                      <button
                        type="button"
                        class="rounded-xl border px-3 py-2 text-xs font-black"
                        :class="tenant.status === 'ACTIVE'
                          ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'"
                        @click="toggleTenantStatus(tenant)"
                      >
                        {{ tenant.status === 'ACTIVE' ? '停用' : '啟用' }}
                      </button>
                      <button
                        type="button"
                        class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-100"
                        @click="deleteTenant(tenant)"
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
      </template>
    </div>
  </section>
</template>
