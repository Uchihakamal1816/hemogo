import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { REGION } from '../config/firebase';
import { createOrder, handleWebhook, verifyPayment } from './subscriptionEngine';

const razorpayKeyId = defineSecret('RAZORPAY_KEY_ID');
const razorpayKeySecret = defineSecret('RAZORPAY_KEY_SECRET');
const razorpayWebhookSecret = defineSecret('RAZORPAY_WEBHOOK_SECRET');

function requireUid(request: { auth?: { uid: string } }): string {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Please sign in first.');
  return request.auth.uid;
}

export const createRazorpayOrder = onCall(
  { region: REGION, secrets: [razorpayKeyId, razorpayKeySecret] },
  (req) => createOrder(requireUid(req), razorpayKeyId.value(), razorpayKeySecret.value())
);

export const verifyRazorpayPayment = onCall(
  { region: REGION, secrets: [razorpayKeySecret] },
  (req) => verifyPayment(requireUid(req), razorpayKeySecret.value(), req.data)
);

export const razorpayWebhook = onRequest(
  { region: REGION, secrets: [razorpayWebhookSecret] },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }
    try {
      const status = await handleWebhook(req.rawBody, req.get('x-razorpay-signature'), razorpayWebhookSecret.value());
      res.status(status).json({ received: status === 200 });
    } catch (err) {
      console.error('Webhook processing error:', err);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);
