import { apiFetch } from '@/shared/api/client';

import type { SubmitTransferProofRequest, SubmitTransferProofResponse } from './settlements.types';

export function submitTransferProof(
  accessToken: string,
  settlementId: number,
  payload: SubmitTransferProofRequest,
): Promise<SubmitTransferProofResponse> {
  return apiFetch<SubmitTransferProofResponse>(`/settlements/${settlementId}/transfer-proof`, {
    method: 'POST',
    token: accessToken,
    body: JSON.stringify(payload),
  });
}
