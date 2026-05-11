<script setup>
// Multi Game Platform V2.3 Tenant Edition
// 第 42051～42400 批：商家管理後台精緻簡化與一頁式操作版
// 第 78401～78800 批：商家帳號狀態提示統一強化版
//
// 覆蓋位置：
// frontend/src/views/admin/AdminTenantsView.vue
//
// 本批重點：
// 1. 新增商家時可同步建立商家管理員帳號與初始密碼。
// 2. 商家列表可編輯商家資料，不用刪掉重建。
// 3. 商家列表可重設商家管理員密碼。
// 4. 商家列表可停用 / 啟用商家。
// 5. 每次編輯前會保存快照，可一鍵還原本次修改。
// 6. 保留複製玩家網址 / 管理連結，方便交付商家。

import { computed, onMounted, reactive, ref } from 'vue'
import http from '../../api/http'

const PRODUCTION_FRONTEND_URL = 'https://marketing-game-v1.vercel.app'

const normalizeFrontendUrl = (value = '') => {
  return String(value || '').trim().replace(/\/$/, '')
}

const isLocalFrontendUrl = (value = '') => {
  return /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(String(value || ''))
}

const FRONTEND_BASE_URL = (() => {
  const envUrl = normalizeFrontendUrl(
    import.meta.env.VITE_PUBLIC_FRONTEND_URL ||
      import.meta.env.VITE_FRONTEND_URL ||
      import.meta.env.VITE_APP_FRONTEND_URL ||
      ''
  )

  if (envUrl) return envUrl

  if (typeof window === 'undefined') return PRODUCTION_FRONTEND_URL

  const origin = normalizeFrontendUrl(window.location.origin)

  return isLocalFrontendUrl(origin) ? PRODUCTION_FRONTEND_URL : origin
})()

const tenants = ref([])
const summary = ref({
  total: 0,
  active: 0,
  inactive: 0,
  suspended: 0
})
const tenantUsers = ref({})
const loading = ref(false)
const saving = ref(false)
const userSaving = ref(false)
const message = ref('')
const errorMessage = ref('')
const keyword = ref('')
const statusFilter = ref('ALL')
const quickFilter = ref('ALL')
const viewMode = ref('cards')
const lastCreatedTenant = ref(null)
const editingTenantId = ref(null)
const resetPasswordTenantId = ref(null)
const undoSnapshots = ref({})

const statusOptions = [
  { label: '啟用 ACTIVE', value: 'ACTIVE' },
  { label: '停用 INACTIVE', value: 'INACTIVE' },
  { label: '暫停 SUSPENDED', value: 'SUSPENDED' }
]

const quickFilterOptions = [
  { label: '全部商家', value: 'ALL', icon: '🏪' },
  { label: '啟用中', value: 'ACTIVE', icon: '✅' },
  { label: '已停用', value: 'INACTIVE', icon: '⏸️' },
  { label: '未建帳號', value: 'NO_ACCOUNT', icon: '🔐' },
  { label: '已有活動', value: 'HAS_CAMPAIGN', icon: '🎮' },
  { label: '尚未建立活動', value: 'NO_CAMPAIGN', icon: '🧩' }
]

const roleOptions = [
  { label: '商家管理員', value: 'MERCHANT_ADMIN', description: '可管理商家的活動、序號、獎項與報表。' },
  { label: '商家員工', value: 'MERCHANT_STAFF', description: '適合給門市或客服協助查看與核銷。' }
]

const getRoleText = (role = '') => {
  const option = roleOptions.find((item) => item.value === String(role || '').toUpperCase())

  return option?.label || role || '未設定'
}

const getStatusText = (status = '') => {
  const value = String(status || '').toUpperCase()

  if (value === 'ACTIVE') return '啟用中'
  if (value === 'INACTIVE') return '已停用'
  if (value === 'SUSPENDED') return '已暫停'

  return value || '未設定'
}

const createForm = reactive({
  name: '',
  slug: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  status: 'ACTIVE',
  note: '',
  createAdminUser: true,
  adminName: '',
  adminEmail: '',
  adminPassword: '',
  adminPasswordConfirm: '',
  adminRole: 'MERCHANT_ADMIN'
})

const editForm = reactive({
  id: null,
  name: '',
  slug: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  status: 'ACTIVE',
  note: ''
})

const passwordForm = reactive({
  tenantId: null,
  userId: null,
  name: '',
  email: '',
  role: 'MERCHANT_ADMIN',
  password: '',
  passwordConfirm: ''
})

const fallbackTenants = [
  {
    id: 1,
    name: 'A 商家測試店',
    slug: 'a-shop',
    status: 'ACTIVE',
    contactName: 'A 商家管理員',
    contactPhone: '0900000001',
    contactEmail: 'a-owner@example.com',
    note: '正式測試商家',
    recentUsers: [
      {
        id: 1,
        name: 'A 商家管理員',
        email: 'a-admin@example.com',
        role: 'MERCHANT_ADMIN'
      }
    ],
    counts: {
      users: 1,
      campaigns: 3,
      prizes: 0,
      serialCodes: 0,
      playRecords: 0,
      rewardRecords: 0
    }
  }
]

const normalizeSlug = (value = '') => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
}

const unwrapData = (response) => {
  const payload = response?.data ?? response

  return payload?.data ?? payload
}

const normalizeTenant = (tenant = {}) => {
  return {
    id: tenant.id,
    name: tenant.name || '',
    slug: tenant.slug || '',
    status: tenant.status || 'ACTIVE',
    contactName: tenant.contactName || '',
    contactPhone: tenant.contactPhone || '',
    contactEmail: tenant.contactEmail || '',
    note: tenant.note || '',
    recentUsers: tenant.recentUsers || tenant.users || [],
    recentCampaigns: tenant.recentCampaigns || tenant.campaigns || [],
    counts: tenant.counts || {
      users: tenant._count?.users || 0,
      campaigns: tenant._count?.campaigns || 0,
      prizes: tenant._count?.prizes || 0,
      serialCodes: tenant._count?.serialCodes || 0,
      playRecords: tenant._count?.playRecords || 0,
      rewardRecords: tenant._count?.rewardRecords || 0
    },
    createdAt: tenant.createdAt || '',
    updatedAt: tenant.updatedAt || ''
  }
}

const hasMerchantAccount = (tenant = {}) => {
  const users = tenantUsers.value[tenant.id] || tenant.recentUsers || []

  return users.some((user) => {
    return ['MERCHANT_ADMIN', 'MERCHANT_STAFF'].includes(String(user.role || '').toUpperCase())
  })
}

