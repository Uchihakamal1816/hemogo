import { db } from '../config/firebase';
import * as functions from 'firebase-functions';

// Medically validated blood compatibility mapping
export const BLOOD_COMPATIBILITY: Record<string, string[]> = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // Universal Recipient
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'] // Universal Donor
};

// Neighboring PIN Code Proximity Map (Configurable in Admin Dashboard)
export const NEIGHBOR_PIN_MAP: Record<string, string[]> = {
  '530016': ['530013', '530017', '530020', '530003'], // Visakhapatnam
  '560038': ['560008', '560075', '560034', '560001'], // Bengaluru Indiranagar
  '560034': ['560095', '560068', '560038', '560047'], // Bengaluru Koramangala
  '600040': ['600102', '600101', '600049', '600030'], // Chennai Anna Nagar
  '500034': ['500082', '500033', '500028', '500004'], // Hyderabad Banjara Hills
  '400053': ['400058', '400061', '400102', '400049']  // Mumbai Andheri
};

/**
 * Toggles donor availability between 'available' and 'unavailable' with 90-day cooldown validation
 */
export async function handleToggleDonorAvailability(
  userId: string,
  targetAvailability: 'available' | 'unavailable'
): Promise<{ success: boolean; availability: 'available' | 'unavailable'; message: string }> {
  if (!userId) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const donorRef = db.collection('donors').doc(userId);
  const donorDoc = await donorRef.get();

  if (!donorDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Donor profile does not exist.');
  }

  const donorData = donorDoc.data()!;

  // Check 90-day cooldown if attempting to turn ON availability
  if (targetAvailability === 'available' && donorData.cooldownUntil) {
    const cooldownDate = new Date(donorData.cooldownUntil);
    const now = new Date();

    if (cooldownDate > now) {
      const daysRemaining = Math.ceil((cooldownDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Cannot set available: In medical recovery cooldown for ${daysRemaining} more days until ${cooldownDate.toLocaleDateString()}.`
      );
    }
  }

  const nowIso = new Date().toISOString();
  await donorRef.update({
    availability: targetAvailability,
    updatedAt: nowIso
  });

  return {
    success: true,
    availability: targetAvailability,
    message: targetAvailability === 'available'
      ? 'You are now LIVE to receive emergency blood requests.'
      : 'You are now set to Unavailable. No emergency requests will be sent.'
  };
}

/**
 * Server-Side Donor Matching Engine (PRD Section 6, 7 & 24)
 * Evaluates compatible donors and assigns priority scores:
 * - Priority 1: Premium Donor + Same PIN (Score: 100)
 * - Priority 2: Premium Donor + Neighbor PIN (Score: 80)
 * - Priority 3: Regular Donor + Same PIN (Score: 60)
 * - Priority 4: Regular Donor + Neighbor PIN (Score: 40)
 */
export async function runDonorMatchingAlgorithm(requestData: {
  requestId: string;
  bloodGroup: string;
  hospitalPinCode: string;
}): Promise<{ matchedDonorsCount: number; matchesSummary: { samePin: number; neighborPin: number; premium: number } }> {
  const { requestId, bloodGroup, hospitalPinCode } = requestData;
  const compatibleGroups = BLOOD_COMPATIBILITY[bloodGroup] || [bloodGroup];
  const neighborPins = NEIGHBOR_PIN_MAP[hospitalPinCode] || [];

  // Query eligible available donors with compatible blood groups
  const donorsSnapshot = await db
    .collection('donors')
    .where('availability', '==', 'available')
    .where('bloodGroup', 'in', compatibleGroups)
    .get();

  let samePinCount = 0;
  let neighborPinCount = 0;
  let premiumCount = 0;

  const batch = db.batch();
  const nowIso = new Date().toISOString();

  donorsSnapshot.forEach((doc) => {
    const donor = doc.data();
    const isSamePin = donor.pinCode === hospitalPinCode;
    const isNeighborPin = neighborPins.includes(donor.pinCode);

    if (!isSamePin && !isNeighborPin) return; // Radius expansion handled in next phase if needed

    let priorityScore = 0;
    let locationTier: 'SAME_PIN' | 'NEIGHBOR_PIN' = isSamePin ? 'SAME_PIN' : 'NEIGHBOR_PIN';

    if (donor.premiumStatus && isSamePin) {
      priorityScore = 100;
      premiumCount++;
      samePinCount++;
    } else if (donor.premiumStatus && isNeighborPin) {
      priorityScore = 80;
      premiumCount++;
      neighborPinCount++;
    } else if (!donor.premiumStatus && isSamePin) {
      priorityScore = 60;
      samePinCount++;
    } else if (!donor.premiumStatus && isNeighborPin) {
      priorityScore = 40;
      neighborPinCount++;
    }

    const matchRef = db.collection('matches').doc();
    batch.set(matchRef, {
      matchId: matchRef.id,
      requestId,
      donorId: donor.userId || doc.id,
      donorName: donor.name,
      donorPhone: donor.phone, // Protected: only revealed when response is ACCEPTED
      donorBloodGroup: donor.bloodGroup,
      donorPinCode: donor.pinCode,
      isPremiumDonor: Boolean(donor.premiumStatus),
      priorityScore,
      locationMatch: locationTier,
      notificationStatus: 'SENT',
      response: 'PENDING',
      createdAt: nowIso
    });

    // Update donor request received counter
    batch.update(doc.ref, {
      lastNotificationDate: nowIso,
      totalRequestsReceived: (donor.totalRequestsReceived || 0) + 1,
      updatedAt: nowIso
    });
  });

  const totalNotified = samePinCount + neighborPinCount;

  // Update blood request status
  const requestRef = db.collection('bloodRequests').doc(requestId);
  batch.update(requestRef, {
    status: totalNotified > 0 ? 'DONORS_NOTIFIED' : 'SEARCHING',
    notifiedDonorsCount: totalNotified,
    updatedAt: nowIso
  });

  await batch.commit();

  return {
    matchedDonorsCount: totalNotified,
    matchesSummary: {
      samePin: samePinCount,
      neighborPin: neighborPinCount,
      premium: premiumCount
    }
  };
}

/**
 * Handles Donor Acceptance with Preliminary Medical Screening flow (PRD Section 9, 10 & 11)
 */
export async function handleAcceptBloodRequest(
  donorId: string,
  matchId: string,
  screeningResponses: {
    feelingWell: boolean;
    recentDonation: boolean;
    hasInfectionSymptoms: boolean;
    takingMedications: boolean;
    previousDecline: boolean;
    willingForBloodBankScreening: boolean;
  }
): Promise<{ success: boolean; message: string; contactInfo: any }> {
  if (!donorId) {
    throw new functions.https.HttpsError('unauthenticated', 'Donor authentication required.');
  }

  const matchRef = db.collection('matches').doc(matchId);
  const matchDoc = await matchRef.get();

  if (!matchDoc.exists || matchDoc.data()?.donorId !== donorId) {
    throw new functions.https.HttpsError('permission-denied', 'Invalid match record.');
  }

  const matchData = matchDoc.data()!;
  const nowIso = new Date().toISOString();

  const batch = db.batch();

  // 1. Update Match record to ACCEPTED with screening answers
  batch.update(matchRef, {
    response: 'ACCEPTED',
    respondedAt: nowIso,
    eligibilityScreening: {
      ...screeningResponses,
      confirmedAt: nowIso
    }
  });

  // 2. Update Request record to DONOR_ACCEPTED / CONTACT_SHARED
  const requestRef = db.collection('bloodRequests').doc(matchData.requestId);
  const reqDoc = await requestRef.get();
  const reqData = reqDoc.data() || {};

  batch.update(requestRef, {
    status: 'CONTACT_SHARED',
    acceptedDonorsCount: (reqData.acceptedDonorsCount || 0) + 1,
    updatedAt: nowIso
  });

  // 3. Update Donor metrics
  const donorRef = db.collection('donors').doc(donorId);
  batch.update(donorRef, {
    totalAccepted: (donorRef as any).totalAccepted ? (donorRef as any).totalAccepted + 1 : 1,
    updatedAt: nowIso
  });

  await batch.commit();

  return {
    success: true,
    message: 'Thank you! Your acceptance has been sent to the requester.',
    contactInfo: {
      requesterName: reqData.patientName,
      requesterPhone: reqData.requesterPhone,
      hospitalName: reqData.hospitalName,
      hospitalPinCode: reqData.hospitalPinCode,
      unitsRequired: reqData.unitsRequired
    }
  };
}

/**
 * Handles Donor Rejection (PRD Section 9)
 */
export async function handleRejectBloodRequest(
  donorId: string,
  matchId: string
): Promise<{ success: boolean }> {
  const matchRef = db.collection('matches').doc(matchId);
  const matchDoc = await matchRef.get();

  if (!matchDoc.exists || matchDoc.data()?.donorId !== donorId) {
    throw new functions.https.HttpsError('permission-denied', 'Unauthorized rejection request.');
  }

  const nowIso = new Date().toISOString();
  await matchRef.update({
    response: 'REJECTED',
    respondedAt: nowIso
  });

  const donorRef = db.collection('donors').doc(donorId);
  await donorRef.update({
    totalRejected: (donorRef as any).totalRejected ? (donorRef as any).totalRejected + 1 : 1,
    updatedAt: nowIso
  });

  return { success: true };
}
