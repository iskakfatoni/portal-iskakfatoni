// sw.js - Service Worker Optimized for Performance & Offline PWA
const CACHE_NAME = 'portal-iskakfatoni-v9';

const LOCAL_ASSETS = [
  './',
  'index.html',
  'portal.html',
  'absensi.html',
  'admin.html',
  'perangkat.html',
  'download.html',
  'iphone.html',
  'guru/index.html',
  'guru/rekap.html',
  'siswa/login.html',
  'siswa/scanner.html',
  'siswa/result.html',
  'link/index.html',
  'database/db-manager.html',
  'database/system-logs.html',
  'style/style.css',
  'assets/manifest.json',
  'assets/img/foto_asn_profile.webp',
  'assets/img/nisnas_logo_colorful.webp',
  'assets/js/config/firebase-config.js',
  'assets/js/auth/auth-guard.js',
  'assets/js/utils/device-fingerprint.js',
  'assets/js/utils/toast.js',
  'assets/js/particle/particle-bg.js',
  'assets/js/portal/portal-links.js',
  'assets/js/admin/admin-auth.js',
  'assets/js/absensi/absensi.js',
  'assets/js/guru/guru-dashboard.js',
  'assets/js/guru/rekap.js',
  'assets/js/siswa/siswa-login.js',
  'assets/js/siswa/siswa-scanner.js',
  'assets/js/siswa/siswa-result.js',
  'assets/js/link/link-manager.js',
  'assets/js/database/db-manager.js',
  'assets/js/database/system-logs.js',
  'assets/js/database/ai-insights.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(LOCAL_ASSETS).catch((err) => {
        console.warn('[SW] Cache sebagian gagal dimuat:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Menghapus cache lama:', cache);
            return caches.delete(cache);
          }
          return null;
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Lewati request API Firestore/Google & Non-GET
  if (
    url.includes('firestore.googleapis.com') ||
    url.includes('firebaseio.com') ||
    url.includes('identitytoolkit.googleapis.com') ||
    url.includes('securetoken.googleapis.com') ||
    url.includes('googleapis.com') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // Network-First untuk Dokumen HTML & Navigasi Halaman
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request).then((res) => res || caches.match('./')))
    );
    return;
  }

  // Stale-While-Revalidate untuk Berkas Statis (CSS, JS, Gambar)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
