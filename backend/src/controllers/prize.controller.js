// Multi Game Platform V2.3 Tenant Edition
// 第 4 批：Prize 獎項 API 依 tenantId 隔離版
//
// 建議放置位置：
// backend/src/controllers/prize.controller.js

import {
  getPrizesByCampaignId,
  getPrizeById,
  createPrizeForCampaign,
  updatePrize,
  deletePrize,
  bulkUpdatePrizes,
  getProbabilitySummary
} from '../services/prize.service.js'
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse
} from '../utils/apiResponse.js'

const getAuthContext = (req) => req.user || null

export const listCampaignPrizes = async (req, res) => {
  try {
    const prizes = await getPrizesByCampaignId(
      req.params.campaignId,
      req.query,
      getAuthContext(req)
    )

    return successResponse(res, prizes, '取得獎項列表成功')
  } catch (error) {
    console.error('取得獎項列表失敗:', error)

    if (error.status === 400) {
      return validationErrorResponse(res, error.message)
    }

    if (error.status === 403) {
      return errorResponse(res, error.message || '沒有權限查看此活動獎項', 403, error.message)
    }

    if (error.status === 404) {
      return notFoundResponse(res, error.message || '找不到活動')
    }

    return errorResponse(res, '取得獎項列表失敗', error.status || 500, error.message)
  }
}

export const prizeDetail = async (req, res) => {
  try {
    const prize = await getPrizeById(req.params.id, getAuthContext(req))

    if (!prize) {
      return notFoundResponse(res, '找不到獎項')
    }

    return successResponse(res, prize, '取得獎項詳情成功')
  } catch (error) {
    console.error('取得獎項詳情失敗:', error)

    if (error.status === 403) {
      return errorResponse(res, error.message || '沒有權限查看此獎項', 403, error.message)
    }

    return errorResponse(res, '取得獎項詳情失敗', error.status || 500, error.message)
  }
}

export const createPrizeHandler = async (req, res) => {
  try {
    const prize = await createPrizeForCampaign(
      req.params.campaignId,
      req.body,
      getAuthContext(req)
    )

    return successResponse(res, prize, '建立獎項成功', 201)
  } catch (error) {
    console.error('建立獎項失敗:', error)

    if (error.status === 400) {
      return validationErrorResponse(res, error.message)
    }

    if (error.status === 403) {
      return errorResponse(res, error.message || '沒有權限建立此活動獎項', 403, error.message)
    }

    if (error.status === 404) {
      return notFoundResponse(res, error.message)
    }

    return errorResponse(res, '建立獎項失敗', error.status || 500, error.message)
  }
}

export const updatePrizeHandler = async (req, res) => {
  try {
    const prize = await updatePrize(req.params.id, req.body, getAuthContext(req))

    return successResponse(res, prize, '更新獎項成功')
  } catch (error) {
    console.error('更新獎項失敗:', error)

    if (error.code === 'P2025' || error.status === 404) {
      return notFoundResponse(res, error.message || '找不到獎項')
    }

    if (error.status === 400) {
      return validationErrorResponse(res, error.message)
    }

    if (error.status === 403) {
      return errorResponse(res, error.message || '沒有權限更新此獎項', 403, error.message)
    }

    return errorResponse(res, '更新獎項失敗', error.status || 500, error.message)
  }
}

export const deletePrizeHandler = async (req, res) => {
  try {
    await deletePrize(req.params.id, getAuthContext(req))

    return successResponse(res, null, '刪除獎項成功')
  } catch (error) {
    console.error('刪除獎項失敗:', error)

    if (error.code === 'P2025' || error.status === 404) {
      return notFoundResponse(res, error.message || '找不到獎項')
    }

    if (error.status === 400) {
      return validationErrorResponse(res, error.message)
    }

    if (error.status === 403) {
      return errorResponse(res, error.message || '沒有權限刪除此獎項', 403, error.message)
    }

    return errorResponse(res, '刪除獎項失敗', error.status || 500, error.message)
  }
}

export const bulkUpdatePrizesHandler = async (req, res) => {
  try {
    const prizes = await bulkUpdatePrizes(
      req.params.campaignId,
      req.body?.prizes || [],
      getAuthContext(req)
    )

    return successResponse(res, prizes, '批次儲存獎項成功')
  } catch (error) {
    console.error('批次儲存獎項失敗:', error)

    if (error.status === 400) {
      return validationErrorResponse(res, error.message)
    }

    if (error.status === 403) {
      return errorResponse(res, error.message || '沒有權限批次儲存此活動獎項', 403, error.message)
    }

    if (error.status === 404) {
      return notFoundResponse(res, error.message || '找不到活動')
    }

    return errorResponse(res, '批次儲存獎項失敗', error.status || 500, error.message)
  }
}

export const probabilitySummaryHandler = async (req, res) => {
  try {
    const summary = await getProbabilitySummary(req.params.campaignId, getAuthContext(req))

    return successResponse(res, summary, '取得機率統計成功')
  } catch (error) {
    console.error('取得機率統計失敗:', error)

    if (error.status === 400) {
      return validationErrorResponse(res, error.message)
    }

    if (error.status === 403) {
      return errorResponse(res, error.message || '沒有權限查看此活動機率統計', 403, error.message)
    }

    if (error.status === 404) {
      return notFoundResponse(res, error.message || '找不到活動')
    }

    return errorResponse(res, '取得機率統計失敗', error.status || 500, error.message)
  }
}
