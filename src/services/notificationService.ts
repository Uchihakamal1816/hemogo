import { arrayUnion, doc, setDoc } from 'firebase/firestore';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { app, db, firebaseConfig, useEmulators } from '../config/firebase';

export type PushState = 'unsupported' | 'default' | 'granted' | 'denied';

export async function getPushState(): Promise<PushState> {
  if (useEmulators || !(await isSupported().catch(() => false))) return 'unsupported';
  return Notification.permission as PushState;
}

/** Must be called from a user gesture. Registers this device to receive emergency alerts. */
export async function enablePushAlerts(userId: string): Promise<void> {
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) throw new Error('Alerts are not configured yet.');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notifications are blocked. Allow them in your browser settings to get alerts.');

  const params = new URLSearchParams({
    apiKey: firebaseConfig.apiKey,
    projectId: firebaseConfig.projectId,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId
  });
  const serviceWorkerRegistration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${params}`);
  const messaging = getMessaging(app);
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration });
  await setDoc(doc(db, 'deviceTokens', userId), { tokens: arrayUnion(token), updatedAt: new Date().toISOString() }, { merge: true });

  // The service worker only displays alerts when the app is in the background.
  onMessage(messaging, ({ data }) => {
    if (data?.title) serviceWorkerRegistration.showNotification(data.title, { body: data.body, data });
  });
}
