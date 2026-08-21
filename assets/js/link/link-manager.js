// assets/js/link/link-manager.js
// 🔗 LINK MANAGER: REAL-TIME PORTAL SWITCH, ANNOUNCEMENT, CRUD & DRAG-DROP ORDERING

import { db } from "../config/firebase-config.js";
import { initializeAuthGuard } from "../auth/auth-guard.js";
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  writeBatch, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { showToast, showConfirm } from "../utils/toast.js";

const dom = {
  userEmailDisplay: document.getElementById('user-email-display'),
  btnLogout: document.getElementById('btn-logout'),
  
  btnTogglePortal: document.getElementById('btn-toggle-portal'),
  toggleIcon: document.getElementById('toggle-icon'),
  toggleText: document.getElementById('toggle-text'),
  portalStatusBadge: document.getElementById('portal-status-badge'),

  inputRunningText: document.getElementById('input-running-text'),
  btnSaveAnnouncement: document.getElementById('btn-save-announcement'),
  
  formAddLink: document.getElementById('form-add-link'),
  inputLinkTitle: document.getElementById('input-link-title'),
  inputLinkUrl: document.getElementById('input-link-url'),
  inputLinkIcon: document.getElementById('input-link-icon'),
  inputLinkActive: document.getElementById('input-link-active'),
  
  linkListContainer: document.getElementById('link-list-container'),
  linkCount: document.getElementById('link-count'),
  reorderStatus: document.getElementById('reorder-status'),

  // Modal Edit
  editLinkModal: document.getElementById('edit-link-modal'),
  formEditLink: document.getElementById('form-edit-link'),
  editLinkId: document.getElementById('edit-link-id'),
  editLinkTitle: document.getElementById('edit-link-title'),
  editLinkUrl: document.getElementById('edit-link-url'),
  editLinkIcon: document.getElementById('edit-link-icon'),
  editLinkActive: document.getElementById('edit-link-active'),
  btnCloseEditModal: document.getElementById('btn-close-edit-modal'),
  btnCancelEdit: document.getElementById('btn-cancel-edit')
};

let currentPortalState = true;
let draggedItem = null;
let isReordering = false;
let unsubscribeLinks = null;

// 🔒 ROUTE GUARD & REALTIME REFRESH RECOVERY
initializeAuthGuard({
  onAuthenticated: (user) => {
    if (dom.userEmailDisplay) dom.userEmailDisplay.innerText = user.email;
    loadPortalStatus();
    loadRunningText();
    
    isReordering = false;
    loadLinksList();
  }
});

// ↩️ KEMBALI KE HUB ADMIN
if (dom.btnLogout) {
  dom.btnLogout.addEventListener('click', () => {
    window.location.href = "../admin.html";
  });
}

// 1. LISTEN & WRITE STATUS PORTAL
function loadPortalStatus() {
  onSnapshot(doc(db, "settings", "portal_status"), (docSnap) => {
    if (docSnap.exists()) {
      currentPortalState = docSnap.data().is_online !== false;
    } else {
      currentPortalState = true;
    }
    updateStatusUI(currentPortalState);
  });
}

if (dom.btnTogglePortal) {
  dom.btnTogglePortal.onclick = async () => {
    const targetState = !currentPortalState;
    updateStatusUI(targetState);

    try {
      await setDoc(doc(db, "settings", "portal_status"), { 
        is_online: targetState, 
        updated_at: serverTimestamp() 
      }, { merge: true });

      currentPortalState = targetState;
      showToast(targetState ? "Portal Publik kini ONLINE" : "Portal Publik beralih ke MAINTENANCE", targetState ? "success" : "warning");
    } catch (err) {
      showToast("Gagal memperbarui status di Firebase: " + err.message, "error");
      updateStatusUI(currentPortalState);
    }
  };
}

function updateStatusUI(isOnline) {
  if (!dom.btnTogglePortal || !dom.toggleIcon || !dom.toggleText || !dom.portalStatusBadge) return;
  if (isOnline) {
    dom.btnTogglePortal.className = "px-4 py-2 bg-emerald-500 hover:opacity-90 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg";
    dom.toggleIcon.className = "fa-solid fa-toggle-on text-base";
    dom.toggleText.innerText = "ON";

    dom.portalStatusBadge.innerText = "PORTAL ON";
    dom.portalStatusBadge.className = "px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
  } else {
    dom.btnTogglePortal.className = "px-4 py-2 bg-red-500 hover:opacity-90 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg";
    dom.toggleIcon.className = "fa-solid fa-toggle-off text-base";
    dom.toggleText.innerText = "OFF";

    dom.portalStatusBadge.innerText = "PORTAL OFF (MAINTENANCE)";
    dom.portalStatusBadge.className = "px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-red-500/15 text-red-400 border border-red-500/30";
  }
}

