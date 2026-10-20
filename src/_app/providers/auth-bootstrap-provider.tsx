'use client';

import { refreshAccessToken, useAuthStore } from '@/entities/auth';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { CarpoolRegistrationDraftAuthSync } from './carpool-registration-draft-auth-sync';

type AuthBootstrapProviderProps = {
  children: ReactNode;
};

export function AuthBootstrapProvider({ children }: AuthBootstrapProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const bootstrapPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    let isMounted = true;
    const bootstrapPromise =
      bootstrapPromiseRef.current ??
      (bootstrapPromiseRef.current = refreshAccessToken()
        .then(({ data }) => {
          useAuthStore.getState().setAccessToken(data.access_token);
        })
        .catch(() => {
          if (useAuthStore.getState().accessToken === null) {
            useAuthStore.getState().clearTokens();
          }
        }));

    void bootstrapPromise.finally(() => {
      if (isMounted) {
        setIsReady(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return isReady ? (
    <>
      <CarpoolRegistrationDraftAuthSync />
      {children}
    </>
  ) : null;
}
