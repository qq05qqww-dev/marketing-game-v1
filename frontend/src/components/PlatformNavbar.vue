<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import BaseToast from './common/BaseToast.vue'
import BaseConfirmModal from './common/BaseConfirmModal.vue'
import { useToast } from '../composables/useToast'
import { useConfirm } from '../composables/useConfirm'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const mobileMenuOpen = ref(false)

const {
  toast,
  showSuccess,
  closeToast
} = useToast()

const {
  confirmState,
  closeConfirm,
  handleConfirm,
  confirmWarning
} = useConfirm()

const isLoggedIn = computed(() => authStore.isLoggedIn)
const currentUser = computed(() => authStore.user || {})
const role = computed(() => String(currentUser.value?.role || '').toUpperCase())
const isAdmin = computed(() => role.value === 'ADMIN')

const avatarText = computed(() => {
  return String(currentUser.value?.name || currentUser.value?.email || '?').slice(0, 1).toUpperCase()
})

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const goTo = (path) => {
  closeMobileMenu()
  router.push(path)
}

const goHome = () => goTo('/')
const goGames = () => goTo('/games')
const goGameHistory = () => goTo('/game-history')
const goCampaigns = () => goTo('/campaigns')
const goMyRewards = () => goTo('/my-rewards')
const goProfile = () => goTo('/profile')
const goAdmin = () => goTo('/admin/campaigns')
const goLogin = () => goTo('/login')
const goRegister = () => goTo('/register')

const doLogout = async () => {
  authStore.logout()
  closeMobileMenu()

  showSuccess('已登出', '期待下次再見')

  setTimeout(() => {
    router.push('/')
  }, 500)
}

const logout = () => {
  confirmWarning({
    title: '是否確定登出？',
    message: '登出後需要重新登入，才能查看會員中心、我的獎品與參加需要登入的活動。',
    confirmText: '確定登出',
    cancelText: '取消',
    onConfirm: doLogout
  })
}

const isActive = (path) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const navButtonClass = (path) => {
  return isActive(path)
    ? 'bg-slate-900 text-white'
    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
}

const mobileNavButtonClass = (path) => {
  return isActive(path)
    ? 'border-slate-900 bg-slate-900 text-white'
    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
}

onMounted(() => {
  if (typeof authStore.restoreLogin === 'function') {
    authStore.restoreLogin()
  }

  if (authStore.isLoggedIn && typeof authStore.refreshProfile === 'function') {
    authStore.refreshProfile()
  }
})

