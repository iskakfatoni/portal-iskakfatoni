// sw.js - Service Worker Cache Portal
const CACHE_NAME = 'portal-iskakfatoni-v2';

// 1. Aset lokal repositori
const LOCAL_ASSETS = [
  './',
  'index.html',
  'portal.html',
  'admin.html',
  'style.css',
  'manifest.json',
  'foto_asn_profile.png',
  'nisnas_logo_colorful.png',
  'assets/js/config/firebase-config.js',
  'guru/index.html',
  'guru/rekap.html',
  'link/index.html',
  'siswa/login.html',
  'siswa/index.html',
  'database/db-manager.html',
  'import-siswa.html'
];

// 2. Aset CDN eksternal yang terkena aturan CORS
const EXTERNAL_CDN_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
];

// Install Event: Simpan Aset Lokal & CDN Eksternal secara terpisah
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[Service Worker] Caching local static assets...');
      // Cache aset lokal
      await cache.addAll(LOCAL_ASSETS);

      console.log('[Service Worker] Caching external CDN assets (no-cors mode)...');
      // Cache aset CDN eksternal dengan mode no-cors
      const cdnPromises = EXTERNAL_CDN_ASSETS.map((url) => {
        const req = new Request(url, { mode: 'no-cors' });
        return fetch(req).then((response) => cache.put(url, response)).catch(err => {
          console.warn('[Service Worker] Failed to cache CDN asset:', url, err);
        });
      });

      return Promise.all(cdnPromises);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Bersihkan cache versi lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Melayani Aset dari Cache
self.addEventListener('fetch', (event) => {
  // Abaikan request Firebase/Firestore agar data live tetap realtime
  if (event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('firebaseio.com') ||
      event.request.url.includes('identitytoolkit')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Jangan cache response yang tidak valid atau non-basic kecuali jika memang dibutuhkan
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback jika offline dan aset tidak ada di cache
      });
    })
  );
});
