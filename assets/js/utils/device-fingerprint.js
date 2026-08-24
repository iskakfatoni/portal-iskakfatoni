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

export async function getHardwareFingerprint() {
  // 1. Ambil sinyal WebGL Hardware (Sangat Stabil untuk 1 model HP)
  const webglSig = getWebGLFingerprint();
  const canvasSig = getCanvas2dHash();

  // 2. Gunakan parameter fisik yang 100% STATIS & Tahan Rotasi
  // Menggunakan sort agar ID tidak berubah saat HP dimiringkan (Landscape/Portrait)
  const screenRes = [screen.width, screen.height].sort((a, b) => a - b).join('x');

  const rawString = [
    screenRes,                               // Resolusi Layar (Tahan Rotasi)
    screen.colorDepth || 24,                 // Kedalaman Warna
    window.devicePixelRatio || 1,            // Kerapatan Pixel
    navigator.hardwareConcurrency || 2,      // Jumlah Core CPU
    navigator.deviceMemory || 'unknown',     // Estimasi RAM
    navigator.maxTouchPoints || 0,           // Jumlah Titik Sentuh
    webglSig,                                // Spesifikasi GPU (Sangat Unik)
    canvasSig                                // Font Rendering Engine (DNA Browser/OS)
  ].join('||');

  // 3. Enkripsi String ke Hash SHA-256 Hex 16 Karakter (Persisten Hardware Murni)
  const msgBuffer = new TextEncoder().encode(rawString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return 'HW-' + hashHex.substring(0, 16).toUpperCase();
}

// FUNGSI DETEKSI ORIENTASI & RESOLUSI LAYAR REAL-TIME SAAT ABSENSI
export function getScreenOrientationInfo() {
  const width = window.innerWidth || screen.width || 0;
  const height = window.innerHeight || screen.height || 0;
  const isLandscape = width > height || (screen.orientation && screen.orientation.type.includes('landscape'));
  const mode = isLandscape ? 'Landscape 📱↔️' : 'Portrait 📱↕️';
  return `${mode} (${width}x${height})`;
}

