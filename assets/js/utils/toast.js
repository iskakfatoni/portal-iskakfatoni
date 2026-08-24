// assets/js/utils/toast.js
// 🔔 GLOBAL GLASSMORPHIC TOAST & MODAL DIALOG SYSTEM
// Menyediakan notifikasi non-blocking dan dialog konfirmasi modern bertema glassmorphic.

class ToastManager {
  constructor() {
    this.container = null;
    this.modalContainer = null;
    this.init();
  }

  init() {
    if (typeof document === 'undefined') return;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.ensureContainers());
    } else {
      this.ensureContainers();
    }
  }

  ensureContainers() {
    // 1. Toast Container (Pojok Kanan Bawah / Atas Mobile)
    if (!document.getElementById('portal-toast-container')) {
      const container = document.createElement('div');
      container.id = 'portal-toast-container';
      container.className = 'fixed bottom-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-[92vw] sm:max-w-sm pointer-events-none';
      document.body.appendChild(container);
      this.container = container;
    } else {
      this.container = document.getElementById('portal-toast-container');
    }

    // 2. Modal Confirm Container
    if (!document.getElementById('portal-confirm-modal')) {
      const modal = document.createElement('div');
      modal.id = 'portal-confirm-modal';
      modal.className = 'fixed inset-0 z-[10000] hidden flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md transition-all duration-300';
      modal.innerHTML = `
        <div id="portal-confirm-card" class="glass-card w-full max-w-sm p-6 sm:p-8 rounded-[2rem] border-2 border-slate-700/50 shadow-[0_0_50px_rgba(0,0,0,0.5)] space-y-6 transform scale-90 opacity-0 transition-all duration-300">
          <div class="flex flex-col items-center text-center gap-4">
            <div id="portal-confirm-icon" class="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 border-2 border-cyan-500/20 flex items-center justify-center text-2xl shadow-inner">
              <i class="fa-solid fa-circle-question"></i>
            </div>
            <div class="space-y-2">
              <h3 id="portal-confirm-title" class="text-lg sm:text-xl font-black text-white tracking-tight">Konfirmasi</h3>
              <p id="portal-confirm-msg" class="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium"></p>
            </div>
          </div>
          <div class="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button id="btn-portal-confirm-cancel" class="w-full sm:flex-1 px-6 py-3 bg-slate-900 hover:bg-slate-800 border-2 border-slate-800 text-slate-300 rounded-2xl text-xs font-black transition-all active:scale-95">
              BATAL
            </button>
            <button id="btn-portal-confirm-ok" class="w-full sm:flex-1 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-2xl text-xs font-black transition-all shadow-xl shadow-cyan-500/20 active:scale-95">
              SETUJU
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      this.modalContainer = modal;
    } else {
      this.modalContainer = document.getElementById('portal-confirm-modal');
    }
  }

  show(message, type = 'info', duration = 3500) {
    this.ensureContainers();
    if (!this.container) return;

    const toast = document.createElement('div');
    toast.className = 'portal-toast pointer-events-auto flex items-center gap-4 p-4 rounded-2xl border-2 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] transition-all duration-500 translate-x-10 opacity-0 text-[13px] font-bold tracking-tight';

    let bgClass = 'bg-slate-900/90 border-cyan-500/30 text-white';
    let iconClass = 'fa-solid fa-circle-info text-cyan-400';

    if (type === 'success') {
      bgClass = 'bg-slate-900/90 border-emerald-500/30 text-white';
      iconClass = 'fa-solid fa-circle-check text-emerald-400';
    } else if (type === 'error') {
      bgClass = 'bg-slate-900/90 border-rose-500/30 text-white';
      iconClass = 'fa-solid fa-triangle-exclamation text-rose-400';
    } else if (type === 'warning') {
      bgClass = 'bg-slate-900/90 border-amber-500/30 text-white';
      iconClass = 'fa-solid fa-circle-exclamation text-amber-400';
    }

    toast.className += ` ${bgClass}`;
    toast.innerHTML = `
      <div class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
        <i class="${iconClass} text-lg"></i>
      </div>
      <span class="flex-1">${message}</span>
      <button class="text-slate-500 hover:text-white transition-colors p-1 cursor-pointer shrink-0" onclick="this.parentElement.style.opacity='0';this.parentElement.style.transform='translateX(20px)';setTimeout(()=>this.parentElement.remove(),300)">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    this.container.appendChild(toast);

    // Animasi Masuk (Slide from Right)
    requestAnimationFrame(() => {
      toast.classList.remove('translate-x-10', 'opacity-0');
      toast.classList.add('translate-x-0', 'opacity-100');
    });

    // Auto Remove
    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-3', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  confirm({ title = 'Konfirmasi Tindakan', message = 'Apakah Anda yakin?', icon = 'fa-circle-question', confirmText = 'Ya, Lanjutkan', cancelText = 'Batal', type = 'info' } = {}) {
    this.ensureContainers();
    if (!this.modalContainer) return Promise.resolve(false);

    const card = document.getElementById('portal-confirm-card');
    const titleEl = document.getElementById('portal-confirm-title');
    const msgEl = document.getElementById('portal-confirm-msg');
    const iconEl = document.getElementById('portal-confirm-icon');
    const btnCancel = document.getElementById('btn-portal-confirm-cancel');
    const btnOk = document.getElementById('btn-portal-confirm-ok');

    titleEl.innerText = title;
    msgEl.innerHTML = message;
    btnCancel.innerText = cancelText;
    btnOk.innerText = confirmText;

    if (type === 'danger') {
      iconEl.className = 'w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border-2 border-rose-500/20 flex items-center justify-center text-2xl shadow-inner';
      btnOk.className = 'w-full sm:flex-1 px-6 py-3 bg-rose-500 hover:bg-rose-400 text-white rounded-2xl text-xs font-black transition-all shadow-xl shadow-rose-500/20 active:scale-95';
    } else {
      iconEl.className = 'w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 border-2 border-cyan-500/20 flex items-center justify-center text-2xl shadow-inner';
      btnOk.className = 'w-full sm:flex-1 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-2xl text-xs font-black transition-all shadow-xl shadow-cyan-500/20 active:scale-95';
    }

    iconEl.innerHTML = `<i class="fa-solid ${icon}"></i>`;

    this.modalContainer.classList.remove('hidden');
    requestAnimationFrame(() => {
      card.classList.remove('scale-90', 'opacity-0');
      card.classList.add('scale-100', 'opacity-100');
    });

    return new Promise((resolve) => {
      const cleanup = (result) => {
        card.classList.remove('scale-100', 'opacity-100');
        card.classList.add('scale-90', 'opacity-0');
        setTimeout(() => {
          this.modalContainer.classList.add('hidden');
          resolve(result);
        }, 300);
      };

      btnOk.onclick = () => cleanup(true);
      btnCancel.onclick = () => cleanup(false);
      this.modalContainer.onclick = (e) => {
        if (e.target === this.modalContainer) cleanup(false);
      };
    });
  }
}

export const toast = new ToastManager();
export const showToast = (msg, type, duration) => toast.show(msg, type, duration);
export const showConfirm = (options) => toast.confirm(options);
