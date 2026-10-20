'use client';

import { useCallback, useState } from 'react';

import { getFcmRegistrationToken } from './get-fcm-registration-token';
import { useRegisterPushTokenMutation } from './use-register-push-token-mutation';

type UseNotificationEntryOptions = {
  onOpenNotifications: () => void;
};

export function useNotificationEntry({ onOpenNotifications }: UseNotificationEntryOptions) {
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const { mutateAsync } = useRegisterPushTokenMutation();

  const handleNotificationClick = useCallback(() => {
    if (
      typeof window === 'undefined' ||
      !('Notification' in window) ||
      Notification.permission !== 'default'
    ) {
      onOpenNotifications();
      return;
    }

    setIsPermissionDialogOpen(true);
  }, [onOpenNotifications]);

  const handleEnable = useCallback(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        void Notification.requestPermission()
          .then((permission) => {
            if (permission === 'granted') {
              void getFcmRegistrationToken()
                .then((token) => (token ? mutateAsync({ token }) : undefined))
                .catch(() => {
                  // Push registration is best-effort; it must not block notification inbox access.
                });
            }

            onOpenNotifications();
          })
          .catch(() => {
            onOpenNotifications();
          });
      } catch {
        // Permission requests can fail in unsupported browser contexts.
        onOpenNotifications();
      }
      return;
    }

    onOpenNotifications();
  }, [mutateAsync, onOpenNotifications]);

  const handleDefer = useCallback(() => {
    onOpenNotifications();
  }, [onOpenNotifications]);

  return {
    isPermissionDialogOpen,
    onEnable: handleEnable,
    onDefer: handleDefer,
    onNotificationClick: handleNotificationClick,
    onPermissionDialogOpenChange: setIsPermissionDialogOpen,
  };
}
