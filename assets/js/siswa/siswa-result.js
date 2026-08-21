// assets/js/siswa/siswa-result.js
// 🎯 SISWA ATTENDANCE RESULT DISPLAY & CONFETTI CELEBRATION

export function goBack() {
  window.location.href = "../absensi.html";
}
window.goBack = goBack;

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const status = urlParams.get('status');
  const nama = urlParams.get('nama');
  const mapel = urlParams.get('mapel');
  const waktu = urlParams.get('waktu');
  const msg = urlParams.get('msg');

  const iconContainer = document.getElementById('status-icon-container');
  const icon = document.getElementById('status-icon');
  const title = document.getElementById('status-title');
  const message = document.getElementById('status-message');
  const detailBox = document.getElementById('detail-info');

  if (status === 'success') {
    if (iconContainer) iconContainer.className = "w-24 h-24 mx-auto rounded-full flex items-center justify-center text-4xl shadow-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/50";
    if (icon) icon.className = "fa-solid fa-check";
    if (title) {
      title.innerText = "Absensi Berhasil";
      title.classList.add('text-emerald-400');
    }
    if (message) message.innerText = "Data kehadiran Anda telah tercatat secara resmi di server.";

    const resNama = document.getElementById('res-nama');
    const resMapel = document.getElementById('res-mapel');
    const resWaktu = document.getElementById('res-waktu');
    if (resNama) resNama.innerText = nama || '-';
    if (resMapel) resMapel.innerText = mapel || '-';
    if (resWaktu) resWaktu.innerText = waktu || '-';
    if (detailBox) detailBox.classList.remove('hidden');

    // EFEK PERAYAAN
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00F5D4', '#3B82F6', '#ffffff']
      });
    }

  } else if (status === 'already') {
    if (iconContainer) iconContainer.className = "w-24 h-24 mx-auto rounded-full flex items-center justify-center text-4xl shadow-lg bg-amber-500/20 text-amber-400 border border-amber-500/50";
    if (icon) icon.className = "fa-solid fa-triangle-exclamation";
    if (title) {
      title.innerText = "Sudah Absen";
      title.classList.add('text-amber-400');
    }
    if (message) message.innerText = msg || "Anda sudah melakukan presensi pada sesi ini sebelumnya.";
  } else {
    if (iconContainer) iconContainer.className = "w-24 h-24 mx-auto rounded-full flex items-center justify-center text-4xl shadow-lg bg-red-500/20 text-red-400 border border-red-500/50";
    if (icon) icon.className = "fa-solid fa-xmark";
    if (title) {
      title.innerText = "Absensi Gagal";
      title.classList.add('text-red-400');
    }
    if (message) message.innerText = msg || "Terjadi kesalahan saat memproses data. Silakan coba lagi.";
  }
});