const hasCampaign = (tenant = {}) => {
  return Number(tenant.counts?.campaigns || 0) > 0 || Number(tenant.recentCampaigns?.length || 0) > 0
}

const visibleTenants = computed(() => {
  const safeKeyword = keyword.value.trim().toLowerCase()

  return tenants.value.filter((tenant) => {
    const matchStatus = statusFilter.value === 'ALL' || tenant.status === statusFilter.value
    const matchKeyword = !safeKeyword ||
      tenant.name.toLowerCase().includes(safeKeyword) ||
      tenant.slug.toLowerCase().includes(safeKeyword) ||
      (tenant.contactName || '').toLowerCase().includes(safeKeyword) ||
      (tenant.contactEmail || '').toLowerCase().includes(safeKeyword) ||
      (tenant.contactPhone || '').toLowerCase().includes(safeKeyword)

    const matchQuickFilter =
      quickFilter.value === 'ALL' ||
      (quickFilter.value === 'ACTIVE' && tenant.status === 'ACTIVE') ||
      (quickFilter.value === 'INACTIVE' && tenant.status !== 'ACTIVE') ||
      (quickFilter.value === 'NO_ACCOUNT' && !hasMerchantAccount(tenant)) ||
      (quickFilter.value === 'HAS_CAMPAIGN' && hasCampaign(tenant)) ||
      (quickFilter.value === 'NO_CAMPAIGN' && !hasCampaign(tenant))

    return matchStatus && matchKeyword && matchQuickFilter
  })
})

const statusCounts = computed(() => {
  return {
    total: tenants.value.length,
    active: tenants.value.filter((item) => item.status === 'ACTIVE').length,
    inactive: tenants.value.filter((item) => item.status === 'INACTIVE').length,
    suspended: tenants.value.filter((item) => item.status === 'SUSPENDED').length
  }
})

const tenantHealthSummary = computed(() => {
  const rows = tenants.value
  const noAccount = rows.filter((tenant) => !hasMerchantAccount(tenant)).length
  const noCampaign = rows.filter((tenant) => !hasCampaign(tenant)).length
  const ready = rows.filter((tenant) => {
    return tenant.status === 'ACTIVE' && hasMerchantAccount(tenant) && hasCampaign(tenant)
  }).length

  return {
    ready,
    noAccount,
    noCampaign,
    needAction: noAccount + noCampaign
  }
})

const tenantDashboardCards = computed(() => [
  {
    label: '商家總數',
    value: summary.value.total || statusCounts.value.total,
    description: '目前平台商家',
    icon: '🏪',
    className: 'border-slate-200 bg-white text-slate-950'
  },
  {
    label: '啟用中',
    value: summary.value.active || statusCounts.value.active,
    description: '可以登入使用',
    icon: '✅',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700'
  },
  {
    label: '待補帳號',
    value: tenantHealthSummary.value.noAccount,
    description: '尚未建立商家登入帳號',
    icon: '🔐',
    className: 'border-amber-200 bg-amber-50 text-amber-700'
  },
  {
    label: '交付完成',
    value: tenantHealthSummary.value.ready,
    description: '帳號、活動、狀態皆正常',
    icon: '🚀',
    className: 'border-blue-200 bg-blue-50 text-blue-700'
  }
])



const setMessage = (value = '') => {
  message.value = value
  errorMessage.value = ''
}

const setError = (value = '') => {
  errorMessage.value = value
  message.value = ''
}

const resetCreateForm = () => {
  Object.assign(createForm, {
    name: '',
    slug: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    status: 'ACTIVE',
    note: '',
    createAdminUser: true,
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: '',
    adminRole: 'MERCHANT_ADMIN'
  })
}

const fillAdminFromContact = () => {
  if (!createForm.adminName) {
    createForm.adminName = createForm.contactName || `${createForm.name} 管理員`
  }

  if (!createForm.adminEmail) {
    createForm.adminEmail = createForm.contactEmail
  }
}

const getTenantPlayerUrl = (tenant) => {
  return `${FRONTEND_BASE_URL}/play/${tenant.slug}/premium-grid`
}

const getTenantAdminUrl = (tenant) => {
  return `${FRONTEND_BASE_URL}/admin/my-games?tenantSlug=${tenant.slug}`
}

const getTenantMyGamesUrl = (tenant) => {
  return `${FRONTEND_BASE_URL}/admin/my-games?tenantSlug=${tenant.slug}`
}

const getTenantLoginUrl = () => {
  return `${FRONTEND_BASE_URL}/login`
}

const getPrimaryAccountText = (tenant = {}) => {
  const users = tenantUsers.value[tenant.id] || tenant.recentUsers || []
  const adminUser = users.find((user) => String(user.role || '').toUpperCase() === 'MERCHANT_ADMIN') || users[0]

  return adminUser?.email || tenant.contactEmail || '尚未建立帳號'
}

const getTenantAccountState = (tenant = {}) => {
  const hasAccount = hasMerchantAccount(tenant)
  const users = tenantUsers.value[tenant.id] || tenant.recentUsers || []
  const adminUser = users.find((user) => String(user.role || '').toUpperCase() === 'MERCHANT_ADMIN') || users[0]

  if (hasAccount) {
    return {
      hasAccount: true,
      icon: '✅',
      badge: '已有帳號',
      title: '已建立商家登入帳號',
      heading: '更新商家登入帳號 / 密碼',
      actionLabel: '更新帳號 / 密碼',
      buttonLabel: '更新帳號 / 密碼',
      summary: `${adminUser?.name || tenant.contactName || tenant.name || '商家管理員'}｜${adminUser?.email || tenant.contactEmail || '未填 Email'}｜${getRoleText(adminUser?.role || 'MERCHANT_ADMIN')}`,
      description: '此商家已有後台登入帳號。你可以修改姓名、Email、角色；只有輸入新密碼時才會重設密碼。',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      badgeClass: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
    }
  }

  return {
    hasAccount: false,
    icon: '⚠️',
    badge: '尚未建立',
    title: '尚未建立商家登入帳號',
    heading: '建立商家登入帳號',
    actionLabel: '建立帳號',
    buttonLabel: '建立登入帳號',
    summary: tenant.contactEmail ? `建議使用：${tenant.contactEmail}` : '尚未設定登入 Email，請先輸入 Email。',
    description: '此商家目前還不能登入後台。請建立商家管理員帳號，並輸入至少 6 碼的新密碼與確認密碼。',
    className: 'border-amber-200 bg-amber-50 text-amber-800',
    badgeClass: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
  }
}

