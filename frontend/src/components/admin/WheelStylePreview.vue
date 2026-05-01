<script setup>
import { computed } from 'vue'

const props = defineProps({
  config: {
    type: Object,
    default: () => ({})
  },
  campaignTitle: {
    type: String,
    default: ''
  },
  prizes: {
    type: Array,
    default: () => []
  }
})

const defaultItems = [
  '100 元折價券',
  '50 元折價券',
  '再玩一次',
  '銘謝惠顧',
  '保險套',
  '絲襪'
]

const previewCampaignTitle = computed(() => {
  return props.campaignTitle || props.config?.campaignTitle || '週年慶大轉盤'
})

const topText = computed(() => {
  return (
    props.config?.topText ||
    props.config?.helperText ||
    props.config?.descriptionText ||
    '立即登入抽驚喜好禮'
  )
})

const centerText = computed(() => {
  return props.config?.centerText || props.config?.buttonText || '開始'
})

const wheelBg1 = computed(() => props.config?.wheelBg1 || '#6fb4d6')
const wheelBg2 = computed(() => props.config?.wheelBg2 || '#e9cf57')
const outerColor1 = computed(() => props.config?.outerBorder1 || '#1b1b1b')
const outerColor2 = computed(() => props.config?.outerBorder2 || '#e0b54f')
const pointerColor = computed(() => props.config?.pointerColor || '#e11d48')
const centerBg = computed(() => props.config?.centerBg || '#f4edd2')
const centerTextColor = computed(() => props.config?.centerTextColor || '#111827')
const prizeTextColor = computed(() => props.config?.prizeTextColor || '#ffffff')
const descriptionColor = computed(() => props.config?.descriptionColor || '#dbeafe')

const buttonFontSize = computed(() => {
  const value = Number(props.config?.buttonFontSize || 25)
  return Math.max(16, Math.min(value, 48))
})

const descriptionFontSize = computed(() => {
  const value = Number(props.config?.descriptionFontSize || 14)
  return Math.max(10, Math.min(value, 28))
})

const wheelItems = computed(() => {
  if (Array.isArray(props.prizes) && props.prizes.length > 0) {
    return props.prizes
      .map((item) => {
        if (typeof item === 'string') return item
        if (typeof item === 'object' && item !== null) return item.title || item.name || ''
        return ''
      })
      .filter(Boolean)
  }

  return defaultItems
})

const segmentAngle = computed(() => {
  if (!wheelItems.value.length) return 360
  return 360 / wheelItems.value.length
})

const labelFontSize = computed(() => {
  const count = wheelItems.value.length
  if (count <= 6) return 5.2
  if (count <= 8) return 4.6
  if (count <= 10) return 4.1
  return 3.6
})

const bulbs = computed(() => {
  const total = 24
  const radius = 48
  const result = []

  for (let i = 0; i < total; i++) {
    const angle = (Math.PI * 2 * i) / total - Math.PI / 2
    const x = 50 + Math.cos(angle) * radius
    const y = 50 + Math.sin(angle) * radius
    result.push({ x, y })
  }

  return result
})

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  }
}

