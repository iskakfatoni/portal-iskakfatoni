// Configuration Firebase untuk portal-iskakfatoni
// Ganti nilai di bawah ini sesuai dengan Firebase Console Anda:
// Firebase Console > Project Settings > General > Your apps > SDK setup/configuration

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Inisialisasi Firebase jika library CDN sudah dimuat
if (typeof firebase !== 'undefined') {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
} else {
  console.warn("Firebase SDK belum dimuat. Pastikan skrip Firebase CDN dipasang sebelum firebase-config.js.");
}
