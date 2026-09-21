import type { MapCoordinate } from '@/shared/types/common';

export type MapMarkerId = string | number;

export type MapMarker = {
  id: MapMarkerId;
  position: MapCoordinate;
  title?: string;
};

export type MapViewport = {
  northEast: MapCoordinate;
  northWest: MapCoordinate;
  southEast: MapCoordinate;
  southWest: MapCoordinate;
};

export type MapLoadError = {
  message: string;
};

export type MapLocationErrorCode =
  | 'permission-denied'
  | 'position-unavailable'
  | 'timeout'
  | 'unsupported';

export type MapLocationError = {
  code: MapLocationErrorCode;
  message: string;
};
