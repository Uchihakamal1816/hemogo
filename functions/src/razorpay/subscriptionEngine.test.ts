import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as crypto from 'crypto';
process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:1';
process.env.GCLOUD_PROJECT ||= 'demo-hemogo';
import { handleWebhook, hmacMatches } from './subscriptionEngine';

const sign = (body: string, secret: string) => crypto.createHmac('sha256', secret).update(body).digest('hex');

test('signature check accepts only the exact HMAC', () => {
  assert.equal(hmacMatches('a|b', 'secret', sign('a|b', 'secret')), true);
  assert.equal(hmacMatches('a|b', 'secret', sign('a|b', 'other')), false);
  assert.equal(hmacMatches('a|b', 'secret', 'mock_sig_123'), false);
  assert.equal(hmacMatches('a|b', 'secret', undefined), false);
});

test('an unset secret never verifies, even against its own empty-key HMAC', () => {
  assert.equal(hmacMatches('a|b', '', sign('a|b', '')), false);
});

test('forged webhooks are rejected before any processing', async () => {
  const body = Buffer.from(JSON.stringify({ event: 'order.paid' }));
  assert.equal(await handleWebhook(body, 'forged', 'secret'), 401);
  assert.equal(await handleWebhook(body, sign(body.toString(), 'secret'), ''), 401);
});

test('signed events unrelated to payment are acknowledged', async () => {
  const raw = JSON.stringify({ event: 'refund.created' });
  assert.equal(await handleWebhook(Buffer.from(raw), sign(raw, 'secret'), 'secret'), 200);
});
