import {
  RecaptchaVerifier,
  onAuthStateChanged,
  signInWithPhoneNumber,
  signOut as fbSignOut,
  type ConfirmationResult
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { UserProfile } from '../types/database';

export function initializeRecaptcha(containerId: string = 'recaptcha-container'): RecaptchaVerifier {
  return new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
}

export async function sendOtpToPhone(phoneNumber: string, verifier: RecaptchaVerifier): Promise<ConfirmationResult> {
  return signInWithPhoneNumber(auth, phoneNumber, verifier);
}

export async function verifyPhoneOtp(otp: string, confirmationResult: ConfirmationResult): Promise<void> {
  await confirmationResult.confirm(otp);
}

async function ensureUserProfile(uid: string, phone: string): Promise<void> {
  const ref = doc(db, 'users', uid);
  if ((await getDoc(ref)).exists()) return;

  const now = new Date().toISOString();
  const profile: UserProfile = {
    userId: uid,
    name: 'HemoGo Member',
    phone,
    role: 'both',
    pinCode: '',
    verified: true,
    status: 'active',
    premiumStatus: false,
    createdAt: now,
    updatedAt: now
  };
  await setDoc(ref, profile);
}

/** Follows the signed-in user and their live profile. Calls back with null when signed out. */
export function subscribeToSession(callback: (user: UserProfile | null) => void): () => void {
  let stopProfile: (() => void) | null = null;

  const stopAuth = onAuthStateChanged(auth, (fbUser) => {
    stopProfile?.();
    stopProfile = null;
    if (!fbUser) {
      callback(null);
      return;
    }

    let creating = false;
    stopProfile = onSnapshot(doc(db, 'users', fbUser.uid), (snap) => {
      if (snap.exists()) {
        callback(snap.data() as UserProfile);
      } else if (!creating) {
        creating = true;
        ensureUserProfile(fbUser.uid, fbUser.phoneNumber || '').catch(console.error);
      }
    }, (err) => console.error('Profile listener failed:', err));
  });

  return () => {
    stopProfile?.();
    stopAuth();
  };
}

export async function logoutUser(): Promise<void> {
  await fbSignOut(auth);
}
