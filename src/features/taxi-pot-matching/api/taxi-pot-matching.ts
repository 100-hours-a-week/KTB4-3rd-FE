import { getAccessToken } from '@/entities/auth';
import type { TaxiPotActiveStatus } from '@/entities/taxi-pot';
import { apiFetch } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/api/types';

export type CurrentTaxiPotData =
  | {
      id: null;
      chat_room_id: null;
      status: 'MATCHING';
      current_count: null;
      capacity: number;
    }
  | {
      id: number;
      chat_room_id: number;
      status: TaxiPotActiveStatus;
      current_count: number;
      capacity: number;
    };

export type CurrentTaxiPotResponse = ApiResponse<CurrentTaxiPotData | null>;

export async function getCurrentTaxiPot(): Promise<CurrentTaxiPotResponse> {
  const accessToken = await getAccessToken();

  return apiFetch<CurrentTaxiPotResponse>('/users/me/current-taxi-pot', {
    token: accessToken,
  });
}

export async function cancelTaxiPotMatching(): Promise<void> {
  const accessToken = await getAccessToken();

  await apiFetch<void>('/taxi-pots/match-requests/me', {
    method: 'DELETE',
    token: accessToken,
  });
}
