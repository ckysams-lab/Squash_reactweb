// src/config.js — 全站設定的單一來源（Single Source of Truth）
// 目的：租戶 ID、版本號不再散落各檔重複寫死，避免「登入了卻讀不到資料」的漂移錯誤。
export const APP_ID = import.meta.env.VITE_APP_ID || 'bcklas-squash-core-v1';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.19';