function getSectorPath(index) {
  const total = wheelItems.value.length || 1
  const angle = 360 / total

  const startAngle = index * angle
  const endAngle = (index + 1) * angle

  const outerRadius = 42
  const innerRadius = 16.5

  const startOuter = polarToCartesian(50, 50, outerRadius, startAngle)
  const endOuter = polarToCartesian(50, 50, outerRadius, endAngle)
  const startInner = polarToCartesian(50, 50, innerRadius, startAngle)
  const endInner = polarToCartesian(50, 50, innerRadius, endAngle)

  const largeArcFlag = angle > 180 ? 1 : 0

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startInner.x} ${startInner.y}`,
    'Z'
  ].join(' ')
}

function splitLabel(text) {
  const value = String(text || '').trim()
  if (!value) return ['獎項']

  let chunkSize = 4

  if (value.length <= 4) chunkSize = 4
  else if (value.length <= 8) chunkSize = 3
  else if (value.length <= 12) chunkSize = 3
  else chunkSize = 4

  const result = value.match(new RegExp(`.{1,${chunkSize}}`, 'g')) || [value]
  return result.slice(0, 3)
}

function getFirstDy(lines) {
  if (lines === 1) return '0'
  if (lines === 2) return '-0.55em'
  return '-1.1em'
}

function getLabelTransform(index) {
  const total = wheelItems.value.length || 1
  const angle = 360 / total
  const middle = index * angle + angle / 2
  const point = polarToCartesian(50, 50, 29, middle)

  let rotate = middle
  if (middle > 90 && middle < 270) {
    rotate += 180
  }

  return `translate(${point.x} ${point.y}) rotate(${rotate})`
}
</script>

<template>
  <div class="preview-shell">
    <div class="preview-title">即時預覽</div>

    <div class="phone-preview">
      <div class="preview-head">
        <div class="preview-head-left">
          <span class="preview-head-text">即時預覽</span>
          <span class="status-dot"></span>
          <span class="status-text">預覽中</span>
        </div>
      </div>

      <div
        class="helper-text"
        :style="{
          color: descriptionColor,
          fontSize: `${descriptionFontSize}px`
        }"
      >
        {{ topText }}
      </div>

      <div class="wheel-stage">
        <div class="wheel-wrap">
          <div
            class="outer-ring"
            :style="{
              background: `linear-gradient(145deg, ${outerColor1}, ${outerColor2})`
            }"
          ></div>

          <div class="bulb-ring">
            <span
              v-for="(bulb, index) in bulbs"
              :key="index"
              class="bulb"
              :style="{
                left: bulb.x + '%',
                top: bulb.y + '%'
              }"
            ></span>
          </div>

          <div class="pointer-wrap">
            <div
              class="pointer"
              :style="{ background: pointerColor }"
            ></div>
            <div
              class="pointer-cap"
              :style="{ background: pointerColor, borderColor: outerColor2 }"
            ></div>
          </div>

          <div class="wheel-svg-box">
            <svg
              class="wheel-svg"
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g v-for="(item, index) in wheelItems" :key="index">
                <path
                  :d="getSectorPath(index)"
                  :fill="index % 2 === 0 ? wheelBg1 : wheelBg2"
                  stroke="rgba(255,255,255,0.9)"
                  stroke-width="0.7"
                />

                <g :transform="getLabelTransform(index)">
                  <text
                    text-anchor="middle"
                    dominant-baseline="middle"
                    :fill="prizeTextColor"
                    :font-size="labelFontSize"
                    font-weight="700"
                    style="paint-order: stroke; stroke: rgba(0,0,0,0.18); stroke-width: 0.4;"
                  >
                    <tspan
                      v-for="(line, lineIndex) in splitLabel(item)"
                      :key="lineIndex"
                      x="0"
                      :dy="lineIndex === 0 ? getFirstDy(splitLabel(item).length) : '1.15em'"
                    >
                      {{ line }}
                    </tspan>
                  </text>
                </g>
              </g>

              <circle
                cx="50"
                cy="50"
                r="15.6"
                :fill="centerBg"
                :stroke="outerColor2"
                stroke-width="1.2"
              />
              <circle
                cx="50"
                cy="50"
                r="17.5"
                fill="none"
                :stroke="outerColor2"
                stroke-width="1.5"
                opacity="0.85"
              />
            </svg>
          </div>

          <div
            class="center-button"
            :style="{
              background: centerBg,
              color: centerTextColor,
              borderColor: outerColor2,
              fontSize: `${buttonFontSize}px`
            }"
          >
            {{ centerText }}
          </div>
        </div>
      </div>

      <div class="campaign-name">
        ✦ {{ previewCampaignTitle }} ✦
      </div>

      <div class="bottom-info">
        🎁 目前預覽獎項數：{{ wheelItems.length }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-shell {
  width: 100%;
}

.preview-title {
  font-size: 18px;
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 16px;
}

.phone-preview {
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
  background: linear-gradient(180deg, #0f234f 0%, #04122f 50%, #071126 100%);
  border-radius: 26px;
  padding: 22px 16px 18px;
  box-sizing: border-box;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    0 18px 40px rgba(0, 0, 0, 0.22);
}

.preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.preview-head-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.preview-head-text {
  color: #ffffff;
  font-size: 15px;
  font-weight: 800;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: #7dff5d;
  box-shadow: 0 0 10px rgba(125, 255, 93, 0.8);
}

.status-text {
  color: #7dff5d;
  font-size: 13px;
  font-weight: 700;
}

.helper-text {
  margin-top: 14px;
  text-align: center;
  font-weight: 600;
  min-height: 20px;
  line-height: 1.4;
}

.wheel-stage {
  margin-top: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 6px 0 2px;
  overflow: hidden;
}

.wheel-wrap {
  width: min(100%, 305px);
  aspect-ratio: 1 / 1;
  position: relative;
  margin: 0 auto;
}

.outer-ring {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  box-shadow:
    inset 0 0 0 5px rgba(255, 223, 127, 0.28),
    inset 0 0 25px rgba(255, 210, 100, 0.35),
    0 10px 24px rgba(0, 0, 0, 0.32);
}

.bulb-ring {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  animation: marqueeGlow 1.1s infinite alternate;
}

.bulb {
  position: absolute;
  width: 5.8%;
  aspect-ratio: 1 / 1;
  border-radius: 999px;
  background: radial-gradient(circle, #fff8dc 0%, #ffe38f 48%, #d9b24d 100%);
  box-shadow:
    0 0 10px rgba(255, 225, 130, 0.95),
    0 0 16px rgba(255, 205, 80, 0.65);
  transform: translate(-50%, -50%);
}

.wheel-svg-box {
  position: absolute;
  inset: 14px;
  border-radius: 999px;
  overflow: hidden;
  box-shadow:
    inset 0 0 0 3px rgba(255, 232, 160, 0.55),
    inset 0 0 0 7px rgba(0, 0, 0, 0.36);
}

.wheel-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.pointer-wrap {
  position: absolute;
  top: 3px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 6;
  animation: pointerShake 0.9s infinite ease-in-out;
}

.pointer {
  width: 34px;
  height: 56px;
  clip-path: polygon(50% 100%, 0 0, 100% 0);
  border-radius: 8px;
  box-shadow:
    0 6px 14px rgba(0, 0, 0, 0.28),
    inset 0 0 0 2px rgba(120, 0, 0, 0.24);
}

.pointer-cap {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  margin: -8px auto 0;
  border: 3px solid;
  box-sizing: border-box;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
}

.center-button {
  position: absolute;
  inset: 50% auto auto 50%;
  transform: translate(-50%, -50%);
  width: 92px;
  height: 92px;
  border-radius: 999px;
  border: 4px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  box-sizing: border-box;
  z-index: 5;
  box-shadow:
    0 10px 18px rgba(0, 0, 0, 0.22),
    inset 0 0 0 3px rgba(255, 255, 255, 0.45);
  text-align: center;
  line-height: 1;
}

.campaign-name {
  margin-top: 14px;
  text-align: center;
  font-size: 19px;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: 1px;
  text-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
}

.bottom-info {
  margin-top: 16px;
  padding: 13px 16px;
  border-radius: 18px;
  color: #f7f7f7;
  font-size: 14px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
}

@keyframes pointerShake {
  0% {
    transform: translateX(-50%) rotate(0deg);
  }
  20% {
    transform: translateX(-50%) rotate(-2deg);
  }
  40% {
    transform: translateX(-50%) rotate(1.5deg);
  }
  60% {
    transform: translateX(-50%) rotate(-1deg);
  }
  80% {
    transform: translateX(-50%) rotate(1deg);
  }
  100% {
    transform: translateX(-50%) rotate(0deg);
  }
}

@keyframes marqueeGlow {
  0% {
    filter: brightness(0.92);
  }
  100% {
    filter: brightness(1.08);
  }
}
</style>