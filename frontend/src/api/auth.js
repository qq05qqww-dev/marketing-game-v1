import http from './http'

const API_BASE = http?.defaults?.baseURL || 'http://localhost:3000/api'

export const loginApi = (data) => {
  return http.post('/auth/login', data)
}

export const registerApi = (data) => {
  return http.post('/auth/register', data)
}

export const getProfileApi = () => {
  return http.get('/auth/me')
}

// Google OAuth
export const getGoogleLoginUrl = () => {
  return `${API_BASE}/auth/google`
}

export const goGoogleLogin = () => {
  window.location.href = getGoogleLoginUrl()
}

// LINE Login
export const getLineLoginUrl = () => {
  return `${API_BASE}/auth/line`
}

export const goLineLogin = () => {
  window.location.href = getLineLoginUrl()
}

// Facebook Login
export const getFacebookLoginUrl = () => {
  return `${API_BASE}/auth/facebook`
}

export const goFacebookLogin = () => {
  window.location.href = getFacebookLoginUrl()
}