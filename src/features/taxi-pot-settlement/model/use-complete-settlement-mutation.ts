'use client';

import { useMutation } from '@tanstack/react-query';

import { getAccessToken } from '@/entities/auth';

import { completeSettlement } from '@/features/taxi-pot-settlement/api/complete-settlement';

export function useCompleteSettlementMutation() {
  return useMutation({
    mutationFn: async (settlementId: number) =>
      completeSettlement(await getAccessToken(), settlementId),
  });
}
