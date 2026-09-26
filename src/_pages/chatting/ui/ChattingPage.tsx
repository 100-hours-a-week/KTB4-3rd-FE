'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';

import {
  Bubble,
  ChatComposer,
  ChatNotice,
  ChatReportDialog,
  type ChatReportDialogProps,
} from '@/features/chatting';
import { cn } from '@/shared/lib/cn';
import { BackButton } from '@/shared/ui/back-button';
import { Header } from '@/shared/ui/header';
import { Icon } from '@/shared/ui/icon';
import { PageLayout } from '@/shared/ui/page-layout';
import { Text } from '@/shared/ui/text';

import { useChatRoomQueries } from '@/_pages/chatting/api/chat-room';
import {
  createChatRoomFromApi,
  type ChatRoom,
  type ChatRoomMessage,
} from '@/_pages/chatting/model/chat-room';

import { ChatMessageMenu } from './chat-message-menu';

export type ChattingPageProps = {
  roomId: string;
};

const initialMessageSpacing = ['', 'mt-[41px]', 'mt-[47px]', 'mt-[27px]', 'mt-[41px]'];

function getMessageClassName(message: ChatRoomMessage, index: number) {
  const spacing = initialMessageSpacing[index] ?? 'mt-4';

  if (message.kind === 'notice') {
    return cn(spacing, 'self-center');
  }

  return cn(spacing, message.variant === 'me' && 'self-end mr-[10px]');
}

type ChatMessageProps = {
  message: ChatRoomMessage;
  index: number;
  onReport: NonNullable<ChatReportDialogProps['onOpenChange']>;
};

function ChatMessage({ message, index, onReport }: ChatMessageProps) {
  if (message.kind === 'notice') {
    return (
      <ChatNotice className={getMessageClassName(message, index)} data-message-id={message.id}>
        {message.content}
      </ChatNotice>
    );
  }

  const bubble = (
    <Bubble
      aria-label={message.variant === 'other' ? '메시지 메뉴 열기' : undefined}
      className={cn(
        getMessageClassName(message, index),
        '!py-[14px]',
        message.layout === 'tall' && '!h-[82px] !w-[248px] !max-w-none !p-4',
      )}
      data-message-id={message.id}
      role={message.variant === 'other' ? 'button' : undefined}
      tabIndex={message.variant === 'other' ? 0 : undefined}
      variant={message.variant}
    >
      {message.content}
    </Bubble>
  );

  if (message.variant !== 'other') {
    return bubble;
  }

  return <ChatMessageMenu onReport={() => onReport(true)}>{bubble}</ChatMessageMenu>;
}

function ChatRoomLayout({ children, room }: { children: ReactNode; room?: ChatRoom }) {
  return (
    <PageLayout
      className="relative h-dvh min-h-0 overflow-hidden"
      contentClassName="min-h-0 flex-1 gap-0 !px-0 !pt-[56px] !pb-[78px]"
      header={
        <Header
          className="!fixed top-0 left-1/2 z-20 w-full max-w-[393px] -translate-x-1/2"
          leftSlot={<BackButton href="/" />}
          rightSlot={
            <div
              className={cn(
                'flex w-[145px] items-center',
                room ? 'justify-between' : 'justify-end',
              )}
            >
              {room ? (
                <Text as="span" color="fg.neutralMuted" variant="t4Regular">
                  {room.memberCount}/{room.memberLimit}
                </Text>
              ) : null}
              <Link
                aria-label="채팅방 나가기"
                className="inline-flex size-11 items-center justify-center rounded-[var(--dimension-x2)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-stroke-focus-ring)]"
                href="/"
              >
                <Icon aria-hidden="true" color="var(--color-fg-critical)" name="logOut" size={24} />
              </Link>
            </div>
          }
          title={room?.title ?? '채팅방'}
        />
      }
    >
      {children}
    </PageLayout>
  );
}

function ChatRoomContent({ room }: { room: ChatRoom }) {
  const [messages, setMessages] = useState(() => [...room.messages]);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (room.lastReadMessageId === null) {
      return;
    }

    const lastReadMessage = messagesRef.current?.querySelector<HTMLElement>(
      `[data-message-id="${room.lastReadMessageId}"]`,
    );

    lastReadMessage?.scrollIntoView?.({ block: 'center' });
  }, [room.id, room.lastReadMessageId, room.messages.length]);

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
        <div
          aria-label="채팅 메시지"
          className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 pt-[95px] pb-8"
          ref={messagesRef}
        >
          {messages.map((message, index) => (
            <ChatMessage
              index={index}
              key={message.id}
              message={message}
              onReport={setIsReportDialogOpen}
            />
          ))}
        </div>
        <ChatComposer
          className="!fixed bottom-0 left-1/2 z-20 w-full max-w-[393px] -translate-x-1/2 border-t border-[var(--color-stroke-neutral-weak)]"
          onSubmit={handleSubmit}
        />
      </section>
      <ChatReportDialog onOpenChange={setIsReportDialogOpen} open={isReportDialogOpen} />
    </>
  );
}

function ChatRoomState({ children, label }: { children: ReactNode; label: string }) {
  return (
    <section
      aria-busy="true"
      aria-label={label}
      className="flex min-h-0 flex-1 items-center justify-center"
    >
      <Text color="fg.neutralSubtle" variant="t4Regular">
        {children}
      </Text>
    </section>
  );
}

export function ChattingPage({ roomId }: ChattingPageProps) {
  const { detailQuery, messagesQuery } = useChatRoomQueries(roomId);
  const room =
    detailQuery.data && messagesQuery.data
      ? createChatRoomFromApi(detailQuery.data.data, messagesQuery.data.data.items)
      : undefined;

  if (detailQuery.isPending || messagesQuery.isPending) {
    return (
      <ChatRoomLayout>
        <ChatRoomState label="채팅방을 불러오는 중">채팅방을 불러오는 중이에요.</ChatRoomState>
      </ChatRoomLayout>
    );
  }

  if (detailQuery.isError || messagesQuery.isError || !room) {
    return (
      <ChatRoomLayout>
        <ChatRoomState label="채팅방을 불러오지 못함">채팅방을 불러오지 못했어요.</ChatRoomState>
      </ChatRoomLayout>
    );
  }

  return (
    <ChatRoomLayout room={room}>
      <ChatRoomContent
        key={`${room.id}:${room.messages.map((message) => message.id).join(',')}`}
        room={room}
      />
    </ChatRoomLayout>
  );
}
