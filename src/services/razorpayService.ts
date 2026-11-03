import { httpsCallable } from 'firebase/functions';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, functions } from '../config/firebase';
import type { SubscriptionRecord, UserProfile } from '../types/database';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const HEMOGO_PREMIUM_PLAN = {
  id: 'hemogo_premium_annual',
  name: 'HemoGo Premium',
  price: 299,
  period: 'year',
  amountPaise: 29900,
  features: [
    '⚡ Faster widening of your search when no donor has accepted yet (every 2 minutes instead of 5)',
    '🥇 Listed first when your donor profile matches a request',
    '📑 Tax invoice and donation records in one place'
  ]
};

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load the payment page. Please check your connection.'));
    document.body.appendChild(script);
  });
}

export function subscribeToUserSubscription(userId: string, callback: (sub: SubscriptionRecord | null) => void): () => void {
  const q = query(collection(db, 'subscriptions'), where('userId', '==', userId), where('paymentStatus', '==', 'paid'));
  return onSnapshot(q, (snap) => {
    const subs = snap.docs.map((d) => d.data() as SubscriptionRecord).sort((a, b) => b.expiryDate.localeCompare(a.expiryDate));
    callback(subs[0] || null);
  }, (err) => console.error('Subscription listener failed:', err));
}

export function subscribeToAllSubscriptions(callback: (subs: SubscriptionRecord[]) => void): () => void {
  const q = query(collection(db, 'subscriptions'), where('paymentStatus', '==', 'paid'));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => d.data() as SubscriptionRecord)),
    (err) => console.error('Admin subscription listener failed:', err));
}

/** Premium only activates after the server verifies the payment signature. */
export async function initiateSubscriptionCheckout(
  user: UserProfile,
  onSuccess: () => void,
  onError: (err: string) => void
): Promise<void> {
  try {
    await loadRazorpayScript();
    const createOrder = httpsCallable<void, { orderId: string; amount: number; currency: string; planName: string; keyId: string }>(functions, 'createRazorpayOrder');
    const { data: order } = await createOrder();

    const rzp = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: 'HemoGo',
      description: order.planName,
      order_id: order.orderId,
      prefill: { name: user.name, contact: user.phone, email: user.email || '' },
      theme: { color: '#dc2626' },
      handler: async (response: any) => {
        try {
          await httpsCallable(functions, 'verifyRazorpayPayment')(response);
          onSuccess();
        } catch {
          onError('Your payment was received but could not be confirmed yet. If Premium does not activate shortly, contact support with your payment ID.');
        }
      },
      modal: { ondismiss: () => onError('Payment was cancelled.') }
    });
    rzp.on('payment.failed', (res: any) => onError(res.error?.description || 'Payment failed.'));
    rzp.open();
  } catch (err: any) {
    onError(err.code === 'functions/not-found' ? 'Premium is not available yet. Emergency requests work without it.' : err.message || 'Could not start payment.');
  }
}
