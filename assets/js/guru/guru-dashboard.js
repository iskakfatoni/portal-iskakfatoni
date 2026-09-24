// assets/js/guru/guru-dashboard.js
// 👨‍🏫 GURU DASHBOARD: ATTENDANCE SESSION QR GENERATOR, TIMER & LIVE STUDENT LOG

import { db } from "../config/firebase-config.js";
import { initializeAuthGuard } from "../auth/auth-guard.js";
import { 
  collection, 
  addDoc, 
  getDoc,
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  onSnapshot, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { showToast, showConfirm } from "../utils/toast.js";

const dom = {
  userEmailDisplay: document.getElementById('user-email-display'),
  btnLogout: document.getElementById('btn-logout'),

  selectKelas: document.getElementById('select-kelas'),
  selectMapel: document.getElementById('select-mapel'),
  btnStartSesi: document.getElementById('btn-start-sesi'),
  btnStopSesi: document.getElementById('btn-stop-sesi'),
  btnFullscreenQr: document.getElementById('btn-fullscreen-qr'),

  qrContainer: document.getElementById('qrcode-container'),
  qrModalContainer: document.getElementById('qrcode-modal-container'),
  qrModal: document.getElementById('qr-fullscreen-modal'),
  btnCloseModal: document.getElementById('btn-close-modal'),
  sessionStatus: document.getElementById('session-status'),
  logSiswaContainer: document.getElementById('log-siswa-container'),
  logCount: document.getElementById('log-count'),

  modalKelasTitle: document.getElementById('modal-kelas-title'),
  modalMapelTitle: document.getElementById('modal-mapel-title'),
  sessionTimerBox: document.getElementById('session-timer-box'),
  sessionCountdownDisplay: document.getElementById('session-countdown-display'),
  btnExtendSession: document.getElementById('btn-extend-session'),
  btnToggleSound: document.getElementById('btn-toggle-sound'),
  iconSound: document.getElementById('icon-sound'),
  textSound: document.getElementById('text-sound'),

  // DOM Elemen Absensi Manual
  btnOpenManualAbsen: document.getElementById('btn-open-manual-absen'),
  modalManualAbsen: document.getElementById('modal-manual-absen'),
  btnCloseManualModal: document.getElementById('btn-close-manual-modal'),
  btnCancelManualModal: document.getElementById('btn-cancel-manual-modal'),
  formManualAbsen: document.getElementById('form-manual-absen'),
  manualSelectKelas: document.getElementById('manual-select-kelas'),
  manualSelectSiswa: document.getElementById('manual-select-siswa'),
  manualStudentCount: document.getElementById('manual-student-count'),
  manualInputMapel: document.getElementById('manual-input-mapel'),
  manualInputKeterangan: document.getElementById('manual-input-keterangan'),
  btnSubmitManualAbsen: document.getElementById('btn-submit-manual-absen')
};

let currentSesiId = null;
let qrInterval = null;
let unsubscribeLog = null;
let activeToken = "";
let prevLogCount = -1;

// 🔊 AUDIO NOTIFIER (Web Audio API Synthesizer)
class AudioNotifier {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem('portal_guru_sound_muted') === 'true';
    this.updateBtnUI();
  }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }
  toggle() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('portal_guru_sound_muted', this.isMuted);
    this.updateBtnUI();
    if (!this.isMuted) this.playChime();
    return !this.isMuted;
  }
  updateBtnUI() {
    if (!dom.iconSound || !dom.textSound) return;
    if (this.isMuted) {
      dom.iconSound.className = 'fa-solid fa-volume-xmark text-slate-500';
      dom.textSound.innerText = 'Suara: OFF';
      dom.textSound.className = 'hidden sm:inline text-slate-500';
    } else {
      dom.iconSound.className = 'fa-solid fa-volume-high text-cyan-400';
      dom.textSound.innerText = 'Suara: ON';
      dom.textSound.className = 'hidden sm:inline text-slate-300';
    }
  }
  playChime() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, t); // D5
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.12); // A5
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.35);
    } catch (e) {}
  }
}

const audioNotifier = new AudioNotifier();
if (dom.btnToggleSound) {
  dom.btnToggleSound.addEventListener('click', () => audioNotifier.toggle());
}

// ⏱️ COUNTDOWN TIMER SESI (60 Menit)
let countdownInterval = null;
let sessionDurationMs = 60 * 60 * 1000;

