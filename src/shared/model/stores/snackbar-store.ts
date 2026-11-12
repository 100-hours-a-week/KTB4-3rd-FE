import { create } from 'zustand';
import type { ComponentPropsWithoutRef } from 'react';

import { GLOBAL_SNACKBAR_ID, snackbarToastManager } from '@/shared/model/snackbar-manager';

type SnackbarType = 'default' | 'positive' | 'critical';

export type SnackbarState = {
  open: boolean;
  description: string;
  type: SnackbarType;
  actionProps?: ComponentPropsWithoutRef<'button'>;
  showSnackbar: (
    description: string,
    type?: SnackbarType,
    actionProps?: ComponentPropsWithoutRef<'button'>,
  ) => void;
  closeSnackbar: () => void;
  reset: () => void;
};

const initialState = {
  open: false,
  description: '',
  type: 'default' as SnackbarType,
  actionProps: undefined,
};

export const useSnackbarStore = create<SnackbarState>((set) => ({
  ...initialState,
  showSnackbar: (description, type = 'default', actionProps) => {
    set({ open: true, description, type, actionProps });
    snackbarToastManager.add({
      actionProps,
      description,
      id: GLOBAL_SNACKBAR_ID,
      onClose: () => set({ open: false }),
      timeout: type === 'positive' ? 3000 : 5000,
      type,
    });
  },
  closeSnackbar: () => {
    set({ open: false });
    snackbarToastManager.close(GLOBAL_SNACKBAR_ID);
  },
  reset: () => {
    set(initialState);
    snackbarToastManager.close(GLOBAL_SNACKBAR_ID);
  },
}));
