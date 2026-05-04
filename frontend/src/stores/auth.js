import { defineStore } from 'pinia'
import { getProfileApi } from '../api/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: (() => {
      try {
        const raw = localStorage.getItem('user')
        return raw ? JSON.parse(raw) : null
      } catch (error) {
        return null
      }
    })(),
    profileLoading: false
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    currentRole: (state) => String(state.user?.role || 'USER').toUpperCase(),
    isSuperAdmin: (state) => ['ADMIN', 'SUPER_ADMIN'].includes(String(state.user?.role || '').toUpperCase()),
    isMerchantAdmin: (state) => String(state.user?.role || '').toUpperCase() === 'MERCHANT_ADMIN',
    isMerchantStaff: (state) => String(state.user?.role || '').toUpperCase() === 'MERCHANT_STAFF',
    isMerchantUser: (state) => ['MERCHANT_ADMIN', 'MERCHANT_STAFF'].includes(String(state.user?.role || '').toUpperCase()),
    isAdmin: (state) => ['ADMIN', 'SUPER_ADMIN', 'MERCHANT_ADMIN', 'MERCHANT_STAFF'].includes(String(state.user?.role || '').toUpperCase()),
    tenantId: (state) => state.user?.tenantId || null,
    tenantName: (state) => state.user?.tenantName || state.user?.tenant?.name || '',
    tenantSlug: (state) => state.user?.tenantSlug || state.user?.tenant?.slug || '',
    tenantStatus: (state) => state.user?.tenantStatus || state.user?.tenant?.status || '',
    tenantDisplayName: (state) => {
      const role = String(state.user?.role || '').toUpperCase()

      if (['ADMIN', 'SUPER_ADMIN'].includes(role)) {
        return '平台總管理員'
      }

      return state.user?.tenantName || state.user?.tenant?.name || '未綁定商家'
    },
    roleDisplayName: (state) => {
      const role = String(state.user?.role || 'USER').toUpperCase()
      const map = {
        ADMIN: '平台總管理員',
        SUPER_ADMIN: '平台總管理員',
        MERCHANT_ADMIN: '商家管理員',
        MERCHANT_STAFF: '商家員工',
        USER: '一般會員'
      }

      return map[role] || role
    }
  },

  actions: {
    setToken(token) {
      this.token = token || ''

      if (this.token) {
        localStorage.setItem('token', this.token)
      } else {
        localStorage.removeItem('token')
      }
    },

    setUser(user) {
      this.user = user || null

      if (this.user) {
        localStorage.setItem('user', JSON.stringify(this.user))
      } else {
        localStorage.removeItem('user')
      }
    },

    setLogin(payload) {
      const token = payload?.token || payload?.accessToken || ''
      const user = payload?.user || null

      this.token = token
      this.user = user

      if (token) {
        localStorage.setItem('token', token)
      } else {
        localStorage.removeItem('token')
      }

      if (user) {
        localStorage.setItem('user', JSON.stringify(user))
      } else {
        localStorage.removeItem('user')
      }
    },

    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },

    restoreLogin() {
      const token = localStorage.getItem('token') || ''
      let user = null

      try {
        const raw = localStorage.getItem('user')
        user = raw ? JSON.parse(raw) : null
      } catch (error) {
        user = null
      }

      this.token = token
      this.user = user
    },

    async refreshProfile() {
      if (!this.token) {
        return null
      }

      this.profileLoading = true

      try {
        const res = await getProfileApi()
        const profile = res?.data?.data || res?.data || res || null

        if (profile) {
          this.setUser(profile)
        }

        return profile
      } catch (error) {
        console.error('同步會員資料失敗:', error)

        const status = error?.status || error?.response?.status

        if (status === 401) {
          this.logout()
        }

        return null
      } finally {
        this.profileLoading = false
      }
    }
  }
})
