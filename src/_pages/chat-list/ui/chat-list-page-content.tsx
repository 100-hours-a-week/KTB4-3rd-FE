'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
  ChatList,
  ChatListTabs,
  type ChatListTabValue,
  type ChatRoomListItem,
} from '@/entities/chat';
import {
  CarpoolRequestTabs,
  ChatCarpoolTabs,
  type CarpoolReceivedRequest,
  type CarpoolSentRequest,
  type ChatCarpoolTab,
  type CarpoolRequestDirection,
} from '@/entities/carpool';
import { selectIsAuthenticated, useAuthStore } from '@/entities/auth';
import { useCurrentUserQuery } from '@/features/user-profile';
import { ApiError } from '@/shared/api/client';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';
import { cn } from '@/shared/lib/cn';
import { Dialog } from '@/shared/ui/dialog';
import { Icon } from '@/shared/ui/icon';
import { ResultSection } from '@/shared/ui/result-section';
import { ScrollFog, useScrollFog } from '@/shared/ui/scroll-fog';
import {
  useCarpoolRequestListQuery,
  carpoolRequestListQueries,
} from '@/_pages/chat-list/api/carpool-requests';
import { useChatRoomListQuery } from '@/_pages/chat-list/api/chat-room-list';
import { Text } from '@/shared/ui/text';

import {
  DEFAULT_CHAT_LIST_STATES,
  type ChatListPageState,
  type ChatListPageStates,
} from '@/_pages/chat-list/model/chat-list-state';
import { ChatListPageContentLoading } from './chat-list-page-loading';
import {
  CarpoolRequestListContent,
  type CarpoolRequestListState,
} from './carpool-request-list-content';

export type ChatListPageContentProps = {
  className?: string;
  defaultTab?: ChatListTabValue;
  onChatRoomClick?: (chatRoom: ChatRoomListItem) => void;
  onExplore?: (tab: ChatListTabValue) => void;
  onLoadMore?: (tab: ChatListTabValue) => void;
  onRetry?: (tab: ChatListTabValue) => void;
  onTabChange?: (tab: ChatListTabValue) => void;
  pagination?: ChatListPagePaginationStates;
  states?: ChatListPageStates;
};

function toChatListPageState(query: ReturnType<typeof useChatRoomListQuery>): ChatListPageState {
  if (query.isError || !query.data) {
    return { status: 'error' };
  }

  const lastPage = query.data.pages[query.data.pages.length - 1];

  return {
    status: 'success',
    data: {
      items: query.data.pages.flatMap((page) => page.data.items),
      next_cursor: lastPage?.data.next_cursor ?? null,
    },
  };
}

function ChatRoomListQueryContent() {
  const router = useRouter();
  const matchingQuery = useChatRoomListQuery('matching');
  const communityQuery = useChatRoomListQuery('community');
  const handleChatRoomClick = useCallback(
    (chatRoom: ChatRoomListItem) => {
      router.push(`/chatroom/${chatRoom.id}`);
    },
    [router],
  );

  if (matchingQuery.isPending || communityQuery.isPending) {
    return <ChatListPageContentLoading />;
  }

  const states: ChatListPageStates = {
    matching: toChatListPageState(matchingQuery),
    community: toChatListPageState(communityQuery),
  };

  const queries = { matching: matchingQuery, community: communityQuery };

  return (
    <ChatListPageContent
      onChatRoomClick={handleChatRoomClick}
      onExplore={(tab) => {
        router.push(tab === 'matching' ? '/matching' : '/');
      }}
      onRetry={(tab) => {
        void queries[tab].refetch();
      }}
      onLoadMore={(tab) => {
        const query = queries[tab];

        if (query.hasNextPage && !query.isFetchingNextPage) {
          void query.fetchNextPage();
        }
      }}
      pagination={{
        matching: {
          hasNextPage: matchingQuery.hasNextPage,
          isFetchingNextPage: matchingQuery.isFetchingNextPage,
        },
        community: {
          hasNextPage: communityQuery.hasNextPage,
          isFetchingNextPage: communityQuery.isFetchingNextPage,
        },
      }}
      states={states}
    />
  );
}