const getTenantAccountActionLabel = (tenant = {}) => {
  return getTenantAccountState(tenant).actionLabel
}

const getTenantReadinessItems = (tenant = {}) => {
  return [
    {
      label: '商家資料',
      done: Boolean(tenant.name && tenant.slug),
      hint: tenant.name && tenant.slug ? '基本資料完整' : '請補商家名稱與 slug'
    },
    {
      label: '登入帳號',
      done: hasMerchantAccount(tenant),
      hint: hasMerchantAccount(tenant) ? '已有商家帳號' : '請建立商家管理員帳號'
    },
    {
      label: '活動資料',
      done: hasCampaign(tenant),
      hint: hasCampaign(tenant) ? `已有 ${tenant.counts?.campaigns || tenant.recentCampaigns?.length || 0} 個活動` : '尚未建立活動'
    },
    {
      label: '商家狀態',
      done: tenant.status === 'ACTIVE',
      hint: tenant.status === 'ACTIVE' ? '啟用中' : '目前停用或暫停'
    }
  ]
}

const getTenantReadinessPercent = (tenant = {}) => {
  const items = getTenantReadinessItems(tenant)
  const done = items.filter((item) => item.done).length

  return Math.round((done / items.length) * 100)
}

const getTenantReadinessClass = (tenant = {}) => {
  const percent = getTenantReadinessPercent(tenant)

  if (percent >= 100) return 'bg-emerald-500'
  if (percent >= 60) return 'bg-amber-400'
  return 'bg-slate-400'
}

const getTenantReadinessText = (tenant = {}) => {
  const percent = getTenantReadinessPercent(tenant)

  if (percent >= 100) return '交付完成'
  if (percent >= 60) return '接近完成'
  return '待補資料'
}

const copyText = async (text, successText = '已複製') => {
  try {
    await navigator.clipboard.writeText(text)
    setMessage(successText)
  } catch (error) {
    console.error('複製失敗:', error)
    setError('複製失敗，請手動複製。')
  }
}

const loadSummary = async () => {
  try {
    const response = await http.get('/tenants/summary')
    const data = unwrapData(response)

    summary.value = {
      total: Number(data?.total || 0),
      active: Number(data?.active || 0),
      inactive: Number(data?.inactive || data?.disabled || 0),
      suspended: Number(data?.suspended || 0)
    }
  } catch (error) {
    console.warn('取得商家總覽失敗，使用本地統計:', error)
    summary.value = statusCounts.value
  }
}

const loadTenants = async () => {
  loading.value = true

  try {
    const params = {}

    if (statusFilter.value !== 'ALL') params.status = statusFilter.value
    if (keyword.value.trim()) params.keyword = keyword.value.trim()

    const response = await http.get('/tenants', { params })
    const data = unwrapData(response)
    const list = Array.isArray(data) ? data : data?.items || data?.tenants || []

    tenants.value = list.map((item) => normalizeTenant(item))
    await loadSummary()
  } catch (error) {
    console.error('取得商家列表失敗:', error)
    tenants.value = fallbackTenants.map((item) => normalizeTenant(item))
    summary.value = statusCounts.value
    setError('取得商家列表失敗，目前顯示示範資料。請確認後端 /api/tenants 是否正常。')
  } finally {
    loading.value = false
  }
}

const loadTenantUsers = async (tenantId) => {
  if (!tenantId) return []

  try {
    const response = await http.get(`/tenants/${tenantId}/users`)
    const data = unwrapData(response)
    const list = Array.isArray(data) ? data : data?.items || data?.users || []

    tenantUsers.value = {
      ...tenantUsers.value,
      [tenantId]: list
    }

    return list
  } catch (error) {
    console.error('取得商家帳號失敗:', error)
    setError('取得商家帳號失敗。')
    return []
  }
}

const validateCreateForm = () => {
  if (!createForm.name.trim()) return '請輸入商家名稱。'
  if (!normalizeSlug(createForm.slug || createForm.name)) return '請輸入商家代碼 slug。'

  if (createForm.createAdminUser) {
    fillAdminFromContact()

    if (!createForm.adminEmail.trim()) return '請輸入商家登入 Email。'
    if (!createForm.adminPassword.trim()) return '請輸入商家初始密碼。'
    if (createForm.adminPassword.length < 6) return '商家初始密碼至少需要 6 個字元。'
    if (!createForm.adminPasswordConfirm.trim()) return '請再次輸入確認密碼。'
    if (createForm.adminPassword !== createForm.adminPasswordConfirm) return '商家密碼與確認密碼不一致。'
  }

  return ''
}

const createTenant = async () => {
  const validationMessage = validateCreateForm()

  if (validationMessage) {
    setError(validationMessage)
    return
  }

  saving.value = true

  try {
    const payload = {
      name: createForm.name.trim(),
      slug: normalizeSlug(createForm.slug || createForm.name),
      contactName: createForm.contactName.trim(),
      contactPhone: createForm.contactPhone.trim(),
      contactEmail: createForm.contactEmail.trim(),
      status: createForm.status,
      note: createForm.note.trim(),
      createAdminUser: createForm.createAdminUser,
      adminName: createForm.adminName.trim() || createForm.contactName.trim() || `${createForm.name.trim()} 管理員`,
      adminEmail: createForm.adminEmail.trim() || createForm.contactEmail.trim(),
      adminPassword: createForm.adminPassword,
      adminRole: createForm.adminRole
    }

    const response = await http.post('/tenants', payload)
    const data = unwrapData(response)
    const tenant = data?.tenant || data

    lastCreatedTenant.value = normalizeTenant(tenant || payload)
    setMessage(data?.message || '商家已建立，並已同步建立商家管理員帳號。')
    resetCreateForm()
    await loadTenants()

    if (tenant?.id) {
      await loadTenantUsers(tenant.id)
    }
  } catch (error) {
    console.error('建立商家失敗:', error)
    setError(error?.response?.data?.message || error?.message || '建立商家失敗。')
  } finally {
    saving.value = false
  }
}

const startEditTenant = async (tenant) => {
  undoSnapshots.value = {
    ...undoSnapshots.value,
    [tenant.id]: { ...tenant }
  }

  editingTenantId.value = tenant.id

  Object.assign(editForm, {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    contactName: tenant.contactName,
    contactPhone: tenant.contactPhone,
    contactEmail: tenant.contactEmail,
    status: tenant.status,
    note: tenant.note || ''
  })

  await loadTenantUsers(tenant.id)
}

