import { ref } from 'vue'

export function useAdmin() {
  const users = ref([])
  const allFiles = ref([])
  const globalStorage = ref({
    totalUsers: 0,
    totalFiles: 0,
    totalStorage: 0,
    totalStorageFormatted: '0 B'
  })
  const databaseTables = ref([])
  const currentTable = ref('')
  const tableData = ref([])
  const loading = ref(false)
  const error = ref('')

  const formatBytes = (bytes) => {
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
  }

  const verifyAdminAccess = async (token) => {
    try {
      const response = await fetch("/verifySession", {
        method: "GET",
        headers: {
          "Authorization": token,
        },
      })

      if (!response.ok) {
        throw new Error("Authentication failed")
      }

      const data = await response.json()
      if (data.permission !== "admin") {
        throw new Error("Not an admin")
      }

      return true
    } catch (error) {
      console.error("Admin verification failed:", error)
      return false
    }
  }

  const loadUsers = async (token) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await fetch("/admin/getAllUsersWithFiles", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: token
        }
      })

      if (!response.ok) {
        throw new Error("Failed to load users")
      }

      const data = await response.json()
      users.value = data.map(user => ({
        ...user,
        quotaFormatted: formatBytes(user.quota),
        files: user.files.map(file => ({
          ...file,
          sizeFormatted: formatBytes(file.size),
          dateFormatted: new Date(file.date).toLocaleDateString("hu-HU", {
            year: "2-digit",
            month: "2-digit",
            day: "2-digit",
          }) + " " + new Date(file.date).toLocaleTimeString("hu-HU", {
            hour: "2-digit",
            minute: "2-digit",
          })
        }))
      }))
    } catch (error) {
      error.value = error.message
    } finally {
      loading.value = false
    }
  }

  const loadAllFiles = async (token) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await fetch("/admin/getAllFiles", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: token
        }
      })

      if (!response.ok) {
        throw new Error("Failed to load files")
      }

      const data = await response.json()
      allFiles.value = data.map(file => ({
        ...file,
        sizeFormatted: formatBytes(file.size),
        dateFormatted: new Date(file.date).toLocaleDateString("hu-HU", {
          year: "2-digit",
          month: "2-digit",
          day: "2-digit",
        }) + " " + new Date(file.date).toLocaleTimeString("hu-HU", {
          hour: "2-digit",
          minute: "2-digit",
        })
      }))
    } catch (error) {
      error.value = error.message
    } finally {
      loading.value = false
    }
  }

  const loadGlobalStorage = async (token) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await fetch("/admin/getGlobalStorage", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: token
        }
      })

      if (!response.ok) {
        throw new Error("Failed to load global storage")
      }

      const data = await response.json()
      globalStorage.value = {
        totalUsers: data.totalUsers || 0,
        totalFiles: data.totalFiles || 0,
        totalStorage: data.totalStorage || 0,
        totalStorageFormatted: formatBytes(data.totalStorage || 0)
      }
    } catch (error) {
      error.value = error.message
    } finally {
      loading.value = false
    }
  }

  const loadTables = async (token) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await fetch("/admin/getTables", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: token
        }
      })

      if (!response.ok) {
        throw new Error("Failed to load tables")
      }

      const data = await response.json()
      databaseTables.value = data.tables || []
    } catch (error) {
      error.value = error.message
    } finally {
      loading.value = false
    }
  }

  const loadTableData = async (token, tableName) => {
    if (!tableName) return
    
    loading.value = true
    error.value = ''
    
    try {
      const response = await fetch(`/admin/getTableData/${tableName}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: token
        }
      })

      if (!response.ok) {
        throw new Error("Failed to load table data")
      }

      const data = await response.json()
      tableData.value = data.data || []
    } catch (error) {
      error.value = error.message
    } finally {
      loading.value = false
    }
  }

  const saveTableData = async (token, tableName, data) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await fetch(`/admin/saveTableData/${tableName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          Authorization: token
        },
        body: JSON.stringify({ data })
      })

      if (!response.ok) {
        throw new Error("Failed to save table data")
      }

      return { success: true }
    } catch (error) {
      error.value = error.message
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  const deleteTableRow = async (token, tableName, rowId) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await fetch(`/admin/deleteTableRow/${tableName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          Authorization: token
        },
        body: JSON.stringify({ id: rowId })
      })

      if (!response.ok) {
        throw new Error("Failed to delete row")
      }

      return { success: true }
    } catch (error) {
      error.value = error.message
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  const deleteUser = async (token, userId) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await fetch(`/admin/deleteUser/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: token
        }
      })

      if (!response.ok) {
        throw new Error("Failed to delete user")
      }

      return { success: true }
    } catch (error) {
      error.value = error.message
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  const deleteFile = async (token, fileCode) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await fetch(`/admin/deleteFile/${fileCode}`, {
        method: "DELETE",
        headers: {
          Authorization: token
        }
      })

      if (!response.ok) {
        throw new Error("Failed to delete file")
      }

      return { success: true }
    } catch (error) {
      error.value = error.message
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  return {
    users,
    allFiles,
    globalStorage,
    databaseTables,
    currentTable,
    tableData,
    loading,
    error,
    formatBytes,
    verifyAdminAccess,
    loadUsers,
    loadAllFiles,
    loadGlobalStorage,
    loadTables,
    loadTableData,
    saveTableData,
    deleteTableRow,
    deleteUser,
    deleteFile
  }
}
