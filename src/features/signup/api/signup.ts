import { apiFetch } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/api/types';

import type { BankCode } from '@/features/signup/model/bank';

export type SignupPayload = {
  nickname: string;
  bank_name?: BankCode;
  profile_image_url?: string;
  account_no?: string;
  terms_agreed: boolean;
};

export type SignupFormValues = {
  nickname: string;
  bankCode: BankCode | null;
  accountNumber: string;
  profileImageUrl: string | null;
  termsAgreed: boolean;
};

export type SignupData = {
  user_id: number;
  access_token: string;
  created_at: string;
};

export type NicknameAvailabilityData = {
  available: boolean;
};

export function toSignupPayload(values: SignupFormValues): SignupPayload {
  const accountNumber = values.accountNumber.replaceAll('-', '');
  const payload: SignupPayload = {
    nickname: values.nickname,
    terms_agreed: values.termsAgreed,
  };

  if (values.bankCode) {
    payload.bank_name = values.bankCode;
  }

  if (accountNumber) {
    payload.account_no = accountNumber;
  }

  if (values.profileImageUrl) {
    payload.profile_image_url = values.profileImageUrl;
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

export async function checkNicknameAvailability(signupToken: string, nickname: string) {
  const searchParams = new URLSearchParams({ nickname });

  return apiFetch<ApiResponse<NicknameAvailabilityData>>(
    `/users/nickname-availability?${searchParams.toString()}`,
    { token: signupToken },
  );
}
