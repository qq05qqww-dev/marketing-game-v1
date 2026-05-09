<script setup>
import { computed, ref, watch } from 'vue'

/**
 * Multi Game Platform V2.3 第 232 批：砸金蛋槌頭朝蛋裂殼強化版
 *
 * 檔案位置：
 * frontend/src/views/front/games/playboards/EggSmashPlayBoard.vue
 *
 * 本批目的：
 * 1. 修正第 231 批槌子看起來像敲四邊，不像敲金蛋的問題。
 * 2. 槌子仍從上、右、下、左四個方向出現，但槌頭都朝向金蛋中心。
 * 3. 每次敲擊會增加裂痕階段，讓蛋殼裂開更明顯。
 * 4. 最後蛋殼破掉，卡片內顯示獎品。
 * 5. 不使用圖片，全部用 Vue + Tailwind/CSS + emoji/文字完成。
 *
 * 本批安全原則：
 * - 不修改 router/index.js
 * - 不修改 PremiumGridLotteryView.vue
 * - 不修改 AdminCommonGameEditorView.vue
 * - 不取代正式九宮格頁
 * - 不接正式路由
 * - 只覆蓋 EggSmashPlayBoard.vue
 */

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  isDrawing: {
    type: Boolean,
    default: false
  },
  activeIndex: {
    type: Number,
    default: -1
  },
  disabled: {
    type: Boolean,
    default: false
  },
  eggCount: {
    type: Number,
    default: 9
  },
  hammerEnabled: {
    type: Boolean,
    default: true
  },
  brokenEggEffect: {
    type: String,
    default: 'gold-particles'
  },
  buttonText: {
    type: String,
    default: '立即砸蛋'
  }
})

const emit = defineEmits(['draw', 'select-egg'])

const selectedEggIndex = ref(-1)
const crackedEggIndexes = ref([])
const brokenEggIndexes = ref([])
const hammerEggIndex = ref(-1)
const hammerDirection = ref('top')
const crackLevelByEgg = ref({})
const lastSmashedEggIndex = ref(-1)
const localMessage = ref('選一顆金蛋，準備敲開驚喜好禮。')
const localSmashing = ref(false)
const drawSubmitted = ref(false)
const revealedPrizeByEgg = ref({})

const hammerDirections = ['top', 'right', 'bottom', 'left']

const normalizedEggs = computed(() => {
  const safeCount = Math.max(1, Math.min(Number(props.eggCount || 9), 12))
  const sourceItems = props.items.length > 0 ? props.items : []

  return Array.from({ length: safeCount }).map((_, index) => {
    const source = sourceItems[index % Math.max(sourceItems.length, 1)] || {}

    return {
      id: source.id || `egg-${index + 1}`,
      index,
      name: source.name || source.title || `金蛋 ${index + 1}`,
      title: source.title || source.name || `金蛋 ${index + 1}`,
      shortName: source.shortName || source.name || source.title || `獎品 ${index + 1}`,
      icon: source.icon || '🎁',
      remaining: Number(source.remaining ?? source.quantity ?? 1),
      disabled: Boolean(source.disabled),
      raw: source
    }
  })
})

const availableEggs = computed(() => {
  return normalizedEggs.value.filter((egg) => {
    return !egg.disabled && !brokenEggIndexes.value.includes(egg.index)
  })
})

const boardLocked = computed(() => {
  return props.disabled || props.isDrawing || localSmashing.value || drawSubmitted.value
})

const canSmash = computed(() => {
  return !boardLocked.value && availableEggs.value.length > 0
})

const directionText = computed(() => {
  const map = {
    top: '從上方',
    right: '從右側',
    bottom: '從下方',
    left: '從左側'
  }

  return map[hammerDirection.value] || '朝向金蛋'
})

