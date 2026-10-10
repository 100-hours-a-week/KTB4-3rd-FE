'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getAccessTokenForViewer } from '@/entities/auth';
import { carpoolQueries } from '@/shared/api/carpool';
import {
  createCarpoolJoinRequest,
  type CreateCarpoolJoinRequestPayload,
  type CreateCarpoolJoinRequestResponse,
} from '@/features/carpool-join-request/api';

export type CreateCarpoolJoinRequestVariables = {
  viewerId: number;
  carpoolId: number;
  payload: CreateCarpoolJoinRequestPayload;
  signal?: AbortSignal;
};

export function useCarpoolJoinRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation<CreateCarpoolJoinRequestResponse, Error, CreateCarpoolJoinRequestVariables>({
    mutationKey: ['carpools', 'join-requests'] as const,
    mutationFn: async ({ viewerId, carpoolId, payload, signal }) =>
      createCarpoolJoinRequest(await getAccessTokenForViewer(viewerId), carpoolId, payload, signal),
    onSuccess: () => {
      void Promise.allSettled([
        queryClient.invalidateQueries({
          queryKey: carpoolQueries.pinsPrefix(),
          refetchType: 'active',
        }),
        queryClient.invalidateQueries({
          queryKey: carpoolQueries.nearbyPrefix(),
          refetchType: 'active',
        }),
      ]);
    },
    retry: false,
    throwOnError: false,
  });
}
