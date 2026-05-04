// Multi Game Platform V2.3 Tenant Edition
// 第 5 批：SerialCode 序號 API 依 tenantId 隔離版
//
// 建議放置位置：
// backend/src/controllers/serialCode.controller.js

import {
  getSerialCodesByCampaignId,
  getSerialCodeStats,
  createSerialCodeForCampaign,
  bulkCreateSerialCodesForCampaign,
  generateSerialCodesForCampaign,
  updateSerialCode,
  markSerialCodeDistributed,
  bulkUpdateSerialCodesByIds,
  bulkUpdateSerialCodesByFilter,
  exportSerialCodesCsv,
  redeemSerialCode,
  deleteSerialCode
} from '../services/serialCode.service.js'
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse
} from '../utils/apiResponse.js'

const handleSerialCodeError = (res, error, fallbackMessage) => {
  if (error.status === 400) {
    return validationErrorResponse(res, error.message)
  }

  if (error.status === 404) {
    return notFoundResponse(res, error.message)
  }

  if (error.status === 409) {
    return errorResponse(res, error.message, 409)
  }

  if (error.status === 403) {
    return errorResponse(res, error.message, 403)
  }

  return errorResponse(res, fallbackMessage, error.status || 500, error.message)
}

export const listSerialCodes = async (req, res) => {
  try {
    const serialCodes = await getSerialCodesByCampaignId(
      req.params.campaignId,
      req.query,
      req.user
    )

    return successResponse(res, serialCodes, '取得序號列表成功')
  } catch (error) {
    console.error('取得序號列表失敗:', error)
    return handleSerialCodeError(res, error, '取得序號列表失敗')
  }
}

export const serialCodeStatsHandler = async (req, res) => {
  try {
    const stats = await getSerialCodeStats(req.params.campaignId, req.user)

    return successResponse(res, stats, '取得序號統計成功')
  } catch (error) {
    console.error('取得序號統計失敗:', error)
    return handleSerialCodeError(res, error, '取得序號統計失敗')
  }
}

export const createSerialCodeHandler = async (req, res) => {
  try {
    const serialCode = await createSerialCodeForCampaign(
      req.params.campaignId,
      req.body,
      req.user
    )

    return successResponse(res, serialCode, '建立序號成功', 201)
  } catch (error) {
    console.error('建立序號失敗:', error)

    if (error.code === 'P2002') {
      return validationErrorResponse(res, '序號已存在，不能重複建立')
    }

    return handleSerialCodeError(res, error, '建立序號失敗')
  }
}

export const bulkCreateSerialCodesHandler = async (req, res) => {
  try {
    const result = await bulkCreateSerialCodesForCampaign(
      req.params.campaignId,
      req.body,
      req.user
    )

    return successResponse(res, result, '批次建立序號成功', 201)
  } catch (error) {
    console.error('批次建立序號失敗:', error)
    return handleSerialCodeError(res, error, '批次建立序號失敗')
  }
}

export const generateSerialCodesHandler = async (req, res) => {
  try {
    const result = await generateSerialCodesForCampaign(
      req.params.campaignId,
      req.body,
      req.user
    )

    return successResponse(res, result, '自動產生序號成功', 201)
  } catch (error) {
    console.error('自動產生序號失敗:', error)
    return handleSerialCodeError(res, error, '自動產生序號失敗')
  }
}

export const updateSerialCodeHandler = async (req, res) => {
  try {
    const serialCode = await updateSerialCode(req.params.id, req.body, req.user)

    return successResponse(res, serialCode, '更新序號成功')
  } catch (error) {
    console.error('更新序號失敗:', error)

    if (error.code === 'P2025') {
      return notFoundResponse(res, '找不到序號')
    }

    return handleSerialCodeError(res, error, '更新序號失敗')
  }
}

export const markDistributedHandler = async (req, res) => {
  try {
    const serialCode = await markSerialCodeDistributed(req.params.id, req.body, req.user)

    return successResponse(res, serialCode, '標記序號發放成功')
  } catch (error) {
    console.error('標記序號發放失敗:', error)

    if (error.code === 'P2025') {
      return notFoundResponse(res, '找不到序號')
    }

    return handleSerialCodeError(res, error, '標記序號發放失敗')
  }
}

export const bulkUpdateByIdsHandler = async (req, res) => {
  try {
    const result = await bulkUpdateSerialCodesByIds(
      req.body?.ids || [],
      req.body?.data || {},
      req.user
    )

    return successResponse(res, result, '批次更新序號成功')
  } catch (error) {
    console.error('批次更新序號失敗:', error)
    return handleSerialCodeError(res, error, '批次更新序號失敗')
  }
}

export const bulkUpdateByFilterHandler = async (req, res) => {
  try {
    const result = await bulkUpdateSerialCodesByFilter(
      req.params.campaignId,
      req.body?.filter || {},
      req.body?.data || {},
      req.user
    )

    return successResponse(res, result, '依篩選條件批次更新序號成功')
  } catch (error) {
    console.error('依篩選條件批次更新序號失敗:', error)
    return handleSerialCodeError(res, error, '依篩選條件批次更新序號失敗')
  }
}

export const exportSerialCodesCsvHandler = async (req, res) => {
  try {
    const csv = await exportSerialCodesCsv(req.params.campaignId, req.query, req.user)

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="serial-codes-campaign-${req.params.campaignId}-${Date.now()}.csv"`
    )

    return res.send(`\ufeff${csv}`)
  } catch (error) {
    console.error('匯出序號 CSV 失敗:', error)
    return handleSerialCodeError(res, error, '匯出序號 CSV 失敗')
  }
}

export const redeemSerialCodeHandler = async (req, res) => {
  try {
    const result = await redeemSerialCode(req.params.campaignId, req.body)

    return successResponse(res, result, '序號兌換成功')
  } catch (error) {
    console.error('序號兌換失敗:', error)
    return handleSerialCodeError(res, error, '序號兌換失敗')
  }
}

export const deleteSerialCodeHandler = async (req, res) => {
  try {
    await deleteSerialCode(req.params.id, req.user)

    return successResponse(res, null, '刪除序號成功')
  } catch (error) {
    console.error('刪除序號失敗:', error)

    if (error.code === 'P2025') {
      return notFoundResponse(res, '找不到序號')
    }

    return handleSerialCodeError(res, error, '刪除序號失敗')
  }
}
