import { apiFetch } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/api/types';

import type { BankCode } from '@/features/signup/model/bank';
import type { GenderCode } from '@/features/signup/model/gender';
import type { SignupFormValues } from '@/features/signup/model/signup-schema';

export type SignupAgreements = {
  service: boolean;
  location: boolean;
  gender: boolean;
  account_third_party: boolean;
  marketing: boolean;
};

export type SignupPayload = {
  nickname: string;
  gender: GenderCode;
  bank_name?: BankCode;
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
  if (values.gender === null) {
    throw new Error('성별을 선택해주세요.');
  }

  const payload: SignupPayload = {
    nickname: values.nickname.trim(),
    gender: values.gender,
    agreements: values.agreements,
  };

  if (values.bank_name) {
    payload.bank_name = values.bank_name;
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

export async function completeSignup(payload: SignupPayload) {
  return apiFetch<ApiResponse<SignupData>>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
