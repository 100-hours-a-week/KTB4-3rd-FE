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

  if (isReady) {
    return children;
  }

  return (
    <main
      aria-busy="true"
      className="grid min-h-dvh place-items-center bg-[var(--color-bg-layer-fill)] px-6"
    >
      <div
        role="status"
        className="flex flex-col items-center gap-3 text-[var(--color-fg-neutral-muted)]"
      >
        <span
          aria-hidden="true"
          className="size-8 animate-spin rounded-full border-2 border-[var(--color-stroke-neutral-weak)] border-t-[var(--color-fg-brand)]"
        />
        <span className="text-sm">화면을 준비하고 있어요</span>
      </div>
    </main>
  );
}
