import { apiFetch } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/api/types';
import type {
  CompanionPostCreatePayload,
  CommunityPostCreatePayload,
} from '@/features/post-create/model/post-create.types';

export type PostCreateData = {
  id: number;
};

export type PostCreateResponse = ApiResponse<PostCreateData>;

export function createCompanionPost(
  accessToken: string,
  payload: CompanionPostCreatePayload,
): Promise<PostCreateResponse> {
  return apiFetch<PostCreateResponse>('/companion-posts', {
    method: 'POST',
    token: accessToken,
    body: JSON.stringify(payload),
  });
}

export function createCommunityPost(
  accessToken: string,
  payload: CommunityPostCreatePayload,
): Promise<PostCreateResponse> {
  return apiFetch<PostCreateResponse>('/community-posts', {
    method: 'POST',
    token: accessToken,
    body: JSON.stringify(payload),
  });
}
