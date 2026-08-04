// sw.js - Service Worker Cache Portal Iskak Fatoni
const CACHE_NAME = 'portal-iskakfatoni-v3';

// 1. Berkas Lokal Repositori
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

// 2. Library & CDN Eksternal
const EXTERNAL_CDN_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://unpkg.com/html5-qrcode',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[Service Worker] Caching local assets...');
      await cache.addAll(LOCAL_ASSETS);

      console.log('[Service Worker] Caching CDN assets...');
      const cdnPromises = EXTERNAL_CDN_ASSETS.map((url) => {
        const req = new Request(url, { mode: 'no-cors' });
        return fetch(req).then((response) => cache.put(url, response)).catch(err => {
          console.warn('[Service Worker] Failed to cache CDN:', url, err);
        });
      });

      return Promise.all(cdnPromises);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
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

// Fetch Event
self.addEventListener('fetch', (event) => {
  // Abaikan request data Firestore / Auth agar tidak mengganggu sinkronisasi live
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
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Mode offline
      });
    })
  );
});
