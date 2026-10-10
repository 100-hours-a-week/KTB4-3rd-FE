'use client';

import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { carpoolRequestQueryKeys } from '@/entities/carpool-request';
import {
  AuthViewerMismatchError,
  getAccessTokenForViewer,
  isCurrentVerifiedViewer,
} from '@/entities/auth';
import { decideCarpoolRequest } from '@/features/carpool-request-decision';
import {
  CarpoolRequestModal,
  useCarpoolRequestDetailQuery,
  type RequestProcessingAction,
} from '@/features/carpool-request-review';
import { ApiError } from '@/shared/api/client';
import { carpoolQueries } from '@/shared/api/carpool';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';
import { chatRoomListQueries } from '@/_pages/chat-list/api/chat-room-list';
import {
  carpoolRequestListQueries,
  useCarpoolRequestListQuery,
  type CarpoolRequestListItemResponse,
  type CarpoolRequestListResponse,
} from '@/_pages/chat-list/api/carpool-requests';
import {
  CarpoolRequestListContent,
  type CarpoolRequestListState,
} from './carpool-request-list-content';

type DecisionVariables = {
  action: Exclude<RequestProcessingAction, null>;
  carpoolId: number;
  requestId: number;
};

type SelectedRequest = {
  preview: CarpoolRequestListItemResponse;
  carpoolId: number;
  requestId: number;
  viewerId: number;
  detailUpdateCountAtOpen: number;
};

const uncertainDecisionKeys = new Set<string>();
const capacityBlockedAcceptKeys = new Map<string, number>();

function decisionKey(viewerId: number, carpoolId: number, requestId: number) {
  return `${viewerId}:${carpoolId}:${requestId}`;
}

function previewDetail(request: CarpoolRequestListItemResponse) {
  return {
    message: '목록에 있는 요청 정보를 표시합니다.',
    data: {
      id: request.id,
      carpool_id: request.carpool_id,
      status: request.status,
      requester: request.counterpart,
      content: request.content,
      created_at: request.created_at,
    },
  } as const;
}

function isUncertainDecisionError(error: unknown) {
  return error instanceof TypeError || (error instanceof ApiError && error.status >= 500);
}

function invalidateRelatedData(queryClient: ReturnType<typeof useQueryClient>, viewerId: number) {
  void Promise.allSettled([
    queryClient.invalidateQueries({ queryKey: carpoolRequestQueryKeys.listPrefix(viewerId) }),
    queryClient.invalidateQueries({ queryKey: carpoolQueries.pinsPrefix() }),
    queryClient.invalidateQueries({ queryKey: carpoolQueries.nearbyPrefix() }),
    queryClient.invalidateQueries({
      queryKey: chatRoomListQueries.list({ kind: 'TAXI_POT' }).queryKey,
    }),
    queryClient.invalidateQueries({
      queryKey: chatRoomListQueries.list({ kind: 'CARPOOL' }).queryKey,
    }),
  ]);
}

function removeReceivedRequest(
  queryClient: ReturnType<typeof useQueryClient>,
  viewerId: number,
  carpoolId: number,
  requestId: number,
) {
  const queryKey = carpoolRequestListQueries.list(viewerId, 'RECEIVED').queryKey;

  queryClient.setQueriesData<InfiniteData<CarpoolRequestListResponse>>({ queryKey }, (current) => {
    if (!current) {
      return current;
    }

    return {
      ...current,
      pages: current.pages.map((page) => ({
        ...page,
        data: {
          ...page.data,
          items: page.data.items.filter(
            (item) => item.carpool_id !== carpoolId || item.id !== requestId,
          ),
        },
      })),
    };
  });
}

