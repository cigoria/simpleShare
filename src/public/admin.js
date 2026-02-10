// Admin panel JavaScript
let authToken = localStorage.getItem('token');
let currentView = 'users';

// Check admin authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    if (!authToken) {
        window.location.href = '/';
        return;
    }
    
    // Verify admin session
    fetch('/verifySession', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8'
        },
        body: JSON.stringify({ token: authToken })
    })
    .then(response => {
        if (!response.ok) {
            window.location.href = '/';
            return;
        }
        return response.json();
    })
    .then(data => {
        if (data.permission !== 'admin') {
            window.location.href = '/';
            return;
        }
        // Load initial data
        loadUsers();
        setupEventListeners();
    })
    .catch(error => {
        console.error('Authentication error:', error);
        window.location.href = '/';
    });
});

function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.button-container button').forEach(button => {
        button.addEventListener('click', function() {
            const buttonText = this.textContent.trim();
            
            // Update active button styling
            document.querySelectorAll('.button-container button').forEach(btn => {
                btn.classList.remove('bg-primary-button', 'text-black');
                btn.classList.add('bg-gray-600', 'text-white');
            });
            this.classList.remove('bg-gray-600', 'text-white');
            this.classList.add('bg-primary-button', 'text-black');
            
            // Switch views
            if (buttonText === 'Users') {
                currentView = 'users';
                document.getElementById('users-container').classList.remove('hidden');
                document.getElementById('all-files-container').classList.add('hidden');
                loadUsers();
            } else if (buttonText === 'All Files') {
                currentView = 'files';
                document.getElementById('users-container').classList.add('hidden');
                document.getElementById('all-files-container').classList.remove('hidden');
                loadAllFiles();
            }
        });
    });
    
    // Set initial active button
    document.querySelector('.button-container button').classList.add('bg-primary-button', 'text-black');
}

