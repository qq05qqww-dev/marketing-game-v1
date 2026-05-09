<script setup>
// Multi Game Platform V2.3
// 第 105 批：GenericGamePlayView.vue 改用 demoGameData.js 版
//
// 放置位置：
// frontend/src/views/games/GenericGamePlayView.vue
//
// 目的：
// 1. 建立未來多遊戲共用前台頁的草案。
// 2. 未來可支援 /play/:tenantSlug/:gamePath。
// 3. 依 gamePath / gameType 自動取得遊戲定義與玩法元件。
// 4. 這一批只新增草案檔，不接入 router，不取代目前九宮格或金蛋頁面。

import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  GameActivityHeader,
  GameChanceCard,
  GameClaimInfo,
  GameDrawLogs,
  GameFooterInfo,
  GamePreviewSwitcher,
  GamePrizeShowcase,
  GameQuickNav,
  GameResultModal,
  GameRulesPanel,
  GameShell,
  GameStatusNotice
} from '../../components/game-common/gameCommonIndex'
import {
  GAME_REGISTRY,
  GAME_TYPES,
  buildTenantGamePath,
  getGameDefinitionOrFallback,
  getGameLabel,
  listGameDefinitions,
  normalizeGameType
} from '../../games/gameRegistry'
import {
  createDemoBoardItemsByGameType,
  createDemoPreviewGuideItems,
  createDemoPrizeNoteItems,
  createDemoRuleItems
} from '../../games/demoGameData'
import {
  getPlayBoardComponent,
  PremiumGridPlayBoard
} from './playboards/playboardsIndex'

import { useGenericPreviewState } from '../../composables/useGenericPreviewState'

const route = useRoute()
const router = useRouter()

const showResultModal = ref(false)
const activeIndex = ref(-1)

const {
  demoPrizes,
  chances,
  sharedCount,
  source,
  isDrawing,
  resultPrize,
  drawLogs,
  latestDrawLogId,
  loadedAt,
  canDraw,
  availablePrizeCount,
  getRandomPrize,
  setDrawing,
  setResultPrize,
  consumeChance,
  addChance,
  addShareCount,
  addDrawLog,
  clearDrawLogs: clearPreviewDrawLogs
} = useGenericPreviewState({
  initialChances: 3,
  initialSharedCount: 0,
  initialSource: 'direct',
  maxLogs: 8
})

const heroSectionRef = ref(null)
const prizeSectionRef = ref(null)
const rulesSectionRef = ref(null)
const logsSectionRef = ref(null)

const tenantSlug = computed(() => {
  return String(route.params.tenantSlug || '').trim() || 'demo-shop'
})

const gamePath = computed(() => {
  return String(route.params.gamePath || route.params.gameSlug || '').trim()
})

const previewGameType = computed(() => {
  return normalizeGameType(route.query.gameType || route.query.type || GAME_TYPES.GRID)
})

const gameDefinition = computed(() => {
  const foundByPath = Object.values(GAME_REGISTRY).find((item) => item.frontPath === gamePath.value)

  if (foundByPath) return foundByPath

  return getGameDefinitionOrFallback(previewGameType.value)
})

const gameType = computed(() => {
  return gameDefinition.value?.gameType || 'GRID'
})

const gameLabel = computed(() => {
  return getGameLabel(gameType.value)
})

const previewGameOptions = computed(() => {
  return listGameDefinitions({
    includePlanned: true,
    includeDisabled: false
  }).filter((item) => {
    return ['GOLDEN_EGG', 'GRID', 'WHEEL', 'SCRATCH_CARD', 'FLIP_CARD', 'RED_PACKET', 'SLOT_MACHINE'].includes(item.gameType)
  })
})

const previewSwitcherHint = computed(() => {
  return `目前預覽：${gameType.value}｜網址可加 ?gameType=WHEEL / GOLDEN_EGG / SCRATCH_CARD / FLIP_CARD / RED_PACKET / SLOT_MACHINE`
})

const previewGuideItems = computed(() => {
  return createDemoPreviewGuideItems()
})


const playBoardName = computed(() => {
  return gameDefinition.value?.boardComponent || 'UnknownPlayBoard'
})

