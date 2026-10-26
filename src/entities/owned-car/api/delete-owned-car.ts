import { apiFetch } from '@/shared/api/client';

export function deleteOwnedCar(accessToken: string, carId: number): Promise<void> {
  return apiFetch<void>(`/users/me/cars/${carId}`, {
    method: 'DELETE',
    token: accessToken,
  });
}
