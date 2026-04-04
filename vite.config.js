// vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy'; // <-- 導入插件

export default defineConfig({
  plugins: [
    react(),
    // --- v3.5 FIX: Configure the plugin to copy the worker file ---
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/pdfjs-dist/build/pdf.worker.min.js',
          dest: '' // Copies to the root of the output directory
        }
      ]
    })
  ],
});
