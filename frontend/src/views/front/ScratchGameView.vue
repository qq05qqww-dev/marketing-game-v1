<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { playDrawApi } from '../../api/draw'

const props = defineProps({
  campaign: {
    type: Object,
    default: () => ({})
  },
  prizes: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['refresh-campaign'])

const loading = ref(false)
const scratched = ref(false)
const scratchProgress = ref(0)
const isPointerDown = ref(false)
const scratchCanvas = ref(null)
const scratchWrap = ref(null)

const result = ref(null)
const resultText = ref('')
const resultType = ref('')
const showResultModal = ref(false)
const showCelebration = ref(false)
const canvasReady = ref(false)

const errorAlert = ref({
  show: false,
  type: 'default',
  icon: '⚠️',
  title: '',
  message: '',
  hint: ''
})

const prizeTitle = computed(() => {
  return result.value?.prize?.title || result.value?.prize?.name || ''
})

const resultEmoji = computed(() => {
  if (resultType.value === 'WIN') return '🎉'
  if (resultType.value === 'RETRY') return '🔁'
  if (resultType.value === 'THANKS') return '🙏'
  if (resultType.value === 'EMPTY') return '📦'
  if (resultType.value === 'ERROR') return '⚠️'
  return '🎫'
})

const resultCardClass = computed(() => {
  if (resultType.value === 'WIN') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (resultType.value === 'RETRY') {
    return 'border-sky-200 bg-sky-50 text-sky-700'
  }

  if (resultType.value === 'EMPTY') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  if (resultType.value === 'ERROR') {
    return 'border-rose-200 bg-rose-50 text-rose-700'
  }

  return 'border-slate-200 bg-slate-50 text-slate-700'
})

const totalPrizeCount = computed(() => {
  return props.prizes?.length || props.campaign?.prizes?.length || 0
})

const availablePrizeCount = computed(() => {
  const list = props.prizes?.length ? props.prizes : props.campaign?.prizes || []

  return list.filter((item) => Number(item.remainStock ?? item.stock ?? 0) > 0).length
})

const formatDateTime = (value) => {
  if (!value) return '未設定'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value).replace('T', ' ').slice(0, 16)
  }

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}

const resolveResultText = (data) => {
  const title = data?.prize?.title || data?.prize?.name || ''

  if (data?.resultType === 'WIN') {
    return `恭喜刮中：${title || '獎品'}`
  }

  if (data?.resultType === 'RETRY') {
    return '恭喜刮到：再玩一次'
  }

  if (data?.resultType === 'THANKS') {
    return '本次結果：銘謝惠顧'
  }

  if (data?.resultType === 'EMPTY') {
    return '很抱歉，目前獎品已發完'
  }

  return '這次沒有中獎，再試試看吧'
}

function getErrorMeta(message = '', status = 0) {
  const text = String(message || '')

  if (status === 401 || text.includes('請先登入') || text.includes('登入已失效')) {
    return {
      type: 'login',
      icon: '🔐',
      title: '需要先登入',
      message: text || '請先登入後再參加活動。',
      hint: '請先登入會員帳號，再回到活動頁重新遊玩。'
    }
  }

  if (text.includes('今日抽獎次數已用完')) {
    return {
      type: 'limit',
      icon: '⏳',
      title: '今日次數已用完',
      message: text,
      hint: '可以明天再回來參加，或查看其他活動。'
    }
  }

  if (text.includes('本活動可抽次數已用完')) {
    return {
      type: 'limit',
      icon: '🎟️',
      title: '活動總次數已用完',
      message: text,
      hint: '你已達成本活動的總遊玩次數限制。'
    }
  }

  if (text.includes('活動尚未開始')) {
    return {
      type: 'time',
      icon: '📅',
      title: '活動尚未開始',
      message: text,
      hint: '請確認活動開始時間，時間到後就可以參加。'
    }
  }

  if (text.includes('活動已結束')) {
    return {
      type: 'time',
      icon: '🏁',
      title: '活動已結束',
      message: text,
      hint: '此活動已經結束，可以返回活動列表查看其他活動。'
    }
  }

  if (text.includes('活動未啟用')) {
    return {
      type: 'inactive',
      icon: '🚧',
      title: '活動尚未啟用',
      message: text,
      hint: '請等待管理員啟用活動後再參加。'
    }
  }

  if (text.includes('沒有參加資格') || text.includes('會員參加') || text.includes('限')) {
    return {
      type: 'permission',
      icon: '⭐',
      title: '資格不符合',
      message: text,
      hint: '請確認你的會員等級或角色是否符合本活動條件。'
    }
  }

  if (text.includes('獎品已發完') || text.includes('沒有可抽獎項')) {
    return {
      type: 'empty',
      icon: '🎁',
      title: '獎項已發完',
      message: text,
      hint: '本活動目前沒有可抽獎項，可以稍後再試或查看其他活動。'
    }
  }

  return {
    type: 'default',
    icon: '⚠️',
    title: '刮刮樂失敗',
    message: text || '刮刮樂失敗，請稍後再試。',
    hint: '請稍後重試，或確認網路與登入狀態。'
  }
}

