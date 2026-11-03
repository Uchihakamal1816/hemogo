import { initializeApp, getApps, getApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { getAnalytics, isSupported } from 'firebase/analytics';

export const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (useEmulators ? 'demo-key' : ''),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'hemogo-emergency.firebaseapp.com',
  projectId: useEmulators ? 'demo-hemogo' : import.meta.env.VITE_FIREBASE_PROJECT_ID || 'hemogo-emergency',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'hemogo-emergency.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '178128292194',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:178128292194:web:597686eb9b6b12655d443b',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-GZ7LDF9SE6'
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey);

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig.apiKey ? firebaseConfig : { ...firebaseConfig, apiKey: 'unconfigured' });
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'asia-south1');

if (useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  auth.settings.appVerificationDisabledForTesting = true;
} else if (isFirebaseConfigured && typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) getAnalytics(app);
  }).catch(() => {});
}
