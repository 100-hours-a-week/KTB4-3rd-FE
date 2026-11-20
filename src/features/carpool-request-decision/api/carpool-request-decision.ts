import { apiFetch } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/api/types';

export type CarpoolRequestDecisionStatus = 'ACCEPTED' | 'REJECTED';

export type CarpoolRequestDecisionPayload = {
  status: CarpoolRequestDecisionStatus;
};

export type AcceptedCarpoolRequestData = {
  id: number;
  status: 'ACCEPTED';
  chat_room_id: number;
  current_count: number;
  capacity: number;
};

export type RejectedCarpoolRequestData = {
  id: number;
  status: 'REJECTED';
};

export type CarpoolRequestDecisionData = AcceptedCarpoolRequestData | RejectedCarpoolRequestData;

export type CarpoolRequestDecisionResponse = ApiResponse<CarpoolRequestDecisionData>;

export function decideCarpoolRequest(
  accessToken: string,
  companionId: number,
  requestId: number,
  payload: CarpoolRequestDecisionPayload,
): Promise<CarpoolRequestDecisionResponse> {
  return apiFetch<CarpoolRequestDecisionResponse>(
    `/carpools/${companionId}/join-requests/${requestId}`,
    {
      method: 'PATCH',
      token: accessToken,
      body: JSON.stringify(payload),
    },
  );
}
