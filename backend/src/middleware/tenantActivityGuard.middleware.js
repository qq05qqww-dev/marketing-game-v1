// Multi Game Platform V2.3 Tenant Edition
// 第 77601～78000 批：商家停用自動封鎖名下活動玩家入口版
//
// 覆蓋位置：
// backend/src/middleware/tenantActivityGuard.middleware.js
//
// 修正重點：
// 1. 商家 tenant.status 不是 ACTIVE 時，正式玩家頁不可讀取活動詳情 / game-config。
// 2. 商家 tenant.status 不是 ACTIVE 時，draw-engine verify-serial / play / pool 全部禁止。
// 3. 不直接改掉 campaign.status，保留活動原本狀態；商家恢復 ACTIVE 後活動可依原狀繼續。
// 4. 平台管理員 / 商家管理員仍可讀後台資料做維護；但 draw-engine 玩家操作永遠會被封鎖。
// 5. 不改 DB schema / router schema / draw-core 演算法。

import prisma from '../config/prisma.js'

const ACTIVE_STATUS = 'ACTIVE'
const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN', 'MERCHANT_ADMIN', 'MERCHANT_STAFF'])

const normalizeStatus = (value = '') => String(value || '').trim().toUpperCase()
const normalizeRole = (value = '') => String(value || '').trim().toUpperCase()

const buildTenantDisabledPayload = ({ tenant = {}, campaign = null } = {}) => {
  const status = normalizeStatus(tenant?.status || 'INACTIVE') || 'INACTIVE'

  return {
    success: false,
    message: '此商家目前已停用或暫停，名下活動已暫停對玩家開放。',
    code: 'TENANT_ACTIVITY_DISABLED',
    data: {
      tenant: {
        id: tenant?.id ?? null,
        name: tenant?.name || '',
        slug: tenant?.slug || '',
        status
      },
      campaign: campaign
        ? {
            id: campaign.id,
            title: campaign.title || '',
            gameType: campaign.gameType || '',
            status: campaign.status || ''
          }
        : null,
      playerBlocked: true,
      reason: 'TENANT_NOT_ACTIVE'
    }
  }
}

const sendTenantDisabled = (res, payload) => {
  return res.status(403).json(payload)
}

const isAdminMaintenanceRequest = (req) => {
  const role = normalizeRole(req.user?.role)
  return ADMIN_ROLES.has(role)
}

const getCampaignIdFromRequest = (req) => {
  const raw = req.params?.campaignId || req.params?.id || req.query?.campaignId || req.body?.campaignId
  const id = Number(raw)

  return Number.isInteger(id) && id > 0 ? id : null
}

const getTenantSlugFromRequest = (req) => {
  return String(
    req.params?.tenantSlug ||
      req.query?.tenantSlug ||
      req.body?.tenantSlug ||
      req.query?.merchantSlug ||
      req.body?.merchantSlug ||
      ''
  ).trim()
}

const findCampaignWithTenant = async ({ campaignId, tenantSlug } = {}) => {
  if (campaignId) {
    return prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        title: true,
        gameType: true,
        status: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true
          }
        }
      }
    })
  }

  if (tenantSlug) {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true
      }
    })

    return tenant ? { tenant } : null
  }

  return null
}

const assertTenantActiveForPlayer = async (req, res, next, { allowAdminRead = false } = {}) => {
  try {
    if (allowAdminRead && isAdminMaintenanceRequest(req)) {
      return next()
    }

    const campaignId = getCampaignIdFromRequest(req)
    const tenantSlug = getTenantSlugFromRequest(req)

    // 沒有 campaignId / tenantSlug 的一般列表，不在這裡阻擋，避免誤傷平台後台列表。
    // 玩家頁通常一定會帶 tenantSlug 或 campaignId；draw-engine 一定會有 campaignId。
    if (!campaignId && !tenantSlug) {
      return next()
    }

    const target = await findCampaignWithTenant({ campaignId, tenantSlug })
    const tenant = target?.tenant || null

    if (!tenant) {
      return next()
    }

    if (normalizeStatus(tenant.status) !== ACTIVE_STATUS) {
      return sendTenantDisabled(res, buildTenantDisabledPayload({
        tenant,
        campaign: target?.id ? target : null
      }))
    }

    return next()
  } catch (error) {
    console.error('tenant activity guard failed:', error)
    return next(error)
  }
}

// 公開玩家讀取活動資料時使用：
// - 未登入玩家：商家停用就擋。
// - 已登入後台維護者：允許讀資料，方便進後台修復 / 重新啟用。
export const blockInactiveTenantForPublicCampaignRead = (req, res, next) => {
  return assertTenantActiveForPlayer(req, res, next, { allowAdminRead: true })
}

// draw-engine 真正會影響玩家抽獎 / 序號 / 獎項紀錄：
// 商家停用後，即使有人直接打 API，也全部封鎖。
export const blockInactiveTenantForDrawEngine = (req, res, next) => {
  return assertTenantActiveForPlayer(req, res, next, { allowAdminRead: false })
}
