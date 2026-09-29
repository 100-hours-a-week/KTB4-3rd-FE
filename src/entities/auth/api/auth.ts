import { apiFetch, registerAuthRefreshHandler } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/api/types';

import { useAuthStore } from '@/entities/auth/model/auth-store';

export type TokenData = {
  access_token: string;
};

export async function refreshAccessToken() {
  return apiFetch<ApiResponse<TokenData>>('/auth/tokens', {
    method: 'POST',
    skipAuthRefresh: true,
  });
}

async function refreshAccessTokenForRetry() {
  const { data } = await refreshAccessToken();
  useAuthStore.getState().setAccessToken(data.access_token);

  return data.access_token;
}

registerAuthRefreshHandler(refreshAccessTokenForRetry);
