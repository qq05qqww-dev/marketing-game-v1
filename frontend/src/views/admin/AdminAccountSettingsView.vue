<script setup>
// Multi Game Platform V2.3 Tenant Edition
// 第 39601～40000 批：商家我的帳號與自行修改密碼版
//
// 新增位置：
// frontend/src/views/admin/AdminAccountSettingsView.vue
//
// 本批重點：
// 1. 商家登入後可查看自己的帳號資料。
// 2. 商家可自行修改姓名。
// 3. 商家可輸入目前密碼、新密碼、確認新密碼自行修改密碼。
// 4. 修改密碼成功後同步更新 token / user。
// 5. 平台管理員也可使用此頁更新自己的登入資訊。

import { computed, onMounted, reactive, ref } from 'vue'
import http from '../../api/http'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()

const loading = ref(false)
const savingProfile = ref(false)
const savingPassword = ref(false)
const message = ref('')
const errorMessage = ref('')

const profileForm = reactive({
  name: '',
  email: '',
  role: '',
  tenantName: '',
  tenantSlug: '',
  tenantStatus: '',
  authProvider: 'EMAIL'
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const roleText = computed(() => {
  const role = String(profileForm.role || authStore.user?.role || '').toUpperCase()
  const map = {
    ADMIN: '平台總管理員',
    SUPER_ADMIN: '平台總管理員',
    MERCHANT_ADMIN: '商家管理員',
    MERCHANT_STAFF: '商家員工',
    USER: '一般會員'
  }

  return map[role] || role || '未設定'
})

const tenantStatusText = computed(() => {
  const status = String(profileForm.tenantStatus || '').toUpperCase()

  if (!status) return '平台帳號 / 未綁定商家'
  if (status === 'ACTIVE') return '啟用中'
  if (status === 'INACTIVE') return '已停用'
  if (status === 'SUSPENDED') return '已暫停'

  return status
})

const isPasswordAccount = computed(() => {
  return String(profileForm.authProvider || 'EMAIL').toUpperCase() === 'EMAIL'
})

const setMessage = (value = '') => {
  message.value = value
  errorMessage.value = ''
}

const setError = (value = '') => {
  errorMessage.value = value
  message.value = ''
}

const unwrapData = (response) => {
  const payload = response?.data ?? response

  return payload?.data ?? payload
}

const syncProfileForm = (user = {}) => {
  profileForm.name = user.name || ''
  profileForm.email = user.email || ''
  profileForm.role = user.role || ''
  profileForm.tenantName = user.tenantName || user.tenant?.name || ''
  profileForm.tenantSlug = user.tenantSlug || user.tenant?.slug || ''
  profileForm.tenantStatus = user.tenantStatus || user.tenant?.status || ''
  profileForm.authProvider = user.authProvider || 'EMAIL'
}

const loadProfile = async () => {
  loading.value = true

  try {
    const response = await http.get('/auth/me')
    const profile = unwrapData(response)

    if (profile) {
      authStore.setUser(profile)
      syncProfileForm(profile)
    }
  } catch (error) {
    console.error('取得我的帳號失敗:', error)
    setError(error?.response?.data?.message || '取得我的帳號失敗，請重新登入。')
  } finally {
    loading.value = false
  }
}

const updateProfile = async () => {
  if (!profileForm.name.trim()) {
    setError('請輸入姓名。')
    return
  }

  savingProfile.value = true

  try {
    const response = await http.patch('/auth/me', {
      name: profileForm.name.trim()
    })

    const profile = unwrapData(response)

    if (profile) {
      authStore.setUser(profile)
      syncProfileForm(profile)
    }

    setMessage('帳號資料已更新。')
  } catch (error) {
    console.error('更新我的帳號失敗:', error)
    setError(error?.response?.data?.message || '更新我的帳號失敗。')
  } finally {
    savingProfile.value = false
  }
}

const resetPasswordForm = () => {
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}

const changePassword = async () => {
  if (!passwordForm.currentPassword) {
    setError('請輸入目前密碼。')
    return
  }

  if (!passwordForm.newPassword) {
    setError('請輸入新密碼。')
    return
  }

  if (passwordForm.newPassword.length < 6) {
    setError('新密碼至少需要 6 個字元。')
    return
  }

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    setError('新密碼與確認密碼不一致。')
    return
  }

  savingPassword.value = true

  try {
    const response = await http.patch('/auth/me/password', {
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
      confirmPassword: passwordForm.confirmPassword
    })

    const result = unwrapData(response)

    if (result?.token || result?.user) {
      authStore.setLogin(result)
    } else {
      await authStore.refreshProfile()
    }

    resetPasswordForm()
    setMessage('密碼已更新，下次登入請使用新密碼。')
  } catch (error) {
    console.error('修改密碼失敗:', error)
    setError(error?.response?.data?.message || '修改密碼失敗。')
  } finally {
    savingPassword.value = false
  }
}

onMounted(() => {
  syncProfileForm(authStore.user || {})
  loadProfile()
})
</script>

<template>
  <div class="space-y-6 p-4 md:p-8">
    <section class="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div class="grid gap-0 xl:grid-cols-[1.05fr_0.95fr]">
        <div class="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-8 text-white">
          <div class="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-cyan-100">
            Account Settings
          </div>

          <h1 class="mt-5 text-3xl font-black md:text-4xl">
            我的帳號
          </h1>

          <p class="mt-3 max-w-2xl text-sm font-bold leading-7 text-white/75">
            可查看目前登入身份、所屬商家，並自行修改姓名與登入密碼。
            商家不用每次都找平台管理員重設密碼。
          </p>

          <div class="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              class="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-50"
              @click="loadProfile"
            >
              重新同步帳號
            </button>

            <button
              type="button"
              class="rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
              @click="resetPasswordForm"
            >
              清空密碼欄位
            </button>
          </div>
        </div>

        <div class="grid gap-4 bg-slate-50 p-6 md:grid-cols-2">
          <div class="rounded-3xl border border-slate-200 bg-white p-5">
            <p class="text-xs font-black uppercase tracking-[0.2em] text-slate-400">目前身份</p>
            <p class="mt-3 text-2xl font-black text-slate-950">{{ roleText }}</p>
          </div>

          <div class="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <p class="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">商家狀態</p>
            <p class="mt-3 text-2xl font-black text-emerald-700">{{ tenantStatusText }}</p>
          </div>

          <div class="rounded-3xl border border-indigo-200 bg-indigo-50 p-5 md:col-span-2">
            <p class="text-xs font-black uppercase tracking-[0.2em] text-indigo-500">所屬商家</p>
            <p class="mt-3 text-2xl font-black text-slate-950">
              {{ profileForm.tenantName || '平台帳號 / 未綁定商家' }}
            </p>
            <p
              v-if="profileForm.tenantSlug"
              class="mt-1 text-sm font-black text-indigo-700"
            >
              /{{ profileForm.tenantSlug }}
            </p>
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

    <section class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-5">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-violet-500">
            Profile
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            基本資料
          </h2>
          <p class="mt-2 text-sm font-bold text-slate-500">
            Email 與角色由平台管理員控管，商家可自行修改顯示姓名。
          </p>
        </div>

        <div class="space-y-4">
          <label class="block space-y-2">
            <span class="text-sm font-black text-slate-700">姓名</span>
            <input
              v-model="profileForm.name"
              class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-indigo-400"
              placeholder="請輸入姓名"
            >
          </label>

          <label class="block space-y-2">
            <span class="text-sm font-black text-slate-700">登入 Email</span>
            <input
              v-model="profileForm.email"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500 outline-none"
              disabled
            >
          </label>

          <label class="block space-y-2">
            <span class="text-sm font-black text-slate-700">角色</span>
            <input
              :value="roleText"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-500 outline-none"
              disabled
            >
          </label>
        </div>

        <div class="mt-5 flex justify-end">
          <button
            type="button"
            class="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white transition hover:bg-indigo-700 disabled:opacity-60"
            :disabled="savingProfile || loading"
            @click="updateProfile"
          >
            {{ savingProfile ? '儲存中...' : '儲存基本資料' }}
          </button>
        </div>
      </div>

      <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-5">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-amber-500">
            Password
          </p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">
            修改密碼
          </h2>
          <p class="mt-2 text-sm font-bold text-slate-500">
            為了安全，修改密碼前需要先輸入目前密碼。
          </p>
        </div>

        <div
          v-if="!isPasswordAccount"
          class="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm font-black leading-7 text-amber-700"
        >
          這個帳號使用 {{ profileForm.authProvider }} 登入，尚未設定本機密碼。
          若需要密碼登入，請聯絡平台管理員重設。
        </div>

        <div
          v-else
          class="space-y-4"
        >
          <label class="block space-y-2">
            <span class="text-sm font-black text-slate-700">目前密碼</span>
            <input
              v-model="passwordForm.currentPassword"
              type="password"
              class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-amber-400"
              placeholder="請輸入目前密碼"
            >
          </label>

          <label class="block space-y-2">
            <span class="text-sm font-black text-slate-700">新密碼</span>
            <input
              v-model="passwordForm.newPassword"
              type="password"
              class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-amber-400"
              placeholder="至少 6 個字元"
            >
          </label>

          <label class="block space-y-2">
            <span class="text-sm font-black text-slate-700">確認新密碼</span>
            <input
              v-model="passwordForm.confirmPassword"
              type="password"
              class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-amber-400"
              placeholder="再次輸入新密碼"
            >
          </label>

          <div class="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-xs font-bold leading-6 text-slate-500">
            建議密碼至少 6 碼以上，並避免與商家 slug、電話或公開資訊相同。
          </div>
        </div>

        <div class="mt-5 flex justify-end gap-3">
          <button
            type="button"
            class="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            @click="resetPasswordForm"
          >
            清空
          </button>

          <button
            type="button"
            class="rounded-2xl bg-amber-500 px-6 py-3 text-sm font-black text-white transition hover:bg-amber-600 disabled:opacity-60"
            :disabled="savingPassword || !isPasswordAccount"
            @click="changePassword"
          >
            {{ savingPassword ? '修改中...' : '修改密碼' }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
