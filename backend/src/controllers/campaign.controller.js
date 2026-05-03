// Multi Game Platform V2.3 Tenant Edition
// 第 3 批：Campaign / GameConfig Controller tenantId 資料隔離版
//
// 覆蓋位置：
// backend/src/controllers/campaign.controller.js

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
    await deleteCampaign(req.params.id, getRequestUser(req))

    return successResponse(res, null, '刪除活動成功')
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
