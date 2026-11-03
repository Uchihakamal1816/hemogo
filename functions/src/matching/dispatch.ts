import { FieldValue } from 'firebase-admin/firestore';
import { db, messaging } from '../config/firebase';
import {
  BLOOD_COMPATIBILITY, MAX_TIER, NEIGHBOR_PIN_MAP, classifyLocation, escalationDelayMs,
  isOnCooldown, isPremiumActive, pinPrefixForTier, priorityScore
} from './logic';

export const ACTIVE_STATUSES = ['SEARCHING', 'DONORS_NOTIFIED', 'CONTACT_SHARED'];

const BATCH_LIMIT = 400;

async function commitInChunks(writes: ((batch: FirebaseFirestore.WriteBatch) => void)[]) {
  for (let i = 0; i < writes.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    writes.slice(i, i + BATCH_LIMIT).forEach((write) => write(batch));
    await batch.commit();
  }
}

export async function audit(actorId: string, action: string, targetResource: string, details = '') {
  await db.collection('auditLogs').add({
    actorId, action, targetResource, details, timestamp: new Date().toISOString()
  });
}

async function queryDonors(bloodGroup: string, hospitalPin: string, tier: number) {
  const base = db.collection('donors')
    .where('availability', '==', 'available')
    .where('bloodGroup', 'in', BLOOD_COMPATIBILITY[bloodGroup]);

  if (tier === 0) {
    const pins = [hospitalPin, ...(NEIGHBOR_PIN_MAP[hospitalPin] || [])];
    const snaps = await Promise.all(pins.map((pin) => base.where('pinCode', '==', pin).get()));
    return snaps.flatMap((snap) => snap.docs);
  }

  const prefix = pinPrefixForTier(hospitalPin, tier);
  const snap = await base.where('pinCode', '>=', prefix).where('pinCode', '<', `${prefix}`).get();
  return snap.docs;
}

/** Sends data-only web pushes to users and prunes tokens that no longer work. Returns users reached. */
export async function pushToUsers(userIds: string[], data: Record<string, string>): Promise<number> {
  if (process.env.FUNCTIONS_EMULATOR === 'true' || userIds.length === 0) return 0;

  let reached = 0;
  await Promise.all(userIds.map(async (userId) => {
    const ref = db.collection('deviceTokens').doc(userId);
    const tokens: string[] = (await ref.get()).data()?.tokens || [];
    if (tokens.length === 0) return;

    try {
      const res = await messaging.sendEachForMulticast({
        tokens,
        data,
        webpush: { headers: { Urgency: 'high', TTL: '3600' } }
      });
      if (res.successCount > 0) reached++;

      const dead = tokens.filter((_, i) => {
        const code = res.responses[i].error?.code;
        return code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-argument';
      });
      if (dead.length > 0) await ref.update({ tokens: FieldValue.arrayRemove(...dead) });
    } catch (err) {
      console.error('Push failed for user', userId, err);
    }
  }));
  return reached;
}

