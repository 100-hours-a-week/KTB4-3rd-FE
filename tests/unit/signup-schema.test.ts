import { describe, expect, it } from 'vitest';

import { BankCode } from '@/features/signup/model/bank';
import { signupSchema } from '@/features/signup/model/signup-schema';

const baseValues = {
  profile_image_key: new File(['profile'], 'profile.png', { type: 'image/png' }),
  nickname: '모여타사용자',
  bank_name: null,
  account_no: '',
  agreements: {
    service: true,
    location: true,
    gender: true,
    account_third_party: false,
    marketing: false,
  },
};

describe('signupSchema', () => {
  it('프로필 이미지를 입력하지 않으면 검증에 실패한다', () => {
    const result = signupSchema.safeParse({
      ...baseValues,
      profile_image_key: null,
    });

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('프로필 이미지가 없는 값이 통과했습니다.');
    }
    expect(result.error.issues).toContainEqual(
      expect.objectContaining({ path: ['profile_image_key'] }),
    );
  });

  it('은행과 계좌번호를 모두 입력하지 않으면 통과한다', () => {
    expect(signupSchema.safeParse(baseValues).success).toBe(true);
  });

  it('은행만 입력하면 계좌번호 검증에 실패한다', () => {
    const result = signupSchema.safeParse({
      ...baseValues,
      bank_name: BankCode.KB,
    });

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('은행만 입력한 값이 통과했습니다.');
    }
    expect(result.error.issues).toContainEqual(expect.objectContaining({ path: ['account_no'] }));
  });

  it('계좌번호만 입력하면 출금 은행 검증에 실패한다', () => {
    const result = signupSchema.safeParse({
      ...baseValues,
      account_no: '110-123-456789',
    });

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('계좌번호만 입력한 값이 통과했습니다.');
    }
    expect(result.error.issues).toContainEqual(expect.objectContaining({ path: ['bank_name'] }));
  });

  it('은행과 계좌번호를 함께 입력하면 통과한다', () => {
    expect(
      signupSchema.safeParse({
        ...baseValues,
        bank_name: BankCode.KB,
        account_no: '110-123-456789',
      }).success,
    ).toBe(true);
  });
});
