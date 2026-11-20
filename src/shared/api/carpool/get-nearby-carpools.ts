import { apiFetch } from '@/shared/api/client';

import type { NearbyCarpoolsQuery, NearbyCarpoolsResponse } from './carpool-read.types';
import { viewportSearchParams } from './viewport-search-params';

export function getNearbyCarpools(
  query: NearbyCarpoolsQuery,
  signal?: AbortSignal,
): Promise<NearbyCarpoolsResponse> {
  const params = viewportSearchParams(query);
  params.set('lat', String(query.lat));
  params.set('lng', String(query.lng));
  if (query.cursor !== undefined) {
    params.set('cursor', query.cursor);
  }
  return apiFetch<NearbyCarpoolsResponse>(`/carpools?${params.toString()}`, {
    signal,
    skipAuthRefresh: true,
  });
}
