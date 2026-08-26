import { db } from "../config/firebase-config.js";
import { initializeAuthGuard } from "../auth/auth-guard.js";
import { showToast, showConfirm, showPrompt } from "../utils/toast.js";
import { loadXLSX } from "../utils/lazy-loader.js";
import {
  collection, 
  doc, 
  onSnapshot, 
  deleteDoc, 
  query,
  orderBy, 
  writeBatch 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// -----------------------------------------------------------------
// 1. STATE
// -----------------------------------------------------------------
const state = {
  logsList: [],
  searchQuery: '',
  currentPage: 1,
  pageSize: 10,
  unsubscribeLogs: null
};

// -----------------------------------------------------------------
// 2. DOM
// -----------------------------------------------------------------
const dom = {
  userEmailDisplay: document.getElementById('user-email-display'),
  btnLogout: document.getElementById('btn-logout'),
  statTotalResets: document.getElementById('stat-total-resets'),
  statTotalAdmins: document.getElementById('stat-total-admins'),
  statLogsToday: document.getElementById('stat-logs-today'),
  inputSearchLogs: document.getElementById('input-search-logs'),
  tableBodyLogs: document.getElementById('table-body-logs'),
  btnPrevPage: document.getElementById('btn-prev-page'),
  btnNextPage: document.getElementById('btn-next-page'),
  pageInfoLogs: document.getElementById('page-info-logs') || document.getElementById('page-info'),
  btnExportExcel: document.getElementById('btn-export-excel'),
  btnClearLogs: document.getElementById('btn-clear-logs')
};

// -----------------------------------------------------------------
// 3. TABLE ENGINE
// -----------------------------------------------------------------
const TableEngine = {
  getFilteredLogs() {
    if (!state.searchQuery) return state.logsList;
    const q = state.searchQuery.toLowerCase();
    return state.logsList.filter(d => {
      const data = d.data();
      return (
        (data.target_name || '').toLowerCase().includes(q) ||
        (data.target_nis || '').toLowerCase().includes(q) ||
        (data.admin_email || '').toLowerCase().includes(q) ||
        (data.old_device_id || '').toLowerCase().includes(q)
      );
    });
  },

  renderTable() {
    if (!dom.tableBodyLogs) return;
    dom.tableBodyLogs.innerHTML = '';
    const filtered = this.getFilteredLogs();

    const totalPages = Math.ceil(filtered.length / state.pageSize) || 1;
    if (state.currentPage > totalPages) state.currentPage = totalPages;
    if (state.currentPage < 1) state.currentPage = 1;

    if (dom.pageInfoLogs) dom.pageInfoLogs.innerText = `Halaman ${state.currentPage} dari ${totalPages}`;
    if (dom.btnPrevPage) dom.btnPrevPage.disabled = state.currentPage === 1;
    if (dom.btnNextPage) dom.btnNextPage.disabled = state.currentPage === totalPages;

    const start = (state.currentPage - 1) * state.pageSize;
    const pageDocs = filtered.slice(start, start + state.pageSize);

    if (pageDocs.length === 0) {
      dom.tableBodyLogs.innerHTML = `
        <tr>
          <td colspan="6" class="p-8 text-center text-slate-500 font-mono">
            Tidak ada riwayat log reset yang ditemukan.
          </td>
        </tr>
      `;
    } else {
      pageDocs.forEach((docSnap, index) => {
        const data = docSnap.data();
        const ts = data.timestamp ? new Date(data.timestamp.seconds * 1000).toLocaleString('id-ID') : '-';
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-900/80 transition border-b border-slate-800/40";
        tr.innerHTML = `
          <td class="p-2.5 sm:p-3 text-center border-r border-slate-800/60 font-mono text-slate-400 font-bold">${start + index + 1}</td>
          <td class="p-2.5 sm:p-3 border-r border-slate-800/60 font-mono text-cyan-400 col-truncate-sm" title="${ts}">${ts}</td>
          <td class="p-2.5 sm:p-3 border-r border-slate-800/60 col-truncate-md" title="${data.target_name || '-'} (NIS: ${data.target_nis || '-'})">
            <div class="font-bold text-white truncate">${data.target_name || '-'}</div>
            <div class="text-[10px] text-slate-400 font-mono">NIS: ${data.target_nis || '-'}</div>
          </td>
          <td class="p-2.5 sm:p-3 border-r border-slate-800/60 text-slate-300 col-truncate-sm" title="${data.admin_email || '-'}">${data.admin_email || '-'}</td>
          <td class="p-2.5 sm:p-3 border-r border-slate-800/60 font-mono text-[10px] text-slate-400 col-truncate-md" title="${data.old_device_id || '-'}">${data.old_device_id || '-'}</td>
          <td class="p-2.5 sm:p-3 text-center">
            <button class="btn-del p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition cursor-pointer" title="Hapus Log">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        `;

        tr.querySelector('.btn-del').onclick = async () => {
          const confirmed = await showConfirm({
            title: "Hapus Log Reset",
            message: `Hapus log reset untuk siswa <b>${data.target_name || data.target_nis}</b>?`,
            icon: "fa-trash-can",
            confirmText: "Hapus Log",
            type: "danger"
          });
          if (confirmed) {
            try {
              await deleteDoc(doc(db, "system_logs", docSnap.id));
              showToast("Log berhasil dihapus.", "success");
            } catch (e) {
              showToast("Gagal menghapus log: " + e.message, "error");
            }
          }
        };

        dom.tableBodyLogs.appendChild(tr);
      });
    }

    // Update Metrics
    if (dom.statTotalResets) dom.statTotalResets.innerText = state.logsList.length;
    const admins = new Set(state.logsList.map(d => d.data().admin_email));
    if (dom.statTotalAdmins) dom.statTotalAdmins.innerText = `${admins.size} Akun`;
    const today = new Date().setHours(0,0,0,0);
    const todayLogs = state.logsList.filter(d => (d.data().timestamp?.seconds * 1000) >= today).length;
    if (dom.statLogsToday) dom.statLogsToday.innerText = todayLogs;
  }
};

// -----------------------------------------------------------------
// 4. INIT
// -----------------------------------------------------------------
initializeAuthGuard({
  onAuthenticated: (user) => {
    if (dom.userEmailDisplay) dom.userEmailDisplay.innerText = user.email;

    const q = query(collection(db, "system_logs"), orderBy("timestamp", "desc"));
    state.unsubscribeLogs = onSnapshot(q, (snapshot) => {
      state.logsList = snapshot.docs;
      TableEngine.renderTable();
    });

    if (dom.inputSearchLogs) {
      dom.inputSearchLogs.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim();
        state.currentPage = 1;
        TableEngine.renderTable();
      });
    }

    if (dom.btnNextPage) dom.btnNextPage.onclick = () => { state.currentPage++; TableEngine.renderTable(); };
    if (dom.btnPrevPage) dom.btnPrevPage.onclick = () => { state.currentPage--; TableEngine.renderTable(); };
    if (dom.btnLogout) dom.btnLogout.onclick = () => window.location.href = "../../admin.html";

    if (dom.btnExportExcel) {
      dom.btnExportExcel.onclick = async () => {
        if (state.logsList.length === 0) {
          showToast("Tidak ada riwayat log untuk diekspor.", "warning");
          return;
        }
        try {
          await loadXLSX();
          const rows = state.logsList.map(d => ({
            Waktu: d.data().timestamp ? new Date(d.data().timestamp.seconds * 1000).toLocaleString() : '-',
            Siswa: d.data().target_name,
            NIS: d.data().target_nis,
            Admin: d.data().admin_email,
            DeviceID: d.data().old_device_id
          }));
          const ws = XLSX.utils.json_to_sheet(rows);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Resets");
          XLSX.writeFile(wb, "Riwayat_Reset_HP.xlsx");
          showToast("Berhasil mengunduh riwayat reset HP!", "success");
        } catch (errXlsx) {
          showToast("Gagal memproses file Excel: " + errXlsx.message, "error");
        }
      };
    }

    if (dom.btnClearLogs) {
      dom.btnClearLogs.onclick = async () => {
        if (state.logsList.length === 0) {
          showToast("Koleksi log sudah kosong.", "info");
          return;
        }
        const input = await showPrompt({
          title: "KOSONGKAN SELURUH LOG",
          message: "Anda akan menghapus seluruh riwayat log reset.<br/>Ketik <b>HAPUS</b> untuk mengonfirmasi:",
          placeholder: "HAPUS"
        });

        if (input === 'HAPUS') {
          try {
            const batch = writeBatch(db);
            state.logsList.forEach(d => batch.delete(d.ref));
            await batch.commit();
            showToast("Seluruh riwayat log reset berhasil dikosongkan!", "success");
          } catch (e) {
            showToast("Gagal mengosongkan log: " + e.message, "error");
          }
        } else if (input !== null) {
          showToast("Konfirmasi batal: Kata kunci tidak cocok.", "warning");
        }
      };
    }
  }
});
