import { create } from 'zustand';

import type { LocationPermissionStatus, MapCoordinate } from '@/shared/types/common';

export type LocationState = {
  coordinate: MapCoordinate | null;
  permissionStatus: LocationPermissionStatus;
  isLoading: boolean;
  errorMessage: string | null;
  setCoordinate: (coordinate: MapCoordinate | null) => void;
  setPermissionStatus: (status: LocationPermissionStatus) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (errorMessage: string | null) => void;
  reset: () => void;
};

const initialState = {
  coordinate: null,
  permissionStatus: 'prompt' as LocationPermissionStatus,
  isLoading: false,
  errorMessage: null,
};

export const useLocationStore = create<LocationState>((set) => ({
  ...initialState,
  setCoordinate: (coordinate) => set({ coordinate }),
  setPermissionStatus: (permissionStatus) => set({ permissionStatus }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (errorMessage) => set({ errorMessage }),
  reset: () => set(initialState),
}));
