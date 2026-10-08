import type { ChatMessage, UserProfile } from '../types/database';

const MOCK_CHATS_KEY = 'hemogo_mock_chats_v1';

export const INITIAL_DEMO_CHATS: Record<string, ChatMessage[]> = {
  'HG10245': [
    {
      messageId: 'msg_sys_001',
      requestId: 'HG10245',
      matchId: 'match_002_accepted',
      senderId: 'system',
      senderRole: 'system',
      senderName: 'HemoGo Security',
      text: '🔒 Emergency Match Confirmed. Phone numbers and private in-app chat are now unlocked to coordinate hospital arrival.',
      createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      read: true
    },
    {
      messageId: 'msg_req_001',
      requestId: 'HG10245',
      matchId: 'match_002_accepted',
      senderId: 'demo_req_001',
      senderRole: 'requester',
      senderName: 'Anil Kumar (Requester)',
      text: 'Hello Vikramaditya! Thank you so much for accepting. We are at Care Hospital, 2nd Floor ICU Trauma.',
      createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      read: true
    },
    {
      messageId: 'msg_don_001',
      requestId: 'HG10245',
      matchId: 'match_002_accepted',
      senderId: 'demo_donor_003',
      senderRole: 'donor',
      senderName: 'Vikramaditya Roy (Donor)',
      text: 'Hi Anil, I am on my way. GPS says I will reach the blood bank in around 10 minutes.',
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      read: true
    }
  ]
};

export function getStoredChatMessages(requestId: string): ChatMessage[] {
  const saved = localStorage.getItem(MOCK_CHATS_KEY);
  if (!saved) {
    localStorage.setItem(MOCK_CHATS_KEY, JSON.stringify(INITIAL_DEMO_CHATS));
    return INITIAL_DEMO_CHATS[requestId] || [];
  }
  try {
    const allChats: Record<string, ChatMessage[]> = JSON.parse(saved);
    if (!allChats[requestId]) {
      allChats[requestId] = [
        {
          messageId: `msg_sys_${Date.now()}`,
          requestId,
          matchId: 'match_auto',
          senderId: 'system',
          senderRole: 'system',
          senderName: 'HemoGo System',
          text: '🔒 Match confirmed. You can now coordinate direct blood bank donation arrival.',
          createdAt: new Date().toISOString(),
          read: true
        }
      ];
      localStorage.setItem(MOCK_CHATS_KEY, JSON.stringify(allChats));
    }
    return allChats[requestId];
  } catch {
    return INITIAL_DEMO_CHATS[requestId] || [];
  }
}

export function sendChatMessage(data: {
  requestId: string;
  matchId: string;
  sender: UserProfile;
  text: string;
}): ChatMessage {
  const saved = localStorage.getItem(MOCK_CHATS_KEY);
  let allChats: Record<string, ChatMessage[]> = {};
  if (saved) {
    try {
      allChats = JSON.parse(saved);
    } catch {
      allChats = { ...INITIAL_DEMO_CHATS };
    }
  } else {
    allChats = { ...INITIAL_DEMO_CHATS };
  }

  const newMessage: ChatMessage = {
    messageId: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    requestId: data.requestId,
    matchId: data.matchId,
    senderId: data.sender.userId,
    senderRole: data.sender.role === 'donor' ? 'donor' : 'requester',
    senderName: data.sender.name,
    text: data.text,
    createdAt: new Date().toISOString(),
    read: false
  };

  if (!allChats[data.requestId]) {
    allChats[data.requestId] = [];
  }

  allChats[data.requestId].push(newMessage);
  localStorage.setItem(MOCK_CHATS_KEY, JSON.stringify(allChats));

  return newMessage;
}
