import type { ApiResponse } from '@/shared/api/types';

export type CommunityPostDetailAuthor = {
  nickname: string;
};

export type CommunityPostDetailData = {
  id: number;
  title: string;
  content: string;
  author: CommunityPostDetailAuthor;
  comment_count: number;
  created_at: string;
};

export type CommunityPostDetailResponse = ApiResponse<CommunityPostDetailData>;
