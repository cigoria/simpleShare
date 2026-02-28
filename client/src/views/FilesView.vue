<template>
  <div class="w-full h-full pt-[100px] mobile:pt-[80px] overflow-y-auto p-6">
    <div class="w-full max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-white">All Files Management</h2>
        <div class="flex items-center gap-4">
          <div class="relative">
            <span class="material-icons-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">search</span>
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Search files..." 
              class="pl-10 pr-4 py-2 bg-black/30 border border-[#444] rounded-lg text-white focus:border-primary-button focus:outline-none w-64">
          </div>
          <select 
            v-model="sortBy"
            class="bg-black/30 border border-[#444] text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary-button">
            <option value="date">Sort by Date</option>
            <option value="size">Sort by Size</option>
            <option value="name">Sort by Name</option>
            <option value="code">Sort by Code</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="flex justify-center items-center py-12">
        <span class="material-icons-outlined animate-spin-slow text-4xl text-primary-button">hourglass_empty</span>
      </div>

      <div v-else-if="error" class="bg-error/20 border border-error rounded-lg p-4 text-error text-center">
        {{ error }}
      </div>

      <div v-else class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-black/30">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Code</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Filename</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Owner</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Size</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Date</th>
                <th class="px-4 py-3 text-center text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="file in filteredFiles" 
                :key="file.id"
                class="border-b border-[#444] hover:bg-black/20 transition-colors">
                <td class="px-4 py-3 text-sm font-mono">{{ file.code }}</td>
                <td class="px-4 py-3 text-sm">{{ file.name }}</td>
                <td class="px-4 py-3 text-sm">{{ file.username }}</td>
                <td class="px-4 py-3 text-sm">{{ file.sizeFormatted }}</td>
                <td class="px-4 py-3 text-sm">{{ file.dateFormatted }}</td>
                <td class="px-4 py-3 text-sm text-center">
                  <div class="flex items-center justify-center gap-2">
                    <button 
                      @click="downloadFile(file.code)"
                      class="bg-secondary-button text-black px-3 py-1 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1">
                      <span class="material-icons-outlined text-sm">download</span>
                      Download
                    </button>
                    <button 
                      @click="handleDeleteFile(file)"
                      class="bg-error text-white px-3 py-1 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1">
                      <span class="material-icons-outlined text-sm">delete</span>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="filteredFiles.length === 0" class="text-center py-8 text-gray-400">
            No files found
          </div>
        </div>
      </div>

      <!-- Statistics -->
      <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] p-4">
          <div class="flex items-center gap-3">
            <span class="material-icons-outlined text-2xl text-primary-button">insert_drive_file</span>
            <div>
              <p class="text-sm text-gray-400">Total Files</p>
              <p class="text-xl font-bold text-white">{{ allFiles.length }}</p>
            </div>
          </div>
        </div>
        <div class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] p-4">
          <div class="flex items-center gap-3">
            <span class="material-icons-outlined text-2xl text-secondary-button">storage</span>
            <div>
              <p class="text-sm text-gray-400">Total Size</p>
              <p class="text-xl font-bold text-white">{{ totalSize }}</p>
            </div>
          </div>
        </div>
        <div class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] p-4">
          <div class="flex items-center gap-3">
            <span class="material-icons-outlined text-2xl text-ok">people</span>
            <div>
              <p class="text-sm text-gray-400">Unique Uploaders</p>
              <p class="text-xl font-bold text-white">{{ uniqueUploaders }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useAdmin } from '../composables/useAdmin.js'
import { useNotification } from '../composables/useNotification.js'

export default {
  name: 'FilesView',
  props: {
    token: String
  },
  setup(props) {
    const { 
      allFiles, 
      loading, 
      error, 
      loadAllFiles, 
      deleteFile,
      formatBytes
    } = useAdmin()
    
    const { showNotification } = useNotification()

    const searchQuery = ref('')
    const sortBy = ref('date')

    const filteredFiles = computed(() => {
      let filtered = allFiles.value

      // Apply search filter
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(file => 
          file.name.toLowerCase().includes(query) ||
          file.code.toLowerCase().includes(query) ||
          file.username.toLowerCase().includes(query)
        )
      }

      // Apply sorting
      filtered.sort((a, b) => {
        switch (sortBy.value) {
          case 'date':
            return new Date(b.date) - new Date(a.date)
          case 'size':
            return b.size - a.size
          case 'name':
            return a.name.localeCompare(b.name)
          case 'code':
            return a.code.localeCompare(b.code)
          default:
            return 0
        }
      })

      return filtered
    })

    const totalSize = computed(() => {
      const total = allFiles.value.reduce((sum, file) => sum + file.size, 0)
      return formatBytes(total)
    })

    const uniqueUploaders = computed(() => {
      const uploaders = new Set(allFiles.value.map(file => file.username))
      return uploaders.size
    })

    const handleDeleteFile = async (file) => {
      if (confirm(`Are you sure you want to delete file "${file.name}"?`)) {
        const result = await deleteFile(props.token, file.code)
        if (result.success) {
          showNotification('File deleted successfully!', 'ok')
          await loadAllFiles(props.token)
        } else {
          showNotification('Failed to delete file: ' + result.error, 'error')
        }
      }
    }

    const downloadFile = (code) => {
      const link = document.createElement("a")
      link.href = "/files/" + code
      link.style.display = "none"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      showNotification('Download started!', 'info')
    }

    onMounted(() => {
      loadAllFiles(props.token)
    })

    return {
      allFiles,
      loading,
      error,
      searchQuery,
      sortBy,
      filteredFiles,
      totalSize,
      uniqueUploaders,
      handleDeleteFile,
      downloadFile
    }
  }
}
</script>
