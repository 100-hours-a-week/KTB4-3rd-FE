import { apiFetch } from '@/shared/api/client';

import type { SubmitMeterImageRequest, SubmitMeterImageResponse } from './settlements.types';

export function submitMeterImage(
  accessToken: string,
  settlementId: number,
  payload: SubmitMeterImageRequest,
): Promise<SubmitMeterImageResponse> {
  return apiFetch<SubmitMeterImageResponse>(`/settlements/${settlementId}/meter-image`, {
    method: 'POST',
    token: accessToken,
    body: JSON.stringify(payload),
  });
}
