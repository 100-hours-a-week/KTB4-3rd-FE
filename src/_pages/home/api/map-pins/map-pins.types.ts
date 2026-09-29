import type { ApiResponse } from '@/shared/api/types';

export type MapPinType = 'COMPANION' | 'COMMUNITY';

export type MapPin = {
  type: MapPinType;
  id: number;
  lat: number;
  lng: number;
};

export type MapPinsQuery = {
  sw_lat: number;
  sw_lng: number;
  ne_lat: number;
  ne_lng: number;
};

export type MapPinsData = {
  items: MapPin[];
  limit: number;
  limit_exceeded: boolean;
};

export type MapPinsResponse = ApiResponse<MapPinsData>;
