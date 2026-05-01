<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  registerApi,
  loginApi,
  goGoogleLogin,
  goLineLogin,
  goFacebookLogin
} from '../../api/auth'
import { useAuthStore } from '../../stores/auth'
import BaseToast from '../../components/common/BaseToast.vue'
import { useToast } from '../../composables/useToast'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)
const errorMessage = ref('')
const {
  toast,
  showSuccess,
  showError,
  showInfo,
  closeToast
} = useToast()

const redirectPath = computed(() => {
  const fromQuery = String(route.query.redirect || '')
  const fromStorage = String(localStorage.getItem('loginRedirect') || '')
  const target = fromQuery || fromStorage || ''

  if (!target) return ''

  // 只允許站內路徑，避免外部網址跳轉
  if (!target.startsWith('/')) return ''
  if (target.startsWith('//')) return ''

  // 避免註冊完成後又回登入 / 註冊頁
  if (target.startsWith('/login')) return ''
  if (target.startsWith('/register')) return ''

  return target
})

const saveLogin = ({ token, user }) => {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))

  if (typeof authStore.setToken === 'function') {
    authStore.setToken(token)
  }

  if (typeof authStore.setUser === 'function') {
    authStore.setUser(user)
  } else if (typeof authStore.setLogin === 'function') {
    authStore.setLogin({
      token,
      user
    })
  }
}

const clearLoginRedirect = () => {
  localStorage.removeItem('loginRedirect')
}

const redirectAfterRegister = (user) => {
  const target = redirectPath.value
  const role = String(user?.role || '').toUpperCase()

  clearLoginRedirect()

  if (target) {
    router.push(target)
    return
  }

  if (role === 'ADMIN') {
    router.push('/admin/campaigns')
    return
  }

  router.push('/')
}

const handleRegister = async () => {
  if (loading.value) return

  errorMessage.value = ''

  if (!form.name || !form.email || !form.password || !form.confirmPassword) {
  errorMessage.value = '請完整填寫所有欄位'
  showError('資料不完整', errorMessage.value)
  return
}

  const emailRule = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRule.test(form.email)) {
  errorMessage.value = '請輸入正確的電子信箱格式'
  showError('Email 格式錯誤', errorMessage.value)
  return
}

  if (form.password.length < 6) {
  errorMessage.value = '密碼至少需要 6 碼'
  showError('密碼太短', errorMessage.value)
  return
}

  if (form.password !== form.confirmPassword) {
  errorMessage.value = '兩次輸入的密碼不一致'
  showError('密碼不一致', errorMessage.value)
  return
}

  loading.value = true

  try {
    await registerApi({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password
    })

    const loginRes = await loginApi({
      email: form.email.trim(),
      password: form.password
    })

    const payload = loginRes?.data?.data || {}
    const token = payload.token || payload.accessToken || ''
    const user = payload.user || payload

    if (!token) {
      throw new Error('註冊成功，但自動登入失敗：缺少 token')
    }

    saveLogin({
      token,
      user
    })

    showSuccess('註冊成功', '已自動登入，正在前往指定頁面')

setTimeout(() => {
  redirectAfterRegister(user)
}, 500)
  } catch (error) {
    console.error('註冊失敗:', error)

    errorMessage.value =
  error?.response?.data?.message ||
  error?.message ||
  '註冊失敗，請稍後再試'

showError('註冊失敗', errorMessage.value)
  } finally {
    loading.value = false
  }
}

const saveRedirectBeforeSocialLogin = () => {
  const target = redirectPath.value

  if (target) {
    localStorage.setItem('loginRedirect', target)
  }
}

const handleGoogleRegister = () => {
  showInfo('Google 登入', '正在前往 Google 授權頁面')
  saveRedirectBeforeSocialLogin()

  setTimeout(() => {
    goGoogleLogin()
  }, 300)
}

const handleLineRegister = () => {
  showInfo('LINE 登入', '正在前往 LINE 授權頁面')
  saveRedirectBeforeSocialLogin()

  setTimeout(() => {
    goLineLogin()
  }, 300)
}

const handleFacebookRegister = () => {
  showInfo('Facebook 登入', '正在前往 Facebook 授權頁面')
  saveRedirectBeforeSocialLogin()

  setTimeout(() => {
    goFacebookLogin()
  }, 300)
}

const goLogin = () => {
  const target = redirectPath.value

  if (target) {
    router.push({
      path: '/login',
      query: {
        redirect: target
      }
    })
    return
  }

  router.push('/login')
}

const goHome = () => {
  router.push('/')
}

