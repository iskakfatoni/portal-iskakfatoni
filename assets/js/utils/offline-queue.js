// assets/js/utils/offline-queue.js
// 📶 OFFLINE BUFFER & QUEUEING ENGINE BERBASIS INDEXEDDB
// Menyimpan data presensi lokal saat koneksi internet offline / drop dan auto-sync saat online

import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const DB_NAME = 'PortalAttendanceDB';
const DB_VERSION = 1;
const STORE_NAME = 'pending_attendance_queue';

let dbInstance = null;

/**
 * Membuka koneksi ke IndexedDB PortalAttendanceDB
 */
function openDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    if (!window.indexedDB) {
      console.warn("[OfflineQueue] Peramban ini tidak mendukung IndexedDB.");
      resolve(null);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('created_at_ms', 'created_at_ms', { unique: false });
        store.createIndex('nis', 'nis', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error("[OfflineQueue] Gagal membuka IndexedDB:", event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Memasukkan data presensi ke dalam antrean offline IndexedDB
 * @param {Object} logData - Payload log absensi
 * @returns {Promise<number>} - ID antrean
 */
export async function enqueueAttendance(logData) {
  try {
    const db = await openDB();
    if (!db) {
      // Fallback ke localStorage jika IndexedDB bermasalah
      const localQueue = JSON.parse(localStorage.getItem('portal_fallback_queue') || '[]');
      const item = { ...logData, id: Date.now(), created_at_ms: Date.now(), queued_at: new Date().toISOString() };
      localQueue.push(item);
      localStorage.setItem('portal_fallback_queue', JSON.stringify(localQueue));
      return item.id;
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const item = {
        ...logData,
        created_at_ms: Date.now(),
        queued_at: new Date().toISOString()
      };

      const addRequest = store.add(item);

      addRequest.onsuccess = () => {
        console.log(`[OfflineQueue] Presensi berhasil disimpan ke antrean offline (ID: ${addRequest.result})`);
        resolve(addRequest.result);
      };

      addRequest.onerror = (e) => {
        console.error("[OfflineQueue] Gagal menambahkan ke antrean:", e.target.error);
        reject(e.target.error);
      };
    });
  } catch (err) {
    console.error("[OfflineQueue] Error enqueueAttendance:", err);
    throw err;
  }
}

/**
 * Mengambil semua antrean presensi yang belum tersinkronkan
 * @returns {Promise<Array>}
 */
export async function getPendingQueue() {
  try {
    const db = await openDB();
    if (!db) {
      return JSON.parse(localStorage.getItem('portal_fallback_queue') || '[]');
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || []);
      };

      getAllRequest.onerror = (e) => {
        reject(e.target.error);
      };
    });
  } catch (err) {
    console.error("[OfflineQueue] Error getPendingQueue:", err);
    return [];
  }
}

/**
 * Menghapus 1 item dari antrean setelah berhasil dikirim ke server
 * @param {number|string} id - ID antrean
 */
export async function removeQueuedItem(id) {
  try {
    const db = await openDB();
    if (!db) {
      let localQueue = JSON.parse(localStorage.getItem('portal_fallback_queue') || '[]');
      localQueue = localQueue.filter(item => item.id !== id);
      localStorage.setItem('portal_fallback_queue', JSON.stringify(localQueue));
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const deleteRequest = store.delete(id);

      deleteRequest.onsuccess = () => resolve(true);
      deleteRequest.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error(`[OfflineQueue] Gagal menghapus antrean ID ${id}:`, err);
  }
}

let isFlushing = false;

/**
 * Mengirim seluruh data antrean offline ke Firestore di server
 * @param {Object} firestoreDb - Firestore instance
 * @returns {Promise<{successCount: number, failCount: number}>}
 */
export async function flushAttendanceQueue(firestoreDb) {
  if (isFlushing) return { successCount: 0, failCount: 0 };
  if (!navigator.onLine) {
    console.log("[OfflineQueue] Perangkat masih offline, sinkronisasi ditunda.");
    return { successCount: 0, failCount: 0 };
  }

  isFlushing = true;
  let successCount = 0;
  let failCount = 0;

  try {
    const queue = await getPendingQueue();
    if (queue.length === 0) {
      isFlushing = false;
      return { successCount: 0, failCount: 0 };
    }

    console.log(`[OfflineQueue] Menemukan ${queue.length} presensi tertunda. Memulai sinkronisasi ke Firestore...`);

    for (const item of queue) {
      try {
        const { id, queued_at, created_at_ms, ...firestoreData } = item;

        // Tambahkan flag sync metadata
        firestoreData.created_at = serverTimestamp();
        firestoreData.is_offline_synced = true;
        firestoreData.offline_scanned_at = queued_at || new Date().toISOString();

        await addDoc(collection(firestoreDb, "log_absensi"), firestoreData);
        await removeQueuedItem(id);
        successCount++;
        console.log(`[OfflineQueue] Presensi [${item.nama_siswa} - NIS: ${item.nis}] sukses tersinkronisasi.`);
      } catch (postErr) {
        console.warn(`[OfflineQueue] Gagal sinkronisasi antrean ID ${item.id}:`, postErr.message);
        failCount++;
      }
    }

    if (successCount > 0) {
      console.log(`[OfflineQueue] Selesai: ${successCount} presensi berhasil dikirim ke server.`);
      window.dispatchEvent(new CustomEvent('portal_attendance_synced', {
        detail: { count: successCount }
      }));
    }
  } catch (err) {
    console.error("[OfflineQueue] Error saat flushAttendanceQueue:", err);
  } finally {
    isFlushing = false;
  }

  return { successCount, failCount };
}

/**
 * Mengaktifkan listener otomatis saat jaringan kembali Online
 * @param {Object} firestoreDb - Firestore instance
 * @param {Function} [onSyncSuccess] - Callback saat berhasil sync
 */
export function initAutoSyncListener(firestoreDb, onSyncSuccess = null) {
  // 1. Jalankan flush segera saat aplikasi dimuat jika online
  if (navigator.onLine) {
    setTimeout(() => {
      flushAttendanceQueue(firestoreDb).then((res) => {
        if (res.successCount > 0 && typeof onSyncSuccess === 'function') {
          onSyncSuccess(res.successCount);
        }
      });
    }, 1500);
  }

  // 2. Pasang event listener saat koneksi pulih
  window.addEventListener('online', () => {
    console.log("[OfflineQueue] Jaringan terdeteksi kembali ONLINE! Memulai sinkronisasi...");
    setTimeout(() => {
      flushAttendanceQueue(firestoreDb).then((res) => {
        if (res.successCount > 0 && typeof onSyncSuccess === 'function') {
          onSyncSuccess(res.successCount);
        }
      });
    }, 1000);
  });
}
