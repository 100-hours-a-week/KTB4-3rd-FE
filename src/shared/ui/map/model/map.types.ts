import type { MapCoordinate } from '@/shared/types/common';

export type MapMarkerId = string | number;

export type MapMarkerImage = {
  src: string;
  width: number;
  height: number;
  offset?: {
    x: number;
    y: number;
  };
};

export type MapMarker = {
  id: MapMarkerId;
  image?: MapMarkerImage;
  isSelected?: boolean;
  position: MapCoordinate;
  title?: string;
};

export type MapViewport = {
  northEast: MapCoordinate;
  northWest: MapCoordinate;
  southEast: MapCoordinate;
  southWest: MapCoordinate;
};

export type MapViewportChangeSource =
  | 'initial'
  | 'drag'
  | 'zoom'
  | 'selection'
  | 'locate'
  | 'programmatic';

export type MapCenterChangeSource = Extract<MapViewportChangeSource, 'selection' | 'programmatic'>;

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
