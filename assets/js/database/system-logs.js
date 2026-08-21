import { db } from "../config/firebase-config.js";
import { initializeAuthGuard } from "../auth/auth-guard.js";
import { AIInsightEngine } from "./ai-insights.js";
import { 
  collection, 
  doc, 
  onSnapshot, 
  deleteDoc, 
  getDocs,
  query, 
  orderBy, 
  writeBatch 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// -----------------------------------------------------------------
// 1. STATE REAKTIF AUDIT TRAIL ENGINE
// -----------------------------------------------------------------
const state = {
  logsList: [],
  actionFilter: 'ALL',
  timeFilter: 'ALL',
  searchQuery: '',
  currentPage: 1,
  pageSize: 25,
  prevLogIds: new Set(),
  selectedLogData: null,
  unsubscribeLogs: null,

  // AI Attendance & Security Insight State
  allFindings: [],
  selectedAiCategory: 'ALL',
  isRadarCollapsed: false,
  cachedLogAbsensi: [],
  cachedSesiAbsensi: [],
  cachedSiswaList: []
};

// -----------------------------------------------------------------
// 2. DOM ELEMENTS REGISTRY
// -----------------------------------------------------------------
const dom = {
  userEmailDisplay: document.getElementById('user-email-display'),
  btnLogout: document.getElementById('btn-logout'),
  btnToggleFullscreen: document.getElementById('btn-toggle-fullscreen'),

  // Metrics
  statTotalLogs: document.getElementById('stat-total-logs'),
  statTotalResets: document.getElementById('stat-total-resets'),
  statTotalAdmins: document.getElementById('stat-total-admins'),
  statLogsToday: document.getElementById('stat-logs-today'),

  // 🤖 AI Radar Elements
  btnToggleRadar: document.getElementById('btn-toggle-radar'),
  aiRadarPanel: document.getElementById('ai-radar-panel'),
  aiStatusBadge: document.getElementById('ai-status-badge'),
  aiRadarBody: document.getElementById('ai-radar-body'),
  btnExportAnomalies: document.getElementById('btn-export-anomalies'),
  btnToggleRadarCollapse: document.getElementById('btn-toggle-radar-collapse'),
  iconRadarCollapse: document.getElementById('icon-radar-collapse'),
  textRadarCollapse: document.getElementById('text-radar-collapse'),
  aiInsightsCardsContainer: document.getElementById('ai-insights-cards-container'),
  countCatAll: document.getElementById('count-cat-all'),
  countCatReset: document.getElementById('count-cat-reset'),
  countCatShared: document.getElementById('count-cat-shared'),
  countCatLastmin: document.getElementById('count-cat-lastmin'),
  countCatAlpa: document.getElementById('count-cat-alpa'),
  countCatEarly: document.getElementById('count-cat-early'),

  // Controls & Filters
  inputSearchLogs: document.getElementById('input-search-logs'),
  btnClearSearch: document.getElementById('btn-clear-search'),
  selectActionFilter: document.getElementById('select-action-filter'),
  selectTimeFilter: document.getElementById('select-time-filter'),
  btnExportExcel: document.getElementById('btn-export-excel'),
  btnClearLogs: document.getElementById('btn-clear-logs'),

  // Table & Pagination
  tableBodyLogs: document.getElementById('table-body-logs'),
  selectPageSize: document.getElementById('select-page-size'),
  pageInfo: document.getElementById('page-info'),
  btnPrevPage: document.getElementById('btn-prev-page'),
  btnNextPage: document.getElementById('btn-next-page'),
  syncStatus: document.getElementById('sync-status'),

  // Inspector Modal
  modalLogInspector: document.getElementById('modal-log-inspector'),
  inspectorDocId: document.getElementById('inspector-doc-id'),
  jsonViewerContent: document.getElementById('json-viewer-content'),
  btnCopyJson: document.getElementById('btn-copy-json'),
  btnCloseInspector: document.getElementById('btn-close-inspector'),
  btnCloseInspectorFooter: document.getElementById('btn-close-inspector-footer')
};

// -----------------------------------------------------------------
// 3. HELPER UTILS & FORMATTERS
// -----------------------------------------------------------------
const LogUtils = {
  formatDateObject(val) {
    if (!val) return { dateStr: '-', timeStr: '-', fullStr: '-', timestampMs: 0 };

    let d;
    if (typeof val === 'object' && val.seconds !== undefined) {
      d = new Date(val.seconds * 1000);
    } else if (val instanceof Date) {
      d = val;
    } else if (typeof val === 'string' || typeof val === 'number') {
      d = new Date(val);
    } else {
      return { dateStr: '-', timeStr: '-', fullStr: '-', timestampMs: 0 };
    }

    if (isNaN(d.getTime())) {
      return { dateStr: '-', timeStr: '-', fullStr: '-', timestampMs: 0 };
    }

    const dateStr = d.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: '2-digit' });
    const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
    return {
      dateStr,
      timeStr,
      fullStr: `${dateStr}, ${timeStr}`,
      timestampMs: d.getTime()
    };
  },

  getActionBadge(actionName) {
    const act = (actionName || 'UNKNOWN').toUpperCase();
    if (act === 'RESET_DEVICE') {
      return `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 w-fit font-mono">
                <i class="fa-solid fa-mobile-screen-button"></i> RESET_DEVICE
              </span>`;
    } else if (act === 'BATCH_RESET_DEVICE') {
      return `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 w-fit font-mono">
                <i class="fa-solid fa-layer-group"></i> BATCH_RESET
              </span>`;
    } else if (act.includes('DELETE') || act.includes('HAPUS')) {
      return `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 w-fit font-mono">
                <i class="fa-solid fa-trash-can"></i> ${act}
              </span>`;
    } else if (act.includes('LOGIN') || act.includes('AUTH')) {
      return `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 w-fit font-mono">
                <i class="fa-solid fa-shield-halved"></i> ${act}
              </span>`;
    }
    return `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5 w-fit font-mono">
              <i class="fa-solid fa-circle-info"></i> ${act}
            </span>`;
  }
};

