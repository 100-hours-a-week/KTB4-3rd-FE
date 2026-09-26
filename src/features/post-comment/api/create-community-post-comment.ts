import { apiFetch } from '@/shared/api/client';

import type {
  CreateCommunityPostCommentPayload,
  CreateCommunityPostCommentResponse,
} from '@/entities/post';

export type {
  CreateCommunityPostCommentPayload,
  CreateCommunityPostCommentResponse,
} from '@/entities/post';

export function createCommunityPostComment(
  accessToken: string,
  postId: number,
  payload: CreateCommunityPostCommentPayload,
): Promise<CreateCommunityPostCommentResponse> {
  return apiFetch<CreateCommunityPostCommentResponse>(`/community-posts/${postId}/comments`, {
    method: 'POST',
    token: accessToken,
    body: JSON.stringify(payload),
  });
}
