// ══════════════════════════════════
// KRYONIX Push Notification Module
// ══════════════════════════════════
// Import di halaman yang butuh notif:
// <script type="module" src="push.js"></script>

import { getMessaging, getToken, onMessage, deleteToken } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-messaging.js";

const firebaseConfig = {
  apiKey: "AIzaSyBHPvQ6Bt9f6U3wqDz3CG71HNpcFq3RZRI",
  authDomain: "kryonix-7c55e.firebaseapp.com",
  databaseURL: "https://kryonix-7c55e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kryonix-7c55e",
  storageBucket: "kryonix-7c55e.firebasestorage.app",
  messagingSenderId: "917095112473",
  appId: "1:917095112473:web:dd4120a14724e6e6a02f88",
  measurementId: "G-9Y77T2V6H7"
};

// ★ GANTI dengan VAPID key dari Firebase Console ★
// Cara mendapatkannya:
// 1. Buka https://console.firebase.google.com
// 2. Pilih project KRYONIX
// 3. Klik icon gear ⚙️ → Project settings
// 4. Tab "Cloud Messaging"
// 5. Di bagian "Web configuration" → "Web Push certificates"
// 6. Klik "Generate key pair"
// 7. Copy nilai "Key pair" yang muncul
const VAPID_KEY = "BNaS_CgV4HxEXAMPLE_REPLACE_WITH_YOUR_REAL_VAPID_KEY_HERE_EXAMPLE";

const messaging = getMessaging(firebaseConfig);

// Request permission & get token
export async function requestNotificationPermission(userId) {
  if (!('Notification' in window)) {
    console.warn('Browser tidak support notifikasi.');
    return null;
  }

  if (Notification.permission === 'denied') {
    console.warn('Notifikasi ditolak user.');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Permission tidak granted:', permission);
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js') ||
                                  await registerMessagingSW()
    });

    if (token) {
      console.log('FCM Token:', token);
      // Simpan token ke Firebase Realtime DB
      if (userId && typeof window.saveFCMToken === 'function') {
        await window.saveFCMToken(userId, token);
      }
      return token;
    }
  } catch (err) {
    console.error('Gagal mendapatkan FCM token:', err);
  }
  return null;
}

// Register messaging service worker
async function registerMessagingSW() {
  try {
    return await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    });
  } catch (err) {
    console.error('Gagal register messaging SW:', err);
    return null;
  }
}

// Unsubscribe
export async function unsubscribeNotifications(userId) {
  try {
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (token) {
      await deleteToken(messaging);
      if (userId && typeof window.removeFCMToken === 'function') {
        await window.removeFCMToken(userId, token);
      }
      console.log('Notifikasi di-unsubscribe.');
    }
  } catch (err) {
    console.error('Gagal unsubscribe:', err);
  }
}

// Listen foreground messages
export function onForegroundMessage(callback) {
  onMessage(messaging, (payload) => {
    const data = payload.data || {};
    if (callback) callback(data);
  });
}

// Auto-init foreground listener
onForegroundMessage((data) => {
  // Tampilkan toast/notifikasi inline saat app terbuka
  if (data.title && data.body) {
    showInlineNotification(data);
  }
});

function showInlineNotification(data) {
  // Buat notifikasi banner di atas halaman
  const banner = document.createElement('div');
  banner.id = 'push-banner';
  banner.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
    background: linear-gradient(135deg, #065f46, #064e3b);
    border-bottom: 1px solid #10b981; color: #6ee7b7;
    padding: 12px 16px; display: flex; align-items: center; gap: 12px;
    font-family: 'Space Grotesk', sans-serif; font-size: 14px;
    animation: slideDown 0.3s ease; cursor: pointer;
  `;
  banner.innerHTML = `
    <div style="width:36px;height:36px;border-radius:8px;background:rgba(16,185,129,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
      <i class="fas fa-bell"></i>
    </div>
    <div style="flex:1;min-width:0;">
      <div style="font-weight:700;font-size:13px;color:#a7f3d0;">${data.title}</div>
      <div style="font-size:12px;color:#6ee7b7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${data.body}</div>
    </div>
    <button style="background:none;border:none;color:#6ee7b7;cursor:pointer;padding:4px;font-size:16px;" onclick="this.closest('#push-banner').remove()">&times;</button>
  `;

  // Style animasi
  const style = document.createElement('style');
  style.textContent = `@keyframes slideDown{from{transform:translateY(-100%);opacity:0}to{transform:translateY(0);opacity:1}}`;
  banner.prepend(style);

  // Klik banner → buka URL
  banner.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') {
      const url = data.url || '/';
      if (data.orderId) {
        window.location.href = `/track.html?phone=`;
      } else {
        window.location.href = url;
      }
      banner.remove();
    }
  });

  // Auto dismiss 8 detik
  setTimeout(() => {
    if (document.getElementById('push-banner')) {
      document.getElementById('push-banner').remove();
    }
  }, 8000);

  document.body.prepend(banner);
}

// Export helper
window.KryonixPush = {
  requestPermission: requestNotificationPermission,
  unsubscribe: unsubscribeNotifications,
  onMessage: onForegroundMessage
};

console.log('[KRYONIX Push] Module loaded.');