function CarpoolRequestListQueryContent({
  direction,
  isAuthenticated,
  viewerId,
}: {
  direction: CarpoolRequestDirection;
  isAuthenticated: boolean;
  viewerId: number | null;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const query = useCarpoolRequestListQuery({
    direction,
    enabled: isAuthenticated,
    viewerId,
  });
  const handledFetchError = useRef<unknown>(null);

  useEffect(() => {
    if (!query.isFetchNextPageError || !(query.error instanceof ApiError)) {
      return;
    }

    if (handledFetchError.current === query.error) {
      return;
    }

    handledFetchError.current = query.error;

    if (query.error.code === 'INVALID_CURSOR' && viewerId !== null) {
      const queryKey = carpoolRequestListQueries.list(viewerId, direction).queryKey;
      void queryClient.resetQueries({ queryKey, exact: true });
      useSnackbarStore
        .getState()
        .showSnackbar('요청 목록이 변경되어 처음부터 다시 불러옵니다.', 'critical');
      return;
    }

    useSnackbarStore.getState().showSnackbar('요청 목록을 더 불러오지 못했어요.', 'critical');
  }, [direction, query.error, query.isFetchNextPageError, queryClient, viewerId]);

  useEffect(() => {
    if (
      !query.isRefetchError ||
      query.data === undefined ||
      query.error === handledFetchError.current
    ) {
      return;
    }

    handledFetchError.current = query.error;
    useSnackbarStore.getState().showSnackbar('요청 목록을 새로 불러오지 못했어요.', 'critical');
  }, [query.data, query.error, query.isRefetchError]);

  let state: CarpoolRequestListState<CarpoolSentRequest | CarpoolReceivedRequest>;

  if (!isAuthenticated || viewerId === null || (query.isPending && !query.data)) {
    state = { status: 'loading' as const };
  } else if (query.data === undefined) {
    state = { status: 'error' as const, onRetry: () => void query.refetch() };
  } else {
    const items = query.data.pages.flatMap((page) => page.data.items);
    const uniqueItems = items.filter(
      (request, index) => items.findIndex((candidate) => candidate.id === request.id) === index,
    );

    state =
      uniqueItems.length === 0
        ? { status: 'empty' as const }
        : {
            status: 'content' as const,
            items:
              direction === 'SENT'
                ? (uniqueItems as CarpoolSentRequest[])
                : (uniqueItems as CarpoolReceivedRequest[]),
            hasNextPage: query.hasNextPage,
            isLoadingMore: query.isFetchingNextPage,
            hasLoadMoreError: query.isFetchNextPageError,
            canLoadMore:
              query.hasNextPage &&
              !query.isFetching &&
              !query.isError &&
              !query.isFetchNextPageError &&
              isAuthenticated,
            onLoadMore: () => {
              if (query.hasNextPage && !query.isFetching) {
                void query.fetchNextPage();
              }
            },
            onRetryLoadMore: () => {
              if (query.hasNextPage && !query.isFetching && isAuthenticated) {
                void query.fetchNextPage();
              }
            },
          };
  }

  const [selectedRequest, setSelectedRequest] = useState<CarpoolReceivedRequest | null>(null);
  const selectedRequestIsOpen = selectedRequest !== null;
  const onRequestClick = (carpoolId: number, requestId: number) => {
    if (direction !== 'RECEIVED' || !query.data) {
      return;
    }

    const request = query.data.pages
      .flatMap((page) => page.data.items)
      .find((item) => item.carpool_id === carpoolId && item.id === requestId);

    if (request) {
      setSelectedRequest(request as CarpoolReceivedRequest);
    }
  };

  return (
    <>
      <CarpoolRequestListContent
        direction={direction}
        onChatClick={(chatRoomId) => {
          router.push(`/chatroom/${chatRoomId}`);
        }}
        onRequestClick={onRequestClick}
        state={state}
      />
      <Dialog
        buttons="none"
        description={selectedRequest?.content}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRequest(null);
          }
        }}
        open={selectedRequestIsOpen}
        title={`${selectedRequest?.counterpart.name ?? '카풀'} 요청`}
      >
        {selectedRequest ? (
          <div className="flex flex-col gap-3">
            <Text as="p" color="fg.neutral" variant="t5Regular">
              {selectedRequest.origin_name} → {selectedRequest.dest_name}
            </Text>
            <Text as="p" color="fg.neutralMuted" variant="t7Regular">
              출발 시간:{' '}
              {new Intl.DateTimeFormat('ko-KR', {
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hourCycle: 'h23',
                timeZone: 'Asia/Seoul',
              }).format(new Date(selectedRequest.departure_at))}
            </Text>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}

export function ChatListPageContentWithQuery() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const currentUserQuery = useCurrentUserQuery();
  const viewerId = currentUserQuery.data?.data.id ?? null;
  const [activeTab, setActiveTab] = useState<ChatCarpoolTab>('chat');
  const [direction, setDirection] = useState<CarpoolRequestDirection>('SENT');

  return (
    <section aria-label="채팅과 카풀 요청" className="flex min-h-0 flex-1 flex-col">
      <ChatCarpoolTabs onValueChange={setActiveTab} value={activeTab} />
      {activeTab === 'chat' ? (
        <ChatRoomListQueryContent />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col" data-testid="carpool-request-panel">
          <CarpoolRequestTabs className="mt-6" onValueChange={setDirection} value={direction} />
          <CarpoolRequestListQueryContent
            direction={direction}
            isAuthenticated={isAuthenticated}
            viewerId={viewerId}
          />
        </div>
      )}
    </section>
  );
}

