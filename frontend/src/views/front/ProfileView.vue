<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import PlatformNavbar from '../../components/PlatformNavbar.vue'
import PlatformFooter from '../../components/PlatformFooter.vue'
import BasePageHeader from '../../components/common/BasePageHeader.vue'
import BaseStatCard from '../../components/common/BaseStatCard.vue'
import BaseSectionHeader from '../../components/common/BaseSectionHeader.vue'
import BaseActionCard from '../../components/common/BaseActionCard.vue'
import BaseInfoRow from '../../components/common/BaseInfoRow.vue'
import BaseButton from '../../components/common/BaseButton.vue'
import BaseLoading from '../../components/common/BaseLoading.vue'
import BaseError from '../../components/common/BaseError.vue'
import BaseEmpty from '../../components/common/BaseEmpty.vue'
import BaseToast from '../../components/common/BaseToast.vue'
import BaseConfirmModal from '../../components/common/BaseConfirmModal.vue'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'

const router = useRouter()
const authStore = useAuthStore()

const syncing = ref(false)
const syncMessage = ref('')
const syncError = ref('')
const profileReady = ref(false)

const {
  toast,
  showSuccess,
  showError,
  showWarning,
  closeToast
} = useToast()

const {
  confirmState,
  closeConfirm,
  handleConfirm,
  confirmWarning
} = useConfirm()

const user = computed(() => authStore.user || {})

const hasUserData = computed(() => {
  return !!user.value?.id || !!user.value?.email || !!user.value?.name
})

const authProvider = computed(() => {
  return String(user.value?.authProvider || 'EMAIL').toUpperCase()
})

const role = computed(() => {
  return String(user.value?.role || 'USER').toUpperCase()
})

const memberLevel = computed(() => {
  return String(user.value?.memberLevel || 'NORMAL').toUpperCase()
})

const rewardCount = computed(() => {
  return Number(user.value?._count?.rewards || user.value?.rewardCount || 0)
})

const playRecordCount = computed(() => {
  return Number(user.value?._count?.playRecords || user.value?.playRecordCount || 0)
})

const avatarText = computed(() => {
  return String(user.value?.name || user.value?.email || '?').slice(0, 1).toUpperCase()
})

const isAdmin = computed(() => {
  return role.value === 'ADMIN'
})

const syncProfile = async () => {
  if (!authStore.isLoggedIn) {
    showWarning('請先登入', '登入後才能查看會員中心')

    setTimeout(() => {
      router.push('/login')
    }, 500)

    return
  }

  syncing.value = true
  syncMessage.value = ''
  syncError.value = ''

  try {
    if (typeof authStore.refreshProfile === 'function') {
      await authStore.refreshProfile()
      syncMessage.value = '會員資料已同步'
      showSuccess('會員資料已同步', '你的會員資料已更新')
    }

    profileReady.value = true
  } catch (error) {
    console.error('同步會員資料失敗:', error)

    syncError.value =
      error?.response?.data?.message ||
      error?.message ||
      '同步會員資料失敗，請稍後再試'

    showError('同步失敗', syncError.value)
  } finally {
    syncing.value = false

    setTimeout(() => {
      syncMessage.value = ''
    }, 2000)
  }
}

const getProviderMeta = (provider) => {
  const value = String(provider || 'EMAIL').toUpperCase()

  if (value === 'GOOGLE') {
    return {
      label: 'Google 登入',
      emoji: 'G',
      desc: '此帳號透過 Google OAuth 登入',
      class: 'border-blue-200 bg-blue-50 text-blue-700',
      cardClass: 'border-blue-100 bg-blue-50'
    }
  }

  if (value === 'LINE') {
    return {
      label: 'LINE 登入',
      emoji: 'LINE',
      desc: '此帳號透過 LINE Login 登入',
      class: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      cardClass: 'border-emerald-100 bg-emerald-50'
    }
  }

  if (value === 'FACEBOOK') {
    return {
      label: 'Facebook 登入',
      emoji: 'f',
      desc: '此帳號透過 Facebook Login 登入',
      class: 'border-blue-200 bg-blue-50 text-blue-700',
      cardClass: 'border-blue-100 bg-blue-50'
    }
  }

  return {
    label: 'Email 登入',
    emoji: '@',
    desc: '此帳號使用 Email / 密碼登入',
    class: 'border-slate-200 bg-slate-50 text-slate-700',
    cardClass: 'border-slate-200 bg-slate-50'
  }
}

const getRoleClass = () => {
  if (role.value === 'ADMIN') {
    return 'border-rose-200 bg-rose-50 text-rose-700'
  }

  return 'border-blue-200 bg-blue-50 text-blue-700'
}

const getLevelClass = () => {
  if (memberLevel.value === 'VIP') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  return 'border-slate-200 bg-slate-50 text-slate-700'
}