async function loadUsers() {
    try {
        const response = await fetch('/admin/getAllUsersWithFiles', {
            method: 'GET',
            headers: {
                'Authorization': authToken
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load users');
        }
        
        const users = await response.json();
        displayUsers(users);
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Failed to load users');
    }
}

function displayUsers(users) {
    const container = document.getElementById('users-container');
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
                            ${users.map(user => createUserRow(user)).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function createUserRow(user) {
    const quota = user.quota === 0 ? 'Unlimited' : formatBytes(user.quota);
    const used = formatBytes(user.files.reduce((sum, file) => sum + file.size, 0));
    const fileCount = user.files.length;
    const createdDate = new Date(user.creation_date).toLocaleDateString();
    
    return `
        <tr class="border-b border-[#444] hover:bg-black/10 transition-colors">
            <td class="px-4 py-3 text-white font-medium">${user.username}</td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 rounded text-xs font-medium ${
                    user.is_admin ? 'bg-primary-button text-black' : 'bg-gray-600 text-white'
                }">
                    ${user.is_admin ? 'Admin' : 'User'}
                </span>
            </td>
            <td class="px-4 py-3 text-white">${quota}</td>
            <td class="px-4 py-3 text-white">${used}</td>
            <td class="px-4 py-3 text-white">${fileCount}</td>
            <td class="px-4 py-3 text-white">${createdDate}</td>
            <td class="px-4 py-3 text-center">
                <button onclick="viewUserFiles(${user.user_id}, '${user.username}')" 
                        class="bg-primary-button text-black px-3 py-1 rounded text-sm hover:scale-105 transition-transform">
                    View Files
                </button>
            </td>
        </tr>
    `;
}

async function loadAllFiles() {
    try {
        const response = await fetch('/admin/getAllUsersWithFiles', {
            method: 'GET',
            headers: {
                'Authorization': authToken
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load files');
        }
        
        const users = await response.json();
        const allFiles = [];
        
        users.forEach(user => {
            user.files.forEach(file => {
                allFiles.push({
                    ...file,
                    username: user.username,
                    user_id: user.user_id
                });
            });
        });
        
        displayAllFiles(allFiles);
    } catch (error) {
        console.error('Error loading files:', error);
        showError('Failed to load files');
    }
}

function displayAllFiles(files) {
    const container = document.getElementById('all-files-container');
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
                            ${files.map(file => createFileRow(file)).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function createFileRow(file) {
    const date = new Date(file.date_added).toLocaleDateString();
    
    // Decode filename to handle UTF-8 properly (same fix as in main app)
    let decodedName = file.originalname;
    try {
      // If name is double-encoded, decode it
      decodedName = decodeURIComponent(escape(file.originalname));
    } catch (e) {
      // If decoding fails, use original name
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
                        class="bg-secondary-button text-black p-2 rounded text-sm hover:scale-105 transition-transform">
                    <span class="material-icons-outlined text-base">download</span>
                </button>
                <button onclick="deleteFile('${file.id}')" 
                        class="bg-error text-white p-2 rounded text-sm hover:scale-105 transition-transform">
                    <span class="material-icons-outlined text-base">delete</span>
                </button>
            </td>
        </tr>
    `;
}

function viewUserFiles(userId, username) {
    // Switch to files view and filter by user
    currentView = 'files';
    document.getElementById('users-container').classList.add('hidden');
    document.getElementById('all-files-container').classList.remove('hidden');
    
    // Update button states
    document.querySelectorAll('.button-container button').forEach(btn => {
        btn.classList.remove('bg-primary-button', 'text-black');
        btn.classList.add('bg-gray-600', 'text-white');
    });
    document.querySelectorAll('.button-container button')[1].classList.remove('bg-gray-600', 'text-white');
    document.querySelectorAll('.button-container button')[1].classList.add('bg-primary-button', 'text-black');
    
    // Load files for specific user
    loadUserFiles(userId, username);
}

async function loadUserFiles(userId, username) {
    try {
        const response = await fetch('/admin/getAllUsersWithFiles', {
            method: 'GET',
            headers: {
                'Authorization': authToken
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load files');
        }
        
        const users = await response.json();
        const user = users.find(u => u.user_id === userId);
        
        if (user) {
            const files = user.files.map(file => ({
                ...file,
                username: user.username,
                user_id: user.user_id
            }));
            
            const container = document.getElementById('all-files-container');
            container.innerHTML = `
                <div class="w-full max-w-6xl mx-auto p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-2xl font-bold text-white">Files for ${username}</h2>
                        <button onclick="loadAllFiles()" 
                                class="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors">
                            Back to All Files
                        </button>
                    </div>
                    <div class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] overflow-hidden">
                        <div class="overflow-x-auto">
                            <table class="w-full">
                                <thead class="bg-black/30">
                                    <tr>
                                        <th class="px-4 py-3 text-left text-white border-b border-[#444]">Code</th>
                                        <th class="px-4 py-3 text-left text-white border-b border-[#444]">Filename</th>
                                        <th class="px-4 py-3 text-left text-white border-b border-[#444]">Size</th>
                                        <th class="px-4 py-3 text-left text-white border-b border-[#444]">Type</th>
                                        <th class="px-4 py-3 text-left text-white border-b border-[#444]">Date</th>
                                        <th class="px-4 py-3 text-center text-white border-b border-[#444]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${files.map(file => {
                                        // Decode filename to handle UTF-8 properly (same fix as in main app)
                                        let decodedName = file.originalname;
                                        try {
                                          // If name is double-encoded, decode it
                                          decodedName = decodeURIComponent(escape(file.originalname));
                                        } catch (e) {
                                          // If decoding fails, use original name
                                          decodedName = file.originalname;
                                        }
                                        
                                        return `
                                        <tr class="border-b border-[#444] hover:bg-black/10 transition-colors">
                                            <td class="px-4 py-3 text-white font-mono">${file.id}</td>
                                            <td class="px-4 py-3 text-white">${decodedName}</td>
                                            <td class="px-4 py-3 text-white">${formatBytes(file.size)}</td>
                                            <td class="px-4 py-3 text-white">${file.mimetype}</td>
                                            <td class="px-4 py-3 text-white">${new Date(file.date_added).toLocaleDateString()}</td>
                                            <td class="px-4 py-3 text-center flex items-center justify-center gap-2">
                                                <button onclick="downloadFile('${file.id}')" 
                                                        class="bg-secondary-button text-black p-2 rounded text-sm hover:scale-105 transition-transform">
                                                    <span class="material-icons-outlined text-base">download</span>
                                                </button>
                                                <button onclick="deleteFile('${file.id}')" 
                                                        class="bg-error text-white p-2 rounded text-sm hover:scale-105 transition-transform">
                                                    <span class="material-icons-outlined text-base">delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    `;}).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading user files:', error);
        showError('Failed to load user files');
    }
}

function downloadFile(fileCode) {
    window.open(`/files/${fileCode}`, '_blank');
}

async function deleteFile(fileCode) {
    if (!confirm('Are you sure you want to delete this file?')) {
        return;
    }
    
    try {
        const response = await fetch(`/delete/${fileCode}`, {
            method: 'GET',
            headers: {
                'Authorization': authToken
            }
        });
        
        if (response.ok) {
            showSuccess('File deleted successfully');
            // Reload current view
            if (currentView === 'users') {
                loadUsers();
            } else {
                loadAllFiles();
            }
        } else {
            throw new Error('Failed to delete file');
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        showError('Failed to delete file');
    }
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showError(message) {
    // Create error notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-error text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-down';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showSuccess(message) {
    // Create success notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-ok text-black px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-down';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}