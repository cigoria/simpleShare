<template>
  <div class="text-center container animate-slide-up mt-20 mobile:mt-16 px-4 mobile:px-2">
    <!-- Code input -->
    <form @submit.prevent="handleSubmit">
      <div
        class="mb-5 flex justify-center gap-[10px] mobile:gap-[6px] input-box mobile:flex-wrap mobile:justify-center mobile:max-w-[320px] mobile:mx-auto">
        <input 
          v-for="(input, index) in inputs" 
          :key="index"
          v-model="input.value"
          type="text"
          class="bg-input border-none outline-none font-inter text-[28px] mobile:text-[20px] w-12 mobile:w-10 h-[52px] mobile:h-[44px] text-center text-[#333] rounded-lg shadow-[inset_-2px_-2px_5px_rgba(0,0,0,0.2),inset_2px_2px_5px_rgba(255,255,255,0.5)] transition-all duration-200 code-input select-text focus:scale-110 focus:shadow-lg focus:shadow-primary-button/30"
          maxlength="1" 
          required 
          autocomplete="off" 
          spellcheck="false"
          @input="handleInput($event, index)"
          @keydown="handleKeydown($event, index)"
          @paste="handlePaste($event, index)"
          ref="codeInputs" />
      </div>
      <button 
        id="download-btn" 
        type="submit"
        :disabled="!canDownload"
        :class="[
          'bg-secondary-button border-none px-10 mobile:px-8 py-[15px] mobile:py-[12px] rounded-xl text-[22px] mobile:text-[18px] font-red-hat cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-secondary-button/50 active:scale-95 download-btn text-black animate-bounce-gentle',
          canDownload ? '' : 'opacity-50 cursor-not-allowed'
        ]">
        Download
      </button>
      <div 
        id="file-info"
        :class="[
          'text-lg mobile:text-base font-inter min-h-[28px] mobile:min-h-[24px] transition-all duration-300',
          fileInfo.text ? 'opacity-100' : 'opacity-0'
        ]"
        :style="{ color: fileInfo.color }">
        <span v-if="fileInfo.loading" class="material-icons-outlined animate-spin-slow">hourglass_empty</span>
        {{ fileInfo.text }}
      </div>
    </form>

    <!-- File Card Display -->
    <FileCard 
      v-if="fileData"
      :file-data="fileData"
      @download-file="handleDownloadFile"
      @download-group="handleDownloadGroup" />
  </div>
</template>

<script>
import FileCard from './FileCard.vue'

