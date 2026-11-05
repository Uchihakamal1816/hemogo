import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BLOOD_COMPATIBILITY, classifyLocation, escalationDelayMs, isOnCooldown, isPremiumActive,
  pinPrefixForTier, priorityScore, screeningFailure
} from './logic';

const fit = {
  feelingWell: true, recentDonation: false, hasInfectionSymptoms: false,
  takingMedications: false, previousDecline: false, willingForBloodBankScreening: true
};

test('O- patients can only receive O-', () => {
  assert.deepEqual(BLOOD_COMPATIBILITY['O-'], ['O-']);
  assert.equal(BLOOD_COMPATIBILITY['AB+'].length, 8);
});

test('search widens by PIN prefix', () => {
  assert.equal(pinPrefixForTier('530016', 1), '53001');
  assert.equal(pinPrefixForTier('530016', 3), '530');
});

test('location and score ordering', () => {
  assert.equal(classifyLocation('530016', '530016'), 'SAME_PIN');
  assert.equal(classifyLocation('530016', '530013'), 'NEIGHBOR_PIN');
  assert.equal(classifyLocation('530016', '530099'), 'RADIUS_EXPANDED');
  assert.ok(priorityScore(true, 'SAME_PIN') > priorityScore(true, 'NEIGHBOR_PIN'));
  assert.ok(priorityScore(false, 'NEIGHBOR_PIN') > priorityScore(true, 'RADIUS_EXPANDED'));
});

test('members widen sooner but everyone has a bounded wait', () => {
  assert.ok(escalationDelayMs(true) < escalationDelayMs(false));
  assert.ok(escalationDelayMs(false) <= 5 * 60 * 1000);
});

test('expired premium and cooldown are inactive', () => {
  const now = new Date('2026-11-03T00:00:00Z');
  assert.equal(isPremiumActive({ premiumStatus: true, premiumExpiry: '2026-11-02T00:00:00Z' }, now), false);
  assert.equal(isPremiumActive({ premiumStatus: true, premiumExpiry: '2026-11-04T00:00:00Z' }, now), true);
  assert.equal(isOnCooldown('2026-11-04T00:00:00Z', now), true);
  assert.equal(isOnCooldown(null, now), false);
});

test('screening rejects each disqualifying answer', () => {
  assert.equal(screeningFailure(fit), null);
  assert.ok(screeningFailure(undefined));
  assert.ok(screeningFailure({ ...fit, feelingWell: false }));
  assert.ok(screeningFailure({ ...fit, recentDonation: true }));
  assert.ok(screeningFailure({ ...fit, hasInfectionSymptoms: true }));
  assert.ok(screeningFailure({ ...fit, takingMedications: true }));
  assert.ok(screeningFailure({ ...fit, previousDecline: true }));
  assert.ok(screeningFailure({ ...fit, willingForBloodBankScreening: false }));
});
