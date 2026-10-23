import type { PastEmergencyRecord, DonationRecord } from '../types/database';

export const INITIAL_PAST_EMERGENCIES: PastEmergencyRecord[] = [
  {
    historyId: 'hist_001',
    requestId: 'HG10245',
    patientName: 'Kavitha Ramachandran (Age 32)',
    hospitalName: 'Care Hospital, Waltair Main Rd',
    hospitalPinCode: '530016',
    bloodGroup: 'O+',
    unitsRequired: 2,
    status: 'FULFILLED',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    fulfilledAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
    acceptedDonors: [
      {
        donorId: 'demo_donor_001',
        donorName: 'Rahul Sharma',
        donorPhone: '+91 98765 43210',
        bloodGroup: 'O+'
      }
    ]
  }
];

export const INITIAL_DONATION_RECORDS: DonationRecord[] = [
  {
    donationId: 'don_demo_001',
    certificateId: 'CERT-HG-2026-9812',
    donorId: 'demo_donor_001',
    donorName: 'Rahul Sharma',
    requestId: 'HG10245',
    patientName: 'Kavitha Ramachandran (Age 32)',
    hospitalName: 'Care Hospital, Waltair Main Rd',
    hospitalPinCode: '530016',
    bloodGroup: 'O+',
    unitsDonated: 1,
    donationType: 'Whole Blood',
    donatedAt: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toISOString(),
    bloodBankVerified: true,
    bloodBankDoctor: 'Dr. V. Raman, MD (Transfusion Medicine)'
  },
  {
    donationId: 'don_demo_002',
    certificateId: 'CERT-HG-2025-4129',
    donorId: 'demo_donor_001',
    donorName: 'Rahul Sharma',
    requestId: 'HG09812',
    patientName: 'M. S. Murthy',
    hospitalName: 'Apollo Hospitals, Health City',
    hospitalPinCode: '530023',
    bloodGroup: 'O+',
    unitsDonated: 1,
    donationType: 'Platelets',
    donatedAt: new Date(Date.now() - 190 * 24 * 60 * 60 * 1000).toISOString(),
    bloodBankVerified: true,
    bloodBankDoctor: 'Dr. Anita Desai, Head of Blood Transfusion'
  }
];

const PAST_EMERGENCIES_KEY = 'hemogo_past_emergencies_v3';
const DONATION_RECORDS_KEY = 'hemogo_donation_records_v3';

export function getRequesterPastEmergencies(_userId?: string): PastEmergencyRecord[] {
  const saved = localStorage.getItem(PAST_EMERGENCIES_KEY);
  if (!saved) {
    localStorage.setItem(PAST_EMERGENCIES_KEY, JSON.stringify(INITIAL_PAST_EMERGENCIES));
    return INITIAL_PAST_EMERGENCIES;
  }
  try {
    const list: PastEmergencyRecord[] = JSON.parse(saved);
    return list.length > 0 ? list : INITIAL_PAST_EMERGENCIES;
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
    const list: DonationRecord[] = JSON.parse(saved);
    return list.length > 0 ? list : INITIAL_DONATION_RECORDS;
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
