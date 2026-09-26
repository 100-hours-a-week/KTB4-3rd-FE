import { apiFetch } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/api/types';

export type JoinCompanionData = {
  chat_room_id: number;
};

export type JoinCompanionResponse = ApiResponse<JoinCompanionData>;

export function joinCompanionPost(
  accessToken: string,
  companionId: number,
): Promise<JoinCompanionResponse> {
  return apiFetch<JoinCompanionResponse>(`/companion-posts/${companionId}/participants`, {
    method: 'POST',
    token: accessToken,
    headers: { Accept: 'application/json' },
  });
}
