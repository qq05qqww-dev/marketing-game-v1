<script setup>
// Multi Game Platform V2.3
// 第 7101～7500 批：九宮格共用 PlayBoard 正式頁下方完整區塊與互動狀態對齊版
//
// 覆蓋位置：
// frontend/src/views/games/playboards/PremiumGridPlayBoard.vue
//
// 本批定位：
// 1. 補齊 sharedGridBoard=1 正式頁下方資訊區塊：活動規則摘要、獎品說明摘要、客服/兌換提示、底部安全區。
// 2. 強化互動狀態：抽選中遮罩、活動不可玩提示、預覽模式提示、底部 home indicator。
// 3. 保留 settings / previewMode / showPhoneFrame / items / activeIndex / draw emit 用法。
// 4. 不送 verify/play API；所有正式抽獎動作仍由外層 PremiumGridLotteryView.vue 控制。
// 5. 不改 router / DB schema / draw-core / AdminCampaignsView.vue。

import { computed } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  activeIndex: {
    type: Number,
    default: -1
  },
  disabled: {
    type: Boolean,
    default: false
  },
  isDrawing: {
    type: Boolean,
    default: false
  },
  drawButtonText: {
    type: String,
    default: '點擊抽選'
  },
  drawButtonIcon: {
    type: String,
    default: '🎯'
  },
  emptyText: {
    type: String,
    default: '尚未設定九宮格獎項'
  },
  settings: {
    type: Object,
    default: () => ({})
  },
  previewMode: {
    type: Boolean,
    default: false
  },
  showPhoneFrame: {
    type: Boolean,
    default: true
  },
  showDebugLabel: {
    type: Boolean,
    default: false
  },
  playerUrl: {
    type: String,
    default: ''
  },
  chances: {
    type: Number,
    default: 93
  },
  drawLogs: {
    type: Array,
    default: () => []
  },
  layoutMode: {
    type: String,
    default: 'formal'
  },
  previewMaxHeight: {
    type: String,
    default: ''
  }
})

const emit = defineEmits([
  'draw',
  'select-cell',
  'share',
  'open-rules',
  'open-prizes',
  'open-history',
  'open-rewards',
  'open-home'
])

const defaultSettings = {
  basicText: {
    pageTitle: '超級九宮格',
    brandName: 'Multi Game Platform',
    brandSubtitle: '打造專屬互動抽獎體驗',
    headline: '豪華九宮格',
    subtitle: '無敵大幸運',
    badgeText: '每日登入抽好禮',
    playButtonText: '開始抽獎'
  },
  theme: {
    themeStart: '#ffbd4a',
    themeMiddle: '#ff8a1c',
    themeEnd: '#f25a1d',
    cardColor: '#fff1a8',
    cardActiveColor: '#ef2f16',
    gridFrameColor: '#fb5a08',
    buttonColor: '#ffffff',
    buttonTextColor: '#ea580c',
    textColor: '#ffffff'
  },
  stage: {
    logoText: 'P',
    brandCardEnabled: true,
    dottedBackground: true,
    backgroundImageUrl: '',
    glowEnabled: true
  },
  gridStyle: {
    gridCardSize: 128,
    gridGap: 12,
    gridRadius: 24,
    gridBorderWidth: 3,
    centerButtonText: '點擊抽獎'
  },
  prizes: [],
  display: {
    showChanceText: true,
    showPrizeWall: true,
    showDrawLogs: true,
    showParticipation: true,
    showAccordionBlocks: true,
    chanceText: '還有 {count} 次抽獎機會',
    chanceSubText: '目前還有 {count} 次抽獎機會，點擊中間按鈕即可抽獎。',
    participationTitle: '活動參加方式',
    participationText: '點擊九宮格中間按鈕開始抽獎，中獎後會自動寫入遊戲紀錄。分享活動會複製活動連結並增加抽獎機會。',
    customerServiceText: '請依照活動規則參加抽獎，獎項與兌換方式以主辦單位公告為準。'
  },
  rules: {
    content: '每組序號限使用一次。活動獎項、使用期限與兌換方式依商家公告為準。',
    redemption: '請保留中獎畫面，並依客服指示完成兌換。',
    privacy: '玩家資料僅用於活動紀錄與兌獎確認。'
  },
  resultModal: {
    winTitle: '恭喜中獎！',
    loseTitle: '再接再厲',
    confirmText: '關閉結果',
    continueText: '繼續抽獎',
    rewardHint: '請依商家公告方式兌換獎品。'
  },
  serial: {
    requireSerial: true,
    serialHint: '請輸入商家提供的序號後開始九宮格抽獎。'
  },
  footer: {
    showRules: true,
    showRewards: true,
    showHistory: true,
    showShare: true,
    rulesText: '規則',
    rewardsText: '我的獎品',
    historyText: '紀錄',
    shareText: '分享'
  },
  share: {
    systemShareButtonText: '分享'
  }
}

