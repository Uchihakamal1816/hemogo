import { randomInt } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase';
import { BLOOD_COMPATIBILITY, ScreeningAnswers, isOnCooldown, isPremiumActive, screeningFailure } from '../matching/logic';
import { ACTIVE_STATUSES, audit, dispatchTier, expirePendingMatches, pushToUsers } from '../matching/dispatch';

const PIN_PATTERN = /^[1-9]\d{5}$/;
const COOLDOWN_DAYS = 90;
const MAX_ACTIVE_REQUESTS = 3;
const MAX_REQUESTS_PER_DAY = 5;

function cleanText(value: unknown, field: string, maxLength: number, required = true): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (required && !text) throw new HttpsError('invalid-argument', `${field} is required.`);
  if (text.length > maxLength) throw new HttpsError('invalid-argument', `${field} is too long.`);
  return text;
}

function coordinate(value: unknown, limit: number): number | null {
  return typeof value === 'number' && Math.abs(value) <= limit ? value : null;
}

export async function registerDonor(uid: string, phone: string, data: any) {
  const bloodGroup = data?.bloodGroup;
  if (!BLOOD_COMPATIBILITY[bloodGroup]) throw new HttpsError('invalid-argument', 'Choose a valid blood group.');
  if (!PIN_PATTERN.test(data?.pinCode || '')) throw new HttpsError('invalid-argument', 'Enter a valid 6-digit PIN code.');
  if (data?.consent !== true) throw new HttpsError('failed-precondition', 'Consent is required to receive alerts.');
  const name = cleanText(data?.name, 'Name', 80);

  const donorRef = db.collection('donors').doc(uid);
  if ((await donorRef.get()).exists) throw new HttpsError('already-exists', 'You are already registered as a donor.');

  const user = (await db.collection('users').doc(uid).get()).data() || {};
  const nowIso = new Date().toISOString();
  const profile = {
    donorId: uid,
    userId: uid,
    name,
    phone,
    bloodGroup,
    pinCode: data.pinCode,
    availability: 'available',
    verificationStatus: false,
    premiumStatus: isPremiumActive(user),
    premiumExpiry: user.premiumExpiry ?? null,
    consentAt: nowIso,
    cooldownUntil: null,
    lastDonationDate: null,
    totalRequestsReceived: 0,
    totalAccepted: 0,
    totalRejected: 0,
    totalCompleted: 0,
    createdAt: nowIso,
    updatedAt: nowIso
  };
  await donorRef.set(profile);
  await db.collection('users').doc(uid).set({ name, pinCode: data.pinCode, updatedAt: nowIso }, { merge: true });
  return profile;
}

export async function toggleAvailability(uid: string, target: 'available' | 'unavailable') {
  const donorRef = db.collection('donors').doc(uid);
  const donor = (await donorRef.get()).data();
  if (!donor) throw new HttpsError('not-found', 'Donor profile does not exist.');

  if (target === 'available' && isOnCooldown(donor.cooldownUntil)) {
    throw new HttpsError('failed-precondition',
      `You are in the medical recovery period until ${new Date(donor.cooldownUntil).toLocaleDateString('en-IN')}.`);
  }
  await donorRef.update({ availability: target, updatedAt: new Date().toISOString() });
  return {
    success: true,
    availability: target,
    message: target === 'available'
      ? 'You are now live to receive emergency blood requests.'
      : 'You are now unavailable. No emergency requests will be sent.'
  };
}

