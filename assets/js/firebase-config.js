<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyDhq4QoCn00GkfpKXSP8PnvSvEKa2yn0ic",
    authDomain: "portal-iskakfatoni.firebaseapp.com",
    projectId: "portal-iskakfatoni",
    storageBucket: "portal-iskakfatoni.firebasestorage.app",
    messagingSenderId: "367350728822",
    appId: "1:367350728822:web:6b0c6fd4824102d8acf757",
    measurementId: "G-0BNNKQQ24V"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>
