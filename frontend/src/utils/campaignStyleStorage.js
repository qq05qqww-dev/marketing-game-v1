export const defaultCampaignStyleConfig = () => ({
  wheelBg1: '#67c5e8',
  wheelBg2: '#f4d34d',
  outerBorder1: '#111111',
  outerBorder2: '#f0c040',
  pointerColor: '#e11d48',
  centerBg: '#fff7cc',
  centerTextColor: '#0f172a',
  buttonText: '開始',
  buttonBg: '#34d399',
  buttonTextColor: '#ffffff',
  descriptionText: '立即登入抽驚喜好禮',
  descriptionColor: '#475569',
  buttonFontSize: 24,
  descriptionFontSize: 14,
  prizeTextColor: '#ffffff',
  showTopDescription: true
})

const getStorageKey = (campaignId) => `campaign_style_config_${campaignId}`

export const getCampaignStyleConfig = (campaignId) => {
  if (!campaignId) return defaultCampaignStyleConfig()

  try {
    const raw = localStorage.getItem(getStorageKey(campaignId))
    if (!raw) return defaultCampaignStyleConfig()

    return {
      ...defaultCampaignStyleConfig(),
      ...JSON.parse(raw)
    }
  } catch (error) {
    return defaultCampaignStyleConfig()
  }
}

export const saveCampaignStyleConfig = (campaignId, config) => {
  if (!campaignId) return

  localStorage.setItem(
    getStorageKey(campaignId),
    JSON.stringify({
      ...defaultCampaignStyleConfig(),
      ...config
    })
  )
}

export const resetCampaignStyleConfig = (campaignId) => {
  if (!campaignId) return
  localStorage.removeItem(getStorageKey(campaignId))
}