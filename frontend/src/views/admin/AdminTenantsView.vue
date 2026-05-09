<script setup>
// Multi Game Platform V2.3
// 第 16301～16700 批：平台商家管理頁基礎版
//
// 覆蓋 / 新增位置：
// frontend/src/views/admin/AdminTenantsView.vue
//
// 本批重點：
// 1. 補齊 /admin/tenants 對應頁面，避免左側「商家管理」點進去 404。
// 2. 提供平台商家列表、搜尋、狀態篩選、快速複製 slug / 玩家網址。
// 3. API 尚未完成時不會白畫面，會顯示範例資料與提示。
// 4. 不改 DB schema / draw-core。

import { computed, onMounted, reactive, ref } from 'vue'
import http from '../../api/http'

const tenants = ref([])
const loading = ref(false)
const saving = ref(false)
const message = ref('')
const errorMessage = ref('')
const keyword = ref('')
const statusFilter = ref('ALL')

const form = reactive({
  name: '',
  slug: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  status: 'ACTIVE',
  note: ''
})

const fallbackTenants = [
  {
    id: 1,
    name: 'A 商家測試店',
    slug: 'a-shop',
    status: 'ACTIVE',
    contactName: 'A 商家管理員',
    contactPhone: '',
    contactEmail: '',
    campaignCount: 1,
    note: '測試輪盤 / 九宮格活動商家'
  },
  {
    id: 2,
    name: 'B 商家測試店',
    slug: 'b-shop',
    status: 'ACTIVE',
    contactName: 'B 商家管理員',
    contactPhone: '',
    contactEmail: '',
    campaignCount: 1,
    note: '測試砸金蛋活動商家'
  },
  {
    id: 3,
    name: 'Demo Shop',
    slug: 'demo-shop',
    status: 'ACTIVE',
    contactName: '平台預設商家',
    contactPhone: '',
    contactEmail: '',
    campaignCount: 1,
    note: '本機開發預設商家'
  }
]

const resetMessages = () => {
  message.value = ''
  errorMessage.value = ''
}

const normalizeResponseData = (response) => {
  const payload = response?.data

  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.data?.items)) return payload.data.items

  return []
}

const normalizeSlug = (value) => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const frontOrigin = computed(() => {
  if (typeof window === 'undefined') return 'http://localhost:5173'

  return window.location.origin
})

const filteredTenants = computed(() => {
  const search = String(keyword.value || '').trim().toLowerCase()
  const status = String(statusFilter.value || 'ALL').toUpperCase()

  return tenants.value.filter((tenant) => {
    const statusText = String(tenant.status || '').toUpperCase()
    const text = [
      tenant.name,
      tenant.slug,
      tenant.contactName,
      tenant.contactPhone,
      tenant.contactEmail,
      tenant.note
    ].join(' ').toLowerCase()

    const matchKeyword = !search || text.includes(search)
    const matchStatus = status === 'ALL' || statusText === status

    return matchKeyword && matchStatus
  })
})

const tenantStats = computed(() => {
  const total = tenants.value.length
  const active = tenants.value.filter((tenant) => String(tenant.status || '').toUpperCase() === 'ACTIVE').length
  const inactive = tenants.value.filter((tenant) => String(tenant.status || '').toUpperCase() !== 'ACTIVE').length

  return {
    total,
    active,
    inactive
  }
})

const getTenantPlayerUrl = (tenant) => {
  const slug = tenant?.slug || 'demo-shop'

  return `${frontOrigin.value}/play/${slug}/premium-grid`
}

const copyText = async (text, successMessage = '已複製') => {
  resetMessages()

  try {
    await navigator.clipboard.writeText(text)
    message.value = successMessage
  } catch (error) {
    console.error('複製失敗:', error)
    errorMessage.value = '複製失敗，請手動複製。'
  }
}

