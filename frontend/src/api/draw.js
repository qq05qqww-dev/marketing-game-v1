import http from './http'

const normalizeDrawPayload = (payload) => {
  if (typeof payload === 'number' || typeof payload === 'string') {
    return {
      campaignId: Number(payload)
    }
  }

  return {
    campaignId: Number(payload?.campaignId),
    gameType: payload?.gameType || '',
    selectedIndex: payload?.selectedIndex ?? null,
    selectedCard: payload?.selectedCard ?? null,
    selectedCell: payload?.selectedCell ?? null,
    scratchPosition: payload?.scratchPosition ?? null,
    clientTime: new Date().toISOString()
  }
}

export const playDrawApi = (payload) => {
  return http.post('/draw/play', normalizeDrawPayload(payload))
}

export const playGameApi = (payload) => {
  return http.post('/draw/play', normalizeDrawPayload(payload))
}

export const drawPlayApi = (payload) => {
  return http.post('/draw/play', normalizeDrawPayload(payload))
}