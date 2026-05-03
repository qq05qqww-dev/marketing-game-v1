import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/front/HomeView.vue'
import CampaignListView from '../views/front/CampaignListView.vue'
import CampaignDetailView from '../views/front/CampaignDetailView.vue'
import ScratchCardView from '../views/front/games/ScratchCardView.vue'
import GamePlayView from '../views/front/GamePlayView.vue'
import GamesView from '../views/front/GamesView.vue'
import EggSmashView from '../views/front/games/EggSmashView.vue'
import GoldenEggGameView from '../views/front/games/GoldenEggGameView.vue'
import WheelGameView from '../views/front/games/WheelGameView.vue'
import SlotMachineView from '../views/front/games/SlotMachineView.vue'
import RingTossView from '../views/front/games/RingTossView.vue'
import ClawMachineView from '../views/front/games/ClawMachineView.vue'
import ReferralTaskView from '../views/front/games/ReferralTaskView.vue'
import GridLotteryView from '../views/front/games/GridLotteryView.vue'
import PremiumGridLotteryView from '../views/games/PremiumGridLotteryView.vue'
import FlipCardView from '../views/front/games/FlipCardView.vue'
import LoginView from '../views/front/LoginView.vue'
import RegisterView from '../views/front/RegisterView.vue'
import MyRewardsView from '../views/front/MyRewardsView.vue'
import ProfileView from '../views/front/ProfileView.vue'
import NotFoundView from '../views/front/NotFoundView.vue'
import MyGameHistoryView from '../views/front/MyGameHistoryView.vue'

import AdminLayout from '../layouts/AdminLayout.vue'
import AdminCampaignsView from '../views/admin/AdminCampaignsView.vue'
import AdminPrizesView from '../views/admin/AdminPrizesView.vue'
import AdminGameSettingsView from '../views/admin/AdminGameSettingsView.vue'
import AdminGamePrizesView from '../views/admin/AdminGamePrizesView.vue'
import AdminGameProbabilityView from '../views/admin/AdminGameProbabilityView.vue'
import AdminGameEditView from '../views/admin/AdminGameEditView.vue'
import AdminReportsView from '../views/admin/AdminReportsView.vue'
import AdminUsersView from '../views/admin/AdminUsersView.vue'
import AdminRewardsView from '../views/admin/AdminRewardsView.vue'
import CampaignStyleEditorView from '../views/admin/CampaignStyleEditorView.vue'
import AdminGamePreviewView from '../views/admin/AdminGamePreviewView.vue'
import AdminSystemStatusView from '../views/admin/AdminSystemStatusView.vue'
import AdminGoldenEggView from '../views/admin/AdminGoldenEggView.vue'
import AdminTenantsView from '../views/admin/AdminTenantsView.vue'

import { usePageProgress } from '../composables/usePageProgress'

const {
  startPageProgress,
  finishPageProgress,
  failPageProgress
} = usePageProgress()

const PLATFORM_ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN']
const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN', 'MERCHANT_ADMIN', 'MERCHANT_STAFF']

const getStoredAuth = () => {
  const token = localStorage.getItem('token') || ''
  const userRaw = localStorage.getItem('user')

  let user = null

  try {
    user = userRaw ? JSON.parse(userRaw) : null
  } catch (error) {
    console.error('使用者資料解析失敗：', error)
    localStorage.removeItem('user')
    localStorage.removeItem('token')

    return {
      token: '',
      user: null,
      broken: true
    }
  }

  return {
    token,
    user,
    broken: false
  }
}

const getUserRole = (user) => {
  return String(user?.role || '').toUpperCase()
}

const isAdminUser = (user) => {
  return ADMIN_ROLES.includes(getUserRole(user))
}

const isPlatformAdminUser = (user) => {
  return PLATFORM_ADMIN_ROLES.includes(getUserRole(user))
}

const getDefaultAdminPath = (user) => {
  return isPlatformAdminUser(user) ? '/admin/tenants' : '/admin/golden-egg'
}

