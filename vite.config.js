// vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// 你的校徽網址
const logoUrl = "https://cdn.jsdelivr.net/gh/ckysams-lab/Squash_reactweb@56552b6e92b3e5d025c5971640eeb4e5b1973e13/image%20(1).png";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', 
      injectRegister: 'auto', // 讓外掛自動在 index.html 注入 Service Worker 註冊代碼
      manifest: {
        name: '正覺壁球管理系統', 
        short_name: '正覺壁球', 
        description: 'CHING KOK SQUASH ACADEMY',
        theme_color: '#2563eb', // 與你 index.html 設定的藍色一致
        background_color: '#2563eb', 
        display: 'standalone', 
        icons: [
          {
            src: logoUrl, // 直接使用你的線上校徽作為 App Icon
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: logoUrl,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // 設定離線快取規則 (這裡設定快取所有圖片、JS 和 CSS 檔案)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}'],
        runtimeCaching: [
          {
            // 將來自 cdn.jsdelivr.net 的外部圖片也快取起來，這樣離線時才能看到校徽！
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'external-image-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 快取 30 天
              },
            }
          }
        ]
      }
    })
  ]
});
