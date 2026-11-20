import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { TimePickerValue } from '@/shared/ui/time-picker';

export type CarpoolCreateLocation = {
  name: string;
  lat: number;
  lng: number;
};

export type CarpoolLocationField = 'departure' | 'destination';

export type CarpoolPendingLocation = {
  field: CarpoolLocationField;
  location: CarpoolCreateLocation;
  roadAddress: string | null;
};

export type CarpoolRecruitCount = 1 | 2 | 3;

export type CarpoolCreateDraft = {
  origin: CarpoolCreateLocation | null;
  destination: CarpoolCreateLocation | null;
  departureDate: string | null;
  departureTime: TimePickerValue | null;
  recruitCount: CarpoolRecruitCount | null;
};

export type CarpoolCreateState = {
  draft: CarpoolCreateDraft;
  pendingLocation: CarpoolPendingLocation | null;
  searchQuery: string;
  setOrigin: (origin: CarpoolCreateLocation | null) => void;
  setDestination: (destination: CarpoolCreateLocation | null) => void;
  setDepartureDate: (departureDate: string | null) => void;
  setDepartureTime: (departureTime: TimePickerValue | null) => void;
  setRecruitCount: (recruitCount: CarpoolRecruitCount | null) => void;
  setPendingLocation: (pendingLocation: CarpoolPendingLocation | null) => void;
  setSearchQuery: (searchQuery: string) => void;
  reset: () => void;
};

type PersistedCarpoolCreateState = Pick<
  CarpoolCreateState,
  'draft' | 'pendingLocation' | 'searchQuery'
>;

const CARPOOL_CREATE_DRAFT_STORAGE_KEY = 'carpool-create-draft';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidLocation(value: unknown): value is CarpoolCreateLocation {
  return Boolean(
    isRecord(value) &&
    typeof value.name === 'string' &&
    typeof value.lat === 'number' &&
    Number.isFinite(value.lat) &&
    value.lat >= -90 &&
    value.lat <= 90 &&
    typeof value.lng === 'number' &&
    Number.isFinite(value.lng) &&
    value.lng >= -180 &&
    value.lng <= 180,
  );
}

function isValidDepartureDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(0);
  date.setHours(0, 0, 0, 0);
  date.setFullYear(year, month - 1, day);

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function isValidTimePickerValue(value: unknown): value is TimePickerValue {
  return Boolean(
    isRecord(value) &&
    (value.period === '오전' || value.period === '오후') &&
    typeof value.hour === 'number' &&
    Number.isInteger(value.hour) &&
    value.hour >= 1 &&
    value.hour <= 12 &&
    typeof value.minute === 'number' &&
    Number.isInteger(value.minute) &&
    [0, 10, 20, 30, 40, 50].includes(value.minute),
  );
}

function isValidDraft(value: unknown): value is CarpoolCreateDraft {
  return Boolean(
    isRecord(value) &&
    (value.origin === null || isValidLocation(value.origin)) &&
    (value.destination === null || isValidLocation(value.destination)) &&
    (value.departureDate === null || isValidDepartureDate(value.departureDate)) &&
    (value.departureTime === null || isValidTimePickerValue(value.departureTime)) &&
    (value.recruitCount === null ||
      value.recruitCount === 1 ||
      value.recruitCount === 2 ||
      value.recruitCount === 3),
  );
}

function isValidPendingLocation(value: unknown): value is CarpoolPendingLocation | null {
  return (
    value === null ||
    (isRecord(value) &&
      (value.field === 'departure' || value.field === 'destination') &&
      isValidLocation(value.location) &&
      (value.roadAddress === null || typeof value.roadAddress === 'string'))
  );
}

function isValidPersistedState(value: unknown): value is PersistedCarpoolCreateState {
  return Boolean(
    isRecord(value) &&
    isValidDraft(value.draft) &&
    isValidPendingLocation(value.pendingLocation) &&
    typeof value.searchQuery === 'string',
  );
}

function mergePersistedState(
  persistedState: unknown,
  currentState: CarpoolCreateState,
): CarpoolCreateState {
  if (!isValidPersistedState(persistedState)) {
    return currentState;
  }

  return { ...currentState, ...persistedState };
}

function createInitialDraft(): CarpoolCreateDraft {
  return {
    origin: null,
    destination: null,
    departureDate: null,
    departureTime: null,
    recruitCount: null,
  };
}

export const useCarpoolCreateStore = create<CarpoolCreateState>()(
  persist(
    (set) => ({
      draft: createInitialDraft(),
      pendingLocation: null,
      searchQuery: '',
      setOrigin: (origin) => set((state) => ({ draft: { ...state.draft, origin } })),
      setDestination: (destination) => set((state) => ({ draft: { ...state.draft, destination } })),
      setDepartureDate: (departureDate) =>
        set((state) => ({ draft: { ...state.draft, departureDate } })),
      setDepartureTime: (departureTime) =>
        set((state) => ({ draft: { ...state.draft, departureTime } })),
      setRecruitCount: (recruitCount) =>
        set((state) => ({ draft: { ...state.draft, recruitCount } })),
      setPendingLocation: (pendingLocation) => set({ pendingLocation }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      reset: () => set({ draft: createInitialDraft(), pendingLocation: null, searchQuery: '' }),
    }),
    {
      name: CARPOOL_CREATE_DRAFT_STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        draft: state.draft,
        pendingLocation: state.pendingLocation,
        searchQuery: state.searchQuery,
      }),
      merge: mergePersistedState,
    },
  ),
);
