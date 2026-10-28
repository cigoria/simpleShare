<template>
  <div>
    <Header
      :is-authenticated="isAuthenticated"
      :quota-info="quotaInfo"
      @show-login="showLoginModal = true"
      @show-upload="showUploadModal = true"
      @show-share-link="showLinkShareModal = true"
      @toggle-hamburger="showHamburgerMenu = !showHamburgerMenu"
    />

    <DownloadForm @check-file="checkFileExists" @download="downloadFile" />

    <LoginModal
      :visible="showLoginModal"
      @close="showLoginModal = false"
      @login="handleLogin"
    />

    <UploadModal
      ref="uploadModalRef"
      :visible="showUploadModal"
      :token="sessionToken"
      @close="showUploadModal = false"
      @upload-file="handleFileUpload"
      @upload-success="handleUploadSuccess"
      @show-my-files="handleShowMyFiles"
    />

    <LinkShareModal
      :visible="showLinkShareModal"
      :token="sessionToken"
      @close="showLinkShareModal = false"
      @link-created="handleLinkCreated"
    />

    <HamburgerMenu
      :visible="showHamburgerMenu"
      :access-level="accessLevel"
      @close="showHamburgerMenu = false"
      @show-register="showRegisterModal = true"
      @show-my-files="showMyFilesModal = true"
      @show-my-links="handleShowMyLinks"
      @show-change-password="showChangePasswordModal = true"
      @logout="handleLogout"
    />

    <MyFilesModal
      :visible="showMyFilesModal"
      :files="files"
      :token="sessionToken"
      @close="showMyFilesModal = false"
      @download="downloadFile"
      @download-group="downloadGroup"
      @delete="handleDeleteFile"
      @group-created="handleGroupCreated"
    />

    <ChangePasswordModal
      :visible="showChangePasswordModal"
      :token="sessionToken"
      @close="showChangePasswordModal = false"
      @change-password="handleChangePassword"
    />

    <MyLinksModal
      :visible="showMyLinksModal"
      :links="links"
      :token="sessionToken"
      @close="showMyLinksModal = false"
      @delete="handleDeleteLink"
    />

    <RegisterUserModal
      :visible="showRegisterModal"
      :token="sessionToken"
      @close="showRegisterModal = false"
      @register="handleRegisterUser"
    />

    <!-- Full-page Drag & Drop Overlay -->
    <div
      v-if="isDragActive && !showUploadModal"
      class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-6 pointer-events-none animate-fade-in"
    >
      <div
        class="w-full h-full border-4 border-dashed border-primary-button/80 rounded-[28px] flex flex-col items-center justify-center p-8 bg-primary-button/10 text-center shadow-[inset_0_0_60px_rgba(103,146,255,0.15)] transition-all duration-300"
      >
        <div
          class="w-24 h-24 mobile:w-16 mobile:h-16 mb-6 mobile:mb-4 rounded-full bg-primary-button/20 flex items-center justify-center animate-bounce-gentle"
        >
          <span
            class="material-icons-outlined text-6xl mobile:text-4xl text-primary-button"
            >cloud_upload</span
          >
        </div>
        <h2
          class="text-3xl mobile:text-2xl font-inter font-bold text-white mb-3"
        >
          <span style="color: #5ef78c">Drop</span> files or folders anywhere to
          <span style="color: #4c73f0">Upload</span>
        </h2>
        <p class="text-gray-300 font-inter text-lg mobile:text-sm max-w-md">
          {{
            isAuthenticated
              ? "Release files or folders anywhere to start uploading"
              : "Please log in to upload files"
          }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick, watch } from "vue";
import { useAuth } from "../composables/useAuth.js";
import { useFiles } from "../composables/useFiles.js";
import { useNotification } from "../composables/useNotification.js";
import Header from "../components/Header.vue";
import DownloadForm from "../components/DownloadForm.vue";
import LoginModal from "../components/LoginModal.vue";
import UploadModal from "../components/UploadModal.vue";
import HamburgerMenu from "../components/HamburgerMenu.vue";
import MyFilesModal from "../components/MyFilesModal.vue";
import ChangePasswordModal from "../components/ChangePasswordModal.vue";
import LinkShareModal from "../components/LinkShareModal.vue";
import MyLinksModal from "../components/MyLinksModal.vue";
import RegisterUserModal from "../components/RegisterUserModal.vue";
import {
  extractFilesFromDataTransfer,
  extractFilesFromClipboard,
} from "../utils/fileHelpers.js";

