import axios from 'axios'

const DEFAULT_LOCAL_API_BASE_URL = 'http://localhost:3000/api'

const normalizeBaseUrl = (value) => {
  return String(value || DEFAULT_LOCAL_API_BASE_URL).trim().replace(/\/$/, '')
}

const http = axios.create({
  baseURL: normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL || DEFAULT_LOCAL_API_BASE_URL)
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default http
