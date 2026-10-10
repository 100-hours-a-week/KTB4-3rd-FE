'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { selectIsAuthenticated, useAuthStore } from '@/entities/auth';
import {
  CarpoolDetail,
  carpoolDetailQueryKeys,
  getCarpoolRequestAvailability,
  parseCarpoolDepartureTimestamp,
} from '@/entities/carpool';
import { useRequireAuth } from '@/features/login-required';
import { CarpoolRequestCard } from '@/features/carpool-request';
import { carpoolDetailQueries, useCarpoolDetailQuery } from '@/features/carpool-detail';
import { useCarpoolJoinRequestMutation } from '@/features/carpool-join-request';
import { ApiError } from '@/shared/api/client';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';
import { BottomModal } from '@/shared/ui/bottom-modal';
import { Dialog } from '@/shared/ui/dialog';
import { Text } from '@/shared/ui/text';

export type CarpoolSelection = { id: number; position: { lat: number; lng: number } | null };

export function CarpoolDetailModal({
  selection,
  onSelectionChange,
  onSelectionRequest,
}: {
  selection: CarpoolSelection | null;
  onSelectionChange: (selection: CarpoolSelection | null) => void;
  onSelectionRequest: (request: (selection: CarpoolSelection | null) => void) => void;
}) {
  const viewerId = useAuthStore((state) => state.verifiedViewerId);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const currentToken = useAuthStore((state) => state.accessToken);
  const viewerIdRef = useRef(viewerId);
  const isAuthenticatedRef = useRef(isAuthenticated);
  const currentTokenRef = useRef(currentToken);
  const queryClient = useQueryClient();
  const { requireAuth } = useRequireAuth();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);
  const [stage, setStage] = useState<'detail' | 'request'>('detail');
  const [isDirty, setIsDirty] = useState(false);
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);
  const [pendingExit, setPendingExit] = useState<CarpoolSelection | null | undefined>(undefined);
  const [isCheckingLatest, setIsCheckingLatest] = useState(false);
  const selectionRef = useRef<CarpoolSelection | null>(null);
  const lastSelectedIdRef = useRef<number | null>(null);
  const modalSessionRef = useRef(0);
  const actionLockRef = useRef(false);
  const requestIntentLock = useRef(false);
  const detailTitleRef = useRef<HTMLHeadingElement>(null);
  const requestQuery = useCarpoolDetailQuery({
    carpoolId: selection?.id ?? null,
    viewerId,
    isAuthenticated,
    authReady: !isAuthenticated || viewerId !== null,
    enabled: selection !== null,
  });
  const joinRequestMutation = useCarpoolJoinRequestMutation();

  useLayoutEffect(() => {
    selectionRef.current = selection;
    if (viewerId !== null) {
      viewerIdRef.current = viewerId;
    }
    isAuthenticatedRef.current = isAuthenticated;
    currentTokenRef.current = currentToken;
  }, [currentToken, isAuthenticated, selection, viewerId]);

  const finishSelection = useCallback(
    (nextSelection: CarpoolSelection | null) => {
      if (selectionRef.current !== null) {
        lastSelectedIdRef.current = selectionRef.current.id;
      }
      modalSessionRef.current += 1;
      selectionRef.current = nextSelection;
      setStage('detail');
      setIsDirty(false);
      setIsDiscardOpen(false);
      setPendingExit(undefined);
      actionLockRef.current = false;
      requestIntentLock.current = false;
      onSelectionChange(nextSelection);
    },
    [onSelectionChange],
  );

  useEffect(
    () =>
      useAuthStore.subscribe((current, previous) => {
        if (
          ((previous.accessToken !== null && current.accessToken === null) ||
            (viewerIdRef.current !== null &&
              current.verifiedViewerId !== null &&
              viewerIdRef.current !== current.verifiedViewerId)) &&
          selectionRef.current !== null
        ) {
          queueMicrotask(() => finishSelection(null));
        }
      }),
    [finishSelection],
  );

  useEffect(() => {
    if (selection && stage === 'detail') {
      detailTitleRef.current?.focus();
    }
  }, [selection, stage]);

  useEffect(() => {
    if (selection && stage === 'request') {
      requestAnimationFrame(() =>
        document.querySelector<HTMLTextAreaElement>('[aria-label="요청 메시지"] textarea')?.focus(),
      );
    }
  }, [selection, stage]);

  useEffect(() => {
    if (!selection || !requestQuery.isError || !(requestQuery.error instanceof ApiError)) {
      return;
    }
    if (
      requestQuery.error.status !== 404 &&
      requestQuery.error.code !== 'CARPOOL_NOT_FOUND' &&
      requestQuery.error.code !== 'HOST_ONLY'
    ) {
      return;
    }
    const selectedId = selection.id;
    queueMicrotask(() => {
      if (selectionRef.current?.id === selectedId) {
        finishSelection(null);
        showSnackbar('카풀 게시글을 찾을 수 없어요.', 'critical');
      }
    });
  }, [finishSelection, requestQuery.error, requestQuery.isError, selection, showSnackbar]);

  const exitTo = useCallback(
    (target: CarpoolSelection | null) => {
      if (joinRequestMutation.isPending || actionLockRef.current) {
        return;
      }
      if (stage === 'request' && isDirty) {
        setPendingExit(target);
        setIsDiscardOpen(true);
        return;
      }
      if (target?.id !== selectionRef.current?.id || target === null) {
        finishSelection(target);
      }
    },
    [finishSelection, isDirty, joinRequestMutation.isPending, stage],
  );

  const requestSelection = useCallback(
    (next: CarpoolSelection | null) => {
      if (joinRequestMutation.isPending || actionLockRef.current) {
        return;
      }
      if (next?.id === selectionRef.current?.id) {
        return;
      }
      exitTo(next);
    },
    [exitTo, joinRequestMutation.isPending],
  );
  useEffect(() => onSelectionRequest(requestSelection), [onSelectionRequest, requestSelection]);

  const handleRequestClick = useCallback(() => {
    if (requestIntentLock.current || isCheckingLatest || !selectionRef.current) {
      return;
    }
    const clickedSelection = selectionRef.current;
    const clickedSession = modalSessionRef.current;
    requireAuth(() => {
      if (
        requestIntentLock.current ||
        selectionRef.current?.id !== clickedSelection.id ||
        modalSessionRef.current !== clickedSession
      ) {
        return;
      }
      const activeAuth = useAuthStore.getState();
      const activeViewerId = activeAuth.verifiedViewerId;
      if (activeViewerId === null) {
        showSnackbar('로그인 사용자 정보를 확인하고 다시 시도해주세요.', 'critical');
        return;
      }
      requestIntentLock.current = true;
      actionLockRef.current = true;
      const requestedSelection = clickedSelection;
      const session = clickedSession;
      const token = currentTokenRef.current;
      setIsCheckingLatest(true);
      void queryClient
        .fetchQuery({
          ...carpoolDetailQueries.detail({
            carpoolId: requestedSelection.id,
            viewerId: activeViewerId,
            isAuthenticated: isAuthenticatedRef.current,
            authReady: !isAuthenticatedRef.current || activeViewerId !== null,
            enabled: true,
          }),
        })
        .then((response) => {
          if (
            selectionRef.current?.id !== requestedSelection.id ||
            modalSessionRef.current !== session ||
            currentTokenRef.current !== token
          ) {
            return;
          }
          const carpool = response.data;
          const availability = getCarpoolRequestAvailability({
            departureTimestamp: parseCarpoolDepartureTimestamp(carpool.departure_at),
            isCheckingRequest: false,
            isFull: carpool.is_full,
            isHost: carpool.host.id === activeViewerId,
            isParticipant: carpool.participants.some((person) => person.id === activeViewerId),
            myRequestStatus: carpool.my_request?.status,
            nowTimestamp: Date.now(),
            status: carpool.status,
          });
          if (!availability.canRequest) {
            showSnackbar(availability.message ?? '현재 동행 요청을 보낼 수 없어요.', 'critical');
            return;
          }
          setStage('request');
          setIsDirty(false);
        })
        .catch((error: unknown) => {
          if (
            selectionRef.current?.id !== requestedSelection.id ||
            modalSessionRef.current !== session
          ) {
            return;
          }
          if (
            error instanceof ApiError &&
            (error.status === 404 ||
              error.code === 'CARPOOL_NOT_FOUND' ||
              error.code === 'HOST_ONLY')
          ) {
            finishSelection(null);
            showSnackbar('카풀 게시글이 삭제되었어요.', 'critical');
          } else {
            showSnackbar('카풀 정보를 다시 확인하지 못했어요.', 'critical');
          }
        })
        .finally(() => {
          setIsCheckingLatest(false);
          actionLockRef.current = false;
          requestIntentLock.current = false;
        });
    });
  }, [finishSelection, isCheckingLatest, queryClient, requireAuth, showSnackbar]);

  const handleSubmit = useCallback(
    (content: string) => {
      const activeViewerId = useAuthStore.getState().verifiedViewerId;
      if (actionLockRef.current || !selectionRef.current || activeViewerId === null) {
        return;
      }
      actionLockRef.current = true;
      const requestSelectionAtSubmit = selectionRef.current;
      const session = modalSessionRef.current;
      const token = currentTokenRef.current;
      void joinRequestMutation
        .mutateAsync({
          carpoolId: requestSelectionAtSubmit.id,
          viewerId: activeViewerId,
          payload: { content },
        })
        .then(() => {
          if (
            selectionRef.current?.id === requestSelectionAtSubmit.id &&
            modalSessionRef.current === session &&
            currentTokenRef.current === token
          ) {
            setStage('detail');
            setIsDirty(false);
            showSnackbar('동행 요청을 보냈어요.', 'default');
          }
        })
        .catch((error: unknown) => {
          if (
            selectionRef.current?.id !== requestSelectionAtSubmit.id ||
            modalSessionRef.current !== session
          ) {
            return;
          }
          if (
            error instanceof ApiError &&
            (error.status === 404 || error.code === 'CARPOOL_NOT_FOUND')
          ) {
            finishSelection(null);
            showSnackbar('카풀 게시글이 삭제되었어요.', 'critical');
          } else {
            if (error instanceof ApiError && error.status === 409) {
              void queryClient.invalidateQueries({
                queryKey: carpoolDetailQueryKeys.detail(
                  requestSelectionAtSubmit.id,
                  activeViewerId,
                ),
              });
            }
            showSnackbar(
              error instanceof ApiError && error.message
                ? error.message
                : '동행 요청을 보내지 못했어요. 입력한 내용을 확인하고 다시 시도해주세요.',
              'critical',
            );
          }
        })
        .finally(() => {
          actionLockRef.current = false;
        });
    },
    [finishSelection, joinRequestMutation, queryClient, showSnackbar],
  );

  const carpool = requestQuery.data?.data;
  const isHost = Boolean(carpool && viewerId !== null && carpool.host.id === viewerId);
  const isParticipant = Boolean(
    carpool && viewerId !== null && carpool.participants.some((person) => person.id === viewerId),
  );
  let detailContent;
  if (requestQuery.isPending) {
    detailContent = <CarpoolDetail status="loading" />;
  } else if (requestQuery.isError || !carpool) {
    detailContent = (
      <CarpoolDetail
        errorMessage="카풀 상세를 불러오지 못했어요."
        onRetry={() => void requestQuery.refetch()}
        status="error"
      />
    );
  } else {
    detailContent = (
      <CarpoolDetail
        carpool={carpool}
        isCheckingRequest={isCheckingLatest}
        isHost={isHost}
        isParticipant={isParticipant}
        onRequestClick={handleRequestClick}
        status="content"
      />
    );
  }

  return (
    <>
      <BottomModal
        bottomOffset="calc(72px + env(safe-area-inset-bottom, 0px))"
        closeDisabled={joinRequestMutation.isPending || isCheckingLatest}
        finalFocus={() => {
          const selectedId = selection?.id ?? lastSelectedIdRef.current;
          if (selectedId === null) {
            return document.querySelector<HTMLElement>('[aria-label="주변 카풀"]');
          }
          return (
            document.querySelector<HTMLElement>(`button[data-carpool-id="${selectedId}"]`) ??
            document.querySelector<HTMLElement>('[aria-label="주변 카풀"]')
          );
        }}
        open={selection !== null}
        showExpand={false}
        onOpenChange={(open) => {
          if (!open) {
            exitTo(null);
          }
        }}
      >
        {stage === 'request' ? (
          <div>
            <div className="px-6 pt-5 pb-3">
              <button
                className="mb-3 text-sm"
                onClick={() => exitTo(selectionRef.current)}
                type="button"
              >
                ← 상세로
              </button>
              <Text as="h2" className="sr-only" variant="t5Bold">
                동행 요청 작성
              </Text>
            </div>
            <CarpoolRequestCard
              isSubmitting={joinRequestMutation.isPending}
              onDirtyChange={setIsDirty}
              onSubmit={handleSubmit}
            />
          </div>
        ) : (
          <div>
            <h2 className="sr-only" ref={detailTitleRef} tabIndex={-1}>
              카풀 상세
            </h2>
            {detailContent}
          </div>
        )}
      </BottomModal>
      <Dialog
        buttons="primarySecondary"
        description="입력한 내용은 저장되지 않아요."
        open={isDiscardOpen}
        primaryButtonProps={{
          onClick: () => {
            const target = pendingExit;
            setIsDiscardOpen(false);
            setPendingExit(undefined);
            setIsDirty(false);
            setStage('detail');
            if (target !== undefined) {
              finishSelection(target);
            }
          },
        }}
        primaryLabel="나가기"
        secondaryButtonProps={{
          onClick: () => {
            setIsDiscardOpen(false);
            setPendingExit(undefined);
            requestAnimationFrame(() =>
              document
                .querySelector<HTMLTextAreaElement>('[aria-label="요청 메시지"] textarea')
                ?.focus(),
            );
          },
        }}
        secondaryLabel="계속 작성"
        title="작성 중인 요청을 취소할까요?"
        onOpenChange={(open) => {
          if (!open) {
            setIsDiscardOpen(false);
            setPendingExit(undefined);
            requestAnimationFrame(() =>
              document
                .querySelector<HTMLTextAreaElement>('[aria-label="요청 메시지"] textarea')
                ?.focus(),
            );
          }
        }}
      />
    </>
  );
}
