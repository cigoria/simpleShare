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
                      class="px-2 mobile:px-1 py-2 mobile:py-1 text-left border-b border-[#444] min-w-[200px] mobile:min-w-[150px] text-sm mobile:text-xs"
                    >
                      URL
                    </th>
                    <th
                      class="px-2 mobile:px-1 py-2 mobile:py-1 text-center border-b border-[#444] w-[100px] mobile:w-[80px] text-sm mobile:text-xs"
                    >
                      Created
                    </th>
                    <th
                      class="px-2 mobile:px-1 py-2 mobile:py-1 text-center border-b border-[#444] w-[170px] mobile:w-[150px] text-sm mobile:text-xs"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="link in links"
                    :key="link.id"
                    class="border-b border-[#444] hover:bg-black/20 h-[50px]"
                    :class="{ 'bg-primary-button/20': isItemSelected(link.id) }"
                  >
                    <td class="px-4 py-2 align-middle text-center">
                      <input
                        type="checkbox"
                        :checked="isItemSelected(link.id)"
                        @change="toggleItemSelection(link.id)"
                        class="w-4 h-4 rounded border-gray-300 bg-gray-700 text-primary-button focus:ring-primary-button"
                      />
                    </td>
                    <td class="px-4 py-2 align-middle whitespace-nowrap">
                      <span
                        class="cursor-pointer hover:text-secondary-button transition-colors font-medium"
                        @click="copyCode(link.id, $event)"
                        title="Click to copy code"
                      >
                        {{ link.id }}
                        <span
                          v-if="showCopyIcon[link.id]"
                          class="material-icons-outlined text-sm ml-1"
                        >
                          content_copy
                        </span>
                      </span>
                    </td>
                    <td class="px-4 py-2 align-middle">
                      <div class="flex items-center gap-2">
                        <span class="material-icons-outlined text-gray-400 text-sm">link</span>
                        <a
                          :href="link.url"
                          target="_blank"
                          class="text-sm text-gray-300 hover:text-primary-button transition-colors truncate max-w-[300px] mobile:max-w-[150px]"
                          :title="link.url"
                          @click.stop
                        >
                          {{ link.url }}
                        </a>
                      </div>
                    </td>
                    <td class="px-4 py-2 align-middle whitespace-nowrap text-center text-sm">
                      {{ formatDate(link.created_at) }}
                    </td>
                    <td class="px-2 py-2 text-center align-middle">
                      <div class="flex justify-center gap-2">
                        <button
                          class="copy-button bg-secondary-button text-black p-2 rounded-lg hover:opacity-80 transition-opacity w-10 h-10 flex items-center justify-center"
                          @click="copyLinkUrl(link.id)"
                          title="Copy short URL"
                        >
                          <span class="material-icons-outlined text-lg">content_copy</span>
                        </button>
                        <button
                          class="qr-button bg-blue-600/80 text-white p-2 rounded-lg hover:opacity-80 transition-opacity w-10 h-10 flex items-center justify-center"
                          @click="showQR(link.id, link.url)"
                          title="Show QR Code"
                        >
                          <span class="material-icons-outlined text-lg">qr_code</span>
                        </button>
                        <button
                          class="open-button bg-primary-button text-black p-2 rounded-lg hover:opacity-80 transition-opacity w-10 h-10 flex items-center justify-center"
                          @click="openLink(link.url)"
                          title="Open link"
                        >
                          <span class="material-icons-outlined text-lg">open_in_new</span>
                        </button>
                        <button
                          class="delete-button bg-error text-black p-2 rounded-lg hover:opacity-80 transition-opacity w-10 h-10 flex items-center justify-center"
                          @click="handleDelete(link.id)"
                          title="Delete"
                        >
                          <span class="material-icons-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div
                v-if="links.length === 0"
                class="text-center py-8 text-gray-400"
              >
                No shared links found
              </div>
            </div>
          </div>
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
  name: "MyLinksModal",
  components: {
    QrCodeModal,
  },
  props: {
    visible: Boolean,
    links: Array,
    token: String,
  },
  emits: ["close", "delete"],
  setup() {
    const { confirmDelete, confirm } = useConfirm();

    return {
      confirmDelete,
      confirm,
    };
  },
  data() {
    return {
      showCopyIcon: {},
      selectedItems: new Set(),
      showQrModal: false,
      qrUrl: "",
      qrLabel: "",
    };
  },
  computed: {
    isAllSelected() {
      return this.links.length > 0 && this.links.every(link => this.selectedItems.has(link.id));
    },
  },
  methods: {
    showQR(id, targetUrl) {
      this.qrUrl = `${window.location.origin}/${id}`;
      this.qrLabel = id;
      this.showQrModal = true;
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString("hu-HU", {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
      }) + " " +
      date.toLocaleTimeString("hu-HU", {
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    async handleDelete(id) {
      try {
        await this.confirmDelete("this link");
        this.$emit("delete", id);
      } catch {
        // User cancelled deletion
      }
    },
    async copyCode(code, event) {
      try {
        await navigator.clipboard.writeText(code);
        this.showCopyIcon[code] = true;
        setTimeout(() => {
          this.showCopyIcon[code] = false;
        }, 2000);
      } catch (err) {
        console.error("Failed to copy code:", err);
        const textArea = document.createElement("textarea");
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);

        this.showCopyIcon[code] = true;
        setTimeout(() => {
          this.showCopyIcon[code] = false;
        }, 2000);
      }
    },
    async copyLinkUrl(code) {
      const url = window.location.href + code;
      try {
        await navigator.clipboard.writeText(url);
      } catch (err) {
        console.error("Failed to copy URL:", err);
        const textArea = document.createElement("textarea");
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
    },
    openLink(url) {
      window.open(url, "_blank");
    },
    isItemSelected(id) {
      return this.selectedItems.has(id);
    },
    toggleItemSelection(id) {
      if (this.selectedItems.has(id)) {
        this.selectedItems.delete(id);
      } else {
        this.selectedItems.add(id);
      }
      this.selectedItems = new Set(this.selectedItems);
    },
    toggleSelectAll() {
      if (this.isAllSelected) {
        this.selectedItems.clear();
      } else {
        this.links.forEach(link => {
          this.selectedItems.add(link.id);
        });
      }
      this.selectedItems = new Set(this.selectedItems);
    },
    clearSelection() {
      this.selectedItems.clear();
      this.selectedItems = new Set(this.selectedItems);
    },
    async deleteSelected() {
      try {
        const selectedIds = Array.from(this.selectedItems);
        const count = selectedIds.length;

        await this.confirmDelete(`${count} selected link${count !== 1 ? 's' : ''}`);

        for (const id of selectedIds) {
          this.$emit("delete", id);
        }

        this.clearSelection();
      } catch {
        // User cancelled deletion
      }
    },
  },
};
</script>
