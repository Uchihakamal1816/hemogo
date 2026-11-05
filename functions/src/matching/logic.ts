// Pure matching rules, kept free of Firebase so they can be unit tested.

export const BLOOD_COMPATIBILITY: Record<string, string[]> = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-']
};

export const NEIGHBOR_PIN_MAP: Record<string, string[]> = {
  '530016': ['530013', '530017', '530020', '530003'],
  '560038': ['560008', '560075', '560034', '560001'],
  '560034': ['560095', '560068', '560038', '560047'],
  '600040': ['600102', '600101', '600049', '600030'],
  '500034': ['500082', '500033', '500028', '500004'],
  '400053': ['400058', '400061', '400102', '400049']
};

export const MAX_TIER = 3;

export type LocationTier = 'SAME_PIN' | 'NEIGHBOR_PIN' | 'RADIUS_EXPANDED';

// Tier 0 is the exact and mapped neighbouring PINs. Later tiers widen by PIN prefix;
// the first 3 digits of an Indian PIN identify the sorting district.
export function pinPrefixForTier(pin: string, tier: number): string {
  return pin.slice(0, 6 - tier);
}

export function classifyLocation(hospitalPin: string, donorPin: string): LocationTier {
  if (donorPin === hospitalPin) return 'SAME_PIN';
  if ((NEIGHBOR_PIN_MAP[hospitalPin] || []).includes(donorPin)) return 'NEIGHBOR_PIN';
  return 'RADIUS_EXPANDED';
}

export function priorityScore(isPremium: boolean, location: LocationTier): number {
  if (location === 'SAME_PIN') return isPremium ? 100 : 60;
  if (location === 'NEIGHBOR_PIN') return isPremium ? 80 : 40;
  return isPremium ? 30 : 20;
}

// Membership only shortens the wait before the search widens. Every request's
// first alerts go out immediately, member or not.
export function escalationDelayMs(isPremiumRequester: boolean): number {
  return (isPremiumRequester ? 2 : 5) * 60 * 1000;
}

export function isPremiumActive(data: { premiumStatus?: boolean; premiumExpiry?: string | null }, now = new Date()): boolean {
  return Boolean(data.premiumStatus && data.premiumExpiry && new Date(data.premiumExpiry) > now);
}

export function isOnCooldown(cooldownUntil: string | null | undefined, now = new Date()): boolean {
  return Boolean(cooldownUntil && new Date(cooldownUntil) > now);
}

export interface ScreeningAnswers {
  feelingWell: boolean;
  recentDonation: boolean;
  hasInfectionSymptoms: boolean;
  takingMedications: boolean;
  previousDecline: boolean;
  willingForBloodBankScreening: boolean;
}

// Returns why the donor cannot proceed, or null. The blood bank still makes the final call.
export function screeningFailure(s: ScreeningAnswers | undefined): string | null {
  if (!s) return 'Screening answers are required.';
  if (s.feelingWell !== true) return 'You should only donate when you are feeling well.';
  if (s.recentDonation !== false) return 'Whole blood donors must wait 90 days between donations.';
  if (s.hasInfectionSymptoms !== false) return 'You cannot donate with fever, cold or infection symptoms.';
  if (s.takingMedications !== false) return 'Medications that prohibit donation make you ineligible for now.';
  if (s.previousDecline !== false) return 'Donors permanently deferred by a blood bank cannot donate.';
  if (s.willingForBloodBankScreening !== true) return 'You must agree to the blood bank screening.';
  return null;
}