// 2. RUNNING TEXT
function loadRunningText() {
  if (!dom.inputRunningText) return;
  onSnapshot(doc(db, "settings", "announcement"), (docSnap) => {
    if (docSnap.exists()) {
      dom.inputRunningText.value = docSnap.data().text || '';
    }
  });
}

if (dom.btnSaveAnnouncement && dom.inputRunningText) {
  dom.btnSaveAnnouncement.addEventListener('click', async () => {
    const text = dom.inputRunningText.value.trim();
    try {
      await setDoc(doc(db, "settings", "announcement"), { text, updated_at: serverTimestamp() }, { merge: true });
      showToast("Running text pengumuman berhasil disimpan!", "success");
    } catch (err) {
      showToast("Gagal menyimpan pengumuman: " + err.message, "error");
    }
  });
}

// 3. LISTEN & RENDER DAFTAR LINK TERURUT
function loadLinksList() {
  if (!dom.linkListContainer) return;
  if (unsubscribeLinks) unsubscribeLinks();
  isReordering = false;

  const q = query(collection(db, "links"), orderBy("order", "asc"));
  
  unsubscribeLinks = onSnapshot(q, (snapshot) => {
    if (isReordering) return;

    dom.linkListContainer.innerHTML = '';
    if (dom.linkCount) dom.linkCount.innerText = `${snapshot.size} Link`;

    if (snapshot.empty) {
      dom.linkListContainer.innerHTML = '<p class="text-xs text-slate-500 text-center py-10">// Belum ada link portal yang ditambahkan...</p>';
      return;
    }

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const docId = docSnap.id;
      const isActive = data.is_active !== false;
      const linkIconClass = data.icon || 'fa-solid fa-link'; 

      const item = document.createElement('div');
      item.draggable = true;
      item.dataset.id = docId;
      item.className = `link-drag-item flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border text-xs transition ${isActive ? 'bg-slate-950/90 border-slate-800 hover:border-cyan-500/40 shadow-lg' : 'bg-slate-950/40 border-slate-900 opacity-60'}`;
      
      item.innerHTML = `
        <div class="flex items-center gap-3.5 w-[75%]">
          <div class="drag-handle cursor-grab text-slate-500 hover:text-cyan-400 p-1 shrink-0" title="Geser untuk mengubah urutan">
            <i class="fa-solid fa-grip-vertical text-base"></i>
          </div>
          <input type="checkbox" ${isActive ? 'checked' : ''} class="toggle-active shrink-0 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer w-4 h-4" title="${isActive ? 'Aktif (Klik untuk nonaktifkan)' : 'Nonaktif (Klik untuk aktifkan)'}">
          
          <!-- TAMPILAN ICON LINK -->
          <div class="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-xs">
              <i class="${linkIconClass} text-slate-200"></i>
          </div>

          <div class="space-y-0.5 truncate">
            <p class="font-semibold text-white text-xs sm:text-sm flex items-center gap-2 truncate">
              ${data.title}
              ${!isActive ? '<span class="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 shrink-0">Nonaktif</span>' : ''}
            </p>
            <a href="${data.url}" target="_blank" class="text-cyan-400 font-mono text-[10px] sm:text-[11px] hover:underline block truncate">${data.url}</a>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button class="btn-edit p-2.5 bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 rounded-xl text-xs font-semibold cursor-pointer transition" title="Edit Link">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn-del p-2.5 bg-red-500/15 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold cursor-pointer transition" title="Hapus Link">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `;

      // Handler Checklist Active
      item.querySelector('.toggle-active').onchange = async (e) => {
        const targetState = e.target.checked;
        try {
          await updateDoc(doc(db, "links", docId), { is_active: targetState });
          showToast(`Link "${data.title}" ${targetState ? 'diaktifkan' : 'dinonaktifkan'}.`, "info");
        } catch (err) {
          showToast("Gagal mengubah status aktif link: " + err.message, "error");
          e.target.checked = !targetState;
        }
      };

      // Handler Tombol Edit Modal
      item.querySelector('.btn-edit').onclick = () => {
        if (!dom.editLinkId || !dom.editLinkModal) return;
        dom.editLinkId.value = docId;
        dom.editLinkTitle.value = data.title;
        dom.editLinkUrl.value = data.url;
        dom.editLinkActive.checked = isActive;
        
        if (data.icon && dom.editLinkIcon) {
          dom.editLinkIcon.value = data.icon;
        } else if (dom.editLinkIcon) {
          dom.editLinkIcon.value = 'fa-solid fa-link';
        }

        dom.editLinkModal.classList.remove('hidden');
      };

      // Handler Tombol Hapus
      item.querySelector('.btn-del').onclick = async () => {
        const confirmed = await showConfirm({
          title: 'Hapus Link Portal',
          message: `Hapus link <strong>"${data.title}"</strong> secara permanen?`,
          icon: 'fa-trash',
          confirmText: 'Ya, Hapus',
          type: 'danger'
        });

        if (confirmed) {
          try {
            await deleteDoc(doc(db, "links", docId));
            showToast(`Link "${data.title}" berhasil dihapus.`, "success");
          } catch (err) {
            showToast("Gagal menghapus link: " + err.message, "error");
          }
        }
      };

      // Drag and Drop Event Listeners
      item.addEventListener('dragstart', handleDragStart);
      item.addEventListener('dragover', handleDragOver);
      item.addEventListener('drop', handleDrop);
      item.addEventListener('dragend', handleDragEnd);

      dom.linkListContainer.appendChild(item);
    });
  }, (err) => {
    console.error("Link Listener Error:", err);
    if (dom.linkListContainer) dom.linkListContainer.innerHTML = '<p class="text-xs text-red-400 text-center py-10">❌ Gagal memuat data. Silakan muat ulang halaman.</p>';
  });
}

