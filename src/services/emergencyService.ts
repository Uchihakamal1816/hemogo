import type { 
  BloodRequest, 
  MatchRecord, 
  BloodGroup, 
  UrgencyLevel, 
  PreliminaryScreening 
} from '../types/database';
import { getStoredMockDonors } from './donorService';

const MOCK_REQUESTS_KEY = 'hemogo_mock_requests_v2';
const MOCK_MATCHES_KEY = 'hemogo_mock_matches_v2';

export const INITIAL_DEMO_REQUESTS: BloodRequest[] = [
  {
    requestId: 'HG10245',
    requesterId: 'demo_req_001',
    patientName: 'Kavitha Ramachandran (Age 32)',
    requesterPhone: '+91 99887 76655',
    bloodGroup: 'O+',
    hospitalName: 'Care Hospital, Waltair Main Rd',
    hospitalPinCode: '530016',
    unitsRequired: 2,
    urgency: 'critical',
    notes: 'Emergency cesarean delivery with severe hemorrhage. Urgent blood units needed.',
    status: 'DONORS_NOTIFIED',
    notifiedDonorsCount: 8,
    acceptedDonorsCount: 1,
    rejectedDonorsCount: 0,
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  }
];

export const INITIAL_DEMO_MATCHES: MatchRecord[] = [
  {
    matchId: 'match_001_pending',
    requestId: 'HG10245',
    donorId: 'demo_donor_001',
    donorName: 'Rahul Sharma',
    donorPhone: '+91 98765 43210',
    donorBloodGroup: 'O+',
    donorPinCode: '530016',
    isPremiumDonor: true,
    priorityScore: 100,
    locationMatch: 'SAME_PIN',
    notificationStatus: 'DELIVERED',
    response: 'PENDING',
    respondedAt: null,
    eligibilityScreening: null,
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString()
  },
  {
    matchId: 'match_002_accepted',
    requestId: 'HG10245',
    donorId: 'demo_donor_003',
    donorName: 'Vikramaditya Roy',
    donorPhone: '+91 97766 55443',
    donorBloodGroup: 'O-',
    donorPinCode: '530013',
    isPremiumDonor: true,
    priorityScore: 80,
    locationMatch: 'NEIGHBOR_PIN',
    notificationStatus: 'DELIVERED',
    response: 'ACCEPTED',
    respondedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    eligibilityScreening: {
      feelingWell: true,
      recentDonation: false,
      hasInfectionSymptoms: false,
      takingMedications: false,
      previousDecline: false,
      willingForBloodBankScreening: true,
      confirmedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
    },
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString()
  }
];

export function getStoredRequests(): BloodRequest[] {
  const saved = localStorage.getItem(MOCK_REQUESTS_KEY);
  if (!saved) {
    localStorage.setItem(MOCK_REQUESTS_KEY, JSON.stringify(INITIAL_DEMO_REQUESTS));
    return INITIAL_DEMO_REQUESTS;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_DEMO_REQUESTS;
  }
}

export function saveStoredRequests(list: BloodRequest[]) {
  localStorage.setItem(MOCK_REQUESTS_KEY, JSON.stringify(list));
}

export function getStoredMatches(): MatchRecord[] {
  const saved = localStorage.getItem(MOCK_MATCHES_KEY);
  if (!saved) {
    localStorage.setItem(MOCK_MATCHES_KEY, JSON.stringify(INITIAL_DEMO_MATCHES));
    return INITIAL_DEMO_MATCHES;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_DEMO_MATCHES;
  }
}

export function saveStoredMatches(list: MatchRecord[]) {
  localStorage.setItem(MOCK_MATCHES_KEY, JSON.stringify(list));
}

/**
 * Creates an emergency blood request and triggers the server-side donor matching engine
 */
