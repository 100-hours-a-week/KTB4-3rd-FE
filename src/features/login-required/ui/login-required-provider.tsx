'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useState, type ReactNode } from 'react';

import { selectIsAuthenticated, useAuthStore } from '@/entities/auth';
import {
  RequireAuthContextProvider,
  type AuthenticatedAction,
} from '@/features/login-required/model/use-require-auth';
import { isLoginRequiredPath } from '@/features/login-required/model/is-login-required-path';

import { LoginRequiredDialog } from './login-required-dialog';

type LoginRequiredProviderProps = {
  children: ReactNode;
};

type RouteLoginRequiredDialogProps = {
  isActionDialogOpen: boolean;
  isAuthenticated: boolean;
  pathname: string | null;
  onActionDialogOpenChange: (open: boolean) => void;
};

function RouteLoginRequiredDialog({
  isActionDialogOpen,
  isAuthenticated,
  pathname,
  onActionDialogOpenChange,
}: RouteLoginRequiredDialogProps) {
  const [isRouteDialogDismissed, setIsRouteDialogDismissed] = useState(false);
  const isRouteDialogOpen =
    !isAuthenticated && isLoginRequiredPath(pathname) && !isRouteDialogDismissed;
  const isDialogOpen = !isAuthenticated && (isActionDialogOpen || isRouteDialogOpen);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && isRouteDialogOpen) {
        setIsRouteDialogDismissed(true);
      }

      onActionDialogOpenChange(open);
    },
    [isRouteDialogOpen, onActionDialogOpenChange],
  );

  return <LoginRequiredDialog open={isDialogOpen} onOpenChange={handleOpenChange} />;
}

export function LoginRequiredProvider({ children }: LoginRequiredProviderProps) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const pathname = usePathname();
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);

  const requireAuth = useCallback(
    (action: AuthenticatedAction) => {
      if (!isAuthenticated) {
        setIsActionDialogOpen(true);
        return;
      }

      action();
    },
    [isAuthenticated],
  );

  return (
    <RequireAuthContextProvider value={{ requireAuth }}>
      {children}
      <RouteLoginRequiredDialog
        isActionDialogOpen={isActionDialogOpen}
        isAuthenticated={isAuthenticated}
        key={pathname ?? 'unknown'}
        pathname={pathname}
        onActionDialogOpenChange={setIsActionDialogOpen}
      />
    </RequireAuthContextProvider>
  );
}
