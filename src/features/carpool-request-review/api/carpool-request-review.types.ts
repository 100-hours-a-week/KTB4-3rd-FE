import type { ApiResponse } from '@/shared/api/types';

export type CarpoolRequestDetail = {
  id: number;
  carpool_id: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  content: string;
  requester: { id: number; name: string; profile_image_url: string | null };
  created_at: string;
};

export type CarpoolRequestDetailResponse = ApiResponse<CarpoolRequestDetail>;

export type CarpoolRequestDecision = 'ACCEPTED' | 'REJECTED';

export type CarpoolRequestDecisionData =
  | {
      id: number;
      status: 'ACCEPTED';
      chat_room_id: number;
      current_count: number;
      capacity: number;
    }
  | { id: number; status: 'REJECTED' };

export type CarpoolRequestDecisionResponse = ApiResponse<CarpoolRequestDecisionData>;
