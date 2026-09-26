import { useQueries } from '@tanstack/react-query';

import { chatRoomQueries } from './chat-room.queries';

export function useChatRoomQueries(roomId: string) {
  const [detailQuery, messagesQuery] = useQueries({
    queries: [chatRoomQueries.detail(roomId), chatRoomQueries.messages(roomId)],
  });

  return { detailQuery, messagesQuery };
}
