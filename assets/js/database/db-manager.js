import { db } from "../config/firebase-config.js";
import { initializeAuthGuard } from "../auth/auth-guard.js";
import { AIInsightEngine } from "./ai-insights.js";
import { collection, doc, getDocs, setDoc, addDoc, deleteDoc, updateDoc, deleteField, onSnapshot, writeBatch, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// -----------------------------------------------------------------
// 1. STATE REAKTIF APLIKASI (STATE MANAGEMENT)
// -----------------------------------------------------------------
const state = {
  currentCollection: 'siswa',
  deviceFilter: 'all',
  logDateFilter: 'all',
  unsubscribeCurrent: null,
  selectedDocIds: new Set(),
  currentDocsList: [],
  currentDynamicFields: [],
  currentSortField: null,
  currentSortOrder: 'asc',
  searchQuery: '',
  currentPage: 1,
  pageSize: 25,
  parsedImportData: [],
  sidebarCollapsed: false,
  prevDocIds: new Set(), // Untuk melacak dokumen baru (animation)
  isAuditMode: false,
  duplicateDeviceIds: new Set(),
  miniChart: null,
  allStudents: [], // Cache data siswa untuk cross-check alpa
  refreshTimer: null
};

// DOM ELEMENTS REGISTRY
const dom = {
  btnToggleAnalytics: document.getElementById('btn-toggle-analytics'),
  btnAuditSecurity: document.getElementById('btn-audit-security'),
  analyticsPanel: document.getElementById('analytics-panel'),
  analyticsInsights: document.getElementById('analytics-insights'),
  miniChartCanvas: document.getElementById('miniChartCanvas'),
  userEmailDisplay: document.getElementById('user-email-display'),
  btnLogout: document.getElementById('btn-logout'),
  activeCollectionTitle: document.getElementById('active-collection-title'),
  tableHeaderRow: document.getElementById('table-header-row'),
  tableBody: document.getElementById('table-body'),
  selectAllCheckbox: document.getElementById('select-all-checkbox'),
  btnDeleteSelected: document.getElementById('btn-delete-selected'),
  btnResetSelectedDevice: document.getElementById('btn-reset-selected-device'),
  selectedResetCountSpan: document.getElementById('selected-reset-count'),
  btnExportSelectedExcel: document.getElementById('btn-export-selected-excel'),
  selectedExportCountSpan: document.getElementById('selected-export-count'),
  btnClearCollection: document.getElementById('btn-clear-collection'),
  selectedCountSpan: document.getElementById('selected-count'),
  btnExportDeviceExcel: document.getElementById('btn-export-device-excel'),
  
  // Fullscreen & Sidebar Controls
  btnToggleSidebar: document.getElementById('btn-toggle-sidebar'),
  btnToggleFullscreen: document.getElementById('btn-toggle-fullscreen'),
  sidebarContainer: document.getElementById('sidebar-container'),
  tableSectionContainer: document.getElementById('table-section-container'),
  
  // Search & Stats
  inputSearchDb: document.getElementById('input-search-db'),
  btnClearSearch: document.getElementById('btn-clear-search'),
  statTotalDoc: document.getElementById('stat-total-doc'),
  statLabel1: document.getElementById('stat-label-1'),
  statVal1: document.getElementById('stat-val-1'),
  statIcon1: document.getElementById('stat-icon-1'),
  statLabel2: document.getElementById('stat-label-2'),
  statVal2: document.getElementById('stat-val-2'),
  statIcon2: document.getElementById('stat-icon-2'),
  statVal3: document.getElementById('stat-val-3'),
  
  // Pagination
  selectPageSize: document.getElementById('select-page-size'),
  pageInfo: document.getElementById('page-info'),
  btnPrevPage: document.getElementById('btn-prev-page'),
  btnNextPage: document.getElementById('btn-next-page'),
  
  // Modal Add
  btnAddNewData: document.getElementById('btn-add-new-data'),
  modalAddData: document.getElementById('modal-add-data'),
  modalColName: document.getElementById('modal-col-name'),
  btnCloseAddModal: document.getElementById('btn-close-add-modal'),
  btnCancelAddModal: document.getElementById('btn-cancel-add-modal'),
  formAddManual: document.getElementById('form-add-manual'),
  inputDocId: document.getElementById('input-doc-id'),
  dynamicInputFields: document.getElementById('dynamic-input-fields'),
  btnAddCustomFieldAdd: document.getElementById('btn-add-custom-field-add'),
  
  // Modal Import
  btnOpenImportModal: document.getElementById('btn-open-import-modal'),
  modalImportFile: document.getElementById('modal-import-file'),
  importColName: document.getElementById('import-col-name'),
  btnCloseImportModal: document.getElementById('btn-close-import-modal'),
  btnCancelImportModal: document.getElementById('btn-cancel-import-modal'),
  importFileInput: document.getElementById('import-file-input'),
  btnProcessImport: document.getElementById('btn-process-import'),
  importLogBox: document.getElementById('import-log-box'),
  btnDownloadTemplate: document.getElementById('btn-download-template'),
  
  // Modal Edit
  modalEditData: document.getElementById('modal-edit-data'),
  editModalDocId: document.getElementById('edit-modal-doc-id'),
  inputEditDocId: document.getElementById('input-edit-doc-id'),
  editDynamicInputFields: document.getElementById('edit-dynamic-input-fields'),
  btnAddCustomFieldEdit: document.getElementById('btn-add-custom-field-edit'),
  btnCloseEditModal: document.getElementById('btn-close-edit-modal'),
  btnCancelEditModal: document.getElementById('btn-cancel-edit-modal'),
  formEditManual: document.getElementById('form-edit-manual')
};

// -----------------------------------------------------------------
// 2. HELPER UTILS & SANITIZER (FORMATTING & BATCH CHUNKING)
// -----------------------------------------------------------------
const Sanitizer = {
  formatCellContent(value, fieldKey = '', docId = '') {
    if (value === null || value === undefined) return '<span class="text-slate-600">-</span>';

    if (typeof value === 'object' && value.seconds !== undefined) {
      return `<span class="text-emerald-400 font-semibold">${new Date(value.seconds * 1000).toLocaleString('id-ID')}</span>`;
    }

    if (typeof value === 'object') {
      return `<span class="text-amber-300/80 font-mono text-[11px]">${JSON.stringify(value)}</span>`;
    }

    if (typeof value === 'boolean') {
      const checked = value ? 'checked' : '';
      return `<div class="flex items-center justify-center">
                <input type="checkbox" ${checked} data-doc="${docId}" data-field="${fieldKey}" class="toggle-boolean-field rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer w-4 h-4" title="Ubah boolean ${fieldKey}">
              </div>`;
    }

    return String(value);
  },

  formatHeaderName(fieldKey) {
    const lower = fieldKey.toLowerCase();
    const headerMap = {
      'nis': 'NIS',
      'nama_siswa': 'Nama Siswa',
      'id_kelas': 'Kelas',
      'nama_kelas': 'Nama Kelas',
      'nama_mapel': 'Mata Pelajaran',
      'wali_kelas': 'Guru Kelas',
      'device_id': 'ID Perangkat HP',
      'device_info': 'Merek/Model HP',
      'hari': 'Hari',
      'tanggal': 'Tanggal',
      'waktu': 'Waktu Presensi',
      'status': 'Status Kehadiran',
      'is_active': 'Status Sesi',
      'current_qr_token': 'Token Sesi QR',
      'action': 'Aksi System',
      'target_nis': 'NIS Siswa',
      'target_name': 'Nama Siswa',
      'admin_email': 'Admin',
      'old_device_id': 'ID Perangkat Lama',
      'old_device_info': 'Merek HP Lama',
      'timestamp': 'Waktu Kejadian'
    };
    return headerMap[lower] || fieldKey;
  },

  castFieldValue(rawVal, keyName) {
    const val = rawVal.trim();
    const lowerKey = keyName.toLowerCase();

    if (val === 'true') return true;
    if (val === 'false') return false;

    // Proteksi NIS, ID, dan No HP agar selalu disimpan sebagai String (Mencegah leading zero hilang)
    if (!isNaN(val) && val !== '' && !lowerKey.includes('nis') && !lowerKey.includes('id') && !lowerKey.includes('phone') && !lowerKey.includes('hp')) {
      return Number(val);
    }
    return val;
  }
};

const BatchUtils = {
  async chunkedDelete(docIdsArray, collectionName) {
    const CHUNK_SIZE = 400;
    for (let i = 0; i < docIdsArray.length; i += CHUNK_SIZE) {
      const chunk = docIdsArray.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach(id => batch.delete(doc(db, collectionName, id)));
      await batch.commit();
    }
  }
};

// -----------------------------------------------------------------
// 3. STATS MANAGER (RINGKASAN STATISTIK DOKUMEN DYNAMIC)
// -----------------------------------------------------------------
const StatsManager = {
  updateStats(filteredCount) {
    dom.statTotalDoc.innerText = state.currentDocsList.length;
    dom.statVal3.innerText = `${filteredCount} Baris`;

    if (state.currentCollection === 'siswa') {
      dom.statLabel1.innerText = 'HP Terikat';
      dom.statIcon1.className = 'fa-solid fa-mobile-screen-button text-emerald-500 text-lg';
      dom.statLabel2.innerText = 'HP Belum Terikat';
      dom.statIcon2.className = 'fa-solid fa-mobile-retro text-amber-500 text-lg';

      let bound = 0, unbound = 0;
      state.currentDocsList.forEach(d => {
        const data = d.data();
        if (data.device_id || data.device_token || data.mac_address) bound++;
        else unbound++;
      });
      dom.statVal1.innerText = bound;
      dom.statVal2.innerText = unbound;
    } else if (state.currentCollection === 'links') {
      dom.statLabel1.innerText = 'Link Aktif';
      dom.statIcon1.className = 'fa-solid fa-circle-check text-emerald-500 text-lg';
      dom.statLabel2.innerText = 'Link Nonaktif';
      dom.statIcon2.className = 'fa-solid fa-circle-xmark text-rose-500 text-lg';

      let active = 0, inactive = 0;
      state.currentDocsList.forEach(d => {
        const data = d.data();
        if (data.is_active !== false) active++;
        else inactive++;
      });
      dom.statVal1.innerText = active;
      dom.statVal2.innerText = inactive;
    } else if (state.currentCollection === 'sesi_absensi') {
      dom.statLabel1.innerText = 'Sesi Terbuka';
      dom.statIcon1.className = 'fa-solid fa-door-open text-emerald-500 text-lg';
      dom.statLabel2.innerText = 'Sesi Ditutup';
      dom.statIcon2.className = 'fa-solid fa-door-closed text-slate-500 text-lg';

      let openCount = 0, closedCount = 0;
      state.currentDocsList.forEach(d => {
        const data = d.data();
        if (data.is_active) openCount++;
        else closedCount++;
      });
      dom.statVal1.innerText = openCount;
      dom.statVal2.innerText = closedCount;
    } else if (state.currentCollection === 'log_absensi') {
      dom.statLabel1.innerText = 'Presensi Hadir';
      dom.statIcon1.className = 'fa-solid fa-user-check text-emerald-500 text-lg';
      dom.statLabel2.innerText = 'Total Sesi Log';
      dom.statIcon2.className = 'fa-solid fa-clock-rotate-left text-cyan-500 text-lg';

      let hadirCount = 0;
      state.currentDocsList.forEach(d => {
        const data = d.data();
        if (data.status === 'HADIR' || !data.status) hadirCount++;
      });
      dom.statVal1.innerText = hadirCount;
      dom.statVal2.innerText = state.currentDocsList.length;
    } else {
      dom.statLabel1.innerText = 'Field Unik';
      dom.statIcon1.className = 'fa-solid fa-tags text-cyan-500 text-lg';
      dom.statLabel2.innerText = 'Status Sync';
      dom.statIcon2.className = 'fa-solid fa-cloud text-emerald-500 text-lg';

      dom.statVal1.innerText = `${state.currentDynamicFields.length} Kolom`;
      dom.statVal2.innerText = 'Aktif';
    }

    AnalyticsManager.updateAnalytics();
  }
};

// -----------------------------------------------------------------
// 3.5. ANALYTICS & AI INSIGHTS MANAGER (NEW)
// -----------------------------------------------------------------
const AnalyticsManager = {
  cachedLogs: null,
  cachedAbsensi: null,
  cachedSesi: null,
  cachedStudents: null,

  toggle() {
    if (!dom.analyticsPanel) return;
    const isHidden = dom.analyticsPanel.classList.toggle('hidden');
    if (!isHidden) {
      this.updateAnalytics();
    }
  },

  async updateAnalytics() {
    if (!dom.analyticsPanel || dom.analyticsPanel.classList.contains('hidden')) return;

    try {
      if (!this.cachedLogs || !this.cachedAbsensi || !this.cachedSesi || !this.cachedStudents) {
        const [snapLogs, snapAbsensi, snapSesi, snapSiswa] = await Promise.all([
          getDocs(collection(db, "system_logs")),
          getDocs(collection(db, "log_absensi")),
          getDocs(collection(db, "sesi_absensi")),
          getDocs(collection(db, "siswa"))
        ]);
        this.cachedLogs = snapLogs.docs;
        this.cachedAbsensi = snapAbsensi.docs;
        this.cachedSesi = snapSesi.docs;
        this.cachedStudents = snapSiswa.docs;
      }

      const findings = AIInsightEngine.analyze({
        systemLogs: this.cachedLogs,
        logAbsensi: this.cachedAbsensi,
        sesiAbsensi: this.cachedSesi,
        siswaList: this.cachedStudents
      });

      // Render Top Findings into dom.analyticsInsights
      if (dom.analyticsInsights) {
        if (findings.length === 0) {
          dom.analyticsInsights.innerHTML = `
            <div class="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-emerald-400 font-mono text-[11px] col-span-2 flex items-center gap-2">
              <i class="fa-solid fa-circle-check text-base"></i>
              <span>Tidak ada anomali atau ancaman manipulasi perangkat terdeteksi.</span>
            </div>
          `;
        } else {
          const topFindings = findings.slice(0, 4);
          dom.analyticsInsights.innerHTML = topFindings.map(f => {
            const isHigh = f.severity === 'HIGH';
            const isPos = f.severity === 'POSITIVE';
            const colorClass = isHigh ? 'text-rose-400 border-rose-500/30 bg-rose-950/20' : isPos ? 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20' : 'text-amber-400 border-amber-500/30 bg-amber-950/20';
            const icon = isHigh ? 'fa-triangle-exclamation' : isPos ? 'fa-award' : 'fa-clock-rotate-left';
            return `
              <div class="p-2.5 rounded-xl border ${colorClass} text-[10px] sm:text-[11px] font-mono space-y-1">
                <div class="flex items-center justify-between gap-1 font-bold">
                  <span class="truncate"><i class="fa-solid ${icon} mr-1"></i> ${f.categoryLabel}</span>
                  <span class="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800">${f.severity}</span>
                </div>
                <div class="text-white font-bold text-[11px] truncate">${f.nama} (${f.nis})</div>
                <div class="text-slate-400 text-[10px] leading-tight line-clamp-2">${f.summary}</div>
              </div>
            `;
          }).join('');
        }
      }

      // Draw Mini Chart Canvas
      if (dom.miniChartCanvas) {
        const ctx = dom.miniChartCanvas.getContext('2d');
        if (ctx) {
          const w = dom.miniChartCanvas.width = 150;
          const h = dom.miniChartCanvas.height = 150;
          ctx.clearRect(0, 0, w, h);

          const centerX = w / 2;
          const centerY = h / 2;
          const radius = 52;
          const lineWidth = 14;

          const totalDocs = state.currentDocsList.length || 1;
          let valA = 0;
          let colorA = '#38bdf8';
          let colorB = '#1e293b';

          if (state.currentCollection === 'siswa') {
            valA = state.currentDocsList.filter(d => Boolean(d.data().device_id)).length;
            colorA = '#10b981'; // Bound
            colorB = '#f59e0b'; // Unbound
          } else if (state.currentCollection === 'log_absensi') {
            valA = state.currentDocsList.filter(d => (d.data().status || '').toUpperCase() === 'HADIR').length;
            colorA = '#06b6d4'; // Hadir
            colorB = '#f43f5e'; // Tidak Hadir
          } else if (state.currentCollection === 'sesi_absensi') {
            valA = state.currentDocsList.filter(d => d.data().is_active).length;
            colorA = '#10b981'; // Aktif
            colorB = '#475569'; // Tutup
          } else {
            valA = Math.floor(totalDocs * 0.75);
            colorA = '#6366f1';
            colorB = '#1e293b';
          }

          const ratioA = totalDocs > 0 ? (valA / totalDocs) : 0;
          const angleA = ratioA * 2 * Math.PI;

          // Segment A
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + angleA);
          ctx.lineWidth = lineWidth;
          ctx.strokeStyle = colorA;
          ctx.lineCap = 'round';
          ctx.stroke();

          // Segment B
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, -Math.PI / 2 + angleA, 1.5 * Math.PI);
          ctx.lineWidth = lineWidth;
          ctx.strokeStyle = colorB;
          ctx.lineCap = 'round';
          ctx.stroke();

          // Center Text
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${Math.round(ratioA * 100)}%`, centerX, centerY - 4);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '9px monospace';
          ctx.fillText('Rasio Utama', centerX, centerY + 12);
        }
      }
    } catch (e) {
      console.warn("[AnalyticsManager] Error:", e);
    }
  }
};

// -----------------------------------------------------------------
// 4. TABLE RENDERER ENGINE (SEARCH, SORTING, PAGINATION & EVENTS)
// -----------------------------------------------------------------
const TableEngine = {
  getFilteredAndSortedDocs() {
    let docs = [...state.currentDocsList];

    // 1. Device Filter khusus koleksi 'siswa'
    if (state.currentCollection === 'siswa' && state.deviceFilter !== 'all') {
      docs = docs.filter(docSnap => {
        const data = docSnap.data();
        const isBound = Boolean(data.device_id || data.device_token || data.mac_address);
        return state.deviceFilter === 'bound' ? isBound : !isBound;
      });
    }

    // 2. Log Absensi Date Filter (Pemisahan menurut Hari / Tanggal)
    if (state.currentCollection === 'log_absensi' && state.logDateFilter !== 'all') {
      const now = new Date();
      let targetDateStr = state.logDateFilter;

      if (state.logDateFilter === 'today') {
        targetDateStr = now.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
      } else if (state.logDateFilter === 'yesterday') {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        targetDateStr = y.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
      }

      docs = docs.filter(docSnap => {
        const data = docSnap.data();
        let docDateStr = data.tanggal || '';
        if (!docDateStr && data.created_at && data.created_at.seconds) {
          docDateStr = new Date(data.created_at.seconds * 1000).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
        }
        return docDateStr === targetDateStr;
      });
    }

    // 2. Live Search Filtering
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      docs = docs.filter(docSnap => {
        if (docSnap.id.toLowerCase().includes(q)) return true;
        const data = docSnap.data();
        return Object.values(data).some(val => {
          if (val === null || val === undefined) return false;
          if (typeof val === 'object' && val.seconds !== undefined) {
            return new Date(val.seconds * 1000).toLocaleString('id-ID').toLowerCase().includes(q);
          }
          return String(val).toLowerCase().includes(q);
        });
      });
    }

    // 2. Sorting Logic
    let sortField = state.currentSortField;
    let sortOrder = state.currentSortOrder;

    // FITUR: Default sort "Terbaru" untuk Log & Sesi jika user belum memilih sorting manual
    if (!sortField) {
      if (state.currentCollection === 'log_absensi' || state.currentCollection === 'sesi_absensi' || state.currentCollection === 'system_logs') {
        sortField = 'timestamp'; // system_logs menggunakan 'timestamp'
        if (state.currentCollection !== 'system_logs') sortField = 'created_at';
        sortOrder = 'desc';
      } else {
        sortField = '__id__';
        sortOrder = 'asc';
      }
    }

    if (sortField) {
      docs.sort((a, b) => {
        let valA, valB;
        if (sortField === '__id__') {
          valA = a.id;
          valB = b.id;
        } else {
          valA = a.data()[sortField];
          valB = b.data()[sortField];
        }

        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';

        if (typeof valA === 'object' && valA.seconds !== undefined) valA = valA.seconds;
        if (typeof valB === 'object' && valB.seconds !== undefined) valB = valB.seconds;

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return docs;
  },

  renderHeaders() {
    const getSortIcon = (field) => {
      if (state.currentSortField !== field) return '<span class="text-[10px] text-slate-600 ml-1">⇅</span>';
      return state.currentSortOrder === 'asc'
        ? '<span class="text-[10px] text-cyan-400 ml-1">▲</span>'
        : '<span class="text-[10px] text-cyan-400 ml-1">▼</span>';
    };

    const fieldsHeaderHTML = state.currentDynamicFields.map(f => {
      const isSorted = state.currentSortField === f;
      const bgClass = isSorted ? 'bg-cyan-950/40 text-cyan-300 font-bold' : 'text-slate-300 font-semibold';
      return `
        <th class="p-3 border-r border-slate-800 ${bgClass} cursor-pointer hover:bg-slate-800/80 transition select-none sort-header resizable-th min-w-[110px]" data-sort="${f}">
          <div class="flex items-center justify-between gap-1.5 pr-2">
            <span class="truncate">${Sanitizer.formatHeaderName(f)}</span>
            ${getSortIcon(f)}
          </div>
          <div class="resizer" title="Geser untuk merubah lebar kolom"></div>
        </th>
      `;
    }).join('');

    dom.tableHeaderRow.innerHTML = `
      <th class="p-3 w-12 text-center border-r border-slate-800 font-bold text-slate-400">NO</th>
      ${fieldsHeaderHTML}
      <th class="p-3 w-10 text-center border-r border-slate-800">
        <input type="checkbox" id="select-all-checkbox" class="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer" title="Pilih Semua">
      </th>
      <th class="p-3 w-32 text-center">Aksi</th>
    `;

    const headerChk = document.getElementById('select-all-checkbox');
    if (headerChk) {
      const filteredDocs = TableEngine.getFilteredAndSortedDocs();
      const allFilteredSelected = filteredDocs.length > 0 && filteredDocs.every(d => state.selectedDocIds.has(d.id));
      headerChk.checked = allFilteredSelected;
      headerChk.onclick = (e) => TableEngine.handleSelectAll(e.target.checked);
    }

    document.querySelectorAll('.sort-header').forEach(th => {
      th.onclick = (e) => {
        if (e.target.classList.contains('resizer')) return; // Abaikan jika sedang melakukan resize
        const sortKey = th.getAttribute('data-sort');
        if (state.currentSortField === sortKey) {
          state.currentSortOrder = state.currentSortOrder === 'asc' ? 'desc' : 'asc';
        } else {
          state.currentSortField = sortKey;
          state.currentSortOrder = 'asc';
        }
        TableEngine.renderHeaders();
        TableEngine.renderBody();
      };
    });

    TableEngine.initColumnResizers();
  },

  initColumnResizers() {
    document.querySelectorAll('.resizable-th .resizer').forEach(resizer => {
      resizer.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();

        const th = resizer.parentElement;
        const startX = e.pageX;
        const startWidth = th.offsetWidth;
        resizer.classList.add('resizing');

        const onMouseMove = (moveEvent) => {
          const newWidth = Math.max(70, startWidth + (moveEvent.pageX - startX));
          th.style.width = `${newWidth}px`;
          th.style.minWidth = `${newWidth}px`;
        };

        const onMouseUp = () => {
          resizer.classList.remove('resizing');
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });
    });
  },

  renderBody() {
    const filteredDocs = TableEngine.getFilteredAndSortedDocs();
    StatsManager.updateStats(filteredDocs.length);

    if (filteredDocs.length === 0) {
      dom.tableBody.innerHTML = `<tr><td colspan="${state.currentDynamicFields.length + 3}" class="p-8 text-center text-slate-500 font-sans">// Tidak ada data yang cocok dengan kriteria.</td></tr>`;
      dom.pageInfo.innerText = 'Halaman 0 dari 0';
      dom.btnPrevPage.disabled = true;
      dom.btnNextPage.disabled = true;
      TableEngine.updateSelectedUI();
      return;
    }

    // Pagination Math
    const totalItems = filteredDocs.length;
    const pSize = Number(state.pageSize);
    const totalPages = pSize === 0 ? 1 : Math.ceil(totalItems / pSize);

    if (state.currentPage > totalPages) state.currentPage = totalPages;
    if (state.currentPage < 1) state.currentPage = 1;

    const startIndex = pSize === 0 ? 0 : (state.currentPage - 1) * pSize;
    const endIndex = pSize === 0 ? totalItems : Math.min(startIndex + pSize, totalItems);
    const pageDocs = filteredDocs.slice(startIndex, endIndex);

    dom.pageInfo.innerText = pSize === 0 
      ? `Menampilkan seluruh ${totalItems} dokumen`
      : `Halaman ${state.currentPage} dari ${totalPages} | Dokumen ${startIndex + 1}-${endIndex} dari ${totalItems}`;

    dom.btnPrevPage.disabled = state.currentPage <= 1;
    dom.btnNextPage.disabled = state.currentPage >= totalPages;

    dom.tableBody.innerHTML = '';
    pageDocs.forEach((docSnap, index) => {
      const docId = docSnap.id;
      const dataObj = docSnap.data();
      const isChecked = state.selectedDocIds.has(docId);
      const globalRowIndex = startIndex + index + 1;

      const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-900/80 transition border-b border-slate-800/40";

      // 🟢 Fitur 5: Visual Flash Animation (Real-time Feedback)
      if (state.prevDocIds.size > 0 && !state.prevDocIds.has(docId)) {
        tr.classList.add('animate-flash-green');
      }

      // 🔴 Fitur 1: Auditing (Highlight duplicates)
      if (state.isAuditMode && dataObj.device_id && state.duplicateDeviceIds.has(dataObj.device_id)) {
        tr.classList.add('row-duplicate-warning');
      }

      const fieldCells = state.currentDynamicFields.map(fieldKey => {
        let val = dataObj[fieldKey];

        // Fallback pintar untuk dokumen lama yang belum memiliki field hari/tanggal secara eksplisit
        if ((val === undefined || val === null || val === '') && dataObj.created_at && dataObj.created_at.seconds) {
          const dObj = new Date(dataObj.created_at.seconds * 1000);
          if (fieldKey === 'hari') {
            val = dObj.toLocaleDateString('id-ID', { weekday: 'long' });
          } else if (fieldKey === 'tanggal') {
            val = dObj.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
          } else if (fieldKey === 'waktu') {
            val = dObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
          }
        }

        return `<td class="p-3 border-r border-slate-800/60 whitespace-nowrap overflow-hidden text-ellipsis">${Sanitizer.formatCellContent(val, fieldKey, docId)}</td>`;
      }).join('');

    const isSiswaCollection = state.currentCollection === 'siswa';
    const isLinksCollection = state.currentCollection === 'links' || state.currentCollection === 'sesi_absensi';

    const btnResetDeviceHTML = isSiswaCollection ? `
      <button class="btn-reset-device p-1.5 bg-amber-500/15 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold cursor-pointer transition mr-1" title="Reset Perangkat HP Siswa">
        <i class="fa-solid fa-mobile-screen-button"></i>
      </button>
    ` : '';

    // 🔵 Fitur 4: Smart Actions (QR & Preview)
    const btnSmartActionHTML = isLinksCollection ? `
      <button class="btn-smart-action p-1.5 bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-semibold cursor-pointer transition mr-1" title="Buka Link / Generate QR">
        <i class="fa-solid ${state.currentCollection === 'links' ? 'fa-external-link' : 'fa-qrcode'}"></i>
      </button>
    ` : '';

    tr.innerHTML = `
      <td class="p-3 text-center border-r border-slate-800/60 font-mono text-slate-400 font-bold">${globalRowIndex}</td>
      ${fieldCells}
      <td class="p-3 text-center border-r border-slate-800/60">
        <input type="checkbox" data-id="${docId}" ${isChecked ? 'checked' : ''} class="row-checkbox rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer">
      </td>
      <td class="p-3 text-center whitespace-nowrap">
        ${btnResetDeviceHTML}
        ${btnSmartActionHTML}
        <button class="btn-edit-single p-1.5 bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-semibold cursor-pointer transition mr-1" title="Edit Dokumen">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
          <button class="btn-del-single p-1.5 bg-red-500/15 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold cursor-pointer transition" title="Hapus Dokumen">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      `;

      // Event Checkbox Boolean Inline
      tr.querySelectorAll('.toggle-boolean-field').forEach(chk => {
        chk.onchange = async (e) => {
          const targetField = e.target.getAttribute('data-field');
          const targetDocId = e.target.getAttribute('data-doc');
          const newValue = e.target.checked;
          try {
            await updateDoc(doc(db, state.currentCollection, targetDocId), { [targetField]: newValue });
          } catch (err) {
            alert(`Gagal merubah status ${targetField}: ` + err.message);
            e.target.checked = !newValue;
          }
        };
      });

      // Event Row Selection Checkbox
      const chk = tr.querySelector('.row-checkbox');
      chk.onchange = (e) => {
        if (e.target.checked) state.selectedDocIds.add(docId);
        else state.selectedDocIds.delete(docId);
        TableEngine.updateSelectedUI();
      };

      // Event Reset HP Siswa
      if (isSiswaCollection) {
        const btnReset = tr.querySelector('.btn-reset-device');
        if (btnReset) {
          btnReset.onclick = async () => {
            const studentName = dataObj.nama_siswa || docId;
            if (confirm(`Reset pendaftaran perangkat (HP) untuk siswa "${studentName}" (${docId})? Siswa dapat melakukan registrasi di HP baru.`)) {
              try {
                // LOG KE system_logs
                const adminEmail = dom.userEmailDisplay.innerText || "Admin Portal";

                // AMBIL DATA TERBARU DARI ROW (Pastikan ID tidak terlewat)
                const oldId = dataObj.device_id || dataObj.device_token || dataObj.mac_address || "-";
                const oldInfo = dataObj.device_info || dataObj.device_model || "-";

                console.log("LOG: Mencatat reset untuk ID:", oldId);

                const logData = {
                  action: "RESET_DEVICE",
                  target_nis: dataObj.nis || docId,
                  target_name: studentName,
                  admin_email: adminEmail,
                  old_device_id: oldId,
                  old_device_info: oldInfo,
                  timestamp: serverTimestamp()
                };

                await addDoc(collection(db, "system_logs"), logData);
                console.log("LOG: System logs berhasil ditulis.");

                await updateDoc(doc(db, "siswa", docId), {
                  device_id: deleteField(),
                  device_info: deleteField(),
                  device_token: deleteField(),
                  mac_address: deleteField(),
                  registered_at: deleteField()
                });
                console.log("LOG: Data siswa berhasil di-update.");

                alert(`Perangkat siswa "${studentName}" berhasil di-reset!`);
              } catch (err) {
                console.error("LOG ERROR:", err);
                alert("Gagal mereset perangkat: " + err.message);
              }
            }
          };
        }
      }

    // Event Tombol Edit Dokumen
    tr.querySelector('.btn-edit-single').onclick = () => ModalManager.openEditModal(docId, dataObj);

    // Event Smart Action (Link/QR)
    const btnSmart = tr.querySelector('.btn-smart-action');
    if (btnSmart) {
      btnSmart.onclick = () => {
        if (state.currentCollection === 'links') window.open(dataObj.url, '_blank');
        else if (state.currentCollection === 'sesi_absensi') {
          const token = dataObj.current_qr_token;
          alert(`TOKEN QR: ${token}\n(Gunakan Dashboard Guru untuk visual QR Code)`);
        }
      };
    }

    // 🛡️ Fitur 3: Soft Delete (Move to trash_bin)
    tr.querySelector('.btn-del-single').onclick = async () => {
      if (confirm(`Pindahkan dokumen "${docId}" ke Keranjang Sampah (Recycle Bin)?`)) {
        try {
          // Salin ke trash_bin
          const trashData = { ...dataObj, original_collection: state.currentCollection, deleted_at: serverTimestamp() };
          await setDoc(doc(db, "trash_bin", `${state.currentCollection}_${docId}`), trashData);
          // Hapus asli
          await deleteDoc(doc(db, state.currentCollection, docId));
          state.selectedDocIds.delete(docId);
          TableEngine.updateSelectedUI();
        } catch (err) {
          alert("Gagal menghapus: " + err.message);
        }
      }
    };

      dom.tableBody.appendChild(tr);
    });
  },

  handleSelectAll(isChecked) {
    const filteredDocs = TableEngine.getFilteredAndSortedDocs();
    filteredDocs.forEach(docSnap => {
      if (isChecked) state.selectedDocIds.add(docSnap.id);
      else state.selectedDocIds.delete(docSnap.id);
    });

    document.querySelectorAll('.row-checkbox').forEach(chk => {
      const id = chk.getAttribute('data-id');
      chk.checked = state.selectedDocIds.has(id);
    });

    TableEngine.updateSelectedUI();
  },

  async checkAbsenceAnomalies() {
    if (state.allStudents.length === 0) {
      const snap = await getDocs(collection(db, "siswa"));
      state.allStudents = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    const currentLogs = state.currentDocsList.map(d => d.data());
    const now = new Date();
    const isPastDeadline = (now.getHours() > 15 || (now.getHours() === 15 && now.getMinutes() >= 30));

    const absentStudents = [];
    const notYetPresentStudents = [];

    // Jika filter tanggal aktif (Today), kita bisa cek anomali
    if (state.logDateFilter === 'today' || state.logDateFilter === now.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')) {
      const logNisList = new Set(currentLogs.map(l => l.nis));
      const activeClassesInLog = new Set(currentLogs.map(l => l.id_kelas));

      state.allStudents.forEach(s => {
        if (activeClassesInLog.has(s.id_kelas) && !logNisList.has(s.nis)) {
          if (isPastDeadline) absentStudents.push(s);
          else notYetPresentStudents.push(s);
        }
      });
    }

    // Update Insights UI
    let absenceInsights = '';
    if (notYetPresentStudents.length > 0) {
      absenceInsights += `<div class="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">⏳ Belum Hadir: ${notYetPresentStudents.length} Siswa (Ditunggu s.d 15:30)</div>`;
    }
    if (absentStudents.length > 0) {
      absenceInsights += `<div class="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400">🚫 Tidak Hadir: ${absentStudents.length} Siswa (Sudah lewat 15:30)</div>`;
    }

    // Gabungkan dengan insight audit jika ada
    const existingInsights = dom.analyticsInsights.querySelectorAll('div:not(.absence-insight)');
    dom.analyticsInsights.innerHTML = '';
    existingInsights.forEach(i => dom.analyticsInsights.appendChild(i));

    const div = document.createElement('div');
    div.className = 'absence-insight contents';
    div.innerHTML = absenceInsights;
    dom.analyticsInsights.appendChild(div);

    // Auto-refresh timer logic
    if (!state.refreshTimer) {
      state.refreshTimer = setInterval(() => {
        if (state.currentCollection === 'log_absensi' && state.logDateFilter === 'today') {
          TableEngine.checkAbsenceAnomalies();
        }
      }, 30000); // Cek setiap 30 detik
    }
  },

  updateSelectedUI() {
    const count = state.selectedDocIds.size;
    if (dom.selectedCountSpan) dom.selectedCountSpan.innerText = count;
    if (dom.selectedExportCountSpan) dom.selectedExportCountSpan.innerText = count;
    if (dom.selectedResetCountSpan) dom.selectedResetCountSpan.innerText = count;

    if (dom.btnDeleteSelected) dom.btnDeleteSelected.disabled = count === 0;
    if (dom.btnExportSelectedExcel) dom.btnExportSelectedExcel.disabled = count === 0;

    if (dom.btnResetSelectedDevice) {
      const isSiswa = state.currentCollection === 'siswa';
      dom.btnResetSelectedDevice.disabled = count === 0 || !isSiswa;
    }

    const headerChk = document.getElementById('select-all-checkbox');
    if (headerChk) {
      const filteredDocs = TableEngine.getFilteredAndSortedDocs();
      const allFilteredSelected = filteredDocs.length > 0 && filteredDocs.every(d => state.selectedDocIds.has(d.id));
      headerChk.checked = allFilteredSelected;
    }
  }
};

// -----------------------------------------------------------------
// 5. MODAL MANAGER (ADD, EDIT, IMPORT & CUSTOM KEY-VALUE FIELDS)
// -----------------------------------------------------------------
const ModalManager = {
  openAddModal() {
    dom.modalColName.innerText = state.currentCollection;
    dom.inputDocId.value = '';
    dom.dynamicInputFields.innerHTML = '';

    let fieldsToRender = [...state.currentDynamicFields];
    if (fieldsToRender.length === 0) {
      if (state.currentCollection === 'siswa') fieldsToRender = ['nis', 'nama_siswa', 'id_kelas', 'nama_kelas', 'nama_sekolah'];
      else if (state.currentCollection === 'kelas') fieldsToRender = ['id_kelas', 'nama_kelas', 'nama_sekolah', 'wali_kelas', 'wa_group_id'];
      else if (state.currentCollection === 'mapel') fieldsToRender = ['id_mapel', 'nama_mapel'];
      else if (state.currentCollection === 'sesi_absensi') fieldsToRender = ['id_kelas', 'nama_mapel', 'tanggal', 'waktu', 'is_active'];
      else if (state.currentCollection === 'log_absensi') fieldsToRender = ['nis', 'nama_siswa', 'id_kelas', 'nama_mapel', 'hari', 'tanggal', 'waktu', 'status'];
      else if (state.currentCollection === 'links') fieldsToRender = ['title', 'url', 'is_active', 'order'];
      else fieldsToRender = ['nama', 'keterangan'];
    }

    const now = new Date();
    const defaultHari = now.toLocaleDateString('id-ID', { weekday: 'long' });
    const defaultTanggal = now.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
    const defaultWaktu = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';

    fieldsToRender.forEach(fieldKey => {
      let defaultVal = '';
      if (fieldKey === 'hari') defaultVal = defaultHari;
      else if (fieldKey === 'tanggal') defaultVal = defaultTanggal;
      else if (fieldKey === 'waktu') defaultVal = defaultWaktu;
      else if (fieldKey === 'status') defaultVal = 'Hadir';
      else if (fieldKey === 'is_active') defaultVal = 'true';
      ModalManager.appendFieldRow(dom.dynamicInputFields, fieldKey, defaultVal);
    });

    dom.modalAddData.classList.remove('hidden');
  },

  openEditModal(docId, dataObj) {
    dom.editModalDocId.innerText = docId;
    dom.inputEditDocId.value = docId;
    dom.editDynamicInputFields.innerHTML = '';

    const keys = Object.keys(dataObj).filter(k => k.toLowerCase() !== 'created_at');
    if (keys.length === 0) {
      ModalManager.appendFieldRow(dom.editDynamicInputFields, 'keterangan', '');
    } else {
      keys.forEach(k => {
        let val = dataObj[k];
        if (typeof val === 'object' && val.seconds !== undefined) {
          val = new Date(val.seconds * 1000).toLocaleString('id-ID');
        } else if (typeof val === 'object') {
          val = JSON.stringify(val);
        }
        ModalManager.appendFieldRow(dom.editDynamicInputFields, k, val);
      });
    }

    dom.modalEditData.classList.remove('hidden');
  },

  appendFieldRow(container, keyName = '', keyValue = '') {
    const div = document.createElement('div');
    div.className = 'flex items-center gap-2 field-row';
    div.innerHTML = `
      <div class="w-1/3">
        <input type="text" value="${keyName}" placeholder="Nama Field" class="input-field-key w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500 font-mono">
      </div>
      <div class="flex-1">
        <input type="text" value="${keyValue}" placeholder="Nilai Value" class="input-field-val w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500">
      </div>
      <button type="button" class="btn-remove-field p-2 bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-xl text-xs transition cursor-pointer" title="Hapus Field Ini">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;
    div.querySelector('.btn-remove-field').onclick = () => div.remove();
    container.appendChild(div);
  }
};

// -----------------------------------------------------------------
// 6. ANALYTICS & AUDIT ENGINE (CHARTS & SECURITY)
// -----------------------------------------------------------------
const ChartEngine = {
  refreshAnalytics() {
    const isLog = state.currentCollection === 'log_absensi';
    const isSiswa = state.currentCollection === 'siswa';

    if (!isLog && !isSiswa) {
      dom.analyticsPanel.classList.add('hidden');
      return;
    }

    dom.analyticsPanel.classList.remove('hidden');
    const data = state.currentDocsList.map(d => d.data());

    let labels = [], counts = [], colors = [];
    let insights = [];

    if (isLog) {
      const hadir = data.filter(d => d.status === 'Hadir' || !d.status).length;
      const alpa = data.filter(d => d.status && d.status.includes('Tidak')).length;
      labels = ['Hadir', 'Alpa/Izin'];
      counts = [hadir, alpa];
      colors = ['#10b981', '#f43f5e'];
      insights.push(`<div class="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">⚡ Tingkat Kehadiran: ${((hadir/(hadir+alpa || 1))*100).toFixed(1)}%</div>`);
    } else if (isSiswa) {
      const bound = data.filter(d => d.device_id).length;
      const unbound = data.length - bound;
      labels = ['Terikat', 'Belum'];
      counts = [bound, unbound];
      colors = ['#06b6d4', '#475569'];

      // Audit Security (Silent check)
      const devices = data.map(d => d.device_id).filter(id => id);
      const dupes = devices.filter((id, index) => devices.indexOf(id) !== index);
      if (dupes.length > 0) {
        insights.push(`<div class="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400">⚠️ Terdeteksi ${new Set(dupes).size} HP Berbagi (Duplikasi ID)!</div>`);
      } else {
        insights.push(`<div class="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">✔ Integritas Perangkat Aman.</div>`);
      }
    }

    dom.analyticsInsights.innerHTML = insights.join('') || '<div class="text-slate-500 p-2">Belum ada anomali terdeteksi.</div>';

    if (state.miniChart) state.miniChart.destroy();
    if (typeof Chart === 'undefined') {
      console.warn("Chart.js not loaded.");
      return;
    }
    state.miniChart = new Chart(dom.miniChartCanvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{ data: counts, backgroundColor: colors, borderWidth: 0 }]
      },
      options: {
        plugins: { legend: { display: false } },
        cutout: '70%',
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
};

// 🔒 Fitur 1: Audit Security Toggle
dom.btnAuditSecurity.addEventListener('click', () => {
  if (state.currentCollection !== 'siswa') {
    alert("Fitur Audit Keamanan saat ini dikhususkan untuk koleksi 'siswa'.");
    return;
  }

  state.isAuditMode = !state.isAuditMode;

  if (state.isAuditMode) {
    const devices = state.currentDocsList.map(d => d.data().device_id).filter(id => id);
    state.duplicateDeviceIds = new Set(devices.filter((id, index) => devices.indexOf(id) !== index));

    dom.btnAuditSecurity.className = "py-2 px-3.5 bg-rose-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-500/30";
    dom.btnAuditSecurity.innerHTML = '<i class="fa-solid fa-shield-halved"></i> <span>Matikan Audit</span>';
    if (state.duplicateDeviceIds.size > 0) {
      alert(`Peringatan Keamanan!\n\nTerdeteksi ${state.duplicateDeviceIds.size} ID perangkat yang digunakan oleh lebih dari satu siswa. Baris yang bermasalah telah disorot warna kuning.`);
    }
  } else {
    dom.btnAuditSecurity.className = "py-2 px-3.5 bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/30 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer";
    dom.btnAuditSecurity.innerHTML = '<i class="fa-solid fa-shield-virus"></i> <span>Audit Keamanan</span>';
  }

  TableEngine.renderBody();
});

// -----------------------------------------------------------------
// 7. INITIALIZATION & LISTENER EVENT HANDLERS
// -----------------------------------------------------------------
initializeAuthGuard({
  onAuthenticated: (user) => {
    dom.userEmailDisplay.innerText = user.email;
    initBadgesCount();
    loadCollectionData(state.currentCollection);
  }
});

dom.btnLogout.addEventListener('click', () => {
  window.location.href = "../admin.html";
});

// 📱 TOGGLE FULLSCREEN DESKTOP & SIDEBAR COLLAPSE
dom.btnToggleSidebar.addEventListener('click', () => {
  state.sidebarCollapsed = !state.sidebarCollapsed;
  if (state.sidebarCollapsed) {
    dom.sidebarContainer.classList.add('hidden');
    dom.tableSectionContainer.className = 'lg:col-span-12 w-full transition-all duration-300 space-y-4';
  } else {
    dom.sidebarContainer.classList.remove('hidden');
    dom.tableSectionContainer.className = 'lg:col-span-10 w-full transition-all duration-300 space-y-4';
  }
});

dom.btnToggleFullscreen.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => console.warn(err));
    dom.btnToggleFullscreen.innerHTML = '<i class="fa-solid fa-compress"></i> <span class="hidden sm:inline">Keluar Fullscreen</span>';
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(err => console.warn(err));
      dom.btnToggleFullscreen.innerHTML = '<i class="fa-solid fa-expand"></i> <span class="hidden sm:inline">Full Screen</span>';
    }
  }
});

document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) {
    dom.btnToggleFullscreen.innerHTML = '<i class="fa-solid fa-expand"></i> <span class="hidden sm:inline">Full Screen</span>';
  }
});

function initBadgesCount() {
  const collections = ['siswa', 'kelas', 'mapel', 'sesi_absensi', 'log_absensi', 'links', 'system_logs'];
  collections.forEach(colName => {
    onSnapshot(collection(db, colName), (snap) => {
      const badge = document.getElementById(`badge-${colName}`);
      if (badge) badge.innerText = snap.size;

      if (colName === 'siswa') {
        let bound = 0, unbound = 0;
        snap.docs.forEach(d => {
          const data = d.data();
          if (data.device_id || data.device_token || data.mac_address) bound++;
          else unbound++;
        });
        const bBound = document.getElementById('badge-hp-bound');
        const bUnbound = document.getElementById('badge-hp-unbound');
        if (bBound) bBound.innerText = bound;
        if (bUnbound) bUnbound.innerText = unbound;
      } else if (colName === 'log_absensi') {
        const now = new Date();
        const todayStr = now.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        const yesterdayStr = y.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');

        let tCount = 0, yCount = 0;
        snap.docs.forEach(d => {
          const data = d.data();
          let docDateStr = data.tanggal || '';
          if (!docDateStr && data.created_at && data.created_at.seconds) {
            docDateStr = new Date(data.created_at.seconds * 1000).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
          }
          if (docDateStr === todayStr) tCount++;
          if (docDateStr === yesterdayStr) yCount++;
        });
        const bToday = document.getElementById('badge-log-today');
        const bYesterday = document.getElementById('badge-log-yesterday');
        if (bToday) bToday.innerText = tCount;
        if (bYesterday) bYesterday.innerText = yCount;
      }
    }, (error) => {
      console.warn(`[BadgeListener] Izin ditolak untuk koleksi: ${colName}. Pastikan Rules sudah di-publish.`, error);
    });
  });
}

function loadCollectionData(colName) {
  if (state.unsubscribeCurrent) state.unsubscribeCurrent();

  state.selectedDocIds.clear();
  TableEngine.updateSelectedUI();

  dom.tableBody.innerHTML = `<tr><td colspan="12" class="p-8 text-center text-slate-500 font-sans">// Memuat koleksi "${colName}"...</td></tr>`;

  state.unsubscribeCurrent = onSnapshot(collection(db, colName), (snapshot) => {
    // 🟢 Fitur 5: Update Prev Doc IDs for animation tracking
    const newDocIds = new Set(snapshot.docs.map(d => d.id));

    state.currentDocsList = snapshot.docs;

    if (snapshot.empty) {
      dom.tableBody.innerHTML = `<tr><td colspan="12" class="p-8 text-center text-slate-500 font-sans">// Koleksi "${colName}" masih kosong.</td></tr>`;
      StatsManager.updateStats(0);
      state.prevDocIds = newDocIds;
      return;
    }

    const fieldSet = new Set();
    if (colName === 'siswa') {
      if (state.deviceFilter === 'bound') {
        ['nis', 'nama_siswa', 'id_kelas', 'nama_kelas', 'device_id', 'device_info'].forEach(k => fieldSet.add(k));
      } else {
        ['nis', 'nama_siswa', 'id_kelas', 'nama_kelas'].forEach(k => fieldSet.add(k));
      }
    } else if (colName === 'log_absensi') {
      ['nis', 'nama_siswa', 'id_kelas', 'nama_mapel', 'hari', 'tanggal', 'waktu', 'status'].forEach(k => fieldSet.add(k));
    } else if (colName === 'sesi_absensi') {
      ['id_kelas', 'nama_mapel', 'hari', 'tanggal', 'waktu', 'is_active'].forEach(k => fieldSet.add(k));
    } else if (colName === 'system_logs') {
      ['action', 'target_nis', 'target_name', 'admin_email', 'timestamp'].forEach(k => fieldSet.add(k));
    }

    snapshot.docs.forEach(docSnap => {
      Object.keys(docSnap.data()).forEach(k => {
        const lk = k.toLowerCase();
        const isDeviceIdAllowed = colName === 'siswa' && state.deviceFilter === 'bound' && lk === 'device_id';
        if (lk !== 'created_at' && lk !== 'createdat' && (lk !== 'device_id' || isDeviceIdAllowed) && lk !== 'waktu_scan' && lk !== 'id_sesi' && lk !== 'id_absensi') {
          fieldSet.add(k);
        }
      });
    });
    state.currentDynamicFields = Array.from(fieldSet);

    TableEngine.renderHeaders();
    TableEngine.renderBody();

    // Update tracking
    state.prevDocIds = newDocIds;
    // 📊 Fitur 2: Update Charts
    ChartEngine.refreshAnalytics();

    // 🔍 Fitur 6: Cross-check alpa jika di log_absensi
    if (colName === 'log_absensi') {
      TableEngine.checkAbsenceAnomalies();
    }
  }, (error) => {
    console.error(`[DataListener] Error loading collection ${colName}:`, error);
    dom.tableBody.innerHTML = `<tr><td colspan="12" class="p-8 text-center text-rose-400 font-sans font-bold">❌ Error: ${error.message}<br><span class="text-xs text-slate-500 font-normal">Pastikan Rules untuk koleksi ini sudah aktif di Firebase Console.</span></td></tr>`;
  });
}

// Sidebar Collection Switcher
document.querySelectorAll('.btn-col').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetCol = btn.getAttribute('data-collection');
    
    document.querySelectorAll('.btn-col').forEach(b => {
      b.className = "btn-col w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer bg-slate-900/60 text-slate-400 hover:bg-slate-800 border border-slate-800";
    });
    document.querySelectorAll('.btn-device-filter').forEach(b => {
      b.className = "btn-device-filter w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer bg-slate-900/60 text-slate-400 hover:bg-slate-800 border border-slate-800";
    });
    document.querySelectorAll('.btn-log-filter').forEach(b => {
      b.className = "btn-log-filter w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer bg-slate-900/60 text-slate-400 hover:bg-slate-800 border border-slate-800";
    });
    btn.className = "btn-col w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer bg-cyan-500/20 text-cyan-300 border border-cyan-500/40";

    state.currentCollection = targetCol;
    state.deviceFilter = 'all';
    state.logDateFilter = 'all';
    state.currentSortField = null;
    state.currentSortOrder = 'asc';
    state.searchQuery = '';
    state.currentPage = 1;
    dom.inputSearchDb.value = '';
    dom.btnClearSearch.classList.add('hidden');

    dom.activeCollectionTitle.innerHTML = `<i class="fa-solid fa-table-list text-cyan-400"></i> Koleksi: <span class="text-cyan-400 font-mono">${state.currentCollection}</span>`;

    if (dom.btnExportDeviceExcel) {
      dom.btnExportDeviceExcel.style.display = state.currentCollection === 'siswa' ? 'inline-flex' : 'none';
      dom.btnExportDeviceExcel.innerHTML = '<i class="fa-solid fa-file-excel"></i> <span>Ekspor Perangkat (.xlsx)</span>';
    }

    loadCollectionData(state.currentCollection);
  });
});

