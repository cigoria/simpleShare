<template>
  <Transition
    name="notification"
    @before-enter="onBeforeEnter"
    @enter="onEnter"
    @leave="onLeave"
  >
    <div
      v-if="notification"
      class="max-w-sm p-4 rounded-lg shadow-lg backdrop-blur-md border transition-all duration-300"
      :class="notificationClasses"
      @mouseenter="pauseTimer"
      @mouseleave="resumeTimer"
    >
      <div class="flex items-center">
        <span class="material-icons text-lg" :class="iconClasses">
          {{ getIcon }}
        </span>
        <p class="text-sm font-medium text-white ml-3">
          {{ notification.text }}
        </p>
      </div>
      
      <div class="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
        <div
          ref="progressBar"
          class="h-full bg-white/60 rounded-full transition-all duration-100 linear"
          :style="{ width: progressWidth + '%' }"
        ></div>
      </div>
    </div>
  </Transition>
</template>

<script>
export default {
  name: 'Notification',
  props: {
    notification: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      progressWidth: 100,
      timer: null,
      progressTimer: null,
      isPaused: false,
      remainingTime: 3000
    }
  },
  computed: {
    notificationClasses() {
      if (!this.notification) return ''
      
      const baseClasses = 'border border-opacity-30'
      const colorClasses = {
        ok: 'bg-ok/20 border-ok text-ok',
        danger: 'bg-danger/20 border-danger text-danger',
        error: 'bg-error/20 border-error text-error',
        info: 'bg-info/20 border-info text-info'
      }
      
      return `${baseClasses} ${colorClasses[this.notification.color] || colorClasses.info}`
    },
    iconClasses() {
      if (!this.notification) return ''
      
      const colorClasses = {
        ok: 'text-ok',
        danger: 'text-danger',
        error: 'text-error',
        info: 'text-info'
      }
      
      return colorClasses[this.notification.color] || colorClasses.info
    },
    getIcon() {
      if (!this.notification) return 'info'
      
      const icons = {
        ok: 'check_circle',
        danger: 'warning',
        error: 'error',
        info: 'info'
      }
      
      return icons[this.notification.color] || icons.info
    }
  },
  watch: {
    notification: {
      handler(newNotification) {
        if (newNotification) {
          this.startTimer()
        } else {
          this.clearTimer()
        }
      },
      immediate: true
    }
  },
  methods: {
    startTimer() {
      this.clearTimer()
      this.progressWidth = 100
      this.remainingTime = 3000
      this.isPaused = false
      
      this.timer = setTimeout(() => {
        this.removeNotification()
      }, this.remainingTime)
      
      const startTime = Date.now()
      const duration = this.remainingTime
      
      this.progressTimer = setInterval(() => {
        if (!this.isPaused) {
          const elapsed = Date.now() - startTime
          const progress = Math.max(0, 100 - (elapsed / duration) * 100)
          this.progressWidth = progress
          
          if (progress <= 0) {
            this.clearTimer()
          }
        }
      }, 50)
    },
    pauseTimer() {
      if (this.timer && !this.isPaused) {
        this.isPaused = true
        clearTimeout(this.timer)
        
        this.remainingTime = Math.round((this.progressWidth / 100) * 3000)
        
        if (this.progressTimer) {
          clearInterval(this.progressTimer)
          this.progressTimer = null
        }
      }
    },
    resumeTimer() {
      if (this.isPaused && this.remainingTime > 0) {
        this.isPaused = false
        
        this.timer = setTimeout(() => {
          this.removeNotification()
        }, this.remainingTime)
        
        const startTime = Date.now()
        const duration = this.remainingTime
        const startProgress = this.progressWidth
        
        this.progressTimer = setInterval(() => {
          if (!this.isPaused) {
            const elapsed = Date.now() - startTime
            const progress = Math.max(0, startProgress - (elapsed / duration) * startProgress)
            this.progressWidth = progress
            
            if (progress <= 0) {
              this.clearTimer()
              this.removeNotification()
            }
          }
        }, 50)
      }
    },
    clearTimer() {
      if (this.timer) {
        clearTimeout(this.timer)
        this.timer = null
      }
      if (this.progressTimer) {
        clearInterval(this.progressTimer)
        this.progressTimer = null
      }
    },
    removeNotification() {
      this.clearTimer()
      this.$emit('remove')
    },
    onBeforeEnter(el) {
      el.style.opacity = '0'
      el.style.transform = 'translateX(100%) scale(0.9)'
    },
    onEnter(el, done) {
      el.offsetHeight
      el.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      el.style.opacity = '1'
      el.style.transform = 'translateX(0) scale(1)'
      setTimeout(done, 300)
    },
    onLeave(el, done) {
      el.style.transition = 'all 0.3s ease-in'
      el.style.opacity = '0'
      el.style.transform = 'translateX(100%) scale(0.9)'
      el.style.marginBottom = '0'
      el.style.paddingTop = '0'
      el.style.paddingBottom = '0'
      el.style.height = '0'
      setTimeout(done, 300)
    }
  },
  beforeUnmount() {
    this.clearTimer()
  }
}
</script>

<style scoped>
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
  margin-bottom: 0;
  padding-top: 0;
  padding-bottom: 0;
  height: 0;
}
</style>
