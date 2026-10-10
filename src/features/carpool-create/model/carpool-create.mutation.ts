'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getAccessToken } from '@/entities/auth';
import {
  createCarpool,
  type CarpoolCreatePayload,
  type CarpoolCreateResponse,
} from '@/features/carpool-create/api';
import { carpoolQueryKeys } from '@/shared/api/carpool/carpool-query-keys';

export const carpoolCreateMutationKeys = {
  create: () => ['carpools', 'create'] as const,
};

export function useCarpoolCreateMutation() {
  const queryClient = useQueryClient();

  return useMutation<CarpoolCreateResponse, Error, CarpoolCreatePayload>({
    mutationKey: carpoolCreateMutationKeys.create(),
    mutationFn: async (payload) => createCarpool(await getAccessToken(), payload),
    onSuccess: async () => {
      await Promise.allSettled([
        queryClient.invalidateQueries({
          queryKey: carpoolQueryKeys.pins(),
          refetchType: 'active',
        }),
        queryClient.invalidateQueries({
          queryKey: carpoolQueryKeys.nearby(),
          refetchType: 'active',
        }),
      ]);
    },
    retry: false,
    networkMode: 'always',
    gcTime: 5 * 60 * 1_000,
    throwOnError: false,
  });
}