const loadTenants = async () => {
  loading.value = true
  resetMessages()

  const attempts = [
    () => http.get('/tenants'),
    () => http.get('/admin/tenants'),
    () => http.get('/tenant')
  ]

  let lastError = null

  for (const attempt of attempts) {
    try {
      const response = await attempt()
      const items = normalizeResponseData(response)

      tenants.value = items.length ? items : fallbackTenants
      message.value = items.length
        ? `已載入 ${items.length} 個商家。`
        : '目前 API 無資料，已顯示本機範例商家。'
      loading.value = false
      return
    } catch (error) {
      lastError = error

      if (![404, 405].includes(error?.response?.status)) {
        break
      }
    }
  }

  console.warn('商家 API 尚未完成，使用前端範例資料：', lastError)
  tenants.value = fallbackTenants
  errorMessage.value = '後端商家列表 API 尚未完成，暫時顯示前端範例資料。'
  loading.value = false
}

const resetForm = () => {
  form.name = ''
  form.slug = ''
  form.contactName = ''
  form.contactPhone = ''
  form.contactEmail = ''
  form.status = 'ACTIVE'
  form.note = ''
}

const createTenant = async () => {
  resetMessages()

  const name = String(form.name || '').trim()
  const slug = normalizeSlug(form.slug || form.name)

  if (!name) {
    errorMessage.value = '請先輸入商家名稱。'
    return
  }

  if (!slug) {
    errorMessage.value = '請先輸入商家代碼 slug，例如 a-shop。'
    return
  }

  saving.value = true

  const payload = {
    name,
    slug,
    contactName: form.contactName || '',
    contactPhone: form.contactPhone || '',
    contactEmail: form.contactEmail || '',
    status: form.status || 'ACTIVE',
    note: form.note || ''
  }

  const attempts = [
    () => http.post('/tenants', payload),
    () => http.post('/admin/tenants', payload),
    () => http.post('/tenant', payload)
  ]

  let created = null
  let lastError = null

  for (const attempt of attempts) {
    try {
      const response = await attempt()
      created = response?.data?.data || response?.data || payload
      break
    } catch (error) {
      lastError = error

      if (![404, 405].includes(error?.response?.status)) {
        break
      }
    }
  }

  if (!created) {
    created = {
      ...payload,
      id: `local-${Date.now()}`,
      campaignCount: 0
    }

    errorMessage.value = '後端新增商家 API 尚未完成，已先加入前端畫面預覽。重新整理後可能消失。'
  } else {
    message.value = `已建立商家：${created.name || payload.name}`
  }

  tenants.value = [
    created,
    ...tenants.value
  ]

  resetForm()
  saving.value = false
}

const toggleTenantStatus = async (tenant) => {
  resetMessages()

  const id = tenant.id
  const oldStatus = tenant.status
  const nextStatus = String(tenant.status || '').toUpperCase() === 'ACTIVE'
    ? 'INACTIVE'
    : 'ACTIVE'
  const index = tenants.value.findIndex((item) => String(item.id) === String(id))

  if (index !== -1) {
    tenants.value[index] = {
      ...tenants.value[index],
      status: nextStatus
    }
  }

  message.value = `畫面已切換「${tenant.name}」為 ${nextStatus}。`

  const attempts = [
    () => http.patch(`/tenants/${id}`, { status: nextStatus }),
    () => http.patch(`/admin/tenants/${id}`, { status: nextStatus }),
    () => http.patch(`/tenant/${id}`, { status: nextStatus })
  ]

  for (const attempt of attempts) {
    try {
      await attempt()
      message.value = `已同步商家狀態：${nextStatus}`
      return
    } catch (error) {
      if (![404, 405].includes(error?.response?.status)) {
        console.error('更新商家狀態失敗:', error)
        errorMessage.value = error?.response?.data?.message || '更新商家狀態失敗。'

        if (index !== -1) {
          tenants.value[index] = {
            ...tenants.value[index],
            status: oldStatus
          }
        }

        return
      }
    }
  }

  errorMessage.value = '後端商家狀態 API 尚未完成，畫面已先切換。'
}