// 📋 Sidebar Log Presensi Date Filter Switcher (Hari Ini, Kemarin, Semua)
document.querySelectorAll('.btn-log-filter').forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.getAttribute('data-log-filter');

    document.querySelectorAll('.btn-col').forEach(b => {
      b.className = "btn-col w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer bg-slate-900/60 text-slate-400 hover:bg-slate-800 border border-slate-800";
    });
    document.querySelectorAll('.btn-device-filter').forEach(b => {
      b.className = "btn-device-filter w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer bg-slate-900/60 text-slate-400 hover:bg-slate-800 border border-slate-800";
    });
    document.querySelectorAll('.btn-log-filter').forEach(b => {
      b.className = "btn-log-filter w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer bg-slate-900/60 text-slate-400 hover:bg-slate-800 border border-slate-800";
    });

    btn.className = "btn-log-filter w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer bg-cyan-500/20 text-cyan-300 border border-cyan-500/40";

    state.currentCollection = 'log_absensi';
    state.logDateFilter = filter;
    state.currentSortField = null;
    state.currentSortOrder = 'asc';
    state.searchQuery = '';
    state.currentPage = 1;
    dom.inputSearchDb.value = '';
    dom.btnClearSearch.classList.add('hidden');

    let filterLabel = 'Semua Riwayat';
    if (filter === 'today') filterLabel = 'Hari Ini';
    else if (filter === 'yesterday') filterLabel = 'Kemarin';

    dom.activeCollectionTitle.innerHTML = `<i class="fa-solid fa-clipboard-user text-cyan-400"></i> Log Presensi: <span class="text-cyan-400 font-mono">${filterLabel}</span>`;

    if (dom.btnExportDeviceExcel) {
      dom.btnExportDeviceExcel.style.display = 'none';
    }

    loadCollectionData('log_absensi');
  });
});

