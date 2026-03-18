// vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    // 👇 啟動 PWA 魔法 👇
    VitePWA({
      registerType: 'autoUpdate', // 只要你有更新程式碼，使用者的 App 在背景就會自動更新
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'], // 告訴它把哪些圖片打包進去
      manifest: {
        // 這就像是 App Store 裡的介紹頁面
        name: 'BCKLAS Squash Team Management', 
        short_name: 'BCKLAS Squash', // 安裝在手機桌面上時顯示的名稱 (越短越好)
        description: '正覺壁球校隊專屬管理與戰術分析系統',
        theme_color: '#0f172a', // 系統頂部狀態列的顏色 (這裡用深藍灰色)
        background_color: '#f8fafc', // App 剛啟動還沒載入完時的背景色
        display: 'standalone', // 關鍵！這會讓它隱藏瀏覽器的網址列，看起來像原生 App
        
        // 這是安裝在手機上時需要的各種尺寸的 Icon
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // 讓 Android 系統可以自由裁切 Icon 形狀
          }
        ]
      }
    })
  ]
});
