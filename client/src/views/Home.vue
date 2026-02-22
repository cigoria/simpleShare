<template>
  <div>
    <Header 
      :is-authenticated="isAuthenticated"
      :quota-info="quotaInfo"
      @show-login="showLoginModal = true"
      @show-upload="showUploadModal = true"
      @toggle-hamburger="showHamburgerMenu = !showHamburgerMenu" />

    <DownloadForm 
      @check-file="checkFileExists"
      @download="downloadFile" />

    <LoginModal 
      :visible="showLoginModal"
      @close="showLoginModal = false"
      @login="handleLogin" />

    <UploadModal 
      :visible="showUploadModal"
      :token="sessionToken"
      @close="showUploadModal = false"
      @upload-file="handleFileUpload"
      @upload-success="handleUploadSuccess"
      @show-my-files="handleShowMyFiles" />

    <HamburgerMenu 
      :visible="showHamburgerMenu"
      :access-level="accessLevel"
      @close="showHamburgerMenu = false"
      @show-register="showRegisterModal = true"
      @show-my-files="showMyFilesModal = true"
      @show-change-password="showChangePasswordModal = true"
      @logout="handleLogout" />

    <MyFilesModal 
      :visible="showMyFilesModal"
      :files="files"
      :token="sessionToken"
      @close="showMyFilesModal = false"
      @download="downloadFile"
      @download-group="downloadGroup"
      @delete="handleDeleteFile" />

    <ChangePasswordModal 
      :visible="showChangePasswordModal"
      :token="sessionToken"
      @close="showChangePasswordModal = false"
      @change-password="handleChangePassword" />

    <RegisterUserModal 
      :visible="showRegisterModal"
      :token="sessionToken"
      @close="showRegisterModal = false"
      @register="handleRegisterUser" />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { useFiles } from '../composables/useFiles.js'
import { useNotification } from '../composables/useNotification.js'
import Header from '../components/Header.vue'
import DownloadForm from '../components/DownloadForm.vue'
import LoginModal from '../components/LoginModal.vue'
import UploadModal from '../components/UploadModal.vue'
import HamburgerMenu from '../components/HamburgerMenu.vue'
import MyFilesModal from '../components/MyFilesModal.vue'
import ChangePasswordModal from '../components/ChangePasswordModal.vue'
import RegisterUserModal from '../components/RegisterUserModal.vue'

