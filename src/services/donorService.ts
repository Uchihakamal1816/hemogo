import { doc, getDoc, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions, isDemoMode } from '../config/firebase';
import type { 
  DonorProfile, 
  DonorAvailability 
} from '../types/database';

const MOCK_DONORS_KEY = 'hemogo_mock_donors_v2';

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
    lastDonationDate: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000).toISOString(),
    cooldownUntil: null,
    totalRequestsReceived: 12,
    totalAccepted: 8,
    totalRejected: 1,
    totalCompleted: 6,
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
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
    availability: 'unavailable',
    verificationStatus: true,
    premiumStatus: false,
    lastDonationDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    cooldownUntil: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString(),
    totalRequestsReceived: 6,
    totalAccepted: 3,
    totalRejected: 0,
    totalCompleted: 3,
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
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
    lastDonationDate: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
    cooldownUntil: null,
    totalRequestsReceived: 18,
    totalAccepted: 14,
    totalRejected: 2,
    totalCompleted: 12,
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
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
    lastDonationDate: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toISOString(),
    cooldownUntil: null,
    totalRequestsReceived: 9,
    totalAccepted: 5,
    totalRejected: 1,
    totalCompleted: 5,
    createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

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
      const snap = await getDoc(doc(db, 'donors', donorId));
      if (snap.exists()) {
        return snap.data() as DonorProfile;
      }
    } catch (err) {
      console.warn('Firestore read failed, checking local mock state:', err);
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
