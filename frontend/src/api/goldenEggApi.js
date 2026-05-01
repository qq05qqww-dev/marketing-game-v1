// Multi Game Platform V2.2 Stable
// 第 313 批：金蛋前台 API Service
//
// 建議放置位置：
// src/api/goldenEggApi.js

import { apiRequest } from './httpClient.js'

export const getGoldenEggCampaign = (campaignId) => {
  return apiRequest(`/campaigns/${campaignId}`)
}

export const getGoldenEggPrizes = (campaignId) => {
  return apiRequest(`/prizes/campaigns/${campaignId}/prizes`)
}

export const getGoldenEggGameConfig = (campaignId) => {
  return apiRequest(`/campaigns/${campaignId}/game-config`)
}

export const getGoldenEggDrawPool = (campaignId) => {
  return apiRequest(`/draw-engine/campaigns/${campaignId}/pool`)
}

export const verifyGoldenEggSerialCode = (campaignId, code) => {
  return apiRequest(`/draw-engine/campaigns/${campaignId}/verify-serial`, {
    method: 'POST',
    body: {
      code
    }
  })
}

export const playGoldenEggDraw = (campaignId, payload = {}) => {
  return apiRequest(`/draw-engine/campaigns/${campaignId}/play`, {
    method: 'POST',
    body: payload
  })
}
