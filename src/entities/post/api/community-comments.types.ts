import type { ApiResponse } from '@/shared/api/types';

import type { PostAuthor } from '@/entities/post/model/post';

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