onMounted(() => {
  loadTenants()
})
</script>

<template>
  <div class="space-y-6">
    <header class="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p class="text-sm font-black text-violet-600">
            Multi Game Platform V2.3｜第 16301～16700 批
          </p>
          <h1 class="mt-2 text-3xl font-black text-slate-950">
            商家管理｜平台商家列表
          </h1>
          <p class="mt-3 max-w-4xl text-sm font-bold leading-7 text-slate-500">
            平台總管理員可在這裡管理商家資料、商家代碼 slug、狀態與玩家專屬網址。
          </p>
        </div>

        <button
          type="button"
          class="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
          @click="loadTenants"
        >
          重新載入商家
        </button>
      </div>

      <div
        v-if="message"
        class="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"
      >
        {{ message }}
      </div>
      <div
        v-if="errorMessage"
        class="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700"
      >
        {{ errorMessage }}
      </div>
    </header>

    <section class="grid gap-4 md:grid-cols-3">
      <div class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-xs font-black text-slate-400">商家總數</p>
        <p class="mt-2 text-4xl font-black text-slate-950">{{ tenantStats.total }}</p>
      </div>
      <div class="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
        <p class="text-xs font-black text-emerald-600">啟用中</p>
        <p class="mt-2 text-4xl font-black text-emerald-700">{{ tenantStats.active }}</p>
      </div>
      <div class="rounded-[28px] border border-amber-200 bg-amber-50 p-5 shadow-sm">
        <p class="text-xs font-black text-amber-600">暫停 / 停用</p>
        <p class="mt-2 text-4xl font-black text-amber-700">{{ tenantStats.inactive }}</p>
      </div>
    </section>

    <section class="rounded-[32px] border border-violet-100 bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="text-sm font-black text-violet-600">新增商家</p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">建立商家資料與專屬 slug</h2>
        </div>
        <button
          type="button"
          class="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          @click="resetForm"
        >
          清空表單
        </button>
      </div>

      <div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label class="space-y-2">
          <span class="text-sm font-black text-slate-700">商家名稱</span>
          <input
            v-model="form.name"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            placeholder="例如 A 商家測試店"
          />
        </label>
        <label class="space-y-2">
          <span class="text-sm font-black text-slate-700">商家代碼 slug</span>
          <input
            v-model="form.slug"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            placeholder="例如 a-shop"
            @blur="form.slug = normalizeSlug(form.slug)"
          />
        </label>
        <label class="space-y-2">
          <span class="text-sm font-black text-slate-700">聯絡人</span>
          <input
            v-model="form.contactName"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
          />
        </label>
        <label class="space-y-2">
          <span class="text-sm font-black text-slate-700">狀態</span>
          <select
            v-model="form.status"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
          >
            <option value="ACTIVE">啟用 ACTIVE</option>
            <option value="INACTIVE">暫停 INACTIVE</option>
          </select>
        </label>
        <label class="space-y-2">
          <span class="text-sm font-black text-slate-700">電話</span>
          <input
            v-model="form.contactPhone"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
          />
        </label>
        <label class="space-y-2">
          <span class="text-sm font-black text-slate-700">Email</span>
          <input
            v-model="form.contactEmail"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
          />
        </label>
        <label class="space-y-2 xl:col-span-2">
          <span class="text-sm font-black text-slate-700">備註</span>
          <input
            v-model="form.note"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
          />
        </label>
      </div>

      <div class="mt-5 flex justify-end">
        <button
          type="button"
          :disabled="saving"
          class="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
          @click="createTenant"
        >
          {{ saving ? '建立中...' : '新增商家' }}
        </button>
      </div>
    </section>

    <section class="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 class="text-2xl font-black text-slate-950">商家列表</h2>
          <p class="mt-2 text-sm font-bold text-slate-500">
            可搜尋商家名稱、slug、聯絡資訊，並複製玩家專屬九宮格網址。
          </p>
        </div>

        <div class="grid w-full gap-3 md:grid-cols-[1fr_180px] xl:max-w-xl">
          <input
            v-model="keyword"
            class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
            placeholder="搜尋商家 / slug / 聯絡人"
          />
          <select
            v-model="statusFilter"
            class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
          >
            <option value="ALL">全部狀態</option>
            <option value="ACTIVE">啟用</option>
            <option value="INACTIVE">暫停</option>
          </select>
        </div>
      </div>

      <div
        v-if="loading"
        class="mt-6 rounded-3xl bg-slate-50 px-6 py-12 text-center text-sm font-black text-slate-500"
      >
        載入商家中...
      </div>

      <div
        v-else-if="!filteredTenants.length"
        class="mt-6 rounded-3xl bg-slate-50 px-6 py-12 text-center text-sm font-black text-slate-500"
      >
        沒有符合條件的商家。
      </div>

      <div
        v-else
        class="mt-6 overflow-hidden rounded-3xl border border-slate-200"
      >
        <table class="w-full min-w-[980px] text-left text-sm">
          <thead class="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-4 py-3">商家</th>
              <th class="px-4 py-3">slug</th>
              <th class="px-4 py-3">狀態</th>
              <th class="px-4 py-3">聯絡資訊</th>
              <th class="px-4 py-3">玩家網址</th>
              <th class="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="tenant in filteredTenants"
              :key="tenant.id || tenant.slug"
              class="border-t border-slate-100 align-top"
            >
              <td class="px-4 py-4">
                <p class="font-black text-slate-950">{{ tenant.name }}</p>
                <p class="mt-1 text-xs font-bold text-slate-500">{{ tenant.note || '沒有備註' }}</p>
              </td>
              <td class="px-4 py-4">
                <button
                  type="button"
                  class="rounded-xl bg-slate-100 px-3 py-2 font-mono text-xs font-black text-slate-700 transition hover:bg-slate-200"
                  @click="copyText(tenant.slug, '已複製商家 slug')"
                >
                  {{ tenant.slug }}
                </button>
              </td>
              <td class="px-4 py-4">
                <span
                  :class="[
                    'rounded-full px-3 py-1 text-xs font-black',
                    String(tenant.status).toUpperCase() === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  ]"
                >
                  {{ tenant.status || 'ACTIVE' }}
                </span>
              </td>
              <td class="px-4 py-4 text-xs font-bold leading-6 text-slate-500">
                <p>{{ tenant.contactName || '-' }}</p>
                <p>{{ tenant.contactPhone || '-' }}</p>
                <p>{{ tenant.contactEmail || '-' }}</p>
              </td>
              <td class="px-4 py-4">
                <p class="max-w-[260px] truncate text-xs font-bold text-indigo-700">
                  {{ getTenantPlayerUrl(tenant) }}
                </p>
                <button
                  type="button"
                  class="mt-2 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-black text-indigo-700 transition hover:bg-indigo-50"
                  @click="copyText(getTenantPlayerUrl(tenant), '已複製商家玩家網址')"
                >
                  複製玩家網址
                </button>
              </td>
              <td class="px-4 py-4">
                <div class="grid gap-2">
                  <button
                    type="button"
                    class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                    @click="toggleTenantStatus(tenant)"
                  >
                    {{ String(tenant.status).toUpperCase() === 'ACTIVE' ? '暫停商家' : '啟用商家' }}
                  </button>
                  <button
                    type="button"
                    class="rounded-xl border border-violet-200 bg-white px-3 py-2 text-xs font-black text-violet-700 transition hover:bg-violet-50"
                    @click="copyText(`/admin/campaigns?tenantSlug=${tenant.slug}`, '已複製活動管理查詢連結')"
                  >
                    複製管理連結
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
