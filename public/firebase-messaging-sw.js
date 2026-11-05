// Registered with the public Firebase web config in its query string.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const route = event.notification.data?.webRoute || '/';
  event.waitUntil(self.clients.openWindow(route));
});

importScripts('https://www.gstatic.com/firebasejs/12.17.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.17.1/firebase-messaging-compat.js');

const params = new URL(self.location).searchParams;
firebase.initializeApp({
  apiKey: params.get('apiKey'),
  projectId: params.get('projectId'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId')
});

firebase.messaging().onBackgroundMessage(({ data }) => {
  if (!data?.title) return;
  self.registration.showNotification(data.title, {
    body: data.body,
    data,
    tag: data.matchId || data.requestId,
    requireInteraction: data.type === 'EMERGENCY_DISPATCH',
    vibrate: [300, 100, 300, 100, 300]
  });
});
