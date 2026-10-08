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
  unitsRequired: number;
  urgency: UrgencyLevel;
  notes?: string;
  status: BloodRequestStatus;
  notifiedDonorsCount: number;
  acceptedDonorsCount: number;
  rejectedDonorsCount: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export type LocationMatchTier = 'SAME_PIN' | 'NEIGHBOR_PIN' | 'RADIUS_EXPANDED';
export type MatchResponse = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

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
  donorId: string;
  donorName: string;
  donorPhone: string;
  donorBloodGroup: BloodGroup;
  donorPinCode: string;
  isPremiumDonor: boolean;
  priorityScore: number;
  locationMatch: LocationMatchTier;
  notificationStatus: 'SENT' | 'DELIVERED' | 'OPENED';
  response: MatchResponse;
  respondedAt?: string | null;
  eligibilityScreening?: PreliminaryScreening | null;
  createdAt: string;
}

export interface SubscriptionRecord {
  subscriptionId: string;
  userId: string;
  plan: 'hemogo_premium_annual';
  amountPaise: number;
  currency: 'INR';
  startDate: string;
  expiryDate: string;
  paymentStatus: 'created' | 'paid' | 'failed';
  paymentProvider: 'Razorpay';
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  createdAt: string;
}

export interface AuditLog {
  logId: string;
  actorId: string;
  actorRole: UserRole;
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
  senderRole: 'requester' | 'donor' | 'system';
  senderName: string;
  text: string;
  createdAt: string;
  read: boolean;
}

export interface DonorLiveLocation {
  donorId: string;
  requestId: string;
  matchId: string;
  donorName: string;
  hospitalName: string;
  currentLat: number;
  currentLng: number;
  hospitalLat: number;
  hospitalLng: number;
  distanceKm: number;
  estimatedMinutes: number;
  transportMode: 'bike' | 'car' | 'transit';
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

export interface FCMNotificationPayload {
  notification: {
    title: string;
    body: string;
  };
  data: {
    type: 'EMERGENCY_DISPATCH' | 'DONOR_ACCEPTED' | 'CHAT_MESSAGE';
    requestId: string;
    matchId?: string;
    deepLink: string;
    webRoute: string;
  };
}
