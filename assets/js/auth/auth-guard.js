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
  document.documentElement.style.display = "";
  document.documentElement.style.opacity = "1";
  document.documentElement.style.pointerEvents = "auto";
  document.documentElement.classList.remove("auth-guard");
}

function redirectToLogin(redirectPath = DEFAULT_REDIRECT_PATH) {
  revealPage();
  showToast("Akses ditolak! Silakan login di Admin Hub terlebih dahulu.", "error");
  setTimeout(() => {
    window.location.href = redirectPath;
  }, 800);
}

export function initializeAuthGuard({
  redirectTo = DEFAULT_REDIRECT_PATH,
  onAuthenticated = null,
  onUnauthenticated = null
} = {}) {
  document.documentElement.classList.add("auth-guard");

  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      revealPage();
      if (onAuthenticated) onAuthenticated(user);
      return;
    }

    // Jika belum login via Firebase Auth, arahkan ke login
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
