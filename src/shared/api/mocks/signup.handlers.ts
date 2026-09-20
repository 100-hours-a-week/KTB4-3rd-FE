import { http, HttpResponse } from 'msw';

import {
  MOCK_ACCESS_TOKEN,
  MOCK_SIGNUP_TOKEN,
  errorResponse,
  getBearerToken,
  isValidNickname,
} from './mock-utils';

const MOCK_BANK_CODES = new Set(['kb', 'shinhan', 'woori', 'hana', 'nh', 'ibk', 'kakao', 'toss']);

type MockSignupRequest = {
  nickname?: unknown;
  bank_name?: unknown;
  account_no?: unknown;
  profile_image_url?: unknown;
  terms_agreed?: unknown;
};

export const signupHandlers = [
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
  http.delete('*/users/me', () => new HttpResponse(null, { status: 204 })),
];
