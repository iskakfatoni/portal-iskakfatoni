import { db } from "../config/firebase-config.js";
import { initializeAuthGuard } from "../auth/auth-guard.js";
import { 
  collection, 
  getDocs, 
  getDoc,
  doc, 
  query, 
  orderBy, 
  where, 
  writeBatch, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// -----------------------------------------------------------------
// 1. UTILITY & UTILS MODULES
// -----------------------------------------------------------------
const DateUtils = {
  getTodayISO() {
    const now = new Date();
    return now.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
  },
  getTodayFormattedText() {
    return new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  },
  formatLogTime(d) {
    let dayStr = d.hari || (d.tanggal ? new Date(d.tanggal).toLocaleDateString('id-ID', { weekday: 'long' }) : '');
    if (d.tanggal) {
      return `${dayStr ? dayStr + ', ' : ''}${d.tanggal} (${d.waktu || '-'})`;
    } else if (d.created_at && d.created_at.seconds) {
      return new Date(d.created_at.seconds * 1000).toLocaleString('id-ID', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    } else if (d.waktu) {
      return d.waktu;
    }
    return '-';
  }
};

const normClass = (k) => (k || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// DOM Elements
const selectSesi = document.getElementById('select-sesi');
const filterKelas = document.getElementById('filter-kelas');
const btnTampilkan = document.getElementById('btn-tampilkan');
const btnExportExcel = document.getElementById('btn-export-excel');
const tableBody = document.getElementById('table-body');
const totalRecord = document.getElementById('total-record');
const chkOnlyToday = document.getElementById('chk-only-today');
const chkIncludeAlpa = document.getElementById('chk-include-alpa');
const btnSaveAlpaLogs = document.getElementById('btn-save-alpa-logs');
const todayDateStrSpan = document.getElementById('today-date-str');
const statHadirCount = document.getElementById('stat-hadir-count');
const statAlpaCount = document.getElementById('stat-alpa-count');

let currentData = [];

if (todayDateStrSpan) todayDateStrSpan.innerText = DateUtils.getTodayFormattedText();

// 🔒 AUTH GUARD: Verifikasi Sesi sebelum menampilkan halaman
initializeAuthGuard({
  onAuthenticated: async () => {
    document.documentElement.style.display = 'block';
    await Promise.all([
      initKelasDropdown(),
      initSesiDropdown()
    ]);
    loadData();
  }
});

// -----------------------------------------------------------------
// 2. INISIALISASI DROPDOWN KELAS & SESI ABSENSI
// -----------------------------------------------------------------
async function initKelasDropdown() {
  try {
    const qKelas = query(collection(db, "kelas"));
    const snapKelas = await getDocs(qKelas);
    if (!snapKelas.empty) {
      filterKelas.innerHTML = '<option value="">-- Semua Kelas --</option>';
      snapKelas.forEach(docSnap => {
        const d = docSnap.data();
        const kName = d.nama_kelas || d.id_kelas || docSnap.id;
        const opt = document.createElement('option');
        opt.value = kName;
        opt.innerText = kName;
        filterKelas.appendChild(opt);
      });
    }
  } catch (err) {
    console.error("Gagal memuat daftar kelas:", err);
  }
}

async function initSesiDropdown() {
  try {
    const qSesi = query(collection(db, "sesi_absensi"), orderBy("created_at", "desc"));
    const snapSesi = await getDocs(qSesi);

    snapSesi.forEach(docSnap => {
      const d = docSnap.data();
      const opt = document.createElement('option');
      opt.value = docSnap.id;
      opt.innerText = `${d.tanggal || '-'} ${d.waktu ? '(' + d.waktu + ')' : ''} | ${d.id_kelas || '-'} (${d.nama_mapel || 'Mapel'})`;
      selectSesi.appendChild(opt);
    });
  } catch (err) {
    console.error("Gagal memuat daftar sesi:", err);
  }
}

// -----------------------------------------------------------------
// 3. FETCH DATA REKAP & LOGIKA SISWA TIDAK HADIR
// -----------------------------------------------------------------
btnTampilkan.addEventListener('click', loadData);
if (selectSesi) selectSesi.addEventListener('change', loadData);
if (filterKelas) filterKelas.addEventListener('change', loadData);
if (chkOnlyToday) chkOnlyToday.addEventListener('change', loadData);
if (chkIncludeAlpa) chkIncludeAlpa.addEventListener('change', loadData);

async function loadData() {
  btnTampilkan.disabled = true;
  btnTampilkan.innerText = "Memuat...";
  tableBody.innerHTML = `
    <tr>
      <td colspan="6" class="px-4 py-8 text-center text-xs text-slate-400 font-mono animate-pulse">
        // Mengambil data presensi dari server Firestore...
      </td>
    </tr>
  `;

  try {
    const selectedSesiId = selectSesi.value;
    const inputKelasVal = filterKelas.value.trim();
    const normInputKelas = normClass(inputKelasVal);
    const onlyToday = chkOnlyToday ? chkOnlyToday.checked : true;
    const includeAlpa = chkIncludeAlpa ? chkIncludeAlpa.checked : true;
    const todayISOStr = DateUtils.getTodayISO();

    let q;
    if (selectedSesiId) {
      q = query(collection(db, "log_absensi"), where("id_sesi", "==", selectedSesiId));
    } else {
      q = query(collection(db, "log_absensi"), orderBy("created_at", "desc"));
    }

    const querySnap = await getDocs(q);
    currentData = [];

    querySnap.forEach(docSnap => {
      const d = docSnap.data();
      
      // Filter 1: Hanya absensi hari ini jika checkbox aktif & tidak sedang memilih sesi spesifik
      if (onlyToday && !selectedSesiId) {
        let isToday = false;
        if (d.tanggal && d.tanggal === todayISOStr) {
          isToday = true;
        } else if (d.created_at && d.created_at.seconds) {
          const dDate = new Date(d.created_at.seconds * 1000).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
          if (dDate === todayISOStr) isToday = true;
        }
        if (!isToday) return;
      }

      // Filter 2: Filter kelas menggunakan normalisasi cerdas
      if (normInputKelas) {
        const k1 = normClass(d.id_kelas);
        const k2 = normClass(d.nama_kelas);
        if (k1 !== normInputKelas && k2 !== normInputKelas && !k1.includes(normInputKelas) && !k2.includes(normInputKelas)) {
          return;
        }
      }

      currentData.push({
        id: docSnap.id,
        nis: d.nis || "-",
        nama: d.nama_siswa || "-",
        kelas: d.id_kelas || d.nama_kelas || "-",
        waktu: DateUtils.formatLogTime(d),
        status: d.status || "Hadir",
        device_id: d.device_id || ""
      });
    });

    // Deteksi penggunaan HP Berbagi (1 device_id dipakai >1 siswa)
    const deviceCountMap = {};
    currentData.forEach(item => {
      if (item.device_id) {
        deviceCountMap[item.device_id] = (deviceCountMap[item.device_id] || 0) + 1;
      }
    });

    currentData.forEach(item => {
      if (item.device_id && deviceCountMap[item.device_id] > 1) {
        item.isSharedDevice = true;
        item.sharedCount = deviceCountMap[item.device_id];
      }
    });

    // Deteksi Siswa Tidak Hadir (S.d. 17:00 WIB)
    if (includeAlpa) {
      try {
        const snapSiswa = await getDocs(collection(db, "siswa"));
        const presentNisSet = new Set(currentData.map(d => String(d.nis).trim()));

        // Tentukan daftar kelas yang akan disaring alpa
        const targetClassSet = new Set();

        if (selectedSesiId) {
          const sesiDoc = await getDoc(doc(db, "sesi_absensi", selectedSesiId));
          if (sesiDoc.exists()) {
            const sKelas = sesiDoc.data().id_kelas || '';
            if (sKelas) targetClassSet.add(sKelas);
          }
        } else if (inputKelasVal) {
          targetClassSet.add(inputKelasVal);
        } else {
          // Ambil semua kelas yang memiliki log aktif
          currentData.forEach(item => {
            if (item.kelas && item.kelas !== '-') targetClassSet.add(item.kelas);
          });

          // Juga masukkan kelas dari sesi hari ini jika mode hari ini aktif
          if (onlyToday) {
            const qTodaySesi = query(collection(db, "sesi_absensi"), where("tanggal", "==", todayISOStr));
            const todaySesiSnap = await getDocs(qTodaySesi);
            todaySesiSnap.forEach(s => {
              const k = s.data().id_kelas || '';
              if (k) targetClassSet.add(k);
            });
          }
        }

        // Loop setiap kelas target & identifikasi siswa yang belum absen
        targetClassSet.forEach(targetClass => {
          const normTarget = normClass(targetClass);
          if (!normTarget) return;

          snapSiswa.forEach(siswaDoc => {
            const s = siswaDoc.data();
            const sK1 = normClass(s.id_kelas);
            const sK2 = normClass(s.nama_kelas);
            const sK3 = normClass(s.kelas);

            const match = (sK1 === normTarget || sK2 === normTarget || sK3 === normTarget);

            if (match) {
              const sNis = String(s.nis || siswaDoc.id).trim();
              if (!presentNisSet.has(sNis)) {
                currentData.push({
                  id: `alpa-${sNis}`,
                  isVirtualAlpa: true,
                  nis: s.nis || siswaDoc.id || "-",
                  nama: s.nama_siswa || s.nama || "-",
                  kelas: s.nama_kelas || targetClass,
                  waktu: `Tidak Absen (s.d. 17:00 WIB)`,
                  status: "Tidak Hadir"
                });
              }
            }
          });
        });

      } catch (errAlpa) {
        console.warn("Gagal menyaring siswa alpa kelas:", errAlpa);
      }
    }

    renderTable(currentData);

  } catch (err) {
    console.error("Error loading log absensi:", err);
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="px-4 py-8 text-center text-xs text-rose-400 font-mono">
          // Gagal mengambil data presensi dari server. Periksa koneksi Anda.
        </td>
      </tr>
    `;
  } finally {
    btnTampilkan.disabled = false;
    btnTampilkan.innerText = "🔍 Muat Data";
  }
}

// -----------------------------------------------------------------
// 4. RENDER DATA TABEL REKAPITULASI
// -----------------------------------------------------------------
function renderTable(data) {
  totalRecord.innerText = `Total: ${data.length} Baris`;

  const countHadir = data.filter(d => d.status.toLowerCase().includes('hadir') && !d.status.toLowerCase().includes('tidak')).length;
  const countAlpa = data.filter(d => d.status.toLowerCase().includes('tidak') || d.status.toLowerCase().includes('alpa')).length;

  if (statHadirCount) statHadirCount.innerText = countHadir;
  if (statAlpaCount) statAlpaCount.innerText = countAlpa;

  if (data.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="px-4 py-8 text-center text-xs text-slate-500 font-mono">
          // Tidak ada data absensi yang sesuai dengan kriteria filter.
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  data.forEach((item, idx) => {
    const isHadir = item.status.toLowerCase().includes('hadir') && !item.status.toLowerCase().includes('tidak');
    const badgeClass = isHadir 
      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold' 
      : 'bg-rose-500/15 text-rose-400 border-rose-500/40 font-bold';

    const iconHTML = isHadir 
      ? '<i class="fa-solid fa-circle-check text-emerald-400 mr-1"></i>' 
      : '<i class="fa-solid fa-triangle-exclamation text-rose-400 mr-1"></i>';

    let sharedBadgeHTML = '';
    if (item.isSharedDevice) {
      sharedBadgeHTML = `
        <span class="px-2 py-0.5 ml-1.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono inline-flex items-center gap-1" title="Perangkat HP ini digunakan oleh ${item.sharedCount} siswa untuk absen">
          <i class="fa-solid fa-mobile-screen-button text-amber-400"></i> HP Berbagi (${item.sharedCount} Siswa)
        </span>
      `;
    }

    html += `
      <tr class="hover:bg-slate-700/30 transition border-b border-slate-800/60">
        <td class="px-4 py-3 font-mono text-slate-400 text-xs">${idx + 1}</td>
        <td class="px-4 py-3 text-xs font-mono text-slate-300">${item.waktu}</td>
        <td class="px-4 py-3 font-mono text-xs text-slate-200 font-bold">${item.nis}</td>
        <td class="px-4 py-3 font-semibold text-white">${item.nama}</td>
        <td class="px-4 py-3 text-xs text-slate-300">${item.kelas}</td>
        <td class="px-4 py-3 text-center">
          <span class="px-2.5 py-1 border rounded-lg text-[11px] inline-flex items-center ${badgeClass}">
            ${iconHTML} ${item.status}
          </span>
          ${sharedBadgeHTML}
        </td>
      </tr>
    `;
  });

  tableBody.innerHTML = html;
}

// -----------------------------------------------------------------
// 5. BATCH SIMPAN STATUS 'TIDAK HADIR' KE FIRESTORE
// -----------------------------------------------------------------
if (btnSaveAlpaLogs) {
  btnSaveAlpaLogs.addEventListener('click', async () => {
    const virtualAlpaItems = currentData.filter(d => d.isVirtualAlpa);
    if (virtualAlpaItems.length === 0) {
      alert("Tidak ada data siswa 'Tidak Hadir' yang perlu disimpan untuk kelas ini.\n\nTips: Pilih Sesi atau pilih Nama Kelas pada filter untuk mendeteksi siswa yang belum absen.");
      return;
    }

    const confirmMsg = `Konfirmasi Simpan Status 'Tidak Hadir':\n\nSimpan ${virtualAlpaItems.length} siswa kelas ini yang belum absen sampai 17:00 WIB ke database Firestore?`;
    if (!confirm(confirmMsg)) return;

    btnSaveAlpaLogs.disabled = true;
    btnSaveAlpaLogs.innerText = "Menyimpan...";

    try {
      const batch = writeBatch(db);
      const now = new Date();
      const hariStr = now.toLocaleDateString('id-ID', { weekday: 'long' });
      const todayISOStr = DateUtils.getTodayISO();

      virtualAlpaItems.forEach(item => {
        const newRef = doc(collection(db, "log_absensi"));
        batch.set(newRef, {
          nis: item.nis,
          nama_siswa: item.nama,
          id_kelas: item.kelas,
          hari: hariStr,
          tanggal: todayISOStr,
          waktu: '17:00 WIB',
          status: 'Tidak Hadir',
          created_at: serverTimestamp()
        });
      });

      await batch.commit();
      alert(`Berhasil menyimpan ${virtualAlpaItems.length} log 'Tidak Hadir' ke database!`);
      loadData();
    } catch (err) {
      console.error("Gagal menyimpan batch alpa:", err);
      alert("Gagal menyimpan data: " + err.message);
    } finally {
      btnSaveAlpaLogs.disabled = false;
      btnSaveAlpaLogs.innerText = "⚡ Simpan Auto 'Tidak Hadir' ke DB";
    }
  });
}

// -----------------------------------------------------------------
// 6. EXPORT LAPORAN EXCEL (.XLSX) VIA SHEETJS
// -----------------------------------------------------------------
btnExportExcel.addEventListener('click', () => {
  if (currentData.length === 0) {
    alert("Tidak ada data untuk di-export. Silakan muat data terlebih dahulu.");
    return;
  }

  const excelRows = currentData.map((item, index) => ({
    "No": index + 1,
    "Waktu / Tanggal": item.waktu,
    "NIS": item.nis,
    "Nama Siswa": item.nama,
    "Kelas": item.kelas,
    "Status Kehadiran": item.status,
    "Keterangan Perangkat": item.isSharedDevice ? `HP Berbagi (${item.sharedCount} Siswa)` : 'HP Mandiri'
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelRows);
  const workbook = XLSX.utils.book_new();

  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 28 }, // Waktu / Tanggal
    { wch: 15 }, // NIS
    { wch: 30 }, // Nama Siswa
    { wch: 15 }, // Kelas
    { wch: 18 }, // Status Kehadiran
    { wch: 25 }  // Keterangan Perangkat
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Presensi");

  const kelasPrefix = filterKelas.value.trim() ? `${filterKelas.value.trim().replace(/\s+/g, '_')}_` : '';
  const filename = `Rekap_Presensi_${kelasPrefix}${DateUtils.getTodayISO()}.xlsx`;

  XLSX.writeFile(workbook, filename);
});