function startCountdownTimer(createdTimestampMs) {
  if (countdownInterval) clearInterval(countdownInterval);
  if (dom.sessionTimerBox) dom.sessionTimerBox.classList.remove('hidden');

  const startMs = createdTimestampMs || Date.now();

  function updateTimer() {
    const nowMs = Date.now();
    const elapsedMs = nowMs - startMs;
    const remainingMs = sessionDurationMs - elapsedMs;

    if (remainingMs <= 0) {
      clearInterval(countdownInterval);
      if (dom.sessionCountdownDisplay) dom.sessionCountdownDisplay.innerText = "00:00 (Habis)";
      if (dom.sessionStatus) {
        dom.sessionStatus.innerText = "Kedaluwarsa";
        dom.sessionStatus.className = "text-xs text-rose-400 font-mono font-bold";
      }
      if (currentSesiId) {
        updateDoc(doc(db, "sesi_absensi", currentSesiId), { is_active: false });
      }
      resetSesiState();
      return;
    }

    const totalSec = Math.floor(remainingMs / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    if (dom.sessionCountdownDisplay) {
      dom.sessionCountdownDisplay.innerText = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }
  }

  updateTimer();
  countdownInterval = setInterval(updateTimer, 1000);
}

function stopCountdownTimer() {
  if (countdownInterval) clearInterval(countdownInterval);
  if (dom.sessionTimerBox) dom.sessionTimerBox.classList.add('hidden');
  sessionDurationMs = 60 * 60 * 1000;
}

if (dom.btnExtendSession) {
  dom.btnExtendSession.addEventListener('click', () => {
    if (!currentSesiId) return;
    sessionDurationMs += 30 * 60 * 1000;
    showToast("Durasi sesi ditambah +30 menit", "success");
  });
}

const normClass = (k) => (k || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// 🔒 AUTH GUARD: Verifikasi Sesi Guru
initializeAuthGuard({
  onAuthenticated: async (user) => {
    document.documentElement.style.display = 'block';
    if (dom.userEmailDisplay) dom.userEmailDisplay.innerText = user.email;
    await loadKelasDropdown();
    await loadMapelDropdown();
    await checkAndRestoreActiveSesi();
  }
});

// ↩️ KEMBALI KE HUB ADMIN (TANPA LOGOUT)
if (dom.btnLogout) {
  dom.btnLogout.addEventListener('click', () => {
    window.location.href = window.location.pathname.includes('/pages/') ? "../../admin.html" : "../admin.html";
  });
}

// 🛡️ PERTAHANKAN SESI AKTIF
async function checkAndRestoreActiveSesi() {
  try {
    let activeDocId = localStorage.getItem('portal_guru_active_sesi_id');
    let activeDocData = null;

    if (activeDocId) {
      try {
        const docSnap = await getDoc(doc(db, "sesi_absensi", activeDocId));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.is_active !== false) {
            activeDocData = data;
          } else {
            localStorage.removeItem('portal_guru_active_sesi_id');
            activeDocId = null;
          }
        } else {
          localStorage.removeItem('portal_guru_active_sesi_id');
          activeDocId = null;
        }
      } catch (e) {
        console.warn("Gagal getDoc sesi dari localStorage ID:", e);
      }
    }

    if (!activeDocData) {
      const q = query(
        collection(db, "sesi_absensi"),
        where("is_active", "==", true)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const sortedDocs = snapshot.docs.sort((a, b) => {
          const tA = a.data().created_at?.seconds || 0;
          const tB = b.data().created_at?.seconds || 0;
          return tB - tA;
        });

        activeDocId = sortedDocs[0].id;
        activeDocData = sortedDocs[0].data();
        localStorage.setItem('portal_guru_active_sesi_id', activeDocId);
      }
    }

    if (!activeDocId || !activeDocData) return;

    let isExpired = false;
    let refTimeMs = Date.now();
    const refTimestamp = activeDocData.resumed_at || activeDocData.opened_at || activeDocData.created_at;
    if (refTimestamp && refTimestamp.seconds) {
      refTimeMs = refTimestamp.seconds * 1000;
      const nowMs = Date.now();
      if ((nowMs - refTimeMs) > 60 * 60 * 1000) {
        isExpired = true;
      }
    }

    if (isExpired) {
      await updateDoc(doc(db, "sesi_absensi", activeDocId), { is_active: false });
      localStorage.removeItem('portal_guru_active_sesi_id');
      return;
    }

    currentSesiId = activeDocId;
    activeToken = activeDocData.current_qr_token || ('QR-' + Math.random().toString(36).substring(2, 10).toUpperCase());

    if (activeDocData.id_kelas && dom.selectKelas) {
      const matchingOpt = Array.from(dom.selectKelas.options).find(o => o.value === activeDocData.id_kelas || o.dataset.namaKelas === activeDocData.id_kelas);
      if (matchingOpt) dom.selectKelas.value = matchingOpt.value;
      else dom.selectKelas.value = activeDocData.id_kelas;
    }
    if (activeDocData.nama_mapel && dom.selectMapel) dom.selectMapel.value = activeDocData.nama_mapel;

    if (dom.btnStartSesi) {
      dom.btnStartSesi.disabled = true;
      dom.btnStartSesi.className = 'py-3 px-4 bg-slate-800 text-slate-500 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-not-allowed';
    }

    if (dom.btnStopSesi) {
      dom.btnStopSesi.disabled = false;
      dom.btnStopSesi.className = 'py-3 px-4 bg-red-500 hover:bg-red-400 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 cursor-pointer';
    }

    if (dom.btnFullscreenQr) {
      dom.btnFullscreenQr.disabled = false;
      dom.btnFullscreenQr.className = 'w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20';
    }

    const displayClassName = activeDocData.nama_kelas || activeDocData.id_kelas || '-';
    if (dom.sessionStatus) {
      dom.sessionStatus.innerText = `Aktif [${displayClassName}]`;
      dom.sessionStatus.className = 'text-xs text-emerald-400 font-mono font-bold';
    }

    if (dom.modalKelasTitle) dom.modalKelasTitle.innerText = displayClassName;
    if (dom.modalMapelTitle) dom.modalMapelTitle.innerText = activeDocData.nama_mapel || '-';

    updateQRDisplay(activeToken);

    startCountdownTimer(refTimeMs);

    if (qrInterval) clearInterval(qrInterval);
    qrInterval = setInterval(async () => {
      if (!currentSesiId) return;
      const prevToken = activeToken;
      activeToken = 'QR-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      try {
        await updateDoc(doc(db, "sesi_absensi", currentSesiId), {
          current_qr_token: activeToken,
          previous_qr_token: prevToken,
          token_rotated_at: serverTimestamp()
        });
        updateQRDisplay(activeToken);
      } catch (eRot) {
        console.warn("Gagal rotasi token QR:", eRot);
      }
    }, 10000);

    listenToLogAbsensi(currentSesiId);

  } catch (err) {
    console.error("Gagal memulihkan sesi aktif:", err);
  }
}

