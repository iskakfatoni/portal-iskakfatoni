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
      modal.className = 'fixed inset-0 z-[10000] hidden flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-all duration-300';
      modal.innerHTML = `
        <div id="portal-confirm-card" class="glass-card w-full max-w-md p-5 sm:p-6 rounded-2xl border border-slate-700/80 shadow-2xl space-y-4 transform scale-95 opacity-0 transition-all duration-200">
          <div class="flex items-start gap-3">
            <div id="portal-confirm-icon" class="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-lg shrink-0">
              <i class="fa-solid fa-circle-question"></i>
            </div>
            <div class="space-y-1 min-w-0 flex-1">
              <h3 id="portal-confirm-title" class="text-sm sm:text-base font-extrabold text-white tracking-wide">Konfirmasi Tindakan</h3>
              <p id="portal-confirm-msg" class="text-xs text-slate-300 leading-relaxed font-mono">Apakah Anda yakin ingin melanjutkan?</p>
            </div>
          </div>
          <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button id="btn-portal-confirm-cancel" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer">
              Batal
            </button>
            <button id="btn-portal-confirm-ok" class="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-bold transition cursor-pointer shadow-lg shadow-cyan-500/20">
              Ya, Lanjutkan
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
    toast.className = 'pointer-events-auto flex items-center gap-3 p-3.5 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 translate-y-3 opacity-0 text-xs font-mono';

    let bgClass = 'bg-slate-900/95 border-cyan-500/40 text-cyan-200';
    let iconClass = 'fa-solid fa-circle-info text-cyan-400';

    if (type === 'success') {
      bgClass = 'bg-slate-900/95 border-emerald-500/40 text-emerald-200';
      iconClass = 'fa-solid fa-circle-check text-emerald-400';
    } else if (type === 'error') {
      bgClass = 'bg-slate-900/95 border-rose-500/40 text-rose-200';
      iconClass = 'fa-solid fa-triangle-exclamation text-rose-400';
    } else if (type === 'warning') {
      bgClass = 'bg-slate-900/95 border-amber-500/40 text-amber-200';
      iconClass = 'fa-solid fa-circle-exclamation text-amber-400';
    }

    toast.className += ` ${bgClass}`;
    toast.innerHTML = `
      <i class="${iconClass} text-base shrink-0"></i>
      <span class="flex-1 leading-snug">${message}</span>
      <button class="text-slate-400 hover:text-white transition p-1 cursor-pointer shrink-0" onclick="this.parentElement.remove()">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    this.container.appendChild(toast);

    // Animasi Masuk
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-3', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
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
      iconEl.className = 'w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center text-lg shrink-0';
      btnOk.className = 'px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-lg shadow-rose-500/20';
    } else {
      iconEl.className = 'w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-lg shrink-0';
      btnOk.className = 'px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-bold transition cursor-pointer shadow-lg shadow-cyan-500/20';
    }

    iconEl.innerHTML = `<i class="fa-solid ${icon}"></i>`;

    this.modalContainer.classList.remove('hidden');
    requestAnimationFrame(() => {
      card.classList.remove('scale-95', 'opacity-0');
      card.classList.add('scale-100', 'opacity-100');
    });

    return new Promise((resolve) => {
      const cleanup = (result) => {
        card.classList.remove('scale-100', 'opacity-100');
        card.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
          this.modalContainer.classList.add('hidden');
          resolve(result);
        }, 200);
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
