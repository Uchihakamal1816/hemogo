import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
  signOut as fbSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isDemoMode } from '../config/firebase';
import type { UserProfile, UserRole } from '../types/database';

const MOCK_STORAGE_KEY = 'hemogo_demo_user';

export const DEMO_PRESET_USERS: Record<string, UserProfile> = {
  donor_eligible: {
    userId: 'demo_donor_001',
    name: 'Rahul Sharma',
    phone: '+91 98765 43210',
    role: 'donor',
    pinCode: '530016',
    email: 'rahul.sharma@example.com',
    verified: true,
    status: 'active',
    premiumStatus: true,
    premiumExpiry: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  donor_cooldown: {
    userId: 'demo_donor_002',
    name: 'Pooja Varma',
    phone: '+91 98111 22334',
    role: 'donor',
    pinCode: '530016',
    email: 'pooja.v@example.com',
    verified: true,
    status: 'active',
    premiumStatus: false,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  requester_emergency: {
    userId: 'demo_req_001',
    name: 'Anil Kumar',
    phone: '+91 99887 76655',
    role: 'requester',
    pinCode: '530016',
    email: 'anil.k@example.com',
    verified: true,
    status: 'active',
    premiumStatus: false,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  admin_user: {
    userId: 'demo_admin_001',
    name: 'Dr. Siddharth Sen (HemoGo Admin)',
    phone: '+91 91234 56789',
    role: 'admin',
    pinCode: '530016',
    email: 'admin@hemogo.org',
    verified: true,
    status: 'active',
    premiumStatus: true,
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  }
};

export function initializeRecaptcha(containerId: string = 'recaptcha-container'): RecaptchaVerifier | null {
  if (typeof window === 'undefined') return null;
  const container = document.getElementById(containerId);
  if (!container) return null;

  try {
    return new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        console.log('[Auth] reCAPTCHA verified');
      }
    });
  } catch (error) {
    console.warn('[Auth] Recaptcha initialization:', error);
    return null;
  }
}

export async function sendOtpToPhone(
  phoneNumber: string,
  verifier: RecaptchaVerifier | null
): Promise<{ confirmationResult?: ConfirmationResult; isMock: boolean; mockOtp?: string }> {
  const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber.replace(/\D/g, '')}`;

  if (!isDemoMode && verifier) {
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      return { confirmationResult, isMock: false };
    } catch (error: any) {
      console.warn('[Auth] Live Firebase SMS error, falling back to simulated OTP for testing:', error);
    }
  }

  return {
    isMock: true,
    mockOtp: '123456'
  };
}

export async function verifyPhoneOtp(
  otp: string,
  confirmationResult?: ConfirmationResult | null,
  fallbackPhone?: string,
  pinCode: string = '530016',
  role: UserRole = 'donor'
): Promise<UserProfile> {
  if (confirmationResult && !isDemoMode) {
    try {
      const userCredential = await confirmationResult.confirm(otp);
      const fbUser = userCredential.user;
      return await getOrCreateUserProfile(fbUser.uid, fbUser.phoneNumber || fallbackPhone || '+91 99999 99999', pinCode, role);
    } catch (error: any) {
      throw new Error(error.message || 'Invalid OTP. Please check code.');
    }
  }

  if (otp !== '123456' && otp.length !== 6) {
    throw new Error('Invalid OTP. (Demo test code is 123456)');
  }

  const phone = fallbackPhone || '+91 98765 43210';
  const mockUid = `user_${phone.replace(/\D/g, '').slice(-6)}`;
  return getOrCreateMockUser(mockUid, phone, pinCode, role);
}

export async function getOrCreateUserProfile(
  uid: string,
  phoneNumber: string,
  pinCode: string = '530016',
  role: UserRole = 'donor'
): Promise<UserProfile> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      return snap.data() as UserProfile;
    }

    const now = new Date().toISOString();
    const newUser: UserProfile = {
      userId: uid,
      name: 'Blood Donor / Requester',
      phone: phoneNumber,
      role,
      pinCode,
      verified: true,
      status: 'active',
      premiumStatus: false,
      createdAt: now,
      updatedAt: now
    };

    await setDoc(userDocRef, newUser);
    return newUser;
  } catch (err) {
    console.error('Error in getOrCreateUserProfile:', err);
    return getOrCreateMockUser(uid, phoneNumber, pinCode, role);
  }
}

export function getOrCreateMockUser(
  uid: string,
  phoneNumber: string,
  pinCode: string = '530016',
  role: UserRole = 'donor'
): UserProfile {
  const saved = localStorage.getItem(MOCK_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.userId === uid) return parsed;
    } catch {
      // ignore
    }
  }

  const now = new Date().toISOString();
  const newUser: UserProfile = {
    userId: uid,
    name: 'New Registered User',
    phone: phoneNumber,
    role,
    pinCode,
    verified: true,
    status: 'active',
    premiumStatus: false,
    createdAt: now,
    updatedAt: now
  };

  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(newUser));
  return newUser;
}

export function setDemoUserPreset(presetKey: keyof typeof DEMO_PRESET_USERS): UserProfile {
  const user = DEMO_PRESET_USERS[presetKey];
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(user));
  return user;
}

export function getCurrentSessionUser(): UserProfile | null {
  const saved = localStorage.getItem(MOCK_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
}

export async function logoutUser(): Promise<void> {
  localStorage.removeItem(MOCK_STORAGE_KEY);
  try {
    await fbSignOut(auth);
  } catch {
    // ignore
  }
}
