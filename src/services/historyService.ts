import type { PastEmergencyRecord, DonationRecord } from '../types/database';

export const INITIAL_PAST_EMERGENCIES: PastEmergencyRecord[] = [];

export const INITIAL_DONATION_RECORDS: DonationRecord[] = [];

const PAST_EMERGENCIES_KEY = 'hemogo_past_emergencies_v3';
const DONATION_RECORDS_KEY = 'hemogo_donation_records_v3';

export function getRequesterPastEmergencies(_userId?: string): PastEmergencyRecord[] {
  const saved = localStorage.getItem(PAST_EMERGENCIES_KEY);
  if (!saved) {
    localStorage.setItem(PAST_EMERGENCIES_KEY, JSON.stringify(INITIAL_PAST_EMERGENCIES));
    return INITIAL_PAST_EMERGENCIES;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_PAST_EMERGENCIES;
  }
}

export function getDonorDonationHistory(_donorId?: string): DonationRecord[] {
  const saved = localStorage.getItem(DONATION_RECORDS_KEY);
  if (!saved) {
    localStorage.setItem(DONATION_RECORDS_KEY, JSON.stringify(INITIAL_DONATION_RECORDS));
    return INITIAL_DONATION_RECORDS;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_DONATION_RECORDS;
  }
}

export function clearHistoryStorage(): void {
  localStorage.removeItem(PAST_EMERGENCIES_KEY);
  localStorage.removeItem(DONATION_RECORDS_KEY);
  localStorage.removeItem('hemogo_past_emergencies');
  localStorage.removeItem('hemogo_donation_records');
}
