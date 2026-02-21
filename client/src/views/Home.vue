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
      @upload-success="handleUploadSuccess" />

    <HamburgerMenu 
      :visible="showHamburgerMenu"
      :access-level="accessLevel"
      @close="showHamburgerMenu = false"
      @show-register="showRegisterModal = true"
      @show-my-files="showMyFilesModal = true"
      @show-change-password="showChangePasswordModal = true"
      @logout="handleLogout" />

    <!-- My Files Modal -->
    <MyFilesModal 
      :visible="showMyFilesModal"
      :files="files"
      :token="sessionToken"
      @close="showMyFilesModal = false"
      @download="downloadFile"
      @delete="handleDeleteFile" />

    <!-- Change Password Modal -->
    <ChangePasswordModal 
      :visible="showChangePasswordModal"
      :token="sessionToken"
      @close="showChangePasswordModal = false"
      @change-password="handleChangePassword" />

    <!-- Register User Modal -->
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
      deleteFile: deleteFileFunc, 
      uploadFile: upload 
    } = useFiles()
    
    const { showNotification } = useNotification()

    // Modal states
    const showLoginModal = ref(false)
    const showUploadModal = ref(false)
    const showHamburgerMenu = ref(false)
    const showMyFilesModal = ref(false)
    const showChangePasswordModal = ref(false)
    const showRegisterModal = ref(false)

    // Initialize auth and data
    onMounted(async () => {
      await verifyAccessToken()
      if (isAuthenticated.value) {
        await updateQuotaDisplay(sessionToken.value)
        await updateFilesDisplay(sessionToken.value)
      }
    })

    // Event handlers
    const handleLogin = async (username, password, callback) => {
      const result = await login(username, password)
      if (callback) {
        callback(result)
      }
      
      // Show notification on successful login
      if (result && result.success) {
        showNotification('Login successful!', 'ok')
      }
      
      return result
    }

    const handleLogout = async () => {
      await logout()
      showHamburgerMenu.value = false
      showNotification('Sikeres kijelentkezés!', 'ok')
    }

    const handleFileUpload = async (files, token, isGroupUpload = false, groupName = '', onProgress) => {
      const result = await upload(files, token, isGroupUpload, groupName, onProgress)
      if (result.success) {
        await updateQuotaDisplay(token)
        await updateFilesDisplay(token)
      }
      return result
    }

    const handleUploadSuccess = () => {
      showUploadModal.value = false
    }

    const handleDeleteFile = async (code) => {
      const result = await deleteFileFunc(code, sessionToken.value)
      if (result.success) {
        await updateFilesDisplay(sessionToken.value)
        await updateQuotaDisplay(sessionToken.value)
      }
      return result
    }

    const handleChangePassword = async (oldPassword, newPassword) => {
      try {
        const response = await fetch("/changePassword", {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=UTF-8",
          },
          body: JSON.stringify({
            token: sessionToken.value,
            old_password: oldPassword,
            new_password: newPassword
          }),
        })

        if (response.ok) {
          return { success: true }
        } else {
          const error = await response.json()
          return { success: false, error: error.message || "Password change failed" }
        }
      } catch (error) {
        console.error("Password change error:", error)
        return { success: false, error: "Network error" }
      }
    }

    const handleRegisterUser = async (userData) => {
      try {
        const response = await fetch("/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=UTF-8",
          },
          body: JSON.stringify({
            ...userData,
            token: sessionToken.value
          }),
        })

        if (response.ok) {
          return { success: true }
        } else {
          const error = await response.json()
          return { success: false, error: error.error || "Registration failed" }
        }
      } catch (error) {
        console.error("Registration error:", error)
        return { success: false, error: "Network error" }
      }
    }

    const checkFileExists = async (code) => {
      return await checkFile(code)
    }

    const downloadFile = (code) => {
      download(code)
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
      handleDeleteFile,
      handleChangePassword,
      handleRegisterUser,
      checkFileExists,
      downloadFile
    }
  }
}
</script>
