'use client';

import { createContext, useContext, type ReactNode } from 'react';

export type AuthenticatedAction = () => void;

export type RequireAuthContextValue = {
  requireAuth: (action: AuthenticatedAction) => void;
};

const RequireAuthContext = createContext<RequireAuthContextValue | null>(null);

export function RequireAuthContextProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: RequireAuthContextValue;
}) {
  return <RequireAuthContext.Provider value={value}>{children}</RequireAuthContext.Provider>;
}

export function useRequireAuth() {
  const context = useContext(RequireAuthContext);

  if (!context) {
    throw new Error('useRequireAuth must be used within LoginRequiredProvider');
  }

  return context;
}