// -----------------------------------------------------------------
// 4. METRICS & STATS ENGINE
// -----------------------------------------------------------------
const MetricsEngine = {
  updateMetrics() {
    const total = state.logsList.length;
    dom.statTotalLogs.innerText = total;

    let resetCount = 0;
    const adminSet = new Set();
    let todayCount = 0;

    const startOfTodayMs = new Date().setHours(0, 0, 0, 0);

    state.logsList.forEach(log => {
      const data = log.data();
      const action = (data.action || '').toUpperCase();
      if (action.includes('RESET')) resetCount++;

      if (data.admin_email) adminSet.add(data.admin_email);

      const tsInfo = LogUtils.formatDateObject(data.timestamp || data.created_at);
      if (tsInfo.timestampMs >= startOfTodayMs) {
        todayCount++;
      }
    });

    dom.statTotalResets.innerText = resetCount;
    dom.statTotalAdmins.innerText = `${adminSet.size} Akun`;
    dom.statLogsToday.innerText = `${todayCount} Log`;
  }
};

// -----------------------------------------------------------------
// 5. TABLE ENGINE (FILTER, SEARCH, PAGINATION & RENDERING)
// -----------------------------------------------------------------
const TableEngine = {
  getFilteredLogs() {
    let list = [...state.logsList];

    // 1. Action Filter
    if (state.actionFilter !== 'ALL') {
      if (state.actionFilter === 'OTHER') {
        list = list.filter(d => {
          const act = (d.data().action || '').toUpperCase();
          return act !== 'RESET_DEVICE' && act !== 'BATCH_RESET_DEVICE' && !act.includes('DELETE');
        });
      } else {
        list = list.filter(d => (d.data().action || '').toUpperCase() === state.actionFilter);
      }
    }

    // 2. Time Filter
    if (state.timeFilter !== 'ALL') {
      const now = new Date();
      let thresholdMs = 0;

      if (state.timeFilter === 'TODAY') {
        thresholdMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      } else if (state.timeFilter === '7DAYS') {
        thresholdMs = now.getTime() - (7 * 24 * 60 * 60 * 1000);
      } else if (state.timeFilter === '30DAYS') {
        thresholdMs = now.getTime() - (30 * 24 * 60 * 60 * 1000);
      }

      list = list.filter(d => {
        const tsInfo = LogUtils.formatDateObject(d.data().timestamp || d.data().created_at);
        return tsInfo.timestampMs >= thresholdMs;
      });
    }

    // 3. Search Query
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      list = list.filter(docSnap => {
        if (docSnap.id.toLowerCase().includes(q)) return true;
        const data = docSnap.data();
        return Object.entries(data).some(([k, val]) => {
          if (val === null || val === undefined) return false;
          if (typeof val === 'object' && val.seconds !== undefined) {
            return new Date(val.seconds * 1000).toLocaleString('id-ID').toLowerCase().includes(q);
          }
          return String(val).toLowerCase().includes(q);
        });
      });
    }

    return list;
  },

  renderTable() {
    const filtered = TableEngine.getFilteredLogs();

    if (filtered.length === 0) {
      dom.tableBodyLogs.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-500 font-sans">// Tidak ada data log yang cocok dengan filter.</td></tr>`;
      dom.pageInfo.innerText = 'Halaman 0 dari 0';
      dom.btnPrevPage.disabled = true;
      dom.btnNextPage.disabled = true;
      return;
    }

    const totalItems = filtered.length;
    const pSize = Number(state.pageSize);
    const totalPages = pSize === 0 ? 1 : Math.ceil(totalItems / pSize);

    if (state.currentPage > totalPages) state.currentPage = totalPages;
    if (state.currentPage < 1) state.currentPage = 1;

    const startIndex = pSize === 0 ? 0 : (state.currentPage - 1) * pSize;
    const endIndex = pSize === 0 ? totalItems : Math.min(startIndex + pSize, totalItems);
    const pageDocs = filtered.slice(startIndex, endIndex);

    dom.pageInfo.innerText = pSize === 0
      ? `Menampilkan seluruh ${totalItems} log audit`
      : `Halaman ${state.currentPage} dari ${totalPages} | Log ${startIndex + 1}-${endIndex} dari ${totalItems}`;

    dom.btnPrevPage.disabled = state.currentPage <= 1;
    dom.btnNextPage.disabled = state.currentPage >= totalPages;

    dom.tableBodyLogs.innerHTML = '';
    pageDocs.forEach((docSnap, index) => {
      const docId = docSnap.id;
      const data = docSnap.data();
      const globalIndex = startIndex + index + 1;

      const tsInfo = LogUtils.formatDateObject(data.timestamp || data.created_at);
      const actionBadge = LogUtils.getActionBadge(data.action);

      const targetNis = data.target_nis || '-';
      const targetName = data.target_name || '-';
      const adminEmail = data.admin_email || 'System';
      const oldDeviceId = data.old_device_id || '-';
      const oldDeviceInfo = data.old_device_info || '-';

      const tr = document.createElement('tr');
      tr.className = "hover:bg-slate-900/80 transition border-b border-slate-800/40 text-xs";

      // Efek visual flash jika log baru saja masuk
      if (state.prevLogIds.size > 0 && !state.prevLogIds.has(docId)) {
        tr.classList.add('animate-flash-cyan');
      }

      tr.innerHTML = `
        <td class="p-3 text-center border-r border-slate-800/60 font-mono text-slate-400 font-bold">${globalIndex}</td>
        <td class="p-3 border-r border-slate-800/60 font-mono whitespace-nowrap">
          <div class="text-cyan-400 font-semibold">${tsInfo.timeStr}</div>
          <div class="text-[10px] text-slate-500">${tsInfo.dateStr}</div>
        </td>
        <td class="p-3 border-r border-slate-800/60">${actionBadge}</td>
        <td class="p-3 border-r border-slate-800/60 font-mono">
          <div class="text-white font-bold">${targetName}</div>
          <div class="text-[10px] text-cyan-400">NIS: ${targetNis}</div>
        </td>
        <td class="p-3 border-r border-slate-800/60 font-mono text-slate-300">
          <span class="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-md text-[11px]">
            ${adminEmail}
          </span>
        </td>
        <td class="p-3 border-r border-slate-800/60 font-mono max-w-[200px] truncate" title="${oldDeviceInfo} (${oldDeviceId})">
          <div class="text-slate-300 font-semibold truncate">${oldDeviceInfo}</div>
          <div class="text-[10px] text-slate-500 truncate">${oldDeviceId}</div>
        </td>
        <td class="p-3 text-center whitespace-nowrap">
          <button class="btn-inspect p-1.5 bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold cursor-pointer transition mr-1" title="Lihat JSON Payload">
            <i class="fa-solid fa-code"></i> Payload
          </button>
          <button class="btn-del-log p-1.5 bg-red-500/15 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold cursor-pointer transition" title="Hapus Log Ini">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      `;

      // Event Inspect JSON
      tr.querySelector('.btn-inspect').onclick = () => InspectorEngine.openInspector(docId, data);

      // Event Delete Single Log
      tr.querySelector('.btn-del-log').onclick = async () => {
        if (confirm(`Hapus catatan log audit "${docId}"?`)) {
          try {
            await deleteDoc(doc(db, "system_logs", docId));
          } catch (err) {
            alert("Gagal menghapus log: " + err.message);
          }
        }
      };

      dom.tableBodyLogs.appendChild(tr);
    });
  }
};

