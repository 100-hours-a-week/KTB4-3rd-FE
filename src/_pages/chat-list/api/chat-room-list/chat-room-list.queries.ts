import { infiniteQueryOptions } from '@tanstack/react-query';

import { getChatRoomList } from './get-chat-room-list';
import type { ChatRoomListQuery } from './chat-room-list.types';

export const chatRoomListQueries = {
  all: () => ['chat-rooms'] as const,
  list: ({ kind }: Pick<ChatRoomListQuery, 'kind'>) =>
    infiniteQueryOptions({
      queryKey: [...chatRoomListQueries.all(), 'list', kind] as const,
      initialPageParam: undefined as string | undefined,
      queryFn: ({ pageParam }) => getChatRoomList({ kind, cursor: pageParam }),
      getNextPageParam: (lastPage) => lastPage.data.next_cursor ?? undefined,
    }),
};
