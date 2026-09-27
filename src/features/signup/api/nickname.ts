import { apiFetch } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/api/types';

export type NicknameAvailabilityData = {
  available: boolean;
};

export async function checkNicknameAvailability(nickname: string) {
  const params = new URLSearchParams({ nickname });

  return apiFetch<ApiResponse<NicknameAvailabilityData>>(
    `/users/nickname-availability?${params.toString()}`,
  );
}
