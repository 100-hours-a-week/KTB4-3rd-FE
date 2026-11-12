import { apiFetch } from '@/shared/api/client';

import type { SettlementMeterImageResponse } from './settlements.types';

export function getSettlementMeterImage(
  accessToken: string,
  settlementId: number,
  signal?: AbortSignal,
): Promise<SettlementMeterImageResponse> {
  return apiFetch<SettlementMeterImageResponse>(`/settlements/${settlementId}/meter-image`, {
    token: accessToken,
    signal,
  });
}
