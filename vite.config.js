// vite.config.js (Version 3.5 - Merged Configuration)

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'; // <-- 導入我們的新插件
// import { VitePWA } from 'vite-plugin-pwa' // 保持 PWA 插件的導入（註解狀態）

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // <-- 保留您原有的 tailwindcss 插件

    // --- v3.5 FIX: 添加 viteStaticCopy 插件來處理 pdf.worker.min.js ---
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/pdfjs-dist/build/pdf.worker.min.js',
          dest: '' // 將檔案複製到部署後的根目錄
        }
      ]
    }),
    
    /*
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'BCKLAS Squash Team',
        short_name: '正覺壁球',
        description: '正覺壁球校隊管理系統',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
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
            purpose: 'any maskable'
          }
        ]
      }
    })
    */
  ],
})

