import { ref } from 'vue'

export function useFiles() {
  const quotaInfo = ref({
    used: 0,
    total: 0,
    percentage: 0,
    text: ''
  })
  const files = ref([])
  const uploading = ref(false)
  const uploadProgress = ref(0)

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

  const updateQuotaDisplay = async (token) => {
    try {
      const response = await fetch("/quota", {
        method: "GET",
        headers: {
          "Authorization": token,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.total !== 0) {
        quotaInfo.value.text = formatBytes(data.used) + " of " + formatBytes(data.total)
        quotaInfo.value.percentage = Math.floor((data.used / data.total) * 100)
      } else {
        quotaInfo.value.text = formatBytes(data.used) + " of unlimited"
        quotaInfo.value.percentage = 0
      }
      
      quotaInfo.value.used = data.used
      quotaInfo.value.total = data.total
    } catch (error) {
      // Fallback display when quota endpoint fails or doesn't exist
      quotaInfo.value.text = "? MB of ? MB"
      quotaInfo.value.percentage = 100
      quotaInfo.value.used = 0
      quotaInfo.value.total = 0
      // Only log error if it's not a 404 (expected when quota endpoint doesn't exist)
      if (!error.message.includes('404')) {
        console.error("Failed to fetch quota:", error)
      }
    }
  }

  const updateFilesDisplay = async (token) => {
    try {
      const response = await fetch("/getAllFiles", {
        method: "GET",
        headers: {
          "Authorization": token,
        },
      })

      const result = await response.json()
      files.value = result.map(item => {
        if (item.type === "group") {
          // Handle group items
          return {
            code: item.code,
            name: item.name,
            date: new Date(item.create_date),
            size: item.files.reduce((total, file) => total + file.size, 0),
            formattedSize: formatBytes(item.files.reduce((total, file) => total + file.size, 0)),
            formattedDate: new Date(item.create_date).toLocaleDateString("hu-HU", {
              year: "2-digit",
              month: "2-digit",
              day: "2-digit",
            }) + " " + new Date(item.create_date).toLocaleTimeString("hu-HU", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            type: "group",
            files: item.files,
            fileCount: item.files.length
          }
        } else {
          // Handle individual files
          let decodedName = item.original_name
          try {
            decodedName = decodeURIComponent(escape(item.original_name))
          } catch (e) {
            decodedName = item.original_name
          }

          return {
            code: item.code,
            name: decodedName,
            date: new Date(item.upload_date),
            size: item.size,
            formattedSize: formatBytes(item.size),
            formattedDate: new Date(item.upload_date).toLocaleDateString("hu-HU", {
              year: "2-digit",
              month: "2-digit",
              day: "2-digit",
            }) + " " + new Date(item.upload_date).toLocaleTimeString("hu-HU", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            type: "file"
          }
        }
      })
    } catch (error) {
      console.error("Failed to fetch files:", error)
    }
  }

  const checkFileExists = async (code) => {
    try {
      const response = await fetch("/checkFile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify({ code }),
      })

      if (response.ok) {
        const result = await response.json()
        return result
      }
      return { exists: false }
    } catch (error) {
      console.error("Error checking file:", error)
      return { exists: false }
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

  const deleteFile = async (code, token) => {
    try {
      const response = await fetch("/delete/" + code, {
        method: "GET",
        headers: {
          Authorization: token,
        },
      })

      if (response.status === 200) {
        await updateFilesDisplay(token)
        await updateQuotaDisplay(token)
        return { success: true }
      } else {
        const error = await response.json()
        return { success: false, error: error.message || "Delete failed" }
      }
    } catch (error) {
      console.error("Delete error:", error)
      return { success: false, error: "Network error" }
    }
  }

  const uploadFile = async (files, token, isGroupUpload = false, groupName = '', onProgress) => {
    uploading.value = true
    uploadProgress.value = 0

    return new Promise((resolve, reject) => {
      const formData = new FormData()
      
      if (isGroupUpload && files.length > 0) {
        // Group upload
        for (let file of files) {
          formData.append("files", file)
        }
        formData.append("groupName", groupName)
        formData.append("createGroup", "true")
      } else {
        // Single file upload (backward compatibility)
        const file = Array.isArray(files) ? files[0] : files
        formData.append("file", file)
      }

      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', function(e) {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100)
          uploadProgress.value = percentComplete
          if (onProgress) {
            onProgress({
              percentage: percentComplete,
              loaded: e.loaded,
              total: e.total
            })
          }
        }
      })
      
      xhr.addEventListener('load', function() {
        uploading.value = false
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText)
          
          if (isGroupUpload) {
            resolve({ 
              success: true, 
              group: response.group,
              files: response.files 
            })
          } else {
            resolve({ 
              success: true, 
              code: response.code 
            })
          }
        } else {
          let errorMessage = "Upload failed"
          if (xhr.status === 413) {
            errorMessage = "File too large! You ran out of quota!"
          } else if (xhr.status === 401) {
            errorMessage = "Unauthorized!"
          } else if (xhr.status === 400) {
            errorMessage = "Bad request!"
          } else if (xhr.status === 500) {
            errorMessage = "Internal Server Error!"
          }
          reject({ success: false, error: errorMessage })
        }
      })
      
      xhr.addEventListener('error', function() {
        uploading.value = false
        reject({ success: false, error: "Network error" })
      })
      
      // Use appropriate endpoint
      const endpoint = isGroupUpload ? '/upload-group' : '/upload'
      xhr.open('POST', endpoint)
      xhr.setRequestHeader('Authorization', token)
      xhr.send(formData)
    })
  }

  return {
    quotaInfo,
    files,
    uploading,
    uploadProgress,
    formatBytes,
    updateQuotaDisplay,
    updateFilesDisplay,
    checkFileExists,
    downloadFile,
    deleteFile,
    uploadFile
  }
}
