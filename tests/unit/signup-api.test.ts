import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/shared/api/mocks/server';

import { checkNicknameAvailability, completeSignup, toSignupPayload } from '@/features/signup';
import { BankCode } from '@/features/signup/model/bank';

describe('signup API', () => {
  it('화면 입력값을 백엔드 회원가입 payload로 변환한다', () => {
    expect(
      toSignupPayload({
        nickname: '제리',
        bankCode: BankCode.KB,
        accountNumber: '110-123-45678',
        profileImageUrl: 'https://cdn.moyeota.app/p/tmp15.jpg',
        termsAgreed: true,
      }),
    ).toEqual({
      nickname: '제리',
      bank_name: BankCode.KB,
      account_no: '11012345678',
      profile_image_url: 'https://cdn.moyeota.app/p/tmp15.jpg',
      terms_agreed: true,
    });
  });

  it('회원가입 토큰과 JSON payload를 전송한다', async () => {
    let authorization: string | null = null;
    let body: unknown;

    server.use(
      http.post('*/users', async ({ request }) => {
        authorization = request.headers.get('Authorization');
        body = await request.json();

        return HttpResponse.json(
          {
            message: '가입이 완료되었어요',
            data: {
              user_id: 15,
              access_token: 'access-token',
              created_at: '2026-09-06T09:00:00',
            },
          },
          { status: 201 },
        );
      }),
    );

    const response = await completeSignup('signup-token', {
      nickname: '제리',
      bank_name: BankCode.KB,
      account_no: '11012345678',
      terms_agreed: true,
    });

    expect(authorization).toBe('Bearer signup-token');
    expect(body).toEqual({
      nickname: '제리',
      bank_name: BankCode.KB,
      account_no: '11012345678',
      terms_agreed: true,
    });
    expect(response.data.access_token).toBe('access-token');
  });

  it('닉네임 중복확인 요청에 signup_token과 query parameter를 사용한다', async () => {
    let authorization: string | null = null;
    let nickname: string | null = null;

    server.use(
      http.get('*/users/nickname-availability', ({ request }) => {
        authorization = request.headers.get('Authorization');
        nickname = new URL(request.url).searchParams.get('nickname');

        return HttpResponse.json({
          message: '사용할 수 있는 닉네임이에요',
          data: { available: true },
        });
      }),
    );

    const response = await checkNicknameAvailability('signup-token', '제리');

    expect(authorization).toBe('Bearer signup-token');
    expect(nickname).toBe('제리');
    expect(response.data.available).toBe(true);
  });

  it('백엔드 에러 응답을 ApiError로 변환한다', async () => {
    server.use(
      http.post('*/users', () =>
        HttpResponse.json(
          {
            message: '이미 사용 중인 닉네임이에요',
            error: {
              code: 'NICKNAME_DUPLICATE',
              field: 'nickname',
            },
          },
          { status: 409 },
        ),
      ),
    );

    const request = completeSignup('signup-token', {
      nickname: '제리',
      terms_agreed: true,
    });

    await expect(request).rejects.toMatchObject({
      status: 409,
      code: 'NICKNAME_DUPLICATE',
      field: 'nickname',
      message: '이미 사용 중인 닉네임이에요',
    });
  });
});
