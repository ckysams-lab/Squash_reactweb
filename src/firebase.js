// src/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';

// 1. 取得並解析設定
let firebaseConfig;
try {
  const envConfig = import.meta.env?.VITE_FIREBASE_CONFIG;
  if (envConfig) {
    firebaseConfig = JSON.parse(envConfig);
  } else if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    firebaseConfig = JSON.parse(__firebase_config);
  } else {
    throw new Error("Firebase config not found.");
  }
} catch (error) {
  console.error("Firebase config parsing failed:", error);
  // 如果設定檔解析失敗，提供一個假的設定以防應用程式直接崩潰 (僅限開發環境)
  firebaseConfig = {}; 
}

// 2. 安全地初始化 App
// 使用 getApps().length 檢查是否已經初始化過，避免重複初始化錯誤 (特別是在熱更新 HMR 時)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 3. 直接宣告並匯出實例 (這可以解決 Cannot access before initialization 的問題)
export const auth = getAuth(app);
export const db = getFirestore(app);

// 4. 啟動離線快取 (在 db 確定建立之後)
if (db) {
    try {
        enableIndexedDbPersistence(db, {
            cacheSizeBytes: CACHE_SIZE_UNLIMITED
        }).catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn("離線快取啟動失敗：可能開啟了多個系統分頁。");
            } else if (err.code === 'unimplemented') {
                console.warn("當前瀏覽器不支援離線快取功能。");
            }
        });
    } catch (e) {
        console.warn("IndexedDB 可能已在運作中", e);
    }
}

// 5. 匯出 auth 相關輔助函式 (可選，如果您習慣從 firebase.js 匯入它們)
export { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword 
};
