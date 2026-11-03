import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebase';
import type { BloodGroup, DonorAvailability, DonorProfile } from '../types/database';

export async function registerDonorProfile(data: {
  name: string;
  bloodGroup: BloodGroup;
  pinCode: string;
  consent: boolean;
}): Promise<DonorProfile> {
  const fn = httpsCallable<typeof data, DonorProfile>(functions, 'registerDonor');
  return (await fn(data)).data;
}

export function subscribeToDonor(donorId: string, callback: (donor: DonorProfile | null) => void): () => void {
  return onSnapshot(doc(db, 'donors', donorId), (snap) => {
    callback(snap.exists() ? (snap.data() as DonorProfile) : null);
  }, (err) => {
    console.error('Donor listener failed:', err);
    callback(null);
  });
}

export function subscribeToAllDonors(callback: (donors: DonorProfile[]) => void): () => void {
  return onSnapshot(collection(db, 'donors'), (snap) => callback(snap.docs.map((d) => d.data() as DonorProfile)),
    (err) => console.error('Admin donor listener failed:', err));
}

export function getCooldownStatus(donor: DonorProfile): {
  isOnCooldown: boolean;
  daysRemaining: number;
  cooldownDate: Date | null;
  percentageRemaining: number;
} {
  const cooldownDate = donor.cooldownUntil ? new Date(donor.cooldownUntil) : null;
  const now = new Date();
  if (!cooldownDate || cooldownDate <= now) {
    return { isOnCooldown: false, daysRemaining: 0, cooldownDate: null, percentageRemaining: 0 };
  }

  const daysRemaining = Math.ceil((cooldownDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return {
    isOnCooldown: true,
    daysRemaining,
    cooldownDate,
    percentageRemaining: Math.min(100, Math.round((daysRemaining / 90) * 100))
  };
}

export async function toggleDonorAvailability(
  targetAvailability: DonorAvailability
): Promise<{ success: boolean; availability: DonorAvailability; message: string }> {
  const fn = httpsCallable<{ availability: DonorAvailability }, any>(functions, 'toggleDonorAvailability');
  return (await fn({ availability: targetAvailability })).data;
}

export async function updateDonorSettings(
  donorId: string,
  updates: Partial<Pick<DonorProfile, 'name' | 'alternatePhone' | 'city' | 'pinCode' | 'email' | 'preferredRadiusKm'>>
): Promise<void> {
  if (updates.pinCode && !/^[1-9]\d{5}$/.test(updates.pinCode.trim())) {
    throw new Error('PIN Code must be a valid 6-digit Indian postal code.');
  }
  await updateDoc(doc(db, 'donors', donorId), { ...updates, updatedAt: new Date().toISOString() });
}

export async function adminVerifyDonor(donorId: string): Promise<void> {
  await updateDoc(doc(db, 'donors', donorId), { verificationStatus: true, updatedAt: new Date().toISOString() });
}

export async function adminRevokeDonor(donorId: string): Promise<void> {
  await updateDoc(doc(db, 'donors', donorId), { verificationStatus: false, updatedAt: new Date().toISOString() });
}
