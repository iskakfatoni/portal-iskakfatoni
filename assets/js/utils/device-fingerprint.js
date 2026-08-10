// assets/js/utils/device-fingerprint.js
// FUNGSI HYBRID HARDWARE FINGERPRINT HIERARKIS & KONSISTEN (MULTI-LAYER)

export async function getHardwareFingerprint() {
  // 1. Persistent Device Seed Token (Mencegah bentrok antar HP merk/tipe 100% sama)
  let deviceSeed = localStorage.getItem('portal_device_seed');
  if (!deviceSeed) {
    if (typeof crypto.randomUUID === 'function') {
      deviceSeed = crypto.randomUUID();
    } else {
      const randArr = new Uint8Array(16);
      crypto.getRandomValues(randArr);
      deviceSeed = Array.from(randArr, b => b.toString(16).padStart(2, '0')).join('');
    }
    localStorage.setItem('portal_device_seed', deviceSeed);
  }

  // 2. WebGL Renderer & Vendor Fingerprint
  let gpuVendor = '';
  try {
    const gl = document.createElement('canvas').getContext('webgl') || document.createElement('canvas').getContext('experimental-webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        gpuVendor = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
      }
    }
  } catch (e) {}

  // 3. Canvas 2D Sub-pixel Rendering Hash (Variasi mikro render GPU & font engine)
  let canvas2dHash = '';
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
    canvas2dHash = canvas.toDataURL();
  } catch (e) {}

  // 4. Penggabungan seluruh parameter identifikasi hardware & lingkungan
  const rawString = [
    deviceSeed,
    navigator.userAgent,
    screen.width + 'x' + screen.height + 'x' + (screen.colorDepth || 24),
    navigator.hardwareConcurrency || 2,
    navigator.deviceMemory || 'unknown',
    navigator.language || '',
    gpuVendor,
    canvas2dHash,
    Intl.DateTimeFormat().resolvedOptions().timeZone
  ].join('||');

  // 5. Enkripsi String ke Hash SHA-256 Hex 16 Karakter
  const msgBuffer = new TextEncoder().encode(rawString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return 'HW-' + hashHex.substring(0, 16).toUpperCase();
}