const inputLogDateFilter = document.getElementById('input-log-date-filter');
if (inputLogDateFilter) {
  inputLogDateFilter.addEventListener('click', () => {
    if ('showPicker' in HTMLInputElement.prototype) {
      try {
        inputLogDateFilter.showPicker();
      } catch (err) {
        console.warn("Native showPicker fallback:", err);
      }
    }
  });

  inputLogDateFilter.addEventListener('change', (e) => {
    const customDate = e.target.value;
    if (!customDate) return;

    document.querySelectorAll('.btn-col').forEach(b => {
      b.className = "btn-col w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer bg-slate-900/60 text-slate-400 hover:bg-slate-800 border border-slate-800";
    });
    document.querySelectorAll('.btn-device-filter').forEach(b => {
      b.className = "btn-device-filter w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer bg-slate-900/60 text-slate-400 hover:bg-slate-800 border border-slate-800";
    });
    document.querySelectorAll('.btn-log-filter').forEach(b => {
      b.className = "btn-log-filter w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer bg-slate-900/60 text-slate-400 hover:bg-slate-800 border border-slate-800";
    });

    state.currentCollection = 'log_absensi';
    state.logDateFilter = customDate;
    state.currentSortField = null;
    state.currentSortOrder = 'asc';
    state.searchQuery = '';
    state.currentPage = 1;
    dom.inputSearchDb.value = '';
    dom.btnClearSearch.classList.add('hidden');

    dom.activeCollectionTitle.innerHTML = `<i class="fa-solid fa-clipboard-user text-cyan-400"></i> Log Presensi: <span class="text-cyan-400 font-mono">Tanggal ${customDate}</span>`;

    if (dom.btnExportDeviceExcel) {
      dom.btnExportDeviceExcel.style.display = 'none';
    }

    loadCollectionData('log_absensi');
  });
}

