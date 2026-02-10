import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 新增：設定為自動更新模式
      registerType: 'autoUpdate',
      
      // 新增：讓 Service Worker 更積極地更新
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
      },

      manifest: { /* ... 您的 manifest 設定 ... */ }
    })
  ],
})
