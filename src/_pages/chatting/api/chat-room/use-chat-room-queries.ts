import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { chatRoomQueries } from './chat-room.queries';

export function useChatRoomQueries(roomId: string) {
  const detailQuery = useQuery(chatRoomQueries.detail(roomId));
  const messagesQuery = useInfiniteQuery(chatRoomQueries.messages(roomId));

  return { detailQuery, messagesQuery };
}
