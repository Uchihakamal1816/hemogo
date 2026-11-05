import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import { HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase';
import { audit } from '../matching/dispatch';

export const HEMOGO_PREMIUM_PLAN = {
  planId: 'hemogo_premium_annual',
  name: 'HemoGo Premium (Annual)',
  amountPaise: 29900,
  baseAmountPaise: 25339,
  gstAmountPaise: 4561,
  currency: 'INR',
  durationDays: 365
} as const;

export function hmacMatches(message: string | Buffer, secret: string, signature: unknown): boolean {
  if (!secret || typeof signature !== 'string') return false;
  const expected = Buffer.from(crypto.createHmac('sha256', secret).update(message).digest('hex'));
  const received = Buffer.from(signature);
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

export async function createOrder(uid: string, keyId: string, keySecret: string) {
  if (!keyId || !keySecret) throw new HttpsError('failed-precondition', 'Payments are not configured.');

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  const order = await razorpay.orders.create({
    amount: HEMOGO_PREMIUM_PLAN.amountPaise,
    currency: HEMOGO_PREMIUM_PLAN.currency,
    receipt: `hg_${uid.slice(0, 8)}_${Date.now()}`,
    notes: { userId: uid, plan: HEMOGO_PREMIUM_PLAN.planId }
  });

  await db.collection('subscriptions').doc(order.id).set({
    subscriptionId: order.id,
    userId: uid,
    plan: HEMOGO_PREMIUM_PLAN.planId,
    amountPaise: HEMOGO_PREMIUM_PLAN.amountPaise,
    baseAmountPaise: HEMOGO_PREMIUM_PLAN.baseAmountPaise,
    gstAmountPaise: HEMOGO_PREMIUM_PLAN.gstAmountPaise,
    currency: HEMOGO_PREMIUM_PLAN.currency,
    paymentStatus: 'created',
    paymentProvider: 'Razorpay',
    razorpayOrderId: order.id,
    createdAt: new Date().toISOString()
  });

  return {
    orderId: order.id,
    amount: HEMOGO_PREMIUM_PLAN.amountPaise,
    currency: HEMOGO_PREMIUM_PLAN.currency,
    planName: HEMOGO_PREMIUM_PLAN.name,
    keyId
  };
}

/** Idempotent: the client callback and the webhook can both arrive for one order. */
export async function activateSubscription(orderId: string, paymentId: string, expectedUserId?: string) {
  const subRef = db.collection('subscriptions').doc(orderId);
  const counterRef = db.collection('counters').doc('invoices');

  const expiry = await db.runTransaction(async (tx) => {
    const sub = (await tx.get(subRef)).data();
    if (!sub) throw new HttpsError('not-found', 'Order not found.');
    if (expectedUserId && sub.userId !== expectedUserId) throw new HttpsError('permission-denied', 'This order belongs to another user.');
    if (sub.paymentStatus === 'paid') return sub.expiryDate as string;

    const userRef = db.collection('users').doc(sub.userId);
    const donorRef = db.collection('donors').doc(sub.userId);
    const [userSnap, donorSnap, counterSnap] = await Promise.all([tx.get(userRef), tx.get(donorRef), tx.get(counterRef)]);
    const user = userSnap.data() || {};

    const now = new Date();
    const currentExpiry = user.premiumExpiry ? new Date(user.premiumExpiry) : now;
    const start = currentExpiry > now ? currentExpiry : now;
    const expiryIso = new Date(start.getTime() + HEMOGO_PREMIUM_PLAN.durationDays * 24 * 60 * 60 * 1000).toISOString();
    const nowIso = now.toISOString();

    const invoiceSeq = (counterSnap.data()?.next || 1) as number;
    tx.set(counterRef, { next: invoiceSeq + 1 }, { merge: true });

    tx.update(subRef, {
      paymentStatus: 'paid',
      razorpayPaymentId: paymentId,
      invoiceNumber: `INV-HG-${now.getFullYear()}-${String(invoiceSeq).padStart(6, '0')}`,
      donorName: user.name || '',
      donorPhone: user.phone || '',
      donorEmail: user.email || '',
      startDate: nowIso,
      expiryDate: expiryIso,
      updatedAt: nowIso
    });
    tx.update(userRef, { premiumStatus: true, premiumExpiry: expiryIso, updatedAt: nowIso });
    if (donorSnap.exists) tx.update(donorRef, { premiumStatus: true, premiumExpiry: expiryIso, updatedAt: nowIso });
    return expiryIso;
  });

  await audit(expectedUserId || 'razorpay_webhook', 'PREMIUM_ACTIVATED', `subscriptions/${orderId}`);
  return expiry;
}

export async function verifyPayment(uid: string, keySecret: string, details: any) {
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = details || {};
  if (typeof orderId !== 'string' || typeof paymentId !== 'string') throw new HttpsError('invalid-argument', 'Incomplete payment details.');
  if (!hmacMatches(`${orderId}|${paymentId}`, keySecret, signature)) {
    throw new HttpsError('permission-denied', 'Payment verification failed.');
  }
  const premiumExpiry = await activateSubscription(orderId, paymentId, uid);
  return { success: true, premiumExpiry };
}

export async function handleWebhook(rawBody: Buffer, signature: unknown, webhookSecret: string): Promise<number> {
  if (!hmacMatches(rawBody, webhookSecret, signature)) return 401;

  const event = JSON.parse(rawBody.toString('utf8'));
  if (event?.event === 'payment.captured' || event?.event === 'order.paid') {
    const payment = event.payload?.payment?.entity;
    const orderId = payment?.order_id || event.payload?.order?.entity?.id;
    if (orderId && payment?.id && payment.amount === HEMOGO_PREMIUM_PLAN.amountPaise) {
      try {
        await activateSubscription(orderId, payment.id);
      } catch (err) {
        if (!(err instanceof HttpsError && err.code === 'not-found')) throw err;
      }
    }
  }
  return 200;
}
