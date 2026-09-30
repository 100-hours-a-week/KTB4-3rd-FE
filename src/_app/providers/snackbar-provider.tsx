'use client';

import { Toast } from '@base-ui/react/toast';
import type { ReactNode } from 'react';

import { snackbarToastManager } from '@/shared/model/snackbar-manager';

type SnackbarProviderProps = {
  children: ReactNode;
};

export function SnackbarProvider({ children }: SnackbarProviderProps) {
  return (
    <Toast.Provider limit={1} toastManager={snackbarToastManager} timeout={5000}>
      {children}
    </Toast.Provider>
  );
}
