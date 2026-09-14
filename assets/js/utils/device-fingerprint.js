// assets/js/utils/device-fingerprint.js
// FUNGSI PURE HARDWARE FINGERPRINT (PERSISTEN, STORAGE-INDEPENDENT / TAHAN HAPUS DATA & CACHE)

async function getAudioFingerprint() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return 'no-audio-ctx';
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const compressor = context.createDynamicsCompressor();

    oscillator.type = 'triangle';
    oscillator.frequency.value = 10000;

    compressor.threshold.value = -50;
    compressor.knee.value = 40;
    compressor.ratio.value = 12;
    compressor.reduction.value = -20;
    compressor.attack.value = 0;
    compressor.release.value = 0.25;

    oscillator.connect(compressor);
    compressor.connect(context.destination);

    oscillator.start(0);
    const audioSig = `${context.sampleRate}_${context.destination.channelCount}_${compressor.reduction.value}`;
    context.close();
    return audioSig;
  } catch (e) {
    return 'audio-err';
  }
}

function getWebGLFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'no-webgl';
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = debugInfo ? (gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '') : '';
    const renderer = debugInfo ? (gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '') : '';
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || '';
    const maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS) ? gl.getParameter(gl.MAX_VIEWPORT_DIMS).join('x') : '';
    return `${vendor}|${renderer}|${maxTextureSize}|${maxViewportDims}`;
  } catch (e) {
    return 'webgl-err';
  }
}

function getCanvas2dHash() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("Portal::IskakFatoni <canvas>", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("Portal::IskakFatoni <canvas>", 4, 17);
    return canvas.toDataURL();
  } catch (e) {
    return 'canvas-err';
  }
}

/**
 * Mengambil atau membuat UUID perangkat unik persisten (LocalStorage + IndexedDB resilience)
 */
async function getOrCreatePersistentDeviceUUID() {
  const STORAGE_KEY = 'portal_persistent_device_uuid';
  const DB_NAME = 'PortalIdentityDB';
  const STORE_NAME = 'identity_store';

  // Helper IndexedDB
  const getIdFromIndexedDB = () => new Promise((resolve) => {
    if (!window.indexedDB) return resolve(null);
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction([STORE_NAME], 'readonly');
        const getReq = tx.objectStore(STORE_NAME).get('device_uuid');
        getReq.onsuccess = () => resolve(getReq.result || null);
        getReq.onerror = () => resolve(null);
      };
      req.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });

  const saveIdToIndexedDB = (uuid) => new Promise((resolve) => {
    if (!window.indexedDB || !uuid) return resolve();
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction([STORE_NAME], 'readwrite');
        tx.objectStore(STORE_NAME).put(uuid, 'device_uuid');
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      };
      req.onerror = () => resolve();
    } catch (e) {
      resolve();
    }
  });

  let uuid = localStorage.getItem(STORAGE_KEY);
  if (!uuid) {
    uuid = await getIdFromIndexedDB();
    if (uuid) {
      localStorage.setItem(STORAGE_KEY, uuid);
    }
  }

  if (!uuid) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      uuid = crypto.randomUUID();
    } else {
      uuid = 'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 10);
    }
    localStorage.setItem(STORAGE_KEY, uuid);
    await saveIdToIndexedDB(uuid);
  } else {
    // Sinkronisasi ulang untuk ketahanan cache
    saveIdToIndexedDB(uuid).catch(() => {});
  }

  return uuid;
}

export async function getHardwareFingerprint() {
  // 0. Prioritaskan ID Native jika berjalan di dalam container aplikasi Android
  if (window.AndroidNativeBridge && typeof window.AndroidNativeBridge.getDeviceId === 'function') {
    try {
      const nativeId = window.AndroidNativeBridge.getDeviceId();
      if (nativeId && nativeId.trim() !== '') {
        return 'HW-' + nativeId.trim().toUpperCase();
      }
    } catch (e) {
      console.warn("Gagal memanggil AndroidNativeBridge.getDeviceId:", e);
    }
  }

  // 1. Ambil sinyal WebGL & Canvas Hardware
  const webglSig = getWebGLFingerprint();
  const canvasSig = getCanvas2dHash();

  // 2. Ambil UUID perangkat persisten unik untuk mencegah collision antar perangkat sejenis
  const persistentUUID = await getOrCreatePersistentDeviceUUID();

  // 3. Gunakan parameter fisik statis
  const screenRes = [screen.width, screen.height].sort((a, b) => a - b).join('x');

  const rawHardwareString = [
    screenRes,                               // Resolusi Layar
    screen.colorDepth || 24,                 // Kedalaman Warna
    window.devicePixelRatio || 1,            // Kerapatan Pixel
    navigator.hardwareConcurrency || 2,      // Jumlah Core CPU
    navigator.deviceMemory || 'unknown',     // Estimasi RAM
    navigator.maxTouchPoints || 0,           // Jumlah Titik Sentuh
    webglSig,                                // Spesifikasi GPU
    canvasSig                                // Font/Render Engine
  ].join('||');

  // 4. Hash Hardware Specs (8 Karakter Pertama)
  const hwBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawHardwareString));
  const hwHex = Array.from(new Uint8Array(hwBuffer)).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 8);

  // 5. Hash Persistent UUID (8 Karakter)
  const uuidBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(persistentUUID));
  const uuidHex = Array.from(new Uint8Array(uuidBuffer)).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 8);

  // Format tetap standar 'HW-XXXXXXXXXXXXXXXX' (16 Hex Karakter) kompatibel dengan seluruh sistem & DB
  return 'HW-' + (hwHex + uuidHex).toUpperCase();
}

// FUNGSI DETEKSI ORIENTASI & RESOLUSI LAYAR REAL-TIME SAAT ABSENSI
export function getScreenOrientationInfo() {
  const width = window.innerWidth || screen.width || 0;
  const height = window.innerHeight || screen.height || 0;
  const isLandscape = width > height || (screen.orientation && screen.orientation.type.includes('landscape'));
  const mode = isLandscape ? 'Landscape 📱↔️' : 'Portrait 📱↕️';
  return `${mode} (${width}x${height})`;
}

