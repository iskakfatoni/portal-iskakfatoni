// assets/js/siswa/siswa-login.js
// 👨‍🎓 SISWA AUTHENTICATION: NIS VERIFICATION & PERSISTENT SESSION

import { db } from "../config/firebase-config.js";
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const dom = {
  formLogin: document.getElementById('form-login'),
  inputNis: document.getElementById('nis'),
  alertError: document.getElementById('alert-error'),
  errorMessage: document.getElementById('error-message'),
  btnSubmit: document.getElementById('btn-submit'),
  btnText: document.getElementById('btn-text'),
  btnSpinner: document.getElementById('btn-spinner')
};

// 1. CEK SESI LOKAL SEBELUM FORM DIMUAT
document.addEventListener('DOMContentLoaded', () => {
  const existingSession = localStorage.getItem('siswa_session');
  if (existingSession) {
    try {
      const dataSiswa = JSON.parse(existingSession);
      if (dataSiswa && dataSiswa.nis) {
        window.location.href = 'scanner.html';
      }
    } catch (e) {
      localStorage.removeItem('siswa_session');
    }
  }
});

// 2. HELPER UI CONTROLLER
function setLoading(isLoading) {
  if (!dom.btnSubmit || !dom.btnText || !dom.btnSpinner || !dom.alertError) return;
  if (isLoading) {
    dom.btnSubmit.disabled = true;
    dom.btnText.innerText = "Memverifikasi...";
    dom.btnSpinner.classList.remove('hidden');
    dom.alertError.classList.add('hidden');
  } else {
    dom.btnSubmit.disabled = false;
    dom.btnText.innerText = "Masuk ke Portal";
    dom.btnSpinner.classList.add('hidden');
  }
}

function showError(msg) {
  if (!dom.errorMessage || !dom.alertError) return;
  dom.errorMessage.innerText = msg;
  dom.alertError.classList.remove('hidden');
}

// 3. PROSES VERIFIKASI NIS SAAT SUBMIT
if (dom.formLogin) {
  dom.formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nisInput = dom.inputNis ? dom.inputNis.value.trim() : '';

    if (!nisInput) {
      showError("Silakan masukkan NIS Anda.");
      return;
    }

    setLoading(true);

    try {
      const docRef = doc(db, "siswa", nisInput);
      let docSnap = await getDoc(docRef);
      
      let dataSiswa = null;

      if (docSnap.exists()) {
        dataSiswa = docSnap.data();
        dataSiswa.nis = docSnap.id;
      } else {
        const q = query(collection(db, "siswa"), where("nis", "==", nisInput));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const firstDoc = querySnapshot.docs[0];
          dataSiswa = firstDoc.data();
          dataSiswa.nis = firstDoc.data().nis || firstDoc.id;
        }
      }

      if (dataSiswa) {
        const sessionPayload = {
          id_siswa: dataSiswa.id_siswa || dataSiswa.nis,
          nis: dataSiswa.nis,
          nama: dataSiswa.nama_siswa || dataSiswa.nama || "Siswa",
          id_kelas: dataSiswa.id_kelas || "-",
          nama_kelas: dataSiswa.nama_kelas || "-",
          logged_at: new Date().toISOString()
        };

        localStorage.setItem('siswa_session', JSON.stringify(sessionPayload));

        if (dom.btnText) dom.btnText.innerText = "Login Berhasil!";
        setTimeout(() => {
          window.location.href = 'scanner.html';
        }, 500);

      } else {
        setLoading(false);
        showError(`NIS '${nisInput}' tidak terdaftar di sistem. Hubungi guru pengajar.`);
      }

    } catch (error) {
      console.error("Firestore Auth Error:", error);
      setLoading(false);
      showError("Gagal terhubung ke server. Periksa koneksi internet Anda.");
    }
  });
}
