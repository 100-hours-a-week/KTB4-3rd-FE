import type { ApiResponse } from '@/shared/api/types';

export type ChatRoomDetailData = {
  id: number;
  companion_id: number;
  kind: 'GENERAL' | 'TAXI_POT';
  title: string;
  host_id: number;
  origin_name: string | null;
  dest_name: string | null;
  departure_at: string | null;
  current_count: number;
  capacity: number;
  companion_status: string;
  closed_at: string | null;
  last_read_message_id: number | null;
};

export type ChatRoomDetailResponse = ApiResponse<ChatRoomDetailData>;

export type ChatRoomMessageSender = {
  id: number;
  nickname: string;
  profile_image_url: string | null;
};

export type ChatRoomMessageJoiner = {
  id: number;
  name: string;
};

export type ChatRoomMessageLeaver = {
  id: number;
  name: string;
};

export type ChatRoomMessageData = {
  id: number;
  type:
    | 'TEXT'
    | 'SYSTEM_JOIN'
    | 'SYSTEM_LEAVE'
    | 'SYSTEM_RIDE_START_REQUESTED'
    | 'SYSTEM_RIDE_ENDED';
  content?: string | null;
  sender?: ChatRoomMessageSender;
  joiner?: ChatRoomMessageJoiner;
  leaver?: ChatRoomMessageLeaver;
  created_at: string;
};

export type ChatRoomMessagesData = {
  items: ChatRoomMessageData[];
  next_cursor: string | null;
};

export type ChatRoomMessagesResponse = ApiResponse<ChatRoomMessagesData>;
