// Multi Game Platform V2.2 Stable
// 第 337 批：前端 API 自動帶 JWT + 不誤登出版
//
// 建議放置位置：
// src/api/httpClient.js
//
// 修正重點：
// 1. 自動從 localStorage 讀 token
// 2. 自動加 Authorization: Bearer <token>
// 3. 不再因為一般後台 API 401 就立刻清除 token
// 4. 避免點「讀取資料庫活動」失敗後，整個前台自動變登出

const DEFAULT_API_BASE_URL = 'http://localhost:3000/api'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL

export class ApiError extends Error {
  constructor(message, status = 500, details = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

const getStoredToken = () => {
  if (typeof localStorage === 'undefined') return ''

  return localStorage.getItem('token') || ''
}

const clearStoredLogin = () => {
  if (typeof localStorage === 'undefined') return

  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

const shouldClearLoginOn401 = (path = '', options = {}) => {
  if (options.clearLoginOn401 === false) return false
  if (options.clearLoginOn401 === true) return true

  const normalizedPath = String(path || '').toLowerCase()

  // 只有明確查自己登入狀態的 API 失敗時才自動登出。
  // 一般後台資料 API 401 不清 token，避免誤登出。
  return normalizedPath.includes('/auth/me')
    || normalizedPath.includes('/auth/profile')
    || normalizedPath.includes('/users/me')
}

const buildHeaders = (options = {}) => {
  const token = getStoredToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

export const apiRequest = async (path, options = {}) => {
  const url = `${API_BASE_URL}${path}`

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: buildHeaders(options),
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined
  })

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (response.status === 401 && shouldClearLoginOn401(path, options)) {
    clearStoredLogin()
  }

  if (!response.ok || payload?.success === false) {
    throw new ApiError(
      payload?.message || `API request failed: ${response.status}`,
      response.status,
      payload?.details || payload
    )
  }

  return payload?.data ?? payload
}

export const getAuthHeader = () => {
  const token = getStoredToken()

  return token
    ? {
        Authorization: `Bearer ${token}`
      }
    : {}
}

export const getApiUrl = (path) => {
  return `${API_BASE_URL}${path}`
}