async function loadKelasDropdown() {
  if (!dom.selectKelas) return;
  dom.selectKelas.innerHTML = '<option value="">-- Pilih Kelas TEI --</option>';
  try {
    const q = query(collection(db, "kelas"));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const docId = docSnap.id;
        const kName = data.nama_kelas || docId;
        const schoolName = data.nama_sekolah || '';
        const schoolTag = schoolName.includes('Kemlagi') ? 'SMK MUTU' : (schoolName.includes('Jetis') ? 'SMKN 1 JETIS' : '');

        const opt = document.createElement('option');
        opt.value = docId;
        opt.dataset.namaKelas = kName;
        opt.dataset.namaSekolah = schoolName;
        opt.textContent = schoolTag ? `${kName} (${schoolTag})` : kName;
        dom.selectKelas.appendChild(opt);
      });
    }
  } catch (err) { console.error("Gagal load kelas:", err); }
}

async function loadMapelDropdown() {
  if (!dom.selectMapel) return;
  dom.selectMapel.innerHTML = '<option value="">-- Pilih Mata Pelajaran --</option>';
  try {
    const q = query(collection(db, "mapel"), orderBy("order", "asc"));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const option = document.createElement('option');
        option.value = data.nama_mapel;
        option.textContent = data.nama_mapel;
        dom.selectMapel.appendChild(option);
      });
    }
  } catch (err) { console.error("Gagal load mapel:", err); }
}

