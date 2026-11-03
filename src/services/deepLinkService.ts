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
