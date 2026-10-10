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
