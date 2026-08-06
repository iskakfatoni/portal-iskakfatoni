// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAR_9SDtOM-SGjQywqd-oXmajgroAhFBfw",
  authDomain: "portal-guru-jetis-36d41.firebaseapp.com",
  projectId: "portal-guru-jetis-36d41",
  storageBucket: "portal-guru-jetis-36d41.firebasestorage.app",
  messagingSenderId: "339557702349",
  appId: "1:339557702349:web:740cdd828375299561a784",
  measurementId: "G-K0DED36NSS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
