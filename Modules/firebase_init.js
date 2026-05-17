// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDqVT2v5LIdq2FDTHSpCNk6zoJVUvWOUpQ",
  authDomain: "tallermemin-5796b.firebaseapp.com",
  projectId: "tallermemin-5796b",
  storageBucket: "tallermemin-5796b.firebasestorage.app",
  messagingSenderId: "588879583805",
  appId: "1:588879583805:web:daa62b810688f593cda854",
  measurementId: "G-C8QBPY3GN0"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore();

export { db };