<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { getUsersApi, updateUserMemberLevelApi } from '../../api/campaign'

const loading = ref(false)
const actionLoadingId = ref(null)

const users = ref([])
const keyword = ref('')
const roleFilter = ref('')
const memberLevelFilter = ref('')
const authProviderFilter = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const totalPages = ref(1)

const fetchUsers = async () => {
  loading.value = true

  try {
    const res = await getUsersApi({
      keyword: keyword.value,
      role: roleFilter.value,
      memberLevel: memberLevelFilter.value,
      authProvider: authProviderFilter.value,
      page: page.value,
      pageSize: pageSize.value
    })

    users.value = Array.isArray(res?.data?.data) ? res.data.data : []

    const pagination = res?.data?.pagination || {}

    total.value = Number(pagination.total || 0)
    totalPages.value = Number(pagination.totalPages || 1)
    page.value = Number(pagination.page || page.value || 1)
    pageSize.value = Number(pagination.pageSize || pageSize.value || 10)
  } catch (error) {
    console.error('取得會員列表失敗:', error)
    alert(error?.response?.data?.message || '取得會員列表失敗')
    users.value = []
    total.value = 0
    totalPages.value = 1
  } finally {
    loading.value = false
  }
}

const searchUsers = async () => {
  page.value = 1
  await fetchUsers()
}

const resetFilters = async () => {
  keyword.value = ''
  roleFilter.value = ''
  memberLevelFilter.value = ''
  authProviderFilter.value = ''
  page.value = 1
  await fetchUsers()
}

const updateMemberLevel = async (user, memberLevel) => {
  if (!user?.id) return

  const ok = window.confirm(
    `確定要把「${user.name || user.email}」會員等級改成 ${memberLevel} 嗎？`
  )

  if (!ok) return

  actionLoadingId.value = user.id

  try {
    await updateUserMemberLevelApi(user.id, {
      memberLevel
    })

    alert('會員等級更新成功')
    await fetchUsers()
  } catch (error) {
    console.error('更新會員等級失敗:', error)
    alert(error?.response?.data?.message || '更新會員等級失敗')
  } finally {
    actionLoadingId.value = null
  }
}

const prevPage = async () => {
  if (page.value <= 1) return
  page.value -= 1
  await fetchUsers()
}

const nextPage = async () => {
  if (page.value >= totalPages.value) return
  page.value += 1
  await fetchUsers()
}

const formatDateTime = (value) => {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value).replace('T', ' ').slice(0, 16)
  }

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}

const getRoleClass = (role) => {
  if (String(role || '').toUpperCase() === 'ADMIN') {
    return 'border-rose-200 bg-rose-50 text-rose-700'
  }

  return 'border-blue-200 bg-blue-50 text-blue-700'
}

const getLevelClass = (level) => {
  if (String(level || '').toUpperCase() === 'VIP') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  return 'border-slate-200 bg-slate-50 text-slate-700'
}

const getAuthProviderMeta = (provider) => {
  const value = String(provider || 'EMAIL').toUpperCase()

  if (value === 'GOOGLE') {
    return {
      label: 'Google',
      emoji: 'G',
      class: 'border-blue-200 bg-white text-blue-600'
    }
  }

  if (value === 'LINE') {
    return {
      label: 'LINE',
      emoji: 'LINE',
      class: 'border-emerald-200 bg-emerald-50 text-emerald-700'
    }
  }

  if (value === 'FACEBOOK') {
    return {
      label: 'Facebook',
      emoji: 'f',
      class: 'border-blue-200 bg-blue-50 text-blue-700'
    }
  }

  return {
    label: 'Email',
    emoji: '@',
    class: 'border-slate-200 bg-slate-50 text-slate-700'
  }
}

const getCardClass = (user) => {
  const provider = String(user?.authProvider || 'EMAIL').toUpperCase()

  if (provider === 'GOOGLE') {
    return 'border-blue-200 bg-gradient-to-br from-blue-50 via-white to-white'
  }

  if (provider === 'LINE') {
    return 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white'
  }

  if (String(user?.memberLevel || '').toUpperCase() === 'VIP') {
    return 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white'
  }

  if (String(user?.role || '').toUpperCase() === 'ADMIN') {
    return 'border-rose-200 bg-gradient-to-br from-rose-50 via-white to-white'
  }

  return 'border-slate-200 bg-white'
}

const currentPageStart = computed(() => {
  if (total.value === 0) return 0
  return (page.value - 1) * pageSize.value + 1
})

const currentPageEnd = computed(() => {
  const end = page.value * pageSize.value
  return Math.min(end, total.value)
})

const emailCount = computed(() => {
  return users.value.filter((user) => String(user.authProvider || 'EMAIL').toUpperCase() === 'EMAIL').length
})

const googleCount = computed(() => {
  return users.value.filter((user) => String(user.authProvider || '').toUpperCase() === 'GOOGLE').length
})

const lineCount = computed(() => {
  return users.value.filter((user) => String(user.authProvider || '').toUpperCase() === 'LINE').length
})

