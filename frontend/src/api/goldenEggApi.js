import http from './http'

const unwrapApiData = (response) => {
  return response?.data?.data ?? response?.data ?? response
}

export const getGoldenEggCampaign = async (campaignId) => {
  const response = await http.get(`/campaigns/${campaignId}`)
  return unwrapApiData(response)
}

export const verifyGoldenEggSerialCode = async (campaignId, code) => {
  const response = await http.post(`/draw-engine/campaigns/${campaignId}/verify-serial`, {
    code: String(code || '').trim().toUpperCase()
  })

  return unwrapApiData(response)
}

export const playGoldenEggDraw = async (campaignId, payload = {}) => {
  const serialCode = String(payload.serialCode || payload.code || '').trim().toUpperCase()

  const response = await http.post(`/draw-engine/campaigns/${campaignId}/play`, {
    ...payload,
    gameType: 'GOLDEN_EGG',
    code: serialCode,
    serialCode,
    source: payload.source || payload.trafficSource || payload?.resultPayload?.source || 'direct',
    trafficSource: payload.trafficSource || payload.source || payload?.resultPayload?.trafficSource || payload?.resultPayload?.source || 'direct'
  })

  return unwrapApiData(response)
}

export default {
  getGoldenEggCampaign,
  verifyGoldenEggSerialCode,
  playGoldenEggDraw
}
