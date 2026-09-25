import { apiFetch } from '@/shared/api/client';

import type { CommunityPostDetailResponse } from './community-posts.types';

export function getCommunityPostDetail(postId: number): Promise<CommunityPostDetailResponse> {
  return apiFetch<CommunityPostDetailResponse>(`/community-posts/${postId}`);
}
