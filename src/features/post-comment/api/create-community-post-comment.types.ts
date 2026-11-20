import type { ApiResponse } from '@/shared/api/types';

export type CreateCommunityPostCommentPayload = {
  content: string;
};

export type CreatedCommunityPostComment = {
  id: number;
  nickname: string;
  content: string;
  created_at: string;
  comment_count: number;
};

export type CreateCommunityPostCommentResponse = ApiResponse<CreatedCommunityPostComment>;
