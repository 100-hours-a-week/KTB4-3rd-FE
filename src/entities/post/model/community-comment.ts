import type { ApiResponse } from '@/shared/api/types';

export type CommunityPostCommentAuthor = {
  nickname: string;
};

export type CommunityPostComment = {
  id: number;
  author: CommunityPostCommentAuthor;
  content: string;
  created_at: string;
};

export type CommunityPostCommentsData = {
  items: CommunityPostComment[];
  next_cursor: string | null;
};

export type CommunityPostCommentsResponse = ApiResponse<CommunityPostCommentsData>;

export type CreateCommunityPostCommentPayload = {
  content: string;
};

export type CreatedCommunityPostComment = CommunityPostComment & {
  comment_count: number;
};

export type CreateCommunityPostCommentResponse = ApiResponse<CreatedCommunityPostComment>;
