import { http, HttpResponse } from 'msw';

import { MOCK_ACCESS_TOKEN, MOCK_SIGNUP_TOKEN, errorResponse, getCookieValue } from './mock-utils';

export const MOCK_LOGOUT_SCENARIOS = {
  INTERNAL_SERVER_ERROR: '__mock_internal_server_error__',
  ROTATED_REFRESH_TOKEN: 'mock-rotated-refresh-token',
  OTHER_DEVICE_REFRESH_TOKEN: 'mock-other-device-refresh-token',
} as const;

const REFRESH_TOKEN_COOKIE_CLEAR = 'refresh_token=; Max-Age=0; Path=/api/auth; HttpOnly';
const CURRENT_SESSION_ID = 'current-device';
const OTHER_SESSION_ID = 'other-device';

let revokedSessionIds = new Set<string>();
let allSessionsRevoked = false;

function getSessionId(refreshToken: string) {
  if (
    refreshToken === MOCK_ACCESS_TOKEN ||
    refreshToken === 'mock-refresh-token' ||
    refreshToken === MOCK_LOGOUT_SCENARIOS.ROTATED_REFRESH_TOKEN
  ) {
    return CURRENT_SESSION_ID;
  }

  return refreshToken === MOCK_LOGOUT_SCENARIOS.OTHER_DEVICE_REFRESH_TOKEN
    ? OTHER_SESSION_ID
    : refreshToken;
}

export function revokeAllMockSessions() {
  allSessionsRevoked = true;
}

export function resetAuthMockState() {
  revokedSessionIds = new Set<string>();
  allSessionsRevoked = false;
}

export const authHandlers = [
  http.post('*/auth/kakao', async ({ request }) => {
    const body = (await request.json()) as { code?: unknown };

    if (body.code === 'invalid-code') {
      return errorResponse('유효하지 않은 인가 코드입니다', 'INVALID_OAUTH_CODE', 'code', 400);
    }

    if (body.code === 'existing-user') {
      return HttpResponse.json({
        message: '로그인에 성공했습니다',
        data: {
          access_token: MOCK_ACCESS_TOKEN,
          is_new_user: false,
        },
      });
    }

    return HttpResponse.json(
      {
        message: '카카오 인증에 성공했습니다. 추가 정보 입력이 필요합니다',
        data: {
          signup_token: MOCK_SIGNUP_TOKEN,
          is_new_user: true,
          user_id: 15,
        },
      },
      { status: 201 },
    );
  }),
  http.post('*/auth/tokens', ({ request }) => {
    const refreshToken = getCookieValue(request, 'refresh_token');

    if (!refreshToken || allSessionsRevoked || revokedSessionIds.has(getSessionId(refreshToken))) {
      return errorResponse('인증이 필요합니다', 'UNAUTHORIZED', null, 401);
    }

    return HttpResponse.json(
      {
        message: '토큰이 재발급되었습니다',
        data: { access_token: MOCK_ACCESS_TOKEN },
      },
      {
        headers: {
          'Set-Cookie': `refresh_token=${refreshToken === MOCK_LOGOUT_SCENARIOS.OTHER_DEVICE_REFRESH_TOKEN ? refreshToken : 'mock-refresh-token'}; Max-Age=604800; HttpOnly; SameSite=Strict`,
        },
      },
    );
  }),
  http.delete('*/auth/sessions', ({ request }) => {
    const refreshToken = getCookieValue(request, 'refresh_token');

    if (refreshToken === MOCK_LOGOUT_SCENARIOS.INTERNAL_SERVER_ERROR) {
      return errorResponse('서버 오류가 발생했습니다', 'INTERNAL_SERVER_ERROR', null, 500);
    }

    if (refreshToken) {
      revokedSessionIds.add(getSessionId(refreshToken));
    }

    return new HttpResponse(null, {
      status: 204,
      headers: { 'Set-Cookie': REFRESH_TOKEN_COOKIE_CLEAR },
    });
  }),
];
