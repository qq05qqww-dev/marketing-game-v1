import http from './http'

const API_BASE = http?.defaults?.baseURL || 'http://localhost:3000/api'

// ===== Campaign =====

export const getCampaignsApi = () => {
  return http.get('/campaigns')
}

export const getAdminCampaignsApi = () => {
  return http.get('/campaigns')
}

export const getCampaignDetailApi = (id) => {
  return http.get(`/campaigns/${id}`)
}

export const createCampaignApi = (data) => {
  return http.post('/admin/campaigns', data)
}

export const updateCampaignApi = (id, data) => {
  return http.put(`/admin/campaigns/${id}`, data)
}

export const deleteCampaignApi = (id) => {
  return http.delete(`/admin/campaigns/${id}`)
}

// ===== Prize =====

export const getPrizesApi = (params = {}) => {
  return http.get('/admin/prizes', {
    params
  })
}

export const getCampaignPrizesApi = (params = {}) => {
  if (typeof params === 'number' || typeof params === 'string') {
    return http.get('/admin/prizes', {
      params: {
        campaignId: params
      }
    })
  }

  return http.get('/admin/prizes', {
    params
  })
}

export const createPrizeApi = (data) => {
  return http.post('/admin/prizes', data)
}

export const updatePrizeApi = (id, data) => {
  return http.put(`/admin/prizes/${id}`, data)
}

export const deletePrizeApi = (id) => {
  return http.delete(`/admin/prizes/${id}`)
}

// ===== Draw / Game Play =====

export const playDrawApi = (data) => {
  return http.post('/draw/play', data)
}

export const playGameApi = (data) => {
  return http.post('/draw/play', data)
}

export const drawPlayApi = (data) => {
  return http.post('/draw/play', data)
}

// ===== Reports / Dashboard =====

export const getReportSummaryApi = (params = {}) => {
  return http.get('/admin/reports/summary', {
    params
  })
}

export const getSummaryReportApi = (params = {}) => {
  return http.get('/admin/reports/summary', {
    params
  })
}

export const getReportOverviewApi = (params = {}) => {
  return http.get('/admin/reports/summary', {
    params
  })
}

export const getReportDailyApi = (params = {}) => {
  return http.get('/admin/reports/daily', {
    params
  })
}

export const getDailyReportApi = (params = {}) => {
  return http.get('/admin/reports/daily', {
    params
  })
}

export const getDashboardReportApi = (params = {}) => {
  return http.get('/admin/reports/daily', {
    params
  })
}

export const getPlayRecordsApi = (params = {}) => {
  return http.get('/admin/reports/play-records', {
    params
  })
}

export const getRewardRecordsApi = (params = {}) => {
  return http.get('/admin/reports/reward-records', {
    params
  })
}

export const getRewardsApi = (params = {}) => {
  return http.get('/admin/reports/reward-records', {
    params
  })
}

// ===== Users =====

export const getUsersApi = (params = {}) => {
  return http.get('/admin/users', {
    params
  })
}

export const createUserApi = (data) => {
  return http.post('/admin/users', data)
}

export const updateUserApi = (id, data) => {
  return http.put(`/admin/users/${id}`, data)
}

export const deleteUserApi = (id) => {
  return http.delete(`/admin/users/${id}`)
}

export const updateUserMemberLevelApi = (id, data) => {
  return http.put(`/admin/users/${id}/member-level`, data)
}

export const updateUserLevelApi = (id, data) => {
  return http.put(`/admin/users/${id}/member-level`, data)
}

export const updateMemberLevelApi = (id, data) => {
  return http.put(`/admin/users/${id}/member-level`, data)
}

export const toggleUserStatusApi = (id, data) => {
  return http.put(`/admin/users/${id}/status`, data)
}

// ===== Rewards =====

export const getAdminRewardsApi = (params = {}) => {
  return http.get('/admin/rewards', {
    params
  })
}

export const getRewardListApi = (params = {}) => {
  return http.get('/admin/rewards', {
    params
  })
}

export const updateRewardStatusApi = (id, data) => {
  return http.put(`/admin/rewards/${id}/status`, data)
}

export const updateRewardApi = (id, data) => {
  return http.put(`/admin/rewards/${id}`, data)
}

export const deleteRewardApi = (id) => {
  return http.delete(`/admin/rewards/${id}`)
}

// ===== Download URLs =====

export const downloadPlayRecordsCsvUrl = (params = {}) => {
  const search = new URLSearchParams(params).toString()
  return `${API_BASE}/admin/reports/play-records/csv${search ? `?${search}` : ''}`
}

export const downloadPlayRecordsXlsxUrl = (params = {}) => {
  const search = new URLSearchParams(params).toString()
  return `${API_BASE}/admin/reports/play-records/xlsx${search ? `?${search}` : ''}`
}

export const downloadRewardRecordsCsvUrl = (params = {}) => {
  const search = new URLSearchParams(params).toString()
  return `${API_BASE}/admin/reports/reward-records/csv${search ? `?${search}` : ''}`
}

export const downloadRewardsCsvUrl = (params = {}) => {
  const search = new URLSearchParams(params).toString()
  return `${API_BASE}/admin/reports/reward-records/csv${search ? `?${search}` : ''}`
}

export const downloadRewardRecordsXlsxUrl = (params = {}) => {
  const search = new URLSearchParams(params).toString()
  return `${API_BASE}/admin/reports/reward-records/xlsx${search ? `?${search}` : ''}`
}

export const downloadRewardsXlsxUrl = (params = {}) => {
  const search = new URLSearchParams(params).toString()
  return `${API_BASE}/admin/reports/reward-records/xlsx${search ? `?${search}` : ''}`
}