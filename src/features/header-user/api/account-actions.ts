import { getAccessToken } from '@/entities/auth';
import { apiFetch } from '@/shared/api/client';

export async function logout(): Promise<void> {
  await apiFetch<void>('/auth/sessions', { method: 'DELETE', skipAuthRefresh: true });
}

export async function withdrawAccount(): Promise<void> {
  await apiFetch<void>('/users/me', {
    method: 'DELETE',
    token: await getAccessToken(),
  });
}
