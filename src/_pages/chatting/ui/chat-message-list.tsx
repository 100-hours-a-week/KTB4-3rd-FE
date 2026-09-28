import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactNode,
  type UIEvent,
} from 'react';

import type { ChatRoomMessage } from '@/_pages/chatting/model/chat-room';

import { ChatMessageItem } from './chat-message-item';
import type { ChatReportTarget } from './chat-message-menu';

type ChatMessageListProps = {
  roomId: string;
  messages: readonly ChatRoomMessage[];
  lastReadMessageId: number | null;
  onReport: (target: ChatReportTarget) => void;
  bottomContent?: ReactNode;
  hasPreviousMessages: boolean;
  isFetchingPreviousMessages: boolean;
  onLoadPreviousMessages: () => void;
};

export function ChatMessageList({
  roomId,
  messages,
  lastReadMessageId,
  onReport,
  bottomContent,
  hasPreviousMessages,
  isFetchingPreviousMessages,
  onLoadPreviousMessages,
}: ChatMessageListProps) {
  const messagesRef = useRef<HTMLDivElement>(null);
  const previousScrollRef = useRef<{ height: number; top: number } | null>(null);
  const latestMessageId = messages[messages.length - 1]?.id;
  const firstMessageId = messages[0]?.id;
  const previousMessagesRef = useRef({
    count: messages.length,
    firstMessageId,
    lastMessageId: latestMessageId,
    roomId,
  });

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const messageList = event.currentTarget;

      if (
        messageList.scrollTop > 80 ||
        !hasPreviousMessages ||
        isFetchingPreviousMessages ||
        previousScrollRef.current
      ) {
        return;
      }

      previousScrollRef.current = {
        height: messageList.scrollHeight,
        top: messageList.scrollTop,
      };
      onLoadPreviousMessages();
    },
    [hasPreviousMessages, isFetchingPreviousMessages, onLoadPreviousMessages],
  );

  useLayoutEffect(() => {
    const previousScroll = previousScrollRef.current;
    const messageList = messagesRef.current;

    if (!previousScroll || isFetchingPreviousMessages || !messageList) {
      return;
    }

    messageList.scrollTop = previousScroll.top + (messageList.scrollHeight - previousScroll.height);
    previousScrollRef.current = null;
  }, [isFetchingPreviousMessages, messages.length]);

  useEffect(() => {
    if (lastReadMessageId === null) {
      return;
    }

    const lastReadMessage = messagesRef.current?.querySelector<HTMLElement>(
      `[data-message-id="${lastReadMessageId}"]`,
    );

    lastReadMessage?.scrollIntoView?.({ block: 'center' });
  }, [roomId, lastReadMessageId]);

  useEffect(() => {
    const previousMessages = previousMessagesRef.current;
    const isRoomChanged = previousMessages.roomId !== roomId;
    const isPreviousMessagePageLoaded =
      messages.length > previousMessages.count &&
      firstMessageId !== previousMessages.firstMessageId &&
      latestMessageId === previousMessages.lastMessageId;
    const hasNewMessage =
      latestMessageId !== previousMessages.lastMessageId ||
      (messages.length > previousMessages.count &&
        firstMessageId === previousMessages.firstMessageId);

    previousMessagesRef.current = {
      count: messages.length,
      firstMessageId,
      lastMessageId: latestMessageId,
      roomId,
    };

    if (isRoomChanged || isPreviousMessagePageLoaded || !hasNewMessage) {
      return;
    }

    const messageList = messagesRef.current;

    messageList?.scrollTo?.({
      behavior: 'smooth',
      top: messageList.scrollHeight,
    });
  }, [firstMessageId, latestMessageId, messages.length, roomId]);

  return (
    <div
      aria-label="채팅 메시지"
      className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 pt-[95px] pb-8"
      data-clarity-mask="true"
      onScroll={handleScroll}
      ref={messagesRef}
    >
      {messages.map((message, index) => (
        <ChatMessageItem index={index} key={message.id} message={message} onReport={onReport} />
      ))}
      {bottomContent}
    </div>
  );
}
