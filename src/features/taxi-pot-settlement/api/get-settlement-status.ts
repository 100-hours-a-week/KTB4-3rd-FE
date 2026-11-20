import { apiFetch } from '@/shared/api/client';

import type { SettlementStatusResponse } from './settlements.types';

export function getSettlementStatus(
  accessToken: string,
  settlementId: number,
  signal?: AbortSignal,
): Promise<SettlementStatusResponse> {
  return apiFetch<SettlementStatusResponse>(`/settlements/${settlementId}`, {
    token: accessToken,
    signal,
  });
}
