import http from './http'

export const getPrizeListApi = (keyword = '') => {
  return http.get(`/admin/prizes?keyword=${encodeURIComponent(keyword)}`)
}