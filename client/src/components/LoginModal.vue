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
          name="username" 
          aria-label="Username" 
          placeholder="Username"
          class="min-w-[300px] mobile:min-w-[250px] mobile:w-full p-[15px] mobile:p-[12px] m-[10px_0] mobile:m-[8px_0] rounded-[20px] mobile:rounded-[16px] border-none outline-none text-xl mobile:text-lg bg-input font-red-hat form-input select-text caret-black text-black transition-all duration-200 focus:scale-105 focus:shadow-lg focus:shadow-primary-button/30"
          required />
        <br />
        <input 
          v-model="password"
          type="password" 
          name="password" 
          aria-label="Password" 
          placeholder="Password"
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
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
        <label 
          v-if="error"
          class="font-red-hat text-error text-sm mobile:text-xs mt-2">
          {{ error }}
        </label>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginModal',
  props: {
    visible: Boolean
  },
  data() {
    return {
      username: '',
      password: '',
      loading: false,
      error: ''
    }
  },
  methods: {
    async handleSubmit() {
      if (!this.username || !this.password) {
        this.error = 'Please fill in all fields'
        return
      }

      this.loading = true
      this.error = ''

      try {
        const loginPromise = new Promise((resolve) => {
          this.$emit('login', this.username, this.password, resolve)
        })
        
        const result = await loginPromise
        if (result && result.success) {
          this.$emit('close')
          this.resetForm()
        } else {
          this.error = (result && result.error) || 'Login failed'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.loading = false
      }
    },

    resetForm() {
      this.username = ''
      this.password = ''
      this.error = ''
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
