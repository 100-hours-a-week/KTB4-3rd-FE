import { apiFetch } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/api/types';

export type TokenData = {
  access_token: string;
};

export async function refreshAccessToken() {
  return apiFetch<ApiResponse<TokenData>>('/auth/tokens', {
    method: 'POST',
  });
}
