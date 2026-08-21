// assets/js/absensi/absensi.js
// 📱 STUDENT DEVICE BINDING & ATTENDANCE PORTAL ENGINE

import { db } from "../config/firebase-config.js";
import { getHardwareFingerprint } from "../utils/device-fingerprint.js";
import { 
  doc, 
  getDoc, 
  updateDoc,
  collection,
  query,
  where,
  limit,
  getDocs,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { showToast } from "../utils/toast.js";

const dom = {
  sectionLoading: document.getElementById('section-loading-absensi'),
  sectionLogin: document.getElementById('section-login-absensi'),
  sectionProfile: document.getElementById('section-profile-absensi'),
  nisInput: document.getElementById('nis-input'),
  btnVerifikasi: document.getElementById('btn-verifikasi'),
  btnText: document.getElementById('btn-text'),
  errorMsg: document.getElementById('error-msg'),

  profileNama: document.getElementById('profile-nama'),
  profileNis: document.getElementById('profile-nis'),
  profileKelas: document.getElementById('profile-kelas'),
  btnBukaScanner: document.getElementById('btn-buka-scanner'),

  riwayatLogContainer: document.getElementById('riwayat-log-container'),
  countHadir: document.getElementById('count-hadir'),
  countTidakHadir: document.getElementById('count-tidak-hadir'),
  riwayatStatusTag: document.getElementById('riwayat-status-tag')
};

let currentDeviceId = '';
let unsubscribeProfile = null;

// INISIALISASI APLIKASI
document.addEventListener('DOMContentLoaded', async () => {
  currentDeviceId = await getHardwareFingerprint();
  localStorage.setItem('portal_device_id', currentDeviceId);

  if (unsubscribeProfile) unsubscribeProfile();

  const qDevice = query(collection(db, "siswa"), where("device_id", "==", currentDeviceId));

  unsubscribeProfile = onSnapshot(qDevice, (snapshot) => {
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      const dbData = docSnap.data();

      const updatedUser = {
        doc_id: docSnap.id,
        nis: dbData.nis,
        nama_siswa: dbData.nama_siswa,
        id_kelas: dbData.id_kelas,
        nama_kelas: dbData.nama_kelas || dbData.id_kelas,
        device_id: currentDeviceId,
        device_info: dbData.device_info || null
      };

      localStorage.setItem('portal_siswa_user', JSON.stringify(updatedUser));
      showProfile(updatedUser);
    } else {
      console.log("Sesi tidak ditemukan atau telah di-reset oleh Admin.");
      localStorage.removeItem('portal_siswa_user');
      localStorage.removeItem('siswa_session');
      showLoginForm();
    }
  }, (error) => {
    console.error("Profile Listener Error:", error);
    showLoginForm();
  });
});

// FUNGSI UNTUK MENERKA INFO PERANGKAT DARI BROWSER
function guessDeviceInfoFromWeb() {
  const ua = navigator.userAgent;
  let info = "Generic Browser Device";

  if (/iPhone|iPad|iPod/.test(ua)) {
    info = "iPhone/iPad (iOS)";
  } else if (/Android/.test(ua)) {
    const match = ua.match(/Android\s+([^\s;]+);\s+([^\s;)]+)/);
    if (match && match[2]) {
      info = "Android (" + match[2].replace(/_/g, ' ') + ")";
    } else {
      info = "Android Device";
    }
  }

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        if (renderer) info += " [" + renderer.split(' ')[0] + "]";
      }
    }
  } catch (e) {}

  return info;
}

