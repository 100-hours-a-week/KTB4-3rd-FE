import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';

import { getChatRoomDetail, getChatRoomMessages } from './get-chat-room';
import type { ChatRoomMessagesPageParam, ChatRoomMessagesResponse } from './chat-room.types';

export const chatRoomQueries = {
  all: () => ['chat-rooms'] as const,
  detail: (roomId: string) =>
    queryOptions({
      queryKey: [...chatRoomQueries.all(), 'detail', roomId] as const,
      queryFn: () => getChatRoomDetail(roomId),
    }),
  messages: (
    roomId: string,
    getNextPageParam?: (lastPage: ChatRoomMessagesResponse) => ChatRoomMessagesPageParam,
  ) =>
    infiniteQueryOptions({
      queryKey: [...chatRoomQueries.all(), 'messages', roomId] as const,
      initialPageParam: undefined as ChatRoomMessagesPageParam,
      queryFn: ({ pageParam }) => getChatRoomMessages(roomId, pageParam),
      // before/after 페이지는 스크롤 방향에 따라 fetchNextPage의 pageParam을 직접 전달한다.
      // 자동 페이지 계산을 사용하면 두 방향의 커서가 섞이므로 여기서는 비활성화한다.
      getNextPageParam: getNextPageParam ?? (() => undefined),
    }),
};
