import { useCallback, useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';

import { Icon } from '@/shared/ui/icon';

import type { ChatRoomMessage } from '@/_pages/chatting/model/chat-room';

import { ChatMessageItem } from './chat-message-item';
import type { ChatReportTarget } from './chat-message-menu';

type ChatMessageListProps = {
  roomId: string;
  messages: readonly ChatRoomMessage[];
  lastReadMessageId: number | null;
  onReport: (target: ChatReportTarget) => void;
  hasPreviousMessages?: boolean;
  hasNewerMessages?: boolean;
  isFetchingPreviousMessages?: boolean;
  isFetchingNewerMessages?: boolean;
  isFetchPreviousMessagesError?: boolean;
  isFetchNewerMessagesError?: boolean;
  onLoadPreviousMessages?: () => Promise<unknown>;
  onLoadNewerMessages?: () => Promise<unknown>;
  hasNewMessages?: boolean;
  liveMessageCount?: number;
  bottomContent?: ReactNode;
};

type LoadDirection = 'before' | 'after';

function getLoadStatus(
  isFetching: boolean,
  hasError: boolean,
  loadingMessage: string,
  errorMessage: string,
) {
  if (isFetching) {
    return loadingMessage;
  }

  if (hasError) {
    return errorMessage;
  }

  return null;
}

function scrollToBottom(element: HTMLDivElement | null, behavior: ScrollBehavior = 'auto') {
  if (!element) {
    return;
  }

  if (typeof element.scrollTo === 'function') {
    element.scrollTo({ top: element.scrollHeight, behavior });
  } else {
    element.scrollTop = element.scrollHeight;
  }
}

export function ChatMessageList({
  roomId,
  messages,
  lastReadMessageId,
  onReport,
  hasPreviousMessages = false,
  hasNewerMessages = false,
  isFetchingPreviousMessages = false,
  isFetchingNewerMessages = false,
  isFetchPreviousMessagesError = false,
  isFetchNewerMessagesError = false,
  onLoadPreviousMessages,
  onLoadNewerMessages,
  hasNewMessages = false,
  liveMessageCount = 0,
  bottomContent,
}: ChatMessageListProps) {
  const messagesRef = useRef<HTMLDivElement>(null);
  const previousMessagesRef = useRef<HTMLDivElement>(null);
  const nextMessagesRef = useRef<HTMLDivElement>(null);
  const initialPositionedRoomRef = useRef<string | null>(null);
  const previousLiveMessageCountRef = useRef(liveMessageCount);
  const pendingPrependRef = useRef<{
    messageCount: number;
    scrollHeight: number;
    scrollTop: number;
  } | null>(null);
  const pendingAppendRef = useRef<number | null>(null);

  useEffect(() => {
    initialPositionedRoomRef.current = null;
    previousLiveMessageCountRef.current = 0;
    pendingPrependRef.current = null;
    pendingAppendRef.current = null;
  }, [roomId]);

  const handleLoadMore = useCallback(
    (direction: LoadDirection) => {
      const isBefore = direction === 'before';
      const onLoad = isBefore ? onLoadPreviousMessages : onLoadNewerMessages;
      const isFetching = isBefore ? isFetchingPreviousMessages : isFetchingNewerMessages;
      const hasError = isBefore ? isFetchPreviousMessagesError : isFetchNewerMessagesError;

      if (!onLoad || isFetching || hasError) {
        return;
      }

      const scrollElement = messagesRef.current;

      if (isBefore && scrollElement) {
        pendingPrependRef.current = {
          messageCount: messages.length,
          scrollHeight: scrollElement.scrollHeight,
          scrollTop: scrollElement.scrollTop,
        };
      }

      if (!isBefore) {
        pendingAppendRef.current = messages.length;
      }

      void onLoad().catch(() => {
        if (isBefore) {
          pendingPrependRef.current = null;
        } else {
          pendingAppendRef.current = null;
        }
      });
    },
    [
      isFetchNewerMessagesError,
      isFetchPreviousMessagesError,
      isFetchingNewerMessages,
      isFetchingPreviousMessages,
      messages.length,
      onLoadNewerMessages,
      onLoadPreviousMessages,
    ],
  );

  useEffect(() => {
    const target = previousMessagesRef.current;
    const scrollElement = messagesRef.current;

    if (
      !target ||
      !scrollElement ||
      !hasPreviousMessages ||
      !onLoadPreviousMessages ||
      isFetchPreviousMessagesError ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !isFetchingPreviousMessages) {
          handleLoadMore('before');
        }
      },
      { root: scrollElement, rootMargin: '160px 0px 0px 0px' },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [
    handleLoadMore,
    hasPreviousMessages,
    isFetchPreviousMessagesError,
    isFetchingPreviousMessages,
    onLoadPreviousMessages,
  ]);

  useEffect(() => {
    const target = nextMessagesRef.current;
    const scrollElement = messagesRef.current;

    if (
      !target ||
      !scrollElement ||
      !hasNewerMessages ||
      !onLoadNewerMessages ||
      isFetchNewerMessagesError ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !isFetchingNewerMessages) {
          handleLoadMore('after');
        }
      },
      { root: scrollElement, rootMargin: '0px 0px 160px 0px' },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [
    handleLoadMore,
    hasNewerMessages,
    isFetchNewerMessagesError,
    isFetchingNewerMessages,
    onLoadNewerMessages,
  ]);

  useLayoutEffect(() => {
    const pendingPrepend = pendingPrependRef.current;

    if (!pendingPrepend || isFetchingPreviousMessages) {
      return;
    }

    const scrollElement = messagesRef.current;

    if (
      !isFetchPreviousMessagesError &&
      scrollElement &&
      messages.length > pendingPrepend.messageCount
    ) {
      scrollElement.scrollTop =
        pendingPrepend.scrollTop + scrollElement.scrollHeight - pendingPrepend.scrollHeight;
    }

    pendingPrependRef.current = null;
  }, [isFetchPreviousMessagesError, isFetchingPreviousMessages, messages.length]);

  useLayoutEffect(() => {
    const pendingAppendCount = pendingAppendRef.current;

    if (pendingAppendCount === null || isFetchingNewerMessages) {
      return;
    }

    if (!isFetchNewerMessagesError && messages.length > pendingAppendCount) {
      scrollToBottom(messagesRef.current, 'smooth');
    }

    pendingAppendRef.current = null;
  }, [isFetchNewerMessagesError, isFetchingNewerMessages, messages.length]);

  useLayoutEffect(() => {
    const previousLiveMessageCount = previousLiveMessageCountRef.current;

    if (liveMessageCount > previousLiveMessageCount && pendingAppendRef.current === null) {
      scrollToBottom(messagesRef.current, 'smooth');
    }

    previousLiveMessageCountRef.current = liveMessageCount;
  }, [liveMessageCount, messages.length]);

  useEffect(() => {
    if (initialPositionedRoomRef.current === roomId || messages.length === 0) {
      return;
    }

    const scrollElement = messagesRef.current;

    if (!scrollElement) {
      return;
    }

    if (lastReadMessageId === null) {
      scrollElement.scrollTop = scrollElement.scrollHeight;
    } else {
      const firstUnreadMessage = [
        ...scrollElement.querySelectorAll<HTMLElement>('[data-message-id]'),
      ].find((messageElement) => {
        const messageId = Number(messageElement.dataset.messageId);

        return Number.isSafeInteger(messageId) && messageId > lastReadMessageId;
      });

      if (firstUnreadMessage) {
        firstUnreadMessage.scrollIntoView?.({ block: 'center' });
      } else {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }

    initialPositionedRoomRef.current = roomId;
  }, [lastReadMessageId, messages.length, roomId]);

  const previousMessagesStatus = getLoadStatus(
    isFetchingPreviousMessages,
    isFetchPreviousMessagesError,
    '이전 메시지를 불러오는 중이에요.',
    '이전 메시지를 불러오지 못했어요.',
  );
  const newerMessagesStatus = getLoadStatus(
    isFetchingNewerMessages,
    isFetchNewerMessagesError,
    '새 메시지를 불러오는 중이에요.',
    '새 메시지를 불러오지 못했어요.',
  );

  return (
    <div className="relative min-h-0 flex-1">
      <div
        aria-label="채팅 메시지"
        className="flex h-full min-h-0 flex-col overflow-y-auto overscroll-contain px-5 pt-[95px] pb-8"
        data-clarity-mask="true"
        ref={messagesRef}
      >
        {hasPreviousMessages && onLoadPreviousMessages ? (
          <div
            aria-busy={isFetchingPreviousMessages}
            aria-live="polite"
            className="flex min-h-8 shrink-0 items-center justify-center py-2"
            data-testid="chat-message-load-previous"
            ref={previousMessagesRef}
          >
            {previousMessagesStatus}
          </div>
        ) : null}
        {messages.map((message, index) => (
          <ChatMessageItem index={index} key={message.id} message={message} onReport={onReport} />
        ))}
        {hasNewerMessages && onLoadNewerMessages ? (
          <div
            aria-busy={isFetchingNewerMessages}
            aria-live="polite"
            className="flex min-h-8 shrink-0 items-center justify-center py-2"
            data-testid="chat-message-load-newer"
            ref={nextMessagesRef}
          >
            {newerMessagesStatus}
          </div>
        ) : null}
        {bottomContent}
      </div>
      {hasNewMessages && onLoadNewerMessages ? (
        <button
          aria-label="새 메시지 보기"
          className="absolute bottom-5 left-1/2 z-10 inline-flex size-10 -translate-x-1/2 items-center justify-center rounded-full bg-[var(--color-bg-layer-default)] shadow-[0_2px_8px_rgba(0,0,0,0.16)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isFetchingNewerMessages}
          onClick={() => handleLoadMore('after')}
          type="button"
        >
          <Icon aria-hidden="true" name="chevronDown" size={20} />
        </button>
      ) : null}
    </div>
  );
}
