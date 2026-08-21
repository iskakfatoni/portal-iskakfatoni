// assets/js/admin/admin-auth.js
// 🔐 MASTER ADMIN AUTHENTICATION & HARDWARE DEVICE BINDING ENGINE

import { auth, db } from "../config/firebase-config.js";
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut, 
  setPersistence, 
  browserLocalPersistence 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp, 
  updateDoc 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getHardwareFingerprint } from "../utils/device-fingerprint.js";
import { showToast, showConfirm } from "../utils/toast.js";

const dom = {
  sectionLogin: document.getElementById('section-login-admin'),
  sectionDashboard: document.getElementById('section-dashboard-admin'),
  loginForm: document.getElementById('login-form'),
  loginEmail: document.getElementById('login-email'),
  loginPassword: document.getElementById('login-password'),
  btnLogin: document.getElementById('btn-login'),
  btnText: document.getElementById('btn-text'),
  errorMsg: document.getElementById('error-msg'),
  userEmailDisplay: document.getElementById('user-email-display'),
  btnLogout: document.getElementById('btn-logout'),

  currentDeviceIcon: document.getElementById('current-device-icon'),
  currentDeviceName: document.getElementById('current-device-name'),
  currentDeviceBadge: document.getElementById('current-device-badge'),
  currentDeviceId: document.getElementById('current-device-id'),
  btnBindDevice: document.getElementById('btn-bind-device'),
  adminDevicesList: document.getElementById('admin-devices-list'),
  devicesCountBadge: document.getElementById('devices-count-badge')
};

let currentHwFingerprint = null;
let isCurrentDeviceBound = false;
let activeAdminEmail = "";
let unsubscribeDevices = null;

function detectDeviceType() {
  const ua = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua));
  
  let os = "Desktop";
  if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/Macintosh|Mac OS X/i.test(ua)) os = "Mac";
  else if (/Linux/i.test(ua)) os = "Linux";

  let browser = "Browser";
  if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = "Chrome";
  else if (/Edg/i.test(ua)) browser = "Edge";
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/Firefox/i.test(ua)) browser = "Firefox";

  const deviceTypeName = isMobile ? `📱 ${os} (${browser})` : `💻 ${os} (${browser})`;
  const iconClass = isMobile ? 'fa-solid fa-mobile-screen-button' : 'fa-solid fa-laptop';

  return { isMobile, os, browser, name: deviceTypeName, icon: iconClass };
}

const deviceType = detectDeviceType();

// 1. INSIALISASI PERANGKAT & CEK DEVICE BINDING AUTO-LOGIN
document.addEventListener('DOMContentLoaded', async () => {
  try {
    currentHwFingerprint = await getHardwareFingerprint();
    if (dom.currentDeviceId) dom.currentDeviceId.innerText = currentHwFingerprint;
    if (dom.currentDeviceName) dom.currentDeviceName.innerText = deviceType.name;
    if (dom.currentDeviceIcon) dom.currentDeviceIcon.className = `${deviceType.icon} device-bind-icon`;

    // Cek apakah perangkat ini terikat di Firestore
    const deviceRef = doc(db, "admin_devices", currentHwFingerprint);
    const docSnap = await getDoc(deviceRef);

    if (docSnap.exists() && docSnap.data().is_active === true) {
      const data = docSnap.data();
      isCurrentDeviceBound = true;
      activeAdminEmail = data.admin_email || "admin@bound-device";
      
      renderDeviceBindStatus(true);
      
      // Jika Firebase Auth belum terautentikasi, izinkan auto-login instant perangkat terikat
      if (!auth.currentUser) {
        if (dom.userEmailDisplay) dom.userEmailDisplay.innerText = `${activeAdminEmail} (Perangkat Terikat)`;
        if (dom.sectionLogin) dom.sectionLogin.classList.add('hidden');
        if (dom.sectionDashboard) dom.sectionDashboard.classList.remove('hidden');
        updateDoc(deviceRef, { last_login: serverTimestamp() }).catch(() => {});
        listenAdminDevices();
      }
    } else {
      renderDeviceBindStatus(false);
    }
  } catch (err) {
    console.error("Gagal mendeteksi device binding:", err);
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    activeAdminEmail = user.email;
    if (dom.sectionLogin) dom.sectionLogin.classList.add('hidden');
    if (dom.sectionDashboard) dom.sectionDashboard.classList.remove('hidden');
    if (dom.userEmailDisplay) dom.userEmailDisplay.innerText = user.email;
    listenAdminDevices();
    checkCurrentDeviceBindStatus();
  } else if (!isCurrentDeviceBound) {
    if (dom.sectionLogin) dom.sectionLogin.classList.remove('hidden');
    if (dom.sectionDashboard) dom.sectionDashboard.classList.add('hidden');
  }
});

