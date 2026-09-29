import { apiFetch } from '@/shared/api/client';

import type { CommunityPostCommentsResponse } from '@/entities/post/model/community-comment';

export function getCommunityPostComments(
  postId: number,
  cursor?: string | null,
): Promise<CommunityPostCommentsResponse> {
  const searchParams = new URLSearchParams();

  if (cursor) {
    searchParams.set('cursor', cursor);
  }

  const query = searchParams.toString();
  const path = `/community-posts/${postId}/comments${query ? `?${query}` : ''}`;

  return apiFetch<CommunityPostCommentsResponse>(path);
}