watch(
  () => route.fullPath,
  () => {
    closeMobileMenu()
  }
)
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
    <div class="mx-auto max-w-7xl px-4 py-4 md:px-6">
      <div class="flex items-center justify-between">
        <!-- Logo -->
        <button
          class="flex items-center gap-3 text-left"
          @click="goHome"
        >
          <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-lg font-black text-white shadow">
            MG
          </div>

          <div>
            <div class="text-lg font-black text-slate-900">
              Multi Game Platform
            </div>
            <div class="text-xs text-slate-500">
              多遊戲互動活動平台
            </div>
          </div>
        </button>

        <!-- Desktop Nav -->
        <nav class="hidden items-center gap-3 lg:flex">
          <button
            @click="goHome"
            class="rounded-xl px-4 py-2 text-sm font-black transition"
            :class="navButtonClass('/')"
          >
            首頁
          </button>

          <button
            @click="goGames"
            class="rounded-xl px-4 py-2 text-sm font-black transition"
            :class="navButtonClass('/games')"
          >
            遊戲入口
          </button>

          <button
            @click="goGameHistory"
            class="rounded-xl px-4 py-2 text-sm font-black transition"
            :class="navButtonClass('/game-history')"
          >
            我的遊戲紀錄
          </button>

          <button
            @click="goCampaigns"
            class="rounded-xl px-4 py-2 text-sm font-black transition"
            :class="navButtonClass('/campaigns')"
          >
            活動列表
          </button>

          <button
            v-if="isLoggedIn"
            @click="goMyRewards"
            class="rounded-xl px-4 py-2 text-sm font-black transition"
            :class="navButtonClass('/my-rewards')"
          >
            我的獎品
          </button>

          <button
            v-if="isLoggedIn"
            @click="goProfile"
            class="rounded-xl px-4 py-2 text-sm font-black transition"
            :class="navButtonClass('/profile')"
          >
            會員中心
          </button>
        </nav>

        <!-- Desktop Actions -->
        <div class="hidden items-center gap-3 lg:flex">
          <button
            v-if="isLoggedIn && currentUser"
            @click="goProfile"
            class="hidden items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-600 transition hover:bg-slate-200 xl:flex"
          >
            <img
              v-if="currentUser.avatarUrl"
              :src="currentUser.avatarUrl"
              alt="avatar"
              class="h-7 w-7 rounded-full object-cover"
            />

            <div
              v-else
              class="flex h-7 w-7 items-center justify-center rounded-full bg-slate-300 text-xs font-black text-slate-700"
            >
              {{ avatarText }}
            </div>

            <div class="text-left">
              <div class="font-black text-slate-800">
                {{ currentUser.name || '會員' }}
              </div>
              <div class="text-[11px] text-slate-500">
                {{ currentUser.authProvider || 'EMAIL' }} / {{ currentUser.memberLevel || 'NORMAL' }}
              </div>
            </div>
          </button>

          <button
            v-if="isAdmin"
            @click="goAdmin"
            class="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            後台管理
          </button>

          <button
            v-if="!isLoggedIn"
            @click="goLogin"
            class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            登入
          </button>

          <button
            v-if="!isLoggedIn"
            @click="goRegister"
            class="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-600"
          >
            註冊
          </button>

          <button
            v-else
            @click="logout"
            class="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-600"
          >
            登出
          </button>
        </div>

        <!-- Mobile Toggle -->
        <button
          type="button"
          class="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-2xl font-black text-slate-800 shadow-sm transition hover:bg-slate-50 lg:hidden"
          @click="toggleMobileMenu"
        >
          <span v-if="!mobileMenuOpen">☰</span>
          <span v-else>×</span>
        </button>
      </div>

      <!-- Mobile Menu -->
      <div
        v-if="mobileMenuOpen"
        class="mt-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-xl lg:hidden"
      >
        <!-- User Card -->
        <div
          v-if="isLoggedIn"
          class="mb-4 rounded-3xl border border-slate-200 bg-slate-50 p-4"
        >
          <div class="flex items-center gap-3">
            <img
              v-if="currentUser.avatarUrl"
              :src="currentUser.avatarUrl"
              alt="avatar"
              class="h-12 w-12 rounded-2xl object-cover"
            />

            <div
              v-else
              class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-lg font-black text-white"
            >
              {{ avatarText }}
            </div>

            <div class="min-w-0">
              <div class="truncate text-base font-black text-slate-900">
                {{ currentUser.name || '會員' }}
              </div>
              <div class="truncate text-xs font-bold text-slate-500">
                {{ currentUser.email || '尚未取得 Email' }}
              </div>
              <div class="mt-1 text-xs font-black text-slate-500">
                {{ currentUser.authProvider || 'EMAIL' }} / {{ currentUser.memberLevel || 'NORMAL' }} / {{ currentUser.role || 'USER' }}
              </div>
            </div>
          </div>
        </div>

        <div
          v-else
          class="mb-4 rounded-3xl border border-blue-100 bg-blue-50 p-4"
        >
          <div class="text-base font-black text-blue-800">
            尚未登入
          </div>
          <div class="mt-1 text-sm text-blue-700">
            登入後可查看我的獎品與會員中心。
          </div>
        </div>

        <!-- Links -->
        <div class="grid gap-3">
          <button
            @click="goHome"
            class="rounded-2xl border px-5 py-4 text-left text-base font-black transition"
            :class="mobileNavButtonClass('/')"
          >
            🏠 首頁
          </button>

          <button
            @click="goGames"
            class="rounded-2xl border px-5 py-4 text-left text-base font-black transition"
            :class="mobileNavButtonClass('/games')"
          >
            🕹️ 遊戲入口
          </button>

          <button
            @click="goGameHistory"
            class="rounded-2xl border px-5 py-4 text-left text-base font-black transition"
            :class="mobileNavButtonClass('/game-history')"
          >
            📋 我的遊戲紀錄
          </button>

          <button
            @click="goCampaigns"
            class="rounded-2xl border px-5 py-4 text-left text-base font-black transition"
            :class="mobileNavButtonClass('/campaigns')"
          >
            🎮 活動列表
          </button>

          <button
            v-if="isLoggedIn"
            @click="goMyRewards"
            class="rounded-2xl border px-5 py-4 text-left text-base font-black transition"
            :class="mobileNavButtonClass('/my-rewards')"
          >
            🎁 我的獎品
          </button>

          <button
            v-if="isLoggedIn"
            @click="goProfile"
            class="rounded-2xl border px-5 py-4 text-left text-base font-black transition"
            :class="mobileNavButtonClass('/profile')"
          >
            👤 會員中心
          </button>

          <button
            v-if="isAdmin"
            @click="goAdmin"
            class="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-left text-base font-black text-white transition hover:bg-slate-800"
          >
            🛠️ 後台管理
          </button>
        </div>

        <!-- Auth Actions -->
        <div class="mt-4 grid gap-3 border-t border-slate-100 pt-4">
          <button
            v-if="!isLoggedIn"
            @click="goLogin"
            class="rounded-2xl bg-slate-900 px-5 py-4 text-base font-black text-white transition hover:bg-slate-800"
          >
            登入
          </button>

          <button
            v-if="!isLoggedIn"
            @click="goRegister"
            class="rounded-2xl bg-emerald-500 px-5 py-4 text-base font-black text-white transition hover:bg-emerald-600"
          >
            註冊
          </button>

          <button
            v-if="isLoggedIn"
            @click="logout"
            class="rounded-2xl bg-amber-500 px-5 py-4 text-base font-black text-white transition hover:bg-amber-600"
          >
            登出
          </button>
        </div>
      </div>
    </div>

    <BaseConfirmModal
      :show="confirmState.show"
      :title="confirmState.title"
      :message="confirmState.message"
      :confirmText="confirmState.confirmText"
      :cancelText="confirmState.cancelText"
      :type="confirmState.type"
      :loading="confirmState.loading"
      @confirm="handleConfirm"
      @cancel="closeConfirm"
      @close="closeConfirm"
    />

    <BaseToast
      :show="toast.show"
      :type="toast.type"
      :title="toast.title"
      :message="toast.message"
      :position="toast.position"
      @close="closeToast"
    />
  </header>
</template>