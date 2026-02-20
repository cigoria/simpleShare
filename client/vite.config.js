import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
const path = require("path")

export default defineConfig({
  root: path.resolve(__dirname, './'),
  plugins: [vue()],
  build: {
    outDir: '../dist/public',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
