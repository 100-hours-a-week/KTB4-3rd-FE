import { apiFetch } from '@/shared/api/client';

import type { CongestionSpotsResponse, CongestionViewport } from './congestion.types';

export function getCongestionSpots(
  query: CongestionViewport,
  accessToken: string,
  signal?: AbortSignal,
): Promise<CongestionSpotsResponse> {
  const searchParams = new URLSearchParams({
    sw_lat: String(query.sw_lat),
    sw_lng: String(query.sw_lng),
    ne_lat: String(query.ne_lat),
    ne_lng: String(query.ne_lng),
  });

  return apiFetch<CongestionSpotsResponse>(`/congestion/spots?${searchParams.toString()}`, {
    signal,
    token: accessToken,
  });
}