/** Matches and alerts donors for one search tier. Deterministic match IDs make it safe to retry. */
export async function dispatchTier(requestId: string, tier: number): Promise<number> {
  const requestRef = db.collection('bloodRequests').doc(requestId);
  const request = (await requestRef.get()).data();
  if (!request || !ACTIVE_STATUSES.includes(request.status)) return 0;

  const existing = await db.collection('matches').where('requestId', '==', requestId).get();
  const alreadyMatched = new Set(existing.docs.map((d) => d.data().donorId));
  const donorDocs = await queryDonors(request.bloodGroup, request.hospitalPinCode, tier);

  const now = new Date();
  const nowIso = now.toISOString();
  const writes: ((batch: FirebaseFirestore.WriteBatch) => void)[] = [];
  const alerts: { donorId: string; matchId: string; score: number }[] = [];

  for (const doc of donorDocs) {
    const donor = doc.data();
    if (doc.id === request.requesterId || alreadyMatched.has(doc.id) || isOnCooldown(donor.cooldownUntil, now)) continue;
    alreadyMatched.add(doc.id);

    const location = classifyLocation(request.hospitalPinCode, donor.pinCode);
    const premium = isPremiumActive(donor, now);
    const score = priorityScore(premium, location);
    const matchRef = db.collection('matches').doc(`${requestId}_${doc.id}`);

    writes.push((batch) => batch.set(matchRef, {
      matchId: matchRef.id,
      requestId,
      requesterId: request.requesterId,
      donorId: doc.id,
      donorBloodGroup: donor.bloodGroup,
      donorPinCode: donor.pinCode,
      isPremiumDonor: premium,
      priorityScore: score,
      locationMatch: location,
      response: 'PENDING',
      createdAt: nowIso,
      requestedBloodGroup: request.bloodGroup,
      hospitalName: request.hospitalName,
      hospitalPinCode: request.hospitalPinCode,
      hospitalLat: request.hospitalLat ?? null,
      hospitalLng: request.hospitalLng ?? null,
      unitsRequired: request.unitsRequired,
      urgency: request.urgency
    }));
    writes.push((batch) => batch.update(doc.ref, {
      lastNotificationDate: nowIso,
      totalRequestsReceived: FieldValue.increment(1),
      updatedAt: nowIso
    }));
    alerts.push({ donorId: doc.id, matchId: matchRef.id, score });
  }

  await commitInChunks(writes);

  alerts.sort((a, b) => b.score - a.score);
  const reachedCounts = await Promise.all(alerts.map(({ donorId, matchId }) => pushToUsers([donorId], {
    type: 'EMERGENCY_DISPATCH',
    title: `Urgent: ${request.bloodGroup} blood needed`,
    body: `${request.hospitalName}, PIN ${request.hospitalPinCode}. Tap to respond.`,
    requestId,
    matchId,
    webRoute: `/?tab=donor_dashboard&matchId=${matchId}`
  })));
  const pushDelivered = reachedCounts.reduce((sum, n) => sum + n, 0);

  const totalNotified = (request.notifiedDonorsCount || 0) + alerts.length;
  const update: Record<string, unknown> = {
    searchTier: tier,
    notifiedDonorsCount: totalNotified,
    pushDeliveredCount: FieldValue.increment(pushDelivered),
    updatedAt: nowIso,
    nextEscalationAt: tier < MAX_TIER
      ? new Date(now.getTime() + escalationDelayMs(Boolean(request.requesterIsPremium))).toISOString()
      : request.expiresAt
  };
  if (request.status === 'SEARCHING' && totalNotified > 0) update.status = 'DONORS_NOTIFIED';
  await requestRef.update(update);

  await audit('system', 'MATCH_DISPATCH', `bloodRequests/${requestId}`, `tier ${tier}: ${alerts.length} donors`);
  return alerts.length;
}

/** Closes pending matches so donors stop seeing a request that is over. */
export async function expirePendingMatches(requestId: string) {
  const pending = await db.collection('matches')
    .where('requestId', '==', requestId).where('response', '==', 'PENDING').get();
  await commitInChunks(pending.docs.map((d) => (batch) => batch.update(d.ref, { response: 'EXPIRED' })));
}

/** Widens searches that are still short of donors and expires old requests. */
export async function runEscalations(now = new Date()) {
  const due = await db.collection('bloodRequests')
    .where('status', 'in', ACTIVE_STATUSES)
    .where('nextEscalationAt', '<=', now.toISOString())
    .limit(100).get();

  await Promise.all(due.docs.map(async (doc) => {
    const request = doc.data();
    if (new Date(request.expiresAt) <= now) {
      await doc.ref.update({ status: 'EXPIRED', updatedAt: now.toISOString() });
      await expirePendingMatches(doc.id);
    } else if ((request.acceptedDonorsCount || 0) >= request.unitsRequired || request.searchTier >= MAX_TIER) {
      await doc.ref.update({ nextEscalationAt: request.expiresAt });
    } else {
      await dispatchTier(doc.id, request.searchTier + 1);
    }
  }));
}

export async function expireMemberships(now = new Date()) {
  const nowIso = now.toISOString();
  const expired = await db.collection('users')
    .where('premiumStatus', '==', true).where('premiumExpiry', '<=', nowIso).get();
  const writes: ((batch: FirebaseFirestore.WriteBatch) => void)[] = [];
  for (const doc of expired.docs) {
    writes.push((batch) => batch.update(doc.ref, { premiumStatus: false, updatedAt: nowIso }));
    const donorRef = db.collection('donors').doc(doc.id);
    if ((await donorRef.get()).exists) {
      writes.push((batch) => batch.update(donorRef, { premiumStatus: false, updatedAt: nowIso }));
    }
  }
  await commitInChunks(writes);
}

