'use client';

import { useEffect, type ReactNode } from 'react';

import { initClarity } from '@/shared/analytics';

type ClarityProviderProps = {
  children: ReactNode;
};

export function ClarityProvider({ children }: ClarityProviderProps) {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID) {
      return;
    }

    let cancelled = false;
    let idleHandle: number | null = null;
    let timerHandle: number | null = null;

    const initialize = () => {
      if (!cancelled) {
        void initClarity().catch(() => {});
      }
    };
    const schedule = () => {
      if (cancelled) {
        return;
      }

      if (typeof window.requestIdleCallback === 'function') {
        idleHandle = window.requestIdleCallback(initialize, { timeout: 3000 });
      } else {
        timerHandle = window.setTimeout(initialize, 1000);
      }
    };

    if (document.readyState === 'complete') {
      schedule();
    } else {
      window.addEventListener('load', schedule, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener('load', schedule);
      if (idleHandle !== null && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleHandle);
      }
      if (timerHandle !== null) {
        window.clearTimeout(timerHandle);
      }
    };
  }, []);

  return children;
}
