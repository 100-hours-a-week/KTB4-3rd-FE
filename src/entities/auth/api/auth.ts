import { apiFetch, registerAuthRefreshHandler, ApiError } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/api/types';

import { useAuthStore } from '@/entities/auth/model/auth-store';

export type TokenData = {
  access_token: string;
};

export async function refreshAccessToken() {
  try {
    return await apiFetch<ApiResponse<TokenData>>('/auth/tokens', {
      method: 'POST',
      skipAuthRefresh: true,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      useAuthStore.getState().clearTokens();
    }

    throw error;
  }
}

async function refreshAccessTokenForRetry() {
  const { data } = await refreshAccessToken();
  useAuthStore.getState().setAccessToken(data.access_token);

  return data.access_token;
}

registerAuthRefreshHandler(refreshAccessTokenForRetry);
