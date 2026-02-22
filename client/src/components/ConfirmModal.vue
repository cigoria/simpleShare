<template>
  <div 
    v-if="visible"
    class="flex justify-center items-center w-full h-full fixed top-0 left-0 bg-black/50 backdrop-blur-sm z-50"
    @click="handleBackdropClick">
    <div
      class="bg-black/90 backdrop-blur-[20px] max-w-md w-full mx-4 rounded-[20px] border border-[#444] transition-all duration-300 animate-scale-in"
      @click.stop>
      <div class="p-6">
        <div class="flex items-center mb-4">
          <span 
            v-if="icon" 
            class="material-icons text-2xl mr-3"
            :class="iconClass">
            {{ icon }}
          </span>
          <h3 class="text-xl font-semibold flex-1">
            {{ title }}
          </h3>
        </div>
        
        <p class="text-gray-300 mb-6 leading-relaxed">
          {{ message }}
        </p>
        
        <div class="flex gap-3 flex-col">
          <button 
            @click="handleConfirm"
            class="w-full bg-primary-button text-black px-4 py-2.5 rounded-lg font-medium hover:scale-105 transition-transform flex items-center justify-center">
            <span class="material-icons align-middle mr-2 text-sm">{{ confirmIcon }}</span>
            {{ confirmText }}
          </button>
          
          <button 
            v-if="secondaryText"
            @click="handleSecondary"
            class="w-full bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium hover:scale-105 transition-transform flex items-center justify-center">
            <span class="material-icons align-middle mr-2 text-sm">{{ secondaryIcon }}</span>
            {{ secondaryText }}
          </button>
          
          <button 
            v-if="cancelText"
            @click="handleCancel"
            class="w-full bg-gray-700 text-white px-4 py-2.5 rounded-lg font-medium hover:scale-105 transition-transform flex items-center justify-center">
            <span class="material-icons align-middle mr-2 text-sm">{{ cancelIcon }}</span>
            {{ cancelText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ConfirmModal',
  props: {
    visible: Boolean,
    title: {
      type: String,
      default: 'Confirmation'
    },
    message: {
      type: String,
      required: true
    },
    confirmText: {
      type: String,
      default: 'Confirm'
    },
    cancelText: {
      type: String,
      default: 'Cancel'
    },
    confirmIcon: {
      type: String,
      default: 'check'
    },
    cancelIcon: {
      type: String,
      default: 'close'
    },
    secondaryText: {
      type: String,
      default: ''
    },
    secondaryIcon: {
      type: String,
      default: 'delete_forever'
    },
    type: {
      type: String,
      default: 'info',
      validator: (value) => ['info', 'warning', 'error', 'success'].includes(value)
    },
    closeOnBackdrop: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    icon() {
      const icons = {
        info: 'info',
        warning: 'warning',
        error: 'error',
        success: 'check_circle'
      }
      return icons[this.type] || 'info'
    },
    iconClass() {
      const classes = {
        info: 'text-blue-400',
        warning: 'text-yellow-400',
        error: 'text-red-400',
        success: 'text-green-400'
      }
      return classes[this.type] || 'text-blue-400'
    }
  },
  methods: {
    handleConfirm() {
      this.$emit('confirm')
    },
    handleSecondary() {
      this.$emit('secondary')
    },
    handleCancel() {
      this.$emit('cancel')
    },
    handleBackdropClick() {
      if (this.closeOnBackdrop) {
        this.handleCancel()
      }
    }
  }
}
</script>

<style scoped>
.animate-scale-in {
  animation: scaleIn 0.2s ease-out;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