const previewStatusItems = computed(() => {
  return [
    {
      label: '目前玩法',
      value: gameType.value,
      icon: gameDefinition.value?.icon || '🎮',
      tone: 'bg-orange-50 text-orange-700'
    },
    {
      label: '玩法元件',
      value: playBoardName.value,
      icon: '🧩',
      tone: 'bg-purple-50 text-purple-700'
    },
    {
      label: '獎品資料',
      value: `${availablePrizeCount.value} / ${demoPrizes.value.length} 筆`,
      icon: '🎁',
      tone: 'bg-emerald-50 text-emerald-700'
    },
    {
      label: '抽獎機會',
      value: `${chances.value} 次`,
      icon: '🎯',
      tone: chances.value > 0 ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'
    },
    {
      label: '紀錄數',
      value: `${drawLogs.value.length} 筆`,
      icon: '🏆',
      tone: 'bg-amber-50 text-amber-700'
    },
    {
      label: '抽選狀態',
      value: isDrawing.value ? '抽選中' : '待命',
      icon: isDrawing.value ? '✨' : '✅',
      tone: isDrawing.value ? 'bg-yellow-50 text-yellow-700' : 'bg-slate-50 text-slate-700'
    }
  ]
})

const previewHealthText = computed(() => {
  if (!gameType.value) return '尚未取得 gameType，請檢查網址 query 或 gameRegistry 設定。'
  if (!ActivePlayBoard.value) return '尚未找到對應 PlayBoard 元件，請檢查 playboardsIndex.js。'
  if (!demoPrizes.value.length) return '尚未設定示範獎品資料。'
  if (isDrawing.value) return '目前正在執行抽選動畫，請等待結果完成。'
  if (chances.value <= 0) return '目前沒有抽獎機會，可按分享增加示範機會。'

  return '預覽狀態正常，可以切換玩法或測試抽獎流程。'
})

const switchPreviewGame = (targetGameType) => {
  const normalized = normalizeGameType(targetGameType)

  router.replace({
    path: '/games/generic-preview',
    query: {
      ...route.query,
      gameType: normalized
    }
  })
}

const ActivePlayBoard = computed(() => {
  return getPlayBoardComponent(gameType.value) || PremiumGridPlayBoard
})

const theme = computed(() => {
  return gameDefinition.value?.theme || {
    start: '#ffb237',
    middle: '#ff7a18',
    end: '#ee3f24'
  }
})

const campaign = computed(() => {
  return {
    brandName: 'Multi Game Platform',
    brandTagline: '多遊戲互動活動平台',
    logoText: gameDefinition.value?.icon || '🎮',
    pageTitle: `${gameLabel.value} 示範活動`,
    mainTitle: `${gameLabel.value} 抽獎`,
    heroTagline: '好禮等你拿',
    subTitle: '共用遊戲頁草案，未來可接真實 API。',
    statusLabel: '草案預覽',
    statusIcon: '🧩',
    claimTitle: '領獎提醒',
    claimDescription: '此頁目前為共用遊戲頁草案，未來會接入正式活動資料與抽獎流程。',
    contactText: '請依主辦單位公告完成兌換。',
    noticeText: '此頁為草案，不影響目前正式九宮格與金蛋頁。'
  }
})

const boardItems = computed(() => {
  return createDemoBoardItemsByGameType(gameType.value, demoPrizes.value)
})


const quickNavItems = computed(() => {
  return [
    {
      label: '頂部',
      icon: '🏠',
      target: 'hero'
    },
    {
      label: '獎品',
      icon: '🎁',
      target: 'prizes'
    },
    {
      label: '規則',
      icon: '📋',
      target: 'rules'
    },
    {
      label: '紀錄',
      icon: '🏆',
      target: 'logs'
    }
  ]
})

const ruleItems = computed(() => {
  return createDemoRuleItems()
})

const prizeNoteItems = computed(() => {
  return createDemoPrizeNoteItems()
})


const currentShareUrl = computed(() => {
  return buildTenantGamePath(tenantSlug.value, gameType.value, {
    from: 'direct'
  })
})

const getTrafficSourceLabel = () => {
  return '直接進入'
}

const scrollToSection = (target) => {
  const refs = {
    hero: heroSectionRef,
    prizes: prizeSectionRef,
    rules: rulesSectionRef,
    logs: logsSectionRef
  }

  const targetRef = refs[target]

  if (!targetRef?.value) return

  targetRef.value.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  })
}

const startDraw = async () => {
  if (!canDraw.value) return

  setDrawing(true)
  setResultPrize(null)

  const prize = getRandomPrize()
  const loops = 18
  const pathLength = gameType.value === 'GRID' ? 9 : Math.max(1, demoPrizes.value.length)

  for (let i = 0; i < loops; i += 1) {
    activeIndex.value = i % pathLength
    await new Promise((resolve) => window.setTimeout(resolve, 70 + i * 4))
  }

  setResultPrize(prize)
  consumeChance()
  setDrawing(false)
  showResultModal.value = true

  addDrawLog(prize, source.value)
}

