'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  ChatList,
  ChatListTabs,
  type ChatListTabValue,
  type ChatRoomListItem,
} from '@/entities/chat';
import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';
import { ResultSection } from '@/shared/ui/result-section';
import { ScrollFog, useScrollFog } from '@/shared/ui/scroll-fog';

import {
  DEFAULT_CHAT_LIST_STATES,
  type ChatListPageState,
  type ChatListPageStates,
} from '@/_pages/chat-list/model/chat-list-state';
import { useChatRoomListQuery } from '@/_pages/chat-list/api/chat-room-list';
import { ChatListPageContentLoading } from './chat-list-page-loading';

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

export function ChatListPageContentWithQuery() {
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
