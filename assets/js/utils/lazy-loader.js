// assets/js/utils/lazy-loader.js
// Dynamic On-Demand Asset & Library Loader for Maximum Performance & Minimal Mobile Payload

let xlsxPromise = null;
export function loadXLSX() {
  if (typeof window !== 'undefined' && window.XLSX) {
    return Promise.resolve(window.XLSX);
  }
  if (!xlsxPromise) {
    xlsxPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      script.async = true;
      script.onload = () => resolve(window.XLSX);
      script.onerror = (err) => {
        xlsxPromise = null;
        reject(new Error('Gagal memuat modul Excel (XLSX). Silakan periksa koneksi internet Anda.'));
      };
      document.head.appendChild(script);
    });
  }
  return xlsxPromise;
}

let chartPromise = null;
export function loadChartJS() {
  if (typeof window !== 'undefined' && window.Chart) {
    return Promise.resolve(window.Chart);
  }
  if (!chartPromise) {
    chartPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.async = true;
      script.onload = () => resolve(window.Chart);
      script.onerror = (err) => {
        chartPromise = null;
        reject(new Error('Gagal memuat library grafik Chart.js: ' + err));
      };
      document.head.appendChild(script);
    });
  }
  return chartPromise;
}

let confettiPromise = null;
export function loadConfetti() {
  if (typeof window !== 'undefined' && typeof window.confetti === 'function') {
    return Promise.resolve(window.confetti);
  }
  if (!confettiPromise) {
    confettiPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
      script.async = true;
      script.onload = () => resolve(window.confetti);
      script.onerror = (err) => {
        confettiPromise = null;
        reject(new Error('Gagal memuat efek selebrasi: ' + err));
      };
      document.head.appendChild(script);
    });
  }
  return confettiPromise;
}