// -----------------------------------------------------------------
// 6. INSPECTOR & MODAL ENGINE
// -----------------------------------------------------------------
const InspectorEngine = {
  openInspector(docId, rawData) {
    dom.inspectorDocId.innerText = docId;

    // Normalisasi timestamp untuk JSON viewer
    const displayData = { id: docId, ...rawData };
    if (displayData.timestamp && displayData.timestamp.seconds !== undefined) {
      displayData.timestamp = new Date(displayData.timestamp.seconds * 1000).toISOString();
    }
    if (displayData.created_at && displayData.created_at.seconds !== undefined) {
      displayData.created_at = new Date(displayData.created_at.seconds * 1000).toISOString();
    }

    state.selectedLogData = displayData;
    dom.jsonViewerContent.textContent = JSON.stringify(displayData, null, 2);
    dom.modalLogInspector.classList.remove('hidden');
  },

  closeInspector() {
    dom.modalLogInspector.classList.add('hidden');
    state.selectedLogData = null;
  }
};

dom.btnCloseInspector.onclick = () => InspectorEngine.closeInspector();
dom.btnCloseInspectorFooter.onclick = () => InspectorEngine.closeInspector();

dom.btnCopyJson.onclick = () => {
  if (state.selectedLogData) {
    navigator.clipboard.writeText(JSON.stringify(state.selectedLogData, null, 2)).then(() => {
      dom.btnCopyJson.innerHTML = '<i class="fa-solid fa-check text-emerald-400"></i> Tersalin!';
      setTimeout(() => {
        dom.btnCopyJson.innerHTML = '<i class="fa-solid fa-copy"></i> Salin JSON';
      }, 2000);
    });
  }
};

