import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Firebase configuration from environment or fallback defaults
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSy_MOCK_HEMOGO_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "hemogo-emergency.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "hemogo-emergency",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "hemogo-emergency.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "178128292194",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:178128292194:web:597686eb9b6b12655d443b",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-GZ7LDF9SE6"
};

// Check if using placeholder / demo config
export const isDemoMode = !import.meta.env.VITE_FIREBASE_API_KEY || 
  import.meta.env.VITE_FIREBASE_API_KEY.includes('YourFirebase') ||
  import.meta.env.VITE_FIREBASE_API_KEY.includes('MOCK');

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Optional Analytics initialization if supported in browser environment
export let analytics: any = null;
if (typeof window !== 'undefined' && !isDemoMode) {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

console.log(`[HemoGo] Initialized in ${isDemoMode ? 'Interactive Demo / Local' : 'Production Firebase'} mode`);

