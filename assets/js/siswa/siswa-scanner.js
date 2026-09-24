// assets/js/siswa/siswa-scanner.js
// 📷 SISWA QR SCANNER & ATTENDANCE SUBMISSION ENGINE

import { db } from "../config/firebase-config.js";
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { getScreenOrientationInfo } from "../utils/device-fingerprint.js";
import { enqueueAttendance } from "../utils/offline-queue.js";

let isProcessing = false;
let html5QrCode = null;

// AUDIO & HAPTIC FEEDBACK SCAN
function triggerSuccessFeedback() {
  try {
    if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.1);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    }
  } catch (e) {}
}

// JEMBATAN UNTUK NATIVE ANDROID
window.receiveNativeScan = function(decodedText) {
  onScanSuccess(decodedText);
};

async function onScanSuccess(decodedText) {
  if (isProcessing) return;

  const savedUserJson = localStorage.getItem('siswa_session') || localStorage.getItem('portal_siswa_user');
  if (!savedUserJson) { window.location.href = "login.html"; return; }

  triggerSuccessFeedback();
  isProcessing = true;
  const webScannerUi = document.getElementById('web-scanner-ui');
  const processingUi = document.getElementById('processing-ui');
  if (webScannerUi) webScannerUi.classList.add('hidden');
  if (processingUi) processingUi.classList.remove('hidden');

  const currentSiswaUser = JSON.parse(savedUserJson);
  const scannedToken = decodedText.trim();

  // Standarisasi data user
  const namaSiswaVal = currentSiswaUser.nama_siswa || currentSiswaUser.nama || "Siswa";
  const idKelasSiswa = currentSiswaUser.id_kelas || "-";
  const namaKelasSiswa = currentSiswaUser.nama_kelas || currentSiswaUser.id_kelas || "-";
  const currentDeviceId = currentSiswaUser.device_id || localStorage.getItem('portal_device_id') || '';

  const now = new Date();
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const hariStr = days[now.getDay()];
  const tanggalStr = now.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
  const waktuStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
  const screenOrientation = getScreenOrientationInfo();

  try {
    // 1. Validasi Sesi QR yang Aktif
    // Cek token utama (current_qr_token)
    let qSesi = query(collection(db, "sesi_absensi"), where("current_qr_token", "==", scannedToken), where("is_active", "==", true));
    let sesiSnap = await getDocs(qSesi);

    // Jika tidak cocok dengan token aktif saat ini, beri grace period 25 detik dengan memeriksa previous_qr_token
    if (sesiSnap.empty) {
      const qPrev = query(collection(db, "sesi_absensi"), where("previous_qr_token", "==", scannedToken), where("is_active", "==", true));
      const prevSnap = await getDocs(qPrev);
      if (!prevSnap.empty) {
        const candidateDoc = prevSnap.docs[0];
        const candidateData = candidateDoc.data();
        const rotTimeMs = candidateData.token_rotated_at?.seconds ? (candidateData.token_rotated_at.seconds * 1000) : 0;
        if (rotTimeMs === 0 || (Date.now() - rotTimeMs) <= 25000) {
          sesiSnap = prevSnap;
        }
      }
    }

    // Jika tetap tidak ditemukan, lakukan diagnosa pesan error yang spesifik dan jelas
    if (sesiSnap.empty) {
      const qAnyActive = query(collection(db, "sesi_absensi"), where("is_active", "==", true));
      const anyActiveSnap = await getDocs(qAnyActive);

      let errorMsg = 'QR Code tidak valid atau sudah kedaluwarsa.';
      if (anyActiveSnap.empty) {
        errorMsg = 'Sesi presensi belum dibuka atau sudah ditutup oleh guru.';
      } else {
        errorMsg = 'QR Code sudah kedaluwarsa karena rotasi waktu. Silakan scan ulang QR terbaru di layar guru.';
      }

      window.location.href = `result.html?status=error&msg=${encodeURIComponent(errorMsg)}`;
      return;
    }

    const sesiDoc = sesiSnap.docs[0];
    const sesiData = sesiDoc.data();

    // 1.1 Proteksi Kedaluwarsa Sesi (> 1 Jam)
    const refTimestamp = sesiData.resumed_at || sesiData.opened_at || sesiData.created_at;
    if (refTimestamp && refTimestamp.seconds) {
      const refTimeMs = refTimestamp.seconds * 1000;
      const nowMs = Date.now();
      if ((nowMs - refTimeMs) > 60 * 60 * 1000) {
        window.location.href = `result.html?status=error&msg=${encodeURIComponent('Sesi presensi sudah kedaluwarsa (> 1 jam). Minta guru membuka sesi baru.')}`;
        return;
      }
    }

    // 2. VALIDASI KETAT KELAS & SEKOLAH
    const studentIdKelasNorm = (idKelasSiswa || "").toLowerCase().replace(/[^a-z0-9]/g, '');
    const studentNamaKelasNorm = (namaKelasSiswa || "").toLowerCase().replace(/[^a-z0-9]/g, '');
    const sessionIdKelasNorm = (sesiData.id_kelas || "").toLowerCase().replace(/[^a-z0-9]/g, '');
    const sessionNamaKelasNorm = (sesiData.nama_kelas || sesiData.id_kelas || "").toLowerCase().replace(/[^a-z0-9]/g, '');

    const studentSchoolNorm = (currentSiswaUser.nama_sekolah || "").toLowerCase().replace(/[^a-z0-9]/g, '');
    const sessionSchoolNorm = (sesiData.nama_sekolah || "").toLowerCase().replace(/[^a-z0-9]/g, '');

    // 2.1 Deteksi Sekolah Silang (Cross-School Detection)
    let isSchoolMismatch = false;
    if (studentSchoolNorm && sessionSchoolNorm) {
      const isMutuStudent = studentSchoolNorm.includes('kemlagi') || studentSchoolNorm.includes('mutu') || studentSchoolNorm.includes('muhammadiyah');
      const isMutuSession = sessionSchoolNorm.includes('kemlagi') || sessionSchoolNorm.includes('mutu') || sessionSchoolNorm.includes('muhammadiyah');
      const isJetisStudent = studentSchoolNorm.includes('jetis');
      const isJetisSession = sessionSchoolNorm.includes('jetis');

      if ((isMutuStudent && !isMutuSession) || (!isMutuStudent && isMutuSession)) isSchoolMismatch = true;
      if ((isJetisStudent && !isJetisSession) || (!isJetisStudent && isJetisSession)) isSchoolMismatch = true;
      if (!isMutuStudent && !isJetisStudent && studentSchoolNorm !== sessionSchoolNorm) isSchoolMismatch = true;
    }

    // 2.2 Deteksi Sekolah dari ID Kelas jika nama_sekolah tidak lengkap
    const isMutuIdStudent = studentIdKelasNorm.includes('mutu');
    const isMutuIdSession = sessionIdKelasNorm.includes('mutu');
    if ((isMutuIdStudent && !isMutuIdSession) || (!isMutuIdStudent && isMutuIdSession)) {
      isSchoolMismatch = true;
    }

    // 2.3 Pencocokan Kelas Presisi
    let isClassMatch = false;
    if (studentIdKelasNorm && sessionIdKelasNorm) {
      isClassMatch = (studentIdKelasNorm === sessionIdKelasNorm);
    }
    if (!isClassMatch && studentNamaKelasNorm && sessionNamaKelasNorm && (studentNamaKelasNorm === sessionNamaKelasNorm)) {
      // Hanya izinkan pencocokan nama_kelas jika tidak ada ketidakcocokan sekolah
      if (!isSchoolMismatch) {
        isClassMatch = true;
      }
    }

    if (!isClassMatch || isSchoolMismatch) {
      const sesiKelasDisplay = sesiData.nama_kelas || sesiData.id_kelas || 'Lain';
      window.location.href = `result.html?status=error&msg=${encodeURIComponent(`Gagal! Anda terdaftar di kelas [${namaKelasSiswa}], bukan sesi kelas [${sesiKelasDisplay}].`)}`;
      return;
    }

    // 3. Cek apakah sudah absen di sesi ini
    const qLog = query(collection(db, "log_absensi"), where("id_sesi", "==", sesiDoc.id), where("nis", "==", currentSiswaUser.nis));
    const logSnap = await getDocs(qLog);

    if (!logSnap.empty) {
      window.location.href = `result.html?status=already&nama=${encodeURIComponent(namaSiswaVal)}&msg=${encodeURIComponent('Anda sudah melakukan presensi sebelumnya pada sesi ini.')}`;
      return;
    }

    // 4. Payload data presensi
    const logPayload = {
      id_sesi: sesiDoc.id,
      nis: currentSiswaUser.nis,
      nama_siswa: namaSiswaVal,
      id_kelas: idKelasSiswa,
      nama_kelas: namaKelasSiswa,
      nama_sekolah: currentSiswaUser.nama_sekolah || sesiData.nama_sekolah || '',
      nama_mapel: sesiData.nama_mapel || "-",
      hari: hariStr,
      tanggal: tanggalStr,
      waktu: waktuStr,
      device_id: currentDeviceId,
      orientasi_layar: screenOrientation,
      status: "Hadir"
    };

    // 5. Coba Simpan ke Firestore, jika jaringan terputus simpan ke Offline Buffer IndexedDB
    try {
      await addDoc(collection(db, "log_absensi"), {
        ...logPayload,
        created_at: serverTimestamp()
      });

      // Redirect ke hasil sukses online
      window.location.href = `result.html?status=success&nama=${encodeURIComponent(namaSiswaVal)}&mapel=${encodeURIComponent(sesiData.nama_mapel)}&waktu=${encodeURIComponent(waktuStr)}`;
    } catch (saveErr) {
      console.warn("Koneksi Firestore gagal saat simpan, mengalihkan ke antrean offline IndexedDB:", saveErr);
      await enqueueAttendance(logPayload);
      window.location.href = `result.html?status=offline_queued&nama=${encodeURIComponent(namaSiswaVal)}&mapel=${encodeURIComponent(sesiData.nama_mapel)}&waktu=${encodeURIComponent(waktuStr)}`;
    }

  } catch (err) {
    console.error("Absensi Scanner Error:", err);
    
    // Jika kegagalan disebabkan oleh jaringan offline saat getDocs
    if (!navigator.onLine || err.message?.toLowerCase().includes('offline') || err.message?.toLowerCase().includes('network')) {
      try {
        const fallbackPayload = {
          id_sesi: "PENDING_LOOKUP",
          scanned_token: scannedToken,
          nis: currentSiswaUser.nis,
          nama_siswa: namaSiswaVal,
          id_kelas: idKelasSiswa,
          nama_kelas: namaKelasSiswa,
          nama_sekolah: currentSiswaUser.nama_sekolah || '',
          nama_mapel: "Presensi Kelas",
          hari: hariStr,
          tanggal: tanggalStr,
          waktu: waktuStr,
          device_id: currentDeviceId,
          orientasi_layar: screenOrientation,
          status: "Hadir"
        };
        await enqueueAttendance(fallbackPayload);
        window.location.href = `result.html?status=offline_queued&nama=${encodeURIComponent(namaSiswaVal)}&mapel=${encodeURIComponent('Presensi Kelas')}&waktu=${encodeURIComponent(waktuStr)}`;
        return;
      } catch (queueErr) {
        console.error("Gagal simpan ke offline queue:", queueErr);
      }
    }

    window.location.href = `result.html?status=error&msg=${encodeURIComponent("Terjadi kesalahan: " + err.message)}`;
  }
}

