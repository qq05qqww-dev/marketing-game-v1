<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const role = computed(() => String(authStore.user?.role || '').toUpperCase())
const tenantName = computed(() => authStore.user?.tenantName || authStore.user?.tenant?.name || '')
const tenantSlug = computed(() => authStore.user?.tenantSlug || authStore.user?.tenant?.slug || '')
const userName = computed(() => authStore.user?.name || authStore.user?.email || '管理員')

const isPlatformAdmin = computed(() => ['ADMIN', 'SUPER_ADMIN'].includes(role.value))
const isMerchantAdmin = computed(() => role.value === 'MERCHANT_ADMIN')
const isMerchantStaff = computed(() => role.value === 'MERCHANT_STAFF')

const roleLabel = computed(() => {
  const map = {
    ADMIN: '平台總管理員',
    SUPER_ADMIN: '平台總管理員',
    MERCHANT_ADMIN: '商家管理員',
    MERCHANT_STAFF: '商家員工',
    USER: '一般會員'
  }

  return map[role.value] || role.value || '未登入'
})

const scopeLabel = computed(() => {
  if (isPlatformAdmin.value) return '全部商家 / 平台層級'
  if (tenantName.value) return tenantName.value
  if (tenantSlug.value) return tenantSlug.value
  return '尚未綁定商家'
})

const menuItems = computed(() => {
  const items = [
    {
      label: '商家管理',
      description: '平台商家列表',
      to: '/admin/tenants',
      icon: '🏢',
      roles: ['ADMIN', 'SUPER_ADMIN']
    },
    {
      label: '活動管理',
      description: '平台活動',
      to: '/admin/campaigns',
      icon: '📣',
      roles: ['ADMIN', 'SUPER_ADMIN']
    },
    {
      label: '遊戲設定',
      description: '遊戲模組',
      to: '/admin/game-settings',
      icon: '🎮',
      roles: ['ADMIN', 'SUPER_ADMIN']
    },
    {
      label: '獎項管理',
      description: '獎品庫',
      to: '/admin/prizes',
      icon: '🎁',
      roles: ['ADMIN', 'SUPER_ADMIN']
    },
    {
      label: '砸金蛋後台',
      description: '活動營運',
      to: '/admin/golden-egg',
      icon: '🥚',
      roles: ['ADMIN', 'SUPER_ADMIN', 'MERCHANT_ADMIN', 'MERCHANT_STAFF']
    },
    {
      label: '報表中心',
      description: '營運數據',
      to: '/admin/reports',
      icon: '📊',
      roles: ['ADMIN', 'SUPER_ADMIN', 'MERCHANT_ADMIN']
    },
    {
      label: '發獎核銷',
      description: '獎品處理',
      to: '/admin/rewards',
      icon: '✅',
      roles: ['ADMIN', 'SUPER_ADMIN', 'MERCHANT_ADMIN', 'MERCHANT_STAFF']
    },
    {
      label: '會員管理',
      description: '平台會員',
      to: '/admin/users',
      icon: '👥',
      roles: ['ADMIN', 'SUPER_ADMIN']
    },
    {
      label: '活動樣式',
      description: '視覺編輯',
      to: '/admin/campaign-style',
      icon: '🎨',
      roles: ['ADMIN', 'SUPER_ADMIN']
    },
    {
      label: '遊戲預覽',
      description: '前台預覽',
      to: '/admin/game-preview',
      icon: '👁️',
      roles: ['ADMIN', 'SUPER_ADMIN']
    },
    {
      label: '系統狀態',
      description: '版本資訊',
      to: '/admin/system-status',
      icon: '🛠️',
      roles: ['ADMIN', 'SUPER_ADMIN']
    }
  ]

  return items.filter((item) => item.roles.includes(role.value))
})

const isActive = (item) => {
  return route.path === item.to || route.path.startsWith(`${item.to}/`)
}

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 text-slate-900">
    <aside class="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-200 bg-white/95 shadow-sm backdrop-blur xl:block">
      <div class="flex h-full flex-col">
        <div class="border-b border-slate-100 p-5">
          <RouterLink
            to="/"
            class="flex items-center gap-3"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white">
              MG
            </div>
            <div>
              <p class="text-sm font-black text-slate-950">
                Multi Game
              </p>
              <p class="text-xs font-bold text-slate-400">
                Admin Console
              </p>
            </div>
          </RouterLink>

          <div class="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              CURRENT SCOPE
            </p>
            <p class="mt-2 text-sm font-black text-slate-950">
              {{ scopeLabel }}
            </p>
            <p
              v-if="tenantSlug && !isPlatformAdmin"
              class="mt-1 text-xs font-bold text-slate-500"
            >
              /{{ tenantSlug }}
            </p>
            <span class="mt-3 inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
              {{ roleLabel }}
            </span>
          </div>
        </div>

        <nav class="flex-1 space-y-2 overflow-y-auto p-4">
          <RouterLink
            v-for="item in menuItems"
            :key="item.to"
            :to="item.to"
            class="group flex items-center gap-3 rounded-3xl border px-4 py-3 transition"
            :class="isActive(item)
              ? 'border-slate-900 bg-slate-950 text-white shadow-sm'
              : 'border-transparent bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50'"
          >
            <span class="text-xl">{{ item.icon }}</span>
            <span class="min-w-0">
              <span class="block text-sm font-black">{{ item.label }}</span>
              <span
                class="block truncate text-xs font-bold"
                :class="isActive(item) ? 'text-slate-300' : 'text-slate-400'"
              >
                {{ item.description }}
              </span>
            </span>
          </RouterLink>
        </nav>

        <div class="border-t border-slate-100 p-4">
          <div class="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-sm font-black text-slate-950">
              {{ userName }}
            </p>
            <p class="mt-1 text-xs font-bold text-slate-500">
              {{ roleLabel }}
            </p>
            <button
              type="button"
              class="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-100"
              @click="logout"
            >
              登出
            </button>
          </div>
        </div>
      </div>
    </aside>

    <div class="xl:pl-72">
      <header class="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur xl:hidden">
        <div class="flex items-center justify-between gap-3">
          <RouterLink
            to="/admin"
            class="flex items-center gap-2"
          >
            <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
              MG
            </div>
            <div>
              <p class="text-sm font-black">後台管理</p>
              <p class="text-xs font-bold text-slate-400">{{ scopeLabel }}</p>
            </div>
          </RouterLink>

          <button
            type="button"
            class="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600"
            @click="logout"
          >
            登出
          </button>
        </div>

        <div class="mt-3 flex gap-2 overflow-x-auto pb-1">
          <RouterLink
            v-for="item in menuItems"
            :key="item.to"
            :to="item.to"
            class="shrink-0 rounded-full border px-3 py-2 text-xs font-black"
            :class="isActive(item)
              ? 'border-slate-950 bg-slate-950 text-white'
              : 'border-slate-200 bg-white text-slate-600'"
          >
            {{ item.icon }} {{ item.label }}
          </RouterLink>
        </div>
      </header>

      <main class="min-h-screen">
        <RouterView />
      </main>
    </div>
  </div>
</template>
