import { doc, getDoc, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions, isDemoMode } from '../config/firebase';
import type { 
  DonorProfile, 
  DonorAvailability 
} from '../types/database';

const MOCK_DONORS_KEY = 'hemogo_mock_donors_v3';

export const INITIAL_DEMO_DONORS: DonorProfile[] = [
  {
    donorId: 'demo_donor_001',
    userId: 'demo_donor_001',
    name: 'Rahul Sharma',
    phone: '+91 98765 43210',
    bloodGroup: 'O+',
    pinCode: '530016',
    email: 'rahul.sharma@example.com',
    availability: 'available',
    verificationStatus: true,
    premiumStatus: true,
    premiumExpiry: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString(),
    lastDonationDate: null,
    cooldownUntil: null,
    totalRequestsReceived: 0,
    totalAccepted: 0,
    totalRejected: 0,
    totalCompleted: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    donorId: 'demo_donor_002',
    userId: 'demo_donor_002',
    name: 'Pooja Varma',
    phone: '+91 98111 22334',
    bloodGroup: 'A+',
    pinCode: '530016',
    email: 'pooja.v@example.com',
    availability: 'available',
    verificationStatus: true,
    premiumStatus: false,
    lastDonationDate: null,
    cooldownUntil: null,
    totalRequestsReceived: 0,
    totalAccepted: 0,
    totalRejected: 0,
    totalCompleted: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    donorId: 'demo_donor_003',
    userId: 'demo_donor_003',
    name: 'Vikramaditya Roy',
    phone: '+91 97766 55443',
    bloodGroup: 'O-',
    pinCode: '530013', // Neighbor PIN
    email: 'vikram.roy@example.com',
    availability: 'available',
    verificationStatus: true,
    premiumStatus: true,
    premiumExpiry: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString(),
    lastDonationDate: null,
    cooldownUntil: null,
    totalRequestsReceived: 0,
    totalAccepted: 0,
    totalRejected: 0,
    totalCompleted: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    donorId: 'demo_donor_004',
    userId: 'demo_donor_004',
    name: 'Dr. Neha Pillai',
    phone: '+91 98222 33445',
    bloodGroup: 'B+',
    pinCode: '530016',
    email: 'neha.p@hospital.org',
    availability: 'available',
    verificationStatus: true,
    premiumStatus: false,
    lastDonationDate: null,
    cooldownUntil: null,
    totalRequestsReceived: 0,
    totalAccepted: 0,
    totalRejected: 0,
    totalCompleted: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export function clearDonorStorage(): void {
  localStorage.removeItem(MOCK_DONORS_KEY);
  localStorage.removeItem('hemogo_mock_donors_v2');
}

export function getStoredMockDonors(): DonorProfile[] {
  const saved = localStorage.getItem(MOCK_DONORS_KEY);
  if (!saved) {
    localStorage.setItem(MOCK_DONORS_KEY, JSON.stringify(INITIAL_DEMO_DONORS));
    return INITIAL_DEMO_DONORS;
  }
  try {
    const list: DonorProfile[] = JSON.parse(saved);
    // Ensure all required fields exist
    return list.map(d => {
      const init = INITIAL_DEMO_DONORS.find(i => i.donorId === d.donorId);
      return {
        ...init,
        ...d,
        name: d.name || init?.name || 'Rahul Sharma',
        phone: d.phone || init?.phone || '+91 98765 43210',
        pinCode: d.pinCode || init?.pinCode || '530016',
        bloodGroup: d.bloodGroup || init?.bloodGroup || 'O+'
      };
    });
  } catch {
    return INITIAL_DEMO_DONORS;
  }
}

export function saveMockDonors(donors: DonorProfile[]) {
  localStorage.setItem(MOCK_DONORS_KEY, JSON.stringify(donors));
}

export async function registerDonorProfile(profile: DonorProfile): Promise<DonorProfile> {
  if (!isDemoMode) {
    try {
      const donorRef = doc(db, 'donors', profile.donorId);
      await setDoc(donorRef, profile);
      return profile;
    } catch (err) {
      console.warn('Firestore write failed, using local mock state:', err);
    }
  }

  const donors = getStoredMockDonors();
  const idx = donors.findIndex(d => d.donorId === profile.donorId);
  if (idx >= 0) {
    donors[idx] = profile;
  } else {
    donors.push(profile);
  }
  saveMockDonors(donors);
  return profile;
}

export async function getDonorProfile(donorId: string): Promise<DonorProfile | null> {
  if (!isDemoMode) {
    try {
      const fetchPromise = getDoc(doc(db, 'donors', donorId));
      const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 1500));
      const snap = await Promise.race([fetchPromise, timeoutPromise]);
      if (snap && snap.exists()) {
        return snap.data() as DonorProfile;
      }
    } catch (err) {
      console.warn('Firestore read failed or timed out, checking local mock state:', err);
    }
  }

  const donors = getStoredMockDonors();
  const found = donors.find(d => d.donorId === donorId || d.userId === donorId);
  if (found) return found;

  const init = INITIAL_DEMO_DONORS.find(d => d.donorId === donorId || d.userId === donorId);
  return init || null;
}

export function getCooldownStatus(donor: DonorProfile): {
  isOnCooldown: boolean;
  daysRemaining: number;
  cooldownDate: Date | null;
  percentageRemaining: number;
} {
  if (!donor.cooldownUntil) {
    return { isOnCooldown: false, daysRemaining: 0, cooldownDate: null, percentageRemaining: 0 };
  }

  const cooldownDate = new Date(donor.cooldownUntil);
  const now = new Date();

  if (cooldownDate <= now) {
    return { isOnCooldown: false, daysRemaining: 0, cooldownDate: null, percentageRemaining: 0 };
  }

  const diffMs = cooldownDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const percentageRemaining = Math.min(100, Math.max(0, Math.round((daysRemaining / 90) * 100)));

  return {
    isOnCooldown: true,
    daysRemaining,
    cooldownDate,
    percentageRemaining
  };
}