// 📱 Sidebar Device Filter Switcher (HP Terikat vs Belum Terikat)
document.querySelectorAll('.btn-device-filter').forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.getAttribute('data-filter');

    document.querySelectorAll('.btn-col').forEach(b => {
      b.className = "btn-col w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer bg-slate-900/60 text-slate-400 hover:bg-slate-800 border border-slate-800";
    });
    document.querySelectorAll('.btn-device-filter').forEach(b => {
      b.className = "btn-device-filter w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer bg-slate-900/60 text-slate-400 hover:bg-slate-800 border border-slate-800";
    });

    btn.className = filter === 'bound'
      ? "btn-device-filter w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
      : "btn-device-filter w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer bg-amber-500/20 text-amber-300 border border-amber-500/40";

    state.currentCollection = 'siswa';
    state.deviceFilter = filter;
    state.currentSortField = null;
    state.currentSortOrder = 'asc';
    state.searchQuery = '';
    state.currentPage = 1;
    dom.inputSearchDb.value = '';
    dom.btnClearSearch.classList.add('hidden');

    dom.activeCollectionTitle.innerHTML = `<i class="fa-solid fa-mobile-screen-button text-emerald-400"></i> Perangkat HP: <span class="text-emerald-400 font-mono">${filter === 'bound' ? 'Siswa Terikat' : 'Siswa Belum Terikat'}</span>`;

    if (dom.btnExportDeviceExcel) {
      dom.btnExportDeviceExcel.style.display = 'inline-flex';
      dom.btnExportDeviceExcel.innerHTML = filter === 'bound'
        ? '<i class="fa-solid fa-file-excel"></i> <span>Ekspor HP Terikat (.xlsx)</span>'
        : '<i class="fa-solid fa-file-excel"></i> <span>Ekspor Belum Terikat (.xlsx)</span>';
    }

    loadCollectionData('siswa');
  });
});

