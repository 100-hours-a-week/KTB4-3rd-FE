import { getAccessToken } from '@/entities/auth';
import { apiFetch } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/api/types';

export type ChatRating = {
  target_user_id: number;
  score: number;
};

export type SubmitChatRatingsPayload = {
  ratings: readonly ChatRating[];
};

export type SubmitChatRatingsResponse = ApiResponse<null>;

export async function submitChatRatings(
  companionId: number,
  payload: SubmitChatRatingsPayload,
): Promise<SubmitChatRatingsResponse> {
  const accessToken = await getAccessToken();

  return apiFetch<SubmitChatRatingsResponse>(`/companions/${companionId}/ratings`, {
    method: 'POST',
    token: accessToken,
    body: JSON.stringify(payload),
  });
}