export function CarpoolRequestQueryContent({
  direction,
  isAuthenticated,
  viewerId,
  onChatClick,
}: {
  direction: 'SENT' | 'RECEIVED';
  isAuthenticated: boolean;
  viewerId: number | null;
  onChatClick: (chatRoomId: number) => void;
}) {
  const query = useCarpoolRequestListQuery({ direction, enabled: isAuthenticated, viewerId });
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<SelectedRequest | null>(null);
  const [processingAction, setProcessingAction] = useState<RequestProcessingAction>(null);
  const [awaitingReconciliation, setAwaitingReconciliation] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconciliationFailed, setReconciliationFailed] = useState(false);
  const [notice, setNotice] = useState<string | undefined>();
  const actionLock = useRef(false);

  const detailQuery = useCarpoolRequestDetailQuery({
    viewerId,
    carpoolId: selected?.carpoolId ?? null,
    requestId: selected?.requestId ?? null,
    enabled: selected !== null && isAuthenticated,
  });

  const {
    data: requestListData,
    fetchNextPage,
    hasNextPage,
    isFetchNextPageError,
    isFetching,
  } = query;
  const loadedItems = requestListData?.pages.flatMap((page) => page.data.items) ?? [];
  const loadedPageCount = requestListData?.pages.length ?? 0;

  useEffect(() => {
    if (loadedItems.length === 0 && hasNextPage && !isFetching && !isFetchNextPageError) {
      void fetchNextPage();
    }
  }, [
    fetchNextPage,
    loadedItems.length,
    loadedPageCount,
    hasNextPage,
    isFetchNextPageError,
    isFetching,
  ]);

  const currentDecisionKey = selected
    ? decisionKey(selected.viewerId, selected.carpoolId, selected.requestId)
    : null;
  const detailUpdateCount = selected
    ? (queryClient.getQueryState(
        carpoolRequestQueryKeys.detail(selected.viewerId, selected.carpoolId, selected.requestId),
      )?.dataUpdateCount ?? 0)
    : 0;
  const hasAuthoritativeDetail = Boolean(
    selected &&
    detailQuery.isSuccess &&
    !detailQuery.isFetching &&
    detailUpdateCount > selected.detailUpdateCountAtOpen,
  );
  const isAwaitingReconciliation = awaitingReconciliation && !hasAuthoritativeDetail;
  const capacityBlockedAtUpdateCount = currentDecisionKey
    ? capacityBlockedAcceptKeys.get(currentDecisionKey)
    : undefined;
  const isAcceptBlockedByCapacity = Boolean(
    capacityBlockedAtUpdateCount !== undefined &&
    (!selected ||
      selected.detailUpdateCountAtOpen < capacityBlockedAtUpdateCount ||
      !hasAuthoritativeDetail),
  );

  const mutation = useMutation({
    mutationFn: async ({ action, carpoolId, requestId }: DecisionVariables) => {
      if (viewerId === null) {
        throw new AuthViewerMismatchError();
      }

      const accessToken = await getAccessTokenForViewer(viewerId);
      const result = await decideCarpoolRequest(accessToken, carpoolId, requestId, {
        status: action === 'accept' ? 'ACCEPTED' : 'REJECTED',
      });

      if (!isCurrentVerifiedViewer(viewerId)) {
        throw new AuthViewerMismatchError();
      }
      return result;
    },
    retry: false,
    networkMode: 'always',
  });

  const closeModal = useCallback(() => {
    if (actionLock.current || isReconciling) {
      return;
    }
    setSelected(null);
    setProcessingAction(null);
    setAwaitingReconciliation(false);
    setReconciliationFailed(false);
    setNotice(undefined);
  }, [isReconciling]);

  const selectedRequest = selected?.preview ?? null;

  const reconcileRequest = useCallback(async () => {
    if (!selected || isReconciling || !viewerId) {
      return;
    }

    setAwaitingReconciliation(true);
    setIsReconciling(true);
    setReconciliationFailed(false);

    try {
      const result = await detailQuery.refetch({ cancelRefetch: false });

      if (result.isError || !result.data) {
        setReconciliationFailed(true);
        return;
      }

      const key = decisionKey(viewerId, selected.carpoolId, selected.requestId);

      if (!isCurrentVerifiedViewer(viewerId)) {
        setSelected(null);
        useSnackbarStore
          .getState()
          .showSnackbar('로그인 계정이 바뀌어 요청을 닫았어요.', 'critical');
        return;
      }

      uncertainDecisionKeys.delete(key);
      if (result.data.data.status !== 'PENDING') {
        capacityBlockedAcceptKeys.delete(key);
        setSelected(null);
        setAwaitingReconciliation(false);
        invalidateRelatedData(queryClient, viewerId);
        useSnackbarStore
          .getState()
          .showSnackbar('요청 상태가 바뀌어 목록을 새로 확인했어요.', 'critical');
        return;
      }

      setAwaitingReconciliation(false);
      setNotice('요청 상태를 확인했어요. 다시 진행하려면 수락 또는 거절을 눌러주세요.');
    } catch {
      setReconciliationFailed(true);
    } finally {
      setIsReconciling(false);
    }
  }, [detailQuery, isReconciling, queryClient, selected, viewerId]);

  const handleDecision = useCallback(
    async (action: Exclude<RequestProcessingAction, null>) => {
      if (
        !selected ||
        !viewerId ||
        !hasAuthoritativeDetail ||
        actionLock.current ||
        isAwaitingReconciliation ||
        (action === 'accept' && isAcceptBlockedByCapacity)
      ) {
        return;
      }

      const key = decisionKey(viewerId, selected.carpoolId, selected.requestId);
      actionLock.current = true;
      setProcessingAction(action);
      setNotice(undefined);

      try {
        await mutation.mutateAsync({
          action,
          carpoolId: selected.carpoolId,
          requestId: selected.requestId,
        });
        uncertainDecisionKeys.delete(key);
        capacityBlockedAcceptKeys.delete(key);
        removeReceivedRequest(queryClient, viewerId, selected.carpoolId, selected.requestId);
        invalidateRelatedData(queryClient, viewerId);
        setSelected(null);
        setAwaitingReconciliation(false);
        useSnackbarStore
          .getState()
          .showSnackbar(
            action === 'accept' ? '요청을 수락했어요.' : '요청을 거절했어요.',
            'positive',
          );
      } catch (error) {
        if (error instanceof AuthViewerMismatchError) {
          uncertainDecisionKeys.delete(key);
          capacityBlockedAcceptKeys.delete(key);
          setSelected(null);
          invalidateRelatedData(queryClient, viewerId);
          useSnackbarStore
            .getState()
            .showSnackbar(
              '로그인 계정이 바뀌어 요청을 닫았어요. 목록을 다시 확인해주세요.',
              'critical',
            );
        } else if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
          uncertainDecisionKeys.delete(key);
          capacityBlockedAcceptKeys.delete(key);
          setSelected(null);
          invalidateRelatedData(queryClient, viewerId);
          useSnackbarStore
            .getState()
            .showSnackbar(
              error.status === 403
                ? '요청을 처리할 권한이 없어요.'
                : '요청을 찾을 수 없어 목록을 새로 확인했어요.',
              'critical',
            );
        } else if (error instanceof ApiError && error.status === 409) {
          if (error.code === 'CAPACITY_FULL') {
            capacityBlockedAcceptKeys.set(key, detailUpdateCount);
            useSnackbarStore
              .getState()
              .showSnackbar('모집 인원이 가득 차서 수락할 수 없어요.', 'critical');
          } else if (error.code === 'CARPOOL_CLOSED' || error.code === 'REQUEST_ALREADY_HANDLED') {
            uncertainDecisionKeys.delete(key);
            capacityBlockedAcceptKeys.delete(key);
            setSelected(null);
            invalidateRelatedData(queryClient, viewerId);
            useSnackbarStore
              .getState()
              .showSnackbar(
                error.code === 'CARPOOL_CLOSED'
                  ? '마감된 카풀이라 요청을 처리할 수 없어요.'
                  : '이미 처리된 요청이에요.',
                'critical',
              );
          } else {
            useSnackbarStore
              .getState()
              .showSnackbar('요청 상태가 바뀌었어요. 최신 상태를 확인해주세요.', 'critical');
          }
        } else if (isUncertainDecisionError(error)) {
          uncertainDecisionKeys.add(key);
          setAwaitingReconciliation(true);
          useSnackbarStore
            .getState()
            .showSnackbar(
              '처리 결과를 확인 중이에요. 확인이 끝나기 전에는 다시 보낼 수 없어요.',
              'critical',
            );
          await reconcileRequest();
        } else {
          uncertainDecisionKeys.delete(key);
          useSnackbarStore
            .getState()
            .showSnackbar(
              error instanceof ApiError
                ? error.message
                : '요청을 처리하지 못했어요. 다시 시도해주세요.',
              'critical',
            );
        }
      } finally {
        actionLock.current = false;
        setProcessingAction(null);
      }
    },
    [
      hasAuthoritativeDetail,
      isAcceptBlockedByCapacity,
      isAwaitingReconciliation,
      detailUpdateCount,
      mutation,
      queryClient,
      reconcileRequest,
      selected,
      viewerId,
    ],
  );

  useEffect(() => {
    if (!selected || !hasAuthoritativeDetail || !currentDecisionKey) {
      return;
    }

    if (detailQuery.data?.data.status === 'PENDING') {
      return;
    }

    uncertainDecisionKeys.delete(currentDecisionKey);
    capacityBlockedAcceptKeys.delete(currentDecisionKey);
    invalidateRelatedData(queryClient, selected.viewerId);
    useSnackbarStore.getState().showSnackbar('요청이 이미 처리되었어요.', 'critical');
  }, [currentDecisionKey, detailQuery.data, hasAuthoritativeDetail, queryClient, selected]);

  useEffect(() => {
    if (
      selected &&
      hasAuthoritativeDetail &&
      currentDecisionKey &&
      capacityBlockedAtUpdateCount !== undefined &&
      selected.detailUpdateCountAtOpen >= capacityBlockedAtUpdateCount
    ) {
      capacityBlockedAcceptKeys.delete(currentDecisionKey);
    }
  }, [capacityBlockedAtUpdateCount, currentDecisionKey, hasAuthoritativeDetail, selected]);

  useEffect(() => {
    const error = detailQuery.error;
    if (
      !selected ||
      !(error instanceof ApiError) ||
      (error.status !== 403 && error.status !== 404)
    ) {
      return;
    }
    useSnackbarStore
      .getState()
      .showSnackbar(
        error.status === 403 ? '요청 정보를 볼 권한이 없어요.' : '요청이 이미 사라졌어요.',
        'critical',
      );
  }, [detailQuery.error, selected]);

  const handleRequestClick = useCallback(
    (carpoolId: number, requestId: number) => {
      if (direction !== 'RECEIVED' || !query.data || viewerId === null) {
        return;
      }
      const preview = query.data.pages
        .flatMap((page) => page.data.items)
        .find((item) => item.carpool_id === carpoolId && item.id === requestId);

      if (!preview) {
        return;
      }

      const queryKey = carpoolRequestQueryKeys.detail(viewerId, carpoolId, requestId);
      queryClient.setQueryData(queryKey, previewDetail(preview));
      const detailUpdateCountAtOpen = queryClient.getQueryState(queryKey)?.dataUpdateCount ?? 0;
      setNotice(undefined);
      setReconciliationFailed(false);
      setAwaitingReconciliation(
        uncertainDecisionKeys.has(decisionKey(viewerId, carpoolId, requestId)),
      );
      setSelected({ carpoolId, requestId, preview, viewerId, detailUpdateCountAtOpen });
    },
    [direction, query.data, queryClient, viewerId],
  );

  let state: CarpoolRequestListState;
  if (!isAuthenticated || viewerId === null || (query.isPending && !query.data)) {
    state = { status: 'loading' };
  } else if (query.data === undefined) {
    state = { status: 'error', onRetry: () => void query.refetch() };
  } else {
    const allItems = loadedItems;
    const items = allItems.filter(
      (request, index) =>
        allItems.findIndex(
          (candidate) => candidate.carpool_id === request.carpool_id && candidate.id === request.id,
        ) === index,
    );

    if (items.length === 0 && query.hasNextPage && query.isFetchNextPageError) {
      state = { status: 'error', onRetry: () => void query.fetchNextPage() };
    } else if (items.length === 0 && query.hasNextPage) {
      state = { status: 'loading' };
    } else if (items.length === 0) {
      state = { status: 'empty' };
    } else {
      state = {
        status: 'content',
        items,
        hasNextPage: query.hasNextPage,
        isLoadingMore: query.isFetchingNextPage,
        hasLoadMoreError: query.isFetchNextPageError,
        onLoadMore: () => {
          if (query.hasNextPage && !query.isFetching) {
            void query.fetchNextPage();
          }
        },
        onRetryLoadMore: () => {
          if (query.hasNextPage && !query.isFetching && query.isFetchNextPageError) {
            void query.fetchNextPage();
          }
        },
      };
    }
  }

  const detail = detailQuery.isError ? undefined : detailQuery.data?.data;
  let modal = null;
  if (selectedRequest && selected?.viewerId === viewerId && isAuthenticated) {
    const detailUnavailable =
      detailQuery.error instanceof ApiError &&
      (detailQuery.error.status === 403 || detailQuery.error.status === 404);
    const requestAlreadyHandled = detail && detail.status !== 'PENDING' && !detailQuery.isFetching;

    if (detailUnavailable || requestAlreadyHandled) {
      modal = null;
    } else if (isReconciling) {
      modal = <CarpoolRequestModal lockDismissal onClose={closeModal} open status="loading" />;
    } else if (isAwaitingReconciliation && reconciliationFailed) {
      modal = (
        <CarpoolRequestModal
          errorMessage="처리 결과를 확인하지 못했어요. 요청 상태를 다시 확인해주세요."
          onClose={closeModal}
          onRetry={() => void reconcileRequest()}
          open
          status="error"
        />
      );
    } else if (!detail && detailQuery.isPending) {
      modal = <CarpoolRequestModal onClose={closeModal} open status="loading" />;
    } else if (detail) {
      modal = (
        <CarpoolRequestModal
          canAccept={
            hasAuthoritativeDetail &&
            detail.status === 'PENDING' &&
            !isAwaitingReconciliation &&
            !isAcceptBlockedByCapacity
          }
          canReject={
            hasAuthoritativeDetail && detail.status === 'PENDING' && !isAwaitingReconciliation
          }
          notice={notice}
          onAccept={() => void handleDecision('accept')}
          onClose={closeModal}
          onReject={() => void handleDecision('reject')}
          open
          processingAction={processingAction}
          request={detail}
          status="content"
        />
      );
    } else {
      modal = (
        <CarpoolRequestModal
          errorMessage="요청 정보를 불러오지 못했어요. 다시 시도해주세요."
          onClose={closeModal}
          onRetry={() => void detailQuery.refetch()}
          open
          status="error"
        />
      );
    }
  }

  return (
    <>
      <CarpoolRequestListContent
        direction={direction}
        onChatClick={onChatClick}
        onRequestClick={handleRequestClick}
        state={state}
      />
      {modal}
    </>
  );
}
