<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isMobileMenuOpen = ref(false)

const currentTitle = computed(() => {
  return route.meta?.title || '後台管理中心'
})

const currentUser = computed(() => {
  return authStore.user || {
    name: 'Admin',
    email: 'admin@example.com',
    role: 'ADMIN'
  }
})

const currentRole = computed(() => String(currentUser.value?.role || 'ADMIN').toUpperCase())

const roleLabel = computed(() => {
  const map = {
    ADMIN: '平台總管理員',
    SUPER_ADMIN: '平台總管理員',
    MERCHANT_ADMIN: '商家管理員',
    MERCHANT_STAFF: '商家員工',
    USER: '一般會員'
  }

  return map[currentRole.value] || currentRole.value
})

const tenantLabel = computed(() => {
  if (['ADMIN', 'SUPER_ADMIN'].includes(currentRole.value)) {
    return '全部商家 / 平台層級'
  }

  return currentUser.value?.tenantName || currentUser.value?.tenant?.name || '未綁定商家'
})

const tenantSlugLabel = computed(() => {
  if (['ADMIN', 'SUPER_ADMIN'].includes(currentRole.value)) {
    return 'all-tenants'
  }

  return currentUser.value?.tenantSlug || currentUser.value?.tenant?.slug || 'no-tenant'
})

const PLATFORM_ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN']
const MERCHANT_ADMIN_ROLES = ['MERCHANT_ADMIN']
const MERCHANT_STAFF_ROLES = ['MERCHANT_STAFF']
const BACKEND_ADMIN_ROLES = [
  ...PLATFORM_ADMIN_ROLES,
  ...MERCHANT_ADMIN_ROLES,
  ...MERCHANT_STAFF_ROLES
]

const canAccessRoles = (roles = BACKEND_ADMIN_ROLES) => {
  return roles.includes(currentRole.value)
}

const adminNavGroups = [
  {
    title: '平台管理',
    items: [
      {
        label: '活動管理',
        path: '/admin/campaigns',
        icon: '📋',
        desc: '建立與管理全部活動',
        roles: PLATFORM_ADMIN_ROLES
      },
      {
        label: '獎項管理',
        path: '/admin/prizes',
        icon: '🎁',
        desc: '管理平台獎品',
        roles: PLATFORM_ADMIN_ROLES
      },
      {
        label: '會員管理',
        path: '/admin/users',
        icon: '👥',
        desc: '管理會員資料',
        roles: PLATFORM_ADMIN_ROLES
      }
    ]
  },
  {
    title: '商家營運',
    items: [
      {
        label: '砸金蛋後台',
        path: '/admin/golden-egg',
        icon: '🥚',
        desc: '活動設定 / 序號 / 紀錄',
        badge: 'V2.3',
        roles: BACKEND_ADMIN_ROLES
      },
      {
        label: '報表中心',
        path: '/admin/reports',
        icon: '📊',
        desc: '查看活動數據',
        roles: [...PLATFORM_ADMIN_ROLES, ...MERCHANT_ADMIN_ROLES]
      },
      {
        label: '發獎核銷',
        path: '/admin/rewards',
        icon: '✅',
        desc: '核銷中獎紀錄',
        roles: BACKEND_ADMIN_ROLES
      }
    ]
  },
  {
    title: '進階工具',
    items: [
      {
        label: '遊戲設定管理',
        path: '/admin/game-settings',
        icon: '🎮',
        desc: '管理遊戲模板',
        roles: PLATFORM_ADMIN_ROLES
      },
      {
        label: '活動樣式編輯器',
        path: '/admin/campaign-style',
        icon: '🎨',
        desc: '調整活動視覺',
        roles: PLATFORM_ADMIN_ROLES
      },
      {
        label: '遊戲預覽中心',
        path: '/admin/game-preview',
        icon: '📱',
        desc: '查看前台效果',
        roles: PLATFORM_ADMIN_ROLES
      },
      {
        label: '系統狀態',
        path: '/admin/system-status',
        icon: '🧩',
        desc: '版本與環境資訊',
        roles: PLATFORM_ADMIN_ROLES
      }
    ]
  }
]

