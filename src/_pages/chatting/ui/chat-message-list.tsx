import { useEffect, useRef } from 'react';

import type { ChatRoomMessage } from '@/_pages/chatting/model/chat-room';

import { ChatMessageItem } from './chat-message-item';

type ChatMessageListProps = {
  roomId: string;
  messages: readonly ChatRoomMessage[];
  lastReadMessageId: number | null;
  onReport: () => void;
};

export function ChatMessageList({
  roomId,
  messages,
  lastReadMessageId,
  onReport,
}: ChatMessageListProps) {
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lastReadMessageId === null) {
      return;
    }

    const lastReadMessage = messagesRef.current?.querySelector<HTMLElement>(
      `[data-message-id="${lastReadMessageId}"]`,
    );

    lastReadMessage?.scrollIntoView?.({ block: 'center' });
  }, [roomId, lastReadMessageId]);

  return (
    <div
      aria-label="채팅 메시지"
      className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 pt-[95px] pb-8"
      ref={messagesRef}
    >
      {messages.map((message, index) => (
        <ChatMessageItem index={index} key={message.id} message={message} onReport={onReport} />
      ))}
    </div>
  );
}
