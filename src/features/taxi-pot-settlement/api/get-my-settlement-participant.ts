import { apiFetch } from '@/shared/api/client';

import type { MySettlementParticipantResponse } from './settlements.types';

export function getMySettlementParticipant(
  accessToken: string,
  settlementId: number,
  signal?: AbortSignal,
): Promise<MySettlementParticipantResponse> {
  return apiFetch<MySettlementParticipantResponse>(`/settlements/${settlementId}/participants/me`, {
    token: accessToken,
    signal,
  });
}
