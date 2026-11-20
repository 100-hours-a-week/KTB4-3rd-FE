const FIREBASE_COMPAT_VERSION = '13.0.0';

function getFirebaseConfig() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (Object.values(config).some((value) => !value)) {
    return null;
  }

  return config;
}

export function GET() {
  const firebaseConfig = getFirebaseConfig();

  if (!firebaseConfig) {
    return new Response('Firebase messaging is not configured.', { status: 503 });
  }

  const script = `
importScripts('https://www.gstatic.com/firebasejs/${FIREBASE_COMPAT_VERSION}/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/${FIREBASE_COMPAT_VERSION}/firebase-messaging-compat.js');

firebase.initializeApp(${JSON.stringify(firebaseConfig).replace(/</g, '\\u003c')});

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title;

  if (!title) {
    return;
  }

  return self.registration.showNotification(title, {
    body: payload.notification?.body,
    data: payload.data ?? {},
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil((async () => {
    const data = event.notification.data ?? {};
    const isPositiveInteger = (value) => /^\\d+$/.test(String(value ?? '')) && Number(value) > 0;
    let destination = '/notification';

    if (data.type === 'COMMENT_CREATED' && isPositiveInteger(data.target_post_id)) {
      destination = '/posts/' + Number(data.target_post_id);
    } else if (isPositiveInteger(data.target_chat_room_id)) {
      destination = '/chatroom/' + Number(data.target_chat_room_id);
    }

    const targetUrl = new URL(destination, self.location.origin);

    if (isPositiveInteger(data.notification_id)) {
      targetUrl.searchParams.set('fcm_notification_id', String(Number(data.notification_id)));
    }

    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const client = clients[0];

    if (client) {
      const navigatedClient = await client.navigate(targetUrl.href);
      await (navigatedClient ?? client).focus();
      return;
    }

    await self.clients.openWindow(targetUrl.href);
  })());
});
`;

  return new Response(script, {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/javascript; charset=utf-8',
      'Service-Worker-Allowed': '/',
    },
  });
}
