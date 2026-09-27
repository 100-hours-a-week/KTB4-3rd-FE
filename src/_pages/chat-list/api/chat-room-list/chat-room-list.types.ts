import type { ChatRoomKind, ChatRoomListResponse } from '@/entities/chat';

export type ChatRoomListQuery = {
  kind?: ChatRoomKind;
  cursor?: string;
};

export type { ChatRoomListResponse };
