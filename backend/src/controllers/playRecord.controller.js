// Multi Game Platform V2.3 Tenant Edition
// 第 6 批：PlayRecord / RewardRecord Controller tenantId 隔離版
//
// 建議放置位置：
// backend/src/controllers/playRecord.controller.js

import {
  getPlayRecordsByCampaignId,
  getRewardRecordsByCampaignId,
  getPlayStatsByCampaignId,
  createPlayRecord,
  claimRewardRecord,
  cancelRewardRecord,
  exportPlayRecordsCsv
} from '../services/playRecord.service.js'
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse
} from '../utils/apiResponse.js'

export const listPlayRecords = async (req, res) => {
  try {
    const records = await getPlayRecordsByCampaignId(req.params.campaignId, req.query, req.user)

    return successResponse(res, records, '取得遊玩紀錄成功')
  } catch (error) {
    console.error('取得遊玩紀錄失敗:', error)

    if (error.status === 400) {
      return validationErrorResponse(res, error.message)
    }

    if (error.status === 404) {
      return notFoundResponse(res, error.message)
    }

    return errorResponse(res, '取得遊玩紀錄失敗', error.status || 500, error.message)
  }
}

export const listRewardRecords = async (req, res) => {
  try {
    const records = await getRewardRecordsByCampaignId(req.params.campaignId, req.query, req.user)

    return successResponse(res, records, '取得中獎紀錄成功')
  } catch (error) {
    console.error('取得中獎紀錄失敗:', error)

    if (error.status === 400) {
      return validationErrorResponse(res, error.message)
    }

    if (error.status === 404) {
      return notFoundResponse(res, error.message)
    }

    return errorResponse(res, '取得中獎紀錄失敗', error.status || 500, error.message)
  }
}

export const playStatsHandler = async (req, res) => {
  try {
    const stats = await getPlayStatsByCampaignId(req.params.campaignId, req.user)

    return successResponse(res, stats, '取得遊玩統計成功')
  } catch (error) {
    console.error('取得遊玩統計失敗:', error)

    if (error.status === 400) {
      return validationErrorResponse(res, error.message)
    }

    if (error.status === 404) {
      return notFoundResponse(res, error.message)
    }

    return errorResponse(res, '取得遊玩統計失敗', error.status || 500, error.message)
  }
}

export const createPlayRecordHandler = async (req, res) => {
  try {
    const result = await createPlayRecord(req.params.campaignId, req.body, req.user)

    return successResponse(res, result, '建立遊玩紀錄成功', 201)
  } catch (error) {
    console.error('建立遊玩紀錄失敗:', error)

    if (error.status === 400) {
      return validationErrorResponse(res, error.message)
    }

    if (error.status === 404) {
      return notFoundResponse(res, error.message)
    }

    return errorResponse(res, '建立遊玩紀錄失敗', error.status || 500, error.message)
  }
}

export const claimRewardHandler = async (req, res) => {
  try {
    const record = await claimRewardRecord(req.params.id, req.body, req.user)

    return successResponse(res, record, '核銷領獎成功')
  } catch (error) {
    console.error('核銷領獎失敗:', error)

    if (error.code === 'P2025' || error.status === 404) {
      return notFoundResponse(res, error.message || '找不到中獎紀錄')
    }

    if (error.status === 400) {
      return validationErrorResponse(res, error.message)
    }

    return errorResponse(res, '核銷領獎失敗', error.status || 500, error.message)
  }
}

export const cancelRewardHandler = async (req, res) => {
  try {
    const record = await cancelRewardRecord(req.params.id, req.body, req.user)

    return successResponse(res, record, '取消發獎成功')
  } catch (error) {
    console.error('取消發獎失敗:', error)

    if (error.code === 'P2025' || error.status === 404) {
      return notFoundResponse(res, error.message || '找不到中獎紀錄')
    }

    if (error.status === 400) {
      return validationErrorResponse(res, error.message)
    }

    return errorResponse(res, '取消發獎失敗', error.status || 500, error.message)
  }
}

export const exportPlayRecordsCsvHandler = async (req, res) => {
  try {
    const csv = await exportPlayRecordsCsv(req.params.campaignId, req.query, req.user)

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="play-records-campaign-${req.params.campaignId}-${Date.now()}.csv"`
    )

    return res.send(`\ufeff${csv}`)
  } catch (error) {
    console.error('匯出遊玩紀錄 CSV 失敗:', error)

    if (error.status === 400) {
      return validationErrorResponse(res, error.message)
    }

    if (error.status === 404) {
      return notFoundResponse(res, error.message)
    }

    return errorResponse(res, '匯出遊玩紀錄 CSV 失敗', error.status || 500, error.message)
  }
}
