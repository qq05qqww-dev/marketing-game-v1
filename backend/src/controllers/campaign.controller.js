// Multi Game Platform V2.3 Tenant Edition
// 第 105601～106000 批：活動圖片雲端上傳入口版
// 第 21101～21500 批：Campaign Controller 九宮格設定儲存結果回傳版
//
// 覆蓋位置：
// backend/src/controllers/campaign.controller.js

import crypto from 'crypto'

import {
  getCampaigns,
  getActiveCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getGameConfigByCampaignId,
  upsertGameConfigByCampaignId
} from '../services/campaign.service.js'
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse
} from '../utils/apiResponse.js'


const normalizeUploadText = (value = '', fallback = '') => {
  const normalized = String(value || '').trim()
  return normalized || fallback
}

const sanitizeCloudinaryFolderPart = (value = '', fallback = 'campaign-assets') => {
  const normalized = String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || fallback
}

const buildCloudinarySignature = (params = {}, apiSecret = '') => {
  const payload = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&')

  return crypto.createHash('sha1').update(`${payload}${apiSecret}`).digest('hex')
}

const assertCloudinaryConfig = () => {
  const cloudName = normalizeUploadText(process.env.CLOUDINARY_CLOUD_NAME)
  const apiKey = normalizeUploadText(process.env.CLOUDINARY_API_KEY)
  const apiSecret = normalizeUploadText(process.env.CLOUDINARY_API_SECRET)

  if (!cloudName || !apiKey || !apiSecret) {
    const error = new Error('尚未設定雲端圖片上傳環境變數：CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET')
    error.status = 500
    throw error
  }

  return { cloudName, apiKey, apiSecret }
}

const uploadImageBufferToCloudinary = async ({ file, campaignId = '', gameType = '', usage = '', folder = '' } = {}) => {
  const { cloudName, apiKey, apiSecret } = assertCloudinaryConfig()

  const timestamp = Math.floor(Date.now() / 1000)
  const safeFolder = [
    sanitizeCloudinaryFolderPart(process.env.CLOUDINARY_FOLDER || 'marketing-game'),
    sanitizeCloudinaryFolderPart(gameType || 'campaign'),
    campaignId ? `campaign-${sanitizeCloudinaryFolderPart(campaignId, 'unknown')}` : 'general',
    sanitizeCloudinaryFolderPart(folder || usage || 'images')
  ].join('/')

  const uploadParams = {
    folder: safeFolder,
    overwrite: 'false',
    timestamp
  }

  const signature = buildCloudinarySignature(uploadParams, apiSecret)
  const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
  const body = new URLSearchParams()
  body.set('file', dataUri)
  body.set('api_key', apiKey)
  body.set('timestamp', String(timestamp))
  body.set('folder', uploadParams.folder)
  body.set('overwrite', uploadParams.overwrite)
  body.set('signature', signature)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body
  })

  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = result?.error?.message || result?.message || '雲端圖片上傳失敗'
    const error = new Error(message)
    error.status = response.status || 500
    throw error
  }

  return result
}

const getRequestUser = (req) => req.user || null

const handleTenantAwareError = (res, error, fallbackMessage) => {
  if (error.status === 400) {
    return validationErrorResponse(res, error.message)
  }

  if (error.status === 403) {
    return errorResponse(res, error.message || '沒有權限', 403, error.message)
  }

  if (error.status === 404 || error.code === 'P2025') {
    return notFoundResponse(res, error.message || '找不到資料')
  }

  return errorResponse(res, fallbackMessage, error.status || 500, error.message)
}

export const listCampaigns = async (req, res) => {
  try {
    const user = getRequestUser(req)
    const campaigns = req.query.active === 'true'
      ? await getActiveCampaigns(user)
      : await getCampaigns(req.query, user)

    return successResponse(res, campaigns, '取得活動列表成功')
  } catch (error) {
    console.error('取得活動列表失敗:', error)
    return handleTenantAwareError(res, error, '取得活動列表失敗')
  }
}

