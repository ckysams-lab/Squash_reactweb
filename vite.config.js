// vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const logoUrl = "https://cdn.jsdelivr.net/gh/ckysams-lab/Squash_reactweb@56552b6e92b3e5d025c5971640eeb4e5b1973e13/image%20(1).png";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', 
      
      // 👇 修正：改用 script 模式，避免 registerSW.js 404 找不到 👇
      injectRegister: 'script', 
      
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'], 
      manifest: {
        name: '正覺壁球管理系統', 
        short_name: '正覺壁球', 
        description: 'CHING KOK SQUASH ACADEMY',
        theme_color: '#2563eb', 
        background_color: '#2563eb', 
        display: 'standalone', 
        icons: [
          {
            src: logoUrl, 
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}'],
        // 增加一個設定：如果單一檔案超過 2MB 依然快取它 (解決你之前看到的 2.11MB 警告)
        maximumFileSizeToCacheInBytes: 5000000, 
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'external-image-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30 
              },
            }
          }
        ]
      }
    })
  ]
});