export async function createBloodRequest(uid: string, phone: string, data: any) {
  const bloodGroup = data?.bloodGroup;
  if (!BLOOD_COMPATIBILITY[bloodGroup]) throw new HttpsError('invalid-argument', 'Choose a valid blood group.');
  if (!PIN_PATTERN.test(data?.hospitalPinCode || '')) throw new HttpsError('invalid-argument', 'Enter the hospital 6-digit PIN code.');
  const unitsRequired = Number(data?.unitsRequired);
  if (!Number.isInteger(unitsRequired) || unitsRequired < 1 || unitsRequired > 10) {
    throw new HttpsError('invalid-argument', 'Units must be between 1 and 10.');
  }
  const urgency = ['critical', 'urgent', 'moderate'].includes(data?.urgency) ? data.urgency : 'critical';

  const now = new Date();
  const recent = await db.collection('bloodRequests')
    .where('requesterId', '==', uid).orderBy('createdAt', 'desc').limit(MAX_REQUESTS_PER_DAY).get();
  const active = recent.docs.filter((d) => ACTIVE_STATUSES.includes(d.data().status)).length;
  const dayAgo = now.getTime() - 24 * 60 * 60 * 1000;
  const today = recent.docs.filter((d) => new Date(d.data().createdAt).getTime() > dayAgo).length;
  if (active >= MAX_ACTIVE_REQUESTS || today >= MAX_REQUESTS_PER_DAY) {
    throw new HttpsError('resource-exhausted',
      'You have reached the request limit. Close an open request, or call 104 for urgent help.');
  }

  const user = (await db.collection('users').doc(uid).get()).data() || {};
  const nowIso = now.toISOString();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const request = {
    requesterId: uid,
    patientName: cleanText(data?.patientName, 'Patient name', 80),
    requesterPhone: phone,
    bloodGroup,
    hospitalName: cleanText(data?.hospitalName, 'Hospital name', 120),
    hospitalPinCode: data.hospitalPinCode,
    hospitalLat: coordinate(data?.hospitalLat, 90),
    hospitalLng: coordinate(data?.hospitalLng, 180),
    unitsRequired,
    urgency,
    notes: cleanText(data?.notes, 'Notes', 300, false),
    requesterIsPremium: isPremiumActive(user, now),
    status: 'SEARCHING',
    searchTier: 0,
    notifiedDonorsCount: 0,
    pushDeliveredCount: 0,
    acceptedDonorsCount: 0,
    rejectedDonorsCount: 0,
    nextEscalationAt: expiresAt,
    createdAt: nowIso,
    updatedAt: nowIso,
    expiresAt
  };

  let requestId = '';
  for (let attempt = 0; !requestId; attempt++) {
    const candidate = `HG${randomInt(100000, 1000000)}`;
    try {
      await db.collection('bloodRequests').doc(candidate).create({ requestId: candidate, ...request });
      requestId = candidate;
    } catch (err) {
      if (attempt >= 4) throw err;
    }
  }

  const notifiedCount = await dispatchTier(requestId, 0);
  const saved = (await db.collection('bloodRequests').doc(requestId).get()).data();
  return { request: saved, notifiedCount };
}

export async function acceptMatch(uid: string, matchId: string, screening: ScreeningAnswers) {
  const failure = screeningFailure(screening);
  if (failure) throw new HttpsError('failed-precondition', failure);

  const matchRef = db.collection('matches').doc(String(matchId));
  const nowIso = new Date().toISOString();

  const result = await db.runTransaction(async (tx) => {
    const match = (await tx.get(matchRef)).data();
    if (!match || match.donorId !== uid) throw new HttpsError('permission-denied', 'Invalid match.');
    if (match.response !== 'PENDING') throw new HttpsError('failed-precondition', 'This alert is no longer open.');

    const requestRef = db.collection('bloodRequests').doc(match.requestId);
    const donorRef = db.collection('donors').doc(uid);
    const [requestSnap, donorSnap] = await Promise.all([tx.get(requestRef), tx.get(donorRef)]);
    const request = requestSnap.data();
    const donor = donorSnap.data();
    if (!request || !ACTIVE_STATUSES.includes(request.status)) {
      throw new HttpsError('failed-precondition', 'This request has already closed.');
    }
    if (!donor) throw new HttpsError('not-found', 'Donor profile does not exist.');
    if (isOnCooldown(donor.cooldownUntil)) throw new HttpsError('failed-precondition', 'You are in the medical recovery period.');

    tx.update(matchRef, {
      response: 'ACCEPTED',
      respondedAt: nowIso,
      donorName: donor.name,
      donorPhone: donor.phone,
      patientName: request.patientName,
      requesterPhone: request.requesterPhone,
      notes: request.notes || ''
    });
    tx.set(db.collection('screenings').doc(matchRef.id), {
      matchId: matchRef.id, donorId: uid, ...screening, confirmedAt: nowIso
    });
    tx.update(requestRef, {
      status: 'CONTACT_SHARED',
      acceptedDonorsCount: FieldValue.increment(1),
      updatedAt: nowIso
    });
    tx.update(donorRef, { totalAccepted: FieldValue.increment(1), updatedAt: nowIso });
    return { match, request, donor };
  });

  await audit(uid, 'CONTACT_REVEAL', `matches/${matchRef.id}`);
  await pushToUsers([result.request.requesterId], {
    type: 'DONOR_ACCEPTED',
    title: `Donor found: ${result.donor.name}`,
    body: 'Contact details and chat are now unlocked. Tap to connect.',
    requestId: result.match.requestId,
    webRoute: '/?tab=requester_status'
  });

  return {
    success: true,
    message: 'Thank you! Your acceptance has been sent to the requester.'
  };
}

