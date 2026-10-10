import type { CarpoolRequestDirection } from '@/entities/carpool';

export type { CarpoolRequestDirection } from '@/entities/carpool';

export type CarpoolRequestListItemResponse = {
  id: number;
  carpool_id: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  content: string;
  counterpart: {
    id: number;
    name: string;
    profile_image_url: string | null;
  };
  origin_name: string;
  dest_name: string;
  departure_at: string;
  chat_room_id?: number | null;
  created_at: string;
};

export type CarpoolRequestListResponse = {
  message: string;
  data: {
    direction: CarpoolRequestDirection;
    items: CarpoolRequestListItemResponse[];
    next_cursor: string | null;
  };
};

export type CarpoolRequestListQuery = {
  cursor?: string;
  direction: CarpoolRequestDirection;
  signal?: AbortSignal;
};
