import { db } from "../config/firebase-config.js";
import { initializeAuthGuard } from "../auth/auth-guard.js";
import { AIInsightEngine } from "./ai-insights.js";
import { 
  collection, 
  onSnapshot,
  getDocs,
  query, 
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// -----------------------------------------------------------------
// 1. STATE REAKTIF ANALYSIS ENGINE
// -----------------------------------------------------------------
const state = {
  logsList: [],
  allFindings: [],
  selectedAiCategory: 'ALL',
  cachedLogAbsensi: [],
  cachedSesiAbsensi: [],
  cachedSiswaList: [],
  unsubscribeLogs: null
};

// -----------------------------------------------------------------
// 2. DOM ELEMENTS REGISTRY
// -----------------------------------------------------------------
const dom = {
  userEmailDisplay: document.getElementById('user-email-display'),
  btnLogout: document.getElementById('btn-logout'),
  btnToggleFullscreen: document.getElementById('btn-toggle-fullscreen'),

  // Metrics
  statTotalFindings: document.getElementById('stat-total-findings'),
  statHighRisk: document.getElementById('stat-high-risk'),
  statResetAnomalies: document.getElementById('stat-reset-anomalies'),
  statEarlyBirds: document.getElementById('stat-early-birds'),

  // AI Radar Elements
  aiStatusBadge: document.getElementById('ai-status-badge'),
  btnExportAnomalies: document.getElementById('btn-export-anomalies'),
  aiInsightsCardsContainer: document.getElementById('ai-insights-cards-container'),

  countCatAll: document.getElementById('count-cat-all'),
  countCatReset: document.getElementById('count-cat-reset'),
  countCatShared: document.getElementById('count-cat-shared'),
  countCatLastmin: document.getElementById('count-cat-lastmin'),
  countCatAlpa: document.getElementById('count-cat-alpa'),
  countCatEarly: document.getElementById('count-cat-early')
};

// -----------------------------------------------------------------
// 3. AI ANALYSIS MANAGER
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
            b.className = 'btn-ai-filter px-4 py-2 rounded-xl font-bold bg-cyan-500 text-slate-950 transition cursor-pointer shrink-0 shadow-md';
          } else {
            b.className = 'btn-ai-filter px-4 py-2 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer shrink-0';
          }
        });

        this.renderFindings();
      });
    });

    // Ekspor Laporan Anomali
    if (dom.btnExportAnomalies) {
      dom.btnExportAnomalies.addEventListener('click', () => {
        const findingsToExport = this.getFilteredFindings();
        AIInsightEngine.exportToExcel(findingsToExport, 'Analisa_Anomali_Presensi');
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
      SAME_SESSION_RESET: state.allFindings.filter(f => f.type === 'SAME_SESSION_RESET').length,
      FREQUENT_RESET: state.allFindings.filter(f => f.type === 'FREQUENT_RESET').length,
      SHARED_DEVICE: state.allFindings.filter(f => f.type === 'SHARED_DEVICE').length,
      LAST_MINUTE: state.allFindings.filter(f => f.type === 'LAST_MINUTE').length,
      CHRONIC_ABSENCE: state.allFindings.filter(f => f.type === 'CHRONIC_ABSENCE').length,
      EARLY_BIRD: state.allFindings.filter(f => f.type === 'EARLY_BIRD').length
    };

    // Update Counter Badges
    if (dom.countCatAll) dom.countCatAll.innerText = counts.ALL;
    if (dom.countCatReset) dom.countCatReset.innerText = counts.FREQUENT_RESET;
    if (dom.countCatShared) dom.countCatShared.innerText = counts.SHARED_DEVICE;
    if (dom.countCatLastmin) dom.countCatLastmin.innerText = counts.LAST_MINUTE;
    if (dom.countCatAlpa) dom.countCatAlpa.innerText = counts.CHRONIC_ABSENCE;
    if (dom.countCatEarly) dom.countCatEarly.innerText = counts.EARLY_BIRD;

    // Update Metrics Cards
    if (dom.statTotalFindings) dom.statTotalFindings.innerText = counts.ALL;
    if (dom.statHighRisk) dom.statHighRisk.innerText = state.allFindings.filter(f => f.severity === 'HIGH').length;
    if (dom.statResetAnomalies) dom.statResetAnomalies.innerText = counts.FREQUENT_RESET + counts.SAME_SESSION_RESET;
    if (dom.statEarlyBirds) dom.statEarlyBirds.innerText = counts.EARLY_BIRD;

    if (dom.aiStatusBadge) {
      const highRiskCount = state.allFindings.filter(f => f.severity === 'HIGH').length;
      if (highRiskCount > 0) {
        dom.aiStatusBadge.className = 'px-2.5 py-0.5 text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full font-mono font-bold uppercase';
        dom.aiStatusBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1"></i> ${highRiskCount} KRITIS`;
      } else {
        dom.aiStatusBadge.className = 'px-2.5 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-mono font-bold uppercase';
        dom.aiStatusBadge.innerText = 'Engine Active';
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
        // Redirect to reset logs with NIS filter
        window.location.href = `reset-logs.html?search=${nis}`;
      }
    });
  }
};

// -----------------------------------------------------------------
// 4. INITIALIZATION & REAL-TIME LISTENER
// -----------------------------------------------------------------
initializeAuthGuard({
  onAuthenticated: async (user) => {
    if (dom.userEmailDisplay) {
      dom.userEmailDisplay.innerText = user.email;
    }

    // Initial analysis
    const qLogs = query(collection(db, "system_logs"), orderBy("timestamp", "desc"));

    state.unsubscribeLogs = onSnapshot(qLogs, (snapshot) => {
      state.logsList = snapshot.docs;
      AIInsightManager.init();
      AIInsightManager.runAnalysis();
    });

    if (dom.btnLogout) {
      dom.btnLogout.addEventListener('click', () => {
        window.location.href = "../../admin.html";
      });
    }

    if (dom.btnToggleFullscreen) {
      dom.btnToggleFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => console.warn(err));
        } else {
          document.exitFullscreen().catch(err => console.warn(err));
        }
      });
    }
  }
});
