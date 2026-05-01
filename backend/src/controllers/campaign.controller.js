// Multi Game Platform V2.2 Stable
// 第 306 批：Campaign / GameConfig Controller
//
// 建議放置位置：
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

export const listCampaigns = async (req, res) => {
  try {
    const campaigns = req.query.active === 'true'
      ? await getActiveCampaigns()
      : await getCampaigns(req.query)

    return successResponse(res, campaigns, '取得活動列表成功')
  } catch (error) {
    console.error('取得活動列表失敗:', error)
    return errorResponse(res, '取得活動列表失敗', 500, error.message)
  }
}

export const campaignDetail = async (req, res) => {
  try {
    const campaign = await getCampaignById(req.params.id)

    if (!campaign) {
      return notFoundResponse(res, '找不到活動')
    }

    return successResponse(res, campaign, '取得活動詳情成功')
  } catch (error) {
    console.error('取得活動詳情失敗:', error)
    return errorResponse(res, '取得活動詳情失敗', 500, error.message)
  }
}

export const createCampaignHandler = async (req, res) => {
  try {
    const campaign = await createCampaign(req.body)

    return successResponse(res, campaign, '建立活動成功', 201)
  } catch (error) {
    console.error('建立活動失敗:', error)

    if (error.status === 400) {
      return validationErrorResponse(res, error.message)
    }

    return errorResponse(res, '建立活動失敗', error.status || 500, error.message)
  }
}

export const updateCampaignHandler = async (req, res) => {
  try {
    const campaign = await updateCampaign(req.params.id, req.body)

    return successResponse(res, campaign, '更新活動成功')
  } catch (error) {
    console.error('更新活動失敗:', error)

    if (error.code === 'P2025') {
      return notFoundResponse(res, '找不到活動')
    }

    if (error.status === 400) {
      return validationErrorResponse(res, error.message)
    }

    return errorResponse(res, '更新活動失敗', error.status || 500, error.message)
  }
}

export const deleteCampaignHandler = async (req, res) => {
  try {
    await deleteCampaign(req.params.id)

    return successResponse(res, null, '刪除活動成功')
  } catch (error) {
    console.error('刪除活動失敗:', error)

    if (error.code === 'P2025') {
      return notFoundResponse(res, '找不到活動')
    }

    return errorResponse(res, '刪除活動失敗', error.status || 500, error.message)
  }
}

export const getGameConfigHandler = async (req, res) => {
  try {
    const gameConfig = await getGameConfigByCampaignId(req.params.id)

    if (!gameConfig) {
      return successResponse(
        res,
        {
          campaignId: Number(req.params.id),
          settings: {}
        },
        '此活動尚未建立遊戲設定，回傳空設定。'
      )
    }

    return successResponse(res, gameConfig, '取得遊戲設定成功')
  } catch (error) {
    console.error('取得遊戲設定失敗:', error)
    return errorResponse(res, '取得遊戲設定失敗', 500, error.message)
  }
}

export const upsertGameConfigHandler = async (req, res) => {
  try {
    const settings = req.body?.settings ?? req.body ?? {}
    const gameConfig = await upsertGameConfigByCampaignId(req.params.id, settings)

    return successResponse(res, gameConfig, '儲存遊戲設定成功')
  } catch (error) {
    console.error('儲存遊戲設定失敗:', error)

    if (error.status === 400) {
      return validationErrorResponse(res, error.message)
    }

    if (error.status === 404) {
      return notFoundResponse(res, error.message)
    }

    return errorResponse(res, '儲存遊戲設定失敗', error.status || 500, error.message)
  }
}
