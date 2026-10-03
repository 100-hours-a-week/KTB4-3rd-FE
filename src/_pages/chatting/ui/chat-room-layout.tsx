import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';
import { BackButton } from '@/shared/ui/back-button';
import { Header } from '@/shared/ui/header';
import { Icon } from '@/shared/ui/icon';
import { PageLayout } from '@/shared/ui/page-layout';
import { Text } from '@/shared/ui/text';

import type { ChatRoom } from '@/_pages/chatting/model/chat-room';

type ChatRoomLayoutProps = {
  children: ReactNode;
  onBack?: () => void;
  onLeave?: () => void;
  room?: ChatRoom;
  showLeaveButton?: boolean;
};

export function ChatRoomLayout({
  children,
  onBack,
  onLeave,
  room,
  showLeaveButton = true,
}: ChatRoomLayoutProps) {
  return (
    <PageLayout
      className="relative h-dvh min-h-0 overflow-hidden"
      contentClassName="!overflow-hidden min-h-0 flex-1 gap-0 !px-0 !pt-0 !pb-[calc(98px+env(safe-area-inset-bottom,0px))]"
      header={
        <Header
          className="z-20"
          leftSlot={
            <BackButton
              href="/"
              onClick={
                onBack
                  ? (event) => {
                      event.preventDefault();
                      onBack();
                    }
                  : undefined
              }
            />
          }
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
              {showLeaveButton && onLeave ? (
                <button
                  aria-label="채팅방 나가기"
                  className="inline-flex size-11 items-center justify-center rounded-[var(--dimension-x2)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-stroke-focus-ring)]"
                  onClick={onLeave}
                  type="button"
                >
                  <Icon
                    aria-hidden="true"
                    color="var(--color-fg-critical)"
                    name="logOut"
                    size={24}
                  />
                </button>
              ) : null}
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
