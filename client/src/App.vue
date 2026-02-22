<template>
  <div id="app" class="m-0 p-0 bg-bg text-white font-inter flex justify-center items-center h-screen overflow-hidden select-none mobile:overflow-x-hidden">
    <router-view />
    
    <div class="fixed top-4 right-4 z-50 space-y-2 transition-all duration-300 ease-in-out">
      <TransitionGroup name="notification-list" tag="div" class="flex flex-col space-y-2">
        <Notification
          v-for="notification in notifications"
          :key="notification.id"
          :notification="notification"
          @remove="removeNotification(notification.id)"
        />
      </TransitionGroup>
    </div>
    
    <ConfirmModal
      :visible="confirmState.visible"
      :title="confirmState.title"
      :message="confirmState.message"
      :confirm-text="confirmState.confirmText"
      :cancel-text="confirmState.cancelText"
      :secondary-text="confirmState.secondaryText"
      :confirm-icon="confirmState.confirmIcon"
      :cancel-icon="confirmState.cancelIcon"
      :secondary-icon="confirmState.secondaryIcon"
      :type="confirmState.type"
      :close-on-backdrop="confirmState.closeOnBackdrop"
      @confirm="handleConfirm"
      @secondary="handleSecondary"
      @cancel="handleCancel"
    />
  </div>
</template>

<script>
import Notification from './components/Notification.vue'
import ConfirmModal from './components/ConfirmModal.vue'
import { useNotification } from './composables/useNotification.js'
import { useConfirm } from './composables/useConfirm.js'

export default {
  name: 'App',
  components: {
    Notification,
    ConfirmModal
  },
  setup() {
    const { notifications, removeNotification } = useNotification()
    const { confirmState, handleConfirm, handleSecondary, handleCancel } = useConfirm()
    
    return {
      notifications,
      removeNotification,
      confirmState,
      handleConfirm,
      handleSecondary,
      handleCancel
    }
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Red+Hat+Mono:ital,wght@0,300..700;1,300..700&display=swap');
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');
@import url('https://fonts.googleapis.com/icon?family=Material+Icons+Outlined');

@tailwind base;
@tailwind components;
@tailwind utilities;

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

.notification-list-move,
.notification-list-enter-active,
.notification-list-leave-active {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.notification-list-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}

.notification-list-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}

.notification-list-leave-active {
  position: absolute;
  right: 0;
  width: 100%;
}
</style>
