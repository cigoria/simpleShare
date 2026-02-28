<template>
  <div id="header"
    class="absolute top-0 left-0 w-full h-[100px] mobile:h-[80px] border-b border-b-[length:1px] border-b-gradient-to-r from-blue-400 via-green-400 to-blue-400 animate-slide-down">
    <Logo />
    <div
      class="absolute top-5 mobile:top-3 right-5 mobile:right-3 flex justify-end items-end flex-row-reverse gap-2 mobile:gap-1">
      <button
        v-if="isAuthenticated"
        class="h-[42px] mobile:h-[36px] bg-primary-button text-black border-none px-[10px] mobile:px-[8px] py-[10px] mobile:py-[8px] rounded-lg text-lg mobile:text-base cursor-pointer tracking-[1px] text-center m-[10px] mobile:m-[5px] menu-btn transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-primary-button/50 animate-scale-in"
        @click="toggleHamburger">
        <span class="material-icons-outlined mobile:text-sm">menu</span>
      </button>
      <button
        v-if="!isAuthenticated"
        class="bg-primary-button text-black border-none px-[25px] mobile:px-[15px] py-[10px] mobile:py-[8px] rounded-lg text-lg mobile:text-base cursor-pointer tracking-[1px] m-[10px] mobile:m-[5px] login-btn transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-primary-button/50 animate-fade-in"
        @click="$emit('show-login')">
        LOG IN
      </button>
      <button
        v-if="isAuthenticated"
        class="h-[42px] mobile:h-[36px] bg-primary-button text-black border-none px-[10px] mobile:px-[8px] py-[10px] mobile:py-[8px] rounded-lg text-lg mobile:text-base cursor-pointer tracking-[1px] text-center m-[10px] mobile:m-[5px] upload-btn transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-primary-button/50"
        @click="$emit('show-upload')">
        <span class="material-icons-outlined mobile:text-sm">upload</span>
      </button>
      <div v-if="isAuthenticated && quotaInfo.text" id="quota-container" class="block mobile:block">
        <div class="flex flex-col items-center gap-2">
          <span id="quota-text" class="text-sm whitespace-nowrap mobile:text-xs">{{ quotaInfo.text }}</span>
          <div class="flex items-center gap-2">
            <div id="progress-bar"
              class="w-32 mobile:w-24 h-2 bg-gray-600 rounded-full overflow-hidden transition-all duration-500">
              <div id="progress"
                class="h-full rounded-full transition-all duration-700 ease-out"
                :style="{
                  width: quotaInfo.percentage + '%',
                  background: getProgressBarColor(quotaInfo.percentage)
                }">
              </div>
            </div>
            <span id="percentage-text" class="text-sm mobile:text-xs font-medium transition-all duration-300">{{ quotaInfo.percentage }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Logo from './Logo.vue'

export default {
  name: 'Header',
  components: {
    Logo
  },
  props: {
    isAuthenticated: Boolean,
    quotaInfo: Object
  },
  emits: ['show-login', 'show-upload', 'toggle-hamburger'],
  methods: {
    getProgressBarColor(percentage) {
      if (this.quotaInfo.text === "? MB of ? MB") {
        return "linear-gradient(to right, #8b5cf6, #8b5cf6)" // Purple color for unknown quota
      } else if (percentage > 100) {
        return "linear-gradient(to right, #f77b5e, #f7e15e)"
      } else if (percentage > 90) {
        return "linear-gradient(to right, #f7e15e, #f7e15e)"
      } else if (percentage > 75) {
        return "linear-gradient(to right, #5ef78c, #f7e15e)"
      } else {
        return "linear-gradient(to right, #5ef78c, #5ef78c)"
      }
    },
    toggleHamburger() {
      this.$emit('toggle-hamburger')
    }
  }
}
</script>