// 🔄 BUKA SESI
if (dom.btnStartSesi) {
  dom.btnStartSesi.addEventListener('click', async () => {
    const selectedOpt = dom.selectKelas ? dom.selectKelas.selectedOptions[0] : null;
    const kelasId = dom.selectKelas ? dom.selectKelas.value : '';
    const kelasNama = selectedOpt?.dataset?.namaKelas || kelasId;
    const sekolahNama = selectedOpt?.dataset?.namaSekolah || '';
    const mapel = dom.selectMapel ? dom.selectMapel.value : '';

    if (!kelasId || !mapel) {
      showToast("Pilih Kelas dan Mata Pelajaran terlebih dahulu!", "warning");
      return;
    }

    try {
      dom.btnStartSesi.disabled = true;

      const now = new Date();
      const tanggalStr = now.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
      const waktuStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
      const normSelectedKelas = normClass(kelasId);
      const normSelectedMapel = mapel.trim().toLowerCase();

      let reusableSesiId = null;
      let isResumed = false;

      const qTodaySesi = query(
        collection(db, "sesi_absensi"),
        where("tanggal", "==", tanggalStr)
      );
      const todaySesiSnap = await getDocs(qTodaySesi);

      if (!todaySesiSnap.empty) {
        const matchingDocs = todaySesiSnap.docs.filter(docSnap => {
          const d = docSnap.data();
          const kMatch = (d.id_kelas === kelasId) || (normClass(d.id_kelas) === normSelectedKelas);
          const mMapel = (d.nama_mapel || '').trim().toLowerCase() === normSelectedMapel;
          const sMatch = (!sekolahNama || !d.nama_sekolah || normClass(d.nama_sekolah) === normClass(sekolahNama));
          return kMatch && mMapel && sMatch;
        }).sort((a, b) => {
          const tA = (a.data().closed_at?.seconds || a.data().updated_at?.seconds || a.data().created_at?.seconds || 0);
          const tB = (b.data().closed_at?.seconds || b.data().updated_at?.seconds || b.data().created_at?.seconds || 0);
          return tB - tA;
        });

        if (matchingDocs.length > 0) {
          const latestMatchDoc = matchingDocs[0];
          const latestMatchData = latestMatchDoc.data();

          const lastTimeSeconds = (latestMatchData.closed_at?.seconds || latestMatchData.updated_at?.seconds || latestMatchData.created_at?.seconds || 0);
          if (lastTimeSeconds > 0) {
            const diffMs = Date.now() - (lastTimeSeconds * 1000);
            if (diffMs <= 60 * 60 * 1000) {
              reusableSesiId = latestMatchDoc.id;
              isResumed = true;
            }
          }
        }
      }

      // Nonaktifkan sesi aktif lain
      const qActive = query(collection(db, "sesi_absensi"), where("is_active", "==", true));
      const activeSnap = await getDocs(qActive);

      const deactivatePromises = [];
      activeSnap.forEach((activeDoc) => {
        if (activeDoc.id !== reusableSesiId) {
          deactivatePromises.push(updateDoc(doc(db, "sesi_absensi", activeDoc.id), { is_active: false }));
        }
      });

      if (deactivatePromises.length > 0) {
        await Promise.all(deactivatePromises);
      }

      activeToken = 'QR-' + Math.random().toString(36).substring(2, 10).toUpperCase();

      if (isResumed && reusableSesiId) {
        currentSesiId = reusableSesiId;
        await updateDoc(doc(db, "sesi_absensi", currentSesiId), {
          is_active: true,
          current_qr_token: activeToken,
          previous_qr_token: null,
          resumed_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
        showToast(`Melanjutkan sesi presensi kelas [${kelasNama}]`, "info");
      } else {
        const docRef = await addDoc(collection(db, "sesi_absensi"), {
          id_kelas: kelasId,
          nama_kelas: kelasNama,
          nama_sekolah: sekolahNama,
          nama_mapel: mapel,
          tanggal: tanggalStr,
          waktu: waktuStr,
          current_qr_token: activeToken,
          previous_qr_token: null,
          is_active: true,
          opened_at: serverTimestamp(),
          created_at: serverTimestamp()
        });
        currentSesiId = docRef.id;
        showToast(`Sesi presensi baru dibuka untuk [${kelasNama}]`, "success");
      }

      localStorage.setItem('portal_guru_active_sesi_id', currentSesiId);

      if (dom.btnStopSesi) {
        dom.btnStopSesi.disabled = false;
        dom.btnStopSesi.className = 'py-3 px-4 bg-red-500 hover:bg-red-400 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 cursor-pointer';
      }

      if (dom.btnFullscreenQr) {
        dom.btnFullscreenQr.disabled = false;
        dom.btnFullscreenQr.className = 'w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20';
      }

      const displayStatusText = isResumed ? `Dilanjutkan [${kelasNama}]` : `Aktif [${kelasNama}]`;
      if (dom.sessionStatus) {
        dom.sessionStatus.innerText = displayStatusText;
        dom.sessionStatus.className = 'text-xs text-emerald-400 font-mono font-bold';
      }

      if (dom.modalKelasTitle) dom.modalKelasTitle.innerText = `${kelasNama}${isResumed ? ' (Lanjutan)' : ''}`;
      if (dom.modalMapelTitle) dom.modalMapelTitle.innerText = mapel;

      updateQRDisplay(activeToken);
      startCountdownTimer(Date.now());

      if (qrInterval) clearInterval(qrInterval);
      qrInterval = setInterval(async () => {
        if (!currentSesiId) return;
        const prevToken = activeToken;
        activeToken = 'QR-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        try {
          await updateDoc(doc(db, "sesi_absensi", currentSesiId), {
            current_qr_token: activeToken,
            previous_qr_token: prevToken,
            token_rotated_at: serverTimestamp()
          });
          updateQRDisplay(activeToken);
        } catch (eRot) {
          console.warn("Gagal rotasi token QR:", eRot);
        }
      }, 10000);

      listenToLogAbsensi(currentSesiId);

    } catch (e) {
      showToast("Gagal membuka sesi: " + e.message, "error");
      dom.btnStartSesi.disabled = false;
    }
  });
}

// 🛑 TUTUP SESI PRESENSI
if (dom.btnStopSesi) {
  dom.btnStopSesi.addEventListener('click', async () => {
    const confirmed = await showConfirm({
      title: 'Tutup Sesi Presensi',
      message: 'Apakah Anda yakin ingin mengakhiri sesi presensi saat ini?',
      icon: 'fa-stop-circle',
      confirmText: 'Ya, Tutup Sesi',
      type: 'danger'
    });

    if (confirmed) {
      const activeId = currentSesiId || localStorage.getItem('portal_guru_active_sesi_id');
      if (activeId) {
        try {
          await updateDoc(doc(db, "sesi_absensi", activeId), { 
            is_active: false,
            current_qr_token: null,
            previous_qr_token: null,
            closed_at: serverTimestamp()
          });
          showToast("Sesi presensi telah ditutup.", "info");
        } catch(e) {}
      }
      resetSesiState();
    }
  });
}

if (dom.btnFullscreenQr && dom.qrModal) {
  dom.btnFullscreenQr.addEventListener('click', () => dom.qrModal.classList.remove('hidden'));
}
if (dom.btnCloseModal && dom.qrModal) {
  dom.btnCloseModal.addEventListener('click', () => dom.qrModal.classList.add('hidden'));
}

function updateQRDisplay(token) {
  if (!dom.qrContainer || !dom.qrModalContainer) return;
  dom.qrContainer.innerHTML = '';
  dom.qrModalContainer.innerHTML = '';
  if (typeof QRCode === 'undefined') {
    dom.qrContainer.innerHTML = '<p class="text-xs text-rose-400 font-sans font-mono p-4">❌ Library QRCode CDN gagal dimuat. Periksa koneksi internet Anda.</p>';
    return;
  }
  new QRCode(dom.qrContainer, { text: token, width: 180, height: 180 });
  new QRCode(dom.qrModalContainer, { text: token, width: 280, height: 280 });
}

function listenToLogAbsensi(sesiId) {
  if (unsubscribeLog) unsubscribeLog();
  prevLogCount = -1;

  const q = query(collection(db, "log_absensi"), where("id_sesi", "==", sesiId));
  unsubscribeLog = onSnapshot(q, (snapshot) => {
    if (!dom.logSiswaContainer) return;
    dom.logSiswaContainer.innerHTML = '';

    if (snapshot.empty) {
      dom.logSiswaContainer.innerHTML = '<p class="text-xs text-slate-500 text-center py-10">// Belum ada siswa scan...</p>';
      if (dom.logCount) dom.logCount.innerText = "0 Siswa";
      prevLogCount = 0;
      return;
    }

    let count = 0;
    snapshot.forEach((docSnap) => {
      count++;
      const data = docSnap.data();
      const item = document.createElement('div');
      item.className = 'flex items-center justify-between p-3 bg-slate-950/90 rounded-xl border border-slate-800 text-xs hover:border-cyan-500/30 transition';
      let badgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      let statusIcon = '✔';
      const st = (data.status || 'Hadir').toLowerCase();
      if (st.includes('terlambat')) {
        badgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        statusIcon = '⏰';
      } else if (st.includes('sakit')) {
        badgeClass = 'bg-sky-500/10 text-sky-400 border-sky-500/20';
        statusIcon = '🏥';
      } else if (st.includes('izin')) {
        badgeClass = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
        statusIcon = '📝';
      } else if (st.includes('tidak') || st.includes('alpa')) {
        badgeClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        statusIcon = '❌';
      }

      const isManual = data.metode === 'Manual Guru' || data.device_id === 'MANUAL_GURU';
      const manualBadge = isManual 
        ? `<span class="px-1.5 py-0.5 ml-1 text-[9px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded">Manual</span>` 
        : '';

      item.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 font-bold flex items-center justify-center">${count}</div>
          <div>
            <p class="font-bold text-white text-sm flex items-center gap-1.5">
              ${data.nama_siswa}
              ${manualBadge}
            </p>
            <p class="text-[11px] text-slate-400 font-mono">NIS: ${data.nis} | ${data.id_kelas || data.nama_kelas || '-'}</p>
          </div>
        </div>
        <span class="px-3 py-1 rounded-full text-xs font-bold border ${badgeClass}">
          ${statusIcon} ${data.status || 'Hadir'}
        </span>
      `;
      dom.logSiswaContainer.appendChild(item);
    });

    if (prevLogCount !== -1 && count > prevLogCount) {
      audioNotifier.playChime();
    }
    prevLogCount = count;

    if (dom.logCount) dom.logCount.innerText = `${count} Siswa`;
  });
}

function resetSesiState() {
  if (qrInterval) clearInterval(qrInterval);
  if (unsubscribeLog) unsubscribeLog();
  stopCountdownTimer();
  localStorage.removeItem('portal_guru_active_sesi_id');
  currentSesiId = null;
  if (dom.btnStartSesi) {
    dom.btnStartSesi.disabled = false;
    dom.btnStartSesi.className = 'py-3 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20';
  }
  if (dom.btnStopSesi) {
    dom.btnStopSesi.disabled = true;
    dom.btnStopSesi.className = 'py-3 px-4 bg-slate-800 hover:bg-red-500/20 text-slate-500 border border-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-not-allowed';
  }
  if (dom.btnFullscreenQr) {
    dom.btnFullscreenQr.disabled = true;
    dom.btnFullscreenQr.className = 'w-full py-3 px-4 bg-slate-800 text-slate-500 border border-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-not-allowed';
  }
  if (dom.sessionStatus) {
    dom.sessionStatus.innerText = 'Off';
    dom.sessionStatus.className = 'text-xs text-slate-400 font-mono';
  }
  if (dom.qrContainer) dom.qrContainer.innerHTML = '<p class="text-xs text-slate-500 font-sans">Sesi Belum Aktif</p>';
  if (dom.qrModal) dom.qrModal.classList.add('hidden');
}

// -----------------------------------------------------------------
// 📝 LOGIKA INTERAKTIF FITUR ABSENSI MANUAL
// -----------------------------------------------------------------
let cachedStudentsByClass = {};

async function loadStudentsForManualSelect(kelasId) {
  if (!dom.manualSelectSiswa) return;
  dom.manualSelectSiswa.innerHTML = '<option value="">-- Memuat Siswa... --</option>';
  if (dom.manualStudentCount) dom.manualStudentCount.innerText = 'Memuat...';

  if (!kelasId) {
    dom.manualSelectSiswa.innerHTML = '<option value="">-- Pilih Kelas Terlebih Dahulu --</option>';
    if (dom.manualStudentCount) dom.manualStudentCount.innerText = '0 Siswa';
    return;
  }

  const selectedOpt = dom.manualSelectKelas ? dom.manualSelectKelas.selectedOptions[0] : null;
  const targetSekolah = selectedOpt?.dataset?.namaSekolah || '';
  const normTargetSekolah = normClass(targetSekolah);
  const normTarget = normClass(kelasId);
  const cacheKey = `${normTarget}_${normTargetSekolah}`;

  try {
    let studentList = cachedStudentsByClass[cacheKey];
    if (!studentList) {
      const q = query(collection(db, "siswa"));
      const snap = await getDocs(q);
      const allStudents = [];
      snap.forEach(docSnap => {
        const d = docSnap.data();
        allStudents.push({
          id: docSnap.id,
          nis: d.nis || docSnap.id,
          nama_siswa: d.nama_siswa || d.nama || "Tanpa Nama",
          id_kelas: d.id_kelas || "-",
          nama_kelas: d.nama_kelas || d.id_kelas || "-",
          nama_sekolah: d.nama_sekolah || ""
        });
      });

      studentList = allStudents.filter(s => {
        const sSekolah = normClass(s.nama_sekolah);
        if (normTargetSekolah && sSekolah) {
          const isMutuTarget = normTargetSekolah.includes('kemlagi') || normTargetSekolah.includes('mutu') || normTargetSekolah.includes('muhammadiyah');
          const isMutuStudent = sSekolah.includes('kemlagi') || sSekolah.includes('mutu') || sSekolah.includes('muhammadiyah');
          const isJetisTarget = normTargetSekolah.includes('jetis');
          const isJetisStudent = sSekolah.includes('jetis');
          if (isMutuTarget && !isMutuStudent) return false;
          if (isJetisTarget && !isJetisStudent) return false;
        }

        if (s.id_kelas === kelasId || normClass(s.id_kelas) === normTarget) return true;
        if (normClass(s.nama_kelas) === normTarget && (!normTargetSekolah || !sSekolah || normTargetSekolah === sSekolah)) {
          return true;
        }
        return false;
      }).sort((a, b) => (a.nama_siswa || '').localeCompare(b.nama_siswa || ''));

      cachedStudentsByClass[cacheKey] = studentList;
    }

    // Periksa status kehadiran siswa di sesi aktif saat ini
    let attendedNisMap = new Map();
    if (currentSesiId) {
      try {
        const qLog = query(collection(db, "log_absensi"), where("id_sesi", "==", currentSesiId));
        const logSnap = await getDocs(qLog);
        logSnap.forEach(lDoc => {
          const lData = lDoc.data();
          if (lData.nis) attendedNisMap.set(lData.nis, lData.status || 'Hadir');
        });
      } catch (eLog) {
        console.warn("Gagal cek log hadir:", eLog);
      }
    }

    dom.manualSelectSiswa.innerHTML = '<option value="">-- Pilih Siswa (' + studentList.length + ') --</option>';
    studentList.forEach(s => {
      const attendedStatus = attendedNisMap.get(s.nis);
      const opt = document.createElement('option');
      opt.value = JSON.stringify(s);
      opt.textContent = `${s.nama_siswa} (NIS: ${s.nis})${attendedStatus ? ` [✔ ${attendedStatus}]` : ''}`;
      if (attendedStatus) {
        opt.className = 'text-emerald-400 font-semibold';
      }
      dom.manualSelectSiswa.appendChild(opt);
    });

    if (dom.manualStudentCount) dom.manualStudentCount.innerText = `${studentList.length} Siswa`;

  } catch (err) {
    console.error("Gagal memuat daftar siswa:", err);
    dom.manualSelectSiswa.innerHTML = '<option value="">Gagal memuat siswa</option>';
    if (dom.manualStudentCount) dom.manualStudentCount.innerText = 'Error';
  }
}

// Buka Modal Absen Manual
if (dom.btnOpenManualAbsen && dom.modalManualAbsen) {
  dom.btnOpenManualAbsen.addEventListener('click', async () => {
    dom.modalManualAbsen.classList.remove('hidden');

    if (dom.manualSelectKelas && dom.selectKelas) {
      dom.manualSelectKelas.innerHTML = dom.selectKelas.innerHTML;
      if (dom.selectKelas.value) {
        dom.manualSelectKelas.value = dom.selectKelas.value;
      }
    }

    if (dom.manualInputMapel) {
      if (dom.modalMapelTitle && dom.modalMapelTitle.innerText && dom.modalMapelTitle.innerText !== '-') {
        dom.manualInputMapel.value = dom.modalMapelTitle.innerText;
      } else if (dom.selectMapel && dom.selectMapel.value) {
        dom.manualInputMapel.value = dom.selectMapel.value;
      }
    }

    const currentClass = dom.manualSelectKelas ? dom.manualSelectKelas.value : '';
    if (currentClass) {
      await loadStudentsForManualSelect(currentClass);
    }
  });
}

// Tutup Modal
if (dom.btnCloseManualModal && dom.modalManualAbsen) {
  dom.btnCloseManualModal.addEventListener('click', () => dom.modalManualAbsen.classList.add('hidden'));
}
if (dom.btnCancelManualModal && dom.modalManualAbsen) {
  dom.btnCancelManualModal.addEventListener('click', () => dom.modalManualAbsen.classList.add('hidden'));
}

// Event ganti kelas pada form modal
if (dom.manualSelectKelas) {
  dom.manualSelectKelas.addEventListener('change', async (e) => {
    await loadStudentsForManualSelect(e.target.value);
  });
}

// Submit Absensi Manual
if (dom.formManualAbsen) {
  dom.formManualAbsen.addEventListener('submit', async (e) => {
    e.preventDefault();

    const rawStudent = dom.manualSelectSiswa ? dom.manualSelectSiswa.value : '';
    if (!rawStudent) {
      showToast("Pilih siswa terlebih dahulu!", "warning");
      return;
    }

    let student = null;
    try {
      student = JSON.parse(rawStudent);
    } catch(err) {
      showToast("Data siswa tidak valid.", "error");
      return;
    }

    const selectedStatus = document.querySelector('input[name="manual-status"]:checked')?.value || 'Hadir';
    const mapel = dom.manualInputMapel ? dom.manualInputMapel.value.trim() : '-';
    const keterangan = dom.manualInputKeterangan ? dom.manualInputKeterangan.value.trim() : '';
    const selectedKelas = dom.manualSelectKelas ? dom.manualSelectKelas.value : student.id_kelas;
    const selectedOpt = dom.manualSelectKelas ? dom.manualSelectKelas.selectedOptions[0] : null;
    const namaKelasVal = selectedOpt?.dataset?.namaKelas || selectedKelas || student.nama_kelas;

    const now = new Date();
    const tanggalStr = now.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const hariStr = days[now.getDay()];
    const waktuStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';

    let existingDocId = null;
    if (currentSesiId) {
      try {
        const qCheck = query(
          collection(db, "log_absensi"),
          where("id_sesi", "==", currentSesiId),
          where("nis", "==", student.nis)
        );
        const checkSnap = await getDocs(qCheck);
        if (!checkSnap.empty) {
          existingDocId = checkSnap.docs[0].id;
          const confirmed = await showConfirm({
            title: "Siswa Sudah Memiliki Presensi",
            message: `Siswa [${student.nama_siswa}] sudah memiliki catatan pada sesi ini. Apakah Anda ingin memperbarui statusnya menjadi [${selectedStatus}]?`,
            icon: "fa-triangle-exclamation",
            confirmText: "Ya, Perbarui Status",
            type: "warning"
          });
          if (!confirmed) return;
        }
      } catch(eChk) {
        console.warn("Gagal cek duplikasi sesi:", eChk);
      }
    }

    if (dom.btnSubmitManualAbsen) dom.btnSubmitManualAbsen.disabled = true;

    try {
      const payload = {
        id_sesi: currentSesiId || "MANUAL_GURU",
        nis: student.nis,
        nama_siswa: student.nama_siswa,
        id_kelas: selectedKelas,
        nama_kelas: namaKelasVal,
        nama_sekolah: student.nama_sekolah || "",
        nama_mapel: mapel,
        hari: hariStr,
        tanggal: tanggalStr,
        waktu: waktuStr,
        status: selectedStatus,
        keterangan: keterangan || (selectedStatus === 'Hadir' ? 'Presensi Manual oleh Guru' : `Keterangan: ${selectedStatus}`),
        metode: "Manual Guru",
        device_id: "MANUAL_GURU"
      };

      if (existingDocId) {
        await updateDoc(doc(db, "log_absensi", existingDocId), {
          ...payload,
          updated_at: serverTimestamp()
        });
        showToast(`Status presensi [${student.nama_siswa}] berhasil diperbarui menjadi ${selectedStatus}`, "success");
      } else {
        await addDoc(collection(db, "log_absensi"), {
          ...payload,
          created_at: serverTimestamp()
        });
        showToast(`Presensi manual berhasil dicatat: [${student.nama_siswa}] - ${selectedStatus}`, "success");
        audioNotifier.playChime();
      }

      if (dom.modalManualAbsen) dom.modalManualAbsen.classList.add('hidden');
      if (dom.manualInputKeterangan) dom.manualInputKeterangan.value = '';

    } catch (err) {
      console.error("Gagal simpan absensi manual:", err);
      showToast("Gagal menyimpan presensi manual: " + err.message, "error");
    } finally {
      if (dom.btnSubmitManualAbsen) dom.btnSubmitManualAbsen.disabled = false;
    }
  });
}

