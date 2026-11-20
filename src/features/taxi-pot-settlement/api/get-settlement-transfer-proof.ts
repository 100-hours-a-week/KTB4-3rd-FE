import { apiFetch } from '@/shared/api/client';

import type { SettlementTransferProofResponse } from './settlements.types';

export function getSettlementTransferProof(
  accessToken: string,
  settlementId: number,
  userId: number,
  signal?: AbortSignal,
): Promise<SettlementTransferProofResponse> {
  return apiFetch<SettlementTransferProofResponse>(
    `/settlements/${settlementId}/participants/${userId}/transfer-proof`,
    {
      token: accessToken,
      signal,
    },
  );
}