async function startWebScanner() {
  const processingUi = document.getElementById('processing-ui');
  const webScannerUi = document.getElementById('web-scanner-ui');
  const cameraLoading = document.getElementById('camera-loading');

  if (processingUi) processingUi.classList.add('hidden');
  if (webScannerUi) webScannerUi.classList.remove('hidden');

  if (typeof Html5Qrcode === 'undefined') return;
  html5QrCode = new Html5Qrcode("reader");
  try {
    await html5QrCode.start(
      { facingMode: "environment" }, 
      { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 }, 
      onScanSuccess
    );
    // Optimasi Kamera iOS Webkit
    const videoEl = document.querySelector('#reader video');
    if (videoEl) {
      videoEl.setAttribute('playsinline', 'true');
      videoEl.setAttribute('webkit-playsinline', 'true');
    }
    if (cameraLoading) cameraLoading.classList.add('hidden');
  } catch (e) {
    console.error("Gagal start kamera web:", e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const pendingScan = localStorage.getItem('pending_native_scan');
  if (pendingScan) {
    localStorage.removeItem('pending_native_scan');
    onScanSuccess(pendingScan);
  } else if (window.AndroidNativeBridge && window.AndroidNativeBridge.isNativeApp()) {
    // Mode Native
  } else {
    startWebScanner();
  }
});
