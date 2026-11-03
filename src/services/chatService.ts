import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { ChatMessage, UserProfile } from '../types/database';

export function subscribeToChat(matchId: string, callback: (messages: ChatMessage[]) => void): () => void {
  const q = query(collection(db, 'chats', matchId, 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => {
      const data = d.data();
      const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString();
      return { ...data, messageId: d.id, createdAt } as ChatMessage;
    }));
  }, (err) => console.error('Chat listener failed:', err));
}

export async function sendChatMessage(data: {
  requestId: string;
  matchId: string;
  sender: UserProfile;
  text: string;
}): Promise<void> {
  await addDoc(collection(db, 'chats', data.matchId, 'messages'), {
    requestId: data.requestId,
    matchId: data.matchId,
    senderId: data.sender.userId,
    senderName: data.sender.name,
    text: data.text,
    createdAt: serverTimestamp()
  });
}