const canAccessAdminRoute = (to, user) => {
  if (!to.meta?.requiresAdmin) return true

  const role = getUserRole(user)

  if (!ADMIN_ROLES.includes(role)) return false

  const allowedRoles = to.meta?.allowedRoles

  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    return true
  }

  return allowedRoles.map((item) => String(item).toUpperCase()).includes(role)
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: '首頁'
      }
    },
    {
      path: '/games',
      name: 'games',
      component: GamesView,
      meta: {
        title: '遊戲入口'
      }
    },
    {
      path: '/games/grid-lottery',
      name: 'game-grid-lottery',
      component: GridLotteryView,
      meta: {
        title: '九宮格抽獎'
      }
    },
    {
      path: '/games/premium-grid',
      name: 'game-premium-grid',
      component: PremiumGridLotteryView,
      alias: [
        '/games/premium-grid-lottery',
        '/games/premium-nine-grid'
      ],
      meta: {
        title: '精緻九宮格抽獎'
      }
    },
    {
      path: '/games/scratch-card',
      name: 'game-scratch-card',
      component: ScratchCardView,
      meta: {
        title: '精緻刮刮卡'
      }
    },
    {
      path: '/games/flip-card',
      name: 'game-flip-card',
      component: FlipCardView,
      meta: {
        title: '翻牌遊戲'
      }
    },
    {
      path: '/games/egg-smash',
      name: 'game-egg-smash',
      component: EggSmashView,
      meta: {
        title: '敲金蛋'
      }
    },
    {
      path: '/games/golden-egg',
      name: 'game-golden-egg',
      component: GoldenEggGameView,
      alias: [
        '/games/nine-golden-egg',
        '/games/golden-egg-deluxe'
      ],
      meta: {
        title: '九宮格砸金蛋'
      }
    },
    {
      path: '/games/wheel',
      name: 'game-wheel',
      component: WheelGameView,
      meta: {
        title: '幸運輪盤'
      }
    },
    {
      path: '/games/slot-machine',
      name: 'game-slot-machine',
      component: SlotMachineView,
      meta: {
        title: '拉霸機'
      }
    },
    {
      path: '/games/ring-toss',
      name: 'game-ring-toss',
      component: RingTossView,
      meta: {
        title: '套圈圈'
      }
    },
    {
      path: '/games/claw-machine',
      name: 'game-claw-machine',
      component: ClawMachineView,
      meta: {
        title: '夾娃娃'
      }
    },
    {
      path: '/games/referral-task',
      name: 'game-referral-task',
      component: ReferralTaskView,
      meta: {
        title: '推薦任務'
      }
    },
    {
      path: '/campaigns',
      name: 'campaigns',
      component: CampaignListView,
      meta: {
        title: '活動列表'
      }
    },
    {
      path: '/campaigns/:id',
      name: 'campaign-detail',
      component: CampaignDetailView,
      meta: {
        title: '活動詳情'
      }
    },
    {
      path: '/play/:id',
      name: 'game-play',
      component: GamePlayView,
      meta: {
        title: '遊戲頁'
      }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        title: '會員登入',
        guestOnly: true
      }
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: {
        title: '會員註冊',
        guestOnly: true
      }
    },
    {
      path: '/my-rewards',
      name: 'my-rewards',
      component: MyRewardsView,
      meta: {
        title: '我的獎品',
        requiresAuth: true
      }
    },
    {
      path: '/game-history',
      name: 'game-history',
      component: MyGameHistoryView,
      meta: {
        title: '我的遊戲紀錄'
      }
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: {
        title: '會員中心',
        requiresAuth: true
      }
    },
    {
      path: '/admin',
      component: AdminLayout,
      meta: {
        requiresAuth: true,
        requiresAdmin: true
      },
      children: [
        {
          path: '',
          redirect: () => {
            const { user } = getStoredAuth()
            return getDefaultAdminPath(user)
          }
        },
        {
          path: 'tenants',
          name: 'admin-tenants',
          component: AdminTenantsView,
          meta: {
            title: '商家管理',
            requiresAuth: true,
            requiresAdmin: true,
            allowedRoles: PLATFORM_ADMIN_ROLES
          }
        },
        {
          path: 'campaigns',
          name: 'admin-campaigns',
          component: AdminCampaignsView,
          meta: {
            title: '活動管理',
            requiresAuth: true,
            requiresAdmin: true,
            allowedRoles: PLATFORM_ADMIN_ROLES
          }
        },
        {
          path: 'game-settings',
          name: 'admin-game-settings',
          component: AdminGameSettingsView,
          meta: {
            title: '遊戲設定管理',
            requiresAuth: true,
            requiresAdmin: true,
            allowedRoles: PLATFORM_ADMIN_ROLES
          }
        },
        {
          path: 'game-settings/:gameId/prizes',
          name: 'admin-game-prizes',
          component: AdminGamePrizesView,
          meta: {
            title: '獎項設定',
            requiresAuth: true,
            requiresAdmin: true,
            allowedRoles: PLATFORM_ADMIN_ROLES
          }
        },
        {
          path: 'game-settings/:gameId/probability',
          name: 'admin-game-probability',
          component: AdminGameProbabilityView,
          meta: {
            title: '機率設定',
            requiresAuth: true,
            requiresAdmin: true,
            allowedRoles: PLATFORM_ADMIN_ROLES
          }
        },
        {
          path: 'game-settings/:gameId/edit',
          name: 'admin-game-edit',
          component: AdminGameEditView,
          meta: {
            title: '編輯遊戲設定',
            requiresAuth: true,
            requiresAdmin: true,
            allowedRoles: PLATFORM_ADMIN_ROLES
          }
        },
        {
          path: 'prizes',
          name: 'admin-prizes',
          component: AdminPrizesView,
          meta: {
            title: '獎項管理',
            requiresAuth: true,
            requiresAdmin: true,
            allowedRoles: PLATFORM_ADMIN_ROLES
          }
        },
        {
          path: 'reports',
          name: 'admin-reports',
          component: AdminReportsView,
          meta: {
            title: '報表中心',
            requiresAuth: true,
            requiresAdmin: true,
            allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'MERCHANT_ADMIN']
          }
        },
        {
          path: 'users',
          name: 'admin-users',
          component: AdminUsersView,
          meta: {
            title: '會員管理',
            requiresAuth: true,
            requiresAdmin: true,
            allowedRoles: PLATFORM_ADMIN_ROLES
          }
        },
        {
          path: 'rewards',
          name: 'admin-rewards',
          component: AdminRewardsView,
          meta: {
            title: '發獎核銷',
            requiresAuth: true,
            requiresAdmin: true,
            allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'MERCHANT_ADMIN', 'MERCHANT_STAFF']
          }
        },
        {
          path: 'campaign-style',
          name: 'admin-campaign-style',
          component: CampaignStyleEditorView,
          meta: {
            title: '活動樣式編輯器',
            requiresAuth: true,
            requiresAdmin: true,
            allowedRoles: PLATFORM_ADMIN_ROLES
          }
        },
        {
          path: 'game-preview',
          name: 'admin-game-preview',
          component: AdminGamePreviewView,
          meta: {
            title: '遊戲預覽中心',
            requiresAuth: true,
            requiresAdmin: true,
            allowedRoles: PLATFORM_ADMIN_ROLES
          }
        },
        {
          path: 'golden-egg',
          name: 'admin-golden-egg',
          component: AdminGoldenEggView,
          meta: {
            title: '砸金蛋後台管理',
            requiresAuth: true,
            requiresAdmin: true,
            allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'MERCHANT_ADMIN', 'MERCHANT_STAFF']
          }
        },
        {
          path: 'system-status',
          name: 'admin-system-status',
          component: AdminSystemStatusView,
          meta: {
            title: '系統狀態 / 版本資訊',
            requiresAuth: true,
            requiresAdmin: true,
            allowedRoles: PLATFORM_ADMIN_ROLES
          }
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
      meta: {
        title: '找不到頁面'
      }
    }
  ],
  scrollBehavior() {
    return {
      top: 0,
      behavior: 'smooth'
    }
  }
})

router.beforeEach((to, from) => {
  if (to.fullPath !== from.fullPath) {
    startPageProgress()
  }

  const { token, user, broken } = getStoredAuth()
  const isLoggedIn = !!token

  if (broken) {
    if (to.path === '/login') {
      return true
    }

    return {
      path: '/login',
      query: {
        redirect: to.fullPath
      }
    }
  }

  if (to.meta.requiresAuth && !isLoggedIn) {
    return {
      path: '/login',
      query: {
        redirect: to.fullPath
      }
    }
  }

  if (to.meta.requiresAdmin && !isAdminUser(user)) {
    return {
      path: '/'
    }
  }

  if (to.meta.requiresAdmin && !canAccessAdminRoute(to, user)) {
    return {
      path: getDefaultAdminPath(user)
    }
  }

  if (to.meta.guestOnly && isLoggedIn) {
    return {
      path: '/'
    }
  }

  return true
})

router.afterEach((to) => {
  const baseTitle = 'Multi Game Platform'
  const pageTitle = to.meta?.title

  document.title = pageTitle ? `${pageTitle}｜${baseTitle}` : baseTitle

  finishPageProgress()
})

router.onError((error) => {
  console.error('路由切換錯誤:', error)
  failPageProgress()
})

export default router
