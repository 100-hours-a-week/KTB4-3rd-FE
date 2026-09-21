import { apiFetch } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/api/types';

import { BankCode } from '@/features/signup/model/bank';
import type { SignupFormValues } from '@/features/signup/model/signup-schema';

const BANK_API_NAMES: Record<BankCode, string> = {
  [BankCode.KB]: 'KB국민은행',
  [BankCode.SHINHAN]: '신한은행',
  [BankCode.WOORI]: '우리은행',
  [BankCode.HANA]: '하나은행',
  [BankCode.NH]: 'NH농협은행',
  [BankCode.IBK]: 'IBK기업은행',
  [BankCode.KAKAO]: '카카오뱅크',
  [BankCode.TOSS]: '토스뱅크',
};

export type SignupAgreements = {
  service: boolean;
  location: boolean;
  gender: boolean;
  account_third_party: boolean;
  marketing: boolean;
};

export type SignupPayload = {
  nickname: string;
  bank_name?: string;
  profile_image_key?: string;
  account_no?: string;
  agreements: SignupAgreements;
};

export type SignupData = {
  user_id: number;
  access_token: string;
  created_at: string;
};

export function toSignupPayload(
  values: SignupFormValues,
  profileImageKey?: string | null,
): SignupPayload {
  const payload: SignupPayload = {
    nickname: values.nickname.trim(),
    agreements: values.agreements,
  };

  if (values.bank_name) {
    payload.bank_name = BANK_API_NAMES[values.bank_name];
  }

  const accountNumber = values.account_no.replaceAll('-', '');
  if (accountNumber) {
    payload.account_no = accountNumber;
  }

  if (profileImageKey) {
    payload.profile_image_key = profileImageKey;
  }

  return payload;
}

export async function completeSignup(signupToken: string, payload: SignupPayload) {
  return apiFetch<ApiResponse<SignupData>>('/users', {
    method: 'POST',
    token: signupToken,
    body: JSON.stringify(payload),
  });
}
