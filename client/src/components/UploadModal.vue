<template>
  <div 
    v-if="visible"
    class="flex justify-center items-center w-full h-full absolute top-0 left-0 bg-transparent background z-[50]"
    @click="$emit('close')">
    <div
      class="z-[55] bg-black/20 backdrop-blur-[20px] absolute h-[calc(100vh-20vh)] mobile:h-[calc(100vh-10vh)] w-[calc(100vw-30vw)] mobile:w-[calc(100vw-5vw)] flex items-center justify-center flex-col m-[100px_auto] mobile:m-[50px_auto] mobile:mx-4 rounded-[28px] mobile:rounded-[20px] border-3 border-[#a1a1a1] transition-all duration-300 modal animate-scale-in"
      @click.stop>
      <button
        class="absolute top-5 mobile:top-3 h-[42px] mobile:h-[36px] right-5 mobile:right-3 bg-primary-button text-black border-none px-[10px] mobile:px-[8px] py-[10px] mobile:py-[8px] rounded-lg text-lg mobile:text-base cursor-pointer tracking-[1px] text-center z-[70] close-btn transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-primary-button/50"
        @click="$emit('close')">
        <span class="material-icons-outlined mobile:text-sm">close</span>
      </button>
      
      <div
        v-if="!uploading && !uploadComplete && !uploadError"
        class="font-inter text-2xl mobile:text-xl relative h-[80%] mobile:h-[70%] w-[80%] mobile:w-[90%] flex items-center justify-center m-[100px_auto] mobile:m-[50px_auto] rounded-[28px] mobile:rounded-[20px] border-0 transition-all duration-300 drop_zone cursor-pointer hover:scale-105 z-[60]"
        :class="{ 'dragover': isDragOver }"
        @click.stop="triggerFileInput"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop">
        <p class="text-center mobile:text-sm">
          <span style="color: #5ef78c">Drop</span> or
          <span style="color: #4c73f0">Select</span> files here
        </p>
      </div>

      <div 
        v-if="uploading"
        class="w-full max-w-2xl mobile:max-w-full mobile:px-4 mx-auto p-8 mobile:p-4 flex flex-col items-center justify-center space-y-6 mobile:space-y-4 relative z-[60]">
        <div class="w-full">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm mobile:text-xs text-gray-300">Upload Progress</span>
            <span class="text-sm mobile:text-xs font-medium text-primary-button">{{ uploadProgress.percentage }}%</span>
          </div>
          <div class="w-full bg-gray-700 rounded-full h-3 mobile:h-2 overflow-hidden">
            <div 
              class="h-full bg-gradient-to-r from-primary-button to-secondary-button rounded-full transition-all duration-300 ease-out" 
              :style="{ width: uploadProgress.percentage + '%' }">
            </div>
          </div>
        </div>
        
        <div class="flex flex-col items-center space-y-2 text-center">
          <div class="text-lg mobile:text-base text-white">
            <span class="font-red-hat">{{ uploadProgress.speed }} MB/s</span>
          </div>
          <div class="text-sm mobile:text-xs text-gray-400">
            <span>{{ uploadProgress.loaded }}</span> / <span>{{ uploadProgress.total }}</span>
          </div>
        </div>
      </div>

      <!-- Upload Status/Error -->
      <div 
        v-if="uploadError"
        class="w-full max-w-lg mobile:max-w-full mobile:px-6 mx-auto flex flex-col items-center justify-center px-8 py-6 relative z-[60]">
        
        <!-- Error Header -->
        <div class="text-center mb-6">
          <div class="inline-flex items-center justify-center w-16 h-16 mobile:w-12 mobile:h-12 rounded-full bg-red-500/20 mb-4">
            <span class="material-icons-outlined text-3xl mobile:text-2xl" style="color: #f77b5e">error</span>
          </div>
          <h2 class="text-2xl mobile:text-xl font-inter font-semibold text-white mb-2">
            Upload failed!
          </h2>
        </div>
        
        <!-- Error Content -->
        <div class="w-full space-y-4">
          <!-- Error Message Box -->
          <div class="bg-black/30 border border-red-500/30 rounded-xl p-4 mobile:p-3">
            <div class="flex items-start gap-3">
              <span class="material-icons-outlined text-red-400 text-lg mobile:text-sm mt-0.5">info</span>
              <div class="flex-1">
                <p class="text-sm mobile:text-xs text-gray-300 font-medium mb-1">Error Details</p>
                <p class="text-sm mobile:text-xs text-red-400 font-inter">{{ uploadError }}</p>
              </div>
            </div>
          </div>
          
          <!-- Suggestions Box -->
          <div v-if="errorType" class="bg-black/20 border border-gray-600/30 rounded-xl p-4 mobile:p-3">
            <div class="flex items-start gap-3">
              <span class="material-icons-outlined text-blue-400 text-lg mobile:text-sm mt-0.5">lightbulb</span>
              <div class="flex-1">
                <p class="text-sm mobile:text-xs text-gray-300 font-medium mb-2">What you can try:</p>
                <ul class="text-xs mobile:text-[11px] text-gray-400 space-y-1.5">
                  <li v-if="errorType === 'quota_exceeded'" class="flex items-start gap-2">
                    <span class="text-blue-400 mt-0.5">•</span>
                    <span>Delete old files to free up space or upload a smaller file</span>
                  </li>
                  <li v-if="errorType === 'auth_error'" class="flex items-start gap-2">
                    <span class="text-blue-400 mt-0.5">•</span>
                    <span>Log out and log back in to refresh your session</span>
                  </li>
                  <li v-if="errorType === 'invalid_request'" class="flex items-start gap-2">
                    <span class="text-blue-400 mt-0.5">•</span>
                    <span>Check if the file format is supported and not corrupted</span>
                  </li>
                  <li v-if="errorType === 'timeout' || errorType === 'network_error'" class="flex items-start gap-2">
                    <span class="text-blue-400 mt-0.5">•</span>
                    <span>Check your internet connection and try uploading again</span>
                  </li>
                  <li v-if="errorType === 'rate_limit'" class="flex items-start gap-2">
                    <span class="text-blue-400 mt-0.5">•</span>
                    <span>Wait a few moments before trying again</span>
                  </li>
                  <li v-if="errorType === 'server_error' || errorType === 'server_unavailable'" class="flex items-start gap-2">
                    <span class="text-blue-400 mt-0.5">•</span>
                    <span>Try again in a few minutes or contact support if it persists</span>
                  </li>
                  <li v-else class="flex items-start gap-2">
                    <span class="text-blue-400 mt-0.5">•</span>
                    <span>Check your connection and try uploading again</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div class="flex gap-3 mobile:gap-2 justify-center pt-2">
            <button
              v-if="canRetry"
              @click="retryUpload"
              class="flex items-center gap-2 px-5 mobile:px-4 py-2.5 mobile:py-2 bg-primary-button text-black rounded-lg font-medium text-sm mobile:text-xs hover:scale-105 transition-all duration-200 hover:shadow-lg hover:shadow-primary-button/50">
              <span class="material-icons-outlined text-lg mobile:text-sm">refresh</span>
              Retry Upload
            </button>
            
            <button
              v-if="errorType === 'quota_exceeded'"
              @click="$emit('show-my-files')"
              class="flex items-center gap-2 px-5 mobile:px-4 py-2.5 mobile:py-2 bg-orange-600 text-white rounded-lg font-medium text-sm mobile:text-xs hover:bg-orange-700 transition-all duration-200">
              <span class="material-icons-outlined text-lg mobile:text-sm">folder_open</span>
              Manage Files
            </button>
            
            <button
              @click="resetUpload"
              class="flex items-center gap-2 px-5 mobile:px-4 py-2.5 mobile:py-2 bg-gray-700 text-white rounded-lg font-medium text-sm mobile:text-xs hover:bg-gray-600 transition-all duration-200">
              <span class="material-icons-outlined text-lg mobile:text-sm">close</span>
              Start Over
            </button>
          </div>
        </div>
      </div>

      <!-- Success Content -->
      <div 
        v-if="uploadComplete"
        class="space-y-6 mobile:space-y-4 relative z-[60]">
        <!-- Individual Success -->
        <div 
          v-if="uploadResult.code && !uploadResult.files"
          class="text-center p-6 mobile:p-4 bg-black/20 rounded-xl border border-[#444]">
          <p class="text-gray-400 text-3xl mobile:text-2xl font-inter">
            Your file code:
          </p>
          <div class="flex items-center justify-center gap-3 mobile:gap-2">
            <span 
              class="text-3xl mobile:text-2xl font-red-hat font-bold text-primary-button cursor-pointer group relative transition-all duration-200 hover:scale-110 hover:text-secondary-button"
              title="Click to copy"
              @click="copyCode">
              <span
                class="tooltip absolute -top-8 mobile:-top-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs mobile:text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {{ copyTooltip }}
              </span>
              {{ uploadResult.code }}
            </span>
          </div>
          <p class="text-sm mobile:text-xs text-gray-400 mb-3 font-inter mt-6 mobile:mt-4">
            or share via direct link:
          </p>
          <div class="flex items-center gap-3 mobile:gap-2 p-4 mobile:p-3 bg-black/20 rounded-xl border border-[#444]">
            <span 
              class="flex-1 font-red-hat text-sm mobile:text-xs truncate cursor-pointer hover:text-primary-button transition-colors"
              @click="copyLink">
              {{ fullUrl }}
            </span>
            <button 
              class="p-2 mobile:p-1 rounded-lg hover:bg-black/20 transition-all duration-200 group relative hover:scale-110"
              title="Click to copy"
              @click="copyLink">
              <span class="material-icons-outlined text-xl mobile:text-lg text-gray-400 group-hover:text-white cursor-pointer">content_copy</span>
            </button>
          </div>
        </div>

        <!-- Multiple Individual Files Success -->
        <div 
          v-if="uploadResult.files && uploadResult.multipleIndividual"
          class="text-center p-6 mobile:p-4 bg-black/20 rounded-xl border border-[#444]">
          <p class="text-gray-400 text-3xl mobile:text-2xl font-inter mb-4">
            Files uploaded successfully!
          </p>
          <div class="text-left max-h-40 overflow-y-auto mb-4 space-y-2">
            <div 
              v-for="file in uploadResult.files" 
              :key="file.code"
              class="text-sm mobile:text-xs text-gray-300 bg-black/10 p-2 rounded">
              <span class="font-medium">{{ file.originalname }}</span>
              <span class="text-gray-400 ml-2">({{ formatBytes(file.size) }})</span>
              <span class="text-primary-button font-red-hat ml-2">{{ file.code }}</span>
            </div>
          </div>
        </div>
        
        <!-- Group Success -->
        <div 
          v-if="uploadResult.group"
          class="text-center p-6 mobile:p-4 bg-black/20 rounded-xl border border-[#444]">
          <p class="text-gray-400 text-3xl mobile:text-2xl font-inter mb-4">
            Files uploaded successfully!
          </p>
          <div class="mb-6">
            <p class="text-sm mobile:text-xs text-gray-400">
              Group code: 
              <span 
                class="font-red-hat font-bold text-primary-button cursor-pointer hover:text-secondary-button transition-colors"
                title="Click to copy"
                @click="copyGroupCode">
                {{ uploadResult.group.id }}
              </span>
            </p>
          </div>
          <div class="text-left max-h-40 overflow-y-auto mb-4 space-y-2">
            <div 
              v-for="file in uploadResult.files" 
              :key="file.code"
              class="text-sm mobile:text-xs text-gray-300 bg-black/10 p-2 rounded">
              <span class="font-medium">{{ file.originalname }}</span>
              <span class="text-gray-400 ml-2">({{ formatBytes(file.size) }})</span>
              <span class="text-primary-button font-red-hat ml-2">{{ file.code }}</span>
            </div>
          </div>
          <div class="flex items-center gap-3 mobile:gap-2 p-4 mobile:p-3 bg-black/20 rounded-xl border border-[#444]">
            <span 
              class="flex-1 font-red-hat text-sm mobile:text-xs truncate cursor-pointer hover:text-primary-button transition-colors"
              @click="copyGroupLink">
              {{ groupUrl }}
            </span>
            <button 
              class="p-2 mobile:p-1 rounded-lg hover:bg-black/20 transition-all duration-200 group relative hover:scale-110"
              title="Click to copy"
              @click="copyGroupLink">
              <span class="material-icons-outlined text-xl mobile:text-lg text-gray-400 group-hover:text-white cursor-pointer">content_copy</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <input 
      ref="fileInput"
      type="file"
      multiple
      style="display: none"
      @click.stop
      @change.stop="handleFileSelect">
  </div>

  <!-- Group Choice Modal -->
  <GroupChoiceModal 
    :visible="showGroupChoiceModal"
    @close="showGroupChoiceModal = false"
    @create-group="handleCreateGroup"
    @upload-individually="handleUploadIndividually" />
