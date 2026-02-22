<template>
  <div id="app" class="m-0 p-0 bg-bg text-white font-inter flex justify-center items-center h-screen overflow-hidden select-none mobile:overflow-x-hidden">
    <router-view />
    
    <!-- Notification Container -->
    <div class="fixed top-4 right-4 z-50 space-y-2">
      <Notification
        v-for="notification in notifications"
        :key="notification.id"
        :notification="notification"
        @remove="removeNotification(notification.id)"
      />
    </div>
  </div>
</template>

<script>
import Notification from './components/Notification.vue'
import { useNotification } from './composables/useNotification.js'

export default {
  name: 'App',
  components: {
    Notification
  },
  setup() {
    const { notifications, removeNotification } = useNotification()
    
    return {
      notifications,
      removeNotification
    }
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Red+Hat+Mono:ital,wght@0,300..700;1,300..700&display=swap');
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');
@import url('https://fonts.googleapis.com/icon?family=Material+Icons+Outlined');

:root {
  --primary-button: #6792ff;
  --secondary-button: #5ef78c;
  --bg: #181818;
  --text: #ffffff;
  --input: #d9d9d9;
  --ok: #5ef78c;
  --info: #6792ff;
  --danger: #f7e15e;
  --error: #f77b5e;
  --main: #1f1f1f;
}

body {
  background-color: var(--bg);
  color: var(--text);
}
</style>
