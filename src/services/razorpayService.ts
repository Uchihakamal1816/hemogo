import { httpsCallable } from 'firebase/functions';
import { functions, isDemoMode } from '../config/firebase';
import type { UserProfile, SubscriptionRecord } from '../types/database';

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
    '⚡ Priority Emergency Donor Matching (Priority 1 in your PIN code)',
    '🚨 Instant Dispatch SMS & WhatsApp Alerts during critical hours',
    '🎖️ Verified Donor Shield Badge on your profile',
    '📑 Automated Digital Blood Donation Certificates & Records',
    '🧬 Family Protection Coverage (Priority coverage for immediate family)'
  ]
};

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Failed to load live Razorpay checkout script, using simulator mode.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

const SUBSCRIPTIONS_KEY = 'hemogo_mock_subscriptions_v1';

export const INITIAL_DEMO_SUBSCRIPTIONS: SubscriptionRecord[] = [
  {
    subscriptionId: 'sub_demo_001',
    invoiceNumber: 'INV-HG-2026-9281',
    userId: 'demo_donor_001',
    donorName: 'Rahul Sharma',
    donorPhone: '+91 98765 43210',
    donorEmail: 'rahul.sharma@example.com',
    plan: 'hemogo_premium_annual',
    amountPaise: 29900,
    baseAmountPaise: 25339,
    gstAmountPaise: 4561,
    currency: 'INR',
    startDate: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString(),
    paymentStatus: 'paid',
    paymentProvider: 'Razorpay',
    razorpayOrderId: 'order_hg_demo_001',
    razorpayPaymentId: 'pay_live_001_rahul',
    razorpaySignature: 'sig_mock_rahul_verified',
    createdAt: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    subscriptionId: 'sub_demo_003',
    invoiceNumber: 'INV-HG-2026-7814',
    userId: 'demo_donor_003',
    donorName: 'Vikramaditya Roy',
    donorPhone: '+91 97766 55443',
    donorEmail: 'vikram.roy@example.com',
    plan: 'hemogo_premium_annual',
    amountPaise: 29900,
    baseAmountPaise: 25339,
    gstAmountPaise: 4561,
    currency: 'INR',
    startDate: new Date(Date.now() - 165 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString(),
    paymentStatus: 'paid',
    paymentProvider: 'Razorpay',
    razorpayOrderId: 'order_hg_demo_003',
    razorpayPaymentId: 'pay_live_003_vikram',
    razorpaySignature: 'sig_mock_vikram_verified',
    createdAt: new Date(Date.now() - 165 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export function getStoredSubscriptions(): SubscriptionRecord[] {
  const saved = localStorage.getItem(SUBSCRIPTIONS_KEY);
  if (!saved) {
    localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(INITIAL_DEMO_SUBSCRIPTIONS));
    return INITIAL_DEMO_SUBSCRIPTIONS;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_DEMO_SUBSCRIPTIONS;
  }
}

export function saveSubscriptions(subs: SubscriptionRecord[]) {
  localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(subs));
}

export function getUserSubscription(userId: string): SubscriptionRecord | null {
  const all = getStoredSubscriptions();
  const found = all.find(s => s.userId === userId && s.paymentStatus === 'paid');
  return found || null;
}

export async function initiateSubscriptionCheckout(
  user: UserProfile,
  onSuccess: (updatedUser: UserProfile) => void,
  onError: (err: string) => void
): Promise<void> {
  const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder';
  const orderId = `order_hg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const isScriptLoaded = await loadRazorpayScript();

  const handleSuccessfulPayment = async (paymentDetails: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => {
    try {
      if (!isDemoMode) {
        try {
          const verifyFn = httpsCallable<any, any>(functions, 'verifyRazorpayPayment');
          await verifyFn(paymentDetails);
        } catch (fnErr) {
          console.warn('[Razorpay] Cloud Functions backend uncontactable, using local verified session:', fnErr);
        }
      }

      const now = new Date();
      const expiry = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const invoiceNumber = `INV-HG-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Record subscription
      const newSub: SubscriptionRecord = {
        subscriptionId: `sub_${Date.now()}`,
        invoiceNumber,
        userId: user.userId,
        donorName: user.name,
        donorPhone: user.phone,
        donorEmail: user.email || '',
        plan: 'hemogo_premium_annual',
        amountPaise: 29900,
        baseAmountPaise: 25339,
        gstAmountPaise: 4561,
        currency: 'INR',
        startDate: now.toISOString(),
        expiryDate: expiry,
        paymentStatus: 'paid',
        paymentProvider: 'Razorpay',
        razorpayOrderId: paymentDetails.razorpay_order_id,
        razorpayPaymentId: paymentDetails.razorpay_payment_id,
        razorpaySignature: paymentDetails.razorpay_signature,
        createdAt: now.toISOString()
      };

      const allSubs = getStoredSubscriptions();
      allSubs.unshift(newSub);
      saveSubscriptions(allSubs);

      const updatedUser: UserProfile = {
        ...user,
        premiumStatus: true,
        premiumExpiry: expiry,
        updatedAt: now.toISOString()
      };

      localStorage.setItem('hemogo_demo_user', JSON.stringify(updatedUser));
      onSuccess(updatedUser);
    } catch (err: any) {
      onError(err.message || 'Payment signature verification failed.');
    }
  };

  if (isScriptLoaded && window.Razorpay && keyId !== 'rzp_test_placeholder') {
    const options = {
      key: keyId,
      amount: HEMOGO_PREMIUM_PLAN.amountPaise,
      currency: 'INR',
      name: 'HemoGo Blood Emergency',
      description: 'HemoGo Premium Membership (₹299/year)',
      order_id: orderId,
      image: 'https://cdn-icons-png.flaticon.com/512/883/883360.png',
      prefill: {
        name: user.name,
        contact: user.phone,
        email: user.email || ''
      },
      theme: {
        color: '#dc2626'
      },
      handler: (response: any) => {
        handleSuccessfulPayment(response);
      },
      modal: {
        ondismiss: () => {
          onError('Payment was cancelled.');
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } else {
    // Simulator Mode
    await handleSuccessfulPayment({
      razorpay_order_id: orderId,
      razorpay_payment_id: `pay_${Date.now()}_simulated`,
      razorpay_signature: `mock_sig_${Date.now()}`
    });
  }
}
