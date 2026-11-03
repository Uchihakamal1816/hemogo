import { CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { REGION } from './config/firebase';
import { expireMemberships, runEscalations } from './matching/dispatch';
import {
  acceptMatch, closeRequest, confirmDonation, createBloodRequest as createRequest,
  registerDonor as register, rejectMatch, toggleAvailability
} from './requests/lifecycle';

function requireUid(request: CallableRequest): string {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Please sign in first.');
  return request.auth.uid;
}

function requirePhone(request: CallableRequest): string {
  const phone = request.auth?.token.phone_number;
  if (!phone) throw new HttpsError('failed-precondition', 'A verified phone number is required.');
  return phone;
}

const callable = { region: REGION };

export const registerDonor = onCall(callable, (req) =>
  register(requireUid(req), requirePhone(req), req.data));

export const toggleDonorAvailability = onCall(callable, (req) =>
  toggleAvailability(requireUid(req), req.data?.availability === 'available' ? 'available' : 'unavailable'));

export const createBloodRequest = onCall(callable, (req) =>
  createRequest(requireUid(req), requirePhone(req), req.data));

export const acceptBloodRequest = onCall(callable, (req) =>
  acceptMatch(requireUid(req), req.data?.matchId, req.data?.screeningResponses));

export const rejectBloodRequest = onCall(callable, (req) =>
  rejectMatch(requireUid(req), req.data?.matchId));

export const closeBloodRequest = onCall(callable, (req) =>
  closeRequest(requireUid(req), req.data?.requestId, req.data?.outcome));

export const confirmDonationCompleted = onCall(callable, (req) =>
  confirmDonation(requireUid(req), req.data?.matchId));

export const escalateRequests = onSchedule({ region: REGION, schedule: 'every 1 minutes' }, async () => {
  await runEscalations();
});

export const expirePremiumMemberships = onSchedule({ region: REGION, schedule: 'every 24 hours' }, async () => {
  await expireMemberships();
});

// Declaring these requires the Razorpay secrets to exist in the project,
// so add a project here only after its secrets are set.
const PAYMENTS_ENABLED_PROJECTS = ['demo-hemogo'];

if (PAYMENTS_ENABLED_PROJECTS.includes(process.env.GCLOUD_PROJECT || '')) {
  Object.assign(exports, require('./razorpay/handlers'));
}
