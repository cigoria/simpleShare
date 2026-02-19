<template>
  <div
    class="absolute top-0 left-0 w-full h-[100px] mobile:h-[80px] border-b border-b-[length:1px] border-b-gradient-to-r from-blue-400 via-green-400 to-blue-400 animate-slide-down z-50 backdrop-blur-md">
    <!-- Top header bar -->
    <router-link 
      to="/"
      class="absolute p-0 m-[10px] mobile:m-[5px] top-5 mobile:top-3 left-5 mobile:left-3 font-inter font-normal text-white text-3xl mobile:text-2xl animate-fade-in no-underline">
      simple<span
        class="bg-gradient-to-r from-primary-button to-secondary-button bg-clip-text text-transparent">Share</span>
    </router-link>
    <div
      class="button-container absolute top-5 mobile:top-3 right-5 mobile:right-3 flex gap-2 mobile:gap-1 flex-wrap mobile:flex-col mobile:items-end">
      <router-link 
        to="/"
        class="bg-secondary-button text-black border-none px-[25px] mobile:px-[15px] py-[10px] mobile:py-[8px] rounded-lg text-lg mobile:text-base cursor-pointer tracking-[1px] m-[10px] mobile:m-[5px] transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-secondary-button/50 animate-fade-in no-underline inline-block">
        Back to App
      </router-link>
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="$emit('tab-change', tab.id)"
        :class="[
          'border-none px-[25px] mobile:px-[15px] py-[10px] mobile:py-[8px] rounded-lg text-lg mobile:text-base cursor-pointer tracking-[1px] m-[10px] mobile:m-[5px] transition-all duration-200 hover:scale-105 hover:shadow-lg animate-fade-in',
          activeTab === tab.id 
            ? 'bg-primary-button text-black hover:shadow-primary-button/50' 
            : 'bg-gray-600 text-white hover:shadow-primary-button/50'
        ]">
        {{ tab.label }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminHeader',
  props: {
    activeTab: String
  },
  emits: ['tab-change'],
  data() {
    return {
      tabs: [
        { id: 'users', label: 'Users' },
        { id: 'files', label: 'All Files' },
        { id: 'storage', label: 'Global Storage' },
        { id: 'database', label: 'Database' }
      ]
    }
  }
}
</script>
