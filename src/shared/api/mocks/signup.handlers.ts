import { http, HttpResponse } from 'msw';

import {
  MOCK_ACCESS_TOKEN,
  MOCK_SIGNUP_TOKEN,
  errorResponse,
  getBearerToken,
  getCookieValue,
  isValidNickname,
} from './mock-utils';

const MOCK_BANK_CODES = new Set(['kb', 'shinhan', 'woori', 'hana', 'nh', 'ibk', 'kakao', 'toss']);
const MOCK_GENDERS = new Set(['MALE', 'FEMALE']);

const REQUIRED_AGREEMENT_FIELDS = ['service', 'location', 'gender'] as const;
const ALL_AGREEMENT_FIELDS = [
  ...REQUIRED_AGREEMENT_FIELDS,
  'account_third_party',
  'marketing',
] as const;
const consumedSignupTokens = new Set<string>();

export const MOCK_PROFILE_UPLOAD_URL = 'http://localhost:8080/mock-s3/profile-image';
export const MOCK_PROFILE_IMAGE_KEY = 'tmp/profile/mock-profile-image.png';

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
  http.post('*/images/presigned-url', async ({ request }) => {
    const signupToken = getBearerToken(request) ?? getCookieValue(request, 'signup_token');
    if (signupToken !== MOCK_SIGNUP_TOKEN && signupToken !== MOCK_ACCESS_TOKEN) {
      return errorResponse('로그인이 필요합니다', 'UNAUTHORIZED', null, 401);
    }

    const body = (await request.json()) as Record<string, unknown>;
    const contentType = body.content_type;
    const contentLength = body.content_length;

    if (body.purpose !== 'PROFILE') {
      return errorResponse(
        '회원가입 중에는 프로필 이미지만 올릴 수 있습니다',
        'FORBIDDEN',
        null,
        403,
      );
    }

    if (contentType !== 'image/jpeg' && contentType !== 'image/png') {
      return errorResponse('지원하지 않는 확장자입니다', 'VALIDATION_ERROR', 'content_type', 422);
    }

    if (typeof contentLength !== 'number' || contentLength < 1 || contentLength > 5 * 1024 * 1024) {
      return errorResponse(
        '이미지는 5MB 이하만 업로드할 수 있습니다',
        'VALIDATION_ERROR',
        'content_length',
        422,
      );
    }

    return HttpResponse.json({
      message: '이미지 업로드 URL이 발급되었습니다.',
      data: {
        upload_url: MOCK_PROFILE_UPLOAD_URL,
        image_key: MOCK_PROFILE_IMAGE_KEY,
        expires_in: 300,
      },
    });
  }),
  http.put(MOCK_PROFILE_UPLOAD_URL, ({ request }) => {
    const contentType = request.headers.get('content-type');
    if (contentType !== 'image/jpeg' && contentType !== 'image/png') {
      return new HttpResponse(null, { status: 403 });
    }

    return new HttpResponse(null, { status: 200 });
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
