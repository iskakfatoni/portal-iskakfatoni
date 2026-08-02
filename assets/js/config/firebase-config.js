// assets/js/config/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

export const firebaseConfig = {
  apiKey: "AIzaSyDhq4QoCn00GkfpKXSP8PnvSvEKa2yn0ic",
  authDomain: "portal-iskakfatoni.firebaseapp.com",
  projectId: "portal-iskakfatoni",
  storageBucket: "portal-iskakfatoni.firebasestorage.app",
  messagingSenderId: "367350728822",
  appId: "1:367350728822:web:6b0c6fd4824102d8acf757",
  measurementId: "G-0BNNKQQ24V"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
