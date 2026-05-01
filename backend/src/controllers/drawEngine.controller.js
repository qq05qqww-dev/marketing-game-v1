// Multi Game Platform V2.2 Stable
// 第 339 批：Draw Engine Controller 正式安全補強版
//
// 建議放置位置：
// backend/src/controllers/drawEngine.controller.js

import {
  runDrawEngine,
  previewDrawPool,
  verifySerialCodeForDraw
} from '../services/drawEngine.service.js'
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse
} from '../utils/apiResponse.js'

const handleDrawEngineError = (res, error, fallbackMessage = '操作失敗') => {
  const status = error.status || 500

  if (status === 400) {
    return validationErrorResponse(res, error.message)
  }

  if (status === 404) {
    return notFoundResponse(res, error.message)
  }

  if (status === 409 || status === 429) {
    return errorResponse(res, error.message, status)
  }

  return errorResponse(
    res,
    fallbackMessage,
    status,
    process.env.NODE_ENV === 'production' ? undefined : error.message
  )
}

export const playDrawHandler = async (req, res) => {
  try {
    const result = await runDrawEngine(req.params.campaignId, {
      ...req.body,
      userId: req.user?.id || req.body?.userId || null,
      playerIp: req.ip,
      userAgent: req.headers['user-agent'] || ''
    })

    return successResponse(res, result, '抽獎成功', 201)
  } catch (error) {
    console.error('抽獎失敗:', error)

    return handleDrawEngineError(res, error, '抽獎失敗')
  }
}

export const drawPoolPreviewHandler = async (req, res) => {
  try {
    const result = await previewDrawPool(req.params.campaignId)

    return successResponse(res, result, '取得抽獎池成功')
  } catch (error) {
    console.error('取得抽獎池失敗:', error)

    return handleDrawEngineError(res, error, '取得抽獎池失敗')
  }
}

export const verifySerialCodeHandler = async (req, res) => {
  try {
    const result = await verifySerialCodeForDraw(req.params.campaignId, req.body?.code)

    return successResponse(res, result, '檢查序號完成')
  } catch (error) {
    console.error('檢查序號失敗:', error)

    return handleDrawEngineError(res, error, '檢查序號失敗')
  }
}