const cancelEditTenant = () => {
  editingTenantId.value = null
  Object.assign(editForm, {
    id: null,
    name: '',
    slug: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    status: 'ACTIVE',
    note: ''
  })
}

const updateTenant = async () => {
  if (!editForm.id) return

  if (!editForm.name.trim()) {
    setError('商家名稱不能空白。')
    return
  }

  if (!normalizeSlug(editForm.slug)) {
    setError('商家 slug 不能空白。')
    return
  }

  saving.value = true

  try {
    const payload = {
      name: editForm.name.trim(),
      slug: normalizeSlug(editForm.slug),
      contactName: editForm.contactName.trim(),
      contactPhone: editForm.contactPhone.trim(),
      contactEmail: editForm.contactEmail.trim(),
      status: editForm.status,
      note: editForm.note.trim()
    }

    await http.patch(`/tenants/${editForm.id}`, payload)
    setMessage('商家資料已更新。')
    cancelEditTenant()
    await loadTenants()
  } catch (error) {
    console.error('更新商家失敗:', error)
    setError(error?.response?.data?.message || error?.message || '更新商家失敗。')
  } finally {
    saving.value = false
  }
}

const updateTenantStatus = async (tenant, status) => {
  undoSnapshots.value = {
    ...undoSnapshots.value,
    [tenant.id]: { ...tenant }
  }

  try {
    await http.patch(`/tenants/${tenant.id}`, { status })
    setMessage(status === 'ACTIVE' ? '商家已啟用。' : '商家已停用 / 暫停。')
    await loadTenants()
  } catch (error) {
    console.error('更新商家狀態失敗:', error)
    setError(error?.response?.data?.message || error?.message || '更新商家狀態失敗。')
  }
}

const restoreTenant = async (tenant) => {
  const snapshot = undoSnapshots.value[tenant.id]

  if (!snapshot) {
    setError('目前沒有可還原的修改紀錄。')
    return
  }

  saving.value = true

  try {
    await http.patch(`/tenants/${tenant.id}`, {
      name: snapshot.name,
      slug: snapshot.slug,
      contactName: snapshot.contactName,
      contactPhone: snapshot.contactPhone,
      contactEmail: snapshot.contactEmail,
      status: snapshot.status,
      note: snapshot.note || ''
    })

    const nextSnapshots = { ...undoSnapshots.value }
    delete nextSnapshots[tenant.id]
    undoSnapshots.value = nextSnapshots

    setMessage('已還原商家資料到上一次修改前。')
    await loadTenants()
  } catch (error) {
    console.error('還原商家失敗:', error)
    setError(error?.response?.data?.message || error?.message || '還原商家失敗。')
  } finally {
    saving.value = false
  }
}

const getPrimaryMerchantAdmin = async (tenant) => {
  const users = tenantUsers.value[tenant.id] || tenant.recentUsers || []
  let adminUser = users.find((item) => String(item.role || '').toUpperCase() === 'MERCHANT_ADMIN')

  if (!adminUser) {
    const loadedUsers = await loadTenantUsers(tenant.id)
    adminUser = loadedUsers.find((item) => String(item.role || '').toUpperCase() === 'MERCHANT_ADMIN') || loadedUsers[0]
  }

  return adminUser || null
}

const startResetPassword = async (tenant) => {
  const user = await getPrimaryMerchantAdmin(tenant)

  resetPasswordTenantId.value = tenant.id

  Object.assign(passwordForm, {
    tenantId: tenant.id,
    userId: user?.id || null,
    name: user?.name || tenant.contactName || `${tenant.name} 管理員`,
    email: user?.email || tenant.contactEmail || '',
    role: user?.role || 'MERCHANT_ADMIN',
    password: '',
    passwordConfirm: ''
  })
}

const cancelResetPassword = () => {
  resetPasswordTenantId.value = null
  Object.assign(passwordForm, {
    tenantId: null,
    userId: null,
    name: '',
    email: '',
    role: 'MERCHANT_ADMIN',
    password: '',
    passwordConfirm: ''
  })
}

const saveTenantUser = async () => {
  if (!passwordForm.tenantId) return

  if (!passwordForm.name.trim()) {
    setError('請輸入商家帳號姓名。')
    return
  }

  if (!passwordForm.email.trim()) {
    setError('請輸入商家登入 Email。')
    return
  }

  if (!passwordForm.userId && !passwordForm.password.trim()) {
    setError('建立新商家帳號時必須輸入密碼。')
    return
  }

  if (passwordForm.password.trim()) {
    if (passwordForm.password.length < 6) {
      setError('密碼至少需要 6 個字元。')
      return
    }

    if (passwordForm.password !== passwordForm.passwordConfirm) {
      setError('密碼與確認密碼不一致。')
      return
    }
  }

  userSaving.value = true

  try {
    const payload = {
      name: passwordForm.name.trim(),
      email: passwordForm.email.trim(),
      role: passwordForm.role
    }

    if (passwordForm.password.trim()) {
      payload.password = passwordForm.password
    }

    if (passwordForm.userId) {
      await http.patch(`/tenants/${passwordForm.tenantId}/users/${passwordForm.userId}`, payload)
      setMessage('商家登入帳號已更新。')
    } else {
      await http.post(`/tenants/${passwordForm.tenantId}/users`, {
        ...payload,
        password: passwordForm.password
      })
      setMessage('商家登入帳號已建立。')
    }

    await loadTenantUsers(passwordForm.tenantId)
    cancelResetPassword()
    await loadTenants()
  } catch (error) {
    console.error('儲存商家帳號失敗:', error)
    setError(error?.response?.data?.message || error?.message || '儲存商家帳號失敗。')
  } finally {
    userSaving.value = false
  }
}

const copyLoginInfo = async (tenant) => {
  const user = await getPrimaryMerchantAdmin(tenant)

  const text = [
    `商家後台：${getTenantAdminUrl(tenant)}`,
    `登入網址：${getTenantLoginUrl()}`,
    `商家：${tenant.name}`,
    `登入 Email：${user?.email || tenant.contactEmail || '尚未建立，請先建立商家帳號'}`,
    '密碼：請使用建立商家時設定的密碼，或請平台管理員重設'
  ].join('\n')

  await copyText(text, '商家登入資訊已複製。')
}

