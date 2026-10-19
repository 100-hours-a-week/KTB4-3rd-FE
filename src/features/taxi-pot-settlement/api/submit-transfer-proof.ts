import { apiFetchWithStatus, type ApiFetchResponse } from '@/shared/api/client';

import type { SubmitTransferProofRequest, SubmitTransferProofResponse } from './settlements.types';

export function submitTransferProof(
  accessToken: string,
  settlementId: number,
  payload: SubmitTransferProofRequest,
): Promise<ApiFetchResponse<SubmitTransferProofResponse>> {
  return apiFetchWithStatus<SubmitTransferProofResponse>(
    `/settlements/${settlementId}/transfer-proof`,
    {
      method: 'POST',
      token: accessToken,
      body: JSON.stringify(payload),
    },
  );
}
