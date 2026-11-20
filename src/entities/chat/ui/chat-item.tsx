import type { MouseEventHandler } from 'react';

import { cn } from '@/shared/lib/cn';
import { Divider } from '@/shared/ui/divider';
import { Text } from '@/shared/ui/text';

import type { ChatRoomListItem } from '@/entities/chat/model/chat';
import { ChatItemAvatar } from './chat-item-avatar';

export type ChatItemProps = {
  chatRoom: ChatRoomListItem;
  className?: string;
  fullWidth?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

export function ChatItem({ chatRoom, className, fullWidth = false, onClick }: ChatItemProps) {
  return (
    <li className={cn('relative h-[84px] w-full', className)}>
      <button
        aria-label={`${chatRoom.title}, ${chatRoom.current_count}명 참여`}
        className={cn(
          'group flex h-full w-full min-w-0 appearance-none items-start border-0 bg-transparent p-0 pt-[18px] text-left transition-colors hover:bg-[var(--color-bg-transparent-pressed)] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-stroke-focus-ring)] active:bg-[var(--color-bg-transparent-selected)]',
          fullWidth && 'px-5',
        )}
        data-chat-room-id={chatRoom.id}
        data-has-unread={chatRoom.has_unread}
        onClick={onClick}
        type="button"
      >
        <ChatItemAvatar src={chatRoom.host.profile_image_url} />

        <span className="flex min-w-0 flex-1 flex-col gap-1 pr-[34px] pl-4">
          <Text
            as="span"
            className="block truncate"
            color="fg.neutral"
            variant="t5Regular"
            whiteSpace="nowrap"
          >
            {chatRoom.title}
          </Text>
          <Text as="span" color="fg.neutralMuted" variant="t4Regular" whiteSpace="nowrap">
            {chatRoom.current_count}명 참여
          </Text>
        </span>
      </button>

      <Divider
        aria-hidden="true"
        as="div"
        className={cn('absolute bottom-0', fullWidth ? 'left-5 !w-[calc(100%-2.5rem)]' : 'left-0')}
        color="neutral-subtle"
      />
    </li>
  );
}
