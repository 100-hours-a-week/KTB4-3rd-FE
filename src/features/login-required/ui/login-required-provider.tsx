'use client';

import { useCallback, useState, type ReactNode } from 'react';

import { selectIsAuthenticated, useAuthStore } from '@/entities/auth';
import {
  RequireAuthContextProvider,
  type AuthenticatedAction,
} from '@/features/login-required/model/use-require-auth';

import { LoginRequiredDialog } from './login-required-dialog';

type LoginRequiredProviderProps = {
  children: ReactNode;
};

export function LoginRequiredProvider({ children }: LoginRequiredProviderProps) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const requireAuth = useCallback(
    (action: AuthenticatedAction) => {
      if (!isAuthenticated) {
        setIsDialogOpen(true);
        return;
      }

      action();
    },
    [isAuthenticated],
  );

  return (
    <RequireAuthContextProvider value={{ requireAuth }}>
      {children}
      <LoginRequiredDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </RequireAuthContextProvider>
  );
}
