import { computed, ref } from 'vue'

export function useGridLotteryDraw(options = {}) {
  const prizes = ref(options.prizes || [])
  const isDrawing = ref(false)
  const activeIndex = ref(-1)
  const resultPrize = ref(null)
  const lastDrawAt = ref(null)

  const speed = computed(() => {
    return Number(options.speed || 90)
  })

  const minRounds = computed(() => {
    return Number(options.minRounds || 4)
  })

  const playableIndexes = computed(() => {
    return prizes.value
      .map((item, index) => {
        return {
          item,
          index
        }
      })
      .filter((entry) => !entry.item.isStart && !entry.item.disabled)
  })

  const canDraw = computed(() => {
    return !isDrawing.value && playableIndexes.value.length > 0
  })

  const setPrizes = (nextPrizes = []) => {
    if (isDrawing.value) return

    prizes.value = nextPrizes
    activeIndex.value = -1
    resultPrize.value = null
  }

  const getRandomPrizeEntry = () => {
    const availableItems = playableIndexes.value

    if (availableItems.length === 0) {
      return null
    }

    const totalWeight = availableItems.reduce((sum, entry) => {
      const weight = Number(entry.item.weight ?? 1)

      return sum + (weight > 0 ? weight : 0)
    }, 0)

    if (totalWeight <= 0) {
      const randomIndex = Math.floor(Math.random() * availableItems.length)

      return availableItems[randomIndex]
    }

    let random = Math.random() * totalWeight

    for (const entry of availableItems) {
      const weight = Number(entry.item.weight ?? 1)

      if (weight <= 0) continue

      random -= weight

      if (random <= 0) {
        return entry
      }
    }

    return availableItems[availableItems.length - 1]
  }

  const draw = () => {
    return new Promise((resolve, reject) => {
      if (isDrawing.value) {
        reject(new Error('抽獎進行中'))
        return
      }

      const finalEntry = getRandomPrizeEntry()

      if (!finalEntry) {
        reject(new Error('沒有可抽獎項'))
        return
      }

      isDrawing.value = true
      resultPrize.value = null

      let count = 0
      const finalPlayableIndex = playableIndexes.value.findIndex((entry) => {
        return entry.index === finalEntry.index
      })

      const totalCount =
        playableIndexes.value.length * minRounds.value +
        finalPlayableIndex

      const timer = setInterval(() => {
        const current = playableIndexes.value[count % playableIndexes.value.length]

        activeIndex.value = current.index
        count += 1

        if (count > totalCount) {
          clearInterval(timer)

          activeIndex.value = finalEntry.index
          resultPrize.value = finalEntry.item
          lastDrawAt.value = new Date()
          isDrawing.value = false

          resolve(finalEntry.item)
        }
      }, speed.value)
    })
  }

  const resetDraw = () => {
    if (isDrawing.value) return

    activeIndex.value = -1
    resultPrize.value = null
  }

  return {
    prizes,
    isDrawing,
    activeIndex,
    resultPrize,
    lastDrawAt,
    playableIndexes,
    canDraw,
    setPrizes,
    draw,
    resetDraw
  }
}