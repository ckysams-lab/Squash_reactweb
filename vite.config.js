import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 以下是為 BCKLAS 壁球校隊系統產生的完整 manifest 設定
      manifest: {
        name: 'BCKLAS 壁球校隊系統',
        short_name: '正覺壁球',
        description: 'BCKLAS 壁球校隊管理系統 (BCKLAS Squash Team Management System)',
        theme_color: '#2563EB', // 這是系統主色調 (藍色)
        background_color: '#F8FAFC', // 這是系統背景色
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'https://cdn.jsdelivr.net/gh/ckysams-lab/Squash_reactweb@56552b6e92b3e5d025c5971640eeb4e5b1973e13/image%20(1).png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'https://cdn.jsdelivr.net/gh/ckysams-lab/Squash_reactweb@56552b6e92b3e5d025c5971640eeb4e5b1973e13/image%20(1).png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
