'use client';

import { useEffect, useState, type ReactNode } from 'react';

const mockApiEnabled = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

type MockApiProviderProps = {
  children: ReactNode;
};

export function MockApiProvider({ children }: MockApiProviderProps) {
  const [isReady, setIsReady] = useState(!mockApiEnabled);

  useEffect(() => {
    if (!mockApiEnabled) {
      return;
    }

    let isMounted = true;

    void import('@/shared/api/mocks/browser').then(async ({ worker }) => {
      await worker.start({ onUnhandledRequest: 'bypass' });

      if (isMounted) {
        setIsReady(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return isReady ? children : null;
}
