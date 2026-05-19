// Multi Game Platform V2.3 Tenant Edition
// 第 91601～92000 批：登入過期自動導回登入頁修正版
//
// 覆蓋位置：
// frontend/src/api/http.js
//
// 本批重點：
// 1. 修正商家在「我的序號管理」遇到 token 過期時只跳錯誤、卡在原頁面的問題。
// 2. API 回 401，或 403 且訊息明確為登入 / 憑證 / token 失效時，自動清除舊登入資料。
// 3. 自動導回 /login，並帶 redirect，重新登入後可回到原本頁面。
// 4. 不改資料庫、不改序號資料、不改獎項資料、不改 router。

import axios from 'axios'

const LOCAL_API_BASE_URL = 'http://localhost:3000/api'
const PRODUCTION_API_BASE_URL = 'https://marketing-game-api.onrender.com/api'

const isLocalHost = () => {
  if (typeof window === 'undefined') return true

  return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
}

const getDefaultApiBaseUrl = () => {
  // 本機開發：打本機後端。
  // Vercel / 手機 / 正式網域：預設打 Render 後端，避免 VITE_API_BASE_URL 漏設時變成 localhost。
  return isLocalHost() ? LOCAL_API_BASE_URL : PRODUCTION_API_BASE_URL
}

const normalizeBaseUrl = (value) => {
  return String(value || getDefaultApiBaseUrl()).trim().replace(/\/$/, '')
}

const getAuthErrorMessage = (error) => {
  const data = error?.response?.data

  if (!data) return ''

  if (typeof data === 'string') return data

  return String(
    data.message ||
      data.error ||
      data.detail ||
      data.reason ||
      ''
  )
}

const isCredentialExpiredError = (error) => {
  const status = Number(error?.response?.status || 0)
  const message = getAuthErrorMessage(error)

  if (status === 401) return true

  // 403 有時候是權限不足，不一定是登入過期。
  // 只有後端訊息明確提到登入 / 憑證 / token / 授權失效時才導回登入頁。
  if (status === 403 && /登入|憑證|token|Token|JWT|授權|未登入|過期|expired|invalid/i.test(message)) {
    return true
  }

  return false
}

const clearStoredLogin = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

const redirectToLoginOnce = () => {
  if (typeof window === 'undefined') return

  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`

  if (window.location.pathname === '/login') {
    return
  }

  const redirect = encodeURIComponent(currentPath || '/admin/dashboard')
  const target = `/login?redirect=${redirect}&reason=expired`

  // 防止同一輪多個 API 同時 401 時重複跳轉。
  if (sessionStorage.getItem('auth-expired-redirecting') === '1') {
    return
  }

  sessionStorage.setItem('auth-expired-redirecting', '1')
  window.location.replace(target)
}

const http = axios.create({
  baseURL: normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL || getDefaultApiBaseUrl()),
  timeout: 30000
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')

  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

http.interceptors.response.use(
  (response) => {
    // 任一 API 成功後清掉登入過期跳轉鎖，避免重新登入後仍被鎖住。
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth-expired-redirecting')
    }

    return response
  },
  (error) => {
    if (isCredentialExpiredError(error)) {
      clearStoredLogin()
      redirectToLoginOnce()
    }

    return Promise.reject(error)
  }
)

export default http