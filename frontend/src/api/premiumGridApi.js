/**
 * Multi Game Platform V2.3 第 384 批：新增精緻九宮格 premiumGridApi.js helper 落地版
 *
 * 檔案位置：
 * frontend/src/api/premiumGridApi.js
 *
 * 本批目的：
 * 1. 新增精緻九宮格專用前端 API helper。
 * 2. 底層沿用既有 Draw Engine endpoint。
 * 3. 只新增檔案，不修改 PremiumGridLotteryView.vue。
 * 4. 本批不呼叫 API、不改 router、不改 DB、不改抽獎核心。
 *
 * 已確認真實 endpoint：
 * - GET  /api/campaigns/:campaignId
 * - POST /api/draw-engine/campaigns/:campaignId/verify-serial
 * - POST /api/draw-engine/campaigns/:campaignId/play
 */

import http from './http'

export const PREMIUM_GRID_API_VERSION =
  'Multi Game Platform V2.3 第 384 批：新增精緻九宮格 premiumGridApi.js helper 落地版'

export const PREMIUM_GRID_DRAW_ENGINE_ENDPOINTS = {
  campaignDetail: (campaignId) => `/campaigns/${campaignId}`,
  verifySerial: (campaignId) => `/draw-engine/campaigns/${campaignId}/verify-serial`,
  play: (campaignId) => `/draw-engine/campaigns/${campaignId}/play`
}

const unwrapApiData = (response) => {
  return response?.data?.data ?? response?.data ?? response
}

const normalizeCampaignId = (campaignId) => {
  const normalized = Number(campaignId)

  if (!Number.isFinite(normalized) || normalized <= 0) {
    throw new Error('精緻九宮格 campaignId 無效')
  }

  return normalized
}

export const normalizePremiumGridSerialCode = (code = '') => {
  return String(code || '').trim().toUpperCase()
}

export const normalizePremiumGridPlayPayload = (payload = {}) => {
  const serialCode = normalizePremiumGridSerialCode(payload.serialCode || payload.code || '')
  const selectedCell = payload.selectedCell ?? payload.cell ?? payload.selectedIndex ?? null

  return {
    ...payload,
    gameType: 'GRID',
    code: serialCode,
    serialCode,
    selectedCell,
    selectedIndex: payload.selectedIndex ?? selectedCell,
    source: payload.source || payload.trafficSource || payload?.resultPayload?.source || 'direct',
    trafficSource:
      payload.trafficSource ||
      payload.source ||
      payload?.resultPayload?.trafficSource ||
      payload?.resultPayload?.source ||
      'direct',
    clientTime: payload.clientTime || new Date().toISOString()
  }
}

/**
 * 取得精緻九宮格活動詳情。
 *
 * 實際 endpoint：
 * GET /api/campaigns/:campaignId
 */
export const getPremiumGridCampaign = async (campaignId) => {
  const normalizedCampaignId = normalizeCampaignId(campaignId)
  const response = await http.get(PREMIUM_GRID_DRAW_ENGINE_ENDPOINTS.campaignDetail(normalizedCampaignId))

  return unwrapApiData(response)
}

/**
 * 驗證精緻九宮格序號。
 *
 * 實際 endpoint：
 * POST /api/draw-engine/campaigns/:campaignId/verify-serial
 *
 * 注意：
 * - 本 helper 只是包裝 API。
 * - 是否消耗序號由後端 draw-engine / serial flow 決定。
 */
export const verifyPremiumGridSerialCode = async (campaignId, code) => {
  const normalizedCampaignId = normalizeCampaignId(campaignId)
  const normalizedCode = normalizePremiumGridSerialCode(code)

  const response = await http.post(
    PREMIUM_GRID_DRAW_ENGINE_ENDPOINTS.verifySerial(normalizedCampaignId),
    {
      code: normalizedCode,
      serialCode: normalizedCode,
      gameType: 'GRID'
    }
  )

  return unwrapApiData(response)
}

/**
 * 精緻九宮格正式抽獎。
 *
 * 實際 endpoint：
 * POST /api/draw-engine/campaigns/:campaignId/play
 *
 * 注意：
 * - 中獎結果必須由後端決定。
 * - selectedCell 只作為玩家互動資料，不可由前端決定獎項。
 * - 正式頁接入前必須保留 commonGrid 測試隔離與 legacyGrid fallback。
 */
export const playPremiumGridDraw = async (campaignId, payload = {}) => {
  const normalizedCampaignId = normalizeCampaignId(campaignId)
  const normalizedPayload = normalizePremiumGridPlayPayload(payload)

  const response = await http.post(
    PREMIUM_GRID_DRAW_ENGINE_ENDPOINTS.play(normalizedCampaignId),
    normalizedPayload
  )

  return unwrapApiData(response)
}

/**
 * 只建立 request preview，不呼叫 API。
 * 給 commonGrid=1 測試區或後台檢查顯示用。
 */
export const createPremiumGridPlayRequestPreview = (campaignId, payload = {}) => {
  const normalizedPayload = normalizePremiumGridPlayPayload(payload)

  return {
    method: 'POST',
    endpoint: PREMIUM_GRID_DRAW_ENGINE_ENDPOINTS.play(campaignId || ':campaignId'),
    enabled: false,
    note: '這只是 preview，不會呼叫 API。',
    payload: normalizedPayload
  }
}

/**
 * 只建立 verify serial preview，不呼叫 API。
 */
export const createPremiumGridVerifySerialPreview = (campaignId, code = '') => {
  const normalizedCode = normalizePremiumGridSerialCode(code)

  return {
    method: 'POST',
    endpoint: PREMIUM_GRID_DRAW_ENGINE_ENDPOINTS.verifySerial(campaignId || ':campaignId'),
    enabled: false,
    note: '這只是 preview，不會呼叫 API。',
    payload: {
      code: normalizedCode,
      serialCode: normalizedCode,
      gameType: 'GRID'
    }
  }
}

export const getPremiumGridApiSummary = () => {
  return {
    version: PREMIUM_GRID_API_VERSION,
    helperFile: 'frontend/src/api/premiumGridApi.js',
    gameType: 'GRID',
    endpoints: {
      campaignDetail: 'GET /api/campaigns/:campaignId',
      verifySerial: 'POST /api/draw-engine/campaigns/:campaignId/verify-serial',
      play: 'POST /api/draw-engine/campaigns/:campaignId/play'
    },
    safety: {
      usesDrawEngine: true,
      usesPremiumGridPlayEndpoint: false,
      callsApiOnImport: false,
      changesRouter: false,
      changesDb: false,
      changesDrawCore: false
    },
    nextStep:
      'V2.3 第 385 批：精緻九宮格 commonGrid=1 測試區讀取 premiumGridApi helper 狀態版'
  }
}

export default {
  PREMIUM_GRID_API_VERSION,
  PREMIUM_GRID_DRAW_ENGINE_ENDPOINTS,
  normalizePremiumGridSerialCode,
  normalizePremiumGridPlayPayload,
  getPremiumGridCampaign,
  verifyPremiumGridSerialCode,
  playPremiumGridDraw,
  createPremiumGridPlayRequestPreview,
  createPremiumGridVerifySerialPreview,
  getPremiumGridApiSummary
}
