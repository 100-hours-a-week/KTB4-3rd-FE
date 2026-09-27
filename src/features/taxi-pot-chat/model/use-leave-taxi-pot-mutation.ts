'use client';

import { useMutation } from '@tanstack/react-query';

import { leaveTaxiPot } from '@/features/taxi-pot-chat/api/taxi-pot';

export function useLeaveTaxiPotMutation() {
  return useMutation<void, Error, number>({
    mutationFn: leaveTaxiPot,
  });
}
