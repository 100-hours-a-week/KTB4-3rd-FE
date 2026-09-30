import { create } from 'zustand';

import { GLOBAL_SNACKBAR_ID, snackbarToastManager } from '@/shared/model/snackbar-manager';

type SnackbarType = 'default' | 'positive' | 'critical';

export type SnackbarState = {
  open: boolean;
  description: string;
  type: SnackbarType;
  showSnackbar: (description: string, type?: SnackbarType) => void;
  closeSnackbar: () => void;
  reset: () => void;
};

const initialState = {
  open: false,
  description: '',
  type: 'default' as SnackbarType,
};

export const useSnackbarStore = create<SnackbarState>((set) => ({
  ...initialState,
  showSnackbar: (description, type = 'default') => {
    set({ open: true, description, type });
    snackbarToastManager.add({
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
