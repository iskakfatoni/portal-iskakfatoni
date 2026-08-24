import { db } from "../config/firebase-config.js";
import { initializeAuthGuard } from "../auth/auth-guard.js";
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
  pageSize: 25,
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
  btnExportExcel: document.getElementById('btn-export-excel'),
  btnClearLogs: document.getElementById('btn-clear-logs'),
  tableBodyLogs: document.getElementById('table-body-logs'),
  pageInfo: document.getElementById('page-info'),
  btnPrevPage: document.getElementById('btn-prev-page'),
  btnNextPage: document.getElementById('btn-next-page')
};

// -----------------------------------------------------------------
// 3. TABLE ENGINE
// -----------------------------------------------------------------
const TableEngine = {
  renderTable() {
    let filtered = [...state.logsList];

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      filtered = filtered.filter(docSnap => {
        const data = docSnap.data();
        return docSnap.id.toLowerCase().includes(q) ||
               (data.target_name || '').toLowerCase().includes(q) ||
               (data.target_nis || '').toLowerCase().includes(q) ||
               (data.admin_email || '').toLowerCase().includes(q);
      });
    }

    if (filtered.length === 0) {
      dom.tableBodyLogs.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-500">// Tidak ada data.</td></tr>`;
      return;
    }

    // Basic Pagination
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / state.pageSize);
    const start = (state.currentPage - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageDocs = filtered.slice(start, end);

    dom.pageInfo.innerText = `Halaman ${state.currentPage} dari ${totalPages}`;
    dom.btnPrevPage.disabled = state.currentPage <= 1;
    dom.btnNextPage.disabled = state.currentPage >= totalPages;

    dom.tableBodyLogs.innerHTML = '';
    pageDocs.forEach((docSnap, index) => {
      const data = docSnap.data();
      const ts = data.timestamp ? new Date(data.timestamp.seconds * 1000).toLocaleString('id-ID') : '-';
      const tr = document.createElement('tr');
      tr.className = "hover:bg-slate-900/80 transition border-b border-slate-800/40";
      tr.innerHTML = `
        <td class="p-3 text-center border-r border-slate-800/60 font-mono text-slate-400">${start + index + 1}</td>
        <td class="p-3 border-r border-slate-800/60 font-mono text-cyan-400">${ts}</td>
        <td class="p-3 border-r border-slate-800/60">
          <div class="font-bold text-white">${data.target_name || '-'}</div>
          <div class="text-[10px] text-slate-400">NIS: ${data.target_nis || '-'}</div>
        </td>
        <td class="p-3 border-r border-slate-800/60 text-slate-300">${data.admin_email || '-'}</td>
        <td class="p-3 border-r border-slate-800/60 font-mono text-[10px] text-slate-500">${data.old_device_id || '-'}</td>
        <td class="p-3 text-center">
          <button class="btn-del p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      `;

      tr.querySelector('.btn-del').onclick = async () => {
        if(confirm('Hapus log ini?')) await deleteDoc(doc(db, "system_logs", docSnap.id));
      };

      dom.tableBodyLogs.appendChild(tr);
    });

    // Update Metrics
    dom.statTotalResets.innerText = state.logsList.length;
    const admins = new Set(state.logsList.map(d => d.data().admin_email));
    dom.statTotalAdmins.innerText = `${admins.size} Akun`;
    const today = new Date().setHours(0,0,0,0);
    const todayLogs = state.logsList.filter(d => (d.data().timestamp?.seconds * 1000) >= today).length;
    dom.statLogsToday.innerText = todayLogs;
  }
};

// -----------------------------------------------------------------
// 4. INIT
// -----------------------------------------------------------------
initializeAuthGuard({
  onAuthenticated: (user) => {
    dom.userEmailDisplay.innerText = user.email;

    // Check for NIS filter from URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchNis = urlParams.get('search');
    if (searchNis) {
      dom.inputSearchLogs.value = searchNis;
      state.searchQuery = searchNis;
    }

    const q = query(collection(db, "system_logs"), orderBy("timestamp", "desc"));
    state.unsubscribeLogs = onSnapshot(q, (snapshot) => {
      state.logsList = snapshot.docs;
      TableEngine.renderTable();
    });

    dom.inputSearchLogs.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim();
      state.currentPage = 1;
      TableEngine.renderTable();
    });

    dom.btnNextPage.onclick = () => { state.currentPage++; TableEngine.renderTable(); };
    dom.btnPrevPage.onclick = () => { state.currentPage--; TableEngine.renderTable(); };
    dom.btnLogout.onclick = () => window.location.href = "../../admin.html";

    dom.btnExportExcel.onclick = () => {
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
    };

    dom.btnClearLogs.onclick = async () => {
      if(prompt('Ketik HAPUS untuk konfirmasi') === 'HAPUS') {
        const batch = writeBatch(db);
        state.logsList.forEach(d => batch.delete(d.reference));
        await batch.commit();
      }
    };
  }
});
