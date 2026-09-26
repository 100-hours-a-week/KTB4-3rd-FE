import { http, HttpResponse } from 'msw';

import {
  MOCK_ACCESS_TOKEN,
  MOCK_SIGNUP_TOKEN,
  errorResponse,
  getBearerToken,
  getCookieValue,
  isValidNickname,
} from './mock-utils';

const MOCK_BANK_NAMES = new Set([
  'KB국민은행',
  '신한은행',
  '우리은행',
  '하나은행',
  'NH농협은행',
  'IBK기업은행',
  '카카오뱅크',
  '토스뱅크',
]);
const MOCK_GENDERS = new Set(['MALE', 'FEMALE']);

const REQUIRED_AGREEMENT_FIELDS = ['service', 'location', 'gender'] as const;
const ALL_AGREEMENT_FIELDS = [
  ...REQUIRED_AGREEMENT_FIELDS,
  'account_third_party',
  'marketing',
] as const;
const consumedSignupTokens = new Set<string>();

type MockSignupRequest = {
  nickname?: unknown;
  gender?: unknown;
  bank_name?: unknown;
  account_no?: unknown;
  profile_image_key?: unknown;
  agreements?: unknown;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

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
    const signupToken = getBearerToken(request) ?? getCookieValue(request, 'signup_token');
    if (signupToken !== MOCK_SIGNUP_TOKEN || consumedSignupTokens.has(signupToken)) {
      return errorResponse(
        '회원가입 진행 시간이 만료됐어요. 카카오 로그인부터 다시 시도해주세요',
        'UNAUTHORIZED',
        null,
        401,
      );
    }

    const body = (await request.json()) as MockSignupRequest;

    if (!isObject(body.agreements)) {
      return errorResponse(
        '필수 약관에 동의해주세요',
        'VALIDATION_ERROR',
        'agreements.service',
        400,
      );
    }

    for (const field of REQUIRED_AGREEMENT_FIELDS) {
      if (body.agreements[field] !== true) {
        return errorResponse(
          '필수 약관에 동의해주세요',
          'VALIDATION_ERROR',
          `agreements.${field}`,
          400,
        );
      }
    }

    for (const field of ALL_AGREEMENT_FIELDS) {
      if (typeof body.agreements[field] !== 'boolean') {
        return errorResponse(
          '약관 동의 정보를 확인해주세요',
          'VALIDATION_ERROR',
          `agreements.${field}`,
          400,
        );
      }
    }

    if (!isValidNickname(body.nickname)) {
      return errorResponse('2~12자로 입력해주세요', 'VALIDATION_ERROR', 'nickname', 422);
    }

    if (body.nickname === '중복닉네임') {
      return errorResponse('이미 사용 중인 닉네임이에요', 'NICKNAME_DUPLICATE', 'nickname', 409);
    }

    if (!MOCK_GENDERS.has(String(body.gender))) {
      return errorResponse('성별을 선택해주세요', 'VALIDATION_ERROR', 'gender', 422);
    }

    if (body.bank_name !== undefined && !MOCK_BANK_NAMES.has(String(body.bank_name))) {
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

    if (body.profile_image_key !== undefined) {
      if (body.profile_image_key === 'invalid-image-key') {
        return errorResponse(
          '사용할 수 없는 이미지예요. 이미지를 다시 올려주세요',
          'VALIDATION_ERROR',
          'profile_image_key',
          422,
        );
      }

      if (body.profile_image_key === 'missing-image-key') {
        return errorResponse(
          '이미지 업로드가 완료되지 않았어요. 이미지를 다시 올려주세요',
          'IMAGE_NOT_EXISTS',
          'profile_image_key',
          422,
        );
      }

      if (typeof body.profile_image_key !== 'string' || body.profile_image_key.length === 0) {
        return errorResponse(
          '사용할 수 없는 이미지예요. 이미지를 다시 올려주세요',
          'VALIDATION_ERROR',
          'profile_image_key',
          422,
        );
      }
    }

    consumedSignupTokens.add(signupToken);

    return HttpResponse.json(
      {
        message: '가입이 완료되었어요',
        data: {
          user_id: 15,
          access_token: MOCK_ACCESS_TOKEN,
          created_at: '2026-09-06T09:00:00',
        },
      },
      {
        status: 201,
        headers: {
          'Set-Cookie':
            'refresh_token=mock-refresh-token; Max-Age=604800; HttpOnly; Secure; SameSite=Strict',
        },
      },
    );
  }),
  http.delete('*/users/me', () => new HttpResponse(null, { status: 204 })),
];

export function resetSignupMockState() {
  consumedSignupTokens.clear();
}