// HANDLER CLOSE & CANCEL MODAL EDIT
if (dom.btnCloseEditModal) dom.btnCloseEditModal.onclick = () => dom.editLinkModal.classList.add('hidden');
if (dom.btnCancelEdit) dom.btnCancelEdit.onclick = () => dom.editLinkModal.classList.add('hidden');

// SUBMIT FORM EDIT LINK
if (dom.formEditLink) {
  dom.formEditLink.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = dom.editLinkId.value;
    const title = dom.editLinkTitle.value.trim();
    const url = dom.editLinkUrl.value.trim();
    const icon = dom.editLinkIcon.value;
    const isActive = dom.editLinkActive.checked;

    if (!id || !title || !url) return;

    try {
      await updateDoc(doc(db, "links", id), {
        title: title,
        url: url,
        icon: icon,
        is_active: isActive,
        updated_at: serverTimestamp()
      });

      dom.editLinkModal.classList.add('hidden');
      showToast("Link berhasil diperbarui!", "success");
    } catch (err) {
      showToast("Gagal memperbarui link: " + err.message, "error");
    }
  });
}

// HANDLERS DRAG & DROP
function handleDragStart(e) {
  isReordering = true;
  draggedItem = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  
  const targetItem = e.target.closest('.link-drag-item');
  if (targetItem && targetItem !== draggedItem && dom.linkListContainer) {
    const rect = targetItem.getBoundingClientRect();
    const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
    dom.linkListContainer.insertBefore(draggedItem, next ? targetItem.nextSibling : targetItem);
  }
}

async function handleDrop(e) {
  e.stopPropagation();
  return false;
}

async function handleDragEnd() {
  if (draggedItem) {
    draggedItem.classList.remove('dragging');
    draggedItem = null;
  }
  
  await saveNewOrdersToFirestore();
  isReordering = false;
}

// SIMPAN URUTAN MASAL KE FIRESTORE
async function saveNewOrdersToFirestore() {
  if (!dom.reorderStatus || !dom.linkListContainer) return;
  dom.reorderStatus.classList.remove('hidden');
  try {
    const items = dom.linkListContainer.querySelectorAll('.link-drag-item');
    const batch = writeBatch(db);

    items.forEach((item, newIndex) => {
      const docId = item.dataset.id;
      if (docId) {
        batch.update(doc(db, "links", docId), { order: newIndex + 1 });
      }
    });

    await batch.commit();
    dom.reorderStatus.innerText = "✔ Urutan berhasil disimpan!";
    setTimeout(() => dom.reorderStatus.classList.add('hidden'), 2000);
  } catch (err) {
    console.error(err);
    dom.reorderStatus.innerText = "❌ Gagal menyimpan urutan: " + err.message;
  }
}

// FORM TAMBAH LINK BARU
if (dom.formAddLink) {
  dom.formAddLink.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = dom.inputLinkTitle.value.trim();
    const url = dom.inputLinkUrl.value.trim();
    const icon = dom.inputLinkIcon.value;
    const isActive = dom.inputLinkActive.checked;

    if (!title || !url) return;

    try {
      const currentCount = dom.linkListContainer ? dom.linkListContainer.querySelectorAll('.link-drag-item').length : 0;
      
      await addDoc(collection(db, "links"), { 
        title, 
        url,
        icon,
        is_active: isActive,
        order: currentCount + 1,
        created_at: serverTimestamp() 
      });
      
      dom.inputLinkTitle.value = '';
      dom.inputLinkUrl.value = '';
      dom.inputLinkIcon.value = 'fa-solid fa-link';
      dom.inputLinkActive.checked = true;
      showToast("Link baru berhasil ditambahkan!", "success");
    } catch (err) {
      showToast("Gagal menambah link: " + err.message, "error");
    }
  });
}