const defaultPrizeItems = [
  { id: 'grid_1', position: 1, icon: '🎁', title: '折價券', name: '折價券', shortName: '折價券', enabled: true },
  { id: 'grid_2', position: 2, icon: '🪙', title: '點數', name: '點數', shortName: '點數', enabled: true },
  { id: 'grid_3', position: 3, icon: '🥤', title: '飲品券', name: '飲品券', shortName: '飲品券', enabled: true },
  { id: 'grid_4', position: 4, icon: '🎀', title: '小禮物', name: '小禮物', shortName: '小禮物', enabled: true },
  { id: 'grid_5', position: 5, icon: '✨', title: '點擊抽獎', name: '點擊抽獎', shortName: '點擊抽獎', isButton: true, enabled: true },
  { id: 'grid_6', position: 6, icon: '🎫', title: '優惠券', name: '優惠券', shortName: '優惠券', enabled: true },
  { id: 'grid_7', position: 7, icon: '🎟️', title: '抽獎券', name: '抽獎券', shortName: '抽獎券', enabled: true },
  { id: 'grid_8', position: 8, icon: '📦', title: '神秘禮', name: '神秘禮', shortName: '神秘禮', enabled: true },
  { id: 'grid_9', position: 9, icon: '👑', title: '大獎', name: '大獎', shortName: '大獎', enabled: true }
]

const defaultDrawLogs = [
  { id: 1, icon: '🎁', prizeName: '品牌折價券', createdAt: '05/07 下午10:21' },
  { id: 2, icon: '🎁', prizeName: '品牌折價券', createdAt: '05/07 下午10:11' },
  { id: 3, icon: '🥤', prizeName: '飲品兌換券', createdAt: '05/07 下午10:08' },
  { id: 4, icon: '🪙', prizeName: '會員點數 100 點', createdAt: '05/07 下午10:08' },
  { id: 5, icon: '🎟️', prizeName: '加碼抽獎券', createdAt: '05/05 下午10:55' }
]

const deepMerge = (base, override) => {
  const output = { ...base }

  Object.entries(override || {}).forEach(([key, value]) => {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      base[key] &&
      typeof base[key] === 'object' &&
      !Array.isArray(base[key])
    ) {
      output[key] = deepMerge(base[key], value)
    } else if (value !== undefined) {
      output[key] = value
    }
  })

  return output
}

const mergedSettings = computed(() => deepMerge(defaultSettings, props.settings || {}))

const normalizedItems = computed(() => {
  const settingPrizes = Array.isArray(mergedSettings.value.prizes)
    ? mergedSettings.value.prizes
    : []

  const sourceItems = props.items.length
    ? props.items
    : settingPrizes.length
      ? settingPrizes
      : defaultPrizeItems

  const normalized = sourceItems.slice(0, 9).map((item, index) => {
    const position = Number(item.position || index + 1)
    const isCenter = position === 5 || item.isButton === true

    return {
      id: item.id || `grid_item_${position}`,
      position,
      icon: item.icon || (isCenter ? props.drawButtonIcon : '🎁'),
      title: item.title || item.name || item.shortName || `獎項 ${position}`,
      name: item.name || item.title || item.shortName || `獎項 ${position}`,
      shortName: item.shortName || item.title || item.name || `獎項 ${position}`,
      quantity: item.quantity ?? 0,
      weight: item.weight ?? 0,
      enabled: item.enabled !== false,
      isButton: isCenter
    }
  })

  while (normalized.length < 9) {
    const position = normalized.length + 1
    const fallback = defaultPrizeItems[position - 1]
    normalized.push({ ...fallback, isButton: position === 5 })
  }

  return normalized
})

