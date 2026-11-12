import type { ApiResponse } from '@/shared/api/types';
import type { ChatSettlementSnapshot } from '@/entities/chat';

export type ChatRoomDetailData = {
  id: number;
  companion_id: number;
  kind: 'GENERAL' | 'TAXI_POT' | 'CARPOOL';
  title: string;
  host_id: number;
  origin_name: string | null;
  dest_name: string | null;
  departure_at: string | null;
  current_count: number;
  capacity: number;
  companion_status: 'RECRUITING' | 'IN_PROGRESS' | 'COMPLETED';
  rated?: boolean;
  closed_at: string | null;
  last_read_message_id: number | null;
  participants?: readonly ChatRoomParticipantData[];
};

export type ChatRoomParticipantData = {
  id: number;
  nickname: string;
};

export type ChatRoomDetailResponse = ApiResponse<ChatRoomDetailData>;

export type ChatRoomMessageSender = {
  id: number;
  nickname?: string;
  name?: string;
  profile_image_url?: string | null;
};

export type ChatRoomMessageJoiner = {
  id: number;
  name: string;
};

export type ChatRoomMessageLeaver = {
  id: number;
  name: string;
};

type ChatRoomMessageDataBase = {
  id: number;
  content?: string | null;
  sender?: ChatRoomMessageSender;
  joiner?: ChatRoomMessageJoiner;
  leaver?: ChatRoomMessageLeaver;
  created_at: string;
};

export type ChatRoomMessageData =
  | (ChatRoomMessageDataBase & {
      type:
        | 'TEXT'
        | 'SYSTEM_JOIN'
        | 'SYSTEM_LEAVE'
        | 'SYSTEM_RIDE_START_REQUESTED'
        | 'SYSTEM_RIDE_STARTED'
        | 'SYSTEM_RIDE_END_REQUESTED'
        | 'SYSTEM_RIDE_ENDED';
      settlement?: never;
    })
  | (ChatRoomMessageDataBase & {
      type:
        | 'SYSTEM_METER_REQUESTED'
        | 'SYSTEM_SETTLEMENT_COMPLETED'
        | 'SYSTEM_SETTLEMENT_CONFIRM_REQUESTED'
        | 'SYSTEM_TRANSFER_UNVERIFIED';
      content: string;
      sender?: never;
      settlement?: never;
    })
  | (ChatRoomMessageDataBase & {
      type: 'SYSTEM_TRANSFER_DONE';
      content: string;
      user_id: number;
      sender?: never;
      settlement?: never;
    })
  | (ChatRoomMessageDataBase & {
      type: 'SYSTEM_TRANSFER_REQUESTED';
      content: string;
      settlement: ChatSettlementSnapshot;
      sender?: never;
    });

export type ChatRoomMessagesData = {
  items: ChatRoomMessageData[];
  before_cursor: string | null;
  after_cursor: string | null;
};

export type ChatRoomMessagesResponse = ApiResponse<ChatRoomMessagesData>;

export type ChatRoomReadMarkerData = {
  last_read_message_id: number | string;
  has_unread: boolean;
};

export type ChatRoomReadMarkerResponse = ApiResponse<ChatRoomReadMarkerData>;

export type ChatRoomMessagesDirection = 'before' | 'after';

export type ChatRoomMessagesRequest = {
  direction?: ChatRoomMessagesDirection;
  before?: string;
  after?: string;
};

export type ChatRoomMessagesPageParam = ChatRoomMessagesRequest | undefined;
