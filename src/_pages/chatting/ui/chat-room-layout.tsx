import type { ReactNode } from 'react';
import Link from 'next/link';

import { cn } from '@/shared/lib/cn';
import { BackButton } from '@/shared/ui/back-button';
import { Header } from '@/shared/ui/header';
import { Icon } from '@/shared/ui/icon';
import { PageLayout } from '@/shared/ui/page-layout';
import { Text } from '@/shared/ui/text';

import type { ChatRoom } from '@/_pages/chatting/model/chat-room';

type ChatRoomLayoutProps = {
  children: ReactNode;
  room?: ChatRoom;
};

export function ChatRoomLayout({ children, room }: ChatRoomLayoutProps) {
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