export async function rejectMatch(uid: string, matchId: string) {
  const matchRef = db.collection('matches').doc(String(matchId));
  const nowIso = new Date().toISOString();
  await db.runTransaction(async (tx) => {
    const match = (await tx.get(matchRef)).data();
    if (!match || match.donorId !== uid) throw new HttpsError('permission-denied', 'Invalid match.');
    if (match.response !== 'PENDING') return;
    tx.update(matchRef, { response: 'REJECTED', respondedAt: nowIso });
    tx.update(db.collection('bloodRequests').doc(match.requestId), {
      rejectedDonorsCount: FieldValue.increment(1), updatedAt: nowIso
    });
    tx.update(db.collection('donors').doc(uid), { totalRejected: FieldValue.increment(1), updatedAt: nowIso });
  });
  return { success: true };
}

export async function closeRequest(uid: string, requestId: string, outcome: string) {
  if (outcome !== 'FULFILLED' && outcome !== 'CANCELLED') throw new HttpsError('invalid-argument', 'Invalid outcome.');
  const requestRef = db.collection('bloodRequests').doc(String(requestId));
  const request = (await requestRef.get()).data();
  if (!request || request.requesterId !== uid) throw new HttpsError('permission-denied', 'This is not your request.');
  if (!ACTIVE_STATUSES.includes(request.status)) return { success: true };

  await requestRef.update({ status: outcome, updatedAt: new Date().toISOString() });
  await expirePendingMatches(requestRef.id);
  await audit(uid, `REQUEST_${outcome}`, `bloodRequests/${requestRef.id}`);
  return { success: true };
}

/** The requester confirms a donor gave blood, which starts that donor's medical cooldown. */
export async function confirmDonation(uid: string, matchId: string) {
  const matchRef = db.collection('matches').doc(String(matchId));
  const now = new Date();
  const nowIso = now.toISOString();
  await db.runTransaction(async (tx) => {
    const match = (await tx.get(matchRef)).data();
    if (!match || match.requesterId !== uid) throw new HttpsError('permission-denied', 'This is not your match.');
    if (match.response !== 'ACCEPTED') throw new HttpsError('failed-precondition', 'This donor has not accepted.');
    if (match.donationConfirmedAt) return;

    const certificateId = `CERT-HG-${now.getFullYear()}-${matchRef.id.slice(-6).toUpperCase()}`;
    tx.update(matchRef, { donationConfirmedAt: nowIso });
    tx.set(db.collection('donations').doc(matchRef.id), {
      donationId: matchRef.id,
      certificateId,
      donorId: match.donorId,
      donorName: match.donorName,
      requestId: match.requestId,
      patientName: match.patientName,
      hospitalName: match.hospitalName,
      hospitalPinCode: match.hospitalPinCode,
      bloodGroup: match.donorBloodGroup,
      unitsDonated: 1,
      donationType: 'Whole Blood',
      donatedAt: nowIso,
      bloodBankVerified: false,
      bloodBankDoctor: ''
    });
    tx.update(db.collection('donors').doc(match.donorId), {
      availability: 'unavailable',
      lastDonationDate: nowIso,
      cooldownUntil: new Date(now.getTime() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      totalCompleted: FieldValue.increment(1),
      updatedAt: nowIso
    });
  });
  await audit(uid, 'DONATION_CONFIRMED', `matches/${matchRef.id}`);
  return { success: true };
}
