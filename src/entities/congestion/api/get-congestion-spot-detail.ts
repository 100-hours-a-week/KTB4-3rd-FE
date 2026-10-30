import { apiFetch } from '@/shared/api/client';

import type { CongestionSpotDetailResponse } from './congestion.types';

export function getCongestionSpotDetail(
  spotId: number,
  accessToken: string,
  signal?: AbortSignal,
): Promise<CongestionSpotDetailResponse> {
  return apiFetch<CongestionSpotDetailResponse>(`/congestion/spots/${spotId}`, {
    signal,
    token: accessToken,
  });
}
