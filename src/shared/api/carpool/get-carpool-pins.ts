import { apiFetch } from '@/shared/api/client';

import type { CarpoolPinsResponse, CarpoolViewport } from './carpool-read.types';
import { viewportSearchParams } from './viewport-search-params';

export function getCarpoolPins(
  viewport: CarpoolViewport,
  signal?: AbortSignal,
): Promise<CarpoolPinsResponse> {
  const params = viewportSearchParams(viewport);
  return apiFetch<CarpoolPinsResponse>(`/carpool-pins?${params.toString()}`, {
    signal,
    skipAuthRefresh: true,
  });
}
