import type { ApiResponse } from '@/shared/api/types';

export type ChatRoomKind = 'TAXI_POT';

export type ChatRoomHost = {
  profile_image_url: string | null;
};

export type ChatRoomListItem = {
  id: number;
  companion_id: number;
  kind: ChatRoomKind;
  title: string;
  host: ChatRoomHost;
  current_count: number;
  capacity: number;
  has_unread: boolean;
};

export type ChatRoomListData = {
  items: ChatRoomListItem[];
  next_cursor: string | null;
};

export type ChatRoomListResponse = ApiResponse<ChatRoomListData>;