const buildTenantHandoffPackage = async (tenant) => {
  const user = await getPrimaryMerchantAdmin(tenant)
  const email = user?.email || tenant.contactEmail || '尚未建立，請先建立商家帳號'

  return [
    `【${tenant.name} 後台交付資訊】`,
    '',
    `登入網址：${getTenantLoginUrl()}`,
    `商家後台：${getTenantMyGamesUrl(tenant)}`,
    `商家代碼：${tenant.slug}`,
    `登入 Email：${email}`,
    '初始密碼：請使用平台建立商家時設定的密碼，或請平台管理員重設',
    '',
    '商家登入後建議操作：',
    '1. 進入「我的遊戲中心」確認輪盤、九宮格、砸金蛋。',
    '2. 到「我的序號管理」建立或確認序號。',
    '3. 複製正式玩家網址給客人。',
    '4. 到「報表中心」查看遊玩與中獎紀錄。',
    '5. 到「發獎核銷」處理兌獎。'
  ].join('\n')
}

const copyTenantHandoffPackage = async (tenant) => {
  const text = await buildTenantHandoffPackage(tenant)

  await copyText(text, '商家交付包已複製。')
}

const openTenantGameCenter = (tenant) => {
  window.open(getTenantMyGamesUrl(tenant), '_blank', 'noopener,noreferrer')
}

onMounted(() => {
  loadTenants()
})
</script>

