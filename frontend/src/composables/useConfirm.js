import { ref } from 'vue'

export const useConfirm = () => {
  const confirmState = ref({
    show: false,
    title: '確認操作',
    message: '你確定要執行這個操作嗎？',
    confirmText: '確認',
    cancelText: '取消',
    type: 'warning',
    loading: false,
    onConfirm: null
  })

  const openConfirm = ({
    title = '確認操作',
    message = '你確定要執行這個操作嗎？',
    confirmText = '確認',
    cancelText = '取消',
    type = 'warning',
    onConfirm = null
  } = {}) => {
    confirmState.value = {
      show: true,
      title,
      message,
      confirmText,
      cancelText,
      type,
      loading: false,
      onConfirm
    }
  }

  const closeConfirm = () => {
    if (confirmState.value.loading) return

    confirmState.value.show = false
  }

  const setConfirmLoading = (loading) => {
    confirmState.value.loading = !!loading
  }

  const handleConfirm = async () => {
    if (confirmState.value.loading) return

    const action = confirmState.value.onConfirm

    if (typeof action !== 'function') {
      confirmState.value.show = false
      return
    }

    try {
      confirmState.value.loading = true
      await action()
      confirmState.value.show = false
    } finally {
      confirmState.value.loading = false
    }
  }

  const confirmDanger = ({
    title = '確認刪除',
    message = '此操作無法復原，確定要繼續嗎？',
    confirmText = '確認刪除',
    cancelText = '取消',
    onConfirm = null
  } = {}) => {
    openConfirm({
      title,
      message,
      confirmText,
      cancelText,
      type: 'danger',
      onConfirm
    })
  }

  const confirmWarning = ({
    title = '確認操作',
    message = '你確定要執行這個操作嗎？',
    confirmText = '確認',
    cancelText = '取消',
    onConfirm = null
  } = {}) => {
    openConfirm({
      title,
      message,
      confirmText,
      cancelText,
      type: 'warning',
      onConfirm
    })
  }

  const confirmInfo = ({
    title = '確認資訊',
    message = '請確認是否繼續。',
    confirmText = '確認',
    cancelText = '取消',
    onConfirm = null
  } = {}) => {
    openConfirm({
      title,
      message,
      confirmText,
      cancelText,
      type: 'info',
      onConfirm
    })
  }

  const confirmSuccess = ({
    title = '確認完成',
    message = '請確認是否繼續。',
    confirmText = '確認',
    cancelText = '取消',
    onConfirm = null
  } = {}) => {
    openConfirm({
      title,
      message,
      confirmText,
      cancelText,
      type: 'success',
      onConfirm
    })
  }

  return {
    confirmState,
    openConfirm,
    closeConfirm,
    handleConfirm,
    setConfirmLoading,
    confirmDanger,
    confirmWarning,
    confirmInfo,
    confirmSuccess
  }
}