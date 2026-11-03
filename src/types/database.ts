export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type UserRole = 'donor' | 'requester' | 'both' | 'admin';

export type UserStatus = 'active' | 'suspended';

export interface UserProfile {
  userId: string;
  name: string;
  phone: string;
  role: UserRole;
  pinCode: string;
  email?: string;
  verified: boolean;
  status: UserStatus;
  premiumStatus: boolean;
  premiumExpiry?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DonorAvailability = 'available' | 'unavailable';

export interface DonorProfile {
  donorId: string;
  userId: string;
  name: string;
  phone: string;
  bloodGroup: BloodGroup;
  pinCode: string;
  email?: string;
  alternatePhone?: string;
  city?: string;
  preferredRadiusKm?: number;
  verificationDocumentType?: 'Aadhaar Card' | 'Driving License' | 'Donor Card';
  availability: DonorAvailability;
  verificationStatus: boolean;
  premiumStatus: boolean;
  premiumExpiry?: string | null;
  lastDonationDate?: string | null;
  cooldownUntil?: string | null;
  lastNotificationDate?: string | null;
  totalRequestsReceived: number;
  totalAccepted: number;
  totalRejected: number;
  totalCompleted: number;
  createdAt: string;
  updatedAt: string;
}

export type UrgencyLevel = 'critical' | 'urgent' | 'moderate';

export type BloodRequestStatus = 
  | 'SEARCHING' 
  | 'DONORS_NOTIFIED' 
  | 'DONOR_ACCEPTED' 
  | 'CONTACT_SHARED' 
  | 'FULFILLED' 
  | 'CANCELLED' 
  | 'EXPIRED';

export interface BloodRequest {
  requestId: string;
  requesterId: string;
  patientName: string;
  requesterPhone: string;
  bloodGroup: BloodGroup;
  hospitalName: string;
  hospitalPinCode: string;
  hospitalLat?: number | null;
  hospitalLng?: number | null;
  unitsRequired: number;
  urgency: UrgencyLevel;
  notes?: string;
  requesterIsPremium?: boolean;
  status: BloodRequestStatus;
  searchTier: number;
  notifiedDonorsCount: number;
  pushDeliveredCount: number;
  acceptedDonorsCount: number;
  rejectedDonorsCount: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export type LocationMatchTier = 'SAME_PIN' | 'NEIGHBOR_PIN' | 'RADIUS_EXPANDED';
export type MatchResponse = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'WITHDRAWN';

export interface PreliminaryScreening {
  feelingWell: boolean;
  recentDonation: boolean;
  hasInfectionSymptoms: boolean;
  takingMedications: boolean;
  previousDecline: boolean;
  willingForBloodBankScreening: boolean;
  confirmedAt: string;
}

export interface MatchRecord {
  matchId: string;
  requestId: string;
  requesterId: string;
  donorId: string;
  donorBloodGroup: BloodGroup;
  donorPinCode: string;
  isPremiumDonor: boolean;
  priorityScore: number;
  locationMatch: LocationMatchTier;
  response: MatchResponse;
  respondedAt?: string | null;
  createdAt: string;
  requestedBloodGroup: BloodGroup;
  hospitalName: string;
  hospitalPinCode: string;
  hospitalLat?: number | null;
  hospitalLng?: number | null;
  unitsRequired: number;
  urgency: UrgencyLevel;
  // Written by the server only after the donor accepts.
  donorName?: string;
  donorPhone?: string;
  patientName?: string;
  requesterPhone?: string;
  notes?: string;
  donationConfirmedAt?: string | null;
  contactOpen?: boolean;
  requestOutcome?: BloodRequestStatus;
}

export interface SubscriptionRecord {
  subscriptionId: string;
  userId: string;
  invoiceNumber?: string;
  donorName?: string;
  donorPhone?: string;
  donorEmail?: string;
  plan: 'hemogo_premium_annual';
  amountPaise: number;
  baseAmountPaise?: number;
  gstAmountPaise?: number;
  currency: 'INR';
  startDate: string;
  expiryDate: string;
  paymentStatus: 'created' | 'paid' | 'failed';
  paymentProvider: 'Razorpay';
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  createdAt: string;
}

export interface AuditLog {
  logId: string;
  actorId: string;
  action: string;
  targetResource: string;
  timestamp: string;
  details: string;
}

// ============================================================================
// Next Phases: Real-Time Chat, Location Tracking, and History Types
// ============================================================================

export interface ChatMessage {
  messageId: string;
  requestId: string;
  matchId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

export interface DonorLiveLocation {
  donorId: string;
  requestId: string;
  matchId: string;
  currentLat: number;
  currentLng: number;
  distanceKm: number | null;
  estimatedMinutes: number | null;
  status: 'en_route' | 'nearby' | 'arrived';
  lastUpdated: string;
}

export interface PastEmergencyRecord {
  historyId: string;
  requestId: string;
  patientName: string;
  hospitalName: string;
  hospitalPinCode: string;
  bloodGroup: BloodGroup;
  unitsRequired: number;
  status: BloodRequestStatus;
  createdAt: string;
  fulfilledAt?: string;
  acceptedDonors: {
    donorId: string;
    donorName: string;
    donorPhone: string;
    bloodGroup: BloodGroup;
  }[];
}

export interface DonationRecord {
  donationId: string;
  certificateId: string; // e.g. "CERT-HG-2026-9812"
  donorId: string;
  donorName: string;
  requestId: string;
  patientName: string;
  hospitalName: string;
  hospitalPinCode: string;
  bloodGroup: BloodGroup;
  unitsDonated: number;
  donationType: 'Whole Blood' | 'Platelets' | 'Plasma';
  donatedAt: string;
  bloodBankVerified: boolean;
  bloodBankDoctor: string;
}
