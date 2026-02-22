// File management composable for upload, download, and quota operations
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
      quotaInfo.value.text = "? MB of ? MB"
      quotaInfo.value.percentage = 100
      quotaInfo.value.used = 0
      quotaInfo.value.total = 0
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

  const deleteFile = async (code, token, deleteSubItems = false) => {
    try {
      const url = deleteSubItems ? `/delete/${code}?deleteSubItems=true` : `/delete/${code}`
      const response = await fetch(url, {
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
      
      console.log('Files received:', files)
      console.log('Files type:', typeof files)
      console.log('Files length:', files.length)
      if (files.length > 0) {
        console.log('First file:', files[0])
        console.log('First file type:', files[0] instanceof File)
        console.log('First file name:', files[0].name)
        console.log('First file size:', files[0].size)
      }
      
      // Determine the upload type and endpoint
      let endpoint = '/upload'
      let isMultipleIndividualUpload = false
      
      if (isGroupUpload && files.length > 0) {
        console.log('Group upload - files to upload:', files.length)
        for (let i = 0; i < files.length; i++) {
          console.log(`Appending file ${i}:`, files[i])
          formData.append("files", files[i])
        }
        formData.append("groupName", groupName)
        formData.append("createGroup", "true")
        endpoint = '/upload-group'
      } else if (files.length > 1) {
        // Multiple files uploaded individually - use new endpoint
        console.log('Multiple individual upload - files to upload:', files.length)
        for (let i = 0; i < files.length; i++) {
          console.log(`Appending file ${i}:`, files[i])
          formData.append("files", files[i])
        }
        endpoint = '/upload-multiple-individual'
        isMultipleIndividualUpload = true
      } else {
        // Single file upload
        const file = files[0]
        console.log('Appending file to formData:', file)
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
          } else if (isMultipleIndividualUpload) {
            resolve({ 
              success: true, 
              files: response.files,
              multipleIndividual: true
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
      
      xhr.open('POST', endpoint)
      xhr.setRequestHeader('Authorization', token)
      
      console.log('Upload request:', {
        endpoint,
        token: token ? 'present' : 'missing',
        isGroupUpload,
        isMultipleIndividualUpload,
        filesCount: files.length,
        formDataEntries: Array.from(formData.entries())
      })
      
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
