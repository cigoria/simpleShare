<template>
  <div
    v-if="visible"
    class="flex justify-center items-center w-full h-full absolute top-0 left-0 bg-transparent background"
    @click="$emit('close')"
  >
    <div
      class="z-10 bg-black/20 backdrop-blur-[20px] absolute h-[calc(100vh-120px)] mobile:h-[calc(100vh-80px)] w-[calc(100vw-30vw)] mobile:w-[calc(100vw-5vw)] flex items-center justify-center m-[100px_auto] mobile:m-[50px_auto] mobile:mx-4 rounded-[28px] mobile:rounded-[20px] border-3 border-[#a1a1a1] transition-all duration-300 modal animate-scale-in"
      @click.stop
    >
      <button
        class="absolute top-2 mobile:top-2 right-2 mobile:right-2 bg-primary-button text-black border-none w-[42px] mobile:w-[36px] h-[42px] mobile:h-[36px] rounded-lg text-lg mobile:text-base cursor-pointer tracking-[1px] text-center z-20 close-btn flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-primary-button/50"
        @click="$emit('close')"
      >
        <span class="material-icons-outlined mobile:text-sm">close</span>
      </button>
      <div
        class="w-full h-full p-4 mobile:p-2 pt-12 mobile:pt-10 rounded-[28px] mobile:rounded-[20px] border border-[#444] bg-black/10 overflow-hidden"
      >
        <!-- Batch Actions Bar -->
        <div
          v-if="selectedItems.size > 0"
          class="mb-4 p-3 bg-primary-button/20 border border-primary-button/30 rounded-lg flex items-center justify-between"
        >
          <div class="flex items-center gap-3">
            <span class="text-sm font-medium">
              {{ selectedItems.size }} item{{ selectedItems.size !== 1 ? 's' : '' }} selected
            </span>
            <button
              @click="clearSelection"
              class="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Clear selection
            </button>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="showCreateGroupModal"
              class="bg-primary-button text-black px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity flex items-center gap-1"
            >
              <span class="material-icons-outlined text-sm">create_new_folder</span>
              Create Group
            </button>
            <button
              @click="downloadSelected"
              class="bg-secondary-button text-black px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity flex items-center gap-1"
            >
              <span class="material-icons-outlined text-sm">download</span>
              Download
            </button>
            <button
              @click="deleteSelected"
              class="bg-error text-black px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity flex items-center gap-1"
            >
              <span class="material-icons-outlined text-sm">delete</span>
              Delete
            </button>
          </div>
        </div>
        <div class="flex h-full relative">
          <div class="flex-1 overflow-hidden">
            <div class="h-full overflow-y-auto overflow-x-auto">
              <table class="w-full border-collapse">
                <thead class="sticky top-0 bg-black/40 z-10 backdrop-blur-md">
                  <tr>
                    <th
                      class="px-2 mobile:px-1 py-2 mobile:py-1 text-center border-b border-[#444] w-[40px] mobile:w-[30px] text-sm mobile:text-xs"
                    >
                      <input
                        type="checkbox"
                        :checked="isAllSelected"
                        @change="toggleSelectAll"
                        class="w-4 h-4 rounded border-gray-300 bg-gray-700 text-primary-button focus:ring-primary-button"
                      />
                    </th>
                    <th
                      class="px-2 mobile:px-1 py-2 mobile:py-1 text-left border-b border-[#444] text-sm mobile:text-xs"
                    >
                      Code
                    </th>
                    <th
                      class="px-2 mobile:px-1 py-2 mobile:py-1 text-left border-b border-[#444] min-w-[150px] mobile:min-w-[100px] text-sm mobile:text-xs"
                    >
                      Name
                    </th>
                    <th
                      class="px-2 mobile:px-1 py-2 mobile:py-1 text-center border-b border-[#444] w-[60px] mobile:w-[50px] text-sm mobile:text-xs"
                    >
                      Type
                    </th>
                    <th
                      class="px-2 mobile:px-1 py-2 mobile:py-1 text-center border-b border-[#444] w-[60px] mobile:w-[50px] text-sm mobile:text-xs"
                    >
                      Date
                    </th>
                    <th
                      class="px-2 mobile:px-1 py-2 mobile:py-1 text-center border-b border-[#444] w-[60px] mobile:w-[50px] text-sm mobile:text-xs"
                    >
                      Size
                    </th>
                    <th
                      class="px-2 mobile:px-1 py-2 mobile:py-1 text-center border-b border-[#444] w-[130px] mobile:w-[110px] text-sm mobile:text-xs"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="item in files" :key="item.code">
                    <tr
                      class="border-b border-[#444] hover:bg-black/20 h-[50px] cursor-pointer"
                      :class="{ 
                        'bg-blue-900/10': item.type === 'group',
                        'bg-primary-button/20': isItemSelected(item.code)
                      }"
                      @click="
                        item.type === 'group' ? toggleGroup(item.code) : null
                      "
                    >
                      <td class="px-4 py-2 align-middle text-center">
                        <input
                          type="checkbox"
                          :checked="isItemSelected(item.code)"
                          @change="toggleItemSelection(item.code)"
                          @click.stop
                          class="w-4 h-4 rounded border-gray-300 bg-gray-700 text-primary-button focus:ring-primary-button"
                        />
                      </td>
                      <td class="px-4 py-2 align-middle whitespace-nowrap">
                        <div class="flex items-center gap-2">
                          <span
                            v-if="item.type === 'group'"
                            class="material-icons-outlined text-blue-400 text-sm"
                          >
                            {{
                              isGroupExpanded(item.code)
                                ? "expand_more"
                                : "chevron_right"
                            }}
                          </span>
                          <span v-else></span>
                          <span
                            class="cursor-pointer hover:text-secondary-button transition-colors"
                            @click.stop="copyCode(item.code, $event)"
                            title="Click to copy code"
                          >
                            {{ item.code }}
                            <span
                              v-if="showCopyIcon[item.code]"
                              class="material-icons-outlined text-sm ml-1"
                            >
                              content_copy
                            </span>
                          </span>
                        </div>
                      </td>
                      <td class="px-4 py-2 align-middle min-w-[200px]">
                        <div class="flex items-center gap-2">
                          <span
                            v-if="item.type === 'group'"
                            class="material-icons-outlined text-blue-400"
                            >folder</span
                          >
                          <span
                            v-else
                            class="material-icons-outlined text-gray-400"
                            >{{ getFileIcon(item) }}</span
                          >
                          <span>{{ fixFilename(item.name) }}</span>
                          <span
                            v-if="item.type === 'group'"
                            class="text-xs text-gray-400"
                            >({{ item.fileCount }} files)</span
                          >
                        </div>
                      </td>
                      <td class="px-4 py-2 align-middle text-center">
                        <span
                          class="px-2 py-1 rounded text-xs"
                          :class="
                            item.type === 'group'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-gray-500/20 text-gray-300'
                          "
                        >
                          {{ item.type === "group" ? "Group" : "File" }}
                        </span>
                      </td>
                      <td class="px-4 py-2 align-middle whitespace-nowrap">
                        {{ item.formattedDate }}
                      </td>
                      <td class="px-4 py-2 align-middle whitespace-nowrap">
                        {{ item.formattedSize }}
                      </td>
                      <td class="px-2 py-2 text-center align-middle">
                        <div class="flex justify-center gap-2">
                          <button
                            v-if="item.type === 'group'"
                            class="download-button bg-secondary-button text-black p-2 rounded-lg hover:opacity-80 transition-opacity w-10 h-10 flex items-center justify-center"
                            @click.stop="$emit('download-group', item.code)"
                            title="Download Group"
                          >
                            <span class="material-icons-outlined text-lg"
                              >download</span
                            >
                          </button>
                          <button
                            v-if="item.type === 'file'"
                            class="download-button bg-secondary-button text-black p-2 rounded-lg hover:opacity-80 transition-opacity w-10 h-10 flex items-center justify-center"
                            @click.stop="$emit('download', item.code)"
                            title="Download"
                          >
                            <span class="material-icons-outlined text-lg"
                              >download</span
                            >
                          </button>
                          <button
                            class="qr-button bg-blue-600/80 text-white p-2 rounded-lg hover:opacity-80 transition-opacity w-10 h-10 flex items-center justify-center"
                            @click.stop="showQR(item.code, item.name)"
                            title="Show QR Code"
                          >
                            <span class="material-icons-outlined text-lg">qr_code</span>
                          </button>
                          <button
                            class="delete-button bg-error text-black p-2 rounded-lg hover:opacity-80 transition-opacity w-10 h-10 flex items-center justify-center"
                            @click.stop="handleDelete(item.code)"
                            title="Delete"
                          >
                            <span class="material-icons-outlined text-lg"
                              >delete</span
                            >
                          </button>
                        </div>
                      </td>
                    </tr>
                    <!-- Nested files for expanded groups -->
                    <template
                      v-if="item.type === 'group' && isGroupExpanded(item.code)"
                    >
                      <tr
                        v-for="file in item.files"
                        :key="file.code"
                        class="border-b border-[#444] hover:bg-black/10 h-[50px] bg-gray-900/20"
                        :class="{ 'bg-primary-button/20': isItemSelected(file.code) }"
                      >
                        <td
                          class="px-4 py-2 align-middle whitespace-nowrap pl-12 text-center"
                        >
                          <input
                            type="checkbox"
                            :checked="isItemSelected(file.code)"
                            @change="toggleItemSelection(file.code)"
                            @click.stop
                            class="w-4 h-4 rounded border-gray-300 bg-gray-700 text-primary-button focus:ring-primary-button"
                          />
                        </td>
                        <td
                          class="px-4 py-2 align-middle whitespace-nowrap pl-12"
                        >
                          <span
                            class="cursor-pointer hover:text-secondary-button transition-colors"
                            @click.stop="copyCode(file.code, $event)"
                            title="Click to copy code"
                          >
                            {{ file.code }}
                            <span
                              v-if="showCopyIcon[file.code]"
                              class="material-icons-outlined text-sm ml-1"
                            >
                              content_copy
                            </span>
                          </span>
                        </td>
                        <td class="px-4 py-2 align-middle min-w-[200px] pl-12">
                          <div class="flex items-center gap-2">
                            <span
                              class="material-icons-outlined text-gray-400 text-sm"
                              >{{ getFileIcon(file) }}</span
                            >
                            <span>{{
                              fixFilename(file.original_name || file.name)
                            }}</span>
                          </div>
                        </td>
                        <td class="px-4 py-2 align-middle text-center">
                          <span
                            class="px-2 py-1 rounded text-xs bg-gray-500/20 text-gray-300"
                          >
                            File
                          </span>
                        </td>
                        <td class="px-4 py-2 align-middle whitespace-nowrap">
                          {{
                            new Date(file.upload_date).toLocaleDateString(
                              "hu-HU",
                              {
                                year: "2-digit",
                                month: "2-digit",
                                day: "2-digit",
                              },
                            ) +
                            " " +
                            new Date(file.upload_date).toLocaleTimeString(
                              "hu-HU",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )
                          }}
                        </td>
                        <td class="px-4 py-2 align-middle whitespace-nowrap">
                          {{ formatBytes(file.size) }}
                        </td>
                        <td class="px-2 py-2 text-center align-middle">
                          <div class="flex justify-center gap-2">
                            <button
                              class="download-button bg-secondary-button text-black p-2 rounded-lg hover:opacity-80 transition-opacity w-10 h-10 flex items-center justify-center"
                              @click.stop="$emit('download', file.code)"
                              title="Download"
                            >
                              <span class="material-icons-outlined text-lg"
                                >download</span
                              >
                            </button>
                            <button
                              class="qr-button bg-blue-600/80 text-white p-2 rounded-lg hover:opacity-80 transition-opacity w-10 h-10 flex items-center justify-center"
                              @click.stop="showQR(file.code, file.original_name || file.name)"
                              title="Show QR Code"
                            >
                              <span class="material-icons-outlined text-lg">qr_code</span>
                            </button>
                            <button
                              class="delete-button bg-error text-black p-2 rounded-lg hover:opacity-80 transition-opacity w-10 h-10 flex items-center justify-center"
                              @click.stop="handleDelete(file.code)"
                              title="Delete"
                            >
                              <span class="material-icons-outlined text-lg"
                                >delete</span
                              >
                            </button>
                          </div>
                        </td>
                      </tr>
                    </template>
                  </template>
                </tbody>
              </table>
              <div
                v-if="files.length === 0"
                class="text-center py-8 text-gray-400"
              >
                No files found
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Group Modal -->
    <div
      v-if="showGroupModal"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click.self="closeGroupModal"
    >
      <div class="bg-black/90 border border-[#444] rounded-xl p-6 w-[400px] mobile:w-[90vw] shadow-2xl">
        <h3 class="text-xl font-semibold mb-4 text-white">Create Group</h3>
        <p class="text-gray-400 mb-4 text-sm">
          Creating group from {{ selectedItems.size }} selected file{{ selectedItems.size !== 1 ? 's' : '' }}
        </p>
        
        <input
          v-model="newGroupName"
          type="text"
          placeholder="Enter group name..."
          class="w-full px-4 py-2 bg-black/50 border border-[#555] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-button transition-colors mb-4"
          @keyup.enter="confirmCreateGroup"
          ref="groupNameInput"
        />
        
        <div class="flex gap-3">
          <button
            @click="confirmCreateGroup"
            class="flex-1 bg-primary-button text-black py-2 rounded-lg font-medium hover:opacity-80 transition-opacity"
            :disabled="!newGroupName.trim() || isCreatingGroup"
          >
            <span v-if="isCreatingGroup" class="flex items-center justify-center gap-2">
              <span class="material-icons-outlined text-sm animate-spin">refresh</span>
              Creating...
            </span>
            <span v-else>Create Group</span>
          </button>
          <button
            @click="closeGroupModal"
            class="flex-1 bg-gray-700 text-white py-2 rounded-lg font-medium hover:opacity-80 transition-opacity"
            :disabled="isCreatingGroup"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- QR Code Modal -->
    <QrCodeModal
      :visible="showQrModal"
      :url="qrUrl"
      :label="qrLabel"
      @close="showQrModal = false"
    />
  </div>
