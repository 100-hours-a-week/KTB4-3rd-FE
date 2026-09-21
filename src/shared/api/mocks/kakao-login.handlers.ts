import { http, HttpResponse } from 'msw';

import { MOCK_ACCESS_TOKEN, MOCK_SIGNUP_TOKEN } from './mock-utils';

export type KakaoLoginScenario = 'existing-user' | 'new-user' | 'failure';

export const MOCK_FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ?? 'http://localhost:3000';

function getCallbackUrl(scenario: KakaoLoginScenario) {
  const callbackUrl = new URL('/auth/callback', MOCK_FRONTEND_URL);

  if (scenario === 'existing-user') {
    callbackUrl.searchParams.set('status', 'ok');
  }

  if (scenario === 'new-user') {
    callbackUrl.searchParams.set('status', 'signup_required');
  }

  if (scenario === 'failure') {
    callbackUrl.searchParams.set('error', 'access_denied');
    callbackUrl.searchParams.set('error_description', '사용자가 로그인을 취소했습니다');
  }

  return callbackUrl.toString();
}

function getCookie(scenario: KakaoLoginScenario) {
  if (scenario === 'existing-user') {
    return `refresh_token=${MOCK_ACCESS_TOKEN}; Path=/; HttpOnly; SameSite=Lax`;
  }

  if (scenario === 'new-user') {
    return `signup_token=${MOCK_SIGNUP_TOKEN}; Path=/; HttpOnly; SameSite=Lax`;
  }

  return null;
}

export function kakaoLoginRedirectHandler(scenario: KakaoLoginScenario) {
  return http.get('*/auth/kakao/login', () => {
    const headers = new Headers();
    const cookie = getCookie(scenario);

    if (cookie) {
      headers.set('Set-Cookie', cookie);
    }

    headers.set('Location', getCallbackUrl(scenario));

    return new HttpResponse(null, {
      status: 302,
      headers,
    });
  });
}

export const kakaoLoginHandlers = [kakaoLoginRedirectHandler('new-user')];
