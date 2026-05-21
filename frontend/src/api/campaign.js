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


const GAME_CONFIG_GET_CANDIDATE_URLS = (id) => [
  `/campaigns/${id}/game-config`,
  `/admin/campaigns/${id}/game-config`,
  `/campaigns/${id}`,
  `/admin/campaigns/${id}`
]

const GAME_CONFIG_SAVE_CANDIDATE_URLS = (id) => [
  `/campaigns/${id}/game-config`,
  `/admin/campaigns/${id}/game-config`,
  `/campaigns/${id}`,
  `/admin/campaigns/${id}`
]

const isRouteNotFoundError = (error) => {
  return [404, 405].includes(Number(error?.response?.status))
}

const requestWithFallback = async (candidates = [], requestFactory) => {
  let lastError = null

  for (const url of candidates) {
    try {
      return await requestFactory(url)
    } catch (error) {
      lastError = error

      if (!isRouteNotFoundError(error)) {
        throw error
      }
    }
  }

  if (lastError) {
    lastError.__fallbackUrls = candidates
  }

  throw lastError
}

export const getCampaignGameConfigApi = (id) => {
  return requestWithFallback(GAME_CONFIG_GET_CANDIDATE_URLS(id), async (url) => {
    return http.get(url)
  })
}

const getPremiumGridActivityTimeForCampaignSync = (settings = {}) => {
  const activityTime = settings?.activityTime || settings?.activity || settings?.timeSettings || {}

  return {
    startAt: activityTime?.startAt || activityTime?.startTime || activityTime?.startedAt || undefined,
    endAt: activityTime?.endAt || activityTime?.endTime || activityTime?.endedAt || undefined
  }
}

const buildCampaignGameConfigSaveBody = (settings = {}) => {
  const activityTimeSync = getPremiumGridActivityTimeForCampaignSync(settings)

  return {
    settings,
    gameConfig: {
      settings
    },
    // 第 102001～102400 批：讓九宮格後台活動時間成為統一來源。
    // 支援後端 game-config handler 若有同步 Campaign.startAt/endAt，也支援 fallback PATCH /campaigns/:id。
    startAt: activityTimeSync.startAt,
    endAt: activityTimeSync.endAt,
    activityTimeSource: 'GAME_CONFIG_SETTINGS_ACTIVITY_TIME',
    source: 'AdminPremiumGridSettingsView',
    savedAt: new Date().toISOString()
  }
}

export const saveCampaignGameConfigApi = (id, settings = {}) => {
  const body = buildCampaignGameConfigSaveBody(settings)

  return requestWithFallback(GAME_CONFIG_SAVE_CANDIDATE_URLS(id), async (url) => {
    if (url.includes('/game-config')) {
      return http.put(url, body)
    }

    return http.patch(url, {
      ...body,
      title:
        settings?.basicText?.pageTitle ||
        settings?.basicText?.headline ||
        undefined
    })
  })
}

export const upsertCampaignGameConfigApi = saveCampaignGameConfigApi

export const reloadCampaignGameConfigApi = (id) => {
  return getCampaignGameConfigApi(id)
}



export const getTenantPremiumGridCampaignApi = (tenantSlug) => {
  return http.get('/campaigns', {
    params: {
      tenantSlug,
      gameType: 'GRID',
      status: 'ACTIVE'
    }
  })
}

export const getTenantPremiumGridCampaignsApi = (tenantSlug) => {
  return http.get('/campaigns', {
    params: {
      tenantSlug,
      gameType: 'GRID'
    }
  })
}

export const verifyDrawEngineSerialApi = (campaignId, data = {}) => {
  return http.post(`/draw-engine/campaigns/${campaignId}/verify-serial`, data)
}

export const playDrawEngineCampaignApi = (campaignId, data = {}) => {
  return http.post(`/draw-engine/campaigns/${campaignId}/play`, data)
}

export const getTenantWheelCampaignApi = (tenantSlug) => {
  return http.get('/campaigns', {
    params: {
      tenantSlug,
      gameType: 'WHEEL',
      status: 'ACTIVE'
    }
  })
}

export const getTenantGoldenEggCampaignApi = (tenantSlug) => {
  return http.get('/campaigns', {
    params: {
      tenantSlug,
      gameType: 'GOLDEN_EGG',
      status: 'ACTIVE'
    }
  })
}

export const getTenantOfficialGameCampaignsApi = (tenantSlug) => {
  return http.get('/campaigns', {
    params: {
      tenantSlug,
      status: 'ACTIVE'
    }
  })
}

export const getTenantCampaignsApi = (tenantSlug, params = {}) => {
  return http.get('/campaigns', {
    params: {
      ...params,
      tenantSlug
    }
  })
}

export const createCampaignApi = (data) => {
  return http.post('/campaigns', data)
}

export const updateCampaignApi = (id, data) => {
  return http.patch(`/campaigns/${id}`, data)
}

export const deleteCampaignApi = (id) => {
  return http.delete(`/campaigns/${id}`)
}


// ===== Serial Codes =====

export const getCampaignSerialCodesApi = (campaignId, params = {}) => {
  return http.get(`/serial-codes/campaigns/${campaignId}`, {
    params
  })
}