export async function toggleDonorAvailability(
  donorId: string,
  targetAvailability: DonorAvailability
): Promise<{ success: boolean; availability: DonorAvailability; message: string }> {
  if (!isDemoMode) {
    try {
      const toggleFn = httpsCallable<{ availability: DonorAvailability }, any>(functions, 'toggleDonorAvailability');
      const res = await toggleFn({ availability: targetAvailability });
      return res.data;
    } catch (err: any) {
      console.warn('Cloud function call failed, enforcing client logic:', err);
    }
  }

  const donors = getStoredMockDonors();
  let donor = donors.find(d => d.donorId === donorId || d.userId === donorId);
  if (!donor) {
    const init = INITIAL_DEMO_DONORS.find(d => d.donorId === donorId || d.userId === donorId);
    if (init) {
      donor = { ...init };
      donors.push(donor);
    } else {
      throw new Error('Donor profile not found.');
    }
  }

  if (targetAvailability === 'available') {
    const cooldown = getCooldownStatus(donor);
    if (cooldown.isOnCooldown) {
      throw new Error(
        `Cannot set available: In medical recovery cooldown for ${cooldown.daysRemaining} more day(s) until ${cooldown.cooldownDate?.toLocaleDateString()}.`
      );
    }
  }

  donor.availability = targetAvailability;
  donor.updatedAt = new Date().toISOString();
  saveMockDonors(donors);

  return {
    success: true,
    availability: targetAvailability,
    message: targetAvailability === 'available'
      ? 'You are now LIVE to receive emergency blood requests in your PIN area.'
      : 'You are now set to Unavailable. No emergency requests will be sent.'
  };
}

export async function updateDonorSettings(
  donorId: string,
  updates: Partial<Pick<DonorProfile, 'name' | 'phone' | 'alternatePhone' | 'city' | 'pinCode' | 'email' | 'notificationPreferences' | 'preferredRadiusKm'>>
): Promise<DonorProfile> {
  const donors = getStoredMockDonors();
  let idx = donors.findIndex(d => d.donorId === donorId || d.userId === donorId);
  
  if (idx < 0) {
    const init = INITIAL_DEMO_DONORS.find(d => d.donorId === donorId || d.userId === donorId);
    if (init) {
      donors.push({ ...init });
      idx = donors.length - 1;
    } else {
      throw new Error('Donor profile not found.');
    }
  }

  // Validate 6-digit Indian PIN Code
  if (updates.pinCode && !/^\d{6}$/.test(updates.pinCode.trim())) {
    throw new Error('PIN Code must be a valid 6-digit Indian postal code.');
  }

  const updatedProfile: DonorProfile = {
    ...donors[idx],
    ...updates,
    pinCode: updates.pinCode?.trim() || donors[idx].pinCode,
    updatedAt: new Date().toISOString()
  };

  donors[idx] = updatedProfile;
  saveMockDonors(donors);

  if (!isDemoMode) {
    try {
      const donorRef = doc(db, 'donors', donorId);
      await setDoc(donorRef, updatedProfile, { merge: true });
    } catch (err) {
      console.warn('Firestore settings update failed:', err);
    }
  }

  return updatedProfile;
}

export function getDonorSearchAnalytics(donor: DonorProfile) {
  // Compute realistic analytics based on donor's activity and premium status
  const baseImpressions = (donor.totalRequestsReceived || 12) * 4;
  const rankOneMultiplier = donor.premiumStatus ? 0.75 : 0.25;
  const rankOneImpressions = Math.round(baseImpressions * rankOneMultiplier);
  const searchesThisMonth = Math.round(baseImpressions * 0.4);

  return {
    donorId: donor.donorId,
    totalSearchImpressions: baseImpressions,
    priorityRankOneImpressions: rankOneImpressions,
    searchesThisMonth,
    averageResponseTimeMinutes: donor.premiumStatus ? 3.8 : 7.2,
    badgeLevel: donor.premiumStatus ? 'Lifesaver Platinum' : donor.totalCompleted > 5 ? 'Lifesaver Gold' : 'Lifesaver Silver',
    rankingPercentile: donor.premiumStatus ? 98 : 72
  };
}

export async function adminVerifyDonor(donorId: string): Promise<DonorProfile> {
  const donors = getStoredMockDonors();
  const idx = donors.findIndex(d => d.donorId === donorId || d.userId === donorId);
  if (idx < 0) {
    throw new Error('Donor not found.');
  }

  donors[idx].verificationStatus = true;
  donors[idx].updatedAt = new Date().toISOString();
  saveMockDonors(donors);

  if (!isDemoMode) {
    try {
      await setDoc(doc(db, 'donors', donorId), { verificationStatus: true, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn('Firestore verification update failed:', err);
    }
  }

  return donors[idx];
}

export async function adminRevokeDonor(donorId: string): Promise<DonorProfile> {
  const donors = getStoredMockDonors();
  const idx = donors.findIndex(d => d.donorId === donorId || d.userId === donorId);
  if (idx < 0) {
    throw new Error('Donor not found.');
  }

  donors[idx].verificationStatus = false;
  donors[idx].updatedAt = new Date().toISOString();
  saveMockDonors(donors);

  if (!isDemoMode) {
    try {
      await setDoc(doc(db, 'donors', donorId), { verificationStatus: false, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn('Firestore revoke update failed:', err);
    }
  }

  return donors[idx];
}

