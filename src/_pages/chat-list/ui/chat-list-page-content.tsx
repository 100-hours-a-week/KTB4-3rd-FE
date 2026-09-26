'use client';

import { useState } from 'react';

import {
  ChatList,
  ChatListTabs,
  type ChatListTabValue,
  type ChatRoomListItem,
} from '@/entities/chat';
import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';
import { ResultSection } from '@/shared/ui/result-section';

import {
  DEFAULT_CHAT_LIST_STATES,
  type ChatListPageState,
  type ChatListPageStates,
} from '@/_pages/chat-list/model/chat-list-state';

export type ChatListPageContentProps = {
  className?: string;
  defaultTab?: ChatListTabValue;
  onChatRoomClick?: (chatRoom: ChatRoomListItem) => void;
  onRetry?: (tab: ChatListTabValue) => void;
  onTabChange?: (tab: ChatListTabValue) => void;
  states?: ChatListPageStates;
};

function ChatListResultState({
  onRetry,
  state,
  tab,
}: {
  onRetry?: (tab: ChatListTabValue) => void;
  state: ChatListPageState;
  tab: ChatListTabValue;
}) {
  const isError = state.status === 'error';

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
          description={
            isError
              ? '불러오는 중 오류가 발생했어요.\n잠시 후 다시 시도해주세요.'
              : '채팅방에 참여해 동행할 사람을 찾아보세요\n'
          }
          icon={
            <Icon
              color={isError ? 'var(--color-fg-critical)' : 'var(--color-fg-neutral-muted)'}
              name={isError ? 'exclamationmarkCircleFill' : 'chatbubbleText'}
              size={66}
            />
          }
          primaryButtonProps={{ onClick: () => onRetry?.(tab) }}
          primaryLabel={isError ? '다시 불러오기' : '글 찾아보기'}
          size="medium"
          title={isError ? '채팅방을 불러올 수 없어요' : '참여중인 채팅방이 없어요'}
        />
      </div>
    </div>
  );
}

function ChatListPageStateView({
  onChatRoomClick,
  onRetry,
  state,
  tab,
}: {
  onChatRoomClick?: (chatRoom: ChatRoomListItem) => void;
  onRetry?: (tab: ChatListTabValue) => void;
  state: ChatListPageState;
  tab: ChatListTabValue;
}) {
  if (state.status === 'error' || state.data.items.length === 0) {
    return <ChatListResultState onRetry={onRetry} state={state} tab={tab} />;
  }

  return (
    <div className="mt-8 min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <ChatList fullWidth items={state.data.items} onItemClick={onChatRoomClick} />
    </div>
  );
}

export function ChatListPageContent({
  className,
  defaultTab = 'community',
  onChatRoomClick,
  onRetry,
  onTabChange,
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
        onRetry={onRetry}
        state={selectedState}
        tab={selectedTab}
      />
    </section>
  );
}