// 🔍 Live Search Listeners
dom.inputSearchDb.addEventListener('input', (e) => {
  state.searchQuery = e.target.value.trim();
  state.currentPage = 1;
  if (state.searchQuery) dom.btnClearSearch.classList.remove('hidden');
  else dom.btnClearSearch.classList.add('hidden');
  TableEngine.renderBody();
});

dom.btnClearSearch.addEventListener('click', () => {
  dom.inputSearchDb.value = '';
  state.searchQuery = '';
  state.currentPage = 1;
  dom.btnClearSearch.classList.add('hidden');
  TableEngine.renderBody();
});

// 📄 Pagination Controls
dom.selectPageSize.addEventListener('change', (e) => {
  state.pageSize = Number(e.target.value);
  state.currentPage = 1;
  TableEngine.renderBody();
});

dom.btnPrevPage.addEventListener('click', () => {
  if (state.currentPage > 1) {
    state.currentPage--;
    TableEngine.renderBody();
  }
});

dom.btnNextPage.addEventListener('click', () => {
  state.currentPage++;
  TableEngine.renderBody();
});

// 🗑️ Delete Selected & Batch Actions
if (dom.btnResetSelectedDevice) {
  dom.btnResetSelectedDevice.addEventListener('click', async () => {
    const count = state.selectedDocIds.size;
    if (count === 0 || state.currentCollection !== 'siswa') return;

    if (confirm(`Reset pendaftaran perangkat (HP) untuk ${count} siswa terpilih? Siswa terpilih dapat melakukan registrasi ulang di HP baru.`)) {
      try {
        dom.btnResetSelectedDevice.disabled = true;
        const selectedArray = Array.from(state.selectedDocIds);
        const CHUNK_SIZE = 400;

        // Buat mapping data untuk logging masal
        const studentMap = {};
        state.currentDocsList.forEach(d => {
          if (state.selectedDocIds.has(d.id)) {
            studentMap[d.id] = d.data();
          }
        });

        const adminEmail = dom.userEmailDisplay.innerText || "Unknown Admin";

        for (let i = 0; i < selectedArray.length; i += CHUNK_SIZE) {
          const chunk = selectedArray.slice(i, i + CHUNK_SIZE);
          const batch = writeBatch(db);

          const logPromises = [];
          chunk.forEach(id => {
            const student = studentMap[id];

            // Ambil ID perangkat lama dari berbagai kemungkinan field
            const oldId = student.device_id || student.device_token || student.mac_address || "-";
            const oldInfo = student.device_info || student.device_model || "-";

            logPromises.push(addDoc(collection(db, "system_logs"), {
              action: "BATCH_RESET_DEVICE",
              target_nis: student.nis || id,
              target_name: student.nama_siswa || id,
              admin_email: adminEmail,
              old_device_id: oldId,
              old_device_info: oldInfo,
              timestamp: serverTimestamp()
            }));

            batch.update(doc(db, "siswa", id), {
              device_id: deleteField(),
              device_info: deleteField(),
              device_token: deleteField(),
              mac_address: deleteField(),
              registered_at: deleteField()
            });
          });

          await Promise.all(logPromises);
          await batch.commit();
        }
        alert(`Berhasil mereset pendaftaran HP untuk ${count} siswa!`);
        state.selectedDocIds.clear();
        TableEngine.updateSelectedUI();
      } catch (err) {
        alert("Gagal mereset perangkat masal: " + err.message);
      } finally {
        dom.btnResetSelectedDevice.disabled = false;
      }
    }
  });
}