</template>

<script>
import { useConfirm } from "../composables/useConfirm.js";
import QrCodeModal from "./QrCodeModal.vue";

export default {
  name: "MyFilesModal",
  components: {
    QrCodeModal,
  },
  props: {
    visible: Boolean,
    files: Array,
    token: String,
  },
  emits: ["close", "download", "download-group", "delete", "group-created"],
  setup() {
    const { confirmDelete, confirm, confirmDeleteGroup } = useConfirm();

    return {
      confirmDelete,
      confirm,
      confirmDeleteGroup,
    };
  },
  data() {
    return {
      expandedGroups: new Set(),
      showCopyIcon: {},
      selectedItems: new Set(),
      showGroupModal: false,
      newGroupName: "",
      isCreatingGroup: false,
      showQrModal: false,
      qrUrl: "",
      qrLabel: "",
    };
  },
  computed: {
    isAllSelected() {
      const allItems = this.getAllItems();
      return allItems.length > 0 && allItems.every(item => this.selectedItems.has(item.code));
    },
  },
  methods: {
    showQR(code, name) {
      this.qrUrl = `${window.location.origin}/files/${code}`;
      this.qrLabel = name || code;
      this.showQrModal = true;
    },
    fixFilename(filename) {
      if (!filename) return filename;

      // Check if filename contains corrupted characters that need fixing
      // Common corruption patterns from latin1->utf8 conversion
      const hasCorruption = /[ÅÂÃÄ]/.test(filename);

      if (hasCorruption) {
        try {
          // Fix by treating the string as if it was corrupted by latin1->utf8 conversion
          // Convert back to bytes as latin1, then decode as utf8
          return Buffer.from(filename, "latin1")
            .toString("utf8")
            .normalize("NFC");
        } catch (error) {
          // If conversion fails, return original
          return filename;
        }
      }

      return filename;
    },

    getFileIcon(fileData) {
      // Use mimetype if available, otherwise fall back to filename extension
      let mimeType = "";
      if (fileData.mimetype) {
        mimeType = fileData.mimetype.split("/")[0]; // Get the part before '/'
      } else {
        // Fallback to extension if mimetype is not available
        const extension =
          fileData.name?.split(".").pop().toLowerCase() ||
          fileData.original_name?.split(".").pop().toLowerCase() ||
          "";
        const extensionToMime = {
          pdf: "application/pdf",
          doc: "application/msword",
          docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          txt: "text/plain",
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          gif: "image/gif",
          mp3: "audio/mpeg",
          wav: "audio/wav",
          mp4: "video/mp4",
          avi: "video/x-msvideo",
          zip: "application/zip",
          js: "application/javascript",
          css: "text/css",
          html: "text/html",
          json: "application/json",
        };
        mimeType = extensionToMime[extension]?.split("/")[0] || "application";
      }

      const iconMap = {
        application: "insert_drive_file",
        text: "text_snippet",
        image: "image",
        audio: "audio_file",
        video: "video_file",
        multipart: "folder_zip",
      };

      return iconMap[mimeType] || iconMap["application"];
    },

    toggleGroup(groupCode) {
      if (this.expandedGroups.has(groupCode)) {
        this.expandedGroups.delete(groupCode);
      } else {
        this.expandedGroups.add(groupCode);
      }
    },
    isGroupExpanded(groupCode) {
      return this.expandedGroups.has(groupCode);
    },
    formatBytes(bytes) {
      if (bytes === 0) return "0 B";
      const units = ["B", "kB", "MB", "GB", "TB"];
      const threshold = 1024;
      let unitIndex = 0;
      let size = bytes;

      while (size >= threshold && unitIndex < units.length - 1) {
        size /= threshold;
        unitIndex++;
      }

      return `${size.toFixed(1)} ${units[unitIndex]}`;
    },
    async handleDelete(code) {
      try {
        // Find the item to determine if it's a group or file
        const item = this.files.find((f) => f.code === code);

        if (item?.type === "group") {
          // Handle group deletion with options
          const action = await this.confirmDeleteGroup(item.name);
          this.$emit("delete", code, action);
        } else {
          // Handle file deletion
          await this.confirmDelete("this file");
          this.$emit("delete", code);
        }
      } catch {
        // User cancelled deletion
      }
    },
    async copyCode(code, event) {
      try {
        await navigator.clipboard.writeText(code);
        // Show copy icon
        this.showCopyIcon[code] = true;
        setTimeout(() => {
          this.showCopyIcon[code] = false;
        }, 2000);
      } catch (err) {
        console.error("Failed to copy code:", err);
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);

        // Show copy icon
        this.showCopyIcon[code] = true;
        setTimeout(() => {
          this.showCopyIcon[code] = false;
        }, 2000);
      }
    },
    getAllItems() {
      const items = [];
      
      this.files.forEach(item => {
        items.push(item);
        
        if (item.type === 'group' && item.files) {
          item.files.forEach(file => {
            items.push(file);
          });
        }
      });
      
      return items;
    },
    isItemSelected(code) {
      return this.selectedItems.has(code);
    },
    toggleItemSelection(code) {
      if (this.selectedItems.has(code)) {
        this.selectedItems.delete(code);
      } else {
        this.selectedItems.add(code);
      }
      this.selectedItems = new Set(this.selectedItems); // Force reactivity
    },
    toggleSelectAll() {
      const allItems = this.getAllItems();
      
      if (this.isAllSelected) {
        this.selectedItems.clear();
      } else {
        allItems.forEach(item => {
          this.selectedItems.add(item.code);
        });
      }
      this.selectedItems = new Set(this.selectedItems); // Force reactivity
    },
    clearSelection() {
      this.selectedItems.clear();
      this.selectedItems = new Set(this.selectedItems); // Force reactivity
    },
    async downloadSelected() {
      const selectedCodes = Array.from(this.selectedItems);
      
      for (const code of selectedCodes) {
        const link = document.createElement("a");
        link.href = "/files/" + code;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Small delay between downloads to avoid overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Clear selection after download
      this.clearSelection();
    },
    async deleteSelected() {
      try {
        const selectedCodes = Array.from(this.selectedItems);
        const count = selectedCodes.length;
        
        await this.confirmDelete(`${count} selected item${count !== 1 ? 's' : ''}`);
        
        // Emit delete events for each selected item
        for (const code of selectedCodes) {
          this.$emit("delete", code);
        }
        
        // Clear selection after deletion
        this.clearSelection();
      } catch {
        // User cancelled deletion
      }
    },
    showCreateGroupModal() {
      this.showGroupModal = true;
      this.newGroupName = "";
      // Focus the input after modal opens
      this.$nextTick(() => {
        this.$refs.groupNameInput?.focus();
      });
    },
    closeGroupModal() {
      this.showGroupModal = false;
      this.newGroupName = "";
      this.isCreatingGroup = false;
    },
    async confirmCreateGroup() {
      if (!this.newGroupName.trim()) return;
      if (this.selectedItems.size === 0) return;
      
      this.isCreatingGroup = true;
      
      try {
        const fileIds = Array.from(this.selectedItems).filter(code => {
          // Filter out group codes - only files can be added to groups
          const item = this.getAllItems().find(i => i.code === code);
          return item && item.type !== 'group';
        });
        
        if (fileIds.length === 0) {
          await this.confirm("Please select files (not groups) to create a group.");
          this.isCreatingGroup = false;
          return;
        }
        
        const response = await fetch("/create-group-from-files", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: this.token,
          },
          body: JSON.stringify({
            fileIds,
            groupName: this.newGroupName.trim(),
          }),
        });
        
        if (response.ok) {
          const result = await response.json();
          this.closeGroupModal();
          this.clearSelection();
          // Emit event to parent to refresh files and show notification
          this.$emit("group-created");
        } else {
          const error = await response.json();
          await this.confirm(error.error || "Failed to create group");
        }
      } catch (err) {
        console.error("Create group error:", err);
        await this.confirm("Network error while creating group");
      } finally {
        this.isCreatingGroup = false;
      }
    },
  },
};
</script>
