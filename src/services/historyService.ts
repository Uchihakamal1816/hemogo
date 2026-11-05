import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { BloodRequest, DonationRecord, MatchRecord, PastEmergencyRecord } from '../types/database';

export async function getRequesterPastEmergencies(userId: string): Promise<PastEmergencyRecord[]> {
  const [requests, matches] = await Promise.all([
    getDocs(query(collection(db, 'bloodRequests'), where('requesterId', '==', userId), orderBy('createdAt', 'desc'))),
    getDocs(query(collection(db, 'matches'), where('requesterId', '==', userId), where('response', '==', 'ACCEPTED')))
  ]);
  const accepted = matches.docs.map((d) => d.data() as MatchRecord);

  return requests.docs
    .map((d) => d.data() as BloodRequest)
    .filter((r) => !['SEARCHING', 'DONORS_NOTIFIED', 'CONTACT_SHARED'].includes(r.status))
    .map((r) => ({
      historyId: r.requestId,
      requestId: r.requestId,
      patientName: r.patientName,
      hospitalName: r.hospitalName,
      hospitalPinCode: r.hospitalPinCode,
      bloodGroup: r.bloodGroup,
      unitsRequired: r.unitsRequired,
      status: r.status,
      createdAt: r.createdAt,
      fulfilledAt: r.status === 'FULFILLED' ? r.updatedAt : undefined,
      acceptedDonors: accepted.filter((m) => m.requestId === r.requestId).map((m) => ({
        donorId: m.donorId,
        donorName: m.donorName || 'Donor',
        donorPhone: m.donorPhone || '',
        bloodGroup: m.donorBloodGroup
      }))
    }));
}

export async function getDonorDonationHistory(donorId: string): Promise<DonationRecord[]> {
  const snap = await getDocs(query(collection(db, 'donations'), where('donorId', '==', donorId)));
  return snap.docs
    .map((d) => d.data() as DonationRecord)
    .sort((a, b) => b.donatedAt.localeCompare(a.donatedAt));
}
