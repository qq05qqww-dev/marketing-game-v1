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

const http = axios.create({
  baseURL: normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL || getDefaultApiBaseUrl()),
  timeout: 30000
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export default http
