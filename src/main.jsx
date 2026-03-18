// 檔案：src/main.jsx 的最頂部

// 👇 加入這一行，告訴 Vite 要掛載 PWA 的註冊腳本 👇
import 'virtual:pwa-register';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