// -----------------------------------------------------------------
// 7. EXPORT TO EXCEL & CLEAR LOGS
// -----------------------------------------------------------------
dom.btnExportExcel.addEventListener('click', () => {
  const filtered = TableEngine.getFilteredLogs();
  if (filtered.length === 0) {
    alert("Tidak ada data log untuk diekspor.");
    return;
  }

  const exportRows = filtered.map((docSnap, index) => {
    const d = docSnap.data();
    const tsInfo = LogUtils.formatDateObject(d.timestamp || d.created_at);

    return {
      "No": index + 1,
      "Log ID": docSnap.id,
      "Waktu": tsInfo.fullStr,
      "Tipe Aksi": d.action || "-",
      "NIS Target": d.target_nis || "-",
      "Nama Target": d.target_name || "-",
      "Admin Eksekutor": d.admin_email || "-",
      "ID Perangkat Lama": d.old_device_id || "-",
      "Merek/Model HP Lama": d.old_device_info || "-",
      "Raw Data JSON": JSON.stringify(d)
    };
  });

  const ws = XLSX.utils.json_to_sheet(exportRows);
  ws['!cols'] = [
    { wch: 5 }, { wch: 22 }, { wch: 24 }, { wch: 20 },
    { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 30 },
    { wch: 25 }, { wch: 40 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Audit_Logs");

  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Audit_Trail_System_Logs_${today}.xlsx`);
});

dom.btnClearLogs.addEventListener('click', async () => {
  if (state.logsList.length === 0) {
    alert("Koleksi system_logs sudah kosong.");
    return;
  }

  const confirmText = prompt(`⚠️ PERINGATAN!\n\nAnda akan menghapus SELURUH catatan audit trail (${state.logsList.length} log).\n\nKetik "HAPUS_LOG" untuk mengonfirmasi:`);
  if (confirmText === "HAPUS_LOG") {
    try {
      const docIds = state.logsList.map(d => d.id);
      const CHUNK_SIZE = 400;

      for (let i = 0; i < docIds.length; i += CHUNK_SIZE) {
        const chunk = docIds.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        chunk.forEach(id => batch.delete(doc(db, "system_logs", id)));
        await batch.commit();
      }

      alert("Seluruh catatan log berhasil dibersihkan!");
    } catch (err) {
      alert("Gagal mengosongkan log: " + err.message);
    }
  } else if (confirmText !== null) {
    alert("Konfirmasi dibatalkan: Kata kunci konfirmasi tidak cocok.");
  }
});

// -----------------------------------------------------------------
// 8. EVENT LISTENERS (SEARCH, FILTER & PAGINATION)
// -----------------------------------------------------------------
dom.inputSearchLogs.addEventListener('input', (e) => {
  state.searchQuery = e.target.value.trim();
  state.currentPage = 1;
  if (state.searchQuery) dom.btnClearSearch.classList.remove('hidden');
  else dom.btnClearSearch.classList.add('hidden');
  TableEngine.renderTable();
});

dom.btnClearSearch.addEventListener('click', () => {
  dom.inputSearchLogs.value = '';
  state.searchQuery = '';
  state.currentPage = 1;
  dom.btnClearSearch.classList.add('hidden');
  TableEngine.renderTable();
});

dom.selectActionFilter.addEventListener('change', (e) => {
  state.actionFilter = e.target.value;
  state.currentPage = 1;
  TableEngine.renderTable();
});

dom.selectTimeFilter.addEventListener('change', (e) => {
  state.timeFilter = e.target.value;
  state.currentPage = 1;
  TableEngine.renderTable();
});

dom.selectPageSize.addEventListener('change', (e) => {
  state.pageSize = Number(e.target.value);
  state.currentPage = 1;
  TableEngine.renderTable();
});

dom.btnPrevPage.addEventListener('click', () => {
  if (state.currentPage > 1) {
    state.currentPage--;
    TableEngine.renderTable();
  }
});

dom.btnNextPage.addEventListener('click', () => {
  state.currentPage++;
  TableEngine.renderTable();
});

dom.btnLogout.addEventListener('click', () => {
  window.location.href = "../admin.html";
});

dom.btnToggleFullscreen.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => console.warn(err));
    dom.btnToggleFullscreen.innerHTML = '<i class="fa-solid fa-compress"></i> <span class="hidden sm:inline">Keluar Fullscreen</span>';
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(err => console.warn(err));
      dom.btnToggleFullscreen.innerHTML = '<i class="fa-solid fa-expand"></i> <span class="hidden sm:inline">Layar Penuh</span>';
    }
  }
});

// -----------------------------------------------------------------
// 9. AI ATTENDANCE & SECURITY INSIGHT RADAR MANAGER
// -----------------------------------------------------------------
const AIInsightManager = {
  isInitialized: false,

  async init() {
    if (this.isInitialized) return;
    this.bindEvents();
    await this.fetchCorrelatedData();
    this.runAnalysis();
    this.isInitialized = true;
  },

  bindEvents() {
    // Filter Kategori Anomali
    document.querySelectorAll('.btn-ai-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.dataset.cat;
        state.selectedAiCategory = cat;

        document.querySelectorAll('.btn-ai-filter').forEach(b => {
          if (b.dataset.cat === cat) {
            b.className = 'btn-ai-filter px-3 py-1.5 rounded-xl font-bold bg-cyan-500 text-slate-950 transition cursor-pointer shrink-0 shadow-md';
          } else {
            b.className = 'btn-ai-filter px-3 py-1.5 rounded-xl font-bold bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer shrink-0';
          }
        });

        this.renderFindings();
      });
    });

    // Toggle Collapse Radar
    if (dom.btnToggleRadarCollapse) {
      dom.btnToggleRadarCollapse.addEventListener('click', () => {
        state.isRadarCollapsed = !state.isRadarCollapsed;
        if (state.isRadarCollapsed) {
          dom.aiRadarBody.classList.add('hidden');
          dom.iconRadarCollapse.className = 'fa-solid fa-chevron-down';
          dom.textRadarCollapse.innerText = 'Buka';
        } else {
          dom.aiRadarBody.classList.remove('hidden');
          dom.iconRadarCollapse.className = 'fa-solid fa-chevron-up';
          dom.textRadarCollapse.innerText = 'Ciutkan';
        }
      });
    }

    // Toggle Buka/Tutup AI Radar dari Header
    if (dom.btnToggleRadar) {
      dom.btnToggleRadar.addEventListener('click', () => {
        if (dom.aiRadarPanel) {
          const isHidden = dom.aiRadarPanel.classList.toggle('hidden');
          if (!isHidden) {
            dom.aiRadarPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    }

    // Ekspor Laporan Anomali
    if (dom.btnExportAnomalies) {
      dom.btnExportAnomalies.addEventListener('click', () => {
        const findingsToExport = this.getFilteredFindings();
        AIInsightEngine.exportToExcel(findingsToExport, 'Investigasi_Anomali_Presensi_Portal');
      });
    }
  },

  async fetchCorrelatedData() {
    try {
      const [snapLog, snapSesi, snapSiswa] = await Promise.all([
        getDocs(collection(db, "log_absensi")),
        getDocs(collection(db, "sesi_absensi")),
        getDocs(collection(db, "siswa"))
      ]);
      state.cachedLogAbsensi = snapLog.docs;
      state.cachedSesiAbsensi = snapSesi.docs;
      state.cachedSiswaList = snapSiswa.docs;
    } catch (e) {
      console.warn("[AIInsightManager] Error fetching correlated data:", e);
    }
  },

  runAnalysis() {
    state.allFindings = AIInsightEngine.analyze({
      systemLogs: state.logsList,
      logAbsensi: state.cachedLogAbsensi,
      sesiAbsensi: state.cachedSesiAbsensi,
      siswaList: state.cachedSiswaList
    });

    const counts = {
      ALL: state.allFindings.length,
      FREQUENT_RESET: state.allFindings.filter(f => f.type === 'FREQUENT_RESET').length,
      SHARED_DEVICE: state.allFindings.filter(f => f.type === 'SHARED_DEVICE').length,
      LAST_MINUTE: state.allFindings.filter(f => f.type === 'LAST_MINUTE').length,
      CHRONIC_ABSENCE: state.allFindings.filter(f => f.type === 'CHRONIC_ABSENCE').length,
      EARLY_BIRD: state.allFindings.filter(f => f.type === 'EARLY_BIRD').length
    };

    if (dom.countCatAll) dom.countCatAll.innerText = counts.ALL;
    if (dom.countCatReset) dom.countCatReset.innerText = counts.FREQUENT_RESET;
    if (dom.countCatShared) dom.countCatShared.innerText = counts.SHARED_DEVICE;
    if (dom.countCatLastmin) dom.countCatLastmin.innerText = counts.LAST_MINUTE;
    if (dom.countCatAlpa) dom.countCatAlpa.innerText = counts.CHRONIC_ABSENCE;
    if (dom.countCatEarly) dom.countCatEarly.innerText = counts.EARLY_BIRD;

    if (dom.aiStatusBadge) {
      const highRiskCount = state.allFindings.filter(f => f.severity === 'HIGH').length;
      if (highRiskCount > 0) {
        dom.aiStatusBadge.className = 'px-2 py-0.5 text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full font-mono font-bold uppercase';
        dom.aiStatusBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1"></i> ${counts.ALL} Kasus (${highRiskCount} Kritis)`;
      } else if (counts.ALL > 0) {
        dom.aiStatusBadge.className = 'px-2 py-0.5 text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full font-mono font-bold uppercase';
        dom.aiStatusBadge.innerText = `Monitoring • ${counts.ALL} Temuan`;
      } else {
        dom.aiStatusBadge.className = 'px-2 py-0.5 text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-mono font-bold uppercase';
        dom.aiStatusBadge.innerText = 'Active • 0 Anomali';
      }
    }

    this.renderFindings();
  },

  getFilteredFindings() {
    if (state.selectedAiCategory === 'ALL') return state.allFindings;
    return state.allFindings.filter(f => f.type === state.selectedAiCategory);
  },

  renderFindings() {
    const list = this.getFilteredFindings();
    AIInsightEngine.renderInsightsUI(dom.aiInsightsCardsContainer, list, {
      onFilterNis: (nis) => {
        dom.inputSearchLogs.value = nis;
        state.searchQuery = nis;
        state.currentPage = 1;
        dom.btnClearSearch.classList.remove('hidden');
        TableEngine.renderTable();
        dom.inputSearchLogs.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }
};

// -----------------------------------------------------------------
// 10. INITIALIZATION & REAL-TIME LISTENER
// -----------------------------------------------------------------
initializeAuthGuard({
  onAuthenticated: async (user) => {
    dom.userEmailDisplay.innerText = user.email;

    await AIInsightManager.init();

    // Real-time Firestore Listener ke system_logs
    const qLogs = query(collection(db, "system_logs"), orderBy("timestamp", "desc"));

    state.unsubscribeLogs = onSnapshot(qLogs, (snapshot) => {
      const newDocIds = new Set(snapshot.docs.map(d => d.id));
      state.logsList = snapshot.docs;

      MetricsEngine.updateMetrics();
      TableEngine.renderTable();
      AIInsightManager.runAnalysis();

      state.prevLogIds = newDocIds;
    }, (error) => {
      console.warn("[SystemLogsListener] Error:", error);
      // Fallback tanpa orderBy jika index belum selesai dibuild
      onSnapshot(collection(db, "system_logs"), (snapFallback) => {
        const sortedDocs = [...snapFallback.docs].sort((a, b) => {
          const tA = (a.data().timestamp && a.data().timestamp.seconds) || 0;
          const tB = (b.data().timestamp && b.data().timestamp.seconds) || 0;
          return tB - tA;
        });
        state.logsList = sortedDocs;
        MetricsEngine.updateMetrics();
        TableEngine.renderTable();
        AIInsightManager.runAnalysis();
      });
    });
  }
});

