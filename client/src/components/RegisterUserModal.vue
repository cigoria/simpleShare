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
          v-model="username"
          type="text" 
          name="reg-username" 
          aria-label="New Username" 
          placeholder="New Username"
          class="min-w-[300px] mobile:min-w-[250px] mobile:w-full p-[15px] mobile:p-[12px] m-[10px_0] mobile:m-[8px_0] rounded-[20px] mobile:rounded-[16px] border-none outline-none text-xl mobile:text-lg bg-input font-red-hat form-input text-black select-text caret-black transition-all duration-200 focus:scale-105 focus:shadow-lg focus:shadow-primary-button/30"
          required />
        <br />
        <input 
          v-model="password"
          type="password" 
          name="reg-password" 
          aria-label="New Password"
          placeholder="New Password"
          class="min-w-[300px] mobile:min-w-[250px] mobile:w-full p-[15px] mobile:p-[12px] m-[10px_0] mobile:m-[8px_0] rounded-[20px] mobile:rounded-[16px] border-none outline-none text-xl mobile:text-lg bg-input font-red-hat form-input text-black select-text caret-black transition-all duration-200 focus:scale-105 focus:shadow-lg focus:shadow-primary-button/30"
          required />
        <br />
        <div
          class="min-w-[300px] mobile:min-w-[250px] mobile:w-full m-[10px_0] mobile:m-[8px_0] space-y-4 mobile:space-y-3">
          <label
            class="flex items-center text-white bg-black/20 p-4 mobile:p-3 rounded-xl border border-[#444] cursor-pointer hover:bg-black/30 transition-all duration-200">
            <input 
              v-model="isAdmin"
              type="checkbox" 
              name="reg-is-admin"
              class="mr-3 mobile:mr-2 w-5 mobile:w-4 h-5 mobile:h-4 text-primary-button bg-gray-800 border-gray-600 rounded focus:ring-primary-button focus:ring-2 focus:ring-offset-0 checked:bg-primary-button checked:border-primary-button" />
            <span class="text-sm mobile:text-xs font-inter">Admin User</span>
          </label>
          <div class="bg-black/20 p-3 mobile:p-2 rounded-xl border border-[#444]">
            <label class="block text-white mb-2">
              <span class="text-sm mobile:text-xs font-inter">Storage Quota:</span>
            </label>
            <select 
              v-model="quota"
              name="reg-quota"
              class="w-full p-3 mobile:p-2 rounded-lg border border-[#555] outline-none text-base mobile:text-sm bg-[#2a2a2a] font-red-hat text-white transition-all duration-200 focus:border-primary-button focus:shadow-lg focus:shadow-primary-button/30 hover:bg-[#333333] appearance-none cursor-pointer"
              required>
              <option value="52428800" class="bg-[#2a2a2a] text-white">
                50 MB
              </option>
              <option value="104857600" class="bg-[#2a2a2a] text-white">
                100 MB
              </option>
              <option value="524288000" class="bg-[#2a2a2a] text-white">
                500 MB
              </option>
              <option value="1073741824" class="bg-[#2a2a2a] text-white">
                1 GB
              </option>
              <option value="0" class="bg-[#2a2a2a] text-white">
                Unlimited
              </option>
            </select>
          </div>
        </div>
        <br />
        <button 
          type="submit"
          :disabled="loading"
          :class="[
            'min-w-[300px] mobile:min-w-[250px] mobile:w-full p-[15px] mobile:p-[12px] mt-[15px] mobile:mt-[12px] rounded-[20px] mobile:rounded-[16px] border-none text-xl mobile:text-lg cursor-pointer bg-primary-button font-red-hat transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-primary-button/50 submit-button text-black',
            loading ? 'opacity-75 cursor-not-allowed' : ''
          ]">
          <span v-if="loading" class="material-icons-outlined animate-spin-slow mr-2">hourglass_empty</span>
          {{ loading ? 'Registering...' : 'Register' }}
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
  name: 'RegisterUserModal',
  props: {
    visible: Boolean,
    token: String
  },
  data() {
    return {
      username: '',
      password: '',
      isAdmin: false,
      quota: '52428800', // 50 MB default
      loading: false,
      error: '',
      success: ''
    }
  },
  methods: {
    async handleSubmit() {
      if (!this.username || !this.password) {
        this.error = 'Please fill in all fields'
        return
      }

      if (this.password.length < 6) {
        this.error = 'Password should be at least 6 characters long'
        return
      }

      this.loading = true
      this.error = ''
      this.success = ''

      const userData = {
        username: this.username,
        password: this.password,
        isAdmin: this.isAdmin,
        quota: parseInt(this.quota)
      }

      // Emit the event with a callback to receive the result
      this.$emit('register', userData, (result) => {
        this.loading = false
        if (result.success) {
          this.resetForm()
          setTimeout(() => {
            this.$emit('close')
            this.success = ''
          }, 2000)
        } else {
          this.error = result.error || 'Registration failed'
        }
      })
    },

    resetForm() {
      this.username = ''
      this.password = ''
      this.isAdmin = false
      this.quota = '52428800'
      this.error = ''
    }
  },
  watch: {
    visible(newVal) {
      if (!newVal) {
        this.resetForm()
        this.success = ''
      }
    }
  }
}
</script>
