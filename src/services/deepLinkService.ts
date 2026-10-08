import type { FCMNotificationPayload } from '../types/database';

/**
 * Builds an FCM payload with deep-link data for Flutter & Web apps
 */
export function createEmergencyFcmPayload(data: {
  requestId: string;
  patientName: string;
  bloodGroup: string;
  hospitalName: string;
  hospitalPinCode: string;
  matchId: string;
}): FCMNotificationPayload {
  return {
    notification: {
      title: `🚨 Urgent: ${data.bloodGroup} Blood Needed at ${data.hospitalName}`,
      body: `Patient ${data.patientName} requires emergency donation in PIN ${data.hospitalPinCode}. Tap to respond.`
    },
    data: {
      type: 'EMERGENCY_DISPATCH',
      requestId: data.requestId,
      matchId: data.matchId,
      deepLink: `hemogo://emergency/${data.requestId}?matchId=${data.matchId}`,
      webRoute: `/?tab=donor_dashboard&matchId=${data.matchId}&requestId=${data.requestId}`
    }
  };
}

export function createDonorAcceptedFcmPayload(data: {
  requestId: string;
  donorName: string;
  bloodGroup: string;
}): FCMNotificationPayload {
  return {
    notification: {
      title: `✅ Donor Found: ${data.donorName} (${data.bloodGroup}) Accepted!`,
      body: `Contact details and in-app chat are now unlocked. Tap to connect.`
    },
    data: {
      type: 'DONOR_ACCEPTED',
      requestId: data.requestId,
      deepLink: `hemogo://status/${data.requestId}`,
      webRoute: `/?tab=requester_status&requestId=${data.requestId}`
    }
  };
}

/**
 * Parses deep-link query parameters from window.location
 */
export function parseDeepLinkRoute(): {
  tab?: 'home' | 'requester_status' | 'donor_dashboard' | 'admin';
  requestId?: string;
  matchId?: string;
  openChat?: boolean;
} {
  if (typeof window === 'undefined') return {};

  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab') as any;
  const requestId = params.get('requestId') || undefined;
  const matchId = params.get('matchId') || undefined;
  const openChat = params.get('chat') === 'true';

  return {
    tab: ['home', 'requester_status', 'donor_dashboard', 'admin'].includes(tab) ? tab : undefined,
    requestId,
    matchId,
    openChat
  };
}