if (dom.btnExportSelectedExcel) {
  dom.btnExportSelectedExcel.addEventListener('click', () => {
    const count = state.selectedDocIds.size;
    if (count === 0) return;

    const allFiltered = TableEngine.getFilteredAndSortedDocs();
    const selectedDocs = allFiltered.filter(docSnap => state.selectedDocIds.has(docSnap.id));

    if (selectedDocs.length === 0) {
      alert("Tidak ada dokumen terceklist yang ditemukan.");
      return;
    }

    const exportRows = selectedDocs.map((docSnap, index) => {
      const data = docSnap.data();
      const row = { "No": index + 1, "Document ID": docSnap.id };

      state.currentDynamicFields.forEach(fieldKey => {
        const headerName = Sanitizer.formatHeaderName(fieldKey);
        let val = data[fieldKey];
        if (typeof val === 'object' && val !== null && val.seconds !== undefined) {
          val = new Date(val.seconds * 1000).toLocaleString('id-ID');
        } else if (typeof val === 'object' && val !== null) {
          val = JSON.stringify(val);
        }
        row[headerName] = val !== undefined && val !== null ? val : "-";
      });

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Selected_${state.currentCollection}`);

    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Ekspor_Terpilih_${state.currentCollection}_${today}.xlsx`);
  });
}

dom.btnDeleteSelected.addEventListener('click', async () => {
  const count = state.selectedDocIds.size;
  if (count === 0) return;

  if (confirm(`Apakah Anda yakin ingin menghapus ${count} dokumen terpilih dari koleksi "${state.currentCollection}"?`)) {
    try {
      await BatchUtils.chunkedDelete(Array.from(state.selectedDocIds), state.currentCollection);
      state.selectedDocIds.clear();
      TableEngine.updateSelectedUI();
      alert(`Berhasil menghapus ${count} dokumen!`);
    } catch (err) {
      alert("Gagal menghapus dokumen terpilih: " + err.message);
    }
  }
});

dom.btnClearCollection.addEventListener('click', async () => {
  if (state.currentDocsList.length === 0) {
    alert(`Koleksi "${state.currentCollection}" sudah kosong.`);
    return;
  }

  const promptInput = prompt(`⚠️ PERINGATAN BAHAYA!\n\nAnda akan menghapus SELURUH data (${state.currentDocsList.length} dokumen) dalam koleksi "${state.currentCollection}".\n\nKetik nama koleksi "${state.currentCollection}" di bawah ini untuk mengonfirmasi:`);

  if (promptInput === state.currentCollection) {
    try {
      const docIds = state.currentDocsList.map(d => d.id);
      await BatchUtils.chunkedDelete(docIds, state.currentCollection);
      state.selectedDocIds.clear();
      TableEngine.updateSelectedUI();
      alert(`Koleksi "${state.currentCollection}" berhasil dikosongkan!`);
    } catch (err) {
      alert("Gagal mengosongkan koleksi: " + err.message);
    }
  } else if (promptInput !== null) {
    alert("Konfirmasi dibatalkan: Nama koleksi tidak cocok.");
  }
});

// ➕ Modal Add Data Event Listeners
dom.btnAddNewData.addEventListener('click', () => ModalManager.openAddModal());
dom.btnCloseAddModal.onclick = () => dom.modalAddData.classList.add('hidden');
dom.btnCancelAddModal.onclick = () => dom.modalAddData.classList.add('hidden');
dom.btnAddCustomFieldAdd.onclick = () => ModalManager.appendFieldRow(dom.dynamicInputFields, '', '');

dom.formAddManual.addEventListener('submit', async (e) => {
  e.preventDefault();
  const rawDocId = dom.inputDocId.value.trim();
  const safeDocId = rawDocId ? rawDocId.replace(/\//g, '-') : null;

  const newObj = {};
  dom.dynamicInputFields.querySelectorAll('.field-row').forEach(row => {
    const key = row.querySelector('.input-field-key').value.trim();
    const val = row.querySelector('.input-field-val').value;
    if (key) newObj[key] = Sanitizer.castFieldValue(val, key);
  });

  newObj.created_at = serverTimestamp();

  try {
    if (safeDocId) {
      await setDoc(doc(db, state.currentCollection, safeDocId), newObj);
    } else {
      await addDoc(collection(db, state.currentCollection), newObj);
    }

    dom.modalAddData.classList.add('hidden');
    alert(`Berhasil menambahkan data baru ke koleksi "${state.currentCollection}"!`);
  } catch (err) {
    alert("Gagal menyimpan data baru: " + err.message);
  }
});

// ✏️ Modal Edit Data Event Listeners
dom.btnCloseEditModal.onclick = () => dom.modalEditData.classList.add('hidden');
dom.btnCancelEditModal.onclick = () => dom.modalEditData.classList.add('hidden');
dom.btnAddCustomFieldEdit.onclick = () => ModalManager.appendFieldRow(dom.editDynamicInputFields, '', '');

dom.formEditManual.addEventListener('submit', async (e) => {
  e.preventDefault();
  const targetDocId = dom.inputEditDocId.value;
  if (!targetDocId) return;

  const updatedObj = {};
  dom.editDynamicInputFields.querySelectorAll('.field-row').forEach(row => {
    const key = row.querySelector('.input-field-key').value.trim();
    const val = row.querySelector('.input-field-val').value;
    if (key) updatedObj[key] = Sanitizer.castFieldValue(val, key);
  });

  try {
    await setDoc(doc(db, state.currentCollection, targetDocId), updatedObj);
    dom.modalEditData.classList.add('hidden');
    alert(`Dokumen ID: "${targetDocId}" berhasil diperbarui!`);
  } catch (err) {
    alert("Gagal memperbarui dokumen: " + err.message);
  }
});

// 📥 Modal Import File Event Listeners
dom.btnOpenImportModal.addEventListener('click', () => {
  dom.importColName.innerText = state.currentCollection;
  dom.importFileInput.value = '';
  state.parsedImportData = [];
  dom.btnProcessImport.disabled = true;
  dom.importLogBox.innerHTML = '<p class="text-slate-500">// Log proses impor akan tampil di sini...</p>';
  dom.modalImportFile.classList.remove('hidden');
});

dom.btnCloseImportModal.onclick = () => dom.modalImportFile.classList.add('hidden');
dom.btnCancelImportModal.onclick = () => dom.modalImportFile.classList.add('hidden');

function logImport(msg, type = 'info') {
  const p = document.createElement('p');
  if (type === 'success') p.className = 'text-emerald-400 font-semibold';
  else if (type === 'error') p.className = 'text-red-400 font-semibold';
  else if (type === 'warn') p.className = 'text-amber-400';
  else p.className = 'text-slate-300';

  const timestamp = new Date().toLocaleTimeString();
  p.innerText = `[${timestamp}] ${msg}`;
  dom.importLogBox.appendChild(p);
  dom.importLogBox.scrollTop = dom.importLogBox.scrollHeight;
}

dom.importFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) {
    dom.btnProcessImport.disabled = true;
    return;
  }

  const fileName = file.name.toLowerCase();
  const reader = new FileReader();

  reader.onload = (evt) => {
    try {
      if (fileName.endsWith('.json')) {
        const rawJson = JSON.parse(evt.target.result);
        state.parsedImportData = Array.isArray(rawJson) ? rawJson : [rawJson];
      } else {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        state.parsedImportData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
      }

      if (state.parsedImportData.length === 0) {
        logImport("Berkas kosong atau format tidak valid.", "error");
        dom.btnProcessImport.disabled = true;
        return;
      }

      logImport(`Berkas berhasil dibaca: Terdeteksi ${state.parsedImportData.length} baris data siap diimpor.`, "warn");
      dom.btnProcessImport.disabled = false;
    } catch (err) {
      logImport("Gagal membaca berkas: " + err.message, "error");
      dom.btnProcessImport.disabled = true;
    }
  };

  if (fileName.endsWith('.json')) reader.readAsText(file);
  else reader.readAsArrayBuffer(file);
});

