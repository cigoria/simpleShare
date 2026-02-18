fetch("/admin/getAllUsersWithFiles",{
    method:"GET",
    headers: {
        Accept: "application/json",
        Authorization: `${localStorage.getItem("token")}`
    }
})
// Admin panel JavaScript
let authToken = localStorage.getItem("token");
let currentView = "users";
let currentTable = "";
let selectedRow = null;
let selectedCell = null;

// Check admin authentication on page load
document.addEventListener("DOMContentLoaded", function () {
  if (!authToken) {
    window.location.href = "/";
    return;
  }

  // Verify admin session
  fetch("/verifySession", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({ token: authToken }),
  })
    .then((response) => {
      if (!response.ok) {
        window.location.href = "/";
        return;
      }
      return response.json();
    })
    .then((data) => {
      if (data.permission !== "admin") {
        window.location.href = "/";
        return;
      }
      // Load initial data
      loadUsers();
      setupEventListeners();
      loadTables(); // Load database tables
    })
    .catch((error) => {
      console.error("Authentication error:", error);
      window.location.href = "/";
    });
});

function setupEventListeners() {
  // Tab switching
  document.querySelectorAll(".button-container button").forEach((button) => {
    button.addEventListener("click", function () {
      const buttonText = this.textContent.trim();

      // Update active button styling
      document.querySelectorAll(".button-container button").forEach((btn) => {
        btn.classList.remove("bg-primary-button", "text-black");
        btn.classList.add("bg-gray-600", "text-white");
      });
      this.classList.remove("bg-gray-600", "text-white");
      this.classList.add("bg-primary-button", "text-black");

      // Switch views
      // First hide all containers
      document.getElementById("users-container").classList.add("hidden");
      document.getElementById("all-files-container").classList.add("hidden");
      document.getElementById("global-storage-container").classList.add("hidden");
      document.getElementById("database-container").classList.add("hidden");

      if (buttonText === "Users") {
        currentView = "users";
        document.getElementById("users-container").classList.remove("hidden");
        loadUsers();
      } else if (buttonText === "All Files") {
        currentView = "files";
        document.getElementById("all-files-container").classList.remove("hidden");
        loadAllFiles();
      } else if (buttonText === "Global Storage") {
        currentView = "storage";
        document.getElementById("global-storage-container").classList.remove("hidden");
        loadGlobalStorage();
      } else if (buttonText === "Database") {
        currentView = "database";
        document.getElementById("database-container").classList.remove("hidden");
        // Load tables if not already loaded
        if (document.getElementById("tableSelector").options.length <= 1) {
          loadTables();
        }
      }

      // Clean up database state when switching away from Database tab
      if (currentView !== "database" && buttonText !== "Database") {
        clearTable();
        selectedRow = null;
        selectedCell = null;
      }
    });
  });

  // Set initial active button
  document
    .querySelector(".button-container button")
    .classList.add("bg-primary-button", "text-black");
}

