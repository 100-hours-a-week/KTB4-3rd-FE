'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import {
  AuthViewerMismatchError,
  getAccessTokenForViewer,
  isCurrentVerifiedViewer,
} from '@/entities/auth';
import { carpoolRequestQueryKeys } from '@/entities/carpool';
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

export type CarpoolRequestDecisionConfirmedHandler = (
  variables: Omit<CarpoolRequestDecisionVariables, 'status'>,
  status: CarpoolRequestDetail['status'],
) => void | Promise<void>;

type CarpoolRequestDecisionOptions = {
  onDecisionConfirmed?: CarpoolRequestDecisionConfirmedHandler;
};

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

async function notifyDecisionConfirmed(
  onDecisionConfirmed: CarpoolRequestDecisionConfirmedHandler | undefined,
  variables: Omit<CarpoolRequestDecisionVariables, 'status'>,
  status: CarpoolRequestDetail['status'],
) {
  if (status === 'PENDING' || !onDecisionConfirmed) {
    return;
  }

  try {
    await onDecisionConfirmed(variables, status);
  } catch {
    // A cache refresh callback must not turn a confirmed server decision into an uncertain result.
  }
}

async function applyConfirmedRequestStatus(
  queryClient: ReturnType<typeof useQueryClient>,
  variables: Omit<CarpoolRequestDecisionVariables, 'status'>,
  status: CarpoolRequestDetail['status'],
  onDecisionConfirmed?: CarpoolRequestDecisionConfirmedHandler,
) {
  const { viewerId, carpoolId, requestId } = variables;
  if (!isCurrentVerifiedViewer(viewerId)) {
    return;
  }

  const detailKey = carpoolRequestReviewQueries.detail({
    viewerId,
    carpoolId,
    requestId,
    enabled: true,
  }).queryKey;

  await queryClient.cancelQueries({ queryKey: detailKey, exact: true });

  if (!isCurrentVerifiedViewer(viewerId)) {
    return;
  }

  queryClient.setQueryData<CarpoolRequestDetailResponse>(detailKey, (previous) =>
    previous ? { ...previous, data: { ...previous.data, status } } : previous,
  );

  const invalidations = [queryClient.invalidateQueries({ queryKey: detailKey, exact: true })];

  if (status !== 'PENDING') {
    invalidations.push(
      queryClient.invalidateQueries({
        queryKey: carpoolRequestQueryKeys.listPrefix(viewerId),
      }),
    );
  }

  if (status === 'ACCEPTED') {
    invalidations.push(
      queryClient.invalidateQueries({
        queryKey: carpoolMutationQueryKeys.detail(viewerId, carpoolId),
      }),
      queryClient.invalidateQueries({ queryKey: carpoolMutationQueryKeys.pins() }),
      queryClient.invalidateQueries({ queryKey: carpoolMutationQueryKeys.nearby() }),
      queryClient.invalidateQueries({ queryKey: chatRoomMutationQueryKeys.all() }),
    );
  }

  await Promise.allSettled(invalidations);
  if (isCurrentVerifiedViewer(viewerId)) {
    await notifyDecisionConfirmed(onDecisionConfirmed, { viewerId, carpoolId, requestId }, status);
  }
}

async function checkDecisionOutcome(
  queryClient: ReturnType<typeof useQueryClient>,
  variables: Omit<CarpoolRequestDecisionVariables, 'status'>,
  outcome: CarpoolRequestDecisionOutcome,
  onDecisionConfirmed?: CarpoolRequestDecisionConfirmedHandler,
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

    await applyConfirmedRequestStatus(
      queryClient,
      variables,
      detail.data.status,
      onDecisionConfirmed,
    );
    decisionStore.clearOutcome(outcomeKey);
    return detail.data.status;
  } catch {
    decisionStore.markUncertain(outcomeKey, outcome.requestedStatus);
    return null;
  }
}

export function useCarpoolRequestDecisionMutation(
  viewerId: number,
  { onDecisionConfirmed }: CarpoolRequestDecisionOptions = {},
) {
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

      if (variables.viewerId !== viewerId) {
        throw new AuthViewerMismatchError();
      }

      return decideCarpoolRequest(
        await getAccessTokenForViewer(variables.viewerId),
        variables.carpoolId,
        variables.requestId,
        variables.status,
      );
    },
    onSuccess: async (response, variables) => {
      const outcomeKey = getOutcomeKey(variables);
      try {
        await applyConfirmedRequestStatus(
          queryClient,
          variables,
          response.data.status,
          onDecisionConfirmed,
        );
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

        await checkDecisionOutcome(
          queryClient,
          variables,
          {
            requestedStatus: variables.status,
            state: 'uncertain',
          },
          onDecisionConfirmed,
        );
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
  { onDecisionConfirmed }: CarpoolRequestDecisionOptions = {},
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

    return checkDecisionOutcome(queryClient, variables, outcome, onDecisionConfirmed);
  }, [onDecisionConfirmed, outcome, queryClient, variables]);

  return {
    outcome,
    isOutcomeUncertain: outcome !== undefined,
    isDecisionProcessing,
    isCheckingOutcome: outcome?.state === 'checking',
    checkOutcome,
  };
}
