import type { ApiResponse } from '@/shared/api/types';

import type { CompanionTransport } from '@/entities/post/model/post';

export type PostDetailAuthor = {
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
  author: PostDetailAuthor;
  participants: CompanionPostParticipant[] | null;
  chat_room_id: number | null;
  joined: boolean;
};

export type CompanionPostDetailResponse = ApiResponse<CompanionPostDetailData>;

export type CommunityPostDetailData = {
  id: number;
  title: string;
  content: string;
  author: PostDetailAuthor;
  comment_count: number;
  created_at: string;
};

export type CommunityPostDetailResponse = ApiResponse<CommunityPostDetailData>;
