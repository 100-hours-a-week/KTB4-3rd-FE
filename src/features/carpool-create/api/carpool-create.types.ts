import type { ApiResponse } from '@/shared/api/types';

export type CarpoolCreatePayload = {
  origin_name: string;
  origin_lat: number;
  origin_lng: number;
  dest_name: string;
  dest_lat: number;
  dest_lng: number;
  departure_at: string;
  recruit_count: 1 | 2 | 3;
};

export type CarpoolCreateData = {
  id: number;
  chat_room_id: number;
  capacity: number;
  current_count: number;
  status: 'RECRUITING';
};

export type CarpoolCreateResponse = ApiResponse<CarpoolCreateData>;
