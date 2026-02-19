<template>
  <div 
    v-if="visible"
    class="flex justify-center items-center w-full h-full absolute top-0 left-0 bg-transparent background"
    @click="$emit('close')">
    <div
      class="z-10 bg-black/20 backdrop-blur-[20px] absolute h-[calc(100vh-20vh)] mobile:h-[calc(100vh-10vh)] w-[calc(100vw-30vw)] mobile:w-[calc(100vw-5vw)] flex items-center justify-center m-[100px_auto] mobile:m-[50px_auto] mobile:mx-4 rounded-[28px] mobile:rounded-[20px] border-3 border-[#a1a1a1] transition-all duration-300 modal animate-scale-in"
      @click.stop>
      <button
        class="absolute top-2 mobile:top-2 right-2 mobile:right-2 bg-primary-button text-black border-none w-[42px] mobile:w-[36px] h-[42px] mobile:h-[36px] rounded-lg text-lg mobile:text-base cursor-pointer tracking-[1px] text-center z-20 close-btn flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-primary-button/50"
        @click="$emit('close')">
        <span class="material-icons-outlined mobile:text-sm">close</span>
      </button>
      <div
        class="w-full h-full p-4 mobile:p-2 pt-12 mobile:pt-10 rounded-[28px] mobile:rounded-[20px] border border-[#444] bg-black/10 overflow-hidden">
        <div class="flex h-full relative">
          <div class="flex-1 overflow-x-auto overflow-y-auto">
            <table class="w-full border-collapse">
              <thead class="sticky top-0 bg-black/20 z-10">
                <tr>
                  <th class="px-2 mobile:px-1 py-2 mobile:py-1 text-left border-b border-[#444] text-sm mobile:text-xs">
                    Code
                  </th>
                  <th
                    class="px-2 mobile:px-1 py-2 mobile:py-1 text-left border-b border-[#444] min-w-[150px] mobile:min-w-[100px] text-sm mobile:text-xs">
                    Filename
                  </th>
                  <th
                    class="px-2 mobile:px-1 py-2 mobile:py-1 text-center border-b border-[#444] w-[60px] mobile:w-[50px] text-sm mobile:text-xs">
                    Date
                  </th>
                  <th
                    class="px-2 mobile:px-1 py-2 mobile:py-1 text-center border-b border-[#444] w-[60px] mobile:w-[50px] text-sm mobile:text-xs">
                    Size
                  </th>
                  <th
                    class="px-2 mobile:px-1 py-2 mobile:py-1 text-center border-b border-[#444] w-[80px] mobile:w-[60px] text-sm mobile:text-xs">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="file in files" 
                  :key="file.code"
                  class="border-b border-[#444] hover:bg-black/20 h-[50px]">
                  <td class="px-4 py-2 align-middle whitespace-nowrap">{{ file.code }}</td>
                  <td class="px-4 py-2 align-middle min-w-[200px]">{{ file.name }}</td>
                  <td class="px-4 py-2 align-middle whitespace-nowrap">{{ file.formattedDate }}</td>
                  <td class="px-4 py-2 align-middle whitespace-nowrap">{{ file.formattedSize }}</td>
                  <td class="px-2 py-2 text-center align-middle">
                    <div class="flex justify-center gap-2">
                      <button 
                        class="download-button bg-secondary-button text-black p-2 rounded-lg hover:opacity-80 transition-opacity w-10 h-10 flex items-center justify-center" 
                        @click="$emit('download', file.code)" 
                        title="Download">
                        <span class="material-icons-outlined text-lg">download</span>
                      </button>
                      <button 
                        class="delete-button bg-error text-black p-2 rounded-lg hover:opacity-80 transition-opacity w-10 h-10 flex items-center justify-center" 
                        @click="handleDelete(file.code)" 
                        title="Delete">
                        <span class="material-icons-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="files.length === 0" class="text-center py-8 text-gray-400">
              No files found
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MyFilesModal',
  props: {
    visible: Boolean,
    files: Array,
    token: String
  },
  emits: ['close', 'download', 'delete'],
  methods: {
    async handleDelete(code) {
      if (confirm('Are you sure you want to delete this file?')) {
        const result = await this.$emit('delete', code)
        if (result && result.success) {
          // File deleted successfully, parent will update the files list
        } else {
          alert('Failed to delete file: ' + (result?.error || 'Unknown error'))
        }
      }
    }
  }
}
</script>
