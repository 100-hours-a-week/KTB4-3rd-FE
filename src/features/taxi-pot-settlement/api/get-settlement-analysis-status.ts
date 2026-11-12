import { apiFetch } from '@/shared/api/client';

import type { SettlementAnalysisStatusResponse } from './settlements.types';

export function getSettlementAnalysisStatus(
  accessToken: string,
  settlementId: number,
  signal?: AbortSignal,
): Promise<SettlementAnalysisStatusResponse> {
  return apiFetch<SettlementAnalysisStatusResponse>(
    `/settlements/${settlementId}/analysis-status`,
    {
      token: accessToken,
      signal,
    },
  );
}
