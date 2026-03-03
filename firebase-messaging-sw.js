// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.x.x/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.x.x/firebase-messaging-compat.js');

// 貼上您的 Firebase Config (請從專案設定中獲取)
firebase.initializeApp({
  apiKey: "AIzaSyAYm_63S9pKMZ51Qb2ZlCHRsfuGzy2gstw",
  projectId: "squashreact",
  messagingSenderId: "342733564194",
  appId: "1:342733564194:web:7345d90d7d22c0b605dd7b"
});

const messaging = firebase.messaging();

// 背景接收推播時的處理
messaging.onBackgroundMessage(function(payload) {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/pwa-192x192.png'
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
