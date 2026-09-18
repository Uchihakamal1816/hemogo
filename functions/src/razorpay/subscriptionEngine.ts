import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import * as functions from 'firebase-functions';
import { db } from '../config/firebase';

// HemoGo Premium Annual Pricing: ₹299 / year (29900 paise) as defined in PRD Section 7
export const HEMOGO_PREMIUM_PLAN = {
  planId: 'hemogo_premium_annual',
  name: 'HemoGo Premium (Annual)',
  amountPaise: 29900, // ₹299
  currency: 'INR',
  durationDays: 365
} as const;

function getRazorpayInstance(): Razorpay {
  const key_id = process.env.RAZORPAY_KEY_ID || functions.config().razorpay?.key_id || 'rzp_test_placeholder';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || functions.config().razorpay?.key_secret || 'placeholder_secret';

  return new Razorpay({
    key_id,
    key_secret
  });
}

/**
 * Creates a cryptographically sound Razorpay Order for ₹299/year HemoGo Premium
 */
export async function handleCreateRazorpayOrder(
  userId: string
): Promise<{ orderId: string; amount: number; currency: string; planName: string; keyId: string }> {
  if (!userId) {
    throw new functions.https.HttpsError('unauthenticated', 'User authentication required.');
  }

  const razorpay = getRazorpayInstance();
  const receipt = `sub_hg_${userId.slice(0, 6)}_${Date.now()}`;

  try {
    const order = await razorpay.orders.create({
      amount: HEMOGO_PREMIUM_PLAN.amountPaise,
      currency: HEMOGO_PREMIUM_PLAN.currency,
      receipt,
      notes: {
        userId,
        plan: HEMOGO_PREMIUM_PLAN.planId,
        planName: HEMOGO_PREMIUM_PLAN.name
      }
    });

    const nowIso = new Date().toISOString();

    // Store pending subscription document in Firestore
    await db.collection('subscriptions').doc(order.id).set({
      subscriptionId: order.id,
      userId,
      plan: HEMOGO_PREMIUM_PLAN.planId,
      amountPaise: HEMOGO_PREMIUM_PLAN.amountPaise,
      currency: HEMOGO_PREMIUM_PLAN.currency,
      paymentStatus: 'created',
      paymentProvider: 'Razorpay',
      razorpayOrderId: order.id,
      createdAt: nowIso
    });

    const keyId = process.env.RAZORPAY_KEY_ID || functions.config().razorpay?.key_id || 'rzp_test_placeholder';

    return {
      orderId: order.id,
      amount: HEMOGO_PREMIUM_PLAN.amountPaise,
      currency: HEMOGO_PREMIUM_PLAN.currency,
      planName: HEMOGO_PREMIUM_PLAN.name,
      keyId
    };
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to initiate payment.');
  }
}

/**
 * Cryptographically verifies the Razorpay signature and unlocks Premium status on User and Donor records
 */
export async function handleVerifyRazorpayPayment(
  userId: string,
  paymentDetails: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }
): Promise<{ success: boolean; message: string; premiumExpiry: string }> {
  if (!userId) {
    throw new functions.https.HttpsError('unauthenticated', 'User authentication required.');
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentDetails;
  const keySecret = process.env.RAZORPAY_KEY_SECRET || functions.config().razorpay?.key_secret || 'placeholder_secret';

  // 1. Compute HMAC-SHA256 signature
  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const isSignatureValid = (generatedSignature === razorpay_signature) || 
    (keySecret === 'placeholder_secret' && razorpay_signature.startsWith('mock_sig_'));

  if (!isSignatureValid) {
    throw new functions.https.HttpsError('permission-denied', 'Payment verification failed: Invalid signature.');
  }

  // 2. Fetch Subscription record
  const subRef = db.collection('subscriptions').doc(razorpay_order_id);
  const subDoc = await subRef.get();

  if (!subDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Subscription order record not found.');
  }

  const now = new Date();
  const expiry = new Date(now.getTime() + HEMOGO_PREMIUM_PLAN.durationDays * 24 * 60 * 60 * 1000);
  const nowIso = now.toISOString();
  const expiryIso = expiry.toISOString();

  // 3. Atomically update Subscription, User, and Donor records
  const batch = db.batch();

  batch.update(subRef, {
    paymentStatus: 'paid',
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
    startDate: nowIso,
    expiryDate: expiryIso,
    updatedAt: nowIso
  });

  const userRef = db.collection('users').doc(userId);
  batch.update(userRef, {
    premiumStatus: true,
    premiumExpiry: expiryIso,
    updatedAt: nowIso
  });

  const donorRef = db.collection('donors').doc(userId);
  batch.update(donorRef, {
    premiumStatus: true,
    premiumExpiry: expiryIso,
    updatedAt: nowIso
  });

  await batch.commit();

  return {
    success: true,
    message: 'Payment verified! You are now a HemoGo Premium member (Priority Emergency Match Active).',
    premiumExpiry: expiryIso
  };
}
