// Global notification system composable
import { ref, reactive } from 'vue'

const notifications = ref([])
let notificationId = 0

export function useNotification() {
  const showNotification = (text, color = 'info') => {
    const id = ++notificationId
    const notification = reactive({
      id,
      text,
      color
    })
    
    notifications.value.push(notification)
    
    return id
  }
  
  const removeNotification = (id) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }
  
  const clearAllNotifications = () => {
    notifications.value = []
  }
  
  return {
    notifications,
    showNotification,
    removeNotification,
    clearAllNotifications
  }
}
