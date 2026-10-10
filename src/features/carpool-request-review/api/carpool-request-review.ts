import { apiFetch } from '@/shared/api/client';

import type {
  CarpoolRequestDecision,
  CarpoolRequestDecisionResponse,
  CarpoolRequestDetailResponse,
} from './carpool-request-review.types';

function getRequestPath(carpoolId: number, requestId: number) {
  return `/carpools/${carpoolId}/join-requests/${requestId}`;
}

export function getCarpoolRequestDetail(
  accessToken: string,
  carpoolId: number,
  requestId: number,
  signal?: AbortSignal,
): Promise<CarpoolRequestDetailResponse> {
  return apiFetch<CarpoolRequestDetailResponse>(getRequestPath(carpoolId, requestId), {
    token: accessToken,
    signal,
  });
}

export function decideCarpoolRequest(
  accessToken: string,
  carpoolId: number,
  requestId: number,
  status: CarpoolRequestDecision,
): Promise<CarpoolRequestDecisionResponse> {
  return apiFetch<CarpoolRequestDecisionResponse>(getRequestPath(carpoolId, requestId), {
    method: 'PATCH',
    token: accessToken,
    body: JSON.stringify({ status }),
  });
}