const visibleAdminNavGroups = computed(() => {
  return adminNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessRoles(item.roles))
    }))
    .filter((group) => group.items.length > 0)
})

const flatNavItems = computed(() => {
  return visibleAdminNavGroups.value.flatMap((group) => group.items)
})

const currentNavItem = computed(() => {
  return flatNavItems.value.find((item) => isActivePath(item.path)) || null
})

const isActivePath = (path) => {
  if (!path) return false

  if (path === '/admin/campaigns') {
    return route.path === '/admin' || route.path === '/admin/campaigns'
  }

  return route.path === path || route.path.startsWith(`${path}/`)
}

const navButtonClass = (path) => {
  return isActivePath(path)
    ? 'border-yellow-300 bg-yellow-50 text-yellow-700 shadow-sm'
    : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900'
}

const goPath = (path) => {
  if (!path) return

  router.push(path)
  isMobileMenuOpen.value = false
}

const goHome = () => {
  router.push('/')
}

const goGames = () => {
  router.push('/games')
}

const goGoldenEggFront = () => {
  router.push('/games/golden-egg')
}

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-slate-100">
    <!-- Mobile top bar -->
    <header class="sticky top-0 z-40 border-b border-slate-200 bg-white/92 shadow-sm backdrop-blur-xl lg:hidden">
      <div class="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          class="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-xl font-black text-slate-700"
          @click="isMobileMenuOpen = true"
        >
          ☰
        </button>

        <div class="text-center">
          <p class="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
            Admin
          </p>
          <h1 class="text-base font-black text-slate-900">
            {{ currentTitle }}
          </h1>
        </div>

        <button
          type="button"
          class="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-100 text-xl font-black text-yellow-700"
          @click="goGoldenEggFront"
        >
          🥚
        </button>
      </div>
    </header>

    <!-- Mobile drawer -->
    <transition name="admin-drawer-fade">
      <div
        v-if="isMobileMenuOpen"
        class="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm lg:hidden"
        @click.self="isMobileMenuOpen = false"
      >
        <aside class="h-full w-[86vw] max-w-sm overflow-y-auto bg-white p-4 shadow-2xl">
          <div class="mb-5 flex items-center justify-between">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.22em] text-yellow-600">
                Multi Game Platform
              </p>
              <h2 class="text-xl font-black text-slate-900">
                後台管理中心
              </h2>
              <p class="mt-1 text-xs font-bold text-slate-500">
                {{ roleLabel }}｜{{ tenantLabel }}
              </p>
            </div>

            <button
              type="button"
              class="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-xl font-black text-slate-600"
              @click="isMobileMenuOpen = false"
            >
              ×
            </button>
          </div>

          <div class="space-y-5">
            <section
              v-for="group in visibleAdminNavGroups"
              :key="group.title"
            >
              <p class="mb-2 px-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                {{ group.title }}
              </p>

              <div class="space-y-2">
                <button
                  v-for="item in group.items"
                  :key="item.path"
                  type="button"
                  class="flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition"
                  :class="navButtonClass(item.path)"
                  @click="goPath(item.path)"
                >
                  <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                    {{ item.icon }}
                  </span>

                  <span class="min-w-0 flex-1">
                    <span class="flex items-center gap-2 text-sm font-black">
                      {{ item.label }}
                      <span
                        v-if="item.badge"
                        class="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white"
                      >
                        {{ item.badge }}
                      </span>
                    </span>
                    <span class="mt-0.5 block text-xs font-bold opacity-70">
                      {{ item.desc }}
                    </span>
                  </span>
                </button>
              </div>
            </section>
          </div>
        </aside>
      </div>
    </transition>

    <div class="grid min-h-screen lg:grid-cols-[290px_minmax(0,1fr)]">
      <!-- Desktop sidebar -->
      <aside class="hidden border-r border-slate-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div class="border-b border-slate-100 p-5">
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-yellow-300 to-orange-500 text-xl font-black text-red-800 shadow-sm">
              MG
            </div>

            <div>
              <p class="text-xs font-black uppercase tracking-[0.22em] text-yellow-600">
                V2.3 Tenant
              </p>
              <h1 class="text-lg font-black text-slate-900">
                後台管理中心
              </h1>
            </div>
          </div>
        </div>

        <nav class="flex-1 space-y-5 overflow-y-auto px-4 py-5">
          <section
            v-for="group in visibleAdminNavGroups"
            :key="group.title"
          >
            <p class="mb-2 px-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              {{ group.title }}
            </p>

            <div class="space-y-2">
              <button
                v-for="item in group.items"
                :key="item.path"
                type="button"
                class="flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition"
                :class="navButtonClass(item.path)"
                @click="goPath(item.path)"
              >
                <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                  {{ item.icon }}
                </span>

                <span class="min-w-0 flex-1">
                  <span class="flex items-center gap-2 text-sm font-black">
                    {{ item.label }}
                    <span
                      v-if="item.badge"
                      class="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white"
                    >
                      {{ item.badge }}
                    </span>
                  </span>
                  <span class="mt-0.5 block text-xs font-bold opacity-70">
                    {{ item.desc }}
                  </span>
                </span>
              </button>
            </div>
          </section>
        </nav>

        <div class="border-t border-slate-100 p-4">
          <div class="mb-3 rounded-3xl bg-slate-50 p-4">
            <p class="text-xs font-bold text-slate-400">
              目前登入
            </p>
            <p class="mt-1 line-clamp-1 text-sm font-black text-slate-900">
              {{ currentUser.name || currentUser.email || 'Admin' }}
            </p>
            <p class="mt-0.5 line-clamp-1 text-xs font-bold text-slate-500">
              {{ roleLabel }}
            </p>
            <div class="mt-3 rounded-2xl border border-yellow-100 bg-white px-3 py-2">
              <p class="text-[11px] font-black uppercase tracking-[0.16em] text-yellow-600">
                Tenant
              </p>
              <p class="mt-1 line-clamp-1 text-xs font-black text-slate-800">
                {{ tenantLabel }}
              </p>
              <p class="mt-0.5 line-clamp-1 text-[11px] font-bold text-slate-400">
                {{ tenantSlugLabel }}
              </p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-200"
              @click="goHome"
            >
              首頁
            </button>

            <button
              type="button"
              class="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-200"
              @click="goGames"
            >
              遊戲
            </button>

            <button
              type="button"
              class="col-span-2 rounded-2xl bg-yellow-400 px-3 py-2 text-xs font-black text-red-700 transition hover:bg-yellow-300"
              @click="goGoldenEggFront"
            >
              開啟砸金蛋前台
            </button>

            <button
              type="button"
              class="col-span-2 rounded-2xl bg-slate-900 px-3 py-2 text-xs font-black text-white transition hover:bg-slate-800"
              @click="logout"
            >
              登出
            </button>
          </div>
        </div>
      </aside>

      <!-- Main content -->
      <section class="min-w-0">
        <div class="hidden border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur-xl lg:block">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                {{ currentNavItem?.label || 'Admin Page' }}
              </p>
              <h2 class="text-2xl font-black text-slate-900">
                {{ currentTitle }}
              </h2>
              <div class="mt-2 flex flex-wrap items-center gap-2">
                <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                  {{ roleLabel }}
                </span>
                <span class="rounded-full bg-yellow-50 px-3 py-1 text-xs font-black text-yellow-700 ring-1 ring-yellow-100">
                  {{ tenantLabel }}
                </span>
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded-2xl bg-yellow-400 px-4 py-2 text-sm font-black text-red-700 shadow-sm transition hover:bg-yellow-300"
                @click="goPath('/admin/golden-egg')"
              >
                砸金蛋後台
              </button>

              <button
                type="button"
                class="rounded-2xl bg-white px-4 py-2 text-sm font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                @click="goGoldenEggFront"
              >
                砸金蛋前台
              </button>
            </div>
          </div>
        </div>

        <RouterView />
      </section>
    </div>
  </div>
</template>

<style scoped>
.admin-drawer-fade-enter-active,
.admin-drawer-fade-leave-active {
  transition: opacity 0.2s ease;
}

.admin-drawer-fade-enter-from,
.admin-drawer-fade-leave-to {
  opacity: 0;
}
</style>
