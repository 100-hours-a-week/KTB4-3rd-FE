'use client';

import { useEffect, type ReactNode } from 'react';

const mockApiEnabled = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

type MockApiProviderProps = {
  children: ReactNode;
};

export function MockApiProvider({ children }: MockApiProviderProps) {
  useEffect(() => {
    if (!mockApiEnabled) {
      return;
    }

    void import('@/shared/api/mocks/browser')
      .then(({ startMockApi }) => startMockApi())
      .catch((error: unknown) => {
        console.error('MSW mock API를 시작하지 못했습니다.', error);
      });
  }, []);

  return children;
}