// VERIFIKASI SISWA & IKAT HP
if (dom.btnVerifikasi) {
  dom.btnVerifikasi.addEventListener('click', async () => {
    const rawNis = dom.nisInput ? dom.nisInput.value.trim() : '';
    hideError();

    if (!rawNis) {
      showError("Silakan masukkan NIS Anda terlebih dahulu.");
      return;
    }

    setLoading(true);

    try {
      const safeDocId = rawNis.replace(/\//g, '-');
      
      let docSnap = await getDoc(doc(db, "siswa", safeDocId));
      let dataSiswa = null;
      let actualDocId = safeDocId;

      if (docSnap.exists()) {
        dataSiswa = docSnap.data();
      } else {
        const qNis = query(collection(db, "siswa"), where("nis", "==", rawNis));
        const querySnap = await getDocs(qNis);

        if (!querySnap.empty) {
          docSnap = querySnap.docs[0];
          dataSiswa = docSnap.data();
          actualDocId = docSnap.id;
        }
      }

      if (!dataSiswa) {
        showError(`NIS "${rawNis}" tidak ditemukan! Pastikan terdaftar.`);
        setLoading(false);
        return;
      }

      // VALIDASI 1: Akun NIS ini sudah terikat di HP lain?
      if (dataSiswa.device_id && dataSiswa.device_id !== currentDeviceId) {
        showError("❌ Akun NIS ini sudah terikat di HP lain! Minta Guru/Admin untuk mereset perangkat.");
        setLoading(false);
        return;
      }

      // VALIDASI 2: HP ini terikat ke akun NIS siswa lain?
      const qDevice = query(collection(db, "siswa"), where("device_id", "==", currentDeviceId));
      const deviceSnap = await getDocs(qDevice);

      if (!deviceSnap.empty) {
        let activeOwner = null;
        deviceSnap.forEach(d => {
          if (d.id !== actualDocId && d.data().nis !== rawNis) {
            activeOwner = d.data();
          }
        });

        if (activeOwner) {
          showError(`❌ HP ini sudah terikat dengan siswa: ${activeOwner.nama_siswa} (${activeOwner.nis}). 1 HP hanya untuk 1 siswa!`);
          setLoading(false);
          return;
        }
      }

      // Ikat HP ke Firestore
      const updateData = { device_id: currentDeviceId };

      if (window.AndroidNativeBridge && typeof window.AndroidNativeBridge.getDeviceInfo === 'function') {
        updateData.device_info = window.AndroidNativeBridge.getDeviceInfo();
      } else {
        updateData.device_info = guessDeviceInfoFromWeb();
      }

      await updateDoc(doc(db, "siswa", actualDocId), updateData);

      const userData = {
        doc_id: actualDocId,
        nis: dataSiswa.nis || rawNis,
        nama_siswa: dataSiswa.nama_siswa,
        id_kelas: dataSiswa.id_kelas,
        nama_kelas: dataSiswa.nama_kelas || dataSiswa.id_kelas,
        device_id: currentDeviceId,
        device_info: updateData.device_info || null
      };

      localStorage.setItem('portal_siswa_user', JSON.stringify(userData));
      showProfile(userData);
      showToast("HP berhasil diikat ke akun siswa!", "success");

    } catch (err) {
      console.error(err);
      showError("Terjadi kesalahan: " + err.message);
    } finally {
      setLoading(false);
    }
  });
}

function showProfile(user) {
  if (dom.profileNama) dom.profileNama.innerText = user.nama_siswa;
  if (dom.profileNis) dom.profileNis.innerText = user.nis;
  if (dom.profileKelas) dom.profileKelas.innerText = user.nama_kelas || user.id_kelas;

  if (dom.sectionLoading) dom.sectionLoading.classList.add('hidden');
  if (dom.sectionLogin) dom.sectionLogin.classList.add('hidden');
  if (dom.sectionProfile) dom.sectionProfile.classList.remove('hidden');

  loadStudentAttendanceHistory(user.nis);
}

function showLoginForm() {
  if (dom.sectionLoading) dom.sectionLoading.classList.add('hidden');
  if (dom.sectionProfile) dom.sectionProfile.classList.add('hidden');
  if (dom.sectionLogin) dom.sectionLogin.classList.remove('hidden');
}

if (dom.btnBukaScanner) {
  dom.btnBukaScanner.addEventListener('click', () => {
    if (window.AndroidNativeBridge && typeof window.AndroidNativeBridge.isNativeApp === 'function' && window.AndroidNativeBridge.isNativeApp()) {
      window.AndroidNativeBridge.startScanner();
    } else {
      window.location.href = "pages/siswa/scanner.html";
    }
  });
}

// JEMBATAN UNTUK NATIVE ANDROID
window.receiveNativeScan = function(decodedText) {
  console.log("Menerima hasil scan native:", decodedText);
  localStorage.setItem('pending_native_scan', decodedText);
  window.location.href = "pages/siswa/scanner.html";
};

function showError(msg) {
  if (!dom.errorMsg) return;
  dom.errorMsg.innerText = msg;
  dom.errorMsg.classList.remove('hidden');
}

function hideError() {
  if (!dom.errorMsg) return;
  dom.errorMsg.innerText = '';
  dom.errorMsg.classList.add('hidden');
}

async function loadStudentAttendanceHistory(nis) {
  if (!nis || !dom.riwayatLogContainer) return;

  try {
    const qLog = query(
      collection(db, "log_absensi"),
      where("nis", "==", nis),
      limit(50)
    );

    const snap = await getDocs(qLog);

    if (snap.empty) {
      dom.riwayatLogContainer.innerHTML = '<p style="font-size:0.75rem; color:#94a3b8; text-align:center; padding:20px 0; font-family:monospace;">Belum ada riwayat presensi tercatat.</p>';
      if (dom.countHadir) dom.countHadir.innerText = "0";
      if (dom.countTidakHadir) dom.countTidakHadir.innerText = "0";
      if (dom.riwayatStatusTag) dom.riwayatStatusTag.innerText = "0 Log";
      return;
    }

    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => {
      const timeA = a.created_at?.seconds || 0;
      const timeB = b.created_at?.seconds || 0;
      if (timeA !== timeB) return timeB - timeA;
      return (b.tanggal || '').localeCompare(a.tanggal || '');
    });

    let hadirCount = 0;
    let tidakHadirCount = 0;
    dom.riwayatLogContainer.innerHTML = '';

    docs.forEach(data => {
      const rawStatus = (data.status || 'Hadir').trim();
      const isHadir = rawStatus.toLowerCase().includes('hadir') && !rawStatus.toLowerCase().includes('tidak');

      if (isHadir) hadirCount++;
      else tidakHadirCount++;

      const badgeBg = isHadir ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';
      const badgeColor = isHadir ? '#6ee7b7' : '#fca5a5';
      const badgeBorder = isHadir ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)';
      const badgeText = isHadir ? '✔ Hadir' : '❌ Tidak Hadir';

      const item = document.createElement('div');
      item.style.cssText = 'padding: 10px 12px; border-radius: 12px; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255, 255, 255, 0.08); display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; text-align: left;';
      item.innerHTML = `
        <div>
          <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
            <span style="font-weight:700; color:#ffffff; font-family:monospace;">${data.hari || ''} ${data.tanggal || ''}</span>
            <span style="font-size:0.65rem; color:#94a3b8; font-family:monospace;">(${data.waktu || '-'})</span>
          </div>
          <p style="font-size:0.7rem; color:#38bdf8; font-weight:600; margin:0;">${data.nama_mapel || 'Presensi Kelas'} <span style="color:#94a3b8;">[${data.id_kelas || '-'}]</span></p>
        </div>
        <span style="padding: 4px 10px; border-radius: 20px; font-size: 0.65rem; font-weight: 700; font-family: monospace; background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; whitespace: nowrap;">
          ${badgeText}
        </span>
      `;
      dom.riwayatLogContainer.appendChild(item);
    });

    if (dom.countHadir) dom.countHadir.innerText = hadirCount;
    if (dom.countTidakHadir) dom.countTidakHadir.innerText = tidakHadirCount;
    if (dom.riwayatStatusTag) dom.riwayatStatusTag.innerText = `${docs.length} Log`;

  } catch (err) {
    console.error("Gagal memuat riwayat presensi:", err);
    if (dom.riwayatLogContainer) dom.riwayatLogContainer.innerHTML = '<p style="font-size:0.75rem; color:#ef4444; text-align:center; padding:16px 0; font-family:monospace;">Gagal memuat data riwayat.</p>';
  }
}

function setLoading(isLoading) {
  if (!dom.btnVerifikasi || !dom.btnText) return;
  if (isLoading) {
    dom.btnVerifikasi.disabled = true;
    dom.btnText.innerText = "Mengecek NIS & Validasi HP...";
  } else {
    dom.btnVerifikasi.disabled = false;
    dom.btnText.innerText = "Verifikasi NIS & Ikat HP";
  }
}
