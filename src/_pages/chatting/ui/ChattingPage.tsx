'use client';

import { useState } from 'react';
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
import { Menu, type MenuItem } from '@/shared/ui/menu';
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

type ChatMessageProps = {
  message: ChatRoomMessage;
  index: number;
  onReport: NonNullable<ChatReportDialogProps['onOpenChange']>;
};

function ChatMessage({ message, index, onReport }: ChatMessageProps) {
  if (message.kind === 'notice') {
    return (
      <ChatNotice className={getMessageClassName(message, index)}>{message.content}</ChatNotice>
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

  const menuItems: MenuItem[] = [
    {
      id: 'report-chat',
      icon: <Icon aria-hidden="true" name="messageSquareWarning" size={24} />,
      content: '채팅 신고하기',
      onClick: () => onReport(true),
    },
    {
      id: 'report-user',
      icon: <Icon aria-hidden="true" name="userRoundX" size={24} />,
      content: '유저 신고하기',
      onClick: () => onReport(true),
    },
  ];

  return (
    <Menu
      aria-label="메시지 메뉴"
      items={menuItems}
      longPressDelay={1000}
      triggerNativeButton={false}
    >
      {bubble}
    </Menu>
  );
}

export function ChattingPage({ room }: ChattingPageProps) {
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
    <PageLayout
      className="relative h-dvh min-h-0 overflow-hidden"
      contentClassName="min-h-0 flex-1 gap-0 !px-0 !pt-[56px] !pb-[78px]"
      header={
        <Header
          className="!fixed top-0 left-1/2 z-20 w-full max-w-[393px] -translate-x-1/2"
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
          className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 pt-[95px] pb-8"
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
    </PageLayout>
  );
}
