'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Bubble, ChatComposer, ChatNotice } from '@/features/chatting';
import { cn } from '@/shared/lib/cn';
import { BackButton } from '@/shared/ui/back-button';
import { Header } from '@/shared/ui/header';
import { Icon } from '@/shared/ui/icon';
import { PageLayout } from '@/shared/ui/page-layout';
import { Text } from '@/shared/ui/text';

import type { ChatRoom, ChatRoomMessage } from '@/_pages/chatting/model/chat-room';

export type ChattingPageProps = {
  room: ChatRoom;
};

const initialMessageSpacing = ['', 'mt-[41px]', 'mt-[47px]', 'mt-[27px]', 'mt-[41px]'];

function getMessageClassName(message: ChatRoomMessage, index: number) {
  const spacing = initialMessageSpacing[index] ?? 'mt-4';

  if (message.kind === 'notice') {
    return cn(spacing, 'self-center');
  }

  return cn(spacing, message.variant === 'me' && 'self-end mr-[10px]');
}

function ChatMessage({ message, index }: { message: ChatRoomMessage; index: number }) {
  if (message.kind === 'notice') {
    return (
      <ChatNotice className={getMessageClassName(message, index)}>{message.content}</ChatNotice>
    );
  }

  return (
    <Bubble
      className={cn(
        getMessageClassName(message, index),
        '!py-[14px]',
        message.layout === 'tall' && '!h-[82px] !w-[248px] !max-w-none !p-4',
      )}
      variant={message.variant}
    >
      {message.content}
    </Bubble>
  );
}

export function ChattingPage({ room }: ChattingPageProps) {
  const [messages, setMessages] = useState(() => [...room.messages]);

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
    <PageLayout
      className="h-dvh min-h-0 overflow-hidden"
      contentClassName="min-h-0 flex-1 gap-0 !px-0 !pb-0"
      header={
        <Header
          leftSlot={<BackButton href="/" />}
          rightSlot={
            <div className="flex w-[145px] items-center justify-between">
              <Text as="span" color="fg.neutralMuted" variant="t4Regular">
                {room.memberCount}/{room.memberLimit}
              </Text>
              <Link
                aria-label="채팅방 나가기"
                className="inline-flex size-11 items-center justify-center rounded-[var(--dimension-x2)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-stroke-focus-ring)]"
                href="/"
              >
                <Icon aria-hidden="true" color="var(--color-fg-critical)" name="logOut" size={24} />
              </Link>
            </div>
          }
          title={room.title}
        />
      }
    >
      <section className="flex min-h-0 flex-1 flex-col">
        <div
          aria-label="채팅 메시지"
          className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pt-[95px] pb-8"
        >
          {messages.map((message, index) => (
            <ChatMessage index={index} key={message.id} message={message} />
          ))}
        </div>
        <ChatComposer
          className="shrink-0 border-t border-[var(--color-stroke-neutral-weak)]"
          onSubmit={handleSubmit}
        />
      </section>
    </PageLayout>
  );
}