export type ChatListPagePaginationState = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
};

export type ChatListPagePaginationStates = Record<ChatListTabValue, ChatListPagePaginationState>;

function ChatListResultState({
  onExplore,
  onRetry,
  state,
  tab,
}: {
  onExplore?: (tab: ChatListTabValue) => void;
  onRetry?: (tab: ChatListTabValue) => void;
  state: ChatListPageState;
  tab: ChatListTabValue;
}) {
  const isError = state.status === 'error';
  const isMatching = tab === 'matching';
  let resultDescription = '채팅방에 참여해 동행할 사람을 찾아보세요\n';
  let resultButtonLabel = '글 찾아보기';
  let resultTitle = '참여중인 채팅방이 없어요';

  if (isError) {
    resultDescription = '불러오는 중 오류가 발생했어요.\n잠시 후 다시 시도해주세요.';
    resultButtonLabel = '다시 불러오기';
    resultTitle = '채팅방을 불러올 수 없어요';
  } else if (isMatching) {
    resultDescription = '함께 택시 탈 사람을 찾아보세요';
    resultButtonLabel = '매칭하러가기';
    resultTitle = '참여중인 택시 매칭이 없어요';
  }

  return (
    <div
      aria-live="polite"
      className="relative mt-[86px] h-[385px] w-full overflow-visible"
      data-testid={isError ? 'chat-list-error' : 'chat-list-empty'}
    >
      <div className="pt-[35px]">
        <ResultSection
          buttons="primary"
          className="relative left-[-86px] !w-[520px] [&>div>div:last-child]:!mt-[17px] [&>div>span]:!h-[38px]"
          description={resultDescription}
          icon={
            <Icon
              color={isError ? 'var(--color-fg-critical)' : 'var(--color-fg-neutral-muted)'}
              name={isError ? 'exclamationmarkCircleFill' : 'chatbubbleText'}
              size={66}
            />
          }
          primaryButtonProps={{
            onClick: isError ? () => onRetry?.(tab) : () => onExplore?.(tab),
          }}
          primaryLabel={resultButtonLabel}
          size="medium"
          title={resultTitle}
        />
      </div>
    </div>
  );
}

