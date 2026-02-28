<template>
  <div class="file-card-container">
    <!-- Single File Card -->
    <div v-if="fileData && fileData.type === 'file'" class="file-card animate-slide-up">
      <div class="file-icon">
        <span class="material-icons-outlined">{{ getFileIcon(fileData) }}</span>
      </div>
      <div class="file-info">
        <div class="file-name" :title="fileData.name">{{ fileData.name }}</div>
        <div class="file-details">
          <span class="file-size">{{ formatBytes(fileData.size) }}</span>
          <span class="separator">•</span>
          <span class="upload-date">Uploaded {{ formatDate(fileData.upload_date) }}</span>
        </div>
      </div>
    </div>

    <!-- Group Card -->
    <div v-else-if="fileData && fileData.type === 'group'" class="group-card animate-slide-up">
      <div class="group-header">
        <div class="group-icon">
          <span class="material-icons-outlined">folder</span>
        </div>
        <div class="group-info">
          <div class="group-name" :title="fileData.name">{{ fileData.name }}</div>
          <div class="group-details">
            <span class="file-count">{{ fileData.files.length }} files</span>
            <span class="separator">•</span>
            <span class="total-size">{{ formatBytes(fileData.total_size) }}</span>
            <span class="separator">•</span>
            <span class="upload-date">Uploaded {{ formatDate(fileData.create_date) }}</span>
          </div>
        </div>
        <button @click="$emit('download-group', fileData.code)" class="collective-download-btn">
          <span class="material-icons-outlined">download</span>
          Download All
        </button>
      </div>
      
      <div class="files-list">
        <div 
          v-for="file in fileData.files" 
          :key="file.code"
          class="file-item"
        >
          <div class="file-icon">
            <span class="material-icons-outlined">{{ getFileIcon(file) }}</span>
          </div>
          <div class="file-info">
            <div class="file-name" :title="file.original_name">{{ file.original_name }}</div>
            <div class="file-details">
              <span class="file-size">{{ formatBytes(file.size) }}</span>
              <span class="separator">•</span>
              <span class="upload-date">Uploaded {{ formatDate(file.upload_date) }}</span>
            </div>
          </div>
          <button @click="$emit('download-file', file.code)" class="download-btn">
            <span class="material-icons-outlined">download</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FileCard',
  props: {
    fileData: {
      type: Object,
      default: null
    }
  },
  emits: ['download-file', 'download-group'],
  methods: {
    getFileIcon(fileData) {
      // Use mimetype if available, otherwise fall back to filename extension
      let mimeType = '';
      if (fileData.mimetype) {
        mimeType = fileData.mimetype.split('/')[0]; // Get the part before '/'
      } else {
        // Fallback to extension if mimetype is not available
        const extension = fileData.name?.split('.').pop().toLowerCase() || 
                         fileData.original_name?.split('.').pop().toLowerCase() || '';
        const extensionToMime = {
          'pdf': 'application/pdf',
          'doc': 'application/msword',
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'txt': 'text/plain',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'gif': 'image/gif',
          'mp3': 'audio/mpeg',
          'wav': 'audio/wav',
          'mp4': 'video/mp4',
          'avi': 'video/x-msvideo',
          'zip': 'application/zip',
          'js': 'application/javascript',
          'css': 'text/css',
          'html': 'text/html',
          'json': 'application/json'
        };
        mimeType = extensionToMime[extension]?.split('/')[0] || 'application';
      }

      const iconMap = {
        'application': 'insert_drive_file',
        'text': 'text_snippet',
        'image': 'image',
        'audio': 'audio_file',
        'video': 'video_file',
        'multipart': 'folder_zip'
      };
      
      return iconMap[mimeType] || iconMap['application'];
    },
    
    formatBytes(bytes) {
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
    },
    
    formatDate(dateString) {
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now - date)
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) {
        return 'today'
      } else if (diffDays === 1) {
        return 'yesterday'
      } else if (diffDays < 7) {
        return `${diffDays} days ago`
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7)
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30)
        return `${months} month${months > 1 ? 's' : ''} ago`
      } else {
        const years = Math.floor(diffDays / 365)
        return `${years} year${years > 1 ? 's' : ''} ago`
      }
    }
  }
}
</script>

<style scoped>
.file-card-container {
  margin-top: 20px;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

.file-card, .group-card {
  background: theme('colors.main');
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.file-card:hover, .group-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.file-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.group-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.file-icon, .group-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
}

.file-icon .material-icons-outlined,
.group-icon .material-icons-outlined {
  font-size: 32px;
  color: theme('colors.text');
}

.file-info, .group-info {
  flex: 1;
  min-width: 0;
}

.file-name, .group-name {
  font-size: 16px;
  font-weight: 600;
  color: theme('colors.text');
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}

.file-details, .group-details {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
}

.separator {
  color: rgba(255, 255, 255, 0.4);
}

.collective-download-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: theme('colors.primary-button');
  color: theme('colors.text');
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.collective-download-btn:hover {
  background: #5a7fff;
  transform: scale(1.05);
}

.collective-download-btn:active {
  transform: scale(0.95);
}

.collective-download-btn .material-icons-outlined {
  font-size: 20px;
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.file-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.file-item .file-icon {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.08);
}

.file-item .file-icon .material-icons-outlined {
  font-size: 28px;
}

.file-item .file-info {
  flex: 1;
}

.file-item .file-name {
  font-size: 14px;
  font-weight: 500;
}

.file-item .file-details {
  font-size: 12px;
}

.download-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: theme('colors.secondary-button');
  color: theme('colors.bg');
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.download-btn:hover {
  background: #4ee883;
  transform: scale(1.1);
}

.download-btn:active {
  transform: scale(0.95);
}

.download-btn .material-icons-outlined {
  font-size: 20px;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .file-card-container {
    margin: 20px 16px 0;
  }
  
  .file-card, .group-card {
    padding: 16px;
  }
  
  .group-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .collective-download-btn {
    width: 100%;
    justify-content: center;
  }
  
  .file-item {
    padding: 10px;
  }
  
  .file-item .file-icon {
    width: 36px;
    height: 36px;
  }
  
  .file-item .file-icon .material-icons-outlined {
    font-size: 18px;
  }
  
  .download-btn {
    width: 32px;
    height: 32px;
  }
  
  .download-btn .material-icons-outlined {
    font-size: 16px;
  }
}

/* Animations */
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
</style>
