<script setup>
// Multi Game Platform V2.3
// 第 92 批：RedPacketPlayBoard.vue 紅包雨玩法元件骨架版
//
// 放置位置：
// frontend/src/views/games/playboards/RedPacketPlayBoard.vue
//
// 目的：
// 1. 先建立紅包雨玩法區的共用化骨架。
// 2. 未來新增 RED_PACKET 紅包雨遊戲時，可直接使用這個玩法元件。
// 3. 這一批只建立骨架，不接入任何頁面。
// 4. 不會影響目前正常的九宮格、金蛋功能。

import { computed, ref } from 'vue'

const props = defineProps({
  packets: {
    type: Array,
    default: () => []
  },
  resultPrize: {
    type: Object,
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  },
  isDrawing: {
    type: Boolean,
    default: false
  },
  durationSeconds: {
    type: Number,
    default: 15
  },
  packetCount: {
    type: Number,
    default: 12
  },
  maxClicks: {
    type: Number,
    default: 5
  },
  drawButtonText: {
    type: String,
    default: '開始紅包雨'
  },
  emptyText: {
    type: String,
    default: '點擊開始後，紅包會從畫面中掉落。'
  }
})

const emit = defineEmits([
  'draw',
  'select-packet',
  'rain-start',
  'rain-end',
  'reset'
])

const isRaining = ref(false)
const clickedPacketIds = ref([])
const localSecondsLeft = ref(props.durationSeconds)

const fallbackPackets = computed(() => {
  return Array.from({ length: props.packetCount }, (_, index) => ({
    id: `red_packet_${index}`,
    title: `紅包 ${index + 1}`,
    shortName: '紅包',
    icon: '🧧',
    left: 8 + ((index * 17) % 78),
    delay: (index % 6) * 0.24,
    duration: 2.8 + (index % 5) * 0.32
  }))
})

const normalizedPackets = computed(() => {
  const source = props.packets.length ? props.packets : fallbackPackets.value

  return source.map((item, index) => ({
    ...item,
    id: item.id || `red_packet_${index}`,
    title: item.title || item.name || item.shortName || `紅包 ${index + 1}`,
    shortName: item.shortName || item.displayName || item.title || item.name || '紅包',
    icon: item.icon || item.emoji || '🧧',
    imageUrl: item.imageUrl || item.image || '',
    left: Number(item.left ?? (8 + ((index * 17) % 78))),
    delay: Number(item.delay ?? ((index % 6) * 0.24)),
    duration: Number(item.duration ?? (2.8 + (index % 5) * 0.32))
  }))
})

const canStart = computed(() => {
  return !props.disabled && !props.isDrawing && !isRaining.value
})

const clickCount = computed(() => {
  return clickedPacketIds.value.length
})

const canClickPacket = computed(() => {
  return isRaining.value && clickCount.value < props.maxClicks
})

const resultTitle = computed(() => {
  return props.resultPrize?.title
    || props.resultPrize?.name
    || props.resultPrize?.shortName
    || '活動獎項'
})

const resultIcon = computed(() => {
  return props.resultPrize?.icon || props.resultPrize?.emoji || '🎁'
})

const resultImageUrl = computed(() => {
  return props.resultPrize?.imageUrl || props.resultPrize?.image || ''
})

const resultTypeInfo = computed(() => {
  const title = String(resultTitle.value || '')
  const type = String(props.resultPrize?.type || '').toUpperCase()

  if (type === 'LOSE' || title.includes('銘謝惠顧') || title.includes('未中獎') || title.includes('謝謝參加')) {
    return {
      label: '未中獎',
      class: 'border-slate-200 bg-slate-50 text-slate-600'
    }
  }

  if (type === 'REPLAY' || title.includes('再玩一次') || title.includes('再抽一次')) {
    return {
      label: '加碼',
      class: 'border-sky-200 bg-sky-50 text-sky-700'
    }
  }

  return {
    label: '中獎',
    class: 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }
})

const isPacketClicked = (packetId) => {
  return clickedPacketIds.value.includes(packetId)
}

const startRain = () => {
  if (!canStart.value) return

  isRaining.value = true
  clickedPacketIds.value = []
  localSecondsLeft.value = props.durationSeconds

  emit('rain-start')
  emit('draw')

  const timer = window.setInterval(() => {
    localSecondsLeft.value -= 1

    if (localSecondsLeft.value <= 0) {
      window.clearInterval(timer)
      endRain()
    }
  }, 1000)
}

const selectPacket = (packet) => {
  if (!canClickPacket.value) return
  if (isPacketClicked(packet.id)) return

  clickedPacketIds.value = [...clickedPacketIds.value, packet.id]

  emit('select-packet', {
    packet,
    clickCount: clickedPacketIds.value.length
  })

  if (clickedPacketIds.value.length >= props.maxClicks) {
    endRain()
  }
}

const endRain = () => {
  if (!isRaining.value) return

  isRaining.value = false

  emit('rain-end', {
    clickCount: clickedPacketIds.value.length,
    prize: props.resultPrize
  })
}

