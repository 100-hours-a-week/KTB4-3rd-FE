'use client';

import { useMutation } from '@tanstack/react-query';

import { cancelTaxiPotMatching } from '@/features/taxi-pot-matching/api/taxi-pot-matching';

export function useCancelTaxiPotMatchingMutation() {
  return useMutation({ mutationFn: cancelTaxiPotMatching });
}