</template>

<script>
import GroupChoiceModal from './GroupChoiceModal.vue'

export default {
  name: 'UploadModal',
  components: {
    GroupChoiceModal
  },
  props: {
    visible: Boolean,
    token: String
  },
  data() {
    return {
      isDragOver: false,
      uploading: false,
      uploadComplete: false,
      uploadError: null,
      errorType: null,
      canRetry: true,
      uploadResult: null,
      showGroupChoiceModal: false,
      pendingFiles: null,
      uploadType: null, // 'individual', 'group', or null
      groupName: '',
      uploadProgress: {
        percentage: 0,
        speed: '0',
        loaded: '0 MB',
        total: '0 MB'
      },
      copyTooltip: 'Click to copy',
      lastUploadedFiles: null,
      lastUploadConfig: null
    }
  },
  computed: {
    fullUrl() {
      if (this.uploadResult && this.uploadResult.code) {
        return window.location.href + "files/" + this.uploadResult.code
      }
      return ''
    },
    groupUrl() {
      if (this.uploadResult && this.uploadResult.group && this.uploadResult.group.id) {
        return window.location.href + "groups/" + this.uploadResult.group.id
      }
      return ''
    }
  },
  methods: {
    triggerFileInput() {
      this.$refs.fileInput.click()
    },

    handleFileSelect(event) {
      const files = event.target.files
      if (files.length > 0) {
        this.handleFiles(files)
      }
    },

    handleDragOver(event) {
      this.isDragOver = true
      event.target.style.transform = "scale(1.05)"
      event.target.style.backgroundColor = "rgba(103, 146, 255, 0.1)"
    },

    handleDragLeave(event) {
      this.isDragOver = false
      event.target.style.transform = ""
      event.target.style.backgroundColor = ""
    },

    handleDrop(event) {
      this.isDragOver = false
      event.target.style.transform = ""
      event.target.style.backgroundColor = ""
      const files = event.dataTransfer.files
      this.handleFiles(files)
    },

    async handleFiles(files) {
      console.log('handleFiles called with:', files.length, 'files')
      console.log('uploadType:', this.uploadType)
      console.log('showGroupChoiceModal:', this.showGroupChoiceModal)
      
      if (files.length === 0) return

      // If multiple files selected and no upload choice made, show group choice modal
      if (files.length > 1 && !this.uploadType) {
        console.log('Should show GroupChoiceModal')
        this.pendingFiles = files
        this.showGroupChoiceModal = true
        console.log('showGroupChoiceModal set to:', this.showGroupChoiceModal)
        return
      }

      // Determine upload type and proceed
      const isGroupUpload = this.uploadType === 'group' && files.length > 0
      console.log('Proceeding with upload, isGroupUpload:', isGroupUpload)
      
      // Store upload configuration for potential retry
      this.lastUploadedFiles = files
      this.lastUploadConfig = {
        isGroupUpload,
        groupName: this.groupName
      }
      
      this.uploading = true
      this.uploadError = null
      this.errorType = null
      this.canRetry = true
      this.uploadComplete = false

      // Calculate total size for all files
      let totalSize = 0
      for (let file of files) {
        totalSize += file.size
      }

      // Initialize progress display
      this.uploadProgress.total = this.formatBytes(totalSize)
      this.uploadProgress.loaded = "0 MB"
      this.uploadProgress.speed = "0"
      this.uploadProgress.percentage = 0

      try {
        // Call parent component's upload handler and wait for result
        const result = await new Promise((resolve, reject) => {
          this.$emit('upload-file', files, this.token, isGroupUpload, this.groupName, (progress) => {
            this.uploadProgress.percentage = progress.percentage
            this.uploadProgress.loaded = this.formatBytes(progress.loaded)
            this.uploadProgress.total = this.formatBytes(progress.total)
            
            // Calculate speed (simplified)
            if (progress.percentage > 0) {
              const timeElapsed = Date.now() - this.uploadStartTime
              const speedBytesPerSecond = progress.loaded / (timeElapsed / 1000)
              const speedMBPerSecond = speedBytesPerSecond / (1024 * 1024)
              this.uploadProgress.speed = speedMBPerSecond.toFixed(2)
            }
          }, resolve, reject)
        })

        this.uploadResult = result
        this.uploadComplete = true
        this.$emit('upload-success')
        
        // Reset upload type and group name after successful upload
        this.uploadType = 'individual'
        this.groupName = ''
        this.lastUploadedFiles = null
        this.lastUploadConfig = null
      } catch (error) {
        this.uploadError = error.error || 'Upload failed'
        this.errorType = error.errorType || 'generic'
        this.canRetry = error.canRetry !== false // Default to true unless explicitly false
        console.error('Upload failed:', error)
      } finally {
        this.uploading = false
        this.pendingFiles = null
      }
    },

    formatBytes(bytes) {
      if (bytes === 0) return "0 B"
      const units = ["B", "kB", "MB", "GB", "TB"]
      const threshold = 1024
      let unitIndex = 0
      let size = bytes

      while (size >= threshold && unitIndex < units.length - 1) {
        size /= threshold
        unitIndex++
      }

      return `${size.toFixed(1)} ${units[unitIndex]}`
    },

    async copyCode() {
      try {
        await navigator.clipboard.writeText(this.uploadResult.code)
        this.showCopyFeedback('Code copied!')
      } catch (err) {
        console.error("Failed to copy:", err)
      }
    },

    async copyLink() {
      try {
        await navigator.clipboard.writeText(this.fullUrl)
        this.showCopyFeedback('Link copied!')
      } catch (err) {
        console.error("Failed to copy:", err)
      }
    },

    async copyGroupCode() {
      try {
        await navigator.clipboard.writeText(this.uploadResult.group.id)
        this.showCopyFeedback('Group code copied!')
      } catch (err) {
        console.error("Failed to copy:", err)
      }
    },

    async copyGroupLink() {
      try {
        await navigator.clipboard.writeText(this.groupUrl)
        this.showCopyFeedback('Group link copied!')
      } catch (err) {
        console.error("Failed to copy:", err)
      }
    },

    showCopyFeedback(message) {
      this.copyTooltip = message
      setTimeout(() => {
        this.copyTooltip = 'Click to copy'
      }, 2000)
    },

    handleCreateGroup(groupName) {
      this.uploadType = 'group'
      this.groupName = groupName
      this.showGroupChoiceModal = false
      
      // Proceed with upload using pending files
      if (this.pendingFiles) {
        this.handleFiles(this.pendingFiles)
      }
    },

    handleUploadIndividually() {
      this.uploadType = 'individual'
      this.showGroupChoiceModal = false
      
      // Proceed with upload using pending files
      if (this.pendingFiles) {
        this.handleFiles(this.pendingFiles)
      }
    },

    retryUpload() {
      if (this.lastUploadedFiles && this.lastUploadConfig) {
        // Restore the upload configuration
        if (this.lastUploadConfig.isGroupUpload) {
          this.uploadType = 'group'
          this.groupName = this.lastUploadConfig.groupName
        } else {
          this.uploadType = 'individual'
        }
        
        // Retry the upload with the same files
        this.handleFiles(this.lastUploadedFiles)
      }
    },

    resetUpload() {
      this.uploadError = null
      this.errorType = null
      this.canRetry = true
      this.uploadComplete = false
      this.uploadResult = null
      this.lastUploadedFiles = null
      this.lastUploadConfig = null
      this.uploadType = 'individual'
      this.groupName = ''
      this.uploadProgress = {
        percentage: 0,
        speed: '0',
        loaded: '0 MB',
        total: '0 MB'
      }
    }
  },
  watch: {
    visible(newVal) {
      if (!newVal) {
        // Reset state when modal is closed
        this.uploading = false
        this.uploadComplete = false
        this.uploadError = null
        this.errorType = null
        this.canRetry = true
        this.uploadResult = null
        this.showGroupChoiceModal = false
        this.pendingFiles = null
        this.uploadType = null // Reset to null to allow group choice
        this.groupName = ''
        this.lastUploadedFiles = null
        this.lastUploadConfig = null
        this.uploadProgress = {
          percentage: 0,
          speed: '0',
          loaded: '0 MB',
          total: '0 MB'
        }
      } else {
        this.uploadStartTime = Date.now()
      }
    }
  }
}
</script>
