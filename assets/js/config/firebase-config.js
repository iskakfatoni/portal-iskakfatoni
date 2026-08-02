// Import Firebase SDK v10 (ES Modules) langsung dari CDN gstatic
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

/**
/ Kredensial Konfigurasi Firebase Project Anda
/ Ganti nilai string di bawah sesuai dengan nilai dari Firebase Console:
/ Project Settings -> General -> Your apps -> Web app -> SDK setup/configuration
*/
    const firebaseConfig = {
      apiKey: "AIzaSyDhq4QoCn00GkfpKXSP8PnvSvEKa2yn0ic",
      authDomain: "portal-iskakfatoni.firebaseapp.com",
      projectId: "portal-iskakfatoni",
      storageBucket: "portal-iskakfatoni.firebasestorage.app",
      messagingSenderId: "367350728822",
      appId: "1:367350728822:web:6b0c6fd4824102d8acf757",
      measurementId: "G-0BNNKQQ24V"
    };

// Inisialisasi Firebase App Core
const app = initializeApp(firebaseConfig);

// Inisialisasi Layanan Firestore & Authentication
export const db = getFirestore(app);
export const auth = getAuth(app);

// Export default app instance
export default app;