function setError(message, status = 0) {
  errorAlert.value = {
    show: true,
    ...getErrorMeta(message, status)
  }
}

function clearError() {
  errorAlert.value = {
    show: false,
    type: 'default',
    icon: '⚠️',
    title: '',
    message: '',
    hint: ''
  }
}

const getCanvasContext = () => {
  const canvas = scratchCanvas.value
  if (!canvas) return null

  return canvas.getContext('2d')
}

const drawScratchCover = async () => {
  await nextTick()

  const canvas = scratchCanvas.value
  const wrap = scratchWrap.value

  if (!canvas || !wrap) return

  const rect = wrap.getBoundingClientRect()
  const ratio = window.devicePixelRatio || 1

  canvas.width = rect.width * ratio
  canvas.height = rect.height * ratio
  canvas.style.width = `${rect.width}px`
  canvas.style.height = `${rect.height}px`

  const ctx = canvas.getContext('2d')
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)

  const width = rect.width
  const height = rect.height

  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#cbd5e1')
  gradient.addColorStop(0.35, '#94a3b8')
  gradient.addColorStop(0.7, '#64748b')
  gradient.addColorStop(1, '#cbd5e1')

  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = 'rgba(255,255,255,0.22)'
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    const size = Math.random() * 2.5 + 0.8
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = '900 28px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('左右滑動刮開', width / 2, height / 2 - 16)

  ctx.font = '700 16px Arial'
  ctx.fillStyle = 'rgba(255,255,255,0.72)'
  ctx.fillText('SCRATCH HERE', width / 2, height / 2 + 24)

  canvasReady.value = true
}

const getPointerPosition = (event) => {
  const canvas = scratchCanvas.value

  if (!canvas) {
    return {
      x: 0,
      y: 0
    }
  }

  const rect = canvas.getBoundingClientRect()
  const source = event.touches?.[0] || event.changedTouches?.[0] || event

  return {
    x: source.clientX - rect.left,
    y: source.clientY - rect.top
  }
}

const scratchAt = (event) => {
  if (scratched.value || loading.value || !canvasReady.value) return

  const ctx = getCanvasContext()
  const canvas = scratchCanvas.value

  if (!ctx || !canvas) return

  const { x, y } = getPointerPosition(event)

  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(x, y, 28, 0, Math.PI * 2)
  ctx.fill()

  ctx.beginPath()
  ctx.arc(x, y, 16, 0, Math.PI * 2)
  ctx.fill()

  calculateScratchProgress()
}

const calculateScratchProgress = () => {
  const canvas = scratchCanvas.value
  const ctx = getCanvasContext()

  if (!canvas || !ctx) return

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const pixels = imageData.data
  let transparentPixels = 0

  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i] === 0) {
      transparentPixels += 1
    }
  }

  const totalPixels = canvas.width * canvas.height
  const percent = Math.round((transparentPixels / totalPixels) * 100)

  scratchProgress.value = Math.min(percent, 100)

  if (scratchProgress.value >= 45 && !scratched.value && !loading.value) {
    revealResult()
  }
}

const handlePointerDown = (event) => {
  if (scratched.value || loading.value) return

  isPointerDown.value = true
  scratchAt(event)
}

const handlePointerMove = (event) => {
  if (!isPointerDown.value) return

  event.preventDefault()
  scratchAt(event)
}

const handlePointerUp = () => {
  isPointerDown.value = false
}

