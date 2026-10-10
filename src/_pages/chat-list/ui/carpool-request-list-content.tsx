'use client';

import { useEffect, useRef } from 'react';

import {
  CarpoolReceivedItem,
  CarpoolRequestItem,
  type CarpoolReceivedRequest,
  type CarpoolSentRequest,
} from '@/entities/carpool';
import { Icon } from '@/shared/ui/icon';
import { ResultSection } from '@/shared/ui/result-section';
import { ScrollFog, useScrollFog } from '@/shared/ui/scroll-fog';
import { Skeleton } from '@/shared/ui/skeleton';

export type CarpoolRequestListState<TItem> =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error'; onRetry: () => void }
  | {
      status: 'content';
      items: readonly TItem[];
      hasNextPage: boolean;
      isLoadingMore: boolean;
      canLoadMore: boolean;
      hasLoadMoreError: boolean;
      onLoadMore: () => void;
      onRetryLoadMore: () => void;
    };

type CarpoolRequestListContentProps = {
  direction: 'SENT' | 'RECEIVED';
  state: CarpoolRequestListState<CarpoolSentRequest | CarpoolReceivedRequest>;
  onChatClick: (chatRoomId: number) => void;
  onRequestClick: (carpoolId: number, requestId: number) => void;
};

const SKELETON_ROWS = Array.from({ length: 5 }, (_, index) => index);

function CarpoolRequestListLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="카풀 요청 목록을 불러오는 중"
      className="mt-4"
      data-testid="carpool-request-list-loading"
    >
      <ul className="m-0 w-full list-none p-0">
        {SKELETON_ROWS.map((row) => (
          <li
            aria-hidden="true"
            className="flex min-h-[104px] items-center gap-3 border-b border-[var(--color-stroke-neutral-subtle)] px-5 py-4"
            key={row}
          >
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
    </div>
  );
}

function CarpoolRequestListResult({
  direction,
  onRetry,
  status,
}: {
  direction: 'SENT' | 'RECEIVED';
  onRetry?: () => void;
  status: 'empty' | 'error';
}) {
  const isError = status === 'error';
  const isSent = direction === 'SENT';
  let description = '아직 받은 카풀 요청이 없어요';

  if (isError) {
    description = '불러오는 중 오류가 발생했어요.\n잠시 후 다시 시도해주세요.';
  } else if (isSent) {
    description = '카풀에 참여를 요청하면 여기에 표시돼요';
  }

  return (
    <div
      aria-live="polite"
      className="relative mt-8 h-[385px] w-full overflow-visible"
      data-testid={isError ? 'carpool-request-list-error' : 'carpool-request-list-empty'}
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
          primaryButtonProps={{ onClick: onRetry }}
          primaryLabel="다시 불러오기"
          size="medium"
          title={isError ? '요청 목록을 불러올 수 없어요' : '카풀 요청이 없어요'}
        />
      </div>
    </div>
  );
}

function CarpoolRequestListScrollable({
  direction,
  state,
  onChatClick,
  onRequestClick,
}: {
  direction: 'SENT' | 'RECEIVED';
  state: Extract<
    CarpoolRequestListState<CarpoolSentRequest | CarpoolReceivedRequest>,
    { status: 'content' }
  >;
  onChatClick: (chatRoomId: number) => void;
  onRequestClick: (carpoolId: number, requestId: number) => void;
}) {
  const { scrollRef, showBottom, showTop } = useScrollFog(`${direction}:${state.items.length}`);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  let footerContent = null;

  if (state.isLoadingMore) {
    footerContent = '요청 목록을 불러오는 중이에요.';
  } else if (state.hasLoadMoreError) {
    footerContent = (
      <button
        className="cursor-pointer text-sm text-[var(--color-fg-brand)] underline"
        onClick={state.onRetryLoadMore}
        type="button"
      >
        더 불러오기
      </button>
    );
  }

  useEffect(() => {
    const target = loadMoreRef.current;
    const scrollElement = scrollRef.current;

    if (
      !target ||
      !scrollElement ||
      !state.canLoadMore ||
      !state.hasNextPage ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          state.onLoadMore();
        }
      },
      { root: scrollElement, rootMargin: '0px 0px 160px 0px' },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [scrollRef, state]);

  return (
    <div
      className="relative mt-4 min-h-0 w-full flex-1 overflow-hidden"
      data-testid="carpool-request-list-scroll-region"
    >
      <div
        className="h-full [scrollbar-width:none] overflow-x-hidden overflow-y-auto overscroll-contain [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        ref={scrollRef}
      >
        <ul className="m-0 w-full list-none p-0">
          {state.items.map((request) =>
            direction === 'SENT' ? (
              <CarpoolRequestItem
                key={request.id}
                onChatClick={onChatClick}
                request={request as CarpoolSentRequest}
              />
            ) : (
              <CarpoolReceivedItem
                key={request.id}
                onRequestClick={onRequestClick}
                request={request as CarpoolReceivedRequest}
              />
            ),
          )}
        </ul>
        {state.hasNextPage ? (
          <div
            aria-busy={state.isLoadingMore}
            aria-live="polite"
            className="flex min-h-10 items-center justify-center py-2"
            data-testid="carpool-request-load-more"
            ref={loadMoreRef}
          >
            {footerContent}
          </div>
        ) : null}
      </div>
      <ScrollFog showBottom={showBottom} showTop={showTop} />
    </div>
  );
}

export function CarpoolRequestListContent({
  direction,
  state,
  onChatClick,
  onRequestClick,
}: CarpoolRequestListContentProps) {
  if (state.status === 'loading') {
    return <CarpoolRequestListLoading />;
  }

  if (state.status === 'empty' || state.status === 'error') {
    return (
      <CarpoolRequestListResult
        direction={direction}
        onRetry={state.status === 'error' ? state.onRetry : undefined}
        status={state.status}
      />
    );
  }

  return (
    <CarpoolRequestListScrollable
      direction={direction}
      onChatClick={onChatClick}
      onRequestClick={onRequestClick}
      state={state}
    />
  );
}
