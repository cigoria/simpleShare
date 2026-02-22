// Example usage of the useConfirm composable
// This file demonstrates how to use the confirmation modal system

import { useConfirm } from './useConfirm.js'

export function exampleUsage() {
  const { 
    confirm, 
    confirmDelete, 
    confirmWarning, 
    confirmSuccess, 
    showConfirm 
  } = useConfirm()

  // Basic confirmation
  const handleBasicConfirm = async () => {
    try {
      await confirm('Are you sure you want to proceed?')
      console.log('User confirmed')
      // Proceed with action
    } catch {
      console.log('User cancelled')
      // Handle cancellation
    }
  }

  // Delete confirmation with custom options
  const handleDelete = async (itemName) => {
    try {
      await confirmDelete(itemName)
      console.log(`User confirmed deletion of ${itemName}`)
      // Delete the item
    } catch {
      console.log('User cancelled deletion')
    }
  }

  // Warning confirmation
  const handleWarning = async () => {
    try {
      await confirmWarning('This action cannot be undone. Continue?')
      console.log('User acknowledged warning')
      // Proceed with dangerous action
    } catch {
      console.log('User cancelled after warning')
    }
  }

  // Success notification (acts as confirmation)
  const handleSuccess = async () => {
    try {
      await confirmSuccess('Operation completed successfully!')
      console.log('User acknowledged success')
    } catch {
      console.log('User closed success dialog')
    }
  }

  // Fully custom confirmation
  const handleCustomConfirm = async () => {
    try {
      await showConfirm({
        title: 'Custom Action',
        message: 'Do you want to perform this custom action?',
        confirmText: 'Yes, do it',
        cancelText: 'No, thanks',
        confirmIcon: 'rocket_launch',
        cancelIcon: 'thumb_down',
        type: 'info',
        closeOnBackdrop: false
      })
      console.log('User confirmed custom action')
    } catch {
      console.log('User cancelled custom action')
    }
  }

  // Error message (confirmation with only OK button)
  const handleError = async (errorMessage) => {
    try {
      await confirm(errorMessage, {
        title: 'Error',
        type: 'error',
        confirmText: 'OK',
        cancelText: '', // Empty string hides the cancel button
        closeOnBackdrop: false
      })
      console.log('User acknowledged error')
    } catch {
      console.log('User closed error dialog')
    }
  }

  return {
    handleBasicConfirm,
    handleDelete,
    handleWarning,
    handleSuccess,
    handleCustomConfirm,
    handleError
  }
}

// In a Vue component, you would use it like this:
/*
<script>
import { useConfirm } from '../composables/useConfirm.js'

export default {
  setup() {
    const { confirmDelete, confirmWarning } = useConfirm()
    
    const deleteItem = async (item) => {
      try {
        await confirmDelete(item.name)
        // Delete the item
        await api.deleteItem(item.id)
      } catch {
        // User cancelled
      }
    }
    
    const saveChanges = async () => {
      if (!form.value.name) {
        try {
          await confirmWarning('Please enter a name before saving')
        } catch {
          // User cancelled
        }
        return
      }
      // Save changes
    }
    
    return {
      deleteItem,
      saveChanges
    }
  }
}
</script>
*/
