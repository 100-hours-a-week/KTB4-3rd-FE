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

export type MatchingRegistrationValidationField = 'origin' | 'destination' | 'departureAt';

const COORDINATE_PRECISION = 6;

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
  getValidationFields: () => MatchingRegistrationValidationField[];
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

function getValidationFields(
  state: MatchingRegistrationDraft,
): MatchingRegistrationValidationField[] {
  const fields: MatchingRegistrationValidationField[] = [];

  if (
    !state.origin_name?.trim() ||
    !Number.isFinite(state.origin_lat) ||
    !Number.isFinite(state.origin_lng)
  ) {
    fields.push('origin');
  }

  if (
    !state.dest_name?.trim() ||
    !Number.isFinite(state.dest_lat) ||
    !Number.isFinite(state.dest_lng)
  ) {
    fields.push('destination');
  }

  if (!state.departure_at?.trim() || Number.isNaN(new Date(state.departure_at).getTime())) {
    fields.push('departureAt');
  }

  return fields;
}

function isCompleteDraft(state: MatchingRegistrationDraft): state is MatchingRegistrationDraft & {
  origin_name: string;
  origin_lat: number;
  origin_lng: number;
  dest_name: string;
  dest_lat: number;
  dest_lng: number;
  departure_at: string;
} {
  return getValidationFields(state).length === 0;
}

function getPayload(state: MatchingRegistrationDraft): MatchingRegistrationPayload | null {
  if (!isCompleteDraft(state)) {
    return null;
  }

  return {
    origin_name: state.origin_name,
    origin_lat: Number(state.origin_lat.toFixed(COORDINATE_PRECISION)),
    origin_lng: Number(state.origin_lng.toFixed(COORDINATE_PRECISION)),
    dest_name: state.dest_name,
    dest_lat: Number(state.dest_lat.toFixed(COORDINATE_PRECISION)),
    dest_lng: Number(state.dest_lng.toFixed(COORDINATE_PRECISION)),
    departure_at: state.departure_at,
  };
}

export const useMatchingRegistrationStore = create<MatchingRegistrationState>()((set, get) => ({
  ...createInitialState(),
  setOrigin: (location) => set(toLocationFields('origin', location)),
  setDestination: (location) => set(toLocationFields('dest', location)),
  setDepartureAt: (departureAt) => set({ departure_at: departureAt }),
  getValidationFields: () => getValidationFields(get()),
  getPayload: () => getPayload(get()),
  reset: () => set(createInitialState()),
}));