const shareCampaign = async () => {
  addShareCount(1)
  addChance(1)

  try {
    await navigator.clipboard.writeText(currentShareUrl.value)
  } catch (error) {
    console.warn('草案頁複製活動連結失敗：', error)
  }
}

const copyResultText = async (text = '') => {
  try {
    await navigator.clipboard.writeText(text || `抽獎結果：${resultPrize.value?.title || '活動獎項'}`)
  } catch (error) {
    console.warn('草案頁複製結果失敗：', error)
  }
}

const closeResult = () => {
  showResultModal.value = false
}

const clearDrawLogs = () => {
  clearPreviewDrawLogs()
}
</script>

<template>
  <div>
    <GameShell
    :is-admin-mode="false"
    :title="campaign.pageTitle"
    :description="campaign.subTitle"
    :theme-start="theme.start"
    :theme-middle="theme.middle"
    :theme-end="theme.end"
  >
    <template #phone>
      <main
        class="relative min-h-[calc(100vh-88px)] overflow-hidden px-4 pb-6 pt-5 text-white sm:min-h-[720px] sm:px-5"
        :style="{
          background: `linear-gradient(180deg, ${theme.start} 0%, ${theme.middle} 42%, ${theme.end} 100%)`
        }"
      >
        <div class="absolute -right-16 top-12 h-52 w-52 rounded-full bg-white/15 blur-2xl"></div>
        <div class="absolute -left-20 bottom-20 h-60 w-60 rounded-full bg-yellow-200/20 blur-3xl"></div>

        <section
          ref="heroSectionRef"
          class="relative scroll-mt-4"
        >
          <GameActivityHeader
            :brand-name="campaign.brandName"
            :brand-tagline="campaign.brandTagline"
            :logo-text="campaign.logoText"
            :page-title="campaign.pageTitle"
            :main-title="campaign.mainTitle"
            :hero-tagline="campaign.heroTagline"
            :sub-title="campaign.subTitle"
            :status-label="campaign.statusLabel"
            :status-icon="campaign.statusIcon"
            status-type="loading"
            :chances="chances"
            :available-prize-count="demoPrizes.length"
            :shared-count="sharedCount"
          />
        </section>

        <GameQuickNav
          class="relative mt-4"
          :items="quickNavItems"
          :show-floating-top="false"
          variant="dark"
          @navigate="scrollToSection"
        />

        <GameStatusNotice
          class="relative mt-5"
          :show="true"
          title="共用遊戲頁草案"
          message="這是未來多遊戲共用前台頁的草案，目前不影響正式九宮格與金蛋頁面。"
          label="Draft"
          info-message="草案模式"
          :loaded-at="loadedAt"
        />

        <section class="relative mt-4 overflow-hidden rounded-[30px] border border-white/20 bg-white/15 p-4 text-white shadow-inner backdrop-blur">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.22em] text-white/60">
                Preview Guide
              </p>

              <h2 class="mt-1 text-lg font-black">
                共用遊戲頁預覽說明
              </h2>

              <p class="mt-1 text-xs font-bold leading-5 text-white/65">
                這裡是多遊戲共用化的測試區，用來確認玩法骨架與共用元件是否能一起運作。
              </p>
            </div>

            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl shadow-inner">
              📘
            </div>
          </div>

          <div class="mt-4 grid gap-3">
            <article
              v-for="item in previewGuideItems"
              :key="item.title"
              class="flex gap-3 rounded-2xl bg-white/12 p-3"
            >
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-lg">
                {{ item.icon }}
              </div>

              <div class="min-w-0 text-left">
                <p class="text-xs font-black">
                  {{ item.title }}
                </p>

                <p class="mt-1 text-[11px] font-bold leading-5 text-white/65">
                  {{ item.description }}
                </p>
              </div>
            </article>
          </div>

          <div class="mt-4 rounded-2xl bg-slate-950/30 p-3">
            <p class="text-[11px] font-black tracking-[0.16em] text-yellow-100/80">
              測試網址
            </p>

            <p class="mt-2 break-all text-[11px] font-bold leading-5 text-white/75">
              /games/generic-preview?gameType={{ gameType }}
            </p>
          </div>
        </section>

        <section class="relative mt-4 overflow-hidden rounded-[30px] border border-white/20 bg-white/15 p-4 text-white shadow-inner backdrop-blur">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.22em] text-white/60">
                Preview Status
              </p>

              <h2 class="mt-1 text-lg font-black">
                目前預覽狀態檢查
              </h2>

              <p class="mt-1 text-xs font-bold leading-5 text-white/65">
                用來快速確認目前切換的玩法、資料與抽獎狀態是否正常。
              </p>
            </div>

            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl shadow-inner">
              🧭
            </div>
          </div>

          <div class="mt-4 grid grid-cols-2 gap-2">
            <article
              v-for="item in previewStatusItems"
              :key="item.label"
              class="rounded-2xl bg-white p-3 text-slate-900 shadow-sm"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="text-lg">
                  {{ item.icon }}
                </span>

                <span
                  class="rounded-full px-2 py-0.5 text-[10px] font-black"
                  :class="item.tone"
                >
                  {{ item.label }}
                </span>
              </div>

              <p class="mt-2 truncate text-xs font-black text-slate-700">
                {{ item.value }}
              </p>
            </article>
          </div>

          <p class="mt-3 rounded-2xl bg-slate-950/30 px-3 py-2 text-[11px] font-bold leading-5 text-white/75">
            {{ previewHealthText }}
          </p>
        </section>

        <GamePreviewSwitcher
          class="relative mt-4"
          :items="previewGameOptions"
          :active-game-type="gameType"
          :hint="previewSwitcherHint"
          variant="dark"
          @switch="switchPreviewGame"
        />

        <section class="relative mt-6">
          <component
            :is="ActivePlayBoard"
            :items="boardItems"
            :prizes="demoPrizes"
            :cards="boardItems"
            :eggs="boardItems"
            :packets="boardItems"
            :symbols="boardItems"
            :active-index="activeIndex"
            :selected-index="activeIndex"
            :result-prize="resultPrize"
            :disabled="!canDraw"
            :is-drawing="isDrawing"
            :draw-button-text="gameType === 'GRID' ? '點擊抽選' : gameType === 'RED_PACKET' ? '開始紅包雨' : gameType === 'SLOT_MACHINE' ? '啟動拉霸' : '開始抽獎'"
            @draw="startDraw"
            @select-cell="() => {}"
            @select-prize="() => {}"
            @select-card="startDraw"
            @select-egg="startDraw"
            @select-packet="() => {}"
            @select-symbol="() => {}"
            @rain-end="() => { showResultModal = true }"
            @spin-end="() => { showResultModal = true }"
          />
        </section>

        <section class="relative mt-5">
          <GameChanceCard
            :chances="chances"
            :shared-count="sharedCount"
            :available-prize-count="demoPrizes.length"
            :is-drawing="isDrawing"
            status-message="草案頁目前使用本機示範資料。"
            @draw="startDraw"
            @share="shareCampaign"
          />
        </section>

        <section
          ref="prizeSectionRef"
          class="relative mt-5 scroll-mt-4"
        >
          <GamePrizeShowcase
            :prizes="demoPrizes"
            title="獎品展示"
            description="草案頁示範獎品資料。"
          />
        </section>

        <section
          ref="rulesSectionRef"
          class="relative mt-4 scroll-mt-4"
        >
          <GameRulesPanel
            :rules="ruleItems"
            :prize-notes="prizeNoteItems"
          />
        </section>

        <GameClaimInfo
          class="relative mt-4"
          :title="campaign.claimTitle"
          :description="campaign.claimDescription"
          :contact-text="campaign.contactText"
          variant="dark"
          @open-history="scrollToSection('logs')"
          @share="shareCampaign"
        />

        <section
          ref="logsSectionRef"
          class="relative mt-4 scroll-mt-4"
        >
          <GameDrawLogs
            :logs="drawLogs"
            :latest-log-id="latestDrawLogId"
            variant="dark"
            @clear="clearDrawLogs"
          />
        </section>

        <GameFooterInfo
          class="relative mt-5"
          :merchant-name="campaign.brandName"
          status-label="草案預覽"
          status-icon="🧩"
          :source-label="getTrafficSourceLabel()"
          :loaded-at="loadedAt"
          variant="dark"
        />

        <p class="relative mt-4 text-center text-[11px] font-bold leading-5 text-white/70">
          {{ campaign.noticeText }}
        </p>
      </main>
    </template>
  </GameShell>

    <GameQuickNav
      :items="quickNavItems"
      :show-nav-bar="false"
      :show-floating-top="true"
      variant="dark"
      @navigate="scrollToSection"
    />

    <GameResultModal
      :show="showResultModal"
      :prize="resultPrize"
      :game-title="campaign.pageTitle"
      :merchant-name="campaign.brandName"
      :activity-url="currentShareUrl"
      :remaining-chances="chances"
      :shared-count="sharedCount"
      :claim-description="campaign.claimDescription"
      :contact-text="campaign.contactText"
      :synced-at="loadedAt"
      @close="closeResult"
      @continue="closeResult"
      @share="shareCampaign"
      @copy-result="copyResultText"
      @open-history="scrollToSection('logs')"
    />
  </div>
</template>