const enabledPrizeItems = computed(() => {
  return normalizedItems.value.filter((item) => item.enabled && !item.isButton)
})

const normalizedDrawLogs = computed(() => {
  return props.drawLogs.length ? props.drawLogs : defaultDrawLogs
})

const backgroundStyle = computed(() => {
  const theme = mergedSettings.value.theme || {}
  const stage = mergedSettings.value.stage || {}

  if (stage.backgroundImageUrl) {
    return {
      background: `
        radial-gradient(circle at 18% 10%, rgba(255,255,255,.55), transparent 26%),
        linear-gradient(rgba(255,122,24,.82), rgba(238,63,36,.96)),
        url(${stage.backgroundImageUrl}) center/cover
      `
    }
  }

  return {
    background: `
      radial-gradient(circle at 15% 8%, rgba(255,255,255,.78), transparent 24%),
      radial-gradient(circle at 88% 15%, rgba(255,238,169,.54), transparent 21%),
      radial-gradient(circle at 50% -6%, rgba(255,255,255,.24), transparent 46%),
      linear-gradient(180deg, ${theme.themeStart} 0%, ${theme.themeMiddle} 45%, ${theme.themeEnd} 100%)
    `
  }
})

const playerMainStyle = computed(() => {
  const style = { ...backgroundStyle.value }

  if (props.previewMaxHeight && props.previewMaxHeight !== 'none') {
    style.maxHeight = props.previewMaxHeight
  }

  return style
})

const chanceText = computed(() => {
  const template = mergedSettings.value.display?.chanceText || defaultSettings.display.chanceText
  return template.replace('{count}', String(props.chances))
})

const chanceSubText = computed(() => {
  const template = mergedSettings.value.display?.chanceSubText || defaultSettings.display.chanceSubText
  return template.replace('{count}', String(props.chances))
})

const formalPlayerUrl = computed(() => {
  return props.playerUrl || mergedSettings.value.front?.playerUrl || 'http://localhost:5173/games/premium-grid'
})

const boardStatusText = computed(() => {
  if (props.previewMode) return '後台預覽模式，不會送出抽獎 API。'
  if (props.disabled) return '目前活動暫不可玩，請依商家公告時間參加。'
  if (props.isDrawing) return '抽選中，請稍候...'
  return mergedSettings.value.serial?.requireSerial
    ? (mergedSettings.value.serial?.serialHint || '請輸入商家提供的序號後開始抽獎。')
    : '目前可直接點擊中間按鈕開始抽獎。'
})

const showBoardStatus = computed(() => {
  return props.previewMode || props.disabled || props.isDrawing || mergedSettings.value.serial?.requireSerial
})

const ruleSummaryItems = computed(() => [
  mergedSettings.value.rules?.content || defaultSettings.rules.content,
  mergedSettings.value.rules?.redemption || defaultSettings.rules.redemption,
  mergedSettings.value.rules?.privacy || defaultSettings.rules.privacy
])

const prizeSummaryItems = computed(() => enabledPrizeItems.value.slice(0, 4).map((item) => {
  const quantityText = Number(item.quantity || 0) > 0 ? `剩餘 ${item.quantity}` : '依活動庫存'
  return `${item.icon} ${item.shortName || item.title || item.name}｜${quantityText}`
}))

const getItemLabel = (item) => {
  if (item.isButton) {
    return mergedSettings.value.gridStyle?.centerButtonText || props.drawButtonText
  }

  return item.shortName || item.title || item.name
}

const cellSize = computed(() => {
  return Math.max(96, Number(mergedSettings.value.gridStyle?.gridCardSize || 128) - 12)
})

