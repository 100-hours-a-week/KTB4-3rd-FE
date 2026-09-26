import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { completeSignup, toSignupPayload } from '@/features/signup';
import { BankCode } from '@/features/signup/model/bank';
import { GenderCode } from '@/features/signup/model/gender';
import type { SignupFormValues } from '@/features/signup/model/signup-schema';
import { server } from '@/shared/api/mocks/server';

const formValues: SignupFormValues = {
  profile_image_key: new File(['profile'], 'profile.png', { type: 'image/png' }),
  nickname: ' 제리 ',
  gender: GenderCode.MALE,
  bank_name: BankCode.KB,
  account_no: '110-123-45678',
  agreements: {
    service: true,
    location: true,
    gender: true,
    account_third_party: true,
    marketing: false,
  },
};

describe('signup API', () => {
  it('화면 입력값을 명세의 회원가입 payload로 변환한다', () => {
    expect(toSignupPayload(formValues, 'tmp/profile/profile-image.jpg')).toEqual({
      nickname: '제리',
      gender: GenderCode.MALE,
      bank_name: 'KB국민은행',
      profile_image_key: 'tmp/profile/profile-image.jpg',
      account_no: '11012345678',
      agreements: {
        service: true,
        location: true,
        gender: true,
        account_third_party: true,
        marketing: false,
      },
    });
  });

  it('쿠키 인증으로 회원가입 요청을 보낸다', async () => {
    server.use(
      http.post('*/users', ({ request }) => {
        expect(request.headers.get('authorization')).toBeNull();

        return HttpResponse.json(
          {
            message: '가입이 완료되었어요',
            data: {
              user_id: 15,
              access_token: 'mock-access-token',
              created_at: '2026-09-06T09:00:00',
            },
          },
          { status: 201 },
        );
      }),
    );

    const response = await completeSignup(toSignupPayload(formValues));

    expect(response.data).toMatchObject({
      user_id: 15,
      access_token: 'mock-access-token',
    });
  });

  it('API 실패 응답을 상태, 코드, 필드가 있는 ApiError로 변환한다', async () => {
    server.use(
      http.post('*/users', ({ request }) => {
        expect(request.headers.get('authorization')).toBeNull();

        return HttpResponse.json(
          {
            message: '이미 사용 중인 닉네임이에요',
            error: { code: 'NICKNAME_DUPLICATE', field: 'nickname' },
          },
          { status: 409 },
        );
      }),
    );

    await expect(
      completeSignup({
        ...toSignupPayload(formValues),
        nickname: '중복닉네임',
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: 'NICKNAME_DUPLICATE',
      field: 'nickname',
      message: '이미 사용 중인 닉네임이에요',
    });
  });

  it('쿠키 인증이 없으면 API 오류를 반환한다', async () => {
    await expect(completeSignup(toSignupPayload(formValues))).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
      field: null,
    });
  });
});
