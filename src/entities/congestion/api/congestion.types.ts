import type { ApiResponse } from '@/shared/api/types';

export type CongestionSpotStatus = 'SMOOTH' | 'CONGESTED' | 'CROWDED' | 'DELAYED' | 'ACCIDENT';

export type CongestionViewport = {
  sw_lat: number;
  sw_lng: number;
  ne_lat: number;
  ne_lng: number;
};

export type CongestionSpot = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  status: CongestionSpotStatus;
  window_end: string;
};

export type CongestionSpotsData = {
  items: CongestionSpot[];
  limit: number;
  limit_exceeded: boolean;
};

export type CongestionSpotsResponse = ApiResponse<CongestionSpotsData>;

export type CongestionSpotDetail = {
  name: string;
  lat: number;
  lng: number;
  status: CongestionSpotStatus | null;
  reason: string | null;
  window_end: string | null;
  analyzing: boolean;
};

export type CongestionSpotDetailResponse = ApiResponse<CongestionSpotDetail>;
