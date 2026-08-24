// assets/js/auth/auth-guard.js
import { auth, db } from "../config/firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, serverTimestamp, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getHardwareFingerprint } from "../utils/device-fingerprint.js";
import { showToast } from "../utils/toast.js";

function getDefaultRedirectPath() {
  return window.location.pathname.includes('/pages/') ? '../../admin.html' : '../admin.html';
}

const DEFAULT_REDIRECT_PATH = getDefaultRedirectPath();

function revealPage() {
  document.documentElement.style.display = "block";
  document.documentElement.classList.remove("auth-guard");
}

function redirectToLogin(redirectPath = DEFAULT_REDIRECT_PATH) {
  showToast("Akses ditolak! Anda harus login atau mengikat perangkat terlebih dahulu.", "error");
  setTimeout(() => {
    window.location.href = redirectPath;
  }, 1200);
}

export function initializeAuthGuard({
  redirectTo = DEFAULT_REDIRECT_PATH,
  onAuthenticated = null,
  onUnauthenticated = null
} = {}) {
  document.documentElement.style.display = "none";
  document.documentElement.classList.add("auth-guard");

  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      revealPage();
      if (onAuthenticated) onAuthenticated(user);
      return;
    }

    // Jika user belum login via Firebase Auth, cek status Hardware Device Binding
    try {
      const hwId = await getHardwareFingerprint();
      const deviceRef = doc(db, "admin_devices", hwId);
      const docSnap = await getDoc(deviceRef);

      if (docSnap.exists() && docSnap.data().is_active === true) {
        const data = docSnap.data();
        revealPage();
        // Update timestamp login terakhir
        updateDoc(deviceRef, { last_login: serverTimestamp() }).catch(() => {});
        if (onAuthenticated) {
          onAuthenticated({
            email: data.admin_email || "admin@portal",
            isBoundDevice: true,
            deviceId: hwId,
            deviceName: data.device_name || "Bound Device"
          });
        }
        return;
      }
    } catch (err) {
      console.warn("[AuthGuard] Gagal memeriksa status device binding:", err);
    }

    if (onUnauthenticated) {
      onUnauthenticated();
    } else {
      redirectToLogin(redirectTo);
    }
  });
}

export function requireAuthSession(options = {}) {
  return initializeAuthGuard(options);
}