const quickScratch = () => {
  if (scratched.value || loading.value) return

  const canvas = scratchCanvas.value
  const ctx = getCanvasContext()

  if (canvas && ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  scratchProgress.value = 100
  revealResult()
}

const revealResult = async () => {
  if (loading.value || scratched.value) return

  loading.value = true
  result.value = null
  resultText.value = ''
  resultType.value = ''
  showResultModal.value = false
  showCelebration.value = false
  clearError()

  try {
    const res = await playDrawApi(props.campaign?.id)
    const data = res?.data?.data || {}

    result.value = data
    resultType.value = data?.resultType || 'LOSE'
    resultText.value = resolveResultText(data)

    setTimeout(async () => {
      scratched.value = true
      loading.value = false
      showResultModal.value = true

      const canvas = scratchCanvas.value
      const ctx = getCanvasContext()

      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }

      if (data?.resultType === 'WIN') {
        showCelebration.value = true

        setTimeout(() => {
          showCelebration.value = false
        }, 2800)
      }

      emit('refresh-campaign')
    }, 600)
  } catch (error) {
    console.error('刮刮樂失敗:', error)

    const status = Number(error?.response?.status || 0)
    const message =
      error?.response?.data?.message ||
      error?.message ||
      '刮刮樂失敗，請稍後再試'

    loading.value = false
    scratched.value = false
    result.value = null
    resultText.value = ''
    resultType.value = 'ERROR'

    await drawScratchCover()

    setError(message, status)
  }
}

const resetScratch = async () => {
  loading.value = false
  scratched.value = false
  scratchProgress.value = 0
  isPointerDown.value = false
  result.value = null
  resultText.value = ''
  resultType.value = ''
  showResultModal.value = false
  showCelebration.value = false
  clearError()

  await drawScratchCover()
}

const closeResultModal = () => {
  showResultModal.value = false
}

watch(
  () => props.campaign?.id,
  async () => {
    await resetScratch()
  },
  {
    immediate: true
  }
)
</script>

