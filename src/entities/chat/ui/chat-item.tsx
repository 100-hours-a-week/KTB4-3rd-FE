import Image from 'next/image';
import type { MouseEventHandler } from 'react';

import { cn } from '@/shared/lib/cn';
import { Divider } from '@/shared/ui/divider';
import { Text } from '@/shared/ui/text';

import type { ChatRoomListItem } from '@/entities/chat/model/chat';

const CHAT_AVATAR_PLACEHOLDER_SRC = '/avatars/chat-avatar-placeholder.svg';

export type ChatItemProps = {
  chatRoom: ChatRoomListItem;
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

export function ChatItem({ chatRoom, className, onClick }: ChatItemProps) {
  return (
    <li className={cn('relative h-[84px] w-full', className)}>
      <button
        aria-label={`${chatRoom.title}, ${chatRoom.current_count}명 참여`}
        className="group flex h-full w-full min-w-0 appearance-none items-start border-0 bg-transparent p-0 pt-[18px] text-left transition-colors hover:bg-[var(--color-bg-transparent-pressed)] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-stroke-focus-ring)] active:bg-[var(--color-bg-transparent-selected)]"
        data-chat-room-id={chatRoom.id}
        data-has-unread={chatRoom.has_unread}
        onClick={onClick}
        type="button"
      >
        <Image
          alt="방장 프로필 이미지"
          className="size-12 shrink-0 rounded-full object-cover"
          height={48}
          src={chatRoom.host.profile_image_url || CHAT_AVATAR_PLACEHOLDER_SRC}
          unoptimized
          width={48}
        />

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
        className="absolute bottom-0 left-0"
        color="neutral-subtle"
      />
    </li>
  );
}
