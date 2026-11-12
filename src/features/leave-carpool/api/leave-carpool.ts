import { getAccessToken } from '@/entities/auth';
import { apiFetch } from '@/shared/api/client';

export async function leaveCarpool(companionId: number): Promise<void> {
  const accessToken = await getAccessToken();

  await apiFetch<void>(`/carpools/${companionId}/participants/me`, {
    method: 'DELETE',
    token: accessToken,
  });
}
