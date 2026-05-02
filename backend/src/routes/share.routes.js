// Multi Game Platform V2.2 Stable
// 第 366 批：後端動態分享落地頁 OG 版
//
// 放置位置：
// backend/src/routes/share.routes.js

import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

const escapeHtml = (value = '') => {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

const getFrontendUrl = () => {
  return process.env.FRONTEND_URL || 'https://marketing-game-v1-em29.vercel.app'
}

const getBackendUrl = () => {
  return process.env.BACKEND_URL || 'https://marketing-game-api.onrender.com'
}

const normalizeUrl = (value, fallback = '') => {
  const url = String(value || '').trim()

  if (!url) return fallback

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  return fallback
}

const buildDefaultActivityUrl = (campaignId) => {
  return `${getFrontendUrl()}/games/golden-egg?campaignId=${encodeURIComponent(campaignId)}`
}

const buildFallbackImageUrl = () => {
  return `${getFrontendUrl()}/og-golden-egg.png`
}

const buildShareHtml = ({
  title,
  description,
  imageUrl,
  targetUrl,
  canonicalUrl
}) => {
  const safeTitle = escapeHtml(title)
  const safeDescription = escapeHtml(description)
  const safeImageUrl = escapeHtml(imageUrl)
  const safeTargetUrl = escapeHtml(targetUrl)
  const safeCanonicalUrl = escapeHtml(canonicalUrl)

  return `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />

    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Multi Game Platform" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:image" content="${safeImageUrl}" />
    <meta property="og:url" content="${safeCanonicalUrl}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDescription}" />
    <meta name="twitter:image" content="${safeImageUrl}" />

    <link rel="canonical" href="${safeCanonicalUrl}" />

    <meta http-equiv="refresh" content="0;url=${safeTargetUrl}" />
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #fff7ed;
        color: #111827;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .card {
        width: min(92vw, 520px);
        border-radius: 28px;
        background: #ffffff;
        box-shadow: 0 24px 80px rgba(15, 23, 42, 0.16);
        padding: 28px;
        text-align: center;
      }

      img {
        width: 100%;
        max-height: 280px;
        object-fit: cover;
        border-radius: 20px;
        margin-bottom: 18px;
      }

      h1 {
        margin: 0;
        font-size: 28px;
      }

      p {
        color: #64748b;
        line-height: 1.7;
      }

      a {
        display: inline-flex;
        margin-top: 12px;
        border-radius: 999px;
        background: #facc15;
        color: #7f1d1d;
        font-weight: 900;
        text-decoration: none;
        padding: 12px 20px;
      }
    </style>
    <script>
      window.location.replace(${JSON.stringify(targetUrl)})
    </script>
  </head>
  <body>
    <main class="card">
      <img src="${safeImageUrl}" alt="${safeTitle}" />
      <h1>${safeTitle}</h1>
      <p>${safeDescription}</p>
      <a href="${safeTargetUrl}">前往活動</a>
    </main>
  </body>
</html>`
}

router.get('/golden-egg', async (req, res, next) => {
  try {
    const campaignId = Number(req.query.campaignId || 1)

    if (!Number.isInteger(campaignId) || campaignId <= 0) {
      return res.status(400).send('Invalid campaignId')
    }

    const campaign = await prisma.campaign.findUnique({
      where: {
        id: campaignId
      },
      include: {
        gameConfig: true
      }
    })

    const settings = campaign?.gameConfig?.settings && typeof campaign.gameConfig.settings === 'object'
      ? campaign.gameConfig.settings
      : {}

    const title = settings.shareTitle || campaign?.title || '九宮格砸金蛋抽獎活動'
    const description = settings.shareDescription || campaign?.description || '輸入活動序號，立即砸金蛋抽好禮！'
    const targetUrl = normalizeUrl(settings.shareUrl, buildDefaultActivityUrl(campaignId))
    const imageUrl = normalizeUrl(settings.shareImageUrl, buildFallbackImageUrl())
    const canonicalUrl = `${getBackendUrl()}/share/golden-egg?campaignId=${encodeURIComponent(campaignId)}`

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=300')

    return res.send(
      buildShareHtml({
        title,
        description,
        imageUrl,
        targetUrl,
        canonicalUrl
      })
    )
  } catch (error) {
    return next(error)
  }
})

export default router
