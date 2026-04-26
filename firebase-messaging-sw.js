// Firebase Cloud Messaging Service Worker
// Harus ada di root agar FCM bisa menemukannya

importScripts('https://www.gstatic.com/firebasejs/12.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBHPvQ6Bt9f6U3wqDz3CG71HNpcFq3RZRI",
  authDomain: "kryonix-7c55e.firebaseapp.com",
  databaseURL: "https://kryonix-7c55e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kryonix-7c55e",
  storageBucket: "kryonix-7c55e.firebasestorage.app",
  messagingSenderId: "917095112473",
  appId: "1:917095112473:web:dd4120a14724e6e6a02f88",
  measurementId: "G-9Y77T2V6H7"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const title = data.title || 'KRYONIX';
  const options = {
    body: data.body || 'Ada notifikasi baru.',
    icon: '/images/icon-192.png',
    badge: '/images/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      orderId: data.orderId || ''
    },
    actions: [
      { action: 'open', title: 'Lihat' },
      { action: 'dismiss', title: 'Tutup' }
    ]
  };

  self.registration.showNotification(title, options);
});