async function checkCurrentDeviceBindStatus() {
  if (!currentHwFingerprint) return;
  try {
    const deviceRef = doc(db, "admin_devices", currentHwFingerprint);
    const docSnap = await getDoc(deviceRef);
    if (docSnap.exists() && docSnap.data().is_active === true) {
      isCurrentDeviceBound = true;
      renderDeviceBindStatus(true);
    } else {
      isCurrentDeviceBound = false;
      renderDeviceBindStatus(false);
    }
  } catch (e) {}
}

function renderDeviceBindStatus(isBound) {
  if (!dom.currentDeviceBadge || !dom.btnBindDevice) return;
  if (isBound) {
    dom.currentDeviceBadge.className = 'badge-pill badge-pill--active';
    dom.currentDeviceBadge.innerText = 'Terikat 🟢';
    dom.btnBindDevice.className = 'btn-bind-action is-bound';
    dom.btnBindDevice.innerHTML = '<i class="fa-solid fa-link-slash"></i> Lepas Ikat Perangkat Ini';
    if (dom.btnLogout) dom.btnLogout.classList.add('hidden');
  } else {
    dom.currentDeviceBadge.className = 'badge-pill badge-pill--muted';
    dom.currentDeviceBadge.innerText = 'Belum Terikat ⚪';
    dom.btnBindDevice.className = 'btn-bind-action';
    dom.btnBindDevice.innerHTML = '<i class="fa-solid fa-shield-cat"></i> Ikat Perangkat Ini';
    if (dom.btnLogout) dom.btnLogout.classList.remove('hidden');
  }
}

// 2. HANDLER TOMBOL BIND / UNBIND PERANGKAT
if (dom.btnBindDevice) {
  dom.btnBindDevice.addEventListener('click', async () => {
    if (!currentHwFingerprint) return;
    dom.btnBindDevice.disabled = true;

    try {
      const deviceRef = doc(db, "admin_devices", currentHwFingerprint);

      if (isCurrentDeviceBound) {
        const confirmed = await showConfirm({
          title: 'Lepas Ikatan Perangkat',
          message: 'Apakah Anda yakin ingin melepas ikat perangkat ini? Anda perlu login password manual di perangkat ini selanjutnya.',
          icon: 'fa-link-slash',
          confirmText: 'Ya, Lepas Ikat',
          type: 'danger'
        });

        if (confirmed) {
          await deleteDoc(deviceRef);
          isCurrentDeviceBound = false;
          renderDeviceBindStatus(false);
          showToast("Ikat perangkat berhasil dilepas.", "info");
        }
      } else {
        const emailToBind = activeAdminEmail || (auth.currentUser ? auth.currentUser.email : "admin@portal");
        await setDoc(deviceRef, {
          device_id: currentHwFingerprint,
          device_name: deviceType.name,
          is_mobile: deviceType.isMobile,
          admin_email: emailToBind,
          is_active: true,
          user_agent: navigator.userAgent,
          bound_at: serverTimestamp(),
          last_login: serverTimestamp()
        });
        isCurrentDeviceBound = true;
        renderDeviceBindStatus(true);
        showToast("📱 Perangkat berhasil diikat! Selanjutnya auto-login tanpa password di HP ini.", "success");
      }
    } catch (err) {
      console.error("Gagal mengubah status binding:", err);
      showToast("Gagal memperbarui status pengikatan: " + err.message, "error");
    } finally {
      dom.btnBindDevice.disabled = false;
    }
  });
}

