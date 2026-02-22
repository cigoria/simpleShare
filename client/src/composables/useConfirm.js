import { ref } from 'vue'

const confirmState = ref({
  visible: false,
  title: '',
  message: '',
  confirmText: '',
  cancelText: '',
  confirmIcon: '',
  cancelIcon: '',
  type: 'info',
  closeOnBackdrop: true,
  resolve: null,
  reject: null
})

export function useConfirm() {
  const showConfirm = (options = {}) => {
    return new Promise((resolve, reject) => {
      confirmState.value = {
        visible: true,
        title: options.title || 'Confirmation',
        message: options.message || 'Are you sure?',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        confirmIcon: options.confirmIcon || 'check',
        cancelIcon: options.cancelIcon || 'close',
        type: options.type || 'info',
        closeOnBackdrop: options.closeOnBackdrop !== false,
        resolve,
        reject
      }
    })
  }

  const confirm = (message, options = {}) => {
    return showConfirm({
      message,
      ...options
    })
  }

  const confirmDelete = (itemName, options = {}) => {
    return showConfirm({
      title: 'Delete Confirmation',
      message: `Are you sure you want to delete ${itemName}?`,
      confirmText: 'Delete',
      confirmIcon: 'delete',
      type: 'error',
      ...options
    })
  }

  const confirmWarning = (message, options = {}) => {
    return showConfirm({
      title: 'Warning',
      message,
      type: 'warning',
      ...options
    })
  }

  const confirmSuccess = (message, options = {}) => {
    return showConfirm({
      title: 'Success',
      message,
      type: 'success',
      ...options
    })
  }

  const handleConfirm = () => {
    if (confirmState.value.resolve) {
      confirmState.value.resolve(true)
    }
    hideConfirm()
  }

  const handleCancel = () => {
    if (confirmState.value.reject) {
      confirmState.value.reject(false)
    }
    hideConfirm()
  }

  const hideConfirm = () => {
    confirmState.value.visible = false
    confirmState.value.resolve = null
    confirmState.value.reject = null
  }

  return {
    confirmState,
    showConfirm,
    confirm,
    confirmDelete,
    confirmWarning,
    confirmSuccess,
    handleConfirm,
    handleCancel,
    hideConfirm
  }
}
