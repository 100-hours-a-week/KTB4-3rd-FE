import { create } from 'zustand';

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
  showSnackbar: (description, type = 'default') => set({ open: true, description, type }),
  closeSnackbar: () => set({ open: false }),
  reset: () => set(initialState),
}));
