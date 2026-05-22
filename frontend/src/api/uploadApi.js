// Multi Game Platform V2.3 Tenant Edition
// 第 105601～106000 批：圖片雲端上傳 API helper
//
// 覆蓋位置：
// frontend/src/api/uploadApi.js
//
// 本檔用途：
// 1. 將後台本機圖片檔案上傳到後端 /api/campaigns/upload-image。
// 2. 後端再轉存到雲端圖床，例如 Cloudinary。
// 3. 前端只保存回傳的 https 圖片 URL，不再保存 data:image/base64。

import http from './http'

const unwrapApiData = (response) => {
  return response?.data?.data ?? response?.data ?? response
}

export const uploadCampaignImageApi = async (file, meta = {}) => {
  if (!file) {
    throw new Error('請先選擇圖片檔案')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('gameType', meta.gameType || 'GOLDEN_EGG')
  formData.append('usage', meta.usage || 'campaign-image')
  formData.append('folder', meta.folder || 'campaign-assets')

  if (meta.campaignId) {
    formData.append('campaignId', String(meta.campaignId))
  }

  const response = await http.post('/campaigns/upload-image', formData)
  return unwrapApiData(response)
}

export default {
  uploadCampaignImageApi
}
