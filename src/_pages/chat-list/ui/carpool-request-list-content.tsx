'use client';

import {
  CarpoolReceivedItem,
  CarpoolRequestItem,
  type CarpoolReceivedRequest,
  type CarpoolSentRequest,
} from '@/entities/carpool';
import { Icon } from '@/shared/ui/icon';
import { ResultSection } from '@/shared/ui/result-section';
import { Skeleton } from '@/shared/ui/skeleton';
import type { CarpoolRequestListItemResponse } from '@/_pages/chat-list/api/carpool-requests';

export type CarpoolRequestListState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error'; onRetry: () => void }
  | {
      status: 'content';
      items: readonly CarpoolRequestListItemResponse[];
      hasNextPage: boolean;
      isLoadingMore: boolean;
      hasLoadMoreError: boolean;
      onLoadMore: () => void;
      onRetryLoadMore: () => void;
    };

export function CarpoolRequestListContent({
  direction,
  onChatClick,
  onRequestClick,
  state,
}: {
  direction: 'SENT' | 'RECEIVED';
  onChatClick: (chatRoomId: number) => void;
  onRequestClick: (carpoolId: number, requestId: number) => void;
  state: CarpoolRequestListState;
}) {
  if (state.status === 'loading') {
    return (
      <ul aria-label="카풀 요청 목록을 불러오는 중" className="mt-4" role="status">
        {Array.from({ length: 5 }, (_, index) => (
          <li className="flex min-h-[104px] items-center gap-3 px-5 py-4" key={index}>
            <Skeleton className="size-12 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-2/5" />
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-4 w-1/3" />
            </div>
            <Skeleton className="h-8 w-[76px] rounded-full" />
          </li>
        ))}
      </ul>
    );
  }

  if (state.status === 'empty' || state.status === 'error') {
    const isError = state.status === 'error';
    let description = '아직 받은 카풀 요청이 없어요';
    if (isError) {
      description = '불러오는 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.';
    } else if (direction === 'SENT') {
      description = '카풀에 참여를 요청하면 여기에 표시돼요';
    }
    return (
      <div
        aria-live="polite"
        className="relative mt-8 h-[385px] w-full"
        data-testid={isError ? 'carpool-request-list-error' : 'carpool-request-list-empty'}
        role="status"
      >
        <div className="pt-[35px]">
          <ResultSection
            buttons={isError ? 'primary' : 'none'}
            className="relative left-[-86px] !w-[520px] [&>div>div:last-child]:!mt-[17px] [&>div>span]:!h-[38px]"
            description={description}
            icon={
              <Icon
                color={isError ? 'var(--color-fg-critical)' : 'var(--color-fg-neutral-muted)'}
                name={isError ? 'exclamationmarkCircleFill' : 'chatbubbleText'}
                size={66}
              />
            }
            primaryButtonProps={{ onClick: isError ? state.onRetry : undefined }}
            primaryLabel="다시 불러오기"
            size="medium"
            title={isError ? '요청 목록을 불러올 수 없어요' : '카풀 요청이 없어요'}
          />
        </div>
      </div>
    );
  }

  let loadMoreLabel = '요청 더 보기';
  if (state.isLoadingMore) {
    loadMoreLabel = '요청 목록을 불러오는 중이에요.';
  } else if (state.hasLoadMoreError) {
    loadMoreLabel = '더 불러오기';
  }

  return (
    <div className="mt-4 min-h-0 w-full flex-1 overflow-y-auto">
      <ul className="m-0 w-full list-none p-0">
        {state.items.map((request) =>
          direction === 'SENT' ? (
            <CarpoolRequestItem
              key={`${request.carpool_id}:${request.id}`}
              onChatClick={onChatClick}
              request={request as CarpoolSentRequest}
            />
          ) : (
            <CarpoolReceivedItem
              key={`${request.carpool_id}:${request.id}`}
              onRequestClick={onRequestClick}
              request={request as CarpoolReceivedRequest}
            />
          ),
        )}
      </ul>
      {state.hasNextPage ? (
        <button
          className="my-3 w-full cursor-pointer py-3 text-sm text-[var(--color-fg-brand)]"
          disabled={state.isLoadingMore}
          onClick={state.hasLoadMoreError ? state.onRetryLoadMore : state.onLoadMore}
          type="button"
        >
          {loadMoreLabel}
        </button>
      ) : null}
    </div>
  );
}
