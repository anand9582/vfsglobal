import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBk--yRCK8Nww1aPeoFuVNGGQcIJmki3iE",
  authDomain: "vfs-tracking-8ddbe.firebaseapp.com",
  projectId: "vfs-tracking-8ddbe",
  storageBucket: "vfs-tracking-8ddbe.firebasestorage.app",
  messagingSenderId: "236477429480",
  appId: "1:236477429480:web:775749649e0fd238f77b5d",
  measurementId: "G-VSLX51TY1L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
export default app;

