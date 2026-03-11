// src/firebase.js
import { initializeApp, deleteApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // 確保有 import getFirestore
import { getMessaging, getToken } from 'firebase/messaging';

// --- Firebase 初始化 ---
let firebaseConfig;
let app = null;
let auth = null;
let db = null;
let messaging = null; // 為了 getMessaging 預留

try {
  const envConfig = import.meta.env?.VITE_FIREBASE_CONFIG;

  if (envConfig) {
    firebaseConfig = JSON.parse(envConfig);
  } 
  else if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    firebaseConfig = JSON.parse(__firebase_config);
  } 
  else {
    throw new Error("Firebase config not found. Please set VITE_FIREBASE_CONFIG in your .env.local file or define __firebase_config globally.");
  }

  if (firebaseConfig) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    // 如果有用到 messaging，可以在這裡初始化
    // messaging = getMessaging(app);
  }
} catch (error) {
  console.error("Firebase 初始化失敗:", error);
}

// 關鍵步驟：將初始化好的實例 export 出去，讓別的檔案可以使用！
export { app, auth, db, messaging }; 

// 如果有需要，也可以把 auth 相關的函數 export 出去，方便使用
export { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword 
};
