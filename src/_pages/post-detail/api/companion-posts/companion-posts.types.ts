import type { CompanionTransport } from '@/entities/post';
import type { ApiResponse } from '@/shared/api/types';

export type CompanionPostDetailAuthor = {
  nickname: string;
};

export type CompanionPostParticipant = {
  nickname: string;
  profile_image_url: string | null;
};

export type CompanionPostDetailData = {
  id: number;
  title: string;
  content: string;
  transport_type: CompanionTransport;
  origin_name: string;
  dest_name: string;
  departure_at: string;
  is_expired: boolean;
  current_count: number;
  capacity: number;
  is_full: boolean;
  author: CompanionPostDetailAuthor;
  participants: CompanionPostParticipant[];
  chat_room_id: number | null;
  joined: boolean;
};

export type CompanionPostDetailResponse = ApiResponse<CompanionPostDetailData>;
