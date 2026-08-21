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
  textSound: document.getElementById('text-sound')
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
    let createdTimeMs = Date.now();
    if (activeDocData.created_at && activeDocData.created_at.seconds) {
      createdTimeMs = activeDocData.created_at.seconds * 1000;
      const nowMs = Date.now();
      if ((nowMs - createdTimeMs) > 60 * 60 * 1000) {
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

    const createdMs = activeDocData.created_at?.seconds ? (activeDocData.created_at.seconds * 1000) : Date.now();
    startCountdownTimer(createdMs);

    if (qrInterval) clearInterval(qrInterval);
    qrInterval = setInterval(async () => {
      if (!currentSesiId) return;
      activeToken = 'QR-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      await updateDoc(doc(db, "sesi_absensi", currentSesiId), {
        current_qr_token: activeToken
      });
      updateQRDisplay(activeToken);
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
          return kMatch && mMapel;
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
          is_active: true,
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
        activeToken = 'QR-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        await updateDoc(doc(db, "sesi_absensi", currentSesiId), {
          current_qr_token: activeToken
        });
        updateQRDisplay(activeToken);
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
      item.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 font-bold flex items-center justify-center">${count}</div>
          <div>
            <p class="font-bold text-white text-sm">${data.nama_siswa}</p>
            <p class="text-[11px] text-slate-400 font-mono">NIS: ${data.nis} | ${data.id_kelas}</p>
          </div>
        </div>
        <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          ✔ ${data.status || 'Hadir'}
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
