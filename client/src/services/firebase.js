// src/services/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBAlinjnENDVID5YKENkF3lXgvfTCbY-o4",
  authDomain: "student-resume-f664a.firebaseapp.com",
  projectId: "student-resume-f664a",
  storageBucket: "student-resume-f664a.firebasestorage.app",
  messagingSenderId: "465965708504",
  appId: "1:465965708504:web:34f68b4fa0c655ae7093ad"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app); // ✅ Add Firestore

export { auth, provider, signInWithPopup, db };
