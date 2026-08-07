// assets/js/auth-guard.js
import { firebaseConfig } from "./config/firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Sembunyikan elemen body sementara sebelum verifikasi selesai agar UI tidak 'flashing'
document.documentElement.style.display = "none";

onAuthStateChanged(auth, (user) => {
  if (!user) {
    // Jika tidak ada user terautentikasi, alihkan ke halaman login admin
    alert("Akses ditolak! Anda harus login terlebih dahulu.");
    window.location.href = "../admin.html"; // Sesuaikan path jika berada di sub-folder
  } else {
    // Jika terautentikasi, tampilkan kembali halaman
    document.documentElement.style.display = "block";
  }
});
