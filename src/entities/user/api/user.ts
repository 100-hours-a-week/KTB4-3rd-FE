import { apiFetch } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/api/types';

import type { BankAccountData, SaveBankAccountPayload, User } from '@/entities/user/model/user';

export type CurrentUserResponse = ApiResponse<User>;
export type SaveBankAccountResponse = ApiResponse<BankAccountData>;

export function getCurrentUser(accessToken: string): Promise<CurrentUserResponse> {
  return apiFetch<CurrentUserResponse>('/users/me', {
    token: accessToken,
  });
}

export function saveBankAccount(
  accessToken: string,
  payload: SaveBankAccountPayload,
): Promise<SaveBankAccountResponse> {
  return apiFetch<SaveBankAccountResponse>('/users/me/bank-account', {
    method: 'PUT',
    token: accessToken,
    body: JSON.stringify(payload),
  });
}
