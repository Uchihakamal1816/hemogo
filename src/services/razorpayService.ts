import { httpsCallable } from 'firebase/functions';
import { functions, isDemoMode } from '../config/firebase';
import type { UserProfile } from '../types/database';

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
        const verifyFn = httpsCallable<any, any>(functions, 'verifyRazorpayPayment');
        await verifyFn(paymentDetails);
      }

      const now = new Date();
      const expiry = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
      
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
