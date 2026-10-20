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
  isForcedDialogOpen: boolean;
  isAuthenticated: boolean;
  pathname: string | null;
  onActionDialogOpenChange: (open: boolean) => void;
  onForcedDialogOpenChange: (open: boolean) => void;
};

function RouteLoginRequiredDialog({
  isActionDialogOpen,
  isForcedDialogOpen,
  isAuthenticated,
  pathname,
  onActionDialogOpenChange,
  onForcedDialogOpenChange,
}: RouteLoginRequiredDialogProps) {
  const [isRouteDialogDismissed, setIsRouteDialogDismissed] = useState(false);
  const isRouteDialogOpen =
    !isAuthenticated && isLoginRequiredPath(pathname) && !isRouteDialogDismissed;
  const isDialogOpen =
    isForcedDialogOpen || (!isAuthenticated && (isActionDialogOpen || isRouteDialogOpen));

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && isRouteDialogOpen) {
        setIsRouteDialogDismissed(true);
      }

      onActionDialogOpenChange(open);
      onForcedDialogOpenChange(open);
    },
    [isRouteDialogOpen, onActionDialogOpenChange, onForcedDialogOpenChange],
  );

  return <LoginRequiredDialog open={isDialogOpen} onOpenChange={handleOpenChange} />;
}

export function LoginRequiredProvider({ children }: LoginRequiredProviderProps) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const pathname = usePathname();
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [forcedDialogToken, setForcedDialogToken] = useState<string | null>(null);
  const isForcedDialogOpen = forcedDialogToken !== null && accessToken === forcedDialogToken;

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

  const showLoginRequiredDialog = useCallback(() => {
    setForcedDialogToken(useAuthStore.getState().accessToken);
  }, []);

  const handleForcedDialogOpenChange = useCallback(
    (open: boolean) => {
      setForcedDialogToken(open ? accessToken : null);
    },
    [accessToken],
  );

  return (
    <RequireAuthContextProvider value={{ requireAuth, showLoginRequiredDialog }}>
      {children}
      <RouteLoginRequiredDialog
        isActionDialogOpen={isActionDialogOpen}
        isForcedDialogOpen={isForcedDialogOpen}
        isAuthenticated={isAuthenticated}
        key={pathname ?? 'unknown'}
        pathname={pathname}
        onActionDialogOpenChange={setIsActionDialogOpen}
        onForcedDialogOpenChange={handleForcedDialogOpenChange}
      />
    </RequireAuthContextProvider>
  );
}
