import * as functions from 'firebase-functions';
import cors from 'cors';
import { 
  handleToggleDonorAvailability, 
  runDonorMatchingAlgorithm, 
  handleAcceptBloodRequest, 
  handleRejectBloodRequest 
} from './donor/donorLogic';
import { 
  handleCreateRazorpayOrder, 
  handleVerifyRazorpayPayment 
} from './razorpay/subscriptionEngine';
import { db } from './config/firebase';

const corsHandler = cors({ origin: true });

// ============================================================================
// HemoGo Cloud Functions Exports
// ============================================================================

/**
 * Callable Function: Toggle Donor Availability ('available' | 'unavailable')
 */
export const toggleDonorAvailability = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be signed in.');
  }

  const availability = data.availability === 'available' ? 'available' : 'unavailable';
  return await handleToggleDonorAvailability(context.auth.uid, availability);
});

/**
 * Callable Function: Run Donor Matching Algorithm upon Emergency Blood Request
 */
export const triggerDonorMatching = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be signed in.');
  }

  const { requestId, bloodGroup, hospitalPinCode } = data;
  return await runDonorMatchingAlgorithm({
    requestId,
    bloodGroup,
    hospitalPinCode
  });
});

/**
 * Callable Function: Donor Accepts Emergency Blood Request with Preliminary Screening
 */
export const acceptBloodRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be signed in.');
  }

  const { matchId, screeningResponses } = data;
  return await handleAcceptBloodRequest(context.auth.uid, matchId, screeningResponses);
});

/**
 * Callable Function: Donor Rejects Emergency Blood Request
 */
export const rejectBloodRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be signed in.');
  }

  const { matchId } = data;
  return await handleRejectBloodRequest(context.auth.uid, matchId);
});

/**
 * Callable Function: Create Razorpay Order for ₹299/yr HemoGo Premium
 */
export const createRazorpayOrder = functions.https.onCall(async (_data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be signed in.');
  }

  return await handleCreateRazorpayOrder(context.auth.uid);
});

/**
 * Callable Function: Verify Razorpay Payment & Upgrade User + Donor Records
 */
export const verifyRazorpayPayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be signed in.');
  }

  return await handleVerifyRazorpayPayment(context.auth.uid, {
    razorpay_order_id: data.razorpay_order_id,
    razorpay_payment_id: data.razorpay_payment_id,
    razorpay_signature: data.razorpay_signature
  });
});

/**
 * HTTP Webhook: Razorpay Webhook Endpoint for background event verification
 */
export const razorpayWebhook = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const event = req.body;
      if (event?.event === 'payment.captured' || event?.event === 'order.paid') {
        const orderId = event.payload?.payment?.entity?.order_id || event.payload?.order?.entity?.id;
        if (orderId) {
          const subRef = db.collection('subscriptions').doc(orderId);
          const subDoc = await subRef.get();

          if (subDoc.exists && subDoc.data()?.paymentStatus !== 'paid') {
            const userId = subDoc.data()?.userId;
            const now = new Date();
            const expiry = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
            const nowIso = now.toISOString();

            await subRef.update({
              paymentStatus: 'paid',
              startDate: nowIso,
              expiryDate: expiry,
              updatedAt: nowIso
            });

            if (userId) {
              await db.collection('users').doc(userId).update({
                premiumStatus: true,
                premiumExpiry: expiry,
                updatedAt: nowIso
              });

              await db.collection('donors').doc(userId).update({
                premiumStatus: true,
                premiumExpiry: expiry,
                updatedAt: nowIso
              });
            }
          }
        }
      }

      res.status(200).json({ received: true });
    } catch (err: any) {
      console.error('Webhook processing error:', err);
      res.status(500).json({ error: err.message });
    }
  });
});