const getCellStyle = (item) => {
  const theme = mergedSettings.value.theme || {}
  const gridStyle = mergedSettings.value.gridStyle || {}
  const isActive = Number(props.activeIndex) === Number(item.position - 1)
  const isButton = item.isButton
  const size = cellSize.value

  if (isButton) {
    return {
      minHeight: `${size}px`,
      borderRadius: `${Number(gridStyle.gridRadius || 24)}px`,
      borderWidth: `${Number(gridStyle.gridBorderWidth || 3)}px`,
      borderStyle: 'solid',
      borderColor: 'rgba(255,255,255,.9)',
      background: `
        radial-gradient(circle at 50% 10%, rgba(255,255,255,.58), transparent 31%),
        linear-gradient(180deg, #ff755a 0%, ${theme.cardActiveColor} 54%, #a91408 100%)
      `,
      color: '#ffffff',
      boxShadow: isActive
        ? '0 0 0 5px rgba(255,255,255,.56), 0 24px 38px rgba(127,29,29,.44), inset 0 5px 12px rgba(255,255,255,.4), inset 0 -9px 18px rgba(72,12,12,.38)'
        : '0 18px 31px rgba(127,29,29,.37), inset 0 5px 12px rgba(255,255,255,.4), inset 0 -9px 18px rgba(72,12,12,.38)',
      transform: isActive ? 'translateY(-5px) scale(1.05)' : 'translateY(0) scale(1)'
    }
  }

  return {
    minHeight: `${size}px`,
    borderRadius: `${Number(gridStyle.gridRadius || 24)}px`,
    borderWidth: `${Number(gridStyle.gridBorderWidth || 3)}px`,
    borderStyle: 'solid',
    borderColor: isActive ? 'rgba(255,255,255,.98)' : 'rgba(255,255,255,.74)',
    background: `
      radial-gradient(circle at 34% 17%, rgba(255,255,255,.94), transparent 27%),
      linear-gradient(180deg, #fff9d6 0%, ${theme.cardColor} 50%, #ffc15c 100%)
    `,
    color: '#111827',
    boxShadow: isActive
      ? '0 0 0 5px rgba(255,255,255,.72), 0 24px 38px rgba(124,45,18,.38), inset 0 5px 13px rgba(255,255,255,.84), inset 0 -9px 16px rgba(180,83,9,.28)'
      : '0 14px 25px rgba(124,45,18,.27), inset 0 5px 13px rgba(255,255,255,.84), inset 0 -9px 16px rgba(180,83,9,.25)',
    transform: isActive ? 'translateY(-5px) scale(1.05)' : 'translateY(0) scale(1)'
  }
}

const handleDraw = () => {
  if (props.disabled || props.isDrawing) return
  emit('draw')
}

const handleSelectCell = (item, index) => {
  if (item.isButton) {
    handleDraw()
    return
  }

  emit('select-cell', { item, index })
}

const handleShare = () => emit('share')
const openRules = () => emit('open-rules')
const openPrizes = () => emit('open-prizes')
const openHistory = () => emit('open-history')
const openRewards = () => emit('open-rewards')
const openHome = () => emit('open-home')
</script>

