<template>
  <div 
    v-if="visible"
    class="flex justify-center items-center w-full h-full absolute top-0 left-0 bg-transparent background cursor-pointer"
    @click="$emit('close')">
    <div
      class="z-10 absolute top-[90px] mobile:top-[70px] right-5 mobile:right-3 p-[10px] mobile:p-[6px] flex flex-col justify-center items-center bg-[hsl(0,0%,12%)] rounded-lg border border-[#a1a1a1] transition-all duration-300 backdrop-blur-[20px] hamburber-menu animate-slide-down"
      @click.stop>
      <button
        v-if="accessLevel === 'admin'"
        class="h-[42px] mobile:h-[38px] w-[200px] mobile:w-[180px] bg-[rgba(55,55,55,0.66)] rounded-lg border border-[#a1a1a1] text-left justify-center items-center vertical-middle flex m-[2px] flex-row font-inter text-white hover:bg-[rgba(80,80,80,0.7)] transition-all duration-200 hover:scale-105 hover:shadow-lg burber-item text-sm mobile:text-xs"
        @click="redirectToDashboard">
        <span class="material-icons-outlined mobile:text-sm">dashboard</span>Admin dashboard
      </button>
      <button
        v-if="accessLevel === 'admin'"
        class="h-[42px] mobile:h-[38px] w-[200px] mobile:w-[180px] bg-[rgba(55,55,55,0.66)] rounded-lg border border-[#a1a1a1] text-left justify-center items-center vertical-middle flex m-[2px] flex-row font-inter text-white hover:bg-[rgba(80,80,80,0.7)] transition-all duration-200 hover:scale-105 hover:shadow-lg burber-item text-sm mobile:text-xs"
        @click="$emit('show-register'); $emit('close')">
        <span class="material-icons-outlined mobile:text-sm">person_add</span> Register user
      </button>
      <button
        class="h-[42px] mobile:h-[38px] w-[200px] mobile:w-[180px] bg-[rgba(55,55,55,0.66)] rounded-lg border border-[#a1a1a1] text-left justify-center items-center vertical-middle flex m-[2px] flex-row font-inter text-white hover:bg-[rgba(80,80,80,0.7)] transition-all duration-200 hover:scale-105 hover:shadow-lg burber-item text-sm mobile:text-xs"
        @click="$emit('show-my-files'); $emit('close')">
        <span class="material-icons-outlined mobile:text-sm">folder</span> My files
      </button>
      <button
        class="h-[42px] mobile:h-[38px] w-[200px] mobile:w-[180px] bg-[rgba(55,55,55,0.66)] rounded-lg border border-[#a1a1a1] text-left justify-center items-center vertical-middle flex m-[2px] flex-row font-inter text-white hover:bg-[rgba(80,80,80,0.7)] transition-all duration-200 hover:scale-105 hover:shadow-lg burber-item text-sm mobile:text-xs"
        @click="$emit('show-change-password'); $emit('close')">
        <span class="material-icons-outlined mobile:text-sm">password</span> Change password
      </button>
      <hr v-if="accessLevel" class="border-gray-600 my-2" />
      <button
        v-if="accessLevel"
        class="h-[42px] mobile:h-[38px] w-[200px] mobile:w-[180px] border border-error bg-[hsla(11,91%,67%,0.5)] rounded-lg border border-[#a1a1a1] text-left justify-center items-center vertical-middle flex m-[2px] flex-row font-inter text-white hover:bg-[hsla(11,91%,67%,0.45)] hover:drop-shadow-[0px_0px_10px_hsla(11,91%,67%,0.8)] transition-all duration-200 hover:scale-105 hover:shadow-lg burber-item text-sm mobile:text-xs"
        @click="handleLogout">
        <span class="material-icons-outlined mobile:text-sm">logout</span>Logout
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HamburgerMenu',
  props: {
    visible: Boolean,
    accessLevel: String
  },
  emits: ['close', 'show-register', 'show-my-files', 'show-change-password', 'logout'],
  methods: {
    redirectToDashboard() {
      this.$emit('close')
      const token = localStorage.getItem("token")
      if (!token) {
        console.error("No token found in localStorage")
        return
      }
      console.log("Redirecting to admin dashboard with token:", token)
      window.location.href = "/admin/dashboard/" + token
    },

    async handleLogout() {
      this.$emit('logout')
      this.$emit('close')
    }
  }
}
</script>