dom.btnProcessImport.addEventListener('click', async () => {
  if (state.parsedImportData.length === 0) return;

  dom.btnProcessImport.disabled = true;
  logImport(`Memulai impor ${state.parsedImportData.length} data ke koleksi "${state.currentCollection}"...`, "warn");

  let successCount = 0;
  let failCount = 0;
  const CHUNK_SIZE = 400;
  const preparedRows = [];

  state.parsedImportData.forEach((row, idx) => {
    try {
      const cleanRow = {};
      let targetDocId = null;

      Object.keys(row).forEach(key => {
        const cleanKey = key.trim();
        const lowerKey = cleanKey.toLowerCase();
        let val = row[key];

        if (typeof val === 'string') val = val.trim();

        if (lowerKey === 'nis' || lowerKey === 'id' || lowerKey === 'doc_id' || lowerKey === 'document id' || lowerKey === 'id_kelas' || lowerKey === 'id_mapel') {
          if (val !== null && val !== undefined && val !== '') {
            targetDocId = String(val).trim().replace(/\//g, '-');
          }
        }

        if (lowerKey === 'nis') {
          cleanRow['nis'] = String(val).trim();
        } else if (lowerKey === 'nama siswa') {
          cleanRow['nama_siswa'] = String(val);
        } else if (lowerKey === 'id kelas') {
          cleanRow['id_kelas'] = String(val);
        } else if (lowerKey === 'nama kelas') {
          cleanRow['nama_kelas'] = String(val);
        } else {
          if (lowerKey.includes('nis') || lowerKey.includes('id_') || lowerKey.endsWith('_id') || lowerKey === 'id') {
            cleanRow[cleanKey] = String(val).trim();
          } else {
            cleanRow[cleanKey] = val;
          }
        }
      });

      cleanRow.created_at = serverTimestamp();
      preparedRows.push({ targetDocId, cleanRow, rowIndex: idx + 1 });
    } catch (err) {
      failCount++;
      logImport(`❌ Baris ${idx + 1} Gagal diproses: ${err.message}`, "error");
    }
  });

  for (let i = 0; i < preparedRows.length; i += CHUNK_SIZE) {
    const chunk = preparedRows.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);

    chunk.forEach(item => {
      const docRef = item.targetDocId ? doc(db, state.currentCollection, item.targetDocId) : doc(collection(db, state.currentCollection));
      batch.set(docRef, item.cleanRow, { merge: true });
    });

    try {
      await batch.commit();
      successCount += chunk.length;
      logImport(`✔ Batch ${Math.floor(i / CHUNK_SIZE) + 1}: ${chunk.length} data berhasil disimpan.`, "success");
    } catch (err) {
      failCount += chunk.length;
      logImport(`❌ Batch ${Math.floor(i / CHUNK_SIZE) + 1} Gagal: ${err.message}`, "error");
    }
  }

  logImport(`🎉 IMPOR SELESAI! Sukses: ${successCount} | Gagal: ${failCount}`, "success");
  dom.btnProcessImport.disabled = false;
});

