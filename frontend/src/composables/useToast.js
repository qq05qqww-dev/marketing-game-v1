import { ref } from 'vue'

export const useToast = () => {
  const toast = ref({
    show: false,
    type: 'success',
    title: '',
    message: '',
    position: 'top-right'
  })

  let timer = null

  const closeToast = () => {
    toast.value.show = false
  }

  const showToast = ({
    type = 'success',
    title = '提示',
    message = '',
    position = 'top-right',
    duration = 2200
  } = {}) => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }

    toast.value = {
      show: true,
      type,
      title,
      message,
      position
    }

    if (duration > 0) {
      timer = setTimeout(() => {
        closeToast()
      }, duration)
    }
  }

  const showSuccess = (title = '操作成功', message = '') => {
    showToast({
      type: 'success',
      title,
      message
    })
  }

  const showError = (title = '操作失敗', message = '') => {
    showToast({
      type: 'error',
      title,
      message,
      duration: 3200
    })
  }

  const showWarning = (title = '提醒', message = '') => {
    showToast({
      type: 'warning',
      title,
      message,
      duration: 2800
    })
  }

  const showInfo = (title = '提示', message = '') => {
    showToast({
      type: 'info',
      title,
      message
    })
  }

  return {
    toast,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeToast
  }
}