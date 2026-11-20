import { getAccessToken } from '@/entities/auth';
import { apiFetch } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/api/types';

export type CarpoolStatus = 'RECRUITING' | 'IN_PROGRESS' | 'COMPLETED';
export type CarpoolTransitionStatus = Exclude<CarpoolStatus, 'RECRUITING'>;

export type CarpoolHostData = {
  id: number;
  name: string;
  profile_image_url: string | null;
};

export type CarpoolParticipantData = CarpoolHostData;

export type CarpoolDetailData = {
  id: number;
  status: CarpoolStatus;
  host: CarpoolHostData;
  origin_name: string;
  dest_name: string;
  departure_at: string;
  car_model: string;
  current_count: number;
  capacity: number;
  is_full: boolean;
  participants: readonly CarpoolParticipantData[];
};

export type CarpoolDetailResponse = ApiResponse<CarpoolDetailData>;

export async function updateCarpoolStatus(
  companionId: string,
  status: CarpoolTransitionStatus,
): Promise<CarpoolDetailResponse> {
  const accessToken = await getAccessToken();

  return apiFetch<CarpoolDetailResponse>(`/carpools/${companionId}`, {
    method: 'PATCH',
    token: accessToken,
    body: JSON.stringify({ status }),
  });
}
