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
    if (typeof document === 'undefined') return;

    // 1. Toast Container
    let container = document.getElementById('portal-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'portal-toast-container';
      container.className = 'portal-toast-container-root fixed bottom-6 right-6 z-[20000] flex flex-col gap-3 max-w-[92vw] sm:max-w-sm pointer-events-none';
      document.body.appendChild(container);
    }
    this.container = container;

    // 2. Modal Confirm Container
    let modal = document.getElementById('portal-confirm-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'portal-confirm-modal';
      modal.className = 'portal-confirm-modal-root hidden fixed inset-0 z-[20001] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md transition-all duration-300';
      modal.innerHTML = `
        <div id="portal-confirm-card" class="portal-confirm-card glass-card w-full max-w-sm p-8 rounded-[2.5rem] border-2 border-slate-700/50 shadow-[0_0_80px_rgba(0,0,0,0.6)] space-y-6 transform scale-90 opacity-0 transition-all duration-300">
          <div class="portal-confirm-body flex flex-col items-center text-center gap-5">
            <div id="portal-confirm-icon" class="portal-confirm-icon portal-confirm-icon-cyan w-20 h-20 rounded-3xl bg-cyan-500/10 text-cyan-400 border-2 border-cyan-500/20 flex items-center justify-center text-3xl shadow-inner">
              <i class="fa-solid fa-circle-question"></i>
            </div>
            <div class="portal-confirm-text space-y-2">
              <h3 id="portal-confirm-title" class="portal-confirm-title text-xl font-black text-white tracking-tight">KONFIRMASI</h3>
              <p id="portal-confirm-msg" class="portal-confirm-msg text-sm text-slate-400 leading-relaxed font-medium"></p>
            </div>
          </div>
          <div class="portal-confirm-actions flex flex-col sm:flex-row items-center gap-4 pt-2">
            <button id="btn-portal-confirm-cancel" class="portal-confirm-btn portal-confirm-btn-cancel w-full sm:flex-1 px-6 py-4 bg-slate-900 hover:bg-slate-800 border-2 border-slate-800 text-slate-300 rounded-2xl text-xs font-black transition-all active:scale-95 cursor-pointer">
              BATAL
            </button>
            <button id="btn-portal-confirm-ok" class="portal-confirm-btn portal-confirm-btn-ok w-full sm:flex-1 px-6 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-2xl text-xs font-black transition-all shadow-xl shadow-cyan-500/30 active:scale-95 cursor-pointer">
              SETUJU
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    this.modalContainer = modal;

    // 3. Modal Prompt Container
    let promptModal = document.getElementById('portal-prompt-modal');
    if (!promptModal) {
      promptModal = document.createElement('div');
      promptModal.id = 'portal-prompt-modal';
      promptModal.className = 'portal-prompt-modal-root hidden fixed inset-0 z-[20002] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all duration-300';
      promptModal.innerHTML = `
        <div id="portal-prompt-card" class="portal-prompt-card glass-card w-full max-w-sm p-8 rounded-[2.5rem] border-2 border-rose-500/30 shadow-[0_0_80px_rgba(244,63,94,0.3)] space-y-6 transform scale-90 opacity-0 transition-all duration-300">
          <div class="portal-prompt-body flex flex-col items-center text-center gap-4">
            <div id="portal-prompt-icon" class="portal-prompt-icon w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border-2 border-rose-500/20 flex items-center justify-center text-2xl shadow-inner">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div class="portal-prompt-text space-y-2 w-full">
              <h3 id="portal-prompt-title" class="portal-prompt-title text-xl font-black text-white tracking-tight">KONFIRMASI KEAMANAN</h3>
              <p id="portal-prompt-msg" class="portal-prompt-msg text-xs text-slate-400 leading-relaxed font-medium"></p>
            </div>
            <input id="portal-prompt-input" type="text" class="w-full px-4 py-3 bg-slate-900/90 border-2 border-slate-700/60 rounded-xl text-sm font-mono text-center text-rose-300 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-all" />
          </div>
          <div class="portal-prompt-actions flex items-center gap-3 pt-2">
            <button id="btn-portal-prompt-cancel" class="w-1/2 px-5 py-3 bg-slate-900 hover:bg-slate-800 border-2 border-slate-800 text-slate-300 rounded-2xl text-xs font-black transition-all cursor-pointer">
              BATAL
            </button>
            <button id="btn-portal-prompt-ok" class="w-1/2 px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-black transition-all shadow-lg shadow-rose-600/30 cursor-pointer">
              PROSES
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(promptModal);
    }
    this.promptModalContainer = promptModal;
  }

  show(message, type = 'info', duration = 4000) {
    this.ensureContainers();

    const toast = document.createElement('div');
    const typeClass = `portal-toast-${type}`;

    let iconClass = 'fa-solid fa-circle-info';
    if (type === 'success') {
      iconClass = 'fa-solid fa-circle-check';
    } else if (type === 'error') {
      iconClass = 'fa-solid fa-triangle-exclamation';
    } else if (type === 'warning') {
      iconClass = 'fa-solid fa-circle-exclamation';
    }

    toast.className = `portal-toast ${typeClass} pointer-events-auto flex items-center gap-4 p-4 rounded-2xl border-2 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] transition-all duration-500 translate-x-10 opacity-0 text-[13px] font-bold tracking-tight bg-slate-900/90 text-white`;
    toast.innerHTML = `
      <div class="portal-toast-icon-wrap w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
        <i class="${iconClass}"></i>
      </div>
      <span class="portal-toast-content flex-1">${message}</span>
      <button class="portal-toast-close text-slate-500 hover:text-white transition-colors p-1 cursor-pointer shrink-0" title="Tutup">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    const closeBtn = toast.querySelector('.portal-toast-close');
    if (closeBtn) {
      closeBtn.onclick = () => {
        toast.classList.remove('show', 'translate-x-0', 'opacity-100');
        toast.classList.add('hide', 'translate-x-10', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
      };
    }

    this.container.appendChild(toast);

    // Animasi Masuk (Slide in)
    requestAnimationFrame(() => {
      toast.classList.remove('translate-x-10', 'opacity-0');
      toast.classList.add('show', 'translate-x-0', 'opacity-100');
    });

    // Auto Remove
    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.remove('show', 'translate-x-0', 'opacity-100');
        toast.classList.add('hide', 'translate-y-3', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
      }
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
      iconEl.className = 'portal-confirm-icon portal-confirm-icon-danger w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border-2 border-rose-500/20 flex items-center justify-center text-2xl shadow-inner';
      btnOk.className = 'portal-confirm-btn portal-confirm-btn-danger w-full sm:flex-1 px-6 py-3 bg-rose-500 hover:bg-rose-400 text-white rounded-2xl text-xs font-black transition-all shadow-xl shadow-rose-500/20 active:scale-95';
    } else {
      iconEl.className = 'portal-confirm-icon portal-confirm-icon-cyan w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 border-2 border-cyan-500/20 flex items-center justify-center text-2xl shadow-inner';
      btnOk.className = 'portal-confirm-btn portal-confirm-btn-ok w-full sm:flex-1 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-2xl text-xs font-black transition-all shadow-xl shadow-cyan-500/20 active:scale-95';
    }

    iconEl.innerHTML = `<i class="fa-solid ${icon}"></i>`;

    this.modalContainer.classList.remove('hidden', 'portal-confirm-modal-hidden');
    requestAnimationFrame(() => {
      card.classList.remove('scale-90', 'opacity-0');
      card.classList.add('active', 'scale-100', 'opacity-100');
    });

    return new Promise((resolve) => {
      const cleanup = (result) => {
        card.classList.remove('active', 'scale-100', 'opacity-100');
        card.classList.add('scale-90', 'opacity-0');
        setTimeout(() => {
          this.modalContainer.classList.add('hidden', 'portal-confirm-modal-hidden');
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

  prompt({ title = 'Konfirmasi Teks', message = 'Masukkan kata kunci konfirmasi:', placeholder = '', defaultValue = '', confirmText = 'PROSES', cancelText = 'BATAL' } = {}) {
    this.ensureContainers();
    if (!this.promptModalContainer) return Promise.resolve(null);

    const card = document.getElementById('portal-prompt-card');
    const titleEl = document.getElementById('portal-prompt-title');
    const msgEl = document.getElementById('portal-prompt-msg');
    const inputEl = document.getElementById('portal-prompt-input');
    const btnCancel = document.getElementById('btn-portal-prompt-cancel');
    const btnOk = document.getElementById('btn-portal-prompt-ok');

    titleEl.innerText = title;
    msgEl.innerHTML = message;
    inputEl.placeholder = placeholder;
    inputEl.value = defaultValue;
    btnCancel.innerText = cancelText;
    btnOk.innerText = confirmText;

    this.promptModalContainer.classList.remove('hidden');
    requestAnimationFrame(() => {
      card.classList.remove('scale-90', 'opacity-0');
      card.classList.add('scale-100', 'opacity-100');
      inputEl.focus();
    });

    return new Promise((resolve) => {
      const cleanup = (result) => {
        card.classList.remove('scale-100', 'opacity-100');
        card.classList.add('scale-90', 'opacity-0');
        setTimeout(() => {
          this.promptModalContainer.classList.add('hidden');
          resolve(result);
        }, 300);
      };

      btnOk.onclick = () => cleanup(inputEl.value);
      btnCancel.onclick = () => cleanup(null);
      inputEl.onkeydown = (e) => {
        if (e.key === 'Enter') cleanup(inputEl.value);
        if (e.key === 'Escape') cleanup(null);
      };
      this.promptModalContainer.onclick = (e) => {
        if (e.target === this.promptModalContainer) cleanup(null);
      };
    });
  }
}

export const toast = new ToastManager();
export const showToast = (msg, type, duration) => toast.show(msg, type, duration);
export const showConfirm = (options) => toast.confirm(options);
export const showPrompt = (options) => toast.prompt(options);