<template>
  <div
    class="min-h-[calc(100vh-120px)] px-4 pb-10"
    @mouseup="handlePointerUp"
    @mouseleave="handlePointerUp"
    @touchend="handlePointerUp"
  >
    <div class="mx-auto max-w-7xl space-y-8">
      <section class="relative overflow-hidden rounded-[36px] border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-8 shadow-sm">
        <div class="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl"></div>
        <div class="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-orange-200/40 blur-3xl"></div>

        <div class="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div class="mb-4 inline-flex rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-700">
              Scratch Game
            </div>

            <h1 class="text-4xl font-black leading-tight text-slate-900 md:text-5xl">
              {{ campaign?.title || '刮刮樂遊戲' }}
            </h1>

            <p class="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              {{ campaign?.description || '按住灰色刮膜左右滑動，刮開後揭曉活動獎勵。' }}
            </p>
          </div>

          <div class="min-w-[240px] rounded-3xl border border-white bg-white/80 p-5 text-slate-700 shadow-sm backdrop-blur">
            <div class="mb-2 text-sm font-bold text-slate-400">
              活動期間
            </div>
            <div>{{ formatDateTime(campaign?.startAt) }}</div>
            <div>{{ formatDateTime(campaign?.endAt) }}</div>
          </div>
        </div>
      </section>

      <section class="grid grid-cols-1 gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div class="space-y-6">
          <div class="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="mb-5 text-2xl font-black text-slate-900">
              活動規則
            </h2>

            <ul class="space-y-3 text-slate-700">
              <li>✅ 按住灰色刮膜左右滑動刮開</li>
              <li>✅ 刮開 45% 以上即可揭曉結果</li>
              <li>✅ 每日次數：{{ campaign?.dailyLimit ?? '未設定' }}</li>
              <li>✅ 每人總次數：{{ campaign?.totalLimit ?? '未設定' }}</li>
              <li>✅ 資格限制：{{ campaign?.requiredLevel || '不限等級' }}</li>
              <li>✅ 結果由後端統一抽獎 API 判定</li>
            </ul>
          </div>

          <div
            v-if="errorAlert.show"
            class="play-error-card"
            :class="`type-${errorAlert.type}`"
          >
            <div class="play-error-icon">
              {{ errorAlert.icon }}
            </div>

            <div class="play-error-content">
              <div class="play-error-title">
                {{ errorAlert.title }}
              </div>

              <div class="play-error-message">
                {{ errorAlert.message }}
              </div>

              <div class="play-error-hint">
                {{ errorAlert.hint }}
              </div>
            </div>

            <button
              class="play-error-close"
              type="button"
              @click="clearError"
            >
              ×
            </button>
          </div>

          <div
            class="rounded-3xl border p-5 shadow-sm"
            :class="resultCardClass"
          >
            <div class="mb-2 text-sm text-slate-400">
              最新刮刮樂結果
            </div>

            <div class="mb-2 text-3xl">
              {{ resultEmoji }}
            </div>

            <div class="mb-2 text-lg font-black">
              {{ resultText || '尚未刮開' }}
            </div>

            <div
              v-if="prizeTitle"
              class="text-sm"
            >
              獎項：{{ prizeTitle }}
            </div>

            <div
              v-if="result?.code"
              class="mt-3 rounded-xl bg-white/70 px-4 py-3 font-mono text-sm font-bold"
            >
              兌換碼：{{ result.code }}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm">
              <p class="text-xs font-bold text-slate-400">
                獎項數
              </p>
              <p class="mt-2 text-3xl font-black text-slate-900">
                {{ totalPrizeCount }}
              </p>
            </div>

            <div class="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 text-center shadow-sm">
              <p class="text-xs font-bold text-emerald-500">
                可用獎項
              </p>
              <p class="mt-2 text-3xl font-black text-emerald-700">
                {{ availablePrizeCount }}
              </p>
            </div>
          </div>
        </div>

        <div class="relative overflow-hidden rounded-[36px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div
            v-if="showCelebration"
            class="celebration-layer"
          >
            <div
              v-for="index in 42"
              :key="index"
              class="celebration-dot"
              :style="{
                left: `${(index * 6.7) % 100}%`,
                animationDelay: `${(index % 8) * 0.08}s`,
                animationDuration: `${2.2 + (index % 4) * 0.25}s`
              }"
            ></div>
          </div>

          <div class="mx-auto max-w-xl">
            <div class="mb-6 text-center">
              <h2 class="text-3xl font-black text-slate-900">
                滑動刮開
              </h2>
              <p class="mt-2 text-slate-500">
                按住灰色刮膜左右滑動，刮開超過 45% 後自動揭曉。
              </p>
            </div>

            <div class="relative overflow-hidden rounded-[36px] border-4 border-amber-300 bg-gradient-to-br from-amber-100 via-yellow-100 to-orange-100 p-8 shadow-xl">
              <div class="absolute inset-0 opacity-30">
                <div class="h-full w-full bg-[radial-gradient(circle_at_20%_20%,#ffffff_0,transparent_22%),radial-gradient(circle_at_80%_30%,#ffffff_0,transparent_18%),radial-gradient(circle_at_50%_80%,#ffffff_0,transparent_20%)]"></div>
              </div>

              <div class="relative z-10 text-center">
                <div class="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl shadow-sm">
                  🎫
                </div>

                <p class="text-sm font-black uppercase tracking-[0.3em] text-amber-700">
                  Lucky Scratch
                </p>

                <h2 class="mt-3 text-3xl font-black text-slate-900">
                  {{ scratched ? '結果已揭曉' : loading ? '判定中...' : '刮開獎區' }}
                </h2>

                <div class="mt-8 rounded-[28px] bg-white p-6 shadow-inner">
                  <div
                    ref="scratchWrap"
                    class="relative h-56 overflow-hidden rounded-[24px] border border-amber-100 bg-gradient-to-br from-white via-amber-50 to-orange-50"
                  >
                    <div class="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                      <div class="text-6xl">
                        {{ resultEmoji }}
                      </div>

                      <p class="mt-4 text-2xl font-black text-slate-900">
                        {{ resultText || '刮開後揭曉' }}
                      </p>

                      <p
                        v-if="prizeTitle"
                        class="mt-2 text-sm font-bold text-slate-600"
                      >
                        {{ prizeTitle }}
                      </p>
                    </div>

                    <canvas
                      v-show="!scratched"
                      ref="scratchCanvas"
                      class="scratch-canvas"
                      @mousedown.prevent="handlePointerDown"
                      @mousemove.prevent="handlePointerMove"
                      @mouseup.prevent="handlePointerUp"
                      @mouseleave.prevent="handlePointerUp"
                      @touchstart.prevent="handlePointerDown"
                      @touchmove.prevent="handlePointerMove"
                      @touchend.prevent="handlePointerUp"
                    ></canvas>

                    <div
                      v-if="loading"
                      class="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm"
                    >
                      <div class="text-center">
                        <div class="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-amber-200 border-t-amber-500"></div>
                        <p class="font-black text-slate-700">
                          正在揭曉結果...
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="mt-5">
                  <div class="mb-2 flex items-center justify-between text-sm font-bold text-slate-600">
                    <span>刮開進度</span>
                    <span>{{ scratchProgress }}%</span>
                  </div>

                  <div class="h-3 overflow-hidden rounded-full bg-white/70">
                    <div
                      class="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                      :style="{ width: `${scratchProgress}%` }"
                    ></div>
                  </div>
                </div>

                <div class="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    @click="quickScratch"
                    :disabled="loading || scratched"
                    class="flex-1 rounded-2xl bg-amber-500 px-6 py-4 text-lg font-black text-white shadow-lg transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {{ loading ? '刮開中...' : scratched ? '已刮開' : '一鍵刮開' }}
                  </button>

                  <button
                    @click="resetScratch"
                    class="rounded-2xl bg-slate-200 px-6 py-4 font-black text-slate-700 transition hover:bg-slate-300"
                  >
                    重置畫面
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div
      v-if="showResultModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4"
    >
      <div class="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div class="mb-4 text-6xl">
          {{ resultEmoji }}
        </div>

        <h3 class="mb-3 text-2xl font-black text-slate-900">
          刮刮樂結果
        </h3>

        <div
          class="mb-6 rounded-2xl border p-4"
          :class="resultCardClass"
        >
          <div class="text-lg font-bold">
            {{ resultText }}
          </div>

          <div
            v-if="prizeTitle"
            class="mt-2 text-sm"
          >
            獎項：{{ prizeTitle }}
          </div>

          <div
            v-if="result?.code"
            class="mt-3 rounded-xl bg-white/70 px-4 py-3 font-mono text-sm font-bold"
          >
            兌換碼：{{ result.code }}
          </div>
        </div>

        <div class="flex justify-center gap-3">
          <button
            @click="closeResultModal"
            class="rounded-xl bg-slate-900 px-6 py-3 font-bold text-white transition hover:bg-slate-800"
          >
            我知道了
          </button>

          <button
            @click="resetScratch"
            class="rounded-xl bg-slate-200 px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-300"
          >
            再刮一次
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scratch-canvas {
  position: absolute;
  inset: 0;
  z-index: 5;
  width: 100%;
  height: 100%;
  cursor: grab;
  touch-action: none;
}

