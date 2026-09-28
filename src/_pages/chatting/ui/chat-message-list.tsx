import { useEffect, useRef, type ReactNode } from 'react';

import type { ChatRoomMessage } from '@/_pages/chatting/model/chat-room';

import { ChatMessageItem } from './chat-message-item';
import type { ChatReportTarget } from './chat-message-menu';

type ChatMessageListProps = {
  roomId: string;
  messages: readonly ChatRoomMessage[];
  lastReadMessageId: number | null;
  onReport: (target: ChatReportTarget) => void;
  bottomContent?: ReactNode;
};

export function ChatMessageList({
  roomId,
  messages,
  lastReadMessageId,
  onReport,
  bottomContent,
}: ChatMessageListProps) {
  const messagesRef = useRef<HTMLDivElement>(null);
  const latestMessageId = messages[messages.length - 1]?.id;
  const previousMessagesRef = useRef({
    count: messages.length,
    lastMessageId: latestMessageId,
    roomId,
  });

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
    const hasNewMessage =
      messages.length > previousMessages.count ||
      latestMessageId !== previousMessages.lastMessageId;

    previousMessagesRef.current = {
      count: messages.length,
      lastMessageId: latestMessageId,
      roomId,
    };

    if (isRoomChanged || !hasNewMessage) {
      return;
    }

    const messageList = messagesRef.current;

    messageList?.scrollTo?.({
      behavior: 'smooth',
      top: messageList.scrollHeight,
    });
  }, [latestMessageId, messages.length, roomId]);

  return (
    <div
      aria-label="채팅 메시지"
      className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 pt-[95px] pb-8"
      ref={messagesRef}
    >
      {messages.map((message, index) => (
        <ChatMessageItem index={index} key={message.id} message={message} onReport={onReport} />
      ))}
      {bottomContent}
    </div>
  );
}
