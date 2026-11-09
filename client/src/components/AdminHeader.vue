<template>
  <div
    class="absolute top-0 left-0 w-full h-[100px] mobile:h-[80px] border-b border-b-[length:1px] border-b-gradient-to-r from-blue-400 via-green-400 to-blue-400 animate-slide-down z-50 backdrop-blur-md"
  >
    <!-- Top header bar -->
    <router-link to="/" class="no-underline">
      <Logo />
    </router-link>
    <!-- Tab Navigation -->
    <div class="absolute top-5 mobile:top-3 left-1/2 -translate-x-1/2 mobile:left-auto mobile:right-3 mobile:translate-x-0 flex bg-gray-800/50 rounded-lg p-1 backdrop-blur-sm mobile:max-w-[70vw] mobile:overflow-x-auto mobile:scrollbar-hide">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="$emit('tab-change', tab.id)"
        :class="[
          'px-5 mobile:px-3 py-2 mobile:py-1.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap mobile:flex-shrink-0',
          activeTab === tab.id
            ? 'bg-primary-button text-black shadow-sm'
            : 'text-gray-300 hover:text-white hover:bg-gray-700/50',
        ]"
      >
        {{ tab.label }}
      </button>
    </div>
  </div>
</template>

<script>
import Logo from "./Logo.vue";

export default {
  name: "AdminHeader",
  components: {
    Logo,
  },
  props: {
    activeTab: String,
  },
  emits: ["tab-change"],
  data() {
    return {
      tabs: [
        { id: "users", label: "Users" },
        { id: "files", label: "Files" },
        { id: "links", label: "Links" },
        { id: "stats", label: "Stats" },
        { id: "storage", label: "Storage" },
      ],
    };
  },
};
</script>

<style scoped>
.mobile\:scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.mobile\:scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
