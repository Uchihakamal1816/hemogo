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
  donorId: string; // matches userId
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
  requestId: string; // e.g. "HG10245"
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
  donorPhone: string; // Only revealed to requester upon ACCEPTED status
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
  amountPaise: number; // 29900 = ₹299
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

export interface AdminSettings {
  expansionIntervalMinutes: number;
  maxNotificationRadiusKm: number;
  neighborPinMap: Record<string, string[]>;
  bloodCompatibilityMap: Record<BloodGroup, BloodGroup[]>;
}
