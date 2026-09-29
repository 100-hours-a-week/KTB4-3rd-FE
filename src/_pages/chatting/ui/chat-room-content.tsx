import { useMemo, type ReactNode } from 'react';

import { ChatComposer, type ChatRoomWebSocketConnectionValue } from '@/features/chatting';

import type { ChatRoom, ChatRoomMessage } from '@/_pages/chatting/model/chat-room';

import { ChatMessageList } from './chat-message-list';
import type { ChatReportTarget } from './chat-message-menu';

type ChatRoomContentProps = {
  room: ChatRoom;
  liveMessages: readonly ChatRoomMessage[];
  connection: ChatRoomWebSocketConnectionValue;
  onReport?: (target: ChatReportTarget) => void;
  topContent?: ReactNode;
  bottomContent?: ReactNode;
  hasPreviousMessages?: boolean;
  isFetchingPreviousMessages?: boolean;
  onLoadPreviousMessages?: () => void;
};

export function ChatRoomContent({
  room,
  liveMessages,
  onReport = () => {},
  connection,
  topContent,
  bottomContent,
  hasPreviousMessages = false,
  isFetchingPreviousMessages = false,
  onLoadPreviousMessages = () => {},
}: ChatRoomContentProps) {
  const messages = useMemo(() => {
    const roomMessageIds = new Set(room.messages.map((message) => message.id));

    return [...room.messages, ...liveMessages.filter((message) => !roomMessageIds.has(message.id))];
  }, [liveMessages, room.messages]);

  const handleSubmit = (content: string) => {
    connection.sendMessage(content);
  };

  return (
    <>
      <section className="relative flex min-h-0 flex-1 flex-col">
        {topContent}
        <ChatMessageList
          lastReadMessageId={room.lastReadMessageId}
          messages={messages}
          onReport={onReport}
          roomId={room.id}
          bottomContent={bottomContent}
          hasPreviousMessages={hasPreviousMessages}
          isFetchingPreviousMessages={isFetchingPreviousMessages}
          onLoadPreviousMessages={onLoadPreviousMessages}
        />
        <ChatComposer
          className="!fixed bottom-0 left-1/2 z-20 !h-[calc(78px+env(safe-area-inset-bottom,0px))] w-full max-w-[393px] -translate-x-1/2 border-t border-[var(--color-stroke-neutral-weak)] !pb-[env(safe-area-inset-bottom,0px)]"
          disabled={room.memberCount === 1}
          onSubmit={handleSubmit}
          submitDisabled={connection.status !== 'open'}
        />
      </section>
    </>
  );
}
