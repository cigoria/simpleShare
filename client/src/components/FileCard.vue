<template>
  <div class="file-card-container">
    <!-- Single File Card -->
    <div v-if="fileData && fileData.type === 'file'" class="file-card animate-slide-up">
      <div class="file-icon">
        <span class="material-icons-outlined">{{ getFileIcon(fileData.name) }}</span>
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
            <span class="material-icons-outlined">{{ getFileIcon(file.original_name) }}</span>
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
    getFileIcon(filename) {
      const extension = filename.split('.').pop().toLowerCase()
      const iconMap = {
        // Documents
        'pdf': 'picture_as_pdf',
        'doc': 'description',
        'docx': 'description',
        'txt': 'text_snippet',
        'rtf': 'description',
        'odt': 'description',
        
        // Spreadsheets
        'xls': 'table_chart',
        'xlsx': 'table_chart',
        'csv': 'table_chart',
        'ods': 'table_chart',
        
        // Presentations
        'ppt': 'slideshow',
        'pptx': 'slideshow',
        'odp': 'slideshow',
        
        // Images
        'jpg': 'image',
        'jpeg': 'image',
        'png': 'image',
        'gif': 'image',
        'bmp': 'image',
        'svg': 'image',
        'webp': 'image',
        'ico': 'image',
        
        // Audio
        'mp3': 'audio_file',
        'wav': 'audio_file',
        'flac': 'audio_file',
        'aac': 'audio_file',
        'ogg': 'audio_file',
        'm4a': 'audio_file',
        
        // Video
        'mp4': 'video_file',
        'avi': 'video_file',
        'mkv': 'video_file',
        'mov': 'video_file',
        'wmv': 'video_file',
        'flv': 'video_file',
        'webm': 'video_file',
        
        // Archives
        'zip': 'folder_zip',
        'rar': 'folder_zip',
        '7z': 'folder_zip',
        'tar': 'folder_zip',
        'gz': 'folder_zip',
        
        // Code
        'js': 'code',
        'ts': 'code',
        'html': 'code',
        'css': 'code',
        'json': 'code',
        'xml': 'code',
        'py': 'code',
        'java': 'code',
        'cpp': 'code',
        'c': 'code',
        'php': 'code',
        'rb': 'code',
        'go': 'code',
        'rs': 'code',
        
        // Default
        'default': 'insert_drive_file'
      }
      
      return iconMap[extension] || iconMap['default']
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
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.file-card, .group-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
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
  border-bottom: 1px solid #e5e7eb;
}

.file-icon, .group-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: #f3f4f6;
  flex-shrink: 0;
}

.file-icon .material-icons-outlined,
.group-icon .material-icons-outlined {
  font-size: 24px;
  color: #6b7280;
}

.file-info, .group-info {
  flex: 1;
  min-width: 0;
}

.file-name, .group-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-details, .group-details {
  font-size: 14px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 8px;
}

.separator {
  color: #d1d5db;
}

.collective-download-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #3b82f6;
  color: white;
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
  background: #2563eb;
  transform: scale(1.05);
}

.collective-download-btn:active {
  transform: scale(0.95);
}

.collective-download-btn .material-icons-outlined {
  font-size: 18px;
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
  background: #f9fafb;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.file-item:hover {
  background: #f3f4f6;
}

.file-item .file-icon {
  width: 40px;
  height: 40px;
  background: #e5e7eb;
}

.file-item .file-icon .material-icons-outlined {
  font-size: 20px;
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
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.download-btn:hover {
  background: #059669;
  transform: scale(1.1);
}

.download-btn:active {
  transform: scale(0.95);
}

.download-btn .material-icons-outlined {
  font-size: 18px;
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
