import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getMessaging, getToken, isSupported, type Messaging } from 'firebase/messaging';

const PUSH_FIREBASE_APP_NAME = 'moyeota-push';

function getFirebaseConfig(): FirebaseOptions | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (!apiKey || !authDomain || !projectId || !messagingSenderId || !appId) {
    return null;
  }

  return { apiKey, authDomain, projectId, messagingSenderId, appId };
}

export async function getFcmMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  const firebaseConfig = getFirebaseConfig();

  if (!firebaseConfig || !(await isSupported())) {
    return null;
  }

  const firebaseApp = getApps().some(({ name }) => name === PUSH_FIREBASE_APP_NAME)
    ? getApp(PUSH_FIREBASE_APP_NAME)
    : initializeApp(firebaseConfig, PUSH_FIREBASE_APP_NAME);
  return getMessaging(firebaseApp);
}

export async function getFcmRegistrationToken(): Promise<string | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  if (Notification.permission !== 'granted') {
    return null;
  }

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_VAPID_KEY;

  if (!vapidKey) {
    return null;
  }

  const messaging = await getFcmMessaging();

  if (!messaging) {
    return null;
  }

  const serviceWorkerRegistration = await navigator.serviceWorker.register(
    '/firebase-messaging-sw.js',
  );

  return (await getToken(messaging, { vapidKey, serviceWorkerRegistration })) || null;
}