.scratch-canvas:active {
  cursor: grabbing;
}

.play-error-card {
  width: 100%;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.08);
  padding: 18px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 14px;
  align-items: start;
}

.play-error-card.type-login {
  border-color: #bfdbfe;
  background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
}

.play-error-card.type-limit {
  border-color: #fde68a;
  background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%);
}

.play-error-card.type-time {
  border-color: #ddd6fe;
  background: linear-gradient(135deg, #f5f3ff 0%, #ffffff 100%);
}

.play-error-card.type-inactive {
  border-color: #fed7aa;
  background: linear-gradient(135deg, #fff7ed 0%, #ffffff 100%);
}

.play-error-card.type-permission {
  border-color: #fbcfe8;
  background: linear-gradient(135deg, #fdf2f8 0%, #ffffff 100%);
}

.play-error-card.type-empty {
  border-color: #e2e8f0;
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
}

.play-error-card.type-default {
  border-color: #fecaca;
  background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%);
}

.play-error-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.08);
}

.play-error-title {
  color: #0f172a;
  font-size: 20px;
  font-weight: 900;
  line-height: 1.2;
}

.play-error-message {
  margin-top: 6px;
  color: #334155;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.6;
}

.play-error-hint {
  margin-top: 4px;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.6;
}

.play-error-close {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.18s ease;
}

.play-error-close:hover {
  background: #e2e8f0;
  transform: scale(1.05);
}

.celebration-layer {
  pointer-events: none;
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 20;
}

.celebration-dot {
  position: absolute;
  top: -10%;
  width: 10px;
  height: 18px;
  border-radius: 3px;
  background: linear-gradient(135deg, #facc15, #fb7185);
  animation-name: celebrationFall;
  animation-timing-function: linear;
  animation-iteration-count: 1;
}

@keyframes celebrationFall {
  0% {
    transform: translate3d(0, -5vh, 0) rotate(0deg);
    opacity: 1;
  }

  50% {
    transform: translate3d(18px, 48vh, 0) rotate(240deg);
    opacity: 0.95;
  }

  100% {
    transform: translate3d(-12px, 108vh, 0) rotate(520deg);
    opacity: 0;
  }
}

@media (max-width: 768px) {
  .play-error-card {
    grid-template-columns: auto 1fr auto;
    padding: 14px;
    border-radius: 20px;
  }

  .play-error-icon {
    width: 42px;
    height: 42px;
    font-size: 22px;
  }

  .play-error-title {
    font-size: 18px;
  }

  .play-error-message {
    font-size: 14px;
  }
}
</style>