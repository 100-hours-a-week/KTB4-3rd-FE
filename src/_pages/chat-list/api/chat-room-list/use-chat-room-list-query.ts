import { useInfiniteQuery } from '@tanstack/react-query';

import type { ChatListTabValue } from '@/entities/chat';

import { chatRoomListQueries } from './chat-room-list.queries';
import type { ChatRoomListQuery } from './chat-room-list.types';

const CHAT_ROOM_KIND_BY_TAB: Record<ChatListTabValue, NonNullable<ChatRoomListQuery['kind']>> = {
  taxiPot: 'TAXI_POT',
  carpool: 'CARPOOL',
  community: 'COMPANION',
};

export function useChatRoomListQuery(tab: ChatListTabValue) {
  const kind = CHAT_ROOM_KIND_BY_TAB[tab];

  return useInfiniteQuery(chatRoomListQueries.list({ kind }));
}
