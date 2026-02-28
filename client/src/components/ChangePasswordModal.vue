<template>
  <div 
    v-if="visible"
    class="flex justify-center items-center w-full h-full absolute top-0 left-0 bg-transparent background"
    @click="$emit('close')">
    <div
      class="z-10 bg-black/20 backdrop-blur-[20px] absolute h-[calc(100vh-20vh)] mobile:h-[calc(100vh-10vh)] w-[calc(100vw-30vw)] mobile:w-[calc(100vw-5vw)] flex items-center justify-center m-[100px_auto] mobile:m-[50px_auto] mobile:mx-4 rounded-[28px] mobile:rounded-[20px] border-3 border-[#a1a1a1] transition-all duration-300 modal animate-scale-in"
      @click.stop>
      <button
        class="absolute top-5 mobile:top-3 h-[42px] mobile:h-[36px] right-5 mobile:right-3 bg-primary-button text-black border-none px-[10px] mobile:px-[8px] py-[10px] mobile:py-[8px] rounded-lg text-lg mobile:text-base cursor-pointer tracking-[1px] text-center z-10 close-btn transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-primary-button/50"
        @click="$emit('close')">
        <span class="material-icons-outlined mobile:text-sm">close</span>
      </button>
      <form @submit.prevent="handleSubmit" class="flex flex-col w-full max-w-sm mobile:max-w-xs px-8 mobile:px-4">
        <input 
          v-model="oldPassword"
          type="password" 
          name="old-password" 
          aria-label="Old password"
          placeholder="Old password"
          class="min-w-[300px] mobile:min-w-[250px] mobile:w-full p-[15px] mobile:p-[12px] m-[10px_0] mobile:m-[8px_0] rounded-[20px] mobile:rounded-[16px] border-none outline-none text-xl mobile:text-lg bg-input font-red-hat form-input text-black select-text caret-black transition-all duration-200 focus:scale-105 focus:shadow-lg focus:shadow-primary-button/30"
          required />
        <br />
        <input 
          v-model="newPassword"
          type="password" 
          name="new-password" 
          aria-label="New password"
          placeholder="New password"
          class="min-w-[300px] mobile:min-w-[250px] mobile:w-full p-[15px] mobile:p-[12px] m-[10px_0] mobile:m-[8px_0] rounded-[20px] mobile:rounded-[16px] border-none outline-none text-xl mobile:text-lg bg-input font-red-hat form-input text-black select-text caret-black transition-all duration-200 focus:scale-105 focus:shadow-lg focus:shadow-primary-button/30"
          required />
        <input 
          v-model="confirmPassword"
          type="password" 
          name="new-password-2" 
          aria-label="New password again"
          placeholder="New password again"
          class="min-w-[300px] mobile:min-w-[250px] mobile:w-full p-[15px] mobile:p-[12px] m-[10px_0] mobile:m-[8px_0] rounded-[20px] mobile:rounded-[16px] border-none outline-none text-xl mobile:text-lg bg-input font-red-hat form-input text-black select-text caret-black transition-all duration-200 focus:scale-105 focus:shadow-lg focus:shadow-primary-button/30"
          required />
        <br />
        <button 
          type="submit"
          :disabled="loading"
          :class="[
            'min-w-[300px] mobile:min-w-[250px] mobile:w-full p-[15px] mobile:p-[12px] mt-[15px] mobile:mt-[12px] rounded-[20px] mobile:rounded-[16px] border-none text-xl mobile:text-lg cursor-pointer bg-primary-button font-red-hat transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-primary-button/50 submit-button text-black',
            loading ? 'opacity-75 cursor-not-allowed' : ''
          ]">
          <span v-if="loading" class="material-icons-outlined animate-spin-slow mr-2">hourglass_empty</span>
          {{ loading ? 'Changing...' : 'Change' }}
        </button>
        <label 
          v-if="error"
          class="font-red-hat text-error text-sm mobile:text-xs mt-2">
          {{ error }}
        </label>
        <label 
          v-if="success"
          class="font-red-hat text-ok text-sm mobile:text-xs mt-2">
          {{ success }}
        </label>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChangePasswordModal',
  props: {
    visible: Boolean,
    token: String
  },
  data() {
    return {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
      loading: false,
      error: '',
      success: ''
    }
  },
  methods: {
    async handleSubmit() {
      if (!this.oldPassword || !this.newPassword || !this.confirmPassword) {
        this.error = 'Please fill in all fields'
        return
      }

      if (this.newPassword !== this.confirmPassword) {
        this.error = 'The new passwords should match each other'
        return
      }

      if (this.newPassword.length < 6) {
        this.error = 'Password should be at least 6 characters long'
        return
      }

      this.loading = true
      this.error = ''
      this.success = ''

      // Emit the event with a callback to receive the result
      this.$emit('change-password', this.oldPassword, this.newPassword, (result) => {
        this.loading = false
        if (result.success) {
          setTimeout(() => {
            this.$emit('close')
            this.resetForm()
          }, 1500)
        } else {
          this.error = result.error || 'Password change failed'
        }
      })
    },

    resetForm() {
      this.oldPassword = ''
      this.newPassword = ''
      this.confirmPassword = ''
      this.error = ''
      this.success = ''
    }
  },
  watch: {
    visible(newVal) {
      if (!newVal) {
        this.resetForm()
      }
    }
  }
}
</script>
