'use client';

import { useEffect, useRef } from 'react';

import { useAuthStore } from '@/entities/auth';

import { useRegisterPushTokenMutation } from './use-register-push-token-mutation';

export function PushTokenRegistrationSync() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const { mutateAsync } = useRegisterPushTokenMutation();
  const registeredTokenRef = useRef<{ accessToken: string; token: string } | null>(null);

  useEffect(() => {
    if (
      !accessToken ||
      typeof window === 'undefined' ||
      !('Notification' in window) ||
      Notification.permission !== 'granted'
    ) {
      return;
    }

    let isActive = true;

    const registerToken = async () => {
      try {
        const { getFcmRegistrationToken } = await import('./get-fcm-registration-token');
        const token = await getFcmRegistrationToken();

        if (!token || !isActive) {
          return;
        }

        const registeredToken = registeredTokenRef.current;

        if (registeredToken?.accessToken === accessToken && registeredToken.token === token) {
          return;
        }

        await mutateAsync({ token });

        if (isActive) {
          registeredTokenRef.current = { accessToken, token };
        }
      } catch {
        // Push token registration is best-effort and must not block app use.
      }
    };

    void registerToken();

    return () => {
      isActive = false;
    };
  }, [accessToken, mutateAsync]);

  return null;
}
