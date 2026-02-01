import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyC-_ZmW6ctI0Yf0AJ-WCnAqSrwSGpoOpk4",
    authDomain: "tingo-bingo.firebaseapp.com",
    projectId: "tingo-bingo",
    storageBucket: "tingo-bingo.firebasestorage.app",
    messagingSenderId: "822890815272",
    appId: "1:822890815272:web:7815bb23323744652f7a1d",
    measurementId: "G-J5ZQ5YF45Z"
};

// Initialize Firebase (Singleton to avoid hydration errors)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// ✅ Firebase Auth Only (Spark Plan - Free for 50K MAU)
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Force Google to show account picker every time (allows switching accounts)
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

// ❌ Firestore removed - migrated to Supabase for database
// ❌ Storage removed - using Cloudinary for media storage
// This reduces bundle size by ~35KB
