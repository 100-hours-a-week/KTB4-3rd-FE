import { create } from 'zustand';

import type { TimePickerValue } from '@/shared/ui/time-picker';

export type CarpoolCreateLocation = {
  name: string;
  lat: number;
  lng: number;
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
  draftRevision: number;
  setOrigin: (origin: CarpoolCreateLocation | null) => void;
  setDestination: (destination: CarpoolCreateLocation | null) => void;
  setDepartureDate: (departureDate: string | null) => void;
  setDepartureTime: (departureTime: TimePickerValue | null) => void;
  setRecruitCount: (recruitCount: CarpoolRecruitCount | null) => void;
  reset: () => void;
};

function createInitialDraft(): CarpoolCreateDraft {
  return {
    origin: null,
    destination: null,
    departureDate: null,
    departureTime: null,
    recruitCount: null,
  };
}

export const useCarpoolCreateStore = create<CarpoolCreateState>()((set) => ({
  draft: createInitialDraft(),
  draftRevision: 0,
  setOrigin: (origin) =>
    set((state) => ({ draft: { ...state.draft, origin }, draftRevision: state.draftRevision + 1 })),
  setDestination: (destination) =>
    set((state) => ({
      draft: { ...state.draft, destination },
      draftRevision: state.draftRevision + 1,
    })),
  setDepartureDate: (departureDate) =>
    set((state) => ({
      draft: { ...state.draft, departureDate },
      draftRevision: state.draftRevision + 1,
    })),
  setDepartureTime: (departureTime) =>
    set((state) => ({
      draft: { ...state.draft, departureTime },
      draftRevision: state.draftRevision + 1,
    })),
  setRecruitCount: (recruitCount) =>
    set((state) => ({
      draft: { ...state.draft, recruitCount },
      draftRevision: state.draftRevision + 1,
    })),
  reset: () =>
    set((state) => ({ draft: createInitialDraft(), draftRevision: state.draftRevision + 1 })),
}));
