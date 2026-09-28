'use client';

import { useMutation } from '@tanstack/react-query';

import { markChatRoomAsRead } from './get-chat-room';
import type { ChatRoomReadMarkerResponse } from './chat-room.types';

export type MarkChatRoomAsReadVariables = {
  lastReadMessageId: string;
  roomId: string;
};

export function useChatRoomReadMarkerMutation() {
  return useMutation<ChatRoomReadMarkerResponse, Error, MarkChatRoomAsReadVariables>({
    mutationFn: ({ lastReadMessageId, roomId }) => markChatRoomAsRead(roomId, lastReadMessageId),
  });
}