const statusText = computed(() => {
  if (localSmashing.value) return `槌子${directionText.value}朝金蛋敲擊中...`
  if (props.isDrawing) return '等待抽獎結果...'
  if (props.disabled) return '目前暫不可玩'
  if (drawSubmitted.value) return '已送出結果，等待彈窗...'
  if (availableEggs.value.length === 0) return '金蛋已全部敲開'
  if (selectedEggIndex.value >= 0) return `已選擇第 ${selectedEggIndex.value + 1} 顆金蛋`

  return '請選擇一顆金蛋'
})

const selectedEgg = computed(() => {
  return normalizedEggs.value.find((egg) => egg.index === selectedEggIndex.value) || null
})

const fallbackEgg = computed(() => {
  if (selectedEgg.value && !isEggBroken(selectedEgg.value.index) && !selectedEgg.value.disabled) {
    return selectedEgg.value
  }

  return availableEggs.value[0] || normalizedEggs.value[0] || null
})

const gridClass = computed(() => {
  if (normalizedEggs.value.length <= 2) return 'grid-cols-2'
  if (normalizedEggs.value.length <= 4) return 'grid-cols-2'
  if (normalizedEggs.value.length <= 6) return 'grid-cols-2 sm:grid-cols-3'

  return 'grid-cols-3'
})

const cardSizeClass = computed(() => {
  if (normalizedEggs.value.length >= 10) {
    return 'min-h-[128px] sm:min-h-[178px]'
  }

  if (normalizedEggs.value.length >= 7) {
    return 'min-h-[138px] sm:min-h-[190px]'
  }

  return 'min-h-[148px] sm:min-h-[200px]'
})

const eggShellSizeClass = computed(() => {
  if (normalizedEggs.value.length >= 10) {
    return 'h-16 w-14 sm:h-28 sm:w-24'
  }

  if (normalizedEggs.value.length >= 7) {
    return 'h-18 w-16 sm:h-30 sm:w-26'
  }

  return 'h-20 w-16 sm:h-32 sm:w-28'
})

const stageNote = computed(() => {
  const effectTextMap = {
    'gold-particles': '金粉粒子',
    'shine-burst': '閃光爆發',
    'confetti-pop': '彩帶彈出',
    'simple-crack': '簡易裂蛋'
  }

  return effectTextMap[props.brokenEggEffect] || props.brokenEggEffect || '預設特效'
})

const effectBadgeClass = computed(() => {
  const classMap = {
    'gold-particles': 'bg-amber-100 text-amber-700',
    'shine-burst': 'bg-yellow-100 text-yellow-700',
    'confetti-pop': 'bg-pink-100 text-pink-700',
    'simple-crack': 'bg-slate-100 text-slate-600'
  }

  return classMap[props.brokenEggEffect] || 'bg-amber-100 text-amber-700'
})

function isEggCracked(index) {
  return crackedEggIndexes.value.includes(index)
}

function isEggBroken(index) {
  return brokenEggIndexes.value.includes(index)
}

function isEggActive(index) {
  return Number(props.activeIndex) === index || selectedEggIndex.value === index
}

function isEggHammering(index) {
  return props.hammerEnabled && hammerEggIndex.value === index
}

function isLastSmashed(index) {
  return lastSmashedEggIndex.value === index
}

function showEffect(index) {
  return isLastSmashed(index) && isEggBroken(index)
}

function getCrackLevel(index) {
  return Number(crackLevelByEgg.value[index] || 0)
}

function getRevealedPrize(egg) {
  return revealedPrizeByEgg.value[egg.index] || egg.shortName || egg.name
}

/**
 * 槌子位置說明：
 * 這裡不是讓槌子敲卡片四邊，而是讓槌子從四個方向靠近金蛋中心。
 * 每個方向都用 rotate 讓槌頭視覺上朝向蛋。
 */
