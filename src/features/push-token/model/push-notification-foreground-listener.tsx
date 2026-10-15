'use client';

import { onMessage } from 'firebase/messaging';
import { useEffect, useRef, useState } from 'react';

import { useAuthStore } from '@/entities/auth';

import { getFcmMessaging } from './get-fcm-registration-token';

const MAX_REMEMBERED_NOTIFICATIONS = 100;
const FOREGROUND_NOTIFICATION_DURATION = 5000;

type ForegroundNotification = {
  id?: string;
  title: string;
  body: string;
};

export function PushNotificationForegroundListener() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [notification, setNotification] = useState<ForegroundNotification | null>(null);
  const seenNotificationIdsRef = useRef(new Set<string>());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!accessToken || typeof window === 'undefined') {
      return;
    }

    let isActive = true;
    let unsubscribe: (() => void) | undefined;

    const subscribeToMessages = async () => {
      try {
        const messaging = await getFcmMessaging();

        if (!messaging || !isActive) {
          return;
        }

        unsubscribe = onMessage(messaging, (payload) => {
          const notificationId = payload.data?.notification_id;

          if (notificationId && seenNotificationIdsRef.current.has(notificationId)) {
            return;
          }

          const title = payload.notification?.title;
          const body = payload.notification?.body;

          if (!title || !body) {
            return;
          }

          if (notificationId) {
            const seenNotificationIds = seenNotificationIdsRef.current;
            seenNotificationIds.add(notificationId);

            if (seenNotificationIds.size > MAX_REMEMBERED_NOTIFICATIONS) {
              const oldestId = seenNotificationIds.values().next().value;

              if (oldestId) {
                seenNotificationIds.delete(oldestId);
              }
            }
          }

          setNotification({ id: notificationId, title, body });

          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          timeoutRef.current = setTimeout(() => {
            setNotification(null);
            timeoutRef.current = null;
          }, FOREGROUND_NOTIFICATION_DURATION);
        });
      } catch {
        // Foreground push setup must not block app use.
      }
    };

    void subscribeToMessages();

    return () => {
      isActive = false;
      unsubscribe?.();
    };
  }, [accessToken]);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  if (!notification) {
    return null;
  }

  return (
    <div
      key={notification.id ?? `${notification.title}-${notification.body}`}
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-[calc(env(safe-area-inset-top,0px)+16px)] z-[2147483647] mx-auto max-w-[393px] px-5"
    >
      <div className="rounded-2xl bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.16)]">
        <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
        <p className="mt-1 text-sm text-gray-700">{notification.body}</p>
      </div>
    </div>
  );
}
