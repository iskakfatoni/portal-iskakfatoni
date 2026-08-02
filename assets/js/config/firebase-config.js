// Import Firebase SDK v10 (ES Modules) langsung dari CDN gstatic
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

/**
/ Kredensial Konfigurasi Firebase Project Anda
/ Ganti nilai string di bawah sesuai dengan nilai dari Firebase Console:
/ Project Settings -> General -> Your apps -> Web app -> SDK setup/configuration
*/
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "portal-iskakfatoni.firebaseapp.com",
  projectId: "portal-iskakfatoni",
  storageBucket: "portal-iskakfatoni.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

// Inisialisasi Firebase App Core
const app = initializeApp(firebaseConfig);

// Inisialisasi Layanan Firestore & Authentication
export const db = getFirestore(app);
export const auth = getAuth(app);

// Export default app instance
export default app;