const socialRegisters = [
  {
    name: 'Facebook',
    label: 'f',
    class: 'bg-[#1877F2] text-white text-2xl font-black',
    action: handleFacebookRegister
  },
  {
    name: 'Google',
    label: 'G',
    class: 'bg-white text-[#4285F4] text-2xl font-black',
    action: handleGoogleRegister
  },
  {
    name: 'LINE',
    label: 'LINE',
    class: 'bg-[#06C755] text-white text-[11px] font-black',
    action: handleLineRegister
  }
]

onMounted(() => {
  if (typeof authStore.restoreLogin === 'function') {
    authStore.restoreLogin()
  }

  if (authStore.isLoggedIn) {
    redirectAfterRegister(authStore.user)
    return
  }

  const target = redirectPath.value

  if (target) {
    localStorage.setItem('loginRedirect', target)
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#4a4a4a] text-white flex items-center justify-center px-6 py-10">
    <div class="w-full max-w-[520px]">
      <div class="w-full">
        <div class="mb-10">
          <div class="mb-5 flex items-center justify-between gap-3">
            <h1 class="text-[26px] font-bold">
              註冊
            </h1>

            <button
              type="button"
              class="rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
              @click="goHome"
            >
              返回首頁
            </button>
          </div>

          <p class="mt-3 text-sm leading-6 text-white/55">
            建立會員帳號後即可參加活動、抽獎並查看我的獎品。
          </p>

          <div
            v-if="redirectPath"
            class="mt-5 rounded-2xl border border-[#8be0cf]/30 bg-[#8be0cf]/10 px-4 py-3 text-sm text-[#b8fff2]"
          >
            註冊成功後會自動登入並返回：{{ redirectPath }}
          </div>
        </div>

        <div class="space-y-10">
          <div>
            <label class="block text-[16px] font-bold mb-3">
              姓名
            </label>

            <input
              v-model.trim="form.name"
              type="text"
              placeholder="請輸入你的姓名"
              class="w-full bg-transparent border-0 border-b border-white/20 px-0 pb-3 pt-1 text-white placeholder:text-white/45 outline-none focus:border-[#7ce0cf]"
            />
          </div>

          <div>
            <label class="block text-[16px] font-bold mb-3">
              電子信箱
            </label>

            <input
              v-model.trim="form.email"
              type="email"
              placeholder="請輸入你的電子信箱"
              class="w-full bg-transparent border-0 border-b border-white/20 px-0 pb-3 pt-1 text-white placeholder:text-white/45 outline-none focus:border-[#7ce0cf]"
            />
          </div>

          <div>
            <label class="block text-[16px] font-bold mb-3">
              設定密碼
            </label>

            <input
              v-model="form.password"
              type="password"
              placeholder="請輸入至少 6 碼密碼"
              class="w-full bg-transparent border-0 border-b border-white/20 px-0 pb-3 pt-1 text-white placeholder:text-white/45 outline-none focus:border-[#7ce0cf]"
            />
          </div>

          <div>
            <label class="block text-[16px] font-bold mb-3">
              確認密碼
            </label>

            <input
              v-model="form.confirmPassword"
              type="password"
              placeholder="請再次輸入密碼"
              class="w-full bg-transparent border-0 border-b border-white/20 px-0 pb-3 pt-1 text-white placeholder:text-white/45 outline-none focus:border-[#7ce0cf]"
              @keyup.enter="handleRegister"
            />
          </div>
        </div>

        <div
          v-if="errorMessage"
          class="mt-5 rounded-2xl border border-rose-300/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
        >
          {{ errorMessage }}
        </div>

        <button
          @click="handleRegister"
          :disabled="loading"
          type="button"
          class="mt-7 w-full rounded-full bg-white/18 text-white/85 py-3.5 text-[16px] font-semibold transition hover:bg-white/22 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {{ loading ? '註冊並登入中...' : '建立帳號並登入' }}
        </button>

        <div class="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div class="text-[15px] font-semibold text-white/90">
            或以其他方式註冊 / 登入
          </div>

          <div class="flex items-center gap-4">
            <button
              v-for="item in socialRegisters"
              :key="item.name"
              @click="item.action"
              type="button"
              class="w-11 h-11 rounded-full flex items-center justify-center shadow hover:scale-105 transition"
              :class="item.class"
              :title="`${item.name} 註冊 / 登入`"
            >
              {{ item.label }}
            </button>
          </div>
        </div>

        <div class="mt-16 text-center text-[15px] text-white/90">
          已經有帳號了
          <button
            @click="goLogin"
            type="button"
            class="ml-2 text-[#8be0cf] font-bold hover:underline"
          >
            登入
          </button>
        </div>
      </div>
    </div>
    <BaseToast
      :show="toast.show"
      :type="toast.type"
      :title="toast.title"
      :message="toast.message"
      :position="toast.position"
      @close="closeToast"
    />
  </div>
</template>