async function loadUsers() {
  // Show loading state
  const container = document.getElementById("users-container");
  container.innerHTML = `
    <div class="w-full max-w-6xl mx-auto p-6 flex items-center justify-center" style="min-height: 200px;">
      <div class="text-center">
        <span class="material-icons-outlined animate-spin-slow text-4xl text-primary-button mb-4">hourglass_empty</span>
        <p class="text-white text-lg">Loading users...</p>
      </div>
    </div>
  `;

  try {
    const response = await fetch("/admin/getAllUsersWithFiles", {
      method: "GET",
      headers: {
        Authorization: authToken,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load users");
    }

    const users = await response.json();
    displayUsers(users);
  } catch (error) {
    console.error("Error loading users:", error);
    container.innerHTML = `
      <div class="w-full max-w-6xl mx-auto p-6 flex items-center justify-center" style="min-height: 200px;">
        <div class="text-center">
          <span class="material-icons-outlined text-4xl text-error mb-4">error</span>
          <p class="text-error text-lg">Failed to load users</p>
          <button onclick="loadUsers()" class="mt-4 px-4 py-2 bg-primary-button text-black rounded-lg hover:bg-primary-button/80 transition-colors">
            Retry
          </button>
        </div>
      </div>
    `;
  }
}

function displayUsers(users) {
  const container = document.getElementById("users-container");
  container.innerHTML = `
        <div class="w-full max-w-6xl mx-auto p-6">
            <h2 class="text-2xl font-bold mb-6 text-white">User Management</h2>
            
            <!-- Search and controls -->
            <div class="mb-6 flex flex-col sm:flex-row gap-4">
              <div class="flex-1">
                <div class="relative">
                  <span class="material-icons-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">search</span>
                  <input type="text" 
                         id="userSearchInput" 
                         placeholder="Search users by username, admin status, or quota..." 
                         class="w-full pl-10 pr-4 py-2 bg-black/30 border border-[#444] rounded-lg text-white focus:border-primary-button focus:outline-none"
                         oninput="filterUsers()">
                </div>
              </div>
              <div class="flex gap-2">
                <select id="userSortSelect" 
                        onchange="sortUsers()" 
                        class="bg-black/30 border border-[#444] text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary-button">
                  <option value="username-asc">Username (A-Z)</option>
                  <option value="username-desc">Username (Z-A)</option>
                  <option value="admin-desc">Admin First</option>
                  <option value="admin-asc">User First</option>
                  <option value="quota-desc">Quota (High to Low)</option>
                  <option value="quota-asc">Quota (Low to High)</option>
                  <option value="files-desc">Files (Most to Least)</option>
                  <option value="files-asc">Files (Least to Most)</option>
                  <option value="date-desc">Created (Newest)</option>
                  <option value="date-asc">Created (Oldest)</option>
                </select>
                <button onclick="loadUsers()" 
                        class="bg-primary-button text-black px-4 py-2 rounded-lg hover:bg-primary-button/80 transition-colors flex items-center gap-2">
                  <span class="material-icons text-sm">refresh</span>
                  Refresh
                </button>
              </div>
            </div>
            
            <div class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-black/30">
                            <tr>
                                <th class="px-4 py-3 text-left text-white border-b border-[#444] cursor-pointer hover:bg-black/10" onclick="sortUsersByColumn('username')">
                                  Username <span class="text-xs text-gray-400">↕</span>
                                </th>
                                <th class="px-4 py-3 text-left text-white border-b border-[#444] cursor-pointer hover:bg-black/10" onclick="sortUsersByColumn('is_admin')">
                                  Admin <span class="text-xs text-gray-400">↕</span>
                                </th>
                                <th class="px-4 py-3 text-left text-white border-b border-[#444] cursor-pointer hover:bg-black/10" onclick="sortUsersByColumn('quota')">
                                  Quota <span class="text-xs text-gray-400">↕</span>
                                </th>
                                <th class="px-4 py-3 text-left text-white border-b border-[#444]">Used</th>
                                <th class="px-4 py-3 text-left text-white border-b border-[#444] cursor-pointer hover:bg-black/10" onclick="sortUsersByColumn('file_count')">
                                  Files <span class="text-xs text-gray-400">↕</span>
                                </th>
                                <th class="px-4 py-3 text-left text-white border-b border-[#444] cursor-pointer hover:bg-black/10" onclick="sortUsersByColumn('creation_date')">
                                  Created <span class="text-xs text-gray-400">↕</span>
                                </th>
                                <th class="px-4 py-3 text-center text-white border-b border-[#444]">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="usersTableBody">
                            ${users.map((user) => createUserRow(user)).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
  
  // Store users data for filtering and sorting
  window.currentUsers = users;
}

function createUserRow(user) {
  const quota = user.quota === 0 ? "Unlimited" : formatBytes(user.quota);
  const used = formatBytes(
    user.files.reduce((sum, file) => sum + file.size, 0),
  );
  const fileCount = user.files.length;
  const createdDate = new Date(user.creation_date).toLocaleDateString();

  return `
        <tr class="border-b border-[#444] hover:bg-black/10 transition-colors">
            <td class="px-4 py-3 text-white font-medium">${user.username}</td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 rounded text-xs font-medium ${
                  user.is_admin
                    ? "bg-primary-button text-black"
                    : "bg-gray-600 text-white"
                }">
                    ${user.is_admin ? "Admin" : "User"}
                </span>
            </td>
            <td class="px-4 py-3 text-white">${quota}</td>
            <td class="px-4 py-3 text-white">${used}</td>
            <td class="px-4 py-3 text-white">${fileCount}</td>
            <td class="px-4 py-3 text-white">${createdDate}</td>
            <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-2">
                    <button onclick="toggleAdminStatus('${user.user_id}', '${user.username}', ${user.is_admin})" 
                            class="bg-purple-500 text-white w-10 h-10 rounded flex items-center justify-center hover:scale-105 transition-transform" 
                            title="Toggle Admin Status">
                        <span class="material-icons text-sm">${user.is_admin ? 'admin_panel_settings' : 'person_add'}</span>
                    </button>
                    <button onclick="changeUserPassword('${user.user_id}', '${user.username}')" 
                            class="bg-primary-button text-black w-10 h-10 rounded flex items-center justify-center hover:scale-105 transition-transform" 
                            title="Change Password">
                        <span class="material-icons text-sm">lock</span>
                    </button>
                    <button onclick="changeUsername('${user.user_id}', '${user.username}')" 
                            class="bg-secondary-button text-black w-10 h-10 rounded flex items-center justify-center hover:scale-105 transition-transform" 
                            title="Change Username">
                        <span class="material-icons text-sm">edit</span>
                    </button>
                    <button onclick="changeQuota('${user.user_id}', '${user.username}', ${user.quota})" 
                            class="bg-yellow-500 text-black w-10 h-10 rounded flex items-center justify-center hover:scale-105 transition-transform" 
                            title="Change Quota">
                        <span class="material-icons text-sm">storage</span>
                    </button>
                    <button onclick="deleteUser('${user.user_id}', '${user.username}')" 
                            class="bg-error text-white w-10 h-10 rounded flex items-center justify-center hover:scale-105 transition-transform" 
                            title="Delete User">
                        <span class="material-icons text-sm">delete</span>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

async function loadAllFiles() {
  // Show loading state
  const container = document.getElementById("all-files-container");
  container.innerHTML = `
    <div class="w-full max-w-6xl mx-auto p-6 flex items-center justify-center" style="min-height: 200px;">
      <div class="text-center">
        <span class="material-icons-outlined animate-spin-slow text-4xl text-primary-button mb-4">hourglass_empty</span>
        <p class="text-white text-lg">Loading all files...</p>
      </div>
    </div>
  `;

  try {
    const response = await fetch("/admin/getAllUsersWithFiles", {
      method: "GET",
      headers: {
        Authorization: authToken,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load files");
    }

    const users = await response.json();
    const allFiles = [];

    users.forEach((user) => {
      user.files.forEach((file) => {
        allFiles.push({
          ...file,
          username: user.username,
          user_id: user.user_id,
        });
      });
    });

    displayAllFiles(allFiles);
  } catch (error) {
    console.error("Error loading files:", error);
    container.innerHTML = `
      <div class="w-full max-w-6xl mx-auto p-6 flex items-center justify-center" style="min-height: 200px;">
        <div class="text-center">
          <span class="material-icons-outlined text-4xl text-error mb-4">error</span>
          <p class="text-error text-lg">Failed to load files</p>
          <button onclick="loadAllFiles()" class="mt-4 px-4 py-2 bg-primary-button text-black rounded-lg hover:bg-primary-button/80 transition-colors">
            Retry
          </button>
        </div>
      </div>
    `;
  }
}

async function loadGlobalStorage() {
  // Show loading state
  const container = document.getElementById("global-storage-container");
  container.innerHTML = `
    <div class="w-full max-w-4xl mx-auto p-6 flex items-center justify-center" style="min-height: 200px;">
      <div class="text-center">
        <span class="material-icons-outlined animate-spin-slow text-4xl text-primary-button mb-4">hourglass_empty</span>
        <p class="text-white text-lg">Loading storage statistics...</p>
      </div>
    </div>
  `;

  try {
    const response = await fetch("/admin/getGlobalStorageStats", {
      method: "GET",
      headers: {
        Authorization: authToken,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load global storage stats");
    }

    const stats = await response.json();
    displayGlobalStorage(stats);
  } catch (error) {
    console.error("Error loading global storage stats:", error);
    container.innerHTML = `
      <div class="w-full max-w-4xl mx-auto p-6 flex items-center justify-center" style="min-height: 200px;">
        <div class="text-center">
          <span class="material-icons-outlined text-4xl text-error mb-4">error</span>
          <p class="text-error text-lg">Failed to load storage statistics</p>
          <button onclick="loadGlobalStorage()" class="mt-4 px-4 py-2 bg-primary-button text-black rounded-lg hover:bg-primary-button/80 transition-colors">
            Retry
          </button>
        </div>
      </div>
    `;
  }
}

function displayAllFiles(files) {
  const container = document.getElementById("all-files-container");
  container.innerHTML = `
        <div class="w-full max-w-6xl mx-auto p-6">
            <h2 class="text-2xl font-bold mb-6 text-white">All Files</h2>
            
            <!-- Search and controls -->
            <div class="mb-6 flex flex-col sm:flex-row gap-4">
              <div class="flex-1">
                <div class="relative">
                  <span class="material-icons-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">search</span>
                  <input type="text" 
                         id="fileSearchInput" 
                         placeholder="Search files by code, filename, owner, type, or size..." 
                         class="w-full pl-10 pr-4 py-2 bg-black/30 border border-[#444] rounded-lg text-white focus:border-primary-button focus:outline-none"
                         oninput="filterFiles()">
                </div>
              </div>
              <div class="flex gap-2">
                <select id="fileSortSelect" 
                        onchange="sortFiles()" 
                        class="bg-black/30 border border-[#444] text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary-button">
                  <option value="filename-asc">Filename (A-Z)</option>
                  <option value="filename-desc">Filename (Z-A)</option>
                  <option value="owner-asc">Owner (A-Z)</option>
                  <option value="owner-desc">Owner (Z-A)</option>
                  <option value="size-desc">Size (Largest)</option>
                  <option value="size-asc">Size (Smallest)</option>
                  <option value="type-asc">Type (A-Z)</option>
                  <option value="type-desc">Type (Z-A)</option>
                  <option value="date-desc">Date (Newest)</option>
                  <option value="date-asc">Date (Oldest)</option>
                </select>
                <button onclick="loadAllFiles()" 
                        class="bg-primary-button text-black px-4 py-2 rounded-lg hover:bg-primary-button/80 transition-colors flex items-center gap-2">
                  <span class="material-icons text-sm">refresh</span>
                  Refresh
                </button>
              </div>
            </div>
            
            <div class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-black/30">
                            <tr>
                                <th class="px-4 py-3 text-left text-white border-b border-[#444] cursor-pointer hover:bg-black/10" onclick="sortFilesByColumn('id')">
                                  Code <span class="text-xs text-gray-400">↕</span>
                                </th>
                                <th class="px-4 py-3 text-left text-white border-b border-[#444] cursor-pointer hover:bg-black/10" onclick="sortFilesByColumn('originalname')">
                                  Filename <span class="text-xs text-gray-400">↕</span>
                                </th>
                                <th class="px-4 py-3 text-left text-white border-b border-[#444] cursor-pointer hover:bg-black/10" onclick="sortFilesByColumn('username')">
                                  Owner <span class="text-xs text-gray-400">↕</span>
                                </th>
                                <th class="px-4 py-3 text-left text-white border-b border-[#444] cursor-pointer hover:bg-black/10" onclick="sortFilesByColumn('size')">
                                  Size <span class="text-xs text-gray-400">↕</span>
                                </th>
                                <th class="px-4 py-3 text-left text-white border-b border-[#444] cursor-pointer hover:bg-black/10" onclick="sortFilesByColumn('mimetype')">
                                  Type <span class="text-xs text-gray-400">↕</span>
                                </th>
                                <th class="px-4 py-3 text-left text-white border-b border-[#444] cursor-pointer hover:bg-black/10" onclick="sortFilesByColumn('date_added')">
                                  Date <span class="text-xs text-gray-400">↕</span>
                                </th>
                                <th class="px-4 py-3 text-center text-white border-b border-[#444]">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="filesTableBody">
                            ${files.map((file) => createFileRow(file)).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
  
  // Store files data for filtering and sorting
  window.currentFiles = files;
}

function displayGlobalStorage(stats) {
  const container = document.getElementById("global-storage-container");
  const limitText = stats.limit === 0 ? "Unlimited" : formatBytes(stats.limit);
  const usedText = formatBytes(stats.used);
  const remainingText = stats.remaining === null ? "Unlimited" : formatBytes(stats.remaining);
  const percentage = stats.percentage;
  
  // Determine progress bar color based on usage
  let progressBarColor = "bg-ok";
  if (percentage > 90) {
    progressBarColor = "bg-error";
  } else if (percentage > 75) {
    progressBarColor = "bg-yellow-500";
  }
  
  container.innerHTML = `
        <div class="w-full max-w-4xl mx-auto p-6">
            <h2 class="text-2xl font-bold mb-6 text-white">Global Storage Statistics</h2>
            
            <!-- Storage Overview Card -->
            <div class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] p-6 mb-6">
                <h3 class="text-lg font-semibold text-white mb-4">Storage Overview</h3>
                
                <!-- Progress Bar -->
                <div class="mb-6">
                    <div class="flex justify-between text-sm text-gray-300 mb-2">
                        <span>Storage Usage</span>
                        <span>${percentage}%</span>
                    </div>
                    <div class="w-full bg-black/30 rounded-full h-4 overflow-hidden">
                        <div class="${progressBarColor} h-full rounded-full transition-all duration-300" 
                             style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                </div>
                
                <!-- Stats Grid -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-black/30 rounded-lg p-4 border border-[#444]">
                        <div class="text-gray-400 text-sm mb-1">Total Limit</div>
                        <div class="text-white text-xl font-bold">${limitText}</div>
                    </div>
                    <div class="bg-black/30 rounded-lg p-4 border border-[#444]">
                        <div class="text-gray-400 text-sm mb-1">Used Space</div>
                        <div class="text-white text-xl font-bold">${usedText}</div>
                    </div>
                    <div class="bg-black/30 rounded-lg p-4 border border-[#444]">
                        <div class="text-gray-400 text-sm mb-1">Remaining</div>
                        <div class="text-white text-xl font-bold">${remainingText}</div>
                    </div>
                </div>
                
                ${stats.limit === 0 ? 
                    '<div class="mt-4 p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg">' +
                    '<p class="text-blue-300 text-sm">📊 Global storage limit is not set. Users can upload files without a global limit.</p>' +
                    '</div>' : 
                    percentage > 90 ? 
                    '<div class="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">' +
                    '<p class="text-red-300 text-sm">⚠️ Storage usage is critically high. Consider cleaning up old files or increasing the storage limit.</p>' +
                    '</div>' :
                    percentage > 75 ?
                    '<div class="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">' +
                    '<p class="text-yellow-300 text-sm">⚠️ Storage usage is getting high. Monitor usage closely.</p>' +
                    '</div>' : ''
                }
            </div>
            
            <!-- Configuration Info -->
            <div class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] p-6">
                <h3 class="text-lg font-semibold text-white mb-4">Configuration</h3>
                
                <!-- Storage Limit Modifier -->
                <div class="mb-6">
                    <label class="block text-gray-300 text-sm font-medium mb-2">
                        Global Storage Limit
                    </label>
                    <div class="flex gap-3">
                        <select id="storageLimitUnit" class="bg-black/30 border border-[#444] text-white px-3 py-2 rounded-lg focus:outline-none focus:border-primary-button">
                            <option value="0">Unlimited</option>
                            <option value="104857600">100 MB</option>
                            <option value="1073741824">1 GB</option>
                            <option value="10737418240">10 GB</option>
                            <option value="107374182400">100 GB</option>
                            <option value="custom">Custom...</option>
                        </select>
                        <input type="number" id="customStorageLimit" placeholder="Bytes" min="104857600" max="1099511627776" 
                               class="bg-black/30 border border-[#444] text-white px-3 py-2 rounded-lg focus:outline-none focus:border-primary-button hidden">
                        <button onclick="updateGlobalStorageLimit()" 
                                class="bg-primary-button text-black px-4 py-2 rounded-lg hover:bg-primary-button/80 transition-colors">
                            Update Limit
                        </button>
                    </div>
                    <div id="storageLimitMessage" class="mt-2 text-sm hidden"></div>
                </div>
                
                <div class="space-y-2">
                    <div class="flex justify-between">
                        <span class="text-gray-300">Current Value:</span>
                        <code class="text-primary-button font-mono text-sm">${stats.limit} bytes</code>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-300">Status:</span>
                        <span class="${stats.limit === 0 ? 'text-blue-400' : percentage > 90 ? 'text-red-400' : 'text-ok'} font-medium">
                            ${stats.limit === 0 ? 'Unlimited' : percentage > 90 ? 'Critical' : 'Normal'}
                        </span>
                    </div>
                </div>
                
                <div class="mt-4 p-3 bg-black/30 rounded-lg">
                    <p class="text-gray-400 text-sm">
                        💡 Set a global storage limit between 100MB and 1TB, or choose Unlimited for no restrictions.
                    </p>
                </div>
            </div>
        </div>
    `;
}

function createFileRow(file) {
  const date = new Date(file.date_added).toLocaleDateString();

  // Decode filename to handle UTF-8 properly
  let decodedName = file.originalname;
  try {
    decodedName = decodeURIComponent(escape(file.originalname));
  } catch (e) {
    decodedName = file.originalname;
  }

  return `
        <tr class="border-b border-[#444] hover:bg-black/10 transition-colors">
            <td class="px-4 py-3 text-white font-mono">${file.id}</td>
            <td class="px-4 py-3 text-white">${decodedName}</td>
            <td class="px-4 py-3 text-white">${file.username}</td>
            <td class="px-4 py-3 text-white">${formatBytes(file.size)}</td>
            <td class="px-4 py-3 text-white">${file.mimetype}</td>
            <td class="px-4 py-3 text-white">${date}</td>
            <td class="px-4 py-3 text-center flex items-center justify-center gap-2">
                <button onclick="downloadFile('${file.id}')" 
                        class="bg-secondary-button text-black w-10 h-10 rounded flex items-center justify-center hover:scale-105 transition-transform" 
                        title="Download File">
                    <span class="material-icons-outlined text-base">download</span>
                </button>
                <button onclick="deleteFile('${file.id}')" 
                        class="bg-error text-white w-10 h-10 rounded flex items-center justify-center hover:scale-105 transition-transform" 
                        title="Delete File">
                    <span class="material-icons-outlined text-base">delete</span>
                </button>
            </td>
        </tr>
    `;
}

function toggleAdminStatus(userId, username, currentIsAdmin) {
  const action = currentIsAdmin ? "remove admin status from" : "promote";
  const actionText = currentIsAdmin ? "Remove Admin Status" : "Promote to Admin";
  const warningText = currentIsAdmin ? 
    "Removing admin status will revoke all administrative privileges from this user." :
    "Promoting this user will grant them full administrative privileges including user management and file deletion.";
  
  // Create admin status change modal
  const modal = document.createElement("div");
  modal.className =
    "fixed inset-0 bg-black/50 flex items-center justify-center z-50";
  modal.innerHTML = `
        <div class="bg-main border border-[#444] rounded-xl p-6 max-w-md w-full mx-4">
            <h3 class="text-xl font-bold text-white mb-4">${actionText} Confirmation</h3>
            <p class="text-gray-300 mb-4">
                Are you sure you want to ${action} user <span class="text-purple-400 font-bold">${username}</span>?
            </p>
            <div class="bg-black/30 border border-[#444] rounded p-3 mb-4">
                <p class="text-gray-300 text-sm">${warningText}</p>
                ${currentIsAdmin ? '<p class="text-yellow-500 text-sm mt-2">⚠️ Note: There must be at least one admin on the server at all times.</p>' : ''}
            </div>
            
            <div class="mb-4">
                <label class="block text-white text-sm font-medium mb-2">
                    Enter your admin password to confirm:
                </label>
                <input type="password" id="adminPassword" 
                       class="w-full px-3 py-2 bg-black/30 border border-[#444] rounded text-white focus:border-purple-400 focus:outline-none"
                       placeholder="Enter your admin password">
            </div>
            
            <div class="flex gap-3 justify-end">
                <button onclick="this.closest('.fixed').remove()" 
                        class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
                    Cancel
                </button>
                <button onclick="confirmAdminStatusChange('${userId}', '${username}', ${!currentIsAdmin})" 
                        class="px-4 py-2 ${currentIsAdmin ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-purple-500 hover:bg-purple-600'} text-white rounded transition-colors">
                    ${actionText}
                </button>
            </div>
        </div>
    `;
  document.body.appendChild(modal);
  
  // Focus on admin password field
  document.getElementById('adminPassword').focus();
}

function confirmAdminStatusChange(userId, username, newIsAdmin) {
  const adminPassword = document.getElementById('adminPassword').value;
  
  if (!adminPassword) {
    showError('Please enter your admin password');
    return;
  }
  
  // Close modal
  const modals = document.querySelectorAll(".fixed.inset-0");
  modals.forEach(modal => modal.remove());
  
  // Make API call
  updateAdminStatus(userId, newIsAdmin, adminPassword);
}

async function updateAdminStatus(userId, isAdmin, adminPassword) {
  // Show loading notification
  showLoading("Changing admin status...");
  
  try {
    const response = await fetch("/admin/changeAdminStatus", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
      body: JSON.stringify({
        userId,
        isAdmin,
        adminPassword,
      }),
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);

    // Get response as text first to debug
    const responseText = await response.text();
    console.log("Response text:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("JSON parse error:", e);
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    hideLoading();
    
    if (response.ok) {
      showSuccess(data.message || "Admin status changed successfully");
      loadUsers(); // Refresh users list
    } else {
      showError(data.error || "Failed to change admin status");
    }
  } catch (error) {
    hideLoading();
    console.error("Error changing admin status:", error);
    showError(`Failed to change admin status: ${error.message}`);
  }
}

function deleteUser(userId, username) {
  // Create password confirmation modal
  const modal = document.createElement("div");
  modal.className =
    "fixed inset-0 bg-black/50 flex items-center justify-center z-50";
  modal.innerHTML = `
        <div class="bg-main border border-[#444] rounded-xl p-6 max-w-md w-full mx-4">
            <h3 class="text-xl font-bold text-white mb-4">Delete User Confirmation</h3>
            <p class="text-gray-300 mb-4">
                Are you sure you want to delete user <span class="text-error font-bold">${username}</span>? 
                This action will permanently delete:
            </p>
            <ul class="text-gray-300 mb-4 list-disc list-inside">
                <li>The user account</li>
                <li>All files uploaded by this user</li>
                <li>All session tokens for this user</li>
            </ul>
            <p class="text-error font-semibold mb-4">This action cannot be undone!</p>
            
            <div class="mb-4">
                <label class="block text-white text-sm font-medium mb-2">
                    Enter your admin password to confirm:
                </label>
                <input type="password" id="adminPassword" 
                       class="w-full px-3 py-2 bg-black/30 border border-[#444] rounded text-white focus:border-primary-button focus:outline-none"
                       placeholder="Enter your password">
            </div>
            
            <div class="flex gap-3 justify-end">
                <button onclick="closeDeleteModal()" 
                        class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
                    Cancel
                </button>
                <button onclick="confirmDeleteUser('${userId}', '${username}')" 
                        class="px-4 py-2 bg-error text-white rounded hover:bg-red-600 transition-colors">
                    Delete User
                </button>
            </div>
        </div>
    `;

  document.body.appendChild(modal);
  document.getElementById("adminPassword").focus();
}

function closeDeleteModal() {
  const modal = document.querySelector(".fixed.inset-0");
  if (modal) {
    modal.remove();
  }
}

async function confirmDeleteUser(userId, username) {
  const password = document.getElementById("adminPassword").value;

  if (!password) {
    showError("Please enter your admin password");
    return;
  }

  // Show loading notification
  showLoading("Deleting user...");

  try {
    const response = await fetch("/admin/deleteUser", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
      body: JSON.stringify({
        userId: userId,
        adminPassword: password,
      }),
    });

    hideLoading();

    if (response.ok) {
      showSuccess(`User ${username} and all their files have been deleted`);
      closeDeleteModal();
      loadUsers(); // Reload users list
    } else {
      const error = await response.json();
      showError(error.error || "Failed to delete user");
    }
  } catch (error) {
    hideLoading();
    console.error("Error deleting user:", error);
    showError("Failed to delete user");
  }
}

function changeUserPassword(userId, username) {
  // Create password change modal
  const modal = document.createElement("div");
  modal.className =
    "fixed inset-0 bg-black/50 flex items-center justify-center z-50";
  modal.innerHTML = `
        <div class="bg-main border border-[#444] rounded-xl p-6 max-w-md w-full mx-4">
            <h3 class="text-xl font-bold text-white mb-4">Change Password</h3>
            <p class="text-gray-300 mb-4">
                Change password for user <span class="text-primary-button font-bold">${username}</span>
            </p>
            
            <div class="mb-4">
                <label class="block text-white text-sm font-medium mb-2">
                    Enter your admin password:
                </label>
                <input type="password" id="adminPassword" 
                       class="w-full px-3 py-2 bg-black/30 border border-[#444] rounded text-white focus:border-primary-button focus:outline-none"
                       placeholder="Enter your admin password">
            </div>
            
            <div class="mb-6">
                <label class="block text-white text-sm font-medium mb-2">
                    New password (min 6 characters):
                </label>
                <input type="password" id="newPassword" 
                       class="w-full px-3 py-2 bg-black/30 border border-[#444] rounded text-white focus:border-primary-button focus:outline-none"
                       placeholder="Enter new password">
            </div>
            
            <div class="flex gap-3 justify-end">
                <button onclick="this.closest('.fixed').remove()" 
                        class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
                    Cancel
                </button>
                <button onclick="confirmPasswordChange('${userId}', '${username}')" 
                        class="px-4 py-2 bg-primary-button text-black rounded hover:opacity-90 transition-opacity">
                    Change Password
                </button>
            </div>
        </div>
    `;
  document.body.appendChild(modal);
  
  // Focus on admin password field
  document.getElementById('adminPassword').focus();
}

function changeUsername(userId, currentUsername) {
  // Create username change modal
  const modal = document.createElement("div");
  modal.className =
    "fixed inset-0 bg-black/50 flex items-center justify-center z-50";
  modal.innerHTML = `
        <div class="bg-main border border-[#444] rounded-xl p-6 max-w-md w-full mx-4">
            <h3 class="text-xl font-bold text-white mb-4">Change Username</h3>
            <p class="text-gray-300 mb-4">
                Change username for user <span class="text-primary-button font-bold">${currentUsername}</span>
            </p>
            
            <div class="mb-4">
                <label class="block text-white text-sm font-medium mb-2">
                    Enter your admin password:
                </label>
                <input type="password" id="adminPassword" 
                       class="w-full px-3 py-2 bg-black/30 border border-[#444] rounded text-white focus:border-primary-button focus:outline-none"
                       placeholder="Enter your admin password">
            </div>
            
            <div class="mb-6">
                <label class="block text-white text-sm font-medium mb-2">
                    New username (min 3 characters):
                </label>
                <input type="text" id="newUsername" 
                       class="w-full px-3 py-2 bg-black/30 border border-[#444] rounded text-white focus:border-primary-button focus:outline-none"
                       placeholder="Enter new username">
            </div>
            
            <div class="flex gap-3 justify-end">
                <button onclick="this.closest('.fixed').remove()" 
                        class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
                    Cancel
                </button>
                <button onclick="confirmUsernameChange('${userId}', '${currentUsername}')" 
                        class="px-4 py-2 bg-secondary-button text-black rounded hover:opacity-90 transition-opacity">
                    Change Username
                </button>
            </div>
        </div>
    `;
  document.body.appendChild(modal);
  
  // Focus on admin password field
  document.getElementById('adminPassword').focus();
}

function changeQuota(userId, username, currentQuota) {
  const currentQuotaText = currentQuota === 0 ? "Unlimited" : formatBytes(currentQuota);
  
  // Create quota change modal
  const modal = document.createElement("div");
  modal.className =
    "fixed inset-0 bg-black/50 flex items-center justify-center z-50";
  modal.innerHTML = `
        <div class="bg-main border border-[#444] rounded-xl p-6 max-w-md w-full mx-4">
            <h3 class="text-xl font-bold text-white mb-4">Change Quota Confirmation</h3>
            <p class="text-gray-300 mb-4">
                Are you sure you want to change quota for user <span class="text-yellow-500 font-bold">${username}</span>?
            </p>
            <ul class="text-gray-300 mb-4 list-disc list-inside">
                <li>Current quota: <span class="font-mono">${currentQuotaText}</span></li>
                <li>This will affect the user's upload limits</li>
                <li>If quota is exceeded, user cannot upload new files</li>
            </ul>
            <p class="text-yellow-500 font-semibold mb-4">Please verify the new quota carefully!</p>
            
            <div class="mb-4">
                <label class="block text-white text-sm font-medium mb-2">
                    Enter your admin password to confirm:
                </label>
                <input type="password" id="adminPassword" 
                       class="w-full px-3 py-2 bg-black/30 border border-[#444] rounded text-white focus:border-primary-button focus:outline-none"
                       placeholder="Enter your admin password">
            </div>
            
            <div class="mb-6">
                <label class="block text-white text-sm font-medium mb-2">
                    New quota:
                </label>
                <div class="flex gap-2">
                    <input type="number" id="newQuotaValue" 
                           class="flex-1 px-3 py-2 bg-black/30 border border-[#444] rounded text-white focus:border-primary-button focus:outline-none"
                           placeholder="Enter quota value" min="0" step="1">
                    <select id="newQuotaUnit" 
                            class="px-3 py-2 bg-black/30 border border-[#444] rounded text-white focus:border-primary-button focus:outline-none">
                        <option value="0">Unlimited</option>
                        <option value="1024">KB</option>
                        <option value="1048576">MB</option>
                        <option value="1073741824">GB</option>
                    </select>
                </div>
                <p class="text-gray-400 text-xs mt-1">
                    Select "Unlimited" for no quota limit, or choose value + unit
                </p>
            </div>
            
            <div class="flex gap-3 justify-end">
                <button onclick="closeQuotaModal()" 
                        class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
                    Cancel
                </button>
                <button onclick="confirmQuotaChange('${userId}', '${username}')" 
                        class="px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-600 transition-colors">
                    Change Quota
                </button>
            </div>
        </div>
    `;
  document.body.appendChild(modal);
  
  // Focus on admin password field
  document.getElementById('adminPassword').focus();
}

function confirmPasswordChange(userId, username) {
  const adminPassword = document.getElementById('adminPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  
  if (!adminPassword || !newPassword) {
    showError('Please fill in all fields');
    return;
  }
  
  if (newPassword.length < 6) {
    showError('Password must be at least 6 characters long');
    return;
  }
  
  // Close modal
  const modals = document.querySelectorAll(".fixed.inset-0");
  modals.forEach(modal => modal.remove());
  
  // Make API call
  changePassword(userId, newPassword, adminPassword);
}

function confirmUsernameChange(userId, currentUsername) {
  const adminPassword = document.getElementById('adminPassword').value;
  const newUsername = document.getElementById('newUsername').value;
  
  if (!adminPassword || !newUsername) {
    showError('Please fill in all fields');
    return;
  }
  
  if (newUsername.length < 3) {
    showError('Username must be at least 3 characters long');
    return;
  }
  
  // Close modal
  const modals = document.querySelectorAll(".fixed.inset-0");
  modals.forEach(modal => modal.remove());
  
  // Make API call
  updateUsername(userId, newUsername, adminPassword);
}

function closeQuotaModal() {
  const modals = document.querySelectorAll(".fixed.inset-0");
  modals.forEach(modal => modal.remove());
}

function confirmQuotaChange(userId, username) {
  const adminPassword = document.getElementById('adminPassword').value;
  const quotaValue = document.getElementById('newQuotaValue').value;
  const quotaUnit = document.getElementById('newQuotaUnit').value;
  
  if (!adminPassword) {
    showError('Please enter your admin password');
    return;
  }
  
  let newQuota = 0;
  
  if (quotaUnit === '0') {
    // Unlimited quota
    newQuota = 0;
  } else {
    if (!quotaValue || quotaValue === '') {
      showError('Please enter a quota value');
      return;
    }
    
    const value = parseFloat(quotaValue);
    if (isNaN(value) || value < 0) {
      showError('Quota value must be a non-negative number');
      return;
    }
    
    // Calculate bytes: value * unit multiplier
    newQuota = Math.floor(value * parseInt(quotaUnit));
  }
  
  // Close modal
  closeQuotaModal();
  
  // Make API call
  updateQuota(userId, newQuota, adminPassword);
}

async function changePassword(userId, newPassword, adminPassword) {
  try {
    const response = await fetch("/admin/changePassword", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
      body: JSON.stringify({
        userId,
        newPassword,
        adminPassword,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      showSuccess("Password changed successfully");
      loadUsers(); // Refresh the users list
    } else {
      showError(data.error || "Failed to change password");
    }
  } catch (error) {
    console.error("Error changing password:", error);
    showError("Failed to change password");
  }
}

async function updateUsername(userId, newUsername, adminPassword) {
  try {
    const response = await fetch("/admin/changeUsername", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
      body: JSON.stringify({
        userId,
        newUsername,
        adminPassword,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      showSuccess("Username changed successfully");
      loadUsers(); // Refresh the users list
    } else {
      showError(data.error || "Failed to change username");
    }
  } catch (error) {
    console.error("Error changing username:", error);
    showError("Failed to change username");
  }
}

async function updateQuota(userId, newQuota, adminPassword) {
  try {
    const response = await fetch("/admin/changeQuota", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
      body: JSON.stringify({
        userId,
        newQuota,
        adminPassword,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      showSuccess("Quota changed successfully");
      loadUsers(); // Refresh the users list
    } else {
      showError(data.error || "Failed to change quota");
    }
  } catch (error) {
    console.error("Error changing quota:", error);
    showError("Failed to change quota");
  }
}

function downloadFile(fileCode) {
  window.open(`/files/${fileCode}`, "_blank");
}

async function deleteFile(fileCode) {
  if (!confirm("Are you sure you want to delete this file?")) {
    return;
  }

  try {
    const response = await fetch(`/delete/${fileCode}`, {
      method: "GET",
      headers: {
        Authorization: authToken,
      },
    });

    if (response.ok) {
      showSuccess("File deleted successfully");
      // Reload current view
      if (currentView === "users") {
        loadUsers();
      } else if (currentView === "files") {
        loadAllFiles();
      } else if (currentView === "storage") {
        loadGlobalStorage();
      }
    } else {
      throw new Error("Failed to delete file");
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    showError("Failed to delete file");
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function showError(message) {
  // Create error notification
  const notification = document.createElement("div");
  notification.className =
    "fixed top-4 right-4 bg-error text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-down";
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function showSuccess(message) {
  // Create success notification
  const notification = document.createElement("div");
  notification.className =
    "fixed top-4 right-4 bg-ok text-black px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-down";
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Handle storage limit unit change
document.addEventListener('change', function(e) {
  if (e.target && e.target.id === 'storageLimitUnit') {
    const customInput = document.getElementById('customStorageLimit');
    if (e.target.value === 'custom') {
      customInput.classList.remove('hidden');
      customInput.focus();
    } else {
      customInput.classList.add('hidden');
    }
  }
});

// Update global storage limit
async function updateGlobalStorageLimit() {
  const unitSelect = document.getElementById('storageLimitUnit');
  const customInput = document.getElementById('customStorageLimit');
  const messageDiv = document.getElementById('storageLimitMessage');
  
  let limit;
  if (unitSelect.value === 'custom') {
    limit = parseInt(customInput.value);
    if (!limit || limit < 104857600 || limit > 1099511627776) {
      showStorageLimitMessage('Please enter a value between 100MB and 1TB', 'error');
      return;
    }
  } else {
    limit = parseInt(unitSelect.value);
  }
  
  try {
    const response = await fetch('/admin/setGlobalStorageLimit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken
      },
      body: JSON.stringify({ limit })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showStorageLimitMessage('Global storage limit updated successfully!', 'success');
      // Refresh the storage stats after a short delay
      setTimeout(() => {
        loadGlobalStorage();
      }, 1000);
    } else {
      showStorageLimitMessage(data.error || 'Failed to update storage limit', 'error');
    }
  } catch (error) {
    console.error('Error updating storage limit:', error);
    showStorageLimitMessage('Failed to update storage limit', 'error');
  }
}

function showStorageLimitMessage(message, type) {
  const messageDiv = document.getElementById('storageLimitMessage');
  messageDiv.textContent = message;
  messageDiv.classList.remove('hidden', 'text-green-400', 'text-red-400');
  messageDiv.classList.add(type === 'success' ? 'text-green-400' : 'text-red-400');
  
  // Hide message after 3 seconds
  setTimeout(() => {
    messageDiv.classList.add('hidden');
  }, 3000);
}

// Database management functions
async function loadTables() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch("/admin/getTables", {
      method: "GET",
      headers: {
        Authorization: authToken,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to load tables: ${response.status} ${response.statusText}`);
    }

    const tables = await response.json();
    populateTableSelector(tables);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error("Load tables request timed out");
      showError("Request timed out. Please try again.");
    } else {
      console.error("Error loading tables:", error);
      showError("Failed to load database tables");
    }
  }
}

function populateTableSelector(tables) {
  const selector = document.getElementById("tableSelector");
  if (selector) {
    selector.innerHTML = `
      ${tables.map((table, index) => `<option value="${table}" ${index === 0 ? 'selected' : ''}>${table}</option>`).join('')}
    `;
    
    // Automatically load first table data
    if (tables.length > 0) {
      currentTable = tables[0];
      loadTableData();
    }
  }
}

async function loadTableData() {
  const selector = document.getElementById("tableSelector");
  if (!selector) return;
  
  currentTable = selector.value;

  if (!currentTable) {
    clearTable();
    return;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for data loading

    const response = await fetch(`/admin/getTableData?table=${encodeURIComponent(currentTable)}`, {
      method: "GET",
      headers: {
        Authorization: authToken,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to load table data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    displayTableData(data);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error("Load table data request timed out");
      showError("Request timed out. The table might be too large. Please try again.");
    } else {
      console.error("Error loading table data:", error);
      showError("Failed to load table data");
    }
  }
}

function displayTableData(data) {
  const header = document.getElementById("tableHeader");
  const body = document.getElementById("tableBody");
  const sortSelect = document.getElementById("databaseSortSelect");

  if (!header || !body) return;

  if (!data.columns || !data.rows) {
    header.innerHTML = '<tr><th class="px-4 py-3 text-left text-white border-b border-[#444]">No data</th></tr>';
    body.innerHTML = '<tr><td class="px-4 py-3 text-white">No data available</td></tr>';
    if (sortSelect) sortSelect.innerHTML = '<option value="">No sorting</option>';
    return;
  }

  // Store table data for filtering and sorting
  window.currentTableData = data;
  
  // Update sort select options
  if (sortSelect) {
    sortSelect.innerHTML = `
      <option value="">No sorting</option>
      ${data.columns.map((col, index) => 
        `<option value="${index}-asc">${col} (A-Z)</option>
         <option value="${index}-desc">${col} (Z-A)</option>`
      ).join('')}
    `;
  }

  // Create headers with click-to-sort functionality
  header.innerHTML = `
    <tr>
      <th class="px-4 py-3 text-left text-white border-b border-[#444]">#</th>
      ${data.columns.map((col, index) => `
        <th class="px-4 py-3 text-left text-white border-b border-[#444] cursor-pointer hover:bg-black/10" 
            onclick="sortTableByColumn(${index})" title="Click to sort">
          ${col} <span class="text-xs text-gray-400">↕</span>
        </th>
      `).join('')}
    </tr>
  `;

  // Create rows
  body.innerHTML = data.rows.map((row, index) => `
    <tr class="border-b border-[#444] hover:bg-black/10 transition-colors cursor-pointer" 
        onclick="selectRow(this, ${index})">
      <td class="px-4 py-3 text-white font-medium">${index + 1}</td>
      ${row.map((cell, cellIndex) => `
        <td class="px-4 py-3 text-white font-mono text-sm" 
            onclick="selectCell(event, this, ${index}, ${cellIndex})" 
            contenteditable="true"
            data-original-value="${cell === null ? '' : cell}">
          ${cell === null ? '<span class="text-gray-500">NULL</span>' : cell}
        </td>
      `).join('')}
    </tr>
  `).join('');
}

function clearTable() {
  const header = document.getElementById("tableHeader");
  const body = document.getElementById("tableBody");
  if (header) header.innerHTML = '';
  if (body) body.innerHTML = '';
  selectedRow = null;
  selectedCell = null;
}

function selectRow(row, index) {
  // Remove previous selection
  if (selectedRow) {
    selectedRow.classList.remove('bg-primary-button/20');
  }
  
  // Add selection to current row
  selectedRow = row;
  selectedRow.classList.add('bg-primary-button/20');
}

function selectCell(event, cell, rowIndex, cellIndex) {
  event.stopPropagation();
  
  // Remove previous cell selection
  if (selectedCell) {
    selectedCell.classList.remove('ring-2', 'ring-primary-button');
  }
  
  // Add selection to current cell
  selectedCell = cell;
  selectedCell.classList.add('ring-2', 'ring-primary-button');
}

async function updateCell(rowIndex, cellIndex, newValue) {
  if (!currentTable) return;

  try {
    const response = await fetch("/admin/updateCell", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
      body: JSON.stringify({
        table: currentTable,
        rowIndex: rowIndex,
        cellIndex: cellIndex,
        value: newValue.trim() === '' ? null : newValue.trim()
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to update cell");
    }

    showSuccess("Cell updated successfully");
    loadTableData(); // Refresh data
  } catch (error) {
    console.error("Error updating cell:", error);
    showError("Failed to update cell");
    loadTableData(); // Refresh to restore original value
  }
}

function insertRow() {
  if (!currentTable) {
    showError("Please select a table first");
    return;
  }

  // Create insert row modal
  const modal = document.createElement("div");
  modal.className = "fixed inset-0 bg-black/50 flex items-center justify-center z-50";
  modal.innerHTML = `
    <div class="bg-main border border-[#444] rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
      <h3 class="text-xl font-bold text-white mb-4">Insert New Row</h3>
      <div id="insertForm" class="space-y-3">
        <!-- Form fields will be populated here -->
      </div>
      <div class="flex gap-3 justify-end mt-6">
        <button onclick="this.closest('.fixed').remove()" 
                class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
          Cancel
        </button>
        <button onclick="confirmInsertRow()" 
                class="px-4 py-2 bg-secondary-button text-black rounded hover:opacity-90 transition-opacity">
          Insert Row
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Populate form fields
  populateInsertForm();
}

async function populateInsertForm() {
  try {
    const response = await fetch(`/admin/getTableSchema?table=${currentTable}`, {
      method: "GET",
      headers: {
        Authorization: authToken,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get table schema");
    }

    const schema = await response.json();
    const form = document.getElementById("insertForm");
    
    if (form) {
      form.innerHTML = schema.map(column => `
        <div>
          <label class="block text-white text-sm font-medium mb-1">
            ${column.name} ${column.nullable === 'NO' ? '<span class="text-red-400">*</span>' : ''}
          </label>
          <input type="text" 
                 id="insert_${column.name}" 
                 class="w-full px-3 py-2 bg-black/30 border border-[#444] rounded text-white focus:border-primary-button focus:outline-none"
                 placeholder="${column.nullable === 'YES' ? 'NULL or value' : 'Required value'}"
                 ${column.nullable === 'NO' ? 'required' : ''}>
          <div class="text-xs text-gray-400 mt-1">Type: ${column.type}</div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error("Error getting table schema:", error);
    showError("Failed to get table schema");
  }
}

async function confirmInsertRow() {
  try {
    const response = await fetch(`/admin/getTableSchema?table=${currentTable}`, {
      method: "GET",
      headers: {
        Authorization: authToken,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get table schema");
    }

    const schema = await response.json();
    const values = {};
    
    schema.forEach(column => {
      const input = document.getElementById(`insert_${column.name}`);
      if (input) {
        const value = input.value.trim();
        values[column.name] = value === '' ? null : value;
      }
    });

    const insertResponse = await fetch("/admin/insertRow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
      body: JSON.stringify({
        table: currentTable,
        values: values
      }),
    });

    if (!insertResponse.ok) {
      throw new Error("Failed to insert row");
    }

    showSuccess("Row inserted successfully");
    document.querySelector(".fixed.inset-0").remove();
    loadTableData(); // Refresh data
  } catch (error) {
    console.error("Error inserting row:", error);
    showError("Failed to insert row");
  }
}

function deleteSelectedRow() {
  if (!selectedRow) {
    showError("Please select a row to delete");
    return;
  }

  if (!currentTable) {
    showError("Please select a table first");
    return;
  }

  // Create delete confirmation modal
  const modal = document.createElement("div");
  modal.className = "fixed inset-0 bg-black/50 flex items-center justify-center z-50";
  modal.innerHTML = `
    <div class="bg-main border border-[#444] rounded-xl p-6 max-w-md w-full mx-4">
      <h3 class="text-xl font-bold text-white mb-4">Delete Row Confirmation</h3>
      <p class="text-gray-300 mb-4">
        Are you sure you want to delete the selected row? This action cannot be undone!
      </p>
      
      <div class="mb-4">
        <label class="block text-white text-sm font-medium mb-2">
          Enter your admin password to confirm:
        </label>
        <input type="password" id="adminPassword" 
               class="w-full px-3 py-2 bg-black/30 border border-[#444] rounded text-white focus:border-primary-button focus:outline-none"
               placeholder="Enter your admin password">
      </div>
      
      <div class="flex gap-3 justify-end">
        <button onclick="this.closest('.fixed').remove()" 
                class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
          Cancel
        </button>
        <button onclick="confirmDeleteRow()" 
                class="px-4 py-2 bg-error text-white rounded hover:bg-red-600 transition-colors">
          Delete Row
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const passwordInput = document.getElementById("adminPassword");
  if (passwordInput) passwordInput.focus();
}

async function confirmDeleteRow() {
  const passwordInput = document.getElementById("adminPassword");
  if (!passwordInput) return;
  
  const password = passwordInput.value;

  if (!password) {
    showError("Please enter your admin password");
    return;
  }

  try {
    const rowIndex = Array.from(selectedRow.parentNode.children).indexOf(selectedRow);
    
    const response = await fetch("/admin/deleteRow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
      body: JSON.stringify({
        table: currentTable,
        rowIndex: rowIndex,
        adminPassword: password
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to delete row");
    }

    showSuccess("Row deleted successfully");
    document.querySelector(".fixed.inset-0").remove();
    selectedRow = null;
    loadTableData(); // Refresh data
  } catch (error) {
    console.error("Error deleting row:", error);
    showError("Failed to delete row");
  }
}

function clearSelectedCell() {
  if (!selectedCell) {
    showError("Please select a cell to clear");
    return;
  }

  selectedCell.textContent = '';
  selectedCell.focus();
}

function refreshData() {
  if (currentTable) {
    loadTableData();
    showSuccess("Data refreshed");
  } else {
    showError("Please select a table first");
  }
}

async function saveAllChanges() {
  if (!currentTable) {
    showError("Please select a table first");
    return;
  }
  
  // Collect all edited cells and their values
  const editableCells = document.querySelectorAll('#tableBody td[contenteditable="true"]');
  const changes = [];
  
  editableCells.forEach((cell, index) => {
    const row = cell.parentElement;
    const rowIndex = Array.from(row.parentNode.children).indexOf(row);
    const cellIndex = Array.from(row.children).indexOf(cell) - 1; // Subtract 1 for the row number column
    
    const originalValue = cell.dataset.originalValue || '';
    const currentValue = cell.textContent.trim();
    
    if (originalValue !== currentValue) {
      changes.push({
        rowIndex,
        cellIndex,
        value: currentValue === '' ? null : currentValue
      });
    }
  });
  
  if (changes.length === 0) {
    showSuccess("No changes to save");
    return;
  }
  
  showLoading(`Saving ${changes.length} changes...`);
  
  try {
    // Save each change
    for (const change of changes) {
      const response = await fetch("/admin/updateCell", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
        body: JSON.stringify({
          table: currentTable,
          rowIndex: change.rowIndex,
          cellIndex: change.cellIndex,
          value: change.value
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update cell at row ${change.rowIndex + 1}, column ${change.cellIndex + 1}`);
      }
    }
    
    hideLoading();
    showSuccess(`Successfully saved ${changes.length} changes`);
    loadTableData(); // Refresh data to show updated values
  } catch (error) {
    hideLoading();
    console.error("Error saving changes:", error);
    showError(`Failed to save changes: ${error.message}`);
  }
}

// Loading notification functions
function showLoading(message) {
  // Remove any existing loading notifications
  hideLoading();
  
  const notification = document.createElement("div");
  notification.id = "loading-notification";
  notification.className = "fixed top-4 right-4 z-50 bg-black/90 backdrop-blur-md text-white px-6 py-4 rounded-lg shadow-lg border border-[#444] flex items-center gap-3 animate-slide-down";
  notification.innerHTML = `
    <span class="material-icons-outlined animate-spin-slow text-primary-button">hourglass_empty</span>
    <span class="font-medium">${message}</span>
  `;
  
  document.body.appendChild(notification);
}

function hideLoading() {
  const loading = document.getElementById("loading-notification");
  if (loading) {
    loading.remove();
  }
}

// User filtering and sorting functions
function filterUsers() {
  if (!window.currentUsers) return;
  
  const searchTerm = document.getElementById('userSearchInput').value.toLowerCase();
  const filteredUsers = window.currentUsers.filter(user => {
    const username = user.username.toLowerCase();
    const adminStatus = user.is_admin ? 'admin' : 'user';
    const quota = user.quota === 0 ? 'unlimited' : formatBytes(user.quota).toLowerCase();
    const fileCount = user.files.length.toString();
    
    return username.includes(searchTerm) || 
           adminStatus.includes(searchTerm) || 
           quota.includes(searchTerm) ||
           fileCount.includes(searchTerm);
  });
  
  displayFilteredUsers(filteredUsers);
}

function sortUsers() {
  if (!window.currentUsers) return;
  
  const sortValue = document.getElementById('userSortSelect').value;
  const [field, direction] = sortValue.split('-');
  
  const sortedUsers = [...window.currentUsers].sort((a, b) => {
    let aVal, bVal;
    
    switch(field) {
      case 'username':
        aVal = a.username.toLowerCase();
        bVal = b.username.toLowerCase();
        break;
      case 'admin':
        aVal = a.is_admin ? 1 : 0;
        bVal = b.is_admin ? 1 : 0;
        break;
      case 'quota':
        aVal = a.quota;
        bVal = b.quota;
        break;
      case 'files':
        aVal = a.files.length;
        bVal = b.files.length;
        break;
      case 'date':
        aVal = new Date(a.creation_date);
        bVal = new Date(b.creation_date);
        break;
      default:
        return 0;
    }
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
  
  displayFilteredUsers(sortedUsers);
}

function sortUsersByColumn(column) {
  if (!window.currentUsers) return;
  
  // Toggle sort direction
  const currentSort = window.currentUsersSort || { column: null, direction: 'asc' };
  let direction = 'asc';
  
  if (currentSort.column === column && currentSort.direction === 'asc') {
    direction = 'desc';
  }
  
  window.currentUsersSort = { column, direction };
  
  const sortedUsers = [...window.currentUsers].sort((a, b) => {
    let aVal, bVal;
    
    switch(column) {
      case 'username':
        aVal = a.username.toLowerCase();
        bVal = b.username.toLowerCase();
        break;
      case 'is_admin':
        aVal = a.is_admin ? 1 : 0;
        bVal = b.is_admin ? 1 : 0;
        break;
      case 'quota':
        aVal = a.quota;
        bVal = b.quota;
        break;
      case 'file_count':
        aVal = a.files.length;
        bVal = b.files.length;
        break;
      case 'creation_date':
        aVal = new Date(a.creation_date);
        bVal = new Date(b.creation_date);
        break;
      default:
        return 0;
    }
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
  
  displayFilteredUsers(sortedUsers);
}

function displayFilteredUsers(users) {
  const tbody = document.getElementById('usersTableBody');
  if (tbody) {
    tbody.innerHTML = users.map((user) => createUserRow(user)).join("");
  }
}

// File filtering and sorting functions
function filterFiles() {
  if (!window.currentFiles) return;
  
  const searchTerm = document.getElementById('fileSearchInput').value.toLowerCase();
  const filteredFiles = window.currentFiles.filter(file => {
    const code = file.id.toLowerCase();
    const filename = file.originalname.toLowerCase();
    const owner = file.username.toLowerCase();
    const type = file.mimetype.toLowerCase();
    const size = formatBytes(file.size).toLowerCase();
    
    return code.includes(searchTerm) || 
           filename.includes(searchTerm) || 
           owner.includes(searchTerm) || 
           type.includes(searchTerm) ||
           size.includes(searchTerm);
  });
  
  displayFilteredFiles(filteredFiles);
}

function sortFiles() {
  if (!window.currentFiles) return;
  
  const sortValue = document.getElementById('fileSortSelect').value;
  const [field, direction] = sortValue.split('-');
  
  const sortedFiles = [...window.currentFiles].sort((a, b) => {
    let aVal, bVal;
    
    switch(field) {
      case 'filename':
        aVal = a.originalname.toLowerCase();
        bVal = b.originalname.toLowerCase();
        break;
      case 'owner':
        aVal = a.username.toLowerCase();
        bVal = b.username.toLowerCase();
        break;
      case 'size':
        aVal = a.size;
        bVal = b.size;
        break;
      case 'type':
        aVal = a.mimetype.toLowerCase();
        bVal = b.mimetype.toLowerCase();
        break;
      case 'date':
        aVal = new Date(a.date_added);
        bVal = new Date(b.date_added);
        break;
      default:
        return 0;
    }
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
  
  displayFilteredFiles(sortedFiles);
}

function sortFilesByColumn(column) {
  if (!window.currentFiles) return;
  
  // Toggle sort direction
  const currentSort = window.currentFilesSort || { column: null, direction: 'asc' };
  let direction = 'asc';
  
  if (currentSort.column === column && currentSort.direction === 'asc') {
    direction = 'desc';
  }
  
  window.currentFilesSort = { column, direction };
  
  const sortedFiles = [...window.currentFiles].sort((a, b) => {
    let aVal, bVal;
    
    switch(column) {
      case 'id':
        aVal = a.id.toLowerCase();
        bVal = b.id.toLowerCase();
        break;
      case 'originalname':
        aVal = a.originalname.toLowerCase();
        bVal = b.originalname.toLowerCase();
        break;
      case 'username':
        aVal = a.username.toLowerCase();
        bVal = b.username.toLowerCase();
        break;
      case 'size':
        aVal = a.size;
        bVal = b.size;
        break;
      case 'mimetype':
        aVal = a.mimetype.toLowerCase();
        bVal = b.mimetype.toLowerCase();
        break;
      case 'date_added':
        aVal = new Date(a.date_added);
        bVal = new Date(b.date_added);
        break;
      default:
        return 0;
    }
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
  
  displayFilteredFiles(sortedFiles);
}

function displayFilteredFiles(files) {
  const tbody = document.getElementById('filesTableBody');
  if (tbody) {
    tbody.innerHTML = files.map((file) => createFileRow(file)).join("");
  }
}

// Database filtering and sorting functions
function filterTableData() {
  if (!window.currentTableData) return;
  
  const searchTerm = document.getElementById('databaseSearchInput').value.toLowerCase();
  if (!searchTerm) {
    // If search is empty, show all data
    displayFilteredTableData(window.currentTableData);
    return;
  }
  
  const filteredRows = window.currentTableData.rows.filter(row => {
    return row.some(cell => {
      const cellValue = cell === null ? 'null' : String(cell).toLowerCase();
      return cellValue.includes(searchTerm);
    });
  });
  
  const filteredData = {
    columns: window.currentTableData.columns,
    rows: filteredRows
  };
  
  displayFilteredTableData(filteredData);
}

function sortTableData() {
  if (!window.currentTableData) return;
  
  const sortValue = document.getElementById('databaseSortSelect').value;
  if (!sortValue) {
    displayFilteredTableData(window.currentTableData);
    return;
  }
  
  const [columnIndex, direction] = sortValue.split('-');
  const colIndex = parseInt(columnIndex);
  
  const sortedRows = [...window.currentTableData.rows].sort((a, b) => {
    const aVal = a[colIndex] === null ? '' : String(a[colIndex]).toLowerCase();
    const bVal = b[colIndex] === null ? '' : String(b[colIndex]).toLowerCase();
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
  
  const sortedData = {
    columns: window.currentTableData.columns,
    rows: sortedRows
  };
  
  displayFilteredTableData(sortedData);
}

function sortTableByColumn(columnIndex) {
  if (!window.currentTableData) return;
  
  // Toggle sort direction
  const currentSort = window.currentTableSort || { column: null, direction: 'asc' };
  let direction = 'asc';
  
  if (currentSort.column === columnIndex && currentSort.direction === 'asc') {
    direction = 'desc';
  }
  
  window.currentTableSort = { column: columnIndex, direction };
  
  const sortedRows = [...window.currentTableData.rows].sort((a, b) => {
    const aVal = a[columnIndex] === null ? '' : String(a[columnIndex]).toLowerCase();
    const bVal = b[columnIndex] === null ? '' : String(b[columnIndex]).toLowerCase();
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
  
  const sortedData = {
    columns: window.currentTableData.columns,
    rows: sortedRows
  };
  
  displayFilteredTableData(sortedData);
}

function displayFilteredTableData(data) {
  const body = document.getElementById("tableBody");
  if (!body) return;
  
  // Create rows
  body.innerHTML = data.rows.map((row, index) => `
    <tr class="border-b border-[#444] hover:bg-black/10 transition-colors cursor-pointer" 
        onclick="selectRow(this, ${index})">
      <td class="px-4 py-3 text-white font-medium">${index + 1}</td>
      ${row.map((cell, cellIndex) => `
        <td class="px-4 py-3 text-white font-mono text-sm" 
            onclick="selectCell(event, this, ${index}, ${cellIndex})" 
            contenteditable="true"
            data-original-value="${cell === null ? '' : cell}">
          ${cell === null ? '<span class="text-gray-500">NULL</span>' : cell}
        </td>
      `).join('')}
    </tr>
  `).join('');
}