export const getCampaignSerialCodeStatsApi = (campaignId) => {
  return http.get(`/serial-codes/campaigns/${campaignId}/stats`)
}

export const createCampaignSerialCodeApi = (campaignId, data = {}) => {
  return http.post(`/serial-codes/campaigns/${campaignId}/manual`, data)
}

export const generateCampaignSerialCodesApi = (campaignId, data = {}) => {
  return http.post(`/serial-codes/campaigns/${campaignId}/generate`, data)
}

export const updateSerialCodeApi = (id, data = {}) => {
  return http.patch(`/serial-codes/${id}`, data)
}

export const deleteSerialCodeApi = (id) => {
  return http.delete(`/serial-codes/${id}`)
}

// ===== Prize =====
// 第 90801～91200 批：獎項管理商家活動資料隔離修正版
// 正式獎項管理一律走 /api/prizes/campaigns/:campaignId/prizes。
// 不再使用舊的 /admin/prizes 全域入口，避免 A 商家與 B 商家共用同一批獎項。

const normalizePrizeCampaignId = (value) => {
  const campaignId = Number(value)

  if (!Number.isInteger(campaignId) || campaignId <= 0) {
    return null
  }

  return campaignId
}

const splitPrizeParams = (params = {}) => {
  if (typeof params === 'number' || typeof params === 'string') {
    return {
      campaignId: normalizePrizeCampaignId(params),
      query: {}
    }
  }

  const campaignId = normalizePrizeCampaignId(params.campaignId)
  const { campaignId: _campaignId, ...query } = params || {}

  return {
    campaignId,
    query
  }
}

const assertPrizeCampaignId = (campaignId) => {
  const normalizedCampaignId = normalizePrizeCampaignId(campaignId)

  if (!normalizedCampaignId) {
    throw new Error('獎項管理需要指定 campaignId，避免讀取或修改到其他商家的獎項。')
  }

  return normalizedCampaignId
}

export const getPrizesApi = (params = {}) => {
  return getCampaignPrizesApi(params)
}

export const getCampaignPrizesApi = (params = {}) => {
  const { campaignId, query } = splitPrizeParams(params)
  const normalizedCampaignId = assertPrizeCampaignId(campaignId)

  return http.get(`/prizes/campaigns/${normalizedCampaignId}/prizes`, {
    params: query
  })
}

export const getCampaignPrizeProbabilitySummaryApi = (campaignId) => {
  const normalizedCampaignId = assertPrizeCampaignId(campaignId)

  return http.get(`/prizes/campaigns/${normalizedCampaignId}/probability-summary`)
}

export const createPrizeApi = (data = {}) => {
  const normalizedCampaignId = assertPrizeCampaignId(data.campaignId)

  return http.post(`/prizes/campaigns/${normalizedCampaignId}/prizes`, {
    ...data,
    campaignId: normalizedCampaignId
  })
}

export const bulkUpdateCampaignPrizesApi = (campaignId, prizes = []) => {
  const normalizedCampaignId = assertPrizeCampaignId(campaignId)

  return http.put(`/prizes/campaigns/${normalizedCampaignId}/prizes/bulk`, {
    prizes
  })
}

export const updatePrizeApi = (id, data = {}) => {
  return http.patch(`/prizes/${id}`, data)
}

export const deletePrizeApi = (id) => {
  return http.delete(`/prizes/${id}`)
}

// ===== Draw / Game Play =====

// 第 99601～100000 批：九宮格正式抽獎統一走 Draw Engine。
// 若舊頁面或舊元件仍呼叫 playDrawApi / playGameApi / drawPlayApi，
// 只要 gameType 是 GRID / PREMIUM_GRID，就強制改打 /draw-engine/campaigns/:id/play，
// 避免誤進舊的 /api/draw/play → playDrawWithPrisma() 流程。
const isPremiumGridDrawPayload = (data = {}) => {
  const gameType = String(data?.gameType || data?.clientMeta?.gameType || '').toUpperCase()
  return gameType === 'GRID' || gameType === 'PREMIUM_GRID' || gameType === 'PREMIUM-GRID'
}

const getCampaignIdFromDrawPayload = (data = {}) => {
  const campaignId = Number(data?.campaignId || data?.id || data?.campaign?.id || 0)
  return Number.isFinite(campaignId) && campaignId > 0 ? campaignId : null
}

const postLegacyCompatibleDrawApi = (data = {}) => {
  const campaignId = getCampaignIdFromDrawPayload(data)

  if (isPremiumGridDrawPayload(data) && campaignId) {
    return playDrawEngineCampaignApi(campaignId, {
      ...data,
      gameType: 'GRID',
      resultPayload: {
        ...(data.resultPayload || {}),
        legacyHelperRedirected: true,
        legacyHelperName: 'playDrawApi',
        probabilitySource: 'GAME_CONFIG_SETTINGS',
        probabilityMode: 'BACKEND_DRAW_ENGINE'
      }
    })
  }

  return http.post('/draw/play', data)
}

export const playDrawApi = (data) => {
  return postLegacyCompatibleDrawApi(data)
}

export const playGameApi = (data) => {
  return postLegacyCompatibleDrawApi(data)
}

export const drawPlayApi = (data) => {
  return postLegacyCompatibleDrawApi(data)
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