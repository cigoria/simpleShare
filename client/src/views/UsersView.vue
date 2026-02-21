<template>
  <div class="w-full h-full pt-[100px] mobile:pt-[80px] overflow-y-auto p-6">
    <div class="w-full max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-white">Users Management</h2>
        <div class="flex items-center gap-4">
          <div class="relative">
            <span class="material-icons-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">search</span>
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Search users..." 
              class="pl-10 pr-4 py-2 bg-black/30 border border-[#444] rounded-lg text-white focus:border-primary-button focus:outline-none w-64">
          </div>
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
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">ID</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Username</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Admin</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Quota</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Created</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Files</th>
                <th class="px-4 py-3 text-center text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="user in filteredUsers" 
                :key="user.user_id"
                class="border-b border-[#444] hover:bg-black/20 transition-colors">
                <td class="px-4 py-3 text-sm">{{ user.user_id }}</td>
                <td class="px-4 py-3 text-sm font-medium">{{ user.username }}</td>
                <td class="px-4 py-3 text-sm">
                  <span 
                    :class="[
                      'px-2 py-1 rounded-full text-xs font-medium',
                      user.is_admin 
                        ? 'bg-primary-button/20 text-primary-button' 
                        : 'bg-gray-600/20 text-gray-400'
                    ]">
                    {{ user.is_admin ? 'Admin' : 'User' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm">{{ user.quotaFormatted }}</td>
                <td class="px-4 py-3 text-sm">
                  {{ new Date(user.creation_date).toLocaleDateString() }}
                </td>
                <td class="px-4 py-3 text-sm">
                  <div class="flex items-center gap-2">
                    <span class="text-gray-400">{{ user.files.length }}</span>
                    <button 
                      @click="toggleUserFiles(user.user_id)"
                      class="text-primary-button hover:text-primary-button/80 transition-colors">
                      <span class="material-icons-outlined text-sm">folder_open</span>
                    </button>
                  </div>
                </td>
                <td class="px-4 py-3 text-sm text-center">
                  <button 
                    @click="handleDeleteUser(user)"
                    class="bg-error text-white px-3 py-1 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1 mx-auto">
                    <span class="material-icons-outlined text-sm">delete</span>
                    Delete
                  </button>
                </td>
              </tr>
              <!-- User files expansion -->
              <tr v-if="expandedUsers.includes(user.user_id)">
                <td colspan="7" class="px-4 py-0">
                  <div class="bg-black/10 rounded-lg p-4 mb-2">
                    <h4 class="text-sm font-medium text-gray-300 mb-3">Files for {{ user.username }}</h4>
                    <div class="space-y-2">
                      <div 
                        v-for="file in user.files" 
                        :key="file.id"
                        class="flex items-center justify-between p-2 bg-black/20 rounded">
                        <div class="flex items-center gap-3">
                          <span class="text-xs text-gray-400">{{ file.code }}</span>
                          <span class="text-sm">{{ file.originalname }}</span>
                          <span class="text-xs text-gray-400">{{ file.sizeFormatted }}</span>
                          <span class="text-xs text-gray-400">{{ file.dateFormatted }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                          <button 
                            @click="downloadFile(file.code)"
                            class="text-secondary-button hover:text-secondary-button/80 transition-colors">
                            <span class="material-icons-outlined text-sm">download</span>
                          </button>
                          <button 
                            @click="handleDeleteFile(file)"
                            class="text-error hover:text-error/80 transition-colors">
                            <span class="material-icons-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </div>
                      <div v-if="user.files.length === 0" class="text-center text-gray-500 py-2">
                        No files found
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="filteredUsers.length === 0" class="text-center py-8 text-gray-400">
            No users found
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useAdmin } from '../composables/useAdmin.js'

export default {
  name: 'UsersView',
  props: {
    token: String
  },
  setup(props) {
    const { 
      users, 
      loading, 
      error, 
      loadUsers, 
      deleteUser, 
      deleteFile 
    } = useAdmin()

    const searchQuery = ref('')
    const expandedUsers = ref([])

    const filteredUsers = computed(() => {
      if (!searchQuery.value) return users.value
      
      const query = searchQuery.value.toLowerCase()
      return users.value.filter(user => 
        user.username.toLowerCase().includes(query) ||
        user.user_id.toString().includes(query)
      )
    })

    const toggleUserFiles = (userId) => {
      const index = expandedUsers.value.indexOf(userId)
      if (index > -1) {
        expandedUsers.value.splice(index, 1)
      } else {
        expandedUsers.value.push(userId)
      }
    }

    const handleDeleteUser = async (user) => {
      if (confirm(`Are you sure you want to delete user "${user.username}"? This will also delete all their files.`)) {
        const result = await deleteUser(props.token, user.user_id)
        if (result.success) {
          await loadUsers(props.token)
        } else {
          alert('Failed to delete user: ' + result.error)
        }
      }
    }

    const handleDeleteFile = async (file) => {
      if (confirm(`Are you sure you want to delete file "${file.originalname}"?`)) {
        const result = await deleteFile(props.token, file.code)
        if (result.success) {
          await loadUsers(props.token)
        } else {
          alert('Failed to delete file: ' + result.error)
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
    }

    onMounted(() => {
      loadUsers(props.token)
    })

    return {
      users,
      loading,
      error,
      searchQuery,
      expandedUsers,
      filteredUsers,
      toggleUserFiles,
      handleDeleteUser,
      handleDeleteFile,
      downloadFile
    }
  }
}
</script>
