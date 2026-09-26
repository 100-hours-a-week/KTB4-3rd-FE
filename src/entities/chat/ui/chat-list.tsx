import { cn } from '@/shared/lib/cn';

import type { ChatRoomListItem } from '@/entities/chat/model/chat';
import { ChatItem } from './chat-item';

export type ChatListProps = {
  className?: string;
  fullWidth?: boolean;
  items: readonly ChatRoomListItem[];
  onItemClick?: (chatRoom: ChatRoomListItem) => void;
};

export function ChatList({ className, fullWidth = false, items, onItemClick }: ChatListProps) {
  return (
    <ul
      aria-label="채팅방 목록"
      className={cn(
        'm-0 w-full list-none p-0',
        fullWidth && '-mx-5 !w-[calc(100%+2.5rem)]',
        className,
      )}
    >
      {items.map((chatRoom) => (
        <ChatItem
          chatRoom={chatRoom}
          fullWidth={fullWidth}
          key={chatRoom.id}
          onClick={onItemClick ? () => onItemClick(chatRoom) : undefined}
        />
      ))}
    </ul>
  );
}
