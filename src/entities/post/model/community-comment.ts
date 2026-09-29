import type { ApiResponse } from '@/shared/api/types';

import type { PostAuthor } from './post';

export type CommunityPostComment = {
  id: number;
  author: PostAuthor;
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

export type CreatedCommunityPostComment = {
  id: number;
  nickname: string;
  content: string;
  created_at: string;
  comment_count: number;
};

export type CreateCommunityPostCommentResponse = ApiResponse<CreatedCommunityPostComment>;
