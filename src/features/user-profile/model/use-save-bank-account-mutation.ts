'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getAccessToken } from '@/entities/auth';
import { saveBankAccount, type SaveBankAccountPayload } from '@/entities/user';

import { userProfileQueries } from '@/features/user-profile/api/user-profile.queries';

export function useSaveBankAccountMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SaveBankAccountPayload) =>
      saveBankAccount(await getAccessToken(), payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userProfileQueries.all() });
    },
  });
}
