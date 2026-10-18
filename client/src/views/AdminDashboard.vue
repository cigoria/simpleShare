<template>
  <div
    class="m-0 p-0 bg-bg text-white font-inter flex justify-center items-center h-screen overflow-hidden select-none"
  >
    <AdminHeader :active-tab="activeTab" @tab-change="handleTabChange" />

    <!-- Users View -->
    <UsersView v-if="activeTab === 'users'" :token="sessionToken" />

    <!-- Files View -->
    <FilesView v-if="activeTab === 'files'" :token="sessionToken" />

    <!-- Links View -->
    <LinksView v-if="activeTab === 'links'" :token="sessionToken" />

    <!-- Stats View -->
    <StatsView
      v-if="activeTab === 'stats'"
      :token="sessionToken"
      @navigate-to-users="activeTab = 'users'"
      @navigate-to-files="activeTab = 'files'"
    />

    <!-- Global Storage View -->
    <GlobalStorageView
      v-if="activeTab === 'storage'"
      :token="sessionToken"
      @navigate-to-stats="activeTab = 'stats'"
    />

    <!-- Database View -->
    <DatabaseView v-if="activeTab === 'database'" :token="sessionToken" />
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth.js";
import { useAdmin } from "../composables/useAdmin.js";
import { useNotification } from "../composables/useNotification.js";
import AdminHeader from "../components/AdminHeader.vue";
import UsersView from "./UsersView.vue";
import FilesView from "./FilesView.vue";
import StatsView from "./StatsView.vue";
import GlobalStorageView from "./GlobalStorageView.vue";
import DatabaseView from "./DatabaseView.vue";
import LinksView from "./LinksView.vue";

export default {
  name: "AdminDashboard",
  components: {
    AdminHeader,
    UsersView,
    FilesView,
    LinksView,
    StatsView,
    GlobalStorageView,
    DatabaseView,
  },
  setup() {
    const router = useRouter();
    const { sessionToken } = useAuth();
    const { verifyAdminAccess } = useAdmin();
    const { showNotification } = useNotification();

    const activeTab = ref("users");

    const handleTabChange = (tabId) => {
      activeTab.value = tabId;
    };

    onMounted(async () => {
      // Get token from URL or localStorage
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get("token");
      const tokenFromStorage = localStorage.getItem("token");

      const token = tokenFromUrl || tokenFromStorage;

      if (!token) {
        showNotification("Access denied: No token provided", "error");
        if (router) {
          router.push("/");
        } else {
          window.location.href = "/";
        }
        return;
      }

      // Store token if it came from URL
      if (tokenFromUrl && !tokenFromStorage) {
        localStorage.setItem("token", token);
        // Clean URL
        window.history.replaceState({}, document.title, "/admin");
      }

      sessionToken.value = token;

      // Verify admin access
      const isAdmin = await verifyAdminAccess(token);
      if (!isAdmin) {
        showNotification("Access denied: Admin privileges required", "error");
        if (router) {
          router.push("/");
        } else {
          window.location.href = "/";
        }
        return;
      }
    });

    return {
      sessionToken,
      activeTab,
      handleTabChange,
    };
  },
};
</script>
