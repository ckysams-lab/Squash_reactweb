import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa' // 👉 新增這行引入 PWA 套件

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // 👉 新增 PWA 設定區塊
    VitePWA({
      registerType: 'autoUpdate', // 只要有新版本發佈，會在背景自動更新
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'], // 預先快取的靜態資源
      manifest: {
        name: 'BCKLAS Squash Team', // 安裝時顯示的全名
        short_name: '正覺壁球',      // 手機桌面上顯示的短檔名
        description: '正覺壁球校隊管理系統',
        theme_color: '#ffffff',     // 手機狀態列的顏色
        background_color: '#ffffff',// App 啟動時的背景色
        display: 'standalone',      // 隱除瀏覽器網址列，看起來像原生 App
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // 支援 Android 系統自動裁切圖示形狀
          }
        ]
      }
    })
  ],
})
