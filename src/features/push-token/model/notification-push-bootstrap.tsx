'use client';

import { useEffect, useState, type ComponentType } from 'react';

import { useAuthStore } from '@/entities/auth';

type PushRuntimeComponent = ComponentType;
type LoadedPushRuntime = {
  accessToken: string;
  Component: PushRuntimeComponent;
};

export function NotificationPushBootstrap() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [loadedPushRuntime, setLoadedPushRuntime] = useState<LoadedPushRuntime | null>(null);

  useEffect(() => {
    let isActive = true;

    if (!accessToken) {
      return () => {
        isActive = false;
      };
    }

    void import('./notification-push-runtime')
      .then(({ NotificationPushRuntime }) => {
        if (isActive) {
          setLoadedPushRuntime({ accessToken, Component: NotificationPushRuntime });
        }
      })
      .catch(() => {
        // Push setup is best-effort and must not block the notification page.
      });

    return () => {
      isActive = false;
    };
  }, [accessToken]);

  if (!accessToken || loadedPushRuntime?.accessToken !== accessToken) {
    return null;
  }

  const PushRuntime = loadedPushRuntime.Component;

  return <PushRuntime />;
}
