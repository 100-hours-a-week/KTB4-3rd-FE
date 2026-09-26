import { create } from 'zustand';

export type MatchingRegistrationLocation = {
  name: string;
  lat: number | null;
  lng: number | null;
};

export type MatchingRegistrationPayload = {
  origin_name: string;
  origin_lat: number;
  origin_lng: number;
  dest_name: string;
  dest_lat: number;
  dest_lng: number;
  departure_at: string;
};

type MatchingRegistrationDraft = {
  origin_name: string | null;
  origin_lat: number | null;
  origin_lng: number | null;
  dest_name: string | null;
  dest_lat: number | null;
  dest_lng: number | null;
  departure_at: string | null;
};

export type MatchingRegistrationState = MatchingRegistrationDraft & {
  setOrigin: (location: MatchingRegistrationLocation | null) => void;
  setDestination: (location: MatchingRegistrationLocation | null) => void;
  setDepartureAt: (departureAt: string | null) => void;
  getPayload: () => MatchingRegistrationPayload | null;
  reset: () => void;
};

function createInitialState(): MatchingRegistrationDraft {
  return {
    origin_name: null,
    origin_lat: null,
    origin_lng: null,
    dest_name: null,
    dest_lat: null,
    dest_lng: null,
    departure_at: null,
  };
}

function toLocationFields(
  prefix: 'origin' | 'dest',
  location: MatchingRegistrationLocation | null,
) {
  return {
    [`${prefix}_name`]: location?.name ?? null,
    [`${prefix}_lat`]: location?.lat ?? null,
    [`${prefix}_lng`]: location?.lng ?? null,
  } as const;
}

function getPayload(state: MatchingRegistrationDraft): MatchingRegistrationPayload | null {
  if (
    state.origin_name === null ||
    state.origin_lat === null ||
    state.origin_lng === null ||
    state.dest_name === null ||
    state.dest_lat === null ||
    state.dest_lng === null ||
    state.departure_at === null
  ) {
    return null;
  }

  return {
    origin_name: state.origin_name,
    origin_lat: state.origin_lat,
    origin_lng: state.origin_lng,
    dest_name: state.dest_name,
    dest_lat: state.dest_lat,
    dest_lng: state.dest_lng,
    departure_at: state.departure_at,
  };
}

export const useMatchingRegistrationStore = create<MatchingRegistrationState>()((set, get) => ({
  ...createInitialState(),
  setOrigin: (location) => set(toLocationFields('origin', location)),
  setDestination: (location) => set(toLocationFields('dest', location)),
  setDepartureAt: (departureAt) => set({ departure_at: departureAt }),
  getPayload: () => getPayload(get()),
  reset: () => set(createInitialState()),
}));
