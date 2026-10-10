'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, type ReactNode } from 'react';

import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';

type SnackbarRouteLifecycleProps = {
  children: ReactNode;
};

export function SnackbarRouteLifecycle({ children }: SnackbarRouteLifecycleProps) {
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);

  useEffect(() => {
    if (previousPathnameRef.current === pathname) {
      return;
    }

    previousPathnameRef.current = pathname;
    useSnackbarStore.getState().closeSnackbar();
  }, [pathname]);

  return children;
}