function getHammerPositionClass(index) {
  if (!isEggHammering(index)) return 'hidden'

  const map = {
    top: 'left-1/2 top-[14%] -translate-x-1/2 -translate-y-1 rotate-[135deg]',
    right: 'right-[12%] top-1/2 -translate-y-1/2 rotate-[225deg]',
    bottom: 'bottom-[14%] left-1/2 -translate-x-1/2 translate-y-1 rotate-[-45deg]',
    left: 'left-[12%] top-1/2 -translate-y-1/2 rotate-[45deg]'
  }

  return map[hammerDirection.value] || map.top
}

const selectEgg = (egg) => {
  if (boardLocked.value) return
  if (egg.disabled) return
  if (isEggBroken(egg.index)) return

  selectedEggIndex.value = egg.index
  localMessage.value = `已選擇「${egg.name}」，點擊下方按鈕開始砸蛋。`

  emit('select-egg', {
    egg,
    index: egg.index
  })
}

const sleep = (ms) => {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

const increaseCrackLevel = (index) => {
  const nextLevel = Math.min(4, getCrackLevel(index) + 1)

  crackLevelByEgg.value = {
    ...crackLevelByEgg.value,
    [index]: nextLevel
  }

  if (!crackedEggIndexes.value.includes(index)) {
    crackedEggIndexes.value = [
      ...crackedEggIndexes.value,
      index
    ]
  }
}

const runFourWayHammerAnimation = async (index) => {
  if (!props.hammerEnabled) {
    await sleep(260)
    increaseCrackLevel(index)
    return
  }

  hammerEggIndex.value = index

  for (const direction of hammerDirections) {
    hammerDirection.value = direction
    localMessage.value = `槌子${direction === 'top' ? '從上方' : direction === 'right' ? '從右側' : direction === 'bottom' ? '從下方' : '從左側'}朝金蛋中心敲擊...`

    await sleep(180)
    increaseCrackLevel(index)
    await sleep(130)
  }

  hammerEggIndex.value = -1
}

const smashSelectedEgg = async () => {
  if (!canSmash.value) return

  const targetEgg = fallbackEgg.value

  if (!targetEgg) {
    localMessage.value = '目前沒有可敲開的金蛋。'
    return
  }

  localSmashing.value = true
  selectedEggIndex.value = targetEgg.index
  lastSmashedEggIndex.value = targetEgg.index
  localMessage.value = `正在敲開「${targetEgg.name}」...`

  await runFourWayHammerAnimation(targetEgg.index)

  localMessage.value = '蛋殼裂開中...'
  await sleep(260)

  if (!brokenEggIndexes.value.includes(targetEgg.index)) {
    brokenEggIndexes.value = [
      ...brokenEggIndexes.value,
      targetEgg.index
    ]
  }

  revealedPrizeByEgg.value = {
    ...revealedPrizeByEgg.value,
    [targetEgg.index]: targetEgg.shortName || targetEgg.name
  }

  drawSubmitted.value = true

  emit('draw', {
    source: 'EggSmashPlayBoard_v23_batch232',
    egg: targetEgg,
    eggIndex: targetEgg.index,
    eggCount: normalizedEggs.value.length,
    brokenEggEffect: props.brokenEggEffect,
    revealedPrizeName: targetEgg.shortName || targetEgg.name
  })

  localMessage.value = `蛋殼破掉，出現「${targetEgg.shortName || targetEgg.name}」。`
  localSmashing.value = false
}

const resetLocalState = () => {
  if (props.isDrawing || localSmashing.value) return

  selectedEggIndex.value = -1
  hammerEggIndex.value = -1
  lastSmashedEggIndex.value = -1
  crackedEggIndexes.value = []
  brokenEggIndexes.value = []
  crackLevelByEgg.value = {}
  localSmashing.value = false
  drawSubmitted.value = false
  revealedPrizeByEgg.value = {}
  localMessage.value = '選一顆金蛋，準備敲開驚喜好禮。'
}

watch(
  () => props.isDrawing,
  (value, oldValue) => {
    if (oldValue && !value) {
      drawSubmitted.value = false
      localSmashing.value = false
      localMessage.value = '本次砸蛋流程已完成，可繼續測試下一顆金蛋。'
    }
  }
)
</script>

<template>
  <section class="relative overflow-hidden rounded-[1.5rem] border border-amber-100 bg-gradient-to-br from-[#8b3a16] via-[#a94b1d] to-[#f0a12b] p-3 shadow-xl shadow-amber-100/70 sm:rounded-[2rem] sm:p-6">
    <div class="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-yellow-300/40 blur-3xl"></div>
    <div class="pointer-events-none absolute -bottom-20 left-8 h-52 w-52 rounded-full bg-orange-300/30 blur-3xl"></div>
    <div class="pointer-events-none absolute inset-x-8 bottom-12 h-20 rounded-[999px] bg-amber-950/20 blur-2xl"></div>

    <div class="relative z-10 space-y-4 sm:space-y-5">
      <header class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div class="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/90 px-3 py-1 text-[11px] font-black text-amber-700 shadow-sm sm:text-xs">
            <span>🔨</span>
            <span>EggSmashPlayBoard</span>
            <span class="text-amber-300">｜</span>
            <span>第 232 批槌頭朝蛋</span>
          </div>

          <h2 class="mt-3 text-xl font-black text-white drop-shadow sm:text-3xl">
            槌子朝金蛋敲擊
          </h2>
          <p class="mt-2 max-w-2xl text-xs leading-5 text-amber-50 sm:text-sm sm:leading-6">
            槌子從四個方向靠近，但槌頭都朝向金蛋中心；蛋殼會逐步出現裂痕，最後破掉顯示獎品。
          </p>
        </div>

        <div class="rounded-2xl border border-white/25 bg-white/90 p-3 text-sm shadow-sm backdrop-blur sm:p-4">
          <p class="font-black text-amber-700">{{ statusText }}</p>
          <p class="mt-1 text-xs leading-5 text-slate-500">{{ localMessage }}</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <p class="inline-flex rounded-full px-3 py-1 text-[11px] font-black sm:text-xs" :class="effectBadgeClass">
              特效：{{ stageNote }}
            </p>
            <p class="inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-black text-slate-500 sm:text-xs">
              可敲：{{ availableEggs.length }} 顆
            </p>
          </div>
        </div>
      </header>

      <div class="relative overflow-hidden rounded-[1.5rem] border border-white/20 bg-[#8b3a16]/60 p-2 shadow-inner sm:rounded-[2rem] sm:p-5">
        <div class="pointer-events-none absolute inset-x-8 bottom-4 h-10 rounded-full bg-amber-950/25 blur-xl"></div>

        <div class="relative grid gap-2 sm:gap-4" :class="gridClass">
          <button
            v-for="egg in normalizedEggs"
            :key="egg.id"
            type="button"
            class="group relative overflow-hidden rounded-[1.15rem] border p-2 text-center transition duration-200 sm:rounded-[1.5rem] sm:p-3"
            :class="[
              cardSizeClass,
              isEggActive(egg.index)
                ? 'border-yellow-300 bg-[#081224] shadow-2xl shadow-yellow-400/30 ring-4 ring-yellow-300/40'
                : 'border-white/15 bg-[#081224] shadow-lg shadow-black/30 hover:-translate-y-1 hover:border-yellow-300/80 hover:shadow-2xl hover:shadow-yellow-400/20',
              boardLocked ? 'cursor-not-allowed opacity-75' : 'cursor-pointer',
              isEggBroken(egg.index) ? 'opacity-95' : '',
              isLastSmashed(egg.index) ? 'ring-4 ring-yellow-300/60' : ''
            ]"
            :disabled="boardLocked"
            @click="selectEgg(egg)"
          >
            <div class="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/25"></div>
            <div class="absolute inset-x-2 top-2 h-px bg-white/30"></div>
            <div class="absolute inset-x-3 bottom-2 h-8 rounded-full bg-black/40 blur-md"></div>

            <div
              v-if="isEggHammering(egg.index)"
              class="absolute z-30 text-4xl drop-shadow-lg animate-bounce sm:text-5xl"
              :class="getHammerPositionClass(egg.index)"
            >
              🔨
            </div>

            <div
              v-if="showEffect(egg.index) && brokenEggEffect === 'gold-particles'"
              class="pointer-events-none absolute inset-0 z-20"
            >
              <span class="absolute left-4 top-4 text-sm animate-ping sm:text-lg">✨</span>
              <span class="absolute right-5 top-8 text-xs animate-ping sm:text-sm">⭐</span>
              <span class="absolute bottom-7 left-7 text-xs animate-ping sm:text-sm">💫</span>
              <span class="absolute bottom-5 right-6 text-xs animate-bounce sm:text-base">🌟</span>
            </div>

            <div
              v-if="showEffect(egg.index) && brokenEggEffect === 'shine-burst'"
              class="pointer-events-none absolute inset-0 z-20"
            >
              <div class="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-300/60 blur-xl animate-ping"></div>
              <span class="absolute left-1/2 top-3 -translate-x-1/2 text-lg animate-pulse">☀️</span>
              <span class="absolute bottom-5 left-1/2 -translate-x-1/2 text-sm animate-bounce">✨</span>
            </div>

            <div
              v-if="showEffect(egg.index) && brokenEggEffect === 'confetti-pop'"
              class="pointer-events-none absolute inset-0 z-20"
            >
              <span class="absolute left-3 top-3 text-lg animate-bounce">🎊</span>
              <span class="absolute right-4 top-5 text-sm animate-ping">🎉</span>
              <span class="absolute bottom-6 left-6 text-sm animate-bounce">✨</span>
              <span class="absolute bottom-4 right-6 text-base animate-ping">💥</span>
            </div>

            <div class="relative z-10 flex h-full flex-col items-center justify-center gap-1.5 sm:gap-3">
              <div
                class="relative flex items-center justify-center rounded-[50%] bg-gradient-to-br from-yellow-100 via-yellow-300 to-amber-600 shadow-[inset_-10px_-12px_18px_rgba(120,53,15,0.35),inset_8px_8px_16px_rgba(255,255,255,0.55),0_12px_20px_rgba(0,0,0,0.35)] transition"
                :class="[
                  eggShellSizeClass,
                  isEggBroken(egg.index) ? 'scale-95 opacity-95' : 'group-hover:scale-105',
                  isEggCracked(egg.index) && !isEggBroken(egg.index) ? 'scale-105 ring-4 ring-yellow-200' : '',
                  isEggActive(egg.index) ? 'animate-pulse' : '',
                  isEggHammering(egg.index) ? 'scale-110' : '',
                  showEffect(egg.index) && brokenEggEffect === 'shine-burst' ? 'ring-4 ring-yellow-300' : '',
                  showEffect(egg.index) && brokenEggEffect === 'confetti-pop' ? 'ring-4 ring-pink-200' : ''
                ]"
              >
                <div class="absolute left-[18%] top-[14%] h-5 w-3 rounded-full bg-white/80 blur-[1px] sm:h-8 sm:w-5"></div>
                <div class="absolute right-[20%] top-[30%] h-2 w-2 rounded-full bg-white/70 sm:h-3 sm:w-3"></div>
                <div class="absolute left-[25%] bottom-[26%] text-[10px] text-white/90 sm:text-sm">✦</div>
                <div class="absolute right-[18%] top-[20%] text-[9px] text-white/80 sm:text-xs">✦</div>

                <template v-if="!isEggBroken(egg.index)">
                  <div
                    v-if="getCrackLevel(egg.index) >= 1"
                    class="absolute inset-0 z-20 flex items-center justify-center text-4xl font-black text-amber-950/90 sm:text-6xl"
                  >
                    ⚡
                  </div>

                  <div
                    v-if="getCrackLevel(egg.index) >= 2"
                    class="absolute left-[42%] top-[12%] z-20 h-[72%] w-1 -rotate-12 rounded-full bg-amber-950/70 shadow-sm"
                  ></div>

                  <div
                    v-if="getCrackLevel(egg.index) >= 3"
                    class="absolute left-[28%] top-[38%] z-20 h-1 w-[46%] rotate-12 rounded-full bg-amber-950/70 shadow-sm"
                  ></div>

                  <div
                    v-if="getCrackLevel(egg.index) >= 4"
                    class="absolute left-[52%] top-[24%] z-20 h-[46%] w-1 rotate-[32deg] rounded-full bg-amber-950/70 shadow-sm"
                  ></div>

                  <div class="absolute bottom-[10%] flex h-7 w-7 items-center justify-center rounded-full border border-yellow-200 bg-[#0b1020] text-xs font-black text-white shadow-lg sm:h-9 sm:w-9 sm:text-sm">
                    {{ egg.index + 1 }}
                  </div>
                </template>

                <template v-else>
                  <div class="flex flex-col items-center justify-center px-1 text-center">
                    <div class="text-xl drop-shadow sm:text-4xl">🎁</div>
                    <div class="mt-1 max-w-[70px] rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-black leading-tight text-amber-800 shadow sm:max-w-[92px] sm:text-[11px]">
                      {{ getRevealedPrize(egg) }}
                    </div>
                  </div>
                </template>

                <span
                  v-if="isEggBroken(egg.index)"
                  class="absolute -right-1 -top-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-black text-white sm:px-2 sm:py-1 sm:text-xs"
                >
                  PRIZE
                </span>

                <span
                  v-if="isEggActive(egg.index) && !isEggBroken(egg.index)"
                  class="absolute -bottom-3 rounded-full bg-yellow-300 px-2 py-0.5 text-[9px] font-black text-slate-950 shadow sm:py-1 sm:text-[10px]"
                >
                  SELECTED
                </span>
              </div>

              <div>
                <p class="text-[10px] font-black tracking-wide text-yellow-100 sm:text-xs">
                  GOLD {{ egg.index + 1 }}
                </p>
                <p class="mt-0.5 line-clamp-1 text-[10px] font-bold text-white/50 sm:text-xs">
                  {{ isEggBroken(egg.index) ? getRevealedPrize(egg) : egg.shortName }}
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div class="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
        <div class="rounded-2xl border border-white/25 bg-white/90 p-3 backdrop-blur sm:p-4">
          <p class="text-sm font-black text-amber-700">玩法狀態</p>
          <p class="mt-1 text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">
            已選擇：
            <span class="font-black text-slate-950">
              {{ selectedEgg ? selectedEgg.name : '尚未選擇金蛋' }}
            </span>
            ｜已破蛋：
            <span class="font-black text-slate-950">{{ brokenEggIndexes.length }}</span>
            顆
            ｜裂痕：
            <span class="font-black text-slate-950">{{ selectedEgg ? getCrackLevel(selectedEgg.index) : 0 }}/4</span>
            ｜流程：
            <span class="font-black text-slate-950">{{ boardLocked ? '鎖定中' : '可操作' }}</span>
          </p>
        </div>

        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-row">
          <button
            type="button"
            class="rounded-2xl bg-yellow-400 px-6 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-900/20 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
            :disabled="!canSmash"
            @click="smashSelectedEgg"
          >
            {{ isDrawing || localSmashing ? '敲擊中...' : buttonText }}
          </button>

          <button
            type="button"
            class="rounded-2xl border border-white/30 bg-white px-5 py-3 text-sm font-black text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="props.isDrawing || localSmashing"
            @click="resetLocalState"
          >
            重置測試
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