export const campaignDetail = async (req, res) => {
  try {
    const campaign = await getCampaignById(req.params.id, getRequestUser(req))

    if (!campaign) {
      return notFoundResponse(res, '找不到活動，或沒有權限查看此活動')
    }

    return successResponse(res, campaign, '取得活動詳情成功')
  } catch (error) {
    console.error('取得活動詳情失敗:', error)
    return handleTenantAwareError(res, error, '取得活動詳情失敗')
  }
}

export const createCampaignHandler = async (req, res) => {
  try {
    const campaign = await createCampaign(req.body, getRequestUser(req))

    return successResponse(res, campaign, '建立活動成功', 201)
  } catch (error) {
    console.error('建立活動失敗:', error)
    return handleTenantAwareError(res, error, '建立活動失敗')
  }
}

export const updateCampaignHandler = async (req, res) => {
  try {
    const campaign = await updateCampaign(req.params.id, req.body, getRequestUser(req))

    return successResponse(res, campaign, '更新活動成功')
  } catch (error) {
    console.error('更新活動失敗:', error)
    return handleTenantAwareError(res, error, '更新活動失敗')
  }
}

export const deleteCampaignHandler = async (req, res) => {
  try {
    const result = await deleteCampaign(req.params.id, getRequestUser(req))

    return successResponse(res, result, '刪除活動成功')
  } catch (error) {
    console.error('刪除活動失敗:', error)
    return handleTenantAwareError(res, error, '刪除活動失敗')
  }
}

export const getGameConfigHandler = async (req, res) => {
  try {
    const gameConfig = await getGameConfigByCampaignId(req.params.id, getRequestUser(req))

    if (!gameConfig) {
      return successResponse(
        res,
        {
          campaignId: Number(req.params.id),
          settings: {}
        },
        '此活動尚未建立遊戲設定，或沒有權限查看此活動設定。'
      )
    }

    return successResponse(res, gameConfig, '取得遊戲設定成功')
  } catch (error) {
    console.error('取得遊戲設定失敗:', error)
    return handleTenantAwareError(res, error, '取得遊戲設定失敗')
  }
}

export const upsertGameConfigHandler = async (req, res) => {
  try {
    const settings = req.body?.settings ?? req.body ?? {}
    const gameConfig = await upsertGameConfigByCampaignId(
      req.params.id,
      settings,
      getRequestUser(req)
    )

    return successResponse(res, gameConfig, '儲存遊戲設定成功')
  } catch (error) {
    console.error('儲存遊戲設定失敗:', error)
    return handleTenantAwareError(res, error, '儲存遊戲設定失敗')
  }
}


export const uploadCampaignImageHandler = async (req, res) => {
  try {
    const file = req.file

    if (!file) {
      return validationErrorResponse(res, '請先選擇圖片檔案')
    }

    if (!String(file.mimetype || '').startsWith('image/')) {
      return validationErrorResponse(res, '只允許上傳圖片檔案')
    }

    const campaignId = normalizeUploadText(req.body?.campaignId)
    const gameType = normalizeUploadText(req.body?.gameType, 'CAMPAIGN')
    const usage = normalizeUploadText(req.body?.usage, 'campaign-image')
    const folder = normalizeUploadText(req.body?.folder, 'images')

    const uploaded = await uploadImageBufferToCloudinary({
      file,
      campaignId,
      gameType,
      usage,
      folder
    })

    return successResponse(
      res,
      {
        url: uploaded.secure_url || uploaded.url,
        secureUrl: uploaded.secure_url || uploaded.url,
        publicId: uploaded.public_id,
        width: uploaded.width,
        height: uploaded.height,
        bytes: uploaded.bytes,
        format: uploaded.format,
        resourceType: uploaded.resource_type,
        provider: 'cloudinary',
        campaignId: campaignId || null,
        gameType,
        usage
      },
      '圖片已上傳到雲端'
    )
  } catch (error) {
    console.error('圖片雲端上傳失敗:', error)
    return handleTenantAwareError(res, error, '圖片雲端上傳失敗')
  }
}
