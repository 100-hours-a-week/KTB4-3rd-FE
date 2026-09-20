import { http, HttpResponse } from 'msw';

const MOCK_SIGNUP_TOKEN = 'mock-signup-token';
const MOCK_ACCESS_TOKEN = 'mock-access-token';
const MOCK_BANK_CODES = new Set(['kb', 'shinhan', 'woori', 'hana', 'nh', 'ibk', 'kakao', 'toss']);

type MockSignupRequest = {
  nickname?: unknown;
  bank_name?: unknown;
  account_no?: unknown;
  profile_image_url?: unknown;
  terms_agreed?: unknown;
};

function errorResponse(message: string, code: string, field: string | null, status: number) {
  return HttpResponse.json(
    {
      message,
      error: { code, field },
    },
    { status },
  );
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get('authorization');

  return authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : null;
}

function isValidNickname(nickname: unknown): nickname is string {
  return typeof nickname === 'string' && /^[가-힣A-Za-z0-9]{2,12}$/.test(nickname);
}

export const handlers = [
  http.get('*/api/health', () =>
    HttpResponse.json({
      status: 'ok',
    }),
  ),
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
  http.get('*/users/nickname-availability', ({ request }) => {
    const nickname = new URL(request.url).searchParams.get('nickname');

    if (!isValidNickname(nickname)) {
      return errorResponse('2~12자로 입력해주세요', 'VALIDATION_ERROR', 'nickname', 400);
    }

    const available = nickname !== '중복닉네임';

    return HttpResponse.json({
      message: available ? '사용할 수 있는 닉네임이에요' : '이미 사용 중인 닉네임이에요',
      data: { available },
    });
  }),
  http.post('*/users', async ({ request }) => {
    if (getBearerToken(request) !== MOCK_SIGNUP_TOKEN) {
      return errorResponse(
        '회원가입 진행 시간이 만료됐어요. 카카오 로그인부터 다시 시도해주세요',
        'UNAUTHORIZED',
        null,
        401,
      );
    }

    const body = (await request.json()) as MockSignupRequest;

    if (body.terms_agreed !== true) {
      return errorResponse('필수 약관에 동의해주세요', 'VALIDATION_ERROR', 'terms_agreed', 400);
    }

    if (!isValidNickname(body.nickname)) {
      return errorResponse('2~12자로 입력해주세요', 'VALIDATION_ERROR', 'nickname', 422);
    }

    if (body.nickname === '중복닉네임') {
      return errorResponse('이미 사용 중인 닉네임이에요', 'NICKNAME_DUPLICATE', 'nickname', 409);
    }

    if (body.bank_name !== undefined && !MOCK_BANK_CODES.has(String(body.bank_name))) {
      return errorResponse('지원하지 않는 은행이에요', 'VALIDATION_ERROR', 'bank_name', 422);
    }

    if (
      body.account_no !== undefined &&
      (typeof body.account_no !== 'string' || !/^\d{10,14}$/.test(body.account_no))
    ) {
      return errorResponse(
        '계좌번호는 숫자 10~14자리로 입력해주세요',
        'VALIDATION_ERROR',
        'account_no',
        422,
      );
    }

    return HttpResponse.json(
      {
        message: '가입이 완료되었어요',
        data: {
          user_id: 15,
          access_token: MOCK_ACCESS_TOKEN,
          created_at: '2026-09-06T09:00:00',
        },
      },
      { status: 201 },
    );
  }),
  http.post('*/auth/tokens', () =>
    HttpResponse.json({
      message: '토큰이 재발급되었습니다',
      data: { access_token: MOCK_ACCESS_TOKEN },
    }),
  ),
  http.delete('*/auth/sessions', () => new HttpResponse(null, { status: 204 })),
  http.delete('*/users/me', () => new HttpResponse(null, { status: 204 })),
];
