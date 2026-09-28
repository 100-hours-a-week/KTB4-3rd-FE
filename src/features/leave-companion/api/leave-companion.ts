import { getAccessToken } from '@/entities/auth';
import { apiFetch } from '@/shared/api/client';

export async function leaveCompanion(companionId: number): Promise<void> {
  const accessToken = await getAccessToken();

  await apiFetch<void>(`/companion-posts/${companionId}/participants/me`, {
    method: 'DELETE',
    token: accessToken,
  });
}
