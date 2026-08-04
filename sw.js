// sw.js - Service Worker Cache Portal
const CACHE_NAME = 'portal-iskakfatoni-v1';

// Daftar aset statis yang wajib di-cache agar loading instan
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/admin.html',
  '/portal.html',
  '/style.css',
  '/foto_asn_profile.png',
  '/nisnas_logo_colorful.png',
  '/assets/js/config/firebase-config.js',
  '/guru/index.html',
  '/guru/rekap.html',
  '/link/index.html',
  '/siswa/login.html',
  '/siswa/index.html',
  '/database/db-manager.html',
  '/import-siswa.html',
  // CDN External Assets
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
];

// 1. Install Event: Simpan aset statis ke Cache Storage
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Bersihkan cache versi lama jika ada pembaruan
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

// 3. Fetch Event: Strategi "Stale-While-Revalidate"
// Ambil dari Cache lebih dulu agar instan, lalu perbarui dari Jaringan di latar belakang
self.addEventListener('fetch', (event) => {
  // Abaikan request Firebase Firestore / Realtime DB agar data live tidak ter-cache statis
  if (event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('firebaseio.com') ||
      event.request.url.includes('identitytoolkit')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Jika response valid, perbarui cache lokal
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Jika offline dan request tidak ditemukan di jaringan
      });

      // Kembalikan versi cache jika ada, jika tidak tunggu jaringan
      return cachedResponse || fetchPromise;
    })
  );
});