// 3. LISTEN REALTIME LIST DAFTAR PERANGKAT ADMIN
function listenAdminDevices() {
  if (unsubscribeDevices || !dom.adminDevicesList) return;
  const qDevices = query(collection(db, "admin_devices"), orderBy("last_login", "desc"));
  unsubscribeDevices = onSnapshot(qDevices, (snapshot) => {
    dom.adminDevicesList.innerHTML = '';
    let totalCount = 0;

    snapshot.forEach((docSnap) => {
      totalCount++;
      const data = docSnap.data();
      const devId = docSnap.id;
      const isThisDevice = devId === currentHwFingerprint;

      const lastLoginStr = data.last_login && data.last_login.toDate ? data.last_login.toDate().toLocaleString('id-ID') : 'Baru saja';

      const card = document.createElement('div');
      card.className = 'device-card-item';
      card.innerHTML = `
        <div class="device-item-left">
          <div class="device-item-icon">
            <i class="${data.is_mobile ? 'fa-solid fa-mobile-screen-button' : 'fa-solid fa-laptop'}"></i>
          </div>
          <div class="device-item-details">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="device-item-name">${data.device_name || 'Perangkat Admin'}</span>
              ${isThisDevice ? '<span class="badge-pill badge-pill--accent">Ponsel Ini</span>' : '<span class="badge-pill badge-pill--active">Terikat</span>'}
            </div>
            <p class="device-item-sub">HW: ${devId} • ${data.admin_email || 'admin'}</p>
            <p class="device-item-time">Login Terakhir: ${lastLoginStr}</p>
          </div>
        </div>
        <button class="btn-revoke-device" data-id="${devId}">
          <i class="fa-solid fa-trash-can"></i> Cabut
        </button>
      `;

      const btnRevoke = card.querySelector('.btn-revoke-device');
      btnRevoke.addEventListener('click', async () => {
        const confirmed = await showConfirm({
          title: 'Cabut Akses Perangkat',
          message: `Cabut akses auto-login untuk perangkat <strong>${data.device_name || devId}</strong>?`,
          icon: 'fa-trash-can',
          confirmText: 'Ya, Cabut Akses',
          type: 'danger'
        });

        if (confirmed) {
          try {
            await deleteDoc(doc(db, "admin_devices", devId));
            if (isThisDevice) {
              isCurrentDeviceBound = false;
              renderDeviceBindStatus(false);
            }
            showToast("Akses perangkat berhasil dicabut.", "info");
          } catch (err) {
            showToast("Gagal mencabut akses perangkat: " + err.message, "error");
          }
        }
      });

      dom.adminDevicesList.appendChild(card);
    });

    if (dom.devicesCountBadge) dom.devicesCountBadge.innerText = `${totalCount} Perangkat`;

    if (totalCount === 0) {
      dom.adminDevicesList.innerHTML = '<p class="muted-note">// Belum ada perangkat admin yang diikat.</p>';
    }
  });
}

if (dom.loginForm) {
  dom.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = dom.loginEmail.value.trim();
    const pass = dom.loginPassword.value.trim();
    hideError();
    setLoading(true);

    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email, pass);
      showToast("Berhasil login sebagai Super Admin!", "success");
    } catch (err) {
      console.error("Login Error:", err);
      showError("Login gagal: Email atau password salah!");
      showToast("Email atau password tidak sesuai.", "error");
    } finally {
      setLoading(false);
    }
  });
}

if (dom.btnLogout) {
  dom.btnLogout.addEventListener('click', async () => {
    const confirmed = await showConfirm({
      title: 'Konfirmasi Keluar',
      message: 'Apakah Anda yakin ingin keluar dari Master Admin?',
      icon: 'fa-right-from-bracket',
      confirmText: 'Ya, Keluar'
    });

    if (confirmed) {
      await signOut(auth);
      window.location.reload();
    }
  });
}

function showError(msg) { 
  if (!dom.errorMsg) return;
  dom.errorMsg.innerText = msg; 
  dom.errorMsg.classList.remove('hidden'); 
}

function hideError() { 
  if (!dom.errorMsg) return;
  dom.errorMsg.innerText = ''; 
  dom.errorMsg.classList.add('hidden'); 
}

function setLoading(isLoading) {
  if (!dom.btnLogin || !dom.btnText) return;
  if (isLoading) { 
    dom.btnLogin.disabled = true; 
    dom.btnText.innerText = "Memverifikasi..."; 
  } else { 
    dom.btnLogin.disabled = false; 
    dom.btnText.innerText = "Masuk Master Dashboard"; 
  }
}
