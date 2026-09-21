import { describe, expect, it } from 'vitest';

import { completeSignup, toSignupPayload } from '@/features/signup';
import { BankCode } from '@/features/signup/model/bank';
import type { SignupFormValues } from '@/features/signup/model/signup-schema';

const formValues: SignupFormValues = {
  profileImage: new File(['profile'], 'profile.png', { type: 'image/png' }),
  nickname: ' 제리 ',
  bank: BankCode.KB,
  accountNumber: '110-123-45678',
  serviceTerms: true,
  locationTerms: true,
  genderTerms: true,
  accountInfoTerms: true,
  marketingTerms: false,
};

describe('signup API', () => {
  it('화면 입력값을 명세의 회원가입 payload로 변환한다', () => {
    expect(toSignupPayload(formValues, 'tmp/profile/profile-image.jpg')).toEqual({
      nickname: '제리',
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

  it('signup_token을 Authorization Bearer로 전송한다', async () => {
    const response = await completeSignup('mock-signup-token', toSignupPayload(formValues));

    expect(response.data).toMatchObject({
      user_id: 15,
      access_token: 'mock-access-token',
    });
  });

  it('API 실패 응답을 상태, 코드, 필드가 있는 ApiError로 변환한다', async () => {
    await expect(
      completeSignup('mock-signup-token', {
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

  it('유효하지 않은 signup_token이면 401 오류를 반환한다', async () => {
    await expect(
      completeSignup('invalid-token', toSignupPayload(formValues)),
    ).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
      field: null,
    });
  });
});
