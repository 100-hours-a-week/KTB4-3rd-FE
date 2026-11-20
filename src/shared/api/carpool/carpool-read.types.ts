import type { ApiResponse } from '@/shared/api/types';

export type CarpoolViewport = {
  sw_lat: number;
  sw_lng: number;
  ne_lat: number;
  ne_lng: number;
};
export type CarpoolPin = { id: number; lat: number; lng: number };
export type CarpoolPinsResponse = ApiResponse<{
  items: CarpoolPin[];
  limit: number;
  limit_exceeded: boolean;
}>;
export type NearbyCarpoolsQuery = CarpoolViewport & {
  lat: number;
  lng: number;
  cursor?: string;
};
export type CarpoolSummary = {
  id: number;
  host: { name: string; profile_image_url: string | null };
  origin_name: string;
  dest_name: string;
  departure_at: string;
  distance_m: number;
  current_count: number;
  capacity: number;
  is_full: boolean;
  is_expired: boolean;
};
export type NearbyCarpoolsResponse = ApiResponse<{
  items: CarpoolSummary[];
  next_cursor: string | null;
}>;

export type CarpoolDetail = {
  id: number;
  status: 'RECRUITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';
  host: { id: number; name: string; profile_image_url: string | null };
  origin_name: string;
  dest_name: string;
  departure_at: string;
  car_model: string;
  current_count: number;
  capacity: number;
  is_full: boolean;
  participants: { id: number; name: string; profile_image_url: string | null }[];
  my_request?: { id: number; status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' };
};

export type CarpoolDetailResponse = ApiResponse<CarpoolDetail>;
