import { http, HttpResponse } from 'msw';

import { MOCK_ACCESS_TOKEN, MOCK_SIGNUP_TOKEN, errorResponse } from './mock-utils';

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
  http.post('*/auth/tokens', () =>
    HttpResponse.json(
      {
        message: '토큰이 재발급되었습니다',
        data: { access_token: MOCK_ACCESS_TOKEN },
      },
      {
        headers: {
          'Set-Cookie':
            'refresh_token=mock-refresh-token; Max-Age=604800; HttpOnly; SameSite=Strict',
        },
      },
    ),
  ),
  http.delete('*/auth/sessions', () => new HttpResponse(null, { status: 204 })),
];