dom.btnDownloadTemplate.addEventListener('click', () => {
  let sampleData = [];
  if (state.currentCollection === 'siswa') {
    sampleData = [{ "NIS": "9177/413", "Nama Siswa": "ACHMAD HAMDHANI", "ID Kelas": "XI-TEI-1", "Nama Kelas": "XI TEI 1" }];
  } else if (state.currentCollection === 'kelas') {
    sampleData = [{ "id_kelas": "XI-TEI-1", "nama_kelas": "XI TEI 1", "wali_kelas": "Nama Guru" }];
  } else if (state.currentCollection === 'mapel') {
    sampleData = [{ "id_mapel": "TEI-01", "nama_mapel": "Pemrograman Terstruktur" }];
  } else if (state.currentCollection === 'sesi_absensi') {
    sampleData = [{ "id_kelas": "XI-TEI-1", "nama_mapel": "Pemrograman Terstruktur", "tanggal": "2026-08-10", "waktu": "08:53:00 WIB", "is_active": true }];
  } else {
    sampleData = [{ "id": "DOC-01", "title": "Contoh Data", "keterangan": "Deskripsi" }];
  }

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Template_${state.currentCollection}`);
  XLSX.writeFile(wb, `Template_Import_${state.currentCollection}.xlsx`);
});

// 📤 Export Perangkat Siswa Excel (Smart Contextual Filtered Export)
if (dom.btnExportDeviceExcel) {
  dom.btnExportDeviceExcel.addEventListener('click', () => {
    if (state.currentCollection !== 'siswa') {
      alert('Fitur ekspor perangkat HP hanya tersedia untuk koleksi "siswa".');
      return;
    }

    const filteredDocs = TableEngine.getFilteredAndSortedDocs();
    if (!filteredDocs || filteredDocs.length === 0) {
      alert('Tidak ada data siswa yang cocok dengan filter saat ini untuk diekspor.');
      return;
    }

    const exportData = filteredDocs.map((docSnap, index) => {
      const data = docSnap.data();
      const isBound = Boolean(data.device_id || data.device_token || data.mac_address);

      return {
        "No": index + 1,
        "Document ID": docSnap.id,
        "NIS": data.nis || docSnap.id,
        "Nama Siswa": data.nama_siswa || data.nama || "-",
        "ID Kelas": data.id_kelas || "-",
        "Nama Kelas": data.nama_kelas || "-",
        "Status Perangkat": isBound ? "TERIKAT (BOUND)" : "BELUM TERIKAT",
        "Device ID / Fingerprint": data.device_id || "-",
        "Device Token": data.device_token || "-",
        "Waktu Terikat": data.registered_at && data.registered_at.seconds
          ? new Date(data.registered_at.seconds * 1000).toLocaleString('id-ID')
          : "-"
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    worksheet['!cols'] = [
      { wch: 5 }, { wch: 15 }, { wch: 15 },
      { wch: 28 }, { wch: 12 }, { wch: 15 },
      { wch: 20 }, { wch: 35 }, { wch: 30 }, { wch: 22 }
    ];

    const workbook = XLSX.utils.book_new();
    
    let sheetName = "Perangkat Siswa";
    let filePrefix = "Rekap_Perangkat_Siswa";

    if (state.deviceFilter === 'bound') {
      sheetName = "HP Terikat";
      filePrefix = "Rekap_HP_Terikat_Siswa";
    } else if (state.deviceFilter === 'unbound') {
      sheetName = "Belum Terikat";
      filePrefix = "Rekap_HP_Belum_Terikat_Siswa";
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `${filePrefix}_${today}.xlsx`);
  });
}

// 🤖 Toggle AI Insights & Analytics Panel
if (dom.btnToggleAnalytics) {
  dom.btnToggleAnalytics.addEventListener('click', () => {
    AnalyticsManager.toggle();
  });
}

