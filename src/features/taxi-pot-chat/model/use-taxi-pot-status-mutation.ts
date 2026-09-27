'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  updateTaxiPotStatus,
  type TaxiPotDetailResponse,
  type TaxiPotTransitionStatus,
} from '@/features/taxi-pot-chat/api/taxi-pot';
import { taxiPotQueries } from '@/features/taxi-pot-chat/api/taxi-pot.queries';

export function useTaxiPotStatusMutation(taxiPotId: string) {
  const queryClient = useQueryClient();

  return useMutation<TaxiPotDetailResponse, Error, TaxiPotTransitionStatus>({
    mutationFn: (status) => updateTaxiPotStatus(taxiPotId, status),
    onSuccess: (response) => {
      queryClient.setQueryData(taxiPotQueries.detail(taxiPotId).queryKey, response);
    },
  });
}
