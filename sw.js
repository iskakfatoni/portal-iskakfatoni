// sw.js - Service Worker Fix
const CACHE_NAME = 'portal-iskakfatoni-v5';

const LOCAL_ASSETS = [
  './',
  'index.html',
  'portal.html',
  'admin.html',
  'style/style.css',
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

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(LOCAL_ASSETS).catch(err => {
        console.warn('[SW] Caching partial error:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Hapus semua cache versi lama secara paksa
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: ABAIKAN SEMUA TRAFIK FIREBASE / AUTH / FIRESTORE (PENTING!)
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // 1. Jangan cache API Firebase Auth & Firestore sama sekali agar Login Admin & Data Live tidak error
  if (url.includes('firestore.googleapis.com') || 
      url.includes('firebaseio.com') ||
      url.includes('identitytoolkit.googleapis.com') ||
      url.includes('securetoken.googleapis.com') ||
      url.includes('google.googleapis.com') ||
      event.request.method !== 'GET') {
    return; // Biarkan browser memproses langsung ke jaringan (Network Direct)
  }

  // 2. Strategi Network First untuk File HTML agar saat di-refresh SELALU mengambil data terbaru
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        return networkResponse;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // 3. Aset Statis (CSS, Gambar, Font): Cache First, Fallback to Network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      });
    })
  );
});
