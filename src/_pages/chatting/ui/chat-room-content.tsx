import { useState } from 'react';

import { ChatComposer, ChatReportDialog } from '@/features/chatting';

import type { ChatRoom } from '@/_pages/chatting/model/chat-room';

import { ChatMessageList } from './chat-message-list';

type ChatRoomContentProps = {
  room: ChatRoom;
};

export function ChatRoomContent({ room }: ChatRoomContentProps) {
  const [messages, setMessages] = useState(() => [...room.messages]);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

  const handleSubmit = (content: string) => {
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `local-message-${currentMessages.length}`,
        kind: 'bubble',
        content,
        variant: 'me',
      },
    ]);
  };

  return (
    <>
      <section className="flex min-h-0 flex-1 flex-col">
        <ChatMessageList
          lastReadMessageId={room.lastReadMessageId}
          messages={messages}
          onReport={() => setIsReportDialogOpen(true)}
          roomId={room.id}
        />
        <ChatComposer
          className="!fixed bottom-0 left-1/2 z-20 w-full max-w-[393px] -translate-x-1/2 border-t border-[var(--color-stroke-neutral-weak)]"
          onSubmit={handleSubmit}
        />
      </section>
      <ChatReportDialog onOpenChange={setIsReportDialogOpen} open={isReportDialogOpen} />
    </>
  );
}