function ChatListPageStateView({
  onChatRoomClick,
  onExplore,
  onLoadMore,
  onRetry,
  pagination,
  state,
  tab,
}: {
  onChatRoomClick?: (chatRoom: ChatRoomListItem) => void;
  onExplore?: (tab: ChatListTabValue) => void;
  onLoadMore?: (tab: ChatListTabValue) => void;
  onRetry?: (tab: ChatListTabValue) => void;
  pagination?: ChatListPagePaginationStates;
  state: ChatListPageState;
  tab: ChatListTabValue;
}) {
  if (state.status === 'error' || state.data.items.length === 0) {
    return <ChatListResultState onExplore={onExplore} onRetry={onRetry} state={state} tab={tab} />;
  }

  return (
    <ChatListScrollableState
      hasNextPage={pagination?.[tab].hasNextPage}
      items={state.data.items}
      isFetchingNextPage={pagination?.[tab].isFetchingNextPage}
      onChatRoomClick={onChatRoomClick}
      onLoadMore={onLoadMore ? () => onLoadMore(tab) : undefined}
      scrollKey={`${tab}:${state.data.items.length}`}
    />
  );
}

function ChatListScrollableState({
  hasNextPage = false,
  items,
  isFetchingNextPage = false,
  onChatRoomClick,
  onLoadMore,
  scrollKey,
}: {
  hasNextPage?: boolean;
  items: readonly ChatRoomListItem[];
  isFetchingNextPage?: boolean;
  onChatRoomClick?: (chatRoom: ChatRoomListItem) => void;
  onLoadMore?: () => void;
  scrollKey: string;
}) {
  const { scrollRef, showBottom, showTop } = useScrollFog(scrollKey);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = loadMoreRef.current;
    const scrollElement = scrollRef.current;

    if (
      !target ||
      !scrollElement ||
      !hasNextPage ||
      !onLoadMore ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !isFetchingNextPage) {
          onLoadMore();
        }
      },
      { root: scrollElement, rootMargin: '0px 0px 160px 0px' },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore, scrollRef]);

  return (
    <div
      className="relative -mx-5 mt-8 min-h-0 !w-[calc(100%+2.5rem)] flex-1 overflow-hidden"
      data-testid="chat-list-scroll-region"
    >
      <div
        className="h-full [scrollbar-width:none] overflow-x-hidden overflow-y-auto overscroll-contain [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        ref={scrollRef}
      >
        <ChatList className="!mx-0 !w-full" fullWidth items={items} onItemClick={onChatRoomClick} />
        {hasNextPage && onLoadMore ? (
          <div
            aria-busy={isFetchingNextPage}
            aria-live="polite"
            className="flex min-h-8 items-center justify-center py-2"
            data-testid="chat-list-load-more"
            ref={loadMoreRef}
          >
            {isFetchingNextPage ? '채팅방을 불러오는 중이에요.' : null}
          </div>
        ) : null}
      </div>
      <ScrollFog showBottom={showBottom} showTop={showTop} />
    </div>
  );
}

export function ChatListPageContent({
  className,
  defaultTab = 'community',
  onChatRoomClick,
  onExplore,
  onLoadMore,
  onRetry,
  onTabChange,
  pagination,
  states = DEFAULT_CHAT_LIST_STATES,
}: ChatListPageContentProps) {
  const [selectedTab, setSelectedTab] = useState<ChatListTabValue>(defaultTab);
  const selectedState = states[selectedTab];

  const handleTabChange = (nextTab: ChatListTabValue) => {
    setSelectedTab(nextTab);
    onTabChange?.(nextTab);
  };

  return (
    <section aria-label="채팅 목록" className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <ChatListTabs onValueChange={handleTabChange} value={selectedTab} />
      <ChatListPageStateView
        onChatRoomClick={onChatRoomClick}
        onExplore={onExplore}
        onLoadMore={onLoadMore}
        onRetry={onRetry}
        pagination={pagination}
        state={selectedState}
        tab={selectedTab}
      />
    </section>
  );
}
