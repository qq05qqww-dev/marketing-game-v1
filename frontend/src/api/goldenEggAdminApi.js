// Multi Game Platform V2.2 Stable
// 第 316 批：後台金蛋資料庫 API Service
//
// 建議放置位置：
// src/api/goldenEggAdminApi.js

import { apiRequest } from './httpClient.js'

export const getAdminGoldenEggCampaign = (campaignId) => {
  return apiRequest(`/campaigns/${campaignId}`)
}

export const updateAdminGoldenEggCampaign = (campaignId, payload = {}) => {
  return apiRequest(`/campaigns/${campaignId}`, {
    method: 'PATCH',
    body: payload
  })
}

export const getAdminGoldenEggPrizes = (campaignId) => {
  return apiRequest(`/prizes/campaigns/${campaignId}/prizes`)
}

export const updateAdminGoldenEggGameConfig = (campaignId, settings = {}) => {
  return apiRequest(`/campaigns/${campaignId}/game-config`, {
    method: 'PUT',
    body: {
      settings
    }
  })
}

export const createAdminGoldenEggPrize = (campaignId, payload = {}) => {
  return apiRequest(`/prizes/campaigns/${campaignId}/prizes`, {
    method: 'POST',
    body: payload
  })
}

export const updateAdminGoldenEggPrize = (prizeId, payload = {}) => {
  return apiRequest(`/prizes/${prizeId}`, {
    method: 'PATCH',
    body: payload
  })
}

export const deleteAdminGoldenEggPrize = (prizeId) => {
  return apiRequest(`/prizes/${prizeId}`, {
    method: 'DELETE'
  })
}

export const getAdminGoldenEggSerialCodes = (campaignId) => {
  return apiRequest(`/serial-codes/campaigns/${campaignId}`)
}

export const generateAdminGoldenEggSerialCodes = (campaignId, payload = {}) => {
  return apiRequest(`/serial-codes/campaigns/${campaignId}/generate`, {
    method: 'POST',
    body: payload
  })
}

export const createAdminGoldenEggSerialCode = (campaignId, payload = {}) => {
  return apiRequest(`/serial-codes/campaigns/${campaignId}`, {
    method: 'POST',
    body: payload
  })
}

export const bulkCreateAdminGoldenEggSerialCodes = (campaignId, payload = {}) => {
  return apiRequest(`/serial-codes/campaigns/${campaignId}/bulk`, {
    method: 'POST',
    body: payload
  })
}

export const updateAdminGoldenEggSerialCode = (serialCodeId, payload = {}) => {
  return apiRequest(`/serial-codes/${serialCodeId}`, {
    method: 'PATCH',
    body: payload
  })
}

export const markAdminGoldenEggSerialDistributed = (serialCodeId, payload = {}) => {
  return apiRequest(`/serial-codes/${serialCodeId}/distribute`, {
    method: 'PATCH',
    body: payload
  })
}

export const deleteAdminGoldenEggSerialCode = (serialCodeId) => {
  return apiRequest(`/serial-codes/${serialCodeId}`, {
    method: 'DELETE'
  })
}

export const getAdminGoldenEggSerialExportUrl = (campaignId) => {
  return `http://localhost:3000/api/serial-codes/campaigns/${campaignId}/export.csv`
}

export const getAdminGoldenEggPlayRecords = (campaignId) => {
  return apiRequest(`/play-records/campaigns/${campaignId}`)
}

export const getAdminGoldenEggRewardRecords = (campaignId) => {
  return apiRequest(`/play-records/campaigns/${campaignId}/rewards`)
}

export const claimAdminGoldenEggRewardRecord = (rewardRecordId, payload = {}) => {
  return apiRequest(`/play-records/rewards/${rewardRecordId}/claim`, {
    method: 'PATCH',
    body: payload
  })
}

export const cancelAdminGoldenEggRewardRecord = (rewardRecordId, payload = {}) => {
  return apiRequest(`/play-records/rewards/${rewardRecordId}/cancel`, {
    method: 'PATCH',
    body: payload
  })
}

export const getAdminGoldenEggPlayRecordExportUrl = (campaignId) => {
  return `http://localhost:3000/api/play-records/campaigns/${campaignId}/export.csv`
}

export const getAdminGoldenEggDrawPool = (campaignId) => {
  return apiRequest(`/draw-engine/campaigns/${campaignId}/pool`)
}
