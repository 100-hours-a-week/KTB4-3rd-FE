import { apiFetch } from '@/shared/api/client';

import type { CompanionPostDetailResponse } from './companion-posts.types';

export function getCompanionPostDetail(companionId: number): Promise<CompanionPostDetailResponse> {
  return apiFetch<CompanionPostDetailResponse>(`/companion-posts/${companionId}`);
}