const vipCount = computed(() => {
  return users.value.filter((user) => String(user.memberLevel || '').toUpperCase() === 'VIP').length
})

watch(pageSize, async () => {
  page.value = 1
  await fetchUsers()
})

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div class="space-y-8">
    <!-- 統計卡 -->
    <section class="grid grid-cols-2 gap-4 md:grid-cols-5">
      <div class="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm">
        <p class="text-xs font-bold text-slate-400">
          目前查詢總數
        </p>
        <p class="mt-2 text-3xl font-black text-slate-900">
          {{ total }}
        </p>
      </div>

      <div class="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-center shadow-sm">
        <p class="text-xs font-bold text-slate-400">
          本頁 Email
        </p>
        <p class="mt-2 text-3xl font-black text-slate-800">
          {{ emailCount }}
        </p>
      </div>

      <div class="rounded-3xl border border-blue-100 bg-blue-50 p-5 text-center shadow-sm">
        <p class="text-xs font-bold text-blue-500">
          本頁 Google
        </p>
        <p class="mt-2 text-3xl font-black text-blue-700">
          {{ googleCount }}
        </p>
      </div>

      <div class="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 text-center shadow-sm">
        <p class="text-xs font-bold text-emerald-500">
          本頁 LINE
        </p>
        <p class="mt-2 text-3xl font-black text-emerald-700">
          {{ lineCount }}
        </p>
      </div>

      <div class="rounded-3xl border border-amber-100 bg-amber-50 p-5 text-center shadow-sm">
        <p class="text-xs font-bold text-amber-500">
          本頁 VIP
        </p>
        <p class="mt-2 text-3xl font-black text-amber-700">
          {{ vipCount }}
        </p>
      </div>
    </section>

    <!-- 篩選 -->
    <section class="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
      <div class="mb-6 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="text-sm font-black text-fuchsia-600">
            Member Operation Center
          </p>

          <h2 class="mt-1 text-3xl font-black text-slate-900">
            會員管理
          </h2>

          <p class="mt-2 text-sm text-slate-500">
            可查看會員來源、社群登入帳號、角色與會員等級。
          </p>
        </div>

        <button
          @click="fetchUsers"
          class="rounded-2xl bg-slate-900 px-6 py-3 font-black text-white transition hover:bg-slate-800"
        >
          重新整理
        </button>
      </div>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-7">
        <div class="xl:col-span-2">
          <label class="mb-2 block text-sm font-bold text-slate-700">
            關鍵字
          </label>
          <input
            v-model="keyword"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-fuchsia-500"
            placeholder="搜尋姓名或 Email"
            @keyup.enter="searchUsers"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">
            角色
          </label>
          <select
            v-model="roleFilter"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-fuchsia-500"
          >
            <option value="">全部角色</option>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">
            會員等級
          </label>
          <select
            v-model="memberLevelFilter"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-fuchsia-500"
          >
            <option value="">全部等級</option>
            <option value="NORMAL">NORMAL</option>
            <option value="VIP">VIP</option>
          </select>
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">
            登入來源
          </label>
          <select
            v-model="authProviderFilter"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-fuchsia-500"
          >
            <option value="">全部來源</option>
            <option value="EMAIL">EMAIL</option>
            <option value="GOOGLE">GOOGLE</option>
            <option value="LINE">LINE</option>
            <option value="FACEBOOK">FACEBOOK</option>
          </select>
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-slate-700">
            每頁筆數
          </label>
          <select
            v-model.number="pageSize"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-fuchsia-500"
          >
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
        </div>

        <div class="flex items-end gap-3">
          <button
            @click="searchUsers"
            class="flex-1 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
          >
            搜尋
          </button>

          <button
            @click="resetFilters"
            class="flex-1 rounded-2xl bg-slate-200 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-300"
          >
            重設
          </button>
        </div>
      </div>
    </section>

    <!-- 會員卡片 -->
    <section class="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
      <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-3xl font-black text-slate-900">
            社群會員卡片列表
          </h2>

          <p class="mt-1 text-sm text-slate-500">
            顯示 {{ currentPageStart }} - {{ currentPageEnd }} 筆，共 {{ total }} 筆
          </p>
        </div>

        <div class="text-sm text-slate-400">
          第 {{ page }} / {{ totalPages }} 頁
        </div>
      </div>

      <div
        v-if="loading"
        class="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-500"
      >
        載入會員資料中...
      </div>

      <div
        v-else-if="users.length === 0"
        class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center"
      >
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
          👤
        </div>

        <h3 class="mt-4 text-xl font-black text-slate-800">
          目前沒有符合條件的會員資料
        </h3>

        <p class="mt-2 text-sm text-slate-500">
          可以調整搜尋條件、角色、會員等級或登入來源後重新查詢。
        </p>
      </div>

      <div
        v-else
        class="grid grid-cols-1 gap-5 xl:grid-cols-2"
      >
        <article
          v-for="user in users"
          :key="user.id"
          class="overflow-hidden rounded-[28px] border shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          :class="getCardClass(user)"
        >
          <div class="border-b border-white/80 bg-white/70 p-6">
            <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div class="min-w-0">
                <div class="flex flex-wrap gap-2">
                  <span
                    class="inline-flex rounded-full border px-3 py-1 text-xs font-black"
                    :class="getRoleClass(user.role)"
                  >
                    {{ user.role || 'USER' }}
                  </span>

                  <span
                    class="inline-flex rounded-full border px-3 py-1 text-xs font-black"
                    :class="getLevelClass(user.memberLevel)"
                  >
                    {{ user.memberLevel || 'NORMAL' }}
                  </span>

                  <span
                    class="inline-flex rounded-full border px-3 py-1 text-xs font-black"
                    :class="getAuthProviderMeta(user.authProvider).class"
                  >
                    {{ getAuthProviderMeta(user.authProvider).emoji }}
                    {{ getAuthProviderMeta(user.authProvider).label }}
                  </span>
                </div>

                <div class="mt-4 flex items-center gap-3">
                  <img
                    v-if="user.avatarUrl"
                    :src="user.avatarUrl"
                    alt="avatar"
                    class="h-12 w-12 rounded-full border border-slate-200 object-cover"
                  />

                  <div
                    v-else
                    class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-lg font-black text-slate-600"
                  >
                    {{ String(user.name || user.email || '?').slice(0, 1).toUpperCase() }}
                  </div>

                  <div class="min-w-0">
                    <h3 class="truncate text-2xl font-black text-slate-900">
                      {{ user.name || '未命名會員' }}
                    </h3>

                    <p class="break-all text-sm text-slate-500">
                      {{ user.email || '—' }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="shrink-0 rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
                <p class="text-xs font-bold text-slate-400">
                  User ID
                </p>
                <p class="mt-1 text-xl font-black text-slate-900">
                  #{{ user.id }}
                </p>
              </div>
            </div>
          </div>

          <div class="grid gap-3 p-6 md:grid-cols-2">
            <div class="rounded-2xl bg-white p-4 shadow-sm">
              <p class="text-xs font-bold text-slate-400">
                登入來源
              </p>
              <p class="mt-2 font-black text-slate-800">
                {{ user.authProvider || 'EMAIL' }}
              </p>
            </div>

            <div class="rounded-2xl bg-white p-4 shadow-sm">
              <p class="text-xs font-bold text-slate-400">
                社群帳號 ID
              </p>
              <p class="mt-2 break-all text-sm font-bold text-slate-800">
                {{ user.socialId || '—' }}
              </p>
            </div>

            <div class="rounded-2xl bg-white p-4 shadow-sm">
              <p class="text-xs font-bold text-slate-400">
                註冊時間
              </p>
              <p class="mt-2 font-bold text-slate-800">
                {{ formatDateTime(user.createdAt) }}
              </p>
            </div>

            <div class="rounded-2xl bg-white p-4 shadow-sm">
              <p class="text-xs font-bold text-slate-400">
                更新時間
              </p>
              <p class="mt-2 font-bold text-slate-800">
                {{ formatDateTime(user.updatedAt) }}
              </p>
            </div>
          </div>

          <div class="border-t border-white/80 bg-white/80 p-5">
            <p class="mb-3 text-sm font-bold text-slate-600">
              快速調整會員等級
            </p>

            <div class="grid grid-cols-2 gap-3">
              <button
                @click="updateMemberLevel(user, 'NORMAL')"
                :disabled="actionLoadingId === user.id || user.memberLevel === 'NORMAL'"
                class="rounded-2xl bg-slate-200 px-4 py-3 font-black text-slate-700 transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                設為 NORMAL
              </button>

              <button
                @click="updateMemberLevel(user, 'VIP')"
                :disabled="actionLoadingId === user.id || user.memberLevel === 'VIP'"
                class="rounded-2xl bg-amber-500 px-4 py-3 font-black text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                升級 VIP
              </button>
            </div>
          </div>
        </article>
      </div>

      <!-- 分頁 -->
      <div class="mt-6 flex flex-col gap-4 rounded-3xl bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
        <div class="text-sm text-slate-500">
          第 {{ page }} / {{ totalPages }} 頁，
          顯示 {{ currentPageStart }} - {{ currentPageEnd }} 筆，
          共 {{ total }} 筆
        </div>

        <div class="flex gap-3">
          <button
            @click="prevPage"
            :disabled="page <= 1 || loading"
            class="rounded-xl bg-slate-200 px-5 py-2 font-bold text-slate-700 transition hover:bg-slate-300 disabled:opacity-40"
          >
            上一頁
          </button>

          <button
            @click="nextPage"
            :disabled="page >= totalPages || loading"
            class="rounded-xl bg-slate-900 px-5 py-2 font-bold text-white transition hover:bg-slate-800 disabled:opacity-40"
          >
            下一頁
          </button>
        </div>
      </div>
    </section>
  </div>
</template>