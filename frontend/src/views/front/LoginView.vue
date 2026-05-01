<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
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
  email: '',
  password: ''
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

  // 防止外部網址跳轉，只允許站內路徑
  if (!target.startsWith('/')) return ''
  if (target.startsWith('//')) return ''

  // 避免登入成功後又回登入 / 註冊頁
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

const redirectAfterLogin = (user) => {
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

const handleOAuthResult = () => {
  const token = route.query.token
  const userRaw = route.query.user
  const oauthError = route.query.oauthError

  if (oauthError) {
  errorMessage.value = String(oauthError)
  showError('第三方登入失敗', errorMessage.value)
  return
}

  if (!token || !userRaw) return

  try {
    const user = JSON.parse(String(userRaw))

    saveLogin({
      token: String(token),
      user
    })

    alert('第三方登入成功')
    redirectAfterLogin(user)
showSuccess('第三方登入成功', '歡迎回來')

setTimeout(() => {
  redirectAfterLogin(user)
}, 500)

  } catch (error) {
    console.error('第三方登入資料解析失敗:', error)
    showError('第三方登入失敗', errorMessage.value)
  }
}

const handleLogin = async () => {
  if (loading.value) return

  errorMessage.value = ''

  if (!form.email || !form.password) {
    errorMessage.value = '請輸入電子信箱與密碼'
    return
  }

  loading.value = true

  try {
    const res = await loginApi({
      email: form.email.trim(),
      password: form.password
    })

    const payload = res?.data?.data || {}
    const token = payload.token || payload.accessToken || ''
    const user = payload.user || payload

    if (!token) {
      throw new Error('缺少 token')
    }

    saveLogin({
      token,
      user
    })

    showSuccess('登入成功', '歡迎回來')

setTimeout(() => {
  redirectAfterLogin(user)
}, 500)
  } catch (error) {
    console.error('登入失敗:', error)

    errorMessage.value =
  error?.response?.data?.message ||
  error?.message ||
  '登入失敗，請檢查帳號密碼'

showError('登入失敗', errorMessage.value)
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

const handleGoogleLogin = () => {
  saveRedirectBeforeSocialLogin()
  goGoogleLogin()
}

const handleLineLogin = () => {
  saveRedirectBeforeSocialLogin()
  goLineLogin()
}

const handleFacebookLogin = () => {
  saveRedirectBeforeSocialLogin()
  goFacebookLogin()
}

const goRegister = () => {
  const target = redirectPath.value

  if (target) {
    router.push({
      path: '/register',
      query: {
        redirect: target
      }
    })
    return
  }

  router.push('/register')
}

const goHome = () => {
  router.push('/')
}
const handleForgotPassword = () => {
  showInfo('忘記密碼', '忘記密碼功能可在後續版本串接')
}

const socialLogins = [
  {
    name: 'Facebook',
    label: 'f',
    class: 'bg-[#1877F2] text-white text-2xl font-black',
    action: handleFacebookLogin
  },
  {
    name: 'Google',
    label: 'G',
    class: 'bg-white text-[#4285F4] text-2xl font-black',
    action: handleGoogleLogin
  },
  {
    name: 'LINE',
    label: 'LINE',
    class: 'bg-[#06C755] text-white text-[11px] font-black',
    action: handleLineLogin
  }
]

onMounted(() => {
  if (typeof authStore.restoreLogin === 'function') {
    authStore.restoreLogin()
  }

  if (authStore.isLoggedIn) {
    redirectAfterLogin(authStore.user)
    return
  }

  const target = redirectPath.value

  if (target) {
    localStorage.setItem('loginRedirect', target)
  }

  handleOAuthResult()
})
</script>

<template>
  <div class="min-h-screen bg-[#4a4a4a] text-white flex items-center justify-center px-6 py-10">
    <div class="w-full max-w-[520px]">
      <div class="w-full">
        <div class="mb-10">
          <div class="mb-5 flex items-center justify-between gap-3">
            <h1 class="text-[26px] font-bold">
              登入
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
            登入後即可參加活動、查看我的獎品與兌換碼。
          </p>

          <div
            v-if="redirectPath"
            class="mt-5 rounded-2xl border border-[#8be0cf]/30 bg-[#8be0cf]/10 px-4 py-3 text-sm text-[#b8fff2]"
          >
            登入成功後會自動返回：{{ redirectPath }}
          </div>
        </div>

        <div class="space-y-10">
          <div>
            <label class="block text-[16px] font-bold mb-3">
              電子信箱
            </label>

            <input
              v-model="form.email"
              type="email"
              placeholder="請輸入你註冊的電子信箱"
              class="w-full bg-transparent border-0 border-b border-white/20 px-0 pb-3 pt-1 text-white placeholder:text-white/45 outline-none focus:border-[#7ce0cf]"
            />
          </div>

          <div>
            <label class="block text-[16px] font-bold mb-3">
              輸入密碼
            </label>

            <input
              v-model="form.password"
              type="password"
              placeholder="請輸入密碼"
              class="w-full bg-transparent border-0 border-b border-white/20 px-0 pb-3 pt-1 text-white placeholder:text-white/45 outline-none focus:border-[#7ce0cf]"
              @keyup.enter="handleLogin"
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
          @click="handleLogin"
          :disabled="loading"
          type="button"
          class="mt-7 w-full rounded-full bg-white/18 text-white/85 py-3.5 text-[16px] font-semibold transition hover:bg-white/22 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {{ loading ? '登入中...' : '登入' }}
        </button>

        <div class="mt-3 flex justify-end">
          <button
            type="button"
            class="text-sm text-white/70 hover:text-[#8be0cf] transition"
            @click="handleForgotPassword"
          >
            忘記密碼？
          </button>
        </div>

        <div class="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div class="text-[15px] font-semibold text-white/90">
            或以其他方式登入
          </div>

          <div class="flex items-center gap-4">
            <button
              v-for="item in socialLogins"
              :key="item.name"
              @click="item.action"
              type="button"
              class="w-11 h-11 rounded-full flex items-center justify-center shadow hover:scale-105 transition"
              :class="item.class"
              :title="`${item.name} 登入`"
            >
              {{ item.label }}
            </button>
          </div>
        </div>

        <div class="mt-16 text-center text-[15px] text-white/90">
          建立一個新帳號
          <button
            @click="goRegister"
            type="button"
            class="ml-2 text-[#8be0cf] font-bold hover:underline"
          >
            註冊
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