<template>
  <div
    :class="[
      'premium-grid-play-board',
      showPhoneFrame ? 'mx-auto w-full max-w-[500px]' : 'w-full'
    ]"
  >
    <div
      v-if="showPhoneFrame"
      class="overflow-hidden rounded-[52px] border-[14px] border-slate-950 bg-slate-950 shadow-[0_36px_96px_rgba(15,23,42,.62)]"
    >
      <div class="hidden h-10 items-center justify-between bg-white px-6 text-xs font-black text-slate-900 sm:flex">
        <span>5:04</span>
        <span class="flex items-center gap-1">
          <span>▮▮▮</span>
          <span>98%</span>
        </span>
      </div>

      <div class="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
        <button
          type="button"
          class="text-xl font-black text-slate-500"
          @click="openHome"
        >
          ‹
        </button>
        <div class="text-center">
          <h2 class="text-sm font-black text-slate-900">
            {{ mergedSettings.basicText.pageTitle }}
          </h2>
          <p class="text-[10px] font-bold text-slate-400">
            {{ previewMode ? 'activity.demo.local' : 'activity.live.local' }}
          </p>
        </div>
        <button
          type="button"
          class="text-xl font-black text-slate-500"
          @click="openHome"
        >
          ×
        </button>
      </div>

      <main
        class="relative overflow-y-auto px-5 pb-7 pt-6 text-white premium-scrollbar-y"
        :class="previewMaxHeight && previewMaxHeight !== 'none' ? '' : 'max-h-[980px]'"
        :style="playerMainStyle"
      >
        <div
          v-if="mergedSettings.stage.dottedBackground"
          class="absolute inset-0 opacity-25 premium-dot-bg"
        ></div>

        <div class="pointer-events-none absolute -right-24 top-12 h-60 w-60 rounded-full bg-white/22 blur-3xl"></div>
        <div class="pointer-events-none absolute -left-20 bottom-32 h-64 w-64 rounded-full bg-yellow-200/22 blur-3xl"></div>

        <div
          v-if="isDrawing"
          class="pointer-events-none absolute inset-x-8 top-[48%] z-20 rounded-[28px] border border-white/30 bg-slate-950/42 px-5 py-4 text-center text-sm font-black text-white shadow-2xl backdrop-blur-md"
        >
          {{ mergedSettings.resultModal?.winTitle || '抽選中' }}｜九宮格跑燈中...
        </div>

        <div class="relative">
          <section
            v-if="mergedSettings.stage.brandCardEnabled"
            class="relative overflow-hidden rounded-[30px] border border-white/35 bg-white/22 p-5 shadow-[0_18px_40px_rgba(124,45,18,.24)] backdrop-blur-xl"
          >
            <div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/34 via-white/10 to-transparent"></div>
            <div class="relative flex items-center gap-4">
              <div class="flex h-[68px] w-[68px] items-center justify-center rounded-[24px] border-4 border-white bg-gradient-to-br from-yellow-200 via-orange-400 to-red-500 text-3xl font-black leading-none shadow-[0_14px_28px_rgba(124,45,18,.34),inset_0_4px_10px_rgba(255,255,255,.55)]">
                {{ mergedSettings.stage.logoText }}
              </div>
              <div>
                <p class="text-base font-black drop-shadow">
                  {{ mergedSettings.basicText.brandName }}
                </p>
                <p class="mt-1 text-sm font-black text-white/95">
                  {{ mergedSettings.basicText.pageTitle }}
                </p>
                <p class="mt-1 text-xs font-bold text-white/75">
                  {{ mergedSettings.basicText.brandSubtitle }}
                </p>
              </div>
            </div>
          </section>

          <section class="mt-7 text-center">
            <h1 class="text-[42px] font-black leading-tight tracking-tight drop-shadow-[0_4px_10px_rgba(124,45,18,.35)]">
              {{ mergedSettings.basicText.headline }}
            </h1>
            <p class="mt-1 text-[32px] font-black tracking-tight drop-shadow-[0_4px_10px_rgba(124,45,18,.34)]">
              {{ mergedSettings.basicText.subtitle }}
            </p>
            <span class="mt-5 inline-flex rounded-full border border-white/30 bg-white/20 px-5 py-2 text-sm font-black shadow-inner backdrop-blur">
              {{ mergedSettings.basicText.badgeText }}
            </span>
          </section>

          <section class="relative mt-8">
            <div class="absolute inset-x-6 -bottom-5 h-10 rounded-full bg-orange-950/28 blur-xl"></div>
            <div
              class="relative rounded-[36px] border border-white/20 p-3 shadow-[0_24px_60px_rgba(124,45,18,.42),inset_0_4px_12px_rgba(255,255,255,.35),inset_0_-10px_22px_rgba(124,45,18,.38)]"
              :style="{
                background: `linear-gradient(180deg, rgba(255,255,255,.28), rgba(255,255,255,.04)), ${mergedSettings.theme.gridFrameColor}`
              }"
            >
              <div
                class="grid grid-cols-3"
                :style="{ gap: `${mergedSettings.gridStyle.gridGap}px` }"
              >
                <button
                  v-for="(item, index) in normalizedItems"
                  :key="item.id || index"
                  type="button"
                  :disabled="disabled || isDrawing || item.enabled === false"
                  class="group relative overflow-hidden text-center font-black transition duration-200 disabled:cursor-not-allowed disabled:opacity-60"
                  :class="[item.isButton && isDrawing ? 'premium-drawing-glow' : '']"
                  :style="getCellStyle(item)"
                  @click="handleSelectCell(item, index)"
                >
                  <span class="pointer-events-none absolute inset-x-3 top-2 h-5 rounded-full bg-white/45 blur-sm"></span>
                  <span class="relative block text-[34px] drop-shadow-sm">
                    {{ item.isButton ? drawButtonIcon : item.icon }}
                  </span>
                  <span class="relative mt-2 block px-2 text-xs leading-4">
                    {{ item.isButton && isDrawing ? '抽選中...' : getItemLabel(item) }}
                  </span>
                </button>
              </div>
            </div>
          </section>

          <section class="mt-8 text-center">
            <p
              v-if="mergedSettings.display.showChanceText"
              class="text-sm font-black text-white drop-shadow"
            >
              {{ chanceText }}
            </p>
            <p class="mx-auto mt-3 max-w-[330px] rounded-full border border-white/20 bg-white/18 px-4 py-2 text-xs font-bold text-white/90 shadow-inner backdrop-blur">
              {{ chanceSubText }}
            </p>
          </section>

          <section
            v-if="showBoardStatus"
            class="mt-4 rounded-[24px] border border-white/18 bg-white/14 px-4 py-3 text-center text-xs font-black leading-6 text-white/88 shadow-inner backdrop-blur"
          >
            {{ boardStatusText }}
          </section>

          <section class="mt-5 text-center">
            <button
              type="button"
              class="min-w-[176px] rounded-full border border-white/55 px-8 py-4 text-base font-black shadow-[0_16px_34px_rgba(124,45,18,.34),inset_0_3px_8px_rgba(255,255,255,.7)] transition hover:-translate-y-0.5"
              :style="{
                background: `linear-gradient(180deg, rgba(255,255,255,.96), ${mergedSettings.theme.buttonColor})`,
                color: mergedSettings.theme.buttonTextColor
              }"
              @click="handleShare"
            >
              {{ mergedSettings.share.systemShareButtonText }}
            </button>
            <p class="mt-3 text-xs font-bold text-white/80">
              分享給好友可獲得額外抽獎次數，目前已分享 3 次
            </p>
          </section>

          <section
            v-if="mergedSettings.display.showParticipation"
            class="mt-6 rounded-[30px] border border-white/20 bg-white/16 p-5 text-center shadow-[0_16px_34px_rgba(124,45,18,.22)] backdrop-blur-xl"
          >
            <h3 class="text-base font-black">
              {{ mergedSettings.display.participationTitle }}
            </h3>
            <p class="mt-3 text-sm font-bold leading-7 text-white/90">
              {{ mergedSettings.display.participationText }}
            </p>
            <p class="mt-4 rounded-full border border-white/15 bg-white/14 px-4 py-3 text-xs font-black text-white/80">
              活動連結：{{ formalPlayerUrl }}
            </p>
          </section>

          <section
            v-if="mergedSettings.display.showAccordionBlocks"
            class="mt-5 space-y-3"
          >
            <button
              type="button"
              class="w-full rounded-3xl bg-white px-5 py-4 text-left text-slate-900 shadow-[0_14px_28px_rgba(124,45,18,.18),inset_0_1px_0_rgba(255,255,255,.8)]"
              @click="openRules"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-black">活動規則</p>
                  <p class="mt-1 text-xs font-bold text-slate-400">點擊展開查看參加方式</p>
                </div>
                <span class="text-xl font-black text-orange-500">+</span>
              </div>
              <ul class="mt-3 space-y-1.5 text-xs font-bold leading-5 text-slate-500">
                <li v-for="(rule, index) in ruleSummaryItems.slice(0, 2)" :key="`rule_${index}`">
                  {{ index + 1 }}. {{ rule }}
                </li>
              </ul>
            </button>

            <button
              type="button"
              class="w-full rounded-3xl bg-white px-5 py-4 text-left text-slate-900 shadow-[0_14px_28px_rgba(124,45,18,.18),inset_0_1px_0_rgba(255,255,255,.8)]"
              @click="openPrizes"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-black">獎品說明</p>
                  <p class="mt-1 text-xs font-bold text-slate-400">點擊展開查看獎品規則</p>
                </div>
                <span class="text-xl font-black text-orange-500">+</span>
              </div>
              <div class="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-slate-500">
                <span
                  v-for="item in prizeSummaryItems"
                  :key="item"
                  class="rounded-2xl bg-orange-50 px-3 py-2"
                >
                  {{ item }}
                </span>
              </div>
            </button>
          </section>

          <section
            v-if="mergedSettings.display.showPrizeWall"
            class="mt-5 rounded-[30px] bg-white p-4 text-slate-900 shadow-[0_18px_36px_rgba(124,45,18,.2)]"
          >
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-sm font-black">獎品展示</h3>
              <span class="text-xs font-bold text-slate-400">可橫向滑動</span>
            </div>
            <div class="flex gap-4 overflow-x-auto premium-scrollbar">
              <article
                v-for="item in enabledPrizeItems"
                :key="item.id"
                class="w-20 shrink-0 text-center"
              >
                <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-100 to-orange-200 text-3xl shadow-[0_8px_18px_rgba(180,83,9,.18),inset_0_2px_8px_rgba(255,255,255,.72)]">
                  {{ item.icon }}
                </div>
                <p class="mt-2 truncate text-[11px] font-black text-slate-700">
                  {{ item.shortName || item.title || item.name }}
                </p>
              </article>
            </div>
          </section>

          <section
            v-if="mergedSettings.display.showDrawLogs"
            class="mt-5 rounded-[30px] border border-white/20 bg-white/16 p-5 shadow-[0_16px_34px_rgba(124,45,18,.2)] backdrop-blur-xl"
          >
            <h3 class="text-base font-black">最新中獎紀錄</h3>
            <div class="mt-4 space-y-2">
              <article
                v-for="log in normalizedDrawLogs"
                :key="log.id"
                class="flex items-center justify-between rounded-2xl bg-white/18 px-4 py-3 text-sm font-black shadow-inner"
              >
                <span>{{ log.icon }} {{ log.prizeName }}</span>
                <span class="text-xs text-white/90">{{ log.createdAt }}</span>
              </article>
            </div>
          </section>

          <section class="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              class="rounded-2xl border border-white/35 bg-white/14 px-4 py-3 text-sm font-black text-white shadow-sm backdrop-blur"
              @click="openHistory"
            >
              查看我的紀錄
            </button>
            <button
              type="button"
              class="rounded-2xl border border-white/35 bg-white/14 px-4 py-3 text-sm font-black text-white shadow-sm backdrop-blur"
              @click="openHome"
            >
              回遊戲中心
            </button>
          </section>

          <p class="mt-5 text-center text-xs font-bold leading-6 text-white/80">
            {{ mergedSettings.display.customerServiceText }}
          </p>

          <section class="mt-5 grid grid-cols-4 gap-2 text-center text-xs font-black">
            <button
              v-if="mergedSettings.footer.showRules"
              type="button"
              class="rounded-2xl bg-white/18 px-2 py-3 shadow-inner backdrop-blur"
              @click="openRules"
            >
              {{ mergedSettings.footer.rulesText }}
            </button>
            <button
              v-if="mergedSettings.footer.showRewards"
              type="button"
              class="rounded-2xl bg-white/18 px-2 py-3 shadow-inner backdrop-blur"
              @click="openRewards"
            >
              {{ mergedSettings.footer.rewardsText }}
            </button>
            <button
              v-if="mergedSettings.footer.showHistory"
              type="button"
              class="rounded-2xl bg-white/18 px-2 py-3 shadow-inner backdrop-blur"
              @click="openHistory"
            >
              {{ mergedSettings.footer.historyText }}
            </button>
            <button
              v-if="mergedSettings.footer.showShare"
              type="button"
              class="rounded-2xl bg-white/18 px-2 py-3 shadow-inner backdrop-blur"
              @click="handleShare"
            >
              {{ mergedSettings.footer.shareText }}
            </button>
          </section>

          <div class="mx-auto mt-5 h-1.5 w-28 rounded-full bg-slate-950/55"></div>

          <div
            v-if="showDebugLabel"
            class="mt-4 rounded-2xl bg-slate-950/50 px-4 py-3 text-xs font-bold text-white/80"
          >
            PremiumGridPlayBoard｜previewMode: {{ previewMode ? 'true' : 'false' }}｜layoutMode: {{ layoutMode }}
          </div>
        </div>
      </main>
    </div>

    <main
      v-else
      class="relative overflow-hidden rounded-[32px] px-4 pb-6 pt-5 text-white shadow-2xl"
      :style="playerMainStyle"
    >
      <div
        v-if="mergedSettings.stage.dottedBackground"
        class="absolute inset-0 opacity-25 premium-dot-bg"
      ></div>

      <div class="relative">
        <section
          v-if="mergedSettings.stage.brandCardEnabled"
          class="rounded-[30px] border border-white/35 bg-white/22 p-5 shadow-xl backdrop-blur-xl"
        >
          <div class="flex items-center gap-4">
            <div class="flex h-[68px] w-[68px] items-center justify-center rounded-[24px] border-4 border-white bg-gradient-to-br from-yellow-200 via-orange-400 to-red-500 text-3xl font-black leading-none shadow-lg">
              {{ mergedSettings.stage.logoText }}
            </div>
            <div>
              <p class="text-base font-black">
                {{ mergedSettings.basicText.brandName }}
              </p>
              <p class="mt-1 text-sm font-black text-white/90">
                {{ mergedSettings.basicText.pageTitle }}
              </p>
              <p class="mt-1 text-xs font-bold text-white/70">
                {{ mergedSettings.basicText.brandSubtitle }}
              </p>
            </div>
          </div>
        </section>

        <section class="mt-7 text-center">
          <h1 class="text-[42px] font-black leading-tight tracking-tight drop-shadow">
            {{ mergedSettings.basicText.headline }}
          </h1>
          <p class="mt-1 text-[32px] font-black tracking-tight drop-shadow">
            {{ mergedSettings.basicText.subtitle }}
          </p>
          <span class="mt-5 inline-flex rounded-full border border-white/30 bg-white/20 px-5 py-2 text-sm font-black shadow-inner backdrop-blur">
            {{ mergedSettings.basicText.badgeText }}
          </span>
        </section>

        <section
          class="relative mt-8 rounded-[36px] border border-white/20 p-3 shadow-2xl"
          :style="{ background: `linear-gradient(180deg, rgba(255,255,255,.28), rgba(255,255,255,.04)), ${mergedSettings.theme.gridFrameColor}` }"
        >
          <div
            class="grid grid-cols-3"
            :style="{ gap: `${mergedSettings.gridStyle.gridGap}px` }"
          >
            <button
              v-for="(item, index) in normalizedItems"
              :key="item.id || index"
              type="button"
              :disabled="disabled || isDrawing || item.enabled === false"
              class="group relative overflow-hidden text-center font-black transition duration-200 disabled:cursor-not-allowed disabled:opacity-60"
              :class="[item.isButton && isDrawing ? 'premium-drawing-glow' : '']"
              :style="getCellStyle(item)"
              @click="handleSelectCell(item, index)"
            >
              <span class="pointer-events-none absolute inset-x-3 top-2 h-5 rounded-full bg-white/45 blur-sm"></span>
              <span class="relative block text-[34px] drop-shadow-sm">
                {{ item.isButton ? drawButtonIcon : item.icon }}
              </span>
              <span class="relative mt-2 block px-2 text-xs leading-4">
                {{ item.isButton && isDrawing ? '抽選中...' : getItemLabel(item) }}
              </span>
            </button>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
.premium-dot-bg {
  background-image:
    radial-gradient(circle, rgba(255, 255, 255, 0.65) 1px, transparent 1px),
    radial-gradient(circle, rgba(255, 255, 255, 0.35) 1px, transparent 1px);
  background-position: 0 0, 18px 18px;
  background-size: 36px 36px;
}

.premium-scrollbar::-webkit-scrollbar {
  height: 0;
}

.premium-scrollbar-y::-webkit-scrollbar {
  width: 0;
}

.premium-drawing-glow {
  animation: premium-drawing-pulse 0.9s ease-in-out infinite alternate;
}

@keyframes premium-drawing-pulse {
  from {
    filter: brightness(1);
  }

  to {
    filter: brightness(1.1);
  }
}
</style>
