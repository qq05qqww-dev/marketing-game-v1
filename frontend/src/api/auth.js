// Multi Game Platform V2.2 Stable
// 第 345 批：正式前端登入 API 改用 VITE_API_BASE_URL 版
//
// 建議放置位置：
// frontend/src/api/auth.js
//
// 修正重點：
// 1. 不再依賴 ./http 裡可能寫死的 localhost:3000
// 2. 登入 / 註冊 / 取得會員資料統一使用 VITE_API_BASE_URL
// 3. 正式 Vercel 會打 Render API：
//    https://marketing-game-api.onrender.com/api
// 4. 本機沒有 env 時才 fallback 到 http://localhost:3000/api

import axios from 'axios'

const DEFAULT_API_BASE_URL = 'http://localhost:3000/api'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL

const getStoredToken = () => {
  if (typeof localStorage === 'undefined') return ''

  return localStorage.getItem('token') || ''
}

const authHttp = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

authHttp.interceptors.request.use((config) => {
  const token = getStoredToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export const loginApi = (data) => {
  return authHttp.post('/auth/login', data)
}

export const registerApi = (data) => {
  return authHttp.post('/auth/register', data)
}

export const getProfileApi = () => {
  return authHttp.get('/auth/me')
}

// Google OAuth
export const getGoogleLoginUrl = () => {
  return `${API_BASE_URL}/auth/google`
}

export const goGoogleLogin = () => {
  window.location.href = getGoogleLoginUrl()
}

// LINE Login
export const getLineLoginUrl = () => {
  return `${API_BASE_URL}/auth/line`
}

export const goLineLogin = () => {
  window.location.href = getLineLoginUrl()
}

// Facebook Login
export const getFacebookLoginUrl = () => {
  return `${API_BASE_URL}/auth/facebook`
}

export const goFacebookLogin = () => {
  window.location.href = getFacebookLoginUrl()
}