export default {
  name: "Home",
  components: {
    Header,
    DownloadForm,
    LoginModal,
    UploadModal,
    LinkShareModal,
    HamburgerMenu,
    MyFilesModal,
    ChangePasswordModal,
    MyLinksModal,
    RegisterUserModal,
  },
  setup() {
    const {
      sessionToken,
      isAuthenticated,
      accessLevel,
      verifyAccessToken,
      login,
      logout,
    } = useAuth();

    const {
      quotaInfo,
      files,
      updateQuotaDisplay,
      updateFilesDisplay,
      checkFileExists: checkFile,
      downloadFile: download,
      downloadGroup: downloadGroupFunc,
      deleteFile: deleteFileFunc,
      uploadFile: upload,
    } = useFiles();

    const { showNotification } = useNotification();

    const showLoginModal = ref(false);
    const showUploadModal = ref(false);
    const showLinkShareModal = ref(false);
    const showHamburgerMenu = ref(false);
    const showMyFilesModal = ref(false);
    const showMyLinksModal = ref(false);
    const showChangePasswordModal = ref(false);
    const showRegisterModal = ref(false);

    const links = ref([]);

    const isDragActive = ref(false);
    const uploadModalRef = ref(null);
    let dragCounter = 0;

    const isFileDrag = (event) => {
      if (!event.dataTransfer || !event.dataTransfer.types) return false;
      return (
        Array.from(event.dataTransfer.types).includes("Files") ||
        event.dataTransfer.types.includes("application/x-moz-file")
      );
    };

    const handleGlobalDragEnter = (event) => {
      if (showUploadModal.value) return;
      if (!isFileDrag(event)) return;
      event.preventDefault();
      dragCounter++;
      isDragActive.value = true;
    };

    const handleGlobalDragOver = (event) => {
      if (showUploadModal.value) return;
      if (!isFileDrag(event)) return;
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }
    };

    const handleGlobalDragLeave = (event) => {
      if (!isFileDrag(event)) return;
      if (showUploadModal.value) {
        dragCounter = 0;
        isDragActive.value = false;
        return;
      }
      event.preventDefault();
      dragCounter--;
      if (
        dragCounter <= 0 ||
        event.clientX <= 0 ||
        event.clientY <= 0 ||
        event.clientX >= window.innerWidth ||
        event.clientY >= window.innerHeight
      ) {
        dragCounter = 0;
        isDragActive.value = false;
      }
    };

    const handleGlobalDrop = async (event) => {
      if (!isFileDrag(event)) return;
      dragCounter = 0;
      isDragActive.value = false;

      // If user is already in UploadModal, UploadModal handles the drop directly
      if (showUploadModal.value) return;

      event.preventDefault();
      if (event._handledByUploadModal) return;

      const { files, folderName } = await extractFilesFromDataTransfer(
        event.dataTransfer,
      );
      if (!files || files.length === 0) return;

      if (!isAuthenticated.value) {
        showNotification("Please log in to upload files", "error");
        showLoginModal.value = true;
        return;
      }

      if (uploadModalRef.value && uploadModalRef.value.uploading) {
        showNotification("An upload is already in progress!", "error");
        return;
      }

      showHamburgerMenu.value = false;
      showMyFilesModal.value = false;
      showMyLinksModal.value = false;

      showUploadModal.value = true;
      await nextTick();
      if (uploadModalRef.value) {
        uploadModalRef.value.handleFiles(files, folderName);
      }
    };

    const handleGlobalPaste = async (event) => {
      // If user is already in UploadModal, UploadModal handles the paste directly
      if (showUploadModal.value) return;

      // Don't intercept paste if user is typing in a text input or textarea
      const target = event.target;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      const files = extractFilesFromClipboard(event.clipboardData);
      if (!files || files.length === 0) return;

      if (isInput) return;

      event.preventDefault();

      if (!isAuthenticated.value) {
        showNotification("Please log in to upload files", "error");
        showLoginModal.value = true;
        return;
      }

      if (uploadModalRef.value && uploadModalRef.value.uploading) {
        showNotification("An upload is already in progress!", "error");
        return;
      }

      showHamburgerMenu.value = false;
      showMyFilesModal.value = false;
      showMyLinksModal.value = false;

      showUploadModal.value = true;
      await nextTick();
      if (uploadModalRef.value) {
        uploadModalRef.value.handleFiles(files);
      }
    };

    watch(showUploadModal, (isOpen) => {
      if (isOpen) {
        dragCounter = 0;
        isDragActive.value = false;
      }
    });

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isDragActive.value) {
        dragCounter = 0;
        isDragActive.value = false;
      }
    };

    const fetchUserLinks = async (token) => {
      try {
        const response = await fetch("/share-link", {
          method: "GET",
          headers: {
            Authorization: token,
          },
        });

        if (response.ok) {
          const result = await response.json();
          links.value = result;
        } else {
          links.value = [];
        }
      } catch (error) {
        console.error("Failed to fetch links:", error);
        links.value = [];
      }
    };

    onMounted(async () => {
      window.addEventListener("dragenter", handleGlobalDragEnter);
      window.addEventListener("dragover", handleGlobalDragOver);
      window.addEventListener("dragleave", handleGlobalDragLeave);
      window.addEventListener("drop", handleGlobalDrop);
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("paste", handleGlobalPaste);

      await verifyAccessToken();
      if (isAuthenticated.value) {
        await updateQuotaDisplay(sessionToken.value);
        await updateFilesDisplay(sessionToken.value);
        await fetchUserLinks(sessionToken.value);
      }
    });

    onUnmounted(() => {
      window.removeEventListener("dragenter", handleGlobalDragEnter);
      window.removeEventListener("dragover", handleGlobalDragOver);
      window.removeEventListener("dragleave", handleGlobalDragLeave);
      window.removeEventListener("drop", handleGlobalDrop);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("paste", handleGlobalPaste);
    });

    const handleLogin = async (username, password, callback) => {
      const result = await login(username, password);
      if (callback) {
        callback(result);
      }

      if (result && result.success) {
        showNotification("Login successful!", "ok");
        await updateQuotaDisplay(sessionToken.value);
        await updateFilesDisplay(sessionToken.value);
      }

      return result;
    };

    const handleLogout = async () => {
      await logout();
      showHamburgerMenu.value = false;
      showNotification("Logout successful!", "ok");
    };

    const handleFileUpload = async (
      files,
      token,
      isGroupUpload = false,
      groupName = "",
      onProgress,
      resolve,
      reject,
    ) => {
      try {
        const result = await upload(
          files,
          token,
          isGroupUpload,
          groupName,
          onProgress,
        );
        if (result.success) {
          await updateQuotaDisplay(token);
          await updateFilesDisplay(token);

          // Show success notification with file count
          const fileCount = files.length;
          let successMessage = "File uploaded successfully!";
          if (fileCount > 1) {
            if (isGroupUpload) {
              successMessage = `${fileCount} files uploaded as group successfully!`;
            } else {
              successMessage = `${fileCount} files uploaded successfully!`;
            }
          }
          showNotification(successMessage, "ok");
        } else {
          showNotification(result.error || "Upload failed!", "error");
        }
        resolve(result);
      } catch (error) {
        // Enhanced error notification with specific suggestions
        let errorMessage = error.error || "Upload failed!";
        let notificationType = "error";

        // Add specific guidance based on error type
        if (error.errorType === "quota_exceeded") {
          errorMessage += " Consider deleting old files to free up space.";
        } else if (error.errorType === "auth_error") {
          errorMessage += " Please log in again.";
        } else if (
          error.errorType === "network_error" ||
          error.errorType === "timeout"
        ) {
          errorMessage += " Check your internet connection and try again.";
        }

        showNotification(errorMessage, notificationType);
        reject(error);
      }
    };

    const handleUploadSuccess = () => {};

    const handleLinkCreated = () => {
      showNotification("Link shared successfully!", "ok");
    };

    const handleShowMyLinks = () => {
      showHamburgerMenu.value = false;
      showMyLinksModal.value = true;
    };

    const handleDeleteLink = async (id) => {
      try {
        const response = await fetch(`/share-link/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: sessionToken.value,
          },
        });

        if (response.ok) {
          await fetchUserLinks(sessionToken.value);
          showNotification("Link deleted successfully!", "ok");
        } else {
          showNotification("Failed to delete link!", "error");
        }
      } catch (error) {
        console.error("Delete link error:", error);
        showNotification("Network error", "error");
      }
    };
    const handleShowMyFiles = () => {
      showUploadModal.value = false;
      showMyFilesModal.value = true;
    };

    const handleDeleteFile = async (code, action = null) => {
      // For groups, action will be 'confirm' (delete group only) or 'secondary' (delete group and files)
      // For files, action will be null
      const deleteSubItems = action === "secondary";
      const result = await deleteFileFunc(
        code,
        sessionToken.value,
        deleteSubItems,
      );
      if (result.success) {
        await updateFilesDisplay(sessionToken.value);
        await updateQuotaDisplay(sessionToken.value);
        showNotification("Item deleted successfully!", "ok");
      } else {
        showNotification("Delete failed!", "error");
      }
      return result;
    };

    const handleGroupCreated = async () => {
      showNotification("Group created successfully!", "ok");
      await updateFilesDisplay(sessionToken.value);
    };

    const handleChangePassword = async (oldPassword, newPassword, callback) => {
      try {
        const response = await fetch("/changePassword", {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=UTF-8",
            Authorization: sessionToken.value,
          },
          body: JSON.stringify({
            old_password: oldPassword,
            new_password: newPassword,
          }),
        });

        let result;
        if (response.ok) {
          showNotification("Password changed successfully!", "ok");
          result = { success: true };
          window.location.reload();
        } else {
          const error = await response.json();
          showNotification(error.message || "Password change failed", "error");
          result = {
            success: false,
            error: error.message || "Password change failed",
          };
        }

        // Call the callback with the result
        if (callback) {
          callback(result);
        }

        return result;
      } catch (error) {
        console.error("Password change error:", error);
        showNotification("Network error", "error");
        const result = { success: false, error: "Network error" };
        if (callback) {
          callback(result);
        }
        return result;
      }
    };

    const handleRegisterUser = async (userData, callback) => {
      try {
        const response = await fetch("/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=UTF-8",
            Authorization: sessionToken.value,
          },
          body: JSON.stringify(userData),
        });

        let result;
        if (response.ok) {
          showNotification("User registered successfully!", "ok");
          result = { success: true };
        } else {
          const error = await response.json();
          showNotification(error.error || "Registration failed", "error");
          result = {
            success: false,
            error: error.error || "Registration failed",
          };
        }

        if (callback) {
          callback(result);
        }

        return result;
      } catch (error) {
        console.error("Registration error:", error);
        showNotification("Network error", "error");
        const result = { success: false, error: "Network error" };
        if (callback) {
          callback(result);
        }
        return result;
      }
    };

    const checkFileExists = async (code, callback) => {
      const result = await checkFile(code);
      if (callback) callback(result);
      return result;
    };

    const downloadFile = (code) => {
      download(code);
    };

    const downloadGroup = (code) => {
      downloadGroupFunc(code);
    };

    return {
      // Auth
      sessionToken,
      isAuthenticated,
      accessLevel,

      // Files
      quotaInfo,
      files,

      // Links
      links,

      // Modal states
      showLoginModal,
      showUploadModal,
      showLinkShareModal,
      showHamburgerMenu,
      showMyFilesModal,
      showMyLinksModal,
      showChangePasswordModal,
      showRegisterModal,

      // Event handlers
      handleLogin,
      handleLogout,
      handleFileUpload,
      handleUploadSuccess,
      handleLinkCreated,
      handleShowMyFiles,
      handleShowMyLinks,
      handleDeleteLink,
      handleDeleteFile,
      handleGroupCreated,
      handleChangePassword,
      handleRegisterUser,
      checkFileExists,
      downloadFile,
      downloadGroup,

      // Drag and drop
      isDragActive,
      uploadModalRef,
    };
  },
};
</script>
