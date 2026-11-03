// End-to-end flow against the Firebase emulators. Run with: npm run test:e2e
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import crypto from 'node:crypto';
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInWithCustomToken } from 'firebase/auth';
import { collection, connectFirestoreEmulator, doc, getDoc, getDocs, getFirestore, query, serverTimestamp, addDoc, deleteDoc, setDoc, updateDoc, where } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';

const PROJECT = 'demo-hemogo';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.GCLOUD_PROJECT = PROJECT;
process.env.FUNCTIONS_EMULATOR = 'true';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
const require = createRequire(import.meta.url);
const { runEscalations } = require('../functions/lib/matching/dispatch.js');
const { getAuth: adminAuth } = require('../functions/node_modules/firebase-admin/lib/auth/index.js');

const unique = Date.now().toString().slice(-7);
const AUTH = 'http://127.0.0.1:9099';

async function signIn(phone) {
  const app = initializeApp({ apiKey: 'demo-key', projectId: PROJECT, appId: 'demo' }, phone);
  const auth = getAuth(app);
  connectAuthEmulator(auth, AUTH, { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  const fns = getFunctions(app, 'asia-south1');
  connectFunctionsEmulator(fns, '127.0.0.1', 5001);

  // The Node SDK cannot run the browser phone flow, so create the same verified-phone user directly.
  const created = await adminAuth().createUser({ phoneNumber: phone });
  const { user } = await signInWithCustomToken(auth, await adminAuth().createCustomToken(created.uid));
  const now = new Date().toISOString();
  await setDoc(doc(db, 'users', user.uid), {
    userId: user.uid, name: 'Member', phone, role: 'both', pinCode: '', verified: true,
    status: 'active', premiumStatus: false, createdAt: now, updatedAt: now
  });
  return { uid: user.uid, phone, db, call: (name, data) => httpsCallable(fns, name)(data).then((r) => r.data) };
}

const denied = (p) => assert.rejects(p, /permission|PERMISSION/);
const FIT = {
  feelingWell: true, recentDonation: false, hasInfectionSymptoms: false,
  takingMedications: false, previousDecline: false, willingForBloodBankScreening: true
};
const PIN = `56${unique.slice(0, 4)}`;
const FAR_PIN = `${PIN.slice(0, 3)}${(Number(PIN.slice(3)) + 1) % 1000}`.padEnd(6, '0');

let requester, nearDonor, farDonor, stranger, requestId, matchId;

before(async () => {
  [requester, nearDonor, farDonor, stranger] = await Promise.all(
    ['1', '2', '3', '4'].map((n) => signIn(`+9198${unique}${n}`))
  );
});

test('users cannot grant themselves admin or premium', async () => {
  const other = await signIn(`+9197${unique}9`);
  await denied(updateDoc(doc(other.db, 'users', other.uid), { role: 'admin' }));
  await denied(updateDoc(doc(other.db, 'users', other.uid), { premiumStatus: true }));
  await denied(setDoc(doc(other.db, 'users', 'someone-else'), { userId: 'someone-else', role: 'admin' }));
});

test('donors register and cannot read each other or skip server checks', async () => {
  const near = await nearDonor.call('registerDonor', { name: 'Near Donor', bloodGroup: 'O+', pinCode: PIN, consent: true });
  assert.equal(near.phone, nearDonor.phone);
  assert.equal(near.verificationStatus, false);
  await farDonor.call('registerDonor', { name: 'Far Donor', bloodGroup: 'O-', pinCode: FAR_PIN, consent: true });

  await denied(getDoc(doc(stranger.db, 'donors', nearDonor.uid)));
  await denied(getDocs(collection(stranger.db, 'donors')));
  await denied(updateDoc(doc(nearDonor.db, 'donors', nearDonor.uid), { availability: 'unavailable' }));
  await denied(updateDoc(doc(nearDonor.db, 'donors', nearDonor.uid), { premiumStatus: true }));
  await denied(setDoc(doc(stranger.db, 'donors', stranger.uid), { userId: stranger.uid, verificationStatus: true }));
  await denied(deleteDoc(doc(nearDonor.db, 'donors', nearDonor.uid)));
});

test('a request alerts the near donor immediately without exposing contacts', async () => {
  const { request, notifiedCount } = await requester.call('createBloodRequest', {
    patientName: 'Test Patient', bloodGroup: 'O+', hospitalName: 'Test Hospital', hospitalPinCode: PIN,
    unitsRequired: 2, urgency: 'critical', notes: ''
  });
  requestId = request.requestId;
  matchId = `${requestId}_${nearDonor.uid}`;
  assert.equal(notifiedCount, 1);
  assert.equal(request.requesterPhone, requester.phone);

  const seenByDonor = (await getDoc(doc(nearDonor.db, 'matches', matchId))).data();
  assert.equal(seenByDonor.response, 'PENDING');
  assert.equal(seenByDonor.requesterPhone, undefined);
  assert.equal(seenByDonor.patientName, undefined);

  // A requester learns nothing about a donor until that donor accepts.
  await denied(getDoc(doc(requester.db, 'matches', matchId)));

  await denied(getDoc(doc(nearDonor.db, 'bloodRequests', requestId)));
  await denied(getDoc(doc(stranger.db, 'bloodRequests', requestId)));
  await denied(getDoc(doc(stranger.db, 'matches', matchId)));
  await denied(updateDoc(doc(nearDonor.db, 'matches', matchId), { response: 'ACCEPTED' }));
});

test('chat stays closed before acceptance', async () => {
  await denied(addDoc(collection(requester.db, 'chats', matchId, 'messages'), {
    matchId, senderId: requester.uid, text: 'hi', createdAt: serverTimestamp()
  }));
});

test('search widens to farther donors after the wait', async () => {
  await runEscalations(new Date(Date.now() + 6 * 60 * 1000));
  const far = await getDoc(doc(farDonor.db, 'matches', `${requestId}_${farDonor.uid}`));
  assert.equal(far.exists(), true);
  assert.equal(far.data().locationMatch, 'RADIUS_EXPANDED');
  const req = (await getDoc(doc(requester.db, 'bloodRequests', requestId))).data();
  assert.equal(req.notifiedDonorsCount, 2);
  assert.ok(req.searchTier >= 1);
});

test('failed screening blocks acceptance', async () => {
  await assert.rejects(nearDonor.call('acceptBloodRequest', { matchId, screeningResponses: { ...FIT, hasInfectionSymptoms: true } }), /infection/);
  await assert.rejects(stranger.call('acceptBloodRequest', { matchId, screeningResponses: FIT }), /Invalid match/);
});

test('acceptance reveals contacts both ways and keeps health answers private', async () => {
  await nearDonor.call('acceptBloodRequest', { matchId, screeningResponses: FIT });
  const m = (await getDoc(doc(requester.db, 'matches', matchId))).data();
  assert.equal(m.donorPhone, nearDonor.phone);
  assert.equal(m.requesterPhone, requester.phone);
  await assert.rejects(nearDonor.call('acceptBloodRequest', { matchId, screeningResponses: FIT }), /no longer open/);
  await denied(getDoc(doc(requester.db, 'screenings', matchId)));
  await denied(getDoc(doc(nearDonor.db, 'screenings', matchId)));
  assert.equal((await getDoc(doc(requester.db, 'bloodRequests', requestId))).data().status, 'CONTACT_SHARED');
});

test('chat and location work only between the matched pair', async () => {
  await addDoc(collection(requester.db, 'chats', matchId, 'messages'), {
    matchId, senderId: requester.uid, senderName: 'R', text: 'Please hurry', createdAt: serverTimestamp()
  });
  const seen = await getDocs(collection(nearDonor.db, 'chats', matchId, 'messages'));
  assert.equal(seen.docs[0].data().text, 'Please hurry');
  await denied(getDocs(collection(stranger.db, 'chats', matchId, 'messages')));
  await denied(addDoc(collection(nearDonor.db, 'chats', matchId, 'messages'), {
    matchId, senderId: requester.uid, text: 'spoofed', createdAt: serverTimestamp()
  }));

  await setDoc(doc(nearDonor.db, 'locations', matchId), { currentLat: 12.9, currentLng: 77.6 });
  assert.equal((await getDoc(doc(requester.db, 'locations', matchId))).data().currentLat, 12.9);
  await denied(getDoc(doc(stranger.db, 'locations', matchId)));
  await denied(setDoc(doc(requester.db, 'locations', matchId), { currentLat: 0 }));
});

test('confirmed donation starts the cooldown, which the donor cannot bypass', async () => {
  await assert.rejects(stranger.call('confirmDonationCompleted', { matchId }), /not your match/);
  await requester.call('confirmDonationCompleted', { matchId });
  const donor = (await getDoc(doc(nearDonor.db, 'donors', nearDonor.uid))).data();
  assert.equal(donor.availability, 'unavailable');
  assert.equal(donor.totalCompleted, 1);
  assert.equal(donor.totalAccepted, 1);
  assert.ok(new Date(donor.cooldownUntil) > new Date(Date.now() + 89 * 864e5));
  await assert.rejects(nearDonor.call('toggleDonorAvailability', { availability: 'available' }), /recovery period/);
  const donations = await getDocs(query(collection(nearDonor.db, 'donations'), where('donorId', '==', nearDonor.uid)));
  assert.equal(donations.size, 1);
});

test('closing a request ends open alerts', async () => {
  await assert.rejects(stranger.call('closeBloodRequest', { requestId, outcome: 'FULFILLED' }), /not your request/);
  await requester.call('closeBloodRequest', { requestId, outcome: 'FULFILLED' });
  const far = (await getDoc(doc(farDonor.db, 'matches', `${requestId}_${farDonor.uid}`))).data();
  assert.equal(far.response, 'EXPIRED');
  await assert.rejects(farDonor.call('acceptBloodRequest', { matchId: far.matchId, screeningResponses: FIT }), /no longer open/);
});

test('payments: forged signatures fail and a signed webhook activates once', async () => {
  const webhook = `http://127.0.0.1:5001/${PROJECT}/asia-south1/razorpayWebhook`;
  const { getFirestore: adminDb } = require('../functions/node_modules/firebase-admin/lib/firestore/index.js');
  const orderId = `order_${unique}`;
  await adminDb().collection('subscriptions').doc(orderId).set({
    subscriptionId: orderId, userId: stranger.uid, paymentStatus: 'created', amountPaise: 29900, createdAt: new Date().toISOString()
  });

  await assert.rejects(stranger.call('verifyRazorpayPayment', { razorpay_order_id: orderId, razorpay_payment_id: 'pay_1', razorpay_signature: 'mock_sig_1' }), /verification failed/);

  const body = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_1', order_id: orderId, amount: 29900 } } } });
  const post = (signature) => fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': signature }, body });
  assert.equal((await post('forged')).status, 401);
  assert.equal((await getDoc(doc(stranger.db, 'users', stranger.uid))).data().premiumStatus, false);

  const good = crypto.createHmac('sha256', 'local_webhook_secret').update(body).digest('hex');
  assert.equal((await post(good)).status, 200);
  const first = (await getDoc(doc(stranger.db, 'users', stranger.uid))).data();
  assert.equal(first.premiumStatus, true);
  assert.equal((await post(good)).status, 200);
  assert.equal((await getDoc(doc(stranger.db, 'users', stranger.uid))).data().premiumExpiry, first.premiumExpiry);

  // Someone else's valid signature cannot claim this order.
  const sig = crypto.createHmac('sha256', 'local_key_secret').update(`${orderId}|pay_2`).digest('hex');
  await assert.rejects(requester.call('verifyRazorpayPayment', { razorpay_order_id: orderId, razorpay_payment_id: 'pay_2', razorpay_signature: sig }), /another user/);
});

test('over-acceptance is blocked, withdrawal reopens the slot, and closing ends contact', async () => {
  const pin = `57${unique.slice(0, 4)}`;
  const [req, a, b] = await Promise.all(['6', '7', '8'].map((n) => signIn(`+9195${unique}${n}`)));
  for (const d of [a, b]) await d.call('registerDonor', { name: 'D', bloodGroup: 'O+', pinCode: pin, consent: true });
  const { request } = await req.call('createBloodRequest', {
    patientName: 'P', bloodGroup: 'O+', hospitalName: 'H', hospitalPinCode: pin, unitsRequired: 1, urgency: 'critical'
  });
  const idOf = (d) => `${request.requestId}_${d.uid}`;

  await a.call('acceptBloodRequest', { matchId: idOf(a), screeningResponses: FIT });
  await assert.rejects(b.call('acceptBloodRequest', { matchId: idOf(b), screeningResponses: FIT }), /Enough donors/);
  assert.equal((await getDoc(doc(b.db, 'matches', idOf(b)))).data().requesterPhone, undefined);

  await a.call('withdrawFromRequest', { matchId: idOf(a) });
  const reopened = (await getDoc(doc(req.db, 'bloodRequests', request.requestId))).data();
  assert.equal(reopened.acceptedDonorsCount, 0);
  assert.equal(reopened.status, 'DONORS_NOTIFIED');
  assert.ok(reopened.nextEscalationAt <= new Date().toISOString());
  const gone = (await getDoc(doc(a.db, 'matches', idOf(a)))).data();
  assert.equal(gone.response, 'WITHDRAWN');
  assert.equal(gone.requesterPhone, undefined);
  await denied(getDoc(doc(req.db, 'matches', idOf(a))));

  await b.call('acceptBloodRequest', { matchId: idOf(b), screeningResponses: FIT });
  assert.equal((await getDoc(doc(req.db, 'matches', idOf(b)))).data().donorPhone, b.phone);
  await setDoc(doc(b.db, 'locations', idOf(b)), { currentLat: 1, currentLng: 2 });

  await req.call('closeBloodRequest', { requestId: request.requestId, outcome: 'CANCELLED' });
  const closed = (await getDoc(doc(req.db, 'matches', idOf(b)))).data();
  assert.equal(closed.donorPhone, undefined);
  assert.equal(closed.requesterPhone, undefined);
  await denied(getDoc(doc(req.db, 'locations', idOf(b))));
  await denied(setDoc(doc(b.db, 'locations', idOf(b)), { currentLat: 3 }));
  await denied(addDoc(collection(req.db, 'chats', idOf(b), 'messages'), {
    matchId: idOf(b), senderId: req.uid, text: 'late', createdAt: serverTimestamp()
  }));
});

test('non-string PINs and prototype keys are rejected', async () => {
  const u = await signIn(`+9194${unique}5`);
  await assert.rejects(u.call('registerDonor', { name: 'N', bloodGroup: 'O+', pinCode: 560001, consent: true }), /PIN/);
  await assert.rejects(u.call('registerDonor', { name: 'N', bloodGroup: '__proto__', pinCode: '560001', consent: true }), /blood group/);
  await assert.rejects(u.call('createBloodRequest', { patientName: 'P', bloodGroup: 'constructor', hospitalName: 'H', hospitalPinCode: '560001', unitsRequired: 1 }), /blood group/);
});

test('rate limit stops request spam', async () => {
  const data = { patientName: 'P', bloodGroup: 'A+', hospitalName: 'H', hospitalPinCode: '999999', unitsRequired: 1, urgency: 'critical' };
  const spammer = await signIn(`+9196${unique}8`);
  for (let i = 0; i < 3; i++) await spammer.call('createBloodRequest', data);
  await assert.rejects(spammer.call('createBloodRequest', data), /3 open requests/);
});
