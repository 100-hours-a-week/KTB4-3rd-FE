'use client';

import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useCallback } from 'react';

import { getAccessToken } from '@/entities/auth';
import { carpoolRequestQueryKeys } from '@/shared/api/carpool-request-query-keys';
import { ApiError } from '@/shared/api/client';
import {
  carpoolMutationQueryKeys,
  chatRoomMutationQueryKeys,
} from '@/shared/api/carpool-mutation-query-keys';

import {
  decideCarpoolRequest,
  type CarpoolRequestDecision,
  type CarpoolRequestDetail,
  type CarpoolRequestDetailResponse,
  carpoolRequestReviewQueries,
} from '@/features/carpool-request-review/api';
import {
  getCarpoolRequestDecisionOutcomeKey,
  useCarpoolRequestDecisionStore,
  type CarpoolRequestDecisionOutcome,
} from './carpool-request-decision-store';

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

const getOutcomeKey = (variables: Omit<CarpoolRequestDecisionVariables, 'status'>) =>
  getCarpoolRequestDecisionOutcomeKey(variables.viewerId, variables.carpoolId, variables.requestId);

class CarpoolRequestDecisionBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CarpoolRequestDecisionBlockedError';
  }
}

export const carpoolRequestDecisionMutationKeys = {
  decide: (viewerId: number) => ['carpools', 'request-decisions', { viewerId }] as const,
};

function isUncertainFailure(error: unknown) {
  return (
    (error instanceof ApiError && error.status >= 500) ||
    error instanceof TypeError ||
    (error instanceof DOMException && ['AbortError', 'TimeoutError'].includes(error.name))
  );
}

async function applyConfirmedRequestStatus(
  queryClient: ReturnType<typeof useQueryClient>,
  variables: Omit<CarpoolRequestDecisionVariables, 'status'>,
  status: CarpoolRequestDetail['status'],
) {
  const { viewerId, carpoolId, requestId } = variables;
  const detailKey = carpoolRequestQueryKeys.detail(viewerId, carpoolId, requestId);
  const receivedListKey = [...carpoolRequestQueryKeys.lists(viewerId), 'RECEIVED'] as const;

  await Promise.all([
    queryClient.cancelQueries({ queryKey: detailKey, exact: true }),
    queryClient.cancelQueries({ queryKey: receivedListKey }),
  ]);

  if (status !== 'PENDING') {
    queryClient.setQueriesData<CachedRequestList>({ queryKey: receivedListKey }, (previous) => {
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
    });
  }

  queryClient.setQueryData<CarpoolRequestDetailResponse>(detailKey, (previous) =>
    previous ? { ...previous, data: { ...previous.data, status } } : previous,
  );

  const invalidations = [
    queryClient.invalidateQueries({ queryKey: receivedListKey }),
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
}

async function checkDecisionOutcome(
  queryClient: ReturnType<typeof useQueryClient>,
  variables: Omit<CarpoolRequestDecisionVariables, 'status'>,
  outcome: CarpoolRequestDecisionOutcome,
) {
  const outcomeKey = getOutcomeKey(variables);
  const decisionStore = useCarpoolRequestDecisionStore.getState();
  if (decisionStore.outcomes[outcomeKey]?.state === 'checking') {
    return null;
  }

  decisionStore.markChecking(outcomeKey, outcome.requestedStatus);

  try {
    const detail = await queryClient.fetchQuery(
      carpoolRequestReviewQueries.detail({
        viewerId: variables.viewerId,
        carpoolId: variables.carpoolId,
        requestId: variables.requestId,
        enabled: true,
      }),
    );

    if (detail.data.status === 'PENDING') {
      decisionStore.markUncertain(outcomeKey, outcome.requestedStatus);
      return detail.data.status;
    }

    await applyConfirmedRequestStatus(queryClient, variables, detail.data.status);
    decisionStore.clearOutcome(outcomeKey);
    return detail.data.status;
  } catch {
    decisionStore.markUncertain(outcomeKey, outcome.requestedStatus);
    return null;
  }
}

export function useCarpoolRequestDecisionMutation(viewerId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: carpoolRequestDecisionMutationKeys.decide(viewerId),
    mutationFn: async (variables: CarpoolRequestDecisionVariables) => {
      const outcomeKey = getOutcomeKey(variables);
      const decisionStore = useCarpoolRequestDecisionStore.getState();

      if (decisionStore.outcomes[outcomeKey]) {
        throw new CarpoolRequestDecisionBlockedError(
          '처리 결과를 확인한 뒤 다시 시도할 수 있습니다.',
        );
      }

      if (!decisionStore.beginDecision(outcomeKey)) {
        throw new CarpoolRequestDecisionBlockedError('이미 이 요청을 처리하고 있습니다.');
      }

      return decideCarpoolRequest(
        await getAccessToken(),
        variables.carpoolId,
        variables.requestId,
        variables.status,
      );
    },
    onSuccess: async (response, variables) => {
      const outcomeKey = getOutcomeKey(variables);
      try {
        await applyConfirmedRequestStatus(queryClient, variables, response.data.status);
        useCarpoolRequestDecisionStore.getState().clearOutcome(outcomeKey);
      } finally {
        useCarpoolRequestDecisionStore.getState().finishDecision(outcomeKey);
      }
    },
    onError: async (error, variables) => {
      if (error instanceof CarpoolRequestDecisionBlockedError) {
        return;
      }

      const outcomeKey = getOutcomeKey(variables);
      try {
        if (!isUncertainFailure(error)) {
          return;
        }

        await checkDecisionOutcome(queryClient, variables, {
          requestedStatus: variables.status,
          state: 'uncertain',
        });
      } finally {
        useCarpoolRequestDecisionStore.getState().finishDecision(outcomeKey);
      }
    },
    retry: false,
    networkMode: 'always',
    gcTime: 300_000,
    throwOnError: false,
  });
}

export function useCarpoolRequestDecisionOutcome(
  variables: Omit<CarpoolRequestDecisionVariables, 'status'>,
) {
  const queryClient = useQueryClient();
  const outcomeKey = getOutcomeKey(variables);
  const outcome = useCarpoolRequestDecisionStore((state) => state.outcomes[outcomeKey]);
  const isDecisionProcessing = useCarpoolRequestDecisionStore((state) =>
    Boolean(state.inFlight[outcomeKey]),
  );

  const checkOutcome = useCallback(async () => {
    if (!outcome) {
      return null;
    }

    return checkDecisionOutcome(queryClient, variables, outcome);
  }, [outcome, queryClient, variables]);

  return {
    outcome,
    isOutcomeUncertain: outcome !== undefined,
    isDecisionProcessing,
    isCheckingOutcome: outcome?.state === 'checking',
    checkOutcome,
  };
}
