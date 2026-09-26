'use client';

import { useCallback } from 'react';

const DEFAULT_API_BASE_URL = 'http://dev.moyeota.com/api';
const KAKAO_LOGIN_PATH = '/auth/kakao/login';
const LOCAL_API_PATH = '/api';
const LOCAL_FRONT_ORIGIN = 'http://localhost:3000';

function getLocalKakaoLoginUrl() {
  const frontOrigin = typeof window === 'undefined' ? LOCAL_FRONT_ORIGIN : window.location.origin;

  return `${frontOrigin}${LOCAL_API_PATH}${KAKAO_LOGIN_PATH}?front_origin=${frontOrigin}`;
}

function isLocalEnvironment() {
  return process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';
}

export function getKakaoLoginUrl(
  apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL,
) {
  if (isLocalEnvironment()) {
    return getLocalKakaoLoginUrl();
  }

  return `${apiBaseUrl.replace(/\/$/, '')}${KAKAO_LOGIN_PATH}`;
}

export function useKakaoLogin() {
  const kakaoLoginUrl = getKakaoLoginUrl();

  return useCallback(() => {
    window.location.href = kakaoLoginUrl;
  }, [kakaoLoginUrl]);
}
