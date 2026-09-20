import { describe, expect, it } from 'vitest';

import { loginWithKakao } from '@/entities/auth/api/auth';
import { checkNicknameAvailability, completeSignup } from '@/features/signup/api/signup';
import { BankCode } from '@/features/signup/model/bank';

describe('MSW mock API', () => {
  it('카카오 신규 로그인을 mock한다', async () => {
    const response = await loginWithKakao('mock-code');

    expect(response.data).toEqual({
      signup_token: 'mock-signup-token',
      is_new_user: true,
      user_id: 15,
    });
  });

  it('닉네임 중복확인 결과를 mock한다', async () => {
    const response = await checkNicknameAvailability('mock-signup-token', '제리');

    expect(response.data.available).toBe(true);
  });

  it('회원가입 성공 응답을 mock한다', async () => {
    const response = await completeSignup('mock-signup-token', {
      nickname: '제리',
      bank_name: BankCode.KB,
      account_no: '11012345678',
      terms_agreed: true,
    });

    expect(response.data.access_token).toBe('mock-access-token');
  });
});
