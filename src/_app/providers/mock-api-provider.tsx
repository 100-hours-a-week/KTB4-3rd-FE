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

    void import('@/shared/api/mocks/browser')
      .then(({ startMockApi }) => startMockApi())
      .then(() => {
        if (isMounted) {
          setIsReady(true);
        }
      })
      .catch((error: unknown) => {
        console.error('MSW mock API를 시작하지 못했습니다.', error);

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
