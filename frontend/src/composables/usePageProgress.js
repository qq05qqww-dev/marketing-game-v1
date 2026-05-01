import { ref } from 'vue'

const progressState = ref({
  show: false,
  percent: 0
})

let timer = null
let finishTimer = null

const clearTimers = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }

  if (finishTimer) {
    clearTimeout(finishTimer)
    finishTimer = null
  }
}

const startPageProgress = () => {
  clearTimers()

  progressState.value.show = true
  progressState.value.percent = 12

  timer = setInterval(() => {
    if (progressState.value.percent < 80) {
      progressState.value.percent += Math.floor(Math.random() * 8) + 4
    }

    if (progressState.value.percent > 80) {
      progressState.value.percent = 80
    }
  }, 180)
}

const finishPageProgress = () => {
  if (!progressState.value.show) return

  if (timer) {
    clearInterval(timer)
    timer = null
  }

  progressState.value.percent = 100

  finishTimer = setTimeout(() => {
    progressState.value.show = false
    progressState.value.percent = 0
    finishTimer = null
  }, 350)
}

const failPageProgress = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }

  progressState.value.percent = 100

  finishTimer = setTimeout(() => {
    progressState.value.show = false
    progressState.value.percent = 0
    finishTimer = null
  }, 500)
}

export const usePageProgress = () => {
  return {
    progressState,
    startPageProgress,
    finishPageProgress,
    failPageProgress
  }
}