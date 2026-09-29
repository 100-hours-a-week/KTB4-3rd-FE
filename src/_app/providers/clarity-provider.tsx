'use client';

import { useEffect, type ReactNode } from 'react';

import { initClarity } from '@/shared/analytics';

type ClarityProviderProps = {
  children: ReactNode;
};

export function ClarityProvider({ children }: ClarityProviderProps) {
  useEffect(() => {
    initClarity();
  }, []);

  return children;
}
