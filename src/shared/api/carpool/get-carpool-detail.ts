import { apiFetch } from '@/shared/api/client';

import type { CarpoolDetailResponse } from './carpool-read.types';

export function getCarpoolDetail(
  carpoolId: number,
  accessToken?: string,
  signal?: AbortSignal,
): Promise<CarpoolDetailResponse> {
  return apiFetch<CarpoolDetailResponse>(`/carpools/${carpoolId}`, {
    token: accessToken,
    signal,
    skipAuthRefresh: accessToken === undefined,
  });
}
