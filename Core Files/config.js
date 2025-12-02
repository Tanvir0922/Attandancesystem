// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBA9ojaCwSYg0f5ZhhrtBHet1mlnZlnxnQ",
  authDomain: "attendancetrack-4b412.firebaseapp.com",
  projectId: "attendancetrack-4b412",
  storageBucket: "attendancetrack-4b412.firebasestorage.app",
  messagingSenderId: "414050011727",
  appId: "1:414050011727:web:beb13bf93711a48835383a",
  measurementId: "G-QL186YT46X",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
