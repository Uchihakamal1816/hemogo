import { httpsCallable } from 'firebase/functions';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db, functions } from '../config/firebase';
import type {
  BloodRequest,
  MatchRecord,
  BloodGroup,
  UrgencyLevel,
  PreliminaryScreening
} from '../types/database';

export const ACTIVE_REQUEST_STATUSES = ['SEARCHING', 'DONORS_NOTIFIED', 'CONTACT_SHARED'];

export async function createEmergencyBloodRequest(data: {
  patientName: string;
  bloodGroup: BloodGroup;
  hospitalName: string;
  hospitalPinCode: string;
  hospitalLat?: number | null;
  hospitalLng?: number | null;
  unitsRequired: number;
  urgency: UrgencyLevel;
  notes?: string;
}): Promise<{ request: BloodRequest; notifiedCount: number }> {
  const fn = httpsCallable<typeof data, { request: BloodRequest; notifiedCount: number }>(functions, 'createBloodRequest');
  return (await fn(data)).data;
}

export function subscribeToMyRequests(userId: string, callback: (requests: BloodRequest[]) => void): () => void {
  const q = query(collection(db, 'bloodRequests'), where('requesterId', '==', userId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => d.data() as BloodRequest)),
    (err) => console.error('Request listener failed:', err));
}

export function subscribeToRequestMatches(requestId: string, userId: string, callback: (matches: MatchRecord[]) => void): () => void {
  const q = query(collection(db, 'matches'), where('requestId', '==', requestId), where('requesterId', '==', userId));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => d.data() as MatchRecord)),
    (err) => console.error('Match listener failed:', err));
}

/** Live alerts and accepted requests for a donor. */
export function subscribeToDonorMatches(donorId: string, callback: (matches: MatchRecord[]) => void): () => void {
  const q = query(collection(db, 'matches'), where('donorId', '==', donorId), where('response', 'in', ['PENDING', 'ACCEPTED']));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => d.data() as MatchRecord)),
    (err) => console.error('Donor match listener failed:', err));
}

export async function acceptMatchWithScreening(matchId: string, screeningResponses: Omit<PreliminaryScreening, 'confirmedAt'>): Promise<void> {
  await httpsCallable(functions, 'acceptBloodRequest')({ matchId, screeningResponses });
}

export async function rejectMatch(matchId: string): Promise<void> {
  await httpsCallable(functions, 'rejectBloodRequest')({ matchId });
}

export async function markRequestFulfilled(requestId: string): Promise<void> {
  await httpsCallable(functions, 'closeBloodRequest')({ requestId, outcome: 'FULFILLED' });
}

export async function cancelBloodRequest(requestId: string): Promise<void> {
  await httpsCallable(functions, 'closeBloodRequest')({ requestId, outcome: 'CANCELLED' });
}

export async function confirmDonation(matchId: string): Promise<void> {
  await httpsCallable(functions, 'confirmDonationCompleted')({ matchId });
}
