import type { ChatListTabValue, ChatRoomListData } from '@/entities/chat';

export type ChatListPageState =
  | {
      status: 'success';
      data: ChatRoomListData;
    }
  | {
      status: 'error';
    };

export type ChatListPageStates = Record<ChatListTabValue, ChatListPageState>;

export const DEFAULT_CHAT_LIST_STATES: ChatListPageStates = {
  matching: {
    status: 'success',
    data: {
      items: [],
      next_cursor: null,
    },
  },
  community: {
    status: 'success',
    data: {
      items: [],
      next_cursor: null,
    },
  },
};
