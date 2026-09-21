'use client';

import { useCallback } from 'react';

const DEFAULT_API_BASE_URL = 'http://localhost:8080';
const KAKAO_LOGIN_PATH = '/auth/kakao/login';

export function getKakaoLoginUrl(
  apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
) {
  if (process.env.NEXT_PUBLIC_USE_MOCK_API === 'true') {
    return KAKAO_LOGIN_PATH;
  }

  return `${apiBaseUrl.replace(/\/$/, '')}${KAKAO_LOGIN_PATH}`;
}

export function useKakaoLogin() {
  const kakaoLoginUrl = getKakaoLoginUrl();

  return useCallback(() => {
    window.location.href = kakaoLoginUrl;
  }, [kakaoLoginUrl]);
}
