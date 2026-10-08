import type { PastEmergencyRecord, DonationRecord } from '../types/database';

export const INITIAL_PAST_EMERGENCIES: PastEmergencyRecord[] = [
  {
    historyId: 'hist_req_001',
    requestId: 'HG09812',
    patientName: 'Ramesh Varma (Father)',
    hospitalName: 'Apollo Hospitals, Health City',
    hospitalPinCode: '530023',
    bloodGroup: 'O+',
    unitsRequired: 2,
    status: 'FULFILLED',
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    fulfilledAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000 + 4 * 3600 * 1000).toISOString(),
    acceptedDonors: [
      {
        donorId: 'demo_donor_001',
        donorName: 'Rahul Sharma',
        donorPhone: '+91 98765 43210',
        bloodGroup: 'O+'
      },
      {
        donorId: 'demo_donor_003',
        donorName: 'Vikramaditya Roy',
        donorPhone: '+91 97766 55443',
        bloodGroup: 'O-'
      }
    ]
  },
  {
    historyId: 'hist_req_002',
    requestId: 'HG07451',
    patientName: 'Sunita Reddy',
    hospitalName: 'SevenHills Hospital, Rockdale',
    hospitalPinCode: '530002',
    bloodGroup: 'B+',
    unitsRequired: 1,
    status: 'FULFILLED',
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    fulfilledAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000 + 2 * 3600 * 1000).toISOString(),
    acceptedDonors: [
      {
        donorId: 'demo_donor_004',
        donorName: 'Dr. Neha Pillai',
        donorPhone: '+91 98222 33445',
        bloodGroup: 'B+'
      }
    ]
  }
];

export const INITIAL_DONATION_RECORDS: DonationRecord[] = [
  {
    donationId: 'don_rec_001',
    certificateId: 'CERT-HG-2026-9812',
    donorId: 'demo_donor_001',
    donorName: 'Rahul Sharma',
    requestId: 'HG09812',
    patientName: 'Ramesh Varma',
    hospitalName: 'Apollo Hospitals, Blood Bank',
    hospitalPinCode: '530023',
    bloodGroup: 'O+',
    unitsDonated: 1,
    donationType: 'Whole Blood',
    donatedAt: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000).toISOString(),
    bloodBankVerified: true,
    bloodBankDoctor: 'Dr. M. K. Rao (Pathology Chief)'
  },
  {
    donationId: 'don_rec_002',
    certificateId: 'CERT-HG-2025-4129',
    donorId: 'demo_donor_001',
    donorName: 'Rahul Sharma',
    requestId: 'HG04129',
    patientName: 'Deepak Chopra',
    hospitalName: 'Care Hospital Rotary Blood Center',
    hospitalPinCode: '530016',
    bloodGroup: 'O+',
    unitsDonated: 1,
    donationType: 'Whole Blood',
    donatedAt: new Date(Date.now() - 210 * 24 * 60 * 60 * 1000).toISOString(),
    bloodBankVerified: true,
    bloodBankDoctor: 'Dr. S. K. Sen (Medical Officer)'
  }
];

export function getRequesterPastEmergencies(_userId?: string): PastEmergencyRecord[] {
  const saved = localStorage.getItem('hemogo_past_emergencies');
  if (!saved) {
    localStorage.setItem('hemogo_past_emergencies', JSON.stringify(INITIAL_PAST_EMERGENCIES));
    return INITIAL_PAST_EMERGENCIES;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_PAST_EMERGENCIES;
  }
}

export function getDonorDonationHistory(_donorId?: string): DonationRecord[] {
  const saved = localStorage.getItem('hemogo_donation_records');
  if (!saved) {
    localStorage.setItem('hemogo_donation_records', JSON.stringify(INITIAL_DONATION_RECORDS));
    return INITIAL_DONATION_RECORDS;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_DONATION_RECORDS;
  }
}
