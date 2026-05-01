<script setup>
import { computed } from 'vue'

const props = defineProps({
  config: {
    type: Object,
    default: () => ({})
  },
  campaignTitle: {
    type: String,
    default: '週年慶大轉盤'
  },
  prizes: {
    type: Array,
    default: () => []
  }
})

const wheelSize = 560
const centerX = 280
const centerY = 280

const outerShadowRadius = 252
const outerLightRadius = 238
const lightRingRadius = 224
const sectorRadius = 204
const centerRadius = 62
const labelRadius = 138

const mergedConfig = computed(() => ({
  wheelBg1: props.config?.wheelBg1 || '#5ba8db',
  wheelBg2: props.config?.wheelBg2 || '#efc84a',
  outerBorder1: props.config?.outerBorder1 || '#111111',
  outerBorder2: props.config?.outerBorder2 || '#d6a93c',
  pointerColor: props.config?.pointerColor || '#e11d48',
  centerBg: props.config?.centerBg || '#f8f1db',
  centerTextColor: props.config?.centerTextColor || '#111827',
  prizeTextColor: props.config?.prizeTextColor || '#ffffff',
  descriptionText: props.config?.descriptionText || '立即登入抽驚喜好禮',
  descriptionColor: props.config?.descriptionColor || '#64748b',
  descriptionFontSize: props.config?.descriptionFontSize || 16,
  buttonText: props.config?.buttonText || '開始',
  buttonFontSize: props.config?.buttonFontSize || 34,
  showTopDescription:
    props.config?.showTopDescription === undefined
      ? true
      : props.config.showTopDescription
}))

const displayPrizes = computed(() => {
  if (Array.isArray(props.prizes) && props.prizes.length > 0) {
    return props.prizes.map((item, index) => ({
      id: item.id ?? index,
      title: item.title || '未命名獎項'
    }))
  }

  return [
    { id: 1, title: '謝謝參與' },
    { id: 2, title: '基礎獎' },
    { id: 3, title: '6666666666' },
    { id: 4, title: '感謝惠顧' },
    { id: 5, title: '5折優惠券' },
    { id: 6, title: '50元折價券' },
    { id: 7, title: '100元折價券' }
  ]
})

const segmentCount = computed(() => Math.max(displayPrizes.value.length, 1))
const segmentAngle = computed(() => 360 / segmentCount.value)

function polarToCartesian(cx, cy, radius, angleDeg) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad)
  }
}

function describeSector(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, startAngle)
  const end = polarToCartesian(cx, cy, radius, endAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
    'Z'
  ].join(' ')
}

function splitLabel(text, limit = 4) {
  if (!text) return ['未命名']
  const result = []

  if (String(text).length <= limit) return [String(text)]

  for (let i = 0; i < String(text).length; i += limit) {
    result.push(String(text).slice(i, i + limit))
  }

  return result.slice(0, 3)
}

const sectors = computed(() => {
  const list = displayPrizes.value
  const angle = segmentAngle.value

  if (list.length === 1) {
    return [
      {
        id: list[0].id,
        title: list[0].title,
        fill: mergedConfig.value.wheelBg1,
        path: null,
        labelX: centerX,
        labelY: centerY - 130,
        labelRotation: 0,
        lines: splitLabel(list[0].title)
      }
    ]
  }

  return list.map((item, index) => {
    const startAngle = index * angle
    const endAngle = startAngle + angle
    const midAngle = startAngle + angle / 2
    const labelPoint = polarToCartesian(centerX, centerY, labelRadius, midAngle)

    let rotation = midAngle
    if (rotation >= 90 && rotation <= 270) {
      rotation -= 180
    }

    return {
      id: item.id,
      title: item.title,
      fill: index % 2 === 0 ? mergedConfig.value.wheelBg1 : mergedConfig.value.wheelBg2,
      path: describeSector(centerX, centerY, sectorRadius, startAngle, endAngle),
      labelX: labelPoint.x,
      labelY: labelPoint.y,
      labelRotation: rotation,
      lines: splitLabel(item.title)
    }
  })
})