<template>
  <div class="space-y-6">
    <section class="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div class="grid gap-0 xl:grid-cols-[1.05fr_0.95fr]">
        <div class="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-8 text-white">
          <div class="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-cyan-100">
            Tenant Admin
          </div>

          <h1 class="mt-5 text-3xl font-black md:text-4xl">
            商家管理
          </h1>

          <p class="mt-3 max-w-2xl text-sm font-bold leading-7 text-white/75">
            建立商家資料、同步建立商家登入帳號、管理商家狀態與複製交付連結。
            商家登入後可進入「商家遊戲中心」管理自己的活動與玩家網址。
          </p>

          <div class="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              class="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-50"
              @click="copyText(`${FRONTEND_BASE_URL}/login`, '登入網址已複製')"
            >
              複製登入網址
            </button>

            <button
              type="button"
              class="rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
              @click="loadTenants"
            >
              重新載入商家
            </button>
          </div>
        </div>

        <div class="grid gap-4 bg-slate-50 p-6 md:grid-cols-2">
          <div
            v-for="card in tenantDashboardCards"
            :key="card.label"
            class="rounded-3xl border p-5 shadow-sm"
            :class="card.className"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xs font-black uppercase tracking-[0.2em] opacity-70">{{ card.label }}</p>
                <p class="mt-3 text-4xl font-black">{{ card.value }}</p>
                <p class="mt-2 text-xs font-bold opacity-70">{{ card.description }}</p>
              </div>
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                {{ card.icon }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div
      v-if="message || errorMessage"
      class="rounded-3xl border px-5 py-4 text-sm font-black"
      :class="message ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'"
    >
      {{ message || errorMessage }}
    </div>

    <section
      v-if="lastCreatedTenant"
      class="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-6 shadow-sm"
    >
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
            Merchant Handoff
          </p>
          <h2 class="mt-2 text-2xl font-black text-emerald-950">
            商家已建立，下一步可以直接交付
          </h2>
          <p class="mt-2 text-sm font-bold leading-6 text-emerald-700">
            {{ lastCreatedTenant.name }} 已建立完成。可以複製登入資訊、交付包，或直接開啟商家遊戲中心檢查活動。
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
            @click="copyLoginInfo(lastCreatedTenant)"
          >
            複製登入資訊
          </button>
          <button
            type="button"
            class="rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
            @click="copyTenantHandoffPackage(lastCreatedTenant)"
          >
            複製交付包
          </button>
          <button
            type="button"
            class="rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
            @click="openTenantGameCenter(lastCreatedTenant)"
          >
            開啟商家遊戲中心
          </button>
        </div>
      </div>
    </section>

    <section class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.2em] text-violet-500">
            新增商家
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            建立商家資料與登入帳號
          </h2>
          <p class="mt-2 text-sm font-bold text-slate-500">
            一頁完成：商家基本資料 → 登入帳號 → 交付資訊。建立後可直接複製交付包給商家。
          </p>
        </div>

        <button
          type="button"
          class="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-500 transition hover:bg-slate-50"
          @click="resetCreateForm"
        >
          清空表單
        </button>
      </div>

      <div class="mb-5 grid gap-3 md:grid-cols-3">
        <div class="rounded-3xl border border-slate-100 bg-slate-50 p-4">
          <p class="text-2xl">1️⃣</p>
          <p class="mt-2 text-sm font-black text-slate-950">商家基本資料</p>
          <p class="mt-1 text-xs font-bold leading-5 text-slate-500">名稱、slug、聯絡人、狀態。</p>
        </div>
        <div class="rounded-3xl border border-indigo-100 bg-indigo-50 p-4">
          <p class="text-2xl">2️⃣</p>
          <p class="mt-2 text-sm font-black text-slate-950">登入帳號</p>
          <p class="mt-1 text-xs font-bold leading-5 text-slate-500">建立商家管理員 Email 與密碼。</p>
        </div>
        <div class="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
          <p class="text-2xl">3️⃣</p>
          <p class="mt-2 text-sm font-black text-slate-950">交付商家</p>
          <p class="mt-1 text-xs font-bold leading-5 text-slate-500">複製登入資訊與商家操作入口。</p>
        </div>
      </div>

      <div class="grid gap-4 xl:grid-cols-4">
        <label class="space-y-2">
          <span class="text-sm font-black text-slate-700">商家名稱</span>
          <input
            v-model="createForm.name"
            class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-indigo-400"
            placeholder="例如 A 商家測試店"
            @input="!createForm.slug && (createForm.slug = normalizeSlug(createForm.name))"
          >
        </label>

        <label class="space-y-2">
          <span class="text-sm font-black text-slate-700">商家代碼 slug</span>
          <input
            v-model="createForm.slug"
            class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-indigo-400"
            placeholder="例如 a-shop"
            @blur="createForm.slug = normalizeSlug(createForm.slug)"
          >
        </label>

        <label class="space-y-2">
          <span class="text-sm font-black text-slate-700">聯絡人</span>
          <input
            v-model="createForm.contactName"
            class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-indigo-400"
            @blur="fillAdminFromContact"
          >
        </label>

        <label class="space-y-2">
          <span class="text-sm font-black text-slate-700">狀態</span>
          <select
            v-model="createForm.status"
            class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black outline-none focus:border-indigo-400"
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

        <label class="space-y-2">
          <span class="text-sm font-black text-slate-700">電話</span>
          <input
            v-model="createForm.contactPhone"
            class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-indigo-400"
          >
        </label>

        <label class="space-y-2">
          <span class="text-sm font-black text-slate-700">Email</span>
          <input
            v-model="createForm.contactEmail"
            class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-indigo-400"
            @blur="fillAdminFromContact"
          >
        </label>

        <label class="space-y-2 xl:col-span-2">
          <span class="text-sm font-black text-slate-700">備註</span>
          <input
            v-model="createForm.note"
            class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-indigo-400"
            placeholder="例如：主約、測試商家、到期日..."
          >
        </label>
      </div>

      <div class="mt-6 rounded-3xl border border-indigo-100 bg-indigo-50/70 p-5">
        <label class="inline-flex items-center gap-3 text-sm font-black text-indigo-800">
          <input
            v-model="createForm.createAdminUser"
            type="checkbox"
            class="h-5 w-5 rounded border-indigo-300"
          >
          同步建立商家管理員登入帳號
        </label>

        <div
          v-if="createForm.createAdminUser"
          class="mt-4 grid gap-4 xl:grid-cols-5"
        >
          <label class="space-y-2">
            <span class="text-sm font-black text-slate-700">登入姓名</span>
            <input
              v-model="createForm.adminName"
              class="w-full rounded-2xl border border-indigo-100 px-4 py-3 text-sm font-bold outline-none focus:border-indigo-400"
              placeholder="商家管理員"
            >
          </label>

          <label class="space-y-2">
            <span class="text-sm font-black text-slate-700">登入 Email</span>
            <input
              v-model="createForm.adminEmail"
              class="w-full rounded-2xl border border-indigo-100 px-4 py-3 text-sm font-bold outline-none focus:border-indigo-400"
              placeholder="owner@example.com"
            >
          </label>

          <label class="space-y-2">
            <span class="text-sm font-black text-slate-700">帳號角色</span>
            <select
              v-model="createForm.adminRole"
              class="w-full rounded-2xl border border-indigo-100 px-4 py-3 text-sm font-black outline-none focus:border-indigo-400"
            >
              <option
                v-for="option in roleOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </label>

          <label class="space-y-2">
            <span class="text-sm font-black text-slate-700">初始密碼</span>
            <input
              v-model="createForm.adminPassword"
              type="password"
              class="w-full rounded-2xl border border-indigo-100 px-4 py-3 text-sm font-bold outline-none focus:border-indigo-400"
              placeholder="至少 6 碼"
            >
          </label>

          <label class="space-y-2">
            <span class="text-sm font-black text-slate-700">確認密碼</span>
            <input
              v-model="createForm.adminPasswordConfirm"
              type="password"
              class="w-full rounded-2xl border border-indigo-100 px-4 py-3 text-sm font-bold outline-none focus:border-indigo-400"
            >
          </label>
        </div>
      </div>

      <div
        v-if="errorMessage"
        class="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700"
      >
        {{ errorMessage }}
      </div>

      <div
        v-if="message"
        class="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700"
      >
        {{ message }}
      </div>

      <div class="mt-5 flex justify-end">
        <button
          type="button"
          class="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white transition hover:bg-indigo-700 disabled:opacity-60"
          :disabled="saving"
          @click="createTenant"
        >
          {{ saving ? '建立中...' : '新增商家與登入帳號' }}
        </button>
      </div>
    </section>

    <section class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 class="text-2xl font-black text-slate-950">商家列表</h2>
          <p class="mt-2 text-sm font-bold text-slate-500">
            可搜尋商家名稱、slug、聯絡資訊，並直接編輯、重設密碼、停用或還原。
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <input
            v-model="keyword"
            class="w-72 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-indigo-400"
            placeholder="搜尋商家 / slug / 聯絡人"
            @keyup.enter="loadTenants"
          >

          <select
            v-model="statusFilter"
            class="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black outline-none focus:border-indigo-400"
            @change="loadTenants"
          >
            <option value="ALL">全部狀態</option>
            <option value="ACTIVE">啟用</option>
            <option value="INACTIVE">停用</option>
            <option value="SUSPENDED">暫停</option>
          </select>

          <button
            type="button"
            class="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            @click="loadTenants"
          >
            查詢
          </button>
        </div>
      </div>

      <div class="mb-5 rounded-[2rem] border border-slate-100 bg-slate-50 p-4">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="option in quickFilterOptions"
              :key="option.value"
              type="button"
              class="rounded-2xl border px-4 py-2 text-sm font-black transition"
              :class="quickFilter === option.value
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'"
              @click="quickFilter = option.value"
            >
              {{ option.icon }} {{ option.label }}
            </button>
          </div>

          <div class="flex rounded-2xl border border-slate-200 bg-white p-1">
            <button
              type="button"
              class="rounded-xl px-4 py-2 text-sm font-black transition"
              :class="viewMode === 'cards' ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-50'"
              @click="viewMode = 'cards'"
            >
              卡片
            </button>
            <button
              type="button"
              class="rounded-xl px-4 py-2 text-sm font-black transition"
              :class="viewMode === 'table' ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-50'"
              @click="viewMode = 'table'"
            >
              表格
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="viewMode === 'cards'"
        class="mb-6 grid gap-4 xl:grid-cols-2"
      >
        <article
          v-for="tenant in visibleTenants"
          :key="`card-${tenant.id}`"
          class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-xl font-black text-slate-950">{{ tenant.name }}</h3>
                <span
                  class="rounded-full px-3 py-1 text-xs font-black"
                  :class="tenant.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-700'
                    : tenant.status === 'SUSPENDED'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-500'"
                >
                  {{ getStatusText(tenant.status) }}
                </span>
              </div>

              <p class="mt-2 font-mono text-xs font-black text-indigo-600">/{{ tenant.slug }}</p>
              <p class="mt-3 text-sm font-bold leading-6 text-slate-500">
                {{ tenant.contactName || '未填聯絡人' }}｜{{ tenant.contactEmail || '未填 Email' }}｜{{ tenant.contactPhone || '未填電話' }}
              </p>
            </div>

            <div class="rounded-3xl bg-slate-50 px-5 py-4 text-center">
              <p class="text-3xl font-black text-slate-950">{{ getTenantReadinessPercent(tenant) }}%</p>
              <p class="mt-1 text-xs font-black text-slate-500">{{ getTenantReadinessText(tenant) }}</p>
            </div>
          </div>

          <div class="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              class="h-full rounded-full"
              :class="getTenantReadinessClass(tenant)"
              :style="{ width: `${getTenantReadinessPercent(tenant)}%` }"
            />
          </div>

          <div class="mt-4 grid gap-2 sm:grid-cols-2">
            <div
              v-for="item in getTenantReadinessItems(tenant)"
              :key="`${tenant.id}-${item.label}`"
              class="rounded-2xl border p-3 text-xs font-bold leading-5"
              :class="item.done ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-amber-100 bg-amber-50 text-amber-700'"
            >
              <span class="font-black">{{ item.done ? '✅' : '⚠️' }} {{ item.label }}</span>
              <p class="mt-1">{{ item.hint }}</p>
            </div>
          </div>

          <div class="mt-4 grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              class="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-xs font-black text-indigo-700 transition hover:bg-indigo-100"
              @click="openTenantGameCenter(tenant)"
            >
              進入遊戲中心
            </button>
            <button
              type="button"
              class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-700 transition hover:bg-emerald-100"
              @click="copyTenantHandoffPackage(tenant)"
            >
              複製交付包
            </button>
            <button
              type="button"
              class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-600 transition hover:bg-slate-50"
              @click="copyLoginInfo(tenant)"
            >
              複製登入資訊
            </button>
            <button
              type="button"
              class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-600 transition hover:bg-slate-50"
              @click="startEditTenant(tenant)"
            >
              編輯商家
            </button>
            <button
              type="button"
              class="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-xs font-black text-violet-700 transition hover:bg-violet-100"
              @click="startResetPassword(tenant)"
            >
              {{ getTenantAccountActionLabel(tenant) }}
            </button>
            <button
              type="button"
              class="rounded-2xl border px-4 py-3 text-xs font-black transition"
              :class="tenant.status === 'ACTIVE'
                ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'"
              @click="updateTenantStatus(tenant, tenant.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')"
            >
              {{ tenant.status === 'ACTIVE' ? '停用商家' : '啟用商家' }}
            </button>
          </div>

          <div
            class="mt-4 rounded-2xl border px-4 py-3 text-xs font-bold leading-5"
            :class="getTenantAccountState(tenant).className"
          >
            <span class="font-black">{{ getTenantAccountState(tenant).icon }} {{ getTenantAccountState(tenant).title }}</span>
            <p class="mt-1 opacity-80">{{ getTenantAccountState(tenant).summary }}</p>
          </div>
        </article>
      </div>

      <div
        v-if="viewMode === 'table'"
        class="overflow-hidden rounded-3xl border border-slate-200"
      >
        <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead class="bg-slate-50 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            <tr>
              <th class="px-4 py-3">商家</th>
              <th class="px-4 py-3">Slug</th>
              <th class="px-4 py-3">狀態</th>
              <th class="px-4 py-3">登入帳號</th>
              <th class="px-4 py-3">聯絡資訊</th>
              <th class="px-4 py-3">玩家 / 管理連結</th>
              <th class="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-100 bg-white">
            <template
              v-for="tenant in visibleTenants"
              :key="tenant.id"
            >
              <tr>
                <td class="px-4 py-4 align-top">
                  <div class="font-black text-slate-950">{{ tenant.name }}</div>
                  <div class="mt-1 text-xs font-bold text-slate-400">{{ tenant.note || '沒有備註' }}</div>
                  <div class="mt-2 text-xs font-black text-slate-500">
                    活動 {{ tenant.counts.campaigns || 0 }}｜帳號 {{ tenant.counts.users || 0 }}
                  </div>
                </td>

                <td class="px-4 py-4 align-top">
                  <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                    {{ tenant.slug }}
                  </span>
                </td>

                <td class="px-4 py-4 align-top">
                  <span
                    class="rounded-full px-3 py-1 text-xs font-black"
                    :class="tenant.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-700'
                      : tenant.status === 'SUSPENDED'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-500'"
                  >
                    {{ getStatusText(tenant.status) }}
                  </span>
                </td>

                <td class="px-4 py-4 align-top">
                  <div
                    v-for="user in (tenantUsers[tenant.id] || tenant.recentUsers || []).slice(0, 2)"
                    :key="user.id"
                    class="mb-2 rounded-2xl bg-slate-50 px-3 py-2"
                  >
                    <p class="text-xs font-black text-slate-700">{{ user.name }}</p>
                    <p class="text-xs font-bold text-slate-500">{{ user.email }}</p>
                    <p class="text-[11px] font-black text-indigo-600">{{ getRoleText(user.role) }}</p>
                  </div>
                  <button
                    type="button"
                    class="text-xs font-black text-indigo-600 hover:text-indigo-800"
                    @click="loadTenantUsers(tenant.id)"
                  >
                    重新載入帳號
                  </button>
                </td>

                <td class="px-4 py-4 align-top text-xs font-bold leading-6 text-slate-500">
                  <div>{{ tenant.contactName || '-' }}</div>
                  <div>{{ tenant.contactPhone || '-' }}</div>
                  <div>{{ tenant.contactEmail || '-' }}</div>
                </td>

                <td class="px-4 py-4 align-top">
                  <div class="space-y-2">
                    <button
                      type="button"
                      class="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-50"
                      @click="copyText(getTenantPlayerUrl(tenant), '玩家網址已複製')"
                    >
                      複製玩家網址
                    </button>
                    <button
                      type="button"
                      class="rounded-xl border border-indigo-200 px-3 py-2 text-xs font-black text-indigo-700 transition hover:bg-indigo-50"
                      @click="copyText(getTenantAdminUrl(tenant), '管理連結已複製')"
                    >
                      複製管理連結
                    </button>
                    <button
                      type="button"
                      class="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50"
                      @click="copyLoginInfo(tenant)"
                    >
                      複製登入資訊
                    </button>
                  </div>
                </td>

                <td class="px-4 py-4 align-top text-right">
                  <div class="flex flex-col items-end gap-2">
                    <button
                      type="button"
                      class="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50"
                      @click="startEditTenant(tenant)"
                    >
                      編輯商家
                    </button>

                    <button
                      type="button"
                      class="rounded-xl border border-violet-200 px-3 py-2 text-xs font-black text-violet-700 transition hover:bg-violet-50"
                      @click="startResetPassword(tenant)"
                    >
                      {{ getTenantAccountActionLabel(tenant) }}
                    </button>

                    <button
                      type="button"
                      class="rounded-xl border px-3 py-2 text-xs font-black transition"
                      :class="tenant.status === 'ACTIVE'
                        ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                        : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'"
                      @click="updateTenantStatus(tenant, tenant.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')"
                    >
                      {{ tenant.status === 'ACTIVE' ? '停用商家' : '啟用商家' }}
                    </button>

                    <button
                      type="button"
                      class="rounded-xl border border-rose-200 px-3 py-2 text-xs font-black text-rose-600 transition hover:bg-rose-50 disabled:opacity-40"
                      :disabled="!undoSnapshots[tenant.id]"
                      @click="restoreTenant(tenant)"
                    >
                      還原
                    </button>
                  </div>
                </td>
              </tr>

              <tr
                v-if="editingTenantId === tenant.id"
                class="bg-indigo-50/50"
              >
                <td
                  colspan="7"
                  class="px-5 py-5"
                >
                  <div class="rounded-3xl border border-indigo-100 bg-white p-5">
                    <div class="mb-4 flex items-center justify-between">
                      <h3 class="text-lg font-black text-slate-950">
                        編輯商家資料：{{ tenant.name }}
                      </h3>
                      <button
                        type="button"
                        class="text-sm font-black text-slate-500 hover:text-slate-800"
                        @click="cancelEditTenant"
                      >
                        關閉
                      </button>
                    </div>

                    <div class="grid gap-4 xl:grid-cols-4">
                      <input
                        v-model="editForm.name"
                        class="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-indigo-400"
                        placeholder="商家名稱"
                      >
                      <input
                        v-model="editForm.slug"
                        class="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-indigo-400"
                        placeholder="slug"
                        @blur="editForm.slug = normalizeSlug(editForm.slug)"
                      >
                      <input
                        v-model="editForm.contactName"
                        class="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-indigo-400"
                        placeholder="聯絡人"
                      >
                      <select
                        v-model="editForm.status"
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
                      <input
                        v-model="editForm.contactPhone"
                        class="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-indigo-400"
                        placeholder="電話"
                      >
                      <input
                        v-model="editForm.contactEmail"
                        class="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-indigo-400"
                        placeholder="Email"
                      >
                      <input
                        v-model="editForm.note"
                        class="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-indigo-400 xl:col-span-2"
                        placeholder="備註"
                      >
                    </div>

                    <div class="mt-4 flex justify-end gap-3">
                      <button
                        type="button"
                        class="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
                        @click="cancelEditTenant"
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        class="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-700"
                        @click="updateTenant"
                      >
                        儲存變更
                      </button>
                    </div>
                  </div>
                </td>
              </tr>

              <tr
                v-if="resetPasswordTenantId === tenant.id"
                class="bg-violet-50/50"
              >
                <td
                  colspan="7"
                  class="px-5 py-5"
                >
                  <div class="rounded-3xl border border-violet-100 bg-white p-5">
                    <div class="mb-4 flex items-center justify-between">
                      <div>
                        <p class="text-xs font-black uppercase tracking-[0.28em] text-violet-500">
                          Account Status｜第 78401～78800 批
                        </p>
                        <h3 class="mt-1 text-lg font-black text-slate-950">
                          {{ getTenantAccountState(tenant).heading }}：{{ tenant.name }}
                        </h3>
                      </div>
                      <button
                        type="button"
                        class="text-sm font-black text-slate-500 hover:text-slate-800"
                        @click="cancelResetPassword"
                      >
                        關閉
                      </button>
                    </div>

                    <div
                      class="mb-4 rounded-3xl border p-4"
                      :class="getTenantAccountState(tenant).className"
                    >
                      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div class="flex items-start gap-3">
                          <span class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/70 text-xl shadow-sm">
                            {{ getTenantAccountState(tenant).icon }}
                          </span>
                          <div>
                            <div class="flex flex-wrap items-center gap-2">
                              <p class="text-sm font-black">{{ getTenantAccountState(tenant).title }}</p>
                              <span
                                class="rounded-full px-3 py-1 text-[11px] font-black"
                                :class="getTenantAccountState(tenant).badgeClass"
                              >
                                {{ getTenantAccountState(tenant).badge }}
                              </span>
                            </div>
                            <p class="mt-1 text-xs font-bold leading-5 opacity-90">
                              {{ getTenantAccountState(tenant).summary }}
                            </p>
                            <p class="mt-2 text-xs font-bold leading-5 opacity-80">
                              {{ getTenantAccountState(tenant).description }}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="grid gap-4 xl:grid-cols-5">
                      <input
                        v-model="passwordForm.name"
                        class="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-violet-400"
                        placeholder="帳號姓名"
                      >
                      <input
                        v-model="passwordForm.email"
                        class="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-violet-400"
                        placeholder="登入 Email"
                      >
                      <select
                        v-model="passwordForm.role"
                        class="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black outline-none focus:border-violet-400"
                      >
                        <option
                          v-for="option in roleOptions"
                          :key="option.value"
                          :value="option.value"
                        >
                          {{ option.label }}
                        </option>
                      </select>
                      <input
                        v-model="passwordForm.password"
                        type="password"
                        class="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-violet-400"
                        placeholder="新密碼，至少 6 碼"
                      >
                      <input
                        v-model="passwordForm.passwordConfirm"
                        type="password"
                        class="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-violet-400"
                        placeholder="確認新密碼"
                      >
                    </div>

                    <p class="mt-3 text-xs font-bold text-slate-500">
                      {{ getTenantAccountState(tenant).hasAccount
                        ? '已有登入帳號：不填新密碼時只更新姓名、Email 與角色；填入新密碼才會重設密碼。'
                        : '尚未建立登入帳號：請輸入 Email、角色、新密碼與確認密碼，儲存後商家即可登入後台。' }}
                    </p>

                    <div class="mt-4 flex justify-end gap-3">
                      <button
                        type="button"
                        class="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
                        @click="cancelResetPassword"
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        class="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white transition hover:bg-violet-700 disabled:opacity-60"
                        :disabled="userSaving"
                        @click="saveTenantUser"
                      >
                        {{ userSaving ? '儲存中...' : getTenantAccountState(tenant).buttonLabel }}
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </template>

            <tr v-if="!loading && !visibleTenants.length">
              <td
                colspan="7"
                class="px-5 py-10 text-center text-sm font-black text-slate-400"
              >
                目前沒有符合條件的商家。
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
