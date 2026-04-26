// ══════════════════════════════════
// KRYONIX Service Worker
// ══════════════════════════════════

const CACHE_NAME = 'kryonix-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/store.html',
  '/track.html',
  '/chat.html',
  '/login-buyer.html',
  '/tos.html',
  '/faq.html',
  '/partner.html',
  '/testimoni.html',
  '/privacy.html',
  '/manifest.json'
];

const CDN_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
];

// Install — cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Static files dulu (kalau gagal beberapa, tetap jalan)
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Ignore errors untuk static, coba CDN terpisah
        return Promise.allSettled(
          CDN_ASSETS.map(url =>
            fetch(url).then(res => {
              if (res.ok) return cache.put(url, res);
            }).catch(() => {})
          )
        );
      }).then(() => self.skipWaiting());
    })
  );
});

// Activate — hapus cache lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch — network first, fallback cache
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET & Firebase realtime requests
  if (request.method !== 'GET') return;
  if (request.url.includes('firebaseio.com')) return;
  if (request.url.includes('googleapis.com')) return;
  if (request.url.includes('gstatic.com')) return;

  // Untuk halaman HTML & CDN assets: network first
  if (
    request.mode === 'navigate' ||
    request.url.includes('cdn.tailwindcss.com') ||
    request.url.includes('fonts.googleapis.com') ||
    request.url.includes('font-awesome') ||
    request.url.includes('pinimg.com')
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Untuk assets lain: cache first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback untuk navigasi
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// ══════════════════════════════════
// PUSH NOTIFICATION HANDLER
// ══════════════════════════════════

self.addEventListener('push', (event) => {
  let data = { title: 'KRYONIX', body: 'Ada notifikasi baru.', icon: '/images/icon-192.png', url: '/' };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/images/icon-192.png',
    badge: '/images/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      timestamp: Date.now()
    },
    actions: [
      { action: 'open', title: 'Buka' },
      { action: 'dismiss', title: 'Tutup' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Klik notifikasi → buka URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Cek apakah sudah ada tab yang terbuka
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      // Kalau tidak ada, buka tab baru
      return self.clients.openWindow(url);
    })
  );
});