export default {
  name: 'DownloadForm',
  components: {
    FileCard
  },
  data() {
    return {
      inputs: Array(6).fill(null).map(() => ({ value: '' })),
      fileInfo: {
        text: '',
        color: '',
        loading: false
      },
      fileData: null
    }
  },
  computed: {
    fullCode() {
      return this.inputs.map(input => input.value).join('')
    },
    canDownload() {
      return this.fullCode.length === 6 && this.fileInfo.exists
    }
  },
  mounted() {
    this.$refs.codeInputs[0].focus()
  },
  methods: {
    handleInput(event, index) {
      const value = event.target.value.toLowerCase().replace(/[^a-z]/g, '')
      this.inputs[index].value = value

      // Add subtle animation on input
      event.target.style.transform = "scale(1.1)"
      event.target.style.backgroundColor = "#e8f5e8"
      setTimeout(() => {
        event.target.style.transform = ""
        event.target.style.backgroundColor = ""
      }, 150)

      if (value.length === 1 && index < this.inputs.length - 1) {
        this.$refs.codeInputs[index + 1].focus()
      }

      this.checkFileExists()
    },

    handleKeydown(event, index) {
      if (event.key === "Backspace" && event.target.value === "" && index > 0) {
        this.$refs.codeInputs[index - 1].focus()
      }
      setTimeout(() => this.checkFileExists(), 10)
    },

    handlePaste(event, index) {
      event.preventDefault()
      const pastedData = event.clipboardData
        .getData("text")
        .toLowerCase()
        .replace(/[^a-z]/g, "")

      let charIndex = 0
      for (let i = index; i < this.inputs.length && charIndex < pastedData.length; i++) {
        this.inputs[i].value = pastedData[charIndex]
        charIndex++
      }

      const nextEmptyIndex = this.inputs.findIndex(input => input.value === "")
      if (nextEmptyIndex !== -1) {
        this.$refs.codeInputs[nextEmptyIndex].focus()
      } else {
        this.$refs.codeInputs[this.inputs.length - 1].focus()
      }

      this.checkFileExists()
    },

    async checkFileExists() {
      if (this.fullCode.length === 6) {
        this.fileInfo.loading = true
        this.fileInfo.text = 'Checking...'
        this.fileInfo.color = "#6792ff"
        this.fileData = null

        try {
          const result = await new Promise((resolve) => {
            this.$emit('check-file', this.fullCode, resolve)
          })
          
          // Debug log
          console.log('Backend result:', result)
          
          if (result && result.exists) {
            this.fileInfo.text = ""
            this.fileInfo.color = "#5ef78c"
            this.fileInfo.exists = true
            
            // Set fileData for the FileCard component
            if (result.type === 'group') {
              this.fileData = {
                type: 'group',
                code: result.id,
                name: result.name,
                create_date: result.created_at,
                total_size: result.files.reduce((total, file) => total + file.file_size_in_bytes, 0),
                files: result.files.map(file => ({
                  code: file.id,
                  original_name: file.original_name || file.stored_filename,
                  size: file.file_size_in_bytes,
                  upload_date: file.date_added
                }))
              }
            } else {
              this.fileData = {
                type: 'file',
                name: result.original_name || result.stored_filename,
                size: result.file_size_in_bytes,
                upload_date: result.date_added
              }
            }
            
            // Debug log
            console.log('FileData set:', this.fileData)
          } else {
            this.fileInfo.text = "File not found"
            this.fileInfo.color = "#f77b5e"
            this.fileInfo.exists = false
            this.fileData = null
          }
        } catch (error) {
          console.error('Error in checkFileExists:', error)
          this.fileInfo.text = "Network error"
          this.fileInfo.color = "#f77b5e"
          this.fileInfo.exists = false
          this.fileData = null
        } finally {
          this.fileInfo.loading = false
        }
      } else {
        this.fileInfo.text = ""
        this.fileInfo.exists = false
        this.fileData = null
      }
    },

    async handleSubmit() {
      if (!this.canDownload) {
        // Error animation for disabled state
        this.inputs.forEach((input, index) => {
          setTimeout(() => {
            this.$refs.codeInputs[index].classList.add("animate-shake")
            this.$refs.codeInputs[index].style.backgroundColor = "#f77b5e"
            setTimeout(() => {
              this.$refs.codeInputs[index].classList.remove("animate-shake")
              this.$refs.codeInputs[index].style.backgroundColor = ""
            }, 500)
          }, index * 30)
        })
        return
      }

      // Success animation
      this.inputs.forEach((input, index) => {
        setTimeout(() => {
          this.$refs.codeInputs[index].classList.add("animate-bounce-gentle")
          this.$refs.codeInputs[index].style.backgroundColor = "#5ef78c"
          setTimeout(() => {
            this.$refs.codeInputs[index].classList.remove("animate-bounce-gentle")
            this.$refs.codeInputs[index].style.backgroundColor = ""
          }, 600)
        }, index * 50)
      })

      setTimeout(() => {
        this.$emit('download', this.fullCode)
        this.resetForm()
      }, 400)
    },

    resetForm() {
      this.inputs.forEach(input => input.value = '')
      this.fileInfo.text = ""
      this.fileInfo.exists = false
      this.fileData = null
      this.$refs.codeInputs[0].focus()
    },

    handleDownloadFile(code) {
      this.$emit('download', code)
    },

    handleDownloadGroup(code) {
      this.$emit('download', code)
    }
  }
}
</script>