export async function createEmergencyBloodRequest(data: {
  requesterId: string;
  patientName: string;
  requesterPhone: string;
  bloodGroup: BloodGroup;
  hospitalName: string;
  hospitalPinCode: string;
  unitsRequired: number;
  urgency: UrgencyLevel;
  notes?: string;
}): Promise<{ request: BloodRequest; notifiedCount: number }> {
  const requestId = `HG${Math.floor(10000 + Math.random() * 90000)}`;
  const nowIso = new Date().toISOString();
  const expiresIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // Run matching simulation
  const allDonors = getStoredMockDonors().filter(d => d.availability === 'available');
  const neighborPins = ['530013', '530017', '530020', '560034', '560008', '600102'];
  
  const createdMatches: MatchRecord[] = [];
  let notifiedCount = 0;

  allDonors.forEach((donor) => {
    const isSamePin = donor.pinCode === data.hospitalPinCode;
    const isNeighbor = neighborPins.includes(donor.pinCode);

    if (!isSamePin && !isNeighbor) return;

    let priorityScore = 0;
    const locationMatch = isSamePin ? 'SAME_PIN' : 'NEIGHBOR_PIN';

    if (donor.premiumStatus && isSamePin) priorityScore = 100;
    else if (donor.premiumStatus && isNeighbor) priorityScore = 80;
    else if (!donor.premiumStatus && isSamePin) priorityScore = 60;
    else if (!donor.premiumStatus && isNeighbor) priorityScore = 40;

    const newMatch: MatchRecord = {
      matchId: `match_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      requestId,
      donorId: donor.donorId,
      donorName: donor.name,
      donorPhone: donor.phone,
      donorBloodGroup: donor.bloodGroup,
      donorPinCode: donor.pinCode,
      isPremiumDonor: donor.premiumStatus,
      priorityScore,
      locationMatch,
      notificationStatus: 'DELIVERED',
      response: 'PENDING',
      createdAt: nowIso
    };

    createdMatches.push(newMatch);
    notifiedCount++;
  });

  const newRequest: BloodRequest = {
    requestId,
    requesterId: data.requesterId,
    patientName: data.patientName,
    requesterPhone: data.requesterPhone,
    bloodGroup: data.bloodGroup,
    hospitalName: data.hospitalName,
    hospitalPinCode: data.hospitalPinCode,
    unitsRequired: data.unitsRequired,
    urgency: data.urgency,
    notes: data.notes,
    status: notifiedCount > 0 ? 'DONORS_NOTIFIED' : 'SEARCHING',
    notifiedDonorsCount: notifiedCount,
    acceptedDonorsCount: 0,
    rejectedDonorsCount: 0,
    createdAt: nowIso,
    updatedAt: nowIso,
    expiresAt: expiresIso
  };

  // Save to stored state
  const requests = getStoredRequests();
  requests.unshift(newRequest);
  saveStoredRequests(requests);

  const matches = getStoredMatches();
  saveStoredMatches([...createdMatches, ...matches]);

  return {
    request: newRequest,
    notifiedCount
  };
}

/**
 * Fetch matches for a specific blood request (used by requester to see accepted donors)
 */
export function getMatchesForRequest(requestId: string): MatchRecord[] {
  const matches = getStoredMatches();
  return matches.filter(m => m.requestId === requestId);
}

/**
 * Fetch pending notifications/matches sent to a specific donor
 */
export function getPendingMatchesForDonor(donorId: string): (MatchRecord & { requestDetails?: BloodRequest })[] {
  const matches = getStoredMatches().filter(m => (m.donorId === donorId || donorId === 'demo_donor_001') && m.response === 'PENDING');
  const requests = getStoredRequests();

  return matches.map(m => ({
    ...m,
    requestDetails: requests.find(r => r.requestId === m.requestId) || requests[0]
  }));
}

/**
 * Handles donor accepting a request with preliminary medical screening
 */
export async function acceptMatchWithScreening(
  donorId: string,
  matchId: string,
  screening: PreliminaryScreening
): Promise<{ success: boolean; request: BloodRequest }> {
  const matches = getStoredMatches();
  const match = matches.find(m => m.matchId === matchId && (m.donorId === donorId || donorId === 'demo_donor_001'));
  if (!match) throw new Error('Match record not found.');

  const nowIso = new Date().toISOString();
  match.response = 'ACCEPTED';
  match.respondedAt = nowIso;
  match.eligibilityScreening = screening;
  saveStoredMatches(matches);

  const requests = getStoredRequests();
  const req = requests.find(r => r.requestId === match.requestId) || requests[0];
  if (!req) throw new Error('Blood request not found.');

  req.status = 'CONTACT_SHARED';
  req.acceptedDonorsCount = (req.acceptedDonorsCount || 0) + 1;
  req.updatedAt = nowIso;
  saveStoredRequests(requests);

  return { success: true, request: req };
}

/**
 * Handles donor rejecting a request
 */
export async function rejectMatch(donorId: string, matchId: string): Promise<void> {
  const matches = getStoredMatches();
  const match = matches.find(m => m.matchId === matchId && (m.donorId === donorId || donorId === 'demo_donor_001'));
  if (match) {
    match.response = 'REJECTED';
    match.respondedAt = new Date().toISOString();
    saveStoredMatches(matches);

    const requests = getStoredRequests();
    const req = requests.find(r => r.requestId === match.requestId);
    if (req) {
      req.rejectedDonorsCount = (req.rejectedDonorsCount || 0) + 1;
      saveStoredRequests(requests);
    }
  }
}

/**
 * Mark blood request as fulfilled
 */
export async function markRequestFulfilled(requestId: string): Promise<void> {
  const requests = getStoredRequests();
  const req = requests.find(r => r.requestId === requestId);
  if (req) {
    req.status = 'FULFILLED';
    req.updatedAt = new Date().toISOString();
    saveStoredRequests(requests);
  }
}

/**
 * Cancel a blood request
 */
export async function cancelBloodRequest(requestId: string): Promise<void> {
  const requests = getStoredRequests();
  const req = requests.find(r => r.requestId === requestId);
  if (req) {
    req.status = 'CANCELLED';
    req.updatedAt = new Date().toISOString();
    saveStoredRequests(requests);
  }
}
