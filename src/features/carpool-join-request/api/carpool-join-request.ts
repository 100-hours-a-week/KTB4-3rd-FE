import { apiFetch } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/api/types';

export type CreateCarpoolJoinRequestPayload = {
  content: string;
};

export type CreateCarpoolJoinRequestData = {
  id: number;
  carpool_id: number;
  status: 'PENDING';
  created_at: string;
};

export type CreateCarpoolJoinRequestResponse = ApiResponse<CreateCarpoolJoinRequestData>;

export function createCarpoolJoinRequest(
  accessToken: string,
  companionId: number,
  payload: CreateCarpoolJoinRequestPayload,
  signal?: AbortSignal,
): Promise<CreateCarpoolJoinRequestResponse> {
  return apiFetch<CreateCarpoolJoinRequestResponse>(`/carpools/${companionId}/join-requests`, {
    method: 'POST',
    token: accessToken,
    body: JSON.stringify(payload),
    signal,
  });
}
