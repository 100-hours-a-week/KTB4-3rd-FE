import { create } from 'zustand';

export type BottomSheetState = {
  open: boolean;
  snapPoint: number | string;
  openBottomSheet: (snapPoint?: number | string) => void;
  closeBottomSheet: () => void;
  setSnapPoint: (snapPoint: number | string) => void;
  reset: () => void;
};

const initialState = {
  open: false,
  snapPoint: 'half' as number | string,
};

export const useBottomSheetStore = create<BottomSheetState>((set) => ({
  ...initialState,
  openBottomSheet: (snapPoint = initialState.snapPoint) => set({ open: true, snapPoint }),
  closeBottomSheet: () => set({ open: false }),
  setSnapPoint: (snapPoint) => set({ snapPoint }),
  reset: () => set(initialState),
}));
