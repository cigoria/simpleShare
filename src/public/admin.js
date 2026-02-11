// Admin panel JavaScript
let authToken = localStorage.getItem("token");
let currentView = "users";

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
      if (buttonText === "Users") {
        currentView = "users";
        document.getElementById("users-container").classList.remove("hidden");
        document.getElementById("all-files-container").classList.add("hidden");
        loadUsers();
      } else if (buttonText === "All Files") {
        currentView = "files";
        document.getElementById("users-container").classList.add("hidden");
        document
          .getElementById("all-files-container")
          .classList.remove("hidden");
        loadAllFiles();
      }
    });
  });

  // Set initial active button
  document
    .querySelector(".button-container button")
    .classList.add("bg-primary-button", "text-black");
}

async function loadUsers() {
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
    showError("Failed to load users");
  }
}

function displayUsers(users) {
  const container = document.getElementById("users-container");
  container.innerHTML = `
        <div class="w-full max-w-6xl mx-auto p-6">
            <h2 class="text-2xl font-bold mb-6 text-white">User Management</h2>
            <div class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-black/30">
                            <tr>
                                <th class="px-4 py-3 text-left text-white border-b border-[#444]">Username</th>
                                <th class="px-4 py-3 text-left text-white border-b border-[#444]">Admin</th>
                                <th class="px-4 py-3 text-left text-white border-b border-[#444]">Quota</th>
                                <th class="px-4 py-3 text-left text-white border-b border-[#444]">Used</th>
                                <th class="px-4 py-3 text-left text-white border-b border-[#444]">Files</th>
                                <th class="px-4 py-3 text-left text-white border-b border-[#444]">Created</th>
                                <th class="px-4 py-3 text-center text-white border-b border-[#444]">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map((user) => createUserRow(user)).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
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
    showError("Failed to load files");
  }
}

function displayAllFiles(files) {
  const container = document.getElementById("all-files-container");
  container.innerHTML = `
        <div class="w-full max-w-6xl mx-auto p-6">
            <h2 class="text-2xl font-bold mb-6 text-white">All Files</h2>
            <div class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-black/30">
                            <tr>
                                <th class="px-4 py-3 text-left text-white border-b border-[#444]">Code</th>
                                <th class="px-4 py-3 text-left text-white border-b border-[#444]">Filename</th>
                                <th class="px-4 py-3 text-left text-white border-b border-[#444]">Owner</th>
                                <th class="px-4 py-3 text-left text-white border-b border-[#444]">Size</th>
                                <th class="px-4 py-3 text-left text-white border-b border-[#444]">Type</th>
                                <th class="px-4 py-3 text-left text-white border-b border-[#444]">Date</th>
                                <th class="px-4 py-3 text-center text-white border-b border-[#444]">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${files.map((file) => createFileRow(file)).join("")}
                        </tbody>
                    </table>
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

    if (response.ok) {
      showSuccess(`User ${username} and all their files have been deleted`);
      closeDeleteModal();
      loadUsers(); // Reload the users list
    } else {
      const error = await response.json();
      showError(error.error || "Failed to delete user");
    }
  } catch (error) {
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
  alert('changeQuota called!');
  console.log('changeQuota called with:', { userId, username, currentQuota });
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
  console.log('Quota modal appended to body');
  
  // Focus on admin password field
  document.getElementById('adminPassword').focus();
  console.log('Quota modal admin password field focused');
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

function changeQuota(userId, username, currentQuota) {
  const adminPassword = prompt(`Enter your admin password to change quota for user "${username}":`);
  if (!adminPassword) return;

  const currentQuotaText = currentQuota === 0 ? "Unlimited" : formatBytes(currentQuota);
  const newQuotaInput = prompt(`Enter new quota for user "${username}" (in bytes, 0 for unlimited):\nCurrent quota: ${currentQuotaText}`);
  if (newQuotaInput === null) return;

  const newQuota = parseInt(newQuotaInput);
  if (isNaN(newQuota) || newQuota < 0) {
    showError("Quota must be a non-negative number (0 for unlimited)");
    return;
  }

  updateQuota(userId, newQuota, adminPassword);
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
      } else {
        loadAllFiles();
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
