'use client';

import { useCallback } from 'react';

const KAKAO_AUTHORIZE_URL = 'https://kauth.kakao.com/oauth/authorize';

type KakaoLoginConfig = {
  clientId?: string;
  redirectUri?: string;
};

export function getKakaoLoginUrl({
  clientId = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY,
  redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI,
}: KakaoLoginConfig = {}) {
  if (!clientId || !redirectUri) {
    throw new Error('카카오 로그인 환경변수가 설정되지 않았습니다');
  }

  const searchParams = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
  });

  return `${KAKAO_AUTHORIZE_URL}?${searchParams.toString()}`;
}

export function useKakaoLogin() {
  return useCallback(() => {
    window.location.href = getKakaoLoginUrl();
  }, []);
}
