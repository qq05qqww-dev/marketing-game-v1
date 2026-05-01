// Multi Game Platform V2.2 Stable
// 第 305 批：API 回應工具
//
// 建議放置位置：
// backend/src/utils/apiResponse.js

export const successResponse = (res, data = null, message = 'success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  })
}

export const errorResponse = (res, message = 'server error', statusCode = 500, details = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    details
  })
}

export const notFoundResponse = (res, message = 'resource not found') => {
  return errorResponse(res, message, 404)
}

export const validationErrorResponse = (res, message = 'validation error', details = null) => {
  return errorResponse(res, message, 400, details)
}