const separatorLines = computed(() => {
  if (displayPrizes.value.length <= 1) return []

  return displayPrizes.value.map((_, index) => {
    const angle = index * segmentAngle.value
    const point = polarToCartesian(centerX, centerY, sectorRadius, angle)
    return {
      x1: centerX,
      y1: centerY,
      x2: point.x,
      y2: point.y
    }
  })
})

const lightDots = computed(() => {
  const count = 30
  return Array.from({ length: count }).map((_, index) => {
    const angle = (360 / count) * index
    const point = polarToCartesian(centerX, centerY, lightRingRadius, angle)
    return {
      id: index,
      x: point.x,
      y: point.y,
      r: 10,
      opacity: index % 3 === 0 ? 1 : index % 2 === 0 ? 0.82 : 0.65
    }
  })
})
</script>

<template>
  <div class="mx-auto w-full max-w-[640px]">
    <div class="rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top,#112244_0%,#091224_48%,#0b1320_100%)] p-8 shadow-[0_24px_60px_rgba(15,23,42,0.38)]">
      <div class="mb-4 flex items-center gap-4">
        <div class="text-[18px] font-black text-white">即時預覽</div>
        <div class="flex items-center gap-2 text-[#79ff67]">
          <span class="inline-block h-3 w-3 rounded-full bg-[#79ff67] shadow-[0_0_10px_#79ff67]"></span>
          <span class="text-[14px] font-bold">預覽中</span>
        </div>
      </div>

      <div class="flex flex-col items-center justify-center">
        <svg
          :width="wheelSize"
          :height="wheelSize + 80"
          :viewBox="`0 0 ${wheelSize} ${wheelSize + 80}`"
          class="block"
        >
          <defs>
            <filter id="outerGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="#ffd54d" flood-opacity="0.55" />
              <feDropShadow dx="0" dy="0" stdDeviation="22" flood-color="#ffb300" flood-opacity="0.25" />
            </filter>

            <filter id="wheelShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="rgba(0,0,0,0.45)" />
            </filter>

            <linearGradient id="goldRing" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#fff0a5" />
              <stop offset="22%" stop-color="#efc84a" />
              <stop offset="48%" stop-color="#9a6313" />
              <stop offset="76%" stop-color="#ffd86a" />
              <stop offset="100%" stop-color="#a96c12" />
            </linearGradient>

            <linearGradient id="centerGold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#ffecb2" />
              <stop offset="55%" stop-color="#d89d2f" />
              <stop offset="100%" stop-color="#9a5d13" />
            </linearGradient>

            <radialGradient id="centerBg" cx="50%" cy="40%" r="70%">
              <stop offset="0%" :stop-color="mergedConfig.centerBg" />
              <stop offset="100%" stop-color="#ede2bf" />
            </radialGradient>

            <filter id="centerShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="rgba(0,0,0,0.28)" />
            </filter>
          </defs>

          <!-- pointer wobble lines -->
          <path d="M212 65 Q198 58 188 63" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.9" />
          <path d="M220 52 Q206 45 195 50" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.65" />
          <path d="M348 65 Q362 58 372 63" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.9" />
          <path d="M340 52 Q354 45 365 50" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.65" />

          <!-- outer dark ring -->
          <circle
            :cx="centerX"
            :cy="centerY"
            :r="outerShadowRadius"
            :fill="mergedConfig.outerBorder1"
            filter="url(#wheelShadow)"
          />

          <!-- marquee gold ring -->
          <circle
            :cx="centerX"
            :cy="centerY"
            :r="outerLightRadius"
            fill="url(#goldRing)"
            filter="url(#outerGlow)"
          />

          <!-- inner dark ring for light base -->
          <circle
            :cx="centerX"
            :cy="centerY"
            :r="226"
            fill="#2c210d"
          />

          <!-- marquee bulbs -->
          <circle
            v-for="dot in lightDots"
            :key="dot.id"
            :cx="dot.x"
            :cy="dot.y"
            :r="dot.r"
            fill="#fff2b4"
            :opacity="dot.opacity"
            filter="url(#outerGlow)"
          />

          <!-- outer bright ring -->
          <circle
            :cx="centerX"
            :cy="centerY"
            :r="212"
            fill="url(#goldRing)"
          />

          <!-- real svg sectors -->
          <template v-if="displayPrizes.length > 1">
            <path
              v-for="sector in sectors"
              :key="sector.id"
              :d="sector.path"
              :fill="sector.fill"
              stroke="#ffffff"
              stroke-width="2.2"
            />
          </template>

          <template v-else>
            <circle
              :cx="centerX"
              :cy="centerY"
              :r="sectorRadius"
              :fill="mergedConfig.wheelBg1"
              stroke="#ffffff"
              stroke-width="2.2"
            />
          </template>

          <!-- separators -->
          <line
            v-for="(line, index) in separatorLines"
            :key="index"
            :x1="line.x1"
            :y1="line.y1"
            :x2="line.x2"
            :y2="line.y2"
            stroke="rgba(255,255,255,0.65)"
            stroke-width="1.2"
          />

          <!-- sector border ring -->
          <circle
            :cx="centerX"
            :cy="centerY"
            :r="sectorRadius"
            fill="transparent"
            stroke="rgba(0,0,0,0.22)"
            stroke-width="4"
          />

          <!-- labels -->
          <g
            v-for="sector in sectors"
            :key="`label-${sector.id}`"
            :transform="`rotate(${sector.labelRotation} ${sector.labelX} ${sector.labelY})`"
          >
            <text
              :x="sector.labelX"
              :y="sector.labelY"
              text-anchor="middle"
              dominant-baseline="middle"
              :fill="mergedConfig.prizeTextColor"
              font-size="17"
              font-weight="800"
              style="paint-order: stroke; stroke: rgba(0,0,0,0.15); stroke-width: 2px;"
            >
              <tspan
                v-for="(line, lineIndex) in sector.lines"
                :key="lineIndex"
                :x="sector.labelX"
                :dy="lineIndex === 0 ? `${-(sector.lines.length - 1) * 11}px` : '22px'"
              >
                {{ line }}
              </tspan>
            </text>
          </g>

          <!-- center outer -->
          <circle
            :cx="centerX"
            :cy="centerY"
            :r="centerRadius + 12"
            fill="url(#centerGold)"
            filter="url(#centerShadow)"
          />

          <circle
            :cx="centerX"
            :cy="centerY"
            :r="centerRadius + 6"
            fill="#f9e7a1"
          />

          <!-- center button -->
          <circle
            :cx="centerX"
            :cy="centerY"
            :r="centerRadius"
            fill="url(#centerBg)"
            stroke="#b45309"
            stroke-width="4"
          />

          <text
            :x="centerX"
            :y="centerY + 4"
            text-anchor="middle"
            dominant-baseline="middle"
            :fill="mergedConfig.centerTextColor"
            font-weight="900"
            :font-size="mergedConfig.buttonFontSize"
          >
            {{ mergedConfig.buttonText }}
          </text>

          <!-- pointer -->
          <g>
            <circle
              :cx="centerX"
              cy="48"
              r="11"
              fill="url(#centerGold)"
              stroke="#8b1d1d"
              stroke-width="2"
            />
            <path
              :d="`M ${centerX} 138 L ${centerX - 28} 70 Q ${centerX} 58 ${centerX + 28} 70 Z`"
              :fill="mergedConfig.pointerColor"
              stroke="#961b2f"
              stroke-width="3"
            />
          </g>

          <!-- title -->
          <text
            :x="centerX"
            y="540"
            text-anchor="middle"
            fill="#ffffff"
            font-size="26"
            font-weight="900"
          >
            ✦ {{ campaignTitle }} ✦
          </text>
        </svg>

        <div class="mt-3 w-full rounded-[20px] bg-[linear-gradient(90deg,rgba(23,37,84,0.55),rgba(15,23,42,0.72))] px-6 py-4 text-white shadow-inner">
          <div class="flex items-center gap-3 text-[18px] font-semibold">
            <span class="text-[24px]">🎁</span>
            <span>目前預覽獎項數：{{ displayPrizes.length }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>