export default {
  name: 'Home',
  components: {
    Header,
    DownloadForm,
    LoginModal,
    UploadModal,
    HamburgerMenu,
    MyFilesModal,
    ChangePasswordModal,
    RegisterUserModal
  },
  setup() {
    const { 
      sessionToken, 
      isAuthenticated, 
      accessLevel, 
      verifyAccessToken, 
      login, 
      logout 
    } = useAuth()
    
    const { 
      quotaInfo, 
      files, 
      updateQuotaDisplay, 
      updateFilesDisplay, 
      checkFileExists: checkFile, 
      downloadFile: download, 
      downloadGroup: downloadGroupFunc,
      deleteFile: deleteFileFunc, 
      uploadFile: upload 
    } = useFiles()
    
    const { showNotification } = useNotification()

    const showLoginModal = ref(false)
    const showUploadModal = ref(false)
    const showHamburgerMenu = ref(false)
    const showMyFilesModal = ref(false)
    const showChangePasswordModal = ref(false)
    const showRegisterModal = ref(false)

    onMounted(async () => {
      await verifyAccessToken()
      if (isAuthenticated.value) {
        await updateQuotaDisplay(sessionToken.value)
        await updateFilesDisplay(sessionToken.value)
      }
    })

    const handleLogin = async (username, password, callback) => {
      const result = await login(username, password)
      if (callback) {
        callback(result)
      }
      
      if (result && result.success) {
        showNotification('Login successful!', 'ok')
        await updateQuotaDisplay(token)
        await updateFilesDisplay(token)
      }
      
      return result
    }

    const handleLogout = async () => {
      await logout()
      showHamburgerMenu.value = false
      showNotification('Logout successful!', 'ok')
    }

    const handleFileUpload = async (files, token, isGroupUpload = false, groupName = '', onProgress, resolve, reject) => {
      try {
        const result = await upload(files, token, isGroupUpload, groupName, onProgress)
        if (result.success) {
          await updateQuotaDisplay(token)
          await updateFilesDisplay(token)
          
          // Show success notification with file count
          const fileCount = files.length
          let successMessage = 'File uploaded successfully!'
          if (fileCount > 1) {
            if (isGroupUpload) {
              successMessage = `${fileCount} files uploaded as group successfully!`
            } else {
              successMessage = `${fileCount} files uploaded successfully!`
            }
          }
          showNotification(successMessage, 'ok')
        } else {
          showNotification(result.error || 'Upload failed!', 'error')
        }
        resolve(result)
      } catch (error) {
        // Enhanced error notification with specific suggestions
        let errorMessage = error.error || 'Upload failed!'
        let notificationType = 'error'
        
        // Add specific guidance based on error type
        if (error.errorType === 'quota_exceeded') {
          errorMessage += ' Consider deleting old files to free up space.'
        } else if (error.errorType === 'auth_error') {
          errorMessage += ' Please log in again.'
        } else if (error.errorType === 'network_error' || error.errorType === 'timeout') {
          errorMessage += ' Check your internet connection and try again.'
        }
        
        showNotification(errorMessage, notificationType)
        reject(error)
      }
    }

    const handleUploadSuccess = () => {
    }

    const handleShowMyFiles = () => {
      showUploadModal.value = false
      showMyFilesModal.value = true
    }

    const handleDeleteFile = async (code, action = null) => {
      // For groups, action will be 'confirm' (delete group only) or 'secondary' (delete group and files)
      // For files, action will be null
      const deleteSubItems = action === 'secondary'
      const result = await deleteFileFunc(code, sessionToken.value, deleteSubItems)
      if (result.success) {
        await updateFilesDisplay(sessionToken.value)
        await updateQuotaDisplay(sessionToken.value)
        showNotification('Item deleted successfully!', 'ok')
      } else {
        showNotification('Delete failed!', 'error')
      }
      return result
    }

    const handleChangePassword = async (oldPassword, newPassword, callback) => {
      try {
        const response = await fetch("/changePassword", {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=UTF-8",
            "Authorization": sessionToken.value
          },
          body: JSON.stringify({
            old_password: oldPassword,
            new_password: newPassword
          }),
        })

        let result
        if (response.ok) {
          showNotification('Password changed successfully!', 'ok')
          result = { success: true }
          window.location.reload()
        } else {
          const error = await response.json()
          showNotification(error.message || "Password change failed", 'error')
          result = { success: false, error: error.message || "Password change failed" }
        }

        // Call the callback with the result
        if (callback) {
          callback(result)
        }
        
        return result
      } catch (error) {
        console.error("Password change error:", error)
        showNotification("Network error", 'error')
        const result = { success: false, error: "Network error" }
        if (callback) {
          callback(result)
        }
        return result
      }
    }

    const handleRegisterUser = async (userData, callback) => {
      try {
        const response = await fetch("/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=UTF-8",
            "Authorization": sessionToken.value
          },
          body: JSON.stringify(userData),
        })

        let result
        if (response.ok) {
          showNotification('User registered successfully!', 'ok')
          result = { success: true }
        } else {
          const error = await response.json()
          showNotification(error.error || "Registration failed", 'error')
          result = { success: false, error: error.error || "Registration failed" }
        }

        if (callback) {
          callback(result)
        }
        
        return result
      } catch (error) {
        console.error("Registration error:", error)
        showNotification("Network error", 'error')
        const result = { success: false, error: "Network error" }
        if (callback) {
          callback(result)
        }
        return result
      }
    }

    const checkFileExists = async (code, callback) => {
      const result = await checkFile(code)
      if (callback) callback(result)
      return result
    }

    const downloadFile = (code) => {
      download(code)
    }

    const downloadGroup = (code) => {
      downloadGroupFunc(code)
    }

    return {
      // Auth
      sessionToken,
      isAuthenticated,
      accessLevel,
      
      // Files
      quotaInfo,
      files,
      
      // Modal states
      showLoginModal,
      showUploadModal,
      showHamburgerMenu,
      showMyFilesModal,
      showChangePasswordModal,
      showRegisterModal,
      
      // Event handlers
      handleLogin,
      handleLogout,
      handleFileUpload,
      handleUploadSuccess,
      handleShowMyFiles,
      handleDeleteFile,
      handleChangePassword,
      handleRegisterUser,
      checkFileExists,
      downloadFile,
      downloadGroup
    }
  }
}
</script>
