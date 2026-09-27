import { queryOptions } from '@tanstack/react-query';

import { getChatRoomList } from './get-chat-room-list';
import type { ChatRoomListQuery } from './chat-room-list.types';

export const chatRoomListQueries = {
  all: () => ['chat-rooms'] as const,
  list: ({ kind, cursor }: ChatRoomListQuery) =>
    queryOptions({
      queryKey: [...chatRoomListQueries.all(), 'list', kind, cursor] as const,
      queryFn: () => getChatRoomList({ kind, cursor }),
    }),
};