const resetRain = () => {
  isRaining.value = false
  clickedPacketIds.value = []
  localSecondsLeft.value = props.durationSeconds
  emit('reset')
}
</script>

<template>
  <section class="relative mx-auto w-full max-w-[420px]">
    <div class="relative overflow-hidden rounded-[34px] border-[6px] border-red-300 bg-gradient-to-br from-red-700 via-red-600 to-orange-500 p-4 shadow-[0_28px_60px_rgba(127,29,29,.45)]">
      <div class="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-yellow-200/25 blur-2xl"></div>
      <div class="absolute -bottom-14 -left-12 h-40 w-40 rounded-full bg-white/15 blur-3xl"></div>

      <div class="relative mb-4 flex items-center justify-between gap-3 text-white">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.22em] text-white/65">
            Red Packet
          </p>

          <h3 class="mt-1 text-xl font-black">
            紅包雨抽獎
          </h3>

          <p class="mt-1 text-xs font-bold text-white/70">
            點擊掉落紅包，搶越多越熱鬧。
          </p>
        </div>

        <button
          type="button"
          class="rounded-full bg-white px-4 py-2 text-xs font-black text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="!canStart"
          @click="startRain"
        >
          {{ isRaining ? '進行中' : drawButtonText }}
        </button>
      </div>

      <div class="relative h-[360px] overflow-hidden rounded-[30px] border border-white/20 bg-gradient-to-b from-red-500/40 to-red-950/30 shadow-inner">
        <div class="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 bg-red-950/25 px-4 py-3 text-white backdrop-blur">
          <div>
            <p class="text-[10px] font-black tracking-[0.18em] text-white/55">
              TIME
            </p>

            <p class="text-lg font-black leading-none">
              {{ localSecondsLeft }}s
            </p>
          </div>

          <div class="text-right">
            <p class="text-[10px] font-black tracking-[0.18em] text-white/55">
              CLICKS
            </p>

            <p class="text-lg font-black leading-none">
              {{ clickCount }} / {{ maxClicks }}
            </p>
          </div>
        </div>

        <template v-if="isRaining">
          <button
            v-for="packet in normalizedPackets"
            :key="packet.id"
            type="button"
            class="red-packet-item absolute top-[-72px] z-0 flex h-16 w-12 items-center justify-center rounded-xl border border-yellow-200/70 bg-gradient-to-br from-red-500 to-red-700 text-3xl shadow-xl transition hover:scale-110 disabled:opacity-35"
            :class="isPacketClicked(packet.id) ? 'red-packet-clicked' : ''"
            :style="{
              left: `${packet.left}%`,
              animationDelay: `${packet.delay}s`,
              animationDuration: `${packet.duration}s`
            }"
            :disabled="!canClickPacket || isPacketClicked(packet.id)"
            @click="selectPacket(packet)"
          >
            <img
              v-if="packet.imageUrl"
              :src="packet.imageUrl"
              :alt="packet.title"
              class="h-full w-full rounded-xl object-cover"
            />

            <span v-else>
              {{ packet.icon }}
            </span>
          </button>
        </template>

        <div
          v-else
          class="flex h-full flex-col items-center justify-center px-6 text-center text-white"
        >
          <div class="flex h-20 w-20 items-center justify-center rounded-[28px] bg-white/15 text-5xl shadow-inner">
            🧧
          </div>

          <p class="mt-4 text-sm font-black">
            {{ resultPrize ? `本次結果：${resultTitle}` : emptyText }}
          </p>

          <span
            v-if="resultPrize"
            class="mt-3 rounded-full border px-3 py-1 text-[11px] font-black"
            :class="resultTypeInfo.class"
          >
            {{ resultTypeInfo.label }}
          </span>

          <div
            v-if="resultPrize"
            class="mt-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl bg-white text-4xl shadow-inner"
          >
            <img
              v-if="resultImageUrl"
              :src="resultImageUrl"
              :alt="resultTitle"
              class="h-full w-full object-cover"
            />

            <span v-else>
              {{ resultIcon }}
            </span>
          </div>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          class="rounded-2xl bg-white px-4 py-3 text-sm font-black text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="!canStart"
          @click="startRain"
        >
          {{ isRaining ? '紅包雨中' : '開始' }}
        </button>

        <button
          type="button"
          class="rounded-2xl border border-white/30 bg-white/15 px-4 py-3 text-sm font-black text-white transition hover:bg-white/25"
          @click="resetRain"
        >
          重置
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.red-packet-item {
  animation-name: red-packet-fall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

.red-packet-clicked {
  animation-play-state: paused;
  transform: scale(0.88) rotate(-8deg);
  filter: grayscale(0.4);
}

@keyframes red-packet-fall {
  0% {
    transform: translateY(-72px) rotate(-8deg);
    opacity: 0;
  }

  10% {
    opacity: 1;
  }

  100% {
    transform: translateY(460px) rotate(12deg);
    opacity: 0.9;
  }
}
</style>
