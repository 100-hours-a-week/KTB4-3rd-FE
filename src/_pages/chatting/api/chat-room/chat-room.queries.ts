import { queryOptions } from '@tanstack/react-query';

import { getChatRoomDetail, getChatRoomMessages } from './get-chat-room';

export const chatRoomQueries = {
  all: () => ['chat-rooms'] as const,
  detail: (roomId: string) =>
    queryOptions({
      queryKey: [...chatRoomQueries.all(), 'detail', roomId] as const,
      queryFn: () => getChatRoomDetail(roomId),
    }),
  messages: (roomId: string) =>
    queryOptions({
      queryKey: [...chatRoomQueries.all(), 'messages', roomId] as const,
      queryFn: () => getChatRoomMessages(roomId),
    }),
};
