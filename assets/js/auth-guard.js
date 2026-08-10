// assets/js/auth-guard.js
import { auth } from "./config/firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const DEFAULT_REDIRECT_PATH = "../admin.html";

function revealPage() {
  document.documentElement.style.display = "block";
  document.documentElement.classList.remove("auth-guard");
}

function redirectToLogin(redirectPath = DEFAULT_REDIRECT_PATH) {
  alert("Akses ditolak! Anda harus login terlebih dahulu.");
  window.location.href = redirectPath;
}

export function initializeAuthGuard({
  redirectTo = DEFAULT_REDIRECT_PATH,
  onAuthenticated = null,
  onUnauthenticated = null
} = {}) {
  document.documentElement.style.display = "none";
  document.documentElement.classList.add("auth-guard");

  return onAuthStateChanged(auth, (user) => {
    if (!user) {
      if (onUnauthenticated) {
        onUnauthenticated();
      } else {
        redirectToLogin(redirectTo);
      }
      return;
    }

    revealPage();

    if (onAuthenticated) {
      onAuthenticated(user);
    }
  });
}

export function requireAuthSession(options = {}) {
  return initializeAuthGuard(options);
}
