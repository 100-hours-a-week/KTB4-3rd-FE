'use client';

import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { getAccessToken } from '@/entities/auth';
import { carpoolRequestQueryKeys } from '@/shared/api/carpool-request-query-keys';
import {
  carpoolMutationQueryKeys,
  chatRoomMutationQueryKeys,
} from '@/shared/api/carpool-mutation-query-keys';

import {
  decideCarpoolRequest,
  type CarpoolRequestDecision,
  type CarpoolRequestDetailResponse,
} from '@/features/carpool-request-review/api';

export type CarpoolRequestDecisionVariables = {
  viewerId: number;
  carpoolId: number;
  requestId: number;
  status: CarpoolRequestDecision;
};

type CachedRequestPage = {
  data: { items: { id: number }[]; next_cursor: string | null };
};

type CachedRequestList = InfiniteData<CachedRequestPage, string | undefined>;

export const carpoolRequestDecisionMutationKeys = {
  decide: (viewerId: number) => ['carpools', 'request-decisions', { viewerId }] as const,
};

export function useCarpoolRequestDecisionMutation(viewerId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: carpoolRequestDecisionMutationKeys.decide(viewerId),
    mutationFn: async ({ carpoolId, requestId, status }: CarpoolRequestDecisionVariables) =>
      decideCarpoolRequest(await getAccessToken(), carpoolId, requestId, status),
    onSuccess: async (response, variables) => {
      const { viewerId: submittedViewerId, carpoolId, requestId, status } = variables;
      const detailKey = carpoolRequestQueryKeys.detail(submittedViewerId, carpoolId, requestId);
      const receivedListKey = carpoolRequestQueryKeys.lists(submittedViewerId);

      await Promise.all([
        queryClient.cancelQueries({ queryKey: detailKey, exact: true }),
        queryClient.cancelQueries({
          queryKey: [...receivedListKey, 'RECEIVED'],
        }),
      ]);

      queryClient.setQueriesData<CachedRequestList>(
        {
          queryKey: [...receivedListKey, 'RECEIVED'],
        },
        (previous) => {
          if (!previous) {
            return previous;
          }

          return {
            ...previous,
            pages: previous.pages.map((page) => ({
              ...page,
              data: {
                ...page.data,
                items: page.data.items.filter((item) => item.id !== requestId),
              },
            })),
          };
        },
      );

      queryClient.setQueryData<CarpoolRequestDetailResponse>(detailKey, (previous) =>
        previous
          ? { ...previous, data: { ...previous.data, status: response.data.status } }
          : previous,
      );

      const invalidations = [
        queryClient.invalidateQueries({ queryKey: [...receivedListKey, 'RECEIVED'] }),
        queryClient.invalidateQueries({ queryKey: detailKey, exact: true }),
      ];

      if (status === 'ACCEPTED') {
        invalidations.push(
          queryClient.invalidateQueries({ queryKey: carpoolMutationQueryKeys.detail(carpoolId) }),
          queryClient.invalidateQueries({ queryKey: carpoolMutationQueryKeys.pins() }),
          queryClient.invalidateQueries({ queryKey: carpoolMutationQueryKeys.nearby() }),
          queryClient.invalidateQueries({ queryKey: chatRoomMutationQueryKeys.all() }),
        );
      }

      await Promise.allSettled(invalidations);
    },
    retry: false,
    networkMode: 'always',
    gcTime: 300_000,
    throwOnError: false,
  });
}
