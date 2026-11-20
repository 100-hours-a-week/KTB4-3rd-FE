'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { getAccessToken } from '@/entities/auth';
import { markNotificationRead } from '@/shared/api/notifications';

const NOTIFICATION_ID_PARAM = 'fcm_notification_id';

export function PushNotificationClickHandler() {
  const router = useRouter();
  const handledNotificationIdsRef = useRef(new Set<number>());

  useEffect(() => {
    const url = new URL(window.location.href);
    const rawNotificationId = url.searchParams.get(NOTIFICATION_ID_PARAM);

    if (!rawNotificationId) {
      return;
    }

    url.searchParams.delete(NOTIFICATION_ID_PARAM);
    router.replace(`${url.pathname}${url.search}${url.hash}`, { scroll: false });

    if (!/^\d+$/.test(rawNotificationId)) {
      return;
    }

    const notificationId = Number(rawNotificationId);

    if (!Number.isSafeInteger(notificationId) || notificationId <= 0) {
      return;
    }

    const handledNotificationIds = handledNotificationIdsRef.current;

    if (handledNotificationIds.has(notificationId)) {
      return;
    }

    handledNotificationIds.add(notificationId);

    void getAccessToken()
      .then((accessToken) => markNotificationRead(accessToken, notificationId))
      .catch(() => {
        // Opening a push destination should not be blocked by a read receipt failure.
      });
  }, [router]);

  return null;
}
