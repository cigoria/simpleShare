<template>
  <div 
    v-if="visible"
    class="flex justify-center items-center w-full h-full absolute top-0 left-0 bg-transparent background cursor-pointer"
    @click="$emit('close')">
    <div
      class="z-[80] bg-black/20 backdrop-blur-[20px] absolute h-[calc(100vh-30vh)] mobile:h-[calc(100vh-20vh)] w-[calc(100vw-40vw)] mobile:w-[calc(100vw-10vw)] flex items-center justify-center m-[100px_auto] mobile:m-[50px_auto] mobile:mx-4 rounded-[28px] mobile:rounded-[20px] border-3 border-[#a1a1a1] transition-all duration-300 modal animate-scale-in"
      @click.stop>
      <div class="text-center p-8 mobile:p-6">
        <h3 class="text-2xl mobile:text-xl font-semibold mb-4">
          Upload Multiple Files
        </h3>
        <p class="text-gray-300 mb-6 mobile:mb-4">
          You selected multiple files. Would you like to create a group?
        </p>
        
        <div class="space-y-4 mobile:space-y-3">
          <button 
            @click="showGroupNameInput"
            class="w-full bg-primary-button text-black px-6 py-3 mobile:py-2 rounded-lg font-medium hover:scale-105 transition-transform">
            <span class="material-icons align-middle mr-2">folder</span>
            Create Group
          </button>
          
          <div v-if="showGroupInput" class="space-y-4 mobile:space-y-3">
            <input 
              v-model="groupName"
              type="text" 
              placeholder="Enter group name..." 
              class="w-full px-4 py-2 mobile:py-1 bg-black/20 border border-[#444] rounded-lg text-white placeholder-gray-400 text-sm mobile:text-xs focus:outline-none focus:border-primary-button transition-colors">
            <button 
              @click="confirmGroup"
              class="w-full bg-secondary-button text-black px-6 py-3 mobile:py-2 rounded-lg font-medium hover:scale-105 transition-transform">
              <span class="material-icons align-middle mr-2">check</span>
              Create Group & Upload
            </button>
          </div>
          
          <button 
            @click="uploadIndividually"
            class="w-full bg-gray-600 text-white px-6 py-3 mobile:py-2 rounded-lg font-medium hover:scale-105 transition-transform">
            <span class="material-icons align-middle mr-2">upload_file</span>
            Upload Individually
          </button>
          
          <button 
            @click="$emit('close')"
            class="w-full bg-gray-700 text-white px-6 py-3 mobile:py-2 rounded-lg font-medium hover:scale-105 transition-transform">
            <span class="material-icons align-middle mr-2">close</span>
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useConfirm } from '../composables/useConfirm.js'

export default {
  name: 'GroupChoiceModal',
  props: {
    visible: Boolean
  },
  emits: ['close', 'create-group', 'upload-individually'],
  setup() {
    const { confirmWarning } = useConfirm()
    
    return {
      confirmWarning
    }
  },
  data() {
    return {
      showGroupInput: false,
      groupName: ''
    }
  },
  methods: {
    async showGroupNameInput() {
      this.showGroupInput = true
    },
    
    async confirmGroup() {
      if (!this.groupName.trim()) {
        try {
          await this.confirmWarning('Please enter a group name')
        } catch {
          // User cancelled, do nothing
        }
        return
      }
      
      this.$emit('create-group', this.groupName.trim())
      this.resetModal()
    },
    
    uploadIndividually() {
      this.$emit('upload-individually')
      this.resetModal()
    },
    
    resetModal() {
      this.showGroupInput = false
      this.groupName = ''
    }
  },
  watch: {
    visible(newVal) {
      if (!newVal) {
        this.resetModal()
      }
    }
  }
}
</script>
