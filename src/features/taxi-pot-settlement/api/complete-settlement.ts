import { apiFetch } from '@/shared/api/client';

export function completeSettlement(accessToken: string, settlementId: number): Promise<void> {
  return apiFetch<void>(`/settlements/${settlementId}/completion`, {
    method: 'POST',
    token: accessToken,
  });
}
