'use client';

import { PushNotificationForegroundListener } from './push-notification-foreground-listener';
import { PushTokenRegistrationSync } from './push-token-registration-sync';

export function NotificationPushRuntime() {
  return (
    <>
      <PushTokenRegistrationSync />
      <PushNotificationForegroundListener />
    </>
  );
}
