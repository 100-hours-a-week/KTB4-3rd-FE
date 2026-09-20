import { apiFetch } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/api/types';

export type KakaoLoginData = {
  access_token?: string;
  signup_token?: string;
  is_new_user: boolean;
  user_id?: number;
};

export type TokenData = {
  access_token: string;
};

export async function loginWithKakao(code: string) {
  return apiFetch<ApiResponse<KakaoLoginData>>('/auth/kakao', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function refreshAccessToken() {
  return apiFetch<ApiResponse<TokenData>>('/auth/tokens', {
    method: 'POST',
  });
}

export async function logout(accessToken: string) {
  return apiFetch<void>('/auth/sessions', {
    method: 'DELETE',
    token: accessToken,
  });
}

export async function withdraw(accessToken: string) {
  return apiFetch<void>('/users/me', {
    method: 'DELETE',
    token: accessToken,
  });
}
