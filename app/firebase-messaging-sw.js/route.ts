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

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title;

  if (!title) {
    return;
  }

  self.registration.showNotification(title, {
    body: payload.notification?.body,
    data: payload.data ?? {},
  });
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
