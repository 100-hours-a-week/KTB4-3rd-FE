import { create } from 'zustand';

import type { LocationSearchResult } from '@/features/location-search';
import type { MapCoordinate } from '@/shared/types/common';

import type { MatchingLocationField } from './matching-location-field';

export const CURRENT_LOCATION_ID = 'current-location';

export const SEOUL_STATION_COORDINATE: MapCoordinate = {
  lat: 37.5547,
  lng: 126.9707,
};

export const SEOUL_STATION_LOCATION: LocationSearchResult = {
  id: 'seoul-station',
  latitude: SEOUL_STATION_COORDINATE.lat,
  longitude: SEOUL_STATION_COORDINATE.lng,
  placeName: '서울역',
  distance: '',
  roadAddress: '서울특별시 중구 한강대로 405',
};

export function createCurrentLocation(
  coordinate: MapCoordinate,
  details: {
    placeName: string | null;
    roadAddress: string | null;
  },
): LocationSearchResult {
  return {
    id: CURRENT_LOCATION_ID,
    latitude: coordinate.lat,
    longitude: coordinate.lng,
    placeName: details.placeName || details.roadAddress || '현재 위치',
    distance: '',
    roadAddress: details.roadAddress || '',
  };
}

export type MatchingState = {
  departure: LocationSearchResult | null;
  destination: LocationSearchResult | null;
  pendingLocation: LocationSearchResult | null;
  setLocation: (field: MatchingLocationField, location: LocationSearchResult | null) => void;
  setPendingLocation: (location: LocationSearchResult | null) => void;
  reset: () => void;
};

function createInitialState() {
  return {
    departure: SEOUL_STATION_LOCATION,
    destination: null,
    pendingLocation: null,
  };
}

export const useMatchingStore = create<MatchingState>()((set) => ({
  ...createInitialState(),
  setLocation: (field, location) => set({ [field]: location }),
  setPendingLocation: (pendingLocation) => set({ pendingLocation }),
  reset: () => set(createInitialState()),
}));
