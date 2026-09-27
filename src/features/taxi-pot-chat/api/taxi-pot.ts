import { getAccessToken } from '@/entities/auth';
import { apiFetch } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/api/types';

export type TaxiPotStatus = 'RECRUITING' | 'IN_PROGRESS' | 'COMPLETED';

export type TaxiPotDetailData = {
  id: number;
  chat_room_id: number;
  status: TaxiPotStatus;
  origin_name: string;
  dest_name: string;
  departure_at: string;
  current_count: number;
  capacity: number;
  host_id: number;
};

export type TaxiPotDetailResponse = ApiResponse<TaxiPotDetailData>;

export async function getTaxiPotDetail(taxiPotId: string): Promise<TaxiPotDetailResponse> {
  const accessToken = await getAccessToken();

  return apiFetch<TaxiPotDetailResponse>(`/taxi-pots/${taxiPotId}`, {
    token: accessToken,
  });
}
