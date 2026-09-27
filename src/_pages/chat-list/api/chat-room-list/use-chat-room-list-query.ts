import { useQuery } from '@tanstack/react-query';

import type { ChatListTabValue } from '@/entities/chat';

import { chatRoomListQueries } from './chat-room-list.queries';
import type { ChatRoomListQuery } from './chat-room-list.types';

const CHAT_ROOM_KIND_BY_TAB: Record<ChatListTabValue, NonNullable<ChatRoomListQuery['kind']>> = {
  matching: 'TAXI_POT',
  community: 'COMPANION',
};

export function useChatRoomListQuery(tab: ChatListTabValue, cursor?: string) {
  const kind = CHAT_ROOM_KIND_BY_TAB[tab];

  return useQuery(chatRoomListQueries.list({ kind, cursor }));
}
