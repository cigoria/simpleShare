import { ref } from 'vue'

const confirmState = ref({
  visible: false,
  title: '',
  message: '',
  confirmText: '',
  cancelText: '',
  secondaryText: '',
  confirmIcon: '',
  cancelIcon: '',
  secondaryIcon: '',
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

  const confirmDeleteGroup = (groupName, options = {}) => {
    return new Promise((resolve, reject) => {
      confirmState.value = {
        visible: true,
        title: 'Delete Group',
        message: `What would you like to do with the group "${groupName}"?`,
        confirmText: 'Delete group only',
        cancelText: 'Cancel',
        secondaryText: 'Delete group and files',
        confirmIcon: 'folder',
        cancelIcon: 'close',
        secondaryIcon: 'delete_forever',
        type: 'error',
        closeOnBackdrop: true,
        resolve,
        reject
      }
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
      confirmState.value.resolve('confirm')
    }
    hideConfirm()
  }

  const handleSecondary = () => {
    if (confirmState.value.resolve) {
      confirmState.value.resolve('secondary')
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
    confirmDeleteGroup,
    confirmWarning,
    confirmSuccess,
    handleConfirm,
    handleSecondary,
    handleCancel,
    hideConfirm
  }
}
