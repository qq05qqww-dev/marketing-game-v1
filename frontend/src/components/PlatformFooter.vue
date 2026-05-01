<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isLoggedIn = computed(() => authStore.isLoggedIn)
const currentUser = computed(() => authStore.user || {})
const isAdmin = computed(() => String(currentUser.value?.role || '').toUpperCase() === 'ADMIN')

const year = new Date().getFullYear()

const goTo = (path) => {
  router.push(path)
}

const quickLinks = [
  {
    label: '首頁',
    path: '/',
    emoji: '🏠'
  },
  {
    label: '遊戲入口',
    path: '/games',
    emoji: '🕹️'
  },
  {
    label: '活動列表',
    path: '/campaigns',
    emoji: '🎮'
  }
]

const memberLinks = computed(() => {
  if (!isLoggedIn.value) {
    return [
      {
        label: '會員登入',
        path: '/login',
        emoji: '🔐'
      },
      {
        label: '會員註冊',
        path: '/register',
        emoji: '📝'
      }
    ]
  }

  return [
    {
      label: '我的獎品',
      path: '/my-rewards',
      emoji: '🎁'
    },
    {
      label: '會員中心',
      path: '/profile',
      emoji: '👤'
    }
  ]
})

const adminLinks = [
  {
    label: '後台管理',
    path: '/admin/campaigns',
    emoji: '🛠️'
  },
  {
    label: '報表中心',
    path: '/admin/reports',
    emoji: '📊'
  },
  {
    label: '發獎核銷',
    path: '/admin/rewards',
    emoji: '✅'
  }
]
</script>

<template>
  <footer class="border-t border-slate-200 bg-white">
    <div class="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div class="grid gap-8 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <!-- Brand -->
        <div>
          <button
            class="flex items-center gap-3 text-left"
            @click="goTo('/')"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-lg font-black text-white shadow">
              MG
            </div>

            <div>
              <div class="text-xl font-black text-slate-900">
                Multi Game Platform
              </div>
              <div class="text-sm text-slate-500">
                多遊戲互動活動平台
              </div>
            </div>
          </button>

          <p class="mt-5 max-w-md text-sm leading-7 text-slate-500">
            整合輪盤、翻牌、九宮格、刮刮樂，支援會員登入、獎項管理、發獎核銷與報表查詢。
          </p>

          <div class="mt-5 flex flex-wrap gap-2">
            <span class="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
              V2.1 Stable
            </span>

            <span class="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
              4 Games Online
            </span>
          </div>
        </div>

        <!-- Quick Links -->
        <div>
          <h3 class="text-sm font-black uppercase tracking-wider text-slate-900">
            快速連結
          </h3>

          <div class="mt-4 grid gap-3">
            <button
              v-for="item in quickLinks"
              :key="item.path"
              @click="goTo(item.path)"
              class="text-left text-sm font-bold text-slate-500 transition hover:text-slate-900"
            >
              {{ item.emoji }} {{ item.label }}
            </button>
          </div>
        </div>

        <!-- Member Links -->
        <div>
          <h3 class="text-sm font-black uppercase tracking-wider text-slate-900">
            會員功能
          </h3>

          <div class="mt-4 grid gap-3">
            <button
              v-for="item in memberLinks"
              :key="item.path"
              @click="goTo(item.path)"
              class="text-left text-sm font-bold text-slate-500 transition hover:text-slate-900"
            >
              {{ item.emoji }} {{ item.label }}
            </button>
          </div>

          <div
            v-if="isLoggedIn"
            class="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <p class="text-xs font-bold text-slate-400">
              目前登入
            </p>
            <p class="mt-1 truncate text-sm font-black text-slate-800">
              {{ currentUser.name || '會員' }}
            </p>
            <p class="mt-1 truncate text-xs text-slate-500">
              {{ currentUser.authProvider || 'EMAIL' }} / {{ currentUser.memberLevel || 'NORMAL' }}
            </p>
          </div>
        </div>

        <!-- Admin Links -->
        <div>
          <h3 class="text-sm font-black uppercase tracking-wider text-slate-900">
            後台營運
          </h3>

          <div
            v-if="isAdmin"
            class="mt-4 grid gap-3"
          >
            <button
              v-for="item in adminLinks"
              :key="item.path"
              @click="goTo(item.path)"
              class="text-left text-sm font-bold text-slate-500 transition hover:text-slate-900"
            >
              {{ item.emoji }} {{ item.label }}
            </button>
          </div>

          <div
            v-else
            class="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-500"
          >
            後台入口僅管理員帳號顯示。
          </div>
        </div>
      </div>

      <div class="mt-10 border-t border-slate-100 pt-6">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p class="text-sm text-slate-400">
            © {{ year }} Multi Game Platform. All rights reserved.
          </p>

          <div class="flex flex-wrap gap-2 text-xs font-bold text-slate-400">
            <span>WHEEL</span>
            <span>/</span>
            <span>FLIP</span>
            <span>/</span>
            <span>GRID</span>
            <span>/</span>
            <span>SCRATCH</span>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>