const getLevelDesc = () => {
  if (memberLevel.value === 'VIP') {
    return 'VIP 會員可參加限定活動與高階活動。'
  }

  return 'NORMAL 會員可參加一般活動。'
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

const copyText = async (value) => {
  if (!value) {
    showWarning('沒有可複製的內容', '此欄位目前沒有資料')
    return
  }

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(String(value))
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = String(value)
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }

    showSuccess('已複製', String(value))
  } catch (error) {
    console.error('複製失敗:', error)
    showError('複製失敗', '請手動複製此欄位內容')
  }
}

const goHome = () => {
  router.push('/')
}

const goCampaigns = () => {
  router.push('/campaigns')
}

const goGames = () => {
  router.push('/games')
}

const goMyRewards = () => {
  router.push('/my-rewards')
}

const goAdmin = () => {
  router.push('/admin/campaigns')
}

const goReports = () => {
  router.push('/admin/reports')
}

const doLogout = async () => {
  authStore.logout()
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

onMounted(async () => {
  if (typeof authStore.restoreLogin === 'function') {
    authStore.restoreLogin()
  }

  if (!authStore.isLoggedIn) {
    showWarning('請先登入', '登入後才能查看會員中心')

    setTimeout(() => {
      router.push('/login')
    }, 500)

    return
  }

  await syncProfile()
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-slate-100">
    <PlatformNavbar />

    <main class="flex-1">
      <div class="mx-auto max-w-7xl px-4 py-8">
        <BaseLoading
          v-if="syncing && !profileReady"
          title="同步會員資料中..."
          message="請稍候，系統正在取得你的會員資料。"
        />

        <BaseError
          v-else-if="syncError"
          title="會員資料同步失敗"
          :message="syncError"
          buttonText="重新同步"
          @retry="syncProfile"
        />

        <BaseEmpty
          v-else-if="!hasUserData"
          icon="👤"
          title="尚未取得會員資料"
          message="目前沒有讀取到會員資料，請重新登入或重新同步會員資料。"
          buttonText="重新同步"
          :showButton="true"
          @action="syncProfile"
        />

        <div
          v-else
          class="space-y-8"
        >
          <BasePageHeader
            eyebrow="Member Center"
            :title="user.name || '會員中心'"
            :description="`${user.email || '尚未取得 Email'}｜這裡可以查看你的會員資料、登入來源、會員等級、獎品紀錄與遊玩紀錄統計。`"
            variant="indigo"
            :badgeIcon="getProviderMeta(authProvider).emoji"
            :badgeText="memberLevel"
          >
            <BaseButton
  variant="warning"
  @click="goMyRewards"
>
  我的獎品
</BaseButton>

<BaseButton
  variant="primary"
  @click="goCampaigns"
>
  活動列表
</BaseButton>

<BaseButton
  variant="indigo"
  @click="goGames"
>
  遊戲入口
</BaseButton>

<BaseButton
  variant="secondary"
  :loading="syncing"
  :disabled="syncing"
  @click="syncProfile"
>
  {{ syncing ? '同步中...' : '同步資料' }}
</BaseButton>

<BaseButton
  v-if="isAdmin"
  variant="dark"
  @click="goAdmin"
>
  後台管理
</BaseButton>

            <template #right>
              <div class="rounded-[32px] border border-white/70 bg-white/85 p-6 text-center shadow-sm backdrop-blur">
                <div class="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-[32px] bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-4xl font-black text-white shadow-lg">
                  <img
                    v-if="user.avatarUrl"
                    :src="user.avatarUrl"
                    alt="avatar"
                    class="h-full w-full object-cover"
                  />

                  <span v-else>
                    {{ avatarText }}
                  </span>
                </div>

                <div class="mt-4 flex flex-wrap justify-center gap-2">
                  <span
                    class="inline-flex rounded-full border px-3 py-1 text-xs font-black"
                    :class="getProviderMeta(authProvider).class"
                  >
                    {{ getProviderMeta(authProvider).label }}
                  </span>

                  <span
                    class="inline-flex rounded-full border px-3 py-1 text-xs font-black"
                    :class="getRoleClass()"
                  >
                    {{ role }}
                  </span>

                  <span
                    class="inline-flex rounded-full border px-3 py-1 text-xs font-black"
                    :class="getLevelClass()"
                  >
                    {{ memberLevel }}
                  </span>
                </div>

                <div
                  v-if="syncMessage"
                  class="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700"
                >
                  {{ syncMessage }}
                </div>
              </div>
            </template>
          </BasePageHeader>

          <!-- Stats -->
          <section class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <BaseStatCard
              label="會員 ID"
              :value="user.id ? `#${user.id}` : '—'"
              icon="👤"
              variant="slate"
              description="目前登入會員"
            />

            <BaseStatCard
              label="我的獎品"
              :value="rewardCount"
              icon="🎁"
              variant="amber"
              description="中獎與兌換紀錄"
              :clickable="true"
              @click="goMyRewards"
            />

            <BaseStatCard
              label="遊玩次數"
              :value="playRecordCount"
              icon="🕹️"
              variant="indigo"
              description="累積遊戲紀錄"
              :clickable="true"
              @click="goGames"
            />

            <BaseStatCard
              label="會員等級"
              :value="memberLevel"
              icon="⭐"
              variant="violet"
              :description="getLevelDesc()"
            />
          </section>

          <!-- Account Overview -->
          <section class="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div class="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
              <BaseSectionHeader
                icon="👤"
                eyebrow="Profile"
                title="個人資料"
                description="目前登入帳號的基本資料。"
              >
                <BaseButton
  variant="dark"
  size="sm"
  :loading="syncing"
  :disabled="syncing"
  @click="syncProfile"
>
  {{ syncing ? '同步中...' : '重新同步' }}
</BaseButton>
              </BaseSectionHeader>

              <div class="space-y-4">
                <BaseInfoRow
                  icon="👤"
                  label="姓名"
                  :value="user.name || '—'"
                />

                <BaseInfoRow
                  icon="📧"
                  label="Email"
                  :value="user.email || '—'"
                  :copyable="!!user.email"
                  @copy="copyText"
                />

                <BaseInfoRow
                  icon="🔗"
                  label="社群帳號 ID"
                  :value="user.socialId || '—'"
                  :mono="true"
                  :copyable="!!user.socialId"
                  @copy="copyText"
                />

                <BaseInfoRow
                  icon="🕒"
                  label="註冊時間"
                  :value="formatDateTime(user.createdAt)"
                />

                <BaseInfoRow
                  icon="♻️"
                  label="最近更新"
                  :value="formatDateTime(user.updatedAt)"
                />
              </div>
            </div>

            <div class="space-y-8">
              <div
                class="rounded-[32px] border p-8 shadow-sm"
                :class="getProviderMeta(authProvider).cardClass"
              >
                <BaseSectionHeader
                  icon="🔐"
                  eyebrow="Login Provider"
                  title="登入來源"
                  :description="getProviderMeta(authProvider).desc"
                />

                <div class="flex items-center gap-4">
                  <div class="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-2xl font-black shadow-sm">
                    {{ getProviderMeta(authProvider).emoji }}
                  </div>

                  <div>
                    <p class="text-2xl font-black text-slate-900">
                      {{ getProviderMeta(authProvider).label }}
                    </p>
                    <p class="mt-1 text-sm font-bold text-slate-500">
                      {{ getProviderMeta(authProvider).desc }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
                <BaseSectionHeader
                  icon="🛡️"
                  eyebrow="Permission"
                  title="會員權限"
                  description="查看目前帳號的角色與會員等級。"
                />

                <div class="grid gap-4">
  <BaseInfoRow
    icon="🛡️"
    label="會員角色"
    :value="role"
  />

  <BaseInfoRow
    icon="⭐"
    label="會員等級"
    :value="memberLevel"
  />

  <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
    <p class="text-xs font-bold text-slate-400">
      權限說明
    </p>

    <p class="mt-2 text-sm leading-7 text-slate-600">
      {{ isAdmin ? '管理員可進入後台營運區，管理活動、獎項、會員、報表與系統狀態。' : '一般會員可參加前台活動、查看我的獎品與遊戲紀錄。' }}
    </p>

    <p class="mt-2 text-sm leading-7 text-slate-600">
      {{ getLevelDesc() }}
    </p>
  </div>
</div>
              </div>
            </div>
          </section>

          <!-- Quick Actions -->
          <section class="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <BaseSectionHeader
              icon="⚡"
              eyebrow="Quick Actions"
              title="快速入口"
              description="快速前往活動、遊戲與獎品頁面。"
            />

            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <BaseActionCard
                icon="🎁"
                title="我的獎品"
                description="查看中獎紀錄與兌換碼"
                variant="amber"
                @click="goMyRewards"
              />

              <BaseActionCard
                icon="🎮"
                title="活動列表"
                description="查看目前可以參加的活動"
                variant="rose"
                @click="goCampaigns"
              />

              <BaseActionCard
                icon="🕹️"
                title="遊戲入口"
                description="查看輪盤、翻牌、九宮格、刮刮樂"
                variant="indigo"
                @click="goGames"
              />

              <BaseActionCard
                v-if="isAdmin"
                icon="🛠️"
                title="後台管理"
                description="管理活動、獎項、會員與報表"
                variant="dark"
                @click="goAdmin"
              />

              <BaseActionCard
                v-if="isAdmin"
                icon="📊"
                title="報表中心"
                description="查看遊玩紀錄與發獎紀錄"
                variant="violet"
                @click="goReports"
              />
            </div>
          </section>

          <!-- Logout -->
          <section class="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <BaseSectionHeader
              icon="🚪"
              eyebrow="Account"
              title="帳號操作"
              description="離開共用電腦前，建議先登出帳號。"
            >
              <BaseButton
  variant="muted"
  @click="goHome"
>
  返回首頁
</BaseButton>

<BaseButton
  variant="danger"
  @click="logout"
>
  登出帳號
</BaseButton>
            </BaseSectionHeader>
          </section>
        </div>
      </div>
    </main>

    <PlatformFooter />

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
  </div>
</template>